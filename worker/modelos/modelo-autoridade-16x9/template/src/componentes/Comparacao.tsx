import { Bloco, Linha, prog, Traco, useTempo } from "../anim";
import { corpoDoRotulo, encaixarNaCaixa, encaixarTodos, SERIF } from "../medida";
import type { Comparacao as TComparacao } from "../plano";
import { cor, minimo, rotulo, serif, sombra } from "../tema";
import { Ajuste, type Folga } from "./Pecas";

// Comparação: dois cartões de contorno fino lado a lado (como as opções do exemplo). Cada lado
// se enche de papel quando é dito; o vencedor ganha o filete de latão e um visto que se desenha,
// o outro devolve o papel e apaga. No modo errado-certo, o lado errado leva um × de lacre.
export const Comparacao: React.FC<{ m: TComparacao; largura: number; altura: number; folga?: Folga }> = ({ m, largura, altura, folga }) => {
  const t = useTempo();
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" || modo === "antes-depois" ? 1 : undefined);
  const ultimoLado = Math.max(m.lados[0].em, m.lados[1].em);
  const vencedorEm = m.vencedorEm ?? ultimoLado + 0.7;
  const pVence = vencedor === undefined ? 0 : prog(t, vencedorEm, 0.55);

  const qTitulo = m.titulo
    ? encaixarNaCaixa(m.titulo, { largura, altura: 170, max: 96, min: minimo.titulo, linhas: 2, alturaLinha: 1.02 })
    : null;
  const alturaTitulo = qTitulo ? qTitulo.linhas.length * qTitulo.tamanho * 1.02 + 34 : 0;

  const conector = 52;
  const gap = 12;
  const larguraCartao = (largura - conector - 2 * gap) / 2;
  const pad = 24;
  const interno = larguraCartao - 2 * pad;
  const { tamanho, quebras } = encaixarTodos(
    m.lados.map((l) => l.texto),
    { largura: interno, max: 80, min: minimo.corpo, linhas: 3, estilo: () => SERIF },
  );
  const tamRotulo = Math.min(...m.lados.map((l) => corpoDoRotulo(l.rotulo, interno - (vencedor !== undefined ? 50 : 0))));
  const linhasMax = Math.max(...quebras.map((q) => q.linhas.length));
  const alturaCartao = Math.max(pad * 2 + tamRotulo * 1.3 + 14 + linhasMax * tamanho * 1.06, 150);
  const limite = folga && alturaTitulo + alturaCartao > folga.zona ? altura : (folga?.zona ?? altura);
  const escala = Math.min(1, (limite - alturaTitulo) / alturaCartao);
  const H = alturaTitulo + alturaCartao * escala;

  const marcaConector = () => {
    const p = prog(t, m.lados[1].em - 0.2, 0.45);
    if (modo === "contra")
      return (
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 64, color: cor.lataoClaro, opacity: prog(t, m.de + 0.3, 0.4), lineHeight: 1 }}>
          ×
        </div>
      );
    return (
      <svg width={conector} height={40} viewBox="0 0 64 40">
        <Traco d="M6 20h48" p={p} cor={cor.lataoClaro} largura={3} />
        <Traco d="M42 9l13 11-13 11" p={prog(t, m.lados[1].em + 0.1, 0.3)} cor={cor.lataoClaro} largura={3} />
      </svg>
    );
  };

  return (
    <Ajuste h={H} folga={folga}>
    <Bloco t={t} ate={m.ate} style={{ width: "100%" }}>
      {qTitulo ? (
        <div style={{ marginBottom: 34, display: "flex", flexDirection: "column", alignItems: "center", textShadow: sombra }}>
          {qTitulo.linhas.map((l, j) => (
            <Linha
              key={j}
              p={prog(t, m.de + j * 0.08, 0.55)}
              style={{ fontFamily: serif, fontSize: qTitulo.tamanho, lineHeight: 1.02, color: cor.papel, whiteSpace: "nowrap" }}
            >
              {l.map((p) => p.w).join(" ")}
            </Linha>
          ))}
        </div>
      ) : null}
      <div style={{ height: alturaCartao * escala, width: largura }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap,
          width: largura,
          scale: String(escala),
          transformOrigin: "center top",
        }}
      >
        {m.lados.map((lado, i) => {
          const aceso = prog(t, lado.em, 0.45);
          const venceu = vencedor === i;
          const perdeu = vencedor !== undefined && vencedor !== i;
          // o perdedor devolve o papel quando o vencedor é marcado
          const papel = perdeu ? aceso * (1 - pVence) : aceso;
          const claro = papel > 0.5;
          const card = (
            <div
              key={`l${i}`}
              style={{
                width: larguraCartao,
                height: alturaCartao,
                position: "relative",
                border: `1.5px solid rgba(242,236,223,${perdeu ? 0.5 - 0.25 * pVence : 0.5})`,
                opacity: prog(t, m.de + 0.3 + i * 0.1, 0.4),
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* o papel sobe e cobre o cartão */}
              <div style={{ position: "absolute", inset: 0, background: cor.papel, translate: `0 ${(1 - papel) * 101}%` }} />
              {/* filete de latão do vencedor */}
              {venceu ? (
                <div style={{ position: "absolute", left: 0, top: 0, height: 6, width: `${pVence * 100}%`, background: cor.latao }} />
              ) : null}
              <div style={{ position: "relative", padding: pad, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      ...rotulo,
                      fontSize: tamRotulo,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      color: claro ? cor.tintaSuave : perdeu && pVence > 0.5 ? "rgba(242,236,223,0.45)" : cor.lataoClaro,
                      textShadow: claro ? "none" : sombra,
                    }}
                  >
                    {lado.rotulo}
                  </div>
                  {venceu && pVence > 0 ? (
                    <svg width={44} height={44} viewBox="0 0 48 48">
                      <Traco d="M10 25l9 9 19-20" p={pVence} cor={cor.latao} largura={4} />
                    </svg>
                  ) : null}
                  {perdeu && modo === "errado-certo" ? (
                    <svg width={40} height={40} viewBox="0 0 48 48">
                      <Traco d="M12 12l24 24" p={prog(t, lado.em + 0.35, 0.3)} cor={cor.lacre} largura={4} />
                      <Traco d="M36 12 12 36" p={prog(t, lado.em + 0.55, 0.3)} cor={cor.lacre} largura={4} />
                    </svg>
                  ) : null}
                </div>
                <div>
                  {quebras[i].linhas.map((l, j) => (
                    <Linha
                      key={j}
                      p={prog(t, lado.em + 0.06 + j * 0.07, 0.5)}
                      style={{
                        fontFamily: serif,
                        fontSize: tamanho,
                        lineHeight: 1.06,
                        whiteSpace: "nowrap",
                        color: claro ? cor.tinta : perdeu && pVence > 0.5 ? "rgba(242,236,223,0.55)" : cor.papel,
                        textShadow: claro ? "none" : sombra,
                      }}
                    >
                      {l.map((p) => p.w).join(" ")}
                    </Linha>
                  ))}
                </div>
              </div>
            </div>
          );
          return i === 0 ? (
            card
          ) : (
            <div key="par" style={{ display: "contents" }}>
              <div style={{ width: conector, display: "flex", justifyContent: "center", flexShrink: 0 }}>{marcaConector()}</div>
              {card}
            </div>
          );
        })}
      </div>
      </div>
    </Bloco>
    </Ajuste>
  );
};
