import type { Icone as NomeIcone } from "../plano";

// Ícones a traço numa caixa de 100 × 100. Só linhas, cantos redondos; a única área cheia permitida é
// um detalhe claro (`claro`), como o miolo da mandioca cortada.
// Para um ícone novo: acrescente os traços aqui e o nome em `Icone` (src/plano.ts).
type Traco = string | { d: string; giro?: number; cx?: number; cy?: number; claro?: boolean };

// um grão de feijão (rim), girado em volta do próprio centro
const feijao = (cx: number, cy: number, giro: number): Traco => ({
  d: `M${cx - 14} ${cy} C${cx - 14} ${cy - 11} ${cx - 3} ${cy - 12} ${cx} ${cy - 6} C${cx + 3} ${cy - 12} ${cx + 14} ${cy - 11} ${cx + 14} ${cy} C${cx + 14} ${cy + 10} ${cx - 14} ${cy + 10} ${cx - 14} ${cy} Z`,
  giro,
  cx,
  cy,
});

const ICONES: Record<NomeIcone, Traco[]> = {
  // ---- gerais (qualquer assunto)
  alerta: ["M50 13 L89 82 C90 84 89 86 86 86 L14 86 C11 86 10 84 11 82 Z", "M50 40 L50 61", "M50 72 L50 72.5"],
  chave: ["M46 50 A16 16 0 1 1 14 50 A16 16 0 1 1 46 50 Z", "M46 50 L88 50", "M74 50 L74 64 M85 50 L85 61"],
  raio: ["M58 10 L26 56 L48 56 L40 90 L74 42 L52 42 Z"],
  alvo: ["M84 50 A34 34 0 1 1 16 50 A34 34 0 1 1 84 50 Z", "M69 50 A19 19 0 1 1 31 50 A19 19 0 1 1 69 50 Z", "M54 50 A4 4 0 1 1 46 50 A4 4 0 1 1 54 50 Z"],
  lupa: ["M66 42 A24 24 0 1 1 18 42 A24 24 0 1 1 66 42 Z", "M60 60 L85 85"],
  escudo: ["M50 12 L80 24 L80 50 C80 70 66 82 50 88 C34 82 20 70 20 50 L20 24 Z", "M50 30 L50 72"],
  moeda: ["M84 50 A34 34 0 1 1 16 50 A34 34 0 1 1 84 50 Z", "M60 39 C57 33 41 32 41 41 C41 50 59 49 59 58 C59 67 42 67 40 60", "M50 27 L50 73"],
  carteira: ["M16 36 L16 78 C16 81 18 83 21 83 L82 83 L82 41 L22 41 C18 41 16 39 16 36 C16 31 18 29 22 29 L72 29 L72 41", "M64 56 L86 56 L86 68 L64 68 Z"],
  sobe: ["M14 86 L86 86", "M16 70 L38 48 L54 60 L82 28", "M64 28 L82 28 L82 46"],
  cai: ["M14 86 L86 86", "M16 28 L38 50 L54 38 L82 70", "M64 70 L82 70 L82 52"],
  lampada: ["M50 12 C33 12 22 25 22 40 C22 51 28 58 35 64 L35 74 L65 74 L65 64 C72 58 78 51 78 40 C78 25 67 12 50 12 Z", "M38 83 L62 83", "M43 91 L57 91"],
  livro: ["M50 26 C40 18 24 18 14 22 L14 80 C24 76 40 76 50 84 C60 76 76 76 86 80 L86 22 C76 18 60 18 50 26 Z", "M50 26 L50 84"],
  play: ["M84 50 A34 34 0 1 1 16 50 A34 34 0 1 1 84 50 Z", "M42 34 L66 50 L42 66 Z"],
  pessoa: ["M64 32 A14 14 0 1 1 36 32 A14 14 0 1 1 64 32 Z", "M20 86 C20 64 34 54 50 54 C66 54 80 64 80 86"],
  pessoas: ["M50 34 A12 12 0 1 1 26 34 A12 12 0 1 1 50 34 Z", "M12 84 C12 66 24 57 38 57 C52 57 64 66 64 84", "M78 30 A11 11 0 1 1 56 30 A11 11 0 1 1 78 30 Z", "M62 52 C78 51 88 61 88 78"],
  casa: ["M12 48 L50 15 L88 48", "M23 39 L23 86 L77 86 L77 39", "M42 86 L42 62 L58 62 L58 86"],
  calendario: ["M16 24 L84 24 L84 86 L16 86 Z", "M16 41 L84 41", "M32 14 L32 30 M68 14 L68 30", "M31 57 L33 57 M49 57 L51 57 M67 57 L69 57 M31 71 L33 71 M49 71 L51 71"],
  mensagem: ["M50 16 C28 16 14 30 14 46 C14 56 19 64 27 70 L22 86 L42 75 C44 76 47 76 50 76 C72 76 86 62 86 46 C86 30 72 16 50 16 Z"],
  estrela: ["M50 12 L60.5 37.5 L88 39.5 L67 57 L73.5 84 L50 69.5 L26.5 84 L33 57 L12 39.5 L39.5 37.5 Z"],
  cadeado: ["M22 46 L78 46 L78 88 L22 88 Z", "M34 46 L34 32 C34 22 41 15 50 15 C59 15 66 22 66 32 L66 46", "M50 60 L50 73"],
  seta: ["M14 50 L84 50", "M62 28 L84 50 L62 72"],
  interrogacao: ["M86 50 A36 36 0 1 1 14 50 A36 36 0 1 1 86 50 Z", "M39 39 C39 30 45 25 51 25 C59 25 63 30 63 37 C63 46 50 47 50 58", "M50 70 L50 70.5"],
  brocolis: [
    "M31 57 C18 57 15 41 27 37 C25 24 41 18 49 26 C54 15 72 17 74 30 C86 31 88 49 76 56 C73 58 69 58 66 57",
    "M40 57 L38 84 C38 87 40 88 43 88 L57 88 C60 88 62 87 62 84 L60 57",
    "M50 86 L50 68 M50 72 L43 62 M50 72 L57 62",
  ],
  folha: ["M22 80 C18 46 44 20 82 18 C84 56 58 82 22 80 Z", "M22 80 C40 62 56 46 70 30", "M40 63 L37 50 M51 52 L64 54 M46 57 L49 44"],
  cenoura: [
    "M58 30 C68 26 76 34 72 44 L30 84 C26 88 18 82 22 76 Z",
    "M64 32 L72 14 M66 34 L86 22 M68 38 L88 38",
    "M46 50 L52 56 M38 62 L43 67 M54 42 L58 46",
  ],
  tomate: [
    "M50 86 C30 86 16 72 16 55 C16 39 30 29 50 29 C70 29 84 39 84 55 C84 72 70 86 50 86 Z",
    "M50 31 L52 16",
    "M50 31 C44 24 37 25 34 31 M50 31 C56 24 63 25 66 31 M50 31 C46 36 42 38 38 38 M50 31 C54 36 58 38 62 38",
  ],
  frango: [
    "M50 54 C36 42 42 16 62 14 C82 12 92 34 82 50 C76 60 64 63 56 58",
    "M50 54 L38 66 M56 58 L44 70",
    "M38 66 C31 61 21 68 26 75 C20 80 28 89 35 82 C40 88 50 79 44 70",
  ],
  peixe: [
    "M16 50 C28 30 56 28 72 50 C56 72 28 70 16 50 Z",
    "M72 50 L88 36 L88 64 Z",
    "M30 44 L30.1 44",
    "M40 40 C44 46 44 54 40 60",
  ],
  ovo: [
    "M30 29 C42 15 64 19 72 31 C87 35 89 58 77 68 C71 85 44 87 33 77 C17 73 13 50 21 42 C21 36 25 31 30 29 Z",
    "M62 53 A12 12 0 1 1 38 53 A12 12 0 1 1 62 53 Z",
  ],
  feijao: [feijao(34, 38, -18), feijao(66, 42, 14), feijao(48, 68, -4), "M34 32 L34 34 M66 36 L66 38 M48 62 L48 64"],
  leite: ["M32 32 L32 88 L70 88 L70 32 L60 14 L42 14 Z", "M32 32 L70 32 M42 14 L42 24", "M40 50 L62 50 M40 60 L56 60"],
  arroz: [
    "M14 52 L86 52 C86 72 71 86 50 86 C29 86 14 72 14 52 Z",
    "M21 52 C23 37 37 29 50 31 C63 29 77 37 79 52",
    "M36 44 L40 41 M50 38 L54 40 M60 45 L64 42 M44 47 L47 49 M30 49 L33 46 M69 49 L72 47",
  ],
  batata: [
    "M22 46 C20 29 38 20 56 23 C75 26 85 39 83 55 C81 73 64 81 46 79 C29 77 24 62 22 46 Z",
    "M40 39 L44 41 M61 37 L64 40 M58 61 L62 62 M38 60 L41 63 M50 50 L53 51",
  ],
  // tubérculo deitado, grosso e irregular, com anéis de casca; a ponta cortada mostra o miolo claro
  mandioca: [
    "M8 70 C13 61 22 55 33 52 C39 47 47 46 54 46 C60 41 68 38 77 38 L84 64 C78 68 71 66 65 70 C57 74 49 72 42 75 C30 78 17 77 8 70 Z",
    "M29 57 C31 62 31 68 29 73 M45 50 C47 56 47 64 46 71 M61 44 C63 51 63 60 62 68",
    "M8 70 C5 71 3 74 2 77",
    { d: "M73.5 51 A7 13 0 1 0 87.5 51 A7 13 0 1 0 73.5 51 Z", giro: -14, cx: 80.5, cy: 51, claro: true },
    "M80.5 49.5 L80.5 52.5",
  ],
  pao: [
    "M18 46 C18 30 34 24 50 24 C66 24 82 30 82 46 C82 52 79 55 76 55 L76 84 L24 84 L24 55 C21 55 18 52 18 46 Z",
    "M36 37 L42 30 M48 37 L54 30 M60 37 L66 30",
  ],
  azeite: [
    "M40 34 L40 44 C30 50 26 60 26 70 C26 80 33 87 43 87 L57 87 C67 87 74 80 74 70 C74 60 70 50 60 44 L60 34",
    "M38 34 L62 34 M43 34 L43 17 L57 17 L57 34",
    "M31 64 C40 60 46 68 55 64 C62 60 66 64 69 64",
  ],
  gota: ["M50 12 C60 30 77 46 77 62 C77 77 65 87 50 87 C35 87 23 77 23 62 C23 46 40 30 50 12 Z", "M37 63 C37 70 41 75 47 77"],
  maca: [
    "M50 34 C40 25 20 28 19 48 C18 69 32 87 44 87 C47 87 48 85 50 85 C52 85 53 87 56 87 C68 87 82 69 81 48 C80 28 60 25 50 34 Z",
    "M50 34 L50 19",
    "M52 25 C58 14 71 14 74 18 C67 27 58 27 52 25 Z",
  ],
  xicara: [
    "M20 42 L68 42 L65 72 C64 79 58 84 51 84 L37 84 C30 84 24 79 23 72 Z",
    "M68 50 C80 48 85 58 79 64 C75 68 69 68 66 66",
    "M12 90 L80 90",
    "M36 32 C32 26 40 22 36 15 M51 32 C47 26 55 22 51 15",
  ],
  copo: ["M27 16 L34 87 L66 87 L73 16 Z", "M30 44 C39 39 45 48 54 43 C61 39 65 45 70 43"],
  prato: [
    "M76 52 A26 26 0 1 1 24 52 A26 26 0 1 1 76 52 Z",
    "M64 52 A14 14 0 1 1 36 52 A14 14 0 1 1 64 52 Z",
    "M12 20 L12 84 M8 20 L8 36 C8 41 16 41 16 36 L16 20",
    "M88 20 C81 28 81 46 88 50 L88 84",
  ],
  relogio: ["M84 52 A34 34 0 1 1 16 52 A34 34 0 1 1 84 52 Z", "M50 30 L50 52 L64 60", "M50 14 L50 18 M82 52 L86 52 M50 86 L50 90 M14 52 L18 52"],
  lua: ["M62 14 C44 17 30 33 30 52 C30 72 46 87 66 87 C74 87 80 85 85 81 C64 81 48 66 48 46 C48 33 54 21 62 14 Z", "M78 26 L78 34 M74 30 L82 30"],
  coracao: ["M50 83 C30 69 15 57 15 40 C15 28 25 19 36 19 C44 19 48 24 50 30 C52 24 56 19 64 19 C75 19 85 28 85 40 C85 57 70 69 50 83 Z"],
  halter: [
    "M24 32 L34 32 L34 68 L24 68 Z M66 32 L76 32 L76 68 L66 68 Z",
    "M14 40 L24 40 L24 60 L14 60 Z M76 40 L86 40 L86 60 L76 60 Z",
    "M34 50 L66 50",
  ],
  tenis: [
    "M12 72 L12 50 C12 44 18 40 24 42 L37 46 C41 36 47 31 54 34 C60 50 72 55 86 57 C91 59 91 70 87 72 Z",
    "M12 64 L90 64",
    "M41 45 L47 41 M45 51 L51 47",
  ],
  documento: ["M28 10 L60 10 L76 26 L76 90 L28 90 Z", "M60 10 L60 26 L76 26", "M38 44 L66 44 M38 56 L66 56 M38 68 L56 68"],
  check: ["M86 50 A36 36 0 1 1 14 50 A36 36 0 1 1 86 50 Z", "M33 51 L45 63 L68 38"],
  x: ["M30 30 L70 70 M70 30 L30 70"],
  salvar: ["M28 12 L72 12 L72 90 L50 71 L28 90 Z"],
  seguir: [
    "M54 36 A14 14 0 1 1 26 36 A14 14 0 1 1 54 36 Z",
    "M12 84 C12 66 24 57 40 57 C56 57 68 66 68 84",
    "M82 32 L82 56 M70 44 L94 44",
  ],
  comentar: ["M14 22 L86 22 L86 70 L48 70 L28 87 L30 70 L14 70 Z", "M30 40 L70 40 M30 52 L58 52"],
  compartilhar: ["M10 48 L90 12 L66 88 L50 58 Z", "M50 58 L90 12"],
  link: ["M42 58 L58 42", "M40 46 L30 56 C23 63 23 71 30 77 C36 83 44 83 50 76 L60 66", "M60 54 L70 44 C77 37 77 29 70 23 C64 17 56 17 50 24 L40 34"],
};

