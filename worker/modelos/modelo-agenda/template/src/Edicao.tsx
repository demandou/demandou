import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { temposDoTexto, useTempo } from "./anim";
import { ANTES, type Agenda, cortinaNoTempo, estadosDaPessoa, montarAgenda, ordenar, pessoaNoTempo, recorteDaCortina, trechoNoTempo } from "./agenda";
import { Anel } from "./componentes/Anel";
import { Blocos, QUEDA } from "./componentes/Blocos";
import { Cta } from "./componentes/Cta";
import { Folha } from "./componentes/Folha";
import { Frase, marcaNoTempo, tempoDaMarca } from "./componentes/Frase";
import { Gancho } from "./componentes/Gancho";
import { Guias } from "./componentes/Guias";
import { fraseNoTempo, Legendas } from "./componentes/Legendas";
import { duracaoDaConta, NumeroNaFolha } from "./componentes/Numero";
import { LinhaDaCortina } from "./componentes/NaFolha";
import { CartaoAbertura, CartaoDestaque, CartaoNumero, CartaoPergunta } from "./componentes/Peito";
import { NoPeito, Pessoa } from "./componentes/Pessoa";
import { Sem } from "./componentes/Sem";
import { Tarefas } from "./componentes/Tarefas";
import { ComparacaoNaFolha, DefinicaoNaFolha, GraficoNaFolha, PassosNaFolha, TopicosNaFolha } from "./componentes/Universais";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Palavra, Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: um "toc" grave quando um bloco assenta (a nota muda com a categoria), notas que
// sobem a cada ciclo copiado ou item que entra, um traço grave no risco, duas notas quando o dia se
// conclui, quando um número termina de contar e ao salvar.
const sons = (ag: Agenda, palavras: Palavra[]): Som[] => {
  const lista: Som[] = [];
  const nota = { foco: "sfx/assenta-foco.wav", pausa: "sfx/assenta-pausa.wav", longa: "sfx/assenta-longa.wav", outro: "sfx/assenta-pausa.wav" };
  const itens = (ems: number[], volume = 0.26) => ems.forEach((em, k) => lista.push({ em: em + 0.05, arquivo: `sfx/ciclo-${Math.min(3, k + 1)}.wav`, volume }));
  for (const b of ag.blocos) {
    const copia = b.id.includes("-c");
    if (copia) {
      if (b.ciclo) lista.push({ em: b.em + 0.05, arquivo: `sfx/ciclo-${Math.min(3, b.ciclo.n - 1)}.wav`, volume: 0.32 });
    } else lista.push({ em: b.em + QUEDA * 0.55, arquivo: nota[b.categoria], volume: 0.36 });
  }
  ag.ordem.forEach((m) => {
    if (m.tipo === "gancho" && m.resposta && ag.blocos.length) {
      // a fileira do dia acende logo depois da última palavra da resposta
      const tempos = temposDoTexto(m.resposta, palavras, m.de, m.ate);
      lista.push({ em: (tempos[tempos.length - 1] ?? m.ate - 0.6) + 0.1, arquivo: "sfx/acende.wav", volume: 0.26 });
    }
    if (m.tipo === "abertura" && ag.blocos.length) {
      const tempos = temposDoTexto(m.texto, palavras, m.em ?? m.de, m.ate, m.em ?? m.de);
      lista.push({ em: (tempos[tempos.length - 1] ?? m.ate - 0.6) + 0.15, arquivo: "sfx/acende.wav", volume: 0.24 });
    }
    if (m.tipo === "blocos" && m.sem) lista.push({ em: m.sem.riscaEm + 0.05, arquivo: "sfx/risca.wav", volume: 0.36 });
    if (m.tipo === "frase" && ag.blocos.length) lista.push({ em: tempoDaMarca(m, palavras).ate, arquivo: "sfx/conclui.wav", volume: 0.32 });
    if (m.tipo === "frase" && m.risco) lista.push({ em: (m.riscoEm ?? m.ate - 0.5) + 0.05, arquivo: "sfx/risca.wav", volume: 0.32 });
    if (m.tipo === "tarefas") m.itens.forEach((it, i) => it.feitoEm !== undefined && lista.push({ em: it.feitoEm, arquivo: `sfx/ciclo-${Math.min(3, i + 1)}.wav`, volume: 0.3 }));
    if (m.tipo === "cta") lista.push({ em: Math.max(m.acaoEm ?? (m.em ?? m.de) + 0.3, m.de + 0.4), arquivo: "sfx/salva.wav", volume: 0.32 });
    if (m.tipo === "destaque") lista.push({ em: m.em + 0.2, arquivo: m.nivel === "alerta" ? "sfx/assenta-longa.wav" : "sfx/assenta-foco.wav", volume: 0.34 });
    if (m.tipo === "numero") lista.push({ em: m.em + duracaoDaConta(m.valor), arquivo: "sfx/acende.wav", volume: 0.28 });
    if (m.tipo === "topicos" || m.tipo === "passos") itens(m.itens.map((it) => it.em));
    if (m.tipo === "pergunta" && m.opcoes) itens(m.opcoes.map((o) => o.em), 0.22);
    if (m.tipo === "comparacao") {
      lista.push({ em: m.lados[0].em + 0.2, arquivo: "sfx/assenta-pausa.wav", volume: 0.3 });
      lista.push({ em: m.lados[1].em + 0.2, arquivo: "sfx/assenta-foco.wav", volume: 0.3 });
      if (m.modo === "errado-certo") lista.push({ em: m.lados[1].em, arquivo: "sfx/risca.wav", volume: 0.3 });
    }
    if (m.tipo === "grafico") {
      if (m.dados?.length) itens(m.dados.map((d) => d.em), 0.24);
      else if (m.tendenciaEm !== undefined) lista.push({ em: m.tendenciaEm, arquivo: "sfx/acende.wav", volume: 0.26 });
    }
    if (m.tipo === "definicao") {
      lista.push({ em: m.em + 0.2, arquivo: "sfx/assenta-foco.wav", volume: 0.32 });
      lista.push({ em: m.significadoEm + 0.2, arquivo: "sfx/assenta-longa.wav", volume: 0.3 });
    }
  });
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.18) saida.push(s);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ag = useMemo(() => montarAgenda(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(ag, plano.cortesEm), [ag, plano.cortesEm]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const listaSons = useMemo(() => sons(ag, palavras), [ag, palavras]);
  const caixa = pessoaNoTempo(t, estados);
  const cortina = cortinaNoTempo(ag, t);
  const { atual } = trechoNoTempo(t, ag.trechos);

  const primeiraFolha = ag.trechos.find((tr) => tr.cena.folha > 0);
  const tituloEm = primeiraFolha ? Math.max(0, primeiraFolha.de - ANTES) : 0;

  // até quando cada momento fica na tela (a troca para o próximo começa ANTES disso)
  const fimDo = (i: number) => ag.trechos.find((tr) => tr.momento === i)?.ate ?? plano.duracao + 1;
  const vivo = (i: number) => {
    const m = ag.ordem[i];
    return t >= m.de - 0.6 && t <= fimDo(i) + 0.7;
  };

  // marcação da linha do dia: anda durante a frase; depois dela, o dia fica todo concluído
  const iFrase = ag.ordem.findIndex((m) => m.tipo === "frase");
  const fraseM = iFrase >= 0 ? ag.ordem[iFrase] : null;
  const marcaX =
    fraseM && fraseM.tipo === "frase" && t >= fraseM.de - 0.3 ? (atual.momento === iFrase ? marcaNoTempo(fraseM, palavras, t) : t > fraseM.de ? 1e4 : null) : null;
  // legenda dentro de uma caixa só quando ela é larga (em cima); nas estreitas ela não aparece
  const legendaNaCaixa = !!fraseNoTempo(frases, t) && caixa.w < 1000 && caixa.w >= 600;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
      {/* 1. a agenda (embaixo da pessoa: nada passa na frente do rosto) */}
      <Folha t={t} ag={ag} dia={plano.agenda?.dia ?? "Hoje"} tituloEm={tituloEm} />
      {/* a agenda de blocos; na cortina, a linha do "agora" a revela ou a leva */}
      <div style={{ position: "absolute", inset: 0, clipPath: recorteDaCortina(cortina, cortina ? (cortina.agendaSai ? "sai" : cortina.agendaEntra ? "entra" : null) : null) }}>
        <Blocos t={t} ag={ag} palavras={palavras} marcaX={marcaX} />
        <Anel t={t} ag={ag} />
        {ag.ordem.map((m, i) =>
          m.tipo === "blocos" && m.sem && vivo(i) ? <Sem key={`s${i}`} m={m} indice={i} t={t} ag={ag} fim={fimDo(i)} /> : null,
        )}
      </div>
      {ag.ordem.map((m, i) => {
        if (!vivo(i)) return null;
        // frase e tarefas também passam pela cortina quando trocam com outro momento na folha
        const papel = cortina ? (cortina.entrando === i ? "entra" : cortina.saindo === i ? "sai" : null) : null;
        if (m.tipo === "tarefas" || m.tipo === "frase")
          return (
            <div key={`f${i}`} style={{ position: "absolute", inset: 0, clipPath: recorteDaCortina(cortina, papel) }}>
              {m.tipo === "tarefas" ? (
                <Tarefas m={m} t={t} palavras={palavras} pessoa={ag.L.topo} fim={fimDo(i)} />
              ) : (
                <Frase m={m} t={t} palavras={palavras} ag={ag} fim={fimDo(i)} />
              )}
            </div>
          );
        if (ag.lugarDe[i] === "cheia") return null;
        const props = { i, t, palavras, ag };
        if (m.tipo === "topicos") return <TopicosNaFolha key={`u${i}`} m={m} {...props} />;
        if (m.tipo === "passos") return <PassosNaFolha key={`u${i}`} m={m} {...props} />;
        if (m.tipo === "numero") return <NumeroNaFolha key={`u${i}`} m={m} {...props} />;
        if (m.tipo === "comparacao") return <ComparacaoNaFolha key={`u${i}`} m={m} {...props} />;
        if (m.tipo === "grafico") return <GraficoNaFolha key={`u${i}`} m={m} {...props} />;
        if (m.tipo === "definicao") return <DefinicaoNaFolha key={`u${i}`} m={m} {...props} />;
        return null;
      })}

      <LinhaDaCortina ag={ag} t={t} />

      {/* 2. a pessoa: o compromisso de vídeo (a única cópia com som, montada o vídeo inteiro) */}
      <Pessoa
        caixa={caixa}
        video={plano.video}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        nome={plano.marca.nome}
        area={plano.marca.area}
        semEtiqueta={legendaNaCaixa}
      />

      {/* 3. cartões no peito (pessoa em tela cheia), presos ao vídeo dela nas trocas */}
      <NoPeito caixa={caixa} cheia={ag.L.cheia} rosto={plano.rosto} videoAltura={videoAltura}>
        {ag.ordem.map((m, i) => {
          if (!vivo(i) || ag.lugarDe[i] !== "cheia") return null;
          const props = { t, palavras, ag, fim: fimDo(i) };
          if (m.tipo === "gancho") return <Gancho key={`g${i}`} m={m} {...props} />;
          if (m.tipo === "abertura") return <CartaoAbertura key={`g${i}`} m={m} {...props} />;
          if (m.tipo === "destaque") return <CartaoDestaque key={`g${i}`} m={m} {...props} />;
          if (m.tipo === "pergunta") return <CartaoPergunta key={`g${i}`} m={m} {...props} />;
          if (m.tipo === "numero") return <CartaoNumero key={`g${i}`} m={m} {...props} />;
          if (m.tipo === "cta") return <Cta key={`c${i}`} m={m} t={t} palavras={palavras} ag={ag} concluido={iFrase >= 0 && iFrase < i} />;
          return null;
        })}
      </NoPeito>

      <Legendas frases={frases} t={t} pessoa={caixa} />

      {guias ? <Guias plano={plano} caixa={caixa} ag={ag} /> : null}

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
