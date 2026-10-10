// Como cada bloco universal entra numa página ou num frontispício.
// Página: a pessoa no quadro do alto; ao lado dela, a coluna estreita com a cabeça do verbete (o título
// do bloco, quando há) e a abonação (a fala do momento em itálico); embaixo, o corpo do bloco.
// Frontispício: a folha de baixo com o letreiro e o corpo do bloco.
import { prog } from "../anim";
import { areaDoFrontispicio, type Regiao } from "../layout";
import { encaixar, type Fonte } from "../medida";
import type { Momento, Palavra, Plano } from "../plano";
import { cor, LARGURA_UTIL, MARGEM } from "../tema";
import { Abonacao } from "./Abonacao";
import { ComparacaoBloco, DefinicaoBloco, DestaqueBloco, Epigrafe, Lista, medirTitulo, NumeroBloco, PerguntaBloco, temposDeTitulo, TituloDoBloco } from "./Blocos";
import { GraficoBloco } from "./Grafico";
import { ColunaDeVizinhos } from "./Pagina";
import { Letreiro, LinhasFaladas } from "./Texto";

const CABECA: Fonte = { familia: "serif", peso: 700 };

// o título que vai na cabeça da coluna (só os blocos que têm título)
export const tituloDe = (m: Momento) =>
  m.tipo === "topicos" || m.tipo === "passos" || m.tipo === "comparacao" || m.tipo === "grafico" ? m.titulo : undefined;

// A coluna estreita ao lado do quadro: o título do bloco como palavra-título (ameixa) e, embaixo, a abonação.
export const CabecaDaColuna: React.FC<{ titulo?: string; regiao: Regiao; t: number; palavras: Palavra[]; de: number; ate: number }> = ({
  titulo,
  regiao,
  t,
  palavras,
  de,
  ate,
}) => {
  let alturaTitulo = 0;
  let cabeca: React.ReactNode = null;
  if (titulo) {
    const e = encaixar(titulo, { largura: regiao.w, max: 78, min: 48, linhas: 3, fonte: CABECA, entrelinha: 1.04 });
    alturaTitulo = e.linhas.length * e.corpo * 1.04 + 40;
    cabeca = (
      <div style={{ position: "absolute", left: regiao.x, top: regiao.y, width: regiao.w }}>
        <LinhasFaladas linhas={e.linhas} corpo={e.corpo} entrelinha={1.04} fonte={CABECA} tempos={temposDeTitulo(titulo, palavras, de, ate)} t={t} cor={cor.ameixa} esboco="nada" />
        <div style={{ marginTop: 14, height: 2.5, width: 120 * prog(t, de + 0.1, 0.5), background: cor.ameixa }} />
      </div>
    );
  }
  return (
    <>
      {cabeca}
      <Abonacao regiao={{ ...regiao, y: regiao.y + alturaTitulo, h: regiao.h - alturaTitulo }} palavras={palavras} de={de} ate={ate} t={t} />
    </>
  );
};

// O corpo de um bloco universal dentro de uma região. `comTitulo` = desenhar o título dentro da região
// (quando não há coluna ao lado, como no frontispício).
export const CorpoDoBloco: React.FC<{ m: Momento; t: number; R: Regiao; palavras: Palavra[]; comTitulo: boolean; marca: Plano["marca"] }> = ({
  m,
  t,
  R,
  palavras,
  comTitulo,
  marca,
}) => {
  switch (m.tipo) {
    case "topicos":
    case "passos":
      return <Lista m={m} t={t} R={R} palavras={palavras} comTitulo={comTitulo} />;
    case "numero":
      return <NumeroBloco m={m} t={t} R={R} />;
    case "comparacao":
      return <ComparacaoBloco m={m} t={t} R={R} palavras={palavras} comTitulo={comTitulo} />;
    case "grafico": {
      if (comTitulo && m.titulo) {
        const { altura } = medirTitulo(m.titulo, R.w);
        return (
          <>
            <TituloDoBloco titulo={m.titulo} R={R} t={t} palavras={palavras} de={m.de} ate={m.ate} />
            <GraficoBloco m={m} t={t} R={{ ...R, y: R.y + altura, h: R.h - altura }} />
          </>
        );
      }
      return <GraficoBloco m={m} t={t} R={R} />;
    }
    case "destaque":
      return <DestaqueBloco m={m} t={t} R={R} palavras={palavras} />;
    case "definicao":
      return <DefinicaoBloco m={m} t={t} R={R} palavras={palavras} />;
    case "frase":
      return <Epigrafe m={m} t={t} R={R} palavras={palavras} assinatura={marca.nome || undefined} />;
    case "pergunta":
      return <PerguntaBloco m={m} t={t} R={R} palavras={palavras} />;
    default:
      return null;
  }
};

// Página de um bloco universal: coluna estreita (cabeça + abonação, ou vizinhos de verdade na definição)
// e o corpo embaixo do quadro.
export const PaginaDoBloco: React.FC<{
  m: Momento;
  t: number;
  areas: { conteudo: Regiao; vizinhos: Regiao | null };
  palavras: Palavra[];
  marca: Plano["marca"];
}> = ({ m, t, areas, palavras, marca }) => {
  const vizinhos = m.tipo === "definicao" ? m.vizinhos?.antes : undefined;
  return (
    <>
      {areas.vizinhos ? (
        vizinhos?.length ? (
          <ColunaDeVizinhos regiao={areas.vizinhos} lista={vizinhos} doFim />
        ) : (
          <CabecaDaColuna titulo={tituloDe(m)} regiao={areas.vizinhos} t={t} palavras={palavras} de={m.de} ate={m.ate} />
        )
      ) : null}
      <CorpoDoBloco m={m} t={t} R={areas.conteudo} palavras={palavras} comTitulo={!areas.vizinhos} marca={marca} />
    </>
  );
};

// Letreiro do alto da folha do frontispício, com o fio que se desenha
export const LetreiroDaFolha: React.FC<{ texto: string; t: number; em: number }> = ({ texto, t, em }) => {
  const p = prog(t, em, 0.3);
  return (
    <div style={{ position: "absolute", left: MARGEM, top: 36, width: LARGURA_UTIL, opacity: p }}>
      <Letreiro texto={texto} />
      <div style={{ marginTop: 20, height: 2.5, width: `${prog(t, em, 0.6) * 100}%`, background: cor.tinta, opacity: 0.75 }} />
    </div>
  );
};

// Um bloco universal no frontispício (pergunta, destaque, frase… ou qualquer um com "layout": "frontispicio")
export const FrontispicioDoBloco: React.FC<{ m: Momento; t: number; topo: number; palavras: Palavra[]; marca: Plano["marca"] }> = ({
  m,
  t,
  topo,
  palavras,
  marca,
}) => {
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const R = areaDoFrontispicio(topo, !!m.legenda);
  return (
    <>
      {/* a epígrafe já assina embaixo da frase; os outros levam o letreiro com o nome */}
      {assinatura && m.tipo !== "frase" ? <LetreiroDaFolha texto={assinatura} t={t} em={m.de + 0.1} /> : null}
      <CorpoDoBloco m={m} t={t} R={R} palavras={palavras} comTitulo marca={marca} />
    </>
  );
};
