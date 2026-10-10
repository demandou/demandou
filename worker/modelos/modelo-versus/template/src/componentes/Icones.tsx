// Ícones de traço grosso (cartaz de luta): os critérios das rodadas e os do fechamento.
import type { Icone as NomeIcone } from "../plano";

type NomeCta = "salvar" | "seguir" | "comentar" | "link";

const desenhos: Record<NomeIcone | NomeCta, React.ReactNode> = {
  tempo: (
    <>
      <circle cx="50" cy="56" r="34" />
      <path d="M50 56 L50 36 M50 56 L64 64 M40 12 L60 12 M50 12 L50 22 M80 26 L86 20" />
    </>
  ),
  espaco: (
    <>
      <rect x="20" y="30" width="60" height="50" rx="4" />
      <path d="M20 30 L34 16 L94 16 L80 30 M94 16 L94 66 L80 80" />
    </>
  ),
  energia: <path d="M56 8 L22 56 L48 56 L42 92 L78 42 L52 42 Z" />,
  dinheiro: (
    <>
      <circle cx="50" cy="50" r="38" />
      <path d="M62 34 C58 28 40 27 38 38 C36 50 64 48 62 62 C60 73 40 72 36 65 M50 22 L50 78" />
    </>
  ),
  qualidade: <path d="M50 10 L61 37 L90 39 L67 57 L75 86 L50 70 L25 86 L33 57 L10 39 L39 37 Z" />,
  saude: <path d="M50 84 C20 62 10 46 14 32 C18 18 38 14 50 30 C62 14 82 18 86 32 C90 46 80 62 50 84 Z" />,
  sabor: <path d="M30 12 L30 88 M20 12 L20 34 C20 42 40 42 40 34 L40 12 M68 88 L68 12 C82 22 82 46 68 52" />,
  facilidade: (
    <>
      <circle cx="50" cy="50" r="38" />
      <path d="M32 52 L45 64 L70 37" />
    </>
  ),
  seguranca: <path d="M50 10 L84 22 L84 48 C84 70 68 84 50 92 C32 84 16 70 16 48 L16 22 Z M36 50 L47 61 L66 40" />,
  pessoas: (
    <>
      <circle cx="36" cy="34" r="13" />
      <circle cx="68" cy="38" r="11" />
      <path d="M12 84 C12 62 24 54 36 54 C48 54 60 62 60 84 M58 58 C62 54 66 54 70 54 C82 54 90 62 90 82" />
    </>
  ),
  salvar: <path d="M26 10 L74 10 L74 90 L50 70 L26 90 Z" />,
  seguir: (
    <>
      <circle cx="42" cy="34" r="17" />
      <path d="M12 88 C12 66 26 56 42 56 C58 56 72 66 72 88 M80 26 L80 50 M68 38 L92 38" />
    </>
  ),
  comentar: <path d="M14 18 L86 18 L86 68 L44 68 L24 86 L26 68 L14 68 Z" />,
  link: <path d="M44 58 L58 44 M40 38 L50 28 C58 20 70 20 76 26 C82 32 82 44 74 52 L64 62 M60 62 L50 72 C42 80 30 80 24 74 C18 68 18 56 26 48 L36 38" />,
};

export const Icone: React.FC<{ nome: NomeIcone | NomeCta; tamanho: number; cor: string; traco?: number }> = ({ nome, tamanho, cor, traco = 8 }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
    <g fill="none" stroke={cor} strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round">
      {desenhos[nome] ?? null}
    </g>
  </svg>
);
