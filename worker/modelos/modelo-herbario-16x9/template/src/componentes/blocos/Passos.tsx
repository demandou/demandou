// `passos` (sequência em ordem): uma série de estágios de crescimento, como nas pranchas que mostram
// o desenvolvimento de uma planta (Fig. I, II, III…): semente → broto → muda → planta → flor.
// Cada passo é um estágio, com o medalhão romano e o texto; uma seta tracejada liga um ao outro.
// Antes de ser dito, o estágio está a lápis; na palavra, ganha tinta e aquarela, a seta até ele se
// desenha e o medalhão dele fica cheio de verde-musgo.
import { limitar, prog, temposDoTexto, Traco } from "../../anim";
import { Folha } from "../../desenhos/Ramo";
import type { Passos as PassosT } from "../../plano";
import { encaixar } from "../../medida";
import { cor, serif, traco } from "../../tema";
import { CabecalhoDoBloco, type PropsDoBloco } from "../Bloco";
import { LinhaATinta, Medalhao, romano, TextoNaFala } from "../Pecas";
import { posicoesDaLista } from "./Lista";

const DESENHO_X = 180;
const MEDALHAO_X = 366;
const TEXTO_X = 432;
const TEXTO_W = 1010 - TEXTO_X;

// Um estágio de crescimento (0 = semente … 4 = flor), com o chão em `chao` e altura `h`
export const Estagio: React.FC<{ k: number; x: number; chao: number; h: number; p: number; lapis: number }> = ({ k, x, chao, h, p, lapis }) => {
  const caule = (alt: number, curva = 10) => `M ${x} ${chao} C ${x - curva} ${chao - alt * 0.4} ${x + curva} ${chao - alt * 0.7} ${x} ${chao - alt}`;
  const tinta = limitar(p * 1.4);
  const terra = (
    <g>
      <path d={`M ${x - 86} ${chao} C ${x - 40} ${chao - 4} ${x + 40} ${chao + 4} ${x + 86} ${chao}`} fill="none" stroke={p > 0.05 ? cor.terraUmida : cor.grafite} strokeWidth={traco.medio} opacity={0.4 + 0.6 * Math.max(lapis * 0.6, tinta)} strokeLinecap="round" />
      {[-66, -40, -14, 12, 38, 64].map((dx, i) => (
        <line key={i} x1={x + dx} y1={chao + 8} x2={x + dx - 10} y2={chao + 20} stroke={p > 0.05 ? cor.terra : cor.grafiteClaro} strokeWidth={2} opacity={0.3 + 0.5 * tinta} />
      ))}
    </g>
  );
  const esboco = (d: string) => (lapis > 0.01 && p < 0.999 ? <path d={d} fill="none" stroke={cor.grafite} strokeWidth={traco.fino} opacity={lapis * (1 - p)} /> : null);
  if (k === 0) {
    const semente = `M ${x - 24} ${chao - 6} C ${x - 22} ${chao - 30} ${x + 22} ${chao - 30} ${x + 24} ${chao - 6} C ${x + 18} ${chao + 10} ${x - 18} ${chao + 10} ${x - 24} ${chao - 6} Z`;
    return (
      <g>
        {terra}
        {esboco(semente)}
        {p > 0.05 ? <path d={semente} transform="translate(3 3)" fill={cor.terra} opacity={0.7 * tinta} filter="url(#aquarela)" /> : null}
        <Traco d={semente} p={tinta} cor={cor.tinta} largura={traco.medio} />
        <Traco d={`M ${x - 4} ${chao - 18} C ${x + 2} ${chao - 10} ${x + 4} ${chao - 2} ${x + 2} ${chao + 6}`} p={limitar(p * 2 - 1)} cor={cor.tinta} largura={traco.cabelo + 0.6} />
        <Traco d={`M ${x + 6} ${chao + 6} C ${x + 10} ${chao + 18} ${x + 4} ${chao + 28} ${x + 12} ${chao + 38}`} p={limitar(p * 2 - 1)} cor={cor.raiz} largura={traco.fino} />
      </g>
    );
  }
  // alturas e folhas de cada estágio
  const alt = h * [0, 0.42, 0.66, 0.9, 0.9][k];
  const folhas: { s: number; esq: boolean; c: number; l: number }[] =
    k === 1
      ? [
          { s: 1, esq: true, c: 52, l: 22 },
          { s: 1, esq: false, c: 52, l: 22 },
        ]
      : k === 2
        ? [
            { s: 0.45, esq: true, c: 62, l: 26 },
            { s: 0.45, esq: false, c: 62, l: 26 },
            { s: 0.95, esq: true, c: 56, l: 24 },
            { s: 0.95, esq: false, c: 56, l: 24 },
          ]
        : [
            { s: 0.3, esq: true, c: 74, l: 30 },
            { s: 0.4, esq: false, c: 74, l: 30 },
            { s: 0.58, esq: true, c: 66, l: 27 },
            { s: 0.68, esq: false, c: 66, l: 27 },
            { s: 0.84, esq: true, c: 56, l: 23 },
            { s: 0.92, esq: false, c: 56, l: 23 },
          ];
  const escala = h / 170;
  return (
    <g>
      {terra}
      {esboco(caule(alt))}
      <Traco d={caule(alt)} p={tinta} cor={cor.folhaTinta} largura={traco.medio} />
      {folhas.map((f, i) => (
        <Folha
          key={i}
          x={x}
          y={chao - alt * f.s}
          ang={f.esq ? -150 : -30}
          c={f.c * escala}
          l={f.l * escala}
          p={limitar(p * 1.6 - 0.25 - i * 0.06)}
          lapis={lapis}
        />
      ))}
      {k === 4 ? (
        <g>
          {[0, 72, 144, 216, 288].map((a, i) => {
            const r = (a * Math.PI) / 180;
            const cx = x + Math.cos(r) * 16 * escala;
            const cy = chao - alt - 18 * escala + Math.sin(r) * 16 * escala;
            const pp = limitar(p * 2 - 1 - i * 0.05);
            return (
              <g key={i}>
                {lapis > 0.01 && pp < 0.999 ? <ellipse cx={cx} cy={cy} rx={15 * escala} ry={9 * escala} transform={`rotate(${a} ${cx} ${cy})`} fill="none" stroke={cor.grafite} strokeWidth={traco.cabelo} opacity={lapis * (1 - pp)} /> : null}
                {pp > 0.01 ? (
                  <ellipse cx={cx} cy={cy} rx={15 * escala} ry={9 * escala} transform={`rotate(${a} ${cx} ${cy})`} fill={cor.sol} fillOpacity={0.75 * pp} stroke={cor.tinta} strokeWidth={traco.fino} strokeOpacity={pp} />
                ) : null}
              </g>
            );
          })}
          <circle cx={x} cy={chao - alt - 18 * escala} r={7 * escala} fill={cor.terra} opacity={limitar(p * 2 - 1)} />
        </g>
      ) : null}
    </g>
  );
};

