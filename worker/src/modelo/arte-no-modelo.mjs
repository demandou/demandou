import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { aplicarCoresDaMarca } from "./cores-da-marca.mjs";
import {
  PASTA_DOS_MODELOS,
  conferir,
  criarProjeto,
  escolherTomadas,
  esqueletoParaEscrever,
  gateDeTempo,
  gravarPlano,
  justar,
  lerPlano,
  medirRosto,
  passoDasImagens,
  preparar,
  referenciasDoModelo,
  rodarNoProjeto,
} from "./editar-no-modelo.mjs";

/**
 * AS PEÇAS DA CAMPANHA NO ESTILO DO MODELO DO CURSO (10/10/2026, PROTÓTIPO).
 *
 * Regra do Bruno: o post, a capa e as lâminas do carrossel, o infográfico
 * saem no MESMO estilo do vídeo editado pelo modelo escolhido: a mesma letra,
 * o mesmo layout, os mesmos blocos, o mesmo jeito de pôr imagem. O estilo é do
 * modelo; a cor é sempre da marca (cores-da-marca.mjs). Quem desenha cada peça
 * é o template Remotion do próprio modelo, SEM a pessoa da gravação (nunca um
 * quadro do vídeo vira foto de post): onde o modelo põe a pessoa entra a foto
 * que o cliente subiu nos materiais, quando vem uma, ou nada (um fundo liso na
 * cor de fundo da marca).
 *
 * Como o template só sabe editar um vídeo de alguém falando, as peças viram um
 * vídeo assim, e o fluxo do curso roda inteiro em cima dele:
 *
 *   1  a "fala" sintética: o texto de cada peça, palavra por palavra (tempo
 *      pelas sílabas), um trecho de voz por peça que segura ~1,8 s depois da
 *      última palavra (é ali que o quadro é tirado) e uma pausa muda entre as
 *      peças, que o preparar acha e o cortar transforma em corte;
 *   2  o "vídeo" da pessoa: a foto do cliente parada, com o rosto no lugar do
 *      rosto do exemplo do modelo, ou o fundo liso; o áudio é um ruído no
 *      volume de voz só nos trechos de fala (a voz não vai a lugar nenhum: as
 *      peças são quadros parados);
 *   3  o projeto do trabalho (criarProjeto), as cores da marca, preparar.mjs
 *      com as palavras, tomadas, justar, rosto (medido na foto; sem foto, o do
 *      exemplo) e cortar.mjs (--sem-rastro: a foto não se mexe);
 *   4  o passo das imagens nos modelos com imagem e o plano escrito pelo app
 *      (pedirPlano com `pecasParadas`: um momento forte por peça, o texto
 *      inteiro na tela, a assinatura do modelo de preferência);
 *   5  a conferência do curso, com o caminho relaxado das peças paradas (ver
 *      RELAXADOS) e a conferência das peças (um momento por peça, o texto
 *      inteiro nele) e a guarda de número do app;
 *   6  o plano aprovado ganha os campos de quadro parado (a legenda some em
 *      tudo pelo `semLegenda`, a barra de progresso some pelo `progresso: false`
 *      nos modelos que têm); cada peça é renderizada em tamanho cheio (PNG
 *      1080x1920) depois que o bloco dela assentou, conferido pela diferença
 *      entre dois quadros;
 *   7  o formato pedido (4:5, 1:1 ou 9:16): com fundo liso, a peça é
 *      recomposta numa tela da cor do próprio fundo, com o letreiro do modelo
 *      no alto e o corpo centrado (o template monta tudo em volta do rosto, no
 *      alto, e deixa a base livre para a interface do app, que numa peça parada
 *      vira vazio); quando o corpo não cabe, reduz por igual. Nunca corta texto.
 *      Fundo que não é liso (foto em tela cheia) sai inteiro: no 9:16 como
 *      renderizado, nos outros numa tarja da cor de fundo da marca.
 *   8  o acabamento (10/10, integração na esteira): o logo da marca pequeno
 *      num canto que o modelo deixou livre (medido na peça pronta; sem canto
 *      livre, a peça sai sem logo, nunca com o logo por cima do texto), e a
 *      peça em JPEG. Uma peça pode pedir vários formatos (`formatos`): o
 *      quadro é tirado uma vez e recomposto em cada um.
 *
 * Este módulo não chama IA: a escrita mora no app (pedirPlano), como no
 * editarNoModelo.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_BIN ?? "ffprobe";
const PYTHON = process.env.PYTHON_DO_RECORTE ?? "python3";
const MODELO_ROSTO = process.env.MODELO_ROSTO ?? "/app/modelos/face_landmarker.task";

export const TIPOS_DE_PECA = ["post", "capa", "lamina", "infografico"];
// O 16:9 (11/10) é a capa do vídeo completo no YouTube, em 1280x720 (o tamanho
// que o YouTube pede): recomposta deitada em `noFormato16x9`.
export const FORMATOS = { "9:16": { largura: 1080, altura: 1920 }, "4:5": { largura: 1080, altura: 1350 }, "1:1": { largura: 1080, altura: 1080 }, "16:9": { largura: 1280, altura: 720 } };

/** O teto de ampliação de qualquer foto de pessoa (o mesmo da escolha do quadro, quadro-nitido.mjs). */
const AMPLIACAO_MAXIMA = 2;

/** Quanto um bloco leva para assentar depois da última entrada (mola, tinta, carimbo). */
const ASSENTAR = 0.9;
/** A distância entre os dois quadros que medem o que ainda se mexe. */
const PAR = 0.15;
/** Acima disto (% de pixels mudando entre os dois quadros), o bloco ainda não assentou. */
const MOVIMENTO_MAXIMO = 1.0;

/**
 * As regras do conferir.mjs que são de RITMO DE VÍDEO e não valem para um
 * quadro parado (relaxadas aqui, nunca no vídeo):
 *   - cobertura e "só pessoa e legenda": a conferência das peças exige um
 *     momento cobrindo cada peça, que é a cobertura que importa aqui;
 *   - um momento a cada N segundos: a regra aqui é um momento por peça;
 *   - variedade de tipos: num carrossel, as lâminas devem repetir o bloco;
 *   - dois efeitos próprios diferentes: obrigaria, por exemplo, o `corte` do
 *     Viral (imagem em tela cheia que esconde o texto) numa peça que precisa do
 *     texto inteiro; a assinatura continua obrigatória;
 *   - nada parado por mais de 4,5 s: num quadro parado nada se mexe.
 * Continuam valendo: tipo que o modelo não tem, campo obrigatório faltando,
 * momento que termina antes de começar e a assinatura do modelo.
 */
export const RELAXADOS = [
  { nome: "cobertura", re: /do vídeo tem momento na tela/ },
  { nome: "so-legenda", re: /só tem a pessoa e a legenda/ },
  { nome: "densidade", re: /momentos para .* de vídeo; o mínimo/ },
  { nome: "variedade", re: /tipo\(s\) de bloco/ },
  { nome: "efeitos-proprios", re: /efeito\(s\) próprio\(s\)/ },
  { nome: "parado", re: /sem nada novo a partir de/ },
];

/**
 * O que muda no template de um modelo quando NÃO há pessoa (a cópia do
 * trabalho, como as cores da marca). Por modelo, porque é desenho de cada um:
 *   - Manifesto: a `luz` em volta do rosto (a janela suave que deixa o rosto
 *     inteiro aparecer pelos vãos das letras) vira uma mancha escura no campo
 *     quando atrás das letras há só o fundo liso. Sem pessoa, a luz apaga e as
 *     letras da janela ficam limpas, na cor de fundo da marca.
 * Modelo fora da tabela segue como veio (a prova de cada um diz o que entra aqui).
 */
export const AJUSTES_SEM_PESSOA = {
  "modelo-manifesto": [{ arquivo: "src/tema.ts", de: /(\bluz:\s*)0?\.\d+/g, para: "$10" }],
};

export function ajustarSemPessoa(projeto, modelo) {
  let trocas = 0;
  for (const a of AJUSTES_SEM_PESSOA[modelo] ?? []) {
    const arquivo = join(projeto, a.arquivo);
    if (!existsSync(arquivo)) continue;
    const antes = readFileSync(arquivo, "utf8");
    const depois = antes.replace(a.de, (...m) => {
      trocas++;
      return a.para.replace("$1", m[1]);
    });
    if (depois !== antes) writeFileSync(arquivo, depois);
  }
  return trocas;
}

function rodar(bin, args, { prazoMs = 5 * 60_000, binario = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args);
    const partes = [];
    let err = "";
    p.stdout.on("data", (d) => partes.push(d));
    p.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => p.kill("SIGKILL"), prazoMs);
    p.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on("close", (codigo) => {
      clearTimeout(t);
      const out = Buffer.concat(partes);
      resolve({ codigo, out: binario ? out : out.toString("utf8"), err });
    });
  });
}

async function ffmpeg(args, passo) {
  const r = await rodar(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], { prazoMs: 10 * 60_000 });
  if (r.codigo !== 0) throw new Error(`${passo}: ffmpeg falhou: ${r.err.trim().split("\n").slice(-4).join(" ")}`);
}

// ---------- 1. a fala sintética ----------

/** Sílabas aproximadas (a mesma conta do preparar.mjs do curso): número escrito vale várias. */
const silabas = (w) => {
  const digitos = (w.match(/\d/g) ?? []).length;
  const vogais = (w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[aeiouy]+/gi) ?? []).length;
  return Math.max(1, vogais + Math.ceil(digitos * 1.5));
};

/**
 * O texto das peças como uma fala: cada palavra com o tempo das sílabas, e por
 * peça um trecho de voz [vozDe, vozAte] que começa um pouco antes da primeira
 * palavra e segura `segura` segundos depois da última. Entre as peças, `pausa`
 * segundos mudos (o preparar acha a pausa e o cortar a transforma em corte).
 * Puro.
 */
export function falaDasPecas(pecas, { inicio = 0.6, antes = 0.3, segura = 1.8, pausa = 0.9 } = {}) {
  let t = inicio;
  const palavras = [];
  const trechos = [];
  pecas.forEach((p, i) => {
    const ws = String(p.texto).trim().split(/\s+/).filter(Boolean);
    const vozDe = t;
    t += antes;
    const primeira = palavras.length;
    ws.forEach((w) => {
      const d = 0.1 + 0.16 * silabas(w);
      palavras.push({ em: +t.toFixed(3), ate: +(t + d).toFixed(3), w });
      t += d + (/[.!?…]$/.test(w) ? 0.3 : /[,;:]$/.test(w) ? 0.18 : 0.05);
    });
    const ultimaAte = palavras[palavras.length - 1].ate;
    const vozAte = +(ultimaAte + segura).toFixed(3);
    trechos.push({ peca: i, primeira, quantas: ws.length, vozDe: +vozDe.toFixed(3), vozAte });
    t = vozAte + pausa;
  });
  return { palavras, trechos, duracao: +(t + 0.1).toFixed(3) };
}

