// Peças pequenas do pacote gráfico, usadas por vários painéis: o selo "ilustrativo" (forma sem
// números ditos), o quadrado do marcador e a tarja branca que varre da esquerda.
import { limitar, varredura } from "../anim";
import { cor, rotulo } from "../tema";

// "ILUSTRATIVO": contorno azul-claro, caixa-alta espaçada. Aparece sempre que a forma não vem de
// números ditos (tendência, encolher, linhas sem eixo).
export const Ilustrativo: React.FC<{ p?: number; style?: React.CSSProperties }> = ({ p = 1, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: 46,
      padding: "0 14px",
      border: `3px solid rgba(169,195,255,0.6)`,
      opacity: limitar(p),
      ...style,
    }}
  >
    <div style={{ ...rotulo, fontSize: 30, letterSpacing: "0.08em", color: cor.celeste, translate: "0 1px" }}>Ilustrativo</div>
  </div>
);

// Quadrado do marcador: tracejado "a lápis" até ser dito; o azul elétrico varre da esquerda e o
// conteúdo (número, letra, símbolo) aparece quando o fundo já abriu.
export const Quadrado: React.FC<{ p: number; tamanho: number; children?: React.ReactNode; corCheia?: string }> = ({ p, tamanho, children, corCheia = cor.eletrico }) => (
  <div style={{ position: "relative", width: tamanho, height: tamanho, flexShrink: 0, border: `4px dashed ${cor.apagadoNoAzul}` }}>
    <div
      style={{
        position: "absolute",
        inset: -4,
        background: corCheia,
        clipPath: varredura(p),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ opacity: limitar((p - 0.4) / 0.4), display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  </div>
);
