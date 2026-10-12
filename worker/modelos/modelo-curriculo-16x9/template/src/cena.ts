// A direção do modelo Currículo: onde está a janela da pessoa (o comentário) e onde estão as
// folhas em cada instante. Tudo sai do plano — o aluno não escreve posições.
import { fimDoTexto, limitar, mistura, preciso, prog, temposDoTexto } from "./anim";
import { ALT_LINHA, type Folha, ordenar, X0, XT } from "./documento";
import type { Cronometro, Lugar, Momento, Paginas, Plano, Reescrever, Riscar } from "./plano";
import { FOLHA, LIMITE_APP, MARGEM, TOPO_APP } from "./tema";

export const lugarDoMomento = (m: Momento): Lugar => {
  switch (m.tipo) {
    case "abertura":
    case "destaque":
    case "cta":
      return "cheio";
    case "paginas":
    case "riscar":
    case "marcar":
    case "topicos":
    case "passos":
    case "definicao":
    case "frase":
      return "margem";
    case "reescrever":
    case "numero":
    case "comparacao":
    case "grafico":
      return "embaixo";
    case "cronometro":
    case "pergunta":
      return "topo";
  }
};

// ---------- tempos derivados de cada momento ----------

export const tempoDoRisco = (m: Riscar, plano: Plano) => m.riscoEm ?? fimDoTexto(m.frase, plano.palavras, m.de, m.ate) + 0.05;

export const temposDaReescrita = (m: Reescrever, plano: Plano) => {
  const antes = temposDoTexto(m.antes, plano.palavras, m.de, m.ate);
  const depois = temposDoTexto(m.depois, plano.palavras, m.de, m.ate, (antes[antes.length - 1] ?? m.de) + 0.4);
  const fimDepois = fimDoTexto(m.depois, plano.palavras, m.de, m.ate);
  const aceita = m.aceitaEm ?? Math.min(fimDepois + 0.3, m.ate - 0.5);
  // a linha abre espaço um pouco antes da primeira palavra nova
  const abre = Math.max(m.de + 0.5, (depois[0] ?? m.de + 1) - 0.4);
  return { antes, depois, aceita, abre };
};

// quando o ponteiro fecha a volta (e o número, se houver, assenta)
export const tempoDaVolta = (m: Cronometro) => m.voltaEm ?? m.de + 1.2;

// ---------- a janela da pessoa ----------

// O bilhete da pessoa: retângulo de fora + o "cromo" (margem de papel, cabeçalho, inclinação).
export type Janela = {
  x: number;
  y: number;
  w: number;
  h: number;
  raio: number;
  pad: number;
  cab: number;
  zoom: number;
  ancoraY: number;
  // 0 = vídeo puro em tela cheia; 1 = bilhete de papel
  cromo: number;
  // inclinação do bilhete (graus)
  rot: number;
};

// --- O quadro deitado (16:9): a regra da aula 9 do curso ---
// Fora da tela cheia, a pessoa é sempre o bilhete na MOLDURA do lado direito (o rosto centralizado
// nele e acompanhado pelo rastro) e a folha ocupa o QUADRO do lado esquerdo. No vertical o bilhete
// mudava de lugar (margem, embaixo, em cima da folha); no deitado ele fica sempre à direita e muda
// de TAMANHO: pequeno na margem (seções da folha), médio com a folha ampliada (número, comparação,
// gráfico, reescrita) e grande com a pergunta e o cronômetro.
//
//   [ QUADRO: a folha na mesa (e o contador, o cronômetro, o "?")  |  MOLDURA: o bilhete ]
//
// a coluna do bilhete da margem (e dos comentários resolvidos em cima dele)
export const MARGEM_X = 1240;
export const MARGEM_W = 584;
const CAB = 62;
const PAD = 14;
const VIDEO_MARGEM = 470;
export const ALTURA_MARGEM = PAD * 2 + CAB + VIDEO_MARGEM;
// cada comentário resolvido (bilhete pequeno) ocupa esta altura no alto da margem
export const ALTURA_RESOLVIDO = 86;
// o bilhete médio (folha ampliada) e o grande (pergunta, cronômetro), encostados na margem da direita
const EMBAIXO = { x: 1196, y: 150, w: 628, video: 640 };
const TOPO = { x: 1128, y: 92, w: 696, video: 740 };
// a folha no quadro da esquerda: onde começa e a escala dela na margem (texto da folha ~48 px)
const FOLHA_X = 196;
const S_MARGEM = 1.15;
// centro do quadro da esquerda (a folha ampliada fica centrada nele)
const CENTRO_QUADRO = 640;

