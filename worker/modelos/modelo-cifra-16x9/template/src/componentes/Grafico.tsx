// Bloco universal `grafico`, na linguagem das cordas:
// - barras: setas para cima sobre as seis cordas (como na batida), com a altura do valor; cada uma se enche
//   de baixo para cima quando o dado é dito e as cordas vibram;
// - linha: uma corda grossa que passa pelos pontos (bolinhas de dedo), desenhada até cada ponto quando ele é dito;
// - pizza: a boca do violão, com a roseta em volta, dividida em fatias que se enchem uma a uma;
// - sem números ditos (`tendencia`): uma corda que sobe, cai ou oscila, com a bolinha de dedo na ponta e a
//   etiqueta "ilustrativo".
import { prog, suave, temposDasPalavras } from "../anim";
import { caber, casasDe, type Encaixe, largura, numeroPtBr } from "../medida";
import type { Grafico as TGrafico, Palavra } from "../plano";
import { cor, fonte, rotulo, titulo } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";

const formatar = (v: number, unidade?: string) => {
  const n = numeroPtBr(v, casasDe(v));
  if (!unidade) return n;
  return /^[%°]/.test(unidade) ? `${n}${unidade}` : `${n} ${unidade}`;
};

// seta (baixo ou cima) com a cabeça proporcional à largura
export const contornoDeSeta = (cx: number, base: number, h: number, meia: number, dir: "cima" | "baixo" = "cima") => {
  const haste = meia * 0.32;
  const altCabeca = Math.min(h * 0.45, meia * 1.8);
  // seta para cima: a ponta em base - h
  const pts = [
    [cx - haste, 0],
    [cx + haste, 0],
    [cx + haste, h - altCabeca],
    [cx + meia, h - altCabeca],
    [cx, h],
    [cx - meia, h - altCabeca],
    [cx - haste, h - altCabeca],
  ].map(([x, y]) => [x, dir === "cima" ? base - y : base - h + y]);
  return `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")} Z`;
};

const Etiqueta: React.FC<{ visivel: number }> = ({ visivel }) => (
  <div
    style={{
      ...rotulo,
      fontSize: 30,
      padding: "8px 18px",
      borderRadius: 14,
      border: `3px dashed ${cor.lapisForte}`,
      color: cor.marfimSuave,
      opacity: visivel,
      fontFamily: fonte,
    }}
  >
    ilustrativo
  </div>
);

// as seis cordas na horizontal, atravessando a área; `toques` = instantes em que elas vibram
const Cordas: React.FC<{ w: number; y0: number; y1: number; t: number; toques: number[]; opacidade?: number }> = ({ w, y0, y1, t, toques, opacidade = 0.5 }) => (
  <>
    {Array.from({ length: 6 }, (_, k) => {
      const y = y0 + ((y1 - y0) * k) / 5;
      const pts = Array.from({ length: 49 }, (_, j) => {
        const x = (j / 48) * w;
        let v = 0;
        for (const em of toques) {
          const d = t - (em + k * 0.02);
          if (d < 0 || d > 1.2) continue;
          v += 7 * Math.exp(-d / 0.3) * Math.sin(2 * Math.PI * 7.5 * d + k) * Math.sin((Math.PI * x) / w);
        }
        return `${x.toFixed(1)} ${(y + v).toFixed(1)}`;
      });
      return <path key={k} d={`M ${pts.join(" L ")}`} fill="none" stroke={cor.niquel} strokeOpacity={opacidade} strokeWidth={2.2 + (5 - k) * 0.45} />;
    })}
  </>
);

