import { limitar, mistura, prog } from "../anim";
import { encaixar, encaixarTodos } from "../medida";
import type { Lista as TLista, Passos, Topicos } from "../plano";
import { CORES_DAS_PARTES, display, paleta, sans } from "../tema";
import { ehClaro, F_APOIO, F_ITEM, F_TITULO, lapis, Pastilha, respiro, TextoFalado, type Paleta, type PropsBloco } from "./comum";
import { fundoPeca } from "./Grupo";
import { Icone } from "./Icones";

// cores das pastilhas de um bloco: as cores do mosaico, menos a do próprio bloco
export const coresDasPastilhas = (pal: Paleta) => CORES_DAS_PARTES.filter((c) => paleta[c].fundo !== pal.fundo && c !== "creme").map((c) => paleta[c].fundo);

// Lista em faixas (topicos, passos e o antigo `lista`). Cada item é uma faixa do bloco — um mosaico dentro
// do mosaico — que nasce a lápis (contorno tracejado) e se assenta quando o item é dito: o fundo acende,
// a marca se preenche e o texto se revela na ordem de leitura. A faixa do item atual fica mais clara.
// - topicos: a marca é uma pastilha colorida (itens sem ordem);
// - passos/lista: a marca é o número, e um trilho liga os números e avança até o passo dito.
export const Lista: React.FC<PropsBloco<Topicos | Passos | TLista>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const interna = w - 2 * pad;
  const ordenado = b.tipo !== "topicos";
  const itens = b.itens.slice(0, 6);
  const n = Math.max(itens.length, 1);

  // título (opcional), medido
  const tit = b.titulo ? encaixar(b.titulo, { largura: interna, max: 80, min: 46, linhas: 2, fonte: F_TITULO, entrelinha: 1.04 }) : null;
  const cab = tit ? tit.altura + 26 : 0;

  // as faixas preenchem o espaço que sobra (até 210 px cada)
  const gap = 14;
  const disponivel = alto - 2 * pad - cab;
  const altFaixa = limitar((disponivel - (n - 1) * gap) / n, 90, 210);
  const temDetalhe = itens.some((i) => i.detalhe);
  const temIcone = itens.some((i) => i.icone);
  const marca = ordenado ? Math.min(70, altFaixa * 0.5) : Math.min(44, altFaixa * 0.32);
  const icone = temIcone ? Math.min(altFaixa * 0.56, 96) : 0;
  const recuo = 28;
  const largTexto = interna - 2 * recuo - marca - 24 - (icone ? icone + 20 : 0);
  // um corpo só para todos os itens (o maior em que todos cabem em até 2 linhas)
  const alturaTexto = Math.max(40 * 1.06, altFaixa * 0.8 - (temDetalhe ? 46 : 0));
  const textos = encaixarTodos(
    itens.map((i) => i.texto),
    { largura: largTexto, altura: alturaTexto, max: 68, min: 40, linhas: 2, fonte: F_ITEM, entrelinha: 1.06 },
  );
  const detalhes = encaixarTodos(
    itens.map((i) => i.detalhe ?? ""),
    { largura: largTexto, max: 40, min: 32, linhas: 1, fonte: F_APOIO, entrelinha: 1.1 },
  );
  const altura = n * altFaixa + (n - 1) * gap;
  const topo = pad + cab + Math.max(0, (disponivel - altura) / 2);
  const cores = coresDasPastilhas(pal);
  const tituloEm = itens[0] ? Math.min(janela.de + 0.05, itens[0].em) : janela.de;

  // trilho dos passos: do primeiro número até o do passo atual
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.06) atual = i;
  });
  const centroMarca = (i: number) => topo + i * (altFaixa + gap) + altFaixa / 2;
  const xTrilho = pad + recuo + marca / 2;
  const pTrilho = atual >= 0 ? prog(t, itens[atual].em - 0.06, 0.45) : 0;
  const yTrilhoFim = atual > 0 ? mistura(centroMarca(atual - 1), centroMarca(atual), pTrilho) : centroMarca(0);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {tit ? (
        <div style={{ position: "absolute", left: pad, top: pad, width: interna }}>
          <TextoFalado
            linhas={tit.linhas}
            t={t}
            palavras={palavras}
            janela={janela}
            inicio={tituloEm}
            tamanho={tit.tamanho}
            cor={pal.texto}
            estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
          />
        </div>
      ) : null}
      {ordenado && n > 1 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* o trilho a lápis, e o trilho cheio que avança até o passo dito */}
          <line x1={xTrilho} y1={centroMarca(0)} x2={xTrilho} y2={centroMarca(n - 1)} stroke={lapis(pal)} strokeWidth={4} strokeDasharray="6 9" strokeLinecap="round" />
          {atual > 0 ? <line x1={xTrilho} y1={centroMarca(0)} x2={xTrilho} y2={yTrilhoFim} stroke={pal.acento} strokeWidth={6} strokeLinecap="round" /> : null}
        </svg>
      ) : null}
      {itens.map((it, i) => {
        const pCasa = prog(t, janela.de + 0.15 + i * 0.06, 0.4);
        const p = prog(t, it.em - 0.06, 0.5);
        const prox = itens[i + 1];
        const ativo = p <= 0 ? 0 : !prox || t < prox.em - 0.06 ? prog(t, it.em, 0.3) : 1 - prog(t, prox.em - 0.06, 0.3);
        const y = topo + i * (altFaixa + gap);
        const tx = textos[i];
        const dt = detalhes[i];
        const pDetalhe = prog(t, it.em + 0.35, 0.45);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pad,
              top: y,
              width: interna,
              height: altFaixa,
              borderRadius: 22,
              background: p > 0 ? fundoPeca(pal, ativo) : "transparent",
              outline: p < 0.999 ? `2.5px dashed ${lapis(pal, p)}` : undefined,
              outlineOffset: -2,
              opacity: pCasa,
              scale: String(p > 0 ? mistura(0.97, 1, p) : 1),
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: `0 ${recuo}px`,
            }}
          >
            {ordenado ? (
              <div style={{ width: marca, flexShrink: 0, display: "flex", justifyContent: "center", position: "relative" }}>
                <div
                  style={{
                    width: marca,
                    height: marca,
                    borderRadius: marca / 2,
                    background: p > 0 ? (ehClaro(pal) ? pal.acento : pal.acento) : "transparent",
                    outline: p < 0.999 ? `2.5px dashed ${lapis(pal, p)}` : undefined,
                    outlineOffset: -2,
                    scale: String(mistura(0.7, 1, p)),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: display,
                    fontWeight: 800,
                    fontSize: marca * 0.56,
                    color: p > 0.5 ? pal.fundo : lapis(pal),
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </div>
              </div>
            ) : (
              <Pastilha tamanho={marca} cor={cores[i % cores.length]} p={p} esboco={lapis(pal)} />
            )}
            {it.icone ? (
              <div style={{ flexShrink: 0, opacity: p > 0 ? 1 : 0 }}>
                <Icone nome={it.icone} tamanho={icone} cor={pal.traco} p={prog(t, it.em, 0.7)} peso={5.5} />
              </div>
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: tx.tamanho, lineHeight: 1.06, letterSpacing: "-0.015em", color: pal.texto }}>
                {tx.linhas.map((l, k) => (
                  <div
                    key={k}
                    style={{
                      whiteSpace: "nowrap",
                      clipPath: p < 0.999 ? `inset(-0.2em ${((1 - limitar(p * 1.15 - k * 0.15)) * 104).toFixed(2)}% -0.2em -0.1em)` : undefined,
                      opacity: p <= 0.001 ? 0 : 1,
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              {it.detalhe ? (
                <div style={{ fontFamily: sans, fontWeight: 600, fontSize: dt.tamanho, lineHeight: 1.1, color: pal.suave, whiteSpace: "nowrap", opacity: pDetalhe, translate: pDetalhe < 0.999 ? `0 ${(1 - pDetalhe) * 10}px` : undefined }}>
                  {dt.linhas.join(" ")}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
