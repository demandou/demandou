// A mecânica do palco: em que modo o vídeo está em cada instante, onde fica a caixa da pessoa
// (quadro cheio ↔ janela no canto) e onde cada ponto de uma imagem cai no painel (para as
// anotações ficarem presas ao assunto enquanto a foto aproxima devagar).
import { zoomNoTempo } from "./camera";
import { ANTES, DUR_TROCA, cenasDoPlano, type Cena } from "./cenas";
import { CHEIO, type Caixa } from "./motor/caixa";
import { enquadrarFoto, imagemDoPlano, temImagem, type Foco, type Imagem } from "./motor/imagem";
import type { Anotacao, Canto, MomentoDePalco, Palco, Plano } from "./plano";
import { JANELA, PAINEL, ancoraDo, prog, troca, xDaJanela } from "./tema";

// ——— geometria das fotos no painel ———

// Os lugares de imagem do painel: inteiro, ou as duas metades quando a segunda imagem entra.
export const VAO_METADES = 12;
export const metade = () => (PAINEL.h - VAO_METADES) / 2;

export type MapaDaFoto = {
  // retângulo da imagem dentro do lugar (px), antes da aproximação lenta
  x: number;
  y: number;
  w: number;
  h: number;
  // aproximação lenta: escala em volta da origem (px no lugar)
  z: number;
  ox: number;
  oy: number;
  // ponto da imagem (frações) → px no lugar, já com a aproximação
  ponto: (ax: number, ay: number) => { x: number; y: number };
};

export const mapaDaFoto = (img: Imagem | null, W: number, H: number, ajuste: "cobrir" | "inteira", foco: Foco | undefined, z: number): MapaDaFoto => {
  const iw = img?.largura ?? W;
  const ih = img?.altura ?? H;
  const f = foco ?? img?.foco ?? { x: 0.5, y: 0.5 };
  let r: { x: number; y: number; w: number; h: number };
  if (ajuste === "inteira") {
    // a imagem inteira, com folga, centrada (prints, telas)
    const s = Math.min((W - 64) / iw, (H - 64) / ih);
    r = { x: (W - iw * s) / 2, y: (H - ih * s) / 2, w: iw * s, h: ih * s };
  } else {
    const q = enquadrarFoto(W, H, iw, ih, f);
    r = { x: q.x, y: q.y, w: q.w, h: q.h };
  }
  // a aproximação é ancorada no foco (o assunto não sai do lugar)
  const ox = Math.min(W, Math.max(0, r.x + f.x * r.w));
  const oy = Math.min(H, Math.max(0, r.y + f.y * r.h));
  return {
    ...r,
    z,
    ox,
    oy,
    ponto: (ax, ay) => ({ x: ox + (r.x + ax * r.w - ox) * z, y: oy + (r.y + ay * r.h - oy) * z }),
  };
};

export const ajusteDo = (m: Palco, img: Imagem | null): "cobrir" | "inteira" => m.ajuste ?? (img?.id && /print|tela|captura/i.test(img.id) ? "inteira" : "cobrir");

// Onde as anotações de um palco caem na tela (px), sem a aproximação: para escolher o canto.
const pontosNaTela = (plano: Plano, m: Palco): { x: number; y: number }[] => {
  const pontos: { x: number; y: number }[] = [];
  const img1 = imagemDoPlano(plano, m.imagem);
  const dividido = !!m.segunda;
  const h1 = dividido ? metade() : PAINEL.h;
  const mapa1 = mapaDaFoto(temImagem(img1) ? img1 : null, PAINEL.w, h1, ajusteDo(m, img1), m.imagem.foco, 1);
  for (const a of m.anotacoes ?? []) {
    const p = mapa1.ponto(a.x, a.y);
    pontos.push({ x: PAINEL.x + p.x, y: PAINEL.y + p.y });
  }
  if (m.segunda) {
    const img2 = imagemDoPlano(plano, m.segunda.imagem);
    const mapa2 = mapaDaFoto(temImagem(img2) ? img2 : null, PAINEL.w, metade(), "cobrir", m.segunda.imagem.foco, 1);
    for (const a of m.segunda.anotacoes ?? []) {
      const p = mapa2.ponto(a.x, a.y);
      pontos.push({ x: PAINEL.x + p.x, y: PAINEL.y + metade() + VAO_METADES + p.y });
    }
  }
  return pontos;
};

