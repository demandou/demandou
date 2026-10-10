import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, saindo, useTempo } from "./anim";
import { blocoDaEntrada, blocoNoTempo, deslocamento, ehCarta, type Entrada, entradaNoTempo, estadoDaOcular, fimDaEntrada, montarCena, naCarta, ocularVigente, panNoTempo } from "./ceu";
import { Abertura, figuraDaMiniatura } from "./componentes/Abertura";
import { ComparacaoNaCarta, ConstelacaoNaCarta, DefinicaoNaCarta, duracaoDoNumero, GraficoNaCarta, Lista, NumeroNaCarta, quandoChega, tipoDoNumero } from "./componentes/Blocos";
import { Carta, Prancha } from "./componentes/Carta";
import { Cta } from "./componentes/Cta";
import { DestaqueCheio, FraseCheia, NumeroCheio, PerguntaCheia, type Zona } from "./componentes/Fala";
import { FundoCeu } from "./componentes/FundoCeu";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { PessoaNaOcular } from "./componentes/Ocular";
import { areasDe } from "./layout";
import { pontoDoRosto } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, H, LEGENDA_CARTA_Y, LEGENDA_Y, LIMITE_TEXTO_CHEIO, TOPO_PEITO, W, zona as zonaPadrao } from "./tema";

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

// O último momento fica até o fim do vídeo quando é o fechamento ou termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: um sopro grave quando a ocular fecha/abre (e mais leve quando a luneta muda
// de lugar), uma nota por estrela que acende (subindo), um tom grave quando a reta chega ao alvo,
// duas notas na confirmação, duas descendo no alerta e uma no fechamento.
const sons = (plano: Plano, cena: ReturnType<typeof montarCena>): Som[] => {
  const lista: Som[] = [];
  let nota = 0;
  const estrela = (em: number, volume = 0.3) => lista.push({ em: em - 0.02, arquivo: `sfx/estrela-${(nota++ % 5) + 1}.wav`, volume });
  cena.blocos.forEach((b) => {
    lista.push({ em: b.de + 0.05, arquivo: "sfx/ocular.wav", volume: 0.45 });
    if (b.ate < plano.duracao - 0.5) lista.push({ em: b.ate + 0.05, arquivo: "sfx/ocular.wav", volume: 0.35 });
    b.cartas.slice(1).forEach((c) => lista.push({ em: c.inicio + 0.05, arquivo: "sfx/ocular.wav", volume: 0.22 }));
  });
  for (const { p } of cena.passos) {
    if (p.acao === "acender") p.estrelas.forEach((_, j) => estrela(p.em + j * (p.ritmo ?? 0.45)));
    if (p.acao === "prolongar" && p.marca) lista.push({ em: (p.chegaEm ?? p.em + 1.2) - 0.05, arquivo: "sfx/polo.wav", volume: 0.5 });
    if (p.acao === "apontar" && p.texto) lista.push({ em: (p.textoEm ?? p.em + 0.8) + 0.05, arquivo: "sfx/confirma.wav", volume: 0.42 });
  }
  for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
    switch (m.tipo) {
      case "topicos":
      case "passos":
        m.itens.forEach((i) => estrela(i.em));
        break;
      case "constelacao": {
        m.estrelas.forEach((e) => estrela(e.em));
        const v = quandoChega(m);
        if (v) lista.push({ em: v.chega - 0.05, arquivo: "sfx/polo.wav", volume: 0.5 });
        break;
      }
      case "numero": {
        if (tipoDoNumero(m) === "contagem") {
          const ritmo = Math.min(0.35, 1.8 / m.valor);
          for (let j = 0; j < m.valor; j++) estrela(m.em + j * ritmo, 0.24);
        } else lista.push({ em: m.em + duracaoDoNumero(m) - 0.05, arquivo: "sfx/polo.wav", volume: 0.42 });
        break;
      }
      case "comparacao":
        m.lados.forEach((l) => estrela(l.em));
        if (m.vencedor !== undefined || m.modo === "errado-certo") lista.push({ em: (m.vencedorEm ?? m.lados[1].em + 0.4) + 0.05, arquivo: "sfx/confirma.wav", volume: 0.38 });
        break;
      case "grafico":
        if (m.dados?.length) m.dados.forEach((d) => estrela(d.em + (m.forma === "barras" ? 0.4 : 0)));
        else estrela(m.tendenciaEm ?? m.de + 0.6);
        break;
      case "definicao":
        estrela(m.em);
        lista.push({ em: m.significadoEm + 0.5, arquivo: "sfx/polo.wav", volume: 0.42 });
        break;
      case "destaque":
        if (m.nivel === "alerta") lista.push({ em: m.em - 0.02, arquivo: "sfx/alerta.wav", volume: 0.4 });
        else estrela(m.em);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => estrela(o.em, 0.26));
        break;
      case "cta":
        lista.push({ em: (m.acaoEm ?? m.em ?? m.de + 0.1) - 0.02, arquivo: "sfx/salvar.wav", volume: 0.4 });
        break;
      default:
        break;
    }
  }
  // nunca dois sons colados
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.3) saida.push(s);
  return saida;
};

