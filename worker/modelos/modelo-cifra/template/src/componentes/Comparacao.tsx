// Bloco universal `comparacao`: dois lados, cada um com as suas seis cordas. Cada lado nasce a lápis e
// ganha tinta quando é dito, e as cordas dele soam. No veredito, o lado que vale (vencedor, certo) ganha
// o ○ azul (corda que soa) e continua soando, com a corda do meio azul; o outro ganha o × do diagrama
// (corda que não toca) e as cordas abafam. Entre os dois, a barra dupla de compasso (contra) ou a seta
// de troca descendo (antes → depois, errado → certo).
import { prog, temposDasPalavras } from "../anim";
import { caber, type Encaixe } from "../medida";
import type { Comparacao as TComparacao, Palavra } from "../plano";
import { cor, rotulo } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";
import { Marca, SeisCordas } from "./Cordas";

const MARCA = 60;
const CORDAS = 132;

export const Comparacao: React.FC<{ m: TComparacao; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const modo = m.modo ?? "contra";
  const [a, b] = m.lados;
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const veredito = m.vencedorEm ?? (vencedor !== undefined ? m.lados[vencedor].em + 0.45 : Infinity);
  const encTitulo = m.titulo ? caber(m.titulo, { largura: area.w, max: 72, min: 46, linhas: 2 }) : null;
  const tTitulo = m.titulo ? temposDasPalavras(m.titulo, palavras, m.de, a.em + 0.1, m.de).tempos : [];
  const alturaTitulo = encTitulo ? encTitulo.linhas.length * encTitulo.tamanho * 1.08 + 26 : 0;
  const SINAL = 80;
  const linhaH = Math.min(320, (area.h - alturaTitulo - SINAL) / 2);
  const larguraTexto = area.w - MARCA - 24;
  // rótulos (caixa-alta) e textos: um corpo só para os dois lados (o maior em que os dois cabem)
  const tamRotulo = Math.min(
    ...m.lados.map((l) => caber(l.rotulo, { largura: larguraTexto, max: 36, min: 30, linhas: 1, estilo: { peso: 700, espacamento: 0.14, caixaAlta: true } }).tamanho),
  );
  const livre = linhaH - (tamRotulo + 22) - CORDAS - 30;
  let encs: Encaixe[] = [];
  for (let tam = 96; tam >= 40; tam -= 2) {
    encs = m.lados.map((l) => caber(l.texto, { largura: larguraTexto, max: tam, min: tam, linhas: 2 }));
    if (encs.every((e) => e.tamanho === tam && e.linhas.length * tam * 1.08 <= livre)) break;
  }
  const alturaLado = (e: Encaixe) => tamRotulo + 22 + e.linhas.length * e.tamanho * 1.08 + 22 + CORDAS;
  const alturas = encs.map(alturaLado);
  const bloco = alturaTitulo + alturas[0] + SINAL + alturas[1];
  const topo = Math.max(0, (area.h - bloco) / 2);
  const pSinal = prog(t, b.em - 0.35, 0.4);

  const lado = (i: 0 | 1) => {
    const l = m.lados[i];
    const enc = encs[i];
    const proximo = i === 0 ? b.em : fim;
    const { tempos } = temposDasPalavras(l.texto, palavras, l.em - 0.15, proximo + 0.1, l.em);
    const dito = prog(t, l.em - 0.04, 0.3);
    const pVeredito = prog(t, veredito, 0.3);
    const ganha = vencedor === i;
    const perde = vencedor !== undefined && !ganha;
    const y = topo + alturaTitulo + (i === 0 ? 0 : alturas[0] + SINAL);
    const corTexto = ganha && pVeredito > 0.5 ? cor.azul : perde && pVeredito > 0.5 ? cor.marfimSuave : cor.marfim;
    return (
      <div key={i} style={{ position: "absolute", left: 0, top: y, width: area.w, height: alturas[i] }}>
        <div style={{ position: "absolute", inset: "-14px -24px", borderRadius: 26, background: cor.azulFundo, opacity: ganha ? pVeredito : 0 }} />
        <div style={{ position: "absolute", left: 0, top: (tamRotulo - MARCA) / 2 }}>
          {vencedor !== undefined ? <Marca tipo={ganha ? "soa" : "abafa"} p={pVeredito} /> : null}
        </div>
        <div
          style={{
            ...rotulo,
            position: "absolute",
            left: MARCA + 24,
            top: 0,
            fontSize: tamRotulo,
            whiteSpace: "nowrap",
            color: dito <= 0 ? cor.lapisForte : ganha && pVeredito > 0.5 ? cor.azul : cor.marfimSuave,
          }}
        >
          {l.rotulo}
        </div>
        <div style={{ position: "absolute", left: MARCA + 24, top: tamRotulo + 22, width: larguraTexto }}>
          <TextoFalado enc={enc} tempos={tempos} t={t} cor={corTexto} peso={800} />
        </div>
        <div style={{ position: "absolute", left: 0, bottom: 0 }}>
          <SeisCordas
            w={area.w}
            h={CORDAS}
            t={t}
            em={ganha && t >= veredito ? veredito : l.em}
            tintaEm={l.em - 0.25}
            abafaEm={perde ? veredito : undefined}
            decai={ganha && t >= veredito ? 0.8 : 0.35}
            azul={ganha && t >= veredito}
          />
        </div>
      </div>
    );
  };

  const ySinal = topo + alturaTitulo + alturas[0];
  const x = area.w / 2;
  return (
    <>
      {encTitulo ? (
        <div style={{ position: "absolute", left: 0, top: topo, width: area.w }}>
          <TextoFalado enc={encTitulo} tempos={tTitulo} t={t} cor={cor.marfim} peso={800} alinhamento="center" />
        </div>
      ) : null}
      {lado(0)}
      {lado(1)}
      <svg width={area.w} height={SINAL} style={{ position: "absolute", left: 0, top: ySinal, overflow: "visible" }}>
        {modo === "contra" ? (
          // barra dupla de compasso: dois lados separados
          <g stroke={pSinal > 0 ? cor.marfim : cor.lapisForte} strokeLinecap="round">
            <line x1={x - 8} y1={SINAL / 2 - 22 * Math.max(0.3, pSinal)} x2={x - 8} y2={SINAL / 2 + 22 * Math.max(0.3, pSinal)} strokeWidth={4} />
            <line x1={x + 8} y1={SINAL / 2 - 22 * Math.max(0.3, pSinal)} x2={x + 8} y2={SINAL / 2 + 22 * Math.max(0.3, pSinal)} strokeWidth={9} />
          </g>
        ) : (
          (() => {
            // a seta de troca, descendo do primeiro lado para o segundo
            const dTraco = `M ${x - 40} 8 Q ${x + 70} ${SINAL / 2} ${x - 4} ${SINAL - 10}`;
            const comprimento = 150;
            return (
              <g>
                <path d={dTraco} fill="none" stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="6 9" opacity={1 - pSinal} />
                <path d={dTraco} fill="none" stroke={cor.marfim} strokeWidth={5} strokeLinecap="round" strokeDasharray={comprimento} strokeDashoffset={comprimento * (1 - pSinal)} />
                <path
                  d={`M ${x - 22} ${SINAL - 22} L ${x - 4} ${SINAL - 10} L ${x + 4} ${SINAL - 30}`}
                  fill="none"
                  stroke={cor.marfim}
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={prog(t, b.em - 0.05, 0.12)}
                />
              </g>
            );
          })()
        )}
      </svg>
    </>
  );
};
