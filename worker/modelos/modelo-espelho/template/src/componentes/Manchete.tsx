// Manchete: a linha do espelho sobe e o título ocupa a faixa de cima, como a chamada de capa de
// uma revista de beleza; a pessoa fica embaixo, grande. Cada palavra é revelada pelo fio dourado
// no instante em que é dita.
import { marcarTrecho, PalavraRevelada, prog, saindo, temposDoTexto, TextoFalado, Traco } from "../anim";
import { geometriaDaManchete, LARGURA_MANCHETE } from "../geometria";
import type { Manchete as TManchete, Palavra } from "../plano";
import { cor, rotulo, serif } from "../tema";

export const Manchete: React.FC<{
  m: TManchete;
  t: number;
  fim: number;
  // a linha deste momento e a mais baixa possível (a manchete mede o corpo por ela)
  linhaMaxima: number;
  palavras: Palavra[];
}> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDaManchete(m, linhaMaxima);
  const inicio = Math.max(0, m.em ?? m.de);
  // no começo do vídeo, o que é dito nos primeiros 0,6 s já está inteiro na tela no primeiro quadro
  // (a capa do Reels não fica vazia nem com palavra pela metade)
  const capa = (x: number) => (m.de < 0.3 && x < 0.6 ? -0.5 : x);

  const todas = m.linhas.join(" ");
  const tempos = temposDoTexto(todas, palavras, inicio, m.ate, inicio + 0.1).map(capa);
  // o símbolo pode ter hora própria
  const tokens = todas.split(/\s+/).filter(Boolean);
  if (m.simboloEm !== undefined) tokens.forEach((w, i) => /^[≠=×+→]$/.test(w) && (tempos[i] = m.simboloEm as number));
  // ênfase: procurada no título inteiro (pode atravessar linhas)
  const enfaseGlobal = marcarTrecho(tokens, m.enfase);
  const marcadasPorLinha: Set<number>[] = [];
  let cursor = 0;
  const porLinha = m.linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const fatia = tempos.slice(cursor, cursor + n);
    marcadasPorLinha.push(new Set([...enfaseGlobal].filter((k) => k >= cursor && k < cursor + n).map((k) => k - cursor)));
    cursor += n;
    return fatia;
  });
  const temposRotulo = temposDoTexto(m.rotulo ?? "", palavras, inicio, m.ate, inicio + 0.05).map(capa);
  const temposSub = temposDoTexto(m.sub ?? "", palavras, inicio, m.ate, inicio + 0.6).map(capa);
  const temposAbre = temposDoTexto(m.abre ?? "", palavras, inicio, m.ate, inicio + 0.05).map(capa);

  const sai = saindo(t, fim, 0.35);

  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - LARGURA_MANCHETE) / 2,
        width: LARGURA_MANCHETE,
        top: g.topoTexto,
        height: g.alturaTexto,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity: 1 - sai,
        translate: `0 ${-12 * sai}px`,
      }}
    >
      {m.rotulo ? (
        <div style={{ ...rotulo, fontSize: g.tamanhoRotulo, letterSpacing: "0.18em", display: "flex", justifyContent: "center", alignItems: "center", height: 36, marginBottom: 24, whiteSpace: "nowrap" }}>
          {m.rotulo.split(/\s+/).map((w, i, lista) => (
            <PalavraRevelada key={`${w}-${i}`} w={w} p={prog(t, temposRotulo[i], 0.4)} margem={i < lista.length - 1 ? "0.5em" : 0} semFio />
          ))}
        </div>
      ) : null}
      {m.abre ? (
        <TextoFalado
          texto={m.abre}
          tempos={temposAbre}
          t={t}
          style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, fontSize: g.tamanhoAbre, lineHeight: 1.12, color: cor.cafe, whiteSpace: "nowrap", marginBottom: 14 }}
        />
      ) : null}
      {m.linhas.map((l, i) => (
        <div key={`${l}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: g.tamanho * 1.06 }}>
          <TextoFalado
            texto={l}
            tempos={porLinha[i]}
            t={t}
            marcadasFora={marcadasPorLinha[i]}
            style={{
              fontFamily: serif,
              fontWeight: 500,
              fontSize: g.tamanho,
              lineHeight: 1.06,
              color: cor.cafe,
              letterSpacing: "-0.012em",
              whiteSpace: "nowrap",
            }}
          />
          {m.seloEm !== undefined && i === m.linhas.length - 1 ? <Selo p={prog(t, m.seloEm, 0.8)} tamanho={g.tamanho * 0.62} /> : null}
        </div>
      ))}
      {m.sub ? (
        <div style={{ ...rotulo, fontSize: g.tamanhoSub, color: cor.cafe, display: "flex", justifyContent: "center", marginTop: 26, whiteSpace: "nowrap" }}>
          {m.sub.split(/\s+/).map((w, i, lista) => (
            <PalavraRevelada key={`${w}-${i}`} w={w} p={prog(t, temposSub[i], 0.4)} margem={i < lista.length - 1 ? "0.5em" : 0} semFio />
          ))}
        </div>
      ) : null}
    </div>
  );
};

// Selo: círculo fino dourado que se fecha e um visto que se desenha dentro
const Selo: React.FC<{ p: number; tamanho: number }> = ({ p, tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 60 60" style={{ marginLeft: tamanho * 0.32, overflow: "visible", flex: "none" }}>
    <Traco d="M 30 3 A 27 27 0 1 1 29.9 3" p={prog(p, 0, 0.7, (x) => x)} cor={cor.ouro} largura={3} />
    <Traco d="M 18 31 L 26 39 L 43 22" p={prog(p, 0.5, 0.5, (x) => x)} cor={cor.ouro} largura={3.6} />
  </svg>
);
