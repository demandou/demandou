// A gramática do Figurinha no quadro deitado (16:9, 1920×1080), em tempo: em que "cena" o vídeo
// está (quadro cheio, página do álbum, álbum, figurinha especial grande), onde fica a figurinha da
// pessoa em cada instante, as folhas (páginas) que viram e o roteiro de cada figurinha do álbum
// (chega na cartela, descola, cola, leva o carimbo, vai para a fileira).
// A composição é a da aula 9 do curso (editar uma aula horizontal):
//   - quadro cheio: a pessoa em tela cheia é a base (o vídeo deitado inteiro, como foi gravado);
//     as etiquetas de quadro cheio colam no peito, no terço de baixo, centradas no rosto;
//   - página, álbum e especial: a pessoa vira a figurinha especial numa MOLDURA do lado DIREITO
//     (sempre o mesmo lado no quadro deitado), com o rosto centralizado e acompanhado pelo rastro,
//     e o bloco é colado no QUADRO do lado ESQUERDO:
//       [ título e conteúdo colado (ou cachorro, figurinha da vez e fileira)  |  MOLDURA com o rosto ]
//   - terminada a ideia, ela volta à tela cheia.
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { type Album, type Item, type Momento, naPagina, type Plano } from "./plano";
import { BASE_UTIL, BORDA_ESPECIAL, ESPECIAL, ETIQUETA, FILEIRA, H, HEROI, MARGEM, MOLDURA, W, zona as zonaPadrao } from "./tema";

// duração das trocas de lugar da pessoa e quanto antes da fronteira elas começam
// (o corte que costuma ficar na fronteira cai no meio do movimento)
export const TROCA = 0.55;
const ANTES = 0.14;
const ANTES_DO_ITEM = 0.2;
// a página que vira: a nova desliza por cima da velha em VIRA s, centrada na fronteira
export const VIRA = 0.5;
// um intervalo de até 1,5 s entre dois momentos fica com a cena anterior
const ENCOSTA = 1.5;

export type Lado = "esquerda" | "direita";
export type TipoDeCena = "cheio" | "album" | "especial" | "pagina";
export type Cena = { de: number; tipo: TipoDeCena; lado?: Lado; momento?: Momento };

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

// No quadro deitado a pessoa fica sempre na moldura da DIREITA (a regra da aula 9). O campo `lados`
// do álbum continua aceito (o plano vale nas duas versões), mas não muda o lado aqui.
export const ladoDoItem = (_album: Album, _i: number, _plano: Plano): Lado => "direita";

// Nas páginas também: a pessoa à direita, o título e o conteúdo no quadro da esquerda.
export const ladoDaPagina = (_m: Momento, _plano: Plano): Lado => "direita";

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
export const fimDe = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

export const cenaDoMomento = (m: Momento): TipoDeCena =>
  m.tipo === "album" ? "album" : m.tipo === "especial" ? "especial" : naPagina(m) ? "pagina" : "cheio";
export const ehDePagina = (m: Momento | undefined) => !!m && cenaDoMomento(m) !== "cheio";

// Cenas: cada momento define a sua; um intervalo curto entre momentos (até 1,5 s) fica com a
// cena anterior, para a pessoa não ir e voltar à toa.
export const cenasDoPlano = (plano: Plano): Cena[] => {
  const cenas: Cena[] = [{ de: 0, tipo: "cheio" }];
  plano.momentos.forEach((m, i) => {
    const tipo = cenaDoMomento(m);
    if (m.tipo === "album") {
      m.itens.forEach((item, k) => {
        cenas.push({ de: k === 0 ? Math.min(m.de, item.em) : item.em - ANTES_DO_ITEM + ANTES, tipo, lado: ladoDoItem(m, k, plano), momento: m });
      });
      if (!m.itens.length) cenas.push({ de: m.de, tipo, lado: "esquerda", momento: m });
    } else if (tipo === "pagina") cenas.push({ de: m.de, tipo, lado: ladoDaPagina(m, plano), momento: m });
    else cenas.push({ de: m.de, tipo, momento: m });
    const proximo = plano.momentos[i + 1];
    const fim = fimDe(m, plano);
    if ((!proximo && fim < plano.duracao) || (proximo && proximo.de - m.ate > ENCOSTA)) cenas.push({ de: m.ate, tipo: "cheio" });
  });
  return cenas.sort((a, b) => a.de - b.de);
};

