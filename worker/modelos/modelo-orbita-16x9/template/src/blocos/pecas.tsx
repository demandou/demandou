// Peças comuns dos blocos universais da Órbita: texto que entra palavra por palavra na fala (com o
// trecho de destaque no laranja do Sol e o trecho riscado por uma linha de luz), o rótulo em caixa
// alta espaçada (como o "TEMPO DA LUZ" do relógio), a etiqueta "ilustrativo" e os corpos padrão.
import React from "react";
import * as THREE from "three";
import type { Corpo, Plano } from "../plano";
import { COR, EASE_OUT, MONO, SORA, prog } from "../tema";
import { encaixar, larguraTexto } from "../medida";
import { daTela, raioDaTela, type Estacao } from "../espaco/camera";
import type { CorpoNaCena } from "../espaco/Corpos";

const nucleo = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

// o instante em que cada palavra do texto é dita (casando com as palavras do plano a partir de `em`)
export const temposDoTexto = (plano: Plano, texto: string, em: number, ate: number) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const falados = plano.palavras.filter((p) => p.em >= em - 0.3 && p.em <= ate + 0.2);
  let j = 0;
  let ult = em - 0.16;
  return ws.map((w, i) => {
    const n = nucleo(w);
    let achou = -1;
    for (let k = j; k < Math.min(falados.length, j + 6); k++)
      if (n && nucleo(falados[k].w) === n) {
        achou = k;
        break;
      }
    if (achou >= 0) {
      ult = Math.max(ult + 0.04, falados[achou].em);
      j = achou + 1;
    } else ult = i === 0 ? em : ult + 0.16;
    return Math.min(ult, Math.max(em, ate - 0.4));
  });
};

// índices (no texto) das palavras de um trecho
const trechoEm = (texto: string, trecho?: string) => {
  if (!trecho) return new Set<number>();
  const ws = texto.split(/\s+/).filter(Boolean).map(nucleo);
  const alvo = trecho.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + alvo.length <= ws.length; i++) if (alvo.every((a, k) => ws[i + k] === a)) return new Set(alvo.map((_, k) => i + k));
  return new Set<number>();
};

