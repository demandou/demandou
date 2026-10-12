// Fig. "partículas": a Terra embaixo, a camada (atmosfera) em volta, um feixe que entra, bate nas
// partículas e se espalha em pontinhos para todos os lados.
import { caneta, limitar, mistura, prog, sorteio } from "../anim";
import { Cabecalho } from "../componentes/Cabecalho";
import type { Particulas as ParticulasT } from "../plano";
import { corDe, FraseAMao } from "../tinta/Escrita";
import { Definicoes, Esboco, Molecula, Seta, Traco } from "../tinta/Tinta";
import { cor, estiloImpresso, H, W } from "../tema";
import { ajustar, caberImpresso } from "../medir";
import type { PropsFigura } from "./comum";

// Pontinhos que saem de uma partícula em todas as direções
export const Espalhar: React.FC<{ x: number; y: number; t: number; em: number; n: number; alcance: number; cor: string; semente: number }> = ({
  x,
  y,
  t,
  em,
  n,
  alcance,
  cor: c,
  semente,
}) => {
  if (t < em || n <= 0) return null;
  const r = sorteio(semente);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + r() * 0.5;
        const atraso = r() * 0.18;
        const p = prog(t, em + atraso, 0.75);
        // depois de sair, continua andando devagar (a luz não para)
        const deriva = Math.max(0, t - em - atraso - 0.75) * 18;
        const dist = 26 + (alcance - 26) * p * (0.75 + r() * 0.35) + deriva;
        const tam = mistura(10, 7.5, p);
        return p > 0 ? <circle key={i} cx={x + dist * Math.cos(ang)} cy={y + dist * Math.sin(ang)} r={tam} fill={c} opacity={0.95 - 0.35 * limitar(deriva / 40)} /> : null;
      })}
      {/* um anel fino que abre e some, marcando o instante do espalhamento */}
      <circle cx={x} cy={y} r={20 + alcance * 0.8 * prog(t, em, 0.6)} fill="none" stroke={c} strokeWidth={3} opacity={0.5 * (1 - prog(t, em + 0.1, 0.6))} />
    </g>
  );
};

