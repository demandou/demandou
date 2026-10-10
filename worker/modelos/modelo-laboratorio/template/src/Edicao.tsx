import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { limitar, prog, useTempo } from "./anim";
import { Guias } from "./componentes/Guias";
import { Foto, Voz } from "./componentes/Janela";
import { Legendas } from "./componentes/Legendas";
import { Papel } from "./componentes/Papel";
import { Anotacoes } from "./figuras/Anotacoes";
import { Cta } from "./figuras/Cta";
import { Espectro } from "./figuras/Espectro";
import { Grafico } from "./figuras/Grafico";
import { Observador } from "./figuras/Observador";
import { Ondas } from "./figuras/Ondas";
import { Particulas } from "./figuras/Particulas";
import { Titulo } from "./figuras/Titulo";
import { Trajeto } from "./figuras/Trajeto";
import { Amostras } from "./figuras/Amostras";
import { Lista } from "./figuras/Lista";
import { Medida } from "./figuras/Medida";
import { NotaDefinicao, NotaDestaque, NotaFrase, NotaPergunta } from "./figuras/Notas";
import { Procedimento } from "./figuras/Procedimento";
import { areasDoLayout, BORDA_FOTO, caixaDoLayout, chegadas, estadosDaCaixa, type Folha, FOLGA_ANEL, folhasNoTempo, layoutDe, rotuloDe, trechosDaJanela, VIAGEM } from "./layout";
import { useFontesProntas } from "./medir";
import { caixaNoTempo } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import type { Momento, Plano } from "./plano";
import { H, LEGENDA_BASE, LEGENDA_CORPO, W } from "./tema";

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

