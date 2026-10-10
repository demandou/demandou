// Número: o numeral índigo grande da revista conta até o valor dito, com o rótulo em caixa alta
// em cima e a fita métrica embaixo, onde um pino corre até a medida (de 0 a um teto redondo).
// Na capa (primeiro momento), vira a manchete acima da foto.
import { Easing } from "remotion";
import { prog, saida, Sobe } from "../anim";
import { encaixar, largura, numeroPtBr, tetoRedondo } from "../medida";
import type { Area } from "../pessoa";
import type { Numero } from "../plano";
import { cor, rotulo, serifa } from "../tema";
import { quando } from "./comum";

const conta = Easing.bezier(0.16, 1, 0.3, 1);

export const formatar = (v: number, casas = 0) => numeroPtBr(v, casas);

// a fita métrica horizontal com o pino que corre até a medida
export const FitaHorizontal: React.FC<{ x: number; y: number; w: number; fracao: number; p: number; inicio: string; fimTexto: string }> = ({ x, y, w, fracao, p, inicio, fimTexto }) => {
  const H = 58;
  const px = x + w * Math.max(0, Math.min(1, fracao));
  const r = 24;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: p }}>
        <rect x={x} y={y} width={w} height={H} fill="#E9DFC9" />
        <rect x={x} y={y} width={w} height={H} fill="none" stroke="rgba(23,22,20,0.28)" strokeWidth={2} />
        {Array.from({ length: 101 }, (_, i) => {
          const lx = x + (w * i) / 100;
          const longa = i % 10 === 0 ? 30 : i % 5 === 0 ? 20 : 10;
          return <line key={i} x1={lx} x2={lx} y1={y + H} y2={y + H - longa} stroke="rgba(23,22,20,0.55)" strokeWidth={i % 10 === 0 ? 2.6 : 1.4} />;
        })}
        {/* o trecho medido: um fio índigo na borda de cima da fita */}
        <rect x={x} y={y - 2} width={Math.max(0, px - x)} height={7} fill={cor.indigo} />
        <circle cx={px} cy={y - 2} r={r} fill={cor.folha} stroke={cor.tinta} strokeWidth={3.6} />
        <circle cx={px} cy={y - 2} r={11.5} fill={cor.indigo} />
      </svg>
      <div style={{ position: "absolute", left: x, top: y + H + 10, ...rotulo, fontSize: 30, letterSpacing: "0.08em", color: cor.grafite, opacity: p }}>{inicio}</div>
      <div style={{ position: "absolute", left: x + w - 400, width: 400, top: y + H + 10, textAlign: "right", ...rotulo, fontSize: 30, letterSpacing: "0.08em", color: cor.grafite, opacity: p }}>
        {fimTexto}
      </div>
    </>
  );
};

export const NumeroDeRevista: React.FC<{ m: Numero; t: number; fim: number; area: Area; capa?: boolean }> = ({ m, t, fim, area, capa }) => {
  const fora = saida(t, fim);
  const casas = m.casas ?? 0;
  const final = formatar(m.valor, casas);
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  // o maior corpo em que prefixo + número + sufixo cabem na largura
  const medirTudo = (s: number) =>
    (pre ? largura(pre, s * 0.42, "serifa") + s * 0.12 : 0) + largura(final, s, "serifa") + (suf ? s * 0.1 + largura(suf, s * 0.42, "serifa") : 0);
  const rot = encaixar(m.rotulo, { largura: area.w, max: 40, min: 32, linhas: 2, estilo: "sans500", espacamento: 0.18, caixaAlta: true, entrelinha: 1.15 });
  const fitaH = 58 + 52;
  let s = capa ? 190 : 230;
  while (s > 90 && (medirTudo(s) > area.w || rot.altura + 18 + s * 0.98 + 44 + fitaH > area.h)) s -= 4;
  const total = rot.altura + 18 + s * 0.98 + 44 + fitaH;
  const y0 = area.y + Math.max(0, (area.h - total) / 2);
  const em = quando(m.em, m.de);
  // a contagem termina antes de a página sair (momento curto: conta mais rápido)
  const durConta = Math.max(0.45, Math.min(1.15, fim - em - 0.2));
  const pc = conta(prog(t, em - 0.05, durConta, Easing.linear));
  const atual = m.valor * pc;
  const texto = formatar(atual, casas);
  const teto = tetoRedondo(Math.abs(m.valor));
  const entra = prog(t, m.de + 0.1, 0.5);
  const wTotal = medirTudo(s);
  const x0 = area.x + (area.w - wTotal) / 2;
  const unidadeFim = `${pre ? `${pre} ` : ""}${formatar(teto, casas && teto < 10 ? casas : 0)}${suf ? ` ${suf}` : ""}`;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - fora, translate: `0 ${fora * -30}px` }}>
      <div style={{ position: "absolute", left: area.x, top: y0, width: area.w, textAlign: "center", ...rotulo, fontSize: rot.tamanho, lineHeight: 1.15, color: cor.grafite }}>
        {rot.linhas.map((l, i) => (
          <Sobe key={i} p={prog(t, (m.rotuloEm !== undefined ? quando(m.rotuloEm, m.de) : m.de + 0.25) - 0.04, 0.42)}>
            {l}
          </Sobe>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: x0,
          top: y0 + rot.altura + 18,
          display: "flex",
          alignItems: "baseline",
          whiteSpace: "nowrap",
          fontFamily: serifa,
          color: cor.indigo,
          opacity: Math.min(1, prog(t, em - 0.1, 0.25) * 1.5),
        }}
      >
        {pre ? <span style={{ fontSize: s * 0.42, color: cor.tinta, marginRight: s * 0.12 }}>{pre}</span> : null}
        <span style={{ fontSize: s, lineHeight: 0.98, letterSpacing: "-0.015em" }}>{texto}</span>
        {suf ? <span style={{ fontSize: s * 0.42, color: cor.tinta, marginLeft: s * 0.1 }}>{suf}</span> : null}
      </div>
      {m.ilustrativo ? (
        <div style={{ position: "absolute", left: area.x, width: area.w, top: y0 + rot.altura + 18 + s * 0.98 + 2, textAlign: "right", ...rotulo, fontSize: 30, color: cor.lapis }}>
          ilustrativo
        </div>
      ) : null}
      <FitaHorizontal
        x={area.x + 8}
        y={y0 + rot.altura + 18 + s * 0.98 + 44}
        w={area.w - 16}
        fracao={Math.abs(atual) / teto}
        p={entra}
        inicio="0"
        fimTexto={unidadeFim}
      />
    </div>
  );
};
