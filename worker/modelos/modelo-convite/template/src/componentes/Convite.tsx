import { Escrita, limitar, mistura, pena, prog, temposDoTexto, Traco } from "../anim";
import { E, largura } from "../medida";
import type { Convite as ConviteM, Palavra, Plano } from "../plano";
import { caligrafia, cor, gravado, type Rect, TAM, textoItalico } from "../tema";
import { Folha } from "./Papel";

// O papel do convite: a folha com a moldura dupla fina. O filete acompanha o tamanho do cartão.
export const PapelDoConvite: React.FC<{ r: Rect }> = ({ r }) => {
  const filete = mistura(16, 26, limitar((r.w - 468) / (896 - 468)));
  return <Folha x={r.x} y={r.y} w={r.w} h={r.h} filete={filete} sombra="0 26px 54px rgba(36,52,72,0.28), 0 4px 10px rgba(36,52,72,0.18)" />;
};

// Moldura em arco em volta da foto: um fio cheio e um fio fino por fora, como num convite impresso.
export const MolduraDoArco: React.FC<{ a: Rect; visivel: number }> = ({ a, visivel }) => {
  if (visivel <= 0.001) return null;
  const caminho = (o: number) => {
    const raio = a.w / 2 + o;
    const cy = a.y + a.w / 2;
    return `M${a.x - o} ${a.y + a.h + o} V${cy} A${raio} ${raio} 0 0 1 ${a.x + a.w + o} ${cy} V${a.y + a.h + o} Z`;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: visivel }}>
      <path d={caminho(12)} fill="none" stroke={cor.tinta} strokeWidth={2.4} opacity={0.75} />
      {/* o fio de fora só no convite grande: no pequeno ele encostaria na moldura do cartão */}
      <path d={caminho(22)} fill="none" stroke={cor.tinta} strokeWidth={1.2} opacity={0.4 * limitar((a.w - 500) / 84)} />
    </svg>
  );
};

// Ornamento: dois fios com um losango azul no meio, que se desenham do centro para fora.
export const Ornamento: React.FC<{ p: number; largura?: number; corLosango?: string }> = ({ p, largura = 360, corLosango = cor.cera }) => (
  <svg width={largura} height={24} viewBox={`${-largura / 2} -12 ${largura} 24`} style={{ overflow: "visible", flexShrink: 0 }}>
    <Traco d={`M-16 0 H${-largura / 2}`} p={p} cor={cor.tinta} largura={1.6} opacity={0.6} />
    <Traco d={`M16 0 H${largura / 2}`} p={p} cor={cor.tinta} largura={1.6} opacity={0.6} />
    <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill={corLosango} opacity={limitar(p * 2)} />
  </svg>
);

export type Area = { x: number; w: number; topo: number; base: number };

// área de texto do convite grande: entre o lacre (embaixo da foto) e a base do cartão
export const areaDoTexto = (c: Rect, a: Rect, selo: number): Area => ({
  x: c.x + 40,
  w: c.w - 80,
  topo: a.y + a.h + selo / 2 + 14,
  base: c.y + c.h - 30,
});

export const Assinatura: React.FC<{ plano: Plano; p: number; tamanho?: number }> = ({ plano, p, tamanho = TAM.assinatura }) => {
  const partes = [plano.marca.nome, plano.marca.area].filter(Boolean);
  if (partes.length === 0) return null;
  return (
    <div
      style={{
        fontFamily: gravado,
        fontWeight: 600,
        fontSize: tamanho,
        letterSpacing: "0.2em",
        color: cor.tintaSuave,
        opacity: p,
        translate: `0 ${(1 - p) * 10}px`,
        whiteSpace: "nowrap",
      }}
    >
      {partes.join("  ·  ").toUpperCase()}
    </div>
  );
};

// Abertura do demo (`convite`): título em caligrafia (palavra por palavra, na fala), ornamento e o
// letreiro. O título encolhe até caber na largura do convite.
export const Abertura: React.FC<{ m: ConviteM; t: number; palavras: Palavra[]; area: Area; alvo: Area; opacidade: number }> = ({
  m,
  t,
  palavras,
  area,
  alvo,
  opacidade,
}) => {
  const titulo = m.titulo.split(/\s+/).filter(Boolean);
  // o título começa a se escrever quando a foto em arco já se formou (abertura do vídeo)
  const tTitulo = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1).map((x, i) => (m.de < 0.3 ? Math.max(x, 0.42 + i * 0.16) : x));
  const sub = (m.subtitulo ?? "").split(/\s+/).filter(Boolean);
  const tSub = temposDoTexto(m.subtitulo ?? "", palavras, m.de, m.ate, (tTitulo[tTitulo.length - 1] ?? m.de) + 0.3);
  const pOrn = prog(t, (tSub[0] ?? tTitulo[tTitulo.length - 1] ?? m.de) - 0.2, 0.6, pena);
  const util = alvo.w - 60;
  // caligrafia numa linha; título longo encolhe (e, no limite, quebra em duas linhas)
  const larguraTitulo = largura(m.titulo, 100, E.caligrafia) / 100;
  const tamanho = Math.max(TAM.minCaligrafia + 14, Math.min(TAM.tituloCaligrafia, util / Math.max(0.01, larguraTitulo)));
  const larguraSub = (largura(m.subtitulo ?? "", 100, { ...E.gravado, espacamento: 0.16 }) / 100) * 1 + Math.max(0, sub.length - 1) * 0.5;
  const corpoSub = Math.max(TAM.minRotulo, Math.min(TAM.rotulo + 4, util / Math.max(0.01, larguraSub)));
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        width: area.w,
        top: area.topo,
        height: alvo.base - alvo.topo,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
        opacity: opacidade,
      }}
    >
      <Escrita
        palavras={titulo}
        tempos={tTitulo}
        t={t}
        dur={0.42}
        espaco="0.2em"
        style={{ fontFamily: caligrafia, fontSize: tamanho, lineHeight: 1.18, color: cor.tinta, marginTop: 6, maxWidth: util }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <Ornamento p={pOrn} />
        {sub.length ? (
          <Escrita
            palavras={sub.map((w) => w.toUpperCase())}
            tempos={tSub}
            t={t}
            dur={0.3}
            espaco="0.5em"
            style={{ fontFamily: gravado, fontWeight: 600, fontSize: corpoSub, letterSpacing: "0.16em", color: cor.tinta, maxWidth: util }}
          />
        ) : null}
      </div>
      <div style={{ height: 10 }} />
    </div>
  );
};

// No convite pequeno do cronograma e da mesa: só a assinatura, em itálico, embaixo do lacre.
export const AssinaturaMini: React.FC<{ plano: Plano; c: Rect; opacidade: number }> = ({ plano, c, opacidade }) => {
  const partes = [plano.marca.nome, plano.marca.area].filter(Boolean);
  if (partes.length === 0 || opacidade <= 0.001) return null;
  const txt = partes.join(" · ");
  // até a largura do convite pequeno (encolhe até 32 px; nunca vaza)
  const corpo = Math.max(32, Math.min(40, (c.w - 70) / Math.max(0.01, largura(txt, 100, E.italico) / 100)));
  return (
    <div
      style={{
        position: "absolute",
        left: c.x,
        width: c.w,
        top: c.y + c.h - 72,
        textAlign: "center",
        fontFamily: textoItalico,
        fontWeight: 500,
        fontSize: corpo,
        color: cor.tintaSuave,
        opacity: opacidade,
        whiteSpace: "nowrap",
      }}
    >
      {txt}
    </div>
  );
};
