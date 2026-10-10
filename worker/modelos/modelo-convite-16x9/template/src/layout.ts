// A gramática do modelo no quadro deitado (16:9, 1920×1080): onde ficam o vídeo, o convite, a foto
// em arco, o mostrador, a fita e a pilha. A regra é a da aula 9 do curso (editar uma aula horizontal):
// a pessoa em tela cheia é a base; quando um bloco pede apoio visual, ela vai para a foto em arco do
// lado direito (a moldura) e o bloco ocupa o lado esquerdo (o quadro); terminada a ideia, ela volta à
// tela cheia.
// - "cheio": os trechos sem momento. O vídeo deitado inteiro, como foi gravado, com a legenda num
//   cartão de papel no terço de baixo; a suíte de papelaria espera por baixo dele;
// - "convite": o convite grande deitado, com a foto em arco à direita e o texto à esquerda (abertura,
//   número, definição, destaque, frase, pergunta);
// - "cronograma": a assinatura. O convite encolhe para o lado direito (sempre o mesmo lado no quadro
//   deitado), a fita corre no alto do quadro da esquerda, o mostrador gira ao lado da pilha e um
//   cartão cai na pilha (marco, passos);
// - "mesa": o mesmo convite pequeno e o mostrador; a fita da última sequência fica na mesa e um cartão
//   cai na pilha com o conteúdo (tópicos, comparação, gráfico);
// - "final": o fechamento. O convite volta grande, um pouco mais estreito, por cima da pilha aberta.
import { mistura, prog, troca } from "./anim";
import type { MarcaDaFita } from "./componentes/Fita";
import type { Lado, Marco, Momento, Plano } from "./plano";
import { ARCO_CONVITE, ARCO_FINAL, ARCO_MEDIO, ARCO_MINI, CONTAGEM, CONVITE, CONVITE_FINAL, MINI, type Rect, romano, W } from "./tema";

export type Modo = "cheio" | "convite" | "cronograma" | "mesa" | "final";
export type { Lado };

export const modoDo = (m: Momento | null): Modo => {
  // sem momento: a pessoa em tela cheia, com a legenda (a base da aula 9)
  if (!m) return "cheio";
  if (m.tipo === "marco" || m.tipo === "passos") return "cronograma";
  if (m.tipo === "topicos" || m.tipo === "comparacao" || m.tipo === "grafico") return "mesa";
  if (m.tipo === "cta") return "final";
  return "convite";
};

export const naPilha = (modo: Modo) => modo === "cronograma" || modo === "mesa";

// No convite grande, a foto fica um pouco menor quando o bloco tem mais texto (o quadro do texto, à
// esquerda dela, fica mais largo).
const arcoDo = (m: Momento | null): "grande" | "medio" => {
  if (!m) return "grande";
  if (m.tipo === "pergunta") return m.opcoes?.length ? "medio" : m.texto.length > 70 ? "medio" : "grande";
  if (m.tipo === "frase") return m.texto.length > 64 ? "medio" : "grande";
  if (m.tipo === "numero") return "medio";
  if (m.tipo === "definicao") return m.significado.length > 18 || m.termo.length > 16 ? "medio" : "grande";
  if (m.tipo === "destaque") return m.detalhe ? "medio" : m.texto.length > 40 ? "medio" : "grande";
  if (m.tipo === "abertura") return m.texto.length > 44 || (m.subtitulo && m.texto.length > 24) ? "medio" : "grande";
  return "grande";
};

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte.
export const comCapa = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: ordenados.map((m, i) => {
      const proximo = ordenados[i + 1];
      return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
    }),
  };
};

// Um trecho da linha do tempo: um momento ou um respiro sem momento (índice -1).
export type Trecho = {
  indice: number;
  de: number;
  ate: number;
  modo: Modo;
  lado: Lado;
  arco: "grande" | "medio";
  // quando a troca de layout que leva a este trecho começa, e quanto dura
  troca: number;
  dur: number;
};

