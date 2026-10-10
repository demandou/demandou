// O letreiro (ticker) correndo na base, logo acima da interface do app: um bloco azul fixo com o
// rótulo e as frases correndo da direita para a esquerda, sem parar, separadas por um quadradinho.
import { prog } from "../anim";
import { medir } from "../medidas";
import { cor, LETREIRO, rotulo, W } from "../tema";

const VELOCIDADE = 118; // px por segundo
const TAM = 36;
const SEPARADOR = 76; // largura do quadradinho com as margens
const CORTE = { peso: 700 as const, alta: true, espacamento: 0.02, espacoReal: true };

export const Letreiro: React.FC<{ t: number; de: number; rotulo: string; itens: string[] }> = ({ t, de, rotulo: textoRotulo, itens }) => {
  if (t < de - 0.02 || itens.length === 0) return null;
  const p = prog(t, de, 0.45);
  const larguraRotulo = medir(textoRotulo, 32, { peso: 800, alta: true, espacamento: 0.06, espacoReal: true }) + 52;
  const larguras = itens.map((i) => medir(i, TAM, CORTE) + SEPARADOR);
  const total = larguras.reduce((a, b) => a + b, 0);
  // o primeiro item começa logo depois do rótulo e corre para a esquerda
  const andou = Math.max(0, t - de) * VELOCIDADE;
  const inicio = larguraRotulo + 28 - (andou % total);
  const copias = Math.ceil((W + total) / total) + 1;
  const pecas: { x: number; texto: string }[] = [];
  for (let c = 0; c < copias; c++) {
    let x = inicio + c * total;
    itens.forEach((texto, i) => {
      pecas.push({ x, texto });
      x += larguras[i];
    });
  }

  return (
    <div style={{ position: "absolute", left: 0, top: LETREIRO.y, width: W, height: LETREIRO.h, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, translate: `0 ${(1 - p) * 100}%` }}>
        <div style={{ position: "absolute", inset: 0, background: cor.noite }} />
        {pecas
          .filter((pc) => pc.x < W && pc.x > -total)
          .map((pc, i) => (
            <div key={i} style={{ position: "absolute", left: pc.x, top: 0, height: LETREIRO.h, display: "flex", alignItems: "center", whiteSpace: "pre" }}>
              <div style={{ ...rotulo, fontWeight: 700, letterSpacing: "0.02em", fontSize: TAM, color: cor.branco, translate: "0 1px" }}>{pc.texto}</div>
              <div style={{ width: 12, height: 12, background: cor.eletrico, marginLeft: 32, marginRight: 32 }} />
            </div>
          ))}
        <div style={{ position: "absolute", left: 0, top: 0, width: larguraRotulo, height: LETREIRO.h, background: cor.eletrico, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...rotulo, fontSize: 32, color: cor.branco, translate: "0 1px" }}>{textoRotulo}</div>
        </div>
      </div>
    </div>
  );
};
