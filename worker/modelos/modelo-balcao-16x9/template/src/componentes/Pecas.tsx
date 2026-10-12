// Peças da vitrine do Balcão: texto medido que se monta na fala, o adesivo de preço, o carimbo,
// a plaquinha pendurada, a etiqueta de prateleira e os ícones (traço) — todos desenhados aqui.
import { Fragment, type CSSProperties } from "react";
import { Easing } from "remotion";
import { prog, salto } from "../anim";
import { encaixar, larguraTexto, trechoNoTexto, type Peso } from "../medida";
import { cor, fonte, TOLDO } from "../tema";

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
// tomate; `risco` = trecho riscado em `riscoEm`.
export const Texto: React.FC<{
  t: number;
  linhas: string[];
  tamanho: number;
  peso?: Peso;
  cor?: string;
  corDestaque?: string;
  alinhar?: "left" | "center" | "right";
  tempos?: number[];
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  entrelinha?: number;
}> = ({ t, linhas, tamanho, peso = 800, cor: c = cor.tinta, corDestaque = cor.acento, alinhar = "center", tempos, destaque, risco, riscoEm, entrelinha = 1.14 }) => {
  const inteiro = linhas.join(" ");
  const d = trechoNoTexto(inteiro, destaque);
  const r = trechoNoTexto(inteiro, risco);
  let k = -1;
  return (
    <div style={{ textAlign: alinhar }}>
      {linhas.map((l, li) => (
        <div key={li} style={{ ...estiloFonte(peso, tamanho, c), lineHeight: entrelinha }}>
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
                    <span style={{ position: "absolute", left: -4, top: "54%", height: Math.max(5, tamanho * 0.09), width: `calc(${pR * 100}% + 8px)`, background: cor.acento, borderRadius: 4 }} />
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

// ——— o adesivo de preço: círculo mostarda de borda ondulada, colado com uma batida ———
const ondulado = (r: number, n = 18, funda = 0.06) => {
  const pts: string[] = [];
  for (let i = 0; i <= n * 8; i++) {
    const a = (i / (n * 8)) * Math.PI * 2;
    const rr = r * (1 - funda + funda * Math.cos(a * n));
    pts.push(`${(r + rr * Math.cos(a)).toFixed(1)},${(r + rr * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
};

// `colado` = o instante em que bate. `giro` = inclinação final. O conteúdo é medido por quem chama.
export const Adesivo: React.FC<{ t: number; colado: number; d: number; giro?: number; fundo?: string; borda?: string; children: React.ReactNode }> = ({
  t,
  colado,
  d,
  giro = -8,
  fundo = cor.adesivo,
  borda = cor.adesivoEscuro,
  children,
}) => {
  if (t < colado - 0.02) return null;
  const p = prog(t, colado, 0.2, Easing.bezier(0.2, 0.9, 0.3, 1.25));
  const escala = 1.5 - 0.5 * p;
  const rot = giro - 16 * (1 - p);
  const fim = t >= colado + 0.2;
  return (
    <div
      style={{
        width: d,
        height: d,
        position: "relative",
        opacity: Math.min(1, (t - colado + 0.02) / 0.06),
        transform: fim ? `rotate(${giro}deg)` : `rotate(${rot}deg) scale(${escala})`,
        filter: `drop-shadow(0 ${3 + 6 * (1 - p)}px ${2 + 10 * (1 - p)}px rgba(59,36,22,${0.28 - 0.1 * p}))`,
      }}
    >
      <svg width={d} height={d} style={{ position: "absolute", inset: 0 }}>
        <polygon points={ondulado(d / 2)} fill={fundo} />
        <circle cx={d / 2} cy={d / 2} r={d * 0.4} fill="none" stroke={borda} strokeWidth={Math.max(2, d * 0.018)} strokeDasharray={`${d * 0.03} ${d * 0.025}`} opacity={0.6} />
        {/* o brilho do papel plastificado: uma faixa clara que não se mexe */}
        <path d={`M ${d * 0.2} ${d * 0.3} A ${d * 0.36} ${d * 0.36} 0 0 1 ${d * 0.42} ${d * 0.15}`} stroke="rgba(255,255,255,0.55)" strokeWidth={d * 0.035} fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
};

// ——— o carimbo: retângulo de borda dupla em tinta tomate, com falhas de tinta; bate uma vez ———
export const medirCarimbo = (linhas: string[], tamanhos: number[]) => {
  const larg = Math.max(...linhas.map((l, i) => larguraTexto(l, tamanhos[i], { peso: 800, caixaAlta: true, espacamento: 0.04 })));
  const alt = tamanhos.reduce((s, x) => s + x * 1.05, 0) + (linhas.length - 1) * 8;
  return { w: Math.round(larg + 92), h: Math.round(alt + 64) };
};

export const Carimbo: React.FC<{
  t: number;
  bate: number;
  linhas: string[];
  tamanhos: number[];
  giro?: number;
  tinta?: string;
  semente?: number;
}> = ({ t, bate, linhas, tamanhos, giro = -8, tinta = cor.acento, semente = 3 }) => {
  if (t < bate - 0.02) return null;
  const { w, h } = medirCarimbo(linhas, tamanhos);
  const p = prog(t, bate, 0.16, Easing.in(Easing.quad));
  const escala = 1.7 - 0.7 * p;
  // depois da batida, a tinta "assenta" (um quase nada de expansão)
  const assenta = 1 + 0.015 * prog(t, bate + 0.16, 0.5);
  const id = `tinta-${semente}-${Math.round(bate * 100)}`;
  let y = 32;
  return (
    <div
      style={{
        width: w,
        height: h,
        opacity: p * 0.94,
        transform: `rotate(${giro}deg) scale(${p >= 1 ? assenta : escala})`,
      }}
    >
      <svg width={w} height={h} style={{ overflow: "visible" }}>
        <defs>
          <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={semente} result="ruido" />
            <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.9" result="falhas" />
            <feComposite in="SourceGraphic" in2="falhas" operator="in" result="gasto" />
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={1} seed={semente + 7} result="onda" />
            <feDisplacementMap in="gasto" in2="onda" scale={3} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter={`url(#${id})`}>
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={18} fill="none" stroke={tinta} strokeWidth={8} />
          <rect x={16} y={16} width={w - 32} height={h - 32} rx={10} fill="none" stroke={tinta} strokeWidth={3} />
          {linhas.map((l, i) => {
            const s = tamanhos[i];
            y += s * (i === 0 ? 0.86 : 1.05) + (i > 0 ? 8 : 0);
            return (
              <text
                key={i}
                x={w / 2}
                y={y}
                textAnchor="middle"
                fontFamily={fonte}
                fontWeight={800}
                fontSize={s}
                letterSpacing={`${0.04 * s}px`}
                fill={tinta}
              >
                {l.toLocaleUpperCase("pt-BR")}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// ——— a plaquinha pendurada no toldo por dois fios: cai, balança e assenta ———
// (x, y) = canto de cima da placa; o fio vem do toldo (y ≈ TOLDO.base + 34).
export const Plaquinha: React.FC<{
  t: number;
  em: number;
  ate: number;
  x: number;
  y: number;
  w: number;
  rotulo?: string;
  rotuloEm?: number;
  texto: string;
  textoEm?: number;
  lado?: 1 | -1;
}> = ({ t, em, ate, x, y, w, rotulo, rotuloEm, texto, textoEm, lado = 1 }) => {
  if (t < em - 0.02 || t > ate + 0.3) return null;
  const fR = rotulo ? encaixar(rotulo, { largura: w - 56, max: 28, min: 22, linhas: 1, fonte: { peso: 800, caixaAlta: true, espacamento: 0.14 } }) : null;
  const fT = encaixar(texto, { largura: w - 56, max: 58, min: 32, linhas: 2, fonte: { peso: 800 } });
  const altR = fR ? fR.tamanho * 1.2 + 6 : 0;
  const h = 34 + altR + fT.linhas.length * fT.tamanho * 1.08 + 30;
  const gancho = TOLDO.base + 34;
  const fio = y - gancho;
  // cai do toldo e balança no gancho
  const queda = prog(t, em, 0.32, Easing.bezier(0.3, 1.3, 0.5, 1));
  const d = Math.max(0, t - em);
  const balanco = lado * (14 * Math.exp(-d / 0.55) * Math.cos(d * 8.5)) + Math.sin(t * 1.3) * 0.9;
  const saida = prog(t, ate, 0.15, Easing.in(Easing.quad));
  const tR = rotuloEm ?? em;
  const tT = textoEm ?? em;
  const pT = prog(t, tT, 0.25, salto);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: gancho,
        width: w,
        height: fio + h,
        transformOrigin: `${w / 2}px 0px`,
        transform: `translateY(${-(1 - queda) * (fio + h + 40) - saida * (fio + h + 40)}px) rotate(${balanco}deg)`,
      }}
    >
      {/* os dois fios */}
      <svg width={w} height={fio + 12} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M ${w / 2} 0 L ${w * 0.18} ${fio + 10}`} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" />
        <path d={`M ${w / 2} 0 L ${w * 0.82} ${fio + 10}`} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" />
        <circle cx={w / 2} cy={3} r={7} fill={cor.tinta} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: fio,
          width: w,
          height: h,
          borderRadius: 18,
          background: cor.tinta,
          boxShadow: "0 14px 26px rgba(59,36,22,0.32)",
        }}
      >
        <div style={{ position: "absolute", inset: 9, borderRadius: 12, border: `2.5px solid rgba(255,242,222,0.55)` }} />
        {[0.18, 0.82].map((f) => (
          <div key={f} style={{ position: "absolute", left: w * f - 7, top: 6, width: 14, height: 14, borderRadius: 7, background: cor.madeiraClara }} />
        ))}
        <div style={{ position: "absolute", left: 0, top: 30, width: w, textAlign: "center" }}>
          {fR && t >= tR - 0.02 ? (
            <div
              style={{
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: fR.tamanho,
                letterSpacing: "0.14em",
                color: cor.adesivo,
                lineHeight: 1.2,
                marginBottom: 6,
                opacity: prog(t, tR, 0.2),
              }}
            >
              {fR.linhas[0].toLocaleUpperCase("pt-BR")}
            </div>
          ) : fR ? (
            <div style={{ height: altR }} />
          ) : null}
          {t >= tT - 0.02 ? (
            <div style={{ opacity: Math.min(1, pT * 2), transform: pT >= 1 ? undefined : `scale(${0.7 + 0.3 * pT})` }}>
              {fT.linhas.map((l, i) => (
                <div key={i} style={{ ...estiloFonte(800, fT.tamanho, cor.toldoCreme), lineHeight: 1.08 }}>
                  {l}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ——— etiqueta de prateleira: papel creme com borda, presa na beira da prateleira ———
export const EtiquetaPrateleira: React.FC<{ texto: string; largura: number; max?: number; ativo?: number }> = ({ texto, largura, max = 36, ativo = 0 }) => {
  const f = caber(texto, largura - 36, max, 22, 2, 700);
  return (
    <div
      style={{
        width: largura,
        boxSizing: "border-box",
        padding: "10px 18px 12px",
        borderRadius: 12,
        background: cor.papel,
        border: `3px solid ${cor.papelBorda}`,
        boxShadow: `0 6px 0 rgba(138,82,40,0.25)${ativo > 0 ? `, 0 0 0 ${4 * ativo}px ${cor.acento}` : ""}`,
        textAlign: "center",
      }}
    >
      {f.linhas.map((l, i) => (
        <div key={i} style={{ ...estiloFonte(700, f.tamanho), lineHeight: 1.1 }}>
          {l}
        </div>
      ))}
    </div>
  );
};

// ——— ícones de traço (interface) ———
export type NomeIcone = "salvar" | "seguir" | "comentar" | "link" | "certo" | "errado" | "interrogacao" | "aspas" | "seta" | "enviar" | "pino" | "alerta";

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
      {nome === "alerta" ? <path d="M12 5v9M12 18.6v.2" {...comum} /> : null}
      {nome === "interrogacao" ? (
        <>
          <path d="M8.6 8.6a3.5 3.5 0 1 1 5 3.2c-1 .5-1.6 1.3-1.6 2.4v.6" {...comum} />
          <circle cx="12" cy="18.6" r="0.6" {...comum} />
        </>
      ) : null}
      {nome === "aspas" ? <path d="M9.5 7.5C6.8 8.3 5.5 10.2 5.5 13v3.5h4v-4h-2M18.5 7.5c-2.7.8-4 2.7-4 5.5v3.5h4v-4h-2" {...comum} /> : null}
      {nome === "seta" ? <path d="M4 12h15M13 6l6 6-6 6" {...comum} /> : null}
      {nome === "enviar" ? <path d="M4 11.5L20 4l-5.5 16-3-6.5zM11.5 13.5L20 4" {...comum} /> : null}
      {nome === "pino" ? (
        <>
          <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" {...comum} />
          <circle cx="12" cy="10" r="2.4" {...comum} />
        </>
      ) : null}
    </svg>
  );
};
