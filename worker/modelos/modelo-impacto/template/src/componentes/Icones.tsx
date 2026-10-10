// Ícones de traço (viewBox 48×48), desenhados por `p` de 0 a 1 — o traço corre como uma caneta.
// Para um ícone novo: adicione os caminhos em TRACOS (só linhas) e o nome no tipo `icone` do Cta em plano.ts.
// Ícones da chamada: enviar (padrão, avião de papel), salvar, seguir, comentar, link.

const TRACOS: Record<string, { d: string; comprimento: number }[]> = {
  // avião de papel: enviar / mandar para alguém
  enviar: [
    { d: "M44 5 L4 21 L19 27 L44 5 L27 44 L19 27", comprimento: 175 },
  ],
  // marcador: salvar
  salvar: [{ d: "M12 5 H36 V43 L24 33 L12 43 Z", comprimento: 110 }],
  // pessoa com +: seguir
  seguir: [
    { d: "M20 22 a8 8 0 1 0 0.01 0", comprimento: 52 },
    { d: "M5 42 c1 -9 7 -13 15 -13 c8 0 14 4 15 13", comprimento: 50 },
    { d: "M40 12 V26 M33 19 H47", comprimento: 28 },
  ],
  // balão: comentar
  comentar: [{ d: "M6 8 H42 V32 H22 L12 41 V32 H6 Z", comprimento: 150 }],
  // elos de corrente: link ("toca no link", "saiba mais")
  link: [
    { d: "M21 15 L27 9 A8.5 8.5 0 0 1 39 21 L33 27", comprimento: 46 },
    { d: "M27 33 L21 39 A8.5 8.5 0 0 1 9 27 L15 21", comprimento: 46 },
    { d: "M19 29 L29 19", comprimento: 15 },
  ],
  check: [{ d: "M8 25 L19 36 L41 12", comprimento: 48 }],
};

export const Traco: React.FC<{ nome: string; p: number; tamanho: number; cor: string; espessura?: number }> = ({
  nome,
  p,
  tamanho,
  cor,
  espessura = 3.2,
}) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ overflow: "visible", display: "block" }}>
    {(TRACOS[nome] ?? TRACOS.enviar).map((tr, i, todos) => {
      // cada traço do ícone começa quando o anterior está na metade
      const inicio = (i / todos.length) * 0.5;
      const q = Math.min(1, Math.max(0, (p - inicio) / (1 - inicio)));
      return (
        <path
          key={i}
          d={tr.d}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeDasharray={tr.comprimento}
          strokeDashoffset={tr.comprimento * (1 - q)}
        />
      );
    })}
  </svg>
);

export const Check: React.FC<{ p: number; tamanho: number; cor: string; espessura?: number }> = (props) => (
  <Traco nome="check" {...props} />
);
