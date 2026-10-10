// O estado do relógio no tempo: quanto o aro aparece, como o anel está dividido (as cinco zonas, ou
// uma parte por item, ou as fatias de um gráfico), o que já acendeu, o que está em foco e onde está o
// ponteiro. Sai do momento que está no relógio agora.
import { limitar, mistura, prog, saida, trava } from "./anim";
import type { Lugar, Trecho } from "./layout";
import { ANTES, ehRelogio, TROCA } from "./layout";
import type { Grafico, Momento, Zona, Zonas } from "./plano";
import { cor, ZONAS, zonaCor } from "./tema";

// Uma parte do anel: de `a` a `b` (frações dos 270° do anel), a cor quando acesa, quanto acendeu
// (0 = a lápis, 1 = acesa), quanto está em foco e quanto apagou (as outras, quando uma está em foco).
export type Segmento = { a: number; b: number; cor: string; acesa: number; foco: number; apaga: number; numeral?: string };

export type EstadoDoRelogio = {
  // 0 = sem relógio, 1 = relógio inteiro
  visivel: number;
  segmentos: Segmento[];
  // ponteiro: posição no anel (0 = começo, 1 = fim) e se aparece
  ponteiro: number;
  ponteiroVisivel: number;
  // cor do coração (null = branco) e quanto ela entrou
  coracao: { cor: string; p: number } | null;
  // batida do coração (0–1, pico no batimento)
  batida: number;
};

const PASSO_PADRAO = 0.28;

export const temposDasZonas = (m: Zonas) => {
  const inicio = m.acendeEm ?? m.de + 0.45;
  const passo = m.passo ?? PASSO_PADRAO;
  return [0, 1, 2, 3, 4].map((i) => inicio + i * passo);
};

// onde o ponteiro para depois do `zonas` (dentro da zona 5), em unidades de zona (0–5)
const PONTEIRO_TOPO = 4.55;

const cinco = (acesas: number[], foco: { zona: number; p: number } | null): Segmento[] =>
  ZONAS.map((z, i) => ({
    a: i / 5,
    b: (i + 1) / 5,
    cor: z.cor,
    acesa: acesas[i],
    foco: foco && foco.zona === i + 1 ? foco.p : 0,
    apaga: foco && foco.zona !== i + 1 ? foco.p : 0,
    numeral: String(i + 1),
  }));

const iguais = (n: number, corDe: (i: number) => string, acesa: (i: number) => number, focoEm: number | null, numerais = true): Segmento[] =>
  Array.from({ length: n }, (_, i) => ({
    a: i / n,
    b: (i + 1) / n,
    cor: corDe(i),
    acesa: acesa(i),
    foco: focoEm === i ? 1 : 0,
    apaga: 0,
    numeral: numerais ? String(i + 1) : undefined,
  }));

// cores das fatias de um gráfico (as zonas, da marca para o alerta)
export const CORES_FATIAS = [ZONAS[1].cor, ZONAS[2].cor, ZONAS[3].cor, ZONAS[4].cor, ZONAS[0].cor, "#141619"];

