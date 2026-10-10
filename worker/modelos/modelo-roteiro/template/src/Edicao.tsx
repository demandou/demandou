import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, useTempo, viaja } from "./anim";
import { Cabecalho } from "./componentes/Cabecalho";
import { type Ficha, GrupoDeCartoes, type Grupo, nomeDoTransporte } from "./componentes/Cartoes";
import { Bagagem, CartaoDestaque, Formulario, PlacaDefinicao, VersoPostal } from "./componentes/Cheios";
import { Cta } from "./componentes/Cta";
import { Embarque } from "./componentes/Embarque";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Mapa } from "./componentes/Mapa";
import { PessoaNoPostal } from "./componentes/Postal";
import { Relogio } from "./componentes/Relogio";
import { type Caixa, CHEIO } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Embarque as TipoEmbarque, Momento, Parada, Plano } from "./plano";
import { DIA_PADRAO, ehMapa, estadoNoTempo, fotoDoPostal, mapaDoPlano, montarRoteiro, type Roteiro, solNoTempo } from "./roteiro";
import { CARTOES, cor, LEGENDA_Y, zona as zonaPadrao } from "./tema";

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

// O último momento fica até o fim do vídeo quando termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// rótulo da barra do dia de uma parada: o período dela ou, sem ele, o último já dito antes dela
const periodoDaParada = (r: Roteiro, dia: string[], m: { de: number; periodo?: { indice: number } }) => {
  const antes = r.periodos.filter((p) => p.em <= m.de + 0.05);
  const indice = m.periodo?.indice ?? antes[antes.length - 1]?.indice;
  return indice === undefined ? undefined : dia[Math.max(0, Math.min(dia.length - 1, indice))];
};

// A abertura (nome universal) usa o cartão de embarque; `titulo` do embarque = `texto` da abertura.
const comoEmbarque = (m: Momento): TipoEmbarque | null => {
  if (m.tipo === "embarque") return m;
  if (m.tipo === "abertura") {
    return { tipo: "embarque", de: m.de, ate: m.ate, legenda: m.legenda, titulo: m.texto, destaque: m.destaque, em: m.em, rotulo: m.rotulo, subtitulo: m.subtitulo, codigo: m.codigo, duracao: m.duracao };
  }
  return null;
};

