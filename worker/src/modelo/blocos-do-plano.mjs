/**
 * O PLANO EM BLOCOS (10/10/2026): o vídeo COMPLETO num modelo do curso.
 *
 * O fluxo do curso escreve o plano de um vídeo numa chamada só. Num corte de
 * 50 s isso é o certo; num completo de 15 a 20 min, não: a resposta passaria
 * do teto de saída e a mão se perderia no meio. Então o plano é escrito em
 * BLOCOS de ~150 s (o mesmo alvo do diretor do completo de antes,
 * lib/media/montagem-do-completo.ts, blocosDaFala), cortados na maior pausa
 * da fala perto do alvo. Cada bloco é uma chamada ao redator do app, com o
 * treinamento do modelo no cache e o FIM do bloco anterior como contexto; o
 * redator vê um vídeo curto que começa no zero, como no corte (os tempos do
 * bloco), e aqui os momentos voltam ao tempo do vídeo inteiro.
 *
 * Tudo aqui é puro (sem disco, sem rede): testado em scripts/testes.
 */

/** Alvo de fala por bloco (s): o mesmo do diretor do completo. */
export const BLOCO_ALVO_SEG = 150;
/** Voltas de conserto por bloco reprovado (na conferência e na revisão dos quadros). */
export const VOLTAS_POR_BLOCO = 2;
/** Acima disto (s de vídeo cortado) o plano é escrito em blocos; abaixo, numa chamada, como no corte. */
export const LIMIAR_DOS_BLOCOS_SEG = BLOCO_ALVO_SEG * 1.4;

const r3 = (t) => +Number(t).toFixed(3);

/**
 * Os blocos da fala ([{em, ate, w}] no tempo do vídeo cortado): ~`alvo` s cada,
 * cortados na MAIOR pausa entre palavras numa faixa de ±40 s em volta do alvo
 * (fim de frase vale 0,3 s a mais). O último bloco absorve a sobra curta. A
 * borda cai no meio da pausa: nenhuma palavra fica sem bloco nem em dois.
 * Devolve [{ indice, de, ate (índices das palavras, inclusivos), inicio, fim (s) }].
 */
export function blocosDoPlano(palavras, duracao, alvo = BLOCO_ALVO_SEG) {
  const n = palavras?.length ?? 0;
  if (!n) return [{ indice: 0, de: 0, ate: -1, inicio: 0, fim: r3(duracao) }];
  const blocos = [];
  let de = 0;
  while (de < n) {
    const t0 = palavras[de].em;
    let ate = n - 1;
    if (palavras[n - 1].ate - t0 > alvo * 1.4) {
      let melhor = -1;
      let maiorPausa = -1;
      for (let k = de + 1; k < n; k++) {
        const t = palavras[k].em - t0;
        if (t < alvo - 40) continue;
        if (t > alvo + 40) break;
        const pausa = palavras[k].em - palavras[k - 1].ate + (/[.!?]$/.test(palavras[k - 1].w) ? 0.3 : 0);
        if (pausa > maiorPausa) {
          maiorPausa = pausa;
          melhor = k;
        }
      }
      if (melhor > de) ate = melhor - 1;
    }
    blocos.push({ indice: blocos.length, de, ate, inicio: 0, fim: 0 });
    de = ate + 1;
  }
  blocos.forEach((b, i) => {
    b.inicio = i === 0 ? 0 : r3((palavras[b.de - 1].ate + palavras[b.de].em) / 2);
    b.fim = i === blocos.length - 1 ? r3(duracao) : r3((palavras[b.ate].ate + palavras[b.ate + 1].em) / 2);
  });
  return blocos;
}

const CHAVE_DE_TEMPO = (k) => k === "de" || k === "ate" || k === "em" || /Em$/.test(k);
const LISTA_DE_TEMPOS = (k) => k === "batidas" || /Ems$/.test(k);

/**
 * Desloca todos os tempos de um momento (ou de qualquer parte do plano) por
 * `delta` segundos. Tempo é o que o curso chama de tempo: `de`, `ate`, `em` e
 * todo campo terminado em `Em` (riscoEm, notaEm, vencedorEm...), em qualquer
 * nível, e as listas de instantes (`batidas`). O resto (tamanho, valor, zoom,
 * quantas...) fica como está.
 */
