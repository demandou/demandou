// Medida de texto da letra manuscrita (Mali), para montar uma linha que mistura palavras
// escritas com a fonte e algarismos desenhados a traço. Só mede depois que a fonte carregou.
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { esperarFontes, mao, sans } from "../tema";

let prontas = false;
let contexto: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

const ctx = () => {
  if (!contexto) contexto = document.createElement("canvas").getContext("2d");
  return contexto as CanvasRenderingContext2D;
};

export const PESO_MAO = 600;

export const larguraMao = (texto: string, px: number) => {
  const chave = `${px}|${texto}`;
  const guardada = cache.get(chave);
  if (guardada !== undefined) return guardada;
  const c = ctx();
  c.font = `${PESO_MAO} ${px}px "${mao}"`;
  const w = c.measureText(texto).width;
  if (prontas) cache.set(chave, w);
  return w;
};

// largura de um texto na sans (legenda), para caber numa linha só
export const larguraSans = (texto: string, px: number, peso = 500) => {
  const chave = `sans|${peso}|${px}|${texto}`;
  const guardada = cache.get(chave);
  if (guardada !== undefined) return guardada;
  const c = ctx();
  c.font = `${peso} ${px}px "${sans}"`;
  const w = c.measureText(texto).width;
  if (prontas) cache.set(chave, w);
  return w;
};

// altura da maiúscula da Mali em fração do corpo (para casar com a altura dos algarismos)
let razaoMaiuscula = 0.7;
export const corpoParaAltura = (alturaMaiuscula: number) => alturaMaiuscula / razaoMaiuscula;

// Segura o render até as fontes carregarem; depois disso as medidas ficam certas.
export const useFontesProntas = () => {
  const [pronto, setPronto] = useState(prontas);
  const [espera] = useState(() => (prontas ? null : delayRender("fontes da lousa")));
  useEffect(() => {
    if (prontas) return;
    esperarFontes().then(() => {
      const c = ctx();
      c.font = `${PESO_MAO} 200px "${mao}"`;
      const m = c.measureText("H");
      if (m.actualBoundingBoxAscent > 0) razaoMaiuscula = m.actualBoundingBoxAscent / 200;
      prontas = true;
      cache.clear();
      setPronto(true);
    });
  }, []);
  useEffect(() => {
    if (pronto && espera !== null) continueRender(espera);
  }, [pronto, espera]);
  return pronto;
};
