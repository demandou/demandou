// Ícones de interface a traço (viewBox 48×48, traço único, pontas redondas). Genéricos de propósito:
// nenhum é logotipo de sistema, navegador ou aplicativo.
import { Traco } from "../anim";

type Desenho = { tracos: string[]; cheios?: string[] };

const DESENHOS = {
  globo: {
    tracos: [
      "M24 6a18 18 0 1 0 0.01 0Z",
      "M6 24h36",
      "M24 6c-6 5-8.5 11-8.5 18s2.5 13 8.5 18",
      "M24 6c6 5 8.5 11 8.5 18s-2.5 13-8.5 18",
    ],
  },
  pasta: { tracos: ["M6 14a3 3 0 0 1 3-3h9l4 4h17a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z", "M6 20h36"] },
  prancheta: {
    tracos: [
      "M17 10h-4a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V13a3 3 0 0 0-3-3h-4",
      "M18 7h12v6H18Z",
      "M17 23h14",
      "M17 30h14",
      "M17 37h8",
    ],
  },
  tesoura: {
    tracos: ["M14 14a5 5 0 1 0 0.01 0Z", "M14 34a5 5 0 1 0 0.01 0Z", "M18 16l22 18", "M18 32l22-18"],
  },
  camera: { tracos: ["M6 15a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z", "M32 21l10-6v18l-10-6"] },
  nota: { tracos: ["M10 8h22l6 6v26a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z", "M15 20h18", "M15 27h18", "M15 34h11"] },
  teclado: {
    tracos: [
      "M5 15a3 3 0 0 1 3-3h32a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z",
      "M11 19h2",
      "M18 19h2",
      "M25 19h2",
      "M32 19h5",
      "M11 25h5",
      "M21 25h2",
      "M28 25h2",
      "M35 25h2",
      "M15 31h18",
    ],
  },
  busca: { tracos: ["M21 8a13 13 0 1 0 0.01 0Z", "M31 31l10 10"] },
  marcador: { tracos: ["M13 7h22a2 2 0 0 1 2 2v32l-13-9-13 9V9a2 2 0 0 1 2-2Z"] },
  enviar: { tracos: ["M42 6L20 28", "M42 6L28 42l-8-14-14-8Z"] },
  mouse: { tracos: ["M24 6c-8 0-12 5-12 12v12c0 7 4 12 12 12s12-5 12-12V18c0-7-4-12-12-12Z", "M24 6v12", "M12 19h24"] },
  link: {
    tracos: [
      "M20 28a8 8 0 0 0 11.3 0l7-7a8 8 0 0 0-11.3-11.3l-2 2",
      "M28 20a8 8 0 0 0-11.3 0l-7 7a8 8 0 0 0 11.3 11.3l2-2",
    ],
  },
  imagem: { tracos: ["M7 11a3 3 0 0 1 3-3h28a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3Z", "M7 33l10-10 9 9 5-5 10 10", "M31 15a3 3 0 1 0 0.01 0Z"] },
  texto: { tracos: ["M10 10h28", "M24 10v28", "M18 38h12"] },
  endereco: { tracos: ["M24 42s13-12 13-23a13 13 0 0 0-26 0c0 11 13 23 13 23Z", "M24 14a5 5 0 1 0 0.01 0Z"] },
  dinheiro: { tracos: ["M5 13h38v22H5Z", "M24 19a5 5 0 1 0 0.01 0Z", "M11 19v10", "M37 19v10"] },
  arquivo: { tracos: ["M12 6h16l10 10v24a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z", "M28 6v10h10"] },
  contato: { tracos: ["M24 8a8 8 0 1 0 0.01 0Z", "M9 41c1-8 7-13 15-13s14 5 15 13"] },
  data: { tracos: ["M7 12a3 3 0 0 1 3-3h28a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3Z", "M7 19h34", "M16 5v8", "M32 5v8"] },
  check: { tracos: ["M10 25l9 9 19-20"] },
  reabrir: { tracos: ["M12 16a15 15 0 1 1-3 13", "M12 6v10h10"] },
  mais: { tracos: ["M24 10v28", "M10 24h28"] },
  seguir: { tracos: ["M19 10a7 7 0 1 0 0.01 0Z", "M6 40c1-7 6-11 13-11s12 4 13 11", "M38 16v12", "M32 22h12"] },
  planilha: { tracos: ["M7 9h34v30H7Z", "M7 18h34", "M7 28h34", "M19 9v30", "M30 9v30"] },
  email: { tracos: ["M6 12h36v24H6Z", "M6 13l18 13 18-13"] },
  aviao: { tracos: ["M6 27l12 3 9-14 5 1-5 15 9 3 4-4 3 1-3 8-9-1-12 7-4-1 5-9-12-4Z"] },
  microfone: { tracos: ["M24 6a6 6 0 0 0-6 6v12a6 6 0 0 0 12 0V12a6 6 0 0 0-6-6Z", "M12 24a12 12 0 0 0 24 0", "M24 36v6"] },
  fechar: { tracos: ["M14 14l20 20", "M34 14l-20 20"] },
  minimizar: { tracos: ["M13 30h22"] },
  maximizar: { tracos: ["M14 14h20v20H14Z"] },
  voltar: { tracos: ["M30 12L18 24l12 12"] },
  avancar: { tracos: ["M18 12l12 12-12 12"] },
  recarregar: { tracos: ["M37 24a13 13 0 1 1-4-9.4", "M37 8v8h-8"] },
  wifi: { tracos: ["M8 19a23 23 0 0 1 32 0", "M14 26a14 14 0 0 1 20 0", "M20 33a6 6 0 0 1 8 0"], cheios: ["M24 38a2.5 2.5 0 1 0 0.01 0Z"] },
  bateria: { tracos: ["M6 16h32v16H6Z", "M42 21v6"], cheios: ["M10 20h20v8H10Z"] },
  enter: { tracos: ["M38 10v10a6 6 0 0 1-6 6H12", "M18 19l-7 7 7 7"] },
  setaCima: { tracos: ["M24 8L10 24h8v14h12V24h8Z"] },
  aviso: { tracos: ["M24 7L43 40H5Z", "M24 19v10"], cheios: ["M24 33a2.6 2.6 0 1 0 0.01 0Z"] },
  pergunta: { tracos: ["M24 6a18 18 0 1 0 0.01 0Z", "M18 19a6 6 0 1 1 8.5 5.5c-1.7.8-2.5 2-2.5 3.7V30"], cheios: ["M24 34a2.4 2.4 0 1 0 0.01 0Z"] },
  comentar: { tracos: ["M8 11a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H20l-9 8v-8a3 3 0 0 1-3-3Z", "M15 17h18", "M15 23h11"] },
  grafico: { tracos: ["M7 7v34h34", "M15 33V23", "M23 33V15", "M31 33V20", "M39 33V11"] },
  livro: { tracos: ["M24 12c-4-3-10-4-17-3v29c7-1 13 0 17 3 4-3 10-4 17-3V9c-7-1-13 0-17 3Z", "M24 12v29"] },
  etapas: { tracos: ["M12 10a4 4 0 1 0 0.01 0Z", "M12 34a4 4 0 1 0 0.01 0Z", "M12 18v12", "M22 14h18", "M22 38h18", "M22 26h12"] },
  colar: { tracos: ["M17 10h-4a3 3 0 0 0-3 3v26a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V13a3 3 0 0 0-3-3h-4", "M18 7h12v6H18Z", "M18 28l5 5 9-10"] },
} satisfies Record<string, Desenho>;

export type NomeIcone = keyof typeof DESENHOS;

export const Icone: React.FC<{
  nome: NomeIcone;
  tamanho: number;
  cor: string;
  // 0→1: o traço se desenha
  p?: number;
  peso?: number;
  style?: React.CSSProperties;
}> = ({ nome, tamanho, cor, p = 1, peso = 3.4, style }) => {
  const d: Desenho = DESENHOS[nome] ?? DESENHOS.arquivo;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ display: "block", overflow: "visible", ...style }}>
      {d.tracos.map((tr, i) => (
        <Traco key={i} d={tr} p={p} cor={cor} largura={peso} />
      ))}
      {(d.cheios ?? []).map((c, i) => (
        <path key={`c${i}`} d={c} fill={cor} opacity={p} />
      ))}
    </svg>
  );
};
