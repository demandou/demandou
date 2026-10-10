// Gramática de layout do modelo Rótulo.
//
// "cheio"   a pessoa em quadro cheio, rosto no centro; a ficha na altura do peito (abertura, pergunta,
//           fechamento, ou qualquer momento com "pessoa": "cheia")
// "rotulo"  o vídeo encolhe até virar o camafeu oval no alto do rótulo; o rótulo ocupa a tela; a lupa
//           lê os campos e a ficha (o mesmo painel do peito) explica cada um
//
// A troca entre os dois começa 0,16 s antes da fronteira e leva 0,8 s: o pulo de um corte some no movimento.
import { firme, mistura, prog } from "./anim";
import type { Caixa } from "./motor/caixa";
import type { Fonte, Medidor } from "./medida";
import { encaixar } from "./texto";
import type { Alvo, Momento, Plano, Rotulo, Vaga } from "./plano";
import { ANCORA_CAMAFEU, CAMAFEU, CARTUCHO, display, FICHA, fichaTopo, LINHA, LUPA, TAM, texto, ZOOM_CAMAFEU } from "./tema";

export const ANTES = 0.16;
export const DUR_TROCA = 0.8;
// buraco entre momentos a partir do qual a pessoa fica sozinha em quadro cheio, com legenda
export const BURACO = 1.2;

// Momentos que ficam em quadro cheio (ficha no peito) quando o plano não diz nada
const CHEIOS = new Set(["abertura", "cta", "pergunta"]);

// o momento acontece no rótulo (pessoa no camafeu, lupa lendo)?
export const noRotulo = (m: Momento) => (m.pessoa ? m.pessoa === "camafeu" : !CHEIOS.has(m.tipo));

// Momentos em ordem, encostados: um buraco menor que BURACO é absorvido pelo momento anterior.
export const ordenar = (plano: Plano): Momento[] => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  return ms.map((m, i) => {
    const prox = ms[i + 1];
    if (!prox) return m.tipo === "cta" || m.ate >= plano.duracao - 0.5 ? { ...m, ate: plano.duracao + 1 } : m;
    if (m.ate > prox.de || prox.de - m.ate < BURACO) return { ...m, ate: prox.de };
    return m;
  });
};

// 1 = rótulo (pessoa no camafeu), 0 = quadro cheio
export const nivelDoRotulo = (t: number, momentos: Momento[]) => {
  const alvoEm = (x: number) => {
    const m = momentos.find((o) => x >= o.de && x < o.ate);
    return m && noRotulo(m) ? 1 : 0;
  };
  // pontos de troca: começo e fim de cada momento
  const pontos = [...new Set(momentos.flatMap((m) => [m.de, m.ate]))].sort((a, b) => a - b);
  let v = alvoEm(0);
  for (const b of pontos) {
    if (b <= 0) continue;
    if (t < b - ANTES) break;
    const para = alvoEm(b + 0.001);
    v = mistura(v, para, prog(t, b - ANTES, DUR_TROCA, firme));
  }
  return v;
};

// Aproximação da pessoa dentro do camafeu: com o rastro do rosto, o rosto fica sempre do mesmo tamanho
// (centro do rosto ao queixo ≈ 171 px, testa e queixo dentro da oval), seja a gravação aberta ou fechada.
// Gravação muito perto da câmera (o rosto já é grande demais mesmo sem aproximar): o rosto sobe na oval
// para o queixo não cortar.
export const enquadramentoDoCamafeu = (plano: Plano) => {
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  const zoomPlano = plano.camafeu?.zoom;
  const ancoraPlano = plano.camafeu?.ancoraY;
  if (!largura) return { zoom: zoomPlano ?? ZOOM_CAMAFEU, ancoraY: ancoraPlano ?? ANCORA_CAMAFEU };
  const queixo = largura * 1080 * 0.66;
  const base = Math.max((CAMAFEU.rx * 2) / 1080, (CAMAFEU.ry * 2) / Math.min(1920, plano.videoAltura ?? 1920));
  const zoom = zoomPlano ?? Math.min(3.2, Math.max(1, 171 / queixo / base));
  // centro do rosto ao queixo dentro da oval (com a folga que a caixa usa para seguir o rosto)
  const queixoNaOval = queixo * base * zoom * 1.15;
  const pertoDemais = !zoomPlano && 171 / queixo / base < 1;
  const ancoraY = ancoraPlano ?? (pertoDemais ? Math.min(ANCORA_CAMAFEU, Math.max(0.5, (CAMAFEU.ry * 2 * 0.94 - queixoNaOval) / (CAMAFEU.ry * 2))) : ANCORA_CAMAFEU);
  return { zoom, ancoraY };
};

