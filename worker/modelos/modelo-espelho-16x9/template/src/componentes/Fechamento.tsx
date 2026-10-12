// Fechamento: a assinatura (nome e área), um filete dourado, a chamada em itálico e o botão
// desenhado a traço, centrados na faixa de cima; a pessoa embaixo.
import { marcarTrecho, PalavraRevelada, prog, saindo, temposDoTexto, TextoEmLinhas, Traco } from "../anim";
import { geometriaDoFechamento } from "../geometria";
import type { Cta, Palavra, Plano } from "../plano";
import { cor, rotulo, sans, serif } from "../tema";

// ícones desenhados a traço dentro do botão (caixa do ícone: x 64–100, y 26–62)
const Icone: React.FC<{ icone: NonNullable<Cta["icone"]>; t: number; em: number }> = ({ icone, t, em }) => {
  if (icone === "seguir")
    return (
      <>
        <Traco d="M 68 44 L 96 44" p={prog(t, em + 0.35, 0.3)} cor={cor.cafe} largura={3} />
        <Traco d="M 82 30 L 82 58" p={prog(t, em + 0.45, 0.3)} cor={cor.cafe} largura={3} />
      </>
    );
  if (icone === "salvar") return <Traco d="M 70 26 L 94 26 L 94 62 L 82 52 L 70 62 Z" p={prog(t, em + 0.35, 0.4)} cor={cor.cafe} largura={2.6} />;
  if (icone === "comentar") return <Traco d="M 66 30 L 98 30 L 98 54 L 80 54 L 70 62 L 70 54 L 66 54 Z" p={prog(t, em + 0.35, 0.4)} cor={cor.cafe} largura={2.6} />;
  // link: uma seta que sai de um canto (abrir)
  return (
    <>
      <Traco d="M 86 30 L 70 30 L 70 60 L 98 60 L 98 46" p={prog(t, em + 0.3, 0.4)} cor={cor.cafe} largura={2.6} />
      <Traco d="M 80 50 L 100 28" p={prog(t, em + 0.5, 0.3)} cor={cor.cafe} largura={2.8} />
      <Traco d="M 89 27 L 100 27 L 100 38" p={prog(t, em + 0.6, 0.3)} cor={cor.cafe} largura={2.8} />
    </>
  );
};

// o botão aparece quando o trecho em destaque é dito (no link: "Saiba Mais"), ou logo depois da
// última palavra da chamada; sempre a tempo de terminar antes do fim do momento
export const emDoBotao = (m: Cta, tempos: number[], linhas: string[]) => {
  const palavras = linhas.join(" ").split(/\s+/).filter(Boolean);
  const marcadas = [...marcarTrecho(palavras, m.destaque)];
  const base = marcadas.length ? tempos[marcadas[marcadas.length - 1]] + 0.35 : Math.max(...tempos) + 0.45;
  return Math.max(m.de + 0.3, Math.min(base, m.ate - 1.2));
};

export const Fechamento: React.FC<{
  m: Cta;
  t: number;
  fim: number;
  plano: Plano;
  palavras: Palavra[];
}> = ({ m, t, fim, plano, palavras }) => {
  const g = geometriaDoFechamento(m, plano);
  const sai = saindo(t, fim, 0.3);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(g.linhasCta.join(" "), palavras, inicio, m.ate + 1, inicio + 0.3);
  const iconeEm = m.iconeEm ?? emDoBotao(m, tempos, g.linhasCta);
  const pIcone = prog(t, iconeEm, 0.6);
  const icone = m.icone ?? "seguir";
  // a assinatura entra enquanto a linha desliza
  const nomeEm = m.de + 0.2;
  const w = g.larguraBotao;
  const raio = 42;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {g.temNome ? (
        <div style={{ position: "absolute", left: 120, right: 120, top: g.topoNome, display: "flex", justifyContent: "center" }}>
          <PalavraRevelada
            w={g.linhasNome.join("\n")}
            p={prog(t, nomeEm, 0.7)}
            style={{ fontFamily: serif, fontWeight: 500, fontSize: g.tamanhoNome, lineHeight: 1.04, color: cor.cafe, textAlign: "center", whiteSpace: "pre" }}
          />
        </div>
      ) : null}
      {g.temArea ? (
        <div style={{ position: "absolute", left: 120, right: 120, top: g.topoArea, display: "flex", justifyContent: "center" }}>
          <PalavraRevelada w={plano.marca.area} p={prog(t, nomeEm + 0.25, 0.6)} style={{ ...rotulo, fontSize: g.tamanhoArea, whiteSpace: "nowrap" }} semFio />
        </div>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <Traco d={`M ${540 - 90} ${g.yFilete} L ${540 + 90} ${g.yFilete}`} p={prog(t, nomeEm + 0.35, 0.6)} cor={cor.ouro} largura={2} />
      </svg>
      <div style={{ position: "absolute", left: 120, right: 120, top: g.topoCta }}>
        <TextoEmLinhas
          linhas={g.linhasCta}
          tempos={tempos}
          t={t}
          tamanho={g.tamanhoCta}
          entre={1.1}
          alinhar="center"
          style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: cor.cafe }}
          marcas={[{ trecho: m.destaque, style: { color: cor.ouroTexto, fontWeight: 500 } }]}
        />
      </div>
      {/* botão desenhado */}
      <div style={{ position: "absolute", left: 540 - w / 2, width: w, top: g.topoBotao, height: 88 }}>
        <svg width={w} height={88} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Traco d={`M ${raio + 2} 2 L ${w - raio - 2} 2 A ${raio} ${raio} 0 0 1 ${w - raio - 2} 86 L ${raio + 2} 86 A ${raio} ${raio} 0 0 1 ${raio + 2} 2 Z`} p={pIcone} cor={cor.ouro} largura={2.4} />
          <Icone icone={icone} t={t} em={iconeEm} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 118,
            top: 0,
            height: 88,
            display: "flex",
            alignItems: "center",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: g.tamanhoBotao,
            letterSpacing: "0.22em",
            color: cor.cafe,
            whiteSpace: "nowrap",
          }}
        >
          <PalavraRevelada w={g.rotuloBotao} p={prog(t, iconeEm + 0.3, 0.5)} semFio />
        </div>
      </div>
    </div>
  );
};
