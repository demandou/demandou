// Etiqueta (assinatura do Plantão) na tela dividida em faixas: a pessoa em cima, o painel embaixo.
// Um valor que muda — "custava R$ 100, passou a custar R$ 105", "parece inofensivo, mas faz mal".
// Aqui a etiqueta é a de preço deitada (ponta chanfrada e furo à esquerda), larga para caber
// palavras grandes. As duas vagas nascem "a lápis" em cantos opostos do painel: a de antes embaixo à
// esquerda e a de depois em cima à direita (ao contrário quando o valor desce), ligadas por um trilho
// tracejado em L com seta. A etiqueta ganha cor quando o rótulo de antes é dito e o valor acende;
// no "passou a" ela SOBE (ou desce) na diagonal até a vaga nova, enquanto o valor rola como placar
// (números) ou cruza (palavras). Fica o contorno da vaga antiga; na quina do trilho, o selo com a
// diferença. A taxa (opcional) conta no canto livre.
import { limitar, Palavras, prog, temposDoTexto, troca } from "../anim";
import type { Area } from "../layout";
import { caber, caberNaAltura } from "../medidas";
import type { Etiqueta as E, Palavra } from "../plano";
import { cor, manchete, MARGEM, numeros, rotulo, W } from "../tema";
import { contando } from "../valores";
import { Seta } from "./Icones";
import { Rolante } from "./Rolante";

const PAD = 22;

// etiqueta de preço deitada: a ponta da esquerda chanfrada, os cantos da direita arredondados
const formaDa = (L: number, A: number, c: number) =>
  `M ${c} 0 L ${L - 14} 0 Q ${L} 0 ${L} 14 L ${L} ${A - 14} Q ${L} ${A} ${L - 14} ${A} L ${c} ${A} L 0 ${A - c} L 0 ${c} Z`;

const numerico = (v: string) => /\d/.test(v) && v.replace(/[\d.,]/g, "").length <= 4;

