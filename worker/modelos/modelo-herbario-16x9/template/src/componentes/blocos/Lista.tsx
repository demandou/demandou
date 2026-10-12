// `topicos` (lista sem ordem): um ramo prensado que a pena desenha de cima para baixo pela prancha.
// Cada item é uma folha do ramo, com o anel numerado no nó, a linha-guia e a etiqueta de espécime.
// Antes de ser dito, o item já está lá a lápis (folha e etiqueta cinza); na palavra, a folha ganha
// tinta e aquarela, a linha corre e a etiqueta ganha tinta. A pena desce pelo caule até o item da vez.
import { romano } from "../Cabecalho";
import { limitar, mistura, prog, Traco } from "../../anim";
import { Folha, naCurva } from "../../desenhos/Ramo";
import { FUNDO_CONTEUDO, TOPO_CONTEUDO } from "../../layout";
import type { Topicos } from "../../plano";
import { cor, traco } from "../../tema";
import { CabecalhoDoBloco, type PropsDoBloco } from "../Bloco";
import { EtiquetaDeItem, medirEtiquetaDeItem } from "../Pecas";

const CAULE_X = 196;
const ETIQUETA_X = 326;
const ETIQUETA_W = 1010 - ETIQUETA_X;

// Posições dos itens: espaçados por igual no corpo da prancha (no máximo `maximo` px entre eles)
export const posicoesDaLista = (n: number, topo = TOPO_CONTEUDO, fundo = FUNDO_CONTEUDO, maximo = 270) => {
  const passo = Math.min(maximo, (fundo - topo) / Math.max(1, n));
  const total = passo * n;
  const y0 = topo + (fundo - topo - total) / 2;
  return { passo, y0, total, centros: Array.from({ length: n }, (_, i) => y0 + passo * (i + 0.5)) };
};

export const Lista: React.FC<PropsDoBloco & { m: Topicos }> = ({ m, t, palavras, chegada, layout, numeroFig }) => {
  const itens = m.itens.slice(0, 6);
  const n = itens.length;
  const { passo, y0, total, centros } = posicoesDaLista(n);
  // o caule: um S suave do alto da lista até embaixo
  const a = { x: CAULE_X + 14, y: y0 - 20 };
  const b = { x: CAULE_X - 30, y: y0 + total * 0.35 };
  const c = { x: CAULE_X + 34, y: y0 + total * 0.7 };
  const d = { x: CAULE_X - 6, y: y0 + total + 16 };
  const caule = `M ${a.x} ${a.y} C ${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`;
  // o ponto do caule na altura y (a curva sobe quase reta: busca pelo s)
  const sNaAltura = (y: number) => {
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 24; k++) {
      const meio = (lo + hi) / 2;
      if (naCurva(a, b, c, d, meio).y < y) lo = meio;
      else hi = meio;
    }
    return (lo + hi) / 2;
  };
  const nos = centros.map((y) => {
    const s = sNaAltura(y);
    return { s, ...naCurva(a, b, c, d, s) };
  });

  // a pena desce pelo caule: chega ao nó de cada item na palavra dele e, enquanto espera o próximo,
  // avança devagar um pedaço do caminho; depois do último, termina o caule
  let pena = 0;
  itens.forEach((it, i) => {
    const alvo = nos[i].s;
    pena = mistura(pena, alvo, prog(t, it.em - 0.1, 0.5));
    const prox = itens[i + 1];
    if (prox && t > it.em + 0.4) {
      const espera = Math.max(0.5, prox.em - it.em - 0.5);
      pena = mistura(pena, mistura(alvo, nos[i + 1].s, 0.4), prog(t, it.em + 0.4, espera, (v) => v));
    }
  });
  const ultimo = itens[n - 1];
  if (ultimo) pena = mistura(pena, 1, prog(t, ultimo.em + 0.5, 0.8));

  // cada etiqueta cabe na altura do seu lugar (o texto encolhe antes)
  const medidas = itens.map((it) => {
    let max = 62;
    let med = medirEtiquetaDeItem(it.texto, ETIQUETA_W, { max, min: 40, detalhe: it.detalhe });
    while (med.altura > passo - 16 && max > 40) {
      max -= 4;
      med = medirEtiquetaDeItem(it.texto, ETIQUETA_W, { max, min: Math.min(40, max), detalhe: it.detalhe });
    }
    return med;
  });
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.05 ? i : k), -1);
  // o esboço a lápis já está na prancha quando ela chega (e no primeiro quadro do vídeo)
  const lapis = 1;

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* caule: esboço a lápis inteiro, a tinta corre até o item da vez */}
        <path d={caule} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis * (1 - limitar(pena * 1.2 - 0.2))} />
        <Traco d={caule} p={pena} cor={cor.folhaTinta} largura={traco.forte} />
        {itens.map((it, i) => {
          const no = nos[i];
          const p = prog(t, it.em - 0.05, 0.7);
          const esquerda = i % 2 === 0;
          // folhas alternadas; as da direita sobem para não cruzar a linha-guia
          const ang = esquerda ? no.ang - 72 : no.ang + 52;
          const fio = prog(t, it.em + 0.05, 0.35);
          const tam = Math.min(1, passo / 200);
          return (
            <g key={i}>
              <Folha x={no.x} y={no.y} ang={ang} c={118 * tam} l={48 * tam} p={p} lapis={lapis} />
              {/* linha-guia do nó até a etiqueta */}
              <line x1={no.x + 14} y1={no.y} x2={ETIQUETA_X} y2={no.y} stroke={cor.grafiteClaro} strokeWidth={traco.cabelo} strokeDasharray="3 7" opacity={lapis * (1 - fio)} />
              <Traco d={`M ${no.x + 14} ${no.y} L ${ETIQUETA_X} ${no.y}`} p={fio} cor={cor.tinta} largura={traco.fino} />
              <circle cx={no.x} cy={no.y} r={11} fill={cor.etiqueta} fillOpacity={0.7} stroke={p > 0.2 ? cor.musgo : cor.grafite} strokeWidth={traco.medio} />
              <circle cx={no.x} cy={no.y} r={4.5} fill={p > 0.2 ? cor.musgo : cor.grafite} />
            </g>
          );
        })}
      </svg>
      {itens.map((it, i) => (
        <EtiquetaDeItem
          key={i}
          x={ETIQUETA_X}
          y={centros[i]}
          medida={medidas[i]}
          numero={i + 1}
          em={it.em}
          t={t}
          atual={i === atual}
        />
      ))}
      <CabecalhoDoBloco
        t={t}
        palavras={palavras}
        chegada={chegada}
        layout={layout}
        numeroFig={numeroFig}
        de={m.de}
        ate={m.ate}
        rotulo={m.titulo || !m.rotulo ? (m.rotulo ?? `Fig. ${romano(numeroFig)}`) : `Fig. ${romano(numeroFig)}`}
        titulo={m.titulo ?? m.rotulo}
        indice={m.titulo || m.rotulo ? undefined : { total: n, atual: atual + 1 }}
      />
    </>
  );
};
