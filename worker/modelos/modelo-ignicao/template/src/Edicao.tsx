import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { palavrasDoTrecho, pisca, prog, quandoDiz, saindo, temposDoTexto, troca, useTempo } from "./anim";
import { Guias } from "./componentes/Guias";
import { AberturaNaBarra, ChamadaFinal, FraseNaBarra, Legendas, PerguntaNaBarra, TituloIgnicao } from "./componentes/Mensagens";
import { Mostrador } from "./componentes/Mostrador";
import { BrilhoDoVidro, FaixaDeLuzes, Fundo, MolduraEspelho, MolduraLateral, MolduraTela, NaTela, type Parte, Perfil, Vidro, Volante } from "./componentes/Painel";
import { TelaAviso } from "./componentes/TelaAviso";
import { TelaComparacao } from "./componentes/TelaComparacao";
import { TelaDefinicao } from "./componentes/TelaDefinicao";
import { TelaDestaque } from "./componentes/TelaDestaque";
import { TelaGrafico } from "./componentes/TelaGrafico";
import { TelaLista } from "./componentes/TelaLista";
import { TelaLuzes } from "./componentes/TelaLuzes";
import { TelaNumero } from "./componentes/TelaNumero";
import { TelaParada } from "./componentes/TelaParada";
import { TelaPassos } from "./componentes/TelaPassos";
import { TelaPergunta } from "./componentes/TelaPergunta";
import { TelaRota } from "./componentes/TelaRota";
import { FIM_DO_RECOLHE, recolheDe, TesteDeLampadas } from "./componentes/TesteDeLampadas";
import {
  ANTES,
  corDasLuzes,
  geometriaDe,
  geometriaNoTempo,
  ignicaoDe,
  lampadaDoDestaque,
  lampadaDoItem,
  luzesDoPlano,
  modoDo,
  motorDo,
  niveisDaComparacao,
  primeiroNaChave,
  trocaDoMomento,
  trocasDe,
  zoomDoCorte,
} from "./layout";
import { enquadrar, type Rosto, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Comparacao, Lampada, Momento, Plano } from "./plano";
import { H } from "./tema";

// um momento nunca invade o seguinte
const ordenar = (plano: Plano): Plano => {
  const ms = [...plano.momentos].sort((a, b) => a.de - b.de);
  return { ...plano, momentos: ms.map((m, i) => (ms[i + 1] && m.ate > ms[i + 1].de ? { ...m, ate: ms[i + 1].de } : m)) };
};

// Gravação muito perto da câmera: o queixo desce até onde fica a faixa do teste de lâmpadas, então a
// faixa vai logo abaixo da tela da pessoa (e o conteúdo do primeiro momento espera ela recolher)
const cacheAbaixo = new WeakMap<Plano, boolean>();
const faixaAbaixo = (plano: Plano) => {
  const guardado = cacheAbaixo.get(plano);
  if (guardado !== undefined) return guardado;
  const modo = primeiroNaChave(plano) ? modoDo(plano.momentos[0]) : "central";
  const caixa = geometriaDe(modo, plano).pessoa;
  const rosto = plano.rosto as Rosto;
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const e = enquadrar(caixa, rosto, videoAltura, null);
  const queixo = e.topo + ((rosto.y * H) / videoAltura) * e.av + 0.62 * (rosto.rastro?.largura ?? 0.36) * e.lv;
  const abaixo = queixo > caixa.h - 174;
  cacheAbaixo.set(plano, abaixo);
  return abaixo;
};

