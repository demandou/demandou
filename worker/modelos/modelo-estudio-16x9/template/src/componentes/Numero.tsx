// Número. A pessoa vai para a moldura da direita; no quadro da esquerda, no alto, o número grande
// conta até o valor dito (pt-BR, prefixo e sufixo menores) com o rótulo embaixo. Embaixo dele, o
// medidor de nível de uma mesa de som sobe junto com a contagem: em %, acende até a porcentagem; um inteiro
// pequeno (até 12) vira 12 casas que acendem uma a uma; o resto, uma rampa que se enche inteira.
import { Easing } from "remotion";
import { formatarNumero, limitar, Linhas, prog, saindo, temposDoTexto } from "../anim";
import { ANTES, FIM_DO_RECUO, quadroDe, TROCA } from "../layout";
import { caber, medir } from "../medidas";
import type { Numero as NumeroT, Palavra } from "../plano";
import { comAlfa, cor, mono, rotulo, titulo } from "../tema";
import { Ilustrativo } from "./comum";

// No quadro deitado não cabe a pilha alta do vertical (coluna do número ao lado do quadro, medidor
// embaixo): o quadro da esquerda se divide em duas fileiras, o número em cima e o medidor embaixo.
const AREA = quadroDe("numero");
const ALTURA_NUMERO = Math.round(AREA.h * 0.56);
const VAO_MEDIDOR = 24;

export const colunaDoNumero = () => ({ x: AREA.x, y: AREA.y, w: AREA.w, h: ALTURA_NUMERO });

