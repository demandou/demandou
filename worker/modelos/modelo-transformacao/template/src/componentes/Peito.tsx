// Quadro cheio: a pessoa inteira e um cartão claro de linho na altura do peito (abaixo do queixo).
// O texto se monta palavra por palavra na fala; o trecho que importa ganha o verde com um grifo
// claro embaixo; o risco é um traço de argila que corre quando a palavra é dita.
import { interpolate } from "remotion";
import { carimbo, formatar, prog, rapido, salto, temposDoTexto, usePalavras } from "../anim";
import { encaixar, trechoNoTexto } from "../medida";
import type { Abertura as TAbertura, Cta as TCta, Destaque as TDestaque, Frase as TFrase, Numero as TNumero, Plano } from "../plano";
import { cor, fonte, sombraCartao } from "../tema";

type P<M> = { m: M; t: number; plano: Plano; y: number; fim: number };

const PAD = 40;

// um cartão centrado em x, com o centro vertical em y
const Cartao: React.FC<{ t: number; de: number; fim: number; y: number; w: number; h: number; wFinal?: number; hFinal?: number; fundo?: string; borda?: string; children: React.ReactNode }> = ({
  t,
  de,
  fim,
  y,
  w,
  h,
  wFinal,
  hFinal,
  fundo = cor.cartaoVidro,
  borda,
  children,
}) => {
  const e = prog(t, de - 0.06, 0.24, rapido);
  const s = prog(t, fim - 0.18, 0.18);
  if (t < de - 0.06 || t >= fim) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - (wFinal ?? w)) / 2,
        top: y - (hFinal ?? h) / 2,
        width: w,
        height: h,
        borderRadius: 30,
        background: fundo,
        boxShadow: sombraCartao,
        borderLeft: borda ? `10px solid ${borda}` : undefined,
        boxSizing: "border-box",
        opacity: e * (1 - s),
        transform: e < 1 || s > 0 ? `translateY(${(1 - e) * 26 - s * 20}px) scale(${0.96 + 0.04 * e})` : undefined,
      }}
    >
      {children}
    </div>
  );
};

