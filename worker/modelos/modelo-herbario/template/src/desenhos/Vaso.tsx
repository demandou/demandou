// A planta num vaso em corte, como numa prancha antiga: traço de pena fino, aguadas de aquarela
// levemente fora do registro, parede do vaso cortada e hachurada, terra pontilhada, raízes à mostra.
// Coordenadas locais: centro do vaso em x = 0, borda de cima do vaso em y = 0 (o vaso tem 420 de altura).
import { limitar, misturarCor, Traco } from "../anim";
import { cor, traco } from "../tema";

// meia-largura da cavidade (o lado de dentro da parede) na altura y
export const meiaCavidade = (y: number) => (y <= 60 ? 244 - 18 * (y / 60) : 226 - 58 * ((y - 60) / 336));
export const SUPERFICIE = 40; // topo da terra
export const FUNDO = 396; // fundo de dentro do vaso
export const BASE = 420; // apoio do vaso

const CONTORNO_EXTERNO = "M -270 0 L 270 0 L 270 56 L 250 56 L 190 420 L -190 420 L -250 56 L -270 56 Z";
const CAVIDADE = "M -244 0 L 244 0 L 226 60 L 168 396 L -168 396 L -226 60 Z";

// terra: da superfície (levemente irregular) até o fundo
const terraAte = (topo: number) => {
  const xt = meiaCavidade(topo);
  if (topo <= 60) {
    return `M ${-xt} ${topo} C ${-xt * 0.5} ${topo - 6} ${-xt * 0.15} ${topo + 5} 0 ${topo} C ${xt * 0.3} ${topo - 5} ${xt * 0.6} ${topo + 4} ${xt} ${topo} L 226 60 L 168 396 L -168 396 L -226 60 Z`;
  }
  return `M ${-xt} ${topo} L ${xt} ${topo} L 168 396 L -168 396 Z`;
};

// água: da altura `topo` até o fundo, com a linha de cima ondulada
const aguaAte = (topo: number, onda: number) => {
  const xt = meiaCavidade(topo);
  const fundo = topo <= 60 ? ` L 226 60 L 168 396 L -168 396 L -226 60 Z` : ` L 168 396 L -168 396 Z`;
  return `M ${-xt} ${topo} C ${-xt * 0.5} ${topo - 5 * onda} ${-xt * 0.2} ${topo + 5 * onda} 0 ${topo} C ${xt * 0.25} ${topo - 5 * onda} ${xt * 0.6} ${topo + 4 * onda} ${xt} ${topo}${fundo}`;
};

// ---------- raízes ----------
// cada raiz: caminho, profundidade da ponta (0–1) e espessura
const RAIZES: { d: string; fundo: number; w: number }[] = [
  { d: "M 0 44 C 4 110 -6 180 2 260 C 8 320 -4 356 6 384", fundo: 1, w: 4.4 },
  { d: "M -2 84 C -40 126 -92 160 -120 228 C -136 268 -128 310 -140 352", fundo: 0.92, w: 3.6 },
  { d: "M 2 96 C 50 136 100 168 120 238 C 132 284 150 320 146 362", fundo: 0.95, w: 3.6 },
  { d: "M -62 146 C -104 166 -150 196 -172 258", fundo: 0.62, w: 2.6 },
  { d: "M 70 158 C 112 186 150 210 176 270", fundo: 0.66, w: 2.6 },
  { d: "M 0 200 C -28 240 -58 280 -70 342", fundo: 0.86, w: 2.8 },
  { d: "M 4 214 C 30 252 60 300 72 350", fundo: 0.87, w: 2.8 },
  { d: "M -120 230 C -150 262 -168 300 -160 340", fundo: 0.84, w: 2.2 },
  { d: "M 120 240 C 102 280 98 320 104 364", fundo: 0.95, w: 2.2 },
  { d: "M -40 120 C -70 112 -100 120 -132 108", fundo: 0.3, w: 2 },
  { d: "M 40 128 C 76 118 112 128 150 116", fundo: 0.32, w: 2 },
  { d: "M -140 352 C -150 366 -146 376 -156 386", fundo: 1, w: 1.6 },
  { d: "M 146 362 C 154 372 150 380 160 388", fundo: 1, w: 1.6 },
];

