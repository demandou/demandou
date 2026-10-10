/**
 * A GEOMETRIA DO APRESENTADOR, em números, para quem escreve o roteiro (o
 * Claude não vê o vídeo: recebe onde o rosto e a cabeça estão e onde eles
 * caem no quadro 1080 × 1920 em cada enquadramento). Puro (testado).
 */
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const mediana = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export function geometriaDoApresentador({ rosto, gravacao, recorte }) {
  const W = gravacao.largura;
  const H = gravacao.altura;
  const r = { x: Math.round(media(rosto.map((p) => p.x))), y: Math.round(media(rosto.map((p) => p.y))), queixo: Math.round(media(rosto.map((p) => p.queixo))) };
  const xs = rosto.map((p) => p.x);
  const movimento = xs.length ? Math.round(Math.max(...xs) - Math.min(...xs)) : 0;
  const cheia = Math.max(1080 / W, 1920 / H);
  const saida = {
    gravacao: { largura: W, altura: H },
    rostoNaGravacao: { ...r, movimentoHorizontal: movimento },
    telaCheia: { escala: +cheia.toFixed(3), rostoY: Math.round(Math.min(0, Math.max(1920 - H * cheia, 730 - r.y * cheia)) + r.y * cheia), queixoY: Math.round(Math.min(0, Math.max(1920 - H * cheia, 730 - r.y * cheia)) + r.queixo * cheia) },
    recorte: null,
  };
  if (recorte) {
    const topoRec = recorte.caixa[1] + mediana(recorte.cabeca.filter(Boolean).map((c) => c.topo));
    const e = 1.15;
    const base = Math.round(560 - topoRec * e + H * e);
    saida.recorte = {
      topoDaCabecaNaGravacao: Math.round(topoRec),
      comEscala115: {
        escala: e,
        base,
        topoDaCabeca: 560,
        rostoY: Math.round(base - H * e + r.y * e),
        queixoY: Math.round(base - H * e + r.queixo * e),
      },
    };
  }
  return saida;
}
