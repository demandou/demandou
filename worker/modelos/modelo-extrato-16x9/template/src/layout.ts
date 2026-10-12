// A gramática do Extrato no quadro deitado (16:9, 1920×1080), em tempo: onde estão a pessoa, o rolo
// e as tiras em cada instante. A diagramação é a da aula 9 do curso (editar uma aula horizontal):
// - quadro cheio é a base: a pessoa no vídeo 16:9 inteiro, como foi gravado. Pausa longa sem
//   momento = quadro cheio com legenda.
// - rolo (tela dividida): quando a fala vira conta, a pessoa vai para a MOLDURA do lado direito, com
//   o rosto no centro dela e acompanhado de leve (rosto.rastro), e o rolo imprime no QUADRO do lado
//   esquerdo: o papel sai do alto, a última linha impressa fica em ROLO.linha e o papel rola para
//   cima. A cada etapa o rolo dá um passo para um lado ou para o outro dentro do quadro.
// - tira (quadro cheio): a pessoa continua no quadro cheio e um pedaço curto de cupom sobe do pé do
//   quadro AO LADO do rosto (nunca sobre ele), na altura do peito, alternando de lado quando os dois
//   lados têm espaço. Quando o momento acaba, a tira cai para fora do quadro.
// - layout "lado" (o do exemplo): a abertura é a pessoa em quadro cheio com um cupom curto saindo do
//   pé do quadro, à esquerda, que depois vira o rolo. No vertical o cupom e o cartão trocavam de lado
//   a cada etapa; no quadro deitado a moldura fica sempre à direita (aula 9) e o rolo dá o passo.
import { Easing } from "remotion";
import { entra as entraSuave, prog, troca } from "./anim";
import { type Caixa, QUADRO_16x9, type Rosto, rostoNaTela } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { comecoDoRolo, naTira, PAD_PE, type Tira } from "./recibo";
import { CUPOM_ABERTURA, H, LARGURA_DO_ROSTO, MOLDURA, PAPEL, QUADRO, ROLO, TIRA, W } from "./tema";

// duração da troca de quadro, e quanto ela começa antes do `de` do momento (o corte da fala que
// costuma ficar na fronteira cai no meio do movimento)
export const TROCA = 0.62;
const ANTES = 0.2;
// pausa maior que isto entre dois momentos: a pessoa volta ao quadro cheio, com legenda
const PAUSA = 1.1;

export type Lado = "esquerda" | "direita";
// `linha`: altura (na tela) da última linha impressa. `topo`: na tela dividida, o papel fica preso
// no alto enquanto é curto (a linha de impressão desce junto com o que imprime) e só começa a rolar
// quando a última linha chega em `linha`.
// `rabo`: quanto papel em branco sobra abaixo da última linha (px, escala 1); sem ele, o papel
// vai até o pé do quadro.
export type EstadoCupom = { x: number; linha: number; escala: number; topo?: number; rabo?: number };
// `cupomNaFrente`: o rolo passa por cima do vídeo (só na abertura do layout "lado", em que ele sai
// do pé do quadro cheio ao lado do rosto). Em todo o resto ele fica atrás da pessoa, para nunca
// passar sobre o rosto.
export type Quadro = { tipo: "cheio" | "dividido"; pessoa: Caixa; cupom: EstadoCupom; lado?: Lado; cupomNaFrente?: boolean };
type Marco = { de: number; dur: number; quadro: Quadro };

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

const emCima = (plano: Plano) => (plano.layout ?? "cima") !== "lado";

// o rosto do plano sempre medido no quadro deitado (vale também para plano sem `rosto.quadro`)
export const rostoDoPlano = (plano: Plano): Rosto => (plano.rosto.quadro ? plano.rosto : { ...plano.rosto, quadro: QUADRO_16x9 });
const alturaDoVideo = (plano: Plano) => Math.min(H, plano.videoAltura ?? H);

