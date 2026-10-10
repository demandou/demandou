// Destaque: uma placa aparafusada no peito, como a placa de número de uma porta. "chave" = placa preta
// com filete e chave de latão; "alerta" = placa terracota com o triângulo. A frase se monta palavra
// por palavra; o detalhe vem numa tira de papel presa embaixo da placa, na palavra dele.
import { useMemo } from "react";
import { balanco, Linhas, prog, saida, temposDoTexto } from "../anim";
import { encaixar, SERIFA_TITULO } from "../medida";
import type { Destaque as TipoDestaque, Palavra } from "../plano";
import { cor, grotesca, H, titulo, W } from "../tema";
import { misturarCor } from "./Etiqueta";
import { Icone } from "./Icones";
import { Parafuso } from "./Pecas";
import { BASE_DO_PEITO } from "./Placa";

export const PlacaDeDestaque: React.FC<{ m: TipoDestaque; palavras: Palavra[]; t: number; topo: number; fim: number; centro?: number; entradaMin?: number }> = ({ m, palavras, t, topo, fim, centro = W / 2, entradaMin = -1 }) => {
  const alerta = m.nivel === "alerta";
  const fundo = alerta ? cor.alerta : cor.preto;
  const filete = alerta ? "rgba(246,242,234,0.55)" : cor.latao;
  const largura = 940;
  const PADX = 46;
  const ICONE = 84;
  const interna = largura - PADX * 2 - ICONE - 30;
  const disponivel = BASE_DO_PEITO - (topo + 16);
  const temposDetalheBase = m.detalhe ? 1 : 0;
  const fit = useMemo(() => {
    let max = 82;
    for (;;) {
      const e = encaixar(m.texto, { largura: interna, max, min: Math.min(52, max), linhas: 3, fonte: SERIFA_TITULO });
      const alt = 72 + e.linhas.length * e.tamanho * 1.06 + (temposDetalheBase ? 124 : 0);
      if (alt <= disponivel || e.tamanho <= 42) return e;
      max = e.tamanho - 4;
    }
  }, [m.texto, interna, disponivel, temposDetalheBase]);
  const detalheFit = useMemo(() => (m.detalhe ? encaixar(m.detalhe, { largura: largura - 140, max: 46, min: 36, linhas: 2 }) : null), [m.detalhe]);
  const tempos = useMemo(() => temposDoTexto(m.texto, palavras, m.em - 0.1, m.ate, m.em - 0.02), [m.texto, palavras, m.em, m.ate]);
  // quando o momento anterior também é arte no peito, esta só entra depois que aquela saiu (sem dupla exposição)
  const entrada = Math.max(entradaMin, Math.min(m.de - 0.05, m.em - 0.3));
  const pEntra = prog(t, entrada, 0.42);
  const s = saida(t, fim, 0.3);
  if (t < entrada - 0.01 || s >= 1) return null;
  const tamanho = fit.tamanho;
  const alturaPlaca = 72 + fit.linhas.length * tamanho * 1.06;
  const x = Math.min(W - largura - 20, Math.max(20, centro - largura / 2));
  const ultima = tempos[tempos.length - 1] ?? m.em;
  const detalheEm = m.detalheEm ?? ultima + 0.35;
  const pDetalhe = prog(t, detalheEm - 0.1, 0.35);
  const icone = prog(t, m.em - 0.05, 0.4);
  // a placa sobe decidida e assenta nos parafusos; quando a última palavra é dita, ela dá um tranco curto
  const giro = (1 - pEntra) * 2.5 + balanco(t, ultima + 0.1, 0.9, 0.5, 0.25);

  return (
    <div style={{ position: "absolute", left: x, top: topo + 16, width: largura, opacity: Math.min(1, pEntra * 1.6), translate: `0 ${(1 - pEntra) * 70 + s * (H - topo + 40)}px` }}>
      <div style={{ position: "relative", width: largura, height: alturaPlaca, rotate: `${giro}deg`, transformOrigin: "50% 0%" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: fundo,
            boxShadow: `0 14px 22px rgba(20,14,8,0.32), inset 0 0 0 10px ${fundo}, inset 0 0 0 13px ${filete}`,
          }}
        />
        {[
          [22, 22],
          [largura - 22, 22],
          [22, alturaPlaca - 22],
          [largura - 22, alturaPlaca - 22],
        ].map(([px, py], i) => (
          <Parafuso key={i} x={px} y={py} r={8} giro={20 + i * 37} />
        ))}
        <div style={{ position: "absolute", left: PADX, top: 0, bottom: 0, width: ICONE, display: "flex", alignItems: "center", justifyContent: "center", opacity: icone, scale: `${0.8 + 0.2 * icone}` }}>
          <Icone nome={alerta ? "alerta" : "chave"} tamanho={ICONE} cor={alerta ? cor.papel : cor.latao} espessura={5.5} />
        </div>
        <div style={{ position: "absolute", left: PADX + ICONE + 30, right: PADX, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
          <Linhas linhas={fit.linhas} tempos={tempos} t={t} esboco={0.22} style={{ ...titulo, fontSize: tamanho, color: cor.papel }} />
        </div>
      </div>
      {detalheFit ? (
        <div
          style={{
            position: "relative",
            marginLeft: 70,
            marginTop: 16,
            width: largura - 140,
            padding: "16px 28px 18px",
            boxSizing: "border-box",
            background: cor.papel,
            borderRadius: 10,
            boxShadow: "0 8px 14px rgba(30,20,10,0.22)",
            borderLeft: `10px solid ${misturarCor(cor.papelEscuro, alerta ? cor.alerta : cor.verde, pDetalhe)}`,
            opacity: pDetalhe,
            translate: `0 ${(1 - pDetalhe) * -16}px`,
            fontFamily: grotesca,
            fontWeight: 600,
            fontSize: detalheFit.tamanho,
            lineHeight: 1.15,
            color: cor.preto,
          }}
        >
          {detalheFit.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