// ---------- folhas ----------
// folha ovada com ponta, apontando para +x a partir da base
export const folha = (c: number, l: number) =>
  `M 0 0 C ${c * 0.22} ${-l * 1.02} ${c * 0.72} ${-l * 0.86} ${c} 0 C ${c * 0.7} ${l * 0.84} ${c * 0.22} ${l * 0.98} 0 0 Z`;
export const nervuras = (c: number, l: number) => {
  const lista: string[] = [`M 0 0 C ${c * 0.35} ${-l * 0.06} ${c * 0.7} ${-l * 0.04} ${c * 0.96} 0`];
  for (let i = 1; i <= 4; i++) {
    const x = c * (0.14 + i * 0.16);
    const alc = l * (0.82 - i * 0.12);
    lista.push(`M ${x} ${-l * 0.02} Q ${x + c * 0.08} ${-alc * 0.55} ${x + c * 0.16} ${-alc * 0.86}`);
    lista.push(`M ${x} ${l * 0.02} Q ${x + c * 0.08} ${alc * 0.55} ${x + c * 0.16} ${alc * 0.86}`);
  }
  return lista;
};

// ramos: do colo da planta (0, 40) até a base de cada folha; ângulo da folha em graus; c × l = tamanho
type Ramo = { d: string; x: number; y: number; ang: number; c: number; l: number; queda: number };
const RAMOS: Ramo[] = [
  { d: "M 0 40 C 2 -40 10 -160 18 -282", x: 18, y: -282, ang: -84, c: 200, l: 84, queda: 50 },
  { d: "M 0 40 C -4 -30 -26 -130 -64 -214", x: -64, y: -214, ang: -138, c: 196, l: 80, queda: -46 },
  { d: "M 0 40 C 8 -20 52 -100 112 -150", x: 112, y: -150, ang: -24, c: 206, l: 84, queda: 52 },
  { d: "M 0 40 C 6 -40 40 -170 86 -236", x: 86, y: -236, ang: -56, c: 180, l: 74, queda: 56 },
  { d: "M 0 40 C 8 10 60 -24 120 -40", x: 120, y: -40, ang: 8, c: 176, l: 72, queda: 40 },
];

// ---------- pontilhado da terra (fixo) ----------
const semente = (n: number) => {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};
const PONTOS: { x: number; y: number; r: number; pedra: boolean }[] = (() => {
  const rnd = semente(11);
  const lista: { x: number; y: number; r: number; pedra: boolean }[] = [];
  while (lista.length < 170) {
    const y = SUPERFICIE + 10 + rnd() * (FUNDO - SUPERFICIE - 18);
    const m = meiaCavidade(y) - 12;
    const x = (rnd() * 2 - 1) * m;
    const pedra = rnd() < 0.12;
    lista.push({ x, y, r: pedra ? 5 + rnd() * 5 : 1.4 + rnd() * 2, pedra });
  }
  return lista;
})();

export type EstadoVaso = {
  // esboço a lápis visível (0–1); traço de tinta desenhado (0–1); aguadas (0–1)
  lapis: number;
  tinta: number;
  aguada: number;
  // nível da água dentro do vaso: 0 = nada, 1 = até a superfície
  agua: number;
  // raízes apodrecidas (0–1)
  podre: number;
  // folhas caídas (0–1) e pálidas (0–1); folha nova (0–1)
  murcho: number;
  palido: number;
  broto: number;
  // furo no fundo: tracejado com ✗ (0–1) e aberto (0–1); gotas escorrendo (s desde a abertura)
  semFuro: number;
  furo: number;
  escorre: number;
  // tom da terra: 0 = normal; > 0 escurece (úmida); < 0 clareia (seca)
  tomTerra: number;
  // opacidade das folhas (o detalhe da terra deixa a planta em segundo plano)
  folhas?: number;
  // planta espelhada (variedade entre figuras)
  espelho?: boolean;
  // tempo (para a ondulação da água)
  t: number;
  // zoom da câmera neste desenho (compensa a espessura dos traços)
  escala: number;
  // desenha só da terra para baixo (detalhe ampliado)
  semFolhas?: boolean;
  id: string;
};

