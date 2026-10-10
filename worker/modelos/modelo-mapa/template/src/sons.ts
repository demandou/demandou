// Som raro e tonal: um "vum" grave quando a câmera desliza para a próxima estação, uma nota curta
// quando um ramo nasce ou um título ganha marca-texto, uma descida quando o mapa é esquecido, notas
// subindo nas revisões da curva (cada uma mais aguda), um toque quando o contador para, um toque
// surdo quando o alfinete crava, uma nota quando um cartão vira e um acorde curto no fim.
// Nunca dois sons a menos de 0,45 s: quando colidem, fica o mais importante.
import { indicesDoTrecho, temposDoTexto } from "./anim";
import type { Estacao } from "./layout";
import type { Plano } from "./plano";

export type Som = { em: number; arquivo: string; volume: number };
type Candidato = Som & { prioridade: number };

export const sons = (plano: Plano, estacoes: Estacao[]): Som[] => {
  const lista: Candidato[] = [];
  let nota = 0;
  const ramo = () => `sfx/ramo-${(nota++ % 3) + 1}.wav`;
  for (const e of estacoes.slice(1)) lista.push({ em: e.chega + 0.04, arquivo: "sfx/passa.wav", volume: 0.34, prioridade: 2 });
  for (const m of plano.momentos) {
    if (m.tipo === "mapa") {
      m.ramos.forEach((r) => lista.push({ em: r.em + 0.05, arquivo: ramo(), volume: 0.26, prioridade: 1 }));
      if (m.esqueceEm !== undefined) lista.push({ em: m.esqueceEm + 0.02, arquivo: "sfx/esquece.wav", volume: 0.36, prioridade: 3 });
      if (m.fixaEm !== undefined) lista.push({ em: m.fixaEm + 0.02, arquivo: "sfx/sobe-3.wav", volume: 0.3, prioridade: 3 });
    }
    if (m.tipo === "titulo" && m.destaque) {
      const tempos = temposDoTexto(m.texto, plano.palavras, m.de, m.ate);
      const primeiro = Math.min(...[...indicesDoTrecho(m.texto, m.destaque)].map((i) => tempos[i]));
      if (Number.isFinite(primeiro)) lista.push({ em: primeiro + 0.14, arquivo: ramo(), volume: 0.24, prioridade: 1 });
    }
    if (m.tipo === "curva") m.revisoes.forEach((r, i) => lista.push({ em: r.em + 0.02, arquivo: `sfx/sobe-${Math.min(3, i + 1)}.wav`, volume: 0.34, prioridade: 3 }));
    if (m.tipo === "contador") lista.push({ em: m.em + 0.82, arquivo: "sfx/conta.wav", volume: 0.36, prioridade: 3 });
    if (m.tipo === "barras" && m.fixaEm !== undefined) lista.push({ em: m.fixaEm + 0.2, arquivo: "sfx/crava.wav", volume: 0.42, prioridade: 3 });
    if (m.tipo === "cartoes") m.cartoes.forEach((c) => lista.push({ em: c.em + 0.18, arquivo: "sfx/vira.wav", volume: 0.3, prioridade: 2 }));
    if (m.tipo === "cta") lista.push({ em: Math.max(m.de + 0.4, plano.duracao - 0.9), arquivo: "sfx/fim.wav", volume: 0.36, prioridade: 3 });
    // blocos universais: a mesma paleta de sons (notas curtas nos itens, toque no número, alfinete…)
    if (m.tipo === "abertura" && m.destaque) {
      const tempos = temposDoTexto(m.texto, plano.palavras, m.de, m.ate, m.em ?? m.de);
      const primeiro = Math.min(...[...indicesDoTrecho(m.texto, m.destaque)].map((i) => tempos[i]));
      if (Number.isFinite(primeiro)) lista.push({ em: primeiro + 0.14, arquivo: ramo(), volume: 0.24, prioridade: 1 });
    }
    if (m.tipo === "topicos") m.itens.forEach((it) => lista.push({ em: it.em + 0.05, arquivo: ramo(), volume: 0.26, prioridade: 1 }));
    if (m.tipo === "passos") m.itens.forEach((it, i) => lista.push({ em: it.em + 0.02, arquivo: `sfx/sobe-${(i % 3) + 1}.wav`, volume: 0.3, prioridade: 2 }));
    if (m.tipo === "numero") lista.push({ em: m.em + 0.9, arquivo: "sfx/conta.wav", volume: 0.36, prioridade: 3 });
    if (m.tipo === "comparacao") {
      m.lados.forEach((l) => lista.push({ em: l.em + 0.05, arquivo: ramo(), volume: 0.26, prioridade: 1 }));
      const vencedor = m.vencedor ?? (m.modo === "errado-certo" ? 1 : undefined);
      if (vencedor !== undefined) lista.push({ em: (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.45) + 0.05, arquivo: "sfx/sobe-2.wav", volume: 0.3, prioridade: 3 });
    }
    if (m.tipo === "grafico") {
      if (m.dados?.length) m.dados.forEach((d) => lista.push({ em: d.em + 0.05, arquivo: ramo(), volume: 0.26, prioridade: 1 }));
      else lista.push({ em: (m.tendenciaEm ?? m.de + 0.3) + 1.5, arquivo: m.tendencia === "cai" ? "sfx/esquece.wav" : "sfx/sobe-3.wav", volume: 0.3, prioridade: 2 });
    }
    if (m.tipo === "destaque") lista.push({ em: m.em + 0.1, arquivo: m.nivel === "alerta" ? "sfx/esquece.wav" : "sfx/crava.wav", volume: 0.36, prioridade: 3 });
    if (m.tipo === "definicao") {
      lista.push({ em: m.em + 0.05, arquivo: ramo(), volume: 0.26, prioridade: 1 });
      lista.push({ em: m.significadoEm + 0.2, arquivo: "sfx/crava.wav", volume: 0.42, prioridade: 3 });
    }
    if (m.tipo === "frase" && m.risco) {
      const tempos = temposDoTexto(m.texto, plano.palavras, m.de, m.ate, m.em ?? m.de);
      const ultimo = Math.max(...[...indicesDoTrecho(m.texto, m.risco)].map((i) => tempos[i]));
      const em = m.riscoEm ?? (Number.isFinite(ultimo) ? ultimo + 0.3 : undefined);
      if (em !== undefined) lista.push({ em, arquivo: "sfx/esquece.wav", volume: 0.3, prioridade: 2 });
    }
    if (m.tipo === "pergunta") (m.opcoes ?? []).forEach((o) => lista.push({ em: o.em + 0.08, arquivo: ramo(), volume: 0.26, prioridade: 1 }));
  }
  const aceitos: Candidato[] = [];
  for (const s of [...lista].sort((a, b) => b.prioridade - a.prioridade || a.em - b.em)) {
    if (s.em < 0 || s.em > plano.duracao) continue;
    if (aceitos.every((o) => Math.abs(o.em - s.em) > 0.45)) aceitos.push(s);
  }
  return aceitos.sort((a, b) => a.em - b.em).map(({ em, arquivo, volume }) => ({ em, arquivo, volume }));
};
