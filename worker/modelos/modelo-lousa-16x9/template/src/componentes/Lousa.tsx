// A lousa: desenha as páginas (o que já foi escrito até o instante t), o apagador limpando a página
// que sai, as peças que passam de uma página para a outra e o resto de giz que fica no quadro.
import { mistura, prog, vaiVem, escreve } from "../anim";
import { FiltroDeGiz, LinhaDeGiz, montarLinha, Traco } from "../giz/Escrita";
import { comprimento, pontoNoCaminho } from "../giz/glifos";
import { caminhoDoApagador, DUR_APAGAR, DUR_HERANCA, type Pagina, type Peca, type PecaEscrita, type PecaRotulo, type PecaTraco } from "../paginas";
import { cor, H, sans, W } from "../tema";


// ---------- cores ----------

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const misturarCor = (a: string, b: string, p: number) => {
  if (!a.startsWith("#") || !b.startsWith("#") || a === b) return p < 0.5 ? a : b;
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(",")})`;
};

const esquerda = (x: number, w: number, alinhar: PecaEscrita["alinhar"]) => (alinhar === "esq" ? x : alinhar === "centro" ? x - w / 2 : x - w);

// ---------- heranças: a peça da página anterior que desliza para a nova ----------

export type Herancas = {
  origem: Map<string, PecaEscrita>;
  // peça da página anterior que some (porque foi para a nova) a partir de um instante
  escondida: Map<string, number>;
};

export const ligarHerancas = (paginas: Pagina[]): Herancas => {
  const origem = new Map<string, PecaEscrita>();
  const escondida = new Map<string, number>();
  paginas.forEach((pg, i) => {
    if (i === 0) return;
    const anterior = paginas[i - 1];
    const usadas = new Set<string>();
    for (const p of pg.pecas) {
      if (p.tipo !== "escrita" || !p.herda) continue;
      const o = anterior.pecas.find((q): q is PecaEscrita => q.tipo === "escrita" && q.chave === p.herda && !usadas.has(q.id));
      if (!o) continue;
      usadas.add(o.id);
      origem.set(`${i}:${p.id}`, o);
      escondida.set(`${i - 1}:${o.id}`, pg.de);
    }
  });
  return { origem, escondida };
};

// ---------- peças ----------

const DesenhoEscrita: React.FC<{ p: PecaEscrita; t: number; id: string; chegada: number }> = ({ p, t, id }) => {
  if (p.some !== undefined && t >= p.some) return null;
  const linha = montarLinha(p.texto, p.tamanho);
  let x = esquerda(p.x, linha.largura, p.alinhar);
  let y = p.y;
  if (p.desloca) {
    const k = prog(t, p.desloca.de, p.desloca.ate - p.desloca.de, vaiVem);
    x += p.desloca.dx * k;
    y += p.desloca.dy * k;
  }
  if (p.trajeto) {
    const k = prog(t, p.trajeto.de, p.trajeto.ate - p.trajeto.de, vaiVem);
    const [px, py] = pontoNoCaminho(p.trajeto.d, k);
    const [x0, y0] = pontoNoCaminho(p.trajeto.d, 0);
    x += px - x0;
    y += py - y0;
  }
  const escrito = prog(t, p.em, p.dur, escreve);
  const opacidade = p.esmaece !== undefined ? 1 - 0.68 * prog(t, p.esmaece, 0.35) : 1;
  return (
    <>
      {p.esboco && escrito < 1 && t >= (p.aparece ?? -1) ? (
        <LinhaDeGiz id={`${id}-e`} linha={linha} x={x} y={y} p={1} cor={cor.fantasma} opacidade={prog(t, p.aparece ?? -1, 0.3)} />
      ) : null}
      <LinhaDeGiz id={id} linha={linha} x={x} y={y} p={escrito} cor={p.cor} opacidade={opacidade} />
    </>
  );
};

const DesenhoTraco: React.FC<{ p: PecaTraco; t: number }> = ({ p, t }) => {
  const total = p.d.reduce((n, d) => n + comprimento(d), 0);
  const feito = prog(t, p.em, p.dur, escreve) * total;
  let acum = 0;
  return (
    <>
      {p.esboco && feito < total && t >= (p.aparece ?? -1)
        ? p.d.map((d, i) => <Traco key={`e${i}`} d={d} p={1} cor={cor.fantasma} largura={p.largura} opacidade={prog(t, p.aparece ?? -1, 0.3)} />)
        : null}
      {p.d.map((d, i) => {
        const c = comprimento(d);
        const q = Math.min(1, Math.max(0, (feito - acum) / Math.max(c, 1e-6)));
        acum += c;
        return <Traco key={i} d={d} p={q} cor={p.cor} largura={p.largura} />;
      })}
    </>
  );
};

const DesenhoRotulo: React.FC<{ p: PecaRotulo; t: number }> = ({ p, t }) => {
  const o = prog(t, p.em, 0.4) * (p.cobertaEm !== undefined ? 1 - prog(t, p.cobertaEm, 0.4) : 1);
  if (o <= 0) return null;
  return (
    <text
      x={p.x}
      y={p.y + (1 - o) * 10}
      fontFamily={sans}
      fontWeight={p.peso ?? 700}
      fontSize={p.tamanho}
      letterSpacing={p.natural ? "0.01em" : "0.16em"}
      fill={p.cor}
      opacity={o}
      textAnchor={p.alinhar === "esq" ? "start" : p.alinhar === "centro" ? "middle" : "end"}
    >
      {p.natural ? p.texto : p.texto.toUpperCase()}
    </text>
  );
};

const pecasDeGiz = (pg: Pagina, t: number, h: Herancas, chegada: number, filtro: (p: Peca) => boolean) =>
  pg.pecas.filter(filtro).map((p) => {
    const esc = h.escondida.get(`${pg.indice}:${p.id}`);
    if (esc !== undefined && t >= esc) return null;
    const coberta = p.cobertaEm !== undefined ? prog(t, p.cobertaEm, 0.4) : 0;
    if (coberta >= 1) return null;
    const chave = `p${pg.indice}-${p.id}`;
    if (coberta > 0) return <g key={chave} opacity={1 - coberta}>{pecasDeGiz({ ...pg, pecas: [{ ...p, cobertaEm: undefined }] }, t, h, chegada, filtro)}</g>;
    if (p.tipo === "escrita") {
      const origem = h.origem.get(`${pg.indice}:${p.id}`);
      // número herdado: enquanto viaja, quem desenha é a camada de cima (Herdados); depois que chega, é giz desta página
      if (origem && t < chegada + DUR_HERANCA) return null;
      if (!origem && t < p.em && !p.esboco) return null;
      return <DesenhoEscrita key={chave} id={chave} p={p} t={t} chegada={chegada} />;
    }
    if (p.tipo === "traco") {
      if (t < p.em && !p.esboco) return null;
      return <DesenhoTraco key={chave} p={p} t={t} />;
    }
    return null;
  });

// ---------- a lousa inteira ----------

export const Lousa: React.FC<{ paginas: Pagina[]; t: number; herancas: Herancas }> = ({ paginas, t, herancas }) => {
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <FiltroDeGiz />
        <filter id="borrao" x="0" y="0" width={W} height={H} filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      {paginas.map((pg, i) => {
        const apagaEm = pg.apagaEm ?? null;
        const pa = apagaEm === null ? 0 : prog(t, apagaEm, DUR_APAGAR, vaiVem);
        const visivel = t >= pg.de - 0.05 && pa < 1;
        const caminho = caminhoDoApagador(pg.area, pg.caixas);
        const mascara = `apaga-${i}`;
        // resto de giz: depois de apagada, a página deixa uma névoa onde o apagador passou
        const resto =
          apagaEm !== null && t >= apagaEm ? (
            <g key={`resto-${i}`}>
              <path
                d={caminho.d}
                stroke={cor.giz}
                strokeOpacity={0.026}
                strokeWidth={caminho.faixa * 0.8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#borrao)"
                pathLength={1}
                strokeDasharray={pa < 1 ? `${pa} 1` : undefined}
              />
            </g>
          ) : null;
        if (!visivel) return resto;
        return (
          <g key={`pg-${i}`}>
            {resto}
            {pa > 0 ? (
              <mask id={mascara} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
                <rect x={0} y={0} width={W} height={H} fill="white" />
                <path
                  d={caminho.d}
                  stroke="black"
                  strokeWidth={caminho.faixa}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${pa} 1`}
                />
              </mask>
            ) : null}
            <g mask={pa > 0 ? `url(#${mascara})` : undefined}>
              <g filter="url(#giz)">{pecasDeGiz(pg, t, herancas, pg.limpaEm, (p) => p.tipo !== "rotulo")}</g>
              {pg.pecas.filter((p): p is PecaRotulo => p.tipo === "rotulo").map((p) => (
                <DesenhoRotulo key={`r${i}-${p.id}`} p={p} t={t} />
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
};

// Números que passam de uma página para a outra: quando o apagador começa, o número "sai" da lousa
// (cresce um pouco e fica por cima do apagador), espera a lousa ficar limpa e desliza até o lugar novo.
export const Herdados: React.FC<{ paginas: Pagina[]; t: number; herancas: Herancas }> = ({ paginas, t, herancas }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <FiltroDeGiz id="gizHerdado" />
    </defs>
    <g filter="url(#gizHerdado)">
      {paginas.map((pg, i) => {
        if (i === 0 || t < pg.de - 0.05 || t >= pg.limpaEm + DUR_HERANCA) return null;
        const apagaEm = paginas[i - 1].apagaEm ?? pg.de;
        return pg.pecas.map((p) => {
          if (p.tipo !== "escrita") return null;
          const origem = herancas.origem.get(`${i}:${p.id}`);
          if (!origem) return null;
          const anda = prog(t, pg.limpaEm, DUR_HERANCA, vaiVem);
          const sobe = prog(t, apagaEm - 0.12, 0.18) * (1 - prog(t, pg.limpaEm + DUR_HERANCA - 0.16, 0.16));
          const lo = montarLinha(origem.texto, origem.tamanho);
          const ld = montarLinha(p.texto, p.tamanho);
          const xo = esquerda(origem.x, lo.largura, origem.alinhar) + (origem.desloca?.dx ?? 0);
          const yo = origem.y + (origem.desloca?.dy ?? 0);
          const xd = esquerda(p.x, ld.largura, p.alinhar);
          // centro e tamanho no instante, com o "levantar" de 6%
          const tamanho = mistura(origem.tamanho, p.tamanho, anda) * (1 + 0.06 * sobe);
          const linha = montarLinha(p.texto, tamanho);
          const cx = mistura(xo + lo.largura / 2, xd + ld.largura / 2, anda);
          const cy = mistura(yo - origem.tamanho / 2, p.y - p.tamanho / 2, anda);
          return (
            <LinhaDeGiz
              key={`h${i}-${p.id}`}
              id={`h${i}-${p.id}`}
              linha={linha}
              x={cx - linha.largura / 2}
              y={cy + tamanho / 2}
              p={1}
              cor={misturarCor(origem.cor, p.cor, anda)}
            />
          );
        });
      })}
    </g>
  </svg>
);
