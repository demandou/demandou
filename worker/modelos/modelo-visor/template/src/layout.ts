// A direção do visor: onde ficam a pessoa, a cena ilustrada e os cantos de enquadramento em cada
// instante. Tudo sai do plano: o aluno só escolhe o `pessoa` de um momento, se quiser.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { desliza, mistura, prog } from "./anim";
import type { Acao, Lugar, Momento, Plano } from "./plano";

export type Ret = { x: number; y: number; w: number; h: number };

// a área útil do visor: entre as leituras do alto e o seletor de modos
export const VIVO: Ret = { x: 48, y: 180, w: 984, h: 1200 };
// no lugar "topo", o painel do rótulo fica à esquerda da pessoa, em cima da cena
export const PAINEL_TOPO: Ret = { x: 48, y: 180, w: 464, h: 520 };
export const DUR_TROCA = 0.55;
// voltar para a tela cheia é mais rápido (a pessoa cresce por cima de tudo)
export const durDaTroca = (para: Lugar) => (para === "cheia" ? 0.45 : DUR_TROCA);

// Blocos universais que ocupam a tela de vidro (lista, passos, comparação, gráfico): a pessoa vai
// para um cartão (`topo`) ou para a janelinha (`janela`) e o conteúdo fica numa tela embaixo.
export const TIPOS_PAINEL = ["topicos", "passos", "comparacao", "grafico"];
export const ehPainel = (m: Momento) => TIPOS_PAINEL.includes(m.tipo);
// momentos que alternam topo/janela (as cenas e os blocos de tela de vidro)
const alternam = (m: Momento) => m.tipo === "cena" || ehPainel(m);

// Os dois retângulos de um bloco de tela de vidro: o painel do título (ao lado da pessoa) e o corpo.
export const painelDoLugar = (lugar: Lugar): { titulo: Ret; corpo: Ret } | null =>
  lugar === "topo"
    ? { titulo: PAINEL_TOPO, corpo: { x: 48, y: 716, w: 984, h: 664 } }
    : lugar === "janela"
      ? { titulo: { x: 48, y: 204, w: 580, h: 452 }, corpo: { x: 48, y: 684, w: 984, h: 696 } }
      : null;

export type Disposicao = {
  pessoa: Caixa;
  // onde fica a cena ilustrada (null = não aparece)
  cena: Ret | null;
  // o que os cantos de enquadramento abraçam
  cantos: Ret;
};

export const lugares = (plano: Plano): Record<Lugar, Disposicao> => {
  const topoCena: Ret = { x: 48, y: 716, w: 984, h: 664 };
  const ladoCena: Ret = { x: 544, y: 180, w: 488, h: 1200 };
  return {
    // em tela cheia, o rosto fica onde a gravação deixou (zoom parte dele)
    cheia: { pessoa: { x: 0, y: 0, w: 1080, h: 1920, raio: 0, zoom: 1, ancoraY: plano.rosto.y }, cena: null, cantos: VIVO },
    // pessoa num cartão em cima, à direita; painel do rótulo à esquerda; a cena larga embaixo
    topo: { pessoa: { x: 528, y: 180, w: 504, h: 520, raio: 28, zoom: 1.35, ancoraY: 0.48 }, cena: topoCena, cantos: topoCena },
    // a cena ocupa o visor; a pessoa é a janelinha da câmera frontal, no canto de cima
    janela: { pessoa: { x: 652, y: 204, w: 340, h: 452, raio: 24, zoom: 2.1, ancoraY: 0.5 }, cena: VIVO, cantos: VIVO },
    // a pessoa numa coluna à esquerda; a cena numa coluna à direita
    lado: { pessoa: { x: 48, y: 180, w: 476, h: 1200, raio: 28, zoom: 1.2, ancoraY: 0.3 }, cena: ladoCena, cantos: ladoCena },
    // comparação: duas fotos grandes ocupam o visor; a pessoa vira uma janelinha pequena
    mini: { pessoa: { x: 776, y: 204, w: 232, h: 310, raio: 20, zoom: 2.2, ancoraY: 0.53 }, cena: VIVO, cantos: VIVO },
  };
};

