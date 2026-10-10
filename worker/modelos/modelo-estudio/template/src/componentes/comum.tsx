// Peças comuns dos blocos do Estúdio: o rótulo mono com o fio, a etiqueta ILUSTRATIVO, a entrada e a
// saída dos textos embaixo (ou em cima) do quadro e os ícones do botão do fechamento.
import { prog, saindo } from "../anim";
import { cor, rotulo } from "../tema";

// Rótulo de estúdio em mono, com um fio até a borda ("PERGUNTA ————").
export const Rotulo: React.FC<{ nome: string; aceso?: number; cor?: string; direita?: React.ReactNode }> = ({ nome, aceso = 1, cor: c, direita }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 20, height: 40 }}>
    <span
      style={{
        ...rotulo,
        fontSize: 32,
        lineHeight: 1.3,
        color: aceso > 0.5 ? (c ?? cor.textoSuave) : cor.apagado,
        whiteSpace: "nowrap",
        // título comprido: corta com reticências antes do contador (nunca passa por cima)
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0,
        flexShrink: 1,
      }}
    >
      {nome}
    </span>
    <div style={{ flex: 1, minWidth: 24, height: 2, background: cor.borda }} />
    {direita}
  </div>
);

// Etiqueta "ILUSTRATIVO": quando o desenho não vem de números ditos.
export const Ilustrativo: React.FC<{ opacidade?: number }> = ({ opacidade = 1 }) => (
  <div
    style={{
      height: 44,
      padding: "0 14px",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      boxShadow: `inset 0 0 0 2px ${cor.apagadoForte}`,
      opacity: opacidade,
    }}
  >
    <span style={{ ...rotulo, fontSize: 30, color: cor.textoSuave }}>Ilustrativo</span>
  </div>
);

// Entrada e saída dos blocos de texto que dividem a faixa embaixo do quadro: o que sai some inteiro
// até o fim do momento; o que entra só aparece depois (nunca dois textos um sobre o outro). Sobe
// decidido e assenta.
// `atraso`: quando o quadro chega de baixo (passos, gráfico), o texto espera ele passar pela faixa.
export const faixa = (t: number, de: number, fim: number, atraso = 0.04) => {
  const entra = prog(t, de + atraso, 0.38);
  const sai = saindo(t, fim + 0.02, 0.2);
  return { opacidade: entra * (1 - sai), dy: (1 - entra) * 44 + 20 * sai, entra, sai };
};

// Ícones do botão do fechamento (traço, na cor do texto do botão)
export const IconeDoBotao: React.FC<{ nome: "salvar" | "seguir" | "comentar" | "link"; tam: number; cor: string }> = ({ nome, tam, cor: c }) => {
  const s = { fill: "none", stroke: c, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...s} /> : null}
      {nome === "seguir" ? (
        <>
          <path d="M12 5v14M5 12h14" {...s} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5.5h16v10H10l-4.5 3.8V15.5H4z" {...s} /> : null}
      {nome === "link" ? (
        <>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2" {...s} />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2" {...s} />
        </>
      ) : null}
    </svg>
  );
};

// Triângulo de alerta desenhado (sem emoji)
export const Alerta: React.FC<{ tam: number; cor: string }> = ({ tam, cor: c }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
    <path d="M12 3 L22 20.5 H2 Z" fill="none" stroke={c} strokeWidth={2.4} strokeLinejoin="round" />
    <path d="M12 9.5 V14" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
    <circle cx={12} cy={17.2} r={1.5} fill={c} />
  </svg>
);

// ——— cartões de entrevista (pergunta/resposta, pauta, comparação) ———
// Um cartão sobe de baixo, opaco, cobrindo o que estava ali, e desce no fim. Antes de descer, o texto
// dele some (o cartão desce vazio: nunca dois textos um sobre o outro). Quando um cartão encosta em
// outro, eles não se cruzam: o texto do que sai some, o cartão troca no lugar e o texto do novo acende.
export const TIPOS_DE_CARTAO = ["pergunta", "resposta", "topicos", "comparacao"];
export const ritmoDoCartao = (t: number, de: number, fim: number, antes: boolean, depois: boolean) => {
  const troca = 0.12;
  const sobe = antes ? (t >= de - troca ? 1 : 0) : prog(t, de - 0.12, 0.5);
  // desce rápido (0,3 s), já vazio: o que entra no lugar aparece logo depois
  const desce = depois ? (t >= fim - troca ? 1 : 0) : saindo(t, fim + 0.1, 0.3);
  // o texto (a lápis) só aparece quando o cartão já cobriu o que estava ali
  const entraTexto = antes ? prog(t, de, 0.25) : prog(t, de - 0.06, 0.22);
  const saiTexto = depois ? saindo(t, fim - troca, 0.16) : saindo(t, fim - 0.02, 0.18);
  return { sobe, desce, texto: entraTexto * (1 - saiTexto) };
};
