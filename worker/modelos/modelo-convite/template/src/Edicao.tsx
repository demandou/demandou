import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, mistura, prog, troca, useTempo } from "./anim";
import { CartaoComparacao, CartaoGrafico, CartaoMarco, CartaoPassos, CartaoTopicos } from "./componentes/Cartoes";
import { Contagem, type MarcaDoMostrador, MostradorGrafico, MostradorVersus } from "./componentes/Contagem";
import { Abertura, AssinaturaMini, areaDoTexto, MolduraDoArco, PapelDoConvite } from "./componentes/Convite";
import { Fita } from "./componentes/Fita";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import {
  AberturaNoConvite,
  DefinicaoNoConvite,
  DestaqueNoConvite,
  Fechamento,
  FraseNoConvite,
  NumeroNoConvite,
  PerguntaNoConvite,
} from "./componentes/NoConvite";
import { Linho } from "./componentes/Papel";
import { DURACAO_QUEDA, Pilha } from "./componentes/Pilha";
import { Selo } from "./componentes/Selo";
import {
  type Carta,
  comCapa,
  type Corrida,
  estadoNoTempo,
  montarCartas,
  montarCorridas,
  montarTrechos,
  misturarRet,
  naPilha,
  numeroDoMarco,
  numeroEmDo,
  type Quadro,
  quadroDe,
  type Trecho,
} from "./layout";
import { avisarFontesProntas } from "./medida";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Marco, Momento, Plano } from "./plano";
import { ARCO_CONVITE, ARCO_MINI, CONTAGEM, fontesProntas, formatar, H, type Rect, romano, W } from "./tema";

type Som = { em: number; arquivo: string; volume: number; prioridade: number };

// tamanho do lacre e enquadramento da pessoa acompanham a largura da foto em arco
const fracaoDoArco = (a: Rect) => limitar((a.w - ARCO_MINI.w) / (ARCO_CONVITE.w - ARCO_MINI.w));
const diametroDoSelo = (a: Rect) => mistura(100, 166, fracaoDoArco(a));

// Quando o lacre estampa: a primeira vez (abertura) e as re-estampas (destaque, frase com `seloEm`,
// fechamento).
const estampas = (plano: Plano) => {
  const lista: number[] = [];
  plano.momentos.forEach((m, i) => {
    if (m.tipo === "convite") lista.push(m.seloEm ?? m.de + 1.2);
    if (m.tipo === "abertura") lista.push(m.seloEm ?? (i === 0 ? Math.max(0.75, (m.em ?? m.de) + 1.2) : (m.em ?? m.de) + 0.6));
    if (m.tipo === "frase" && m.seloEm !== undefined) lista.push(m.seloEm);
    if (m.tipo === "destaque") lista.push(m.em + 0.1);
    if (m.tipo === "cta") lista.push(m.seloEm ?? m.de + 0.15);
  });
  if (lista.length === 0 || Math.min(...lista) > 2.5) lista.push(0.75);
  const ordenada = lista.sort((a, b) => a - b);
  // nunca duas estampas coladas (a segunda espera o sinete subir de novo)
  return ordenada.filter((s, i) => i === 0 || s - ordenada[i - 1] > 0.9);
};

// Som raro e tonal: um baque grave de cera quando o lacre estampa, uma nota (subindo a cada cartão)
// quando um cartão pousa na pilha, um sopro grave quando uma fita entra e um acorde curto no fechamento.
const sons = (plano: Plano, corridas: Corrida[], quedas: number[], selos: number[]): Som[] => {
  const lista: Som[] = [];
  const cta = plano.momentos.find((m) => m.tipo === "cta");
  selos.forEach((s) => {
    const ehCta = cta && s >= cta.de - 0.05;
    lista.push({ em: s + 0.06, arquivo: ehCta ? "sfx/salva.wav" : "sfx/selo.wav", volume: ehCta ? 0.42 : 0.5, prioridade: 3 });
  });
  quedas.forEach((q, i) => lista.push({ em: q + DURACAO_QUEDA * 0.62, arquivo: `sfx/pousa-${(i % 5) + 1}.wav`, volume: 0.4, prioridade: 2 }));
  corridas.forEach((c) => {
    if (c.entra > 0) lista.push({ em: c.entra - 0.05, arquivo: "sfx/fita.wav", volume: 0.32, prioridade: 1 });
  });
  // nunca dois sons colados: quando dois caem juntos, fica o de maior prioridade
  const saida: Som[] = [];
  for (const s of [...lista].sort((a, b) => b.prioridade - a.prioridade || a.em - b.em)) {
    if (saida.every((o) => Math.abs(o.em - s.em) > 0.4)) saida.push(s);
  }
  return saida.sort((a, b) => a.em - b.em);
};

