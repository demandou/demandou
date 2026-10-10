// A legenda é o campo de texto do app: a frase falada se "digita" no campo, palavra por palavra,
// com a palavra da vez no acento e o cursor piscando no fim. Só aparece com a pessoa em quadro cheio.
import { prog, saindo } from "../anim";
import type { Frase } from "../motor/frases";
import { CAMPO, cor, fonte, MARGEM, quebrarLinhas, sombra, T, W } from "../tema";
import { Icone } from "./Icones";

const BOTAO = 92;

export const Legenda: React.FC<{ frases: Frase[]; t: number; visivel: number }> = ({ frases, t, visivel }) => {
  const atual = frases.find((f) => t >= f.de - 0.08 && t <= f.ate);
  if (!atual || visivel <= 0.01) return null;
  const entra = prog(t, atual.de - 0.08, 0.2);
  const sai = saindo(t, atual.ate, 0.14);
  const larguraTexto = W - 2 * MARGEM - 2 * (BOTAO + 20) - 24;
  const texto = atual.palavras.map((p) => p.w).join(" ");
  const linhas = quebrarLinhas(texto, larguraTexto, T.legenda, 500);
  const altura = Math.max(108, 34 + linhas.length * Math.round(T.legenda * 1.22));
  let k = 0;
  const ditas = atual.palavras.filter((p) => p.em - 0.04 <= t).length;
  const cursor = Math.floor(t * 2.2) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        width: W - 2 * MARGEM,
        top: CAMPO.base - altura,
        height: altura,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 14px",
        borderRadius: 60,
        background: "rgba(14,17,22,0.9)",
        boxShadow: sombra,
        opacity: Math.min(entra, 1 - sai) * visivel,
        fontFamily: fonte,
      }}
    >
      <div style={{ width: BOTAO - 14, height: BOTAO - 14, borderRadius: BOTAO, background: "#232934", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icone nome="mais" tamanho={38} cor={cor.porcelanaSuave} traco={4.5} />
      </div>
      <div style={{ flex: 1, fontSize: T.legenda, fontWeight: 500, lineHeight: 1.22, color: cor.porcelana }}>
        {linhas.map((linha, li) => (
          <div key={li} style={{ display: "flex", whiteSpace: "nowrap", alignItems: "center" }}>
            {linha.split(" ").map((w, wi, arr) => {
              const i = k++;
              const p = atual.palavras[i];
              const dita = i < ditas;
              const daVez = dita && i === ditas - 1;
              return (
                <span key={`${w}-${wi}`} style={{ display: "inline-flex", alignItems: "center", marginRight: wi < arr.length - 1 ? "0.26em" : 0 }}>
                  <span style={{ opacity: dita ? 1 : 0, color: daVez ? cor.acento : undefined }}>{w}</span>
                  {daVez && p ? (
                    <span style={{ display: "inline-block", width: 4, height: T.legenda * 0.95, marginLeft: 6, background: cor.acento, opacity: cursor ? 1 : 0.15 }} />
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ width: BOTAO, height: BOTAO, borderRadius: BOTAO, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icone nome="microfone" tamanho={44} cor={cor.tinta} traco={5} />
      </div>
    </div>
  );
};
