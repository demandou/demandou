// A legenda da Tela Viva: discreta. Branco, sem caixa, minúscula, semibold ~48 px, sombra leve,
// 2 a 4 palavras por vez (nunca uma frase inteira), no peito (centro em 82% da altura). Troca a
// cada ~0,5 a 1 s com a fala. Sem sublinhado, sem cor de destaque, sem animação de entrada.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases } from "../motor/frases";
import { encaixar } from "../medida";
import type { Momento, Palavra, Plano } from "../plano";
import { COR, FONTE, LEGENDA_Y, SOMBRA_TEXTO } from "../tema";

// Momentos que mostram a própria fala na moldura: a legenda some neles (salvo `legenda: true`).
const MOSTRAM_A_FALA = new Set(["frase", "pergunta", "cta"]);
export const legendaNoMomento = (m: Momento) => m.legenda ?? !MOSTRAM_A_FALA.has(m.tipo);

type Pedaco = { de: number; ate: number; texto: string };

const FUNCIONAIS = new Set("a o as os e é um uma de do da dos das em no na nos nas ao à que se eu te me com por pra pro para sem seu sua mas ou já".split(" "));
const limpar = (w: string) => w.replace(/^["“”']+/, "").replace(/["“”']+$/, "").replace(/[.,;:!]+$/, "");
const fecha = (w: string) => /[.?!…,;:]$/.test(w);

// quebra cada frase do motor em pedaços de até 3 palavras (até ~22 letras), sem terminar em
// artigo ou preposição
const pedacosDe = (plano: Plano): Pedaco[] => {
  const frases = montarFrases({ ...plano, momentos: plano.momentos.map((m) => ({ ...m, legenda: legendaNoMomento(m) })) });
  const saida: Pedaco[] = [];
  for (const f of frases) {
    const ws: Palavra[] = f.palavras.flatMap((p) => limpar(p.w).split(/\s+/).filter(Boolean).map((w) => ({ ...p, w })));
    let grupo: Palavra[] = [];
    const fechar = () => {
      if (!grupo.length) return;
      saida.push({ de: grupo[0].em, ate: f.ate, texto: grupo.map((p) => p.w).join(" ").toLowerCase() });
      grupo = [];
    };
    ws.forEach((p, i) => {
      grupo.push(p);
      const letras = grupo.map((g) => g.w).join(" ").length;
      const proxima = ws[i + 1];
      const pontua = fecha(f.palavras.find((q) => q.em === p.em)?.w ?? "") && /[.?!…;:]$/.test(f.palavras.find((q) => q.em === p.em)?.w ?? "");
      const cheio = grupo.length >= 3 || (grupo.length >= 2 && letras >= 18) || pontua;
      if (cheio && !(proxima && FUNCIONAIS.has(p.w.toLowerCase()) && !pontua)) fechar();
    });
    fechar();
  }
  // cada pedaço dura até o começo do seguinte (o último, até o fim da frase)
  for (let i = 0; i < saida.length - 1; i++) saida[i].ate = Math.min(saida[i].ate, saida[i + 1].de);
  return saida;
};

const guardadas = new WeakMap<object, Pedaco[]>();
export const pedacosDoPlano = (plano: Plano) => {
  let f = guardadas.get(plano);
  if (!f) {
    f = pedacosDe(plano);
    guardadas.set(plano, f);
  }
  return f;
};

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = pedacosDoPlano(plano).find((x) => t >= x.de && t < x.ate);
  if (!p) return null;
  const fit = encaixar(p.texto, { largura: 880, max: 48, min: 38, linhas: 1, fonte: { peso: 600 } });
  const lh = Math.round(fit.tamanho * 1.2);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: 1080,
        top: LEGENDA_Y - lh / 2,
        height: lh,
        lineHeight: `${lh}px`,
        textAlign: "center",
        fontFamily: FONTE,
        fontWeight: 600,
        fontSize: fit.tamanho,
        color: COR.branco,
        textShadow: SOMBRA_TEXTO,
        whiteSpace: "nowrap",
      }}
    >
      {p.texto}
    </div>
  );
};
