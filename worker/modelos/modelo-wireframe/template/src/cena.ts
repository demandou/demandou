// A gramática do Wireframe, em tempo: quando a pessoa está em quadro cheio e quando vira o
// comentário fixado no canvas; e o estado da página do celular a cada instante (rolagem, parede
// de texto, promessa, botão, cor da marca, avisos). Tudo sai dos momentos do plano.
import { interpolate } from "remotion";
import { mix, prog, viagem } from "./anim";
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import type { Conserto, Erro, Momento, Pagina, Plano, Resultado, TipoErro, TipoPasso } from "./plano";
import { ALTURA_VISIVEL, H, PINO, W } from "./tema";

// ——— Ordem e janelas do canvas ———

// momentos que mostram o celular em wireframe
export const ehCelular = (m: Momento) => m.tipo === "revisao" || m.tipo === "conserto" || m.tipo === "resultado";
// momentos que mostram um frame de design no lugar do celular (blocos universais)
export const ehFrame = (m: Momento) => m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico";
export const ehCanvas = (m: Momento) => ehCelular(m) || ehFrame(m);

// Ajuste de segurança: um momento nunca invade o seguinte.
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

// duração da troca de quadro (a pessoa encolhe para o pino / cresce de volta)
export const TROCA = 0.6;

export type JanelaCanvas = { de: number; ate: number; entra: number; sai: number };

// Momentos de canvas seguidos (com menos de 0,8 s entre eles) formam uma janela só: a pessoa
// fica no pino o tempo todo e o celular continua de um momento para o outro.
export const janelasDoCanvas = (plano: Plano): JanelaCanvas[] => {
  const janelas: JanelaCanvas[] = [];
  for (const m of plano.momentos) {
    if (!ehCanvas(m)) continue;
    const ultima = janelas[janelas.length - 1];
    if (ultima && m.de - ultima.ate < 0.8) ultima.ate = m.ate;
    else janelas.push({ de: m.de, ate: m.ate, entra: 0, sai: 0 });
  }
  return janelas.map((j) => ({
    ...j,
    // começa a encolher um pouco antes: o corte que costuma ficar na fronteira cai no meio do movimento
    entra: Math.max(0, j.de - 0.2),
    sai: j.ate >= plano.duracao - 0.3 ? plano.duracao + 1 : j.ate - 0.12,
  }));
};

// 0 = quadro cheio, 1 = canvas montado
export const presencaCanvas = (t: number, janelas: JanelaCanvas[]) => {
  let v = 0;
  for (const j of janelas) {
    if (t < j.entra || t > j.sai + TROCA) continue;
    const dentro = prog(t, j.entra, TROCA, viagem);
    const fora = prog(t, j.sai, TROCA, viagem);
    v = Math.max(v, dentro - fora);
  }
  return Math.max(0, Math.min(1, v));
};

export const janelaAtiva = (t: number, janelas: JanelaCanvas[]) =>
  janelas.find((j) => t >= j.entra - 0.02 && t <= j.sai + TROCA + 0.02);

// ——— A caixa da pessoa ———

// Quadro cheio: o menor zoom que deixa o rosto na linha do centro sem borda vazia (até 1,25)
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

export const caixaPino = (zoom = PINO.zoom): Caixa => ({
  x: PINO.x,
  y: PINO.y,
  w: PINO.w,
  h: PINO.h,
  raio: PINO.raio,
  zoom,
  ancoraY: PINO.ancoraY,
});

