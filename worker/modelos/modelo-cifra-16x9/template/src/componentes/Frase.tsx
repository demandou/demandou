// Momento `frase`: quadro cheio, cartão de palco no peito com uma frase. Nasce a lápis; cada
// palavra ganha tinta quando é falada; o trecho de destaque fica azul e ganha um traço embaixo; o trecho
// de risco é riscado quando é dito (o traço de marfim passa e as palavras apagam, como corda abafada).
import { temposDasPalavras } from "../anim";
import { caber, indicesDoTrecho } from "../medida";
import type { Frase as TFrase, Palavra } from "../plano";
import { cor, rotulo } from "../tema";
import { TextoFalado } from "../texto";
import { Cartao, internoDe } from "./Cartao";
import type { Area } from "./Cena";

export const Frase: React.FC<{ m: TFrase; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const INTERNO = internoDe(area);
  const inicio = m.em ?? m.de;
  const { tempos } = temposDasPalavras(m.texto, palavras, inicio, fim, inicio);
  const disponivel = Math.max(160, area.h - 78 - (m.rotulo ? 54 : 0));
  let enc = caber(m.texto, { largura: INTERNO, max: 80, min: 52, linhas: 3 });
  for (let max = 76; enc.linhas.length * enc.tamanho * 1.08 > disponivel && max >= 44; max -= 4) {
    enc = caber(m.texto, { largura: INTERNO, max, min: Math.min(max, 44), linhas: 4 });
  }
  const destaque = indicesDoTrecho(enc.palavras, m.destaque);
  const risco = indicesDoTrecho(enc.palavras, m.risco);

  return (
    <Cartao t={t} de={m.de} area={area}>
      <div>
        {m.rotulo ? <div style={{ ...rotulo, color: cor.azul, marginBottom: 22 }}>{m.rotulo}</div> : null}
        <TextoFalado
          enc={enc}
          tempos={tempos}
          t={t}
          cor={cor.marfim}
          destaque={destaque}
          sublinhar
          risco={risco}
          riscoEm={m.riscoEm}
        />
      </div>
    </Cartao>
  );
};
