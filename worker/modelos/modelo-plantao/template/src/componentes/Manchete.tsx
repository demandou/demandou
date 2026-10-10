// Manchete: o GC de telejornal em quadro cheio — o chapéu na aba azul, a manchete na tarja branca
// (cada palavra acende quando é dita) e a tarja de nome embaixo.
import { indicesDoDestaque, Palavras, temposDoTexto } from "../anim";
import type { Manchete as M, Palavra, Plano } from "../plano";
import { cor, rotulo } from "../tema";
import { Gc, textoDoGc } from "./Gc";

export { LARGURA_GC } from "./Gc";

export const Manchete: React.FC<{ m: M; plano: Plano; palavras: Palavra[]; t: number; base: number; fim: number; alturaMax: number }> = ({
  m,
  plano,
  palavras,
  t,
  base,
  fim,
  alturaMax,
}) => {
  const chapeu = m.chapeu?.split(/\s+/).filter(Boolean) ?? [];
  const comNome = m.tarja !== false && !!plano.marca?.nome;
  const { linhas, tam } = textoDoGc(m.titulo, { alturaMax, aba: chapeu.length > 0, nome: comNome, maximo: 116, minimo: 60, linhas: 2 });
  const inicio = m.de + 0.14;
  const temposChapeu = m.chapeu ? temposDoTexto(m.chapeu, palavras, m.de, m.ate, m.de + 0.1) : [];
  const temposTitulo = temposDoTexto(m.titulo, palavras, m.de, m.ate, inicio);
  return (
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
      tempos={temposTitulo}
      tam={tam}
      destaque={indicesDoDestaque(m.titulo, m.destaque)}
      marca={comNome ? plano.marca : null}
    />
  );
};
