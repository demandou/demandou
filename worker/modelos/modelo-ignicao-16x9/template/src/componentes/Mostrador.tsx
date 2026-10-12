// Mostrador analógico (velocímetro ou conta-giros), desenhado em px no tamanho em que está na tela:
// aro de metal escovado, escala de 270° com marcas e números, arco de leitura, ponteiro afinado com
// sombra e o visor digital embaixo. A luz de fundo (0–1) acende as marcas na ignição e escurece
// quando o motor desliga — apagado, tudo continua lá como esboço.
import type { Circulo } from "../layout";
import { GIRO_MAX, VEL_MAX } from "../layout";
import { medir } from "../medidas";
import { cor, fonte } from "../tema";

const rad = (g: number) => (g * Math.PI) / 180;
const anguloDe = (v: number, max: number) => 225 - (270 * Math.min(max, Math.max(0, v))) / max;
const ponto = (r: number, graus: number) => ({ x: r * Math.cos(rad(graus)), y: -r * Math.sin(rad(graus)) });

const arco = (r: number, de: number, ate: number) => {
  // de/ate em graus (de > ate: sentido horário na tela)
  const a = ponto(r, de);
  const b = ponto(r, ate);
  const grande = Math.abs(de - ate) > 180 ? 1 : 0;
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)} A${r} ${r} 0 ${grande} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