// as zonas e o foco (o par de tipos do demo): lembram o último `zonas` para o ponteiro descer dele
const estadoDasZonas = (t: number, ordem: Momento[], momento: Zonas | Zona) => {
  const ate = (m: Momento) => m.de - ANTES <= t && m.de <= momento.de;
  const zonas = momento.tipo === "zonas" ? momento : [...ordem].reverse().find((m): m is Zonas => m.tipo === "zonas" && ate(m));
  const zona = momento.tipo === "zona" ? momento : undefined;
  // a zona em foco só vale se ela é mais recente que o último `zonas`
  const zonaValida = zona && (!zonas || zona.de > zonas.de) ? zona : undefined;
  let acesas = [0, 0, 0, 0, 0];
  let ponteiro = 0;
  let ponteiroVisivel = 0;
  if (zonas) {
    const tempos = temposDasZonas(zonas);
    acesas = tempos.map((tz) => prog(t, tz, 0.3));
    ponteiro = tempos.reduce((s, tz) => s + prog(t, tz - 0.05, (zonas.passo ?? PASSO_PADRAO) + 0.1, (x) => x), 0) * (PONTEIRO_TOPO / 5);
    ponteiroVisivel = prog(t, tempos[0], 0.25);
  }
  let foco: { zona: number; p: number } | null = null;
  if (zonaValida) {
    const z = Math.min(5, Math.max(1, Math.round(zonaValida.zona)));
    if (!zonas) acesas = acesas.map((_, i) => prog(t, zonaValida.de + 0.25 + i * 0.08, 0.3));
    foco = { zona: z, p: prog(t, zonaValida.em, 0.4) };
    const partida = zonas ? PONTEIRO_TOPO : 0;
    const desce = prog(t, zonaValida.em, 0.75, trava);
    const oscila = Math.sin(((t - zonaValida.em - 0.75) / 1.25) * Math.PI * 2) * 0.2 * prog(t, zonaValida.em + 0.6, 0.5);
    ponteiro = mistura(partida, z - 0.5, desce) + oscila;
    ponteiroVisivel = zonas ? 1 : prog(t, zonaValida.de + 0.3, 0.25);
  }
  return {
    segmentos: cinco(acesas, foco),
    ponteiro: limitar(ponteiro, 0, 5) / 5,
    ponteiroVisivel,
    coracao: foco ? { cor: ZONAS[foco.zona - 1].cor, p: foco.p } : null,
  };
};

// a definição é uma zona em foco sem `zonas` antes
const estadoDaDefinicao = (t: number, de: number, em: number, zona: number) => {
  const z = Math.min(5, Math.max(1, Math.round(zona)));
  const acesas = [0, 1, 2, 3, 4].map((i) => prog(t, de + 0.2 + i * 0.08, 0.3));
  const foco = { zona: z, p: prog(t, em, 0.4) };
  const desce = prog(t, em, 0.75, trava);
  const oscila = Math.sin(((t - em - 0.75) / 1.25) * Math.PI * 2) * 0.2 * prog(t, em + 0.6, 0.5);
  return {
    segmentos: cinco(acesas, foco),
    ponteiro: limitar(mistura(0, z - 0.5, desce) + oscila, 0, 5) / 5,
    ponteiroVisivel: prog(t, de + 0.3, 0.25),
    coracao: { cor: ZONAS[z - 1].cor, p: foco.p },
  };
};

// a parte acesa mais recente (para o ponteiro e o foco)
const ultimaAcesa = (tempos: number[], t: number) => {
  let k = -1;
  tempos.forEach((tm, i) => {
    if (t >= tm - 0.02) k = i;
  });
  return k;
};

