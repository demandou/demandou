// A legenda do Terço: até 2 linhas, na área da pessoa, logo abaixo do queixo (no zoom mais fechado)
// e acima da interface do app. Texto branco com sombra discreta; a palavra que está sendo dita
// ganha um sublinhado azul-cobalto que desliza de palavra em palavra.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, SOMBRA_TEXTO, medidas, prog } from "../tema";

// Momentos que mostram a própria fala no palco: a legenda some neles (salvo `legenda: true`).
const MOSTRAM_A_FALA = new Set(["abertura", "capitulo", "frase", "pergunta", "cta"]);
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
const LARGURA = 900;

type Disposta = { w: string; em: number; x: number; linha: number; largura: number };

const dispor = (frase: Frase, tamanho: number, linhas: string[]) => {
  const exata = { peso: PESO, exato: true } as const;
  const espaco = Math.max(larguraTexto(" ", tamanho, exata), tamanho * 0.3);
  const saida: Disposta[] = [];
  let k = 0;
  linhas.forEach((linha, li) => {
    const ws = linha.split(" ");
    const total = ws.reduce((a, w) => a + larguraTexto(w, tamanho, exata), 0) + espaco * (ws.length - 1);
    let x = (1080 - total) / 2;
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

  // uma palavra por item (correções podem juntar duas: "R$ 500"); vazias (aspas soltas) saem
  const palavras = frase.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
  if (!palavras.length) return null;
  const texto = palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: LARGURA, max: 54, min: 42, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.18);
  const disp = dispor({ ...frase, palavras }, fit.tamanho, fit.linhas);
  const { legTopo } = medidas(plano);

  // palavra atual e a anterior (o sublinhado desliza entre as duas)
  let atual = 0;
  disp.forEach((d, i) => {
    if (t >= d.em - 0.02) atual = i;
  });
  const a = disp[Math.max(0, atual - 1)];
  const b = disp[atual];
  const p = atual === 0 || a.linha !== b.linha ? 1 : prog(t, b.em - 0.02, 0.12);
  const sub = {
    x: a.x + (b.x - a.x) * p,
    w: a.largura + (b.largura - a.largura) * p,
    y: legTopo + b.linha * lh + lh * 0.9,
  };
  const entra = prog(t, frase.de - 0.02, 0.14);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: entra }}>
      <div style={{ position: "absolute", left: sub.x - 2, top: sub.y, width: sub.w + 4, height: 7, borderRadius: 4, background: COR.cobalto, boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }} />
      {disp.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: legTopo + d.linha * lh,
            height: lh,
            lineHeight: `${lh}px`,
            fontFamily: FONTE,
            fontWeight: PESO,
            fontSize: fit.tamanho,
            color: COR.branco,
            textShadow: SOMBRA_TEXTO,
            whiteSpace: "nowrap",
          }}
        >
          {d.w}
        </div>
      ))}
    </div>
  );
};
