import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, temposDoTexto, troca, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { Barra } from "./componentes/Barra";
import { Comparacao } from "./componentes/Comparacao";
import { Cta } from "./componentes/Cta";
import { Dado } from "./componentes/Dado";
import { Definicao } from "./componentes/Definicao";
import { Destaque } from "./componentes/Destaque";
import { Estudio } from "./componentes/Estudio";
import { EtiquetaLateral } from "./componentes/Etiqueta";
import { EtiquetaDividida } from "./componentes/EtiquetaDividida";
import { Frase } from "./componentes/Frase";
import { Grafico } from "./componentes/Grafico";
import { GraficoDados } from "./componentes/GraficoDados";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Letreiro } from "./componentes/Letreiro";
import { Manchete } from "./componentes/Manchete";
import { Nota } from "./componentes/Nota";
import { Passos } from "./componentes/Passos";
import { Enquete, PerguntaGc } from "./componentes/Pergunta";
import { Topicos } from "./componentes/Topicos";
import { Vinheta } from "./componentes/Vinheta";
import { ANTES, ehPainel, estadosDaPessoa, fimDe, ordenar, painelDe, quadroDe, topoDasArtes, TROCA, trechosDe } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Momento, Palavra, Plano } from "./plano";
import { cor, H, LETREIRO, W, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// A cortina entre dois painéis seguidos: uma faixa azul elétrico atravessa o painel da esquerda para
// a direita; o painel que sai fica à direita dela, o que entra aparece à esquerda (nunca os dois
// textos um em cima do outro, nunca um quadro vazio).
const CORTINA = 0.45;
const FAIXA = 26;
const posicaoDaCortina = (t: number, inicio: number) => -FAIXA + (W + 2 * FAIXA) * prog(t, inicio, CORTINA, troca);

const nota = (k: number) => `sfx/nota-${(k % 3) + 1}.wav`;

// Som raro e tonal: duas notas na vinheta e na abertura, um "vum" grave em cada troca de quadro (mais
// baixo na cortina entre painéis), uma nota (dó, mi, sol, subindo) quando um item, número ou preço
// acende, duas notas descendo na perda e no alerta, e um acorde curto no fim. Nunca dois sons a menos
// de 0,45 s.
const sons = (plano: Plano, palavras: Palavra[]): Som[] => {
  const lista: Som[] = [];
  const trechos = trechosDe(plano);
  trechos.forEach((tr, i) => {
    if (i > 0 && tr.de < plano.duracao - 0.3) lista.push({ em: Math.max(0, tr.de - ANTES + 0.04), arquivo: "sfx/troca.wav", volume: 0.42 });
  });
  const ms = plano.momentos;
  ms.forEach((m, i) => {
    const anterior = ms[i - 1];
    if (anterior && ehPainel(anterior) && ehPainel(m) && quadroDe(anterior) === quadroDe(m) && Math.abs(fimDe(anterior, plano) - m.de) < 0.3) {
      lista.push({ em: Math.max(0, m.de - ANTES + 0.06), arquivo: "sfx/troca.wav", volume: 0.26 });
    }
    switch (m.tipo) {
      case "vinheta":
      case "abertura":
        lista.push({ em: Math.max(0, m.de + 0.02), arquivo: "sfx/abertura.wav", volume: 0.4 });
        break;
      case "grafico":
        if (m.series?.length) {
          const sobe = m.series.find((s) => s.sentido === "sobe");
          if (sobe) lista.push({ em: sobe.em, arquivo: "sfx/nota-1.wav", volume: 0.34 });
        } else if (m.dados && m.dados.length >= 2) m.dados.forEach((d, k) => lista.push({ em: d.em, arquivo: nota(k), volume: 0.3 }));
        else lista.push({ em: m.tendenciaEm ?? m.de + 0.4, arquivo: m.tendencia === "cai" ? "sfx/desce.wav" : "sfx/nota-1.wav", volume: 0.32 });
        break;
      case "etiqueta":
        if (m.taxa) lista.push({ em: m.taxa.em, arquivo: "sfx/nota-1.wav", volume: 0.34 });
        lista.push({ em: m.antes.em, arquivo: "sfx/nota-2.wav", volume: 0.34 });
        lista.push({ em: m.depois.em, arquivo: m.sentido === "desce" ? "sfx/desce.wav" : "sfx/nota-3.wav", volume: 0.36 });
        break;
      case "nota":
        lista.push({ em: m.perda.em, arquivo: "sfx/desce.wav", volume: 0.36 });
        break;
      case "dado":
      case "numero":
        lista.push({ em: m.em, arquivo: "sfx/nota-3.wav", volume: 0.36 });
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, k) => lista.push({ em: it.em, arquivo: nota(k), volume: 0.3 }));
        break;
      case "comparacao":
        m.lados.forEach((l, k) => lista.push({ em: l.em, arquivo: nota(k), volume: 0.3 }));
        if (m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm, arquivo: "sfx/nota-3.wav", volume: 0.32 });
        break;
      case "destaque":
        lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/desce.wav" : "sfx/nota-3.wav", volume: 0.34 });
        break;
      case "definicao":
        lista.push({ em: m.significadoEm, arquivo: "sfx/nota-2.wav", volume: 0.3 });
        break;
      case "frase":
        if (m.risco && m.riscoEm !== undefined) lista.push({ em: m.riscoEm, arquivo: "sfx/nota-1.wav", volume: 0.3 });
        break;
      case "pergunta":
        m.opcoes?.forEach((o, k) => lista.push({ em: o.em, arquivo: nota(k), volume: 0.3 }));
        break;
      case "cta": {
        const faladas = palavras.filter((p) => p.em >= m.de - 0.1 && p.em < fimDe(m, plano));
        const fim = faladas.length ? faladas[faladas.length - 1].ate : m.ate;
        if (fim + 0.1 < plano.duracao - 0.2) lista.push({ em: fim + 0.1, arquivo: "sfx/fim.wav", volume: 0.26 });
        break;
      }
      default:
        break;
    }
  });
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Arte de quadro cheio que vem logo depois de uma tela dividida só entra quando a pessoa já cresceu
// e cobriu o painel (nada de tarja caindo em cima do gráfico que sai).
const inicioVisual = (m: Momento, plano: Plano) => {
  const anterior = [...plano.momentos].filter((o) => o.de < m.de).pop();
  if (anterior && ehPainel(anterior) && Math.abs(fimDe(anterior, plano) - m.de) < 0.3) return Math.max(m.de, m.de - ANTES + TROCA * 0.8);
  return m.de;
};

