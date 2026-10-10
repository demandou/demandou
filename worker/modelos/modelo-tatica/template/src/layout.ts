// A gramática do Tática, em tempo: quando a pessoa está em quadro cheio, quando encolhe para a
// caixa de transmissão (prancheta no ar) e quando volta. Tudo sai dos momentos do plano.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { type Dica, type Momento, type Plano, type Universal, ehUniversal } from "./plano";
import { CAIXA_TV, H, W } from "./tema";

// duração da troca de quadro (a pessoa encolhe / cresce)
export const TROCA = 0.52;
// a pessoa começa a encolher um pouco antes de `pranchetaEm` e a crescer um pouco antes do fim da
// dica: assim o corte que costuma ficar na fronteira cai no meio do movimento
const ANTES_DE_ENCOLHER = 0.12;
const ANTES_DE_CRESCER = 0.24;

export type Janela = {
  // para os blocos universais de prancheta, uma dica "de mentira" (só o tempo e o título)
  dica: Dica;
  // o bloco universal (topicos, passos, comparacao, grafico) desenhado na prancheta, se for o caso
  universal?: Universal;
  numero: number;
  // a pessoa começa a encolher (a prancheta aparece por trás dela)
  entra: number;
  // a pessoa começa a crescer de volta (a prancheta some por baixo dela ao fim da troca)
  sai: number;
  // primeira prancheta do vídeo: as linhas do campo se desenham
  primeira: boolean;
};

export const ordenar = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

export const ehDica = (m: Momento): m is Dica => m.tipo === "dica";

// Os momentos que viram prancheta: as dicas e os blocos universais (lista, passos, comparação, gráfico)
export const naPrancheta = (m: Momento): m is Dica | Universal => ehDica(m) || ehUniversal(m);

export const janelasDaPrancheta = (plano: Plano): Janela[] => {
  const lista = plano.momentos.filter(naPrancheta);
  let contaDicas = 0;
  return lista.map((m, i) => {
    const universal = ehUniversal(m) ? m : undefined;
    const dica: Dica = universal
      ? { tipo: "dica", de: m.de, ate: m.ate, pranchetaEm: m.de, titulo: universal.titulo ?? "" }
      : (m as Dica);
    const entra = Math.max(dica.de, dica.pranchetaEm - ANTES_DE_ENCOLHER);
    // momento que fecha o vídeo fica na prancheta até o fim
    const sai = dica.ate >= plano.duracao - 0.3 ? plano.duracao + 1 : Math.max(entra + TROCA + 0.4, dica.ate - ANTES_DE_CRESCER);
    if (!universal) contaDicas++;
    return { dica, universal, numero: universal ? 0 : contaDicas, entra, sai, primeira: i === 0 };
  });
};

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

export const caixaTv = (): Caixa => ({ ...CAIXA_TV });

// Estados da caixa da pessoa ao longo do vídeo. Corte no meio de um trecho em quadro cheio (longe de
// uma troca) ganha uma troca seca de enquadramento (1 ↔ 1,06) para disfarçar o pulo.
export const estadosDaPessoa = (plano: Plano, janelas: Janela[]): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaCaixa[] = [{ de: 0, caixa: cheia, dur: 0.001 }];
  for (const j of janelas) {
    estados.push({ de: j.entra, caixa: caixaTv(), dur: TROCA });
    if (j.sai < plano.duracao) estados.push({ de: j.sai, caixa: cheia, dur: TROCA });
  }
  const perto = (c: number) => janelas.some((j) => Math.abs(c - j.entra) < 0.75 || Math.abs(c - j.sai) < 0.75 || (c > j.entra && c < j.sai));
  for (const c of plano.cortesEm ?? []) {
    if (perto(c)) continue;
    // alterna em relação ao enquadramento que estava valendo logo antes do corte
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    const aproximado = (antes?.caixa.zoom ?? cheia.zoom ?? 1) > (cheia.zoom ?? 1) + 0.001;
    estados.push({ de: c, caixa: { ...cheia, zoom: (cheia.zoom ?? 1) * (aproximado ? 1 : 1.06) }, dur: 0.001 });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// Quanto a pessoa está "na caixa" (0 = quadro cheio, 1 = caixa de transmissão), para as molduras
export const naCaixa = (t: number, janelas: Janela[]) => {
  let v = 0;
  for (const j of janelas) {
    if (t < j.entra || t > j.sai + TROCA) continue;
    const dentro = Math.min(1, (t - j.entra) / TROCA);
    const fora = t > j.sai ? Math.min(1, (t - j.sai) / TROCA) : 0;
    v = Math.max(v, Math.max(0, dentro - fora));
  }
  return v;
};

// A dica que está na prancheta agora (com a margem da troca de volta)
export const janelaAtiva = (t: number, janelas: Janela[]) => janelas.find((j) => t >= j.entra - 0.02 && t <= j.sai + TROCA + 0.02);

// Quando uma arte de quadro cheio pode começar a entrar: se a pessoa ainda está crescendo de volta
// da caixa (fim de uma dica), espera ela quase cobrir a tela, para a arte não cair em cima da prancheta.
export const inicioVisual = (de: number, janelas: Janela[]) => {
  let inicio = de;
  for (const j of janelas) {
    const cheia = j.sai + TROCA * 0.75;
    if (j.sai < de + 0.5 && cheia > de) inicio = Math.max(inicio, cheia);
  }
  return inicio;
};

// Número da dica em curso (para o placar): a última dica que já começou
export const dicaEmCurso = (t: number, janelas: Janela[]) => {
  let atual: Janela | undefined;
  for (const j of janelas) if (t >= j.dica.de - 0.02) atual = j;
  return atual;
};
