import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, useTempo } from "./anim";
import { AntesDepois } from "./componentes/AntesDepois";
import { type AreaCartao, CartaoAbertura, CartaoDestaque, CartaoFrase, CartaoNumero, CartaoPergunta } from "./componentes/Cartoes";
import { Comparacao } from "./componentes/Comparacao";
import { Cta } from "./componentes/Cta";
import { Definicao } from "./componentes/Definicao";
import { Grafico } from "./componentes/Grafico";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Medida } from "./componentes/Medida";
import { Notas } from "./componentes/Notas";
import { Passos } from "./componentes/Passos";
import { PlantaMomento } from "./componentes/PlantaMomento";
import { Papel } from "./componentes/Prancha";
import { Regua } from "./componentes/Regua";
import { Titulo } from "./componentes/Titulo";
import { caixaDoLayout, ehDaPrancha, estadosDaCaixa, JANELA_CHEIA, layoutDe, regiaoDoLayout, type Regiao } from "./layout";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Layout, Momento, Plano } from "./plano";
import { cor, MARGEM, zona as zonaPadrao } from "./tema";
import { janelasDosMomentos, posicaoDaRegua, type Janela } from "./troca";

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

// Sons raros e tonais: a prancha que sobe, um traço que começa, uma medida que fecha.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const tom = (i: number) => `sfx/traco-${(i % 3) + 1}.wav`;
  for (const m of plano.momentos) {
    if (layoutDe(m) !== "cheio") lista.push({ em: m.de, arquivo: "sfx/folha.wav", volume: 0.5 });
    switch (m.tipo) {
      case "titulo":
      case "abertura":
        lista.push({ em: Math.max(0, m.de) + 0.05, arquivo: tom(0), volume: 0.4 });
        if (m.cota?.em !== undefined) lista.push({ em: m.cota.em, arquivo: tom(1), volume: 0.35 });
        break;
      case "medida": {
        const em = m.em ?? m.de + 0.45;
        const fim = m.emFim ?? em + 1.3;
        lista.push({ em: fim, arquivo: "sfx/cota.wav", volume: 0.5 });
        break;
      }
      case "numero":
        lista.push({ em: m.em + 1.2, arquivo: "sfx/cota.wav", volume: 0.5 });
        break;
      case "planta": {
        (m.objetos ?? []).forEach((o, i) => {
          const mudas = o.muda ? (Array.isArray(o.muda) ? o.muda : [o.muda]) : [];
          mudas.forEach((mu) => lista.push({ em: mu.em, arquivo: tom(i + 1), volume: 0.32 }));
          if (o.tetoEm !== undefined) lista.push({ em: o.tetoEm, arquivo: tom(1), volume: 0.32 });
          if (o.chaoEm !== undefined) lista.push({ em: o.chaoEm, arquivo: tom(0), volume: 0.32 });
          if (o.pes !== undefined) lista.push({ em: o.pes, arquivo: "sfx/cota.wav", volume: 0.35 });
        });
        if (m.circulacao)
          lista.push({
            em: m.circulacao.em + (m.circulacao.dur ?? 1.1),
            arquivo: m.circulacao.bloqueada ? tom(0) : "sfx/cota.wav",
            volume: 0.4,
          });
        (m.comodos ?? []).forEach((c, i) => lista.push({ em: c.em, arquivo: c.alerta ? tom(0) : tom(i + 1), volume: c.alerta ? 0.36 : 0.3 }));
        if (m.comodos?.length && m.percurso?.bloqueado)
          lista.push({ em: m.percurso.bloqueioEm ?? m.comodos[m.comodos.length - 1].em + 0.5, arquivo: tom(0), volume: 0.4 });
        break;
      }
      case "passos":
      case "topicos":
        m.itens.forEach((it, i) => lista.push({ em: it.em, arquivo: tom(i), volume: 0.32 }));
        break;
      case "comparacao":
        m.lados.forEach((l, i) => lista.push({ em: l.em, arquivo: tom(i), volume: 0.32 }));
        if (m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm, arquivo: "sfx/cota.wav", volume: 0.4 });
        break;
      case "grafico":
        (m.dados ?? []).forEach((d, i) => lista.push({ em: d.em, arquivo: tom(i), volume: 0.3 }));
        if (!m.dados?.length) lista.push({ em: m.tendenciaEm ?? m.de + 0.3, arquivo: "sfx/cota.wav", volume: 0.4 });
        break;
      case "definicao":
        lista.push({ em: m.em, arquivo: tom(1), volume: 0.34 });
        lista.push({ em: m.significadoEm, arquivo: "sfx/cota.wav", volume: 0.4 });
        break;
      case "destaque":
        lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? tom(0) : "sfx/cota.wav", volume: 0.42 });
        break;
      case "frase":
        lista.push({ em: Math.max(0, m.de) + 0.05, arquivo: tom(2), volume: 0.32 });
        if (m.risco) lista.push({ em: m.riscoEm ?? m.de + 1, arquivo: tom(0), volume: 0.36 });
        break;
      case "pergunta":
        lista.push({ em: Math.max(0, m.de) + 0.1, arquivo: tom(1), volume: 0.34 });
        (m.opcoes ?? []).forEach((o, i) => lista.push({ em: o.em, arquivo: tom(i + 2), volume: 0.28 }));
        break;
      case "antesDepois":
        lista.push({ em: m.depois.em, arquivo: "sfx/cota.wav", volume: 0.42 });
        break;
      case "cta":
        lista.push({ em: m.de + 0.5, arquivo: tom(0), volume: 0.4 });
        break;
    }
  }
  // nunca dois sons colados
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Cartões no peito (abertura, número, destaque, frase, pergunta, fechamento, título, medida)
const DesenhaCartao: React.FC<{ m: Momento; plano: Plano; t: number; fim: number; area: AreaCartao; zonaAltura: number }> = ({ m, plano, t, fim, area, zonaAltura }) => {
  switch (m.tipo) {
    case "titulo":
      return <Titulo m={m} palavras={plano.palavras} t={t} fim={fim} area={area} />;
    case "abertura":
      return <CartaoAbertura m={m} palavras={plano.palavras} t={t} fim={fim} area={area} />;
    case "frase":
      return <CartaoFrase m={m} palavras={plano.palavras} t={t} fim={fim} area={area} />;
    case "pergunta":
      return <CartaoPergunta m={m} palavras={plano.palavras} t={t} fim={fim} area={area} />;
    case "destaque":
      return <CartaoDestaque m={m} palavras={plano.palavras} t={t} fim={fim} area={area} />;
    case "numero":
      return <CartaoNumero m={m} t={t} fim={fim} area={area} />;
    case "cta":
      return <Cta m={m} marca={plano.marca} palavras={plano.palavras} t={t} fim={fim} area={area} />;
    case "medida": {
      const h = Math.max(zonaAltura, 470);
      return <Medida m={m} t={t} fim={fim} area={{ x: area.x, y: Math.max(area.topoMin, Math.min(area.y, 1510 - h)), w: area.w, h }} />;
    }
  }
  return null;
};

