// Passos = os capítulos do que vem. O quadro desce para o pé da tela e, em cima, os passos ficam em
// pé, numerados (01, 02, 03…) ao lado de uma barra de capítulos vertical — a mesma da régua do alto:
// o passo dito fica branco, o da vez se preenche em rosa, os que vêm ficam a lápis. Cada texto
// acende palavra por palavra quando é dito.
import { limitar, Linhas, prog, saindo, temposDoTexto } from "../anim";
import { acimaDoQuadro, ANTES, FIM_DO_RECUO, TROCA } from "../layout";
import { medir, quebrar } from "../medidas";
import type { Palavra, Passos } from "../plano";
import { cor, MARGEM, mono, REGUA, sans, titulo, W } from "../tema";
import { Rotulo } from "./comum";

const LARGURA = W - 2 * MARGEM;
const BARRA = 10;
const COL_NUMERO = 96;

export const Capitulos: React.FC<{ m: Passos; palavras: Palavra[]; t: number; fim: number }> = ({ m, palavras, t, fim }) => {
  const topo = REGUA.barraY + 8 + 30;
  const base = acimaDoQuadro("baixo");
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const cabecalho = 40 + 22;
  const util = base - topo - cabecalho;
  const vao = 12;
  const linha = (util - vao * (n - 1)) / n;
  const larguraTexto = LARGURA - BARRA - 28 - COL_NUMERO;
  const temDetalhe = itens.some((i) => i.detalhe);
  const alturaDetalhe = temDetalhe ? 44 : 0;
  // um corpo só para todos os passos, o maior que cabe (até 2 linhas por passo)
  let tam = 84;
  let quebras: string[][] = itens.map((i) => [i.texto]);
  for (; tam >= 36; tam -= 2) {
    const maxLinhas = Math.min(2, Math.max(1, Math.floor((linha - alturaDetalhe) / (tam * 1.04))));
    const tentativa = itens.map((i) => quebrar(i.texto, tam, larguraTexto, maxLinhas));
    if (tentativa.every((ls) => ls.length <= maxLinhas && ls.every((l) => medir(l, tam) <= larguraTexto))) {
      quebras = tentativa;
      break;
    }
  }
  tam = Math.max(36, tam);

  // o conteúdo do alto só aparece quando o quadro já desceu (entra subindo de trás da régua) e sai
  // inteiro antes do fim (o próximo bloco usa o mesmo lugar)
  const entra = prog(t, Math.max(m.de - ANTES + TROCA * 0.2, FIM_DO_RECUO), 0.4);
  const s = saindo(t, fim + 0.02, 0.2);
  const atual = itens.reduce((k, item, i) => (t >= item.em - 0.05 ? i : k), -1);

  return (
    <div style={{ position: "absolute", left: MARGEM, top: topo, width: LARGURA, height: base - topo, opacity: entra * (1 - s), translate: `0 ${(1 - entra) * -30 - 20 * s}px` }}>
      <Rotulo
        nome={m.titulo ?? "Passo a passo"}
        direita={
          <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 32, color: atual >= 0 ? cor.acento : cor.apagado }}>
            {String(Math.max(0, atual + 1)).padStart(2, "0")}/{String(itens.length).padStart(2, "0")}
          </span>
        }
      />
      {itens.map((item, i) => {
        const y = cabecalho + i * (linha + vao);
        const proximo = itens[i + 1]?.em ?? m.ate;
        // a barra do passo: branca quando já passou, rosa enchendo enquanto é o da vez, a lápis antes
        const enche = limitar((t - item.em) / Math.max(0.4, proximo - item.em));
        const passou = i < atual;
        const daVez = i === atual;
        const aceso = prog(t, item.em - 0.04, 0.22);
        const tempos = temposDoTexto(item.texto, palavras, item.em - 0.1, proximo, item.em);
        const ls = quebras[i] ?? [item.texto];
        const alturaItem = ls.length * tam * 1.04 + (item.detalhe ? alturaDetalhe : 0);
        const pDetalhe = prog(t, item.em + 0.3, 0.3);
        return (
          <div key={`${item.texto}-${i}`} style={{ position: "absolute", left: 0, top: y, width: LARGURA, height: linha }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: BARRA, height: linha, borderRadius: BARRA / 2, background: cor.apagado, overflow: "hidden" }}>
              <div
                style={{
                  width: "100%",
                  height: `${(passou ? 1 : daVez ? enche : 0) * 100}%`,
                  borderRadius: BARRA / 2,
                  background: passou ? cor.texto : cor.acento,
                  opacity: passou ? 0.86 : 1,
                }}
              />
            </div>
            <div style={{ position: "absolute", left: BARRA + 28, top: (linha - alturaItem) / 2, display: "flex" }}>
              <div style={{ width: COL_NUMERO, flexShrink: 0, height: tam * 1.04, display: "flex", alignItems: "center" }}>
                <span style={{ fontFamily: mono, fontWeight: 500, fontSize: Math.max(34, Math.min(44, tam * 0.6)), color: aceso > 0.5 ? cor.acento : cor.apagado }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div>
                <Linhas linhas={ls} tempos={tempos} t={t} tam={tam} modo="acende" entrelinha={1.04} estilo={{ ...titulo, fontSize: tam }} />
                {item.detalhe ? (
                  <div
                    style={{
                      fontFamily: sans,
                      fontWeight: 600,
                      fontSize: 36,
                      lineHeight: 1.2,
                      height: alturaDetalhe,
                      width: larguraTexto,
                      color: pDetalhe > 0.5 ? cor.textoSuave : cor.apagado,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.detalhe}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
