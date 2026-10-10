// Peças que entram nas figuras: regador, janela com a régua de luz, dedo, plaquinha de canteiro e o sol.
// Mesmo traço de pena e as mesmas aguadas do vaso.
import { limitar, misturarCor, Traco } from "../anim";
import { cor, traco } from "../tema";

const Aguada: React.FC<{ d: string; fill: string; opacidade?: number; p: number; dx?: number; dy?: number }> = ({ d, fill, opacidade = 0.7, p, dx = 3, dy = 3 }) =>
  p > 0.01 ? (
    <g opacity={p} filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }}>
      <path d={d} fill={fill} opacity={opacidade} transform={`translate(${dx} ${dy})`} />
    </g>
  ) : null;

// ---------- regador (de lado; origem no centro do corpo) ----------
const CORPO = "M -92 -64 L 88 -64 C 96 -64 100 -58 100 -50 L 100 64 C 100 72 94 78 86 78 L -86 78 C -94 78 -100 72 -100 64 L -100 -50 C -100 -58 -96 -64 -92 -64 Z";
const BICO = "M 96 30 L 214 -64 L 228 -50 L 100 56";
const CRIVO = "M 208 -76 L 238 -102 L 256 -78 L 232 -42 Z";
const ALCA = "M -76 -64 C -76 -150 60 -150 60 -64";
const FAIXAS = ["M -100 -20 L 100 -20", "M -100 34 L 100 34"];

export const Regador: React.FC<{ x: number; y: number; entrada: number; inclina: number; t: number; despeja: number }> = ({
  x,
  y,
  entrada,
  inclina,
  t,
  despeja,
}) => {
  if (entrada <= 0.01) return null;
  const ang = 34 * inclina;
  const dx = (1 - entrada) * -260;
  // ponta do crivo depois da rotação (para a água sair dali)
  const r = (ang * Math.PI) / 180;
  const px = 240 * Math.cos(r) - -84 * Math.sin(r);
  const py = 240 * Math.sin(r) + -84 * Math.cos(r);
  return (
    <g transform={`translate(${x + dx} ${y})`} opacity={limitar(entrada * 1.6)}>
      {/* água saindo do crivo */}
      {despeja > 0.01 ? (
        <g>
          {[-14, 0, 14].map((o, i) => {
            const queda = 330;
            const d = `M ${px + o * 0.6} ${py + 8} C ${px + o + 14} ${py + queda * 0.4} ${px + o * 1.4 + 18} ${py + queda * 0.75} ${px + o * 1.6 + 16} ${py + queda}`;
            return (
              <Traco
                key={i}
                d={d}
                p={limitar(despeja * 1.4)}
                cor={cor.aguaTinta}
                largura={4.6}
                tracejado={`${22} ${12}`}
                strokeDashoffset={-t * 140 - i * 11}
                opacity={0.95}
              />
            );
          })}
        </g>
      ) : null}
      <g transform={`rotate(${ang})`}>
        <Aguada d={CORPO} fill={cor.musgoClaro} opacidade={0.55} p={limitar(entrada * 1.2)} />
        <Traco d={ALCA} p={entrada} cor={cor.tinta} largura={traco.forte} />
        <Traco d={CORPO} p={entrada} cor={cor.tinta} largura={traco.forte} />
        <Traco d={BICO} p={entrada} cor={cor.tinta} largura={traco.medio} />
        <Traco d={CRIVO} p={entrada} cor={cor.tinta} largura={traco.medio} />
        {FAIXAS.map((f, i) => (
          <Traco key={i} d={f} p={entrada} cor={cor.tinta} largura={traco.fino} opacity={0.6} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={236 + (i % 2) * 6 - 4} cy={-74 + i * 6} r={1.8} fill={cor.tinta} opacity={entrada} />
        ))}
      </g>
    </g>
  );
};

// ---------- janela com luz e régua de distância (coordenadas da prancha) ----------
export const JANELA = { x: 70, y: 620, w: 232, h: 570, piso: 1460 };
const j = JANELA;
const arco = `M ${j.x} ${j.y + j.h} L ${j.x} ${j.y + 116} A 116 116 0 0 1 ${j.x + j.w} ${j.y + 116} L ${j.x + j.w} ${j.y + j.h} Z`;
const arcoInterno = `M ${j.x + 18} ${j.y + j.h - 14} L ${j.x + 18} ${j.y + 116} A 98 98 0 0 1 ${j.x + j.w - 18} ${j.y + 116} L ${j.x + j.w - 18} ${j.y + j.h - 14} Z`;

