import { prog, Traco } from "../anim";
import type { Icone, Queda, Tinta } from "../plano";
import { cor } from "../tema";

// Ícones a traço dos ingredientes (viewBox 120×120). Cada um tem:
// - `forma`: áreas chapadas (o corpo areia e um detalhe de acento), que acendem depois do traço;
// - `tracos`: as linhas, que se desenham uma depois da outra;
// - `cai` e `tinta`: o jeito padrão de cair na panela e a cor que vira lá dentro.
// Mesma espessura e pontas redondas em todos: parecem do mesmo ilustrador.
type Acento = "pistache" | "caramelo" | "cacau" | "creme";
type Def = { forma: { d: string; cor: "corpo" | Acento }[]; tracos: string[]; cai: Queda; tinta: Tinta };

const elipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
const circulo = (cx: number, cy: number, r: number) => elipse(cx, cy, r, r);

export const ICONES: Record<Icone, Def> = {
  // lata (leite condensado, creme de leite em lata, milho…)
  lata: {
    forma: [
      { d: "M28 36 L28 94 A32 9 0 0 0 92 94 L92 36 Z", cor: "corpo" },
      { d: "M28 56 A32 9 0 0 0 92 56 L92 76 A32 9 0 0 1 28 76 Z", cor: "pistache" },
    ],
    tracos: [
      elipse(60, 36, 32, 9),
      "M28 36 L28 94 A32 9 0 0 0 92 94 L92 36",
      "M28 56 A32 9 0 0 0 92 56",
      "M28 76 A32 9 0 0 0 92 76",
      "M50 33 Q60 28 70 33",
    ],
    cai: "despeja",
    tinta: "creme",
  },
  // colher de sopa, de lado
  colher: {
    forma: [{ d: "M66 30 C80 18 104 22 102 38 C100 52 78 58 66 50 C60 45 60 36 66 30 Z", cor: "pistache" }],
    tracos: ["M66 30 C80 18 104 22 102 38 C100 52 78 58 66 50 C60 45 60 36 66 30 Z", "M64 48 L22 96", "M22 96 L18 100"],
    cai: "pedaco",
    tinta: "manteiga",
  },
  // pote com tampa (chocolate em pó, cacau, café, granulado…)
  pote: {
    forma: [
      { d: "M34 48 L34 92 Q34 100 42 100 L78 100 Q86 100 86 92 L86 48 Z", cor: "corpo" },
      { d: "M30 32 Q30 26 36 26 L84 26 Q90 26 90 32 L90 48 L30 48 Z", cor: "cacau" },
    ],
    tracos: [
      "M30 32 Q30 26 36 26 L84 26 Q90 26 90 32 L90 48 L30 48 Z",
      "M34 48 L34 92 Q34 100 42 100 L78 100 Q86 100 86 92 L86 48",
      "M46 66 L74 66",
      "M46 80 L66 80",
    ],
    cai: "po",
    tinta: "cacau",
  },
  // tablete de manteiga
  manteiga: {
    forma: [
      { d: "M20 58 L44 40 L100 40 L76 58 Z", cor: "creme" },
      { d: "M20 58 L76 58 L76 88 L20 88 Z", cor: "corpo" },
      { d: "M76 58 L100 40 L100 70 L76 88 Z", cor: "caramelo" },
    ],
    tracos: ["M20 58 L44 40 L100 40 L76 58 Z", "M20 58 L20 88 L76 88 L76 58", "M76 88 L100 70 L100 40", "M40 58 L40 88"],
    cai: "pedaco",
    tinta: "manteiga",
  },
  ovo: {
    forma: [{ d: "M60 18 C82 18 94 54 94 74 C94 94 80 104 60 104 C40 104 26 94 26 74 C26 54 38 18 60 18 Z", cor: "corpo" }],
    tracos: ["M60 18 C82 18 94 54 94 74 C94 94 80 104 60 104 C40 104 26 94 26 74 C26 54 38 18 60 18 Z", "M42 56 Q46 44 52 38"],
    cai: "despeja",
    tinta: "manteiga",
  },
  // xícara (medida)
  xicara: {
    forma: [{ d: "M22 40 L82 40 L76 92 Q75 100 66 100 L38 100 Q29 100 28 92 Z", cor: "corpo" }],
    tracos: ["M22 40 L82 40 L76 92 Q75 100 66 100 L38 100 Q29 100 28 92 Z", "M80 52 Q100 52 98 68 Q96 82 77 80", "M36 54 L68 54"],
    cai: "despeja",
    tinta: "branco",
  },
  // caixa de leite
  leite: {
    forma: [
      { d: "M34 42 L86 42 L86 104 L34 104 Z", cor: "corpo" },
      { d: "M34 42 L48 22 L72 22 L86 42 Z", cor: "pistache" },
    ],
    tracos: ["M34 42 L48 22 L72 22 L86 42", "M34 42 L34 104 L86 104 L86 42 Z", "M48 22 L48 14 L72 14 L72 22", "M48 64 L72 64 M48 76 L66 76"],
    cai: "despeja",
    tinta: "branco",
  },
  // caixinha (creme de leite, leite de coco)
  caixinha: {
    forma: [{ d: "M26 46 L94 46 L94 92 L26 92 Z", cor: "corpo" }, { d: "M26 46 L38 34 L82 34 L94 46 Z", cor: "creme" }],
    tracos: ["M26 46 L38 34 L82 34 L94 46", "M26 46 L26 92 L94 92 L94 46 Z", "M44 62 L76 62", "M44 74 L68 74"],
    cai: "despeja",
    tinta: "branco",
  },
  garrafa: {
    forma: [{ d: "M48 40 Q36 46 36 60 L36 100 Q36 106 42 106 L78 106 Q84 106 84 100 L84 60 Q84 46 72 40 Z", cor: "corpo" }, { d: "M50 12 L70 12 L70 24 L50 24 Z", cor: "pistache" }],
    tracos: ["M50 12 L70 12 L70 24 L50 24 Z", "M52 24 L52 40 Q36 46 36 60 L36 100 Q36 106 42 106 L78 106 Q84 106 84 100 L84 60 Q84 46 68 40 L68 24", "M44 70 L76 70", "M44 90 L76 90"],
    cai: "despeja",
    tinta: "branco",
  },
  // açúcar em cubos
  acucar: {
    forma: [
      { d: "M24 62 L58 62 L58 96 L24 96 Z", cor: "creme" },
      { d: "M62 62 L96 62 L96 96 L62 96 Z", cor: "creme" },
      { d: "M43 26 L77 26 L77 60 L43 60 Z", cor: "corpo" },
    ],
    tracos: ["M24 62 L58 62 L58 96 L24 96 Z", "M62 62 L96 62 L96 96 L62 96 Z", "M43 26 L77 26 L77 60 L43 60 Z", "M34 72 l1 1 M48 86 l1 1 M74 74 l1 1 M86 88 l1 1 M55 38 l1 1 M66 48 l1 1"],
    cai: "po",
    tinta: "branco",
  },
  // pacote de farinha
  farinha: {
    forma: [{ d: "M30 30 L90 30 L94 104 L26 104 Z", cor: "corpo" }, { d: "M40 56 L80 56 L80 82 L40 82 Z", cor: "pistache" }],
    tracos: ["M30 30 L90 30 L94 104 L26 104 Z", "M30 30 L36 20 L84 20 L90 30", "M40 56 L80 56 L80 82 L40 82 Z"],
    cai: "po",
    tinta: "branco",
  },
  // saleiro / pitada
  sal: {
    forma: [{ d: "M38 50 L82 50 L86 102 L34 102 Z", cor: "corpo" }, { d: "M38 50 Q38 22 60 22 Q82 22 82 50 Z", cor: "pistache" }],
    tracos: ["M38 50 Q38 22 60 22 Q82 22 82 50 Z", "M38 50 L34 102 L86 102 L82 50", "M54 34 l1 0 M66 34 l1 0 M60 42 l1 0"],
    cai: "po",
    tinta: "branco",
  },
  morango: {
    forma: [
      { d: "M60 104 C36 92 22 64 30 48 C38 34 82 34 90 48 C98 64 84 92 60 104 Z", cor: "caramelo" },
      { d: "M40 40 L50 26 L60 36 L70 26 L80 40 Q60 48 40 40 Z", cor: "pistache" },
    ],
    tracos: ["M60 104 C36 92 22 64 30 48 C38 34 82 34 90 48 C98 64 84 92 60 104 Z", "M40 40 L50 26 L60 36 L70 26 L80 40", "M60 36 L60 18", "M48 62 l1 1 M70 60 l1 1 M58 76 l1 1 M46 82 l1 1 M74 80 l1 1"],
    cai: "pedaco",
    tinta: "morango",
  },
  limao: {
    forma: [{ d: elipse(56, 62, 36, 28), cor: "pistache" }],
    tracos: [elipse(56, 62, 36, 28), "M92 62 L102 58", "M20 62 L12 66", "M40 52 Q48 44 58 44"],
    cai: "despeja",
    tinta: "limao",
  },
  gelo: {
    forma: [{ d: "M28 44 L64 30 L96 44 L96 84 L60 100 L28 86 Z", cor: "creme" }],
    tracos: ["M28 44 L64 30 L96 44 L60 58 Z", "M28 44 L28 86 L60 100 L96 84 L96 44", "M60 58 L60 100", "M40 68 Q44 62 50 62"],
    cai: "pedaco",
    tinta: "branco",
  },
  // tigela de lado
  tigela: {
    forma: [{ d: "M16 50 L104 50 Q102 92 60 98 Q18 92 16 50 Z", cor: "corpo" }],
    tracos: ["M16 50 L104 50 Q102 92 60 98 Q18 92 16 50 Z", "M42 98 L42 106 L78 106 L78 98", circulo(60, 50, 0.01)],
    cai: "despeja",
    tinta: "creme",
  },
};

