import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, rolagem, useTempo } from "./anim";
import { cartaoAbertura, cartaoComparacao, cartaoCta, cartaoDefinicao, cartaoDestaque, cartaoFrase, cartaoGrafico, cartaoNumero, cartaoPassos, cartaoPergunta, cartaoTopicos } from "./componentes/Blocos";
import { cartaoComentario, cartaoFoto, cartaoPerfil, cartaoPrint, type Cartao, type Ctx } from "./componentes/Cartoes";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { caixaDaPessoa, comLegendaPadrao, COSTURA, feedNoTempo, MESA, montarFeed, ordenar, semSobreposicao } from "./layout";
import { rostoNaTela, VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, sombraCartao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais e raros: o cartão que sobe, o marca-texto que pega a linha, o riscado, o fechamento.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume = 0.34) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "comentario":
        s(m.de, "pop", 0.4);
        break;
      case "print":
        s(m.de, "pop", 0.38);
        (m.grifos ?? []).forEach((g) => s(g.em + 0.05, "tique", 0.26));
        if (m.risco) s(m.risco.em, "alerta", 0.3);
        break;
      case "foto":
        s(m.de, "pop", 0.34);
        break;
      case "abertura":
        s(m.em ?? m.de, "impacto", 0.34);
        break;
      case "destaque":
        s(m.em, m.nivel === "alerta" ? "alerta" : "impacto", 0.36);
        break;
      case "numero":
        s(m.em, "impacto", 0.32);
        s(m.em + 0.9, "tique", 0.28);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it) => s(it.em, "tique", 0.26));
        break;
      case "comparacao":
        m.lados.forEach((l) => s(l.em, "pop", 0.3));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "impacto", 0.3);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d) => s(d.em, "tique", 0.26));
        if (!m.dados?.length) s(m.tendenciaEm ?? m.de, "pop", 0.28);
        break;
      case "definicao":
        s(m.em, "impacto", 0.3);
        s(m.significadoEm, "tique", 0.26);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em, "tique", 0.26));
        break;
      case "frase":
        s(m.de, "pop", 0.26);
        break;
      case "cta":
        s((m.em ?? m.de) + 0.05, "fim", 0.34);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.12);
};

const construir = (m: Momento | null, ctx: Ctx): Cartao => {
  if (!m) return cartaoPerfil(ctx.plano);
  switch (m.tipo) {
    case "comentario":
      return cartaoComentario(m, ctx);
    case "print":
      return cartaoPrint(m, ctx);
    case "foto":
      return cartaoFoto(m, ctx);
    case "abertura":
      return cartaoAbertura(m, ctx);
    case "topicos":
      return cartaoTopicos(m, ctx);
    case "passos":
      return cartaoPassos(m, ctx);
    case "numero":
      return cartaoNumero(m, ctx);
    case "comparacao":
      return cartaoComparacao(m, ctx);
    case "grafico":
      return cartaoGrafico(m, ctx);
    case "destaque":
      return cartaoDestaque(m, ctx);
    case "definicao":
      return cartaoDefinicao(m, ctx);
    case "frase":
      return cartaoFrase(m, ctx);
    case "pergunta":
      return cartaoPergunta(m, ctx);
    case "cta":
      return cartaoCta(m, ctx);
  }
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: bruto, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const plano = useMemo(() => comLegendaPadrao(semSobreposicao(bruto)), [bruto]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(plano).map((f) => f.de), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const temPerfil = !!plano.marca.nome && !plano.momentos.some((m) => m.de <= 0.6);
  const cartoes = useMemo(() => {
    const ctx: Ctx = { plano, palavras: plano.palavras };
    const mapa = new Map<Momento | null, Cartao>();
    if (temPerfil) mapa.set(null, construir(null, ctx));
    for (const m of ordenar(plano)) mapa.set(m, construir(m, ctx));
    return mapa;
  }, [plano, temPerfil]);
  const feed = useMemo(() => montarFeed(ordenar(plano), new Map([...cartoes].map(([k, c]) => [k, c.h])), temPerfil), [plano, cartoes, temPerfil]);

  const caixa = caixaDaPessoa(plano);
  const postos = feedNoTempo(feed, t, rolagem);
  const videoAltura = plano.videoAltura ?? 1920;
  // a legenda fica abaixo do queixo, dentro da moldura da pessoa
  const rs = rostoNaTela(caixa, plano.rosto, videoAltura, t);
  const yLegenda = Math.min(1570, Math.max(COSTURA + 360, rs.y + rs.largura * 0.78 + 56));

  return (
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${cor.fundo} 0%, ${cor.fundoClaro} 100%)` }}>
        {/* a mesa: pontinhos discretos, o feed passa por cima */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 2.5px, transparent 2.6px)", backgroundSize: "44px 44px", backgroundPosition: "10px 14px" }} />
        {postos.map((p) => {
          const c = cartoes.get(p.no.m);
          if (!c) return null;
          return (
            <div key={p.no.m ? `${p.no.m.tipo}-${p.no.m.de}` : "perfil"} style={{ position: "absolute", left: MESA.x, top: p.y, width: MESA.w, height: c.h, opacity: p.opacidade, transformOrigin: "top center", transform: p.no.escala < 1 ? `scale(${p.no.escala})` : undefined }}>
              {c.desenhar(t)}
            </div>
          );
        })}
        {/* a moldura larga da pessoa, a voz vem daqui o vídeo inteiro */}
        <VideoNaCaixa
          src={plano.video}
          caixa={caixa}
          rosto={plano.rosto}
          videoAltura={videoAltura}
          filtro="contrast(1.04) saturate(1.06)"
          estilo={{ boxShadow: `0 0 0 7px ${cor.cartao}, ${sombraCartao}` }}
        />
        <Legenda t={t} frases={frases} bloqueios={bloqueios} y={yLegenda} />
        {guias ? <Guias plano={plano} caixa={caixa} t={t} /> : null}
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
