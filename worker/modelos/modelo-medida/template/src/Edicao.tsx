import { Audio } from "@remotion/media";
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import {
  BlocoComparacao,
  BlocoCta,
  BlocoDefinicao,
  BlocoDestaque,
  BlocoFrase,
  BlocoNumero,
  BlocoPassos,
  BlocoPergunta,
  BlocoTopicos,
} from "./componentes/Blocos";
import { BlocoGrafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Pessoa } from "./componentes/Pessoa";
import { AberturaCheia, Tarja, TituloVirada } from "./componentes/Titulos";
import { alturaDaLegenda, papelEm, usaPapel } from "./layout";
import { montarFrases } from "./motor/frases";
import { MedidaCena } from "./palco/MedidaCena";
import { montarCena } from "./palco/cena";
import type { Momento, Plano } from "./plano";
import { EASE_IN, fontesCarregadas, prog, useTempo } from "./tema";

// Só desenha depois que as fontes carregaram: os blocos medem o texto com a própria fonte.
let fontesProntas = false;
fontesCarregadas.then(() => {
  fontesProntas = true;
});
const useFontes = () => {
  const [prontas, setProntas] = useState(fontesProntas);
  const [espera] = useState(() => (fontesProntas ? null : delayRender("Carregando as fontes")));
  useEffect(() => {
    if (prontas) return;
    fontesCarregadas.then(() => {
      setProntas(true);
      if (espera !== null) continueRender(espera);
    });
  }, [prontas, espera]);
  return prontas;
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Um momento nunca invade o seguinte.
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

/** bloco universal no papel, com a saída que cruza com o próximo */
const NoPapel: React.FC<{ m: Momento; fim: number; children: React.ReactNode }> = ({ m, fim, children }) => {
  const t = useTempo();
  if (t < m.de - 0.12 || t > fim + 0.3) return null;
  const sai = prog(t, fim - 0.02, fim + 0.26, EASE_IN);
  // empurrão lento: nada fica parado
  const vivo = 1 + 0.025 * prog(t, m.de, fim, (x) => x);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, transform: `translateY(${-sai * 24}px) scale(${vivo})`, transformOrigin: "540px 480px", filter: sai > 0 ? `blur(${sai * 6}px)` : undefined }}>
      {children}
    </div>
  );
};

const renderMomento = (m: Momento, plano: Plano, fim: number) => {
  const p = plano.palavras;
  switch (m.tipo) {
    case "virada":
      return <TituloVirada m={m} plano={plano} />;
    case "medida":
    case "objeto":
      return <MedidaCena m={m} plano={plano} fim={fim} />;
    case "abertura":
      return usaPapel(m, plano) ? (
        <NoPapel m={m} fim={fim}>
          <BlocoFrase m={m} palavras={p} />
        </NoPapel>
      ) : (
        <AberturaCheia m={m} plano={plano} palavras={p} fim={fim} />
      );
    case "topicos":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoTopicos titulo={m.titulo} itens={m.itens} de={m.de} />
        </NoPapel>
      );
    case "passos":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoPassos titulo={m.titulo} itens={m.itens} de={m.de} />
        </NoPapel>
      );
    case "numero":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoNumero m={m} />
        </NoPapel>
      );
    case "comparacao":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoComparacao m={m} />
        </NoPapel>
      );
    case "grafico":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoGrafico m={m} />
        </NoPapel>
      );
    case "destaque":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoDestaque m={m} palavras={p} />
        </NoPapel>
      );
    case "definicao":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoDefinicao m={m} />
        </NoPapel>
      );
    case "frase":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoFrase m={m} palavras={p} risco={m.risco} riscoEm={m.riscoEm} />
        </NoPapel>
      );
    case "pergunta":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoPergunta m={m} palavras={p} />
        </NoPapel>
      );
    case "cta":
      return (
        <NoPapel m={m} fim={fim}>
          <BlocoCta m={m} palavras={p} fim={fim} />
        </NoPapel>
      );
  }
};