// Traço que se desenha (p de 0 a 1). Com `cheio`, o desenho ganha fundo na cor do traço.
// Com `esboco` (0 a 1), o ícone inteiro aparece "a lápis" (tracejado fino e apagado) por baixo do traço.
export const Icone: React.FC<{
  nome: NomeIcone;
  tamanho: number;
  cor: string;
  p?: number;
  peso?: number;
  cheio?: number;
  corCheio?: string;
  esboco?: number;
  corClara?: string;
}> = ({ nome, tamanho, cor, p = 1, peso = 5, cheio = 0, corCheio, esboco = 0, corClara = "#F8F3E9" }) => {
  const tracos = ICONES[nome] ?? [];
  if (p <= 0.001 && esboco <= 0.001) return <svg width={tamanho} height={tamanho} />;
  const desenhar = (tr: Traco, i: number, modo: "esboco" | "traco") => {
    const d = typeof tr === "string" ? tr : tr.d;
    const giro = typeof tr === "string" || tr.giro === undefined ? undefined : `rotate(${tr.giro} ${tr.cx} ${tr.cy})`;
    const claro = typeof tr !== "string" && tr.claro;
    if (modo === "esboco")
      return (
        <path
          key={`e${i}`}
          d={d}
          transform={giro}
          fill="none"
          stroke={cor}
          strokeOpacity={0.55 * esboco}
          strokeWidth={peso * 0.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 5"
        />
      );
    return (
      <path
        key={`t${i}`}
        d={d}
        transform={giro}
        fill={claro ? corClara : cheio > 0 && i === 0 ? (corCheio ?? cor) : "none"}
        fillOpacity={claro ? Math.min(1, p * 1.5) : cheio}
        stroke={cor}
        strokeWidth={peso}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={p < 0.999 ? `${p} 1` : undefined}
      />
    );
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      {esboco > 0.001 ? tracos.map((tr, i) => desenhar(tr, i, "esboco")) : null}
      {p > 0.001 ? tracos.map((tr, i) => desenhar(tr, i, "traco")) : null}
    </svg>
  );
};

export const NOMES_DE_ICONES = Object.keys(ICONES) as NomeIcone[];
