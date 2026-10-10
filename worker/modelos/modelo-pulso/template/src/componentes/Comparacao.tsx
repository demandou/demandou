// Comparação: embaixo do card da pessoa, dois monitores lado a lado. Cada lado tem o rótulo, o texto
// que se monta na fala e o seu traçado de pulso, que começa a bater quando o lado é dito. Quando o
// vencedor é dito, ele ganha o ✓ e o batimento firme em verde; o outro ganha o ✗ e o traçado vira
// uma linha reta (o pulso para) — a assinatura do relógio em qualquer "A × B".
import { Linhas, mistura, prog, temposDoTexto } from "../anim";
import type { Geo } from "../layout";
import { encaixar, LETREIRO, larguraTexto } from "../medida";
import type { Comparacao as ComparacaoT, Palavra } from "../plano";
import { cor, letreiro, mostrador, sombraCartao, ZONAS } from "../tema";
import { Icone } from "./Icones";
import { Pulso } from "./Pulso";

const GAP = 24;

export const Comparacao: React.FC<{ m: ComparacaoT; t: number; palavras: Palavra[]; fim: number; geo: Geo }> = ({ m, t, palavras, fim, geo }) => {
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : modo === "antes-depois" ? 1 : undefined);
  const temVencedor = m.vencedor !== undefined || modo === "errado-certo";
  const vencedorEm = m.vencedorEm ?? (temVencedor ? m.lados[vencedor ?? 1].em + 0.6 : undefined);
  const coresBase =
    modo === "errado-certo" ? [ZONAS[4], ZONAS[2]] : modo === "antes-depois" ? [ZONAS[0], ZONAS[1]] : [ZONAS[1], ZONAS[3]];
  let topo = geo.abaixoCartao;
  const titulo = m.titulo?.trim();
  const encTitulo = titulo ? encaixar(titulo, { largura: 840, max: 56, min: 42, linhas: 1 }) : null;
  const temposTitulo = titulo ? temposDoTexto(titulo, palavras, m.de, m.ate, m.de + 0.15) : [];
  const topoTitulo = topo;
  if (encTitulo) topo += Math.round(encTitulo.tamanho * 1.1) + 22;
  const largCol = (840 - GAP) / 2;
  const altCartao = Math.min(600, 1520 - topo);
  const pad = 28;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {encTitulo ? (
        <Linhas
          linhas={encTitulo.linhas}
          tempos={temposTitulo}
          t={t}
          x={120}
          y={topoTitulo}
          largura={840}
          alturaLinha={Math.round(encTitulo.tamanho * 1.1)}
          estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: encTitulo.tamanho, color: cor.tinta, letterSpacing: "-0.01em" }}
          esboco={cor.esboco}
        />
      ) : null}
      {m.lados.map((lado, i) => {
        const x = 120 + i * (largCol + GAP);
        const ganhou = vencedorEm !== undefined && vencedor === i ? prog(t, vencedorEm, 0.35) : 0;
        const perdeu = vencedorEm !== undefined && vencedor !== undefined && vencedor !== i ? prog(t, vencedorEm, 0.35) : 0;
        const base = coresBase[i];
        const z = ganhou > 0.5 ? ZONAS[2] : base;
        const dito = prog(t, lado.em - 0.05, 0.3);
        // rótulo em letreiro (encolhe até 24 px para caber)
        const rotulo = lado.rotulo.trim();
        const largRot = largCol - 2 * pad - 56;
        const tamRot = Math.max(24, Math.min(30, Math.floor((30 * largRot) / Math.max(1, larguraTexto(rotulo, 30, LETREIRO)))));
        const encRot = encaixar(rotulo, { largura: largRot, max: tamRot, min: 24, linhas: 2, fonte: LETREIRO });
        const lhRot = Math.round(encRot.tamanho * 1.25);
        const topoTexto = topo + pad + encRot.linhas.length * lhRot + 16;
        const altPulsoMin = 96;
        const espacoTexto = altCartao - (topoTexto - topo) - altPulsoMin - 24 - pad;
        let enc = encaixar(lado.texto, { largura: largCol - 2 * pad, max: 58, min: 38, linhas: 3 });
        while (enc.linhas.length * Math.round(enc.tamanho * 1.1) > espacoTexto && enc.tamanho > 32) {
          enc = encaixar(lado.texto, { largura: largCol - 2 * pad, max: enc.tamanho - 2, min: Math.min(32, enc.tamanho - 2), linhas: 4 });
        }
        const lh = Math.round(enc.tamanho * 1.1);
        const proximo = i === 0 ? m.lados[1].em : m.ate;
        const tempos = temposDoTexto(lado.texto, palavras, lado.em - 0.3, proximo + 0.3, lado.em);
        const topoPulso = topoTexto + enc.linhas.length * lh + 18;
        const altPulso = Math.max(altPulsoMin, topo + altCartao - pad - topoPulso);
        // o monitor: a caneta corre do momento em que o lado é dito até o fim; um batimento a cada
        // ~0,8 s (o vencedor acelera de leve); o perdedor para de bater
        const inicio = lado.em;
        const dur = Math.max(1, fim - inicio);
        const caneta = Math.min(1, Math.max(0, (t - inicio) / dur));
        const batidas: { pos: number }[] = [];
        for (let tb = inicio + 0.15; tb < fim; tb += vencedorEm !== undefined && tb > vencedorEm && vencedor === i ? 0.62 : 0.8) {
          if (vencedorEm !== undefined && vencedor !== undefined && vencedor !== i && tb > vencedorEm) break;
          batidas.push({ pos: (tb - inicio) / dur });
        }
        const corTraco = perdeu > 0.5 ? cor.tintaFraca : z.cor;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: topo,
                width: largCol,
                height: altCartao,
                borderRadius: 32,
                background: cor.cartao,
                boxShadow: sombraCartao,
                border: `4px solid ${ganhou > 0.01 ? ZONAS[2].cor : "transparent"}`,
                opacity: mistura(0.55, 1, dito),
              }}
            />
            <Linhas
              linhas={encRot.linhas}
              tempos={encRot.linhas.flatMap((l) => l.split(/\s+/)).map(() => lado.em - 0.05)}
              t={t}
              x={x + pad}
              y={topo + pad}
              largura={largRot}
              alturaLinha={lhRot}
              estilo={{ ...letreiro, fontSize: encRot.tamanho, lineHeight: `${lhRot}px`, color: perdeu > 0.5 ? cor.tintaFraca : z.texto }}
              esboco={cor.esbocoTexto}
            />
            {/* ✓ ou ✗ no canto */}
            {ganhou > 0.01 || perdeu > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: x + largCol - pad - 48,
                  top: topo + pad - 6,
                  width: 48,
                  height: 48,
                  borderRadius: 999,
                  background: ganhou > 0.01 ? ZONAS[2].cor : modo === "errado-certo" ? ZONAS[4].cor : cor.tintaFraca,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: Math.max(ganhou, perdeu),
                  scale: String(0.8 + 0.2 * Math.max(ganhou, perdeu)),
                }}
              >
                <Icone nome={ganhou > 0.01 ? "check" : "xis"} tamanho={30} cor="#FFFFFF" peso={5} />
              </div>
            ) : null}
            {/* esqueleto do texto até ser dito */}
            {enc.linhas.map((l, k) => (
              <div
                key={`e${k}`}
                style={{
                  position: "absolute",
                  left: x + pad,
                  top: topoTexto + k * lh + lh * 0.3,
                  width: Math.min(largCol - 2 * pad, larguraTexto(l, enc.tamanho) * 0.9),
                  height: lh * 0.4,
                  borderRadius: 99,
                  background: "#DCE0DA",
                  opacity: 1 - dito,
                }}
              />
            ))}
            {t >= lado.em - 0.06 ? (
              <Linhas
                linhas={enc.linhas}
                tempos={tempos}
                t={t}
                x={x + pad}
                y={topoTexto}
                largura={largCol - 2 * pad}
                alturaLinha={lh}
                estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: perdeu > 0.5 ? cor.tintaSuave : cor.tinta, letterSpacing: "-0.01em" }}
              />
            ) : null}
            {/* o monitor */}
            <div style={{ position: "absolute", left: x + pad, top: topoPulso, width: largCol - 2 * pad, height: altPulso, borderTop: `3px solid ${cor.fio}` }} />
            <Pulso x={x + pad} y={topoPulso + 6} largura={largCol - 2 * pad} altura={altPulso - 6} caneta={caneta} batidas={batidas} corTraco={corTraco} />
          </div>
        );
      })}
      {/* o "×" (ou a seta do antes → depois) entre os dois */}
      <div
        style={{
          position: "absolute",
          left: 540 - 30,
          top: topo + Math.min(altCartao, 300) / 2 - 30,
          width: 60,
          height: 60,
          borderRadius: 999,
          background: cor.caixa,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: prog(t, m.lados[1].em - 0.05, 0.3),
        }}
      >
        <Icone nome={modo === "contra" ? "xis" : "seta"} tamanho={30} cor="#FFFFFF" peso={4.5} />
      </div>
    </div>
  );
};
