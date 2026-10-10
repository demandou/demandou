// O modelo Quiz: programa de perguntas de TV, claro e refinado. Em cima, o PAINEL (pergunta,
// alternativas, anel de contagem, revelação, fato); embaixo, a pessoa numa moldura larga.
// Só cortes secos; a cor da pessoa nunca muda.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Cenario, SombraDaMoldura, Tarja } from "./componentes/Estudio";
import { Fato, Revelacao } from "./componentes/Fato";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { fimDoVoo, Painel } from "./componentes/Quiz";
import { ordenar, prepararLayout } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Fato as TFato, Momento, Plano, Quiz as TQuiz } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: nota de marimba nas alternativas, "toc" na contagem,
// duas notas subindo na revelação, um "pop" grave nos cartões que entram.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume: number) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "quiz":
        m.opcoes.forEach((o, i) => s(o.em, `opcao-${(i % 4) + 1}`, 0.18));
        (m.contagem ?? []).forEach((c) => s(c.em, "tique", 0.3));
        if (!m.contagem?.length && m.relogioEm !== undefined) s(m.relogioEm, "tique", 0.26);
        s(m.revelaEm, "acerto", 0.36);
        break;
      case "revelacao":
        (m.contagem ?? []).forEach((c) => s(c.em, "tique", 0.3));
        s(m.revelaEm, "vira", 0.32);
        break;
      case "fato":
        if (m.destaque) s(m.destaqueEm ?? (m.em ?? m.de) + 0.5, "entra", 0.24);
        break;
      case "abertura":
        s(m.em ?? m.de, "entra", 0.2);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => s(it.em, `opcao-${(i % 4) + 1}`, 0.16));
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o, i) => s(o.em, `opcao-${(i % 4) + 1}`, 0.16));
        break;
      case "comparacao":
        m.lados.forEach((l, i) => s(l.em, `opcao-${i + 1}`, 0.18));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "acerto", 0.3);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d, i) => s(d.em, `opcao-${(i % 4) + 1}`, 0.14));
        break;
      case "numero":
      case "destaque":
      case "definicao":
        s(m.em, "entra", 0.24);
        break;
      case "cta":
        s(m.em ?? m.de, "entra", 0.22);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.1);
};

// Um `fato` que começa onde um `quiz` termina continua o painel: a certa vira a faixa da resposta.
const ligacoes = (plano: Plano) => {
  const ordem = ordenar(plano);
  const fatoDoQuiz = new Map<TQuiz, TFato>();
  const ligados = new Set<TFato>();
  ordem.forEach((m, i) => {
    const prox = ordem[i + 1];
    if (m.tipo === "quiz" && prox?.tipo === "fato" && Math.abs(prox.de - m.ate) <= 0.25) {
      fatoDoQuiz.set(m, prox);
      ligados.add(prox);
    }
  });
  return { fatoDoQuiz, ligados };
};

// A tarja do apresentador fica na faixa de baixo do painel (logo acima da moldura) nos primeiros
// ~3,4 s, e sai antes de qualquer coisa ocupar essa faixa: as alternativas de um quiz/pergunta, ou
// um bloco que enche o painel (só a abertura e a pergunta de um quiz deixam a faixa livre).
const fimDaTarja = (plano: Plano) => {
  let fim = Math.min(3.4, plano.duracao);
  for (const m of ordenar(plano)) {
    if (m.de >= fim) break;
    if (m.tipo === "abertura") continue;
    if ((m.tipo === "quiz" || m.tipo === "pergunta") && m.opcoes?.length) fim = Math.min(fim, m.opcoes[0].em - 0.3);
    else if (m.tipo !== "quiz" && m.tipo !== "pergunta") fim = Math.min(fim, m.de);
  }
  return Math.max(0.2, fim);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ordem = useMemo(() => ordenar(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(plano).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const { fatoDoQuiz, ligados } = useMemo(() => ligacoes(plano), [plano]);
  const caixa = lay.caixa(t);

  // cada momento sai quando o próximo entra (o último fica até o fim do vídeo)
  const fimDe = (m: Momento, i: number) => {
    const prox = ordem[i + 1];
    if (!prox) return m.ate >= plano.duracao - 0.4 || m.tipo === "cta" ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };
  // a tarja do apresentador: nos primeiros segundos (até o primeiro quiz/painel começar a revelar)
  const fimTarja = useMemo(() => fimDaTarja(plano), [plano]);
  const quizDoFato = (f: TFato) => [...fatoDoQuiz.entries()].find(([, x]) => x === f)?.[0];
  const ultimoQuizAntes = (de: number) => [...ordem].reverse().find((x) => x.tipo === "quiz" && x.de < de) as TQuiz | undefined;

  const desenhar = (m: Momento, i: number) => {
    const fim = fimDe(m, i);
    if (t < m.de - 0.1 || t > (fatoDoQuiz.get(m as TQuiz)?.ate ?? fim) + 0.3) return null;
    const k = `${m.tipo}-${m.de}`;
    const p = { t, plano, fim };
    switch (m.tipo) {
      case "quiz": {
        const fato = fatoDoQuiz.get(m) ?? null;
        return (
          <Painel
            key={k}
            t={t}
            plano={plano}
            d={{ texto: m.texto, em: m.em ?? m.de, rotulo: m.rotulo, modo: m.modo, opcoes: m.opcoes, contagem: m.contagem, relogioEm: m.relogioEm, certa: m.certa, revelaEm: m.revelaEm }}
            de={m.de}
            ate={fim}
            fato={fato ? { ...fato, ate: fimDe(fato, ordem.indexOf(fato)) } : null}
          />
        );
      }
      case "fato":
        return <Fato key={k} m={m} {...p} ligado={ligados.has(m)} entraEm={quizDoFato(m) ? fimDoVoo(quizDoFato(m)?.revelaEm, m.de) : undefined} />;
      case "revelacao":
        return <Revelacao key={k} m={m} {...p} />;
      case "abertura":
        return <Abertura key={k} m={m} {...p} />;
      case "topicos":
      case "passos":
        return <Lista key={k} m={m} {...p} />;
      case "numero":
        return <Numero key={k} m={m} {...p} />;
      case "comparacao":
        return <Comparacao key={k} m={m} {...p} />;
      case "grafico":
        return <Grafico key={k} m={m} {...p} />;
      case "destaque":
        return <Destaque key={k} m={m} {...p} />;
      case "definicao":
        return <Definicao key={k} m={m} {...p} />;
      case "frase":
        return <Frase key={k} m={m} {...p} />;
      case "pergunta":
        return <Pergunta key={k} m={m} {...p} />;
      case "cta":
        return <Cta key={k} m={m} {...p} quiz={ultimoQuizAntes(m.de) ?? null} />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.estudio }}>
      <Cenario t={t} />
      <SombraDaMoldura />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <Tarja t={t} plano={plano} de={0.2} ate={fimTarja} />
      {/* o fato ligado a um quiz fica por baixo: a resposta certa voa por cima dele até o alto */}
      {ordem.map((m, i) => (m.tipo === "fato" && ligados.has(m) ? desenhar(m, i) : null))}
      {ordem.map((m, i) => (m.tipo === "fato" && ligados.has(m) ? null : desenhar(m, i)))}
      <Legenda t={t} frases={frases} bloqueios={bloqueios} y={lay.yLegenda} />
      {guias ? <Guias plano={plano} caixa={caixa} t={t} lay={lay} /> : null}
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