// Quadro cheio: o vídeo 16:9 inteiro, com o rosto onde foi gravado (a VideoNaCaixa só segue o rosto
// de leve quando há rastro; nunca recorta em pé)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom: 1, ancoraX: plano.rosto.x, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// A moldura da pessoa na tela dividida, à direita, com o rosto no centro dela. Se o rosto foi
// gravado colado numa borda, aproxima o mínimo (até MOLDURA.zoomMax) para ele ficar no centro.
export const caixaMoldura = (plano: Plano): Caixa => {
  const videoAltura = alturaDoVideo(plano);
  const s0 = Math.max(MOLDURA.w / W, MOLDURA.h / videoAltura);
  const fx = plano.rosto.x;
  const precisa = MOLDURA.w / 2 / (Math.max(0.01, Math.min(fx, 1 - fx)) * W * s0);
  const zoom = Math.min(MOLDURA.zoomMax, Math.max(MOLDURA.zoom, precisa));
  return { x: MOLDURA.x, y: MOLDURA.y, w: MOLDURA.w, h: MOLDURA.h, raio: MOLDURA.raio, zoom, ancoraY: MOLDURA.ancoraY };
};

// O rolo no quadro da esquerda, um passo para um lado ou para o outro a cada etapa
export const cupomRolo = (lado: Lado = "esquerda"): EstadoCupom => {
  const largura = PAPEL * ROLO.escala;
  const x = QUADRO.x + (QUADRO.w - largura) / 2 + (lado === "esquerda" ? -ROLO.passo : ROLO.passo);
  return { x, linha: ROLO.linha, escala: ROLO.escala, topo: ROLO.topo };
};

// ---------- o lugar do papel no quadro cheio (ao lado do rosto) ----------

// Por onde o rosto anda na tela (px) entre `de` e `ate`, com a pessoa na `caixa`: a borda esquerda
// mais à esquerda e a direita mais à direita (com o rastro, o rosto anda durante o momento)
const faixaDoRosto = (plano: Plano, caixa: Caixa, de: number, ate: number) => {
  const rosto = rostoDoPlano(plano);
  const videoAltura = alturaDoVideo(plano);
  const fracao = rosto.rastro?.largura ?? LARGURA_DO_ROSTO;
  let esq = Number.POSITIVE_INFINITY;
  let dir = Number.NEGATIVE_INFINITY;
  const passos = Math.max(1, Math.ceil((ate - de) / 0.2));
  for (let k = 0; k <= passos; k++) {
    const t = Math.max(0, de + ((ate - de) * k) / passos);
    const r = rostoNaTela(caixa, rosto, videoAltura, t);
    const meia = (fracao * W * r.escala) / 2;
    esq = Math.min(esq, r.x - meia);
    dir = Math.max(dir, r.x + meia);
  }
  return { esq, dir };
};

// Onde fica um papel no quadro cheio: o lado, a borda esquerda (px), a escala e a caixa da pessoa
export type Lugar = { lado: Lado; x: number; escala: number; pessoa: Caixa };

type Medidas = { escala: number; escalaMin: number; margem: number; zoomMax: number; fixo?: boolean };

// O lugar de um papel de largura PAPEL × escala no quadro cheio, entre `de` e `ate`: do lado
// preferido se couber (ao menos em `escalaMin`), senão do outro (`fixo`: só o preferido); se nenhum
// lado tiver espaço, o vídeo desliza (aproximando o mínimo, até `zoomMax`) para afastar o rosto.
const lugarAoLado = (plano: Plano, preferido: Lado, de: number, ate: number, o: Medidas): Lugar => {
  const base = caixaCheia(plano);
  const espaco = (caixa: Caixa) => {
    const f = faixaDoRosto(plano, caixa, de, ate);
    return { f, esquerda: f.esq - TIRA.respiro - o.margem, direita: W - o.margem - (f.dir + TIRA.respiro) };
  };
  const montar = (lado: Lado, livre: number, pessoa: Caixa): Lugar => {
    const escala = Math.max(0.5, Math.min(o.escala, livre / PAPEL));
    return { lado, escala, pessoa, x: lado === "esquerda" ? o.margem : W - o.margem - PAPEL * escala };
  };
  const e = espaco(base);
  const outro: Lado = preferido === "esquerda" ? "direita" : "esquerda";
  const minimo = PAPEL * o.escalaMin;
  if (e[preferido] >= minimo) return montar(preferido, e[preferido], base);
  if (!o.fixo && e[outro] >= minimo) return montar(outro, e[outro], base);
  // nenhum lado cabe: o vídeo desliza para longe do lado do papel
  const lado: Lado = o.fixo ? preferido : e.esquerda >= e.direita ? "esquerda" : "direita";
  const falta = minimo - e[lado];
  const centro = (e.f.esq + e.f.dir) / 2;
  const alvo = Math.min(W - 1, Math.max(1, centro + (lado === "esquerda" ? falta : -falta)));
  const fx = Math.min(0.99, Math.max(0.01, plano.rosto.x));
  const zoom = Math.min(o.zoomMax, Math.max(1, alvo / (fx * W), (W - alvo) / ((1 - fx) * W)));
  const pessoa: Caixa = { ...base, zoom, ancoraX: alvo / W };
  return montar(lado, espaco(pessoa)[lado], pessoa);
};

