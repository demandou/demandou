// Momento "rota" (modo navegador): a tela central vira o mapa do navegador em perspectiva — a
// avenida à frente, quarteirões e ruas que correm por baixo do carro, a instrução no alto, a rota
// que acende do carro até o destino no ritmo da fala e o pino com a chave de boca que se aproxima
// até a chegada. Embaixo, entre os mostradores, a condição e a luz acesa.
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { CorDaLuz, Lampada, Palavra, Rota } from "../plano";
import { corPadrao } from "./Icones";
import { cor, rotulo, texto } from "../tema";
import type { Parte } from "./Painel";

const MAPA = { x: 60, y: 792, w: 960, h: 480 };

// Câmera do navegador (metros no chão → px no mapa)
const HORIZONTE = 180;
const FOCO = 620;
const K = FOCO * 11; // foco × altura da câmera
const CARRO_Z = 30; // o carro fica a 30 m à frente da câmera (y ≈ 407)
const DISTANCIA = 112; // metros do carro até o destino quando a rota aparece
const PARADA_Z = 44; // na chegada, o destino para logo à frente do carro
const naTela = (x: number, z: number) => ({ x: MAPA.w / 2 + (FOCO * x) / z, y: HORIZONTE + K / z });

// retângulo no chão (x1..x2 para o lado, z1..z2 para a frente) → polígono no mapa
const noChao = (x1: number, x2: number, z1: number, z2: number) => {
  const a = Math.max(0.6, z1);
  const b = Math.max(0.6, z2);
  if (b <= 0.6 + 1e-6) return null;
  return [naTela(x1, a), naTela(x2, a), naTela(x2, b), naTela(x1, b)].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
};

// o símbolo do pino do destino: bandeira (padrão), chave de boca ou casa
const PINOS: Record<"bandeira" | "chave" | "casa", string[]> = {
  bandeira: ["M19 53 V8", "M19 10 H47 L39 20.5 L47 31 H19"],
  chave: ["M41 9 A13 13 0 0 0 27.5 25.5 L10.5 42.5 A4.6 4.6 0 0 0 17.5 49.5 L34.5 32.5 A13 13 0 0 0 51 19 L44 26 L36.5 23.5 L34 16 Z"],
  casa: ["M9 29 L30 11 L51 29", "M15 25 V50 H45 V25", "M26 50 V37 H34 V50"],
};
const Pino: React.FC<{ tipo: "bandeira" | "chave" | "casa"; tam: number; corTraco: string }> = ({ tipo, tam, corTraco }) => (
  <svg viewBox="0 0 60 60" width={tam} height={tam}>
    {PINOS[tipo].map((d) => (
      <path key={d} d={d} fill="none" stroke={corTraco} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
    ))}
  </svg>
);

