// Comparação (bloco universal) no painel do estúdio: o placar de dois lados, como numa tela de
// debate do telejornal. Cada coluna tem o rótulo numa tarja branca e o texto grande embaixo, que
// acendem no `em` do lado. No meio, um fio com o selo do modo (× para "contra", → para
// "antes-depois"). Com vencedor (ou no modo "errado-certo"), o lado certo ganha o quadrado azul com
// o visto e o outro apaga e leva o ×.
import { limitar, Linhas, prog, temposDoTexto, varredura } from "../anim";
import type { Area } from "../layout";
import { caber, caberNaAltura } from "../medidas";
import type { Comparacao as C, Palavra } from "../plano";
import { cor, manchete, MARGEM, rotulo, W } from "../tema";
import { Cabecalho, medirCabecalho } from "./Cabecalho";
import { SetaDireita, Visto, Xis } from "./Icones";

const MEIO = 72;

export const Comparacao: React.FC<{ m: C; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const cab = medirCabecalho(m.titulo);
  const yCorpo = area.y + (cab ? 30 + cab.altura + 28 : 34);
  const colW = (W - 2 * MARGEM - MEIO) / 2;
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const lados = m.lados;
  // o veredito: no `vencedorEm`, ou logo depois de o segundo lado ser dito
  const temposLados = lados.map((l) => temposDoTexto(l.texto, palavras, m.de, m.ate, l.em - 0.06));
  const fimDoSegundo = temposLados[1][temposLados[1].length - 1] ?? lados[1].em;
  const vereditoEm = m.vencedorEm ?? fimDoSegundo + 0.45;
  const pVeredito = vencedor === undefined ? 0 : prog(t, vereditoEm - 0.05, 0.35);
  const altMarca = vencedor === undefined ? 0 : 76;
  const yFim = area.y + area.h - 30;
  const rotulos = lados.map((l) => caber(l.rotulo, { largura: colW - 48, maximo: 40, minimo: 30, linhas: 1, corte: { peso: 800, alta: true, espacamento: 0.06 } }));
  const altRotulo = 66;
  const alturaTexto = yFim - (yCorpo + altRotulo + 22) - (altMarca ? altMarca + 18 : 0);
  // os dois textos com o mesmo corpo (o placar fica alinhado)
  const textos = lados.map((l) => caberNaAltura(l.texto, { largura: colW - 8, maximo: 72, minimo: 40, linhas: 3, corte: { peso: 900, alta: true, espacamento: -0.01 }, alturaMax: alturaTexto, entrelinha: 1.06 }));
  const tam = Math.min(textos[0].tam, textos[1].tam);
  const linhasDe = (k: number) => caber(lados[k].texto, { largura: colW - 8, maximo: tam, minimo: Math.min(tam, 40), linhas: 3, corte: { peso: 900, alta: true, espacamento: -0.01 } }).linhas;
  const pMeio = prog(t, lados[1].em - 0.3, 0.4);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cab && m.titulo ? <Cabecalho titulo={m.titulo} medida={cab} palavras={palavras} t={t} de={m.de} ate={m.ate} inicio={Math.max(entra + 0.15, m.de)} y={area.y + 30} /> : null}
      {/* o fio do meio e o selo do modo */}
      <div style={{ position: "absolute", left: W / 2 - 2, top: yCorpo, width: 4, height: yFim - yCorpo, background: cor.apagadoNoAzul }} />
      <div
        style={{
          position: "absolute",
          left: W / 2 - 34,
          top: yCorpo + (yFim - yCorpo) / 2 - 34,
          width: 68,
          height: 68,
          background: pMeio > 0.5 ? cor.eletrico : cor.estudio,
          border: `4px ${pMeio > 0.5 ? "solid" : "dashed"} ${pMeio > 0.5 ? cor.eletrico : cor.apagadoNoAzul}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {modo === "antes-depois" ? <SetaDireita tamanho={40} cor={pMeio > 0.5 ? cor.branco : cor.apagadoNoAzul} /> : <Xis tamanho={36} cor={pMeio > 0.5 ? cor.branco : cor.apagadoNoAzul} />}
      </div>
      {lados.map((l, k) => {
        const x = MARGEM + k * (colW + MEIO);
        const p = prog(t, l.em - 0.12, 0.34);
        const perde = vencedor !== undefined && vencedor !== k;
        const apaga = perde ? 1 - 0.5 * pVeredito : 1;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: yCorpo, width: colW, height: yFim - yCorpo }}>
            <div style={{ opacity: apaga }}>
              <div style={{ position: "relative", height: altRotulo, display: "inline-flex", alignItems: "center", padding: "0 24px" }}>
                <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, opacity: 1 - limitar(p * 2) }} />
                <div style={{ position: "absolute", inset: 0, background: cor.papel, clipPath: varredura(p) }} />
                <div style={{ position: "relative", ...rotulo, fontSize: rotulos[k].tam, color: p > 0.5 ? cor.tinta : cor.apagadoNoAzul, translate: "0 2px" }}>{l.rotulo}</div>
              </div>
              <div style={{ marginTop: 22 }}>
                <Linhas linhas={linhasDe(k)} tempos={temposLados[k]} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.branco} entrelinha={Math.round(tam * 0.06)} style={{ ...manchete, fontSize: tam }} />
              </div>
            </div>
            {vencedor !== undefined ? (
              <div style={{ position: "absolute", left: 0, bottom: 0, width: altMarca, height: altMarca, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, opacity: 1 - pVeredito }} />
                <div style={{ position: "absolute", inset: 0, background: perde ? cor.noite : cor.eletrico, border: perde ? `4px solid ${cor.celeste}` : "none", clipPath: varredura(pVeredito) }} />
                <div style={{ position: "relative", opacity: limitar((pVeredito - 0.4) / 0.4) }}>
                  {perde ? <Xis tamanho={40} cor={cor.celeste} /> : <Visto tamanho={44} cor={cor.branco} p={limitar((pVeredito - 0.3) / 0.7)} />}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
