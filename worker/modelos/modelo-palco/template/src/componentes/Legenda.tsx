// A legenda do Palco: até 2 linhas, a palavra falada ganha uma tarja azul suave.
// - modo (a), a pessoa em quadro cheio: centralizada logo abaixo do queixo, texto claro com sombra;
// - modo (b), o palco: numa faixa ao lado da janela da pessoa, abaixo do painel (nunca sobre a borda
//   de uma moldura). Na troca de modo ela muda de lugar com uma piscada curta.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import { estadoNoTempo } from "../palco";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, JANELA, PAINEL, SOMBRA_TEXTO, faixaDaLegenda, medidas, prog } from "../tema";

// Momentos que mostram a própria fala: a legenda some neles (salvo `legenda: true`).
const MOSTRAM_A_FALA = new Set(["abertura", "frase", "pergunta", "cta"]);
export const legendaNoMomento = (m: Momento) => m.legenda ?? !MOSTRAM_A_FALA.has(m.tipo);

const guardadas = new WeakMap<object, Frase[]>();
const frasesDo = (plano: Plano) => {
  let f = guardadas.get(plano);
  if (!f) {
    f = montarFrases({ ...plano, momentos: plano.momentos.map((m) => ({ ...m, legenda: legendaNoMomento(m) })) });
    guardadas.set(plano, f);
  }
  return f;
};

// pontuação de fim some da tela (fica a de pergunta e exclamação)
const limpar = (w: string) => w.replace(/^["“”']+/, "").replace(/["“”']+$/, "").replace(/[.,;:]+$/, "");

const PESO = 800 as const;

type Disposta = { w: string; em: number; x: number; linha: number; largura: number };

const dispor = (frase: Frase, tamanho: number, linhas: string[], x0: number, larguraFaixa: number, alinhar: "centro" | "esq") => {
  const exata = { peso: PESO, exato: true } as const;
  const espaco = Math.max(larguraTexto(" ", tamanho, exata), tamanho * 0.36);
  const saida: Disposta[] = [];
  let k = 0;
  linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, tamanho, exata), 0) + espaco * (ws.length - 1);
    let x = alinhar === "centro" ? x0 + (larguraFaixa - total) / 2 : x0;
    for (const w of ws) {
      const largura = larguraTexto(w, tamanho, exata);
      saida.push({ w, em: frase.palavras[k]?.em ?? frase.de, x, linha: li, largura });
      x += largura + espaco;
      k++;
    }
  });
  return saida;
};

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const frase = frasesDo(plano).find((f) => t >= f.de && t < f.ate);
  if (!frase) return null;
  const est = estadoNoTempo(plano, t);
  const noPalco = est.p >= 0.5;
  // some um instante quando a troca de modo passa do meio
  const piscada = Math.min(1, Math.abs(est.p - 0.5) / 0.14);

  const palavras = frase.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
  const texto = palavras.map((p) => p.w).join(" ");

  let x0: number;
  let larguraFaixa: number;
  let alinhar: "centro" | "esq";
  let max: number;
  let min: number;
  if (noPalco) {
    const f = faixaDaLegenda(est.canto);
    x0 = f.x;
    larguraFaixa = f.w;
    alinhar = "esq";
    max = 46;
    min = 36;
  } else {
    x0 = (1080 - 860) / 2;
    larguraFaixa = 860;
    alinhar = "centro";
    max = 62;
    min = 44;
  }
  const fit = encaixar(texto, { largura: larguraFaixa, max, min, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.2);
  const disp = dispor({ ...frase, palavras }, fit.tamanho, fit.linhas, x0, larguraFaixa, alinhar);
  // topo: no modo (a), logo abaixo do queixo; no palco, centralizada na faixa ao lado da janela
  const topo = noPalco
    ? Math.round(JANELA.y + JANELA.h - 56 - lh * fit.linhas.length - 40)
    : medidas(plano).legTopo;

  let atual = 0;
  disp.forEach((d, i) => {
    if (t >= d.em - 0.02) atual = i;
  });
  const anterior = Math.max(0, atual - 1);
  const a = disp[anterior];
  const b = disp[atual];
  const p = atual === 0 || a.linha !== b.linha ? 1 : prog(t, b.em - 0.02, 0.1);
  const padX = Math.round(fit.tamanho * 0.14);
  const tarja = {
    x: a.x + (b.x - a.x) * p - padX,
    y: topo + (a.linha + (b.linha - a.linha) * p) * lh + lh * 0.06,
    w: a.largura + (b.largura - a.largura) * p + padX * 2,
    h: lh * 0.92,
  };
  const entrada = prog(t, frase.de - 0.02, 0.14);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * piscada, transform: `translateY(${(1 - entrada) * 10}px)` }}>
      {noPalco ? (
        <div style={{ position: "absolute", left: x0 - 26, top: topo - 18, width: larguraFaixa + 40, height: lh * fit.linhas.length + 36, borderRadius: 30, background: "rgba(19,21,24,0.88)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: tarja.x,
          top: tarja.y,
          width: tarja.w,
          height: tarja.h,
          borderRadius: Math.round(fit.tamanho * 0.22),
          background: COR.azul,
          boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
        }}
      />
      {disp.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: topo + d.linha * lh,
            height: lh,
            lineHeight: `${lh}px`,
            fontFamily: FONTE,
            fontWeight: PESO,
            fontSize: fit.tamanho,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            color: COR.branco,
            textShadow: i === atual && p > 0.5 ? "none" : SOMBRA_TEXTO,
          }}
        >
          {limpar(d.w)}
        </div>
      ))}
    </div>
  );
};
