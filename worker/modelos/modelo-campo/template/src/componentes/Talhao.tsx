// A assinatura do Campo: o TALHÃO. A vista de cima (foto aérea ou o mapa de lavoura desenhado) num
// cartão grande do painel; os talhões se contornam em amarelo de sinalização na fala (o traço corre
// em volta de cada um), a câmera de drone voa até o talhão da vez, que acende com a mira de
// levantamento e, se houver, a estaca com o rótulo. O título (opcional) se monta palavra por palavra.
import { Easing, Img, staticFile } from "remotion";
import { deriva, pouso, prog, saindo, suave, temposDoTexto } from "../anim";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Area, Plano, Talhao as TTalhao } from "../plano";
import { cor, mono, PAINEL, RAIO, sombra } from "../tema";
import { caber, caberTitulo, Etiqueta, Mira, Texto } from "./Pecas";

type Props = { t: number; plano: Plano; m: TTalhao; fim: number };

// ——— o mapa desenhado (modo ilustrativo): uma lavoura vista de cima, em 1000×750 ———
const MAPA_W = 1000;
const MAPA_H = 750;
type Lote = Area & { fundo: string; listra: string; angulo: number; pivo?: boolean };
const LOTES: Lote[] = [
  { x: 0.05, y: 0.07, w: 0.27, h: 0.39, fundo: "#6FA34F", listra: "#5C8F41", angulo: 0 },
  { x: 0.36, y: 0.07, w: 0.29, h: 0.39, fundo: "#B88A56", listra: "#A57847", angulo: 90 },
  { x: 0.69, y: 0.07, w: 0.26, h: 0.39, fundo: "#4E8A3C", listra: "#3F7531", angulo: 0, pivo: true },
  { x: 0.05, y: 0.53, w: 0.27, h: 0.40, fundo: "#93B95E", listra: "#7FA54E", angulo: 90 },
  { x: 0.36, y: 0.53, w: 0.29, h: 0.40, fundo: "#5E9645", listra: "#4D833A", angulo: 0 },
  { x: 0.69, y: 0.53, w: 0.26, h: 0.40, fundo: "#C79B63", listra: "#B48752", angulo: 90 },
];
export const AREAS_DO_MAPA: Area[] = LOTES.map(({ x, y, w, h }) => ({ x, y, w, h }));