export const Particulas: React.FC<PropsFigura<ParticulasT>> = ({ m, t, areas, palavras, chegada, id, opCabecalho }) => {
  const a = areas.corpo;
  const L = (x: number, y: number) => ({ x: a.x + x, y: a.y + y });
  const cx = a.x + a.w / 2;
  const sy = Math.min(1.1, a.h / 760);
  // Terra e topo da camada: arcos de círculos concêntricos com o centro bem abaixo
  const centro = { x: cx, y: a.y + 1880 * sy };
  const rTerra = 1240 * sy;
  const rAr = 1670 * sy;
  const arco = (r: number) => {
    const dx = a.w / 2 + 40;
    const yb = centro.y - Math.sqrt(r * r - dx * dx);
    return `M ${cx - dx} ${yb} A ${r} ${r} 0 0 1 ${cx + dx} ${yb}`;
  };
  const corPontos = corDe(m.cor ?? "azul");
  // o feixe: do alto à direita, descendo para a esquerda
  const ini = L(930, 30 * sy);
  const fim = L(250, 560 * sy);
  const noFeixe = (s: number) => ({ x: ini.x + (fim.x - ini.x) * s, y: ini.y + (fim.y - ini.y) * s });
  const sBorda = 0.3;
  const atingidas = [0.45, 0.68, 0.9];
  const soltas = [
    [140, 420],
    [262, 312],
    [800, 452],
    [880, 330],
    [116, 590],
    [430, 612],
  ].map(([x, y]) => L(x, y * sy));
  const bateEm = m.bateEm ?? m.entraEm + 0.8;
  const pEntra = prog(t, m.entraEm, 0.5, caneta);
  const pAteBater = prog(t, m.entraEm + 0.5, Math.max(0.2, bateEm - m.entraEm - 0.5), caneta);
  const pResto = prog(t, bateEm + 0.05, 0.6, caneta);
  const sFeixe = t < m.entraEm + 0.5 ? sBorda * pEntra : t < bateEm ? mistura(sBorda, atingidas[0], pAteBater) : mistura(atingidas[0], 1, pResto);
  const pFeixe = sFeixe;
  const dFeixe = `M ${ini.x} ${ini.y} L ${fim.x} ${fim.y}`;
  const pCamada = prog(t, m.camadaEm, 0.7, caneta);
  const pTerra = prog(t, chegada + 0.3, 0.6, caneta);
  const esboco = 1 - prog(t, m.particulasEm + 0.4, 0.4);

  const rotuloPos = L(18, 92 * sy);
  const alvoRotulo = soltas[1];
  const efeitoPos = L(590, 560 * sy);
  return (
    <>
      {areas.cabecalho ? (
        <Cabecalho regiao={areas.cabecalho} t={t} de={m.de} ate={m.ate} palavras={palavras} rotulo={m.rotulo} titulo={m.titulo} destaque={m.destaque} corDestaque={m.corDestaque} chegada={chegada} opacidade={opCabecalho} />
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        <defs>
          <clipPath id={`${id}-area`}>
            <rect x={a.x - 30} y={a.y - 20} width={a.w + 60} height={a.h + 40} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-area)`}>
          {/* a camada de ar: um véu azul bem claro entre os dois arcos */}
          <path
            d={`${arco(rAr)} L ${cx + a.w} ${a.y + a.h + 40} L ${cx - a.w} ${a.y + a.h + 40} Z`}
            fill={cor.azulClaro}
            opacity={0.22 * pCamada}
          />
          {/* a Terra: hachura a lápis */}
          <path d={`${arco(rTerra)} L ${cx + a.w} ${a.y + a.h + 40} L ${cx - a.w} ${a.y + a.h + 40} Z`} fill={cor.papel} opacity={pTerra} />
          <path d={`${arco(rTerra)} L ${cx + a.w} ${a.y + a.h + 40} L ${cx - a.w} ${a.y + a.h + 40} Z`} fill={`url(#${id}-hachura)`} opacity={pTerra} />
          <g filter={`url(#${id}-mao)`}>
            <Traco d={arco(rTerra)} p={pTerra} largura={5.5} />
            <Esboco d={arco(rAr)} opacidade={1 - pCamada} />
            <Traco d={arco(rAr)} p={pCamada} largura={4} cor={cor.azul} />
          </g>
        </g>
        {/* partículas soltas e as que o feixe atinge */}
        {[...soltas, ...atingidas.map(noFeixe)].map((q, i) => (
          <g key={i}>
            <Molecula x={q.x} y={q.y} p={esboco} esboco angulo={(i * 47) % 180} />
            <Molecula x={q.x} y={q.y} p={prog(t, m.particulasEm + i * 0.05, 0.3)} angulo={(i * 47) % 180} />
          </g>
        ))}
        {/* o feixe de luz branca */}
        <g filter={`url(#${id}-mao)`}>
          <Esboco d={dFeixe} opacidade={1 - limitar(pFeixe * 3)} />
          <Traco d={dFeixe} p={pFeixe} largura={22} />
          <Traco d={dFeixe} p={pFeixe} cor="#FFFFFF" largura={12} />
        </g>
        {atingidas.map((s, i) => {
          const q = noFeixe(s);
          return <Espalhar key={i} x={q.x} y={q.y} t={t} em={m.espalhaEm + i * 0.14} n={16} alcance={165} cor={corPontos} semente={i + 3} />;
        })}
        {m.particulas ? (
          <Seta
            de={{ x: rotuloPos.x + 210, y: rotuloPos.y + 58 }}
            ate={{ x: alvoRotulo.x - 4, y: alvoRotulo.y - 30 }}
            p={prog(t, m.particulasEm + 0.3, 0.35, caneta)}
            curva={-0.3}
          />
        ) : null}
        {m.efeito ? (
          <Seta
            de={{ x: efeitoPos.x - 14, y: efeitoPos.y - 6 }}
            ate={{ x: noFeixe(atingidas[1]).x + 70, y: noFeixe(atingidas[1]).y + 70 }}
            p={prog(t, m.espalhaEm + 0.35, 0.35, caneta)}
            curva={-0.25}
            cor={corPontos}
          />
        ) : null}
      </svg>
      {m.camada ? (
        <div style={{ ...estiloImpresso, fontSize: caberImpresso(m.camada, 300), position: "absolute", left: a.x + a.w - 330, top: a.y + 196 * sy, width: 300, textAlign: "right", opacity: 0.25 + 0.75 * pCamada, color: cor.azul }}>
          {m.camada}
        </div>
      ) : null}
      {m.particulas ? (
        <div style={{ position: "absolute", left: rotuloPos.x, top: rotuloPos.y - 30 }}>
          <FraseAMao texto={m.particulas} em={m.particulasEm} ate={m.ate} palavras={palavras} t={t} corpo={ajustar(m.particulas, 470, 52, 38, 1).corpo} />
        </div>
      ) : null}
      {m.efeito ? (
        <div style={{ position: "absolute", left: efeitoPos.x, top: efeitoPos.y - 44 }}>
          <FraseAMao texto={m.efeito} em={m.espalhaEm} ate={m.ate} palavras={palavras} t={t} corpo={ajustar(m.efeito, a.x + a.w - efeitoPos.x + 30, 60, 40, 1).corpo} cor={corPontos} />
        </div>
      ) : null}
    </>
  );
};
