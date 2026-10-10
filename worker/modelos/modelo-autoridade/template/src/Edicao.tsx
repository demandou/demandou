import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, saindo, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { Citacao } from "./componentes/Citacao";
import { Comparacao } from "./componentes/Comparacao";
import { Contraste } from "./componentes/Contraste";
import { Cta } from "./componentes/Cta";
import { Definicao } from "./componentes/Definicao";
import { Destaque } from "./componentes/Destaque";
import { FraseDeEfeito } from "./componentes/FraseDeEfeito";
import { Gancho } from "./componentes/Gancho";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Itens } from "./componentes/Itens";
import { Legendas } from "./componentes/Legendas";
import { Lista } from "./componentes/Lista";
import { Numero } from "./componentes/Numero";
import { Pergunta } from "./componentes/Pergunta";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, fontesCarregadas, zona as zonaPadrao } from "./tema";

// Só desenha depois que as fontes carregaram: os blocos medem o texto com a própria fonte.
let fontesProntas = false;
fontesCarregadas.then(() => {
  fontesProntas = true;
});
const useFontes = () => {
  const [prontas, setProntas] = useState(fontesProntas);
  const [espera] = useState(() => (fontesProntas ? null : delayRender("Carregando as fontes")));
  useEffect(() => {
    if (prontas) return;
    fontesCarregadas.then(() => {
      setProntas(true);
      if (espera !== null) continueRender(espera);
    });
  }, [prontas, espera]);
  return prontas;
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Cada bloco recebe a largura e a altura da zona (abaixo do queixo) e cabe nela. Os blocos grandes
// recebem uma folga (até 90 px acima da zona e, sem legenda, até perto da interface do app).
const renderMomento = (m: Momento, plano: Plano, largura: number, zona: { topo: number; altura: number }) => {
  const p = plano.palavras;
  const altura = zona.altura;
  const base = m.legenda ? 0 : Math.max(0, Math.min(40, 1548 - (zona.topo + zona.altura)));
  const folga = { zona: zona.altura, base };
  const alturaMax = zona.altura + 90 + base;
  switch (m.tipo) {
    case "abertura":
      return <Abertura m={m} palavras={p} largura={largura} altura={altura} />;
    case "topicos":
      return <Itens titulo={m.titulo} itens={m.itens} marcador="traco" de={m.de} ate={m.ate} largura={largura} altura={alturaMax} folga={folga} />;
    case "passos":
      return <Itens titulo={m.titulo} itens={m.itens} marcador="numero" de={m.de} ate={m.ate} largura={largura} altura={alturaMax} folga={folga} />;
    case "numero":
      return <Numero m={m} largura={largura} altura={altura} />;
    case "comparacao":
      return <Comparacao m={m} largura={largura} altura={alturaMax} folga={folga} />;
    case "grafico":
      return <Grafico m={m} largura={largura} altura={alturaMax} folga={folga} />;
    case "destaque":
      return <Destaque m={m} palavras={p} largura={largura} altura={altura} />;
    case "definicao":
      return <Definicao m={m} palavras={p} largura={largura} altura={alturaMax} folga={folga} />;
    case "frase":
      return <FraseDeEfeito m={m} palavras={p} largura={largura} altura={altura} />;
    case "pergunta":
      return <Pergunta m={m} palavras={p} largura={largura} altura={alturaMax} folga={folga} />;
    case "cta":
      return <Cta m={m} marca={plano.marca} fim={fimDoMomento(m, plano)} palavras={p} largura={largura} altura={altura} />;
    case "citacao":
      return <Citacao m={m} largura={largura} altura={alturaMax} folga={folga} />;
    case "gancho":
      return <Gancho m={m} palavras={p} />;
    case "lista":
      return <Lista m={m} />;
    case "contraste":
      return <Contraste m={m} />;
  }
};

// Sons discretos e tonais: um por batida importante, nada de ruído.
// tom = número, vencedor, alerta, fechamento · papel = o papel entra (documento, gráfico, verbete)
// tique = item, opção, lado
const sons = (plano: Plano) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  const tique = (em: number) => lista.push({ em, arquivo: "sfx/tique.wav", volume: 0.55 });
  for (const m of plano.momentos) {
    switch (m.tipo) {
      case "numero":
        lista.push({ em: typeof m.valor === "number" ? (m.em ?? m.de) : m.de, arquivo: "sfx/tom.wav", volume: 0.5 });
        break;
      case "citacao":
      case "grafico":
      case "definicao":
        lista.push({ em: m.de, arquivo: "sfx/papel.wav", volume: 0.5 });
        if (m.tipo === "citacao") m.itens?.forEach((i) => tique(i.em));
        if (m.tipo === "grafico") m.dados?.forEach((d) => tique(d.em));
        break;
      case "lista":
      case "topicos":
      case "passos":
        m.itens.forEach((i) => tique(i.em));
        break;
      case "contraste":
        m.opcoes.forEach((o) => tique(o.em));
        break;
      case "pergunta":
        m.opcoes?.forEach((o) => tique(o.em));
        break;
      case "comparacao":
        m.lados.forEach((l) => tique(l.em));
        if (m.vencedor !== undefined || m.modo === "errado-certo" || m.modo === "antes-depois")
          lista.push({ em: m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, arquivo: "sfx/tom.wav", volume: 0.35 });
        break;
      case "destaque":
        if (m.nivel === "alerta") lista.push({ em: m.em, arquivo: "sfx/tom.wav", volume: 0.45 });
        break;
      case "cta":
        lista.push({ em: m.de + 0.55, arquivo: "sfx/tom.wav", volume: 0.4 });
        break;
    }
  }
  // dois sons a menos de 0,25 s um do outro viram um
  lista.sort((a, b) => a.em - b.em);
  return lista.filter((s, i) => i === 0 || s.em - lista[i - 1].em >= 0.25);
};