// Os cartões de baixo: um grupo por parada (bilhete + lugares), por lista, comparação, gráfico e dica.
const montarGrupos = (plano: Plano, r: Roteiro, dia: string[]): Grupo[] => {
  const grupos: Grupo[] = [];
  const blocoDe = (m: Momento) => r.blocos.find((b) => m.de >= b.de - 0.01 && m.de < b.ate + 0.01);
  for (const m of [...plano.momentos].sort((a, b) => a.de - b.de).filter(ehMapa)) {
    // no começo de um bloco, espera a pessoa encolher e o cartão de embarque sair
    const comecoDoBloco = r.blocos.some((b) => Math.abs(b.de - m.de) < 0.05);
    const universal = m.tipo !== "parada" && m.tipo !== "dica";
    const entra = (primeiroEm: number) => Math.min(primeiroEm - 0.27, m.de + (universal ? 0.28 : comecoDoBloco ? 0.5 : 0.3));
    // o título vai no cartão quando a barra do dia ocupa o alto; senão, na cartela do alto (Cabecalho)
    const tituloNoCartao = (titulo?: string) => (blocoDe(m)?.dia ? titulo : undefined);
    if (m.tipo === "parada") {
      const periodo = periodoDaParada(r, dia, m);
      const fichas: Ficha[] = [];
      if (m.trajeto?.transporte && m.trajeto.transporte !== "a-pe") {
        fichas.push({
          tipo: "bilhete",
          em: m.trajeto.em,
          transporte: m.trajeto.transporte,
          rotulo: m.trajeto.rotulo ?? nomeDoTransporte(m.trajeto.transporte),
          numero: m.trajeto.numero,
          numeroEm: m.trajeto.numeroEm,
          periodo,
        });
      }
      m.lugares.forEach((l) => {
        const pino = r.pinos.find((p) => p.origem === l);
        fichas.push({ tipo: "lugar", em: l.em, lugar: l, numero: pino?.numero ?? 1, periodo });
      });
      fichas.sort((a, b) => a.em - b.em);
      if (!fichas.length) continue;
      // o grupo entra no começo da parada, com as vagas a lápis; cada cartão ganha tinta quando é dito
      grupos.push({
        de: entra(fichas[0].em),
        ate: Infinity,
        fichas,
        carimboEm: m.carimboEm,
        carimboBase: m.carimboEm !== undefined ? periodo : undefined,
        carimboTexto: m.carimbo?.texto,
        carimboAlerta: m.carimbo?.alerta,
      });
    } else if (m.tipo === "topicos" || m.tipo === "passos") {
      grupos.push({
        de: entra(m.itens[0].em),
        ate: Infinity,
        alto: true,
        fichas: [{ tipo: "lista", em: m.itens[0].em, ordenada: m.tipo === "passos", titulo: tituloNoCartao(m.titulo), itens: m.itens }],
      });
    } else if (m.tipo === "comparacao") {
      grupos.push({
        de: entra(m.lados[0].em),
        ate: Infinity,
        alto: true,
        fichas: [{ tipo: "comparacao", em: m.lados[0].em, titulo: m.titulo, modo: m.modo, lados: m.lados, vencedor: m.vencedor, vencedorEm: m.vencedorEm }],
      });
    } else if (m.tipo === "grafico") {
      const primeiro = m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de + 0.6;
      grupos.push({
        de: entra(primeiro),
        ate: Infinity,
        alto: true,
        fichas: [{ tipo: "grafico", em: primeiro, titulo: tituloNoCartao(m.titulo), forma: m.forma, dados: m.dados, tendencia: m.tendencia, tendenciaEm: m.tendenciaEm, unidade: m.unidade, ilustrativo: m.ilustrativo }],
      });
    } else {
      const em = m.de + 0.3;
      grupos.push({
        de: em - 0.27,
        ate: Infinity,
        fichas: [{ tipo: "dica", em, de: m.de, ate: m.ate, rotulo: m.rotulo ?? "Dica", titulo: m.titulo, destaque: m.destaque, icones: m.icones ?? [] }],
      });
    }
  }
  grupos.forEach((g, i) => {
    const bloco = r.blocos.find((b) => g.de >= b.de - 0.2 && g.de <= b.ate + 0.2);
    const prox = grupos[i + 1];
    const proximoNoBloco = prox && bloco && prox.de <= bloco.ate;
    g.ate = Math.min(proximoNoBloco ? prox.de : Infinity, bloco?.ate ?? Infinity);
    g.fimDoBloco = !proximoNoBloco;
  });
  return grupos;
};

// Em tela cheia o zoom troca seco nos cortes (1 ↔ 1,06), para disfarçar o pulo.
const caixaCheia = (plano: Plano, r: Roteiro, t: number, videoAltura: number): Caixa => {
  const cortes = (plano.cortesEm ?? []).filter((c) => c <= t && !r.blocos.some((b) => c > b.de - 0.8 && c < b.ate + 0.8));
  return { ...CHEIO, h: videoAltura, zoom: cortes.length % 2 ? 1.06 : 1, ancoraY: (plano.rosto.y * 1920) / videoAltura };
};

const misturarCaixa = (a: Caixa, b: Caixa, f: number): Caixa => {
  const m = (x: number, y: number) => x + (y - x) * f;
  return {
    x: m(a.x, b.x),
    y: m(a.y, b.y),
    w: m(a.w, b.w),
    h: m(a.h, b.h),
    raio: m(a.raio ?? 0, b.raio ?? 0),
    zoom: m(a.zoom ?? 1, b.zoom ?? 1),
    ancoraY: m(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3),
  };
};

type Som = { em: number; arquivo: string; volume: number };

