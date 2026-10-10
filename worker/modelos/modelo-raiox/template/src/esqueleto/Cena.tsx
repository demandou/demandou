// A cena da chapa: o esqueleto à mesa na postura do instante, os móveis e as anotações (pontos de
// tensão, linhas de alinhamento, arcos de ângulo, apoios, distâncias e rótulos), em px.
import { interpolateColors } from "remotion";
import { prog, troca } from "../anim";
import { medir } from "../medidas";
import type { Alvo, Parte, Passo, Vista } from "../plano";
import { cor, marcacao } from "../tema";
import { Cadeira, Chao, camera, centroDaTela, Mesa, Ossos, type Proj, type Recorte, Tecido } from "./Desenho";
import { anguloEntre, type Juntas, juntas, MESA, MONITOR, menos, type Progresso, posturaNaMesa, soma, TUDO_CERTO, unit, type V, v, vezes } from "./pose";

export const RECORTES: Record<Vista, Recorte> = {
  tela: { x0: -26, x1: 100, y0: 56, y1: 143 },
  pernas: { x0: -30, x1: 80, y0: -4, y1: 86 },
  bracos: { x0: -26, x1: 74, y0: 52, y1: 140 },
  coluna: { x0: -38, x1: 58, y0: 30, y1: 146 },
  inteiro: { x0: -34, x1: 102, y0: -4, y1: 146 },
};

// Onde fica cada alvo (cm)
export const posicaoDoAlvo = (alvo: Alvo, j: Juntas, telaP: number): V => {
  switch (alvo) {
    case "tela":
      return centroDaTela(telaP).centro;
    case "olhos":
      return j.olho;
    case "pescoco":
      return j.pontoPescoco;
    case "ombro":
      return j.pontoOmbro;
    case "cotovelo":
      return j.braco.cotovelo;
    case "punho":
      return j.braco.punho;
    case "lombar":
      return j.pontoLombar;
    case "quadril":
      return j.quadril;
    case "joelho":
      return j.perna.joelho;
    case "tornozelo":
      return j.perna.tornozelo;
    case "pes":
      return j.perna.planta;
  }
};

// Para onde vai o rótulo de cada alvo (px a partir do alvo) e de que lado ele cresce
const LADO_DO_ROTULO: Record<Alvo, { dx: number; dy: number; alinhar: "esquerda" | "direita" | "centro" }> = {
  tela: { dx: 0, dy: -62, alinhar: "centro" },
  olhos: { dx: -40, dy: -70, alinhar: "direita" },
  pescoco: { dx: -64, dy: -46, alinhar: "direita" },
  ombro: { dx: -70, dy: -64, alinhar: "direita" },
  cotovelo: { dx: -56, dy: 70, alinhar: "direita" },
  punho: { dx: 30, dy: -70, alinhar: "esquerda" },
  lombar: { dx: -60, dy: 50, alinhar: "direita" },
  quadril: { dx: -50, dy: 70, alinhar: "direita" },
  joelho: { dx: 56, dy: -70, alinhar: "esquerda" },
  tornozelo: { dx: 60, dy: -60, alinhar: "esquerda" },
  pes: { dx: 70, dy: -78, alinhar: "esquerda" },
};

const TAM_ROTULO = 32;
const ESPACO = 0.06;

