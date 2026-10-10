// "Até 3×": o número grande e uma etiqueta por unidade (1º mês, 2º mês, 3º mês), que acendem no
// ritmo da fala. No quadro deitado a pessoa vai para a porta da direita (a moldura da aula 9) e o
// "N×" fica na parede da esquerda: o rótulo e o número grande, o que é contado ao lado e as etiquetas
// numa fileira (a coluna alta do vertical não cabe na altura do quadro deitado).
import { useMemo } from "react";
import { balanco, Linhas, Palavras, prog, temposDoTexto } from "../anim";
import { encaixar, larguraTexto, ROTULO } from "../medida";
import type { Palavra, Vezes as TipoVezes } from "../plano";
import { cor, grotesca, rotulo, serifa } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";
import { respiro } from "./Parede";

// as etiquetas do plano ou, sem elas, uma por unidade ("1", "2", "3"…), acendendo logo depois do número
export const etiquetasDoVezes = (m: TipoVezes) =>
  m.etiquetas?.length
    ? m.etiquetas.slice(0, 6)
    : Array.from({ length: Math.min(6, Math.max(1, Math.round(m.n))) }, (_, i) => ({ texto: String(i + 1), em: m.numeroEm + 0.12 + i * 0.2 }));

// O "N×" na parede da esquerda: o rótulo e o número grande à esquerda, o que é contado à direita e
// as etiquetas numa fileira.
export const VezesNaParede: React.FC<{ m: TipoVezes; palavras: Palavra[]; t: number; w: number; h: number }> = ({ m, palavras, t, w, h }) => {
  const etiquetas = etiquetasDoVezes(m);
  const temposUnidade = useMemo(() => temposDoTexto(m.unidade, palavras, m.numeroEm, m.ate, m.numeroEm + 0.1), [m.unidade, palavras, m.numeroEm, m.ate]);
  const temposPrefixo = useMemo(() => (m.prefixo ? temposDoTexto(m.prefixo, palavras, m.de, m.numeroEm, m.de) : []), [m.prefixo, palavras, m.de, m.numeroEm]);
  const numero = prog(t, m.numeroEm - 0.04, 0.4);
  const rotuloFit = encaixar(m.rotulo, { largura: w, max: 40, min: 30, linhas: 1, fonte: ROTULO });
  const corpoNumero = 290;
  const larguraNumero = larguraTexto(`${m.n}×`, corpoNumero, { nome: "serifa" }) + 10;
  const larguraDir = w - larguraNumero - 40;
  const unidadeFit = encaixar(m.unidade, { largura: larguraDir, max: 64, min: 44, linhas: 3 });
  const porFila = etiquetas.length <= 3 ? etiquetas.length : Math.ceil(etiquetas.length / 2);
  const filas = Math.ceil(etiquetas.length / porFila);
  const vao = 20;
  const wE = (w - vao * (porFila - 1)) / porFila;
  const hE = 96;
  const corpoEtiqueta = Math.min(48, ...etiquetas.map((e) => encaixar(e.texto, { largura: wE - 74 - 16, max: 48, min: 30, linhas: 1, fonte: { nome: "g700" } }).tamanho));
  const alturaTopo = rotuloFit.tamanho + 24 + corpoNumero * 0.95;
  const alturaTotal = alturaTopo + 40 + filas * hE + (filas - 1) * 16 + (m.fonte ? 70 : 0);
  const y0 = Math.max(0, (h - alturaTotal) / 2);
  return (
    <div style={{ position: "absolute", left: 0, top: y0, width: w }}>
      <div style={{ ...rotulo, fontSize: rotuloFit.tamanho, color: cor.verde }}>{rotuloFit.linhas.join(" ")}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 40, marginTop: 24 }}>
        <div style={{ position: "relative", width: larguraNumero, height: corpoNumero * 0.95, flexShrink: 0 }}>
          <div style={{ position: "absolute", left: 0, bottom: 0, fontFamily: serifa, fontSize: corpoNumero, lineHeight: 0.92, color: cor.lapisClaro, opacity: 1 - numero, fontVariantNumeric: "lining-nums" }}>
            {m.n}×
          </div>
          <div style={{ position: "absolute", left: 0, bottom: 0, fontFamily: serifa, fontSize: corpoNumero, lineHeight: 0.92, color: cor.preto, opacity: numero, translate: `0 ${(1 - numero) * 30}px`, fontVariantNumeric: "lining-nums" }}>
            {m.n}
            <span style={{ color: cor.verde }}>×</span>
          </div>
        </div>
        <div style={{ width: larguraDir, paddingBottom: 24 }}>
          {m.prefixo ? (
            <Palavras palavras={m.prefixo.split(/\s+/)} tempos={temposPrefixo} t={t} esboco={0.25} style={{ fontFamily: serifa, fontSize: 64, color: cor.preto, lineHeight: 1, marginBottom: 14 }} />
          ) : null}
          <Linhas linhas={unidadeFit.linhas} tempos={temposUnidade} t={t} esboco={0.25} style={{ fontFamily: grotesca, fontWeight: 600, fontSize: unidadeFit.tamanho, lineHeight: 1.12, color: cor.preto }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${porFila}, ${wE}px)`, columnGap: vao, rowGap: 16, marginTop: 40 }}>
        {etiquetas.map((e, i) => {
          const acende = prog(t, e.em, 0.28);
          const giro = balanco(t, e.em + 0.05, 5, 0.6, 0.28) + respiro(t, i, 0.25);
          return (
            <div key={`${e.texto}-${i}`} style={{ position: "relative", width: wE, height: hE, transformOrigin: `30px ${hE / 2}px`, rotate: `${giro}deg` }}>
              <FundoEtiqueta w={wE} h={hE} deitada esboco={1 - acende} acesa={acende} />
              <div style={{ position: "absolute", left: 74, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: grotesca, fontWeight: 700, fontSize: corpoEtiqueta, whiteSpace: "nowrap", color: acende > 0.5 ? cor.papel : cor.lapis }}>
                {e.texto}
              </div>
            </div>
          );
        })}
      </div>
      {m.fonte ? (
        <div style={{ fontFamily: grotesca, fontWeight: 500, fontSize: 32, lineHeight: 1.25, color: cor.texto2, marginTop: 30, opacity: prog(t, m.numeroEm + 0.3, 0.4) }}>{m.fonte}</div>
      ) : null}
    </div>
  );
};
