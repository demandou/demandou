import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { corre, useTempo } from "./anim";
import { BlocoNaPrancha } from "./componentes/Bloco";
import { Capa } from "./componentes/Capa";
import { Cartao } from "./componentes/Cartao";
import { CartaoNovo } from "./componentes/CartaoNovo";
import { romano } from "./componentes/Cabecalho";
import { EtiquetaDeCampo } from "./componentes/EtiquetaDeCampo";
import { FiguraNaPrancha } from "./componentes/Figura";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Moldura, Papel } from "./componentes/Moldura";
import { cameraEm, ehCheio, estadosDaCaixa, inicioDaTroca, ovalidade, pranchas as montarPranchas, trechos } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, zona as zonaPadrao } from "./tema";

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte.
const comCapa = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: a câmera que corre para a próxima prancha (duas notas, uma altura por prancha),
// a água (gota grave), a raiz que apodrece (dois tons graves descendo), o ✗ do furo, o dedo que toca
// a terra, o dia que passa (três notas subindo) e o acorde do fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const pr = montarPranchas(plano);
  pr.forEach((p, i) => {
    if (i > 0) lista.push({ em: p.chegada + 0.08, arquivo: `sfx/prancha-${((i - 1) % 3) + 1}.wav`, volume: 0.36 });
    if (p.mergulho !== undefined) lista.push({ em: p.mergulho + 0.08, arquivo: "sfx/mergulho.wav", volume: 0.38 });
  });
  for (const m of plano.momentos) {
    if (m.tipo === "figura") {
      for (const a of m.acoes ?? []) {
        if (a.acao === "regar") lista.push({ em: a.em + 0.5, arquivo: "sfx/agua.wav", volume: 0.4 });
        if (a.acao === "apodrecer") lista.push({ em: a.em + 0.05, arquivo: "sfx/grave.wav", volume: 0.42 });
        if (a.acao === "afastar") lista.push({ em: a.em + 0.05, arquivo: "sfx/desliza.wav", volume: 0.34 });
        if (a.acao === "semFuro") lista.push({ em: a.em + 0.12, arquivo: "sfx/erro.wav", volume: 0.4 });
        if (a.acao === "acumular") lista.push({ em: a.em + 0.1, arquivo: "sfx/agua.wav", volume: 0.32 });
        if (a.acao === "furo") lista.push({ em: a.em + 0.35, arquivo: "sfx/agua.wav", volume: 0.36 });
        if (a.acao === "dedo") lista.push({ em: a.em + 0.55, arquivo: "sfx/toque.wav", volume: 0.42 });
        if (a.acao === "umida") lista.push({ em: a.em + 0.1, arquivo: "sfx/agua.wav", volume: 0.3 });
        if (a.acao === "esperar" || a.acao === "brotar") lista.push({ em: a.em, arquivo: "sfx/dia.wav", volume: 0.36 });
      }
    }
    if (m.tipo === "cta") lista.push({ em: (m.icones?.[0]?.em ?? m.em ?? m.de + 0.4) + 0.08, arquivo: "sfx/fecho.wav", volume: 0.36 });
    // blocos universais: uma nota curta de pena quando um item ganha tinta; o resto, nas batidas fortes
    if (m.tipo === "topicos" || m.tipo === "passos") m.itens.forEach((it) => lista.push({ em: it.em + 0.05, arquivo: "sfx/folha.wav", volume: 0.3 }));
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/dia.wav", volume: 0.32 });
    if (m.tipo === "comparacao") {
      m.lados.forEach((l) => lista.push({ em: l.em + 0.05, arquivo: "sfx/folha.wav", volume: 0.3 }));
      if (m.modo === "errado-certo") lista.push({ em: m.lados[0].em + 0.5, arquivo: "sfx/erro.wav", volume: 0.34 });
    }
    if (m.tipo === "grafico") {
      if (m.dados?.length) m.dados.forEach((d) => lista.push({ em: d.em + 0.05, arquivo: "sfx/folha.wav", volume: 0.3 }));
      else lista.push({ em: (m.tendenciaEm ?? m.de + 0.3) + 0.05, arquivo: m.tendencia === "cai" ? "sfx/grave.wav" : "sfx/dia.wav", volume: 0.32 });
    }
    if (m.tipo === "destaque") lista.push({ em: m.em + 0.1, arquivo: m.nivel === "alerta" ? "sfx/erro.wav" : "sfx/toque.wav", volume: 0.38 });
    if (m.tipo === "definicao") lista.push({ em: m.significadoEm + 0.05, arquivo: "sfx/toque.wav", volume: 0.36 });
    if (m.tipo === "frase" && m.riscoEm !== undefined) lista.push({ em: m.riscoEm + 0.1, arquivo: "sfx/erro.wav", volume: 0.34 });
    if (m.tipo === "pergunta") {
      lista.push({ em: (m.em ?? m.de) + 0.1, arquivo: "sfx/toque.wav", volume: 0.34 });
      (m.opcoes ?? []).forEach((o) => lista.push({ em: o.em + 0.05, arquivo: "sfx/folha.wav", volume: 0.3 }));
    }
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Definições comuns dos desenhos: a borda de aquarela (aguada que vaza um pouco) e a hachura de corte
const Definicoes: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="aquarela" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={4} result="ruido" />
        <feDisplacementMap in="SourceGraphic" in2="ruido" scale={10} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <pattern id="hachura" width={11} height={11} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1={0} y1={0} x2={0} y2={11} stroke={cor.vasoCorte} strokeWidth={2.2} />
      </pattern>
      <pattern id="hachuraTinta" width={13} height={13} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1={0} y1={0} x2={0} y2={13} stroke={cor.tinta} strokeWidth={1.6} />
      </pattern>
      <pattern id="hachuraFolha" width={13} height={13} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <line x1={0} y1={0} x2={0} y2={13} stroke={cor.folhaTinta} strokeWidth={1.6} />
      </pattern>
    </defs>
  </svg>
);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const listaTrechos = useMemo(() => trechos(plano), [plano]);
  const lista = useMemo(() => montarPranchas(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const caixa = caixaNoTempo(t, estados);
  const oval = ovalidade(t, plano);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const camera = cameraEm(t, lista, corre);
  const camX = camera * 1080;
  const totalFiguras = Math.max(0, ...plano.momentos.map((m) => (m.tipo === "figura" ? (m.numero ?? 0) : 0)));
  // "Fig. N" dos blocos: a ordem da prancha, sem contar o frontispício
  const temFrontispicio = lista[0]?.vista === "capa";
  const numeroDaFigura = (indice: number) => indice + (temFrontispicio ? 0 : 1);
  const layoutAtual = [...listaTrechos].reverse().find((x) => x.de <= t)?.layout ?? "cheio";
  const r = 50 * oval;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel, fontVariantNumeric: "lining-nums", fontFeatureSettings: '"lnum" 1' }}>
      <Definicoes />
      <Papel
        titulo={plano.marca.nome ? `Herbário de ${plano.marca.nome}` : "Herbário"}
        prancha={`Prancha ${romano(Math.round(camera) + 1)}`}
      />

      {/* as pranchas, lado a lado; a câmera corre por elas */}
      {lista.map((p, i) => {
        const x = p.indice * 1080 - camX;
        if (x > 1080 || x < -1080) return null;
        const proxima = lista[i + 1];
        return (
          <div key={p.indice} style={{ position: "absolute", left: x, top: 0, width: 1080, height: 1920, overflow: "visible" }}>
            {p.vista === "capa" ? (
              <Capa
                m={p.momentos[0] as Extract<Momento, { tipo: "capa" | "abertura" }>}
                t={t}
                palavras={plano.palavras}
                marca={plano.marca}
                indice={(p.momentos[0] as Extract<Momento, { tipo: "capa" | "abertura" }>).indice ?? 0}
              />
            ) : p.vista === "bloco" ? (
              <BlocoNaPrancha
                m={p.momentos[0]}
                t={t}
                palavras={plano.palavras}
                chegada={p.chegada}
                layout={p.layout === "lado" ? "lado" : "canto"}
                numeroFig={numeroDaFigura(p.indice)}
              />
            ) : (
              <FiguraNaPrancha
                prancha={p}
                t={t}
                palavras={plano.palavras}
                totalFiguras={totalFiguras}
                fimDe={(m) => fimDoMomento(m, plano)}
                proximaChegada={proxima?.chegada ?? plano.duracao + 1}
              />
            )}
          </div>
        );
      })}

      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.02) saturate(0.94) sepia(0.06)"
        estilo={{ borderRadius: `${r}% / ${r}%` }}
      />
      <Moldura caixa={caixa} oval={oval} />

      {plano.momentos.filter(ehCheio).map((m) => {
        // vindo de uma prancha, o cartão espera o oval crescer até cobrir o desenho (nunca entra por
        // cima do texto da prancha que sai); vindo de tela cheia, entra logo
        const anterior = [...plano.momentos].filter((o) => o.de < m.de).sort((a, b) => b.de - a.de)[0];
        const vemDePrancha = !!anterior && !ehCheio(anterior) && m.de - anterior.ate < 1.2;
        const comum = {
          t,
          fim: fimDoMomento(m, plano),
          palavras: plano.palavras,
          topo: zona.topo + 4,
          entrada: inicioDaTroca(m.de, plano) + (vemDePrancha ? 0.4 : 0.12),
        };
        if (m.tipo === "destaque") return <EtiquetaDeCampo key={`${m.tipo}-${m.de}`} m={m} {...comum} />;
        // o cartão antigo (linhas já quebradas: o demo) continua igual; o resto mede o próprio texto
        if ((m.tipo === "cta" || m.tipo === "nota") && m.linhas?.length)
          return <Cartao key={`${m.tipo}-${m.de}`} m={m} marca={plano.marca} {...comum} entrada={inicioDaTroca(m.de, plano) + 0.18} />;
        if (m.tipo === "cta" || m.tipo === "nota" || m.tipo === "frase" || m.tipo === "pergunta")
          return <CartaoNovo key={`${m.tipo}-${m.de}`} m={m} marca={plano.marca} {...comum} />;
        return null;
      })}

      <Legendas frases={frases} />

      {guias ? <Guias plano={plano} zona={zona} caixa={caixa} layout={layoutAtual} /> : null}

      {plano.sfx === false
        ? null
        : listaSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