// quais estágios mostrar para n passos (sempre do primeiro ao último)
export const estagiosPara = (n: number) =>
  n <= 1 ? [4] : n === 2 ? [0, 4] : n === 3 ? [0, 2, 4] : n === 4 ? [0, 1, 3, 4] : Array.from({ length: n }, (_, i) => Math.min(4, Math.round((i * 4) / (n - 1))));

export const Passos: React.FC<PropsDoBloco & { m: PassosT }> = ({ m, t, palavras, chegada, layout, numeroFig }) => {
  const itens = m.itens.slice(0, 6);
  const n = itens.length;
  const { passo, centros } = posicoesDaLista(n, undefined, undefined, 290);
  const estagios = estagiosPara(n);
  const hDesenho = Math.min(205, passo - 62);
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.05 ? i : k), -1);
  const lapis = 1;

  // o texto de cada passo: corpo que cabe na largura e na altura do lugar dele
  const textos = itens.map((it) => {
    let max = 78;
    const caber = () => {
      const e = encaixar(it.texto, { largura: TEXTO_W, max, min: Math.min(44, max), linhas: 2, fonte: "serif" });
      const d = it.detalhe ? encaixar(it.detalhe, { largura: TEXTO_W, max: 42, min: 34, linhas: 1, fonte: "italico" }) : null;
      const altura = e.linhas.length * e.tamanho * 1.02 + (d ? 8 + d.linhas.length * d.tamanho * 1.1 : 0);
      return { e, d, altura };
    };
    let r = caber();
    while (r.altura > passo - 20 && max > 44) {
      max -= 4;
      r = caber();
    }
    return r;
  });

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {itens.map((it, i) => {
          const yc = centros[i];
          // o desenho fica centrado na linha do texto (a semente é baixinha; a flor, alta)
          const alturaVisivel = estagios[i] === 0 ? 30 : hDesenho * [0, 0.42, 0.66, 0.9, 1][estagios[i]];
          const chao = yc + alturaVisivel / 2;
          const p = prog(t, it.em - 0.05, 0.9, (v) => v);
          const prox = centros[i + 1];
          // seta tracejada até o próximo estágio: a lápis antes, a tinta quando o próximo é dito
          const seta = prox !== undefined ? prog(t, itens[i + 1].em - 0.3, 0.45) : 0;
          const y1 = chao + 26;
          const alturaProx = prox !== undefined ? (estagios[i + 1] === 0 ? 30 : hDesenho * [0, 0.42, 0.66, 0.9, 1][estagios[i + 1]]) : 0;
          const y2 = prox !== undefined ? prox - alturaProx / 2 - 14 : 0;
          return (
            <g key={i}>
              <Estagio k={estagios[i]} x={DESENHO_X} chao={chao} h={hDesenho} p={p} lapis={lapis} />
              {prox !== undefined && y2 - y1 > 16 ? (
                <g>
                  <line x1={DESENHO_X} y1={y1} x2={DESENHO_X} y2={y2} stroke={cor.grafiteClaro} strokeWidth={traco.fino} strokeDasharray="6 9" opacity={lapis * (1 - seta)} />
                  <Traco d={`M ${DESENHO_X} ${y1} L ${DESENHO_X} ${y2}`} p={seta} cor={cor.tinta} largura={traco.fino} tracejado={seta > 0.999 ? "6 9" : undefined} />
                  <Traco d={`M ${DESENHO_X - 9} ${y2 - 12} L ${DESENHO_X} ${y2} L ${DESENHO_X + 9} ${y2 - 12}`} p={limitar(seta * 3 - 2)} cor={cor.tinta} largura={traco.fino} />
                </g>
              ) : null}
              <Medalhao x={MEDALHAO_X} y={yc} r={40} texto={romano(i + 1)} p={prog(t, it.em - 0.05, 0.4)} cheio={i === atual ? prog(t, it.em + 0.1, 0.3) : 0} tamanho={i + 1 >= 4 ? 32 : 36} />
            </g>
          );
        })}
      </svg>
      {itens.map((it, i) => {
        const { e, d, altura } = textos[i];
        const tempos = temposDoTexto(e.linhas.join(" "), palavras, it.em, Math.max(it.em + 1.5, itens[i + 1]?.em ?? m.ate), it.em);
        return (
          <div key={i} style={{ position: "absolute", left: TEXTO_X, top: centros[i] - altura / 2, width: TEXTO_W }}>
            <TextoNaFala linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} lapis={lapis} entrelinha={1.02} />
            {d ? (
              <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: d.tamanho, lineHeight: 1.1, marginTop: 8 }}>
                {d.linhas.map((l, k) => (
                  <LinhaATinta key={k} texto={l} q={prog(t, tempos[tempos.length - 1] + 0.25 + k * 0.3, 0.5, (v) => v)} corTinta={cor.musgo} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
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
