import { Linha, prog, saindo, useTempo } from "../anim";
import { encaixarTodos, quebrar, SANS, SERIF } from "../medida";
import type { ItemFalado } from "../plano";
import { cor, minimo, sans, serif, sombra } from "../tema";
import { IconeTraco } from "./Icones";
import { Ajuste, type Folga, Letreiro } from "./Pecas";

// Lista do Autoridade (topicos e passos): uma linha por item, separadas por fios finos, cada item
// sobe da máscara quando é dito e os anteriores recuam. Tópicos levam um travessão de latão;
// passos, numerais serifados de latão ligados por um fio que se desenha de um passo ao seguinte.
// Com muitos itens ou textos longos, a lista rola: o item novo entra embaixo e os primeiros saem
// por cima, apagando.
export const Itens: React.FC<{
  titulo?: string;
  itens: ItemFalado[];
  marcador: "traco" | "numero";
  de: number;
  ate: number;
  largura: number;
  altura: number;
  folga?: Folga;
}> = ({ titulo, itens, marcador, de, ate, largura, altura, folga }) => {
  const t = useTempo();
  const sai = saindo(t, ate);
  const comIcone = itens.some((i) => i.icone);
  const colMarcador = marcador === "numero" ? 70 : 40;
  const gap = 26;
  const larguraTexto = largura - colMarcador - gap - (comIcone ? 80 + gap : 0);
  const { tamanho, quebras } = encaixarTodos(
    itens.map((i) => i.texto),
    { largura: larguraTexto, max: 60, min: minimo.corpo, linhas: 2, estilo: () => SERIF },
  );
  const tamDetalhe = minimo.detalhe;
  const detalhes = itens.map((i) => (i.detalhe ? quebrar(i.detalhe, larguraTexto, tamDetalhe, () => SANS) : []));
  const alturaTitulo = titulo ? 58 : 0;
  const linhaTexto = tamanho * 1.06;
  const conteudos = itens.map(
    (_, k) => quebras[k].linhas.length * linhaTexto + (detalhes[k].length ? detalhes[k].length * tamDetalhe * 1.2 + 8 : 0),
  );
  const alturas = conteudos.map((c) => Math.max(c + 30, tamanho * 1.7, marcador === "numero" ? 104 : 0));
  const total = alturas.reduce((s, h) => s + h, 0);
  // cabe na zona? senão, usa a folga; se nem assim, a lista rola
  const disponivel = (folga && total > folga.zona - alturaTitulo + 2 ? altura : (folga?.zona ?? altura)) - alturaTitulo;
  // itens curtos ganham respiro até a medida do exemplo aprovado (142)
  const respiro = Math.min(1.25, Math.max(1, (disponivel / Math.max(1, total)) * 0.98));
  const hs = alturas.map((h) => Math.max(h, Math.min(h * respiro, 142)));
  const topos = hs.map((_, k) => hs.slice(0, k).reduce((s, h) => s + h, 0));
  const alturaTotal = hs.reduce((s, h) => s + h, 0);
  const rola = alturaTotal > disponivel + 2;
  // deslocamento da lista: o item que entra fica sempre inteiro (embaixo) e os de cima saem
  // inteiros (o corte cai sempre entre dois itens)
  let desloc = 0;
  if (rola) {
    let anterior = 0;
    itens.forEach((item, k) => {
      const fundo = topos[k] + hs[k];
      const primeiro = topos.findIndex((tp) => fundo - tp <= disponivel + 0.5);
      const alvo = Math.max(0, topos[Math.max(0, primeiro)]);
      desloc += (alvo - anterior) * prog(t, item.em - 0.12, 0.5);
      anterior = alvo;
    });
  }
  const janela = rola ? disponivel : alturaTotal;
  const numeral = (k: number) => Math.min(104, Math.max(64, hs[k] * 0.72));

  return (
    <Ajuste h={alturaTitulo + janela} folga={folga}>
    <div style={{ width: "100%", fontFamily: serif, opacity: 1 - sai, translate: `0 ${-14 * sai}px`, textShadow: sombra }}>
      {titulo ? (
        <div style={{ height: alturaTitulo, display: "flex", alignItems: "flex-start" }}>
          <Letreiro texto={titulo} t={t} inicio={de} largura={largura} fios="depois" alinhar="left" corTexto={cor.lataoClaro} corFio={cor.fio} />
        </div>
      ) : null}
      <div
        style={{
          position: "relative",
          height: janela,
          overflow: rola ? "hidden" : "visible",
          maskImage: rola && desloc > 1 ? "linear-gradient(to bottom, transparent 0, black 22px, black 100%)" : undefined,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: -desloc }}>
          {itens.map((item, k) => {
            const proximo = itens[k + 1];
            const entra = prog(t, item.em, 0.5);
            const recuo = proximo ? prog(t, proximo.em, 0.4) : 0;
            const visivel = t >= item.em - 0.05;
            const linhas = quebras[k].linhas;
            // fio do passo: do numeral deste item até o do seguinte, quando o seguinte é dito
            const fio = marcador === "numero" && proximo ? prog(t, proximo.em - 0.25, 0.45) : 0;
            return (
              <div
                key={`${item.texto}-${k}`}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: topos[k],
                  height: hs[k],
                  display: "flex",
                  alignItems: "center",
                  gap,
                  borderBottom: k < itens.length - 1 && visivel ? `1px solid rgba(242,236,223,${0.18 * entra})` : "none",
                }}
              >
                {marcador === "numero" && fio > 0 && proximo ? (
                  <div
                    style={{
                      position: "absolute",
                      left: colMarcador / 2 - 1,
                      top: hs[k] / 2 + numeral(k) * 0.44,
                      width: 2,
                      height: Math.max(0, hs[k] / 2 + hs[k + 1] / 2 - numeral(k) * 0.44 - numeral(k + 1) * 0.5) * fio,
                      background: cor.latao,
                      opacity: 0.8,
                    }}
                  />
                ) : null}
                {visivel ? (
                  <>
                    <div
                      style={{
                        width: colMarcador,
                        flexShrink: 0,
                        alignSelf: "stretch",
                        display: "flex",
                        alignItems: marcador === "numero" ? "center" : "flex-start",
                        justifyContent: "center",
                        opacity: 1 - 0.42 * recuo,
                      }}
                    >
                      {marcador === "numero" ? (
                        <Linha
                          p={entra}
                          style={{
                            fontSize: numeral(k),
                            lineHeight: 1.0,
                            color: cor.lataoClaro,
                            textAlign: "center",
                          }}
                        >
                          {k + 1}
                        </Linha>
                      ) : (
                        <div
                          style={{
                            width: 34,
                            height: 3,
                            background: cor.latao,
                            scale: `${entra} 1`,
                            transformOrigin: "left",
                            alignSelf: "flex-start",
                            // na altura do meio da primeira linha do item
                            marginTop: (hs[k] - conteudos[k]) / 2 + linhaTexto * 0.55 - 1.5,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, opacity: 1 - 0.42 * recuo }}>
                      {linhas.map((l, j) => (
                        <Linha
                          key={j}
                          p={prog(t, item.em + 0.08 + j * 0.07, 0.55)}
                          style={{ fontSize: tamanho, lineHeight: 1.06, color: cor.papel, whiteSpace: "nowrap" }}
                        >
                          {l.map((p) => p.w).join(" ")}
                        </Linha>
                      ))}
                      {detalhes[k].length ? (
                        <div style={{ marginTop: 8, opacity: prog(t, item.em + 0.4, 0.4) }}>
                          {detalhes[k].map((l, j) => (
                            <div key={j} style={{ fontFamily: sans, fontWeight: 500, fontSize: tamDetalhe, lineHeight: 1.2, color: cor.papelSuave, whiteSpace: "nowrap" }}>
                              {l.map((p) => p.w).join(" ")}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {comIcone ? (
                      <div style={{ width: 80, flexShrink: 0, opacity: entra * (1 - 0.42 * recuo) }}>
                        {item.icone ? <IconeTraco nome={item.icone} p={prog(t, item.em + 0.25, 1.1)} tamanho={80} cor={cor.lataoClaro} /> : null}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </Ajuste>
  );
};
