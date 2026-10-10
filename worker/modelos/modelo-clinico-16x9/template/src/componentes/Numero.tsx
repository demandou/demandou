import { Easing } from "remotion";
import { limitar, prog, saindo, temposDoTexto } from "../anim";
import type { Areas } from "../layout";
import { encaixar, larguraTexto, numeroBR } from "../medida";
import type { Caixa } from "../motor/caixa";
import type { Numero as NumeroT, Palavra } from "../plano";
import { cor, LEGENDA_Y, QUADRO, sans, TOPO_UTIL } from "../tema";
import { arco, Graduacao, Ilustrativo, naVolta } from "./Dial";
import { TextoFalado } from "./Texto";

// o bloco do número não desce até a legenda
const BASE_DO_BLOCO = LEGENDA_Y - 24;

// Número dito, lido no instrumento: a lupa vai para o mostrador, que se monta em volta dela, e o
// anel enche enquanto o número conta (porcentagem enche até o valor; o resto dá a volta inteira).
// No quadro deitado, o mostrador fica na moldura da direita e o número grande fica no quadro da
// esquerda, na altura do mostrador, com o rótulo logo embaixo, na palavra dele.
export const Numero: React.FC<{ m: NumeroT; t: number; fim: number; areas: Areas; palavras: Palavra[]; caixa: Caixa }> = ({
  m,
  t,
  fim,
  areas,
  palavras,
  caixa,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  const R = caixa.w / 2 + 62;
  const monta = prog(t, m.de, 0.6);

  // a contagem: começa na palavra do número e assenta com freio
  const inicioConta = Math.max(m.em, m.de + 0.1);
  const conta = prog(t, inicioConta, 1.1, Easing.bezier(0.2, 0.7, 0.3, 1));
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const valorAgora = m.valor * conta;
  const texto = numeroBR(conta >= 1 ? m.valor : valorAgora, casas);
  const textoFinal = numeroBR(m.valor, casas);
  const porcento = (m.sufixo ?? "").includes("%") && m.valor > 0 && m.valor <= 100;
  const encher = (porcento ? m.valor / 100 : 1) * conta;

  // tamanho do número: prefixo e sufixo menores, ao lado; tudo cabe na largura do cabeçalho
  const cab = areas.cabecalho;
  const larguraTotal = (s: number) =>
    larguraTexto(textoFinal, s, 800, -0.02) + (m.prefixo ? larguraTexto(m.prefixo, s * 0.42, 700) + s * 0.08 : 0) + (m.sufixo ? larguraTexto(m.sufixo, s * 0.42, 700) + s * 0.08 : 0);
  let tam = 190;
  while (tam > 96 && larguraTotal(tam) > cab.w) tam -= 4;

  // rótulo: palavra por palavra, logo embaixo do número
  const rotuloEm = m.rotuloEm ?? m.de;
  const rot = encaixar(m.rotulo, { largura: cab.w, max: 60, min: 44, linhas: 2, peso: 700 });
  const temposRot = temposDoTexto(m.rotulo, palavras, rotuloEm, m.ate, Math.max(m.de + 0.1, rotuloEm), rotuloEm - 0.3);
  // o bloco (número, rótulo e a etiqueta "ilustrativo") centrado na altura do mostrador
  const alturaRotulo = rot.linhas.length * rot.tamanho * 1.06;
  const alturaBloco = tam + 36 + alturaRotulo + (m.ilustrativo ? 28 + 50 : 0);
  const yNumero = Math.round(Math.max(TOPO_UTIL, Math.min(BASE_DO_BLOCO - alturaBloco, cy - alturaBloco / 2)));
  const yRotulo = yNumero + tam + 36;

  const ponta = naVolta(cx, cy, R, Math.min(encher, 0.9999));
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: cab.x,
          top: yNumero,
          width: cab.w,
          height: tam,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: tam * 0.08,
          fontFamily: sans,
          color: cor.tinta,
          opacity: (1 - sai) * prog(t, inicioConta - 0.1, 0.25),
          translate: `0 ${(1 - prog(t, inicioConta - 0.1, 0.4)) * 30}px`,
        }}
      >
        {m.prefixo ? <span style={{ fontWeight: 700, fontSize: tam * 0.42, color: cor.azul, alignSelf: "flex-start", marginTop: tam * 0.32 }}>{m.prefixo}</span> : null}
        <span style={{ fontWeight: 800, fontSize: tam, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{texto}</span>
        {m.sufixo ? <span style={{ fontWeight: 700, fontSize: tam * 0.42, color: cor.azul, alignSelf: "flex-start", marginTop: tam * 0.32 }}>{m.sufixo}</span> : null}
      </div>
      <div style={{ position: "absolute", left: cab.x, top: yRotulo, width: cab.w, opacity: 1 - sai }}>
        <TextoFalado linhas={rot.linhas} tamanho={rot.tamanho} peso={700} tempos={temposRot} t={t} alinhar="centro" espacamento={-0.01} lapis />
      </div>
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        <Graduacao cx={cx} cy={cy} R={R} monta={monta} />
        {encher > 0.002 ? (
          <>
            <path d={arco(cx, cy, R, 0, encher)} fill="none" stroke={cor.azul} strokeWidth={18} strokeLinecap="round" />
            <circle cx={ponta.x} cy={ponta.y} r={17} fill={cor.branco} stroke={cor.azul} strokeWidth={6} />
          </>
        ) : null}
        {/* marca do topo (onde a contagem começa) */}
        <line x1={cx} y1={cy - R - 22} x2={cx} y2={cy - R + 22} stroke={cor.azul} strokeWidth={6} strokeLinecap="round" opacity={limitar(monta * 1.5)} />
      </svg>
      {m.ilustrativo ? <Ilustrativo x={cab.x + cab.w / 2} y={yRotulo + alturaRotulo + 28} p={limitar(monta * 1.5) * (1 - sai)} alinhar="centro" /> : null}
    </>
  );
};
