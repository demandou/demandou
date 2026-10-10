// Cabeçalho da figura, ao lado da janela: o rótulo impresso do caderno e o título à mão,
// palavra por palavra no instante em que é dita (antes disso, esboçado a lápis).
// Qualquer título cabe: cada linha é medida e, se não couber, o texto é requebrado em até 3 linhas.
import { temposDoTexto } from "../anim";
import type { Regiao } from "../layout";
import { ajustar, caber, caberImpresso, largura } from "../medir";
import type { Cor, Palavra } from "../plano";
import { comDestaque, corDe, LinhaAMao } from "../tinta/Escrita";
import { cor, estiloImpresso } from "../tema";

// As linhas do título: as que o plano deu (se couberem) ou o texto requebrado no maior corpo possível
export const linhasDoTitulo = (titulo: string[] | string | undefined, larguraMax: number, max: number, min: number, linhasMax = 3) => {
  const dadas = (Array.isArray(titulo) ? titulo : titulo ? [titulo] : []).map((l) => l.trim()).filter(Boolean);
  if (!dadas.length) return { corpo: 0, linhas: [] as string[] };
  const cabe = (l: string, px: number) => largura(l, px, "mao") <= larguraMax;
  // linhas dadas pelo plano que cabem num corpo bom ficam como estão
  const confortavel = Math.max(min, 72);
  if (dadas.length <= linhasMax && dadas.every((l) => cabe(l, dadas.length === 1 ? confortavel : min))) {
    return { corpo: Math.min(...dadas.map((l) => caber(l, larguraMax, max, min))), linhas: dadas };
  }
  return ajustar(dadas.join(" "), larguraMax, max, min, linhasMax);
};

// Linha impressa do caderno ("FIG. 2 · BITCOIN"), sempre numa linha, encolhendo até 30 px
export const Impresso: React.FC<{ texto: string; larguraMax: number; estilo?: React.CSSProperties }> = ({ texto, larguraMax, estilo }) => (
  <div style={{ ...estiloImpresso, fontSize: caberImpresso(texto, larguraMax), ...estilo }}>{texto}</div>
);

export const Cabecalho: React.FC<{
  regiao: Regiao;
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  rotulo?: string;
  titulo?: string[] | string;
  destaque?: string;
  corDestaque?: Cor;
  // instante em que a folha chega
  chegada: number;
  // some enquanto a pessoa (saindo ou voltando da tela cheia) ainda passa por cima dele
  opacidade?: number;
  // quando o título começa a ser dito (padrão: o tempo de cada palavra é achado sozinho no momento)
  em?: number;
  // corpo máximo e mínimo do título
  max?: number;
  min?: number;
  // altura que fica livre embaixo do título (para um desenho do bloco dentro do cabeçalho)
  reservaAbaixo?: number;
  // cor do título (padrão: tinta)
  corTitulo?: string;
}> = ({ regiao, t, de, ate, palavras, rotulo, titulo, destaque, corDestaque, chegada, opacidade = 1, em, max = 104, min = 64, reservaAbaixo = 0, corTitulo }) => {
  const alturaRotulo = rotulo ? 96 : 0;
  const disponivel = regiao.h - alturaRotulo - reservaAbaixo;
  // até 3 linhas, sem passar da altura do cabeçalho
  const linhasMax = Math.max(1, Math.min(3, Math.floor(disponivel / (min * 1.12))));
  const { corpo, linhas } = linhasDoTitulo(titulo, regiao.w - 10, max, min, linhasMax);
  const corpoFinal = linhas.length ? Math.min(corpo, Math.floor(disponivel / (linhas.length * 1.12))) : 0;
  const tempos = temposDoTexto(linhas.join(" "), palavras, em ?? de, ate, Math.max(em ?? 0, chegada + 0.3));
  let k = 0;
  const porLinha = linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const ts = tempos.slice(k, k + n);
    k += n;
    return comDestaque(l, ts, destaque, corDe(corDestaque ?? "azul")).map((p) => ({ ...p, cor: p.cor ?? corTitulo }));
  });
  const alinharDireita = regiao.x > 540;
  return (
    <div style={{ position: "absolute", left: regiao.x, top: regiao.y, width: regiao.w, display: "flex", flexDirection: "column", alignItems: alinharDireita ? "flex-end" : "flex-start", opacity: opacidade }}>
      {rotulo ? <Impresso texto={rotulo} larguraMax={regiao.w} estilo={{ marginTop: 18 }} /> : null}
      {rotulo ? <div style={{ width: "100%", height: 3, background: cor.tinta, opacity: 0.55, marginTop: 14, marginBottom: 26 }} /> : null}
      {porLinha.map((ps, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : corpoFinal * 0.06 }}>
          <LinhaAMao palavras={ps} t={t} corpo={corpoFinal} alinhar={alinharDireita ? "flex-end" : "flex-start"} />
        </div>
      ))}
    </div>
  );
};
