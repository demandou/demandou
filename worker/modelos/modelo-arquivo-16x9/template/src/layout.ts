// Gramática de layout do modelo Arquivo no quadro DEITADO (16:9, 1920×1080), a versão do vídeo
// completo do YouTube: a pessoa em tela cheia é o presente; quando a fala vira registro, ela vira uma
// FOTO IMPRESSA numa folha de dossiê e os documentos deslizam por cima da mesa.
//
// A regra é a da aula 9 do curso (editar uma aula horizontal): a tela cheia é a base; quando o bloco
// pede apoio visual, a pessoa vai para uma MOLDURA do lado DIREITO, com o rosto centralizado e
// acompanhado de leve (o rastro do cortar.mjs), e o documento ocupa o QUADRO do lado ESQUERDO.
// No Arquivo a moldura é a foto de arquivo presa na folha. Ela fica sempre do lado direito e muda de
// lugar a cada documento (a assinatura do movimento do modelo continua):
//
//   [ documento (o quadro)                  |  FOTO (rosto no centro) ]
//
//   direita = foto alta, no meio da coluna da direita (a moldura da aula 9 sem variação)
//   topo    = foto larga, no alto da coluna da direita
//   base    = foto larga, embaixo na coluna da direita
//   canto   = foto pequena no canto de cima à direita; o título do documento fica ao lado dela e o
//             corpo ocupa a largura toda, embaixo
//   esquerda = no quadro deitado vale como `direita` (a pessoa fica sempre à direita)
import { Easing, interpolate } from "remotion";
import { prog } from "./anim";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Layout, Momento, Plano } from "./plano";
import { BASE_COM_LEGENDA, BASE_CONTEUDO, MARGEM, QUADRO, TOPO_FOLHA } from "./tema";

// Layouts que cada componente aceita (o primeiro é o padrão). Um `layout` fora da lista é ignorado.
// No 16:9 todo documento de folha também aceita `direita` (a moldura alta da aula 9).
export const ACEITOS: Record<Momento["tipo"], Layout[]> = {
  credito: ["cheio"],
  ficha: ["base", "topo", "direita", "esquerda"],
  local: ["canto"],
  escala: ["canto"],
  camadas: ["topo", "base", "direita"],
  pessoas: ["base", "topo", "direita", "esquerda"],
  linha: ["cheio"],
  cta: ["cheio"],
  abertura: ["cheio"],
  numero: ["cheio"],
  destaque: ["cheio"],
  frase: ["cheio"],
  pergunta: ["cheio"],
  topicos: ["base", "topo", "canto", "direita"],
  passos: ["canto", "base", "topo", "direita"],
  comparacao: ["base", "topo", "canto", "direita"],
  grafico: ["topo", "base", "canto", "direita"],
  definicao: ["canto", "base", "topo", "direita"],
};

export const LAYOUT_PADRAO = Object.fromEntries(Object.entries(ACEITOS).map(([k, v]) => [k, v[0]])) as Record<Momento["tipo"], Layout>;

// No canto, o título do documento fica ao lado da foto: sem título, aquele pedaço ficaria vazio,
// então lista, passos, comparação e gráfico sem `titulo` não usam o canto.
const SEM_CANTO_SEM_TITULO = ["topicos", "passos", "comparacao", "grafico"];
const aceitos = (m: Momento) =>
  SEM_CANTO_SEM_TITULO.includes(m.tipo) && !("titulo" in m && typeof m.titulo === "string" && m.titulo.trim()) ? ACEITOS[m.tipo].filter((l) => l !== "canto") : ACEITOS[m.tipo];

// `esquerda` vale como `direita`: no quadro deitado a pessoa fica sempre do lado direito (aula 9)
const normal = (l: Layout | undefined): Layout | undefined => (l === "esquerda" ? "direita" : l);

export const layoutDe = (m: Momento): Layout => {
  const lista = aceitos(m);
  const pedido = normal(m.layout);
  return pedido && lista.includes(pedido) ? pedido : lista[0];
};
export const naFolha = (m: Momento) => layoutDe(m) !== "cheio";

