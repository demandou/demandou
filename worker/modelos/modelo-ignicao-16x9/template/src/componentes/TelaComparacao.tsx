// Bloco "comparacao" (modo comparar): a tela central se divide em dois lados, cada um em cima de um
// dos mostradores grandes (que viram os dois lados: perdem os números e ganham o nome do lado). Cada
// lado acende quando é dito e o ponteiro dele sobe; com vencedor, o ponteiro do vencedor vai alto, o do
// outro cai, e o lado que perde baixa a luz (em "errado-certo", o errado é riscado).
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { niveisDaComparacao } from "../layout";
import { diagramar } from "../medidas";
import type { Comparacao, Palavra } from "../plano";
import { cor, rotulo, texto } from "../tema";
import type { Parte } from "./Painel";

const TELA = { x: 60, y: 792, w: 960, h: 330 };
const MEIO = TELA.x + TELA.w / 2;

export const TelaComparacao: React.FC<{ m: Comparacao; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  if (parte !== "tela") return null;
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const n = niveisDaComparacao(m);
  const titulo = m.titulo ? diagramar(m.titulo, { largura: TELA.w - 80, maximo: 34, minimo: 30, linhas: 1, peso: 600, espacamento: 0.14 }) : null;
  const topo = TELA.y + (titulo ? 76 : 30);
  const largura = TELA.w / 2 - 92;
  const altura = TELA.y + TELA.h - 26 - topo - 46;
  const simbolo = (m.modo ?? "contra") === "contra" ? "×" : "→";
  const lados = m.lados.map((l, i) => {
    const outro = m.lados[1 - i];
    const fala = i === 0 ? Math.min(l.em, outro.em) : l.em;
    const r = diagramar(l.texto, { largura, maximo: 66, minimo: 44, linhas: 3, altura, entrelinha: 1.04, peso: 700 });
    const tr = diagramar(l.rotulo, { largura, maximo: 34, minimo: 30, linhas: 1, peso: 600, espacamento: 0.14 });
    const fimDaFala = l.em < outro.em ? outro.em : m.ate;
    const tempos = temposDoTexto(l.texto, palavras, fala - 0.3, fimDaFala, l.em - 0.05);
    const tRot = temposDoTexto(l.rotulo, palavras, m.de, m.ate, l.em - 0.05);
    const perde = n.perdedor === i && n.apagaEm !== undefined ? prog(t, n.apagaEm, 0.4) : 0;
    const ganha = n.vencedor === i && n.apagaEm !== undefined ? prog(t, n.apagaEm, 0.5) : 0;
    return { l, r, tr, tempos, tRot, perde, ganha };
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {titulo ? (
        <div style={{ position: "absolute", left: TELA.x, width: TELA.w, top: TELA.y + 26, display: "flex", justifyContent: "center" }}>
          <div style={rotulo(titulo.tam, { color: cor.marfimSuave, whiteSpace: "nowrap" })}>{titulo.linhas[0]}</div>
        </div>
      ) : null}
      {/* divisória e o símbolo da comparação */}
      <div style={{ position: "absolute", left: MEIO - 1, top: topo, width: 2, height: TELA.y + TELA.h - 26 - topo, background: cor.linha }} />
      <div
        style={{
          position: "absolute",
          left: MEIO - 34,
          top: topo + (TELA.y + TELA.h - 26 - topo) / 2 - 34,
          width: 68,
          height: 68,
          borderRadius: 34,
          background: cor.vidro,
          boxShadow: `inset 0 0 0 2.5px ${t >= m.lados[1].em - 0.05 ? cor.marfim : cor.apagado}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...texto(700, 44, { lineHeight: 1, color: t >= m.lados[1].em - 0.05 ? cor.marfim : cor.apagado }),
        }}
      >
        {simbolo}
      </div>
      {lados.map(({ l, r, tr, tempos, tRot, perde, ganha }, i) => {
        const x = i === 0 ? TELA.x + 40 : MEIO + 52;
        const riscar = m.modo === "errado-certo" && perde > 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: topo, width: largura, opacity: 1 - 0.45 * perde }}>
            {/* o filete do lado que vence se desenha em cima dele */}
            <div style={{ height: 4, width: `${ganha * 100}%`, background: cor.marfim, borderRadius: 2, marginBottom: 14, opacity: ganha > 0 ? 1 : 0 }} />
            <Acende linhas={tr.linhas} tempos={tRot} t={t} style={rotulo(tr.tam, { color: cor.aco, letterSpacing: "0.14em" })} />
            <Acende
              linhas={r.linhas}
              tempos={tempos}
              t={t}
              entrelinha={1.04}
              marcas={riscar ? (k) => ({ tipo: "risca", em: (n.apagaEm ?? l.em) + k * 0.05, continua: true }) : undefined}
              style={texto(700, r.tam, { textTransform: "uppercase", marginTop: 14 })}
            />
          </div>
        );
      })}
    </div>
  );
};