// Etiqueta de marcação com fio até o alvo; nunca sai da chapa
export const Rotulo: React.FC<{
  ancora: V;
  texto: string;
  alvo: Alvo | "linha";
  p: number;
  corTexto: string;
  largura: number;
  altura: number;
  ok?: number;
  desloca?: { dx: number; dy: number; alinhar: "esquerda" | "direita" | "centro" };
}> = ({ ancora, texto, alvo, p, corTexto, largura, altura, ok = 0, desloca }) => {
  if (p <= 0.01) return null;
  const lado = desloca ?? (alvo === "linha" ? { dx: 0, dy: -50, alinhar: "centro" as const } : LADO_DO_ROTULO[alvo]);
  const check = ok > 0.01 ? 40 : 0;
  const w = medir(texto.toUpperCase(), TAM_ROTULO, "mono", ESPACO) + 28 + check;
  const h = TAM_ROTULO + 20;
  let x = ancora.x + lado.dx - (lado.alinhar === "direita" ? w : lado.alinhar === "centro" ? w / 2 : 0);
  let y = ancora.y + lado.dy - h / 2;
  // dentro da chapa, longe da borda direita (botões do app)
  x = Math.max(14, Math.min(largura - 70 - w, x));
  y = Math.max(12, Math.min(altura - h - 12, y));
  const cx = Math.max(x, Math.min(x + w, ancora.x));
  const cy = Math.max(y, Math.min(y + h, ancora.y));
  const fio = Math.hypot(cx - ancora.x, cy - ancora.y) > 6;
  return (
    <g opacity={p} transform={`translate(0 ${((1 - p) * 8).toFixed(1)})`}>
      {fio ? <line x1={ancora.x} y1={ancora.y} x2={cx} y2={cy} stroke={corTexto} strokeWidth={2} opacity={0.75} /> : null}
      <rect x={x} y={y} width={w} height={h} rx={6} fill="rgba(3,8,13,0.86)" stroke={corTexto} strokeOpacity={0.55} strokeWidth={1.5} />
      {check ? (
        <path
          d={`M ${x + 16} ${y + h / 2} l 7 7 l 13 -15`}
          fill="none"
          stroke={cor.ciano}
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={`${ok} 1`}
        />
      ) : null}
      <text
        x={x + 14 + check}
        y={y + h / 2 + TAM_ROTULO * 0.36}
        fill={corTexto}
        style={{ ...marcacao, fontSize: TAM_ROTULO, letterSpacing: `${ESPACO}em` }}
      >
        {texto.toUpperCase()}
      </text>
    </g>
  );
};

// Ponto de tensão: acende em vermelho e pulsa; quando é corrigido, apaga para o ciano e para de pulsar
export const PontoDeTensao: React.FC<{ c: V; t: number; em: number; apagaEm?: number; raio?: number; id: string }> = ({ c, t, em, apagaEm, raio = 12, id }) => {
  const acende = prog(t, em, 0.35);
  if (acende <= 0) return null;
  const apaga = apagaEm !== undefined ? prog(t, apagaEm, 0.5) : 0;
  const corP = interpolateColors(apaga, [0, 1], [cor.tensao, cor.ciano]);
  const fase = ((t - em) % 0.95) / 0.95;
  return (
    <g opacity={acende}>
      <circle cx={c.x} cy={c.y} r={raio * (1 + 2.6 * fase)} fill="none" stroke={cor.tensao} strokeWidth={2.5} opacity={(1 - fase) * 0.85 * (1 - apaga)} />
      <circle cx={c.x} cy={c.y} r={raio * 2.2} fill={corP} opacity={0.22 * (1 - apaga * 0.7)} filter={`url(#luz-${id})`} />
      <circle cx={c.x} cy={c.y} r={raio * (1 - 0.35 * apaga)} fill={corP} filter={`url(#luz-${id})`} />
    </g>
  );
};

// progresso de cada parte no instante t, para a chapa de um ajuste
export const progressoNoAjuste = (passos: Passo[], t: number, erradas: Parte[]): Progresso => {
  const pr: Progresso = { ...TUDO_CERTO };
  for (const p of erradas) pr[p] = 0;
  for (const p of passos) if (p.tipo === "corrige") pr[p.parte] = prog(t, p.em, p.dur ?? 0.9, troca);
  return pr;
};

