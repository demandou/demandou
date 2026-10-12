// Abertura: capa de revista. O título fica no quadro de papel ao lado da foto (no 16:9 a foto vai
// para a moldura da direita e a manchete abre no quadro da esquerda): está lá "a lápis"
// desde o primeiro quadro e cada palavra ganha tinta no instante em que é dita. A primeira linha
// é grande; o trecho de destaque fica em itálico índigo e ganha um sublinhado que se desenha.
// `capa` traz as linhas escolhidas à mão; `abertura` traz o texto e o template escolhe as linhas.
import { mix, prog, saida } from "../anim";
import { quebrar, umaLinha } from "../medida";
import type { Area } from "../pessoa";
import type { Abertura, Capa, Plano } from "../plano";
import { separar, temposDoTexto } from "../palavras";
import { cor, QUADRO_PAGINA, serifa } from "../tema";
import { marcarTrecho } from "./comum";

// a manchete ocupa o quadro da esquerda; no quadro deitado ela pode crescer um pouco mais que no
// vertical (o quadro é bem mais alto que a faixa de cima da capa vertical)
const LARGURA = QUADRO_PAGINA.w;
const ALTURA = QUADRO_PAGINA.h * 0.7;
const GRANDE = 196;
const MEDIA = 100;

const tamanhos = (linhas: string[]) => {
  const grande = umaLinha(linhas[0] ?? "", LARGURA, GRANDE, 56, { estilo: "serifa" });
  const media = Math.min(MEDIA, ...linhas.slice(1).map((l) => umaLinha(l, LARGURA, MEDIA, 40, { estilo: "serifa" })));
  return { grande, media };
};
const alturaDe = (n: number, grande: number, media: number) => grande + (n - 1) * media * 1.16;

// Escolhe as linhas da manchete: a primeira, grande, com as 1 a 4 primeiras palavras; o resto em
// até 2 linhas médias equilibradas. Prefere a primeira linha grande e com 2 ou 3 palavras.
export const linhasDaAbertura = (texto: string): string[] => {
  const ws = separar(texto);
  if (ws.length <= 2) return [ws.join(" ")];
  let melhor: { linhas: string[]; nota: number } | null = null;
  for (let k = 1; k <= Math.min(4, ws.length - 1); k++) {
    const primeira = ws.slice(0, k).join(" ");
    const resto = ws.slice(k).join(" ");
    for (const n of [1, 2]) {
      const cabe = (s: number) => quebrar(resto, LARGURA, s, { estilo: "serifa" });
      let s = MEDIA;
      while (s > 44 && cabe(s).length > n) s -= 2;
      const linhas = [primeira, ...cabe(s)];
      if (linhas.length - 1 > n) continue;
      const { grande, media } = tamanhos(linhas);
      if (alturaDe(linhas.length, grande, media) > ALTURA + 4) continue;
      const nota = grande + media * 0.9 - (k === 1 ? 30 : 0) - (k === 4 ? 10 : 0) - (grande < 100 ? 50 : 0) - (n === 2 ? 6 : 0);
      if (!melhor || nota > melhor.nota) melhor = { linhas, nota };
    }
  }
  return melhor?.linhas ?? [texto];
};

export const CapaDeRevista: React.FC<{ m: Capa | Abertura; t: number; plano: Plano; fim: number; area: Area }> = ({ m, t, plano, fim, area }) => {
  const fora = saida(t, fim);
  const textoLinhas = m.tipo === "capa" ? m.linhas : linhasDaAbertura(m.texto);
  const linhas = textoLinhas.map(separar);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(linhas.flat(), plano, inicio, m.ate);
  const destaque = marcarTrecho(linhas.flat(), m.tipo === "capa" ? m.enfase : m.destaque);

  // tamanhos: a primeira linha grande, as outras médias, todas cabendo na largura
  let { grande, media } = tamanhos(textoLinhas);
  let alturaTotal = alturaDe(linhas.length, grande, media);
  if (alturaTotal > ALTURA) {
    const k = ALTURA / alturaTotal;
    grande = Math.floor(grande * k);
    media = Math.floor(media * k);
    alturaTotal = alturaDe(linhas.length, grande, media);
  }
  // centraliza o título no quadro da esquerda (um pouco acima do meio, como numa capa)
  const topo = Math.max(area.y, area.y + (area.h - alturaTotal) * 0.44);

  let k = 0;
  return (
    <div style={{ position: "absolute", left: area.x, top: topo, width: area.w, opacity: 1 - fora, translate: `0 ${-fora * 50}px` }}>
      {linhas.map((ws, i) => {
        const tamanho = i === 0 ? grande : media;
        return (
          <div key={i} style={{ display: "flex", justifyContent: "center", flexWrap: "nowrap", fontFamily: serifa, fontSize: tamanho, lineHeight: i === 0 ? 1.0 : 1.16, color: cor.tinta }}>
            {ws.map((w, j) => {
              const idx = k++;
              const em = tempos[idx];
              const dest = destaque.has(idx);
              // o sublinhado continua por baixo do espaço quando a palavra seguinte também é destaque
              const emendar = dest && j < ws.length - 1 && destaque.has(idx + 1);
              const p = prog(t, em - 0.05, 0.42);
              const traco = dest ? prog(t, em + 0.15, 0.5) : 0;
              return (
                <span key={j} style={{ position: "relative", marginRight: j < ws.length - 1 ? "0.24em" : 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontStyle: dest ? "italic" : "normal",
                      color: p > 0.35 ? (dest ? cor.indigo : cor.tinta) : cor.lapisClaro,
                      translate: p >= 1 ? undefined : `0 ${mix(0.06, 0, p)}em`,
                    }}
                  >
                    {w}
                  </span>
                  {dest ? (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        bottom: "0.02em",
                        height: Math.max(3, tamanho * 0.045),
                        width: `calc(${traco * 100}% + ${emendar ? traco * 0.24 : 0}em)`,
                        background: cor.indigo,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