// Caixa do vídeo da pessoa: do quadro cheio ao camafeu (que anda com a câmera sobre o rótulo)
export const caixaDaPessoa = (q: number, plano: Plano, cam: Camera = IDENTIDADE): { caixa: Caixa; oval: number } => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const cheia: Caixa = { x: 0, y: 0, w: 1080, h: videoAltura, zoom: 1, ancoraY: (plano.rosto.y * 1920) / videoAltura };
  const { cx, cy, rx, ry } = CAMAFEU;
  const camafeu: Caixa = {
    x: (cx - rx) * cam.s + cam.tx,
    y: (cy - ry) * cam.s + cam.ty,
    w: rx * 2 * cam.s,
    h: ry * 2 * cam.s,
    ...enquadramentoDoCamafeu(plano),
  };
  const k = (a: number, b: number) => mistura(a, b, q);
  return {
    caixa: {
      x: k(cheia.x, camafeu.x),
      y: k(cheia.y, camafeu.y),
      w: k(cheia.w, camafeu.w),
      h: k(cheia.h, camafeu.h),
      zoom: k(cheia.zoom ?? 1, camafeu.zoom ?? 1),
      ancoraY: k(cheia.ancoraY ?? 0.3, camafeu.ancoraY ?? 0.45),
    },
    // os cantos arredondam cedo e chegam à elipse no fim
    oval: Math.min(1, q * 1.35),
  };
};

// ---------- a ficha ----------

export const geometriaDaFicha = (plano: Plano) => {
  const topo = fichaTopo(plano.zona?.topo ?? 970);
  return { x: FICHA.x, y: topo, w: FICHA.w, h: FICHA.base - topo };
};

// ---------- texto sem acento, para casar o plano com o rótulo ----------

// minúsculas, sem acento e sem pontuação, espaços simples
export const chave = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}%$]+/gu, " ")
    .trim();

// letra por letra, sem acento (mantém as posições do texto original)
const semAcentoLetraALetra = (s: string) => [...s].map((c) => c.toLowerCase().normalize("NFD")[0] ?? c).join("");

// ---------- o rótulo: quatro campos em volta do camafeu e duas linhas largas embaixo ----------
//
//   [c1]   ( camafeu )   [c2]
//   [c3]   (         )   [c4]
//          NOME DO RÓTULO
//      ────────── ◆ ──────────
//            LINHA LARGA

export type LinhaImpressa = { texto: string; fonte: Fonte; tom: "tinta" | "suave" | "vinho"; dy: number; altura: number };
export type Bloco = { x: number; y: number; largura: number; meia: number; linhas: LinhaImpressa[] };

const CAIXA = (tamanho: number, espaco = 0.14): Fonte => ({ familia: texto, tamanho, caixaAlta: true, espaco });
const LARGURA_LARGA = 860;
export const VAGAS: Vaga[] = ["c1", "c2", "c3", "c4", "nome", "linha"];

// empilha linhas num bloco centrado em (x, y)
const empilhar = (x: number, y: number, linhas: Omit<LinhaImpressa, "dy">[], medir: Medidor): Bloco => {
  const gap = 8;
  const total = linhas.reduce((s2, l) => s2 + l.altura, 0) + gap * Math.max(0, linhas.length - 1);
  let cursor = -total / 2;
  const prontas = linhas.map((l) => {
    const dy = cursor + l.altura / 2;
    cursor += l.altura + gap;
    return { ...l, dy };
  });
  const largura = Math.max(...linhas.map((l) => medir(l.texto, l.fonte)), 1);
  return { x, y, largura, meia: total / 2, linhas: prontas };
};

// a fonte encolhe até a linha caber em `largura` (sem passar do mínimo)
const caber = (t: string, f: Fonte, largura: number, minimo: number, medir: Medidor): Fonte => {
  const w = medir(t, f);
  return w <= largura ? f : { ...f, tamanho: Math.max(minimo, Math.floor((f.tamanho * largura) / w)) };
};

// texto em até 2 linhas dentro do cartucho; palavra longa demais encolhe (e, em caixa alta, aperta o
// espaço entre as letras) até caber
const emDuas = (t: string, f: Fonte, minimo: number, medir: Medidor) => {
  const r = encaixar(t, CARTUCHO.largura, medir, f, f.tamanho, minimo, 2);
  return r.linhas.map((l) => {
    let fonte: Fonte = { ...f, tamanho: r.tamanho };
    if (fonte.caixaAlta) for (let e = fonte.espaco ?? 0; e > 0.01 && medir(l, fonte) > CARTUCHO.largura; e -= 0.03) fonte = { ...fonte, espaco: Math.max(0.01, e - 0.03) };
    return { texto: l, fonte: caber(l, fonte, CARTUCHO.largura, 26, medir) };
  });
};

