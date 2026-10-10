import { Traco } from "../anim";
import { desenharPlanta, TAMANHO_PLANTA } from "../desenho/biblioteca";
import { circ, lin, poli, ret, retR } from "../desenho/geometria";
import type { Icone } from "../plano";
import { cor as paleta, traco } from "../tema";

// Ícones a traço (caixa 100×100), no mesmo desenho técnico da prancha. Se desenham com `p`.
const FERRAMENTAS: Record<string, string[]> = {
  trena: [retR(10, 30, 50, 50, 10), circ(35, 55, 11), lin(60, 70, 94, 70), lin(60, 78, 94, 78), lin(94, 70, 94, 78), lin(70, 70, 70, 74), lin(80, 70, 80, 74)],
  nivel: [ret(6, 38, 88, 24), ret(38, 42, 24, 16), circ(50, 50, 4), lin(18, 38, 18, 62), lin(82, 38, 82, 62)],
  lapis: [poli([[10, 42], [72, 42], [92, 50], [72, 58], [10, 58]], true), lin(72, 42, 72, 58), lin(22, 42, 22, 58)],
  rolo: [retR(14, 16, 64, 22, 6), poli([[78, 27], [88, 27], [88, 50], [50, 50], [50, 62]]), ret(45, 62, 10, 28)],
  lampada: [circ(50, 40, 24), lin(40, 70, 60, 70), lin(42, 78, 58, 78), lin(46, 86, 54, 86), lin(44, 58, 44, 70), lin(56, 58, 56, 70)],
  tomada: [retR(18, 18, 64, 64, 12), circ(50, 50, 20), circ(43, 50, 3), circ(57, 50, 3)],
  esquadro: [poli([[14, 86], [14, 14], [86, 86]], true), poli([[28, 72], [28, 48], [52, 72]], true)],
  check: [circ(50, 50, 38), poli([[32, 51], [45, 64], [70, 38]])],
  erro: [circ(50, 50, 38), lin(35, 35, 65, 65), lin(65, 35, 35, 65)],
  marcador: [circ(50, 50, 30), circ(50, 50, 6)],
  seguir: [circ(42, 34, 16), `M12 86C12 64 26 56 42 56C58 56 72 64 72 86`, lin(82, 28, 82, 52), lin(70, 40, 94, 40)],
  salvar: [poli([[26, 12], [74, 12], [74, 88], [50, 70], [26, 88]], true)],
  comentar: [`M14 20H86V68H44L26 84V68H14Z`, lin(30, 38, 70, 38), lin(30, 52, 58, 52)],
  link: [retR(8, 36, 50, 28, 14), retR(42, 36, 50, 28, 14), lin(36, 50, 64, 50)],
};

export const IconeTraco: React.FC<{ nome: Icone | "seguir" | "salvar" | "comentar" | "link" | "erro"; p: number; tamanho?: number; cor?: string }> = ({
  nome,
  p,
  tamanho = 84,
  cor = paleta.grafite,
}) => {
  const escala = tamanho / 100;
  // nome desconhecido (o plano mandou um ícone que não existe): um marcador neutro, nunca erro
  const ferramenta = FERRAMENTAS[nome] ?? (TAMANHO_PLANTA[nome as keyof typeof TAMANHO_PLANTA] ? null : FERRAMENTAS.marcador);
  let conteudo: React.ReactNode;
  if (ferramenta) {
    conteudo = ferramenta.map((d, i) => <Traco key={i} d={d} p={p} cor={cor} largura={traco.medio / escala} />);
  } else {
    // objeto da biblioteca, visto de cima, cabendo na caixa
    const [w, h] = TAMANHO_PLANTA[nome as keyof typeof TAMANHO_PLANTA] ?? [100, 100];
    const k = Math.min(84 / w, 84 / Math.max(h, 12));
    const cw = w * k;
    const ch = Math.max(h * k, 10);
    const d = desenharPlanta(nome as keyof typeof TAMANHO_PLANTA, cw, ch);
    conteudo = (
      <g transform={`translate(${(100 - cw) / 2} ${(100 - ch) / 2})`}>
        {d.linhas.map((l, i) => (
          <Traco key={i} d={l.d} p={p} cor={cor} largura={(l.peso === "fino" ? traco.fino : traco.medio) / escala} />
        ))}
      </g>
    );
  }
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      {conteudo}
    </svg>
  );
};