export const Grafico: React.FC<{ m: TGrafico; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const ilustrativo = m.ilustrativo || !comDados;
  const primeiro = comDados ? dados[0].em : (m.tendenciaEm ?? m.de + 0.3);
  const encTitulo = m.titulo ? caber(m.titulo, { largura: area.w, max: 72, min: 46, linhas: 2 }) : null;
  const tTitulo = m.titulo ? temposDasPalavras(m.titulo, palavras, m.de, primeiro + 0.4, m.de).tempos : [];
  const alturaTitulo = encTitulo ? encTitulo.linhas.length * encTitulo.tamanho * 1.08 + 20 : 0;
  const alturaEtiqueta = ilustrativo ? 70 : 0;
  const topoGrafico = alturaTitulo + alturaEtiqueta;
  const regiao = { x: 0, y: topoGrafico, w: area.w, h: area.h - topoGrafico };

  let grafico: React.ReactNode = null;
  if (!comDados) grafico = <Tendencia m={m} t={t} regiao={regiao} />;
  else if (m.forma === "pizza") grafico = <Pizza m={m} dados={dados} t={t} regiao={regiao} palavras={palavras} />;
  else if (m.forma === "linha") grafico = <Linha m={m} dados={dados} t={t} regiao={regiao} palavras={palavras} fim={fim} />;
  else grafico = <Barras m={m} dados={dados} t={t} regiao={regiao} palavras={palavras} fim={fim} />;

  return (
    <>
      {encTitulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: area.w }}>
          <TextoFalado enc={encTitulo} tempos={tTitulo} t={t} cor={cor.marfim} peso={800} alinhamento="center" />
        </div>
      ) : null}
      {ilustrativo ? (
        <div style={{ position: "absolute", right: 0, top: alturaTitulo + 6 }}>
          <Etiqueta visivel={1} />
        </div>
      ) : null}
      {grafico}
    </>
  );
};

type Dado = { rotulo: string; valor: number; em: number };
type Regiao = { x: number; y: number; w: number; h: number };

// rótulo de um dado: a lápis, ganha tinta quando o dado é dito
const RotuloDoDado: React.FC<{ texto: string; em: number; t: number; largura: number; palavras: Palavra[]; ativo: boolean; ate: number }> = ({
  texto,
  em,
  t,
  largura: larg,
  palavras,
  ativo,
  ate,
}) => {
  const enc = caber(texto, { largura: larg, max: 44, min: 30, linhas: 2, estilo: { peso: 700 } });
  const tempos = temposDasPalavras(texto, palavras, em - 0.6, ate, em - 0.3).tempos.map((x) => Math.min(x, em));
  return <TextoFalado enc={enc} tempos={tempos} t={t} cor={ativo ? cor.azul : cor.marfim} peso={700} espacamento={0} alinhamento="center" />;
};