export const TextoNaFala: React.FC<{
  plano: Plano;
  texto: string;
  em: number;
  ate: number;
  t: number;
  largura: number;
  max: number;
  min: number;
  linhas?: number;
  peso?: 600 | 700 | 800;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  cor?: string;
  alinhar?: "center" | "left";
  altura?: number;
}> = ({ plano, texto, em, ate, t, largura, max, min, linhas = 3, peso = 800, destaque, risco, riscoEm, cor = COR.branco, alinhar = "center", altura = 1.08 }) => {
  const { tamanho, linhas: ls } = encaixar(texto, largura, max, min, linhas, peso);
  const tempos = temposDoTexto(plano, texto, em, ate);
  const dest = trechoEm(texto, destaque);
  const risc = trechoEm(texto, risco);
  const rq = risco && riscoEm !== undefined ? prog(t, riscoEm - 0.05, riscoEm + 0.4, EASE_OUT) : 0;
  let k = 0;
  return (
    <div style={{ textAlign: alinhar, fontFamily: SORA, fontWeight: peso, fontSize: tamanho, lineHeight: altura, letterSpacing: "-0.02em", color: cor, textShadow: "0 4px 26px rgba(0,0,0,0.55)" }}>
      {ls.map((l, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {l.split(" ").map((w, wi) => {
            const i = k++;
            const q = prog(t, tempos[i] - 0.06, tempos[i] + 0.3, EASE_OUT);
            const riscada = risc.has(i);
            const c = dest.has(i) ? COR.sol : riscada && rq > 0 ? `rgba(255,248,242,${1 - 0.5 * rq})` : undefined;
            const pronto = q >= 0.999;
            return (
              <React.Fragment key={wi}>
                {wi > 0 ? " " : null}
                <span
                  style={{
                    display: "inline-block",
                    position: "relative",
                    color: c,
                    opacity: pronto ? 1 : q,
                    transform: pronto ? undefined : `translateY(${(1 - q) * 0.35}em)`,
                    filter: pronto ? undefined : `blur(${(1 - q) * 8}px)`,
                  }}
                >
                  {w}
                  {riscada && rq > 0 ? (
                    <span style={{ position: "absolute", left: "-0.05em", top: "52%", height: Math.max(4, tamanho * 0.07), width: `calc(${rq * 100}% + 0.1em)`, background: COR.sol, borderRadius: 3, boxShadow: `0 0 14px ${COR.sol}` }} />
                  ) : null}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// rótulo em caixa alta espaçada (como "TEMPO DA LUZ")
export const Rotulo: React.FC<{ texto: string; cor?: string; tamanho?: number; style?: React.CSSProperties }> = ({ texto, cor = COR.mudo, tamanho = 30, style }) => (
  <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: tamanho, letterSpacing: "0.14em", textTransform: "uppercase", color: cor, whiteSpace: "nowrap", ...style }}>{texto}</div>
);

export const Ilustrativo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 999, border: `1.5px solid ${COR.fraco}`, fontFamily: SORA, fontWeight: 500, fontSize: 26, color: COR.mudo, letterSpacing: "0.04em", ...style }}>ilustrativo</div>
);

// número em mono com prefixo e sufixo em Sora
export const NumeroMono: React.FC<{ numero: string; prefixo?: string; sufixo?: string; tamanho: number; cor?: string }> = ({ numero, prefixo, sufixo, tamanho, cor = COR.branco }) => (
  <span style={{ whiteSpace: "nowrap", color: cor }}>
    {prefixo ? <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: tamanho * 0.42, marginRight: tamanho * 0.08, letterSpacing: 0 }}>{prefixo}</span> : null}
    <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: tamanho, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{numero}</span>
    {sufixo ? <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: tamanho * 0.36, marginLeft: tamanho * 0.1, letterSpacing: 0 }}>{sufixo}</span> : null}
  </span>
);
export const larguraNumero = (numero: string, tamanho: number, prefixo?: string, sufixo?: string) =>
  larguraTexto(numero, tamanho, 500, true, -0.02) + (prefixo ? larguraTexto(prefixo, tamanho * 0.42, 600) + tamanho * 0.08 : 0) + (sufixo ? larguraTexto(sufixo, tamanho * 0.36, 600) + tamanho * 0.1 : 0);

// os corpos padrão dos itens (planetas em tons da paleta) quando o plano não escolhe
export const CORPOS_PADRAO: { corpo: Corpo; cor: string; anel?: boolean }[] = [
  { corpo: "rochoso", cor: "#E2A27E" },
  { corpo: "planeta", cor: "#CDB38C", anel: true },
  { corpo: "planeta", cor: "#8FB0D6" },
  { corpo: "rochoso", cor: "#C9C1B6" },
  { corpo: "planeta", cor: "#D98E6A" },
];

// um corpo da estação posto por coordenadas de tela (px) no início do momento
export const corpoNaTela = (
  e: Estacao,
  id: string,
  corpo: Corpo,
  x: number,
  y: number,
  raioPx: number,
  estado: CorpoNaCena["estado"],
  extra: Partial<CorpoNaCena> = {},
  z = 0,
): CorpoNaCena => ({ id: `${id}@${e.de}`, corpo, pos: daTela(x, y, z).add(e.base), r: raioDaTela(raioPx, z), estado, ...extra });

// a luz de um Sol fora do quadro, à esquerda (planetas iluminados de lado)
export const luzDaEsquerda = (e: Estacao) => new THREE.Vector3(-40, 6, 10).add(e.base);
export const luzDeCima = (e: Estacao) => new THREE.Vector3(-12, 30, 30).add(e.base);
