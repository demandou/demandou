// Ícones a traço, genéricos (viewBox 48×48, traço único, pontas redondas). Nada que lembre o
// logotipo de um produto. `p` desenha o traço de 0 a 1 (para ícones que se desenham na tela).
import type { Icone as NomeDoIcone } from "../plano";

type Desenho = { tracos: string[]; cheios?: string[] };

export type Utilitario = "salvar" | "salvo" | "enviar" | "seta" | "check" | "seguir" | "link" | "pergunta" | "x" | "sobe" | "cai";

export const DESENHOS: Record<NomeDoIcone | Utilitario, Desenho> = {
  // crachá: quem a IA deve ser
  cracha: {
    tracos: [
      "M15 9h18a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5z",
      "M20 9V5h8v4",
      "M24 25.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
      "M15.5 37c1.8-4.6 5-6.8 8.5-6.8s6.7 2.2 8.5 6.8",
    ],
  },
  // lista com vistos: a tarefa
  lista: {
    tracos: ["M9 13l3.5 3.5L19 10", "M25 13.5h14", "M9 25l3.5 3.5L19 22", "M25 25.5h14", "M10 37.5h7", "M25 37.5h14"],
  },
  // alfinete: o contexto (de onde você parte)
  alfinete: {
    tracos: ["M24 43s-13-11.5-13-22a13 13 0 0 1 26 0c0 10.5-13 22-13 22z", "M24 26a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"],
  },
  // tabela: o formato da resposta
  tabela: {
    tracos: ["M12 9h24a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z", "M8 19h32", "M8 29h32", "M20 9v30"],
  },
  balao: {
    tracos: ["M10 12h28a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H22l-8 7v-7h-4a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3z", "M16 21h16", "M16 26.5h10"],
  },
  pessoas: {
    tracos: [
      "M18 23a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
      "M7 39c1.6-6 5.6-9 11-9s9.4 3 11 9",
      "M31 22a5 5 0 1 0 0-10",
      "M34 29.5c3.6.9 6 3.7 7 8.5",
    ],
  },
  alvo: {
    tracos: ["M24 41a17 17 0 1 0 0-34 17 17 0 0 0 0 34z", "M24 32a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"],
    cheios: ["M24 27a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  },
  documento: {
    tracos: ["M13 6h15l9 9v24a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z", "M28 6v9h9", "M16 24h16", "M16 31h11"],
  },
  regua: {
    tracos: ["M7 31L31 7l10 10-24 24z", "M14 24l3 3", "M19 19l4 4", "M24 14l3 3", "M29 9l4 4"],
  },
  relogio: {
    tracos: ["M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36z", "M24 14v10l7 4"],
  },
  lampada: {
    tracos: ["M18 34h12", "M19.5 40h9", "M18 34c0-5-6-8-6-15a12 12 0 0 1 24 0c0 7-6 10-6 15"],
  },
  sol: {
    tracos: [
      "M24 31a7 7 0 1 0 0-14 7 7 0 0 0 0 14z",
      "M24 6v4",
      "M24 38v4",
      "M6 24h4",
      "M38 24h4",
      "M11.3 11.3l2.8 2.8",
      "M33.9 33.9l2.8 2.8",
      "M36.7 11.3l-2.8 2.8",
      "M14.1 33.9l-2.8 2.8",
    ],
  },
  alerta: {
    tracos: ["M21.4 9.5a3 3 0 0 1 5.2 0l15 26a3 3 0 0 1-2.6 4.5H9a3 3 0 0 1-2.6-4.5z", "M24 19v9"],
    cheios: ["M24 35.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z"],
  },
  chave: {
    tracos: ["M16 32a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M24 24h17", "M35 24v6", "M41 24v5"],
  },
  grafico: {
    tracos: ["M8 8v32h32", "M14 32l8-9 6 5 11-13"],
  },
  moeda: {
    tracos: ["M24 41a17 17 0 1 0 0-34 17 17 0 0 0 0 34z", "M29.5 18.5c-1.2-1.7-3.2-2.6-5.5-2.6-3.1 0-5.4 1.7-5.4 4.1 0 5.6 11 2.6 11 8.2 0 2.5-2.4 4.2-5.6 4.2-2.6 0-4.8-1.1-5.9-3", "M24 12.5v3.4", "M24 32.4v3.4"],
  },
  coracao: {
    tracos: ["M24 40S8 30.5 8 18.5a8 8 0 0 1 16-2.6 8 8 0 0 1 16 2.6C40 30.5 24 40 24 40z"],
  },
  casa: {
    tracos: ["M7 22.5L24 9l17 13.5", "M12 19.5V39h24V19.5", "M20.5 39V28.5h7V39"],
  },
  link: {
    tracos: ["M20 28l8-8", "M17.5 22.5l-4 4a6.4 6.4 0 0 0 9 9l4-4", "M30.5 25.5l4-4a6.4 6.4 0 0 0-9-9l-4 4"],
  },
  pergunta: {
    tracos: ["M24 42a18 18 0 1 0 0-36 18 18 0 0 0 0 36z", "M18.5 19a5.6 5.6 0 1 1 7.9 5.1c-1.5.7-2.4 1.8-2.4 3.4v1.3"],
    cheios: ["M24 35.6a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z"],
  },
  x: { tracos: ["M15 15l18 18", "M33 15L15 33"] },
  sobe: { tracos: ["M10 36L22 24l6 6 11-12", "M30 17h9v9"] },
  cai: { tracos: ["M10 14l12 12 6-6 11 12", "M30 33h9v-9"] },
  salvar: { tracos: ["M14 7h20a2 2 0 0 1 2 2v32l-12-9-12 9V9a2 2 0 0 1 2-2z"] },
  salvo: { tracos: ["M14 7h20a2 2 0 0 1 2 2v32l-12-9-12 9V9a2 2 0 0 1 2-2z"], cheios: ["M14 7h20a2 2 0 0 1 2 2v32l-12-9-12 9V9a2 2 0 0 1 2-2z"] },
  enviar: { tracos: ["M24 39V10", "M12 21l12-12 12 12"] },
  seta: { tracos: ["M9 24h28", "M27 13l11 11-11 11"] },
  check: { tracos: ["M10 25l9 9 19-20"] },
  seguir: { tracos: ["M20 23a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M7 40c1.8-6.4 6.6-9.6 13-9.6 3 0 5.6.7 7.6 2", "M36 27v12", "M30 33h12"] },
};

export const Icone: React.FC<{
  nome: keyof typeof DESENHOS;
  tamanho: number;
  cor: string;
  espessura?: number;
  p?: number;
  estilo?: React.CSSProperties;
}> = ({ nome, tamanho, cor, espessura = 3.4, p = 1, estilo }) => {
  const d = DESENHOS[nome];
  const parcial = p < 0.999;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ display: "block", overflow: "visible", ...estilo }}>
      {(d.cheios ?? []).map((c) => (
        <path key={c} d={c} fill={cor} opacity={p} />
      ))}
      {d.tracos.map((c) => (
        <path
          key={c}
          d={c}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={parcial ? 1 : undefined}
          strokeDasharray={parcial ? `${Math.max(0.001, p)} 1` : undefined}
        />
      ))}
    </svg>
  );
};