const alturaCaixa = (f: Fonte) => f.tamanho * 1.12;

// o rótulo usa o formato livre (`campos`) ou o de bebida (ano, teor, destaque, categoria)?
export const rotuloLivre = (r: Rotulo) => Array.isArray(r.campos);

// Nome e valor de cada vaga, para casar o plano com o rótulo (null = vaga vazia)
export const textosDasVagas = (r: Rotulo): Record<Vaga, { nome?: string; valor: string } | null> => {
  const linha = r.linha ?? r.origem;
  const base = { nome: { valor: r.nome }, linha: linha ? { valor: linha } : null };
  if (rotuloLivre(r)) {
    const c = (i: number) => {
      const campo = r.campos?.[i];
      return campo && campo.valor?.trim() ? { nome: campo.nome, valor: campo.valor } : null;
    };
    return { ...base, c1: c(0), c2: c(1), c3: c(2), c4: c(3) };
  }
  return {
    ...base,
    c1: r.ano ? { nome: r.anoRotulo ?? "Safra", valor: r.ano } : null,
    c2: r.teor ? { valor: r.teor } : null,
    c3: r.destaque ? { valor: r.destaque } : null,
    c4: r.categoria ? { valor: r.categoria } : null,
  };
};

export const layoutDoRotulo = (r: Rotulo, medir: Medidor): Record<Vaga, Bloco | null> => {
  const { esqX, dirX, cimaY, baixoY } = CARTUCHO;
  const fNome = caber(r.nome, { familia: display, tamanho: TAM.rotuloNome }, LARGURA_LARGA, 40, medir);
  const nome = empilhar(540, LINHA.nome, [{ texto: r.nome, fonte: fNome, tom: "tinta", altura: fNome.tamanho * 1.0 }], medir);
  const textoLinha = r.linha ?? r.origem;
  let linha: Bloco | null = null;
  if (textoLinha) {
    const f0 = CAIXA(TAM.rotuloCaixa, 0.08);
    const fLinha = caber(textoLinha, f0, LARGURA_LARGA, 30, medir);
    if (medir(textoLinha, fLinha) <= LARGURA_LARGA) linha = empilhar(540, LINHA.origem, [{ texto: textoLinha, fonte: fLinha, tom: "tinta", altura: alturaCaixa(fLinha) }], medir);
    else {
      // não cabe numa linha: duas, quebrando num " · " (ou no meio), no mesmo tamanho
      const partes = textoLinha.split(/\s+·\s+/);
      let melhor: [string, string] = [textoLinha, ""];
      let pior = Infinity;
      const palavras = textoLinha.split(" ");
      const opcoes: [string, string][] =
        partes.length > 1
          ? partes.slice(1).map((_, i) => [partes.slice(0, i + 1).join(" · "), partes.slice(i + 1).join(" · ")])
          : palavras.slice(1).map((_, i) => [palavras.slice(0, i + 1).join(" "), palavras.slice(i + 1).join(" ")]);
      for (const o of opcoes) {
        const w = Math.max(medir(o[0], f0), medir(o[1], f0));
        if (w < pior) {
          pior = w;
          melhor = o;
        }
      }
      const fb = { ...f0, tamanho: Math.min(caber(melhor[0], f0, LARGURA_LARGA, 26, medir).tamanho, caber(melhor[1], f0, LARGURA_LARGA, 26, medir).tamanho) };
      linha = empilhar(540, LINHA.origem, melhor.map((l) => ({ texto: l, fonte: fb, tom: "tinta" as const, altura: alturaCaixa(fb) })), medir);
    }
  }

  if (rotuloLivre(r)) {
    const lugar = [
      { x: esqX, y: cimaY },
      { x: dirX, y: cimaY },
      { x: esqX, y: baixoY },
      { x: dirX, y: baixoY },
    ];
    const cartucho = (i: number): Bloco | null => {
      const c = r.campos?.[i];
      if (!c || !c.valor?.trim()) return null;
      const linhas: Omit<LinhaImpressa, "dy">[] = [];
      if (c.nome?.trim()) {
        emDuas(c.nome, CAIXA(TAM.rotuloCaixa - 4, 0.16), 30, medir).forEach((l) => linhas.push({ ...l, tom: "suave", altura: alturaCaixa(l.fonte) }));
      }
      if (i < 2) {
        // em cima: o valor grande (Caslon Display) se couber numa linha; senão, texto em até 2 linhas
        const fGrande: Fonte = { familia: display, tamanho: TAM.rotuloGrande };
        const w = medir(c.valor, fGrande);
        if (w * (46 / TAM.rotuloGrande) <= CARTUCHO.largura) {
          const f = caber(c.valor, fGrande, CARTUCHO.largura, 46, medir);
          linhas.push({ texto: c.valor, fonte: f, tom: "tinta", altura: f.tamanho * 0.95 });
        } else {
          emDuas(c.valor, { familia: texto, tamanho: 46 }, 30, medir).forEach((l) => linhas.push({ ...l, tom: "tinta", altura: l.fonte.tamanho * 1.08 }));
        }
      } else if (i === 2) {
        emDuas(c.valor, { familia: texto, tamanho: TAM.rotuloDestaque, italico: true }, 32, medir).forEach((l) =>
          linhas.push({ ...l, tom: "vinho", altura: l.fonte.tamanho * 1.08 }),
        );
      } else {
        emDuas(c.valor, CAIXA(TAM.rotuloCaixa, 0.12), 30, medir).forEach((l) => linhas.push({ ...l, tom: "tinta", altura: alturaCaixa(l.fonte) }));
      }
      return empilhar(lugar[i].x, lugar[i].y, linhas, medir);
    };
    return { c1: cartucho(0), c2: cartucho(1), c3: cartucho(2), c4: cartucho(3), nome, linha };
  }

  // formato de bebida (o exemplo do sommelier)
  const ano = r.ano
    ? empilhar(
        esqX,
        cimaY,
        [
          { texto: r.anoRotulo ?? "Safra", fonte: CAIXA(TAM.rotuloCaixa, 0.16), tom: "suave", altura: alturaCaixa(CAIXA(TAM.rotuloCaixa)) },
          { texto: r.ano, fonte: { familia: display, tamanho: TAM.rotuloGrande }, tom: "tinta", altura: TAM.rotuloGrande * 0.92 },
        ],
        medir,
      )
    : null;
  // teor: o número grande em cima da unidade ("14%" / "VOL")
  let teor: Bloco | null = null;
  if (r.teor) {
    const partes = r.teor.trim().match(/^([\d.,]+\s*%?)\s*(.*)$/);
    const numero = partes ? partes[1].replace(/\s+/g, "") : r.teor;
    const unidade = partes ? partes[2] : "";
    const fNumero = caber(numero, { familia: display, tamanho: TAM.rotuloGrande }, CARTUCHO.largura, 40, medir);
    teor = empilhar(
      dirX,
      cimaY,
      [
        { texto: numero, fonte: fNumero, tom: "tinta" as const, altura: fNumero.tamanho * 0.92 },
        ...(unidade ? [{ texto: unidade, fonte: caber(unidade, CAIXA(TAM.rotuloCaixa, 0.16), CARTUCHO.largura, 30, medir), tom: "suave" as const, altura: alturaCaixa(CAIXA(TAM.rotuloCaixa)) }] : []),
      ],
      medir,
    );
  }
  const destaque = r.destaque
    ? empilhar(
        esqX,
        baixoY,
        emDuas(r.destaque, { familia: texto, tamanho: TAM.rotuloDestaque, italico: true }, 40, medir).map((l) => ({ ...l, tom: "vinho" as const, altura: l.fonte.tamanho * 1.08 })),
        medir,
      )
    : null;
  const categoria = r.categoria
    ? empilhar(
        dirX,
        baixoY,
        emDuas(r.categoria, CAIXA(TAM.rotuloCaixa, 0.12), 30, medir).map((l) => ({ ...l, tom: "tinta" as const, altura: alturaCaixa(l.fonte) })),
        medir,
      )
    : null;
  return { c1: ano, c2: teor, c3: destaque, c4: categoria, nome, linha };
};

