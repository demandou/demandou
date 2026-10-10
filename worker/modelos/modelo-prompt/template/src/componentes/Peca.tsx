// A peça do prompt: um bloco com dente. O encaixe fica no alto (um recorte) e o dente embaixo,
// na mesma posição, então a peça de baixo recebe o dente da de cima — como blocos de montar.
// A versão "lateral" tem o recorte à esquerda e o dente à direita (peças em fila).
import type { Ret } from "../anim";
import { type CorDaPeca, cor, mono } from "../tema";
import { Icone } from "./Icones";
import type { Icone as NomeDoIcone } from "../plano";

export type Dente = { x: number; w: number; d: number };

// o dente cresce com a peça (peça grande: ~23 px de altura; peça pequena: ~10)
export const denteDe = (h: number): Dente => {
  const d = Math.max(10, Math.min(24, h * 0.11));
  return { x: d * 2.6, w: d * 5.4, d };
};

export const caminhoDaPeca = (w: number, h: number, dente: Dente, raio: number, encaixe = true, comDente = true) => {
  const r = Math.min(raio, h / 2, w / 2);
  const { x: dx, w: dw, d } = dente;
  const c = Math.min(dw * 0.2, d * 0.95);
  let p = `M ${r} 0`;
  if (encaixe)
    p += ` L ${dx} 0 C ${dx + c * 0.55} 0 ${dx + c * 0.45} ${d} ${dx + c} ${d} L ${dx + dw - c} ${d} C ${dx + dw - c * 0.45} ${d} ${dx + dw - c * 0.55} 0 ${dx + dw} 0`;
  p += ` L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h}`;
  if (comDente)
    p += ` L ${dx + dw} ${h} C ${dx + dw - c * 0.55} ${h} ${dx + dw - c * 0.45} ${h + d} ${dx + dw - c} ${h + d} L ${dx + c} ${h + d} C ${dx + c * 0.45} ${h + d} ${dx + c * 0.55} ${h} ${dx} ${h}`;
  p += ` L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  return p;
};

// peça em fila: recorte na esquerda, dente na direita (centrados na altura)
export const caminhoLateral = (w: number, h: number, d: number, raio: number, encaixe = true, comDente = true) => {
  const r = Math.min(raio, h / 2);
  const dh = h * 0.42;
  const dy = (h - dh) / 2;
  const c = Math.min(dh * 0.2, d * 0.95);
  let p = `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r}`;
  if (comDente)
    p += ` L ${w} ${dy} C ${w} ${dy + c * 0.55} ${w + d} ${dy + c * 0.45} ${w + d} ${dy + c} L ${w + d} ${dy + dh - c} C ${w + d} ${dy + dh - c * 0.45} ${w} ${dy + dh - c * 0.55} ${w} ${dy + dh}`;
  p += ` L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r}`;
  if (encaixe)
    p += ` L 0 ${dy + dh} C 0 ${dy + dh - c * 0.55} ${d} ${dy + dh - c * 0.45} ${d} ${dy + dh - c} L ${d} ${dy + c} C ${d} ${dy + c * 0.45} 0 ${dy + c * 0.55} 0 ${dy}`;
  p += ` L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  return p;
};