// Os blocos universais da carta: cada um no seu lugar do céu; quando a luneta muda de lugar, o que sai
// e o que entra deslizam juntos com o céu.
const BlocosDaCarta: React.FC<{ cena: ReturnType<typeof montarCena>; plano: Plano; t: number; cobertura: number }> = ({ cena, plano, t, cobertura }) => (
  <>
    {cena.entradas
      .filter((e) => !ehCarta(e.m))
      .map((e: Entrada) => {
        const b = blocoDaEntrada(cena, e);
        const i = b.cartas.indexOf(e);
        const ultimo = i === b.cartas.length - 1;
        const fim = fimDaEntrada(cena, e);
        const desde = i === 0 ? b.de - 0.1 : e.inicio - 0.05;
        const ate = ultimo ? b.ate + 0.75 : fim + 0.72;
        if (t < desde || t > ate) return null;
        const off = deslocamento(cena, e, t);
        // no fim do bloco o conteúdo fica até a íris cobrir a tela (sem quadro de pessoa sozinha num céu vazio)
        const vida = ultimo ? (t >= b.ate ? cobertura : 1) : 1 - prog(t, fim + 0.05, 0.6);
        const props = { areas: areasDe(e.posicao), t, palavras: plano.palavras, inicio: e.inicio, fim };
        const m = e.m;
        const conteudo =
          m.tipo === "topicos" || m.tipo === "passos" ? (
            <Lista m={m} {...props} />
          ) : m.tipo === "numero" ? (
            <NumeroNaCarta m={m} {...props} />
          ) : m.tipo === "comparacao" ? (
            <ComparacaoNaCarta m={m} {...props} />
          ) : m.tipo === "grafico" ? (
            <GraficoNaCarta m={m} {...props} />
          ) : m.tipo === "definicao" ? (
            <DefinicaoNaCarta m={m} {...props} />
          ) : m.tipo === "constelacao" ? (
            <ConstelacaoNaCarta m={m} {...props} />
          ) : null;
        return (
          <div key={`bl-${e.inicio}`} style={{ position: "absolute", inset: 0, transform: `translate(${off.x}px, ${off.y}px)`, opacity: vida }}>
            {conteudo}
          </div>
        );
      })}
  </>
);

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  // A faixa do peito no quadro deitado: de logo abaixo do queixo (o `zona.topo` do cortar.mjs) até a
  // legenda, quando o momento a mantém, ou até acima dos controles do player. Larga e baixa: os
  // blocos de tela cheia se recompõem em fileiras.
  const topoPeito = Math.round(limitar(plano.zona?.topo ?? zonaPadrao.topo, TOPO_PEITO.min, TOPO_PEITO.max));
  const zonaDo = (m: { legenda?: boolean } | null): Zona => {
    const fundo = m?.legenda ? LEGENDA_Y - 16 : LIMITE_TEXTO_CHEIO;
    return { esquerda: zonaPadrao.esquerda, direita: zonaPadrao.direita, topo: topoPeito, altura: fundo - topoPeito };
  };
  const zona = zonaDo(null);
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const cena = useMemo(() => montarCena(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, cena), [plano, cena]);
  const figura = useMemo(() => figuraDaMiniatura(plano, cena.mundo), [plano, cena]);

  const ocular = estadoDaOcular(cena, plano, t);
  const bloco = blocoNoTempo(cena, t);
  const naCartaAgora = ocular.janela > 0 || !!bloco;
  const vigente = ocularVigente(cena, t);
  const temCarta = cena.entradas.some((e) => ehCarta(e.m));
  const entradaAgora = bloco ? entradaNoTempo(cena, t) : null;

  // momentos de tela cheia vivos agora
  const cheios = plano.momentos.filter((m) => !naCarta(m) && t >= m.de - 0.1 && t <= fimDoMomento(m, plano) + 0.8);

  // degradê escuro embaixo só enquanto há texto de tela cheia para ler
  const textoCheio = Math.max(
    0,
    ...plano.momentos.filter((m) => !naCarta(m)).map((m) => Math.min(prog(t, m.de - 0.1, 0.4), 1 - saindo(t, fimDoMomento(m, plano), 0.3))),
  );
  // a legenda fica no terço de baixo nos dois lugares (tela cheia e carta)
  const legendaY = ocular.janela > 0.5 ? LEGENDA_CARTA_Y : LEGENDA_Y;
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.13;
  const rostoTela = { x: plano.rosto.x * W, y: plano.rosto.y * H, largura: largura * W };
  const fimDe = (m: Momento) => fimDoMomento(m, plano);
  // quando a íris abre, o conteúdo da carta só sai quando o círculo já cobriu quase a tela toda
  // (medido pelo raio da tela cheia: no quadro deitado ele é bem menor que no vertical)
  const cobertura = ocular.janela >= 1 ? 1 : 1 - limitar((ocular.R - 0.76 * ocular.Rcheio) / (0.28 * ocular.Rcheio));
  // o texto de tela cheia só aparece com a íris bem aberta (nada de pedaço de texto dentro do círculo)
  const revela = ocular.cheio ? 1 : limitar((ocular.R - 0.45 * ocular.Rcheio) / (0.31 * ocular.Rcheio));

  return (
    <AbsoluteFill style={{ backgroundColor: cor.ceu }}>
      {naCartaAgora && cena.blocos.length ? (
        <>
          {cena.mundo.celeste ? <Carta cena={cena} plano={plano} t={t} presenca={1} conteudo={cobertura} /> : <FundoCeu pan={panNoTempo(cena, t)} t={t} />}
          {!cena.mundo.celeste && temCarta ? <Carta cena={cena} plano={plano} t={t} presenca={1} conteudo={cobertura} fundo={false} /> : null}
          <BlocosDaCarta cena={cena} plano={plano} t={t} cobertura={cobertura} />
          <Prancha />
        </>
      ) : null}

      <PessoaNaOcular video={plano.video} estado={ocular} rosto={pontoDoRosto(plano.rosto, t)} videoAltura={videoAltura} assinatura={[plano.marca.nome, plano.marca.area].filter(Boolean).join(" · ")}>
        {videoAltura < H ? <div style={{ position: "absolute", left: 0, right: 0, top: videoAltura - 300, height: 300, background: `linear-gradient(to bottom, rgba(10,11,31,0), ${cor.ceu})` }} /> : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            // no quadro deitado a faixa do peito começa a ~60% da altura
            background: "linear-gradient(to bottom, rgba(6,7,20,0) 44%, rgba(6,7,20,0.5) 58%, rgba(6,7,20,0.74) 76%, rgba(6,7,20,0.82) 100%)",
            opacity: textoCheio * (1 - ocular.janela),
          }}
        />
        <div style={{ position: "absolute", inset: 0, opacity: revela }}>
        {cheios.map((m) => {
          const chave = `${m.tipo}-${m.de}`;
          // o próximo é de tela cheia: este texto sai inteiro antes de o outro entrar; o próximo é de
          // carta: a própria íris apaga o texto ao fechar (ele fica até ser coberto)
          const proximo = plano.momentos.find((o) => o.de >= m.ate - 0.05 && o !== m);
          const daCarta = !!proximo && naCarta(proximo);
          const fim = daCarta ? fimDe(m) + 0.3 : fimDe(m);
          switch (m.tipo) {
            case "abertura": {
              const proxBloco = cena.blocos.find((b) => b.de >= m.de - 0.1)?.de ?? Infinity;
              const saida = daCarta ? Math.min(fimDe(m) + 0.3, proxBloco + 0.12) : fimDe(m) - 0.35;
              return <Abertura key={chave} m={m} palavras={plano.palavras} figura={figura} t={t} zona={zonaDo(m)} saida={saida} rosto={rostoTela} medalha={!cena.mundo.celeste} />;
            }
            case "cta": {
              const volta = cena.blocos.find((b) => Math.abs(b.ate - m.de) < 0.6);
              return <Cta key={chave} m={m} palavras={plano.palavras} marca={plano.marca} t={t} zona={zonaDo(m)} pronto={volta ? volta.ate + 0.35 : m.de} />;
            }
            case "destaque":
              return <DestaqueCheio key={chave} m={m} palavras={plano.palavras} t={t} zona={zonaDo(m)} fim={fim} />;
            case "frase":
              return <FraseCheia key={chave} m={m} palavras={plano.palavras} t={t} zona={zonaDo(m)} fim={fim} />;
            case "pergunta":
              return <PerguntaCheia key={chave} m={m} palavras={plano.palavras} t={t} zona={zonaDo(m)} fim={fim} />;
            case "numero":
              return <NumeroCheio key={chave} m={m} palavras={plano.palavras} t={t} zona={zonaDo(m)} fim={fim} />;
            default:
              return null;
          }
        })}
        </div>
      </PessoaNaOcular>

      {/* a legenda some enquanto a ocular está no meio da troca (não pula de lugar) */}
      <Legendas frases={frases} y={legendaY} visivel={ocular.cheio ? 1 : Math.max(0, (ocular.janela - 0.85) / 0.15)} />

      {guias ? <Guias plano={plano} zona={zona} ocular={ocular} palco={vigente} legendaY={legendaY} areas={entradaAgora && !ehCarta(entradaAgora.m) ? areasDe(entradaAgora.posicao) : null} /> : null}

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