// ---------- para onde a lupa olha ----------

const NOMES_DE_VAGA: Record<string, Vaga> = {
  nome: "nome",
  linha: "linha",
  origem: "linha",
  ano: "c1",
  teor: "c2",
  destaque: "c3",
  categoria: "c4",
  c1: "c1",
  c2: "c2",
  c3: "c3",
  c4: "c4",
  "campo 1": "c1",
  "campo 2": "c2",
  "campo 3": "c3",
  "campo 4": "c4",
};

export type Destino = { vaga: Vaga; trecho?: string };

// "Preço", 1, "nome", "linha", um trecho da linha larga… → a vaga (e o trecho) do rótulo
export const resolverAlvo = (alvo: Alvo | undefined, r: Rotulo): Destino | null => {
  if (alvo === undefined || alvo === null || alvo === "") return null;
  const vagas = textosDasVagas(r);
  const existe = (v: Vaga) => !!vagas[v];
  if (typeof alvo === "number") {
    const v = `c${Math.round(alvo)}` as Vaga;
    return existe(v) ? { vaga: v } : null;
  }
  const k = chave(alvo);
  if (NOMES_DE_VAGA[k] && existe(NOMES_DE_VAGA[k])) return { vaga: NOMES_DE_VAGA[k] };
  const campos: Vaga[] = ["c1", "c2", "c3", "c4"];
  for (const v of campos) {
    const c = vagas[v];
    if (c && (chave(c.nome ?? "") === k || chave(c.valor) === k)) return { vaga: v };
  }
  if (vagas.nome && chave(vagas.nome.valor) === k) return { vaga: "nome" };
  if (vagas.linha && chave(vagas.linha.valor).includes(k)) return { vaga: "linha", trecho: alvo };
  for (const v of campos) {
    const c = vagas[v];
    if (c && (chave(c.valor).includes(k) || chave(c.nome ?? "").includes(k))) return { vaga: v };
  }
  if (vagas.nome && chave(vagas.nome.valor).includes(k)) return { vaga: "nome", trecho: alvo };
  return null;
};

