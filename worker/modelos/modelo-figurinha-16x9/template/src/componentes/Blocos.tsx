// Os blocos da página do álbum. No quadro deitado (16:9) a pessoa é a figurinha especial na MOLDURA
// da direita (aula 9 do curso); no QUADRO da esquerda, o título se escreve no alto (com o cachorro
// espiando na ponta da linha) e o conteúdo é colado embaixo, de margem a margem do quadro, como
// figurinhas. Nada de pilha alta: listas de 4 ou 5 itens viram duas colunas.
// - topicos: casas do álbum a lápis; cada item cola como uma figurinha colorida na sua palavra;
// - passos: selos numerados ligados por uma trilha que se desenha passo a passo, com tiras de papel;
// - comparacao: duas figurinhas lado a lado, com selo VS/seta e carimbos ✗/✓;
// - grafico: uma figurinha de papel quadriculado com o gráfico desenhado a tinta;
// - definicao: o termo na frente de uma figurinha grande; no significado, ela vira e mostra o verso.
// Tudo o que vai ser colado já aparece a lápis antes (nada de caixa vazia); todo texto é medido.
import { Easing } from "remotion";
import { indicesDoTrecho, limitar, mistura, Palavras, prog, temposDoTexto, Traco } from "../anim";
import { colunaDaPagina, type Lado } from "../layout";
import { alturaDe, CORPO, encaixar, encaixarNaAltura, type Encaixe, formatar, larguraPalavra, ROTULO, TITULO } from "../medida";
import type { Comparacao as ComparacaoT, Definicao as DefinicaoT, Grafico as GraficoT, ItemDeLista, Palavra, Passos as PassosT, Topicos as TopicosT } from "../plano";
import { CONTEUDO, COLUNA, cor, corpo, fundos, H, rotulo, titulo, W } from "../tema";
import { Carimbo } from "./Carimbo";
import { Cao, type ReacaoNoTempo } from "./Cao";
import { Desenho, fundoDoDesenho } from "./Desenhos";
import { colando, Figurinha, sombraDePapel } from "./Figurinha";

type Props<M> = { m: M; palavras: Palavra[]; t: number; lado: Lado; mascote: boolean };

const FUNDOS = [fundos.rosa, fundos.manteiga, fundos.menta, fundos.ceu, fundos.lavanda, fundos.pessego];

// ---------- o cabeçalho: título na coluna ao lado da pessoa + o cachorro ----------

// O título se escreve no alto do quadro da esquerda; o cachorro (o mesmo do álbum) espia na ponta da
// linha do título, do lado da pessoa, apoiado na beirada do conteúdo: inteiro quando cabe, só
// cabeça e peito quando não cabe. Desenhado depois do conteúdo: as patas apoiam na figurinha de cima.
const Cabecalho: React.FC<{
  titulo?: string;
  de: number;
  ate: number;
  palavras: Palavra[];
  t: number;
  lado: Lado;
  mascote: boolean;
  reacoes: ReacaoNoTempo[];
}> = ({ titulo: tit, de, ate, palavras, t, lado, mascote, reacoes }) => {
  const col = colunaDaPagina(lado);
  const base = CONTEUDO.y + 22;
  // a altura da linha do título, do topo até a beirada do conteúdo
  const livre = base - COLUNA.y;
  // inteiro (sentado) se couber com pelo menos 300 px de largura; senão, o busto
  const inteiro = Math.min(400, col.w * 0.3, livre / (420 / 330));
  const busto = Math.min(250, livre / ((330 / 260) * 0.8));
  const modo = !mascote ? null : inteiro >= 300 ? "inteiro" : busto >= 150 ? "busto" : null;
  const larguraCao = modo === "inteiro" ? inteiro : modo === "busto" ? busto : 0;
  // o título ocupa a linha até o cachorro
  const larguraTitulo = col.w - (larguraCao ? larguraCao + 40 : 0);
  const enc = tit
    ? encaixarNaAltura(tit, { largura: larguraTitulo, max: 84, min: 52, linhas: 2, altura: CONTEUDO.y - 24 - COLUNA.y, entrelinha: 1.04, ...TITULO })
    : null;
  const tempos = tit ? temposDoTexto(tit, palavras, de - 0.3, ate, de + 0.05) : [];
  const pCao = prog(t, de + 0.25, 0.45);
  // na ponta direita da linha, olhando para a pessoa (na moldura, logo ao lado)
  const xCao = col.x + col.w - larguraCao - 8;
  const olhar = lado === "esquerda" ? -0.6 : 0.6;
  return (
    <>
      {enc && tit ? (
        <div style={{ position: "absolute", left: col.x, top: COLUNA.y, width: larguraTitulo }}>
          <Palavras
            texto={tit}
            tempos={tempos}
            t={t}
            quebras={enc.quebras}
            style={{ ...titulo(enc.tamanho), lineHeight: 1.04 }}
            corDe={() => cor.tinta}
            esboco={cor.lapisClaro}
          />
        </div>
      ) : null}
      {modo === "inteiro" ? (
        <div style={{ position: "absolute", left: xCao, top: base - inteiro * (420 / 330), opacity: limitar(pCao * 2), translate: `0 ${mistura(40, 0, pCao)}px` }}>
          <Cao t={t} reacoes={reacoes} largura={inteiro} olhar={olhar} espelhar={olhar > 0} />
        </div>
      ) : null}
      {modo === "busto" ? (
        <div
          style={{
            position: "absolute",
            left: xCao,
            top: CONTEUDO.y + 4 - busto * (330 / 260) * 0.8,
            width: busto,
            height: busto * (330 / 260) * 0.8,
            overflow: "hidden",
          }}
        >
          <div style={{ translate: `0 ${mistura(busto, 0, pCao)}px` }}>
            <Cao t={t} reacoes={reacoes} largura={busto} busto olhar={olhar} />
          </div>
        </div>
      ) : null}
    </>
  );
};

// ---------- peças comuns ----------

// casa a lápis (esboço do que vai ser colado): traço tracejado e fundo de papel
const CasaLapis: React.FC<{ x: number; y: number; w: number; h: number; raio?: number; vez?: number; children?: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  raio = 24,
  vez = 0,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: raio,
      border: `${mistura(3, 4.5, vez)}px dashed ${vez > 0.5 ? cor.tintaSuave : cor.lapis}`,
      background: `rgba(231,218,196,${mistura(0.5, 0.72, vez)})`,
    }}
  >
    {children}
  </div>
);

