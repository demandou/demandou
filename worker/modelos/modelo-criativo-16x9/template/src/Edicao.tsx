// O modelo Criativo na versão deitada (16:9, 1920×1080): o vídeo completo do YouTube no estilo do
// anúncio de performance. A composição é a da aula 9 do curso: a pessoa em quadro cheio é a base,
// com a legenda sempre ligada na área segura de baixo e as placas curtas no peito; quando um cartão
// pede apoio visual (herói, prova, listas, comparação…), a pessoa vai para uma moldura de vidro à
// direita, com o rosto centralizado e seguido, e o cartão ocupa o quadro da esquerda (o palco do
// vertical). O botão de chamada fica embaixo do cartão final. Num plano de variante (`trechos`), o
// vídeo da pessoa toca só o gancho escolhido e o corpo, emendados em corte seco.
import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { prog, saindo } from "./anim";
import { Gancho, Heroi, inicioDaFoto, Prova, Selo, type PropsPalco } from "./componentes/Assinatura";
import { Comparacao, Definicao, Destaque, Frase, Grafico, Lista, Numero, Pergunta } from "./componentes/Blocos";
import { Botao, CartaoFinal } from "./componentes/Cta";
import { Guias } from "./componentes/Guias";
import { Legenda } from "./componentes/Legenda";
import { Fundo, MolduraDeVidro } from "./componentes/Moldura";
import { caber, estiloFonte } from "./componentes/Vidro";
import { larguraTexto } from "./medida";
import { ocupaPalco, ordenar, prepararLayout, tempoNoVideo, type Layout } from "./layout";
import { VideoNaCaixa, type Caixa } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Cta as TCta, Momento, Plano, Prova as TProva, Selo as TSelo } from "./plano";
import { cor, QUADRO, SEGURO, tons as calcularTons, vidroEscuro } from "./tema";

type Som = { em: number; arquivo: string; volume: number };

// Sons tonais, raros e bem abaixo da voz: um "pop" grave nos cartões que entram, uma nota de
// marimba nas provas, um toque no número, duas notas no selo, a virada na foto que encolhe.
const sons = (plano: Plano): Som[] => {
  const lista: Som[] = [];
  const s = (em: number, nome: string, volume: number) => lista.push({ em, arquivo: `sfx/${nome}.wav`, volume });
  let k = 0;
  for (const m of ordenar(plano)) {
    switch (m.tipo) {
      case "gancho":
        if (m.telaCheia !== undefined) s(m.telaCheia, "vira", 0.18);
        if (m.iconeEm !== undefined) s(m.iconeEm, "entra", 0.2);
        break;
      case "heroi":
        s(m.em, "entra", 0.2);
        break;
      case "prova":
        s(m.em, `opcao-${(k++ % 4) + 1}`, 0.16);
        if (m.numero) s(m.numero.em, "tique", 0.22);
        if (m.telaCheia !== undefined) s(m.telaCheia, "vira", 0.18);
        break;
      case "selo":
        s(m.em, "acerto", 0.26);
        break;
      case "cta":
        s(m.toqueEm ?? m.em ?? m.de, "entra", 0.22);
        break;
      case "topicos":
      case "passos":
        m.itens.forEach((it, i) => s(it.em, `opcao-${(i % 4) + 1}`, 0.14));
        break;
      case "comparacao":
        m.lados.forEach((l, i) => s(l.em, `opcao-${i + 1}`, 0.16));
        if (m.vencedor !== undefined) s(m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, "acerto", 0.24);
        break;
      case "numero":
        s(m.em + 0.45, "tique", 0.22);
        break;
      case "destaque":
      case "definicao":
        s(m.em, "entra", 0.2);
        break;
      default:
        break;
    }
  }
  return lista.sort((a, b) => a.em - b.em).filter((x, i, l) => x.em >= 0 && (i === 0 || x.em - l[i - 1].em > 0.35));
};

// A pessoa: quadro cheio; num plano de variante, um trecho do vídeo cortado depois do outro.
const Pessoa: React.FC<{ plano: Plano; caixa: Caixa }> = ({ plano, caixa }) => {
  const { fps } = useVideoConfig();
  const vh = plano.videoAltura ?? QUADRO.h;
  if (!plano.trechos?.length) return <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={vh} />;
  let acc = 0;
  return (
    <>
      {plano.trechos.map((tr, i) => {
        const inicio = Math.round(acc * fps);
        const dur = Math.max(1, Math.round((tr.ate - tr.de) * fps));
        acc += tr.ate - tr.de;
        const ultimo = i === (plano.trechos?.length ?? 0) - 1;
        return (
          <Sequence key={i} from={inicio} durationInFrames={ultimo ? dur + fps : dur} layout="none">
            {/* dentro: o relógio do vídeo cortado (o rastro do rosto e o som vêm certos) */}
            <Sequence from={-Math.round(tr.de * fps)} layout="none">
              <VideoNaCaixa src={plano.video} caixa={caixa} rosto={plano.rosto} videoAltura={vh} />
            </Sequence>
          </Sequence>
        );
      })}
    </>
  );
};