// palavras com significado (4+ letras) de um texto
const palavrasFortes = (s: string) => new Set(chave(s).split(" ").filter((w) => w.length >= 4));

// todos os textos de um momento (para achar o campo do rótulo de que ele fala)
const textosDoMomento = (m: Momento): string => {
  const ignorar = new Set(["tipo", "pessoa", "forma", "modo", "nivel", "tendencia", "icone", "liquido", "desenho", "mapa", "alvo", "trecho"]);
  const juntar = (v: unknown, k = ""): string[] => {
    if (ignorar.has(k)) return [];
    if (typeof v === "string") return [v];
    if (Array.isArray(v)) return v.flatMap((x) => juntar(x));
    if (v && typeof v === "object") return Object.entries(v).flatMap(([kk, vv]) => juntar(vv, kk));
    return [];
  };
  return juntar(m).join(" ");
};

// O trecho aparece na linha larga (sem diferença de acento)?
const naLinha = (trecho: string, r: Rotulo) => {
  const linha = r.linha ?? r.origem;
  if (!linha || !trecho.trim()) return false;
  return semAcentoLetraALetra(linha).includes(semAcentoLetraALetra(trecho.trim()));
};

export type Parada = { em: number; vaga: Vaga; trecho?: string };

// As paradas próprias de cada tipo (além da do momento): itens, lados, país e região
const paradasDosItens = (m: Momento, r: Rotulo): Parada[] => {
  const deItem = (it: { em: number; texto: string; alvo?: Alvo; trecho?: string }): Parada | null => {
    const d = resolverAlvo(it.alvo, r);
    if (d) return { em: it.em - 0.12, vaga: d.vaga, trecho: it.trecho ?? d.trecho };
    if (it.trecho && naLinha(it.trecho, r)) return { em: it.em - 0.12, vaga: "linha", trecho: it.trecho };
    if (naLinha(it.texto, r)) return { em: it.em - 0.12, vaga: "linha", trecho: it.texto };
    return null;
  };
  switch (m.tipo) {
    case "topicos":
    case "passos":
      return m.itens.map(deItem).filter((p): p is Parada => !!p);
    case "comparacao":
      return m.lados.map(deItem).filter((p): p is Parada => !!p);
    case "origem": {
      const lista: Parada[] = [{ em: m.pais.em - 0.12, vaga: "linha", trecho: m.pais.trecho ?? m.pais.texto }];
      if (m.regiao) lista.push({ em: m.regiao.em - 0.12, vaga: "linha", trecho: m.regiao.trecho ?? m.regiao.texto });
      return lista;
    }
    default:
      return [];
  }
};

// A vaga fixa dos tipos de bebida
const VAGA_DO_TIPO: Partial<Record<Momento["tipo"], Vaga>> = { origem: "linha", variedade: "c3", ano: "c1", teor: "c2" };

export type Leitura = {
  // paradas de cada momento (mesma ordem de `momentos`); vazio nos momentos de quadro cheio
  paradas: Parada[][];
  // número de cada vaga, na ordem em que a lupa a lê pela primeira vez
  numero: Partial<Record<Vaga, number>>;
  ordem: Vaga[];
  // quando cada vaga é lida pela primeira vez, e quando o número dela fica impresso no rótulo
  lidaEm: Partial<Record<Vaga, number>>;
  marcaEm: Partial<Record<Vaga, number>>;
  // grupos de momentos seguidos no rótulo (índices em `momentos`)
  grupos: number[][];
};

