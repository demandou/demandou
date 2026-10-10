// Peças da Aula: o cartão de papel (modo professor), o sobretítulo violeta, o selo, o visto e os
// ícones genéricos (traço; nada de marca).
import { larguraTexto } from "../medida";
import { COR, FONTE, RAIO, SOMBRA, prog, suave, type Lado } from "../tema";

// entrada: desliza 40 px do lado livre e revela de cima para baixo (0,4 s); saída: recolhe (0,2 s)
export const entradaCartao = (t: number, de: number, ate: number) => {
  const e = prog(t, de, 0.4);
  const s = prog(t, ate - 0.2, 0.2, suave);
  return { e, s, visivel: t >= de && t < ate };
};

// O cartão de papel do modo professor: folha branca com sombra, um traço violeta no alto.
export const Cartao: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  de: number;
  ate: number;
  lado: Lado;
  // seco: entra (ou sai) junto com um corte, sem animação
  entraSeco?: boolean;
  saiSeco?: boolean;
  children?: React.ReactNode;
}> = ({ x, y, w, h, t, de, ate, lado, entraSeco, saiSeco, children }) => {
  const c0 = entradaCartao(t, de, ate);
  const c = { ...c0, e: entraSeco ? 1 : c0.e, s: saiSeco ? 0 : c0.s };
  if (!c.visivel) return null;
  const sinal = lado === "esq" ? -1 : 1;
  const dx = (1 - c.e) * 40 * sinal + c.s * 30 * sinal;
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
        background: COR.folha,
        boxShadow: SOMBRA,
        overflow: "hidden",
        opacity: pronto ? 1 : Math.min(1, c.e * 1.6) * (1 - c.s),
        transform: pronto ? undefined : `translateX(${dx.toFixed(1)}px)`,
        clipPath: pronto ? undefined : `inset(0 0 ${((1 - Math.min(1, c.e * 1.15)) * 100).toFixed(2)}% 0 round ${RAIO}px)`,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: w * Math.min(1, c.e * 1.2), height: 6, background: COR.violeta }} />
      {children}
    </div>
  );
};

// Sobretítulo: caixa alta violeta, espaçada, com o quadradinho; reduz o corpo para caber.
export const Sobretitulo: React.FC<{ texto: string; x: number; y: number; largura: number; tamanho?: number; cor?: string; t?: number; em?: number }> = ({
  texto,
  x,
  y,
  largura,
  tamanho = 26,
  cor = COR.violeta,
  t,
  em,
}) => {
  const fonte = { peso: 800 as const, caixaAlta: true, espacamento: 0.1 };
  let corpo = tamanho;
  while (corpo > 16 && larguraTexto(texto, corpo, fonte) + corpo * 1.2 > largura) corpo -= 1;
  const e = t !== undefined && em !== undefined ? prog(t, em, 0.35) : 1;
  if (e <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        display: "flex",
        alignItems: "center",
        gap: Math.round(corpo * 0.55),
        opacity: e >= 1 ? 1 : e,
        transform: e >= 1 ? undefined : `translateX(${(1 - e) * -12}px)`,
      }}
    >
      <div style={{ width: Math.round(corpo * 0.62), height: Math.round(corpo * 0.62), borderRadius: 3, background: cor }} />
      <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: corpo, letterSpacing: "0.1em", textTransform: "uppercase", color: cor, whiteSpace: "nowrap", lineHeight: 1.2 }}>{texto}</div>
    </div>
  );
};

// Selo (número, letra ou ícone). `apagado`: trilho claro; `vazado`: só o contorno.
export const Selo: React.FC<{ tamanho: number; children?: React.ReactNode; apagado?: boolean; vazado?: boolean; alerta?: boolean }> = ({ tamanho, children, apagado, vazado, alerta }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      flex: "none",
      borderRadius: Math.max(6, Math.round(tamanho * 0.3)),
      background: vazado ? "transparent" : apagado ? COR.trilho : alerta ? COR.alerta : COR.violeta,
      border: vazado ? `2px solid ${COR.linha}` : undefined,
      boxSizing: "border-box",
      color: vazado || apagado ? COR.apoio : COR.folha,
      fontFamily: FONTE,
      fontWeight: 800,
      fontSize: Math.round(tamanho * 0.46),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </div>
);

// Ícones genéricos (traço): salvar, comentar, link, seguir, visto, lápis, seta.
export type NomeDoIcone = "salvar" | "comentar" | "link" | "seguir" | "visto" | "lapis" | "seta";
export const Icone: React.FC<{ nome: NomeDoIcone; tamanho: number; cor?: string; traco?: number }> = ({ nome, tamanho, cor = COR.folha, traco = 2.4 }) => {
  const s = { fill: "none", stroke: cor, strokeWidth: traco, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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
      {nome === "visto" ? <path d="M5 12.5l4.5 4.5L19 7.5" {...s} strokeWidth={traco * 1.25} /> : null}
      {nome === "lapis" ? (
        <>
          <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z" {...s} />
          <path d="M13.5 7l3 3" {...s} />
        </>
      ) : null}
      {nome === "seta" ? <path d="M4 12h15M13 6l6 6-6 6" {...s} /> : null}
    </svg>
  );
};

// Visto num círculo violeta (itens do resumo e o vencedor da comparação)
export const Visto: React.FC<{ tamanho: number; e?: number }> = ({ tamanho, e = 1 }) => (
  <div style={{ width: tamanho, height: tamanho, flex: "none", borderRadius: tamanho / 2, background: COR.violeta, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * e})`, opacity: Math.min(1, e * 1.5) }}>
    <Icone nome="visto" tamanho={Math.round(tamanho * 0.62)} traco={2.8} />
  </div>
);
