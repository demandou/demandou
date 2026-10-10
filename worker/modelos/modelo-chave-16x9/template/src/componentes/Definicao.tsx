// Definição: a etiqueta do termo (deitada, no peito) e, pendurada nela por um cordão, a etiqueta do
// significado. O termo se monta em verde na palavra dele; o significado espera a lápis e, quando é
// dito, a etiqueta do significado cai no cordão, balança e o texto ganha tinta palavra por palavra.
// No quadro deitado a faixa do peito é baixa e larga: as duas etiquetas ficam numa FILEIRA (o termo à
// esquerda, o significado à direita, presos pelo cordão). Sem largura (lado livre do rosto), voltam a
// ficar uma embaixo da outra, como no vertical.
import { useMemo } from "react";
import { balanco, Linhas, prog, saida, temposDoTexto } from "../anim";
import { encaixar, larguraLinha, SERIFA_TITULO } from "../medida";
import type { Definicao as TipoDefinicao, Palavra } from "../plano";
import { cor, grotesca, H, LARGURA_PEITO, MARGEM, titulo, W } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";
import { Cordao } from "./Pecas";
import { BASE_DO_PEITO } from "./Placa";

export const EtiquetaDeDefinicao: React.FC<{ m: TipoDefinicao; palavras: Palavra[]; t: number; topo: number; fim: number; centro?: number; largura?: number; entradaMin?: number }> = ({
  m,
  palavras,
  t,
  topo,
  fim,
  centro = W / 2,
  largura = LARGURA_PEITO,
  entradaMin = -1,
}) => {
  const disponivel = BASE_DO_PEITO - (topo + 16);
  // fileira: termo e significado lado a lado; pilha: um embaixo do outro (lado livre, estreito)
  const fileira = largura >= 1000;
  const CORDAO = 70;
  const larguraS = fileira ? Math.round(Math.min(780, Math.max(560, largura * 0.56))) : Math.min(860, largura - 40);
  const larguraTMax = fileira ? largura - larguraS - CORDAO : largura;
  const medidas = useMemo(() => {
    let maxT = 92;
    let maxS = 54;
    for (;;) {
      const termo = encaixar(m.termo, { largura: larguraTMax - 104 - 44, max: maxT, min: Math.min(56, maxT), linhas: 2, fonte: SERIFA_TITULO });
      const sig = encaixar(m.significado, { largura: larguraS - 96 - 40, max: maxS, min: Math.min(38, maxS), linhas: 3 });
      const aT = 56 + termo.linhas.length * termo.tamanho * 1.04;
      const aS = 48 + sig.linhas.length * sig.tamanho * 1.14;
      const altura = fileira ? Math.max(aT, aS) : aT + 46 + aS;
      if (altura <= disponivel || (termo.tamanho <= 48 && sig.tamanho <= 34)) return { termo, sig, aT, aS };
      maxT = Math.max(48, termo.tamanho - 4);
      maxS = Math.max(34, sig.tamanho - 2);
    }
  }, [m.termo, m.significado, disponivel, larguraS, larguraTMax, fileira]);
  const { termo, sig, aT, aS } = medidas;
  const temposT = useMemo(() => temposDoTexto(m.termo, palavras, m.em - 0.1, m.significadoEm, m.em - 0.02), [m.termo, palavras, m.em, m.significadoEm]);
  const temposS = useMemo(() => temposDoTexto(m.significado, palavras, m.significadoEm - 0.1, m.ate, m.significadoEm - 0.02), [m.significado, palavras, m.significadoEm, m.ate]);
  // quando o momento anterior também é arte no peito, esta só entra depois que aquela saiu (sem dupla exposição)
  const entrada = Math.max(entradaMin, Math.min(m.de - 0.05, m.em - 0.3));
  const pEntra = prog(t, entrada, 0.45);
  const s = saida(t, fim, 0.3);
  if (t < entrada - 0.01 || s >= 1) return null;
  // a etiqueta do termo tem a largura do termo (com folga), a do significado é larga
  const larguraT = Math.min(larguraTMax, Math.max(fileira ? 420 : 560, Math.max(...termo.linhas.map((l) => larguraLinha(l.split(" "), termo.tamanho, SERIFA_TITULO))) + 104 + 60));
  const cai = prog(t, m.significadoEm - 0.12, 0.34);
  const furoS = Math.min(aS * 0.3, 52) * 0.95;
  // fileira: o par fica centrado no rosto, as duas etiquetas alinhadas pelo meio da mais alta
  const total = larguraT + CORDAO + larguraS;
  const x0 = Math.min(W - MARGEM - total, Math.max(MARGEM, centro - total / 2));
  const alturaPar = Math.max(aT, aS);
  const xT = fileira ? x0 : Math.min(W - larguraT - MARGEM, Math.max(MARGEM, centro - larguraT / 2));
  const xS = fileira ? x0 + larguraT + CORDAO : Math.min(W - larguraS - MARGEM, Math.max(MARGEM, centro - larguraS / 2));
  const yT = fileira ? topo + 16 + (alturaPar - aT) / 2 : topo + 16;
  const yS = fileira ? topo + 16 + (alturaPar - aS) / 2 : topo + 16 + aT + 46;
  const pontoT = fileira ? { x: xT + larguraT - 18, y: yT + aT / 2 } : { x: Math.max(xT + 70, xS + furoS), y: topo + 16 + aT - 8 };
  const pontoS = { x: xS + furoS, y: yS + aS / 2 };
  const anguloS = (1 - cai) * -6 + balanco(t, m.significadoEm + 0.1, 3.5, 0.75, 0.35);
  const sublinha = prog(t, (temposT[temposT.length - 1] ?? m.em) + 0.25, 0.4);
  const larguraTermo = Math.max(...termo.linhas.map((l) => larguraLinha(l.split(" "), termo.tamanho, SERIFA_TITULO)));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, pEntra * 1.5), translate: `0 ${(1 - pEntra) * 80 + s * (H - topo + 40)}px` }}>
      {/* o cordão entre as duas etiquetas */}
      <Cordao x1={pontoT.x} y1={pontoT.y} x2={pontoS.x} y2={pontoS.y - 12} p={Math.max(0.15, cai)} />
      <div style={{ position: "absolute", left: xT, top: yT, width: larguraT, height: aT, rotate: `${(1 - pEntra) * -3 + balanco(t, entrada + 0.2, 1, 0.8, 0.35)}deg`, transformOrigin: `40px ${aT / 2}px` }}>
        <FundoEtiqueta w={larguraT} h={aT} deitada />
        <div style={{ position: "absolute", left: 104, top: 26, right: 40 }}>
          <Linhas linhas={termo.linhas} tempos={temposT} t={t} esboco={0.25} style={{ ...titulo, fontSize: termo.tamanho, lineHeight: 1.04, color: cor.verde }} />
          <div style={{ height: 6, width: larguraTermo * sublinha, background: cor.verde, borderRadius: 3, marginTop: 4, opacity: sublinha > 0 ? 1 : 0 }} />
        </div>
      </div>
      {/* a etiqueta do significado: esboço a lápis até ser dito */}
      <div style={{ position: "absolute", left: xS, top: yS, width: larguraS, height: aS, opacity: 1 - cai }}>
        <FundoEtiqueta w={larguraS} h={aS} deitada esboco={1} />
      </div>
      <div
        style={{
          position: "absolute",
          left: xS,
          top: yS,
          width: larguraS,
          height: aS,
          opacity: cai,
          translate: `0 ${(1 - cai) * -28}px`,
          rotate: `${anguloS}deg`,
          transformOrigin: `50px ${aS / 2}px`,
        }}
      >
        <FundoEtiqueta w={larguraS} h={aS} deitada />
      </div>
      <div style={{ position: "absolute", left: xS + 96, top: yS, width: larguraS - 96 - 40, height: aS, display: "flex", alignItems: "center", translate: `0 ${(1 - cai) * -28}px`, rotate: `${anguloS}deg`, transformOrigin: `-46px ${aS / 2}px` }}>
        <Linhas linhas={sig.linhas} tempos={temposS} t={t} esboco={0.3} style={{ fontFamily: grotesca, fontWeight: 600, fontSize: sig.tamanho, lineHeight: 1.14, color: cor.preto }} />
      </div>
    </div>
  );
};
