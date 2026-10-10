import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Easing, Sequence, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, useTempo } from "./anim";
import { Abertura } from "./componentes/Abertura";
import { BComparacao, BDefinicao, BDestaque, BFrase, BGrafico, BItens, BNumero, BPergunta } from "./componentes/Blocos";
import { Cena, marcaDoCentro } from "./componentes/Cena";
import { Comparar } from "./componentes/Comparar";
import { Cta } from "./componentes/Cta";
import { Etiqueta, type IconeDaAcao, Nota } from "./componentes/Etiqueta";
import { Foco, brilhoDoFoco } from "./componentes/Foco";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { Cantos, Visor } from "./componentes/Visor";
import { disparos, fotoDoCta, piscar } from "./hud";
import {
  PAINEL_TOPO,
  type Ret,
  ehPainel,
  painelDoLugar,
  VIVO,
  estadoNoTempo,
  estadosDaPessoa,
  fimDaAcao,
  gradeDoMomento,
  lugarDoMomento,
  lugares,
  retNoTempo,
  segmentos,
} from "./layout";
import { VideoNaCaixa, caixaNoTempo, rostoNaTela } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Cena as TipoCena, Momento, Plano } from "./plano";
import { cor, fontesCarregadas } from "./tema";

// Só desenha depois que as fontes carregaram: os blocos medem o texto com a própria fonte.
let fontesProntas = false;
fontesCarregadas.then(() => {
  fontesProntas = true;
});
const useFontes = () => {
  const [prontas, setProntas] = useState(fontesProntas);
  const [espera] = useState(() => (fontesProntas ? null : delayRender("Carregando as fontes")));
  useEffect(() => {
    if (prontas) return;
    fontesCarregadas.then(() => {
      setProntas(true);
      if (espera !== null) continueRender(espera);
    });
  }, [prontas, espera]);
  return prontas;
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

const LEGENDA_Y = 1294;

// O último momento fica até o fim do vídeo quando é o fechamento ou termina colado no fim.
const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

const rotuloDe = (m: { numero?: number; rotulo?: string }) =>
  m.rotulo ? m.rotulo.toUpperCase() : m.numero !== undefined ? `AJUSTE ${String(m.numero).padStart(2, "0")}` : undefined;

type Som = { em: number; arquivo: string; volume: number };

// Som raro e tonal: o visor liga, a grade acende, o assunto encaixa na linha, o foco trava,
// o sol sobe, o obturador dispara, o botão do fechamento é apertado.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  for (const m of plano.momentos) {
    if (m.tipo === "abertura") lista.push({ em: Math.max(0, m.de), arquivo: "sfx/liga.wav", volume: 0.42 });
    if (m.tipo === "cena") {
      const g = gradeDoMomento(m);
      if (g !== undefined) lista.push({ em: g, arquivo: "sfx/grade.wav", volume: 0.34 });
      if (m.acao === "limpar") lista.push({ em: m.acaoEm, arquivo: "sfx/limpa.wav", volume: 0.3 });
      if (m.acao === "tercos") lista.push({ em: fimDaAcao(m) - 0.05, arquivo: "sfx/encaixe.wav", volume: 0.38 });
      if (m.acao === "luz") lista.push({ em: m.acaoEm, arquivo: "sfx/luz.wav", volume: 0.3 });
      if (m.acao === "foco" || m.acao === "horizonte") lista.push({ em: fimDaAcao(m) - 0.05, arquivo: "sfx/foco.wav", volume: 0.36 });
    }
    if (m.tipo === "foco") {
      lista.push({ em: m.travaEm, arquivo: "sfx/foco.wav", volume: 0.4 });
      if (m.luzEm !== undefined) lista.push({ em: m.luzEm, arquivo: "sfx/luz.wav", volume: 0.3 });
    }
    if (m.tipo === "topicos" || m.tipo === "passos") lista.push({ em: m.itens[0].em - 0.05, arquivo: "sfx/grade.wav", volume: 0.3 });
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/luz.wav", volume: 0.28 });
    if (m.tipo === "comparacao") lista.push({ em: m.vencedorEm ?? m.lados[1].em, arquivo: "sfx/encaixe.wav", volume: 0.34 });
    if (m.tipo === "grafico") lista.push({ em: (m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de + 0.4) - 0.05, arquivo: "sfx/grade.wav", volume: 0.3 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: "sfx/foco.wav", volume: m.nivel === "alerta" ? 0.4 : 0.34 });
    if (m.tipo === "definicao") lista.push({ em: m.em, arquivo: "sfx/foco.wav", volume: 0.34 });
    if (m.tipo === "comparar") lista.push({ em: m.disparoEm - 0.02, arquivo: "sfx/obturador.wav", volume: 0.5 });
    if (m.tipo === "cta") {
      lista.push({ em: m.botaoEm ?? m.de + 0.4, arquivo: "sfx/botao.wav", volume: 0.36 });
      const f = fotoDoCta(m);
      if (f !== null) lista.push({ em: f - 0.02, arquivo: "sfx/obturador.wav", volume: 0.42 });
    }
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.25) saida.push(s);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = (props) => {
  const prontas = useFontes();
  return prontas ? <EdicaoPronta {...props} /> : <AbsoluteFill style={{ backgroundColor: cor.corpo }} />;
};

