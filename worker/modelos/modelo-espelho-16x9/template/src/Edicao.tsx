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
import { ehTexto, estadosDaCaixa, layoutDe, linhaDe, linhaMaximaPara, paginaNoQuadro, TROCA, xDaLinha, type Layout } from "./layout";
import { caixaNoTempo, CHEIO_16x9, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, LEGENDA_Y, QUADRO } from "./tema";

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

// O conteúdo de cada momento na página (no deitado, o quadro da esquerda)
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

// A base da página no quadro deitado, nos dois blocos que se apoiam na linha do espelho no
// vertical: o mapa (a figura fica de pé nela, com o losango no eixo do desenho) e a comparação com
// régua (os tiques sobem dela). No deitado a linha do espelho está de pé (a borda da moldura), então
// a página ganha a própria base: um fio dourado que se abre do centro, de borda a borda do quadro
// da esquerda, até encontrar a linha de pé.
const BaseDaPagina: React.FC<{ linha: number; x0: number; x1: number; inicio: number; xLosango: number | null; t: number; capa: boolean }> = ({
  linha,
  x0,
  x1,
  inicio,
  xLosango,
  t,
  capa,
}) => {
  const p = capa ? 1 : prog(t, inicio, 0.6, desliza);
  const meio = (x0 + x1) / 2;
  const meia = ((x1 - x0) / 2) * p;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      {p > 0.002 ? <line x1={meio - meia} x2={meio + meia} y1={linha} y2={linha} stroke={cor.ouro} strokeWidth={2.5} /> : null}
      {xLosango !== null ? (
        <rect x={xLosango - 9} y={linha - 9} width={18} height={18} fill={cor.ouro} opacity={capa ? 1 : prog(t, inicio + 0.3, 0.4)} transform={`rotate(45 ${xLosango} ${linha})`} />
      ) : null}
    </svg>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

  const ordenados = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);
  const linhas = useMemo(() => ordenados.map((m) => linhaDe(m, plano)), [ordenados, plano]);
  const colados = (i: number, j: number) => !!ordenados[i] && !!ordenados[j] && ordenados[j].de - ordenados[i].ate <= 0.3;
  // dois momentos colados com a linha no mesmo lugar: a página corre de lado, como uma porta de
  // correr (a que sai vai para a esquerda, a que entra vem de trás da moldura, da direita)
  const mesmaLinha = (i: number, j: number) => Math.abs(linhas[i] - linhas[j]) < 2;

  // o losango da linha de pé, na altura do rosto (blocos de texto e fechamento: a linha entre o
  // texto e o rosto, como no vertical, onde ele ficava em cima do rosto)
  const yLosango = Math.min(960, Math.max(120, plano.rosto.y * QUADRO.h));

  const visiveis = ordenados
    .map((m, i) => {
      const prox = ordenados[i + 1];
      const xl = xDaLinha(linhas[i]);
      const pagina = paginaNoQuadro(linhas[i]);
      const portaEntra = colados(i - 1, i) && mesmaLinha(i - 1, i);
      const portaSai = colados(i, i + 1) && mesmaLinha(i, i + 1);
      // a linha muda de lugar entre dois momentos colados: uma cortina de fio dourado atravessa o
      // quadro da esquerda para a direita junto com a linha (atrás do fio, a página nova; na
      // frente, a velha; nunca as duas no mesmo lugar)
      const fioEntra = colados(i - 1, i) && !portaEntra;
      const fioSai = colados(i, i + 1) && !portaSai;
      const fimReal = fimDoMomento(m, plano);
      const inicioEntrada = inicioDaTroca(m.de, plano);
      const inicioSaida = prox ? inicioDaTroca(prox.de, plano) : fimReal;
      // sem vizinho colado: o conteúdo fica até a pessoa (que volta à tela cheia) cobri-lo inteiro
      const fim = portaSai || fioSai ? inicioSaida + TROCA : m.tipo === "cta" ? fimReal : fimReal + TROCA + 0.05;
      const dx = (portaEntra ? xl * (1 - prog(t, m.de, TROCA, desliza)) : 0) - (portaSai ? xl * prog(t, prox.de, TROCA, desliza) : 0);
      const xEntra = fioEntra ? xl * prog(t, inicioEntrada, TROCA, desliza) : null;
      const xSai = fioSai ? xl * prog(t, inicioSaida, TROCA, desliza) : null;
      const naLinha = ehTexto(m) || m.tipo === "cta";
      const opLosango = naLinha
        ? (portaEntra ? 1 : fioEntra ? prog(t, inicioEntrada + TROCA * 0.4, 0.3) : prog(t, m.de < 0.3 ? -1 : m.de + 0.1, 0.4)) *
          (portaSai ? 1 : fioSai ? 1 - prog(t, inicioSaida, 0.25) : 1 - saindo(t, Math.min(fim, fimReal + 0.04), 0.3))
        : 0;
      // mapa e comparação com régua: a base da página (com o losango no eixo do desenho, no mapa)
      const base =
        m.tipo === "mapa" || (m.tipo === "comparacao" && ehRegua(m))
          ? {
              xLosango: m.tipo === "mapa" ? geometriaDoMapa(m, linhas[i]).eixoX : null,
              // de borda a borda do quadro da esquerda (em px da página)
              x0: -pagina.x,
              x1: xl - pagina.x,
              capa: portaEntra || m.de < 0.3,
              inicio: fioEntra ? inicioEntrada + TROCA * 0.3 : m.de,
            }
          : null;
      return { m, linha: linhas[i], xl, pagina, fim, fimComponente: portaSai || fioSai ? fim + 10 : fim, dx, xEntra, xSai, opLosango, base };
    })
    .filter((v) => t >= v.m.de - 0.05 && t <= v.fim);

  // a linha do espelho de pé é a borda esquerda da moldura da pessoa; some quando ela volta para a
  // tela cheia
  const xLinha = caixa.x;
  const mostrarLinha = limitar((xLinha - 8) / 60);
  // a legenda fica na moldura só dentro de um momento com `legenda: true` (centrada nela, no
  // peito); fora dos momentos (tela cheia, e enquanto a pessoa volta para ela), centrada no quadro
  const atual = ordenados.findIndex((m) => t >= m.de && t < m.ate);
  const naMoldura = atual >= 0 && xLinha > 200;
  const baseLegenda = LEGENDA_Y + ALTURA_LEGENDA;
  const centroLegenda = naMoldura ? xLinha + caixa.w / 2 : QUADRO.w / 2;
  const larguraLegenda = naMoldura ? Math.max(480, caixa.w - 80) : 1320;
  // o fio da cortina (na troca com a linha mudando de lugar)
  const fios = visiveis
    .filter((v) => v.xEntra !== null && v.xEntra > 0.5 && v.xEntra < v.xl - 0.5)
    .map((v) => ({ x: v.xEntra as number, xl: v.xl }));
  const losangos = visiveis.filter((v) => v.opLosango > 0.01);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.champanhe }}>
      {/* o quadro da esquerda (fica por baixo da pessoa: a moldura que recua revela, a que avança cobre) */}
      {visiveis.map(({ m, linha: linhaDoMomento, xl, pagina, fimComponente: fim, dx, xEntra, xSai, base }) => {
        const recorte =
          xEntra !== null && xEntra < xl - 0.5
            ? `inset(0 ${QUADRO.w - xEntra}px 0 0)`
            : xSai !== null && xSai > 0.5
              ? `inset(0 0 0 ${xSai}px)`
              : undefined;
        return (
          <AbsoluteFill key={`${m.tipo}-${m.de}`} style={{ translate: dx ? `${dx}px 0` : undefined, clipPath: recorte }}>
            {/* a página do bloco (1080 px de largura, como no vertical), no meio do quadro da esquerda */}
            <div style={{ position: "absolute", left: pagina.x, top: pagina.y, width: 1080, height: 1920 }}>
              {base ? <BaseDaPagina linha={linhaDoMomento} x0={base.x0} x1={base.x1} inicio={base.inicio} xLosango={base.xLosango} t={t} capa={base.capa} /> : null}
              <Conteudo m={m} t={t} fim={fim} linha={linhaDoMomento} plano={plano} />
            </div>
          </AbsoluteFill>
        );
      })}

      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.94)" />

      {/* a linha do espelho de pé, o losango que corre nela e o fio da cortina */}
      {mostrarLinha > 0 || fios.length ? (
        <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
          <line x1={xLinha} x2={xLinha} y1={0} y2={QUADRO.h} stroke={cor.ouro} strokeWidth={2.5} opacity={mostrarLinha} />
          {losangos.map((v) => (
            <rect
              key={`l-${v.m.de}`}
              x={xLinha - 9}
              y={yLosango - 9}
              width={18}
              height={18}
              fill={cor.ouro}
              opacity={mostrarLinha * v.opLosango}
              transform={`rotate(45 ${xLinha} ${yLosango})`}
            />
          ))}
          {fios.map((f) => (
            <line key={`fio-${f.x}`} x1={f.x} x2={f.x} y1={0} y2={QUADRO.h} stroke={cor.ouro} strokeWidth={2.5} opacity={0.15 + 0.85 * Math.sin((Math.PI * f.x) / f.xl)} />
          ))}
        </svg>
      ) : null}

      <Legendas frases={frases} base={baseLegenda} centroX={centroLegenda} largura={larguraLegenda} />

      {guias ? <Guias plano={plano} caixa={caixa} linha={atual >= 0 ? linhas[atual] : undefined} /> : null}

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
