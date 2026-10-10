// Tópicos = a pauta do episódio. O quadro sobe e fica baixo; embaixo entra o cartão da pauta (opaco,
// sobe cobrindo o que estava ali), com um item por linha, a lápis. Cada item acende quando é dito e
// ganha, à esquerda, a marca de tempo do episódio daquele instante (como nas notas de um podcast);
// o cursor rosa desce até o item da vez e a linha dele fica marcada.
import { interpolate } from "remotion";
import { Linhas, prog, relogio, segundos, temposDoTexto, troca } from "../anim";
import { abaixoDoQuadro } from "../layout";
import { medir, quebrar } from "../medidas";
import type { Palavra, Plano, Topicos } from "../plano";
import { cor, FUNDO, H, MARGEM, mono, rotulo, sans, titulo, W } from "../tema";
import { ritmoDoCartao, Rotulo } from "./comum";

const LARGURA = W - 2 * MARGEM;
const PAD_X = 40;
const PAD_Y = 34;
const COL_TEMPO = 150;

export const Pauta: React.FC<{ m: Topicos; plano: Plano; palavras: Palavra[]; t: number; fim: number; antes?: boolean; depois?: boolean }> = ({
  m,
  plano,
  palavras,
  t,
  fim,
  antes = false,
  depois = false,
}) => {
  const topo = abaixoDoQuadro("pauta");
  const altura = FUNDO - topo;
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const interna = LARGURA - 2 * PAD_X;
  const inicio = segundos(plano.episodio?.inicio);
  // a coluna das marcas de tempo cabe a marca mais comprida ("32:14" ou "1:02:15")
  const colTempo = Math.max(COL_TEMPO, Math.max(...itens.map((i) => relogio(inicio + i.em).length)) * 0.72 * 30 + 46);
  const larguraTexto = interna - colTempo;
  const cabecalho = 40 + 18;
  const util = altura - 2 * PAD_Y - cabecalho;
  const linha = util / n;
  // um corpo só para todos os itens (hierarquia igual): o maior em que todos cabem, em até 2 linhas
  const temDetalhe = itens.some((i) => i.detalhe);
  const alturaDetalhe = temDetalhe ? 44 : 0;
  let tam = 76;
  let quebras: string[][] = itens.map((i) => [i.texto]);
  for (; tam >= 36; tam -= 2) {
    const maxLinhas = Math.min(2, Math.max(1, Math.floor((linha - alturaDetalhe - 10) / (tam * 1.04))));
    const tentativa = itens.map((i) => quebrar(i.texto, tam, larguraTexto, maxLinhas));
    if (tentativa.every((ls) => ls.length <= maxLinhas && ls.every((l) => medir(l, tam) <= larguraTexto))) {
      quebras = tentativa;
      break;
    }
  }
  tam = Math.max(36, tam);

  // o cartão sobe de baixo (opaco) e desce no fim
  const { sobe: p, desce: s, texto } = ritmoDoCartao(t, m.de, fim, antes, depois);
  const fora = H - topo;
  // o item da vez: o último já dito
  const atual = itens.reduce((k, item, i) => (t >= item.em - 0.05 ? i : k), -1);
  // o cursor anda de um item para o outro (macio), parado no primeiro antes de começar
  const yDe = (i: number) => i * linha;
  let yCursor = yDe(Math.max(0, atual));
  if (atual >= 1) {
    const q = interpolate(t, [itens[atual].em - 0.05, itens[atual].em + 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: troca });
    yCursor = yDe(atual - 1) + (yDe(atual) - yDe(atual - 1)) * q;
  }
  const pCursor = atual >= 0 ? prog(t, itens[0].em - 0.05, 0.25) : 0;
  const contador = `${String(Math.max(0, atual + 1)).padStart(2, "0")}/${String(itens.length).padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: topo,
        width: LARGURA,
        height: altura,
        borderRadius: 28,
        background: cor.painel,
        boxShadow: `inset 0 0 0 1.5px ${cor.borda}`,
        translate: `0 ${(1 - p) * fora + s * fora}px`,
        overflow: "hidden",
        visibility: p <= 0 || s >= 1 ? "hidden" : "visible",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: texto }}>
      <div style={{ position: "absolute", left: PAD_X, top: PAD_Y, width: interna }}>
        <Rotulo
          nome={m.titulo ?? "Em pauta"}
          direita={<span style={{ ...rotulo, fontSize: 32, color: atual >= 0 ? cor.acento : cor.apagado }}>{contador}</span>}
        />
      </div>
      <div style={{ position: "absolute", left: 0, top: PAD_Y + cabecalho, width: LARGURA, height: util }}>
        {/* a linha da vez fica marcada e o cursor rosa desce até ela */}
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: yCursor + 4,
            height: linha - 8,
            borderRadius: 16,
            background: cor.painelClaro,
            opacity: pCursor,
          }}
        />
        <div style={{ position: "absolute", left: 14, top: yCursor + 14, width: 6, height: linha - 28, borderRadius: 3, background: cor.acento, opacity: pCursor }} />
        {itens.map((item, i) => {
          const proximo = itens[i + 1]?.em ?? m.ate;
          const tempos = temposDoTexto(item.texto, palavras, item.em - 0.1, proximo, item.em);
          const aceso = prog(t, item.em - 0.04, 0.2);
          const ls = quebras[i] ?? [item.texto];
          const alturaItem = ls.length * tam * 1.04 + (item.detalhe ? alturaDetalhe : 0);
          const pDetalhe = prog(t, item.em + 0.3, 0.3);
          return (
            <div key={`${item.texto}-${i}`} style={{ position: "absolute", left: PAD_X, top: yDe(i) + (linha - alturaItem) / 2, width: interna, display: "flex" }}>
              <div style={{ width: colTempo, flexShrink: 0, height: tam * 1.04, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width={14} height={16} viewBox="0 0 14 16">
                  <path d="M1 1 L13 8 L1 15 Z" fill={aceso > 0.5 ? cor.acento : cor.apagado} />
                </svg>
                <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, color: aceso > 0.5 ? cor.acento : cor.apagado }}>{relogio(inicio + item.em)}</span>
              </div>
              <div>
                <Linhas linhas={ls} tempos={tempos} t={t} tam={tam} modo="acende" entrelinha={1.04} estilo={{ ...titulo, fontSize: tam }} />
                {item.detalhe ? (
                  <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 36, lineHeight: 1.2, height: alturaDetalhe, color: pDetalhe > 0.5 ? cor.textoSuave : cor.apagado, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: larguraTexto }}>
                    {item.detalhe}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
