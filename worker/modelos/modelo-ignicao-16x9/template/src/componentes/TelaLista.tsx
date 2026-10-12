// Bloco "topicos" (modo tela grande): o menu do computador de bordo. Os itens já estão na tela, apagados
// atrás do vidro; cada um acende quando é dito, com a luzinha numerada dele, e o cursor (a faixa clara
// com o filete marfim) desliza até o item da vez. Os itens anteriores ficam um pouco mais baixos de
// luz: um item grande por vez. Embaixo, entre os mostradores, o contador.
import { Acende, mistura, prog, saindo, temposDoTexto, troca } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Palavra, Topicos } from "../plano";
import { cor, rotulo, texto } from "../tema";
import { Contador } from "./Contador";
import { Luz } from "./Icones";
import type { Parte } from "./Painel";

const AREA = { x: 84, y: 810, w: 912, h: 444 };
const LUZ = 64;

// as linhas de uma lista (também usada pelos passos e pela pergunta com opções): todas no mesmo corpo.
// Primeiro tenta uma linha por item (do maior corpo até `minimo`); se algum item não couber, todos
// passam a ter até duas linhas, no maior corpo que a altura da linha deixa (nunca abaixo de 30 px).
export const diagramarLista = (textos: string[], largura: number, alturaLinha: number, maximo = 64, minimo = 44) => {
  const cabe = (d: { linhas: string[]; tam: number }) => d.linhas.every((l) => medir(l, d.tam, 700) <= largura + 1);
  const comum = (linhas: number, max: number, min: number) => {
    const porItem = textos.map((x) => diagramar(x, { largura, maximo: max, minimo: min, linhas, altura: alturaLinha - 16, entrelinha: 1.04, peso: 700 }));
    const tam = Math.min(...porItem.map((d) => d.tam));
    return textos.map((x) => diagramar(x, { largura, maximo: tam, minimo: tam, linhas, altura: alturaLinha - 16, entrelinha: 1.04, peso: 700 }));
  };
  const uma = comum(1, Math.min(maximo, alturaLinha - 22), Math.min(minimo, alturaLinha - 22));
  if (uma.every(cabe)) return uma;
  const max2 = Math.max(30, Math.min(maximo, Math.floor((alturaLinha - 16) / 2.08)));
  return comum(2, max2, 30);
};

export const TelaLista: React.FC<{ m: Topicos; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const itens = [...m.itens].sort((a, b) => a.em - b.em);
  const n = Math.max(1, itens.length);
  if (parte === "fora") {
    return (
      <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
        <Contador rotulo={m.titulo ?? "Itens"} tempos={itens.map((x) => x.em)} t={t} topo={1322} tamanho={62} />
      </div>
    );
  }
  const alturaLinha = AREA.h / n;
  const temDetalhe = itens.some((x) => x.detalhe) && alturaLinha >= 44 + 42 + 22;
  const textoX = AREA.x + 28 + LUZ + 30;
  const largura = AREA.x + AREA.w - 28 - textoX;
  const corpos = diagramarLista(
    itens.map((x) => x.texto),
    largura,
    alturaLinha - (temDetalhe ? 42 : 0),
  );
  // o item da vez e o cursor que desliza até ele
  let atual = -1;
  itens.forEach((x, i) => {
    if (t >= x.em - 0.05) atual = i;
  });
  let cursorY = AREA.y;
  itens.forEach((x, i) => {
    const p = prog(t, x.em - 0.08, 0.32, troca);
    cursorY = i === 0 ? AREA.y : mistura(cursorY, AREA.y + i * alturaLinha, p);
  });
  const cursor = itens.length ? prog(t, itens[0].em - 0.08, 0.2) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {/* o cursor do menu */}
      <div
        style={{
          position: "absolute",
          left: AREA.x,
          top: cursorY + 6,
          width: AREA.w,
          height: alturaLinha - 12,
          borderRadius: 18,
          background: "rgba(241,237,228,0.065)",
          boxShadow: "inset 6px 0 0 0 #F1EDE4",
          opacity: cursor,
        }}
      />
      {itens.map((item, i) => {
        const y = AREA.y + i * alturaLinha;
        const proximo = itens[i + 1];
        const tempos = temposDoTexto(item.texto, palavras, item.em - 0.3, proximo ? proximo.em : m.ate, item.em - 0.05);
        const passado = i < atual ? prog(t, (proximo?.em ?? 0) - 0.05, 0.3) : 0;
        const corpo = corpos[i];
        const det = item.detalhe && temDetalhe ? diagramar(item.detalhe, { largura, maximo: 36, minimo: 30, linhas: 1, peso: 600, espacamento: 0.04 }) : null;
        const tDet = det && item.detalhe ? temposDoTexto(item.detalhe, palavras, item.em, proximo ? proximo.em : m.ate, item.em + 0.2) : [];
        const alturaBloco = corpo.tam * corpo.linhas.length * 1.04 + (det ? 10 + det.tam : 0);
        return (
          <div key={`${item.texto}-${i}`} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - 0.38 * passado }}>
            {/* filete entre as linhas */}
            {i > 0 ? <div style={{ position: "absolute", left: AREA.x + 24, width: AREA.w - 48, top: y, height: 2, background: cor.linha }} /> : null}
            <Luz
              icone={`n${Math.min(5, i + 1)}` as "n1"}
              acesa={prog(t, item.em - 0.05, 0.14)}
              corLuz="marfim"
              tamanho={LUZ}
              style={{ position: "absolute", left: AREA.x + 28, top: y + (alturaLinha - LUZ) / 2 }}
            />
            <div style={{ position: "absolute", left: textoX, top: y + (alturaLinha - alturaBloco) / 2, width: largura }}>
              <Acende linhas={corpo.linhas} tempos={tempos} t={t} entrelinha={1.04} style={texto(700, corpo.tam, { textTransform: "uppercase" })} />
              {det ? (
                <Acende linhas={det.linhas} tempos={tDet} t={t} style={rotulo(det.tam, { color: cor.marfimSuave, letterSpacing: "0.04em", marginTop: 10 })} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
