// Pergunta: a etiqueta deitada no peito com o selo "?" de latão; a pergunta se monta palavra por
// palavra. As opções são etiquetas menores penduradas embaixo por cordões: nascem a lápis e, na palavra
// de cada uma, caem no cordão e balançam; a da vez fica verde, as anteriores voltam ao papel.
// No quadro deitado a faixa do peito é baixa: as opções ficam numa FILEIRA só embaixo da pergunta
// (lado a lado); sem largura (lado livre do rosto), voltam à coluna ou à grade do vertical.
import { useMemo } from "react";
import { balanco, Linhas, prog, saida, temposDoTexto } from "../anim";
import { type Encaixe, encaixar, SERIFA_TITULO } from "../medida";
import type { Palavra, Pergunta as TipoPergunta } from "../plano";
import { cor, grotesca, H, LARGURA_PEITO, MARGEM, titulo, W } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";
import { Carimbo, Cordao } from "./Pecas";
import { BASE_DO_PEITO } from "./Placa";

export const EtiquetaDePergunta: React.FC<{ m: TipoPergunta; palavras: Palavra[]; t: number; topo: number; fim: number; centro?: number; largura?: number; entradaMin?: number }> = ({
  m,
  palavras,
  t,
  topo,
  fim,
  centro = W / 2,
  largura = LARGURA_PEITO,
  entradaMin = -1,
}) => {
  const SELO = 76;
  const xTexto = 92 + SELO + 22;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  const VAO = 22;
  const disponivel = BASE_DO_PEITO - (topo + 16);
  const inicio = m.em ?? m.de;
  // as opções em uma coluna (2 opções, etiquetas largas) ou em grade; fica a primeira que cabe
  const medidas = useMemo(() => {
    // larga (o peito do quadro deitado): todas as opções numa fileira; estreita: como no vertical
    const tentativas = n === 0 ? [1] : largura >= 1000 ? [n, ...(n === 4 ? [2] : [])] : n <= 2 ? [1, n] : n === 3 ? [1, 3] : [2];
    let ultimo = null as null | { p: Encaixe; ops: Encaixe[]; aP: number; aO: number; tamO: number; colunas: number; larguraOp: number; filas: number };
    for (const colunas of tentativas) {
      const filas = n === 0 ? 0 : Math.ceil(n / colunas);
      const larguraOp = n ? (largura - VAO * (colunas - 1)) / colunas : 0;
      let maxP = 74;
      let maxO = 50;
      for (;;) {
        const p = encaixar(m.texto, { largura: largura - xTexto - 40, max: maxP, min: Math.min(50, maxP), linhas: 3, fonte: SERIFA_TITULO });
        const ops0 = opcoes.map((o) => encaixar(o.texto, { largura: larguraOp - 70 - 24, max: maxO, min: Math.min(32, maxO), linhas: 2, fonte: { nome: "g700" } }));
        const tamO = ops0.length ? Math.min(...ops0.map((o) => o.tamanho)) : maxO;
        const ops = opcoes.map((o) => encaixar(o.texto, { largura: larguraOp - 70 - 24, max: tamO, min: Math.min(30, tamO), linhas: 2, fonte: { nome: "g700" } }));
        const linhasO = Math.max(1, ...ops.map((o) => o.linhas.length));
        const aP = Math.max(SELO + 40, 56 + p.linhas.length * p.tamanho * 1.06);
        const aO = 34 + linhasO * tamO * 1.12;
        const total = aP + (filas ? 30 + filas * aO + (filas - 1) * 14 : 0);
        ultimo = { p, ops, aP, aO, tamO, colunas, larguraOp, filas };
        if (total <= disponivel) return ultimo;
        if (p.tamanho <= 50 && tamO <= 38) break;
        maxP = Math.max(50, p.tamanho - 4);
        maxO = Math.max(38, tamO - 2);
      }
    }
    return ultimo as NonNullable<typeof ultimo>;
  }, [m.texto, opcoes, n, disponivel, xTexto, largura]);
  const { colunas, larguraOp } = medidas;
  const { p, ops, aP, aO, tamO } = medidas;
  const tempos = useMemo(() => temposDoTexto(m.texto, palavras, inicio - 0.1, opcoes[0]?.em ?? m.ate, inicio - 0.02), [m.texto, palavras, inicio, opcoes, m.ate]);
  // quando o momento anterior também é arte no peito, esta só entra depois que aquela saiu (sem dupla exposição)
  const entrada = Math.max(entradaMin, Math.min(m.de - 0.05, inicio - 0.3));
  const pEntra = prog(t, entrada, 0.45);
  const s = saida(t, fim, 0.3);
  if (t < entrada - 0.01 || s >= 1) return null;
  const x = Math.min(W - largura - MARGEM, Math.max(MARGEM, centro - largura / 2));
  const selo = prog(t, inicio - 0.05, 0.4);
  const ems = opcoes.map((o) => o.em);

  return (
    <div style={{ position: "absolute", left: x, top: topo + 16, width: largura, opacity: Math.min(1, pEntra * 1.5), translate: `0 ${(1 - pEntra) * 80 + s * (H - topo + 40)}px` }}>
      <div style={{ position: "relative", width: largura, height: aP, rotate: `${(1 - pEntra) * -3 + balanco(t, entrada + 0.2, 1, 0.8, 0.35)}deg`, transformOrigin: `40px ${aP / 2}px` }}>
        <FundoEtiqueta w={largura} h={aP} deitada />
        <div style={{ position: "absolute", left: 92, top: (aP - SELO) / 2, opacity: selo, scale: `${0.7 + 0.3 * selo}`, rotate: `${(1 - selo) * -40}deg` }}>
          <Carimbo tipo="pergunta" tamanho={SELO} />
        </div>
        <div style={{ position: "absolute", left: xTexto, right: 40, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
          <Linhas linhas={p.linhas} tempos={tempos} t={t} esboco={0.22} style={{ ...titulo, fontSize: p.tamanho, color: cor.preto }} />
        </div>
      </div>
      {opcoes.map((o, i) => {
        const col = i % colunas;
        const fila = Math.floor(i / colunas);
        const ox = col * (larguraOp + VAO);
        const oy = aP + 30 + fila * (aO + 14);
        const chega = prog(t, o.em - 0.05, 0.3);
        const proximo = ems[i + 1];
        const acesa = chega * (proximo !== undefined ? 1 - prog(t, proximo - 0.05, 0.35) : 1);
        const angulo = balanco(t, o.em + 0.06, 4, 0.65, 0.3);
        const furo = Math.min(aO * 0.3, 52) * 0.95;
        return (
          <div key={`${o.texto}-${i}`}>
            {fila === 0 || colunas === 1 ? <Cordao x1={ox + furo} y1={fila === 0 ? aP - 10 : oy - 18} x2={ox + furo} y2={oy + aO / 2 - 10} p={Math.max(0.2, chega)} /> : null}
            <div style={{ position: "absolute", left: ox, top: oy, width: larguraOp, height: aO, opacity: 1 - chega }}>
              <FundoEtiqueta w={larguraOp} h={aO} deitada esboco={1} />
              <div style={{ position: "absolute", left: 70, right: 24, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: grotesca, fontWeight: 700, fontSize: tamO, lineHeight: 1.12, color: cor.lapisClaro }}>
                {ops[i].linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            </div>
            {chega > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: ox,
                  top: oy,
                  width: larguraOp,
                  height: aO,
                  opacity: Math.min(1, chega * 1.7),
                  translate: `0 ${(1 - chega) * -22}px`,
                  rotate: `${angulo}deg`,
                  transformOrigin: `${furo}px ${aO / 2}px`,
                }}
              >
                <FundoEtiqueta w={larguraOp} h={aO} deitada acesa={acesa} />
                <div style={{ position: "absolute", left: 70, right: 24, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: grotesca, fontWeight: 700, fontSize: tamO, lineHeight: 1.12, color: acesa > 0.5 ? cor.papel : cor.preto }}>
                  {ops[i].linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
