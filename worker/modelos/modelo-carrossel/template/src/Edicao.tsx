import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { useTempo } from "./anim";
import { Cabecalho } from "./componentes/Cabecalho";
import { Calendario } from "./componentes/Calendario";
import { Capa, Cta, Frase } from "./componentes/Cartoes";
import { Destaque, Numero, Pergunta } from "./componentes/CartoesUniversais";
import { Definicao } from "./componentes/Definicao";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Contador, Pontos } from "./componentes/Indicadores";
import { Legendas } from "./componentes/Legendas";
import { Lista } from "./componentes/Lista";
import { dadosDaComparacao, dadosDaTroca, Troca } from "./componentes/Troca";
import { type Caixa, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import {
  caixaNaPagina,
  caixaNaTela,
  camera,
  chegadaDaPagina,
  type Deslize,
  montarDeslizes,
  montarPaginas,
  type Pagina,
  PARALAXE,
  saidaDaPagina,
  transformacao,
} from "./paginas";
import type { Momento, Plano } from "./plano";
import { cor, H, W, zona as zonaPadrao } from "./tema";

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

// Som raro e tonal: um tom de "página" a cada deslize (subindo de nota a cada página, como quem
// avança no carrossel), um par de notas quando algo novo chega (o item novo, um item da lista, o
// significado, um dado, uma opção) e um toque grave no botão do fechamento e no destaque.
const sons = (plano: Plano, deslizes: Deslize[]): Som[] => {
  const lista: Som[] = deslizes.map((d, k) => ({ em: d.inicio + 0.04, arquivo: `sfx/pagina-${(k % 6) + 1}.wav`, volume: 0.32 }));
  const entra = (em: number, volume = 0.26) => lista.push({ em: em - 0.1, arquivo: "sfx/entra.wav", volume });
  for (const m of plano.momentos) {
    if (m.tipo === "troca") entra(m.entra.em, 0.3);
    if (m.tipo === "comparacao") entra(m.lados[1].em, 0.3);
    if (m.tipo === "lista" || m.tipo === "topicos" || m.tipo === "passos") m.itens.forEach((it) => entra(it.em));
    if (m.tipo === "definicao") entra(m.significadoEm, 0.28);
    if (m.tipo === "grafico") (m.dados ?? []).forEach((d) => entra(d.em, 0.22));
    if (m.tipo === "pergunta") (m.opcoes ?? []).forEach((o) => entra(o.em, 0.22));
    if (m.tipo === "numero") entra(m.em, 0.26);
    if (m.tipo === "destaque") lista.push({ em: m.em - 0.05, arquivo: "sfx/toque.wav", volume: 0.3 });
    if (m.tipo === "cta") lista.push({ em: m.toqueEm ?? m.de + (m.ate - m.de) * 0.6, arquivo: "sfx/toque.wav", volume: 0.36 });
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// fora da tela (a pessoa principal nunca desmonta: é ela que carrega o som)
const FORA: Caixa = { x: -2 * W, y: 0, w: 64, h: 64, raio: 0, zoom: 1, ancoraY: 0.5 };

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zonaTopo = { ...zonaPadrao, ...plano.zona }.topo;
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const paginas = useMemo(() => montarPaginas(plano), [plano]);
  const deslizes = useMemo(() => montarDeslizes(paginas, plano), [paginas, plano]);
  const listaSons = useMemo(() => sons(plano, deslizes), [plano, deslizes]);
  const chegadas = useMemo(() => paginas.map((pg) => chegadaDaPagina(pg.indice, deslizes)), [paginas, deslizes]);
  const numeroDaTroca = useMemo(() => {
    const mapa = new Map<Momento, number>();
    plano.momentos.filter((m) => m.tipo === "troca").forEach((m, i) => mapa.set(m, i + 1));
    return mapa;
  }, [plano]);

  const cam = camera(t, deslizes);
  const visiveis = paginas
    .filter((pg) => Math.abs(pg.indice - cam) < 1.001)
    .map((pg) => {
      const tr = transformacao(pg.indice, cam);
      const caixa = caixaNaPagina(pg, plano);
      if (pg.pessoa === "cheia") {
        // corte no meio de uma página da pessoa: troca seca de enquadramento (1 ↔ 1,06) disfarça o pulo
        const cortesAntes = (plano.cortesEm ?? []).filter((c) => c > pg.de + 0.3 && c < pg.ate - 0.3 && c <= t).length;
        if (cortesAntes % 2 === 1) caixa.zoom = (caixa.zoom ?? 1) * 1.06;
      }
      return { pg, tr, pessoa: caixaNaTela(caixa, tr, pg.pessoa === "cheia") };
    });
  const principal = [...visiveis].sort((a, b) => Math.abs(a.tr.desvio) - Math.abs(b.tr.desvio))[0];
  const secundarias = visiveis.filter((v) => v !== principal);

  const conteudo = (pg: Pagina) => {
    const chegada = chegadas[pg.indice];
    const saida = saidaDaPagina(pg.indice, deslizes);
    if (pg.tipo === "conteudo") {
      const m = pg.momentos[0];
      return (
        <>
          {pg.pessoa === "avatar" ? <Cabecalho marca={plano.marca} /> : null}
          {m?.tipo === "troca" ? <Troca m={dadosDaTroca(m, numeroDaTroca.get(m) ?? 1)} palavras={plano.palavras} t={t} chegada={chegada} /> : null}
          {m?.tipo === "comparacao" ? <Troca m={dadosDaComparacao(m)} palavras={plano.palavras} t={t} chegada={chegada} /> : null}
          {m?.tipo === "lista" ? <Lista m={m} palavras={plano.palavras} t={t} chegada={chegada} marcador="numeros" /> : null}
          {m?.tipo === "topicos" ? <Lista m={m} palavras={plano.palavras} t={t} chegada={chegada} marcador="pontos" /> : null}
          {m?.tipo === "passos" ? <Lista m={m} palavras={plano.palavras} t={t} chegada={chegada} marcador="passos" /> : null}
          {m?.tipo === "grafico" ? <Grafico m={m} palavras={plano.palavras} t={t} chegada={chegada} /> : null}
          {m?.tipo === "definicao" ? <Definicao m={m} palavras={plano.palavras} t={t} chegada={chegada} /> : null}
          {m?.tipo === "calendario" ? <Calendario m={m} palavras={plano.palavras} t={t} chegada={chegada} /> : null}
        </>
      );
    }
    // página da pessoa: cartões na altura do peito, um por vez
    return pg.momentos.map((m) => {
      // o cartão sai sozinho se a página continua depois dele; senão sai junto com a página
      const ate = m.ate < pg.ate - 0.3 ? m.ate : Infinity;
      if (t < m.de - 0.1 || t > ate + 0.05) return null;
      const chave = `${m.tipo}-${m.de}`;
      switch (m.tipo) {
        case "capa":
          return <Capa key={chave} m={m} palavras={plano.palavras} t={t} zonaTopo={zonaTopo} saida={saida} ate={ate} />;
        case "abertura":
          return (
            <Capa
              key={chave}
              m={{ ...m, titulo: m.texto, arrasta: m.arrasta ?? pg.indice === 0 }}
              palavras={plano.palavras}
              t={t}
              zonaTopo={zonaTopo}
              saida={saida}
              ate={ate}
            />
          );
        case "numero":
          return <Numero key={chave} m={m} palavras={plano.palavras} t={t} zonaTopo={zonaTopo} ate={ate} saida={saida} primeira={pg.indice === 0} />;
        case "destaque":
          return <Destaque key={chave} m={m} palavras={plano.palavras} t={t} zonaTopo={zonaTopo} ate={ate} />;
        case "pergunta":
          return <Pergunta key={chave} m={m} palavras={plano.palavras} t={t} zonaTopo={zonaTopo} ate={ate} />;
        case "frase":
          return <Frase key={chave} m={m} palavras={plano.palavras} t={t} zonaTopo={zonaTopo} ate={ate} />;
        case "cta":
          return <Cta key={chave} m={m} marca={plano.marca} palavras={plano.palavras} t={t} zonaTopo={zonaTopo} ate={ate} />;
        default:
          return null;
      }
    });
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.petroleoFundo }}>
      {/* 1. o papel de cada página (na página da pessoa, só aparece embaixo de um vídeo 3:4) */}
      {visiveis.map(({ pg, tr }) => (
        <div
          key={`fundo-${pg.indice}`}
          style={{ position: "absolute", left: tr.x, top: tr.y, width: W * tr.escala, height: H * tr.escala, borderRadius: tr.raio, background: cor.creme }}
        />
      ))}

      {/* 2. a pessoa: a principal (a que carrega a voz) fica montada o vídeo inteiro; durante um
          deslize entre duas páginas com a pessoa, a da outra página é uma cópia muda */}
      <VideoNaCaixa
        src={plano.video}
        caixa={principal ? principal.pessoa : FORA}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="saturate(1.04) contrast(1.02)"
      />
      {secundarias.map(({ pg, pessoa }) => (
        <VideoNaCaixa
          key={`mudo-${pg.indice}`}
          mudo
          src={plano.video}
          caixa={pessoa}
          rosto={plano.rosto}
          videoAltura={videoAltura}
          filtro="saturate(1.04) contrast(1.02)"
        />
      ))}

      {/* 3. o conteúdo de cada página, com a mesma transformação (e a paralaxe) */}
      {visiveis.map(({ pg, tr }) => (
        <div
          key={`pagina-${pg.indice}`}
          style={{
            position: "absolute",
            left: tr.x,
            top: tr.y,
            width: W * tr.escala,
            height: H * tr.escala,
            borderRadius: tr.raio,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              transformOrigin: "0 0",
              scale: String(tr.escala),
              translate: `${tr.desvio * PARALAXE * tr.escala}px 0`,
            }}
          >
            {conteudo(pg)}
          </div>
        </div>
      ))}

      {/* 4. a moldura do carrossel: legenda, pontinhos e contador */}
      <Legendas frases={frases} />
      <Pontos total={paginas.length} cam={cam} />
      <Contador t={t} total={paginas.length} chegadas={chegadas} />

      {guias ? <Guias plano={plano} zonaTopo={zonaTopo} caixa={principal?.pessoa ?? null} /> : null}

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
