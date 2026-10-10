// A gramática do Transformação: três lugares para a pessoa.
//  1. quadro cheio: a pessoa inteira, o texto num cartão claro na altura do peito;
//  2. painel: o painel de linho (a foto, a lista, a comparação…) em cima e a pessoa numa moldura
//     larga embaixo. O painel desce junto com a emenda: entra empurrando a pessoa e sai subindo
//     enquanto ela cresce (nenhum quadro com buraco);
//  3. janela: a foto toma a tela inteira (a revelação) e a pessoa vai para uma janela embaixo.
import { Easing, interpolate } from "remotion";
import { CHEIO, type Caixa } from "./motor/caixa";
import { noPainel, type Momento, type Plano } from "./plano";

// onde o painel encontra a pessoa (px)
export const COSTURA = 1160;
// a janela da revelação: embaixo, no centro, cobrindo o chão da foto (o que menos importa nela)
export const JANELA: Caixa = { x: 640, y: 1400, w: 400, h: 420, raio: 34, zoom: 2.2, ancoraY: 0.42 };
// área útil do painel para texto (a interface do Reels ocupa ~110 px no topo)
export const AREA = { x: 60, w: 960, topo: 150, base: COSTURA - 60 };
export const DUR_TROCA = 0.45;

const suave = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const ordenar = (plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de);

