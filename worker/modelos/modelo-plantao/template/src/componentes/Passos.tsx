// Passos (sequência) no painel do estúdio: as etapas numeradas num trilho vertical, como o trilho da
// etiqueta. Tudo nasce "a lápis" (quadrados tracejados, texto apagado, trilho pontilhado); quando
// uma etapa é dita, o azul elétrico corre pelo trilho até ela, o número acende e o texto entra
// palavra por palavra. O detalhe vem embaixo (ou ao lado), menor, em azul-claro.
import { limitar, Linhas, Palavras, prog, temposDoTexto, troca } from "../anim";
import type { Area } from "../layout";
import { caber, caberNaAltura } from "../medidas";
import type { Palavra, Passos as P } from "../plano";
import { cor, manchete, MARGEM, rotulo, W } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { Quadrado } from "./Selos";
import { linhasDoPainel } from "./Topicos";

export const Passos: React.FC<{ m: P; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const itens = m.itens.slice(0, 5);
  const temDetalhe = itens.some((i) => i.detalhe?.trim());
  const { cab, y0, passo, h } = linhasDoPainel(area, m.titulo, itens.length, temDetalhe ? 128 : 100);
  const lado = Math.min(84, Math.max(54, h - (temDetalhe && h >= 108 ? 30 : 8)));
  const xTrilho = MARGEM + lado / 2;
  const xTexto = MARGEM + lado + 28;
  const larguraTexto = W - MARGEM - xTexto;
  const detalheEmBaixo = temDetalhe && h >= 108;
  // quanto o azul já correu pelo trilho (do centro do quadrado 1 até o da etapa atual)
  const centros = itens.map((_, i) => y0 + i * passo + lado / 2);
  let yFio = centros[0];
  itens.forEach((it, i) => {
    if (i === 0) return;
    const p = prog(t, it.em - 0.35, 0.4, troca);
    yFio = Math.max(yFio, centros[i - 1] + (centros[i] - centros[i - 1]) * p);
  });
  const pPrimeiro = prog(t, itens[0].em - 0.1, 0.3);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cab && m.titulo ? <Cabecalho titulo={m.titulo} medida={cab} palavras={palavras} t={t} de={m.de} ate={m.ate} inicio={Math.max(entra + 0.15, m.de)} y={area.y + 30} /> : null}
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={xTrilho} x2={xTrilho} y1={centros[0]} y2={centros[centros.length - 1]} stroke={cor.apagadoNoAzul} strokeWidth={5} strokeDasharray="10 12" />
        {pPrimeiro > 0 ? <line x1={xTrilho} x2={xTrilho} y1={centros[0]} y2={yFio} stroke={cor.eletrico} strokeWidth={8} /> : null}
      </svg>
      {itens.map((it, i) => {
        const p = prog(t, it.em - 0.1, 0.3);
        const y = Math.round(y0 + i * passo);
        const tamMax = Math.min(56, Math.round((detalheEmBaixo ? lado : h) * 0.62));
        const larguraItem = detalheEmBaixo || !it.detalhe ? larguraTexto : larguraTexto * 0.62;
        const umaLinha = caber(it.texto, { largura: larguraItem, maximo: tamMax, minimo: 30, linhas: 1, corte: { peso: 800, alta: true } });
        // etapa longa com espaço: duas linhas maiores em vez de uma linha miúda
        const linha =
          umaLinha.tam < 40 && !detalheEmBaixo && h >= 100
            ? caberNaAltura(it.texto, { largura: larguraItem, maximo: tamMax, minimo: 30, linhas: 2, corte: { peso: 800, alta: true }, alturaMax: h - 8, entrelinha: 1.04 })
            : umaLinha;
        const tempos = temposDoTexto(it.texto, palavras, m.de, m.ate, it.em - 0.08);
        const detalheEm = it.detalheEm ?? (tempos[tempos.length - 1] ?? it.em) + 0.35;
        const detalhe = it.detalhe
          ? caber(it.detalhe, { largura: detalheEmBaixo ? larguraTexto : larguraTexto * 0.36, maximo: Math.max(32, Math.round(linha.tam * 0.72)), minimo: 30, linhas: 1, corte: { peso: 800, alta: true, espacamento: 0.04 } })
          : null;
        const temposDetalhe = it.detalhe ? temposDoTexto(it.detalhe, palavras, m.de, m.ate, detalheEm - 0.08) : [];
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: MARGEM, top: y, background: cor.estudio }}>
              <Quadrado p={p} tamanho={lado}>
                <div style={{ ...manchete, fontSize: Math.round(lado * 0.56), color: cor.branco, translate: "0 2px" }}>{i + 1}</div>
              </Quadrado>
            </div>
            <div
              style={{
                position: "absolute",
                left: xTexto,
                top: y,
                width: larguraTexto,
                height: detalheEmBaixo ? h : lado,
                display: "flex",
                flexDirection: detalheEmBaixo ? "column" : "row",
                justifyContent: detalheEmBaixo ? "flex-start" : "flex-start",
                alignItems: detalheEmBaixo ? "flex-start" : "center",
                gap: detalheEmBaixo ? 6 : 18,
                paddingTop: detalheEmBaixo ? Math.max(0, (lado - linha.tam) / 2 - 2) : 0,
              }}
            >
              <Linhas linhas={linha.linhas} tempos={tempos} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.branco} style={{ ...manchete, fontWeight: 800, letterSpacing: 0, fontSize: linha.tam }} />
              {detalhe ? (
                <Palavras
                  palavras={(it.detalhe ?? "").split(/\s+/).filter(Boolean)}
                  tempos={temposDetalhe}
                  t={t}
                  esboco={cor.apagadoNoAzul}
                  corDe={() => cor.celeste}
                  style={{ ...rotulo, letterSpacing: "0.04em", fontSize: detalhe.tam, opacity: limitar(0.5 + p) }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
