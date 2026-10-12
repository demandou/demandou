import { Bloco, Linha, marcaNoGrupo, Palavras, prog, temposDoTexto, Traco, useTempo } from "../anim";
import { encaixarNaCaixa, ITALICO, larguraTexto, SANS, SERIF } from "../medida";
import type { Destaque as TDestaque, Palavra } from "../plano";
import { cor, minimo, sans, sombra } from "../tema";

// Destaque: uma palavra ou frase curta em serifada bem grande, que se monta na fala.
// "chave": itálico latão com um traço de latão que se desenha por baixo.
// "alerta": marfim, com o sinal de alerta desenhado e o traço em lacre (a única cor de alerta).
// No quadro deitado, a faixa do peito é larga e baixa: o sinal de alerta fica AO LADO do texto (uma
// fileira), não em cima dele.
export const Destaque: React.FC<{ m: TDestaque; palavras: Palavra[]; largura: number; altura: number }> = ({
  m,
  palavras,
  largura,
  altura,
}) => {
  const t = useTempo();
  const alerta = m.nivel === "alerta";
  const estilo = () => (alerta ? SERIF : ITALICO);
  const fileira = largura > 2.4 * altura;
  const alturaIcone = alerta && !fileira ? 112 : 0;
  const larguraIcone = alerta && fileira ? 100 + 28 : 0;
  const qDetalhe = m.detalhe
    ? encaixarNaCaixa(m.detalhe, { largura, altura: 110, max: 46, min: minimo.detalhe, linhas: 2, alturaLinha: 1.2, estilo: () => SANS })
    : null;
  const alturaDetalhe = qDetalhe ? qDetalhe.linhas.length * qDetalhe.tamanho * 1.2 + 30 : 0;
  const q = encaixarNaCaixa(m.texto, {
    largura: largura - larguraIcone,
    altura: altura - alturaIcone - alturaDetalhe - 24,
    max: 150,
    min: minimo.titulo + 8,
    linhas: 3,
    alturaLinha: 1.0,
    estilo,
  });
  const tempos = temposDoTexto(m.texto, palavras, m.em, m.ate);
  const ws = m.texto.split(/\s+/).filter(Boolean);
  const larguras = ws.map((w, i) => larguraTexto(w, q.tamanho, estilo()));
  const fimTexto = tempos[tempos.length - 1] ?? m.em;
  // o traço corre por baixo da última linha, quando o texto termina de ser dito
  const ultima = q.linhas[q.linhas.length - 1].map((p) => p.i);
  const traco = marcaNoGrupo(ultima, larguras, prog(t, fimTexto + 0.12, 0.6));
  const detalheEm = m.detalheEm ?? fimTexto + 0.5;

  return (
    <Bloco t={t} ate={m.ate} style={{ width: "100%", textShadow: sombra }}>
      <div style={{ display: "flex", flexDirection: fileira ? "row" : "column", alignItems: "center", gap: fileira ? 28 : 0 }}>
      {alerta ? (
        <svg width={100} height={100} viewBox="0 0 48 48" style={{ marginBottom: fileira ? 0 : 12, flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(8,12,20,0.5))" }}>
          <Traco d="M24 6 43 40H5Z" p={prog(t, m.em - 0.15, 0.6)} cor={cor.lacre} largura={2.8} />
          <Traco d="M24 18v11" p={prog(t, m.em + 0.3, 0.25)} cor={cor.lacre} largura={3.2} />
          <Traco d="M24 34.5v.5" p={prog(t, m.em + 0.5, 0.1)} cor={cor.lacre} largura={3.8} />
        </svg>
      ) : null}
      <Palavras
        linhas={q.linhas}
        tempos={tempos}
        t={t}
        tamanho={q.tamanho}
        alturaLinha={1.0}
        estilo={estilo}
        cor={() => (alerta ? cor.papel : cor.lataoClaro)}
        marca={(i) =>
          ultima.includes(i) ? { tipo: "sublinhado", cor: alerta ? cor.lacre : cor.latao, p: traco.get(i) ?? 0, liga: ultima.includes(i + 1) } : null
        }
      />
      </div>
      {qDetalhe ? (
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {qDetalhe.linhas.map((l, j) => (
            <Linha
              key={j}
              p={prog(t, detalheEm + j * 0.08, 0.5)}
              style={{ fontFamily: sans, fontWeight: 500, fontSize: qDetalhe.tamanho, lineHeight: 1.2, color: cor.papel, whiteSpace: "nowrap" }}
            >
              {l.map((p) => p.w).join(" ")}
            </Linha>
          ))}
        </div>
      ) : null}
    </Bloco>
  );
};