// Zoom automático: troca seca em cada corte (disfarça o pulo) e na entrada dos momentos (dá ritmo),
// alternando 1 e 1,05. Parte do rosto, então o rosto não sai do lugar.
const enquadrar = (plano: Plano) => {
  const pontos = [
    ...(plano.cortesEm ?? []).map((t) => ({ t, corte: true })),
    ...plano.momentos.map((m) => ({ t: Math.max(0, m.de), corte: false })),
  ].sort((a, b) => a.t - b.t);
  const trechos = [{ de: 0, zoom: 1 }];
  for (const p of pontos) {
    const ultimo = trechos[trechos.length - 1];
    if (p.t - ultimo.de < (p.corte ? 1.2 : 2.5)) continue;
    trechos.push({ de: p.t, zoom: ultimo.zoom === 1 ? 1.05 : 1 });
  }
  return trechos;
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

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const fontes = useFontes();
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps, width, height } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const videoAltura = Math.min(height, plano.videoAltura ?? height);
  // a legenda fica logo abaixo da zona, mas sempre acima da interface do aplicativo
  const legendaY = Math.min(zona.topo + zona.altura + 42, 1500);

  const enquadramentos = useMemo(
    () => (planoOriginal.enquadramentos?.length ? planoOriginal.enquadramentos : enquadrar(planoOriginal)),
    [planoOriginal],
  );
  const quadro = [...enquadramentos].reverse().find((e) => t >= e.de) ?? { zoom: 1 };
  const ativos = plano.momentos.filter((m) => t >= m.de - 0.05 && t <= fimDoMomento(m, plano));

  // O fundo escurece embaixo só enquanto há texto para ler.
  const presenca = Math.max(
    0,
    ...plano.momentos.map((m) => Math.min(prog(t, m.de, 0.4), 1 - saindo(t, fimDoMomento(m, plano), 0.3))),
    ...frases.map((f) => Math.min(prog(t, f.de - 0.1, 0.3), 1 - saindo(t, f.ate + 0.2, 0.3)) * 0.8),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: cor.tinta }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height: videoAltura,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            scale: String(quadro.zoom),
            transformOrigin: `${plano.rosto.x * width}px ${plano.rosto.y * height}px`,
          }}
        >
          {/* do motor: quadro cheio que segue o rosto quando a pessoa se mexe (parado, é igual ao vídeo cheio) */}
          <VideoNaCaixa
            src={plano.video}
            caixa={{ x: 0, y: 0, w: width, h: videoAltura, zoom: 1, ancoraY: (plano.rosto.y * height) / videoAltura }}
            rosto={plano.rosto}
            videoAltura={videoAltura}
            filtro="contrast(1.04) saturate(0.93)"
          />
        </div>
        {/* vídeo mais baixo que o quadro: a base dele se dissolve no fundo escuro */}
        {videoAltura < height ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "34%",
              background: `linear-gradient(to bottom, rgba(14,23,38,0), ${cor.tinta})`,
            }}
          />
        ) : null}
      </div>

      {/* o degradê escuro acompanha a zona: começa acima dela e já está firme no topo do texto,
          para o marfim ler bem até sobre roupa clara */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, rgba(14,23,38,0) ${zona.topo - 160}px, rgba(14,23,38,0.5) ${zona.topo + 60}px, rgba(14,23,38,0.66) ${zona.topo + 260}px, rgba(14,23,38,0.76) ${height}px)`,
          opacity: 0.25 + 0.75 * presenca,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: zona.esquerda,
          right: zona.direita,
          top: zona.topo,
          height: zona.altura,
        }}
      >
        {ativos.map((m) => (
          <div
            key={`${m.tipo}-${m.de}`}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            {fontes ? renderMomento(m, plano, width - zona.esquerda - zona.direita, zona) : null}
          </div>
        ))}
      </div>

      <Legendas frases={frases} y={legendaY} />

      {guias ? <Guias plano={plano} zona={zona} legendaY={legendaY} /> : null}

      {plano.sfx === false
        ? null
        : sons(plano).map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