export const cenaEm = (t: number, cenas: Cena[]) => {
  let atual = cenas[0];
  for (const c of cenas) if (c.de - ANTES <= t) atual = c;
  return atual;
};

// ---------- a caixa da pessoa ----------

// Tela cheia: o vídeo deitado inteiro, como foi gravado (sem aproximar para centralizar o rosto).
export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom: 1, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// Enquadramento da pessoa nas figurinhas: o plano manda (`figurinhaDaPessoa`); sem ajuste, o zoom
// padrão é 1,4 (no quadro deitado a moldura já recorta uma faixa estreita do vídeo), e o rastro mede
// o rosto: o zoom vai até o rosto ocupar ~42% da largura da moldura, sem passar de 1,6.
export const ajusteDaPessoa = (plano: Plano, w: number, h: number) => {
  const ajuste = plano.figurinhaDaPessoa ?? {};
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  let zoom = ajuste.zoom ?? 1.4;
  let ancoraY = ajuste.rostoNaCaixa ?? 0.36;
  if (ajuste.zoom === undefined && largura && largura > 0) {
    const base = Math.max(w / W, h / H);
    // o rosto ocupa ~42% da largura da moldura
    zoom = Math.min(1.6, Math.max(1, (0.42 * w) / (largura * W * base)));
    if (ajuste.rostoNaCaixa === undefined && zoom < 1.15) ancoraY = 0.42;
  }
  return { zoom, ancoraY };
};

// a figurinha da pessoa na MOLDURA da direita (a mesma no álbum e nas páginas, com ou sem mascote)
const caixaDaMoldura = (plano: Plano): Caixa => {
  const w = MOLDURA.w - 2 * BORDA_ESPECIAL;
  const h = MOLDURA.h - 2 * BORDA_ESPECIAL;
  return { x: MOLDURA.x + BORDA_ESPECIAL, y: MOLDURA.y + BORDA_ESPECIAL, w, h, raio: 22, ...ajusteDaPessoa(plano, w, h) };
};

// figurinha da pessoa no álbum: na moldura da direita
export const caixaDoAlbum = (plano: Plano, _lado: Lado): Caixa => caixaDaMoldura(plano);

// figurinha da pessoa nas páginas: na moldura da direita (o título e o conteúdo ficam à esquerda)
export const caixaDaPagina = (plano: Plano, _lado: Lado): Caixa => caixaDaMoldura(plano);

// a linha do título nas páginas: no alto do quadro da esquerda
export const colunaDaPagina = (_lado: Lado) => ({ x: HEROI.x, w: HEROI.w });

// figurinha especial grande: a moldura cresce para a esquerda (acima da fileira do álbum)
export const caixaEspecial = (plano: Plano): Caixa => {
  const w = ESPECIAL.w - 2 * BORDA_ESPECIAL;
  const h = ESPECIAL.h - 2 * BORDA_ESPECIAL;
  const a = ajusteDaPessoa(plano, MOLDURA.w - 2 * BORDA_ESPECIAL, MOLDURA.h - 2 * BORDA_ESPECIAL);
  return {
    x: ESPECIAL.x + BORDA_ESPECIAL,
    y: ESPECIAL.y + BORDA_ESPECIAL,
    w,
    h,
    raio: 26,
    zoom: Math.max(1, a.zoom * 0.9),
    ancoraY: Math.max(0.3, a.ancoraY - 0.02),
  };
};

// inclinação de cada figurinha da pessoa (graus): leve, como colada à mão
const INCLINACAO = { cheio: 0, esquerda: -2.2, direita: 1.8, especial: -1 };

export type EstadoDaPessoa = EstadoDaCaixa & { inclinacao: number; figurinha: number };

