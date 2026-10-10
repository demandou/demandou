// Vinheta de abertura do programa: três faixas cruzam a tela na altura do peito, a placa azul
// elétrico abre com o título ("ENTENDA") letra por letra no instante em que é dito e, embaixo, a
// tarja branca com o subtítulo e um cronômetro que dispara quando o número é dito ("em 30 segundos").
import { limitar, Palavras, prog, saindo, temposDoTexto, troca, varredura } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Palavra, Vinheta as V } from "../plano";
import { cor, manchete, rotulo, W } from "../tema";

const Cronometro: React.FC<{ p: number; tamanho: number }> = ({ p, tamanho }) => {
  const r = 17;
  const c = 2 * Math.PI * r;
  const ang = -90 + 360 * p;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <rect x={20} y={1.5} width={8} height={5} fill={cor.tinta} />
      <circle cx={24} cy={27} r={r} fill="none" stroke={cor.tinta} strokeWidth={4.5} />
      <circle cx={24} cy={27} r={r - 6} fill="none" stroke={cor.eletrico} strokeWidth={12} strokeDasharray={`${(2 * Math.PI * (r - 6)) * p} ${c}`} transform="rotate(-90 24 27)" />
      <line x1={24} y1={27} x2={24 + Math.cos((ang * Math.PI) / 180) * 12} y2={27 + Math.sin((ang * Math.PI) / 180) * 12} stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
};

export const Vinheta: React.FC<{ m: V; palavras: Palavra[]; t: number; topo: number; fim: number }> = ({ m, palavras, t, topo, fim }) => {
  if (t > fim + 0.02) return null;
  const titulo = m.titulo.toUpperCase();
  const corteTitulo = { peso: 900 as const, alta: true, espacamento: -0.01 };
  const { tam } = diagramar(titulo, { largura: W - 2 * 60 - 2 * 48, maximo: 176, minimo: 100, linhas: 1, corte: corteTitulo });
  const larguraPlaca = medir(titulo, tam, corteTitulo) + 2 * 48;
  const alturaPlaca = Math.round(tam * 0.98 + 2 * 34);
  const yPlaca = topo + 10;
  const xPlaca = (W - larguraPlaca) / 2;
  const [tTitulo] = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.16);

  const sub = m.subtitulo?.split(/\s+/).filter(Boolean) ?? [];
  const temposSub = m.subtitulo ? temposDoTexto(m.subtitulo, palavras, m.de, m.ate, tTitulo + 0.15) : [];
  const iNumero = sub.findIndex((w) => /\d/.test(w));
  const tNumero = iNumero >= 0 ? temposSub[iNumero] : (temposSub[0] ?? tTitulo + 0.3);
  const pCronometro = prog(t, tNumero, Math.max(0.6, fim - 0.3 - tNumero), troca);
  const corteSub = { peso: 800 as const, alta: true, espacamento: 0.02 };
  const tamSub = m.subtitulo ? diagramar(m.subtitulo, { largura: W - 2 * 60 - (58 + 18 + 2 * 30), maximo: 58, minimo: 40, linhas: 1, corte: corteSub }).tam : 58;
  const larguraSub = medir(m.subtitulo ?? "", tamSub, corteSub) + 58 + 18 + 2 * 30;
  const ySub = yPlaca + alturaPlaca;

  // a placa já está aberta no primeiro quadro (vira a capa do post, com o título "a lápis");
  // a vinheta é o risco das faixas cruzando e o título acendendo letra por letra
  const pPlaca = m.de < 0.3 ? 1 : prog(t, m.de - 0.3, 0.34);
  const pSub = m.de < 0.3 ? 1 : prog(t, m.de - 0.18, 0.34);
  // saída: a placa é "empurrada" para fora — some da esquerda para a direita, na frente da tarja
  // que entra varrendo do mesmo lado (nenhuma letra das duas se sobrepõe)
  const s = saindo(t, fim, 0.34);

  // as faixas que cruzam a tela na abertura (o "risco" de vinheta)
  const faixas = [
    { y: yPlaca - 34, h: 10, cor: cor.eletrico, atraso: 0 },
    { y: ySub + 92 + 26, h: 6, cor: cor.branco, atraso: 0.07 },
    { y: ySub + 92 + 46, h: 4, cor: cor.celeste, atraso: 0.12 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 0 0 ${(s * 100).toFixed(2)}%)`, translate: `${40 * s}px 0` }}>
      {faixas.map((f, i) => {
        const p = prog(t, m.de + f.atraso, 0.62, troca);
        if (p <= 0 || p >= 1) return null;
        return <div key={i} style={{ position: "absolute", top: f.y, left: -760 + p * (W + 760), width: 760, height: f.h, background: f.cor }} />;
      })}
      <div style={{ position: "absolute", left: xPlaca, top: yPlaca, width: larguraPlaca, height: alturaPlaca, background: cor.eletrico, clipPath: varredura(pPlaca) }} />
      <div
        style={{
          position: "absolute",
          left: xPlaca,
          top: yPlaca,
          width: larguraPlaca,
          height: alturaPlaca,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...manchete,
          fontSize: tam,
          letterSpacing: "-0.01em",
          color: cor.branco,
          opacity: limitar((pPlaca - 0.4) / 0.4),
        }}
      >
        {[...titulo].map((c, i) => {
          // cada letra "enche" de baixo para cima sobre o esboço, em cascata
          const p = prog(t, tTitulo + i * 0.04, 0.3);
          return (
            <span key={i} style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
              <span style={{ color: "rgba(255,255,255,0.26)" }}>{c}</span>
              <span style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(${((1 - p) * 100).toFixed(2)}% -0.1em -0.2em -0.1em)` }}>{c}</span>
            </span>
          );
        })}
      </div>
      {m.subtitulo ? (
        <div style={{ position: "absolute", left: (W - larguraSub) / 2, top: ySub, width: larguraSub, height: 92, background: cor.papel, clipPath: varredura(pSub), display: "flex", alignItems: "center", gap: 18, padding: "0 30px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: limitar((pSub - 0.45) / 0.4) }}>
            <Cronometro p={pCronometro} tamanho={58} />
            <Palavras
              palavras={sub}
              tempos={temposSub}
              t={t}
              esboco={cor.apagadoNoPapel}
              corDe={(i) => (i === iNumero ? cor.eletrico : cor.tinta)}
              style={{ ...rotulo, letterSpacing: "0.02em", fontSize: tamSub }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
