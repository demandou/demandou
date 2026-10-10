// O modelo Anatomia, versão deitada (16:9, 1920×1080, o vídeo completo do YouTube): ilustração médica
// premium e fácil de ler. A pessoa começa em quadro cheio; na virada ("E se eu fosse… MÉDICO?") uma
// linha de luz desce e troca a roupa (com o vídeo de figurino) ou o cenário; quando a explicação
// começa, a regra da aula 9 do curso: a pessoa vai para uma moldura em pé à direita (o rosto
// centralizado e seguido suavemente) e a prancha clínica ocupa o quadro da esquerda (o rosto em traço
// fino com os músculos que acendem na palavra, o corte da pele, a linha do tempo e os blocos). No fim
// da explicação, a pessoa volta para o quadro cheio.
//
// A prancha é desenhada na grade do vertical (1080 de largura, do topo até FUNDO) e entra no quadro
// da esquerda por uma escala só (tema.ts, PRANCHA_NA_TELA): os blocos mantêm as medidas e o encaixe
// de texto do vertical. O que fica fora da prancha (a pergunta da virada, o mito, a legenda, o crachá,
// a linha do tempo em tela cheia) é composto direto no quadro deitado.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { useTempo } from "./anim";
import { Anatomia, type Mergulho, type NoVideo } from "./componentes/Anatomia";
import { BlocoAbertura, BlocoComparacao, BlocoCta, BlocoDefinicao, BlocoDestaque, BlocoFrase, BlocoGrafico, BlocoNumero, BlocoPassos, BlocoPergunta, BlocoTopicos } from "./componentes/Blocos";
import { LinhaDeLuz, linhaY, Mito, Pergunta } from "./componentes/Cabecalhos";
import { Corte } from "./componentes/Corte";
import { LinhaDoTempo, TELA_DEITADA } from "./componentes/LinhaDoTempo";
import { alturaDaLegenda, estadoDaPessoa, eventosDoLayout, Guias, Legenda, pontoNoVideo, rostoDeslocado, sombraDaMoldura, Tarja, trocaDa, viradaDo } from "./componentes/Pessoa";
import { type Rosto, rostoNaTela, VideoNaCaixa } from "./motor/caixa";
import type { Anatomia as TAnatomia, Corte as TCorte, Momento, Plano } from "./plano";
import { FUNDO, K, lerp, MARGEM, naPrancha, naTela, PRANCHA_NA_TELA, QUADRO, win } from "./tema";

// a legenda continua por padrão nos efeitos próprios (eles não escrevem a fala)
const COM_LEGENDA = new Set<Momento["tipo"]>(["virada", "mito", "anatomia", "corte", "linhaDoTempo"]);
const preparar = (plano: Plano): Plano => {
  const rosto = plano.rosto as Rosto;
  return {
    ...plano,
    // o quadro em que o rosto foi medido: o cortar.mjs do 16:9 grava; um plano sem ele é do quadro deitado
    rosto: rosto.quadro ? rosto : { ...rosto, quadro: { largura: plano.largura ?? QUADRO.w, altura: plano.altura ?? QUADRO.h } },
    momentos: plano.momentos.map((m) => (m.legenda === undefined && COM_LEGENDA.has(m.tipo) ? { ...m, legenda: true } : m)),
  } as Plano;
};

