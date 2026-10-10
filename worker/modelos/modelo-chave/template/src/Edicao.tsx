import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from "remotion";
import { temposDoTexto, useTempo } from "./anim";
import { Batente } from "./componentes/Batente";
import { DuasEtiquetas } from "./componentes/Comparacao";
import { acoesDoCta, Cta, quandoFecha } from "./componentes/Cta";
import { EtiquetaDeDefinicao } from "./componentes/Definicao";
import { PlacaDeDestaque } from "./componentes/Destaque";
import { Recibo } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { PranchetaDePassos, QuadroVertical } from "./componentes/Listas";
import { EtiquetaDePreco } from "./componentes/Numero";
import { Painel } from "./componentes/Painel";
import { type Area, NaParede } from "./componentes/Parede";
import { EtiquetaDePergunta } from "./componentes/Pergunta";
import { Piso } from "./componentes/Piso";
import { Placa } from "./componentes/Placa";
import { Abertura, FolhaDaPorta } from "./componentes/Porta";
import { type EtiquetaDoQuadro, Quadro } from "./componentes/Quadro";
import { Vezes, VezesNaParede } from "./componentes/Vezes";
import {
  ANTES,
  type Arranjo,
  arranjoNoTempo,
  arranjos,
  cabecaNaGravacao,
  deslizes,
  ehItem,
  ehParede,
  espessuraDoBatente,
  estadosDaPessoa,
  fimDaParede,
  ordenar,
  presencaDoQuadro,
  TROCA,
} from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Item, Momento, Plano } from "./plano";
import { cor, H, MARGEM, PAREDE, PISO_Y, W, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Quando a etiqueta de um item acende no quadro: o `etiquetaEm` do plano ou a primeira palavra do título
const acendeEm = (m: Item, palavras: Plano["palavras"]) => m.etiquetaEm ?? temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1)[0] ?? m.de + 0.15;

// A porta do apartamento abre o vídeo quando o primeiro momento é a abertura (ou a porta do demo)
const portaDaAbertura = (plano: Plano) => {
  const porta = plano.momentos.find((m) => m.tipo === "porta");
  if (porta) return porta;
  const primeiro = plano.momentos[0];
  return primeiro && primeiro.tipo === "abertura" && primeiro.de < 0.6 ? primeiro : undefined;
};