// O lugar de cada tira (pela ordem do momento) e o do cupom da abertura do layout "lado"
export type Geometria = { tiras: Map<number, Lugar>; abertura?: Lugar };

export const geometria = (plano: Plano, tiras: Tira[]): Geometria => {
  const momentos = plano.momentos;
  const mapa = new Map<number, Lugar>();
  for (const tira of tiras) {
    const m = momentos[tira.momento];
    // a escala que cabe na altura: da linha de impressão até o topo seguro
    const escala = Math.max(TIRA.escalaMin, Math.min(TIRA.escala, (TIRA.linha - TIRA.topo) / Math.max(1, tira.altura - PAD_PE)));
    mapa.set(tira.momento, lugarAoLado(plano, tira.lado, m.de - 0.4, m.ate + 0.4, { escala, escalaMin: TIRA.escalaMin, margem: TIRA.margem, zoomMax: TIRA.zoomMax }));
  }
  const primeiro = momentos[0];
  const abertura =
    primeiro && comecoDoRolo(plano, primeiro, 0)
      ? lugarAoLado(plano, "esquerda", 0, primeiro.ate + TROCA, {
          escala: CUPOM_ABERTURA.escala,
          escalaMin: CUPOM_ABERTURA.escalaMin,
          margem: CUPOM_ABERTURA.margem,
          zoomMax: TIRA.zoomMax,
          fixo: true,
        })
      : undefined;
  return { tiras: mapa, abertura };
};

