// A direção do desktop: onde está a janela da chamada em cada instante e o que o mouse faz.
// Tudo é calculado a partir do plano — o aluno não escreve posições nem gestos.
import { Easing } from "remotion";
import { arrasto, limitar, mistura, prog, temposDoTexto } from "./anim";
import { ctaAntigo, geoComparacao, geoCtaUniversal, geoDefinicao, geoFrase, geoLista, temposDoCta } from "./blocos";
import {
  abasGeom,
  botoesCta,
  topoDoCartaoCta,
  botoesDaJanela,
  type CaixaJanela,
  caixaDoVideo,
  itemGeom,
  listaGeom,
  lugarDoMomento,
  lugares,
  navegadorGeom,
  ICONES_DOCK,
  pegada,
  posDock,
  rostoNaCaixa,
} from "./geometria";
import type { Lugar, Momento, Plano, Recorte } from "./plano";
import { BARRA_JANELA, W } from "./tema";

// ---------- a janela da chamada ----------

type Segmento = { de: number; lugar: Lugar };

// Lugar da pessoa ao longo do vídeo: o de cada momento; tela cheia nos trechos sem momento.
export const segmentosDaChamada = (plano: Plano): Segmento[] => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  const segs: Segmento[] = [{ de: -10, lugar: "cheia" }];
  const por = (de: number, lugar: Lugar) => {
    const ultimo = segs[segs.length - 1];
    if (ultimo.lugar === lugar) return;
    if (de <= ultimo.de + 0.01) ultimo.lugar = lugar;
    else segs.push({ de, lugar });
  };
  ordem.forEach((m, i) => {
    por(m.de <= 0.1 ? -10 : m.de, lugarDoMomento(m));
    const proximo = ordem[i + 1];
    const fimDoVideo = m.ate >= plano.duracao - 0.3;
    if (!fimDoVideo && (!proximo || proximo.de - m.ate > 0.15)) por(m.ate, "cheia");
  });
  return segs;
};

// duração de cada troca de lugar: minimizar/restaurar e maximizar são mais rápidos que arrastar
export const duracaoDaTroca = (de: Lugar, para: Lugar) => (de === "mini" || para === "mini" || para === "cheia" || de === "cheia" ? 0.5 : 0.62);

const mixJanela = (a: CaixaJanela, b: CaixaJanela, p: number): CaixaJanela => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
  raio: mistura(a.raio, b.raio, p),
  zoom: mistura(a.zoom, b.zoom, p),
  ancoraY: mistura(a.ancoraY, b.ancoraY, p),
  // a barra de título some/aparece no começo da troca (não fica meio cortada)
  barra: mistura(a.barra, b.barra, limitar(p * 1.6)),
});

export const janelaNoTempo = (t: number, segs: Segmento[], L: Record<Lugar, CaixaJanela>): CaixaJanela => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) if (segs[k].de <= t) i = k;
  if (i === 0) return L[segs[0].lugar];
  const s = segs[i];
  const anterior = janelaNoTempo(s.de, segs.slice(0, i), L);
  const p = prog(t, s.de, duracaoDaTroca(segs[i - 1].lugar, s.lugar), arrasto);
  return mixJanela(anterior, L[s.lugar], p);
};

// ---------- o recorte em volta do rosto ----------

export const selecaoDoRecorte = (m: Recorte, plano: Plano) => {
  const L = lugares(plano);
  const j = L[lugarDoMomento(m)];
  const v = caixaDoVideo(j);
  const videoFrame = { ...v, x: j.x + v.x, y: j.y + v.y };
  const r = rostoNaCaixa(videoFrame, plano.rosto, Math.min(1920, plano.videoAltura ?? 1920));
  const lv = 1080 * r.escala;
  const a = m.ajuste ?? {};
  let w = Math.round(0.6 * lv + (a.w ?? 0));
  let h = Math.round(0.6 * lv + (a.h ?? 0));
  w = Math.min(w, videoFrame.w - 40);
  h = Math.min(h, videoFrame.h - 40);
  const x = limitar(Math.round(r.x - w / 2 + (a.x ?? 0)), videoFrame.x + 20, videoFrame.x + videoFrame.w - w - 20);
  const y = limitar(Math.round(r.y - h * 0.46 + (a.y ?? 0)), videoFrame.y + 20, videoFrame.y + videoFrame.h - h - 20);
  return { x, y, w, h };
};