export const CenaAjuste: React.FC<{
  vista: Vista;
  passos: Passo[];
  // partes que ainda estão erradas nesta chapa (corrigidas só em chapas seguintes)
  erradas: Parte[];
  // o antebraço segue o cotovelo quando o plano não corrige o antebraço em separado
  antebracoSegue: boolean;
  t: number;
  largura: number;
  altura: number;
  id: string;
  // miniatura: sem rótulos nem animação de anotações
  miniatura?: boolean;
}> = ({ vista, passos, erradas, antebracoSegue, t, largura, altura, id, miniatura }) => {
  const r = RECORTES[vista];
  const { s, proj, cena } = camera(r, largura, altura);
  const pr = progressoNoAjuste(passos, t, erradas);
  if (antebracoSegue) pr.antebraco = pr.cotovelo;
  const j = juntas(posturaNaMesa(pr));
  const esq = cena(v(0, 0)).x;
  const dir = cena(v(largura, 0)).x;
  return (
    <svg width={largura} height={altura} style={{ position: "absolute", inset: 0 }}>
      <defs>
        {/* região em px: linha reta (altura ou largura zero) com filtro relativo à própria caixa some */}
        <filter id={`luz-${id}`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={largura + 120} height={altura + 120}>
          <feGaussianBlur stdDeviation={3.2} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <Chao proj={proj} x0={esq - 5} x1={dir + 5} s={s} id={id} />
      <Cadeira proj={proj} s={s} />
      <Mesa proj={proj} s={s} telaP={pr.tela} teclado={j.braco.punho.x} brilhoTela={brilhoDaTela(passos, t)} />
      <Tecido j={j} proj={proj} s={s} id={id} />
      <Ossos j={j} proj={proj} s={s} id={id} />
      {miniatura ? null : <Anotacoes passos={passos} j={j} pr={pr} t={t} proj={proj} s={s} largura={largura} altura={altura} id={id} />}
    </svg>
  );
};

const brilhoDaTela = (passos: Passo[], t: number) => {
  const d = passos.find((p) => p.tipo === "destaque" && p.alvo === "tela");
  return d ? prog(t, d.em, 0.4) : 0;
};

const Anotacoes: React.FC<{ passos: Passo[]; j: Juntas; pr: Progresso; t: number; proj: Proj; s: number; largura: number; altura: number; id: string }> = ({
  passos,
  j,
  pr,
  t,
  proj,
  s,
  largura,
  altura,
  id,
}) => {
  const camadas: React.ReactNode[] = [];
  const rotulos: React.ReactNode[] = [];
  const linha = Math.max(2.5, s * 0.36);
  passos.forEach((p, i) => {
    const k = `${p.tipo}-${i}`;
    if (p.tipo === "linha" && p.linha === "olhos") {
      const tela = centroDaTela(pr.tela);
      const a = proj(soma(j.olho, v(-3, 0)));
      const b = proj(v(MONITOR.x + 8, j.olho.y));
      const q = prog(t, p.em, 0.55);
      // direção do olhar (cabeça inclinada olha para baixo)
      const olhar = v(Math.cos((-j.cabeca * Math.PI) / 180), Math.sin((-j.cabeca * Math.PI) / 180));
      const alcance = (MONITOR.x - j.olho.x) / Math.max(0.2, olhar.x);
      const alvoOlhar = proj(soma(j.olho, vezes(olhar, alcance)));
      const naTela = alvoOlhar.y >= proj(v(0, tela.topo)).y - 4 && alvoOlhar.y <= proj(v(0, tela.base)).y + 4;
      camadas.push(
        <g key={k} opacity={q}>
          <line x1={proj(j.olho).x} y1={proj(j.olho).y} x2={alvoOlhar.x} y2={alvoOlhar.y} stroke={cor.osso} strokeWidth={2} opacity={0.55} strokeDasharray="2 7" />
          <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * q} y2={b.y} stroke={cor.ciano} strokeWidth={linha} strokeDasharray="14 10" filter={`url(#luz-${id})`} />
          <circle cx={proj(j.olho).x} cy={proj(j.olho).y} r={7} fill={cor.ciano} filter={`url(#luz-${id})`} />
          {naTela && q >= 1 ? <circle cx={alvoOlhar.x} cy={alvoOlhar.y} r={7} fill={cor.ciano} filter={`url(#luz-${id})`} /> : null}
        </g>,
      );
      if (p.rotulo) rotulos.push(<Rotulo key={`r${k}`} ancora={v(b.x - 10, b.y)} texto={p.rotulo} alvo="linha" p={prog(t, p.em + 0.3, 0.35)} corTexto={cor.ciano} largura={largura} altura={altura} desloca={{ dx: 0, dy: 44, alinhar: "direita" }} />);
    }
    if (p.tipo === "linha" && p.linha === "prumo") {
      const q = prog(t, p.em, 0.6);
      const x = proj(j.ombro).x;
      const y0 = proj(soma(j.ombro, v(0, -10))).y;
      const y1 = proj(soma(j.ombro, v(0, 38))).y;
      const orelha = proj(j.orelha);
      const desvio = Math.abs(j.orelha.x - j.ombro.x);
      const alinhado = desvio < 3.5;
      camadas.push(
        <g key={k} opacity={Math.min(1, q * 2)}>
          <line x1={x} y1={y0} x2={x} y2={y0 + (y1 - y0) * q} stroke={cor.ciano} strokeWidth={linha} strokeDasharray="14 10" filter={`url(#luz-${id})`} />
          {!alinhado && q > 0.6 ? (
            <g opacity={Math.min(1, (desvio - 3.5) / 3)}>
              <line x1={x} y1={orelha.y} x2={orelha.x - 10} y2={orelha.y} stroke={cor.tensao} strokeWidth={2.5} />
              <path d={`M ${orelha.x - 22} ${orelha.y - 8} L ${orelha.x - 10} ${orelha.y} L ${orelha.x - 22} ${orelha.y + 8}`} fill="none" stroke={cor.tensao} strokeWidth={2.5} />
            </g>
          ) : null}
          <circle cx={orelha.x} cy={orelha.y} r={Math.max(9, s * 1.5)} fill="none" stroke={alinhado ? cor.ciano : cor.osso} strokeWidth={3} opacity={q} filter={`url(#luz-${id})`} />
          <circle cx={x} cy={proj(j.ombro).y} r={6} fill={cor.ciano} />
        </g>,
      );
      if (p.rotulo) rotulos.push(<Rotulo key={`r${k}`} ancora={v(x, y1)} texto={p.rotulo} alvo="linha" p={prog(t, p.em + 0.35, 0.35)} corTexto={cor.ciano} largura={largura} altura={altura} desloca={{ dx: 18, dy: 6, alinhar: "esquerda" }} />);
    }
    if (p.tipo === "angulo") {
      const [J, A, B] =
        p.alvo === "joelho"
          ? [j.perna.joelho, j.perna.quadril, j.perna.tornozelo]
          : p.alvo === "cotovelo"
            ? [j.braco.cotovelo, j.braco.ombro, j.braco.punho]
            : [j.quadril, j.l1, j.perna.joelho];
      const valor = anguloEntre(menos(A, J), menos(B, J));
      const q = prog(t, p.em, 0.55);
      const conta = prog(t, p.em, 0.75);
      const Jp = proj(J);
      const ua = unit(menos(proj(A), Jp));
      const ub = unit(menos(proj(B), Jp));
      const R = Math.max(54, s * 7.5);
      const a0 = Math.atan2(ua.y, ua.x);
      let a1 = Math.atan2(ub.y, ub.x);
      let delta = a1 - a0;
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      a1 = a0 + delta * q;
      const pa = soma(Jp, vezes(v(Math.cos(a0), Math.sin(a0)), R));
      const pb = soma(Jp, vezes(v(Math.cos(a1), Math.sin(a1)), R));
      const sweep = delta > 0 ? 1 : 0;
      const meio = a0 + delta / 2;
      const txt = soma(Jp, vezes(v(Math.cos(meio), Math.sin(meio)), R + 46));
      const reto = Math.abs(valor - 90) < 3 && q >= 1;
      const L = R * 1.75;
      const q2 = R * 0.34;
      camadas.push(
        <g key={k} opacity={Math.min(1, q * 3)}>
          <line x1={Jp.x} y1={Jp.y} x2={Jp.x + ua.x * L * q} y2={Jp.y + ua.y * L * q} stroke={cor.ciano} strokeWidth={2.2} strokeDasharray="8 8" opacity={0.85} />
          <line x1={Jp.x} y1={Jp.y} x2={Jp.x + ub.x * L * q} y2={Jp.y + ub.y * L * q} stroke={cor.ciano} strokeWidth={2.2} strokeDasharray="8 8" opacity={0.85} />
          <path d={`M ${pa.x} ${pa.y} A ${R} ${R} 0 0 ${sweep} ${pb.x} ${pb.y}`} fill="none" stroke={cor.ciano} strokeWidth={linha + 0.6} filter={`url(#luz-${id})`} />
          {reto ? (
            <path
              d={`M ${Jp.x + ua.x * q2} ${Jp.y + ua.y * q2} L ${Jp.x + (ua.x + ub.x) * q2} ${Jp.y + (ua.y + ub.y) * q2} L ${Jp.x + ub.x * q2} ${Jp.y + ub.y * q2}`}
              fill="none"
              stroke={cor.ciano}
              strokeWidth={2.6}
            />
          ) : null}
          <text
            x={txt.x}
            y={txt.y + 16}
            textAnchor="middle"
            fill={cor.ciano}
            style={{ ...marcacao, fontSize: 46, fontWeight: 700, letterSpacing: 0 }}
            filter={`url(#luz-${id})`}
          >
            {`${Math.round(valor * conta)}°`}
          </text>
        </g>,
      );
    }
    if (p.tipo === "apoio") {
      const q = prog(t, p.em, 0.5);
      let a: V;
      let b: V;
      if (p.alvo === "pes") {
        a = v(Math.min(j.perna.calcanhar.x, j.perna2.calcanhar.x) - 6, 0);
        b = v(Math.max(j.perna.dedos.x, j.perna2.dedos.x) + 6, 0);
      } else if (p.alvo === "antebraco") {
        a = v(MESA.frente - 0.5, MESA.topo);
        b = v(j.braco.punho.x + 4, MESA.topo);
      } else {
        a = v(-22, 48);
        b = v(-24, 90);
      }
      const pa = proj(a);
      const pb = proj(b);
      camadas.push(
        <g key={k} opacity={q}>
          <line x1={pa.x} y1={pa.y} x2={pa.x + (pb.x - pa.x) * q} y2={pa.y + (pb.y - pa.y) * q} stroke={cor.ciano} strokeWidth={7} strokeLinecap="round" filter={`url(#luz-${id})`} />
        </g>,
      );
      if (p.rotulo)
        rotulos.push(
          <Rotulo
            key={`r${k}`}
            ancora={v((pa.x + pb.x) / 2, (pa.y + pb.y) / 2)}
            texto={p.rotulo}
            alvo="linha"
            p={prog(t, p.em + 0.25, 0.35)}
            corTexto={cor.ciano}
            largura={largura}
            altura={altura}
            desloca={
              p.alvo === "pes"
                ? { dx: 120, dy: -40, alinhar: "esquerda" }
                : p.alvo === "costas"
                  ? { dx: pb.x - (pa.x + pb.x) / 2, dy: pb.y - (pa.y + pb.y) / 2 - 44, alinhar: "centro" }
                  : { dx: 40, dy: 54, alinhar: "esquerda" }
            }
          />,
        );
    }
    if (p.tipo === "distancia") {
      const q = prog(t, p.em, 0.4);
      const xTronco = j.ombro.x + 1.5;
      const gap = j.braco.cotovelo.x - xTronco;
      const vis = q * Math.min(1, Math.max(0, (gap - 2) / 4));
      if (vis > 0.01) {
        const a = proj(v(xTronco, j.braco.cotovelo.y));
        const b = proj(v(j.braco.cotovelo.x - 2.2, j.braco.cotovelo.y));
        camadas.push(
          <g key={k} opacity={vis} stroke={cor.ciano} strokeWidth={2.6} fill="none" strokeLinecap="round">
            <line x1={a.x} y1={a.y - 40} x2={a.x} y2={a.y + 40} strokeDasharray="6 6" />
            <line x1={a.x + 4} y1={a.y} x2={b.x} y2={b.y} />
            <path d={`M ${a.x + 16} ${a.y - 9} L ${a.x + 4} ${a.y} L ${a.x + 16} ${a.y + 9}`} />
            <path d={`M ${b.x - 12} ${b.y - 9} L ${b.x} ${b.y} L ${b.x - 12} ${b.y + 9}`} />
          </g>,
        );
      }
    }
    if (p.tipo === "destaque") {
      const q = prog(t, p.em, 0.45);
      const c = proj(posicaoDoAlvo(p.alvo, j, pr.tela));
      if (p.alvo === "tela") {
        const tela = centroDaTela(pr.tela);
        const a = proj(v(MONITOR.x - 4, tela.topo + 3));
        const b = proj(v(MONITOR.x + 8, tela.base - 3));
        camadas.push(
          <rect
            key={k}
            x={a.x}
            y={a.y}
            width={b.x - a.x}
            height={b.y - a.y}
            rx={10}
            fill="none"
            stroke={cor.ciano}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray={`${q} 1`}
            filter={`url(#luz-${id})`}
          />,
        );
        if (p.rotulo) rotulos.push(<Rotulo key={`r${k}`} ancora={v((a.x + b.x) / 2, a.y)} texto={p.rotulo} alvo="tela" p={prog(t, p.em + 0.15, 0.35)} corTexto={cor.ciano} largura={largura} altura={altura} />);
      } else {
        const R = Math.max(30, s * 4.6);
        camadas.push(
          <circle
            key={k}
            cx={c.x}
            cy={c.y}
            r={R}
            fill="none"
            stroke={cor.ciano}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray={`${q} 1`}
            transform={`rotate(-90 ${c.x} ${c.y})`}
            filter={`url(#luz-${id})`}
          />,
        );
        if (p.rotulo) rotulos.push(<Rotulo key={`r${k}`} ancora={c} texto={p.rotulo} alvo={p.alvo} p={prog(t, p.em + 0.15, 0.35)} corTexto={cor.ciano} largura={largura} altura={altura} />);
      }
    }
    if (p.tipo === "tensao") {
      const c = proj(posicaoDoAlvo(p.alvo, j, pr.tela));
      camadas.push(<PontoDeTensao key={k} c={c} t={t} em={p.em} apagaEm={p.apagaEm} raio={Math.max(10, s * 1.35)} id={id} />);
      if (p.rotulo) {
        const apaga = p.apagaEm !== undefined ? prog(t, p.apagaEm, 0.45) : 0;
        rotulos.push(
          <Rotulo
            key={`r${k}`}
            ancora={c}
            texto={p.rotulo}
            alvo={p.alvo}
            p={prog(t, p.em + 0.12, 0.35)}
            corTexto={interpolateColors(apaga, [0, 1], [cor.tensao, cor.ciano])}
            ok={apaga}
            largura={largura}
            altura={altura}
          />,
        );
      }
    }
  });
  return (
    <g>
      {camadas}
      {rotulos}
    </g>
  );
};
