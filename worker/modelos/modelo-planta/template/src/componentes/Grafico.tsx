import { limitar, mistura, preciso, prog, Traco } from "../anim";
import { circ, lin, poli, ret } from "../desenho/geometria";
import type { Regiao } from "../layout";
import type { Grafico as TGrafico, Layout, Palavra } from "../plano";
import { cor, mono, ROTULO, sans, traco } from "../tema";
import { encaixar, larguraTexto, numeroBR } from "../texto";
import { Folha } from "./Folha";

// Gráfico desenhado como elevação de arquiteto:
// - barras: prédios que sobem do chão (com hachura de corte) quando cada número é dito; um nível ▽
//   marca o topo com o valor;
// - linha: um corte de terreno que se desenha ponto a ponto, com hachura por baixo;
// - pizza: uma planta circular dividida em setores, cada setor com o seu número de chamada;
// - sem números (tendência): uma escada que sobe ou desce (com a seta e o SOBE/DESCE das plantas)
//   ou um terreno que oscila, sempre com a etiqueta ILUSTRATIVO.
export const Grafico: React.FC<{ m: TGrafico; t: number; regiao: Regiao; layout: Layout; palavras: Palavra[] }> = ({ m, t, regiao, layout, palavras }) => (
  <Folha t={t} de={m.de} ate={m.ate} palavras={palavras} layout={layout} regiao={regiao} titulo={m.titulo}>
    {(corpo) => <Elevacao m={m} t={t} corpo={corpo} />}
  </Folha>
);

const Etiqueta: React.FC<{ x: number; y: number; texto: string; p: number; ancora?: "start" | "end" }> = ({ x, y, texto, p, ancora = "end" }) => {
  const w = texto.length * ROTULO * 0.6 * 1.1 + 24;
  const x0 = ancora === "end" ? x - w : x;
  return (
    <g opacity={p}>
      <rect x={x0} y={y} width={w} height={ROTULO + 18} fill={cor.papel} stroke={cor.cinza} strokeWidth={traco.fino} />
      <text x={x0 + w / 2} y={y + (ROTULO + 18) / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.1em" fill={cor.cinza}>
        {texto}
      </text>
    </g>
  );
};

// hachura de corte (45°) dentro de um retângulo
const hachuraRet = (x: number, y: number, w: number, h: number, passo = 18) => {
  const l: string[] = [];
  for (let k = -h; k < w; k += passo) {
    const xa = Math.max(0, k);
    const xb = Math.min(w, k + h);
    if (xb <= xa) continue;
    l.push(lin(x + xa, y + h - (xa - k), x + xb, y + h - (xb - k)));
  }
  return l.join("");
};

const Elevacao: React.FC<{ m: TGrafico; t: number; corpo: Regiao }> = ({ m, t, corpo }) => {
  const dados = (m.dados ?? []).filter((d) => Number.isFinite(d.valor)).slice(0, 6);
  const ilustrativo = !dados.length || !!m.ilustrativo;
  const pLapis = prog(t, m.de - 0.2, 0.25);
  // linha de cima do corpo: unidade (à esquerda) e ILUSTRATIVO (à direita)
  const topo = corpo.y + (m.unidade || ilustrativo ? ROTULO + 34 : 6);
  const cabeca = (
    <>
      {m.unidade ? (
        <text x={corpo.x} y={corpo.y + ROTULO} fontFamily={mono} fontWeight={500} fontSize={ROTULO + 2} letterSpacing="0.1em" fill={cor.cinza} opacity={pLapis}>
          {m.unidade.toUpperCase()}
        </text>
      ) : null}
      {ilustrativo ? <Etiqueta x={corpo.x + corpo.w} y={corpo.y - 6} texto="ILUSTRATIVO" p={pLapis} /> : null}
    </>
  );
  const area: Regiao = { x: corpo.x, y: topo, w: corpo.w, h: corpo.y + corpo.h - topo };
  let desenho: React.ReactNode;
  if (!dados.length) desenho = <Tendencia m={m} t={t} area={area} />;
  else if (m.forma === "pizza") desenho = <Pizza m={m} dados={dados} t={t} area={area} />;
  else desenho = <BarrasOuLinha m={m} dados={dados} t={t} area={area} />;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {cabeca}
      {desenho}
    </svg>
  );
};

type Dado = { rotulo: string; valor: number; em: number };

