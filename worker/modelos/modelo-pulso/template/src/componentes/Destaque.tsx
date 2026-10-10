// Destaque: embaixo do relógio grande, a frase curta bate palavra por palavra na cor do nível (o anel
// inteiro acende na mesma cor e o coração acelera — ver relogio.ts); o detalhe entra depois, menor.
import { Linhas, temposDoTexto } from "../anim";
import { peDoRelogio, RELOGIO } from "../layout";
import { encaixar, SANS_600 } from "../medida";
import type { Destaque as DestaqueT, Palavra } from "../plano";
import { CONTEUDO, cor, mostrador, sans, ZONAS } from "../tema";

export const Destaque: React.FC<{ m: DestaqueT; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const z = m.nivel === "alerta" ? ZONAS[4] : ZONAS[1];
  const topo = peDoRelogio(RELOGIO) + 34;
  const espaco = 1520 - topo;
  const det = m.detalhe?.trim();
  const encDet = det ? encaixar(det, { largura: CONTEUDO.w, max: 52, min: 40, linhas: 2, fonte: SANS_600 }) : null;
  const altDet = encDet ? encDet.linhas.length * Math.round(encDet.tamanho * 1.2) + 14 : 0;
  // a frase: o maior corpo em que ela cabe no espaço que sobra (até 2 linhas, ou 3 se precisar)
  let enc = encaixar(m.texto, { largura: CONTEUDO.w, max: 104, min: 60, linhas: 2 });
  while (enc.linhas.length * Math.round(enc.tamanho * 1.06) > espaco - altDet && enc.tamanho > 52) {
    enc = encaixar(m.texto, { largura: CONTEUDO.w, max: enc.tamanho - 4, min: Math.min(52, enc.tamanho - 4), linhas: 3 });
  }
  const lh = Math.round(enc.tamanho * 1.06);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, m.em), m.ate, m.em);
  const temposDet = det ? temposDoTexto(det, palavras, m.em, m.ate + 0.3, m.detalheEm ?? m.em + 0.5) : [];
  const altura = enc.linhas.length * lh + altDet;
  const y = topo + Math.max(0, (espaco - altura) / 2 - 10);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Linhas
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        x={CONTEUDO.x}
        y={y}
        largura={CONTEUDO.w}
        alturaLinha={lh}
        alinhar="center"
        estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: z.texto, letterSpacing: "-0.01em" }}
        esboco={cor.esboco}
      />
      {encDet ? (
        <Linhas
          linhas={encDet.linhas}
          tempos={temposDet}
          t={t}
          x={CONTEUDO.x}
          y={y + enc.linhas.length * lh + 14}
          largura={CONTEUDO.w}
          alturaLinha={Math.round(encDet.tamanho * 1.2)}
          alinhar="center"
          estilo={{ fontFamily: sans, fontWeight: 600, fontSize: encDet.tamanho, color: cor.tintaSuave }}
          esboco={cor.esboco}
        />
      ) : null}
    </div>
  );
};