// Os marcos de layout ao longo do vídeo
export const marcos = (plano: Plano, geo: Geometria): Marco[] => {
  const cima = emCima(plano);
  const lista: Marco[] = [];
  let lado: Lado | undefined;
  let anterior: Quadro | undefined;
  const xAbertura = geo.abertura?.x ?? CUPOM_ABERTURA.margem;
  // onde o rolo está quando a pessoa vai para o quadro cheio: no "cima" ele espera no lugar
  // (atrás da pessoa); no "lado" ele desce inteiro para fora do quadro, no mesmo lado
  const cheio = (ref?: Quadro, pessoa: Caixa = caixaCheia(plano)): Quadro => ({
    tipo: "cheio",
    pessoa,
    cupom: cima
      ? (ref?.cupom ?? cupomRolo())
      : { x: ref?.cupom.x ?? xAbertura, linha: Number.MAX_SAFE_INTEGER, escala: ref?.cupom.escala ?? 1, topo: H + 80 },
  });
  const momentos = plano.momentos;
  if (!momentos.length || momentos[0].de > 0.3) lista.push({ de: 0, dur: 0.001, quadro: cheio() });
  momentos.forEach((m, i) => {
    let quadro: Quadro;
    if (comecoDoRolo(plano, m, i)) {
      quadro = {
        tipo: "cheio",
        pessoa: geo.abertura?.pessoa ?? caixaCheia(plano),
        cupom: { x: xAbertura, linha: CUPOM_ABERTURA.linha, escala: geo.abertura?.escala ?? CUPOM_ABERTURA.escala, rabo: CUPOM_ABERTURA.rabo },
        cupomNaFrente: true,
      };
    } else if (naTira(plano, m, i)) {
      quadro = cheio(anterior, geo.tiras.get(i)?.pessoa);
    } else {
      // padrão: o rolo começa um passo à esquerda e alterna a cada etapa (a moldura fica à direita)
      lado = ("lado" in m ? m.lado : undefined) ?? (lado === undefined ? "esquerda" : lado === "esquerda" ? "direita" : "esquerda");
      quadro = { tipo: "dividido", pessoa: caixaMoldura(plano), cupom: cupomRolo(lado), lado };
    }
    const inicio = i === 0 && m.de < 0.3 ? 0 : Math.max(0, m.de - ANTES);
    lista.push({ de: inicio, dur: i === 0 && m.de < 0.3 ? 0.001 : TROCA, quadro });
    if (quadro.tipo === "dividido") anterior = quadro;
    // pausa longa até o próximo momento (ou o fim do vídeo): volta ao quadro cheio
    const proximo = momentos[i + 1];
    const fimDaPausa = proximo ? proximo.de : plano.duracao;
    const ultimo = !proximo && (m.tipo === "fechamento" || m.tipo === "cta" || m.ate >= plano.duracao - 0.3);
    if (!ultimo && fimDaPausa - m.ate > PAUSA) lista.push({ de: m.ate - 0.05, dur: TROCA, quadro: cheio(anterior ?? quadro) });
  });
  return lista;
};

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const mixCaixa = (a: Caixa, b: Caixa, p: number): Caixa => ({
  x: mix(a.x, b.x, p),
  y: mix(a.y, b.y, p),
  w: mix(a.w, b.w, p),
  h: mix(a.h, b.h, p),
  raio: mix(a.raio ?? 0, b.raio ?? 0, p),
  zoom: mix(a.zoom ?? 1, b.zoom ?? 1, p),
  ancoraX: mix(a.ancoraX ?? 0.5, b.ancoraX ?? 0.5, p),
  ancoraY: mix(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3, p),
});

export type Situacao = {
  pessoa: Caixa;
  cupom: EstadoCupom & { rabo: number };
  // 0 = quadro cheio, 1 = tela dividida (para a legenda e as guias)
  dividido: number;
  // no vertical, 0→1→0 durante a troca de lado do layout "lado"; no quadro deitado a moldura não
  // troca de lado, então fica sempre 0
  cruzando: number;
  // o rolo é desenhado por cima da pessoa (abertura do "lado") ou atrás dela (todo o resto)
  cupomNaFrente: boolean;
};

// a linha de impressão de um estado, dado quanto papel já saiu (`avanco`, px em escala 1)
const linhaDe = (e: EstadoCupom, avanco: number) => (e.topo === undefined ? e.linha : Math.min(e.linha, e.topo + avanco * e.escala));
// papel em branco abaixo da última linha (px, escala 1): o `rabo` do estado ou até passar do pé do quadro
const raboDe = (e: EstadoCupom, avanco: number) => e.rabo ?? Math.max(0, (H - Math.min(linhaDe(e, avanco), H)) / e.escala) + 300;

