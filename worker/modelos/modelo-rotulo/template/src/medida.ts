// Mede a largura de um texto com a fonte de verdade, para a lupa parar em cima de um trecho de uma
// linha do rótulo e para os textos da ficha caberem. Mede no próprio documento (um <span> invisível),
// porque é assim que o texto é desenhado; o canvas não enxerga as fontes carregadas pelo Remotion.
import { useCallback, useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { display, texto } from "./tema";

export type Fonte = { familia: string; tamanho: number; italico?: boolean; espaco?: number; caixaAlta?: boolean };

let sonda: HTMLSpanElement | null = null;
const span = () => {
  if (!sonda) {
    sonda = document.createElement("span");
    Object.assign(sonda.style, { position: "absolute", left: "-10000px", top: "0", visibility: "hidden", whiteSpace: "pre", lineHeight: "1" });
    document.body.appendChild(sonda);
  }
  return sonda;
};

const medirNoDocumento = (t: string, f: Fonte, familiaCss?: string) => {
  const s = span();
  s.style.fontFamily = familiaCss ?? `"${f.familia}"`;
  s.style.fontSize = `${f.tamanho}px`;
  s.style.fontStyle = f.italico ? "italic" : "normal";
  s.style.fontWeight = "400";
  s.style.letterSpacing = `${f.espaco ?? 0}em`;
  s.style.textTransform = f.caixaAlta ? "uppercase" : "none";
  s.textContent = t;
  return s.getBoundingClientRect().width;
};

// a fonte já está valendo quando a medida dela deixa de ser igual à da fonte reserva
const fonteValendo = (familia: string, italico = false) => {
  const amostra = "Cabernet Sauvignon · Il1 2021";
  const f = { familia, tamanho: 40, italico };
  return Math.abs(medirNoDocumento(amostra, f) - medirNoDocumento(amostra, f, "serif")) > 0.5;
};

const cache = new Map<string, number>();
let fontesProntas = false;

// Segura o quadro até as fontes estarem valendo; devolve a função de medir.
export const useMedidor = () => {
  const [pronto, setPronto] = useState(fontesProntas);
  const [espera] = useState(() => (fontesProntas ? null : delayRender("Rótulo: esperando as fontes para medir o texto")));
  useEffect(() => {
    if (!espera) return;
    let vivo = true;
    let liberado = false;
    const liberar = () => {
      if (liberado) return;
      liberado = true;
      continueRender(espera);
    };
    const inicio = Date.now();
    const conferir = () => {
      if (!vivo) return;
      const ok = fonteValendo(texto) && fonteValendo(texto, true) && fonteValendo(display);
      if (ok || Date.now() - inicio > 8000) {
        fontesProntas = ok;
        setPronto(true);
        liberar();
      } else setTimeout(conferir, 50);
    };
    document.fonts.ready.then(conferir);
    return () => {
      vivo = false;
      liberar();
    };
  }, [espera]);
  return useCallback(
    (t: string, f: Fonte) => {
      const chave = `${f.familia}|${f.tamanho}|${f.italico ? 1 : 0}|${f.espaco ?? 0}|${f.caixaAlta ? 1 : 0}|${t}`;
      const guardada = cache.get(chave);
      if (guardada !== undefined) return guardada;
      const w = medirNoDocumento(t, f);
      if (fontesProntas) cache.set(chave, w);
      return w;
    },
    [pronto], // eslint-disable-line react-hooks/exhaustive-deps
  );
};
export type Medidor = ReturnType<typeof useMedidor>;
