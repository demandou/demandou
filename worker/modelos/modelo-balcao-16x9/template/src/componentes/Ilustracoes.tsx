// Ilustrações chapadas (vetor) para a vitrine em modo ilustrativo: produtos e serviços sem foto.
// Paleta da fachada (tomate, mostarda, kraft, café, creme, sálvia); contorno café de 3 px.
// Use pelo campo `ilustracao` do item: pote, bolo, pao, cafe, hamburguer, pizza, sacola, camiseta,
// tesoura, haltere, pata, flor, presente, moeda, grafico, escudo, relogio, estrela.
import type { NomeIlustracao } from "../plano";
import { cor } from "../tema";

const T = cor.tinta;
const k = { stroke: T, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const desenhos: Record<NomeIlustracao, React.ReactNode> = {
  pote: (
    <>
      <rect x="27" y="22" width="46" height="10" rx="3" fill={cor.madeiraClara} {...k} />
      <path d="M28 32h44v50a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8z" fill={cor.papel} {...k} />
      <path d="M30 50h40M30 66h40" stroke={cor.madeiraEscura} strokeWidth={9} />
      <path d="M30 58h40M30 74h40" stroke={cor.toldoCreme} strokeWidth={7} />
    </>
  ),
  bolo: (
    <>
      <path d="M20 52h60v30H20z" fill={cor.toldoCreme} {...k} />
      <path d="M20 52c5 8 10 8 15 0 5 8 10 8 15 0 5 8 10 8 15 0 5 8 10 8 15 0" fill={cor.acento} {...k} />
      <path d="M14 82h72" {...k} />
      <path d="M50 30v14" stroke={cor.adesivo} strokeWidth={6} strokeLinecap="round" />
      <path d="M50 22c3 3 3 6 0 8-3-2-3-5 0-8z" fill={cor.acento} />
    </>
  ),
  pao: (
    <>
      <path d="M14 62c0-18 16-28 36-28s36 10 36 28c0 8-6 14-14 14H28c-8 0-14-6-14-14z" fill={cor.kraft} {...k} />
      <path d="M34 44l-6 12M50 40l-4 14M66 44l-4 12" stroke={cor.kraftEscuro} strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  cafe: (
    <>
      <path d="M22 40h46v26a16 16 0 0 1-16 16H38a16 16 0 0 1-16-16z" fill={cor.papel} {...k} />
      <path d="M68 46h6a8 8 0 0 1 0 16h-6" fill="none" {...k} />
      <path d="M26 46h38" stroke={cor.madeiraEscura} strokeWidth={6} />
      <path d="M36 18c-4 5 4 8 0 14M50 16c-4 5 4 8 0 14" fill="none" stroke={cor.tintaSuave} strokeWidth={3} strokeLinecap="round" />
      <path d="M16 88h62" {...k} />
    </>
  ),
  hamburguer: (
    <>
      <path d="M18 46c0-14 14-22 32-22s32 8 32 22z" fill={cor.adesivo} {...k} />
      <path d="M16 52h68" stroke={cor.salvia} strokeWidth={7} strokeLinecap="round" />
      <rect x="18" y="56" width="64" height="11" rx="5" fill={cor.madeiraEscura} {...k} />
      <path d="M18 72h64v4a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z" fill={cor.adesivo} {...k} />
    </>
  ),
  pizza: (
    <>
      <path d="M50 88L18 26c20-10 44-10 64 0z" fill={cor.adesivo} {...k} />
      <path d="M18 26c20-10 44-10 64 0l-4 8c-18-8-38-8-56 0z" fill={cor.kraft} {...k} />
      <circle cx="44" cy="46" r="6" fill={cor.acento} />
      <circle cx="58" cy="58" r="5" fill={cor.acento} />
      <circle cx="49" cy="70" r="4" fill={cor.acento} />
    </>
  ),
  sacola: (
    <>
      <path d="M22 36h56l-4 50H26z" fill={cor.kraft} {...k} />
      <path d="M38 42V30a12 12 0 0 1 24 0v12" fill="none" {...k} />
      <path d="M30 56h40" stroke={cor.acento} strokeWidth={6} />
    </>
  ),
  camiseta: (
    <path d="M36 18l-22 12 8 16 8-4v40h40V42l8 4 8-16-22-12c-2 6-7 10-14 10s-12-4-14-10z" fill={cor.acento} {...k} />
  ),
  tesoura: (
    <>
      <circle cx="30" cy="72" r="11" fill={cor.acento} {...k} />
      <circle cx="70" cy="72" r="11" fill={cor.acento} {...k} />
      <path d="M36 63L66 18M64 63L34 18" stroke={T} strokeWidth={6} strokeLinecap="round" />
      <circle cx="50" cy="40" r="3" fill={cor.papel} />
    </>
  ),
  haltere: (
    <>
      <rect x="10" y="34" width="14" height="32" rx="4" fill={cor.tinta} {...k} />
      <rect x="22" y="28" width="12" height="44" rx="4" fill={cor.acento} {...k} />
      <rect x="66" y="28" width="12" height="44" rx="4" fill={cor.acento} {...k} />
      <rect x="76" y="34" width="14" height="32" rx="4" fill={cor.tinta} {...k} />
      <rect x="34" y="45" width="32" height="10" rx="3" fill={cor.madeiraClara} {...k} />
    </>
  ),
  pata: (
    <>
      <ellipse cx="50" cy="66" rx="20" ry="16" fill={cor.madeiraEscura} {...k} />
      <ellipse cx="26" cy="46" rx="8" ry="10" fill={cor.madeiraEscura} {...k} />
      <ellipse cx="40" cy="32" rx="8" ry="10" fill={cor.madeiraEscura} {...k} />
      <ellipse cx="60" cy="32" rx="8" ry="10" fill={cor.madeiraEscura} {...k} />
      <ellipse cx="74" cy="46" rx="8" ry="10" fill={cor.madeiraEscura} {...k} />
    </>
  ),
  flor: (
    <>
      <path d="M50 54v34" stroke={cor.salviaEscura} strokeWidth={5} strokeLinecap="round" />
      <path d="M50 76c-10 0-16-6-16-12 8 0 14 4 16 12z" fill={cor.salvia} {...k} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="50" cy="26" rx="10" ry="15" fill={cor.acento} {...k} transform={`rotate(${a} 50 40)`} />
      ))}
      <circle cx="50" cy="40" r="9" fill={cor.adesivo} {...k} />
    </>
  ),
  presente: (
    <>
      <rect x="20" y="42" width="60" height="42" rx="4" fill={cor.acento} {...k} />
      <rect x="16" y="32" width="68" height="14" rx="4" fill={cor.acento} {...k} />
      <path d="M50 32v52" stroke={cor.adesivo} strokeWidth={8} />
      <path d="M50 32c-6-14-22-14-18-4 2 4 10 4 18 4zM50 32c6-14 22-14 18-4-2 4-10 4-18 4z" fill={cor.adesivo} {...k} />
    </>
  ),
  moeda: (
    <>
      <circle cx="50" cy="52" r="32" fill={cor.adesivo} {...k} />
      <circle cx="50" cy="52" r="23" fill="none" stroke={cor.adesivoEscuro} strokeWidth={3} />
      <path d="M57 42c-2-3-5-4-8-4-5 0-8 3-8 6 0 8 16 5 16 13 0 3-3 6-8 6-3 0-7-1-9-4M49 34v38" fill="none" stroke={T} strokeWidth={4} strokeLinecap="round" />
    </>
  ),
  grafico: (
    <>
      <path d="M16 84h70" {...k} />
      <rect x="22" y="58" width="14" height="26" rx="2" fill={cor.kraft} {...k} />
      <rect x="43" y="44" width="14" height="40" rx="2" fill={cor.adesivo} {...k} />
      <rect x="64" y="26" width="14" height="58" rx="2" fill={cor.acento} {...k} />
    </>
  ),
  escudo: (
    <>
      <path d="M50 14l30 10v22c0 20-14 34-30 40-16-6-30-20-30-40V24z" fill={cor.salvia} {...k} />
      <path d="M37 50l9 9 17-18" fill="none" stroke={cor.papel} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  relogio: (
    <>
      <circle cx="50" cy="52" r="32" fill={cor.papel} {...k} />
      <path d="M50 32v20l13 9" fill="none" stroke={cor.acento} strokeWidth={5} strokeLinecap="round" />
      <circle cx="50" cy="52" r="3" fill={T} />
    </>
  ),
  estrela: <path d="M50 14l10.6 21.5 23.7 3.4-17.2 16.8 4.1 23.6L50 68.2 28.8 79.3l4.1-23.6L15.7 38.9l23.7-3.4z" fill={cor.adesivo} {...k} />,
};

export const Ilustracao: React.FC<{ nome: NomeIlustracao; tamanho: number }> = ({ nome, tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
    {desenhos[nome] ?? desenhos.estrela}
  </svg>
);
