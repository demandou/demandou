// A pessoa no quadro deitado (16:9). A base é a TELA CHEIA (aula 9 do curso): o vídeo deitado inteiro,
// com a legenda na área segura de baixo. Nos momentos ela vai para a janela da direita: larga,
// flutuante, com a cabeça inteira e o rosto no centro (acompanhado com ajuste suave pelo rastro);
// a janela desce junto com a câmera (afunda um pouco quando o mergulho acelera), com bolhas subindo
// e a água escurecendo por cima. A legenda fica dentro dela, abaixo do queixo; a faixa do nível, embaixo.
import { useMemo } from "react";
import { prog } from "../anim";
import { atividade, icebergs, numNiveis } from "../camera";
import { caixaDaPessoa, FAIXA, JANELA, legendaNaCaixa, MARGEM, naJanela } from "../layout";
import { encaixar, larguraTexto } from "../medida";
import { VideoNaCaixa, type Caixa } from "../motor/caixa";
import type { Frase } from "../motor/frases";
import type { Plano } from "../plano";
import { cor, fonte } from "../tema";

// A caixa da pessoa no instante t: a da troca entre tela cheia e janela, mais o balanço da água
// (só na janela: em tela cheia o vídeo fica parado, como foi gravado).
export const caixaDaJanela = (plano: Plano, t: number): Caixa => {
  const caixa = caixaDaPessoa(plano, t);
  const dentro = naJanela(caixa);
  if (dentro <= 0) return caixa;
  const bob = Math.sin(t * 1.4) * 7;
  const afunda = atividade(plano, t) * 26;
  return { ...caixa, y: caixa.y + (bob + afunda) * dentro };
};

export const Janela: React.FC<{ plano: Plano; t: number; escuro: number; frases: Frase[] }> = ({ plano, t, escuro, frases }) => {
  const caixa = caixaDaJanela(plano, t);
  // 0 = tela cheia, 1 = na janela: liga a moldura de gelo, as bolhas, a água e a faixa do nível
  const dentro = naJanela(caixa);
  const bolhas = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        dx: 30 + ((i * 113) % (JANELA.w - 60)),
        v: 70 + ((i * 37) % 60),
        r: 5 + ((i * 7) % 9),
        fase: i * 0.37,
      })),
    [],
  );
  const nome = plano.marca?.nome;
  // a etiqueta cabe na largura da janela (nome e área numa linha; encolhe se for longa)
  const tamEtiqueta = nome ? Math.max(22, Math.min(34, Math.floor((Math.min(caixa.w, JANELA.w) - 68 - 48) / larguraTexto(`${nome}  ${plano.marca.area ?? ""}`, 1, { peso: 700 })))) : 34;
  const raio = caixa.raio ?? 0;
  return (
    <>
      {/* bolhas */}
      {dentro > 0.01
        ? bolhas.map((b, i) => {
            const ciclo = ((t * b.v + b.fase * 300) % 380) / 380;
            const x = caixa.x + (b.dx / JANELA.w) * caixa.w;
            return <div key={i} style={{ position: "absolute", left: x + Math.sin(t * 2 + i) * 8, top: caixa.y - ciclo * 380 + 20, width: b.r * 2, height: b.r * 2, borderRadius: b.r, border: "2.5px solid rgba(255,255,255,0.7)", opacity: (1 - ciclo) * dentro }} />;
          })
        : null}
      {/* a moldura de gelo */}
      {dentro > 0.01 ? (
        <div style={{ position: "absolute", left: caixa.x - 10, top: caixa.y - 10, width: caixa.w + 20, height: caixa.h + 20, borderRadius: raio + 10, background: cor.clara, opacity: dentro, boxShadow: `0 14px 0 ${cor.geloSombra}, 0 26px 44px rgba(2,12,28,0.5)` }} />
      ) : null}
      {/* a pessoa */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1080} filtro="contrast(1.04) saturate(1.04)" />
      {/* a água escurece também a janela (em tela cheia, não) */}
      {dentro > 0.01 ? (
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: raio, opacity: dentro, background: `linear-gradient(180deg, rgba(3,20,42,${0.06 + 0.2 * escuro}), rgba(3,20,42,${0.2 + 0.3 * escuro}))`, pointerEvents: "none" }} />
      ) : null}
      {nome ? (
        <div style={{ position: "absolute", left: Math.max(caixa.x + 34, MARGEM), top: Math.max(caixa.y + 30, 48), padding: "10px 24px", borderRadius: 40, background: cor.placa, color: cor.clara, fontFamily: fonte, fontWeight: 700, fontSize: tamEtiqueta, lineHeight: 1.1, whiteSpace: "nowrap" }}>
          {nome}
          {plano.marca.area ? <span style={{ color: cor.sonar, marginLeft: 14, fontWeight: 500 }}>{plano.marca.area}</span> : null}
        </div>
      ) : null}
      <Legenda t={t} frases={frases} caixa={caixa} />
      <FaixaNivel plano={plano} t={t} dentro={dentro} />
    </>
  );
};