export const TelaRota: React.FC<{
  m: Rota;
  palavras: Palavra[];
  t: number;
  inicio: number;
  fim: number;
  parte: Parte;
  corDe?: (l: Lampada) => CorDaLuz | undefined;
}> = ({ m, palavras, t, inicio, fim, parte, corDe }) => {
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const desenho = prog(t, m.rotaEm - 0.05, 0.6);
  const anda = prog(t, m.rotaEm + 0.1, Math.max(0.7, m.chegadaEm - m.rotaEm + 0.1));
  const chegou = prog(t, m.chegadaEm - 0.05, 0.35);
  const instr = diagramar(m.instrucao, { largura: MAPA.w - 186, maximo: 56, minimo: 44, linhas: 2, altura: 112, peso: 700 });
  const tInstr = temposDoTexto(m.instrucao, palavras, m.de, m.ate);
  const cond = m.condicao ? diagramar(m.condicao, { largura: 420, maximo: 48, minimo: 36, linhas: 1, peso: 700 }) : null;
  // "Alerta" em cima da condição só quando a luz da rota é vermelha
  const alerta = !!m.icone && (corDe?.(m.icone) ?? corPadrao(m.icone)) === "vermelho";
  const tCond = m.condicao ? temposDoTexto(m.condicao, palavras, m.de, m.ate) : [];
  const destino = diagramar(m.destino, { largura: 330, maximo: 44, minimo: 34, linhas: 1, peso: 700, espacamento: 0.04 });

  // o carro anda: o chão corre por baixo e o destino se aproxima
  const andou = (DISTANCIA - (PARADA_Z - CARRO_Z)) * anda;
  const destinoZ = CARRO_Z + DISTANCIA - andou;

  // quarteirões, ruas transversais a cada 36 m e duas paralelas à avenida
  const chao: React.ReactNode[] = [];
  const ruasZ = Array.from({ length: 10 }, (_, i) => 26 + i * 36);
  const colunas: [number, number][] = [
    [-160, -36],
    [-28, -9],
    [9, 28],
    [36, 160],
  ];
  ruasZ.forEach((z0, i) => {
    const z1 = (ruasZ[i - 1] ?? -10) + 4.5 + 3;
    const z2 = z0 - 4.5 - 3;
    colunas.forEach(([a, b], k) => {
      const q = noChao(a + 3, b - 3, z1 - andou, z2 - andou);
      if (q) chao.push(<polygon key={`q${i}-${k}`} points={q} fill="#1E2127" stroke="rgba(241,237,228,0.08)" strokeWidth={1.5} />);
    });
    const r = noChao(-400, 400, z0 - 4.5 - andou, z0 + 4.5 - andou);
    if (r) chao.push(<polygon key={`r${i}`} points={r} fill="#2C3037" />);
  });
  [-32, 32].forEach((x0) => {
    const q = noChao(x0 - 4, x0 + 4, 0.6, 700);
    if (q) chao.push(<polygon key={`p${x0}`} points={q} fill="#2C3037" />);
  });
  const tracos: React.ReactNode[] = [];
  for (let z = -(andou % 12); z < 420; z += 12) {
    const q = noChao(-0.25, 0.25, z, z + 4.5);
    if (q) tracos.push(<polygon key={`t${z.toFixed(2)}`} points={q} fill="rgba(241,237,228,0.24)" />);
  }
  const avenida = noChao(-8, 8, 0.6, 700);
  const bordas = [noChao(-8.4, -7.9, 0.6, 700), noChao(7.9, 8.4, 0.6, 700)];
  const rotaToda = noChao(-1.3, 1.3, CARRO_Z - 4, destinoZ);
  const rotaDita = noChao(-1.3, 1.3, CARRO_Z - 4, CARRO_Z - 4 + (destinoZ - CARRO_Z + 4) * desenho);
  const pino = naTela(0, destinoZ);
  const tamPino = Math.max(64, Math.min(100, 4400 / destinoZ));
  const carroY = naTela(0, CARRO_Z).y;
  const aceso = desenho > 0.1;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {parte === "tela" ? (
        <>
      <div style={{ position: "absolute", left: MAPA.x, top: MAPA.y, width: MAPA.w, height: MAPA.h, borderRadius: 28, overflow: "hidden", background: "#0C0D10" }}>
        <svg width={MAPA.w} height={MAPA.h} style={{ position: "absolute", inset: 0 }}>
          {chao}
          {avenida ? <polygon points={avenida} fill="#32363D" /> : null}
          {bordas.map((b, i) => (b ? <polygon key={i} points={b} fill="rgba(241,237,228,0.26)" /> : null))}
          {tracos}
          {/* a rota: esboço apagado; acende do carro até o destino quando é dita */}
          {rotaToda ? <polygon points={rotaToda} fill="rgba(241,237,228,0.13)" /> : null}
          {rotaDita && desenho > 0.01 ? <polygon points={rotaDita} fill={cor.marfim} /> : null}
        </svg>
        {/* névoa do horizonte: o longe some no escuro */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 110, height: 140, background: "linear-gradient(180deg, #0C0D10 30%, rgba(12,13,16,0))" }} />

        {/* a seta do carro, deitada no chão */}
        <svg width={MAPA.w} height={MAPA.h} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${MAPA.w / 2} ${carroY}) scale(1 0.8)`}>
            <circle r={42} fill={cor.vidro} stroke={cor.marfim} strokeWidth={5} />
            <path d="M0 -23 L18 18 L0 8 L-18 18 Z" fill={cor.marfim} />
          </g>
        </svg>

        {/* destino: pino com a chave de boca em pé sobre o ponto; acende na chegada */}
        <div style={{ position: "absolute", left: pino.x - tamPino / 2, top: pino.y - tamPino - 18 }}>
          <div
            style={{
              width: tamPino,
              height: tamPino,
              borderRadius: tamPino * 0.27,
              background: chegou > 0.5 ? cor.marfim : cor.vidro,
              boxShadow: `inset 0 0 0 4px ${aceso ? cor.marfim : cor.marfimFraco}, 0 10px 22px rgba(0,0,0,0.7)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scale: String(1 + 0.1 * Math.sin(Math.PI * chegou)),
            }}
          >
            <Pino tipo={m.pino ?? "bandeira"} tam={tamPino * 0.64} corTraco={chegou > 0.5 ? cor.carcaca : aceso ? cor.marfim : cor.marfimFraco} />
          </div>
          <div style={{ position: "absolute", left: tamPino / 2 - 3, top: tamPino, width: 6, height: 18, borderRadius: 3, background: aceso ? cor.marfim : cor.marfimFraco }} />
        </div>
        <div style={{ position: "absolute", left: pino.x + tamPino / 2 + 22, top: pino.y - 18 - tamPino / 2 - 30, height: 60, display: "flex", alignItems: "center" }}>
          <span style={texto(700, destino.tam, { textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", color: aceso ? cor.marfim : cor.marfimSuave })}>
            {destino.linhas[0]}
          </span>
        </div>

        {/* instrução no alto, como num navegador */}
        <div style={{ position: "absolute", left: 0, top: 0, width: MAPA.w, height: 140, background: "linear-gradient(180deg, rgba(7,8,10,0.97) 74%, rgba(7,8,10,0))" }} />
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 18,
            width: 92,
            height: 92,
            borderRadius: 22,
            background: cor.marfim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.25 + 0.75 * prog(t, tInstr[0] ?? m.de, 0.3),
          }}
        >
          <svg viewBox="0 0 60 60" width={64} height={64}>
            <path d="M30 6 L48 26 H36 V54 H24 V26 H12 Z" fill={cor.carcaca} />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 148, top: 14, height: 100, width: MAPA.w - 186, display: "flex", alignItems: "center" }}>
          <Acende linhas={instr.linhas} tempos={tInstr} t={t} entrelinha={1.02} style={texto(700, instr.tam, { textTransform: "uppercase" })} />
        </div>
      </div>

        </>
      ) : null}
      {parte === "fora" ? (
        <>
      {/* condição entre os mostradores compactos, acima da fileira de luzes */}
      {cond ? (
        <div style={{ position: "absolute", left: 330, width: 420, top: 1330, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {alerta ? <div style={rotulo(32)}>Alerta</div> : null}
          <Acende linhas={cond.linhas} tempos={tCond} t={t} alinhar="center" style={texto(700, cond.tam, { textTransform: "uppercase", marginTop: alerta ? 10 : 22 })} />
        </div>
      ) : null}
        </>
      ) : null}
    </div>
  );
};
