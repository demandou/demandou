import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { palavrasCorrigidas, prog, saindo, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { CartaoAmostras, PainelAmostras } from "./componentes/Amostras";
import { Cta } from "./componentes/Cta";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { ancoraDaMarca, CamadaDeCor, CamadaDeTraco, type Desenho, ladoDaMarca, PontoNumerado } from "./componentes/Marcas";
import { CartaoComparacao, CartaoGrafico, CartaoPergunta } from "./componentes/Cartoes";
import { BlocoNumero } from "./componentes/Numero";
import { PainelDefinicao, PainelPassos, PainelTopicos } from "./componentes/Paineis";
import { PeitoDestaque, PeitoFrase } from "./componentes/Peito";
import { CartaoTruque, Ligacoes, PainelTruque } from "./componentes/Truque";
import { caixaDoLayout, estadosDaCaixa, type MomentoComLayout, regiaoDoPainel, regiaoFinalDoPainel, resolverLayouts } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano, Truque } from "./plano";
import { queixoNaTela, rostoNaTela, uv } from "./rosto";
import { cor, corDoProduto } from "./tema";

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

// Som raro e tonal: um tom grave na abertura e no fechamento, uma nota por bloco de conteúdo
// (subindo: 1, 2, 3, 4, como uma escala), a nota mais grave no alerta, um acorde curto no resultado.
const sons = (plano: Plano, lista: MomentoComLayout[]): Som[] => {
  const saida: Som[] = [];
  let n = 0;
  const nota = (em: number, volume = 0.38) => {
    saida.push({ em, arquivo: `sfx/nota-${(n % 4) + 1}.wav`, volume });
    n++;
  };
  for (const { m } of lista) {
    switch (m.tipo) {
      case "abertura":
        saida.push({ em: Math.max(0, m.de) + 0.3, arquivo: "sfx/abre.wav", volume: 0.35 });
        break;
      case "truque":
        nota(m.de + 0.08, 0.4);
        break;
      case "amostras":
      case "topicos":
      case "passos":
      case "definicao":
      case "comparacao":
      case "grafico":
        nota(m.de + 0.08, 0.35);
        break;
      case "numero":
        saida.push({ em: m.emFim ?? (m.em ?? m.de + 0.4) + 0.9, arquivo: "sfx/nota-4.wav", volume: 0.32 });
        break;
      case "destaque":
        saida.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/nota-1.wav" : "sfx/nota-3.wav", volume: 0.34 });
        break;
      case "pergunta":
        saida.push({ em: m.de + 0.1, arquivo: "sfx/nota-2.wav", volume: 0.32 });
        break;
      case "frase":
        break;
      case "resultado":
        saida.push({ em: m.marcasEm ?? m.de + 0.1, arquivo: "sfx/acorde.wav", volume: 0.38 });
        break;
      case "cta":
        saida.push({ em: m.de + 0.35, arquivo: "sfx/abre.wav", volume: 0.35 });
        break;
    }
  }
  const ordenados = saida.sort((a, b) => a.em - b.em);
  const final: Som[] = [];
  for (const s of ordenados) if (!final.length || s.em - final[final.length - 1].em > 0.45) final.push(s);
  return final;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const palavras = useMemo(() => palavrasCorrigidas(plano), [plano]);
  const lista = useMemo(() => resolverLayouts(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano, lista), [plano, lista]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaSons = useMemo(() => sons(plano, lista), [plano, lista]);
  const caixa = caixaNoTempo(t, estados);
  const rosto = rostoNaTela(plano, caixa, t);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const truques = lista.filter((x) => x.m.tipo === "truque").map((x) => x.m as Truque);
  const totalTruques = truques.filter((m) => m.numero !== undefined).length;
  const topoTexto = Math.max(880, (plano.zona?.topo ?? 970) - 40);

  const ativos = lista
    .map((x) => ({ ...x, fim: fimDoMomento(x.m, plano) }))
    .filter((x) => t >= x.m.de - 0.05 && t <= x.fim + 0.9);

  // marcas no rosto: as dos truques na tela e, no resultado, todas juntas de novo
  const desenhos: Desenho[] = [];
  let ladoEtiqueta: 1 | -1 = 1;
  for (const x of ativos) {
    if (x.m.tipo === "truque") {
      const m = x.m;
      (m.marcas ?? []).forEach((mk, i) =>
        desenhos.push({ chave: `t${m.de}-${i}`, marca: mk, cor: corDoProduto(mk.cor ?? m.cor), fim: m.ate }),
      );
      if (x.layout === "lado") ladoEtiqueta = x.lado === "esquerda" ? 1 : -1;
    }
    if (x.m.tipo === "resultado") {
      const r = x.m;
      const inicio = r.marcasEm ?? r.de + 0.1;
      truques
        .filter((m) => m.de < r.de)
        .forEach((m, j) =>
          (m.marcas ?? []).forEach((mk, i) =>
            desenhos.push({
              chave: `r${r.de}-${j}-${i}`,
              marca: { ...mk, em: inicio + j * 0.16, rotulo: undefined },
              cor: corDoProduto(mk.cor ?? m.cor),
              fim: x.fim,
              resumo: true,
            }),
          ),
        );
    }
  }

  // texto sobre o vídeo logo depois de um painel: espera a pessoa voltar para a tela cheia
  // (a página do painel some coberta pela pessoa antes de o texto novo aparecer)
  const entradaDoTexto = (x: MomentoComLayout) => {
    const i = lista.findIndex((o) => o.m === x.m);
    const anterior = lista[i - 1];
    return anterior && anterior.layout === "lado" && x.layout !== "lado" && x.m.de - anterior.m.ate < 0.3 ? x.m.de + 0.45 : x.m.de;
  };
  // o cartão que sobe de baixo também espera: o momento "começa" para ele quando a pessoa voltou
  const paraCartao = <M extends Momento>(x: MomentoComLayout, m: M): M => {
    const desde = entradaDoTexto(x);
    return desde > m.de ? { ...m, de: desde } : m;
  };

  // o cartão que sobe de baixo para antes do queixo (na caixa do layout do momento)
  const limiteDoCartao = (x: MomentoComLayout) => queixoNaTela(plano, caixaDoLayout(x.layout, x.lado, plano)) + 24;

  // véu escuro embaixo, só enquanto há texto direto sobre o vídeo
  const veu = Math.max(
    0,
    ...ativos
      .filter((x) => ["abertura", "numero", "resultado", "destaque", "frase"].includes(x.m.tipo) && x.layout !== "lado")
      .map((x) => Math.min(prog(t, x.m.de - 0.2, 0.4), 1 - saindo(t, x.fim, 0.35))),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: cor.creme }}>
      {/* painéis do layout "lado" (por baixo da pessoa: quando ela volta, cobre o painel) */}
      {ativos
        .filter((x) => x.layout === "lado")
        .map((x) => {
          const regiao = regiaoDoPainel(caixa, x.lado);
          const final = regiaoFinalDoPainel(x.lado);
          const chave = `${x.m.tipo}-${x.m.de}`;
          if (x.m.tipo === "truque")
            return <PainelTruque key={chave} m={x.m} t={t} fim={x.fim} palavras={palavras} regiao={regiao} regiaoFinal={final} lado={x.lado} total={totalTruques} />;
          if (x.m.tipo === "amostras")
            return <PainelAmostras key={chave} m={x.m} t={t} fim={x.fim} palavras={palavras} regiao={regiao} regiaoFinal={final} lado={x.lado} />;
          if (x.m.tipo === "topicos")
            return <PainelTopicos key={chave} m={x.m} t={t} fim={x.fim} palavras={palavras} regiao={regiao} regiaoFinal={final} lado={x.lado} />;
          if (x.m.tipo === "passos")
            return <PainelPassos key={chave} m={x.m} t={t} fim={x.fim} palavras={palavras} regiao={regiao} regiaoFinal={final} lado={x.lado} />;
          if (x.m.tipo === "definicao")
            return <PainelDefinicao key={chave} m={x.m} t={t} fim={x.fim} palavras={palavras} regiao={regiao} regiaoFinal={final} lado={x.lado} />;
          return null;
        })}

      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(1.02)" />

      {veu > 0 ? (
        <div
          style={{
            position: "absolute",
            left: caixa.x,
            top: caixa.y,
            width: caixa.w,
            height: caixa.h,
            background: "linear-gradient(to bottom, rgba(24,12,18,0) 42%, rgba(24,12,18,0.42) 62%, rgba(24,12,18,0.55) 100%)",
            opacity: veu,
          }}
        />
      ) : null}

      <CamadaDeCor desenhos={desenhos} t={t} rosto={rosto} plano={plano} id="cor" recorte={caixa} />
      <CamadaDeTraco desenhos={desenhos} t={t} rosto={rosto} plano={plano} id="traco" recorte={caixa} ladoEtiqueta={ladoEtiqueta} />

      {ativos
        .filter((x) => x.m.tipo === "truque" && x.layout === "lado")
        .map((x) => (
          <Ligacoes
            key={`lig-${x.m.de}`}
            m={x.m as Truque}
            t={t}
            fim={x.m.ate}
            rosto={rosto}
            plano={plano}
            caixa={caixa}
            regiao={regiaoDoPainel(caixa, x.lado)}
            regiaoFinal={regiaoFinalDoPainel(x.lado)}
            lado={x.lado}
            id={`lig-${x.m.de}`}
          />
        ))}

      {/* abertura: mapa do rosto com os pontos numerados */}
      {ativos
        .filter((x) => x.m.tipo === "abertura")
        .flatMap((x) => {
          const m = x.m as Extract<Momento, { tipo: "abertura" }>;
          return (m.pontos ?? []).map((p, i) => {
            const s: 1 | -1 = p.lado === "esquerda" ? -1 : 1;
            const c = rosto.ponto(uv(p.onde, s, plano));
            return <PontoNumerado key={`pn-${m.de}-${i}`} c={c} n={i + 1} t={t} em={p.em} fim={x.fim} W={rosto.W} />;
          });
        })}

      {/* truque: o número dele aparece no rosto, no lugar da marca, e dá lugar ao desenho */}
      {ativos
        .filter((x) => x.m.tipo === "truque")
        .map((x) => {
          const m = x.m as Truque;
          const primeira = (m.marcas ?? [])[0];
          if (m.numero === undefined || !primeira) return null;
          const preferido: 1 | -1 = x.layout === "lado" ? (x.lado === "esquerda" ? 1 : -1) : 1;
          const c = ancoraDaMarca(primeira, ladoDaMarca(primeira, preferido), rosto, plano, Math.min(t, primeira.em));
          return <PontoNumerado key={`pt-${m.de}`} c={c} n={m.numero} t={t} em={m.de + 0.12} fim={Math.min(m.ate, primeira.em + 0.45)} W={rosto.W} />;
        })}

      {ativos.map((x) => {
        const chave = `${x.m.tipo}-${x.m.de}`;
        const m = x.m;
        switch (m.tipo) {
          case "abertura":
            return <Abertura key={chave} m={m} t={t} fim={x.fim} palavras={palavras} topo={topoTexto} />;
          case "truque":
            return x.layout === "lado" ? null : (
              <CartaoTruque key={chave} m={paraCartao(x, m)} t={t} fim={x.fim} palavras={palavras} total={totalTruques} limiteTopo={limiteDoCartao(x)} />
            );
          case "amostras":
            return x.layout === "lado" ? null : <CartaoAmostras key={chave} m={paraCartao(x, m)} t={t} fim={x.fim} palavras={palavras} />;
          case "numero": {
            const em = m.em ?? m.de + 0.4;
            const rotuloEm = m.rotuloEm ?? m.de;
            return (
              <BlocoNumero
                key={chave}
                t={t}
                de={m.de}
                fim={x.fim}
                palavras={palavras}
                texto={m.texto ?? m.rotulo}
                textoDe={m.texto ? m.de : rotuloEm}
                textoAte={rotuloEm < em ? em + 0.3 : m.ate}
                desde={entradaDoTexto(x)}
                numero={{
                  valor: m.valor,
                  unidade: m.sufixo ?? m.unidade,
                  prefixo: m.prefixo,
                  casas: m.casas,
                  em,
                  emFim: m.emFim ?? em + 0.9,
                  icone: m.icone,
                  ilustrativo: m.ilustrativo,
                }}
                topo={topoTexto + 80}
              />
            );
          }
          case "destaque":
            return <PeitoDestaque key={chave} m={m} t={t} fim={x.fim} palavras={palavras} topo={topoTexto + 40} desde={entradaDoTexto(x)} />;
          case "frase":
            return <PeitoFrase key={chave} m={m} t={t} fim={x.fim} palavras={palavras} topo={topoTexto + 60} desde={entradaDoTexto(x)} />;
          case "comparacao":
            return <CartaoComparacao key={chave} m={paraCartao(x, m)} t={t} fim={x.fim} palavras={palavras} limiteTopo={limiteDoCartao(x)} />;
          case "grafico":
            return <CartaoGrafico key={chave} m={paraCartao(x, m)} t={t} fim={x.fim} palavras={palavras} limiteTopo={limiteDoCartao(x)} />;
          case "pergunta":
            return <CartaoPergunta key={chave} m={paraCartao(x, m)} t={t} fim={x.fim} palavras={palavras} limiteTopo={limiteDoCartao(x)} />;
          case "resultado":
            return (
              <BlocoNumero
                key={chave}
                t={t}
                de={m.de}
                fim={x.fim}
                palavras={palavras}
                texto={m.texto}
                textoAte={m.numero?.em ?? m.ate}
                desde={entradaDoTexto(x)}
                numero={m.numero}
                topo={topoTexto + 80}
              />
            );
          case "cta":
            return <Cta key={chave} m={paraCartao(x, m)} t={t} fim={x.fim} palavras={palavras} marca={plano.marca} limiteTopo={limiteDoCartao(x)} />;
        }
        return null;
      })}

      <Legendas frases={frases} area={caixa.w < 1000 ? { x: caixa.x, w: caixa.w } : undefined} />

      {guias ? <Guias plano={plano} caixa={caixa} rosto={rosto} t={t} /> : null}

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
