// A ficha: o painel de papel na altura do peito. Nos momentos de quadro cheio ele fica sobre a pessoa;
// no rótulo ele vira a parte de baixo do rótulo. As fichas de cada momento passam por dentro dele
// (a que sai vai para a esquerda enquanto a próxima chega pela direita, sempre com conteúdo).
import { firme, misturaCor, prog } from "../anim";
import { type Leitura, noRotulo, rotuloLivre, textosDasVagas } from "../layout";
import type { Medidor } from "../medida";
import type { Momento, Plano, Rotulo } from "../plano";
import { cor } from "../tema";
import { FichaComparacao, FichaDefinicao, FichaDestaque, FichaFrase, FichaGrafico, FichaMedidor, FichaNumero, FichaPassos, FichaPergunta, FichaTopicos } from "./Blocos";
import { CABECALHO, FichaAbertura, FichaAno, FichaCta, FichaNota, FichaOrigem, FichaTeor, FichaVariedade, MARGEM } from "./Fichas";
import { contornoConcavo } from "./Rotulo";

// Cabeçalho de cada momento: o do plano; senão, o nome do campo que a lupa lê; senão, o padrão do tipo.
export const tituloDoMomento = (m: Momento, paradas: Leitura["paradas"][number], r: Rotulo): string => {
  if ("titulo" in m && m.titulo) return m.titulo;
  const bebida = !rotuloLivre(r);
  // os tipos do exemplo de bebida mantêm os cabeçalhos do exemplo
  if (bebida) {
    if (m.tipo === "origem") return "País e região";
    if (m.tipo === "variedade") return "Uva";
    if (m.tipo === "ano") return r.anoRotulo ?? "Safra";
    if (m.tipo === "teor") return "Teor alcoólico";
  }
  if (m.tipo === "abertura") return "Ficha técnica";
  if (m.tipo === "cta") return "";
  const vaga = paradas[0]?.vaga;
  const campo = vaga ? textosDasVagas(r)[vaga] : null;
  if (campo?.nome && m.tipo !== "pergunta") return campo.nome;
  switch (m.tipo) {
    case "topicos":
      return "Em pontos";
    case "passos":
      return "Passo a passo";
    case "numero":
      return "Em números";
    case "comparacao":
      return m.modo === "antes-depois" ? "Antes e depois" : m.modo === "errado-certo" ? "Errado e certo" : "Lado a lado";
    case "grafico":
      return m.dados?.length ? "Em números" : "Tendência";
    case "destaque":
      return m.nivel === "chave" ? "Importante" : "Atenção";
    case "definicao":
      return "Definição";
    case "frase":
      return "Em uma frase";
    case "pergunta":
      return "Pergunta";
    case "medidor":
      return "Medidor";
    case "origem":
      return "Lugar";
    case "variedade":
      return "Exemplos";
    case "ano":
      return "Ano";
    case "teor":
      return "Teor";
    default:
      return vaga === "nome" ? r.nome : "Ficha";
  }
};

type Extras = { plano: Plano; t: number; w: number; h: number; medir: Medidor; numero?: number; titulo: string; largTitulo: number };

const conteudo = (m: Momento, props: Extras, valorDoCampo?: string) => {
  switch (m.tipo) {
    case "abertura":
      return <FichaAbertura m={m} {...props} />;
    case "topicos":
      return <FichaTopicos m={m} {...props} />;
    case "passos":
      return <FichaPassos m={m} {...props} />;
    case "numero":
      return <FichaNumero m={m} {...props} />;
    case "comparacao":
      return <FichaComparacao m={m} {...props} />;
    case "grafico":
      return <FichaGrafico m={m} {...props} />;
    case "destaque":
      return <FichaDestaque m={m} {...props} />;
    case "definicao":
      return <FichaDefinicao m={m} {...props} />;
    case "frase":
      return <FichaFrase m={m} {...props} />;
    case "pergunta":
      return <FichaPergunta m={m} {...props} />;
    case "cta":
      return <FichaCta m={m} {...props} />;
    case "campo":
    case "nota":
      return <FichaNota m={m} {...props} valorPadrao={valorDoCampo} />;
    case "medidor":
      return <FichaMedidor m={m} {...props} />;
    case "origem":
      return <FichaOrigem m={m} {...props} />;
    case "variedade":
      return <FichaVariedade m={m} {...props} />;
    case "ano":
      return <FichaAno m={m} {...props} />;
    case "teor":
      return <FichaTeor m={m} {...props} />;
    default:
      return null;
  }
};