// Tarja de quem fala: discreta, num canto de cima, ao lado da cabeça (abaixo da zona do player).
// No quadro deitado, ela só aparece com a pessoa em quadro cheio: na 1ª janela de quadro cheio que
// começa nos primeiros 8 s (nunca em cima de um cartão do quadro), por até ~2,75 s.
const Tarja: React.FC<{ t: number; plano: Plano; cor0: string; lay: Layout }> = ({ t, plano, cor0, lay }) => {
  if (!plano.marca?.nome) return null;
  const janela = lay.janelasCheias.find(([a, b]) => a <= 8 && Math.min(b, plano.duracao - 0.5) - Math.max(a, 0.25) >= 1.5);
  if (!janela) return null;
  const de = Math.max(0.25, janela[0]);
  const ate = Math.min(de + 2.75, janela[1] - 0.15, plano.duracao - 1);
  if (t < de || t > ate + 0.3) return null;
  const p = prog(t, de, 0.35) * (1 - saindo(t, ate, 0.25));
  // do lado da cabeça com mais espaço: a largura livre entre a margem e a cabeça (com a maior aproximação)
  const larguraRosto = ((plano.rosto as { rastro?: { largura?: number } }).rastro?.largura ?? 0.13) * QUADRO.w;
  const meiaCabeca = 0.56 * larguraRosto * 1.12 + 28;
  const naEsquerda = lay.rostoX >= QUADRO.w / 2;
  const livre = naEsquerda ? lay.rostoX - meiaCabeca - SEGURO.margem : QUADRO.w - SEGURO.margem - (lay.rostoX + meiaCabeca);
  const W = Math.max(220, Math.min(420, livre));
  const nome = caber(plano.marca.nome, W - 52, 46, 34, 2, 800);
  const area = plano.marca.area ? caber(plano.marca.area, W - 52, 30, 24, 2, 600) : null;
  const larg = Math.max(...nome.linhas.map((l) => larguraTexto(l, nome.tamanho, { peso: 800 })), ...(area ? area.linhas.map((l) => larguraTexto(l, area.tamanho, { peso: 600 })) : [0]), 56);
  const largura = Math.min(W, larg + 52);
  return (
    <div
      style={{
        position: "absolute",
        left: naEsquerda ? SEGURO.margem : QUADRO.w - SEGURO.margem - largura,
        top: SEGURO.topo + 24,
        width: largura,
        padding: "22px 26px",
        borderRadius: 30,
        ...vidroEscuro,
        opacity: p,
        transform: `translateX(${(1 - p) * (naEsquerda ? -20 : 20)}px)`,
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 28, background: cor0, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, ...estiloFonte(800, 30, cor.tinta) }}>{plano.marca.nome.trim()[0]?.toUpperCase()}</div>
      {nome.linhas.map((l, i) => (
        <div key={i} style={{ ...estiloFonte(800, nome.tamanho), lineHeight: 1.08 }}>
          {l}
        </div>
      ))}
      {area
        ? area.linhas.map((l, i) => (
            <div key={i} style={{ ...estiloFonte(600, area.tamanho, cor.brancoSuave), marginTop: i === 0 ? 6 : 0 }}>
              {l}
            </div>
          ))
        : null}
    </div>
  );
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoBruto, guias }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // a legenda fica sempre ligada: todo momento mostra a legenda, salvo `legenda: false`
  const plano = useMemo<Plano>(() => ({ ...planoBruto, momentos: planoBruto.momentos.map((m) => ({ ...m, legenda: m.legenda ?? true })) as Momento[] }), [planoBruto]);
  const ordem = useMemo(() => ordenar(plano), [plano]);
  const noPalco = useMemo(() => ordem.filter(ocupaPalco), [ordem]);
  const selos = useMemo(() => ordem.filter((m) => m.tipo === "selo") as TSelo[], [ordem]);
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const lay = useMemo(() => prepararLayout(plano), [plano]);
  const listaDeSons = useMemo(() => sons(plano), [plano]);
  const tons = useMemo(() => calcularTons(plano.cor), [plano.cor]);
  const caixa = lay.caixa(t);
  const naMoldura = lay.naMoldura(t);
  // as placas do peito somem rápido quando a pessoa sai do quadro cheio (e voltam quando ela volta)
  const noPeito = Math.max(0, Math.min(1, 1 - 2 * naMoldura));
  const cta = noPalco.find((m) => m.tipo === "cta") as TCta | undefined;

  // cada momento do palco sai quando o próximo entra; o último (ou o cta) fica até o fim
  const fimDe = (i: number) => {
    const m = noPalco[i];
    const prox = noPalco[i + 1];
    if (!prox) return m.tipo === "cta" || m.ate >= plano.duracao - 0.5 ? plano.duracao + 1 : m.ate;
    return Math.min(m.ate, prox.de);
  };

  // prova logo depois de outra prova: o cartão continua e só a foto passa por cima
  const continua = (i: number): boolean =>
    i > 0 &&
    noPalco[i].tipo === "prova" &&
    noPalco[i - 1].tipo === "prova" &&
    !!(noPalco[i] as TProva).imagem &&
    !!(noPalco[i - 1] as TProva).imagem &&
    Math.abs(fimDe(i - 1) - noPalco[i].de) <= 0.25;

  const desenhar = (m: Momento, i: number) => {
    const fim = fimDe(i);
    if (t < m.de - 0.6 || t > fim + 0.2) return null;
    const anterior = noPalco[i - 1];
    // no quadro da esquerda (a pessoa na moldura) ou, nas placas curtas, no peito (quadro cheio)
    const l = lay.lugar(m);
    const palco = l.modo === "peito" ? l.ret : m.tipo === "cta" ? lay.palcoCta : lay.palco;
    const p: PropsPalco = { t, plano, fim, palco, tons, imediato: m.de <= 0.05, peito: l.modo === "peito", max: l.modo === "peito" ? l.max : undefined };
    let el: React.ReactNode = null;
    switch (m.tipo) {
      case "gancho":
        el = <Gancho m={m} {...p} />;
        break;
      case "abertura":
        el = <Gancho m={{ ...m, tipo: "gancho" }} {...p} />;
        break;
      case "heroi":
        el = <Heroi m={m} {...p} />;
        break;
      case "prova": {
        const ant = continua(i) ? (anterior as TProva) : null;
        el = <Prova m={m} {...p} anterior={ant?.imagem ? { imagem: ant.imagem, de: inicioDaFoto(ant, continua(i - 1)), ate: fimDe(i - 1) } : null} />;
        break;
      }
      case "topicos":
      case "passos":
        el = <Lista m={m} {...p} />;
        break;
      case "numero":
        el = <Numero m={m} {...p} />;
        break;
      case "comparacao":
        el = <Comparacao m={m} {...p} />;
        break;
      case "grafico":
        el = <Grafico m={m} {...p} />;
        break;
      case "destaque":
        el = <Destaque m={m} {...p} />;
        break;
      case "definicao":
        el = <Definicao m={m} {...p} />;
        break;
      case "frase":
        el = <Frase m={m} {...p} />;
        break;
      case "pergunta":
        el = <Pergunta m={m} {...p} />;
        break;
      case "cta":
        el = <CartaoFinal m={m} {...p} />;
        break;
      default:
        el = null;
    }
    if (t < m.de - 0.02 && !p.imediato) return null;
    // saída: rápida e limpa (3–4 quadros); se a próxima prova continua no mesmo cartão, corte seco
    // (o cartão novo já desenha a mesma foto no mesmo lugar: nada de imagem dupla)
    const s = i + 1 < noPalco.length && continua(i + 1) ? (t >= fim ? 1 : 0) : saindo(t, fim, 0.14);
    if (s >= 1) return null;
    // a placa do peito pertence ao quadro cheio: some enquanto a pessoa vai para a moldura (ou ainda
    // está voltando dela), para nunca ficar solta em cima do vídeo que desliza
    const k = l.modo === "peito" ? noPeito : 1;
    if (k <= 0) return null;
    return (
      <div key={`${m.tipo}-${m.de}`} style={{ position: "absolute", inset: 0, opacity: (1 - s) * k, transform: s > 0 ? `scale(${1 - 0.03 * s})` : undefined, transformOrigin: "50% 70%" }}>
        {el}
      </div>
    );
  };

  // o selo cola no canto de cima à direita do cartão da vez (pessoa na moldura) ou, no quadro cheio,
  // no canto de cima do lado oposto ao rosto; o lugar é o do instante em que ele carimba
  const lugarDoSelo = (m: TSelo) => lay.selo(m.em, !!cta && m.em >= cta.de - 0.05);
  const botaoNoPeito = !!cta && lay.lugar(cta).modo === "peito";

  return (
    <AbsoluteFill style={{ backgroundColor: cor.tinta }}>
      {/* atrás de tudo: o fundo do quadro (aparece quando a pessoa vai para a moldura) */}
      {naMoldura > 0 ? <Fundo tons={tons} /> : null}
      <MolduraDeVidro caixa={caixa} p={naMoldura} />
      {/* o vídeo fica montado o tempo todo (é dele que vem a voz) */}
      <Pessoa plano={plano} caixa={caixa} />
      {noPalco.map((m, i) => desenhar(m, i))}
      {selos.map((m) => (t >= m.de - 0.05 && t <= m.ate + 0.3 ? <Selo key={`selo-${m.de}`} t={t} m={m} {...lugarDoSelo(m)} tons={tons} /> : null))}
      <Tarja t={t} plano={plano} cor0={tons.destaque} lay={lay} />
      <Legenda t={t} frases={frases} y={lay.yLegenda} tons={tons} />
      {cta && (!botaoNoPeito || noPeito > 0) ? (
        <div style={{ position: "absolute", inset: 0, opacity: botaoNoPeito ? noPeito : 1 }}>
          <Botao t={t} m={cta} {...lay.botao(cta)} tons={tons} />
        </div>
      ) : null}
      {guias ? <Guias plano={plano} caixa={caixa} t={t} lay={lay} tVideo={tempoNoVideo(plano, t)} /> : null}
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
