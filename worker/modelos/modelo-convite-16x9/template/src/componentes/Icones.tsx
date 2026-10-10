import { prog, Traco } from "../anim";
import type { Icone as NomeDoIcone } from "../plano";
import { cor } from "../tema";

// Ícones a traço fino, desenhados num quadrado de 64. Cada um é uma lista de caminhos.
const CAMINHOS: Record<NomeDoIcone, string[]> = {
  calendario: [
    "M12 16 H52 a4 4 0 0 1 4 4 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 V20 a4 4 0 0 1 4 -4 Z",
    "M8 27 H56",
    "M21 9 V20",
    "M43 9 V20",
    "M32 50 C23 44 20 38 24 35 C27 33 30 34 32 37 C34 34 37 33 40 35 C44 38 41 44 32 50 Z",
  ],
  local: ["M32 58 C32 58 13 39 13 26 A19 19 0 0 1 51 26 C51 39 32 58 32 58 Z", "M38 26 A6 6 0 1 1 26 26 A6 6 0 1 1 38 26 Z"],
  orcamento: [
    "M14 16 A18 6 0 1 0 50 16 A18 6 0 1 0 14 16 Z",
    "M14 16 V27 A18 6 0 0 0 50 27 V16",
    "M14 27 V38 A18 6 0 0 0 50 38 V27",
    "M14 38 V49 A18 6 0 0 0 50 49 V38",
  ],
  camera: [
    "M12 22 H52 a5 5 0 0 1 5 5 V50 a5 5 0 0 1 -5 5 H12 a5 5 0 0 1 -5 -5 V27 a5 5 0 0 1 5 -5 Z",
    "M22 22 L26 14 H38 L42 22",
    "M43 38 A11 11 0 1 1 21 38 A11 11 0 1 1 43 38 Z",
    "M49 29 H51",
  ],
  buffet: ["M13 46 A19 19 0 0 1 51 46", "M8 46 H56", "M12 53 H52", "M32 27 V23", "M29 22 H35"],
  convite: ["M10 17 H54 V49 H10 Z", "M10 17 L32 35 L54 17", "M37 38 A5 5 0 1 1 27 38 A5 5 0 1 1 37 38 Z"],
  traje: ["M27 15 A5 5 0 1 1 32 20 V25", "M32 25 L7 44 H57 Z"],
  envio: ["M22 18 H58 V46 H22 Z", "M22 18 L40 33 L58 18", "M5 24 H15", "M2 32 H15", "M7 40 H15"],
  prova: ["M27 8 L28 22 L17 56 H47 L36 22 L37 8", "M28 22 H36", "M27 8 C29 12 35 12 37 8"],
  confirmacao: ["M12 11 H52 V53 H12 Z", "M20 33 L28 41 L44 25"],
  aliancas: ["M38 38 A13 13 0 1 1 12 38 A13 13 0 1 1 38 38 Z", "M52 38 A13 13 0 1 1 26 38 A13 13 0 1 1 52 38 Z", "M35 20 L39 14 L43 20 L39 24 Z"],
  bolo: ["M17 36 H47 V54 H17 Z", "M22 23 H42 V36 H22 Z", "M32 23 V14", "M10 56 H54"],
  flores: [
    "M30 19 A7 7 0 1 1 16 19 A7 7 0 1 1 30 19 Z",
    "M48 19 A7 7 0 1 1 34 19 A7 7 0 1 1 48 19 Z",
    "M39 10 A7 7 0 1 1 25 10 A7 7 0 1 1 39 10 Z",
    "M32 18 V58",
    "M23 26 L30 50",
    "M41 26 L34 50",
  ],
  musica: ["M28 46 A7 6 0 1 1 14 46 A7 6 0 1 1 28 46 Z", "M28 46 V14 L50 9 V40", "M50 40 A7 6 0 1 1 36 40 A7 6 0 1 1 50 40 Z"],
  lista: ["M24 17 H54", "M24 32 H54", "M24 47 H54", "M12 17 H14", "M12 32 H14", "M12 47 H14"],
  taca: ["M19 9 H45 C45 24 40 32 32 32 C24 32 19 24 19 9 Z", "M32 32 V52", "M21 54 H43"],
  // genéricos (qualquer assunto)
  relogio: ["M56 32 A24 24 0 1 1 8 32 A24 24 0 1 1 56 32 Z", "M32 18 V32 L42 39"],
  alerta: ["M32 8 L58 54 H6 Z", "M32 25 V39", "M32 46 V47"],
  certo: ["M12 34 L26 48 L52 18"],
  errado: ["M16 16 L48 48", "M48 16 L16 48"],
  grafico: ["M10 8 V54 H58", "M17 44 L29 31 L39 38 L53 19", "M45 19 H53 V27"],
  lupa: ["M41 26 A15 15 0 1 1 11 26 A15 15 0 1 1 41 26 Z", "M37 37 L55 55"],
  ideia: ["M23 42 C14 35 14 16 32 10 C50 16 50 35 41 42 V48 H23 Z", "M25 55 H39", "M28 34 L32 40 L36 34"],
  coracao: ["M32 54 C14 42 8 30 14 21 C20 13 29 15 32 22 C35 15 44 13 50 21 C56 30 50 42 32 54 Z"],
  estrela: ["M32 8 L38.5 24 L56 25 L42.5 36 L47 53 L32 43.5 L17 53 L21.5 36 L8 25 L25.5 24 Z"],
  pessoa: ["M41 19 A9 9 0 1 1 23 19 A9 9 0 1 1 41 19 Z", "M12 56 C12 42 21 35 32 35 C43 35 52 42 52 56"],
  casa: ["M8 30 L32 10 L56 30", "M14 25 V54 H50 V25", "M27 54 V40 H37 V54"],
  livro: ["M32 16 C26 12 16 11 8 13 V51 C16 49 26 50 32 54 C38 50 48 49 56 51 V13 C48 11 38 12 32 16 Z", "M32 16 V54"],
  telefone: ["M21 6 H43 a4 4 0 0 1 4 4 V54 a4 4 0 0 1 -4 4 H21 a4 4 0 0 1 -4 -4 V10 a4 4 0 0 1 4 -4 Z", "M29 50 H35"],
  computador: ["M9 11 H55 V42 H9 Z", "M24 54 H40", "M32 42 V54"],
  teclado: ["M6 18 H58 V48 H6 Z", "M14 26 H16", "M24 26 H26", "M34 26 H36", "M44 26 H50", "M14 34 H16", "M24 34 H26", "M34 34 H36", "M44 34 H50", "M20 41 H44"],
  janela: ["M6 13 H58 V52 H6 Z", "M6 23 H58", "M12 18 H14", "M19 18 H21", "M26 18 H28"],
  copiar: ["M22 22 H52 V56 H22 Z", "M14 44 H10 V8 H42 V14"],
  recorte: ["M16 6 V48 H58", "M6 16 H48 V58"],
  cadeado: ["M15 30 H49 V56 H15 Z", "M22 30 V22 A10 10 0 0 1 42 22 V30", "M32 40 V46"],
  mensagem: ["M8 12 H56 V44 H27 L15 54 V44 H8 Z", "M18 24 H46", "M18 32 H36"],
  presente: ["M8 24 H56 V34 H8 Z", "M12 34 V56 H52 V34", "M32 24 V56", "M32 24 C27 13 15 13 19 21 C22 25 32 24 32 24 C32 24 42 25 45 21 C49 13 37 13 32 24"],
  seta: ["M8 32 H54", "M40 18 L54 32 L40 46"],
};

