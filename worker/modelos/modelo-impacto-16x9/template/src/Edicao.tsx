import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Easing, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, temposDaLinha, useTempo } from "./anim";
import { Assinatura } from "./componentes/Assinatura";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, instanteDoRisco, Pergunta, Topicos } from "./componentes/Blocos";
import { Circuito } from "./componentes/Circuito";
import type { Contexto } from "./componentes/contexto";
import { Gancho } from "./componentes/Gancho";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Numero, numeroDoPlano } from "./componentes/Numero";
import { Virada } from "./componentes/Virada";
import { arranjos, type Cortina, cortinaDepois, estadosDaCaixa, fimDoMomento, ordenar, TRANSICAO } from "./layout";
import { CHEIO_16x9, caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Momento, Palavra, Plano } from "./plano";
import { BASE_ASSINATURA, cor, geometria, LEGENDA_Y, MARGEM, QUADRO, TOPO_UTIL } from "./tema";
import { alinhar, palavrasDoTrecho } from "./texto";

// ——— Faixas do quadro deitado ———
// o conteúdo (texto, ficha, gráfico) para aqui quando não há assinatura nem legenda embaixo
const LIMITE_CONTEUDO = 940;
// altura da assinatura (filete, nome e profissão em uma linha) acima da base dela
const ALTURA_ASSINATURA = 132;
// legenda dentro do quadro de texto (momento na moldura com `legenda: true`): acima da assinatura
const LEGENDA_NA_COLUNA = 712;

const renderMomento = (m: Momento, ctx: Contexto) => {
  switch (m.tipo) {
    case "abertura":
      return <Abertura m={m} ctx={ctx} />;
    case "gancho":
      return <Gancho m={m} ctx={ctx} />;
    case "topicos":
      return <Topicos m={m} ctx={ctx} />;
    case "passos":
    case "circuito":
      return <Circuito m={m} ctx={ctx} />;
    case "numero":
      return <Numero m={m} ctx={ctx} />;
    case "comparacao":
      return <Comparacao m={m} ctx={ctx} />;
    case "grafico":
      return <Grafico m={m} ctx={ctx} />;
    case "destaque":
      return <Destaque m={m} ctx={ctx} />;
    case "definicao":
      return <Definicao m={m} ctx={ctx} />;
    case "frase":
      return <Frase m={m} ctx={ctx} />;
    case "pergunta":
      return <Pergunta m={m} ctx={ctx} />;
    case "virada":
      return <Virada m={m} ctx={ctx} />;
    case "cta":
      return <Cta m={m} ctx={ctx} />;
  }
};

// a palavra mais longa de um trecho (onde cai a pancada grave)
const palavraForte = (texto: string, trecho: string | undefined, palavras: Palavra[], inicio: number, limite: number) => {
  const indices = palavrasDoTrecho(texto, trecho);
  if (!indices.size) return undefined;
  const ws = texto.trim().split(/\s+/);
  const tempos = alinhar(texto, palavras, inicio, limite);
  const k = [...indices].reduce((a, b) => (ws[b].length > ws[a].length ? b : a));
  return tempos[k];
};

// Sons: poucos e tonais. Pancada grave nas palavras que importam (o número travando, o risco, o
// alerta), subida curta quando uma tela abre ou a chamada começa, um bipe baixo (cada vez mais
// agudo) em cada item de lista.
const sons = (plano: Plano, momentos: Momento[], palavras: Palavra[]) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  const pancada = (em: number | undefined, volume = 0.55) => em !== undefined && lista.push({ em, arquivo: "sfx/pancada.wav", volume });
  const subida = (em: number, volume = 0.36) => lista.push({ em, arquivo: "sfx/subida.wav", volume });
  const bipes = (ems: number[], volume = 0.32) => ems.forEach((em, i) => lista.push({ em, arquivo: `sfx/bipe-${Math.min(i, 4) + 1}.wav`, volume }));
  for (const m of momentos) {
    switch (m.tipo) {
      case "gancho": {
        // a pancada cai na palavra mais longa da linha em destaque (a palavra de conteúdo: "hora", não "de")
        const alvo = m.itens.find((l) => l.destaque) ?? m.itens[m.itens.length - 1];
        if (alvo) {
          const tempos = temposDaLinha(alvo.texto, alvo.em, palavras, m.ate);
          const ws = alvo.texto.trim().split(/\s+/);
          const k = ws.reduce((melhor, w, i) => (w.length >= ws[melhor].length ? i : melhor), 0);
          pancada(tempos[k] ?? tempos[0]);
        }
        break;
      }
      case "abertura":
        pancada(palavraForte(m.texto, m.destaque, palavras, m.em ?? m.de, m.ate));
        break;
      case "frase": {
        const tempos = alinhar(m.texto, palavras, m.em ?? m.de, m.ate);
        const risco = instanteDoRisco(m, tempos, palavrasDoTrecho(m.texto, m.risco));
        pancada(risco ?? palavraForte(m.texto, m.destaque, palavras, m.em ?? m.de, m.ate));
        break;
      }
      case "numero":
        pancada(numeroDoPlano(m, palavras).em, 0.6);
        break;
      case "destaque":
        pancada(m.em, m.nivel === "alerta" ? 0.6 : 0.5);
        break;
      case "topicos":
        bipes(m.itens.map((it) => it.em));
        break;
      case "passos":
        subida(m.de + 0.05, 0.34);
        bipes(m.itens.map((it) => it.em));
        break;
      case "circuito":
        subida(m.intervalo?.em ?? (typeof m.titulo === "object" ? m.titulo.em : undefined) ?? m.de, 0.38);
        bipes(m.itens.map((it) => it.em));
        if (m.voltas) pancada(m.voltas.em, 0.6);
        break;
      case "grafico":
        subida(m.de + 0.05, 0.34);
        bipes((m.dados ?? []).map((d) => d.em), 0.3);
        break;
      case "comparacao":
        if (m.vencedor !== undefined || m.modo === "errado-certo") pancada(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.45);
        else bipes([m.lados[0].em, m.lados[1].em], 0.3);
        break;
      case "definicao":
        bipes([m.em, m.significadoEm], 0.3);
        break;
      case "pergunta":
        subida((m.em ?? m.de) + 0.02, 0.32);
        bipes((m.opcoes ?? []).map((o) => o.em), 0.28);
        break;
      case "virada":
        pancada(m.grifoEm);
        break;
      case "cta":
        subida(m.de + 0.05, 0.34);
        break;
    }
  }
  return lista.filter((s) => s.em >= 0 && s.em < plano.duracao - 0.1);
};

