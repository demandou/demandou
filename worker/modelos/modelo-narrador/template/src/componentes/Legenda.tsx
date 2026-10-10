// A legenda do Narrador: até 2 linhas no terço de baixo, na mesma altura sobre a pessoa e sobre as
// imagens. Texto marfim, sem caixa; as palavras ainda não ditas ficam um pouco apagadas e a palavra
// falada ganha um traço vermelhão fino embaixo, que desliza de palavra em palavra.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, SOMBRA_TEXTO, medidas, prog } from "../tema";

// Momentos em que a legenda continua por padrão: a imagem e o letreiro (a voz segue por cima).
const COM_LEGENDA = new Set(["cena", "letreiro"]);
export const legendaNoMomento = (m: Momento) => m.legenda ?? COM_LEGENDA.has(m.tipo);

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

const PESO = 700 as const;
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

  const palavras = frase.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
  const texto = palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: LARGURA, max: 58, min: 42, linhas: 2, fonte: { peso: PESO } });
  const lh = Math.round(fit.tamanho * 1.24);
  const disp = dispor({ ...frase, palavras }, fit.tamanho, fit.linhas);
  const { legTopo } = medidas(plano);

  let atual = 0;
  disp.forEach((d, i) => {
    if (t >= d.em - 0.02) atual = i;
  });
  const anterior = Math.max(0, atual - 1);
  const a = disp[anterior];
  const b = disp[atual];
  // o traço desliza na mesma linha; ao trocar de linha, pula direto
  const p = atual === 0 || a.linha !== b.linha ? 1 : prog(t, b.em - 0.02, 0.12);
  const traco = {
    x: a.x + (b.x - a.x) * p,
    y: legTopo + (a.linha + (b.linha - a.linha) * p) * lh + lh * 0.9,
    w: a.largura + (b.largura - a.largura) * p,
  };
  const entrada = prog(t, frase.de - 0.02, 0.16);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada, transform: `translateY(${(1 - entrada) * 8}px)` }}>
      {disp.map((d, i) => {
        const dita = t >= d.em - 0.02;
        return (
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
              whiteSpace: "nowrap",
              color: COR.marfim,
              opacity: dita ? 1 : 0.55,
              textShadow: SOMBRA_TEXTO,
            }}
          >
            {d.w}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: traco.x,
          top: traco.y,
          width: traco.w,
          height: Math.max(4, Math.round(fit.tamanho * 0.08)),
          borderRadius: 3,
          background: COR.vermelhao,
          boxShadow: "0 1px 6px rgba(0,0,0,0.35)",
        }}
      />
    </div>
  );
};
