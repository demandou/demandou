// A câmera da Tela Viva: o rosto é um take único. Só reenquadra nos cortes (e nunca anima o
// zoom): alterna entre 1,00 e ~1,06, nunca o mesmo duas vezes seguidas, e o topo da cabeça fica
// na mesma linha (tema.ts → caixaDaPessoa). Um item de `plano.camera` num corte escolhe o zoom.
import { medidas } from "./tema";
import type { Plano } from "./plano";

export type Trecho = { de: number; ate: number; zoom: number };

const guardados = new WeakMap<object, Trecho[]>();

export const trechosDaCamera = (plano: Plano): Trecho[] => {
  const salvo = guardados.get(plano);
  if (salvo) return salvo;
  const { zooms } = medidas(plano);
  const dur = plano.duracao;
  const pontos = [0, ...(plano.cortesEm ?? []), ...(plano.camera ?? []).map((c) => c.em)]
    .filter((t) => t >= 0 && t < dur - 0.2)
    .sort((a, b) => a - b)
    .filter((t, i, l) => i === 0 || t - l[i - 1] > 0.25);
  const trechos: Trecho[] = [];
  pontos.forEach((de, i) => {
    const ate = pontos[i + 1] ?? dur;
    const pedido = (plano.camera ?? []).find((c) => Math.abs(c.em - de) <= 0.25)?.zoom;
    const anterior = trechos[trechos.length - 1]?.zoom;
    const zoom = pedido ? Math.min(zooms[zooms.length - 1], Math.max(1, pedido)) : i === 0 ? zooms[0] : anterior === zooms[0] ? zooms[1] : zooms[0];
    trechos.push({ de, ate, zoom });
  });
  guardados.set(plano, trechos);
  return trechos;
};

export const zoomNoTempo = (plano: Plano, t: number) => {
  const trechos = trechosDaCamera(plano);
  return (trechos.find((x) => t >= x.de && t < x.ate) ?? trechos[trechos.length - 1])?.zoom ?? 1;
};