export const corDoAcento = (a: Acento | "corpo") =>
  a === "corpo" ? "#E7D8C1" : a === "pistache" ? cor.pistacheClaro : a === "caramelo" ? cor.carameloClaro : a === "cacau" ? "#8C6A5B" : "#FBF6EC";

// Um ícone que se desenha: no esboço (antes do `em`) ele aparece a lápis, tracejado;
// no `em` o traço de tinta passa por cima e as cores acendem.
export const IconeDesenhado: React.FC<{
  icone: Icone;
  t: number;
  em: number;
  tamanho: number;
  // 0 = cheio; 1 = apagado (já foi usado)
  usado?: number;
}> = ({ icone, t, em, tamanho, usado = 0 }) => {
  const def = ICONES[icone] ?? ICONES.tigela;
  const n = def.tracos.length;
  const passo = 0.36 / Math.max(n, 1);
  const pCor = prog(t, em + 0.25, 0.3);
  return (
    <svg viewBox="0 0 120 120" width={tamanho} height={tamanho} style={{ overflow: "visible", display: "block", opacity: 1 - 0.45 * usado }}>
      {/* esboço a lápis */}
      <g opacity={1 - prog(t, em + 0.15, 0.3)}>
        {def.tracos.map((d, i) => (
          <path key={`l${i}`} d={d} fill="none" stroke={cor.lapis} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 7" />
        ))}
      </g>
      {def.forma.map((f, i) => (
        <path key={`f${i}`} d={f.d} fill={corDoAcento(f.cor)} opacity={pCor} />
      ))}
      {def.tracos.map((d, i) => (
        <Traco key={`t${i}`} d={d} p={prog(t, em + i * passo, 0.3)} cor={cor.cacau} largura={4.6} />
      ))}
    </svg>
  );
};
