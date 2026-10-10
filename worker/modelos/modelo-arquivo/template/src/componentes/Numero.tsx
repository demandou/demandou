import { Datilo, limitar, preciso, prog, saindo } from "../anim";
import { encaixar, formatarNumero, larguraTexto, numeroCurto, passoRedondo } from "../medida";
import type { Numero as TNumero } from "../plano";
import { cor, mono, sans, sombraTexto } from "../tema";
import { Carimbo } from "./Carimbo";

const CONTA = 1.4;
// distância entre duas marcas grandes da régua (px)
const PX_MARCA = 210;

// Número de registro: o rótulo datilografado, o número que conta em pt-BR e, embaixo, a régua de
// documentário correndo sob o ponteiro vermelho fixo até o valor (a mesma régua da linha do tempo).
export const Numero: React.FC<{
  m: TNumero;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
}> = ({ m, t, fim, area }) => {
  const sai = saindo(t, fim - 0.05, 0.22);
  const entra = prog(t, m.de, 0.45);
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  // a contagem termina antes de o momento acabar (momento curto, contagem mais rápida)
  const conta = Math.max(0.5, Math.min(CONTA, m.ate - m.em - 0.4));
  const p = prog(t, m.em, conta, preciso);
  const atual = m.valor * p;
  const centro = 540;
  const baseY = area.y + area.h + 18;
  const passo = passoRedondo(Math.abs(m.valor) / 5 || 1);
  const pxPorUnidade = PX_MARCA / passo;
  const rotuloEm = Math.max(m.de + 0.05, m.rotuloEm ?? m.em - 0.4);

  // o número inteiro (prefixo + valor final + sufixo) precisa caber na largura
  const final = `${m.prefixo ? `${m.prefixo} ` : ""}${formatarNumero(m.valor, casas)}${m.sufixo ? ` ${m.sufixo}` : ""}`;
  let tamanho = 170;
  while (tamanho > 88 && larguraTexto(final, tamanho, { peso: 800 }) > area.w - 40) tamanho -= 4;
  const menor = Math.round(tamanho * 0.42);
  // com o carimbo ILUSTRATIVO à direita, o rótulo (centrado) quebra antes dele
  const rot = encaixar(m.rotulo.toUpperCase(), { largura: m.ilustrativo ? area.w - 420 : area.w - 40, max: 40, min: 30, linhas: m.ilustrativo ? 3 : 2, fonte: { mono: true, espacamento: 0.14 } });

  // marcas da régua em volta do valor atual
  const marcas: number[] = [];
  const menorPasso = passo / 5;
  const k0 = Math.floor((atual - 560 / pxPorUnidade) / menorPasso);
  const k1 = Math.ceil((atual + 560 / pxPorUnidade) / menorPasso);
  for (let k = Math.max(0, k0); k <= k1; k++) marcas.push(k * menorPasso);
  const xDe = (v: number) => centro + (v - atual) * pxPorUnidade;
  const carimbo = m.ilustrativo ? prog(t, m.em + 0.25, 0.3) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {/* a base escurece para a régua e o número lerem bem sobre qualquer roupa */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: area.y - 260,
          bottom: 0,
          background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.78) 100%)",
          opacity: entra,
        }}
      />
      {/* rótulo e número, centrados sobre o ponteiro */}
      <div
        style={{
          position: "absolute",
          left: area.x,
          width: area.w,
          bottom: 1920 - (baseY - 104),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textShadow: sombraTexto,
          translate: `0 ${(1 - entra) * 30}px`,
          opacity: entra,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 16, height: 16, background: cor.vermelho, flexShrink: 0, opacity: prog(t, rotuloEm, 0.2) }} />
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: rot.tamanho, letterSpacing: "0.14em", lineHeight: 1.15, color: cor.claro, textAlign: "center" }}>
            {rot.linhas.map((l, i) => (
              <div key={i}>
                <Datilo texto={l} em={rotuloEm + i * 0.3} t={t} semente={140 + i} />
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: menor * 0.3,
            fontFamily: sans,
            fontWeight: 800,
            color: cor.claro,
            lineHeight: 1,
            // o número só aparece quando começa a ser dito (antes, só o rótulo e a régua no zero)
            opacity: prog(t, m.em - 0.12, 0.15),
            translate: `0 ${(1 - prog(t, m.em - 0.12, 0.3)) * 16}px`,
          }}
        >
          {m.prefixo ? <span style={{ fontSize: menor, fontWeight: 700 }}>{m.prefixo}</span> : null}
          <span style={{ fontSize: tamanho, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{formatarNumero(atual, casas)}</span>
          {m.sufixo ? <span style={{ fontSize: menor, fontWeight: 700 }}>{m.sufixo}</span> : null}
        </div>
      </div>

      {m.ilustrativo ? (
        <div
          style={{
            position: "absolute",
            right: 58,
            top: baseY - 104 - tamanho - 150,
            background: cor.cartao,
            padding: "18px 20px",
            rotate: "3deg",
            boxShadow: "0 16px 36px rgba(0,0,0,0.4)",
            opacity: carimbo,
            translate: `${(1 - carimbo) * 90}px 0`,
          }}
        >
          <Carimbo texto="Ilustrativo" em={m.em + 0.45} t={t} rot={-6} semente={8} tamanho={0.62} />
        </div>
      ) : null}

      {/* régua */}
      <div style={{ position: "absolute", inset: 0, opacity: entra, translate: `0 ${(1 - entra) * 40}px` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={Math.max(0, xDe(0))} x2={1080} y1={baseY} y2={baseY} stroke={cor.claro} strokeOpacity={0.85} strokeWidth={3} />
          {marcas.map((v) => {
            const x = xDe(v);
            if (x < -20 || x > 1100) return null;
            const grande = Math.abs(v / passo - Math.round(v / passo)) < 1e-6;
            const borda = limitar(Math.min(x, 1080 - x) / 160);
            return (
              <line
                key={v}
                x1={x}
                x2={x}
                y1={baseY}
                y2={baseY - (v === 0 ? 60 : grande ? 38 : 14)}
                stroke={cor.claro}
                strokeWidth={v === 0 ? 5 : grande ? 3.5 : 2.5}
                opacity={0.85 * borda}
              />
            );
          })}
          {/* ponteiro fixo no centro */}
          <path d={`M ${centro - 14} ${baseY - 96} L ${centro + 14} ${baseY - 96} L ${centro} ${baseY - 74} Z`} fill={cor.vermelho} />
          <line x1={centro} x2={centro} y1={baseY - 76} y2={baseY + 6} stroke={cor.vermelho} strokeWidth={4} />
        </svg>
        {marcas
          .filter((v) => Math.abs(v / passo - Math.round(v / passo)) < 1e-6)
          .map((v) => {
            const x = xDe(v);
            if (x < 60 || x > 1020) return null;
            const borda = limitar(Math.min(x, 1080 - x) / 160);
            return (
              <div
                key={`n-${v}`}
                style={{ position: "absolute", left: x - 90, width: 180, top: baseY + 12, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 30, color: cor.claro, opacity: 0.85 * borda }}
              >
                {numeroCurto(v)}
              </div>
            );
          })}
      </div>
    </div>
  );
};
