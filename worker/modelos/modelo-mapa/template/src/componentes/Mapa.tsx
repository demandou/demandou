// Mapa mental: o nó central (cheio de tinta) à esquerda e os ramos que nascem dele para a direita,
// um a cada palavra; embaixo, o título falado. Os ramos podem se apagar (esquecimento: viram lápis
// tracejado e o texto é apagado da direita para a esquerda) ou ganhar marca-texto (fixar).
import { caneta, Escrita, indicesDoTrecho, prog, ramo, temposDoTexto, Traco } from "../anim";
import { diagramar, medir, quebrarMedindo } from "../medidas";
import type { Mapa as TMapa, Palavra } from "../plano";
import { cor, DIREITA_BAIXO, MARGEM, titulo as estiloTitulo } from "../tema";
import { alturaDoNo, No } from "./No";

export const MAPA = { centroY: 1124, passo: 92, tituloY: 1318 };

export const larguraDoNo = (texto: string, tamanho: number, corte: "texto600" | "texto700") => medir(texto, tamanho, corte) + tamanho * 1.2 + 2 * Math.max(3, tamanho * 0.09);
const larguraDasLinhas = (linhas: string[], tamanho: number, corte: "texto600" | "texto700") => Math.max(...linhas.map((l) => larguraDoNo(l, tamanho, corte)));

// cabe o texto de um nó numa largura: uma linha, do maior corpo ao mínimo; em duas linhas quando não
// cabe numa, ou quando duas linhas deixam o nó bem maior (≥ 10 px a mais no corpo)
const caberNo = (texto: string, largura: number, maximo: number, minimo: number, corte: "texto600" | "texto700", duasLinhas: boolean) => {
  let tamanho = maximo;
  while (tamanho > minimo && larguraDoNo(texto, tamanho, corte) > largura) tamanho -= 2;
  const cabeUma = larguraDoNo(texto, tamanho, corte) <= largura;
  if ((cabeUma && tamanho >= maximo - 8) || !duasLinhas || !texto.includes(" ")) return { tamanho, linhas: [texto] };
  const folga = (s: number) => s * 1.2 + 2 * Math.max(3, s * 0.09);
  for (let s = maximo; s >= minimo; s -= 2) {
    const ls = quebrarMedindo(texto, s, largura - folga(s), 2, corte, true);
    if (ls.length <= 2 && Math.max(...ls.map((l) => medir(l, s, corte))) <= largura - folga(s)) {
      if (!cabeUma || s >= tamanho + 10) return { tamanho: s, linhas: ls };
      break;
    }
  }
  if (cabeUma) return { tamanho, linhas: [texto] };
  const d = diagramar(texto, { equilibrar: true, largura: largura - folga(minimo), maximo: minimo, minimo, linhas: 2, corte });
  return { tamanho: d.tamanho, linhas: d.linhas };
};

// Duas gramáticas: o mapa que abre o vídeo (gancho) tem o cartão grande da pessoa em cima e o mapa
// embaixo (`foco` = false); no meio do vídeo, o mapa é o herói (`foco` = true): o cartão da pessoa
// fica pequeno em cima à esquerda, o título se escreve ao lado dele e o mapa ocupa o corpo da tela,
// com nós maiores.
export const MAPA_FOCO = { topo: 730, base: 1490, centroY: 1110, xTitulo: 520, larguraTitulo: 500 };

