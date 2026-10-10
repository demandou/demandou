import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, temposDoTexto, useTempo } from "./anim";
import { Caminho } from "./componentes/Caminho";
import { Comparacao } from "./componentes/Comparacao";
import { Cta } from "./componentes/Cta";
import { Destaque } from "./componentes/Destaque";
import { Divisao } from "./componentes/Divisao";
import { Frase } from "./componentes/Frase";
import { Fundo } from "./componentes/Fundo";
import { Gancho } from "./componentes/Gancho";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Lista } from "./componentes/Lista";
import { Numero } from "./componentes/Numero";
import { Pergunta } from "./componentes/Pergunta";
import { Assinatura, Pessoa } from "./componentes/Pessoa";
import { RelogioAnel, RelogioCorpo } from "./componentes/Relogio";
import { Rota } from "./componentes/Rota";
import { Zona } from "./componentes/Zona";
import { Zonas } from "./componentes/Zonas";
import {
  ANTES,
  centroDoRelogio,
  ehRelogio,
  estadosDaPessoa,
  fimDoMomento,
  geometria,
  lugarDe,
  lugares,
  montarTrechos,
  ordenar,
  peDoRelogio,
  pessoaNoTempo,
  presencaAbaixo,
  presencaPeito,
  redondeza,
  TROCA,
  trechoNoTempo,
} from "./layout";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Divisao as DivisaoT, Momento, Palavra, Plano } from "./plano";
import { relogioNoTempo, temposDasZonas } from "./relogio";
import { cor, fontesCarregadas, zonaCor as zonaDe } from "./tema";

// Só desenha depois que as fontes carregaram: os blocos medem o texto com a própria fonte.
let fontesProntas = false;
fontesCarregadas.then(() => {
  fontesProntas = true;
});
const useFontes = () => {
  const [prontas, setProntas] = useState(fontesProntas);
  const [espera] = useState(() => (fontesProntas ? null : delayRender("Carregando as fontes")));
  useEffect(() => {
    if (prontas) return;
    fontesCarregadas.then(() => {
      setProntas(true);
      if (espera !== null) continueRender(espera);
    });
  }, [prontas, espera]);
  return prontas;
};

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal, um por batida importante: uma batida grave no alerta, notas que sobem quando o
// anel termina de acender, um "bip" grave quando algo trava (zona, número, definição), um tom quando
// uma parte enche e outro mais grave quando divide, uma nota por trecho de rota e duas no fechamento.
const sons = (ordem: Momento[], palavras: Palavra[]): Som[] => {
  const lista: Som[] = [];
  const add = (em: number | undefined, arquivo: string, volume: number) => {
    if (em !== undefined && Number.isFinite(em)) lista.push({ em, arquivo: `sfx/${arquivo}.wav`, volume });
  };
  for (const m of ordem) {
    switch (m.tipo) {
      case "gancho":
      case "abertura":
        add((m.alertaEm ?? temposDoTexto(m.texto, palavras, Math.min(m.de, m.em ?? m.de), m.ate, m.em ?? m.de)[0]) + 0.02, "batida", 0.55);
        break;
      case "zonas":
        add(temposDasZonas(m)[4] + 0.1, "acende", 0.3);
        break;
      case "zona":
      case "definicao":
        add(m.em + 0.04, "trava", 0.34);
        break;
      case "numero":
        add(m.em + 1.05, "trava", 0.32);
        break;
      case "divisao":
        if (m.partes[0]) add(m.partes[0].em, "enche", 0.36);
        if (m.partes[1]) add(m.partes[1].em + 0.05, "divide", 0.36);
        break;
      case "rota":
        m.trechos.slice(0, 2).forEach((tr) => add(tr.em + 0.02, tr.zona >= 3 ? "forte" : "leve", 0.3));
        break;
      case "topicos":
        add(m.itens[0]?.em, "leve", 0.26);
        if (m.itens.length > 1) add(m.itens[m.itens.length - 1].em + 0.25, "acende", 0.28);
        break;
      case "passos":
        add(m.itens[0]?.em, "leve", 0.26);
        if (m.itens.length > 1) add(m.itens[m.itens.length - 1].em + 0.2, "forte", 0.28);
        break;
      case "destaque":
        add(m.em + 0.02, m.nivel === "alerta" ? "batida" : "trava", m.nivel === "alerta" ? 0.5 : 0.32);
        break;
      case "pergunta":
        add((m.em ?? m.de) + 0.02, "leve", 0.26);
        break;
      case "frase":
        if (m.risco) add(m.riscoEm ?? m.de + 0.8, "batida", 0.42);
        break;
      case "comparacao":
        add(m.vencedorEm ?? m.lados[1]?.em, "divide", 0.32);
        break;
      case "grafico": {
        const d = m.dados ?? [];
        add(d.length >= 2 ? d[d.length - 1].em + 0.3 : (m.tendenciaEm ?? m.de + 0.3) + 1.2, "enche", 0.3);
        break;
      }
      case "cta":
        add(Math.max(m.acaoEm ?? m.de + 0.5, m.de + 0.5), "salva", 0.32);
        break;
    }
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.18) saida.push(s);
  return saida;
};

