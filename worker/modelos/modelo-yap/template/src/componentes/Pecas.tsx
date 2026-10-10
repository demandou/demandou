// Peças comuns do Yap: o cartão claro que entra por máscara de baixo para cima, a etiqueta
// presa ao cartão, o marcador lima e a posição "ao lado do ombro" na altura do peito.
import type { Lado, Plano } from "../plano";
import { COR, FONTE, MARGEM, RAIO, SOMBRA_CARTAO, UI_DIREITA, medidas, prog, suave } from "../tema";
import { larguraTexto } from "../medida";

// x de uma peça de largura `w` no lado pedido (o lado direito respeita os botões do app)
export const xNoLado = (lado: Lado, w: number) =>
  lado === "esq" ? MARGEM : lado === "dir" ? Math.max(MARGEM, UI_DIREITA - w) : Math.round((1080 - w) / 2);

// a zona dos cartões (abaixo da legenda, até a interface do app)
export const zona = (plano: Plano) => {
  const m = medidas(plano);
  return { topo: m.zonaTopo, base: m.zonaBase, altura: m.zonaBase - m.zonaTopo };
};

// Entrada e saída do Yap: máscara que sobe (0,4 s) + leve subida; saída curta para baixo.
export const usarEntrada = (t: number, de: number, ate: number) => {
  const e = prog(t, de, 0.42);
  const s = prog(t, ate - 0.2, 0.2, suave);
  return {
    visivel: t >= de && t < ate,
    clip: `inset(${((1 - e) * 100).toFixed(2)}% 0 0 0 round ${RAIO}px)`,
    transform: `translateY(${(1 - e) * 26 + s * 14}px)`,
    opacity: 1 - s,
    e,
  };
};

export const Cartao: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  de: number;
  ate: number;
  escuro?: boolean;
  children?: React.ReactNode;
  semFundo?: boolean;
}> = ({ x, y, w, h, t, de, ate, escuro, children, semFundo }) => {
  const a = usarEntrada(t, de, ate);
  if (!a.visivel) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: a.transform, opacity: a.opacity }}>
      {/* a sombra fica fora da máscara, acompanhando a entrada */}
      {semFundo ? null : (
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, boxShadow: SOMBRA_CARTAO, opacity: a.e }} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: RAIO,
          overflow: "hidden",
          clipPath: a.clip,
          background: semFundo ? "transparent" : escuro ? COR.tinta : COR.papel,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Etiqueta (pílula clara) que se revela da esquerda para a direita no seu tempo.
export const Etiqueta: React.FC<{ texto: string; x: number; y: number; t: number; em: number; ate: number; tamanho?: number; marcador?: string; direitaMax?: number }> = ({
  texto,
  x: x0,
  y,
  t,
  em,
  ate,
  tamanho = 38,
  marcador,
  direitaMax = 1016,
}) => {
  if (t < em || t >= ate) return null;
  const e = prog(t, em, 0.34);
  const s = prog(t, ate - 0.2, 0.2, suave);
  const alt = Math.round(tamanho * 1.75);
  const pad = Math.round(tamanho * 0.62);
  const mw = marcador ? alt - 12 : 0;
  const w = Math.ceil(larguraTexto(texto, tamanho, { peso: 700 })) + pad * 2 + (marcador ? mw + 8 : 0);
  // não passa da borda direita (nem dos botões do app)
  const x = Math.max(16, Math.min(x0, direitaMax - w));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: alt,
        borderRadius: alt / 2,
        background: COR.papel,
        boxShadow: "0 8px 22px rgba(0,0,0,0.28)",
        clipPath: `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0 round ${alt / 2}px)`,
        opacity: 1 - s,
        display: "flex",
        alignItems: "center",
        paddingLeft: marcador ? 6 : pad,
        boxSizing: "border-box",
      }}
    >
      {marcador ? <Marcador texto={marcador} tamanho={mw} /> : null}
      <div
        style={{
          marginLeft: marcador ? 8 + pad - 6 : 0,
          fontFamily: FONTE,
          fontWeight: 700,
          fontSize: tamanho,
          color: COR.tinta,
          whiteSpace: "nowrap",
          transform: `translateX(${(1 - e) * -12}px)`,
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// Marcador lima (número de item, ícone pequeno)
export const Marcador: React.FC<{ texto: string; tamanho: number; apagado?: boolean }> = ({ texto, tamanho, apagado }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      flex: "none",
      borderRadius: tamanho * 0.32,
      background: apagado ? COR.linha : COR.lima,
      color: COR.tinta,
      fontFamily: FONTE,
      fontWeight: 800,
      fontSize: Math.round(tamanho * 0.5),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {texto}
  </div>
);
