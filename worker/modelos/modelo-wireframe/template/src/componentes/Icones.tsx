// Ícones a traço, desenhados aqui (nada de emoji nem de logotipo).

export const Check: React.FC<{ tamanho: number; cor: string; espessura?: number; p?: number }> = ({ tamanho, cor, espessura = 4, p = 1 }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      d="M4.5 12.5 L10 18 L19.5 6.5"
      stroke={cor}
      strokeWidth={espessura * (24 / tamanho)}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  </svg>
);

// Marcador de "salvar": contorno que se enche
export const Salvar: React.FC<{ tamanho: number; cor: string; cheio: number }> = ({ tamanho, cor, cheio }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M6 3.5 H18 V21 L12 16.5 L6 21 Z" fill={cor} fillOpacity={cheio} stroke={cor} strokeWidth={2.2} strokeLinejoin="round" />
  </svg>
);

export const Seguir: React.FC<{ tamanho: number; cor: string; cheio: number }> = ({ tamanho, cor, cheio }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
    <circle cx={9.5} cy={8} r={4} fill={cor} fillOpacity={cheio} stroke={cor} strokeWidth={2.2} />
    <path d="M2.5 20 C 3.5 15.5, 15.5 15.5, 16.5 20" fill={cor} fillOpacity={cheio} stroke={cor} strokeWidth={2.2} strokeLinecap="round" />
    <path d="M19.5 7 V13 M16.5 10 H22.5" stroke={cor} strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

export const Comentar: React.FC<{ tamanho: number; cor: string; cheio: number }> = ({ tamanho, cor, cheio }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M4 4.5 H20 V16 H11 L6 20 V16 H4 Z" fill={cor} fillOpacity={cheio} stroke={cor} strokeWidth={2.2} strokeLinejoin="round" />
  </svg>
);

export const Link: React.FC<{ tamanho: number; cor: string; cheio: number }> = ({ tamanho, cor, cheio }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M10 14 L14 10" stroke={cor} strokeWidth={2.2} strokeLinecap="round" />
    <path d="M11 7.5 L12.8 5.7 A3.6 3.6 0 0 1 18.3 11.2 L16.5 13" stroke={cor} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeOpacity={0.6 + 0.4 * cheio} />
    <path d="M13 16.5 L11.2 18.3 A3.6 3.6 0 0 1 5.7 12.8 L7.5 11" stroke={cor} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeOpacity={0.6 + 0.4 * cheio} />
  </svg>
);

// Quadro (frame) do canvas: o "#" dos programas de design
export const Quadro: React.FC<{ tamanho: number; cor: string }> = ({ tamanho, cor }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block" }}>
    <path d="M8 3 V21 M16 3 V21 M3 8 H21 M3 16 H21" stroke={cor} strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

// Pino de comentário: um balão redondo com o canto de baixo em ponta, com a inicial dentro
export const Pino: React.FC<{ tamanho: number; cor: string; letra: string; corLetra: string; fonte: string }> = ({ tamanho, cor, letra, corLetra, fonte }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      borderRadius: `${tamanho / 2}px ${tamanho / 2}px ${tamanho / 2}px 4px`,
      background: cor,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fonte,
      fontWeight: 700,
      fontSize: tamanho * 0.5,
      color: corLetra,
      flexShrink: 0,
    }}
  >
    {letra}
  </div>
);
