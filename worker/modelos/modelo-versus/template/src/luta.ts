// A luta: um `versus` e as `rodada`/`veredito` que vêm depois dele formam um duelo.
// Aqui fica a conta do estado do duelo em cada instante (placar, barras, rodada da vez).
import { prog, suave } from "./anim";
import type { Lutador, Momento, Plano, Rodada, Veredito, Versus } from "./plano";
import { ordenar } from "./layout";

export type Duelo = {
  versus: Versus;
  rodadas: Rodada[];
  veredito?: Veredito;
  membros: (Versus | Rodada | Veredito)[];
  de: number;
  ate: number;
};

const LADOS_PADRAO: [Lutador, Lutador] = [
  { nome: "A", em: 0 },
  { nome: "B", em: 0 },
];

export const duelosDo = (plano: Plano): Duelo[] => {
  const lista: Duelo[] = [];
  for (const m of ordenar(plano) as Momento[]) {
    if (m.tipo === "versus") lista.push({ versus: m, rodadas: [], membros: [m], de: m.de, ate: m.ate });
    else if (m.tipo === "rodada" || m.tipo === "veredito") {
      let d = lista[lista.length - 1];
      // rodada sem versus antes: um duelo "A × B" começa nela (o SKILL.md pede sempre o versus antes)
      if (!d || d.veredito) {
        d = { versus: { tipo: "versus", de: m.de, ate: m.de, lados: LADOS_PADRAO }, rodadas: [], membros: [], de: m.de, ate: m.ate };
        lista.push(d);
      }
      if (m.tipo === "rodada") d.rodadas.push(m);
      else d.veredito = m;
      d.membros.push(m);
      d.ate = Math.max(d.ate, m.ate);
    }
  }
  return lista;
};

export const quandoVence = (r: Rodada) => r.vencedorEm ?? Math.max(r.em, r.a?.em ?? 0, r.b?.em ?? 0, r.imagemEm ?? 0) + 0.8;

// placar no instante t
export const placarEm = (d: Duelo, t: number): [number, number] => {
  const p: [number, number] = [0, 0];
  for (const r of d.rodadas) if ((r.vencedor === 0 || r.vencedor === 1) && t >= quandoVence(r)) p[r.vencedor]++;
  return p;
};

// a rodada da vez (a última que já começou)
export const rodadaEm = (d: Duelo, t: number): Rodada | null => {
  let r: Rodada | null = null;
  for (const x of d.rodadas) if (x.de <= t + 1e-4) r = x;
  return r;
};

export const numeroDa = (d: Duelo, r: Rodada) => r.numero ?? d.rodadas.indexOf(r) + 1;

const forcaPadrao = (r: Rodada, lado: 0 | 1) => (r.vencedor === lado ? 0.92 : r.vencedor === "empate" || r.vencedor === undefined ? 0.66 : 0.38);

// quanto cada barra está cheia (0–1): enche no `em` do lado; um lado sem fala fica vazio;
// na rodada seguinte, as barras esvaziam e recomeçam.
export const barrasEm = (d: Duelo, t: number): [number, number] => {
  const r = rodadaEm(d, t);
  const valor = (rod: Rodada, lado: 0 | 1, tt: number) => {
    const l = lado === 0 ? rod.a : rod.b;
    if (!l) return 0;
    return (l.forca ?? forcaPadrao(rod, lado)) * prog(tt, l.em, 0.5);
  };
  if (!r) return [0, 0];
  const i = d.rodadas.indexOf(r);
  const anterior = d.rodadas[i - 1];
  // as barras da rodada anterior esvaziam nos primeiros 0,3 s da nova
  const esvazia = 1 - prog(t, r.de, 0.3, suave);
  return [0, 1].map((k) => {
    const lado = k as 0 | 1;
    const agora = valor(r, lado, t);
    const antes = anterior ? valor(anterior, lado, t) * esvazia : 0;
    return Math.max(agora, antes);
  }) as [number, number];
};
