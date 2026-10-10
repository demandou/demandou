import { limitar, Palavras, preciso, prog, temposDoTexto, Traco } from "../anim";
import { Cota } from "../desenho/Cota";
import { circ, lin, poli } from "../desenho/geometria";
import { JANELA_CHEIA, type Regiao } from "../layout";
import type { Definicao as TDefinicao, Layout, Palavra } from "../plano";
import { cor, MARGEM, sans, traco } from "../tema";
import { encaixar, larguraTexto } from "../texto";
import { Folha } from "./Folha";

// Definição como um detalhe de prancha: o termo grande com uma cota em cima (que o "mede" quando é dito);
// no significado, uma linha de chamada em terracota desce do termo e o significado é passado a nanquim
// palavra por palavra. Antes disso, a chamada e as linhas do significado já estão a lápis.
export const Definicao: React.FC<{ m: TDefinicao; t: number; regiao: Regiao; layout: Layout; palavras: Palavra[] }> = ({ m, t, regiao, layout, palavras }) => (
  <Folha t={t} de={m.de} ate={m.ate} palavras={palavras} layout={layout} regiao={regiao}>
    {(corpo) => <Detalhe m={m} t={t} corpo={corpo} palavras={palavras} cheia={layout === "cheia"} />}
  </Folha>
);

const Detalhe: React.FC<{ m: TDefinicao; t: number; corpo: Regiao; palavras: Palavra[]; cheia: boolean }> = ({ m, t, corpo, palavras, cheia }) => {
  const recuo = 110;
  // o termo e o significado dividem a altura: termo até 2 linhas, significado até 3
  // prancha alta (cheia): termo e significado maiores
  const alta = corpo.h > 700;
  let maxTermo = alta ? 150 : 124;
  let maxSig = alta ? 80 : 66;
  let termo = encaixar(m.termo, { largura: corpo.w, max: maxTermo, min: 64, linhas: 2, fonte: { peso: 300, espacamento: -0.02 } });
  let sig = encaixar(m.significado, { largura: corpo.w - recuo, max: maxSig, min: 44, linhas: 3, fonte: { peso: 400 } });
  const altura = () => 70 + termo.linhas.length * termo.tamanho * 1.05 + 70 + sig.linhas.length * sig.tamanho * 1.15;
  while (altura() > corpo.h && (maxTermo > 64 || maxSig > 44)) {
    maxTermo = Math.max(64, maxTermo - 8);
    maxSig = Math.max(44, maxSig - 4);
    termo = encaixar(m.termo, { largura: corpo.w, max: maxTermo, min: 64, linhas: 2, fonte: { peso: 300, espacamento: -0.02 } });
    sig = encaixar(m.significado, { largura: corpo.w - recuo, max: maxSig, min: 44, linhas: 3, fonte: { peso: 400 } });
  }
  // na prancha cheia, o termo fica ao lado da janela da pessoa (como o título) e o significado embaixo dela
  const larguraTopo = JANELA_CHEIA.x - MARGEM - 40;
  if (cheia) {
    termo = encaixar(m.termo, { largura: larguraTopo, max: 132, min: 64, linhas: 2, fonte: { peso: 300, espacamento: -0.02 } });
    sig = encaixar(m.significado, { largura: corpo.w - recuo, max: 84, min: 44, linhas: 3, fonte: { peso: 400 } });
  }
  const alturaTermo = termo.linhas.length * termo.tamanho * 1.05;
  const y0 = cheia
    ? JANELA_CHEIA.y + Math.max(0, (JANELA_CHEIA.h - 70 - alturaTermo) / 2)
    : corpo.y + Math.max(0, (corpo.h - altura()) * 0.4);
  const larguraTermo = Math.min(cheia ? larguraTopo : corpo.w, Math.max(...termo.linhas.map((l) => larguraTexto(l, termo.tamanho, { peso: 300, espacamento: -0.02 }))));
  const yCota = y0 + 30;
  const yTermo = y0 + 70;
  const fimTermo = yTermo + alturaTermo;
  const alturaSig = sig.linhas.length * sig.tamanho * 1.15;
  const ySig = cheia ? Math.max(fimTermo + 90, corpo.y + (corpo.h - alturaSig) * 0.3) : fimTermo + 70;
  // o termo entra a lápis com a folha e é passado a nanquim quando é dito
  const temposTermo = temposDoTexto(m.termo, palavras, m.em - 0.3, m.ate, m.em);
  const pCota = prog(t, m.em + 0.1, 0.8, preciso);
  const pChamada = prog(t, m.significadoEm - 0.15, 0.55, preciso);
  const pLapis = prog(t, m.de - 0.2, 0.25);
  const xCh = corpo.x + 34;
  const yChA = fimTermo + 14;
  const yChB = ySig + sig.tamanho * 0.55;
  const tempos = temposDoTexto(m.significado, palavras, m.significadoEm - 0.3, m.ate, m.significadoEm);
  const chamada = poli([
    [xCh, yChA],
    [xCh, yChB],
    [corpo.x + recuo - 24, yChB],
  ]);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* a lápis: a chamada e as linhas onde o significado vai ser escrito */}
        <path d={chamada} fill="none" stroke={cor.cinzaClaro} strokeWidth={traco.fino} strokeDasharray="6 8" opacity={pLapis * (1 - pChamada)} />
        {sig.linhas.map((_, k) => (
          <path
            key={k}
            d={lin(corpo.x + recuo, ySig + (k + 1) * sig.tamanho * 1.15 - 4, corpo.x + recuo + (corpo.w - recuo) * (k === sig.linhas.length - 1 ? 0.55 : 0.9), ySig + (k + 1) * sig.tamanho * 1.15 - 4)}
            stroke={cor.cinzaClaro}
            strokeWidth={traco.fino}
            strokeDasharray="6 8"
            opacity={pLapis * (1 - prog(t, m.significadoEm, 0.4))}
          />
        ))}
        <Cota x1={corpo.x} y1={yCota} x2={corpo.x + larguraTermo} y2={yCota} p={pCota} cor={cor.acento} />
        {pChamada > 0 ? <circle cx={xCh} cy={yChA} r={8} fill={cor.acento} opacity={limitar(pChamada * 3)} /> : null}
        <Traco d={chamada} p={pChamada} cor={cor.acento} largura={traco.medio} />
        <Traco d={circ(xCh, yChA, 15)} p={pChamada} cor={cor.acento} largura={traco.fino} />
      </svg>
      <div style={{ position: "absolute", left: corpo.x, top: yTermo, width: cheia ? larguraTopo : corpo.w }}>
        <Palavras
          texto={m.termo}
          tempos={temposTermo}
          t={t}
          rascunho={{ de: m.de - 0.2, corLapis: cor.rascunho, corTinta: cor.grafite }}
          style={{ width: cheia ? larguraTopo : corpo.w, fontFamily: sans, fontWeight: 300, fontSize: termo.tamanho, lineHeight: 1.05, letterSpacing: "-0.02em" }}
        />
      </div>
      <div style={{ position: "absolute", left: corpo.x + recuo, top: ySig, width: corpo.w - recuo }}>
        <Palavras texto={m.significado} tempos={tempos} t={t} style={{ fontFamily: sans, fontWeight: 400, fontSize: sig.tamanho, lineHeight: 1.15, color: cor.grafite }} />
      </div>
    </>
  );
};
