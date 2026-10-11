/**
 * A GEOMETRIA DO APRESENTADOR, em números, para quem escreve o roteiro (o
 * Claude não vê o vídeo: recebe onde o rosto e a cabeça estão e onde eles
 * caem no quadro em cada enquadramento). Puro (testado).
 *
 * O quadro é o do corte: 1080 × 1920 (em pé, os cortes) ou 1920 × 1080
 * (deitado, o vídeo completo de gravação deitada, 11/10).
 */
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const mediana = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** O quadro do formato pedido: "16:9" deitado, qualquer outro em pé. Puro (testado). */
export function quadroDoFormato(formato) {
  return formato === "16:9" ? { largura: 1920, altura: 1080, formato: "16:9" } : { largura: 1080, altura: 1920, formato: "9:16" };
}

export function geometriaDoApresentador({ rosto, gravacao, recorte, quadro = quadroDoFormato("9:16") }) {
  const W = gravacao.largura;
  const H = gravacao.altura;
  const QW = quadro.largura;
  const QH = quadro.altura;
  const deitado = QW > QH;
  const r = { x: Math.round(media(rosto.map((p) => p.x))), y: Math.round(media(rosto.map((p) => p.y))), queixo: Math.round(media(rosto.map((p) => p.queixo))) };
  const xs = rosto.map((p) => p.x);
  const movimento = xs.length ? Math.round(Math.max(...xs) - Math.min(...xs)) : 0;
  const cheia = Math.max(QW / W, QH / H);
  // o rosto na tela cheia vai para 38% da altura do quadro (730 de 1920), até onde a gravação deixa
  const alvoDoRosto = Math.round(QH * 0.38);
  const topoCheio = Math.min(0, Math.max(QH - H * cheia, alvoDoRosto - r.y * cheia));
  const saida = {
    quadro: { largura: QW, altura: QH, formato: deitado ? "16:9" : "9:16" },
    gravacao: { largura: W, altura: H },
    rostoNaGravacao: { ...r, movimentoHorizontal: movimento },
    telaCheia: { escala: +cheia.toFixed(3), rostoY: Math.round(topoCheio + r.y * cheia), queixoY: Math.round(topoCheio + r.queixo * cheia) },
    recorte: null,
  };
  if (recorte) {
    const topoRec = recorte.caixa[1] + mediana(recorte.cabeca.filter(Boolean).map((c) => c.topo));
    // em pé: escala 1,15 com o topo da cabeça em 560 (aula 8.2); deitado: escala 1 com o topo em 14% da altura
    const e = deitado ? 1 : 1.15;
    const topoDaCabeca = deitado ? Math.round(QH * 0.14) : 560;
    const base = Math.round(topoDaCabeca - topoRec * e + H * e);
    const numeros = {
      escala: e,
      base,
      topoDaCabeca,
      rostoY: Math.round(base - H * e + r.y * e),
      queixoY: Math.round(base - H * e + r.queixo * e),
    };
    saida.recorte = { topoDaCabecaNaGravacao: Math.round(topoRec), ...(deitado ? { comEscala100: numeros } : { comEscala115: numeros }) };
  }
  return saida;
}
