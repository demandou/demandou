import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { mistura, prog, useTempo } from "./anim";
import { DURACAO_QUEDA, type EstadoDaCozinha, estadoDaCozinha, geometriaDoTrecho, montarEventos } from "./cena";
import { Bancada, Quedas } from "./componentes/Bancada";
import { CartaoDica, Fechamento } from "./componentes/Fechamento";
import { Ficha, retArredondado } from "./componentes/Ficha";
import { Guias } from "./componentes/Guias";
import { Ingredientes } from "./componentes/Ingredientes";
import { Legendas } from "./componentes/Legendas";
import { Anotacoes, CabecalhoDoPasso, TituloDoPasso } from "./componentes/Passo";
import { type Pose, Receita } from "./componentes/Receita";
import { Rodape } from "./componentes/Rodape";
import { BlocoComparacao, BlocoGrafico, BlocoPassos, BlocoTopicos } from "./componentes/FichaBlocos";
import { BlocoDefinicao, BlocoDestaque, BlocoFrase, BlocoNumero, BlocoPergunta } from "./componentes/Peito";
import { tituloDaReceita } from "./componentes/Receita";
import { comCapa, estadoNoTempo, fichaNoPeito, montarTrechos, type Quadro, quadroDe, type Rect, type Trecho } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Abertura, Momento, Passo, Plano } from "./plano";
import { cor, FICHA, H, LARGURA_UTIL, LIMITE_APP, TAM, W, X0 } from "./tema";

type Som = { em: number; arquivo: string; volume: number; prioridade: number };

