// Lista (topicos) e a lista dos passos: linhas de app, uma por item. Antes de ser dito, o item espera
// como "esqueleto" (o número tracejado e uma barra cinza do tamanho do texto); na palavra, o número
// acende na cor da zona e o texto se monta. Uma faixa clara marca o item da vez e anda até o próximo.
import { Linhas, mistura, prog, temposDoTexto, trava } from "../anim";
import { encaixar, larguraTexto, MOSTRADOR, quebrarLinhas, SANS_600 } from "../medida";
import type { Item, Palavra } from "../plano";
import { cor, mostrador, sans } from "../tema";

type Z = { cor: string; texto: string; fundo: string };

export type Medidas = {
  tam: number;
  linhas: string[][];
  detalhes: string[][];
  alturas: number[];
  titulo: { tam: number; linhas: string[] } | null;
  topoItens: number;
  // folga que sobrou embaixo (para centrar o bloco)
  sobra: number;
};

const TAM_DETALHE = 40;
const GAP = 22;
export const BADGE = 64;

// Escolhe o maior corpo (até 72 px) em que o título e todos os itens cabem entre `topo` e `base`;
// a folga que sobra abre o espaço entre as linhas (até +34 px cada).
export const medirLista = (itens: Item[], titulo: string | undefined, largura: number, topo: number, base: number): Medidas => {
  const larguraTexto0 = largura - BADGE - 26;
  for (let tam = 72; tam >= 40; tam -= 2) {
    const tt = titulo ? encaixar(titulo, { largura, max: Math.min(80, tam + 8), min: 48, linhas: 2 }) : null;
    const topoItens = topo + (tt ? tt.linhas.length * Math.round(tt.tamanho * 1.1) + 26 : 0);
    const linhas = itens.map((it) => quebrarLinhas(it.texto, larguraTexto0, tam, MOSTRADOR));
    const detalhes = itens.map((it) => (it.detalhe ? quebrarLinhas(it.detalhe, larguraTexto0, TAM_DETALHE, SANS_600) : []));
    // no máximo 2 linhas por item (3 com corpo pequeno)
    if (tam > 48 && linhas.some((l) => l.length > 2)) continue;
    const alturas = itens.map((_, i) => Math.max(BADGE, linhas[i].length * Math.round(tam * 1.12) + detalhes[i].length * 48) + GAP);
    const total = alturas.reduce((a, b) => a + b, 0) - GAP;
    if (topoItens + total <= base || tam === 40) {
      const sobra = Math.max(0, base - (topoItens + total));
      const extra = itens.length > 1 ? Math.min(34, (sobra * 0.6) / (itens.length - 1)) : 0;
      const alturasFinal = alturas.map((a) => a + extra);
      return { tam, linhas, detalhes, alturas: alturasFinal, titulo: tt ? { tam: tt.tamanho, linhas: tt.linhas } : null, topoItens, sobra: Math.max(0, sobra - extra * (itens.length - 1)) };
    }
  }
  throw new Error("inalcançável");
};