export const Vaso: React.FC<EstadoVaso> = (e) => {
  const s = e.escala;
  const tinta = e.tinta;
  const pedaco = (de: number, dur: number) => limitar((tinta - de) / dur);
  const corFolha = misturarCor(cor.folha, cor.folhaPalida, e.palido);
  const corNervura = misturarCor(cor.folhaTinta, "#8C8A55", e.palido * 0.8);
  const corTerra =
    e.tomTerra >= 0 ? misturarCor(cor.terra, cor.terraUmida, e.tomTerra * 0.55) : misturarCor(cor.terra, cor.terraSeca, -e.tomTerra);
  const topoAgua = FUNDO - (FUNDO - SUPERFICIE) * limitar(e.agua);
  const onda = Math.sin(e.t * 3.1);
  const lapis = e.lapis * (1 - tinta * 0.85);

  const linha = (d: string, p: number, largura: number, c: string = cor.tinta, extra?: React.SVGProps<SVGPathElement>) => (
    <Traco d={d} p={p} cor={c} largura={largura} escala={s} {...extra} />
  );

  return (
    <g>
      {/* ---- esboço a lápis: o desenho todo, cinza e fino, antes da tinta ---- */}
      {lapis > 0.01 ? (
        <g opacity={lapis}>
          <path d={CONTORNO_EXTERNO} fill="none" stroke={cor.grafite} strokeWidth={traco.fino / s} />
          <path d={CAVIDADE} fill="none" stroke={cor.grafite} strokeWidth={traco.cabelo / s} />
          {RAIZES.slice(0, 7).map((r, i) => (
            <path key={i} d={r.d} fill="none" stroke={cor.grafite} strokeWidth={traco.cabelo / s} />
          ))}
          {e.semFolhas
            ? null
            : RAMOS.map((r, i) => (
                <g key={i} transform={e.espelho ? "scale(-1 1)" : undefined}>
                  <path d={r.d} fill="none" stroke={cor.grafite} strokeWidth={traco.fino / s} />
                  <path d={folha(r.c, r.l)} transform={`translate(${r.x} ${r.y}) rotate(${r.ang})`} fill="none" stroke={cor.grafite} strokeWidth={traco.fino / s} />
                </g>
              ))}
        </g>
      ) : null}

      {/* ---- aguadas (aquarela) por baixo da tinta, um pouco fora do registro ---- */}
      <g opacity={e.aguada} filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }}>
        <g transform="translate(4 3)">
          <path d={terraAte(SUPERFICIE)} fill={corTerra} opacity={0.62} />
          <path d={CONTORNO_EXTERNO + " " + CAVIDADE} fillRule="evenodd" fill={cor.vaso} opacity={0.7} />
        </g>
      </g>

      {/* água dentro da terra */}
      {e.agua > 0.004 ? (
        <g>
          <path d={aguaAte(topoAgua, onda)} fill={cor.agua} opacity={0.62} filter="url(#aquarela)" />
          {/* hachura horizontal: o jeito antigo de desenhar água */}
          {Array.from({ length: 22 }, (_, i) => topoAgua + 14 + i * 16)
            .filter((y) => y < FUNDO - 6)
            .map((y, i) => {
              const m = meiaCavidade(y) - 16;
              const desloc = (i % 2) * 18;
              return (
                <path
                  key={i}
                  d={`M ${-m + desloc} ${y} L ${m - 30 + desloc * 0.5} ${y}`}
                  stroke={cor.aguaTinta}
                  strokeWidth={1.6 / s}
                  strokeDasharray={`${34 / s} ${16 / s}`}
                  opacity={0.6}
                />
              );
            })}
          <path
            d={`M ${-meiaCavidade(topoAgua)} ${topoAgua} C ${-meiaCavidade(topoAgua) * 0.5} ${topoAgua - 5 * onda} ${-meiaCavidade(topoAgua) * 0.2} ${topoAgua + 5 * onda} 0 ${topoAgua} C ${meiaCavidade(topoAgua) * 0.25} ${topoAgua - 5 * onda} ${meiaCavidade(topoAgua) * 0.6} ${topoAgua + 4 * onda} ${meiaCavidade(topoAgua)} ${topoAgua}`}
            fill="none"
            stroke={cor.aguaTinta}
            strokeWidth={traco.medio / s}
            strokeLinecap="round"
          />
        </g>
      ) : null}

      {/* pontilhado da terra */}
      <g opacity={limitar(e.aguada * 1.2)}>
        {PONTOS.map((p, i) =>
          p.pedra ? (
            <ellipse key={i} cx={p.x} cy={p.y} rx={p.r} ry={p.r * 0.7} fill="none" stroke={misturarCor(cor.terraUmida, cor.tinta, 0.3)} strokeWidth={1.4 / s} opacity={0.75} />
          ) : (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={cor.terraUmida} opacity={0.5 + (e.tomTerra > 0 ? e.tomTerra * 0.2 : 0)} />
          ),
        )}
      </g>

      {/* raízes */}
      {RAIZES.map((r, i) => {
        const pTinta = pedaco(0.25 + i * 0.03, 0.45);
        // a podridão começa pelas pontas mais fundas e sobe
        const podre = limitar(e.podre * 1.6 - (1 - r.fundo) * 0.9);
        const c = misturarCor(misturarCor(cor.raiz, "#8C7650", 0.35), cor.raizPodre, podre);
        return (
          <g key={i}>
            {linha(r.d, pTinta, r.w + podre * 1.4, c)}
            {i < 7 && pTinta > 0.9 ? linha(r.d, 1, 1.1, misturarCor("#F2E8CF", cor.raizPodre, podre), { opacity: 0.6, transform: "translate(-1 -1)" }) : null}
          </g>
        );
      })}
      {/* manchas de podre nas raízes */}
      {e.podre > 0.3
        ? [
            [-128, 300],
            [138, 330],
            [-62, 318],
            [64, 330],
            [4, 352],
            [-150, 344],
            [100, 352],
          ].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={7} ry={5} fill={cor.raizPodre} opacity={limitar((e.podre - 0.3) * 2 - i * 0.08)} />
          ))
        : null}

      {/* parede do vaso cortada: hachura + contornos */}
      <path d={CONTORNO_EXTERNO + " " + CAVIDADE} fillRule="evenodd" fill="url(#hachura)" opacity={limitar(e.aguada * 1.3) * 0.8} />
      {linha(CONTORNO_EXTERNO, pedaco(0, 0.5), traco.forte)}
      {linha("M -244 0 L -226 60 L -168 396 L 168 396 L 226 60 L 244 0", pedaco(0.08, 0.5), traco.medio)}
      {linha(`M -246 56 L 246 56`, pedaco(0.3, 0.3), traco.fino, cor.vasoCorte, { opacity: 0.8 })}
      {/* superfície da terra */}
      {linha(
        `M ${-meiaCavidade(SUPERFICIE)} ${SUPERFICIE} C ${-meiaCavidade(SUPERFICIE) * 0.5} ${SUPERFICIE - 6} ${-meiaCavidade(SUPERFICIE) * 0.15} ${SUPERFICIE + 5} 0 ${SUPERFICIE} C ${meiaCavidade(SUPERFICIE) * 0.3} ${SUPERFICIE - 5} ${meiaCavidade(SUPERFICIE) * 0.6} ${SUPERFICIE + 4} ${meiaCavidade(SUPERFICIE)} ${SUPERFICIE}`,
        pedaco(0.15, 0.4),
        traco.medio,
        misturarCor(cor.terraUmida, cor.tinta, 0.4),
      )}

      {/* furo do fundo */}
      {e.semFuro > 0.01 && e.furo < 0.99 ? (
        <g opacity={(1 - e.furo) * limitar(e.semFuro * 2)}>
          <ellipse cx={0} cy={408} rx={58} ry={34} fill={cor.etiqueta} fillOpacity={0.55} stroke={cor.garanca} strokeWidth={3.4 / s} strokeDasharray={`${11 / s} ${8 / s}`} />
          {linha("M -20 390 L 20 426", limitar(e.semFuro * 2 - 0.6), 6, cor.garanca)}
          {linha("M 20 390 L -20 426", limitar(e.semFuro * 2 - 0.9), 6, cor.garanca)}
        </g>
      ) : null}
      {e.furo > 0.01 ? (
        <g>
          <rect x={-22} y={394} width={44 * limitar(e.furo * 1.4)} height={28} fill={cor.papel} />
          {linha("M -22 396 L -22 420", limitar(e.furo * 2), traco.medio)}
          {linha("M 22 396 L 22 420", limitar(e.furo * 2 - 0.5), traco.medio)}
        </g>
      ) : null}
      {/* gotas escorrendo pelo furo */}
      {e.escorre > 0 && e.escorre < 2.2
        ? [0, 0.16, 0.32, 0.48, 0.64, 0.8, 0.96, 1.12].map((d, i) => {
            const k = e.escorre - d;
            if (k < 0 || k > 0.6) return null;
            const y = 432 + k * k * 300;
            return (
              <path
                key={i}
                d={`M 0 ${y - 16} C 9 ${y - 4} 12 ${y + 6} 0 ${y + 13} C -12 ${y + 6} -9 ${y - 4} 0 ${y - 16} Z`}
                fill={cor.agua}
                stroke={cor.aguaTinta}
                strokeWidth={1.8 / s}
                opacity={1 - k / 0.6}
              />
            );
          })
        : null}

      {/* ---- a planta ---- */}
      <g transform={e.espelho ? "scale(-1 1)" : undefined}>
      {e.semFolhas
        ? RAMOS.map((r, i) => <g key={i}>{linha(r.d, 1, traco.medio, cor.folhaTinta)}</g>)
        : RAMOS.map((r, i) => {
            const opacidadeFolhas = e.folhas ?? 1;
            const pRamo = pedaco(0.3 + i * 0.05, 0.35);
            const pFolha = pedaco(0.45 + i * 0.06, 0.4);
            const ang = r.ang + r.queda * e.murcho;
            return (
              <g key={i} opacity={opacidadeFolhas}>
                {linha(r.d, pRamo, traco.medio, cor.folhaTinta)}
                <g transform={`translate(${r.x} ${r.y}) rotate(${ang})`}>
                  <g opacity={e.aguada} filter="url(#aquarela)" style={{ mixBlendMode: "multiply" }}>
                    <path d={folha(r.c, r.l)} transform="translate(3 4)" fill={corFolha} opacity={0.82} />
                  </g>
                  {linha(folha(r.c, r.l), pFolha, traco.medio, cor.tinta)}
                  {nervuras(r.c, r.l).map((n, k) => (
                    <Traco key={k} d={n} p={limitar(pFolha * 1.3 - 0.3)} cor={corNervura} largura={k === 0 ? 2.4 : 1.4} escala={s} />
                  ))}
                </g>
              </g>
            );
          })}
      {/* folha nova */}
      {e.broto > 0.01 && !e.semFolhas ? (
        <g transform={`translate(-24 -250) rotate(${-112 + 20 * (1 - e.broto)}) scale(${0.3 + 0.7 * e.broto})`}>
          <path d={folha(130, 52)} fill={cor.folha} opacity={0.8 * e.broto} filter="url(#aquarela)" />
          {linha(folha(130, 52), e.broto, traco.medio)}
          {linha("M 0 0 L 124 0", e.broto, 2, cor.folhaTinta)}
        </g>
      ) : null}
      </g>
    </g>
  );
};

// Pontos do vaso que as etiquetas apontam (coordenadas locais)
export const ALVOS_VASO: Record<string, { x: number; y: number }> = {
  folha: { x: 200, y: -170 },
  caule: { x: 6, y: -40 },
  terra: { x: -150, y: 110 },
  raiz: { x: 130, y: 300 },
  agua: { x: -120, y: 330 },
  vaso: { x: 236, y: 220 },
  fundo: { x: -100, y: 400 },
  furo: { x: 0, y: 410 },
};