// Estados da caixa da pessoa. Corte longe de uma troca ganha uma troca seca de enquadramento
// (quadro cheio 1 ↔ 1,06; no pino 1,72 ↔ 1,84) para disfarçar o pulo.
export const estadosDaPessoa = (plano: Plano, janelas: JanelaCanvas[]): EstadoDaCaixa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaCaixa[] = [{ de: 0, caixa: cheia, dur: 0.001 }];
  for (const j of janelas) {
    estados.push({ de: j.entra, caixa: caixaPino(), dur: TROCA });
    if (j.sai < plano.duracao) estados.push({ de: j.sai, caixa: cheia, dur: TROCA });
  }
  const perto = (c: number) => janelas.some((j) => Math.abs(c - j.entra) < 0.75 || Math.abs(c - j.sai) < 0.75);
  for (const c of plano.cortesEm ?? []) {
    if (perto(c)) continue;
    const noCanvas = janelas.some((j) => c > j.entra && c < j.sai);
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= c).pop();
    const z = antes?.caixa.zoom ?? 1;
    if (noCanvas) {
      estados.push({ de: c, caixa: caixaPino(z > PINO.zoom + 0.01 ? PINO.zoom : PINO.zoom * 1.07), dur: 0.001 });
    } else {
      const base = cheia.zoom ?? 1;
      estados.push({ de: c, caixa: { ...cheia, zoom: z > base + 0.001 ? base : base * 1.06 }, dur: 0.001 });
    }
  }
  return estados.sort((a, b) => a.de - b.de);
};

// ——— A página do celular ———

export const PAGINA_PADRAO: Required<Pagina> = {
  nome: "Página inicial",
  marca: "Sua marca",
  tituloAntes: "Bem-vindo ao nosso site oficial",
  promessa: "Resolva isso em uma frase.",
  botao: "Comprar agora",
  apoio: "Sem fidelidade. Cancele quando quiser.",
  ilustracao: "produto",
  cor: "#FFD95A",
  tinta: "#17130E",
  palavras: 148,
  rolagem: 1810,
  pesoAntes: "4,8 MB",
  pesoDepois: "180 KB",
  links: 9,
};

export const paginaDoPlano = (plano: Plano): Required<Pagina> => ({ ...PAGINA_PADRAO, ...(plano.pagina ?? {}) });

// Geometria da página (unidades de 390 de largura)
export const PG = {
  nav: { y: 52, h: 46 },
  tituloAntes: { y: 146, h: 64 },
  parede: { y: 262, linhas: 12, passo: 21 },
  imagemAntes: { y: 562, h: 200 },
  // o resto da página em wireframe começa aqui
  resto: 790,
  botaoAntes: { y: 1810, h: 58 },
  altura: 2060,
  // depois do conserto
  promessa: { y: 146 },
  vaga: { y: 284, h: 62 },
  imagemDepois: { y: 380, h: 300 },
  apoio: { y: 708 },
  margem: 20,
};
// rolagem (unidades da página) que mostra o botão escondido na parte de baixo da tela
export const ROLAGEM_BOTAO = PG.botaoAntes.y - ALTURA_VISIVEL * 0.62;

// qual passo do conserto fecha cada tipo de erro
export const PASSO_DO_ERRO: Record<TipoErro, TipoPasso> = {
  texto: "promessa",
  botao: "botao",
  contraste: "contraste",
  imagem: "imagem",
  menu: "menu",
};
const TIPOS_DE_PASSO: TipoPasso[] = ["promessa", "botao", "contraste", "imagem", "menu"];

export type ErroNumerado = Erro & { n: number; resolvidoEm: number };
export type Aviso = { em: number; texto: string; detalhe?: string };

export type CartaoInspetor =
  | { tipo: "erro"; erro: TipoErro }
  | { tipo: "ok"; passo: TipoPasso }
  // qualquer assunto: cartão com rótulo e (opcional) valor e texto, sem medir a página
  | { tipo: "livre"; ok: boolean; rotulo: string; valor?: string; texto?: string }
  | { tipo: "resultado"; rotulo: string; total: number; itens: number[] };

export type Linha = {
  erros: ErroNumerado[];
  // instante de cada transformação da página (Infinity = não acontece)
  passos: Record<TipoPasso, number>;
  // passos que o plano pediu (os outros acontecem junto com o último, sem cartão no inspetor)
  pedidos: Set<TipoPasso>;
  avisos: Aviso[];
  toqueEm: number;
  rolagens: { t: number; alvo: number; dur: number }[];
  inspetor: { t: number; cartao: CartaoInspetor }[];
  // quando as medidas de espaçamento saem
  fimMedidas: number;
  inicioResultado: number;
};

