import React from "react";
import { ALTURA, LARGURA } from "./dados";
import { Icone, type NomeDoIcone } from "./Icone";
import { LETRA } from "./letra";
import { comAlfa, MARCA } from "./marca";
import { ENTRADA, k, mix, SAIDA } from "./tempo";
import { useTamanhoQueCabe } from "./texto";

/**
 * O CARTÃO (aula 7: "cartões com bordas finas e cantos arredondados"; aula
 * 8.2: "pequenos elementos à frente"). Entra no instante `inicio` (o `dito()`
 * da palavra que o nomeia) com deslocamento curto, inclinação e o ícone se
 * desenhando; `ativo` (0 a 1) destaca o cartão explicado e o resto perde
 * ênfase; `saida` (segundos, opcional) tira o cartão com tempo de leitura.
 */
export const Cartao: React.FC<{
  t: number;
  inicio: number;
  titulo: string;
  apoio?: string;
  icone?: NomeDoIcone;
  x?: number;
  direita?: number;
  y: number;
  largura?: number;
  /** De que lado o cartão entra: -1 esquerda, 1 direita. */
  lado?: -1 | 1;
  ativo?: number;
  saida?: number;
  tamanho?: number;
}> = ({ t, inicio, titulo, apoio, icone, x, direita, y, largura, lado = -1, ativo = 1, saida, tamanho: pedido = 40 }) => {
  // com largura fixa, o título encolhe até caber (texto saindo do cartão reprova a revisão)
  const livre = largura ? largura - 52 - (icone ? pedido * 1.75 + 18 : 0) : 10_000;
  const tamanho = useTamanhoQueCabe(titulo, livre, pedido, { familia: LETRA.titulo, peso: 800, minimo: 22 });
  const p = k(t, inicio, inicio + 0.5, SAIDA);
  const s = saida !== undefined ? k(t, saida - 0.35, saida, ENTRADA) : 0;
  if (p <= 0 || s >= 1) return null;
  const traco = k(t, inicio + 0.08, inicio + 0.7);
  const apoioP = k(t, inicio + 0.35, inicio + 0.8);
  const enfase = mix(0.42, 1, ativo);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        right: direita,
        top: y,
        width: largura,
        minHeight: tamanho * 3.1,
        whiteSpace: "nowrap",
        borderRadius: 22,
        backgroundColor: comAlfa(MARCA.painel, 0.94),
        border: `2px solid ${ativo > 0.5 ? MARCA.destaque : MARCA.linhaForte}`,
        boxShadow: `0 18px 40px ${MARCA.sombra}`,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 30px 16px 22px",
        boxSizing: "border-box",
        opacity: p * (1 - s) * enfase,
        translate: `${(1 - p) * lado * 90}px ${(1 - p) * 26 + s * 20}px`,
        rotate: `${mix(lado * -7, lado * -2, p)}deg`,
        scale: mix(0.96, 1.04, ativo > 0.5 ? (ativo - 0.5) * 2 : 0) * mix(0.94, 1, p),
      }}
    >
      {icone ? <Icone nome={icone} tamanho={tamanho * 1.75} progresso={traco} cor={MARCA.destaque} /> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ fontFamily: LETRA.titulo, fontWeight: 800, fontSize: tamanho, color: MARCA.titulo, letterSpacing: "-0.01em", lineHeight: 1 }}>{titulo}</div>
        {apoio ? (
          <div style={{ fontFamily: LETRA.texto, fontWeight: 700, fontSize: tamanho * 0.72, color: MARCA.destaque, lineHeight: 1.05, opacity: apoioP, translate: `${(1 - apoioP) * -12}px 0px` }}>
            {apoio}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** Um traço SVG que se desenha (`progresso` 0 a 1): sublinhado, seta, linha de ligação. */
export const Traco: React.FC<{ d: string; progresso: number; cor?: string; espessura?: number; largura?: number; altura?: number; style?: React.CSSProperties }> = ({
  d,
  progresso,
  cor = MARCA.destaque,
  espessura = 6,
  largura = LARGURA,
  altura = ALTURA,
  style,
}) => (
  <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", ...style }}>
    <path d={d} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, Math.max(0, progresso))} />
  </svg>
);

/** Uma linha entre dois pontos (px do quadro) com ponta de seta opcional, desenhada por `progresso`. */
export const LinhaEntre: React.FC<{ de: { x: number; y: number }; ate: { x: number; y: number }; progresso: number; cor?: string; espessura?: number; seta?: boolean; curva?: number }> = ({
  de,
  ate,
  progresso,
  cor = MARCA.destaque,
  espessura = 4,
  seta = false,
  curva = 0,
}) => {
  const mx = (de.x + ate.x) / 2;
  const my = (de.y + ate.y) / 2 - curva;
  const d = `M ${de.x} ${de.y} Q ${mx} ${my} ${ate.x} ${ate.y}`;
  const ang = Math.atan2(ate.y - my, ate.x - mx);
  const ponta = 18;
  const p2 = k(progresso, 0.85, 1);
  return (
    <svg width={LARGURA} height={ALTURA} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, Math.max(0, progresso))} />
      {seta && p2 > 0 ? (
        <path
          d={`M ${ate.x - ponta * Math.cos(ang - 0.5)} ${ate.y - ponta * Math.sin(ang - 0.5)} L ${ate.x} ${ate.y} L ${ate.x - ponta * Math.cos(ang + 0.5)} ${ate.y - ponta * Math.sin(ang + 0.5)}`}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={p2}
        />
      ) : null}
    </svg>
  );
};