const estadoDoMomento = (t: number, ordem: Momento[], m: Momento) => {
  switch (m.tipo) {
    case "zonas":
    case "zona":
      return estadoDasZonas(t, ordem, m);
    case "definicao":
      return estadoDaDefinicao(t, m.de, m.em, m.zona ?? 2);
    case "topicos":
    case "pergunta": {
      const itens = m.tipo === "topicos" ? m.itens : m.opcoes?.length ? m.opcoes : [{ texto: m.texto, em: m.em ?? m.de }];
      const n = Math.max(1, Math.min(5, itens.length));
      const tempos = itens.slice(0, n).map((it) => it.em);
      const z = m.tipo === "topicos" ? zonaCor(m.zona) : zonaCor(2);
      const k = ultimaAcesa(tempos, t);
      // o ponteiro vai até o meio da parte acesa mais recente
      const alvo = k < 0 ? 0 : (k + 0.5) / n;
      const anterior = k <= 0 ? 0 : (k - 0.5) / n;
      const anda = k < 0 ? 0 : prog(t, tempos[k], 0.5, trava);
      // parado na parte, o ponteiro sobe e desce de leve (a frequência nunca é parada)
      const oscila = k < 0 ? 0 : (Math.sin(((t - tempos[k] - 0.5) / 1.25) * Math.PI * 2) * 0.22 * prog(t, tempos[k] + 0.4, 0.5)) / n;
      return {
        segmentos: iguais(n, () => z.cor, (i) => prog(t, tempos[i], 0.35), k, n > 1),
        ponteiro: limitar(mistura(anterior, alvo, anda) + oscila),
        ponteiroVisivel: k < 0 ? 0 : prog(t, tempos[0], 0.25),
        coracao: k < 0 ? null : { cor: z.cor, p: prog(t, tempos[0], 0.4) },
      };
    }
    case "destaque": {
      const z = m.nivel === "alerta" ? ZONAS[4] : ZONAS[1];
      const enche = prog(t, m.em, 0.7, trava);
      // no fim do anel, o ponteiro treme de leve (o batimento no máximo)
      const treme = Math.sin((t - m.em) * 2 * Math.PI * 1.6) * 0.012 * prog(t, m.em + 0.7, 0.3);
      return {
        segmentos: [{ a: 0, b: 1, cor: z.cor, acesa: enche, foco: 0, apaga: 0 }],
        ponteiro: limitar(enche - Math.abs(treme)),
        ponteiroVisivel: prog(t, m.de, 0.25),
        coracao: { cor: z.cor, p: prog(t, m.em, 0.3) },
      };
    }
    case "grafico": {
      const g = m as Grafico;
      const dados = (g.dados ?? []).slice(0, 6);
      const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
      let acum = 0;
      const segmentos: Segmento[] = dados.map((d, i) => {
        const a = acum / total;
        acum += Math.max(0, d.valor);
        return { a, b: acum / total, cor: CORES_FATIAS[i], acesa: prog(t, d.em, 0.45), foco: 0, apaga: 0 };
      });
      return { segmentos, ponteiro: 0, ponteiroVisivel: 0, coracao: null };
    }
    default:
      return { segmentos: cinco([0, 0, 0, 0, 0], null), ponteiro: 0, ponteiroVisivel: 0, coracao: null };
  }
};

export const relogioNoTempo = (t: number, ordem: Momento[], trechos: Trecho[], k: number): EstadoDoRelogio => {
  const atual = trechos[k];
  const anterior = trechos[k - 1];
  const inicioTroca = atual.de - ANTES;
  const lugar = (tr: Trecho | undefined): Lugar | undefined => tr?.lugar;
  // entra junto com a caixa virando círculo; sai logo no começo da troca (antes da caixa deformar)
  const agora = ehRelogio(lugar(atual)) ? (ehRelogio(lugar(anterior)) ? 1 : prog(t, inicioTroca + TROCA * 0.4, 0.32)) : 0;
  const antes = ehRelogio(lugar(anterior)) && !ehRelogio(lugar(atual)) ? 1 - prog(t, inicioTroca, 0.16, saida) : 0;
  const visivel = Math.max(agora, antes);
  // o momento do relógio: o atual ou, saindo, o anterior
  const tr = ehRelogio(lugar(atual)) ? atual : anterior;
  const m = tr?.momento !== null && tr?.momento !== undefined ? ordem[tr.momento] : undefined;
  const base = m ? estadoDoMomento(t, ordem, m) : estadoDoMomento(t, ordem, { tipo: "zonas", de: 0, ate: 0, titulo: "" } as Zonas);
  // batimento: um pulso por ~0,8 s; no alerta, mais rápido
  const periodo = m?.tipo === "destaque" && m.nivel === "alerta" && t >= m.em ? 0.5 : 0.82;
  const fase = (((t % periodo) + periodo) % periodo) / periodo;
  const batida = Math.max(0, 1 - fase / 0.18) * (fase < 0.18 ? 1 : 0) + Math.max(0, 1 - Math.abs(fase - 0.3) / 0.1) * 0.5;
  return { visivel: limitar(visivel), ...base, batida };
};

export const corDoNumeral = cor.numeral;
