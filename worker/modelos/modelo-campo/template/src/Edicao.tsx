// O modelo Campo: o caderno de campo. Em cima, o PAINEL DE CAMPO sobre a palha com curvas de nível
// (talhões vistos de cima, cotação, medidor, previsão e os blocos universais); embaixo, a pessoa
// numa moldura larga. Só cortes secos; a cor da pessoa nunca muda.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Fundo, SombraDaMoldura, Tarja } from "./componentes/Campo";
import { Guias } from "./componentes/Guias";
import { Cotacao, Medidor, Previsao } from "./componentes/Instrumentos";
import { Legenda } from "./componentes/Legenda";
import { Talhao } from "./componentes/Talhao";
import { ordenar, prepararLayout } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: um "toc" de madeira quando os talhões se contornam e na
// chave da previsão, uma nota de kalimba por item, duas notas subindo quando um número bate ou a
// chamada entra, uma gota no nível do medidor, um pouso grave quando o talhão acende.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number | undefined, nome: string, volume: number) => {
    if (typeof em === "number") lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  };
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "talhao":
        s(m.contornoEm ?? m.em ?? m.de, "marca", 0.16);
        (m.marcar ?? []).forEach((k) => s(k.em, "pouso", 0.2));
        break;
      case "cotacao":
        s(m.valor !== undefined ? (m.valorEm ?? m.em) : m.sobeEm, "sobe", 0.2);
        break;
      case "medidor":
        s(m.fracaoEm, "gota", 0.24);
        break;
      case "previsao":
        s(m.chegaEm, "pouso", 0.18);
        s(m.quandoEm, "marca", 0.14);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => s(it.em, `nota-${(i % 4) + 1}`, 0.14));
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o, i) => s(o.em, `nota-${(i % 4) + 1}`, 0.14));
        break;
      case "comparacao":
        m.lados.forEach((l, i) => s(l.em, `nota-${i + 1}`, 0.14));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "sobe", 0.2);
        break;
      case "grafico":
        if (m.dados?.length) m.dados.slice(0, 4).forEach((d, i) => s(d.em, `nota-${(i % 4) + 1}`, 0.12));
        else s(m.tendenciaEm ?? m.de, "nota-1", 0.12);
        break;
      case "numero":
        s(m.em + 0.9, "sobe", 0.18);
        break;
      case "destaque":
      case "definicao":
        s(m.em, "pouso", 0.2);
        break;
      case "abertura":
      case "frase":
        s(m.em ?? m.de, "marca", 0.14);
        break;
      case "cta":
        s(m.material?.em, "pouso", 0.16);
        s(m.em ?? m.de, "sobe", 0.18);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
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
  // a tarja fica nos primeiros ~2,6 s (no terço de baixo da moldura, onde a legenda ficaria)
  const fimTarja = Math.min(2.6, plano.duracao - 0.5);

  // cada momento sai quando o próximo entra (o último fica até o fim do vídeo)
  const fimDe = (m: Momento, i: number) => {
    const prox = ordem[i + 1];
    if (!prox) return m.ate >= plano.duracao - 0.4 || m.tipo === "cta" ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };

  const desenhar = (m: Momento, i: number) => {
    const fim = fimDe(m, i);
    if (t < m.de - 0.1 || t > fim + 0.3) return null;
    const k = `${m.tipo}-${m.de}`;
    const p = { t, plano, fim };
    switch (m.tipo) {
      case "talhao":
        return <Talhao key={k} m={m} {...p} />;
      case "cotacao":
        return <Cotacao key={k} m={m} {...p} />;
      case "medidor":
        return <Medidor key={k} m={m} {...p} />;
      case "previsao":
        return <Previsao key={k} m={m} {...p} />;
      case "abertura":
        return <Abertura key={k} m={m} {...p} />;
      case "topicos":
      case "passos":
        return <Lista key={k} m={m} {...p} />;
      case "numero":
        return <Numero key={k} m={m} {...p} />;
      case "comparacao":
        return <Comparacao key={k} m={m} {...p} />;
      case "grafico":
        return <Grafico key={k} m={m} {...p} />;
      case "destaque":
        return <Destaque key={k} m={m} {...p} />;
      case "definicao":
        return <Definicao key={k} m={m} {...p} />;
      case "frase":
        return <Frase key={k} m={m} {...p} />;
      case "pergunta":
        return <Pergunta key={k} m={m} {...p} />;
      case "cta":
        return <Cta key={k} m={m} {...p} />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.palha }}>
      <Fundo t={t} />
      <SombraDaMoldura />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Tarja t={t} plano={plano} de={0.25} ate={fimTarja} y={lay.yTarja} />
      {ordem.map((m, i) => desenhar(m, i))}
      {t > fimTarja + 0.3 || !plano.marca?.nome?.trim() ? <Legenda t={t} frases={frases} bloqueios={bloqueios} y={lay.yLegenda} /> : null}
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
