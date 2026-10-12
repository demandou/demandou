import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, saindo, useTempo } from "./anim";
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
import { alturaDoVideo, arranjos, estadosDaPessoa, lugarDoPeito, regiaoDo, type Peito } from "./layout";
import { caixaNoTempo, CHEIO_16x9, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, fontesCarregadas, LEGENDA_Y, MOLDURA, QUADRO, zona as zonaPadrao } from "./tema";

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

// Cada bloco recebe a largura e a altura da região dele (a faixa do peito na tela cheia, ou o
// quadro da esquerda com a pessoa na moldura) e cabe nela.
const renderMomento = (m: Momento, plano: Plano, largura: number, altura: number) => {
  const p = plano.palavras;
  const folga = { zona: altura, base: 0 };
  switch (m.tipo) {
    case "abertura":
      return <Abertura m={m} palavras={p} largura={largura} altura={altura} />;
    case "topicos":
      return <Itens titulo={m.titulo} itens={m.itens} marcador="traco" de={m.de} ate={m.ate} largura={largura} altura={altura} folga={folga} />;
    case "passos":
      return <Itens titulo={m.titulo} itens={m.itens} marcador="numero" de={m.de} ate={m.ate} largura={largura} altura={altura} folga={folga} />;
    case "numero":
      return <Numero m={m} largura={largura} altura={altura} />;
    case "comparacao":
      return <Comparacao m={m} largura={largura} altura={altura} folga={folga} />;
    case "grafico":
      return <Grafico m={m} largura={largura} altura={altura} folga={folga} />;
    case "destaque":
      return <Destaque m={m} palavras={p} largura={largura} altura={altura} />;
    case "definicao":
      return <Definicao m={m} palavras={p} largura={largura} altura={altura} folga={folga} />;
    case "frase":
      return <FraseDeEfeito m={m} palavras={p} largura={largura} altura={altura} />;
    case "pergunta":
      return <Pergunta m={m} palavras={p} largura={largura} altura={altura} folga={folga} />;
    case "cta":
      return <Cta m={m} marca={plano.marca} fim={fimDoMomento(m, plano)} palavras={p} largura={largura} altura={altura} />;
    case "citacao":
      return <Citacao m={m} largura={largura} altura={altura} folga={folga} />;
    case "gancho":
      return <Gancho m={m} palavras={p} largura={largura} altura={altura} />;
    case "lista":
      return <Lista m={m} largura={largura} />;
    case "contraste":
      return <Contraste m={m} largura={largura} />;
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

// O degradê escuro que deixa o texto do peito legível: sobe de baixo (faixa do peito) ou vem do
// lado livre (quando o bloco fica ao lado da pessoa).
const degrade = (peito: Peito, altura: number) => {
  if (peito.lado === "baixo")
    return `linear-gradient(to bottom, rgba(14,23,38,0) ${peito.y - 160}px, rgba(14,23,38,0.5) ${peito.y + 60}px, rgba(14,23,38,0.66) ${peito.y + 220}px, rgba(14,23,38,0.76) ${altura}px)`;
  const borda = peito.lado === "esquerda" ? peito.x + peito.w : QUADRO.w - peito.x;
  return `linear-gradient(to ${peito.lado === "esquerda" ? "right" : "left"}, rgba(14,23,38,0.76) 0px, rgba(14,23,38,0.62) ${borda - 120}px, rgba(14,23,38,0) ${borda + 180}px)`;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const fontes = useFontes();
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps, height } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const mapa = useMemo(() => arranjos(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, mapa), [plano, mapa]);
  const videoAltura = alturaDoVideo(plano);

  // a caixa da pessoa agora: tela cheia, moldura da direita ou a troca entre as duas
  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  // quanto a pessoa já está na moldura (0 = tela cheia, 1 = moldura)
  const naMoldura = limitar((QUADRO.w - caixa.w) / (QUADRO.w - MOLDURA.w));

  const ativos = plano.momentos.filter((m) => t >= m.de - 0.05 && t <= fimDoMomento(m, plano));
  const doQuadro = ativos.filter((m) => mapa.get(m) === "quadro");
  const doPeito = ativos.filter((m) => mapa.get(m) !== "quadro");

  // O fundo escurece embaixo só enquanto há texto do peito (ou legenda) para ler, e nunca sobre a moldura.
  const presenca = Math.max(
    0,
    ...plano.momentos
      .filter((m) => mapa.get(m) !== "quadro")
      .map((m) => Math.min(prog(t, m.de, 0.4), 1 - saindo(t, fimDoMomento(m, plano), 0.3))),
    ...frases.map((f) => Math.min(prog(t, f.de - 0.1, 0.3), 1 - saindo(t, f.ate + 0.2, 0.3)) * 0.8),
  );
  const peitoAtivo = doPeito.length ? lugarDoPeito(plano, !!doPeito[0].legenda) : null;
  const peito: Peito = peitoAtivo ?? lugarDoPeito(plano, false) ?? { x: 0, y: plano.zona?.topo ?? zonaPadrao.topo, w: QUADRO.w, h: 300, lado: "baixo" };

  const desenhar = (m: Momento) => {
    const r = regiaoDo(m, plano, mapa);
    return (
      <div
        key={`${m.tipo}-${m.de}`}
        style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      >
        {fontes ? renderMomento(m, plano, r.w, r.h) : null}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.tinta }}>
      {/* o quadro da esquerda: fica por baixo da pessoa (na troca, o vídeo encolhe e revela o bloco) */}
      {doQuadro.map(desenhar)}

      {/* a moldura: sombra e filete de latão, como o papel do cartão-documento */}
      {naMoldura > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x,
            top: caixa.y,
            width: caixa.w,
            height: caixa.h,
            boxShadow: "0 28px 70px rgba(8,12,20,0.5)",
            opacity: naMoldura,
          }}
        />
      ) : null}

      {/* do motor: a pessoa na caixa, seguindo o rosto quando ela se mexe */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.04) saturate(0.93)" />

      {naMoldura > 0.001 ? (
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: 6, background: cor.latao, opacity: naMoldura }} />
      ) : null}

      {/* o degradê escuro acompanha a faixa do peito: firme no topo do texto, para o marfim ler bem
          até sobre roupa clara; some quando a pessoa está na moldura */}
      <AbsoluteFill style={{ background: degrade(peito, height), opacity: (0.25 + 0.75 * presenca) * (1 - naMoldura) }} />

      {doPeito.map(desenhar)}

      <Legendas frases={frases} y={LEGENDA_Y} />

      {guias ? <Guias plano={plano} mapa={mapa} legendaY={LEGENDA_Y} /> : null}

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
