// A gramática do Extrato, em tempo: onde estão a pessoa, o rolo e as tiras em cada instante.
//
// Layout "cima" (o padrão):
// - rolo (tela dividida): a pessoa numa moldura larga embaixo e o rolo centrado em cima, saindo de
//   trás dela; a última linha impressa fica logo acima da moldura e o papel rola para cima.
// - tira (quadro cheio): a pessoa cresce até o quadro cheio (cobrindo o rolo, que espera atrás) e um
//   pedaço de cupom sobe do pé do quadro, na altura do peito, alternando de lado. Quando o momento
//   acaba, a tira cai para fora do quadro.
// Layout "lado" (o do exemplo do modelo):
// - abertura: pessoa em quadro cheio e o cupom saindo do pé do quadro, à esquerda;
// - conta / fechamento: tela dividida — o cupom de um lado, a pessoa num cartão do outro. A cada
//   etapa os dois TROCAM DE LADO (o cupom passa por trás do cartão).
// Nos dois, pausa longa sem momento = pessoa em quadro cheio com legenda.
import { Easing } from "remotion";
import { entra as entraSuave, prog, troca } from "./anim";
import type { Caixa } from "./motor/caixa";
import type { Momento, Plano } from "./plano";
import { comecoDoRolo, naTira, PAD_PE, type Tira } from "./recibo";
import { CARTAO, CIMA, CUPOM_ABERTURA, H, LINHA_DE_IMPRESSAO, MARGEM, MOLDURA, PAPEL, TIRA, TOPO, TOPO_DO_PAPEL, W } from "./tema";

// duração da troca de lado / de quadro, e quanto ela começa antes do `de` do momento (o corte da
// fala que costuma ficar na fronteira cai no meio do movimento)
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
// do pé do quadro cheio). Em todo o resto ele fica atrás da pessoa, para nunca passar sobre o rosto.
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

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// layout "lado": o cartão da pessoa na tela dividida, do lado oposto ao cupom
export const caixaCartao = (ladoCupom: Lado): Caixa => ({
  x: ladoCupom === "esquerda" ? W - MARGEM - CARTAO.w : MARGEM,
  y: CARTAO.y,
  w: CARTAO.w,
  h: CARTAO.h,
  raio: CARTAO.raio,
  zoom: 1.06,
  ancoraY: 0.3,
});

// layout "cima": a moldura larga embaixo
export const caixaMoldura = (): Caixa => ({ x: MOLDURA.x, y: MOLDURA.y, w: MOLDURA.w, h: MOLDURA.h, raio: MOLDURA.raio, zoom: 1, ancoraY: MOLDURA.ancoraY });

export const xDoCupom = (lado: Lado) => (lado === "esquerda" ? MARGEM : W - MARGEM - PAPEL);

// layout "cima": o rolo centrado, um passo para um lado ou para o outro a cada etapa
export const cupomCima = (lado: Lado = "esquerda"): EstadoCupom => {
  const largura = PAPEL * CIMA.escala;
  const x = (W - largura) / 2 + (lado === "esquerda" ? -CIMA.passo : CIMA.passo);
  return { x, linha: MOLDURA.y - CIMA.folga, escala: CIMA.escala, topo: CIMA.topo };
};