export function deslocarTempos(valor, delta, chave = "") {
  if (Array.isArray(valor)) return valor.map((x) => (typeof x === "number" && LISTA_DE_TEMPOS(chave) ? r3(x + delta) : deslocarTempos(x, delta, chave)));
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, x]) => [k, typeof x === "number" && CHAVE_DE_TEMPO(k) ? r3(x + delta) : deslocarTempos(x, delta, k)]));
  }
  return valor;
}

/**
 * O esqueleto de um bloco, como o redator vê um corte: a fala do bloco, a
 * duração dele e os cortes dentro dele, no tempo do bloco (começa no zero).
 * Rosto, zona, quadro e fps são os do vídeo inteiro.
 * `idsDasImagens` (10/10, o passo 6b em blocos): o plano.imagens do bloco fica
 * só com estes ids (as imagens do trecho dele e as do cliente); sem a lista,
 * o plano.imagens vai como está.
 */
export function esqueletoDoBloco(esqueleto, b, idsDasImagens = null) {
  const desl = (t) => r3(t - b.inicio);
  const palavras = (esqueleto.palavras ?? []).slice(b.de, b.ate + 1).map((p) => ({ ...p, em: desl(p.em), ate: desl(p.ate) }));
  const cortesEm = (esqueleto.cortesEm ?? []).filter((c) => c > b.inicio + 0.01 && c < b.fim - 0.01).map(desl);
  const saida = { ...esqueleto, duracao: r3(b.fim - b.inicio), palavras, cortesEm };
  if (Array.isArray(esqueleto.enquadramentos)) {
    saida.enquadramentos = esqueleto.enquadramentos.filter((e) => e.ate > b.inicio && e.de < b.fim).map((e) => deslocarTempos({ ...e, de: Math.max(e.de, b.inicio), ate: Math.min(e.ate, b.fim) }, -b.inicio));
  }
  if (idsDasImagens && esqueleto.imagens && typeof esqueleto.imagens === "object") saida.imagens = imagensDoBloco(esqueleto.imagens, idsDasImagens);
  return saida;
}

/**
 * O PASSO DAS IMAGENS NO COMPLETO (10/10/2026). No corte, o passo 6b do curso
 * (references/imagens.md) roda uma vez: o mapa e a lista de imagens, o
 * scripts/imagens.mjs busca e monta a folha numerada, a escolha olhando a
 * folha, e o plano usa `imagem: { id, efeito }` com os ids que o script gravou
 * em plano.imagens. No completo, o plano é escrito por trecho de ~150 s; o
 * passo 6b também: cada trecho faz o mapa e os pedidos dele (no tempo dele),
 * todos os pedidos vão juntos para um work/imagens.json só (o script trabalha
 * no projeto inteiro e grava plano.imagens inteiro), a escolha de cada trecho
 * olha só as folhas dos pedidos dele, e o plano de cada trecho recebe só as
 * imagens dele (mais as do cliente, que valem no vídeo todo).
 */

/** O id como o imagens.mjs do curso grava (sem acento, minúsculo, hífen no lugar do resto). */
export function idDaImagem(id) {
  return String(id ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/ /g, "-");
}

/**
 * Os pedidos de imagem de todos os trechos num work/imagens.json só. `listas[k]`:
 * os pedidos do bloco k no tempo dele ({ id, em, palavra, busca, tipo }).
 * `fixos`: os pedidos do material do cliente (o par da Transformação), que
 * entram primeiro e valem para todos os trechos. O `em` volta ao tempo do
 * vídeo inteiro; pedido fora do trecho sai; id repetido entre trechos ganha o
 * número do trecho ("mel" no trecho 1, "mel-3" no trecho 3), porque o script
 * exige id único e grava a imagem em public/img/<id>. Os pedidos ficam em
 * ordem de trecho (a folha numerada de cada trecho fica junta).
 * Devolve { pedidos, porBloco (os ids de cada trecho), comuns (os ids fixos) }.
 */
