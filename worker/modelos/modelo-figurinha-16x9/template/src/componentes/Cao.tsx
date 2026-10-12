// O cachorro do álbum: um vira-lata caramelo sentado, a traço e cor chapada, recortado como
// figurinha (borda branca). Reage ao que é dito: cada reação é uma pose (orelhas, olhos, boca,
// inclinação da cabeça, rabo) e a troca entre poses leva ~0,2 s.
import { useId } from "react";
import { limitar, mistura, prog } from "../anim";
import type { Reacao } from "../plano";
import { cor } from "../tema";

type Pose = {
  // inclinação da cabeça (graus) e recuo (px, negativo = cabeça para trás)
  cabeca: number;
  recuo: number;
  // ângulo das orelhas (graus; positivo = para fora/baixo)
  orelhaE: number;
  orelhaD: number;
  // rabo: amplitude (graus) e velocidade (abanadas por segundo)
  rabo: number;
  abana: number;
  olhos: "normal" | "brilho" | "arregalado" | "fechado";
  boca: "sorriso" | "lingua" | "o" | "triste";
  sobrancelha: "normal" | "levantada" | "preocupada" | "curiosa";
  marcas: boolean;
};

const POSES: Record<Reacao, Pose> = {
  atento: { cabeca: 0, recuo: 0, orelhaE: 0, orelhaD: 0, rabo: 5, abana: 0.8, olhos: "normal", boca: "sorriso", sobrancelha: "normal", marcas: false },
  curioso: { cabeca: -11, recuo: 0, orelhaE: -6, orelhaD: 16, rabo: 8, abana: 1.2, olhos: "normal", boca: "sorriso", sobrancelha: "curiosa", marcas: false },
  querendo: { cabeca: 6, recuo: 2, orelhaE: 4, orelhaD: -4, rabo: 16, abana: 2.6, olhos: "brilho", boca: "lingua", sobrancelha: "levantada", marcas: false },
  susto: { cabeca: -3, recuo: -10, orelhaE: 38, orelhaD: 38, rabo: 3, abana: 0.5, olhos: "arregalado", boca: "o", sobrancelha: "levantada", marcas: true },
  feliz: { cabeca: 7, recuo: 2, orelhaE: 14, orelhaD: 14, rabo: 18, abana: 2.8, olhos: "fechado", boca: "lingua", sobrancelha: "normal", marcas: false },
  preocupado: { cabeca: -5, recuo: -4, orelhaE: 26, orelhaD: 26, rabo: 3, abana: 0.5, olhos: "normal", boca: "triste", sobrancelha: "preocupada", marcas: false },
};

export type ReacaoNoTempo = { em: number; r: Reacao };

// pose atual: mistura numérica entre a anterior e a atual; traços (olhos, boca) trocam no meio
const poseNoTempo = (t: number, reacoes: ReacaoNoTempo[]) => {
  const ordem = [...reacoes].sort((a, b) => a.em - b.em);
  let i = -1;
  for (let k = 0; k < ordem.length; k++) if (ordem[k].em <= t) i = k;
  const atual = POSES[ordem[Math.max(0, i)]?.r ?? "atento"];
  if (i <= 0) return atual;
  const antes = POSES[ordem[i - 1].r];
  const p = prog(t, ordem[i].em, 0.22);
  const n = (k: keyof Pose) => mistura(antes[k] as number, atual[k] as number, p);
  const discreto = p < 0.5 ? antes : atual;
  return {
    ...discreto,
    cabeca: n("cabeca"),
    recuo: n("recuo"),
    orelhaE: n("orelhaE"),
    orelhaD: n("orelhaD"),
    rabo: n("rabo"),
    abana: n("abana"),
  };
};

const T = cor.tinta;
const LW = 4.5;

const Orelha: React.FC<{ lado: 1 | -1; angulo: number }> = ({ lado, angulo }) => (
  // desenhada para o lado esquerdo e espelhada em volta de x = 200 para o direito
  <g transform={`translate(${lado === 1 ? 0 : 400} 0) scale(${lado} 1)`}>
    <g transform={`rotate(${-angulo} 146 132)`}>
      <path d="M118 158 C 104 116, 108 74, 130 50 C 152 70, 170 100, 172 128 Z" fill={cor.caramelo} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <path d="M128 144 C 120 114, 124 88, 134 70 C 148 88, 158 108, 160 128 Z" fill={cor.carameloEscuro} />
      {/* ponta dobrada */}
      <path d="M130 50 C 116 54, 104 68, 100 86 C 116 80, 128 74, 140 62 Z" fill={cor.carameloEscuro} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
    </g>
  </g>
);

