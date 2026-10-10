// Número: uma etiqueta de preço grande, pendurada num prego por um cordão (como a etiqueta de um
// imóvel ou de uma chave). O número nasce a lápis, conta até o valor na palavra dita e, quando assenta,
// a etiqueta balança e um traço verde sublinha o número. O rótulo ganha tinta na palavra dele.
import { useMemo } from "react";
import { balanco, prog } from "../anim";
import { encaixar, larguraTexto, numeroBR, ROTULO } from "../medida";
import type { Numero as TipoNumero, Palavra } from "../plano";
import { cor, grotesca, rotulo as estiloRotulo, serifa } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";
import { Cordao, Prego, SeloIlustrativo } from "./Pecas";
import { respiro } from "./Parede";

const SERIFA = { nome: "serifa" as const };

export const EtiquetaDePreco: React.FC<{ m: TipoNumero; palavras: Palavra[]; t: number; w: number; h: number }> = ({ m, t, w, h }) => {
  const tw = Math.min(w - 40, 860);
  const th = Math.min(h - 130, 640);
  const tx = (w - tw) / 2;
  const ty = Math.max(110, (h - th) / 2 + 30);
  const pregoY = Math.max(24, ty - 92);
  const furoY = Math.min(tw * 0.24, 46) * 0.95;
  const inicio = m.inicio ?? 0;
  const dur = Math.min(1.3, Math.max(0.6, (m.ate - m.em) * 0.4));
  const valor = m.casas ? Number(m.valor.toFixed(m.casas)) : m.valor;
  const casas = m.casas ?? (Number.isInteger(valor) ? 0 : undefined);
  const final = numeroBR(valor, casas);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  const interna = tw - 170;

  // o maior corpo em que prefixo + número + sufixo cabem numa linha
  const corpo = useMemo(() => {
    for (let n = 250; n >= 96; n -= 4) {
      const total = larguraTexto(final, n, SERIFA) + (prefixo ? larguraTexto(prefixo, n * 0.4, SERIFA) + n * 0.1 : 0) + (sufixo ? larguraTexto(sufixo, n * 0.4, SERIFA) + n * 0.08 : 0);
      if (total <= interna) return n;
    }
    return 96;
  }, [final, prefixo, sufixo, interna]);
  const rotuloFit = useMemo(() => encaixar(m.rotulo, { largura: interna, max: 46, min: 32, linhas: 2, fonte: ROTULO }), [m.rotulo, interna]);
  const larguraNumero = larguraTexto(final, corpo, SERIFA) + (prefixo ? larguraTexto(prefixo, corpo * 0.4, SERIFA) + corpo * 0.1 : 0) + (sufixo ? larguraTexto(sufixo, corpo * 0.4, SERIFA) + corpo * 0.08 : 0);

  const conta = prog(t, m.em, dur);
  const atual = conta >= 1 ? valor : inicio + (valor - inicio) * (1 - Math.pow(1 - conta, 3));
  const texto = conta >= 1 ? final : numeroBR(casas === 0 ? Math.round(atual) : atual, casas ?? 1);
  const dito = prog(t, m.em - 0.04, 0.2);
  const assentou = m.em + dur;
  const traco = prog(t, assentou, 0.4);
  const rotuloP = prog(t, (m.rotuloEm ?? m.em) - 0.1, 0.35);
  const angulo = balanco(t, assentou - 0.05, 3.2, 0.9, 0.45) + respiro(t, 0.4, 0.5);

  const alturaConteudo = rotuloFit.linhas.length * rotuloFit.tamanho * 1.1 + 26 + corpo * 0.95 + 40 + (m.ilustrativo ? 70 : 0);
  const yConteudo = furoY + 40 + Math.max(0, (th - furoY - 40 - alturaConteudo) / 2);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${w / 2}px ${pregoY}px`, rotate: `${angulo}deg` }}>
        <Cordao x1={w / 2} y1={pregoY} x2={w / 2} y2={ty + furoY} />
        <div style={{ position: "absolute", left: tx, top: ty, width: tw, height: th }}>
          <FundoEtiqueta w={tw} h={th} />
          <div style={{ position: "absolute", left: 0, right: 0, top: yConteudo, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ ...estiloRotulo, fontSize: rotuloFit.tamanho, lineHeight: 1.1, textAlign: "center", color: rotuloP > 0.5 ? cor.verde : cor.lapis, opacity: 0.5 + 0.5 * rotuloP }}>
              {rotuloFit.linhas.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            <div style={{ position: "relative", width: larguraNumero, height: corpo * 0.95, marginTop: 26 }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "baseline",
                  whiteSpace: "nowrap",
                  fontFamily: serifa,
                  lineHeight: 0.86,
                  color: dito > 0.5 ? cor.preto : cor.lapisClaro,
                  fontVariantNumeric: "lining-nums",
                  translate: `0 ${(1 - dito) * 14}px`,
                }}
              >
                {prefixo ? <span style={{ fontSize: corpo * 0.4, marginRight: corpo * 0.1, color: dito > 0.5 ? cor.texto2 : cor.lapisClaro }}>{prefixo}</span> : null}
                <span style={{ fontSize: corpo }}>{dito > 0.02 ? texto : final}</span>
                {sufixo ? <span style={{ fontSize: corpo * 0.4, marginLeft: corpo * 0.08, color: dito > 0.5 ? cor.texto2 : cor.lapisClaro }}>{sufixo}</span> : null}
              </div>
            </div>
            {/* o traço verde que sublinha o número quando ele assenta */}
            <div style={{ width: larguraNumero, height: 10, marginTop: 22, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: larguraNumero, borderRadius: 5, border: `2.5px dashed ${cor.lapisClaro}`, boxSizing: "border-box", opacity: 1 - traco }} />
              <div style={{ position: "absolute", left: 0, top: 0, height: 10, width: larguraNumero * traco, borderRadius: 5, background: cor.verde, opacity: traco > 0 ? 1 : 0 }} />
            </div>
            {m.ilustrativo ? <SeloIlustrativo estilo={{ marginTop: 34, fontFamily: grotesca }} /> : null}
          </div>
        </div>
      </div>
      <Prego x={w / 2} y={pregoY} r={13} />
    </div>
  );
};
