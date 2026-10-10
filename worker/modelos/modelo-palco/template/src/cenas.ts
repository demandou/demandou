// As cenas do palco: os blocos de palco seguidos (menos de 0,6 s entre um e outro) formam uma
// cena só. A pessoa encolhe para a janela no começo da cena, troca de canto entre páginas quando
// preciso, e volta ao quadro cheio no fim dela.
import { ehDePalco, type Canto, type MomentoDePalco, type Plano } from "./plano";

export type Pagina = { m: MomentoDePalco; canto: Canto };
export type Cena = { de: number; ate: number; paginas: Pagina[] };

// quanto antes de `de` a pessoa começa a encolher e quanto depois de `ate` ela termina de voltar
export const ANTES = 0.2;
export const DUR_TROCA = 0.5;
export const JUNTA = 0.6;

const guardadas = new WeakMap<object, Cena[]>();

// `cantoAuto` decide o canto de uma página sem `canto` (o Palco.tsx sabe onde caem as anotações);
// sem preferência, a página fica no canto da anterior.
export const cenasDoPlano = (plano: Plano, cantoAuto?: (m: MomentoDePalco) => Canto | null): Cena[] => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const doPalco = plano.momentos.filter(ehDePalco).sort((a, b) => a.de - b.de);
  const cenas: Cena[] = [];
  for (const m of doPalco) {
    const ultima = cenas[cenas.length - 1];
    const anterior = ultima?.paginas[ultima.paginas.length - 1];
    const canto = m.canto ?? cantoAuto?.(m) ?? anterior?.canto ?? "esq";
    if (ultima && m.de - ultima.ate < JUNTA) {
      ultima.paginas.push({ m, canto });
      ultima.ate = Math.max(ultima.ate, m.ate);
    } else cenas.push({ de: m.de, ate: m.ate, paginas: [{ m, canto }] });
  }
  if (cantoAuto) guardadas.set(plano, cenas);
  return cenas;
};
