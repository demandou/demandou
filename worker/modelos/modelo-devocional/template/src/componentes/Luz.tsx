// A LUZ (efeito próprio): a frase é escrita pequena, em itálico, e UMA palavra dela acende enorme no
// meio da página quando é dita: a luz creme sobe por trás, a palavra passa de luz a oliva e a poeira
// de luz sobe em volta. Antes, a luz já espera no lugar, respirando.
import { interpolateColors } from "remotion";
import { abrir, limitar, prog, respira, saida, suave, temposDoTexto, tinta } from "../anim";
import type { Area } from "../layout";
import { caberLinha, encaixar, separar, trechoNoTexto } from "../medida";
import type { Luz as TLuz, Plano } from "../plano";
import { cor } from "../tema";
import { Desenho } from "./Desenhos";
import { alturaDe, Escrita, estiloDaFonte, Ornamento, PoeiraDaLuz } from "./Escrita";

const ENTRE = 1.18;

export const Luz: React.FC<{ t: number; plano: Plano; m: TLuz; area: Area }> = ({ t, plano, m, area }) => {
  const em = m.em ?? m.de;
  const tempos = abrir(temposDoTexto(m.texto, em, plano.palavras, m.ate), area.abre);
  const ws = separar(m.texto);
  const tr = trechoNoTexto(m.texto, m.palavra) ?? [ws.length, ws.length - 1];
  const antes = ws.slice(0, tr[0]).join(" ");
  const depois = ws.slice(tr[1] + 1).join(" ");
  const temposAntes = tempos.slice(0, tr[0]);
  const temposDepois = tempos.slice(tr[1] + 1);
  const W = area.w;
  const fonteFrase = { familia: "serif" as const, peso: 500, italico: true };
  const encA = antes ? encaixar(antes, { largura: W, max: 78, min: 52, linhas: 2, entrelinha: ENTRE, fonte: fonteFrase, equilibrar: true, frases: false }) : null;
  const encD = depois ? encaixar(depois, { largura: W, max: 64, min: 46, linhas: 2, entrelinha: ENTRE, fonte: fonteFrase, equilibrar: true, frases: false }) : null;
  const palavra = m.palavra.replace(/[.,;:!?…]+$/, "");
  const fontePalavra = { familia: "serif" as const, peso: 500 };
  const tamP = caberLinha(palavra, W * 0.92, 300, 96, fontePalavra);
  const altDesenho = m.desenho ? 190 : 0;
  const altA = encA ? alturaDe(encA, ENTRE) : 0;
  const altD = encD ? alturaDe(encD, ENTRE) + 20 : 0;
  const altDet = m.detalhe ? 70 : 0;
  const altP = tamP * 1.1;
  const total = altDesenho + altA + 24 + altP + 40 + altD + altDet;
  const y0 = area.y + Math.max(0, (area.base - area.y - total) / 2);
  const yA = y0 + altDesenho;
  const yP = yA + altA + 24;
  const yD = yP + altP + 40;

  // nasce rápido (legível em ~0,1 s) e assenta devagar
  const acende = prog(t, m.palavraEm, 0.4, saida);
  const espera = 0.25 + 0.1 * respira(t, 2.8);
  const luzForca = Math.max(espera * prog(t, m.de + 0.3, 0.8, suave), acende) * (1 + 0.06 * respira(t, 3.4, 0.5));
  const cx = area.x + W / 2;
  const cy = yP + altP * 0.52;
  const sobe = (1 - acende) * 60;
  const larguraPalavra = Math.min(W, palavra.length * tamP * 0.48 + 120);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {m.desenho ? <Desenho nome={m.desenho} t={t} em={m.desenhoEm ?? em} x={cx - 85} y={y0} tamanho={170} /> : null}
      {/* a luz: espera fraca no lugar e sobe forte quando a palavra é dita */}
      <div
        style={{
          position: "absolute",
          left: cx - Math.max(380, larguraPalavra * 0.75),
          width: Math.max(760, larguraPalavra * 1.5),
          top: cy - 300 + sobe,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,251,239,0.95) 0%, rgba(255,251,239,0.6) 35%, rgba(255,251,239,0) 70%)`,
          opacity: limitar(luzForca),
          transform: `scale(${0.75 + 0.25 * acende})`,
        }}
      />
      {encA ? <Escrita t={t} encaixe={encA} tempos={temposAntes} x={area.x} y={yA} largura={W} fonte={fonteFrase} cor={cor.tintaSuave} entrelinha={ENTRE} /> : null}
      {t >= m.palavraEm ? (
        <div
          style={{
            position: "absolute",
            left: area.x,
            width: W,
            top: yP,
            height: altP,
            lineHeight: `${altP}px`,
            textAlign: "center",
            whiteSpace: "nowrap",
            ...estiloDaFonte(fontePalavra, tamP),
            color: acende >= 1 ? cor.oliva : interpolateColors(acende, [0, 1], [cor.luz, cor.oliva]),
            ...(acende >= 1 ? {} : { filter: `blur(${(1 - acende) * 10}px)`, transform: `scale(${0.94 + 0.06 * acende})` }),
          }}
        >
          {palavra}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: cx - larguraPalavra / 2, top: yP + altP * 0.55, width: larguraPalavra }}>
        <PoeiraDaLuz t={t} em={m.palavraEm + 0.1} largura={larguraPalavra} tamanho={tamP} n={14} chave={7} />
      </div>
      <Ornamento t={t} em={m.palavraEm + 0.35} cx={cx} y={yP + altP + 16} largura={320} />
      {encD ? <Escrita t={t} encaixe={encD} tempos={temposDepois} x={area.x} y={yD} largura={W} fonte={fonteFrase} cor={cor.tintaSuave} entrelinha={ENTRE} /> : null}
      {m.detalhe ? (
        <div
          style={{
            position: "absolute",
            left: area.x,
            width: W,
            top: yD + altD,
            textAlign: "center",
            ...estiloDaFonte({ familia: "serif", peso: 400, italico: true }, caberLinha(m.detalhe, W, 42, 30, { italico: true })),
            color: cor.tintaSuave,
            whiteSpace: "nowrap",
            ...tinta(t, m.detalheEm ?? m.palavraEm + 0.6, 0.5, 8),
          }}
        >
          {m.detalhe}
        </div>
      ) : null}
    </div>
  );
};
