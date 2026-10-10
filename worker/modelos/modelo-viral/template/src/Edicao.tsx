import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, useTempo } from "./anim";
import { Corte, Pop } from "./componentes/Assinatura";
import { Barra } from "./componentes/Barra";
import { Comparacao } from "./componentes/Comparacao";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Lista } from "./componentes/Listas";
import { Abertura, Cta, Destaque, Frase, Numero } from "./componentes/Peito";
import { Definicao, Pergunta } from "./componentes/Topo";
import { comLegendaPadrao, ordenar, prepararLayout, semSobreposicao, vizinhanca, type Vizinhanca } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import { pessoaEmbaixo, type Momento, type Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais e raros: a imagem que corta, o cartão que salta, o carimbo do destaque, o fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume = 0.36) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "corte":
        s(m.de, "corte", 0.42);
        break;
      case "pop":
        s(m.em ?? m.de, "pop", 0.4);
        break;
      case "abertura":
        s(m.em ?? m.de, "impacto", 0.36);
        break;
      case "destaque":
        s(m.em, m.nivel === "alerta" ? "alerta" : "impacto", 0.38);
        break;
      case "numero":
        s(m.em, "impacto", 0.34);
        s(m.em + 0.9, "tique", 0.3);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em, "tique", 0.28));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em, "pop", 0.32));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "impacto", 0.32);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "tique", 0.28));
        if (!m.dados?.length) s(m.tendenciaEm ?? m.de, "pop", 0.3);
        break;
      case "definicao":
        s(m.em, "impacto", 0.32);
        s(m.significadoEm, "tique", 0.28);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "tique", 0.28));
        break;
      case "frase":
        s(m.de, "pop", 0.28);
        break;
      case "cta":
        s((m.em ?? m.de) + 0.05, "fim", 0.34);
        break;
    }
  }
  // dois sons colados viram um só
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => semSobreposicao(bruto), [bruto]);
  const frases = useMemo(() => montarFrases(comLegendaPadrao(plano)), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(comLegendaPadrao(plano)).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const viz = useMemo(() => new Map<Momento, Vizinhanca>(plano.momentos.map((m) => [m, vizinhanca(m, plano)])), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const indicePop = useMemo(() => new Map(ordenar(plano).filter((m) => m.tipo === "pop").map((m, i) => [m, i])), [plano]);

  const caixa = lay.caixa(t);
  const p = lay.embaixo(t);
  const videoAltura = plano.videoAltura ?? 1920;
  const ativos = ordenar(plano).filter((m) => t >= m.de - 0.6 && t < (viz.get(m)?.fim ?? m.ate));

  // textos do peito logo depois de uma troca: entram quando a pessoa já voltou para o quadro cheio
  const adiados = useMemo(
    () =>
      new Map<Momento, Momento>(
        plano.momentos.map((m) => {
          if (pessoaEmbaixo(m) || m.tipo === "corte") return [m, m];
          const livre = lay.livreDesde(m.de);
          if (livre <= m.de + 0.01) return [m, m];
          const x = { ...m } as Momento & { em?: number; rotuloEm?: number; detalheEm?: number };
          if (typeof x.em === "number") x.em = Math.max(x.em, livre);
          else if (m.tipo === "abertura" || m.tipo === "frase" || m.tipo === "cta") x.em = livre;
          if (typeof x.rotuloEm === "number") x.rotuloEm = Math.max(x.rotuloEm, livre + 0.3);
          if (typeof x.detalheEm === "number") x.detalheEm = Math.max(x.detalheEm, livre + 0.4);
          return [m, x as Momento];
        }),
      ),
    [plano, lay],
  );

  const desenhar = (original: Momento) => {
    const v = viz.get(original) as Vizinhanca;
    const m = adiados.get(original) ?? original;
    const t0 = m.de + (v.vemDeOutro ? 0.2 : 0);
    const topo = { t, plano, t0, saiCruzando: v.vaiParaOutro };
    const peito = { t, plano, yPeito: lay.yPeito, fim: v.fim };
    const k = `${m.tipo}-${m.de}`;
    switch (m.tipo) {
      case "corte":
        return <Corte key={k} m={m} t={t} plano={plano} />;
      case "pop":
        return <Pop key={k} m={m} t={t} plano={plano} indice={indicePop.get(m) ?? 0} fim={v.fim} saiCruzando={v.vaiParaOutro} />;
      case "topicos":
      case "passos":
        return <Lista key={k} m={m} {...topo} />;
      case "comparacao":
        return <Comparacao key={k} m={m} {...topo} />;
      case "grafico":
        return <Grafico key={k} m={m} {...topo} />;
      case "definicao":
        return <Definicao key={k} m={m} {...topo} />;
      case "pergunta":
        return <Pergunta key={k} m={m} {...topo} />;
      case "abertura":
        return <Abertura key={k} m={m} {...peito} />;
      case "numero":
        return <Numero key={k} m={m} {...peito} />;
      case "destaque":
        return <Destaque key={k} m={m} {...peito} />;
      case "frase":
        return <Frase key={k} m={m} {...peito} />;
      case "cta":
        return <Cta key={k} m={m} {...peito} />;
      default:
        return null;
    }
  };

  return (
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
        {/* metade de cima: fica embaixo da pessoa; ela desce revelando e sobe cobrindo */}
        {/* a metade de cima anda junto com a emenda: entra empurrando a pessoa para baixo e sai
            subindo enquanto ela cresce (nenhum quadro com a metade de cima vazia) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            isolation: "isolate",
            transform: p > 0 && p < 1 ? `translateY(${caixa.y - lay.caixaEmbaixo.y}px)` : undefined,
          }}
        >
          {ativos.filter(pessoaEmbaixo).map(desenhar)}
        </div>
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.04) saturate(1.06)" />
        {/* a emenda entre a imagem e a pessoa: um traço de tarja */}
        {p > 0.01 ? <div style={{ position: "absolute", left: 0, top: caixa.y - 4, width: 1080, height: 8, background: cor.tarja, opacity: Math.min(1, p * 2) }} /> : null}
        {/* quadro cheio e tela cheia: por cima da pessoa */}
        <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>{ativos.filter((m) => !pessoaEmbaixo(m)).map(desenhar)}</div>
        <Legenda t={t} frases={frases} bloqueios={bloqueios} y={lay.yLegenda(t)} />
        {plano.progresso === false ? null : <Barra t={t} duracao={plano.duracao} />}
        {guias ? <Guias plano={plano} caixa={caixa} t={t} lay={lay} /> : null}
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
