// O mapa da assinatura: um cartão de mapa ILUSTRADO (não é print de aplicativo) que sobe na vitrine.
// Quadras com casinhas, uma praça com árvores, as ruas que se desenham; a rua dita ganha o tracejado
// tomate, o pino (com um toldinho listrado dentro) cai no número dito com dois anéis que se abrem, a
// lojinha do pino ganha o toldo, e a câmera do mapa aproxima devagar até o pino. O endereço se
// escreve na etiqueta de baixo, palavra por palavra. A placa de horário fica pendurada no toldo.
import { Easing } from "remotion";
import { prog, saida, saindo, temposDoTexto } from "../anim";
import type { Mapa as TMapa, Plano } from "../plano";
import { cor, VIDRO } from "../tema";
import { caber, Icone, Texto } from "./Pecas";

const CARTAO = { x: VIDRO.x + 20, y: VIDRO.y + 20, w: VIDRO.w - 40, h: VIDRO.h - 40 };
// a rua principal (a rua dita) e o pino nela, um pouco à direita do meio
const RUA_Y = 0.46;
const PINO_X = 0.6;
const LARG_RUA = 62;
const RUA_FINA = 30;
// ruas finas: verticais (x) e horizontais (y), em frações do cartão
const VERTICAIS = [0.13, 0.39, 0.83];
const HORIZONTAIS = [0.14, 0.8];
const CASAS = ["#EAD7B4", "#F6EAD3", "#E2C79C", "#F1DEC0", "#E8CFAA"];

type Ret = { x: number; y: number; w: number; h: number };

// as quadras = os retângulos entre as ruas
const quadras = (W: number, H: number): Ret[] => {
  const xs = [0, ...VERTICAIS.map((v) => v * W), W];
  const ys = [0, HORIZONTAIS[0] * H, RUA_Y * H, HORIZONTAIS[1] * H, H].sort((a, b) => a - b);
  const meiaRua = (y: number) => (Math.abs(y - RUA_Y * H) < 1 ? LARG_RUA / 2 : RUA_FINA / 2);
  const lista: Ret[] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + (i > 0 ? RUA_FINA / 2 : 0) + 10;
      const x1 = xs[i + 1] - (i < xs.length - 2 ? RUA_FINA / 2 : 0) - 10;
      const y0 = ys[j] + (j > 0 ? meiaRua(ys[j]) : 0) + 10;
      const y1 = ys[j + 1] - (j < ys.length - 2 ? meiaRua(ys[j + 1]) : 0) - 10;
      if (x1 - x0 > 20 && y1 - y0 > 20) lista.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  return lista;
};

// casinhas dentro de uma quadra (fileiras de retângulos com telhado mais escuro)
const Casinhas: React.FC<{ q: Ret; k: number }> = ({ q, k }) => {
  const n = Math.max(1, Math.round(q.w / 74));
  const linhas = q.h > 120 ? 2 : 1;
  const w = (q.w - (n - 1) * 8) / n;
  const h = (q.h - (linhas - 1) * 8) / linhas;
  const casas: React.ReactNode[] = [];
  for (let r = 0; r < linhas; r++)
    for (let c = 0; c < n; c++) {
      const idx = (k * 7 + r * 3 + c * 5) % CASAS.length;
      const x = q.x + c * (w + 8);
      const y = q.y + r * (h + 8);
      casas.push(
        <g key={`${r}-${c}`}>
          <rect x={x} y={y} width={w} height={h} rx={6} fill={CASAS[idx]} />
          <rect x={x} y={y} width={w} height={Math.min(14, h * 0.22)} rx={6} fill="rgba(122,74,38,0.16)" />
        </g>,
      );
    }
  return <>{casas}</>;
};

