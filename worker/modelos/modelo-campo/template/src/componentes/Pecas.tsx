// Peças do caderno de campo: texto medido que se monta na fala (com o grifo amarelo de
// sinalização), etiqueta de instrumento em mono, a mira de levantamento (cantos amarelos que
// travam no alvo), o cartão de campo, a foto que se aproxima devagar e os ícones em traço.
import { Fragment, type CSSProperties } from "react";
import { Img, staticFile } from "remotion";
import { prog } from "../anim";
import { encaixar, larguraTexto, trechoNoTexto, type Peso } from "../medida";
import { enquadrarFoto, type Imagem } from "../motor/imagem";
import { cor, fonte, mono, RAIO, sombraLeve } from "../tema";

export const estiloFonte = (peso: Peso, tamanho: number, c: string = cor.tinta): CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontSize: tamanho,
  lineHeight: 1.16,
  letterSpacing: peso >= 800 ? "-0.02em" : "-0.01em",
  color: c,
  whiteSpace: "nowrap",
});

export const caber = (texto: string, largura: number, max: number, min: number, linhas: number, peso: Peso = 800) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso } });
// Título com quebra editorial: em duas linhas, a quebra cai antes do `destaque` (o trecho grifado
// fica inteiro na linha de baixo) quando isso custa pouco corpo.
export const caberTitulo = (texto: string, destaque: string | undefined, largura: number, max: number, min: number) => {
  const base = encaixar(texto, { largura, max, min, linhas: 2, fonte: { peso: 800 } });
  if (base.linhas.length < 2 || !destaque) return base;
  const ws = texto.split(/\s+/).filter(Boolean);
  const d = trechoNoTexto(texto, destaque);
  if (!d || d[0] === 0) return base;
  const l1 = ws.slice(0, d[0]).join(" ");
  const l2 = ws.slice(d[0]).join(" ");
  for (let tam = base.tamanho; tam >= Math.max(min, base.tamanho * 0.88); tam -= 2) {
    if (larguraTexto(l1, tam, { peso: 800 }) <= largura && larguraTexto(l2, tam, { peso: 800 }) <= largura) return { tamanho: tam, linhas: [l1, l2] };
  }
  return base;
};
export const caberMono = (texto: string, largura: number, max: number, min: number, linhas = 1) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { mono: true } });