// Sons tonais, raros e baixos. Nada de sino, nada de ruído.
type Som = { em: number; arquivo: string; volume: number; rate?: number };
const sons = (plano: Plano): Som[] => {
  const l: Som[] = [];
  const add = (em: number, arquivo: string, volume: number, rate?: number) => l.push({ em, arquivo: `sfx/${arquivo}.wav`, volume, rate });
  for (const m of plano.momentos) {
    switch (m.tipo) {
      case "virada":
        add(m.trocaEm - 0.25, "swap_crystal", 0.35);
        break;
      case "medida":
      case "objeto": {
        const c = montarCena(plano, m);
        if (m.objeto) add(m.objeto.em - 0.04, "sobe", 0.22);
        if (m.objeto?.forma === "lata") {
          add(c.T.tem + 0.6, "lata_abre", 0.4);
          add(c.T.tem + 0.64, "fizz", 0.16);
        }
        if (m.tipo === "objeto") m.fatos.forEach((f) => add(f.em, "tag_set", 0.22));
        if (m.tipo === "medida") {
          if (!m.objeto && m.quantidade) add(m.quantidade.em, "tone1", 0.26);
          add(m.unidades.em + 0.1, "sache1", 0.32, m.unidades.forma === "moeda" ? 1.35 : m.unidades.forma === "cubo" ? 0.9 : 1);
          if (c.despeja) add(c.T.uma2 + 0.3, "despeja", 0.3);
          if (m.referencia && !m.passou) add(m.referencia.em, "tone3", 0.24);
          if (c.passa) add(c.T.ultra - 0.02, "limite", 0.22);
        }
        break;
      }
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => add(it.em, m.tipo === "topicos" ? "marimba" : `tone${(i % 4) + 1}`, 0.28, m.tipo === "topicos" ? 1 + i * 0.06 : 1));
        break;
      case "numero":
        add(m.em, "tag_set", 0.28);
        break;
      case "comparacao":
        m.lados.forEach((ld) => add(ld.em, "tone2", 0.26));
        if (m.vencedor !== undefined || m.modo === "errado-certo" || m.modo === "antes-depois") add(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "affirm", 0.26);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d, i) => add(d.em, `tone${(i % 4) + 1}`, 0.26));
        if (!m.dados?.length) add(m.tendenciaEm ?? m.de + 0.2, "tone1", 0.26);
        break;
      case "destaque":
        add(m.em, m.nivel === "alerta" ? "limite" : "tone3", m.nivel === "alerta" ? 0.22 : 0.26);
        break;
      case "definicao":
        add(m.em, "tag_set", 0.28);
        break;
      case "pergunta":
        m.opcoes?.forEach((o) => add(o.em, "tone4", 0.26));
        break;
      case "cta":
        add(m.de + 0.55, "affirm", 0.3);
        break;
    }
  }
  l.sort((a, b) => a.em - b.em);
  return l.filter((s, i) => s.em >= 0 && (i === 0 || s.em - l[i - 1].em >= 0.25));
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: original, guias }) => {
  const fontes = useFontes();
  const plano = useMemo(() => comCapa(original), [original]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  // a legenda sempre começa um bloco novo quando o papel entra
  const quebras = useMemo(() => plano.momentos.map((m) => papelEm(m, plano)).filter((x): x is number => x !== null), [plano]);
  const nasMaos = plano.momentos.some((m) => (m.tipo === "medida" || m.tipo === "objeto") && m.objeto && t >= m.objeto.em - 0.18 && t < montarCena(plano, m).T.tem - 0.01);
  const legendaY = alturaDaLegenda(plano, t, nasMaos);
  const lista = useMemo(() => sons(plano), [plano]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0f1411" }}>
      <Pessoa plano={plano} />
      {fontes
        ? plano.momentos.map((m) => (
            <React.Fragment key={`${m.tipo}-${m.de}`}>{renderMomento(m, plano, fimDoMomento(m, plano))}</React.Fragment>
          ))
        : null}
      {fontes ? <Tarja plano={plano} /> : null}
      {fontes ? <Legenda frases={frases} y={legendaY} quebras={quebras} /> : null}
      {guias ? <Guias plano={plano} legendaY={legendaY} /> : null}
      {plano.sfx === false
        ? null
        : lista.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} playbackRate={s.rate ?? 1} />
            </Sequence>
          ))}
      {plano.trilha ? <Audio src={staticFile(plano.trilha)} volume={plano.trilhaVolume ?? 0.12} loop /> : null}
    </AbsoluteFill>
  );
};
