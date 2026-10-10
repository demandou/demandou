import { limitar, mistura, prog, remonta } from "../anim";
import { encaixar, encaixarTodos } from "../medida";
import type { Comparacao as TComparacao, NomeCor } from "../plano";
import { display, paleta, RAIO, REJUNTE, rotulo as estiloRotulo } from "../tema";
import { F_ROTULO, F_TITULO, lapis, respiro, TextoFalado, type PropsBloco } from "./comum";
import { Icone } from "./Icones";

const CORES: Record<NonNullable<TComparacao["modo"]>, [NomeCor, NomeCor]> = {
  contra: ["tinta", "creme"],
  "antes-depois": ["creme", "folha"],
  "errado-certo": ["tomate", "folha"],
};

// Comparação: os dois lados viram DOIS ladrilhos do mosaico, lado a lado (ou um sobre o outro, se o texto
// pedir), separados pelo rejunte. Cada ladrilho nasce a lápis e se preenche a partir do rejunte quando o
// seu lado é dito; o chapéu (rótulo) e o texto entram na fala. Uma peça redonda pousa no rejunte entre os
// dois: × (contra), seta (antes → depois). Em errado × certo, cada ladrilho ganha o seu ✗ e ✓. Com
// `vencedor`, o lado que vence ganha o ✓ e o outro apaga um pouco.
export const Comparacao: React.FC<PropsBloco<TComparacao>> = ({ b, t, w, h, util, palavras, janela }) => {
  const alto = Math.min(h, util);
  const modo = b.modo ?? "contra";
  const [c0, c1] = CORES[modo];
  const G = REJUNTE;

  // título opcional: uma faixa creme em cima
  const padT = 34;
  const tit = b.titulo ? encaixar(b.titulo, { largura: w - 2 * padT, max: 72, min: 44, linhas: 2, fonte: F_TITULO, entrelinha: 1.04 }) : null;
  const altTitulo = tit ? tit.altura + 2 * padT - 8 : 0;
  const y0 = tit ? altTitulo + G : 0;

  // lado a lado ou empilhado: o que der o texto maior (lado a lado só em bloco largo)
  const medir = (lado: boolean) => {
    const W = lado ? (w - G) / 2 : w;
    const H = lado ? h - y0 : (h - y0 - G) / 2;
    const util0 = lado ? alto - y0 : (alto - y0 - G) / 2;
    const util1 = lado ? alto - y0 : alto - y0 - H - G;
    const pad = respiro(W, H);
    const chapeu = 62;
    const textos = encaixarTodos(
      b.lados.map((l) => l.texto),
      { largura: W - 2 * pad, altura: Math.min(util0, util1) - 2 * pad - chapeu - 20, max: lado ? 112 : 120, min: 44, linhas: lado ? 4 : 3, fonte: F_TITULO, entrelinha: 1.06 },
    );
    return { lado, W, H, pad, chapeu, textos, nota: Math.min(...textos.map((x) => x.tamanho)) };
  };
  const ladoALado = medir(true);
  const empilhado = medir(false);
  const L = w >= 700 && ladoALado.nota >= empilhado.nota * 0.85 ? ladoALado : empilhado;
  const rotulos = encaixarTodos(
    b.lados.map((l) => l.rotulo),
    { largura: L.W - 2 * L.pad - 90, max: 34, min: 30, linhas: 1, fonte: F_ROTULO },
  );

  const vencedorEm = b.vencedor !== undefined ? b.vencedorEm ?? Math.max(...b.lados.map((l) => l.em)) + 0.6 : 9999;
  const pVence = prog(t, vencedorEm, 0.5);

  const ladrilho = (i: 0 | 1) => {
    const lado = b.lados[i];
    const nome = i === 0 ? c0 : c1;
    const pal = paleta[nome];
    const x = L.lado ? i * (L.W + G) : 0;
    const y = L.lado ? y0 : y0 + i * (L.H + G);
    const p = prog(t, lado.em - 0.1, 0.55, remonta);
    const perdeu = b.vencedor !== undefined && b.vencedor !== i ? pVence : 0;
    const venceu = b.vencedor === i ? pVence : 0;
    // o preenchimento sai do rejunte (o lado de dentro) para fora
    const resto = `${((1 - p) * 100).toFixed(2)}%`;
    const recorte = L.lado ? (i === 0 ? `inset(0 0 0 ${resto})` : `inset(0 ${resto} 0 0)`) : i === 0 ? `inset(${resto} 0 0 0)` : `inset(0 0 ${resto} 0)`;
    const tx = L.textos[i];
    // a parte útil do ladrilho (acima da interface do app): o texto fica centrado nela, o chapéu em cima
    const utilLadrilho = Math.min(L.H, alto - y);
    const topoTexto = Math.max(L.pad + L.chapeu, (utilLadrilho - tx.altura) / 2 + L.chapeu * 0.35);
    const icone = modo === "errado-certo" ? (i === 0 ? "x" : "check") : venceu > 0 ? "check" : null;
    const pIcone = modo === "errado-certo" ? prog(t, lado.em + 0.25, 0.6) : venceu;
    return (
      <div key={i} style={{ position: "absolute", left: x, top: y, width: L.W, height: L.H, borderRadius: RAIO }}>
        {/* a lápis até o lado ser dito */}
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, outline: `3px dashed ${lapis(paleta.pagina)}`, outlineOffset: -3, opacity: 1 - p }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: pal.fundo, clipPath: p < 0.999 ? recorte : undefined, opacity: p > 0.001 ? 1 : 0 }} />
        <div style={{ position: "absolute", left: L.pad, top: L.pad, width: L.W - 2 * L.pad, opacity: mistura(1, 0.5, perdeu) }}>
          <div style={{ ...estiloRotulo, fontSize: rotulos[i].tamanho, color: pal.acento, whiteSpace: "nowrap", opacity: prog(t, lado.em, 0.4), translate: `${(1 - prog(t, lado.em, 0.4)) * -16}px 0` }}>
            {lado.rotulo}
          </div>
          <div style={{ marginTop: 16, height: 3, width: `${prog(t, lado.em + 0.1, 0.5) * 100}%`, background: pal.suave, opacity: 0.45 }} />
        </div>
        <div style={{ position: "absolute", left: L.pad, top: topoTexto, width: L.W - 2 * L.pad, opacity: mistura(1, 0.5, perdeu) }}>
          <div>
            <TextoFalado
              linhas={tx.linhas}
              t={t}
              palavras={palavras}
              janela={janela}
              inicio={lado.em - 0.05}
              tamanho={tx.tamanho}
              cor={pal.texto}
              entrelinha={1.06}
              estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
            />
          </div>
        </div>
        {icone && pIcone > 0.001 ? (
          <div style={{ position: "absolute", right: L.pad * 0.8, top: L.pad * 0.7 }}>
            <Icone nome={icone} tamanho={Math.min(92, L.W * 0.16)} cor={pal.traco} p={pIcone} peso={7} />
          </div>
        ) : null}
      </div>
    );
  };

  // a peça redonda no rejunte (× ou seta), quando o segundo lado é dito
  const pPeca = modo === "errado-certo" ? 0 : prog(t, b.lados[1].em - 0.05, 0.45);
  const raioPeca = 56;
  const px = L.lado ? L.W + G / 2 : w / 2;
  const py = L.lado ? y0 + Math.min(L.H, alto - y0) / 2 : y0 + L.H + G / 2;
  const seta = L.lado ? "M30 50 L70 50 M56 36 L70 50 L56 64" : "M50 30 L50 70 M36 56 L50 70 L64 56";
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {tit ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: w, height: altTitulo, borderRadius: RAIO, background: paleta.tinta.fundo }}>
          <div style={{ position: "absolute", left: padT, top: padT - 4, width: w - 2 * padT }}>
            <TextoFalado
              linhas={tit.linhas}
              t={t}
              palavras={palavras}
              janela={janela}
              tamanho={tit.tamanho}
              cor={paleta.tinta.texto}
              estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
            />
          </div>
        </div>
      ) : null}
      {ladrilho(0)}
      {ladrilho(1)}
      {pPeca > 0.001 ? (
        <div
          style={{
            position: "absolute",
            left: px - raioPeca,
            top: py - raioPeca,
            width: raioPeca * 2,
            height: raioPeca * 2,
            borderRadius: raioPeca,
            background: paleta.tinta.fundo,
            boxShadow: `0 0 0 ${G * 0.6}px ${paleta.pagina.fundo}`,
            scale: String(mistura(0.4, 1, pPeca)),
            opacity: limitar(pPeca * 2),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={raioPeca * 1.3} height={raioPeca * 1.3} viewBox="0 0 100 100">
            <path
              d={modo === "contra" ? "M34 34 L66 66 M66 34 L34 66" : seta}
              fill="none"
              stroke={paleta.tinta.texto}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={pPeca < 0.999 ? `${pPeca} 1` : undefined}
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
};
