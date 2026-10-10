// O verbete em destaque: palavra-título por sílabas, classe gramatical, pronúncia e o cartão de nota.
import { impressao, prog, quebrarPalavra, silabasDe } from "../anim";
import type { Areas } from "../layout";
import type { Palavra, PalavraTitulo, Verbete as VerbeteT } from "../plano";
import { cor, sans, serif } from "../tema";
import { Cartao } from "./Cartao";
import { ColunaDeVizinhos, vizinhosQueCabem } from "./Pagina";

// A palavra-título: cada sílaba entra em sequência no `em` (como se fosse soletrada)
export const PalavraTituloAnimada: React.FC<{
  p: PalavraTitulo;
  t: number;
  largura: number;
  maximo: number;
  maxLinhas: number;
  classe?: string;
  esboco?: boolean;
}> = ({ p, t, largura, maximo, maxLinhas, classe, esboco = false }) => {
  const silabas = silabasDe(p.texto, p.silabas);
  const espacoClasse = classe && maxLinhas === 1 ? (classe.length + 1) * 0.5 * 54 : 0;
  const { corpo, linhas } = quebrarPalavra(silabas, largura - espacoClasse, maximo, maxLinhas);
  const antes = t < p.em - 0.02;
  return (
    <div style={{ fontFamily: serif, fontWeight: 700, fontSize: corpo, lineHeight: 1.0, color: cor.ameixa }}>
      {linhas.map((idx, li) => (
        <div key={li} style={{ display: "flex", alignItems: "baseline", whiteSpace: "nowrap", height: corpo * 1.04 }}>
          {idx.map((i) => {
            const em = p.em + i * 0.07;
            // fim de uma palavra numa expressão ("bull market"): espaço em vez do ponto
            const fimDePalavra = silabas[i].endsWith(" ");
            const ultimaDaPalavra = i === silabas.length - 1 || fimDePalavra;
            const fimDaLinha = idx[idx.length - 1] === i;
            const estilo = antes ? { opacity: 0 } : impressao(t, em, 0.2);
            const texto = silabas[i].trimEnd();
            return (
              <span key={i} style={{ position: "relative", display: "inline-block", marginRight: fimDePalavra && !fimDaLinha ? "0.26em" : 0 }}>
                {esboco && antes ? (
                  <span style={{ position: "absolute", left: 0, color: cor.lapis, fontWeight: 400 }}>{texto}</span>
                ) : null}
                <span style={{ display: "inline-block", ...estilo }}>
                  {texto}
                  {!ultimaDaPalavra ? (
                    <span style={{ color: cor.cinza, fontWeight: 400, margin: fimDaLinha ? "0 0 0 0.04em" : "0 0.04em" }}>·</span>
                  ) : null}
                </span>
              </span>
            );
          })}
          {classe && li === linhas.length - 1 && maxLinhas === 1 ? (
            <span style={{ fontStyle: "italic", fontWeight: 400, fontSize: 54, color: cor.cinza, marginLeft: 24, ...impressao(t, p.em + 0.3) }}>
              {classe}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
};

// Pronúncia aproximada para brasileiro: [eks-ki-SÍ-to], a sílaba tônica (em maiúsculas) em negrito,
// seguida do rótulo "pronúncia aproximada". Na serifada (a sans deixa I maiúsculo e l minúsculo iguais).
// Linha única quando cabe; senão o rótulo desce, e numa coluna estreita a classe fica na linha de cima.
const ROTULO_APROX = "pronúncia aproximada";
const larguraRotuloAprox = ROTULO_APROX.length * 0.66 * 30 + 20;

const arranjoDaPronuncia = (classe: string | undefined, pron: string | undefined, largura: number, corpo: number) => {
  const wClasse = classe ? classe.length * 0.5 * (corpo + 10) + 22 : 0;
  const wPron = pron ? (pron.length + 2) * 0.5 * corpo + 22 : 0;
  const wRotulo = pron ? larguraRotuloAprox : 0;
  if (wClasse + wPron + wRotulo <= largura) return [["classe", "pron", "rotulo"]];
  if (wClasse + wPron <= largura) return [["classe", "pron"], ["rotulo"]];
  return [["classe"], ["pron"], ["rotulo"]];
};

// Altura da linha de classe + pronúncia (para o cartão começar logo abaixo)
export const alturaDaPronuncia = (classe: string | undefined, pron: string | undefined, largura: number, corpo: number) => {
  if (!classe && !pron) return 0;
  return arranjoDaPronuncia(classe, pron, largura, corpo)
    .map((linha) => (linha.length === 1 && linha[0] === "rotulo" ? (pron ? 44 : 0) : linha.includes("classe") && classe ? (corpo + 10) * 1.22 : corpo * 1.3))
    .reduce((a, b) => a + b, 0);
};

export const Pronuncia: React.FC<{ texto: string; t: number; em: number; corpo?: number; classe?: string; largura?: number }> = ({
  texto,
  t,
  em,
  corpo = 46,
  classe,
  largura = 2000,
}) => {
  const partes = texto ? texto.split(/[-·]/) : [];
  const linhas = arranjoDaPronuncia(classe, texto || undefined, largura, corpo);
  const peca = (nome: string) => {
    if (nome === "classe" && classe)
      return <span key="c" style={{ fontFamily: serif, fontStyle: "italic", fontSize: corpo + 10, color: cor.cinza, marginRight: 22 }}>{classe}</span>;
    if (nome === "pron" && texto)
      return (
        <span key="p" style={{ fontFamily: serif, fontWeight: 400, fontSize: corpo, color: cor.cinza, marginRight: 22, whiteSpace: "nowrap" }}>
          [
          {partes.map((s, i) => {
            const tonica = s === s.toUpperCase() && /\p{L}/u.test(s);
            return (
              <span key={i}>
                <span style={{ fontWeight: tonica ? 700 : 400, color: tonica ? cor.tinta : cor.cinza }}>{s}</span>
                {i < partes.length - 1 ? <span>-</span> : null}
              </span>
            );
          })}
          ]
        </span>
      );
    if (nome === "rotulo" && texto)
      return (
        <span key="r" style={{ fontFamily: sans, fontWeight: 600, fontSize: 30, letterSpacing: "0.1em", textTransform: "uppercase", color: cor.cinza, opacity: 0.85, whiteSpace: "nowrap" }}>
          {ROTULO_APROX}
        </span>
      );
    return null;
  };
  return (
    <div style={{ ...impressao(t, em) }}>
      {linhas.map((linha, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", marginTop: i > 0 ? 4 : 0 }}>
          {linha.map(peca)}
        </div>
      ))}
    </div>
  );
};

export const Verbete: React.FC<{ m: VerbeteT; t: number; areas: Areas; palavras?: Palavra[] }> = ({ m, t, areas, palavras }) => {
  const fala = palavras ? { palavras, de: m.de, ate: m.ate, t } : undefined;
  const R = areas.conteudo;
  const pron = m.pronuncia;

  if (areas.largo) {
    // largura toda: palavra + classe numa linha, pronúncia embaixo, cartão ocupando o resto
    const silabas = silabasDe(m.palavra.texto, m.palavra.silabas);
    // uma linha (com a classe ao lado) quando cabe grande; senão a expressão quebra em duas linhas
    const umaLinha = quebrarPalavra(silabas, R.w - (m.classe ? (m.classe.length + 1) * 27 : 0), 132, 1);
    const duas = umaLinha.corpo < 92 ? quebrarPalavra(silabas, R.w, 120, 2) : null;
    const corpo = duas ? duas.corpo : umaLinha.corpo;
    const linhasTitulo = duas ? duas.linhas.length : 1;
    const yPron = R.y + linhasTitulo * corpo * 1.04 + 6;
    const yCartao = yPron + (pron || (duas && m.classe) ? alturaDaPronuncia(duas ? m.classe : undefined, pron, R.w, 46) + 16 : 20);
    return (
      <>
        {areas.vizinhos ? <ColunaDeVizinhos regiao={areas.vizinhos} lista={m.vizinhos?.antes} doFim fala={fala} /> : null}
        <div style={{ position: "absolute", left: R.x, top: R.y, width: R.w }}>
          {duas ? (
            <PalavraTituloAnimada p={m.palavra} t={t} largura={R.w} maximo={120} maxLinhas={2} />
          ) : (
            <PalavraTituloAnimada p={m.palavra} t={t} largura={R.w} maximo={132} maxLinhas={1} classe={m.classe} />
          )}
        </div>
        {pron || (duas && m.classe) ? (
          <div style={{ position: "absolute", left: R.x, top: yPron }}>
            <Pronuncia texto={pron ?? ""} t={t} em={m.palavra.em + 0.42} corpo={46} largura={R.w} classe={duas ? m.classe : undefined} />
          </div>
        ) : null}
        <Cartao m={m} t={t} x={R.x} y={yCartao} w={R.w} h={R.y + R.h - yCartao} largo />
      </>
    );
  }

  // coluna: vizinhos em cima, palavra quebrada por sílabas, classe e pronúncia, cartão, vizinhos embaixo
  const silabas = silabasDe(m.palavra.texto, m.palavra.silabas);
  const { corpo, linhas } = quebrarPalavra(silabas, R.w, 124, 2);
  const temFigura = !!(m.parece.figura || m.significa.figura);
  const alturaCartao = temFigura ? 640 : 420;
  const alturaPron = alturaDaPronuncia(m.classe, pron, R.w, 42);
  const alturaEntrada = linhas.length * corpo * 1.04 + 14 + alturaPron + 30 + alturaCartao;
  const sobra = Math.max(0, R.h - alturaEntrada);
  const listaAntes = m.vizinhos?.antes;
  const antes = listaAntes?.length
    ? vizinhosQueCabem(listaAntes, R.w, sobra * 0.62, true)
    : { lista: [], altura: Math.floor((sobra * 0.5) / 46) * 46 };
  // o carimbo passa um pouco da borda de baixo do cartão estreito: os vizinhos de baixo descem
  const folgaCarimbo = m.carimbo ? 64 : 34;
  const depoisAltura = sobra - antes.altura - 24 - (folgaCarimbo - 34);
  const y0 = R.y + antes.altura + (antes.altura > 0 ? 14 : 0);
  const yPron = y0 + linhas.length * corpo * 1.04 + 14;
  const yCartao = yPron + alturaPron + 30;
  return (
    <>
      {antes.altura > 0 ? <ColunaDeVizinhos regiao={{ x: R.x, y: R.y, w: R.w, h: antes.altura }} lista={antes.lista} doFim /> : null}
      <div style={{ position: "absolute", left: R.x, top: y0, width: R.w }}>
        <PalavraTituloAnimada p={m.palavra} t={t} largura={R.w} maximo={108} maxLinhas={2} />
      </div>
      {pron || m.classe ? (
        <div style={{ position: "absolute", left: R.x, top: yPron, width: R.w }}>
          <Pronuncia texto={pron ?? ""} t={t} em={m.palavra.em + 0.36} corpo={42} classe={m.classe} largura={R.w} />
        </div>
      ) : null}
      <Cartao m={m} t={t} x={R.x} y={yCartao} w={R.w} h={alturaCartao} largo={false} />
      {depoisAltura > 60 ? (
        <ColunaDeVizinhos regiao={{ x: R.x, y: yCartao + alturaCartao + folgaCarimbo, w: R.w, h: depoisAltura }} lista={m.vizinhos?.depois} />
      ) : null}
    </>
  );
};

// O progresso de leitura de uma página (para a aba do índice saber quando acender)
export const progressoDoVerbete = (m: VerbeteT, t: number) => prog(t, m.palavra.em, 0.3);
