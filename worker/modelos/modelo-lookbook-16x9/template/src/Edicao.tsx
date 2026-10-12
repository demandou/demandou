import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { cruza, ENTRADA, prog, SAIDA, useTempo } from "./anim";
import { Cabecalho } from "./componentes/Cabecalho";
import { CapaDeRevista } from "./componentes/Capa";
import { ColagemDoLook } from "./componentes/Colagem";
import { CartoesLadoALado } from "./componentes/Comparacao";
import { DefinicaoDeCatalogo } from "./componentes/Definicao";
import { EtiquetaFinal } from "./componentes/Etiqueta";
import { FitaDePassos } from "./componentes/Fita";
import { GraficoDeCatalogo } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { DestaqueNaPagina, FraseNaPagina, PerguntaNaPagina } from "./componentes/Lateral";
import { Legendas } from "./componentes/Legendas";
import { ListaDeCatalogo } from "./componentes/Lista";
import { NumeroDeRevista } from "./componentes/Numero";
import { PaginaDaPeca } from "./componentes/Peca";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { areaDaPagina, estadosDaFoto, fotoNoTempo, resolverLayouts, rostoDo, type LayoutPessoa, type MomentoComLayout } from "./pessoa";
import type { Momento, Plano } from "./plano";
import { cor, ESCALA, LEGENDA_Y, PAGINA, QUADRO } from "./tema";

// O último momento fica até o fim do vídeo quando é o fechamento ou termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Ajuste de segurança: um momento nunca invade o seguinte.
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

// Sons raros e tonais: um grave que desce a cada troca de página, a nota do pino (subindo de
// altura), o acorde do conjunto montado e um tom grave na capa e na etiqueta. Nunca dois sons
// a menos de 0,45 s um do outro.
const sons = (plano: Plano, lista: MomentoComLayout[]) => {
  const brutos: { em: number; arquivo: string; volume: number }[] = [];
  let pino = 0;
  const nota = () => `sfx/pino-${(pino++ % 3) + 1}.wav`;
  let anterior: LayoutPessoa | null = null;
  for (const { m, layout } of lista) {
    const troca = anterior !== null && anterior !== layout;
    anterior = layout;
    switch (m.tipo) {
      case "capa":
      case "abertura":
        brutos.push({ em: Math.max(0, m.de + 0.2), arquivo: "sfx/tom.wav", volume: 0.35 });
        break;
      case "peca":
        brutos.push({ em: m.de, arquivo: "sfx/pagina.wav", volume: 0.45 });
        brutos.push({ em: m.pontoEm ?? m.nomeEm, arquivo: nota(), volume: 0.42 });
        break;
      case "colagem":
        brutos.push({ em: m.itens[0]?.em ?? m.de, arquivo: "sfx/pagina.wav", volume: 0.4 }, { em: Math.max(m.de, m.ate - 0.7), arquivo: "sfx/acorde.wav", volume: 0.4 });
        break;
      case "cta":
        brutos.push({ em: m.textoEm ?? m.em ?? m.de + 0.1, arquivo: "sfx/tom.wav", volume: 0.38 });
        break;
      case "numero":
        if (layout === "capa") brutos.push({ em: Math.max(0, m.de + 0.2), arquivo: "sfx/tom.wav", volume: 0.35 });
        else if (troca) brutos.push({ em: m.de, arquivo: "sfx/pagina.wav", volume: 0.4 });
        brutos.push({ em: m.em + 1.0, arquivo: nota(), volume: 0.36 });
        break;
      case "definicao":
        if (troca) brutos.push({ em: m.de, arquivo: "sfx/pagina.wav", volume: 0.4 });
        brutos.push({ em: m.significadoEm, arquivo: nota(), volume: 0.36 });
        break;
      case "comparacao":
        if (troca) brutos.push({ em: m.de, arquivo: "sfx/pagina.wav", volume: 0.4 });
        if (m.vencedor !== undefined || m.modo === "errado-certo") brutos.push({ em: m.vencedorEm ?? m.lados[1].em + 0.45, arquivo: nota(), volume: 0.36 });
        break;
      case "destaque":
        if (troca) brutos.push({ em: m.de, arquivo: "sfx/pagina.wav", volume: 0.4 });
        brutos.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/tom.wav" : nota(), volume: 0.36 });
        break;
      default:
        if (troca) brutos.push({ em: m.de, arquivo: "sfx/pagina.wav", volume: 0.4 });
    }
  }
  const lista2 = brutos.sort((a, b) => a.em - b.em);
  const saida: typeof brutos = [];
  for (const s of lista2) if (!saida.length || s.em - saida[saida.length - 1].em >= 0.45) saida.push(s);
  return saida;
};

