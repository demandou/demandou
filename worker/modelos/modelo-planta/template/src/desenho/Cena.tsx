// Desenha uma cena (planta ou elevação) dentro de uma região da tela, no ritmo da fala:
// paredes se desenham, móveis aparecem quando são ditos, se movem, ganham cota, circulação e níveis.
import { formatar, limitar, mistura, preciso, prog, Traco } from "../anim";
import type { Cena, Lado, Mudanca, Objeto, Vao } from "../plano";
import { cor, mono, ROTULO, traco } from "../tema";
import { desenharElevacao, desenharPlanta, pesDoObjeto, TAMANHO_ELEVACAO, TAMANHO_PLANTA } from "./biblioteca";
import { Cota } from "./Cota";
import { circ, lin, misturarCor, polilinhaParcial, poli } from "./geometria";

export type Regiao = { x: number; y: number; w: number; h: number };

const PESO = { forte: traco.forte, medio: traco.medio, fino: traco.fino };
// detalhes (almofadas, divisões) num grafite um pouco mais claro, para manter a hierarquia
const GRAFITE_DETALHE = "#55524B";

// tapetes e áreas ficam por baixo dos móveis
const ordem = (o: Objeto) => (o.tipo === "tapete" ? 0 : o.tipo === "cortina" ? 2 : 1);

const mudancas = (o: Objeto): Mudanca[] => (o.muda ? (Array.isArray(o.muda) ? o.muda : [o.muda]) : []);

// Posição e tamanho do objeto no instante t (cm), e o quanto ele está "em destaque"
const estadoDoObjeto = (o: Objeto, t: number, padrao: [number, number]) => {
  let s = { x: o.x, y: o.y, w: o.w ?? padrao[0], h: o.h ?? padrao[1] };
  for (const m of mudancas(o).sort((a, b) => a.em - b.em)) {
    const alvo = { x: m.x ?? s.x, y: m.y ?? s.y, w: m.w ?? s.w, h: m.h ?? s.h };
    const p = prog(t, m.em, m.dur ?? 0.8, preciso);
    s = { x: mistura(s.x, alvo.x, p), y: mistura(s.y, alvo.y, p), w: mistura(s.w, alvo.w, p), h: mistura(s.h, alvo.h, p) };
  }
  return s;
};

// Quando o objeto passa para a cor de acento: `destaque`, ou a primeira mudança (o que muda é o assunto)
const destaqueDe = (o: Objeto, t: number) => {
  if (o.destaque === false) return 0;
  if (o.destaque === true) return 1;
  const em = typeof o.destaque === "number" ? o.destaque : mudancas(o)[0]?.em;
  return em === undefined ? 0 : prog(t, em, 0.35);
};

const Rotulo: React.FC<{ x: number; y: number; texto: string; tamanho?: number; cor?: string; opacidade?: number; ancora?: "middle" | "start" }> = ({
  x,
  y,
  texto,
  tamanho = ROTULO,
  cor: c = cor.grafite,
  opacidade = 1,
  ancora = "middle",
}) => (
  <text
    x={x}
    y={y}
    textAnchor={ancora}
    dominantBaseline="middle"
    fontFamily={mono}
    fontWeight={500}
    fontSize={tamanho}
    letterSpacing="0.08em"
    fill={c}
    opacity={opacidade}
  >
    {texto.toUpperCase()}
  </text>
);

// posição do marcador ① em relação ao retângulo do objeto (px)
const posMarca = (lado: Lado | "centro" | undefined, x: number, y: number, w: number, h: number): [number, number] => {
  const r = 30;
  switch (lado) {
    case "cima":
      return [x + w / 2, y - r];
    case "baixo":
      return [x + w / 2, y + h + r];
    case "esquerda":
      return [x - r, y + h / 2];
    case "direita":
      return [x + w + r, y + h / 2];
    default:
      return [x + w / 2, y + h / 2];
  }
};

const MarcaNoObjeto: React.FC<{ marca: NonNullable<Objeto["marca"]>; px: { x: number; y: number; w: number; h: number }; t: number }> = ({
  marca,
  px,
  t,
}) => {
  const [x, y] = posMarca(marca.lado, px.x, px.y, px.w, px.h);
  return <Marca x={x} y={y} n={marca.n} p={prog(t, marca.em, 0.4, preciso)} />;
};