export function juntarPedidosDasImagens(blocos, listas, fixos = []) {
  const usados = new Set();
  const pedidos = [];
  const comuns = [];
  for (const p of fixos ?? []) {
    const id = idDaImagem(p?.id);
    if (!id || usados.has(id)) continue;
    usados.add(id);
    pedidos.push({ ...p, id });
    comuns.push(id);
  }
  const porBloco = blocos.map(() => []);
  blocos.forEach((b, k) => {
    const dur = b.fim - b.inicio;
    const lista = (listas?.[k] ?? [])
      .filter((p) => p && idDaImagem(p.id) && Number.isFinite(Number(p.em)) && Number(p.em) >= 0 && Number(p.em) <= dur + 0.01)
      .sort((x, y) => Number(x.em) - Number(y.em));
    for (const p of lista) {
      const base = idDaImagem(p.id);
      let id = base;
      if (usados.has(id)) {
        id = `${base}-${k + 1}`;
        for (let n = 2; usados.has(id); n++) id = `${base}-${k + 1}-${n}`;
      }
      usados.add(id);
      pedidos.push({ ...p, id, em: r3(Math.min(b.fim, b.inicio + Number(p.em))) });
      porBloco[k].push(id);
    }
  });
  return { pedidos, porBloco, comuns };
}

/** O pedaço do plano.imagens com os ids dados (os que existem). */
export function imagensDoBloco(imagensDoPlano, ids) {
  const quero = new Set(ids ?? []);
  return Object.fromEntries(Object.entries(imagensDoPlano ?? {}).filter(([id]) => quero.has(id)));
}

/** As folhas numeradas (work/imagens.jpg, imagens-2.jpg...) que mostram estes pedidos (as posições deles no work/imagens.json). */
export function folhasDosPedidos(posicoes, porFolha = 4) {
  const ks = [...new Set((posicoes ?? []).filter((i) => Number.isInteger(i) && i >= 0).map((i) => Math.floor(i / porFolha)))].sort((a, b) => a - b);
  return ks.map((k) => ({ numero: k + 1, arquivo: k === 0 ? "imagens.jpg" : `imagens-${k + 1}.jpg` }));
}

/** Os ids de imagem que um plano cita: `imagem`, `antes` e `depois` com `id`, em qualquer nível dos momentos. */
export function imagensCitadas(plano) {
  const ids = [];
  const andar = (v) => {
    if (Array.isArray(v)) return v.forEach(andar);
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if ((k === "imagem" || k === "antes" || k === "depois") && x && typeof x === "object" && typeof x.id === "string") ids.push(x.id);
      andar(x);
    }
  };
  for (const m of plano?.momentos ?? []) andar(m);
  return ids;
}

/**
 * A REGRA "SÓ AS IMAGENS QUE EXISTEM", por trecho: o plano do trecho cita só
 * as imagens dele (e as do cliente). Imagem de outro trecho, ou id que o
 * imagens.mjs não gravou, sairia no render como buraco. Devolve os erros no
 * formato da conferência do curso; vazio é aprovado.
 */
export function imagensForaDoBloco(plano, permitidas) {
  const lista = [...new Set(permitidas ?? [])];
  const pode = new Set(lista);
  const use = lista.length ? `Use só ${lista.map((i) => `"${i}"`).join(", ")}` : "Este trecho não tem imagem: tire o campo de imagem";
  return [...new Set(imagensCitadas(plano))]
    .filter((id) => !pode.has(id))
    .map((id) => `A imagem "${id}" não está entre as imagens deste trecho (plano.imagens). ${use}; sem imagem que sirva, use outro bloco.`);
}

/** Os momentos de um bloco (os que começam dentro dele), no tempo do bloco. */
export function momentosDoBloco(plano, b) {
  return (plano.momentos ?? []).filter((m) => m.de >= b.inicio - 0.01 && m.de < b.fim - 0.01).map((m) => deslocarTempos(m, -b.inicio));
}

/**
 * O plano de um bloco no tempo dele, com os campos de topo que o redator
 * escreveu (marca, correções...), para a revisão e a volta de conserto.
 */
export function planoDoBloco(plano, b) {
  const { momentos, semLegenda, palavras, rosto, cortesEm, video, fps, largura, altura, duracao, videoAltura, zona, imagens, enquadramentos, ...escritos } = plano;
  return {
    ...escritos,
    momentos: momentosDoBloco(plano, b),
    ...(Array.isArray(semLegenda) ? { semLegenda: semLegenda.filter((s) => s.de >= b.inicio - 0.01 && s.de < b.fim).map((s) => deslocarTempos(s, -b.inicio)) } : {}),
  };
}

/**
 * Junta os planos escritos por bloco (no tempo de cada bloco) num plano só,
 * no tempo do vídeo inteiro. Momento que passa do fim do bloco é cortado nele
 * (o próximo bloco começa ali); momento fora do bloco sai. Os campos de topo
 * (marca, fantasma, sfx...) são os do primeiro bloco que os escreveu; as
 * correções somam (valem para a fala inteira, como no curso).
 */
