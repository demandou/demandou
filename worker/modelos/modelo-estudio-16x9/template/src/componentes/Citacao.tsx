// Citação: a frase forte do corte, no quadro da esquerda (a pessoa na moldura da direita, em close). A frase inteira
// já está a lápis; cada palavra acende quando é dita. A palavra de `risca` ganha um risco no acento
// e apaga; o `destaque` acende no acento e ganha um sublinhado que se desenha.
import { indicesDoTrecho, Linhas, prog, saindo, temposDoTexto } from "../anim";
import { quadroDe } from "../layout";
import { caber, diagramarEm } from "../medidas";
import type { Citacao as CitacaoT, Frase, Palavra } from "../plano";
import { cor, rotulo, titulo } from "../tema";

// Serve à `frase` (universal) e à `citacao` (nome antigo, com `risca`).
export const Citacao: React.FC<{ m: CitacaoT | Frase; palavras: Palavra[]; t: number; fim: number; atraso?: number }> = ({ m, palavras, t, fim, atraso = 0.04 }) => {
  const area = quadroDe("citacao");
  const largura = area.w;
  const livre = area.h - 84;
  // o maior corpo que ocupa a faixa, em 2 ou 3 linhas (até 112 px); com corpos parecidos, fica a
  // versão que enche mais a faixa (a frase forte é a maior coisa da tela)
  const duas = caber(m.texto, { largura, maximo: 112, minimo: 60, linhas: 2, altura: livre, entrelinha: 1.06, piso: 44 });
  const tres = diagramarEm(m.texto, 3, { largura, maximo: 112, minimo: 60, altura: livre, entrelinha: 1.06 });
  const d = tres && tres.tam >= duas.tam - 10 ? tres : duas;
  const { linhas, tam } = d;
  // o rótulo e a frase ficam no meio da altura do quadro
  const topo = area.y + Math.max(0, (area.h - 82 - linhas.length * tam * 1.06) / 2);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de + 0.1);
  const trechoRiscado = m.tipo === "citacao" ? (m.risca ?? m.risco) : m.risco;
  const risca = indicesDoTrecho(m.texto, trechoRiscado);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const fimDa = (conj: Set<number>) => Math.max(...[...conj].map((i) => tempos[i] ?? 0));
  // o risco passa um instante depois de o trecho ser dito (ou no `riscoEm`)
  const riscaEm = risca.size ? (m.riscoEm ?? fimDa(risca) + 0.3) : Infinity;
  const primeiroDestaque = destaque.size ? Math.min(...[...destaque].map((i) => tempos[i] ?? 0)) : Infinity;
  const pRisco = prog(t, riscaEm, 0.3);
  const pSublinha = prog(t, primeiroDestaque + 0.18, 0.45);
  const entra = prog(t, m.de + atraso, 0.4);
  const s = saindo(t, fim + 0.02, 0.2);
  const ultimoDestaque = destaque.size ? Math.max(...destaque) : -1;
  const primeiroIndice = destaque.size ? Math.min(...destaque) : -1;

  return (
    <div style={{ position: "absolute", left: area.x, top: topo, width: largura, opacity: entra * (1 - s), translate: `0 ${(1 - entra) * 50 + 24 * s}px` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, height: 64 }}>
        <svg width={52} height={44} viewBox="0 0 52 44">
          <path d="M4 44 V26 C4 12 10 4 22 1 L24 8 C17 11 14 16 14 22 H22 V44 Z M30 44 V26 C30 12 36 4 48 1 L50 8 C43 11 40 16 40 22 H48 V44 Z" fill={cor.acento} />
        </svg>
        <span style={{ ...rotulo, fontSize: 32, color: cor.textoSuave }}>{m.rotulo ?? "Frase do episódio"}</span>
      </div>
      <div style={{ height: 18 }} />
      <Linhas
        linhas={linhas}
        tempos={tempos}
        t={t}
        tam={tam}
        modo="acende"
        estilo={{ ...titulo, fontSize: tam }}
        corDe={(i) => (destaque.has(i) ? cor.acento : undefined)}
        opacidadeDe={(i) => (risca.has(i) ? 1 - 0.55 * pRisco : 1)}
        sobre={(i) => {
          if (risca.has(i) && pRisco > 0)
            return (
              <div
                style={{
                  position: "absolute",
                  left: -6,
                  right: -6,
                  top: "50%",
                  height: Math.max(6, tam * 0.075),
                  borderRadius: 4,
                  background: cor.acento,
                  transformOrigin: "left center",
                  scale: `${pRisco} 1`,
                }}
              />
            );
          if (destaque.has(i) && pSublinha > 0) {
            // o sublinhado corre pelo trecho inteiro, palavra a palavra
            const n = destaque.size;
            const k = i - primeiroIndice;
            const parte = Math.min(1, Math.max(0, pSublinha * n - k));
            return (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: i === ultimoDestaque ? 0 : -tam * 0.26,
                  bottom: -tam * 0.1,
                  height: Math.max(6, tam * 0.07),
                  background: cor.acento,
                  transformOrigin: "left center",
                  scale: `${parte} 1`,
                }}
              />
            );
          }
          return null;
        }}
      />
    </div>
  );
};
