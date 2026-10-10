// Imagens no ritmo da fala: a pessoa fala "mel" e o pote de mel aparece.
//
// A IA do aluno lista os momentos de imagem em work/imagens.json (veja IMAGENS.md). Este script
// acha de 3 a 6 candidatas por pedido, normaliza, monta a folha de conferência numerada
// (work/imagens.jpg) e, depois da escolha, grava a imagem em public/img/<id>.<ext>, o foco e o
// crédito no plano.
//
// Uso (de dentro da pasta do projeto):
//   node scripts/imagens.mjs                         busca o que falta e monta a folha
//   node scripts/imagens.mjs --escolher mel 2 --foco 0.5,0.35
//   node scripts/imagens.mjs --escolher mel 0        sem imagem: o modelo desenha o cartão
//   node scripts/imagens.mjs --escolher mel --foco 0.4,0.3   só muda o foco
//   node scripts/imagens.mjs --refazer mel [--busca "honey pot"]   busca de novo ("todos" = tudo)
//   node scripts/imagens.mjs --folha                 só remonta a folha (mostra o que foi escolhido)
//   node scripts/imagens.mjs --limpar                apaga as candidatas (depois de escolher tudo)
// Opções: --offline (não usa a internet), --lado 2400 (lado maior das imagens; padrão 1600).
//
// Fontes, nesta ordem: a pasta imagens/ do aluno → Openverse (CC0/domínio público, depois CC BY)
// → Wikimedia Commons → Pexels (só com PEXELS_API_KEY) → objetos 3D do Fluent Emoji (MIT, fundo
// transparente; só para tipo "objeto") → sem imagem (cartão tipográfico). Nada é pago.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { argumentos, exigirProjeto, ffmpeg, ffprobe, gravarJson, lerJson, lerQuadros } from "./comum.mjs";

exigirProjeto();
const { opcoes, posicionais } = argumentos();

const ARQUIVO_PEDIDOS = "work/imagens.json";
const PASTA_ALUNO = "imagens";
const PASTA_CANDIDATAS = "public/img/candidatas";
const LADO = Math.max(400, Number(opcoes.lado) || 1600);
const MAX_CANDIDATAS = 6;
const POR_FOLHA = 4;
const CACHE = path.join(os.homedir(), ".cache", "modelos-edicao", "imagens");
// as APIs gratuitas pedem que o programa se identifique
const UA = "ModelosEdicao/1.0 (pack de modelos de edicao; https://cofre-da-edicao-ia.vercel.app)";
// alguns bancos de imagem só entregam o arquivo para um navegador
const UA_NAVEGADOR = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const LIMITES = {
  Openverse: "20 buscas por minuto e 200 por dia sem conta",
  "GitHub (Fluent Emoji)": "60 consultas por hora sem conta",
  Pexels: "200 buscas por hora",
};

// ---------- utilidades ----------

const sha1 = (s) => createHash("sha1").update(String(s)).digest("hex");
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const normalizar = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const singular = (w) => {
  if (w.length <= 3 || /(ss|us|is)$/.test(w)) return w;
  if (w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (/(ch|sh|x|z)es$/.test(w)) return w.slice(0, -2);
  return w.endsWith("s") ? w.slice(0, -1) : w;
};
const termos = (s) => normalizar(s).split(" ").filter(Boolean).map(singular);
const segundos = (t) => (typeof t === "number" ? `${t.toFixed(1).replace(".", ",")} s` : "");
const virgula = (n) => n.toFixed(2).replace(".", ",");
const semHtml = (s) =>
  String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const origem = (url) => {
  try {
    return new URL(url).origin + "/";
  } catch {
    return undefined;
  }
};
const idade = (arq) => (Date.now() - statSync(arq).mtimeMs) / 864e5;
const garantirPasta = (p) => mkdirSync(p, { recursive: true });

const avisados = new Set();
const avisar = (chave, texto) => {
  if (avisados.has(chave)) return;
  avisados.add(chave);
  console.log(`  ! ${texto}`);
};

// ---------- rede (com cache e sem quebrar quando cai) ----------

let semInternet = !!opcoes.offline;
const fontesFora = new Set();
const chamadas = new Map();
// Openverse sem conta: 20 por minuto. Segura o ritmo antes de estourar.
const darVez = async (fonte, maximo, janelaMs) => {
  const lista = chamadas.get(fonte) ?? [];
  chamadas.set(fonte, lista);
  while (lista.length && Date.now() - lista[0] > janelaMs) lista.shift();
  if (lista.length >= maximo) {
    const ms = janelaMs - (Date.now() - lista[0]) + 300;
    console.log(`  … ${fonte} pede calma (${LIMITES[fonte] ?? "limite por minuto"}): espero ${Math.ceil(ms / 1000)} s`);
    await esperar(ms);
  }
  lista.push(Date.now());
};

const falhaDeRede = (e) => ["ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ENETUNREACH", "EHOSTUNREACH", "ECONNRESET"].includes(e?.cause?.code);

const perderRede = (fonte, e) => {
  if (falhaDeRede(e) && e?.cause?.code !== "ECONNRESET") {
    semInternet = true;
    avisar("rede", "Sem internet (ou a rede caiu): sigo com a pasta imagens/, o cache e os cartões.");
  } else {
    fontesFora.add(fonte);
    avisar(`fora-${fonte}`, `${fonte} não respondeu (${e?.name === "TimeoutError" ? "demorou demais" : (e?.cause?.code ?? e?.message ?? "erro")}). Sigo sem ela.`);
  }
};

// Busca JSON (ou texto) com cache em ~/.cache/modelos-edicao/imagens/buscas. Sem rede, usa o que tiver.
const buscar = async (fonte, url, { headers = {}, dias = 14, texto = false, ritmo = null } = {}) => {
  const arq = path.join(CACHE, "buscas", `${sha1(url)}.${texto ? "txt" : "json"}`);
  const ler = () => (texto ? readFileSync(arq, "utf8") : lerJson(arq));
  const temCache = existsSync(arq);
  if (temCache && idade(arq) < dias) return ler();
  if (semInternet || fontesFora.has(fonte)) return temCache ? ler() : null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    if (ritmo) await darVez(fonte, ritmo.maximo, ritmo.janelaMs);
    let r;
    try {
      r = await fetch(url, { headers: { "User-Agent": UA, Accept: texto ? "text/plain,*/*" : "application/json", ...headers }, signal: AbortSignal.timeout(25000) });
    } catch (e) {
      perderRede(fonte, e);
      return temCache ? ler() : null;
    }
    if (r.status === 429) {
      const espera = Number(r.headers.get("retry-after")) || 0;
      if (tentativa === 0 && espera > 0 && espera <= 65) {
        console.log(`  … ${fonte}: limite por minuto, espero ${espera} s`);
        await esperar(espera * 1000);
        continue;
      }
      fontesFora.add(fonte);
      avisar(`limite-${fonte}`, `${fonte}: limite de uso atingido (${LIMITES[fonte] ?? "tente mais tarde"}). Sigo com as outras fontes e o cache.`);
      return temCache ? ler() : null;
    }
    if (!r.ok) {
      avisar(`erro-${fonte}-${r.status}`, `${fonte} respondeu ${r.status}. Sigo sem ela.`);
      return temCache ? ler() : null;
    }
    const corpo = await r.text();
    let dados = corpo;
    if (!texto) {
      try {
        dados = JSON.parse(corpo);
      } catch {
        avisar(`json-${fonte}`, `${fonte} devolveu uma resposta estranha. Sigo sem ela.`);
        return temCache ? ler() : null;
      }
    }
    garantirPasta(path.dirname(arq));
    writeFileSync(arq, corpo);
    return dados;
  }
  return temCache ? ler() : null;
};

