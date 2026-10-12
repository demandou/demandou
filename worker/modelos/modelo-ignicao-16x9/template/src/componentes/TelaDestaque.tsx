// Bloco "destaque" (modo retrovisor, como as luzes): uma luz grande acende na tela central com a frase
// curta ao lado. "alerta" = o triângulo de alerta geral, vermelho, piscando (e piscando também na
// fileira); "chave" = a luz de informação, marfim, que respira. O detalhe acende embaixo quando é dito.
import { Acende, pisca, prog, saindo, temposDoTexto } from "../anim";
import { lampadaDoDestaque } from "../layout";
import { diagramar, medir } from "../medidas";
import type { Destaque, Palavra } from "../plano";
import { cor, rotulo, texto } from "../tema";
import { LuzGrande } from "./Icones";
import type { Parte } from "./Painel";

const DET = { x: 90, y: 936, w: 900, h: 330 };
const ICONE = 230;

export const TelaDestaque: React.FC<{ m: Destaque; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  if (parte !== "tela") return null;
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const alerta = m.nivel === "alerta";
  const luz = lampadaDoDestaque(m);
  const colunaX = DET.x + ICONE + 44;
  const colunaW = DET.x + DET.w - colunaX;
  const temRotulo = alerta;
  const det = m.detalhe ? diagramar(m.detalhe, { largura: colunaW, maximo: 50, minimo: 40, linhas: 2, peso: 600, espacamento: 0.04 }) : null;
  const alturaDet = det ? 20 + det.tam * 1.12 * det.linhas.length : 0;
  const corpo = diagramar(m.texto, { largura: colunaW, maximo: 92, minimo: 52, linhas: 3, altura: DET.h - alturaDet - (temRotulo ? 44 : 0), entrelinha: 1.02, peso: 700 });
  const tTexto = temposDoTexto(m.texto, palavras, m.de, m.detalheEm ?? m.ate, Math.min(m.em, m.de + 0.3) - 0.05);
  const tDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.detalheEm ?? m.em, m.ate, m.detalheEm ?? m.em + 0.4) : [];
  const alturaTexto = (temRotulo ? 44 : 0) + corpo.tam * 1.02 * corpo.linhas.length + alturaDet;
  // o conjunto (luz + texto) fica centrado na tela
  const larguraTexto = Math.max(
    ...corpo.linhas.map((l) => medir(l, corpo.tam, 700)),
    ...(det ? det.linhas.map((l) => medir(l, det.tam, 600, true, 0.04)) : [0]),
  );
  const sobra = Math.max(0, (colunaW - larguraTexto) / 2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      <div style={{ position: "absolute", left: 100, width: 880, top: 926, height: 2, background: cor.linha }} />
      <div style={{ position: "absolute", left: DET.x + sobra, top: DET.y + (DET.h - ICONE) / 2, width: ICONE, height: ICONE }}>
        <LuzGrande icone={luz} t={t} em={m.em} tamanho={ICONE} piscando={alerta ? pisca(t, m.em + 0.5, 0.8) * 0.6 + 0.4 : undefined} />
      </div>
      <div style={{ position: "absolute", left: colunaX + sobra, top: DET.y + (DET.h - alturaTexto) / 2, width: colunaW }}>
        {temRotulo ? <div style={rotulo(32, { color: t >= m.em - 0.05 ? cor.aco : cor.apagado, marginBottom: 12 })}>Alerta</div> : null}
        <Acende linhas={corpo.linhas} tempos={tTexto} t={t} entrelinha={1.02} style={texto(700, corpo.tam, { textTransform: "uppercase" })} />
        {det ? (
          <Acende
            linhas={det.linhas}
            tempos={tDet}
            t={t}
            entrelinha={1.12}
            style={texto(600, det.tam, { textTransform: "uppercase", letterSpacing: "0.04em", color: cor.marfimSuave, marginTop: 20 })}
          />
        ) : null}
      </div>
    </div>
  );
};