// buraco menor que isto entre dois momentos não vira respiro: o momento anterior se estende. No
// quadro deitado o respiro é a tela cheia (o vídeo abre e depois fecha de novo na foto): abaixo de
// 2 s ele só piscaria, então o bloco continua na tela.
const BURACO_MINIMO = 2;

export const montarTrechos = (plano: Plano): Trecho[] => {
  const ms = plano.momentos;
  const brutos: { indice: number; de: number; ate: number }[] = [];
  let cursor = 0;
  ms.forEach((m, i) => {
    if (m.de - cursor >= BURACO_MINIMO) brutos.push({ indice: -1, de: cursor, ate: m.de });
    else if (brutos.length) brutos[brutos.length - 1].ate = m.de;
    brutos.push({ indice: i, de: m.de, ate: m.ate });
    cursor = m.ate;
  });
  if (plano.duracao - cursor >= BURACO_MINIMO) brutos.push({ indice: -1, de: cursor, ate: plano.duracao + 1 });
  else if (brutos.length) brutos[brutos.length - 1].ate = plano.duracao + 1;
  if (brutos.length === 0) brutos.push({ indice: -1, de: 0, ate: plano.duracao + 1 });
  brutos[0].de = 0;

  const cortes = plano.cortesEm ?? [];
  let nPilha = 0;
  let ladoAnterior: Lado = "dir";
  return brutos.map((b, k) => {
    const m = b.indice >= 0 ? ms[b.indice] : null;
    const modo = modoDo(m);
    // (o lado fica registrado como no vertical; no quadro deitado a foto fica sempre à direita)
    let lado: Lado = ladoAnterior;
    if (naPilha(modo) && m) {
      const pedido = "pessoa" in m && (m.pessoa === "esq" || m.pessoa === "dir") ? m.pessoa : undefined;
      lado = pedido ?? (nPilha % 2 === 0 ? "esq" : "dir");
      nPilha++;
    }
    ladoAnterior = lado;
    const anterior = k > 0 ? brutos[k - 1] : null;
    const modoAntes = anterior ? modoDo(anterior.indice >= 0 ? ms[anterior.indice] : null) : null;
    const mesmaFamilia = modoAntes === modo || (modoAntes !== null && naPilha(modoAntes) && naPilha(modo));
    const dur = mesmaFamilia ? 0.6 : 0.78;
    // a troca começa um pouco antes do corte: o pulo do corte some no meio do movimento
    const corte = cortes.find((c) => Math.abs(c - b.de) < 0.3);
    let inicio = corte !== undefined ? corte - 0.18 : b.de - 0.12;
    if (anterior) inicio = Math.max(inicio, anterior.de + 0.4);
    return { indice: b.indice, de: b.de, ate: b.ate, modo, lado, arco: modo === "convite" ? arcoDo(m) : "grande", troca: k === 0 ? -10 : Math.max(0, inicio), dur };
  });
};

// ---------- geometria de cada trecho ----------

export type Quadro = {
  modo: Modo;
  cartao: Rect;
  arco: Rect;
  // 0–1: quanto o vídeo está aberto em tela cheia (1 = o vídeo deitado inteiro, por cima de tudo)
  cheio: number;
  // 0–1: quanto do conteúdo de cada camada está na tela
  contagem: number;
  contagemX: number;
  fita: number;
  pilha: number;
  // 0 = pilha arrumada (cronograma/mesa); 1 = aberta em leque atrás do convite (final)
  leque: number;
};

// O convite pequeno: no quadro deitado, sempre no lado direito (a moldura da aula 9).
const mini = (): { cartao: Rect; arco: Rect } => {
  const x = W - MINI.margem - MINI.w;
  return {
    cartao: { x, y: MINI.y, w: MINI.w, h: MINI.h },
    arco: { x: x + ARCO_MINI.dx, y: MINI.y + ARCO_MINI.dy, w: ARCO_MINI.w, h: ARCO_MINI.h },
  };
};

