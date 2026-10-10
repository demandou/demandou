// Peças do pacote gráfico do Canal: o painel de vidro (entra deslizando do lado livre e se abre),
// o rótulo em mono (como o carimbo de tempo de um capítulo), o selo numerado cobalto, a linha de
// tempo que corre no alto do painel enquanto ele está no ar e os ícones genéricos.
import { larguraTexto } from "../medida";
import { COR, FONTE, MONO, RAIO, VIDRO, prog, suave, type Lado } from "../tema";

// entrada: desliza 48 px do lado livre e abre de cima para baixo (0,42 s); saída: recolhe (0,24 s)
export const entradaPainel = (t: number, de: number, ate: number) => {
  const e = prog(t, de, 0.42);
  const s = prog(t, ate - 0.24, 0.24, suave);
  return { e, s, aberto: Math.max(0, e - s), visivel: t >= de && t < ate };
};

export const Vidro: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  de: number;
  ate: number;
  lado: Lado;
  tempo?: boolean;
  alerta?: boolean;
  children?: React.ReactNode;
}> = ({ x, y, w, h, t, de, ate, lado, tempo = true, alerta, children }) => {
  const c = entradaPainel(t, de, ate);
  if (!c.visivel) return null;
  const dx = (1 - c.e) * 48 * (lado === "dir" ? 1 : -1) + c.s * 24 * (lado === "dir" ? 1 : -1);
  const pronto = c.e >= 1 && c.s <= 0;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: RAIO,
        overflow: "hidden",
        ...VIDRO,
        opacity: pronto ? 1 : Math.min(1, c.aberto * 1.6),
        transform: pronto ? undefined : `translateX(${dx.toFixed(1)}px)`,
        clipPath: pronto ? undefined : `inset(0 0 ${((1 - Math.min(1, c.e * 1.15)) * 100).toFixed(2)}% 0 round ${RAIO}px)`,
      }}
    >
      {tempo ? <LinhaDeTempo t={t} de={de} ate={ate} largura={w} cor={alerta ? COR.coral : COR.cobalto} /> : null}
      {children}
    </div>
  );
};

// Linha de tempo: corre no alto da peça enquanto ela está no ar (nada fica parado).
export const LinhaDeTempo: React.FC<{ t: number; de: number; ate: number; largura: number; cor?: string; embaixo?: boolean }> = ({ t, de, ate, largura, cor = COR.cobalto, embaixo }) => {
  const p = Math.min(1, Math.max(0, (t - de) / Math.max(0.1, ate - de)));
  return <div style={{ position: "absolute", left: 0, [embaixo ? "bottom" : "top"]: 0, width: largura * p, height: 5, background: cor }} />;
};

// Rótulo em mono, caixa alta: reduz o corpo para caber na largura.
export const Rotulo: React.FC<{ texto: string; x: number; y: number; largura: number; tamanho?: number; cor?: string; alinhar?: "esq" | "dir" }> = ({
  texto,
  x,
  y,
  largura,
  tamanho = 24,
  cor = COR.apoio,
  alinhar = "esq",
}) => {
  const fonte = { mono: true, caixaAlta: true, espacamento: 0.06 };
  let corpo = tamanho;
  while (corpo > 16 && larguraTexto(texto, corpo, fonte) > largura) corpo -= 1;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: largura,
        textAlign: alinhar === "dir" ? "right" : "left",
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: corpo,
        lineHeight: 1.2,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: cor,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};

// Selo cobalto (número, letra ou ícone). `apagado`: trilho cinza; `vazado`: só o contorno.
export const Selo: React.FC<{ tamanho: number; children?: React.ReactNode; apagado?: boolean; vazado?: boolean; alerta?: boolean; mono?: boolean }> = ({
  tamanho,
  children,
  apagado,
  vazado,
  alerta,
  mono = true,
}) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      flex: "none",
      borderRadius: Math.max(6, Math.round(tamanho * 0.24)),
      background: vazado ? "transparent" : apagado ? COR.trilho : alerta ? COR.coral : COR.cobalto,
      border: vazado ? `2px solid ${COR.trilho}` : undefined,
      boxSizing: "border-box",
      color: vazado ? COR.apoio : COR.giz,
      fontFamily: mono ? MONO : FONTE,
      fontWeight: mono ? 500 : 800,
      fontSize: Math.round(tamanho * 0.48),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </div>
);

// Ícones genéricos (traço), nada de marca: salvar, comentar, link, seguir, play, check, som.
export type NomeDoIcone = "salvar" | "comentar" | "link" | "seguir" | "play" | "check";
export const Icone: React.FC<{ nome: NomeDoIcone; tamanho: number; cor?: string }> = ({ nome, tamanho, cor = COR.giz }) => {
  const s = { fill: "none", stroke: cor, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {nome === "salvar" ? <path d="M6 3h12v18l-6-4.5L6 21z" {...s} /> : null}
      {nome === "comentar" ? <path d="M4 5h16v11H9l-5 4z" {...s} /> : null}
      {nome === "link" ? (
        <>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...s} />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...s} />
        </>
      ) : null}
      {nome === "seguir" ? (
        <>
          <circle cx="10" cy="8" r="4" {...s} />
          <path d="M3 20c1-4 4-6 7-6s6 2 7 6M19 6v6M16 9h6" {...s} />
        </>
      ) : null}
      {nome === "play" ? <path d="M8 5.5v13l10.5-6.5z" fill={cor} stroke="none" /> : null}
      {nome === "check" ? <path d="M5 12.5l4.5 4.5L19 7.5" {...s} strokeWidth={3} /> : null}
    </svg>
  );
};

// Barras de som que andam (o "nível" de um áudio): movimento interno em etiquetas e cartões.
export const BarrasDeSom: React.FC<{ t: number; altura: number; cor?: string; barras?: number; forte?: number }> = ({ t, altura, cor = COR.cobalto, barras = 5, forte = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: Math.max(3, Math.round(altura * 0.12)), height: altura }}>
    {Array.from({ length: barras }, (_, i) => {
      const v = 0.3 + 0.7 * forte * Math.abs(Math.sin(t * (5.3 + i * 1.7) + i * 1.9)) * (0.55 + 0.45 * Math.abs(Math.sin(t * 2.1 + i)));
      return <div key={i} style={{ width: Math.max(4, Math.round(altura * 0.16)), height: Math.max(4, altura * Math.min(1, v)), borderRadius: 3, background: cor }} />;
    })}
  </div>
);