const Marca: React.FC<{ x: number; y: number; n: string | number; p: number }> = ({ x, y, n, p }) => {
  if (p <= 0) return null;
  return (
    <g>
      <circle cx={x} cy={y} r={25} fill={cor.papel} opacity={limitar(p * 3)} />
      <Traco d={circ(x, y, 25)} p={p} cor={cor.acento} largura={traco.medio} />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily={mono}
        fontWeight={500}
        fontSize={ROTULO}
        fill={cor.acento}
        opacity={limitar((p - 0.4) * 2.5)}
      >
        {n}
      </text>
    </g>
  );
};

// Desenho de um objeto já em px (posição, tamanho e giro), com progresso de traço
const ObjetoDesenhado: React.FC<{
  tipo: Objeto["tipo"];
  vista: "planta" | "elevacao";
  x: number;
  y: number;
  w: number;
  h: number;
  giro: number;
  p: number;
  pDetalhe: number;
  // 0 = grafite, 1 = acento
  dest: number;
  // multiplica as espessuras (desenhos pequenos do antes/depois usam traço um pouco mais fino)
  fator?: number;
}> = ({ tipo, vista, x, y, w, h, giro, p, pDetalhe, dest, fator = 1 }) => {
  const corTraco = misturarCor(cor.grafite, cor.acento, dest);
  const corFino = misturarCor(GRAFITE_DETALHE, cor.acento, dest);
  const deitado = giro === 90 || giro === 270;
  const cw = deitado ? h : w;
  const ch = deitado ? w : h;
  const d = vista === "planta" ? desenharPlanta(tipo, cw, ch) : desenharElevacao(tipo, cw, ch);
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) rotate(${giro}) translate(${-cw / 2} ${-ch / 2})`}>
      {d.fundo ? <path d={d.fundo} fill={cor.papel} opacity={limitar(p * 2.5)} /> : null}
      {d.linhas.map((l, i) => (
        <Traco
          key={i}
          d={l.d}
          p={l.peso === "fino" ? pDetalhe : p}
          cor={l.peso === "fino" ? corFino : corTraco}
          largura={PESO[l.peso] * fator}
          tracejado={l.tracejado ? "9 7" : undefined}
          opacity={l.tracejado ? limitar(pDetalhe * 2) : undefined}
        />
      ))}
    </g>
  );
};

const GIRO: Record<Lado, number> = { baixo: 0, cima: 180, esquerda: 90, direita: 270 };

// ---------------- PLANTA ----------------

const paredesPlanta = (L: number, P: number, e: number, aberturas: Vao[]) => {
  // eixo de cada parede (no meio da espessura), na ordem do desenho: cima → direita → baixo → esquerda
  type Trecho = { a: [number, number]; b: [number, number] };
  const lados: { lado: Lado; de: [number, number]; ate: [number, number] }[] = [
    { lado: "cima", de: [-e, -e / 2], ate: [L + e, -e / 2] },
    { lado: "direita", de: [L + e / 2, -e], ate: [L + e / 2, P + e] },
    { lado: "baixo", de: [L + e, P + e / 2], ate: [-e, P + e / 2] },
    { lado: "esquerda", de: [-e / 2, P + e], ate: [-e / 2, -e] },
  ];
  const trechos: (Trecho & { inicio: number; comp: number })[] = [];
  let cursor = 0;
  for (const l of lados) {
    const horizontal = l.de[1] === l.ate[1];
    const eixo = horizontal ? 0 : 1;
    const a0 = l.de[eixo];
    const a1 = l.ate[eixo];
    const sentido = Math.sign(a1 - a0);
    const comp = Math.abs(a1 - a0);
    // vãos desta parede, em coordenada ao longo do eixo
    const vaos = aberturas
      .filter((ab) => ab.parede === l.lado)
      .map((ab) => [ab.pos, ab.pos + ab.largura] as [number, number])
      .sort((x, y) => (sentido > 0 ? x[0] - y[0] : y[0] - x[0]));
    let pos = a0;
    const fixo = l.de[1 - eixo];
    const ponto = (v: number): [number, number] => (horizontal ? [v, fixo] : [fixo, v]);
    for (const [v0, v1] of vaos) {
      const entra = sentido > 0 ? v0 : v1;
      const sai = sentido > 0 ? v1 : v0;
      if ((entra - pos) * sentido > 0.1) {
        trechos.push({ a: ponto(pos), b: ponto(entra), inicio: cursor + Math.abs(pos - a0), comp: Math.abs(entra - pos) });
      }
      pos = sai;
    }
    if ((a1 - pos) * sentido > 0.1) trechos.push({ a: ponto(pos), b: ponto(a1), inicio: cursor + Math.abs(pos - a0), comp: Math.abs(a1 - pos) });
    cursor += comp;
  }
  return { trechos, total: cursor };
};

// ponto na face interna da parede, a `pos` cm do início dela, e a normal para dentro do ambiente
const faceInterna = (lado: Lado, pos: number, L: number, P: number): { p: [number, number]; n: [number, number]; u: [number, number] } => {
  switch (lado) {
    case "cima":
      return { p: [pos, 0], n: [0, 1], u: [1, 0] };
    case "baixo":
      return { p: [pos, P], n: [0, -1], u: [1, 0] };
    case "esquerda":
      return { p: [0, pos], n: [1, 0], u: [0, 1] };
    case "direita":
      return { p: [L, pos], n: [-1, 0], u: [0, 1] };
  }
};

export const DesenhoCena: React.FC<{
  cena: Cena;
  regiao: Regiao;
  t: number;
  inicio: number;
  compacto?: boolean;
  // controla quais objetos já existem desde o início (lado ANTES do antes/depois)
  instantaneo?: boolean;
}> = ({ cena, regiao, t, inicio, compacto, instantaneo }) => {
  const vista = cena.vista ?? "planta";
  return vista === "planta" ? (
    <Planta cena={cena} regiao={regiao} t={t} inicio={inicio} compacto={compacto} instantaneo={instantaneo} />
  ) : (
    <Elevacao cena={cena} regiao={regiao} t={t} inicio={inicio} compacto={compacto} />
  );
};

const Planta: React.FC<{ cena: Cena; regiao: Regiao; t: number; inicio: number; compacto?: boolean; instantaneo?: boolean }> = ({
  cena,
  regiao,
  t,
  inicio,
  compacto,
  instantaneo,
}) => {
  const amb = cena.ambiente;
  const e = amb.parede ?? 15;
  const L = amb.largura;
  const P = amb.profundidade ?? 300;
  const folga = compacto ? 6 : 12;
  // espaço embaixo para a escala escrita, sem encostar na legenda
  const reservaEscala = cena.escala && !compacto ? 52 : 0;
  const alturaUtil = regiao.h - reservaEscala;
  const k = Math.min((regiao.w - 2 * folga) / (L + 2 * e), (alturaUtil - 2 * folga) / (P + 2 * e));
  const ox = regiao.x + (regiao.w - L * k) / 2;
  const oy = regiao.y + (alturaUtil - P * k) / 2;
  const X = (x: number) => ox + x * k;
  const Y = (y: number) => oy + y * k;

  const paredesEm = cena.paredesEm ?? inicio + 0.12;
  const pParede = instantaneo ? 1 : prog(t, paredesEm, 0.85, preciso);
  const pAbertura = instantaneo ? 1 : prog(t, paredesEm + 0.55, 0.45, preciso);
  const aberturas = [...(amb.portas ?? []), ...(amb.janelas ?? [])];
  const { trechos, total } = paredesPlanta(L, P, e, aberturas);
  const andado = pParede * total;
  const larguraParede = Math.max(6, e * k);
  const tamanhoRotulo = compacto ? 0 : ROTULO;
  const fator = compacto ? 0.8 : 1;

  const objetos = [...cena.objetos].sort((a, b) => ordem(a) - ordem(b));

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* áreas hachuradas, por baixo de tudo */}
      {(cena.areas ?? []).map((a, i) => {
        const p = prog(t, a.em, 0.65, preciso);
        if (p <= 0) return null;
        const cx = X(a.x + a.w / 2);
        const cy = Y(a.y + a.h / 2);
        const w = a.w * k * p;
        const h = a.h * k * p;
        return (
          <g key={`area-${i}`}>
            <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill={cor.acentoVeu} stroke={cor.acento} strokeWidth={traco.fino} strokeDasharray="12 9" />
            {a.texto && !compacto ? (
              <Rotulo x={cx} y={cy} texto={a.texto} cor={cor.acento} tamanho={tamanhoRotulo + 2} opacidade={prog(t, a.em + 0.35, 0.3)} />
            ) : null}
          </g>
        );
      })}

      {/* paredes em poché, desenhadas em volta do ambiente */}
      {trechos.map((tr, i) => {
        const p = limitar((andado - tr.inicio) / tr.comp);
        return (
          <Traco
            key={`parede-${i}`}
            d={lin(X(tr.a[0]), Y(tr.a[1]), X(tr.b[0]), Y(tr.b[1]))}
            p={p}
            cor={cor.grafite}
            largura={larguraParede}
          />
        );
      })}

      {/* janelas: caixilho no vão */}
      {(amb.janelas ?? []).map((j, i) => {
        const f = faceInterna(j.parede, j.pos, L, P);
        const a = f.p;
        const b: [number, number] = [a[0] + f.u[0] * j.largura, a[1] + f.u[1] * j.largura];
        const fora: [number, number] = [-f.n[0] * e, -f.n[1] * e];
        const meio: [number, number] = [-f.n[0] * e * 0.5, -f.n[1] * e * 0.5];
        const L1 = (o: [number, number]) => lin(X(a[0] + o[0]), Y(a[1] + o[1]), X(b[0] + o[0]), Y(b[1] + o[1]));
        return (
          <g key={`janela-${i}`}>
            <Traco d={L1([0, 0])} p={pAbertura} cor={cor.grafite} largura={traco.fino * fator} />
            <Traco d={L1(fora)} p={pAbertura} cor={cor.grafite} largura={traco.fino * fator} />
            <Traco d={L1(meio)} p={pAbertura} cor={cor.grafite} largura={traco.medio * fator} />
            <Traco d={lin(X(a[0]), Y(a[1]), X(a[0] + fora[0]), Y(a[1] + fora[1]))} p={pAbertura} cor={cor.grafite} largura={traco.fino * fator} />
            <Traco d={lin(X(b[0]), Y(b[1]), X(b[0] + fora[0]), Y(b[1] + fora[1]))} p={pAbertura} cor={cor.grafite} largura={traco.fino * fator} />
          </g>
        );
      })}

      {/* portas: folha e arco de abertura */}
      {(amb.portas ?? []).map((pt, i) => {
        const dob = pt.dobradica === "fim" ? pt.pos + pt.largura : pt.pos;
        const outra = pt.dobradica === "fim" ? pt.pos : pt.pos + pt.largura;
        const fH = faceInterna(pt.parede, dob, L, P);
        const fJ = faceInterna(pt.parede, outra, L, P);
        const H = fH.p;
        const T: [number, number] = [H[0] + fH.n[0] * pt.largura, H[1] + fH.n[1] * pt.largura];
        const J = fJ.p;
        const cruz = (T[0] - H[0]) * (J[1] - H[1]) - (T[1] - H[1]) * (J[0] - H[0]);
        const r = pt.largura * k;
        const arco = `M${X(T[0])} ${Y(T[1])}A${r} ${r} 0 0 ${cruz > 0 ? 1 : 0} ${X(J[0])} ${Y(J[1])}`;
        return (
          <g key={`porta-${i}`}>
            <Traco d={lin(X(H[0]), Y(H[1]), X(T[0]), Y(T[1]))} p={pAbertura} cor={cor.grafite} largura={traco.medio * fator} />
            <Traco d={arco} p={pAbertura} cor={cor.cinza} largura={traco.fino * fator} />
          </g>
        );
      })}

      {/* objetos */}
      {objetos.map((o, i) => {
        if (!instantaneo && t < o.em - 0.01) return null;
        const deitado = o.frente === "esquerda" || o.frente === "direita";
        const pad = TAMANHO_PLANTA[o.tipo];
        const padrao: [number, number] = deitado ? [pad[1], pad[0]] : pad;
        const s = estadoDoObjeto(o, t, padrao);
        const p = instantaneo ? 1 : prog(t, o.em, 0.6, preciso);
        const pDet = instantaneo ? 1 : prog(t, o.em + 0.18, 0.5, preciso);
        const dest = destaqueDe(o, t);
        const giro = GIRO[o.frente ?? "baixo"];
        const px = { x: X(s.x), y: Y(s.y), w: s.w * k, h: s.h * k };

        // pés (regra do tapete)
        const pes = o.pes !== undefined ? pesDoObjeto(o.tipo, deitado ? px.h : px.w, deitado ? px.w : px.h) : null;
        const pPes = o.pes !== undefined ? prog(t, o.pes, 0.4) : 0;

        return (
          <g key={`obj-${i}`}>
            <ObjetoDesenhado tipo={o.tipo} vista="planta" {...px} giro={giro} p={p} pDetalhe={pDet} dest={dest} fator={fator} />
            {pes ? (
              <g
                transform={`translate(${px.x + px.w / 2} ${px.y + px.h / 2}) rotate(${giro}) translate(${-(deitado ? px.h : px.w) / 2} ${
                  -(deitado ? px.w : px.h) / 2
                })`}
                opacity={limitar(p * 2)}
              >
                {pes.tras.map(([x, y], j) => (
                  <rect key={`t${j}`} x={x - 4} y={y - 4} width={8} height={8} fill={cor.cinza} />
                ))}
                {pes.frente.map(([x, y], j) => {
                  const r = mistura(4, 8.5, pPes);
                  return <rect key={`f${j}`} x={x - r} y={y - r} width={2 * r} height={2 * r} fill={misturarCor(cor.cinza, cor.acento, pPes)} />;
                })}
              </g>
            ) : null}
            {o.rotulo && tamanhoRotulo ? (
              <Rotulo
                x={o.tipo === "tapete" ? px.x + 16 : px.x + px.w / 2}
                y={o.tipo === "tapete" ? px.y + px.h - 20 : px.y + px.h / 2}
                ancora={o.tipo === "tapete" ? "start" : "middle"}
                texto={o.rotulo}
                tamanho={tamanhoRotulo}
                cor={dest > 0.5 ? cor.acento : cor.grafite}
                opacidade={instantaneo ? 1 : prog(t, o.em + 0.3, 0.3)}
              />
            ) : null}
            {o.cota ? <CotaAteParede o={o} s={s} t={t} L={L} P={P} X={X} Y={Y} tamanho={ROTULO} /> : null}
            {o.marca ? (
              <MarcaNoObjeto marca={o.marca} px={px} t={t} />
            ) : null}
          </g>
        );
      })}

      {cena.escala && !compacto ? (
        <text x={X(L) + e * k} y={Y(P) + e * k + 40} textAnchor="end" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.1em" fill={cor.cinza} opacity={prog(t, paredesEm + 0.6, 0.4)}>
          ESC. {cena.escala}
        </text>
      ) : null}

      {/* circulação: percurso tracejado, livre (seta) ou bloqueado (×) */}
      {cena.circulacao ? <Circulacao c={cena.circulacao} t={t} X={X} Y={Y} instantaneo={instantaneo} fator={fator} /> : null}

      {(cena.cotas ?? []).map((c, i) => {
        const p = prog(t, c.em, 0.9, preciso);
        const texto = c.valor !== undefined ? `${formatar(c.valor * p)}${c.unidade ? ` ${c.unidade}` : ""}` : c.texto;
        return <Cota key={`cota-${i}`} x1={X(c.de[0])} y1={Y(c.de[1])} x2={X(c.ate[0])} y2={Y(c.ate[1])} p={p} cor={cor.acento} texto={texto} />;
      })}
    </svg>
  );
};

const CotaAteParede: React.FC<{
  o: Objeto;
  s: { x: number; y: number; w: number; h: number };
  t: number;
  L: number;
  P: number;
  X: (v: number) => number;
  Y: (v: number) => number;
  tamanho: number;
}> = ({ o, s, t, L, P, X, Y, tamanho }) => {
  const c = o.cota!;
  const em = c.em ?? mudancas(o)[0]?.em ?? o.em;
  const aparece = prog(t, em, 0.3);
  if (aparece <= 0) return null;
  let x1 = 0;
  let y1 = 0;
  let x2 = 0;
  let y2 = 0;
  let gap = 0;
  if (c.lado === "cima" || c.lado === "baixo") {
    const x = X(s.x + Math.min(s.w * 0.14, 28));
    const [a, b] = c.lado === "cima" ? [0, s.y] : [s.y + s.h, P];
    [x1, y1, x2, y2] = [x, Y(a), x, Y(b)];
    gap = b - a;
  } else {
    const y = Y(s.y + Math.min(s.h * 0.14, 28));
    const [a, b] = c.lado === "esquerda" ? [0, s.x] : [s.x + s.w, L];
    [x1, y1, x2, y2] = [X(a), y, X(b), y];
    gap = b - a;
  }
  if (gap < 0.6) return null;
  const texto = c.numero === false ? c.texto : `${c.texto ? `${c.texto} ` : ""}${Math.round(gap)} cm`;
  return (
    <g opacity={aparece}>
      <Cota x1={x1} y1={y1} x2={x2} y2={y2} cor={cor.acento} texto={texto} tamanhoTexto={tamanho} chamada={false} />
    </g>
  );
};

const Circulacao: React.FC<{
  c: NonNullable<Cena["circulacao"]>;
  t: number;
  X: (v: number) => number;
  Y: (v: number) => number;
  instantaneo?: boolean;
  fator?: number;
}> = ({ c, t, X, Y, instantaneo, fator = 1 }) => {
  const dur = c.dur ?? 1.1;
  const p = instantaneo ? 1 : prog(t, c.em, dur, preciso);
  if (p <= 0) return null;
  const pontos = c.pontos.map(([x, y]) => [X(x), Y(y)] as [number, number]);
  const parcial = polilinhaParcial(pontos, p);
  const fimP = instantaneo ? 1 : prog(t, c.em + dur - 0.05, 0.3, preciso);
  const [fx, fy] = parcial.fim;
  const [dx, dy] = parcial.direcao;
  const corC = cor.acento;
  return (
    <g>
      <circle cx={pontos[0][0]} cy={pontos[0][1]} r={8 * fator} fill={corC} />
      <path d={poli(parcial.pontos)} fill="none" stroke={corC} strokeWidth={5.5 * fator} strokeDasharray={`${16 * fator} ${11 * fator}`} />
      {fimP > 0 && c.bloqueada ? (
        <g>
          <Traco d={lin(fx - 17 * fator, fy - 17 * fator, fx + 17 * fator, fy + 17 * fator)} p={fimP} cor={corC} largura={6.5 * fator} />
          <Traco d={lin(fx + 17 * fator, fy - 17 * fator, fx - 17 * fator, fy + 17 * fator)} p={limitar(fimP * 1.4 - 0.4)} cor={corC} largura={6.5 * fator} />
        </g>
      ) : null}
      {fimP > 0 && !c.bloqueada ? (
        <g opacity={fimP}>
          <path
            d={poli([
              [fx - (dx * 24 + dy * 15) * fator, fy - (dy * 24 - dx * 15) * fator],
              [fx, fy],
              [fx - (dx * 24 - dy * 15) * fator, fy - (dy * 24 + dx * 15) * fator],
            ])}
            fill="none"
            stroke={corC}
            strokeWidth={6 * fator}
          />
        </g>
      ) : null}
    </g>
  );
};

// ---------------- ELEVAÇÃO ----------------

const Elevacao: React.FC<{ cena: Cena; regiao: Regiao; t: number; inicio: number; compacto?: boolean }> = ({ cena, regiao, t, inicio, compacto }) => {
  const amb = cena.ambiente;
  const L = amb.largura;
  const A = amb.altura ?? amb.profundidade ?? 270;
  // margens só para o que fica fora da parede: cotas à esquerda/direita dos objetos; níveis ficam por dentro
  const cotaEsq = cena.objetos.some((o) => o.cota?.lado === "esquerda");
  const cotaDir = cena.objetos.some((o) => o.cota?.lado === "direita");
  const mEsq = cotaEsq ? 70 : 26;
  const mDir = cotaDir ? 150 : 26;
  const mTopo = 24;
  const mBase = cena.escala ? 70 : 34;
  const k = Math.min((regiao.w - mEsq - mDir) / L, (regiao.h - mTopo - mBase) / A);
  const ox = regiao.x + mEsq + (regiao.w - mEsq - mDir - L * k) / 2;
  const oy = regiao.y + mTopo + (regiao.h - mTopo - mBase - A * k) / 2;
  const X = (x: number) => ox + x * k;
  const Y = (y: number) => oy + (A - y) * k;

  const paredesEm = cena.paredesEm ?? inicio + 0.12;
  const pChao = prog(t, paredesEm, 0.7, preciso);
  const pTeto = prog(t, paredesEm + 0.15, 0.7, preciso);
  const pLados = prog(t, paredesEm + 0.35, 0.6, preciso);
  const pHachura = prog(t, paredesEm + 0.5, 0.4);
  const ext = 22;
  const hachura = (y: number) => {
    const linhas: string[] = [];
    for (let x = X(0) - ext + 6; x < X(L) + ext - 8; x += 16) linhas.push(lin(x, y, x + 14, y + 14));
    return linhas.join("");
  };
  const tamanhoRotulo = compacto ? 0 : ROTULO;

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* chão (com hachura de corte), teto e limites da parede */}
      <Traco d={lin(X(0) - ext, Y(0), X(L) + ext, Y(0))} p={pChao} cor={cor.grafite} largura={traco.forte + 1.5} />
      <path d={hachura(Y(0) + 3)} stroke={cor.cinza} strokeWidth={traco.fino} opacity={pHachura} />
      <Traco d={lin(X(0) - ext, Y(A), X(L) + ext, Y(A))} p={pTeto} cor={cor.grafite} largura={traco.forte} />
      <path d={hachura(Y(A) - 17)} stroke={cor.cinza} strokeWidth={traco.fino} opacity={pHachura} />
      <Traco d={lin(X(0), Y(A), X(0), Y(0))} p={pLados} cor={cor.cinzaClaro} largura={traco.fino} />
      <Traco d={lin(X(L), Y(A), X(L), Y(0))} p={pLados} cor={cor.cinzaClaro} largura={traco.fino} />

      {cena.objetos.map((o, i) => {
        if (t < o.em - 0.01) return null;
        const [dw, dh] = TAMANHO_ELEVACAO[o.tipo];
        const base = estadoDoObjeto(o, t, [dw, dh]);
        let yBase = base.y;
        let topo = yBase + base.h;
        if (o.tipo === "cortina") {
          topo = mistura(topo, A, o.tetoEm !== undefined ? prog(t, o.tetoEm, 0.75, preciso) : 0);
          yBase = mistura(yBase, 0.5, o.chaoEm !== undefined ? prog(t, o.chaoEm, 0.75, preciso) : 0);
        }
        const altura = Math.max(1, topo - yBase);
        const px = { x: X(base.x), y: Y(topo), w: base.w * k, h: altura * k };
        const p = prog(t, o.em, 0.6, preciso);
        const pDet = prog(t, o.em + 0.18, 0.5, preciso);
        const dest = Math.max(destaqueDe(o, t), o.tipo === "cortina" && o.tetoEm !== undefined ? prog(t, o.tetoEm, 0.3) : 0);
        return (
          <g key={`el-${i}`}>
            {o.tipo === "pendente" ? <Traco d={lin(px.x + px.w / 2, Y(A), px.x + px.w / 2, px.y)} p={p} cor={cor.grafite} largura={traco.fino} /> : null}
            <ObjetoDesenhado tipo={o.tipo} vista="elevacao" {...px} giro={0} p={p} pDetalhe={pDet} dest={dest} />
            {o.tipo === "cortina" ? (
              <Traco d={lin(px.x - 14, px.y, px.x + px.w + 14, px.y)} p={p} cor={misturarCor(cor.grafite, cor.acento, dest)} largura={traco.forte + 2} />
            ) : null}
            {o.rotulo && tamanhoRotulo ? (
              <Rotulo x={px.x + px.w / 2} y={px.y + px.h / 2} texto={o.rotulo} tamanho={tamanhoRotulo} cor={dest > 0.5 ? cor.acento : cor.grafite} opacidade={prog(t, o.em + 0.3, 0.3)} />
            ) : null}
            {o.cota ? <CotaElevacao o={o} t={t} x={px.x} y={px.y} w={px.w} h={px.h} cm={{ w: base.w, h: altura }} tamanho={ROTULO} /> : null}
            {o.marca ? <MarcaNoObjeto marca={o.marca} px={px} t={t} /> : null}
          </g>
        );
      })}

      {cena.escala && !compacto ? (
        <text x={X(L) + ext} y={Y(0) + 58} textAnchor="end" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.1em" fill={cor.cinza} opacity={pHachura}>
          ESC. {cena.escala}
        </text>
      ) : null}

      {/* níveis: ▽ + texto, por dentro da parede, colados na borda direita */}
      {(cena.niveis ?? []).map((n, i) => {
        const p = prog(t, n.em, 0.45, preciso);
        if (p <= 0) return null;
        const y = Y(n.y);
        const xT = X(L) - 30;
        const abaixo = n.y > A / 2;
        const texto = n.texto.toUpperCase();
        const largTexto = texto.length * ROTULO * 0.66;
        const yTexto = abaixo ? y + 30 + ROTULO * 0.5 : y - 30;
        return (
          <g key={`nivel-${i}`}>
            <Traco d={lin(X(L) + ext, y, X(L) - 60 - largTexto, y)} p={p} cor={cor.acento} largura={traco.fino} />
            <Traco
              d={poli(abaixo ? [[xT - 12, y + 20], [xT + 12, y + 20], [xT, y]] : [[xT - 12, y - 20], [xT + 12, y - 20], [xT, y]], true)}
              p={p}
              cor={cor.acento}
              largura={traco.medio}
            />
            <g opacity={prog(t, n.em + 0.2, 0.3)}>
              <rect x={xT - 22 - largTexto - 6} y={yTexto - ROTULO * 0.85} width={largTexto + 12} height={ROTULO * 1.15} fill={cor.papel} />
              <text x={xT - 22} y={yTexto} textAnchor="end" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.08em" fill={cor.acento}>
                {texto}
              </text>
            </g>
          </g>
        );
      })}

      {(cena.cotas ?? []).map((c, i) => {
        const p = prog(t, c.em, 0.9, preciso);
        const texto = c.valor !== undefined ? `${formatar(c.valor * p)}${c.unidade ? ` ${c.unidade}` : ""}` : c.texto;
        return <Cota key={`cota-${i}`} x1={X(c.de[0])} y1={Y(c.de[1])} x2={X(c.ate[0])} y2={Y(c.ate[1])} p={p} cor={cor.acento} texto={texto} />;
      })}
    </svg>
  );
};

// Na elevação, a cota do objeto mede o próprio objeto: altura (lado esquerda/direita) ou largura (cima/baixo)
const CotaElevacao: React.FC<{
  o: Objeto;
  t: number;
  x: number;
  y: number;
  w: number;
  h: number;
  cm: { w: number; h: number };
  tamanho: number;
}> = ({ o, t, x, y, w, h, cm, tamanho }) => {
  const c = o.cota!;
  const aparece = prog(t, c.em ?? o.em, 0.3);
  if (aparece <= 0) return null;
  const vertical = c.lado === "esquerda" || c.lado === "direita";
  const valor = vertical ? cm.h : cm.w;
  const texto = c.numero === false ? c.texto : `${c.texto ? `${c.texto} ` : ""}${Math.round(valor)} cm`;
  const off = 36;
  const [x1, y1, x2, y2] =
    c.lado === "esquerda"
      ? [x - off, y, x - off, y + h]
      : c.lado === "direita"
        ? [x + w + off, y, x + w + off, y + h]
        : c.lado === "cima"
          ? [x, y - off, x + w, y - off]
          : [x, y + h + off, x + w, y + h + off];
  return (
    <g opacity={aparece}>
      <Cota x1={x1} y1={y1} x2={x2} y2={y2} cor={cor.acento} texto={texto} tamanhoTexto={tamanho} inverterTexto={c.lado === "esquerda"} />
    </g>
  );
};