// Decide, uma vez por plano, onde a lupa para em cada momento do rótulo.
export const planejarLeitura = (momentos: Momento[], r: Rotulo): Leitura => {
  const vagas = textosDasVagas(r);
  const existentes = VAGAS.filter((v) => vagas[v]);
  const lidas = new Set<Vaga>();
  let ultima: Vaga | null = null;
  const proxima = (): Vaga | null => {
    const nova = existentes.find((v) => !lidas.has(v));
    if (nova) return nova;
    if (!existentes.length) return null;
    const i = ultima ? existentes.indexOf(ultima) : -1;
    return existentes[(i + 1) % existentes.length];
  };
  const paradas: Parada[][] = momentos.map((m) => {
    if (!noRotulo(m)) return [];
    const itens = paradasDosItens(m, r);
    let base: Destino | null = resolverAlvo(m.alvo, r);
    if (base && m.trecho) base = { ...base, trecho: m.trecho };
    const fixa = VAGA_DO_TIPO[m.tipo];
    if (!base && fixa && vagas[fixa]) base = { vaga: fixa };
    if (!base && itens.length) base = { vaga: itens[0].vaga };
    if (!base) {
      // o campo cujo texto aparece no momento; senão, o próximo campo ainda não lido
      const fortes = palavrasFortes(textosDoMomento(m));
      let melhor: Vaga | null = null;
      let nota = 0;
      for (const v of existentes) {
        const c = vagas[v];
        if (!c) continue;
        const ws = [...palavrasFortes(`${c.nome ?? ""} ${c.valor}`)];
        const n = ws.filter((w) => fortes.has(w)).length + (lidas.has(v) ? 0 : 0.1);
        if (n >= 1 && n > nota) {
          nota = n;
          melhor = v;
        }
      }
      const v = melhor ?? proxima();
      base = v ? { vaga: v } : null;
    }
    if (!base) return [];
    const lista: Parada[] = [{ em: m.de, vaga: base.vaga, trecho: base.trecho }, ...itens.filter((p) => p.em > m.de)];
    lista.sort((a, b) => a.em - b.em);
    lista.forEach((p) => {
      lidas.add(p.vaga);
      ultima = p.vaga;
    });
    return lista;
  });

  // grupos de momentos seguidos no rótulo
  const grupos: number[][] = [];
  momentos.forEach((m, i) => {
    if (!paradas[i].length) return;
    const g = grupos[grupos.length - 1];
    const anterior = momentos[i - 1];
    if (g && g[g.length - 1] === i - 1 && anterior && Math.abs(anterior.ate - m.de) < 0.01) g.push(i);
    else grupos.push([i]);
  });

  // números, primeira leitura e a marca impressa (quando a lupa sai da vaga pela primeira vez)
  const numero: Partial<Record<Vaga, number>> = {};
  const ordem: Vaga[] = [];
  const lidaEm: Partial<Record<Vaga, number>> = {};
  const marcaEm: Partial<Record<Vaga, number>> = {};
  for (const g of grupos) {
    const seq = g.flatMap((i) => leituraDoMomento(paradas[i], i));
    seq.forEach((p, k) => {
      if (numero[p.vaga] === undefined) {
        ordem.push(p.vaga);
        numero[p.vaga] = ordem.length;
        lidaEm[p.vaga] = p.em;
      }
      const prox = seq[k + 1];
      if (prox && prox.vaga === p.vaga) return;
      const sai = prox ? prox.em : momentos[p.i].ate;
      if (marcaEm[p.vaga] === undefined) marcaEm[p.vaga] = sai - 0.22;
    });
  }
  return { paradas, numero, ordem, lidaEm, marcaEm, grupos };
};
const leituraDoMomento = (ps: Parada[], i: number) => ps.map((p) => ({ ...p, i }));

// ---------- a lupa ----------

export const raioDaLupa = (vaga: Vaga) => (vaga === "linha" ? LUPA.r : vaga === "nome" ? LUPA.rNome : LUPA.rCartucho);

// Centro da vaga (ou de um trecho dela), a largura e a meia altura do que a lupa precisa mostrar
export const pontoDaVaga = (vaga: Vaga, trecho: string | undefined, r: Rotulo, medir: Medidor) => {
  const bloco = layoutDoRotulo(r, medir)[vaga];
  const raio = raioDaLupa(vaga);
  if (!bloco) return { x: 540, y: LINHA.nome, largura: 200, meia: 40, raio };
  if ((vaga === "linha" || vaga === "nome") && trecho) {
    for (const linha of bloco.linhas) {
      const i = semAcentoLetraALetra(linha.texto).indexOf(semAcentoLetraALetra(trecho.trim()));
      if (i < 0) continue;
      const larguraLinha = medir(linha.texto, linha.fonte);
      const antes = medir(linha.texto.slice(0, i), linha.fonte);
      const pedaco = medir(linha.texto.slice(i, i + trecho.trim().length), linha.fonte);
      const meia = bloco.linhas.length > 1 ? linha.altura / 2 + 4 : bloco.meia;
      return { x: bloco.x - larguraLinha / 2 + antes + pedaco / 2, y: bloco.y + linha.dy, largura: pedaco, meia, raio };
    }
  }
  return { x: bloco.x, y: bloco.y, largura: bloco.largura, meia: bloco.meia, raio };
};

