// A pessoa e o layout. Três arranjos:
//  - "cheio": quadro inteiro (antes da virada; e entre as pranchas, quando a virada trocou a roupa);
//  - "consultorio": a pessoa grande numa moldura sobre o papel clínico (virada sem vídeo de figurino);
//  - "dividido": a prancha clínica em cima e a pessoa numa moldura larga embaixo (toda prancha).
//  - "tela": a linha do tempo em tela cheia (a moldura desce e some; a voz continua).
// A moldura tem cantos arredondados, borda fina e sombra suave; o vídeo dela não muda de cor.
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { type Caixa, enquadrar, type Rosto, rostoNaTela } from "../motor/caixa";
import { type Frase as FraseMotor, montarFrases } from "../motor/frases";
import type { Momento, Palavra, Plano, Virada } from "../plano";
import { CARD, CARD_GRANDE, EASE_INOUT, EASE_OUT, FONT, K, LIMITE_APP, lerp, prog } from "../tema";
import { encaixar } from "../medida";

export type Layout = "cheio" | "consultorio" | "dividido" | "tela";
export const PRANCHA = new Set<Momento["tipo"]>(["anatomia", "corte", "linhaDoTempo", "abertura", "topicos", "passos", "numero", "comparacao", "grafico", "destaque", "definicao", "frase", "pergunta", "cta"]);

export const viradaDo = (plano: Plano) => plano.momentos.find((m): m is Virada => m.tipo === "virada");
export const trocaDa = (v: Virada) => v.trocaEm ?? Math.max(v.de, v.ate - 0.6);

type Evento = { t: number; layout: Layout; dur: number };

// a sequência de arranjos do vídeo
export const eventosDoLayout = (plano: Plano): Evento[] => {
  const v = viradaDo(plano);
  const troca = v ? trocaDa(v) : Infinity;
  const depois: Layout = v && !v.video ? "consultorio" : "cheio";
  const baseEm = (t: number): Layout => (t >= troca + 0.6 ? depois : "cheio");
  const blocos = plano.momentos
    .filter((m) => PRANCHA.has(m.tipo))
    .map((m) => ({ de: m.de, ate: m.ate, layout: (m.tipo === "linhaDoTempo" && m.telaCheia ? "tela" : "dividido") as Layout }))
    .sort((a, b) => a.de - b.de);
  // pranchas seguidas (vão < 1,6 s) não desfazem o layout
  const juntos: typeof blocos = [];
  for (const b of blocos) {
    const u = juntos[juntos.length - 1];
    if (u && b.de - u.ate < 1.6 && u.layout === b.layout) u.ate = Math.max(u.ate, b.ate);
    else if (u && b.de - u.ate < 1.6) {
      u.ate = Math.min(u.ate, b.de);
      juntos.push({ ...b });
    } else juntos.push({ ...b });
  }
  const ev: Evento[] = [{ t: -1, layout: "cheio", dur: 0 }];
  if (v && !v.video) ev.push({ t: troca + 0.6, layout: "consultorio", dur: 0 });
  juntos.forEach((b, i) => {
    ev.push({ t: b.de, layout: b.layout, dur: b.layout === "tela" ? 0.45 : 0.66 });
    const prox = juntos[i + 1];
    if (!prox || prox.de - b.ate >= 1.6) ev.push({ t: b.ate, layout: baseEm(b.ate), dur: 0.55 });
  });
  return ev.sort((a, b) => a.t - b.t);
};

// zoom do quadro cheio: alterna 1,00 / 1,12 a cada corte (o "punch" do corte) + empurrão lento de 1,5%
const zoomCheio = (plano: Plano, t: number) => {
  const cortes = [...(plano.cortesEm ?? [])].filter((c) => c > 0.05 && c < plano.duracao - 0.05).sort((a, b) => a - b);
  let i = 0;
  while (i < cortes.length && cortes[i] <= t + 1e-6) i++;
  const a = i ? cortes[i - 1] : 0;
  const b = i < cortes.length ? cortes[i] : plano.duracao;
  const p = Math.max(0, Math.min(1, (t - a) / Math.max(0.1, b - a)));
  return (i % 2 ? 1.12 : 1.0) * (1 + 0.015 * EASE_INOUT(p));
};