export const tempoDoRecorte = (m: Recorte) => {
  const ultimaTecla = m.teclas?.length ? Math.max(...m.teclas.map((k) => k.em)) : m.selecionaEm - 0.4;
  const escurece = m.escureceEm ?? Math.min(ultimaTecla + 0.05, m.selecionaEm - 0.15);
  const captura = m.capturaEm ?? m.soltaEm + 0.5;
  return { escurece, captura };
};

// ---------- o mouse ----------

type Acao =
  | { t: number; tipo: "vai"; x: number; y: number; opcional?: boolean }
  | { t: number; tipo: "arrasta"; de: number; x: number; y: number }
  | { t: number; tipo: "aparece"; x: number; y: number }
  | { t: number; tipo: "some" }
  | { t: number; tipo: "clique"; n: 1 | 2 }
  | { t: number; tipo: "mira"; v: boolean };

// `via`: ponto de controle de uma curva (o mouse contorna o rosto em vez de passar por cima dele)
type Quadro = { t: number; x: number; y: number; curva: "move" | "arrasto" | "salto"; via?: { x: number; y: number } };
export type Mouse = {
  quadros: Quadro[];
  cliques: { t: number; x: number; y: number }[];
  visivel: { t: number; v: boolean }[];
  mira: { t: number; v: boolean }[];
  segura: { de: number; ate: number }[];
};

const REPOUSO = { x: 930, y: 1330 };

