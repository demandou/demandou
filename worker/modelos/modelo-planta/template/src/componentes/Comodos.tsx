import { limitar, mistura, preciso, prog, Revela, Traco } from "../anim";
import { lin, poli } from "../desenho/geometria";
import type { Regiao } from "../layout";
import type { Comodo } from "../plano";
import { cor, mono, ROTULO, sans, traco } from "../tema";
import { encaixar } from "../texto";

// A ASSINATURA EM QUALQUER ASSUNTO: uma planta baixa em que cada cômodo é uma ideia da fala.
// As paredes se desenham quando a prancha entra; cada cômodo recebe o seu texto quando ele é dito
// (a porta dele abre e a circulação tracejada em terracota anda até ele). Cômodo em `alerta` ganha a
// área hachurada em terracota; `percurso.bloqueado` termina a circulação num × (o caminho trava).
// Sem medidas: a planta é um esquema, marcado "SEM ESCALA".

type Sala = { x: number; y: number; w: number; h: number; linha: number; yRota: number };
type Porta = { x: number; y: number; vertical: boolean; sentido: 1 | -1; abreEm: number };

const PAREDE = 14;
const INTERNA = 8;

// arranjos possíveis (quantos cômodos em cada fileira), para cada quantidade
const ARRANJOS: Record<number, number[][]> = {
  1: [[1]],
  2: [[2], [1, 1]],
  3: [[3], [2, 1], [1, 2]],
  4: [[2, 2], [3, 1]],
  5: [[3, 2], [2, 3]],
  6: [[3, 3], [2, 2, 2]],
};

const escolherArranjo = (n: number, w: number, h: number) => {
  const opcoes = ARRANJOS[Math.min(6, Math.max(1, n))];
  let melhor = opcoes[0];
  let nota = -1;
  for (const a of opcoes) {
    const largura = w / Math.max(...a);
    const altura = h / a.length;
    const s = Math.min(largura / 330, altura / 210) - a.length * 0.01;
    if (s > nota) {
      nota = s;
      melhor = a;
    }
  }
  return melhor;
};

