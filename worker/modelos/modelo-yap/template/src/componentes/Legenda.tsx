// A legenda do Yap: até 2 linhas, logo abaixo do queixo, texto branco com sombra discreta.
// A palavra que está sendo dita ganha uma tarja lima que desliza de palavra em palavra.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, SOMBRA_TEXTO, medidas, prog } from "../tema";

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
const LARGURA = 860;

type Disposta = { w: string; em: number; x: number; linha: number; largura: number };

const dispor = (frase: Frase, tamanho: number, linhas: string[]) => {
  const exata = { peso: PESO, exato: true } as const;
  // espaço largo entre palavras: a tarja da palavra falada não encosta nas vizinhas
  const espaco = Math.max(larguraTexto(" ", tamanho, exata), tamanho * 0.36);
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
  const texto = palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: LARGURA, max: 62, min: 44, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.2);
  const disp = dispor({ ...frase, palavras }, fit.tamanho, fit.linhas);
  const { legTopo } = medidas(plano);

  // palavra atual e a anterior (a tarja desliza entre as duas)
  let atual = 0;
  disp.forEach((d, i) => {
    if (t >= d.em - 0.02) atual = i;
  });
  const anterior = Math.max(0, atual - 1);
  const a = disp[anterior];
  const b = disp[atual];
  // desliza na mesma linha; ao trocar de linha, pula direto (sem atravessar o texto na diagonal)
  const p = atual === 0 || a.linha !== b.linha ? 1 : prog(t, b.em - 0.02, 0.1);
  const padX = Math.round(fit.tamanho * 0.14);
  const tarja = {
    x: a.x + (b.x - a.x) * p - padX,
    y: legTopo + (a.linha + (b.linha - a.linha) * p) * lh + lh * 0.06,
    w: a.largura + (b.largura - a.largura) * p + padX * 2,
    h: lh * 0.92,
  };
  const entrada = prog(t, frase.de - 0.02, 0.14);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada, transform: `translateY(${(1 - entrada) * 10}px)` }}>
      <div
        style={{
          position: "absolute",
          left: tarja.x,
          top: tarja.y,
          width: tarja.w,
          height: tarja.h,
          borderRadius: Math.round(fit.tamanho * 0.22),
          background: COR.lima,
          boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
        }}
      />
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
            letterSpacing: 0,
            whiteSpace: "nowrap",
            color: i === atual && p > 0.5 ? COR.tinta : COR.branco,
            textShadow: i === atual && p > 0.5 ? "none" : SOMBRA_TEXTO,
          }}
        >
          {limpar(d.w)}
        </div>
      ))}
    </div>
  );
};
