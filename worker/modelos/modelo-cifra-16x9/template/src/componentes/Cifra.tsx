// Momento `cifra`: a folha de cifra na estante (em cima da pessoa). As marcas (acordes, ou textos curtos
// em qualquer assunto) ficam sobre as linhas da letra — desenhadas como faixas, sem letra de verdade —
// e acendem uma a uma, com a faixa embaixo enchendo como num karaokê. Em cima, a semana se completa dia a dia.
import { cifraNaTela, ehCifra } from "../acordes";
import { prog, temposDasPalavras } from "../anim";
import { caber } from "../medida";
import type { Cifra as TCifra, Palavra } from "../plano";
import { cor, fonte, rotulo, titulo } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";

const DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

// larguras das "palavras" de cada linha da letra (fixas, para não mudar de um quadro para o outro)
const palavrasDaLinha = (semente: number, largura: number) => {
  const lista: number[] = [];
  let x = 0;
  let s = semente * 9301 + 49297;
  while (x < largura - 40) {
    s = (s * 9301 + 49297) % 233280;
    const w = 46 + (s / 233280) * 120;
    const cabe = Math.min(w, largura - x);
    if (cabe < 30) break;
    lista.push(cabe);
    x += cabe + 16;
  }
  return lista;
};

export const Cifra: React.FC<{ m: TCifra; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const temSemana = !!m.semana;
  const rotuloSemana = m.semana?.rotulo?.trim() ?? "";
  const topoFolha = temSemana ? (rotuloSemana ? 196 : 150) : 0;
  const alturaFolha = area.h - topoFolha;
  const linhas = m.linhas.slice(0, 3).map((l) => l.slice(0, 4));
  const todos = linhas.flat();
  const emCurso = todos.reduce((k, c, i) => (t >= c.em - 0.02 ? i : k), -1);
  const tituloEm = m.tituloEm ?? m.de + 0.3;
  const { tempos } = temposDasPalavras(m.titulo, palavras, tituloEm - 0.3, fim, tituloEm);
  const PAD = 52;
  const larguraTexto = area.w - 2 * PAD;
  // o título cabe sempre (até 2 linhas, deixando o canto do tom livre)
  const encTitulo = caber(m.titulo, { largura: larguraTexto - (m.tom ? 150 : 0), max: 64, min: 44, linhas: 2 });
  const extra = (encTitulo.linhas.length - 1) * encTitulo.tamanho * 1.08;
  // as linhas se espalham pela folha inteira (nada de folha com metade vazia)
  const PRIMEIRA = 214 + extra;
  const BLOCO = 112;
  const alturaLinha = linhas.length > 1 ? Math.min(210, (alturaFolha - PRIMEIRA - 56 - BLOCO) / (linhas.length - 1)) : 0;
  // marcas que não são cifra (texto): o maior corpo em que todas cabem no seu pedaço da linha
  const tamanhoMarca = (n: number, texto: string) =>
    ehCifra(texto) ? 64 : caber(texto, { largura: larguraTexto / n - 24, max: n === 1 ? 64 : 56, min: 32, linhas: 1, estilo: { peso: 800 } }).tamanho;

  let contador = -1;

  return (
    <>
      {temSemana ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: area.w }}>
          {rotuloSemana ? <div style={{ ...rotulo, color: cor.marfimSuave, textAlign: "center" }}>{rotuloSemana}</div> : null}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: rotuloSemana ? 20 : 0 }}>
            {DIAS.map((d, i) => {
              const p = prog(t, (m.semana?.em ?? m.de) + i * 0.075, 0.24);
              return (
                <div
                  key={d}
                  style={{
                    width: 116,
                    height: 104,
                    borderRadius: 20,
                    border: `3px ${p > 0.5 ? "solid" : "dashed"} ${p > 0.5 ? cor.azul : cor.lapisForte}`,
                    background: p > 0 ? `rgba(134,197,238,${0.95 * p})` : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonte,
                    fontWeight: 700,
                    fontSize: 36,
                    color: p > 0.5 ? cor.palco : cor.lapisForte,
                    scale: String(0.92 + 0.08 * p),
                  }}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* a folha */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: topoFolha,
          width: area.w,
          height: alturaFolha,
          borderRadius: 30,
          background: cor.papel,
          overflow: "hidden",
        }}
      >
        {/* título: a lápis, cada palavra ganha tinta quando é falada */}
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 46 }}>
          <TextoFalado enc={encTitulo} tempos={tempos} t={t} cor={cor.tinta} lapis={cor.tintaLapis} alturaLinha={encTitulo.linhas.length > 1 ? 1.08 : 1} />
        </div>
        {m.tom ? (
          <div style={{ ...rotulo, position: "absolute", right: PAD, top: 128 + extra, color: cor.tintaSuave }}>
            tom: <span style={{ color: cor.azulTinta }}>{cifraNaTela(m.tom)}</span>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: 128 + 44 + extra,
            height: 3,
            width: larguraTexto * prog(t, tempos[tempos.length - 1] ?? tituloEm, 0.5),
            background: cor.tinta,
            opacity: 0.8,
          }}
        />

        {linhas.map((linha, li) => {
          const segmento = larguraTexto / linha.length;
          const faixas = palavrasDaLinha(li + 3, larguraTexto);
          const y = PRIMEIRA + li * alturaLinha;
          // quanto da linha já foi "cantada": até o acorde em curso, mais o pedaço dele que já passou
          let cantado = 0;
          linha.forEach((c, ci) => {
            const proximo = linha[ci + 1]?.em ?? linhas[li + 1]?.[0]?.em ?? c.em + 0.7;
            if (t >= c.em) cantado = (ci + Math.min(1, (t - c.em) / Math.max(0.2, proximo - c.em))) * segmento;
          });
          return (
            <div key={li} style={{ position: "absolute", left: PAD, top: y, width: larguraTexto, height: BLOCO }}>
              {linha.map((c, ci) => {
                contador += 1;
                const k = contador;
                const p = prog(t, c.em - 0.03, 0.26);
                const ativo = k === emCurso;
                return (
                  <div key={ci} style={{ position: "absolute", left: ci * segmento - 16, top: -8 }}>
                    <div
                      style={{
                        ...titulo,
                        fontSize: tamanhoMarca(linha.length, c.cifra),
                        whiteSpace: "nowrap",
                        padding: "6px 16px 8px",
                        borderRadius: 16,
                        background: `rgba(44,106,156,${ativo ? 0.16 * p : 0})`,
                        color: p <= 0 ? cor.tintaLapis : cor.azulTinta,
                        translate: `0 ${(1 - p) * 8}px`,
                      }}
                    >
                      {ehCifra(c.cifra) ? cifraNaTela(c.cifra) : c.cifra}
                    </div>
                  </div>
                );
              })}
              {/* a linha da letra */}
              <div style={{ position: "absolute", left: 0, top: 86, display: "flex", gap: 16 }}>
                {faixas.map((w, fi) => {
                  const inicio = faixas.slice(0, fi).reduce((s, x) => s + x + 16, 0);
                  const cheio = Math.max(0, Math.min(1, (cantado - inicio) / w));
                  return (
                    <div key={fi} style={{ position: "relative", width: w, height: 22, borderRadius: 11, background: cor.tintaLapis, overflow: "hidden" }}>
                      <div style={{ width: `${cheio * 100}%`, height: "100%", background: cor.tinta, opacity: 0.75 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
