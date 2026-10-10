// O modelo Devocional: uma página de livro de devoção em cima e a pessoa embaixo, numa moldura larga.
// Cada bloco é escrito na página palavra por palavra; a palavra-chave acende; entre os blocos a
// página vira. No versículo a página fica cheia e a pessoa vai para o medalhão de baixo.
// Poeira de luz e uma luz lenta só no fundo gráfico. Só cortes secos; a cor da pessoa nunca muda.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { temposDoTexto } from "./anim";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, iconeDoCta, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Luz } from "./componentes/Luz";
import { Filete, SombraDaMoldura, Tarja } from "./componentes/Moldura";
import { Ar, Folha, Virando } from "./componentes/Pagina";
import { Versiculo } from "./componentes/Versiculo";
import { type Area, ordenar, prepararLayout } from "./layout";
import { trechoNoTexto } from "./medida";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, VIRADA } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: um sopro tonal quando a página vira, uma nota macia quando
// uma palavra acende, um toque curto nos itens e na referência, duas notas no envio.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number | undefined, nome: string, volume: number) => {
    if (typeof em === "number" && em >= 0) lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  };
  const tempoDe = (texto: string, em: number, ate: number, trecho?: string) => {
    const tr = trechoNoTexto(texto, trecho);
    return tr ? temposDoTexto(texto, em, plano.palavras, ate)[tr[0]] : undefined;
  };
  ordenar(plano).forEach((m, i) => {
    if (i > 0 || m.de > 0.3) s(m.de, "folha", 0.1);
    if ("desenho" in m && m.desenho) s(m.desenhoEm ?? ("em" in m ? m.em : undefined) ?? m.de, "traco", 0.1);
    switch (m.tipo) {
      case "versiculo":
        s(m.destaqueEm ?? tempoDe(m.texto, m.em ?? m.de, m.ate, m.destaque), "luz", 0.16);
        s(m.referenciaPartes?.[0]?.em ?? m.referenciaEm, "palavra", 0.12);
        break;
      case "luz":
        s(m.palavraEm, "luz", 0.18);
        break;
      case "abertura":
        s(m.destaque ? tempoDe(m.texto, m.em ?? m.de, m.ate, m.destaque) : undefined, "luz", 0.2);
        break;
      case "frase":
        s(m.destaque ? tempoDe(m.texto, m.em ?? m.de, m.ate, m.destaque) : undefined, "luz", 0.18);
        break;
      case "destaque":
        if (m.nivel !== "alerta") s(m.em + 0.15, "luz", 0.2);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em, "palavra", 0.11));
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "palavra", 0.11));
        break;
      case "comparacao":
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.8, "luz", 0.18);
        break;
      case "numero":
        s(m.em + 1.0, "luz", 0.18);
        break;
      case "definicao":
        s(m.em, "palavra", 0.12);
        break;
      case "cta":
        s((m.em ?? m.de) + 0.1, iconeDoCta(m) === "carta" ? "envio" : "palavra", 0.13);
        break;
    }
  });
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.25);
};

const Bloco: React.FC<{ m: Momento; t: number; plano: Plano; area: Area }> = ({ m, t, plano, area }) => {
  const p = { t, plano, area };
  switch (m.tipo) {
    case "versiculo":
      return <Versiculo m={m} {...p} />;
    case "luz":
      return <Luz m={m} {...p} />;
    case "abertura":
      return <Abertura m={m} {...p} />;
    case "topicos":
    case "passos":
      return <Lista m={m} {...p} />;
    case "numero":
      return <Numero m={m} {...p} />;
    case "comparacao":
      return <Comparacao m={m} {...p} />;
    case "grafico":
      return <Grafico m={m} {...p} />;
    case "destaque":
      return <Destaque m={m} {...p} />;
    case "definicao":
      return <Definicao m={m} {...p} />;
    case "frase":
      return <Frase m={m} {...p} />;
    case "pergunta":
      return <Pergunta m={m} {...p} />;
    case "cta":
      return <Cta m={m} {...p} />;
    default:
      return null;
  }
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ordem = useMemo(() => ordenar(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(plano).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const caixa = lay.caixa(t);

  // o bloco da página agora (fica até o próximo entrar) e o que está virando
  let i = -1;
  ordem.forEach((m, k) => {
    if (m.de <= t + 1e-4) i = k;
  });
  const atual = i >= 0 ? ordem[i] : null;
  const anterior = i >= 1 ? ordem[i - 1] : null;
  // a folha vira no `de` de cada bloco (o primeiro, só se não começar no quadro 0)
  const vira = atual && (i >= 1 || atual.de > 0.3) && t < atual.de + VIRADA ? (t - atual.de) / VIRADA : null;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      <Folha t={t}>{atual ? <Bloco m={atual} t={t} plano={plano} area={lay.areaDe(atual)} /> : null}</Folha>
      {vira !== null ? (
        <Virando p={vira}>
          <Folha t={t}>{anterior ? <Bloco m={anterior} t={t} plano={plano} area={lay.areaDe(anterior)} /> : null}</Folha>
        </Virando>
      ) : null}
      <Ar t={t} caixa={caixa} />
      <Filete caixa={caixa} />
      <SombraDaMoldura caixa={caixa} />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Tarja t={t} plano={plano} de={lay.tarja.de} ate={lay.tarja.ate} />
      <Legenda t={t} frases={frases} bloqueios={bloqueios} y={lay.yLegenda} />
      {guias ? <Guias plano={plano} caixa={caixa} t={t} lay={lay} /> : null}
      {plano.sfx === false
        ? null
        : listaDeSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
