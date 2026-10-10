// Comparação (forma universal): os dois lados como um reflexo. O primeiro fica em cima, alinhado à
// esquerda; o segundo embaixo, alinhado à direita; entre eles, um fio dourado com um losango, a
// linha de um pequeno espelho. No centro do fio, o sinal do modo: × (contra) ou ↓ (antes e depois,
// errado e certo). O lado que está sendo falado fica inteiro e o outro apaga; o vencedor ganha o
// selo (círculo e visto) e, em "errado-certo", o lado errado é riscado em bordô.
import { mistura, prog, saindo, Simbolo, temposDoTexto, TextoEmLinhas, Traco } from "../anim";
import { geometriaDaComparacaoUniversal } from "../blocos";
import { larguraTexto } from "../medida";
import type { Comparacao, Palavra } from "../plano";
import { cor, FONTE_TITULO, LIMITE_DIREITO, MARGEM_ESQUERDA, rotulo, serif } from "../tema";

const titulo: React.CSSProperties = { fontFamily: serif, fontWeight: 500, color: cor.cafe, letterSpacing: "-0.012em" };

const Selo: React.FC<{ p: number; tamanho: number }> = ({ p, tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 60 60" style={{ overflow: "visible" }}>
    <Traco d="M 30 3 A 27 27 0 1 1 29.9 3" p={prog(p, 0, 0.7, (x) => x)} cor={cor.ouro} largura={3} />
    <Traco d="M 18 31 L 26 39 L 43 22" p={prog(p, 0.5, 0.5, (x) => x)} cor={cor.ouro} largura={3.6} />
  </svg>
);

export const ComparacaoLados: React.FC<{ m: Comparacao; t: number; fim: number; linhaMaxima: number; palavras: Palavra[] }> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDaComparacaoUniversal(m, linhaMaxima);
  const sai = saindo(t, fim, 0.3);
  const lados = g.lados;
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = m.vencedorEm ?? Math.max(lados[0].em, lados[1].em) + 0.9;
  const pVencedor = vencedor !== undefined ? prog(t, vencedorEm, 0.8) : 0;
  // o lado em foco é o último que começou a ser dito
  const foco = t >= lados[1].em - 0.05 ? 1 : t >= lados[0].em - 0.05 ? 0 : -1;
  const temposTitulo = g.titulo ? temposDoTexto(g.titulo.linhas.join(" "), palavras, m.de, m.ate, m.de + 0.1) : [];
  const pFio = prog(t, m.de + 0.2, 0.7);
  const pSinal = prog(t, lados[1].em - 0.3, 0.6);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {g.titulo ? (
        <div style={{ position: "absolute", left: MARGEM_ESQUERDA, width: LIMITE_DIREITO - MARGEM_ESQUERDA, top: g.topo }}>
          <TextoEmLinhas linhas={g.titulo.linhas} tempos={temposTitulo} t={t} tamanho={g.titulo.tamanho} entre={1.2} alinhar="center" style={rotulo} vao="0.5em" />
        </div>
      ) : null}

      {/* o fio do meio, do centro para fora, e o sinal do modo num círculo */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={540 - 450 * pFio} x2={540 - 46} y1={g.yMeio} y2={g.yMeio} stroke={cor.ouro} strokeWidth={2.2} opacity={pFio > 0.06 ? 1 : 0} />
        <line x1={540 + 46} x2={540 + 450 * pFio} y1={g.yMeio} y2={g.yMeio} stroke={cor.ouro} strokeWidth={2.2} opacity={pFio > 0.06 ? 1 : 0} />
        <circle cx={540} cy={g.yMeio} r={34} fill={cor.champanhe} stroke={cor.ouro} strokeWidth={2.2} opacity={pFio} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 540 - 30,
          top: g.yMeio - 30,
          width: 60,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 52,
          rotate: modo === "contra" ? "0deg" : "90deg",
        }}
      >
        <Simbolo s={modo === "contra" ? "×" : "→"} p={pSinal} />
      </div>

      {lados.map((lado, i) => {
        const direita = i === 1;
        const topo = i === 0 ? g.topoLado0 : g.topoLado1;
        const texto = g.textos[i];
        const tempos = temposDoTexto(texto.linhas.join(" "), palavras, lado.em, i === 0 ? lados[1].em : m.ate, lado.em);
        const temposRotulo = g.rotulos[i] ? temposDoTexto(lado.rotulo, palavras, lado.em - 0.4, m.ate, lado.em - 0.05) : [];
        const emFoco = foco === i;
        const perdeu = vencedor !== undefined && vencedor !== i;
        const base = foco === -1 || emFoco ? 1 : 0.45;
        const opacidade = vencedor === i ? mistura(base, 1, pVencedor) : perdeu ? mistura(base, 0.4, pVencedor) : base;
        const vence = vencedor === i;
        const alinhar = direita ? "right" : "left";
        const ultima = texto.linhas[texto.linhas.length - 1] ?? "";
        const larguraUltima = larguraTexto(ultima, texto.tamanho, FONTE_TITULO);
        const selo = texto.tamanho * 0.62;
        const ySelo = topo + (g.rotulos[i] ? 50 : 0) + (texto.linhas.length - 1) * texto.tamanho * 1.04 + (texto.tamanho * 1.04 - selo) / 2;
        const xSelo = direita ? LIMITE_DIREITO - larguraUltima - 22 - selo : MARGEM_ESQUERDA + larguraUltima + 22;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: MARGEM_ESQUERDA,
                width: LIMITE_DIREITO - MARGEM_ESQUERDA,
                top: topo,
                opacity: opacidade,
              }}
            >
              {g.rotulos[i] ? (
                <div style={{ height: 34, marginBottom: 16 }}>
                  <TextoEmLinhas linhas={[lado.rotulo]} tempos={temposRotulo} t={t} tamanho={g.rotulos[i]!.tamanho} entre={1} alinhar={alinhar} style={rotulo} vao="0.5em" />
                </div>
              ) : null}
              <TextoEmLinhas
                linhas={texto.linhas}
                tempos={tempos}
                t={t}
                tamanho={texto.tamanho}
                entre={1.04}
                alinhar={alinhar}
                style={titulo}
                risco={modo === "errado-certo" && perdeu ? { trecho: texto.linhas.join(" "), em: vencedorEm, cor: cor.alerta } : undefined}
              />
            </div>
            {vence && pVencedor > 0 ? (
              <div style={{ position: "absolute", left: xSelo, top: ySelo }}>
                <Selo p={pVencedor} tamanho={selo} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
