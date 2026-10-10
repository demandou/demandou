// Peças de papel comuns aos documentos dos blocos universais: o documento que desliza pela mesa,
// o cartão de arquivo com a tarja vermelha e o cabeçalho pré-impresso, a tachinha e o esboço "a lápis".
import { entra as entraEasing, prog, saindo } from "../anim";
import { cor, mono, rotulo as estiloRotulo, sombraPapel } from "../tema";

// Documento que entra deslizando pela mesa (da direita) e sai empurrado para a esquerda, opaco:
// o que entra passa por cima do que sai (como uma cortina), nunca dois textos transparentes juntos.
export const Deslizar: React.FC<{ t: number; de: number; fim: number; children: React.ReactNode; distancia?: number }> = ({
  t,
  de,
  fim,
  children,
  distancia = 760,
}) => {
  const e = prog(t, de, 0.6, entraEasing);
  const s = saindo(t, fim, 0.32);
  if (s >= 1) return null;
  return <div style={{ position: "absolute", inset: 0, translate: `${(1 - e) * distancia - s * 1150}px 0` }}>{children}</div>;
};

// Cartão de arquivo: papel claro, sombra de papel, tarja vermelha no alto e (opcional) um
// cabeçalho pré-impresso em máquina de escrever com as três casinhas do formulário.
export const Cartao: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  tarja?: boolean;
  cabecalho?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, rot = 0, tarja = true, cabecalho, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      background: cor.cartao,
      boxShadow: sombraPapel,
      rotate: `${rot}deg`,
      ...style,
    }}
  >
    {tarja ? <div style={{ height: 10, background: cor.vermelho }} /> : null}
    {cabecalho ? (
      <div style={{ padding: "22px 30px 0" }}>
        <div style={{ ...estiloRotulo, fontSize: 30, color: cor.tinta, display: "flex", justifyContent: "space-between", gap: 20 }}>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{cabecalho}</span>
          <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: 12, height: 12, border: `2px solid ${cor.tinta}`, background: k === 0 ? cor.tinta : "transparent" }} />
            ))}
          </span>
        </div>
        <div style={{ height: 2, background: cor.tinta, marginTop: 16 }} />
      </div>
    ) : null}
    {children}
  </div>
);

// Tachinha vermelha que prende a ficha na folha (aparece com `p` de 0 a 1)
export const Tachinha: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x - 13,
        top: y - 13,
        width: 26,
        height: 26,
        borderRadius: 13,
        background: cor.vermelho,
        boxShadow: "0 3px 5px rgba(21,21,21,0.3)",
        scale: String(0.4 + 0.6 * p),
        opacity: p,
      }}
    />
  );

// Número de formulário ("01", "02"…): cinza a lápis antes de ser dito, vermelho depois
export const NumeroDoItem: React.FC<{ n: number; aceso: number; tamanho?: number }> = ({ n, aceso, tamanho = 34 }) => (
  <span
    style={{
      fontFamily: mono,
      fontWeight: 700,
      fontSize: tamanho,
      lineHeight: 1,
      letterSpacing: "0.04em",
      color: aceso > 0.5 ? cor.vermelho : cor.grafite,
      opacity: 0.45 + 0.55 * aceso,
    }}
  >
    {String(n).padStart(2, "0")}
  </span>
);

// Tamanho do texto mono que cabe numa largura (Courier Prime: 0,6 do corpo por caractere)
export const corpoMono = (texto: string, largura: number, max: number, min = 30) =>
  Math.max(min, Math.min(max, Math.floor(largura / (Math.max(1, texto.length) * 0.6 * 1.03))));
