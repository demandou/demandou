import { mistura, prog, saindo, useTempo } from "../anim";
import { E, encaixar, type Pedaco } from "../medida";
import type { Frase } from "../motor/frases";
import { cor, LEGENDA, TAM, texto, W } from "../tema";
import { GRAO_PAPEL } from "./Papel";

// Legenda da tela cheia (quadro deitado): a pessoa fala em tela cheia e a legenda vem num cartão de
// papel algodão no terço de baixo, centrado, com texto chocolate; cada palavra ganha tinta quando é
// dita (como no vertical, onde ela ficava no papel do convite). O texto é medido e encolhe até caber
// em 2 linhas; o cartão acompanha a largura da frase e, entre frases coladas, não pisca: só muda de
// largura.
const PAD_X = 40;
const PAD_Y = 16;
// frases separadas por menos que isto dividem o mesmo cartão
const COLADAS = 0.35;

const medir = (f: Frase) => {
  const ps: Pedaco[] = f.palavras.map((p) => ({ w: p.w, e: { ...E.texto, entrelinha: 1.18 } }));
  const enc = encaixar(ps, { largura: LEGENDA.largura, max: TAM.legenda, min: TAM.minTexto, linhas: LEGENDA.linhas, gap: 0.26 });
  return { enc, w: enc.largura + 2 * PAD_X, h: enc.altura + 2 * PAD_Y };
};

export const Legendas: React.FC<{ frases: Frase[]; opacidade: number }> = ({ frases, opacidade }) => {
  const t = useTempo();
  if (opacidade <= 0.001 || frases.length === 0) return null;
  // a frase da vez: a última que já começou, enquanto dura (ou até a próxima, se ela vem colada)
  let i = -1;
  frases.forEach((f, j) => {
    if (t >= f.de - 0.05) i = j;
  });
  if (i < 0) return null;
  const atual = frases[i];
  const antes = i > 0 ? frases[i - 1] : null;
  const depois = frases[i + 1] ?? null;
  const coladaAntes = !!antes && atual.de - antes.ate < COLADAS;
  const coladaDepois = !!depois && depois.de - atual.ate < COLADAS;
  if (t > atual.ate && !coladaDepois) return null;

  const m = medir(atual);
  const ma = coladaAntes && antes ? medir(antes) : m;
  // o cartão: entra e sai com a frase; entre frases coladas ele fica e só ajusta a largura
  const pTroca = prog(t, atual.de - 0.05, 0.2);
  const w = mistura(ma.w, m.w, pTroca);
  const h = mistura(ma.h, m.h, pTroca);
  const entraCartao = coladaAntes ? 1 : prog(t, atual.de - 0.05, 0.18);
  const saiCartao = coladaDepois ? 0 : saindo(t, atual.ate, 0.12);
  const cartao = Math.min(entraCartao, 1 - saiCartao) * opacidade;
  // o texto sempre troca por frase
  const textoVis = Math.min(prog(t, atual.de - 0.05, 0.18), 1 - saindo(t, atual.ate, 0.12));
  if (cartao <= 0.001) return null;
  const corpo = m.enc.tamanho;
  return (
    <div
      style={{
        position: "absolute",
        left: (W - w) / 2,
        top: LEGENDA.base - h,
        width: w,
        height: h,
        backgroundColor: cor.papel,
        backgroundImage: GRAO_PAPEL,
        borderRadius: 4,
        boxShadow: "0 16px 34px rgba(30,40,58,0.34), 0 3px 8px rgba(30,40,58,0.22)",
        opacity: cartao,
        translate: `0 ${(1 - entraCartao) * 10}px`,
      }}
    >
      {/* um filete fino de tinta, como a moldura dos cartões da suíte */}
      <div style={{ position: "absolute", inset: 7, border: `1px solid ${cor.tinta}`, opacity: 0.28, borderRadius: 2 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: textoVis,
        }}
      >
        {m.enc.linhas.map((linha, li) => (
          <div key={li} style={{ display: "flex", columnGap: 0.26 * corpo, whiteSpace: "nowrap", fontFamily: texto, fontWeight: 600, fontSize: corpo, lineHeight: 1.18, color: cor.tinta }}>
            {linha.map((k) => {
              const p = atual.palavras[k];
              return (
                <span key={`${p.w}-${k}`} style={{ opacity: 0.3 + 0.7 * prog(t, p.em - 0.04, 0.16) }}>
                  {p.w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