export const quadroDe = (tr: Trecho): Quadro => {
  if (naPilha(tr.modo)) {
    return { modo: tr.modo, ...mini(), cheio: 0, contagem: 1, contagemX: CONTAGEM.cx, fita: 1, pilha: 1, leque: 0 };
  }
  if (tr.modo === "final") {
    return { modo: tr.modo, cartao: CONVITE_FINAL, arco: ARCO_FINAL, cheio: 0, contagem: 0, contagemX: CONTAGEM.cx, fita: 1, pilha: 1, leque: 1 };
  }
  // na tela cheia o convite grande espera por baixo do vídeo: quando o vídeo fecha, a foto já tem lugar
  if (tr.modo === "cheio") {
    return { modo: tr.modo, cartao: CONVITE, arco: ARCO_CONVITE, cheio: 1, contagem: 0, contagemX: CONTAGEM.cx, fita: 0, pilha: 0, leque: 0 };
  }
  return { modo: tr.modo, cartao: CONVITE, arco: tr.arco === "medio" ? ARCO_MEDIO : ARCO_CONVITE, cheio: 0, contagem: 0, contagemX: CONTAGEM.cx, fita: 0, pilha: 0, leque: 0 };
};

export const misturarRet = (a: Rect, b: Rect, p: number): Rect => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
});

// `mostrador`: de qual trecho é o mostrador que está na tela (troca no meio da troca de layout)
export type Estado = { quadro: Quadro; atual: number; anterior: number; p: number; de: Quadro; para: Quadro; mostrador: number };

export const indiceDoTrecho = (t: number, trechos: Trecho[]) => {
  let k = 0;
  trechos.forEach((tr, i) => {
    if (t >= tr.troca) k = i;
  });
  return k;
};

// O estado no instante t, com a troca suave entre o trecho anterior e o atual. `ids` diz quando dois
// trechos seguidos mostram o mesmo mostrador (marcos da mesma sequência): aí o número só rola.
export const estadoNoTempo = (t: number, trechos: Trecho[], quadros: Quadro[], ids: string[] = []): Estado => {
  const k = indiceDoTrecho(t, trechos);
  const p = k === 0 ? 1 : prog(t, trechos[k].troca, trechos[k].dur, troca);
  const a = quadros[Math.max(0, k - 1)];
  const b = quadros[k];
  const mostradorFinal = b.contagem > 0 ? k : Math.max(0, k - 1);
  if (p >= 1 || k === 0) return { quadro: b, atual: k, anterior: k - 1, p: 1, de: a, para: b, mostrador: b.contagem > 0 ? k : -1 };
  // trocando de lado ou de conteúdo, o mostrador some antes e volta depois (não atravessa a foto)
  const outro = (ids[k - 1] ?? `t${k - 1}`) !== (ids[k] ?? `t${k}`);
  const trocaDeLado = a.contagem > 0 && b.contagem > 0 && (a.contagemX !== b.contagemX || outro);
  const contagem = trocaDeLado ? Math.abs(1 - 2 * p) : mistura(a.contagem, b.contagem, b.contagem > a.contagem ? prog(p, 0.35, 0.65) : prog(p, 0, 0.5));
  return {
    quadro: {
      modo: b.modo,
      cartao: misturarRet(a.cartao, b.cartao, p),
      arco: misturarRet(a.arco, b.arco, p),
      cheio: mistura(a.cheio, b.cheio, p),
      contagem,
      contagemX: trocaDeLado ? (p < 0.5 ? a.contagemX : b.contagemX) : b.contagem > 0 ? b.contagemX : a.contagemX,
      fita: mistura(a.fita, b.fita, p),
      pilha: mistura(a.pilha, b.pilha, p),
      leque: mistura(a.leque, b.leque, p),
    },
    atual: k,
    anterior: k - 1,
    p,
    de: a,
    para: b,
    mostrador: trocaDeLado ? (p < 0.5 ? k - 1 : k) : mostradorFinal,
  };
};