export const roteiroDoMouse = (plano: Plano): Mouse => {
  const L = lugares(plano);
  const segs = segmentosDaChamada(plano);
  const acoes: Acao[] = [];

  // gestos das trocas de lugar da janela da chamada
  segs.forEach((s, i) => {
    if (i === 0) return;
    const A = L[segs[i - 1].lugar];
    const B = L[s.lugar];
    const T = s.de;
    const D = duracaoDaTroca(segs[i - 1].lugar, s.lugar);
    if (s.lugar === "cheia") {
      // maximizar: duplo clique na barra de título (da miniatura, sem barra, o clique é no ícone da
      // chamada no dock, longe do rosto); em tela cheia o mouse some
      if (segs[i - 1].lugar === "mini") {
        acoes.push({ t: T - 0.3, tipo: "vai", ...posDock(ICONES_DOCK.indexOf("camera")) });
        acoes.push({ t: T - 0.28, tipo: "clique", n: 1 });
      } else {
        acoes.push({ t: T - 0.3, tipo: "vai", ...pegada(A) });
        acoes.push({ t: T - 0.28, tipo: "clique", n: 2 });
      }
      acoes.push({ t: T + 0.25, tipo: "some" });
    } else if (segs[i - 1].lugar === "cheia") {
      // sair da tela cheia: o mouse aparece no alto e arrasta a janela para o lugar novo
      acoes.push({ t: T - 0.42, tipo: "aparece", ...pegada(A) });
      acoes.push({ t: T + D, tipo: "arrasta", de: T, ...pegada(B) });
    } else if (s.lugar === "mini") {
      acoes.push({ t: T - 0.06, tipo: "vai", ...botoesDaJanela(A).minimizar });
      acoes.push({ t: T - 0.06, tipo: "clique", n: 1 });
      // depois sai da barra e descansa à direita, longe do rosto
      acoes.push({ t: T + 0.9, tipo: "vai", x: W - 120, y: B.y - 70, opcional: true });
    } else if (segs[i - 1].lugar === "mini") {
      // restaurar: clique no ícone da chamada no dock (o mouse fica longe do rosto que cresce)
      acoes.push({ t: T - 0.06, tipo: "vai", ...posDock(ICONES_DOCK.indexOf("camera")) });
      acoes.push({ t: T - 0.06, tipo: "clique", n: 1 });
      acoes.push({ t: T + 0.9, tipo: "vai", x: B.x + 80, y: B.y + B.h + 40, opcional: true });
    } else {
      acoes.push({ t: T - 0.06, tipo: "vai", ...pegada(A) });
      acoes.push({ t: T + D, tipo: "arrasta", de: T, ...pegada(B) });
    }
  });

  // gestos de cada momento
  for (const m of plano.momentos) {
    if (m.tipo === "navegador" && m.fechaEm !== undefined) {
      const N = navegadorGeom(m);
      const n = Math.min(4, m.abas.length);
      const abas = abasGeom(n, N);
      const alvo = abas[Math.min(m.ativa ?? n - 1, abas.length - 1)].fechar;
      acoes.push({ t: m.fechaEm, tipo: "vai", ...alvo });
      acoes.push({ t: m.fechaEm, tipo: "clique", n: 1 });
      // depois sai de cima das abas e descansa no canto da página
      acoes.push({ t: m.fechaEm + 0.7, tipo: "vai", x: N.x + N.w - 90, y: N.y + N.h - 70, opcional: true });
    }
    if (m.tipo === "navegador" && m.fechaEm === undefined) {
      // abas que abrem na fala: o mouse clica no "+" logo antes de cada uma
      const N = navegadorGeom(m);
      const n = Math.min(4, m.abas.length);
      const abas = abasGeom(n, N);
      m.abas.slice(1, n).forEach((a, k) => {
        if (a.em === undefined) return;
        const antes = abas[k];
        acoes.push({ t: a.em - 0.14, tipo: "vai", x: antes.x + antes.w + 30, y: antes.fechar.y });
        acoes.push({ t: a.em - 0.14, tipo: "clique", n: 1 });
      });
    }
    if (m.tipo === "lista" && m.escolhe !== undefined && m.escolheEm !== undefined) {
      const it = itemGeom(Math.min(m.escolhe, m.itens.length - 1), listaGeom(plano, m));
      acoes.push({ t: m.escolheEm, tipo: "vai", x: it.x + it.w - 150, y: it.y + it.h / 2 + 8 });
      acoes.push({ t: m.escolheEm, tipo: "clique", n: 1 });
    }
    if (m.tipo === "topicos") {
      // o mouse seleciona cada item quando ele é dito
      const g = geoLista(plano, m);
      g.linhas.forEach((l, i) => {
        const em = m.itens[i].em + 0.1;
        acoes.push({ t: em, tipo: "vai", x: l.x + 22 + l.marca * 0.55, y: l.y + l.h / 2 + 8 });
        acoes.push({ t: em, tipo: "clique", n: 1 });
      });
    }
    if (m.tipo === "comparacao" && m.vencedor !== undefined) {
      const j = geoComparacao(plano, m).janelas[m.vencedor];
      const em = m.vencedorEm ?? m.lados[m.vencedor].em + 0.8;
      acoes.push({ t: em, tipo: "vai", x: j.x + j.w * 0.45, y: j.y + BARRA_JANELA / 2 + 4 });
      acoes.push({ t: em, tipo: "clique", n: 1 });
    }
    if (m.tipo === "definicao") {
      // passa por cima do termo e o balão de ajuda abre
      const g = geoDefinicao(plano, m);
      // a ponta da seta para logo depois do termo, sem cobrir as letras nem o balão
      acoes.push({ t: m.significadoEm - 0.15, tipo: "vai", x: Math.min(g.janela.x + g.janela.w - 70, g.termoX + g.termoW + 18), y: g.termoY + g.termoH * 0.42 });
    }
    if (m.tipo === "frase" && m.risco) {
      // seleciona as palavras do risco arrastando, logo antes de elas serem riscadas
      const g = geoFrase(plano, m);
      if (g.risco) {
        const a = g.caixas[g.risco[0]];
        const b = g.caixas[g.risco[1]];
        const tempos = temposDoTexto(m.texto, plano.palavras, (m.em ?? m.de + 0.35) - 0.3, m.ate, m.em ?? m.de + 0.35);
        const riscoEm = m.riscoEm ?? tempos[g.risco[0]] + 0.2;
        acoes.push({ t: riscoEm - 0.45, tipo: "vai", x: a.x - 4, y: a.y + a.h * 0.55 });
        acoes.push({ t: riscoEm - 0.05, tipo: "arrasta", de: riscoEm - 0.45, x: b.x + b.w + 4, y: b.y + b.h * 0.55 });
      }
    }
    if (m.tipo === "recorte") {
      const sel = selecaoDoRecorte(m, plano);
      const { escurece, captura } = tempoDoRecorte(m);
      acoes.push({ t: escurece, tipo: "mira", v: true });
      acoes.push({ t: m.selecionaEm, tipo: "vai", x: sel.x, y: sel.y });
      acoes.push({ t: m.soltaEm, tipo: "arrasta", de: m.selecionaEm, x: sel.x + sel.w, y: sel.y + sel.h });
      acoes.push({ t: captura + 0.25, tipo: "mira", v: false });
      acoes.push({ t: captura + 0.9, tipo: "vai", x: Math.min(W - 80, sel.x + sel.w + 40), y: sel.y + sel.h + 20, opcional: true });
    }
    if (m.tipo === "cta" && !ctaAntigo(m)) {
      const g = geoCtaUniversal(plano, m);
      const { clique } = temposDoCta(m, plano.palavras);
      acoes.push({ t: clique, tipo: "vai", x: g.botao.x + g.botao.w * 0.62, y: g.botao.y + g.botao.h * 0.62 });
      acoes.push({ t: clique, tipo: "clique", n: 1 });
    }
    if (m.tipo === "cta" && ctaAntigo(m)) {
      const b = botoesCta(topoDoCartaoCta(plano, m));
      const salvar = m.salvarEm ?? m.de + 0.4;
      const enviar = m.enviarEm ?? salvar + 0.5;
      const enviado = m.enviadoEm ?? m.ate - 0.4;
      acoes.push({ t: salvar, tipo: "vai", x: b.salvar.x + b.salvar.w * 0.62, y: b.salvar.y + b.salvar.h * 0.62 });
      acoes.push({ t: salvar, tipo: "clique", n: 1 });
      acoes.push({ t: enviar, tipo: "vai", x: b.enviar.x + b.enviar.w * 0.62, y: b.enviar.y + b.enviar.h * 0.62 });
      acoes.push({ t: enviar, tipo: "clique", n: 1 });
      if (m.para) {
        // enquanto o nome é digitado, o mouse sai de cima do botão; depois volta e confirma
        acoes.push({ t: enviar + 0.75, tipo: "vai", x: b.enviar.x + b.enviar.w * 0.8, y: b.enviar.y + b.enviar.h + 150, opcional: true });
        acoes.push({ t: enviado, tipo: "vai", x: b.enviar.x + b.enviar.w * 0.6, y: b.enviar.y + b.enviar.h * 0.6 });
        acoes.push({ t: enviado, tipo: "clique", n: 1 });
      }
    }
  }

  // ordem do tempo; num empate, mover antes de clicar
  const ordemTipo = { aparece: 0, vai: 1, arrasta: 2, mira: 3, clique: 4, some: 5 };
  acoes.sort((a, b) => a.t - b.t || ordemTipo[a.tipo] - ordemTipo[b.tipo]);
  // um movimento opcional (o mouse "descansar" longe da ação) só acontece se houver tempo antes do próximo gesto
  const inicioDe = (a: Acao) => (a.tipo === "arrasta" ? a.de : a.t);
  for (let i = acoes.length - 1; i >= 0; i--) {
    const a = acoes[i];
    if (a.tipo !== "vai" || !a.opcional) continue;
    const proximo = acoes.slice(i + 1).find((b) => b.tipo === "vai" || b.tipo === "arrasta" || b.tipo === "clique");
    if (proximo && inicioDe(proximo) - a.t < 1.0) acoes.splice(i, 1);
  }

  const comecaEmJanela = segs[0].lugar !== "cheia";
  const quadros: Quadro[] = [{ t: -10, ...REPOUSO, curva: "salto" }];
  const mouse: Mouse = { quadros, cliques: [], visivel: [{ t: -10, v: comecaEmJanela }], mira: [{ t: -10, v: false }], segura: [] };
  const ultimo = () => quadros[quadros.length - 1];
  for (const a of acoes) {
    const u = ultimo();
    if (a.tipo === "vai") {
      const dist = Math.hypot(a.x - u.x, a.y - u.y);
      if (dist < 2) continue;
      const viagem = limitar(0.22 + dist / 2600, 0.28, 0.55);
      const parte = Math.max(u.t, a.t - viagem);
      if (parte > u.t + 0.001) quadros.push({ ...u, t: parte, curva: "move", via: undefined });
      const chega = Math.max(a.t, parte + 0.12);
      quadros.push({ t: chega, x: a.x, y: a.y, curva: "move", via: desvioDoRosto(u, a, janelaNoTempo((parte + chega) / 2, segs, L), plano) });
    } else if (a.tipo === "arrasta") {
      if (a.de > u.t + 0.001) quadros.push({ ...u, t: a.de, curva: "move", via: undefined });
      quadros.push({ t: Math.max(a.t, ultimo().t + 0.1), x: a.x, y: a.y, curva: "arrasto" });
      mouse.segura.push({ de: a.de - 0.06, ate: a.t + 0.04 });
    } else if (a.tipo === "aparece") {
      if (a.t > u.t + 0.001) quadros.push({ ...u, t: a.t - 0.001, curva: "move", via: undefined });
      quadros.push({ t: a.t, x: a.x, y: a.y, curva: "salto" });
      mouse.visivel.push({ t: a.t, v: true });
    } else if (a.tipo === "some") {
      mouse.visivel.push({ t: a.t, v: false });
    } else if (a.tipo === "mira") {
      mouse.mira.push({ t: a.t, v: a.v });
    } else if (a.tipo === "clique") {
      const p = posicaoDoMouse(a.t, quadros);
      mouse.cliques.push({ t: a.t, x: p.x, y: p.y });
      if (a.n === 2) mouse.cliques.push({ t: a.t + 0.17, x: p.x, y: p.y });
      // um clique com o mouse escondido traz o mouse de volta
      const vis = [...mouse.visivel].reverse().find((v) => v.t <= a.t);
      if (vis && !vis.v) mouse.visivel.push({ t: a.t - 0.35, v: true });
    }
  }
  mouse.visivel.sort((a, b) => a.t - b.t);
  return mouse;
};

