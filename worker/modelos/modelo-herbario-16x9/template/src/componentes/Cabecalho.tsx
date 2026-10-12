import { Escrita, prog, temposDoTexto } from "../anim";
import type { Regiao } from "../layout";
import { encaixar, encaixarLinhas, larguraTexto } from "../medida";
import type { Palavra } from "../plano";
import { cor, corpo, corpoQueCabe, serif, versalete } from "../tema";

export const romano = (n: number) => ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] ?? String(n);

// O título do cabeçalho: linhas dadas pelo plano (formato antigo da figura) ou uma frase que se quebra
// sozinha em até 3 linhas. O corpo vai de 112 px até 72 px; nunca vaza da largura.
export const tituloQueCabe = (titulo: string[] | string, largura: number, maximo = corpo.titulo, italico = false) => {
  const fonte = italico ? "italico" : "serif";
  if (Array.isArray(titulo)) {
    // o cálculo de sempre (o demo foi aprovado assim), conferido com a medida real da fonte
    const estimado = corpoQueCabe(titulo, largura, maximo, Math.min(76, maximo));
    const medido = encaixarLinhas(titulo, { largura, max: estimado, min: Math.min(64, estimado), fonte });
    return medido;
  }
  return encaixar(titulo, { largura, max: maximo, min: 64, linhas: 3, fonte });
};

// Cabeçalho de figura: rótulo em versalete com o índice de medalhões (I II III), um fio de pena,
// o título que se escreve na fala e, se houver, a frase de apoio em itálico.
export const Cabecalho: React.FC<{
  area: Regiao;
  rotulo: string;
  titulo: string[] | string;
  // título em itálico (o nome de uma determinação)
  italico?: boolean;
  destaque?: string;
  apoio?: string;
  // índice de medalhões: quantos e qual está aceso
  indice?: { total: number; atual: number };
  palavras: Palavra[];
  de: number;
  ate: number;
  // quando o cabeçalho fica legível (a lápis)
  chegada: number;
  t: number;
  saida: number;
  // quando o título começa a ser dito (padrão: `de`)
  tituloEm?: number;
}> = ({ area, rotulo, titulo, destaque, apoio, indice, palavras, de, ate, chegada, t, saida, italico, tituloEm }) => {
  if (saida >= 1) return null;
  // o índice de medalhões ocupa a direita da linha do rótulo: o rótulo encolhe antes de encostar nele
  const larguraIndice = indice ? indice.total * 70 : 0;
  const rotuloCabe = (tam: number) => larguraTexto(rotulo, tam, "versalete", { espaco: 0.3, espacamento: 0.1, caixaAlta: true }) <= area.w - larguraIndice - 12;
  let tamanhoRotulo = corpo.rotulo;
  while (tamanhoRotulo > 30 && !rotuloCabe(tamanhoRotulo)) tamanhoRotulo -= 1;
  // No quadro deitado o cabeçalho divide a coluna da direita com o oval: além da largura, ele cabe na
  // altura da área (rótulo, fio, título e apoio). O título encolhe primeiro, depois o apoio.
  const alturaDe = (e: { tamanho: number; linhas: string[] }, a: { tamanho: number; linhas: string[] } | null) =>
    60 + 36.5 + e.linhas.length * e.tamanho * 1.0 + (a ? 18 + a.linhas.length * a.tamanho * 1.08 : 0);
  let maxTitulo = corpo.titulo;
  let maxApoio = corpo.apoio;
  let encaixe = tituloQueCabe(titulo, area.w, maxTitulo, italico);
  let encaixeApoio = apoio ? encaixar(apoio, { largura: area.w, max: maxApoio, min: 40, linhas: 2, fonte: "italico" }) : null;
  while (alturaDe(encaixe, encaixeApoio) > area.h && (maxTitulo > 64 || maxApoio > 40)) {
    if (maxTitulo > 64) maxTitulo -= 4;
    else maxApoio -= 2;
    encaixe = tituloQueCabe(titulo, area.w, maxTitulo, italico);
    encaixeApoio = apoio ? encaixar(apoio, { largura: area.w, max: maxApoio, min: Math.min(40, maxApoio), linhas: 2, fonte: "italico" }) : null;
  }
  const tamanho = encaixe.tamanho;
  const linhasTitulo = encaixe.linhas;
  const temposTitulo = temposDoTexto(linhasTitulo.join(" "), palavras, tituloEm ?? de, ate, tituloEm ?? de);
  const temposApoio = apoio ? temposDoTexto(apoio, palavras, de, ate, de) : [];
  const temposRotulo = temposDoTexto(rotulo, palavras, de, ate, de);
  const lapis = prog(t, chegada - 0.3, 0.3);
  const fio = prog(t, de, 0.6);
  const acende = indice ? prog(t, de + 0.1, 0.4) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.w,
        height: area.h,
        opacity: 1 - saida,
        translate: `${-40 * saida}px 0`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <Escrita
          linhas={[rotulo]}
          tempos={temposRotulo.map((x) => Math.min(x, de + 0.15))}
          t={t}
          tamanho={tamanhoRotulo}
          familia={versalete}
          peso={700}
          corTinta={cor.musgo}
          lapis={lapis}
          estilo={{ letterSpacing: "0.1em", whiteSpace: "nowrap", textTransform: "uppercase" }}
        />
        {indice ? (
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: indice.total }, (_, i) => {
              const aceso = i + 1 === indice.atual;
              const feito = i + 1 < indice.atual;
              return (
                <div
                  key={i}
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    border: `2.5px solid ${aceso ? cor.musgo : feito ? cor.tinta : cor.grafite}`,
                    background: aceso ? `rgba(47,91,69,${0.92 * acende})` : "transparent",
                    color: aceso && acende > 0.5 ? cor.etiqueta : feito ? cor.tinta : cor.grafite,
                    fontFamily: versalete,
                    fontWeight: 700,
                    fontSize: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    paddingBottom: 2,
                  }}
                >
                  {romano(i + 1)}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div style={{ height: 2.5, background: cor.tinta, opacity: 0.85, margin: "12px 0 22px", transformOrigin: "left", scale: `${Math.max(0.001, fio)} 1` }} />
      <Escrita
        linhas={linhasTitulo}
        tempos={temposTitulo}
        t={t}
        tamanho={tamanho}
        familia={serif}
        peso={italico ? 600 : 700}
        italico={italico}
        corTinta={italico ? cor.musgo : cor.tinta}
        destaque={destaque}
        lapis={lapis}
        entrelinha={1.0}
      />
      {apoio && encaixeApoio ? (
        <Escrita
          linhas={encaixeApoio.linhas}
          tempos={temposApoio}
          t={t}
          tamanho={encaixeApoio.tamanho}
          familia={serif}
          peso={600}
          italico
          corTinta={cor.musgo}
          lapis={lapis}
          entrelinha={1.08}
          estilo={{ marginTop: 18 }}
        />
      ) : null}
    </div>
  );
};
