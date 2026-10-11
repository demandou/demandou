/**
 * O QUADRO NÍTIDO DA CAPA (11/10/2026). Regra pura, sem ffmpeg nem Python: o
 * quadro-da-capa.py mede cada candidato e quem decide é esta regra.
 *
 * ## Por que existe
 *
 * O Bruno, em 10/10, à noite: "as thumbs estão ficando horríveis, pegando uma
 * imagem distorcida da pessoa do vídeo; sempre pegar uma imagem nítida ou não
 * colocar foto". O diagnóstico, lido no código e medido na gravação de prova:
 *
 * 1. A escolha (quadro-da-capa.py, 30/09) dava NOTA ao quadro por olho, boca,
 *    sorriso, tamanho e giro, e ficava com a maior nota, fosse qual fosse. Não
 *    havia corte nenhum: o "melhor" de uma lista ruim virava capa. Olho meio
 *    fechado (piscada 0,53) com sorriso ganhava de olho aberto sério.
 * 2. Não media NITIDEZ. Quadro no meio de um gesto (borrão de movimento) passava
 *    igual ao parado. Na gravação de prova, os quadros de 796 s e 845 s têm
 *    nitidez 42 e 49, contra 75 a 134 dos parados, e a nota não via diferença.
 * 3. Não olhava o TAMANHO REAL do rosto em pixels. Numa gravação de tela com a
 *    webcam no canto, o rosto tem 80 a 120 px, e a capa ampliava o recorte da
 *    pessoa de 2,5 a 4 vezes (a capa vertical pede a pessoa com 1152 px de
 *    altura): é o "distorcido" que se vê, a imagem mole e serrilhada.
 * 4. Rosto encostado na borda do quadro (cortado) entrava.
 * 5. Quando nada tinha rosto, o caminho de reserva pegava um quadro FIXO (15%
 *    do trecho, ou o instante do agente de visão) sem conferir nada, e o
 *    recorte da pessoa saía dele.
 *
 * ## A regra
 *
 * Um candidato só serve se: tem rosto; o olho está aberto (piscada até 0,45);
 * o rosto está inteiro dentro do quadro; o rosto tem pelo menos 140 px de
 * largura; a nitidez do rosto (variância do Laplaciano com o rosto em 256 px)
 * passa de 55; a cabeça não está de perfil (giro até 35 graus); e, quando o
 * destino é conhecido, levar o quadro até ele não pede ampliar mais de 2 vezes.
 * Entre os que servem, vence a nota de sempre (olho, boca, sorriso, tamanho,
 * giro) com um bônus pequeno de nitidez. Nenhum serve: null, e a capa sai SEM a
 * foto da pessoa (ou com a foto da Biblioteca de materiais), nunca com um
 * quadro ruim.
 *
 * Os limiares saíram da gravação de prova (prova-obs/original.mp4, 1920x1080,
 * 24 quadros espalhados): os dois quadros com borrão de movimento ficam abaixo
 * de 55, os parados acima de 69; os de olho fechado e meio fechado (0,46 a
 * 0,80) ficam acima de 0,45.
 *
 * E NUNCA ESTICAR: a janela de qualquer formato sai do quadro na proporção do
 * destino (`janelaSemEsticar`), e só depois a escala é uniforme.
 */

export const REGRA_DO_QUADRO = Object.freeze({
  piscadaMaxima: 0.45,
  larguraMinimaDoRostoPx: 140,
  nitidezMinima: 55,
  giroMaximo: 35,
  /** O rosto inteiro dentro do quadro, com esta folga da borda (fração). */
  folgaDaBorda: 0.005,
  /** Quanto o quadro pode ser ampliado para cobrir o destino. */
  ampliacaoMaxima: 2,
});

/**
 * Quanto um quadro precisa ser ampliado para COBRIR o destino (escala
 * uniforme, como `cover`): 1 ou menos é redução. Pura.
 */
export function ampliacaoParaCobrir(largura, altura, alvo) {
  if (!(largura > 0 && altura > 0) || !alvo || !(alvo.largura > 0 && alvo.altura > 0)) return 1;
  return Math.max(alvo.largura / largura, alvo.altura / altura);
}

/**
 * O candidato serve de foto de capa? Devolve { ok, motivos } (os motivos de
 * descarte, na ordem da regra). `c`: { largura, altura, medida } como o
 * quadro-da-capa.py devolve; `alvo` opcional { largura, altura }. Pura.
 */
