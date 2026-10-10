// A coluna vista de frente (chapa AP): vértebras empilhadas, costelas, clavículas, ombros e pelve
// em traço luminoso. É o raio-x de QUALQUER assunto: cada item da fala fica preso a uma vértebra
// (o problema acende em vermelho; o conserto, em ciano com ✓). Desalinhada (em S, ombros e pelve
// inclinados) enquanto há tensão; no `alinha`, ela se endireita e a linha de prumo se desenha.
import { interpolateColors } from "remotion";
import { prog, troca } from "../anim";
import { medir } from "../medidas";
import type { ItemDoRaioX } from "../plano";
import { cor, marcacao } from "../tema";
import { camera, type Proj } from "./Desenho";
import { PontoDeTensao } from "./Cena";
import { girar, soma, type V, v, vezes } from "./pose";

const P = (p: V) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

// O recorte da chapa AP (cm): da sínfise púbica à base do crânio
export const RECORTE_FRENTE = { x0: -19.5, x1: 19.5, y0: -15.5, y1: 62.5 };

type Nivel = "l" | "t" | "c";
type Vertebra = { nivel: Nivel; nome: string; y: number; h: number; w: number };

// de baixo para cima: L5…L1, T12…T1, C7…C2
const VERTEBRAS: Vertebra[] = (() => {
  const lista: Vertebra[] = [];
  let y = 0;
  const empilha = (nivel: Nivel, n: number, h: number, gap: number, w0: number, w1: number, prefixo: string, primeiro: number) => {
    for (let i = 0; i < n; i++) {
      const w = w0 + ((w1 - w0) * i) / Math.max(1, n - 1);
      lista.push({ nivel, nome: `${prefixo}${primeiro - i}`, y: y + h / 2, h, w });
      y += h + gap;
    }
  };
  empilha("l", 5, 2.7, 0.9, 4.9, 4.4, "L", 5);
  empilha("t", 12, 1.95, 0.55, 4.0, 2.9, "T", 12);
  empilha("c", 6, 1.3, 0.48, 2.6, 2.4, "C", 7);
  return lista;
})();
const TOPO = VERTEBRAS[VERTEBRAS.length - 1].y + 0.8;

// desvio lateral da coluna (cm) na altura y: um S (lombar para um lado, torácica para o outro)
const AMPLITUDE = 3.1;
const desvio = (y: number, erro: number) => {
  const u = Math.min(1, Math.max(0, (y - 1) / (TOPO - 3)));
  return erro * AMPLITUDE * Math.sin(2 * Math.PI * u) * (0.75 + 0.25 * Math.sin(Math.PI * u));
};
const inclinacao = (y: number, erro: number) => {
  const d = 0.5;
  return (Math.atan2(desvio(y + d, erro) - desvio(y - d, erro), 2 * d) * 180) / Math.PI;
};

// índice da vértebra onde fica cada item (de cima para baixo: cervical → lombar)
export const vertebraDoItem = (i: number, n: number) => {
  const cima = VERTEBRAS.findIndex((x) => x.nome === "C5");
  const baixo = VERTEBRAS.findIndex((x) => x.nome === "L3");
  if (n <= 1) return Math.round((cima + baixo) / 2);
  return Math.round(cima + ((baixo - cima) * i) / (n - 1));
};

// onde está a vértebra k (cm) com o erro atual
export const centroDaVertebra = (k: number, erro: number): V => {
  const vt = VERTEBRAS[k];
  return v(desvio(vt.y, erro), vt.y);
};
export const larguraDaVertebra = (k: number) => VERTEBRAS[k].w;

// ---------- desenho ----------