export const montarLinha = (plano: Plano): Linha => {
  const erros = plano.momentos
    .flatMap((m) => (m.tipo === "revisao" ? m.erros : []))
    .sort((a, b) => a.em - b.em);
  const consertos = plano.momentos.filter((m): m is Conserto => m.tipo === "conserto");
  const resultados = plano.momentos.filter((m): m is Resultado => m.tipo === "resultado");
  const passosPedidos = consertos.flatMap((c) => c.passos).sort((a, b) => a.em - b.em);

  const passos = Object.fromEntries(TIPOS_DE_PASSO.map((p) => [p, Infinity])) as Record<TipoPasso, number>;
  const pedidos = new Set<TipoPasso>();
  for (const p of passosPedidos) {
    if (!pedidos.has(p.tipo)) passos[p.tipo] = p.em;
    pedidos.add(p.tipo);
  }
  // o que não tem passo próprio acontece com o último passo (ou no começo do resultado)
  const ultimo = passosPedidos.length
    ? passosPedidos[passosPedidos.length - 1].em
    : resultados.length
      ? resultados[0].de - 0.1
      : consertos.length
        ? consertos[0].de + 0.2
        : Infinity;
  for (const tipo of TIPOS_DE_PASSO) if (!pedidos.has(tipo)) passos[tipo] = ultimo;

  const numerados: ErroNumerado[] = erros.map((e, i) => ({ ...e, n: i + 1, resolvidoEm: passos[PASSO_DO_ERRO[e.tipo]] }));

  const avisos = resultados.flatMap((r) => r.itens).sort((a, b) => a.em - b.em).slice(0, 3);
  const inicioResultado = resultados.length ? resultados[0].de : Infinity;
  const toqueEm = avisos.length ? avisos[0].em - 0.28 : Infinity;

  // rolagem: o erro do botão desce até ele; qualquer outro evento volta para o topo
  const rolagens: Linha["rolagens"] = [];
  for (const e of erros) {
    if (e.tipo === "botao") rolagens.push({ t: e.em - 0.1, alvo: ROLAGEM_BOTAO, dur: 0.95 });
    else rolagens.push({ t: e.em - 0.32, alvo: 0, dur: 0.55 });
  }
  if (consertos.length) rolagens.push({ t: consertos[0].de - 0.3, alvo: 0, dur: 0.55 });
  else if (resultados.length) rolagens.push({ t: resultados[0].de - 0.3, alvo: 0, dur: 0.55 });
  rolagens.sort((a, b) => a.t - b.t);

  // erro com `medida` própria: o inspetor mostra o cartão livre (e o conserto dele também)
  const erroDoPasso = (tipo: TipoPasso) => erros.find((e) => PASSO_DO_ERRO[e.tipo] === tipo);
  const cartaoErro = (e: Erro): CartaoInspetor =>
    e.medida === undefined
      ? { tipo: "erro", erro: e.tipo }
      : { tipo: "livre", ok: false, rotulo: e.rotulo, valor: e.medida === false ? undefined : e.medida.valor, texto: e.medida === false ? undefined : e.medida.texto };
  const cartaoPasso = (p: Conserto["passos"][number]): CartaoInspetor => {
    const e = erroDoPasso(p.tipo);
    if (p.medida !== undefined)
      return { tipo: "livre", ok: true, rotulo: p.rotulo ?? e?.rotulo ?? "Resolvido", valor: p.medida === false ? undefined : p.medida.valor, texto: p.medida === false ? undefined : p.medida.texto };
    if (e && e.medida !== undefined) return { tipo: "livre", ok: true, rotulo: p.rotulo ?? e.rotulo, valor: undefined, texto: "resolvido" };
    return { tipo: "ok", passo: p.tipo };
  };
  const inspetor: Linha["inspetor"] = [
    ...erros.map((e) => ({ t: e.em - 0.05, cartao: cartaoErro(e) })),
    ...passosPedidos.map((p) => ({ t: p.em, cartao: cartaoPasso(p) })),
  ];
  if (resultados.length && avisos.length) {
    inspetor.push({
      t: avisos[0].em - 0.08,
      cartao: { tipo: "resultado", rotulo: resultados[0].rotulo ?? "Pedidos", total: avisos.length, itens: avisos.map((a) => a.em) },
    });
  }
  inspetor.sort((a, b) => a.t - b.t);

  const botaoEm = passos.botao;
  const fimMedidas = Math.min(inicioResultado - 0.1, botaoEm + 3.2);

  return { erros: numerados, passos, pedidos, avisos, toqueEm, rolagens, inspetor, fimMedidas, inicioResultado };
};