const MapaDesenhado: React.FC = () => (
  <svg width="100%" height="100%" viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
    <defs>
      {LOTES.map((l, i) => (
        <pattern key={i} id={`listra-${i}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform={`rotate(${l.angulo})`}>
          <rect width="14" height="14" fill={l.fundo} />
          <rect width="14" height="5" fill={l.listra} />
        </pattern>
      ))}
    </defs>
    <rect width={MAPA_W} height={MAPA_H} fill="#D8C49A" />
    {/* estradas de terra */}
    <rect x="0" y={0.475 * MAPA_H} width={MAPA_W} height="26" fill="#E9DAB4" />
    <rect x={0.335 * MAPA_W} y="0" width="16" height={MAPA_H} fill="#E9DAB4" />
    <rect x={0.665 * MAPA_W} y="0" width="16" height={MAPA_H} fill="#E9DAB4" />
    {LOTES.map((l, i) => (
      <g key={i}>
        <rect x={l.x * MAPA_W} y={l.y * MAPA_H} width={l.w * MAPA_W} height={l.h * MAPA_H} rx="6" fill={`url(#listra-${i})`} />
        {l.pivo ? (
          <circle cx={(l.x + l.w / 2) * MAPA_W} cy={(l.y + l.h / 2) * MAPA_H} r={Math.min(l.w * MAPA_W, l.h * MAPA_H) * 0.44} fill="#7DB65A" stroke="#5E9645" strokeWidth="4" />
        ) : null}
      </g>
    ))}
    {/* açude e mata */}
    <ellipse cx={0.5 * MAPA_W} cy={0.965 * MAPA_H} rx="70" ry="22" fill="#5AA6D6" />
    {[0.02, 0.97].map((x) => (
      <g key={x}>
        {Array.from({ length: 9 }).map((_, k) => (
          <circle key={k} cx={x * MAPA_W} cy={(0.06 + k * 0.11) * MAPA_H} r="20" fill="#3E6E35" />
        ))}
      </g>
    ))}
  </svg>
);

// ——— geometria ———
const geometria = (plano: Plano, m: TTalhao) => {
  const titulo = m.texto?.trim() ? caberTitulo(m.texto, m.destaque, PAINEL.w, 82, 48) : null;
  const altTitulo = titulo ? titulo.linhas.length * titulo.tamanho * 1.16 : 0;
  const y = PAINEL.y + (titulo ? altTitulo + 30 : 0);
  return { titulo, altTitulo, mapa: { x: PAINEL.x, y, w: PAINEL.w, h: PAINEL.base - y } };
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const Talhao: React.FC<Props> = ({ t, plano, m, fim }) => {
  const g = geometria(plano, m);
  const { x: X, y: Y, w: W, h: H } = g.mapa;
  const img = imagemDoPlano(plano, m.imagem);
  const foto = temImagem(img) ? img : null;
  const iw = foto ? (foto.largura ?? 1600) : MAPA_W;
  const ih = foto ? (foto.altura ?? 1200) : MAPA_H;
  const areas: Area[] = m.areas?.length ? m.areas : foto ? [] : AREAS_DO_MAPA;
  const marcar = [...(m.marcar ?? [])].filter((k) => areas[k.area]).sort((a, b) => a.em - b.em);
  const em = m.em ?? m.de;
  const contornoEm = m.contornoEm ?? em;
  // no quadro 0 o mapa já está montado (gancho com o layout final)
  const noComeco = m.de <= 0.2;
  const e = noComeco ? { opacity: 1, transform: undefined, visivel: true } : pouso(t, m.de, { de: 1.04, sobe: 14 });
  const s = saindo(t, fim, 0.14);

  // ——— a câmera de drone ———
  const s0 = Math.max(W / iw, H / ih);
  const Wi = iw * s0;
  const Hi = ih * s0;
  // alvo de cada marcação: o talhão perto do centro, ocupando ~38% da largura
  const alvo = (a: Area) => ({ z: clamp((0.38 * W) / (a.w * Wi), 1.18, 1.55), cx: a.x + a.w / 2, cy: a.y + a.h / 2 });
  let z = 1.02 + 0.04 * prog(t, m.de, Math.max(1, fim - m.de), (v) => v);
  let cx = 0.5 + deriva(t, 1, 0.006);
  let cy = 0.5 + deriva(t, 2, 0.006);
  for (const k of marcar) {
    const a = alvo(areas[k.area]);
    const p = prog(t, k.em - 0.35, 0.8, suave);
    z = z + (a.z - z) * p;
    cx = cx + (a.cx - cx) * p;
    cy = cy + (a.cy - cy) * p;
  }
  const lw = Wi * z;
  const lh = Hi * z;
  const ox = clamp(W / 2 - cx * lw, W - lw, 0);
  const oy = clamp(H / 2 - cy * lh, H - lh, 0);
  const naTela = (a: Area) => ({ x: ox + a.x * lw, y: oy + a.y * lh, w: a.w * lw, h: a.h * lh });

  const atual = [...marcar].reverse().find((k) => t >= k.em - 0.02);
  const algumMarcado = !!atual;
  // varredura do drone (uma vez, quando os contornos começam)
  const pV = prog(t, contornoEm - 0.05, 0.9, Easing.inOut(Easing.quad));
  const tempos = m.texto ? temposDoTexto(m.texto, em <= 0.2 ? Math.max(0, em - 0.1) : em, plano.palavras, fim) : [];
  // gancho: a primeira palavra já está na tela no começo do vídeo
  if (noComeco && tempos.length && em <= 0.4) tempos[0] = -0.2;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      {g.titulo ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: PAINEL.y }}>
          <Texto t={t} linhas={g.titulo.linhas} tamanho={g.titulo.tamanho} tempos={tempos} destaque={m.destaque} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: X, top: Y, width: W, height: H, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: -6, borderRadius: RAIO + 6, background: cor.cartao, boxShadow: sombra }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, overflow: "hidden", background: "#C9B68C" }}>
          <div style={{ position: "absolute", left: ox, top: oy, width: lw, height: lh }}>
            {foto ? <Img src={staticFile(foto.arquivo)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /> : <MapaDesenhado />}
          </div>
          {/* contornos dos talhões: traço escuro por baixo (lê em telhado branco) e o amarelo por cima */}
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {areas.map((a, i) => {
              const r = naTela(a);
              const per = 2 * (r.w + r.h);
              const p = prog(t, contornoEm + i * 0.07, 0.55, Easing.inOut(Easing.cubic));
              if (p <= 0) return null;
              const marcada = marcar.some((k) => k.area === i && t >= k.em - 0.02);
              const pM = marcada ? prog(t, (marcar.find((k) => k.area === i) as { em: number }).em, 0.3) : 0;
              const apaga = algumMarcado && !marcada ? 0.8 : 1;
              const d = `M${r.x},${r.y}h${r.w}v${r.h}h${-r.w}z`;
              return (
                <g key={i} opacity={apaga}>
                  {pM > 0 ? <path d={d} fill={cor.sinal} opacity={0.3 * pM + 0.06 * pM * Math.sin(t * 5)} /> : null}
                  <path d={d} fill="none" stroke="rgba(20,30,18,0.7)" strokeWidth={marcada ? 14 : 11} strokeDasharray={`${per * p} ${per}`} strokeLinejoin="round" />
                  <path d={d} fill="none" stroke={cor.sinal} strokeWidth={marcada ? 8 : 6} strokeDasharray={`${per * p} ${per}`} strokeLinejoin="round" />
                </g>
              );
            })}
            {pV > 0 && pV < 1 ? <rect x={0} y={pV * H - 3} width={W} height={6} fill={cor.sinal} opacity={0.7 * Math.sin(pV * Math.PI)} /> : null}
          </svg>
          {/* mira e estaca do talhão da vez */}
          {atual
            ? (() => {
                const r = naTela(areas[atual.area]);
                const fR = atual.texto ? caber(atual.texto.toLocaleUpperCase("pt-BR"), Math.min(560, W - 120), 30, 22, 1, 700) : null;
                const pE = prog(t, atual.em + 0.12, 0.3);
                const ex = clamp(r.x + r.w / 2, 140, W - 140);
                const ey = clamp(r.y - 22, 70, H - 40);
                return (
                  <>
                    <Mira t={t} em={atual.em} x={r.x - 4} y={r.y - 4} w={r.w + 8} h={r.h + 8} braco={46} espessura={9} corMira={cor.cartao} />
                    {fR ? (
                      <div style={{ position: "absolute", left: ex, top: ey, transform: `translate(-50%, -100%) translateY(${(1 - pE) * 12}px)`, opacity: pE }}>
                        <Etiqueta texto={atual.texto as string} tamanho={fR.tamanho} fundo={cor.verdeEscuro} tinta={cor.cartao} icone="estaca" />
                      </div>
                    ) : null}
                  </>
                );
              })()
            : null}
          {/* rosa dos ventos: só o N (instrumento, sem número) */}
          <div style={{ position: "absolute", right: 22, bottom: 22, width: 64, height: 64, borderRadius: 32, background: "rgba(255,253,247,0.92)", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}>
            <svg width={64} height={64} style={{ position: "absolute", inset: 0 }}>
              <path d="M32 12l7 20h-14z" fill={cor.terra} />
              <path d="M32 52l-7-20h14z" fill={cor.apagado} />
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: -30, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 24, color: cor.cartao, textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>N</div>
          </div>
          {!foto ? (
            <div style={{ position: "absolute", left: 20, bottom: 22 }}>
              <Etiqueta texto="ilustrativo" tamanho={20} fundo="rgba(255,253,247,0.92)" tinta={cor.verdeEscuro} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
