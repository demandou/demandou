import { Datilo, mistura, preciso, prog, saindo } from "../anim";
import { CANTO_FOTO, type Regiao } from "../layout";
import { larguraTexto } from "../medida";
import type { Escala as TEscala } from "../plano";
import { cor, mono, QUADRO, rotulo, sans } from "../tema";

const CRESCE = 0.9;

// Figura de braços abertos, em unidades da altura da figura (u: -0,5..0,5 na horizontal, v: 0 = pés, 1 = topo)
const CONTORNO_FIGURA: [number, number][] = [
  [0.084, 0],
  [0.097, 0.1],
  [0.107, 0.4],
  [0.117, 0.62],
  [0.126, 0.7],
  // manga caída embaixo do braço
  [0.2, 0.735],
  [0.3, 0.764],
  [0.42, 0.779],
  [0.472, 0.787],
  [0.476, 0.832],
  [0.3, 0.843],
  [0.16, 0.855],
  [0.09, 0.872],
  [0.042, 0.886],
];
const CABECA = { v: 0.935, r: 0.056 };

// Régua de perícia (a régua listrada das fotos de evidência), crescendo de baixo para cima por partes,
// ao lado do objeto medido. O número grande soma as partes conforme elas são ditas.
// No quadro deitado (layout canto: a folha inteira, com a foto no canto de cima à direita) o título
// e o número ficam numa coluna à esquerda; a régua e o objeto usam a altura toda ao lado dela, sempre
// à esquerda da coluna da foto (nada passa por baixo dela).
export const Escala: React.FC<{ m: TEscala; t: number; fim: number; regiao: Regiao }> = ({ m, t, fim, regiao }) => {
  const sai = saindo(t, fim, 0.28);
  const entra = prog(t, m.de, 0.5);
  // uma parte dita antes de a folha aparecer começa a ser medida quando ela aparece
  const partes = m.partes.slice(0, 4).map((p) => ({ ...p, em: Math.max(p.em, m.de + 0.15) }));
  const total = partes.reduce((s, p) => s + p.valor, 0) || 1;
  const desenho = m.desenho ?? "blocos";

  // geometria em px: a base do desenho fica embaixo da região; a régua começa depois da coluna do
  // título e o objeto fica entre os rótulos das partes e a coluna da foto
  const COLUNA_TITULO = 560;
  const ROTULOS = 260;
  const base = regiao.y + regiao.h - 40;
  const topoMax = regiao.y + 60;
  const reguaX = regiao.x + COLUNA_TITULO;
  const reguaL = 34;
  const zonaX0 = reguaX + reguaL + 26 + ROTULOS;
  const zonaX1 = Math.min(regiao.x + regiao.w, CANTO_FOTO.x) - 24;
  const larguraZona = Math.max(200, zonaX1 - zonaX0);
  const cx = (zonaX0 + zonaX1) / 2;
  // a escala cabe na altura e o desenho cabe na largura da zona (a estátua abre os braços; a torre
  // tem a base larga; os blocos se limitam sozinhos)
  const valorFigura = partes[partes.length - 1]?.valor ?? total;
  const largoPorUnidade = desenho === "estatua" ? 0.96 * valorFigura : desenho === "torre" ? 0.3 * total : 0;
  const escala = Math.min((base - topoMax) / total, largoPorUnidade > 0 ? larguraZona / largoPorUnidade : Infinity);
  // o número do título cabe na coluna dele
  const textoSoma = String(Math.round(total));
  const larguraSoma = (k: number) => larguraTexto(textoSoma, 176 * k, { peso: 800 }) + 14 + larguraTexto(m.unidade, 76 * k, { peso: 700 });
  const fatorNumero = Math.max(0.5, Math.min(1, (COLUNA_TITULO - 120) / Math.max(1, larguraSoma(1))));
  const yDe = (metros: number) => base - metros * escala;

  // quanto de cada parte já foi medido (0→1)
  const medido = partes.map((p) => prog(t, p.em, CRESCE, preciso));
  const inicioDe = (i: number) => partes.slice(0, i).reduce((s, p) => s + p.valor, 0);
  const soma = partes.reduce((s, p, i) => s + p.valor * medido[i], 0);
  const ultima = partes.length - 1;
  const corDa = (i: number) => (i === ultima ? cor.tinta : cor.vermelho);

  // ----- o objeto -----
  const alturaFigura = partes[ultima]?.valor ?? total;
  const hFig = alturaFigura * escala;
  const figura = (() => {
    const b = yDe(inicioDe(ultima));
    const pts = CONTORNO_FIGURA.map(([u, v]) => [cx + u * hFig, b - v * hFig] as const);
    const esquerda = pts.map(([x, y]) => `${2 * cx - x},${y}`).reverse();
    return `M ${[...pts.map(([x, y]) => `${x},${y}`), ...esquerda].join(" L ")} Z`;
  })();

  const formaParte = (i: number) => {
    const y0 = yDe(inicioDe(i));
    const y1 = yDe(inicioDe(i) + partes[i].valor);
    if (desenho === "estatua" && i < ultima) {
      // pedestal em degraus
      const h = y0 - y1;
      const w = hFig * 0.34;
      const d = [
        [w * 0.56, 0],
        [w * 0.56, h * 0.14],
        [w * 0.47, h * 0.14],
        [w * 0.47, h * 0.86],
        [w * 0.52, h * 0.86],
        [w * 0.52, h],
      ];
      const dir = d.map(([x, y]) => `${cx + x},${y0 - y}`);
      const esq = d.map(([x, y]) => `${cx - x},${y0 - y}`).reverse();
      return `M ${[...dir, ...esq].join(" L ")} Z`;
    }
    if (desenho === "torre") {
      const larg = (m2: number) => mistura(total * 0.3, total * 0.07, m2 / total) * escala;
      const a = inicioDe(i);
      const b = a + partes[i].valor;
      if (i === ultima) {
        return `M ${cx - larg(a) / 2},${y0} L ${cx + larg(a) / 2},${y0} L ${cx},${y1} Z`;
      }
      return `M ${cx - larg(a) / 2},${y0} L ${cx + larg(a) / 2},${y0} L ${cx + larg(b) / 2},${y1} L ${cx - larg(b) / 2},${y1} Z`;
    }
    const w = Math.min(total * escala * 0.42, 440, larguraZona) * (1 - i * 0.12);
    return `M ${cx - w / 2},${y0} L ${cx + w / 2},${y0} L ${cx + w / 2},${y1} L ${cx - w / 2},${y1} Z`;
  };

  const formas = partes.map((_, i) => (desenho === "estatua" && i === ultima ? figura : formaParte(i)));
  const contorno = prog(t, m.de, 0.45, preciso);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - sai) * entra, translate: `${-sai * 60}px ${(1 - entra) * 30}px` }}>
      {/* título: rótulo e o número que soma as partes */}
      <div style={{ position: "absolute", left: regiao.x + 16, top: regiao.y + 34, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...rotulo, fontSize: 30, color: cor.vermelho }}>{m.rotulo ?? "Medida"}</div>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: Math.round(176 * fatorNumero), lineHeight: 0.9, color: cor.tinta, letterSpacing: "-0.02em", display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(soma)}</span>
          <span style={{ fontSize: Math.round(76 * fatorNumero), fontWeight: 700 }}>{m.unidade}</span>
        </div>
      </div>

      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <pattern id="hachura-escala" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="16" stroke={cor.vermelho} strokeWidth="4" />
          </pattern>
          {formas.map((_, i) => {
            const y0 = yDe(inicioDe(i));
            const y1 = yDe(inicioDe(i) + partes[i].valor);
            // a figura ocupa acima da própria parte (braços e cabeça ficam dentro da faixa)
            const topo = i === ultima ? Math.min(y1, yDe(total)) - 10 : y1;
            const hVisivel = (y0 - topo) * medido[i];
            return (
              <clipPath key={i} id={`revela-${i}`}>
                <rect x={0} y={y0 - hVisivel} width={QUADRO.w} height={hVisivel + 2} />
              </clipPath>
            );
          })}
        </defs>

        {/* chão */}
        <line x1={reguaX} x2={zonaX1 + 24} y1={base} y2={base} stroke={cor.tinta} strokeWidth={4} strokeDasharray={`${(zonaX1 + 24 - reguaX) * contorno} ${zonaX1 + 24 - reguaX}`} />

        {/* contorno fantasma do objeto inteiro, antes de medir */}
        {formas.map((d, i) => (
          <path key={`f-${i}`} d={d} fill="none" stroke={cor.tinta} strokeOpacity={0.35} strokeWidth={2.5} strokeDasharray="10 8" opacity={contorno} />
        ))}

        {desenho === "estatua" ? (
          <circle cx={cx} cy={yDe(inicioDe(ultima)) - hFig * CABECA.v} r={hFig * CABECA.r} fill="none" stroke={cor.tinta} strokeOpacity={0.35} strokeWidth={2.5} strokeDasharray="10 8" opacity={contorno} />
        ) : null}

        {/* partes medidas: sobem com a régua */}
        {formas.map((d, i) => (
          <g key={`p-${i}`} clipPath={`url(#revela-${i})`}>
            {i === ultima ? (
              <path d={d} fill={cor.tinta} />
            ) : (
              <path d={d} fill="url(#hachura-escala)" stroke={cor.vermelho} strokeWidth={4} />
            )}
          </g>
        ))}
        {desenho === "estatua" ? (
          <g clipPath={`url(#revela-${ultima})`}>
            <circle cx={cx} cy={yDe(inicioDe(ultima)) - hFig * CABECA.v} r={hFig * CABECA.r} fill={cor.tinta} />
            {/* dobras do manto */}
            {[-0.045, 0.02, 0.06].map((u, k) => (
              <line
                key={k}
                x1={cx + u * hFig}
                x2={cx + u * hFig * 1.15}
                y1={yDe(inicioDe(ultima)) - hFig * 0.04}
                y2={yDe(inicioDe(ultima)) - hFig * (0.5 + k * 0.06)}
                stroke={cor.papel}
                strokeOpacity={0.28}
                strokeWidth={2.5}
              />
            ))}
          </g>
        ) : null}

        {/* régua: moldura e listras de 2 em 2 unidades, cor da parte */}
        {partes.map((p, i) => {
          const a = inicioDe(i);
          const passo = total > 60 ? 10 : total > 20 ? 2 : 1;
          const n = Math.ceil(p.valor / passo);
          const alturaMedida = p.valor * escala * medido[i];
          return (
            <g key={`r-${i}`}>
              {Array.from({ length: n }, (_, k) => {
                const y0 = yDe(a + k * passo);
                const h = Math.min(passo, p.valor - k * passo) * escala;
                const visivel = Math.max(0, Math.min(h, alturaMedida - k * passo * escala));
                if (visivel <= 0 || k % 2 === 1) return null;
                return <rect key={k} x={reguaX} y={y0 - visivel} width={reguaL} height={visivel} fill={corDa(i)} />;
              })}
              {alturaMedida > 0 ? (
                <rect x={reguaX} y={yDe(a) - alturaMedida} width={reguaL} height={alturaMedida} fill="none" stroke={corDa(i)} strokeWidth={3} />
              ) : null}
            </g>
          );
        })}

        {/* linhas de chamada das divisas até o objeto */}
        {partes.map((p, i) => {
          const topoParte = inicioDe(i) + p.valor;
          const y = yDe(topoParte);
          const q = prog(t, p.em + CRESCE - 0.1, 0.4, preciso);
          const ate = i === ultima && desenho === "estatua" ? cx - hFig * 0.05 : cx - 40;
          return (
            <line
              key={`c-${i}`}
              x1={reguaX + reguaL + 8}
              x2={mistura(reguaX + reguaL + 8, ate, q)}
              y1={y}
              y2={y}
              stroke={corDa(i)}
              strokeWidth={2.5}
              strokeDasharray="8 7"
              opacity={q > 0 ? 0.8 : 0}
            />
          );
        })}
      </svg>

      {/* marcas numéricas da régua (à esquerda) */}
      {[0, ...partes.map((_, i) => inicioDe(i) + partes[i].valor)].map((v, k) => {
        const i = k - 1;
        const q = k === 0 ? contorno : prog(t, partes[i].em + CRESCE - 0.15, 0.3);
        return (
          <div
            key={`n-${k}`}
            style={{
              position: "absolute",
              right: QUADRO.w - reguaX + 12,
              top: yDe(v) - 19,
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 36,
              lineHeight: "38px",
              color: k === 0 ? cor.grafite : corDa(i),
              opacity: q,
            }}
          >
            {v}
          </div>
        );
      })}

      {/* nome e valor de cada parte, no meio da sua faixa */}
      {partes.map((p, i) => {
        const meio = yDe(inicioDe(i) + p.valor / 2);
        const alturaFaixa = p.valor * escala;
        const compacto = alturaFaixa < 120;
        return (
          <div
            key={`l-${i}`}
            style={{
              position: "absolute",
              left: reguaX + reguaL + 26,
              top: meio - (compacto ? 22 : 50),
              display: "flex",
              flexDirection: compacto ? "row" : "column",
              alignItems: compacto ? "baseline" : "flex-start",
              gap: compacto ? 14 : 4,
              opacity: t >= p.em ? 1 : 0,
            }}
          >
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 60, lineHeight: 1, color: corDa(i), background: cor.papel, paddingRight: 8 }}>
              <Datilo texto={`${p.valor} ${m.unidade}`} em={p.em} t={t} semente={30 + i} cursor={false} />
            </div>
            <div style={{ ...rotulo, fontSize: 30, color: cor.grafite, background: cor.papel, padding: "4px 8px 4px 0" }}>
              <Datilo texto={p.rotulo} em={p.em + 0.2} t={t} semente={40 + i} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