// Texto em linhas medidas. Com `tempos` (um por palavra), cada palavra entra no seu instante (sobe
// de leve e acende); terminada a entrada, a palavra fica desenhada simples. `destaque` = trecho com
// o grifo amarelo que corre por trás quando a palavra é dita; `risco` = trecho riscado em `riscoEm`.
export const Texto: React.FC<{
  t: number;
  linhas: string[];
  tamanho: number;
  peso?: Peso;
  cor?: string;
  alinhar?: "left" | "center";
  tempos?: number[];
  destaque?: string;
  corGrifo?: string;
  risco?: string;
  riscoEm?: number;
}> = ({ t, linhas, tamanho, peso = 800, cor: c = cor.tinta, alinhar = "center", tempos, destaque, corGrifo = cor.sinal, risco, riscoEm }) => {
  const inteiro = linhas.join(" ");
  const d = trechoNoTexto(inteiro, destaque);
  const r = trechoNoTexto(inteiro, risco);
  let k = -1;
  return (
    <div style={{ textAlign: alinhar }}>
      {linhas.map((l, li) => (
        <div key={li} style={estiloFonte(peso, tamanho, c)}>
          {l.split(" ").map((w, wi, arr) => {
            k++;
            const em = tempos?.[k] ?? -1;
            const p = tempos ? prog(t, em, 0.22) : 1;
            const naoDita = tempos ? t < em - 0.02 : false;
            const grifada = d && k >= d[0] && k <= d[1];
            const pG = grifada ? (tempos ? prog(t, em + 0.04, 0.26) : 1) : 0;
            const riscada = r && k >= r[0] && k <= r[1];
            const pR = riscada && riscoEm !== undefined ? prog(t, riscoEm, 0.3) : 0;
            const ultimaGrifada = grifada && d && k === d[1];
            return (
              <Fragment key={wi}>
                <span style={{ position: "relative", display: "inline-block", visibility: naoDita ? "hidden" : "visible" }}>
                  {pG > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: -tamanho * 0.08,
                        top: tamanho * 0.2,
                        height: tamanho * 0.86,
                        width: `calc(${pG * 100}% + ${tamanho * (ultimaGrifada ? 0.16 : 0.42) * pG}px)`,
                        background: corGrifo,
                        borderRadius: tamanho * 0.08,
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      position: "relative",
                      display: "inline-block",
                      opacity: p >= 1 ? (pR > 0 ? 1 - 0.45 * pR : 1) : p,
                      transform: p >= 1 ? undefined : `translateY(${(1 - p) * tamanho * 0.28}px)`,
                    }}
                  >
                    {w}
                  </span>
                  {pR > 0 ? (
                    <span style={{ position: "absolute", left: -4, top: "54%", height: Math.max(5, tamanho * 0.09), width: `calc(${pR * 100}% + 8px)`, background: cor.alerta, borderRadius: 4 }} />
                  ) : null}
                </span>
                {wi < arr.length - 1 ? " " : ""}
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Etiqueta de instrumento: mono em caixa alta (rótulos curtos, "ILUSTRATIVO", estaca).
export const Etiqueta: React.FC<{ texto: string; fundo?: string; tinta?: string; tamanho?: number; icone?: NomeIcone }> = ({
  texto,
  fundo = cor.verdeEscuro,
  tinta = cor.palha,
  tamanho = 26,
  icone,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: tamanho * 0.4,
      padding: `${tamanho * 0.34}px ${tamanho * 0.7}px`,
      borderRadius: tamanho * 0.3,
      background: fundo,
      color: tinta,
      fontFamily: mono,
      fontWeight: 700,
      fontSize: tamanho,
      letterSpacing: "0.04em",
      lineHeight: 1.05,
      whiteSpace: "nowrap",
      textTransform: "uppercase",
    }}
  >
    {icone ? <Icone nome={icone} tamanho={tamanho * 1.15} cor={tinta} traco={2.6} /> : null}
    {texto}
  </div>
);

// A mira de levantamento: quatro cantos amarelos que chegam de fora e travam no retângulo.
export const Mira: React.FC<{ t: number; em: number; x: number; y: number; w: number; h: number; braco?: number; espessura?: number; corMira?: string }> = ({
  t,
  em,
  x,
  y,
  w,
  h,
  braco = 40,
  espessura = 7,
  corMira = cor.sinal,
}) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em, 0.38);
  const folga = (1 - p) * 46;
  const b = Math.min(braco, w / 3, h / 3);
  const canto = (cx: number, cy: number, sx: number, sy: number, k: number) => (
    <div
      key={k}
      style={{
        position: "absolute",
        left: cx + sx * folga - (sx > 0 ? 0 : b),
        top: cy + sy * folga - (sy > 0 ? 0 : b),
        width: b,
        height: b,
        borderLeft: sx > 0 ? `${espessura}px solid ${corMira}` : undefined,
        borderRight: sx < 0 ? `${espessura}px solid ${corMira}` : undefined,
        borderTop: sy > 0 ? `${espessura}px solid ${corMira}` : undefined,
        borderBottom: sy < 0 ? `${espessura}px solid ${corMira}` : undefined,
        borderRadius: 4,
        opacity: Math.min(1, p * 2),
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
      }}
    />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}>
      {canto(x - espessura - 6, y - espessura - 6, 1, 1, 0)}
      {canto(x + w + espessura + 6, y - espessura - 6, -1, 1, 1)}
      {canto(x - espessura - 6, y + h + espessura + 6, 1, -1, 2)}
      {canto(x + w + espessura + 6, y + h + espessura + 6, -1, -1, 3)}
    </div>
  );
};

// O cartão de campo: creme, borda de papel, sombra macia; com `cabecalho`, uma faixa verde-lavoura
// no alto com o rótulo em mono.
export const Cartao: React.FC<{ x: number; y: number; w: number; h: number; style?: CSSProperties; children?: React.ReactNode; fundo?: string }> = ({
  x,
  y,
  w,
  h,
  style,
  children,
  fundo = cor.cartao,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: fundo, border: `2px solid ${cor.cartaoBorda}`, boxShadow: sombraLeve }} />
    {children}
  </div>
);

// Foto que preenche a caixa dela (cover pelo foco) e se aproxima devagar (drone descendo).
export const FotoCampo: React.FC<{ t: number; img: Imagem & { arquivo: string }; w: number; h: number; inicio: number; fim: number; zoom?: [number, number]; raio?: number }> = ({
  t,
  img,
  w,
  h,
  inicio,
  fim,
  zoom = [1.04, 1.14],
  raio = RAIO,
}) => {
  const iw = img.largura ?? 1600;
  const ih = img.altura ?? 1000;
  const e = enquadrarFoto(w, h, iw, ih, img.foco ?? { x: 0.5, y: 0.5 });
  const p = Math.min(1, Math.max(0, (t - inicio) / Math.max(1, fim - inicio)));
  const z = zoom[0] + (zoom[1] - zoom[0]) * p;
  const ox = e.focoX;
  const oy = e.focoY;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: raio }}>
      <Img
        src={staticFile(img.arquivo)}
        style={{
          position: "absolute",
          left: e.x,
          top: e.y,
          width: e.w,
          height: e.h,
          transformOrigin: `${ox - e.x}px ${oy - e.y}px`,
          transform: `scale(${z})`,
        }}
      />
    </div>
  );
};

