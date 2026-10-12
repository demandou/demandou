// Texto à mão de qualquer tamanho para os blocos universais: medido de verdade (canvas, com a fonte
// já carregada), quebrado em até N linhas no maior corpo que cabe, cada palavra passada a tinta na
// sua fala; `destaque` pinta um trecho e `risco` risca outro a vermelhão quando é dito.
import { normalizar, temposDoTexto } from "../anim";
import { ajustar } from "../medir";
import type { Palavra } from "../plano";
import { LinhaAMao, type PalavraNoTempo } from "../tinta/Escrita";
import { cor as paleta } from "../tema";

export type TextoPronto = { corpo: number; linhas: PalavraNoTempo[][]; altura: number; inicio: number; fim: number; entrelinha: number };

// acha a sequência de palavras `trecho` dentro de `palavras` (sem acento nem pontuação)
const indices = (palavras: string[], trecho?: string) => {
  const alvo = (trecho ?? "").split(/\s+/).map(normalizar).filter(Boolean);
  const saida = new Set<number>();
  if (!alvo.length) return saida;
  const norm = palavras.map(normalizar);
  for (let i = 0; i + alvo.length <= norm.length; i++) {
    if (alvo.every((a, k) => norm[i + k] === a)) {
      for (let k = 0; k < alvo.length; k++) saida.add(i + k);
      break;
    }
  }
  return saida;
};

export const prepararTexto = (o: {
  texto: string;
  larguraMax: number;
  max: number;
  min: number;
  linhas?: number;
  palavras: Palavra[];
  de: number;
  ate: number;
  // nada é escrito antes disto (a folha ainda chegando)
  inicio: number;
  // quando o texto começa a ser dito (padrão: `de`)
  em?: number;
  destaque?: string;
  corDestaque?: string;
  cor?: string;
  risco?: string;
  riscoEm?: number;
  entrelinha?: number;
}): TextoPronto => {
  const { corpo, linhas } = ajustar(o.texto, o.larguraMax, o.max, o.min, o.linhas ?? 3);
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(todas.join(" "), o.palavras, o.em ?? o.de, o.ate, Math.max(o.inicio, o.em ?? 0));
  const marcadas = indices(todas, o.destaque);
  const riscadas = indices(todas, o.risco);
  // o risco anda palavra a palavra a partir de `riscoEm` (padrão: quando a primeira palavra riscada é escrita)
  const ordemRisco = [...riscadas].sort((a, b) => a - b);
  const riscoInicio = o.riscoEm ?? (ordemRisco.length ? tempos[ordemRisco[0]] : 0);
  const entrelinha = o.entrelinha ?? 1.12;
  let k = 0;
  const porLinha = linhas.map((l) =>
    l
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => {
        const i = k++;
        const r = ordemRisco.indexOf(i);
        return {
          w,
          em: tempos[i] ?? 0,
          cor: marcadas.has(i) ? (o.corDestaque ?? paleta.azul) : o.cor,
          riscoEm: r >= 0 ? Math.max(riscoInicio + r * 0.14, (tempos[i] ?? 0) + 0.25) : undefined,
        };
      }),
  );
  return { corpo, linhas: porLinha, altura: porLinha.length * corpo * entrelinha, inicio: tempos[0] ?? o.de, fim: tempos[tempos.length - 1] ?? o.de, entrelinha };
};

export const TextoAMao: React.FC<{ pronto: TextoPronto; t: number; alinhar?: "flex-start" | "center" | "flex-end"; esboco?: number }> = ({ pronto, t, alinhar = "flex-start", esboco = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar }}>
    {pronto.linhas.map((ps, i) => (
      <div key={i} style={{ height: pronto.corpo * pronto.entrelinha }}>
        <LinhaAMao palavras={ps} t={t} corpo={pronto.corpo} alinhar={alinhar} esboco={esboco} />
      </div>
    ))}
  </div>
);
