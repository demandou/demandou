// Ícones a traço (64×64), traço grosso e pontas redondas: legíveis no celular, sem enfeite.
import type { Icone as NomeIcone } from "../plano";

const desenhos: Record<NomeIcone, React.ReactNode> = {
  pessoa: (
    <>
      <circle cx={32} cy={21} r={10} />
      <path d="M13 54 C14 41 22 35 32 35 C42 35 50 41 51 54" />
    </>
  ),
  dinheiro: (
    <>
      <rect x={7} y={17} width={50} height={30} rx={4} />
      <circle cx={32} cy={32} r={7} />
      <path d="M15 25 V25.5 M49 38.5 V39" />
    </>
  ),
  escudo: (
    <>
      <path d="M32 8 L52 15 V30 C52 44 43 52 32 57 C21 52 12 44 12 30 V15 Z" />
      <path d="M23 32 L30 39 L42 25" />
    </>
  ),
  documento: (
    <>
      <path d="M17 8 H39 L49 18 V56 H17 Z" />
      <path d="M39 8 V18 H49 M24 30 H42 M24 38 H42 M24 46 H35" />
    </>
  ),
  casa: (
    <>
      <path d="M10 30 L32 12 L54 30" />
      <path d="M16 26 V54 H48 V26" />
      <path d="M27 54 V40 H37 V54" />
    </>
  ),
  predio: (
    <>
      <rect x={16} y={8} width={32} height={48} rx={2} />
      <path d="M24 18 H28 M36 18 H40 M24 28 H28 M36 28 H40 M24 38 H28 M36 38 H40 M29 56 V47 H35 V56" />
    </>
  ),
  calendario: (
    <>
      <rect x={10} y={14} width={44} height={40} rx={4} />
      <path d="M10 25 H54 M22 9 V18 M42 9 V18 M20 35 H24 M30 35 H34 M40 35 H44 M20 44 H24 M30 44 H34" />
    </>
  ),
  chave: (
    <>
      <circle cx={21} cy={32} r={11} />
      <path d="M32 32 H56 M48 32 V40 M54 32 V38" />
    </>
  ),
  lupa: (
    <>
      <circle cx={27} cy={27} r={15} />
      <path d="M38 38 L54 54" />
    </>
  ),
  salvar: <path d="M17 9 H47 V56 L32 44 L17 56 Z" />,
  enviar: (
    <>
      <path d="M8 30 L56 10 L44 54 L31 37 Z" />
      <path d="M31 37 L56 10" />
    </>
  ),
  seguir: (
    <>
      <circle cx={26} cy={21} r={9} />
      <path d="M9 53 C10 41 17 35 26 35 C32 35 37 38 40 43 M48 34 V52 M39 43 H57" />
    </>
  ),
  comentar: <path d="M10 14 H54 V44 H30 L18 54 V44 H10 Z" />,
  link: (
    <>
      <path d="M28 36 C24 32 24 26 28 22 L36 14 C40 10 46 10 50 14 C54 18 54 24 50 28 L45 33" />
      <path d="M36 28 C40 32 40 38 36 42 L28 50 C24 54 18 54 14 50 C10 46 10 40 14 36 L19 31" />
    </>
  ),
  alerta: (
    <>
      <path d="M32 9 L57 53 H7 Z" />
      <path d="M32 25 V38 M32 45.5 V46" />
    </>
  ),
  coracao: <path d="M32 54 C18 44 8 35 8 24 C8 16 14 10 21 10 C26 10 30 13 32 17 C34 13 38 10 43 10 C50 10 56 16 56 24 C56 35 46 44 32 54 Z" />,
  relogio: (
    <>
      <circle cx={32} cy={32} r={23} />
      <path d="M32 18 V32 L42 38" />
    </>
  ),
  grafico: (
    <>
      <path d="M9 9 V55 H57" />
      <path d="M16 44 L28 31 L37 38 L53 18 M44 18 H53 V27" />
    </>
  ),
  alvo: (
    <>
      <circle cx={32} cy={32} r={23} />
      <circle cx={32} cy={32} r={13} />
      <circle cx={32} cy={32} r={3} />
    </>
  ),
  lampada: (
    <>
      <path d="M24 44 C24 38 16 34 16 25 C16 16 23 9 32 9 C41 9 48 16 48 25 C48 34 40 38 40 44 Z" />
      <path d="M25 51 H39 M28 57 H36" />
    </>
  ),
  check: <path d="M12 33 L26 47 L52 18" />,
  estrela: <path d="M32 8 L39 24 L56 25 L43 36 L47 53 L32 44 L17 53 L21 36 L8 25 L25 24 Z" />,
  carrinho: (
    <>
      <path d="M6 12 H14 L21 42 H49 L55 20 H17" />
      <circle cx={25} cy={51} r={4} />
      <circle cx={45} cy={51} r={4} />
    </>
  ),
  livro: (
    <>
      <path d="M32 16 C26 11 17 10 9 12 V50 C17 48 26 49 32 54 C38 49 47 48 55 50 V12 C47 10 38 11 32 16 Z" />
      <path d="M32 16 V54" />
    </>
  ),
};

// a lista de ícones que o plano aceita (para conferir)
export const ICONES = Object.keys(desenhos) as NomeIcone[];

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; espessura?: number; p?: number }> = ({
  nome,
  tamanho,
  cor,
  espessura = 4.5,
  p = 1,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" style={{ display: "block", overflow: "visible" }}>
    <g fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" opacity={p}>
      {desenhos[nome] ?? desenhos.chave}
    </g>
  </svg>
);

// Visto em círculo: o carimbo de "conferido"
export const Visto: React.FC<{ tamanho: number; fundo: string; traco: string; p?: number }> = ({ tamanho, fundo, traco, p = 1 }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" style={{ display: "block", overflow: "visible" }}>
    <circle cx={32} cy={32} r={30} fill={fundo} />
    <path
      d="M19 33 L28 42 L46 23"
      fill="none"
      stroke={traco}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={`${Math.max(0.001, p)} 1`}
    />
  </svg>
);
