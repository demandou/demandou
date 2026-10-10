// A gramática do Figurinha, em tempo: em que "cena" o vídeo está (quadro cheio, página do álbum,
// álbum, figurinha especial grande), onde fica a figurinha da pessoa em cada instante, as folhas
// (páginas) que viram e o roteiro de cada figurinha do álbum (chega na cartela, descola, cola,
// leva o carimbo, vai para a fileira).
import type { Caixa, EstadoDaCaixa } from "./motor/caixa";
import { type Album, type Item, type Momento, naPagina, type Plano } from "./plano";
import { BORDA_ESPECIAL, FILEIRA, H, HEROI, MARGEM_ALBUM, PESSOA_ALBUM, PESSOA_PAGINA, W } from "./tema";

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

export const ladoDoItem = (album: Album, i: number, plano: Plano): Lado => {
  if (plano.mascote === "nenhum") return "esquerda";
  return album.lados?.[i] ?? (i % 2 === 0 ? "esquerda" : "direita");
};

// Nas páginas, a pessoa troca de lado a cada página (a primeira fica à direita)
export const ladoDaPagina = (m: Momento, plano: Plano): Lado => {
  const k = plano.momentos.filter(naPagina).indexOf(m);
  return k % 2 === 0 ? "direita" : "esquerda";
};

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

export const caixaCheia = (plano: Plano): Caixa => {
  const videoAltura = Math.min(H, plano.videoAltura ?? H);
  const fx = plano.rosto.x;
  const zoom = Math.min(1.25, Math.max(1, 0.5 / Math.max(0.01, Math.min(fx, 1 - fx))));
  return { x: 0, y: 0, w: W, h: videoAltura, raio: 0, zoom, ancoraY: (plano.rosto.y * H) / videoAltura };
};

// Enquadramento da pessoa nas figurinhas: o plano manda (`figurinhaDaPessoa`); sem ajuste, o zoom
// padrão é 1,6, mas uma gravação bem perto da câmera (rosto largo, medido pelo rastro) aproxima menos,
// para a cabeça caber na moldura.
export const ajusteDaPessoa = (plano: Plano, w: number, h: number) => {
  const ajuste = plano.figurinhaDaPessoa ?? {};
  const largura = (plano.rosto as { rastro?: { largura?: number } }).rastro?.largura;
  let zoom = ajuste.zoom ?? 1.6;
  let ancoraY = ajuste.rostoNaCaixa ?? 0.36;
  if (ajuste.zoom === undefined && largura && largura > 0) {
    const base = Math.max(w / W, h / H);
    // o rosto ocupa ~42% da largura da moldura
    zoom = Math.min(1.6, Math.max(1, (0.42 * w) / (largura * W * base)));
    if (ajuste.rostoNaCaixa === undefined && zoom < 1.15) ancoraY = 0.42;
  }
  return { zoom, ancoraY };
};

// figurinha da pessoa no alto da página do álbum (na coluna do lado; sem mascote, no meio)
export const caixaDoAlbum = (plano: Plano, lado: Lado): Caixa => {
  const semMascote = plano.mascote === "nenhum";
  const largura = semMascote ? 660 : PESSOA_ALBUM.w;
  const x = semMascote ? (W - largura) / 2 : lado === "esquerda" ? MARGEM_ALBUM : W - MARGEM_ALBUM - largura;
  const w = largura - 2 * BORDA_ESPECIAL;
  const h = PESSOA_ALBUM.h - 2 * BORDA_ESPECIAL;
  return { x: x + BORDA_ESPECIAL, y: PESSOA_ALBUM.y + BORDA_ESPECIAL, w, h, raio: 22, ...ajusteDaPessoa(plano, w, h) };
};

// figurinha da pessoa nas páginas: menor, no alto, de um lado (o título fica do outro)
export const caixaDaPagina = (plano: Plano, lado: Lado): Caixa => {
  const x = lado === "esquerda" ? MARGEM_ALBUM : W - MARGEM_ALBUM - PESSOA_PAGINA.w;
  const w = PESSOA_PAGINA.w - 2 * BORDA_ESPECIAL;
  const h = PESSOA_PAGINA.h - 2 * BORDA_ESPECIAL;
  return { x: x + BORDA_ESPECIAL, y: PESSOA_PAGINA.y + BORDA_ESPECIAL, w, h, raio: 22, ...ajusteDaPessoa(plano, w, h) };
};

// a coluna do título nas páginas: do lado oposto ao da pessoa
export const colunaDaPagina = (lado: Lado) => {
  const largura = W - 2 * MARGEM_ALBUM - PESSOA_PAGINA.w - 44;
  return { x: lado === "esquerda" ? MARGEM_ALBUM + PESSOA_PAGINA.w + 44 : MARGEM_ALBUM + 12, w: largura - 12 };
};

// figurinha especial grande, no meio da página (acima da fileira do álbum)
export const caixaEspecial = (plano: Plano): Caixa => {
  const w = 880 - 2 * BORDA_ESPECIAL;
  const h = FILEIRA.y - 46 - 140 - 2 * BORDA_ESPECIAL;
  const a = ajusteDaPessoa(plano, 520, 650);
  return {
    x: 100 + BORDA_ESPECIAL,
    y: 140 + BORDA_ESPECIAL,
    w,
    h,
    raio: 26,
    zoom: Math.max(1, a.zoom * 0.66),
    ancoraY: Math.max(0.26, a.ancoraY - 0.04),
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

// casa i da fileira do álbum (n casas)
export const casaDaFileira = (i: number, n: number) => {
  const casas = Math.max(n, 1);
  const largura = W - 2 * MARGEM_ALBUM;
  const w = Math.min(340, (largura - FILEIRA.gap * (casas - 1)) / casas);
  const total = casas * w + FILEIRA.gap * (casas - 1);
  return { x: (W - total) / 2 + i * (w + FILEIRA.gap), y: FILEIRA.y, w, h: FILEIRA.h };
};

export { HEROI };
