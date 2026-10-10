// Destaque (bloco universal) em quadro cheio: a faixa de plantão, de ponta a ponta na altura do
// peito. À esquerda, o bloco do nível — vermelho do plantão com o triângulo de alerta, ou azul
// elétrico com o losango da palavra-chave; à direita, a faixa branca com a frase, que acende palavra
// por palavra. O detalhe entra numa tarja azul-noite embaixo, no tempo dele.
import { limitar, Linhas, Palavras, prog, saindo, temposDoTexto, varredura } from "../anim";
import { caber, caberNaAltura } from "../medidas";
import type { Destaque as D, Palavra } from "../plano";
import { cor, manchete, texto as estiloTexto, W } from "../tema";
import { Alerta, Losango } from "./Icones";

const BLOCO = 150;
const ALT_DETALHE = 70;

export const Destaque: React.FC<{ m: D; palavras: Palavra[]; t: number; base: number; fim: number; alturaMax: number }> = ({ m, palavras, t, base, fim, alturaMax }) => {
  if (t < m.de - 0.02 || t > fim + 0.02) return null;
  const alerta = m.nivel === "alerta";
  const largura = W - BLOCO - 36 - 60;
  const detalhe = m.detalhe ? caber(m.detalhe, { largura: W - 120, maximo: 44, minimo: 36, linhas: 1, corte: { peso: 700 } }) : null;
  const { linhas, tam } = caberNaAltura(m.texto, {
    largura,
    maximo: 124,
    minimo: 64,
    linhas: 3,
    corte: { peso: 900, alta: true, espacamento: -0.01 },
    alturaMax: alturaMax - (detalhe ? ALT_DETALHE : 0) - 20,
    entrelinha: 1.06,
    extraPorTam: 0.5,
  });
  const altura = Math.round(linhas.length * tam * 1.06 + tam * 0.5);
  const inicio = Math.max(m.de, m.em - 0.08);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  // a faixa abre no começo do momento com a frase "a lápis"; o bloco do nível bate na palavra
  const pFaixa = prog(t, m.de, 0.36);
  const pBloco = prog(t, Math.max(m.de + 0.06, inicio - 0.12), 0.3);
  const detalheEm = m.detalheEm ?? (tempos[tempos.length - 1] ?? m.em) + 0.4;
  const pDetalhe = prog(t, detalheEm - 0.08, 0.34);
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, detalheEm - 0.06) : [];
  const s = saindo(t, fim, 0.26);
  const yFaixa = base - (detalhe ? ALT_DETALHE : 0) - altura;
  // o ícone dá um "toque" quando a primeira palavra é dita
  const toque = 1 + 0.12 * Math.sin(limitar((t - (tempos[0] ?? inicio)) / 0.3) * Math.PI);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s, translate: `${-60 * s}px 0` }}>
      <div style={{ position: "absolute", left: 0, top: yFaixa, width: BLOCO, height: altura, background: alerta ? cor.plantao : cor.eletrico, clipPath: varredura(pBloco), display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: limitar((pBloco - 0.4) / 0.4), scale: String(toque) }}>
          {alerta ? <Alerta tamanho={78} cor={cor.branco} /> : <Losango tamanho={70} cor={cor.branco} />}
        </div>
      </div>
      <div style={{ position: "absolute", left: BLOCO, top: yFaixa, width: W - BLOCO, height: altura, background: cor.papel, clipPath: varredura(pFaixa), display: "flex", alignItems: "center", paddingLeft: 36 }}>
        <Linhas
          linhas={linhas}
          tempos={tempos}
          t={t}
          esboco={cor.apagadoNoPapel}
          corDe={() => cor.tinta}
          entrelinha={Math.round(tam * 0.06)}
          style={{ ...manchete, fontSize: tam, opacity: limitar((pFaixa - 0.45) / 0.4) }}
        />
      </div>
      {detalhe ? (
        <div style={{ position: "absolute", left: 0, top: base - ALT_DETALHE, height: ALT_DETALHE, background: cor.noite, clipPath: varredura(pDetalhe), display: "flex", alignItems: "center", padding: "0 40px 0 60px" }}>
          <div style={{ opacity: limitar((pDetalhe - 0.4) / 0.4) }}>
            <Palavras palavras={(m.detalhe ?? "").split(/\s+/).filter(Boolean)} tempos={temposDetalhe} t={t} esboco="rgba(169,195,255,0.35)" corDe={() => cor.branco} style={{ ...estiloTexto, fontWeight: 700, fontSize: detalhe.tam }} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
