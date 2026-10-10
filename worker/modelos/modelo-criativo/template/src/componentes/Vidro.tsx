// Peças de vidro do Criativo: o cartão com espessura (claro ou fumê, com perspectiva), o ✓ na cor
// da marca, a etiqueta que salta, o texto medido que acende na fala e os ícones em traço.
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { prog, salto } from "../anim";
import { encaixar, trechoNoTexto, type Peso } from "../medida";
import type { Etiqueta as TEtiqueta, NomeIcone } from "../plano";
import { cor, corDaEspessura, ESPESSURA, fonte, RAIO, vidroClaro, vidroEscuro, type Tons } from "../tema";

export const estiloFonte = (peso: Peso, tamanho: number, c: string = cor.branco): CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontSize: tamanho,
  lineHeight: 1.12,
  letterSpacing: peso >= 800 ? "-0.022em" : "-0.01em",
  color: c,
  whiteSpace: "nowrap",
});

export const caber = (texto: string, largura: number, max: number, min: number, linhas: number, peso: Peso = 800) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso } });

// ——— o cartão de vidro ———
// `tipo`: "claro" (produto, foto) ou "escuro" (texto). A espessura aparece como uma borda mais
// funda embaixo; `giro` inclina o cartão em perspectiva (graus em X e Y) — é o que dá profundidade.
export const Cartao: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tipo?: "claro" | "escuro";
  raio?: number;
  giro?: [number, number];
  escala?: number;
  opacidade?: number;
  origem?: string;
  children?: ReactNode;
  style?: CSSProperties;
  dentro?: CSSProperties;
}> = ({ x, y, w, h, tipo = "claro", raio = RAIO, giro = [0, 0], escala = 1, opacidade = 1, origem = "50% 60%", children, style, dentro }) => {
  const transform = `perspective(1800px) rotateX(${giro[0].toFixed(2)}deg) rotateY(${giro[1].toFixed(2)}deg) scale(${escala.toFixed(4)})`;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform, transformOrigin: origem, opacity: opacidade, ...style }}>
      {/* a espessura do vidro */}
      <div style={{ position: "absolute", left: 2, right: 2, top: ESPESSURA, bottom: -ESPESSURA, borderRadius: raio, background: corDaEspessura[tipo] }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: raio, overflow: "hidden", ...(tipo === "claro" ? vidroClaro : vidroEscuro), ...dentro }}>
        {/* o brilho do vidro: luz no canto de cima à esquerda */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(255,255,255,${tipo === "claro" ? 0.42 : 0.1}) 0%, rgba(255,255,255,0) 38%)`, pointerEvents: "none" }} />
        {children}
      </div>
    </div>
  );
};

// O brilho que atravessa o vidro quando o cartão entra (uma faixa clara inclinada).
export const Reflexo: React.FC<{ t: number; em: number; w: number; h: number; forca?: number }> = ({ t, em, w, h, forca = 0.5 }) => {
  const p = prog(t, em + 0.05, 0.9);
  if (p <= 0 || p >= 1) return null;
  const x = -0.4 * w + p * 1.6 * w;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: -h * 0.2,
        width: w * 0.22,
        height: h * 1.4,
        transform: "rotate(18deg)",
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,${forca}), transparent)`,
        pointerEvents: "none",
      }}
    />
  );
};

