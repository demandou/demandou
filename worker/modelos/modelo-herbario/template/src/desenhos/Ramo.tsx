// O raminho prensado das pranchas: um caule a pena com folhas ovadas (as mesmas do vaso), esboço a
// lápis antes, tinta que se desenha e aquarela fora do registro. Serve para os blocos universais:
// o espécime do frontispício, as folhas numeradas da lista, o espécime medido do número, os dois
// espécimes da comparação, o caule do gráfico de tendência e o espécime da definição.
// Coordenadas da prancha (px no quadro 1080×1920).
import { limitar, misturarCor, Traco } from "../anim";
import { cor, traco } from "../tema";
import { folha, nervuras } from "./Vaso";

export type FolhaDoRamo = {
  x: number;
  y: number;
  // ângulo da folha (graus; 0 = aponta para a direita)
  ang: number;
  // comprimento e meia-largura da folha
  c: number;
  l: number;
  // tinta da folha (0 = só o esboço a lápis; 1 = desenhada e pintada)
  p: number;
  // 0 = verde; 1 = pálida (amarelada)
  palido?: number;
  // cor da aguada (padrão: a folha)
  aguada?: string;
};

// Uma folha: esboço, aguada, contorno a tinta e nervuras
export const Folha: React.FC<FolhaDoRamo & { lapis?: number }> = ({ x, y, ang, c, l, p, palido = 0, aguada, lapis = 1 }) => {
  const corFolha = aguada ?? misturarCor(cor.folha, cor.folhaPalida, palido);
  const corNervura = misturarCor(cor.folhaTinta, "#8C8A55", palido * 0.8);
  const d = folha(c, l);
  const pinta = limitar(p * 1.6 - 0.5);
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      {lapis > 0.01 && p < 0.999 ? <path d={d} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis * (1 - p)} /> : null}
      {pinta > 0.01 ? (
        <g opacity={pinta} filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }}>
          <path d={d} transform="translate(3 4)" fill={corFolha} opacity={0.82} />
        </g>
      ) : null}
      <Traco d={d} p={limitar(p * 1.25)} cor={cor.tinta} largura={traco.medio} />
      {nervuras(c, l).map((n, k) => (
        <Traco key={k} d={n} p={limitar(p * 1.5 - 0.5)} cor={corNervura} largura={k === 0 ? 2.4 : 1.4} />
      ))}
    </g>
  );
};

// Um caule com folhas: o esboço a lápis do caule inteiro, a tinta que corre por ele (`pCaule`) e as folhas
export const Ramo: React.FC<{
  caule: string;
  pCaule: number;
  folhas: FolhaDoRamo[];
  lapis?: number;
  corCaule?: string;
  largura?: number;
}> = ({ caule, pCaule, folhas, lapis = 1, corCaule = cor.folhaTinta, largura = traco.forte }) => (
  <g>
    {lapis > 0.01 && pCaule < 0.999 ? <path d={caule} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis} strokeLinecap="round" /> : null}
    <Traco d={caule} p={pCaule} cor={corCaule} largura={largura} />
    {folhas.map((f, i) => (
      <Folha key={i} {...f} lapis={lapis} />
    ))}
  </g>
);

// ——— geometria ———

type Ponto = { x: number; y: number };

// Ponto e direção numa curva de Bézier cúbica
export const naCurva = (p0: Ponto, p1: Ponto, p2: Ponto, p3: Ponto, s: number) => {
  const u = 1 - s;
  const x = u * u * u * p0.x + 3 * u * u * s * p1.x + 3 * u * s * s * p2.x + s * s * s * p3.x;
  const y = u * u * u * p0.y + 3 * u * u * s * p1.y + 3 * u * s * s * p2.y + s * s * s * p3.y;
  const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * s * (p2.x - p1.x) + 3 * s * s * (p3.x - p2.x);
  const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * s * (p2.y - p1.y) + 3 * s * s * (p3.y - p2.y);
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI };
};

// Raminho prensado em pé: base em (x, y), ponta `altura` px acima, curvado de leve para o lado `curva`.
// `n` folhas alternadas (esquerda/direita), menores perto da ponta, mais uma folha de ponta.
// `progresso(i)` dá a tinta de cada folha (0–1); `tamanho` escala as folhas.
export const ramoPrensado = (
  x: number,
  y: number,
  altura: number,
  n: number,
  progresso: (i: number) => number,
  { curva = 40, tamanho = 1, palido = 0, estreita = false, queda = 0 }: { curva?: number; tamanho?: number; palido?: number; estreita?: boolean; queda?: number } = {},
) => {
  const p0 = { x, y };
  const p1 = { x: x + curva * 0.2, y: y - altura * 0.35 };
  const p2 = { x: x + curva, y: y - altura * 0.7 };
  const p3 = { x: x + curva * 0.6, y: y - altura };
  const caule = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${p3.x} ${p3.y}`;
  const folhas: FolhaDoRamo[] = [];
  for (let i = 0; i < n; i++) {
    const s = 0.22 + (0.7 * i) / Math.max(1, n);
    const q = naCurva(p0, p1, p2, p3, s);
    const esquerda = i % 2 === 0;
    const escala = tamanho * (1 - 0.35 * (i / Math.max(1, n)));
    const c = (estreita ? 150 : 120) * escala;
    const l = (estreita ? 30 : 50) * escala;
    // a folha sai do caule inclinada para cima; caída quando murcha
    const ang = esquerda ? q.ang - 70 - queda * 60 : q.ang + 70 + queda * 60;
    folhas.push({ x: q.x, y: q.y, ang, c, l, p: progresso(i), palido });
  }
  const ponta = naCurva(p0, p1, p2, p3, 1);
  folhas.push({ x: ponta.x, y: ponta.y, ang: ponta.ang + queda * 50, c: (estreita ? 120 : 96) * tamanho, l: (estreita ? 24 : 40) * tamanho, p: progresso(n), palido });
  return { caule, folhas };
};

// Fita de linho que prende o espécime no papel
export const Fita: React.FC<{ x: number; y: number; ang: number; p: number; w?: number }> = ({ x, y, ang, p, w = 120 }) =>
  p > 0.01 ? (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${0.6 + 0.4 * p})`} opacity={p}>
      <rect x={-w / 2} y={-16} width={w} height={32} fill="#DDD3B2" fillOpacity={0.94} stroke="rgba(31,38,32,0.4)" strokeWidth={1.2} />
      <line x1={-w / 2 + 6} y1={-8} x2={w / 2 - 6} y2={-8} stroke="rgba(31,38,32,0.12)" strokeWidth={1} />
    </g>
  ) : null;
