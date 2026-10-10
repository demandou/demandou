// A moldura larga da pessoa (embaixo), a aba com o nome, a legenda abaixo do queixo e as guias.
import { AbsoluteFill } from "remotion";
import { limitar, prog } from "../anim";
import { encaixar } from "../medida";
import type { Caixa, Rosto } from "../motor/caixa";
import type { Frase } from "../motor/frases";
import type { Plano } from "../plano";
import { COR, ELITE, LIMITE_APP, PESSOA, QUADRO_H, SEGURO, SORA } from "../tema";

// a caixa da pessoa: cabeça inteira com ~70 px de folga abaixo do topo da moldura
export const caixaDaPessoa = (plano: Plano): Caixa => {
  const escala = Math.max(PESSOA.w / 1080, PESSOA.h / 1920);
  const larguraRosto = ((plano.rosto as Rosto).rastro?.largura ?? 0.3) * 1080 * escala;
  const centro = 72 + 0.95 * larguraRosto;
  return { x: PESSOA.x, y: PESSOA.y, w: PESSOA.w, h: PESSOA.h, raio: PESSOA.raio, zoom: 1, ancoraY: Math.max(0.28, Math.min(0.5, centro / PESSOA.h)) };
};

// Etiqueta manila com o nome de quem fala, dentro da moldura (canto de cima à esquerda, longe da borda
// e da cabeça), nos primeiros ~5 s: o nome em Sora (≥ 34 px) e a área datilografada embaixo.
export const AbaDoNome: React.FC<{ plano: Plano; t: number; limiteX: number }> = ({ plano, t, limiteX }) => {
  if (!plano.marca?.nome) return null;
  const x = PESSOA.x + 28;
  const largura = Math.max(280, Math.min(560, limiteX - x)) - 48;
  const nome = encaixar(plano.marca.nome, { largura, max: 42, min: 34, linhas: 2, fonte: { peso: 800 } });
  const area = plano.marca.area ? encaixar(plano.marca.area.toUpperCase(), { largura, max: 26, min: 20, linhas: 1, fonte: { elite: true, espacamento: 0.08 } }) : null;
  const entra = prog(t, 0.25, 0.4);
  const sai = prog(t, 5.2, 0.35);
  const p = entra * (1 - sai);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: PESSOA.y + 28,
        padding: "16px 24px 14px",
        background: COR.manilaClaro,
        borderRadius: 8,
        boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
        rotate: "-1.5deg",
        transformOrigin: "0 0",
        transform: `translateX(${(1 - p) * -40}px)`,
        opacity: limitar(p * 1.4),
      }}
    >
      <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: nome.tamanho, lineHeight: 1.08, color: COR.tinta, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        {nome.linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      {area ? (
        <div style={{ marginTop: 8, fontFamily: ELITE, fontSize: area.tamanho, letterSpacing: "0.08em", color: "#3B2E1E", whiteSpace: "nowrap" }}>{area.linhas[0]}</div>
      ) : null}
    </div>
  );
};

// Legenda: uma linha curta em Sora, numa faixa escura translúcida abaixo do queixo; a palavra dita em manila.
export const Legenda: React.FC<{ frases: Frase[]; t: number; y: number }> = ({ frases, t, y }) => {
  const f = frases.find((x) => t >= x.de && t < x.ate);
  if (!f) return null;
  const texto = f.palavras.map((p) => p.w).join(" ");
  const fit = encaixar(texto, { largura: 880, max: 46, min: 34, linhas: 1, fonte: { peso: 700 } });
  const entra = prog(t, f.de - 0.04, 0.16);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y - fit.tamanho * 0.85, display: "flex", justifyContent: "center", opacity: entra }}>
      <div style={{ padding: `${fit.tamanho * 0.22}px ${fit.tamanho * 0.5}px`, borderRadius: 16, background: "rgba(14,10,8,0.66)", fontFamily: SORA, fontWeight: 700, fontSize: fit.tamanho, lineHeight: 1.2, color: COR.claro, whiteSpace: "nowrap", letterSpacing: "-0.005em" }}>
        {f.palavras.map((p, i) => {
          const dita = t >= p.em - 0.03;
          const agora = dita && (i === f.palavras.length - 1 || t < f.palavras[i + 1].em - 0.03);
          return (
            <span key={i} style={{ color: agora ? COR.destaqueLegenda : COR.claro, opacity: dita ? 1 : 0.55 }}>
              {p.w}
              {i < f.palavras.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Guias de conferência (stills --guias): o rosto, a área segura do quadro, a legenda e o limite do app.
export const Guias: React.FC<{ caixa: Caixa; rosto: { x: number; y: number; largura: number }; yLegenda: number }> = ({ rosto, yLegenda }) => {
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: SORA, fontSize: 24, fontWeight: 700, color: cor }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      {linha(SEGURO.y0, "#7CFF8A", "topo seguro (130)")}
      {linha(QUADRO_H, "#FF7AD9", "base do quadro")}
      {linha(yLegenda, "#FFD84B", "centro da legenda")}
      {linha(LIMITE_APP, "#FF6B6B", "limite do app (1700)")}
      <div style={{ position: "absolute", left: SEGURO.x0, top: 0, width: 2, height: 1920, background: "rgba(124,255,138,0.6)" }} />
      <div style={{ position: "absolute", left: SEGURO.x1, top: 0, width: 2, height: 1920, background: "rgba(124,255,138,0.6)" }} />
      <div style={{ position: "absolute", left: rosto.x - rosto.largura / 2, top: rosto.y - rosto.largura * 0.62, width: rosto.largura, height: rosto.largura * 1.24, border: "4px solid #4BE3FF", borderRadius: "50%" }} />
    </AbsoluteFill>
  );
};
