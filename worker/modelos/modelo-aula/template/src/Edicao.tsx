// O modelo Aula (16:9, curso gravado): o professor em quadro cheio na abertura e nas viradas, com
// cartões de papel no lado livre; o MODO SLIDE (a assinatura): o slide branco ocupa ~62% da tela e
// se monta na fala (título, itens, fórmula termo a termo, gráfico que se desenha, número que conta),
// enquanto o professor fica numa janela arredondada ao lado, seguindo o rosto; a barra de progresso
// da aula no alto e o cartão de resumo no fim. Nada mexe na cor do vídeo.
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Legenda } from "./componentes/Legenda";
import { encaixar } from "./medida";
import { Abertura, Capitulo, Cta, Destaque, Frase } from "./componentes/Professor";
import { Paginas } from "./componentes/Slide";
import { Progresso } from "./componentes/Progresso";
import { VideoNaCaixa, rostoNaTela } from "./motor/caixa";
import { caixaDaPessoa, nivelDaJanela, trechoEm, trechos } from "./modo";
import type { Plano } from "./plano";
import { BASE, COR, FONTE, H, MARGEM_X, MARGEM_Y, SLIDE_CENTRO, SLIDE_W, SLIDE_Y, W, caixaJanela, prog, slideH, slideX, suave } from "./tema";

// Guias de conferência (stills com --guias): margem segura, rosto, slide, janela e a base do player.
const Guias: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const caixa = caixaDaPessoa(plano, t);
  const r = rostoNaTela(caixa, plano.rosto, plano.videoAltura ?? H, t);
  const j = caixaJanela(plano);
  const rotulo = (texto: string, x: number, y: number, cor: string) => (
    <span style={{ position: "absolute", left: x, top: y, fontFamily: FONTE, fontSize: 24, fontWeight: 700, color: cor }}>{texto}</span>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: MARGEM_X, top: MARGEM_Y, width: W - MARGEM_X * 2, height: H - MARGEM_Y * 2, border: "3px dashed #E8B400", boxSizing: "border-box" }} />
      {rotulo("margem segura", MARGEM_X + 8, MARGEM_Y + 6, "#E8B400")}
      <div style={{ position: "absolute", left: r.x - r.largura / 2, top: r.y - r.largura * 0.62, width: r.largura, height: r.largura * 1.32, border: "4px solid #00B4E6", borderRadius: "45%" }} />
      <div style={{ position: "absolute", left: slideX(plano), top: SLIDE_Y, width: SLIDE_W, height: slideH(plano), border: "3px dashed #2DBE60", boxSizing: "border-box" }} />
      {rotulo("slide (modo slide)", slideX(plano) + 8, SLIDE_Y + 6, "#2DBE60")}
      <div style={{ position: "absolute", left: j.x, top: j.y, width: j.w, height: j.h, border: "3px dashed #2DBE60", borderRadius: j.raio, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 0, top: BASE, width: W, borderTop: "3px dashed #E5484D" }} />
      {rotulo("base (controles do player abaixo)", MARGEM_X + 8, BASE + 6, "#E5484D")}
    </AbsoluteFill>
  );
};