// Quanto aproximar o vídeo para o rosto ocupar `fracao` da largura do bilhete. Num vídeo deitado o
// rosto tem ~13% da largura do quadro (o rastro do cortar.mjs diz o valor de verdade); sem
// aproximar, ele ficaria pequeno demais na moldura.
const zoomDoBilhete = (plano: Plano, w: number, h: number, fracao: number) => {
  const videoAltura = Math.min(1080, plano.videoAltura ?? 1080);
  const rastro = (plano.rosto as { rastro?: { largura?: number } }).rastro;
  const rosto = rastro?.largura && rastro.largura > 0.03 ? rastro.largura : 0.13;
  const cobre = Math.max(w / 1920, h / videoAltura);
  return limitar((fracao * w) / (rosto * 1920 * cobre), 1, 2.6);
};

export const caixaDoVideo = (j: Janela) => ({
  x: j.x + j.pad,
  y: j.y + j.pad + j.cab,
  w: Math.max(1, j.w - 2 * j.pad),
  h: Math.max(1, j.h - 2 * j.pad - j.cab),
  raio: Math.max(0, j.raio - 6),
  zoom: j.zoom,
  ancoraY: j.ancoraY,
});

const janelaDoLugar = (lugar: Lugar, plano: Plano, y = 400): Janela => {
  const videoAltura = Math.min(1080, plano.videoAltura ?? 1080);
  const ajuste = plano.caixas?.[lugar] ?? {};
  switch (lugar) {
    case "cheio":
      // a base da aula 9: o vídeo deitado inteiro
      return {
        x: 0,
        y: 0,
        w: 1920,
        h: 1080,
        raio: 0,
        pad: 0,
        cab: 0,
        zoom: ajuste.zoom ?? 1,
        ancoraY: ajuste.ancoraY ?? Math.min(0.5, (plano.rosto.y * 1080) / videoAltura),
        cromo: 0,
        rot: 0,
      };
    case "margem":
      return {
        x: MARGEM_X,
        y,
        w: MARGEM_W,
        h: ALTURA_MARGEM,
        raio: 3,
        pad: PAD,
        cab: CAB,
        zoom: ajuste.zoom ?? zoomDoBilhete(plano, MARGEM_W - 2 * PAD, VIDEO_MARGEM, 0.4),
        ancoraY: ajuste.ancoraY ?? 0.46,
        cromo: 1,
        rot: -1.2,
      };
    case "embaixo":
      return {
        x: EMBAIXO.x,
        y: EMBAIXO.y,
        w: EMBAIXO.w,
        h: 2 * 16 + 62 + EMBAIXO.video,
        raio: 3,
        pad: 16,
        cab: 62,
        zoom: ajuste.zoom ?? zoomDoBilhete(plano, EMBAIXO.w - 32, EMBAIXO.video, 0.38),
        ancoraY: ajuste.ancoraY ?? 0.47,
        cromo: 1,
        rot: 0.8,
      };
    case "topo":
      return {
        x: TOPO.x,
        y: TOPO.y,
        w: TOPO.w,
        h: 2 * 16 + 62 + TOPO.video,
        raio: 3,
        pad: 16,
        cab: 62,
        zoom: ajuste.zoom ?? zoomDoBilhete(plano, TOPO.w - 32, TOPO.video, 0.36),
        ancoraY: ajuste.ancoraY ?? 0.47,
        cromo: 1,
        rot: -0.5,
      };
  }
};

// ---------- as folhas ----------

export type PosFolha = { x: number; y: number; s: number; rot: number; op: number };
export type Vista = PosFolha[];

// folhas escondidas: abaixo do quadro deitado (1080 px de altura), atrás da pessoa em tela cheia
const FORA_Y = 1120;
// faixa da folha ampliada no quadro da esquerda (lugar "embaixo"): do alto até acima dos controles
const ZONA_DE_CIMA = { topo: 96, meio: 520, base: 930 };
// a faixa útil da folha na margem: o trecho em foco fica entre estas alturas
const FAIXA_FOLHA = { topo: 90, base: 940 };

