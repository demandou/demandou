// A gramática de layout do Painel: a pessoa em quadro cheio entre os momentos de dados;
// nos momentos de dados ela vai para uma janela num canto de cima e o painel ocupa a tela.
import { interpolate } from "remotion";
import { type Caixa, caixaNoTempo, type EstadoDaCaixa } from "./motor/caixa";
import { ehPainel, type Lado, type Momento, type Plano } from "./plano";

// A janela: retrato (cabeça e ombros), num canto de cima, fora da interface do app.
export const JANELA = { w: 350, h: 440, y: 190, raio: 28, zoom: 2.15, ancoraY: 0.4, margem: 60 };
export const xDaJanela = (lado: Lado) => (lado === "esq" ? JANELA.margem : 1080 - JANELA.margem - JANELA.w);

// Geometria do painel (px no quadro 1080×1920)
export const PAINEL = {
  // cabeçalho: ao lado da janela, da mesma altura
  cabecalho: { topo: JANELA.y, altura: JANELA.h, largura: 1080 - 2 * JANELA.margem - JANELA.w - 36 },
  // corpo: gráfico, barra, cartões — ocupa quase toda a altura entre o cabeçalho e o rodapé
  corpo: { esquerda: 60, direita: 1020, topo: 668, base: 1384 },
  nota: 1394,
  // legenda dentro do painel: sempre nesta faixa
  legenda: 1448,
};
export const xDoCabecalho = (lado: Lado) => (lado === "dir" ? JANELA.margem : JANELA.margem + JANELA.w + 36);

const TRANSICAO = 0.6;

// Lado de cada momento de painel: o campo `janela`, ou alternando a partir da direita.
export const ladosDosPaineis = (momentos: Momento[]) => {
  const lados = new Map<Momento, Lado>();
  let anterior: Lado = "esq";
  for (const m of [...momentos].sort((a, b) => a.de - b.de)) {
    if (!ehPainel(m)) continue;
    const lado: Lado = m.janela ?? (anterior === "dir" ? "esq" : "dir");
    lados.set(m, lado);
    anterior = lado;
  }
  return lados;
};

export const caixaCheia = (plano: Plano): Caixa => {
  const h = Math.min(1920, plano.videoAltura ?? 1920);
  // âncora = altura do rosto: o zoom parte do rosto e ele não sai do lugar
  return { x: 0, y: 0, w: 1080, h, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * 1920) / h };
};

// O enquadramento dentro da janela pode ser ajustado no plano (`retrato`): rosto grande no
// quadro (pessoa perto da câmera) pede zoom menor para caber cabeça e ombros.
// Sem `retrato` no plano, o enquadramento sai da largura do rosto medida pelo rastreio: o rosto
// ocupa ~42% da largura da janela (cabeça e ombros), seja a pessoa perto ou longe da câmera.
export const retratoAutomatico = (plano?: Plano) => {
  const largura = (plano?.rosto as { rastro?: { largura?: number } } | undefined)?.rastro?.largura;
  if (!largura || largura <= 0) return { zoom: JANELA.zoom, ancoraY: JANELA.ancoraY };
  const zoom = Math.min(2.6, Math.max(1, 0.42 / largura));
  return { zoom, ancoraY: largura > 0.3 ? 0.45 : JANELA.ancoraY };
};

export const caixaDaJanela = (lado: Lado, plano?: Plano): Caixa => ({
  x: xDaJanela(lado),
  y: JANELA.y,
  w: JANELA.w,
  h: JANELA.h,
  raio: JANELA.raio,
  zoom: plano?.retrato?.zoom ?? retratoAutomatico(plano).zoom,
  ancoraY: plano?.retrato?.ancoraY ?? retratoAutomatico(plano).ancoraY,
});

