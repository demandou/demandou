// Comparação: a tela dividida do sistema. Duas janelas lado a lado embaixo da pessoa, cada uma com
// o nome do lado na barra de título e o texto dito no corpo (esperando a lápis até a palavra).
// No veredito, o mouse clica na janela que ganha: ela ganha o contorno violeta e o ✓; a outra
// apaga (em "errado-certo", o texto dela é riscado).
import { janelaAberta, mistura, prog, temposDoTexto } from "../anim";
import { geoComparacao } from "../blocos";
import { ICONES_DOCK, iconeDoTipo, posDock } from "../geometria";
import { corpoQueCabe, encaixar } from "../medida";
import type { Comparacao, Palavra, Plano } from "../plano";
import { TextoFalado } from "../texto";
import { BARRA_JANELA, cor, rotuloCaixaAlta } from "../tema";
import { Icone } from "./Icones";
import { Janela } from "./Janela";

export const BlocoComparacao: React.FC<{ m: Comparacao; plano: Plano; palavras: Palavra[]; t: number; fim: number }> = ({ m, plano, palavras, t, fim }) => {
  const g = geoComparacao(plano, m);
  const origem = posDock(Math.max(0, ICONES_DOCK.indexOf(iconeDoTipo.comparacao ?? "pasta")));
  const veredito = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? m.lados[m.vencedor].em + 0.8, 0.25) : 0;
  const modo = m.modo ?? "contra";
  const pTitulo = prog(t, m.de + 0.25, 0.35);
  const meio = g.janelas[0].x + g.janelas[0].w + 13;
  return (
    <>
      {m.titulo ? (
        <div
          style={{
            position: "absolute",
            left: g.a.x,
            width: g.a.w,
            top: g.a.y + 4,
            height: 48,
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            opacity: janelaAberta(t, m.de, fim) > 0.01 ? 1 : 0,
          }}
        >
          <div style={{ ...rotuloCaixaAlta, fontSize: corpoQueCabe(m.titulo, g.a.w - 40, 36, 30, { caixaAlta: true, espacamento: 0.14 }), color: cor.tinta, translate: pTitulo >= 0.999 ? undefined : `0 ${(1 - pTitulo) * 110}%`, whiteSpace: "nowrap" }}>{m.titulo}</div>
        </div>
      ) : null}
      {m.lados.map((lado, i) => {
        const j = g.janelas[i];
        const aberta = janelaAberta(t, m.de + i * 0.08, fim);
        const ganha = m.vencedor === i ? veredito : 0;
        const perde = m.vencedor !== undefined && m.vencedor !== i ? veredito : 0;
        const texto = encaixar(lado.texto, { largura: j.w - 84, max: 78, min: 40, linhas: j.h - BARRA_JANELA > 300 ? 4 : 3 });
        const tempos = temposDoTexto(lado.texto, palavras, lado.em - 0.3, m.ate, lado.em);
        const pEntra = prog(t, lado.em - 0.08, 0.3);
        const riscar = modo === "errado-certo" && perde > 0 ? { de: 0, ate: texto.palavras.length - 1, em: (m.vencedorEm ?? 0) + 0.05, cor: cor.tintaSuave } : null;
        return (
          <Janela
            key={i}
            x={j.x}
            y={j.y}
            w={j.w}
            h={j.h}
            titulo={lado.rotulo}
            aberta={aberta}
            origem={origem}
            fundo={ganha > 0.5 ? cor.violetaFundo : cor.janela}
            contorno={ganha}
            semBotoes
            extra={
              m.vencedor !== undefined ? (
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    background: ganha > 0.5 ? cor.violeta : "transparent",
                    border: ganha > 0.5 ? "none" : `3px dashed ${cor.esbocoClaro}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    scale: String(mistura(0.8, 1, ganha)),
                  }}
                >
                  {ganha > 0.5 ? <Icone nome="check" tamanho={34} cor="#FFFFFF" peso={5} /> : null}
                </div>
              ) : undefined
            }
          >
            <div style={{ position: "absolute", inset: 0, opacity: mistura(1, 0.5, perde) }}>
              {/* esboço até o lado ser dito */}
              <div style={{ position: "absolute", left: 32, top: 40, display: "flex", flexDirection: "column", gap: 22, opacity: 1 - pEntra }}>
                {[0.86, 0.7, 0.5].map((f, k) => (
                  <div key={k} style={{ width: (j.w - 64) * f, height: 28, borderRadius: 14, background: cor.esbocoClaro }} />
                ))}
              </div>
              <div style={{ position: "absolute", left: i === 1 ? 50 : 34, right: i === 0 ? 50 : 34, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                <TextoFalado enc={texto} tempos={tempos} t={t} cor={cor.tinta} alturaLinha={1.1} risco={riscar} />
              </div>
            </div>
          </Janela>
        );
      })}
      {/* entre as duas: × (contra) ou → (antes e depois, errado e certo) */}
      {janelaAberta(t, m.de, fim) > 0.3 ? (
        <div
          style={{
            position: "absolute",
            left: meio - 40,
            top: g.janelas[0].y + BARRA_JANELA + (g.janelas[0].h - BARRA_JANELA) / 2 - 40,
            width: 80,
            height: 80,
            borderRadius: 40,
            background: cor.tecla,
            boxShadow: "0 10px 24px rgba(28,20,64,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: prog(t, m.lados[1].em - 0.2, 0.25) * (1 - prog(t, fim + 0.05, 0.15)),
            scale: String(mistura(0.7, 1, prog(t, m.lados[1].em - 0.2, 0.25))),
          }}
        >
          <Icone nome={modo === "contra" ? "fechar" : "avancar"} tamanho={46} cor="#FFFFFF" peso={5} />
        </div>
      ) : null}
    </>
  );
};