// quanto a lente amplia: o campo inteiro cabe nela, de 1,15× a 1,6×
export const ampliacao = (largura: number, raio: number) => Math.min(1.6, Math.max(1.15, (0.9 * 2 * raio) / Math.max(1, largura)));

// `campo`: a posição do momento entre os momentos do rótulo (dá a variedade de aproximação da câmera)
type ParadaNoRotulo = Parada & { inicio: number; x: number; y: number; largura: number; meia: number; raio: number; k: number; campo: number };

const paradasDoGrupo = (grupo: number[], momentos: Momento[], leitura: Leitura, r: Rotulo, medir: Medidor): ParadaNoRotulo[] => {
  const primeiro = momentos[grupo[0]];
  const doRotulo = leitura.paradas.map((ps, i) => (ps.length ? i : -1)).filter((i) => i >= 0);
  return grupo
    .flatMap((i) => leitura.paradas[i].map((p) => ({ ...p, campo: doRotulo.indexOf(i) })))
    .sort((a, b) => a.em - b.em)
    // a primeira parada espera a troca de layout terminar
    .map((p, k) => ({ ...p, k, inicio: k === 0 ? primeiro.de + 0.5 : p.em, ...pontoDaVaga(p.vaga, p.trecho, r, medir) }));
};

// o caminho reto da lupa entre duas paradas encostaria no camafeu (moldura incluída)?
const cruzaOCamafeu = (a: { x: number; y: number; raio: number }, b: { x: number; y: number; raio: number }) => {
  for (let i = 0; i <= 20; i++) {
    const f = i / 20;
    const x = mistura(a.x, b.x, f);
    const y = mistura(a.y, b.y, f);
    const r = mistura(a.raio, b.raio, f);
    const nx = (x - CAMAFEU.cx) / (CAMAFEU.rx + 24 + r);
    const ny = (y - CAMAFEU.cy) / (CAMAFEU.ry + 24 + r);
    if (nx * nx + ny * ny < 1) return true;
  }
  return false;
};

const grupoNoTempo = (t: number, momentos: Momento[], leitura: Leitura, antes: number, depois: number) =>
  leitura.grupos.find((g) => t >= momentos[g[0]].de - antes && t < momentos[g[g.length - 1]].ate + depois);

export type EstadoDaLupa = { x: number; y: number; raio: number; ampliacao: number; presenca: number; vaga: Vaga; faixa: number; numero: number };

// Estado da lupa no instante t, em coordenadas do rótulo (a câmera transforma depois)
export const lupaNoTempo = (t: number, momentos: Momento[], leitura: Leitura, r: Rotulo, medir: Medidor): EstadoDaLupa | null => {
  const grupo = grupoNoTempo(t, momentos, leitura, ANTES + 0.1, 0.7);
  if (!grupo) return null;
  const pontos = paradasDoGrupo(grupo, momentos, leitura, r, medir);
  if (!pontos.length) return null;
  // entra depois da troca de layout
  const entrada = prog(t, momentos[grupo[0]].de + 0.5, 0.7);
  const fim = momentos[grupo[grupo.length - 1]].ate;
  const saida = prog(t, fim - ANTES, 0.55, firme);
  let { x, y, raio } = pontos[0];
  let amp = ampliacao(pontos[0].largura, pontos[0].raio);
  let vaga = pontos[0].vaga;
  let faixa = pontos[0].meia;
  let levanta = 1;
  for (let i = 1; i < pontos.length; i++) {
    const para = pontos[i];
    const de = pontos[i - 1];
    // se o caminho reto passaria por cima do camafeu, a lupa sai do papel e pousa no campo novo
    const salto = cruzaOCamafeu(de, para);
    const p = prog(t, para.inicio, salto ? 0.5 : 0.6, salto ? (v: number) => v : firme);
    if (p <= 0) break;
    const k = salto ? (p < 0.5 ? 0 : 1) : p;
    if (salto) levanta = Math.min(levanta, Math.abs(1 - 2 * p));
    x = mistura(x, para.x, k);
    y = mistura(y, para.y, k);
    raio = mistura(raio, para.raio, k);
    amp = mistura(amp, ampliacao(para.largura, para.raio), k);
    faixa = mistura(faixa, para.meia, k);
    if (k >= 0.5) vaga = para.vaga;
  }
  // entra e sai pelo lado do campo (nunca cruza o camafeu): campos da esquerda pela esquerda
  const ladoEntrada = pontos[0].x < 540 ? -1 : 1;
  const ladoSaida = x < 540 ? -1 : 1;
  return {
    x: x + (1 - entrada) * 560 * ladoEntrada + saida * 620 * ladoSaida,
    y: y + (1 - entrada) * 260 + saida * 200,
    raio: raio * (0.88 + 0.12 * levanta),
    ampliacao: amp,
    // na saída ela some rápido: não fica por cima da pessoa que cresce de volta
    presenca: Math.min(entrada, 1 - Math.min(1, saida * 2.2), levanta),
    vaga,
    faixa,
    numero: leitura.numero[vaga] ?? 1,
  };
};