const EdicaoPronta: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const L = useMemo(() => lugares(plano), [plano]);
  const segs = useMemo(() => segmentos(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const listaSons = useMemo(() => sons(plano), [plano]);
  const ordem = useMemo(() => [...plano.momentos].sort((a, b) => a.de - b.de), [plano]);
  const trocas = useMemo(() => segs.slice(1).map((s) => s.de), [segs]);

  const caixa = caixaNoTempo(t, estados);
  // onde o rosto está na tela agora (a caixa segue o rosto; a moldura e o foco vão junto)
  const rosto = rostoNaTela(caixa, plano.rosto, videoAltura, t);
  const vivo = (m: Momento, antes = 0.1, depois = 0.6) => t >= m.de - antes && t <= fimDoMomento(m, plano) + depois;

  // a cena ilustrada: entra por baixo quando um momento a usa e sai por baixo na tela cheia
  // a cena fica parada no lugar dela: a pessoa encolhe e a revela, ou cresce por cima e a cobre
  const alvosCena = useMemo(
    () =>
      segs.map((s, i) => {
        const proprio = L[s.lugar].cena;
        if (proprio) return proprio;
        for (let k = i - 1; k >= 0; k--) if (L[segs[k].lugar].cena) return L[segs[k].lugar].cena as Ret;
        for (let k = i + 1; k < segs.length; k++) if (L[segs[k].lugar].cena) return L[segs[k].lugar].cena as Ret;
        return VIVO;
      }),
    [segs, L],
  );
  const retCena = retNoTempo(t, segs, (s) => alvosCena[segs.indexOf(s)]);
  const retCantos = retNoTempo(t, segs, (s) => L[s.lugar].cantos);
  // com a pessoa em tela cheia, a cena está toda coberta: não precisa desenhar
  const cenaNaTela = !(caixa.w >= 1079 && caixa.h >= 1919 && caixa.x <= 0.5 && caixa.y <= 0.5);

  // momento de cena mais recente (os ajustes de antes continuam valendo)
  const cenas = ordem.filter((m): m is TipoCena => m.tipo === "cena");
  const cenaAtual = [...cenas].reverse().find((m) => t >= m.de - 0.1);
  const proximaCena = cenas.find((m) => m.de > t);
  const cenaDaVez = cenaAtual ?? proximaCena;
  const primeiraGrade = Math.min(...cenas.map((m) => gradeDoMomento(m) ?? Infinity));
  // blocos de tela de vidro (lista, passos, comparação, gráfico): ficam até a pessoa cobrir o lugar deles
  const fimDoPainel = (m: Momento) => {
    const i = ordem.indexOf(m);
    const proximo = ordem[i + 1];
    // colado em outro layout (outra tela de vidro, cena): corta na hora; senão a pessoa cresce por cima e a cobre
    return proximo && proximo.de - m.ate < 0.2 && lugarDoMomento(proximo, plano) !== "cheia" ? m.ate : fimDoMomento(m, plano) + 0.5;
  };
  const painelVivo = (m: Momento) => ehPainel(m) && t >= m.de - 0.05 && t <= fimDoPainel(m);
  const painelAgora = ordem.some(painelVivo);
  const comparando = ordem.some((m) => m.tipo === "comparar" && vivo(m, 0.6, 0.6));

  // brilho do vídeo (só no foco com régua de exposição)
  const brilho = ordem.reduce((b, m) => (m.tipo === "foco" && vivo(m, 0, 0.5) ? brilhoDoFoco(m, t) : b), 1);
  const piscada = piscar(plano, t);
  const pulso = Math.max(0, ...disparos(plano).map((d) => (t >= d && t < d + 0.4 ? 1 - Math.abs(t - d - 0.12) / 0.28 : 0)));
  const atual = [...ordem].reverse().find((m) => t >= m.de - 0.05 && t <= fimDoMomento(m, plano));
  // a legenda fica logo acima do seletor de modos; na comparação, na borda de baixo da foto ANTES
  const legendaY = atual?.tipo === "comparar" ? VIVO.y + VIVO.h / 2 - 84 : LEGENDA_Y;
  const comLegenda = !atual || atual.legenda;
  const baseEtiqueta = comLegenda ? LEGENDA_Y - 20 : VIVO.y + VIVO.h - 12;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.corpo }}>
      {/* 1. a cena ilustrada (a "foto" que melhora a cada ajuste) */}
      {cenaNaTela && cenaDaVez && !comparando && !painelAgora ? (
        <div style={{ position: "absolute", left: retCena.x, top: retCena.y, width: retCena.w, height: retCena.h, borderRadius: 28, overflow: "hidden" }}>
          <Cena
            w={retCena.w}
            h={retCena.h}
            e={estadoNoTempo(plano, t)}
            t={t}
            limpeza={
              cenaDaVez.acao === "limpar" && t >= cenaDaVez.acaoEm && t <= fimDaAcao(cenaDaVez)
                ? prog(t, cenaDaVez.acaoEm, fimDaAcao(cenaDaVez) - cenaDaVez.acaoEm, Easing.inOut(Easing.sin))
                : undefined
            }
            camadas={{
              grade: Number.isFinite(primeiraGrade) ? prog(t, primeiraGrade, 0.75, Easing.out(Easing.cubic)) : 0,
              lado: cenaDaVez.lado,
              sujeito: cenaDaVez.acao === "tercos" ? prog(t, cenaDaVez.acaoEm + 0.2, 0.35) * (1 - prog(t, cenaDaVez.ate - 0.3, 0.3)) : 0,
              ponto: cenaDaVez.acao === "tercos" ? prog(t, fimDaAcao(cenaDaVez) - 0.05, 0.35) : 0,
              marca: cenaDaVez.marcaEm !== undefined ? prog(t, cenaDaVez.marcaEm, 0.5) : 0,
              toque: cenaDaVez.acao === "foco" ? prog(t, cenaDaVez.acaoEm - 0.1, 0.6) : 0,
              nivel: cenaDaVez.acao === "horizonte" && t >= cenaDaVez.de - 0.05 ? prog(t, fimDaAcao(cenaDaVez) - 0.1, 0.2) : undefined,
              exposicao:
                cenaDaVez.acao === "luz" && t >= cenaDaVez.de - 0.05
                  ? prog(t, cenaDaVez.acaoEm, fimDaAcao(cenaDaVez) - cenaDaVez.acaoEm, Easing.inOut(Easing.quad))
                  : undefined,
              alvo:
                cenaDaVez.acao === "foco"
                  ? { procura: prog(t, cenaDaVez.acaoEm, Math.max(0.3, fimDaAcao(cenaDaVez) - cenaDaVez.acaoEm), Easing.linear), trava: prog(t, fimDaAcao(cenaDaVez), 0.2) }
                  : undefined,
            }}
          />
        </div>
      ) : null}

      {/* 1b. comparação (coluna da direita), embaixo da pessoa: quando ela volta à tela cheia, cobre a coluna */}
      {ordem.map((m) =>
        m.tipo === "comparar" && vivo(m, 0.6, 0.6) && cenaNaTela ? (
          <Comparar key={`cmp-${m.de}`} m={m} t={t} plano={plano} r={retCena} />
        ) : null,
      )}

      {/* 1c. blocos de tela de vidro: ficam atrás da pessoa, que encolhe e os revela (ou cresce e os cobre) */}
      {ordem.map((m) => {
        if (!painelVivo(m)) return null;
        const r = painelDoLugar(lugarDoMomento(m, plano));
        if (!r) return null;
        const comum = { t, fim: fimDoMomento(m, plano), palavras, titulo: r.titulo, corpo: r.corpo };
        const chave = `${m.tipo}-${m.de}`;
        if (m.tipo === "topicos" || m.tipo === "passos") return <BItens key={chave} m={m} {...comum} />;
        if (m.tipo === "comparacao") return <BComparacao key={chave} m={m} {...comum} />;
        if (m.tipo === "grafico") return <BGrafico key={chave} m={m} {...comum} />;
        return null;
      })}

      {/* 2. a pessoa: a única cópia com som, montada o vídeo inteiro */}
      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro={Math.abs(brilho - 1) > 0.002 ? `brightness(${brilho.toFixed(3)})` : undefined}
        estilo={{
          boxShadow: caixa.w < 1000 ? "0 12px 40px rgba(0,0,0,0.45)" : undefined,
          outline: caixa.w < 1000 ? `${limitar((1000 - caixa.w) / 300) * 3}px solid rgba(243,244,241,0.9)` : undefined,
          outlineOffset: -1,
        }}
      />

      {/* 4. piscar suave do obturador */}
      {piscada > 0 ? <AbsoluteFill style={{ background: "#FFFFFF", opacity: piscada }} /> : null}

      {/* 5. a interface da câmera */}
      <Cantos r={retCantos} t={t} pulso={pulso} />
      <Visor plano={plano} t={t} trocas={trocas} cheia={limitar((caixa.w - 560) / 480)} />

      {/* 6. o que cada momento escreve e desenha */}
      {ordem.map((m) => {
        if (!vivo(m)) return null;
        const fim = fimDoMomento(m, plano);
        const chave = `${m.tipo}-${m.de}`;
        const lugar = lugarDoMomento(m, plano);
        if (m.tipo === "abertura") {
          return (
            <Abertura
              key={chave}
              m={m}
              t={t}
              fim={fim}
              palavras={palavras}
              rosto={{ x: rosto.x, y: rosto.y + 0.012 * 1920 * rosto.escala, lado: 1080 * 0.4 * rosto.escala }}
              base={baseEtiqueta}
            />
          );
        }
        if (m.tipo === "cena") {
          // o rótulo acompanha o cartão da cena enquanto ele se move
          const r: Ret = t < m.ate && lugar !== "lado" ? retCena : (L[lugar].cena ?? VIVO);
          const noTopo = lugar === "topo";
          // "topo": painel fixo à esquerda da pessoa; "janela": no alto da cena, à esquerda da janelinha;
          // "lado": embaixo da coluna da cena
          const pos = noTopo
            ? { x: PAINEL_TOPO.x, y: PAINEL_TOPO.y, ancora: "topo" as const }
            : lugar === "janela"
              ? { x: r.x + 24, y: r.y + 24, ancora: "topo" as const }
              : { x: r.x + 24, y: r.y + r.h - 24, ancora: "base" as const };
          // a nota: no "topo" rola dentro do painel; com o centro riscado, fica ao lado do ✕ (longe do vapor
          // da xícara, que está na linha da esquerda); senão, embaixo à esquerda da cena
          const marca = marcaDoCentro(r.w, r.h);
          const notaNoRotulo = noTopo;
          const notaPos =
            m.acao === "tercos" && m.marcaEm !== undefined && m.nota && Math.abs(m.nota.em - m.marcaEm) < 0.6
              ? m.lado === "direita"
                ? { x: r.x + marca.x - marca.disco - 16, y: r.y + marca.y - 38, alinhar: "direita" as const }
                : { x: r.x + marca.x + marca.disco + 16, y: r.y + marca.y - 38, alinhar: "esquerda" as const }
              : { x: r.x + 24, y: r.y + r.h - 24 - 80, alinhar: "esquerda" as const };
          const icone: IconeDaAcao = ({ limpar: "camiseta", tercos: "grade", foco: "alvo", luz: "sol", horizonte: "nivel" } as const)[m.acao];
          return (
            <div key={chave}>
              <Etiqueta
                t={t}
                // entra quando a troca de lugar já quase terminou (não passa por cima da pessoa encolhendo)
                de={m.de + 0.38}
                // o painel do "topo" fica até a próxima disposição cobrir o lugar dele (sem buraco preto)
                ate={noTopo ? fim + 0.5 : fim}
                palavras={palavras}
                rotulo={rotuloDe(m)}
                rotuloEm={m.numeroEm}
                titulo={m.titulo}
                detalhe={m.detalhe}
                x={pos.x}
                y={pos.y}
                ancora={pos.ancora}
                larguraMax={lugar === "lado" ? 440 : lugar === "janela" ? L.janela.pessoa.x - pos.x - 24 : 900}
                troca={notaNoRotulo ? m.nota : undefined}
                painel={noTopo ? { w: PAINEL_TOPO.w, h: PAINEL_TOPO.h, icone, acaoEm: m.acaoEm, acaoAte: fimDaAcao(m) } : undefined}
              />
              {m.nota && !notaNoRotulo ? (
                <Nota t={t} em={m.nota.em} ate={fim} palavras={palavras} texto={m.nota.texto} icone={m.nota.icone} x={notaPos.x} y={notaPos.y} alinhar={notaPos.alinhar} />
              ) : null}
            </div>
          );
        }
        if (m.tipo === "foco") {
          return (
            <div key={chave}>
              <Foco m={m} t={t} fim={fim} rosto={rosto} />
              <Etiqueta
                t={t}
                de={m.de + 0.2}
                ate={fim}
                palavras={palavras}
                rotulo={rotuloDe(m)}
                rotuloEm={m.numeroEm}
                titulo={m.titulo}
                detalhe={m.detalhe}
                x={64}
                y={baseEtiqueta}
                ancora="base"
              />
            </div>
          );
        }
        if (m.tipo === "numero" || m.tipo === "destaque" || m.tipo === "definicao" || m.tipo === "frase" || m.tipo === "pergunta") {
          // vindo de uma tela de vidro, o rótulo espera a pessoa cobrir quase tudo
          const idx = ordem.indexOf(m);
          const anterior = ordem[idx - 1];
          const atraso = anterior && anterior.ate >= m.de - 0.2 && lugarDoMomento(anterior, plano) !== "cheia" ? 0.3 : 0;
          const props = { t, fim, palavras, base: baseEtiqueta, alturaMax: baseEtiqueta - 840, atraso };
          if (m.tipo === "numero") return <BNumero key={chave} m={m} {...props} />;
          if (m.tipo === "destaque") return <BDestaque key={chave} m={m} {...props} />;
          if (m.tipo === "definicao") return <BDefinicao key={chave} m={m} {...props} />;
          if (m.tipo === "frase") return <BFrase key={chave} m={m} {...props} />;
          return <BPergunta key={chave} m={m} {...props} />;
        }
        if (m.tipo === "cta") return <Cta key={chave} m={m} t={t} fim={fim} plano={plano} palavras={palavras} base={baseEtiqueta} />;
        return null;
      })}

      <Legendas frases={frases} y={legendaY} desde={atual?.tipo === "comparar" ? atual.de + 0.45 : -1} />

      {guias ? <Guias plano={plano} legendaY={legendaY} rosto={rosto} /> : null}

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



