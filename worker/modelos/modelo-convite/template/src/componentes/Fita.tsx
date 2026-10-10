import { mistura, prog, troca } from "../anim";
import { E, largura } from "../medida";
import { cor, FITA, gravado, TAM, W } from "../tema";

// Uma marca impressa na fita: o número do marco (12, 9, 6…) ou o passo (I, II, III), e quando é dito.
export type MarcaDaFita = { rotulo: string; em: number };

// corpo dos números impressos: 40 px, menor só se o rótulo for largo para a distância entre marcas
const corpoDaMarca = (rotulo: string, n: number) => {
  const espaco = n <= 1 ? 200 : Math.min(150, (FITA.x1 - FITA.x0) / (n - 1) - 30);
  const w = largura(rotulo, 100, E.numero) / 100;
  return Math.max(30, Math.min(TAM.numeroFita, espaco / Math.max(0.01, w)));
};

export const posicoesDosMarcos = (n: number) =>
  n <= 1 ? [W / 2] : Array.from({ length: n }, (_, i) => FITA.x0 + (i * (FITA.x1 - FITA.x0)) / (n - 1));

// a linha do meio da fita ondula de leve (cetim solto sobre o linho)
const meio = (x: number, y0: number) => y0 + FITA.onda * Math.sin(x / 165 + 0.6);
const inclinacao = (x: number) => ((FITA.onda / 165) * Math.cos(x / 165 + 0.6) * 180) / Math.PI;

// até onde a fita já se desenrolou no instante t (a ponta do rolo, em px)
export const pontaDaFita = (marcos: MarcaDaFita[], t: number, entra: number, sai: number) => {
  const xs = posicoesDosMarcos(marcos.length);
  // o rolo aparece na ponta solta (à esquerda) e começa a correr junto com o cronograma
  let x = mistura(FITA.inicio + 8, FITA.inicio + 70, prog(t, entra, 0.7));
  marcos.forEach((m, i) => {
    x = mistura(x, xs[i] + 74, prog(t, m.em - 0.12, 0.75, troca));
  });
  // no fim do cronograma o rolo corre até o fim da tela
  return mistura(x, W + 140, prog(t, sai, 0.9, troca));
};

// faixa da fita entre x0 e x1, deslocada (d) da linha do meio: um polígono que segue a onda
const faixa = (x0: number, x1: number, y0: number, d0: number, d1: number) => {
  const passo = 18;
  const cima: string[] = [];
  const baixo: string[] = [];
  for (let x = x0; x <= x1 + passo; x += passo) {
    const xx = Math.min(x, x1);
    cima.push(`${xx.toFixed(1)},${(meio(xx, y0) + d0).toFixed(1)}`);
    baixo.unshift(`${xx.toFixed(1)},${(meio(xx, y0) + d1).toFixed(1)}`);
    if (xx === x1) break;
  }
  return `M${cima.join(" L")} L${baixo.join(" L")} Z`;
};

const fio = (x0: number, x1: number, y0: number, d: number) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 18) pts.push(`${x.toFixed(1)},${(meio(x, y0) + d).toFixed(1)}`);
  // fita ainda curta demais para o fio: só o ponto inicial (caminho vazio dá erro no navegador)
  if (pts.length === 0) pts.push(`${x0.toFixed(1)},${(meio(x0, y0) + d).toFixed(1)}`);
  return `M${pts.join(" L")}`;
};