// O nome do professor dentro da janela, na primeira vez que ela aparece.
const NomeNaJanela: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { nome, area } = plano.marca ?? { nome: "", area: "" };
  if (!nome) return null;
  // (o cartão de capítulo também mostra o nome quando fica tempo bastante na tela)
  const primeira = trechos(plano).find((x) => x.modo === "slide");
  if (!primeira) return null;
  // a capa (capítulo) já mostrou o nome: não repete
  if (plano.momentos.some((m) => m.tipo === "capitulo" && m.de < primeira.de && m.ate - m.de >= 1.5)) return null;
  const de = primeira.de + 0.75;
  const ate = Math.min(primeira.ate, de + 3.2);
  if (t < de || t >= ate) return null;
  const j = caixaJanela(plano);
  const e = prog(t, de, 0.35) * (1 - prog(t, ate - 0.25, 0.25));
  // legível num celular deitado: nome ≥ 34 px
  const tamN = encaixar(nome, { largura: j.w - 80, max: 36, min: 26, linhas: 1, fonte: { peso: 800 } }).tamanho;
  const tamA = area ? encaixar(area, { largura: j.w - 80, max: 26, min: 20, linhas: 1, fonte: { peso: 600 } }).tamanho : 0;
  const hP = Math.round(tamN * 1.25 + (tamA ? tamA * 1.3 : 0) + 28);
  return (
    <div style={{ position: "absolute", left: j.x + 18, top: j.y + j.h - 18 - hP, width: j.w - 36, height: hP, borderRadius: 20, background: "rgba(255,255,255,0.96)", padding: "0 22px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", opacity: e, transform: `translateY(${(1 - e) * 10}px)` }}>
      <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tamN, lineHeight: 1.25, color: COR.tinta, whiteSpace: "nowrap" }}>{nome}</div>
      {area ? <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: tamA, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap" }}>{area}</div> : null}
    </div>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const caixa = caixaDaPessoa(plano, t);
  const nivel = nivelDaJanela(plano, caixa);
  const zoomCheio = trechoEm(plano, t).zoom;
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  // sons tonais e baixos: a troca de modo e de página, e a moldura da fórmula
  const sfx = plano.sfx !== false;
  const ts = trechos(plano);
  const trocas = sfx ? ts.slice(1).filter((x, i) => x.modo !== ts[i].modo || x.pagina !== ts[i].pagina).map((x) => x.de) : [];
  const molduras = sfx
    ? momentos.flatMap((m) => (m.tipo === "slide" && m.formula?.length ? [m.formula[m.formula.length - 1].em + 0.28] : [])).filter((x) => x < plano.duracao - 0.1)
    : [];
  // a moldura da janela
  const borda = 7;
  // a cauda: o professor sai da janela e o último slide vai para o centro
  const cauda = plano.cauda;
  const vaiAoCentro = cauda ? prog(t, cauda.de, 0.45, suave) : 0;
  const sai = cauda ? prog(t, cauda.de, 0.28) : 0;
  const dx = (SLIDE_CENTRO - slideX(plano)) * vaiAoCentro;
  const fimDoVideo = cauda ? Math.round((cauda.de + 0.35) * fps) : null;
  const video = <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? H} estilo={sai > 0 ? { opacity: 1 - sai } : undefined} />;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.papel }}>
      {/* o papel quadriculado (fica atrás de tudo; só aparece no modo slide) */}
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${COR.grade} 2px, transparent 2px), linear-gradient(90deg, ${COR.grade} 2px, transparent 2px)`, backgroundSize: "48px 48px", backgroundPosition: "24px 20px" }} />
      <Paginas plano={plano} t={t} dx={dx} />
      {nivel > 0.02 && sai < 1 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x - borda,
            top: caixa.y - borda,
            width: caixa.w + borda * 2,
            height: caixa.h + borda * 2,
            borderRadius: (caixa.raio ?? 0) + borda,
            background: COR.folha,
            boxShadow: "0 22px 50px rgba(22,27,46,0.16)",
            opacity: Math.min(1, nivel * 1.4) * (1 - sai),
          }}
        />
      ) : null}
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      {fimDoVideo !== null ? (
        <Sequence from={0} durationInFrames={Math.max(1, fimDoVideo)} layout="none">
          {video}
        </Sequence>
      ) : (
        video
      )}
      <NomeNaJanela plano={plano} t={t} />
      {momentos.map((m, i) => {
        switch (m.tipo) {
          case "capitulo":
            return <Capitulo key={i} plano={plano} m={m} t={t} />;
          case "abertura":
            return <Abertura key={i} plano={plano} m={m} t={t} />;
          case "destaque":
            return <Destaque key={i} plano={plano} m={m} t={t} zoom={zoomCheio} />;
          case "frase":
            return <Frase key={i} plano={plano} m={m} t={t} />;
          case "cta":
            return <Cta key={i} plano={plano} m={m} t={t} />;
          default:
            return null;
        }
      })}
      <Progresso plano={plano} t={t} dx={vaiAoCentro * (SLIDE_CENTRO - MARGEM_X)} />
      <Legenda plano={plano} t={t} />
      {trocas.map((x, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round((x - 0.02) * fps))} durationInFrames={Math.round(0.6 * fps)} layout="none">
          <Audio src={staticFile("sfx/pagina.wav")} volume={0.22} />
        </Sequence>
      ))}
      {molduras.map((x, i) => (
        <Sequence key={`f${i}`} from={Math.max(0, Math.round(x * fps))} durationInFrames={Math.round(0.8 * fps)} layout="none">
          <Audio src={staticFile("sfx/moldura.wav")} volume={0.2} />
        </Sequence>
      ))}
      {guias ? <Guias plano={plano} t={t} /> : null}
    </AbsoluteFill>
  );
};
