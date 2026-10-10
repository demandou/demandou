import { mono, sans } from "../tema";

export type TextoDeValor = { prefixo?: string; numero: string; sufixo?: string };

const MENOR = 0.52;
// largura aproximada em "em": dígitos mono ≈ 0,58 do corpo; moeda e unidade saem menores
const larguraEmEm = (v: TextoDeValor) =>
  (v.numero.length + MENOR * ((v.prefixo ?? "").length + (v.sufixo ?? "").length)) * 0.58 + (/^\s*\p{L}/u.test(v.sufixo ?? "") ? 0.2 : 0);

// Maior corpo (até `maximo`) em que o valor cabe na largura.
export const corpoQueCabe = (v: TextoDeValor, largura: number, maximo: number) =>
  Math.min(maximo, Math.floor(largura / Math.max(0.5, larguraEmEm(v))));

// Número grande de painel: os dígitos no corpo cheio; "R$" e "%" menores e mais apagados,
// alinhados pela base — o olho vai direto para o número.
export const Valor: React.FC<{ v: TextoDeValor; tamanho: number; cor: string; corUnidade?: string }> = ({
  v,
  tamanho,
  cor,
  corUnidade,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      fontFamily: mono,
      fontWeight: 500,
      lineHeight: 1,
      letterSpacing: "-0.03em",
      color: cor,
      whiteSpace: "nowrap",
    }}
  >
    {v.prefixo?.trim() ? (
      <span style={{ fontSize: tamanho * MENOR, marginRight: tamanho * 0.14, color: corUnidade ?? cor, opacity: corUnidade ? 1 : 0.72 }}>
        {v.prefixo.trim()}
      </span>
    ) : null}
    <span style={{ fontSize: tamanho }}>{v.numero}</span>
    {v.sufixo?.trim() ? (
      <span
        style={{
          fontSize: tamanho * MENOR,
          // unidade em palavra ("lata", "mil", "kg") ganha o espaço de uma palavra; "%" fica colado
          marginLeft: tamanho * (/^\s*\p{L}/u.test(v.sufixo) ? 0.2 : 0.06),
          fontFamily: /^\s*\p{L}/u.test(v.sufixo) ? sans : undefined,
          fontWeight: /^\s*\p{L}/u.test(v.sufixo) ? 500 : undefined,
          letterSpacing: /^\s*\p{L}/u.test(v.sufixo) ? "0em" : undefined,
          color: corUnidade ?? cor,
          opacity: corUnidade ? 1 : 0.72,
        }}
      >
        {v.sufixo.trim()}
      </span>
    ) : null}
  </div>
);