const ZOOM_DIVIDIDO = 1.215;
type Estado = { caixa: Caixa; moldura: number; papel: number; opacidade: number };
const estadoDe = (layout: Layout, plano: Plano, t: number): Estado => {
  // altura do rosto, em fração do vídeo de trabalho
  const ry = (plano.rosto.y * 1920) / (plano.videoAltura ?? 1920);
  switch (layout) {
    case "consultorio":
      return { caixa: { x: CARD_GRANDE.x, y: CARD_GRANDE.y, w: CARD_GRANDE.w, h: CARD_GRANDE.h, raio: CARD_GRANDE.raio, zoom: 1.04, ancoraY: 0.3 }, moldura: 1, papel: 1, opacidade: 1 };
    case "dividido":
      return { caixa: { x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h, raio: CARD.raio, zoom: ZOOM_DIVIDIDO, ancoraY: 0.518 }, moldura: 1, papel: 1, opacidade: 1 };
    case "tela":
      return { caixa: { x: CARD.x, y: CARD.y + 260, w: CARD.w, h: CARD.h, raio: CARD.raio, zoom: ZOOM_DIVIDIDO, ancoraY: 0.518 }, moldura: 1, papel: 1, opacidade: 0 };
    default:
      return { caixa: { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: zoomCheio(plano, t), ancoraY: Math.min(0.6, Math.max(0.2, ry)) }, moldura: 0, papel: 0, opacidade: 1 };
  }
};

export const estadoDaPessoa = (plano: Plano, eventos: Evento[], t: number): Estado & { alvo: Layout } => {
  let i = 0;
  for (let k = 0; k < eventos.length; k++) if (eventos[k].t <= t) i = k;
  const ev = eventos[i];
  const agora = estadoDe(ev.layout, plano, t);
  if (i === 0 || ev.dur <= 0) return { ...agora, alvo: ev.layout };
  // o anterior pode estar no meio da própria transição
  const antes = i > 1 ? estadoDaPessoa(plano, eventos.slice(0, i), t) : estadoDe(eventos[i - 1].layout, plano, t);
  const p = EASE_INOUT(Math.max(0, Math.min(1, (t - ev.t) / ev.dur)));
  if (p >= 1) return { ...agora, alvo: ev.layout };
  const a = antes.caixa;
  const b = agora.caixa;
  return {
    caixa: { x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), raio: lerp(a.raio ?? 0, b.raio ?? 0, p), zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, p), ancoraY: lerp(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3, p) },
    moldura: lerp(antes.moldura, agora.moldura, p),
    papel: lerp(antes.papel, agora.papel, p),
    opacidade: lerp(antes.opacidade, agora.opacidade, p),
    alvo: ev.layout,
  };
};

export const sombraDaMoldura = (k: number) =>
  k > 0 ? `0 26px 70px rgba(19,32,47,${0.22 * k}), 0 0 0 1px rgba(19,32,47,${0.1 * k}), inset 0 0 0 1.5px rgba(255,255,255,${0.7 * k})` : undefined;

/** o rastro do rosto deslocado: para um vídeo que começa em `de` segundos do vídeo de trabalho */
export const rostoDeslocado = (rosto: Rosto, de: number): Rosto => {
  const r = rosto.rastro;
  if (!r || de <= 0) return rosto;
  const k = Math.max(0, Math.round(de / r.passo));
  return { ...rosto, rastro: { ...r, x: r.x.slice(k), y: r.y.slice(k), cx: r.cx.slice(k), cy: r.cy.slice(k) } };
};

/** ponto do vídeo (frações) → tela, com a moldura do instante t */
export const pontoNoVideo = (caixa: Caixa, plano: Plano, t: number, x: number, y: number) => {
  const e = enquadrar(caixa, plano.rosto as Rosto, plano.videoAltura ?? 1920, t);
  return { x: caixa.x + e.esquerda + x * e.lv, y: caixa.y + e.topo + y * e.av, escala: e.lv / 1080 };
};

// ——— legenda: toda branca, contorno preto e leve sombra; até 3 palavras por vez, cada uma sobe na fala ———
type Pedaco = { de: number; fim: number; palavras: Palavra[] };
const fatiar = (frases: FraseMotor[]): Pedaco[] => {
  const out: Pedaco[] = [];
  for (const f of frases) {
    let atual: Palavra[] = [];
    const inicio = out.length;
    const fechar = () => {
      if (atual.length) out.push({ de: atual[0].em, fim: atual[atual.length - 1].ate, palavras: atual });
      atual = [];
    };
    f.palavras.forEach((w, i) => {
      const len = atual.reduce((s, x) => s + x.w.length + 1, 0) + w.w.length;
      if (atual.length && (atual.length >= 3 || len > 18)) fechar();
      atual.push(w);
      const prox = f.palavras[i + 1];
      if (/[.,?!:;…]$/.test(w.w) || (prox && prox.em - w.ate > 0.35)) fechar();
    });
    fechar();
    // cada pedaço fica até o próximo começar (ou +0,3 s), sem passar do fim da frase
    for (let k = inicio; k < out.length; k++) {
      const prox = out[k + 1];
      out[k].fim = Math.min(out[k].fim + 0.3, k + 1 < out.length ? prox.de : f.ate);
    }
  }
  return out;
};

