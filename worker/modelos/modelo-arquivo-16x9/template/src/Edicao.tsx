import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { Camadas } from "./componentes/Camadas";
import { Comparacao } from "./componentes/Comparacao";
import { Credito } from "./componentes/Credito";
import { Cta } from "./componentes/Cta";
import { Definicao } from "./componentes/Definicao";
import { Destaque } from "./componentes/Destaque";
import { Escala } from "./componentes/Escala";
import { FichaLarga } from "./componentes/Ficha";
import { Frase } from "./componentes/Frase";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Linha } from "./componentes/Linha";
import { Local } from "./componentes/Local";
import { Pagina } from "./componentes/Pagina";
import { Numero } from "./componentes/Numero";
import { Passos } from "./componentes/Passos";
import { Pergunta } from "./componentes/Pergunta";
import { Pessoa } from "./componentes/Pessoa";
import { PessoasLarga } from "./componentes/Pessoas";
import { Topicos } from "./componentes/Topicos";
import {
  alternarLayouts,
  BORDA,
  estadosDaPessoa,
  extrasNoTempo,
  faixasDoPassado,
  fotoPorCima,
  layoutDe,
  naFolha,
  passadoNoTempo,
  regiaoDoLayout,
  type Regiao,
} from "./layout";
import { caixaNoTempo, CHEIO_16x9 } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { BASE_COM_LEGENDA, BASE_SUPERS, cor, LARGURA_SUPERS, QUADRO, zona as zonaPadrao } from "./tema";

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  // documento de folha que sai para a tela cheia: fica parado embaixo da foto, que cresce por cima
  // dele, e só sai quando ela já cobriu a tela (nenhum quadro com a foto solta numa folha vazia).
  if (naFolha(m)) {
    const proximo = plano.momentos.filter((o) => o.de > m.de).sort((a, b) => a.de - b.de)[0];
    if (!proximo || !naFolha(proximo) || proximo.de - m.ate > 0.3) return m.ate + 0.62;
  }
  return m.ate;
};

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte, e a foto muda de
// lugar entre dois documentos seguidos (alternarLayouts).
const comCapa = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  const cortados = ordenados.map((m, i) => {
    const proximo = ordenados[i + 1];
    return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
  });
  return { ...plano, momentos: alternarLayouts(cortados) };
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: a imagem que vira arquivo, a folha que muda, o carimbo, a medida que fecha,
// a peça colocada, a régua do tempo e a assinatura. Nunca dois sons colados (0,45 s de intervalo).
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  for (const f of faixasDoPassado(plano)) lista.push({ em: f.de, arquivo: "sfx/arquivo.wav", volume: 0.5 });
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  momentos.forEach((m, i) => {
    const antes = momentos[i - 1];
    if (naFolha(m) && (!antes || layoutDe(antes) !== layoutDe(m))) lista.push({ em: m.de, arquivo: "sfx/folha.wav", volume: 0.55 });
    switch (m.tipo) {
      case "ficha":
        if (m.carimbo) lista.push({ em: m.carimbo.em, arquivo: "sfx/carimbo.wav", volume: 0.6 });
        break;
      case "local":
        lista.push({ em: m.coordenadas.em + 0.8, arquivo: "sfx/nota-3.wav", volume: 0.35 });
        break;
      case "escala": {
        const ultima = [...m.partes].sort((a, b) => b.em - a.em)[0];
        if (ultima) lista.push({ em: ultima.em + 0.85, arquivo: "sfx/nota-4.wav", volume: 0.38 });
        break;
      }
      case "camadas":
        if (m.destaque) lista.push({ em: m.destaque.em + 0.45, arquivo: "sfx/nota-2.wav", volume: 0.36 });
        break;
      case "pessoas":
        if (m.ligacao) lista.push({ em: m.ligacao.em + 0.8, arquivo: "sfx/nota-1.wav", volume: 0.32 });
        break;
      case "linha":
        if (m.marcos[1]) lista.push({ em: m.marcos[1].em, arquivo: "sfx/linha.wav", volume: 0.45 });
        if (m.carimbo) lista.push({ em: m.carimbo.em, arquivo: "sfx/carimbo.wav", volume: 0.6 });
        break;
      case "cta":
        lista.push({ em: (m.em ?? m.textoEm ?? m.de) + 0.35, arquivo: "sfx/nota-1.wav", volume: 0.35 });
        break;
      case "numero":
        lista.push({ em: m.em, arquivo: "sfx/linha.wav", volume: 0.42 });
        break;
      case "destaque":
        lista.push((m.nivel ?? "alerta") === "alerta" ? { em: m.em, arquivo: "sfx/carimbo.wav", volume: 0.6 } : { em: m.em + 0.2, arquivo: "sfx/nota-2.wav", volume: 0.34 });
        break;
      case "frase":
        if (m.risco && m.riscoEm !== undefined) lista.push({ em: m.riscoEm, arquivo: "sfx/nota-2.wav", volume: 0.34 });
        break;
      case "pergunta":
        lista.push({ em: (m.em ?? m.de) + 0.05, arquivo: "sfx/nota-3.wav", volume: 0.32 });
        break;
      case "topicos": {
        const ultimo = m.itens[m.itens.length - 1];
        if (ultimo) lista.push({ em: ultimo.em + 0.2, arquivo: "sfx/nota-3.wav", volume: 0.3 });
        break;
      }
      case "passos":
        m.itens.slice(1).forEach((it, k) => lista.push({ em: it.em + 0.3, arquivo: `sfx/nota-${(k % 4) + 1}.wav`, volume: 0.28 }));
        break;
      case "comparacao":
        if (m.vencedor !== undefined || m.modo === "errado-certo") {
          lista.push({ em: m.vencedorEm ?? Math.max(...m.lados.map((l) => l.em)) + 0.9, arquivo: "sfx/nota-4.wav", volume: 0.36 });
        }
        break;
      case "grafico": {
        const primeiro = m.dados?.length ? m.dados[0].em : (m.tendenciaEm ?? m.de + 0.4);
        lista.push({ em: primeiro, arquivo: "sfx/linha.wav", volume: 0.4 });
        break;
      }
      case "definicao":
        lista.push({ em: m.significadoEm, arquivo: "sfx/nota-3.wav", volume: 0.32 });
        break;
    }
  });
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Quanto tempo o documento que sai ainda fica na tela (desliza para fora cruzando com o próximo)
const SAIDA = 0.35;
// Entre duas folhas com a foto mudando de lugar, o documento novo espera a foto passar
const ESPERA_FOTO = 0.2;
const ESPERA_CHEIO = 0.42;
const ESPERA_SUPER = 0.1;

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano), [plano]);
  const faixas = useMemo(() => faixasDoPassado(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const folhas = useMemo(() => plano.momentos.filter(naFolha).map((m) => ({ de: m.de })), [plano]);
  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  const { rot, borda } = extrasNoTempo(t, estados);
  const passado = passadoNoTempo(t, faixas);
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);

  // supers em tela cheia: no terço de baixo, do queixo (zona.topo) até acima dos controles do player
  // (ou da legenda). No quadro deitado a faixa é baixa e larga: os supers se arrumam em fileiras.
  // Queixo muito baixo: a faixa sobe o mínimo para ter 220 px.
  const areaDosSupers = (comLegenda: boolean) => {
    const base = comLegenda ? BASE_COM_LEGENDA : BASE_SUPERS;
    const topo = Math.max(0, Math.min(zona.topo, base - 220));
    return { x: zona.esquerda, y: topo, w: Math.min(LARGURA_SUPERS, QUADRO.w - zona.esquerda - zona.direita), h: base - topo };
  };
  const areaSupers = areaDosSupers(false);

  const visiveis = plano.momentos
    .map((m) => ({ m, fim: fimDoMomento(m, plano) }))
    .filter(({ m, fim }) => t >= m.de - 0.05 && t <= fim + SAIDA);

  let regiaoAtual: Regiao | null = null;

  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  const desenhar = (original: Momento, fim: number) => {
    const antes = ordenados[ordenados.indexOf(original) - 1];
    const trocaDeFolha = naFolha(original) && antes && naFolha(antes) && layoutDe(antes) !== layoutDe(original) && original.de - antes.ate < 0.35;
    // da folha para a tela cheia: os supers esperam a foto crescer (texto claro não se lê no papel)
    const voltaAoCheio = !naFolha(original) && antes && naFolha(antes) && original.de - antes.ate < 0.35;
    // super depois de super em tela cheia: espera o anterior sair (os dois ficam no terço de baixo)
    const superAposSuper = !naFolha(original) && antes && !naFolha(antes) && original.de - antes.ate < 0.35;
    const espera = trocaDeFolha ? ESPERA_FOTO : voltaAoCheio ? ESPERA_CHEIO : superAposSuper ? ESPERA_SUPER : 0;
    const m = espera ? { ...original, de: original.de + espera } : original;
    const regiao = regiaoDoLayout(layoutDe(m), !!m.legenda);
    const area = areaDosSupers(!!m.legenda);
    if (naFolha(m)) regiaoAtual = regiao;
    const chave = `${original.tipo}-${original.de}`;
    switch (m.tipo) {
      case "credito":
        return <Credito key={chave} m={m} t={t} fim={fim} area={area} />;
      case "ficha":
        // no quadro deitado o documento sempre tem o quadro largo da esquerda: a ficha larga
        return <FichaLarga key={chave} m={m} t={t} fim={fim} regiao={regiao} />;
      case "local":
        return <Local key={chave} m={m} t={t} fim={fim} regiao={regiao} />;
      case "escala":
        return <Escala key={chave} m={m} t={t} fim={fim} regiao={regiao} />;
      case "camadas":
        return <Camadas key={chave} m={m} t={t} fim={fim} regiao={regiao} />;
      case "pessoas":
        return <PessoasLarga key={chave} m={m} t={t} fim={fim} regiao={regiao} palavras={plano.palavras} />;
      case "linha":
        return <Linha key={chave} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} />;
      case "cta":
        return <Cta key={chave} m={m} marca={plano.marca} t={t} fim={fim} area={area} />;
      case "abertura":
        return <Abertura key={chave} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} assunto={plano.assunto} />;
      case "numero":
        return <Numero key={chave} m={m} t={t} fim={fim} area={area} />;
      case "destaque":
        return <Destaque key={chave} m={m} t={t} fim={fim} area={area} />;
      case "frase":
        return <Frase key={chave} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} />;
      case "pergunta":
        return <Pergunta key={chave} m={m} t={t} fim={fim} area={area} palavras={plano.palavras} />;
      case "topicos":
        return <Topicos key={chave} m={m} t={t} fim={fim} regiao={regiao} layout={layoutDe(m)} />;
      case "passos":
        return <Passos key={chave} m={m} t={t} fim={fim} regiao={regiao} layout={layoutDe(m)} />;
      case "comparacao":
        return <Comparacao key={chave} m={m} t={t} fim={fim} regiao={regiao} layout={layoutDe(m)} />;
      case "grafico":
        return <Grafico key={chave} m={m} t={t} fim={fim} regiao={regiao} layout={layoutDe(m)} />;
      case "definicao":
        return <Definicao key={chave} m={m} t={t} fim={fim} regiao={regiao} layout={layoutDe(m)} />;
    }
  };
  // os supers de tela cheia ficam numa camada acima do vídeo; os documentos de folha, abaixo dele
  // quando a foto está se movendo ou em tela cheia (fotoPorCima)
  const camadas = visiveis.map(({ m, fim }) => (
    <div key={`c-${m.tipo}-${m.de}`} style={{ position: "absolute", inset: 0, zIndex: naFolha(m) ? undefined : 15 }}>
      {desenhar(m, fim)}
    </div>
  ));

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      <Pagina t={t} visivel={limitar(borda / BORDA)} assunto={plano.assunto} folhas={folhas} />

      <Pessoa src={plano.video} caixa={caixa} rot={rot} borda={borda} rosto={plano.rosto} videoAltura={videoAltura} passado={passado} porCima={fotoPorCima(t, estados)} />

      {camadas}

      <Legendas frases={frases} />

      {guias ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 30 }}>
          <Guias plano={plano} area={areaSupers} caixa={caixa} regiao={regiaoAtual} />
        </div>
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