const Barras: React.FC<{ m: TGrafico; dados: Dado[]; t: number; regiao: Regiao; palavras: Palavra[]; fim: number }> = ({ m, dados, t, regiao, palavras, fim }) => {
  const n = dados.length;
  const coluna = regiao.w / n;
  const maior = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
  const ROTULOS = 104;
  const VALOR = 70;
  const base = regiao.y + regiao.h - ROTULOS;
  const alturaMax = regiao.h - ROTULOS - VALOR - 10;
  const meia = Math.min(68, coluna * 0.36);
  const emCurso = dados.reduce((k, d, i) => (t >= d.em - 0.02 ? i : k), -1);
  const tamValor = Math.min(
    56,
    ...dados.map((d) => caber(formatar(d.valor, m.unidade), { largura: coluna - 12, max: 56, min: 32, linhas: 1, estilo: { peso: 800 } }).tamanho),
  );
  return (
    <>
      <svg width={regiao.w} height={regiao.y + regiao.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Cordas w={regiao.w} y0={base - alturaMax * 0.92} y1={base - 14} t={t} toques={dados.map((d) => d.em)} />
        {dados.map((d, i) => {
          const h = alturaMax * Math.max(0.28, Math.abs(d.valor) / maior);
          const cx = coluna * (i + 0.5);
          const caminho = contornoDeSeta(cx, base, h, meia, "cima");
          const p = prog(t, d.em - 0.03, 0.5, suave);
          const id = `barra-${i}-${Math.round(m.de * 100)}`;
          const ativa = i === emCurso;
          return (
            <g key={i}>
              <defs>
                <clipPath id={id}>
                  <rect x={cx - meia - 4} y={base - h * p - 2} width={2 * meia + 8} height={h * p + 4} />
                </clipPath>
              </defs>
              <path d={caminho} fill={cor.palco} stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" strokeLinejoin="round" />
              {p > 0 ? (
                <path d={caminho} fill={ativa ? cor.azul : cor.marfim} stroke={ativa ? cor.azul : cor.marfim} strokeWidth={3} strokeLinejoin="round" clipPath={`url(#${id})`} />
              ) : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, i) => {
        const h = alturaMax * Math.max(0.28, Math.abs(d.valor) / maior);
        const ativa = i === emCurso;
        const pValor = prog(t, d.em + 0.3, 0.3);
        return (
          <div key={`r${i}`}>
            <div
              style={{
                ...titulo,
                position: "absolute",
                left: coluna * i,
                width: coluna,
                top: base - h - VALOR + 6,
                textAlign: "center",
                fontSize: tamValor,
                whiteSpace: "nowrap",
                color: ativa ? cor.azul : cor.marfim,
                opacity: pValor,
                translate: `0 ${(1 - pValor) * 12}px`,
              }}
            >
              {formatar(d.valor, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: coluna * i + 6, width: coluna - 12, top: base + 18, display: "flex", justifyContent: "center" }}>
              <RotuloDoDado texto={d.rotulo} em={d.em} t={t} largura={coluna - 12} palavras={palavras} ativo={ativa} ate={dados[i + 1]?.em ?? fim} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Linha: React.FC<{ m: TGrafico; dados: Dado[]; t: number; regiao: Regiao; palavras: Palavra[]; fim: number }> = ({ m, dados, t, regiao, palavras, fim }) => {
  const n = dados.length;
  const ROTULOS = 104;
  const VALOR = 74;
  const margem = Math.min(110, regiao.w / (2 * n));
  const x = (i: number) => margem + ((regiao.w - 2 * margem) * i) / (n - 1);
  const valores = dados.map((d) => d.valor);
  const lo = Math.min(...valores);
  const hi = Math.max(...valores);
  const topo = regiao.y + VALOR;
  const base = regiao.y + regiao.h - ROTULOS - 30;
  const y = (v: number) => (hi === lo ? (topo + base) / 2 : base - ((v - lo) / (hi - lo)) * (base - topo));
  const emCurso = dados.reduce((k, d, i) => (t >= d.em - 0.02 ? i : k), -1);
  const larguraRotulo = Math.min(260, (regiao.w - 2 * margem) / (n - 1) + 40);
  const tamValor = Math.min(
    52,
    ...dados.map((d) => caber(formatar(d.valor, m.unidade), { largura: larguraRotulo, max: 52, min: 32, linhas: 1, estilo: { peso: 800 } }).tamanho),
  );
  // quanto de cada trecho já foi desenhado: o traço chega no ponto quando ele é dito
  const segs = dados.slice(1).map((d, i) => ({ de: i, p: prog(t, Math.max(dados[i].em, d.em - 0.45), Math.max(0.15, Math.min(0.45, d.em - dados[i].em))) }));
  return (
    <>
      <svg width={regiao.w} height={regiao.y + regiao.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Cordas w={regiao.w} y0={topo - 10} y1={base + 10} t={t} toques={dados.map((d) => d.em)} opacidade={0.32} />
        {/* o traço todo, a lápis */}
        <polyline points={dados.map((d, i) => `${x(i)},${y(d.valor)}`).join(" ")} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" />
        {segs.map((s) => {
          const x0 = x(s.de);
          const y0 = y(dados[s.de].valor);
          const x1 = x(s.de + 1);
          const y1 = y(dados[s.de + 1].valor);
          if (s.p <= 0) return null;
          return <line key={s.de} x1={x0} y1={y0} x2={x0 + (x1 - x0) * s.p} y2={y0 + (y1 - y0) * s.p} stroke={cor.marfim} strokeWidth={8} strokeLinecap="round" />;
        })}
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.03, 0.24);
          const ativa = i === emCurso;
          return (
            <g key={i}>
              <circle cx={x(i)} cy={y(d.valor)} r={22} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="6 6" opacity={1 - p} />
              <circle cx={x(i)} cy={y(d.valor) - 22 * (1 - suave(p))} r={24 * (0.7 + 0.3 * p)} fill={ativa ? cor.azul : cor.marfim} opacity={p} />
            </g>
          );
        })}
      </svg>
      {dados.map((d, i) => {
        const ativa = i === emCurso;
        const pValor = prog(t, d.em + 0.15, 0.3);
        return (
          <div key={`r${i}`}>
            <div
              style={{
                ...titulo,
                position: "absolute",
                left: x(i) - larguraRotulo / 2,
                width: larguraRotulo,
                top: y(d.valor) - 34 - tamValor * 1.1,
                textAlign: "center",
                fontSize: tamValor,
                whiteSpace: "nowrap",
                color: ativa ? cor.azul : cor.marfim,
                opacity: pValor,
              }}
            >
              {formatar(d.valor, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: x(i) - larguraRotulo / 2, width: larguraRotulo, top: base + 44, display: "flex", justifyContent: "center" }}>
              <RotuloDoDado texto={d.rotulo} em={d.em} t={t} largura={larguraRotulo} palavras={palavras} ativo={ativa} ate={dados[i + 1]?.em ?? fim} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Pizza: React.FC<{ m: TGrafico; dados: Dado[]; t: number; regiao: Regiao; palavras: Palavra[] }> = ({ m, dados, t, regiao, palavras }) => {
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const R = Math.min(230, (regiao.h - 80) / 2, regiao.w * 0.24);
  const cx = R + 40;
  const cy = regiao.y + regiao.h / 2;
  const emCurso = dados.reduce((k, d, i) => (t >= d.em - 0.02 ? i : k), -1);
  const legendaX = cx + R + 70;
  const legendaW = regiao.w - legendaX;
  const linhaH = Math.min(150, (regiao.h - 20) / dados.length);
  let acumulado = 0;
  const fatias = dados.map((d) => {
    const ini = acumulado / total;
    acumulado += Math.max(0, d.valor);
    return { ini, fim: acumulado / total };
  });
  const arco = (a0: number, a1: number, r: number) => {
    const p0 = [cx + r * Math.sin(2 * Math.PI * a0), cy - r * Math.cos(2 * Math.PI * a0)];
    const p1 = [cx + r * Math.sin(2 * Math.PI * a1), cy - r * Math.cos(2 * Math.PI * a1)];
    const grande = a1 - a0 > 0.5 ? 1 : 0;
    return `M ${cx} ${cy} L ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${grande} 1 ${p1[0]} ${p1[1]} Z`;
  };
  const opacidades = [0.92, 0.6, 0.78, 0.45, 0.68, 0.38];
  const tamLegenda = Math.min(
    52,
    ...dados.map((d) => caber(d.rotulo, { largura: legendaW - 70, max: 52, min: 34, linhas: 2, estilo: { peso: 700 } }).tamanho),
  );
  return (
    <>
      <svg width={regiao.w} height={regiao.y + regiao.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* a roseta da boca do violão */}
        <circle cx={cx} cy={cy} r={R + 34} fill="none" stroke={cor.niquel} strokeWidth={3} opacity={0.6} />
        <circle cx={cx} cy={cy} r={R + 22} fill="none" stroke={cor.niquel} strokeWidth={6} strokeDasharray="3 7" opacity={0.6} />
        <circle cx={cx} cy={cy} r={R + 10} fill="none" stroke={cor.niquel} strokeWidth={3} opacity={0.6} />
        <circle cx={cx} cy={cy} r={R} fill={cor.palco} stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" />
        {fatias.map((f, i) => {
          const p = prog(t, dados[i].em - 0.03, 0.5, suave);
          if (p <= 0 || f.fim - f.ini < 0.001) return null;
          const ativa = i === emCurso;
          return (
            <path
              key={i}
              d={arco(f.ini, f.ini + (f.fim - f.ini) * p - 0.0001, R)}
              fill={ativa ? cor.azul : cor.marfim}
              opacity={ativa ? 1 : opacidades[i % opacidades.length]}
              stroke={cor.palco}
              strokeWidth={5}
            />
          );
        })}
      </svg>
      {dados.map((d, i) => {
        const ativa = i === emCurso;
        const p = prog(t, d.em - 0.03, 0.3);
        const y = cy - (dados.length * linhaH) / 2 + i * linhaH;
        const enc: Encaixe = caber(d.rotulo, { largura: legendaW - 70, max: tamLegenda, min: tamLegenda, linhas: 2, estilo: { peso: 700 } });
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: legendaX, top: y, width: legendaW, height: linhaH, display: "flex", alignItems: "center", gap: 22 }}>
            <svg width={48} height={48} style={{ flexShrink: 0, overflow: "visible" }}>
              <circle cx={24} cy={24} r={20} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="6 6" opacity={1 - p} />
              <circle cx={24} cy={24} r={22} fill={ativa ? cor.azul : cor.marfim} opacity={p * (ativa ? 1 : opacidades[i % opacidades.length])} />
            </svg>
            <div>
              <TextoFalado
                enc={enc}
                tempos={temposDasPalavras(d.rotulo, palavras, d.em - 0.6, d.em + 0.4, d.em - 0.3).tempos.map((x) => Math.min(x, d.em))}
                t={t}
                cor={ativa ? cor.azul : cor.marfim}
                peso={700}
                espacamento={0}
              />
              <div style={{ ...titulo, fontSize: tamLegenda, color: ativa ? cor.azul : cor.marfimSuave, opacity: p, marginTop: 4 }}>{formatar(d.valor, m.unidade)}</div>
            </div>
          </div>
        );
      })}
    </>
  );
};

const Tendencia: React.FC<{ m: TGrafico; t: number; regiao: Regiao }> = ({ m, t, regiao }) => {
  const forma = m.tendencia ?? "sobe";
  const inicio = m.tendenciaEm ?? m.de + 0.3;
  const DUR = 1.5;
  const p = prog(t, inicio, DUR, suave);
  const margem = 50;
  const y0 = regiao.y + 40;
  const y1 = regiao.y + regiao.h - 40;
  const N = 80;
  const curva = (u: number) => {
    const x = margem + (regiao.w - 2 * margem) * u;
    let v: number;
    if (forma === "oscila") v = 0.5 + 0.32 * Math.sin(2 * Math.PI * 2 * u) * (0.6 + 0.4 * u);
    else {
      // sobe (ou cai) com degraus pequenos, como um mercado de verdade
      const base = u ** 1.35;
      v = base + 0.06 * Math.sin(2 * Math.PI * 3.2 * u) * (1 - u * 0.5);
      if (forma === "cai") v = 1 - v;
      v = 0.1 + 0.8 * v;
    }
    return [x, y1 - (y1 - y0) * v];
  };
  const pts = Array.from({ length: N + 1 }, (_, j) => curva((j / N) * p));
  const ponta = curva(p);
  const d = t - (inicio + DUR);
  // quando o traço termina, a corda vibra um instante (e a bolinha assenta)
  const vibra = d > 0 && d < 1.5 ? 6 * Math.exp(-d / 0.35) * Math.sin(2 * Math.PI * 7 * d) : 0;
  const caminho = pts.map(([x, y], j) => `${x.toFixed(1)} ${(y + vibra * Math.sin((Math.PI * j) / N)).toFixed(1)}`).join(" L ");
  const lapis = Array.from({ length: N + 1 }, (_, j) => curva(j / N))
    .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" L ");
  return (
    <>
      {m.unidade ? (
        <div style={{ ...rotulo, position: "absolute", left: 0, top: regiao.y, fontSize: 32, color: cor.marfimSuave }}>{m.unidade}</div>
      ) : null}
      <svg width={regiao.w} height={regiao.y + regiao.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Cordas w={regiao.w} y0={y0} y1={y1} t={t} toques={[inicio + DUR]} opacidade={0.3} />
        <path d={`M ${lapis}`} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" opacity={1 - Math.min(1, p * 1.5)} />
        {p > 0 ? <path d={`M ${caminho}`} fill="none" stroke={cor.marfim} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /> : null}
        <circle cx={ponta[0]} cy={ponta[1]} r={28} fill={p > 0 ? cor.azul : "none"} stroke={p > 0 ? "none" : cor.lapisForte} strokeWidth={3} strokeDasharray="6 6" />
      </svg>
    </>
  );
};

// largura de um texto de valor (para quem precisa diagramar em volta)
export const larguraDoValor = (v: number, unidade: string | undefined, tamanho: number) => largura(formatar(v, unidade), tamanho, { peso: 800 });