// Estados da caixa da pessoa ao longo do vídeo.
export const estadosDaCaixa = (plano: Plano, lados: Map<Momento, Lado>): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaCaixa[] = [{ de: -10, caixa: cheia }];
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordem.forEach((m, i) => {
    const lado = lados.get(m);
    if (!lado) return;
    estados.push({ de: Math.max(0, m.de), caixa: caixaDaJanela(lado, plano), dur: TRANSICAO });
    const proximo = ordem[i + 1];
    const emendaComPainel = proximo && lados.has(proximo) && proximo.de - m.ate < 0.4;
    if (!emendaComPainel) estados.push({ de: m.ate, caixa: cheia, dur: TRANSICAO });
  });
  return estados;
};

// Quanto a caixa está "cheia" (1) ou "janela" (0), para dosar bordas e zoom.
export const cheiura = (caixa: Caixa) =>
  interpolate(caixa.w, [JANELA.w, 1080], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Movimento contínuo no quadro cheio: aproxima e afasta devagar (até 4,5%), mudando de direção
// na fronteira de cada momento; em cada corte, um salto seco de 6% disfarça o pulo.
export const zoomNoTempo = (t: number, plano: Plano) => {
  const pontos = [
    0,
    plano.duracao,
    ...plano.momentos.flatMap((m) => [m.de, m.ate]),
    ...(plano.cortesEm ?? []),
  ]
    .map((x) => Math.min(plano.duracao, Math.max(0, x)))
    .sort((a, b) => a - b)
    .filter((x, i, a) => i === 0 || x - a[i - 1] > 0.3);
  let direcao = 0;
  let valor = 0;
  for (let i = 0; i < pontos.length - 1; i++) {
    const [a, b] = [pontos[i], pontos[i + 1]];
    const sobe = direcao % 2 === 0;
    if (t < b || i === pontos.length - 2) {
      const p = interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const suave = p * p * (3 - 2 * p);
      valor = sobe ? suave : 1 - suave;
      break;
    }
    direcao++;
  }
  const cortes = (plano.cortesEm ?? []).filter((c) => c <= t).length;
  return (1 + 0.045 * valor) * (cortes % 2 === 1 ? 1.06 : 1);
};

export const caixaNoInstante = (t: number, plano: Plano, estados: EstadoDaCaixa[]) => {
  const c = caixaNoTempo(t, estados);
  const cheia = cheiura(c);
  return { ...c, zoom: (c.zoom ?? 1) * (1 + (zoomNoTempo(t, plano) - 1) * cheia) };
};

// Quando o conteúdo de cada momento começa a entrar, conforme a troca de layout:
// - painel vindo do quadro cheio: entra junto (está por baixo da pessoa, que encolhe revelando-o);
// - painel vindo de outro painel: o corpo entra enquanto o anterior desliza para fora (a janela só troca de canto);
// - quadro cheio vindo de um painel: entra enquanto a pessoa cresce por cima do painel que sai;
// - gancho no início do vídeo: o cartão já está montado no primeiro quadro (vira a capa).
export const iniciosDosMomentos = (plano: Plano, lados: Map<Momento, Lado>) => {
  const inicios = new Map<Momento, number>();
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordem.forEach((m, i) => {
    const anterior = ordem[i - 1];
    const vemDePainel = !!anterior && lados.has(anterior) && m.de - anterior.ate < 0.4;
    // painel vindo da tela cheia: monta-se embaixo da pessoa um pouco antes da troca, e ela encolhe
    // revelando um painel já pronto (cabeçalho, grade, cartões "a lápis"); os dados seguem a fala
    if (lados.has(m)) inicios.set(m, m.de + (vemDePainel ? 0.2 : -0.35));
    // tela cheia vindo de um painel: o cartão entra enquanto a pessoa cresce por cima do painel
    else if (vemDePainel) inicios.set(m, m.de + 0.3);
    else if ((m.tipo === "gancho" || m.tipo === "abertura") && m.de <= 0.25) inicios.set(m, -0.6);
    else inicios.set(m, m.de);
  });
  return inicios;
};
