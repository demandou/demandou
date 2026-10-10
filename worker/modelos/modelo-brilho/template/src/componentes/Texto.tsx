// Texto falado em linhas: mede (src/medida.ts), quebra, reduz até caber e monta palavra por palavra
// no tempo da fala. Serve a todos os blocos: o texto do aluno sempre cabe no lugar dele.
import { Palavras, temposDoTexto } from "../anim";
import { encaixar, type Peso, trechoNoTexto } from "../medida";
import type { Palavra } from "../plano";

export type Medida = { tamanho: number; linhas: string[] };

export const medir = (texto: string, largura: number, max: number, min: number, linhas = 2, peso: Peso = 600): Medida =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso } });

// Tempos das palavras do texto, começando em `inicio` (o `em` do bloco) e nunca antes de `desde`
export const temposFalados = (texto: string, palavras: Palavra[], inicio: number, ate: number, desde = -Infinity) =>
  temposDoTexto(texto, palavras, inicio, ate, inicio).map((x) => Math.max(x, desde));

export const TextoFalado: React.FC<{
  texto: string;
  medida: Medida;
  tempos: number[];
  t: number;
  peso?: Peso;
  entrelinha?: number;
  alinhar?: "flex-start" | "center" | "flex-end";
  cor?: string;
  // trecho que ganha a faixa passada por trás
  destaque?: string;
  faixa?: { cor: string; texto: string };
  // trecho riscado a partir de `em`
  risco?: { trecho?: string; em: number; cor: string };
  // peso das linhas que têm palavra em destaque
  pesoDestaque?: Peso;
  style?: React.CSSProperties;
}> = ({ texto, medida, tempos, t, peso = 600, entrelinha = 1.14, alinhar = "flex-start", cor, destaque, faixa, risco, pesoDestaque, style }) => {
  const marcado = destaque && faixa ? trechoNoTexto(texto, destaque) : null;
  const riscado = risco?.trecho ? trechoNoTexto(texto, risco.trecho) : null;
  let cursor = 0;
  return (
    <div style={{ color: cor, ...style }}>
      {medida.linhas.map((linha, j) => {
        const n = linha.split(/\s+/).filter(Boolean).length;
        const a = cursor;
        cursor += n;
        const local = (r: [number, number] | null) => {
          if (!r) return null;
          const de = Math.max(r[0], a) - a;
          const ate = Math.min(r[1], a + n - 1) - a;
          return de <= ate ? ([de, ate] as [number, number]) : null;
        };
        const lm = local(marcado);
        const lr = local(riscado);
        const marcadas = lm ? Array.from({ length: lm[1] - lm[0] + 1 }, (_, k) => lm[0] + k) : undefined;
        // o risco anda pelas linhas na ordem: cada linha começa quando a anterior termina
        const antes = riscado ? Math.max(0, Math.min(a, riscado[1] + 1) - riscado[0]) : 0;
        return (
          <Palavras
            key={j}
            texto={linha}
            tempos={tempos.slice(a, a + n)}
            t={t}
            marcadas={marcadas}
            faixa={lm ? faixa : undefined}
            risco={lr && risco ? { de: lr[0], ate: lr[1], em: risco.em + antes * 0.16, cor: risco.cor, dur: (lr[1] - lr[0] + 1) * 0.16 } : undefined}
            style={{
              justifyContent: alinhar,
              fontSize: medida.tamanho,
              fontWeight: lm && pesoDestaque ? pesoDestaque : peso,
              lineHeight: entrelinha,
              height: medida.tamanho * entrelinha,
            }}
          />
        );
      })}
    </div>
  );
};

// Altura de um texto medido
export const alturaDe = (m: Medida, entrelinha = 1.14) => m.linhas.length * m.tamanho * entrelinha;