// A foto muda de lugar a cada documento: quando dois momentos de folha seguidos cairiam no mesmo
// layout (e o segundo não pediu um), o segundo vai para o próximo layout que ele aceita.
export const alternarLayouts = (momentos: Momento[]): Momento[] => {
  const saida: Momento[] = [];
  momentos.forEach((m, i) => {
    const antes = saida[i - 1];
    if (!m.layout && antes && naFolha(m) && naFolha(antes) && m.de - antes.ate < 0.35 && layoutDe(antes) === layoutDe(m)) {
      const outro = aceitos(m).find((l) => l !== layoutDe(antes) && l !== "esquerda");
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
const INCLINACAO: Record<Layout, number> = { cheio: 0, base: 0.9, esquerda: 1.3, direita: 1.3, topo: -0.8, canto: 2.2 };

// As fotos de cada layout (sem a borda), em px no quadro 1920×1080. Todas na coluna da direita.
const FOTO = {
  direita: { x: 1214, y: 186, w: 520, h: 640 },
  topo: { x: 1150, y: 150, w: 640, h: 430 },
  base: { x: 1150, y: 404, w: 640, h: 430 },
  canto: { x: 1460, y: 142, w: 336, h: 296 },
};
// quanto o rosto ocupa da largura da foto em cada layout (o zoom sai disso e do rosto medido)
const ROSTO_NA_FOTO = { direita: 0.44, topo: 0.34, base: 0.34, canto: 0.52 };
const ANCORA_Y = { direita: 0.4, topo: 0.44, base: 0.44, canto: 0.44 };

// Canto da foto no layout "canto" (o documento não desenha nada à direita de x e acima de y)
export const CANTO_FOTO = { x: FOTO.canto.x - BORDA - 22, y: FOTO.canto.y + FOTO.canto.h + BORDA + 18 };

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

const alturaDoVideo = (plano: Plano) => Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

// a largura média do rosto no quadro (fração), do rastro do cortar.mjs ou o padrão do 16:9 (~13%)
const larguraDoRosto = (plano: Plano) => {
  const r = (plano.rosto as { rastro?: { largura?: number } }).rastro;
  return r?.largura && r.largura > 0.03 ? r.largura : 0.13;
};

// Zoom da foto para o rosto ocupar `fracao` da largura dela. No 16:9 o rosto gravado é estreito
// (~13% da largura do quadro): sem isto, a foto mostraria a sala inteira e um rosto pequeno.
// Gravação de perto (rosto grande) fica em 1 (o menor enquadramento que cobre a foto).
const zoomDoRosto = (plano: Plano, w: number, h: number, fracao: number) => {
  const s0 = Math.max(w / QUADRO.w, h / alturaDoVideo(plano));
  const rostoPx = larguraDoRosto(plano) * QUADRO.w * s0;
  return Math.max(1, Math.min(3.2, (fracao * w) / Math.max(1, rostoPx)));
};

// Caixas da imagem da pessoa (sem a borda) em cada layout, em px no quadro 1920×1080
export const caixaDoLayout = (layout: Layout, plano: Plano, zoomCheio = 1): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  const l = normal(layout) as Layout;
  const ajuste = plano.caixas?.[l] ?? plano.caixas?.[layout] ?? {};
  if (l === "cheio") {
    // tela cheia sempre, como foi gravado; o rosto fica onde está
    return {
      x: 0,
      y: 0,
      w: QUADRO.w,
      h: QUADRO.h,
      raio: 0,
      zoom: ajuste.zoom ?? zoomCheio,
      ancoraY: ajuste.ancoraY ?? Math.min(0.5, (plano.rosto.y * QUADRO.h) / videoAltura),
    };
  }
  const chave = l as keyof typeof FOTO;
  const f = FOTO[chave];
  return { ...f, raio: 0, zoom: ajuste.zoom ?? zoomDoRosto(plano, f.w, f.h, ROSTO_NA_FOTO[chave]), ancoraY: ajuste.ancoraY ?? ANCORA_Y[chave] };
};

// Onde o documento de cada layout é desenhado (px no quadro)
export type Regiao = { x: number; y: number; w: number; h: number };

// O quadro do documento: da margem esquerda até um pouco antes da borda da foto
const ateAFoto = (f: { x: number }) => f.x - BORDA - 56 - MARGEM;

// Com legenda, a região termina acima dela; sem legenda, desce até perto dos controles do player.
export const regiaoDoLayout = (layout: Layout, comLegenda = false): Regiao => {
  const base = comLegenda ? BASE_COM_LEGENDA : BASE_CONTEUDO;
  switch (normal(layout)) {
    case "direita":
      return { x: MARGEM, y: TOPO_FOLHA, w: ateAFoto(FOTO.direita), h: base - TOPO_FOLHA };
    case "topo":
      return { x: MARGEM, y: TOPO_FOLHA, w: ateAFoto(FOTO.topo), h: base - TOPO_FOLHA };
    case "base":
      return { x: MARGEM, y: TOPO_FOLHA, w: ateAFoto(FOTO.base), h: base - TOPO_FOLHA };
    case "canto":
      // a folha inteira; o canto de cima à direita (x > CANTO_FOTO.x, y < CANTO_FOTO.y) é da foto
      return { x: MARGEM, y: TOPO_FOLHA, w: QUADRO.w - 2 * MARGEM, h: base - TOPO_FOLHA };
    default:
      return { x: 0, y: 0, w: QUADRO.w, h: QUADRO.h };
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
// que chega e cresce cobrindo o que sai, sem nenhum papel por cima do rosto.
// Em tela cheia o vídeo também fica por cima dos documentos (os supers ficam numa camada acima
// dele): o documento que sai pode ficar parado embaixo enquanto a foto cresce.
export const fotoPorCima = (t: number, estados: EstadoPessoa[]) => {
  let i = -1;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const e = estados[i];
  if (!e) return false;
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
