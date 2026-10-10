// O modelo Balcão: a fachada de uma loja de bairro. No alto, o toldo listrado com o letreiro; embaixo
// dele, a VITRINE, onde cada momento acontece (produtos na prateleira com adesivo de preço, combo
// carimbado, mapa com pino, balão de pedido…); depois o balcão de madeira e a pessoa numa moldura
// larga embaixo. Só cortes secos; a cor da pessoa nunca muda.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { AroDaMoldura, Balcao, FundoDaMoldura, MolduraJanela, Parede, Reflexo, Tarja, Toldo, VidroFundo } from "./componentes/Loja";
import { Mapa } from "./componentes/Mapa";
import { Plaquinha } from "./componentes/Pecas";
import { ComboSozinho, Vitrine } from "./componentes/Vitrine";
import { ordenar, prepararLayout } from "./layout";
import { VideoNaCaixa } from "./motor/caixa";
import { faixasSemLegenda, montarFrases } from "./motor/frases";
import type { Abertura as TAbertura, Combo as TCombo, Momento, Plano, Produto, Vitrine as TVitrine } from "./plano";
import { AREA, cor, JANELA, VIDRO } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: uma nota de madeira por produto posto (subindo), um "tic"
// no adesivo, duas notas na fita do combo, uma batida grave no carimbo, o pino que cai, dois toques
// de madeira na placa e o balão que abre. Nada de sino nem de ruído.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number | undefined, nome: string, volume: number) => {
    if (typeof em === "number") lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  };
  if (plano.fachada?.nome) s(plano.fachada.em ?? 0, "letreiro", 0.2);
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "vitrine":
        m.itens.forEach((it, i) => s(it.em, `poe-${(i % 4) + 1}`, 0.2));
        if (m.preco) s(m.preco.em, "cola", 0.2);
        m.itens.forEach((it) => (it.preco ? s(it.precoEm ?? it.em + 0.4, "cola", 0.18) : null));
        break;
      case "combo":
        s(m.em, "fita", 0.2);
        s(m.valorEm, "carimbo", 0.36);
        break;
      case "mapa":
        s(m.em, "poe-1", 0.16);
        s(m.numeroEm, "pino", 0.28);
        if (m.horario) s(Math.min(m.horario.em, m.horario.rotuloEm ?? m.horario.em), "placa", 0.24);
        break;
      case "abertura":
        if (m.placa) s(Math.min(m.placa.em, m.placa.rotuloEm ?? m.placa.em), "placa", 0.22);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => s(it.em, `poe-${(i % 4) + 1}`, 0.16));
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o, i) => s(o.em, `poe-${(i % 4) + 1}`, 0.16));
        break;
      case "comparacao":
        m.lados.forEach((l, i) => s(l.em, `poe-${i + 1}`, 0.18));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "cola", 0.2);
        break;
      case "grafico":
        (m.dados ?? []).forEach((d, i) => s(d.em, `poe-${(i % 4) + 1}`, 0.14));
        break;
      case "numero":
        s(m.em, "cola", 0.22);
        break;
      case "destaque":
        s(m.em, "carimbo", 0.3);
        break;
      case "definicao":
        s(m.em, "poe-1", 0.18);
        break;
      case "cta":
        s(m.em ?? m.de, "balao", 0.22);
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => i === 0 || x.em - l[i - 1].em > 0.1);
};

// Cenas encadeadas: uma `abertura` seguida de uma `vitrine` sem título vira o letreiro dela; um
// `combo` logo depois de uma `vitrine` amarra os produtos dela (a vitrine continua na tela).
const PERTO = 0.35;
const ligacoes = (plano: Plano) => {
  const ordem = ordenar(plano);
  const viraEm = new Map<TAbertura, number>();
  const semTitulo = new Set<TVitrine>();
  const comboDa = new Map<TVitrine, TCombo>();
  const combosLigados = new Set<TCombo>();
  ordem.forEach((m, i) => {
    const prox = ordem[i + 1];
    if (!prox || Math.abs(prox.de - m.ate) > PERTO) return;
    if (m.tipo === "abertura" && prox.tipo === "vitrine" && !prox.titulo) {
      viraEm.set(m, prox.de);
      semTitulo.add(prox);
    }
    if (m.tipo === "vitrine" && prox.tipo === "combo") {
      comboDa.set(m, prox);
      combosLigados.add(prox);
    }
  });
  return { ordem, viraEm, semTitulo, comboDa, combosLigados };
};

// O cartão de apresentação (na moldura da pessoa) fica nos primeiros ~3,6 s e sai antes de qualquer
// bloco que não seja a abertura.
const fimDaTarja = (plano: Plano) => {
  let fim = Math.min(3.6, plano.duracao);
  for (const m of ordenar(plano)) {
    if (m.de >= fim) break;
    if (m.tipo !== "abertura") fim = Math.min(fim, m.de - 0.1);
  }
  return Math.max(0.2, fim);
};