export const estadosDaPessoa = (plano: Plano, cenas: Cena[]): EstadoDaPessoa[] => {
  const cheia = caixaCheia(plano);
  const estados: EstadoDaPessoa[] = [];
  let anterior: string | null = null;
  for (const c of cenas) {
    const chave = c.tipo === "album" || c.tipo === "pagina" ? `${c.tipo}-${c.lado}` : c.tipo;
    if (chave === anterior) continue;
    const de = anterior === null ? 0 : Math.max(0, c.de - ANTES);
    const dur = anterior === null ? 0.001 : TROCA;
    if (c.tipo === "cheio") estados.push({ de, caixa: cheia, dur, inclinacao: INCLINACAO.cheio, figurinha: 0 });
    if (c.tipo === "album") {
      const lado = c.lado ?? "esquerda";
      estados.push({ de, caixa: caixaDoAlbum(plano, lado), dur, inclinacao: plano.mascote === "nenhum" ? -1.5 : INCLINACAO[lado], figurinha: 1 });
    }
    if (c.tipo === "pagina") {
      const lado = c.lado ?? "direita";
      estados.push({ de, caixa: caixaDaPagina(plano, lado), dur, inclinacao: INCLINACAO[lado], figurinha: 1 });
    }
    if (c.tipo === "especial") estados.push({ de, caixa: caixaEspecial(plano), dur, inclinacao: INCLINACAO.especial, figurinha: 1 });
    anterior = chave;
  }
  // corte longe de uma troca: troca seca de enquadramento (aproxima 6%) para disfarçar o pulo
  const trocas = estados.slice(1).map((e) => e.de);
  for (const corte of plano.cortesEm ?? []) {
    if (trocas.some((d) => corte > d - 0.6 && corte < d + TROCA + 0.6)) continue;
    const antes = [...estados].sort((a, b) => a.de - b.de).filter((e) => e.de <= corte).pop();
    if (!antes) continue;
    const base = antes.caixa.zoom ?? 1;
    const ref = antes.figurinha ? (antes.caixa.zoom ?? 1) : cheia.zoom ?? 1;
    const aproximado = base > ref + 0.001;
    estados.push({ ...antes, de: corte, dur: 0.001, caixa: { ...antes.caixa, zoom: aproximado ? base / 1.06 : base * 1.06 } });
  }
  return estados.sort((a, b) => a.de - b.de);
};

// inclinação e "quanto é figurinha" (0 = quadro cheio, 1 = figurinha) no instante t,
// com a mesma curva da troca de caixa
export const extrasNoTempo = (t: number, estados: EstadoDaPessoa[]) => {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].de <= t) i = k;
  const agora = estados[i];
  if (i === 0) return { inclinacao: agora.inclinacao, figurinha: agora.figurinha };
  const antes = estados[i - 1];
  const x = Math.min(1, Math.max(0, (t - agora.de) / (agora.dur ?? TROCA)));
  const p = x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
  return {
    inclinacao: antes.inclinacao + (agora.inclinacao - antes.inclinacao) * p,
    figurinha: antes.figurinha + (agora.figurinha - antes.figurinha) * p,
  };
};

// ---------- as folhas (páginas do álbum) ----------

// Cada página é uma folha de papel opaca. Quando uma página vem logo depois de outra, a nova
// desliza da direita por cima da velha (a página vira): as duas nunca aparecem uma através da outra.
// O especial logo depois de um álbum fica na mesma folha (a fileira continua embaixo).
export type Folha = {
  momentos: Momento[];
  // quando a folha passa a existir e quando some
  entra: number;
  sai: number;
  // true = entra virando (desliza por cima da folha anterior)
  vira: boolean;
  // quando o conteúdo começa a aparecer (vindo do quadro cheio) e quando apaga (indo para ele)
  aparece: number;
  apaga: number | null;
};

export const folhasDoPlano = (plano: Plano): Folha[] => {
  const folhas: Folha[] = [];
  const ms = plano.momentos;
  ms.forEach((m, i) => {
    if (!ehDePagina(m)) return;
    const antes = ms[i - 1];
    const encostaAntes = !!antes && ehDePagina(antes) && m.de - antes.ate <= ENCOSTA;
    const atual = folhas[folhas.length - 1];
    // especial logo depois de um álbum: continua a mesma folha
    if (m.tipo === "especial" && encostaAntes && atual && atual.momentos[atual.momentos.length - 1] === antes && antes.tipo === "album") {
      atual.momentos.push(m);
      return;
    }
    folhas.push({
      momentos: [m],
      entra: encostaAntes ? m.de - VIRA / 2 : m.de - ANTES,
      sai: Infinity,
      vira: encostaAntes,
      aparece: encostaAntes ? m.de - VIRA / 2 : m.de - 0.05,
      apaga: null,
    });
  });
  // a saída de cada folha: coberta pela seguinte (que vira por cima) ou apagada sob a pessoa que cresce
  folhas.forEach((f, k) => {
    const ultimo = f.momentos[f.momentos.length - 1];
    const proxima = folhas[k + 1];
    if (proxima?.vira) f.sai = proxima.entra + VIRA + 0.05;
    else {
      const fim = fimDe(ultimo, plano);
      // fica até a pessoa quase cobrir a tela (nada de pessoa solta num papel vazio) e apaga
      // antes de a etiqueta seguinte entrar (nada de texto sobre texto)
      f.apaga = fim + 0.2;
      f.sai = fim + 0.8;
    }
  });
  return folhas;
};