type Som = { em: number; arquivo: string; volume: number };
const TONS = ["sfx/tone1.wav", "sfx/tone2.wav", "sfx/tone3.wav"];
const sonsDo = (plano: Plano, eventos: ReturnType<typeof eventosDoLayout>): Som[] => {
  const s: Som[] = [];
  const v = viradaDo(plano);
  if (v) s.push({ em: trocaDa(v) - 0.25, arquivo: "sfx/swap_crystal.wav", volume: 0.35 });
  eventos.forEach((e, i) => {
    if (e.layout === "dividido" && (i === 0 || eventos[i - 1].layout !== "dividido")) s.push({ em: e.t - 0.12, arquivo: "sfx/lift_airy.wav", volume: 0.3 });
  });
  let tom = 0;
  for (const m of plano.momentos) {
    switch (m.tipo) {
      case "anatomia":
        [...m.estruturas].sort((a, b) => a.em - b.em).forEach((e) => s.push({ em: e.em, arquivo: TONS[tom++ % 3], volume: 0.22 }));
        break;
      case "corte":
        s.push({ em: m.de - 0.13, arquivo: "sfx/dive_light.wav", volume: 0.35 });
        if (m.sinal && (m.sinal.bloqueioEm !== undefined || m.agente)) s.push({ em: (m.sinal.bloqueioEm ?? m.agente?.efeitoEm ?? (m.agente ? m.agente.em + 0.5 : m.de)) - 0.1, arquivo: "sfx/block_airlock.wav", volume: 0.3 });
        if (m.relaxaEm !== undefined) s.push({ em: m.relaxaEm - 0.5, arquivo: "sfx/relax_downer.wav", volume: 0.2 });
        break;
      case "linhaDoTempo": {
        s.push({ em: m.de - 0.1, arquivo: "sfx/chart_boost.wav", volume: 0.22 });
        const herois = m.marcos.filter((x) => x.valor);
        if (herois.length > 1) s.push({ em: (herois[1].valorEm ?? herois[1].em) - 0.24, arquivo: "sfx/tone4.wav", volume: 0.2 });
        break;
      }
      case "numero":
        s.push({ em: m.em, arquivo: "sfx/tone4.wav", volume: 0.2 });
        break;
      case "destaque":
        s.push({ em: m.em, arquivo: "sfx/tone2.wav", volume: 0.2 });
        break;
      case "cta":
        s.push({ em: m.de + 0.1, arquivo: "sfx/tone3.wav", volume: 0.18 });
        break;
      case "comparacao":
        if (m.vencedor !== undefined) s.push({ em: m.vencedorEm ?? m.de + 1, arquivo: "sfx/tone2.wav", volume: 0.18 });
        break;
      case "abertura":
      case "pergunta":
        s.push({ em: m.de + 0.15, arquivo: "sfx/tone1.wav", volume: 0.16 });
        break;
      case "topicos":
      case "passos":
        s.push({ em: m.itens[0]?.em ?? m.de, arquivo: "sfx/tone1.wav", volume: 0.14 });
        break;
      default:
        break;
    }
  }
  return s.filter((x) => x.em >= 0 && x.em < plano.duracao - 0.1);
};

// o corte que "mergulha" de dentro de uma anatomia (começa até 0,6 s antes/depois do fim dela)
const mergulhoDe = (plano: Plano, m: TAnatomia): Mergulho | undefined => {
  const c = plano.momentos.find((x): x is TCorte => x.tipo === "corte" && Math.abs(x.de - m.ate) <= 0.6);
  if (!c || m.parte === "esquema") return undefined;
  return { de: c.de, regiao: c.regiao ?? [...m.estruturas].sort((a, b) => b.em - a.em)[0]?.id };
};

// O cabeçalho do mito no quadro deitado: no quadro cheio e no consultório, no alto da tela, centrado
// (sobre a faixa de papel, acima da cabeça); com a prancha aberta, no alto da prancha (y 196 da grade
// do vertical, como lá), na escala dela.
const MITO_NO_ALTO = { x: QUADRO.w / 2, y: 104, escala: 1 };
const MITO_NA_PRANCHA = { ...naTela(540, 196), escala: PRANCHA_NA_TELA.escala };