// texto que se monta na fala: linhas medidas, palavras no tempo, destaque e risco
export const TextoNaFala: React.FC<{
  t: number;
  texto: string;
  em: number;
  ate: number;
  tamanho: number;
  linhas: string[];
  peso?: 700 | 800;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  corTexto?: string;
  corDestaque?: string;
  alinhar?: "center" | "left";
}> = ({ t, texto, em, ate, tamanho, linhas, peso = 800, destaque, risco, riscoEm, corTexto = cor.tinta, corDestaque = cor.depois, alinhar = "center" }) => {
  const palavras = usePalavras();
  const tempos = temposDoTexto(texto, em, palavras, ate);
  const grifo = trechoNoTexto(texto, destaque);
  const riscado = trechoNoTexto(texto, risco);
  let k = 0;
  return (
    <>
      {linhas.map((l, li) => (
        <div key={li} style={{ fontFamily: fonte, fontWeight: peso, fontSize: tamanho, lineHeight: 1.14, color: corTexto, whiteSpace: "nowrap", textAlign: alinhar }}>
          {l.split(" ").map((w, wi, arr) => {
            const i = k++;
            const em0 = tempos[i] ?? em;
            const a = prog(t, em0 - 0.04, 0.18, rapido);
            const g = grifo && i >= grifo[0] && i <= grifo[1];
            const r = riscado && i >= riscado[0] && i <= riscado[1];
            const pr = r ? prog(t, riscoEm ?? em0 + 0.3, 0.35, rapido) : 0;
            const pg = g ? prog(t, em0 + 0.05, 0.3, rapido) : 0;
            return (
              <span
                key={wi}
                style={{
                  position: "relative",
                  display: "inline-block",
                  opacity: a,
                  transform: a < 1 ? `translateY(${(1 - a) * tamanho * 0.3}px)` : undefined,
                  color: g ? corDestaque : r && pr > 0 ? cor.tintaSuave : undefined,
                }}
              >
                {g ? (
                  <span
                    style={{
                      position: "absolute",
                      left: -tamanho * 0.06,
                      bottom: tamanho * 0.08,
                      height: tamanho * 0.3,
                      width: `calc(${pg * 100}% + ${tamanho * 0.12 * pg}px)`,
                      background: cor.depoisClaro,
                      borderRadius: tamanho * 0.08,
                      zIndex: -1,
                    }}
                  />
                ) : null}
                {w}
                {wi < arr.length - 1 ? " " : ""}
                {r && pr > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "52%",
                      height: Math.max(5, tamanho * 0.09),
                      width: `${pr * 100}%`,
                      background: cor.alerta,
                      borderRadius: 4,
                    }}
                  />
                ) : null}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};

const medir = (texto: string, max: number, min: number, linhas: number, largura = 1080 - 2 * 60 - 2 * PAD) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso: 800 } });

const larguraDe = (enc: { tamanho: number; linhas: string[] }) => {
  // largura real da maior linha (para o cartão abraçar o texto)
  return enc.linhas.reduce((a, l) => Math.max(a, l.length ? larguraLinha(l, enc.tamanho) : 0), 0);
};

import { larguraTexto } from "../medida";
const larguraLinha = (l: string, tam: number) => larguraTexto(l, tam, { peso: 800 });


// o cartão cresce junto com o texto: largura e altura acompanham as palavras já ditas
export const useCrescimento = (t: number, texto: string, em: number, ate: number, enc: { tamanho: number; linhas: string[] }) => {
  const palavras = usePalavras();
  const tempos = temposDoTexto(texto, em, palavras, ate);
  const wMax = enc.linhas.reduce((a, l) => Math.max(a, larguraTexto(l, enc.tamanho, { peso: 800 })), 0);
  let k = 0;
  let direita = 0;
  let altura = 0;
  enc.linhas.forEach((l, li) => {
    const ws = l.split(" ");
    const off = (wMax - larguraTexto(l, enc.tamanho, { peso: 800 })) / 2;
    let fr = 0;
    ws.forEach((_, wi) => {
      const a = prog(t, (tempos[k++] ?? em) - 0.04, 0.2, rapido);
      if (a > 0) {
        const pre = larguraTexto(ws.slice(0, wi + 1).join(" "), enc.tamanho, { peso: 800 });
        const ant = wi ? larguraTexto(ws.slice(0, wi).join(" "), enc.tamanho, { peso: 800 }) : 0;
        direita = Math.max(direita, off + ant + (pre - ant) * a);
      }
      fr = Math.max(fr, a);
    });
    if (fr > 0) altura = li + fr;
  });
  const w = Math.min(960, Math.max(PAD * 2 + 120, direita + PAD * 2));
  const h = Math.max(1, altura) * enc.tamanho * 1.14 + PAD * 1.6;
  return { w, h, wFinal: Math.min(960, wMax + PAD * 2), hFinal: enc.linhas.length * enc.tamanho * 1.14 + PAD * 1.6 };
};

export const Abertura: React.FC<P<TAbertura>> = ({ m, t, y, fim }) => {
  const enc = medir(m.texto, 88, 52, 3);
  const em = m.em ?? m.de;
  const { w, h, wFinal, hFinal } = useCrescimento(t, m.texto, em, m.ate, enc);
  return (
    <Cartao t={t} de={em} fim={fim} y={y} w={w} h={h} wFinal={wFinal} hFinal={hFinal}>
      <div style={{ position: "absolute", left: 0, width: wFinal, top: PAD * 0.8, isolation: "isolate" }}>
        <TextoNaFala t={t} texto={m.texto} em={em} ate={m.ate} tamanho={enc.tamanho} linhas={enc.linhas} destaque={m.destaque} />
      </div>
    </Cartao>
  );
};

export const Frase: React.FC<P<TFrase>> = ({ m, t, y, fim }) => {
  const enc = medir(m.texto, 76, 46, 3);
  const em = m.em ?? m.de;
  const { w, h, wFinal, hFinal } = useCrescimento(t, m.texto, em, m.ate, enc);
  return (
    <Cartao t={t} de={em} fim={fim} y={y} w={w} h={h} wFinal={wFinal} hFinal={hFinal}>
      {/* aspas grandes de revista, no canto */}
      <div style={{ position: "absolute", left: 22, top: -46, fontFamily: fonte, fontWeight: 800, fontSize: 130, color: cor.depois, lineHeight: 1 }}>“</div>
      <div style={{ position: "absolute", left: 0, width: wFinal, top: PAD * 0.8, isolation: "isolate" }}>
        <TextoNaFala t={t} texto={m.texto} em={em} ate={m.ate} tamanho={enc.tamanho} linhas={enc.linhas} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
      </div>
    </Cartao>
  );
};

export const Destaque: React.FC<P<TDestaque>> = ({ m, t, y, fim }) => {
  const alerta = m.nivel === "alerta";
  const enc = medir(m.texto, 100, 56, 2, 840);
  const det = m.detalhe ? encaixar(m.detalhe, { largura: 840, max: 46, min: 32, linhas: 2, fonte: { peso: 500 } }) : null;
  const w = Math.min(960, Math.max(larguraDe(enc), det ? 560 : 0) + PAD * 2 + 10);
  const hT = enc.linhas.length * enc.tamanho * 1.12;
  const hD = det ? det.linhas.length * det.tamanho * 1.25 + 14 : 0;
  const h = hT + hD + PAD * 1.6;
  const c = carimbo(t, m.em);
  return (
    <Cartao t={t} de={m.em} fim={fim} y={y} w={w} h={h} fundo={alerta ? cor.alertaClaro : cor.cartaoVidro} borda={alerta ? cor.alerta : cor.depois}>
      <div style={{ position: "absolute", left: 0, right: 0, top: PAD * 0.8, textAlign: "center", opacity: c.opacity, transform: c.transform }}>
        {enc.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.12, color: alerta ? cor.alerta : cor.depois, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
      {det ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            right: PAD,
            top: PAD * 0.8 + hT + 14,
            textAlign: "center",
            fontFamily: fonte,
            fontWeight: 500,
            fontSize: det.tamanho,
            lineHeight: 1.25,
            color: cor.tinta,
            opacity: prog(t, m.detalheEm ?? m.em + 0.6, 0.25),
          }}
        >
          {det.linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </Cartao>
  );
};

export const Numero: React.FC<P<TNumero>> = ({ m, t, y, fim }) => {
  const casas = m.casas ?? 0;
  const p = prog(t, m.em, 0.9, rapido);
  const valor = formatar(m.valor * p, casas);
  const final = formatar(m.valor, casas);
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  // o número no maior corpo que cabe junto com prefixo e sufixo
  let N = 190;
  const largura = (n: number) => larguraLinha(final, n) + (pre ? larguraLinha(pre, n * 0.5) + 14 : 0) + (suf ? larguraLinha(suf, n * 0.5) + 14 : 0);
  while (N > 90 && largura(N) > 840) N -= 4;
  const rot = encaixar(m.rotulo, { largura: 840, max: 50, min: 34, linhas: 2, fonte: { peso: 700 } });
  const w = Math.min(960, Math.max(largura(N), larguraTexto(rot.linhas[0] ?? "", rot.tamanho, { peso: 700 })) + PAD * 2 + 20);
  const hR = rot.linhas.length * rot.tamanho * 1.2;
  const h = N * 1.0 + hR + PAD * 1.8;
  const pop = salto(prog(t, m.em, 0.3));
  return (
    <Cartao t={t} de={m.em} fim={fim} y={y} w={w} h={h}>
      {m.ilustrativo ? (
        <div style={{ position: "absolute", right: 18, top: 14, fontFamily: fonte, fontWeight: 700, fontSize: 24, color: cor.tintaSuave, letterSpacing: "0.06em" }}>ILUSTRATIVO</div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: PAD * 0.7,
          height: N,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 14,
          fontFamily: fonte,
          fontWeight: 800,
          color: cor.tinta,
          transform: `scale(${0.85 + 0.15 * pop})`,
        }}
      >
        {pre ? <span style={{ fontSize: N * 0.5, color: cor.depois }}>{pre}</span> : null}
        <span style={{ fontSize: N, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{valor}</span>
        {suf ? <span style={{ fontSize: N * 0.5, color: cor.depois }}>{suf}</span> : null}
      </div>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD * 0.7 + N + 14, textAlign: "center", opacity: prog(t, m.rotuloEm ?? m.em + 0.3, 0.25) }}>
        {rot.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.2, color: cor.tintaSuave, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </Cartao>
  );
};

const Icone: React.FC<{ nome: TCta["icone"]; tam: number }> = ({ nome, tam }) => {
  const c = { fill: "none", stroke: cor.cartao, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24">
      {nome === "seguir" ? (
        <>
          <circle cx="9" cy="8" r="4" {...c} />
          <path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5M19 8v6M16 11h6" {...c} />
        </>
      ) : nome === "comentar" ? (
        <path d="M4 5h16v11H9l-5 4z" {...c} />
      ) : nome === "link" ? (
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...c} />
      ) : (
        <path d="M6 3h12v18l-6-4.5L6 21z" {...c} />
      )}
    </svg>
  );
};

export const Cta: React.FC<P<TCta>> = ({ m, t, y, fim }) => {
  const enc = medir(m.texto, 76, 46, 3);
  const em = m.em ?? m.de;
  const { w, h, wFinal, hFinal } = useCrescimento(t, m.texto, em, m.ate, enc);
  const D = 112;
  const pi = prog(t, em + 0.25, 0.35);
  return (
    <>
      <Cartao t={t} de={em} fim={fim} y={y} w={w} h={h} wFinal={wFinal} hFinal={hFinal}>
        <div style={{ position: "absolute", left: 0, width: wFinal, top: PAD * 0.8, isolation: "isolate" }}>
          <TextoNaFala t={t} texto={m.texto} em={em} ate={m.ate} tamanho={enc.tamanho} linhas={enc.linhas} destaque={m.destaque} />
        </div>
      </Cartao>
      {t >= em + 0.25 && t < fim ? (
        <div
          style={{
            position: "absolute",
            left: 540 - D / 2,
            top: y - h / 2 - D * 0.62,
            width: D,
            height: D,
            borderRadius: "50%",
            background: cor.depois,
            boxShadow: `0 0 0 8px ${cor.cartao}, ${sombraCartao}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.min(1, pi * 2) * (1 - prog(t, fim - 0.18, 0.18)),
            transform: `scale(${interpolate(salto(pi), [0, 1], [0.4, 1])})`,
          }}
        >
          <Icone nome={m.icone} tam={D * 0.52} />
        </div>
      ) : null}
    </>
  );
};