// ---------- a câmera sobre o rótulo ----------
//
// Em cada parada a câmera aproxima um pouco (6–12%) e puxa o campo para perto do meio da área do
// rótulo; o camafeu vai junto. Tudo o que é do rótulo (papel, pessoa, números, lupa) passa por ela;
// a ficha não.

export type Camera = { s: number; tx: number; ty: number };
export const IDENTIDADE: Camera = { s: 1, tx: 0, ty: 0 };
const ESCALAS = [1.1, 1.12, 1.08, 1.12, 1.1, 1.08];

// `fundoLinha`: a base da linha larga (ela pode ter duas linhas)
const cameraDoCampo = (p: { x: number; y: number; raio: number }, s0: number, fichaTopo: number, fundoLinha: number): Camera => {
  const centro = { x: 540, y: (96 + fichaTopo) / 2 };
  // puxa o campo para o meio: bastante na vertical, pouco na horizontal
  const kx = 0.06;
  const ky = 0.18;
  for (let s = s0; s >= 1; s -= 0.02) {
    let tx = p.x + (centro.x - p.x) * kx - p.x * s;
    let ty = p.y + (centro.y - p.y) * ky - p.y * s;
    // os cartuchos dos dois lados continuam inteiros na tela; em cima, no máximo uma faixa de vidro
    tx = Math.min(24 - (CARTUCHO.esqX - CARTUCHO.largura / 2) * s, Math.max(1056 - (CARTUCHO.dirX + CARTUCHO.largura / 2) * s, tx));
    ty = Math.min(120 - 96 * s, ty);
    // a linha larga nunca fica cortada pela borda da ficha: inteira acima dela
    if (p.y < LINHA.nome) ty = Math.min(ty, fichaTopo - 30 - (fundoLinha - 20) * s);
    // a lupa não encosta na ficha; o alto do camafeu não sai da tela
    const tyMax = fichaTopo - 14 - (p.y + p.raio) * s;
    const tyMin = -14 - (CAMAFEU.cy - CAMAFEU.ry - 24) * s;
    if (tyMin <= tyMax) return { s, tx, ty: Math.min(tyMax, Math.max(tyMin, ty)) };
  }
  return IDENTIDADE;
};

export const cameraNoTempo = (t: number, momentos: Momento[], leitura: Leitura, r: Rotulo, medir: Medidor, fichaTopo: number): Camera => {
  const grupo = grupoNoTempo(t, momentos, leitura, 0.5, 1);
  if (!grupo) return IDENTIDADE;
  const pontos = paradasDoGrupo(grupo, momentos, leitura, r, medir);
  const blocoLinha = layoutDoRotulo(r, medir).linha;
  const fundoLinha = blocoLinha ? blocoLinha.y + blocoLinha.meia : LINHA.origem + 20;
  let cam = IDENTIDADE;
  for (const p of pontos) {
    const q = prog(t, p.inicio, 0.9, firme);
    if (q <= 0) break;
    const alvo = cameraDoCampo(p, ESCALAS[p.campo % ESCALAS.length], fichaTopo, fundoLinha);
    cam = { s: mistura(cam.s, alvo.s, q), tx: mistura(cam.tx, alvo.tx, q), ty: mistura(cam.ty, alvo.ty, q) };
  }
  const volta = prog(t, momentos[grupo[grupo.length - 1]].ate - ANTES, DUR_TROCA, firme);
  return { s: mistura(cam.s, 1, volta), tx: mistura(cam.tx, 0, volta), ty: mistura(cam.ty, 0, volta) };
};

export const naCamera = (c: Camera, x: number, y: number) => ({ x: x * c.s + c.tx, y: y * c.s + c.ty });

// Onde fica o número da vaga depois de lida: em cima do cartucho, ou à esquerda da linha larga
export const marcaDaVaga = (vaga: Vaga, r: Rotulo, medir: Medidor) => {
  const bloco = layoutDoRotulo(r, medir)[vaga];
  if (!bloco) return null;
  if (vaga === "nome" || vaga === "linha") return { x: bloco.x - bloco.largura / 2 - 42, y: bloco.y };
  return { x: bloco.x, y: bloco.y - bloco.meia - 30 };
};
