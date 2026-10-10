// O modelo Palco: dois modos que se alternam.
// (a) a pessoa em quadro cheio, reenquadrando nos cortes e seguindo o rosto, com a legenda logo
//     abaixo do queixo;
// (b) o palco: o assunto (imagem, print, lista, número) ocupa a tela num painel, com anotações no
//     ponto citado, e a pessoa vira uma janela arredondada, de cabeça inteira, num canto de baixo.
// Nada mexe na cor do vídeo da pessoa (sem filtro, LUT, vinheta, brilho ou desfoque).
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ANTES } from "./cenas";
import { Abertura, Cta, Destaque, Frase, Pergunta } from "./componentes/BlocosFala";
import { Legenda } from "./componentes/Legenda";
import { PaginaDoPalco } from "./componentes/Palco";
import { VideoNaCaixa } from "./motor/caixa";
import { caixaDaPessoa, cenas } from "./palco";
import type { Momento, Plano } from "./plano";
import { ehDePalco } from "./plano";
import { COR, FONTE, JANELA, MARGEM, SOMBRA_PECA, SOMBRA_TEXTO, UI_BASE, UI_DIREITA, medidas, prog, suave } from "./tema";

const Fala: React.FC<{ plano: Plano; m: Momento; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} />;
    case "cta":
      return <Cta plano={plano} m={m} t={t} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} />;
    case "destaque":
      return <Destaque plano={plano} m={m} t={t} />;
    default:
      return null;
  }
};

// Tarja de nome e área no começo: discreta, no alto à esquerda, acima da cabeça.
const Marca: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  const primeiroCorte = (plano.cortesEm ?? []).find((c) => c > 2.2) ?? 3.6;
  const ate = Math.min(3.6, primeiroCorte);
  if (t < 0.2 || t >= ate) return null;
  const e = prog(t, 0.25, 0.4);
  const s = prog(t, ate - 0.25, 0.25, suave);
  return (
    <div style={{ position: "absolute", left: MARGEM, top: 150, display: "flex", opacity: e * (1 - s), transform: `translateX(${(1 - e) * -14}px)` }}>
      <div style={{ width: 6, borderRadius: 3, background: COR.azul, marginRight: 16 }} />
      <div style={{ fontFamily: FONTE, color: COR.branco, textShadow: SOMBRA_TEXTO, lineHeight: 1.2 }}>
        <div style={{ fontWeight: 800, fontSize: 34 }}>{nome}</div>
        {area ? <div style={{ fontWeight: 600, fontSize: 26, opacity: 0.9 }}>{area}</div> : null}
      </div>
    </div>
  );
};

// Guias de conferência (só nos stills com --guias): rosto, queixo, faixa da legenda e limites da interface.
const Guias: React.FC<{ plano: Plano }> = ({ plano }) => {
  const m = medidas(plano);
  const linha = (y: number, cor: string, rotulo: string) => (
    <div style={{ position: "absolute", left: 0, top: y, width: 1080, borderTop: `3px dashed ${cor}` }}>
      <span style={{ position: "absolute", left: 12, top: 4, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor }}>{rotulo}</span>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: m.rostoX - m.rostoL / 2, top: m.rostoY - m.rostoL * 0.62, width: m.rostoL, height: m.rostoL * 1.32, border: "4px solid #4BE3FF", borderRadius: "45%" }} />
      {linha(m.queixo, "#4BE3FF", "queixo (zoom máximo)")}
      {linha(m.legTopo, "#FFD84B", "legenda")}
      {linha(m.zonaTopo, "#7CFF8A", "chips")}
      {linha(UI_BASE, "#FF6B6B", "interface do app")}
      <div style={{ position: "absolute", left: UI_DIREITA, top: 1100, width: 1080 - UI_DIREITA, height: 820, background: "rgba(255,107,107,0.25)" }} />
    </AbsoluteFill>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  const { caixa, est } = caixaDaPessoa(plano, t);
  const lista = cenas(plano);
  const falas = momentos.filter((m) => !ehDePalco(m));
  const sons = plano.sfx === false ? [] : lista;

  return (
    <AbsoluteFill style={{ backgroundColor: COR.palco }}>
      {/* as páginas do palco ficam atrás da pessoa: a janela flutua por cima da borda do painel */}
      {lista.map((c, ci) => c.paginas.map((_, i) => <PaginaDoPalco key={`${ci}-${i}`} plano={plano} cena={c} i={i} t={t} />))}
      {/* sombra e fio da janela (fora do vídeo: a cor da pessoa não muda) */}
      {est.p > 0.01 ? (
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: caixa.raio, boxShadow: SOMBRA_PECA, opacity: Math.min(1, est.p * 2) }} />
      ) : null}
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      {est.p > 0.01 ? (
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: caixa.raio, boxSizing: "border-box", boxShadow: "inset 0 0 0 3px rgba(242,241,237,0.22)", opacity: est.p }} />
      ) : null}
      {falas.map((m, i) => (
        <Fala key={i} plano={plano} m={m} t={t} />
      ))}
      <Legenda plano={plano} />
      <Marca plano={plano} t={t} />
      {sons.map((c, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((c.de - ANTES - 0.04) * fps))} durationInFrames={Math.round(0.6 * fps)} layout="none">
          <Audio src={staticFile("sfx/entrada.wav")} volume={0.45} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} /> : null}
    </AbsoluteFill>
  );
};