export const Numero: React.FC<{ m: NumeroT; palavras: Palavra[]; t: number; fim: number }> = ({ m, palavras, t, fim }) => {
  const col = colunaDoNumero();
  // a coluna da esquerda entra quando o quadro já liberou o lado (desliza de lá); sai inteira no fim
  const entraColuna = prog(t, Math.max(m.de - ANTES + TROCA * 0.8, FIM_DO_RECUO), 0.4);
  const s = saindo(t, fim + 0.02, 0.2);
  const entraBaixo = prog(t, m.de + 0.02, 0.45);

  // a contagem
  const dur = 1.2;
  const p = prog(t, m.em, dur, Easing.out(Easing.cubic));
  const casas = m.casas ?? 0;
  const final = formatarNumero(m.valor, casas);
  const texto = p > 0 ? formatarNumero(m.valor * p, casas) : final.replace(/\d/g, "0");
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  const escalaSuf = 0.42;
  // o prefixo (US$, R$, "+") fica numa linha em cima, em mono: o número usa a largura toda
  const total = medir(final, 1, 800) + (suf ? medir(suf, escalaSuf, 800) + 0.06 : 0);
  const aceso = p > 0;

  // o rótulo: embaixo do número, acende na palavra (rotuloEm) ou junto com a contagem
  const rotuloEm = m.rotuloEm ?? m.em;
  const r = caber(m.rotulo, { largura: col.w, maximo: 60, minimo: 44, linhas: 3, peso: 700, entrelinha: 1.1, piso: 36 });
  // o número: o maior que cabe na largura e na altura que sobra na fileira de cima (até 220 px)
  const sobraAltura = col.h - (pre ? 46 : 0) - 24 - r.linhas.length * r.tam * 1.1 - (m.ilustrativo ? 64 : 0);
  const tam = Math.max(96, Math.min(220, (col.w - 6) / Math.max(0.1, total), sobraAltura / 0.98));
  const temposRotulo = temposDoTexto(m.rotulo, palavras, Math.min(rotuloEm, m.de) - 0.1, m.ate, rotuloEm);
  const alturaBloco = (pre ? 46 : 0) + tam * 0.98 + 24 + r.linhas.length * r.tam * 1.1 + (m.ilustrativo ? 64 : 0);
  const yBloco = col.y + Math.max(0, (col.h - alturaBloco) / 2);

  // o medidor de nível: a fileira de baixo do quadro da esquerda
  const topo = col.y + col.h + VAO_MEDIDOR;
  const altura = AREA.y + AREA.h - topo;
  const largura = AREA.w;
  const porcentagem = suf.trim() === "%" && m.valor > 0 && m.valor <= 100;
  const casasDiscretas = !porcentagem && Number.isInteger(m.valor) && m.valor >= 1 && m.valor <= 12;
  const nivel = porcentagem ? m.valor / 100 : 1;
  const n = casasDiscretas ? m.valor : 40;
  const vao = casasDiscretas ? 18 : 10;
  const wBarra = (largura - vao * (n - 1)) / n;
  const hMax = altura - 96;
  const frente = p * nivel * n;

  return (
    <>
      <div style={{ position: "absolute", left: col.x, top: yBloco, width: col.w, opacity: entraColuna * (1 - s), translate: `${-(1 - entraColuna) * 90}px 0` }}>
        {m.ilustrativo ? (
          <div style={{ marginBottom: 20, display: "flex" }}>
            <Ilustrativo />
          </div>
        ) : null}
        {pre ? <div style={{ ...rotulo, fontSize: 40, color: aceso ? cor.acento : cor.apagado, marginBottom: 6 }}>{pre}</div> : null}
        <div style={{ display: "flex", alignItems: "flex-start", whiteSpace: "nowrap" }}>
          <span style={{ ...titulo, fontSize: tam, lineHeight: 0.98, fontVariantNumeric: "tabular-nums", color: aceso ? cor.texto : cor.apagado }}>{texto}</span>
          {suf ? (
            <span style={{ ...titulo, fontSize: tam * escalaSuf, lineHeight: 1, alignSelf: "flex-end", marginBottom: tam * 0.1, marginLeft: tam * 0.06, color: aceso ? cor.acento : cor.apagado }}>
              {suf}
            </span>
          ) : null}
        </div>
        <div style={{ height: 24 }} />
        <Linhas linhas={r.linhas} tempos={temposRotulo} t={t} tam={r.tam} modo="acende" entrelinha={1.1} estilo={{ ...titulo, fontWeight: 700, fontSize: r.tam }} />
      </div>

      {/* o medidor de nível: casas a lápis que acendem em rosa com a contagem */}
      <div style={{ position: "absolute", left: AREA.x, top: topo, width: largura, height: altura, opacity: entraBaixo * (1 - s), translate: `0 ${(1 - entraBaixo) * 40}px` }}>
        <svg width={largura} height={hMax + 20} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {Array.from({ length: n }, (_, i) => {
            const x = i * (wBarra + vao);
            const h = casasDiscretas ? hMax * 0.62 : Math.max(16, hMax * (0.12 + 0.88 * Math.pow((i + 1) / n, 1.2)));
            const y = hMax - h;
            const cheio = limitar(frente - i);
            return (
              <g key={i}>
                <rect x={x} y={y} width={wBarra} height={h} rx={Math.min(8, wBarra / 2)} fill={cor.apagado} />
                {cheio > 0 ? <rect x={x} y={y} width={wBarra} height={h} rx={Math.min(8, wBarra / 2)} fill={comAlfa(cor.acento, cheio)} /> : null}
              </g>
            );
          })}
          {/* a agulha do nível */}
          {p > 0 && p < 1 ? (
            <line x1={Math.min(largura, (frente / n) * largura)} x2={Math.min(largura, (frente / n) * largura)} y1={-10} y2={hMax + 10} stroke={cor.texto} strokeWidth={3} strokeLinecap="round" />
          ) : null}
        </svg>
        <div style={{ position: "absolute", left: 0, top: hMax + 30, width: largura, display: "flex", justifyContent: "space-between" }}>
          <span style={{ ...rotulo, fontSize: 34, color: cor.textoSuave }}>{casasDiscretas ? "1" : "0"}</span>
          {porcentagem ? (
            <span style={{ ...rotulo, fontSize: 34, color: cor.textoSuave }}>100%</span>
          ) : (
            <span style={{ fontFamily: mono, fontWeight: 500, fontSize: 34, color: p >= 1 ? cor.acento : cor.textoSuave }}>
              {pre ? `${pre} ` : ""}
              {final}
              {suf ? ` ${suf}` : ""}
            </span>
          )}
        </div>
      </div>
    </>
  );
};