// Padrão de cada tipo. As cenas alternam topo e janela para o layout não se repetir.
// Abertura e fechamento são sempre em tela cheia; a comparação sempre em coluna; a cena nunca em
// tela cheia (ela precisa de espaço ao lado da pessoa).
export const lugarDoMomento = (m: Momento, plano: Plano): Lugar => {
  if (m.tipo === "abertura" || m.tipo === "cta") return "cheia";
  if (m.tipo === "comparar") return "mini";
  if (alternam(m)) {
    if (m.pessoa === "topo" || m.pessoa === "janela" || (m.tipo === "cena" && m.pessoa === "lado")) return m.pessoa;
    const lista = [...plano.momentos].filter(alternam).sort((a, b) => a.de - b.de);
    return lista.indexOf(m) % 2 === 0 ? "topo" : "janela";
  }
  return m.pessoa ?? "cheia";
};

export type Segmento = { de: number; lugar: Lugar };

// Lugar ao longo do vídeo: o de cada momento; tela cheia nos trechos sem momento.
export const segmentos = (plano: Plano): Segmento[] => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  const segs: Segmento[] = [{ de: -10, lugar: "cheia" }];
  const por = (de: number, lugar: Lugar) => {
    const ultimo = segs[segs.length - 1];
    if (ultimo.lugar === lugar) return;
    if (de <= ultimo.de + 0.01) ultimo.lugar = lugar;
    else segs.push({ de, lugar });
  };
  ordem.forEach((m, i) => {
    por(m.de <= 0.1 ? -10 : m.de, lugarDoMomento(m, plano));
    const proximo = ordem[i + 1];
    const fimDoVideo = m.ate >= plano.duracao - 0.3;
    if (!fimDoVideo && (!proximo || proximo.de - m.ate > 0.15)) por(m.ate, "cheia");
  });
  return segs;
};

// Estados da caixa da pessoa para o `caixaNoTempo` do motor: troca de lugar a cada segmento;
// em tela cheia o zoom alterna 1 / 1,04 em cada corte (disfarça o pulo) e aproxima de leve quando
// o foco trava.
export const estadosDaPessoa = (plano: Plano): EstadoDaCaixa[] => {
  const L = lugares(plano);
  const segs = segmentos(plano);
  const estados: EstadoDaCaixa[] = [];
  segs.forEach((s, i) => {
    const base = L[s.lugar].pessoa;
    estados.push({ de: s.de, caixa: base, dur: i === 0 ? 0.01 : durDaTroca(s.lugar) });
    if (s.lugar !== "cheia") return;
    const fim = segs[i + 1]?.de ?? Infinity;
    let zoom = base.zoom ?? 1;
    const travas = plano.momentos.flatMap((m) => (m.tipo === "foco" ? [m.travaEm] : []));
    const marcas: { t: number; tipo: "corte" | "foco" }[] = [
      ...(plano.cortesEm ?? []).map((t) => ({ t, tipo: "corte" as const })),
      ...travas.map((t) => ({ t, tipo: "foco" as const })),
    ]
      .filter((x) => x.t > s.de + 0.7 && x.t < fim - 0.7)
      .sort((a, b) => a.t - b.t);
    for (const x of marcas) {
      if (x.tipo === "corte") {
        zoom = zoom > 1.01 ? 1 : 1.04;
        estados.push({ de: x.t, caixa: { ...base, zoom }, dur: 0.01 });
      } else {
        zoom = zoom * 1.04;
        estados.push({ de: x.t, caixa: { ...base, zoom }, dur: 0.45 });
      }
    }
  });
  return estados;
};

// Retângulo que acompanha as trocas de lugar (cena e cantos), com a mesma curva da pessoa.
export const retNoTempo = (t: number, segs: Segmento[], de: (s: Segmento, anterior?: Ret) => Ret): Ret => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) if (segs[k].de <= t) i = k;
  if (i === 0) return de(segs[0]);
  const anterior = retNoTempo(segs[i].de, segs.slice(0, i), de);
  const alvo = de(segs[i], anterior);
  const p = prog(t, segs[i].de, durDaTroca(segs[i].lugar), desliza);
  return {
    x: mistura(anterior.x, alvo.x, p),
    y: mistura(anterior.y, alvo.y, p),
    w: mistura(anterior.w, alvo.w, p),
    h: mistura(anterior.h, alvo.h, p),
  };
};

