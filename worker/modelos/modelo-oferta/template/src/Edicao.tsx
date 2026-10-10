// O modelo Oferta: a página de uma oferta premium que se monta na fala. Em cima, a PÁGINA
// (pilha de entregas, valor âncora, risco, preço que despenca e bate, selo, prazo, botão);
// embaixo, a pessoa numa moldura larga. Só cortes secos; a cor da pessoa nunca muda.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Abertura, Comparacao, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Botao } from "./componentes/Botao";
import { Cenario, SombraDaMoldura, Tarja } from "./componentes/Estudio";
import { Garantia } from "./componentes/Garantia";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { type Doca, Oferta, tempos as temposDaOferta } from "./componentes/Oferta";
import { Prazo } from "./componentes/Prazo";
import { temposDoTexto } from "./anim";
import { ordenar, prepararLayout } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: um "toc" de papel grosso quando a entrega pousa (e quando
// a âncora bate), um deslize curto no risco, um acorde macio quando o preço bate, um "tum" grave no carimbo, um
// "tique" leve nos dias do prazo e um clique macio no toque do botão. Nada de sino nem de moedas.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume: number) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "oferta": {
        m.itens.forEach((it) => s(it.em + 0.18, "pousa", 0.32));
        const tt = temposDaOferta(m);
        if (m.ancora) s(m.ancora.em, "pousa", 0.26);
        if (tt.riscoEm !== undefined) s(tt.riscoEm, "risco", 0.2);
        if (m.preco) s(m.preco.em + 0.06, "bate", 0.3);
        break;
      }
      case "garantia":
        s(m.em + 0.14, "carimbo", 0.36);
        break;
      case "prazo":
        if (m.dia && m.diaEm !== undefined) s(m.diaEm, "tique", 0.24);
        break;
      case "cta": {
        s(m.em ?? m.de, "entra", 0.2);
        const tt = temposDoTexto(m.texto, m.em ?? m.de, plano.palavras, m.ate);
        s(m.toqueEm ?? Math.max((m.em ?? m.de) + 0.25, tt[tt.length - 1] ?? m.de), "toque", 0.3);
        break;
      }
      case "abertura":
        s(Math.max(0, (m.em ?? m.de) - 0.05), "entra", 0.18);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em + 0.18, "pousa", 0.28));
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "pousa", 0.24));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em, "pousa", 0.26));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "risco", 0.2);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "pousa", 0.2));
        break;
      case "numero":
        s(m.em, "sobe", 0.18);
        break;
      case "destaque":
      case "definicao":
        s(m.em, "entra", 0.22);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.1);
};

// A doca: garantia, prazo e cta que vêm logo depois de uma oferta (≤ 0,3 s entre eles) continuam a
// mesma página. O preço sobe para o alto; cada um fica na tela até o fim da cadeia.
type Cadeia = { doca: Doca; membros: Momento[] };
const cadeias = (plano: Plano, fimDe: (m: Momento) => number) => {
  const ordem = ordenar(plano);
  const daOferta = new Map<Momento, Cadeia>();
  const doMembro = new Map<Momento, Cadeia>();
  ordem.forEach((m, i) => {
    if (m.tipo !== "oferta" || !(m.ancora || m.preco)) return;
    const membros: Momento[] = [];
    let ant: Momento = m;
    for (let k = i + 1; k < ordem.length; k++) {
      const x = ordem[k];
      if (!["garantia", "prazo", "cta"].includes(x.tipo) || x.de - Math.min(ant.ate, fimDe(ant)) > 0.3) break;
      membros.push(x);
      ant = x;
    }
    if (!membros.length) return;
    const c: Cadeia = { doca: { de: membros[0].de, fim: fimDe(membros[membros.length - 1]) }, membros };
    daOferta.set(m, c);
    membros.forEach((x) => doMembro.set(x, c));
  });
  return { daOferta, doMembro };
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

  // cada momento sai quando o próximo entra (o último fica até o fim do vídeo)
  const fimDe = (m: Momento) => {
    const i = ordem.indexOf(m);
    const prox = ordem[i + 1];
    if (!prox) return m.ate >= plano.duracao - 0.4 || m.tipo === "cta" ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };
  const { daOferta, doMembro } = useMemo(() => cadeias(plano, fimDe), [plano]); // eslint-disable-line react-hooks/exhaustive-deps
  // a tarja de nome: nos primeiros segundos (sai antes de o primeiro cartão pousar perto dela)
  const segundo = ordem.find((m) => m.tipo !== "abertura" && m.de > 1.5);
  const fimTarja = Math.min(3.2, plano.duracao, segundo ? segundo.de + 0.05 : Infinity);

  const desenhar = (m: Momento) => {
    const fim = fimDe(m);
    const cadeia = doMembro.get(m) ?? null;
    const fimVisivel = cadeia ? cadeia.doca.fim : (daOferta.get(m)?.doca.fim ?? fim);
    if (t < m.de - 0.15 || t > fimVisivel + 0.3) return null;
    const k = `${m.tipo}-${m.de}`;
    const p = { t, plano, fim };
    switch (m.tipo) {
      case "oferta":
        return <Oferta key={k} t={t} plano={plano} m={m} fim={fim} doca={daOferta.get(m)?.doca ?? null} />;
      case "garantia": {
        const idx = cadeia ? cadeia.membros.indexOf(m) : -1;
        const prox = cadeia && idx >= 0 && idx < cadeia.membros.length - 1 ? cadeia.membros[idx + 1].de : null;
        return <Garantia key={k} t={t} m={m} fim={fim} doca={cadeia?.doca ?? null} proximoDe={prox} />;
      }
      case "prazo": {
        const comBotao = !!cadeia && cadeia.membros.slice(cadeia.membros.indexOf(m) + 1).some((x) => x.tipo === "cta");
        return <Prazo key={k} t={t} plano={plano} m={m} fim={fim} doca={cadeia?.doca ?? null} comBotao={comBotao} />;
      }
      case "cta": {
        const comPrazo = !!cadeia && cadeia.membros.slice(0, cadeia.membros.indexOf(m)).some((x) => x.tipo === "prazo");
        return <Botao key={k} t={t} plano={plano} m={m} fim={fim} doca={cadeia?.doca ?? null} comPrazo={comPrazo} />;
      }
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
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.pagina }}>
      <Cenario t={t} />
      <SombraDaMoldura />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Tarja t={t} plano={plano} de={0.2} ate={fimTarja} />
      {/* a oferta fica por baixo: selo, prazo e botão se montam por cima da página dela */}
      {ordem.map((m) => (m.tipo === "oferta" ? desenhar(m) : null))}
      {ordem.map((m) => (m.tipo === "oferta" || m.tipo === "garantia" ? null : desenhar(m)))}
      {/* o selo por cima de tudo: quando voa para o cartão do preço, passa por cima do prazo */}
      {ordem.map((m) => (m.tipo === "garantia" ? desenhar(m) : null))}
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
