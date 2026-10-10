// Gramática de layout do modelo Arquivo: a pessoa em tela cheia é o presente; quando a fala vira
// registro, ela vira uma FOTO IMPRESSA numa folha de dossiê, que muda de lugar a cada momento
// (larga embaixo, em cima, no canto), e os documentos deslizam por cima.
import { Easing, interpolate } from "remotion";
import { prog } from "./anim";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_COM_LEGENDA, BASE_CONTEUDO, MARGEM } from "./tema";

// Layouts que cada componente aceita (o primeiro é o padrão). Um `layout` fora da lista é ignorado.
// "esquerda"/"direita" (foto em coluna) ficam só para o demo antigo: o padrão nunca é coluna.
export const ACEITOS: Record<Momento["tipo"], Layout[]> = {
  credito: ["cheio"],
  ficha: ["base", "topo", "esquerda", "direita"],
  local: ["canto"],
  escala: ["canto"],
  camadas: ["topo", "base"],
  pessoas: ["base", "topo", "direita", "esquerda"],
  linha: ["cheio"],
  cta: ["cheio"],
  abertura: ["cheio"],
  numero: ["cheio"],
  destaque: ["cheio"],
  frase: ["cheio"],
  pergunta: ["cheio"],
  topicos: ["base", "topo", "canto"],
  passos: ["canto", "base", "topo"],
  comparacao: ["base", "topo", "canto"],
  grafico: ["topo", "base", "canto"],
  definicao: ["canto", "base", "topo"],
};

export const LAYOUT_PADRAO = Object.fromEntries(Object.entries(ACEITOS).map(([k, v]) => [k, v[0]])) as Record<Momento["tipo"], Layout>;

// No canto, o título do documento fica ao lado da foto: sem título, aquele pedaço ficaria vazio,
// então lista, passos, comparação e gráfico sem `titulo` não usam o canto.
const SEM_CANTO_SEM_TITULO = ["topicos", "passos", "comparacao", "grafico"];
const aceitos = (m: Momento) =>
  SEM_CANTO_SEM_TITULO.includes(m.tipo) && !("titulo" in m && typeof m.titulo === "string" && m.titulo.trim()) ? ACEITOS[m.tipo].filter((l) => l !== "canto") : ACEITOS[m.tipo];

export const layoutDe = (m: Momento): Layout => {
  const lista = aceitos(m);
  return m.layout && lista.includes(m.layout) ? m.layout : lista[0];
};
export const naFolha = (m: Momento) => layoutDe(m) !== "cheio";

// A foto muda de lugar a cada documento: quando dois momentos de folha seguidos cairiam no mesmo
// layout (e o segundo não pediu um), o segundo vai para o próximo layout que ele aceita.
export const alternarLayouts = (momentos: Momento[]): Momento[] => {
  const saida: Momento[] = [];
  momentos.forEach((m, i) => {
    const antes = saida[i - 1];
    if (!m.layout && antes && naFolha(m) && naFolha(antes) && m.de - antes.ate < 0.35 && layoutDe(antes) === layoutDe(m)) {
      const outro = aceitos(m).find((l) => l !== layoutDe(antes) && l !== "esquerda" && l !== "direita");
      if (outro) {
        saida.push({ ...m, layout: outro } as Momento);
        return;
      }
    }
    saida.push(m);
  });
  return saida;
};

// Borda branca da foto impressa (px) e inclinação de cada layout (graus): a foto "caiu" na mesa
export const BORDA = 16;
const INCLINACAO: Record<Layout, number> = { cheio: 0, base: 0.9, esquerda: -1.3, direita: 1.3, topo: -0.8, canto: 2.2 };

// Canto da foto no layout "canto" (o documento não desenha nada aqui)
export const CANTO_FOTO = { x: 690, y: 620 };

// Partes de um documento num layout: `cabeca` (título, rótulos) e `corpo` (itens, desenho).
// No canto, o título fica ao lado da foto e o corpo começa abaixo dela, na largura toda.
export const partesDaRegiao = (layout: Layout, regiao: Regiao, alturaCabeca: number) => {
  if (layout === "canto") {
    const cabeca = { x: regiao.x, y: regiao.y, w: CANTO_FOTO.x - 40 - regiao.x, h: CANTO_FOTO.y - regiao.y };
    const corpo = { x: regiao.x, y: CANTO_FOTO.y + 30, w: regiao.w, h: regiao.y + regiao.h - CANTO_FOTO.y - 30 };
    return { cabeca, corpo };
  }
  const cabeca = { x: regiao.x, y: regiao.y, w: regiao.w, h: alturaCabeca };
  const corpo = { x: regiao.x, y: regiao.y + alturaCabeca, w: regiao.w, h: regiao.h - alturaCabeca };
  return { cabeca, corpo };
};

