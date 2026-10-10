// A legenda da Manchete: palavra a palavra, 2 a 4 palavras por vez, em minúsculas, branca, bold, SEM
// caixa e SEM destaque de cor, só uma sombra leve. Centrada, logo abaixo do queixo (sobre o peito).
// Troca em corte seco, sincronizada com a fala.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar } from "../medida";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, MARGEM, SOMBRA_TEXTO, medidas } from "../tema";

// Momentos que mostram a própria fala na faixa: a legenda some neles (salvo `legenda: true`).
const MOSTRAM_A_FALA = new Set(["abertura", "frase", "pergunta", "cta"]);
export const legendaNoMomento = (m: Momento) => m.legenda ?? !MOSTRAM_A_FALA.has(m.tipo);

type Pedaco = { de: number; ate: number; texto: string };

const FUNCIONAIS = new Set("a o as os e é um uma uns umas de do da dos das em no na nos nas ao aos à às que se eu te me lhe com por pra pro para sem sua seu mas ou nem já".split(" "));
const fecha = (w: string) => /[.?!…,;:]$/.test(w);

// "esse é o novo airbnb." → pedaços de 2 a 4 palavras; nunca termina em artigo/preposição
const pedacos = (frase: Frase): Pedaco[] => {
  const ps = frase.palavras
    .map((p) => ({ ...p, w: p.w.replace(/^["“”']+|["“”']+$/g, "").toLowerCase() }))
    .filter((p) => p.w.trim());
  const saida: Pedaco[] = [];
  let atual: typeof ps = [];
  const fechar = () => {
    if (!atual.length) return;
    saida.push({ de: atual[0].em, ate: 0, texto: atual.map((p) => p.w).join(" ") });
    atual = [];
  };
  ps.forEach((p, i) => {
    atual.push(p);
    const letras = atual.reduce((a, x) => a + x.w.length + 1, 0);
    const resto = ps.length - 1 - i;
    const pontua = fecha(p.w);
    const bom = !FUNCIONAIS.has(p.w.replace(/[^\p{L}]/gu, "")) || pontua;
    if (resto === 0) return;
    if (atual.length >= 4 || letras >= 24 || (pontua && atual.length >= 2)) {
      if (bom) fechar();
    } else if (pontua && atual.length === 1 && resto > 0 && i === 0) {
      // frase de uma palavra só ("cybercab."): fica sozinha
      fechar();
    }
  });
  fechar();
  // uma palavra sozinha no fim junta com o pedaço anterior
  if (saida.length > 1 && !saida[saida.length - 1].texto.includes(" ") && saida[saida.length - 2].texto.split(" ").length < 4) {
    const u = saida.pop()!;
    saida[saida.length - 1].texto += " " + u.texto;
  }
  saida.forEach((s, i) => (s.ate = saida[i + 1] ? saida[i + 1].de : frase.ate));
  return saida;
};

const guardadas = new WeakMap<object, Pedaco[]>();
const pedacosDo = (plano: Plano) => {
  let f = guardadas.get(plano);
  if (!f) {
    const frases = montarFrases({ ...plano, momentos: plano.momentos.map((m) => ({ ...m, legenda: legendaNoMomento(m) })) });
    f = frases.flatMap(pedacos);
    guardadas.set(plano, f);
  }
  return f;
};

const PESO = 800 as const;

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = pedacosDo(plano).find((x) => t >= x.de - 0.02 && t < x.ate);
  if (!p) return null;
  // pequena, como no original (~4% da altura): é a fala, não um título
  const fit = encaixar(p.texto, { largura: 1080 - 2 * MARGEM, max: 50, min: 38, linhas: 1, fonte: { peso: PESO } });
  const { legTopo } = medidas(plano);
  return (
    <div style={{ position: "absolute", left: 0, top: legTopo, width: 1080, textAlign: "center", fontFamily: FONTE, fontWeight: PESO, fontSize: fit.tamanho, lineHeight: `${Math.round(fit.tamanho * 1.2)}px`, color: COR.branco, textShadow: SOMBRA_TEXTO, whiteSpace: "nowrap" }}>
      {p.texto}
    </div>
  );
};
