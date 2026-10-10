// A legenda da Tese: palavra a palavra em blocos de 2 a 4 palavras, tudo minúsculo, branco com
// contorno preto fino, sem caixa e sem cor de destaque, ~56 px, centrada em x 50% e y 83,9%
// (1610), igual em todos os enquadramentos. Troca em corte seco, sincronizada com a fala.
// A pontuação fica (vírgula, ponto, aspas). Some só onde o plano pede (`legenda: false`).
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases } from "../motor/frases";
import { larguraTexto } from "../medida";
import type { Momento, Palavra, Plano } from "../plano";
import { COR, FONTE, LEG_TAMANHO, LEG_Y } from "../tema";

export const legendaNoMomento = (m: Momento) => m.legenda ?? true;

type Bloco = { de: number; ate: number; texto: string };

const QUEBRA = /[.?!…,;:]["”']?$/;
// monta os blocos de 2 a 4 palavras (sem deixar uma palavra sozinha)
const blocosDaFrase = (palavras: Palavra[], fim: number): Bloco[] => {
  const grupos: Palavra[][] = [];
  let atual: Palavra[] = [];
  palavras.forEach((p, i) => {
    atual.push(p);
    const resto = palavras.length - i - 1;
    const chars = atual.reduce((n, x) => n + x.w.length + 1, 0);
    const cheio = atual.length >= 4 || (atual.length >= 3 && chars > 14) || chars > 22;
    const quebra = QUEBRA.test(p.w) && atual.length >= 2;
    if ((cheio || quebra) && resto !== 1) {
      grupos.push(atual);
      atual = [];
    } else if ((cheio || quebra) && resto === 1 && atual.length < 4) {
      // sobra uma palavra: ela vai junto
    } else if (cheio || quebra) {
      grupos.push(atual);
      atual = [];
    }
  });
  if (atual.length) grupos.push(atual);
  return grupos.map((g, i) => ({
    de: g[0].em,
    ate: i < grupos.length - 1 ? grupos[i + 1][0].em : fim,
    texto: g.map((p) => p.w).join(" ").toLowerCase(),
  }));
};

const guardados = new WeakMap<object, Bloco[]>();
const blocosDo = (plano: Plano) => {
  let b = guardados.get(plano);
  if (!b) {
    b = montarFrases({ ...plano, momentos: plano.momentos.map((m) => ({ ...m, legenda: legendaNoMomento(m) })) }).flatMap((f) =>
      blocosDaFrase(f.palavras, f.ate + 0.25),
    );
    guardados.set(plano, b);
  }
  return b;
};

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const bloco = blocosDo(plano).find((b) => t >= b.de - 0.02 && t < b.ate);
  if (!bloco) return null;
  let tamanho = LEG_TAMANHO;
  while (tamanho > 40 && larguraTexto(bloco.texto, tamanho, { peso: 700 }) > 950) tamanho -= 2;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: LEG_Y - tamanho * 0.7,
        height: tamanho * 1.4,
        lineHeight: `${tamanho * 1.4}px`,
        textAlign: "center",
        whiteSpace: "nowrap",
        fontFamily: FONTE,
        fontWeight: 700,
        fontSize: tamanho,
        color: COR.branco,
        WebkitTextStroke: "7px #000",
        paintOrder: "stroke fill",
        textShadow: "0 2px 8px rgba(0,0,0,0.35)",
      }}
    >
      {bloco.texto}
    </div>
  );
};