// geometria do mapa (também usada pelo ramo que liga o cartão da pessoa ao nó central)
export const geometriaDoMapa = (m: TMapa, foco = false) => {
  const n = Math.max(1, m.ramos.length);
  const L = foco
    ? { centroMax: 72, centroMin: 44, centroLargura: 420, ramoMax: n > 4 ? 50 : n > 3 ? 58 : 64, ramoMin: 40, vao: 84 }
    : { centroMax: 50, centroMin: 38, centroLargura: 400, ramoMax: n > 4 ? 40 : 46, ramoMin: 34, vao: 96 };
  // o nó central em uma linha ou, se os ramos ficarem pequenos, em duas linhas (mais estreito,
  // sobra largura para os ramos): fica a opção com os ramos maiores
  const opcao = (c: { tamanho: number; linhas: string[] }) => {
    const wCentro = larguraDasLinhas(c.linhas, c.tamanho, "texto700");
    const xRamo = MARGEM + wCentro + L.vao;
    const largura = DIREITA_BAIXO - xRamo;
    const medidos = m.ramos.map((r) => ({ ...r, ...caberNo(r.texto, largura, L.ramoMax, L.ramoMin, "texto600", n <= 4) }));
    const nota = Math.min(...medidos.map((r) => r.tamanho - (r.linhas.length > 1 ? 6 : 0)));
    return { c, wCentro, xRamo, medidos, nota };
  };
  const umaLinha = opcao(caberNo(m.centro, L.centroLargura, L.centroMax, L.centroMin, "texto700", true));
  const palavrasCentro = m.centro.trim().split(/\s+/);
  const duasLinhas =
    umaLinha.nota < L.ramoMax - 4 && umaLinha.c.linhas.length === 1 && palavrasCentro.length > 1
      ? opcao({ tamanho: umaLinha.c.tamanho, linhas: diagramar(m.centro, { equilibrar: true, largura: 300, maximo: umaLinha.c.tamanho, minimo: L.centroMin, linhas: 2, corte: "texto700" }).linhas })
      : null;
  const melhor = duasLinhas && duasLinhas.nota > umaLinha.nota ? duasLinhas : umaLinha;
  const { c, wCentro, xRamo, medidos } = melhor;
  const tamCentro = c.tamanho;
  const hCentro = c.linhas.length > 1 ? alturaDoNo(tamCentro, c.linhas.length) : tamCentro * 0.76 + tamCentro + 8;
  // sem título embaixo, o mapa desce para o meio da faixa livre
  const centroY = foco ? MAPA_FOCO.centroY : m.titulo ? MAPA.centroY : 1200;
  const centro = { x: MARGEM + wCentro / 2, y: centroY, w: wCentro, h: hCentro, linhas: c.linhas };
  // faixa vertical dos ramos: entre o cartão da pessoa e o título (ou o pé, sem título)
  const topo = foco ? MAPA_FOCO.topo : 940;
  const base = foco ? MAPA_FOCO.base : m.titulo ? MAPA.tituloY - 26 : 1490;
  let ramos: (typeof medidos[number] & { x: number; y: number })[];
  if (medidos.every((r) => r.linhas.length === 1)) {
    const passo = foco ? Math.min(170, (base - topo - 110) / Math.max(1, n - 1)) : Math.min(m.titulo ? MAPA.passo : 104, (m.titulo ? 330 : 420) / Math.max(1, n - 1));
    ramos = medidos.map((r, j) => ({ ...r, x: xRamo, y: centroY + (j - (n - 1) / 2) * passo }));
  } else {
    // ramos de duas linhas: empilhados pela altura de cada um, centrados no nó central
    const alturas = medidos.map((r) => alturaDoNo(r.tamanho, r.linhas.length));
    const total0 = alturas.reduce((a, b) => a + b, 0);
    const vao = foco ? Math.min(70, Math.max(14, (base - topo - 60 - total0) / Math.max(1, n - 1))) : 14;
    const total = total0 + vao * (n - 1);
    let y = Math.max(topo, Math.min(base - total, centroY - total / 2));
    ramos = medidos.map((r, j) => {
      const cy = y + alturas[j] / 2;
      y += alturas[j] + vao;
      return { ...r, x: xRamo, y: cy };
    });
  }
  return { centro, ramos, tamCentro };
};

