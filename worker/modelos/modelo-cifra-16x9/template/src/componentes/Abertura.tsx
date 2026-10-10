// Momento `abertura`: quadro cheio, cartão de palco na altura do peito. O título nasce a lápis e
// cada palavra ganha tinta quando é falada; um número no começo vira o numeral grande azul. Opcional:
// a linha de apoio, escrita como uma linha de cifra (as cifras em cima das palavras acendem junto com elas).
// O texto é medido: título de qualquer tamanho cabe em até 3 linhas, sem vazar do cartão. No quadro
// deitado o cartão é baixo: o numeral fica numa coluna à esquerda, o título e o apoio ao lado dele.
import { cifraNaTela } from "../acordes";
import { prog, temposDasPalavras } from "../anim";
import { caber, type Encaixe, indicesDoTrecho, largura } from "../medida";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { cor, titulo } from "../tema";
import { PalavraFalada } from "../texto";
import { Cartao, internoDe } from "./Cartao";
import type { Area } from "./Cena";

export { PalavraFalada };

const nucleo = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// em cima de quais palavras ficam as cifras: espalhadas pela linha, de preferência em palavras de
// 3 letras ou mais (como numa cifra de verdade, o acorde cai na sílaba forte, não no "de")
export const palavrasComCifra = (palavras: string[], n: number) => {
  if (n <= 0) return [];
  const fortes = palavras.map((w, i) => ({ w, i })).filter((x) => nucleo(x.w).length >= 3);
  const base = fortes.length >= n ? fortes.map((x) => x.i) : palavras.map((_, i) => i);
  if (n === 1) return [base[0]];
  return Array.from({ length: Math.min(n, base.length) }, (_, k) => base[Math.round((k * (base.length - 1)) / (n - 1))]);
};