// ——— virada de página ———
const DUR_VIRADA = 0.5;
type Virada = { de: number; sentido: 1 | -1 };
const viradasDaPagina = (plano: Plano, lista: MomentoComLayout[]) => {
  const entra: (Virada | undefined)[] = [];
  const sai: (Virada | undefined)[] = [];
  const fimVisual: (number | undefined)[] = [];
  const todas: Virada[] = [];
  lista.forEach(({ m, layout }, i) => {
    const prox = lista[i + 1];
    if (!prox || prox.m.de - m.ate > 0.3) return;
    // a linha corre na direção em que a página nova abre: da esquerda quando o conteúdo novo
    // fica à esquerda (foto à direita), da direita quando fica à direita (foto à esquerda)
    const sentido: 1 | -1 = prox.layout === "esquerda" ? -1 : prox.layout === "direita" ? 1 : layout === "direita" ? -1 : 1;
    const v = { de: prox.m.de, sentido };
    sai[i] = v;
    entra[i + 1] = v;
    fimVisual[i] = Math.max(m.ate, prox.m.de) + DUR_VIRADA;
    todas.push(v);
  });
  return { entra, sai, fimVisual, lista: todas };
};
const posicaoDaVirada = (t: number, v: Virada) => {
  const w = prog(t, v.de, DUR_VIRADA, cruza);
  return { w, x: v.sentido === 1 ? PAGINA.w * w : PAGINA.w * (1 - w) };
};
// recorte (clip-path) de um momento durante as viradas; "nada" = ainda não apareceu / já saiu
const recorteDaVirada = (t: number, entra?: Virada, sai?: Virada): string | null | "nada" => {
  let esq = 0;
  let dir = PAGINA.w;
  if (entra && t < entra.de + DUR_VIRADA) {
    const { w, x } = posicaoDaVirada(t, entra);
    if (w <= 0) return "nada";
    if (entra.sentido === 1) dir = Math.min(dir, x);
    else esq = Math.max(esq, x);
  }
  if (sai && t >= sai.de) {
    const { w, x } = posicaoDaVirada(t, sai);
    if (w >= 1) return "nada";
    if (sai.sentido === 1) esq = Math.max(esq, x);
    else dir = Math.min(dir, x);
  }
  if (esq <= 0 && dir >= PAGINA.w) return null;
  // as bordas de cima/baixo e as laterais externas ficam folgadas (sombras, rotações)
  return `inset(-200px ${(PAGINA.w - dir).toFixed(1)}px -200px ${esq.toFixed(1)}px)`.replace(" 0.0px", " -200px");
};
const LinhaDaVirada: React.FC<{ t: number; viradas: Virada[] }> = ({ t, viradas }) => {
  const v = viradas.find((x) => t >= x.de && t < x.de + DUR_VIRADA);
  if (!v) return null;
  const { x } = posicaoDaVirada(t, v);
  return <div style={{ position: "absolute", left: x - 1.5, top: 108, width: 3, height: PAGINA.h - 108, background: cor.tinta, opacity: 0.55 }} />;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const lista = useMemo(() => resolverLayouts(plano), [plano]);
  const estados = useMemo(() => estadosDaFoto(plano, lista), [plano, lista]);
  const foto = fotoNoTempo(t, plano, estados);
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const totalPecas = plano.momentos.filter((m) => m.tipo === "peca").length;
  // Virada de página entre momentos colados: uma linha fina varre a tela em 0,5 s; de um lado
  // dela já é a página nova, do outro ainda é a velha (nunca as duas no mesmo lugar, nunca vazio).
  const viradas = useMemo(() => viradasDaPagina(plano, lista), [plano, lista]);
  const ativos = lista.filter(({ m }, i) => t >= m.de - 0.05 && t <= (viradas.fimVisual[i] ?? fimDoMomento(m, plano)) + SAIDA);
  // a legenda fica na área segura de baixo, acima dos controles do player
  const legendaY = LEGENDA_Y;
  const listaDeSons = useMemo(() => sons(plano, lista), [plano, lista]);

  // Duas camadas: "papel" fica embaixo da foto (a foto cobre como uma cortina quando muda de
  // lugar, e nada fica fantasma por cima dela); "sobre" é o que avança sobre a foto de propósito
  // (os cartões das páginas laterais, pinos e linhas, os recortes da colagem, a etiqueta).
  const NO_PAPEL = ["capa", "abertura", "topicos", "passos", "numero", "comparacao", "grafico", "definicao"];
  const AMBAS = ["peca", "frase", "destaque", "pergunta", "colagem"];
  const camada = (qual: "papel" | "sobre") =>
    ativos.map(({ m, layout }) => {
      const i = lista.findIndex((x) => x.m === m);
      // com virada, a página só "sai" depois que a linha passou (ela já está escondida)
      const fim = viradas.fimVisual[i] ?? fimDoMomento(m, plano);
      const id = `m${i}-${Math.round(m.de * 100)}`;
      const area = areaDaPagina(layout, plano);
      const aqui = AMBAS.includes(m.tipo) ? true : NO_PAPEL.includes(m.tipo) ? qual === "papel" : qual === "sobre";
      if (!aqui) return null;
      // sem virada (primeiro momento, ou depois de um respiro): entra depois que o anterior saiu
      const vEntra = viradas.entra[i];
      const vSai = viradas.sai[i];
      const entra = vEntra || m.de < 0.05 ? 1 : prog(t, m.de + ENTRADA, 0.18);
      if (entra <= 0) return null;
      const recorte = recorteDaVirada(t, vEntra, vSai);
      if (recorte === "nada") return null;
      const bloco = (() => {
      switch (m.tipo) {
        case "capa":
        case "abertura":
          return <CapaDeRevista key={id} m={m} t={t} plano={plano} fim={fim} area={area} />;
        case "peca":
          return <PaginaDaPeca key={id} m={m} t={t} plano={plano} foto={foto} layout={layout as LayoutPessoa} fim={fim} total={m.total ?? totalPecas} id={id} camada={qual} />;
        case "frase":
          return <FraseNaPagina key={id} m={m} t={t} plano={plano} fim={fim} layout={layout} camada={qual} />;
        case "destaque":
          return <DestaqueNaPagina key={id} m={m} t={t} plano={plano} fim={fim} layout={layout} camada={qual} />;
        case "pergunta":
          return <PerguntaNaPagina key={id} m={m} t={t} plano={plano} fim={fim} layout={layout} camada={qual} />;
        case "topicos":
          return <ListaDeCatalogo key={id} m={m} t={t} fim={fim} area={area} />;
        case "passos":
          return <FitaDePassos key={id} m={m} t={t} fim={fim} area={area} />;
        case "numero":
          return <NumeroDeRevista key={id} m={m} t={t} fim={fim} area={area} capa={layout === "capa"} />;
        case "comparacao":
          return <CartoesLadoALado key={id} m={m} t={t} fim={fim} area={area} id={id} />;
        case "grafico":
          return <GraficoDeCatalogo key={id} m={m} t={t} fim={fim} area={area} id={id} />;
        case "definicao":
          return <DefinicaoDeCatalogo key={id} m={m} t={t} fim={fim} area={area} id={id} plano={plano} />;
        case "colagem":
          return <ColagemDoLook key={id} m={m} t={t} plano={plano} fim={fim} id={id} camada={qual} />;
        case "cta":
          return <EtiquetaFinal key={id} m={m} t={t} plano={plano} foto={foto} fim={fim} />;
        default:
          return null;
      }
      })();
      if (entra >= 1 && !recorte) return bloco;
      return (
        <AbsoluteFill key={id} style={{ opacity: entra, clipPath: recorte || undefined }}>
          {bloco}
        </AbsoluteFill>
      );
    });

  const moldura = foto.moldura;
  // A página é desenhada na camada lógica (os tamanhos do vertical) e encolhida pela ESCALA até o
  // quadro 1920×1080 (tema.ts).
  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel, fontVariantNumeric: "lining-nums" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: PAGINA.w, height: PAGINA.h, transform: `scale(${ESCALA})`, transformOrigin: "0 0" }}>
      {camada("papel")}
      <LinhaDaVirada t={t} viradas={viradas.lista} />

      {/* a foto da pessoa: sempre montada (é dela que vem a voz) */}
      <VideoNaCaixa
        src={plano.video}
        caixa={foto.caixa}
        rosto={rostoDo(plano)}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.96)"
        estilo={{
          rotate: `${foto.rot}deg`,
          boxShadow: moldura > 0.01 ? `0 0 0 ${16 * moldura}px ${cor.folha}, 0 ${30 * moldura}px ${60 * moldura}px rgba(30,24,16,${0.3 * moldura})` : undefined,
        }}
      />

      <Cabecalho plano={plano} t={t} />

      {camada("sobre")}

      <Legendas frases={frases} y={legendaY} />

      {guias ? <Guias plano={plano} foto={foto} legendaY={legendaY} t={t} /> : null}
    </div>

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
