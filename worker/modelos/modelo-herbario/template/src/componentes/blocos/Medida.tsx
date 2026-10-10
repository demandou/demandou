// `numero`: o número como a medida de um espécime. O rótulo é o título da prancha; no corpo, um
// raminho cresce ao lado de uma cota vertical (setas nas pontas, marcas a cada tanto) enquanto o
// número conta até o valor, em algarismos grandes, no formato brasileiro. Antes de ser dito, o
// número é um "0" a lápis e o raminho é só o esboço.
import { romano } from "../Cabecalho";
import { corre, limitar, prog, Traco } from "../../anim";
import { ramoPrensado, Ramo } from "../../desenhos/Ramo";
import { encaixar, formatarNumero, larguraTexto } from "../../medida";
import type { Numero } from "../../plano";
import { cor, serif, traco } from "../../tema";
import { CabecalhoDoBloco, type PropsDoBloco } from "../Bloco";
import { Ilustrativo } from "../Pecas";

const BASE = 1470;
const RAMO_X = 190;
const COTA_X = 340;
const NUM_X = 400;
const NUM_W = 1010 - NUM_X;
const CENTRO_Y = 1110;

export const Medida: React.FC<PropsDoBloco & { m: Numero }> = ({ m, t, palavras, chegada, layout, numeroFig }) => {
  // a contagem termina com folga antes de a prancha sair (o número final fica legível)
  const duracaoConta = Math.min(1.5, Math.max(0.6, m.ate - m.em - 0.6));
  const conta = prog(t, m.em, duracaoConta, corre);
  const atual = m.valor * conta;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : undefined);
  const final = formatarNumero(m.valor, casas);
  const mostrado = formatarNumero(conta >= 0.999 ? m.valor : Number.isInteger(m.valor) || casas === 0 ? Math.round(atual) : atual, casas);
  const sufixo = m.sufixo?.trim();
  // sufixo curto ("%", "mil", "kg") fica ao lado do número; longo vai embaixo, em itálico
  const sufixoAoLado = !!sufixo && [...sufixo].length <= 4;
  // o maior corpo em que o número final (com o sufixo ao lado) cabe na largura
  let tamanho = 270;
  const larguraNumero = (tam: number) =>
    larguraTexto(final, tam, "serif800", { espaco: 0 }) + (sufixoAoLado ? larguraTexto(sufixo!, tam * 0.42, "serif", { espaco: 0.2 }) + tam * 0.08 : 0);
  while (tamanho > 110 && larguraNumero(tamanho) > NUM_W) tamanho -= 4;
  const prefixo = m.prefixo?.trim();
  const tamPrefixo = Math.max(46, Math.round(tamanho * 0.34));
  const sufixoAbaixo = sufixo && !sufixoAoLado ? encaixar(sufixo, { largura: NUM_W, max: 52, min: 40, linhas: 2, fonte: "italico" }) : null;
  const tinta = prog(t, m.em - 0.1, 0.35);

  // o raminho cresce com a contagem; a cota acompanha a ponta
  const lapis = 1;
  const alturaFinal = 720;
  const altura = 160 + (alturaFinal - 160) * conta;
  const ramo = ramoPrensado(RAMO_X, BASE, altura, 6, (i) => limitar(conta * 7 - i * 0.9 - 0.4), { curva: 46, tamanho: 0.95 });
  const esboco = ramoPrensado(RAMO_X, BASE, alturaFinal, 6, () => 0, { curva: 46, tamanho: 0.95 });
  const topo = BASE - altura;
  const cota = prog(t, m.em - 0.05, 0.4);
  const marcas = Array.from({ length: Math.floor(altura / 70) }, (_, i) => BASE - 35 - i * 70);

  const blocoNumero = tamanho * 1.0 + (prefixo ? tamPrefixo * 1.1 : 0) + (sufixoAbaixo ? 12 + sufixoAbaixo.linhas.length * sufixoAbaixo.tamanho * 1.1 : 0) + (m.ilustrativo ? 70 : 0);
  const topoNumero = CENTRO_Y - blocoNumero / 2;

  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* esboço a lápis do espécime inteiro, antes de ser medido */}
        {conta < 0.999 ? (
          <g opacity={lapis * (1 - conta)}>
            <Ramo caule={esboco.caule} pCaule={0} folhas={esboco.folhas} lapis={1} />
          </g>
        ) : null}
        {conta > 0.001 ? <Ramo caule={ramo.caule} pCaule={1} folhas={ramo.folhas} lapis={0} /> : null}
        {/* chão do espécime */}
        <Traco d={`M ${RAMO_X - 90} ${BASE + 2} L ${COTA_X + 20} ${BASE + 2}`} p={Math.max(lapis * 0.999, 0.001)} cor={tinta > 0 ? cor.tinta : cor.grafite} largura={traco.fino} />
        {/* a cota vertical com setas, do chão até a ponta do raminho */}
        <line x1={COTA_X} y1={BASE} x2={COTA_X} y2={BASE - alturaFinal} stroke={cor.grafiteClaro} strokeWidth={traco.fino} strokeDasharray="4 8" opacity={lapis * (1 - cota)} />
        {cota > 0.01 ? (
          <g opacity={cota}>
            <line x1={COTA_X} y1={BASE - 4} x2={COTA_X} y2={topo + 4} stroke={cor.tinta} strokeWidth={traco.fino} />
            <path d={`M ${COTA_X - 11} ${BASE - 16} L ${COTA_X} ${BASE - 2} L ${COTA_X + 11} ${BASE - 16}`} fill="none" stroke={cor.tinta} strokeWidth={traco.fino} strokeLinecap="round" />
            <path d={`M ${COTA_X - 11} ${topo + 16} L ${COTA_X} ${topo + 2} L ${COTA_X + 11} ${topo + 16}`} fill="none" stroke={cor.tinta} strokeWidth={traco.fino} strokeLinecap="round" />
            <line x1={COTA_X - 22} y1={topo} x2={COTA_X + 22} y2={topo} stroke={cor.tinta} strokeWidth={traco.fino} />
            {marcas.map((y, i) => (
              <line key={i} x1={COTA_X - 8} y1={y} x2={COTA_X + 8} y2={y} stroke={cor.tinta} strokeWidth={traco.cabelo} opacity={0.8} />
            ))}
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: NUM_X, top: topoNumero, width: NUM_W, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {prefixo ? (
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: tamPrefixo, lineHeight: 1.1, color: tinta > 0.5 ? cor.musgo : cor.grafite }}>{prefixo}</div>
        ) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: tamanho * 0.08, fontFamily: serif, lineHeight: 1 }}>
          <span style={{ fontWeight: 800, fontSize: tamanho, color: tinta > 0.5 ? cor.tinta : cor.grafite, letterSpacing: "-0.01em" }}>{tinta > 0.02 ? mostrado : "0"}</span>
          {sufixoAoLado ? <span style={{ fontWeight: 700, fontSize: tamanho * 0.42, color: tinta > 0.5 ? cor.musgo : cor.grafite }}>{sufixo}</span> : null}
        </div>
        {sufixoAbaixo ? (
          <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: sufixoAbaixo.tamanho, lineHeight: 1.1, marginTop: 12, color: tinta > 0.5 ? cor.musgo : cor.grafite }}>
            {sufixoAbaixo.linhas.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        ) : null}
      </div>
      {m.ilustrativo ? <Ilustrativo x={NUM_X} y={topoNumero + blocoNumero - 54} p={prog(t, m.em + 0.6, 0.4)} /> : null}
      <CabecalhoDoBloco
        t={t}
        palavras={palavras}
        chegada={chegada}
        layout={layout}
        numeroFig={numeroFig}
        de={m.de}
        ate={m.ate}
        rotulo={`Fig. ${romano(numeroFig)}`}
        titulo={m.rotulo}
        tituloEm={m.rotuloEm}
      />
    </>
  );
};
