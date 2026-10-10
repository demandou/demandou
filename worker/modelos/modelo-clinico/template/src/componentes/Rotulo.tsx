import { limitar, prog, Traco } from "../anim";
import { larguraTexto, quebrarEquilibrado } from "../medida";
import { cor, ROTULO, sans } from "../tema";

// Rótulo de atlas de anatomia: ponto no desenho, linha-guia com cotovelo e o nome.
// Coordenadas em px do quadro (uso dentro de um <svg> de 1080×1920).
export const Rotulo: React.FC<{
  // ponto apontado
  x: number;
  y: number;
  // direção da linha-guia: dx/dy em px até o cotovelo, depois segue na horizontal
  dx: number;
  dy: number;
  texto: string;
  em: number;
  t: number;
  saida?: number;
  erro?: boolean;
  tamanho?: number;
}> = ({ x, y, dx: dxPedido, dy, texto, em, t, saida = 1, erro, tamanho: tamanhoPedido = ROTULO }) => {
  let tamanho = tamanhoPedido;
  const c = erro ? cor.vermelho : cor.azul;
  const ponto = prog(t, em, 0.25);
  const linha = prog(t, em + 0.05, 0.3);
  const txt = prog(t, em + 0.15, 0.3);
  if (ponto <= 0) return null;
  // o nome cabe sempre: mede com a fonte de verdade, reduz até 36 px e, se ainda não couber
  // do lado com mais espaço, quebra em duas linhas
  const espacoMax = Math.max(1050 - (x + Math.max(dxPedido, 24)) - 48, x + Math.min(dxPedido, -24) - 48 - 30, 1050 - x - 72, x - 102);
  while (tamanho > 36 && larguraTexto(texto, tamanho, 700) > espacoMax) tamanho -= 2;
  let linhas = [texto];
  if (larguraTexto(texto, tamanho, 700) > espacoMax && texto.includes(" ")) {
    tamanho = Math.min(tamanhoPedido, 46);
    linhas = quebrarEquilibrado(texto, espacoMax, tamanho, 700);
    while (tamanho > 34 && (linhas.length > 2 || linhas.some((l) => larguraTexto(l, tamanho, 700) > espacoMax))) {
      tamanho -= 2;
      linhas = quebrarEquilibrado(texto, espacoMax, tamanho, 700);
    }
  }
  const largura = Math.max(...linhas.map((l) => larguraTexto(l, tamanho, 700))) + 10;
  // o nome nunca sai do quadro: encurta a linha-guia ou vira para o outro lado
  let dx = dxPedido;
  const cabeDireita = (d: number) => x + d + 48 + largura <= 1050;
  const cabeEsquerda = (d: number) => x + d - 48 - largura >= 30;
  if (dx >= 0 && !cabeDireita(dx)) dx = cabeDireita(24) ? Math.max(24, 1050 - largura - 48 - x) : -Math.abs(dx);
  if (dx < 0 && !cabeEsquerda(dx)) dx = cabeEsquerda(-24) ? Math.min(-24, 30 + largura + 48 - x) : Math.abs(dx);
  const direita = dx >= 0;
  const cx = x + dx;
  const cy = y + dy;
  const fim = cx + (direita ? 34 : -34);
  return (
    <g opacity={saida}>
      <Traco d={`M ${x} ${y} L ${cx} ${cy} L ${fim} ${cy}`} p={linha} cor={c} largura={3.5} />
      <circle cx={x} cy={y} r={13 * ponto} fill={cor.branco} />
      <circle cx={x} cy={y} r={8.5 * ponto} fill={c} />
      <g>
        <clipPath id={`rot-${Math.round(x)}-${Math.round(y)}-${Math.round(em * 100)}`}>
          <rect
            x={direita ? fim + 8 : fim - 8 - largura * txt}
            y={cy - tamanho * linhas.length}
            width={largura * limitar(txt)}
            height={tamanho * 2 * linhas.length}
          />
        </clipPath>
        <text
          dominantBaseline="central"
          textAnchor={direita ? "start" : "end"}
          clipPath={`url(#rot-${Math.round(x)}-${Math.round(y)}-${Math.round(em * 100)})`}
          style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanho, fill: erro ? cor.vermelho : cor.tinta }}
        >
          {linhas.map((l, i) => (
            <tspan key={i} x={direita ? fim + 14 : fim - 14} y={cy + (i - (linhas.length - 1) / 2) * tamanho * 1.08}>
              {l}
            </tspan>
          ))}
        </text>
      </g>
    </g>
  );
};
