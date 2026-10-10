import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { notaDaRaiz } from "./acordes";
import { pulso, temposDasPalavras, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { Acordes } from "./componentes/Acordes";
import { Batida } from "./componentes/Batida";
import { Destaque, Pergunta } from "./componentes/Cartoes";
import { Cena, type ModoDaCena } from "./componentes/Cena";
import { Cifra } from "./componentes/Cifra";
import { Comparacao } from "./componentes/Comparacao";
import { Compasso, modoAcordes } from "./componentes/Compasso";
import { Cta } from "./componentes/Cta";
import { Definicao, Topicos } from "./componentes/Folha";
import { Frase } from "./componentes/Frase";
import { Grafico } from "./componentes/Grafico";
import { Numero } from "./componentes/Numero";
import { Passos } from "./componentes/Passos";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { fimDaPassagem, origensDosCompassos, Passagem } from "./componentes/Passagem";
import {
  areaDe,
  batidasDoCompasso,
  DURACAO_CONTA,
  estadosDaPessoa,
  fimDe,
  janelaDe,
  janelasDo,
  janelaNoTempo,
  ladoDe,
  legendaYDe,
  naJanela,
  ordenar,
  pulsosDaJanela,
  TROCA,
  type Zona,
} from "./layout";
import { type Caixa, CHEIO_16x9, caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Acordes as TAcordes, Compasso as TCompasso, Momento, Plano } from "./plano";
import { indicesDoTrecho } from "./medida";
import { ALTURA_MINIMA_CARTAO, cor, H, W, zona as zonaPadrao } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Som musical, baixo e por baixo da voz (uns 8 dB abaixo): a nota de cada acorde quando ele se desenha (a raiz),
// um toque de madeira grave em cada batida do metrônomo (e em cada passo), uma palhetada abafada em cada seta
// da batida (descendo ou subindo), notas de uma escala subindo nos itens de uma lista, nas opções e nos dados,
// e um arpejo curto no botão do fechamento. Nada em cima de nada: dois sons ficam pelo menos 0,2 s afastados.
// Escala (pentatônica de Sol): G A B D E, subindo
const ESCALA = [7, 9, 11, 2, 4, 7];
const nota = (i: number) => `sfx/corda-${ESCALA[i % ESCALA.length]}.wav`;

const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    const fim = fimDe(m, plano);
    if (m.tipo === "abertura") {
      const inicio = m.em ?? m.de;
      const { tempos } = temposDasPalavras(m.texto ?? m.titulo ?? "", plano.palavras, inicio, fim, inicio);
      lista.push({ em: tempos[0] ?? m.de + 0.3, arquivo: "sfx/abertura.wav", volume: 0.2 });
    }
    if (m.tipo === "acordes") m.acordes.forEach((a) => lista.push({ em: a.em, arquivo: `sfx/corda-${notaDaRaiz(a.cifra)}.wav`, volume: 0.16 }));
    if (m.tipo === "compasso")
      batidasDoCompasso(m, fim).forEach((b, i, todas) =>
        lista.push({ em: b.em, arquivo: "sfx/tique.wav", volume: i === 0 || todas[i - 1].andamento !== b.andamento ? 0.34 : 0.24 }),
      );
    if (m.tipo === "batida") m.setas.forEach((s) => lista.push({ em: s.em, arquivo: `sfx/palhetada-${s.dir}.wav`, volume: 0.21 }));
    if (m.tipo === "topicos") m.itens.forEach((it, i) => lista.push({ em: it.em, arquivo: nota(i), volume: 0.13 }));
    if (m.tipo === "passos") m.itens.forEach((it) => lista.push({ em: it.em, arquivo: "sfx/tique.wav", volume: 0.3 }));
    if (m.tipo === "numero") lista.push({ em: m.em + DURACAO_CONTA, arquivo: "sfx/abertura.wav", volume: 0.17 });
    if (m.tipo === "comparacao") {
      m.lados.forEach((l, i) => lista.push({ em: l.em, arquivo: nota(i * 2), volume: 0.12 }));
      if (m.vencedor !== undefined || m.modo === "errado-certo")
        lista.push({ em: m.vencedorEm ?? m.lados[m.vencedor ?? 1].em + 0.45, arquivo: "sfx/palhetada-baixo.wav", volume: 0.18 });
    }
    if (m.tipo === "grafico") {
      if (m.dados?.length) m.dados.forEach((d, i) => lista.push({ em: d.em, arquivo: nota(i), volume: 0.12 }));
      else lista.push({ em: m.tendenciaEm ?? m.de + 0.3, arquivo: `sfx/palhetada-${m.tendencia === "cai" ? "baixo" : "cima"}.wav`, volume: 0.18 });
    }
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/tique.wav" : "sfx/palhetada-baixo.wav", volume: m.nivel === "alerta" ? 0.38 : 0.2 });
    if (m.tipo === "definicao") {
      lista.push({ em: m.em, arquivo: nota(0), volume: 0.12 });
      lista.push({ em: m.significadoEm, arquivo: nota(3), volume: 0.12 });
    }
    if (m.tipo === "pergunta") (m.opcoes ?? []).forEach((o, i) => lista.push({ em: o.em, arquivo: nota(i + 1), volume: 0.12 }));
    if (m.tipo === "frase" && m.risco) {
      const inicio = m.em ?? m.de;
      const { escritas, tempos } = temposDasPalavras(m.texto, plano.palavras, inicio, fim, inicio);
      const k = Math.min(...indicesDoTrecho(escritas, m.risco));
      const em = m.riscoEm ?? tempos[k];
      if (Number.isFinite(em)) lista.push({ em, arquivo: "sfx/palhetada-cima.wav", volume: 0.15 });
    }
    if (m.tipo === "cta") {
      const inicio = m.em ?? m.de;
      const { escritas, tempos } = temposDasPalavras(m.texto, plano.palavras, inicio, fim, inicio);
      const d = indicesDoTrecho(escritas, m.destaque);
      const em = m.botaoEm ?? (d.size ? tempos[Math.min(...d)] : (tempos[0] ?? m.de) + 0.4);
      lista.push({ em, arquivo: "sfx/fim.wav", volume: 0.19 });
    }
  }
  const saida: Som[] = [];
  for (const s of lista.filter((x) => Number.isFinite(x.em)).sort((a, b) => a.em - b.em))
    if (!saida.length || s.em - saida[saida.length - 1].em >= 0.2) saida.push(s);
  return saida;
};