export const EtiquetaDividida: React.FC<{ m: E; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const ALT = Math.round(Math.max(170, Math.min(250, (area.h - 2 * PAD - 16) / 2)));
  const LARG = Math.round(Math.min(620, (W - 2 * MARGEM) * 0.64));
  const chanfro = Math.round(ALT * 0.3);
  const forma = formaDa(LARG, ALT, chanfro);
  const furo = { x: Math.round(chanfro * 0.78), y: ALT / 2, r: Math.max(10, Math.round(ALT * 0.055)) };
  const desce = m.sentido === "desce";
  const baixo = area.y + area.h - PAD - ALT;
  const cima = area.y + PAD;
  const A = { x: MARGEM, y: desce ? cima : baixo };
  const B = { x: W - MARGEM - LARG, y: desce ? baixo : cima };

  // tempos (os mesmos da etiqueta do vídeo de exemplo)
  const temposAntes = temposDoTexto(m.antes.rotulo, palavras, m.de, m.ate, Math.max(entra + 0.3, m.antes.em - 1.2));
  const sobeEm = m.sobeEm ?? temposDoTexto(m.depois.rotulo, palavras, m.de, m.ate, m.antes.em + 0.05)[0];
  const temposDepois = temposDoTexto(m.depois.rotulo, palavras, m.de, m.ate, sobeEm - 0.05);
  const pCor = prog(t, Math.min(temposAntes[0] ?? m.antes.em, m.antes.em) - 0.08, 0.35);
  const pValor = prog(t, m.antes.em - 0.04, 0.35);
  const pSobe = prog(t, sobeEm, Math.max(0.5, m.depois.em + 0.25 - sobeEm), troca);
  const pRola = prog(t, m.depois.em - 0.04, 0.5, troca);
  const pTrocaRotulo = prog(t, sobeEm - 0.08, 0.3);
  const pSelo = prog(t, m.depois.em + 0.3, 0.34);
  const x = A.x + (B.x - A.x) * pSobe;
  const y = A.y + (B.y - A.y) * pSobe;

  // textos da etiqueta, à direita do furo: o rótulo em cima, o valor grande embaixo
  const xTexto = chanfro + 30;
  const larguraTexto = LARG - xTexto - 26;
  const corteRotulo = { peso: 800 as const, alta: true, espacamento: 0.06 };
  const tamRotulo = Math.min(...[m.antes.rotulo, m.depois.rotulo].map((r) => caber(r, { largura: larguraTexto, maximo: 38, minimo: 30, linhas: 1, corte: corteRotulo }).tam));
  const alturaValor = ALT - 2 * 22 - tamRotulo - 10;
  const corteValor = { peso: 900 as const, alta: true, tabular: true };
  const ambosNumeros = numerico(m.antes.valor) && numerico(m.depois.valor);
  const valores = [m.antes.valor, m.depois.valor].map((v) =>
    caberNaAltura(v, { largura: larguraTexto, maximo: 104, minimo: 40, linhas: ambosNumeros ? 1 : 2, corte: corteValor, alturaMax: alturaValor, entrelinha: 1.02 }),
  );
  const tamValor = Math.min(valores[0].tam, valores[1].tam);
  const linhasDoValor = (v: string) => caber(v, { largura: larguraTexto, maximo: tamValor, minimo: Math.min(40, tamValor), linhas: ambosNumeros ? 1 : 2, corte: corteValor }).linhas;
  const nLinhas = Math.max(linhasDoValor(m.antes.valor).length, linhasDoValor(m.depois.valor).length);
  const alturaBloco = tamRotulo + 10 + nLinhas * tamValor * 1.02;
  const yTexto = Math.round((ALT - alturaBloco) / 2);
  const estiloValor: React.CSSProperties = { ...manchete, ...numeros, fontSize: tamValor, letterSpacing: 0, lineHeight: 1.02 };

  // o trilho em L: sai da direita da vaga de antes, anda na horizontal e vira para a vaga nova
  const S = { x: A.x + LARG + 18, y: A.y + ALT / 2 };
  const K = { x: B.x + LARG * 0.72, y: A.y + ALT / 2 };
  const E2 = { x: K.x, y: desce ? B.y - 20 : B.y + ALT + 20 };
  const l1 = K.x - S.x;
  const l2 = Math.abs(E2.y - K.y);
  const andou = (l1 + l2) * pSobe;
  const ponta = andou <= l1 ? { x: S.x + andou, y: S.y } : { x: K.x, y: K.y + (desce ? 1 : -1) * (andou - l1) };
  const caminho = `M ${S.x} ${S.y} L ${K.x} ${K.y} L ${E2.x} ${E2.y}`;
  const aceso = andou <= l1 ? `M ${S.x} ${S.y} L ${ponta.x} ${ponta.y}` : `M ${S.x} ${S.y} L ${K.x} ${K.y} L ${ponta.x} ${ponta.y}`;

  // a taxa, no canto livre (em cima à esquerda quando sobe; embaixo à esquerda quando desce)
  const taxa = m.taxa;
  const caixaTaxa = desce
    ? { x: MARGEM, y: A.y + ALT + 18, w: B.x - MARGEM - 30, h: area.y + area.h - PAD - (A.y + ALT + 18) }
    : { x: MARGEM, y: cima, w: B.x - MARGEM - 30, h: A.y - 18 - cima };
  const temposTaxa = taxa ? temposDoTexto(taxa.rotulo, palavras, m.de, m.ate, entra + 0.15) : [];
  const rotTaxa = taxa ? caber(taxa.rotulo, { largura: caixaTaxa.w, maximo: 38, minimo: 30, linhas: 1, corte: corteRotulo }) : null;
  const tamTaxa = taxa ? caber(taxa.valor, { largura: caixaTaxa.w, maximo: Math.max(56, Math.min(150, caixaTaxa.h - (rotTaxa?.tam ?? 0) - 34)), minimo: 50, linhas: 1, corte: corteValor }).tam : 0;
  const pConta = taxa ? prog(t, taxa.em - 0.04, 0.6) : 0;
  const pLinhaTaxa = taxa ? prog(t, taxa.em, 0.6) : 0;

  const Contorno: React.FC<{ opacidade?: number }> = ({ opacidade = 0.6 }) => (
    <svg width={LARG} height={ALT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <path d={forma} fill="none" stroke={cor.celeste} strokeOpacity={opacidade} strokeWidth={4} strokeDasharray="14 12" />
      <circle cx={furo.x} cy={furo.y} r={furo.r} fill="none" stroke={cor.celeste} strokeOpacity={opacidade} strokeWidth={4} />
    </svg>
  );
  const Esboco: React.FC<{ r: string; v: string }> = ({ r, v }) => (
    <div style={{ position: "absolute", left: xTexto, top: yTexto, width: larguraTexto, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...rotulo, fontSize: tamRotulo, color: cor.apagadoNoAzul, whiteSpace: "pre" }}>{r}</div>
      <div style={{ ...estiloValor, color: cor.apagadoNoAzul }}>
        {linhasDoValor(v).map((l, i) => (
          <div key={i} style={{ whiteSpace: "pre" }}>{l}</div>
        ))}
      </div>
    </div>
  );
  const linhas = (v: string) =>
    linhasDoValor(v).map((l, i) => (
      <div key={i} style={{ whiteSpace: "pre" }}>
        {l}
      </div>
    ));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {taxa && rotTaxa ? (
        <div style={{ position: "absolute", left: caixaTaxa.x, top: caixaTaxa.y, width: caixaTaxa.w, height: caixaTaxa.h, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <Palavras palavras={taxa.rotulo.split(/\s+/)} tempos={temposTaxa} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.celeste} style={{ ...rotulo, fontSize: rotTaxa.tam }} />
          <div style={{ position: "relative", ...manchete, ...numeros, fontSize: tamTaxa, letterSpacing: 0, lineHeight: 1.02, whiteSpace: "pre" }}>
            <span style={{ color: cor.apagadoNoAzul, opacity: 1 - limitar(pConta * 4) }}>{taxa.valor}</span>
            <span style={{ position: "absolute", left: 0, top: 0, color: cor.branco, opacity: limitar(pConta * 4) }}>{pConta >= 1 ? taxa.valor : contando(taxa.valor, pConta)}</span>
          </div>
          <div style={{ position: "relative", height: 5, width: caixaTaxa.w, marginTop: 4 }}>
            <div style={{ position: "absolute", inset: 0, background: cor.apagadoNoAzul }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: caixaTaxa.w * pLinhaTaxa, background: cor.eletrico }} />
          </div>
        </div>
      ) : null}

      {/* o trilho em L: tracejado "a lápis"; acende em azul elétrico conforme a etiqueta anda */}
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path d={caminho} fill="none" stroke={cor.apagadoNoAzul} strokeWidth={5} strokeDasharray="10 12" />
        {pSobe > 0 ? <path d={aceso} fill="none" stroke={cor.eletrico} strokeWidth={7} /> : null}
      </svg>
      <Seta sentido={desce ? "desce" : "sobe"} tamanho={36} cor={pSobe > 0.95 ? cor.eletrico : cor.apagadoNoAzul} style={{ position: "absolute", left: E2.x - 18, top: desce ? E2.y - 18 : E2.y - 20 }} />

      {/* a vaga de destino ("a lápis"), que some quando a etiqueta chega */}
      <div style={{ position: "absolute", left: B.x, top: B.y, width: LARG, height: ALT, opacity: 1 - limitar(pSobe * 1.4) }}>
        <Contorno />
        <Esboco r={m.depois.rotulo} v={m.depois.valor} />
      </div>
      {/* o contorno do valor antigo, que fica onde a etiqueta estava */}
      <div style={{ position: "absolute", left: A.x, top: A.y, width: LARG, height: ALT, opacity: limitar(pSobe * 1.6) }}>
        <Contorno />
        <Esboco r={m.antes.rotulo} v={m.antes.valor} />
      </div>

      {/* o selo da diferença, na quina do trilho */}
      {m.diferenca ? (
        <div style={{ position: "absolute", left: K.x, top: K.y, translate: "-50% -50%", height: 72, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, background: cor.estudio, opacity: 1 - pSelo }} />
          <div style={{ position: "absolute", inset: 0, background: cor.eletrico, opacity: pSelo }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "0 20px", scale: String(0.94 + 0.06 * pSelo) }}>
            <Seta sentido={desce ? "desce" : "sobe"} tamanho={32} cor={pSelo > 0.5 ? cor.branco : cor.apagadoNoAzul} />
            <div style={{ ...manchete, ...numeros, fontSize: caber(m.diferenca, { largura: 220, maximo: 48, minimo: 32, linhas: 1, corte: corteValor }).tam, color: pSelo > 0.5 ? cor.branco : cor.apagadoNoAzul, letterSpacing: 0, translate: "0 2px", whiteSpace: "pre" }}>
              {m.diferenca}
            </div>
          </div>
        </div>
      ) : null}

      {/* a etiqueta */}
      <div style={{ position: "absolute", left: x, top: y, width: LARG, height: ALT }}>
        {pCor < 1 ? <Contorno opacidade={0.6 * (1 - pCor)} /> : null}
        <svg width={LARG} height={ALT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <path d={forma} fill={cor.papel} fillOpacity={pCor} />
          <circle cx={furo.x} cy={furo.y} r={furo.r + 1} fill={cor.estudio} opacity={pCor} />
        </svg>
        <div style={{ position: "absolute", left: xTexto, top: yTexto, width: larguraTexto, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* rótulo de antes e o de depois: o novo rola para o lugar do antigo (placar), sem os dois
              textos um em cima do outro */}
          <div style={{ position: "relative", height: Math.round(tamRotulo * 1.12), overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, translate: `0 ${(desce ? 1 : -1) * pTrocaRotulo * 110}%` }}>
              <Palavras
                palavras={m.antes.rotulo.split(/\s+/)}
                tempos={temposAntes}
                t={t}
                esboco={pCor < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel}
                corDe={() => "rgba(11,29,110,0.62)"}
                style={{ ...rotulo, fontSize: tamRotulo, lineHeight: 1.12 }}
              />
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, translate: `0 ${(desce ? -1 : 1) * (1 - pTrocaRotulo) * 110}%` }}>
              <Palavras palavras={m.depois.rotulo.split(/\s+/)} tempos={temposDepois} t={t} esboco={cor.apagadoNoPapel} corDe={() => cor.eletrico} style={{ ...rotulo, fontSize: tamRotulo, lineHeight: 1.12 }} />
            </div>
          </div>
          {/* o valor: "a lápis" até ser dito; depois rola (números) ou cruza (palavras) para o novo */}
          {ambosNumeros ? (
            <span style={{ position: "relative", display: "inline-block", alignSelf: "flex-start", ...estiloValor, whiteSpace: "pre" }}>
              <span style={{ color: pCor < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel, opacity: 1 - pValor }}>{m.antes.valor}</span>
              <span style={{ position: "absolute", left: 0, top: 0, color: cor.tinta, opacity: pValor, translate: `0 ${(1 - pValor) * 20}px` }}>
                <Rolante de={m.antes.valor} para={m.depois.valor} p={pRola} />
              </span>
            </span>
          ) : (
            <div style={{ position: "relative", height: Math.round(nLinhas * tamValor * 1.02 + 6), overflow: "hidden", ...estiloValor }}>
              {/* o valor de antes: "a lápis", acende na fala e rola para fora quando o novo chega */}
              <div style={{ position: "absolute", left: 0, top: 0, translate: `0 ${(desce ? 1 : -1) * pRola * 105}%` }}>
                <div style={{ color: pCor < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel }}>{linhas(m.antes.valor)}</div>
                <div style={{ position: "absolute", left: 0, top: 0, color: cor.tinta, opacity: pValor }}>{linhas(m.antes.valor)}</div>
              </div>
              <div style={{ position: "absolute", left: 0, top: 0, color: cor.eletrico, translate: `0 ${(desce ? -1 : 1) * (1 - pRola) * 105}%` }}>{linhas(m.depois.valor)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