// Onde está tudo no instante `t`, com os cortes da fala disfarçados por um passo seco de zoom
export const situacao = (t: number, lista: Marco[], plano: Plano, avanco: number): Situacao => {
  let i = 0;
  for (let k = 0; k < lista.length; k++) if (lista[k].de <= t) i = k;
  const atual = lista[i];
  const antes = lista[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : troca(Math.min(1, Math.max(0, (t - atual.de) / atual.dur)));
  const a = i === 0 ? atual.quadro : antes.quadro;
  const b = atual.quadro;
  const pessoa = mixCaixa(a.pessoa, b.pessoa, p);
  const cupom = {
    x: mix(a.cupom.x, b.cupom.x, p),
    linha: mix(linhaDe(a.cupom, avanco), linhaDe(b.cupom, avanco), p),
    escala: mix(a.cupom.escala, b.cupom.escala, p),
    rabo: mix(raboDe(a.cupom, avanco), raboDe(b.cupom, avanco), p),
  };
  const cruzando = 0;
  const dividido = mix(a.tipo === "dividido" ? 1 : 0, b.tipo === "dividido" ? 1 : 0, p);

  // corte no meio de um trecho parado (longe de uma troca): passo seco de zoom de 7%
  const longeDeTroca = (c: number) => !lista.some((m) => Math.abs(c - m.de) < 0.8 || (c > m.de && c < m.de + m.dur + 0.3));
  const cortes = (plano.cortesEm ?? []).filter((c) => c <= t && longeDeTroca(c) && c > atual.de);
  if (cortes.length % 2 === 1) pessoa.zoom = (pessoa.zoom ?? 1) * 1.07;
  const cupomNaFrente = !!(b.cupomNaFrente || (p < 1 && a.cupomNaFrente));
  return { pessoa, cupom, dividido, cruzando, cupomNaFrente };
};

// ---------- as tiras (quadro cheio) ----------

export type EstadoTira = {
  visivel: boolean;
  x: number;
  linha: number;
  escala: number;
  rabo: number;
  // deslocamento vertical (px): subindo do pé do quadro ao entrar, caindo ao sair
  deslocY: number;
  // acima disto (px na tela) o papel não aparece: o topo seguro do quadro
  limite: number;
};

const cai = Easing.in(Easing.quad);

// o mais alto que a tira pode chegar: o topo seguro (ela fica ao lado do rosto, não embaixo dele)
export const limiteDaTira = () => TIRA.topo;

// quando a tira entra e quando ela cai
const entradaDaTira = (tira: Tira, momentos: Momento[], plano: Plano) => {
  const m = momentos[tira.momento];
  const anterior = momentos[tira.momento - 1];
  // a tira sobe junto com a troca, mas não antes de ~0,5 s da primeira linha: nunca fica em branco esperando
  const primeira = tira.blocos.find((b) => b.c.k !== "capa")?.em ?? m.de;
  let entra = tira.momento === 0 && m.de < 0.3 ? -Infinity : Math.max(m.de - ANTES, primeira - 0.5);
  // vindo da tela dividida, a pessoa ainda está crescendo: a tira espera ela chegar ao quadro cheio
  const vemDoRolo = anterior && !naTira(plano, anterior, tira.momento - 1) && m.de - anterior.ate <= PAUSA;
  if (vemDoRolo) entra = Math.max(entra, m.de - ANTES + TROCA * 0.7);
  return entra;
};

export const tempoDaTira = (tira: Tira, tiras: Tira[], momentos: Momento[], plano: Plano) => {
  const m = momentos[tira.momento];
  const proximo = momentos[tira.momento + 1];
  const entra = entradaDaTira(tira, momentos, plano);
  let sai = Infinity;
  if (proximo) {
    if (proximo.de - m.ate > PAUSA) sai = m.ate - 0.05;
    else {
      const seguinte = tiras.find((x) => x.momento === tira.momento + 1);
      // outra tira em seguida: esta cai enquanto a nova sobe do outro lado (as duas se cruzam);
      // rolo em seguida: cai um pouco antes de a pessoa encolher para a moldura
      sai = seguinte ? Math.max(proximo.de - ANTES - 0.12, entradaDaTira(seguinte, momentos, plano) - 0.05) : proximo.de - ANTES - 0.12;
    }
  }
  return { entra, sai };
};

export const estadoDaTira = (t: number, tira: Tira, tiras: Tira[], momentos: Momento[], plano: Plano, geo: Geometria): EstadoTira => {
  const lugar = geo.tiras.get(tira.momento);
  const limite = limiteDaTira();
  const escala = lugar?.escala ?? TIRA.escalaMin;
  const { entra, sai } = tempoDaTira(tira, tiras, momentos, plano);
  // sobe do pé do quadro (0,55 s, decidido) e cai para fora dele (0,4 s, acelerando)
  const pEntra = prog(t, entra, 0.55, entraSuave);
  const pSai = prog(t, sai, 0.4, cai);
  return {
    visivel: t >= entra - 0.001 && pSai < 1,
    x: lugar?.x ?? TIRA.margem,
    linha: TIRA.linha,
    escala,
    rabo: TIRA.rabo,
    deslocY: (1 - pEntra) * (H - limite + 60) + pSai * (H - limite + 120),
    limite,
  };
};