export const Legenda: React.FC<{ plano: Plano; t: number; y: number }> = ({ plano, t, y }) => {
  const pedacos = useMemo(() => fatiar(montarFrases(plano)), [plano]);
  const c = pedacos.find((p) => t >= p.de - 0.05 && t < p.fim);
  if (!c) return null;
  const texto = c.palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: 900, max: 66, min: 44, linhas: 1, fonte: { peso: 800 } });
  return (
    <div style={{ position: "absolute", left: 70, width: 940, top: y, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.12, letterSpacing: "-0.015em", color: "#FFF8F2", WebkitTextStroke: "10px #000", paintOrder: "stroke fill", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.45))", whiteSpace: "nowrap" }}>
      {c.palavras.map((w, k) => {
        const p = prog(t, w.em - 0.06, w.em + 0.12, EASE_OUT);
        const ativa = t >= w.em - 0.04 && t < w.ate + 0.02;
        return (
          <span key={k} style={{ display: "inline-block", clipPath: "inset(-0.6em -0.35em 0 -0.35em)", verticalAlign: "bottom", padding: "0.04em 0.02em 0.1em", marginRight: k < c.palavras.length - 1 ? "0.2em" : 0 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 110}%) scale(${ativa ? 1.04 : 1})`, opacity: 0.15 + 0.85 * p }}>{w.w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** altura (centro) da legenda: abaixo do queixo; na tela dividida, na costura acima da cabeça */
export const alturaDaLegenda = (plano: Plano, est: Estado & { alvo: Layout }, t: number) => {
  if (est.alvo === "tela") return 1560;
  if (est.alvo === "dividido" && plano.legendaNoDividido !== "queixo") return CARD.y + 90;
  const rs = rostoNaTela(est.caixa, plano.rosto as Rosto, plano.videoAltura ?? 1920, t);
  const y = rs.y + rs.largura * 1.45;
  const limite = Math.min(LIMITE_APP - 60, est.caixa.y + est.caixa.h - 70);
  return Math.max(rs.y + rs.largura * 0.95, Math.min(limite, y));
};

/** tarja com o nome (crachá clínico), embaixo à esquerda, nos primeiros segundos */
export const Tarja: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  if (!plano.marca?.nome) return null;
  const p = Math.min(prog(t, 0.4, 0.8), 1 - prog(t, 4.6, 5.0));
  if (p <= 0) return null;
  const nome = encaixar(plano.marca.nome, { largura: 560, max: 40, min: 34, linhas: 1, fonte: { peso: 700 } });
  const area = plano.marca.area ? encaixar(plano.marca.area, { largura: 560, max: 28, min: 22, linhas: 1, fonte: { peso: 500 } }) : null;
  return (
    <div style={{ position: "absolute", left: 88, bottom: 1920 - (LIMITE_APP - 14), opacity: p, transform: `translateX(${(1 - p) * -30}px)`, padding: "14px 26px 16px 22px", borderRadius: 18, background: "rgba(255,255,255,0.94)", boxShadow: `inset 0 0 0 1.5px ${K.line}, 0 10px 26px rgba(19,32,47,0.18)`, fontFamily: FONT, display: "flex", gap: 16, alignItems: "center" }}>
      <div style={{ width: 6, alignSelf: "stretch", borderRadius: 3, background: K.acc }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: nome.tamanho, color: K.ink, lineHeight: 1.1, whiteSpace: "nowrap" }}>{nome.linhas[0]}</div>
        {area ? <div style={{ fontWeight: 500, fontSize: area.tamanho, color: K.slate, marginTop: 4, whiteSpace: "nowrap" }}>{area.linhas[0]}</div> : null}
      </div>
    </div>
  );
};

/** guias de conferência (stills --guias): rosto, topo seguro, moldura, legenda e o limite do app */
export const Guias: React.FC<{ rosto: { x: number; y: number; largura: number }; yLegenda: number; topoMoldura: number }> = ({ rosto, yLegenda, topoMoldura }) => {
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONT, fontSize: 24, fontWeight: 700, color: cor }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      {linha(130, "#2FBF4A", "topo seguro (130)")}
      {linha(topoMoldura, "#FF4FC3", "topo da moldura")}
      {linha(yLegenda, "#E0A800", "centro da legenda")}
      {linha(LIMITE_APP, "#FF4B4B", "limite do app (1700)")}
      <div style={{ position: "absolute", left: 64, top: 0, width: 2, height: 1920, background: "rgba(47,191,74,0.6)" }} />
      <div style={{ position: "absolute", left: 1016, top: 0, width: 2, height: 1920, background: "rgba(47,191,74,0.6)" }} />
      <div style={{ position: "absolute", left: rosto.x - rosto.largura / 2, top: rosto.y - rosto.largura * 0.62, width: rosto.largura, height: rosto.largura * 1.24, border: "4px solid #1FA8FF", borderRadius: "50%" }} />
    </AbsoluteFill>
  );
};