// o tipo do arquivo pelos primeiros bytes (a extensão da URL mente muito)
const tipoDoArquivo = (buf) => {
  if (buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf[0] === 0x89 && buf.toString("latin1", 1, 4) === "PNG") return "png";
  if (buf.toString("latin1", 0, 4) === "GIF8") return "gif";
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return "webp";
  if (buf.toString("latin1", 4, 8) === "ftyp") {
    const marca = buf.toString("latin1", 8, 12);
    if (/^avi[fs]$/.test(marca)) return "avif";
    if (/^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(marca)) return "heic";
  }
  const inicio = buf.toString("utf8", 0, Math.min(buf.length, 1024)).trimStart();
  if (/^(<\?xml|<!--|<!DOCTYPE svg|<svg)/i.test(inicio) && /<svg[\s>]/i.test(buf.toString("utf8", 0, Math.min(buf.length, 4096)))) return "svg";
  return null;
};

const EXTENSOES = ["jpg", "png", "gif", "webp", "avif", "svg", "heic"];

// Baixa uma imagem para o cache (~/.cache/modelos-edicao/imagens/arquivos). Devolve o caminho ou null.
const baixar = async (url, referer) => {
  const base = path.join(CACHE, "arquivos", sha1(url));
  const pronto = EXTENSOES.map((e) => `${base}.${e}`).find((a) => existsSync(a));
  if (pronto) return pronto;
  if (semInternet) return null;
  try {
    const host = new URL(url).hostname;
    const r = await fetch(url, {
      headers: {
        "User-Agent": /wikimedia|wikipedia|openverse|github/.test(host) ? UA : UA_NAVEGADOR,
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
        ...(referer ? { Referer: referer } : {}),
      },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 40e6) return null;
    const ext = tipoDoArquivo(buf);
    if (!ext) return null;
    garantirPasta(path.dirname(base));
    writeFileSync(`${base}.${ext}`, buf);
    return `${base}.${ext}`;
  } catch (e) {
    if (falhaDeRede(e) && e?.cause?.code !== "ECONNRESET") perderRede("download", e);
    return null;
  }
};

// ---------- normalização (ffmpeg do Remotion; o navegador para WebP, AVIF e SVG) ----------

const PASTA_NORMALIZADAS = path.join(CACHE, "normalizadas");

const medir = (arq) => {
  const [w, h] = ffprobe(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", arq])
    .trim()
    .split(",")
    .map(Number);
  return { largura: w, altura: h };
};

// alguma parte transparente de verdade? (um PNG pode ter canal alfa todo opaco)
const temTransparencia = async (arq) => {
  const L = 96;
  let menor = 255;
  try {
    await lerQuadros(["-i", arq, "-frames:v", "1", "-vf", `scale=${L}:${L},format=rgba`, "-pix_fmt", "rgba"], L * L * 4, (q) => {
      for (let i = 3; i < q.length; i += 4) if (q[i] < menor) menor = q[i];
    });
  } catch {
    return false;
  }
  return menor < 250;
};

// Impressão digital da imagem (dHash 8×8): a mesma foto em dois bancos dá quase o mesmo número.
const impressao = async (arq) => {
  let bits = "";
  try {
    await lerQuadros(["-i", arq, "-frames:v", "1", "-vf", "scale=9:8,format=gray", "-pix_fmt", "gray"], 72, (q) => {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += q[y * 9 + x] > q[y * 9 + x + 1] ? "1" : "0";
    });
  } catch {
    return null;
  }
  return bits.length === 64 ? bits : null;
};
const parecidas = (a, b) => {
  if (!a || !b) return false;
  let d = 0;
  for (let i = 0; i < 64; i++) if (a[i] !== b[i]) d++;
  return d <= 8;
};

// JPG para foto, PNG quando há transparência; lado maior até LADO (nunca aumenta).
const normalizarComFfmpeg = async (entrada, chave) => {
  const ext = path.extname(entrada).slice(1).toLowerCase();
  const transparente = ext === "png" || ext === "gif" ? await temTransparencia(entrada) : false;
  const saida = path.join(PASTA_NORMALIZADAS, `${chave}-${LADO}.${transparente ? "png" : "jpg"}`);
  garantirPasta(PASTA_NORMALIZADAS);
  const escala = `scale='min(${LADO},iw)':'min(${LADO},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos`;
  const r = ffmpeg(
    ["-y", "-i", entrada, "-frames:v", "1", "-vf", transparente ? `${escala},format=rgba` : `${escala},format=yuvj420p`, ...(transparente ? [] : ["-q:v", "2"]), "-update", "1", saida],
    { tolerarErro: true },
  );
  if (!r.ok || !existsSync(saida)) return null;
  const meta = { arquivo: saida, ...medir(saida), transparente };
  writeFileSync(path.join(PASTA_NORMALIZADAS, `${chave}-${LADO}.json`), JSON.stringify(meta));
  return meta;
};

// Devolve { arquivo, largura, altura, transparente }, { pendente } (precisa do navegador) ou { erro }.
const normalizarArquivo = async (arq, chave) => {
  const metaArq = path.join(PASTA_NORMALIZADAS, `${chave}-${LADO}.json`);
  if (existsSync(metaArq)) {
    const meta = lerJson(metaArq);
    if (existsSync(meta.arquivo)) return meta;
  }
  const ext = path.extname(arq).slice(1).toLowerCase();
  if (["webp", "avif", "svg"].includes(ext)) return { pendente: true, origem: arq, ext, chave };
  if (ext === "heic") {
    // foto de iPhone: o ffmpeg do Remotion não abre; no Mac, o sips converte
    if (process.platform !== "darwin") return { erro: "HEIC (foto de iPhone): exporte como JPG" };
    garantirPasta(PASTA_NORMALIZADAS);
    const jpg = path.join(PASTA_NORMALIZADAS, `${chave}-heic.jpg`);
    const r = spawnSync("sips", ["-s", "format", "jpeg", arq, "--out", jpg], { encoding: "utf8" });
    if (r.status !== 0 || !existsSync(jpg)) return { erro: "HEIC não abriu: exporte como JPG" };
    return (await normalizarComFfmpeg(jpg, chave)) ?? { erro: "não consegui ler a imagem" };
  }
  return (await normalizarComFfmpeg(arq, chave)) ?? { erro: "não consegui ler a imagem" };
};

// Empacota src/motor/FolhaImagens.tsx (a folha e o conversor) uma vez por rodada.
let pacote = null;
const navegador = async () => {
  if (pacote) return pacote;
  const { bundle } = await import("@remotion/bundler");
  const { openBrowser, renderStill, selectComposition } = await import("@remotion/renderer");
  const entrada = path.resolve("src/motor/FolhaImagens.tsx");
  if (!existsSync(entrada)) throw new Error("Falta src/motor/FolhaImagens.tsx (parte do motor). Rode o montar.py do pack.");
  // pasta pública vazia: os arquivos entram depois, só os que a folha usa
  const publica = path.resolve("work/.imagens-publico");
  rmSync(publica, { recursive: true, force: true });
  garantirPasta(publica);
  const serveUrl = await bundle({ entryPoint: entrada, publicDir: publica });
  rmSync(publica, { recursive: true, force: true });
  const browser = await openBrowser("chrome", { logLevel: "error" });
  const still = async (id, inputProps, output, formato) => {
    const composition = await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, logLevel: "error" });
    await renderStill({
      composition,
      serveUrl,
      output,
      inputProps,
      puppeteerInstance: browser,
      imageFormat: formato,
      ...(formato === "jpeg" ? { jpegQuality: 88 } : {}),
      logLevel: "error",
    });
  };
  const publico = (relativo, de) => {
    const alvo = path.join(serveUrl, "public", relativo);
    garantirPasta(path.dirname(alvo));
    copyFileSync(de, alvo);
  };
  const fechar = async () => {
    await browser.close({ silent: true }).catch(() => {});
    rmSync(serveUrl, { recursive: true, force: true });
  };
  pacote = { still, publico, fechar };
  return pacote;
};