const Vertebras: React.FC<{ proj: Proj; s: number; erro: number; lw: number }> = ({ proj, s, erro, lw }) => (
  <g strokeWidth={lw}>
    {VERTEBRAS.map((vt, i) => {
      const c = v(desvio(vt.y, erro), vt.y);
      const a = inclinacao(vt.y, erro);
      const ex = girar(v(1, 0), -a);
      const ey = girar(v(0, 1), -a);
      const L = (x: number, y: number) => proj(soma(c, soma(vezes(ex, x), vezes(ey, y))));
      const w = vt.w / 2;
      const h = vt.h / 2;
      const r = Math.min(w, h) * 0.35;
      // corpo da vértebra (cantos arredondados), pedículos e processos transversos
      const corpo = `M ${P(L(-w + r, h))} L ${P(L(w - r, h))} Q ${P(L(w, h))} ${P(L(w, h - r))} L ${P(L(w, -h + r))} Q ${P(L(w, -h))} ${P(L(w - r, -h))} L ${P(L(-w + r, -h))} Q ${P(L(-w, -h))} ${P(L(-w, -h + r))} L ${P(L(-w, h - r))} Q ${P(L(-w, h))} ${P(L(-w + r, h))} Z`;
      const tp = vt.nivel === "l" ? 2.1 : vt.nivel === "t" ? 1.5 : 1.0;
      const ped = Math.max(0.28, vt.h * 0.2);
      return (
        <g key={i}>
          <path d={corpo} strokeLinejoin="round" />
          <ellipse cx={L(-w * 0.55, 0.1).x} cy={L(-w * 0.55, 0.1).y} rx={ped * s} ry={ped * 1.3 * s} fill="none" strokeWidth={lw * 0.7} opacity={0.75} />
          <ellipse cx={L(w * 0.55, 0.1).x} cy={L(w * 0.55, 0.1).y} rx={ped * s} ry={ped * 1.3 * s} fill="none" strokeWidth={lw * 0.7} opacity={0.75} />
          <path fill="none" d={`M ${P(L(-w, -h * 0.1))} L ${P(L(-w - tp, -h * 0.3))} M ${P(L(w, -h * 0.1))} L ${P(L(w + tp, -h * 0.3))}`} />
          {/* processo espinhoso, visto através do corpo */}
          <path fill="none" d={`M ${P(L(0, -h * 0.15))} L ${P(L(0, -h - 0.25))}`} strokeWidth={lw * 0.7} opacity={0.6} />
        </g>
      );
    })}
  </g>
);

const Costelas: React.FC<{ proj: Proj; erro: number; lw: number }> = ({ proj, erro, lw }) => {
  const toracicas = VERTEBRAS.filter((x) => x.nivel === "t").reverse(); // T1 primeiro
  const alcance = [6.6, 9.4, 11.0, 12.2, 13.0, 13.5, 13.7, 13.5, 13.0, 12.2];
  return (
    <g fill="none" strokeWidth={lw * 0.8} opacity={0.62}>
      {toracicas.slice(0, 10).flatMap((vt, k) =>
        [-1, 1].map((lado) => {
          const xv = desvio(vt.y, erro);
          const R = alcance[k] + lado * erro * 0.5 * (k / 9);
          const y0 = vt.y;
          const a = v(xv + lado * (vt.w / 2 + 0.9), y0 + 0.2);
          const c1 = v(xv + lado * R * 0.42, y0 + 1.6);
          const c2 = v(xv + lado * R * 1.02, y0 + 0.4);
          const b = v(xv + lado * R, y0 - 2.6 - 0.32 * k);
          const fim = v(xv + lado * R * 0.82, y0 - 5.6 - 0.45 * k);
          return <path key={`${k}${lado}`} d={`M ${P(proj(a))} C ${P(proj(c1))} ${P(proj(c2))} ${P(proj(b))} Q ${P(proj(v(xv + lado * R * 0.98, y0 - 4.6 - 0.4 * k)))} ${P(proj(fim))}`} />;
        }),
      )}
    </g>
  );
};

const Ombros: React.FC<{ proj: Proj; s: number; erro: number; lw: number }> = ({ proj, s, erro, lw }) => {
  const t1 = VERTEBRAS.find((x) => x.nome === "T1")!;
  const xv = desvio(t1.y, erro);
  const inclina = erro * 1.6;
  return (
    <g strokeWidth={lw}>
      {[-1, 1].map((lado) => {
        const dy = lado * inclina;
        const a = v(xv + lado * 1.5, t1.y + 1.2);
        const b = v(lado * 15.2, t1.y + 2.3 + dy);
        const cabeca = v(lado * 17.3, t1.y - 0.4 + dy);
        const umero = v(lado * 18.8, t1.y - 11 + dy);
        const escapula = [v(lado * 8.6, t1.y + 0.4 + dy * 0.6), v(lado * 15.4, t1.y + 0.8 + dy), v(lado * 10.4, t1.y - 13 + dy * 0.5)];
        return (
          <g key={lado}>
            {/* clavícula em S */}
            <path fill="none" d={`M ${P(proj(a))} C ${P(proj(v(xv + lado * 6, t1.y + 0.6)))} ${P(proj(v(lado * 10.5, t1.y + 3.4 + dy)))} ${P(proj(b))}`} strokeWidth={lw * 1.15} />
            {/* cabeça do úmero e o começo do braço */}
            <circle cx={proj(cabeca).x} cy={proj(cabeca).y} r={2.5 * s} />
            <path fill="none" d={`M ${P(proj(v(lado * 16.2, t1.y - 2.4 + dy)))} L ${P(proj(v(lado * 17.6, umero.y - 0)))} M ${P(proj(v(lado * 19.4, t1.y - 1.8 + dy)))} L ${P(proj(umero))}`} />
            {/* escápula, apagada atrás das costelas */}
            <path fill="none" opacity={0.4} strokeWidth={lw * 0.8} d={`M ${escapula.map((p) => P(proj(p))).join(" L ")} Z`} strokeLinejoin="round" />
          </g>
        );
      })}
    </g>
  );
};

