import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Easing, Sequence, staticFile, useVideoConfig } from "remotion";
import { prog, useTempo } from "./anim";
import { type DesenhoB, desenhoDoBloco, ehBloco } from "./blocos";
import { Bloco } from "./componentes/Bloco";
import { Cartaz } from "./componentes/Cartaz";
import { Escalada } from "./componentes/Escalada";
import { Guias } from "./componentes/Guias";
import { Legendas } from "./componentes/Legendas";
import { alturaDaPlaca, Placa } from "./componentes/Placa";
import { Selo } from "./componentes/Selo";
import {
  campos as calcularCampos,
  colado,
  type Desenho,
  desenhoDoMomento,
  ENTRADA,
  entraSeco,
  estadosDoVideo,
  fimDoMomento,
  MERGULHO,
  ordenar,
  placas as listarPlacas,
  QUADRO_INTEIRO,
  videoNoTempo,
} from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { corrigirPalavras, montarFrases } from "./motor/frases";
import type { Placa as PlacaT, Plano, Poster } from "./plano";
import { CAMPOS, cor, LIMITE_APP, QUADRO } from "./tema";

// No quadro deitado a legenda fica no terço de baixo, terminando antes dos controles do player
// (y 984), e a placa fica no peito, logo abaixo do queixo, centrada no rosto.
const LEGENDA_Y = 902;

type Som = { em: number; arquivo: string; volume: number };