export const Comodos: React.FC<{
  comodos: Comodo[];
  t: number;
  de: number;
  corpo: Regiao;
  bloqueado?: boolean;
  bloqueioEm?: number;
}> = ({ comodos: todos, t, de, corpo, bloqueado, bloqueioEm }) => {
  const comodos = todos.slice(0, 6);
  const n = comodos.length;
  if (!n) return null;
  // a planta: deixa espaço à esquerda para a entrada e embaixo para o "SEM ESCALA"
  const X0 = corpo.x + 58;
  const Y0 = corpo.y + 12;
  const W = corpo.x + corpo.w - 8 - X0;
  const H = Math.min(corpo.y + corpo.h - 56 - Y0, Math.max(420, W * 0.95));
  const arranjo = escolherArranjo(n, W, H);
  const alturaFileira = H / arranjo.length;

  // cômodos em ordem de percurso (serpentina: 1ª fileira → , 2ª ←, …)
  const salas: Sala[] = [];
  arranjo.forEach((c, r) => {
    const w = W / c;
    const ordem = Array.from({ length: c }, (_, k) => (r % 2 === 0 ? k : c - 1 - k));
    for (const k of ordem) {
      if (salas.length >= n) break;
      const y = Y0 + r * alturaFileira;
      salas.push({ x: X0 + k * w, y, w, h: alturaFileira, linha: r, yRota: y + alturaFileira - Math.max(44, Math.min(70, alturaFileira * 0.22)) });
    }
  });

  // percurso: entra pela parede da esquerda do primeiro cômodo, passa pelo meio de cada um
  const porta = Math.min(84, alturaFileira * 0.32);
  const pontos: [number, number][] = [[X0 - 46, salas[0].yRota]];
  const chegadas: number[] = [];
  const portas: Porta[] = [];
  const recortes: { sala: number; x: number }[] = [];
  const comprimento = () => {
    let s = 0;
    for (let i = 1; i < pontos.length; i++) s += Math.hypot(pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]);
    return s;
  };
  salas.forEach((s, i) => {
    const cx = s.x + s.w / 2;
    if (i === 0) {
      pontos.push([cx, s.yRota]);
    } else {
      const a = salas[i - 1];
      if (a.linha === s.linha) {
        // parede vertical entre os dois, porta na altura da rota
        const xw = s.x > a.x ? s.x : a.x;
        portas.push({ x: xw, y: s.yRota, vertical: true, sentido: s.x > a.x ? 1 : -1, abreEm: comodos[i].em - 0.3 });
        pontos.push([cx, s.yRota]);
      } else {
        // desce pela parede entre as fileiras, na sobreposição dos dois cômodos, perto da borda de fora
        const ini = Math.max(a.x, s.x);
        const fim = Math.min(a.x + a.w, s.x + s.w);
        const ladoDireito = s.x + s.w >= X0 + W - 1;
        const xd = ladoDireito ? fim - Math.min(58, (fim - ini) / 2) : ini + Math.min(58, (fim - ini) / 2);
        portas.push({ x: xd, y: s.y, vertical: false, sentido: 1, abreEm: comodos[i].em - 0.3 });
        recortes.push({ sala: i, x: xd });
        pontos.push([xd, a.yRota]);
        pontos.push([xd, s.yRota]);
        pontos.push([cx, s.yRota]);
      }
    }
    chegadas.push(comprimento());
  });

  // quanto da circulação já foi desenhado: chega ao cômodo i quando ele é dito
  let alcance = 0;
  comodos.forEach((c, i) => {
    alcance = mistura(alcance, chegadas[i], prog(t, c.em - 0.45, 0.55, preciso));
  });
  const parcial = (() => {
    const feitos: [number, number][] = [pontos[0]];
    let resta = alcance;
    let dir: [number, number] = [1, 0];
    for (let i = 1; i < pontos.length; i++) {
      const [ax, ay] = pontos[i - 1];
      const [bx, by] = pontos[i];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      dir = [(bx - ax) / len, (by - ay) / len];
      if (resta >= len) {
        feitos.push(pontos[i]);
        resta -= len;
      } else {
        if (resta > 0) feitos.push([ax + dir[0] * resta, ay + dir[1] * resta]);
        break;
      }
    }
    return { feitos, dir };
  })();
  const ultimo = comodos[n - 1];
  const emFim = bloqueioEm ?? ultimo.em + 0.5;
  const pFim = prog(t, emFim, 0.45, preciso);
  const ativo = comodos.reduce((a, c, i) => (t >= c.em - 0.05 ? i : a), -1);

  // paredes
  const pExterna = prog(t, de - 0.05, 0.75, preciso);
  const pInternas = prog(t, de + 0.3, 0.55, preciso);
  const yEntrada = salas[0].yRota;
  const externa = poli([
    [X0, yEntrada - porta / 2],
    [X0, Y0],
    [X0 + W, Y0],
    [X0 + W, Y0 + H],
    [X0, Y0 + H],
    [X0, yEntrada + porta / 2],
  ]);
  // paredes internas com o vão das portas
  const internas: string[] = [];
  arranjo.forEach((c, r) => {
    const y = Y0 + r * alturaFileira;
    // verticais entre os cômodos da fileira
    for (let k = 1; k < c; k++) {
      const x = X0 + (W / c) * k;
      const p = portas.find((pt) => pt.vertical && Math.abs(pt.x - x) < 1 && pt.y > y && pt.y < y + alturaFileira);
      if (p) {
        internas.push(lin(x, y, x, p.y - porta / 2));
        internas.push(lin(x, p.y + porta / 2, x, y + alturaFileira));
      } else internas.push(lin(x, y, x, y + alturaFileira));
    }
    // horizontal entre esta fileira e a de cima
    if (r > 0) {
      const p = portas.find((pt) => !pt.vertical && Math.abs(pt.y - y) < 1);
      if (p) {
        internas.push(lin(X0, y, p.x - porta / 2, y));
        internas.push(lin(p.x + porta / 2, y, X0 + W, y));
      } else internas.push(lin(X0, y, X0 + W, y));
    }
  });

  // texto: o mesmo corpo em todos os cômodos (o maior que cabe em todos)
  const caixas = salas.map((s, i) => {
    const recorte = recortes.find((r) => r.sala === i);
    let x = s.x + 26;
    let w = s.w - 52;
    if (recorte) {
      const esq = recorte.x - 34 - x;
      const dir = s.x + s.w - 26 - (recorte.x + 34);
      if (esq >= dir) w = esq;
      else {
        x = recorte.x + 34;
        w = dir;
      }
    }
    const y = s.y + 24 + ROTULO + 16;
    const h = s.yRota - 30 - y;
    return { x, y, w, h };
  });
  const medir = (max: number) =>
    comodos.map((c, i) => encaixar(c.texto, { largura: caixas[i].w, max, min: 34, linhas: 3, fonte: { peso: 400 } }));
  let max = 66;
  let textos = medir(max);
  while (max > 34 && textos.some((x, i) => x.linhas.length * x.tamanho * 1.1 + (comodos[i].detalhe ? 44 : 0) > caixas[i].h)) {
    max -= 2;
    textos = medir(max);
  }
  const tam = Math.min(...textos.map((x) => x.tamanho));
  const quebras = comodos.map((c, i) => encaixar(c.texto, { largura: caixas[i].w, max: tam, min: Math.min(tam, Math.max(34, Math.round(tam * 0.86))), linhas: 3, fonte: { peso: 400 } }));
  const pLapis = prog(t, de - 0.2, 0.25);
  // o bloco (rótulo + texto + detalhe) fica centrado no cômodo, acima da circulação
  const blocos = caixas.map((c, i) => {
    const alturaTexto = quebras[i].linhas.length * quebras[i].tamanho * 1.1 + (comodos[i].detalhe ? 44 : 0);
    const topo = c.y + Math.max(0, (c.h - alturaTexto) / 2);
    return { topo, alturaTexto, cx: c.x + c.w / 2 };
  });

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* área de alerta: véu e hachura em terracota */}
        {salas.map((s, i) => {
          if (!comodos[i].alerta) return null;
          const p = prog(t, comodos[i].em + 0.05, 0.6, preciso);
          if (p <= 0) return null;
          const ins = 16;
          const w = (s.w - 2 * ins) * p;
          const h = (s.h - 2 * ins) * p;
          const x = s.x + s.w / 2 - w / 2;
          const y = s.y + s.h / 2 - h / 2;
          const hach: string[] = [];
          for (let k = -h; k < w; k += 26) {
            const xa = Math.max(0, k);
            const xb = Math.min(w, k + h);
            if (xb > xa) hach.push(lin(x + xa, y + h - (xa - k), x + xb, y + h - (xb - k)));
          }
          return (
            <g key={`alerta-${i}`}>
              <rect x={x} y={y} width={w} height={h} fill={cor.acentoVeu} stroke={cor.acento} strokeWidth={traco.fino} strokeDasharray="12 9" />
              <path d={hach.join("")} stroke={cor.acento} strokeWidth={traco.fino} opacity={0.22} />
            </g>
          );
        })}
        {/* paredes */}
        <Traco d={externa} p={pExterna} cor={cor.grafite} largura={PAREDE} strokeLinejoin="miter" />
        {internas.map((d, i) => (
          <Traco key={`int-${i}`} d={d} p={pInternas} cor={cor.grafite} largura={INTERNA} />
        ))}
        {/* porta de entrada (abre junto com as paredes) e portas internas (abrem quando o cômodo é dito) */}
        <PortaDesenhada x={X0} y={yEntrada} vertical sentido={1} p={prog(t, de + 0.5, 0.5, preciso)} vao={porta} />
        {portas.map((pt, i) => (
          <PortaDesenhada key={`porta-${i}`} x={pt.x} y={pt.y} vertical={pt.vertical} sentido={pt.sentido} p={prog(t, pt.abreEm, 0.45, preciso)} vao={porta} />
        ))}
        {/* rótulos dos cômodos (01, 02…): a lápis até o cômodo ser dito */}
        {salas.map((s, i) => {
          const dito = prog(t, comodos[i].em - 0.05, 0.3);
          const c = caixas[i];
          return (
            <g key={`rot-${i}`}>
              <text
                x={blocos[i].cx}
                y={blocos[i].topo - 18}
                textAnchor="middle"
                fontFamily={mono}
                fontWeight={500}
                fontSize={ROTULO + 2}
                letterSpacing="0.1em"
                fill={dito > 0.5 ? (i === ativo ? cor.acento : cor.grafite) : cor.cinzaClaro}
                opacity={Math.max(pLapis, dito)}
              >
                {String(i + 1).padStart(2, "0")}
              </text>
              {/* linhas a lápis onde o texto vai entrar */}
              {Array.from({ length: Math.min(2, quebras[i].linhas.length) }, (_, k) => (
                <path
                  key={k}
                  d={lin(blocos[i].cx - c.w * (k === 0 ? 0.36 : 0.22), blocos[i].topo + (k + 1) * tam * 1.1 - 6, blocos[i].cx + c.w * (k === 0 ? 0.36 : 0.22), blocos[i].topo + (k + 1) * tam * 1.1 - 6)}
                  stroke={cor.cinzaClaro}
                  strokeWidth={traco.fino}
                  strokeDasharray="6 8"
                  opacity={pLapis * (1 - dito)}
                />
              ))}
            </g>
          );
        })}
        {/* circulação */}
        {alcance > 0 ? (
          <g>
            <circle cx={pontos[0][0]} cy={pontos[0][1]} r={9} fill={cor.acento} />
            <path d={poli(parcial.feitos)} fill="none" stroke={cor.acento} strokeWidth={5.5} strokeDasharray="16 11" />
          </g>
        ) : null}
        {pFim > 0 && alcance >= chegadas[n - 1] - 1 ? (
          (() => {
            const [fx, fy] = pontos[pontos.length - 1];
            const [dx, dy] = parcial.dir;
            return bloqueado ? (
              <g>
                <Traco d={lin(fx - 20, fy - 20, fx + 20, fy + 20)} p={pFim} cor={cor.acento} largura={7} />
                <Traco d={lin(fx + 20, fy - 20, fx - 20, fy + 20)} p={limitar(pFim * 1.4 - 0.4)} cor={cor.acento} largura={7} />
              </g>
            ) : (
              <path
                d={poli([
                  [fx - dx * 26 - dy * 16, fy - dy * 26 + dx * 16],
                  [fx, fy],
                  [fx - dx * 26 + dy * 16, fy - dy * 26 - dx * 16],
                ])}
                fill="none"
                stroke={cor.acento}
                strokeWidth={6}
                opacity={pFim}
              />
            );
          })()
        ) : null}
        <text x={X0 + W} y={Y0 + H + 44} textAnchor="end" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.1em" fill={cor.cinza} opacity={prog(t, de + 0.8, 0.4)}>
          SEM ESCALA
        </text>
      </svg>
      {comodos.map((c, i) => {
        const caixa = caixas[i];
        const p = prog(t, c.em - 0.03, 0.45);
        const pd = prog(t, c.em + 0.4, 0.45);
        return (
          <div key={`txt-${i}`} style={{ position: "absolute", left: caixa.x, top: blocos[i].topo, width: caixa.w, textAlign: "center" }}>
            <Revela p={p} style={{ fontFamily: sans, fontWeight: 400, fontSize: quebras[i].tamanho, lineHeight: 1.1, color: c.alerta ? cor.acento : cor.grafite }}>
              {quebras[i].linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </Revela>
            {c.detalhe ? (
              <div style={{ marginTop: 8, opacity: pd, fontFamily: sans, fontWeight: 300, fontSize: 34, lineHeight: 1.15, color: cor.cinza, whiteSpace: "nowrap", overflow: "hidden" }}>
                {c.detalhe}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// Porta de planta: folha (traço) e arco de abertura (fino), no vão de uma parede
const PortaDesenhada: React.FC<{ x: number; y: number; vertical: boolean; sentido: 1 | -1; p: number; vao: number }> = ({ x, y, vertical, sentido, p, vao }) => {
  if (p <= 0) return null;
  const r = vao;
  if (vertical) {
    // parede vertical em x, vão de y - r/2 a y + r/2; dobradiça embaixo, folha para o lado `sentido`
    const hx = x;
    const hy = y + r / 2;
    const fx = hx + sentido * r;
    const arco = `M${fx} ${hy}A${r} ${r} 0 0 ${sentido > 0 ? 0 : 1} ${hx} ${hy - r}`;
    return (
      <g>
        <Traco d={lin(hx, hy, fx, hy)} p={p} cor={cor.grafite} largura={traco.medio} />
        <Traco d={arco} p={p} cor={cor.cinza} largura={traco.fino} />
      </g>
    );
  }
  // parede horizontal em y, vão de x - r/2 a x + r/2; dobradiça à direita, folha para baixo
  const hx = x + r / 2;
  const hy = y;
  const fy = hy + r;
  const arco = `M${hx} ${fy}A${r} ${r} 0 0 1 ${hx - r} ${hy}`;
  return (
    <g>
      <Traco d={lin(hx, hy, hx, fy)} p={p} cor={cor.grafite} largura={traco.medio} />
      <Traco d={arco} p={p} cor={cor.cinza} largura={traco.fino} />
    </g>
  );
};
