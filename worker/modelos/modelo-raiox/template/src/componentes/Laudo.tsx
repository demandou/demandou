// Laudo e frase: chapa-cartão na altura do peito com uma frase que merece ficar. O laudo leva a
// etiqueta no alto em marcação de filme ("LAUDO", "REGRA"); a frase vai sem etiqueta. O texto se
// revela palavra por palavra; o `destaque` fica em ciano e o `risco` é riscado em vermelho quando
// é dito.
import { indicesDoTrecho, Linhas, prog, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Frase, Laudo as TLaudo, Palavra } from "../plano";
import { cor, marcacao, titulo as estiloTitulo } from "../tema";
import { Cartao, CARTAO } from "./Cartao";
import { topoDoCartao } from "./Cartoes";

export const Laudo: React.FC<{ m: TLaudo | Frase; t: number; topo: number; fim: number; palavras: Palavra[] }> = ({ m, t, topo, fim, palavras }) => {
  const largura = 900 - CARTAO.x - CARTAO.padding;
  const rotulo = m.tipo === "laudo" ? (m.rotulo ?? "Laudo") : null;
  const d = diagramar(m.texto, largura, m.tipo === "frase" ? 88 : 84, 64, 4, "sans700");
  const etiqueta = rotulo ? 54 : 0;
  const altura = Math.round(CARTAO.padding * 2 + etiqueta + d.linhas.length * d.tamanho * 1.04 + 10);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio - (m.em !== undefined ? 0.3 : 0), fim, inicio + (m.em !== undefined ? -0.05 : 0.05));
  const ciano = indicesDoTrecho(m.texto, m.destaque);
  const riscados = m.tipo === "frase" ? indicesDoTrecho(m.texto, m.risco) : new Set<number>();
  const primeiroRiscado = Math.min(...[...riscados]);
  const riscoEm = m.tipo === "frase" && riscados.size ? (m.riscoEm ?? (tempos[[...riscados][riscados.size - 1]] ?? inicio) + 0.25) : 0;
  const ordem = [...riscados].sort((a, b) => a - b);
  // o risco corre palavra por palavra, da primeira à última do trecho
  const riscoDe = (i: number) => {
    if (!riscados.has(i)) return 0;
    const k = ordem.indexOf(i);
    return prog(t, riscoEm + k * 0.12, 0.2);
  };
  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      <div style={{ position: "absolute", left: CARTAO.padding, top: CARTAO.padding, width: largura }}>
        {rotulo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: cor.ciano }} />
            <div style={{ ...marcacao, fontSize: 32, color: cor.ciano }}>{rotulo}</div>
          </div>
        ) : null}
        <Linhas
          linhas={d.linhas}
          tempos={tempos}
          t={t}
          style={{ ...estiloTitulo, fontSize: d.tamanho, marginTop: rotulo ? 22 : 0 }}
          corDe={(i) => (ciano.has(i) ? cor.ciano : undefined)}
          riscoDe={riscados.size && Number.isFinite(primeiroRiscado) ? riscoDe : undefined}
        />
      </div>
    </Cartao>
  );
};
