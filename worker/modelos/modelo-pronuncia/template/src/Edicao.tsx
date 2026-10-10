import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, prog, ROTULOS, RotulosCtx, troca, useTempo } from "./anim";
import { CameraLenta } from "./componentes/CameraLenta";
import { CartaoAbertura, CartaoCta, CartaoDefinicao, CartaoDestaque, CartaoFrase, CartaoNumero, CartaoPergunta, CartaoRepita } from "./componentes/Cartoes";
import { Ficha } from "./componentes/Ficha";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { GraficoSom, LadoALado, Lista } from "./componentes/Painel";
import {
  anteriorDe,
  cheiura,
  CORTINA,
  emendaPainel,
  estadosDaCaixa,
  fimDoMomento,
  type Janela,
  janelaLenta,
  proximoDe,
} from "./layout";
import { marcarFontesProntas } from "./medida";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { ehPainel, type Momento, type Plano } from "./plano";
import { cor, esperarFontes, rotulo } from "./tema";

// Um momento nunca invade o seguinte (termina quando o próximo começa).
const semSobreposicao = (plano: Plano): Plano => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return { ...plano, momentos: ordem.map((m, i) => (ordem[i + 1] && m.ate > ordem[i + 1].de ? { ...m, ate: ordem[i + 1].de } : m)) };
};

// a ficha que termina na câmera lenta some enquanto a pessoa está na tela inteira
const terminaNaLenta = (m: Momento, j: Janela | null) => !!j && j.fim >= m.ate - 0.25;

const BANDA = 150;

