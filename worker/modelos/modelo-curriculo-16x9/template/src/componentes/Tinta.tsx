import { interpolateColors } from "remotion";
import { CirculoSobre, gesto, normalizar, prog, RiscoSobre } from "../anim";
import { ALT_LINHA, CORPO, type LinhaFolha, RECUO, respiroDe, X0 } from "../documento";
import { ESPACO_PALAVRA, larguraTexto } from "../medida";
import { cor, serifa } from "../tema";

// Palavras de uma linha do documento: a lápis até serem ditas, depois a tinta chega.
// `extra(i, w)` desenha marcas de caneta em cima da palavra i (índice no texto inteiro).
export const LinhaTinta: React.FC<{
  linha: LinhaFolha;
  t: number;
  tamanho?: number;
  peso?: number;
  corFinal?: string;
  // risco palavra por palavra (tempos), ou da linha inteira (um progresso)
  riscos?: number[];
  risco?: number;
  // círculo de caneta já pronto em volta de uma palavra (texto normalizado)
  circulada?: string;
  extra?: (i: number, w: string, ultima: boolean) => React.ReactNode;
  numeros?: boolean;
}> = ({ linha, t, tamanho, peso, corFinal = cor.tinta, riscos, risco, circulada, extra, numeros }) => {
  const tam = tamanho ?? linha.tamanho ?? CORPO;
  const pesoFinal = peso ?? linha.peso ?? 400;
  const palavras = linha.texto.split(/\s+/).filter(Boolean);
  const i0 = linha.i0 ?? 0;
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        fontFamily: serifa,
        fontWeight: pesoFinal,
        fontSize: tam,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        fontVariantNumeric: numeros ? "tabular-nums" : undefined,
      }}
    >
      {palavras.map((w, i) => {
        const em = linha.tempos?.[i];
        const tinta = em === undefined ? 1 : prog(t, em, 0.2);
        const ultima = i === palavras.length - 1;
        return (
          <span
            key={`${w}-${i}`}
            style={{
              position: "relative",
              display: "inline-block",
              marginRight: ultima ? 0 : `${ESPACO_PALAVRA}em`,
              color: tinta >= 1 ? corFinal : interpolateColors(tinta, [0, 1], [cor.lapis, corFinal]),
            }}
          >
            {w}
            {riscos ? <RiscoSobre p={prog(t, riscos[i] ?? 1e9, 0.24, gesto)} alturaPx={tam * 1.2} largura={5} semente={i + 2} /> : null}
            {circulada && normalizar(w) === circulada ? (
              <CirculoSobre em={-10} t={t} w={larguraTexto(w, tam, "serifa", pesoFinal)} h={tam * 0.8} largura={5} semente={7} />
            ) : null}
            {extra ? extra(i0 + i, w, ultima) : null}
          </span>
        );
      })}
      {risco !== undefined ? <RiscoSobre p={risco} alturaPx={tam * 1.2} largura={5.5} semente={4} /> : null}
    </div>
  );
};

// Uma linha da folha posicionada (x, y da linha + o respiro do corpo)
export const LinhaNaFolha: React.FC<{ linha: LinhaFolha; dy?: number; op?: number; children: React.ReactNode }> = ({ linha, dy = 0, op = 1, children }) => (
  <div
    style={{
      position: "absolute",
      left: linha.x ?? (linha.marcador ? X0 + RECUO : X0),
      top: linha.y + dy + respiroDe(linha.tamanho ?? CORPO),
      opacity: op,
    }}
  >
    {children}
  </div>
);

export const Marcador: React.FC<{ y: number; op?: number; tamanho?: number }> = ({ y, op = 1, tamanho = CORPO }) => (
  <div
    style={{
      position: "absolute",
      left: X0 + 4,
      top: y + Math.round((ALT_LINHA * tamanho) / CORPO) / 2 - 14,
      width: 10,
      height: 10,
      borderRadius: 5,
      background: cor.tinta,
      opacity: op,
    }}
  />
);

export const Lapis: React.FC<{ x: number; y: number; w: number; h?: number; op?: number }> = ({ x, y, w, h = 12, op = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: h / 2, background: cor.lapis, opacity: op }} />
);
