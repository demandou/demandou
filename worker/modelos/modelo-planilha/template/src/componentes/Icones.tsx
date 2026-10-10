// Ícones a traço (viewBox 48×48), desenhados traço a traço quando `p` vai de 0 a 1.
// Genéricos, de interface: nada que lembre o logotipo de um programa.
import { limitar, Traco } from "../anim";

type Desenho = { tracos: string[]; cheios?: string[] };

const DESENHOS = {
  // categorias
  saude: { tracos: ["M19 7h10v12h12v10H29v12H19V29H7V19h12z"] },
  educacao: { tracos: ["M3 18 24 9l21 9-21 9z", "M12 22.5v9c0 3.3 5.4 6.5 12 6.5s12-3.2 12-6.5v-9", "M45 18v11"] },
  previdencia: {
    tracos: [
      "M10 13a14 5 0 1 0 28 0 14 5 0 1 0-28 0",
      "M10 13v7c0 2.8 6.3 5 14 5s14-2.2 14-5v-7",
      "M10 20v7c0 2.8 6.3 5 14 5s14-2.2 14-5v-7",
      "M10 27v7c0 2.8 6.3 5 14 5s14-2.2 14-5v-7",
    ],
  },
  casa: { tracos: ["M6 22 24 7l18 15", "M11 18v23h26V18", "M20 41V29h8v12"] },
  carro: { tracos: ["M7 30v-7l5-10h24l5 10v7z", "M7 30v6h6v-6", "M35 30v6h6v-6", "M12 23h24"] },
  cartao: { tracos: ["M9 11h30a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z", "M6 19h36", "M12 29h9"] },
  dinheiro: { tracos: ["M6 13h36v22H6z", "M18 24a6 6 0 1 0 12 0 6 6 0 1 0-12 0", "M11 18v12", "M37 18v12"] },
  documento: { tracos: ["M12 5h17l9 9v29H12z", "M29 5v9h9", "M18 24h14", "M18 31h14"] },
  porcentagem: { tracos: ["M36 10 12 38", "M11 15a4.5 4.5 0 1 0 9 0 4.5 4.5 0 1 0-9 0", "M28 33a4.5 4.5 0 1 0 9 0 4.5 4.5 0 1 0-9 0"] },
  alerta: { tracos: ["M24 6 44 40H4z", "M24 18v10", "M24 34v.5"] },
  relogio: { tracos: ["M6 24a18 18 0 1 0 36 0 18 18 0 1 0-36 0", "M24 13v11l7 5"] },
  // regras
  calendario: { tracos: ["M9 11h30a3 3 0 0 1 3 3v25a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z", "M6 20h36", "M16 6v9", "M32 6v9", "M14 28h4", "M22 28h4", "M30 28h4", "M14 35h4", "M22 35h4"] },
  pessoa: { tracos: ["M17 15a7 7 0 1 0 14 0 7 7 0 1 0-14 0", "M9 42c0-8.5 6.7-14 15-14s15 5.5 15 14"] },
  teto: { tracos: ["M5 9h38", "M12 41V20", "M24 41V9", "M36 41V26"] },
  // preencher
  comprovante: { tracos: ["M12 5h24v38l-4-3-4 3-4-3-4 3-4-3-4 3z", "M18 15h12", "M18 22h12", "M18 29h7"] },
  clipe: { tracos: ["M31 15 18 28a4.5 4.5 0 0 0 6.4 6.4L37 21.6a8 8 0 0 0-11.3-11.3L12.6 23.4a11.5 11.5 0 0 0 16.3 16.3L39 29.6"] },
  // fechamento
  salvar: { tracos: ["M14 5h20a2 2 0 0 1 2 2v36l-12-8.5L12 43V7a2 2 0 0 1 2-2z"] },
  seguir: { tracos: ["M13 15a7 7 0 1 0 14 0 7 7 0 1 0-14 0", "M5 42c0-8.5 6.7-14 15-14 4 0 7.6 1.3 10.2 3.6", "M38 26v14", "M31 33h14"] },
  comentar: { tracos: ["M8 9h32a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H21l-9 8v-8H8a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3z"] },
  enviar: { tracos: ["M43 6 21 27", "M43 6 30 43l-9-16-16-8z"] },
  link: {
    tracos: [
      "M21 27a7.5 7.5 0 0 0 10.6 0l6.4-6.4a7.5 7.5 0 0 0-10.6-10.6l-2.6 2.6",
      "M27 21a7.5 7.5 0 0 0-10.6 0L10 27.4A7.5 7.5 0 0 0 20.6 38l2.6-2.6",
    ],
  },
  // blocos (genéricos, para qualquer assunto)
  chave: { tracos: ["M8 30a8 8 0 1 0 16 0 8 8 0 1 0-16 0", "M22 24 40 6", "M34 12l5 5", "M29 17l4 4"] },
  lampada: { tracos: ["M17 31c-4-3-6-7-6-11a13 13 0 0 1 26 0c0 4-2 8-6 11v4H17z", "M18 40h12", "M21 44h6"] },
  alvo: { tracos: ["M6 24a18 18 0 1 0 36 0 18 18 0 1 0-36 0", "M14 24a10 10 0 1 0 20 0 10 10 0 1 0-20 0", "M22 24a2 2 0 1 0 4 0 2 2 0 1 0-4 0"] },
  sobe: { tracos: ["M6 36 18 24l8 7 15-16", "M31 15h10v10"] },
  cai: { tracos: ["M6 14l12 12 8-7 15 16", "M31 35h10V25"] },
  oscila: { tracos: ["M5 26c4-10 8-10 12 0s8 10 12 0 8-10 14-2"] },
  baixo: { tracos: ["M24 8v32", "M12 28l12 12 12-12"] },
  sol: { tracos: ["M16 24a8 8 0 1 0 16 0 8 8 0 1 0-16 0", "M24 6v5", "M24 37v5", "M6 24h5", "M37 24h5", "M11.3 11.3l3.5 3.5", "M33.2 33.2l3.5 3.5", "M11.3 36.7l3.5-3.5", "M33.2 14.8l3.5-3.5"] },
  pino: { tracos: ["M24 43c-7-9-13-16-13-23a13 13 0 0 1 26 0c0 7-6 14-13 23z", "M19 20a5 5 0 1 0 10 0 5 5 0 1 0-10 0"] },
  bonde: { tracos: ["M12 14h24a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z", "M9 26h30", "M18 14l6-7 6 7", "M15 42l3-5", "M33 42l-3-5", "M15 31.5h.5", "M32.5 31.5h.5"] },
  aviao: { tracos: ["M44 10 26 22l-14-4-4 3 11 7-7 7-6-1-2 2 7 4 4 7 2-2-1-6 7-7 7 11 3-4-4-14 12-18z"] },
  mala: { tracos: ["M8 16h32a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3z", "M18 16v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5", "M16 16v25", "M32 16v25"] },
  lista: { tracos: ["M18 12h24", "M18 24h24", "M18 36h24", "M7 12h3", "M7 24h3", "M7 36h3"] },
  pergunta: { tracos: ["M17 17a7 7 0 1 1 10 6.3c-2 1-3 2.5-3 4.7v2", "M24 36v.5"] },
  livro: { tracos: ["M24 12c-5-4-12-4-18-2v28c6-2 13-2 18 2 5-4 12-4 18-2V10c-6-2-13-2-18 2z", "M24 12v28"] },
  coracao: { tracos: ["M24 40 9 25a9 9 0 0 1 15-11 9 9 0 0 1 15 11z"] },
  estrela: { tracos: ["M24 6l5.5 11.6 12.5 1.6-9.2 8.7 2.3 12.5L24 34.3l-11.1 6.1 2.3-12.5L6 19.2l12.5-1.6z"] },
  mundo: { tracos: ["M6 24a18 18 0 1 0 36 0 18 18 0 1 0-36 0", "M6 24h36", "M24 6c-6 6-6 30 0 36", "M24 6c6 6 6 30 0 36"] },
  // marcas e interface
  check: { tracos: ["M12 25l8 8 16-17"] },
  xis: { tracos: ["M15 15l18 18", "M33 15 15 33"] },
  nuvem: { tracos: ["M14 37h21a8.5 8.5 0 0 0 1-17 11.5 11.5 0 0 0-22-1.5A9.5 9.5 0 0 0 14 37z", "M18 28l4 4 8-8"] },
  desfazer: { tracos: ["M17 11 9 19l8 8", "M9 19h19a10 10 0 0 1 0 20h-7"] },
  refazer: { tracos: ["M31 11l8 8-8 8", "M39 19H20a10 10 0 0 0 0 20h7"] },
  filtro: { tracos: ["M6 9h36L28 25v12l-8 5V25z"] },
  grafico: { tracos: ["M7 41h34", "M13 35V24", "M24 35V11", "M35 35V18"] },
  mais: { tracos: ["M24 10v28", "M10 24h28"] },
  grupo: { tracos: ["M10 24h28"] },
} satisfies Record<string, Desenho>;

export type NomeIcone = keyof typeof DESENHOS;

// `p`: progresso do desenho (0 a 1); `cheio`: preenche a forma (ex.: marcador salvo)
export const Icone: React.FC<{
  nome: NomeIcone;
  tamanho: number;
  cor: string;
  peso?: number;
  p?: number;
  cheio?: number;
  tracejado?: boolean;
  style?: React.CSSProperties;
}> = ({ nome, tamanho, cor, peso = 3.4, p = 1, cheio = 0, tracejado, style }) => {
  const d: Desenho = DESENHOS[nome] ?? DESENHOS.documento;
  const n = d.tracos.length;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ display: "block", overflow: "visible", ...style }}>
      {cheio > 0 ? <path d={d.tracos[0]} fill={cor} opacity={cheio} /> : null}
      {d.tracos.map((tr, i) =>
        tracejado ? (
          <path key={i} d={tr} fill="none" stroke={cor} strokeWidth={peso} strokeDasharray="3 4.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <Traco key={i} d={tr} p={limitar(p * n - i)} cor={cor} largura={peso} />
        ),
      )}
    </svg>
  );
};