// Se o caminho reto passa pelo rosto, devolve um ponto de controle que faz o mouse contornar
// pelo lado (a curva passa a ~70 px da borda do rosto). Nunca passa por cima da cara.
const desvioDoRosto = (a: { x: number; y: number }, b: { x: number; y: number }, j: CaixaJanela, plano: Plano) => {
  const v = caixaDoVideo(j);
  const r = rostoNaCaixa({ ...v, x: j.x + v.x, y: j.y + v.y }, plano.rosto, Math.min(1920, plano.videoAltura ?? 1920));
  const raio = 0.27 * 1080 * r.escala;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const k = limitar(((r.x - a.x) * dx + (r.y - a.y) * dy) / Math.max(1, dx * dx + dy * dy));
  const perto = Math.hypot(a.x + k * dx - r.x, a.y + k * dy - r.y);
  if (perto >= raio) return undefined;
  const lados = [r.x - raio - 110, r.x + raio + 110].map((x) => limitar(x, 50, W - 50));
  const custo = (x: number) => Math.abs(a.x - x) + Math.abs(b.x - x);
  const lado = custo(lados[0]) <= custo(lados[1]) ? lados[0] : lados[1];
  const passa = { x: lado, y: limitar(r.y, Math.min(a.y, b.y), Math.max(a.y, b.y)) };
  return { x: 2 * passa.x - (a.x + b.x) / 2, y: 2 * passa.y - (a.y + b.y) / 2 };
};

