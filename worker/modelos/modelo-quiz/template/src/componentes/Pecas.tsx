// Peças do painel do Quiz: texto medido que se monta na fala, selo de letra, etiqueta, ícones
// em traço (desenhados aqui) e o anel de contagem.
import { Fragment, type CSSProperties } from "react";
import { prog, salto, soco } from "../anim";
import { encaixar, trechoNoTexto, type Peso } from "../medida";
import type { Tique } from "../plano";
import { cor, fonte, sombraLeve } from "../tema";

export const estiloFonte = (peso: Peso, tamanho: number, c: string = cor.tinta): CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontSize: tamanho,
  lineHeight: 1.14,
  letterSpacing: peso >= 800 ? "-0.02em" : "-0.01em",
  color: c,
  whiteSpace: "nowrap",
});

export const caber = (texto: string, largura: number, max: number, min: number, linhas: number, peso: Peso = 800) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso } });

// Texto em linhas medidas. Com `tempos` (um por palavra), cada palavra entra no seu instante (sobe
// de leve e acende); terminada a entrada, a palavra fica desenhada simples. `destaque` = trecho em
// cobalto; `risco` = trecho riscado em `riscoEm`.
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
                  <span style={{ position: "absolute", left: -4, top: "54%", height: Math.max(5, tamanho * 0.09), width: `calc(${pR * 100}% + 8px)`, background: cor.alerta, borderRadius: 4 }} />
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

// Selo de letra (A, B, C, D) ou de sinal (✓, ✗, número). `estado` muda a cor.
export const Selo: React.FC<{ texto: string; tamanho: number; estado?: "normal" | "certo" | "apagado" | "invertido"; icone?: NomeIcone }> = ({
  texto,
  tamanho,
  estado = "normal",
  icone,
}) => {
  const fundo = estado === "certo" ? cor.cartao : estado === "apagado" ? cor.apagado : estado === "invertido" ? cor.cartao : cor.acento;
  const tinta = estado === "certo" ? cor.certo : estado === "invertido" ? cor.acento : cor.cartao;
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
        boxShadow: estado === "normal" ? "0 6px 14px rgba(47,75,255,0.28)" : undefined,
      }}
    >
      {icone ? (
        <Icone nome={icone} tamanho={tamanho * 0.62} cor={tinta} traco={3} />
      ) : (
        <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamanho * 0.52, color: tinta, lineHeight: 1 }}>{texto}</span>
      )}
    </div>
  );
};

// Etiqueta pequena em caixa alta (rótulos, "ILUSTRATIVO", títulos curtos).
export const Etiqueta: React.FC<{ texto: string; fundo?: string; tinta?: string; tamanho?: number }> = ({ texto, fundo = cor.acento, tinta = cor.cartao, tamanho = 26 }) => (
  <div
    style={{
      display: "inline-block",
      padding: `${tamanho * 0.32}px ${tamanho * 0.75}px`,
      borderRadius: tamanho,
      background: fundo,
      color: tinta,
      fontFamily: fonte,
      fontWeight: 700,
      fontSize: tamanho,
      letterSpacing: "0.08em",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      textTransform: "uppercase",
    }}
  >
    {texto}
  </div>
);

export type NomeIcone = "salvar" | "seguir" | "comentar" | "link" | "certo" | "errado" | "interrogacao" | "relogio" | "seta";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; traco?: number }> = ({ nome, tamanho, cor: c, traco = 2.4 }) => {
  const comum = { fill: "none", stroke: c, strokeWidth: traco, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...comum} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx="9.5" cy="8" r="3.6" {...comum} />
          <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M18.5 7v6M15.5 10h6" {...comum} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4z" {...comum} /> : null}
      {nome === "link" ? (
        <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" {...comum} />
      ) : null}
      {nome === "certo" ? <path d="M5 12.5l4.5 4.5L19 7.5" {...comum} /> : null}
      {nome === "errado" ? <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...comum} /> : null}
      {nome === "interrogacao" ? (
        <>
          <path d="M8.6 8.6a3.5 3.5 0 1 1 5 3.2c-1 .5-1.6 1.3-1.6 2.4v.6" {...comum} />
          <circle cx="12" cy="18.6" r="0.6" {...comum} />
        </>
      ) : null}
      {nome === "relogio" ? <path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5" {...comum} /> : null}
      {nome === "seta" ? <path d="M4 12h15M13 6l6 6-6 6" {...comum} /> : null}
    </svg>
  );
};

// ——— o anel de contagem ———
// Disco branco com o arco cobalto que esvazia do primeiro número até a revelação; cada número falado
// entra com um soco curto. Sem números falados (`relogioEm`), o centro mostra a ampulheta.
// Na revelação, o anel cresce e some (o painel acende a resposta).
export const inicioDoAnel = (contagem?: Tique[], relogioEm?: number) => (contagem?.length ? contagem[0].em : relogioEm);

export const Anel: React.FC<{ t: number; cx: number; cy: number; d: number; contagem?: Tique[]; relogioEm?: number; revelaEm: number }> = ({
  t,
  cx,
  cy,
  d,
  contagem,
  relogioEm,
  revelaEm,
}) => {
  const ini = inicioDoAnel(contagem, relogioEm);
  if (ini === undefined || t < ini - 0.12 || t > revelaEm + 0.3) return null;
  const pE = prog(t, ini - 0.12, 0.32, salto);
  const pS = prog(t, revelaEm, 0.28);
  const resta = 1 - Math.min(1, Math.max(0, (t - ini) / Math.max(0.3, revelaEm - ini)));
  const atual = contagem ? [...contagem].reverse().find((c) => t >= c.em - 0.03) : undefined;
  const golpe = atual ? soco(t, atual.em - 0.03, 0.3) : 0;
  const traco = d * 0.075;
  const r = d / 2 - traco / 2 - d * 0.06;
  const circ = 2 * Math.PI * r;
  const escala = (0.5 + 0.5 * pE) * (1 + 0.08 * golpe) * (1 + 0.25 * pS);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - d / 2,
        top: cy - d / 2,
        width: d,
        height: d,
        opacity: Math.min(1, pE * 2) * (1 - pS),
        transform: `scale(${escala})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: d / 2, background: cor.cartao, boxShadow: sombraLeve }} />
      <svg width={d} height={d} style={{ position: "absolute", inset: 0 }}>
        <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={cor.acentoClaro} strokeWidth={traco} />
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          fill="none"
          stroke={cor.acento}
          strokeWidth={traco}
          strokeLinecap="round"
          strokeDasharray={`${circ * resta} ${circ}`}
          transform={`rotate(-90 ${d / 2} ${d / 2})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {atual ? (
          <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: d * 0.46, color: cor.tinta, lineHeight: 1, letterSpacing: "-0.03em" }}>{atual.numero}</span>
        ) : (
          <Icone nome="relogio" tamanho={d * 0.4} cor={cor.acento} traco={2.2} />
        )}
      </div>
    </div>
  );
};