// Um momento nunca invade o seguinte (termina quando o próximo começa).
export const semSobreposicao = (plano: Plano): Plano => {
  const ordem = ordenar(plano);
  return {
    ...plano,
    momentos: ordem.map((m, i) => {
      const proximo = ordem[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

type Lugar = "cheio" | "painel" | "janela";
type Estado = { de: number; lugar: Lugar };
type Painel = { y: number; h: number };

export type Geometria = {
  caixa: Caixa;
  // o painel de cima, em px de tela (y negativo = ainda acima do quadro)
  painel: Painel;
  // 0..1: quanto a pessoa está na janela (para a moldura da janela)
  janela: number;
  // 0..1: quanto a pessoa está na moldura de baixo (para a emenda)
  embaixo: number;
  yLegenda: number;
};

export type Layout = {
  em: (t: number) => Geometria;
  yPeito: number;
  // instante em que um cartão do quadro cheio pode aparecer (a pessoa já voltou ao quadro cheio)
  livreDesde: (de: number) => number;
  // quando o momento sai de cena (desmonta)
  fim: (m: Momento) => number;
  // o momento seguinte também fica no painel, colado: o conteúdo sai antes de o novo entrar
  cruza: (m: Momento) => { vem: boolean; vai: boolean };
};

export const prepararLayout = (plano: Plano): Layout => {
  const ordem = ordenar(plano);
  const zona = plano.zona ?? { topo: 976, altura: 465 };

  // a sequência de lugares ao longo do vídeo
  const estados: Estado[] = [{ de: -10, lugar: "cheio" }];
  const ir = (de: number, lugar: Lugar) => {
    const u = estados[estados.length - 1];
    if (u.lugar !== lugar) estados.push({ de, lugar });
  };
  ordem.forEach((m, i) => {
    const proximo = ordem[i + 1];
    if (noPainel(m)) {
      const jan = m.tipo === "antesdepois" && m.janelaEm !== undefined ? clamp(m.janelaEm, m.de, m.ate) : null;
      if (jan === null || jan > m.de + 0.05) ir(m.de, "painel");
      if (jan !== null) ir(jan, "janela");
      if (jan !== null && proximo?.tipo === "cta") return; // a janela fica até o fim: a chamada vem por cima da foto
      if (!proximo || !noPainel(proximo) || proximo.de - m.ate > 0.4) ir(m.ate, "cheio");
    } else if (m.tipo === "cta" && estados[estados.length - 1].lugar === "janela") return;
    else ir(m.de, "cheio");
  });

  // pessoa embaixo: o rosto um pouco acima do meio da moldura
  const banda: Caixa = { x: 0, y: COSTURA, w: 1080, h: 1920 - COSTURA, raio: 0, zoom: 1, ancoraY: 0.44 };
  const cortes = [...(plano.cortesEm ?? [])].sort((a, b) => a - b);
  // a cada corte do vídeo, o enquadramento troca de leve (o pulo do corte some)
  const zoomCorte = (t: number) => (cortes.filter((c) => c <= t + 1e-4).length % 2 === 1 ? 1.06 : 1);

  const forma = (e: Estado, anterior: Estado | undefined, t: number): { caixa: Caixa; painel: Painel; yLegenda: number } => {
    if (e.lugar === "painel") return { caixa: { ...banda, zoom: zoomCorte(t) }, painel: { y: 0, h: COSTURA }, yLegenda: COSTURA };
    if (e.lugar === "janela") return { caixa: JANELA, painel: { y: 0, h: 1920 }, yLegenda: JANELA.y - 70 };
    // quadro cheio: depois da janela a foto fica inteira embaixo enquanto a pessoa cresce por cima
    const painel = anterior?.lugar === "janela" ? { y: 0, h: 1920 } : { y: -COSTURA, h: COSTURA };
    return { caixa: { ...CHEIO, zoom: zoomCorte(t), ancoraY: plano.rosto.y }, painel, yLegenda: zona.topo + 96 };
  };

  const em = (t: number): Geometria => {
    let i = 0;
    for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
    const agora = forma(estados[i], estados[i - 1], t);
    const peso = (l: Lugar, e: Estado) => (e.lugar === l ? 1 : 0);
    if (i === 0) return { ...agora, janela: 0, embaixo: 0 };
    const antes = forma(estados[i - 1], estados[i - 2], t);
    const p = interpolate(t, [estados[i].de, estados[i].de + DUR_TROCA], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: suave,
    });
    const mix = (a: number, b: number) => a + (b - a) * p;
    const a = antes.caixa;
    const b = agora.caixa;
    return {
      caixa: {
        x: mix(a.x, b.x),
        y: mix(a.y, b.y),
        w: mix(a.w, b.w),
        h: mix(a.h, b.h),
        raio: mix(a.raio ?? 0, b.raio ?? 0),
        zoom: mix(a.zoom ?? 1, b.zoom ?? 1),
        ancoraY: mix(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3),
      },
      painel: { y: mix(antes.painel.y, agora.painel.y), h: mix(antes.painel.h, agora.painel.h) },
      janela: mix(peso("janela", estados[i - 1]), peso("janela", estados[i])),
      embaixo: mix(peso("painel", estados[i - 1]), peso("painel", estados[i])),
      yLegenda: mix(antes.yLegenda, agora.yLegenda),
    };
  };

  const livreDesde = (de: number) => {
    let i = 0;
    for (let k = 0; k < estados.length; k++) if (estados[k].de <= de + 1e-4) i = k;
    const e = estados[i];
    if (e.lugar !== "cheio" || i === 0) return de;
    // o cartão espera a pessoa quase toda de volta ao quadro cheio
    return Math.max(de, e.de + DUR_TROCA * 0.7);
  };

  const cruza = (m: Momento) => {
    const i = ordem.indexOf(m);
    const anterior = ordem[i - 1];
    const proximo = ordem[i + 1];
    return {
      vem: !!anterior && noPainel(m) && noPainel(anterior) && m.de - anterior.ate < 0.4,
      vai: !!proximo && noPainel(m) && noPainel(proximo) && proximo.de - m.ate < 0.4,
    };
  };

  const fim = (m: Momento) => {
    const i = ordem.indexOf(m);
    if (i === ordem.length - 1 && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
    if (m.tipo === "antesdepois" && m.janelaEm !== undefined && ordem[i + 1]?.tipo === "cta") return plano.duracao + 1;
    if (noPainel(m)) return cruza(m).vai ? m.ate + 0.22 : m.ate + DUR_TROCA + 0.05;
    return m.ate;
  };

  return { em, yPeito: zona.topo + Math.min(zona.altura, 520) * 0.44, livreDesde, fim, cruza };
};