// O canto da janela: oposto às anotações que caem na faixa de baixo (onde a janela fica).
// Sem anotação lá embaixo, sem preferência (fica o canto da página anterior).
export const cantoAuto = (plano: Plano) => (m: MomentoDePalco): Canto | null => {
  if (m.tipo !== "palco") return null;
  const baixo = pontosNaTela(plano, m).filter((p) => p.y > JANELA.y - 140);
  if (!baixo.length) return null;
  const mx = baixo.reduce((s, p) => s + p.x, 0) / baixo.length;
  return mx < 540 ? "dir" : "esq";
};

export const cenas = (plano: Plano): Cena[] => cenasDoPlano(plano, cantoAuto(plano));

// ——— o modo em cada instante ———

export type Estado = {
  cena: Cena | null;
  // 0 = a pessoa em quadro cheio; 1 = na janela
  p: number;
  // x da janela agora e o canto em que ela está (ou para onde vai)
  x: number;
  canto: Canto;
  // 0 < mudando < 1 enquanto a janela troca de canto
  mudando: number;
};

export const estadoNoTempo = (plano: Plano, t: number): Estado => {
  const cena = cenas(plano).find((c) => t >= c.de - ANTES && t < c.ate + DUR_TROCA);
  if (!cena) return { cena: null, p: 0, x: xDaJanela("esq"), canto: "esq", mudando: 0 };
  const entra = prog(t, cena.de - ANTES, DUR_TROCA, troca);
  const sai = prog(t, cena.ate - 0.1, DUR_TROCA, troca);
  let canto = cena.paginas[0].canto;
  let x = xDaJanela(canto);
  let mudando = 0;
  for (let i = 1; i < cena.paginas.length; i++) {
    const a = cena.paginas[i - 1].canto;
    const b = cena.paginas[i].canto;
    if (a === b) continue;
    const q = prog(t, inicioDaPagina(cena, i), DUR_TROCA, troca);
    x += (xDaJanela(b) - xDaJanela(a)) * q;
    if (q >= 0.5) canto = b;
    if (q > 0 && q < 1) mudando = q;
  }
  return { cena, p: entra * (1 - sai), x, canto, mudando };
};

// quando a página i de uma cena começa a entrar (a primeira já está lá quando a pessoa encolhe)
export const inicioDaPagina = (cena: Cena, i: number) => (i === 0 ? cena.de - ANTES : cena.paginas[i].m.de - 0.12);
// até quando a página fica montada (coberta pela seguinte, ou pela pessoa voltando)
export const fimDaPagina = (cena: Cena, i: number) => (i + 1 < cena.paginas.length ? inicioDaPagina(cena, i + 1) + DUR_TROCA + 0.04 : cena.ate + DUR_TROCA);

// ——— a caixa da pessoa ———

export const caixaDaPessoa = (plano: Plano, t: number): { caixa: Caixa; est: Estado } => {
  const est = estadoNoTempo(plano, t);
  const cheia: Caixa = { ...CHEIO, zoom: zoomNoTempo(plano, t), ancoraY: ancoraDo(plano) };
  if (est.p <= 0) return { caixa: cheia, est };
  const p = est.p;
  const mix = (a: number, b: number) => a + (b - a) * p;
  const w = mix(1080, JANELA.w);
  const h = mix(1920, JANELA.h);
  // a escala do vídeo anda em progressão geométrica: a pessoa diminui num ritmo constante
  const sCheia = cheia.zoom ?? 1;
  const larg = plano.rosto.rastro?.largura ?? 0.3;
  // rosto grande (selfie de perto): menos zoom e mais folga em cima, para a cabeça caber inteira
  const zJ = JANELA.zoom * Math.min(1, Math.max(0.78, 0.32 / larg));
  const aJ = Math.min(0.54, Math.max(JANELA.ancoraY, JANELA.ancoraY + (larg - 0.3) * 1.6));
  const sJanela = Math.max(JANELA.w / 1080, JANELA.h / 1920) * zJ;
  const s = sCheia * Math.pow(sJanela / sCheia, p);
  return {
    caixa: {
      x: mix(0, est.x),
      y: mix(0, JANELA.y),
      w,
      h,
      raio: mix(0, JANELA.raio),
      zoom: Math.max(1, s / Math.max(w / 1080, h / 1920)),
      ancoraY: mix(cheia.ancoraY ?? 0.3, aJ),
    },
    est,
  };
};

// a anotação vale até `ate` (padrão: o fim do momento)
export const fimDaAnotacao = (a: Anotacao, ate: number) => a.ate ?? ate;
