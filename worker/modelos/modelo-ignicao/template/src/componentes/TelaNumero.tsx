// Bloco "numero" (modo tela grande): a tela central vira o mostrador digital do computador de bordo.
// À esquerda, um mostrador de 270° com a escala redonda do valor (0 · metade · fim); o ponteiro e o
// arco de leitura varrem até o valor enquanto, à direita, o visor conta em pt-BR. O rótulo acende
// palavra por palavra. Sem números inventados: a escala só arredonda para cima o próprio valor.
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { fimDaEscala, curto, formatar } from "../formato";
import { diagramar, medir } from "../medidas";
import type { Numero, Palavra } from "../plano";
import { cor, fonte, rotulo, texto } from "../tema";
import type { Parte } from "./Painel";

const TELA = { x: 60, y: 792, w: 960, h: 480 };
// o mostrador
const C = { cx: 290, cy: 1040, r: 196 };
// o visor
const VISOR = { x: 530, y: 840, w: 450, h: 400 };

const rad = (g: number) => (g * Math.PI) / 180;
const ponto = (r: number, g: number) => ({ x: C.cx + r * Math.cos(rad(g)), y: C.cy - r * Math.sin(rad(g)) });
const anguloDe = (f: number) => 225 - 270 * Math.min(1, Math.max(0, f));
const arco = (r: number, de: number, ate: number) => {
  const a = ponto(r, de);
  const b = ponto(r, ate);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 ${Math.abs(de - ate) > 180 ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

export const TelaNumero: React.FC<{ m: Numero; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  if (parte !== "tela") return null;
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const casas = m.casas ?? 0;
  const max = fimDaEscala(m.valor, m.sufixo);
  // o número conta em ~1 s, o ponteiro acompanha (sem passar do ponto)
  const conta = prog(t, m.em - 0.05, 1.05);
  const valor = m.valor * conta;
  const f = valor / max;
  const g = anguloDe(f);

  // o visor: prefixo e sufixo menores, o número no maior corpo que cabe
  const final = formatar(m.valor, casas);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  const larguraDe = (tam: number) =>
    (prefixo ? medir(prefixo, tam * 0.4, 600) + 14 : 0) + medir(final, tam, 700, false) + (sufixo ? 14 + medir(sufixo, tam * 0.4, 600) : 0);
  let tam = 150;
  while (tam > 64 && larguraDe(tam) > VISOR.w) tam -= 2;
  const rot = diagramar(m.rotulo, { largura: VISOR.w, maximo: 48, minimo: 36, linhas: 2, peso: 700 });
  const tRot = temposDoTexto(m.rotulo, palavras, m.de, m.ate, m.rotuloEm ?? m.de);
  const aceso = conta > 0.01;

  // marcas da escala: 10 grandes e as do meio
  const marcas: React.ReactNode[] = [];
  for (let k = 0; k <= 20; k++) {
    const gk = anguloDe(k / 20);
    const maior = k % 2 === 0;
    const a = ponto(C.r * 0.9, gk);
    const b = ponto(maior ? C.r * 0.77 : C.r * 0.84, gk);
    const lida = k / 20 <= f + 1e-6 && aceso;
    marcas.push(
      <line
        key={k}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={lida ? cor.marfim : "rgba(241,237,228,0.34)"}
        strokeWidth={maior ? 5 : 3}
      />,
    );
  }
  const numeros = [0, 0.5, 1].map((k) => {
    const p = ponto(C.r * 0.6, anguloDe(k));
    return (
      <text key={k} x={p.x} y={p.y} fill={cor.marfimSuave} fontFamily={fonte} fontWeight={600} fontSize={34} textAnchor="middle" dominantBaseline="central">
        {curto(max * k)}
      </text>
    );
  });
  const ponta = ponto(C.r * 0.82, g);
  const base1 = ponto(9, g + 90);
  const base2 = ponto(9, g - 90);
  const cauda = ponto(C.r * 0.14, g + 180);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* aro do mostrador digital: fino, sem metal (é uma tela) */}
        <path d={arco(C.r, 225, -45)} fill="none" stroke="rgba(241,237,228,0.16)" strokeWidth={12} strokeLinecap="round" />
        {aceso ? <path d={arco(C.r, 225, g)} fill="none" stroke={cor.marfim} strokeWidth={12} strokeLinecap="round" /> : null}
        {marcas}
        {numeros}
        {/* ponteiro afinado com sombra */}
        <path
          d={`M${base1.x} ${base1.y} L${ponta.x} ${ponta.y} L${base2.x} ${base2.y} L${cauda.x} ${cauda.y} Z`}
          fill={aceso ? cor.marfim : cor.marfimFraco}
          style={{ filter: "drop-shadow(0 6px 5px rgba(0,0,0,0.7))" }}
        />
        <circle cx={C.cx} cy={C.cy} r={18} fill="#1A1C20" stroke="#5A6067" strokeWidth={3} />
      </svg>

      {/* o visor */}
      <div style={{ position: "absolute", left: VISOR.x, top: VISOR.y, width: VISOR.w, height: VISOR.h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Acende linhas={rot.linhas} tempos={tRot} t={t} entrelinha={1.04} style={texto(700, rot.tam, { textTransform: "uppercase", color: cor.marfimSuave })} />
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 18, whiteSpace: "nowrap" }}>
          {prefixo ? <span style={texto(600, tam * 0.4, { color: aceso ? cor.aco : cor.apagado, marginRight: 14, textTransform: "uppercase" })}>{prefixo}</span> : null}
          <span style={texto(700, tam, { lineHeight: 0.92, color: aceso ? cor.marfim : cor.apagado, fontVariantNumeric: "tabular-nums" })}>
            {aceso ? formatar(valor, casas) : final}
          </span>
          {sufixo ? <span style={texto(600, tam * 0.4, { color: aceso ? cor.aco : cor.apagado, marginLeft: 14, textTransform: "uppercase" })}>{sufixo}</span> : null}
        </div>
        {m.ilustrativo ? <Etiqueta style={{ marginTop: 22 }} /> : null}
      </div>
    </div>
  );
};

// etiqueta "ilustrativo": caixa-alta espaçada num contorno fino (o número ou a forma não vem da fala)
export const Etiqueta: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ display: "flex", ...style }}>
    <div style={rotulo(30, { padding: "8px 14px 7px", borderRadius: 8, boxShadow: "inset 0 0 0 2px rgba(154,160,167,0.6)" })}>Ilustrativo</div>
  </div>
);

export { TELA };