// Quando um painel aparece e some, e se ele entra ou sai pela cortina (painel colado a painel).
// Sem cortina, o painel já está pronto atrás da pessoa quando ela encolhe, e continua inteiro
// enquanto ela cresce por cima dele (a própria pessoa é a cortina).
const janelaDoPainel = (m: Momento, plano: Plano) => {
  const ms = plano.momentos;
  const i = ms.indexOf(m);
  const anterior = ms[i - 1];
  const proximo = ms[i + 1];
  const colaAntes = !!anterior && ehPainel(anterior) && Math.abs(fimDe(anterior, plano) - m.de) < 0.3;
  const colaDepois = !!proximo && ehPainel(proximo) && Math.abs(fimDe(m, plano) - proximo.de) < 0.3;
  const entrada = m.de - ANTES;
  const saida = fimDe(m, plano) - ANTES;
  return {
    colaAntes,
    colaDepois,
    entrada,
    saida,
    de: colaAntes ? entrada : entrada - 0.05,
    ate: colaDepois ? saida + CORTINA + 0.02 : saida + TROCA + 0.05,
  };
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, palavras), [plano, palavras]);
  const caixa = caixaNoTempo(t, estados);

  // a barra "EXPLICANDO" entra logo depois da vinheta; o relógio para na última palavra do vídeo
  const vinheta = plano.momentos.find((m) => m.tipo === "vinheta");
  const barraDe = plano.barra?.de ?? (vinheta ? fimDe(vinheta, plano) : 0.2);
  const ultimaPalavra = palavras.length ? palavras[palavras.length - 1].ate : plano.duracao;
  const temaEm = plano.barra?.temaEm ?? (plano.barra?.tema ? temposDoTexto(plano.barra.tema, palavras, barraDe, plano.duracao, barraDe + 0.3)[0] : undefined);
  const letreiroDe = plano.letreiro?.de ?? barraDe + 0.25;

  // as linhas da tela dividida: só nas bordas da caixa que ficam dentro do quadro
  const fioBaixo = limitar((H - (caixa.y + caixa.h)) / 60);
  const fioEsquerda = limitar(caixa.x / 40);
  const fioDireita = limitar((W - (caixa.x + caixa.w)) / 40);

  const paineis = plano.momentos.filter((m) => ehPainel(m));
  const artes = plano.momentos.filter((m) => !ehPainel(m));
  const base = LETREIRO.y - 32;
  // a altura que as tarjas de quadro cheio podem ocupar: do queixo até a base
  const alturaArte = base - topoDasArtes(plano);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.estudio }}>
      {/* 1. o estúdio e os painéis gráficos (por trás da pessoa: aparecem quando ela encolhe) */}
      <Estudio t={t} />
      {paineis.map((m) => {
        const j = janelaDoPainel(m, plano);
        if (t < j.de || t > j.ate) return null;
        const area = painelDe(quadroDe(m), plano);
        const props = { palavras, t, area, entra: j.de };
        const chave = `${m.tipo}-${m.de}`;
        let conteudo: React.ReactNode = null;
        switch (m.tipo) {
          case "grafico":
            conteudo = m.series?.length ? <Grafico m={m} {...props} /> : <GraficoDados m={m} {...props} />;
            break;
          case "etiqueta":
            conteudo = m.quadro === "lateral" ? <EtiquetaLateral m={m} {...props} /> : <EtiquetaDividida m={m} {...props} />;
            break;
          case "nota":
            conteudo = <Nota m={m} {...props} />;
            break;
          case "dado":
          case "numero":
            conteudo = <Dado m={m} {...props} />;
            break;
          case "topicos":
            conteudo = <Topicos m={m} {...props} />;
            break;
          case "passos":
            conteudo = <Passos m={m} {...props} />;
            break;
          case "comparacao":
            conteudo = <Comparacao m={m} {...props} />;
            break;
          case "frase":
            conteudo = <Frase m={m} {...props} />;
            break;
          case "pergunta":
            conteudo = <Enquete m={m} {...props} />;
            break;
          default:
            conteudo = null;
        }
        // a cortina: o que entra aparece à esquerda da faixa; o que sai fica à direita dela
        let recorte: string | undefined;
        if (j.colaAntes && t < j.entrada + CORTINA) recorte = `inset(0 ${Math.max(0, W - posicaoDaCortina(t, j.entrada))}px 0 0)`;
        else if (j.colaDepois && t > j.saida) recorte = `inset(0 0 0 ${Math.max(0, posicaoDaCortina(t, j.saida))}px)`;
        return (
          <div key={chave} style={{ position: "absolute", inset: 0, clipPath: recorte }}>
            {conteudo}
          </div>
        );
      })}
      {paineis.map((m) => {
        const j = janelaDoPainel(m, plano);
        if (!j.colaAntes || t < j.entrada || t > j.entrada + CORTINA) return null;
        const x = posicaoDaCortina(t, j.entrada);
        return <div key={`cortina-${m.de}`} style={{ position: "absolute", left: x - FAIXA / 2, top: 0, width: FAIXA, height: H, background: cor.eletrico }} />;
      })}

      {/* 2. a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />
      {fioBaixo > 0 ? <div style={{ position: "absolute", left: caixa.x, top: caixa.y + caixa.h - 3, width: caixa.w, height: 6, background: cor.eletrico, opacity: fioBaixo }} /> : null}
      {fioEsquerda > 0 ? <div style={{ position: "absolute", left: caixa.x - 3, top: caixa.y, width: 6, height: caixa.h, background: cor.eletrico, opacity: fioEsquerda }} /> : null}
      {fioDireita > 0 ? <div style={{ position: "absolute", left: caixa.x + caixa.w - 3, top: caixa.y, width: 6, height: caixa.h, background: cor.eletrico, opacity: fioDireita }} /> : null}

      {/* 3. artes de quadro cheio, na altura do peito */}
      {artes.map((m) => {
        const chave = `${m.tipo}-${m.de}`;
        const proximo = plano.momentos.find((o) => o.de > m.de);
        // a arte sai cruzando com a que entra (nenhum quadro sem arte, nenhum texto em cima de
        // outro); antes de uma tela dividida, sai enquanto a pessoa encolhe
        const colado = proximo && Math.abs(fimDe(m, plano) - proximo.de) < 0.3;
        const fim = proximo && ehPainel(proximo) ? fimDe(m, plano) : fimDe(m, plano) + (m.tipo === "vinheta" ? 0.1 : colado ? 0.02 : 0.1);
        const visual = { ...m, de: inicioVisual(m, plano) };
        const comum = { palavras, t, base, fim, alturaMax: alturaArte };
        switch (visual.tipo) {
          case "vinheta":
            return <Vinheta key={chave} m={visual} palavras={palavras} t={t} topo={Math.max(zona.topo, topoDasArtes(plano))} fim={fim} />;
          case "manchete":
            return <Manchete key={chave} m={visual} plano={plano} {...comum} />;
          case "abertura":
            return <Abertura key={chave} m={visual} plano={plano} {...comum} />;
          case "destaque":
            return <Destaque key={chave} m={visual} {...comum} />;
          case "definicao":
            return <Definicao key={chave} m={visual} {...comum} />;
          case "pergunta":
            return <PerguntaGc key={chave} m={visual} {...comum} />;
          case "cta":
            return <Cta key={chave} m={visual} plano={plano} {...comum} />;
          default:
            return null;
        }
      })}

      {/* 4. a moldura do telejornal: barra "EXPLICANDO" com relógio, letreiro e legenda */}
      <Barra
        t={t}
        de={barraDe}
        fim={ultimaPalavra}
        texto={plano.barra?.texto ?? "Explicando"}
        tema={plano.barra?.tema}
        temaEm={temaEm}
        meta={plano.barra?.meta}
      />
      {plano.letreiro?.itens?.length ? <Letreiro t={t} de={letreiroDe} rotulo={plano.letreiro.rotulo ?? "Resumo"} itens={plano.letreiro.itens} /> : null}
      <Legendas frases={frases} />

      {guias ? <Guias plano={plano} topo={zona.topo} /> : null}

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
