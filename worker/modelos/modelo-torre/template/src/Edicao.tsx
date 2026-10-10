// O modelo Torre: lançamento imobiliário à noite em 3D. A pessoa sempre numa moldura com o fundo natural;
// no começo a moldura é grande (título por cima da cabeça) e a linha de luz faz a virada; depois a
// moldura desce e o mundo 3D ocupa a metade de cima: a torre sobe andar por andar, o mapa traça a rota,
// a planta humanizada acende os cômodos ditos e a etiqueta de preço bate na palavra.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, prog } from "./anim";
import { Cabecalho, CamadaPlanta, ColunaRota, ColunaTorre, Etiqueta, PrecoEscuro, RotulosDoMapa, Selo } from "./componentes/Assinatura";
import { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Pergunta, Topicos } from "./componentes/Blocos";
import { Guias } from "./componentes/Guias";
import { Legenda, yDaLegenda } from "./componentes/Legenda";
import { caixaDaPessoa, LinhaDeLuz, Moldura, viradaP } from "./componentes/Moldura";
import { Tarja } from "./componentes/Tarja";
import { montarFrases } from "./motor/frases";
import { Palco } from "./mundo/Palco";
import type { Momento, Plano } from "./plano";
import { ambienteK, divideK, mergulhoK, montarRoteiro, ordenar, type Roteiro } from "./roteiro";
import { K } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz (os mesmos do Reel aprovado): cristal na virada, a obra que sobe,
// o pino que soa, o mergulho, as paredes, a seleção dos cômodos, a etiqueta que assenta e o "hall" do preço.
const sons = (plano: Plano, R: Roteiro): Som[] => {
  const l: Som[] = [];
  const s = (em: number | undefined, nome: string, volume: number) => {
    if (typeof em === "number" && em >= 0) l.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  };
  if (plano.virada) s(plano.virada.em - 0.25, "swap_crystal", 0.35);
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "torre":
        s(m.em - 0.15, "build_clearance", 0.22);
        if (m.andarDestaque) s(m.andarDestaque.em, "rooms_select", 0.18);
        break;
      case "rota": {
        const r = R.rotas.find((x) => x.m === m);
        s(r ? r.pino + 0.3 : m.em + 0.75, "pin_ring", 0.3);
        break;
      }
      case "passos":
        s(m.de + 0.65, "pin_ring", 0.26);
        m.itens.slice(1).forEach((it) => s(it.em - 0.03, "rooms_select", 0.14));
        break;
      case "planta": {
        const P = R.plantas.find((x) => x.m === m);
        s(Math.max(0, Math.min(m.de, m.em - 0.25) - 0.2), "dive_highpass", 0.32);
        if (P) s(P.a1 - 0.1, "walls_tiles", 0.26);
        if (P && P.acesos.length) s(P.acesos[0].em - 0.03, "rooms_select", 0.18);
        break;
      }
      case "preco": {
        s(m.em - 0.05, "tag_set", 0.24);
        const ult = m.partes?.length ? m.partes[m.partes.length - 1].em : m.em + 1.1;
        s(ult + 0.08, "price_hall", 0.28);
        break;
      }
      case "topicos":
        m.itens.forEach((it) => s(it.em - 0.03, "rooms_select", 0.14));
        break;
      case "numero":
        s(m.em - 0.05, "tag_set", 0.2);
        break;
      case "comparacao":
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "pin_ring", 0.22);
        break;
      case "grafico":
        s((m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de) - 0.1, "build_clearance", 0.18);
        break;
      case "destaque":
        s(m.em - 0.05, "price_hall", 0.2);
        break;
      case "definicao":
        s(m.em - 0.03, "rooms_select", 0.16);
        break;
      case "pergunta":
        (m.opcoes ?? []).forEach((o) => s(o.em - 0.03, "rooms_select", 0.14));
        break;
      case "cta":
        s((m.em ?? m.de) - 0.05, "tag_set", 0.24);
        break;
    }
  }
  return l.sort((a, b) => a.em - b.em).filter((x, i, a) => i === 0 || x.em - a[i - 1].em > 0.12);
};

/** sombreia o topo (títulos legíveis sobre a cidade) e a base em volta da moldura */
const Sombras: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const g = divideK(R, t);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - 0.45 * g, background: "linear-gradient(180deg, rgba(5,9,18,0.62) 0px, rgba(5,9,18,0.25) 420px, rgba(5,9,18,0) 620px)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,9,18,0) 900px, rgba(5,9,18,0.5) 1400px, rgba(5,9,18,0.85) 1920px)" }} />
    </>
  );
};

