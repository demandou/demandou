// A assinatura: um trecho da gravação de tela. Uma captura real de página que a câmera percorre
// sem parar (rola e aproxima), com o cursor andando até o que a pessoa cita e clicando. Desenhada
// no palco de 1080 px (o Palco encolhe para a moldura). Corte seco na entrada e na saída.
import { Img, staticFile } from "remotion";
import type { Tela as TTela, Vista } from "../plano";
import { LARGURA, PALCO_H, prog } from "../tema";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const suave = (p: number) => p * p * (3 - 2 * p);
// quase linear, com partida e chegada macias: a câmera nunca para
const andar = (p: number) => 0.62 * p + 0.38 * suave(p);

const vistaEm = (m: TTela, p: number): Vista => {
  const k = andar(clamp(p, 0, 1));
  return { x: m.ini.x + (m.fim.x - m.ini.x) * k, y: m.ini.y + (m.fim.y - m.ini.y) * k, zoom: m.ini.zoom + (m.fim.zoom - m.ini.zoom) * k };
};

// a captura na tela: tamanho e canto (sempre cobrindo o palco, nunca borda vazia)
const posicao = (m: TTela, v: Vista, alt: number) => {
  const w = LARGURA * v.zoom;
  const h = w * m.proporcao;
  const left = clamp(LARGURA / 2 - v.x * w, LARGURA - w, 0);
  const top = h <= alt ? 0 : clamp(alt / 2 - v.y * h, alt - h, 0);
  return { w, h, left, top };
};

const Cursor: React.FC<{ x: number; y: number; apertado: number }> = ({ x, y, apertado }) => (
  <svg
    width={46}
    height={46}
    viewBox="0 0 24 24"
    style={{ position: "absolute", left: x - 5, top: y - 3, transform: `scale(${1 - apertado * 0.12})`, transformOrigin: "5px 3px", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.45))" }}
  >
    <path d="M5.2 3 L5.2 19.2 L9.6 15.2 L12.4 21.4 L15.2 20.1 L12.4 14 L18.4 14 Z" fill="#FFFFFF" stroke="#0B0B10" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

export const Tela: React.FC<{ m: TTela; t: number; alt?: number }> = ({ m, t, alt = PALCO_H }) => {
  const dur = Math.max(0.1, m.ate - m.de);
  const p = (t - m.de) / dur;
  const v = vistaEm(m, p);
  const { w, h, left, top } = posicao(m, v, alt);

  // o cursor: desliza de ponto em ponto (cada um chega no `em` da palavra), clica, e fica vivo
  const pts = [...(m.cursor ?? [])].sort((a, b) => a.em - b.em);
  let cursor: React.ReactNode = null;
  if (pts.length) {
    const prim = pts[0];
    const longe = { x: clamp(prim.x + 0.16, 0, 1), y: clamp(prim.y + 0.12, 0, 1), em: m.de };
    const seq = [longe, ...pts];
    let i = 0;
    while (i < seq.length - 1 && t >= seq[i + 1].em - 0.0001) i++;
    const a = seq[i];
    const b = seq[Math.min(i + 1, seq.length - 1)];
    let x = a.x;
    let y = a.y;
    if (b !== a) {
      const viagem = Math.min(0.7, b.em - a.em);
      const k = suave(prog(t, b.em - viagem, viagem, (u) => u));
      x = a.x + (b.x - a.x) * k;
      y = a.y + (b.y - a.y) * k;
    } else {
      // depois do último ponto: deriva leve
      x = a.x + Math.sin((t - a.em) * 2.1) * 0.006;
      y = a.y + Math.cos((t - a.em) * 1.7) * 0.005;
    }
    const px = left + x * w;
    const py = top + y * h;
    const cliques = pts.filter((q) => q.clique);
    const ultimo = [...cliques].reverse().find((q) => t >= q.em);
    const dt = ultimo ? t - ultimo.em : 9;
    const anel = dt >= 0 && dt < 0.5 ? dt / 0.5 : -1;
    const apertado = dt >= 0 && dt < 0.16 ? 1 : 0;
    cursor = (
      <>
        {anel >= 0 && ultimo ? (
          <div
            style={{
              position: "absolute",
              left: left + ultimo.x * w - 8 - anel * 36,
              top: top + ultimo.y * h - 8 - anel * 36,
              width: 16 + anel * 72,
              height: 16 + anel * 72,
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.9)",
              opacity: 1 - anel,
            }}
          />
        ) : null}
        <Cursor x={px} y={py} apertado={apertado} />
      </>
    );
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: alt, overflow: "hidden", background: "#FFFFFF" }}>
      <Img src={staticFile(`tela/${m.captura}.jpg`)} style={{ position: "absolute", left, top, width: w, height: h, maxWidth: "none" }} />
      {cursor}
    </div>
  );
};
