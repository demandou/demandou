import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import { mix, prog, useTempo, viagem } from "./anim";
import {
  ehCanvas,
  ehCelular,
  ehFrame,
  inicioVisual,
  estadosDaPessoa,
  janelaAtiva,
  janelasDoCanvas,
  type JanelaCanvas,
  type Linha,
  montarLinha,
  ordenar,
  paginaDoPlano,
  presencaCanvas,
  TROCA,
} from "./cena";
import { Balao } from "./componentes/Balao";
import { BDefinicao, BDestaque, BNumero, BPergunta, FrameDoCanvas, type MomentoFrame, nomeDoQuadro, PainelCamadas, camadasDoFrame } from "./componentes/Blocos";
import { Camada } from "./componentes/Camada";
import { BarraDoCanvas, FundoCanvas } from "./componentes/Canvas";
import { Celular } from "./componentes/Celular";
import { Cta, instanteDoIcone } from "./componentes/Cta";
import { Guias } from "./componentes/Guias";
import { Inspetor } from "./componentes/Inspetor";
import { Legendas } from "./componentes/Legendas";
import { caixaNoTempo, VideoNaCaixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { cor, fontesCarregadas, INSPETOR } from "./tema";
import { temposDoTexto } from "./tempos";

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

const ZONA_PADRAO = { topo: 1000, altura: 440 };

// Sons raros e tonais: o canvas que abre, cada erro (tons que descem), cada conserto (tons que
// sobem), o primeiro aviso de venda e a ação do fechamento.
const sons = (plano: Plano, linha: Linha, janelas: JanelaCanvas[]) => {
  const lista: { em: number; arquivo: string; volume: number }[] = [];
  for (const j of janelas) lista.push({ em: j.entra + 0.08, arquivo: "sfx/pino.wav", volume: 0.42 });
  // cada erro soa quando a etiqueta aparece (no botão escondido, quando a rolagem chega nele)
  linha.erros.forEach((e, i) =>
    lista.push({ em: e.em + (e.tipo === "botao" ? 0.72 : 0.02), arquivo: `sfx/erro-${(i % 3) + 1}.wav`, volume: 0.45 }),
  );
  plano.momentos
    .flatMap((m) => (m.tipo === "conserto" ? m.passos : []))
    .sort((a, b) => a.em - b.em)
    .forEach((p, i) => lista.push({ em: p.em + 0.04, arquivo: `sfx/ok-${Math.min(3, i + 1)}.wav`, volume: 0.38 }));
  for (const m of plano.momentos) {
    if (m.tipo === "topicos" || m.tipo === "passos") lista.push({ em: m.itens[0].em, arquivo: "sfx/aviso.wav", volume: 0.3 });
    if (m.tipo === "numero") lista.push({ em: m.em, arquivo: "sfx/ok-1.wav", volume: 0.34 });
    if (m.tipo === "comparacao") lista.push({ em: m.vencedorEm ?? m.lados[1].em, arquivo: "sfx/ok-3.wav", volume: 0.34 });
    if (m.tipo === "grafico") lista.push({ em: m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de + 0.4, arquivo: "sfx/aviso.wav", volume: 0.3 });
    if (m.tipo === "destaque") lista.push({ em: m.em, arquivo: m.nivel === "alerta" ? "sfx/erro-1.wav" : "sfx/ok-2.wav", volume: 0.36 });
    if (m.tipo === "definicao") lista.push({ em: m.em, arquivo: "sfx/ok-2.wav", volume: 0.34 });
  }
  if (linha.avisos.length) lista.push({ em: linha.avisos[0].em, arquivo: "sfx/aviso.wav", volume: 0.34 });
  for (const m of plano.momentos) {
    if (m.tipo !== "cta") continue;
    const tempos = temposDoTexto(m.texto, plano.palavras, m.de, m.ate + 0.5);
    lista.push({ em: instanteDoIcone(m, tempos, inicioVisual(m.de, janelas)), arquivo: "sfx/salvar.wav", volume: 0.36 });
  }
  return lista.filter((s) => s.em >= 0 && s.em < plano.duracao);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = (props) => {
  const prontas = useFontes();
  return prontas ? <EdicaoPronta {...props} /> : <AbsoluteFill style={{ backgroundColor: cor.canvas }} />;
};

const EdicaoPronta: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: original, guias }) => {
  const plano = useMemo(() => ordenar(original), [original]);
  const t = useTempo();
  const { fps, height } = useVideoConfig();
  const zona = { ...ZONA_PADRAO, ...plano.zona };
  const pagina = useMemo(() => paginaDoPlano(plano), [plano]);
  const janelas = useMemo(() => janelasDoCanvas(plano), [plano]);
  const estados = useMemo(() => estadosDaPessoa(plano, janelas), [plano, janelas]);
  const linha = useMemo(() => montarLinha(plano), [plano]);
  const videoAltura = Math.min(height, plano.videoAltura ?? height);

  // a fala no canvas vai para o balão do comentário; fora dele, legenda abaixo do queixo
  const noCanvas = (x: number) => janelas.some((j) => x >= j.entra - 0.05 && x < j.sai + TROCA * 0.5);
  const frasesBalao = useMemo(
    () =>
      montarFrases({ ...plano, momentos: plano.momentos.map((m) => (ehCanvas(m) ? { ...m, legenda: true } : m)) }).filter((f) =>
        janelas.some((j) => f.ate > j.entra + 0.3 && f.de < j.ate),
      ),
    [plano, janelas],
  );
  const frasesCheio = useMemo(() => montarFrases(plano).filter((f) => !noCanvas(f.de)), [plano, janelas]);

  const caixa = caixaNoTempo(t, estados);
  const presenca = presencaCanvas(t, janelas);
  const ativa = janelaAtiva(t, janelas);
  const legendaY = zona.topo + 24;

  // ---- frames do canvas (blocos universais no lugar do celular) ----
  const ordemCanvas = useMemo(() => plano.momentos.filter(ehCanvas).sort((a, b) => a.de - b.de), [plano]);
  const frames = ordemCanvas.filter(ehFrame) as MomentoFrame[];
  const janelaTemFone = (j: { de: number; ate: number }) => plano.momentos.some((m) => ehCelular(m) && m.de >= j.de - 0.01 && m.ate <= j.ate + 0.01);
  const foneNaJanela = ativa ? janelaTemFone(ativa) : false;
  // cada frame fica até o seguinte da mesma janela cobri-lo (varredura) ou até o canvas sumir
  const infoFrame = (m: MomentoFrame) => {
    const i = ordemCanvas.indexOf(m);
    const anterior = ordemCanvas[i - 1];
    const proximo = ordemCanvas[i + 1];
    const mesmaJanelaAntes = !!anterior && m.de - anterior.ate < 0.8;
    const mesmaJanelaDepois = !!proximo && proximo.de - m.ate < 0.8;
    const fim = !mesmaJanelaDepois ? (janelas.find((j) => m.ate <= j.ate + 0.01)?.sai ?? m.ate) + TROCA + 0.1 : ehFrame(proximo!) ? proximo!.de + 0.5 : m.ate + 0.45;
    // varredura: o frame novo entra cobrindo o antigo (de cima para baixo); o que sai para o celular se recolhe
    const entra = mesmaJanelaAntes ? prog(t, m.de - 0.05, 0.45, viagem) : 1;
    const sai = mesmaJanelaDepois && !ehFrame(proximo!) ? prog(t, m.ate - 0.05, 0.45, viagem) : 0;
    const clip = sai > 0 ? `inset(${sai * 100}% 0 0 0)` : entra < 1 ? `inset(0 0 ${(1 - entra) * 100}% 0)` : "none";
    return { vivo: t >= m.de - 0.05 && t < fim, clip };
  };
  const frameAtual = [...frames].reverse().find((m) => t >= m.de - 0.05 && infoFrame(m).vivo);
  const camadasVistas = frameAtual ? camadasDoFrame(frameAtual).filter((c) => t >= c.em - 0.04).length : 0;
  // um cartão de quadro cheio sai junto com a pessoa encolhendo para o canvas (some antes de ela
  // destampar o canvas); antes de outro cartão, cruza com ele
  const fimDoCartao = (m: Momento) => {
    const proximo = plano.momentos.find((o) => o.de >= m.ate - 0.01 && o !== m);
    const encostado = proximo && proximo.de - m.ate < 0.3;
    return encostado && ehCanvas(proximo) ? proximo.de + 0.05 : m.ate + 0.2;
  };
  const topoCartao = zona.topo + 20;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.canvas }}>
      <FundoCanvas />

      {ativa || presenca > 0 ? (
        <>
          <BarraDoCanvas
            t={t}
            linha={linha}
            pagina={pagina}
            presenca={presenca}
            quadro={frameAtual ? { nome: nomeDoQuadro(frameAtual), camadas: camadasVistas, total: camadasDoFrame(frameAtual).length } : undefined}
          />
          {foneNaJanela ? (
            <>
              <Celular t={t} linha={linha} pagina={pagina} presenca={presenca} />
              <Inspetor t={t} linha={linha} pagina={pagina} presenca={presenca} />
            </>
          ) : null}
          {frames.map((m) => {
            const info = infoFrame(m);
            if (!info.vivo) return null;
            const fim = m.ate;
            return (
              <div key={`frame-${m.de}`}>
                <FrameDoCanvas m={m} t={t} palavras={plano.palavras} fim={fim} pagina={pagina} presenca={presenca} clip={info.clip} />
                <PainelCamadas m={m} t={t} presenca={presenca} clip={info.clip} retangulo={INSPETOR} />
              </div>
            );
          })}
          <Balao t={t} frases={frasesBalao} marca={plano.marca} presenca={presenca} />
        </>
      ) : null}

      {/* a pessoa: quadro cheio ou o comentário fixado no canvas (canto de baixo em ponta) */}
      <VideoNaCaixa
        src={plano.video}
        caixa={caixa}
        rosto={plano.rosto}
        videoAltura={videoAltura}
        filtro="contrast(1.03) saturate(0.96)"
        estilo={{
          borderRadius: `${caixa.raio ?? 0}px ${caixa.raio ?? 0}px ${caixa.raio ?? 0}px ${mix(caixa.raio ?? 0, 6, presenca)}px`,
          boxShadow: presenca > 0 ? `0 0 0 ${7 * presenca}px ${cor.papel}, 0 30px 70px rgba(0,0,0,${0.5 * presenca})` : undefined,
        }}
      />

      {plano.momentos.map((m) => {
        if (m.tipo === "abertura" || m.tipo === "frase") {
          const texto = (m.tipo === "abertura" ? (m.texto ?? m.titulo) : m.texto) ?? "";
          const tempos = temposDoTexto(texto, plano.palavras, m.em ?? m.de, m.ate);
          return (
            <Camada
              key={`${m.tipo}-${m.de}`}
              t={t}
              de={inicioVisual(m.de, janelas)}
              saiAte={fimDoCartao(m)}
              topo={topoCartao + 30}
              texto={texto}
              tempos={tempos}
              destaque={m.destaque}
              nome={m.tipo === "abertura" ? "Título" : (m.rotulo ?? "Texto")}
              tamanho={m.tipo === "abertura" ? 86 : 66}
              risco={m.tipo === "frase" ? m.risco : undefined}
              riscoEm={m.tipo === "frase" ? m.riscoEm : undefined}
            />
          );
        }
        if (m.tipo === "numero" || m.tipo === "destaque" || m.tipo === "definicao" || m.tipo === "pergunta") {
          const props = { t, palavras: plano.palavras, entra: inicioVisual(m.de, janelas), saiAte: fimDoCartao(m), topo: topoCartao + 30, alturaMax: zona.altura - 120, pagina, fim: m.ate + 0.3 };
          if (m.tipo === "numero") return <BNumero key={`n-${m.de}`} m={m} {...props} />;
          if (m.tipo === "destaque") return <BDestaque key={`d-${m.de}`} m={m} {...props} />;
          if (m.tipo === "definicao") return <BDefinicao key={`f-${m.de}`} m={m} {...props} />;
          return <BPergunta key={`p-${m.de}`} m={m} {...props} />;
        }
        if (m.tipo === "cta") {
          const tempos = temposDoTexto(m.texto, plano.palavras, m.em ?? m.de, m.ate + 0.5);
          const temProximo = plano.momentos.some((o) => o.de > m.de);
          return (
            <Cta
              key={`cta-${m.de}`}
              t={t}
              m={m}
              entra={inicioVisual(m.de, janelas)}
              fim={temProximo ? m.ate : Infinity}
              topo={topoCartao}
              tempos={tempos}
              marca={plano.marca}
              pagina={pagina}
            />
          );
        }
        return null;
      })}

      <Legendas frases={frasesCheio} y={legendaY} presenca={presenca} />

      {guias ? <Guias plano={plano} zona={zona} legendaY={legendaY} canvas={presenca >= 0.5} /> : null}

      {plano.sfx === false
        ? null
        : sons(plano, linha, janelas).map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
