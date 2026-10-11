import { prog, saindo, useTempo } from "../anim";
import { LEGENDA, type LugarDaLegenda, QUADRO } from "../layout";
import { largura as medir } from "../medida";
import type { Frase } from "../motor/frases";
import { cor, sans } from "../tema";

// Legenda bilíngue do Ao Pé da Letra: o português em creme, o que é falado na outra língua
// (inglês, espanhol…) em azul-céu e um pouco mais grosso. A palavra dita acende; as que ainda
// vêm ficam esmaecidas. `idioma2` são os trechos (em segundos) falados na outra língua.
// No quadro deitado (16:9) ela fica na área segura de baixo, presa pela base (acima dos controles
// do player), numa linha só: o corpo encolhe de 48 até 36 px para a frase caber na largura do
// lugar dela (o quadro inteiro na tela cheia; o quadro da esquerda com o painel).
const PAD_X = 30;

export const Legendas: React.FC<{ frases: Frase[]; lugar: (t: number) => LugarDaLegenda; idioma2?: { de: number; ate: number }[] }> = ({ frases, lugar, idioma2 = [] }) => {
  const t = useTempo();
  const atual = frases.find((f) => t >= f.de - 0.05 && t <= f.ate);
  if (!atual) return null;
  const entrada = prog(t, atual.de - 0.05, 0.14);
  const sai = saindo(t, atual.ate, 0.1);
  const falando = atual.palavras.reduce((k, p, i) => (t >= p.em - 0.03 ? i : k), -1);
  const estrangeira = (p: { em: number; ate: number }) => idioma2.some((f) => p.em >= f.de - 0.04 && p.em < f.ate);
  const l = lugar(atual.de);
  // a largura da linha num corpo: cada palavra no peso dela, mais o vão de 0,28 em entre elas
  const larguraEm = (tam: number) =>
    atual.palavras.reduce((s, p) => s + medir(p.w, tam, { peso: estrangeira(p) ? 900 : 700 }), 0) + Math.max(0, atual.palavras.length - 1) * 0.28 * tam;
  let tamanho = LEGENDA.maximo;
  while (tamanho > LEGENDA.minimo && larguraEm(tamanho) > l.largura - 2 * PAD_X) tamanho -= 2;
  return (
    <div
      style={{
        position: "absolute",
        left: l.cx - l.largura / 2,
        width: l.largura,
        bottom: QUADRO.h - l.base,
        display: "flex",
        justifyContent: "center",
        opacity: entrada * (1 - sai),
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.28em",
          maxWidth: l.largura,
          boxSizing: "border-box",
          padding: `10px ${PAD_X}px 14px`,
          borderRadius: 20,
          background: cor.cartao,
          fontFamily: sans,
          fontWeight: 800,
          fontSize: tamanho,
          lineHeight: 1.2,
          color: cor.tinta,
        }}
      >
        {atual.palavras.map((p, i) => {
          const fora = estrangeira(p);
          return (
            <span key={`${p.w}-${i}`} style={{ opacity: i <= falando ? 1 : 0.42, color: fora ? cor.coral : cor.tinta, fontWeight: fora ? 900 : 700, whiteSpace: "nowrap" }}>
              {p.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