// número redondo (tinta) de um item
const NumeroRedondo: React.FC<{ n: number; d: number; lapis?: boolean }> = ({ n, d, lapis }) => (
  <div
    style={{
      flex: "none",
      width: d,
      height: d,
      borderRadius: d / 2,
      background: lapis ? "transparent" : cor.tinta,
      border: lapis ? `3px solid ${cor.lapis}` : undefined,
      color: lapis ? cor.lapis : cor.cartela,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...titulo(Math.round(d * 0.52)),
      paddingBottom: d * 0.04,
    }}
  >
    {n}
  </div>
);

// texto de um item: o nome (título) e o detalhe (corpo), medidos para caber na altura
const encaixeDoItem = (item: ItemDeLista, largura: number, altura: number, maxTitulo = 66) => {
  let melhor: { enc: Encaixe; det: Encaixe | null } | null = null;
  const alturaDo = (e: { enc: Encaixe; det: Encaixe | null }) => alturaDe(e.enc, 1.02) + (e.det ? 6 + alturaDe(e.det, 1.14) : 0);
  for (let max = maxTitulo; max >= 44; max -= 4) {
    const enc = encaixar(item.texto, { largura, max, min: 44, linhas: 2, ...TITULO });
    const det = item.detalhe ? encaixar(item.detalhe, { largura, max: Math.min(42, max * 0.7), min: 34, linhas: 2, ...CORPO }) : null;
    melhor = { enc, det };
    if (alturaDo(melhor) <= altura) break;
  }
  // nem no mínimo coube com o detalhe: fica só o nome (nada vaza da figurinha)
  const e = melhor as { enc: Encaixe; det: Encaixe | null };
  if (e.det && alturaDo(e) > altura) return { enc: encaixarNaAltura(item.texto, { largura, max: maxTitulo, min: 40, linhas: 3, altura, entrelinha: 1.02, ...TITULO }), det: null };
  return e;
};

// As casas dos itens no conteúdo: até 3 itens, uma por linha (de margem a margem do quadro); 4 ou
// 5, em duas colunas (no quadro deitado não cabe uma pilha de 5). `porColuna`: a ordem desce a
// primeira coluna e depois a segunda (os passos, com a trilha); sem ele, a ordem é por linha e um
// último item sozinho fica no meio (os tópicos).
type Casa = { x: number; y: number; w: number; h: number; coluna: number; duas: boolean };
const casasDosItens = (n: number, hMax: number, porColuna = false): Casa[] => {
  const gap = 22;
  if (n <= 3) {
    const h = Math.min(hMax, (CONTEUDO.h - (n - 1) * gap) / n);
    const total = n * h + (n - 1) * gap;
    const y0 = CONTEUDO.y + Math.max(0, (CONTEUDO.h - total) * 0.2);
    return Array.from({ length: n }, (_, i) => ({ x: CONTEUDO.x, y: y0 + i * (h + gap), w: CONTEUDO.w, h, coluna: 0, duas: false }));
  }
  const linhas = Math.ceil(n / 2);
  const w = (CONTEUDO.w - gap) / 2;
  const h = Math.min(hMax, (CONTEUDO.h - (linhas - 1) * gap) / linhas);
  const total = linhas * h + (linhas - 1) * gap;
  const y0 = CONTEUDO.y + Math.max(0, (CONTEUDO.h - total) * 0.2);
  return Array.from({ length: n }, (_, i) => {
    const coluna = porColuna ? (i < linhas ? 0 : 1) : i % 2;
    const linha = porColuna ? (i < linhas ? i : i - linhas) : Math.floor(i / 2);
    const sozinho = !porColuna && i === n - 1 && n % 2 === 1;
    const x = sozinho ? CONTEUDO.x + (CONTEUDO.w - w) / 2 : CONTEUDO.x + coluna * (w + gap);
    return { x, y: y0 + linha * (h + gap), w, h, coluna, duas: true };
  });
};

const TextoDoItem: React.FC<{
  item: ItemDeLista;
  e: { enc: Encaixe; det: Encaixe | null };
  palavras: Palavra[];
  t: number;
  ate: number;
  lapis: boolean;
}> = ({ item, e, palavras, t, ate, lapis }) => {
  const tempos = temposDoTexto(item.texto, palavras, item.em - 0.15, ate, item.em - 0.05);
  const fimNome = (tempos[tempos.length - 1] ?? item.em) + 0.15;
  const temposDet = item.detalhe ? temposDoTexto(item.detalhe, palavras, fimNome - 0.3, ate, fimNome) : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
      <Palavras
        texto={item.texto}
        tempos={lapis ? tempos.map(() => 1e6) : tempos}
        t={t}
        quebras={e.enc.quebras}
        style={{ ...titulo(e.enc.tamanho) }}
        corDe={() => cor.tinta}
        esboco={cor.lapis}
      />
      {item.detalhe && e.det ? (
        <Palavras
          texto={item.detalhe}
          tempos={lapis ? temposDet.map(() => 1e6) : temposDet}
          t={t}
          quebras={e.det.quebras}
          style={{ ...corpo(e.det.tamanho, 760), marginTop: 6 }}
          corDe={() => cor.tintaSuave}
          esboco={cor.lapis}
        />
      ) : null}
    </div>
  );
};

const desenhoDoItemDeLista = (item: ItemDeLista) => item.desenho ?? item.icone;

// ---------- topicos: casas do álbum ----------