const NO_PEITO = new Set(["gancho", "abertura", "numero", "cta"]);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = (props) => {
  const prontas = useFontes();
  if (!prontas) return <AbsoluteFill style={{ backgroundColor: cor.fundo }} />;
  return <EdicaoPronta {...props} />;
};

const EdicaoPronta: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const ordem = plano.momentos;
  const geo = useMemo(() => geometria(plano), [plano]);
  const L = useMemo(() => lugares(plano, geo), [plano, geo]);
  const trechos = useMemo(() => montarTrechos(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(trechos, L, plano.cortesEm), [trechos, L, plano.cortesEm]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const listaSons = useMemo(() => sons(ordem, palavras), [ordem, palavras]);

  const caixa = pessoaNoTempo(t, estados);
  const { k, atual, anterior, p } = trechoNoTempo(t, trechos);
  const relogio = relogioNoTempo(t, ordem, trechos, k);
  const visivelRelogio = relogio.visivel * redondeza(caixa);
  const estadoRelogio = { ...relogio, visivel: visivelRelogio };
  const redondo = redondeza(caixa) > 0.6;
  // pé do relógio agora (só quando a caixa é redonda): o conteúdo embaixo acompanha o relógio
  const peAgora = redondo ? caixa.y + caixa.h / 2 + (Math.min(caixa.w, caixa.h) / 2) * 1.47 * Math.max(0.75, visivelRelogio) : caixa.y + caixa.h;
  // anel branco de avatar: só no mapa
  const anelBranco = (atual.lugar === "avatar" ? p : 0) + (anterior.lugar === "avatar" && atual.lugar !== "avatar" ? 1 - Math.min(1, p * 3) : 0);

  const fim = (i: number) => fimDoMomento(i, trechos, plano.duracao);
  const vivo = (i: number) => t >= ordem[i].de - TROCA - ANTES && t <= fim(i) + TROCA + 0.3;
  const divisao = ordem.find((m): m is DivisaoT => m.tipo === "divisao");
  const zonasAntes = (i: number) => ordem.slice(0, i).some((m) => m.tipo === "zonas");
  // o painel embaixo nunca fica por baixo da pessoa enquanto ela se move: desce junto e sobe com ela
  const abaixoDaPessoa = (m: Momento, i: number) => {
    const l = lugarDe(m);
    if (l === "avatar" || l === "cheia") return 0;
    // voltando para a tela cheia, a pessoa cobre o painel (cortina): ele não desce
    if (atual.lugar === "cheia" && atual.momento !== i) return 0;
    const topoFinal = ehRelogio(l) ? peDoRelogio(centroDoRelogio(l)) + 30 : geo.abaixoCartao;
    return Math.max(0, peAgora + 24 - topoFinal);
  };

  const painel = (m: Momento, i: number) => {
    switch (m.tipo) {
      case "zonas":
        return <Zonas m={m} t={t} palavras={palavras} />;
      case "zona":
        return (
          <Zona
            m={{ de: m.de, zona: m.zona, em: m.em, titulo: m.titulo ?? `Zona ${Math.round(m.zona)}`, balao: m.balao, leituras: m.leituras, exemplo: m.exemplo }}
            t={t}
            desce={zonasAntes(i)}
          />
        );
      case "definicao":
        return <Zona m={{ de: m.de, zona: m.zona ?? 2, em: m.em, titulo: m.termo, balao: { texto: m.significado, em: m.significadoEm } }} t={t} desce={false} />;
      case "topicos":
        return (
          <Lista
            itens={m.itens.slice(0, 5)}
            titulo={m.titulo}
            t={t}
            de={m.de}
            ate={m.ate}
            palavras={palavras}
            z={zonaDe(m.zona)}
            topo={peDoRelogio(centroDoRelogio("relogioLista")) + 30}
          />
        );
      case "destaque":
        return <Destaque m={m} t={t} palavras={palavras} />;
      case "pergunta":
        return <Pergunta m={m} t={t} palavras={palavras} />;
      case "divisao":
        return <Divisao m={m} t={t} palavras={palavras} geo={geo} />;
      case "frase":
        return <Frase m={m} t={t} palavras={palavras} fim={fim(i)} geo={geo} />;
      case "comparacao":
        return <Comparacao m={m} t={t} palavras={palavras} fim={fim(i)} geo={geo} />;
      case "grafico":
        return <Grafico m={m} t={t} palavras={palavras} geo={geo} fim={fim(i)} />;
      case "rota":
        return <Rota m={m} t={t} palavras={palavras} />;
      case "passos":
        return <Caminho m={m} t={t} palavras={palavras} />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
      {/* 1. o app: fundo e o painel que fica embaixo da pessoa */}
      <Fundo />
      {ordem.map((m, i) => {
        if (NO_PEITO.has(m.tipo) || !vivo(i)) return null;
        const pres = presencaAbaixo(i, t, trechos);
        if (pres.opacidade <= 0.001 || Math.abs(pres.dx) >= 1079) return null;
        const dy = abaixoDaPessoa(m, i);
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: pres.opacidade, translate: `${pres.dx}px ${dy}px` }}>
            {painel(m, i)}
          </div>
        );
      })}

      {/* 2. o relógio em volta do visor e a pessoa (a única cópia com som, montada o vídeo inteiro) */}
      <RelogioCorpo caixa={caixa} estado={estadoRelogio} />
      <Pessoa caixa={caixa} video={plano.video} rosto={plano.rosto} videoAltura={videoAltura} anelBranco={limitar(anelBranco)} noRelogio={visivelRelogio} />
      <RelogioAnel caixa={caixa} estado={estadoRelogio} />

      {/* 3. cartões no peito (pessoa em tela cheia) */}
      {ordem.map((m, i) => {
        if (!NO_PEITO.has(m.tipo) || !vivo(i)) return null;
        const pres = presencaPeito(i, t, trechos);
        if (m.tipo === "gancho" || m.tipo === "abertura") return <Gancho key={i} m={m} t={t} palavras={palavras} fim={fim(i)} topo={geo.peito} pres={pres} />;
        if (m.tipo === "numero") return <Numero key={i} m={m} t={t} palavras={palavras} topo={geo.peito} pres={pres} />;
        if (m.tipo === "cta") return <Cta key={i} m={m} t={t} palavras={palavras} topo={geo.peito} divisao={divisao} pres={pres} fim={plano.duracao} />;
        return null;
      })}

      <Assinatura nome={plano.marca.nome} area={plano.marca.area} opacidade={1} />
      <Legendas frases={frases} t={t} pessoa={caixa} y={geo.peito + 240} />

      {guias ? <Guias plano={plano} caixa={caixa} topoPeito={geo.peito} /> : null}

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