// valor curto para a cabeça da barra: "83.000", "1,5", com a unidade quando ela é curta (%, mil, kg…)
const textoValor = (v: number, casas: number, unidade?: string) => {
  const u = unidade && unidade.length <= 4 ? unidade : "";
  return `${numeroBR(v, casas)}${u ? (u === "%" ? "%" : ` ${u}`) : ""}`;
};

const casasDe = (dados: Dado[]) => (dados.some((d) => Math.abs(d.valor - Math.round(d.valor)) > 1e-6) ? 1 : 0);

const BarrasOuLinha: React.FC<{ m: TGrafico; dados: Dado[]; t: number; area: Regiao }> = ({ m, dados, t, area }) => {
  const n = dados.length;
  const slot = area.w / n;
  const casas = casasDe(dados);
  // rótulos embaixo do chão: o mesmo corpo para todos, até 2 linhas
  const largRot = slot - 18;
  let tamRot = 40;
  for (; tamRot > 28; tamRot -= 2) {
    if (dados.every((d) => encaixar(d.rotulo, { largura: largRot, max: tamRot, min: tamRot, linhas: 2, fonte: { peso: 400 } }).linhas.length <= 2)) break;
  }
  const rotulos = dados.map((d) => encaixar(d.rotulo, { largura: largRot, max: tamRot, min: 26, linhas: 2, fonte: { peso: 400 } }));
  const linhasRot = Math.max(...rotulos.map((r) => r.linhas.length));
  const yChao = area.y + area.h - (30 + linhasRot * tamRot * 1.15);
  // valores no topo: o mesmo corpo para todos
  const valores = dados.map((d) => textoValor(d.valor, casas, m.unidade));
  let tamVal = 52;
  while (tamVal > 30 && valores.some((v) => larguraTexto(v, tamVal, { peso: 400 }) > slot - 16)) tamVal -= 2;
  const alturaMax = yChao - area.y - (tamVal + 56);
  const maior = Math.max(...dados.map((d) => d.valor), 0);
  const menor = Math.min(...dados.map((d) => d.valor), 0);
  const linha = m.forma === "linha";
  // na linha, a base pode não ser zero (para a variação aparecer)
  const base = linha && menor >= 0 && Math.min(...dados.map((d) => d.valor)) > maior * 0.5 ? Math.min(...dados.map((d) => d.valor)) - (maior - Math.min(...dados.map((d) => d.valor))) * 0.6 : 0;
  const altura = (v: number) => (maior - base > 0 ? (Math.max(0, v - base) / (maior - base)) * alturaMax : 0);
  const cx = (i: number) => area.x + slot * (i + 0.5);
  const ativo = dados.reduce((a, d, i) => (t >= d.em - 0.05 ? i : a), -1);
  const pChao = prog(t, m.de + 0.05, 0.7, preciso);
  const pLapis = prog(t, m.de - 0.2, 0.25);
  const bw = Math.min(slot * 0.56, 170);

  const chao = (
    <g>
      <Traco d={lin(area.x, yChao, area.x + area.w, yChao)} p={pChao} cor={cor.grafite} largura={traco.forte + 1.5} />
      <path
        d={(() => {
          const l: string[] = [];
          for (let x = area.x + 6; x < area.x + area.w - 12; x += 16) l.push(lin(x, yChao + 3, x + 13, yChao + 16));
          return l.join("");
        })()}
        stroke={cor.cinza}
        strokeWidth={traco.fino}
        opacity={prog(t, m.de + 0.4, 0.4)}
      />
    </g>
  );

  // eixos tracejados (a lápis) onde cada dado vai entrar
  const eixos = dados.map((d, i) => (
    <path key={`eixo-${i}`} d={lin(cx(i), yChao - 6, cx(i), area.y + tamVal + 40)} stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="14 7 3 7" opacity={pLapis * (1 - prog(t, d.em - 0.05, 0.3))} />
  ));

  const rotulosSvg = dados.map((d, i) => {
    const p = prog(t, d.em - 0.05, 0.4);
    return (
      <text key={`rot-${i}`} x={cx(i)} y={yChao + 30 + tamRot * 0.9} textAnchor="middle" fontFamily={sans} fontWeight={400} fontSize={rotulos[i].tamanho} fill={cor.grafite} opacity={p}>
        {rotulos[i].linhas.map((l, k) => (
          <tspan key={k} x={cx(i)} dy={k === 0 ? 0 : rotulos[i].tamanho * 1.15}>
            {l}
          </tspan>
        ))}
      </text>
    );
  });

  // nível ▽ + valor contando no topo
  const nivel = (i: number, yTopo: number, p: number) => {
    const d = dados[i];
    const c = prog(t, d.em - 0.05, 0.9, preciso);
    const ativa = i === ativo;
    return (
      <g key={`niv-${i}`} opacity={limitar(p * 2)}>
        <path d={poli([[cx(i) - 13, yTopo - 30], [cx(i) + 13, yTopo - 30], [cx(i), yTopo - 9]], true)} fill="none" stroke={ativa ? cor.acento : cor.grafite} strokeWidth={traco.medio} />
        <text x={cx(i)} y={yTopo - 44} textAnchor="middle" fontFamily={sans} fontWeight={400} fontSize={tamVal} fill={ativa ? cor.acento : cor.grafite} style={{ fontVariantNumeric: "tabular-nums" }}>
          {textoValor(d.valor * c, casas, m.unidade)}
        </text>
      </g>
    );
  };

  if (linha) {
    const pontos = dados.map((d, i) => [cx(i), yChao - altura(d.valor)] as [number, number]);
    // quanto da linha já foi desenhado: chega ao ponto i no em dele
    const alcance = dados.slice(1).reduce((s2, d) => s2 + prog(t, d.em - 0.35, 0.45, preciso), 0);
    const ultimo = t >= dados[0].em - 0.05 ? Math.min(n - 1, alcance) : -1;
    const k = Math.floor(Math.max(0, ultimo));
    const f = Math.max(0, ultimo) - k;
    const feitos = ultimo < 0 ? [] : pontos.slice(0, k + 1);
    if (ultimo >= 0 && k < n - 1 && f > 0) feitos.push([mistura(pontos[k][0], pontos[k + 1][0], f), mistura(pontos[k][1], pontos[k + 1][1], f)]);
    const poligono = feitos.length > 1 ? `${poli(feitos)}L${feitos[feitos.length - 1][0]} ${yChao}L${feitos[0][0]} ${yChao}Z` : "";
    const id = `terreno-${Math.round(m.de * 100)}`;
    return (
      <g>
        {eixos}
        {chao}
        {poligono ? (
          <>
            <defs>
              <clipPath id={id}>
                <path d={poligono} />
              </clipPath>
            </defs>
            <path d={hachuraRet(area.x, area.y, area.w, yChao - area.y, 20)} stroke={cor.cinzaClaro} strokeWidth={traco.fino} clipPath={`url(#${id})`} />
            <path d={poli(feitos)} fill="none" stroke={cor.grafite} strokeWidth={traco.forte} strokeLinejoin="round" />
          </>
        ) : null}
        {pontos.map((pt, i) => {
          const p = prog(t, dados[i].em - 0.05, 0.35);
          if (p <= 0) return null;
          return (
            <g key={`pt-${i}`}>
              <circle cx={pt[0]} cy={pt[1]} r={9} fill={i === ativo ? cor.acento : cor.grafite} opacity={p} />
              {nivel(i, pt[1] - 4, p)}
            </g>
          );
        })}
        {rotulosSvg}
      </g>
    );
  }

  return (
    <g>
      {eixos}
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.05, 0.75, preciso);
        if (p <= 0) return null;
        const h = altura(d.valor) * p;
        const x = cx(i) - bw / 2;
        const y = yChao - h;
        const ativa = i === ativo;
        return (
          <g key={`bar-${i}`}>
            <rect x={x} y={y} width={bw} height={h} fill={ativa ? cor.acentoVeu : cor.papel} />
            <path d={hachuraRet(x, y, bw, h, 22)} stroke={ativa ? cor.acento : cor.cinzaClaro} strokeWidth={traco.fino} opacity={0.55} />
            <path d={ret(x, y, bw, h)} fill="none" stroke={ativa ? cor.acento : cor.grafite} strokeWidth={traco.medio} />
            {nivel(i, y, p)}
          </g>
        );
      })}
      {chao}
      {rotulosSvg}
    </g>
  );
};

