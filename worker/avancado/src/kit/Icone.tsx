import React from "react";
import { MARCA } from "./marca";

/**
 * ÍCONES VETORIAIS DO PRÓPRIO PROJETO (aulas 7 e 8.2: "crie ícones vetoriais
 * relacionados à fala"; "desenho de traços"). Grade de 24, só traço; o
 * `progresso` (0 a 1) desenha o traço, como a aula pede. Sem marca de terceiros.
 * Ícone que não está aqui a cena desenha com <svg> e <path> do mesmo jeito.
 */
export const ICONES = {
  caixa: "M3 7.5 L12 3 L21 7.5 L21 16.5 L12 21 L3 16.5 Z M3 7.5 L12 12 L21 7.5 M12 12 L12 21",
  notebook: "M5 5 H19 A1 1 0 0 1 20 6 V15 H4 V6 A1 1 0 0 1 5 5 Z M2 15 H22 L21 18.5 H3 Z",
  celular: "M8 2.5 H16 A2 2 0 0 1 18 4.5 V19.5 A2 2 0 0 1 16 21.5 H8 A2 2 0 0 1 6 19.5 V4.5 A2 2 0 0 1 8 2.5 Z M11 18.5 H13",
  calendario: "M4 6 H20 V20 H4 Z M4 10 H20 M8 3.5 V7.5 M16 3.5 V7.5 M7.5 13.5 H9.5 M11 13.5 H13 M14.5 13.5 H16.5 M7.5 16.5 H9.5 M11 16.5 H13",
  check: "M4.5 12.5 L9.5 17.5 L19.5 6.5",
  lista: "M9 6 H20 M9 12 H20 M9 18 H20 M3.5 6 L4.8 7.3 L7 4.8 M3.5 12 L4.8 13.3 L7 10.8 M3.5 18 L4.8 19.3 L7 16.8",
  pessoa: "M12 11 A4 4 0 1 0 12 3 A4 4 0 1 0 12 11 Z M4.5 21 C4.5 16.5 8 14 12 14 C16 14 19.5 16.5 19.5 21",
  pessoas: "M9 10.5 A3.5 3.5 0 1 0 9 3.5 A3.5 3.5 0 1 0 9 10.5 Z M2.5 20 C2.5 16 5.5 13.5 9 13.5 C12.5 13.5 15.5 16 15.5 20 M16 4 A3 3 0 0 1 16 10 M18 13.8 C20.3 14.6 21.5 16.8 21.5 19.5",
  casa: "M3.5 11 L12 4 L20.5 11 M5.5 9.5 V20 H18.5 V9.5 M10 20 V14.5 H14 V20",
  coracao: "M12 20 C5 15.5 2.5 12 2.5 8.5 C2.5 5.8 4.6 4 7 4 C9 4 10.8 5.2 12 7 C13.2 5.2 15 4 17 4 C19.4 4 21.5 5.8 21.5 8.5 C21.5 12 19 15.5 12 20 Z",
  grafico: "M4 20 V4 M4 20 H20 M8 16 V12 M12 16 V8 M16 16 V10",
  alvo: "M12 21 A9 9 0 1 0 12 3 A9 9 0 1 0 12 21 Z M12 16.5 A4.5 4.5 0 1 0 12 7.5 A4.5 4.5 0 1 0 12 16.5 Z M12 12.6 A0.6 0.6 0 1 0 12 11.4 A0.6 0.6 0 1 0 12 12.6 Z",
  lampada: "M9 17.5 H15 M10 20.5 H14 M12 3 C8.4 3 6 5.6 6 8.8 C6 11 7.2 12.4 8.4 13.6 C9 14.2 9.3 15 9.3 15.8 V17.5 H14.7 V15.8 C14.7 15 15 14.2 15.6 13.6 C16.8 12.4 18 11 18 8.8 C18 5.6 15.6 3 12 3 Z",
  relogio: "M12 21 A9 9 0 1 0 12 3 A9 9 0 1 0 12 21 Z M12 7 V12 L15.5 14",
  estrela: "M12 3 L14.7 8.6 L20.8 9.4 L16.3 13.6 L17.5 19.7 L12 16.7 L6.5 19.7 L7.7 13.6 L3.2 9.4 L9.3 8.6 Z",
  seta: "M4 12 H19 M13.5 6.5 L19 12 L13.5 17.5",
  cursor: "M5 3 L5 18.5 L9.2 14.6 L12 20.5 L14.6 19.3 L11.8 13.5 L17.5 13.2 Z",
  conversa: "M4 5 H20 V15 H11 L6.5 19 V15 H4 Z M8 9 H16 M8 12 H13",
  poltrona: "M6 11 V7 A2 2 0 0 1 8 5 H16 A2 2 0 0 1 18 7 V11 M4 11 A2 2 0 0 1 6 13 V15 H18 V13 A2 2 0 0 1 20 11 V18 H4 Z M6 18 V20 M18 18 V20",
  livro: "M12 6.5 C10 5 7 4.5 3.5 5 V18.5 C7 18 10 18.5 12 20 C14 18.5 17 18 20.5 18.5 V5 C17 4.5 14 5 12 6.5 Z M12 6.5 V20",
  ferramenta: "M14.5 5.5 A4 4 0 0 0 9.4 10.6 L3.5 16.5 L7.5 20.5 L13.4 14.6 A4 4 0 0 0 18.5 9.5 L16 12 L12 8 Z",
  foguete: "M12 2.5 C15.5 5 16.5 9 16 13.5 L12 17 L8 13.5 C7.5 9 8.5 5 12 2.5 Z M8 13.5 L5 16.5 L8 17 M16 13.5 L19 16.5 L16 17 M10.5 19.5 L12 21.5 L13.5 19.5 M12 9.5 A1.5 1.5 0 1 0 12 6.5 A1.5 1.5 0 1 0 12 9.5 Z",
  escudo: "M12 3 L19.5 6 V11.5 C19.5 16 16.3 19.3 12 21 C7.7 19.3 4.5 16 4.5 11.5 V6 Z M8.5 12 L11 14.5 L15.5 9.5",
  lupa: "M10.5 17.5 A7 7 0 1 0 10.5 3.5 A7 7 0 1 0 10.5 17.5 Z M15.5 15.5 L21 21",
  engrenagem:
    "M12 15.2 A3.2 3.2 0 1 0 12 8.8 A3.2 3.2 0 1 0 12 15.2 Z M12 2.8 L13.4 5.3 L16.2 4.6 L16.8 7.4 L19.6 8.1 L18.8 10.8 L21 12.6 L18.8 14.4 L19.4 17.2 L16.6 17.8 L15.8 20.5 L13.2 19.6 L11.4 21.5 L10 19.2 L7.2 19.8 L6.8 17 L4.1 16.1 L5.2 13.5 L3 11.7 L5.3 10 L4.8 7.2 L7.6 6.8 L8.6 4.1 L11.1 5.1 Z",
  bandeira: "M5 21 V3.5 M5 4 H18 L15.5 8 L18 12 H5",
  chave: "M8 15.5 A3.5 3.5 0 1 0 8 8.5 A3.5 3.5 0 1 0 8 15.5 Z M11.5 12 H21 M18 12 V15 M15 12 V14",
  cadeado: "M6 10.5 H18 V20.5 H6 Z M8.5 10.5 V7.5 A3.5 3.5 0 0 1 15.5 7.5 V10.5 M12 14 V17",
  mundo: "M12 21 A9 9 0 1 0 12 3 A9 9 0 1 0 12 21 Z M3 12 H21 M12 3 C9.5 5.5 8.5 8.5 8.5 12 C8.5 15.5 9.5 18.5 12 21 M12 3 C14.5 5.5 15.5 8.5 15.5 12 C15.5 15.5 14.5 18.5 12 21",
  megafone: "M3.5 10 V14 H7 L15 18.5 V5.5 L7 10 Z M7 14 L8.5 20 H11 L9.8 14.8 M18 9 C19.2 10.2 19.2 13.8 18 15",
  etiqueta: "M3 11.5 L11.5 3 H20.5 V12 L12 20.5 Z M16.6 6.9 m -1.4 0 a 1.4 1.4 0 1 0 2.8 0 a 1.4 1.4 0 1 0 -2.8 0",
  predio: "M4 21 V5 H14 V21 M14 9 H20 V21 M3 21 H21 M7 8.5 H8.5 M10 8.5 H11.5 M7 12 H8.5 M10 12 H11.5 M7 15.5 H8.5 M10 15.5 H11.5 M16.5 12.5 H17.5 M16.5 16 H17.5",
  berco: "M4 9 V19 M20 9 V19 M4 12 H20 M4 17 H20 M8 12 V17 M12 12 V17 M16 12 V17 M4 19 L3 21 M20 19 L21 21",
  tenda: "M2.5 20 L12 4 L21.5 20 Z M12 4 V20 M9 20 L12 14 L15 20",
  corda: "M3 6 C7 6 7 12 12 12 C17 12 17 18 21 18",
  estaca: "M12 3 V15 L10 21 M12 15 L14 21 M8.5 3 H15.5",
  plataforma: "M3 15 L12 19.5 L21 15 L12 10.5 Z M3 15 V17.5 L12 22 L21 17.5 V15",
  mao: "M7 12 V6.5 A1.5 1.5 0 0 1 10 6.5 V11 M10 10 V4.5 A1.5 1.5 0 0 1 13 4.5 V10 M13 10 V5.5 A1.5 1.5 0 0 1 16 5.5 V11 M16 11 V8.5 A1.5 1.5 0 0 1 19 8.5 V14 C19 18 16.5 21 12.5 21 C9.5 21 7.8 19.6 6.3 17.3 L4 13.6 A1.5 1.5 0 0 1 6.4 11.8 L7 12.6",
  mais: "M12 5 V19 M5 12 H19",
  menos: "M5 12 H19",
  xis: "M6 6 L18 18 M18 6 L6 18",
} as const;

export type NomeDoIcone = keyof typeof ICONES;

export const Icone: React.FC<{ nome: NomeDoIcone; tamanho?: number; cor?: string; espessura?: number; progresso?: number; style?: React.CSSProperties }> = ({
  nome,
  tamanho = 64,
  cor = MARCA.destaque,
  espessura = 1.6,
  progresso = 1,
  style,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, overflow: "visible", ...style }}>
    <path d={ICONES[nome]} fill="none" stroke={cor} strokeWidth={espessura} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, Math.max(0, progresso))} />
  </svg>
);