export function juntarPlanos(blocos, planos) {
  const junto = { momentos: [], semLegenda: [], correcoes: {} };
  planos.forEach((p, k) => {
    if (!p) return;
    const b = blocos[k];
    const dur = b.fim - b.inicio;
    for (const [campo, v] of Object.entries(p)) {
      if (campo === "momentos" || campo === "semLegenda" || campo === "correcoes") continue;
      if (!(campo in junto) && v !== undefined && v !== null) junto[campo] = v;
    }
    for (const m of p.momentos ?? []) {
      const de = Math.max(0, Number(m.de));
      const ate = Math.min(dur, Number(m.ate));
      if (!Number.isFinite(de) || !Number.isFinite(ate) || ate - de < 0.05) continue;
      junto.momentos.push(deslocarTempos({ ...m, de, ate }, b.inicio));
    }
    for (const s of p.semLegenda ?? []) {
      if (Number.isFinite(s?.de) && Number.isFinite(s?.ate)) junto.semLegenda.push(deslocarTempos({ ...s, de: Math.max(0, s.de), ate: Math.min(dur, s.ate) }, b.inicio));
    }
    Object.assign(junto.correcoes, p.correcoes ?? {});
  });
  junto.momentos.sort((a, b) => a.de - b.de);
  return junto;
}

/** Os textos de um momento (o que aparece na tela), para o contexto do bloco seguinte. */
function textosDoMomento(m) {
  const textos = [];
  const andar = (v, k) => {
    if (typeof v === "string" && ["texto", "palavra", "antes", "titulo", "rotulo", "nota", "termo", "significado", "destaque"].includes(k)) textos.push(v);
    else if (Array.isArray(v)) {
      if (k === "linhas" && v.every((x) => typeof x === "string")) textos.push(v.join(""));
      else v.forEach((x) => andar(x, k));
    } else if (v && typeof v === "object") for (const [c, x] of Object.entries(v)) andar(x, c);
  };
  andar(m, "");
  return textos.join(" / ").slice(0, 140);
}

/**
 * O FIM DE UM BLOCO para o redator do bloco seguinte (continuidade): os
 * últimos momentos (tipo e texto, sem tempo: o tempo é do outro bloco), as
 * últimas linhas do mapa e quantas vezes cada tipo já foi usado no bloco.
 */
export function caudaDoBloco(planoDoBlocoAnterior, mapa, { momentos = 3, linhas = 6 } = {}) {
  if (!planoDoBlocoAnterior) return null;
  const ms = [...(planoDoBlocoAnterior.momentos ?? [])].sort((a, b) => a.de - b.de);
  const tipos = {};
  for (const m of ms) tipos[m.tipo] = (tipos[m.tipo] ?? 0) + 1;
  return {
    ultimos: ms.slice(-momentos).map((m) => ({ tipo: m.tipo, ...(m.campo ? { campo: m.campo } : {}), texto: textosDoMomento(m) })),
    mapa: String(mapa ?? "")
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^#/.test(l))
      .slice(-linhas)
      .join("\n"),
    tipos,
  };
}

// As regras da conferência do curso que olham o vídeo inteiro (as outras apontam um instante).
const REGRAS_GERAIS = [
  { regra: "cobertura", teste: /^Só \d+% do vídeo tem momento/ },
  { regra: "minimo", teste: /momentos para .* de vídeo; o mínimo é/ },
  { regra: "variedade", teste: /^Só \d+ tipo\(s\) de bloco/ },
  { regra: "assinatura", teste: /^A assinatura do modelo/ },
  { regra: "proprios", teste: /efeito\(s\) próprio\(s\) do modelo/ },
];
export const regraGeral = (erro) => REGRAS_GERAIS.find((r) => r.teste.test(erro))?.regra ?? null;

const s = (t) => `${t.toFixed(1).replace(".", ",")} s`;

/**
 * A CONFERÊNCIA EM BLOCOS. Quem decide é a conferência do curso no plano
 * inteiro (`conferirPlano` do scripts/conferir.mjs do modelo, a mesma do
 * render.mjs). Reprovado, cada bloco é conferido sozinho (no tempo dele, como
 * um corte), para o conserto ir só aos blocos com defeito e com a mensagem no
 * tempo que o redator do bloco conhece. Do que o bloco sozinho aponta, vale:
 *   - todo erro de um instante (tipo, campo, vão, momento parado): ele também
 *     é erro no plano inteiro;
 *   - erro de regra geral (cobertura, mínimo, variedade, assinatura, efeitos
 *     próprios) só quando o plano inteiro também falha nessa regra.
 * O vão que atravessa a emenda de dois blocos (cada lado curto, a soma longa)
 * vai aos dois.
 */
