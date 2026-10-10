import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, prog, useTempo } from "./anim";
import { camera, comLegendaPadrao, descida, escuridao, ordenar, semSobreposicao } from "./camera";
import { Guias } from "./componentes/Guias";
import { Janela, caixaDaJanela } from "./componentes/Janela";
import { Medidor, Mundo } from "./componentes/Mundo";
import { AberturaBloco, ComparacaoBloco, CtaBloco, DefinicaoBloco, DestaqueBloco, FraseBloco, GraficoBloco, ListaBloco, NumeroBloco, PerguntaBloco } from "./componentes/Placas";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais e raros, bem abaixo da voz: o mergulho, o sonar quando o nível aparece, o tique dos itens.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume = 0.2) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "iceberg":
        m.niveis.forEach((n, k) => {
          s(descida(m, k) + 0.05, "mergulho", 0.16);
          s(n.em, "sonar", 0.2);
          (n.detalhes ?? []).forEach((d) => s(d.em, "tique", 0.14));
        });
        break;
      case "abertura":
        s(m.em ?? m.de, "bolha", 0.2);
        break;
      case "destaque":
        s(m.em, m.nivel === "alerta" ? "alerta" : "sonar", 0.2);
        break;
      case "numero":
        s(m.em, "sonar", 0.2);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em, "tique", 0.16));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em, "tique", 0.16));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.8, "sonar", 0.2);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "tique", 0.14));
        if (!m.dados?.length) s(m.tendenciaEm ?? m.de, "bolha", 0.18);
        break;
      case "definicao":
        s(m.em, "sonar", 0.2);
        s(m.significadoEm, "tique", 0.14);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "tique", 0.16));
        break;
      case "cta":
        s((m.em ?? m.de) + 0.05, "fim", 0.2);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
};

const bloco = (m: Momento, t: number, fim: number) => {
  const k = `${m.tipo}-${m.de}`;
  switch (m.tipo) {
    case "abertura":
      return <AberturaBloco key={k} m={m} t={t} fim={fim} />;
    case "topicos":
    case "passos":
      return <ListaBloco key={k} m={m} t={t} fim={fim} />;
    case "numero":
      return <NumeroBloco key={k} m={m} t={t} fim={fim} />;
    case "comparacao":
      return <ComparacaoBloco key={k} m={m} t={t} fim={fim} />;
    case "grafico":
      return <GraficoBloco key={k} m={m} t={t} fim={fim} />;
    case "destaque":
      return <DestaqueBloco key={k} m={m} t={t} fim={fim} />;
    case "definicao":
      return <DefinicaoBloco key={k} m={m} t={t} fim={fim} />;
    case "frase":
      return <FraseBloco key={k} m={m} t={t} fim={fim} />;
    case "pergunta":
      return <PerguntaBloco key={k} m={m} t={t} fim={fim} />;
    case "cta":
      return <CtaBloco key={k} m={m} t={t} fim={fim} />;
    default:
      return null;
  }
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => semSobreposicao(bruto), [bruto]);
  const frases = useMemo(() => montarFrases(comLegendaPadrao(plano)), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const cam = camera(plano, t);
  const escuro = escuridao(plano, cam);
  const ordem = useMemo(() => ordenar(plano), [plano]);
  const fimDe = (m: Momento, i: number) => (!ordem[i + 1] && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3) ? plano.duracao + 1 : m.ate);
  const ativos = ordem.map((m, i) => ({ m, fim: fimDe(m, i) })).filter(({ m, fim }) => m.tipo !== "iceberg" && t >= m.de - 0.05 && t < fim + 0.32);
  // a água escurece mais um pouco enquanto uma placa está na tela, para o texto da placa respirar
  const placa = Math.max(0, ...ativos.filter(({ m }) => m.tipo !== "abertura").map(({ m, fim }) => Math.min(prog(t, m.de - 0.05, 0.3), 1 - prog(t, fim, 0.3))));

  return (
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.abismo }}>
        <Mundo plano={plano} t={t} cam={cam} />
        <AbsoluteFill style={{ background: `rgba(2,11,25,${0.34 * placa})`, pointerEvents: "none" }} />
        <Medidor plano={plano} t={t} cam={cam} />
        <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>{ativos.map(({ m, fim }) => bloco(m, t, fim))}</div>
        <Janela plano={plano} t={t} escuro={escuro} frases={frases} />
        {guias ? <Guias plano={plano} caixa={caixaDaJanela(plano, t)} t={t} /> : null}
        {plano.sfx === false
          ? null
          : listaDeSons.map((s) => (
              <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
                <Audio src={staticFile(s.arquivo)} volume={s.volume} />
              </Sequence>
            ))}
      </AbsoluteFill>
    </PalavrasCtx.Provider>
  );
};
