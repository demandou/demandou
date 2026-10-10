// Abertura (bloco universal) em quadro cheio: o "risco" da vinheta (faixas que cruzam a tela) e o
// título do vídeo na tarja branca do GC, palavra por palavra na fala, com o chapéu na aba azul e a
// tarja de nome embaixo — a primeira tela do telejornal, sobre qualquer assunto.
import { indicesDoDestaque, Palavras, prog, temposDoTexto, troca } from "../anim";
import type { Abertura as A, Palavra, Plano } from "../plano";
import { cor, rotulo, W } from "../tema";
import { ALTURA_ABA, ALTURA_NOME, Gc, textoDoGc } from "./Gc";

export const Abertura: React.FC<{ m: A; plano: Plano; palavras: Palavra[]; t: number; base: number; fim: number; alturaMax: number }> = ({
  m,
  plano,
  palavras,
  t,
  base,
  fim,
  alturaMax,
}) => {
  const chapeu = m.chapeu?.split(/\s+/).filter(Boolean) ?? [];
  const comNome = !!plano.marca?.nome;
  const { linhas, tam } = textoDoGc(m.texto, { alturaMax: alturaMax - 40, aba: chapeu.length > 0, nome: comNome, maximo: 112, minimo: 60, linhas: 3 });
  const inicio = Math.max(m.de + 0.12, m.em ?? 0);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  const temposChapeu = chapeu.length ? temposDoTexto(m.chapeu ?? "", palavras, m.de, m.ate, m.de + 0.08) : [];
  // altura da pilha, para as faixas cruzarem logo acima dela
  const altura = (chapeu.length ? ALTURA_ABA : 0) + linhas.length * tam * 1.06 + tam * 0.42 + (comNome ? ALTURA_NOME : 0);
  const topo = base - altura;
  const faixas = [
    { y: topo - 40, h: 10, cor: cor.eletrico, atraso: 0 },
    { y: topo - 22, h: 6, cor: cor.branco, atraso: 0.07 },
    { y: topo - 10, h: 4, cor: cor.celeste, atraso: 0.12 },
  ];
  return (
    <>
      {t < fim
        ? faixas.map((f, i) => {
            const p = prog(t, m.de + f.atraso, 0.62, troca);
            if (p <= 0 || p >= 1) return null;
            return <div key={i} style={{ position: "absolute", top: f.y, left: -760 + p * (W + 760), width: 760, height: f.h, background: f.cor }} />;
          })
        : null}
      <Gc
        t={t}
        de={m.de}
        fim={fim}
        base={base}
        aba={
          chapeu.length ? (
            <Palavras palavras={chapeu} tempos={temposChapeu} t={t} esboco="rgba(255,255,255,0.35)" corDe={() => cor.branco} style={{ ...rotulo, fontSize: 38 }} />
          ) : undefined
        }
        linhas={linhas}
        tempos={tempos}
        tam={tam}
        destaque={indicesDoDestaque(m.texto, m.destaque)}
        marca={comNome ? plano.marca : null}
      />
    </>
  );
};
