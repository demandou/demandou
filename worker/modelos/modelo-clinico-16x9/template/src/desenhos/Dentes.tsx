// Dentes vistos de frente (quatro incisivos de baixo) com a gengiva e as papilas entre eles.
// Coordenadas em unidades do desenho (caixa 900 × 600).
import { limitar, misturarCor, prog, Traco } from "../anim";
import type { Acao } from "../plano";
import { cor } from "../tema";

const CENTROS = [150, 350, 550, 750];

const dente = (cx: number) =>
  `M ${cx - 97} 128 C ${cx - 98} 98 ${cx - 83} 82 ${cx - 56} 80 L ${cx + 56} 80 C ${cx + 83} 82 ${cx + 98} 98 ${cx + 97} 128 ` +
  `C ${cx + 95} 260 ${cx + 84} 380 ${cx + 70} 468 L ${cx - 70} 468 C ${cx - 84} 380 ${cx - 95} 260 ${cx - 97} 128 Z`;

// brilho do esmalte: uma linha curta perto da borda, como em ilustração de consultório
const reflexo = (cx: number) => `M ${cx - 58} 118 C ${cx - 62} 170 ${cx - 60} 230 ${cx - 54} 280`;

// margem da gengiva: desce em volta de cada dente e sobe nas papilas
const MARGEM = (() => {
  let d = "M 0 392 L 50 384";
  for (const cx of CENTROS) {
    d += ` C ${cx - 80} 384 ${cx - 62} 452 ${cx} 452 C ${cx + 62} 452 ${cx + 80} 384 ${cx + 100} 384`;
  }
  return `${d} L 900 392`;
})();
const GENGIVA = `${MARGEM} L 900 600 L 0 600 Z`;

// espaço entre dois dentes (acima da papila): onde a escova não chega
const lacuna = (x: number) => `M ${x - 3} 150 L ${x + 3} 150 L ${x + 21} 382 Q ${x} 372 ${x - 21} 382 Z`;
const LACUNAS = [250, 450, 650];

export const ALVOS_DENTES: Record<string, { x: number; y: number; dx: number; dy: number }> = {
  entre: { x: 450, y: 300, dx: -140, dy: 200 },
  gengiva: { x: 250, y: 500, dx: -90, dy: 60 },
  coroa: { x: 150, y: 200, dx: -60, dy: -90 },
};

export const CAIXA_DENTES = { x: 20, y: 40, w: 860, h: 560 };

const primeiro = (acoes: { em: number; acao: Acao }[], nome: Acao) => acoes.filter((a) => a.acao === nome).map((a) => a.em)[0];

export const Dentes: React.FC<{
  t: number;
  de: number;
  acoes: { em: number; acao: Acao; alvo?: string }[];
  id: string;
}> = ({ t, de, acoes, id }) => {
  const emFio = primeiro(acoes, "fio");
  const emEsquecido = primeiro(acoes, "esquecido");
  const emVarre = primeiro(acoes, "varre");
  const emLacunas = primeiro(acoes, "lacunas");

  const acende = emLacunas !== undefined ? prog(t, emLacunas, 0.5) : 0;

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bv`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-base`} maskUnits="userSpaceOnUse" x="-20" y="0" width="940" height="620">
          <rect x="-20" y="0" width="940" height="620" fill={`url(#${id}-bv)`} />
        </mask>
        <pattern id={`${id}-hach`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" stroke={cor.vermelho} strokeWidth="3" opacity="0.55" />
        </pattern>
      </defs>

      {/* dentes: contorno que se desenha, esmalte que preenche (a gengiva entra antes e cobre os colos) */}
      <g>
      {CENTROS.map((cx, i) => {
        const p = prog(t, de + 0.12 + i * 0.1, 0.9);
        return (
          <g key={cx}>
            <path d={dente(cx)} fill={cor.branco} opacity={prog(t, de + 0.3 + i * 0.1, 0.5)} />
            <Traco d={dente(cx)} p={p} cor={cor.azul} largura={4.5} />
            <Traco d={reflexo(cx)} p={limitar((p - 0.5) * 2)} cor={cor.azulClaro} largura={7} />
          </g>
        );
      })}
      </g>

      {/* espaços entre os dentes: acendem em vermelho, com hachura e placa */}
      {LACUNAS.map((x, i) => {
        const a = emLacunas !== undefined ? prog(t, emLacunas + i * 0.14, 0.45) : 0;
        if (a <= 0) return null;
        return (
          <g key={x} opacity={a}>
            <path d={lacuna(x)} fill={cor.vermelhoVeu} />
            <path d={lacuna(x)} fill={`url(#${id}-hach)`} />
            {[
              [x - 8, 352],
              [x + 9, 338],
              [x - 1, 318],
            ].map(([px, py], k) => (
              <circle key={k} cx={px} cy={py} r={5 * limitar(a * 1.5 - k * 0.15)} fill={cor.vermelho} />
            ))}
          </g>
        );
      })}

      {/* gengiva na frente dos colos */}
      <path d={GENGIVA} fill={misturarCor(cor.tecido, "#F1E3E2", acende * 0.5)} opacity={prog(t, de, 0.35)} mask={`url(#${id}-base)`} />
      <Traco d={MARGEM} p={prog(t, de + 0.1, 1.0)} cor={cor.cinzaLinha} largura={3.5} />

      {/* fio dental esquecido: aparece tracejado e se desfaz */}
      {emEsquecido !== undefined ? <FioEsquecido t={t} em={emEsquecido} /> : null}
      {/* fio dental de verdade: desce entre os dentes e serra de leve */}
      {emFio !== undefined ? <FioDescendo t={t} em={emFio} x={450} /> : null}
      {/* escova passando pela frente: limpa a face, não entra nos espaços */}
      {emVarre !== undefined ? <EscovaFrente t={t} em={emVarre} /> : null}
    </g>
  );
};

