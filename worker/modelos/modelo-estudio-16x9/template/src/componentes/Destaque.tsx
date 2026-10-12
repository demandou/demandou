// Destaque: a palavra que bate forte, no quadro da esquerda, com a pessoa na moldura grande da direita
// (a câmera corta para o close na palavra).
// - "chave": o texto grande, a lápis, acende palavra por palavra a partir do `em` e um sublinhado rosa se desenha;
// - "alerta": a placa de "no ar" — a faixa rosa acende da esquerda para a direita no `em`, com o
//   texto escuro por cima e o triângulo de alerta (antes disso, a placa está a lápis, tracejada).
// O detalhe, menor, acende embaixo no `detalheEm`.
import { Linhas, prog, temposDoTexto } from "../anim";
import { quadroDe } from "../layout";
import { caber, medir } from "../medidas";
import type { Destaque as DestaqueT, Palavra } from "../plano";
import { cor, sans, titulo } from "../tema";
import { Alerta, faixa } from "./comum";

const AREA = quadroDe("abertura");
const LARGURA = AREA.w;

export const Destaque: React.FC<{ m: DestaqueT; palavras: Palavra[]; t: number; fim: number; atraso?: number }> = ({ m, palavras, t, fim, atraso }) => {
  const topo = AREA.y;
  const altura = AREA.h;
  const { opacidade, dy } = faixa(t, m.de, fim, atraso);
  const alerta = m.nivel === "alerta";
  const detalheEm = m.detalheEm ?? m.em + 0.6;
  const alturaDetalhe = m.detalhe ? 64 : 0;
  const pDetalhe = prog(t, detalheEm - 0.04, 0.3);

  if (alerta) {
    const pad = 26;
    const icone = 64;
    const larguraTexto = LARGURA - 2 * pad - icone - 22;
    const { linhas, tam } = caber(m.texto, { largura: larguraTexto, maximo: 104, minimo: 60, linhas: 2, altura: altura - alturaDetalhe - 2 * pad, entrelinha: 1.04, piso: 44 });
    const alturaPlaca = linhas.length * tam * 1.04 + 2 * pad;
    const acende = prog(t, m.em - 0.04, 0.32);
    const y0 = Math.max(0, (altura - alturaPlaca - alturaDetalhe) / 2);
    const conteudo = (tinta: string) => (
      <div style={{ position: "absolute", left: pad, top: pad, display: "flex", alignItems: "flex-start", gap: 22 }}>
        <div style={{ height: tam * 1.04, display: "flex", alignItems: "center" }}>
          <Alerta tam={icone} cor={tinta} />
        </div>
        <div style={{ ...titulo, fontSize: tam, lineHeight: 1.04, color: tinta }}>
          {linhas.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    );
    return (
      <div style={{ position: "absolute", left: AREA.x, top: topo + y0, width: LARGURA, opacity: opacidade, translate: `0 ${dy}px` }}>
        {/* a placa a lápis (antes do `em`) e a placa acesa por cima, abrindo da esquerda */}
        <div style={{ position: "relative", width: LARGURA, height: alturaPlaca }}>
          {acende < 0.999 ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, boxShadow: `inset 0 0 0 3px ${cor.apagado}` }}>{conteudo(cor.apagadoForte)}</div>
          ) : null}
          {acende > 0.001 ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: cor.acento, clipPath: acende < 0.999 ? `inset(0 ${(1 - acende) * 100}% 0 0 round 22px)` : undefined }}>
              {conteudo(cor.sobreAcento)}
            </div>
          ) : null}
        </div>
        {m.detalhe ? (
          <div style={{ marginTop: 18, fontFamily: sans, fontWeight: 700, fontSize: 44, lineHeight: 1.1, color: pDetalhe > 0.5 ? cor.texto : cor.apagado, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {m.detalhe}
          </div>
        ) : null}
      </div>
    );
  }

  // chave: o texto grande se monta na fala; o sublinhado rosa corre embaixo da última linha
  const { linhas, tam } = caber(m.texto, { largura: LARGURA, maximo: 120, minimo: 64, linhas: 2, altura: altura - alturaDetalhe - 30, entrelinha: 1.04, piso: 44 });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em);
  const fimTexto = Math.max(...tempos) + 0.2;
  const pSublinha = prog(t, fimTexto, 0.45);
  const alturaTexto = linhas.length * tam * 1.04;
  const y0 = Math.max(0, (altura - alturaTexto - 30 - alturaDetalhe) / 2);
  const ultima = linhas[linhas.length - 1] ?? "";
  return (
    <div style={{ position: "absolute", left: AREA.x, top: topo + y0, width: LARGURA, opacity: opacidade, translate: `0 ${dy}px` }}>
      <div style={{ position: "relative" }}>
        <Linhas linhas={linhas} tempos={tempos} t={t} tam={tam} modo="acende" entrelinha={1.04} estilo={{ ...titulo, fontSize: tam }} />
        {/* o sublinhado, do tamanho da última linha, desenhado depois que o texto inteiro foi dito */}
        <Sublinhado texto={ultima} tam={tam} y={alturaTexto + 4} p={pSublinha} />
      </div>
      {m.detalhe ? (
        <div style={{ marginTop: 30, fontFamily: sans, fontWeight: 700, fontSize: 44, lineHeight: 1.1, color: pDetalhe > 0.5 ? cor.textoSuave : cor.apagado, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {m.detalhe}
        </div>
      ) : null}
    </div>
  );
};

// o sublinhado rosa com a largura medida da última linha
const Sublinhado: React.FC<{ texto: string; tam: number; y: number; p: number }> = ({ texto, tam, y, p }) => {
  if (p <= 0) return null;
  const w = medir(texto, tam, 800);
  return <div style={{ position: "absolute", left: 0, top: y, width: w * p, height: Math.max(8, tam * 0.08), borderRadius: 4, background: cor.acento }} />;
};