export function conferirEmBlocos({ plano, blocos, conferirPlano, modelo = {}, tipos = null }) {
  const geral = conferirPlano(plano, modelo, tipos);
  const regrasQueFalham = new Set(geral.erros.map(regraGeral).filter(Boolean));
  const porBloco = blocos.map((b) => {
    const sub = { ...esqueletoDoBloco(plano, b), momentos: momentosDoBloco(plano, b) };
    const r = conferirPlano(sub, modelo, tipos);
    const erros = r.erros.filter((e) => {
      const g = regraGeral(e);
      return !g || regrasQueFalham.has(g);
    });
    return { indice: b.indice, erros, avisos: r.avisos ?? [] };
  });
  const lim = { vao: 3.5, ...(modelo.conferir ?? {}) };
  for (const [a, z] of geral.vaos ?? []) {
    if (z - a <= lim.vao) continue;
    const tocados = blocos.filter((b) => a < b.fim - 0.01 && z > b.inicio + 0.01);
    if (tocados.length < 2) continue;
    for (const b of tocados) {
      const de = Math.max(0, a - b.inicio);
      const ate = Math.min(b.fim - b.inicio, z - b.inicio);
      const lado = a < b.inicio ? "no começo deste trecho" : "no fim deste trecho";
      porBloco[b.indice].erros.push(
        `De ${s(de)} a ${s(ate)} (${lado}) só tem a pessoa e a legenda, e o vão continua no trecho vizinho: somados dão ${s(z - a)} (máximo ${s(lim.vao)}). Ponha um momento mais perto da borda.`
      );
    }
  }
  if (!geral.ok && porBloco.every((p) => !p.erros.length)) {
    // Reprovado sem bloco apontado (não deveria acontecer): todos levam o que o plano inteiro disse.
    for (const p of porBloco) p.erros.push(...geral.erros);
  }
  return { ok: geral.ok, geral, porBloco };
}

/** A saída que o redator do bloco recebe, no formato do conferir.mjs do curso. */
export function textoDaConferencia(erros, avisos = []) {
  const linhas = ["Conferência deste trecho (o trecho é parte de um vídeo maior; os tempos são os do trecho):"];
  for (const a of avisos) linhas.push(`  aviso: ${a}`);
  linhas.push("", "REPROVADO. Corrija o plano antes de renderizar:");
  erros.forEach((e, i) => linhas.push(`  ${i + 1}. ${e}`));
  return linhas.join("\n");
}

/**
 * Os instantes dos quadros de conferência (passo 8) de um plano: no meio de
 * cada momento e depois de tudo entrar (o último instante mais 0,7 s), como o
 * stills.mjs --momentos sem as bordas (num completo seriam centenas de
 * quadros). Devolve os tempos no vídeo inteiro, em ordem.
 */
export function instantesDaRevisao(plano) {
  const instantes = (v, k = "") =>
    Array.isArray(v) ? v.flatMap((x) => instantes(x, k)) : v && typeof v === "object" ? Object.entries(v).flatMap(([c, x]) => instantes(x, c)) : typeof v === "number" && (k === "em" || /Em$/.test(k)) ? [v] : [];
  const dur = Number(plano.duracao) || 0;
  const tempos = new Set();
  for (const m of plano.momentos ?? []) {
    const meio = m.de + (m.ate - m.de) / 2;
    const falas = (plano.palavras ?? []).filter((p) => p.em >= m.de && p.em < m.ate).map((p) => p.em);
    const ultimo = Math.max(m.de, ...instantes(m), ...falas.slice(-1));
    for (const t of [meio, Math.min(m.ate - 0.1, ultimo + 0.7)]) tempos.add(+Math.min(Math.max(0, t), dur - 0.05).toFixed(2));
  }
  return [...tempos].sort((a, b) => a - b);
}

