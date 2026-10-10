// Peças do relatório do Case: texto medido que se monta na fala, texto datilografado, a etiqueta de
// seção, a linha-esqueleto (o campo ainda em branco), o marca-texto coral e os ícones de interface.
import { Fragment, type CSSProperties } from "react";
import { prog, saida, temposDoTexto } from "../anim";
import { encaixar, larguraTexto, TRACKING, trechoNoTexto, type Peso } from "../medida";
import type { Palavra } from "../plano";
import { cor, fonte, mono } from "../tema";

export const estiloFonte = (peso: Peso, tamanho: number, c: string = cor.tinta): CSSProperties => ({
  fontFamily: fonte,
  fontWeight: peso,
  fontSize: tamanho,
  lineHeight: 1.12,
  letterSpacing: `${TRACKING[peso]}em`,
  color: c,
  whiteSpace: "nowrap",
});

export const caber = (texto: string, largura: number, max: number, min: number, linhas: number, peso: Peso = 800) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso } });

// Texto em linhas medidas. Com `tempos` (um por palavra), cada palavra entra no seu instante (sobe
// de leve e acende); terminada a entrada, a palavra fica desenhada simples. `destaque` = trecho em
// coral (com `marca`, ganha também o marca-texto, que se desenha em `marcaEm`); `risco` = trecho
// riscado em `riscoEm`.
export const Texto: React.FC<{
  t: number;
  linhas: string[];
  tamanho: number;
  peso?: Peso;
  cor?: string;
  alinhar?: "left" | "center";
  tempos?: number[];
  destaque?: string;
  marca?: boolean;
  marcaEm?: number;
  risco?: string;
  riscoEm?: number;
  altura?: number;
}> = ({ t, linhas, tamanho, peso = 800, cor: c = cor.tinta, alinhar = "left", tempos, destaque, marca, marcaEm, risco, riscoEm, altura = 1.12 }) => {
  const inteiro = linhas.join(" ");
  const d = trechoNoTexto(inteiro, destaque);
  const r = trechoNoTexto(inteiro, risco);
  let k = -1;
  return (
    <div style={{ textAlign: alinhar }}>
      {linhas.map((l, li) => {
        const ws = l.split(" ");
        return (
          <div key={li} style={{ ...estiloFonte(peso, tamanho, c), lineHeight: altura }}>
            {ws.map((w, wi) => {
              k++;
              const em = tempos?.[k] ?? -1;
              const p = tempos ? prog(t, em, 0.22) : 1;
              const naoDita = tempos ? t < em - 0.02 : false;
              const destacada = d && k >= d[0] && k <= d[1];
              const riscada = r && k >= r[0] && k <= r[1];
              const pR = riscada && riscoEm !== undefined ? prog(t, riscoEm, 0.3) : 0;
              const inicioMarca = marcaEm ?? (d ? (tempos?.[d[0]] ?? 0) : 0);
              const pM = destacada && marca ? prog(t, inicioMarca + (k - (d?.[0] ?? k)) * 0.08, 0.3) : 0;
              return (
                <Fragment key={wi}>
                  <span style={{ position: "relative", display: "inline-block", visibility: naoDita ? "hidden" : "visible" }}>
                    {pM > 0 ? (
                      <span
                        style={{
                          position: "absolute",
                          left: -tamanho * 0.06,
                          bottom: tamanho * 0.04,
                          height: tamanho * 0.34,
                          width: `calc(${pM * 100}% + ${tamanho * 0.12 * pM}px)`,
                          background: cor.acentoClaro,
                          borderRadius: tamanho * 0.06,
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        position: "relative",
                        display: "inline-block",
                        color: destacada ? cor.acento : undefined,
                        opacity: p >= 1 ? (pR > 0 ? 1 - 0.45 * pR : 1) : p,
                        transform: p >= 1 ? undefined : `translateY(${(1 - p) * tamanho * 0.22}px)`,
                      }}
                    >
                      {w}
                    </span>
                    {pR > 0 ? (
                      <span style={{ position: "absolute", left: -4, top: "54%", height: Math.max(5, tamanho * 0.08), width: `calc(${pR * 100}% + 8px)`, background: cor.acento, borderRadius: 3 }} />
                    ) : null}
                  </span>
                  {wi < ws.length - 1 ? " " : ""}
                </Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Texto que entra palavra por palavra na fala, e cada palavra é datilografada (o "relatório sendo
// escrito"). O cursor coral pisca enquanto escreve. Terminado, fica o texto simples.
export const Datilo: React.FC<{
  t: number;
  linhas: string[];
  tamanho: number;
  em: number;
  palavras: Palavra[];
  ate?: number;
  peso?: Peso;
  cor?: string;
  destaque?: string;
  alinhar?: "left" | "center";
  cursor?: boolean;
}> = ({ t, linhas, tamanho, em, palavras, ate, peso = 800, cor: c = cor.tinta, destaque, alinhar = "left", cursor = true }) => {
  const inteiro = linhas.join(" ");
  const tempos = temposDoTexto(inteiro, em, palavras, ate);
  const d = trechoNoTexto(inteiro, destaque);
  const fimEscrita = (tempos[tempos.length - 1] ?? em) + 0.16;
  let k = -1;
  return (
    <div style={{ textAlign: alinhar }}>
      {linhas.map((l, li) => {
        const ws = l.split(" ");
        return (
          <div key={li} style={estiloFonte(peso, tamanho, c)}>
            {ws.map((w, wi) => {
              k++;
              const e = tempos[k] ?? em;
              const letras = [...w];
              const n = t < e ? 0 : Math.min(letras.length, Math.floor((t - e) / Math.min(0.045, 0.16 / letras.length)) + 1);
              const destacada = d && k >= d[0] && k <= d[1];
              const escrevendo = n > 0 && n < letras.length;
              const ultimaDita = k === tempos.filter((x) => t >= x).length - 1;
              const comCursor = cursor && ultimaDita && t < fimEscrita + 0.25;
              if (n >= letras.length && !comCursor) {
                // pronto: o texto final simples, sem camadas
                return (
                  <Fragment key={wi}>
                    <span style={{ color: destacada ? cor.acento : undefined }}>{w}</span>
                    {wi < ws.length - 1 ? " " : ""}
                  </Fragment>
                );
              }
              return (
                <Fragment key={wi}>
                  <span style={{ position: "relative", display: "inline-block", color: destacada ? cor.acento : undefined }}>
                    <span style={{ visibility: "hidden" }}>{w}</span>
                    <span style={{ position: "absolute", left: 0, top: 0 }}>{letras.slice(0, n).join("")}</span>
                    {comCursor && (escrevendo || Math.floor(t * 3.4) % 2 === 0) ? (
                      <span
                        style={{
                          position: "absolute",
                          left: larguraTexto(letras.slice(0, n).join(""), tamanho, { peso }) / 1.04 + tamanho * 0.04,
                          top: tamanho * 0.12,
                          width: Math.max(4, tamanho * 0.07),
                          height: tamanho * 0.9,
                          background: cor.acento,
                          borderRadius: 2,
                        }}
                      />
                    ) : null}
                  </span>
                  {wi < ws.length - 1 ? " " : ""}
                </Fragment>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Etiqueta de seção (O QUE FIZEMOS, DEPOIS…): entra já cheia de tinta (ou coral), numa varrida da
// esquerda para a direita que termina na primeira palavra da página. Antes disso, nada.
export const Chip: React.FC<{ t: number; texto: string; em: number; acento?: boolean; tamanho?: number }> = ({ t, texto, em, acento, tamanho = 30 }) => {
  const p = prog(t, em - 0.18, 0.26);
  if (p <= 0) return null;
  const fundo = acento ? cor.acento : cor.tinta;
  const larg = larguraTexto(texto.toLocaleUpperCase("pt-BR"), tamanho, { mono: true, espacamento: 0.14 }) + tamanho * 1.4;
  return (
    <div style={{ position: "relative", height: tamanho * 1.9, width: larg, clipPath: p < 1 ? `inset(0 ${(1 - p) * 100}% 0 0 round 8px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: fundo }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontSize: tamanho,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: cor.papel,
          whiteSpace: "nowrap",
          paddingLeft: "0.14em",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// Cabeça de página: a etiqueta e o filete que corre até a margem direita.
export const CabecaDePagina: React.FC<{ t: number; texto: string; em: number; largura: number; acento?: boolean }> = ({ t, texto, em, largura, acento }) => {
  const larg = larguraTexto(texto.toLocaleUpperCase("pt-BR"), 30, { mono: true, espacamento: 0.14 }) + 30 * 1.4;
  const pF = prog(t, em - 0.05, 0.5, saida);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: largura, height: 57 }}>
      <Chip t={t} texto={texto} em={em} acento={acento} />
      {pF > 0 ? <div style={{ position: "absolute", left: larg + 18, top: 28, height: 2, width: Math.max(0, largura - larg - 18) * pF, background: cor.filete }} /> : null}
    </div>
  );
};

// Rótulo curto em mono, caixa alta (rótulos de métrica, eixos, ILUSTRATIVO).
export const Rotulo: React.FC<{ texto: string; tamanho?: number; cor?: string; estilo?: CSSProperties }> = ({ texto, tamanho = 24, cor: c = cor.tintaSuave, estilo }) => (
  <div style={{ fontFamily: mono, fontSize: tamanho, letterSpacing: "0.1em", textTransform: "uppercase", color: c, whiteSpace: "nowrap", lineHeight: 1.2, ...estilo }}>{texto}</div>
);

// Largura de um rótulo mono (para alinhar e encaixar).
export const larguraRotulo = (texto: string, tamanho = 24) => larguraTexto(texto.toLocaleUpperCase("pt-BR"), tamanho, { mono: true, espacamento: 0.1 });

// Rótulo que cabe: reduz o corpo até `min` para caber em `largura`.
export const tamanhoRotulo = (texto: string, largura: number, max = 24, min = 18) => {
  let s = max;
  while (s > min && larguraRotulo(texto, s) > largura) s -= 1;
  return s;
};

// Etiqueta pequena de aviso (ILUSTRATIVO).
export const Aviso: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 6, border: `2px solid ${cor.tintaFraca}`, fontFamily: mono, fontSize: 24, letterSpacing: "0.12em", color: cor.tintaSuave, textTransform: "uppercase", whiteSpace: "nowrap" }}>
    {texto}
  </div>
);

// ——— ícones de interface (traço) ———
export type NomeIcone = "salvar" | "seguir" | "comentar" | "link" | "certo" | "errado" | "enviar" | "estrela" | "bandeira" | "pessoa" | "seta-baixo" | "seta-cima" | "interrogacao";

export const Icone: React.FC<{ nome: NomeIcone; tamanho: number; cor: string; traco?: number; preencher?: string }> = ({ nome, tamanho, cor: c, traco = 2.4, preencher }) => {
  const comum = { fill: "none", stroke: c, strokeWidth: traco, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
      {nome === "salvar" ? <path d="M6 3.5h12v17l-6-4.2-6 4.2z" {...comum} fill={preencher ?? "none"} /> : null}
      {nome === "seguir" ? (
        <>
          <circle cx="9.5" cy="8" r="3.6" {...comum} />
          <path d="M3 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M18.5 7v6M15.5 10h6" {...comum} />
        </>
      ) : null}
      {nome === "comentar" ? <path d="M4 5.5h16v10.5h-9.5l-4.5 3.8V16H4z" {...comum} fill={preencher ?? "none"} /> : null}
      {nome === "link" ? (
        <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1.2 1.2M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1.2-1.2" {...comum} />
      ) : null}
      {nome === "certo" ? <path d="M5 12.5l4.5 4.5L19 7.5" {...comum} /> : null}
      {nome === "errado" ? <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...comum} /> : null}
      {nome === "enviar" ? <path d="M4 12l16-7-6 15-2.6-6.4z M11.4 13.6L20 5" {...comum} fill={preencher ?? "none"} /> : null}
      {nome === "estrela" ? (
        <path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z" {...comum} fill={preencher ?? "none"} />
      ) : null}
      {nome === "bandeira" ? <path d="M6 21V4M6 4.5h11l-2.6 4 2.6 4H6" {...comum} fill={preencher ?? "none"} /> : null}
      {nome === "pessoa" ? (
        <>
          <circle cx="12" cy="8.5" r="4" {...comum} />
          <path d="M4.5 21c.8-4.2 3.8-6.5 7.5-6.5s6.7 2.3 7.5 6.5" {...comum} />
        </>
      ) : null}
      {nome === "seta-baixo" ? <path d="M12 4v15M6 13l6 6 6-6" {...comum} /> : null}
      {nome === "seta-cima" ? <path d="M12 20V5M6 11l6-6 6 6" {...comum} /> : null}
      {nome === "interrogacao" ? (
        <>
          <path d="M8.6 8.6a3.5 3.5 0 1 1 5 3.2c-1 .5-1.6 1.3-1.6 2.4v.6" {...comum} />
          <circle cx="12" cy="18.6" r="0.6" {...comum} />
        </>
      ) : null}
    </svg>
  );
};