export type NomeIcone =
  | "salvar"
  | "seguir"
  | "comentar"
  | "link"
  | "certo"
  | "errado"
  | "gota"
  | "broto"
  | "sobe"
  | "cai"
  | "estaca"
  | "interrogacao"
  | "planilha"
  | "alerta";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; traco?: number }> = ({ nome, tamanho, cor: c, traco = 2.4 }) => {
  const comum = { fill: "none", stroke: c, strokeWidth: traco, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...comum} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx="9.5" cy="8" r="3.6" {...comum} />
          <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M18.5 7v6M15.5 10h6" {...comum} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4z" {...comum} /> : null}
      {nome === "link" ? (
        <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" {...comum} />
      ) : null}
      {nome === "certo" ? <path d="M5 12.5l4.5 4.5L19 7.5" {...comum} /> : null}
      {nome === "errado" ? <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...comum} /> : null}
      {nome === "gota" ? <path d="M12 3.5c3.2 4.2 5.5 7.4 5.5 10.2a5.5 5.5 0 0 1-11 0c0-2.8 2.3-6 5.5-10.2z" {...comum} /> : null}
      {nome === "broto" ? <path d="M12 21v-9M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5zM12 14.5c0-3-2.4-5-5.5-5 0 3 2.4 5 5.5 5z" {...comum} /> : null}
      {nome === "sobe" ? <path d="M4 17l6-6 4 4 6-7M14 8h6v6" {...comum} /> : null}
      {nome === "cai" ? <path d="M4 7l6 6 4-4 6 7M14 16h6v-6" {...comum} /> : null}
      {nome === "estaca" ? <path d="M7 21V4M7 4.5h10.5l-2.5 3.5 2.5 3.5H7" {...comum} /> : null}
      {nome === "interrogacao" ? (
        <>
          <path d="M8.6 8.6a3.5 3.5 0 1 1 5 3.2c-1 .5-1.6 1.3-1.6 2.4v.6" {...comum} />
          <circle cx="12" cy="18.6" r="0.6" {...comum} />
        </>
      ) : null}
      {nome === "planilha" ? <path d="M4 4.5h16v15H4zM4 9.5h16M4 14.5h16M10 4.5v15" {...comum} /> : null}
      {nome === "alerta" ? (
        <>
          <path d="M12 4l9 15.5H3z" {...comum} />
          <path d="M12 10v4.2M12 17v.3" {...comum} />
        </>
      ) : null}
    </svg>
  );
};

// ——— o tempo (ícones da previsão, desenhados em traço cheio) ———
export const IconeClima: React.FC<{ clima: string; tamanho: number; t?: number; ativo?: boolean }> = ({ clima, tamanho, t = 0, ativo = true }) => {
  const s = tamanho;
  const sol = cor.sinal;
  const nuvem = ativo ? "#FFFFFF" : "#F6F2E8";
  const contorno = ativo ? cor.ceuEscuro : cor.apagado;
  const gotas = clima === "chuva" || clima === "tempestade";
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      {clima === "sol" ? (
        <g transform={`rotate(${t * 20} 50 50)`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="50" y1="12" x2="50" y2="22" stroke={sol} strokeWidth="6" strokeLinecap="round" transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="20" fill={sol} />
        </g>
      ) : null}
      {clima === "geada" ? (
        <g stroke={cor.ceu} strokeWidth="6" strokeLinecap="round">
          {[0, 60, 120].map((a) => (
            <line key={a} x1="50" y1="16" x2="50" y2="84" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
      ) : null}
      {clima === "vento" ? (
        <g fill="none" stroke={contorno} strokeWidth="6" strokeLinecap="round">
          <path d={`M14 40h46a10 10 0 1 0-10-10`} transform={`translate(${Math.sin(t * 3) * 3} 0)`} />
          <path d={`M14 58h58a10 10 0 1 1-10 10`} transform={`translate(${Math.sin(t * 3 + 1) * 3} 0)`} />
        </g>
      ) : null}
      {clima === "nuvem" || gotas ? (
        <>
          {clima === "nuvem" ? <circle cx="66" cy="34" r="15" fill={sol} /> : null}
          <path
            d="M28 66h46a14 14 0 0 0 1-28 20 20 0 0 0-38-4 14 14 0 0 0-9 32z"
            fill={clima === "tempestade" ? "#C9D3DC" : nuvem}
            stroke={contorno}
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </>
      ) : null}
      {gotas
        ? [34, 50, 66].map((x, i) => {
            const fase = ((t * 1.6 + i * 0.33) % 1 + 1) % 1;
            return <line key={x} x1={x - 3} y1={74 + fase * 14} x2={x - 6} y2={82 + fase * 14} stroke={cor.ceu} strokeWidth="6" strokeLinecap="round" opacity={1 - fase * 0.6} />;
          })
        : null}
      {clima === "tempestade" ? <path d="M54 66l-8 14h9l-6 13" fill="none" stroke={cor.sinal} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" /> : null}
    </svg>
  );
};
