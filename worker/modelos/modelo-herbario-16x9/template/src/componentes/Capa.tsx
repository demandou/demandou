import { Escrita, limitar, prog, temposDoTexto, Traco } from "../anim";
import { Fita, ramoPrensado, Ramo } from "../desenhos/Ramo";
import { Vaso } from "../desenhos/Vaso";
import { encaixar, encaixarLinhas } from "../medida";
import type { Abertura, Capa as CapaT, Palavra, Plano } from "../plano";
import { cor, corpo, corpoQueCabe, serif, traco, versalete } from "../tema";
import { romano } from "./Cabecalho";

// O espécime do frontispício: a mesma planta das figuras, pequena, no pé da página (de 1500 a 1875 px)
const ESPECIME = { x: 540, y: 1703, s: 0.41 };

// O raminho prensado do pé do frontispício da `abertura`, deitado na diagonal e preso por duas fitas
const RaminhoDoPe: React.FC<{ tinta: number; lapis: number }> = ({ tinta, lapis }) => {
  const r = ramoPrensado(0, 0, 470, 7, (i) => limitar(tinta * 1.8 - i * 0.12), { curva: 40, tamanho: 0.76 });
  return (
    <g transform="translate(300 1800) rotate(66)">
      <Ramo caule={r.caule} pCaule={limitar(tinta * 1.5)} folhas={r.folhas} lapis={lapis} largura={traco.medio} />
      <Fita x={8} y={-100} ang={10} p={limitar(tinta * 2 - 1)} w={92} />
      <Fita x={26} y={-350} ang={-14} p={limitar(tinta * 2 - 1.2)} w={92} />
    </g>
  );
};

// Frontispício: a pessoa no oval grande (desenhado fora daqui), a assinatura logo abaixo,
// o título que se escreve na fala, os medalhões do índice e, no pé, o espécime a lápis,
// que ganha tinta e aquarela na última palavra do título (ou em `ramoEm`).
// `capa` (o formato antigo): linhas dadas e o vaso no pé. `abertura`: uma frase que se quebra sozinha
// em até 3 linhas (o corpo encolhe até caber) e o raminho prensado no pé.
export const Capa: React.FC<{ m: CapaT | Abertura; t: number; palavras: Palavra[]; marca: Plano["marca"]; indice: number }> = ({ m, t, palavras, marca, indice }) => {
  const abertura = m.tipo === "abertura";
  const encaixe = abertura
    ? encaixar(m.texto, { largura: 930, max: corpo.tituloCapa, min: 76, linhas: 3, fonte: "serif" })
    : encaixarLinhas(m.linhas, { largura: 930, max: corpoQueCabe(m.linhas, 930, corpo.tituloCapa, 84), min: 72, fonte: "serif" });
  const linhas = encaixe.linhas;
  const tamanho = encaixe.tamanho;
  const inicio = abertura ? (m.em ?? m.de) : m.de;
  const tempos = temposDoTexto(linhas.join(" "), palavras, inicio, m.ate, inicio);
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const fimTitulo = tempos[tempos.length - 1] ?? m.de;
  const especimeEm = (abertura ? undefined : m.ramoEm) ?? fimTitulo;
  const tinta = prog(t, especimeEm - 0.05, 0.75, (x) => x);
  const aguada = prog(t, especimeEm + 0.35, 0.6);
  const yTitulo = 1000;
  const alturaTitulo = linhas.length * tamanho * 1.02;
  const yBase = yTitulo + alturaTitulo + 18;
  return (
    <>
      {assinatura ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 948, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
          <div style={{ width: 70, height: 2, background: cor.musgo, opacity: 0.7 }} />
          <div style={{ fontFamily: versalete, fontWeight: 700, fontSize: 34, letterSpacing: "0.12em", textTransform: "uppercase", color: cor.musgo }}>
            {assinatura}
          </div>
          <div style={{ width: 70, height: 2, background: cor.musgo, opacity: 0.7 }} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 75, width: 930, top: yTitulo }}>
        <Escrita linhas={linhas} tempos={tempos} t={t} tamanho={tamanho} familia={serif} peso={700} destaque={m.destaque} alinhar="center" entrelinha={1.02} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {Array.from({ length: indice }, (_, i) => {
          const cx = 540 + (i - (indice - 1) / 2) * 150;
          const cy = yBase + 40;
          const p = prog(t, tempos[0] + 0.05 + i * 0.16, 0.45);
          return (
            <g key={i}>
              {i > 0 ? (
                <Traco d={`M ${cx - 150 + 44} ${cy} L ${cx - 44} ${cy}`} p={limitar(p * 1.4)} cor={cor.tinta} largura={traco.fino} tracejado="2 9" />
              ) : null}
              <circle cx={cx} cy={cy} r={38} fill="none" stroke={cor.grafite} strokeWidth={2} opacity={1 - p} />
              <Traco d={`M ${cx} ${cy - 38} A 38 38 0 1 1 ${cx - 0.1} ${cy - 38}`} p={p} cor={cor.musgo} largura={traco.medio} />
              <text
                x={cx}
                y={cy + 12}
                textAnchor="middle"
                fontFamily={versalete}
                style={{ fontFeatureSettings: '"lnum" 1' }}
                fontWeight={700}
                fontSize={34}
                fill={p > 0.4 ? cor.musgo : cor.grafite}
              >
                {romano(i + 1)}
              </text>
            </g>
          );
        })}
        {abertura ? (
          <RaminhoDoPe tinta={tinta} lapis={1} />
        ) : (
          <g transform={`translate(${ESPECIME.x} ${ESPECIME.y}) scale(${ESPECIME.s})`}>
            <Vaso
              lapis={1}
              tinta={tinta}
              aguada={aguada}
              agua={0}
              podre={0}
              murcho={0}
              palido={0}
              broto={0}
              semFuro={0}
              furo={0}
              escorre={0}
              tomTerra={0}
              t={t}
              escala={ESPECIME.s}
              id="capa"
            />
          </g>
        )}
      </svg>
    </>
  );
};