// Caixas da imagem da pessoa (sem a borda) em cada layout, em px no quadro 1080×1920
export const caixaDoLayout = (layout: Layout, plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ajuste = plano.caixas?.[layout] ?? {};
  switch (layout) {
    case "cheio":
      // tela cheia sempre (mesmo num recorte 3:4, que é ampliado para cobrir); o rosto fica onde está
      return {
        x: 0,
        y: 0,
        w: 1080,
        h: 1920,
        raio: 0,
        zoom: ajuste.zoom ?? zoomCheio,
        ancoraY: ajuste.ancoraY ?? Math.min(0.5, (plano.rosto.y * 1920) / videoAltura),
      };
    case "esquerda":
      return { x: 64, y: 240, w: 440, h: 1150, raio: 0, zoom: ajuste.zoom ?? 1.1, ancoraY: ajuste.ancoraY ?? 0.26 };
    case "direita":
      return { x: 576, y: 240, w: 440, h: 1150, raio: 0, zoom: ajuste.zoom ?? 1.1, ancoraY: ajuste.ancoraY ?? 0.26 };
    case "topo":
      return { x: 170, y: 198, w: 740, h: 570, raio: 0, zoom: ajuste.zoom ?? 1.45, ancoraY: ajuste.ancoraY ?? 0.44 };
    case "base":
      // foto larga embaixo, com a cabeça inteira e folga para a pessoa se mexer
      return { x: 150, y: FOTO_BASE_Y, w: 780, h: 500, raio: 0, zoom: ajuste.zoom ?? 1.25, ancoraY: ajuste.ancoraY ?? 0.46 };
    case "canto":
      return { x: 724, y: 222, w: 292, h: 364, raio: 0, zoom: ajuste.zoom ?? 2.3, ancoraY: ajuste.ancoraY ?? 0.42 };
  }
};

// topo da foto larga do layout "base" (a fita sobe ~36 px acima disso)
export const FOTO_BASE_Y = 990;

// Onde o documento de cada layout é desenhado (px no quadro)
export type Regiao = { x: number; y: number; w: number; h: number };

// Com legenda, a região termina acima dela; sem legenda, desce até perto da interface do app.
// (No layout "base" a legenda fica sobre a foto, que está embaixo: a região não muda.)
export const regiaoDoLayout = (layout: Layout, comLegenda = false): Regiao => {
  const base = comLegenda ? BASE_COM_LEGENDA : BASE_CONTEUDO;
  switch (layout) {
    case "esquerda":
      return { x: 536, y: 236, w: 1080 - MARGEM - 536, h: base - 236 };
    case "direita":
      return { x: MARGEM, y: 236, w: 540 - MARGEM, h: base - 236 };
    case "topo":
      return { x: MARGEM, y: 820, w: 1080 - 2 * MARGEM, h: base - 820 };
    case "base":
      // a parte de cima da folha, até um pouco acima da fita da foto
      return { x: MARGEM, y: 236, w: 1080 - 2 * MARGEM, h: FOTO_BASE_Y - 60 - 236 };
    case "canto":
      // a folha inteira; o canto de cima à direita (x > 690, y < 620) é da foto
      return { x: MARGEM, y: 222, w: 1080 - 2 * MARGEM, h: base - 222 };
    case "cheio":
      return { x: 0, y: 0, w: 1080, h: 1920 };
  }
};

// ---------- a pessoa ao longo do tempo ----------

// `layout` = para onde a foto vai; `vemDe` = de onde ela sai (null no primeiro estado)
export type EstadoPessoa = EstadoDaCaixa & { rot: number; borda: number; layout: Layout; vemDe: Layout | null };

const TROCA = 0.65;

