import { limitar, Palavras, prog, saindo, temposDoTexto } from "../anim";
import { alinharCabecalho, type Areas } from "../layout";
import type { Checklist as ChecklistT, Layout, Palavra } from "../plano";
import { ajustarTitulo, cor, linhasDoTexto, sans } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { IconeDoItem } from "./Icones";
import { pSelo, Selo } from "./Selo";

type Item = ChecklistT["itens"][number];

// A disposição das linhas: onde o título fica, quantas colunas, a altura de cada linha e os tamanhos.
type Arranjo = {
  // título em cima (fileira) ou numa coluna à esquerda das linhas
  tituloAoLado: boolean;
  tituloTam: number;
  tituloW: number;
  tituloH: number;
  // a grade das linhas
  x0: number;
  y0: number;
  cols: number;
  cellW: number;
  gapX: number;
  linha: number;
  icone: number;
  selo: number;
  larguraItem: number;
  textoTam: number;
  duasLinhas: boolean;
  nota: number;
};

const VAO_COLUNA = 48;
const SELO_TITULO = 92;

// O tamanho do texto de cada linha (uma linha por item; se algum não cabe nem em 48 px, todos com até
// duas linhas), limitado pela altura da linha (e pelos pontinhos da semana, quando houver).
const tamanhoDoTexto = (itens: Item[], larguraItem: number, linha: number) => {
  const semana = itens.some((i) => i.semanaEm !== undefined) ? 42 : 0;
  const duasLinhas = itens.some((i) => linhasDoTexto(i.texto, larguraItem, 48) > 1);
  const pelaLargura = duasLinhas
    ? Math.min(Math.floor(linha / 2.5), ...itens.map((i) => ajustarTitulo(i.texto, larguraItem, 2, 64, 40)))
    : Math.min(78, ...itens.map((i) => ajustarTitulo(i.texto, larguraItem, 1, 78, 48)));
  const pelaAltura = Math.floor((linha - 12 - semana) / ((duasLinhas ? 2 : 1) * 1.05));
  return { textoTam: Math.max(30, Math.min(pelaLargura, pelaAltura)), duasLinhas };
};

// Em tela cheia, no quadro deitado, a conduta fica na FAIXA de névoa da base do quadro, que é larga e
// baixa: em vez de uma pilha alta, o título vai numa fileira em cima ou numa coluna à esquerda, e as
// linhas numa grade de 1 a 3 colunas. Vale a disposição com a maior letra (sem ícone pequeno demais).
const arranjoNaFaixa = (m: ChecklistT, area: { x: number; y: number; w: number; h: number }): Arranjo => {
  const n = m.itens.length;
  const comSelo = m.marcaEm !== undefined;
  const candidatos: Arranjo[] = [];
  for (const tituloAoLado of [false, true]) {
    const tituloW = tituloAoLado ? Math.min(600, Math.round(area.w * 0.32)) : Math.round(area.w * 0.7);
    const larguraTitulo = tituloW - (comSelo ? SELO_TITULO + 24 : 0);
    const tituloTam = ajustarTitulo(m.titulo, larguraTitulo, tituloAoLado ? 3 : 1, 96, 56);
    const linhasTitulo = linhasDoTexto(m.titulo, larguraTitulo, tituloTam);
    const tituloH = Math.max(Math.min(3, linhasTitulo) * tituloTam * 1.05, comSelo ? SELO_TITULO : 0);
    const x0 = tituloAoLado ? area.x + tituloW + 56 : area.x;
    const w = tituloAoLado ? area.w - tituloW - 56 : area.w;
    const y0 = tituloAoLado ? area.y : area.y + tituloH + 22;
    const h = tituloAoLado ? area.h : area.h - tituloH - 22;
    for (let cols = 1; cols <= Math.min(3, n); cols++) {
      const rows = Math.ceil(n / cols);
      const cellW = (w - (cols - 1) * VAO_COLUNA) / cols;
      const linha = Math.min(150, h / rows);
      const icone = Math.min(116, linha - 22);
      const selo = Math.min(44, linha * 0.3);
      const larguraItem = cellW - icone - selo * 2 - 64;
      // (uma coluna com o título em cima sempre entra, mesmo apertada: nunca fica sem disposição)
      if (larguraItem < 160 && (tituloAoLado || cols > 1)) continue;
      const { textoTam, duasLinhas } = tamanhoDoTexto(m.itens, larguraItem, linha);
      // letra maior ganha; ícone pequeno demais e grade com buraco grande perdem
      const nota = textoTam - (icone < 56 ? 40 : 0) - (rows * cols - n) * 3 - (tituloTam < 64 ? 6 : 0);
      candidatos.push({ tituloAoLado, tituloTam, tituloW, tituloH, x0, y0, cols, cellW, gapX: VAO_COLUNA, linha, icone, selo, larguraItem, textoTam, duasLinhas, nota });
    }
  }
  return candidatos.reduce((a, b) => (b.nota > a.nota ? b : a));
};