// O conteúdo de um momento sai no começo da troca seguinte (some em 0,2 s) e o do próximo começa a
// entrar no instante em que o anterior termina de sumir (em 0,12 s, já com as palavras em esboço):
// nunca dois textos ao mesmo tempo na tela, e a tela nunca fica vazia mais que um quadro.
const janelaDe = (m: Momento, plano: Plano) => {
  const ms = plano.momentos;
  const i = ms.indexOf(m);
  const proximo = ms[i + 1];
  // o primeiro momento entra com a chave (a tela cresce em volta dele); os outros, com a tela quase
  // no tamanho novo (a parte de dentro da tela aparece junto com a tela que cresce, então pode entrar cedo)
  const naChave = i === 0 && primeiroNaChave(plano);
  const inicio = naChave ? (faixaAbaixo(plano) ? recolheDe(ignicaoDe(plano)) + 0.32 : ignicaoDe(plano)) : m.de - ANTES + 0.12;
  const ultimo = !proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3);
  const fim = ultimo ? plano.duracao + 1 : proximo && proximo.de - m.ate < 0.8 ? proximo.de - ANTES + 0.12 : m.ate;
  return { inicio, fim };
};

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: a partida grave na chave, uma nota por item que acende (subindo de altura), o
// alerta grave duplo na parada e no destaque de alerta, a descida do motor desligando (e no trecho
// riscado), a dupla de notas da rota e o "toc" surdo da seta no fechamento. Nunca dois sons a menos
// de 0,45 s.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  lista.push({ em: ignicaoDe(plano) + 0.04, arquivo: "sfx/ignicao.wav", volume: 0.5 });
  let nota = 0;
  const notaEm = (em: number, volume = 0.42) => lista.push({ em, arquivo: `sfx/luz-${(nota++ % 3) + 1}.wav`, volume });
  for (const m of plano.momentos) {
    if (m.tipo === "luzes") m.itens.forEach((i) => notaEm(i.em));
    if (m.tipo === "parada") {
      lista.push({ em: m.de + 0.12, arquivo: "sfx/alerta.wav", volume: 0.42 });
      for (const p of m.passos) if (p.acao === "desligar") lista.push({ em: p.em + 0.1, arquivo: "sfx/desliga.wav", volume: 0.5 });
    }
    if (m.tipo === "rota") lista.push({ em: m.rotaEm, arquivo: "sfx/rota.wav", volume: 0.4 });
    if (m.tipo === "aviso" && m.valor) notaEm(m.valor.em, 0.4);
    if (m.tipo === "cta") {
      const seta = m.setaEm ?? quandoDiz(plano.palavras, ["manda", "envia", "compartilha", "marca", "toca", "toque", "clica", "clique", "segue", "siga", "comenta", "comente", "acessa", "acesse", "assiste", "chama"], m.de, m.ate);
      if (seta !== undefined) lista.push({ em: seta, arquivo: "sfx/seta.wav", volume: 0.45 });
    }
    if (m.tipo === "topicos" || m.tipo === "passos") m.itens.forEach((i) => notaEm(i.em, 0.38));
    if (m.tipo === "numero") notaEm(m.em, 0.4);
    if (m.tipo === "comparacao") m.lados.forEach((l) => notaEm(l.em, 0.38));
    if (m.tipo === "grafico") {
      if (m.dados?.length) m.dados.forEach((d) => notaEm(d.em, 0.36));
      else notaEm(m.tendenciaEm ?? m.de + 0.15, 0.36);
    }
    if (m.tipo === "destaque") {
      if (m.nivel === "alerta") lista.push({ em: m.em, arquivo: "sfx/alerta.wav", volume: 0.4 });
      else notaEm(m.em, 0.4);
    }
    if (m.tipo === "definicao") {
      notaEm(m.em, 0.38);
      notaEm(m.significadoEm, 0.38);
    }
    if (m.tipo === "frase" && m.risco) {
      const ws = palavrasDoTrecho(m.texto, m.risco);
      const tempos = temposDoTexto(m.texto, plano.palavras, m.em ?? m.de, m.ate, m.em ?? m.de);
      const em = m.riscoEm ?? tempos[ws[ws.length - 1] ?? 0];
      if (ws.length && em !== undefined) lista.push({ em, arquivo: "sfx/desliga.wav", volume: 0.42 });
    }
    if (m.tipo === "pergunta" && m.opcoes) m.opcoes.forEach((o) => notaEm(o.em, 0.36));
  }
  const saida: Som[] = [];
  for (const s of lista.sort((a, b) => a.em - b.em)) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Estado de cada luz-espia: acesa a partir de quando é nomeada (luzes) ou dita (destaque), piscando
