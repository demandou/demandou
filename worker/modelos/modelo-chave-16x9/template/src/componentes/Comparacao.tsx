// Comparação: duas etiquetas grandes penduradas num trilho de madeira, cada uma no seu pino. Cada lado
// nasce a lápis e ganha papel e tinta na palavra dele (cai no pino e balança). Entre as duas, "×" (contra)
// ou a seta de latão (antes → depois, errado → certo). Com vencedor, a etiqueta vencedora fica verde com
// o visto e a outra recebe o xis terracota.
import { useMemo } from "react";
import { balanco, Linhas, prog, temposDoTexto } from "../anim";
import { encaixar, ROTULO, SERIFA_TITULO } from "../medida";
import type { Comparacao as TipoComparacao, Palavra } from "../plano";
import { cor, rotulo as estiloRotulo, serifa, titulo as estiloTitulo } from "../tema";
import { FundoEtiqueta, misturarCor } from "./Etiqueta";
import { useTitulo } from "./Listas";
import { Argola, Carimbo, Pino, ReguaDeMadeira } from "./Pecas";
import { respiro } from "./Parede";

export const DuasEtiquetas: React.FC<{ m: TipoComparacao; palavras: Palavra[]; t: number; w: number; h: number }> = ({ m, palavras, t, w, h }) => {
  const titulo = useTitulo(m.titulo, w, palavras, m.de, m.lados[0].em, 70, 52);
  const modo = m.modo ?? "contra";
  // errado → certo sem vencedor dito: o "certo" ganha logo depois de ser dito
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vencedorEm = m.vencedorEm ?? (vencedor !== undefined ? m.lados[vencedor].em + 0.45 : undefined);
  const topoLivre = titulo ? titulo.altura + 40 : 0;
  const vao = 96;
  const tw = (w - vao) / 2;
  const thMax = Math.min(h - topoLivre - 40 - 34 - 10, 620);
  const furo = Math.min(tw * 0.24, 46) * 0.95;
  const interna = tw - 64;

  const lados = useMemo(
    () =>
      m.lados.map((l, i) => {
        const proximo = i === 0 ? m.lados[1].em : m.ate;
        let fit = encaixar(l.texto, { largura: interna, max: 80, min: 44, linhas: 4, fonte: SERIFA_TITULO });
        const rot = encaixar(l.rotulo, { largura: interna, max: 38, min: 30, linhas: 2, fonte: ROTULO });
        // a altura também precisa caber na etiqueta
        while (fit.tamanho > 36 && rot.linhas.length * rot.tamanho * 1.1 + 24 + fit.linhas.length * fit.tamanho * 1.08 > thMax - furo - 100) {
          fit = encaixar(l.texto, { largura: interna, max: fit.tamanho - 2, min: Math.min(40, fit.tamanho - 2), linhas: 5, fonte: SERIFA_TITULO });
        }
        return { fit, rot, tempos: temposDoTexto(l.texto, palavras, l.em - 0.1, proximo, l.em - 0.02) };
      }),
    [m.lados, m.ate, interna, palavras, thMax, furo],
  );
  // as duas etiquetas têm a mesma altura: a do conteúdo maior, com folga (o bloco fica centrado na parede)
  const alturas = lados.map(({ fit, rot }) => rot.linhas.length * rot.tamanho * 1.1 + 24 + fit.linhas.length * fit.tamanho * 1.08);
  const th = Math.min(thMax, Math.max(400, furo + 46 + Math.max(...alturas) + 90));
  const y0 = Math.max(0, (h - (topoLivre + 40 + 34 + th)) / 2 - 10);
  const reguaY = y0 + topoLivre;
  const topoEtiqueta = reguaY + 40 + 34;
  const seta = prog(t, m.lados[1].em - 0.25, 0.4);
  const veredito = vencedorEm !== undefined ? prog(t, vencedorEm, 0.35) : 0;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {titulo ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: y0 }}>
          <Linhas linhas={titulo.linhas} tempos={titulo.tempos} t={t} style={{ ...estiloTitulo, fontSize: titulo.tamanho, color: cor.preto }} />
        </div>
      ) : null}
      <ReguaDeMadeira x={0} y={reguaY} w={w} h={40} />
      {m.lados.map((l, i) => {
        const cx = i === 0 ? tw / 2 : w - tw / 2;
        const chega = prog(t, l.em - 0.05, 0.32);
        const ganha = vencedor === i ? veredito : 0;
        const perde = vencedor !== undefined && vencedor !== i ? veredito : 0;
        const angulo = balanco(t, l.em + 0.08, 6, 0.8, 0.4) + balanco(t, (vencedorEm ?? 0) + 0.05, ganha > 0 ? 3 : 0, 0.8, 0.4) + respiro(t, i * 2.1, 0.35);
        const corTexto = ganha > 0.5 ? cor.papel : perde > 0.5 ? cor.texto2 : cor.preto;
        const { fit, rot, tempos } = lados[i];
        const alturaTexto = rot.linhas.length * rot.tamanho * 1.1 + 24 + fit.linhas.length * fit.tamanho * 1.08;
        const yTexto = furo + 46 + Math.max(0, (th - furo - 46 - alturaTexto) / 2 - 10);
        return (
          <div key={i}>
            <Pino x={cx} y={reguaY + 40 - 6} />
            {chega < 0.999 ? (
              <div style={{ position: "absolute", left: cx - tw / 2, top: topoEtiqueta, width: tw, height: th, opacity: 1 - chega }}>
                <FundoEtiqueta w={tw} h={th} esboco={1} />
                <div style={{ position: "absolute", left: 32, right: 32, top: yTexto, textAlign: "center" }}>
                  <div style={{ ...estiloRotulo, fontSize: rot.tamanho, lineHeight: 1.1, color: cor.lapisClaro }}>
                    {rot.linhas.map((x, k) => (
                      <div key={k}>{x}</div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            {chega > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  left: cx - tw / 2,
                  top: topoEtiqueta,
                  width: tw,
                  height: th,
                  transformOrigin: `${tw / 2}px -24px`,
                  rotate: `${angulo}deg`,
                  translate: `0 ${(1 - chega) * -44}px`,
                  opacity: Math.min(1, chega * 1.7),
                }}
              >
                <FundoEtiqueta w={tw} h={th} acesa={ganha} />
                <Argola x={tw / 2} y={-14} r={17} />
                <div style={{ position: "absolute", left: 32, right: 32, top: yTexto, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ ...estiloRotulo, fontSize: rot.tamanho, lineHeight: 1.1, color: ganha > 0.5 ? cor.verdeClaro : perde > 0.5 ? cor.alerta : cor.verde }}>
                    {rot.linhas.map((x, k) => (
                      <div key={k}>{x}</div>
                    ))}
                  </div>
                  <Linhas
                    linhas={fit.linhas}
                    tempos={tempos}
                    t={t}
                    alinhar="center"
                    esboco={0.25}
                    style={{ ...estiloTitulo, fontSize: fit.tamanho, lineHeight: 1.08, color: corTexto, marginTop: 24, alignItems: "center" }}
                  />
                </div>
                {ganha > 0.01 ? (
                  <div style={{ position: "absolute", right: -14, top: furo + 6, opacity: ganha, scale: `${1.3 - 0.3 * ganha}` }}>
                    <Carimbo tipo="visto" tamanho={78} p={prog(t, (vencedorEm ?? 0) + 0.12, 0.3)} />
                  </div>
                ) : null}
                {perde > 0.01 ? (
                  <div style={{ position: "absolute", right: -14, top: furo + 6, opacity: perde, scale: `${1.3 - 0.3 * perde}` }}>
                    <Carimbo tipo="xis" tamanho={78} p={prog(t, (vencedorEm ?? 0) + 0.12, 0.3)} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {/* entre as duas: × ou a seta de latão */}
      <div style={{ position: "absolute", left: w / 2 - vao / 2, width: vao, top: topoEtiqueta + th * 0.45 - 50, height: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {modo === "contra" ? (
          <div style={{ fontFamily: serifa, fontSize: 96, lineHeight: 1, color: misturarCor(cor.paredeEscura, cor.preto, seta), opacity: 0.5 + 0.5 * seta }}>×</div>
        ) : (
          <svg width={80} height={60} viewBox="0 0 80 60" style={{ overflow: "visible" }}>
            <path d="M 6 30 H 66" stroke={cor.lapis} strokeWidth={4} strokeDasharray="8 7" fill="none" opacity={1 - seta} />
            <path d="M 6 30 H 66 M 48 12 L 70 30 L 48 48" stroke={cor.lataoEscuro} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={`${Math.max(0.001, seta)} 1`} />
            <path d="M 6 30 H 66 M 48 12 L 70 30 L 48 48" stroke={cor.latao} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={`${Math.max(0.001, seta)} 1`} />
          </svg>
        )}
      </div>
    </div>
  );
};
