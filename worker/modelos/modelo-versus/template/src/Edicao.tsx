import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, prog, rapido, useTempo } from "./anim";
import { Barra } from "./componentes/Barra";
import { Comparacao } from "./componentes/Comparacao";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Lista } from "./componentes/Listas";
import { PlacarDaLuta, RodadaTela, VereditoTela, VersusTela } from "./componentes/Luta";
import { Costura, FundoArena } from "./componentes/Placa";
import { Abertura, Cta, Destaque, Frase, Numero } from "./componentes/Peito";
import { Definicao, Pergunta } from "./componentes/Topo";
import { COSTURA, comLegendaPadrao, ordenar, prepararLayout, semSobreposicao, vizinhanca, type Vizinhanca } from "./layout";
import { barrasEm, duelosDo, quandoVence, rodadaEm, type Duelo } from "./luta";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, INCLINA } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais e raros, bem abaixo da voz: o VS, o ponto da rodada, o placar, o carimbo dos destaques, o fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume = 0.3) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "versus":
        s(Math.max(m.lados[0].em, m.lados[1].em) + 0.12, "vs", 0.4);
        break;
      case "rodada":
        s(m.de, "rodada", 0.3);
        if (m.vencedor === 0 || m.vencedor === 1) s(m.vencedorEm ?? quandoVence(m), "ponto", 0.36);
        break;
      case "veredito":
        s(m.placarEm ?? m.de, "golpe", 0.36);
        m.perfis.forEach((p) => s(p.em, "tique", 0.24));
        break;
      case "abertura":
        s(m.em ?? m.de, "impacto", 0.32);
        break;
      case "destaque":
        s(m.em, m.nivel === "alerta" ? "alerta" : "impacto", 0.34);
        break;
      case "numero":
        s(m.em, "impacto", 0.3);
        s(m.em + 0.9, "tique", 0.26);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em, "tique", 0.24));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em, "pop", 0.28));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "impacto", 0.28);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "tique", 0.24));
        if (!m.dados?.length) s(m.tendenciaEm ?? m.de, "pop", 0.26);
        break;
      case "definicao":
        s(m.em, "impacto", 0.28);
        s(m.significadoEm, "tique", 0.24);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "tique", 0.24));
        break;
      case "frase":
        s(m.de, "pop", 0.24);
        break;
      case "cta":
        s((m.em ?? m.de) + 0.05, "fim", 0.3);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
};

// Uma faixa vermelha e outra azul cruzam a arena na diagonal quando começa um bloco novo.
const Cortina: React.FC<{ t: number; em: number }> = ({ t, em }) => {
  const p = prog(t, em - 0.12, 0.42, (x) => x);
  if (p <= 0 || p >= 1) return null;
  const x = -420 + p * 1900;
  const faixa = (dx: number, c: string, w: number) => (
    <div style={{ position: "absolute", left: x + dx, top: -40, width: w, height: COSTURA + 80, background: c, transform: `skewX(${INCLINA}deg)` }} />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: COSTURA, overflow: "hidden", pointerEvents: "none" }}>
      {faixa(0, cor.a, 230)}
      {faixa(-150, cor.b, 120)}
      {faixa(250, cor.alerta, 36)}
    </div>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => semSobreposicao(bruto), [bruto]);
  const frases = useMemo(() => montarFrases(comLegendaPadrao(plano)), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(comLegendaPadrao(plano)).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const viz = useMemo(() => new Map<Momento, Vizinhanca>(plano.momentos.map((m) => [m, vizinhanca(m, plano)])), [plano]);
  const duelos = useMemo(() => duelosDo(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const cortinas = useMemo(
    () =>
      ordenar(plano)
        .filter((m) => m.de > 0.4 && m.tipo !== "rodada" && m.tipo !== "veredito")
        .map((m) => m.de),
    [plano],
  );

  const caixa = lay.caixa(t);
  const ativos = ordenar(plano).filter((m) => t >= m.de - 0.6 && t < (viz.get(m)?.fim ?? m.ate));
  const emDuelo = (m: Momento) => m.tipo === "versus" || m.tipo === "rodada" || m.tipo === "veredito";
  const dueloAtivo = (m: Momento): Duelo | undefined => duelos.find((d) => d.membros.includes(m as never));

  // a luta que está na tela agora: as barras empurram a linha que divide os cantos
  const luta = duelos.find((d) => t >= d.de - 0.05 && t < d.ate + 0.01);
  const [fa, fb] = luta ? barrasEm(luta, t) : [0.5, 0.5];
  const rodadaAgora = luta ? rodadaEm(luta, t) : null;
  const noRodada = !!luta && !!rodadaAgora && ativos.some((m) => m === rodadaAgora);

  const desenhar = (m: Momento) => {
    const v = viz.get(m) as Vizinhanca;
    const topo = { t, plano, t0: m.de, saiCruzando: false };
    const peito = { t, plano, yPeito: lay.yPeito, fim: v.fim };
    const k = `${m.tipo}-${m.de}`;
    if (emDuelo(m) && t < m.de - 0.02) return null;
    switch (m.tipo) {
      case "versus": {
        return <VersusTela key={k} m={m} t={t} plano={plano} fim={v.fim} />;
      }
      case "rodada": {
        const d = dueloAtivo(m);
        return d ? <RodadaTela key={k} r={m} d={d} t={t} plano={plano} fim={v.fim} /> : null;
      }
      case "veredito": {
        const d = dueloAtivo(m);
        return d ? <VereditoTela key={k} m={m} d={d} t={t} plano={plano} fim={v.fim} /> : null;
      }
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
        <FundoArena t={t} forcaA={luta ? fa : 0.5} forcaB={luta ? fb : 0.5} />
        {/* tudo da arena em itálico: a Kanit itálica é a letra do cartaz de luta */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: COSTURA, overflow: "hidden", fontStyle: "italic", isolation: "isolate" }}>
          {ativos.map((m) => desenhar(m))}
          {luta && noRodada ? <PlacarDaLuta d={luta} t={t} plano={plano} entra={luta.rodadas[0]?.de ?? 0} /> : null}
          {cortinas.map((em) => (t >= em - 0.12 && t <= em + 0.34 ? <Cortina key={em} t={t} em={em} /> : null))}
        </div>
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} filtro="contrast(1.04) saturate(1.06)" />
        <Costura />
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
