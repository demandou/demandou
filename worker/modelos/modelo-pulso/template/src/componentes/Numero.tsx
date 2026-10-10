// Número: a leitura grande do app, num cartão branco no peito. O rótulo se monta na fala, o número
// conta até o valor dito (dígitos de largura fixa, sem "dançar") e a régua das cinco zonas enche
// junto, com o botão do ponteiro correndo na ponta — como o anel do relógio aberto numa linha.
import { Digitos, Linhas, limitar, prog, temposDoTexto, trava } from "../anim";
import type { Presenca } from "../layout";
import { encaixar, formatar, LETREIRO, larguraTexto, MOSTRADOR, SANS } from "../medida";
import type { Numero as NumeroT, Palavra } from "../plano";
import { cor, letreiro, mostrador, sans, sombraAlta, ZONAS, zonaCor } from "../tema";
import { CARTAO_PEITO } from "./Gancho";

export const Numero: React.FC<{ m: NumeroT; t: number; palavras: Palavra[]; topo: number; pres: Presenca }> = ({ m, t, palavras, topo, pres }) => {
  if (pres.opacidade <= 0.001) return null;
  const pad = CARTAO_PEITO.pad;
  const largura = CARTAO_PEITO.w - 2 * pad;
  const z = zonaCor(m.zona);
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  const final = formatar(m.valor, casas);
  // etiqueta "ilustrativo" no canto de cima
  const etiqueta = m.ilustrativo ? "ilustrativo" : "";
  const largEtiqueta = etiqueta ? larguraTexto(etiqueta, 28, LETREIRO) + 44 : 0;
  // rótulo
  const encRotulo = encaixar(m.rotulo, { largura: largura - (largEtiqueta ? largEtiqueta + 20 : 0), max: 48, min: 38, linhas: 2, fonte: SANS });
  const lhRotulo = Math.round(encRotulo.tamanho * 1.16);
  const temposRotulo = temposDoTexto(m.rotulo, palavras, m.de, m.ate, m.rotuloEm ?? m.de + 0.1);
  // o número: o maior corpo em que prefixo + número + sufixo cabem numa linha
  const largDe = (tam: number) =>
    (prefixo ? larguraTexto(prefixo, tam * 0.42, MOSTRADOR) + tam * 0.12 : 0) +
    [...final].reduce((s, c) => s + tam * (/[0-9]/.test(c) ? 0.6 : /[.,]/.test(c) ? 0.28 : 0.62), 0) +
    (sufixo ? larguraTexto(sufixo, tam * 0.42, MOSTRADOR) + tam * 0.12 : 0);
  let tam = 176;
  while (tam > 90 && largDe(tam) > largura) tam -= 4;
  const topoRotulo = topo + pad;
  const topoNumero = topoRotulo + encRotulo.linhas.length * lhRotulo + 6;
  const topoRegua = topoNumero + tam * 1.02 + 18;
  const altura = topoRegua + 22 + 40 - topo;

  // a contagem: dispara no `em` e trava no valor (≈1,1 s)
  const conta = prog(t, m.em, 1.1, trava);
  const dito = t >= m.em - 0.02;
  const atual = m.valor * conta;
  const texto = dito ? formatar(conta >= 1 ? m.valor : atual, casas) : formatar(0, casas);
  const corNumero = dito ? cor.tinta : cor.esboco;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pres.opacidade, translate: `${pres.dx}px ${pres.dy}px` }}>
      <div style={{ position: "absolute", left: CARTAO_PEITO.x, top: topo, width: CARTAO_PEITO.w, height: altura, borderRadius: 40, background: cor.cartao, boxShadow: sombraAlta }} />
      <Linhas
        linhas={encRotulo.linhas}
        tempos={temposRotulo}
        t={t}
        x={CARTAO_PEITO.x + pad}
        y={topoRotulo}
        largura={largura}
        alturaLinha={lhRotulo}
        estilo={{ fontFamily: sans, fontWeight: 700, fontSize: encRotulo.tamanho, color: cor.tintaSuave }}
        esboco={cor.esboco}
      />
      {etiqueta ? (
        <div
          style={{
            ...letreiro,
            fontSize: 28,
            position: "absolute",
            right: CARTAO_PEITO.x + pad,
            top: topoRotulo + 4,
            color: cor.tintaFraca,
            border: `3px solid ${cor.esboco}`,
            borderRadius: 999,
            padding: "8px 18px 7px",
          }}
        >
          {etiqueta}
        </div>
      ) : null}
      {/* a leitura */}
      <div
        style={{
          position: "absolute",
          left: CARTAO_PEITO.x + pad,
          top: topoNumero,
          height: tam * 1.02,
          display: "flex",
          alignItems: "baseline",
          gap: tam * 0.12,
          fontFamily: mostrador,
          fontWeight: 700,
          color: corNumero,
          lineHeight: `${tam * 1.02}px`,
          whiteSpace: "nowrap",
        }}
      >
        {prefixo ? <span style={{ fontSize: tam * 0.42, fontWeight: 600, color: dito ? cor.tintaSuave : cor.esboco }}>{prefixo}</span> : null}
        <Digitos texto={texto} tamanho={tam} style={{ fontSize: tam, letterSpacing: "-0.01em" }} />
        {sufixo ? <span style={{ fontSize: tam * 0.42, fontWeight: 600, color: dito ? cor.tintaSuave : cor.esboco }}>{sufixo}</span> : null}
      </div>
      {/* a régua das zonas, enchendo com a contagem */}
      <Regua x={CARTAO_PEITO.x + pad} y={topoRegua} largura={largura} p={conta} corPonta={z.cor} visivel={dito ? 1 : 0.0} />
    </div>
  );
};

// Régua das cinco zonas (o anel do relógio aberto numa linha) que enche até `p`, com o ponteiro.
export const Regua: React.FC<{ x: number; y: number; largura: number; p: number; corPonta: string; visivel: number; altura?: number }> = ({
  x,
  y,
  largura,
  p,
  corPonta,
  visivel,
  altura = 22,
}) => {
  const gap = 8;
  const larg = (largura - gap * 4) / 5;
  const ponta = x + limitar(p) * largura;
  return (
    <>
      {ZONAS.map((zz, i) => {
        const cheio = limitar(p * 5 - i);
        return (
          <div key={i} style={{ position: "absolute", left: x + i * (larg + gap), top: y, width: larg, height: altura }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: altura / 2, border: `3px dashed ${cor.esboco}` }} />
            <div
              style={{
                position: "absolute",
                inset: -1,
                borderRadius: altura / 2,
                background: zz.cor,
                transformOrigin: "left center",
                scale: `${cheio} 1`,
                opacity: cheio > 0.001 ? 1 : 0,
              }}
            />
          </div>
        );
      })}
      {visivel > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: ponta - altura,
            top: y - altura / 2,
            width: altura * 2,
            height: altura * 2,
            borderRadius: 999,
            background: "#FFFFFF",
            border: `6px solid ${cor.caixa}`,
            boxShadow: `0 0 0 3px ${corPonta}`,
            opacity: visivel,
          }}
        />
      ) : null}
    </>
  );
};
