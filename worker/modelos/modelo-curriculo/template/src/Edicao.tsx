import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { temposDesde, useTempo } from "./anim";
import { trechoNoTexto } from "./medida";
import { folhaNoTempo, janelaNoTempo, lugarDoMomento, lugarNoTempo, montarCena, temposDaReescrita, tempoDaVolta, tempoDoRisco } from "./cena";
import { Abertura } from "./componentes/Abertura";
import { Comentario } from "./componentes/Comentario";
import { Contador } from "./componentes/Contador";
import { Cta } from "./componentes/Cta";
import { Destaque, NotaPergunta } from "./componentes/Destaque";
import { Folha } from "./componentes/Folha";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Mostrador } from "./componentes/Mostrador";
import { montarFolha, ordenar } from "./documento";
import { montarFrases } from "./motor/frases";
import type { Comparacao, Definicao, Destaque as TipoDestaque, Frase, Grafico, Momento, Numero, Pergunta, Plano } from "./plano";
import { cor, fontesCarregadas, LIMITE_APP, zona as zonaPadrao } from "./tema";

// Só desenha depois que as fontes carregaram: a folha mede o texto com a própria fonte.
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

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte.
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

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: a folha que chega, cada marca de erro (uma nota que sobe a cada erro),
// a troca aceita, o cronômetro que fecha e o fechamento. Nunca dois sons colados (0,45 s).
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const momentos = ordenar(plano);
  momentos.forEach((m, i) => {
    const antes = momentos[i - 1];
    const lugar = lugarDoMomento(m);
    if (lugar !== "cheio" && (!antes || lugarDoMomento(antes) === "cheio" || m.de - antes.ate > 0.15)) {
      lista.push({ em: m.de, arquivo: "sfx/folha.wav", volume: 0.5 });
    }
    const nota = (erro?: number) => `sfx/caneta-${Math.min(3, Math.max(1, erro ?? 1))}.wav`;
    switch (m.tipo) {
      case "paginas":
        lista.push({ em: m.xEm, arquivo: nota(m.erro), volume: 0.5 });
        break;
      case "riscar":
        lista.push({ em: tempoDoRisco(m, plano), arquivo: nota(m.erro), volume: 0.5 });
        break;
      case "marcar":
        lista.push({ em: m.nota?.em ?? m.linhas[0]?.em ?? m.de, arquivo: nota(m.erro), volume: 0.5 });
        break;
      case "reescrever":
        lista.push({ em: temposDaReescrita(m, plano).aceita, arquivo: "sfx/aceita.wav", volume: 0.42 });
        break;
      case "cronometro":
        lista.push({ em: tempoDaVolta(m), arquivo: "sfx/relogio.wav", volume: 0.5 });
        break;
      case "cta":
        lista.push({ em: m.de + 0.35, arquivo: "sfx/fim.wav", volume: 0.4 });
        break;
      // blocos universais: uma nota de caneta na marca principal de cada um
      case "destaque":
        lista.push({ em: (m as TipoDestaque).em, arquivo: nota((m as TipoDestaque).nivel === "chave" ? 1 : 3), volume: 0.45 });
        break;
      case "numero":
        lista.push({ em: (m as Numero).em + 1.0, arquivo: nota(2), volume: 0.45 });
        break;
      case "definicao":
        lista.push({ em: (m as Definicao).significadoEm, arquivo: nota(1), volume: 0.45 });
        break;
      case "comparacao": {
        const c = m as Comparacao;
        if (c.vencedor !== undefined || c.modo === "errado-certo") lista.push({ em: c.vencedorEm ?? c.lados[1].em + 0.8, arquivo: "sfx/aceita.wav", volume: 0.4 });
        else lista.push({ em: c.lados[1].em, arquivo: nota(2), volume: 0.42 });
        break;
      }
      case "grafico": {
        const g = m as Grafico;
        const ultimo = g.dados?.length ? g.dados[g.dados.length - 1].em : (g.tendenciaEm ?? g.de + 0.45) + 1.3;
        lista.push({ em: ultimo, arquivo: nota(2), volume: 0.42 });
        break;
      }
      case "frase": {
        const f = m as Frase;
        const risco = trechoNoTexto(f.texto, f.risco);
        if (risco) {
          const tempos = temposDesde(f.texto, plano.palavras, f.em ?? f.de, f.ate, 0.14);
          lista.push({ em: f.riscoEm ?? (tempos[risco[1]] ?? f.de) + 0.15, arquivo: nota(3), volume: 0.45 });
        }
        break;
      }
      case "pergunta":
        lista.push({ em: Math.max(m.de + 0.62, (m as Pergunta).em ?? m.de), arquivo: nota(1), volume: 0.42 });
        break;
      case "topicos":
      case "passos":
        if (m.itens.length) lista.push({ em: m.itens[m.itens.length - 1].em, arquivo: nota(2), volume: 0.4 });
        break;
    }
  });
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Zoom seco nos cortes que caem no meio de um trecho (disfarça o pulo); alterna 1 e 1,06.
const zoomDosCortes = (plano: Plano, inicios: number[]) => {
  const trocas: { de: number; z: number }[] = [{ de: -10, z: 1 }];
  let ultimo = -10;
  for (const c of plano.cortesEm ?? []) {
    if (inicios.some((d) => Math.abs(c - d) < 0.8) || c - ultimo < 1.2) continue;
    trocas.push({ de: c, z: trocas[trocas.length - 1].z === 1 ? 1.06 : 1 });
    ultimo = c;
  }
  return trocas;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = (props) => {
  const prontas = useFontes();
  return prontas ? <EdicaoPronta {...props} /> : null;
};

const EdicaoPronta: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const momentos = useMemo(() => ordenar(plano), [plano]);
  const folha = useMemo(() => montarFolha(plano), [plano]);
  const cena = useMemo(() => montarCena(plano, folha), [plano, folha]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const zooms = useMemo(() => zoomDosCortes(plano, cena.trechos.map((tr) => tr.de)), [plano, cena]);
  const zoomExtra = [...zooms].reverse().find((z) => t >= z.de)?.z ?? 1;

  const area = { x: zona.esquerda, y: zona.topo, w: 1080 - zona.esquerda - zona.direita, h: zona.altura };
  const cheio = lugarNoTempo(t, cena).lugar === "cheio";
  const legendaY = cheio ? Math.min(1462, zona.topo + zona.altura + 22) : 1446;

  const visiveis = momentos.map((m) => ({ m, fim: fimDoMomento(m, plano) })).filter(({ m, fim }) => t >= m.de - 0.1 && t <= fim + 0.6);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.mesa }}>
      {Array.from({ length: cena.n }, (_, k) => (
        <Folha key={`folha-${k}`} plano={plano} folha={folha} momentos={momentos} t={t} k={k} pos={folhaNoTempo(t, cena, k)} />
      ))}

      {visiveis.map(({ m, fim }) =>
        m.tipo === "paginas" ? (
          <Contador key={`c-${m.de}`} m={m} t={t} fim={fim} alturaFolha={folha.altura} />
        ) : m.tipo === "cronometro" ? (
          <Mostrador key={`r-${m.de}`} m={m} t={t} fim={fim} palavras={plano.palavras} />
        ) : m.tipo === "pergunta" ? (
          <NotaPergunta key={`p-${m.de}`} de={m.de} em={m.em ?? m.de} fim={fim} t={t} />
        ) : null,
      )}

      <Comentario plano={plano} cena={cena} momentos={momentos} t={t} zoomExtra={zoomExtra} />

      {visiveis.map(({ m, fim }) =>
        m.tipo === "abertura" ? (
          <Abertura key={`a-${m.de}`} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} />
        ) : m.tipo === "destaque" ? (
          <Destaque key={`d-${m.de}`} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} />
        ) : m.tipo === "cta" ? (
          <Cta key={`f-${m.de}`} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} marca={plano.marca} />
        ) : null,
      )}

      <Legendas frases={frases} y={Math.min(legendaY, LIMITE_APP - 90)} />

      {guias ? <Guias plano={plano} zona={zona} legendaY={legendaY} janela={janelaNoTempo(t, cena)} /> : null}

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