// Legenda: uma frase por vez, na base da caixa da pessoa; a palavra dita fica na cor de ênfase.
// Na janela, abaixo do queixo; em tela cheia, na área segura de baixo, acima dos controles do player.
const Legenda: React.FC<{ t: number; frases: Frase[]; caixa: Caixa }> = ({ t, frases, caixa }) => {
  const f = frases.find((x) => t >= x.de - 0.04 && t < x.ate + 0.1);
  if (!f) return null;
  const lugar = legendaNaCaixa(caixa);
  const texto = f.palavras.map((p) => p.w).join(" ");
  const { tamanho, linhas } = encaixar(texto, { largura: lugar.largura, max: 52, min: 38, linhas: 2, fonte: { peso: 800 } });
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
        left: lugar.cx - largura / 2,
        top: lugar.base - altura,
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

// A faixa embaixo da janela: em que nível o mergulho está (segmentos + nome). Só com a pessoa na janela.
const FaixaNivel: React.FC<{ plano: Plano; t: number; dentro: number }> = ({ plano, t, dentro }) => {
  const N = numNiveis(plano);
  let atual: { k: number; nome: string; em: number } | null = null;
  for (const m of icebergs(plano)) m.niveis.forEach((n, k) => { if (n.em <= t && (!atual || n.em > atual.em)) atual = { k, nome: n.nome, em: n.em }; });
  if (!atual || dentro <= 0.01) return null;
  const a = atual as { k: number; nome: string; em: number };
  const p = prog(t, a.em, 0.3);
  // segmentos, o "k/N" e o nome cabem na faixa: o nome encolhe no que sobra (até 2 linhas)
  const segmento = N > 5 ? 40 : 52;
  const sobra = FAIXA.w - 80 - N * segmento - (N - 1) * 10 - 30 - 70 - 30;
  const nome = encaixar(a.nome, { largura: Math.max(180, sobra), max: 40, min: 22, linhas: 2, fonte: { peso: 800 } });
  return (
    <div style={{ position: "absolute", left: FAIXA.x, top: FAIXA.y, width: FAIXA.w, height: FAIXA.h, borderRadius: FAIXA.h / 2, background: cor.placa, display: "flex", alignItems: "center", gap: 30, padding: "0 40px", boxSizing: "border-box", opacity: p * dentro, fontFamily: fonte, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 10, flex: "none" }}>
        {Array.from({ length: N }, (_, i) => (
          <div key={i} style={{ width: segmento, height: 18, borderRadius: 9, background: i <= a.k ? cor.enfase : "rgba(226,246,255,0.25)" }} />
        ))}
      </div>
      <div style={{ color: cor.claraSuave, fontWeight: 700, fontSize: 34, flex: "none" }}>{a.k + 1}/{N}</div>
      <div style={{ color: cor.clara, fontWeight: 800, fontSize: nome.tamanho, lineHeight: 1.05, whiteSpace: "nowrap" }}>
        {nome.linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};
