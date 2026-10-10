// A legenda do Demo: 100% do tempo (menos quando um bloco já mostra a própria fala), caixa-alta,
// fonte display condensada (Bebas Neue), laranja-ouro com contorno e sombra marrom-escuros, 2 a 3
// palavras por vez, centrada a 80% da altura, na mesma altura em todos os layouts. Fade-in curto
// (~0,12 s). Sem caixa, sem cor de destaque por palavra.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases } from "../motor/frases";
import type { Momento, Palavra, Plano } from "../plano";
import { COR, FONTE_LEGENDA, LEGENDA_Y, prog } from "../tema";

// Momentos que mostram a própria fala na moldura: a legenda some neles (salvo `legenda: true`).
const MOSTRAM_A_FALA = new Set(["frase", "pergunta"]);
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
      saida.push({ de: grupo[0].em, ate: f.ate, texto: grupo.map((p) => p.w).join(" ").toUpperCase() });
      grupo = [];
    };
    ws.forEach((p, i) => {
      grupo.push(p);
      const letras = grupo.map((g) => g.w).join(" ").length;
      const proxima = ws[i + 1];
      const pontua = fecha(f.palavras.find((q) => q.em === p.em)?.w ?? "") && /[.?!…;:]$/.test(f.palavras.find((q) => q.em === p.em)?.w ?? "");
      const cheio = grupo.length >= 3 || (grupo.length >= 2 && letras >= 15) || pontua;
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
  const tamanho = p.texto.length > 18 ? 86 : 96;
  const lh = Math.round(tamanho * 1.1);
  const entra = prog(t, p.de, 0.12, (u) => u);
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
        fontFamily: FONTE_LEGENDA,
        fontWeight: 400,
        fontSize: tamanho,
        letterSpacing: "0.01em",
        color: COR.ouro,
        WebkitTextStroke: `6px ${COR.ouroContorno}`,
        paintOrder: "stroke fill",
        textShadow: "0 5px 0 rgba(58,30,8,0.9), 0 8px 14px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
        opacity: 0.35 + 0.65 * entra,
      }}
    >
      {p.texto}
    </div>
  );
};