export const Mapa: React.FC<{ t: number; plano: Plano; m: TMapa; fim: number }> = ({ t, plano, m, fim }) => {
  const s = saindo(t, fim, 0.16);
  const entra = prog(t, m.de, 0.45, saida);
  const W = CARTAO.w;
  const H = CARTAO.h;
  const desenha = prog(t, m.de - 0.25, 0.6, Easing.bezier(0.45, 0, 0.3, 1));
  const destaca = prog(t, m.em, 0.6, Easing.bezier(0.45, 0, 0.3, 1));
  const pinoEm = m.numeroEm ?? m.em + 0.6;
  const cai = prog(t, pinoEm, 0.36, Easing.bezier(0.3, 1.45, 0.5, 1));
  // câmera: aproxima devagar o tempo todo, mais depressa em direção ao pino depois que ele cai
  const zoom = 1 + 0.07 * prog(t, m.de, 3.5, Easing.linear) + 0.16 * prog(t, pinoEm, 1.4, saida);
  const foco = prog(t, pinoEm, 1.4, saida);
  const fx = 0.5 + (PINO_X - 0.5) * foco;
  const fy = 0.45 + (RUA_Y - 0.45) * foco;
  // a etiqueta do endereço (embaixo do cartão)
  const endereco = [m.rua, m.numero].filter(Boolean).join(", ");
  const tempos = temposDoTexto(endereco, m.em, plano.palavras, fim);
  if (m.numero && m.numeroEm !== undefined) {
    // o número entra junto com o pino, nunca antes
    const ini = m.rua.split(/\s+/).filter(Boolean).length;
    for (let i = ini; i < tempos.length; i++) tempos[i] = Math.max(tempos[i], m.numeroEm);
  }
  const larguraEtq = W - 120;
  const fE = caber(endereco, larguraEtq - 110, 52, 30, 2);
  const altLinhas = fE.linhas.length * fE.tamanho * 1.14;
  const altEtq = altLinhas + 44 + (m.referencia ? 44 : 0);
  const pE = prog(t, m.em - 0.05, 0.3, saida);
  const qs = quadras(W, H);
  // a praça: a primeira quadra de cima à esquerda do pino; a loja: a quadra logo acima do pino
  const iLoja = qs.findIndex((q) => q.x < PINO_X * W && q.x + q.w > PINO_X * W && q.y + q.h <= RUA_Y * H && q.y + q.h > RUA_Y * H - LARG_RUA);
  const iPraca = qs.findIndex((q, i) => i !== iLoja && q.y < RUA_Y * H && q.x + q.w <= VERTICAIS[1] * W && q.y > 10);
  const yRua = RUA_Y * H;
  const pLoja = prog(t, pinoEm + 0.15, 0.35, saida);
  return (
    <div style={{ position: "absolute", left: CARTAO.x, top: CARTAO.y, width: W, height: H, opacity: 1 - s, transform: `translateY(${(1 - entra) * (H + 60)}px)` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", background: "#EFE2C6", border: `4px solid ${cor.papelBorda}`, boxShadow: "0 16px 30px rgba(59,36,22,0.22)" }}>
        <div style={{ position: "absolute", inset: 0, transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${zoom})` }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {/* as ruas finas e a principal (desenhadas como faixas claras) */}
            {VERTICAIS.map((v, i) => (
              <rect key={`v${i}`} x={v * W - RUA_FINA / 2} y={0} width={RUA_FINA} height={H * desenha} fill="#FFFBF2" />
            ))}
            {HORIZONTAIS.map((h, i) => (
              <rect key={`h${i}`} x={0} y={h * H - RUA_FINA / 2} width={W * desenha} height={RUA_FINA} fill="#FFFBF2" />
            ))}
            <rect x={0} y={yRua - LARG_RUA / 2} width={W * desenha} height={LARG_RUA} fill="#FFFDF7" />
            <line x1={0} y1={yRua - LARG_RUA / 2} x2={W * desenha} y2={yRua - LARG_RUA / 2} stroke="rgba(122,74,38,0.18)" strokeWidth={3} />
            <line x1={0} y1={yRua + LARG_RUA / 2} x2={W * desenha} y2={yRua + LARG_RUA / 2} stroke="rgba(122,74,38,0.18)" strokeWidth={3} />
            {/* as quadras com casinhas; a praça com árvores */}
            {qs.map((q, i) => (
              <g key={i} opacity={Math.min(1, Math.max(0, desenha * 1.6 - (i % 5) * 0.12))}>
                {i === iPraca ? (
                  <>
                    <rect x={q.x} y={q.y} width={q.w} height={q.h} rx={14} fill={cor.salviaClara} />
                    {Array.from({ length: 5 }, (_, k) => (
                      <circle key={k} cx={q.x + q.w * (0.16 + 0.17 * k)} cy={q.y + q.h * (k % 2 ? 0.66 : 0.36)} r={Math.min(q.w, q.h) * 0.16} fill={cor.salvia} />
                    ))}
                  </>
                ) : (
                  <Casinhas q={q} k={i} />
                )}
              </g>
            ))}
            {/* árvores na calçada da rua principal */}
            {Array.from({ length: 9 }, (_, k) => (k * 0.11 + 0.05 > PINO_X - 0.06 && k * 0.11 + 0.05 < PINO_X + 0.06 ? null : (
              <circle key={k} cx={W * (k * 0.11 + 0.05)} cy={yRua + LARG_RUA / 2 + 16} r={11} fill={cor.salvia} opacity={desenha} />
            )))}
            {/* a rua dita: o tracejado tomate que corre por ela */}
            {destaca > 0 ? (
              <line x1={0} y1={yRua} x2={W * destaca} y2={yRua} stroke={cor.acento} strokeWidth={8} strokeLinecap="round" strokeDasharray="26 18" />
            ) : null}
          </svg>
          {/* a lojinha do pino ganha o toldo listrado */}
          {iLoja >= 0 && pLoja > 0 ? (
            <svg width={120} height={40} style={{ position: "absolute", left: PINO_X * W - 60, top: yRua - LARG_RUA / 2 - 44, opacity: pLoja, transform: `scaleY(${pLoja})`, transformOrigin: "50% 0%" }}>
              {Array.from({ length: 6 }, (_, k) => (
                <path key={k} d={`M ${k * 20} 0 h 20 v 26 a 10 10 0 0 1 -20 0 z`} fill={k % 2 ? cor.toldoCreme : cor.toldo} stroke={cor.toldoEscuro} strokeWidth={1.5} />
              ))}
            </svg>
          ) : null}
          {/* o pino */}
          {t >= pinoEm - 0.02 ? (
            <div style={{ position: "absolute", left: PINO_X * W, top: yRua, width: 0, height: 0 }}>
              {[0, 0.35].map((atraso) => {
                const a = prog(t, pinoEm + 0.2 + atraso, 1.0, Easing.out(Easing.quad));
                return a > 0 && a < 1 ? (
                  <div key={atraso} style={{ position: "absolute", left: -100 * a, top: -44 * a, width: 200 * a, height: 88 * a, borderRadius: "50%", border: `4px solid ${cor.acento}`, opacity: 1 - a }} />
                ) : null;
              })}
              <div style={{ position: "absolute", left: -32, top: -10, width: 64, height: 20, borderRadius: "50%", background: "rgba(59,36,22,0.28)", transform: `scale(${cai})` }} />
              <svg width={112} height={140} viewBox="0 0 24 30" style={{ position: "absolute", left: -56, top: -136 - (1 - cai) * 170, opacity: Math.min(1, cai * 3) }}>
                <path d="M12 29.4s-10.6-10.3-10.6-18.2a10.6 10.6 0 0 1 21.2 0C22.6 19.1 12 29.4 12 29.4z" fill={cor.acento} stroke={cor.acentoEscuro} strokeWidth={1} />
                <circle cx={12} cy={11.2} r={7} fill={cor.papel} />
                {/* o toldinho dentro do pino */}
                {[0, 1, 2, 3].map((k) => (
                  <path key={k} d={`M ${7 + k * 2.5} 8.4 h 2.5 v 2.6 a 1.25 1.25 0 0 1 -2.5 0 z`} fill={k % 2 ? cor.papel : cor.acento} stroke={cor.acentoEscuro} strokeWidth={0.35} />
                ))}
                <rect x={7.6} y={12.4} width={8.8} height={3.6} rx={0.6} fill={cor.madeiraClara} />
              </svg>
            </div>
          ) : null}
        </div>
      </div>
      {/* a etiqueta do endereço */}
      {t >= m.em - 0.05 ? (
        <div
          style={{
            position: "absolute",
            left: (W - larguraEtq) / 2,
            top: H - altEtq - 26,
            width: larguraEtq,
            height: altEtq,
            borderRadius: 26,
            background: cor.papel,
            border: `3px solid ${cor.papelBorda}`,
            boxShadow: "0 12px 26px rgba(59,36,22,0.22)",
            opacity: pE,
            transform: pE >= 1 ? undefined : `translateY(${(1 - pE) * 30}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 22, top: (altLinhas + 44) / 2 - 36, width: 72, height: 72, borderRadius: 36, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome="pino" tamanho={44} cor={cor.papel} traco={2.4} />
          </div>
          <div style={{ position: "absolute", left: 112, top: 22, width: larguraEtq - 140 }}>
            <Texto t={t} linhas={fE.linhas} tamanho={fE.tamanho} alinhar="left" tempos={tempos} />
            {m.referencia ? (
              <div style={{ marginTop: 6 }}>
                <Texto t={t} linhas={[m.referencia]} tamanho={30} peso={600} cor={cor.tintaSuave} alinhar="left" tempos={temposDoTexto(m.referencia, m.referenciaEm ?? m.em, plano.palavras, fim)} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
