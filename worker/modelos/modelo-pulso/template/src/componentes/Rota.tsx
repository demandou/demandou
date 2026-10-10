// A rota: um mapa claro (parque, lago, ruas) no card grande, com a pessoa como avatar no canto de
// cima. Cada trecho de rota se desenha na cor da zona e na velocidade do ritmo — a volta longa e
// devagar, o tiro curto e rápido —, com um ponto correndo na ponta. Embaixo, o rótulo de cada
// trecho se monta na fala e as leituras (pace e frequência) contam.
import { Digitos, escreverPace, lerPace, Linhas, mistura, prog, temposDoTexto } from "../anim";
import { ANTES, MAPA } from "../layout";
import { encaixar } from "../medida";
import type { Palavra, Rota as RotaT, TrechoDeRota } from "../plano";
import { cor, letreiro, mostrador, sans, sombraCartao, zonaCor } from "../tema";

type P = [number, number];
// caminhos em coordenadas do mapa (0–840): curvas de Bézier cúbicas encadeadas
const VOLTA: P[][] = [
  [[330, 712], [330, 640], [326, 580], [326, 520]],
  [[326, 520], [326, 390], [420, 252], [566, 238]],
  [[566, 238], [702, 226], [800, 300], [798, 404]],
  [[798, 404], [796, 520], [704, 586], [592, 592]],
  [[592, 592], [484, 598], [404, 630], [336, 700]],
];
const TIRO: P[][] = [[[150, 776], [350, 776], [560, 776], [770, 776]]];

const amostrar = (curvas: P[][]) => {
  const pts: P[] = [];
  for (const [a, b, c, d] of curvas) {
    for (let i = pts.length ? 1 : 0; i <= 40; i++) {
      const s = i / 40;
      const u = 1 - s;
      pts.push([
        u * u * u * a[0] + 3 * u * u * s * b[0] + 3 * u * s * s * c[0] + s * s * s * d[0],
        u * u * u * a[1] + 3 * u * u * s * b[1] + 3 * u * s * s * c[1] + s * s * s * d[1],
      ]);
    }
  }
  const acum = [0];
  for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, acum, total: acum[acum.length - 1] };
};
const CAMINHOS = [amostrar(VOLTA), amostrar(TIRO)];

// lotes da cidade (fora do parque): grade irregular, determinística
const QUARTEIROES: [number, number, number, number][] = [];
for (const [x0, y0, x1, y1] of [
  [26, 428, 304, 750],
  [26, 806, 840, 860],
  [26, 20, 304, 380],
]) {
  const larguras = [86, 70, 94];
  const alturas = [92, 70, 104, 84];
  let y = y0;
  let j = 0;
  while (y < y1) {
    const h = Math.min(alturas[j % alturas.length], y1 - y);
    let x = x0;
    let i = j;
    while (x < x1) {
      const w = Math.min(larguras[i % larguras.length], x1 - x);
      if (w > 24 && h > 24) QUARTEIROES.push([x, y, w, h]);
      x += w + 16;
      i++;
    }
    y += h + 16;
    j++;
  }
}
// copas de árvore espalhadas no parque (longe do lago e da volta)
const ARVORES: [number, number, number][] = [
  [430, 150, 14], [470, 128, 11], [690, 120, 15], [740, 150, 12], [800, 230, 13], [812, 300, 10],
  [450, 470, 13], [470, 520, 10], [700, 640, 14], [760, 660, 11], [520, 668, 12], [580, 690, 10],
  [820, 560, 12], [420, 640, 11], [640, 300, 9], [560, 520, 10],
];

// o pedaço do caminho até a fração p, e o ponto da ponta
const ate = (c: ReturnType<typeof amostrar>, p: number) => {
  const alvo = c.total * Math.min(1, Math.max(0, p));
  const out: P[] = [];
  for (let i = 0; i < c.pts.length; i++) {
    if (c.acum[i] <= alvo) out.push(c.pts[i]);
    else {
      const k = (alvo - c.acum[i - 1]) / (c.acum[i] - c.acum[i - 1]);
      out.push([mistura(c.pts[i - 1][0], c.pts[i][0], k), mistura(c.pts[i - 1][1], c.pts[i][1], k)]);
      break;
    }
  }
  return out;
};
const d = (ps: P[], ox: number, oy: number) => ps.map((p, i) => `${i ? "L" : "M"}${(p[0] + ox).toFixed(1)} ${(p[1] + oy).toFixed(1)}`).join("");

export const fimDoTrecho = (tr: TrechoDeRota) => tr.ate ?? tr.em + (tr.zona >= 3 ? 0.6 : 1.3);

