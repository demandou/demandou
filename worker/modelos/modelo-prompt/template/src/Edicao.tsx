import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { desliza, prog, useTempo } from "./anim";
import { BlocoComparacao, BlocoGrafico, BlocoPassos, BlocoTopicos, sonsComparacao, sonsGrafico, sonsPassos, sonsTopicos } from "./componentes/Bancada";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Montagem, temposDaMontagem } from "./componentes/Montagem";
import { ctaAntigo } from "./componentes/Cta";
import { CartaoPeito, type LayoutPeito, layoutDoPeito, type Som } from "./componentes/Peito";
import { Resposta, temposDaResposta } from "./componentes/Resposta";
import { ALTURA_VAGO, escalaDoVago, temposDoVago, Vago } from "./componentes/Vago";
import { alturaLivreNoPeito, caixaDaPessoa, CARTAO_PEITO, ehBancada, ehPeito, emJanela, encostados, estadosDaPessoa, quadrosDaBancada } from "./geometria";
import { VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Momento, Montagem as TipoMontagem, Plano } from "./plano";
import { larguraTexto } from "./medida";
import { cor, sans, sombra } from "./tema";

// Ajuste de segurança antes de desenhar: momentos em ordem e nenhum invadindo o seguinte.
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

// O último momento fica até o fim do vídeo quando é um cartão no peito ou termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// a montagem mais recente antes de um momento (a resposta e o fechamento usam as peças dela)
const montagemAntes = (plano: Plano, m: Momento) =>
  [...plano.momentos].filter((o): o is TipoMontagem => o.tipo === "montagem" && o.de < m.de).sort((a, b) => b.de - a.de)[0];

// Som raro e tonal: envios, um "toc" grave por peça que encaixa (a nota sobe a cada peça), um acorde
// quando algo entra em foco, salvar e testar.
const sons = (plano: Plano, layouts: Map<Momento, LayoutPeito>): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "vago") {
      lista.push({ em: temposDoVago(m).envia, arquivo: "sfx/envia.wav", volume: 0.24 });
      if (m.rotuloPedido) lista.push({ em: m.rotuloPedido.em, arquivo: "sfx/vago.wav", volume: 0.4 });
    }
    if (m.tipo === "montagem") {
      temposDaMontagem(m).encaixe.forEach((e, i) => lista.push({ em: e - 0.02, arquivo: `sfx/encaixe-${Math.min(i, 3) + 1}.wav`, volume: 0.42 }));
    }
    if (m.tipo === "resposta") {
      const tp = temposDaResposta(m);
      lista.push({ em: tp.envia, arquivo: "sfx/envia.wav", volume: 0.34 });
      lista.push({ em: tp.pronto, arquivo: "sfx/pronto.wav", volume: 0.26 });
    }
    if (m.tipo === "topicos") lista.push(...sonsTopicos(m));
    if (m.tipo === "passos") lista.push(...sonsPassos(m));
    if (m.tipo === "comparacao") lista.push(...sonsComparacao(m));
    if (m.tipo === "grafico") lista.push(...sonsGrafico(m));
    const L = layouts.get(m);
    if (L) lista.push(...L.sons);
  }
  const ordenados = lista.filter((s) => s.em >= 0 && s.em < plano.duracao - 0.05).sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.22) saida.push(s);
  return saida;
};

