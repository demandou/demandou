// Frase (e a placa do formato antigo): a frase que merece ficar, numa etiqueta deitada no peito, com
// a pessoa em quadro cheio. Monta palavra por palavra na fala; o `destaque` fica verde e o `risco` é
// riscado em terracota quando é dito.
import { useMemo } from "react";
import { balanco, indicesDoTrecho, Linhas, prog, saida, temposDoTexto } from "../anim";
import { encaixar, larguraTexto, SERIFA_TITULO } from "../medida";
import type { Frase, Palavra, Placa as TipoPlaca } from "../plano";
import { cor, H, rotulo as estiloRotulo, titulo, W } from "../tema";
import { FundoEtiqueta } from "./Etiqueta";

// a base das artes no peito (acima da interface do app)
export const BASE_DO_PEITO = 1548;

export const Placa: React.FC<{ m: TipoPlaca | Frase; palavras: Palavra[]; t: number; topo: number; fim: number; centro?: number; entradaMin?: number }> = ({ m, palavras, t, topo, fim, centro = W / 2, entradaMin = -1 }) => {
  const rotulo = m.tipo === "placa" ? m.rotulo : undefined;
  const enfase = m.tipo === "placa" ? m.enfase : m.destaque;
  const risco = m.tipo === "frase" ? m.risco : undefined;
  const inicio = m.tipo === "frase" && m.em !== undefined ? m.em : m.de;
  const largura = 940;
  const interna = largura - 104 - 44;
  const disponivel = BASE_DO_PEITO - (topo + 16);
  const fit = useMemo(() => {
    let max = 80;
    for (;;) {
      const e = encaixar(m.texto, { largura: interna, max, min: Math.min(52, max), linhas: 4, fonte: SERIFA_TITULO });
      const alt = 60 + (rotulo ? 50 : 0) + e.linhas.length * e.tamanho * 1.06;
      if (alt <= disponivel || e.tamanho <= 40) return e;
      max = e.tamanho - 4;
    }
  }, [m.texto, interna, disponivel, rotulo]);
  const tempos = useMemo(() => temposDoTexto(m.texto, palavras, inicio - 0.1, m.ate, inicio + 0.02), [m.texto, palavras, inicio, m.ate]);
  const destaque = useMemo(() => indicesDoTrecho(m.texto, enfase), [m.texto, enfase]);
  const riscados = useMemo(() => indicesDoTrecho(m.texto, risco), [m.texto, risco]);
  // quando o momento anterior também é arte no peito, esta só entra depois que aquela saiu (sem dupla exposição)
  const entrada = Math.max(entradaMin, Math.min(m.de - 0.05, inicio - 0.3));
  const pEntra = prog(t, entrada, 0.45);
  const s = saida(t, fim, 0.3);
  if (t < entrada - 0.01 || s >= 1) return null;
  const tamanho = fit.tamanho;
  const altura = 60 + (rotulo ? 50 : 0) + fit.linhas.length * tamanho * 1.06;
  const x = Math.min(W - largura - 20, Math.max(20, centro - largura / 2));

  // o risco: um traço por linha, sobre as palavras riscadas, desenhado quando elas são ditas
  const riscos: { x: number; y: number; w: number }[] = [];
  if (riscados.size) {
    let k = 0;
    fit.linhas.forEach((linha, li) => {
      const ws = linha.split(" ");
      let cx = 0;
      let ini = -1;
      let fimX = 0;
      ws.forEach((w, j) => {
        const lw = larguraTexto(w, tamanho, SERIFA_TITULO);
        if (riscados.has(k + j)) {
          if (ini < 0) ini = cx;
          fimX = cx + lw;
        }
        cx += lw + 0.26 * tamanho;
      });
      if (ini >= 0) riscos.push({ x: ini - 6, y: li * tamanho * 1.04 + tamanho * 0.56, w: fimX - ini + 12 });
      k += ws.length;
    });
  }
  const ultimoRiscado = riscados.size ? Math.max(...riscados) : 0;
  const riscoEm = m.tipo === "frase" ? (m.riscoEm ?? (riscados.size ? (tempos[ultimoRiscado] ?? m.de) + 0.2 : m.de)) : 0;
  const pRisco = prog(t, riscoEm, 0.45);
  const totalRisco = riscos.reduce((a, r) => a + r.w, 0) || 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: topo + 16,
        width: largura,
        height: altura,
        opacity: Math.min(1, pEntra * 1.5),
        translate: `0 ${(1 - pEntra) * 80 + s * (H - topo + 40)}px`,
        transformOrigin: `40px ${altura / 2}px`,
        rotate: `${(1 - pEntra) * -3 + balanco(t, entrada + 0.2, 1, 0.8, 0.35)}deg`,
      }}
    >
      <FundoEtiqueta w={largura} h={altura} deitada />
      <div style={{ position: "absolute", left: 104, top: 30, right: 40 }}>
        {rotulo ? <div style={{ ...estiloRotulo, fontSize: 32, color: cor.verde, marginBottom: 18 }}>{rotulo}</div> : null}
        <div style={{ position: "relative" }}>
          <Linhas
            linhas={fit.linhas}
            tempos={tempos}
            t={t}
            style={{ ...titulo, fontSize: tamanho, color: cor.preto }}
            corDe={(i) => (destaque.has(i) ? cor.verde : riscados.has(i) && pRisco > 0.5 ? cor.texto2 : undefined)}
          />
          {(() => {
            let feito = 0;
            return riscos.map((r, i) => {
              const ini = feito / totalRisco;
              feito += r.w;
              const p = Math.min(1, Math.max(0, (pRisco - ini) / (r.w / totalRisco)));
              return p > 0.001 ? (
                <div key={i} style={{ position: "absolute", left: r.x, top: r.y - 4, width: r.w * p, height: 8, borderRadius: 4, background: cor.alerta, rotate: "-1.2deg" }} />
              ) : null;
            });
          })()}
        </div>
      </div>
    </div>
  );
};