const emCurva = Easing.inOut(Easing.cubic);

export const posicaoDoMouse = (t: number, quadros: Quadro[]) => {
  let k = 0;
  for (let i = 0; i < quadros.length; i++) if (quadros[i].t <= t) k = i;
  const a = quadros[k];
  const b = quadros[k + 1];
  if (!b) return { x: a.x, y: a.y };
  if (b.curva === "salto") return { x: a.x, y: a.y };
  const p = limitar((t - a.t) / Math.max(0.001, b.t - a.t));
  const e = b.curva === "arrasto" ? arrasto(p) : emCurva(p);
  if (b.via) {
    const q = 1 - e;
    return { x: q * q * a.x + 2 * q * e * b.via.x + e * e * b.x, y: q * q * a.y + 2 * q * e * b.via.y + e * e * b.y };
  }
  return { x: mistura(a.x, b.x, e), y: mistura(a.y, b.y, e) };
};

// valor de uma chave liga/desliga com transição suave de `dur` segundos
export const chaveNoTempo = (t: number, lista: { t: number; v: boolean }[], dur = 0.18) => {
  let k = 0;
  for (let i = 0; i < lista.length; i++) if (lista[i].t <= t) k = i;
  const agora = lista[k].v ? 1 : 0;
  const antes = k > 0 ? (lista[k - 1].v ? 1 : 0) : agora;
  return mistura(antes, agora, prog(t, lista[k].t, dur));
};

// ---------- teclas ----------

export type Combo = { teclas: { tecla: string; em: number }[]; anteriores?: string[]; trocaEm?: number };

// Momento anterior com teclas (para o momento "teclas" continuar a partir delas)
export const anteriorComTeclas = (plano: Plano, m: Momento) => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  const i = ordem.indexOf(m);
  const ant = ordem[i - 1];
  if (!ant || m.de - ant.ate > 0.3) return null;
  return "teclas" in ant && ant.teclas?.length ? ant : null;
};
