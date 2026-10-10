// Abertura: tarja de TV na altura do peito. Um número no começo do título vira o numeral no quadrado
// amarelo; o resto do título se monta na fala. Por cima da tarja, uma bola rola deixando o rastro
// tracejado de um passe, do começo ao fim da frase.
import { conteudoDaTarja, indicesDoTrecho, Linhas, prog, saidaDaTarja, saindo, temposDoTexto, varredura } from "../anim";
import type { Abertura as AberturaT, Palavra } from "../plano";
import { diagramar } from "../medidas";
import { cor, larga } from "../tema";
import { BolaSvg } from "./Pecas";

const LARGURA = 960;
const QUADRADO = 290;

export const Abertura: React.FC<{ m: AberturaT; palavras: Palavra[]; t: number; topo: number; fim: number }> = ({ m, palavras, t, topo, fim }) => {
  const titulo = m.texto ?? m.titulo ?? "";
  const todas = titulo.split(/\s+/).filter(Boolean);
  const temNumero = /^\d{1,2}$/.test(todas[0] ?? "");
  const numero = temNumero ? todas[0] : null;
  const resto = (temNumero ? todas.slice(1) : todas).join(" ");
  const tempos = temposDoTexto(titulo, palavras, m.de, m.ate, m.em ?? m.de);
  const temposResto = temNumero ? tempos.slice(1) : tempos;
  const destaque = indicesDoTrecho(resto, m.destaque);

  const larguraTexto = LARGURA - (numero ? QUADRADO : 0) - 84;
  const { linhas, tam } = diagramar(resto.toUpperCase(), { largura: larguraTexto, maximo: 104, minimo: 56, linhas: 4, altura: 372, entrelinha: 1.06 });
  const altura = Math.max(QUADRADO, linhas.length * tam * 1.06 + 92);

  // a tarja e o numeral já estão montados no primeiro quadro (vira a capa do post)
  const pTarja = m.de < 0.2 ? 1 : prog(t, m.de, 0.35);
  const s = saindo(t, fim, 0.28);
  // a bola rola do primeiro ao último instante falado do título
  const iniFala = tempos[0] ?? m.de;
  const fimFala = Math.min(fim - 0.15, (palavras.filter((p) => p.em >= m.de && p.em < m.ate).pop()?.ate ?? m.ate) - 0.05);
  const pBola = prog(t, iniFala, Math.max(0.3, fimFala - iniFala), (x) => x);
  const y0 = topo + 14;
  const xBola = 60 + 34 + (LARGURA - 68) * pBola;

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...saidaDaTarja(s) }}>
      {/* rastro tracejado da bola, logo acima da tarja */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {pBola > 0.01 ? (
          <path d={`M 84 ${y0 - 30} L ${xBola - 38} ${y0 - 30}`} stroke={cor.giz} strokeWidth={7} strokeDasharray="22 15" opacity={0.95} />
        ) : null}
        <BolaSvg x={xBola} y={y0 - 30} r={28} giro={pBola * 900} sombra={false} opacidade={prog(t, iniFala - 0.2, 0.25)} />
      </svg>
      <div style={{ position: "absolute", left: 60, top: y0, width: LARGURA, height: altura }}>
        {/* fundo: tarja escura + quadrado amarelo (só o fundo varre; o texto nunca é cortado) */}
        <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTarja), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
          <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: 12 }} />
          {numero ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: QUADRADO, background: cor.placar, borderRadius: "12px 0 0 12px" }} /> : null}
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", ...conteudoDaTarja(pTarja) }}>
          {numero ? (
            <div style={{ width: QUADRADO, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ ...larga, fontSize: 300, color: cor.tv, lineHeight: 1 }}>{numero}</span>
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 42px" }}>
            <Linhas
              linhas={linhas}
              tempos={temposResto}
              t={t}
              corDe={(i) => (destaque.has(i) ? cor.placar : undefined)}
              fantasma={0.16}
              style={{ ...larga, fontSize: tam, color: cor.giz, gap: tam * 0.08 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