// Quantas folhas o documento mostra (a `paginas` diz o total; sem ela, uma)
export const totalDeFolhas = (plano: Plano) => Math.max(1, ...plano.momentos.filter((m) => m.tipo === "paginas").map((m) => (m as Paginas).total));

// Leque de folhas do momento `paginas`: no quadro deitado as folhas se abrem para o lado, abaixo do
// contador; a escala sai da altura que sobra (a última folha termina acima dos controles do player).
export const LEQUE = { x: 132, y: 262, dy: 34, base: 944, sMax: 0.46 };
export const geometriaDoLeque = (n: number, alturaFolha: number) => {
  const s = Math.min(LEQUE.sMax, (LEQUE.base - LEQUE.y - (n - 1) * LEQUE.dy) / Math.max(1, alturaFolha));
  const larg = FOLHA.w * s;
  // abre até perto do meio do quadro (a nota à mão entra à direita da última folha)
  const dx = n > 1 ? Math.min(190, (MARGEM_X - 460 - LEQUE.x - larg) / (n - 1)) : 0;
  return { s, larg, dx, x: LEQUE.x, y: LEQUE.y, dy: LEQUE.dy };
};
const vistaLeque = (n: number, alturaFolha: number): Vista => {
  const g = geometriaDoLeque(n, alturaFolha);
  return Array.from({ length: n }, (_, i) => ({
    x: g.x + i * g.dx,
    y: g.y + i * g.dy,
    s: g.s,
    rot: n > 1 ? -1.4 + (i / (n - 1)) * 3.2 : 0,
    op: 1,
  }));
};

// Só a folha 1 na tela; as outras saem para baixo e para a direita
const soAPrimeira = (n: number, p: PosFolha): Vista =>
  Array.from({ length: n }, (_, i) => (i === 0 ? p : { x: p.x + 380 + i * 40, y: p.y + 760, s: p.s, rot: 8 + i * 2, op: 0 }));

// folhas fora do quadro (atrás da pessoa em tela cheia): descem inteiras, sem transparência
// (folhas meio transparentes cruzando umas com as outras parecem fantasmas)
const deslocar = (v: Vista, dy: number): Vista => v.map((p) => ({ ...p, y: p.y + dy }));

// Um ponto da folha (unidades da página) na tela, com a folha em `p`; a seta nunca passa da margem
const naTela = (p: PosFolha, a: { x: number; y: number }) => ({ x: Math.min(MARGEM_X - 28, p.x + p.s * a.x), y: p.y + p.s * a.y });

// Altura (px) que a folha ocupa na escala s
const alturaNaTela = (folha: Folha, s: number) => folha.altura * s;

// Enquadra a folha 1 no quadro da esquerda. De preferência a página aparece desde o alto (o nome no
// cabeçalho, como no vertical, sem título de seção cortado na borda de cima) até o fim da seção em
// foco (`ate`), numa escala entre 0,95 e `s`. Se não cabe, a linha `focoY` (unidades da página) fica
// perto de `focoTela`, na escala `s`.
const S_DESDE_O_ALTO = 0.95;
const vistaMargem = (folha: Folha, n: number, focoY: number, s: number, focoTela: number, ate?: number): Vista => {
  const sAlto = ate !== undefined ? Math.min(s, (FAIXA_FOLHA.base - 60) / Math.max(1, ate)) : 0;
  if (sAlto >= S_DESDE_O_ALTO) return soAPrimeira(n, { x: FOLHA_X, y: 60, s: sAlto, rot: 0, op: 1 });
  // a folha desce até os controles do player (sem faixa de mesa vazia embaixo) e nunca começa
  // abaixo do alto do quadro
  const y = limitar(focoTela - s * focoY, LIMITE_APP - 4 - alturaNaTela(folha, s), 60);
  return soAPrimeira(n, { x: FOLHA_X, y, s, rot: 0, op: 1 });
};

export type Cena = {
  // trechos da direção: a partir de `de`, a janela e as folhas vão para estes estados
  trechos: { de: number; dur: number; lugar: Lugar; janela: Janela; vista: Vista; ancora?: { x: number; y: number }; foco?: { x: number; y: number } }[];
  n: number;
};

// a troca começa no corte mais próximo (o movimento esconde o pulo do corte)
const noCorte = (de: number, cortes: number[]) => {
  const perto = cortes.find((c) => c - de > -0.16 && c - de < 0.1);
  return perto !== undefined && de > 0 ? perto : de;
};