// Som raro e tonal: a porta destrava (duas notas graves), cada etiqueta que chega no gancho dá um
// toque de madeira (subindo de altura a cada item), cada chave do chaveiro um toque curto, a conta
// fecha com duas notas, o "3×" com uma nota grave, o fechamento com um acorde curto e a chave que
// gira na fechadura com dois toques graves e secos. Os blocos universais usam os mesmos sons.
// Nunca dois sons a menos de 0,45 s.
const sons = (plano: Plano, itens: Item[]): Som[] => {
  const lista: Som[] = [];
  let chave = 0;
  let gancho = 0;
  const abre = portaDaAbertura(plano);
  const toqueDeChave = (em: number, volume = 0.3) => lista.push({ em: em + 0.06, arquivo: `sfx/chave-${(chave++ % 3) + 1}.wav`, volume });
  const toqueDeGancho = (em: number, volume = 0.4) => lista.push({ em: em + 0.05, arquivo: `sfx/gancho-${(gancho++ % 3) + 1}.wav`, volume });
  for (const m of plano.momentos) {
    if (m === abre) lista.push({ em: Math.max(0, m.de + 0.06), arquivo: "sfx/porta.wav", volume: 0.5 });
    if (m.tipo === "porta" && m.etiquetas) lista.push({ em: m.etiquetas.em + 0.05, arquivo: "sfx/etiqueta.wav", volume: 0.3 });
    if (m.tipo === "item") {
      const i = itens.indexOf(m);
      lista.push({ em: acendeEm(m, plano.palavras) + 0.05, arquivo: `sfx/gancho-${(i % 3) + 1}.wav`, volume: 0.45 });
      if (m.painel.tipo === "chaveiro") m.painel.chaves.forEach((c) => toqueDeChave(c.em, 0.32));
      if (m.painel.tipo === "conta" && m.painel.linhas.length) {
        const ultima = Math.max(...m.painel.linhas.map((l) => l.em));
        lista.push({ em: ultima + 0.5, arquivo: "sfx/soma.wav", volume: 0.34 });
      }
    }
    if (m.tipo === "vezes") lista.push({ em: m.numeroEm + 0.02, arquivo: "sfx/vezes.wav", volume: 0.45 });
    if (m.tipo === "topicos") m.itens.forEach((it) => toqueDeGancho(it.em));
    if (m.tipo === "passos") m.itens.forEach((it) => toqueDeChave(it.em));
    if (m.tipo === "numero") lista.push({ em: m.em + Math.min(1.3, Math.max(0.6, (m.ate - m.em) * 0.4)), arquivo: "sfx/vezes.wav", volume: 0.42 });
    if (m.tipo === "comparacao") {
      m.lados.forEach((l) => toqueDeGancho(l.em));
      if (m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm + 0.05, arquivo: "sfx/soma.wav", volume: 0.34 });
    }
    if (m.tipo === "grafico") {
      if (m.dados?.length) m.dados.forEach((d) => toqueDeChave(d.em, 0.28));
      else lista.push({ em: (m.tendenciaEm ?? m.de + 0.3) + 0.05, arquivo: "sfx/etiqueta.wav", volume: 0.3 });
    }
    if (m.tipo === "destaque") lista.push({ em: m.em + 0.02, arquivo: "sfx/vezes.wav", volume: m.nivel === "alerta" ? 0.42 : 0.36 });
    if (m.tipo === "definicao") lista.push({ em: m.significadoEm + 0.05, arquivo: "sfx/etiqueta.wav", volume: 0.3 });
    if (m.tipo === "pergunta") (m.opcoes ?? []).forEach((o) => toqueDeChave(o.em, 0.26));
    if (m.tipo === "cta") {
      lista.push({ em: (acoesDoCta(m)[0]?.em ?? m.de) + 0.05, arquivo: "sfx/fim.wav", volume: 0.4 });
      if (plano.marca.nome) lista.push({ em: quandoFecha(m, plano.palavras) + 0.56, arquivo: "sfx/tranca.wav", volume: 0.42 });
    }
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Arte no peito (pessoa em quadro cheio): quando dois desses momentos se seguem, a pessoa não muda de
// lugar; a arte que sai desce e some inteira antes de a nova entrar (sem dupla exposição).
const PEITO = new Set(["porta", "abertura", "placa", "frase", "destaque", "definicao", "pergunta", "cta"]);
// Vindo da porta de baixo (ou da porta no alto), a arte do peito só entra quando a pessoa já cresceu:
// antes disso ela cairia por cima do rosto, dentro da porta pequena.
const trocasNoPeito = (plano: Plano, arranjo: Map<Momento, Arranjo>) => {
  const mapa = new Map<Momento, { fim?: number; entrada?: number }>();
  plano.momentos.forEach((m, i) => {
    const prox = plano.momentos[i + 1];
    if (!prox || prox.de - m.ate > 0.3) return;
    // indo para uma porta pequena, a arte do peito sai um pouco antes (não fica sobre o rosto encolhendo)
    if (PEITO.has(m.tipo) && (arranjo.get(prox) === "embaixo" || arranjo.get(prox) === "faixa")) mapa.set(m, { ...mapa.get(m), fim: prox.de - ANTES - 0.1 });
    if (!PEITO.has(prox.tipo)) return;
    if (PEITO.has(m.tipo)) {
      mapa.set(m, { ...mapa.get(m), fim: prox.de - 0.34 });
      mapa.set(prox, { ...mapa.get(prox), entrada: prox.de - 0.02 });
    } else if (arranjo.get(m) === "embaixo" || arranjo.get(m) === "faixa") {
      mapa.set(prox, { ...mapa.get(prox), entrada: prox.de - ANTES + TROCA * 0.8 });
    }
  });
  return mapa;
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate - ANTES;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => {
    const p = ordenar(planoOriginal);
    return { ...p, palavras: corrigirPalavras(p.palavras, p.correcoes) };
  }, [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(planoOriginal), [planoOriginal]);
  const mapa = useMemo(() => arranjos(plano), [plano]);
  const movimentos = useMemo(() => deslizes(plano, mapa), [plano, mapa]);
  const estados = useMemo(() => estadosDaPessoa(plano, mapa), [plano, mapa]);
  const itens = useMemo(() => plano.momentos.filter(ehItem), [plano]);
  const etiquetas: EtiquetaDoQuadro[] = useMemo(
    () => itens.map((m) => ({ item: m, em: acendeEm(m, plano.palavras), fim: m.ate - ANTES })),
    [itens, plano.palavras],
  );
  const listaSons = useMemo(() => sons(plano, itens), [plano, itens]);
  const fimParede = useMemo(() => fimDaParede(plano), [plano]);
  const queixo = useMemo(() => cabecaNaGravacao(plano).queixo, [plano]);
  const peito = useMemo(() => trocasNoPeito(plano, mapa), [plano, mapa]);
  const areaParede: Area = { x: PAREDE.x, y: PAREDE.topo, w: PAREDE.w, h: fimParede - PAREDE.topo };

  const caixa = caixaNoTempo(t, estados);
  const presenca = presencaDoQuadro(t, plano);
  const abre = portaDaAbertura(plano);
  const numero = abre?.tipo === "porta" || abre?.tipo === "abertura" ? abre.numero : undefined;
  const espessura = espessuraDoBatente(caixa);
  const placa = Math.min(1, Math.max(0, (1000 - caixa.w) / 200));
  const ativos = plano.momentos.filter((m) => t >= m.de - ANTES - 0.05 && t <= fimDe(m, plano) + 0.4);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.parede }}>
      {/* 1. a parede de cimento queimado */}
      <Img src={staticFile("parede.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <Piso />

      {/* 2. o quadro de chaves, os painéis dos itens e os blocos de parede (por trás da pessoa) */}
      <Quadro etiquetas={etiquetas} presenca={presenca} t={t} />
      {itens.map((m, i) => {
        if (!ativos.includes(m)) return null;
        const arranjo = mapa.get(m) ?? "embaixo";
        return (
          <Painel
            key={`painel-${m.de}`}
            m={m}
            arranjo={arranjo}
            palavras={plano.palavras}
            t={t}
            entra={m.de - ANTES}
            sai={fimDe(m, plano)}
            movimento={movimentos.get(m) ?? { entra: "esquerda", sai: "direita" }}
            numero={i + 1}
            total={itens.length}
            fimParede={fimParede}
          />
        );
      })}
      {ativos.map((m) => {
        const naParede = ehParede(m) || (m.tipo === "vezes" && mapa.get(m) === "embaixo");
        if (!naParede) return null;
        const props = { palavras: plano.palavras, t, w: areaParede.w, h: areaParede.h };
        return (
          <NaParede
            key={`parede-${m.tipo}-${m.de}`}
            area={areaParede}
            t={t}
            entra={m.de - ANTES}
            sai={fimDe(m, plano)}
            movimento={movimentos.get(m) ?? { entra: "esquerda", sai: "esquerda" }}
          >
            {m.tipo === "topicos" ? <QuadroVertical m={m} {...props} /> : null}
            {m.tipo === "passos" ? <PranchetaDePassos m={m} {...props} /> : null}
            {m.tipo === "numero" ? <EtiquetaDePreco m={m} {...props} /> : null}
            {m.tipo === "comparacao" ? <DuasEtiquetas m={m} {...props} /> : null}
            {m.tipo === "grafico" ? <Recibo m={m} {...props} /> : null}
            {m.tipo === "vezes" ? <VezesNaParede m={m} {...props} /> : null}
          </NaParede>
        );
      })}
      {ativos.map((m) =>
        m.tipo === "vezes" && mapa.get(m) === "deslocado" ? (
          <Vezes
            key={`vezes-${m.de}`}
            m={m}
            palavras={plano.palavras}
            t={t}
            largura={412 - MARGEM - 24}
            entra={m.de - ANTES}
            fim={fimDe(m, plano)}
            movimento={movimentos.get(m) ?? { entra: "direita", sai: "esquerda" }}
          />
        ) : null,
      )}

      {/* 3. a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      {abre && t < abre.de + 1.2 ? <FolhaDaPorta numero={numero} de={abre.de} t={t} espessura={espessura} /> : null}
      <Batente caixa={caixa} espessura={espessura} numero={numero} placa={placa} base={caixa.y + caixa.h < PISO_Y - 4} />

      {/* 4. artes no peito, com a pessoa em quadro cheio — recortadas pela porta dela: chegam e saem
          junto com ela e nunca ficam soltas na parede durante uma troca */}
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(${caixa.y}px ${W - caixa.x - caixa.w}px ${H - caixa.y - caixa.h}px ${caixa.x}px)` }}>
        {ativos.map((m) => {
          const chave = `${m.tipo}-${m.de}`;
          const troca = peito.get(m);
          const fim = troca?.fim ?? fimDe(m, plano) + 0.06;
          const comum = { palavras: plano.palavras, t, topo: zona.topo, fim, entradaMin: troca?.entrada };
          switch (m.tipo) {
            case "porta":
            case "abertura":
              return <Abertura key={chave} m={m} {...comum} />;
            case "placa":
            case "frase":
              return <Placa key={chave} m={m} {...comum} />;
            case "destaque":
              return <PlacaDeDestaque key={chave} m={m} {...comum} />;
            case "definicao":
              return <EtiquetaDeDefinicao key={chave} m={m} {...comum} />;
            case "pergunta":
              return <EtiquetaDePergunta key={chave} m={m} {...comum} />;
            case "cta":
              return <Cta key={chave} m={m} marca={plano.marca} {...comum} centro={caixa.x + caixa.w / 2} queixo={queixo} />;
            default:
              return null;
          }
        })}
      </div>

      {/* com a pessoa na porta de baixo, a legenda cairia no rosto: ela só aparece nas outras gramáticas */}
      {arranjoNoTempo(t, plano, mapa) === "embaixo" ? null : <Legendas frases={frases} />}
      {guias ? <Guias plano={plano} topo={zona.topo} /> : null}

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