const RECORTE_VIDRO = `inset(${VIDRO.y}px ${1080 - VIDRO.x - VIDRO.w}px ${1920 - VIDRO.y - VIDRO.h}px ${VIDRO.x}px round ${JANELA.raio - 10}px)`;

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const bloqueios = useMemo(() => faixasSemLegenda(plano).map((f) => f.de), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const { ordem, viraEm, semTitulo, comboDa, combosLigados } = useMemo(() => ligacoes(plano), [plano]);
  const fimTarja = useMemo(() => fimDaTarja(plano), [plano]);
  const caixa = lay.caixa(t);

  // cada momento sai quando o próximo entra (o último fica até o fim do vídeo); numa cena
  // encadeada, quem começou fica até o fim da cena
  const fimSimples = (i: number) => {
    const m = ordem[i];
    const prox = ordem[i + 1];
    if (!prox) return m.ate >= plano.duracao - 0.4 || m.tipo === "cta" ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };
  const fimDe = (i: number): number => {
    const m = ordem[i];
    if (m.tipo === "abertura" && viraEm.has(m)) return fimDe(i + 1);
    if (m.tipo === "vitrine" && comboDa.has(m)) return fimDe(i + 1);
    return fimSimples(i);
  };
  // os produtos da última vitrine antes do fechamento (para o balão de pedido)
  const itensAntes = (de: number): Produto[] => {
    const v = [...ordem].reverse().find((x) => x.tipo === "vitrine" && x.de < de) as TVitrine | undefined;
    return v ? v.itens : [];
  };

  const desenhar = (m: Momento, i: number) => {
    const fim = fimDe(i);
    if (t < m.de - 0.1 || t > fim + 0.3) return null;
    const k = `${m.tipo}-${m.de}`;
    const p = { t, plano, fim };
    switch (m.tipo) {
      case "vitrine":
        return <Vitrine key={k} m={m} {...p} combo={comboDa.get(m) ?? null} semTitulo={semTitulo.has(m)} />;
      case "combo":
        return combosLigados.has(m) ? null : <ComboSozinho key={k} m={m} {...p} />;
      case "mapa":
        return <Mapa key={k} m={m} {...p} />;
      case "abertura":
        return <Abertura key={k} m={m} {...p} vira={viraEm.get(m)} />;
      case "topicos":
      case "passos":
        return <Lista key={k} m={m} {...p} />;
      case "numero":
        return <Numero key={k} m={m} {...p} />;
      case "comparacao":
        return <Comparacao key={k} m={m} {...p} />;
      case "grafico":
        return <Grafico key={k} m={m} {...p} />;
      case "destaque":
        return <Destaque key={k} m={m} {...p} />;
      case "definicao":
        return <Definicao key={k} m={m} {...p} />;
      case "frase":
        return <Frase key={k} m={m} {...p} />;
      case "pergunta":
        return <Pergunta key={k} m={m} {...p} />;
      case "cta":
        return <Cta key={k} m={m} {...p} itens={m.pedido ? itensAntes(m.de) : []} />;
      default:
        return null;
    }
  };

  // as plaquinhas penduradas no toldo (dia da abertura, horário do mapa)
  // (a placa fica 0,12 s a mais que o momento e sobe depressa: sai antes de o próximo bloco crescer)
  const placas = ordem.map((m, i) => {
    const fim = fimDe(i) + 0.12;
    if (m.tipo === "abertura" && m.placa) {
      const pl = m.placa;
      const ini = Math.min(pl.em, pl.rotuloEm ?? pl.em);
      return <Plaquinha key={`pa-${m.de}`} t={t} em={ini} ate={fim} x={AREA.x - 4} y={VIDRO.y + 16} w={360} rotulo={pl.rotulo} rotuloEm={pl.rotuloEm} texto={pl.texto} textoEm={pl.em} lado={1} />;
    }
    if (m.tipo === "mapa" && m.horario) {
      const pl = m.horario;
      const ini = Math.min(pl.em, pl.rotuloEm ?? pl.em);
      const w = 330;
      return <Plaquinha key={`pm-${m.de}`} t={t} em={ini} ate={fim} x={VIDRO.x + VIDRO.w - 36 - w} y={VIDRO.y + 16} w={w} rotulo={pl.rotulo} rotuloEm={pl.rotuloEm} texto={pl.texto} textoEm={pl.em} lado={-1} />;
    }
    return null;
  });

  return (
    <AbsoluteFill style={{ backgroundColor: cor.parede }}>
      <Parede />
      <VidroFundo />
      {/* o conteúdo dos momentos, recortado no vidro */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, clipPath: RECORTE_VIDRO }}>
        {ordem.map((m, i) => desenhar(m, i))}
      </div>
      <Reflexo t={t} />
      <MolduraJanela />
      {/* as placas ficam atrás do toldo: descem de trás dele e voltam para trás dele */}
      {placas}
      <Toldo t={t} plano={plano} />
      <Balcao />
      <FundoDaMoldura />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={plano.videoAltura ?? 1920} />
      <AroDaMoldura />
      <Tarja t={t} plano={plano} de={0.2} ate={fimTarja} />
      <Legenda t={t} frases={frases} bloqueios={bloqueios} y={lay.yLegenda} />
      {guias ? <Guias plano={plano} caixa={caixa} t={t} lay={lay} /> : null}
      {plano.sfx === false
        ? null
        : listaDeSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