export const estadosDaPessoa = (plano: Plano): EstadoPessoa[] => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  type Trecho = { de: number; layout: Layout };
  const trechos: Trecho[] = [{ de: 0, layout: "cheio" }];
  const empurrar = (de: number, layout: Layout) => {
    const ultimo = trechos[trechos.length - 1];
    if (Math.abs(ultimo.de - de) < 0.02) ultimo.layout = layout;
    else if (ultimo.layout !== layout || layout !== "cheio") trechos.push({ de, layout });
  };
  momentos.forEach((m, i) => {
    empurrar(Math.max(0, m.de), layoutDe(m));
    const prox = momentos[i + 1];
    // volta para a tela cheia se houver um respiro antes do próximo momento
    if (!prox || prox.de - m.ate > 0.3) empurrar(m.ate, "cheio");
  });
  // dois trechos seguidos no mesmo layout de folha viram um só (a foto não "pula" no lugar)
  const unidos = trechos.filter((tr, i) => i === 0 || tr.layout !== trechos[i - 1].layout);

  // a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
  const cortes = plano.cortesEm ?? [];
  for (const tr of unidos) {
    const perto = cortes.find((c) => c - tr.de > -0.16 && c - tr.de < 0.1);
    if (perto !== undefined && tr.de > 0) tr.de = perto;
  }

  const estados: EstadoPessoa[] = [];
  let zoomCheio = 1;
  let anterior: Layout | null = null;
  unidos.forEach((tr, i) => {
    const fim = unidos[i + 1]?.de ?? plano.duracao + 1;
    const extras = { rot: INCLINACAO[tr.layout], borda: tr.layout === "cheio" ? 0 : BORDA, layout: tr.layout, vemDe: anterior };
    if (tr.layout === "cheio") {
      if (anterior !== null) zoomCheio = zoomCheio === 1 ? 1.08 : 1;
      estados.push({ de: tr.de, caixa: caixaDoLayout("cheio", plano, zoomCheio), dur: anterior ? TROCA : 0.001, ...extras });
    } else {
      estados.push({ de: tr.de, caixa: caixaDoLayout(tr.layout, plano), dur: TROCA, ...extras });
    }
    // cortes dentro do trecho: troca seca de zoom (6–8 %), disfarça o pulo do corte
    let ultimo = tr.de;
    for (const c of cortes) {
      if (c <= tr.de + 0.8 || c >= fim - 0.5 || c - ultimo < 1.2) continue;
      const base = estados[estados.length - 1];
      if (tr.layout === "cheio") {
        zoomCheio = zoomCheio === 1 ? 1.08 : 1;
        estados.push({ ...base, de: c, caixa: caixaDoLayout("cheio", plano, zoomCheio), dur: 0.001 });
      } else {
        const z = base.caixa.zoom ?? 1;
        const inicial = caixaDoLayout(tr.layout, plano).zoom ?? 1;
        estados.push({ ...base, de: c, caixa: { ...base.caixa, zoom: Math.abs(z - inicial) < 0.01 ? inicial * 1.07 : inicial }, dur: 0.001 });
      }
      ultimo = c;
    }
    anterior = tr.layout;
  });
  return estados;
};

const suave = Easing.bezier(0.65, 0, 0.35, 1);

// Enquanto a foto muda de lugar, ela passa POR CIMA dos documentos: encolhe revelando o documento
// que chega e cresce cobrindo o que sai, sem nenhum papel por cima do rosto. (Nas colunas do demo
// antigo, os documentos continuam por cima da foto, como foi aprovado.)
// Em tela cheia o vídeo também fica por cima dos documentos (os supers ficam numa camada acima
// dele): o documento que sai pode ficar parado embaixo enquanto a foto cresce.
export const fotoPorCima = (t: number, estados: EstadoPessoa[]) => {
  let i = -1;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const e = estados[i];
  if (!e) return false;
  const coluna = (l: Layout | null) => l === "esquerda" || l === "direita";
  if (coluna(e.layout) || coluna(e.vemDe)) return false;
  if (e.layout === "cheio") return true;
  return !!e.vemDe && (e.dur ?? 0) >= 0.05 && t <= e.de + (e.dur ?? 0);
};

// Inclinação e borda no instante t (a caixa vem do caixaNoTempo do motor, com o mesmo tempo de troca)
export const extrasNoTempo = (t: number, estados: EstadoPessoa[]) => {
  let i = -1;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  if (i <= 0) return { rot: estados[0]?.rot ?? 0, borda: estados[0]?.borda ?? 0 };
  const a = estados[i - 1];
  const b = estados[i];
  const p = interpolate(t, [b.de, b.de + (b.dur ?? 0.55)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: suave });
  return { rot: a.rot + (b.rot - a.rot) * p, borda: a.borda + (b.borda - a.borda) * p };
};

// ---------- o passado (imagem vira arquivo) ----------

export const ENTRA_PASSADO = 0.9;
export const SAI_PASSADO = 1.2;

export const faixasDoPassado = (plano: Plano) => {
  if (plano.passado) return plano.passado;
  const faixas: { de: number; ate: number }[] = [];
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  for (const m of momentos) {
    if (!naFolha(m)) continue;
    const ultima = faixas[faixas.length - 1];
    if (ultima && m.de - ultima.ate < 0.35) ultima.ate = m.ate;
    else faixas.push({ de: m.de, ate: m.ate });
  }
  return faixas;
};

// Faixa da imagem (0 = topo, 1 = base) que está em "arquivo" no instante t.
// Entrando no passado, o preto e branco desce como a luz de um scanner; saindo, a cor volta descendo.
export const passadoNoTempo = (t: number, faixas: { de: number; ate: number }[]) => {
  for (const f of faixas) {
    if (t < f.de) continue;
    if (t < f.ate) return { de: 0, ate: prog(t, f.de, ENTRA_PASSADO, suave) };
    const p = prog(t, f.ate, SAI_PASSADO, suave);
    if (p < 1) return { de: p, ate: 1 };
  }
  return { de: 0, ate: 0 };
};
