// Número no painel do estúdio (bloco universal `numero` e o `dado` antigo): o rótulo em cima, o
// número grande que conta até o valor no instante em que é dito, uma linha azul que corre do centro
// para as pontas, a linha de apoio e a fonte do dado, como nas telas de economia.
import { limitar, Linhas, prog, temposDoTexto } from "../anim";
import type { Area } from "../layout";
import { caber } from "../medidas";
import type { Dado as D, Numero as N, Palavra } from "../plano";
import { cor, manchete, MARGEM, numeros, rotulo, texto, W } from "../tema";
import { contando, escreverNumero } from "../valores";
import { Ilustrativo } from "./Selos";

export const Dado: React.FC<{ m: D | N; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const largura = W - 2 * MARGEM;
  const universal = m.tipo === "numero";
  const valorFinal = universal ? escreverNumero(m.valor, m) : m.valor;
  const pConta = prog(t, m.em - 0.04, 0.9);
  const valorAgora = universal ? escreverNumero(m.valor, m, m.valor * pConta) : contando(m.valor, pConta);
  const rotuloEm = universal ? (m.rotuloEm ?? Math.max(entra + 0.2, m.de)) : entra + 0.2;
  const temposRotulo = temposDoTexto(m.rotulo, palavras, m.de, m.ate, rotuloEm);
  const rot = caber(m.rotulo, { largura: largura - (m.ilustrativo ? 260 : 0), maximo: 44, minimo: 32, linhas: 2, corte: { peso: 800, alta: true, espacamento: 0.06 } });
  const apoioEm = universal ? (m.apoioEm ?? m.em + 0.2) : m.em + 0.2;
  const temposApoio = m.apoio ? temposDoTexto(m.apoio, palavras, m.de, m.ate, apoioEm) : [];
  const apoio = m.apoio ? caber(m.apoio, { largura, maximo: 48, minimo: 36, linhas: 2, corte: { peso: 700 } }) : null;
  // o número fica com o que sobra da altura do painel
  const alturaFixa = 30 + rot.linhas.length * rot.tam * 1.06 + 14 + 14 + 6 + 14 + (apoio ? apoio.linhas.length * apoio.tam * 1.12 : 0) + (m.fonte ? 46 : 0) + 24;
  const tamMax = Math.max(90, Math.min(210, area.h - alturaFixa));
  const tamValor = caber(valorFinal, { largura, maximo: tamMax, minimo: 70, linhas: 1, corte: { peso: 900, alta: true, tabular: true } }).tam;
  const pLinha = prog(t, m.em, 0.7);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {m.ilustrativo ? <Ilustrativo style={{ position: "absolute", right: MARGEM, top: area.y + 30 }} /> : null}
      <div style={{ position: "absolute", left: MARGEM, top: area.y + 30, width: largura, height: area.h - 54, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: m.fonte ? "flex-start" : "center", textAlign: "center", gap: 14 }}>
        <Linhas linhas={rot.linhas} tempos={temposRotulo} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.celeste} alinhar="center" entrelinha={Math.round(rot.tam * 0.06)} style={{ ...rotulo, fontSize: rot.tam, alignItems: "center" }} />
        <div style={{ position: "relative", ...manchete, ...numeros, fontSize: tamValor, letterSpacing: 0, lineHeight: 1, whiteSpace: "pre" }}>
          <span style={{ color: cor.apagadoNoAzul, opacity: 1 - limitar(pConta * 4) }}>{valorFinal}</span>
          <span style={{ position: "absolute", left: 0, top: 0, color: cor.branco, opacity: limitar(pConta * 4) }}>{pConta >= 1 ? valorFinal : valorAgora}</span>
        </div>
        <div style={{ position: "relative", height: 6, width: largura }}>
          <div style={{ position: "absolute", inset: 0, background: cor.apagadoNoAzul }} />
          <div style={{ position: "absolute", left: (largura * (1 - pLinha)) / 2, top: 0, bottom: 0, width: largura * pLinha, background: cor.eletrico }} />
        </div>
        {apoio ? (
          <Linhas linhas={apoio.linhas} tempos={temposApoio} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.branco} alinhar="center" style={{ ...texto, fontWeight: 700, fontSize: apoio.tam, alignItems: "center" }} />
        ) : null}
        {m.fonte ? <div style={{ marginTop: "auto", ...rotulo, fontSize: 32, letterSpacing: "0.04em", color: cor.celeste, opacity: prog(t, m.em + 0.3, 0.4) }}>{m.fonte}</div> : null}
      </div>
    </div>
  );
};