// os ícones da chamada final (cta)
const CAMINHOS_CTA: Record<"salvar" | "seguir" | "comentar" | "link", string[]> = {
  salvar: ["M18 8 H46 V56 L32 44 L18 56 Z"],
  seguir: ["M34 19 A9 9 0 1 1 16 19 A9 9 0 1 1 34 19 Z", "M6 54 C6 42 13 35 25 35 C32 35 37 37 41 42", "M50 30 V48", "M41 39 H59"],
  comentar: ["M9 11 H55 V42 H28 L16 53 V42 H9 Z", "M19 23 H45", "M19 31 H37"],
  link: ["M24 40 L40 24", "M28 18 L34 12 A11.5 11.5 0 0 1 52 30 L46 36", "M36 46 L30 52 A11.5 11.5 0 0 1 12 34 L18 28"],
};

// `p` desenha o traço de tinta (0→1); antes disso o ícone fica a lápis.
export const Icone: React.FC<{ nome: NomeDoIcone; tamanho: number; p: number; esboco?: boolean; corDe?: string }> = ({ nome, tamanho, p, esboco = true, corDe = cor.tinta }) => {
  const caminhos = CAMINHOS[nome] ?? CAMINHOS.lista;
  return (
    <svg width={tamanho} height={tamanho} viewBox="-2 -2 68 68" style={{ overflow: "visible", flexShrink: 0 }}>
      {esboco
        ? caminhos.map((d) => <path key={`l-${d}`} d={d} fill="none" stroke={cor.lapis} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 5" />)
        : null}
      {caminhos.map((d) => (
        <Traco key={d} d={d} p={p} cor={corDe} largura={3.8} />
      ))}
    </svg>
  );
};

// Ícone da chamada final, a traço de tinta, que se desenha em `p`.
// Fica dentro de um círculo a pena, como um selo de tinta.
export const IconeCta: React.FC<{ nome: keyof typeof CAMINHOS_CTA; tamanho: number; p: number; corDe?: string }> = ({ nome, tamanho, p, corDe = cor.tinta }) => (
  <svg width={tamanho} height={tamanho} viewBox="-2 -2 68 68" style={{ overflow: "visible", flexShrink: 0 }}>
    <circle cx={32} cy={32} r={31} fill="none" stroke={cor.lapis} strokeWidth={1.4} strokeDasharray="1 4" />
    <Traco d="M32 1 A31 31 0 1 1 31.99 1" p={prog(p, 0, 0.6, (x) => x)} cor={corDe} largura={1.8} opacity={0.7} />
    <g transform="translate(32 32) scale(0.64) translate(-32 -32)">
      {(CAMINHOS_CTA[nome] ?? CAMINHOS_CTA.salvar).map((d) => (
        <Traco key={d} d={d} p={prog(p, 0.25, 0.75, (x) => x)} cor={corDe} largura={5.4} />
      ))}
    </g>
  </svg>
);

// Marcador neutro de um item sem ícone: um losango de cera azul que se desenha no instante do item.
export const Losango: React.FC<{ tamanho: number; p: number; corDe?: string }> = ({ tamanho, p, corDe = cor.cera }) => (
  <svg width={tamanho} height={tamanho} viewBox="-10 -10 20 20" style={{ overflow: "visible", flexShrink: 0 }}>
    <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill="none" stroke={cor.lapis} strokeWidth={1.2} strokeDasharray="1 2.4" />
    <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill={corDe} opacity={p} transform={`scale(${0.6 + 0.4 * p})`} />
  </svg>
);

export const ICONES = Object.keys(CAMINHOS) as NomeDoIcone[];