export const Lista: React.FC<{
  itens: Item[];
  titulo?: string;
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  z: Z;
  topo: number;
  base?: number;
  // "numero" = número no círculo; "pino" = parada do mapa (o mesmo, com borda de pino)
  marcador?: "numero" | "pino";
}> = ({ itens, titulo, t, de, ate, palavras, z, topo: topo0, base = 1520 }) => {
  let topo = topo0;
  const x = 120;
  const largura = 840;
  const md0 = medirLista(itens, titulo, largura, topo, base);
  // o bloco desce um pouco quando sobra lugar (fica centrado entre o que está em cima e a base)
  const desce = Math.min(70, md0.sobra * 0.4);
  const md = { ...md0, topoItens: md0.topoItens + desce };
  topo += desce;
  const lh = Math.round(md.tam * 1.12);
  const xTexto = x + BADGE + 26;
  const temposTitulo = titulo ? temposDoTexto(titulo, palavras, de, ate, de + 0.15) : [];
  // o item da vez: o último já dito
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  const topos: number[] = [];
  let y = md.topoItens;
  for (const a of md.alturas) {
    topos.push(y);
    y += a;
  }
  // a faixa do item da vez anda de um item para o outro
  const anterior = Math.max(0, atual - 1);
  const anda = atual < 0 ? 0 : prog(t, itens[atual].em - 0.05, 0.4, trava);
  const yFaixa = atual < 0 ? topos[0] : mistura(topos[anterior], topos[atual], atual === 0 ? 1 : anda);
  const hFaixa = atual < 0 ? md.alturas[0] : mistura(md.alturas[anterior], md.alturas[atual], atual === 0 ? 1 : anda);
  const faixa = atual < 0 ? 0 : prog(t, itens[0].em - 0.05, 0.3);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {md.titulo ? (
        <Linhas
          linhas={md.titulo.linhas}
          tempos={temposTitulo}
          t={t}
          x={x}
          y={topo}
          largura={largura}
          alturaLinha={Math.round(md.titulo.tam * 1.1)}
          estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: md.titulo.tam, color: cor.tinta, letterSpacing: "-0.01em" }}
          esboco={cor.esboco}
        />
      ) : null}
      {/* faixa do item da vez */}
      <div
        style={{
          position: "absolute",
          left: x - 18,
          width: largura + 36,
          top: yFaixa - 12,
          height: hFaixa - GAP + 24,
          borderRadius: 28,
          background: z.fundo,
          opacity: faixa,
        }}
      />
      {itens.map((it, i) => {
        const top = topos[i];
        const dito = prog(t, it.em - 0.05, 0.3);
        const proximo = itens[i + 1]?.em ?? ate;
        const tempos = temposDoTexto(it.texto, palavras, it.em - 0.3, proximo, it.em);
        const detalheEm = it.detalheEm ?? it.em + 0.35;
        const temposDetalhe = it.detalhe ? temposDoTexto(it.detalhe, palavras, it.em - 0.3, proximo + 0.5, detalheEm) : [];
        const passou = atual > i;
        const topoTexto = top + Math.max(0, (BADGE - lh) / 2);
        return (
          <div key={i}>
            {/* número */}
            <div style={{ position: "absolute", left: x, top: top + Math.max(0, (lh - BADGE) / 2), width: BADGE, height: BADGE }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 999, border: `4px dashed ${cor.esboco}`, opacity: 1 - dito }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: passou ? z.texto : z.cor, opacity: dito, scale: String(0.7 + 0.3 * dito) }} />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mostrador,
                  fontWeight: 700,
                  fontSize: 36,
                  color: dito > 0.5 ? "#FFFFFF" : cor.esbocoTexto,
                }}
              >
                {i + 1}
              </div>
            </div>
            {/* esqueleto: barras cinza do tamanho do texto, até a palavra */}
            {md.linhas[i].map((l, k) => (
              <div
                key={`e${k}`}
                style={{
                  position: "absolute",
                  left: xTexto,
                  top: topoTexto + k * lh + lh * 0.3,
                  width: Math.min(largura - BADGE - 26, larguraTexto(l, md.tam, MOSTRADOR) * (k === md.linhas[i].length - 1 ? 0.8 : 1)),
                  height: lh * 0.4,
                  borderRadius: lh * 0.2,
                  background: "#DCE0DA",
                  opacity: 1 - dito,
                }}
              />
            ))}
            {t >= it.em - 0.06 ? (
              <Linhas
                linhas={md.linhas[i]}
                tempos={tempos}
                t={t}
                x={xTexto}
                y={topoTexto}
                largura={largura - BADGE - 26}
                alturaLinha={lh}
                estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: md.tam, color: passou ? cor.tintaSuave : cor.tinta, letterSpacing: "-0.01em" }}
              />
            ) : null}
            {it.detalhe && t >= detalheEm - 0.06 ? (
              <Linhas
                linhas={md.detalhes[i]}
                tempos={temposDetalhe}
                t={t}
                x={xTexto}
                y={topoTexto + md.linhas[i].length * lh + 4}
                largura={largura - BADGE - 26}
                alturaLinha={48}
                estilo={{ fontFamily: sans, fontWeight: 600, fontSize: TAM_DETALHE, color: cor.tintaSuave }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
