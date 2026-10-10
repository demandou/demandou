// As peças de papelaria do Dossiê, usadas por todos os blocos: papel com textura, pino de metal,
// fita, etiqueta de prova, carimbo de borracha, tarja de censura, clipe e polaroide.
import { Img, staticFile } from "remotion";
import { acaso, bate, limitar, prog } from "../anim";
import { encaixar } from "../medida";
import type { Imagem } from "../motor/imagem";
import { COR, ELITE, SOMBRA, SOMBRA_LEVE, SORA, rotulo } from "../tema";

// Papel: cor lisa + grão de papel multiplicado por cima + sombra de papel sobre a cortiça.
export const Folha: React.FC<{
  w: number;
  h: number;
  cor?: string;
  sombra?: string;
  style?: React.CSSProperties;
  recorte?: string;
  grao?: number;
  children?: React.ReactNode;
}> = ({ w, h, cor = COR.papel, sombra = SOMBRA, style, recorte, grao = 0.6, children }) => (
  <div style={{ position: "absolute", width: w, height: h, filter: recorte ? `drop-shadow(0 10px 14px rgba(0,0,0,0.5))` : undefined, ...style }}>
    <div style={{ position: "absolute", inset: 0, background: cor, boxShadow: recorte ? undefined : sombra, clipPath: recorte, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${staticFile("textura/papel.jpg")})`,
          backgroundSize: "512px 512px",
          mixBlendMode: "multiply",
          opacity: grao,
        }}
      />
    </div>
    {children}
  </div>
);

// Pino de metal (cabeça redonda com reflexo). `p` 0→1: crava (desce e assenta).
export const Pino: React.FC<{ x: number; y: number; p?: number; tamanho?: number }> = ({ x, y, p = 1, tamanho = 36 }) =>
  p <= 0 ? null : (
    <div
      style={{
        position: "absolute",
        left: x - tamanho / 2,
        top: y - tamanho / 2,
        width: tamanho,
        height: tamanho,
        borderRadius: "50%",
        background: "radial-gradient(circle at 34% 30%, #FFFFFF 0%, #E3E5E7 18%, #A9ADB2 58%, #6A6E73 100%)",
        boxShadow: "0 3px 3px rgba(0,0,0,0.6), 3px 10px 10px rgba(0,0,0,0.4)",
        transform: p < 1 ? `scale(${1 + 0.6 * (1 - p)})` : undefined,
        opacity: Math.min(1, p * 2.5),
      }}
    />
  );

// Fita adesiva translúcida (prende prints e recortes).
export const Fita: React.FC<{ x: number; y: number; w?: number; rot?: number }> = ({ x, y, w = 150, rot = -8 }) => (
  <div
    style={{
      position: "absolute",
      left: x - w / 2,
      top: y - 22,
      width: w,
      height: 44,
      background: "rgba(226,214,184,0.78)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
      rotate: `${rot}deg`,
      clipPath: "polygon(0 6%, 4% 0, 8% 9%, 13% 1%, 87% 0, 92% 8%, 96% 1%, 100% 7%, 100% 93%, 96% 100%, 91% 92%, 86% 100%, 14% 99%, 9% 91%, 4% 100%, 0 94%)",
    }}
  />
);

// Etiqueta de prova (cartãozinho manila com furo e texto datilografado). `p` 0→1 entra girando.
export const Etiqueta: React.FC<{ texto: string; x: number; y: number; rot?: number; p?: number; tamanho?: number }> = ({ texto, x, y, rot = -7, p = 1, tamanho = 30 }) => {
  if (p <= 0) return null;
  const largura = Math.max(200, Math.ceil(texto.length * tamanho * 0.66 * 1.12) + 92);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: largura,
        height: tamanho * 2.5,
        rotate: `${rot + (1 - p) * 14}deg`,
        transformOrigin: "20px 50%",
        opacity: Math.min(1, p * 2),
        filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.45))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: COR.manilaClaro,
          clipPath: "polygon(18% 0, 100% 0, 100% 100%, 18% 100%, 0 72%, 0 28%)",
          display: "flex",
          alignItems: "center",
          paddingLeft: 64,
        }}
      >
        <div style={{ position: "absolute", left: 26, top: "50%", width: 18, height: 18, marginTop: -9, borderRadius: 9, background: "#3A2D1F", boxShadow: `0 0 0 5px ${COR.manilaEscuro}` }} />
        <span style={{ ...rotulo(tamanho), color: COR.tinta, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{texto}</span>
      </div>
    </div>
  );
};

// Carimbo de borracha: desce rápido, bate seco (sem quicar), tinta falhada. Vermelho-sangue.
export const Carimbo: React.FC<{
  linhas: string[];
  corpo: number;
  em: number;
  t: number;
  rot?: number;
  icone?: React.ReactNode;
  semente?: number;
  style?: React.CSSProperties;
}> = ({ linhas, corpo, em, t, rot = -6, icone, semente = 1, style }) => {
  if (t < em - 0.1) return null;
  const desce = prog(t, em - 0.1, 0.1, bate);
  const px = Math.round(acaso(semente) * 400);
  const py = Math.round(acaso(semente + 9) * 400);
  const mascara = `url(${staticFile("textura/tinta.png")})`;
  const borda = Math.max(4, Math.round(corpo * 0.085));
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: corpo * 0.3,
        padding: `${corpo * 0.24}px ${corpo * 0.36}px ${corpo * 0.2}px`,
        border: `${borda}px solid ${COR.sangue}`,
        outline: `${Math.max(2, borda * 0.45)}px solid ${COR.sangue}`,
        outlineOffset: -borda * 2.4,
        borderRadius: corpo * 0.1,
        color: COR.sangue,
        rotate: `${rot}deg`,
        scale: String(1.45 - 0.45 * desce),
        opacity: desce < 0.98 ? 0.25 + desce * 0.5 : 0.93,
        WebkitMaskImage: mascara,
        maskImage: mascara,
        WebkitMaskSize: "420px 420px",
        maskSize: "420px 420px",
        WebkitMaskPosition: `${px}px ${py}px`,
        maskPosition: `${px}px ${py}px`,
        ...style,
      }}
    >
      {icone}
      <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: corpo, letterSpacing: "0.05em", lineHeight: 1.02, textTransform: "uppercase", whiteSpace: "nowrap", textAlign: "center" }}>
        {linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};

// Mede o carimbo para um texto numa largura: corpo e linhas (até 3).
export const medirCarimbo = (texto: string, largura: number, max: number, min = 40) =>
  encaixar(texto.toUpperCase(), { largura: largura - max * 0.9, max, min, linhas: 3, fonte: { peso: 800, espacamento: 0.05 } });

// Tarja de censura: barra de tinta que corre da esquerda (como marcador grosso), borda irregular.
export const Tarja: React.FC<{ w: number; h: number; em: number; t: number; semente?: number }> = ({ w, h, em, t, semente = 3 }) => {
  const p = prog(t, em, 0.34);
  if (p <= 0) return null;
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${acaso(semente * 31 + i) * 9}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - acaso(semente * 53 + i) * 9}%`);
  return (
    <div style={{ width: w * p, height: h, overflow: "hidden" }}>
      <div style={{ width: w, height: h, background: "#141210", clipPath: `polygon(${pts.join(",")})` }} />
    </div>
  );
};