// Blocos da prancha (listas, passos, comparação, gráfico, definição, planta, antes/depois)
const DesenhaPrancha: React.FC<{ m: Momento; plano: Plano; t: number; regiao: Regiao; layout: Layout }> = ({ m, plano, t, regiao, layout }) => {
  const props = { t, regiao, layout, palavras: plano.palavras };
  switch (m.tipo) {
    case "planta":
      return <PlantaMomento m={m} {...props} />;
    case "passos":
      return <Passos m={m} {...props} />;
    case "topicos":
      return <Notas m={m} {...props} />;
    case "comparacao":
      return <Comparacao m={m} {...props} />;
    case "grafico":
      return <Grafico m={m} {...props} />;
    case "definicao":
      return <Definicao m={m} {...props} />;
    case "antesDepois":
      return (
        <AntesDepois
          m={m}
          t={t}
          fim={1e9}
          regiao={regiao}
          layout={layout}
          larguraTitulo={JANELA_CHEIA.x - MARGEM - 40}
          alturaTitulo={JANELA_CHEIA.y + JANELA_CHEIA.h - MARGEM + 26}
        />
      );
  }
  return null;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const janelas = useMemo(() => janelasDosMomentos(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const caixa = caixaNoTempo(t, estados);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);

  // o quanto a pessoa saiu da tela cheia (liga o filete em volta do vídeo)
  const fora = limitar((1080 - caixa.w) / 40 + (videoAltura - caixa.h) / 40);

  const visiveis = janelas.filter((j) => t >= j.entra && t <= j.sai);
  const naPrancha = visiveis.filter((j) => j.prancha);
  const noCheio = visiveis.filter((j) => !j.prancha);

  // região da prancha: segue a borda da caixa da pessoa quando ela entra ou sai da tela cheia;
  // numa troca prancha → prancha, fica parada no lugar final (a régua faz a troca)
  const regiaoDe = (j: Janela): Regiao => {
    const final = caixaDoLayout(j.layout, plano);
    const parada = (t > j.m.ate && j.saida === "regua") || (t < j.m.de + 0.8 && j.entrada === "regua");
    return regiaoDoLayout(j.layout, parada ? final : caixa, final);
  };
  const regiaoAtual = naPrancha.length ? regiaoDe(naPrancha[naPrancha.length - 1]) : null;

  // cartões: começam na zona (abaixo do queixo) e sobem no máximo até logo abaixo do queixo;
  // a base desce um pouco quando a pessoa está muito perto da câmera (zona baixa)
  const queixo = plano.rosto.rastro?.largura ? plano.rosto.y * 1920 + 0.66 * 1080 * plano.rosto.rastro.largura : zona.topo - 170;
  const cartao: AreaCartao = {
    x: zona.esquerda,
    y: zona.topo,
    w: 1080 - zona.esquerda - zona.direita,
    topoMin: Math.max(zona.topo - 130, Math.min(zona.topo, queixo + 24)),
    base: Math.max(1400, Math.min(1500, zona.topo + 400)),
  };
  // a régua paralela de cada troca prancha → prancha em andamento
  const reguas = naPrancha.flatMap((j) => (j.entrada === "regua" ? [posicaoDaRegua(t, j.entra)] : [])).filter((y) => y > -40 && y < 1960);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.papel }}>
      <Papel />

      {/* prancha: desenhos por baixo da pessoa */}
      {naPrancha.map((j) => {
        const regiao = regiaoDe(j);
        // a folha que entra aparece acima da régua; a que sai, abaixo dela
        const cima = j.saida === "regua" && j.saiRegua !== undefined ? Math.max(0, posicaoDaRegua(t, j.saiRegua)) : 0;
        const baixo = j.entrada === "regua" ? Math.max(0, 1920 - posicaoDaRegua(t, j.entra)) : 0;
        if (cima >= 1920 || baixo >= 1920) return null;
        const opacidade = j.saida === "caixa" ? 1 - prog(t, j.sai - 0.16, 0.16) : j.entrada === "caixa" ? prog(t, j.entra, 0.12) : 1;
        return (
          <div
            key={`${j.m.tipo}-${j.m.de}`}
            style={{ position: "absolute", inset: 0, clipPath: cima || baixo ? `inset(${cima}px 0 ${baixo}px 0)` : undefined, opacity: opacidade }}
          >
            {ehDaPrancha(j.m) ? (
              <DesenhaPrancha m={j.m} plano={plano} t={t} regiao={regiao} layout={j.layout} />
            ) : (
              <DesenhaCartao
                m={j.m}
                plano={plano}
                t={t}
                fim={1e9}
                area={{ x: regiao.x, y: j.layout === "cheia" ? JANELA_CHEIA.y + JANELA_CHEIA.h + 34 : regiao.y, w: regiao.w, topoMin: j.layout === "cheia" ? JANELA_CHEIA.y + JANELA_CHEIA.h + 34 : regiao.y }}
                zonaAltura={zona.altura}
              />
            )}
          </div>
        );
      })}

      {/* a régua paralela que passa a folha */}
      {reguas.map((y, i) => (
        <Regua key={i} y={y} />
      ))}

      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.95)"
        estilo={{ boxShadow: fora > 0 ? `0 0 0 2px rgba(31,31,29,${fora})` : undefined }}
      />

      {/* tela cheia: cartões de papel na altura do peito */}
      {noCheio.map((j) => {
        const m = j.atraso ? { ...j.m, de: j.m.de + j.atraso } : j.m;
        if (ehDaPrancha(m)) {
          // bloco de prancha pedido em tela cheia: fica numa folha na altura do peito
          const h = Math.max(zona.altura, 470);
          const y = Math.max(cartao.topoMin, Math.min(cartao.y, 1510 - h));
          const regiao = { x: cartao.x + 30, y: y + 30, w: cartao.w - 60, h: h - 60 };
          return (
            <div key={`${m.tipo}-${m.de}`} style={{ opacity: prog(t, m.de, 0.2) * (1 - prog(t, j.sai - 0.25, 0.25)) }}>
              <div style={{ position: "absolute", left: cartao.x, top: y, width: cartao.w, height: h, background: cor.papel, boxShadow: `0 0 0 2px ${cor.grafite}` }} />
              <DesenhaPrancha m={m} plano={plano} t={t} regiao={regiao} layout="dividida" />
            </div>
          );
        }
        return <DesenhaCartao key={`${m.tipo}-${m.de}`} m={m} plano={plano} t={t} fim={j.sai} area={cartao} zonaAltura={zona.altura} />;
      })}

      <Legendas frases={frases} />

      {guias ? <Guias plano={plano} zona={zona} caixa={caixa} regiao={regiaoAtual} /> : null}

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
