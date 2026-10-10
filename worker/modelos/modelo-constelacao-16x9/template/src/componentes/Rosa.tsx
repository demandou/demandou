import { prog } from "../anim";
import type { Direcao } from "../plano";
import { cor, sans } from "../tema";

// Rosa dos ventos de carta: quatro pontas longas (N, L, S, O — leste à esquerda, como o céu visto
// de baixo) e quatro curtas. A direção dita fica em vermelho. Desenha-se do centro para fora.
export const Rosa: React.FC<{
  x: number;
  y: number;
  raio: number;
  // 0–1: quanto já se desenhou
  desenho: number;
  giro?: number;
  destaque?: Direcao;
  opacidade?: number;
  // 0–1: o miolo (some quando a rosa fica em cima de uma marca)
  miolo?: number;
}> = ({ x, y, raio, desenho, giro = 0, destaque, opacidade = 1, miolo = 1 }) => {
  const pontas: { d: Direcao; ang: number }[] = [
    { d: "N", ang: -90 },
    { d: "O", ang: 0 },
    { d: "S", ang: 90 },
    { d: "L", ang: 180 },
  ];
  const longa = raio * desenho;
  const curta = raio * 0.48 * prog(desenho, 0.3, 0.7);
  const base = raio * 0.13;
  const ponta = (ang: number, comp: number, largura: number) => {
    const a = (ang * Math.PI) / 180;
    const px = Math.cos(a) * comp;
    const py = Math.sin(a) * comp;
    const lx = Math.cos(a + Math.PI / 2) * largura;
    const ly = Math.sin(a + Math.PI / 2) * largura;
    return `M ${lx} ${ly} L ${px} ${py} L ${-lx} ${-ly} Z`;
  };
  const corpoLetra = Math.max(32, raio * 0.3);
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`} opacity={opacidade}>
      <circle r={raio * 0.78} fill="none" stroke={cor.linha} strokeWidth={1.8} opacity={0.35 * desenho} strokeDasharray="2 7" />
      {[45, 135, 225, 315].map((g) => (
        <path key={g} d={ponta(g, curta, base * 0.7)} fill="none" stroke={cor.linha} strokeWidth={2} strokeLinejoin="round" opacity={0.75} />
      ))}
      {pontas.map(({ d, ang }) => {
        const vermelho = d === destaque;
        return (
          <path
            key={d}
            d={ponta(ang, longa, base)}
            fill={vermelho ? cor.lanterna : "none"}
            stroke={vermelho ? cor.lanterna : cor.linha}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
        );
      })}
      <circle r={base * 0.9} fill={cor.ceu} stroke={cor.linha} strokeWidth={2} opacity={miolo} />
      {pontas.map(({ d, ang }) => {
        const a = (ang * Math.PI) / 180;
        const vermelho = d === destaque;
        const dist = raio + corpoLetra * 0.62;
        return (
          <text
            key={`t-${d}`}
            x={Math.cos(a) * dist}
            y={Math.sin(a) * dist}
            transform={`rotate(${-giro} ${Math.cos(a) * dist} ${Math.sin(a) * dist})`}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={sans}
            fontWeight={700}
            fontSize={corpoLetra}
            fill={vermelho ? cor.lanterna : cor.textoSuave}
            opacity={prog(desenho, 0.55, 0.45)}
          >
            {d}
          </text>
        );
      })}
    </g>
  );
};

// Estrela de quatro pontas (marcadores do contador, ícones)
export const EstrelaQuatroPontas: React.FC<{ tamanho: number; cheia: number; corCheia?: string }> = ({ tamanho, cheia, corCheia = cor.estrela }) => {
  const r = tamanho / 2;
  const d = `M ${r} 0 Q ${r * 1.12} ${r * 0.88} ${tamanho} ${r} Q ${r * 1.12} ${r * 1.12} ${r} ${tamanho} Q ${r * 0.88} ${r * 1.12} 0 ${r} Q ${r * 0.88} ${r * 0.88} ${r} 0 Z`;
  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={cor.lapis} strokeWidth={2} strokeDasharray="3 4" opacity={1 - cheia} />
      <path d={d} fill={corCheia} opacity={cheia} transform={`translate(${r} ${r}) scale(${0.6 + 0.4 * cheia}) translate(${-r} ${-r})`} />
    </svg>
  );
};