// troca de página na bancada: o bloco que sai é empurrado para a esquerda e o que entra vem da
// direita, juntos (nunca um por cima do outro)
const EMPURRA = 0.55;

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const quadros = useMemo(() => quadrosDaBancada(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, quadros), [plano, quadros]);
  const livre = alturaLivreNoPeito(plano);
  const layouts = useMemo(() => {
    const mapa = new Map<Momento, LayoutPeito>();
    for (const m of plano.momentos) {
      const L = layoutDoPeito(m, { plano, palavras, montagem: montagemAntes(plano, m), livre });
      if (L) mapa.set(m, L);
    }
    return mapa;
  }, [plano, palavras, livre]);
  const listaSons = useMemo(() => sons(plano, layouts), [plano, layouts]);

  const caixa = caixaDaPessoa(t, estados);
  const janela = emJanela(caixa);
  const ordem = plano.momentos;

  // legenda: no peito nos trechos sem momento; acima do cartão quando um cartão pede legenda
  const atual = ordem.find((m) => t >= m.de && t < m.ate);
  const legendaY = atual && ehPeito(atual) ? 846 : 1180;
  const nome = plano.marca.nome;
  // nas janelas pequenas o nome precisa caber na etiqueta: nome e sobrenome, ou só o primeiro nome
  const nomeNaJanela = (() => {
    if (!nome) return "";
    const max = 370 - 40 - 44;
    if (larguraTexto(nome, 34, { peso: 700 }) <= max) return nome;
    const ws = nome.split(/\s+/);
    const curto = ws.length > 2 ? `${ws[0]} ${ws[ws.length - 1]}` : ws[0];
    return larguraTexto(curto, 34, { peso: 700 }) <= max ? curto : ws[0];
  })();
  const areaNaJanela = !!plano.marca.area && larguraTexto(`${nome}  ${plano.marca.area}`, 34, { peso: 600 }) <= 900 - 40 - 44 - 30;

  // a altura final do cartão do peito de um momento (para o cartão seguinte continuar dele)
  const alturaDoCartao = (m: Momento): number | null => {
    if (m.tipo === "vago") return ALTURA_VAGO * escalaDoVago(livre);
    const L = layouts.get(m);
    return L ? L.h * L.escala : null;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.bancada }}>
      {/* 1. a bancada (atrás da pessoa, nunca por cima do rosto) */}
      {ordem.map((m, k) => {
        if (!ehBancada(m)) return null;
        const fim = fimDoMomento(m, plano);
        if (t < m.de - 0.05 || t > fim + 0.72) return null;
        const prox = ordem[k + 1];
        const ante = ordem[k - 1];
        // o que vem depois põe a pessoa em tela cheia (cartão no peito ou trecho sem momento)
        const cobertaDepois = !prox || ehPeito(prox) || prox.de > m.ate + 0.05;
        const entrega = m.tipo === "montagem" && !!prox && prox.tipo === "resposta" && encostados(m, prox);
        const recebe = m.tipo === "resposta" && !!ante && ante.tipo === "montagem" && encostados(ante, m);
        const empurrado = !cobertaDepois && !entrega && !!prox && ehBancada(prox) && encostados(m, prox);
        const empurra = !recebe && !!ante && ehBancada(ante) && encostados(ante, m);
        const dx = (empurra ? (1 - prog(t, m.de, EMPURRA, desliza)) * 1100 : 0) - (empurrado ? prog(t, fim, EMPURRA, desliza) * 1100 : 0);
        if (empurrado && t > fim + EMPURRA) return null;
        // coberta pela pessoa que volta à tela cheia: some quando ela já cobriu tudo
        if (cobertaDepois && !entrega && t > fim + 0.66 && m.tipo !== "montagem" && m.tipo !== "resposta") return null;
        const q = quadros.get(m);
        let bloco: React.ReactNode = null;
        if (m.tipo === "montagem") bloco = <Montagem m={m} t={t} palavras={palavras} entrega={entrega} fim={fim} cobertaDepois={cobertaDepois} empurrado={empurrado} />;
        else if (m.tipo === "resposta") bloco = <Resposta m={m} t={t} palavras={palavras} montagem={montagemAntes(plano, m)} fim={fim} cobertaDepois={cobertaDepois} empurrado={empurrado} />;
        else if (q && m.tipo === "topicos") bloco = <BlocoTopicos m={m} t={t} q={q} palavras={palavras} />;
        else if (q && m.tipo === "passos") bloco = <BlocoPassos m={m} t={t} q={q} palavras={palavras} />;
        else if (q && m.tipo === "comparacao") bloco = <BlocoComparacao m={m} t={t} q={q} palavras={palavras} />;
        else if (q && m.tipo === "grafico") bloco = <BlocoGrafico m={m} t={t} q={q} palavras={palavras} />;
        return (
          <div key={`b-${m.tipo}-${m.de}`} style={{ position: "absolute", inset: 0, translate: dx ? `${dx.toFixed(1)}px 0` : undefined }}>
            {bloco}
          </div>
        );
      })}

      {/* 2. a pessoa: uma só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        estilo={janela > 0 ? { boxShadow: `0 0 0 ${(7 * janela).toFixed(1)}px #FFFFFF, ${sombra(janela)}` } : undefined}
      />
      {/* etiqueta com o nome na janela (nas janelas largas o bastante) */}
      {nomeNaJanela && caixa.w >= 360 && janela > 0.6 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x + 20,
            top: caixa.y + caixa.h - 20 - 58,
            maxWidth: caixa.w - 40,
            height: 58,
            padding: "0 22px",
            borderRadius: 29,
            background: "rgba(255,255,255,0.94)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: sans,
            fontSize: 34,
            color: cor.tintaSuave,
            whiteSpace: "nowrap",
            overflow: "hidden",
            opacity: (janela - 0.6) / 0.4,
          }}
        >
          <span style={{ fontWeight: 700, color: cor.tinta }}>{caixa.w > 700 ? nome : nomeNaJanela}</span>
          {areaNaJanela && caixa.w > 700 ? <span style={{ width: 7, height: 7, borderRadius: 4, background: cor.lapis }} /> : null}
          {areaNaJanela && caixa.w > 700 ? <span style={{ fontWeight: 500 }}>{plano.marca.area}</span> : null}
        </div>
      ) : null}

      {/* 3. os cartões no peito (pessoa em tela cheia) */}
      {ordem.map((m, k) => {
        if (!ehPeito(m)) return null;
        const fim = fimDoMomento(m, plano);
        const prox = ordem[k + 1];
        const ante = ordem[k - 1];
        // encostado num cartão seguinte que continua deste (o vago só continua num cartão comum)
        const emendaDepois = !!prox && ehPeito(prox) && prox.tipo !== "vago" && encostados(m, prox);
        if (emendaDepois ? t >= prox.de : t > fim + 0.45) return null;
        if (m.tipo === "vago") {
          if (t < m.de - 0.05) return null;
          return <Vago key={`v-${m.de}`} m={m} t={t} fim={fim} livre={livre} emendaDepois={emendaDepois} />;
        }
        const L = layouts.get(m);
        if (!L) return null;
        const alturaAntes = ante && ehPeito(ante) && encostados(ante, m) ? alturaDoCartao(ante) : null;
        if (t < m.de - (alturaAntes !== null ? 0 : 0.05)) return null;
        // (o fechamento no formato antigo sobe logo: o primeiro toque dele vem cedo)
        const depoisDaBancada = !!ante && ehBancada(ante) && encostados(ante, m) && !(m.tipo === "cta" && ctaAntigo(m));
        return <CartaoPeito key={`p-${m.tipo}-${m.de}`} m={m} L={L} t={t} fim={fim} alturaAntes={alturaAntes} emendaDepois={emendaDepois} depoisDaBancada={depoisDaBancada} />;
      })}

      {/* 4. a legenda (só com a pessoa em tela cheia) */}
      {janela < 0.3 ? <Legenda frases={frases} t={t} y={legendaY} /> : null}

      {guias ? <Guias plano={plano} caixa={caixa} legendaY={legendaY} /> : null}
      {guias ? (
        <div
          style={{
            position: "absolute",
            left: CARTAO_PEITO.x,
            width: CARTAO_PEITO.w,
            top: CARTAO_PEITO.base - livre,
            height: livre,
            border: "3px dashed #FFD400",
          }}
        />
      ) : null}

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