// Sons: poucos e tonais. Um golpe grave quando a janela se abre, um toque (cada vez mais agudo)
// em cada risco, degrau, item de lista e passo, um toque quando a placa entra, o golpe grave no
// item de acento do selo e no destaque de alerta, e duas notas suaves na chamada final.
const sons = (plano: Plano, momentos: Poster[], desenhos: Desenho[], placas: PlacaT[]) => {
  const lista: Som[] = [];
  for (const [i, m] of momentos.entries()) {
    const d = desenhos[i];
    const janela = d.janela;
    if (janela) lista.push({ em: janela.em, arquivo: "sfx/janela.wav", volume: 0.62 });
    if (m.tipo === "cartaz") {
      (m.negacoes ?? []).forEach((n, k) => lista.push({ em: n.riscoEm, arquivo: `sfx/risco-${Math.min(k, 2) + 1}.wav`, volume: 0.42 }));
      if (m.fecho) lista.push({ em: m.de + 0.05, arquivo: "sfx/fecho.wav", volume: 0.34 });
    }
    if (m.tipo === "escalada") {
      m.degraus.forEach((dg, k) => lista.push({ em: dg.em, arquivo: `sfx/degrau-${Math.min(k, 2) + 1}.wav`, volume: 0.4 }));
    }
    if (ehBloco(d)) {
      (janela?.trocas ?? []).forEach((tr, k) => lista.push({ em: tr.em, arquivo: `sfx/degrau-${Math.min(k, 2) + 1}.wav`, volume: 0.38 }));
      const riscos = [...new Set(d.linhasB.filter((l) => l.risco !== undefined).map((l) => l.risco as number))];
      riscos.forEach((r, k) => lista.push({ em: r, arquivo: `sfx/risco-${Math.min(k, 2) + 1}.wav`, volume: 0.42 }));
      if (m.tipo === "cta") lista.push({ em: m.de + 0.05, arquivo: "sfx/fecho.wav", volume: 0.34 });
      if (m.tipo === "pergunta") (m.opcoes ?? []).forEach((o, k) => lista.push({ em: o.em, arquivo: `sfx/degrau-${Math.min(k, 2) + 1}.wav`, volume: 0.34 }));
      if (m.tipo === "grafico") (m.dados ?? []).forEach((g, k) => lista.push({ em: g.em, arquivo: `sfx/degrau-${Math.min(k, 2) + 1}.wav`, volume: 0.32 }));
    }
  }
  for (const s of placas) {
    if (s.tipo === "selo") {
      s.itens.forEach((it, k) => {
        if (it.acento) lista.push({ em: it.em, arquivo: "sfx/janela.wav", volume: 0.55 });
        else if (k === 0) lista.push({ em: it.em, arquivo: "sfx/degrau-2.wav", volume: 0.38 });
      });
    } else if (s.tipo === "numero") lista.push({ em: s.em, arquivo: "sfx/degrau-2.wav", volume: 0.38 });
    else if (s.tipo === "destaque")
      lista.push({ em: s.em, arquivo: s.nivel === "alerta" ? "sfx/janela.wav" : "sfx/degrau-2.wav", volume: s.nivel === "alerta" ? 0.5 : 0.38 });
  }
  // dois sons a menos de 0,25 s um do outro viram um só (fica o primeiro)
  const ordem = lista.filter((s) => s.em >= 0 && s.em < plano.duracao - 0.1).sort((a, b) => a.em - b.em);
  return ordem.filter((s, i) => i === 0 || s.em - ordem[i - 1].em >= 0.25);
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const t = useTempo();
  const { fps } = useVideoConfig();
  const videoAltura = Math.min(QUADRO.h, plano.videoAltura ?? QUADRO.h);
  const momentos = useMemo(() => ordenar(plano), [plano]);
  const placas = useMemo(() => listarPlacas(plano), [plano]);
  const listaDeCampos = useMemo(() => calcularCampos(momentos), [momentos]);
  // palavras já com as correções do plano: é nelas que cada palavra do pôster acha o seu tempo
  const palavras = useMemo(() => corrigirPalavras(plano.palavras, plano.correcoes), [plano]);
  const desenhos = useMemo(
    () =>
      momentos.map(
        (m): Desenho =>
          m.tipo === "cartaz" || m.tipo === "escalada"
            ? desenhoDoMomento(plano, m)
            : desenhoDoBloco(plano, m, palavras, Math.min(plano.duracao, fimDoMomento(m, momentos, plano.duracao))),
      ),
    [plano, momentos, palavras],
  );
  // a legenda some nos pôsteres e nas placas novas (o selo fica com legenda, como no demo)
  const frases = useMemo(
    () => montarFrases({ ...plano, momentos: [...momentos, ...placas.filter((p) => p.tipo !== "selo")] }),
    [plano, momentos, placas],
  );
  const estados = useMemo(
    () => estadosDoVideo(plano, momentos, desenhos, frases.map((f) => f.de), palavras),
    [plano, momentos, desenhos, frases, palavras],
  );

  // nas guias, a pessoa fica em quadro cheio e sem pôsteres: é só para conferir o enquadramento
  const video = guias ? { escala: 1, alvoX: plano.rosto.x * QUADRO.w, alvoY: plano.rosto.y * QUADRO.h, moldura: QUADRO_INTEIRO } : videoNoTempo(t, estados);
  // dentro de um bloco universal a câmera aproxima devagar dentro das letras (nada fica parado)
  const blocoAgora = guias ? -1 : momentos.findIndex((m, i) => ehBloco(desenhos[i]) && t >= m.de && t < fimDoMomento(m, momentos, plano.duracao));
  const empurra =
    blocoAgora >= 0
      ? 1 +
        0.035 *
          prog(
            t,
            momentos[blocoAgora].de + ENTRADA,
            Math.max(1, Math.min(8, momentos[blocoAgora].ate - momentos[blocoAgora].de)),
            Easing.linear,
          )
      : 1;
  // A MOLDURA (10/10): no pôster em que o rosto precisa ficar menor que a letra da janela, o vídeo
  // cobre só a caixa das letras (fileira.ts, videoNaJanela); fora dela, o campo do pôster. A escala
  // é a do vídeo (1 = na largura do quadro): o zoom da caixa é ela sobre a escala que cobre a caixa.
  const mold = video.moldura;
  const cobre = Math.max(mold.w / QUADRO.w, mold.h / videoAltura);
  const caixa = {
    x: mold.x,
    y: mold.y,
    w: mold.w,
    h: mold.h,
    raio: 0,
    zoom: Math.max(1, (video.escala * empurra) / Math.max(0.05, cobre)),
    ancoraX: (video.alvoX - mold.x) / Math.max(1, mold.w),
    ancoraY: (video.alvoY - mold.y) / Math.max(1, mold.h),
  };

  // legenda: no terço de baixo; o selo e a placa, no peito, logo abaixo do queixo (o cortar.mjs do
  // 16:9 põe a zona 60 px abaixo do queixo). Com a legenda na tela (selo, `legenda: true`), a placa
  // termina acima dela; sem legenda, pode descer até os controles do player.
  const legendaY = LEGENDA_Y;
  const queixo = (plano.zona?.topo ?? 700) - 60;
  const ALTURA_DO_SELO = 270;
  const seloY = Math.max(520, Math.min(legendaY - 16 - ALTURA_DO_SELO, queixo + 14));
  const placaY = (p: PlacaT) =>
    p.tipo === "selo"
      ? seloY
      : Math.max(520, Math.min((p.legenda ? legendaY - 16 : LIMITE_APP - 8) - alturaDaPlaca(p), queixo + 14));
  const centroX = plano.rosto.x * QUADRO.w;

  const ativos = guias
    ? []
    : momentos
        .map((m, i) => ({ m, i, fim: fimDoMomento(m, momentos, plano.duracao), seco: entraSeco(m, momentos, plano) }))
        .filter(({ m, i, fim }) => {
          if (t < m.de - 0.001) return false;
          // colado no próximo: fica até o próximo terminar de entrar
          const prox = momentos[i + 1];
          if (prox && colado(m, momentos)) return t < prox.de + (entraSeco(prox, momentos, plano) ? 0 : ENTRADA + 0.02);
          return t <= fim - 0.08 + MERGULHO;
        });

  // a legenda é do quadro cheio: some debaixo do pôster e volta quando o mergulho termina
  const cobrindo = ativos.some(({ m, fim }) => t >= m.de && t <= fim - 0.08);
  const mergulhando = ativos.find(({ m, fim }) => !colado(m, momentos) && t > fim - 0.08);
  const legendaVisivel = cobrindo ? 0 : mergulhando ? prog(t, mergulhando.fim - 0.12 + MERGULHO, 0.12) : 1;
  // fora da moldura do vídeo (na subida e no mergulho do pôster) aparece a cor do campo dele
  const fundo = ativos.length ? CAMPOS[listaDeCampos[ativos[0].i]].fundo : cor.preto;

  return (
    <AbsoluteFill style={{ backgroundColor: fundo }}>
      {/* a pessoa, sempre montada (a voz vem daqui): por baixo de tudo */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={videoAltura} filtro="contrast(1.05) saturate(0.95)" />

      {/* selos e placas: no quadro cheio, na altura do peito */}
      {guias
        ? null
        : placas.map((s) => {
            const fim = s.ate;
            const saiSeco = momentos.some((m) => Math.abs(m.de - fim) <= 0.12);
            return s.tipo === "selo" ? (
              <Selo key={`selo-${s.de}`} s={s} t={t} topo={seloY} fim={fim} saiSeco={saiSeco} centroX={centroX} />
            ) : (
              <Placa key={`placa-${s.de}`} m={s} t={t} topo={placaY(s)} fim={fim} saiSeco={saiSeco} palavras={palavras} centroX={centroX} />
            );
          })}

      {ativos.map(({ m, i, fim, seco }) => {
        const d = desenhos[i];
        // entrada: seca num corte (ou colada no pôster anterior); senão, o campo sólido sobe rápido
        // de baixo, com borda seca
        const sobe = seco ? 1 : prog(t, m.de, ENTRADA, Easing.out(Easing.cubic));
        const prox = momentos[i + 1];
        const proxSobe = prox && colado(m, momentos) && !entraSeco(prox, momentos, plano) ? prog(t, prox.de, ENTRADA, Easing.out(Easing.cubic)) : 0;
        // saída: mergulha na janela — o pôster cresce em volta do rosto enquanto um círculo de borda
        // seca abre a partir do rosto; termina na pessoa limpa, sem véu
        const mergulho = colado(m, momentos) ? 0 : prog(t, fim - 0.08, MERGULHO, Easing.in(Easing.quad));
        const raio = mergulho * (Math.hypot(Math.max(d.alvo.x, QUADRO.w - d.alvo.x), Math.max(d.alvo.y, QUADRO.h - d.alvo.y)) + 20);
        const furo = mergulho > 0 ? `radial-gradient(circle at ${d.alvo.x}px ${d.alvo.y}px, transparent ${raio}px, black ${raio + 1.5}px)` : undefined;
        // no mergulho, as letras pequenas somem primeiro: quem atravessa a tela é a palavra-janela
        const textos = 1 - (colado(m, momentos) ? 0 : prog(t, fim - 0.08, 0.12, Easing.linear));
        const props = { d, campo: listaDeCampos[i], t, palavras, fim, numero: i + 1, marca: plano.marca, fantasma: plano.fantasma, textos };
        return (
          <AbsoluteFill
            key={`${m.tipo}-${m.de}`}
            style={{
              clipPath: sobe < 1 || proxSobe > 0 ? `inset(${(1 - sobe) * 100}% 0 ${proxSobe * 100}% 0)` : undefined,
              scale: String(1 + 0.7 * mergulho),
              transformOrigin: `${d.alvo.x}px ${d.alvo.y}px`,
              WebkitMaskImage: furo,
              maskImage: furo,
            }}
          >
            {m.tipo === "cartaz" ? (
              <Cartaz m={m} {...props} />
            ) : m.tipo === "escalada" ? (
              <Escalada m={m} {...props} />
            ) : (
              <Bloco {...props} d={d as DesenhoB} de={m.de} />
            )}
          </AbsoluteFill>
        );
      })}

      {guias ? null : <Legendas frases={frases} y={legendaY} visivel={legendaVisivel} />}

      {guias ? <Guias plano={plano} legendaY={legendaY} seloY={seloY} /> : null}

      {plano.sfx === false
        ? null
        : sons(plano, momentos, desenhos, placas).map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.round(s.em * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
