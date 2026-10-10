import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { desliza, limitar, prog, saindo, temposDoTexto, useTempo } from "./anim";
import { Comparacao } from "./componentes/Comparacao";
import { ComparacaoLados } from "./componentes/ComparacaoLados";
import { emDoBotao, Fechamento } from "./componentes/Fechamento";
import { BlocoGrafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { ALTURA_LEGENDA, Legendas } from "./componentes/Legendas";
import { BlocoLista } from "./componentes/Listas";
import { Manchete } from "./componentes/Manchete";
import { Mapa } from "./componentes/Mapa";
import { BlocoDefinicao, BlocoDestaque, BlocoFrase, BlocoNumero, BlocoPergunta } from "./componentes/Textos";
import { comoManchete, comoReguaAntiga, ehRegua, geometriaDoFechamento, geometriaDoMapa, itensDoMapa } from "./geometria";
import { ehTexto, estadosDaCaixa, layoutDe, linhaDe, linhaMaximaPara, TROCA, type Layout } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, LEGENDA_Y } from "./tema";

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

// a troca começa no corte mais próximo (o mesmo ajuste da moldura da pessoa, em layout.ts)
const inicioDaTroca = (de: number, plano: Plano) => (plano.cortesEm ?? []).find((c) => c - de > -0.16 && c - de < 0.1) ?? de;

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: a linha do espelho que desliza, um ponto que acende, uma faixa que fecha.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const nota = (i: number) => `sfx/ponto-${(i % 3) + 1}.wav`;
  let layoutAntes: Layout = "cheio";
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordenados.forEach((m, k) => {
    const layout = layoutDe(m);
    // o fio soa quando a linha aparece, desliza ou troca o desenho de lado
    if (layout !== layoutAntes && m.de > 0.2) lista.push({ em: m.de, arquivo: "sfx/fio.wav", volume: 0.42 });
    layoutAntes = layout;
    const prox = ordenados[k + 1];
    if (!prox || prox.de - m.ate > 0.3) layoutAntes = "cheio";
    switch (m.tipo) {
      case "manchete":
      case "abertura": {
        if (m.de < 0.3) lista.push({ em: 0.04, arquivo: "sfx/tom.wav", volume: 0.4 });
        if (m.tipo === "manchete" && m.seloEm !== undefined) lista.push({ em: m.seloEm + 0.35, arquivo: nota(2), volume: 0.34 });
        break;
      }
      case "mapa":
        if (m.efeito) lista.push({ em: m.efeito.em, arquivo: nota(0), volume: 0.28 });
        itensDoMapa(m).forEach((a, i) => lista.push({ em: a.em, arquivo: nota(i), volume: 0.34 }));
        break;
      case "comparacao":
        if (ehRegua(m)) {
          const r = comoReguaAntiga(m);
          [r.esquerda, r.direita].forEach((l, i) => {
            if (l?.faixa) lista.push({ em: l.faixa.emFim ?? l.faixa.em + 0.8, arquivo: nota(i + 1), volume: 0.32 });
          });
        } else (m.lados ?? []).forEach((l, i) => lista.push({ em: l.em, arquivo: nota(i + 1), volume: 0.3 }));
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => lista.push({ em: it.em, arquivo: nota(i), volume: 0.3 }));
        break;
      case "grafico":
        if (m.dados?.length) m.dados.forEach((d, i) => lista.push({ em: d.em + 0.5, arquivo: nota(i), volume: 0.28 }));
        else lista.push({ em: (m.tendenciaEm ?? m.de + 0.3) + 1.6, arquivo: nota(2), volume: 0.3 });
        break;
      case "numero":
        lista.push({ em: m.em + 1.3, arquivo: nota(2), volume: 0.32 });
        break;
      case "destaque":
        lista.push({ em: m.em, arquivo: nota(m.nivel === "alerta" ? 0 : 1), volume: 0.34 });
        break;
      case "definicao":
        lista.push({ em: m.significadoEm, arquivo: nota(1), volume: 0.3 });
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o, i) => lista.push({ em: o.em, arquivo: nota(i), volume: 0.28 }));
        break;
      case "frase":
        if (m.risco && m.riscoEm !== undefined) lista.push({ em: m.riscoEm, arquivo: nota(0), volume: 0.3 });
        break;
      case "cta": {
        const inicio = m.em ?? m.de;
        const linhas = geometriaDoFechamento(m, plano).linhasCta;
        const tempos = temposDoTexto(linhas.join(" "), plano.palavras, inicio, m.ate + 1, inicio + 0.3);
        lista.push({ em: m.iconeEm ?? emDoBotao(m, tempos, linhas), arquivo: "sfx/tom.wav", volume: 0.36 });
        break;
      }
    }
  });
  const ordem = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordem) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// O conteúdo de cada momento na faixa de cima