// Sons raros e tonais: o certo que se desenha, a câmera lenta, o fechamento.
const sons = (plano: Plano) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "pronuncia") {
      if (m.leitura) lista.push({ em: (m.leituraEm ?? m.em + 0.6) + 0.25, arquivo: "sfx/certo.wav", volume: 0.22 });
      const j = janelaLenta(m, plano.palavras);
      if (j) lista.push({ em: j.em, arquivo: "sfx/lenta.wav", volume: 0.12 });
    }
    if (m.tipo === "topicos" || m.tipo === "passos") m.itens.forEach((it) => lista.push({ em: it.em, arquivo: "sfx/nota.wav", volume: 0.16 }));
    if (m.tipo === "comparacao" && m.vencedor !== undefined) lista.push({ em: m.vencedorEm ?? m.lados[m.vencedor].em + 0.6, arquivo: "sfx/certo.wav", volume: 0.22 });
    if (m.tipo === "numero") lista.push({ em: m.em + 1.0, arquivo: "sfx/nota.wav", volume: 0.2 });
    if (m.tipo === "grafico" && m.dados?.length) lista.push({ em: m.dados[m.dados.length - 1].em + 0.3, arquivo: "sfx/nota.wav", volume: 0.2 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: "sfx/nota.wav", volume: 0.18 });
    if (m.tipo === "cta") lista.push({ em: m.de + 0.1, arquivo: "sfx/fim.wav", volume: 0.2 });
  }
  return lista.filter((s) => Number.isFinite(s.em) && s.em >= 0 && s.em < plano.duracao);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  // as medidas de texto usam a fonte de verdade: o quadro espera as fontes carregarem
  const [espera] = useState(() => delayRender("fontes do Pronúncia"));
  const [, setProntas] = useState(false);
  useEffect(() => {
    esperarFontes().then(() => {
      marcarFontesProntas();
      setProntas(true);
      continueRender(espera);
    });
  }, [espera]);

  const plano = useMemo(() => semSobreposicao(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const zona = { topo: plano.zona?.topo ?? 1000, altura: plano.zona?.altura ?? 470 };
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const janelas = useMemo(() => new Map(plano.momentos.map((m) => [m, janelaLenta(m, plano.palavras)] as const)), [plano]);
  const fichas = plano.momentos.filter((m) => m.tipo === "pronuncia").sort((a, b) => a.de - b.de);

  const caixa = caixaNoTempo(t, estados);
  const janela = 1 - cheiura(caixa);

  // ——— painéis: quando entram, quando saem, e a cortina entre dois painéis seguidos ———
  const fimDoPainel = (m: Momento) => {
    const proximo = proximoDe(m, plano);
    const j = janelas.get(m) ?? null;
    if (proximo && emendaPainel(m, proximo)) return terminaNaLenta(m, j) ? j!.em + 0.3 : proximo.de - 0.05 + CORTINA;
    return terminaNaLenta(m, j) ? j!.em + 0.3 : m.ate + 0.6;
  };
  const entraPorCortina = (m: Momento) => {
    const anterior = anteriorDe(m, plano);
    return !!anterior && emendaPainel(anterior, m) && !terminaNaLenta(anterior, janelas.get(anterior) ?? null);
  };
  const borda = (inicio: number) => 1080 - (1080 + BANDA) * prog(t, inicio, CORTINA, troca);

  const desenharPainel = (m: Momento) => {
    const chave = `${m.tipo}-${m.de}`;
    let clip: string | undefined;
    if (entraPorCortina(m) && t < m.de - 0.05 + CORTINA) clip = `inset(0px 0px 0px ${Math.max(0, borda(m.de - 0.05) + BANDA)}px)`;
    const proximo = proximoDe(m, plano);
    if (proximo && entraPorCortina(proximo) && t >= proximo.de - 0.05) clip = `inset(0px ${Math.max(0, 1080 - borda(proximo.de - 0.05))}px 0px 0px)`;
    const indice = fichas.indexOf(m as (typeof fichas)[number]) + 1;
    return (
      <div key={chave} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1046, clipPath: clip }}>
        {m.tipo === "pronuncia" ? <Ficha m={m} plano={plano} t={t} indice={indice} total={fichas.length} janela={janelas.get(m) ?? null} /> : null}
        <div style={{ position: "absolute", left: 60, top: 0, width: 960, height: 1046 }}>
          {m.tipo === "topicos" || m.tipo === "passos" ? <Lista m={m} t={t} plano={plano} /> : null}
          {m.tipo === "comparacao" ? <LadoALado m={m} t={t} /> : null}
          {m.tipo === "grafico" ? <GraficoSom m={m} t={t} /> : null}
        </div>
      </div>
    );
  };
  const paineis = plano.momentos.filter((m) => ehPainel(m) && t >= m.de - 0.1 && t <= fimDoPainel(m));
  // a cortina que passa entre dois painéis
  const cortina = plano.momentos.find((m) => ehPainel(m) && entraPorCortina(m) && t >= m.de - 0.05 && t <= m.de - 0.05 + CORTINA);

  // ——— cartões no peito (quadro cheio) ———
  const desenharCartao = (m: Momento) => {
    const fim = fimDoMomento(m, plano);
    const p = { t, fim, zona, plano };
    const chave = `${m.tipo}-${m.de}`;
    if (m.tipo === "abertura") return <CartaoAbertura key={chave} m={m} {...p} />;
    if (m.tipo === "frase") return <CartaoFrase key={chave} m={m} {...p} />;
    if (m.tipo === "destaque") return <CartaoDestaque key={chave} m={m} {...p} />;
    if (m.tipo === "numero") return <CartaoNumero key={chave} m={m} {...p} />;
    if (m.tipo === "definicao") return <CartaoDefinicao key={chave} m={m} {...p} />;
    if (m.tipo === "pergunta") return <CartaoPergunta key={chave} m={m} {...p} />;
    if (m.tipo === "cta") return <CartaoCta key={chave} m={m} {...p} />;
    if (m.tipo === "repita") return <CartaoRepita key={chave} m={m} {...p} />;
    return null;
  };
  const cartoes = plano.momentos.filter((m) => !ehPainel(m) && t >= m.de - 0.1 && t <= fimDoMomento(m, plano));

  // a voz normal baixa durante a câmera lenta (a voz lenta toma o lugar dela)
  const lentas = [...janelas.values()].filter((j): j is Janela => !!j);
  const volumeDaVoz = (s: number) =>
    lentas.reduce((v, j) => Math.min(v, 1 - prog(s, j.em - 0.03, 0.05) * (1 - prog(s, j.fim - 0.04, 0.08))), 1);

  const legendaCheia = zona.topo + 16;
  const yLegenda = (instante: number) => {
    const m = plano.momentos.find((x) => instante >= x.de - 0.05 && instante < x.ate);
    return m && ehPainel(m) ? 950 : legendaCheia;
  };

  return (
    <RotulosCtx.Provider value={{ ...ROTULOS, ...(plano.rotulos ?? {}) }}>
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
        {/* o painel de cima (ficha de som e blocos de painel), por baixo da pessoa */}
        {paineis.map(desenharPainel)}
        {cortina ? (
          <div
            style={{
              position: "absolute",
              left: borda(cortina.de - 0.05),
              top: 0,
              width: BANDA,
              height: 1046,
              background: cor.fundo2,
              borderLeft: `8px solid ${cor.coral}`,
            }}
          />
        ) : null}

        {/* a pessoa: tela inteira ou moldura larga embaixo. Muda: a voz vem do <Audio> abaixo */}
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.95)" mudo />
        {janela > 0.02 ? (
          <div
            style={{
              position: "absolute",
              left: caixa.x,
              top: caixa.y,
              width: caixa.w,
              height: caixa.h,
              borderRadius: caixa.raio,
              border: `3px solid rgba(251,246,238,${0.22 * janela})`,
            }}
          >
            {plano.marca.nome ? (
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  bottom: 22,
                  padding: "8px 18px 10px",
                  borderRadius: 14,
                  background: cor.cartao,
                  ...rotulo,
                  fontSize: 30,
                  color: cor.tinta,
                  opacity: prog(janela, 0.7, 0.3),
                }}
              >
                {plano.marca.nome}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* a repetição em câmera lenta, com a lupa na boca */}
        {plano.momentos.map((m) => {
          const j = janelas.get(m);
          if (!j || m.tipo !== "pronuncia") return null;
          return (
            <Sequence key={`lenta-${m.de}`} from={Math.round(j.em * fps)} durationInFrames={Math.max(1, Math.ceil((j.fim - j.em) * fps))} layout="none">
              <CameraLenta m={m} j={j} plano={plano} caixa={caixa} />
            </Sequence>
          );
        })}

        {/* cartões no peito, por cima da pessoa */}
        {cartoes.map(desenharCartao)}

        <Legendas frases={frases} y={yLegenda} />
        {guias ? <Guias plano={plano} zona={zona} legendaCheia={legendaCheia} /> : null}

        <Audio src={staticFile(plano.video)} volume={(f) => volumeDaVoz(f / fps)} />
        {plano.sfx === false
          ? null
          : listaDeSons.map((s) => (
              <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
                <Audio src={staticFile(s.arquivo)} volume={s.volume} />
              </Sequence>
            ))}
      </AbsoluteFill>
    </PalavrasCtx.Provider>
    </RotulosCtx.Provider>
  );
};
