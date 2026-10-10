// Definição: a nota de glossário do episódio, embaixo do quadro. O rótulo mono "GLOSSÁRIO"; o termo
// grande acende no `em` e ganha o sublinhado rosa; embaixo, o sinal "=" rosa e o significado, a lápis,
// acendendo palavra por palavra a partir do `significadoEm`.
import { Linhas, prog, temposDoTexto } from "../anim";
import { abaixoDoQuadro } from "../layout";
import { caber, medir } from "../medidas";
import type { Definicao as DefinicaoT, Palavra } from "../plano";
import { cor, FUNDO, MARGEM, mono, titulo, W } from "../tema";
import { faixa, Rotulo } from "./comum";

const LARGURA = W - 2 * MARGEM;
const RECUO = 76;

export const Definicao: React.FC<{ m: DefinicaoT; palavras: Palavra[]; t: number; fim: number; atraso?: number }> = ({ m, palavras, t, fim, atraso }) => {
  const topo = abaixoDoQuadro("citacao");
  const altura = FUNDO - topo;
  const { opacidade, dy } = faixa(t, m.de, fim, atraso);
  const cabecalho = 40 + 18;
  // o termo: até 2 linhas, grande; o significado: até 3 linhas, menor (hierarquia)
  const termo = caber(m.termo, { largura: LARGURA, maximo: 104, minimo: 64, linhas: 2, altura: (altura - cabecalho) * 0.46, entrelinha: 1.04, piso: 48 });
  const alturaTermo = termo.linhas.length * termo.tam * 1.04;
  const livre = altura - cabecalho - alturaTermo - 34;
  const sig = caber(m.significado, { largura: LARGURA - RECUO, maximo: Math.min(72, termo.tam - 16), minimo: 44, linhas: 3, altura: livre, entrelinha: 1.1, peso: 700, piso: 36 });
  const temposTermo = temposDoTexto(m.termo, palavras, m.de - 0.1, m.significadoEm, m.em);
  const temposSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.1, m.ate, m.significadoEm);
  const pSublinha = prog(t, Math.max(...temposTermo) + 0.2, 0.4);
  const pIgual = prog(t, m.significadoEm - 0.06, 0.25);
  const ultima = termo.linhas[termo.linhas.length - 1] ?? "";
  return (
    <div style={{ position: "absolute", left: MARGEM, top: topo, width: LARGURA, opacity: opacidade, translate: `0 ${dy}px` }}>
      <Rotulo nome="Glossário" />
      <div style={{ height: 18 }} />
      <div style={{ position: "relative" }}>
        <Linhas linhas={termo.linhas} tempos={temposTermo} t={t} tam={termo.tam} modo="acende" entrelinha={1.04} estilo={{ ...titulo, fontSize: termo.tam }} />
        {pSublinha > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: alturaTermo + 2,
              width: medir(ultima, termo.tam, 800) * pSublinha,
              height: Math.max(7, termo.tam * 0.07),
              borderRadius: 4,
              background: cor.acento,
            }}
          />
        ) : null}
      </div>
      <div style={{ display: "flex", marginTop: 34 }}>
        <div style={{ width: RECUO, flexShrink: 0, height: sig.tam * 1.1, display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: mono, fontWeight: 500, fontSize: Math.max(44, sig.tam), lineHeight: 1, color: pIgual > 0.5 ? cor.acento : cor.apagado }}>=</span>
        </div>
        <Linhas linhas={sig.linhas} tempos={temposSig} t={t} tam={sig.tam} modo="acende" entrelinha={1.1} estilo={{ ...titulo, fontWeight: 700, fontSize: sig.tam }} />
      </div>
    </div>
  );
};
