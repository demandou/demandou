// A janela da pessoa: larga, flutuante, com a cabeça inteira; desce junto com a câmera (afunda um pouco
// quando o mergulho acelera), com bolhas subindo e um cabo até a superfície. A legenda fica dentro dela, abaixo do queixo.
import { useMemo } from "react";
import { prog } from "../anim";
import { atividade, icebergs, JANELA, numNiveis } from "../camera";
import { encaixar, larguraTexto } from "../medida";
import { VideoNaCaixa, type Caixa } from "../motor/caixa";
import type { Frase } from "../motor/frases";
import type { Plano } from "../plano";
import { cor, fonte } from "../tema";

export const caixaDaJanela = (plano: Plano, t: number): Caixa => {
  const bob = Math.sin(t * 1.4) * 7;
  const afunda = atividade(plano, t) * 26;
  return { x: JANELA.x, y: JANELA.y + bob + afunda, w: JANELA.w, h: JANELA.h, raio: 46, zoom: 1, ancoraY: 0.4 };
};

export const Janela: React.FC<{ plano: Plano; t: number; escuro: number; frases: Frase[] }> = ({ plano, t, escuro, frases }) => {
  const caixa = caixaDaJanela(plano, t);
  const bolhas = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: JANELA.x + 30 + ((i * 113) % (JANELA.w - 60)),
        v: 70 + ((i * 37) % 60),
        r: 5 + ((i * 7) % 9),
        fase: i * 0.37,
      })),
    [],
  );
  const nome = plano.marca?.nome;
  return (
    <>
      {/* bolhas */}
      {bolhas.map((b, i) => {
        const ciclo = ((t * b.v + b.fase * 300) % 380) / 380;
        return <div key={i} style={{ position: "absolute", left: b.x + Math.sin(t * 2 + i) * 8, top: caixa.y - ciclo * 380 + 20, width: b.r * 2, height: b.r * 2, borderRadius: b.r, border: "2.5px solid rgba(255,255,255,0.7)", opacity: 1 - ciclo }} />;
      })}
      {/* a pessoa */}
      <div style={{ position: "absolute", left: caixa.x - 10, top: caixa.y - 10, width: caixa.w + 20, height: caixa.h + 20, borderRadius: (caixa.raio ?? 0) + 10, background: cor.clara, boxShadow: `0 14px 0 ${cor.geloSombra}, 0 26px 44px rgba(2,12,28,0.5)` }} />
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} filtro="contrast(1.04) saturate(1.04)" />
      {/* a água escurece também a janela */}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: caixa.raio, background: `linear-gradient(180deg, rgba(3,20,42,${0.06 + 0.2 * escuro}), rgba(3,20,42,${0.2 + 0.3 * escuro}))`, pointerEvents: "none" }} />
      {nome ? (
        <div style={{ position: "absolute", left: caixa.x + 34, top: caixa.y + 30, padding: "10px 24px", borderRadius: 40, background: cor.placa, color: cor.clara, fontFamily: fonte, fontWeight: 700, fontSize: 34, lineHeight: 1.1 }}>
          {nome}
          {plano.marca.area ? <span style={{ color: cor.sonar, marginLeft: 14, fontWeight: 500 }}>{plano.marca.area}</span> : null}
        </div>
      ) : null}
      <Legenda t={t} frases={frases} y={caixa.y + caixa.h - 24} />
      <FaixaNivel plano={plano} t={t} />
    </>
  );
};

// Legenda: uma frase por vez, na base da janela; a palavra dita fica na cor de ênfase.
const Legenda: React.FC<{ t: number; frases: Frase[]; y: number }> = ({ t, frases, y }) => {
  const f = frases.find((x) => t >= x.de - 0.04 && t < x.ate + 0.1);
  if (!f) return null;
  const texto = f.palavras.map((p) => p.w).join(" ");
  const { tamanho, linhas } = encaixar(texto, { largura: 820, max: 52, min: 38, linhas: 2, fonte: { peso: 800 } });
  const altura = linhas.length * tamanho * 1.18 + tamanho * 0.5;
  const largura = Math.max(...linhas.map((l) => larguraTexto(l, tamanho, { peso: 800 }))) + tamanho * 1.2;
  // palavra atual: conta as palavras já ditas
  const ditas = f.palavras.filter((p) => p.em <= t).length;
  const atual = Math.max(0, ditas - 1);
  let idx = 0;
  const entrada = prog(t, f.de - 0.04, 0.16);
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - largura) / 2,
        top: y - altura,
        width: largura,
        height: altura,
        borderRadius: tamanho * 0.5,
        background: cor.placa,
        opacity: entrada,
        transform: entrada >= 1 ? undefined : `translateY(${(1 - entrada) * 16}px)`,
        fontFamily: fonte,
        fontWeight: 800,
        fontSize: tamanho,
        lineHeight: 1.18,
        color: cor.clara,
        textAlign: "center",
        paddingTop: tamanho * 0.25,
        boxSizing: "border-box",
      }}
    >
      {linhas.map((l, i) => (
        <div key={i}>
          {l.split(" ").map((w, k) => {
            const eAtual = idx === atual && ditas > 0;
            idx++;
            return (
              <span key={k} style={{ color: eAtual ? cor.enfase : cor.clara }}>
                {w}
                {k < l.split(" ").length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// A faixa embaixo da janela: em que nível o mergulho está (segmentos + nome).
const FaixaNivel: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const N = numNiveis(plano);
  let atual: { k: number; nome: string; em: number } | null = null;
  for (const m of icebergs(plano)) m.niveis.forEach((n, k) => { if (n.em <= t && (!atual || n.em > atual.em)) atual = { k, nome: n.nome, em: n.em }; });
  if (!atual) return null;
  const a = atual as { k: number; nome: string; em: number };
  const p = prog(t, a.em, 0.3);
  const nome = encaixar(a.nome, { largura: 520, max: 40, min: 28, linhas: 1, fonte: { peso: 800 } });
  return (
    <div style={{ position: "absolute", left: JANELA.x, top: JANELA.y + JANELA.h + 52, width: JANELA.w, height: 92, borderRadius: 46, background: cor.placa, display: "flex", alignItems: "center", gap: 30, padding: "0 40px", boxSizing: "border-box", opacity: p, fontFamily: fonte }}>
      <div style={{ display: "flex", gap: 10, flex: "none" }}>
        {Array.from({ length: N }, (_, i) => (
          <div key={i} style={{ width: 52, height: 18, borderRadius: 9, background: i <= a.k ? cor.enfase : "rgba(226,246,255,0.25)" }} />
        ))}
      </div>
      <div style={{ color: cor.claraSuave, fontWeight: 700, fontSize: 34, flex: "none" }}>{a.k + 1}/{N}</div>
      <div style={{ color: cor.clara, fontWeight: 800, fontSize: nome.tamanho, whiteSpace: "nowrap" }}>{nome.linhas.join(" ")}</div>
    </div>
  );
};
