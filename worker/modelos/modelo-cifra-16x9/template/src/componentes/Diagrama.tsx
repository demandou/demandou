// Diagrama de acorde: o braço do violão visto de frente, com as 6 cordas (Mi grave à esquerda),
// os trastes, a pestana/nut, × (não toca), ○ (solta) e os dedos numerados nas casas.
// Antes do `em` ele é um esboço a lápis (grade tracejada, sem dedos); no `em` as cordas e os trastes
// se desenham, os marcadores aparecem e os dedos caem um a um.
import type { Forma } from "../acordes";
import { prog, suave } from "../anim";
import { cor, fonte } from "../tema";

// medidas em escala 1
const CORDA = 64; // espaço entre cordas
const CASA = 62; // espaço entre trastes
const RAIO_DEDO = 30;
const MARGEM = 40;
const TOPO = 46;
const BASE = 6;
// número do dedo: 46 na escala 1 (≥ 40 px na grade de acordes)
const NUMERO = 46;

// tamanho do diagrama na tela (px), para diagramar em volta dele
export const medidasDoDiagrama = (escala: number, casas = 4) => ({
  largura: (CORDA * 5 + 2 * MARGEM) * escala,
  altura: (CASA * casas + TOPO + BASE) * escala,
});

// casa inicial e número de casas mostradas
const janelaDeCasas = (forma: Forma) => {
  const tocadas = forma.casas.filter((c): c is number => c !== null && c > 0);
  const maior = Math.max(0, ...tocadas);
  const menor = tocadas.length ? Math.min(...tocadas) : 1;
  if (maior <= 4) return { base: 1, casas: 4 };
  return { base: menor, casas: Math.max(4, maior - menor + 1) };
};

// dedo repetido na mesma casa em várias cordas = pestana
const pestanas = (forma: Forma) => {
  const lista: { dedo: number; casa: number; de: number; ate: number }[] = [];
  for (let dedo = 1; dedo <= 4; dedo++) {
    const cordas = forma.casas
      .map((c, i) => ({ c, i, d: forma.dedos[i] }))
      .filter((x) => x.d === dedo && x.c !== null && x.c > 0);
    const porCasa = new Map<number, number[]>();
    for (const x of cordas) porCasa.set(x.c as number, [...(porCasa.get(x.c as number) ?? []), x.i]);
    for (const [casa, idx] of porCasa) if (idx.length >= 2) lista.push({ dedo, casa, de: Math.min(...idx), ate: Math.max(...idx) });
  }
  return lista;
};

