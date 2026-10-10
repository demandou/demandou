// O lance visto de cima, em perspectiva leve: gramado com faixas, linhas de giz, fichas, bola e setas.
import { prog, Traco } from "../anim";
import {
  comprimento,
  faixasDoCampo,
  MEDIDAS,
  pontoNaCurva,
  projetar,
  raioFicha,
  tangenteNaCurva,
  trechoDaCurva,
  type Curva,
} from "../campo";
import { bolaEm, CHUTE, CORRIDA, curvaDoChute, curvaDoPasse, PASSE, posicaoEm, telaDoJogador } from "../lance";
import type { Campo } from "../plano";
import { cor, fonte, H, W } from "../tema";
import { BolaSvg, Etiqueta, Ficha } from "./Pecas";

const pt = (x: number, y: number, h = 0) => {
  const p = projetar(x, y, h);
  return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
};

// as linhas do campo, na ordem em que se desenham
const LINHAS: string[] = (() => {
  const { grandeArea: g, pequenaArea: pq, penalti, raioArco } = MEDIDAS;
  const gx = g.largura / 2;
  const px = pq.largura / 2;
  const arco: string[] = [];
  const phi0 = Math.acos((g.fundo - penalti) / raioArco);
  for (let i = 0; i <= 24; i++) {
    const f = -phi0 + (2 * phi0 * i) / 24;
    arco.push(pt(raioArco * Math.sin(f), penalti + raioArco * Math.cos(f)));
  }
  return [
    `M ${pt(-44, 0)} L ${pt(44, 0)}`,
    `M ${pt(-gx, 0)} L ${pt(-gx, g.fundo)} L ${pt(gx, g.fundo)} L ${pt(gx, 0)}`,
    `M ${pt(-px, 0)} L ${pt(-px, pq.fundo)} L ${pt(px, pq.fundo)} L ${pt(px, 0)}`,
    `M ${arco.join(" L ")}`,
  ];
})();

// o gol em perspectiva: traves e travessão na frente, fundo da rede atrás
const GOL_PATHS = (() => {
  const m = MEDIDAS.gol / 2;
  const hg = MEDIDAS.alturaGol;
  const fundo = -2;
  const frente = `M ${pt(-m, 0)} L ${pt(-m, 0, hg)} L ${pt(m, 0, hg)} L ${pt(m, 0)}`;
  const tras = `M ${pt(-m, fundo)} L ${pt(-m, fundo, hg - 0.5)} L ${pt(m, fundo, hg - 0.5)} L ${pt(m, fundo)} Z`;
  const laterais = `M ${pt(-m, 0, hg)} L ${pt(-m, fundo, hg - 0.5)} M ${pt(m, 0, hg)} L ${pt(m, fundo, hg - 0.5)} M ${pt(-m, 0)} L ${pt(-m, fundo)} M ${pt(m, 0)} L ${pt(m, fundo)}`;
  const rede: string[] = [];
  for (let i = 1; i < 10; i++) {
    const x = -m + (2 * m * i) / 10;
    rede.push(`M ${pt(x, fundo)} L ${pt(x, fundo, hg - 0.5)}`);
  }
  for (let i = 1; i < 4; i++) {
    const h = ((hg - 0.5) * i) / 4;
    rede.push(`M ${pt(-m, fundo, h)} L ${pt(m, fundo, h)}`);
  }
  return { frente, tras, laterais, rede: rede.join(" ") };
})();

