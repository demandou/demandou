// Peças da prancheta: ficha de jogador, bola e etiqueta. Desenho chapado, sem brilho.
import { conteudoDaTarja, prog, varredura } from "../anim";
import { medir, quebrarMedindo } from "../medidas";
import { cor, rotulo } from "../tema";

const pentagono = (cx: number, cy: number, k: number, giro: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = ((-90 + 72 * i + giro) * Math.PI) / 180;
    return `${(cx + Math.cos(a) * k).toFixed(1)},${(cy + Math.sin(a) * k).toFixed(1)}`;
  }).join(" ");

// Bola clássica: gomo central escuro e cinco gomos cortados pela borda, que giram quando ela rola
export const BolaSvg: React.FC<{ x: number; y: number; r: number; giro?: number; sombra?: boolean; opacidade?: number }> = ({
  x,
  y,
  r,
  giro = 0,
  sombra = true,
  opacidade = 1,
}) => {
  const id = `bola-${Math.round(x)}-${Math.round(y)}-${Math.round(r)}`;
  return (
    <g opacity={opacidade}>
      {sombra ? <ellipse cx={x + r * 0.15} cy={y + r * 0.92} rx={r * 0.95} ry={r * 0.3} fill="rgba(0,0,0,0.28)" /> : null}
      <defs>
        <clipPath id={id}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r} fill="#FBFBF7" />
      <g clipPath={`url(#${id})`}>
        <polygon points={pentagono(x, y, r * 0.38, giro)} fill={cor.tv} />
        {Array.from({ length: 5 }, (_, i) => {
          const a = ((-90 + 36 + 72 * i + giro) * Math.PI) / 180;
          return <polygon key={i} points={pentagono(x + Math.cos(a) * r * 1.02, y + Math.sin(a) * r * 1.02, r * 0.34, giro + 36)} fill={cor.tv} />;
        })}
        {/* sombra própria embaixo, para a bola ter volume sem brilho */}
        <circle cx={x - r * 0.25} cy={y - r * 0.3} r={r * 1.25} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth={r * 0.5} />
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="rgba(11,16,22,0.55)" strokeWidth={Math.max(1.5, r * 0.07)} />
    </g>
  );
};

// Ficha de jogador: disco em pé sobre o campo (com sombra no chão) e o número
export const Ficha: React.FC<{
  x: number;
  y: number;
  r: number;
  time: "nosso" | "adversario" | "goleiro";
  numero?: string;
  // 0→1 entrada (cresce do chão)
  p?: number;
  fonte: string;
}> = ({ x, y, r, time, numero, p = 1, fonte }) => {
  if (p <= 0.001) return null;
  const fundo = time === "nosso" ? cor.placar : time === "goleiro" ? cor.giz : cor.tv;
  const tinta = time === "adversario" ? cor.giz : cor.tv;
  const borda = time === "adversario" ? cor.giz : cor.tv;
  const cy = y - r * 0.62;
  return (
    <g opacity={Math.min(1, p * 1.6)}>
      <ellipse cx={x} cy={y + r * 0.12} rx={r * 0.98 * p} ry={r * 0.34 * p} fill="rgba(0,0,0,0.30)" />
      <g transform={`translate(${x} ${y}) scale(${0.4 + 0.6 * p}) translate(${-x} ${-y})`}>
        <circle cx={x} cy={cy} r={r} fill={fundo} stroke={borda} strokeWidth={time === "adversario" ? 3.5 : 3} />
        {numero ? (
          <text
            x={x}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill={tinta}
            style={{ fontFamily: fonte, fontWeight: 800, fontStretch: "112.5%", fontSize: Math.max(34, r * 0.9) }}
          >
            {numero}
          </text>
        ) : null}
      </g>
    </g>
  );
};

// Etiqueta de TV: tarja escura com a barra amarela à esquerda. Âncora no meio de cima ou de baixo.
// O fundo entra varrendo; o texto aparece inteiro (nunca cortado) quando o fundo já abriu.
export const Etiqueta: React.FC<{
  texto: string;
  x: number;
  y: number;
  ancora?: "acima" | "abaixo";
  t: number;
  em: number;
  tamanho?: number;
  // não deixa a etiqueta sair da tela
  limites?: [number, number];
}> = ({ texto, x, y, ancora = "acima", t, em, tamanho = 40, limites = [60, 1020] }) => {
  const p = prog(t, em, 0.42);
  if (p <= 0.001) return null;
  const maxLargura = limites[1] - limites[0];
  // corpo que cabe (rótulo semi-largo em caixa-alta, espaçado), sem descer de 34 px
  const folga = 64;
  const tam = Math.max(34, Math.min(tamanho, Math.floor(((maxLargura - folga) / Math.max(1, medir(texto, 100, "rotulo", 0.07))) * 100)));
  const larguraTexto = medir(texto, tam, "rotulo", 0.07);
  // se nem em 34 px couber numa linha, quebra em duas
  const duasLinhas = larguraTexto + folga > maxLargura;
  const linhas = duasLinhas ? quebrarMedindo(texto.toUpperCase(), tam, maxLargura - folga, 2, "rotulo", 0.07) : [texto];
  const largura = Math.min(maxLargura, Math.max(...linhas.map((l) => medir(l, tam, "rotulo", 0.07))) + folga);
  const altura = linhas.length * tam * 1.15 + 32;
  const esquerda = Math.min(limites[1] - largura, Math.max(limites[0], x - largura / 2));
  return (
    <div
      style={{
        position: "absolute",
        left: esquerda,
        top: ancora === "acima" ? y - altura : y,
        width: largura,
        height: altura,
        translate: `${(1 - p) * -18}px 0`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, clipPath: varredura(p, 6), background: cor.tv, borderRadius: 6, boxShadow: "0 8px 22px rgba(0,0,0,0.28)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: cor.placar }} />
      </div>
      <div style={{ position: "absolute", inset: 0, paddingLeft: 32, display: "flex", flexDirection: "column", justifyContent: "center", ...conteudoDaTarja(p) }}>
        {linhas.map((l, i) => (
          <span key={i} style={{ ...rotulo, fontSize: tam, lineHeight: 1.15, color: cor.giz, whiteSpace: "nowrap" }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};