export function avaliarQuadro(c, { regra = REGRA_DO_QUADRO, alvo = null } = {}) {
  const m = c?.medida;
  if (!m || !m.caixa) return { ok: false, motivos: ["sem rosto"] };
  const motivos = [];
  if (!(m.piscada <= regra.piscadaMaxima)) motivos.push(`olho fechado (${m.piscada})`);
  const { x, y, w, h } = m.caixa;
  const f = regra.folgaDaBorda;
  if (x < f || y < f || x + w > 1 - f || y + h > 1 - f) motivos.push("rosto cortado na borda");
  const larguraPx = w * (c.largura ?? 0);
  if (!(larguraPx >= regra.larguraMinimaDoRostoPx)) motivos.push(`rosto pequeno (${Math.round(larguraPx)} px)`);
  if (!(Number(m.nitidez) >= regra.nitidezMinima)) motivos.push(`borrado (nitidez ${m.nitidez ?? "?"})`);
  if (Math.abs(Number(m.giro) || 0) > regra.giroMaximo) motivos.push(`de perfil (${m.giro} graus)`);
  if (alvo) {
    const amp = ampliacaoParaCobrir(c.largura, c.altura, alvo);
    if (amp > regra.ampliacaoMaxima) motivos.push(`ampliação de ${amp.toFixed(1)}x para ${alvo.largura}x${alvo.altura}`);
  }
  return { ok: motivos.length === 0, motivos };
}

/** A nota do candidato que serve: a de sempre, mais um bônus pequeno de nitidez (até 0,3). Pura. */
export function notaComNitidez(m) {
  return (Number(m.nota) || 0) + Math.min(0.3, Math.max(0, (Number(m.nitidez) || 0) - 55) / 300);
}

/**
 * O melhor quadro nítido entre os candidatos, ou null quando nenhum serve.
 * Devolve { escolhido, descartados: [{ instante, motivos }] }. Pura.
 */
export function escolherQuadroNitido(candidatos, opcoes = {}) {
  const descartados = [];
  let escolhido = null;
  for (const c of candidatos ?? []) {
    const a = avaliarQuadro(c, opcoes);
    if (!a.ok) {
      descartados.push({ instante: c?.instante ?? null, motivos: a.motivos });
      continue;
    }
    if (!escolhido || notaComNitidez(c.medida) > notaComNitidez(escolhido.medida)) escolhido = c;
  }
  return { escolhido, descartados };
}

/**
 * A maior janela do quadro na proporção do destino, centrada no ponto pedido
 * (o rosto) e presa dentro do quadro. Nunca estica: a janela tem a proporção
 * exata do destino, e quem usa só escala por igual. Em pixels inteiros e pares.
 * `centro` em fração ({ x, y }); sem centro, o meio. Pura.
 */
export function janelaSemEsticar(largura, altura, alvo, centro = null) {
  const prop = alvo.largura / alvo.altura;
  let w = largura;
  let h = Math.round(w / prop);
  if (h > altura) {
    h = altura;
    w = Math.round(h * prop);
  }
  w -= w % 2;
  h -= h % 2;
  const cx = (centro?.x ?? 0.5) * largura;
  const cy = (centro?.y ?? 0.5) * altura;
  const x = Math.round(Math.min(Math.max(0, cx - w / 2), largura - w));
  const y = Math.round(Math.min(Math.max(0, cy - h / 2), altura - h));
  return { x, y, w, h, escala: alvo.largura / w };
}

/**
 * Até onde a pessoa recortada pode crescer sem ficar mole: a altura pedida, ou
 * a altura original vezes a ampliação máxima, o que for menor. Pura.
 */
export function alturaSemAmpliarDemais(alturaOriginal, alturaPedida, regra = REGRA_DO_QUADRO) {
  if (!(alturaOriginal > 0)) return alturaPedida;
  return Math.max(1, Math.min(alturaPedida, Math.floor(alturaOriginal * regra.ampliacaoMaxima)));
}

/**
 * Vários quadros nítidos e DIFERENTES (11/10, as artes da campanha): os que
 * passam na regra, do melhor para o pior, a pelo menos `distancia` segundos
 * uns dos outros (dois quadros colados no tempo são a mesma foto), até
 * `quantos`. Pura.
 */
export function escolherVariosNitidos(candidatos, { quantos = 1, distancia = 8, ...opcoes } = {}) {
  const bons = (candidatos ?? [])
    .filter((c) => avaliarQuadro(c, opcoes).ok)
    .sort((a, b) => notaComNitidez(b.medida) - notaComNitidez(a.medida));
  const escolhidos = [];
  for (const c of bons) {
    if (escolhidos.length >= quantos) break;
    if (escolhidos.some((e) => Math.abs((e.instante ?? 0) - (c.instante ?? 0)) < distancia)) continue;
    escolhidos.push(c);
  }
  return escolhidos;
}
