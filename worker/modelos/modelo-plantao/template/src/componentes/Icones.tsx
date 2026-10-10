// Ícones do pacote gráfico: traço firme, cantos retos, uma cor por vez. Sem emoji.

type P = { tamanho: number; cor: string; style?: React.CSSProperties };

// Triângulo de alta/baixa (o "▲ ▼" das telas de economia)
export const Seta: React.FC<P & { sentido: "sobe" | "desce" }> = ({ tamanho, cor, sentido, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d={sentido === "sobe" ? "M12 3 L22 20 L2 20 Z" : "M12 21 L22 4 L2 4 Z"} fill={cor} />
  </svg>
);

export const Mais: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M12 4 V20 M4 12 H20" stroke={cor} strokeWidth={3.4} strokeLinecap="square" fill="none" />
  </svg>
);

// visto que se desenha (p de 0 a 1)
export const Visto: React.FC<P & { p?: number }> = ({ tamanho, cor, style, p = 1 }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M4 12.5 L9.5 18 L20 6.5" stroke={cor} strokeWidth={3.4} strokeLinecap="square" strokeLinejoin="miter" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

export const Pausa: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <rect x={6} y={5} width={4.2} height={14} fill={cor} />
    <rect x={13.8} y={5} width={4.2} height={14} fill={cor} />
  </svg>
);

export const Marcador: React.FC<P & { cheio?: boolean }> = ({ tamanho, cor, style, cheio }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M6 3 H18 V21 L12 16.5 L6 21 Z" stroke={cor} strokeWidth={2.6} strokeLinejoin="miter" fill={cheio ? cor : "none"} />
  </svg>
);

export const Balao: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M3.5 4.5 H20.5 V16 H10 L5.5 20 V16 H3.5 Z" stroke={cor} strokeWidth={2.6} strokeLinejoin="miter" fill="none" />
  </svg>
);

export const Enviar: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M3 11 L21 3 L14 21 L11 13 Z" stroke={cor} strokeWidth={2.6} strokeLinejoin="miter" fill="none" />
  </svg>
);

// Link: dois elos de corrente, traço reto
export const Elo: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M10.5 13.5 L13.5 10.5" stroke={cor} strokeWidth={2.8} strokeLinecap="square" fill="none" />
    <path d="M9 11 L6.2 13.8 A3.2 3.2 0 0 0 10.2 17.8 L13 15" stroke={cor} strokeWidth={2.6} fill="none" />
    <path d="M15 13 L17.8 10.2 A3.2 3.2 0 0 0 13.8 6.2 L11 9" stroke={cor} strokeWidth={2.6} fill="none" />
  </svg>
);

// Alerta: triângulo cheio com o "!" vazado
export const Alerta: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M12 2.5 L23 21.5 L1 21.5 Z" fill={cor} />
    <rect x={10.6} y={8.5} width={2.8} height={7} fill="#E3122C" />
    <rect x={10.6} y={17.2} width={2.8} height={2.6} fill="#E3122C" />
  </svg>
);

// Chave (destaque de palavra-chave): losango cheio com um losango menor vazado
export const Losango: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z" fill={cor} />
    <path d="M12 7.5 L16.5 12 L12 16.5 L7.5 12 Z" fill="#2251FF" />
  </svg>
);

// Pergunta: "?" desenhado em traço firme
export const Interrogacao: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M7.5 8.5 A4.5 4.5 0 1 1 13.6 12.7 C12.6 13.1 12 13.8 12 15 V16" stroke={cor} strokeWidth={3} strokeLinecap="square" fill="none" />
    <rect x={10.5} y={18.6} width={3} height={3} fill={cor} />
  </svg>
);

// Igual (definição: termo = significado)
export const Igual: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <rect x={4} y={7} width={16} height={3.4} fill={cor} />
    <rect x={4} y={13.6} width={16} height={3.4} fill={cor} />
  </svg>
);

// Xis (o lado errado / quem perde)
export const Xis: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M5.5 5.5 L18.5 18.5 M18.5 5.5 L5.5 18.5" stroke={cor} strokeWidth={3.4} strokeLinecap="square" fill="none" />
  </svg>
);

// Seta para a direita (antes → depois)
export const SetaDireita: React.FC<P> = ({ tamanho, cor, style }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
    <path d="M3 12 H18 M12 5.5 L19 12 L12 18.5" stroke={cor} strokeWidth={3.4} strokeLinecap="square" fill="none" />
  </svg>
);