export const montarCena = (plano: Plano, folha: Folha): Cena => {
  const momentos = ordenar(plano);
  const n = totalDeFolhas(plano);
  const cortes = plano.cortesEm ?? [];
  const trechos: Cena["trechos"] = [];
  // quantos comentários resolvidos já estão empilhados no alto da margem
  let resolvidos = 0;

  const secaoDo = (indice: number) => folha.secoes.find((s) => s.indice === indice);

  const vistaE_ancora = (m: Momento, indice: number): { vista: Vista; ancora?: { x: number; y: number } } => {
    const s = secaoDo(indice);
    switch (m.tipo) {
      case "paginas": {
        const v = vistaLeque(n, folha.altura);
        const ultima = v[v.length - 1];
        return { vista: v, ancora: { x: ultima.x + FOLHA.w * ultima.s * 0.86, y: ultima.y + folha.altura * ultima.s * 0.3 } };
      }
      case "riscar": {
        const linha = s?.linhas[0];
        const linhaY = (linha?.y ?? 300) + ALT_LINHA / 2;
        const v = vistaMargem(folha, n, linhaY, S_MARGEM, 420, s?.fim);
        return { vista: v, ancora: s?.ancora ? naTela(v[0], s.ancora) : undefined };
      }
      case "marcar": {
        const ys = s?.linhas.map((l) => l.y) ?? [600];
        const meio = (Math.min(...ys) + Math.max(...ys) + ALT_LINHA) / 2;
        const v = vistaMargem(folha, n, meio, S_MARGEM, 500, s?.fim);
        return { vista: v, ancora: s?.ancora ? naTela(v[0], s.ancora) : undefined };
      }
      case "topicos":
      case "passos":
      case "definicao":
      case "frase": {
        // a seção inteira na tela, de preferência no meio do quadro; seção alta encolhe a folha
        // (até 0,9) para caber entre o alto e os controles do player
        const y0 = s?.y ?? 300;
        const y1 = s?.fim ?? 600;
        const h = y1 - y0;
        const faixa = FAIXA_FOLHA.base - FAIXA_FOLHA.topo;
        const sc = limitar(faixa / Math.max(1, h), 0.9, S_MARGEM);
        const hs = h * sc;
        const focoTela = hs > faixa ? FAIXA_FOLHA.topo + hs / 2 : limitar(520, FAIXA_FOLHA.topo + hs / 2, FAIXA_FOLHA.base - hs / 2);
        const v = vistaMargem(folha, n, (y0 + y1) / 2, sc, focoTela, y1);
        return { vista: v, ancora: s?.ancora ? naTela(v[0], s.ancora) : undefined };
      }
      case "reescrever": {
        // a câmera chega perto da linha; a folha ampliada fica no quadro da esquerda
        const alvo = folha.alvos[indice];
        const sc = 1.4;
        const y = 440 - sc * (alvo?.y ?? 600);
        return { vista: soAPrimeira(n, { x: 130 - X0 * sc, y, s: sc, rot: 0, op: 1 }) };
      }
      case "numero":
      case "comparacao":
      case "grafico": {
        // a folha ampliada mostra só a seção, no quadro da esquerda (o bilhete fica na moldura)
        const y0 = s?.y ?? 300;
        const y1 = s?.fim ?? 700;
        const sc = Math.min(1.45, (ZONA_DE_CIMA.base - ZONA_DE_CIMA.topo - 40) / Math.max(1, y1 - y0));
        let y = ZONA_DE_CIMA.meio - (sc * (y0 + y1)) / 2;
        y = Math.max(y, ZONA_DE_CIMA.topo - sc * y0);
        y = Math.min(y, ZONA_DE_CIMA.base - sc * y1);
        return { vista: soAPrimeira(n, { x: CENTRO_QUADRO - (sc * (X0 + XT)) / 2, y, s: sc, rot: 0, op: 1 }) };
      }
      case "pergunta":
        // a seção no alto do quadro da esquerda, um pouco ampliada; o bilhete do "?" cola na margem dela
        return { vista: soAPrimeira(n, { x: MARGEM - 1.15 * 6, y: 132 - 1.15 * (s?.y ?? 300), s: 1.15, rot: 0, op: 1 }) };
      case "cronometro":
        // a folha revisada inteira no quadro da esquerda; o cronômetro entre ela e o bilhete grande
        return { vista: soAPrimeira(n, { x: MARGEM, y: 64, s: 0.92, rot: 0, op: 1 }) };
      default:
        return { vista: [] };
    }
  };

  // trecho inicial: tela cheia, folhas escondidas abaixo do quadro
  const primeiraVista = (() => {
    for (let i = 0; i < momentos.length; i++) {
      const v = vistaE_ancora(momentos[i], i).vista;
      if (v.length) return v;
    }
    return soAPrimeira(n, { x: FOLHA_X, y: 60, s: S_MARGEM, rot: 0, op: 1 });
  })();
  let ultimaVista = primeiraVista;
  trechos.push({ de: -10, dur: 0.001, lugar: "cheio", janela: janelaDoLugar("cheio", plano), vista: deslocar(primeiraVista, FORA_Y) });

  const empurrar = (de: number, lugar: Lugar, janela: Janela, vista: Vista, ancora?: { x: number; y: number }) => {
    const ultimo = trechos[trechos.length - 1];
    if (ultimo.lugar === "cheio" && lugar === "cheio") return;
    const dur = lugar === "margem" && ultimo.lugar === "margem" ? 0.55 : 0.62;
    if (de <= ultimo.de + 0.02) {
      Object.assign(ultimo, { lugar, janela, vista, ancora });
      return;
    }
    trechos.push({ de, dur, lugar, janela, vista, ancora });
  };

  momentos.forEach((m, i) => {
    const lugar = lugarDoMomento(m);
    const de = noCorte(Math.max(0, m.de), cortes);
    if (lugar === "cheio") {
      empurrar(de <= 0.1 ? -10 : de, "cheio", janelaDoLugar("cheio", plano), deslocar(ultimaVista, FORA_Y));
    } else {
      const { vista, ancora } = vistaE_ancora(m, i);
      let y = 400;
      if (lugar === "margem" && ancora) {
        // abaixo dos bilhetes resolvidos (a aba vermelha sai 14 px por cima do bilhete)
        const minimo = TOPO_APP + 24 + resolvidos * ALTURA_RESOLVIDO + (resolvidos ? 16 : 0);
        y = limitar(ancora.y - PAD - CAB / 2, minimo, LIMITE_APP - 20 - ALTURA_MARGEM);
      }
      empurrar(de <= 0.1 ? -10 : de, lugar, janelaDoLugar(lugar, plano, y), vista, ancora);
      // o centro da deriva (a aproximação lenta da folha): no quadro da esquerda
      trechos[trechos.length - 1].foco = ancora
        ? { x: 520, y: ancora.y }
        : lugar === "embaixo"
          ? { x: CENTRO_QUADRO, y: ZONA_DE_CIMA.meio }
          : lugar === "topo"
            ? { x: 420, y: 520 }
            : { x: 520, y: 520 };
      ultimaVista = vista;
    }
    if ("erro" in m && m.erro) resolvidos++;
    const prox = momentos[i + 1];
    const fimDoVideo = m.ate >= plano.duracao - 0.3;
    if (!fimDoVideo && (!prox || prox.de - m.ate > 0.15)) {
      empurrar(noCorte(m.ate, cortes), "cheio", janelaDoLugar("cheio", plano), deslocar(ultimaVista, FORA_Y));
    }
  });

  return { trechos, n };
};

