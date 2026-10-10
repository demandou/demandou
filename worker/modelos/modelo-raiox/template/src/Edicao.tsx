import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { acender, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { CartaoDefinicao, CartaoDestaque, CartaoNumero, CartaoPergunta } from "./componentes/Cartoes";
import { Cta } from "./componentes/Cta";
import { Guias } from "./componentes/Guias";
import { Laudo } from "./componentes/Laudo";
import { Legendas } from "./componentes/Legendas";
import { MolduraAtras, MolduraFrente } from "./componentes/Moldura";
import { type InfoDosAjustes, Negatoscopio } from "./componentes/Negatoscopio";
import { PausaTopo } from "./componentes/PausaTopo";
import { TituloAjuste } from "./componentes/TituloAjuste";
import { estadosDaPessoa, filmesDoPlano, type Filme, gruposDoRaioX, inicioDaArte, ordenar, presencaDaMoldura, type Trecho, trechosDoPlano } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { ehDeChapa, ehPostura, type Ajuste, type Momento, type Parte, type Plano } from "./plano";
import { cor, H, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: o painel acendendo (um "vum" grave que cresce), a chapa encostando no painel
// (um toque surdo), um pulso grave quando a tensão acende, duas notas subindo quando ela apaga, uma
// nota curta quando a medida fecha, um tom que sobe quando a tela sobe ou o esqueleto se levanta e
// um acorde curto no fim. Nunca dois sons a menos de 0,45 s.
const sons = (plano: Plano, filmes: Filme[]): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "abertura") {
      if (m.tensaoEm !== undefined) lista.push({ em: m.tensaoEm, arquivo: "sfx/tensao.wav", volume: 0.5 });
      const primeiro = m.chamada?.itens?.[0];
      if (primeiro) lista.push({ em: primeiro.em, arquivo: "sfx/medida.wav", volume: 0.32 });
    }
    if (m.tipo === "ajuste" && m.itens?.length) {
      const primeira = m.itens.find((i) => i.tipo !== "ok");
      if (primeira) lista.push({ em: primeira.em, arquivo: "sfx/tensao.wav", volume: 0.42 });
      if (m.alinha) lista.push({ em: m.alinha.em + 0.05, arquivo: "sfx/alivio.wav", volume: 0.42 });
    }
    if (m.tipo === "topicos" || m.tipo === "passos") for (const it of m.itens) lista.push({ em: it.em, arquivo: "sfx/medida.wav", volume: 0.2 });
    if (m.tipo === "grafico") {
      if (m.dados?.length) for (const d of m.dados) lista.push({ em: d.em + 0.5, arquivo: "sfx/medida.wav", volume: 0.22 });
      else lista.push({ em: (m.tendenciaEm ?? m.de + 0.25) + 0.2, arquivo: "sfx/sobe.wav", volume: 0.28 });
    }
    if (m.tipo === "comparacao") {
      lista.push({ em: m.lados[1].em, arquivo: "sfx/medida.wav", volume: 0.26 });
      if (m.vencedor !== undefined) lista.push({ em: m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, arquivo: "sfx/alivio.wav", volume: 0.36 });
    }
    if (m.tipo === "numero") lista.push({ em: m.em + 1.05, arquivo: "sfx/medida.wav", volume: 0.34 });
    if (m.tipo === "destaque") lista.push(m.nivel === "alerta" ? { em: m.em, arquivo: "sfx/tensao.wav", volume: 0.45 } : { em: m.de + 0.1, arquivo: "sfx/chapa.wav", volume: 0.36 });
    if (m.tipo === "definicao") {
      lista.push({ em: m.de + 0.1, arquivo: "sfx/chapa.wav", volume: 0.36 });
      lista.push({ em: m.significadoEm, arquivo: "sfx/medida.wav", volume: 0.3 });
    }
    if (m.tipo === "frase" || m.tipo === "pergunta") lista.push({ em: m.de + 0.1, arquivo: "sfx/chapa.wav", volume: 0.36 });
    if (ehPostura(m)) {
      for (const p of m.passos) {
        if (p.tipo === "tensao" && p.apagaEm !== undefined) lista.push({ em: p.apagaEm + 0.05, arquivo: "sfx/alivio.wav", volume: 0.4 });
        if (p.tipo === "angulo") lista.push({ em: p.em + 0.72, arquivo: "sfx/medida.wav", volume: 0.36 });
        if (p.tipo === "corrige" && p.parte === "tela") lista.push({ em: p.em, arquivo: "sfx/sobe.wav", volume: 0.32 });
      }
    }
    if (m.tipo === "pausa") {
      if (m.levantaEm !== undefined) lista.push({ em: m.levantaEm, arquivo: "sfx/sobe.wav", volume: 0.32 });
      if (m.tempo) lista.push({ em: m.tempo.em + 0.85, arquivo: "sfx/medida.wav", volume: 0.34 });
    }
    if (m.tipo === "cta") lista.push({ em: m.de + 0.2, arquivo: "sfx/fim.wav", volume: 0.4 });
    if (m.tipo === "laudo") lista.push({ em: m.de + 0.1, arquivo: "sfx/chapa.wav", volume: 0.4 });
    if (m.tipo === "abertura" && m.tensaoEm === undefined && m.destaque) {
      // sem tensaoEm, os pontos acendem na palavra da dor
      const alvo = m.destaque.split(/\s+/)[0]?.toLowerCase().replace(/[^a-zà-ú0-9]/g, "");
      const w = plano.palavras.find((p) => p.em >= (m.em ?? m.de) - 0.3 && p.em < m.ate && p.w.toLowerCase().replace(/[^a-zà-ú0-9]/g, "") === alvo);
      if (w) lista.push({ em: w.em, arquivo: "sfx/tensao.wav", volume: 0.45 });
    }
  }
  filmes.forEach((f, i) => {
    const primeiro = i === 0 || filmes[i - 1].sai < f.entra;
    lista.push({ em: Math.max(0, f.entra - (primeiro ? 0.05 : 0)), arquivo: primeiro ? "sfx/acende.wav" : "sfx/chapa.wav", volume: 0.45 });
  });
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDe = (m: Plano["momentos"][number], plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

const partesDe = (a: Ajuste): Parte[] => (a.passos ?? []).flatMap((p) => (p.tipo === "corrige" ? [p.parte] : []));

const CARTOES: Momento["tipo"][] = ["abertura", "laudo", "frase", "cta", "numero", "destaque", "definicao", "pergunta"];

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const trechos = useMemo(() => trechosDoPlano(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, trechos), [plano, trechos]);
  const { filmes, acesas } = useMemo(() => filmesDoPlano(trechos), [trechos]);
  const listaSons = useMemo(() => sons(plano, filmes), [plano, filmes]);
  // só os ajustes de postura se corrigem de chapa em chapa
  const ajustes = useMemo(() => plano.momentos.filter((m): m is Ajuste => ehPostura(m)), [plano]);
  const chapas = useMemo(() => plano.momentos.filter(ehDeChapa), [plano]);

  // a postura vai sendo corrigida de chapa em chapa: numa chapa, o que só será corrigido nas
  // próximas ainda aparece errado
  const info: InfoDosAjustes = useMemo(() => {
    const ordem = filmes.map((f) => (f.trecho.tipo === "chapa" && f.trecho.momento.tipo === "ajuste" ? ajustes.indexOf(f.trecho.momento) : -1));
    return {
      erradas: (indice: number) => {
        const k = ordem[indice] ?? -1;
        if (k < 0) return [];
        const feitas = new Set(ajustes.slice(0, k + 1).flatMap(partesDe));
        return [...new Set(ajustes.slice(k + 1).flatMap(partesDe))].filter((p) => !feitas.has(p));
      },
      antebracoSegue: !ajustes.some((a) => partesDe(a).includes("antebraco")),
      grupos: gruposDoRaioX(plano),
    };
  }, [filmes, ajustes, plano]);

  const caixa = caixaNoTempo(t, estados);
  const presenca = presencaDaMoldura(caixa);
  const acesa = acesas.find((a) => t >= a.de - 0.02 && t <= a.ate);
  const luzMoldura = acesa ? acender(t, acesa.de) : 1;
  const legendaY = zona.topo + zona.altura + 24;
  const vistas = ajustes.map((a) => a.vista!);

  const blocos = trechos.map((tr: Trecho, i) => {
    const anterior = trechos[i - 1];
    const proximo = trechos[i + 1];
    const vemDeChapa = !!anterior && anterior.tipo !== "cheio";
    const vaiParaCheio = !proximo || proximo.tipo === "cheio";
    if (tr.tipo === "chapa") {
      return (
        <TituloAjuste
          key={`t-${i}`}
          trecho={tr}
          t={t}
          inicio={tr.de + (vemDeChapa ? 0.28 : 0.12)}
          fim={tr.ate + (vaiParaCheio ? 0.2 : 0.06)}
          palavras={plano.palavras}
          grupo={tr.momento.tipo === "ajuste" ? info.grupos.get(tr.momento) : undefined}
        />
      );
    }
    if (tr.tipo === "pausa") {
      return <PausaTopo key={`p-${i}`} m={tr.momento} t={t} inicio={tr.de + (vemDeChapa ? 0.3 : 0.15)} fim={tr.ate + (vaiParaCheio ? 0.2 : 0.06)} />;
    }
    return null;
  });

  // um cartão que encosta no seguinte sai inteiro antes de o próximo aparecer (nada de dois textos
  // um sobre o outro)
  const cartoes = plano.momentos.filter((m) => CARTOES.includes(m.tipo));
  const artes = cartoes.map((m) => {
    const proximo = plano.momentos.find((o) => o.de > m.de);
    const encosta = !!proximo && CARTOES.includes(proximo.tipo) && proximo.de - m.ate < 0.15;
    const veioDeCartao = cartoes.some((o) => o !== m && Math.abs(o.ate - m.de) < 0.15);
    const fim = encosta ? proximo!.de - 0.02 : fimDe(m, plano) + 0.06;
    const de = inicioDaArte(m.de, trechos) + (veioDeCartao ? 0.04 : 0);
    if (t < de - 0.05 || t > fim + 0.3) return null;
    const chave = `${m.tipo}-${m.de}`;
    const topo = zona.topo + 4;
    const comum = { t, topo, fim, palavras: plano.palavras };
    if (m.tipo === "abertura") return <Abertura key={chave} {...comum} m={{ ...m, de }} vistas={vistas} postura={ajustes.length > 0} />;
    if (m.tipo === "laudo" || m.tipo === "frase") return <Laudo key={chave} {...comum} m={{ ...m, de }} />;
    if (m.tipo === "cta") return <Cta key={chave} {...comum} m={{ ...m, de }} marca={plano.marca} chapas={chapas} grupos={info.grupos} />;
    if (m.tipo === "numero") return <CartaoNumero key={chave} t={t} topo={topo} fim={fim} m={{ ...m, de }} />;
    if (m.tipo === "destaque") return <CartaoDestaque key={chave} {...comum} m={{ ...m, de }} />;
    if (m.tipo === "definicao") return <CartaoDefinicao key={chave} {...comum} m={{ ...m, de }} />;
    if (m.tipo === "pergunta") return <CartaoPergunta key={chave} {...comum} m={{ ...m, de }} />;
    return null;
  });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${cor.parede} 0%, ${cor.sala} 70%)` }}>
      {/* 1. o negatoscópio com as chapas (por trás da pessoa: aparece quando ela encolhe) */}
      <Negatoscopio t={t} filmes={filmes} acesas={acesas} info={info} palavras={plano.palavras} />
      {/* 2. títulos dos ajustes e mostradores da pausa, na parede */}
      {blocos}
      {/* 3. a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <MolduraAtras caixa={caixa} presenca={presenca} luz={luzMoldura} />
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03)" />
      <MolduraFrente caixa={caixa} presenca={presenca} marca={plano.marca} />
      {/* 4. artes de quadro cheio, na altura do peito */}
      {artes}
      {/* legenda só com a pessoa em quadro cheio (com o negatoscópio aceso, os títulos já são a fala) */}
      {presenca < 0.3 ? <Legendas frases={frases} y={legendaY} /> : null}
      {guias ? <Guias plano={plano} zona={zona} legendaY={legendaY} /> : null}
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