// ---------- sequências da fita (corridas) ----------

// Uma sequência que desenrola uma fita: marcos seguidos (um número por marco) ou um bloco de passos
// (I, II, III…). A fita entra com a sequência, corre até o fim quando ela acaba e fica na mesa até a
// próxima sequência começar.
export type Corrida = { id: string; tipo: "marco" | "passos"; ks: number[]; marcas: MarcaDaFita[]; entra: number; sai: number; some?: number };

export const numeroDoMarco = (m: Marco, posicao: number) => (m.numero?.trim() ? m.numero.trim() : String(posicao + 1));
export const numeroEmDo = (m: Marco) => m.numeroEm ?? m.de + 0.15;

export const montarCorridas = (plano: Plano, trechos: Trecho[]): Corrida[] => {
  const corridas: Corrida[] = [];
  trechos.forEach((tr, k) => {
    const m = tr.indice >= 0 ? plano.momentos[tr.indice] : null;
    if (!m) return;
    if (m.tipo === "marco") {
      const ultima = corridas[corridas.length - 1];
      if (ultima && ultima.tipo === "marco" && ultima.ks[ultima.ks.length - 1] === k - 1) ultima.ks.push(k);
      else corridas.push({ id: `f${corridas.length}`, tipo: "marco", ks: [k], marcas: [], entra: 0, sai: 0 });
    } else if (m.tipo === "passos") corridas.push({ id: `f${corridas.length}`, tipo: "passos", ks: [k], marcas: [], entra: 0, sai: 0 });
  });
  corridas.forEach((c, i) => {
    const primeiro = trechos[c.ks[0]];
    const ultimo = c.ks[c.ks.length - 1];
    if (c.tipo === "marco") {
      c.marcas = c.ks.map((k, pos) => {
        const m = plano.momentos[trechos[k].indice] as Marco;
        return { rotulo: numeroDoMarco(m, pos), em: numeroEmDo(m) };
      });
    } else {
      const m = plano.momentos[primeiro.indice];
      if (m.tipo === "passos") c.marcas = m.itens.slice(0, 5).map((it, j) => ({ rotulo: romano(j + 1), em: it.em }));
    }
    c.entra = Math.max(0, primeiro.troca + 0.1);
    c.sai = ultimo + 1 < trechos.length ? trechos[ultimo + 1].troca + 0.1 : plano.duracao + 10;
    if (i > 0) corridas[i - 1].some = c.entra;
  });
  return corridas;
};

// ---------- cartões da pilha ----------

export type Carta = { chave: string; k: number; indice: number; queda: number };

export const montarCartas = (plano: Plano, trechos: Trecho[]): Carta[] => {
  const cartas: Carta[] = [];
  trechos.forEach((tr, k) => {
    if (!naPilha(tr.modo) || tr.indice < 0) return;
    const m = plano.momentos[tr.indice];
    const antes = k > 0 ? trechos[k - 1] : null;
    const vemDeFora = antes ? !naPilha(antes.modo) && tr.troca > 0 : false;
    let minimo: number;
    if (k === 0) minimo = 0.55;
    // vindo do convite grande: o cartão entra por baixo do convite enquanto ele encolhe e já está
    // pousando quando a mesa aparece (nunca um quadro com a pessoa sozinha num fundo vazio)
    else if (vemDeFora) minimo = tr.troca + 0.22;
    else minimo = tr.troca + tr.dur * 0.3;
    const alvo = m.tipo === "marco" ? numeroEmDo(m) - 0.22 : minimo;
    cartas.push({ chave: `carta-${tr.indice}`, k, indice: tr.indice, queda: Math.max(alvo, minimo) });
  });
  return cartas;
};