const Seta: React.FC<{ c: Curva; u0: number; u1: number; p: number; cor: string; largura: number; tracejada?: boolean; ponta: number }> = ({
  c,
  u0,
  u1,
  p,
  cor: tinta,
  largura,
  tracejada,
  ponta,
}) => {
  if (p <= 0.001) return null;
  const u = u0 + (u1 - u0) * p;
  const fim = pontoNaCurva(c, u);
  const tg = tangenteNaCurva(c, u);
  const ang = Math.atan2(tg.y, tg.x);
  const base = { x: fim.x - Math.cos(ang) * ponta * 0.75, y: fim.y - Math.sin(ang) * ponta * 0.75 };
  // a linha para na base da ponta
  const uLinha = Math.max(u0, u - (ponta * 0.6) / Math.max(1, comprimento(c)));
  const asa = (s: number) => ({ x: base.x + Math.cos(ang + (s * Math.PI) / 2) * ponta * 0.55, y: base.y + Math.sin(ang + (s * Math.PI) / 2) * ponta * 0.55 });
  const a1 = asa(1);
  const a2 = asa(-1);
  return (
    <g>
      <path
        d={trechoDaCurva(c, u0, uLinha)}
        fill="none"
        stroke={tinta}
        strokeWidth={largura}
        strokeLinecap={tracejada ? "butt" : "round"}
        strokeDasharray={tracejada ? "22 15" : undefined}
      />
      <polygon points={`${fim.x},${fim.y} ${a1.x},${a1.y} ${a2.x},${a2.y}`} fill={tinta} stroke={tinta} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
};

export const CampoVista: React.FC<{
  campo: Campo;
  t: number;
  // quando a prancheta começa a aparecer
  entra: number;
  // primeira prancheta do vídeo: as linhas se desenham
  desenhar: boolean;
  // 0→1: a bola do campo some (quando a câmera entra no gol, a bola passa a ser a da vista de frente)
  semBola?: number;
}> = ({ campo, t, entra, desenhar, semBola = 0 }) => {
  const faixas = faixasDoCampo();
  const pLinhas = (i: number) => (desenhar ? prog(t, entra + i * 0.07, 0.45) : 1);
  const pGol = desenhar ? prog(t, entra + 0.2, 0.4) : 1;
  const acoes = [...campo.acoes].sort((a, b) => a.em - b.em);
  const goleiro = campo.jogadores.find((j) => j.time === "goleiro");

  // fichas: ordem de profundidade (a mais perto da câmera por cima)
  const fichas = campo.jogadores
    .map((j, i) => {
      const tela = telaDoJogador(campo, j.id, t);
      return { j, i, tela, r: raioFicha(tela.s) };
    })
    .sort((a, b) => a.tela.y - b.tela.y);

  const centroDaFicha = (id: string) => {
    const tela = telaDoJogador(campo, id, t);
    const r = raioFicha(tela.s);
    return { x: tela.x, y: tela.y - r * 0.62, r };
  };

  const bola = bolaEm(campo, t);
  const etiquetas: React.ReactNode[] = [];

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* gramado: faixas de corte; atrás do gol, mais escuro */}
        <rect x={-W} y={-H} width={W * 3} height={H * 3} fill={cor.foraDoCampo} />
        {faixas.map((f, i) => (
          <rect
            key={i}
            x={-W}
            y={f.y0}
            width={W * 3}
            height={f.y1 - f.y0 + 0.5}
            fill={f.fora ? (f.clara ? cor.foraDoCampo : "#10442A") : f.clara ? cor.gramaClara : cor.grama}
          />
        ))}

        {/* linhas de giz */}
        {LINHAS.map((d, i) => (
          <Traco key={i} d={d} p={pLinhas(i)} cor={cor.giz} largura={6} opacity={0.94} />
        ))}
        {(() => {
          const s = projetar(0, MEDIDAS.penalti);
          return <circle cx={s.x} cy={s.y} r={6 * pLinhas(3)} fill={cor.giz} />;
        })()}

        {/* espaço livre no gol (atrás das traves, na frente da rede) */}
        {acoes.map((a, i) => {
          if (a.tipo !== "espaco") return null;
          const p = prog(t, a.em, 0.5);
          if (p <= 0.001) return null;
          const m = MEDIDAS.gol / 2;
          const gx = goleiro ? posicaoEm(campo, goleiro.id, t).x : 0;
          const u0 = a.lado === "esquerda" ? -m + 0.15 : m - 0.15;
          const alvo = a.lado === "esquerda" ? Math.min(m, gx - 1.2) : Math.max(-m, gx + 1.2);
          const u1 = u0 + (alvo - u0) * p;
          const h = MEDIDAS.alturaGol - 0.12;
          return (
            <g key={`esp-${i}`}>
              <polygon points={`${pt(u0, -0.05)} ${pt(u1, -0.05)} ${pt(u1, -0.05, h)} ${pt(u0, -0.05, h)}`} fill={cor.placarFundo} />
              <path d={`M ${pt(u0, 0)} L ${pt(u1, 0)}`} stroke={cor.placar} strokeWidth={8} strokeLinecap="round" />
            </g>
          );
        })}

        {/* o gol */}
        <g opacity={pGol}>
          <path d={GOL_PATHS.rede} stroke={cor.giz} strokeOpacity={0.32} strokeWidth={2} fill="none" />
          <path d={GOL_PATHS.tras} stroke={cor.giz} strokeOpacity={0.6} strokeWidth={2.5} fill="none" />
          <path d={GOL_PATHS.laterais} stroke={cor.giz} strokeOpacity={0.6} strokeWidth={2.5} fill="none" />
          <path d={GOL_PATHS.frente} stroke={cor.giz} strokeWidth={7} fill="none" strokeLinejoin="round" />
        </g>

        {/* rastro das corridas (pontilhado) */}
        {acoes.map((a, i) => {
          if (a.tipo !== "corrida") return null;
          if (t <= a.em) return null;
          const ini = (() => {
            // posição no começo da corrida
            const p = posicaoEm(campo, a.quem, a.em);
            return projetar(p.x, p.y);
          })();
          const agora = posicaoEm(campo, a.quem, Math.min(t, a.ate ?? a.em + CORRIDA));
          const fim = projetar(agora.x, agora.y);
          if (Math.hypot(fim.x - ini.x, fim.y - ini.y) < 8) return null;
          return (
            <path
              key={`cor-${i}`}
              d={`M ${ini.x} ${ini.y} L ${fim.x} ${fim.y}`}
              stroke={cor.giz}
              strokeOpacity={0.75}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray="0 17"
            />
          );
        })}

        {/* cones de visão */}
        {acoes.map((a, i) => {
          if (a.tipo !== "olhar") return null;
          const p = prog(t, a.em, 0.5);
          if (p <= 0.001) return null;
          const de = centroDaFicha(a.quem);
          const para = centroDaFicha(a.alvo);
          const ang = Math.atan2(para.y - de.y, para.x - de.x);
          const L = Math.hypot(para.x - de.x, para.y - de.y) * p;
          const abre = (13 * Math.PI) / 180;
          const ponta = (s: number) => ({ x: de.x + Math.cos(ang + s * abre) * L, y: de.y + Math.sin(ang + s * abre) * L });
          const e1 = ponta(1);
          const e2 = ponta(-1);
          return (
            <g key={`olh-${i}`}>
              <polygon points={`${de.x},${de.y} ${e1.x},${e1.y} ${e2.x},${e2.y}`} fill="rgba(243,246,239,0.22)" />
              <path d={`M ${de.x} ${de.y} L ${e1.x} ${e1.y} M ${de.x} ${de.y} L ${e2.x} ${e2.y}`} stroke={cor.giz} strokeOpacity={0.85} strokeWidth={4} strokeDasharray="12 10" />
            </g>
          );
        })}

        {/* passes (tracejado) e chutes (contínuo, amarelo) */}
        {acoes.map((a, i) => {
          if (a.tipo === "passe") {
            const c = curvaDoPasse(campo, a);
            const L = Math.max(1, comprimento(c));
            const rDe = raioFicha(telaDoJogador(campo, a.de, a.em).s);
            const rPara = raioFicha(telaDoJogador(campo, a.para, a.em + PASSE.bolaAte).s);
            if (a.rotulo) {
              const meio = pontoNaCurva(c, 0.5);
              etiquetas.push(<Etiqueta key={`pr-${i}`} texto={a.rotulo} x={meio.x} y={meio.y - 18} ancora="acima" t={t} em={a.em + 0.2} tamanho={34} />);
            }
            return (
              <Seta key={`pas-${i}`} c={c} u0={(rDe + 10) / L} u1={1 - (rPara + 16) / L} p={prog(t, a.em - 0.05, PASSE.seta)} cor={cor.giz} largura={7} tracejada ponta={34} />
            );
          }
          if (a.tipo === "chute") {
            const c = curvaDoChute(campo, a);
            return <Seta key={`chu-${i}`} c={c} u0={0.04} u1={0.97} p={prog(t, a.em, CHUTE.seta)} cor={cor.placar} largura={11} ponta={42} />;
          }
          return null;
        })}

        {/* fichas */}
        {fichas.map(({ j, i, tela, r }) => {
          const pEntra = prog(t, entra + 0.08 + i * 0.05, 0.38);
          // destaque: anel amarelo que assenta na ficha
          const destaque = acoes.find((a) => a.tipo === "destaque" && a.quem === j.id) as Extract<(typeof acoes)[number], { tipo: "destaque" }> | undefined;
          const pD = destaque ? prog(t, destaque.em, 0.45) : 0;
          const cy = tela.y - r * 0.62;
          if (destaque?.rotulo && pD > 0) {
            const acima = tela.y > 900;
            etiquetas.push(
              <Etiqueta
                key={`et-${j.id}`}
                texto={destaque.rotulo}
                x={tela.x}
                y={acima ? cy - r - 26 : tela.y + 26}
                ancora={acima ? "acima" : "abaixo"}
                t={t}
                em={destaque.em + 0.08}
              />,
            );
          }
          // nome livre da ficha (diagramas de qualquer assunto), logo abaixo dela
          if (j.rotulo && !destaque?.rotulo) {
            etiquetas.push(<Etiqueta key={`rot-${j.id}`} texto={j.rotulo} x={tela.x} y={tela.y + 22} ancora="abaixo" t={t} em={entra + 0.3 + i * 0.05} tamanho={36} />);
          }
          return (
            <g key={j.id}>
              {pD > 0 ? (
                <circle cx={tela.x} cy={cy} r={(r + 13) * (1 + 0.5 * (1 - pD))} fill="none" stroke={cor.placar} strokeWidth={6} opacity={pD} />
              ) : null}
              <Ficha x={tela.x} y={tela.y} r={r} time={j.time} numero={j.numero} p={pEntra} fonte={fonte} />
            </g>
          );
        })}

        {/* bola */}
        {(() => {
          const pEntra = prog(t, entra + 0.15, 0.35);
          const r = Math.max(16, bola.s * 0.62);
          return <BolaSvg x={bola.x} y={bola.y - r * (1 + bola.altura * 0.6)} r={r} giro={bola.girando * 300} opacidade={pEntra * (1 - semBola)} />;
        })()}
      </svg>
      {etiquetas}
    </div>
  );
};