// Sons raros e tonais: um tom de abertura, uma nota por pino (subindo de parada em parada),
// um "tum" grave por carimbo, uma nota quando a dica entra e no marcador do fechamento.
const sons = (plano: Plano, r: Roteiro): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "embarque" || m.tipo === "abertura") lista.push({ em: Math.max(0, m.de) + 0.2, arquivo: "sfx/embarque.wav", volume: 0.42 });
    if (m.tipo === "numero") lista.push({ em: m.em - 0.02, arquivo: "sfx/marcador.wav", volume: 0.34 });
    if (m.tipo === "destaque") lista.push({ em: m.em - 0.02, arquivo: "sfx/carimbo.wav", volume: 0.46 });
    if (m.tipo === "definicao") lista.push({ em: m.significadoEm - 0.05, arquivo: "sfx/dica.wav", volume: 0.3 });
    if (m.tipo === "pergunta" && m.opcoes?.length) lista.push({ em: m.opcoes[0].em - 0.05, arquivo: "sfx/marcador.wav", volume: 0.3 });
    if (m.tipo === "comparacao" && m.vencedorEm !== undefined) lista.push({ em: m.vencedorEm - 0.02, arquivo: "sfx/carimbo.wav", volume: 0.46 });
    if (m.tipo === "grafico") lista.push({ em: m.de + 0.3, arquivo: "sfx/dica.wav", volume: 0.3 });
    if (m.tipo === "parada" && m.carimboEm !== undefined) lista.push({ em: m.carimboEm - 0.02, arquivo: "sfx/carimbo.wav", volume: 0.5 });
    if (m.tipo === "dica") lista.push({ em: m.de + 0.3, arquivo: "sfx/dica.wav", volume: 0.34 });
    if (m.tipo === "cta") {
      if (m.acaoEm !== undefined) lista.push({ em: m.acaoEm, arquivo: "sfx/marcador.wav", volume: 0.4 });
      if (m.proximoEm !== undefined) lista.push({ em: m.proximoEm - 0.05, arquivo: "sfx/carimbo.wav", volume: 0.42 });
    }
  }
  r.pinos.forEach((p, i) => lista.push({ em: p.lugar.em - 0.08, arquivo: `sfx/pino-${(i % 4) + 1}.wav`, volume: 0.36 }));
  // nunca dois sons colados
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

// Quando termina de sair o cartão de tela cheia deste momento: se outro cartão de tela cheia entra logo
// depois, o que sai some inteiro até o `ate` (nunca dois papéis um sobre o outro).
const ROTULO_DO_TIPO: Record<string, string> = {
  topicos: "Lista",
  passos: "Passos",
  comparacao: "Contraste",
  grafico: "Gráfico",
  numero: "Número",
  definicao: "Termo",
  destaque: "Alerta",
  frase: "Frase",
  pergunta: "Pergunta",
};

// Os carimbos da página de passaporte: os das paradas visitadas; sem paradas, um por tipo de bloco visto.
const carimbosDoFechamento = (plano: Plano, r: Roteiro, dia: string[]): string[] => {
  const dasParadas = r.paradas
    .filter((p) => p.m.tipo === "parada" && p.m.carimboEm !== undefined)
    .map((p) => {
      const m = p.m as Parada;
      return periodoDaParada(r, dia, m) ?? m.carimbo?.texto ?? "";
    });
  if (dasParadas.length >= 3 && dasParadas.every(Boolean)) return dasParadas;
  // sem hora do dia nas paradas: um carimbo por tipo de bloco visto
  const vistos: string[] = dasParadas.filter(Boolean);
  for (const m of [...plano.momentos].sort((a, b) => a.de - b.de)) {
    const rotulo = ROTULO_DO_TIPO[m.tipo];
    if (rotulo && !vistos.includes(rotulo)) vistos.push(rotulo);
  }
  return vistos.slice(0, 4);
};