// Rolagem da página (unidades da página) no instante t
export const rolagemEm = (t: number, linha: Linha) => {
  const segs = linha.rolagens;
  const inicio: number[] = [];
  const valor = (i: number, tt: number) => mix(inicio[i], segs[i].alvo, prog(tt, segs[i].t, segs[i].dur, viagem));
  for (let i = 0; i < segs.length; i++) inicio[i] = i === 0 ? 0 : valor(i - 1, segs[i].t);
  let atual = -1;
  for (let i = 0; i < segs.length; i++) if (t >= segs[i].t) atual = i;
  return atual < 0 ? 0 : valor(atual, t);
};

export type EstadoPagina = {
  rolagem: number;
  // 0 = parede de texto inteira, 1 = recolhida
  parede: number;
  // a página sobe para ocupar o lugar da parede
  reflow: number;
  // quando cada palavra da promessa vira texto (Infinity = ainda não)
  promessaEm: number[];
  // as barras cinzas da promessa (esboço) aparecem
  esbocoPromessa: number;
  // 0 = botão lá embaixo, 1 = logo abaixo da promessa
  botao: number;
  // a vaga tracejada do botão (esboço a lápis), antes de ele chegar
  vaga: number;
  // 0 = cinza, 1 = cor da marca (a onda sai do botão)
  cor: number;
  imagem: number;
  menu: number;
  medidas: number;
  toque: number;
};

export const estadoDaPagina = (t: number, linha: Linha, pagina: Required<Pagina>): EstadoPagina => {
  const P = linha.passos.promessa;
  const B = linha.passos.botao;
  const C = linha.passos.contraste;
  const palavras = pagina.promessa.split(/\s+/).filter(Boolean);
  // as palavras da promessa entram em sequência logo depois que a parede some
  const fimPromessa = Math.min(P + 1.45, Math.min(B, C) - 0.15);
  const passo = Math.max(0.09, Math.min(0.2, (fimPromessa - (P + 0.38)) / Math.max(1, palavras.length)));
  const promessaEm = palavras.map((_, i) => (Number.isFinite(P) ? P + 0.38 + i * passo : Infinity));
  return {
    rolagem: rolagemEm(t, linha),
    parede: prog(t, P - 0.05, 0.42, viagem),
    reflow: prog(t, P + 0.12, 0.55, viagem),
    promessaEm,
    esbocoPromessa: prog(t, P + 0.18, 0.2),
    botao: prog(t, B - 0.04, 0.62, viagem),
    vaga: Math.min(prog(t, P + 0.5, 0.3), 1 - prog(t, B + 0.3, 0.2)),
    cor: prog(t, C - 0.04, 0.62, viagem),
    imagem: prog(t, linha.passos.imagem + (linha.pedidos.has("imagem") ? 0 : 0.12), 0.5),
    menu: prog(t, linha.passos.menu + (linha.pedidos.has("menu") ? 0 : 0.1), 0.45),
    medidas: Math.min(prog(t, B + 0.55, 0.35), 1 - prog(t, linha.fimMedidas - 0.3, 0.3)),
    toque: Number.isFinite(linha.toqueEm) ? interpolate(t, [linha.toqueEm, linha.toqueEm + 0.55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0,
  };
};

// Quantos problemas estão abertos (para o contador do canvas)
export const problemasAbertos = (t: number, linha: Linha) =>
  linha.erros.filter((e) => t >= e.em && t < e.resolvidoEm + 0.2).length;

// Quando um cartão de quadro cheio pode entrar: se a pessoa ainda está crescendo de volta do pino
// (fim de um trecho de canvas), espera ela quase cobrir a tela, para o cartão não cair sobre o canvas.
export const inicioVisual = (de: number, janelas: JanelaCanvas[]) => {
  let inicio = de;
  for (const j of janelas) {
    const cheia = j.sai + TROCA * 0.6;
    if (j.sai < de + 0.5 && cheia > de) inicio = Math.max(inicio, cheia);
  }
  return inicio;
};
