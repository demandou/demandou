// Entrada e saída de um momento. Nada de quadro vazio:
// - arte em janela ENTRA já inteira, no tamanho certo (os esboços a lápis aparecem de uma vez,
//   e a janela que se move revela o resto);
// - arte em janela que dá lugar ao quadro cheio fica até a pessoa crescer e COBRIR tudo;
// - entre duas janelas, a que sai some em 0,1 s e a que entra aparece logo depois (troca seca, no
//   tempo do movimento da janela);
// - o cartão de quadro cheio sobe de leve e sai rápido.
import { prog, saindo } from "../anim";
import { TROCA } from "../layout";

export type Area = { x: number; y: number; w: number; h: number };

// `desliza`: deslocamento da arte agora (px). Quando a pessoa sai do quadro cheio para uma moldura, a arte
// entra presa à borda da moldura que se move (no quadro deitado, a borda esquerda da moldura da direita,
// que anda para a direita enquanto a pessoa encolhe): o espaço que a pessoa libera já mostra a arte, e
// nunca aparece a pessoa solta num palco vazio.
export type ModoDaCena = { entra: "inteira" | "sobe"; sai: "rapida" | "coberta"; atraso?: number; desliza?: { dx: number; dy: number } };

export const Cena: React.FC<{
  t: number;
  de: number;
  fim: number;
  area: Area;
  modo: ModoDaCena;
  children: React.ReactNode;
}> = ({ t, de, fim, area, modo, children }) => {
  const atraso = modo.atraso ?? 0;
  const entra = modo.entra === "inteira" ? prog(t, de + atraso, 0.08) : prog(t, de + atraso, 0.42);
  const sai = modo.sai === "coberta" ? prog(t, fim + TROCA - 0.06, 0.08) : saindo(t, fim + 0.1, 0.1);
  if (entra <= 0 || sai >= 1) return null;
  const sobe = modo.entra === "sobe" ? (1 - entra) * 36 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.w,
        height: area.h,
        opacity: Math.min(1, entra * (modo.entra === "sobe" ? 1.4 : 1)) * (1 - sai),
        translate: `${modo.desliza?.dx ?? 0}px ${sobe + (modo.desliza?.dy ?? 0)}px`,
      }}
    >
      {children}
    </div>
  );
};
