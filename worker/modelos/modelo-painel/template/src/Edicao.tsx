import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { PalavrasCtx, prog, useTempo } from "./anim";
import { Abertura, Definicao, DestaqueFrase, Frase, Numero, Pergunta } from "./componentes/Cartoes";
import { Comparacao } from "./componentes/Comparacao";
import { Cta } from "./componentes/Cta";
import { DestaqueEmBarras } from "./componentes/Destaque";
import { Divisao } from "./componentes/Divisao";
import { Gancho } from "./componentes/Gancho";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Indicadores } from "./componentes/Indicadores";
import { Legendas } from "./componentes/Legendas";
import { Passos, Topicos } from "./componentes/Listas";
import { caixaNoInstante, cheiura, estadosDaCaixa, iniciosDosMomentos, ladosDosPaineis, PAINEL } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { destaqueEmBarras, ehPainel, type Lado, type Momento, type Plano } from "./plano";
import { cor, mono } from "./tema";

const proximoDe = (m: Momento, plano: Plano) => [...plano.momentos].sort((a, b) => a.de - b.de).find((o) => o.de > m.de);
const emendaComPainel = (m: Momento, plano: Plano) => {
  const proximo = proximoDe(m, plano);
  return !!proximo && ehPainel(m) && ehPainel(proximo) && proximo.de - m.ate < 0.4;
};

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
// Entre dois painéis seguidos, o conteúdo que sai cruza com o que entra (a tela nunca fica vazia).
// O painel que volta para a tela cheia fica embaixo da pessoa enquanto ela cresce por cima dele
// e sai junto com a troca: nenhum quadro com a pessoa solta num fundo vazio.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const proximo = proximoDe(m, plano);
  if (!proximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  if (emendaComPainel(m, plano)) return m.ate + 0.5;
  if (ehPainel(m)) return m.ate + 0.45;
  // cartão de tela cheia antes de um painel: some enquanto a pessoa já encolhe sobre o painel
  if (proximo && ehPainel(proximo) && proximo.de - m.ate < 0.4) return m.ate + 0.2;
  return m.ate;
};