// Os marcos de layout ao longo do vídeo
export const marcos = (plano: Plano): Marco[] => {
  const cima = emCima(plano);
  const lista: Marco[] = [];
  let lado: Lado | undefined;
  let anterior: Quadro | undefined;
  // onde o rolo está quando a pessoa vai para o quadro cheio: no "cima" ele espera no lugar
  // (atrás da pessoa); no "lado" ele desce inteiro para fora do quadro, no mesmo lado
  const cheio = (ref?: Quadro): Quadro => ({
    tipo: "cheio",
    pessoa: caixaCheia(plano),
    cupom: cima
      ? (ref?.cupom ?? cupomCima())
      : { x: ref?.cupom.x ?? CUPOM_ABERTURA.x, linha: Number.MAX_SAFE_INTEGER, escala: ref?.cupom.escala ?? 1, topo: H + 80 },
  });
  const momentos = plano.momentos;
  if (!momentos.length || momentos[0].de > 0.3) lista.push({ de: 0, dur: 0.001, quadro: cheio() });
  momentos.forEach((m, i) => {
    let quadro: Quadro;
    if (comecoDoRolo(plano, m, i)) {
      quadro = {
        tipo: "cheio",
        pessoa: caixaCheia(plano),
        cupom: { x: CUPOM_ABERTURA.x, linha: CUPOM_ABERTURA.linha, escala: CUPOM_ABERTURA.escala, rabo: CUPOM_ABERTURA.rabo },
        cupomNaFrente: true,
      };
    } else if (naTira(plano, m, i)) {
      quadro = cheio(anterior);
    } else {
      // padrão: o cupom começa à esquerda (continua da abertura) e alterna a cada etapa
      lado = ("lado" in m ? m.lado : undefined) ?? (lado === undefined ? "esquerda" : lado === "esquerda" ? "direita" : "esquerda");
      quadro = cima
        ? { tipo: "dividido", pessoa: caixaMoldura(), cupom: cupomCima(lado), lado }
        : { tipo: "dividido", pessoa: caixaCartao(lado), cupom: { x: xDoCupom(lado), linha: LINHA_DE_IMPRESSAO, escala: 1, topo: TOPO_DO_PAPEL }, lado };
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
  ancoraY: mix(a.ancoraY ?? 0.3, b.ancoraY ?? 0.3, p),
});

export type Situacao = {
  pessoa: Caixa;
  cupom: EstadoCupom & { rabo: number };
  // 0 = quadro cheio, 1 = tela dividida (para a legenda e as guias)
  dividido: number;
  // 0→1→0 durante uma troca de lado no layout "lado" (o cupom passa por trás do cartão)
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
  const trocaDeLado = !emCima(plano) && a.tipo === "dividido" && b.tipo === "dividido" && a.lado !== b.lado;
  const cruzando = trocaDeLado ? Math.sin(Math.PI * p) : 0;
  const dividido = mix(a.tipo === "dividido" ? 1 : 0, b.tipo === "dividido" ? 1 : 0, p);

  // corte no meio de um trecho parado (longe de uma troca): passo seco de zoom de 7%
  const longeDeTroca = (c: number) => !lista.some((m) => Math.abs(c - m.de) < 0.8 || (c > m.de && c < m.de + m.dur + 0.3));
  const cortes = (plano.cortesEm ?? []).filter((c) => c <= t && longeDeTroca(c) && c > atual.de);
  if (cortes.length % 2 === 1) pessoa.zoom = (pessoa.zoom ?? 1) * 1.07;
  const cupomNaFrente = !!(b.cupomNaFrente || (p < 1 && a.cupomNaFrente)) && cruzando === 0;
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
  // acima disto (px na tela) o papel não aparece: nunca sobe sobre o queixo
  limite: number;
};

const cai = Easing.in(Easing.quad);

// o mais alto que a tira pode chegar: logo abaixo do queixo
export const limiteDaTira = (plano: Plano, zonaTopo: number) => Math.max(TOPO, Math.min(TIRA.linha - 220, zonaTopo + TIRA.respiro));

export const escalaDaTira = (tira: Tira, limite: number) => Math.max(TIRA.escalaMin, Math.min(TIRA.escala, (TIRA.linha - limite) / Math.max(1, tira.altura - PAD_PE)));

// quando a tira entra e quando ela cai
const entradaDaTira = (tira: Tira, momentos: Momento[], plano: Plano) => {
  const m = momentos[tira.momento];
  const anterior = momentos[tira.momento - 1];
  // a tira sobe junto com a troca, mas não antes de ~0,5 s da primeira linha: nunca fica em branco esperando
  const primeira = tira.blocos.find((b) => b.c.k !== "capa")?.em ?? m.de;
  let entra = tira.momento === 0 && m.de < 0.3 ? -Infinity : Math.max(m.de - ANTES, primeira - 0.5);
  // vindo da tela dividida, a pessoa ainda está crescendo: a tira espera o rosto chegar ao lugar
  // (nunca passa pelo queixo no meio da troca)
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
      // rolo em seguida: cai um pouco antes de a pessoa encolher (o rosto desce depois que ela saiu)
      sai = seguinte ? Math.max(proximo.de - ANTES - 0.12, entradaDaTira(seguinte, momentos, plano) - 0.05) : proximo.de - ANTES - 0.12;
    }
  }
  return { entra, sai };
};

export const estadoDaTira = (t: number, tira: Tira, tiras: Tira[], momentos: Momento[], plano: Plano, zonaTopo: number): EstadoTira => {
  const limite = limiteDaTira(plano, zonaTopo);
  const escala = escalaDaTira(tira, limite);
  const { entra, sai } = tempoDaTira(tira, tiras, momentos, plano);
  // sobe do pé do quadro (0,55 s, decidido) e cai para fora dele (0,4 s, acelerando)
  const pEntra = prog(t, entra, 0.55, entraSuave);
  const pSai = prog(t, sai, 0.4, cai);
  const largura = PAPEL * escala;
  return {
    visivel: t >= entra - 0.001 && pSai < 1,
    x: tira.lado === "esquerda" ? TIRA.margem : W - TIRA.margem - largura,
    linha: TIRA.linha,
    escala,
    rabo: TIRA.rabo,
    deslocY: (1 - pEntra) * (H - limite + 60) + pSai * (H - limite + 120),
    limite,
  };
};