export const Abertura: React.FC<{ m: TAbertura; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const INTERNO = internoDe(area);
  const texto = (m.texto ?? m.titulo ?? "").trim();
  const inicio = m.em ?? m.de;
  const { escritas, tempos } = temposDasPalavras(texto, palavras, inicio, fim, inicio);
  const temNumero = /^\d+$/.test(escritas[0] ?? "") && escritas.length > 1;
  const resto = temNumero ? escritas.slice(1) : escritas;
  const temposResto = temNumero ? tempos.slice(1) : tempos;
  const fimTitulo = tempos[tempos.length - 1] ?? inicio;
  const apoio = m.apoio ? temposDasPalavras(m.apoio, palavras, fimTitulo, fim, fimTitulo) : null;
  const cifras = (m.cifras ?? []).slice(0, 6);
  const comCifra = apoio ? palavrasComCifra(apoio.escritas, cifras.length) : [];
  const disponivel = Math.max(150, area.h - 78);

  // No quadro deitado o cartão é largo e baixo (no peito): o título se arruma numa FILEIRA. Com número,
  // o numeral grande fica numa coluna à esquerda e o título e a linha de apoio numa coluna ao lado dele.
  const VAO_NUMERAL = 36;
  const larguraNumeral = (s: number) => (temNumero ? largura(escritas[0], s, { peso: 900, espacamento: -0.02 }) : 0);
  // a linha de cifra: cada palavra ocupa a maior largura entre ela e a cifra em cima dela. A cifra
  // acompanha o corpo do apoio (50 px em cima de um apoio de 58, como no vertical)
  const corpoDaCifra = (s: number) => Math.round(s * 0.86);
  const alturaDaCifra = (s: number) => (cifras.length ? s : 0);
  const pecasDoApoio = (s: number) =>
    apoio
      ? apoio.escritas.map((w, i) => {
          const k = comCifra.indexOf(i);
          return Math.max(largura(w, s, { peso: 700, espacamento: -0.02 }), k >= 0 ? largura(cifraNaTela(cifras[k]), corpoDaCifra(s)) : 0);
        })
      : [];
  const larguraApoio = (s: number) => pecasDoApoio(s).reduce((soma, w, i) => soma + w + (i ? 15 : 0), 0);
  // quantas linhas a linha de apoio ocupa na largura (ela quebra como o flex-wrap do desenho)
  const linhasDoApoio = (s: number, larg: number) => {
    let n = 1;
    let x = 0;
    for (const w of pecasDoApoio(s)) {
      if (x > 0 && x + 15 + w > larg) {
        n++;
        x = w;
      } else x += (x > 0 ? 15 : 0) + w;
    }
    return n;
  };
  const alturaDoApoio = (s: number, larg: number) => (apoio ? linhasDoApoio(s, larg) * (alturaDaCifra(s) + s * 1.1) + 14 : 0);

  // o maior conjunto (numeral, título, apoio) que cabe na altura do cartão: o numeral ocupa a altura
  // toda; o título e o apoio encolhem juntos (o apoio fica com ~metade do corpo do título, como no
  // vertical); o numeral só diminui se a coluna do texto ficar estreita demais
  let numeral = Math.min(240, disponivel);
  let enc: Encaixe = { tamanho: 112, palavras: resto, linhas: [] };
  let coluna = INTERNO;
  let tamanhoApoio = 58;
  for (let k = 0; k < 16; k++) {
    const max = Math.round(112 * (1 - k * 0.05));
    coluna = temNumero ? INTERNO - larguraNumeral(numeral) - VAO_NUMERAL : INTERNO;
    if (temNumero && coluna < INTERNO * 0.55) {
      numeral = Math.max(120, numeral - 20);
      coluna = INTERNO - larguraNumeral(numeral) - VAO_NUMERAL;
    }
    tamanhoApoio = Math.max(40, Math.min(58, Math.round(max * 0.55)));
    while (tamanhoApoio > 40 && larguraApoio(tamanhoApoio) > coluna - 8) tamanhoApoio -= 2;
    enc = caber(resto.join(" "), { largura: coluna, max, min: Math.min(max, 52), linhas: 3 });
    const alturaColuna = enc.linhas.length * enc.tamanho * 1.08 + alturaDoApoio(tamanhoApoio, coluna - 8);
    if (alturaColuna <= disponivel) break;
  }
  const destaque = indicesDoTrecho(resto, m.destaque);
  const destaqueApoio = apoio ? indicesDoTrecho(apoio.escritas, m.destaque) : new Set<number>();

  return (
    <Cartao t={t} de={m.de} area={area}>
      <div style={{ display: "flex", alignItems: "center", gap: VAO_NUMERAL }}>
        {temNumero ? (
          <div style={{ flexShrink: 0 }}>
            <PalavraFalada w={escritas[0]} em={tempos[0]} t={t} tamanho={numeral} cor={cor.azul} peso={900} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: coluna }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {enc.linhas.map((linha, li) => (
              <div key={li} style={{ display: "flex", alignItems: "baseline", gap: Math.round(enc.tamanho * 0.24) }}>
                {linha.map((i) => (
                  <PalavraFalada key={i} w={resto[i]} em={temposResto[i]} t={t} tamanho={enc.tamanho} cor={destaque.has(i) ? cor.azul : cor.marfim} />
                ))}
              </div>
            ))}
          </div>
          {apoio ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0 15px" }}>
              {apoio.escritas.map((w, i) => {
                const k = comCifra.indexOf(i);
                const p = prog(t, apoio.tempos[i] - 0.03, 0.26);
                return (
                  <div key={`${w}-${i}`} style={{ display: "flex", flexDirection: "column" }}>
                    {/* a cifra em cima da palavra */}
                    <div
                      style={{
                        ...titulo,
                        height: alturaDaCifra(tamanhoApoio),
                        fontSize: corpoDaCifra(tamanhoApoio),
                        color: p > 0 ? cor.azul : cor.lapisForte,
                        translate: `0 ${(1 - p) * 8}px`,
                      }}
                    >
                      {k >= 0 ? cifraNaTela(cifras[k]) : ""}
                    </div>
                    <PalavraFalada w={w} em={apoio.tempos[i]} t={t} tamanho={tamanhoApoio} peso={700} cor={destaqueApoio.has(i) ? cor.azul : cor.marfim} />
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </Cartao>
  );
};