// ---------- estado da cena ilustrada ----------

export type EstadoCena = {
  // 1 = lente engordurada (embaçada, com digital); 0 = limpa
  nevoa: number;
  // posição do assunto, em fração da largura (0,5 = centro)
  x: number;
  // 1 = foto escura; 0 = exposição certa
  escuro: number;
  // 1 = horizonte torto; 0 = reto
  torto: number;
  // 1 = fora de foco; 0 = nítida
  desfoque: number;
};

const acoesDoPlano = (plano: Plano) => {
  const acoes = new Set<Acao>();
  for (const m of plano.momentos) {
    if (m.tipo === "cena") acoes.add(m.acao);
    if (m.tipo === "foco" && m.luzEm !== undefined) acoes.add("luz");
  }
  return acoes;
};

const terco = (lado?: "esquerda" | "direita") => (lado === "direita" ? 2 / 3 : 1 / 3);

// A foto como era antes de qualquer ajuste: cada ajuste do vídeo é um defeito dela.
export const estadoAntes = (plano: Plano): EstadoCena => {
  const a = acoesDoPlano(plano);
  return {
    nevoa: a.has("limpar") ? 1 : 0,
    x: 0.5,
    escuro: a.has("luz") ? 1 : 0,
    torto: a.has("horizonte") ? 1 : 0,
    desfoque: a.has("foco") ? 1 : 0,
  };
};

// A foto com todos os ajustes feitos.
export const estadoDepois = (plano: Plano): EstadoCena => {
  const t = plano.momentos.find((m) => m.tipo === "cena" && m.acao === "tercos");
  return { nevoa: 0, x: t && t.tipo === "cena" ? terco(t.lado) : 0.5, escuro: 0, torto: 0, desfoque: 0 };
};

export const fimDaAcao = (m: { acaoEm: number; acaoAte?: number }) => m.acaoAte ?? m.acaoEm + 1.4;

// A cena num instante: cada momento `cena` mostra só o SEU defeito — ele aparece quando o momento
// começa e some com a ação. O enquadramento fica: depois do `tercos`, o assunto segue na linha.
// (os defeitos todos juntos só aparecem no ANTES da comparação)
export const estadoNoTempo = (plano: Plano, t: number): EstadoCena => {
  const e: EstadoCena = { nevoa: 0, x: 0.5, escuro: 0, torto: 0, desfoque: 0 };
  const cenas = plano.momentos.filter((m) => m.tipo === "cena").sort((a, b) => a.de - b.de);
  cenas.forEach((m, i) => {
    if (m.tipo !== "cena") return;
    // a primeira cena já nasce com o defeito; nas outras ele entra junto com a troca de lugar
    const aparece = i === 0 ? 1 : prog(t, m.de - 0.05, 0.35);
    const dur = Math.max(0.2, fimDaAcao(m) - m.acaoEm);
    // o foco "estala" na trava (fim da ação); luz e nível acompanham o arrasto; o assunto desliza
    const conserta =
      m.acao === "foco"
        ? prog(t, fimDaAcao(m) - 0.18, 0.18)
        : prog(t, m.acaoEm, dur, m.acao === "tercos" || m.acao === "luz" || m.acao === "horizonte" ? desliza : undefined);
    const defeito = aparece * (1 - conserta);
    if (m.acao === "limpar") e.nevoa = Math.max(e.nevoa, defeito);
    if (m.acao === "tercos") e.x = mistura(e.x, terco(m.lado), conserta);
    if (m.acao === "luz") e.escuro = Math.max(e.escuro, defeito);
    if (m.acao === "horizonte") e.torto = Math.max(e.torto, defeito);
    if (m.acao === "foco") e.desfoque = Math.max(e.desfoque, defeito);
  });
  return e;
};

// Quando a grade dos terços se desenha em cada momento de cena
export const gradeDoMomento = (m: Momento): number | undefined => {
  if (m.tipo !== "cena") return undefined;
  if (m.gradeEm !== undefined) return m.gradeEm;
  return m.acao === "tercos" ? m.acaoEm - 0.4 : undefined;
};