// na parada e no destaque de alerta, fixa na rota e no aviso; apagada no resto.
// (o teste de lâmpadas da partida é desenhado à parte, grande: TesteDeLampadas)
const estadoDasLuzes = (plano: Plano) => (ic: Lampada, t: number) => {
  let v = 0;
  for (const m of plano.momentos) {
    const { inicio, fim } = janelaDe(m, plano);
    if (t < m.de - ANTES || t > fim) continue;
    if (m.tipo === "luzes") {
      const item = m.itens.find((x, i) => lampadaDoItem(x.icone, i) === ic);
      if (item) v = Math.max(v, prog(t, item.em - 0.05, 0.12) * (1 - saindo(t, fim, 0.2)));
    }
    if (m.tipo === "parada" && (m.icones ?? []).includes(ic)) v = Math.max(v, pisca(t, Math.max(inicio, m.de), 0.8));
    if (m.tipo === "rota" && m.icone === ic) v = Math.max(v, prog(t, inicio, 0.2) * (1 - saindo(t, fim, 0.2)));
    if (m.tipo === "aviso" && m.icone === ic) v = Math.max(v, prog(t, inicio + 0.2, 0.2) * (1 - saindo(t, fim, 0.2)));
    if (m.tipo === "destaque" && lampadaDoDestaque(m) === ic) {
      const acende = m.nivel === "alerta" ? (t < m.em + 0.5 ? prog(t, m.em - 0.05, 0.12) : pisca(t, m.em + 0.5, 0.8)) : prog(t, m.em - 0.05, 0.12);
      v = Math.max(v, acende * (1 - saindo(t, fim, 0.2)));
    }
  }
  return v;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: original, guias }) => {
  const plano = useMemo(() => ordenar(original), [original]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const trocas = useMemo(() => trocasDe(plano), [plano]);
  const motor = useMemo(() => motorDo(plano), [plano]);
  const icones = useMemo(() => luzesDoPlano(plano), [plano]);
  const acesa = useMemo(() => estadoDasLuzes(plano), [plano]);
  const corDe = useMemo(() => corDasLuzes(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const velDe = useMemo(() => (x: number) => motor(x).vel, [motor]);

  const { g, peso, atual, anterior, p: pTroca } = geometriaNoTempo(t, trocas, plano);
  // a fileira de luzes que atravessa a tela inteira numa troca (do alto da tela para o painel ao lado
  // do retrovisor, ou para baixo, entre os mostradores) apaga no meio do caminho: nunca passa por cima
  // de um texto
  const viagem = (() => {
    const a = geometriaDe(anterior, plano).luzes;
    const b = geometriaDe(atual, plano).luzes;
    return Math.abs(a.y - b.y) + Math.abs((a.x1 + a.x2) / 2 - (b.x1 + b.x2) / 2);
  })();
  const fileiraNaTroca = viagem > 250 ? Math.min(1, Math.max(0, Math.abs(2 * pTroca - 1) * 2.2 - 1.2)) : 1;
  const estado = motor(t);
  const pessoa = { ...g.pessoa, zoom: (g.pessoa.zoom ?? 1) * zoomDoCorte(t, plano, trocas) };
  const ig = ignicaoDe(plano);
  // o modo da chave: a fileira onde o teste de lâmpadas termina e onde a pessoa vai parar
  const modoDaChave = useMemo(() => (primeiroNaChave(plano) ? modoDo(plano.momentos[0]) : "central"), [plano]);
  const fileiraDaChave = useMemo(() => geometriaDe(modoDaChave, plano).luzes, [plano, modoDaChave]);
  const testeAbaixo = faixaAbaixo(plano);
  // ao encostar, o volante vira para a direita e volta
  const giroDoVolante = plano.momentos.reduce((a, m) => {
    if (m.tipo !== "parada") return a;
    return a + m.passos.filter((p) => p.acao === "encostar").reduce((b, p) => b + 24 * Math.sin(Math.PI * prog(t, p.em + 0.05, 1.4, troca)), 0);
  }, 0);

  // os momentos com conteúdo na tela agora
  const ativos = plano.momentos.filter((m) => {
    const { inicio, fim } = janelaDe(m, plano);
    return t >= inicio - 0.05 && t <= fim + 0.05;
  });
  const algumMomento = plano.momentos.some((m) => t >= m.de - ANTES && t <= janelaDe(m, plano).fim);

  // perfil do motorista: na abertura (depois da varredura) e no fechamento
  const perfil =
    plano.momentos
      .filter((m) => m.tipo === "ignicao" || m.tipo === "abertura" || m.tipo === "cta")
      .map((m) => {
        const { inicio, fim } = janelaDe(m, plano);
        const de = m.tipo === "cta" ? inicio + 0.2 : inicio + 0.9;
        return Math.min(prog(t, de, 0.4), 1 - saindo(t, fim, 0.25));
      })
      .reduce((a, b) => Math.max(a, b), 0) * peso("central");

  // comparação: os mostradores viram os dois lados (sem números, com o nome de cada lado)
  const neutro = peso("comparar");
  const comparacao = plano.momentos
    .filter((m): m is Comparacao => m.tipo === "comparacao" && t >= trocaDoMomento(m, plano) - 0.05)
    .sort((a, b) => b.de - a.de)[0];
  const apagaLado = (i: 0 | 1) => {
    if (!comparacao) return 1;
    const n = niveisDaComparacao(comparacao);
    return n.perdedor === i && n.apagaEm !== undefined ? 1 - 0.55 * prog(t, n.apagaEm, 0.4) * neutro : 1;
  };

  const conteudo = (m: Momento, parte: Parte) => {
    const janela = janelaDe(m, plano);
    // a parte de fora da tela central fica em lugares que as peças cruzam na troca de modo: ela só
    // entra quando a troca já está quase no fim
    const naChave = plano.momentos[0] === m && primeiroNaChave(plano);
    const inicio = parte === "fora" && m.tipo !== "ignicao" ? Math.max(janela.inicio, trocaDoMomento(m, plano) + (naChave ? 0.62 : 0.46)) : janela.inicio;
    const fim = janela.fim;
    const chave = `${m.tipo}-${m.de}-${parte}`;
    const p = { palavras: plano.palavras, t, inicio, fim };
    switch (m.tipo) {
      case "ignicao":
        return parte === "tela" ? <TituloIgnicao key={chave} m={m} {...p} /> : null;
      case "abertura":
        return parte === "tela" ? <AberturaNaBarra key={chave} m={m} {...p} /> : null;
      case "frase":
        return parte === "tela" ? <FraseNaBarra key={chave} m={m} {...p} /> : null;
      case "pergunta":
        if (m.opcoes && m.opcoes.length >= 2) return <TelaPergunta key={chave} m={m} {...p} parte={parte} />;
        return parte === "tela" ? <PerguntaNaBarra key={chave} m={m} {...p} /> : null;
      case "cta":
        return parte === "tela" ? <ChamadaFinal key={chave} m={m} {...p} /> : null;
      case "luzes":
        return <TelaLuzes key={chave} m={m} {...p} parte={parte} />;
      case "parada":
        return <TelaParada key={chave} m={m} {...p} parte={parte} vel={velDe} />;
      case "rota":
        return <TelaRota key={chave} m={m} {...p} parte={parte} corDe={corDe} />;
      case "aviso":
        return <TelaAviso key={chave} m={m} {...p} parte={parte} />;
      case "topicos":
        return <TelaLista key={chave} m={m} {...p} parte={parte} />;
      case "passos":
        return <TelaPassos key={chave} m={m} {...p} parte={parte} />;
      case "numero":
        return <TelaNumero key={chave} m={m} {...p} parte={parte} />;
      case "comparacao":
        return <TelaComparacao key={chave} m={m} {...p} parte={parte} />;
      case "grafico":
        return <TelaGrafico key={chave} m={m} {...p} parte={parte} />;
      case "destaque":
        return <TelaDestaque key={chave} m={m} {...p} parte={parte} />;
      case "definicao":
        return <TelaDefinicao key={chave} m={m} {...p} parte={parte} />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0C0E" }}>
      {/* 1. o painel: carcaça, mostradores e a tela central (por trás da pessoa) */}
      <Fundo luz={estado.luz} />
      <Mostrador c={g.vel} tipo="vel" valor={estado.vel} luz={estado.luz * apagaLado(0)} neutro={neutro} nome={comparacao?.lados[0].rotulo} nomeAceso={comparacao ? prog(t, comparacao.lados[0].em - 0.05, 0.3) : 1} />
      <Mostrador c={g.giro} tipo="giro" valor={estado.giro} luz={estado.luz * apagaLado(1)} neutro={neutro} nome={comparacao?.lados[1].rotulo} nomeAceso={comparacao ? prog(t, comparacao.lados[1].em - 0.05, 0.3) : 1} />
      <Vidro r={g.tela} raio={26} />
      <Volante giro={giroDoVolante} />

      {/* 2. o conteúdo de cada momento: a parte de dentro da tela central (recortada pelo vidro) e a de fora */}
      <NaTela r={g.tela}>{ativos.map((m) => conteudo(m, "tela"))}</NaTela>
      {ativos.map((m) => conteudo(m, "fora"))}
      {/* a fileira some enquanto o teste de lâmpadas é dono das luzes (elas voltam a ela no fim) */}
      <FaixaDeLuzes
        icones={icones}
        g={g.luzes}
        acesa={(ic) => acesa(ic, t)}
        corDe={corDe}
        opacidade={t >= ig + 0.05 && t < recolheDe(ig) + FIM_DO_RECOLHE ? 0 : fileiraNaTroca}
      />

      {/* 3. a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <MolduraTela c={pessoa} peso={peso("central")} />
      <MolduraEspelho c={pessoa} peso={peso("espelho") + peso("rota") + peso("comparar")} />
      <MolduraLateral c={pessoa} peso={peso("lateral")} />
      <VideoNaCaixa src={plano.video} caixa={pessoa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.04) saturate(0.96)" />
      <BrilhoDoVidro c={pessoa} reflexo={1 - peso("cheio")} />
      <Perfil nome={plano.marca.nome} area={plano.marca.area} x={pessoa.x + 26} y={pessoa.y + 26} p={perfil} />
      <TesteDeLampadas t={t} ig={ig} caixa={pessoa} fileira={fileiraDaChave} doPlano={icones} corDe={corDe} abaixo={testeAbaixo} />

      {/* 4. legenda (só fora dos momentos, na barra de mensagens) */}
      <Legendas frases={frases} t={t} presenca={algumMomento ? 0 : peso("central")} />

      {guias ? <Guias rosto={plano.rosto} pessoa={pessoa} tela={g.tela} modo={atual} /> : null}

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