// Bloco de vidro 3D com um ícone (o produto no modo ilustrativo): camadas de espessura, a cor da
// marca em degradê, o traço do ícone que se desenha. `p` = entrada (0→1).
export const BlocoIcone: React.FC<{ icone: NomeIcone; tamanho: number; tons: Tons; p: number; giro?: [number, number] }> = ({ icone, tamanho, tons, p, giro = [10, -14] }) => {
  const r = tamanho * 0.26;
  return (
    <div style={{ width: tamanho, height: tamanho, position: "relative", transformStyle: "preserve-3d", transform: `perspective(900px) rotateX(${giro[0]}deg) rotateY(${giro[1]}deg) scale(${0.6 + 0.4 * Math.min(1, p)})`, opacity: Math.min(1, p * 3) }}>
      {[5, 4, 3, 2, 1].map((k) => (
        <div key={k} style={{ position: "absolute", inset: 0, borderRadius: r, background: cor.tinta, opacity: 0.55 + k * 0.06, transform: `translateZ(${-k * 3}px) translateY(${k * 2}px)` }} />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          overflow: "hidden",
          background: `linear-gradient(145deg, ${tons.destaque} 0%, ${tons.destaque} 55%, ${cor.tinta} 140%)`,
          boxShadow: "inset 0 3px 0 rgba(255,255,255,0.45), inset 0 -10px 24px rgba(0,0,0,0.25), 0 24px 50px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "absolute", left: -tamanho * 0.3, top: -tamanho * 0.5, width: tamanho * 1.2, height: tamanho, background: "radial-gradient(ellipse at 45% 62%, rgba(255,255,255,0.4), transparent 62%)", transform: "rotate(-18deg)" }} />
        <Icone nome={icone} tamanho={tamanho * 0.52} cor={tons.sobreDestaque} traco={2.1} desenho={Math.max(0, Math.min(1, (p - 0.2) / 0.8))} />
      </div>
    </div>
  );
};

// ✓ (ou ✗) num disco na cor da marca.
export const Marca: React.FC<{ tamanho: number; tons: Tons; tipo?: "certo" | "errado"; p?: number }> = ({ tamanho, tons, tipo = "certo", p = 1 }) => {
  const fundo = tipo === "certo" ? tons.destaque : cor.alerta;
  const tinta = tipo === "certo" ? tons.sobreDestaque : cor.branco;
  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        background: fundo,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 6px 16px rgba(0,0,0,0.25)`,
        transform: p >= 1 ? undefined : `scale(${0.4 + 0.6 * p})`,
        opacity: Math.min(1, p * 3),
      }}
    >
      <Icone nome={tipo} tamanho={tamanho * 0.62} cor={tinta} traco={3.2} desenho={p} />
    </div>
  );
};

// Etiqueta curta (vidro fumê, ícone na cor da marca) que salta no `em` da palavra.
export const Etiqueta: React.FC<{ e: TEtiqueta; t: number; tons: Tons; tamanho?: number; style?: CSSProperties; imediata?: boolean }> = ({
  e,
  t,
  tons,
  tamanho = 38,
  style,
  imediata,
}) => {
  if (!imediata && t < e.em - 0.02) return null;
  const p = imediata ? 1 : prog(t, e.em - 0.02, 0.32, salto);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: tamanho * 0.32,
        padding: `${tamanho * 0.3}px ${tamanho * 0.62}px ${tamanho * 0.3}px ${tamanho * (e.icone ? 0.4 : 0.62)}px`,
        borderRadius: tamanho,
        ...vidroEscuro,
        opacity: Math.min(1, p * 3),
        transform: p >= 1 ? undefined : `scale(${0.6 + 0.4 * p})`,
        ...style,
      }}
    >
      {e.icone ? (
        <div style={{ width: tamanho * 1.1, height: tamanho * 1.1, borderRadius: tamanho, background: tons.destaque, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome={e.icone} tamanho={tamanho * 0.74} cor={tons.sobreDestaque} traco={2.4} />
        </div>
      ) : null}
      <span style={estiloFonte(700, tamanho)}>{e.texto}</span>
    </div>
  );
};

// Texto em linhas medidas que acompanha a fala. `tempos` = um instante por palavra.
// modo "aparece": cada palavra entra no seu instante (sobe de leve); modo "acende": todas já estão
// na tela (apagadas) e cada uma acende quando é dita — é o modo do gancho montado no 1º quadro.
// Terminada a animação, a palavra fica desenhada simples (sem camada de máscara).
export const Texto: React.FC<{
  t: number;
  linhas: string[];
  tamanho: number;
  peso?: Peso;
  cor?: string;
  corDestaque?: string;
  alinhar?: "left" | "center";
  tempos?: number[];
  modo?: "aparece" | "acende";
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  traco?: boolean;
}> = ({ t, linhas, tamanho, peso = 800, cor: c = cor.branco, corDestaque, alinhar = "center", tempos, modo = "aparece", destaque, risco, riscoEm, traco = true }) => {
  const inteiro = linhas.join(" ");
  const d = trechoNoTexto(inteiro, destaque);
  const r = trechoNoTexto(inteiro, risco);
  let k = -1;
  return (
    <div style={{ textAlign: alinhar }}>
      {linhas.map((l, li) => {
        const ws = l.split(" ");
        return (
          <div key={li} style={estiloFonte(peso, tamanho, c)}>
            {ws.map((w, wi) => {
              k++;
              const em = tempos?.[k] ?? -1;
              const p = tempos ? prog(t, em - 0.02, 0.2) : 1;
              const destacada = !!d && k >= d[0] && k <= d[1];
              const riscada = !!r && k >= r[0] && k <= r[1];
              const pR = riscada && riscoEm !== undefined ? prog(t, riscoEm, 0.3) : 0;
              const pT = destacada && traco && tempos ? prog(t, em + 0.05, 0.3) : destacada && traco ? 1 : 0;
              const acende = modo === "acende";
              const oculto = !acende && tempos ? t < em - 0.02 : false;
              const opacidade = acende ? 0.8 + 0.2 * p : p >= 1 ? 1 : p;
              return (
                <Fragment key={wi}>
                  <span style={{ position: "relative", display: "inline-block", visibility: oculto ? "hidden" : "visible" }}>
                    {pT > 0 ? (
                      <span
                        style={{
                          position: "absolute",
                          left: -2,
                          bottom: tamanho * 0.02,
                          height: tamanho * 0.14,
                          width: `calc(${pT * 100}% + 4px)`,
                          background: corDestaque ?? c,
                          opacity: 0.85,
                          borderRadius: 4,
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        position: "relative",
                        display: "inline-block",
                        color: destacada && (!acende || p > 0) ? corDestaque : undefined,
                        opacity: pR > 0 ? 1 - 0.5 * pR : opacidade,
                        transform: acende || p >= 1 ? undefined : `translateY(${(1 - p) * tamanho * 0.26}px)`,
                      }}
                    >
                      {w}
                    </span>
                    {pR > 0 ? (
                      <span style={{ position: "absolute", left: -4, top: "52%", height: Math.max(5, tamanho * 0.09), width: `calc(${pR * 100}% + 8px)`, background: cor.alerta, borderRadius: 4 }} />
                    ) : null}
                  </span>
                  {wi < ws.length - 1 ? " " : ""}
                </Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ——— ícones em traço ———
export const Icone: React.FC<{ nome: NomeIcone | "toque" | "seta-baixo"; tamanho: number; cor: string; traco?: number; desenho?: number }> = ({
  nome,
  tamanho,
  cor: c,
  traco = 2.2,
  desenho = 1,
}) => {
  const comum = {
    fill: "none",
    stroke: c,
    strokeWidth: traco,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    pathLength: 100,
    strokeDasharray: desenho >= 1 ? undefined : "100 100",
    strokeDashoffset: desenho >= 1 ? undefined : 100 * (1 - desenho),
  };
  const roda = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={1.8} {...comum} />;
  const formas: Record<string, ReactNode> = {
    gelo: (
      <>
        <path d="M12 3.2l7.6 4.3v8.8L12 20.6l-7.6-4.3V7.5z" {...comum} />
        <path d="M4.4 7.5L12 11.8l7.6-4.3M12 11.8v8.8" {...comum} />
        <path d="M8.2 7.3l2.2-1.2" {...comum} />
      </>
    ),
    sol: (
      <>
        <circle cx="12" cy="12" r="4" {...comum} />
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" {...comum} />
      </>
    ),
    relogio: (
      <>
        <circle cx="12" cy="12.5" r="8.2" {...comum} />
        <path d="M12 7.8v4.9l3.2 2" {...comum} />
      </>
    ),
    carro: (
      <>
        <path d="M3.5 15.8v-3.3l2-4.4a2 2 0 0 1 1.8-1.2h9.4a2 2 0 0 1 1.8 1.2l2 4.4v3.3M3.5 12.5h17M8.8 16.5h6.4" {...comum} />
        {roda(6.6, 16.6)}
        {roda(17.4, 16.6)}
      </>
    ),
    mochila: (
      <>
        <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0v9.3a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2z" {...comum} />
        <path d="M9.5 4.6V4a2.5 2.5 0 0 1 5 0v.6M9 14h6v3.6H9z" {...comum} />
      </>
    ),
    treino: <path d="M6.5 7v10M17.5 7v10M3.6 9.5v5M20.4 9.5v5M6.5 12h11" {...comum} />,
    frete: (
      <>
        <path d="M2.8 6.5h10.7v9.6H2.8zM13.5 9.6h4.1l3.1 3.2v3.3h-7.2" {...comum} />
        {roda(6.6, 17.6)}
        {roda(16.8, 17.6)}
      </>
    ),
    garantia: (
      <>
        <path d="M12 3l7 2.9v5.6c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V5.9z" {...comum} />
        <path d="M8.8 12.1l2.2 2.2 4.4-4.6" {...comum} />
      </>
    ),
    desconto: (
      <>
        <path d="M6 18L18 6" {...comum} />
        <circle cx="7.5" cy="7.5" r="2.2" {...comum} />
        <circle cx="16.5" cy="16.5" r="2.2" {...comum} />
      </>
    ),
    estrela: <path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" {...comum} />,
    presente: <path d="M4 9.6h16v3.2H4zM5.6 12.8h12.8v7.6H5.6zM12 9.6v10.8M12 9.6c-1.4-3.4-5.8-4-5.8-1.6S9.6 9.6 12 9.6zM12 9.6c1.4-3.4 5.8-4 5.8-1.6S14.4 9.6 12 9.6z" {...comum} />,
    certo: <path d="M5 12.5l4.5 4.5L19 7.5" {...comum} />,
    errado: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...comum} />,
    alerta: (
      <>
        <path d="M12 3.8l9 15.6H3z" {...comum} />
        <path d="M12 9.8v4.4M12 17v.2" {...comum} />
      </>
    ),
    raio: <path d="M13.2 2.8L5.6 13.4h5.6l-1 7.8 7.8-10.8h-5.8z" {...comum} />,
    coracao: <path d="M12 20s-7.6-4.6-7.6-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.6 2.4C19.6 15.4 12 20 12 20z" {...comum} />,
    cifrao: <path d="M12 3v18M16.5 7.4c-.8-1.4-2.6-2.2-4.5-2.2-2.5 0-4.4 1.4-4.4 3.4 0 4.8 9 2.6 9 7.4 0 2-2 3.4-4.6 3.4-2 0-3.8-.9-4.6-2.4" {...comum} />,
    grafico: <path d="M3.5 19.5h17M5.5 15.5l4.2-4.4 3.4 3 6-6.6M15 7.5h4.1v4.1" {...comum} />,
    play: (
      <>
        <rect x="3" y="4.5" width="18" height="13" rx="2.5" {...comum} />
        <path d="M10.2 8.4v5.2l4.4-2.6zM8 20.5h8" {...comum} />
      </>
    ),
    salvar: <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...comum} />,
    seguir: (
      <>
        <circle cx="9.5" cy="8" r="3.6" {...comum} />
        <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M18.5 7v6M15.5 10h6" {...comum} />
      </>
    ),
    comentar: <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4z" {...comum} />,
    link: <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" {...comum} />,
    toque: (
      <path
        d="M9.2 11.4V5.2a1.6 1.6 0 0 1 3.2 0v5.4l4.4.9a2 2 0 0 1 1.6 2.2l-.6 4.4a2.6 2.6 0 0 1-2.6 2.3h-4.3a2.6 2.6 0 0 1-2-1l-3.1-4a1.5 1.5 0 0 1 2.2-2z"
        {...comum}
      />
    ),
    "seta-baixo": <path d="M12 4.5v14.5M6 13l6 6 6-6" {...comum} />,
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
      {formas[nome] ?? formas.certo}
    </svg>
  );
};