/**
 * O TRECHO NOS QUADROS (10/10, achado na prova do completo): o trecho do curso
 * é a gravação emendada nos pedaços mantidos (extrairTrecho, trim + concat).
 * Cada pedaço de vídeo sai com um número inteiro de quadros e o de áudio com o
 * tempo exato; o concat estica o pedaço até o mais longo dos dois. Num corte de
 * 20 pedaços isso some; no completo (74 pedaços em 7 min, 171 em 17 min) a
 * fala do trecho ficava 0,4 s (e ~1 s) atrás das palavras que o app mandou, e
 * a legenda e o pôster entrariam adiantados no fim do vídeo.
 *
 * Aqui os pedaços vão para a grade de quadros da gravação (começo e fim no
 * quadro mais perto), o vídeo e o áudio de cada pedaço passam a ter a MESMA
 * duração, e as palavras são levadas para a linha do tempo nova (cada uma anda
 * o que o pedaço dela andou). Pedaço que fica sem quadro sai; a palavra dele
 * vai para o começo do pedaço seguinte. `manter` e as palavras ({em, ate, w})
 * no tempo do trecho, relativos a `inicio`. Sem fps (gravação de quadros
 * variáveis), nada muda.
 */
export function alinharAosQuadros(manter, palavras, fps, inicio = 0) {
  if (!(Number(fps) > 0) || !Array.isArray(manter) || !manter.length) return { manter, palavras, fps: null, ajusteMaxSeg: 0 };
  const q = (t) => Math.round((inicio + t) * fps) / fps - inicio;
  let c = 0;
  let c2 = 0;
  const pedacos = manter.map((m) => {
    const p = { de: m.de, ate: m.ate, de2: q(m.de), ate2: q(m.ate), c, c2 };
    const quadros = Math.round((p.ate2 - p.de2) * fps);
    p.vale = quadros >= 1;
    c += m.ate - m.de;
    if (p.vale) c2 += p.ate2 - p.de2;
    return p;
  });
  const leva = (t) => {
    let k = 0;
    for (let i = 0; i < pedacos.length; i++) if (pedacos[i].c <= t + 1e-9) k = i;
    const p = pedacos[k];
    if (!p.vale) {
      const seguinte = pedacos.slice(k + 1).find((x) => x.vale);
      return seguinte ? seguinte.c2 : c2;
    }
    const novo = t + (p.c2 - p.c) - (p.de2 - p.de);
    return Math.min(p.c2 + (p.ate2 - p.de2), Math.max(p.c2, novo));
  };
  let ajusteMaxSeg = 0;
  const novas = (palavras ?? []).map((w) => {
    const em = leva(w.em);
    const ate = Math.max(em + 0.02, leva(Math.max(w.em, w.ate - 1e-6)));
    ajusteMaxSeg = Math.max(ajusteMaxSeg, Math.abs(em - w.em));
    return { ...w, em: r3(em), ate: r3(ate) };
  });
  return {
    manter: pedacos.filter((p) => p.vale).map((p) => ({ de: +p.de2.toFixed(6), ate: +p.ate2.toFixed(6) })),
    palavras: novas,
    fps: Number(fps),
    ajusteMaxSeg: r3(ajusteMaxSeg),
  };
}

/**
 * As partes do render (quadros inclusivos): ~`alvoSeg` cada, a última absorve
 * a sobra curta (menos de 40% do alvo). Cobrem a composição inteira, em ordem.
 */
export function partesDoRender(duracao, fps, alvoSeg = BLOCO_ALVO_SEG) {
  const total = Math.max(1, Math.round(Number(duracao) * Number(fps)));
  const passo = Math.max(1, Math.round(alvoSeg * fps));
  const partes = [];
  for (let a = 0; a < total; a += passo) partes.push([a, Math.min(total - 1, a + passo - 1)]);
  if (partes.length > 1) {
    const ultima = partes[partes.length - 1];
    if (ultima[1] - ultima[0] + 1 < passo * 0.4) {
      partes.pop();
      partes[partes.length - 1][1] = total - 1;
    }
  }
  return partes;
}

/**
 * Quantas partes ao mesmo tempo e quantas abas do Chrome por parte, dentro da
 * fatia deste trabalho na fila (capacidade.mjs): as abas da fatia divididas
 * entre as partes, nunca mais partes juntas que `rendersDoCompleto`.
 */
export function paralelismoDoRender(fatia, partes) {
  const abas = Math.max(1, Number(fatia?.remotion) || 1);
  const paralelas = Math.max(1, Math.min(partes, Number(fatia?.rendersDoCompleto) || 1, abas));
  return { paralelas, concorrencia: Math.max(1, Math.floor(abas / paralelas)) };
}
