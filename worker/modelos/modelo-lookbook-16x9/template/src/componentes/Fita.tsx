// Passos (sequência em ordem) como a fita métrica do alfaiate: a fita se desenrola na vertical
// e, a cada passo dito, um pino marca a fita e uma linha fina leva ao nome do passo. Antes de ser
// dito, cada passo espera a lápis (o lugar do pino tracejado e um traço onde o texto vai entrar).
import { prog, saida, Sobe } from "../anim";
import { quebrar } from "../medida";
import type { Area } from "../pessoa";
import type { Passos } from "../plano";
import { cor, sans, serifa, PAGINA } from "../tema";
import { Apoio, quando } from "./comum";
import { alturaTitulo, Titulo } from "./Lista";

const FITA = 58;
const TEXTO_X = 150;
const R = 30;

// a fita: papel cru com marcas de centímetro (curtas, médias a cada 5, longas a cada 10)
const MarcasDaFita: React.FC<{ h: number }> = ({ h }) => (
  <svg width={FITA} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={0} y={0} width={FITA} height={h} fill="#E9DFC9" />
    <rect x={1} y={0} width={FITA - 2} height={h} fill="none" stroke="rgba(23,22,20,0.28)" strokeWidth={2} />
    {Array.from({ length: Math.floor(h / 12) }, (_, i) => {
      const longa = i % 10 === 0 ? 30 : i % 5 === 0 ? 20 : 11;
      return <line key={i} x1={0} x2={longa} y1={i * 12 + 6} y2={i * 12 + 6} stroke="rgba(23,22,20,0.55)" strokeWidth={i % 5 === 0 ? 2.4 : 1.6} />;
    })}
  </svg>
);

export const FitaDePassos: React.FC<{ m: Passos; t: number; fim: number; area: Area }> = ({ m, t, fim, area }) => {
  const fora = saida(t, fim);
  const th = alturaTitulo(m.titulo, area.w);
  const gap = th ? 36 : 6;
  const y0 = area.y + th + gap;
  const altura = area.y + area.h - y0;
  const tw = area.w - TEXTO_X;

  // corpo único: cada passo em até 2 linhas, todos cabendo na altura
  let s = 72;
  let medidas: { linhas: string[]; detalhe: string[]; h: number }[] = [];
  for (; s >= 42; s -= 2) {
    const det = Math.max(36, Math.round(s * 0.7));
    medidas = m.itens.map((it) => {
      const linhas = quebrar(it.texto, tw, s, { estilo: "serifa" });
      const detalhe = it.detalhe ? quebrar(it.detalhe, tw, det, { estilo: "sans400" }) : [];
      return { linhas, detalhe, h: Math.max(R * 2 + 10, linhas.length * s * 1.12 + (detalhe.length ? 8 + detalhe.length * det * 1.22 : 0)) };
    });
    const total = medidas.reduce((a, x) => a + x.h, 0);
    if (medidas.every((x) => x.linhas.length <= 2) && total + 30 * (medidas.length - 1) <= altura) break;
  }
  const det = Math.max(36, Math.round(s * 0.7));
  const conteudo = medidas.reduce((a, x) => a + x.h, 0);
  // espaço entre os passos: distribuído, sem passar de 90 px
  const vao = Math.min(90, Math.max(24, (altura - conteudo) / Math.max(1, medidas.length - 1 + 0.6)));
  const tops: number[] = [];
  let y = 0;
  medidas.forEach((x) => {
    tops.push(y);
    y += x.h + vao;
  });
  const fimDaFita = y - vao + 20;
  const ems = m.itens.map((it) => quando(it.em, m.de));
  // a fita se desenrola até o passo dito mais recente
  const entra = prog(t, m.de + 0.1, 0.55);
  let alcance = Math.min(tops[0] + R + 10, fimDaFita) * entra;
  ems.forEach((e, i) => {
    const alvo = i === ems.length - 1 ? fimDaFita : tops[i] + R * 2 + 24;
    const ant = i === 0 ? tops[0] + R + 10 : tops[i - 1] + R * 2 + 24;
    if (t >= e - 0.1) alcance = ant + (alvo - ant) * prog(t, e - 0.1, 0.5);
  });

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PAGINA.w, height: PAGINA.h, opacity: 1 - fora, translate: `0 ${fora * 30}px` }}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w }}>
          <Titulo texto={m.titulo} p={prog(t, m.de + 0.3, 0.45)} largura={area.w} />
        </div>
      ) : null}
      {/* a fita: contorno a lápis do comprimento todo; o papel se desenrola por cima */}
      <div style={{ position: "absolute", left: area.x + 8, top: y0, width: FITA, height: fimDaFita, border: `3px dashed ${cor.lapisClaro}`, boxSizing: "border-box", opacity: entra }} />
      <div style={{ position: "absolute", left: area.x + 8, top: y0, width: FITA, height: Math.max(0, alcance), overflow: "hidden", boxShadow: "0 8px 18px rgba(30,24,16,0.16)" }}>
        <MarcasDaFita h={fimDaFita} />
      </div>
      {medidas.map((x, i) => {
        const em = ems[i];
        const p = prog(t, em - 0.04, 0.42);
        const pino = prog(t, em - 0.08, 0.5);
        const linha = prog(t, em + 0.02, 0.35);
        const cy = y0 + tops[i] + Math.min(x.h, s * 1.12) / 2;
        const cx = area.x + 8 + FITA / 2;
        const volta = 2 * Math.PI * R;
        return (
          <div key={i}>
            <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              {/* espera a lápis */}
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="7 7" opacity={1 - pino} />
              <circle cx={cx} cy={cy} r={R} fill={cor.folha} opacity={pino} />
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.tinta} strokeWidth={3.6} strokeDasharray={volta} strokeDashoffset={volta * (1 - pino)} transform={`rotate(-90 ${cx} ${cy})`} />
              <circle cx={cx} cy={cy} r={22} fill={cor.indigo} transform={`translate(${cx} ${cy}) scale(${prog(pino, 0.3, 0.7)}) translate(${-cx} ${-cy})`} />
              <line x1={cx + R + 4} x2={cx + R + 4 + (area.x + TEXTO_X - 18 - (cx + R + 4)) * linha} y1={cy} y2={cy} stroke={cor.tinta} strokeWidth={3} />
            </svg>
            <div
              style={{
                position: "absolute",
                left: cx - 30,
                top: cy - 20,
                width: 60,
                textAlign: "center",
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 31,
                lineHeight: "40px",
                color: cor.folha,
                opacity: prog(pino, 0.5, 0.5),
              }}
            >
              {i + 1}
            </div>
            <div style={{ position: "absolute", left: area.x + TEXTO_X, top: y0 + tops[i], width: tw }}>
              <div style={{ position: "absolute", left: 0, top: s * 0.7, width: Math.min(tw, 100 + x.linhas[0].length * s * 0.3), borderTop: `3px dashed ${cor.lapis}`, opacity: 1 - prog(p, 0, 0.4) }} />
              <div style={{ fontFamily: serifa, fontSize: s, lineHeight: 1.12, color: cor.tinta, whiteSpace: "nowrap" }}>
                {x.linhas.map((l, k) => (
                  <Sobe key={k} p={p}>
                    {l}
                  </Sobe>
                ))}
              </div>
              {x.detalhe.length ? (
                <div style={{ marginTop: 8 }}>
                  <Apoio texto={x.detalhe.join(" ")} tamanho={det} p={prog(t, em + 0.25, 0.4)} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
