import { prog, temposDaLinha, troca } from "../anim";
import type { Desenho, JanelaPosta, NegacaoPosta } from "../layout";
import type { Campo as CampoT, Cartaz as CartazT, Palavra, Plano } from "../plano";
import {
  CAMPOS,
  caixaAlta,
  display,
  LETREIRO_Y,
  letreiro,
  LUZ,
  MARGEM,
  QUADRO,
} from "../tema";
import { Campo, type Vazado } from "./Campo";
import { IconeChamada } from "./Icones";
import { LinhaDeTexto } from "./Texto";

type Cores = (typeof CAMPOS)[CampoT];

// As letras da janela: chegam um pouco maiores e assentam em volta do rosto; cada batida
// (outro "não", por exemplo) dá um pequeno golpe e assenta de novo.
// Nas listas, a janela é um contador: em cada troca ("01" → "02") as letras mudam secas e dão o golpe.
export const vazadoDaJanela = (t: number, j: JanelaPosta, origem: { x: number; y: number }): Vazado => {
  const p = prog(t, j.em - 0.05, 0.38);
  let escala = 1 + 0.32 * (1 - p);
  for (const b of j.batidas) if (t >= b - 0.02) escala *= 1 + 0.07 * (1 - prog(t, b - 0.02, 0.32));
  let linhas = j.linhas;
  for (const tr of j.trocas ?? []) {
    if (t < tr.em - 0.02) continue;
    linhas = tr.linhas.map((texto, k) => ({ texto, base: j.linhas[Math.min(k, j.linhas.length - 1)].base }));
    escala *= 1 + 0.07 * (1 - prog(t, tr.em - 0.02, 0.32));
  }
  return { linhas, tamanho: j.tamanho, abertura: Math.min(1, p * 1.8), escala, origem, circulo: j.circulo };
};

// O campo do pôster. A luz em volta do rosto acende junto com a abertura das letras: antes disso
// o campo é sólido (só o esboço da palavra).
export const CampoDoPoster: React.FC<{ id: string; c: Cores; d: Desenho; fantasma?: number; vazados: Vazado[] }> = ({
  id,
  c,
  d,
  fantasma,
  vazados,
}) => (
  <Campo
    id={id}
    cor={c.fundo}
    lapis={c.lapis}
    fantasma={fantasma}
    luz={{ x: d.alvo.x, y: d.alvo.y, rx: LUZ.rx * d.escala, ry: LUZ.ry * d.escala, forca: c.luz * (vazados[0]?.abertura ?? 0) }}
    vazados={vazados}
  />
);

// Letreiros fixos do pôster: número (Nº 01) à esquerda, área da marca à direita.
export const Letreiros: React.FC<{ numero: number; area: string; cor: string }> = ({ numero, area, cor }) => (
  <>
    <div style={{ ...letreiro, position: "absolute", left: MARGEM, top: LETREIRO_Y, color: cor }}>
      Nº {String(numero).padStart(2, "0")}
    </div>
    {area ? (
      <div style={{ ...letreiro, position: "absolute", right: MARGEM, top: LETREIRO_Y, color: cor, textAlign: "right" }}>{area}</div>
    ) : null}
  </>
);

// Uma negação: o começo da frase pequeno, a palavra negada grande, e o risco que passa por cima.
// As duas linhas já estão no lugar "a lápis" desde o começo do pôster; ganham tinta quando são ditas.
const Negacao: React.FC<{ n: NegacaoPosta; c: Cores; t: number; palavras: Palavra[]; fim: number }> = ({ n, c, t, palavras, fim }) => {
  const tempos = temposDaLinha(`${n.antes?.texto ?? ""} ${n.palavra.texto}`, n.em, palavras, fim);
  const nAntes = n.antes ? n.antes.texto.trim().split(/\s+/).length : 0;
  return (
    <>
      {n.antes ? (
        <LinhaDeTexto
          t={t}
          texto={n.antes.texto}
          tempos={tempos.slice(0, nAntes)}
          y={n.antes.y}
          tamanho={n.antes.tamanho}
          cor={c.texto}
          peso={700}
          lapis={c.lapis}
        />
      ) : null}
      <LinhaDeTexto
        t={t}
        texto={n.palavra.texto}
        tempos={[tempos[nAntes] ?? n.em]}
        y={n.palavra.y}
        tamanho={n.palavra.tamanho}
        cor={c.texto}
        risco={prog(t, n.riscoEm, 0.28, troca)}
        corRisco={c.acento}
        corRiscada={c.riscada}
        lapis={c.lapis}
      />
    </>
  );
};

// Assinatura do último pôster: nome grande e área em letreiro, sobre um filete.
export const Assinatura: React.FC<{ marca: Plano["marca"]; c: Cores; p: number }> = ({ marca, c, p }) => (
  <div
    style={{
      position: "absolute",
      left: MARGEM,
      right: MARGEM,
      top: QUADRO.h - 470,
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      borderTop: `4px solid ${c.texto}`,
      paddingTop: 22,
      opacity: p,
      translate: `0 ${(1 - p) * 18}px`,
    }}
  >
    <div style={{ fontFamily: display, fontWeight: 900, fontSize: 46, letterSpacing: "-0.01em", color: c.texto }}>
      {caixaAlta(marca.nome)}
    </div>
    <div style={{ ...letreiro, color: c.letreiro }}>{marca.area}</div>
  </div>
);

export const Cartaz: React.FC<{
  m: CartazT;
  d: Desenho;
  campo: CampoT;
  t: number;
  palavras: Palavra[];
  fim: number;
  numero: number;
  marca: Plano["marca"];
  fantasma?: number;
  // opacidade das letras pequenas (some antes do campo no mergulho de saída)
  textos?: number;
}> = ({ m, d, campo, t, palavras, fim, numero, marca, fantasma, textos = 1 }) => {
  const c = CAMPOS[campo];
  const vazados = d.janela ? [vazadoDaJanela(t, d.janela, d.alvo)] : [];
  const linha = (l: Desenho["topo"][number], chave: string, antes?: React.ReactNode) => (
    <LinhaDeTexto
      key={chave}
      t={t}
      texto={l.texto}
      tempos={temposDaLinha(l.texto, l.em, palavras, fim)}
      y={l.y}
      tamanho={l.tamanho}
      cor={l.acento ? c.acento : c.texto}
      peso={l.tamanho < 70 ? 700 : 900}
      antes={antes}
      lapis={c.lapis}
    />
  );

  return (
    <>
      <CampoDoPoster id={`c${m.de}`} c={c} d={d} fantasma={fantasma} vazados={vazados} />
      <div style={{ position: "absolute", inset: 0, opacity: textos }}>
        {/* no último pôster a área já aparece na assinatura */}
        <Letreiros numero={numero} area={m.fecho ? "" : marca.area} cor={c.letreiro} />
        {d.topo.map((l, i) =>
          linha(l, `t${i}`, i === 0 && m.fecho ? <IconeChamada icone={m.fecho.icone ?? "comentar"} cor={l.acento ? c.acento : c.texto} /> : undefined),
        )}
        {d.negacoes.map((n, i) => (
          <Negacao key={`n${i}`} n={n} c={c} t={t} palavras={palavras} fim={fim} />
        ))}
        {d.base.map((l, i) => linha(l, `b${i}`))}
        {m.fecho && marca.nome ? <Assinatura marca={marca} c={c} p={prog(t, m.de + 0.25, 0.4)} /> : null}
      </div>
    </>
  );
};