// A fita de cetim chocolate que se desenrola da esquerda para a direita com os marcos impressos.
export const Fita: React.FC<{
  marcos: MarcaDaFita[];
  t: number;
  entra: number;
  sai: number;
  visivel: number;
  y?: number;
  // identificador da fita (cada sequência tem a sua) e quando ela sai da mesa
  id?: string;
  some?: number;
}> = ({ marcos, t, entra, sai, visivel, y = FITA.y, id = "a", some }) => {
  if (visivel <= 0.001 || marcos.length === 0) return null;
  // quando outra sequência começa, esta fita sai da mesa (desliza para a direita e some)
  const pSome = some === undefined ? 0 : prog(t, some, 0.45, troca);
  if (pSome >= 0.999) return null;
  const xs = posicoesDosMarcos(marcos.length);
  const ponta = pontaDaFita(marcos, t, entra, sai);
  const a = FITA.altura;
  let atual = -1;
  marcos.forEach((m, i) => {
    if (t >= m.em - 0.12) atual = i;
  });
  const x0 = FITA.inicio;
  const fim = Math.min(W + 60, Math.max(x0 + 30, ponta + 4));
  const yPonta = meio(Math.min(W, Math.max(0, ponta)), y);
  const topoSvg = y - a / 2 - 60;
  const altSvg = a + 120;
  // a ponta solta da fita, à esquerda, cortada em rabo de andorinha
  const comCauda = (d0: number, d1: number, dy = 0) => {
    const corpo = faixa(x0, fim, y + dy, d0, d1).replace(/ Z$/, "");
    return `${corpo} L${x0 + 24},${(meio(x0, y + dy) + (d0 + d1) / 2).toFixed(1)} Z`;
  };
  const pDobra = ponta < W + 40 ? 1 : 0;
  return (
    <svg width={W} height={altSvg} viewBox={`0 ${topoSvg} ${W} ${altSvg}`} style={{ position: "absolute", left: 0, top: topoSvg, overflow: "visible", opacity: Math.min(1, visivel * 1.5) * prog(t, entra, 0.3) * (1 - pSome), translate: `${pSome * 160}px 0` }}>
      <defs>
        <linearGradient id={`fita-cetim-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={y - a / 2 - FITA.onda} x2="0" y2={y + a / 2 + FITA.onda}>
          <stop offset="0%" stopColor={cor.fitaSombra} />
          <stop offset="16%" stopColor={cor.fita} />
          <stop offset="34%" stopColor="#7E5747" />
          <stop offset="58%" stopColor={cor.fita} />
          <stop offset="100%" stopColor={cor.fitaSombra} />
        </linearGradient>
        <linearGradient id={`fita-rolo-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={cor.fitaSombra} />
          <stop offset="34%" stopColor="#B08876" />
          <stop offset="52%" stopColor="#8E6656" />
          <stop offset="100%" stopColor={cor.fitaSombra} />
        </linearGradient>
        {/* faixas de luz atravessando o cetim, em intervalos irregulares */}
        <linearGradient id={`fita-reflexo-${id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="460" y2="0" spreadMethod="repeat">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="14%" stopColor="#FFE9DD" stopOpacity={0.2} />
          <stop offset="22%" stopColor="#FFFFFF" stopOpacity={0.04} />
          <stop offset="40%" stopColor="#FFE9DD" stopOpacity={0.12} />
          <stop offset="58%" stopColor="#000000" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        {/* a dobra onde a fita sai do rolo: um vinco de luz */}
        <linearGradient id={`fita-dobra-${id}`} gradientUnits="userSpaceOnUse" x1={ponta - 46} y1="0" x2={ponta} y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="55%" stopColor="#FFE9DD" stopOpacity={0.3} />
          <stop offset="80%" stopColor="#000000" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.3} />
        </linearGradient>
        {/* o risco a lápis se interrompe em volta de cada número */}
        <mask id={`fita-furos-${id}`} maskUnits="userSpaceOnUse" x="0" y={y - 120} width={W} height={240}>
          <rect x={0} y={y - 120} width={W} height={240} fill="white" />
          {xs.map((x, i) => (
            <rect key={i} x={x - 28} y={meio(x, y) - 28} width={56} height={56} fill="black" />
          ))}
        </mask>
        <filter id={`fita-sombra-${id}`} x="-10%" y="-80%" width="120%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`fita-luz-${id}`} x="-5%" y="-200%" width="110%" height="500%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* o caminho da fita já riscado a lápis no linho, com os marcos que ainda vão chegar */}
      <path d={fio(x0 + 20, FITA.x1 + 90, y, 0)} mask={`url(#fita-furos-${id})`} fill="none" stroke={cor.linhoLapis} strokeWidth={2.6} strokeDasharray="3 11" strokeLinecap="round" opacity={prog(t, entra, 0.9)} />
      {marcos.map((m, i) => (
        <text
          key={`lapis-${m.rotulo}-${i}`}
          x={xs[i]}
          y={meio(xs[i], y) + corpoDaMarca(m.rotulo, marcos.length) * 0.36}
          textAnchor="middle"
          fontFamily={gravado}
          fontWeight={600}
          fontSize={corpoDaMarca(m.rotulo, marcos.length)}
          fill={cor.linhoLapis}
          opacity={xs[i] > fim - 30 ? prog(t, entra + 0.15 + i * 0.08, 0.5) : 0}
        >
          {m.rotulo}
        </text>
      ))}

      {fim > x0 + 30 ? (
        <>
          {/* sombra no linho */}
          <path d={comCauda(-a / 2, a / 2, 10)} fill="rgba(30,44,62,0.3)" filter={`url(#fita-sombra-${id})`} />
          {/* o cetim */}
          <path d={comCauda(-a / 2, a / 2)} fill={`url(#fita-cetim-${id})`} />
          <path d={comCauda(-a / 2, a / 2)} fill={`url(#fita-reflexo-${id})`} />
          {/* o brilho comprido do cetim, correndo ao longo da fita */}
          <path d={fio(x0 + 30, fim - 8, y, -a * 0.16)} fill="none" stroke="#F3D9CB" strokeOpacity={0.32} strokeWidth={7} strokeLinecap="round" filter={`url(#fita-luz-${id})`} />
          <path d={fio(x0 + 30, fim - 8, y, -a * 0.16)} fill="none" stroke="#FFF1E8" strokeOpacity={0.22} strokeWidth={1.6} strokeLinecap="round" />
          {/* ourela: um fio mais claro em cada borda */}
          <path d={fio(x0 + 4, fim, y, -a / 2 + 2.5)} fill="none" stroke="#C49C89" strokeOpacity={0.5} strokeWidth={1.3} />
          <path d={fio(x0 + 4, fim, y, a / 2 - 2.5)} fill="none" stroke={cor.fitaSombra} strokeOpacity={0.7} strokeWidth={1.3} />
          {/* a dobra junto do rolo */}
          {pDobra ? <path d={faixa(Math.max(x0 + 26, ponta - 46), fim, y, -a / 2, a / 2)} fill={`url(#fita-dobra-${id})`} /> : null}
        </>
      ) : null}
      {/* losangos entre os marcos e os números impressos */}
      {xs.slice(0, -1).map((x, i) => {
        const xm = (x + xs[i + 1]) / 2;
        if (xm > fim - 40) return null;
        const ym = meio(xm, y);
        return <path key={`l${i}`} d={`M${xm} ${ym - 5} L${xm + 5} ${ym} L${xm} ${ym + 5} L${xm - 5} ${ym} Z`} fill={cor.papel} opacity={0.6} />;
      })}
      {marcos.map((m, i) => {
        if (xs[i] > fim - 44) return null;
        const agora = atual === i;
        const brilho = agora ? 1 : atual > i ? 0.62 : 0.85;
        return (
          <text
            key={`${m.rotulo}-${i}`}
            x={xs[i]}
            y={meio(xs[i], y) + corpoDaMarca(m.rotulo, marcos.length) * 0.36}
            textAnchor="middle"
            fontFamily={gravado}
            fontWeight={700}
            fontSize={corpoDaMarca(m.rotulo, marcos.length)}
            fill={cor.papel}
            opacity={brilho}
            transform={`rotate(${inclinacao(xs[i]).toFixed(2)} ${xs[i]} ${meio(xs[i], y)})`}
          >
            {m.rotulo}
          </text>
        );
      })}

      {/* o rolo de cetim que corre na ponta (fino, com o brilho do tecido) */}
      {ponta < W + 100 ? (
        <g transform={`translate(${ponta} ${yPonta - y}) rotate(${inclinacao(ponta).toFixed(2)} 0 ${y})`}>
          <rect x={-4} y={y - a / 2 - 6} width={32} height={a + 12} rx={10} fill="rgba(30,44,62,0.28)" filter={`url(#fita-sombra-${id})`} transform="translate(4 8)" />
          <rect x={-4} y={y - a / 2 - 5} width={30} height={a + 10} rx={10} fill={`url(#fita-rolo-${id})`} />
          <line x1={7} x2={7} y1={y - a / 2 - 1} y2={y + a / 2 + 1} stroke="#E8C8B8" strokeOpacity={0.35} strokeWidth={1.4} />
        </g>
      ) : null}
    </svg>
  );
};