// A receita: cada linha entra quando é dita, com um ícone que se move e o ✓ (ou ✗) no fim.
// Em tela cheia fica na névoa branca (no quadro deitado, numa faixa larga na base); na lupa, embaixo
// do cabeçalho, no quadro da esquerda.
export const Checklist: React.FC<{ m: ChecklistT; t: number; fim: number; areas: Areas; layout: Layout; palavras: Palavra[] }> = ({
  m,
  t,
  fim,
  areas,
  layout,
  palavras,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const cheio = layout === "cheio";
  const area = areas.corpo;
  const temposTitulo = temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1);

  let a: Arranjo;
  if (cheio) a = arranjoNaFaixa(m, area);
  else {
    // na lupa: uma coluna de linhas embaixo do cabeçalho
    const linha = Math.min(164, area.h / Math.max(1, m.itens.length));
    const icone = Math.min(134, linha - 26);
    const selo = Math.min(48, linha * 0.3);
    const larguraItem = area.w - icone - selo * 2 - 64;
    const { textoTam, duasLinhas } = tamanhoDoTexto(m.itens, larguraItem, linha);
    a = { tituloAoLado: false, tituloTam: 0, tituloW: 0, tituloH: 0, x0: area.x, y0: area.y, cols: 1, cellW: area.w, gapX: 0, linha, icone, selo, larguraItem, textoTam, duasLinhas, nota: 0 };
  }
  // na faixa, o bloco inteiro fica no meio da altura dela
  const rows = Math.ceil(m.itens.length / a.cols);
  const alturaGrade = rows * a.linha;
  const desce = cheio
    ? Math.max(0, (area.h - (a.tituloAoLado ? Math.max(a.tituloH, alturaGrade) : a.tituloH + 22 + alturaGrade)) / 2)
    : 0;

  return (
    <>
      {!cheio ? (
        <Cabecalho
          area={areas.cabecalho}
          titulo={m.titulo}
          enfase={m.enfase}
          palavras={palavras}
          de={m.de}
          ate={m.ate}
          t={t}
          fim={fim}
          alinhar={alinharCabecalho(layout)}
          maxLinhas={layout === "topo" ? 2 : 3}
        />
      ) : null}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, translate: `0 ${14 * sai}px` }}>
        {cheio ? (
          <div
            style={{
              position: "absolute",
              left: area.x,
              top: a.tituloAoLado ? area.y + desce + Math.max(0, (alturaGrade - a.tituloH) / 2) : area.y + desce,
              width: a.tituloW,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            {m.marcaEm !== undefined ? (
              <svg width={SELO_TITULO} height={SELO_TITULO} style={{ overflow: "visible", flexShrink: 0 }}>
                <Selo cx={SELO_TITULO / 2} cy={SELO_TITULO / 2} r={SELO_TITULO / 2 - 2} tipo="certo" p={pSelo(t, m.marcaEm)} />
              </svg>
            ) : null}
            <Palavras
              texto={m.titulo}
              tempos={temposTitulo}
              t={t}
              enfase={m.enfase}
              corEnfase={cor.azul}
              style={{ fontFamily: sans, fontWeight: 800, fontSize: a.tituloTam, lineHeight: 1.05, letterSpacing: "-0.02em", color: cor.tinta }}
            />
          </div>
        ) : null}
        {m.itens.map((it, i) => {
          const entra = prog(t, it.em - 0.05, 0.45);
          const tipo = it.tipo ?? "certo";
          const tempos = temposDoTexto(it.texto, palavras, it.em - 0.1, m.ate, it.em);
          const col = i % a.cols;
          const fila = Math.floor(i / a.cols);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: a.x0 + col * (a.cellW + a.gapX),
                top: a.y0 + desce + fila * a.linha,
                width: a.cellW,
                height: a.linha,
                display: "flex",
                alignItems: "center",
                gap: 32,
                borderTop: `2.5px solid ${cor.cinzaClaro}`,
                opacity: limitar(entra * 1.4),
                translate: `${(1 - entra) * -30}px 0`,
              }}
            >
              <div
                style={{
                  width: a.icone,
                  height: a.icone,
                  borderRadius: "50%",
                  background: cor.fundo,
                  boxShadow: `inset 0 0 0 4px ${cor.azul}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <IconeDoItem icone={it.icone ?? "check"} t={t} em={it.em} tamanho={a.icone * 0.68} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                <Palavras
                  texto={it.texto}
                  tempos={tempos}
                  t={t}
                  style={{
                    fontFamily: sans,
                    fontWeight: 700,
                    fontSize: a.textoTam,
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                    color: cor.tinta,
                    textWrap: a.duasLinhas ? "balance" : "nowrap",
                    maxWidth: a.larguraItem,
                  }}
                />
                {it.semanaEm !== undefined ? (
                  <div style={{ display: "flex", gap: 14 }}>
                    {Array.from({ length: 7 }, (_, k) => {
                      const p = prog(t, it.semanaEm! + k * 0.08, 0.3);
                      return (
                        <div
                          key={k}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            boxShadow: `inset 0 0 0 3px ${p > 0 ? cor.azul : cor.cinzaLinha}`,
                            background: p > 0.5 ? cor.azul : "transparent",
                            scale: String(0.7 + 0.3 * p),
                            opacity: prog(t, it.em + 0.2, 0.4),
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <svg width={a.selo * 2 + 4} height={a.selo * 2 + 4} style={{ overflow: "visible", flexShrink: 0 }}>
                <Selo cx={a.selo + 2} cy={a.selo + 2} r={a.selo} tipo={tipo} p={pSelo(t, it.em + 0.35)} />
              </svg>
            </div>
          );
        })}
      </div>
    </>
  );
};
