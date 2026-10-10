// Mapa (a assinatura do Espelho): a faixa de cima do espelho. A figura desenhada fica de um lado,
// grande, de pé na linha do espelho (um fio tracejado desce do pé do desenho até o losango da
// linha), com as linhas de mapeamento atrás; do outro lado, uma coluna com o rótulo e o título no
// alto e, junto da linha, a nota em itálico e a legenda do mapa (cada ponto aceso ganha um número
// e um nome). Dois mapas seguidos trocam o desenho de lado, como um reflexo.
// A figura é o rosto (com as áreas e os efeitos do rosto) ou qualquer figura da biblioteca
// (figuras.ts) com pontos numerados.
import { PalavraRevelada, prog, saindo, temposDoTexto, TextoEmLinhas, Traco } from "../anim";
import { FIGURAS } from "../figuras";
import { figuraDoMapa, geometriaDoMapa, itensDoMapa } from "../geometria";
import type { Mapa as TMapa, Palavra } from "../plano";
import { cor, rotulo, serif } from "../tema";
import { DesenhoFigura } from "./Figura";
import { Rosto, ROSTO_OLHOS, TERCOS } from "./Rosto";

export const Mapa: React.FC<{
  m: TMapa;
  t: number;
  fim: number;
  // altura da linha do espelho neste momento (px)
  linha: number;
  palavras: Palavra[];
}> = ({ m, t, fim, linha, palavras }) => {
  const g = geometriaDoMapa(m, linha);
  const sai = saindo(t, fim, 0.3);
  const desenhoEm = m.de + 0.12;
  const figura = figuraDoMapa(m);
  const def = figura === "rosto" ? null : FIGURAS[figura];

  const temposTitulo = temposDoTexto(g.quebraTitulo.join(" "), palavras, m.de, m.ate, m.de + 0.2);
  const temposRotulo = temposDoTexto(m.rotulo ?? "", palavras, m.de, m.ate, m.de + 0.15);
  const temposNota = temposDoTexto(g.quebraNota.join(" "), palavras, m.de, m.ate, m.de + 0.8);
  const itens = itensDoMapa(m).map((a, i) => ({ ...a, numero: i + 1 }));

  // linhas de mapeamento: um pouco além do desenho
  const guias = def ? def.guias : TERCOS;
  const guiaOuro = def ? def.guiaOuro : ROSTO_OLHOS;
  const pe = def ? def.pe : TERCOS[3];
  const xa = Math.max(30, g.rostoX - 22);
  const xb = Math.min(g.x1, g.rostoX + g.rostoW + 22);
  const [de, ate] = g.esquerda ? [xa, xb] : [xb, xa];
  const yPe = g.rostoY + pe * g.escala;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {guias.map((y, i) => {
          const yy = g.rostoY + y * g.escala;
          return <Traco key={i} d={`M ${de} ${yy} L ${ate} ${yy}`} p={prog(t, desenhoEm + 0.6 + i * 0.07, 0.8)} cor={cor.cafeLinha} largura={1.6} />;
        })}
        {/* a linha dourada, tracejada (no rosto, a linha dos olhos) */}
        <Traco
          d={`M ${de} ${g.rostoY + guiaOuro * g.escala} L ${ate} ${g.rostoY + guiaOuro * g.escala}`}
          p={prog(t, desenhoEm + 0.7, 0.9)}
          cor={cor.ouro}
          largura={2.2}
          tracejado="7 7"
        />
        {/* eixo do desenho: do pé até a linha do espelho (o losango fica na linha) */}
        {yPe < linha - 30 ? <Traco d={`M ${g.eixoX} ${yPe + 10} L ${g.eixoX} ${linha - 14}`} p={prog(t, desenhoEm + 0.9, 0.6)} cor={cor.ouro} largura={2} tracejado="5 6" /> : null}
        {/* filete curto acima da nota */}
        {g.quebraNota.length ? (
          <Traco
            d={`M ${g.colunaX} ${g.colunaTopo - 16} L ${g.colunaX + 64} ${g.colunaTopo - 16}`}
            p={prog(t, temposNota[0] - 0.15, 0.4)}
            cor={cor.ouro}
            largura={2.4}
          />
        ) : null}
      </svg>

      {/* rótulo e título, no alto da coluna de texto */}
      <div style={{ position: "absolute", left: g.colunaX, width: g.colunaW, top: 168 }}>
        {m.rotulo ? (
          <div style={{ ...rotulo, fontSize: g.tamanhoRotulo, letterSpacing: "0.2em", lineHeight: 1.18, display: "flex", flexWrap: "wrap", rowGap: 0 }}>
            {m.rotulo.split(/\s+/).map((w, i, lista) => (
              <PalavraRevelada key={`${w}-${i}`} w={w} p={prog(t, temposRotulo[i], 0.4)} margem={i < lista.length - 1 ? "0.5em" : 0} semFio />
            ))}
          </div>
        ) : null}
        {g.quebraTitulo.length ? (
          <div style={{ marginTop: m.rotulo ? 12 : 0 }}>
            <TextoEmLinhas
              linhas={g.quebraTitulo}
              tempos={temposTitulo}
              t={t}
              tamanho={g.tamanhoTitulo}
              entre={1.02}
              style={{ fontFamily: serif, fontWeight: 500, color: cor.cafe, letterSpacing: "-0.012em" }}
            />
          </div>
        ) : null}
      </div>

      {/* a figura */}
      <div style={{ position: "absolute", left: g.desenhoX, top: g.rostoY }}>
        {def ? (
          <DesenhoFigura
            def={def}
            nome={figura}
            t={t}
            desenhoEm={desenhoEm}
            pontos={itens.map((a) => ({ vaga: a.vaga, em: a.em, numero: a.numero }))}
            mapeamentoEm={desenhoEm + 1.05}
            escala={g.escala}
            peso={1.05}
          />
        ) : (
          <Rosto
            t={t}
            desenhoEm={desenhoEm}
            areas={itens.filter((a) => a.area).map((a) => ({ area: a.area!, em: a.em, numero: a.numero }))}
            efeito={m.efeito}
            mapeamentoEm={desenhoEm + 1.05}
            escala={g.escala}
            peso={1.05}
          />
        )}
      </div>

      {/* nota em itálico */}
      {g.quebraNota.length ? (
        <div style={{ position: "absolute", left: g.colunaX, width: g.colunaW, top: g.colunaTopo }}>
          <TextoEmLinhas
            linhas={g.quebraNota}
            tempos={temposNota}
            t={t}
            tamanho={g.tamanhoNota}
            entre={1.1}
            style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 500, color: cor.cafe }}
          />
        </div>
      ) : null}

      {/* legenda do mapa: número + nome, cada um quando o ponto acende (nome longo quebra em 2 linhas) */}
      {itens.map((a, i) => {
        const p = prog(t, a.em, 0.5);
        const ultima = itens.filter((x) => t >= x.em).slice(-1)[0];
        const topo = g.colunaTopo + g.alturaNota + g.vaoNota + g.alturasLegenda.slice(0, i).reduce((s, h) => s + h, 0);
        const quebra = g.quebrasLegenda[i];
        return (
          <div
            key={`${a.texto}-${i}`}
            style={{
              position: "absolute",
              left: g.colunaX,
              top: topo,
              height: g.alturasLegenda[i],
              display: "flex",
              alignItems: "center",
              gap: 22,
              opacity: p <= 0 ? 0 : ultima === a ? 1 : 0.55,
            }}
          >
            <svg width={g.circulo} height={g.circulo} style={{ flex: "none", opacity: prog(t, a.em + 0.12, 0.3) }}>
              <circle cx={g.circulo / 2} cy={g.circulo / 2} r={g.circulo / 2 - 1} fill={cor.ouro} />
              <text
                x={g.circulo / 2}
                y={g.circulo / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontFamily: rotulo.fontFamily, fontWeight: 500, fontSize: Math.round(g.circulo * 0.56), fill: cor.champanhe }}
              >
                {a.numero}
              </text>
            </svg>
            <div style={{ width: g.larguraNome }}>
              <PalavraRevelada
                w={quebra.join("\n")}
                p={p}
                style={{ fontFamily: serif, fontWeight: 500, fontSize: g.tamanhoLegenda, lineHeight: 1.04, color: cor.cafe, whiteSpace: "pre" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