const Conteudo: React.FC<{ m: Momento; t: number; fim: number; linha: number; plano: Plano }> = ({ m, t, fim, linha, plano }) => {
  const palavras = plano.palavras;
  const maxima = linhaMaximaPara(m, plano);
  switch (m.tipo) {
    case "manchete":
      return <Manchete m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "abertura":
      return <Manchete m={comoManchete(m)} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "mapa":
      return <Mapa m={m} t={t} fim={fim} linha={linha} palavras={palavras} />;
    case "comparacao":
      return ehRegua(m) ? (
        <Comparacao m={comoReguaAntiga(m)} t={t} fim={fim} linha={linha} palavras={palavras} />
      ) : (
        <ComparacaoLados m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />
      );
    case "cta":
      return <Fechamento m={m} t={t} fim={fim} plano={plano} palavras={palavras} />;
    case "frase":
      return <BlocoFrase m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "pergunta":
      return <BlocoPergunta m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "destaque":
      return <BlocoDestaque m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "definicao":
      return <BlocoDefinicao m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "numero":
      return <BlocoNumero m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "topicos":
    case "passos":
      return <BlocoLista m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
    case "grafico":
      return <BlocoGrafico m={m} t={t} fim={fim} linhaMaxima={maxima} palavras={palavras} />;
  }
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const caixa = caixaNoTempo(t, estados);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);

  const ordenados = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);
  const linhas = useMemo(() => ordenados.map((m) => linhaDe(m, plano)), [ordenados, plano]);
  const colados = (i: number, j: number) => !!ordenados[i] && !!ordenados[j] && ordenados[j].de - ordenados[i].ate <= 0.3;
  // dois momentos colados com a linha na mesma altura: a faixa de cima corre de lado, como uma
  // porta de correr (o que sai vai para a esquerda, o que entra vem da direita)
  const mesmaLinha = (i: number, j: number) => Math.abs(linhas[i] - linhas[j]) < 2;

  const visiveis = ordenados
    .map((m, i) => {
      const prox = ordenados[i + 1];
      const portaEntra = colados(i - 1, i) && mesmaLinha(i - 1, i);
      const portaSai = colados(i, i + 1) && mesmaLinha(i, i + 1);
      // a linha muda de altura entre dois momentos colados: uma cortina de fio dourado atravessa
      // a faixa da esquerda para a direita junto com a linha (atrás do fio, a página nova; na
      // frente, a velha; nunca as duas no mesmo lugar)
      const fioEntra = colados(i - 1, i) && !portaEntra;
      const fioSai = colados(i, i + 1) && !portaSai;
      const fimReal = fimDoMomento(m, plano);
      const inicioEntrada = inicioDaTroca(m.de, plano);
      const inicioSaida = prox ? inicioDaTroca(prox.de, plano) : fimReal;
      // sem vizinho colado: o conteúdo fica até a pessoa (que volta à tela cheia) cobri-lo inteiro
      const fim = portaSai || fioSai ? inicioSaida + TROCA : m.tipo === "cta" ? fimReal : fimReal + TROCA + 0.05;
      const dx = (portaEntra ? 1080 * (1 - prog(t, m.de, TROCA, desliza)) : 0) - (portaSai ? 1080 * prog(t, prox.de, TROCA, desliza) : 0);
      const xEntra = fioEntra ? 1080 * prog(t, inicioEntrada, TROCA, desliza) : null;
      const xSai = fioSai ? 1080 * prog(t, inicioSaida, TROCA, desliza) : null;
      // o losango da linha: no eixo do desenho (mapa) ou sobre o rosto (blocos de texto, fechamento)
      const xLosango =
        m.tipo === "mapa"
          ? geometriaDoMapa(m, linhas[i]).eixoX
          : ehTexto(m) || m.tipo === "cta"
            ? Math.min(960, Math.max(120, plano.rosto.x * 1080))
            : null;
      const opLosango =
        (portaEntra ? 1 : fioEntra ? prog(t, inicioEntrada + TROCA * 0.4, 0.3) : prog(t, m.de < 0.3 ? -1 : m.de + 0.1, 0.4)) *
        (portaSai ? 1 : fioSai ? 1 - prog(t, inicioSaida, 0.25) : 1 - saindo(t, Math.min(fim, fimReal + 0.04), 0.3));
      return { m, linha: linhas[i], fim, fimComponente: portaSai || fioSai ? fim + 10 : fim, dx, xEntra, xSai, xLosango, opLosango };
    })
    .filter((v) => t >= v.m.de - 0.05 && t <= v.fim);

  // a linha do espelho é o alto da moldura da pessoa; some quando ela volta para a tela cheia
  const linha = caixa.y;
  const mostrarLinha = limitar((linha - 8) / 60);
  // a legenda fica sobre a linha só dentro de um momento com `legenda: true`; fora dos momentos
  // (tela cheia, e enquanto a pessoa sobe para ela) fica logo acima da interface do app
  const dentroDeMomento = ordenados.some((m) => t >= m.de && t < m.ate);
  const topoLegenda = dentroDeMomento && linha > 200 ? linha - ALTURA_LEGENDA / 2 : LEGENDA_Y;
  // o fio da cortina (na troca com a linha mudando de altura)
  const fios = visiveis.filter((v) => v.xEntra !== null && v.xEntra > 0.5 && v.xEntra < 1079.5).map((v) => v.xEntra as number);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.champanhe }}>
      {/* faixa de cima (fica por baixo da pessoa: a linha que desce revela, a que sobe cobre) */}
      {visiveis.map(({ m, linha: linhaDoMomento, fimComponente: fim, dx, xEntra, xSai }) => {
        const recorte =
          xEntra !== null && xEntra < 1079.5
            ? `inset(0 ${1080 - xEntra}px 0 0)`
            : xSai !== null && xSai > 0.5
              ? `inset(0 0 0 ${xSai}px)`
              : undefined;
        return (
          <AbsoluteFill key={`${m.tipo}-${m.de}`} style={{ translate: dx ? `${dx}px 0` : undefined, clipPath: recorte }}>
            <Conteudo m={m} t={t} fim={fim} linha={linhaDoMomento} plano={plano} />
          </AbsoluteFill>
        );
      })}

      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.94)" />

      {/* moldura estreita (gravação muito fechada): um fio dourado fino nos lados e embaixo, como o
          aro de um espelho, para a janela parecer de propósito */}
      {caixa.w < 1074 && caixa.y > 8 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
          <path
            d={`M ${caixa.x - 1} ${caixa.y} L ${caixa.x - 1} ${Math.min(1921, caixa.y + caixa.h + 1)} L ${caixa.x + caixa.w + 1} ${Math.min(1921, caixa.y + caixa.h + 1)} L ${caixa.x + caixa.w + 1} ${caixa.y}`}
            fill="none"
            stroke={cor.ouro}
            strokeWidth={2.5}
            opacity={limitar((1074 - caixa.w) / 30)}
          />
        </svg>
      ) : null}

      {/* a linha do espelho, o losango que corre nela e o fio da cortina */}
      {mostrarLinha > 0 || fios.length ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
          <line x1={0} x2={1080} y1={linha} y2={linha} stroke={cor.ouro} strokeWidth={2.5} opacity={mostrarLinha} />
          {visiveis.map((v) =>
            v.xLosango !== null && v.opLosango > 0.01 ? (
              <rect
                key={`l-${v.m.de}`}
                x={v.xLosango + v.dx - 9}
                y={linha - 9}
                width={18}
                height={18}
                fill={cor.ouro}
                opacity={mostrarLinha * v.opLosango}
                transform={`rotate(45 ${v.xLosango + v.dx} ${linha})`}
              />
            ) : null,
          )}
          {fios.map((x) => (
            <line key={`fio-${x}`} x1={x} x2={x} y1={120} y2={linha} stroke={cor.ouro} strokeWidth={2.5} opacity={0.15 + 0.85 * Math.sin((Math.PI * x) / 1080)} />
          ))}
        </svg>
      ) : null}

      <Legendas frases={frases} topo={topoLegenda} />

      {guias ? <Guias plano={plano} caixa={caixa} /> : null}

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