// Som raro e tonal: um "vum" grave quando a ficha sobe, uma nota (subindo) para cada ingrediente
// que pousa na panela, dois tons graves no número de cada passo, um sopro tonal quando o fogo
// acende, um tom que desce quando desliga e um acorde curto quando a receita é salva.
const sons = (plano: Plano, trechos: Trecho[], quadros: Quadro[], ev: ReturnType<typeof montarEventos>): Som[] => {
  const lista: Som[] = [];
  const nota = (i: number) => `sfx/pousa-${(i % 3) + 1}.wav`;
  trechos.forEach((tr, k) => {
    if (k > 0 && quadros[k].modo === "ficha" && quadros[k - 1].modo !== "ficha") lista.push({ em: tr.troca, arquivo: "sfx/sobe.wav", volume: 0.42, prioridade: 1 });
    // uma ficha nova pousa sobre a do peito
    if (k > 0 && quadros[k].modo === "peito" && quadros[k - 1].modo === "peito") lista.push({ em: tr.troca, arquivo: "sfx/sobe.wav", volume: 0.3, prioridade: 1 });
    const m = tr.indice >= 0 ? plano.momentos[tr.indice] : null;
    // os blocos universais: uma nota por item que entra, um tom no que bate forte
    if (m?.tipo === "topicos" || m?.tipo === "passos") m.itens.forEach((it, i) => lista.push({ em: it.em, arquivo: m.tipo === "passos" ? `sfx/passo-${(i % 3) + 1}.wav` : nota(i), volume: 0.3, prioridade: 1 }));
    if (m?.tipo === "comparacao") {
      m.lados.forEach((l, i) => lista.push({ em: l.em, arquivo: nota(i), volume: 0.3, prioridade: 1 }));
      if (m.vencedor !== undefined || m.modo === "errado-certo") lista.push({ em: m.vencedorEm ?? m.lados[1].em + 0.6, arquivo: "sfx/salva.wav", volume: 0.34, prioridade: 2 });
    }
    if (m?.tipo === "grafico") (m.dados?.length ? m.dados.map((d) => d.em) : [m.tendenciaEm ?? m.de + 0.4]).forEach((em, i) => lista.push({ em, arquivo: nota(i), volume: 0.3, prioridade: 1 }));
    if (m?.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/passo-1.wav", volume: 0.36, prioridade: 2 });
    if (m?.tipo === "destaque") lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/desliga.wav" : "sfx/passo-2.wav", volume: 0.36, prioridade: 2 });
    if (m?.tipo === "definicao") lista.push({ em: m.significadoEm, arquivo: "sfx/passo-2.wav", volume: 0.32, prioridade: 2 });
    if (m?.tipo === "pergunta") (m.opcoes ?? []).forEach((o, i) => lista.push({ em: o.em, arquivo: nota(i), volume: 0.3, prioridade: 1 }));
    if (m?.tipo === "frase" && m.risco) lista.push({ em: m.riscoEm ?? m.de + 0.5, arquivo: "sfx/desliga.wav", volume: 0.32, prioridade: 2 });
    if (m?.tipo === "passo") {
      // o mesmo instante em que o número rola (depois da troca de canto, se o passo anterior também era passo)
      const antes = k > 0 && trechos[k - 1].indice >= 0 ? plano.momentos[trechos[k - 1].indice] : null;
      const quando = Math.max(m.numeroEm ?? m.de + 0.1, antes?.tipo === "passo" ? tr.troca + 0.5 : -10);
      lista.push({ em: quando - 0.1, arquivo: `sfx/passo-${((m.numero - 1) % 3) + 1}.wav`, volume: 0.4, prioridade: 2 });
    }
    if (m?.tipo === "cta") lista.push({ em: (m.em ?? m.de + 0.1) + 0.25, arquivo: "sfx/salva.wav", volume: 0.4, prioridade: 3 });
  });
  ev.quedas.forEach((q, i) => lista.push({ em: q.em + DURACAO_QUEDA * 0.85, arquivo: `sfx/pousa-${(i % 3) + 1}.wav`, volume: 0.36, prioridade: 2 }));
  ev.acoes.forEach((a) => {
    if (a.acao.startsWith("fogo")) lista.push({ em: a.em, arquivo: "sfx/fogo.wav", volume: 0.4, prioridade: 2 });
    if (a.acao === "desligar") lista.push({ em: a.em, arquivo: "sfx/desliga.wav", volume: 0.38, prioridade: 2 });
  });
  // nunca dois sons colados: quando dois caem juntos, fica o de maior prioridade
  const saida: Som[] = [];
  for (const s of [...lista].sort((a, b) => b.prioridade - a.prioridade || a.em - b.em)) {
    if (saida.every((o) => Math.abs(o.em - s.em) > 0.42)) saida.push(s);
  }
  return saida.sort((a, b) => a.em - b.em);
};

// O título da receita que um trecho mostra: o da abertura (nela mesma, na ficha no peito) ou, nos
// ingredientes, no cabeçalho ao lado da janela — o da abertura logo antes deles ou, sem abertura
// nenhuma antes, um título próprio ("titulo" no plano, ou o rótulo).
const receitaDoTrecho = (plano: Plano, trechos: Trecho[], j: number): Abertura | null => {
  if (j < 0 || !trechos[j] || trechos[j].indice < 0) return null;
  const m = plano.momentos[trechos[j].indice];
  if (m.tipo === "abertura") return m;
  if (m.tipo !== "ingredientes") return null;
  // volta pelos ingredientes seguidos até achar a abertura que veio antes deles
  for (let k = j - 1; k >= 0; k--) {
    const x = trechos[k].indice >= 0 ? plano.momentos[trechos[k].indice] : null;
    if (x?.tipo === "abertura") return x;
    if (x?.tipo !== "ingredientes") break;
  }
  if (plano.momentos.slice(0, trechos[j].indice).some((x) => x.tipo === "abertura")) return null;
  const primeiro = plano.momentos.find((x) => x.tipo === "ingredientes");
  if (primeiro?.tipo !== "ingredientes") return null;
  const titulo = primeiro.titulo ? (Array.isArray(primeiro.titulo) ? primeiro.titulo : [primeiro.titulo]) : [primeiro.rotulo ?? "Ingredientes"];
  return { tipo: "abertura", de: primeiro.de, ate: primeiro.ate, rotulo: "Receita", titulo };
};

// onde o título da receita fica num trecho: na ficha baixa (abertura), no cabeçalho
// (ingredientes) ou escondido
const poseDaReceita = (plano: Plano, trechos: Trecho[], j: number, q: Quadro): Pose => {
  const m = trechos[j] && trechos[j].indice >= 0 ? plano.momentos[trechos[j].indice] : null;
  // na abertura o título divide a ficha com o pote pronto (à direita); o corpo diminui se a ficha
  // estiver baixa (pessoa perto da câmera), e a assinatura sai se ainda assim não couber
  if (m?.tipo === "abertura") {
    const { linhas, escala } = tituloDaReceita(m);
    const disponivel = LIMITE_APP - 12 - (q.fichaY + 40);
    const extras = TAM.rotulo + 14 + (m.passos ? 80 : 0);
    const nome = [plano.marca.nome, plano.marca.area].filter(Boolean).length > 0;
    let corpo = Math.min(TAM.tituloAbertura, (disponivel - extras - (nome ? 78 : 0)) / (linhas.length * escala));
    let assinatura = nome ? 1 : 0;
    if (corpo * escala < 76 && nome) {
      corpo = Math.min(TAM.tituloAbertura, (disponivel - extras) / (linhas.length * escala));
      assinatura = 0;
    }
    return { x: X0, y: q.fichaY + 40, corpo, op: 1, largura: LARGURA_UTIL - 290, assinatura };
  }
  if (receitaDoTrecho(plano, trechos, j)) return { x: q.cabecalho.x, y: q.cabecalho.y + 4, corpo: TAM.tituloCabecalho, op: 1, largura: q.cabecalho.w, assinatura: 0 };
  if (q.modo === "ficha") return { x: q.cabecalho.x - 50, y: q.cabecalho.y + 4, corpo: TAM.tituloCabecalho, op: 0, largura: q.cabecalho.w, assinatura: 0 };
  return { x: X0, y: q.fichaY + 40, corpo: TAM.tituloAbertura, op: 0, largura: LARGURA_UTIL - 290, assinatura: 1 };
};

const misturarPose = (a: Pose, b: Pose, p: number): Pose => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  corpo: mistura(a.corpo, b.corpo, p),
  largura: mistura(a.largura, b.largura, p),
  // a assinatura some logo no começo da subida (no cabeçalho ela não cabe)
  assinatura: b.assinatura < a.assinatura ? Math.max(0, 1 - p * 3) : mistura(a.assinatura, b.assinatura, p),
  // some rápido, aparece junto com a ficha
  op: b.op < a.op ? Math.max(0, 1 - p * 3) * a.op : mistura(a.op, b.op, p),
});

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const trechos = useMemo(() => montarTrechos(plano), [plano]);
  const quadros = useMemo(() => trechos.map((tr) => quadroDe(tr, plano)), [trechos, plano]);
  const ev = useMemo(() => montarEventos(plano, trechos, quadros), [plano, trechos, quadros]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, trechos, quadros, ev), [plano, trechos, quadros, ev]);
  const totalPassos = useMemo(() => Math.max(1, ...plano.momentos.filter((m): m is Passo => m.tipo === "passo").map((m) => m.total ?? m.numero)), [plano]);
  const videoAltura = Math.min(H, plano.videoAltura ?? H);

  const estado = estadoNoTempo(t, trechos, quadros);
  const q = estado.quadro;
  const k = estado.atual;
  const cozinha = estadoDaCozinha(t, plano, trechos, quadros, ev);
  const momentoDe = (j: number): Momento | null => (j >= 0 && trechos[j] && trechos[j].indice >= 0 ? plano.momentos[trechos[j].indice] : null);
  const proximaTroca = (j: number) => trechos[j + 1]?.troca ?? plano.duracao + 5;
  const quadroA = quadros[Math.max(0, estado.anterior)];
  const quadroB = quadros[k];
  const mA = momentoDe(k - 1);
  const mB = momentoDe(k);

  // Como a troca acontece:
  // - "sai": a ficha cheia desce e sai da tela levando tudo o que tem; a ficha do peito (fechamento,
  //   dica) já está embaixo dela, com o texto a lápis — nunca aparece uma ficha vazia;
  // - "entra": o contrário — uma ficha cheia nova sobe por cima da ficha do peito;
  // - "continua": a mesma ficha muda (sobe da abertura para os ingredientes, a janela troca de canto…).
  // - "empilha": de um bloco do peito para outro, uma ficha nova sobe e pousa por cima da anterior
  //   (a anterior fica inteira até ser coberta: nunca dois textos um sobre o outro);
  const emTroca = estado.p < 1 && k > 0;
  const modoTroca: "sai" | "entra" | "empilha" | "continua" =
    emTroca && quadroA.modo === "ficha" && quadroB.modo === "peito"
      ? "sai"
      : emTroca && quadroA.modo === "peito" && quadroB.modo === "ficha" && !(mA?.tipo === "abertura" && mB?.tipo === "ingredientes")
        ? "entra"
        : emTroca && quadroA.modo === "peito" && quadroB.modo === "peito"
          ? "empilha"
          : "continua";

  // sequências de passos seguidos (o número rola de um para o outro)
  const sequencias: { de: number; ate: number }[] = [];
  trechos.forEach((_, j) => {
    if (momentoDe(j)?.tipo !== "passo") return;
    const ultima = sequencias[sequencias.length - 1];
    if (ultima && ultima.ate === j - 1) ultima.ate = j;
    else sequencias.push({ de: j, ate: j });
  });
  const cabecalhoDaSequencia = (s: { de: number; ate: number }, ret: Rect, someNaSaida = true) => {
    const passos = trechos
      .slice(s.de, s.ate + 1)
      .map((_, i) => momentoDe(s.de + i))
      .filter((m): m is Passo => m?.tipo === "passo");
    const trocas = new Map<Passo, number>(passos.map((p, i) => [p, i === 0 ? -10 : trechos[s.de + i].troca]));
    return (
      <CabecalhoDoPasso
        key={`cab-${s.de}`}
        passos={passos}
        trocas={trocas}
        ret={ret}
        t={t}
        entra={trechos[s.de].troca + 0.25}
        sai={proximaTroca(s.ate)}
        total={totalPassos}
        someNaSaida={someNaSaida}
      />
    );
  };

  // Os blocos universais de um trecho. `qj`: o quadro (posições) em que ele é desenhado.
  // O cabeçalho espera a janela da pessoa passar quando ela troca de canto ou encolhe.
  const blocoUniversal = (j: number, qj: Quadro, sai: number, someNaSaida: boolean) => {
    const m = momentoDe(j);
    if (!m) return null;
    const tr = trechos[j];
    const chave = `${m.tipo}-${m.de}`;
    const comum = { t, palavras: plano.palavras, sai, someNaSaida };
    const antes = j > 0 ? quadros[j - 1].modo : null;
    const entraCab = tr.troca + (antes === "ficha" || antes === "livre" ? tr.dur * 0.8 : 0.2);
    const entraCorpo = tr.troca + 0.22;
    const ficha = { ...comum, q: qj, entraCab, entraCorpo };
    const peito = { ...comum, fichaY: qj.fichaY, entra: tr.troca };
    switch (m.tipo) {
      case "topicos":
        return <BlocoTopicos key={chave} m={m} {...ficha} />;
      case "passos":
        return <BlocoPassos key={chave} m={m} {...ficha} />;
      case "comparacao":
        return <BlocoComparacao key={chave} m={m} {...ficha} />;
      case "grafico":
        return <BlocoGrafico key={chave} m={m} {...ficha} />;
      case "destaque":
        return <BlocoDestaque key={chave} m={m} {...peito} />;
      case "frase":
        return <BlocoFrase key={chave} m={m} {...peito} />;
      case "pergunta":
        return <BlocoPergunta key={chave} m={m} {...peito} />;
      case "definicao":
        return <BlocoDefinicao key={chave} m={m} {...peito} />;
      case "numero":
        return <BlocoNumero key={chave} m={m} {...peito} />;
      default:
        return null;
    }
  };

  // O conteúdo de um trecho desenhado na ficha dele (usado nas trocas "sai" e "entra", em que
  // cada ficha leva o seu conteúdo inteiro, nas posições do próprio trecho).
  const fichaInteira = (j: number, c: EstadoDaCozinha, saindoDaTela: boolean) => {
    const m = momentoDe(j);
    const qj = quadros[j];
    const sai = saindoDaTela ? plano.duracao + 5 : proximaTroca(j);
    const receita = receitaDoTrecho(plano, trechos, j);
    const seq = sequencias.find((s) => j >= s.de && j <= s.ate);
    return (
      <>
        <Ficha y={qj.fichaY} />
        <Bancada plano={plano} ev={ev} t={t} c={c} />
        {qj.modo === "ficha" ? <Rodape plano={plano} trechos={trechos} t={t} fichaY={qj.fichaY} /> : null}
        {m?.tipo === "ingredientes" ? (
          <Ingredientes
            m={m}
            corpo={qj.corpo}
            t={t}
            palavras={plano.palavras}
            sai={sai}
            semAbertura={!plano.momentos.some((x) => x.tipo === "abertura" && x.de < m.de)}
            someNaSaida={false}
          />
        ) : null}
        {m?.tipo === "passo" ? (
          <>
            <TituloDoPasso m={m} corpo={qj.corpo} t={t} palavras={plano.palavras} entra={trechos[j].troca} sai={sai} someNaSaida={false} />
            <Anotacoes m={m} corpo={qj.corpo} t={t} palavras={plano.palavras} cozinha={c} entra={trechos[j].troca} sai={sai} someNaSaida={false} />
          </>
        ) : null}
        {seq ? cabecalhoDaSequencia(seq, qj.cabecalho, false) : null}
        {m?.tipo === "dica" ? <CartaoDica m={m} fichaY={qj.fichaY} t={t} palavras={plano.palavras} entra={trechos[j].troca - 0.2} sai={sai} someNaSaida={false} /> : null}
        {m?.tipo === "cta" ? <Fechamento m={m} fichaY={qj.fichaY} t={t} palavras={plano.palavras} marca={plano.marca} entra={trechos[j].troca} /> : null}
        {blocoUniversal(j, qj, sai, false)}
        {receita ? <Receita m={receita} pose={poseDaReceita(plano, trechos, j, qj)} t={t} palavras={plano.palavras} marca={plano.marca} /> : null}
      </>
    );
  };

  // ---------- a pessoa: janela no canto (ficha) ou quadro cheio recortado pela ficha (peito) ----------
  // nas trocas com duas fichas, a pessoa cresce antes da ficha sair (e encolhe só depois de a ficha
  // nova cobrir o peito): o espaço acima da ficha é sempre preenchido pela pessoa, nunca pela mesa
  const pj = modoTroca === "sai" ? Math.min(1, estado.p * 2.6) : modoTroca === "entra" ? Math.max(0, (estado.p - 0.4) / 0.6) : modoTroca === "empilha" ? 1 : estado.p;
  const caixa =
    modoTroca === "continua"
      ? q.janela
      : {
          x: mistura(quadroA.janela.x, quadroB.janela.x, pj),
          y: mistura(quadroA.janela.y, quadroB.janela.y, pj),
          w: mistura(quadroA.janela.w, quadroB.janela.w, pj),
          h: mistura(quadroA.janela.h, quadroB.janela.h, pj),
          raio: mistura(quadroA.janela.raio, quadroB.janela.raio, Math.min(1, pj * 1.6)),
          zoom: mistura(quadroA.janela.zoom, quadroB.janela.zoom, pj),
          ancoraY: mistura(quadroA.janela.ancoraY, quadroB.janela.ancoraY, pj),
        };
  let furo: Rect & { raio: number } = caixa;
  if (estado.p < 1 && !(quadroA.modo === "ficha" && quadroB.modo === "ficha")) {
    furo = quadroB.modo === "ficha" ? quadroB.janela : quadroA.modo === "ficha" ? quadroA.janela : { x: 0, y: 0, w: 0, h: 0, raio: 0 };
  } else if (q.modo !== "ficha") furo = { x: 0, y: 0, w: 0, h: 0, raio: 0 };

  // nas trocas com duas fichas, a cheia anda (sai descendo ou entra subindo) e a do peito fica parada
  const pe = estado.p;
  const yCheia =
    modoTroca === "sai"
      ? mistura(quadroA.fichaY, H + 90, pe)
      : modoTroca === "entra" || modoTroca === "empilha"
        ? mistura(H + 90, quadroB.fichaY, pe)
        : q.fichaY;
  const yPeito = modoTroca === "sai" ? quadroB.fichaY : modoTroca === "entra" || modoTroca === "empilha" ? quadroA.fichaY : H + 90;
  const topoDaFicha = modoTroca === "continua" ? q.fichaY : Math.min(yCheia, yPeito);
  const fichaH = H - topoDaFicha + 200;
  const recorte =
    topoDaFicha < H
      ? `path(nonzero, "${[
          retArredondado(-caixa.x - 20, -caixa.y - 20, W + 40, H + 40, 0, true),
          retArredondado(FICHA.x - caixa.x, topoDaFicha - caixa.y, FICHA.w, fichaH, FICHA.raio, false),
          furo.w > 0 ? retArredondado(furo.x - caixa.x, furo.y - caixa.y, furo.w, furo.h, furo.raio, true) : "",
        ].join(" ")}")`
      : undefined;
  const emJanela = q.modo === "ficha" ? (quadroA.modo === "ficha" ? 1 : prog(estado.p, 0.82, 0.18)) : 1 - prog(estado.p, 0, 0.2);
  const sombraJanela = q.modo === "ficha" || quadroA.modo === "ficha" ? (q.modo === "ficha" ? emJanela : 1 - prog(estado.p, 0, 0.25)) : 0;
  const legendaY = q.modo === "peito" ? q.fichaY - 104 : fichaNoPeito(plano) + 40;

  // ---------- conteúdo ----------
  let fichas: React.ReactNode;
  if (modoTroca === "continua") {
    // trechos na tela: o atual e, durante a troca, o anterior
    const visiveis = [k - 1, k].filter((j) => j >= 0 && t < proximaTroca(j) + 0.7);
    const receita = receitaDoTrecho(plano, trechos, k) ?? receitaDoTrecho(plano, trechos, k - 1);
    const pose = k > 0 ? misturarPose(poseDaReceita(plano, trechos, k - 1, quadroA), poseDaReceita(plano, trechos, k, quadroB), estado.p) : poseDaReceita(plano, trechos, k, quadroB);
    fichas = (
      <>
        <Ficha y={q.fichaY} />
        {/* a cozinha (panela, pote) fica no papel, por baixo dos textos */}
        {q.fichaY < H ? <Bancada plano={plano} ev={ev} t={t} c={cozinha} /> : null}
        {/* o que cai sai de baixo da pilha de ingredientes */}
        {q.fichaY < H ? <Quedas ev={ev} t={t} c={cozinha} /> : null}
        {q.fichaY < H ? <Rodape plano={plano} trechos={trechos} t={t} fichaY={q.fichaY} /> : null}
        {visiveis.map((j) => {
          const m = momentoDe(j);
          if (!m) return null;
          const sai = proximaTroca(j);
          const chave = `${m.tipo}-${m.de}`;
          if (m.tipo === "ingredientes") {
            const semAbertura = !plano.momentos.some((x) => x.tipo === "abertura" && x.de < m.de);
            return <Ingredientes key={chave} m={m} corpo={q.corpo} t={t} palavras={plano.palavras} sai={sai} semAbertura={semAbertura} />;
          }
          if (m.tipo === "passo")
            return (
              <div key={chave}>
                <TituloDoPasso m={m} corpo={q.corpo} t={t} palavras={plano.palavras} entra={trechos[j].troca} sai={sai} />
                <Anotacoes m={m} corpo={q.corpo} t={t} palavras={plano.palavras} cozinha={cozinha} entra={trechos[j].troca} sai={sai} />
              </div>
            );
          if (m.tipo === "dica") return <CartaoDica key={chave} m={m} fichaY={q.fichaY} t={t} palavras={plano.palavras} entra={trechos[j].troca} sai={sai} />;
          if (m.tipo === "cta") return <Fechamento key={chave} m={m} fichaY={q.fichaY} t={t} palavras={plano.palavras} marca={plano.marca} entra={trechos[j].troca + 0.2} />;
          // blocos universais: o corpo anda com a ficha; o cabeçalho fica no lado do próprio trecho
          // (não escorrega por baixo da janela que troca de canto)
          const qj: Quadro = { ...q, cabecalho: { ...quadros[j].cabecalho, y: q.cabecalho.y }, canto: quadros[j].canto };
          return blocoUniversal(j, qj, sai, true);
        })}
        {sequencias.map((s) => {
          const sai = proximaTroca(s.ate);
          if (t < trechos[s.de].troca - 0.1 || t > sai + 0.7) return null;
          // entra já no lugar dele (não atravessa a janela); entre dois passos, desliza junto com a troca
          const ret = k === s.de && estado.p < 1 ? quadros[s.de].cabecalho : q.cabecalho;
          return cabecalhoDaSequencia(s, ret);
        })}
        {receita ? <Receita m={receita} pose={pose} t={t} palavras={plano.palavras} marca={plano.marca} /> : null}
      </>
    );
  } else {
    // duas fichas: a do peito fica parada; a cheia anda por cima dela, levando o conteúdo inteiro
    const geoA = geometriaDoTrecho(trechos[k - 1], quadroA, plano, ev.acoes.some((a) => a.acao === "pote" && a.em <= t));
    const geoB = geometriaDoTrecho(trechos[k], quadroB, plano, ev.acoes.some((a) => a.acao === "pote" && a.em <= trechos[k].troca));
    const cA: EstadoDaCozinha = { ...cozinha, geo: geoA, fogo: quadroA.modo === "ficha" ? cozinha.fogo : 0, naFicha: quadroA.modo === "ficha" ? 1 : 0, colherNoPote: 1 };
    const cB: EstadoDaCozinha = { ...cozinha, geo: geoB, fogo: 0, naFicha: quadroB.modo === "ficha" ? 1 : 0, colherNoPote: 1 };
    // "empilha": a ficha que sobe é a nova (k), a parada é a anterior (k-1), as duas no peito
    const jCheia = modoTroca === "sai" ? k - 1 : k;
    const jPeito = modoTroca === "sai" ? k : k - 1;
    const cCheia = modoTroca === "sai" ? cA : cB;
    const cPeito = modoTroca === "sai" ? cB : cA;
    const dy = yCheia - quadros[jCheia].fichaY;
    fichas = (
      <>
        {fichaInteira(jPeito, cPeito, false)}
        <div style={{ position: "absolute", inset: 0, translate: `0 ${dy.toFixed(1)}px` }}>{fichaInteira(jCheia, cCheia, modoTroca === "sai")}</div>
      </>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: cor.mesa }}>
      {fichas}

      {/* sombra da janela no papel */}
      {sombraJanela > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: (furo.w > 0 ? furo : caixa).x,
            top: (furo.w > 0 ? furo : caixa).y,
            width: (furo.w > 0 ? furo : caixa).w,
            height: (furo.w > 0 ? furo : caixa).h,
            borderRadius: (furo.w > 0 ? furo : caixa).raio,
            boxShadow: "0 26px 60px rgba(46,30,26,0.34), 0 4px 10px rgba(46,30,26,0.18)",
            opacity: sombraJanela,
          }}
        />
      ) : null}

      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.97)"
        estilo={recorte ? { clipPath: recorte } : undefined}
      />

      {q.modo !== "ficha" && modoTroca === "continua" ? <Legendas frases={frases} y={legendaY} /> : null}

      {guias ? (
        <Guias
          plano={plano}
          fichaPeito={fichaNoPeito(plano)}
          janela={caixa}
          cabecalho={q.modo === "ficha" ? q.cabecalho : null}
          corpo={q.modo === "ficha" ? q.corpo : null}
          legendaY={legendaY}
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
