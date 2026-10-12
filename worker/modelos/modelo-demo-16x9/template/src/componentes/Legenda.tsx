// A legenda do Demo: 100% do tempo (menos quando um bloco já mostra a própria fala), caixa-alta,
// fonte display condensada (Bebas Neue), laranja-ouro com contorno e sombra marrom-escuros, 2 a 3
// palavras por vez, no terço de baixo, na mesma altura em todos os layouts. Fade-in curto
// (~0,12 s). Sem caixa, sem cor de destaque por palavra.
// No quadro deitado (16:9): centrada no quadro em tela cheia (eu, cheio) e, no split, centrada na
// moldura da pessoa (em cima do peito, como no vertical). Medida com as larguras da Bebas Neue: na
// moldura, mais estreita, o corpo encolhe até caber (nunca vaza).
import { useCurrentFrame, useVideoConfig } from "remotion";
import { layoutNoTempo } from "../camera";
import { BEBAS, CARACTERES } from "../larguras";
import { montarFrases } from "../motor/frases";
import type { Momento, Palavra, Plano } from "../plano";
import { COR, FONTE_LEGENDA, LARGURA, LEGENDA_CHEIO, LEGENDA_MOLDURA, LEGENDA_Y, MOLDURA, prog } from "../tema";

const indice = new Map<string, number>([...CARACTERES].map((c, i) => [c, i]));
// largura da linha na Bebas Neue (px), com o espaçamento de 0,01 em e o contorno de 6 px
const larguraBebas = (texto: string, tamanho: number) => {
  const letras = [...texto];
  const soma = letras.reduce((a, c) => a + (BEBAS[indice.get(c) ?? -1] ?? 420), 0);
  return ((soma / 1000) * tamanho + 0.01 * tamanho * Math.max(0, letras.length - 1)) * 1.03 + 8;
};

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
  // no split, centrada na moldura da pessoa; em tela cheia, no meio do quadro
  const naMoldura = layoutNoTempo(plano, t) === "split";
  const cx = naMoldura ? MOLDURA.x + MOLDURA.w / 2 : LARGURA / 2;
  const larguraMax = naMoldura ? LEGENDA_MOLDURA : LEGENDA_CHEIO;
  // o corpo do vertical (86 a 96 px) na escala do quadro deitado, encolhendo até caber
  let tamanho = p.texto.length > 18 ? 76 : 84;
  while (tamanho > 44 && larguraBebas(p.texto, tamanho) > larguraMax) tamanho -= 2;
  const lh = Math.round(tamanho * 1.1);
  const entra = prog(t, p.de, 0.12, (u) => u);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - larguraMax / 2,
        width: larguraMax,
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