// Sons raros e tonais: um tom grave e macio a cada página nova (três alturas que se revezam) e
// uma nota ou acorde só nas viradas da explicação (o feixe que se abre, o céu que se pinta,
// o pôr do sol, o fechamento). Nunca dois sons colados.
const montarSons = (plano: Plano, inicios: number[]): Som[] => {
  const lista: Som[] = [];
  inicios.forEach((de, i) => {
    if (i > 0) lista.push({ em: de + 0.04, arquivo: `sfx/pagina-${(i % 3) + 1}.wav`, volume: 0.3 });
  });
  for (const m of plano.momentos) {
    if (m.tipo === "espectro") lista.push({ em: m.abreEm + 0.05, arquivo: "sfx/abre.wav", volume: 0.34 });
    if (m.tipo === "observador") lista.push({ em: m.chegaEm + 0.05, arquivo: "sfx/ceu.wav", volume: 0.36 });
    if (m.tipo === "trajeto") lista.push({ em: m.sobraEm + 0.05, arquivo: "sfx/tarde.wav", volume: 0.36 });
    if (m.tipo === "cta") lista.push({ em: (m.iconeEm ?? m.de + 0.9) + 0.05, arquivo: "sfx/fim.wav", volume: 0.34 });
    // blocos universais: só nas viradas (o número que termina de contar, o alerta, a vencedora)
    if (m.tipo === "numero") lista.push({ em: m.em + 1.15, arquivo: "sfx/abre.wav", volume: 0.26 });
    if (m.tipo === "destaque" && (m.nivel ?? "alerta") === "alerta") lista.push({ em: m.em + 0.05, arquivo: "sfx/tarde.wav", volume: 0.3 });
    if (m.tipo === "comparacao" && m.vencedor !== undefined) lista.push({ em: (m.vencedorEm ?? m.lados[1].em + 0.7) + 0.05, arquivo: "sfx/ceu.wav", volume: 0.3 });
  }
  const ordenados = lista.sort((a, b) => a.em - b.em);
  const saida: Som[] = [];
  for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.45) saida.push(s);
  return saida;
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const pronto = useFontesProntas();
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  const inicios = useMemo(() => chegadas(plano), [plano]);
  const sons = useMemo(() => montarSons(plano, inicios), [plano, inicios]);
  const caixa = caixaNoTempo(t, estados);
  const trechos = useMemo(() => trechosDaJanela(plano), [plano]);
  // o lugar da pessoa logo antes de um instante
  const estadoAntes = (de: number) => [...trechos].reverse().find((tr) => tr.de < de - 0.01)?.layout ?? "cheio";
  // cada momento é uma folha do caderno (ver layout.ts): no máximo duas à vista, na troca
  const folhas = folhasNoTempo(t, plano, inicios, caixa.y + caixa.h);
  // a janela grande (sem folha): tela cheia, ou a pessoa saindo/voltando dela
  const janelaGrande = folhas.length === 0 || folhas.some((f) => !f.foto);
  // o papel de fundo acompanha a folha que sobe colada na janela (sem emenda na grade)
  const seguindo = folhas.find((f) => !f.foto);

  // quanto a pessoa (na janela grande) já saiu de cima do cabeçalho de uma figura: 1 = livre
  const livre = (m: Momento) => {
    const layout = layoutDe(m, plano.momentos);
    const cab = areasDoLayout(layout).cabecalho;
    // no "baixo" o céu fica em cima da pessoa: só aparece quando ela já encolheu
    if (layout === "baixo") return limitar((W - 500 - caixa.w) / 100);
    // nos cantos, o cabeçalho fica no lugar e a pessoa encolhendo o revela
    if (!cab || layout === "direita" || layout === "esquerda") return 1;
    const folga = cab.x > W / 2 ? cab.x - (caixa.x + caixa.w) : caixa.x - (cab.x + cab.w);
    return limitar(folga / 30);
  };
  const desenhar = (m: Momento, i: number, f: Folha) => {
    // momento que começa saindo da tela cheia: o texto espera o papel aparecer embaixo da pessoa
    const daTelaCheia = estadoAntes(inicios[i]) === "cheio";
    const revela = inicios[i] + (daTelaCheia ? VIAGEM * 0.78 : 0);
    const opCabecalho = f.foto ? 1 : livre(m);
    const rotulo = rotuloDe(plano.momentos, i);
    const props = { t, areas: areasDoLayout(layoutDe(m, plano.momentos)), palavras: plano.palavras, chegada: inicios[i], id: `fig${i}`, revela, opCabecalho, rotulo, marca: plano.marca };
    // as figuras de experimento leem `m.rotulo`: sem rótulo no plano, recebem o automático ("Fig. N · …")
    const r = <T extends Momento>(x: T): T => (x.rotulo ? x : { ...x, rotulo });
    switch (m.tipo) {
      case "titulo":
        return <Titulo m={m} {...props} />;
      case "abertura":
        return <Titulo m={m} {...props} />;
      case "topicos":
        return <Lista m={m} {...props} />;
      case "passos":
        return <Procedimento m={m} {...props} />;
      case "numero":
        return <Medida m={m} {...props} />;
      case "comparacao":
        return <Amostras m={m} {...props} />;
      case "destaque":
        return <NotaDestaque m={m} {...props} />;
      case "definicao":
        return <NotaDefinicao m={m} {...props} />;
      case "frase":
        return <NotaFrase m={m} {...props} />;
      case "pergunta":
        return <NotaPergunta m={m} {...props} />;
      case "espectro":
        return <Espectro m={r(m)} {...props} />;
      case "particulas":
        return <Particulas m={r(m)} {...props} />;
      case "ondas":
        return <Ondas m={r(m)} {...props} />;
      case "observador":
        return <Observador m={r(m)} {...props} />;
      case "trajeto":
        return <Trajeto m={r(m)} {...props} />;
      case "anotacoes":
        return <Anotacoes m={r(m)} {...props} />;
      case "grafico":
        return <Grafico m={r(m)} {...props} />;
      case "cta":
        return <Cta m={m} {...props} marca={plano.marca} />;
    }
    return null;
  };
  const folha = (f: Folha) => {
    const m = plano.momentos[f.i];
    return (
      <div
        key={`f${f.i}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `translateY(${f.offset}px)`,
          boxShadow: f.sombra ? "0 -14px 30px rgba(29,41,53,0.16), 0 -2px 4px rgba(29,41,53,0.12)" : undefined,
        }}
      >
        <Papel rolagem={0} />
        <div style={{ position: "absolute", inset: 0, opacity: !f.foto && layoutDe(m, plano.momentos) === "baixo" ? livre(m) : 1 }}>{desenhar(m, f.i, f)}</div>
        {f.foto ? <Foto plano={plano} caixa={caixaDoLayout(layoutDe(m, plano.momentos), plano)} anel={prog(t, f.anelEm, 0.45)} /> : null}
      </div>
    );
  };
  // a legenda some enquanto uma foto (a folha nova subindo) passa pela faixa dela: nunca cobre o rosto
  const faixaLegenda = { topo: LEGENDA_BASE - LEGENDA_CORPO * 1.15 - 40, base: LEGENDA_BASE + 8 };
  const opLegenda = Math.min(
    1,
    ...folhas
      .filter((f) => f.foto)
      .map((f) => {
        const c = caixaDoLayout(layoutDe(plano.momentos[f.i], plano.momentos), plano);
        const topo = c.y + f.offset - BORDA_FOTO - FOLGA_ANEL;
        const base = c.y + c.h + f.offset + BORDA_FOTO + FOLGA_ANEL;
        const distancia = Math.max(faixaLegenda.topo - base, topo - faixaLegenda.base);
        return limitar(distancia / 40);
      }),
  );
  const atual = [...plano.momentos].reverse().find((m) => t >= m.de);
  const areasAtuais = atual ? areasDoLayout(layoutDe(atual, plano.momentos)) : null;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Voz plano={plano} />
      <Papel rolagem={seguindo ? -seguindo.offset : 0} />
      {pronto ? folhas.map(folha) : null}
      {janelaGrande ? <Foto plano={plano} caixa={caixa} /> : null}
      {pronto ? <Legendas frases={frases} opacidade={opLegenda} /> : null}
      {guias ? <Guias plano={plano} caixa={caixa} cabecalho={areasAtuais?.cabecalho ?? null} corpo={areasAtuais?.corpo ?? null} /> : null}
      {plano.sfx === false
        ? null
        : sons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
