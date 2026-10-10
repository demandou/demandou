// Ferragens do hall, usadas por todos os blocos: prego, pino preto, argola de latão, régua de
// madeira, cordão, parafuso e os carimbos redondos (visto verde, xis terracota, "?" de latão).
// Tudo desenhado com a paleta do tema; nada de brilho.
import { cor, grotesca, serifa } from "../tema";

// Prego preto na parede (cabeça redonda com um reflexo fosco)
export const Prego: React.FC<{ x: number; y: number; r?: number; opacidade?: number }> = ({ x, y, r = 12, opacidade = 1 }) => (
  <svg width={r * 2 + 8} height={r * 2 + 8} style={{ position: "absolute", left: x - r - 4, top: y - r - 4, overflow: "visible", opacity: opacidade }}>
    <circle cx={r + 4} cy={r + 6} r={r} fill="rgba(40,30,20,0.25)" />
    <circle cx={r + 4} cy={r + 4} r={r} fill={cor.preto} />
    <circle cx={r + 4 - r * 0.33} cy={r + 4 - r * 0.33} r={r * 0.3} fill="#4A4743" />
  </svg>
);

// Pino preto de quadro de chaves (sai da madeira para baixo)
export const Pino: React.FC<{ x: number; y: number; escala?: number }> = ({ x, y, escala = 1 }) => (
  <svg width={30 * escala} height={40 * escala} viewBox="0 0 30 40" style={{ position: "absolute", left: x - 15 * escala, top: y, overflow: "visible" }}>
    <rect x={9} y={0} width={12} height={22} rx={4} fill={cor.preto} />
    <circle cx={15} cy={23} r={8} fill={cor.preto} />
  </svg>
);

// Argola de latão (anel da chave)
export const Argola: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 18 }) => (
  <svg width={r * 2 + 14} height={r * 2 + 14} style={{ position: "absolute", left: x - r - 7, top: y - r - 7, overflow: "visible" }}>
    <circle cx={r + 7} cy={r + 7} r={r} fill="none" stroke={cor.lataoEscuro} strokeWidth={7} />
    <circle cx={r + 7} cy={r + 7} r={r} fill="none" stroke={cor.latao} strokeWidth={4} />
  </svg>
);

// Parafuso de latão (fenda) para as placas
export const Parafuso: React.FC<{ x: number; y: number; r?: number; giro?: number }> = ({ x, y, r = 9, giro = 30 }) => (
  <svg width={r * 2 + 4} height={r * 2 + 4} style={{ position: "absolute", left: x - r - 2, top: y - r - 2, overflow: "visible" }}>
    <circle cx={r + 2} cy={r + 2} r={r} fill={cor.latao} stroke={cor.lataoEscuro} strokeWidth={2.5} />
    <path d={`M ${r + 2 - r * 0.6} ${r + 2} H ${r + 2 + r * 0.6}`} stroke={cor.lataoEscuro} strokeWidth={2.5} transform={`rotate(${giro} ${r + 2} ${r + 2})`} />
  </svg>
);

// Régua de madeira clara (o quadro de chaves, o trilho dos ganchos): veios e dois parafusos
export const ReguaDeMadeira: React.FC<{ x: number; y: number; w: number; h?: number; vertical?: boolean; opacidade?: number }> = ({ x, y, w, h = 44, vertical, opacidade = 1 }) => {
  // desenha sempre deitada e gira quando é vertical (a régua vertical tem largura `h` e altura `w`)
  const comprimento = w;
  return (
    <svg
      width={vertical ? h : comprimento}
      height={vertical ? comprimento : h + 8}
      style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity: opacidade }}
    >
      <g transform={vertical ? `translate(${h} 0) rotate(90)` : undefined}>
        <rect x={0} y={6} width={comprimento} height={h} rx={9} fill="rgba(40,30,20,0.18)" />
        <rect x={0} y={0} width={comprimento} height={h} rx={9} fill={cor.madeira} />
        {[0.25, 0.43, 0.68, 0.82].map((f, i) => (
          <path
            key={f}
            d={`M 14 ${h * f} C ${comprimento * 0.3} ${h * f + (i % 2 ? 3 : -3)}, ${comprimento * 0.6} ${h * f + (i % 2 ? -2 : 3)}, ${comprimento - 14} ${h * f}`}
            stroke={cor.veio}
            strokeWidth={2}
            fill="none"
          />
        ))}
        <rect x={0} y={h - 6} width={comprimento} height={6} rx={3} fill={cor.madeiraEscura} opacity={0.45} />
        {[Math.min(26, comprimento * 0.1), comprimento - Math.min(26, comprimento * 0.1)].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={h / 2} r={Math.min(8, h * 0.2)} fill={cor.lataoEscuro} />
            <path d={`M ${cx - 5} ${h / 2} H ${cx + 5}`} stroke={cor.madeiraEscura} strokeWidth={2.5} />
          </g>
        ))}
      </g>
    </svg>
  );
};

