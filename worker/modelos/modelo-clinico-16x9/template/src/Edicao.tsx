import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, saindo, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { Anatomia } from "./componentes/Anatomia";
import { Checklist } from "./componentes/Checklist";
import { Comparacao } from "./componentes/Comparacao";
import { Contagem } from "./componentes/Contagem";
import { Cronometro } from "./componentes/Cronometro";
import { Cta } from "./componentes/Cta";
import { Definicao } from "./componentes/Definicao";
import { Destaque } from "./componentes/Destaque";
import { Frase } from "./componentes/Frase";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { AroDaLente, CampoDaLente } from "./componentes/Lente";
import { Lista } from "./componentes/Lista";
import { Nevoa } from "./componentes/Nevoa";
import { Numero } from "./componentes/Numero";
import { Pergunta } from "./componentes/Pergunta";
import { Titulo } from "./componentes/Titulo";
import { type Areas, areasDoLayout, caixaDoLayout, estadosDaCaixa, faixaCheia, layoutDe, VIAGEM } from "./layout";
import { caixaNoTempo, CHEIO_16x9, type EstadoDaCaixa, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Layout, Momento, Plano } from "./plano";
import { cor, LEGENDA_Y, QUADRO, zona as zonaPadrao } from "./tema";

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

const semALegenda = (a: Areas): Areas => {
  const f = { ...a.corpo, h: Math.max(160, LEGENDA_Y - 20 - a.corpo.y) };
  return { cabecalho: f, corpo: f, quadro: f };
};

const colado = (a?: Momento, b?: Momento) => !!a && !!b && b.de - a.ate < 0.3;

// A viagem da lupa (mudança de lugar ou de tamanho) que acontece perto de um instante
const trocaPerto = (estados: EstadoDaCaixa[], t: number, depoisDe = -1) =>
  estados.find((e) => (e.dur ?? 0) > 0.15 && e.de > depoisDe && Math.abs(e.de - t) < 0.26);

type Visivel = { m: Momento; layout: Layout; fim: number };

