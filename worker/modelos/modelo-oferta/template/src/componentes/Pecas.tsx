// Peças da página da Oferta: texto medido que se monta na fala, selo redondo (número ou ícone),
// etiqueta curta em caixa alta e os ícones de traço (desenhados aqui, sem marca nenhuma).
import { Fragment, type CSSProperties } from "react";
import { prog } from "../anim";
import { encaixar, trechoNoTexto, type Peso } from "../medida";
import type { NomeIcone as IconeDoPlano } from "../plano";
import { cor, fonte } from "../tema";

export const estiloFonte = (peso: Peso, tamanho: number, c: string = cor.tinta): CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontSize: tamanho,
  lineHeight: 1.14,
  letterSpacing: peso >= 800 ? "-0.022em" : "-0.01em",
  color: c,
  whiteSpace: "nowrap",
});

export const caber = (texto: string, largura: number, max: number, min: number, linhas: number, peso: Peso = 800) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso } });

// Texto em linhas medidas. Com `tempos` (um por palavra), cada palavra entra no seu instante (sobe
// de leve e acende); terminada a entrada, a palavra fica desenhada simples. `destaque` = trecho em
// verde profundo; `risco` = trecho riscado em vermelho em `riscoEm`.
export const Texto: React.FC<{
  t: number;
  linhas: string[];
  tamanho: number;
  peso?: Peso;
  cor?: string;
  corDestaque?: string;
  alinhar?: "left" | "center";
  tempos?: number[];
  destaque?: string;
  risco?: string;
  riscoEm?: number;
}> = ({ t, linhas, tamanho, peso = 800, cor: c = cor.tinta, corDestaque = cor.acento, alinhar = "center", tempos, destaque, risco, riscoEm }) => {
  const inteiro = linhas.join(" ");
  const d = trechoNoTexto(inteiro, destaque);
  const r = trechoNoTexto(inteiro, risco);
  let k = -1;
  return (
    <div style={{ textAlign: alinhar }}>
      {linhas.map((l, li) => (
        <div key={li} style={estiloFonte(peso, tamanho, c)}>
          {l.split(" ").map((w, wi) => {
            k++;
            const em = tempos?.[k] ?? -1;
            const p = tempos ? prog(t, em, 0.22) : 1;
            const naoDita = tempos ? t < em - 0.02 : false;
            const destacada = d && k >= d[0] && k <= d[1];
            const riscada = r && k >= r[0] && k <= r[1];
            const pR = riscada && riscoEm !== undefined ? prog(t, riscoEm, 0.3) : 0;
            return (
              <Fragment key={wi}>
              <span style={{ position: "relative", display: "inline-block", visibility: naoDita ? "hidden" : "visible" }}>
                <span
                  style={{
                    display: "inline-block",
                    color: destacada ? corDestaque : undefined,
                    opacity: p >= 1 ? (pR > 0 ? 1 - 0.45 * pR : 1) : p,
                    transform: p >= 1 ? undefined : `translateY(${(1 - p) * tamanho * 0.28}px)`,
                  }}
                >
                  {w}
                </span>
                {pR > 0 ? (
                  <span style={{ position: "absolute", left: -4, top: "54%", height: Math.max(5, tamanho * 0.09), width: `calc(${pR * 100}% + 8px)`, background: cor.risco, borderRadius: 4 }} />
                ) : null}
              </span>
              {wi < l.split(" ").length - 1 ? " " : ""}
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Selo redondo: número do item, letra ou ícone. `estado` muda a cor.
export const Selo: React.FC<{ texto: string; tamanho: number; estado?: "normal" | "certo" | "apagado" | "invertido"; icone?: NomeIcone }> = ({
  texto,
  tamanho,
  estado = "normal",
  icone,
}) => {
  const fundo = estado === "apagado" ? cor.apagado : estado === "invertido" ? cor.cartao : cor.acento;
  const tinta = estado === "invertido" ? cor.acento : cor.cartao;
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
        boxShadow: estado === "normal" ? "0 6px 14px rgba(19,87,63,0.26)" : undefined,
      }}
    >
      {icone ? (
        <Icone nome={icone} tamanho={tamanho * 0.6} cor={tinta} traco={2.2} />
      ) : (
        <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamanho * 0.5, color: tinta, lineHeight: 1 }}>{texto}</span>
      )}
    </div>
  );
};

// Etiqueta pequena em caixa alta (rótulos, "ILUSTRATIVO", títulos curtos).
export const Etiqueta: React.FC<{ texto: string; fundo?: string; tinta?: string; tamanho?: number }> = ({ texto, fundo = cor.acento, tinta = cor.cartao, tamanho = 26 }) => (
  <div
    style={{
      display: "inline-block",
      padding: `${tamanho * 0.34}px ${tamanho * 0.8}px`,
      borderRadius: tamanho,
      background: fundo,
      color: tinta,
      fontFamily: fonte,
      fontWeight: 800,
      fontSize: tamanho,
      letterSpacing: "0.1em",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      textTransform: "uppercase",
    }}
  >
    {texto}
  </div>
);

export type NomeIcone = IconeDoPlano | "salvar" | "seguir" | "comentar" | "link" | "certo" | "errado" | "interrogacao" | "seta" | "relogio";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; traco?: number }> = ({ nome, tamanho, cor: c, traco = 2 }) => {
  const k = { fill: "none", stroke: c, strokeWidth: traco, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const desenho: Record<NomeIcone, React.ReactNode> = {
    aula: (
      <>
        <rect x="3" y="4.5" width="18" height="12" rx="2" {...k} />
        <path d="M8.5 20h7M12 16.5V20M10.5 8.2v5l4-2.5z" {...k} />
      </>
    ),
    documento: <path d="M6 3h8.5L19 7.5V21H6zM14.5 3v4.5H19M9 11.5h7M9 15h7M9 18h4.5" {...k} />,
    pasta: <path d="M3 6.5V19h18V8.5h-9.5L9.5 6.5zM3 10.5h18" {...k} />,
    chamada: (
      <>
        <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" {...k} />
        <rect x="3.5" y="13" width="4" height="6" rx="1.6" {...k} />
        <rect x="16.5" y="13" width="4" height="6" rx="1.6" {...k} />
        <path d="M18.5 19c0 1.5-2 2.3-5 2.3" {...k} />
      </>
    ),
    presente: <path d="M3.5 9h17v4h-17zM5 13v8h14v-8M12 9v12M12 9c-1-3-5.5-4-5.5-1.5S10 9 12 9zM12 9c1-3 5.5-4 5.5-1.5S14 9 12 9z" {...k} />,
    comunidade: (
      <>
        <circle cx="9" cy="8.5" r="3" {...k} />
        <circle cx="16.5" cy="9.5" r="2.4" {...k} />
        <path d="M3.5 19.5c.5-3.3 2.6-5 5.5-5s5 1.7 5.5 5M14.8 14.6c2.6-.4 4.9.9 5.7 4.4" {...k} />
      </>
    ),
    certificado: (
      <>
        <circle cx="12" cy="9.5" r="5.5" {...k} />
        <path d="M9 14.3 7.5 21l4.5-2.4 4.5 2.4-1.5-6.7M10 9.6l1.5 1.5 2.8-3" {...k} />
      </>
    ),
    suporte: <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4zM10 9.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6 1v.3M12 14.2v.1" {...k} />,
    grafico: <path d="M3.5 20.5h17M5.5 16.5l4.5-5 3.5 3 6-7M15.5 7.5h4v4" {...k} />,
    escudo: <path d="M12 3 19.5 6v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6zM8.6 12l2.4 2.4 4.4-4.6" {...k} />,
    calendario: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" {...k} />
        <path d="M3.5 10h17M8 3v4M16 3v4M14.5 15.5h2.5" {...k} />
      </>
    ),
    estrela: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" {...k} />,
    carrinho: (
      <>
        <path d="M3 4.5h2.5l2.2 10.5h10.5l2-7.5H6.7" {...k} />
        <circle cx="9.5" cy="19" r="1.4" {...k} />
        <circle cx="16.5" cy="19" r="1.4" {...k} />
      </>
    ),
    moeda: (
      <>
        <circle cx="12" cy="12" r="8.5" {...k} />
        <path d="M14.6 9.2c-.5-1-1.5-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2 2.8.8 2.8 2.1-1.2 2.1-2.8 2.1c-1.2 0-2.3-.6-2.8-1.6M12 6.2v1.5M12 16v1.6" {...k} />
      </>
    ),
    check: <path d="M5 12.5l4.5 4.5L19 7.5" {...k} />,
    salvar: <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...k} />,
    seguir: (
      <>
        <circle cx="9.5" cy="8" r="3.6" {...k} />
        <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M18.5 7v6M15.5 10h6" {...k} />
      </>
    ),
    comentar: <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4z" {...k} />,
    link: <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" {...k} />,
    certo: <path d="M5 12.5l4.5 4.5L19 7.5" {...k} />,
    errado: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...k} />,
    interrogacao: (
      <>
        <path d="M8.6 8.6a3.5 3.5 0 1 1 5 3.2c-1 .5-1.6 1.3-1.6 2.4v.6" {...k} />
        <circle cx="12" cy="18.6" r="0.6" {...k} />
      </>
    ),
    seta: <path d="M4 12h15M13 6l6 6-6 6" {...k} />,
    relogio: (
      <>
        <circle cx="12" cy="12" r="8.5" {...k} />
        <path d="M12 7v5l3.5 2" {...k} />
      </>
    ),
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
      {desenho[nome] ?? desenho.check}
    </svg>
  );
};

// Cartão de papel marfim (a peça de base de todos os blocos): borda fina, sombra macia.
export const Cartao: React.FC<{ style?: CSSProperties; raio?: number; children?: React.ReactNode }> = ({ style, raio = 26, children }) => (
  <div style={{ position: "absolute", inset: 0, borderRadius: raio, background: cor.cartao, border: `2px solid ${cor.cartaoBorda}`, boxShadow: "0 18px 40px rgba(15,51,40,0.14), 0 3px 8px rgba(15,51,40,0.08)", ...style }}>
    {children}
  </div>
);