export const Mostrador: React.FC<{
  c: Circulo;
  tipo: "vel" | "giro";
  valor: number;
  luz: number;
  // o ponteiro e o visor aparecem? (0–1; a escala fica sempre, como esboço)
  presenca?: number;
  // 0–1: o mostrador vira um lado da comparação (some a escala de números, a unidade e o visor;
  // aparece o nome do lado)
  neutro?: number;
  nome?: string;
  // o nome acende quando o lado é dito (antes, esboço)
  nomeAceso?: number;
}> = ({ c, tipo, valor, luz, presenca = 1, neutro = 0, nome, nomeAceso = 1 }) => {
  const { r } = c;
  const max = tipo === "vel" ? VEL_MAX : GIRO_MAX;
  const passo = tipo === "vel" ? 20 : 1;
  const sub = tipo === "vel" ? 10 : 0.5;
  const pad = 30;
  const lado = 2 * (r + pad);
  const marfim = (o: number) => `rgba(241,237,228,${(0.17 + 0.83 * luz) * o})`;

  // números: o mais denso que caiba no arco sem encostar
  const tamNum = Math.max(32, r * 0.165);
  const rNum = r * 0.62;
  const larguraNum = medir(String(max), tamNum, 600, false);
  const candidatos = tipo === "vel" ? [20, 40, 60, 80] : [1, 2, 4];
  const passoRotulo =
    candidatos.find((pr) => rNum * rad(270) * (pr / max) >= larguraNum * 1.3 + 10) ?? candidatos[candidatos.length - 1];

  const marcas: React.ReactNode[] = [];
  for (let v = 0; v <= max + 1e-6; v += sub) {
    const maior = Math.abs(v / passo - Math.round(v / passo)) < 1e-6;
    const g = anguloDe(v, max);
    const a = ponto(r * 0.9, g);
    const b = ponto(maior ? r * 0.77 : r * 0.84, g);
    marcas.push(
      <line
        key={`m${v}`}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={marfim(maior ? 1 : 0.7)}
        strokeWidth={maior ? Math.max(4, r * 0.022) : Math.max(2.4, r * 0.012)}
        strokeLinecap="butt"
      />,
    );
  }
  // mostrador compacto (modo tela grande): sem números, só marcas, ponteiro e o visor grande
  const compacto = r < 160;
  const numeros: React.ReactNode[] = [];
  for (let v = 0; v <= max + 1e-6 && !compacto; v += passoRotulo) {
    const p = ponto(rNum, anguloDe(v, max));
    numeros.push(
      <text
        key={`n${v}`}
        x={p.x}
        y={p.y}
        fill={marfim(1)}
        opacity={1 - neutro}
        fontFamily={fonte}
        fontWeight={600}
        fontSize={tamNum}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {Math.round(v)}
      </text>,
    );
  }

  const gValor = anguloDe(valor, max);
  const giroNeedle = 90 - gValor;
  const larguraBase = Math.max(5.5, r * 0.03);
  const ponta = r * 0.86;
  const cauda = r * 0.16;
  const agulha = `M${-larguraBase} 0 L-1.6 ${-ponta} L1.6 ${-ponta} L${larguraBase} 0 L${larguraBase * 0.8} ${cauda} L${-larguraBase * 0.8} ${cauda} Z`;

  // o visor fica logo abaixo do cubo (acima da linha dos números 0 e máx.); a unidade, abaixo dela
  const tamVisor = compacto ? Math.max(40, r * 0.34) : Math.max(36, r * 0.19);
  const visorY = compacto ? r * 0.36 : r * 0.26;
  const tamUnidade = 30;
  const unidade = tipo === "vel" ? "km/h" : r >= 170 ? "×1000 rpm" : "rpm";
  const visor = tipo === "vel" ? String(Math.round(valor)) : valor < 0.05 ? "P" : valor < 1.3 ? "N" : "D";
  // o nome do lado cabe na boca do mostrador (entre os números 0 e máx.)
  const tamNome = nome ? Math.max(30, Math.min(40, (r * 1.15) / Math.max(1, medir(nome, 1, 700, true, 0.08)))) : 0;
  const idAro = `aro-${tipo}`;
  const idFace = `face-${tipo}`;

  return (
    <svg
      width={lado}
      height={lado}
      viewBox={`${-r - pad} ${-r - pad} ${lado} ${lado}`}
      style={{ position: "absolute", left: c.cx - r - pad, top: c.cy - r - pad, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={idAro} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cor.aroClaro} />
          <stop offset="0.45" stopColor={cor.aro} />
          <stop offset="1" stopColor={cor.aroEscuro} />
        </linearGradient>
        <radialGradient id={idFace} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#171A1E" />
          <stop offset="1" stopColor="#0A0B0D" />
        </radialGradient>
      </defs>
      {/* sombra de profundidade, face e aro */}
      <circle r={r} fill={`url(#${idFace})`} style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.6))" }} />
      <circle r={r - Math.max(3, r * 0.025)} fill="none" stroke={`url(#${idAro})`} strokeWidth={Math.max(6, r * 0.05)} />
      <circle r={r * 0.948} fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth={2.5} />
      {/* faixa de rotação alta (conta-giros): tracejado claro, sem vermelho — vermelho é só alerta */}
      {tipo === "giro" ? (
        <path d={arco(r * 0.87, anguloDe(6.5, max), anguloDe(max, max))} opacity={1 - neutro} fill="none" stroke={marfim(0.55)} strokeWidth={r * 0.06} strokeDasharray={`${Math.max(3, r * 0.018)} ${Math.max(3, r * 0.018)}`} />
      ) : null}
      {marcas}
      {numeros}
      {/* arco de leitura: acompanha o ponteiro por dentro do aro */}
      {valor > 0.001 * max ? (
        <path d={arco(r * 0.932, 225, gValor)} fill="none" stroke={`rgba(241,237,228,${0.5 * luz * presenca})`} strokeWidth={Math.max(3, r * 0.02)} strokeLinecap="round" />
      ) : null}
      {/* visor digital e unidade */}
      <text
        x={0}
        y={visorY}
        fill={`rgba(241,237,228,${(0.12 + 0.88 * luz) * presenca * (1 - neutro)})`}
        fontFamily={fonte}
        fontWeight={600}
        fontSize={tamVisor}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {visor}
      </text>
      <text
        x={0}
        y={compacto ? visorY + tamVisor * 0.5 + tamUnidade * 0.72 : r * 0.62}
        fill={`rgba(154,160,167,${(0.25 + 0.75 * luz) * presenca * (1 - neutro)})`}
        fontFamily={fonte}
        fontWeight={600}
        fontSize={tamUnidade}
        letterSpacing="0.1em"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {unidade.toUpperCase()}
      </text>
      {/* o nome do lado (comparação), no lugar da unidade e do visor */}
      {nome && neutro > 0.01 ? (
        <text
          x={0}
          y={r * 0.5}
          fill={`rgba(241,237,228,${(0.3 + 0.7 * luz) * neutro * (0.2 + 0.8 * nomeAceso)})`}
          fontFamily={fonte}
          fontWeight={700}
          fontSize={tamNome}
          letterSpacing="0.08em"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {nome.toUpperCase()}
        </text>
      ) : null}
      {/* ponteiro com sombra (nunca brilho) e o cubo de metal */}
      <g transform={`rotate(${giroNeedle})`} opacity={presenca} style={{ filter: "drop-shadow(0 6px 5px rgba(0,0,0,0.7))" }}>
        <path d={agulha} fill={`rgba(241,237,228,${0.35 + 0.65 * luz})`} />
      </g>
      <circle r={Math.max(12, r * 0.085)} fill="#1A1C20" stroke={`url(#${idAro})`} strokeWidth={Math.max(2.5, r * 0.018)} />
      <circle r={Math.max(3, r * 0.022)} fill={cor.aroClaro} />
    </svg>
  );
};