const Olhos: React.FC<{ tipo: Pose["olhos"]; olhar: number }> = ({ tipo, olhar }) => {
  const dx = olhar * 5;
  return (
    <g>
      {[165, 235].map((x) => {
        if (tipo === "fechado")
          return <path key={x} d={`M${x - 15} ${184} Q${x} ${166} ${x + 15} ${184}`} fill="none" stroke={T} strokeWidth={5.5} strokeLinecap="round" />;
        if (tipo === "arregalado")
          return (
            <g key={x}>
              <circle cx={x} cy={178} r={18} fill={cor.branco} stroke={T} strokeWidth={LW} />
              <circle cx={x + dx * 0.6} cy={180} r={8} fill={T} />
              <circle cx={x + dx * 0.6 + 3} cy={176} r={2.6} fill={cor.branco} />
            </g>
          );
        const brilho = tipo === "brilho";
        return (
          <g key={x}>
            <ellipse cx={x + dx} cy={180} rx={brilho ? 15 : 13} ry={brilho ? 17 : 15} fill={T} />
            <circle cx={x + dx + 4.5} cy={174} r={brilho ? 5.5 : 4.5} fill={cor.branco} />
            {brilho ? <circle cx={x + dx - 5} cy={187} r={2.6} fill={cor.branco} /> : null}
          </g>
        );
      })}
    </g>
  );
};

const Sobrancelhas: React.FC<{ tipo: Pose["sobrancelha"] }> = ({ tipo }) => {
  const s = { fill: "none", stroke: cor.carameloEscuro, strokeWidth: 6, strokeLinecap: "round" as const };
  if (tipo === "preocupada")
    return (
      <g>
        <path d="M148 158 L178 148" {...s} />
        <path d="M222 148 L252 158" {...s} />
      </g>
    );
  if (tipo === "levantada")
    return (
      <g>
        <path d="M148 146 Q164 134 180 142" {...s} />
        <path d="M220 142 Q236 134 252 146" {...s} />
      </g>
    );
  if (tipo === "curiosa")
    return (
      <g>
        <path d="M148 146 Q164 134 180 142" {...s} />
        <path d="M222 154 Q236 150 252 156" {...s} />
      </g>
    );
  return (
    <g>
      <path d="M150 154 Q165 146 180 152" {...s} />
      <path d="M220 152 Q235 146 250 154" {...s} />
    </g>
  );
};