const converterNoNavegador = async (pendentes) => {
  if (!pendentes.length) return;
  console.log(`\nConvertendo ${pendentes.length} imagem(ns) WebP/AVIF/SVG no navegador…`);
  const nav = await navegador();
  for (const pd of pendentes) {
    try {
      const rel = `_converter/${pd.chave}.${pd.ext}`;
      nav.publico(rel, pd.origem);
      garantirPasta(PASTA_NORMALIZADAS);
      const png = path.join(PASTA_NORMALIZADAS, `${pd.chave}-navegador.png`);
      await nav.still("Conversor", { src: rel, lado: LADO, vetor: pd.ext === "svg" }, png, "png");
      pd.resultado = await normalizarComFfmpeg(png, pd.chave);
      rmSync(png, { force: true });
    } catch (e) {
      pd.resultado = null;
      console.log(`  ! não consegui converter um ${pd.ext.toUpperCase()}: ${String(e.message ?? e).split("\n")[0]}`);
    }
  }
};

// ---------- regras de conteúdo ----------

// Marcas conhecidas (palavras que não são também coisas comuns). O Wikidata pega o resto.
const MARCAS = new Set(
  (
    "iphone ipad macbook airpods imac apple watch samsung galaxy s nike adidas coca cola cocacola pepsi mcdonalds mcdonald burger king starbucks " +
    "google youtube instagram facebook whatsapp tiktok netflix spotify chatgpt openai microsoft playstation xbox nintendo disney marvel lego " +
    "ferrari lamborghini porsche bmw mercedes benz volkswagen rolex gucci louis vuitton chanel prada zara ikea nubank itau bradesco santander " +
    "magalu mercado livre ifood uber airbnb heineken ambev brahma skol havaianas boticario philips walita mondial britania electrolux brastemp " +
    "gopro dji kindle red bull nutella oreo kitkat doritos shein shopee temu hotmart canva capcut"
  )
    .split(" ")
    .filter(Boolean),
);
const MARCAS_COMPOSTAS = ["coca cola", "burger king", "apple watch", "louis vuitton", "mercado livre", "red bull", "mercedes benz", "galaxy s"];
const AMBIGUAS = new Set(["s", "galaxy", "apple", "watch", "cola", "king", "benz", "red", "bull", "mercado", "livre", "louis", "mercedes"]);