const fimDaSaida = (m: Momento, plano: Plano) => {
  const proximo = plano.momentos.some((o) => o !== m && !ehMapa(o) && o.de >= m.ate - 0.05 && o.de <= m.ate + 0.35);
  return proximo ? m.ate : m.ate + (m.tipo === "embarque" || m.tipo === "abertura" ? 0.32 : 0.2);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const zona = { ...zonaPadrao, ...plano.zona };
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const dia = plano.dia?.length ? plano.dia : DIA_PADRAO;
  const escalaCheia = zona.altura >= 440 ? 1 : Math.max(0.6, zona.altura / 470);
  const r = useMemo(() => montarRoteiro(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const grupos = useMemo(() => montarGrupos(plano, r, dia), [plano, r, dia]);
  const listaSons = useMemo(() => sons(plano, r), [plano, r]);

  // bloco de mapa em que estamos (inclui a volta para a tela cheia)
  const bloco = r.blocos.find((b) => t >= b.de - 0.05 && t < b.ate + 0.9);
  const f = bloco ? prog(t, bloco.de, 0.75, viaja) * (1 - prog(t, bloco.ate, 0.75, viaja)) : 0;
  const estado = estadoNoTempo(r, t);
  const caixa = misturarCaixa(caixaCheia(plano, r, t, videoAltura), fotoDoPostal(estado.postal, plano.postal), f);
  const sol = solNoTempo(r, t);
  const calor = Math.min(1, (dia.length > 1 ? sol.posicao / (dia.length - 1) : 0) * 0.75 + sol.poente * 0.5);
  // a barra do dia desce quando a pessoa já encolheu (não passa por cima do rosto)
  const presencaMapa = bloco ? prog(t, bloco.de + 0.38, 0.45) * (1 - prog(t, bloco.ate - 0.05, 0.45)) : 0;

  const embarques = plano.momentos.filter((m) => (m.tipo === "embarque" || m.tipo === "abertura") && t >= m.de - 0.35 && t <= fimDaSaida(m, plano) + 0.1);
  const cheios = plano.momentos.filter((m) => ["numero", "destaque", "definicao", "frase", "pergunta"].includes(m.tipo) && t >= m.de - 0.35 && t <= fimDaSaida(m, plano) + 0.1);
  const ctas = plano.momentos.filter((m) => m.tipo === "cta" && t >= m.de - 0.1 && t <= fimDoMomento(m, plano));
  const carimbos = carimbosDoFechamento(plano, r, dia);
  const titulos = plano.momentos.filter((m) => (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico") && !!m.titulo && !r.blocos.find((b) => m.de >= b.de - 0.01 && m.de < b.ate + 0.01)?.dia);

  return (
    <AbsoluteFill style={{ backgroundColor: cor.areia }}>
      {bloco ? (
        <Mapa
          mapa={mapaDoPlano(plano)}
          roteiro={r}
          vista={estado.vista}
          t={t}
          calor={calor}
          bloco={bloco}
          postal={{ x: estado.postal.x, y: estado.postal.y, w: estado.postal.w, h: estado.postal.h }}
        />
      ) : null}

      <PessoaNoPostal
        video={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        f={f}
        giro={estado.postal.giro}
        borda={estado.postal.borda}
        rodape={estado.postal.rodape}
        marca={plano.marca}
      />

      {bloco?.dia && presencaMapa > 0 ? <Relogio rotulos={dia} posicao={sol.posicao} etiqueta={sol.etiqueta} poente={sol.poente} aceso={sol.aceso} presenca={presencaMapa} /> : null}

      {grupos.map((g, i) => (
        <GrupoDeCartoes key={`grupo-${i}`} g={g} t={t} palavras={plano.palavras} saidaFinal={g.ate} />
      ))}

      {titulos.map((m) => (m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico") && m.titulo ? <Cabecalho key={`titulo-${m.de}`} texto={m.titulo} t={t} de={m.de} ate={m.ate} /> : null)}

      {/* papéis de tela cheia: encolhem juntos quando a zona abaixo do queixo é baixa */}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `540px ${zona.topo + 4}px`, scale: String(escalaCheia) }}>
      {embarques.map((m) => {
        const e = comoEmbarque(m);
        return e ? <Embarque key={`embarque-${m.de}`} m={e} palavras={plano.palavras} marca={plano.marca} t={t} topo={zona.topo + 4} saidaFim={fimDaSaida(m, plano)} /> : null;
      })}
      {cheios.map((m) => {
        // depois de um bloco de mapa, o papel espera os cartões de baixo saírem (nunca dois papéis juntos)
        const pronto = r.blocos.some((b) => m.de - b.ate >= -0.05 && m.de - b.ate <= 0.6) ? m.de + 0.45 : m.de;
        const comum = { palavras: plano.palavras, t, topo: zona.topo + 4, marca: plano.marca, saidaFim: fimDaSaida(m, plano), pronto };
        if (m.tipo === "numero") return <Bagagem key={`numero-${m.de}`} m={m} {...comum} />;
        if (m.tipo === "destaque") return <CartaoDestaque key={`destaque-${m.de}`} m={m} {...comum} />;
        if (m.tipo === "definicao") return <PlacaDefinicao key={`definicao-${m.de}`} m={m} {...comum} />;
        if (m.tipo === "frase") return <VersoPostal key={`frase-${m.de}`} m={m} {...comum} />;
        if (m.tipo === "pergunta") return <Formulario key={`pergunta-${m.de}`} m={m} {...comum} />;
        return null;
      })}
      {ctas.map((m) => {
        if (m.tipo !== "cta") return null;
        const volta = r.blocos.find((b) => Math.abs(b.ate - m.de) < 0.5);
        return (
          <Cta key={`cta-${m.de}`} m={m} palavras={plano.palavras} marca={plano.marca} carimbos={carimbos} t={t} topo={zona.topo + 4} pronto={volta ? volta.ate + 0.45 : m.de} />
        );
      })}
      </div>

      <Legendas frases={frases} y={bloco ? CARTOES.topo - 96 : LEGENDA_Y} />

      {guias ? <Guias plano={plano} zona={zona} caixa={caixa} noMapa={f > 0.5} legendaY={bloco ? CARTOES.topo - 96 : LEGENDA_Y} /> : null}

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
