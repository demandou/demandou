// Ícones de traço (genéricos: nenhum é de rede social de verdade).
type P = { tamanho?: number; cor?: string; cheio?: boolean; traco?: number };

const Svg: React.FC<P & { children: React.ReactNode }> = ({ tamanho = 40, cor = "currentColor", traco = 2.2, children }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const Coracao: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill={p.cheio ? p.cor : "none"} />
  </Svg>
);
export const Balao: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 12a8 7 0 1 1 3.2 5.6L4 19l1-3.6A6.6 6.6 0 0 1 4 12z" fill={p.cheio ? p.cor : "none"} />
  </Svg>
);
export const Compartilhar: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M14 5l6 6-6 6M20 11H10a6 6 0 0 0-6 6v1" />
  </Svg>
);
export const Responder: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M10 6L4 12l6 6M4 12h10a6 6 0 0 1 6 6" />
  </Svg>
);
export const Pontos: React.FC<P> = ({ tamanho = 40, cor = "currentColor" }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cor}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);
export const Certo: React.FC<P> = (p) => (
  <Svg {...p} traco={p.traco ?? 3}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const Errado: React.FC<P> = (p) => (
  <Svg {...p} traco={p.traco ?? 3}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const Seta: React.FC<P> = (p) => (
  <Svg {...p} traco={p.traco ?? 3}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </Svg>
);
export const Alerta: React.FC<P> = (p) => (
  <Svg {...p} traco={p.traco ?? 2.6}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4M12 17.2v.3" />
  </Svg>
);
export const Salvar: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M6 4h12v16l-6-4.5L6 20z" fill={p.cheio ? p.cor : "none"} />
  </Svg>
);
export const Seguir: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="10" cy="8" r="4" />
    <path d="M3 20a7 7 0 0 1 14 0M19 8v6M16 11h6" />
  </Svg>
);
export const Link: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
    <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </Svg>
);
export const Enviar: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 12l16-8-6 16-2.5-6.5z" fill={p.cheio ? p.cor : "none"} />
  </Svg>
);
// silhueta genérica de perfil (avatar sem nome)
export const Silhueta: React.FC<{ tamanho: number; cor: string }> = ({ tamanho, cor }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cor}>
    <circle cx="12" cy="9.2" r="4.2" />
    <path d="M3.8 21.5a8.2 7.4 0 0 1 16.4 0z" />
  </svg>
);
