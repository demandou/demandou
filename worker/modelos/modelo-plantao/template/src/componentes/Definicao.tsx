// Definição (bloco universal) em quadro cheio: o GC de verbete. O termo acende na tarja branca, no
// tamanho de manchete; embaixo, no lugar da tarja de nome, a tarja azul-noite com o sinal de igual
// em azul elétrico e o significado, que nasce "a lápis" (contorno tracejado, palavras apagadas) e
// ganha cor quando é dito.
import { limitar, Linhas, prog, temposDoTexto, varredura } from "../anim";
import { caber } from "../medidas";
import type { Definicao as D, Palavra } from "../plano";
import { cor, texto as estiloTexto } from "../tema";
import { Gc, LARGURA_GC, textoDoGc } from "./Gc";
import { Igual } from "./Icones";

const SINAL = 76;

export const Definicao: React.FC<{ m: D; palavras: Palavra[]; t: number; base: number; fim: number; alturaMax: number }> = ({ m, palavras, t, base, fim, alturaMax }) => {
  const sig = caber(m.significado, { largura: LARGURA_GC + 64 - SINAL - 52, maximo: 50, minimo: 38, linhas: 2, corte: { peso: 700 } });
  const altRodape = Math.round(sig.linhas.length * sig.tam * 1.16 + 30);
  const { linhas, tam } = textoDoGc(m.termo, { alturaMax, aba: false, nome: false, maximo: 116, minimo: 60, linhas: 2, rodape: altRodape });
  const tempos = temposDoTexto(m.termo, palavras, m.de, m.ate, Math.max(m.de + 0.1, m.em - 0.08));
  const temposSig = temposDoTexto(m.significado, palavras, m.de, m.ate, m.significadoEm - 0.08);
  const pRodape = prog(t, m.significadoEm - 0.12, 0.34);
  const pEsboco = prog(t, m.de + 0.25, 0.3);
  const rodape = (
    <div style={{ position: "relative", alignSelf: "flex-start", height: altRodape, display: "flex" }}>
      {/* "a lápis" até o significado ser dito */}
      <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, opacity: pEsboco * (1 - pRodape) }} />
      <div style={{ position: "absolute", inset: 0, background: cor.noite, clipPath: varredura(pRodape) }} />
      <div style={{ position: "relative", width: SINAL, background: pRodape > 0.2 ? cor.eletrico : "transparent", clipPath: varredura(pRodape), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Igual tamanho={40} cor={cor.branco} style={{ opacity: limitar((pRodape - 0.4) / 0.4) }} />
      </div>
      <div style={{ position: "relative", padding: "0 26px", display: "flex", alignItems: "center", opacity: Math.max(pEsboco, 0) }}>
        <Linhas linhas={sig.linhas} tempos={temposSig} t={t} esboco="rgba(169,195,255,0.4)" corDe={() => cor.branco} entrelinha={Math.round(sig.tam * 0.1)} style={{ ...estiloTexto, fontWeight: 700, fontSize: sig.tam, lineHeight: 1.06 }} />
      </div>
    </div>
  );
  return <Gc t={t} de={m.de} fim={fim} base={base} linhas={linhas} tempos={tempos} tam={tam} rodape={rodape} />;
};