const Pizza: React.FC<{ m: TGrafico; dados: Dado[]; t: number; area: Regiao }> = ({ m, dados, t, area }) => {
  const soma = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const largo = area.w > area.h * 1.2;
  const R = largo ? Math.min(area.h * 0.44, area.w * 0.24) : Math.min(area.w * 0.3, area.h * 0.28);
  const cx = largo ? area.x + R + 16 : area.x + area.w / 2;
  const cy = largo ? area.y + area.h / 2 : area.y + R + 16;
  const casas = casasDe(dados);
  const ativo = dados.reduce((a, d, i) => (t >= d.em - 0.05 ? i : a), -1);
  const pParede = prog(t, m.de + 0.05, 0.8, preciso);
  // ângulos (começa no alto, sentido horário)
  let acum = 0;
  const setores = dados.map((d) => {
    const a0 = acum;
    acum += (Math.max(0, d.valor) / soma) * Math.PI * 2;
    return { a0, a1: acum };
  });
  const ponto = (a: number, r: number): [number, number] => [cx + Math.sin(a) * r, cy - Math.cos(a) * r];
  // legenda: ao lado (largo) ou embaixo
  const lx = largo ? cx + R + 70 : area.x;
  const lw = largo ? area.x + area.w - lx : area.w;
  const ly0 = largo ? area.y : cy + R + 50;
  const lh = largo ? area.h : area.y + area.h - ly0;
  const linhaH = Math.min(lh / dados.length, 130);
  const ly = ly0 + (lh - linhaH * dados.length) / 2;
  const textos = dados.map((d) => `${d.rotulo}`);
  let tam = 46;
  while (tam > 30 && textos.some((tx) => larguraTexto(tx, tam, { peso: 400 }) > lw - 80)) tam -= 2;
  return (
    <g>
      {setores.map((s, i) => {
        const p = prog(t, dados[i].em - 0.05, 0.6, preciso);
        if (p <= 0) return null;
        const a1 = s.a0 + (s.a1 - s.a0) * p;
        const [x0, y0] = ponto(s.a0, R);
        const [x1, y1] = ponto(a1, R);
        const grande = a1 - s.a0 > Math.PI ? 1 : 0;
        const d = `M${cx} ${cy}L${x0} ${y0}A${R} ${R} 0 ${grande} 1 ${x1} ${y1}Z`;
        return <path key={`set-${i}`} d={d} fill={i === ativo ? cor.acentoVeu : "rgba(31,31,29,0.04)"} stroke="none" />;
      })}
      {/* paredes internas (raios) entre os setores ditos */}
      {setores.map((s, i) => {
        const p = prog(t, dados[i].em - 0.05, 0.5, preciso);
        const [x, y] = ponto(s.a0, R);
        return <Traco key={`raio-${i}`} d={lin(cx, cy, x, y)} p={p} cor={cor.grafite} largura={traco.medio} />;
      })}
      {/* parede circular em poché */}
      <Traco d={circ(cx, cy, R)} p={pParede} cor={cor.grafite} largura={14} />
      {setores.map((s, i) => {
        const p = prog(t, dados[i].em + 0.1, 0.45, preciso);
        if (p <= 0) return null;
        const [x, y] = ponto((s.a0 + s.a1) / 2, R * 0.62);
        const corM = i === ativo ? cor.acento : cor.grafite;
        return (
          <g key={`marca-${i}`}>
            <circle cx={x} cy={y} r={24} fill={cor.papel} opacity={limitar(p * 3)} />
            <Traco d={circ(x, y, 24)} p={p} cor={corM} largura={traco.medio} />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontFamily={mono} fontWeight={500} fontSize={ROTULO} fill={corM} opacity={limitar((p - 0.4) * 2.5)}>
              {i + 1}
            </text>
          </g>
        );
      })}
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.05, 0.45);
        const y = ly + i * linhaH + linhaH / 2;
        const corM = i === ativo ? cor.acento : cor.grafite;
        return (
          <g key={`leg-${i}`} opacity={limitar(p * 1.5)} transform={`translate(${(1 - p) * -20} 0)`}>
            <Traco d={circ(lx + 24, y, 22)} p={p} cor={corM} largura={traco.medio} />
            <text x={lx + 24} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontFamily={mono} fontWeight={500} fontSize={ROTULO} fill={corM}>
              {i + 1}
            </text>
            <text x={lx + 66} y={y - 4} fontFamily={sans} fontWeight={400} fontSize={tam} fill={cor.grafite}>
              {d.rotulo}
            </text>
            <text x={lx + 66} y={y + tam * 0.95} fontFamily={sans} fontWeight={300} fontSize={Math.max(32, Math.round(tam * 0.8))} fill={corM}>
              {textoValor(d.valor, casas, m.unidade)}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// Sem números ditos: a forma da tendência, ilustrativa
const Tendencia: React.FC<{ m: TGrafico; t: number; area: Regiao }> = ({ m, t, area }) => {
  const dir = m.tendencia ?? "sobe";
  const em = m.tendenciaEm ?? m.de + 0.3;
  const pDesenho = prog(t, m.de + 0.1, Math.max(0.8, Math.min(1.6, em - m.de)), preciso);
  const pSeta = prog(t, em, 0.9, preciso);
  const x0 = area.x + 20;
  const x1 = area.x + area.w - 20;
  const yBase = area.y + area.h - 40;
  const yTopo = area.y + 40;
  const hachuraChao = (() => {
    const l: string[] = [];
    for (let x = area.x + 6; x < area.x + area.w - 12; x += 16) l.push(lin(x, yBase + 3, x + 13, yBase + 16));
    return l.join("");
  })();
  if (m.forma === "barras" && dir !== "oscila") {
    // prédios crescendo (ou diminuindo), sem valores
    const n = 5;
    const slot = (x1 - x0) / n;
    const bw = slot * 0.56;
    return (
      <g>
        {Array.from({ length: n }, (_, i) => {
          const f = dir === "sobe" ? (i + 1) / n : (n - i) / n;
          const p = prog(t, m.de + 0.15 + i * 0.18, 0.6, preciso);
          const h = (yBase - yTopo - 30) * (0.18 + 0.82 * f) * p;
          const x = x0 + slot * (i + 0.5) - bw / 2;
          const ultima = dir === "sobe" ? i === n - 1 : i === 0;
          const acende = ultima ? prog(t, em, 0.4) : 0;
          return (
            <g key={i}>
              <rect x={x} y={yBase - h} width={bw} height={h} fill={acende > 0.5 ? cor.acentoVeu : cor.papel} />
              <path d={hachuraRet(x, yBase - h, bw, h, 22)} stroke={acende > 0.5 ? cor.acento : cor.cinzaClaro} strokeWidth={traco.fino} opacity={0.55} />
              <path d={ret(x, yBase - h, bw, h)} fill="none" stroke={acende > 0.5 ? cor.acento : cor.grafite} strokeWidth={traco.medio} />
            </g>
          );
        })}
        <Traco d={lin(area.x, yBase, area.x + area.w, yBase)} p={1} cor={cor.grafite} largura={traco.forte + 1.5} />
        <path d={hachuraChao} stroke={cor.cinza} strokeWidth={traco.fino} />
        <Seta pontos={[[x0 + slot * 0.5, yBase - (yBase - yTopo - 30) * (dir === "sobe" ? 0.3 : 1.05) - 50], [x0 + slot * (n - 0.5), yBase - (yBase - yTopo - 30) * (dir === "sobe" ? 1.05 : 0.3) - 50]]} p={pSeta} />
      </g>
    );
  }
  if (dir === "oscila") {
    // corte de terreno ondulado, com hachura por baixo e a circulação seguindo o relevo
    const pts: [number, number][] = [];
    const amp = (yBase - yTopo) * 0.3;
    const meio = (yBase + yTopo) / 2 + 20;
    for (let i = 0; i <= 48; i++) {
      const f = i / 48;
      pts.push([x0 + (x1 - x0) * f, meio - Math.sin(f * Math.PI * 3) * amp * (0.7 + 0.3 * Math.sin(f * 5))]);
    }
    const k = Math.max(1, Math.round(pDesenho * 48));
    const feitos = pts.slice(0, k + 1);
    const id = `oscila-${Math.round(m.de * 100)}`;
    const poligono = `${poli(feitos)}L${feitos[feitos.length - 1][0]} ${yBase}L${feitos[0][0]} ${yBase}Z`;
    return (
      <g>
        <defs>
          <clipPath id={id}>
            <path d={poligono} />
          </clipPath>
        </defs>
        <path d={hachuraRet(area.x, area.y, area.w, yBase - area.y, 20)} stroke={cor.cinzaClaro} strokeWidth={traco.fino} clipPath={`url(#${id})`} />
        <path d={poli(feitos)} fill="none" stroke={cor.grafite} strokeWidth={traco.forte} strokeLinejoin="round" />
        <Traco d={lin(area.x, yBase, area.x + area.w, yBase)} p={pDesenho} cor={cor.grafite} largura={traco.forte + 1.5} />
        <Seta pontos={pts.map(([x, y]) => [x, y - 40] as [number, number])} p={pSeta} />
      </g>
    );
  }
  // escada em elevação: degraus que se desenham; a seta da circulação percorre a escada com o SOBE/DESCE
  const n = 7;
  const sobe = dir === "sobe";
  const passoX = (x1 - x0) / n;
  const passoY = (yBase - yTopo - 40) / n;
  const degraus: [number, number][] = [[x0, yBase]];
  for (let i = 0; i < n; i++) {
    const [x, y] = degraus[degraus.length - 1];
    if (sobe) {
      degraus.push([x, y - passoY]);
      degraus.push([x + passoX, y - passoY]);
    } else {
      degraus.push([x + passoX, y]);
      degraus.push([x + passoX, y + passoY]);
    }
  }
  const inicio: [number, number] = sobe ? [x0, yBase] : [x0, yBase - n * passoY];
  if (!sobe) {
    degraus.length = 0;
    degraus.push(inicio);
    for (let i = 0; i < n; i++) {
      const [x, y] = degraus[degraus.length - 1];
      degraus.push([x + passoX, y]);
      degraus.push([x + passoX, y + passoY]);
    }
  }
  const k = Math.max(1, Math.round(pDesenho * (degraus.length - 1)));
  const feitos = degraus.slice(0, k + 1);
  const id = `escada-${Math.round(m.de * 100)}`;
  const poligono = `${poli(feitos)}L${feitos[feitos.length - 1][0]} ${yBase}L${feitos[0][0]} ${yBase}Z`;
  const a: [number, number] = sobe ? [x0 + passoX * 0.5, yBase - passoY - 46] : [x0 + passoX * 0.5, yBase - n * passoY - 46];
  const b: [number, number] = sobe ? [x1 - passoX * 0.5, yBase - n * passoY - 46] : [x1 - passoX * 0.5, yBase - passoY - 46];
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={poligono} />
        </clipPath>
      </defs>
      <path d={hachuraRet(area.x, area.y, area.w, yBase - area.y, 20)} stroke={cor.cinzaClaro} strokeWidth={traco.fino} clipPath={`url(#${id})`} />
      <path d={poli(feitos)} fill="none" stroke={cor.grafite} strokeWidth={traco.forte} strokeLinejoin="miter" />
      <Traco d={lin(area.x, yBase, area.x + area.w, yBase)} p={pDesenho} cor={cor.grafite} largura={traco.forte + 1.5} />
      <Seta pontos={[a, b]} p={pSeta} />
      <text
        x={a[0] - 8}
        y={a[1] - 30}
        textAnchor="start"
        fontFamily={mono}
        fontWeight={500}
        fontSize={ROTULO + 4}
        letterSpacing="0.14em"
        fill={cor.acento}
        opacity={prog(t, em + 0.2, 0.4)}
      >
        {sobe ? "SOBE" : "DESCE"}
      </text>
    </g>
  );
};

// a seta tracejada da circulação, que se desenha ao longo dos pontos
const Seta: React.FC<{ pontos: [number, number][]; p: number }> = ({ pontos, p }) => {
  if (p <= 0 || pontos.length < 2) return null;
  // comprimento total e ponto final parcial
  const comps = pontos.slice(1).map((b, i) => Math.hypot(b[0] - pontos[i][0], b[1] - pontos[i][1]));
  const total = comps.reduce((s, v) => s + v, 0);
  let resta = total * p;
  const feitos: [number, number][] = [pontos[0]];
  let dir: [number, number] = [1, 0];
  for (let i = 0; i < comps.length; i++) {
    const [ax, ay] = pontos[i];
    const [bx, by] = pontos[i + 1];
    dir = [(bx - ax) / (comps[i] || 1), (by - ay) / (comps[i] || 1)];
    if (resta >= comps[i]) {
      feitos.push(pontos[i + 1]);
      resta -= comps[i];
    } else {
      feitos.push([ax + dir[0] * resta, ay + dir[1] * resta]);
      break;
    }
  }
  const [fx, fy] = feitos[feitos.length - 1];
  const [dx, dy] = dir;
  return (
    <g>
      <circle cx={pontos[0][0]} cy={pontos[0][1]} r={9} fill={cor.acento} />
      <path d={poli(feitos)} fill="none" stroke={cor.acento} strokeWidth={5.5} strokeDasharray="16 11" />
      {p > 0.1 ? (
        <path
          d={poli([
            [fx - dx * 26 - dy * 16, fy - dy * 26 + dx * 16],
            [fx, fy],
            [fx - dx * 26 + dy * 16, fy - dy * 26 - dx * 16],
          ])}
          fill="none"
          stroke={cor.acento}
          strokeWidth={6}
        />
      ) : null}
    </g>
  );
};