export const Janela: React.FC<{ tinta: number; aguada: number; luz: number; alcance: number; lapis: number }> = ({ tinta, aguada, luz, alcance, lapis }) => {
  const cx = j.x + j.w / 2;
  // feixe de luz: sai da janela e desce até o piso; `alcance` encolhe o feixe (0–1)
  const fimX = 380 + 420 * alcance;
  const feixe = `M ${j.x + j.w} ${j.y + 60} L ${fimX + 140} ${j.y + 520} L ${fimX} ${j.piso} L ${j.x + j.w + 10} ${j.piso} L ${j.x + j.w} ${j.y + j.h} Z`;
  return (
    <g>
      {lapis > 0.01 ? (
        <g opacity={lapis * (1 - tinta * 0.85)}>
          <path d={arco} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} />
          <path d={`M 40 ${j.piso} L 1040 ${j.piso}`} stroke={cor.grafite} strokeWidth={traco.fino} />
        </g>
      ) : null}
      {/* céu e sol vistos pela janela */}
      <Aguada d={arcoInterno} fill="#C9DCE4" opacidade={0.8} p={aguada} dx={2} dy={2} />
      <g opacity={aguada}>
        <circle cx={cx + 30} cy={j.y + 150} r={40} fill={cor.sol} opacity={0.85} filter="url(#aquarela)" />
      </g>
      {/* feixe de luz */}
      <defs>
        <linearGradient id="feixe" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor={cor.sol} stopOpacity={0.62} />
          <stop offset="1" stopColor={cor.sol} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={feixe} fill="url(#feixe)" opacity={luz} style={{ mixBlendMode: "multiply" }} />
      {/* raios a traço dentro do feixe */}
      {[0, 1, 2, 3].map((i) => (
        <Traco
          key={i}
          d={`M ${j.x + j.w + 6} ${j.y + 140 + i * 110} L ${j.x + j.w + 6 + (fimX - 300) * (0.5 + i * 0.1)} ${j.y + 140 + i * 110 + 260 - i * 30}`}
          p={limitar(luz * 1.4 - i * 0.12)}
          cor={misturarCor(cor.sol, cor.tinta, 0.35)}
          largura={traco.fino}
          tracejado="10 14"
          opacity={0.7 * luz}
        />
      ))}
      {/* caixilho */}
      <Traco d={arco} p={tinta} cor={cor.tinta} largura={traco.forte} />
      <Traco d={arcoInterno} p={tinta} cor={cor.tinta} largura={traco.fino} />
      <Traco d={`M ${cx} ${j.y + 22} L ${cx} ${j.y + j.h - 14}`} p={limitar(tinta * 1.2 - 0.2)} cor={cor.tinta} largura={traco.medio} />
      <Traco d={`M ${j.x + 18} ${j.y + 330} L ${j.x + j.w - 18} ${j.y + 330}`} p={limitar(tinta * 1.2 - 0.3)} cor={cor.tinta} largura={traco.medio} />
      {/* peitoril */}
      <Traco d={`M ${j.x - 24} ${j.y + j.h} L ${j.x + j.w + 24} ${j.y + j.h} L ${j.x + j.w + 24} ${j.y + j.h + 24} L ${j.x - 24} ${j.y + j.h + 24} Z`} p={tinta} cor={cor.tinta} largura={traco.medio} />
      {/* piso */}
      <Traco d={`M 40 ${j.piso} L 1040 ${j.piso}`} p={tinta} cor={cor.tinta} largura={traco.medio} />
      {Array.from({ length: 30 }, (_, i) => (
        <Traco key={i} d={`M ${52 + i * 34} ${j.piso + 4} L ${36 + i * 34} ${j.piso + 22}`} p={limitar(tinta * 1.5 - 0.5)} cor={cor.tinta} largura={traco.cabelo} opacity={0.55} />
      ))}
    </g>
  );
};

