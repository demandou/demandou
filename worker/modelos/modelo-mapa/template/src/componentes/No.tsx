// Nó do mapa: uma pílula com texto (ou um cartão de cantos redondos, quando o texto quebra em duas
// linhas). Estados: esboço a lápis (tracejado, texto claro), tinta (contorno escuro), cheio (fundo de
// tinta, texto branco) e marcado (marca-texto por trás).
import { cor, sans } from "../tema";

export type EstadoDoNo = {
  // 0 = esboço a lápis, 1 = tinta
  tinta: number;
  // 0..1: marca-texto preenchendo o fundo, da esquerda para a direita
  marca?: number;
  // 0..1: fundo de tinta (nó central)
  cheio?: number;
  // 0..1: o texto em tinta é "apagado" da direita para a esquerda (esquecimento), sobra o esboço
  apaga?: number;
};

const mix = (a: [number, number, number], b: [number, number, number], p: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * p)).join(",")})`;
const TINTA: [number, number, number] = [30, 26, 60];
const LAPIS: [number, number, number] = [166, 162, 187];
const BRANCO: [number, number, number] = [255, 255, 255];

// medidas do nó (para quem calcula a geometria): o enchimento e a borda em volta do texto
export const enchimentoDoNo = (tamanho: number) => ({ x: tamanho * 0.6, cima: tamanho * 0.36, baixo: tamanho * 0.4, borda: Math.max(3, tamanho * 0.09) });
export const ENTRELINHA_NO = 1.08;
export const alturaDoNo = (tamanho: number, linhas = 1) => {
  const e = enchimentoDoNo(tamanho);
  return tamanho * (linhas > 1 ? linhas * ENTRELINHA_NO : 1) + e.cima + e.baixo + 2 * e.borda;
};

export const No: React.FC<{
  x: number;
  y: number;
  // uma linha; "\n" quebra em linhas (o nó vira um cartão de cantos redondos)
  texto: string;
  tamanho?: number;
  // ancoragem horizontal do x: centro (padrão), esquerda ou direita do nó
  ancora?: "centro" | "esquerda" | "direita";
  estado: EstadoDoNo;
  peso?: number;
  aparece?: number;
  largura?: number;
  fonte?: string;
}> = ({ x, y, texto, tamanho = 42, ancora = "centro", estado, peso = 600, aparece = 1, largura, fonte = sans }) => {
  const { tinta, marca = 0, cheio = 0, apaga = 0 } = estado;
  const e = enchimentoDoNo(tamanho);
  const linhas = texto.split("\n");
  const varias = linhas.length > 1;
  const corBorda = mix(LAPIS, TINTA, tinta);
  const corTexto = cheio > 0.5 ? mix(TINTA, BRANCO, cheio) : mix(LAPIS, TINTA, tinta);
  const translateX = ancora === "centro" ? "-50%" : ancora === "direita" ? "-100%" : "0%";
  // terminado: o texto é desenhado uma vez só, sem a camada de esboço nem a máscara
  const pronto = tinta >= 0.999 && apaga <= 0.001 && aparece >= 0.999;
  const conteudo = varias
    ? linhas.map((l, i) => (
        <span key={`${l}-${i}`} style={{ display: "block", lineHeight: ENTRELINHA_NO }}>
          {l}
        </span>
      ))
    : texto;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: `${translateX} -50%`,
        scale: `${0.92 + 0.08 * aparece}`,
        opacity: aparece,
        width: largura,
        padding: `${e.cima}px ${e.x}px ${e.baixo}px`,
        borderRadius: varias ? tamanho * 0.7 : 999,
        background: cheio > 0 ? mix(BRANCO, TINTA, cheio) : cor.cartao,
        border: `${e.borda}px ${tinta < 0.5 ? "dashed" : "solid"} ${corBorda}`,
        boxShadow: tinta > 0.5 ? "0 6px 16px rgba(30,26,60,0.10)" : undefined,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textAlign: "center",
      }}
    >
      {marca > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: cor.marca,
            transformOrigin: "left center",
            transform: `scaleX(${marca})`,
          }}
        />
      ) : null}
      <span style={{ position: "relative", display: "inline-block", fontFamily: fonte, fontWeight: peso, fontSize: tamanho, lineHeight: 1, color: pronto ? corTexto : cor.lapisClaro }}>
        {pronto ? (
          conteudo
        ) : (
          <>
            {/* o esboço só aparece enquanto o nó não tem tinta ou quando o texto é apagado */}
            <span style={{ display: varias ? "block" : undefined, opacity: Math.max(apaga, 1 - tinta, 1 - aparece) }}>{conteudo}</span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: varias ? "100%" : undefined,
                color: corTexto,
                clipPath: apaga > 0 ? `inset(-20% ${(apaga * 104).toFixed(2)}% -20% -4%)` : undefined,
              }}
            >
              {conteudo}
            </span>
          </>
        )}
      </span>
    </div>
  );
};