const mixJanela = (a: Janela, b: Janela, p: number): Janela => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  w: mistura(a.w, b.w, p),
  h: mistura(a.h, b.h, p),
  raio: mistura(a.raio, b.raio, p),
  pad: mistura(a.pad, b.pad, p),
  cab: mistura(a.cab, b.cab, p),
  zoom: mistura(a.zoom, b.zoom, p),
  ancoraY: mistura(a.ancoraY, b.ancoraY, p),
  rot: mistura(a.rot, b.rot, p),
  // o cabeçalho aparece no fim da troca (sai logo no começo)
  cromo: b.cromo > a.cromo ? mistura(a.cromo, b.cromo, limitar((p - 0.35) / 0.65)) : mistura(a.cromo, b.cromo, limitar(p * 2)),
});

// índice do trecho em vigor no instante t, olhando só até o trecho `limite`
const indiceNoTempo = (t: number, cena: Cena, limite = cena.trechos.length - 1) => {
  let i = 0;
  for (let k = 0; k <= limite; k++) if (cena.trechos[k].de <= t) i = k;
  return i;
};

// estado da janela no instante t (encadeia as trocas, mesmo quando uma começa antes da outra acabar)
export const janelaNoTempo = (t: number, cena: Cena, limite = cena.trechos.length - 1): Janela => {
  const i = indiceNoTempo(t, cena, limite);
  const tr = cena.trechos[i];
  if (i === 0) return tr.janela;
  const anterior = janelaNoTempo(tr.de, cena, i - 1);
  return mixJanela(anterior, tr.janela, prog(t, tr.de, tr.dur, preciso));
};

