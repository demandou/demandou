// Momento `abertura`: quadro cheio, cartão de palco na altura do peito. O título nasce a lápis e
// cada palavra ganha tinta quando é falada; um número no começo vira o numeral grande azul. Opcional:
// a linha de apoio, escrita como uma linha de cifra (as cifras em cima das palavras acendem junto com elas).
// O texto é medido: título de qualquer tamanho cabe em até 3 linhas, sem vazar do cartão.
import { cifraNaTela } from "../acordes";
import { prog, temposDasPalavras } from "../anim";
import { caber, type Encaixe, indicesDoTrecho, largura } from "../medida";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { cor, titulo } from "../tema";
import { PalavraFalada } from "../texto";
import { Cartao, INTERNO } from "./Cartao";
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
  const disponivel = Math.max(200, area.h - 78);

  // a linha de cifra: o maior corpo (58 → 44) em que ela cabe numa linha só
  const larguraApoio = (s: number) =>
    apoio
      ? apoio.escritas.reduce((soma, w, i) => {
          const k = comCifra.indexOf(i);
          const lw = largura(w, s, { peso: 700, espacamento: -0.02 });
          const cw = k >= 0 ? largura(cifraNaTela(cifras[k]), 50) : 0;
          return soma + Math.max(lw, cw) + (i ? 15 : 0);
        }, 0)
      : 0;
  let tamanhoApoio = 58;
  while (tamanhoApoio > 44 && larguraApoio(tamanhoApoio) > INTERNO - 8) tamanhoApoio -= 2;
  const alturaApoio = apoio ? (cifras.length ? 58 : 0) + tamanhoApoio * 1.1 + 14 : 0;

  // o título: com número, o numeral fica na primeira linha e o resto encaixa ao lado dele (e embaixo)
  let numeral = 220;
  let enc: Encaixe = { tamanho: 112, palavras: resto, linhas: [] };
  for (let k = 0; k < 12; k++) {
    const max = Math.round(112 * (1 - k * 0.06));
    const larguraNumeral = temNumero ? largura(escritas[0], numeral, { peso: 900, espacamento: -0.02 }) + 26 : 0;
    enc = caber(resto.join(" "), { largura: temNumero ? [INTERNO - larguraNumeral, INTERNO] : INTERNO, max, min: Math.min(max, 60), linhas: 3 });
    const alturaTitulo = temNumero ? numeral + (enc.linhas.length - 1) * enc.tamanho * 1.08 : enc.linhas.length * enc.tamanho * 1.08;
    if (alturaTitulo + alturaApoio <= disponivel) break;
    numeral = Math.max(130, numeral - 20);
  }
  const destaque = indicesDoTrecho(resto, m.destaque);
  const destaqueApoio = apoio ? indicesDoTrecho(apoio.escritas, m.destaque) : new Set<number>();

  return (
    <Cartao t={t} de={m.de} area={area}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {enc.linhas.map((linha, li) => (
            <div key={li} style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
              {li === 0 && temNumero ? <PalavraFalada w={escritas[0]} em={tempos[0]} t={t} tamanho={numeral} cor={cor.azul} peso={900} /> : null}
              <div style={{ display: "flex", alignItems: "baseline", gap: Math.round(enc.tamanho * 0.24) }}>
                {linha.map((i) => (
                  <PalavraFalada key={i} w={resto[i]} em={temposResto[i]} t={t} tamanho={enc.tamanho} cor={destaque.has(i) ? cor.azul : cor.marfim} />
                ))}
              </div>
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
                      height: cifras.length ? 58 : 0,
                      fontSize: 50,
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
    </Cartao>
  );
};