export const Topicos: React.FC<Props<TopicosT>> = ({ m, palavras, t, lado, mascote }) => {
  const itens = m.itens.slice(0, 5);
  const casas = casasDosItens(itens.length, 250);
  const temDesenho = itens.some((i) => desenhoDoItemDeLista(i));
  const reacoes: ReacaoNoTempo[] = [{ em: m.de, r: "atento" }, ...itens.map((i, k) => ({ em: i.em + 0.2, r: k % 2 ? ("atento" as const) : ("curioso" as const) }))];
  return (
    <>
      {itens.map((item, i) => {
        const { x: xc, y, w: wc, h, duas } = casas[i];
        const marca = temDesenho ? Math.min(h - 44, duas ? 120 : 170) : Math.min(84, h - 56);
        const larguraTexto = wc - 24 - 56 - marca - 26;
        const proximo = itens[i + 1]?.em ?? m.ate;
        const e = encaixeDoItem(item, larguraTexto, h - 24 - 36, 80);
        const desenho = desenhoDoItemDeLista(item);
        const vez = t >= item.em - 0.6 && t < item.em ? prog(t, item.em - 0.6, 0.3) : 0;
        const c = colando(t, item.em - 0.08, 0.42);
        const colado = t >= item.em - 0.1;
        const inclinacao = i % 2 ? 0.9 : -1.1;
        const fundo = desenho ? fundos[fundoDoDesenho[desenho]] : FUNDOS[i % FUNDOS.length];
        const conteudo = (lapis: boolean) => (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 26, padding: "0 28px" }}>
            {desenho ? (
              <div style={{ flex: "none", width: marca, height: marca }}>
                <Desenho nome={desenho} tamanho={marca} lapis={lapis} />
              </div>
            ) : (
              <NumeroRedondo n={i + 1} d={marca} lapis={lapis} />
            )}
            <TextoDoItem item={item} e={e} palavras={palavras} t={t} ate={proximo} lapis={lapis} />
          </div>
        );
        return (
          <div key={i}>
            {c.p < 1 ? (
              <CasaLapis x={xc + 12} y={y + 12} w={wc - 24} h={h - 24} vez={vez}>
                <div style={{ position: "absolute", inset: -12 }}>{conteudo(true)}</div>
              </CasaLapis>
            ) : null}
            {colado ? (
              <div style={{ position: "absolute", left: xc, top: y, width: wc, height: h, rotate: `${inclinacao + c.giro}deg`, ...c.style }}>
                <Figurinha w={wc} h={h} fundo={fundo} raio={28} borda={12} levanta={0.06}>
                  <div style={{ position: "absolute", inset: -12 }}>{conteudo(false)}</div>
                </Figurinha>
              </div>
            ) : null}
          </div>
        );
      })}
      <Cabecalho titulo={m.titulo} de={m.de} ate={itens[0]?.em ?? m.ate} palavras={palavras} t={t} lado={lado} mascote={mascote} reacoes={reacoes} />
    </>
  );
};

// ---------- passos: a trilha de selos ----------

export const Passos: React.FC<Props<PassosT>> = ({ m, palavras, t, lado, mascote }) => {
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  // até 3 passos, uma trilha só descendo; 4 ou 5, duas colunas (a trilha desce a primeira e
  // recomeça no alto da segunda; o número de cada selo guarda a ordem)
  const casas = casasDosItens(itens.length, 240, true);
  const h = casas[0]?.h ?? 200;
  const duas = !!casas[0]?.duas;
  const d = Math.min(duas ? 104 : 128, h - 34);
  const cxDe = (i: number) => casas[i].x + 14 + d / 2;
  const xTiraDe = (i: number) => casas[i].x + d + (duas ? 38 : 50);
  const wTiraDe = (i: number) => casas[i].x + casas[i].w - xTiraDe(i);
  const temDesenho = itens.some((i) => desenhoDoItemDeLista(i));
  // em duas colunas a tira é estreita: o desenho sai e o texto fica com a largura toda
  const marca = temDesenho && !duas ? Math.min(h - 50, 150) : 0;
  const larguraTexto = wTiraDe(0) - 24 - 56 - (marca ? marca + 22 : 0);
  const centro = (i: number) => casas[i].y + h / 2;
  const reacoes: ReacaoNoTempo[] = [{ em: m.de, r: "atento" }, ...itens.map((i) => ({ em: i.em + 0.2, r: "querendo" as const })), { em: (itens[n - 1]?.em ?? m.de) + 1.2, r: "feliz" }];
  return (
    <>
      {/* a trilha: a lápis desde o começo; a tinta avança até o passo dito */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {itens.slice(1).map((item, k) => {
          // a trilha liga passos da mesma coluna
          if (casas[k].coluna !== casas[k + 1].coluna) return null;
          const cx = cxDe(k);
          const y1 = centro(k) + d / 2 + 4;
          const y2 = centro(k + 1) - d / 2 - 4;
          const dd = `M${cx} ${y1} C ${cx + 26} ${y1 + (y2 - y1) * 0.35}, ${cx - 26} ${y1 + (y2 - y1) * 0.65}, ${cx} ${y2}`;
          return (
            <g key={k}>
              <path d={dd} fill="none" stroke={cor.lapis} strokeWidth={5} strokeDasharray="4 12" strokeLinecap="round" />
              <Traco d={dd} p={prog(t, item.em - 0.35, 0.4, Easing.inOut(Easing.quad))} cor={cor.tinta} largura={7} />
            </g>
          );
        })}
      </svg>
      {itens.map((item, i) => {
        const yc = centro(i);
        const y = yc - h / 2;
        const cx = cxDe(i);
        const xTira = xTiraDe(i);
        const wTira = wTiraDe(i);
        const proximo = itens[i + 1]?.em ?? m.ate;
        const e = encaixeDoItem(item, larguraTexto, h - 24 - 30, 76);
        const desenho = desenhoDoItemDeLista(item);
        const cSelo = colando(t, item.em - 0.06, 0.36);
        const cTira = colando(t, item.em + 0.04, 0.42);
        const colado = t >= item.em - 0.08;
        const conteudo = (lapis: boolean) => (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 22, padding: "0 28px" }}>
            {desenho && marca ? (
              <div style={{ flex: "none", width: marca, height: marca }}>
                <Desenho nome={desenho} tamanho={marca} lapis={lapis} />
              </div>
            ) : null}
            <TextoDoItem item={item} e={e} palavras={palavras} t={t} ate={proximo} lapis={lapis} />
          </div>
        );
        return (
          <div key={i}>
            {/* selo a lápis → selo colado */}
            {cSelo.p < 1 ? (
              <div
                style={{
                  position: "absolute",
                  left: cx - d / 2,
                  top: yc - d / 2,
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  border: `4px dashed ${cor.lapis}`,
                  color: cor.lapis,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...titulo(d * 0.48),
                }}
              >
                {i + 1}
              </div>
            ) : null}
            {colado ? (
              <div style={{ position: "absolute", left: cx - d / 2, top: yc - d / 2, width: d, height: d, rotate: `${-8 + cSelo.giro * 2}deg`, ...cSelo.style, filter: sombraDePapel(0.15) }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor.branco }} />
                <div
                  style={{
                    position: "absolute",
                    inset: 9,
                    borderRadius: "50%",
                    background: cor.carimbo,
                    color: cor.cartela,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...titulo(d * 0.48),
                    paddingBottom: d * 0.04,
                  }}
                >
                  {i + 1}
                </div>
              </div>
            ) : null}
            {/* tira de papel: a lápis → colada */}
            {cTira.p < 1 ? (
              <CasaLapis x={xTira + 10} y={y + 10} w={wTira - 20} h={h - 20} raio={20}>
                <div style={{ position: "absolute", inset: -10 }}>{conteudo(true)}</div>
              </CasaLapis>
            ) : null}
            {t >= item.em ? (
              <div style={{ position: "absolute", left: xTira, top: y, width: wTira, height: h, rotate: `${(i % 2 ? 0.8 : -0.9) + cTira.giro}deg`, ...cTira.style }}>
                <Figurinha w={wTira} h={h} fundo={cor.cartela} raio={24} borda={10} levanta={0.05}>
                  <div style={{ position: "absolute", inset: -10 }}>{conteudo(false)}</div>
                </Figurinha>
              </div>
            ) : null}
          </div>
        );
      })}
      <Cabecalho titulo={m.titulo} de={m.de} ate={itens[0]?.em ?? m.ate} palavras={palavras} t={t} lado={lado} mascote={mascote} reacoes={reacoes} />
    </>
  );
};