const Pelve: React.FC<{ proj: Proj; s: number; erro: number; lw: number }> = ({ proj, s, erro, lw }) => {
  const xs = desvio(0, erro);
  const ang = -erro * 2.4;
  const ex = girar(v(1, 0), -ang);
  const ey = girar(v(0, 1), -ang);
  const L = (x: number, y: number) => proj(soma(v(xs, -3.5), soma(vezes(ex, x), vezes(ey, y + 3.5))));
  return (
    <g strokeWidth={lw}>
      {/* sacro */}
      <path d={`M ${P(L(-3.3, -0.4))} L ${P(L(3.3, -0.4))} C ${P(L(3.0, -4))} ${P(L(1.6, -7.8))} ${P(L(0, -9.6))} C ${P(L(-1.6, -7.8))} ${P(L(-3.0, -4))} ${P(L(-3.3, -0.4))} Z`} />
      {[-1, 1].map((lado) => {
        const X = (x: number) => lado * x;
        return (
          <g key={lado}>
            {/* asa do ilíaco */}
            <path
              d={`M ${P(L(X(3.4), -0.6))} C ${P(L(X(5), 3.6))} ${P(L(X(10.5), 5.2))} ${P(L(X(13.6), 2.2))} C ${P(L(X(15.2), 0.2))} ${P(L(X(14.4), -3.4))} ${P(L(X(13.0), -4.6))} C ${P(L(X(12.0), -6.2))} ${P(L(X(11.2), -7.6))} ${P(L(X(10.6), -8.0))} C ${P(L(X(8.6), -7.4))} ${P(L(X(5.6), -6.0))} ${P(L(X(3.2), -5.4))} Z`}
            />
            {/* acetábulo, cabeça e colo do fêmur */}
            <circle cx={L(X(9.9), -9.6).x} cy={L(X(9.9), -9.6).y} r={2.5 * s} />
            <path fill="none" d={`M ${P(L(X(11.6), -10.6))} L ${P(L(X(14.2), -13.4))} M ${P(L(X(10.4), -12.0))} L ${P(L(X(12.4), -15.4))}`} />
            {/* ramo do púbis até a sínfise e o forame */}
            <path fill="none" d={`M ${P(L(X(8.2), -8.4))} C ${P(L(X(5.6), -9.4))} ${P(L(X(2.6), -10.6))} ${P(L(X(1.0), -12.0))} L ${P(L(X(1.0), -14.6))}`} />
            <ellipse cx={L(X(6.0), -12.6).x} cy={L(X(6.0), -12.6).y} rx={2.1 * s} ry={1.5 * s} fill="none" strokeWidth={lw * 0.8} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

// base do crânio e mandíbula, cortadas pela borda da chapa
const Cranio: React.FC<{ proj: Proj; erro: number; lw: number }> = ({ proj, erro, lw }) => {
  const xc = desvio(TOPO, erro);
  const L = (x: number, y: number) => proj(v(xc + x, y));
  return (
    <g fill="none" strokeWidth={lw} opacity={0.85}>
      <path d={`M ${P(L(-6.2, 63.5))} C ${P(L(-6.0, 60.6))} ${P(L(-4.2, 58.6))} ${P(L(0, 58.2))} C ${P(L(4.2, 58.6))} ${P(L(6.0, 60.6))} ${P(L(6.2, 63.5))}`} />
      <path d={`M ${P(L(-9.2, 63.5))} C ${P(L(-8.6, 61.4))} ${P(L(-7.6, 60.6))} ${P(L(-6.4, 60.4))} M ${P(L(9.2, 63.5))} C ${P(L(8.6, 61.4))} ${P(L(7.6, 60.6))} ${P(L(6.4, 60.4))}`} opacity={0.6} />
    </g>
  );
};

// tecido mole: a silhueta do tronco, bem apagada
const Silhueta: React.FC<{ proj: Proj; s: number; erro: number; id: string }> = ({ proj, s, erro, id }) => {
  const t1 = VERTEBRAS.find((x) => x.nome === "T1")!;
  const dy = erro * 1.6;
  const pts = [v(-5.5, 64), v(-6.2, t1.y + 4), v(-19.5, t1.y + 1 - dy), v(-17, 18), v(-16.5, 4), v(-18, -8), v(-17, -16), v(17, -16), v(18, -8), v(16.5, 4), v(17, 18), v(19.5, t1.y + 1 + dy), v(6.2, t1.y + 4), v(5.5, 64)];
  return (
    <g filter={`url(#nevoa-f-${id})`} opacity={0.07}>
      <defs>
        <filter id={`nevoa-f-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={Math.max(2, s * 1.6)} />
        </filter>
      </defs>
      <path d={`M ${pts.map((p) => P(proj(p))).join(" L ")} Z`} fill="#fff" />
    </g>
  );
};

export const CorpoDeFrente: React.FC<{ proj: Proj; s: number; erro: number; id: string }> = ({ proj, s, erro, id }) => {
  const lw = Math.max(1.1, Math.min(3.2, s * 0.32));
  return (
    <g>
      <defs>
        <filter id={`brilho-f-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={Math.max(1.2, s * 0.5)} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <Silhueta proj={proj} s={s} erro={erro} id={id} />
      <g filter={`url(#brilho-f-${id})`} stroke={cor.osso} fill="rgba(228,244,251,0.10)" strokeLinecap="round" strokeLinejoin="round">
        <Costelas proj={proj} erro={erro} lw={lw} />
        <Ombros proj={proj} s={s} erro={erro} lw={lw} />
        <Pelve proj={proj} s={s} erro={erro} lw={lw} />
        <Cranio proj={proj} erro={erro} lw={lw} />
        <Vertebras proj={proj} s={s} erro={erro} lw={lw} />
      </g>
    </g>
  );
};

// ---------- a cena do raio-x (assinatura em qualquer assunto) ----------

const TAM = 36;
const ESP = 0.04;
const LINHA = TAM * 1.18;

// quebra um texto em mono caixa-alta em até `max` linhas que caibam em `largura`
const quebrarMono = (texto: string, largura: number, tam: number, max: number) => {
  const palavras = texto.toUpperCase().split(/\s+/).filter(Boolean);
  const cabe = (s: string) => medir(s, tam, "mono", ESP) <= largura;
  const linhas: string[] = [];
  for (const w of palavras) {
    const atual = linhas[linhas.length - 1];
    if (atual !== undefined && cabe(`${atual} ${w}`)) linhas[linhas.length - 1] = `${atual} ${w}`;
    else linhas.push(w);
  }
  return linhas.length <= max ? linhas : [...linhas.slice(0, max - 1), linhas.slice(max - 1).join(" ")];
};

// etiqueta de marcação de filme com várias linhas: esboço antes de ser dita, vermelha na tensão,
// ciano com ✓ quando está certa
export const Etiqueta: React.FC<{
  x: number;
  y: number;
  linhas: string[];
  tam: number;
  aceso: number;
  ok: number;
  // 0 = ciano (o que é certo), 1 = vermelho (tensão)
  tensao: number;
  largura: number;
}> = ({ x, y, linhas, tam, aceso, ok, tensao, largura }) => {
  const corViva = interpolateColors(tensao * (1 - ok), [0, 1], [cor.ciano, cor.tensao]);
  const check = ok > 0.01 ? tam + 8 : 0;
  const alt = linhas.length * tam * 1.18 + 22;
  const borda = aceso > 0 ? corViva : cor.esbocoTraco;
  return (
    <g transform={`translate(0 ${((1 - Math.min(1, aceso * 3)) * 0).toFixed(1)})`}>
      <rect x={x} y={y} width={largura + check} height={alt} rx={6} fill="rgba(3,8,13,0.86)" stroke={borda} strokeOpacity={aceso > 0 ? 0.75 : 1} strokeWidth={aceso > 0 ? 2 : 2} strokeDasharray={aceso > 0 ? undefined : "8 7"} />
      {check ? (
        <path
          d={`M ${x + 14} ${y + alt / 2} l ${tam * 0.22} ${tam * 0.22} l ${tam * 0.42} ${-tam * 0.48}`}
          fill="none"
          stroke={cor.ciano}
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={`${ok} 1`}
        />
      ) : null}
      {linhas.map((l, i) => (
        <text
          key={i}
          x={x + 16 + check}
          y={y + 11 + tam * 0.86 + i * tam * 1.18}
          fill={aceso > 0 ? interpolateColors(Math.min(1, aceso), [0, 1], [cor.texto, corViva]) : cor.texto}
          opacity={0.2 + 0.8 * Math.min(1, aceso)}
          style={{ ...marcacao, fontSize: tam, letterSpacing: `${ESP}em` }}
        >
          {l}
        </text>
      ))}
    </g>
  );
};

// estados de um item no instante t
const estadoDoItem = (it: ItemDoRaioX, t: number, alinhaEm?: number) => {
  const aceso = prog(t, it.em, 0.35);
  const ehOk = it.tipo === "ok";
  const apagaEm = ehOk ? it.em : (it.apagaEm ?? alinhaEm);
  const ok = apagaEm !== undefined ? prog(t, apagaEm + (ehOk ? 0.15 : 0), 0.5) : 0;
  return { aceso, ok, tensao: ehOk ? 0 : 1 };
};

// o quanto a coluna está fora do eixo agora (1 = em S; 0 = alinhada). A tensão não mexe na coluna;
// cada item "ok" endireita um pedaço; o `alinha` endireita o resto.
export const erroNoTempo = (itens: ItemDoRaioX[], alinhaEm: number | undefined, t: number) => {
  const oks = itens.filter((i) => i.tipo === "ok");
  if (!itens.length && alinhaEm === undefined) return 0;
  const passos = oks.length + (alinhaEm !== undefined ? 1 : 0);
  const feito = passos ? oks.reduce((a, i) => a + prog(t, i.em + 0.1, 0.9, troca), 0) / passos : 0;
  const alinhado = alinhaEm !== undefined ? prog(t, alinhaEm, 1.1, troca) : 0;
  return Math.max(0, (1 - feito) * (1 - alinhado));
};

export const CenaColuna: React.FC<{
  itens: ItemDoRaioX[];
  alinha?: { em: number; texto?: string };
  t: number;
  largura: number;
  altura: number;
  id: string;
  // miniatura: só o desenho e os pontos, sem etiquetas
  miniatura?: boolean;
}> = ({ itens, alinha, t, largura, altura, id, miniatura }) => {
  const n = Math.max(1, Math.min(5, itens.length));
  const lista = itens.slice(0, 5);
  // o corpo ocupa a faixa da esquerda; as etiquetas, a da direita
  const faixa = miniatura ? largura : Math.round(largura * 0.4);
  const cam = camera(RECORTE_FRENTE, faixa, altura);
  const { s } = cam;
  const proj: Proj = (p) => cam.proj(p);
  const erro = erroNoTempo(lista, alinha?.em, t);
  const pontos = lista.map((_, i) => {
    const k = vertebraDoItem(i, n);
    const c = proj(centroDaVertebra(k, erro));
    return { c, borda: c.x + (larguraDaVertebra(k) / 2) * s + 6 };
  });

  // etiquetas: coluna da direita, cada uma o mais perto possível da altura da sua vértebra
  const x0 = faixa + 24;
  const larguraTexto = Math.max(200, Math.min(largura - 70 - x0 - 32, 540));
  const caixas = lista.map((it) => {
    const linhas = quebrarMono(it.texto, larguraTexto - 32 - TAM - 8, TAM, 3);
    const largura = Math.max(...linhas.map((l) => medir(l, TAM, "mono", ESP))) + 32;
    return { linhas, largura, alt: linhas.length * LINHA + 22 };
  });
  const tagAlinha = alinha?.texto ? { linhas: quebrarMono(alinha.texto, larguraTexto - 32 - TAM - 8, TAM, 2) } : null;
  const altAlinha = tagAlinha ? tagAlinha.linhas.length * LINHA + 22 : 0;
  const limiteBaixo = altura - 18 - (tagAlinha ? altAlinha + 22 : 0);
  const ys: number[] = [];
  const GAP = 16;
  caixas.forEach((c, i) => {
    const desejado = pontos[i].c.y - c.alt / 2;
    ys.push(Math.max(i ? ys[i - 1] + caixas[i - 1].alt + GAP : 16, desejado));
  });
  // empurra para cima o que passou do limite de baixo
  for (let i = caixas.length - 1; i >= 0; i--) {
    const teto = i === caixas.length - 1 ? limiteBaixo - caixas[i].alt : ys[i + 1] - GAP - caixas[i].alt;
    ys[i] = Math.max(16, Math.min(ys[i], teto));
  }

  const prumo = alinha ? prog(t, alinha.em + 0.2, 0.6) : 0;
  const yTopo = proj(v(0, TOPO + 1)).y;
  const yBase = proj(v(0, -6)).y;
  const xPrumo = proj(v(0, 0)).x;

  return (
    <svg width={largura} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id={`luz-${id}`} filterUnits="userSpaceOnUse" x={-60} y={-60} width={largura + 120} height={altura + 120}>
          <feGaussianBlur stdDeviation={3.2} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <CorpoDeFrente proj={proj} s={s} erro={erro} id={id} />
      {/* linha de prumo: o eixo certo, que se desenha no conserto */}
      {prumo > 0 ? (
        <line x1={xPrumo} y1={yTopo} x2={xPrumo} y2={yTopo + (yBase - yTopo) * prumo} stroke={cor.ciano} strokeWidth={Math.max(2.5, s * 0.36)} strokeDasharray="14 10" filter={`url(#luz-${id})`} />
      ) : null}
      {lista.map((it, i) => {
        const e = estadoDoItem(it, t, alinha?.em);
        if (e.aceso <= 0) return null;
        // a tensão pulsa em vermelho e apaga para o ciano; o que é certo entra já em ciano
        return it.tipo === "ok" ? (
          <circle key={i} cx={pontos[i].c.x} cy={pontos[i].c.y} r={Math.max(8, s * 1.1)} fill={cor.ciano} opacity={e.aceso} filter={`url(#luz-${id})`} />
        ) : (
          <PontoDeTensao key={i} c={pontos[i].c} t={t} em={it.em} apagaEm={it.apagaEm ?? alinha?.em} raio={miniatura ? Math.max(5, s * 1.3) : Math.max(10, s * 1.25)} id={id} />
        );
      })}
      {miniatura
        ? null
        : lista.map((it, i) => {
            const e = estadoDoItem(it, t, alinha?.em);
            const cx = caixas[i];
            const y = ys[i];
            const corFio = e.aceso > 0 ? interpolateColors(e.tensao * (1 - e.ok), [0, 1], [cor.ciano, cor.tensao]) : cor.esbocoTraco;
            const meio = y + cx.alt / 2;
            return (
              <g key={`e${i}`}>
                <path
                  d={`M ${pontos[i].borda.toFixed(1)} ${pontos[i].c.y.toFixed(1)} L ${(x0 - 26).toFixed(1)} ${pontos[i].c.y.toFixed(1)} L ${x0} ${meio.toFixed(1)}`}
                  fill="none"
                  stroke={corFio}
                  strokeWidth={2}
                  opacity={e.aceso > 0 ? 0.8 : 0.6}
                  strokeDasharray={e.aceso > 0 ? undefined : "6 7"}
                />
                <Etiqueta x={x0} y={y} linhas={cx.linhas} tam={TAM} aceso={e.aceso} ok={e.ok} tensao={e.tensao} largura={cx.largura} />
              </g>
            );
          })}
      {!miniatura && tagAlinha && alinha ? (
        <g opacity={prog(t, alinha.em + 0.35, 0.35)}>
          <path d={`M ${xPrumo} ${yBase} L ${xPrumo} ${altura - 18 - altAlinha / 2} L ${x0} ${altura - 18 - altAlinha / 2}`} fill="none" stroke={cor.ciano} strokeWidth={2} opacity={0.8} />
          <Etiqueta x={x0} y={altura - 18 - altAlinha} linhas={tagAlinha.linhas} tam={TAM} aceso={1} ok={prog(t, alinha.em + 0.5, 0.4)} tensao={0} largura={Math.max(...tagAlinha.linhas.map((l) => medir(l, TAM, "mono", ESP))) + 32} />
        </g>
      ) : null}
    </svg>
  );
};
