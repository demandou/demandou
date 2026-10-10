// As anotações do Palco: traços limpos no azul do modelo, desenhados quando a palavra é dita, presos
// ao ponto da imagem (acompanham a aproximação lenta da foto).
// - circulo: elipse desenhada à mão, com uma volta um pouco além do começo;
// - seta: haste levemente curva que nasce longe do ponto e termina nele, com a ponta no fim;
// - marca: a nota grifada (texto sobre a faixa azul) ou, sem texto, a faixa de marca-texto sobre
//   uma área (linha de um print);
// - foco: o quadrado de foco da câmera que fecha no ponto, com o toque;
// - xis: dois traços cruzados sobre o que não deve estar ali.
import { larguraTexto } from "../medida";
import type { Anotacao } from "../plano";
import { COR, FONTE, PAINEL, SOMBRA_TRACO, prog, suave } from "../tema";

const TRACO = 8;

// pílula de texto das anotações (azul, texto claro)
export const Pilula: React.FC<{ texto: string; x: number; y: number; e: number; tamanho?: number; ancora?: "centro" | "esq" | "dir"; W: number; H: number }> = ({
  texto,
  x,
  y,
  e,
  tamanho = 32,
  ancora = "centro",
  W,
  H,
}) => {
  const alt = Math.round(tamanho * 1.7);
  const pad = Math.round(tamanho * 0.6);
  const w = Math.ceil(larguraTexto(texto, tamanho, { peso: 800 })) + pad * 2;
  let left = ancora === "centro" ? x - w / 2 : ancora === "esq" ? x : x - w;
  left = Math.max(14, Math.min(W - 14 - w, left));
  const top = Math.max(14, Math.min(H - 14 - alt, y - alt / 2));
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: alt,
        borderRadius: alt / 2,
        background: COR.azul,
        boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
        clipPath: `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0 round ${alt / 2}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: tamanho,
        color: COR.branco,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const UmaAnotacao: React.FC<{ a: Anotacao; px: number; py: number; W: number; H: number; t: number; ate: number }> = ({ a, px, py, W, H, t, ate }) => {
  const fim = a.ate ?? ate;
  if (t < a.em - 0.02 || t >= fim) return null;
  const sai = a.ate !== undefined ? prog(t, fim - 0.2, 0.2, suave) : 0;
  const tam = limitar(a.tamanho ?? 0.3, 0.12, 0.6) * PAINEL.w;
  const svg = (filhos: React.ReactNode) => (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: SOMBRA_TRACO }}>
      {filhos}
    </svg>
  );
  const estiloTraco = { fill: "none", stroke: COR.azul, strokeWidth: TRACO, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (a.tipo === "circulo") {
    const p = prog(t, a.em, 0.5, suave);
    const rx = tam / 2;
    const ry = rx * 0.84;
    const giro = (-10 * Math.PI) / 180;
    const pts: string[] = [];
    // um pouco mais de uma volta, fechando levemente para dentro (traço de mão, sem tremer)
    const voltas = 1.08;
    for (let k = 0; k <= 72; k++) {
      const f = k / 72;
      const th = -Math.PI * 0.62 + f * voltas * 2 * Math.PI;
      const r = 1 - 0.05 * f;
      const ex = Math.cos(th) * rx * r;
      const ey = Math.sin(th) * ry * r;
      pts.push(`${(px + ex * Math.cos(giro) - ey * Math.sin(giro)).toFixed(1)},${(py + ex * Math.sin(giro) + ey * Math.cos(giro)).toFixed(1)}`);
    }
    const lado = px > W / 2 ? "esq" : "dir";
    const eT = prog(t, a.em + 0.3, 0.3);
    return (
      <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
        {svg(<polyline points={pts.join(" ")} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} {...estiloTraco} />)}
        {a.texto && eT > 0 ? (
          <Pilula texto={a.texto} x={lado === "esq" ? px - rx - 18 : px + rx + 18} y={py - ry * 0.55} e={eT} ancora={lado === "esq" ? "dir" : "esq"} W={W} H={H} />
        ) : null}
      </div>
    );
  }

  if (a.tipo === "seta") {
    const vem = a.vem ?? (py > H * 0.5 ? "cima" : "baixo");
    const L = Math.max(150, tam * 0.85);
    const dx = vem === "esq" ? -1 : vem === "dir" ? 1 : 0;
    const dy = vem === "cima" ? -1 : vem === "baixo" ? 1 : 0;
    // a ponta para um pouco antes do ponto; a cauda fica dentro do painel
    const hx = px + dx * 18;
    const hy = py + dy * 18;
    const tx = limitar(px + dx * L, 40, W - 40);
    const ty = limitar(py + dy * L, 40, H - 40);
    // curva leve: o controle sai para o lado
    const cx = (hx + tx) / 2 + dy * L * 0.18;
    const cy = (hy + ty) / 2 - dx * L * 0.18;
    const ph = prog(t, a.em, 0.38, suave);
    const pp = prog(t, a.em + 0.3, 0.16);
    // direção da ponta: do controle para a ponta
    const ang = Math.atan2(hy - cy, hx - cx);
    const c = 34;
    const p1 = { x: hx - c * Math.cos(ang - 0.5), y: hy - c * Math.sin(ang - 0.5) };
    const p2 = { x: hx - c * Math.cos(ang + 0.5), y: hy - c * Math.sin(ang + 0.5) };
    const eT = prog(t, a.em + 0.05, 0.3);
    return (
      <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
        {svg(
          <>
            <path d={`M ${tx} ${ty} Q ${cx} ${cy} ${hx} ${hy}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ph} {...estiloTraco} />
            {pp > 0 ? (
              <path
                d={`M ${p1.x} ${p1.y} L ${hx} ${hy} L ${p2.x} ${p2.y}`}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - pp}
                {...estiloTraco}
              />
            ) : null}
          </>,
        )}
        {a.texto && eT > 0 ? (
          <Pilula
            texto={a.texto}
            x={tx + dx * 16}
            y={ty + dy * 34}
            e={eT}
            ancora={vem === "esq" ? "dir" : vem === "dir" ? "esq" : "centro"}
            W={W}
            H={H}
          />
        ) : null}
      </div>
    );
  }

  if (a.tipo === "marca") {
    const e = prog(t, a.em, 0.4, suave);
    if (a.texto) {
      // a nota grifada: texto claro sobre a faixa azul, revelada da esquerda para a direita
      const tamanho = 40;
      const w = Math.ceil(larguraTexto(a.texto, tamanho, { peso: 800 })) + 40;
      const h = Math.round(tamanho * 1.45);
      const left = limitar(px - w / 2, 16, W - 16 - w);
      const top = limitar(py - h / 2, 16, H - 16 - h);
      return (
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: w,
            height: h,
            opacity: 1 - sai,
            transform: "rotate(-1.5deg)",
            clipPath: `inset(-4px ${((1 - e) * 100).toFixed(2)}% -4px -4px)`,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: COR.azul, borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.28)" }} />
          <div style={{ position: "absolute", left: 20, top: 0, height: h, lineHeight: `${h}px`, fontFamily: FONTE, fontWeight: 800, fontSize: tamanho, color: COR.branco, whiteSpace: "nowrap" }}>
            {a.texto}
          </div>
        </div>
      );
    }
    // faixa de marca-texto sobre uma área (linha de um print)
    const w = limitar(a.tamanho ?? 0.5, 0.08, 1) * PAINEL.w;
    const h = limitar(a.altura ?? 0.05, 0.02, 0.3) * PAINEL.h;
    return (
      <div
        style={{
          position: "absolute",
          left: px - w / 2,
          top: py - h / 2,
          width: w * e,
          height: h,
          background: COR.grifo,
          mixBlendMode: "multiply",
          borderRadius: 4,
          opacity: 1 - sai,
        }}
      />
    );
  }

  if (a.tipo === "foco") {
    // o quadrado de foco fecha no ponto e dá um leve "travar"; o toque é um anel que se abre
    const e = prog(t, a.em, 0.34);
    const trava = prog(t, a.em + 0.42, 0.12) * (1 - prog(t, a.em + 0.54, 0.14));
    const s = tam * (1.4 - 0.4 * e) * (1 - 0.05 * trava);
    const c = s * 0.22;
    const x0 = px - s / 2;
    const y0 = py - s / 2;
    const cantos = [
      `M ${x0} ${y0 + c} L ${x0} ${y0} L ${x0 + c} ${y0}`,
      `M ${x0 + s - c} ${y0} L ${x0 + s} ${y0} L ${x0 + s} ${y0 + c}`,
      `M ${x0 + s} ${y0 + s - c} L ${x0 + s} ${y0 + s} L ${x0 + s - c} ${y0 + s}`,
      `M ${x0 + c} ${y0 + s} L ${x0} ${y0 + s} L ${x0} ${y0 + s - c}`,
    ];
    const toque = prog(t, a.em - 0.05, 0.55);
    const eT = prog(t, a.em + 0.45, 0.3);
    return (
      <div style={{ position: "absolute", inset: 0, opacity: (1 - sai) * Math.min(1, e * 2) }}>
        {svg(
          <>
            {cantos.map((d, i) => (
              <path key={i} d={d} {...estiloTraco} strokeWidth={7} />
            ))}
            {toque < 1 ? <circle cx={px} cy={py} r={18 + 70 * toque} fill="none" stroke={COR.branco} strokeWidth={5} opacity={0.85 * (1 - toque)} /> : null}
          </>,
        )}
        {a.texto && eT > 0 ? <Pilula texto={a.texto} x={px} y={py + tam / 2 + 50} e={eT} W={W} H={H} /> : null}
      </div>
    );
  }

  // xis
  const s = tam * 0.62;
  const p1 = prog(t, a.em, 0.2, suave);
  const p2 = prog(t, a.em + 0.16, 0.2, suave);
  const eT = prog(t, a.em + 0.3, 0.3);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {svg(
        <>
          <path d={`M ${px - s / 2} ${py - s / 2} L ${px + s / 2} ${py + s / 2}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p1} {...estiloTraco} strokeWidth={11} />
          {p2 > 0 ? <path d={`M ${px + s / 2} ${py - s / 2} L ${px - s / 2} ${py + s / 2}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p2} {...estiloTraco} strokeWidth={11} /> : null}
        </>,
      )}
      {a.texto && eT > 0 ? <Pilula texto={a.texto} x={px} y={py + s / 2 + 44} e={eT} W={W} H={H} /> : null}
    </div>
  );
};