// ícone padrão de uma peça a partir do nome dela
export const iconeDaPeca = (nome: string, icone: NomeDoIcone | undefined, i: number): NomeDoIcone => {
  if (icone) return icone;
  const n = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/papel|persona|funcao|quem/.test(n)) return "cracha";
  if (/tarefa|pedido|acao|objetivo/.test(n)) return "lista";
  if (/contexto|cenario|situacao|sobre/.test(n)) return "alfinete";
  if (/formato|saida|estrutura/.test(n)) return "tabela";
  if (/tom|estilo|voz/.test(n)) return "balao";
  if (/publico|para quem/.test(n)) return "pessoas";
  if (/exemplo|modelo|referencia/.test(n)) return "documento";
  if (/limite|tamanho|restricao|regra/.test(n)) return "regua";
  if (/prazo|tempo|quando|minuto|hora|dia/.test(n)) return "relogio";
  if (/risco|perigo|alerta|erro|cuidado/.test(n)) return "alerta";
  if (/preco|dinheiro|custo|valor|moeda|lucro|grana|bolso/.test(n)) return "moeda";
  if (/mercado|grafico|dado|numero|resultado/.test(n)) return "grafico";
  if (/chave|segredo|criterio/.test(n)) return "chave";
  if (/saude|corpo|amor|relacao|cuidado/.test(n)) return "coracao";
  if (/casa|lar|imovel/.test(n)) return "casa";
  if (/ideia|dica/.test(n)) return "lampada";
  return (["cracha", "lista", "alfinete", "tabela"] as NomeDoIcone[])[i % 4];
};