// Onde está o filete da cortina no instante t (px) e quanto ela já andou (0–1).
const naCortina = (t: number, c: Cortina) => {
  const p = prog(t, c.t0, c.dur, Easing.inOut(Easing.cubic));
  return { p, x: c.x0 + (c.x1 - c.x0) * p };
};
// Recorte de um momento que entra (lado de trás do filete) ou sai (lado da frente).
const recorteDaCortina = (t: number, c: Cortina, entra: boolean) => {
  const { x } = naCortina(t, c);
  const paraEsquerda = c.x1 < c.x0;
  if (!entra && c.manterLadoDaCaixa) {
    // o que sai fica na frente do filete E do lado de lá da partida (a faixa entre os dois é do novo)
    const a = Math.max(0, Math.min(x, c.x0));
    const b = Math.min(QUADRO.w, Math.max(x, c.x0));
    const H = QUADRO.h;
    return `polygon(0px 0px, ${a}px 0px, ${a}px ${H}px, ${b}px ${H}px, ${b}px 0px, ${QUADRO.w}px 0px, ${QUADRO.w}px ${H + 2}px, 0px ${H + 2}px)`;
  }
  // o momento novo fica entre o filete e o ponto de partida dele
  const mostraDireita = paraEsquerda === entra;
  return mostraDireita ? `inset(0 0 0 ${Math.max(0, x)}px)` : `inset(0 ${Math.max(0, QUADRO.w - x)}px 0 0)`;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const geo = useMemo(() => geometria(plano.rosto), [plano]);
  const momentos = useMemo(() => ordenar(plano), [plano]);
  const lugares = useMemo(() => arranjos(momentos), [momentos]);
  const estados = useMemo(() => estadosDaCaixa(plano, videoAltura, geo), [plano, videoAltura, geo]);
  const cortinas = useMemo(() => momentos.map((_, i) => cortinaDepois(i, momentos, lugares, geo)), [momentos, lugares, geo]);
  const frases = useMemo(() => montarFrases({ ...plano, momentos }), [plano, momentos]);
  // nas guias, a pessoa fica sempre em quadro cheio e sem momentos: é só para conferir o enquadramento
  const caixa = guias ? { ...CHEIO_16x9, h: videoAltura } : caixaNoTempo(t, estados, CHEIO_16x9);
  // palavras já com as correções do plano: é nelas que cada palavra grande acha o seu tempo
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);

  // o texto grande fica centrado no meio do quadro de texto (entre a margem de cima e a assinatura),
  // perto da altura do rosto da pessoa na moldura
  const yc = Math.min(500, Math.max(420, plano.rosto.y * QUADRO.h + 60));
  // legenda na área segura de baixo, acima dos controles do player
  const legendaY = LEGENDA_Y;

  const ativos = momentos
    .map((m, i) => {
      const fim = fimDoMomento(m, momentos, plano.duracao);
      const entra = i > 0 ? cortinas[i - 1] : null;
      const sai = cortinas[i];
      // sem cortina, quem cobre o que sai é a caixa da pessoa (andando, crescendo ou voltando ao centro)
      const saida = sai ? sai.t0 + sai.dur + 0.02 : fim + TRANSICAO;
      return { m, i, fim, entra, sai, saida };
    })
    .filter(({ m, saida }) => !guias && t >= m.de - 0.05 && t <= saida);

  // legenda num momento com `legenda: true`: no quadro de texto (entre o texto e a assinatura) quando
  // a pessoa está na moldura; na área segura de baixo, de fora a fora, no resto
  const momentoAgora = ativos.find(({ m, fim }) => t >= m.de && t < fim);
  const lugarAgora = momentoAgora ? lugares[momentoAgora.i] : null;
  const areaLegenda =
    lugarAgora?.tipo === "lado"
      ? { ...geo.coluna(), y: LEGENDA_NA_COLUNA }
      : { x: 2 * MARGEM, w: QUADRO.w - 4 * MARGEM, y: legendaY };

  // filete no acento nas bordas internas da caixa da pessoa (só quando ela está na moldura alta)
  const alta = prog(caixa.h, 0.78 * QUADRO.h, 0.16 * QUADRO.h, (x) => x);
  const bordaEsq = caixa.x > 2 ? alta : 0;
  const bordaDir = caixa.x + caixa.w < QUADRO.w - 2 ? alta : 0;

  // o filete da cortina que está passando agora (no máximo um)
  const cortinaAgora = cortinas.map((c) => (c ? { c, ...naCortina(t, c) } : null)).find((c) => c && c.p > 0 && c.p < 1);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
      {/* conteúdo dos momentos: fica atrás da pessoa (quando a caixa volta, ela passa por cima) */}
      {ativos.map(({ m, i, fim, entra, sai, saida }) => {
        const lugar = lugares[i];
        const lado = lugar.tipo === "lado" ? lugar.lado : "direita";
        const comLegenda = !!m.legenda && lugar.tipo === "lado";
        // a faixa de baixo de um momento em tela cheia: acima da legenda, quando ela continua
        const baseCheia = m.legenda ? LEGENDA_Y - 40 : LIMITE_CONTEUDO;
        const base =
          lugar.tipo === "janela" ? baseCheia : comLegenda ? LEGENDA_NA_COLUNA - 36 : plano.marca.nome ? BASE_ASSINATURA - ALTURA_ASSINATURA - 36 : LIMITE_CONTEUDO;
        const ctx: Contexto = {
          coluna: geo.coluna(lado),
          // com legenda no quadro de texto, o texto grande sobe um pouco para dar lugar a ela
          yc: Math.min(yc, (TOPO_UTIL + base) / 2 + 20),
          topo: TOPO_UTIL,
          base,
          vemDe: lado,
          palavras,
          fim,
          saida,
          marca: plano.marca,
          geo,
        };
        // o texto de um momento de lado só aparece do lado livre da caixa: quando a caixa anda,
        // a borda dela funciona como uma cortina (revela o que entra, cobre o que sai)
        const recorte =
          lugar.tipo === "lado"
            ? lado === "direita"
              ? `inset(0 ${Math.max(0, QUADRO.w - caixa.x)}px 0 0)`
              : `inset(0 0 0 ${Math.min(QUADRO.w, caixa.x + caixa.w)}px)`
            : undefined;
        // trocas coladas sem a caixa atravessar: o filete varre a área (o novo atrás, o velho na frente)
        const cortina =
          entra && t < entra.t0 + entra.dur
            ? recorteDaCortina(t, entra, true)
            : sai && t >= sai.t0
              ? recorteDaCortina(t, sai, false)
              : undefined;
        return (
          <AbsoluteFill key={`${m.tipo}-${m.de}`} style={{ clipPath: cortina }}>
            <AbsoluteFill style={{ clipPath: recorte }}>
              {renderMomento(m, ctx)}
              {lugar.tipo === "lado" ? (
                <Assinatura marca={plano.marca} x={ctx.coluna.x} base={BASE_ASSINATURA} de={m.de} saida={ctx.saida} />
              ) : null}
            </AbsoluteFill>
          </AbsoluteFill>
        );
      })}

      {cortinaAgora ? (
        <div style={{ position: "absolute", left: cortinaAgora.x - 3, top: 0, width: 6, height: QUADRO.h, background: cor.volt }} />
      ) : null}

      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.05) saturate(0.96)" />
      {bordaEsq > 0 ? (
        <div style={{ position: "absolute", left: caixa.x - 3, top: caixa.y, width: 6, height: caixa.h, background: cor.volt, opacity: bordaEsq }} />
      ) : null}
      {bordaDir > 0 ? (
        <div style={{ position: "absolute", left: caixa.x + caixa.w - 3, top: caixa.y, width: 6, height: caixa.h, background: cor.volt, opacity: bordaDir }} />
      ) : null}

      <Legendas
        frases={frases}
        x={areaLegenda.x}
        largura={areaLegenda.w}
        y={areaLegenda.y}
        // em quadro cheio, a legenda espera a pessoa terminar de voltar para o centro
        visivel={lugarAgora ? 1 : prog(caixa.w, 0.88 * QUADRO.w, 0.1 * QUADRO.w, (x) => x)}
        coluna={lugarAgora?.tipo === "lado"}
      />

      {guias ? <Guias plano={plano} legendaY={legendaY} /> : null}

      {plano.sfx === false
        ? null
        : sons(plano, momentos, palavras).map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