export const Mapa: React.FC<{ m: TMapa; palavras: Palavra[]; t: number; foco?: boolean }> = ({ m, palavras, t, foco = false }) => {
  const g = geometriaDoMapa(m, foco);
  const n = g.ramos.length;
  const inicio = Math.max(0.3, m.de);
  const pCentro = prog(t, inicio, 0.4);
  // fim do esquecimento: o nó central apaga depois do último ramo
  const esqueceCentro = m.esqueceEm !== undefined ? prog(t, m.esqueceEm + n * 0.14 + 0.1, 0.5) : 0;
  const fixaCentro = m.fixaEm !== undefined ? prog(t, m.fixaEm, 0.4) : 0;
  // fixar depois de esquecer devolve a tinta ao nó central
  const apagadoCentro = esqueceCentro * (1 - fixaCentro);
  const saidaX = g.centro.x + g.centro.w / 2;

  const titulo = m.titulo
    ? (() => {
        // com foco no mapa, o título vai para a coluna ao lado do cartão da pessoa
        const d = foco
          ? diagramar(m.titulo, { equilibrar: true, largura: MAPA_FOCO.larguraTitulo, maximo: 76, minimo: 48, linhas: 4, altura: 440, entrelinha: 1.04 })
          : diagramar(m.titulo, { largura: DIREITA_BAIXO - MARGEM, maximo: 92, minimo: 64, linhas: 2, altura: 200 });
        return { ...d, tempos: temposDoTexto(m.titulo, palavras, m.de, m.ate), apagado: indicesDoTrecho(m.titulo, m.apagado) };
      })()
    : null;

  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {g.ramos.map((r, j) => {
          const d = ramo(saidaX, g.centro.y, r.x, r.y);
          const pDesenha = prog(t, r.em - 0.05, 0.36, caneta);
          const pEsquece = m.esqueceEm !== undefined ? prog(t, m.esqueceEm + j * 0.14, 0.45) : 0;
          return (
            <g key={`r-${j}`}>
              {/* esboço a lápis do ramo: já está no papel */}
              <path d={d} fill="none" stroke={cor.lapisClaro} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" />
              <g opacity={1 - pEsquece}>
                <Traco d={d} p={pDesenha} cor={cor.tinta} largura={6} />
              </g>
              {pEsquece > 0 ? <path d={d} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" opacity={pEsquece} /> : null}
            </g>
          );
        })}
      </svg>
      <No
        x={g.centro.x}
        y={g.centro.y}
        texto={g.centro.linhas.join("\n")}
        tamanho={g.tamCentro}
        peso={700}
        aparece={pCentro}
        estado={{ tinta: 1 - 0.65 * apagadoCentro, cheio: 1 - apagadoCentro }}
      />
      {g.ramos.map((r, j) => {
        const pTinta = prog(t, r.em + 0.12, 0.3);
        const pEsquece = m.esqueceEm !== undefined ? prog(t, m.esqueceEm + j * 0.14, 0.45) : 0;
        const pMarca = m.fixaEm !== undefined ? prog(t, m.fixaEm + j * 0.12, 0.35) : 0;
        return (
          <No
            key={`n-${j}`}
            x={r.x}
            y={r.y}
            ancora="esquerda"
            texto={r.linhas.join("\n")}
            tamanho={r.tamanho}
            aparece={0.55 + 0.45 * prog(t, inicio, 0.3)}
            estado={{ tinta: Math.min(1, pTinta * (1 - pEsquece) + pMarca), apaga: pEsquece * (1 - pMarca), marca: pMarca }}
          />
        );
      })}
      {titulo ? (
        <div style={{ position: "absolute", left: foco ? MAPA_FOCO.xTitulo : MARGEM, top: foco ? 182 : MAPA.tituloY }}>
          <Escrita linhas={titulo.linhas} tempos={titulo.tempos} t={t} estilo={estiloTitulo} tamanho={titulo.tamanho} apagado={titulo.apagado} />
        </div>
      ) : null}
    </>
  );
};