export const Ficha: React.FC<{
  momentos: Momento[];
  leitura: Leitura;
  plano: Plano;
  t: number;
  medir: Medidor;
  geo: { x: number; y: number; w: number; h: number };
  // 0 = sobre a pessoa (sombra), 1 = impressa no rótulo
  nivel: number;
}> = ({ momentos, leitura, plano, t, medir, geo, nivel }) => {
  const { w, h } = geo;
  // a ficha some descendo nos trechos sem momento (pessoa sozinha, com legenda)
  const presenca = Math.max(0, ...momentos.map((m) => Math.min(m.de <= 0.05 ? 1 : prog(t, m.de - 0.55, 0.55), 1 - prog(t, m.ate, 0.5, firme))));
  if (presenca <= 0.001) return null;
  const vagas = leitura.ordem;
  const vagasDoRotulo = textosDasVagas(plano.rotulo);
  // a vaga que a lupa lê agora: a da última parada já começada
  let atual: string | null = null;
  let emAtual = -Infinity;
  leitura.paradas.forEach((ps, i) => {
    const m = momentos[i];
    if (t < m.de - 0.14 || t >= m.ate + 0.3) return;
    ps.forEach((p) => {
      if (p.em - 0.14 <= t && p.em >= emAtual) {
        emAtual = p.em;
        atual = p.vaga;
      }
    });
  });
  const fecho = momentos.find((m) => m.tipo === "cta");
  const encerrado = !!fecho && t >= fecho.de - 0.14;
  // no fechamento o índice dá lugar à fita de "salvar"
  const indice = fecho ? 1 - prog(t, fecho.de - 0.14, 0.4) : 1;
  const sombra = 1 - nivel;
  // largura livre para o título do cabeçalho (o índice ocupa a direita)
  const reservaIndice = vagas.length ? 52 + vagas.length * 36 + 22 : 0;
  const largTitulo = w - MARGEM - reservaIndice - 20;
  return (
    <div style={{ position: "absolute", left: geo.x, top: geo.y + (1 - presenca) * (h + 160), width: w, height: h }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id="sombra-da-ficha" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx={0} dy={18} stdDeviation={18} floodColor="#0B0806" floodOpacity={0.45 * sombra} />
          </filter>
        </defs>
        <path d={contornoConcavo(0, 0, w, h, 26)} fill={cor.papel} filter="url(#sombra-da-ficha)" />
        <path d={contornoConcavo(10, 10, w - 20, h - 20, 22)} fill="none" stroke={cor.tinta} strokeWidth={3.5} />
        <path d={contornoConcavo(19, 19, w - 38, h - 38, 18)} fill="none" stroke={cor.vinho} strokeWidth={2} />
        <rect x={19} y={19} width={w - 38} height={CABECALHO - 19} fill={cor.papelEscuro} opacity={0.55} />
        <line x1={19} x2={w - 19} y1={CABECALHO} y2={CABECALHO} stroke={cor.tinta} strokeWidth={2.5} />
        {/* índice dos campos: um losango por campo lido, preenchido quando a lupa já passou por ele */}
        <g opacity={indice}>
          {vagas.map((v, i) => {
            const x = w - 52 - (vagas.length - 1 - i) * 36;
            const lidaEm = leitura.lidaEm[v] ?? Infinity;
            const lido = encerrado || t >= lidaEm;
            const p = encerrado ? 1 : prog(t, lidaEm, 0.4);
            const daVez = v === atual && !encerrado;
            const r = 10 + (daVez ? 3 : 0);
            return (
              <path
                key={v}
                d={`M ${x} ${58 - r} L ${x + r} ${58} L ${x} ${58 + r} L ${x - r} ${58} Z`}
                fill={lido ? misturaCor(cor.papel, cor.vinho, p) : "none"}
                stroke={misturaCor(cor.lapis, cor.vinho, lido ? 1 : 0)}
                strokeWidth={2.5}
              />
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 21, top: 21, width: w - 42, height: h - 42, overflow: "hidden" }}>
        {momentos.map((m, i) => {
          const antes = momentos[i - 1];
          const depois = momentos[i + 1];
          const colaAntes = antes && Math.abs(antes.ate - m.de) < 0.01;
          const colaDepois = depois && Math.abs(m.ate - depois.de) < 0.01;
          const entra = colaAntes ? prog(t, m.de - 0.14, 0.55, firme) : t >= m.de - 0.6 ? 1 : 0;
          const sai = colaDepois ? prog(t, depois.de - 0.14, 0.55, firme) : t >= m.ate + 0.5 ? 1 : 0;
          if (entra <= 0 || sai >= 1) return null;
          const x = (1 - entra) * w - sai * w;
          const paradas = leitura.paradas[i] ?? [];
          const vaga = paradas[0]?.vaga;
          const numero = noRotulo(m) && vaga ? leitura.numero[vaga] : undefined;
          const titulo = tituloDoMomento(m, paradas, plano.rotulo);
          const valorDoCampo = vaga ? vagasDoRotulo[vaga]?.valor : undefined;
          return (
            <div key={`${m.tipo}-${m.de}`} style={{ position: "absolute", left: -21 + x, top: -21, width: w, height: h }}>
              {conteudo(m, { plano, t, w, h, medir, numero, titulo, largTitulo: m.tipo === "cta" ? w - 2 * MARGEM : largTitulo }, valorDoCampo)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
