// A gramática do Impacto: DESLOCAMENTO.
// - Entre os momentos, a pessoa ocupa o quadro cheio (rosto no centro).
// - Num momento "de lado", a caixa da pessoa desliza para um lado e as palavras ocupam o lado livre.
//   O lado alterna a cada momento: a pessoa "pula" de um lado para o outro da tela.
// - Os momentos em tela cheia (circuito, passos, gráfico): o conteúdo toma o quadro e a pessoa vira
//   uma janela no canto.
// - Trocas: quando a caixa atravessa a tela, a borda dela é a cortina (cobre o que sai, revela o que
//   entra). Quando ela não atravessa (tela cheia, mesmo lado), um filete no acento varre a área do
//   texto e faz o mesmo papel: nunca duas páginas de texto uma sobre a outra, nunca um quadro vazio.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { emTelaCheia, type Lado, type Momento, type Plano } from "./plano";
import { type Geometria, QUADRO } from "./tema";

// quanto tempo a caixa leva para mudar de lugar (≈ 8 quadros a 25 fps)
export const TRANSICAO = 0.3;
// dois momentos com menos que isto entre eles ficam "colados": a pessoa não volta ao quadro cheio
export const COLADO = 0.35;
// zoom do quadro cheio: alterna entre estes dois a cada volta ao quadro cheio e em cada corte
const ZOOM_CHEIO = [1, 1.08];

// Momentos em ordem, sem sobreposição (um termina quando o próximo começa).
export const ordenar = (plano: Plano): Momento[] => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return ordem.map((m, i) => {
    const prox = ordem[i + 1];
    return prox && m.ate > prox.de ? { ...m, ate: prox.de } : m;
  });
};

export type Arranjo = { tipo: "janela" } | { tipo: "lado"; lado: Lado };

// Onde a pessoa fica em cada momento. Sem `lado` no plano, alterna: direita, esquerda, direita…
export const arranjos = (momentos: Momento[]): Arranjo[] => {
  let ultimo: Lado = "esquerda";
  return momentos.map((m) => {
    if (emTelaCheia(m)) return { tipo: "janela" };
    const lado: Lado = m.lado ?? (ultimo === "direita" ? "esquerda" : "direita");
    ultimo = lado;
    return { tipo: "lado", lado };
  });
};

// Último momento colado no fim (ou um cta sem nada depois) fica até o último quadro.
export const fimDoMomento = (m: Momento, momentos: Momento[], duracao: number) => {
  const temProximo = momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= duracao - 0.3)) return duracao + 1;
  return m.ate;
};

export const estadosDaCaixa = (plano: Plano, videoAltura: number, geo: Geometria): EstadoDaCaixa[] => {
  const momentos = ordenar(plano);
  const lugares = arranjos(momentos);
  const rostoY = plano.rosto.y;
  let z = 0;
  let zLado = 0;
  const cheio = (): Caixa => ({
    x: 0,
    y: 0,
    w: QUADRO.w,
    h: videoAltura,
    raio: 0,
    zoom: ZOOM_CHEIO[z % 2],
    ancoraY: (rostoY * QUADRO.h) / videoAltura,
  });
  const deLado = (lado: Lado, zoom = geo.zoomLado): Caixa => ({
    x: lado === "direita" ? QUADRO.w - geo.ladoW : 0,
    y: 0,
    w: geo.ladoW,
    h: QUADRO.h,
    raio: 0,
    zoom,
    ancoraY: rostoY,
  });

  const estados: EstadoDaCaixa[] = [{ de: 0, caixa: cheio() }];
  // trechos em que a pessoa está em quadro cheio (para os cortes virarem troca seca de zoom)
  const livres: { de: number; ate: number }[] = [];
  let cursor = 0;
  momentos.forEach((m, i) => {
    if (m.de - cursor > 0.05) livres.push({ de: cursor, ate: m.de });
    const lugar = lugares[i];
    // dois momentos seguidos do mesmo lado: a caixa não anda, então o zoom muda (seco) para marcar a troca
    const antes = lugares[i - 1];
    const repete =
      i > 0 && m.de - momentos[i - 1].ate < COLADO && antes.tipo === "lado" && lugar.tipo === "lado" && antes.lado === lugar.lado;
    zLado = repete ? zLado + 1 : 0;
    estados.push({
      de: Math.max(0, m.de),
      caixa: lugar.tipo === "janela" ? { ...geo.janela } : deLado(lugar.lado, geo.zoomLado + 0.07 * (zLado % 2)),
      dur: repete ? 0.12 : TRANSICAO,
    });
    const fim = fimDoMomento(m, momentos, plano.duracao);
    const prox = momentos[i + 1];
    if (fim < plano.duracao && (!prox || prox.de - m.ate > COLADO)) {
      z += 1;
      estados.push({ de: m.ate, caixa: cheio(), dur: TRANSICAO });
      cursor = m.ate;
    } else cursor = Math.max(cursor, prox ? prox.de : fim);
  });
  if (plano.duracao - cursor > 0.05) livres.push({ de: cursor, ate: plano.duracao });

  // corte no meio de um trecho de quadro cheio: troca seca de zoom (disfarça o pulo)
  for (const c of plano.cortesEm ?? []) {
    const livre = livres.find((l) => c > l.de + 0.4 && c < l.ate - 0.4);
    if (!livre) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    z = antes?.caixa.zoom === ZOOM_CHEIO[0] ? 1 : 0;
    estados.push({ de: c, caixa: cheio(), dur: 0.04 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// ——— A cortina das trocas coladas ———
// Um filete no acento varre a área do texto de `x0` a `x1` entre `t0` e `t0 + dur`. Do lado de trás
// dele (por onde já passou) fica o momento novo; do lado da frente, o que sai. Nunca os dois juntos.
// `manterLadoDaCaixa`: o que sai continua visível também do lado de lá do ponto de partida (onde a
// caixa da pessoa está crescendo): assim, quando a pessoa sai da janela para a coluna, a ficha antiga
// segue em volta da caixa até ser coberta, em vez de deixar a caixa solta num fundo vazio.
export type Cortina = { t0: number; dur: number; x0: number; x1: number; manterLadoDaCaixa?: boolean };

// Cortina entre o momento `i` e o seguinte (null: a própria caixa atravessa a tela e faz a cortina,
// ou há quadro cheio entre os dois).
export const cortinaDepois = (i: number, momentos: Momento[], lugares: Arranjo[], geo: Geometria): Cortina | null => {
  const a = momentos[i];
  const b = momentos[i + 1];
  if (!a || !b || b.de - a.ate > COLADO) return null;
  const la = lugares[i];
  const lb = lugares[i + 1];
  if (la.tipo === "lado" && lb.tipo === "lado" && la.lado !== lb.lado) return null;
  const dur = TRANSICAO + 0.04;
  // o filete sai da borda da caixa da pessoa e anda para o lado de fora
  const deDireita = { t0: b.de, dur, x0: QUADRO.w - geo.ladoW, x1: -12 };
  const deEsquerda = { t0: b.de, dur, x0: geo.ladoW, x1: QUADRO.w + 12 };
  if (lb.tipo === "lado") return { ...(lb.lado === "direita" ? deDireita : deEsquerda), manterLadoDaCaixa: la.tipo === "janela" };
  if (la.tipo === "lado") return la.lado === "direita" ? deDireita : deEsquerda;
  // tela cheia → tela cheia: sai da janela (canto direito) e varre para a esquerda
  return { t0: b.de, dur, x0: QUADRO.w + 12, x1: -12 };
};