const CHEIO: Rect = { x: 0, y: 0, w: W, h: H };

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  // o texto é medido com as fontes de verdade: o quadro só é capturado depois que elas carregam
  const [pronto, setPronto] = useState(false);
  const [espera] = useState(() => delayRender("fontes do Convite"));
  useEffect(() => {
    let vivo = true;
    const liberar = () => {
      avisarFontesProntas();
      if (vivo) setPronto(true);
    };
    fontesProntas().then(liberar, liberar);
    return () => {
      vivo = false;
    };
  }, []);
  useEffect(() => {
    if (pronto) continueRender(espera);
  }, [pronto, espera]);

  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const trechos = useMemo(() => montarTrechos(plano), [plano]);
  const quadros = useMemo(() => trechos.map((tr) => quadroDe(tr)), [trechos]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const corridas = useMemo(() => montarCorridas(plano, trechos), [plano, trechos]);
  const cartas = useMemo(() => montarCartas(plano, trechos), [plano, trechos]);
  const quedas = useMemo(() => cartas.map((c) => c.queda), [cartas]);
  const selos = useMemo(() => estampas(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, corridas, quedas, selos), [plano, corridas, quedas, selos]);
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  // marcos da mesma sequência mostram o mesmo mostrador (o número só rola)
  const ids = useMemo(
    () => trechos.map((_, k) => corridas.find((c) => c.tipo === "marco" && c.ks.includes(k))?.id ?? `t${k}`),
    [trechos, corridas],
  );

  const estado = estadoNoTempo(t, trechos, quadros, ids);
  const q: Quadro = estado.quadro;

  // abertura: o vídeo começa cheio e se fecha na foto em arco do convite
  const pIntro = prog(t, 0.04, 0.62, troca);
  const arco = pIntro < 1 ? misturarRet(CHEIO, q.arco, pIntro) : q.arco;
  const raio = (arco.w / 2) * (pIntro < 1 ? pIntro : 1);
  const f = fracaoDoArco(q.arco);
  // na foto pequena do rosto fica mais perto (≥ 270 px) e um pouco mais baixo, para o arco nunca
  // cortar o cabelo
  const zoomArco = mistura(1.55, 1.2, f) * (plano.pessoa?.zoom ?? 1);
  const ancora = (plano.pessoa?.ancoraY ?? 0.4) + mistura(0.06, 0, f);
  const caixa = {
    ...arco,
    raio: 0,
    zoom: mistura(1, zoomArco, pIntro),
    ancoraY: mistura(0.3, ancora, pIntro),
  };

  // lacre: estampa na primeira vez; nas seguintes, o sinete levanta e estampa de novo
  const s0 = selos[0];
  const pSelo = limitar((t - (s0 - 0.22)) / 0.5);
  const levanta = selos.slice(1).reduce((v, s) => {
    const sobe = prog(t, s - 0.42, 0.24);
    const desce = prog(t, s - 0.12, 0.2);
    return Math.max(v, sobe * (1 - desce));
  }, 0);
  const diametro = diametroDoSelo(arco);
  // no último instante do vídeo, um reflexo de luz atravessa o lacre (o fim nunca fica parado)
  const reflexo = prog(t, plano.duracao - 0.82, 0.68, troca);

  // conteúdo do convite: o do trecho atual entra no fim da troca; o do anterior some no começo
  const k = estado.atual;
  const momentoDe = (j: number): Momento | null => (j >= 0 && trechos[j] && trechos[j].indice >= 0 ? plano.momentos[trechos[j].indice] : null);
  // vindo da mesa, o texto novo só aparece quando o convite já cobriu o cartão da pilha
  const vemDaPilha = k > 0 && naPilha(trechos[k - 1].modo) && !naPilha(trechos[k].modo);
  const opacidadeDe = (j: number) => {
    if (j === k) return k === 0 ? prog(t, 0.5, 0.3) : vemDaPilha ? prog(estado.p, 0.88, 0.12, (x) => x) : prog(estado.p, 0.42, 0.4);
    // o que sai some logo no começo da troca, antes de qualquer texto novo aparecer
    if (j === k - 1) return 1 - prog(t, trechos[k].troca, 0.2, (x) => x);
    return 0;
  };
  const area = areaDoTexto(q.cartao, q.arco, diametroDoSelo(q.arco));
  const conteudo = (j: number) => {
    const op = opacidadeDe(j);
    if (op <= 0.001 || !trechos[j]) return null;
    const m = momentoDe(j);
    const chave = `c-${j}`;
    if (naPilha(trechos[j].modo)) return <AssinaturaMini key={chave} plano={plano} c={q.cartao} opacidade={op * prog(estado.p, 0.7, 0.3)} />;
    if (!m) return null;
    const qa = quadros[j];
    const alvo = areaDoTexto(qa.cartao, qa.arco, diametroDoSelo(qa.arco));
    const props = { t, palavras: plano.palavras, area, alvo, opacidade: op, plano };
    switch (m.tipo) {
      case "convite":
        return <Abertura key={chave} m={m} t={t} palavras={plano.palavras} area={area} alvo={alvo} opacidade={op} />;
      case "abertura":
        return <AberturaNoConvite key={chave} m={m} {...props} />;
      case "numero":
        return <NumeroNoConvite key={chave} m={m} {...props} />;
      case "definicao":
        return <DefinicaoNoConvite key={chave} m={m} {...props} />;
      case "destaque":
        return <DestaqueNoConvite key={chave} m={m} {...props} />;
      case "frase":
        return <FraseNoConvite key={chave} m={m} {...props} />;
      case "pergunta":
        return <PerguntaNoConvite key={chave} m={m} {...props} />;
      case "cta":
        return <Fechamento key={chave} m={m} {...props} />;
      default:
        return null;
    }
  };

  // o mostrador do trecho da vez (marcos: a contagem da sequência; passos: I, II, III; tópicos: 1, 2, 3;
  // comparação: as duas metades; gráfico: o valor ou a seta)
  const mostrador = (j: number) => {
    const m = momentoDe(j);
    if (!m || q.contagem <= 0.001) return null;
    const base = { t, cx: q.contagemX, cy: CONTAGEM.cy, r: CONTAGEM.r, visivel: q.contagem };
    if (m.tipo === "marco") {
      const c = corridas.find((x) => x.ks.includes(j));
      const marcos: MarcaDoMostrador[] = (c?.ks ?? [j]).map((kk, pos) => {
        const mm = plano.momentos[trechos[kk].indice] as Marco;
        return { numero: numeroDoMarco(mm, pos), unidade: mm.unidade, numeroEm: numeroEmDo(mm) };
      });
      return <Contagem marcos={marcos} {...base} />;
    }
    if (m.tipo === "passos" || m.tipo === "topicos") {
      const itens = m.itens.slice(0, 5);
      const marcos = itens.map((it, i) => ({ numero: m.tipo === "passos" ? romano(i + 1) : String(i + 1), numeroEm: it.em }));
      return <Contagem marcos={marcos} ticks={itens.length} {...base} />;
    }
    if (m.tipo === "comparacao") return <MostradorVersus {...base} ems={[m.lados[0].em, m.lados[1].em]} vencedor={m.vencedor} vencedorEm={m.vencedorEm} modo={m.modo} />;
    if (m.tipo === "grafico") {
      const dados = (m.dados ?? []).slice(0, 6).map((d) => ({ valor: d.valor, em: d.em, texto: formatar(d.valor, Number.isInteger(d.valor) ? 0 : 1) }));
      return (
        <MostradorGrafico
          {...base}
          dados={dados.length ? dados : undefined}
          tendencia={m.tendencia ?? "sobe"}
          tendenciaEm={m.tendenciaEm ?? m.de + 0.3}
          unidade={m.unidade}
          ilustrativo={m.ilustrativo || !dados.length}
        />
      );
    }
    return null;
  };

  // o miolo de cada cartão da pilha
  const miolo = (i: number, pousou: number) => {
    const carta: Carta = cartas[i];
    const m = plano.momentos[carta.indice];
    const props = { t, palavras: plano.palavras, pousou };
    switch (m.tipo) {
      case "marco": {
        const c = corridas.find((x) => x.ks.includes(carta.k));
        const pos = c ? c.ks.indexOf(carta.k) : 0;
        return <CartaoMarco m={m} numero={numeroDoMarco(m, pos)} {...props} />;
      }
      case "passos":
        return <CartaoPassos m={m} {...props} />;
      case "topicos":
        return <CartaoTopicos m={m} {...props} />;
      case "comparacao":
        return <CartaoComparacao m={m} {...props} />;
      case "grafico":
        return <CartaoGrafico m={m} {...props} />;
      default:
        return null;
    }
  };

  // legenda: só nos trechos sem momento, dentro do convite grande, embaixo do lacre
  const livre = trechos[k]?.indice === -1 && trechos[k]?.modo === "convite";
  const legendaY = (area.topo + area.base) / 2 - 90;
  const algumaCarta = cartas.length > 0;

  return (
    <AbsoluteFill>
      <Linho />

      {estado.mostrador >= 0 ? mostrador(estado.mostrador) : null}
      <Pilha
        cartas={cartas}
        quedas={quedas}
        t={t}
        conteudo={miolo}
        leque={q.leque}
        visivel={Math.max(q.pilha, algumaCarta ? 1 : 0)}
        rascunho={q.pilha * (1 - q.leque) * (quedas.length && t > quedas[0] + DURACAO_QUEDA ? 0 : 1)}
      />
      {corridas.map((c) => (
        <Fita key={c.id} id={c.id} marcos={c.marcas} t={t} entra={c.entra} sai={c.sai} some={c.some} visivel={t >= c.entra ? 1 : 0} />
      ))}

      <PapelDoConvite r={q.cartao} />

      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.96)"
        estilo={{ borderRadius: `${raio}px ${raio}px 0 0 / ${raio}px ${raio}px 0 0` }}
      />
      {/* o fio fino da foto colada no papel */}
      <div
        style={{
          position: "absolute",
          left: arco.x,
          top: arco.y,
          width: arco.w,
          height: arco.h,
          borderRadius: `${raio}px ${raio}px 0 0 / ${raio}px ${raio}px 0 0`,
          boxShadow: "inset 0 0 0 1.5px rgba(58,42,34,0.35), inset 0 -40px 60px rgba(58,42,34,0.12)",
          opacity: pIntro,
        }}
      />
      <MolduraDoArco a={arco} visivel={pIntro} />
      <Selo cx={arco.x + arco.w / 2} cy={arco.y + arco.h} diametro={diametro} p={pSelo} letra={plano.monograma ?? plano.marca.nome} levanta={levanta} reflexo={reflexo} />

      {conteudo(k - 1)}
      {conteudo(k)}

      {livre ? <Legendas frases={frases} x={area.x} w={area.w} y={legendaY} opacidade={opacidadeDe(k)} /> : null}

      {guias ? <Guias plano={plano} arco={arco} legendaY={livre ? legendaY : null} /> : null}

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

export type { Trecho };