// A pergunta da virada ("E se eu fosse" + NOME): no vertical ela ficava acima da cabeça. No quadro
// deitado não sobra altura acima da cabeça, então ela vai acima só quando cabe; senão, ao lado da
// cabeça, no lado com mais espaço, na altura dos olhos.
const ALTURA_DA_PERGUNTA = 190;
const lugarDaPergunta = (rs: { x: number; y: number; largura: number }) => {
  const topoDaCabeca = rs.y - rs.largura * 0.95;
  if (topoDaCabeca - 24 - ALTURA_DA_PERGUNTA >= 56) return { x: Math.min(QUADRO.w - MARGEM - 520, Math.max(MARGEM + 520, rs.x)), y: topoDaCabeca - 24 - ALTURA_DA_PERGUNTA / 2, largura: 1040 };
  const meia = rs.largura * 0.85;
  const livreEsq = rs.x - meia - MARGEM;
  const livreDir = QUADRO.w - MARGEM - (rs.x + meia);
  const esquerda = livreEsq >= livreDir;
  const largura = Math.max(380, Math.min(820, (esquerda ? livreEsq : livreDir) - 24));
  const x = esquerda ? rs.x - meia - 24 - largura / 2 : rs.x + meia + 24 + largura / 2;
  return { x: Math.min(QUADRO.w - MARGEM - largura / 2, Math.max(MARGEM + largura / 2, x)), y: Math.min(QUADRO.h - 300, Math.max(56 + ALTURA_DA_PERGUNTA / 2, rs.y - rs.largura * 0.2)), largura };
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => preparar(bruto), [bruto]);
  const eventos = useMemo(() => eventosDoLayout(plano), [plano]);
  const sons = useMemo(() => sonsDo(plano, eventos), [plano, eventos]);
  const videoAltura = plano.videoAltura ?? QUADRO.h;
  const rosto = plano.rosto as Rosto;
  const est = estadoDaPessoa(plano, eventos, t);
  const caixa = est.caixa;
  // o fim da prancha na grade do vertical (lá era o topo da moldura de baixo)
  const fundo = FUNDO;

  const virada = viradaDo(plano);
  const troca = virada ? trocaDa(virada) : Infinity;
  const yLuz = virada ? linhaY(t, troca) : 0;
  const naTroca = t >= troca && t <= troca + 0.6;
  const depoisDaTroca = t > troca + 0.6;
  const videoVirada = virada?.video;
  const deVirada = virada?.videoDe ?? 0;
  const rostoVirada = useMemo(() => rostoDeslocado(rosto, deVirada), [rosto, deVirada]);
  // virada sem vídeo: durante a linha de luz, acima dela já está o layout de depois
  const estDepois = virada && !videoVirada ? estadoDaPessoa(plano, eventos, troca + 0.62) : null;

  const momentos = plano.momentos;
  const mito = momentos.find((m) => m.tipo === "mito" && t >= m.de - 0.1 && t <= m.ate + 0.1);
  const lugarDoMito = {
    x: lerp(MITO_NO_ALTO.x, MITO_NA_PRANCHA.x, est.prancha),
    y: lerp(MITO_NO_ALTO.y, MITO_NA_PRANCHA.y, est.prancha),
    escala: lerp(MITO_NO_ALTO.escala, MITO_NA_PRANCHA.escala, est.prancha),
  };
  const banda = mito ? win(t, mito.de - 0.1, mito.ate - 0.3, 0.45, 0.35) * (1 - est.papel) : 0;
  const yLegenda = alturaDaLegenda(plano, est, t);
  const rs = rostoNaTela(caixa, rosto, videoAltura, t);
  // a ilustração que sai do vídeo: o ponto do vídeo (tela) levado para a grade da prancha
  const noVideo: NoVideo = (x, y, tt) => {
    const p = pontoNoVideo(estadoDaPessoa(plano, eventos, tt).caixa, plano, tt, x, y);
    const q = naPrancha(p.x, p.y);
    return { x: q.x, y: q.y, largura: p.lv / PRANCHA_NA_TELA.escala };
  };

  const pessoaEstilo = { boxShadow: sombraDaMoldura(est.moldura), opacity: est.opacidade };
  const prancha = momentos.map((m, i) => {
    if (t < m.de - 0.2 || t > m.ate + 0.6) return null;
    const p = { t, palavras: plano.palavras, fundo };
    switch (m.tipo) {
      case "anatomia":
        return <Anatomia key={i} m={m} t={t} plano={plano} noVideo={noVideo} mergulho={mergulhoDe(plano, m)} fundo={fundo} />;
      case "corte":
        return <Corte key={i} m={m} t={t} />;
      case "linhaDoTempo":
        // a de tela cheia é composta direto no quadro deitado (abaixo)
        return m.telaCheia ? null : <LinhaDoTempo key={i} m={m} t={t} />;
      case "abertura":
        return t >= m.de && t < m.ate ? <BlocoAbertura key={i} m={m} {...p} /> : null;
      case "topicos":
        return t >= m.de && t < m.ate ? <BlocoTopicos key={i} m={m} {...p} /> : null;
      case "passos":
        return t >= m.de && t < m.ate ? <BlocoPassos key={i} m={m} {...p} /> : null;
      case "numero":
        return t >= m.de && t < m.ate ? <BlocoNumero key={i} m={m} {...p} /> : null;
      case "comparacao":
        return t >= m.de && t < m.ate ? <BlocoComparacao key={i} m={m} {...p} /> : null;
      case "grafico":
        return t >= m.de && t < m.ate ? <BlocoGrafico key={i} m={m} {...p} /> : null;
      case "destaque":
        return t >= m.de && t < m.ate ? <BlocoDestaque key={i} m={m} {...p} /> : null;
      case "definicao":
        return t >= m.de && t < m.ate ? <BlocoDefinicao key={i} m={m} {...p} /> : null;
      case "frase":
        return t >= m.de && t < m.ate ? <BlocoFrase key={i} m={m} {...p} /> : null;
      case "pergunta":
        return t >= m.de && t < m.ate ? <BlocoPergunta key={i} m={m} {...p} /> : null;
      case "cta":
        return t >= m.de && t < m.ate ? <BlocoCta key={i} m={m} {...p} /> : null;
      default:
        return null;
    }
  });
  const telasCheias = momentos.map((m, i) => (m.tipo === "linhaDoTempo" && m.telaCheia && t >= m.de - 0.2 && t <= m.ate + 0.6 ? <LinhaDoTempo key={`tela-${i}`} m={m} t={t} geo={TELA_DEITADA} /> : null));
  const pergunta = virada ? lugarDaPergunta(rs) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: K.paper }}>
      {/* o papel clínico (consultório e prancha) */}
      <AbsoluteFill style={{ opacity: est.papel, background: `linear-gradient(180deg, ${K.paper} 0%, #EEF3F8 100%)` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: naTela(1080, 0).x, height: QUADRO.h, background: "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(220,233,247,0.7), rgba(220,233,247,0) 70%)" }} />
      </AbsoluteFill>

      {/* a pessoa: a voz vem daqui, o vídeo inteiro */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={rosto} videoAltura={videoAltura} estilo={pessoaEstilo} />
      {/* virada com vídeo de figurino: acima da linha de luz já é a roupa nova (mudo) */}
      {videoVirada ? (
        <Sequence from={Math.round(deVirada * fps)} layout="none">
          <AbsoluteFill style={{ clipPath: depoisDaTroca ? undefined : naTroca ? `inset(0 0 ${QUADRO.h - yLuz}px 0)` : "inset(0 0 100% 0)" }}>
            <VideoNaCaixa src={videoVirada} caixa={caixa} rosto={rostoVirada} videoAltura={videoAltura} estilo={pessoaEstilo} mudo />
          </AbsoluteFill>
        </Sequence>
      ) : null}
      {/* virada sem vídeo: acima da linha, o consultório (papel + moldura grande) */}
      {estDepois && naTroca ? (
        <AbsoluteFill style={{ clipPath: `inset(0 0 ${QUADRO.h - yLuz}px 0)` }}>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${K.paper} 0%, #EEF3F8 100%)` }} />
          <VideoNaCaixa src={plano.video} caixa={estDepois.caixa} rosto={rosto} videoAltura={videoAltura} estilo={{ boxShadow: sombraDaMoldura(1) }} mudo />
        </AbsoluteFill>
      ) : null}
      {virada ? <LinhaDeLuz t={t} troca={troca} /> : null}

      {/* faixa de papel atrás do cabeçalho, quando ele aparece sobre o quadro cheio */}
      {banda > 0 ? <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: 290, background: `linear-gradient(180deg, rgba(${K.paperRGB},${0.8 * banda}) 0px, rgba(${K.paperRGB},${0.8 * banda}) 176px, rgba(${K.paperRGB},0) 290px)` }} /> : null}

      {/* a prancha: a grade do vertical (1080 × FUNDO) no quadro da esquerda; o que passar dela não
          invade a moldura da pessoa */}
      <div
        style={{
          position: "absolute",
          left: PRANCHA_NA_TELA.x,
          top: PRANCHA_NA_TELA.y,
          width: 1080,
          height: fundo + 12,
          overflow: "hidden",
          transform: `scale(${PRANCHA_NA_TELA.escala})`,
          transformOrigin: "0 0",
        }}
      >
        {prancha}
      </div>
      {telasCheias}

      {/* cabeçalhos */}
      {mito && mito.tipo === "mito" ? <Mito m={mito} t={t} y={lugarDoMito.y} x={lugarDoMito.x} escala={lugarDoMito.escala} /> : null}
      {virada && pergunta ? <Pergunta m={virada} t={t} troca={troca} y={pergunta.y} x={pergunta.x} largura={pergunta.largura} /> : null}

      <Legenda plano={plano} t={t} y={yLegenda} />
      <Tarja plano={plano} t={t} caixa={caixa} />
      {guias ? <Guias rosto={rs} yLegenda={yLegenda} topoMoldura={caixa.y} /> : null}

      {plano.sfx === false
        ? null
        : sons.map((s, i) => (
            <Sequence key={`${s.arquivo}-${i}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
      {plano.trilha ? (
        <Audio
          src={staticFile(plano.trilha.arquivo)}
          loop
          volume={(f) => (plano.trilha?.volume ?? 0.12) * interpolate(f / fps, [0, 1.2, plano.duracao - 1.5, plano.duracao], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      ) : null}
    </AbsoluteFill>
  );
};
