import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, useTempo } from "./anim";
import { CortinaAntesDepois, temposDosMarcadores } from "./componentes/Cortina";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Comparacao, Definicao, Grafico, Lista, Pergunta } from "./componentes/Painel";
import { Abertura, Cta, Destaque, Frase, Numero } from "./componentes/Peito";
import { JANELA, ordenar, prepararLayout, semSobreposicao } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import { noPainel, type Momento, type Plano } from "./plano";
import { cor } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais e raros, sempre bem abaixo da voz: um toque por dica, uma bolha na revelação.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume = 0.3) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "antesdepois":
        (m.marcadores ?? []).forEach((mk) => s(mk.em, "tique", 0.26));
        if (m.janelaEm !== undefined) s(m.janelaEm + 0.7, "impacto", 0.3);
        break;
      case "abertura":
        s(m.em ?? m.de, "impacto", 0.28);
        break;
      case "destaque":
        s(m.em, m.nivel === "alerta" ? "alerta" : "impacto", 0.3);
        break;
      case "numero":
        s(m.em, "impacto", 0.28);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em, "tique", 0.24));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em, "pop", 0.26));
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "tique", 0.24));
        break;
      case "definicao":
        s(m.em, "impacto", 0.26);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "tique", 0.24));
        break;
      case "frase":
        s(m.de, "pop", 0.22);
        break;
      case "cta":
        s((m.em ?? m.de) + 0.05, "fim", 0.28);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => semSobreposicao(bruto), [bruto]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(plano).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);

  const g = lay.em(t);
  const videoAltura = plano.videoAltura ?? 1920;
  const ativos = ordenar(plano).filter((m) => t >= m.de - 0.6 && t < lay.fim(m));

  // textos do peito logo depois de uma troca: entram quando a pessoa já voltou ao quadro cheio
  const adiados = useMemo(
    () =>
      new Map<Momento, Momento>(
        plano.momentos.map((m) => {
          if (noPainel(m)) return [m, m];
          const livre = lay.livreDesde(m.de);
          if (livre <= m.de + 0.01) return [m, m];
          const x = { ...m } as Momento & { em?: number; detalheEm?: number; rotuloEm?: number };
          if (typeof x.em === "number") x.em = Math.max(x.em, livre);
          else if (m.tipo === "abertura" || m.tipo === "frase" || m.tipo === "cta") x.em = livre;
          if (typeof x.rotuloEm === "number") x.rotuloEm = Math.max(x.rotuloEm, livre + 0.3);
          if (typeof x.detalheEm === "number") x.detalheEm = Math.max(x.detalheEm, livre + 0.4);
          return [m, x as Momento];
        }),
      ),
    [plano, lay],
  );

  const painel = (m: Momento) => {
    const c = lay.cruza(m);
    const k = `${m.tipo}-${m.de}`;
    const p = { t, plano, t0: m.de + (c.vem ? 0.2 : 0), saiCruzando: c.vai, ate: m.ate };
    switch (m.tipo) {
      case "antesdepois":
        return <CortinaAntesDepois key={k} m={m} t={t} plano={plano} H={g.painel.h} vem={c.vem} vai={c.vai} />;
      case "topicos":
      case "passos":
        return <Lista key={k} m={m} {...p} />;
      case "comparacao":
        return <Comparacao key={k} m={m} {...p} />;
      case "grafico":
        return <Grafico key={k} m={m} {...p} />;
      case "definicao":
        return <Definicao key={k} m={m} {...p} />;
      case "pergunta":
        return <Pergunta key={k} m={m} {...p} />;
      default:
        return null;
    }
  };

  const peito = (original: Momento) => {
    const m = adiados.get(original) ?? original;
    const k = `${m.tipo}-${m.de}`;
    const a = { t, plano, y: g.janela > 0.5 ? JANELA.y - 200 : lay.yPeito, fim: lay.fim(original) };
    switch (m.tipo) {
      case "abertura":
        return <Abertura key={k} m={m} {...a} />;
      case "numero":
        return <Numero key={k} m={m} {...a} />;
      case "destaque":
        return <Destaque key={k} m={m} {...a} />;
      case "frase":
        return <Frase key={k} m={m} {...a} />;
      case "cta":
        return <Cta key={k} m={m} {...a} />;
      default:
        return null;
    }
  };

  const painelVisivel = g.painel.y + g.painel.h > 1;
  const ativosPainel = ativos.filter(noPainel);
  return (
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.linho }}>
        {painelVisivel && ativosPainel.length ? (
          <div style={{ position: "absolute", left: 0, top: g.painel.y, width: 1080, height: g.painel.h, background: cor.linho, overflow: "hidden", isolation: "isolate" }}>
            {ativosPainel.map(painel)}
          </div>
        ) : null}
        <VideoNaCaixa src={plano.video} caixa={g.caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.05)" />
        {/* a emenda entre o painel e a pessoa: um traço verde */}
        {g.embaixo > 0.01 ? <div style={{ position: "absolute", left: 0, top: g.caixa.y - 5, width: 1080, height: 10, background: cor.depois, opacity: Math.min(1, g.embaixo * 2) }} /> : null}
        {/* a janela da revelação: moldura clara em volta da pessoa */}
        {g.janela > 0.01 ? (
          <div
            style={{
              position: "absolute",
              left: g.caixa.x - 8,
              top: g.caixa.y - 8,
              width: g.caixa.w + 16,
              height: g.caixa.h + 16,
              borderRadius: (g.caixa.raio ?? 0) + 8,
              border: `8px solid ${cor.cartao}`,
              boxShadow: "0 18px 40px rgba(29,43,39,0.35)",
              boxSizing: "border-box",
              opacity: g.janela,
              pointerEvents: "none",
            }}
          />
        ) : null}
        <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>{ativos.filter((m) => !noPainel(m)).map(peito)}</div>
        <Legenda t={t} frases={frases} bloqueios={bloqueios} y={g.yLegenda} />
        {guias ? <Guias plano={plano} caixa={g.caixa} t={t} lay={lay} yLegenda={g.yLegenda} /> : null}
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
export { temposDosMarcadores };
