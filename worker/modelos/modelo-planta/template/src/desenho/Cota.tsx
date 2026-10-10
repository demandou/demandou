import { Traco } from "../anim";
import { cor as paleta, mono, ROTULO, traco } from "../tema";
import { lin } from "./geometria";

// Linha de cota de arquitetura: linhas de chamada, traço de medida com tiques a 45° e o texto
// acima (horizontal) ou ao lado (vertical). `p` faz a cota crescer a partir do primeiro ponto.
export const Cota: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  p?: number;
  cor?: string;
  texto?: string;
  tamanhoTexto?: number;
  opacidadeTexto?: number;
  // desloca o texto para o outro lado da linha
  inverterTexto?: boolean;
  chamada?: boolean;
}> = ({ x1, y1, x2, y2, p = 1, cor = paleta.grafite, texto, tamanhoTexto = ROTULO, opacidadeTexto = 1, inverterTexto, chamada = true }) => {
  if (p <= 0.002) return null;
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
  const xf = x1 + (x2 - x1) * p;
  const yf = y1 + (y2 - y1) * p;
  const comprimento = Math.hypot(xf - x1, yf - y1);
  const t = 9;
  const tique = (x: number, y: number) => lin(x - t, y + t, x + t, y - t);
  const ch = 16;
  const chamadaEm = (x: number, y: number) => (horizontal ? lin(x, y - ch, x, y + ch) : lin(x - ch, y, x + ch, y));
  const largTexto = texto ? texto.length * tamanhoTexto * 0.6 : 0;
  const mx = (x1 + xf) / 2;
  const my = (y1 + yf) / 2;
  const tx = horizontal ? mx : inverterTexto ? x1 - 18 - largTexto : x1 + 18;
  const ty = horizontal ? (inverterTexto ? y1 + 14 + tamanhoTexto * 0.8 : y1 - 14) : my + tamanhoTexto * 0.35;

  return (
    <g>
      {chamada ? <Traco d={chamadaEm(x1, y1)} cor={cor} largura={traco.fino} /> : null}
      {chamada && comprimento > 2 ? <Traco d={chamadaEm(xf, yf)} cor={cor} largura={traco.fino} /> : null}
      <Traco d={lin(x1, y1, xf, yf)} cor={cor} largura={traco.medio} />
      <Traco d={tique(x1, y1)} cor={cor} largura={traco.forte} />
      {comprimento > 2 ? <Traco d={tique(xf, yf)} cor={cor} largura={traco.forte} /> : null}
      {texto && comprimento > 4 ? (
        <g opacity={opacidadeTexto}>
          <rect
            x={horizontal ? tx - largTexto / 2 - 6 : tx - 6}
            y={ty - tamanhoTexto * 0.85}
            width={largTexto + 12}
            height={tamanhoTexto * 1.15}
            fill={paleta.papel}
          />
          <text
            x={tx}
            y={ty}
            textAnchor={horizontal ? "middle" : "start"}
            fontFamily={mono}
            fontWeight={500}
            fontSize={tamanhoTexto}
            fill={cor}
          >
            {texto}
          </text>
        </g>
      ) : null}
    </g>
  );
};
