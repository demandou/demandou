import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { LETRA } from "./letra";
import { k, SAIDA } from "./tempo";

/**
 * O TEXTO DA CENA (aula 8.2: "máscaras de revelação, construção por letras,
 * ajuste de espaçamento"; "preserve caracteres, acentos e legibilidade").
 */

/**
 * Construção por letras: cada letra entra com um atraso curto a partir de
 * `inicio` (segundos). Com `mascaraHorizontal`, a letra é revelada por uma
 * máscara da esquerda para a direita; sem ela, sobe e aparece. Acento e
 * caractere preservados: o texto sai como foi passado.
 */
export const Letreiro: React.FC<{
  texto: string;
  t: number;
  inicio: number;
  cor: string;
  /** O tamanho pedido da letra, em px. */
  tamanho: number;
  /**
   * A largura que a palavra pode ocupar, em px (11/10, teste do Recorte: "PRODUTIVIDAD" saiu
   * cortado na borda). O letreiro usa o `tamanho` e só ENCOLHE se não couber: nunca vaza do quadro.
   */
  largura: number;
  familia?: string;
  peso?: number;
  espacamentoEm?: number;
  atraso?: number;
  duracao?: number;
  mascaraHorizontal?: boolean;
}> = ({ texto, t, inicio, cor, tamanho, largura, familia, peso = 900, espacamentoEm = -0.02, atraso = 0.045, duracao = 0.38, mascaraHorizontal = false }) => {
  const cabe = useTamanhoQueCabe(texto, largura, tamanho, { familia, peso, espacamentoEm, minimo: 24 });
  return (
    <span style={{ color: cor, whiteSpace: "nowrap", fontSize: cabe }}>
      {[...texto].map((letra, i) => {
        const p = k(t, inicio + i * atraso, inicio + i * atraso + duracao, SAIDA);
        if (letra === " ") return <span key={i}> </span>;
        return mascaraHorizontal ? (
          <span key={i} style={{ display: "inline-block", clipPath: `inset(-30% ${Math.round((1 - p) * 1000) / 10}% -30% -5%)`, translate: `${(1 - p) * -0.12}em 0px` }}>
            {letra}
          </span>
        ) : (
          <span key={i} style={{ display: "inline-block", opacity: p, translate: `0px ${(1 - p) * 0.42}em` }}>
            {letra}
          </span>
        );
      })}
    </span>
  );
};

let tela: HTMLCanvasElement | null = null;

/** A largura de um texto em px, medida pela própria letra carregada. */
export function medirTexto(texto: string, tamanho: number, opcoes: { familia?: string; peso?: number; espacamentoEm?: number } = {}): number {
  if (!tela) tela = document.createElement("canvas");
  const ctx = tela.getContext("2d");
  const familia = opcoes.familia ?? LETRA.titulo;
  if (!ctx) return texto.length * tamanho * LETRA.larguraDaLetra;
  ctx.font = `${opcoes.peso ?? 800} ${tamanho}px ${familia}`;
  return ctx.measureText(texto).width + Math.max(0, [...texto].length - 1) * (opcoes.espacamentoEm ?? 0) * tamanho;
}

/** Espera as letras carregarem antes de medir (sem isso a medida sai com a fonte de reserva). */
function useLetrasProntas(): boolean {
  const [pronto, setPronto] = useState(() => typeof document !== "undefined" && document.fonts.status === "loaded");
  const [espera] = useState(() => (pronto ? null : delayRender("as letras da marca antes de medir o texto")));
  useEffect(() => {
    if (pronto || espera === null) return;
    let solto = false;
    const soltar = () => {
      if (solto) return;
      solto = true;
      continueRender(espera);
    };
    void document.fonts.ready.then(() => {
      if (solto) return;
      setPronto(true);
      soltar();
    });
    // a cena saiu antes das letras: a espera não pode prender o render
    return soltar;
  }, [pronto, espera]);
  return pronto;
}

/**
 * O MAIOR tamanho (até `maximo`) em que o texto cabe em `largura`, numa linha
 * só. Para título, palavra grande e rótulo: texto cortado na borda reprova a
 * revisão, e o tamanho certo depende da letra da marca.
 */
export function useTamanhoQueCabe(texto: string, largura: number, maximo: number, opcoes: { familia?: string; peso?: number; espacamentoEm?: number; minimo?: number } = {}): number {
  const pronto = useLetrasProntas();
  return useMemo(() => {
    const w = medirTexto(texto, 100, opcoes) / 100;
    const cabe = w > 0 ? largura / w : maximo;
    return Math.max(opcoes.minimo ?? 12, Math.min(maximo, Math.floor(cabe)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, largura, maximo, opcoes.familia, opcoes.peso, opcoes.espacamentoEm, opcoes.minimo, pronto]);
}

/** O ponto de quebra que deixa as duas linhas mais parecidas em tamanho (num espaço). */
export function quebrarEmDuas(texto: string): [string, string] | null {
  const palavras = texto.split(" ").filter(Boolean);
  if (palavras.length < 2) return null;
  let melhor: [string, string] | null = null;
  for (let i = 1; i < palavras.length; i++) {
    const a = palavras.slice(0, i).join(" ");
    const b = palavras.slice(i).join(" ");
    if (!melhor || Math.max(a.length, b.length) < Math.max(melhor[0].length, melhor[1].length)) melhor = [a, b];
  }
  return melhor;
}

/**
 * Um título que sempre cabe na largura dada: numa linha, encolhendo até
 * caber; se numa linha ficaria pequeno demais (menos de 60% do máximo, o
 * título miúdo da prova da maquete de 10/10), em DUAS linhas equilibradas.
 */
export const TituloQueCabe: React.FC<{
  texto: string;
  largura: number;
  maximo: number;
  cor: string;
  peso?: number;
  alinhar?: "left" | "center" | "right";
  espacamentoEm?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ texto, largura, maximo, cor, peso = 800, alinhar = "left", espacamentoEm = -0.01, style, children }) => {
  const opcoes = { peso, espacamentoEm };
  const umaLinha = useTamanhoQueCabe(texto, largura * 0.98, maximo, opcoes);
  const duas = quebrarEmDuas(texto);
  const a = useTamanhoQueCabe(duas?.[0] ?? texto, largura * 0.98, maximo, opcoes);
  const b = useTamanhoQueCabe(duas?.[1] ?? texto, largura * 0.98, maximo, opcoes);
  const emDuas = !children && duas !== null && umaLinha < maximo * 0.6 && Math.min(a, b) > umaLinha * 1.15;
  const tamanho = emDuas ? Math.min(a, b) : umaLinha;
  return (
    <div style={{ width: largura, textAlign: alinhar, fontFamily: LETRA.titulo, fontWeight: peso, fontSize: tamanho, lineHeight: emDuas ? 1.02 : 1, letterSpacing: `${espacamentoEm}em`, color: cor, whiteSpace: "nowrap", ...style }}>
      {emDuas && duas ? (
        <>
          {duas[0]}
          <br />
          {duas[1]}
        </>
      ) : (
        (children ?? texto)
      )}
    </div>
  );
};