const verificarTermo = async (pedido) => {
  const texto = normalizar(`${pedido.busca} ${pedido.palavra}`);
  const palavras = texto.split(" ");
  const composta = MARCAS_COMPOSTAS.find((m) => ` ${texto} `.includes(` ${m} `));
  const simples = palavras.find((w) => MARCAS.has(w) && !AMBIGUAS.has(w));
  if (composta || simples) return { tipo: "marca", motivo: `"${composta ?? simples}" é marca` };
  // só no termo de busca (em português, "logo" e "marca" aparecem na fala sem ser logo de marca)
  if (/\b(logo|logos|logotipo|logotype|logomarca|brand|trademark|marca)\b/.test(normalizar(pedido.busca))) return { tipo: "marca", motivo: "pede logo/marca" };
  if (/\b(celebrity|celebrities|famous|actor|actress|singer|rapper|footballer|politician|president|influencer|youtuber|famoso|famosa|celebridade)\b/.test(texto) || /\bportrait of\b/.test(texto))
    return { tipo: "pessoa", motivo: "pede pessoa famosa" };
  // o termo inteiro é um verbete do Wikidata? A descrição diz se é pessoa ou empresa.
  if (!pedido.busca) return null;
  const d = await buscar("Wikidata", `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&uselang=en&type=item&limit=1&search=${encodeURIComponent(pedido.busca)}`, { dias: 90 });
  const r = d?.search?.[0];
  if (!r || normalizar(r.match?.text ?? r.label) !== normalizar(pedido.busca)) return null;
  const desc = String(r.description ?? "").toLowerCase();
  if (
    /\((born )?\d{3,4}\)|\(\d{3,4}\s*[–-]\s*\d{3,4}\)|\(born\b/.test(desc) ||
    /\b(businessman|businesswoman|entrepreneur|footballer|soccer player|basketball player|actor|actress|singer|rapper|musician|politician|president|influencer|youtuber|athlete|television presenter|celebrity)\b/.test(desc)
  )
    return { tipo: "pessoa", motivo: `"${r.label}" é pessoa (${desc})` };
  if (/\b(company|corporation|brand|manufacturer|multinational|conglomerate|retailer|restaurant chain|marketed by|line of smartphones|line of products)\b/.test(desc))
    return { tipo: "marca", motivo: `"${r.label}" é marca/empresa (${desc})` };
  return null;
};

// ---------- fontes ----------

const rotuloLicenca = (lic, versao) => {
  if (lic === "cc0") return "CC0";
  if (lic === "pdm") return "Domínio público";
  return `CC ${lic.toUpperCase()}${versao ? ` ${versao}` : ""}`;
};
const nomeWikimedia = (url) => {
  const m = /upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?\w\/\w\w\/([^/?#]+)/.exec(String(url ?? ""));
  return m ? `wm:${decodeURIComponent(m[1]).toLowerCase()}` : null;
};
const PROVEDORES = { flickr: "Flickr", wikimedia: "Wikimedia", stocksnap: "StockSnap", rawpixel: "rawpixel", nappy: "nappy", met: "The Met", smithsonian: "Smithsonian" };

const openverse = async (busca, tipo) => {
  const params = new URLSearchParams({ q: busca, license: "cc0,pdm,by", page_size: "20", mature: "false" });
  if (tipo === "foto") params.set("category", "photograph");
  const d = await buscar("Openverse", `https://api.openverse.org/v1/images/?${params}`, { ritmo: { maximo: 18, janelaMs: 61000 } });
  return (d?.results ?? []).flatMap((r) => {
    if (!r.url || /\.(svg|tiff?)$/i.test(r.url)) return [];
    const lic = String(r.license ?? "").toLowerCase();
    let nivel = lic === "by" ? 2 : lic === "cc0" || lic === "pdm" ? 1 : 0;
    if (!nivel) return [];
    // observação de campo (iNaturalist: muito animal atropelado ou de longe) e modelo 3D para
    // impressora (Thingiverse) só entram depois de todo o resto
    if (/inaturalist|thingiverse|sketchfab/.test(`${r.source} ${r.provider}`)) nivel += 2;
    // original enorme da Wikimedia: pede a miniatura padrão de 1920 px
    let url = r.url;
    const m = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(\w)\/(\w\w)\/([^/?#]+)$/.exec(url);
    if (m && Number(r.width) > 1920) url = `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/1920px-${m[3]}`;
    const provedor = PROVEDORES[r.source] ?? PROVEDORES[r.provider] ?? r.source ?? r.provider ?? "?";
    return [
      {
        fonte: `Openverse/${provedor}`,
        url,
        referer: origem(r.foreign_landing_url),
        largura: r.width,
        altura: r.height,
        titulo: r.title || busca,
        autor: r.creator || "autor desconhecido",
        link: r.foreign_landing_url,
        licenca: rotuloLicenca(lic, r.license_version),
        credito: lic === "by",
        nivel,
        palavras: [r.title, ...(r.tags ?? []).map((t) => t.name)].join(" "),
        repetida: nomeWikimedia(r.url),
      },
    ];
  });
};

const commons = async (busca, extra = "") => {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${busca} filetype:bitmap${extra}`,
    gsrnamespace: "6",
    gsrlimit: "30",
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: String(LADO),
    iiurlheight: String(LADO),
    iiextmetadatafilter: "License|LicenseShortName|Artist|Restrictions",
  });
  const d = await buscar("Wikimedia Commons", `https://commons.wikimedia.org/w/api.php?${params}`);
  const paginas = [...(d?.query?.pages ?? [])].sort((a, b) => a.index - b.index);
  return paginas.flatMap((pg) => {
    const ii = pg.imageinfo?.[0];
    if (!ii || !/jpeg|png|gif|webp|tiff/.test(ii.mime ?? "")) return [];
    const m = ii.extmetadata ?? {};
    const v = (k) => String(m[k]?.value ?? "").trim();
    // pessoa identificável, marca registrada, brasão: fora
    if (/personality|trademark|insignia/i.test(v("Restrictions"))) return [];
    const lic = v("License").toLowerCase();
    const nivel = lic === "cc0" || lic.startsWith("pd") || /public domain/i.test(v("LicenseShortName")) ? 1 : /^cc-by-[\d.]+(-[a-z]+)?$/.test(lic) ? 2 : 0;
    if (!nivel) return [];
    const titulo = pg.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ");
    return [
      {
        fonte: "Wikimedia Commons",
        url: ii.thumburl || ii.url,
        largura: ii.width,
        altura: ii.height,
        titulo,
        autor: semHtml(v("Artist")) || "autor desconhecido",
        link: ii.descriptionurl,
        licenca: nivel === 1 ? (lic === "cc0" ? "CC0" : "Domínio público") : `CC BY ${lic.replace(/^cc-by-/, "").toUpperCase()}`,
        credito: nivel === 2,
        nivel,
        palavras: titulo,
        repetida: nomeWikimedia(ii.url),
      },
    ];
  });
};

const pexels = async (busca) => {
  const chave = process.env.PEXELS_API_KEY;
  if (!chave) return [];
  const d = await buscar("Pexels", `https://api.pexels.com/v1/search?query=${encodeURIComponent(busca)}&per_page=12`, { headers: { Authorization: chave } });
  return (d?.photos ?? []).flatMap((f) =>
    f.src?.large2x || f.src?.original
      ? [
          {
            fonte: "Pexels",
            url: f.src.large2x ?? f.src.original,
            largura: f.width,
            altura: f.height,
            titulo: f.alt || busca,
            autor: f.photographer || "Pexels",
            link: f.url,
            licenca: "Licença Pexels",
            credito: false,
            nivel: 1,
            palavras: `${f.alt ?? ""} ${busca}`,
          },
        ]
      : [],
  );
};

// (Demandou, 09/10) Pixabay: licença de conteúdo do Pixabay, uso comercial livre e sem crédito.
const pixabay = async (busca) => {
  const chave = process.env.PIXABAY_API_KEY;
  if (!chave) return [];
  const d = await buscar("Pixabay", `https://pixabay.com/api/?key=${encodeURIComponent(chave)}&q=${encodeURIComponent(busca)}&image_type=photo&safesearch=true&per_page=12`);
  return (d?.hits ?? []).flatMap((f) => {
    if (!f.largeImageURL || !f.imageWidth || !f.imageHeight) return [];
    const escala = Math.min(1, 1280 / Math.max(f.imageWidth, f.imageHeight));
    return [{ fonte: "Pixabay", url: f.largeImageURL, largura: Math.round(f.imageWidth * escala), altura: Math.round(f.imageHeight * escala), titulo: f.tags || busca, autor: f.user || "Pixabay", link: f.pageURL, licenca: "Licença Pixabay", credito: false, nivel: 1, palavras: `${f.tags ?? ""} ${busca}` }];
  });
};

// Fluent Emoji 3D (Microsoft, MIT): só objetos. Índice montado uma vez e guardado por 60 dias.
const GRUPOS_FORA = new Set(["Smileys & Emotion", "People & Body", "Component", "Flags", "Symbols"]);
const NOMES_FORA = /\b(face|faces|person|people|man|men|woman|women|boy|girl|baby|child|hand|hands|family|couple|kiss|ogre|goblin|ghost|alien|robot|skull|clown|pouting|smiling|grinning)\b/;
const SINONIMOS = {
  mic: "microphone",
  sofa: "couch and lamp",
  couch: "couch and lamp",
  smartphone: "mobile phone",
  cellphone: "mobile phone",
  phone: "mobile phone",
  lightbulb: "light bulb",
  bulb: "light bulb",
  idea: "light bulb",
  cash: "dollar banknote",
  banknote: "dollar banknote",
  money: "money bag",
  tv: "television",
  computer: "laptop",
  notebook: "laptop",
  car: "automobile",
  plane: "airplane",
  coffee: "hot beverage",
  gift: "wrapped gift",
  present: "wrapped gift",
  clock: "alarm clock",
  chart: "chart increasing",
  graph: "chart increasing",
  email: "e mail",
  calendar: "calendar",
  honey: "honey pot",
  trophy: "trophy",
  headphone: "headphone",
  headset: "headphone",
};

const indiceFluent = async () => {
  const arq = path.join(CACHE, "fluent", "indice.json");
  if (existsSync(arq) && (idade(arq) < 60 || semInternet)) return lerJson(arq);
  const arvore = await buscar("GitHub (Fluent Emoji)", "https://api.github.com/repos/microsoft/fluentui-emoji/git/trees/main?recursive=1", { dias: 60 });
  if (!arvore?.tree) return existsSync(arq) ? lerJson(arq) : [];
  const teste = await buscar("Unicode", "https://unicode.org/Public/emoji/latest/emoji-test.txt", { dias: 60, texto: true });
  const anotacoes = await buscar("Unicode CLDR", "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-annotations-full/annotations/en/annotations.json", { dias: 60 });
  const grupos = new Map();
  let grupo = "";
  for (const linha of String(teste ?? "").split("\n")) {
    const g = /^# group: (.+)$/.exec(linha);
    if (g) grupo = g[1].trim();
    const m = /^[0-9A-F ]+;\s*fully-qualified\s*#\s*(\S+)\s+E[\d.]+\s+(.+)$/.exec(linha);
    if (m) grupos.set(normalizar(m[2]), { grupo, emoji: m[1] });
  }
  const anot = anotacoes?.annotations?.annotations ?? {};
  const indice = arvore.tree
    .filter((t) => /^assets\/[^/]+\/3D\/[^/]+_3d\.png$/.test(t.path))
    .map((t) => {
      const nome = t.path.split("/")[1];
      const info = grupos.get(normalizar(nome));
      const e = info?.emoji;
      const palavras = e ? (anot[e]?.default ?? anot[e.replace(/\uFE0F/g, "")]?.default ?? []) : [];
      return { nome, caminho: t.path, grupo: info?.grupo ?? "", palavras };
    });
  garantirPasta(path.dirname(arq));
  writeFileSync(arq, JSON.stringify(indice));
  return indice;
};

const fluent = async (busca) => {
  const indice = await indiceFluent();
  if (!indice.length) return [];
  const pedidos = [termos(busca)];
  const cabeca = pedidos[0][pedidos[0].length - 1];
  const sin = SINONIMOS[normalizar(busca)] ?? SINONIMOS[cabeca];
  if (sin) pedidos.push(termos(sin));
  const pontos = [];
  for (const item of indice) {
    if (GRUPOS_FORA.has(item.grupo)) continue;
    const nome = termos(item.nome);
    if (NOMES_FORA.test(nome.join(" "))) continue;
    const chaves = new Set(item.palavras.flatMap((p) => termos(p)));
    let melhor = 0;
    for (const [k, q] of pedidos.entries()) {
      const extra = Math.max(0, nome.length - q.length) * 4;
      const ultima = q[q.length - 1];
      let s = 0;
      if (q.join(" ") === nome.join(" ")) s = 100;
      else if (q.every((w) => nome.includes(w))) s = 85 - extra;
      else if (q.every((w) => nome.includes(w) || chaves.has(w))) s = 62 - extra;
      else if (nome.includes(ultima)) s = 55 - extra;
      else if (chaves.has(ultima)) s = 40 - extra;
      if (k > 0) s -= 5; // sinônimo vale um pouco menos que o termo dito
      melhor = Math.max(melhor, s);
    }
    if (melhor >= 38) pontos.push({ item, s: melhor });
  }
  pontos.sort((a, b) => b.s - a.s);
  const corte = (pontos[0]?.s ?? 0) - 30;
  return pontos.filter((p) => p.s >= corte).slice(0, 2).map(({ item }) => ({
    fonte: "Fluent Emoji 3D",
    url: `https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/${item.caminho.split("/").map(encodeURIComponent).join("/")}`,
    titulo: item.nome,
    autor: "Microsoft",
    link: `https://github.com/microsoft/fluentui-emoji/tree/main/assets/${encodeURIComponent(item.nome)}`,
    licenca: "MIT",
    credito: false,
    nivel: 1,
    palavras: item.nome,
  }));
};

// ---------- a pasta do aluno ----------

const arquivosDoAluno = () =>
  existsSync(PASTA_ALUNO)
    ? readdirSync(PASTA_ALUNO, { withFileTypes: true })
        .filter((d) => d.isFile() && /\.(jpe?g|png|webp|avif|gif|svg|heic|heif)$/i.test(d.name))
        .map((d) => path.join(PASTA_ALUNO, d.name))
    : [];

const distancia = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const parecido = (nome, alvo) => {
  if (!nome || !alvo) return 0;
  if (nome === alvo) return 1;
  const a = nome.split(" ");
  const b = alvo.split(" ");
  // "mel-2.jpg" para "mel"; "pao de queijo final" para "pao de queijo"
  if (b.every((w) => a.includes(w)) && a.length - b.length <= 1) return 0.9;
  return 1 - distancia(nome.replace(/ /g, ""), alvo.replace(/ /g, "")) / Math.max(nome.length, alvo.length);
};

const acharNoAluno = (pedido, lista) => {
  if (pedido.arquivo) {
    const exato = [path.join(PASTA_ALUNO, pedido.arquivo), pedido.arquivo].find((a) => existsSync(a) && statSync(a).isFile());
    if (exato) return { arquivo: exato, como: "indicado" };
  }
  const alvos = [pedido.arquivo ? path.parse(pedido.arquivo).name : null, pedido.id, pedido.palavra].filter(Boolean).map(normalizar);
  let melhor = null;
  for (const arq of lista) {
    const nome = normalizar(path.parse(arq).name);
    for (const alvo of alvos) {
      const s = parecido(nome, alvo);
      if (s >= 0.8 && (!melhor || s > melhor.s)) melhor = { arquivo: arq, s, como: "nome parecido" };
    }
  }
  return melhor;
};

// ---------- um pedido ----------

// Nomes próprios comuns (inglês, português, espanhol): "Katy Perry", "Sarah Vaughan" num título
// quase sempre é foto de pessoa (às vezes famosa). Fica de fora da busca automática.
const NOMES = new Set(
  (
    "aaron adam adrian alan albert alex alexander alexandre alice allen amanda amy ana andre andrew angela anna anne anthony antonio arthur barbara ben benjamin " +
    "betty beyonce bill billy bob brad brian bruce bruno carl carla carlos carol caroline catherine charles charlie chris christian christina christopher claire " +
    "claudia daniel david dean dennis diana diego donald dorothy douglas edward eduardo elizabeth ellen emily emma eric felipe fernando frank fred frederick " +
    "gabriel gary george gerald gustavo harry helen henry howard isabel jack james jane janet jason jeff jennifer jessica jim jimmy joan joao joe john johnny " +
    "jorge jose joseph joshua juan julia julie justin karen katy kate katherine keith kelly kenneth kevin kim larry laura lauren leonardo linda lisa louis lucas " +
    "luis luiz lucy luke marcelo marcos margaret maria mariana mario mark martha martin mary matthew michael michelle miguel mike nancy nicholas nicole oscar " +
    "patricia patrick paul paula paulo pedro peter rachel rafael ralph raymond rebecca richard ricardo rick robert roberto roger ronald russell ryan sam samuel " +
    "sandra sara sarah scott sean sharon simon stephen steve steven susan taylor thomas tim timothy tom tony victor vincent walter william"
  ).split(" "),
);
const MARCAS_EM_TITULO = /\b(warner bros|coca[- ]cola|pepsi|mcdonald|disney|nike|adidas|samsung|iphone|lipton|nestle|kellogg)\b/i;

// Por que uma candidata não deve entrar (ou null). Olha o título e as tags.
const suspeita = (c, tipo) => {
  const titulo = String(c.titulo ?? "");
  const tudo = `${titulo} ${c.palavras ?? ""}`;
  if (/\b(logo|logos|logotype|trademark|advert|advertisement|advertising|ad|ads|commercial)\b/i.test(tudo)) return "anúncio/logo";
  if (MARCAS_EM_TITULO.test(tudo)) return "marca";
  if (/\b(dead|roadkill|carcass|killed|corpse)\b/i.test(tudo)) return "animal morto";
  // "Nome Sobrenome" ou "Nome X. Sobrenome"
  const pares = titulo.match(/\b[A-Z][a-z]+(?:\s+[A-Z]\.)?\s+[A-Z][a-z]+/g) ?? [];
  if (pares.some((par) => NOMES.has(normalizar(par.split(/\s+/)[0])))) return "pessoa";
  if (tipo === "foto" && /\b(painting|drawing|illustration|engraving|lithograph|watercolou?r|etching|sketch|poster|cartoon|clipart|clip art)\b/i.test(tudo)) return "não é foto";
  return null;
};

// 2 = a palavra buscada está no título; 1 = só nas tags; 0 = em nenhum
const relevancia = (c, busca) => {
  const q = termos(busca);
  const titulo = new Set(termos(c.titulo));
  if (q.some((w) => titulo.has(w))) return 2;
  const tags = new Set(termos(c.palavras));
  return q.some((w) => tags.has(w)) ? 1 : 0;
};

const ordenarCandidatas = (tipo, busca, pools) => {
  const fila = [];
  // objeto: os 3D (já recortados) vêm primeiro
  if (tipo === "objeto") fila.push(...pools.fluent);
  const fontes = [pools.openverse, pools.commons, pools.pexels].map((f) => f.filter((c) => !suspeita(c, tipo)));
  // a palavra buscada no título primeiro, depois só nas tags; dentro de cada grupo, CC0/domínio
  // público antes de CC BY, intercalando as fontes. As sem a palavra só completam quando faltam.
  const relevantes = fontes.flat().filter((c) => relevancia(c, busca) > 0).length;
  for (const rel of relevantes >= 4 ? [2, 1] : [2, 1, 0]) {
    for (const nivel of [1, 2, 3, 4]) {
      const filas = fontes.map((f) => f.filter((c) => c.nivel === nivel && relevancia(c, busca) === rel));
      for (let i = 0; filas.some((f) => i < f.length); i++) for (const f of filas) if (i < f.length) fila.push(f[i]);
    }
  }
  // sem repetir o mesmo arquivo nem a mesma série do mesmo autor
  const vistos = new Set();
  return fila.filter((c) => {
    const chaves = [c.url, c.repetida, `${normalizar(c.titulo)}|${normalizar(c.autor)}`].filter(Boolean);
    if (chaves.some((k) => vistos.has(k))) return false;
    chaves.forEach((k) => vistos.add(k));
    return true;
  });
};

const prepararCandidata = async (c) => {
  const arq = await baixar(c.url, c.referer);
  if (!arq) return null;
  const norm = await normalizarArquivo(arq, sha1(c.url));
  if (norm.erro) return null;
  if (!norm.pendente && Math.max(norm.largura, norm.altura) < (norm.transparente ? 200 : 500)) return null;
  return { ...c, norm };
};

const buscarPedido = async (p, listaDoAluno) => {
  p.avisos = [];
  p.candidatas = [];
  const preparadas = [];

  // (a) a pasta do aluno
  const doAluno = acharNoAluno(p, listaDoAluno);
  if (doAluno) {
    const norm = await normalizarArquivo(doAluno.arquivo, sha1(`${path.resolve(doAluno.arquivo)}|${statSync(doAluno.arquivo).size}|${statSync(doAluno.arquivo).mtimeMs}`));
    if (!norm.erro) {
      preparadas.push({ fonte: "sua pasta (imagens/)", titulo: path.basename(doAluno.arquivo), autor: "aluno", licenca: "do aluno", credito: false, link: doAluno.arquivo, norm });
      p.avisos.push(`da pasta imagens/ (${doAluno.como}): ${path.basename(doAluno.arquivo)}`);
      return preparadas;
    }
    p.avisos.push(`${path.basename(doAluno.arquivo)}: ${norm.erro}`);
  } else if (p.arquivo) p.avisos.push(`não achei ${p.arquivo} em imagens/`);

  // print: só da pasta do aluno, nunca inventado
  if (p.tipo === "print") {
    p.avisos.push("print só vem do aluno: peça o print real (imagens/) ou use um cartão");
    return preparadas;
  }
  if (!p.busca) {
    p.avisos.push("sem termo de busca");
    return preparadas;
  }

  // regras de conteúdo
  const bloqueio = await verificarTermo(p);
  if (bloqueio) {
    p.bloqueio = bloqueio;
    p.avisos.push(
      bloqueio.tipo === "marca"
        ? `não busco logo/produto de marca (${bloqueio.motivo}): peça a imagem ao aluno ou troque por algo genérico`
        : `não busco foto de pessoa famosa (${bloqueio.motivo}): peça a imagem ao aluno`,
    );
    return preparadas;
  }
  delete p.bloqueio;
  if (semInternet) {
    p.avisos.push("sem internet: só a pasta imagens/ e o cache");
  }

  // (b)…(e) bancos gratuitos
  const [ov, cm, px, fl] = await Promise.all([
    openverse(p.busca, p.tipo),
    commons(p.busca),
    Promise.all([pexels(p.busca), pixabay(p.busca)]).then(([a, b]) => [...a, ...b]),
    p.tipo === "objeto" ? fluent(p.busca) : Promise.resolve([]),
  ]);
  const fila = ordenarCandidatas(p.tipo, p.busca, { openverse: ov, commons: cm, pexels: px, fluent: fl }).filter((c) => !/\blogo\b/i.test(c.titulo));
  let i = 0;
  let tentativas = 0;
  while (preparadas.length < MAX_CANDIDATAS + 1 && i < fila.length && tentativas < 14) {
    const lote = fila.slice(i, i + Math.min(4, MAX_CANDIDATAS + 1 - preparadas.length));
    i += lote.length;
    tentativas += lote.length;
    const feitas = await Promise.all(lote.map(prepararCandidata));
    preparadas.push(...feitas.filter(Boolean));
  }
  if (!fila.length && !semInternet) p.avisos.push("nenhum banco gratuito achou: tente outro termo em inglês (--refazer id --busca ...)");
  if (p.tipo === "objeto" && !fl.length && !semInternet) p.avisos.push("sem objeto 3D com esse nome: vão fotos");
  return preparadas;
};

// ---------- a folha ----------

const alturaDaFolha = (n) => 92 + n * 330 + 16;

const montarFolha = async (pedidos) => {
  const nav = await navegador();
  for (const f of readdirSync("work").filter((f) => /^imagens(-\d+)?\.jpg$/.test(f))) rmSync(path.join("work", f));
  const folhas = [];
  for (let k = 0; k < pedidos.length; k += POR_FOLHA) folhas.push(pedidos.slice(k, k + POR_FOLHA));
  const saidas = [];
  for (const [k, grupo] of folhas.entries()) {
    const linhas = grupo.map((p) => ({
      numero: pedidos.indexOf(p) + 1,
      id: p.id,
      palavra: p.palavra || p.id,
      busca: p.busca ?? "",
      tipo: p.tipo,
      ...(typeof p.em === "number" ? { em: p.em } : {}),
      avisos: [...(p.avisos ?? []), ...(p.escolha?.sem ? ["escolhido: sem imagem (cartão)"] : [])],
      candidatas: (p.candidatas ?? [])
        .filter((c) => existsSync(path.join("public", c.arquivo)))
        // candidatas apagadas (--limpar): mostra só a escolhida
        .concat(
          !(p.candidatas ?? []).some((c) => existsSync(path.join("public", c.arquivo))) && p.escolha?.arquivo && existsSync(path.join("public", p.escolha.arquivo))
            ? [{ ...p.escolha, arquivo: p.escolha.arquivo }]
            : [],
        )
        .map((c) => {
          nav.publico(c.arquivo, path.join("public", c.arquivo));
          const escolhida = p.escolha && !p.escolha.sem && p.escolha.n === c.n;
          return {
            n: c.n,
            src: c.arquivo,
            largura: c.largura,
            altura: c.altura,
            transparente: !!c.transparente,
            fonte: c.fonte,
            licenca: c.licenca,
            credito: !!c.credito,
            escolhida: !!escolhida,
            ...(escolhida ? { foco: p.escolha.foco } : {}),
          };
        }),
    }));
    const saida = k === 0 ? "work/imagens.jpg" : `work/imagens-${k + 1}.jpg`;
    const props = { titulo: `Imagens · folha ${k + 1} de ${folhas.length}`, pedidos: linhas, largura: 1900, altura: alturaDaFolha(linhas.length) };
    await nav.still("Folha", props, path.resolve(saida), "jpeg");
    const a = linhas[0].numero;
    const b = linhas[linhas.length - 1].numero;
    saidas.push(`${saida} (pedido${a === b ? ` ${a}` : `s ${a}–${b}`})`);
  }
  return saidas;
};

// ---------- plano e créditos ----------

const sincronizarPlano = (pedidos) => {
  if (!existsSync("src/plano.json")) return false;
  const plano = lerJson("src/plano.json");
  const imagens = {};
  for (const p of pedidos) {
    if (!p.escolha) continue;
    imagens[p.id] = p.escolha.sem
      ? { sem: true, palavra: p.palavra || p.id }
      : {
          arquivo: p.escolha.arquivo,
          largura: p.escolha.largura,
          altura: p.escolha.altura,
          foco: p.escolha.foco,
          transparente: !!p.escolha.transparente,
          palavra: p.palavra || p.id,
        };
  }
  plano.imagens = imagens;
  gravarJson("src/plano.json", plano);
  return true;
};

const gravarCreditos = (pedidos) => {
  const escolhidas = pedidos.filter((p) => p.escolha && !p.escolha.sem);
  const cc = escolhidas.filter((p) => p.escolha.credito);
  const livres = escolhidas.filter((p) => !p.escolha.credito && p.escolha.licenca !== "do aluno");
  const linhas = ["Créditos das imagens (cole na legenda do post)", ""];
  if (cc.length) {
    linhas.push("Imagens:");
    for (const p of cc) {
      const e = p.escolha;
      const via = e.fonte.replace(/^Openverse\//, "");
      linhas.push(`- "${e.titulo}", de ${e.autor} (${e.licenca}), via ${via}: ${e.link}`);
    }
  } else linhas.push("Nenhuma imagem escolhida exige crédito.");
  if (livres.length) {
    linhas.push("", "Sem obrigação de crédito (só para você saber de onde veio; colar é opcional):");
    for (const p of livres) linhas.push(`- ${p.id}: "${p.escolha.titulo}", ${p.escolha.autor}, ${p.escolha.licenca} (${p.escolha.fonte}) ${p.escolha.link ?? ""}`.trim());
  }
  writeFileSync("creditos.txt", `${linhas.join("\n")}\n`);
  return cc.length;
};

// ---------- leitura do pedido ----------

if (!existsSync(ARQUIVO_PEDIDOS)) {
  console.error(`Falta ${ARQUIVO_PEDIDOS}. Escreva a lista de pedidos (veja IMAGENS.md), por exemplo:
[
  { "id": "mel", "em": 3.2, "palavra": "mel", "busca": "honey jar", "tipo": "foto" },
  { "id": "microfone", "em": 7.9, "palavra": "microfone", "busca": "microphone", "tipo": "objeto" }
]`);
  process.exit(1);
}
const bruto = lerJson(ARQUIVO_PEDIDOS);
const pedidos = Array.isArray(bruto) ? bruto : (bruto.pedidos ?? []);
const gravarPedidos = () => gravarJson(ARQUIVO_PEDIDOS, Array.isArray(bruto) ? pedidos : { ...bruto, pedidos });

const ids = new Set();
for (const p of pedidos) {
  const original = p.id;
  p.id = normalizar(p.id || p.palavra || p.busca).replace(/ /g, "-") || `imagem-${ids.size + 1}`;
  if (original !== p.id) console.log(`  ! id "${original}" virou "${p.id}" (só letras, números e hífen)`);
  if (ids.has(p.id)) {
    console.error(`id repetido: ${p.id}. Cada pedido precisa de um id diferente.`);
    process.exit(1);
  }
  ids.add(p.id);
  p.tipo = ["foto", "objeto", "print"].includes(p.tipo) ? p.tipo : "foto";
  p.busca = String(p.busca ?? "").trim();
}

const lerFoco = (texto) => {
  let partes = String(texto).trim().split(/[;\s]+|,(?=\s*\d)/).filter(Boolean);
  // "0,5,0,3" (vírgula decimal) → 0.5 e 0.3
  if (partes.length === 4) partes = [`${partes[0]}.${partes[1]}`, `${partes[2]}.${partes[3]}`];
  const [x, y] = partes.map((v) => Number(String(v).replace(",", ".")));
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`--foco precisa de x,y entre 0 e 1 (ex.: --foco 0.5,0.35); veio "${texto}"`);
  const c = (v) => Number(Math.min(1, Math.max(0, v)).toFixed(3));
  return { x: c(x), y: c(y) };
};

// ---------- --escolher ----------

if (opcoes.escolher) {
  const id = normalizar(String(opcoes.escolher)).replace(/ /g, "-");
  const p = pedidos.find((q) => q.id === id);
  if (!p) {
    console.error(`Não achei o pedido "${id}". Ids: ${pedidos.map((q) => q.id).join(", ")}`);
    process.exit(1);
  }
  const n = posicionais[0];
  if (n === undefined && !opcoes.foco) {
    console.error("Uso: node scripts/imagens.mjs --escolher <id> <n> [--foco x,y]   (n = 0 para sem imagem)");
    process.exit(1);
  }
  for (const e of EXTENSOES) rmSync(`public/img/${p.id}.${e}`, { force: true });
  if (n === "0" || n === "sem") {
    p.escolha = { sem: true, motivo: "escolhido na conferência" };
    console.log(`${p.id}: sem imagem (o modelo desenha o cartão com "${p.palavra || p.id}")`);
  } else {
    const numero = n !== undefined ? Number(n) : p.escolha?.n;
    const c = (p.candidatas ?? []).find((q) => q.n === numero);
    if (!c) {
      console.error(`${p.id} não tem a candidata ${n ?? "(nenhuma escolhida ainda)"}. Há ${p.candidatas?.length ? `1 a ${p.candidatas.length}` : "nenhuma (rode a busca)"}.`);
      process.exit(1);
    }
    if (!existsSync(path.join("public", c.arquivo))) {
      console.error(`As candidatas de ${p.id} foram apagadas. Rode: node scripts/imagens.mjs --refazer ${p.id}  (o cache deixa rápido)`);
      process.exit(1);
    }
    const foco = opcoes.foco ? lerFoco(opcoes.foco) : p.escolha?.n === numero && p.escolha.foco ? p.escolha.foco : { x: 0.5, y: 0.5 };
    const destino = `img/${p.id}${path.extname(c.arquivo)}`;
    garantirPasta("public/img");
    copyFileSync(path.join("public", c.arquivo), path.join("public", destino));
    p.escolha = {
      n: numero,
      arquivo: destino,
      foco,
      largura: c.largura,
      altura: c.altura,
      transparente: !!c.transparente,
      fonte: c.fonte,
      titulo: c.titulo,
      autor: c.autor,
      licenca: c.licenca,
      credito: !!c.credito,
      link: c.link,
    };
    console.log(
      `${p.id} ← ${numero} (${c.fonte}, ${c.licenca}${c.credito ? ", com crédito" : ""}) · foco ${virgula(foco.x)} × ${virgula(foco.y)} · public/${destino} · ${c.largura}×${c.altura}`,
    );
  }
  gravarPedidos();
  const noPlano = sincronizarPlano(pedidos);
  const comCredito = gravarCreditos(pedidos);
  const faltam = pedidos.filter((q) => !q.escolha).map((q) => q.id);
  console.log(`${noPlano ? "plano.imagens atualizado" : "sem src/plano.json: o plano recebe as imagens quando existir"} · creditos.txt (${comCredito} com crédito)`);
  console.log(faltam.length ? `Faltam escolher: ${faltam.join(", ")}` : "Todas escolhidas. Confira com --folha (círculo verde = foco) e depois os stills.");
  process.exit(0);
}

// ---------- --limpar ----------

if (opcoes.limpar) {
  rmSync(PASTA_CANDIDATAS, { recursive: true, force: true });
  rmSync("public/img/_converter", { recursive: true, force: true });
  console.log("Candidatas apagadas (as escolhidas ficam em public/img/). Para rever um pedido: --refazer <id>.");
  process.exit(0);
}

// ---------- busca ----------

const refazer = opcoes.refazer === true ? "todos" : opcoes.refazer ? normalizar(String(opcoes.refazer)).replace(/ /g, "-") : null;
if (refazer && refazer !== "todos" && !ids.has(refazer)) {
  console.error(`Não achei o pedido "${refazer}". Ids: ${[...ids].join(", ")}`);
  process.exit(1);
}
if (opcoes.busca && refazer && refazer !== "todos") pedidos.find((p) => p.id === refazer).busca = String(opcoes.busca).trim();

const assinatura = (p) => `${p.busca}|${p.tipo}|${p.arquivo ?? ""}`;
const candidatasNoDisco = (p) => (p.candidatas ?? []).length > 0 && p.candidatas.every((c) => existsSync(path.join("public", c.arquivo)));
const listaDoAluno = arquivosDoAluno();
// o arquivo do aluno apareceu depois da busca? Ele passa na frente.
const alunoNovo = (p) => !(p.candidatas?.[0]?.fonte ?? "").startsWith("sua pasta") && !!acharNoAluno(p, listaDoAluno);
const aFazer = opcoes.folha
  ? []
  : pedidos.filter(
      (p) =>
        refazer === "todos" ||
        p.id === refazer ||
        p.buscado !== assinatura(p) ||
        alunoNovo(p) ||
        // ficou sem imagem sozinho (sem internet, nada achado): tenta de novo
        (p.escolha?.automatica && !p.bloqueio && !semInternet) ||
        (!p.escolha && !candidatasNoDisco(p) && !p.bloqueio),
    );
if (aFazer.length) {
  console.log(`Buscando ${aFazer.length} pedido(s)${semInternet ? " (sem internet)" : ""}${listaDoAluno.length ? ` · ${listaDoAluno.length} arquivo(s) em imagens/` : ""}`);
  if (!process.env.PEXELS_API_KEY) console.log("  (Pexels desligado: sem PEXELS_API_KEY. Com a chave grátis, a qualidade das fotos sobe.)");
}

const porPedido = new Map();
const pendentes = [];
for (const p of aFazer) {
  process.stdout.write(`  ${p.id} · ${p.tipo} · "${p.busca}" … `);
  const preparadas = await buscarPedido(p, listaDoAluno);
  porPedido.set(p, preparadas);
  for (const c of preparadas) if (c.norm.pendente) pendentes.push(c.norm);
  console.log(`${preparadas.length} candidata(s)`);
}

try {
  await converterNoNavegador(pendentes);

  for (const [p, preparadas] of porPedido) {
    // as convertidas no navegador entram no lugar; as que falharam saem
    const prontas = preparadas
      .map((c) => (c.norm.pendente ? (c.norm.resultado ? { ...c, norm: c.norm.resultado } : null) : c))
      .filter((c) => c && Math.max(c.norm.largura, c.norm.altura) >= (c.norm.transparente ? 200 : 500));
    // a mesma foto em dois bancos (StockSnap e rawpixel, Openverse e Commons): fica a primeira
    const unicas = [];
    for (const c of prontas) {
      c.impressao = await impressao(c.norm.arquivo);
      if (!unicas.some((u) => parecidas(u.impressao, c.impressao))) unicas.push(c);
    }
    prontas.splice(0, prontas.length, ...unicas.slice(0, MAX_CANDIDATAS));
    garantirPasta(PASTA_CANDIDATAS);
    for (const f of readdirSync(PASTA_CANDIDATAS)) if (f.startsWith(`${p.id}-`) && /^\d+\./.test(f.slice(p.id.length + 1))) rmSync(path.join(PASTA_CANDIDATAS, f));
    p.candidatas = prontas.map((c, k) => {
      const ext = path.extname(c.norm.arquivo);
      const arquivo = `img/candidatas/${p.id}-${k + 1}${ext}`;
      copyFileSync(c.norm.arquivo, path.join("public", arquivo));
      return {
        n: k + 1,
        arquivo,
        largura: c.norm.largura,
        altura: c.norm.altura,
        transparente: !!c.norm.transparente,
        fonte: c.fonte,
        titulo: c.titulo,
        autor: c.autor,
        licenca: c.licenca,
        credito: !!c.credito,
        link: c.link,
      };
    });
    // sem internet e sem nada achado: não conta como buscado (tenta de novo quando a rede voltar)
    if (prontas.length || !semInternet) p.buscado = assinatura(p);
    else delete p.buscado;
    if (prontas.length > 0 && prontas.length < 3 && !prontas[0].fonte.startsWith("sua pasta")) p.avisos.push(`só ${prontas.length} candidata(s) boa(s)`);
    // a escolha antiga não vale mais (as candidatas mudaram), salvo a do aluno, que já entra escolhida
    if (p.escolha && (!p.escolha.sem || p.escolha.automatica || refazer === p.id || refazer === "todos")) delete p.escolha;
    if (prontas[0]?.fonte.startsWith("sua pasta")) {
      const c = p.candidatas[0];
      const destino = `img/${p.id}${path.extname(c.arquivo)}`;
      for (const e of EXTENSOES) rmSync(`public/img/${p.id}.${e}`, { force: true });
      copyFileSync(path.join("public", c.arquivo), path.join("public", destino));
      p.escolha = { n: 1, arquivo: destino, foco: { x: 0.5, y: 0.5 }, largura: c.largura, altura: c.altura, transparente: c.transparente, fonte: c.fonte, titulo: c.titulo, autor: c.autor, licenca: c.licenca, credito: false, link: c.link };
    }
    if (!prontas.length && !p.escolha) p.escolha = { sem: true, automatica: true, motivo: p.avisos.join("; ") || "nada achado" };
  }
  gravarPedidos();
  sincronizarPlano(pedidos);
  gravarCreditos(pedidos);

  // resumo para a IA
  console.log("");
  for (const p of pedidos) {
    const cab = `${p.id}${typeof p.em === "number" ? ` (${segundos(p.em)})` : ""} · ${p.tipo} · "${p.busca}"`;
    const estado = p.escolha?.sem ? "SEM IMAGEM (cartão)" : p.escolha ? `escolhida ${p.escolha.n}` : `${p.candidatas?.length ?? 0} candidata(s)`;
    console.log(`${cab} → ${estado}`);
    if (!candidatasNoDisco(p) && (p.candidatas ?? []).length) console.log("   (candidatas apagadas; para rever: --refazer " + p.id + ")");
    else if (!opcoes.folha || aFazer.includes(p))
      for (const c of p.candidatas ?? [])
        console.log(`   ${c.n}  ${c.fonte} · ${c.licenca}${c.credito ? " (crédito)" : ""} · ${c.largura}×${c.altura}${c.transparente ? " · transparente" : ""} · ${String(c.titulo).slice(0, 60)}`);
    for (const a of p.avisos ?? []) console.log(`   ! ${a}`);
  }

  const comImagens = pedidos.some((p) => (p.candidatas ?? []).length);
  if (pedidos.length) {
    const folhas = await montarFolha(pedidos);
    console.log(`\nFolha de conferência: ${folhas.join(" · ")}`);
    if (comImagens)
      console.log(`Abra a folha. Em cada linha, o número amarelo é a candidata; as linhas finas marcam 0,25 / 0,5 / 0,75 da imagem.
Escolha uma por pedido e marque o ponto de foco (o assunto) em frações da imagem inteira:
  node scripts/imagens.mjs --escolher <id> <n> --foco x,y      (0 = sem imagem: vira cartão)
Para o foco exato, abra a candidata: public/img/candidatas/<id>-<n>.jpg (ou .png)
Nenhuma serve? --refazer <id> --busca "outro termo em inglês"`);
  }
} finally {
  if (pacote) await pacote.fechar();
}