// leituras de um trecho: pace e bpm (corrida) ou uma leitura livre
const temLeitura = (tr: TrechoDeRota) => lerPace(tr.pace) !== null || !!tr.bpm || !!tr.leitura?.valor;

export const Rota: React.FC<{ m: RotaT; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const trechos = m.trechos.slice(0, 2);
  const ox = MAPA.x;
  const oy = MAPA.y;
  const topoLinhas = MAPA.y + MAPA.h + 40;
  const altLinha = 186;
  const comLeitura = trechos.some(temLeitura);
  const exemplo = m.exemplo ?? comLeitura;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* o mapa (por baixo do avatar) */}
      <div style={{ position: "absolute", inset: 0 }}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <clipPath id="recorteMapa">
              <rect x={ox} y={oy} width={MAPA.w} height={MAPA.h} rx={MAPA.raio} />
            </clipPath>
            <filter id="sombraMapa" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#101412" floodOpacity="0.12" />
            </filter>
          </defs>
          <rect x={ox} y={oy} width={MAPA.w} height={MAPA.h} rx={MAPA.raio} fill={cor.mapa} filter="url(#sombraMapa)" />
          <g clipPath="url(#recorteMapa)">
            {/* quarteirões: uma grade de lotes com ruas estreitas entre eles */}
            {QUARTEIROES.map(([x, y, w, h], i) => (
              <rect key={i} x={ox + x} y={oy + y} width={w} height={h} rx={10} fill="#D8DDD3" />
            ))}
            {/* parque e lago */}
            <path
              d={`M${ox + 392} ${oy + 120} C${ox + 520} ${oy + 70}, ${ox + 760} ${oy + 80}, ${ox + 830} ${oy + 170} L${ox + 840} ${oy + 690} C${ox + 700} ${oy + 720}, ${ox + 520} ${oy + 730}, ${ox + 392} ${oy + 690} Z`}
              fill={cor.parque}
            />
            {ARVORES.map(([x, y, r], i) => (
              <circle key={i} cx={ox + x} cy={oy + y} r={r} fill="#C3D7BA" />
            ))}
            <ellipse cx={ox + 600} cy={oy + 418} rx={120} ry={84} fill={cor.agua} />
            <ellipse cx={ox + 600} cy={oy + 418} rx={120} ry={84} fill="none" stroke="#B9CFDF" strokeWidth={3} />
            {/* ruas */}
            {[
              `M${ox - 20} ${oy + 776} L${ox + 860} ${oy + 776}`,
              `M${ox + 326} ${oy - 20} L${ox + 326} ${oy + 860}`,
              `M${ox - 20} ${oy + 400} L${ox + 326} ${oy + 400}`,
            ].map((r, i) => (
              <g key={i}>
                <path d={r} stroke={cor.ruaBorda} strokeWidth={30} fill="none" />
                <path d={r} stroke={cor.rua} strokeWidth={24} fill="none" />
              </g>
            ))}
            {/* trilha do parque, tracejada */}
            <path d={d(CAMINHOS[0].pts.slice(41), ox, oy)} stroke="#BCCDB4" strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" fill="none" />
            {/* os trechos de rota */}
            {trechos.map((tr, i) => {
              const c = CAMINHOS[i];
              const p = prog(t, tr.em, fimDoTrecho(tr) - tr.em, (x) => x);
              const z = zonaCor(tr.zona);
              const feito = ate(c, p);
              const ponta = feito[feito.length - 1];
              const inicio = c.pts[0];
              return (
                <g key={i}>
                  {/* a lápis: o trecho espera tracejado e claro */}
                  <path d={d(c.pts, ox, oy)} stroke="#AEB6AC" strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" fill="none" opacity={1 - prog(t, fimDoTrecho(tr), 0.2)} />
                  {p > 0.002 ? (
                    <>
                      <path d={d(feito, ox, oy)} stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <path d={d(feito, ox, oy)} stroke={z.cor} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </>
                  ) : null}
                  <circle cx={ox + inicio[0]} cy={oy + inicio[1]} r={13} fill="#FFFFFF" stroke={cor.tinta} strokeWidth={5} />
                  {p > 0.002 && p < 0.999 ? <circle cx={ox + ponta[0]} cy={oy + ponta[1]} r={17} fill="#FFFFFF" stroke={z.cor} strokeWidth={7} /> : null}
                  {p >= 0.999 && ponta ? <circle cx={ox + ponta[0]} cy={oy + ponta[1]} r={12} fill={z.cor} stroke="#FFFFFF" strokeWidth={5} /> : null}
                </g>
              );
            })}
          </g>
        </svg>
        {exemplo ? (
          <div
            style={{
              ...letreiro,
              fontSize: 30,
              position: "absolute",
              right: 120 + 26,
              top: MAPA.y + 26,
              color: cor.tintaSuave,
              background: "rgba(255,255,255,0.9)",
              borderRadius: 999,
              padding: "10px 20px 9px",
            }}
          >
            exemplo
          </div>
        ) : null}
      </div>

      {/* uma linha por trecho: rótulo falado e leituras contando */}
      {trechos.map((tr, i) => {
        const z = zonaCor(tr.zona);
        const top = topoLinhas + i * altLinha;
        const anterior = trechos[i - 1];
        const fimTr = fimDoTrecho(tr);
        const conta = prog(t, tr.em, Math.max(0.4, fimTr - tr.em), (x) => 1 - (1 - x) ** 2);
        const vivo = t >= tr.em - 0.02;
        const paceAlvo = lerPace(tr.pace);
        const paceDe = anterior?.pace ? (lerPace(anterior.pace) ?? paceAlvo) : paceAlvo !== null ? paceAlvo * 1.25 : null;
        const bpmDe = anterior?.bpm ?? (tr.bpm ? tr.bpm * 0.75 : 0);
        const tempos = temposDoTexto(tr.texto, palavras, tr.em - 0.1, m.ate, tr.em);
        const entraLinha = prog(t, m.de - ANTES + 0.15 + i * 0.08, 0.4);
        // o rótulo: uma linha (ou duas, menor, quando o trecho não tem leituras)
        const comLeituraAqui = temLeitura(tr);
        const enc = comLeituraAqui ? encaixar(tr.texto, { largura: 802, max: 52, min: 40, linhas: 1 }) : encaixar(tr.texto, { largura: 802, max: 68, min: 44, linhas: 2 });
        const lh = Math.round(enc.tamanho * 1.19);
        const livre = tr.leitura?.valor;
        return (
          <div key={i} style={{ position: "absolute", left: 120, width: 840, top: top, height: altLinha - 20, opacity: entraLinha, translate: `0 ${(1 - entraLinha) * 30}px` }}>
            <div style={{ position: "absolute", left: 0, top: 6, width: 10, height: altLinha - 34, borderRadius: 5, background: vivo ? z.cor : cor.esboco }} />
            <Linhas
              linhas={enc.linhas}
              tempos={tempos}
              t={t}
              x={38}
              y={0}
              largura={802}
              alturaLinha={lh}
              estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: cor.tinta }}
              esboco={cor.esboco}
            />
            {comLeituraAqui ? (
              <div style={{ position: "absolute", left: 38, top: 74, display: "flex", alignItems: "baseline", gap: 12, fontFamily: mostrador, fontWeight: 700, color: vivo ? z.texto : cor.esboco, whiteSpace: "nowrap" }}>
                {paceAlvo !== null ? (
                  <>
                    <Digitos texto={vivo ? escreverPace(mistura(paceDe ?? paceAlvo, paceAlvo, conta)) : "-:--"} tamanho={68} style={{ fontSize: 68, lineHeight: "80px" }} />
                    <span style={{ fontFamily: sans, fontSize: 36, fontWeight: 700, color: vivo ? cor.tintaSuave : cor.esboco }}>/km</span>
                  </>
                ) : null}
                {tr.bpm ? (
                  <>
                    {paceAlvo !== null ? <span style={{ width: 2, height: 52, background: "#D5DAD3", margin: "0 18px", alignSelf: "center" }} /> : null}
                    <Digitos texto={vivo ? String(Math.round(mistura(bpmDe, tr.bpm, conta))) : "---"} tamanho={56} style={{ fontSize: 56, color: vivo ? cor.tinta : cor.esboco }} />
                    <span style={{ fontFamily: sans, fontSize: 36, fontWeight: 700, color: vivo ? cor.tintaSuave : cor.esboco }}>bpm</span>
                  </>
                ) : null}
                {livre && paceAlvo === null && !tr.bpm ? (
                  <>
                    <span style={{ fontSize: 68, lineHeight: "80px", opacity: vivo ? Math.min(1, conta * 2) : 1 }}>{vivo ? livre : "—"}</span>
                    {tr.leitura?.unidade ? <span style={{ fontFamily: sans, fontSize: 36, fontWeight: 700, color: vivo ? cor.tintaSuave : cor.esboco }}>{tr.leitura.unidade}</span> : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
