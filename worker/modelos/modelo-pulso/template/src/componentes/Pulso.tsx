// O traçado do pulso (como o de um monitor cardíaco): uma caneta corre da esquerda para a direita e
// cada batimento é um pico. Na frente da caneta, a linha espera a lápis (tracejada). Um batimento de
// alerta sai mais alto e vermelho.
import { cor, ZONAS } from "../tema";

// forma de um batimento: onda P, pico R, vale S e onda T (negativo = para cima)
const batimento = (dx: number, altura: number) =>
  -0.12 * altura * Math.exp(-(((dx + 36) / 9) ** 2)) +
  0.12 * altura * Math.exp(-(((dx + 7) / 3.2) ** 2)) -
  altura * Math.exp(-((dx / 4.6) ** 2)) +
  0.34 * altura * Math.exp(-(((dx - 8) / 4.2) ** 2)) -
  0.2 * altura * Math.exp(-(((dx - 40) / 11) ** 2));

export const Pulso: React.FC<{
  x: number;
  y: number;
  largura: number;
  altura: number;
  // posição da caneta, de 0 a 1
  caneta: number;
  // batimentos: posição (0–1) e se é de alerta
  batidas: { pos: number; alerta?: boolean }[];
  corTraco?: string;
}> = ({ x, y, largura, altura, caneta, batidas, corTraco = cor.tinta }) => {
  const base = y + altura * 0.66;
  const alto = altura * 0.5;
  const pontos: { x: number; y: number }[] = [];
  const xCaneta = x + largura * caneta;
  for (let px = 0; px <= largura; px += 3) {
    let dy = 0;
    for (const b of batidas) dy += batimento(px - b.pos * largura, b.alerta ? alto * 1.6 : alto);
    pontos.push({ x: x + px, y: base + dy });
  }
  const ate = pontos.filter((p) => p.x <= xCaneta);
  const linha = (ps: { x: number; y: number }[]) => ps.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
  const alertas = batidas.filter((b) => b.alerta).map((b) => x + b.pos * largura);
  const cabeca = ate[ate.length - 1];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* a lápis: o resto da linha */}
      <line x1={Math.max(x, xCaneta + 14)} x2={x + largura} y1={base} y2={base} stroke={cor.esboco} strokeWidth={4} strokeDasharray="12 12" strokeLinecap="round" />
      {ate.length > 1 ? <path d={linha(ate)} fill="none" stroke={corTraco} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" /> : null}
      {/* o batimento de alerta por cima, em vermelho */}
      {alertas.map((xa, i) => {
        const trecho = ate.filter((p) => p.x >= xa - 22 && p.x <= xa + 26);
        return trecho.length > 1 ? <path key={i} d={linha(trecho)} fill="none" stroke={ZONAS[4].cor} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" /> : null;
      })}
      {cabeca && caneta > 0.002 && caneta < 0.999 ? <circle cx={cabeca.x} cy={cabeca.y} r={10} fill={corTraco} /> : null}
    </svg>
  );
};