// Cordão (barbante) entre dois pontos, com uma leve barriga; `p` desenha da origem até o fim
export const Cordao: React.FC<{ x1: number; y1: number; x2: number; y2: number; p?: number; cor?: string }> = ({ x1, y1, x2, y2, p = 1, cor: c = cor.texto2 }) => {
  if (p <= 0.001) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + Math.abs(x2 - x1) * 0.06;
  const minX = Math.min(x1, x2) - 10;
  const minY = Math.min(y1, y2) - 10;
  return (
    <svg width={Math.abs(x2 - x1) + 20} height={Math.abs(y2 - y1) + 40} style={{ position: "absolute", left: minX, top: minY, overflow: "visible" }}>
      <path
        d={`M ${x1 - minX} ${y1 - minY} Q ${mx - minX} ${my - minY} ${x2 - minX} ${y2 - minY}`}
        fill="none"
        stroke={c}
        strokeWidth={3}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={`${p} 1`}
      />
    </svg>
  );
};

// Carimbo redondo: "visto" (verde), "xis" (terracota) ou "pergunta" (latão). `p` desenha o traço.
export const Carimbo: React.FC<{ tipo: "visto" | "xis" | "pergunta"; tamanho: number; p?: number }> = ({ tipo, tamanho, p = 1 }) => {
  const fundo = tipo === "visto" ? cor.verde : tipo === "xis" ? cor.alerta : cor.latao;
  const traco = tipo === "pergunta" ? cor.preto : cor.papel;
  const q = Math.max(0.001, p);
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" style={{ display: "block", overflow: "visible" }}>
      <circle cx={32} cy={32} r={30} fill={fundo} stroke={tipo === "pergunta" ? cor.lataoEscuro : "none"} strokeWidth={3} />
      {tipo === "visto" ? (
        <path d="M19 33 L28 42 L46 23" fill="none" stroke={traco} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${q} 1`} />
      ) : null}
      {tipo === "xis" ? (
        <path d="M21 21 L43 43 M43 21 L21 43" fill="none" stroke={traco} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${q} 1`} />
      ) : null}
      {tipo === "pergunta" ? (
        <text x={32} y={45} textAnchor="middle" fontFamily={serifa} fontSize={40} fill={traco} opacity={Math.min(1, q * 1.5)}>
          ?
        </text>
      ) : null}
    </svg>
  );
};

// Etiqueta "ilustrativo": um selo de papel pequeno, em caixa alta (aparece quando a forma não tem números ditos)
export const SeloIlustrativo: React.FC<{ opacidade?: number; estilo?: React.CSSProperties }> = ({ opacidade = 1, estilo }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 16px 8px 12px",
      border: `2.5px dashed ${cor.texto2}`,
      borderRadius: 8,
      fontFamily: grotesca,
      opacity: opacidade,
      ...estilo,
    }}
  >
    <svg width={22} height={22} viewBox="0 0 22 22">
      <circle cx={11} cy={11} r={9} fill="none" stroke={cor.texto2} strokeWidth={2.5} />
      <path d="M11 6 V12 M11 15.5 V16" stroke={cor.texto2} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
    <span style={{ fontWeight: 700, fontSize: 30, letterSpacing: "0.09em", textTransform: "uppercase", color: cor.texto2, lineHeight: 1 }}>ilustrativo</span>
  </div>
);
