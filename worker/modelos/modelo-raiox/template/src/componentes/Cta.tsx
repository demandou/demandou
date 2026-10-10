// Fechamento: chapa-cartão com o ícone e a chamada falada, as chapas dos ajustes em miniatura (já
// corrigidas, cada uma ganha ✓) e a assinatura em marcação de filme.
import { indicesDoTrecho, Linhas, prog, temposDoTexto } from "../anim";
import { CenaAjuste } from "../esqueleto/Cena";
import { diagramar } from "../medidas";
import { type Ajuste, ehPostura, type Cta as TCta, type MomentoDeChapa, type Palavra } from "../plano";
import { areaDaChapa, cor, marcacao, titulo as estiloTitulo } from "../tema";
import { Cartao, CARTAO } from "./Cartao";
import { topoDoCartao } from "./Cartoes";
import { Chapa, FAIXA } from "./Chapa";
import { FilmeComparacao } from "./Filmes";
import { Icone } from "./Icones";
import type { GrupoDoRaioX } from "../layout";
import { ConteudoDoFilme } from "./Negatoscopio";

// Uma chapa do vídeo em miniatura, já no estado final (o filme inteiro, reduzido)
const MiniFilme: React.FC<{ m: MomentoDeChapa; largura: number; altura: number; id: string; palavras: Palavra[]; grupo?: GrupoDoRaioX }> = ({ m, largura, altura, id, palavras, grupo }) => {
  if (ehPostura(m)) return <CenaAjuste vista={m.vista} passos={[]} erradas={[]} antebracoSegue t={0} largura={largura} altura={altura} id={id} miniatura />;
  const a = areaDaChapa();
  const fw = a.w;
  const fh = a.h - FAIXA;
  const k = Math.max(largura / fw, altura / fh);
  const fim = 1e4;
  return (
    <div style={{ position: "absolute", left: (largura - fw * k) / 2, top: (altura - fh * k) / 2, width: fw, height: fh, scale: `${k}`, transformOrigin: "0 0" }}>
      {m.tipo === "comparacao" ? (
        <FilmeComparacao m={m} t={fim} largura={fw} altura={fh + FAIXA} id={id} palavras={palavras} numero="" />
      ) : (
        <ConteudoDoFilme m={m} t={fim} largura={fw} altura={fh} id={id} palavras={palavras} grupo={grupo} />
      )}
    </div>
  );
};

export const Cta: React.FC<{
  m: TCta;
  t: number;
  topo: number;
  fim: number;
  palavras: Palavra[];
  marca: { nome: string; area: string };
  chapas: MomentoDeChapa[];
  grupos: Map<Ajuste, GrupoDoRaioX>;
}> = ({
  m,
  t,
  topo,
  fim,
  palavras,
  marca,
  chapas,
  grupos,
}) => {
  const P = CARTAO.padding;
  const icone = 76;
  const largura = 900 - CARTAO.x - P - icone - 26;
  const d = diagramar(m.texto, largura, 84, 64, 3, "sans700");
  const tempos = m.em !== undefined ? temposDoTexto(m.texto, palavras, m.em - 0.3, fim, m.em - 0.05) : temposDoTexto(m.texto, palavras, m.de, fim, m.de + 0.05);
  const ciano = indicesDoTrecho(m.texto, m.destaque);
  // as chapas do vídeo em miniatura: os ajustes de postura (todos corrigidos) ou, sem eles, as chapas
  // do negatoscópio em ordem
  const postura = chapas.filter(ehPostura);
  const miniaturas = m.recapitular === false ? [] : (postura.length ? postura : chapas).slice(0, 4);
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const alturaTexto = d.linhas.length * d.tamanho * 1.04;
  const faixaMini = miniaturas.length ? 158 : 0;
  const altura = Math.round(P + Math.max(icone, alturaTexto) + (faixaMini ? 26 + faixaMini : 0) + (assinatura ? 24 + 34 : 0) + P);
  const cheio = prog(t, tempos[0] ?? m.de, 0.4);
  const wMini = miniaturas.length ? (CARTAO.largura - 2 * CARTAO.borda - 2 * P - 18 * (miniaturas.length - 1) - 60) / miniaturas.length : 0;
  const yMini = P + Math.max(icone, alturaTexto) + 26;
  // as miniaturas chegam logo depois da primeira palavra; o ✓ de cada uma acende em sequência na última
  const chegam = (tempos[0] ?? m.de) + 0.25;
  const marcam = (tempos[tempos.length - 1] ?? m.de + 0.8) - 0.1;
  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      <div style={{ position: "absolute", left: P, top: P, display: "flex", gap: 26, alignItems: "flex-start" }}>
        <div style={{ width: icone, height: icone, display: "flex", alignItems: "center", justifyContent: "center", marginTop: Math.max(0, (Math.min(alturaTexto, d.tamanho * 1.04) - icone) / 2) }}>
          <Icone nome={m.icone ?? "salvar"} tamanho={icone} cheio={cheio} />
        </div>
        <Linhas linhas={d.linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: d.tamanho, width: largura }} corDe={(i) => (ciano.has(i) ? cor.ciano : undefined)} />
      </div>
      {miniaturas.map((a, i) => {
        const p = prog(t, chegam + i * 0.12, 0.4);
        const ok = prog(t, marcam + i * 0.1, 0.3);
        const x = P + i * (wMini + 18);
        return (
          // antes de chegar, cada miniatura já está no lugar em esboço (nada de espaço vazio no cartão)
          <div key={i} style={{ position: "absolute", left: x, top: yMini, width: wMini, height: faixaMini, opacity: 0.22 + 0.78 * p, translate: `${((1 - p) * 24).toFixed(1)}px 0`, filter: p < 1 ? `grayscale(1) brightness(${(0.6 + 0.4 * p).toFixed(3)})` : undefined }}>
            <Chapa largura={wMini} altura={faixaMini} id={`cta-${i}`} semFaixa estilo={{ boxShadow: `0 0 0 2px rgba(228,244,251,${(0.2 + 0.5 * ok).toFixed(2)})` }}>
              <MiniFilme m={a} largura={wMini} altura={faixaMini} id={`cta-${i}`} palavras={palavras} grupo={a.tipo === "ajuste" ? grupos.get(a) : undefined} />
            </Chapa>
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px 4px 6px",
                borderRadius: 6,
                background: "rgba(3,8,13,0.82)",
              }}
            >
              <svg width={30} height={30} viewBox="0 0 30 30">
                <circle cx={15} cy={15} r={13} fill={ok > 0 ? cor.ciano : "none"} stroke={ok > 0 ? cor.ciano : cor.esbocoTraco} strokeWidth={2.5} opacity={0.4 + 0.6 * Math.max(ok, 0.3)} />
                <path d="M 8.5 15.5 L 13 20 L 21.5 10.5" fill="none" stroke={cor.sala} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${ok} 1`} />
              </svg>
              <div style={{ ...marcacao, fontSize: 32, color: cor.texto }}>{String(i + 1).padStart(2, "0")}</div>
            </div>
          </div>
        );
      })}
      {assinatura ? (
        <div style={{ position: "absolute", left: P, bottom: P - 4, ...marcacao, fontSize: 32, color: cor.textoSuave, opacity: prog(t, m.de + 0.3, 0.5) }}>{assinatura}</div>
      ) : null}
    </Cartao>
  );
};
