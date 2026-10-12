import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, prog, useTempo } from "./anim";
import { Barra } from "./componentes/Barra";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Topicos } from "./componentes/Blocos";
import { Guias } from "./componentes/Guias";
import { KitContador, KitMundo } from "./componentes/Kit";
import { Legenda } from "./componentes/Legenda";
import { camera, comLegendaPadrao, COSTURA, ORIGEM, ordenar, prepararLayout, QUADRO, semSobreposicao, vizinhanca, type Vizinhanca } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais e raros, bem abaixo da voz: o que cai no tampo, a etiqueta que pousa, o carimbo, o fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume = 0.28) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "kit":
        m.itens.forEach((it) => {
          s(it.em - 0.02, "queda", 0.34);
          s(it.em + 0.42, "etiqueta", 0.26);
        });
        s((m.afastarEm ?? Math.max(...m.itens.map((i) => i.em)) + 1.4) - 0.1, "afastar", 0.3);
        if (m.total) s(m.totalEm ?? (m.afastarEm ?? 0) + 0.5, "carimbo", 0.3);
        break;
      case "abertura":
        s(m.de + 0.12, "carimbo", 0.3);
        break;
      case "destaque":
        s(m.em, m.nivel === "alerta" ? "alerta" : "carimbo", 0.32);
        break;
      case "numero":
        s(m.em, "carimbo", 0.3);
        s(m.em + 0.8, "contador", 0.22);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em + 0.04, "etiqueta", 0.26));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em + 0.04, "queda", 0.28));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "carimbo", 0.28);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "contador", 0.22));
        if (!m.dados?.length) s(m.tendenciaEm ?? m.de, "etiqueta", 0.26);
        break;
      case "definicao":
        s(m.em, "carimbo", 0.28);
        s(m.significadoEm, "etiqueta", 0.24);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em + 0.04, "etiqueta", 0.26));
        break;
      case "frase":
        s(m.de + 0.12, "etiqueta", 0.26);
        break;
      case "cta":
        s(m.de + 0.1, "fim", 0.3);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => semSobreposicao(bruto), [bruto]);
  const frases = useMemo(() => montarFrases(comLegendaPadrao(plano)), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(comLegendaPadrao(plano)).map((f) => f.de), [plano]);
  const cam = useMemo(() => camera(plano), [plano]);
  const viz = useMemo(() => new Map<Momento, Vizinhanca>(plano.momentos.map((m) => [m, vizinhanca(m, plano)])), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

  const c = cam(t);
  // a pessoa: tela cheia (base) ou moldura da direita (mesa aberta à esquerda)
  const caixa = lay.caixa(t);
  const aberta = lay.naMoldura(t);
  const legenda = lay.legenda(t);
  const ativos = ordenar(plano).filter((m) => t >= m.de - 0.6 && t < (viz.get(m)?.fim ?? m.ate));
  const kits = ativos.filter((m) => m.tipo === "kit");
  const outros = ativos.filter((m) => m.tipo !== "kit");

  const varridaDe = (m: Momento) => {
    const v = viz.get(m) as Vizinhanca;
    return v.saiPara ? prog(t, m.ate, 0.3) : 0;
  };

  const desenhar = (m: Momento) => {
    const props = { t, plano, varrida: varridaDe(m) };
    const k = `${m.tipo}-${m.de}`;
    switch (m.tipo) {
      case "abertura":
        return <Abertura key={k} m={m} {...props} />;
      case "topicos":
        return <Topicos key={k} m={m} {...props} />;
      case "passos":
        return <Passos key={k} m={m} {...props} />;
      case "numero":
        return <Numero key={k} m={m} {...props} />;
      case "comparacao":
        return <Comparacao key={k} m={m} {...props} />;
      case "grafico":
        return <Grafico key={k} m={m} {...props} />;
      case "destaque":
        return <Destaque key={k} m={m} {...props} />;
      case "definicao":
        return <Definicao key={k} m={m} {...props} />;
      case "frase":
        return <Frase key={k} m={m} {...props} />;
      case "pergunta":
        return <Pergunta key={k} m={m} {...props} />;
      case "cta":
        return <Cta key={k} m={m} {...props} />;
      default:
        return null;
    }
  };

  // a etiqueta do total sai quando o fechamento chega
  const fimTotalDe = (ate: number) => {
    const cta = ordenar(plano).find((x) => x.tipo === "cta" && x.de >= ate - 0.01);
    return cta ? cta.de : plano.duracao + 5;
  };

  const mundo = `translate(${ORIGEM.x}px, ${ORIGEM.y}px) scale(${c.z}) translate(${-c.x}px, ${-c.y}px)`;

  return (
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.mesa }}>
        {/* o tampo da mesa ocupa o quadro todo por baixo; a pessoa (tela cheia ou moldura da direita)
            fica por cima, e o que aparece da mesa é o quadro da esquerda */}
        <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: QUADRO.h, overflow: "hidden", background: cor.mesa }}>
          <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: mundo }}>
            <Img src={staticFile("mesa.jpg")} style={{ position: "absolute", left: -900, top: -900, width: 1800, height: 1800, maxWidth: "none" }} />
            {kits.map((m) => {
              const v = viz.get(m) as Vizinhanca;
              const sai = v.saiPara ? prog(t, m.ate, 0.3) : 0;
              return (
                <div key={`kit-${m.de}`} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - sai, transform: sai > 0 ? `translateY(${sai * 160}px)` : undefined }}>
                  {m.tipo === "kit" ? <KitMundo m={m} plano={plano} t={t} cam={c} fimTotal={fimTotalDe(m.ate)} /> : null}
                </div>
              );
            })}
          </div>
          {/* luz sobre a mesa (o quadro da esquerda): um clarão suave no alto e cantos mais escuros */}
          <div style={{ position: "absolute", left: 0, top: 0, width: COSTURA, height: QUADRO.h, background: "radial-gradient(120% 90% at 30% 20%, rgba(255,246,225,0.22), rgba(80,50,20,0.16) 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>{outros.map(desenhar)}</div>
          {/* o contador do kit fica no pé da mesa, por baixo da pessoa quando ela volta para a tela cheia */}
          {kits.map((m) =>
            m.tipo === "kit" ? <KitContador key={`ct-${m.de}`} m={m} t={t} fim={(viz.get(m) as Vizinhanca).fim > plano.duracao ? plano.duracao + 5 : m.ate} /> : null,
          )}
        </div>
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.04) saturate(1.05)" />
        {/* a borda da mesa por cima da pessoa: madeira mais escura, com a sombra caindo na moldura */}
        {aberta > 0.001 ? (
          <>
            <div style={{ position: "absolute", left: caixa.x, top: 0, width: 46, height: QUADRO.h, background: "linear-gradient(90deg, rgba(35,20,8,0.5), rgba(35,20,8,0))", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: caixa.x - 7, top: 0, width: 14, height: QUADRO.h, background: cor.mesaBorda, boxShadow: "3px 0 6px rgba(35,20,8,0.45)" }} />
          </>
        ) : null}
        <Legenda t={t} frases={frases} bloqueios={bloqueios} x={legenda.x} y={legenda.y} largura={legenda.largura} />
        {plano.progresso === false ? null : <Barra t={t} duracao={plano.duracao} />}
        {guias ? <Guias plano={plano} caixa={caixa} t={t} /> : null}
        {plano.sfx === false
          ? null
          : listaDeSons.map((s) => (
              <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
                <Audio src={staticFile(s.arquivo)} volume={s.volume} />
              </Sequence>
            ))}
      </AbsoluteFill>
    </PalavrasCtx.Provider>
  );
};