// ---------- comparação: duas figurinhas ----------

// a seta aponta do primeiro lado para o segundo (no quadro deitado, da esquerda para a direita)
const Seta: React.FC<{ d: number }> = ({ d }) => (
  <svg width={d * 0.5} height={d * 0.5} viewBox="0 0 48 48" style={{ rotate: "-90deg" }}>
    <path d="M24 8 V38 M12 27 L24 39 L36 27" fill="none" stroke={cor.cartela} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Comparacao: React.FC<Props<ComparacaoT>> = ({ m, palavras, t, lado, mascote }) => {
  const modo = m.modo ?? "contra";
  // as duas figurinhas lado a lado (no vertical eram uma sobre a outra), com o selo na emenda
  const meio = 92;
  const w = (CONTEUDO.w - meio) / 2;
  const h = CONTEUDO.h;
  const CARIMBO_LADO = 160;
  const fundosDoModo =
    modo === "errado-certo" ? [fundos.rosa, fundos.menta] : modo === "antes-depois" ? [fundos.lavanda, fundos.menta] : [fundos.manteiga, fundos.ceu];
  // carimbos: errado-certo leva ✗ no primeiro lado e ✓ no segundo; contra/antes-depois, ✓ no vencedor
  const lados = m.lados;
  const emX = modo === "errado-certo" ? Math.min(lados[1].em - 0.1, lados[0].em + 1.1) : null;
  const vencedor = modo === "errado-certo" ? 1 : m.vencedor;
  const emV = vencedor !== undefined ? (m.vencedorEm ?? Math.min(m.ate - 0.3, lados[vencedor].em + 0.9)) : null;
  const reacoes: ReacaoNoTempo[] = [
    { em: m.de, r: "atento" },
    { em: lados[0].em + 0.2, r: "curioso" },
    ...(emX !== null ? [{ em: emX, r: "susto" as const }] : []),
    { em: lados[1].em + 0.2, r: "atento" },
    ...(emV !== null ? [{ em: emV, r: "feliz" as const }] : []),
  ];
  const seloEm = lados[1].em - 0.25;
  const cSelo = colando(t, seloEm, 0.36);
  return (
    <>
      {lados.map((l, i) => {
        const x = CONTEUDO.x + i * (w + meio);
        const y = CONTEUDO.y;
        const temCarimbo = (i === 0 && emX !== null) || (i === vencedor && emV !== null);
        // o carimbo fica no canto de baixo da figurinha: o texto guarda a altura dele
        const reservaCarimbo = temCarimbo ? CARIMBO_LADO + 20 : 0;
        const larguraTexto = w - 24 - 80;
        const encRot = encaixar(l.rotulo, { largura: larguraTexto, max: 36, min: 30, linhas: 1, ...ROTULO });
        const enc = encaixarNaAltura(l.texto, { largura: larguraTexto, max: 96, min: 52, linhas: 4, altura: h - 28 - 68 - 70 - reservaCarimbo, ...TITULO });
        const proximo = i === 0 ? lados[1].em : m.ate;
        const tempos = temposDoTexto(l.texto, palavras, l.em - 0.3, proximo, l.em - 0.05);
        const c = colando(t, l.em - 0.08, 0.42);
        const desbota = (i === 0 && emX !== null ? prog(t, emX, 0.3) : 0) + (vencedor !== undefined && i !== vencedor && emV !== null && modo !== "errado-certo" ? prog(t, emV, 0.3) : 0);
        const miolo = (lapis: boolean) => (
          <div style={{ position: "absolute", inset: 0, padding: `34px 40px ${34 + reservaCarimbo}px`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <div
              style={{
                alignSelf: "flex-start",
                background: lapis ? "transparent" : cor.tinta,
                border: lapis ? `3px solid ${cor.lapis}` : undefined,
                color: lapis ? cor.lapis : cor.cartela,
                borderRadius: 12,
                padding: "8px 16px 7px",
                ...rotulo(encRot.tamanho),
                whiteSpace: "nowrap",
              }}
            >
              {l.rotulo}
            </div>
            <Palavras
              texto={l.texto}
              tempos={lapis ? tempos.map(() => 1e6) : tempos}
              t={t}
              quebras={enc.quebras}
              style={{ ...titulo(enc.tamanho), lineHeight: 1.04 }}
              corDe={() => cor.tinta}
              esboco={cor.lapis}
            />
          </div>
        );
        return (
          <div key={i}>
            {c.p < 1 ? (
              <CasaLapis x={x + 12} y={y + 12} w={w - 24} h={h - 24} raio={28}>
                <div style={{ position: "absolute", inset: -12 }}>{miolo(true)}</div>
              </CasaLapis>
            ) : null}
            {t >= l.em - 0.1 ? (
              <div style={{ position: "absolute", left: x, top: y, width: w, height: h, rotate: `${(i ? 0.8 : -1) + c.giro}deg`, ...c.style }}>
                <div style={{ position: "absolute", inset: 0, filter: desbota > 0 ? `grayscale(${0.75 * limitar(desbota)}) opacity(${1 - 0.4 * limitar(desbota)})` : undefined }}>
                  <Figurinha w={w} h={h} fundo={fundosDoModo[i]} raio={30} borda={14} levanta={0.06}>
                    <div style={{ position: "absolute", inset: -14 }}>{miolo(false)}</div>
                  </Figurinha>
                </div>
                {i === 0 && emX !== null ? (
                  <Carimbo t={t} em={emX} largura={CARIMBO_LADO} mini tipo="nao" inclinacao={-12} style={{ right: 30, bottom: 30 }} />
                ) : null}
                {i === vencedor && emV !== null ? (
                  <Carimbo t={t} em={emV} largura={CARIMBO_LADO} mini tipo="pode" inclinacao={10} style={{ right: 30, bottom: 30 }} />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o selo do meio: VS (contra) ou seta (antes-depois, errado-certo) */}
      {t >= seloEm - 0.02 ? (
        <div
          style={{
            position: "absolute",
            left: CONTEUDO.x + w + meio / 2 - 64,
            top: CONTEUDO.y + h / 2 - 64,
            width: 128,
            height: 128,
            rotate: `${-8 + cSelo.giro * 2}deg`,
            ...cSelo.style,
            filter: sombraDePapel(0.15),
          }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor.branco }} />
          <div
            style={{
              position: "absolute",
              inset: 10,
              borderRadius: "50%",
              background: modo === "contra" ? cor.carimbo : cor.foil,
              color: cor.cartela,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...titulo(46),
            }}
          >
            {modo === "contra" ? "VS" : <Seta d={128} />}
          </div>
        </div>
      ) : null}
      <Cabecalho titulo={m.titulo} de={m.de} ate={lados[0].em} palavras={palavras} t={t} lado={lado} mascote={mascote} reacoes={reacoes} />
    </>
  );
};

// ---------- gráfico: papel quadriculado ----------

const PapelQuadriculado: React.FC<{ w: number; h: number; children: React.ReactNode }> = ({ w, h, children }) => (
  <Figurinha w={w} h={h} fundo={cor.cartela} raio={30} borda={14} levanta={0.05}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(90,86,128,0.13) 2px, transparent 2px), linear-gradient(90deg, rgba(90,86,128,0.13) 2px, transparent 2px)",
        backgroundSize: "46px 46px",
        backgroundPosition: "22px 22px",
      }}
    />
    <div style={{ position: "absolute", inset: -14 }}>{children}</div>
  </Figurinha>
);

const valorComUnidade = (v: number, unidade?: string) => {
  const casas = Number.isInteger(v) ? 0 : 1;
  const n = formatar(v, casas);
  if (!unidade) return n;
  if (unidade === "%") return `${n}%`;
  if (/^(R\$|US\$|€|\$)$/.test(unidade)) return `${unidade} ${n}`;
  return unidade.length <= 4 ? `${n} ${unidade}` : n;
};

export const Grafico: React.FC<Props<GraficoT>> = ({ m, palavras, t, lado, mascote }) => {
  const W0 = CONTEUDO.w;
  const H0 = CONTEUDO.h;
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const ilustrativo = !temDados || !!m.ilustrativo;
  const unidadeLonga = m.unidade && m.unidade.length > 4 && m.unidade !== "%" ? m.unidade : null;
  const c = colando(t, m.de, 0.42);
  const tendencia = m.tendencia ?? "sobe";
  const reacoes: ReacaoNoTempo[] = [
    { em: m.de, r: "atento" },
    ...(temDados ? dados.map((d) => ({ em: d.em + 0.3, r: "curioso" as const })) : []),
    { em: (temDados ? dados[dados.length - 1].em : (m.tendenciaEm ?? m.de)) + 1.2, r: tendencia === "cai" ? "preocupado" : tendencia === "sobe" ? "feliz" : "curioso" },
  ];
  // área do desenho dentro do papel
  const P = { x: 70, y: 110, w: W0 - 140, h: H0 - 110 - 150 };
  let desenho: React.ReactNode = null;
  if (temDados && m.forma === "pizza") desenho = <Pizza dados={dados} t={t} W0={W0} H0={H0} unidade={m.unidade} />;
  else if (temDados && m.forma === "barras") desenho = <Barras dados={dados} t={t} P={P} unidade={m.unidade} />;
  else if (temDados) desenho = <Linha dados={dados} t={t} P={P} unidade={m.unidade} />;
  else if (m.forma === "barras") desenho = <BarrasDeTendencia tendencia={tendencia} t={t} P={P} inicio={m.tendenciaEm ?? m.de + 0.3} fim={m.ate} />;
  else desenho = <CurvaDeTendencia tendencia={tendencia} t={t} P={P} inicio={m.tendenciaEm ?? m.de + 0.3} fim={m.ate} />;
  return (
    <>
      <div style={{ position: "absolute", left: CONTEUDO.x, top: CONTEUDO.y, width: W0, height: H0, rotate: `${-0.8 + c.giro}deg`, ...c.style }}>
        <PapelQuadriculado w={W0} h={H0}>
          {ilustrativo ? (
            <div style={{ position: "absolute", right: 40, top: 36, ...rotulo(30), color: cor.tintaSuave, border: `3px solid ${cor.lapis}`, borderRadius: 12, padding: "8px 14px 7px", background: cor.cartela }}>
              ilustrativo
            </div>
          ) : null}
          {unidadeLonga ? (
            <div style={{ position: "absolute", left: 44, top: 36, ...rotulo(30), color: cor.cartela, background: cor.tinta, borderRadius: 12, padding: "8px 14px 7px" }}>
              {unidadeLonga}
            </div>
          ) : null}
          {desenho}
        </PapelQuadriculado>
      </div>
      <Cabecalho titulo={m.titulo} de={m.de} ate={temDados ? dados[0].em : m.ate} palavras={palavras} t={t} lado={lado} mascote={mascote} reacoes={reacoes} />
    </>
  );
};

type Dado = { rotulo: string; valor: number; em: number };
type Area = { x: number; y: number; w: number; h: number };

const Barras: React.FC<{ dados: Dado[]; t: number; P: Area; unidade?: string }> = ({ dados, t, P, unidade }) => {
  const n = dados.length;
  const gap = Math.min(44, (P.w * 0.3) / Math.max(1, n - 1));
  const bw = Math.min(170, (P.w - (n - 1) * gap) / n);
  const total = n * bw + (n - 1) * gap;
  const x0 = P.x + (P.w - total) / 2;
  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1);
  const base = P.y + P.h;
  const larguraRotulo = bw + gap - 8;
  return (
    <>
      <svg width={P.x * 2 + P.w} height={P.y + P.h + 200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={P.x - 20} y1={base} x2={P.x + P.w + 20} y2={base} stroke={cor.tinta} strokeWidth={5} strokeLinecap="round" />
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.6);
          const hb = (Math.abs(d.valor) / max) * (P.h - 90) * p;
          const x = x0 + i * (bw + gap);
          return (
            <g key={i}>
              {/* esboço a lápis da barra cheia */}
              <rect x={x} y={base - (Math.abs(d.valor) / max) * (P.h - 90)} width={bw} height={(Math.abs(d.valor) / max) * (P.h - 90)} rx={14} fill="none" stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="6 10" />
              {p > 0 ? <rect x={x} y={base - hb} width={bw} height={hb} rx={14} fill={FUNDOS[i % FUNDOS.length]} stroke={cor.tinta} strokeWidth={4} /> : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.05, 0.6);
        const hb = (Math.abs(d.valor) / max) * (P.h - 90);
        const x = x0 + i * (bw + gap);
        const valor = valorComUnidade(d.valor, unidade);
        let s = 60;
        while (s > 34 && larguraPalavra(valor, s, TITULO) > bw + gap - 6) s -= 2;
        const enc = encaixar(d.rotulo, { largura: larguraRotulo, max: 40, min: 30, linhas: 2, ...CORPO });
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: x + bw / 2 - 200,
                width: 400,
                top: base - hb * p - s * 1.15 - 8,
                textAlign: "center",
                ...titulo(s),
                color: cor.tinta,
                opacity: limitar(p * 2),
                whiteSpace: "nowrap",
              }}
            >
              {valor}
            </div>
            <div style={{ position: "absolute", left: x + bw / 2 - larguraRotulo / 2, width: larguraRotulo, top: base + 16 }}>
              <Palavras texto={d.rotulo} tempos={d.rotulo.split(/\s+/).map(() => d.em)} t={t} quebras={enc.quebras} alinhar="center" style={{ ...corpo(enc.tamanho, 780) }} corDe={() => cor.tinta} esboco={cor.lapis} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Linha: React.FC<{ dados: Dado[]; t: number; P: Area; unidade?: string }> = ({ dados, t, P, unidade }) => {
  const n = dados.length;
  const vs = dados.map((d) => d.valor);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const faixa = max - min || 1;
  const pts = dados.map((d, i) => ({
    x: P.x + 40 + (i * (P.w - 80)) / Math.max(1, n - 1),
    y: P.y + 60 + (1 - (d.valor - min) / faixa) * (P.h - 140),
  }));
  const larguraRotulo = Math.min(260, (P.w - 80) / Math.max(1, n - 1) + 10);
  return (
    <>
      <svg width={P.x * 2 + P.w} height={P.y + P.h + 200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={P.x - 20} y1={P.y + P.h} x2={P.x + P.w + 20} y2={P.y + P.h} stroke={cor.tinta} strokeWidth={5} strokeLinecap="round" />
        {pts.slice(1).map((q, i) => {
          const a = pts[i];
          const dd = `M${a.x} ${a.y} L${q.x} ${q.y}`;
          return (
            <g key={i}>
              <path d={dd} stroke={cor.lapisClaro} strokeWidth={4} strokeDasharray="6 10" fill="none" />
              <Traco d={dd} p={prog(t, dados[i + 1].em - 0.3, 0.45, Easing.inOut(Easing.quad))} cor={cor.tinta} largura={8} />
            </g>
          );
        })}
        {pts.map((q, i) => {
          const c = prog(t, dados[i].em - 0.05, 0.3);
          return (
            <g key={`p${i}`} opacity={c > 0 ? 1 : 0.6}>
              <circle cx={q.x} cy={q.y} r={c > 0 ? mistura(30, 24, c) : 22} fill={c > 0 ? cor.branco : "none"} stroke={c > 0 ? cor.branco : cor.lapisClaro} strokeWidth={3} strokeDasharray={c > 0 ? undefined : "5 7"} />
              {c > 0 ? <circle cx={q.x} cy={q.y} r={16} fill={FUNDOS[i % FUNDOS.length]} stroke={cor.tinta} strokeWidth={4} /> : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, i) => {
        const q = pts[i];
        const c = prog(t, d.em - 0.05, 0.3);
        const valor = valorComUnidade(d.valor, unidade);
        const enc = encaixar(d.rotulo, { largura: larguraRotulo, max: 38, min: 30, linhas: 2, ...CORPO });
        // o valor fica sempre dentro do papel (o primeiro e o último encostam na margem)
        let sv = 52;
        while (sv > 34 && larguraPalavra(valor, sv, TITULO) > (P.w + 2 * P.x) / Math.max(2, n) + 40) sv -= 2;
        const lv = larguraPalavra(valor, sv, TITULO) + 8;
        const xv = Math.min(Math.max(q.x - lv / 2, 24), P.w + 2 * P.x - 24 - lv);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: xv, width: lv, top: q.y - sv * 1.75, textAlign: "center", ...titulo(sv), color: cor.tinta, opacity: c, whiteSpace: "nowrap" }}>{valor}</div>
            <div style={{ position: "absolute", left: q.x - larguraRotulo / 2, width: larguraRotulo, top: P.y + P.h + 16 }}>
              <Palavras texto={d.rotulo} tempos={d.rotulo.split(/\s+/).map(() => d.em)} t={t} quebras={enc.quebras} alinhar="center" style={{ ...corpo(enc.tamanho, 780) }} corDe={() => cor.tinta} esboco={cor.lapis} />
            </div>
          </div>
        );
      })}
    </>
  );
};

const Pizza: React.FC<{ dados: Dado[]; t: number; W0: number; H0: number; unidade?: string }> = ({ dados, t, W0, H0, unidade }) => {
  const total = dados.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
  const r = Math.min(230, (H0 - 160) / 2);
  const cx = 70 + r;
  const cy = H0 / 2 + 20;
  let ang = -Math.PI / 2;
  const fatias = dados.map((d, i) => {
    const a0 = ang;
    const a1 = ang + (Math.max(0, d.valor) / total) * Math.PI * 2;
    ang = a1;
    return { d, i, a0, a1 };
  });
  const xLegenda = cx + r + 60;
  const wLegenda = W0 - xLegenda - 40;
  const hLinha = Math.min(120, (H0 - 160) / dados.length);
  const y0 = cy - (hLinha * dados.length) / 2;
  const pct = unidade === "%" || !unidade;
  return (
    <>
      <svg width={W0} height={H0} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.lapisClaro} strokeWidth={4} strokeDasharray="8 10" />
        {fatias.map(({ d, i, a0, a1 }) => {
          const p = prog(t, d.em - 0.05, 0.4);
          if (p <= 0) return null;
          const meio = (a0 + a1) / 2;
          const sai = mistura(26, 0, p);
          const dx = Math.cos(meio) * sai;
          const dy = Math.sin(meio) * sai;
          const grande = a1 - a0 > Math.PI ? 1 : 0;
          const dd =
            a1 - a0 >= Math.PI * 2 - 0.001
              ? `M${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z`
              : `M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A ${r} ${r} 0 ${grande} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} Z`;
          return <path key={i} d={dd} transform={`translate(${dx} ${dy})`} fill={FUNDOS[i % FUNDOS.length]} stroke={cor.tinta} strokeWidth={4} strokeLinejoin="round" opacity={limitar(p * 2)} />;
        })}
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em - 0.05, 0.3);
        const valor = pct ? `${formatar((Math.max(0, d.valor) / total) * 100, 0)}%` : valorComUnidade(d.valor, unidade);
        const enc = encaixar(d.rotulo, { largura: wLegenda - 70 - 150, max: 42, min: 32, linhas: 2, ...CORPO });
        return (
          <div key={i} style={{ position: "absolute", left: xLegenda, top: y0 + i * hLinha, width: wLegenda, height: hLinha, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: "none", width: 44, height: 44, borderRadius: 12, background: p > 0 ? FUNDOS[i % FUNDOS.length] : "transparent", border: `4px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? cor.tinta : cor.lapis}` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Palavras texto={d.rotulo} tempos={d.rotulo.split(/\s+/).map(() => d.em)} t={t} quebras={enc.quebras} style={{ ...corpo(enc.tamanho, 780) }} corDe={() => cor.tinta} esboco={cor.lapis} />
            </div>
            <div style={{ flex: "none", ...titulo(48), color: p > 0 ? cor.carimbo : cor.lapisClaro }}>{valor}</div>
          </div>
        );
      })}
    </>
  );
};

// pontos da curva de tendência (ilustrativa) dentro da área
const pontosDaTendencia = (tendencia: "sobe" | "cai" | "oscila", P: Area) => {
  const ys =
    tendencia === "sobe"
      ? [0.82, 0.7, 0.74, 0.55, 0.6, 0.38, 0.3, 0.12]
      : tendencia === "cai"
        ? [0.15, 0.24, 0.2, 0.42, 0.38, 0.6, 0.68, 0.86]
        : [0.5, 0.25, 0.62, 0.3, 0.7, 0.36, 0.58, 0.42];
  return ys.map((y, i) => ({ x: P.x + 30 + (i * (P.w - 60)) / (ys.length - 1), y: P.y + 30 + y * (P.h - 60) }));
};

const caminhoSuave = (pts: { x: number; y: number }[]) =>
  pts.reduce((d, q, i) => {
    if (i === 0) return `M${q.x} ${q.y}`;
    const a = pts[i - 1];
    const mx = (a.x + q.x) / 2;
    return `${d} C ${mx} ${a.y}, ${mx} ${q.y}, ${q.x} ${q.y}`;
  }, "");

const CurvaDeTendencia: React.FC<{ tendencia: "sobe" | "cai" | "oscila"; t: number; P: Area; inicio: number; fim: number }> = ({ tendencia, t, P, inicio, fim }) => {
  const pts = pontosDaTendencia(tendencia, P);
  const dd = caminhoSuave(pts);
  const dur = Math.max(1.4, Math.min(2.6, (fim - inicio) * 0.6));
  const p = prog(t, inicio, dur, Easing.inOut(Easing.quad));
  const ultimo = pts[pts.length - 1];
  const cSelo = colando(t, inicio + dur - 0.1, 0.36);
  const corDaLinha = tendencia === "cai" ? cor.carimbo : tendencia === "sobe" ? cor.pode : cor.tinta;
  return (
    <>
      <svg width={P.x * 2 + P.w} height={P.y + P.h + 200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={P.x - 20} y1={P.y + P.h} x2={P.x + P.w + 20} y2={P.y + P.h} stroke={cor.tinta} strokeWidth={5} strokeLinecap="round" />
        <line x1={P.x - 20} y1={P.y - 10} x2={P.x - 20} y2={P.y + P.h} stroke={cor.tinta} strokeWidth={5} strokeLinecap="round" />
        <path d={dd} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="6 12" strokeLinecap="round" />
        <Traco d={dd} p={p} cor={corDaLinha} largura={11} />
      </svg>
      {t >= inicio + dur - 0.12 ? (
        <div style={{ position: "absolute", left: ultimo.x - 56, top: ultimo.y - 56, width: 112, height: 112, rotate: `${-8 + cSelo.giro * 2}deg`, ...cSelo.style, filter: sombraDePapel(0.15) }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor.branco }} />
          <div style={{ position: "absolute", inset: 9, borderRadius: "50%", background: corDaLinha, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={56} height={56} viewBox="0 0 48 48">
              <path
                d={tendencia === "sobe" ? "M24 40 V10 M12 22 L24 10 L36 22" : tendencia === "cai" ? "M24 8 V38 M12 26 L24 38 L36 26" : "M6 26 C 14 10, 20 10, 24 24 C 28 38, 34 38, 42 22"}
                fill="none"
                stroke={cor.cartela}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      ) : null}
    </>
  );
};

const BarrasDeTendencia: React.FC<{ tendencia: "sobe" | "cai" | "oscila"; t: number; P: Area; inicio: number; fim: number }> = ({ tendencia, t, P, inicio, fim }) => {
  const hs = tendencia === "sobe" ? [0.25, 0.4, 0.55, 0.72, 0.92] : tendencia === "cai" ? [0.92, 0.72, 0.55, 0.4, 0.25] : [0.5, 0.8, 0.35, 0.7, 0.45];
  const n = hs.length;
  const gap = 34;
  const bw = (P.w - (n - 1) * gap) / n;
  const passo = Math.max(0.25, Math.min(0.5, ((fim - inicio) * 0.7) / n));
  return (
    <svg width={P.x * 2 + P.w} height={P.y + P.h + 200} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <line x1={P.x - 20} y1={P.y + P.h} x2={P.x + P.w + 20} y2={P.y + P.h} stroke={cor.tinta} strokeWidth={5} strokeLinecap="round" />
      {hs.map((f, i) => {
        const p = prog(t, inicio + i * passo, 0.5);
        const hb = f * (P.h - 40);
        const x = P.x + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={P.y + P.h - hb} width={bw} height={hb} rx={14} fill="none" stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="6 10" />
            {p > 0 ? <rect x={x} y={P.y + P.h - hb * p} width={bw} height={hb * p} rx={14} fill={FUNDOS[i % FUNDOS.length]} stroke={cor.tinta} strokeWidth={4} /> : null}
          </g>
        );
      })}
    </svg>
  );
};

// ---------- definição: a figurinha que vira ----------

export const Definicao: React.FC<Props<DefinicaoT>> = ({ m, palavras, t, lado, mascote }) => {
  const w = CONTEUDO.w;
  const h = CONTEUDO.h - 20;
  const y = CONTEUDO.y + 4;
  const encTermo = encaixarNaAltura(m.termo, { largura: w - 24 - 200, max: 140, min: 60, linhas: 3, altura: h - 200, ...TITULO });
  const encSig = encaixarNaAltura(m.significado, { largura: w - 24 - 120, max: 104, min: 52, linhas: 5, altura: h - 32 - 104 - 110, ...TITULO });
  const encTermoPeq = encaixar(m.termo, { largura: w - 24 - 160, max: 36, min: 30, linhas: 1, ...ROTULO });
  const temposTermo = temposDoTexto(m.termo, palavras, m.em - 0.2, m.significadoEm, m.em - 0.05);
  const temposSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.2, m.ate, m.significadoEm + 0.1);
  const destaque = indicesDoTrecho(m.significado, undefined);
  const c = colando(t, m.em - 0.1, 0.42);
  // vira em 0,5 s a partir de um instante antes do significado
  // (nunca antes de a frente ter assentado)
  const pVira = prog(t, Math.max(m.significadoEm - 0.2, m.em + 0.45), 0.5, Easing.inOut(Easing.cubic));
  const angulo = pVira * 180;
  const frente = angulo < 90;
  const reacoes: ReacaoNoTempo[] = [{ em: m.de, r: "atento" }, { em: m.em + 0.2, r: "curioso" }, { em: m.significadoEm + 0.5, r: "feliz" }];
  return (
    <>
      {c.p < 1 ? (
        <CasaLapis x={CONTEUDO.x + 12} y={y + 12} w={w - 24} h={h - 24} raio={30}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
            <Palavras texto={m.termo} tempos={temposTermo.map(() => 1e6)} t={t} quebras={encTermo.quebras} alinhar="center" style={{ ...titulo(encTermo.tamanho) }} esboco={cor.lapis} />
          </div>
        </CasaLapis>
      ) : null}
      {t >= m.em - 0.12 ? (
        <div style={{ position: "absolute", left: CONTEUDO.x, top: y, width: w, height: h, rotate: `${-1 + c.giro}deg`, ...c.style }}>
          <div style={{ position: "absolute", inset: 0, transform: `perspective(2600px) rotateY(${frente ? angulo : angulo - 180}deg)`, scale: String(1 + 0.04 * Math.sin(pVira * Math.PI)) }}>
            {frente ? (
              <Figurinha w={w} h={h} fundo={fundos.lavanda} raio={34} borda={16} levanta={0.06 + 0.5 * Math.sin(pVira * Math.PI)}>
                <div style={{ position: "absolute", inset: -16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
                  <Palavras texto={m.termo} tempos={temposTermo} t={t} quebras={encTermo.quebras} alinhar="center" style={{ ...titulo(encTermo.tamanho) }} corDe={() => cor.tinta} esboco={cor.lapis} />
                </div>
                {/* selo "?" no canto */}
                <div style={{ position: "absolute", left: 14, top: 14, width: 108, height: 108, borderRadius: "50%", background: cor.carimbo, color: cor.cartela, display: "flex", alignItems: "center", justifyContent: "center", ...titulo(64) }}>?</div>
              </Figurinha>
            ) : (
              // o verso da figurinha: papel pautado com o termo pequeno e o significado
              <Figurinha w={w} h={h} fundo={cor.cartela} raio={34} borda={16} levanta={0.06 + 0.5 * Math.sin(pVira * Math.PI)}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "linear-gradient(transparent 62px, rgba(90,86,128,0.14) 62px, rgba(90,86,128,0.14) 65px, transparent 65px)",
                    backgroundSize: "100% 66px",
                  }}
                />
                <div style={{ position: "absolute", inset: -16, padding: "52px 60px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
                  <div style={{ alignSelf: "flex-start", background: cor.tinta, color: cor.cartela, borderRadius: 12, padding: "9px 18px 8px", ...rotulo(encTermoPeq.tamanho), whiteSpace: "nowrap" }}>
                    {m.termo}
                  </div>
                  <Palavras
                    texto={m.significado}
                    tempos={temposSig}
                    t={t}
                    quebras={encSig.quebras}
                    style={{ ...titulo(encSig.tamanho), lineHeight: 1.04 }}
                    corDe={(i) => (destaque.has(i) ? cor.carimbo : cor.tinta)}
                    esboco={cor.lapisClaro}
                  />
                </div>
              </Figurinha>
            )}
          </div>
        </div>
      ) : null}
      <Cabecalho de={m.de} ate={m.em} palavras={palavras} t={t} lado={lado} mascote={mascote} reacoes={reacoes} />
    </>
  );
};