// moldura da janela: traço de marfim e, a cada batida, um anel azul que acende e apaga
const Moldura: React.FC<{ caixa: Caixa; presenca: number; batida: number }> = ({ caixa, presenca, batida }) => {
  if (presenca <= 0.01) return null;
  const raio = caixa.raio ?? 0;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: caixa.x,
          top: caixa.y,
          width: caixa.w,
          height: caixa.h,
          borderRadius: raio,
          border: `3px solid rgba(243,235,221,${0.85 * presenca})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: caixa.x - 12,
          top: caixa.y - 12,
          width: caixa.w + 24,
          height: caixa.h + 24,
          borderRadius: raio + 12,
          border: `4px solid ${cor.azul}`,
          opacity: presenca * batida,
        }}
      />
    </>
  );
};

type Passe = { acordes: TAcordes; compasso: TCompasso };

// Um `compasso` colado num `acordes` com os mesmos acordes: os diagramas viajam de um para o outro
const passesDoPlano = (plano: Plano): Passe[] =>
  plano.momentos.flatMap((m, i) => {
    const proximo = plano.momentos[i + 1];
    if (m.tipo !== "acordes" || proximo?.tipo !== "compasso" || proximo.diagramas === false || !modoAcordes(proximo) || Math.abs(fimDe(m, plano) - proximo.de) > 0.15)
      return [];
    return origensDosCompassos(m, proximo).some((j) => j >= 0) ? [{ acordes: m, compasso: proximo }] : [];
  });

// Área da arte de um momento; com a legenda ligada, a arte termina acima da faixa da legenda. No
// quadro deitado a legenda fica sempre no terço de baixo: o cartão de quadro cheio também termina
// acima dela (e sobe um pouco, se ficaria baixo demais).
export const areaDoMomento = (m: Momento, zona: Zona) => {
  const j = janelaDe(m);
  const area = areaDe(j, zona);
  if (!m.legenda) return area;
  const limite = legendaYDe(j, zona) - 16;
  const y = j === "cheio" ? Math.min(area.y, limite - ALTURA_MINIMA_CARTAO) : area.y;
  return { ...area, y, h: Math.min(area.y + area.h, limite) - y };
};

// Tipos que trazem o próprio cartão de palco (quadro cheio). Os outros desenham direto no palco; se o
// plano puser um deles em quadro cheio (`"janela": "cheio"`), ele ganha uma placa escura por trás.
const COM_CARTAO = new Set<Momento["tipo"]>(["abertura", "frase", "cta", "destaque", "pergunta"]);

const Placa: React.FC<{ area: { w: number; h: number }; children: React.ReactNode }> = ({ area, children }) => (
  <div style={{ position: "absolute", left: -24, top: -24, width: area.w + 48, height: area.h + 48, borderRadius: 30, background: "rgba(20,17,15,0.94)" }}>
    <div style={{ position: "absolute", left: 24, top: 24, width: area.w, height: area.h }}>{children}</div>
  </div>
);

const renderMomento = (m: Momento, t: number, plano: Plano, fim: number, zona: Zona, passes: Passe[]) => {
  const j = janelaDe(m);
  const area = areaDoMomento(m, zona);
  const comum = { t, area, fim, palavras: plano.palavras };
  const conteudo = (() => {
    switch (m.tipo) {
      case "abertura":
        return <Abertura m={m} {...comum} />;
      case "acordes": {
        const passe = passes.find((p) => p.acordes === m);
        return <Acordes m={m} t={t} area={area} entregaEm={passe?.compasso.de} />;
      }
      case "compasso": {
        const passe = passes.find((p) => p.compasso === m);
        const recebe = passe ? { origens: origensDosCompassos(passe.acordes, m), ate: fimDaPassagem(m) } : undefined;
        return <Compasso m={m} t={t} plano={plano} fim={fim} area={area} lado={ladoDe(j)} recebe={recebe} />;
      }
      case "batida":
        return <Batida m={m} {...comum} />;
      case "cifra":
        return <Cifra m={m} {...comum} />;
      case "frase":
        return <Frase m={m} {...comum} />;
      case "cta":
        return <Cta m={m} {...comum} marca={plano.marca} />;
      case "topicos":
        return <Topicos m={m} {...comum} />;
      case "passos":
        return <Passos m={m} {...comum} lado={ladoDe(j)} />;
      case "numero":
        return <Numero m={m} {...comum} />;
      case "comparacao":
        return <Comparacao m={m} {...comum} />;
      case "grafico":
        return <Grafico m={m} {...comum} />;
      case "destaque":
        return <Destaque m={m} {...comum} />;
      case "definicao":
        return <Definicao m={m} {...comum} />;
      case "pergunta":
        return <Pergunta m={m} {...comum} />;
    }
  })();
  return j === "cheio" && !COM_CARTAO.has(m.tipo) ? <Placa area={area}>{conteudo}</Placa> : conteudo;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => ordenar(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  // o cartão de quadro cheio fica no peito: abaixo do queixo e centrado no rosto
  const zona: Zona = { ...zonaPadrao, ...plano.zona, centroX: plano.rosto.x * W };
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano), [plano]);
  const batidas = useMemo(() => pulsosDaJanela(plano), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);

  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  const presenca = naJanela(t, plano);
  const batida = pulso(t, batidas) * presenca;
  // a janela pulsa por inteiro (mesma escala na largura e na altura: nada se distorce)
  const escala = 1 + 0.02 * batida;
  const legendaY = legendaYDe(janelaNoTempo(t, plano), zona);
  const passes = useMemo(() => passesDoPlano(plano), [plano]);
  const janelas = useMemo(() => janelasDo(plano), [plano]);

  const cena = (m: Momento, i: number) => {
    const fim = fimDe(m, plano);
    if (t < m.de - 0.1 || t > fim + 0.8) return null;
    const anterior = janelaNoTempo(m.de - 0.05, plano);
    const atual = janelaDe(m);
    // para onde a pessoa vai quando este momento acaba
    const depois = janelaNoTempo(fim + 0.05, plano);
    // quem vem logo antes (colado) também está em quadro cheio? então o cartão novo espera o velho sair
    // inteiro (nada de dois textos um sobre o outro)
    const antes = plano.momentos[plano.momentos.indexOf(m) - 1];
    const coladoNoCheio = !!antes && janelaDe(antes) === "cheio" && Math.abs(fimDe(antes, plano) - m.de) < 0.15;
    const modo: ModoDaCena =
      atual === "cheio"
        ? // o cartão espera a pessoa crescer de volta (quando ela vinha de uma janela) e sai rápido
          { entra: "sobe", sai: "rapida", atraso: anterior !== "cheio" && m.de > 0 ? 0.3 : coladoNoCheio ? 0.12 : 0.05 }
        : // a arte em janela entra inteira; se a pessoa vai para o quadro cheio, fica até ser coberta
          { entra: "inteira", sai: depois === "cheio" && fim < plano.duracao ? "coberta" : "rapida", atraso: anterior !== "cheio" ? 0.1 : 0 };
    // saindo do quadro cheio para uma janela: a arte acompanha a borda da janela que se move. No quadro
    // deitado a moldura fica à direita e o quadro à esquerda: a arte entra presa à borda esquerda da
    // moldura, que anda da esquerda para a direita enquanto a pessoa encolhe
    if (atual !== "cheio" && anterior === "cheio" && t < m.de + TROCA + 0.02) {
      const agora = caixaNoTempo(t, estados, CHEIO_16x9);
      const alvo = janelas[atual];
      modo.desliza = { dx: Math.min(0, agora.x - alvo.x), dy: 0 };
    }
    return (
      <Cena key={`${m.tipo}-${m.de}-${i}`} t={t} de={m.de} fim={fim} area={areaDoMomento(m, zona)} modo={modo}>
        {renderMomento(m, t, plano, fim, zona, passes)}
      </Cena>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: cor.palco }}>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${cor.palco} 0%, ${cor.palcoClaro} 100%)` }} />

      {/* a arte dos momentos em janela fica ATRÁS da pessoa: a janela que se move revela ou cobre */}
      {plano.momentos.filter((m) => janelaDe(m) !== "cheio").map(cena)}
      {passes.map((p) => (
        <Passagem
          key={`passe-${p.compasso.de}`}
          t={t}
          acordes={p.acordes}
          compasso={p.compasso}
          areaAcordes={areaDoMomento(p.acordes, zona)}
          areaCompasso={areaDoMomento(p.compasso, zona)}
          comLado={!!ladoDe(janelaDe(p.compasso))}
        />
      ))}

      {/* a pessoa: uma caixa só, montada o vídeo inteiro (é ela que carrega a voz) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          scale: String(escala),
          transformOrigin: `${caixa.x + caixa.w / 2}px ${caixa.y + caixa.h / 2}px`,
        }}
      >
        <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.03) saturate(0.98)" />
        <Moldura caixa={caixa} presenca={presenca} batida={batida} />
      </div>

      {/* a arte dos momentos em quadro cheio fica na frente da pessoa, na altura do peito */}
      {plano.momentos.filter((m) => janelaDe(m) === "cheio").map(cena)}

      <Legendas frases={frases} t={t} y={legendaY} bloqueios={passes.map((p) => ({ de: p.compasso.de - 0.05, ate: fimDaPassagem(p.compasso) - 0.1 }))} />

      {guias ? <Guias plano={plano} zona={zona} legendaY={legendaY} /> : null}

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
