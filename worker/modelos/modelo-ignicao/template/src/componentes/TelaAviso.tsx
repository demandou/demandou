// Momento "aviso" (modo retrovisor): uma mensagem do painel na tela central grande — rótulo, um
// número que conta até o valor no instante em que é dito (como o visor de um computador de bordo)
// e o texto que se acende palavra por palavra. Uma luz-espia opcional acende ao lado.
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Aviso, Palavra } from "../plano";
import { cor, rotulo, texto } from "../tema";
import type { Parte } from "./Painel";
import { LuzGrande } from "./Icones";

// abaixo da fileira de luzes, dentro da tela grande
const AREA = { x: 100, y: 936, w: 880, h: 330 };

const formatar = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const TelaAviso: React.FC<{ m: Aviso; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const comIcone = !!m.icone;
  const largura = AREA.w - (comIcone ? 250 : 0);
  const corpo = diagramar(m.texto, { largura, maximo: 56, minimo: 44, linhas: 3, peso: 700 });
  const tTexto = temposDoTexto(m.texto, palavras, m.de, m.ate);
  const v = m.valor;
  const conta = v ? prog(t, v.em - 0.05, 0.9) : 0;
  const numero = v ? formatar(v.numero * conta, v.casas ?? 0) : "";
  const final = v ? formatar(v.numero, v.casas ?? 0) : "";
  const tamNumero = v ? Math.min(132, Math.floor((largura - medir(v.unidade, 56, 600, false) - 30) / Math.max(1, medir(final, 1, 700, false)))) : 0;

  if (parte === "fora") {
    // o rótulo vai para a faixa entre os mostradores compactos
    if (!m.rotulo) return null;
    const r = diagramar(m.rotulo, { largura: 400, maximo: 52, minimo: 36, linhas: 1, peso: 700 });
    return (
      <div style={{ position: "absolute", left: 330, width: 420, top: 1340, display: "flex", flexDirection: "column", alignItems: "center", opacity: entrada * (1 - s) }}>
        <div style={rotulo(32)}>Aviso</div>
        <div style={texto(700, r.tam, { textTransform: "uppercase", marginTop: 12 })}>{r.linhas[0]}</div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {comIcone && m.icone ? (
        <div style={{ position: "absolute", left: AREA.x, top: AREA.y + (AREA.h - 200) / 2, width: 200, height: 200 }}>
          <LuzGrande icone={m.icone} t={t} em={tTexto[0] ?? m.de} tamanho={200} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: AREA.x + (comIcone ? 250 : 0),
          top: AREA.y,
          width: largura,
          height: AREA.h,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {v ? (
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: 18 }}>
            <span style={texto(700, tamNumero, { lineHeight: 0.9, color: conta > 0 ? cor.marfim : cor.apagado, fontVariantNumeric: "tabular-nums" })}>
              {conta > 0 ? numero : final}
            </span>
            <span style={texto(600, 56, { color: cor.aco, marginLeft: 18 })}>{v.unidade}</span>
          </div>
        ) : null}
        <Acende linhas={corpo.linhas} tempos={tTexto} t={t} entrelinha={1.06} style={texto(700, corpo.tam, { textTransform: "uppercase" })} />
      </div>
    </div>
  );
};
