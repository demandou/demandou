// Momento "luzes" (modo retrovisor): a tela central grande mostra a luz que acabou de acender —
// o desenho dela, grande, reagindo ao que é dito — com o nome e a frase sobre ela. A fileira de
// luzes fica no alto da tela (desenhada pelo Edicao) e embaixo, entre os mostradores, o contador.
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Luzes, Palavra } from "../plano";
import { lampadaDoItem } from "../layout";
import { cor, rotulo, texto } from "../tema";
import { Contador } from "./Contador";
import type { Parte } from "./Painel";
import { LuzGrande } from "./Icones";

// área do detalhe dentro da tela grande (px do quadro)
const DET = { x: 90, y: 936, w: 900, h: 330 };
const ICONE = 240;

export const TelaLuzes: React.FC<{ m: Luzes; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  // a luz de cada item é fixada pela posição no plano (luz numerada 1, 2, 3… quando não tem ícone)
  const itens = m.itens.map((x, i) => ({ ...x, luz: lampadaDoItem(x.icone, i) })).sort((a, b) => a.em - b.em);
  // "Luz 1 de 3" no carro; com um título próprio, só "1 de 3"; com uma luz só, nada
  const contagem = (i: number) => (itens.length < 2 ? "" : m.titulo ? `${i + 1} de ${itens.length}` : `Luz ${i + 1} de ${itens.length}`);
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const colunaX = DET.x + ICONE + 40;
  const colunaW = DET.x + DET.w - colunaX;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {parte === "tela" ? (
        <>
      {/* filete que separa a fileira de luzes do detalhe */}
      <div style={{ position: "absolute", left: 100, width: 880, top: 926, height: 2, background: cor.linha }} />

      {itens.map((item, i) => {
        const proximo = itens[i + 1];
        // a luz que sai some inteira antes de a próxima aparecer (nunca dois textos um sobre o outro)
        const de = i === 0 ? -1 : item.em - 0.04;
        const ate = proximo ? proximo.em - 0.04 : Infinity;
        if (t < de - 0.01 || t > ate + 0.01) return null;
        const e = i === 0 ? 1 : prog(t, de, 0.22);
        const x = proximo ? saindo(t, ate, 0.16) : 0;
        // nome em uma linha (palavra longa: até duas, com corpo menor)
        const nome1 = diagramar(item.nome, { largura: colunaW, maximo: 92, minimo: 64, linhas: 1, peso: 700 });
        const nome =
          nome1.linhas.length === 1 && medir(nome1.linhas[0], nome1.tam, 700) <= colunaW
            ? nome1
            : diagramar(item.nome, { largura: colunaW, maximo: 72, minimo: 52, linhas: 2, peso: 700 });
        const detalhe = item.detalhe
          ? diagramar(item.detalhe, { largura: colunaW, maximo: 52, minimo: 44, linhas: 2, peso: 600, espacamento: 0.04 })
          : null;
        const fimFala = proximo ? proximo.em : m.ate;
        // o nome acende na palavra dita (um nome que resume a fala acende com a luz)
        const tNome = temposDoTexto(nome.linhas.join(" "), palavras, item.em - 0.3, fimFala, item.em - 0.04);
        // a frase acende no tempo de cada palavra falada (a reação do desenho é que espera o detalheEm)
        const tDetalhe = item.detalhe ? temposDoTexto(item.detalhe, palavras, Math.min(item.em, item.detalheEm ?? item.em) - 0.3, fimFala, item.em + 0.12) : [];
        const alturaTexto = (contagem(i) ? 40 : 0) + nome.tam * nome.linhas.length + (detalhe ? 18 + detalhe.tam * 1.12 * detalhe.linhas.length : 0);
        // o conjunto (desenho + texto) fica centrado na tela
        const larguraTexto = Math.max(
          medir(contagem(i), 32, 600, true, 0.14),
          ...nome.linhas.map((l) => medir(l, nome.tam, 700)),
          ...(detalhe ? detalhe.linhas.map((l) => medir(l, detalhe.tam, 600, true, 0.04)) : [0]),
        );
        const sobra = Math.max(0, (colunaW - larguraTexto) / 2);
        return (
          <div key={`${item.luz}-${i}`} style={{ position: "absolute", inset: 0, opacity: e * (1 - x), translate: `0 ${(1 - e) * 26 - x * 26}px` }}>
            <div style={{ position: "absolute", left: DET.x + sobra, top: DET.y + (DET.h - ICONE) / 2, width: ICONE, height: ICONE }}>
              <LuzGrande icone={item.luz} t={t} em={item.em} detalheEm={item.detalheEm} tamanho={ICONE} corLuz={item.cor} />
            </div>
            <div style={{ position: "absolute", left: colunaX + sobra, top: DET.y + (DET.h - alturaTexto) / 2, width: colunaW }}>
              {contagem(i) ? <div style={rotulo(32, { color: t >= item.em ? cor.aco : cor.apagado })}>{contagem(i)}</div> : null}
              <Acende linhas={nome.linhas} tempos={tNome} t={t} style={texto(700, nome.tam, { textTransform: "uppercase", lineHeight: 1, marginTop: contagem(i) ? 8 : 0 })} />
              {detalhe ? (
                <Acende
                  linhas={detalhe.linhas}
                  tempos={tDetalhe}
                  t={t}
                  entrelinha={1.12}
                  style={texto(600, detalhe.tam, { textTransform: "uppercase", letterSpacing: "0.04em", color: cor.marfimSuave, marginTop: 18 })}
                />
              ) : null}
            </div>
          </div>
        );
      })}

        </>
      ) : null}
      {parte === "fora" ? (
        <>
      {/* contador entre os mostradores compactos (com uma luz só: o título, se houver) */}
      {itens.length >= 2 ? (
        <Contador rotulo={m.titulo ?? "Luzes de alerta"} tempos={itens.map((x) => x.em)} t={t} />
      ) : m.titulo ? (
        <div style={{ position: "absolute", left: 330, width: 420, top: 1350, display: "flex", justifyContent: "center" }}>
          <Acende
            linhas={diagramar(m.titulo, { largura: 400, maximo: 52, minimo: 36, linhas: 2, peso: 700 }).linhas}
            tempos={temposDoTexto(m.titulo, palavras, m.de, m.ate)}
            t={t}
            alinhar="center"
            style={texto(700, diagramar(m.titulo, { largura: 400, maximo: 52, minimo: 36, linhas: 2, peso: 700 }).tam, { textTransform: "uppercase" })}
          />
        </div>
      ) : null}
        </>
      ) : null}
    </div>
  );
};
