// A barra de progresso da aula: uma pílula de papel no alto, nos dois modos. "AULA 3" em violeta,
// o título da aula, um trecho por seção (o da vez enche com o tempo; os vistos ficam em tinta) e o
// nome da seção da vez, que troca subindo (o antigo sai antes de o novo entrar). Aparece depois do cartão de capítulo (ou em `aula.de`).
import { larguraTexto } from "../medida";
import type { Plano } from "../plano";
import { CABECALHO, COR, FONTE, SOMBRA, prog } from "../tema";

const SEG = 56;
const VAO = 6;

export const inicioDoProgresso = (plano: Plano) => {
  if (plano.aula?.de !== undefined) return plano.aula.de;
  const cap = plano.momentos.filter((m) => m.tipo === "capitulo").sort((a, b) => a.de - b.de)[0];
  return cap && cap.de < 1 ? cap.ate : 0;
};

export const Progresso: React.FC<{ plano: Plano; t: number; dx?: number }> = ({ plano, t, dx = 0 }) => {
  const aula = plano.aula;
  if (!aula?.titulo) return null;
  const de = inicioDoProgresso(plano);
  if (t < de) return null;
  const secoes = [...(aula.secoes ?? [])].sort((a, b) => a.de - b.de);
  const n = secoes.length;
  // no quadro 0 a barra já está lá
  const e = de <= 0.001 ? 1 : prog(t, de, 0.45);
  // legível num celular deitado: nada abaixo de 28 px
  const tamN = 28;
  const tamT = 30;
  const tamS = 28;
  const num = aula.numero ?? "";
  const wNum = num ? larguraTexto(num, tamN, { peso: 800, caixaAlta: true, espacamento: 0.1 }) : 0;
  const wTit = larguraTexto(aula.titulo, tamT, { peso: 800 });
  const wSeg = n ? n * SEG + (n - 1) * VAO : 0;
  const wSec = n ? Math.max(...secoes.map((s) => larguraTexto(s.texto, tamS, { peso: 700 }))) : 0;
  const P = 28;
  const w = Math.round(P + (num ? wNum + 20 : 0) + wTit + (n ? 30 + wSeg + 22 + wSec : 0) + P);
  // a seção da vez
  let k = -1;
  secoes.forEach((s, i) => {
    if (t >= s.de - 0.05) k = i;
  });
  const fimDe = (i: number) => secoes[i + 1]?.de ?? plano.duracao;
  const xSeg = P + (num ? wNum + 20 : 0) + wTit + 30;
  const xSec = xSeg + wSeg + 22;
  const troca = k >= 0 ? prog(t, secoes[k].de - 0.05, 0.35) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: CABECALHO.x + dx,
        top: CABECALHO.y,
        width: w,
        height: CABECALHO.h,
        borderRadius: CABECALHO.h / 2,
        background: "rgba(255,255,255,0.96)",
        boxShadow: SOMBRA,
        overflow: "hidden",
        opacity: e >= 1 ? 1 : e,
        transform: e >= 1 ? undefined : `translateY(${(1 - e) * -14}px)`,
      }}
    >
      {num ? <div style={{ position: "absolute", left: P, top: 0, height: CABECALHO.h, lineHeight: `${CABECALHO.h}px`, fontFamily: FONTE, fontWeight: 800, fontSize: tamN, letterSpacing: "0.1em", textTransform: "uppercase", color: COR.violeta, whiteSpace: "nowrap" }}>{num}</div> : null}
      <div style={{ position: "absolute", left: P + (num ? wNum + 20 : 0), top: 0, height: CABECALHO.h, lineHeight: `${CABECALHO.h}px`, fontFamily: FONTE, fontWeight: 800, fontSize: tamT, color: COR.tinta, whiteSpace: "nowrap" }}>{aula.titulo}</div>
      {secoes.map((s, i) => {
        const cheio = i < k ? 1 : i === k ? Math.min(1, Math.max(0, (t - s.de) / Math.max(0.5, fimDe(i) - s.de))) : 0;
        return (
          <div key={i} style={{ position: "absolute", left: xSeg + i * (SEG + VAO), top: CABECALHO.h / 2 - 5, width: SEG, height: 10, borderRadius: 5, background: COR.trilho, overflow: "hidden" }}>
            <div style={{ width: `${(cheio * 100).toFixed(2)}%`, height: 10, background: i === k ? COR.violeta : COR.tinta }} />
          </div>
        );
      })}
      {k >= 0 ? (
        <div style={{ position: "absolute", left: xSec, top: 0, height: CABECALHO.h, overflow: "hidden" }}>
          {k > 0 && troca < 1 ? (
            <div style={{ position: "absolute", left: 0, top: -troca * 30, height: CABECALHO.h, lineHeight: `${CABECALHO.h}px`, fontFamily: FONTE, fontWeight: 700, fontSize: tamS, color: COR.apoio, whiteSpace: "nowrap", opacity: Math.max(0, 1 - troca * 2) }}>{secoes[k - 1].texto}</div>
          ) : null}
          <div style={{ position: "relative", top: troca >= 1 ? 0 : (1 - troca) * 30, height: CABECALHO.h, lineHeight: `${CABECALHO.h}px`, fontFamily: FONTE, fontWeight: 700, fontSize: tamS, color: COR.apoio, whiteSpace: "nowrap", opacity: k > 0 ? Math.max(0, troca * 2 - 1) : troca }}>{secoes[k].texto}</div>
        </div>
      ) : null}
    </div>
  );
};