const FioEsquecido: React.FC<{ t: number; em: number }> = ({ t, em }) => {
  const entra = prog(t, em, 0.45);
  const some = prog(t, em + 0.9, 0.7);
  if (entra <= 0 || some >= 1) return null;
  const sobe = -70 * some;
  return (
    <g opacity={entra * (1 - some)} transform={`translate(0 ${sobe})`}>
      <path d="M 450 40 L 450 372" fill="none" stroke={cor.cinza} strokeWidth={6} strokeDasharray="16 13" strokeLinecap="round" />
      <path d="M 360 10 Q 450 60 540 10" fill="none" stroke={cor.cinza} strokeWidth={6} strokeDasharray="16 13" strokeLinecap="round" />
    </g>
  );
};

export const FioDescendo: React.FC<{ t: number; em: number; x: number; fundo?: number; topo?: number }> = ({
  t,
  em,
  x,
  fundo = 372,
  topo = -20,
}) => {
  const desce = prog(t, em, 0.8);
  if (desce <= 0) return null;
  const serra = 5 * Math.sin((t - em) * Math.PI * 2 * 1.8) * desce;
  const ponta = topo + (fundo - topo) * desce;
  return (
    <g transform={`translate(${serra} 0)`}>
      <path d={`M ${x - 90} ${topo - 10} Q ${x - 20} ${topo + 30} ${x} ${ponta}`} fill="none" stroke={cor.azul} strokeWidth={4} strokeLinecap="round" />
      <path d={`M ${x + 90} ${topo - 10} Q ${x + 20} ${topo + 30} ${x} ${ponta}`} fill="none" stroke={cor.azul} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
};

const EscovaFrente: React.FC<{ t: number; em: number }> = ({ t, em }) => {
  const p = prog(t, em, 1.05, (v) => v);
  if (p <= 0 || p >= 1) return null;
  const x = -260 + 1300 * (0.5 - 0.5 * Math.cos(p * Math.PI));
  const tufos = [];
  for (let c = 0; c < 7; c++) for (let l = 0; l < 3; l++) tufos.push([x + 26 + c * 32, 212 + l * 34]);
  return (
    <g opacity={Math.min(1, p * 6, (1 - p) * 6)}>
      <rect x={x + 220} y={236} width={420} height={42} rx={21} fill={cor.branco} stroke={cor.azul} strokeWidth={4.5} />
      <rect x={x} y={190} width={236} height={132} rx={40} fill="rgba(255,255,255,0.9)" stroke={cor.azul} strokeWidth={4.5} />
      {tufos.map(([tx, ty], i) => (
        <circle key={i} cx={tx} cy={ty} r={9} fill={cor.azulClaro} stroke={cor.cinza} strokeWidth={2} />
      ))}
    </g>
  );
};
