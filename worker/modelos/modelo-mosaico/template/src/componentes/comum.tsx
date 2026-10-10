import { limitar, PalavraQueEncaixa, prog, temposDoTexto, indicesDoTrecho } from "../anim";
import type { Fonte } from "../medida";
import type { Palavra } from "../plano";
import { sans, type paleta } from "../tema";

export type Paleta = (typeof paleta)[keyof typeof paleta];

// O que todo bloco recebe para se desenhar
export type PropsBloco<B> = {
  b: B;
  t: number;
  // tamanho do conteúdo (px)
  w: number;
  h: number;
  // altura útil para texto, a partir do topo do bloco (acima da interface do app)
  util: number;
  pal: Paleta;
  palavras: Palavra[];
  // de quando até quando este conteúdo fica no bloco (para achar as palavras faladas)
  janela: { de: number; ate: number };
  marca: { nome: string; area: string };
};

// Respiro interno do bloco, proporcional ao tamanho (blocos pequenos respiram menos)
export const respiro = (w: number, h: number) => Math.round(limitar(Math.min(w, h) * 0.085, 26, 50));

// Linhas de texto em que cada palavra se encaixa no lugar quando é dita.
export const TextoFalado: React.FC<{
  linhas: string[];
  t: number;
  palavras: Palavra[];
  janela: { de: number; ate: number };
  tamanho: number;
  cor: string;
  corEnfase?: string;
  enfase?: string;
  estilo?: React.CSSProperties;
  alinhamento?: "left" | "center";
  entrada?: number;
  // quando o texto começa a ser dito (padrão: o início da janela)
  inicio?: number;
  entrelinha?: number;
}> = ({ linhas, t, palavras, janela, tamanho, cor, corEnfase, enfase, estilo, alinhamento = "left", entrada = 0.42, inicio, entrelinha = 1.04 }) => {
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(todas.join(" "), palavras, inicio ?? janela.de, janela.ate);
  const marcadas = indicesDoTrecho(todas, enfase);
  let cursor = 0;
  return (
    <div style={{ textAlign: alinhamento }}>
      {linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const primeira = cursor;
        cursor += ws.length;
        return (
          <div key={li} style={{ whiteSpace: "nowrap", fontSize: tamanho, lineHeight: entrelinha, color: cor, ...estilo }}>
            {ws.map((w, k) => (
              <PalavraQueEncaixa
                key={k}
                w={w}
                p={prog(t, tempos[primeira + k], entrada)}
                ultima={k === ws.length - 1}
                style={marcadas.has(primeira + k) ? { color: corEnfase } : undefined}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ——— peças comuns aos blocos ———

// fontes usadas na medida (src/medida.ts) — iguais às do desenho
export const F_TITULO: Fonte = { familia: "display", peso: 700, espacamento: -0.025 };
export const F_NUMERO: Fonte = { familia: "display", peso: 800, espacamento: -0.04 };
export const F_ITEM: Fonte = { familia: "display", peso: 700, espacamento: -0.015 };
export const F_APOIO: Fonte = { familia: "sans", peso: 600 };
export const F_ROTULO: Fonte = { familia: "sans", peso: 700, espacamento: 0.14, caixaAlta: true };

// o bloco é claro (texto escuro)?
export const ehClaro = (pal: Paleta) => pal.texto.toUpperCase() !== "#F8F3E9";

// traço "a lápis" (esboço tracejado) na cor do texto do bloco, apagando com `p` (0 = esboço cheio)
export const lapis = (pal: Paleta, p = 0) =>
  `${ehClaro(pal) ? `rgba(38,40,33,${(0.3 * (1 - p)).toFixed(3)})` : `rgba(255,250,240,${(0.34 * (1 - p)).toFixed(3)})`}`;

// Etiqueta "ilustrativo": forma sem números ditos (fica no canto do bloco)
export const Ilustrativo: React.FC<{ pal: Paleta; p: number; style?: React.CSSProperties }> = ({ pal, p, style }) => (
  <div
    style={{
      position: "absolute",
      fontFamily: sans,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      lineHeight: 1,
      padding: "10px 16px 9px",
      borderRadius: 14,
      color: pal.suave,
      boxShadow: `inset 0 0 0 2.5px ${pal.suave}`,
      opacity: p,
      ...style,
    }}
  >
    ilustrativo
  </div>
);

// Pastilha: o ladrilho pequeno que marca um item (o mosaico dentro do mosaico)
export const Pastilha: React.FC<{ tamanho: number; cor: string; p: number; esboco: string }> = ({ tamanho, cor, p, esboco }) => (
  <div style={{ position: "relative", width: tamanho, height: tamanho, flexShrink: 0 }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: tamanho * 0.26, outline: `2.5px dashed ${esboco}`, outlineOffset: -2, opacity: 1 - p }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: tamanho * 0.26,
        background: cor,
        scale: String(0.55 + 0.45 * p),
        opacity: p,
      }}
    />
  </div>
);

// As linhas escritas à mão (`quebra`, ou o nome antigo `linhas` com textos), se houver
export const quebraManual = (b: object): string[] | null => {
  const x = b as { quebra?: unknown; linhas?: unknown };
  const lista = Array.isArray(x.quebra) ? x.quebra : Array.isArray(x.linhas) ? x.linhas : null;
  return lista && lista.length && lista.every((l) => typeof l === "string") ? (lista as string[]) : null;
};