// Régua (escala de prancha) no piso, de `de` até `ate` (x), com segmentos alternados
export const Regua: React.FC<{ de: number; ate: number; y: number; p: number }> = ({ de, ate, y, p }) => {
  if (p <= 0.01) return null;
  const passo = 60;
  const n = Math.floor((ate - de) / passo);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const q = limitar(p * n - i);
        if (q <= 0) return null;
        return (
          <g key={i} opacity={q}>
            <rect x={de + i * passo} y={y} width={passo} height={16} fill={i % 2 === 0 ? cor.tinta : cor.etiqueta} stroke={cor.tinta} strokeWidth={2} />
            <line x1={de + i * passo} y1={y - 10} x2={de + i * passo} y2={y} stroke={cor.tinta} strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
};

// Cota (distância) com setas nas pontas, desenhada da esquerda para a direita
export const Cota: React.FC<{ de: number; ate: number; y: number; p: number; c?: string }> = ({ de, ate, y, p, c = cor.tinta }) => {
  if (p <= 0.01) return null;
  const x2 = de + (ate - de) * p;
  return (
    <g>
      <line x1={de} y1={y - 22} x2={de} y2={y + 22} stroke={c} strokeWidth={2.4} />
      <line x1={de} y1={y} x2={x2} y2={y} stroke={c} strokeWidth={2.6} />
      <path d={`M ${de + 18} ${y - 10} L ${de} ${y} L ${de + 18} ${y + 10}`} fill="none" stroke={c} strokeWidth={2.6} strokeLinejoin="round" />
      {p > 0.98 ? (
        <>
          <path d={`M ${ate - 18} ${y - 10} L ${ate} ${y} L ${ate - 18} ${y + 10}`} fill="none" stroke={c} strokeWidth={2.6} strokeLinejoin="round" />
          <line x1={ate} y1={y - 22} x2={ate} y2={y + 22} stroke={c} strokeWidth={2.4} />
        </>
      ) : null}
    </g>
  );
};

// ---------- dedo (aponta para baixo; origem na ponta) ----------
const DEDO = "M -54 -600 L -52 -80 C -52 -24 -28 6 2 6 C 30 6 52 -22 52 -78 L 56 -600";
const UNHA = "M -30 -40 C -30 -16 32 -16 32 -40 L 32 -112 C 20 -122 -18 -122 -30 -112 Z";
const DOBRAS = [
  "M -40 -232 C -20 -224 18 -224 40 -234",
  "M -36 -246 C -14 -238 16 -238 36 -248",
  "M -42 -442 C -20 -434 20 -434 44 -444",
  "M -38 -458 C -16 -450 18 -450 40 -460",
];
export const Dedo: React.FC<{ x: number; y: number; p: number; ang?: number }> = ({ x, y, p, ang = 6 }) => {
  if (p <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`} opacity={limitar(p * 3)}>
      <Aguada d={`${DEDO} Z`} fill={cor.pele} opacidade={0.85} p={1} dx={4} dy={2} />
      <path d="M 22 -600 L 24 -90 C 24 -50 14 -20 2 -8" fill="none" stroke={misturarCor(cor.pele, cor.vasoCorte, 0.45)} strokeWidth={10} opacity={0.35} strokeLinecap="round" />
      <path d={UNHA} fill={cor.etiqueta} opacity={0.75} />
      <Traco d={DEDO} p={1} cor={cor.tinta} largura={traco.forte} />
      <Traco d={UNHA} p={1} cor={cor.tinta} largura={traco.medio} />
      {DOBRAS.map((d, i) => (
        <Traco key={i} d={d} p={1} cor={cor.tinta} largura={traco.fino} opacity={0.75} />
      ))}
    </g>
  );
};

// ---------- plaquinha de canteiro espetada na terra (origem na ponta da estaca) ----------
export const Plaquinha: React.FC<{ x: number; y: number; p: number; texto: string; familia: string }> = ({ x, y, p, texto, familia }) => {
  if (p <= 0.01) return null;
  const desce = (1 - p) * -240;
  const w = Math.max(200, texto.length * 30 + 70);
  return (
    <g transform={`translate(${x} ${y + desce}) rotate(-4)`} opacity={limitar(p * 2.5)}>
      <path d={`M -14 -150 L 14 -150 L 14 -18 L 0 6 L -14 -18 Z`} fill={misturarCor(cor.terraSeca, cor.etiqueta, 0.4)} stroke={cor.tinta} strokeWidth={traco.medio} strokeLinejoin="round" />
      <rect x={-w / 2} y={-262} width={w} height={116} rx={10} fill={misturarCor(cor.terraSeca, cor.etiqueta, 0.55)} stroke={cor.tinta} strokeWidth={traco.medio} />
      <rect x={-w / 2 + 10} y={-252} width={w - 20} height={96} rx={6} fill="none" stroke={cor.tinta} strokeWidth={1.4} opacity={0.5} />
      <text x={0} y={-186} textAnchor="middle" fontFamily={familia} style={{ fontFeatureSettings: '"lnum" 1' }} fontWeight={700} fontSize={60} fill={cor.tinta}>
        {texto}
      </text>
    </g>
  );
};

// ---------- sol que cruza um arco (um dia passando) ----------
export const SolNoArco: React.FC<{ de: number; ate: number; y: number; altura: number; p: number; aparece: number }> = ({ de, ate, y, altura, p, aparece }) => {
  if (aparece <= 0.01) return null;
  const cx = (de + ate) / 2;
  const d = `M ${de} ${y} Q ${cx} ${y - altura * 2} ${ate} ${y}`;
  // ponto na curva quadrática
  const q = limitar(p);
  const sx = (1 - q) * (1 - q) * de + 2 * (1 - q) * q * cx + q * q * ate;
  const sy = (1 - q) * (1 - q) * y + 2 * (1 - q) * q * (y - altura * 2) + q * q * y;
  return (
    <g opacity={aparece}>
      <Traco d={d} p={aparece} cor={misturarCor(cor.sol, cor.tinta, 0.5)} largura={3.2} tracejado="8 12" />
      <g transform={`translate(${sx} ${sy})`}>
        <circle r={40} fill={cor.sol} opacity={0.9} filter="url(#aquarela)" />
        <circle r={40} fill="none" stroke={cor.tinta} strokeWidth={traco.medio} />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2 + q * 2;
          return (
            <line key={i} x1={Math.cos(a) * 50} y1={Math.sin(a) * 50} x2={Math.cos(a) * 68} y2={Math.sin(a) * 68} stroke={cor.tinta} strokeWidth={2.6} strokeLinecap="round" />
          );
        })}
      </g>
    </g>
  );
};

// ---------- escala de luz (janela): sóis que enfraquecem com a distância, e a marca da planta ----------
// Os sóis ficam numa fileira no alto da figura, da janela para a direita: o primeiro forte, o último
// quase apagado. Um anel verde-musgo fica sempre na altura do vaso: quando ele se afasta, corre para os sóis fracos.
export const EscalaDeLuz: React.FC<{ y: number; p: number; marca: number; marcaVisivel: number; familia: string }> = ({ y, p, marca, marcaVisivel, familia }) => {
  if (p <= 0.01) return null;
  const sois = [450, 575, 700, 825, 950];
  return (
    <g>
      <text x={328} y={y + 15} fontFamily={familia} fontStyle="italic" fontWeight={600} fontSize={48} fill={cor.tinta} opacity={limitar(p * 2)}>
        luz
      </text>
      <Traco d={`M 410 ${y} L 970 ${y}`} p={p} cor={cor.tinta} largura={traco.cabelo} tracejado="3 10" opacity={0.6} />
      {sois.map((x, i) => {
        const q = limitar(p * 1.6 - i * 0.14);
        if (q <= 0) return null;
        const r = 28 - i * 4.6;
        const forca = 1 - i * 0.2;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${0.5 + 0.5 * q})`} opacity={q}>
            <circle r={r} fill={cor.sol} opacity={0.2 + 0.75 * forca} />
            <circle r={r} fill="none" stroke={cor.tinta} strokeWidth={2.4} opacity={0.35 + 0.65 * forca} />
            {i < 3
              ? Array.from({ length: 8 }, (_, k) => {
                  const a = (k / 8) * Math.PI * 2;
                  const l = 15 - i * 4.5;
                  return (
                    <line
                      key={k}
                      x1={Math.cos(a) * (r + 5)}
                      y1={Math.sin(a) * (r + 5)}
                      x2={Math.cos(a) * (r + 5 + l)}
                      y2={Math.sin(a) * (r + 5 + l)}
                      stroke={cor.tinta}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      opacity={forca}
                    />
                  );
                })
              : null}
          </g>
        );
      })}
      {marcaVisivel > 0.01 ? (
        <circle cx={Math.min(950, Math.max(450, marca))} cy={y} r={42} fill="none" stroke={cor.musgo} strokeWidth={3.8} opacity={marcaVisivel} />
      ) : null}
    </g>
  );
};