const mixPos = (a: PosFolha, b: PosFolha, p: number): PosFolha => ({
  x: mistura(a.x, b.x, p),
  y: mistura(a.y, b.y, p),
  // a escala anda em proporção (zoom constante na tela)
  s: Math.exp(mistura(Math.log(a.s), Math.log(b.s), p)),
  rot: mistura(a.rot, b.rot, p),
  op: mistura(a.op, b.op, p),
});

// Deriva: enquanto um momento dura, a folha se aproxima devagar (3,5 %) em volta do foco —
// a câmera nunca fica parada. Continua de um trecho para o outro sem pulo.
const DERIVA = 0.035;
export const derivaNoTempo = (t: number, cena: Cena, i: number) => {
  const tr = cena.trechos[i];
  if (tr.lugar === "cheio" || !tr.foco) return { k: 1, x: 0, y: 0 };
  const fim = cena.trechos[i + 1]?.de ?? tr.de + 5;
  const f = limitar((t - tr.de) / Math.max(0.6, fim - tr.de));
  return { k: 1 + DERIVA * f, x: tr.foco.x, y: tr.foco.y };
};
const derivar = (p: PosFolha, d: { k: number; x: number; y: number }): PosFolha =>
  d.k === 1 ? p : { ...p, s: p.s * d.k, x: d.x - (d.x - p.x) * d.k, y: d.y - (d.y - p.y) * d.k };
export const derivarPonto = (a: { x: number; y: number }, d: { k: number; x: number; y: number }) => ({
  x: d.x - (d.x - a.x) * d.k,
  y: d.y - (d.y - a.y) * d.k,
});

export const folhaNoTempo = (t: number, cena: Cena, k: number, limite = cena.trechos.length - 1): PosFolha => {
  const i = indiceNoTempo(t, cena, limite);
  const tr = cena.trechos[i];
  if (i === 0) return tr.vista[k];
  const anterior = folhaNoTempo(tr.de, cena, k, i - 1);
  // as folhas chegam escalonadas (a 2ª e a 3ª um instante depois da 1ª)
  const atraso = cena.trechos[i - 1].lugar === "cheio" ? k * 0.05 : 0;
  const alvo = derivar(tr.vista[k], derivaNoTempo(t, cena, i));
  return mixPos(anterior, alvo, prog(t, tr.de + atraso, tr.dur + 0.06, preciso));
};

export const lugarNoTempo = (t: number, cena: Cena) => cena.trechos[indiceNoTempo(t, cena)];

// ancora (ponto na folha que o comentário aponta) e quanto a linha-guia está visível
export const ancoraNoTempo = (t: number, cena: Cena) => {
  const i = indiceNoTempo(t, cena);
  const tr = cena.trechos[i];
  if (tr.lugar !== "margem" || !tr.ancora) return null;
  return { ...derivarPonto(tr.ancora, derivaNoTempo(t, cena, i)), desde: tr.de + tr.dur * 0.75 };
};

// Faixas em que a pessoa está no balão da margem (os comentários resolvidos só aparecem nelas)
export const faixasDaMargem = (cena: Cena, duracao: number) => {
  const faixas: { de: number; ate: number }[] = [];
  cena.trechos.forEach((tr, i) => {
    const fim = cena.trechos[i + 1]?.de ?? duracao + 1;
    if (tr.lugar !== "margem") return;
    const ultima = faixas[faixas.length - 1];
    if (ultima && Math.abs(ultima.ate - tr.de) < 0.01) ultima.ate = fim;
    else faixas.push({ de: tr.de, ate: fim });
  });
  return faixas;
};