export const Diagrama: React.FC<{
  forma: Forma;
  t: number;
  // quando se desenha (Infinity = fica no esboço)
  em: number;
  escala: number;
  // números dos dedos dentro das bolinhas (no diagrama pequeno, só as bolinhas)
  numeros?: boolean;
  // destaque: 1 = acorde em curso (dedos azuis), 0 = já tocado (dedos marfim)
  ativo?: number;
  // para os números sumirem aos poucos (quando o diagrama encolhe para um compasso)
  opacidadeNumeros?: number;
}> = ({ forma, t, em, escala, numeros = true, ativo = 1, opacidadeNumeros = 1 }) => {
  const { base, casas } = janelaDeCasas(forma);
  const margem = MARGEM;
  const topo = TOPO;
  const largura = CORDA * 5 + 2 * margem;
  const altura = CASA * casas + topo + BASE;
  const xCorda = (i: number) => margem + i * CORDA;
  const yCasa = (n: number) => topo + n * CASA;
  const barras = pestanas(forma);
  const naPestana = (i: number) => barras.some((b) => b.dedo === forma.dedos[i] && b.casa === forma.casas[i] && b.de !== i && i >= b.de && i <= b.ate);

  // tinta: cordas descem, trastes atravessam, marcadores e dedos entram por último
  const pCordas = (i: number) => prog(t, em - 0.04 + i * 0.03, 0.3);
  const pTrastes = (n: number) => prog(t, em + 0.02 + n * 0.035, 0.28);
  const pNut = prog(t, em + 0.06, 0.25);
  const pMarca = (i: number) => prog(t, em + 0.12 + i * 0.02, 0.18);
  const ordemDedos = forma.casas
    .map((c, i) => ({ c, i }))
    .filter((x) => x.c !== null && x.c > 0 && !naPestana(x.i));
  const pDedo = (k: number) => prog(t, em + 0.1 + k * 0.055, 0.2);
  const tinta = prog(t, em - 0.04, 0.35);
  const corDedo = ativo >= 0.5 ? cor.azul : cor.marfim;
  const traco = 3.8;

  return (
    <svg
      width={largura * escala}
      height={altura * escala}
      viewBox={`0 0 ${largura} ${altura}`}
      style={{ overflow: "visible", display: "block" }}
    >
      {/* esboço a lápis: some quando a tinta chega */}
      <g opacity={1 - tinta} stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" fill="none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`le${i}`} x1={xCorda(i)} y1={topo} x2={xCorda(i)} y2={yCasa(casas)} />
        ))}
        {Array.from({ length: casas + 1 }, (_, n) => (
          <line key={`lt${n}`} x1={xCorda(0)} y1={yCasa(n)} x2={xCorda(5)} y2={yCasa(n)} />
        ))}
      </g>

      {/* cordas (a 6ª, mais grave, um pouco mais grossa); as tocadas vibram um instante quando o acorde soa */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const comprimento = CASA * casas;
        const d = t - (em + 0.05 + i * 0.018);
        const amp = forma.casas[i] !== null && d > 0 && d < 0.9 ? 3.2 * Math.exp(-d / 0.22) * Math.sin(2 * Math.PI * 9 * d) : 0;
        const y0 = topo;
        const y1 = yCasa(casas);
        const caminho = `M ${xCorda(i)} ${y0} Q ${xCorda(i) + amp * 2} ${(y0 + y1) / 2} ${xCorda(i)} ${y1}`;
        return (
          <path
            key={`c${i}`}
            d={caminho}
            fill="none"
            stroke={cor.niquel}
            strokeWidth={traco + (5 - i) * 0.35}
            strokeDasharray={comprimento}
            strokeDashoffset={comprimento * (1 - pCordas(i))}
          />
        );
      })}
      {/* trastes */}
      {Array.from({ length: casas + 1 }, (_, n) => {
        const comprimento = CORDA * 5;
        return (
          <line
            key={`t${n}`}
            x1={xCorda(0)}
            y1={yCasa(n)}
            x2={xCorda(5)}
            y2={yCasa(n)}
            stroke={cor.niquel}
            strokeWidth={traco}
            strokeDasharray={comprimento}
            strokeDashoffset={comprimento * (1 - pTrastes(n))}
          />
        );
      })}
      {/* pestana do braço (nut) na 1ª posição; fora dela, o número da casa ao lado */}
      {base === 1 ? (
        <rect
          x={xCorda(0) - traco / 2}
          y={topo - 12}
          width={(CORDA * 5 + traco) * pNut}
          height={13}
          rx={3}
          fill={cor.marfim}
        />
      ) : (
        <text
          x={xCorda(0) - 16}
          y={yCasa(0.5) + 13}
          textAnchor="end"
          fontFamily={fonte}
          fontWeight={700}
          fontSize={36}
          fill={cor.marfimSuave}
          opacity={pNut}
        >
          {`${base}ª`}
        </text>
      )}

      {/* × e ○ acima do braço */}
      {forma.casas.map((c, i) => {
        if (c !== null && c > 0) return null;
        const p = pMarca(i);
        const cx = xCorda(i);
        const cy = topo - 29;
        if (c === 0)
          return (
            <circle key={`m${i}`} cx={cx} cy={cy} r={13 * (0.6 + 0.4 * p)} fill="none" stroke={cor.marfim} strokeWidth={3.6} opacity={p} />
          );
        const d = 11.5 * (0.6 + 0.4 * p);
        return (
          <g key={`m${i}`} stroke={cor.marfimSuave} strokeWidth={3.6} strokeLinecap="round" opacity={p}>
            <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} />
            <line x1={cx - d} y1={cy + d} x2={cx + d} y2={cy - d} />
          </g>
        );
      })}

      {/* pestanas (barra do dedo deitado) */}
      {barras.map((b) => {
        const p = prog(t, em + 0.1, 0.25);
        const y = yCasa(b.casa - base + 0.5);
        const x0 = xCorda(b.de) - RAIO_DEDO;
        const w = (xCorda(b.ate) - xCorda(b.de) + 2 * RAIO_DEDO) * p;
        return (
          <g key={`p${b.dedo}-${b.casa}`} opacity={Math.min(1, p * 2)}>
            <rect x={x0} y={y - RAIO_DEDO} width={w} height={RAIO_DEDO * 2} rx={RAIO_DEDO} fill={corDedo} />
            {numeros ? (
              <text x={xCorda(b.de)} y={y + NUMERO * 0.36} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={NUMERO} fill={cor.palco} opacity={opacidadeNumeros}>
                {b.dedo}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* dedos: caem na casa, um por um */}
      {ordemDedos.map((x, k) => {
        const p = pDedo(k);
        const y = yCasa((x.c as number) - base + 0.5);
        const cy = y - 26 * (1 - suave(p));
        const dedo = forma.dedos[x.i];
        return (
          <g key={`d${x.i}`} opacity={Math.min(1, p * 1.6)}>
            <circle cx={xCorda(x.i)} cy={cy} r={RAIO_DEDO * (0.7 + 0.3 * p)} fill={corDedo} />
            {numeros && dedo > 0 ? (
              <text x={xCorda(x.i)} y={cy + NUMERO * 0.36} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={NUMERO} fill={cor.palco} opacity={opacidadeNumeros}>
                {dedo}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};