/** sombra suave atrás da coluna da esquerda (legibilidade sobre a cidade e o mapa) */
const SombraDaColuna: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  let a = 0;
  const T = R.torre;
  if (T.m) {
    const tiro = R.tiros.find((x) => x.m === T.m);
    a = Math.max(a, prog(t, T.m.em - 0.2, T.m.em + 0.3) * (1 - prog(t, (tiro?.ate ?? T.m.ate) - 0.1, (tiro?.ate ?? T.m.ate) + 0.3)));
  }
  for (const r of R.rotas) a = Math.max(a, prog(t, r.tiro.de, r.tiro.de + 0.4) * (1 - prog(t, r.tiro.ate - 0.1, r.tiro.ate + 0.3)));
  for (const p of R.plantas) a = Math.max(a, prog(t, p.m.em - 0.2, p.m.em + 0.3) * (1 - prog(t, p.push[0], p.push[0] + 0.4)));
  if (a <= 0) return null;
  return <div style={{ position: "absolute", left: -200, top: 160, width: 1000, height: 620, opacity: a, background: "radial-gradient(ellipse 50% 50% at 40% 50%, rgba(6,10,20,0.62), rgba(6,10,20,0) 100%)" }} />;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const R = useMemo(() => montarRoteiro(plano), [plano]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano, R), [plano, R]);
  const ordem = useMemo(() => ordenar(plano), [plano]);

  // cada momento sai quando o próximo entra (o último fica até o fim)
  const fimDe = (i: number) => {
    const m = ordem[i];
    const prox = ordem[i + 1];
    if (!prox) return m.ate >= plano.duracao - 0.4 || m.tipo === "cta" || m.tipo === "preco" ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };

  const desenhar = (m: Momento, i: number) => {
    const fim = fimDe(i);
    if (t < m.de - 0.2 || t > fim + 0.4) return null;
    const p = { t, plano, R, fim };
    const k = `${m.tipo}-${m.de}`;
    switch (m.tipo) {
      case "preco":
        return (
          <div key={k}>
            <PrecoEscuro t={t} m={m} fim={fim} />
            <Etiqueta t={t} m={m} fim={fim} />
          </div>
        );
      case "abertura":
        return <Abertura key={k} m={m} {...p} />;
      case "topicos":
        return <Topicos key={k} m={m} {...p} />;
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
        return <Cta key={k} m={m} {...p} />;
      default:
        // torre, rota, passos e planta são desenhados pelo palco e pelas camadas da assinatura
        return null;
    }
  };

  // blocos universais: o mundo vira fundo (desfoca e escurece)
  const amb = ambienteK(R, t);
  const mergulho = mergulhoK(R, t);
  // virada sem vídeo trocado: a cidade fica apagada até a linha passar
  const v = plano.virada;
  const pv = viradaP(plano, t);
  const apagado = R.acende !== null && pv !== null && pv < 1;
  const yApagado = pv === null ? 0 : lerp(-4, 1924, pv);
  const caixa = caixaDaPessoa(plano, R, t);

  return (
    <AbsoluteFill style={{ backgroundColor: K.noite }}>
      <div style={{ position: "absolute", inset: 0, filter: amb > 0.01 ? `blur(${6 * amb}px) brightness(${1 - 0.38 * amb})` : undefined }}>
        <Palco t={t} R={R} />
      </div>
      {apagado ? <div style={{ position: "absolute", inset: 0, background: "rgba(5,8,15,0.86)", clipPath: t >= (v?.em ?? 0) ? `inset(${yApagado}px 0 0 0)` : undefined }} /> : null}
      {mergulho > 0 ? <div style={{ position: "absolute", inset: 0, background: K.noite, opacity: mergulho }} /> : null}
      <Sombras t={t} R={R} />
      <SombraDaColuna t={t} R={R} />
      <Moldura plano={plano} R={R} t={t} />
      {apagado && pv !== null && t >= (v?.em ?? 0) ? <LinhaDeLuz y={yApagado} p={pv} /> : null}
      {/* camadas da assinatura */}
      <Cabecalho t={t} R={R} />
      <Selo t={t} R={R} />
      <ColunaTorre t={t} R={R} />
      <RotulosDoMapa t={t} R={R} />
      <ColunaRota t={t} R={R} />
      <CamadaPlanta t={t} R={R} />
      {ordem.map((m, i) => desenhar(m, i))}
      <Tarja t={t} plano={plano} caixa={caixa} R={R} yLegenda={yDaLegenda(plano, R, t, caixa)} />
      <Legenda t={t} frases={frases} y={yDaLegenda(plano, R, t, caixa)} />
      {guias ? <Guias plano={plano} caixa={caixa} t={t} yLegenda={yDaLegenda(plano, R, t, caixa)} /> : null}
      {plano.trilha ? <Audio src={staticFile(plano.trilha.arquivo)} volume={plano.trilha.volume ?? 0.1} loop /> : null}
      {plano.sfx === false
        ? null
        : listaDeSons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} durationInFrames={Math.round(5 * fps)} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};

