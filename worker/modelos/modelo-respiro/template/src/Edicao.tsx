import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { ar, limitar, prog, useTempo } from "./anim";
import { Contagem, Forma } from "./componentes/Forma";
import { Guias } from "./componentes/Guias";
import { Janela, janelaQueRespira, MolduraDaJanela } from "./componentes/Janela";
import { Legendas } from "./componentes/Legendas";
import { Mapa } from "./componentes/Mapa";
import { Comparacao, Definicao, Destaque, Frase, Grafico, NotaDoNumero, NumeroNaForma, Passos, Pergunta, Topicos } from "./componentes/Blocos";
import { Abertura, Cta, EsbocoDaOnda, FormasDosCiclos, Nota, NotasDaFase, NotasDosCiclos } from "./componentes/Momentos";
import { AREAS, cenaDoLayout, cenaNoTempo, layoutDe, prepararPlano, trechosDeLayout } from "./layout";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { arNoTempo, contaEmDe, divideEmDe, ehCiclos, ehFase, faseDe, mapaNoTempo, visibilidadeDoMapa } from "./respiro";
import { cor, LEGENDA_Y } from "./tema";

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.6)) return plano.duracao + 1;
  return m.ate;
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: um por fase (sobe na inspiração, fica na pausa, desce na expiração),
// um quando o mapa se completa, um quando a forma se divide e um acorde no fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "abertura" && m.mapaEm?.length) lista.push({ em: m.mapaEm[m.mapaEm.length - 1] + 0.1, arquivo: "sfx/mapa.wav", volume: 0.3 });
    if (m.tipo === "fase") lista.push({ em: contaEmDe(m) - 0.05, arquivo: `sfx/${faseDe(m)}.wav`, volume: 0.36 });
    if (m.tipo === "ciclos") lista.push({ em: divideEmDe(m), arquivo: "sfx/ciclos.wav", volume: 0.32 });
    // os blocos universais usam os mesmos sons tonais: sobe quando enche, desce quando esvazia
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/inspira.wav", volume: 0.3 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/solta.wav" : "sfx/segura.wav", volume: 0.3 });
    if (m.tipo === "comparacao" && m.vencedor !== undefined) lista.push({ em: m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 1.1, arquivo: "sfx/inspira.wav", volume: 0.28 });
    if (m.tipo === "cta") lista.push({ em: (m.iconeEm ?? m.de + 0.4) + 0.02, arquivo: "sfx/fecho.wav", volume: 0.32 });
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.6) saida.push(s);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => prepararPlano(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const trechos = useMemo(() => trechosDeLayout(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const cena = cenaNoTempo(t, trechos, plano);
  const arAgora = arNoTempo(t, plano);
  const fim = (m: Momento) => fimDoMomento(m, plano);

  // quando o lugar do momento fica livre: se a janela da pessoa estava (ou passa) por cima da área
  // do texto, o conteúdo espera ela sair; se não, entra logo
  const livreEm = (m: Momento) => {
    const troca = trechos.find((x) => Math.abs(x.de - Math.max(0.08, m.de)) < 0.06 && x.nome === layoutDe(m));
    if (!troca) return m.de + 0.05;
    const area = AREAS[layoutDe(m)];
    const cruza = [troca.de, troca.de + troca.dur * 0.5].some((instante) => {
      const j = cenaNoTempo(instante, trechos, plano).janela;
      return j.x < area.x + area.w - 20 && j.x + j.w > area.x + 20 && j.y < area.y + area.h - 20 && j.y + j.h > area.y + 20;
    });
    return cruza ? troca.de + troca.dur * 0.7 : m.de + 0.05;
  };

  // ---- quem sai espera quem entra: nenhum quadro de papel vazio numa troca ----
  const ordenados = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);
  const proximoColado = (m: Momento) => {
    const p = ordenados[ordenados.indexOf(m) + 1];
    return p && p.de - m.ate < 0.3 ? p : undefined;
  };
  const trocaDe = (m: Momento) => trechos.find((x) => Math.abs(x.de - Math.max(0.08, m.de)) < 0.06 && x.nome === layoutDe(m));
  // a janela, ao mudar de lugar, passa por cima da área deste momento?
  const janelaCruza = (troca: { de: number; dur: number }, area: { x: number; y: number; w: number; h: number }) =>
    [0.1, 0.25, 0.4, 0.55, 0.7, 0.85].some((f) => {
      const j = cenaNoTempo(troca.de + troca.dur * f, trechos, plano).janela;
      return j.x < area.x + area.w - 40 && j.x + j.w > area.x + 40 && j.y < area.y + area.h - 40 && j.y + j.h > area.y + 40;
    });
  // onde está o texto do momento: nas colunas das fases, só a parte de cima (o mapa é à parte)
  const areaDoTexto = (m: Momento) => {
    const a = AREAS[layoutDe(m)];
    return m.tipo === "fase" || m.tipo === "ciclos" ? { ...a, h: a.h * 0.45 } : a;
  };
  // quando o primeiro elemento do momento aparece
  const entradaDe = (m: Momento) => {
    if (m.tipo === "cta") return livreEm(m) + 0.1;
    const primeira = plano.palavras.find((p) => p.em >= m.de - 0.05)?.em ?? m.de;
    return Math.max(livreEm(m), primeira);
  };
  // o texto de um momento fica até o do seguinte começar a aparecer (cruzando com ele), a não ser
  // que a janela da pessoa vá passar por cima dele na troca: aí ele sai antes
  const fimVisual = (m: Momento) => {
    const base = fim(m) + 0.15;
    const p = proximoColado(m);
    if (!p) return base;
    const troca = trocaDe(p);
    if (troca && janelaCruza(troca, areaDoTexto(m))) return base;
    return Math.max(base, entradaDe(p) + 0.05);
  };

  // quando a forma chega ao lugar do momento: o anel da contagem só aparece com ela parada
  const formaChegaEm = (m: Momento) => {
    const troca = trechos.find((x) => Math.abs(x.de - Math.max(0.08, m.de)) < 0.06 && x.nome === layoutDe(m));
    if (!troca) return m.de + 0.05;
    const a = cenaNoTempo(troca.de, trechos, plano).orbe;
    const b = cenaNoTempo(troca.de + troca.dur, trechos, plano).orbe;
    return Math.hypot(a.cx - b.cx, a.cy - b.cy) + Math.abs(a.rMax - b.rMax) > 60 ? troca.de + troca.dur - 0.4 : m.de + 0.05;
  };

  // o anel da contagem fica até o anel seguinte aparecer (ou até a forma se dividir): ele viaja com a forma
  const fimDaContagem = (m: Momento) => {
    const p = proximoColado(m);
    if (p && ehFase(p)) return Math.max(fim(m) + 0.15, formaChegaEm(p) + 0.35);
    if (p && ehCiclos(p)) return Math.max(fim(m) + 0.15, divideEmDe(p));
    return fimVisual(m);
  };
  const alvoDesde = (m: Momento) => {
    const anteriorColado = ordenados[ordenados.indexOf(m) - 1];
    return anteriorColado && ehFase(anteriorColado) && proximoColado(anteriorColado) === m
      ? fimDaContagem(anteriorColado) - 0.1
      : formaChegaEm(m);
  };
  const contagens = plano.momentos.filter(ehFase).filter((m) => t >= m.de - 0.05 && t <= fimDaContagem(m) + 0.05);

  const visiveis = plano.momentos.filter((m) => t >= m.de - 0.05 && t <= fimVisual(m) + 0.05);
  const atual = [...visiveis].reverse().find((m) => t >= m.de) ?? null;

  // a forma some quando se divide nas repetições e volta quando elas se juntam
  const ciclos = plano.momentos.find(ehCiclos);
  const opacidadeForma = ciclos ? Math.min(1, 1 - prog(t, divideEmDe(ciclos) - 0.05, 0.35) + prog(t, ciclos.ate - 0.1, 0.3)) : 1;
  // segurando o ar: a borda da forma fica mais viva
  const segurando = Math.max(
    0,
    ...plano.momentos
      .filter(ehFase)
      .filter((f) => faseDe(f) === "segura")
      .map((f) => Math.min(prog(t, contaEmDe(f) - 0.2, 0.6, ar), 1 - prog(t, f.ate - 0.2, 0.6, ar))),
  );

  const mapa = mapaNoTempo(t, plano);
  // o mapa que reaparece (no fechamento) já nasce no lugar novo; o que viaja longe some no meio do
  // caminho e reaparece no destino (não passa por cima do texto que ainda está saindo)
  const trechoAtual = [...trechos].reverse().find((x) => x.de <= t) ?? trechos[0];
  const destinoDoMapa = cenaDoLayout(trechoAtual.nome, plano).mapa;
  const mapaRet = visibilidadeDoMapa(trechoAtual.de, plano, fim) < 0.05 ? destinoDoMapa : cena.mapa;
  const origemDoMapa = cenaNoTempo(trechoAtual.de, trechos, plano).mapa;
  const viagemDoMapa = Math.hypot(destinoDoMapa.x - origemDoMapa.x, destinoDoMapa.y - origemDoMapa.y);
  // viagem longa: o mapa não atravessa a tela; some devagar onde estava e aparece no lugar novo
  const brutoDaTroca = limitar((t - trechoAtual.de) / Math.max(0.01, trechoAtual.dur));
  const mapaCruzado = mapaRet === cena.mapa && viagemDoMapa > 250 && brutoDaTroca < 1;
  const mapaVisivel = visibilidadeDoMapa(t, plano, fim);

  // a legenda aparece fora dos momentos (e nos que pedem `legenda: true`)
  const anterior = [...plano.momentos].reverse().find((m) => fim(m) <= t);
  const legendaVisivel = !atual
    ? prog(t, (anterior?.ate ?? 0) + 0.45, 0.4)
    : atual.legenda
      ? prog(t, atual.de + 0.4, 0.4)
      : 0;

  const janela = janelaQueRespira(cena.janela, arAgora, 1);

  const desenhar = (m: Momento) => {
    const base = AREAS[layoutDe(m)];
    // com a legenda junto, o conteúdo sobe e deixa a base do papel para ela
    const area = m.legenda ? { ...base, h: Math.min(base.h, LEGENDA_Y - 16 - base.y) } : base;
    const props = { t, fim: fimVisual(m), area, palavras: plano.palavras, livreEm: livreEm(m) };
    const chave = `${m.tipo}-${m.de}`;
    switch (m.tipo) {
      case "abertura":
        return <Abertura key={chave} m={m} {...props} />;
      case "fase":
        return <NotasDaFase key={chave} m={m} {...props} />;
      case "ciclos":
        return <NotasDosCiclos key={chave} m={m} {...props} />;
      case "nota":
        return <Nota key={chave} m={m} {...props} />;
      case "lista":
      case "topicos":
        return <Topicos key={chave} m={m} {...props} />;
      case "passos":
        return <Passos key={chave} m={m} {...props} />;
      case "numero":
        return <NotaDoNumero key={chave} m={m} {...props} />;
      case "comparacao":
        return <Comparacao key={chave} m={m} {...props} />;
      case "grafico":
        return <Grafico key={chave} m={m} {...props} />;
      case "destaque":
        return <Destaque key={chave} m={m} {...props} />;
      case "definicao":
        return <Definicao key={chave} m={m} {...props} />;
      case "frase":
        return <Frase key={chave} m={m} {...props} />;
      case "pergunta":
        return <Pergunta key={chave} m={m} {...props} />;
      case "cta":
        return <Cta key={chave} m={m} {...props} marca={plano.marca} />;
    }
    return null;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      {/* o respiro fica por trás da pessoa: se os dois se cruzam numa troca, a forma passa por trás */}
      <Forma orbe={cena.orbe} ar={arAgora} t={t} aperto={cena.aperto} segurando={segurando} opacidade={opacidadeForma} />
      {ciclos ? <FormasDosCiclos m={ciclos} t={t} orbe={cena.orbe} id="c" /> : null}
      {contagens.map((m) => (
        <Contagem key={`contagem-${m.de}`} m={m} orbe={cena.orbe} t={t} desde={formaChegaEm(m)} fim={fimDaContagem(m)} alvoDesde={alvoDesde(m)} />
      ))}

      {/* o mapa também passa por trás da pessoa quando muda de lugar */}
      {mapaCruzado ? (
        <>
          <Mapa
            ret={origemDoMapa}
            etapas={mapa.etapas}
            faixas={mapa.faixas}
            tinta={mapa.tinta}
            ponto={mapa.ponto}
            ativa={mapa.ativa}
            opacidade={mapaVisivel * (1 - prog(brutoDaTroca, 0.4, 0.35))}
            opacidadePonto={mapa.opacidadePonto}
          />
          <Mapa
            ret={destinoDoMapa}
            etapas={mapa.etapas}
            faixas={mapa.faixas}
            tinta={mapa.tinta}
            ponto={mapa.ponto}
            ativa={mapa.ativa}
            opacidade={mapaVisivel * prog(brutoDaTroca, 0.6, 0.3)}
            opacidadePonto={mapa.opacidadePonto}
          />
        </>
      ) : (
        <Mapa
          ret={mapaRet}
          etapas={mapa.etapas}
          faixas={mapa.faixas}
          tinta={mapa.tinta}
          ponto={mapa.ponto}
          ativa={mapa.ativa}
          opacidade={mapaVisivel}
          opacidadePonto={mapa.opacidadePonto}
        />
      )}

      {visiveis.map((m) =>
        m.tipo === "nota" && m.ondaEm !== undefined ? (
          <EsbocoDaOnda key={`esboco-${m.de}`} m={m} t={t} area={AREAS[layoutDe(m)]} fim={fimVisual(m)} />
        ) : null,
      )}

      {/* o número conta dentro da forma */}
      {visiveis.map((m) => (m.tipo === "numero" ? <NumeroNaForma key={`num-${m.de}`} m={m} orbe={cena.orbe} t={t} fim={fimVisual(m)} /> : null))}

      <MolduraDaJanela janela={janela} t={t} />
      <Janela janela={janela} plano={plano} />

      {visiveis.map(desenhar)}

      <Legendas frases={frases} visivel={legendaVisivel} />

      {guias ? <Guias plano={plano} cena={cena} area={atual ? AREAS[layoutDe(atual)] : null} /> : null}

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