// Um momento nunca invade o seguinte (termina quando o próximo começa).
const semSobreposicao = (plano: Plano): Plano => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordem.map((m, i) => {
      const proximo = ordem[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// Sons raros e tonais: a tela que abre, cada dado que se revela, o veredito.
const sons = (plano: Plano, lados: Map<Momento, Lado>, inicios: Map<Momento, number>) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  ordem.forEach((m, i) => {
    const anterior = ordem[i - 1];
    const vemDoQuadroCheio = !anterior || !lados.has(anterior) || m.de - anterior.ate > 0.4;
    if (ehPainel(m) && vemDoQuadroCheio) lista.push({ em: m.de, arquivo: "sfx/abre.wav", volume: 0.5 });
    const t0 = inicios.get(m) ?? m.de;
    if (m.tipo === "gancho" && m.numero) lista.push({ em: m.numero.em, arquivo: "sfx/sobe.wav", volume: 0.35 });
    if (m.tipo === "grafico" && m.series?.length)
      (m.itens ?? [])
        .filter((it) => it.serie !== undefined)
        .forEach((it, k) => lista.push({ em: it.em, arquivo: `sfx/nota-${Math.min(4, k + 2)}.wav`, volume: 0.32 }));
    if (m.tipo === "divisao")
      m.itens
        .filter((it) => it.em > t0 + 0.2)
        .forEach((it, k) => lista.push({ em: it.em, arquivo: `sfx/nota-${Math.min(4, k + 3)}.wav`, volume: 0.32 }));
    if (m.tipo === "destaque" && destaqueEmBarras(m)) {
      if (m.numero && !m.ilustrativo && m.valores?.length) lista.push({ em: m.numero.em, arquivo: "sfx/nota-2.wav", volume: 0.3 });
      lista.push({ em: m.grifoEm ?? m.em, arquivo: "sfx/nota-4.wav", volume: 0.32 });
    } else if (m.tipo === "destaque") {
      const alerta = (m.nivel ?? "alerta") === "alerta";
      lista.push({ em: Math.max(t0, m.em), arquivo: alerta ? "sfx/desce.wav" : "sfx/nota-4.wav", volume: alerta ? 0.36 : 0.32 });
    }
    if (m.tipo === "comparacao") {
      if (m.opcoes?.length)
        m.opcoes.forEach((o) =>
          lista.push({
            em: o.vereditoEm ?? o.em + 1,
            arquivo: o.positivo ? "sfx/nota-4.wav" : "sfx/desce.wav",
            volume: o.positivo ? 0.32 : 0.4,
          }),
        );
      else {
        const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
        (m.lados ?? []).forEach((l, k) =>
          lista.push(
            vencedor === undefined
              ? { em: l.em, arquivo: `sfx/nota-${k + 2}.wav`, volume: 0.26 }
              : {
                  em: l.vereditoEm ?? m.vencedorEm ?? l.em + 1,
                  arquivo: k === vencedor ? "sfx/nota-4.wav" : "sfx/desce.wav",
                  volume: k === vencedor ? 0.32 : 0.4,
                },
          ),
        );
      }
    }
    if (m.tipo === "cta") lista.push({ em: m.de + 0.1, arquivo: "sfx/nota-1.wav", volume: 0.3 });
    // blocos universais: uma nota por item (subindo nas etapas), o número que conta, a dica que abre
    if (m.tipo === "topicos") m.itens.slice(0, 5).forEach((it, k) => lista.push({ em: Math.max(it.em, t0), arquivo: `sfx/nota-${(k % 2) + 2}.wav`, volume: 0.22 }));
    if (m.tipo === "passos") m.itens.slice(0, 5).forEach((it, k) => lista.push({ em: Math.max(it.em, t0), arquivo: `sfx/nota-${Math.min(4, k + 1)}.wav`, volume: 0.26 }));
    if (m.tipo === "painel") m.cartoes.slice(0, 4).forEach((c, k) => lista.push({ em: Math.max(c.em, t0), arquivo: `sfx/nota-${Math.min(4, k + 2)}.wav`, volume: 0.24 }));
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/sobe.wav", volume: 0.32 });
    if (m.tipo === "definicao") lista.push({ em: m.significadoEm, arquivo: "sfx/nota-3.wav", volume: 0.26 });
    if (m.tipo === "frase" && m.risco) lista.push({ em: m.riscoEm ?? m.de + 1, arquivo: "sfx/desce.wav", volume: 0.3 });
    if (m.tipo === "pergunta") lista.push({ em: m.de + 0.1, arquivo: "sfx/nota-2.wav", volume: 0.24 });
    if (m.tipo === "grafico" && !m.series?.length) {
      const dados = m.dados ?? [];
      if (dados.length >= 2) lista.push({ em: Math.max(dados[dados.length - 1].em, t0), arquivo: "sfx/nota-4.wav", volume: 0.3 });
      else lista.push({ em: t0 + 0.45, arquivo: m.tendencia === "cai" ? "sfx/desce.wav" : "sfx/sobe.wav", volume: 0.3 });
    }

  });
  return lista;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => semSobreposicao(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const zona = { esquerda: 60, direita: 60, topo: plano.zona?.topo ?? 1000, altura: plano.zona?.altura ?? 470 };

  const lados = useMemo(() => ladosDosPaineis(plano.momentos), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano, lados), [plano, lados]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const inicios = useMemo(() => iniciosDosMomentos(plano, lados), [plano, lados]);
  const listaDeSons = useMemo(() => sons(plano, lados, inicios), [plano, lados, inicios]);

  const caixa = caixaNoInstante(t, plano, estados);
  const cheia = cheiura(caixa);
  const janela = 1 - cheia;
  const ativos = plano.momentos.filter((m) => t >= Math.min(m.de, inicios.get(m) ?? m.de) - 0.05 && t <= fimDoMomento(m, plano));

  // Legenda: no rodapé do painel durante momentos de painel; em quadro cheio, logo abaixo do
  // queixo — ou abaixo do componente, se ele estiver na tela com `legenda: true`.
  const legendaCheia = Math.max(zona.topo - 40, 900);
  const yLegenda = (instante: number) => {
    const m = plano.momentos.find((x) => instante >= x.de - 0.05 && instante < x.ate);
    if (m && ehPainel(m)) return PAINEL.legenda;
    if (m) return Math.min(zona.topo + zona.altura + 18, 1486);
    return legendaCheia;
  };

  // desenha um momento (os painéis vão por baixo da pessoa; os cartões, por cima)
  const desenhar = (momento: Momento) => {
    let m = momento;
    const chave = `${m.tipo}-${m.de}`;
    const lado = lados.get(m) ?? "dir";
    const t0 = inicios.get(m) ?? m.de;
    const fim = fimDoMomento(m, plano);
    // entre dois painéis: o cabeçalho sai logo (a janela passa por cima dele) e o corpo espera o
    // corpo seguinte entrar; voltando para a tela cheia, os dois saem enquanto a pessoa cresce
    const saida = { fimCabecalho: emendaComPainel(m, plano) ? Math.min(fim, m.ate + 0.1) : fim, fimCorpo: fim };
    if (m.tipo === "grafico") return <Grafico key={chave} m={m} lado={lado} t0={t0} {...saida} />;
    if (m.tipo === "divisao") return <Divisao key={chave} m={m} lado={lado} t0={t0} {...saida} />;
    if (m.tipo === "topicos") return <Topicos key={chave} m={m} lado={lado} t0={t0} {...saida} />;
    if (m.tipo === "passos") return <Passos key={chave} m={m} lado={lado} t0={t0} {...saida} />;
    if (m.tipo === "painel") return <Indicadores key={chave} m={m} lado={lado} t0={t0} {...saida} />;
    if (m.tipo === "destaque" && destaqueEmBarras(m)) return <DestaqueEmBarras key={chave} m={m} lado={lado} t0={t0} {...saida} />;
    // o último momento de quadro cheio fica até o último quadro (não some antes do fim)
    if (fim > m.ate && m.tipo !== "cta") m = { ...m, ate: fim };
    return (
      <div key={chave} style={{ position: "absolute", left: zona.esquerda, top: zona.topo }}>
        {m.tipo === "gancho" ? <Gancho m={m} zona={zona} t0={t0} rotuloPadrao={plano.marca.area || undefined} /> : null}
        {m.tipo === "abertura" ? <Abertura m={m} zona={zona} t0={t0} rotuloPadrao={plano.marca.area || undefined} /> : null}
        {m.tipo === "numero" ? <Numero m={m} zona={zona} t0={t0} /> : null}
        {m.tipo === "destaque" ? <DestaqueFrase m={m} zona={zona} t0={t0} /> : null}
        {m.tipo === "definicao" ? <Definicao m={m} zona={zona} t0={t0} /> : null}
        {m.tipo === "frase" ? <Frase m={m} zona={zona} t0={t0} /> : null}
        {m.tipo === "pergunta" ? <Pergunta m={m} zona={zona} t0={t0} /> : null}
        {m.tipo === "comparacao" ? <Comparacao m={m} zona={zona} t0={t0} /> : null}
        {m.tipo === "cta" ? <Cta m={m} marca={plano.marca} fim={fim} zona={zona} t0={t0} /> : null}
      </div>
    );
  };

  return (
    <PalavrasCtx.Provider value={plano.palavras}>
      <AbsoluteFill style={{ backgroundColor: cor.fundo }}>
        {/* momentos de painel: por baixo da pessoa. Na troca, a pessoa encolhe revelando o painel
            que já está montado embaixo, ou cresce por cima dele enquanto ele sai */}
        {ativos.filter((m) => ehPainel(m)).map(desenhar)}
        {/* a pessoa: quadro cheio ou janela */}
        <VideoNaCaixa
          src={plano.video}
          caixa={caixa}
          rosto={plano.rosto}
          videoAltura={videoAltura}
          filtro="contrast(1.03) saturate(0.94)"
        />
        {/* vídeo mais baixo que o quadro (3:4): a base dele se dissolve no fundo do painel */}
        {videoAltura < 1920 ? (
          <div
            style={{
              position: "absolute",
              left: caixa.x,
              top: caixa.y + caixa.h * 0.72,
              width: caixa.w,
              height: caixa.h * 0.28 + 1,
              background: `linear-gradient(to bottom, rgba(10,18,15,0), ${cor.fundo})`,
              opacity: cheia,
            }}
          />
        ) : null}
        {/* moldura da janela e etiqueta com o nome */}
        {janela > 0.02 ? (
          <div
            style={{
              position: "absolute",
              left: caixa.x,
              top: caixa.y,
              width: caixa.w,
              height: caixa.h,
              borderRadius: caixa.raio,
              border: `2px solid rgba(226,238,231,${0.22 * janela})`,
            }}
          >
            {plano.marca.nome ? (
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  bottom: 14,
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "rgba(10,18,15,0.8)",
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: 28,
                  color: cor.texto,
                  opacity: prog(janela, 0.75, 0.25),
                  whiteSpace: "nowrap",
                }}
              >
                {plano.marca.nome}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* momentos de quadro cheio: cartões por cima da pessoa */}
        {ativos.filter((m) => !ehPainel(m)).map(desenhar)}

        <Legendas frases={frases} y={yLegenda} />

        {guias ? <Guias plano={plano} zona={zona} legendaCheia={legendaCheia} /> : null}

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