// Clipe de papel (metal), desenhado em vetor.
export const Clipe: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 8 }) => (
  <svg width={60} height={150} viewBox="0 0 60 150" style={{ position: "absolute", left: x - 30, top: y - 40, rotate: `${rot}deg`, filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.45))" }}>
    <path d="M18 120 L18 28 Q18 10 30 10 Q42 10 42 28 L42 132 Q42 146 30 146 Q14 146 14 132 L14 40" fill="none" stroke="#BFC3C8" strokeWidth={6} strokeLinecap="round" />
    <path d="M18 120 L18 28 Q18 10 30 10 Q42 10 42 28 L42 132" fill="none" stroke="#EEF0F2" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
  </svg>
);

// Polaroide: borda branca grossa embaixo, foto em "cover" com foco; aproxima devagar a partir de `desde`.
// Sem imagem: um cartão de papel com a palavra (nunca uma imagem errada).
export const Polaroide: React.FC<{
  w: number;
  imagem: Imagem | null;
  palavra: string;
  legenda?: string;
  t: number;
  desde: number;
}> = ({ w, imagem, palavra, legenda, t, desde }) => {
  const borda = Math.round(w * 0.055);
  const foto = w - borda * 2;
  const baixo = legenda ? Math.round(w * 0.24) : Math.round(w * 0.18);
  const h = borda + foto + baixo;
  const z = 1 + 0.06 * limitar((t - desde) / 4);
  const fx = imagem?.foco?.x ?? 0.5;
  const fy = imagem?.foco?.y ?? 0.5;
  const fitLegenda = legenda ? encaixar(legenda, { largura: foto - 20, max: Math.round(w * 0.075), min: Math.round(w * 0.05), linhas: 2, fonte: { peso: 600 } }) : null;
  return (
    <div style={{ position: "absolute", width: w, height: h, background: COR.foto, boxShadow: SOMBRA }}>
      <div style={{ position: "absolute", left: borda, top: borda, width: foto, height: foto, overflow: "hidden", background: "#2A2420" }}>
        {imagem?.arquivo && !imagem.sem ? (
          <Img
            src={staticFile(imagem.arquivo)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%`, transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: COR.ficha, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
            <span style={{ fontFamily: SORA, fontWeight: 800, fontSize: Math.round(w * 0.1), color: COR.tinta, textAlign: "center", lineHeight: 1.05 }}>{palavra}</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12), inset 0 0 40px rgba(0,0,0,0.25)" }} />
      </div>
      {fitLegenda ? (
        <div style={{ position: "absolute", left: borda, right: borda, top: borda + foto, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: fitLegenda.tamanho, lineHeight: 1.1, color: COR.tinta, textAlign: "center" }}>
            {fitLegenda.linhas.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
export const alturaPolaroide = (w: number, legenda?: string) => {
  const borda = Math.round(w * 0.055);
  return borda + (w - borda * 2) + (legenda ? Math.round(w * 0.24) : Math.round(w * 0.18));
};

// Ícones genéricos (traço), nunca logo de marca.
export type NomeIcone = "predio" | "alerta" | "salvar" | "seguir" | "comentar" | "link" | "telefone" | "desligar" | "pessoa";
export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor?: string; espessura?: number; style?: React.CSSProperties }> = ({ nome, tamanho, cor = "currentColor", espessura = 2.2, style }) => {
  const p = { fill: "none", stroke: cor, strokeWidth: espessura, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const desenho: Record<NomeIcone, React.ReactNode> = {
    predio: (
      <>
        <path d="M3 9.5 L12 4 L21 9.5" {...p} />
        <path d="M5 10.5 V18 M9.7 10.5 V18 M14.3 10.5 V18 M19 10.5 V18" {...p} />
        <path d="M3 20.5 H21" {...p} />
      </>
    ),
    alerta: (
      <>
        <path d="M12 3.5 L21.5 20 H2.5 Z" {...p} />
        <path d="M12 10 V14.2" {...p} />
        <circle cx={12} cy={17.2} r={0.6} fill={cor} stroke={cor} strokeWidth={espessura * 0.6} />
      </>
    ),
    salvar: <path d="M6.5 3.5 H17.5 V20.5 L12 16.4 L6.5 20.5 Z" {...p} />,
    seguir: (
      <>
        <circle cx={10} cy={8} r={3.8} {...p} />
        <path d="M3.5 20 C4.5 15.5 7 13.8 10 13.8 C13 13.8 15.5 15.5 16.5 20" {...p} />
        <path d="M19 7.5 V13.5 M16 10.5 H22" {...p} />
      </>
    ),
    comentar: <path d="M4 5 H20 V16 H11 L6.5 20 V16 H4 Z" {...p} />,
    link: (
      <>
        <path d="M10 14 L14 10" {...p} />
        <path d="M8.5 11.5 L6.5 13.5 A3.5 3.5 0 0 0 11.5 18.5 L13.5 16.5" {...p} />
        <path d="M15.5 12.5 L17.5 10.5 A3.5 3.5 0 0 0 12.5 5.5 L10.5 7.5" {...p} />
      </>
    ),
    telefone: <path d="M6.6 3.8 L9.4 3.5 L11 7.9 L8.9 9.6 C9.9 11.9 12.1 14.1 14.4 15.1 L16.1 13 L20.5 14.6 L20.2 17.4 C20 18.9 18.7 20 17.2 19.9 C10 19.2 4.8 14 4.1 6.8 C4 5.3 5.1 4 6.6 3.8 Z" {...p} />,
    desligar: <path d="M3.5 13.8 C8.5 9.2 15.5 9.2 20.5 13.8 L18.8 16.4 L15.2 15 L15 12.6 C13 12 11 12 9 12.6 L8.8 15 L5.2 16.4 Z" {...p} />,
    pessoa: (
      <>
        <circle cx={12} cy={8.5} r={4} {...p} />
        <path d="M4.5 20.5 C5.5 15.8 8.4 14 12 14 C15.6 14 18.5 15.8 19.5 20.5" {...p} />
      </>
    ),
  };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ flex: "none", ...style }}>
      {desenho[nome]}
    </svg>
  );
};

// Linha datilografada curta (rótulo de formulário)
export const Rotulo: React.FC<{ children: React.ReactNode; tamanho?: number; cor?: string; style?: React.CSSProperties }> = ({ children, tamanho = 30, cor, style }) => (
  <div style={{ ...rotulo(tamanho), ...(cor ? { color: cor } : {}), ...style }}>{children}</div>
);

export { ELITE, SOMBRA_LEVE };