// O desenho da peça (cheia ou a lápis) num retângulo do quadro.
export const FormaDaPeca: React.FC<{
  r: Ret;
  preenchimento: string;
  traco?: string;
  tracejado?: boolean;
  raio?: number;
  encaixe?: boolean;
  comDente?: boolean;
  lateral?: boolean;
  // 0 = sem sombra; 1 = assentada; 2 = no ar
  sombra?: number;
  opacidade?: number;
  children?: React.ReactNode;
}> = ({ r, preenchimento, traco, tracejado, raio = 26, encaixe = true, comDente = true, lateral = false, sombra = 0, opacidade = 1, children }) => {
  const dente = denteDe(r.h);
  const caminho = lateral ? caminhoLateral(r.w, r.h, dente.d, raio, encaixe, comDente) : caminhoDaPeca(r.w, r.h, dente, raio, encaixe, comDente);
  const filtro =
    sombra > 0
      ? `drop-shadow(0 ${(5 * sombra).toFixed(1)}px ${(9 * sombra).toFixed(1)}px rgba(21,23,28,${(0.13 + 0.05 * sombra).toFixed(3)}))`
      : undefined;
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: opacidade }}>
      <svg
        width={r.w + (lateral ? dente.d : 0)}
        height={r.h + (lateral ? 0 : dente.d)}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: filtro }}
      >
        <path
          d={caminho}
          fill={preenchimento}
          stroke={traco ?? "none"}
          strokeWidth={traco ? 3 : 0}
          strokeDasharray={tracejado ? "13 10" : undefined}
          strokeLinejoin="round"
        />
        {/* peça cheia: um brilho leve no alto e um fio claro na borda de cima, como um bloco de verdade */}
        {traco ? null : (
          <>
            <defs>
              <linearGradient id={`brilho-${Math.round(r.h)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.13} />
                <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={caminho} fill={`url(#brilho-${Math.round(r.h)})`} />
            <path d={caminho} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={2} strokeDasharray={`${Math.max(0, r.w - 40)} 100000`} strokeDashoffset={-4} />
          </>
        )}
      </svg>
      {children}
    </div>
  );
};

// O letreiro da peça: ícone + nome em caixa alta, numa pastilha translúcida.
export const Letreiro: React.FC<{
  nome: string;
  icone: NomeDoIcone;
  corTexto: string;
  fundo: string;
  tamanho?: number;
  estilo?: React.CSSProperties;
}> = ({ nome, icone, corTexto, fundo, tamanho = 32, estilo }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: tamanho * 0.36,
      height: tamanho * 1.62,
      padding: `0 ${tamanho * 0.56}px 0 ${tamanho * 0.42}px`,
      borderRadius: tamanho * 0.5,
      background: fundo,
      color: corTexto,
      fontFamily: mono,
      fontWeight: 600,
      fontSize: tamanho,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...estilo,
    }}
  >
    <Icone nome={icone} tamanho={tamanho * 1.15} cor={corTexto} espessura={3.8} />
    <span style={{ lineHeight: 1 }}>{nome}</span>
  </div>
);

// fundo translúcido do letreiro em cima da cor da peça
export const fundoDoLetreiro = (c: CorDaPeca) => (c.texto === "#FFFFFF" ? "rgba(255,255,255,0.18)" : "rgba(42,30,4,0.10)");

// A vaga a lápis: o contorno tracejado da peça, com o letreiro apagado e barras no lugar do texto.
export const Vaga: React.FC<{
  r: Ret;
  nome: string;
  icone: NomeDoIcone;
  opacidade: number;
  // 0 = vaga pequena (só o letreiro), 1 = vaga do tamanho da peça (letreiro + barras de texto)
  tamanho: number;
  // o letreiro ganha a cor da peça (quando o número de peças é dito)
  cor?: CorDaPeca;
  acesa?: number;
}> = ({ r, nome, icone, opacidade, tamanho, cor: c, acesa = 0 }) => (
  <FormaDaPeca r={r} preenchimento="rgba(255,255,255,0.42)" traco={cor.lapis} tracejado opacidade={opacidade}>
    <Letreiro
      nome={nome}
      icone={icone}
      corTexto={c && acesa > 0.5 ? c.escura : cor.lapis}
      fundo={c && acesa > 0 ? `color-mix(in srgb, ${c.clara} ${Math.round(acesa * 100)}%, rgba(156,163,173,0.12))` : "rgba(156,163,173,0.12)"}
      estilo={{ position: "absolute", left: 24, top: Math.max(10, Math.min(24, (r.h - 52) / 2)) }}
    />
    <div style={{ position: "absolute", left: 30, top: 104, opacity: tamanho, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ width: (r.w - 60) * 0.58, height: 22, borderRadius: 11, background: cor.lapisClaro }} />
      <div style={{ width: (r.w - 60) * 0.34, height: 22, borderRadius: 11, background: cor.lapisClaro, opacity: r.h > 190 ? 1 : 0 }} />
    </div>
  </FormaDaPeca>
);