// Momentos de quadro cheio que vêm logo depois de uma página: a etiqueta espera a pessoa crescer
// por cima da página (assim nada de texto fica sobre texto)
export const atrasoDaEtiqueta = (m: Momento, plano: Plano) => {
  const i = plano.momentos.indexOf(m);
  const antes = plano.momentos[i - 1];
  if (!antes || !ehDePagina(antes) || m.de - antes.ate > ENCOSTA) return 0;
  // da figurinha especial (que já cobre quase tudo) a pessoa cresce rápido
  return antes.tipo === "especial" ? 0.12 : 0.3;
};

// ---------- as figurinhas do álbum ----------

export type RoteiroDoItem = {
  item: Item;
  indice: number;
  // a cartela chega
  chega: number;
  // o canto começa a descolar
  descola: number;
  // a figurinha sobe da cartela
  sobe: number;
  // a figurinha assenta na página
  cola: number;
  carimbo: number | null;
  // tipo e texto do carimbo deste item
  tipoCarimbo: "nao" | "pode";
  textoCarimbo?: string;
  // vai para a casa do álbum (fileira)
  guarda: number;
};

export const roteiroDoAlbum = (album: Album, fim: number): RoteiroDoItem[] =>
  album.itens.map((item, i) => {
    const proximo = album.itens[i + 1];
    const chega = item.em - 0.2;
    const guarda = proximo ? proximo.em - 0.18 : fim - 0.1;
    const tipo = item.carimbo ?? album.carimbo ?? "nao";
    return {
      item,
      indice: i,
      chega,
      descola: chega + 0.42,
      sobe: chega + 0.72,
      cola: chega + 1.1,
      carimbo: tipo === "nenhum" ? null : (item.carimboEm ?? null),
      tipoCarimbo: tipo === "pode" ? "pode" : "nao",
      textoCarimbo: item.textoCarimbo ?? album.textoCarimbo,
      guarda,
    };
  });

// casa i da fileira do álbum (n casas), no quadro da esquerda
export const casaDaFileira = (i: number, n: number) => {
  const casas = Math.max(n, 1);
  const w = Math.min(320, (FILEIRA.w - FILEIRA.gap * (casas - 1)) / casas);
  const total = casas * w + FILEIRA.gap * (casas - 1);
  return { x: FILEIRA.x + (FILEIRA.w - total) / 2 + i * (w + FILEIRA.gap), y: FILEIRA.y, w, h: FILEIRA.h };
};

export { HEROI };

// ---------- a faixa do peito (etiquetas de quadro cheio) ----------

// As etiquetas de quadro cheio colam no peito, no terço de baixo: terminam na base útil e nunca
// sobem acima de `topo` (logo abaixo do queixo, lido da `zona` do plano). `cx` é o centro do rosto
// na tela cheia: a etiqueta fica centrada nele (sem sair das margens).
export type Faixa = { topo: number; base: number; cx: number };
const entre = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const faixaDoPeito = (plano: Plano): Faixa => {
  const z = { ...zonaPadrao, ...plano.zona };
  return { topo: entre(z.topo - 40, ETIQUETA.topoMin, ETIQUETA.topoMax), base: BASE_UTIL, cx: entre(plano.rosto.x, 0, 1) * W };
};
// a borda esquerda de uma peça de largura `w` centrada em `cx`, dentro das margens
export const xCentrado = (cx: number, w: number) => entre(cx - w / 2, MARGEM, W - MARGEM - w);
// o rosto fica à direita do meio da peça? (o cachorro espia do outro lado)
export const rostoADireita = (cx: number, x: number, w: number) => cx > x + w / 2;