const Boca: React.FC<{ tipo: Pose["boca"] }> = ({ tipo }) => {
  const linha = { fill: "none", stroke: T, strokeWidth: LW, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tipo === "o")
    return (
      <g>
        <path d="M200 232 V242" {...linha} />
        <ellipse cx={200} cy={258} rx={10} ry={12} fill="#4A2134" stroke={T} strokeWidth={LW} />
      </g>
    );
  if (tipo === "triste")
    return (
      <g>
        <path d="M200 232 V246" {...linha} />
        <path d="M180 260 C 188 250, 212 250, 220 260" {...linha} />
      </g>
    );
  if (tipo === "lingua")
    return (
      <g>
        <path d="M200 232 V244" {...linha} />
        <path d="M172 244 C 180 274, 220 274, 228 244 C 216 252, 184 252, 172 244 Z" fill="#4A2134" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
        <path d="M187 256 C 186 288, 214 288, 213 256 Z" fill={cor.lingua} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
        <path d="M200 260 V276" stroke="#C25C6E" strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  return (
    <g>
      <path d="M200 232 V246" {...linha} />
      <path d="M176 244 C 186 258, 196 256, 200 246 C 204 256, 214 258, 224 244" {...linha} />
    </g>
  );
};

export const Cao: React.FC<{
  t: number;
  reacoes: ReacaoNoTempo[];
  // largura do desenho em px (a altura é 1,1 × a largura)
  largura: number;
  // para onde ele olha: -1 (esquerda) a 1 (direita)
  olhar?: number;
  // espelha o desenho (cachorro virado para o outro lado)
  espelhar?: boolean;
  // só a cabeça e o peito (cartão pequeno)
  busto?: boolean;
  style?: React.CSSProperties;
}> = ({ t, reacoes, largura, olhar = 0, espelhar = false, busto = false, style }) => {
  const id = useId().replace(/:/g, "");
  const pose = poseNoTempo(t, reacoes);
  const rabo = pose.rabo * Math.sin(t * Math.PI * 2 * pose.abana);
  const respira = Math.sin(t * Math.PI * 2 * 0.55) * 1.6;
  // marcas de susto: três traços que se desenham perto da cabeça
  const ultimaSusto = [...reacoes].filter((r) => r.r === "susto" && r.em <= t).pop();
  const pMarcas = pose.marcas && ultimaSusto ? prog(t, ultimaSusto.em, 0.25) : 0;
  const viewBox = busto ? "70 30 260 330" : "40 30 330 420";
  const proporcao = busto ? 330 / 260 : 420 / 330;
  return (
    <svg viewBox={viewBox} width={largura} height={largura * proporcao} style={{ overflow: "visible", ...style }}>
      <defs>
        {/* recorte de figurinha: borda branca em volta do desenho + sombra curta de papel colado */}
        <filter id={`recorte-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="11" result="grosso" />
          <feFlood floodColor="#FFFFFF" />
          <feComposite in2="grosso" operator="in" result="borda" />
          <feGaussianBlur in="grosso" stdDeviation="5" result="borrado" />
          <feOffset in="borrado" dy="6" result="sombraDeslocada" />
          <feFlood floodColor="#3A2A1A" floodOpacity="0.22" />
          <feComposite in2="sombraDeslocada" operator="in" result="sombra" />
          <feMerge>
            <feMergeNode in="sombra" />
            <feMergeNode in="borda" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#recorte-${id})`} transform={espelhar ? "translate(400 0) scale(-1 1)" : undefined}>
        {busto ? null : (
          <g>
            {/* rabo (atrás) */}
            <g transform={`rotate(${rabo} 286 392)`}>
              <path d="M280 396 C 316 392, 348 360, 352 312 C 360 318, 364 344, 356 366 C 346 394, 312 414, 284 414 Z" fill={cor.caramelo} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
            </g>
            {/* ancas */}
            <ellipse cx={128} cy={402} rx={58} ry={40} fill={cor.caramelo} stroke={T} strokeWidth={LW} />
            <ellipse cx={272} cy={402} rx={58} ry={40} fill={cor.caramelo} stroke={T} strokeWidth={LW} />
          </g>
        )}
        {/* peito e patas da frente */}
        <g transform={`translate(0 ${respira * 0.4})`}>
          <path d="M146 290 C 132 330, 130 380, 140 424 L260 424 C 270 380, 268 330, 254 290 Z" fill={cor.caramelo} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
          <path d="M172 296 C 166 330, 176 362, 200 378 C 224 362, 234 330, 228 296 Z" fill={cor.carameloClaro} />
          {busto ? null : (
            <g>
              <path d="M160 350 V420 M240 350 V420" stroke={T} strokeWidth={LW} strokeLinecap="round" />
              <ellipse cx={170} cy={424} rx={30} ry={15} fill={cor.carameloClaro} stroke={T} strokeWidth={LW} />
              <ellipse cx={230} cy={424} rx={30} ry={15} fill={cor.carameloClaro} stroke={T} strokeWidth={LW} />
              <path d="M162 418 V430 M178 418 V430 M222 418 V430 M238 418 V430" stroke={T} strokeWidth={3} strokeLinecap="round" />
            </g>
          )}
          {/* coleira */}
          <path d="M140 278 C 170 298, 230 298, 260 278 L264 296 C 232 318, 168 318, 136 296 Z" fill={cor.carimbo} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
          <circle cx={200} cy={318} r={13} fill="#F2C14E" stroke={T} strokeWidth={LW} />
        </g>
        {/* cabeça */}
        <g transform={`translate(0 ${pose.recuo + respira}) rotate(${pose.cabeca} 200 270)`}>
          <Orelha lado={1} angulo={pose.orelhaE} />
          <Orelha lado={-1} angulo={pose.orelhaD} />
          <path d="M200 100 C 262 100, 300 140, 298 196 C 296 250, 256 288, 200 288 C 144 288, 104 250, 102 196 C 100 140, 138 100, 200 100 Z" fill={cor.caramelo} stroke={T} strokeWidth={LW} />
          <path d="M200 196 C 240 196, 262 218, 258 242 C 254 268, 228 282, 200 282 C 172 282, 146 268, 142 242 C 138 218, 160 196, 200 196 Z" fill={cor.carameloClaro} />
          <Sobrancelhas tipo={pose.sobrancelha} />
          <Olhos tipo={pose.olhos} olhar={espelhar ? -olhar : olhar} />
          <Boca tipo={pose.boca} />
          <path d="M184 216 C 184 204, 216 204, 216 216 C 216 228, 206 234, 200 234 C 194 234, 184 228, 184 216 Z" fill={cor.focinho} stroke={T} strokeWidth={3} />
          <ellipse cx={193} cy={212} rx={5} ry={3} fill="#FFFFFF" opacity={0.5} />
        </g>
      </g>
      {/* marcas de susto (fora do recorte, como traços desenhados na página) */}
      {pMarcas > 0 ? (
        <g transform={espelhar ? "translate(400 0) scale(-1 1)" : undefined} opacity={limitar(pMarcas * 1.5)}>
          {[
            "M318 150 L346 136",
            "M322 182 L354 184",
            "M310 120 L330 98",
          ].map((d, i) => (
            <path key={i} d={d} stroke={T} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`${pMarcas} 1`} />
          ))}
        </g>
      ) : null}
    </svg>
  );
};