// ---------- 2. o "vídeo" da pessoa ----------

/** O rosto do exemplo do modelo (fração do quadro final): é onde o template espera a pessoa. */
export function rostoDoExemplo(modelo) {
  try {
    const p = JSON.parse(readFileSync(join(PASTA_DOS_MODELOS, modelo, "referencias", "exemplo", "plano.json"), "utf8"));
    const x = Number(p.rosto?.x);
    const y = Number(p.rosto?.y);
    if (x > 0 && x < 1 && y > 0 && y < 1) return { x, y };
  } catch {
    // sem exemplo legível: o padrão do cortar.mjs para gravação vertical
  }
  return { x: 0.5, y: 0.3 };
}

/**
 * A foto do cliente no quadro 1080x1920 com o rosto no lugar do rosto do
 * exemplo: escala para cobrir e desloca; se o deslocamento não cabe, aproxima
 * até 1,5x antes de aceitar a diferença (o mesmo método das miniaturas da
 * biblioteca). O rosto é medido pelo medir-rosto.py do worker.
 */
export async function quadroDaFoto(foto, alvo, pasta, nome = "quadro-da-pessoa.png") {
  const sonda = await rodar(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", foto]);
  const [Wp, Hp] = sonda.out.trim().split(",").map(Number);
  if (!(Wp > 0 && Hp > 0)) throw new Error("não consegui ler o tamanho da foto da pessoa");
  const r = await rodar(PYTHON, [join(AQUI, "medir-rosto.py"), JSON.stringify({ quadros: [foto], modelo_rosto: MODELO_ROSTO })], { prazoMs: 3 * 60_000 });
  let medida = null;
  try {
    medida = JSON.parse(r.out.trim().split("\n").pop());
  } catch {
    medida = null;
  }
  const W = 1080;
  const H = 1920;
  const fx = medida && !medida.erro ? medida.rostoX * Wp : Wp * 0.5;
  const fy = medida && !medida.erro ? medida.rostoY * Hp : Hp * 0.35;
  const tx = alvo.x * W;
  const ty = alvo.y * H;
  const s0 = Math.max(W / Wp, H / Hp);
  // A aproximação para pôr o rosto no lugar não passa do teto de ampliação
  // (11/10): foto pequena ampliada é a imagem mole que o Bruno chamou de
  // distorcida. Sem folga, o rosto aceita a diferença de lugar.
  const sMax = Math.max(s0, Math.min(s0 * 1.5, AMPLIACAO_MAXIMA));
  let escolha = null;
  for (let s = s0; s <= sMax + 1e-9; s += s0 * 0.05) {
    const ox = fx * s - tx;
    const oy = fy * s - ty;
    if (ox >= 0 && oy >= 0 && ox <= Wp * s - W && oy <= Hp * s - H) {
      escolha = { s, ox, oy };
      break;
    }
  }
  if (!escolha) escolha = { s: s0, ox: Math.min(Math.max(0, fx * s0 - tx), Wp * s0 - W), oy: Math.min(Math.max(0, fy * s0 - ty), Hp * s0 - H) };
  const largura = Math.ceil(Wp * escolha.s / 2) * 2;
  const altura = Math.ceil(Hp * escolha.s / 2) * 2;
  const ox = Math.round(Math.max(0, Math.min(escolha.ox, largura - W)));
  const oy = Math.round(Math.max(0, Math.min(escolha.oy, altura - H)));
  const arquivo = join(pasta, nome);
  await ffmpeg(["-i", foto, "-vf", `scale=${largura}:${altura}:flags=lanczos,crop=${W}:${H}:${ox}:${oy}`, "-frames:v", "1", arquivo], "quadro da foto");
  return { arquivo, rostoAchado: Boolean(medida && !medida.erro), zoom: +(escolha.s / s0).toFixed(2) };
}

/**
 * O vídeo que o curso recebe: a foto parada (ou o fundo liso na cor de fundo
 * da marca) e um ruído no volume de voz só nos trechos de fala, para o
 * preparar.mjs achar as falas e as pausas como numa gravação.
 */
/**
 * Onde cada peça começa na fala sintética: a primeira no zero, as outras no
 * meio da pausa que as separa. Com uma foto por peça (11/10), é aí que a foto
 * troca. Devolve [{ de, duracao }] por peça. Puro.
 */
export function janelasDasPecas(fala) {
  const inicios = fala.trechos.map((t, i) => (i === 0 ? 0 : +((fala.trechos[i - 1].vozAte + t.vozDe) / 2).toFixed(3)));
  return inicios.map((de, i) => ({ de, duracao: +((inicios[i + 1] ?? fala.duracao) - de).toFixed(3) }));
}

export async function videoDaFala({ fala, quadro, quadros = null, cor, saida }) {
  const dur = fala.duracao.toFixed(3);
  const hex = /^#?[0-9a-f]{6}$/i.test(String(cor ?? "")) ? String(cor).replace("#", "") : "111111";
  const voz = fala.trechos.map((t) => `between(t,${t.vozDe.toFixed(3)},${t.vozAte.toFixed(3)})`).join("+");
  // Uma foto por peça (11/10): cada trecho da fala mostra a sua, e a troca
  // cai no meio da pausa entre as peças (o cortar.mjs corta ali).
  const porPeca = Array.isArray(quadros) && quadros.length === fala.trechos.length && new Set(quadros).size > 1 ? quadros : null;
  let entrada;
  let video = "0:v";
  let audio = 1;
  let grafo = "";
  if (porPeca) {
    const janelas = janelasDasPecas(fala);
    entrada = porPeca.flatMap((q, i) => ["-loop", "1", "-framerate", "30", "-t", janelas[i].duracao.toFixed(3), "-i", q]);
    grafo = `${porPeca.map((_, i) => `[${i}:v]scale=1080:1920,setsar=1,fps=30,format=yuv420p[q${i}]`).join(";")};${porPeca.map((_, i) => `[q${i}]`).join("")}concat=n=${porPeca.length}:v=1:a=0[v];`;
    video = "[v]";
    audio = porPeca.length;
  } else {
    const unico = quadro ?? (Array.isArray(quadros) ? quadros[0] : null);
    entrada = unico ? ["-loop", "1", "-framerate", "30", "-t", dur, "-i", unico] : ["-f", "lavfi", "-i", `color=c=0x${hex}:s=1080x1920:r=30:d=${dur}`];
  }
  await ffmpeg(
    [
      ...entrada,
      "-f", "lavfi", "-i", `anoisesrc=d=${dur}:c=pink:r=48000:a=0.25`,
      "-filter_complex", `${grafo}[${audio}:a]volume=volume='gt(${voz},0)':eval=frame,aformat=channel_layouts=stereo[a]`,
      "-map", video, "-map", "[a]",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "128k", "-t", dur, "-movflags", "+faststart", saida,
    ],
    "vídeo das peças"
  );
  return saida;
}

// ---------- 3. as peças no vídeo cortado ----------

/**
 * O trecho de cada peça na linha do tempo do vídeo cortado: as palavras saem
 * do plano do cortar (na ordem, a contagem de cada peça), e a fronteira entre
 * duas peças é o corte que o cortar.mjs pôs na pausa (ou o meio do caminho,
 * se não houver corte ali).
 */
export function trechosNoCorte(plano, fala, pecas) {
  const palavras = plano.palavras ?? [];
  const total = fala.trechos.reduce((s, t) => s + t.quantas, 0);
  if (palavras.length !== total) {
    throw new Error(`o cortar devolveu ${palavras.length} palavras e as peças têm ${total}: a fala sintética não passou inteira`);
  }
  const cortes = plano.cortesEm ?? [];
  const limites = fala.trechos.map((t) => ({ primeiraEm: palavras[t.primeira].em, ultimaAte: palavras[t.primeira + t.quantas - 1].ate }));
  const fronteiras = limites.slice(1).map((l, i) => {
    const antes = limites[i].ultimaAte;
    const corte = cortes.find((c) => c > antes && c <= l.primeiraEm + 0.01);
    return +(corte ?? (antes + l.primeiraEm) / 2).toFixed(2);
  });
  return pecas.map((p, i) => ({
    indice: i + 1,
    tipo: p.tipo,
    texto: p.texto,
    formato: p.formato,
    formatos: p.formatos ?? [p.formato],
    de: i === 0 ? 0 : fronteiras[i - 1],
    ate: i === pecas.length - 1 ? +plano.duracao.toFixed(2) : fronteiras[i],
    primeiraEm: limites[i].primeiraEm,
    ultimaAte: limites[i].ultimaAte,
  }));
}

// ---------- 5. as conferências ----------

const sem = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const fichas = (s) => sem(s).split(/[^a-z0-9]+/).filter(Boolean);
/** Campos que não são texto de tela (escolhas de desenho, ids de imagem). */
const NAO_E_TEXTO = new Set(["tipo", "campo", "icone", "efeito", "forma", "nivel", "modo", "tendencia", "id", "arquivo", "busca", "foco", "lado", "posicao", "cor", "estilo"]);

/** Todo texto que um momento põe na tela: as strings dos campos, os números contados e as palavras quebradas em linhas (["VO", "CÊ"]). */
export function textosDoMomento(valor, chave = "", saida = []) {
  if (typeof valor === "string") {
    if (!NAO_E_TEXTO.has(chave)) saida.push(valor);
  } else if (typeof valor === "number") {
    if (chave === "valor") saida.push(String(valor));
  } else if (Array.isArray(valor)) {
    valor.forEach((x) => textosDoMomento(x, chave, saida));
    if (valor.length > 1 && valor.every((x) => typeof x === "string") && !NAO_E_TEXTO.has(chave)) saida.push(valor.join(""));
  } else if (valor && typeof valor === "object") {
    for (const [k, x] of Object.entries(valor)) textosDoMomento(x, k, saida);
  }
  return saida;
}

/**
 * As palavras do texto da peça que o momento não mostra. Puro. Os símbolos que
 * mudam o sentido do número (o "%" e o "R$") contam como palavra (10/10, prova
 * integrada: a capa "35% dos donos" saiu "35 dos donos", e a conferência só
 * olhava letras e algarismos).
 */
export function palavrasQueFaltam(momento, texto) {
  const naTela = textosDoMomento(momento).join(" ");
  const presentes = new Set(fichas(naTela));
  // O "R$" é conferido inteiro abaixo; partido em fichas, viraria a palavra "r".
  const faltam = [...new Set(fichas(String(texto).replace(/R\$/g, " ")))].filter((w) => !presentes.has(w));
  if (/%/.test(texto) && !/%|por ?cento/i.test(naTela)) faltam.push("%");
  if (/R\$/.test(texto) && !/R\$/.test(naTela)) faltam.push("R$");
  return faltam;
}

/**
 * O que o template de cada modelo faz com o texto e a conferência precisa
 * saber (10/10, prova integrada): no Manifesto, a palavra-janela passa pelo
 * `limpar` do template (src/janela.ts: só letras e algarismos), então o "%" e o
 * "R$" de um número na janela somem da tela ("35%" saiu "35"). Cada regra
 * devolve o erro do momento, ou null.
 */
const SIMBOLO_DO_NUMERO = /[%$€£+]/;
export const REGRAS_DAS_PECAS = {
  "modelo-manifesto": [
    (m) => {
      const j = typeof m.janela === "string" ? m.janela : Array.isArray(m.janela?.linhas) ? m.janela.linhas.join("") : null;
      return j && SIMBOLO_DO_NUMERO.test(j)
        ? `a palavra-janela "${j}" tem símbolo, e a janela do Manifesto mostra só letras e algarismos (o "${j.match(SIMBOLO_DO_NUMERO)[0]}" some da tela). Escolha outra palavra-janela, sem símbolo, e deixe o número com o símbolo no texto.`
        : null;
    },
  ],
};

/**
 * A conferência das peças paradas, por cima da do curso: um momento por peça,
 * cobrindo o trecho dela, e o texto da peça inteiro nele, mais as regras do
 * template do modelo (REGRAS_DAS_PECAS). Devolve os erros (vazio = aprovado).
 */
export function conferirPecas(plano, pecas, modelo = null, { tipos = null } = {}) {
  const momentos = [...(plano.momentos ?? [])].sort((a, b) => a.de - b.de);
  const erros = [];
  const blocoDaPeca = new Map();
  for (const p of pecas) {
    const n = `A peça ${p.indice} (${p.tipo}, "${p.texto}")`;
    const dela = momentos.filter((m) => Math.min(m.ate, p.ate) - Math.max(m.de, p.de) > 0.15);
    if (!dela.length) {
      erros.push(`${n} não tem momento: faça um momento de ${p.de.toFixed(2)} a ${p.ate.toFixed(2)} s com o texto inteiro dela.`);
      continue;
    }
    if (dela.length > 1) {
      erros.push(`${n} tem ${dela.length} momentos (${dela.map((m) => `${m.tipo} ${m.de} a ${m.ate} s`).join(", ")}); no modo peças paradas é UM só, de ${p.de.toFixed(2)} a ${p.ate.toFixed(2)} s.`);
      continue;
    }
    const m = dela[0];
    blocoDaPeca.set(p.indice, m.tipo);
    if (m.de > p.primeiraEm + 0.05) erros.push(`${n}: o momento "${m.tipo}" começa em ${m.de} s, depois da primeira palavra (${p.primeiraEm.toFixed(2)} s); comece em ${p.de.toFixed(2)}.`);
    if (m.ate < p.ultimaAte + 1.1) erros.push(`${n}: o momento "${m.tipo}" termina em ${m.ate} s; vá até ${p.ate.toFixed(2)} s (o quadro da peça é tirado depois da última palavra).`);
    const faltam = palavrasQueFaltam(m, p.texto);
    if (faltam.length) erros.push(`${n}: o texto não aparece inteiro no momento "${m.tipo}"; faltam ${faltam.map((w) => `"${w}"`).join(", ")}. Ponha o texto completo nos campos de texto do bloco.`);
    for (const regra of REGRAS_DAS_PECAS[modelo] ?? []) {
      const e = regra(m);
      if (e) erros.push(`${n}: ${e}`);
    }
  }
  erros.push(...variedadeDasPecas(pecas, blocoDaPeca, tipos));
  return erros;
}

/** Os tipos de bloco que o template do modelo aceita (os `tipo: "..."` do src/plano.ts). */
export function tiposDoModelo(projeto) {
  const arquivo = join(projeto, "src", "plano.ts");
  if (!existsSync(arquivo)) return [];
  return [...new Set([...readFileSync(arquivo, "utf8").matchAll(/\btipo:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]))];
}

/**
 * A VARIEDADE DAS PEÇAS (11/10, teste do Bruno no Estúdio: "todas iguais"):
 * duas peças do mesmo lote com o mesmo bloco reprovam, menos as lâminas do
 * carrossel entre si (a série repete o bloco de propósito). Vale quando o
 * modelo tem blocos para tanto: com `tipos` conhecidos e menos blocos que
 * peças distintas, a regra não reprova (a conferência não pode pedir o
 * impossível). Devolve os erros. Pura.
 */
export function variedadeDasPecas(pecas, blocoDaPeca, tipos = null) {
  const distintas = pecas.filter((p) => p.tipo !== "lamina").length + (pecas.some((p) => p.tipo === "lamina") ? 1 : 0);
  if (Array.isArray(tipos) && tipos.length && tipos.length < distintas) return [];
  const erros = [];
  const usados = new Set([...blocoDaPeca.values()]);
  const livres = Array.isArray(tipos) ? tipos.filter((t) => !usados.has(t)) : [];
  for (let i = 0; i < pecas.length; i++) {
    for (let j = i + 1; j < pecas.length; j++) {
      const a = pecas[i];
      const b = pecas[j];
      if (a.tipo === "lamina" && b.tipo === "lamina") continue;
      const ta = blocoDaPeca.get(a.indice);
      if (!ta || ta !== blocoDaPeca.get(b.indice)) continue;
      erros.push(
        `As peças ${a.indice} (${a.tipo}) e ${b.indice} (${b.tipo}) usam o mesmo bloco "${ta}": cada peça do lote usa um bloco DIFERENTE (só as lâminas do carrossel podem repetir entre si). Troque o bloco da peça ${b.indice} por outro do modelo, de preferência a assinatura ou um bloco visual${livres.length ? ` (ainda livres: ${livres.join(", ")})` : ""}.`
      );
    }
  }
  return erros;
}

/**
 * A conferência do curso (o conferir.mjs do modelo, sem mexer nele) no caminho
 * das peças paradas: o que ele reprova por ritmo de vídeo (RELAXADOS) vira
 * aviso; o resto continua reprovando. A saída que volta ao Claude leva só o
 * que ainda reprova, para ele não "consertar" o ritmo de um vídeo que não existe.
 */
export async function conferirParado(projeto) {
  const conf = await conferir(projeto);
  if (conf.aprovado) return { aprovado: true, duros: [], relaxados: [], saida: conf.saida };
  const linhas = conf.saida.split("\n");
  const i = linhas.findIndex((l) => /REPROVADO/.test(l));
  const erros = (i >= 0 ? linhas.slice(i + 1) : []).map((l) => /^\s+\d+\.\s(.+)$/.exec(l)?.[1]).filter(Boolean);
  const relaxados = erros.filter((e) => RELAXADOS.some((r) => r.re.test(e)));
  const duros = erros.filter((e) => !RELAXADOS.some((r) => r.re.test(e)));
  const cabeca = (i >= 0 ? linhas.slice(0, i) : linhas).join("\n").trim();
  const saida = duros.length
    ? `${cabeca}\n\nREPROVADO no modo peças paradas (as regras de ritmo de vídeo não valem aqui). Corrija:\n${duros.map((e, k) => `  ${k + 1}. ${e}`).join("\n")}`
    : cabeca;
  return { aprovado: erros.length > 0 && duros.length === 0, duros, relaxados, saida };
}

// ---------- 6. os quadros ----------

/**
 * O plano aprovado vira plano de quadro parado: a legenda (o karaokê da fala
 * sintética, que repetiria o texto da peça) some no vídeo inteiro pelo
 * `semLegenda`, campo que o motor de legenda de todos os modelos respeita
 * (motor/frases.ts, faixasSemLegenda; o Guia e o Níveis nem têm legenda); a
 * barra de progresso some nos modelos que têm `progresso` (Viral, Etiqueta,
 * Kit, Ranking, Versus); os sons saem.
 */
export function camposDeQuadroParado(projeto) {
  const arquivo = join(projeto, "src", "plano.json");
  const plano = JSON.parse(readFileSync(arquivo, "utf8"));
  plano.semLegenda = [{ de: 0, ate: +(plano.duracao + 1).toFixed(2) }];
  const tipos = existsSync(join(projeto, "src", "plano.ts")) ? readFileSync(join(projeto, "src", "plano.ts"), "utf8") : "";
  if (/^\s*progresso\?\s*:\s*boolean/m.test(tipos)) plano.progresso = false;
  plano.sfx = false;
  writeFileSync(arquivo, `${JSON.stringify(plano, null, 2)}\n`);
  return plano;
}

/** Os instantes "em" e "...Em" de um momento, em qualquer nível (como o stills.mjs do curso). */
function marcas(valor, chave = "") {
  if (Array.isArray(valor)) return valor.flatMap((v) => marcas(v));
  if (valor && typeof valor === "object") return Object.entries(valor).flatMap(([k, v]) => marcas(v, k));
  return typeof valor === "number" && (chave === "em" || /Em$/.test(chave)) ? [valor] : [];
}

/**
 * Quando tirar o quadro de uma peça: depois da última entrada do momento (a
 * última palavra da peça ou o último "em", o que vier depois) mais o tempo de
 * assentar, sem encostar na saída do momento. E um quadro de reserva, no fim
 * do momento, para quando o primeiro ainda estiver se mexendo.
 */
export function instantesDaPeca(momento, peca, proximo, duracao) {
  const fim = Math.min(momento.ate, proximo?.de ?? Infinity, duracao - 0.05);
  const ems = marcas(momento).filter((t) => t >= momento.de - 0.05 && t <= fim);
  const ultimo = Math.max(peca.ultimaAte, ...ems);
  const t = Math.min(fim - 0.3, Math.max(momento.de + 0.5, ultimo + ASSENTAR));
  return { t: +t.toFixed(2), antes: +Math.max(0, t - PAR).toFixed(2), reserva: +Math.max(t, fim - 0.3).toFixed(2) };
}

// O render dos quadros em tamanho cheio: o stills.mjs do curso tira JPEG na
// metade do tamanho (é para conferir); a peça precisa do quadro inteiro, em PNG.
const SCRIPT_DOS_QUADROS = `// Gerado por worker/src/modelo/arte-no-modelo.mjs: os quadros das peças em tamanho cheio (PNG).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const tempos = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
const modelo = existsSync("modelo.json") ? JSON.parse(readFileSync("modelo.json", "utf8")) : {};
const gl = modelo.gl ? process.env.GL_DOS_MODELOS || modelo.gl : undefined;
const chromiumOptions = gl ? { gl } : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
try {
  const composition = await selectComposition({ serveUrl, id: "Edicao", chromiumOptions });
  const pasta = process.env.PASTA_DOS_QUADROS || "out/pecas";
  mkdirSync(pasta, { recursive: true });
  for (const t of tempos) {
    const frame = Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps)));
    const output = \`\${pasta}/t\${t.toFixed(2).padStart(6, "0")}.png\`;
    await renderStill({ composition, serveUrl, frame, output, imageFormat: "png", scale: 1, chromiumOptions, logLevel: "error", timeoutInMilliseconds: 120000 });
    console.log(output);
  }
} finally {
  rmSync(serveUrl, { recursive: true, force: true });
}
`;

export async function quadrosEmTamanhoCheio(projeto, tempos, { pasta = "out/pecas" } = {}) {
  writeFileSync(join(projeto, "work", "quadros-das-pecas.mjs"), SCRIPT_DOS_QUADROS);
  const unicos = [...new Set(tempos.map((t) => +t.toFixed(2)))].sort((a, b) => a - b);
  const r = await rodarNoProjeto(projeto, ["work/quadros-das-pecas.mjs", ...unicos.map((t) => t.toFixed(2))], { prazoMs: 20 * 60_000, env: { PASTA_DOS_QUADROS: pasta } });
  const saida = {};
  for (const l of r.saida.split("\n").map((x) => x.trim())) {
    const achado = /t(\d+\.\d+)\.png$/.exec(l);
    if (achado) saida[Number(achado[1]).toFixed(2)] = join(projeto, l);
  }
  if (r.codigo !== 0 || unicos.some((t) => !saida[t.toFixed(2)])) {
    throw new Error(`o render dos quadros das peças falhou (código ${r.codigo}): ${r.saida.trim().split("\n").slice(-6).join(" ")}`);
  }
  return saida;
}

/**
 * Os mesmos instantes com as FOTOS trocadas por um cinza liso (as imagens do
 * plano em public/ e, com a pessoa, o vídeo dela): o que sobra diferente do
 * cinza é só o que o modelo desenha (tarja, texto, cartão, moldura). É assim
 * que a peça com foto em tela cheia acha onde está o texto para recortar a
 * foto no formato sem cortar texto. Os arquivos voltam no fim, sempre.
 */
export async function quadrosDaMascara(projeto, tempos, { comPessoa = false } = {}) {
  const plano = lerPlano(projeto);
  const guardadas = join(projeto, "work", "mascara-guardadas");
  mkdirSync(guardadas, { recursive: true });
  const trocados = [];
  const trocar = async (relativo, gerar) => {
    const arquivo = join(projeto, "public", relativo);
    if (!existsSync(arquivo)) return;
    const copia = join(guardadas, relativo.replace(/[\\/]/g, "__"));
    copyFileSync(arquivo, copia);
    trocados.push({ arquivo, copia });
    await gerar(arquivo);
  };
  try {
    for (const im of Object.values(plano.imagens ?? {})) {
      if (!im?.arquivo || !(im.largura > 0 && im.altura > 0)) continue;
      await trocar(im.arquivo, (destino) => ffmpeg(["-f", "lavfi", "-i", `color=c=0x808080:s=${im.largura}x${im.altura}`, "-frames:v", "1", destino], "máscara da imagem"));
    }
    if (comPessoa && plano.video) {
      const altura = Math.min(1920, Number(plano.videoAltura) || 1920);
      await trocar(plano.video, (destino) =>
        ffmpeg(["-f", "lavfi", "-i", `color=c=0x808080:s=1080x${altura}:r=${plano.fps || 30}:d=${(plano.duracao + 0.5).toFixed(2)}`, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-shortest", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", destino], "máscara da pessoa")
      );
    }
    if (!trocados.length) return null;
    return await quadrosEmTamanhoCheio(projeto, tempos, { pasta: "out/pecas-mascara" });
  } finally {
    for (const t of trocados) copyFileSync(t.copia, t.arquivo);
  }
}

/** Os pixels de um quadro, reduzido (RGB, linha a linha). */
async function pixels(arquivo, w, h) {
  const r = await rodar(FFMPEG, ["-v", "error", "-i", arquivo, "-vf", `scale=${w}:${h}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { binario: true });
  if (r.codigo !== 0 || r.out.length !== w * h * 3) throw new Error(`não consegui ler os pixels de ${arquivo}`);
  return r.out;
}

/** Quanto do quadro ainda se mexe entre dois instantes: % de pixels que mudaram. */
export async function movimento(a, b) {
  const [x, y] = await Promise.all([pixels(a, 135, 240), pixels(b, 135, 240)]);
  let mudou = 0;
  for (let i = 0; i < x.length; i += 3) {
    if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 30) mudou++;
  }
  return +((100 * mudou) / (x.length / 3)).toFixed(2);
}

// ---------- 7. o formato ----------

const hexDe = ([r, g, b]) => `0x${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/**
 * O fundo e o conteúdo de um quadro. O fundo é a cor mais comum da borda
 * (quando ela domina a borda, o fundo é liso). O conteúdo vem em FAIXAS: as
 * linhas com algo diferente do fundo, juntas quando o vão entre elas é pequeno.
 * A primeira faixa, fina e no alto, é o letreiro do modelo (o "Nº 01" e a área
 * do Manifesto, por exemplo); o resto é o corpo da peça. Em pixels do quadro cheio.
 */
export async function conteudoDoQuadro(arquivo, W = 1080, H = 1920, { porLinha = false } = {}) {
  const w = 270;
  const h = 480;
  const kx = W / w;
  const ky = H / h;
  const px = await pixels(arquivo, w, h);
  const cor = (x, y) => {
    const i = (y * w + x) * 3;
    return [px[i], px[i + 1], px[i + 2]];
  };
  const borda = [];
  for (let x = 0; x < w; x++) borda.push(cor(x, 0), cor(x, h - 1));
  for (let y = 0; y < h; y++) borda.push(cor(0, y), cor(w - 1, y));
  const baldes = new Map();
  for (const c of borda) {
    const k = c.map((v) => v >> 4).join(",");
    const b = baldes.get(k) ?? { n: 0, soma: [0, 0, 0] };
    b.n++;
    c.forEach((v, j) => (b.soma[j] += v));
    baldes.set(k, b);
  }
  const maior = [...baldes.values()].sort((a, b) => b.n - a.n)[0];
  const fundo = maior.soma.map((v) => v / maior.n);
  const liso = maior.n / borda.length >= 0.6;
  const longe = (c, r) => Math.abs(c[0] - r[0]) + Math.abs(c[1] - r[1]) + Math.abs(c[2] - r[2]) > 48;
  // `porLinha` (a máscara das fotos): a referência de cada linha é a mediana
  // dela, para o degradê que o modelo põe sobre a foto (escurecer o alto, a
  // vinheta) não contar como desenho; só o que destoa na própria linha conta.
  const mediana = (y) => [0, 1, 2].map((j) => {
    const v = [];
    for (let x = 0; x < w; x += 3) v.push(px[(y * w + x) * 3 + j]);
    v.sort((p, q) => p - q);
    return v[v.length >> 1];
  });
  const faixas = [];
  let atual = null;
  let vazias = 0;
  for (let y = 0; y < h; y++) {
    let n = 0;
    let a = w;
    let b = -1;
    const ref = porLinha ? mediana(y) : fundo;
    for (let x = 0; x < w; x++) {
      if (longe(cor(x, y), ref)) {
        n++;
        a = Math.min(a, x);
        b = Math.max(b, x);
      }
    }
    if (n >= 2) {
      if (atual && vazias <= 5) {
        atual.y1 = y;
        atual.x0 = Math.min(atual.x0, a);
        atual.x1 = Math.max(atual.x1, b);
      } else {
        atual = { y0: y, y1: y, x0: a, x1: b };
        faixas.push(atual);
      }
      vazias = 0;
    } else vazias++;
  }
  const emPixels = faixas.map((f) => ({ x0: Math.floor(f.x0 * kx), x1: Math.ceil((f.x1 + 1) * kx), y0: Math.floor(f.y0 * ky), y1: Math.ceil((f.y1 + 1) * ky) }));
  const primeira = emPixels[0];
  const letreiro =
    emPixels.length > 1 && primeira.y1 - primeira.y0 <= 90 && primeira.y0 <= 240 && emPixels[1].y0 - primeira.y1 >= 30 ? primeira : null;
  const corpo = emPixels.slice(letreiro ? 1 : 0);
  const caixa = corpo.length
    ? { x0: Math.min(...corpo.map((f) => f.x0)), x1: Math.max(...corpo.map((f) => f.x1)), y0: corpo[0].y0, y1: corpo[corpo.length - 1].y1 }
    : null;
  return { fundo, liso, letreiro, caixa };
}

/**
 * A peça no formato pedido, sem cortar texto. O template desenha para 9:16 com
 * o conteúdo montado em volta do rosto (no alto) e a base livre para a
 * interface do aplicativo; numa peça parada essa base vira vazio. Então, com
 * fundo liso, a peça é RECOMPOSTA numa tela da cor do próprio fundo: o
 * letreiro do modelo volta no alto e o corpo vai centrado no espaço que sobra,
 * no tamanho que o modelo desenhou, ou reduzido por igual quando não cabe
 * (nunca cortado). Vale para 4:5, 1:1 e também 9:16.
 * Fundo que não é liso (foto ou imagem em tela cheia): no 9:16 o quadro sai
 * como renderizado; nos outros, o quadro inteiro numa tarja da cor de fundo da marca.
 */
export async function noFormato(quadro, formato, saida, { corDaMarca = "#111111", mascara = null, rosto = null, reservaDaBase = 0 } = {}) {
  const alvo = FORMATOS[formato];
  if (!alvo) throw new Error(`formato desconhecido: ${formato}`);
  const W = 1080;
  const H = 1920;
  const { fundo, liso, letreiro, caixa } = await conteudoDoQuadro(quadro, W, H);
  if (!liso || !caixa) {
    if (formato === "9:16") {
      copyFileSync(quadro, saida);
      return { modo: "inteiro", fundoLiso: liso };
    }
    // Foto em tela cheia: o que o modelo desenha vem da máscara (o mesmo quadro
    // com as fotos em cinza liso), e a janela do formato recorta a FOTO em volta
    // disso (e do rosto, quando há pessoa). Só a foto perde as bordas.
    if (mascara) {
      const m = await conteudoDoQuadro(mascara, W, H, { porLinha: true });
      const caixas = [m.caixa, m.letreiro, rosto].filter(Boolean);
      if (m.liso && m.caixa) {
        const y0 = Math.min(...caixas.map((c) => c.y0));
        const y1 = Math.max(...caixas.map((c) => c.y1));
        const alturaJanela = Math.round(alvo.altura * (W / alvo.largura));
        if (y1 - y0 + 48 <= alturaJanela) {
          const y = Math.round(Math.max(0, Math.min(H - alturaJanela, (y0 + y1) / 2 - alturaJanela / 2)));
          await ffmpeg(["-i", quadro, "-vf", `crop=${W}:${alturaJanela}:0:${y},scale=${alvo.largura}:${alvo.altura}:flags=lanczos`, "-frames:v", "1", saida], "formato");
          return { modo: "recorte-da-foto", y, desenho: { y0, y1 } };
        }
      }
    }
    const marca = /^#?[0-9a-f]{6}$/i.test(corDaMarca) ? `0x${corDaMarca.replace("#", "")}` : "0x111111";
    await ffmpeg(["-i", quadro, "-vf", `scale=-2:${alvo.altura}:flags=lanczos,pad=${alvo.largura}:${alvo.altura}:(ow-iw)/2:0:color=${marca}`, "-frames:v", "1", saida], "formato");
    return { modo: "tarja", fundoLiso: liso };
  }
  const Ht = alvo.altura;
  const margem = Math.round(0.06 * Ht);
  const folga = 16;
  // Corpo que encosta na borda de cima ou de baixo (a metade de cima do Viral,
  // a foto desfocada atrás do cartão): afastar da borda criaria uma emenda que
  // o modelo não desenhou. Cabendo inteiro, ele vai centrado e a primeira (ou a
  // última) linha dele se estica até a borda, o que num fundo desfocado não
  // aparece; reduzido, ele fica encostado na borda.
  const noAlto = !letreiro && caixa.y0 <= 8;
  const embaixo = !noAlto && caixa.y1 >= H - 8;
  // O letreiro no alto, a uma margem da borda (ou onde o modelo pôs, se for mais perto).
  let cursor = margem;
  const partes = [];
  if (letreiro) {
    const y0 = Math.max(0, letreiro.y0 - 8);
    const alturaL = Math.min(H, letreiro.y1 + 8) - y0;
    const topoL = Math.min(y0, margem);
    partes.push({ y0, altura: alturaL, largura: W, topo: topoL });
    cursor = topoL + alturaL + 40;
  }
  // O corpo centrado no que sobra (ou encostado na borda em que já estava), reduzido só se não couber.
  // `reservaDaBase` (10/10): a faixa de baixo fica livre para o logo da marca,
  // para toda peça (e toda lâmina do carrossel) ter o canto dele.
  const y0 = Math.max(0, caixa.y0 - folga);
  const alturaC = Math.min(H, caixa.y1 + folga) - y0;
  const espaco = Ht - Math.max(margem, reservaDaBase) - cursor;
  const escala = Math.min(1, espaco / alturaC);
  const larguraC = Math.round((W * escala) / 2) * 2;
  const alturaCs = Math.round((alturaC * escala) / 2) * 2;
  const centrado = Math.round(cursor + (espaco - alturaCs) / 2);
  const reduzidoNaBorda = escala < 1 && (noAlto || embaixo);
  const topo = reduzidoNaBorda ? (noAlto ? 0 : Ht - alturaCs) : centrado;
  if (!reduzidoNaBorda && noAlto && topo >= 2) partes.push({ y0, altura: 2, largura: W, alturaFinal: topo, topo: 0, esquerda: 0 });
  if (!reduzidoNaBorda && embaixo && Ht - (topo + alturaCs) >= 2) partes.push({ y0: y0 + alturaC - 2, altura: 2, largura: W, alturaFinal: Ht - (topo + alturaCs), topo: topo + alturaCs, esquerda: 0 });
  partes.push({ y0, altura: alturaC, largura: larguraC, alturaFinal: alturaCs, topo, esquerda: Math.round((W - larguraC) / 2) });
  const cor = hexDe(fundo);
  const filtros = [`[0:v]split=${partes.length}${partes.map((_, i) => `[p${i}]`).join("")}`];
  partes.forEach((p, i) => {
    const redimensionar = p.largura !== W || (p.alturaFinal && p.alturaFinal !== p.altura);
    filtros.push(`[p${i}]crop=${W}:${p.altura}:0:${p.y0}${redimensionar ? `,scale=${p.largura}:${p.alturaFinal}:flags=${p.altura <= 2 ? "bilinear" : "lanczos"}` : ""}[c${i}]`);
  });
  let ultimo = "1:v";
  partes.forEach((p, i) => {
    const proximo = i === partes.length - 1 ? "saida" : `t${i}`;
    filtros.push(`[${ultimo}][c${i}]overlay=${p.esquerda ?? 0}:${p.topo}[${proximo}]`);
    ultimo = proximo;
  });
  await ffmpeg(
    ["-i", quadro, "-f", "lavfi", "-i", `color=c=${cor}:s=${W}x${Ht}:d=1`, "-filter_complex", filtros.join(";"), "-map", "[saida]", "-frames:v", "1", saida],
    "formato"
  );
  return { modo: escala < 1 ? "recomposto-reduzido" : "recomposto", escala: +escala.toFixed(3), letreiro: Boolean(letreiro), caixa };
}

// ---------- 7b. a capa deitada (16:9) ----------

/** O canal alfa de uma imagem, reduzido (cinza, linha a linha). */
async function alfa(arquivo, w, h) {
  const r = await rodar(FFMPEG, ["-v", "error", "-i", arquivo, "-vf", `format=rgba,alphaextract,scale=${w}:${h}:flags=area`, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { binario: true });
  if (r.codigo !== 0 || r.out.length !== w * h) throw new Error(`não consegui ler o alfa de ${arquivo}`);
  return r.out;
}

/**
 * A caixa da pessoa num recorte (PNG com transparência), em pixels do recorte:
 * onde o alfa passa de 10%. Lido numa grade de 1/4 e alargado de volta. Null
 * quando o recorte está vazio.
 */
export async function caixaDoAlfa(arquivo) {
  const { W, H } = await tamanhoDaImagem(arquivo);
  const k = 4;
  const w = Math.max(1, Math.round(W / k));
  const h = Math.max(1, Math.round(H / k));
  const a = await alfa(arquivo, w, h);
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (a[y * w + x] > 25) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  const X0 = Math.max(0, Math.floor((x0 * W) / w));
  const Y0 = Math.max(0, Math.floor((y0 * H) / h));
  const X1 = Math.min(W, Math.ceil(((x1 + 1) * W) / w));
  const Y1 = Math.min(H, Math.ceil(((y1 + 1) * H) / h));
  return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0, W, H };
}

/**
 * Onde a pessoa entra na capa deitada, sem esticar e sem ampliar demais: a
 * altura de 96% da capa (ou o teto de ampliação, o que for menor), encostada
 * embaixo e à direita; larga demais (ombros, braços), perde as laterais em
 * volta do rosto em vez de encolher. `pessoa`: { w, h } da caixa e `rostoX`
 * (centro do rosto, em pixels da caixa). Pura.
 */
export function lugarDaPessoa16x9(pessoa, { W = 1280, H = 720, larguraMaxima = 0.46 } = {}) {
  const altura = Math.max(1, Math.min(Math.round(H * 0.96), Math.floor(pessoa.h * AMPLIACAO_MAXIMA)));
  const s = altura / pessoa.h;
  let corteW = pessoa.w;
  let corteX = 0;
  const maxW = Math.round(W * larguraMaxima);
  if (pessoa.w * s > maxW) {
    corteW = Math.floor(maxW / s);
    const cx = Number.isFinite(pessoa.rostoX) ? pessoa.rostoX : pessoa.w / 2;
    corteX = Math.round(Math.min(Math.max(0, cx - corteW / 2), pessoa.w - corteW));
  }
  corteW -= corteW % 2;
  const largura = Math.round((corteW * s) / 2) * 2;
  const alturaPar = Math.round(altura / 2) * 2;
  const recuo = corteW < pessoa.w ? 0 : Math.round(W * 0.03);
  return { corteX, corteW, largura, altura: alturaPar, x: W - largura - recuo, y: H - alturaPar, escala: +s.toFixed(3) };
}

/**
 * Onde o texto do modelo entra na capa deitada: o letreiro e o corpo do quadro
 * vertical, empilhados, na mesma escala (nunca esticados), centrados na área
 * livre (à esquerda da pessoa, ou na capa inteira sem ela). Pura.
 */
export function lugarDoTexto16x9(partes, { W = 1280, H = 720, larguraDaPessoa = 0, vao = 40 } = {}) {
  const margemX = Math.round(W * 0.05);
  const margemY = Math.round(H * 0.07);
  const area = larguraDaPessoa ? W - larguraDaPessoa - Math.round(W * 0.04) - margemX : W - 2 * margemX;
  const largura = Math.max(...partes.map((p) => p.w));
  const altura = partes.reduce((t, p) => t + p.h, 0) + vao * (partes.length - 1);
  const escala = Math.min(1.25, area / largura, (H - 2 * margemY) / altura);
  const alturaFinal = altura * escala;
  let y = (H - alturaFinal) / 2;
  const colocadas = partes.map((p) => {
    const w = Math.max(2, Math.round((p.w * escala) / 2) * 2);
    const h = Math.max(2, Math.round((p.h * escala) / 2) * 2);
    const x = Math.round(margemX + (area - w) / 2);
    const lugar = { ...p, largura: w, altura: h, x, y: Math.round(y) };
    y += p.h * escala + vao * escala;
    return lugar;
  });
  return { escala: +escala.toFixed(3), partes: colocadas };
}

/**
 * A CAPA DEITADA (16:9, a do vídeo completo no YouTube): o template do modelo
 * desenha a peça em pé, sem a pessoa (fundo liso na cor da marca), e a capa é
 * recomposta em 1280x720: o texto do modelo (letreiro e corpo, na escala do
 * modelo ou reduzidos por igual) à esquerda, e a pessoa recortada do quadro
 * nítido à direita, encostada embaixo. Sem pessoa, o texto vai centrado na
 * capa inteira. Fundo que não é liso: o quadro inteiro, em pé, no lugar do texto.
 */
export async function noFormato16x9(quadro, saida, { corDaMarca = "#111111", pessoa = null } = {}) {
  const W = 1280;
  const H = 720;
  const { fundo, liso, letreiro, caixa } = await conteudoDoQuadro(quadro, 1080, 1920);
  const cor = liso && caixa ? hexDe(fundo) : /^#?[0-9a-f]{6}$/i.test(corDaMarca) ? `0x${corDaMarca.replace("#", "")}` : "0x111111";
  const lugarP = pessoa ? lugarDaPessoa16x9(pessoa, { W, H }) : null;
  const folga = 16;
  const recorte = (r) => {
    const x0 = Math.max(0, r.x0 - folga);
    const y0 = Math.max(0, r.y0 - folga);
    return { x: x0, y: y0, w: Math.min(1080, r.x1 + folga) - x0, h: Math.min(1920, r.y1 + folga) - y0 };
  };
  const partes = liso && caixa ? [letreiro, caixa].filter(Boolean).map(recorte) : [{ x: 0, y: 0, w: 1080, h: 1920 }];
  const texto = lugarDoTexto16x9(partes, { W, H, larguraDaPessoa: lugarP ? lugarP.largura : 0 });
  const filtros = [`[0:v]split=${partes.length}${partes.map((_, i) => `[p${i}]`).join("")}`];
  texto.partes.forEach((p, i) => filtros.push(`[p${i}]crop=${partes[i].w}:${partes[i].h}:${partes[i].x}:${partes[i].y},scale=${p.largura}:${p.altura}:flags=lanczos[t${i}]`));
  let ultimo = "1:v";
  texto.partes.forEach((p, i) => {
    filtros.push(`[${ultimo}][t${i}]overlay=${p.x}:${p.y}[c${i}]`);
    ultimo = `c${i}`;
  });
  const entradas = ["-i", quadro, "-f", "lavfi", "-i", `color=c=${cor}:s=${W}x${H}:d=1`];
  if (lugarP) {
    entradas.push("-i", pessoa.arquivo);
    filtros.push(`[2:v]format=rgba,crop=${pessoa.w}:${pessoa.h}:${pessoa.x}:${pessoa.y},crop=${lugarP.corteW}:${pessoa.h}:${lugarP.corteX}:0,scale=${lugarP.largura}:${lugarP.altura}:flags=lanczos[pessoa]`);
    filtros.push(`[${ultimo}][pessoa]overlay=${lugarP.x}:${lugarP.y}:format=auto[saida]`);
  } else {
    filtros.push(`[${ultimo}]null[saida]`);
  }
  await ffmpeg([...entradas, "-filter_complex", filtros.join(";"), "-map", "[saida]", "-frames:v", "1", saida], "capa 16:9");
  return { modo: "deitada", fundoLiso: liso, escala: texto.escala, pessoa: lugarP ? { escala: lugarP.escala, largura: lugarP.largura, altura: lugarP.altura } : null };
}

// ---------- 8. o acabamento: o logo da marca e o JPEG ----------

/**
 * O tamanho do logo na peça: o mesmo das artes de hoje (a `Assinatura` de
 * lib/modelos-de-arte/pecas-do-desenho.tsx: 54 px de altura numa peça de 1080
 * no lado menor, e a pastilha clara com folga de 28% da altura quando o fundo
 * é escuro), a 56 px da borda.
 */
export const LOGO = { altura: 54, folga: 0.28, margem: 56 };

/**
 * A faixa da base que a recomposição deixa livre quando a peça leva logo: a
 * margem, a pastilha inteira e um respiro. Medido na prova integrada de 10/10:
 * sem ela, as lâminas reduzidas encostavam na base e saíam sem logo.
 */
export const RESERVA_DO_LOGO = LOGO.margem + Math.round(LOGO.altura * (1 + 2 * LOGO.folga)) + 24;

/** A ordem de preferência dos cantos: a base primeiro (o modelo monta o conteúdo no alto). */
export const CANTOS = ["inferior-direito", "inferior-esquerdo", "superior-direito", "superior-esquerdo"];

/**
 * A caixa de um canto, em pixels da peça (W x H), para um logo de `w` x `h`
 * (já com a pastilha) a `margem` da borda. Pura.
 */
export function caixaDoCanto(canto, W, H, w, h, margem = LOGO.margem) {
  const direita = canto.endsWith("direito");
  const baixo = canto.startsWith("inferior");
  return { x: direita ? W - margem - w : margem, y: baixo ? H - margem - h : margem, w, h };
}

/** A luminância relativa (0 a 1) de uma cor RGB 0..255, a mesma conta de `luminancia` do app. Pura. */
export function luminancia([r, g, b]) {
  const c = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}

/**
 * Um canto livre para o logo: a região do canto (com uma folga em volta) quase
 * toda numa cor só, ou seja, sem texto, imagem nem bloco do modelo ali. Devolve
 * o primeiro livre na ordem de CANTOS, com a cor do fundo dele (para decidir a
 * pastilha), ou null quando nenhum está livre.
 */
export async function cantoLivre(arquivo, W, H, w, h, { margem = LOGO.margem, folga = 24 } = {}) {
  const k = 4;
  const lw = Math.round(W / k);
  const lh = Math.round(H / k);
  const px = await pixels(arquivo, lw, lh);
  for (const canto of CANTOS) {
    const c = caixaDoCanto(canto, W, H, w, h, margem);
    const x0 = Math.max(0, Math.floor((c.x - folga) / k));
    const x1 = Math.min(lw - 1, Math.ceil((c.x + c.w + folga) / k));
    const y0 = Math.max(0, Math.floor((c.y - folga) / k));
    const y1 = Math.min(lh - 1, Math.ceil((c.y + c.h + folga) / k));
    const cores = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = (y * lw + x) * 3;
      cores.push([px[i], px[i + 1], px[i + 2]]);
    }
    if (!cores.length) continue;
    const mediana = [0, 1, 2].map((j) => cores.map((cor) => cor[j]).sort((a, b) => a - b)[cores.length >> 1]);
    const fora = cores.filter((cor) => Math.abs(cor[0] - mediana[0]) + Math.abs(cor[1] - mediana[1]) + Math.abs(cor[2] - mediana[2]) > 40).length;
    if (fora / cores.length <= 0.01) return { canto, ...c, fundo: mediana, escuro: luminancia(mediana) < 0.35 };
  }
  return null;
}

/** Largura e altura de uma imagem pelo ffprobe. */
async function tamanhoDaImagem(arquivo) {
  const sonda = await rodar(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", arquivo]);
  const [W, H] = sonda.out.trim().split(",").map(Number);
  if (!(W > 0 && H > 0)) throw new Error(`não consegui ler o tamanho de ${arquivo}`);
  return { W, H };
}

/**
 * O logo que o app manda (o mesmo `logoParaArte` das artes de hoje), gravado
 * na pasta do trabalho: o PNG do logo e, para fundo escuro, o logo na pastilha
 * clara. `logo`: { claro, pastilha?, proporcao, proporcaoDaPastilha? }, com os
 * PNGs em data URI. Null sem logo legível.
 */
export function logoDoPedido(logo, pasta) {
  const png = (uri) => {
    const m = /^data:image\/png;base64,(.+)$/.exec(String(uri ?? ""));
    return m ? Buffer.from(m[1], "base64") : null;
  };
  const claro = png(logo?.claro);
  const proporcao = Number(logo?.proporcao);
  if (!claro || !(proporcao > 0)) return null;
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, "logo.png"), claro);
  const pastilha = png(logo?.pastilha);
  const proporcaoDaPastilha = Number(logo?.proporcaoDaPastilha);
  if (pastilha && proporcaoDaPastilha > 0) writeFileSync(join(pasta, "logo-pastilha.png"), pastilha);
  return {
    claro: join(pasta, "logo.png"),
    proporcao: Math.min(proporcao, 6),
    pastilha: pastilha && proporcaoDaPastilha > 0 ? join(pasta, "logo-pastilha.png") : null,
    proporcaoDaPastilha: proporcaoDaPastilha > 0 ? proporcaoDaPastilha : null,
  };
}

/**
 * A peça pronta: o logo no canto livre (a pastilha quando o canto é escuro) e
 * o JPEG (qualidade 90; as peças são opacas, nada pede transparência). Sem
 * logo ou sem canto livre, só o JPEG.
 */
export async function acabarPeca(entrada, saida, { logo = null } = {}) {
  const { W, H } = await tamanhoDaImagem(entrada);
  const u = Math.min(W, H) / 1080;
  const altura = Math.round(LOGO.altura * u);
  let colocado = null;
  if (logo) {
    const pad = Math.round(altura * LOGO.folga);
    // A caixa medida é a da pastilha (a maior): o canto que cabe a pastilha cabe o logo.
    const wPastilha = logo.pastilha ? Math.round((altura + 2 * pad) * logo.proporcaoDaPastilha) : Math.round(altura * logo.proporcao) + 2 * pad;
    const hPastilha = altura + 2 * pad;
    const canto = await cantoLivre(entrada, W, H, wPastilha, hPastilha, { margem: Math.round(LOGO.margem * u) });
    if (canto) {
      const comPastilha = canto.escuro && logo.pastilha;
      const w = comPastilha ? wPastilha : Math.round(altura * logo.proporcao);
      const h = comPastilha ? hPastilha : altura;
      // Sem pastilha, o logo vai no meio da caixa medida (a mesma folga da pastilha em volta).
      const x = comPastilha ? canto.x : canto.canto.endsWith("direito") ? canto.x + canto.w - w - pad : canto.x + pad;
      const y = comPastilha ? canto.y : canto.y + pad;
      colocado = { canto: canto.canto, x, y, w, h, pastilha: Boolean(comPastilha) };
      await ffmpeg(
        ["-i", entrada, "-i", comPastilha ? logo.pastilha : logo.claro, "-filter_complex", `[1:v]scale=${w}:${h}:flags=lanczos[l];[0:v][l]overlay=${x}:${y}:format=auto`, "-frames:v", "1", "-q:v", "3", saida],
        "logo"
      );
      return { logo: colocado, formato: "jpeg" };
    }
  }
  await ffmpeg(["-i", entrada, "-frames:v", "1", "-q:v", "3", saida], "jpeg");
  return { logo: null, formato: "jpeg", ...(logo ? { semCantoLivre: true } : {}) };
}

// ---------- os créditos das fotos de banco ----------

/** Os ids de imagem do plano que um momento usa (qualquer campo cujo valor é um id). Pura. */
export function idsDeImagemNoMomento(momento, ids) {
  const conhecidos = new Set(ids);
  const achados = new Set();
  const andar = (v) => {
    if (typeof v === "string") {
      if (conhecidos.has(v)) achados.add(v);
    } else if (Array.isArray(v)) v.forEach(andar);
    else if (v && typeof v === "object") Object.values(v).forEach(andar);
  };
  andar(momento);
  return [...achados];
}

/**
 * A linha de crédito de uma imagem escolhida pelo imagens.mjs do curso, para a
 * legenda do post: a que a licença exige (CC BY e afins) e a de banco (Pexels,
 * Pixabay, Openverse), no mesmo jeito dos créditos dos B-rolls do corte. Imagem
 * do cliente ou sem autor não leva linha. Pura.
 */
export function linhaDeCredito(escolha) {
  if (!escolha || escolha.sem || escolha.licenca === "do aluno") return null;
  const fonte = String(escolha.fonte ?? "");
  const banco = /pexels|pixabay|openverse|wikimedia|flickr/i.test(fonte);
  if (!escolha.credito && !banco) return null;
  const via = fonte.replace(/^Openverse\//, "");
  const autor = escolha.autor && escolha.autor !== "aluno" ? escolha.autor : "autor";
  const titulo = escolha.titulo ? `"${String(escolha.titulo).replace(/"/g, "'")}", ` : "";
  const licenca = escolha.licenca ? ` (${escolha.licenca})` : "";
  return `Imagem: ${titulo}de ${autor}${licenca}, via ${via || "banco de imagens"}${escolha.link ? `: ${escolha.link}` : ""}`;
}

/** Os créditos de cada imagem do trabalho (work/imagens.json do imagens.mjs), por id. */
export function creditosDasImagens(projeto) {
  const arquivo = join(projeto, "work", "imagens.json");
  if (!existsSync(arquivo)) return {};
  try {
    const pedidos = JSON.parse(readFileSync(arquivo, "utf8"));
    return Object.fromEntries((Array.isArray(pedidos) ? pedidos : []).filter((p) => p?.id).map((p) => [p.id, linhaDeCredito(p.escolha)]).filter(([, l]) => l));
  } catch {
    return {};
  }
}

/**
 * O prazo de um pedido de peças na fila do worker: 20 min fixos (projeto,
 * preparar, cortar, subir), 3 min por imagem que sai (render do quadro, a
 * máscara e o formato) e 45 min para as voltas do plano no app (cada uma até
 * ~14 min). Puro.
 */
export function prazoDaArteMs(pedido) {
  const imagens = (pedido?.pecas ?? []).reduce((s, p) => s + Math.max(1, Array.isArray(p?.formatos) ? p.formatos.length : 1), 0);
  return Math.round((20 + 3 * Math.max(1, imagens) + 45) * 60_000);
}

// ---------- o fluxo ----------

/**
 * As peças do pedido, conferidas. Cada peça pede um ou mais formatos
 * (`formatos`, ou o `formato` de antes): o quadro sai uma vez e é recomposto em
 * cada um. Exportada para o teste.
 */
export function validarPedido(pedido) {
  if (!pedido?.modelo) throw new Error("falta o modelo");
  const pecas = (pedido.pecas ?? []).map((p, i) => {
    const texto = String(p?.texto ?? "").replace(/\s+/g, " ").trim();
    if (!texto) throw new Error(`a peça ${i + 1} está sem texto`);
    if (!TIPOS_DE_PECA.includes(p.tipo)) throw new Error(`a peça ${i + 1} tem tipo desconhecido: ${p.tipo}`);
    const pedidos = Array.isArray(p.formatos) ? p.formatos : [p.formato];
    // O 16:9 é só da capa do vídeo (a do YouTube): post e lâmina não têm versão deitada.
    const formatos = [...new Set(pedidos.filter((f) => FORMATOS[f] && (f !== "16:9" || p.tipo === "capa")))];
    if (!formatos.length) formatos.push("4:5");
    // A foto da pessoa DESTA peça (11/10): um quadro nítido diferente da
    // gravação por peça, para a janela da pessoa não repetir em todas.
    const fotoUrl = typeof p.fotoUrl === "string" && p.fotoUrl.trim() ? p.fotoUrl.trim() : null;
    return { tipo: p.tipo, texto, formato: formatos[0], formatos, ...(fotoUrl ? { fotoUrl } : {}) };
  });
  if (!pecas.length || pecas.length > 10) throw new Error("mande de 1 a 10 peças por pedido");
  return pecas;
}

/**
 * AS PEÇAS NUM MODELO DO CURSO, do pedido às imagens.
 *
 * `pedido`: { modelo, pecas: [{ tipo, texto, formatos }], cores: { fundo, titulo,
 * destaque }, fotoUrl?, marca: { nome, area }, nicho, tetoUsd?, voltas?, logo? }.
 * `pedirPlano(corpo)` é o mesmo do editarNoModelo (o app escreve; aqui o corpo
 * leva `pecasParadas`). `obterFoto(url, destinoSemExtensao)` baixa a foto do
 * cliente e devolve o caminho. Devolve uma imagem (JPEG) por peça e formato em
 * `pasta/pecas`, cada uma com o índice da peça (1, 2, 3... na ordem do pedido),
 * o formato e os créditos das fotos de banco que entraram nela.
 */
export async function arteNoModelo(pedido, pasta, { pedirPlano, obterFoto = null, aoPasso = () => {} }) {
  const tempos = {};
  let t0 = Date.now();
  const marcar = (nome) => {
    tempos[nome] = +((Date.now() - t0) / 1000).toFixed(1);
    t0 = Date.now();
    aoPasso(nome);
  };
  const pecas = validarPedido(pedido);
  mkdirSync(pasta, { recursive: true });
  const avisos = [];

  // 1 e 2. A fala sintética e o "vídeo" da pessoa (foto do cliente ou fundo liso).
  const fala = falaDasPecas(pecas);
  const alvo = rostoDoExemplo(pedido.modelo);
  // A pessoa: a foto de cada peça (a da peça, ou a do pedido), cada uma com o
  // rosto no lugar do rosto do exemplo. Foto que não entra é trocada por uma
  // das que entraram; nenhuma entrou, as peças saem sem pessoa.
  let pessoa = null;
  const fotosPedidas = pecas.map((p) => p.fotoUrl ?? pedido.fotoUrl ?? null);
  const unicas = [...new Set(fotosPedidas.filter(Boolean))];
  if (unicas.length && obterFoto) {
    const quadroDe = new Map();
    for (const [k, url] of unicas.entries()) {
      try {
        const foto = await obterFoto(url, join(pasta, `foto-da-pessoa-${k + 1}`));
        const q = await quadroDaFoto(foto, alvo, pasta, `quadro-da-pessoa-${k + 1}.png`);
        if (!q.rostoAchado) avisos.push(`a foto ${k + 1} da pessoa não teve rosto achado: entrou centrada`);
        quadroDe.set(url, q);
      } catch (e) {
        avisos.push(`a foto ${k + 1} da pessoa não entrou (${e instanceof Error ? e.message.slice(0, 160) : e})`);
      }
    }
    const entraram = [...quadroDe.values()];
    if (entraram.length) {
      const quadros = fotosPedidas.map((u, i) => (u && quadroDe.get(u)) || entraram[i % entraram.length]);
      pessoa = { arquivo: quadros[0].arquivo, quadros: quadros.map((q) => q.arquivo), rostoAchado: quadros.every((q) => q.rostoAchado), zoom: quadros[0].zoom, fotos: entraram.length };
    } else avisos.push("nenhuma foto da pessoa entrou; as peças saem sem pessoa");
  }
  const video = await videoDaFala({ fala, quadro: pessoa?.arquivo ?? null, quadros: pessoa?.quadros ?? null, cor: pedido.cores?.fundo, saida: join(pasta, "pecas.mp4") });

  // A pessoa da capa deitada (16:9, 11/10): o quadro nítido que o app mandou
  // em `pessoaUrl`, recortado do fundo; entra ao lado do texto do modelo.
  let pessoa16x9 = null;
  if (pedido.pessoaUrl && obterFoto && pecas.some((p) => p.formatos.includes("16:9"))) {
    try {
      const foto = await obterFoto(pedido.pessoaUrl, join(pasta, "pessoa-da-capa"));
      const { quadroDaCapa } = await import("../segmentacao.mjs");
      const r = await quadroDaCapa({ imagem: foto }, pasta, "pessoa-da-capa");
      const cx = r?.recorte ? await caixaDoAlfa(r.recorte) : null;
      if (!cx) throw new Error("a pessoa não saiu do fundo");
      const rostoX = r.rosto ? (r.rosto.x + r.rosto.w / 2) * cx.W - cx.x : cx.w / 2;
      pessoa16x9 = { arquivo: r.recorte, x: cx.x, y: cx.y, w: cx.w, h: cx.h, rostoX };
    } catch (e) {
      avisos.push(`a pessoa da capa deitada não entrou (${e instanceof Error ? e.message.slice(0, 160) : e}); a capa sai só com o texto`);
    }
  }
  marcar("fala");

  // 3. O fluxo do curso: projeto, cores da marca, preparar, tomadas, rosto, cortar.
  const projeto = criarProjeto(pedido.modelo, pasta);
  const cores = pedido.cores?.destaque ? aplicarCoresDaMarca(projeto, pedido.cores) : { trocadas: 0 };
  if (cores.erro) avisos.push(`as cores da marca não entraram: ${cores.erro}`);
  const ajustesSemPessoa = pessoa ? 0 : ajustarSemPessoa(projeto, pedido.modelo);
  await preparar(projeto, video, fala.palavras);
  const tomadas = escolherTomadas(projeto);
  await justar(projeto);
  const analise = JSON.parse(readFileSync(join(projeto, "work", "analise.json"), "utf8"));
  const medida = pessoa
    ? await medirRosto(projeto, video, analise.duracao)
    : { rostoX: alvo.x, rostoY: alvo.y, queixoY: Math.min(0.9, +(alvo.y + 0.1).toFixed(3)) };
  const corte = await rodarNoProjeto(
    projeto,
    ["scripts/cortar.mjs", "--rosto-x", String(medida.rostoX), "--rosto-y", String(medida.rostoY), "--queixo-y", String(medida.queixoY), "--sem-rastro"],
    { prazoMs: 20 * 60_000 }
  );
  if (corte.codigo !== 0) throw new Error(`cortar.mjs falhou (código ${corte.codigo}): ${corte.saida.trim().split("\n").slice(-6).join(" ")}`);
  const trechos = trechosNoCorte(lerPlano(projeto), fala, pecas);
  const tipos = tiposDoModelo(projeto);
  const pecasParadas = {
    pecas: trechos,
    semPessoa: !pessoa,
    corDoFundo: pedido.cores?.fundo ?? null,
    // Quadros da gravação na janela da pessoa (11/10), e não uma foto posada.
    ...(pessoa && pedido.fotosDaGravacao ? { pessoaDaGravacao: true } : {}),
    // Os blocos que o corte do mesmo vídeo usou (o que ficou bom), e os do modelo.
    ...(pedido.referenciaDoCorte ? { referenciaDoCorte: String(pedido.referenciaDoCorte).slice(0, 3000) } : {}),
    ...(tipos.length ? { blocosDoModelo: tipos } : {}),
  };
  marcar("cortar");

  // 4 e 5. As imagens (modelos com imagem) e o plano, até as conferências aprovarem.
  const referencias = referenciasDoModelo(pedido.modelo);
  const maxVoltas = Math.max(1, Math.min(4, Number(pedido.voltas) || 3));
  const teto = Number(pedido.tetoUsd) > 0 ? Number(pedido.tetoUsd) : 1;
  let gasto = 0;
  const somar = (r) => {
    gasto += Number(r?.custoUsd) || 0;
    return r;
  };
  const comum = { modelo: pedido.modelo, referencias, nicho: pedido.nicho ?? null, pecasParadas };
  let mapa = null;
  let creditos = null;
  if (referencias.imagens) {
    const r = await passoDasImagens(projeto, { ...comum, esqueleto: esqueletoParaEscrever(lerPlano(projeto)) }, (c) => pedirPlano(c).then(somar));
    mapa = r.mapa;
    creditos = r.creditos;
    marcar("imagens");
  }
  const esqueleto = esqueletoParaEscrever(lerPlano(projeto));
  const historico = [];
  const relaxadosVistos = new Set();
  let anterior = null;
  let aprovado = false;
  let volta = 0;
  for (; volta < maxVoltas && !aprovado; volta++) {
    if (gasto >= teto) throw new Error(`o teto de US$ ${teto.toFixed(2)} das peças foi atingido antes da volta ${volta + 1} do plano`);
    const escrito = await pedirPlano({ ...comum, esqueleto, marca: pedido.marca, anterior, mapa }).then(somar);
    mapa = escrito.mapa || mapa;
    writeFileSync(join(projeto, "work", "mapa.md"), mapa ?? "");
    gravarPlano(projeto, escrito.plano);
    const conf = await conferirParado(projeto);
    conf.relaxados.forEach((e) => relaxadosVistos.add(e));
    // Gate de tempo (±0,15 s entre o que entra e a palavra): no quadro parado a
    // entrada já aconteceu, então vira aviso.
    const tempo = await gateDeTempo(projeto);
    if (!tempo.ok) avisos.push(`gate de tempo (aviso, volta ${volta + 1}): ${tempo.resultados.filter((g) => !g.ok).map((g) => g.ferramenta).join(", ")}`);
    const dasPecas = conferirPecas(lerPlano(projeto), trechos, pedido.modelo, { tipos });
    const semLastro = escrito.numerosSemLastro ?? [];
    aprovado = conf.aprovado && dasPecas.length === 0 && semLastro.length === 0;
    historico.push({ volta: volta + 1, conferir: conf.aprovado, duros: conf.duros, relaxados: conf.relaxados.length, pecas: dasPecas, semLastro, custoUsd: +(Number(escrito.custoUsd) || 0).toFixed(4) });
    if (!aprovado) {
      anterior = {
        plano: escrito.plano,
        saidas: [conf.aprovado ? "conferir.mjs (modo peças paradas): APROVADO." : conf.saida, ...(dasPecas.length ? [`Conferência das peças paradas, REPROVADA:\n${dasPecas.map((e, k) => `  ${k + 1}. ${e}`).join("\n")}`] : [])],
        numerosSemLastro: semLastro,
      };
    }
  }
  marcar("plano");
  if (!aprovado) {
    const ultimo = historico[historico.length - 1];
    throw new Error(`o plano das peças não passou em ${maxVoltas} voltas: ${[...(ultimo?.duros ?? []), ...(ultimo?.pecas ?? [])].join(" | ").slice(0, 600)}`);
  }

  // 6. Os quadros: legenda e barra fora, cada peça depois que o bloco assentou.
  const plano = camposDeQuadroParado(projeto);
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const escolhas = trechos.map((p) => {
    const m = momentos.find((x) => Math.min(x.ate, p.ate) - Math.max(x.de, p.de) > 0.15);
    const proximo = momentos[momentos.indexOf(m) + 1] ?? null;
    return { peca: p, momento: m, ...instantesDaPeca(m, p, proximo, plano.duracao) };
  });
  const quadros = await quadrosEmTamanhoCheio(projeto, escolhas.flatMap((e) => [e.antes, e.t, e.reserva]));
  marcar("quadros");

  // 7. O formato de cada peça. O instante: o primeiro, ou o de reserva quando o
  // primeiro ainda se mexe. Peça com foto em tela cheia num formato que não é
  // 9:16 ganha o quadro da máscara, para o recorte achar o texto.
  const q = (t) => quadros[t.toFixed(2)];
  for (const e of escolhas) {
    e.movimento = await movimento(q(e.antes), q(e.t));
    e.instante = e.movimento > MOVIMENTO_MAXIMO && e.reserva > e.t ? e.reserva : e.t;
    // Só o formato que não é 9:16 recorta a foto (e precisa da máscara).
    // O 9:16 sai como renderizado e o 16:9 recompõe sozinho: nenhum dos dois usa a máscara.
    e.liso = e.peca.formatos.every((f) => f === "9:16" || f === "16:9") ? true : (await conteudoDoQuadro(q(e.instante))).liso;
  }
  const comFoto = escolhas.filter((e) => !e.liso);
  let mascaras = {};
  if (comFoto.length) {
    try {
      mascaras = (await quadrosDaMascara(projeto, comFoto.map((e) => e.instante), { comPessoa: Boolean(pessoa) })) ?? {};
    } catch (e) {
      avisos.push(`a máscara das fotos falhou (${e instanceof Error ? e.message.slice(0, 160) : e}); a peça com foto sai inteira numa tarja`);
    }
    marcar("mascara");
  }
  const rosto = pessoa && plano.rosto ? { y0: Math.round((plano.rosto.y - 0.1) * 1920), y1: Math.round((plano.rosto.y + 0.12) * 1920) } : null;
  const pastaDasPecas = join(pasta, "pecas");
  mkdirSync(pastaDasPecas, { recursive: true });
  // 8. O acabamento: o logo da marca num canto livre e o JPEG.
  const logo = pedido.logo ? logoDoPedido(pedido.logo, join(pasta, "logo")) : null;
  if (pedido.logo && !logo) avisos.push("o logo da marca veio ilegível; as peças saem sem logo");
  // Os créditos das fotos de banco: os do trabalho, e cada peça leva os das imagens do momento dela.
  const creditosPorId = creditosDasImagens(projeto);
  const idsDoPlano = Object.keys(plano.imagens ?? {});
  const saidas = [];
  for (const e of escolhas) {
    const instante = e.instante;
    const mov = e.movimento;
    const creditosDaPeca = [...new Set(idsDeImagemNoMomento(e.momento, idsDoPlano).map((id) => creditosPorId[id]).filter(Boolean))];
    for (const f of e.peca.formatos) {
      const base = `peca-${e.peca.indice}-${e.peca.tipo}-${f.replace(":", "x")}`;
      const bruto = join(pastaDasPecas, `${base}.png`);
      const arquivo = join(pastaDasPecas, `${base}.jpg`);
      const formato =
        f === "16:9"
          ? await noFormato16x9(q(instante), bruto, { corDaMarca: pedido.cores?.fundo, pessoa: pessoa16x9 })
          : await noFormato(q(instante), f, bruto, { corDaMarca: pedido.cores?.fundo, mascara: mascaras[instante.toFixed(2)] ?? null, rosto, reservaDaBase: logo ? RESERVA_DO_LOGO : 0 });
      const acabamento = await acabarPeca(bruto, arquivo, { logo });
      if (acabamento.semCantoLivre) avisos.push(`a peça ${e.peca.indice} (${f}) não tem canto livre para o logo: saiu sem logo`);
      saidas.push({
        indice: e.peca.indice,
        tipo: e.peca.tipo,
        formato: f,
        texto: e.peca.texto,
        arquivo,
        quadro: q(instante),
        instante,
        movimento: mov,
        momento: { tipo: e.momento.tipo, de: e.momento.de, ate: e.momento.ate },
        recorte: formato,
        logo: acabamento.logo,
        creditos: creditosDaPeca,
      });
    }
  }
  marcar("formatos");
  return {
    pecas: saidas,
    mapa,
    creditos,
    voltas: volta,
    historico,
    relaxados: [...relaxadosVistos],
    custoUsd: +gasto.toFixed(4),
    tomadas,
    cores,
    ajustesSemPessoa,
    pessoa: pessoa ? { zoom: pessoa.zoom, rostoAchado: pessoa.rostoAchado, fotos: pessoa.fotos } : null,
    pessoa16x9: pessoa16x9 ? { largura: pessoa16x9.w, altura: pessoa16x9.h } : null,
    avisos,
    tempos,
    projeto,
  };
}