// Quando o conteúdo de cada momento entra e sai. Regra do modelo: nunca um quadro com a pessoa
// solta no fundo vazio e nunca duas páginas de texto uma sobre a outra.
// - para a lupa (a pessoa encolhe ou viaja): o conteúdo antigo termina de sair quando ela começa
//   a se mover, e o novo começa a entrar logo em seguida, por baixo dela (ela passa por cima);
// - para a tela cheia (a pessoa cresce): o conteúdo antigo fica e é coberto pela pessoa crescendo;
//   o texto novo entra na névoa quando ela chega.
const agenda = (plano: Plano, estados: EstadoDaCaixa[]): Visivel[] => {
  const ms = plano.momentos;
  return ms.map((m, i) => {
    const layout = layoutDe(m);
    const ant = ms[i - 1];
    const prox = ms[i + 1];
    const fim = fimDoMomento(m, plano);
    const antes: Layout = colado(ant, m) ? layoutDe(ant) : m.de > 0.05 ? "cheio" : layout;
    const depois: Layout | null = colado(m, prox) ? layoutDe(prox) : fim > plano.duracao ? null : "cheio";
    const tIni = trocaPerto(estados, m.de)?.de ?? m.de;
    const tFim = trocaPerto(estados, m.ate, m.de + 0.1)?.de ?? m.ate;

    let entrada = m.de;
    if (antes !== layout) entrada = layout === "cheio" ? tIni + VIAGEM * 0.72 : antes === "cheio" ? tIni + 0.06 : tIni + 0.08;
    else if (colado(ant, m)) entrada = m.de + 0.12;

    let saida = fim + 0.1;
    if (depois !== null && depois !== layout) {
      if (layout !== "cheio" && depois === "cheio") saida = tFim + VIAGEM * 0.9;
      // de uma lupa para outra: o conteúdo antigo ainda está saindo quando ela começa a viajar
      else if (layout !== "cheio") saida = tFim + 0.03;
      else saida = tFim + 0.03;
    } else if (colado(m, prox)) saida = m.ate + 0.04;

    return { m: entrada > m.de ? ({ ...m, de: entrada } as Momento) : m, layout, fim: saida };
  });
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: a lupa que chega (nota grave, uma altura por lugar), o ✗ (duas notas descendo),
// os ✓ (duas notas subindo, cada vez mais alto) e o acorde do fechamento.
const TOM_DA_LUPA: Record<Exclude<Layout, "cheio">, string> = {
  topo: "sfx/lupa-1.wav",
  centro: "sfx/lupa-2.wav",
  canto: "sfx/lupa-3.wav",
  lado: "sfx/lupa-4.wav",
};

const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  let certos = 0;
  const certo = (em: number, volume = 0.42) => lista.push({ em, arquivo: `sfx/certo-${(certos++ % 3) + 1}.wav`, volume });
  const erro = (em: number, volume = 0.4) => lista.push({ em, arquivo: "sfx/erro.wav", volume });
  for (const e of estadosDaCaixa(plano)) {
    const m = plano.momentos.find((x) => Math.abs(x.de - e.de) < 0.25);
    const layout = m ? layoutDe(m) : "cheio";
    if (layout !== "cheio" && e.de > 0.05) lista.push({ em: e.de + 0.05, arquivo: TOM_DA_LUPA[layout], volume: 0.34 });
  }
  for (const m of plano.momentos) {
    switch (m.tipo) {
      case "contagem":
        if (m.marca) (m.marca.tipo === "errado" ? erro : certo)(m.marca.em + 0.1, 0.36);
        break;
      case "cronometro":
        if (m.para) erro(m.para.em + 0.15, 0.42);
        else certo(m.inicio + (m.volta ?? 1.4));
        break;
      case "anatomia":
        if (m.veredito) (m.veredito.tipo === "errado" ? erro : certo)(m.veredito.em);
        break;
      case "checklist":
        m.itens.forEach((i) => ((i.tipo ?? "certo") === "certo" ? certo(i.em + 0.35) : erro(i.em + 0.35)));
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((i) => (i.marca === "errado" ? erro(i.em + 0.3, 0.34) : i.marca === "certo" ? certo(i.em + 0.3, 0.36) : null));
        if (m.tipo === "passos" && !m.itens.some((i) => i.marca)) certo(m.itens[m.itens.length - 1].em + 0.3, 0.32);
        break;
      case "numero":
        certo(m.em + 1.1, 0.34);
        break;
      case "comparacao": {
        const [a, b] = m.lados;
        if (m.vencedor !== undefined) certo((m.vencedorEm ?? Math.max(a.em, b.em) + 0.4) + 0.05, 0.38);
        else if (m.modo === "errado-certo") {
          erro(a.em + 0.3, 0.34);
          certo(b.em + 0.3, 0.36);
        }
        break;
      }
      case "destaque":
        (m.nivel === "alerta" ? erro : certo)(m.em + 0.1, 0.36);
        break;
      case "frase":
        if (m.risco && m.riscoEm !== undefined) erro(m.riscoEm + 0.1, 0.34);
        break;
      case "cta":
        lista.push({ em: (m.botoes?.[0]?.em ?? m.em ?? m.de + 0.4) + 0.05, arquivo: "sfx/fecha.wav", volume: 0.36 });
        break;
      default:
        break;
    }
  }
  // nunca dois sons colados
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const todos = useMemo(() => agenda(plano, estados), [plano, estados]);
  // no quadro deitado, o que o estado não diz vale o quadro cheio 16:9
  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  // a faixa de névoa da tela cheia (na base do quadro, abaixo do queixo)
  const faixa = useMemo(() => faixaCheia(plano), [plano]);

  const visiveis = todos.filter((v) => t >= v.m.de - 0.05 && t <= v.fim);

  // névoa branca: presença dos trechos em tela cheia com texto (momentos colados viram um trecho só)
  const trechosDeNevoa = useMemo(() => {
    const lista: { de: number; ate: number }[] = [];
    for (const v of todos.filter((x) => x.layout === "cheio")) {
      const ultimo = lista[lista.length - 1];
      if (ultimo && v.m.de - ultimo.ate < 0.45) ultimo.ate = v.fim;
      else lista.push({ de: v.m.de, ate: v.fim });
    }
    return lista;
  }, [todos]);
  // a névoa sai antes de a pessoa encolher para a lupa (senão embranquece a caixa em movimento)
  const nevoa = Math.max(0, ...trechosDeNevoa.map((n) => Math.min(prog(t, n.de - 0.12, 0.45), 1 - saindo(t, n.ate + 0.03, 0.3))));
  const instrumento = visiveis.some((v) => v.m.tipo === "cronometro" || v.m.tipo === "numero");
  const atual = visiveis[visiveis.length - 1];
  const areasAtuais = atual && atual.layout !== "cheio" ? areasDoLayout(atual.layout, plano) : null;

  const desenhar = ({ m, layout, fim }: Visivel) => {
    const base = areasDoLayout(layout, plano);
    // em tela cheia com `legenda: true`, a faixa do texto termina acima da legenda (no quadro deitado
    // as duas dividem a base do quadro)
    const areas = layout === "cheio" && m.legenda ? semALegenda(base) : base;
    const chave = `${m.tipo}-${m.de}`;
    const p = { t, fim, palavras: plano.palavras };
    switch (m.tipo) {
      case "titulo":
        return <Titulo key={chave} m={m} {...p} area={areas.cabecalho} />;
      case "abertura":
        return <Abertura key={chave} m={m} {...p} area={areas.cabecalho} />;
      case "contagem":
        return <Contagem key={chave} m={m} {...p} areas={areas} />;
      case "topicos":
      case "passos":
        return <Lista key={chave} m={m} {...p} areas={areas} layout={layout} />;
      case "cronometro":
        return <Cronometro key={chave} m={m} {...p} areas={areas} caixa={caixaDoLayout(layout, plano)} />;
      case "numero":
        return <Numero key={chave} m={m} {...p} areas={areas} caixa={caixaDoLayout(layout, plano)} />;
      case "anatomia":
        return <Anatomia key={chave} m={m} {...p} areas={areas} layout={layout} />;
      case "checklist":
        return <Checklist key={chave} m={m} {...p} areas={areas} layout={layout} />;
      case "comparacao":
        return <Comparacao key={chave} m={m} {...p} areas={areas} />;
      case "grafico":
        return <Grafico key={chave} m={m} {...p} areas={areas} layout={layout} />;
      case "definicao":
        return <Definicao key={chave} m={m} {...p} areas={areas} />;
      case "destaque":
        return <Destaque key={chave} m={m} {...p} area={areas.corpo} />;
      case "frase":
        return <Frase key={chave} m={m} {...p} area={areas.corpo} />;
      case "pergunta":
        return <Pergunta key={chave} m={m} {...p} area={areas.corpo} />;
      case "cta":
        return <Cta key={chave} m={m} {...p} area={areas.cabecalho} marca={plano.marca} />;
    }
    return null;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
      <CampoDaLente caixa={caixa} tempo={t} graduacao={instrumento ? 0 : 1} />

      {/* conteúdo da lupa fica por baixo da pessoa: quando ela cresce ou viaja, passa por cima */}
      {visiveis.filter((v) => v.layout !== "cheio").map(desenhar)}

      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.97) brightness(1.01)"
      />
      <AroDaLente caixa={caixa} />

      <Nevoa p={nevoa} topo={faixa.y} />

      {/* conteúdo em tela cheia fica por cima, na névoa */}
      {visiveis.filter((v) => v.layout === "cheio").map(desenhar)}

      <Legendas frases={frases} />

      {guias ? <Guias plano={plano} zona={{ ...zona, topo: faixa.y, altura: faixa.h }} caixa={caixa} areas={areasAtuais} /> : null}

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
