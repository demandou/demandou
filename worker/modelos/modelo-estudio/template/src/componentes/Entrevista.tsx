// Pergunta e resposta: o cartão de entrevista embaixo do quadro. Um cartão só para cada sequência
// de perguntas e respostas coladas: ele sobe opaco de baixo (cobrindo o que estava ali) e desce no
// fim. Dentro dele, a frase inteira já está a lápis e cada palavra acende quando é dita. Na resposta,
// a pergunta encolhe para uma linha no alto e entra o "R", com uma fileira de marcas opcional.
import { indicesDoTrecho, Linhas, prog, saindo, temposDoTexto } from "../anim";
import { abaixoDoQuadro } from "../layout";
import { caber, diagramar, medir, MONO } from "../medidas";
import type { Marca, Palavra, Pergunta as PerguntaT, Resposta as RespostaT } from "../plano";
import { comAlfa, cor, FUNDO, H, MARGEM, rotulo, sans, titulo, W } from "../tema";
import { ritmoDoCartao, Rotulo as RotuloComFio } from "./comum";

const LARGURA = W - 2 * MARGEM;
const PAD_X = 44;
const PAD_Y = 38;
const INTERNA = LARGURA - 2 * PAD_X;
// a letra (P ou R) fica pendurada à esquerda do texto, como numa transcrição de entrevista
const MARGEM_LETRA = 98;
const TEXTO = INTERNA - MARGEM_LETRA;

export const areaDoCartao = () => {
  const topo = abaixoDoQuadro("entrevista");
  return { x: MARGEM, y: topo, w: LARGURA, h: FUNDO - topo };
};

type Item = PerguntaT | RespostaT;

// rótulo do cartão em mono, com um fio que vai até a borda
const Rotulo: React.FC<{ nome: string; aceso: number }> = ({ nome, aceso }) => <RotuloComFio nome={nome} aceso={aceso} />;

// a letra pendurada: a primeira letra do rótulo ("PERGUNTA" → P, "MITO" → M)
const letraDe = (nome: string) => (nome.trim()[0] ?? "P").toUpperCase();

// Opções da pergunta e marcas da fileira: etiquetas que acendem, cada uma na sua palavra.
const ALTURA_ETIQUETA = 64;
const VAO_ETIQUETA = 14;
type Etiqueta = { texto: string; em: number };
// quebra as etiquetas em fileiras que cabem na largura (larguras medidas)
const fileiras = (larguras: number[], largura: number) => {
  const linhas: number[][] = [[]];
  let usado = 0;
  larguras.forEach((w, i) => {
    const atual = linhas[linhas.length - 1];
    if (atual.length && usado + VAO_ETIQUETA + w > largura) {
      linhas.push([i]);
      usado = w;
    } else {
      usado += (atual.length ? VAO_ETIQUETA : 0) + w;
      atual.push(i);
    }
  });
  return linhas;
};

// Marcas curtas (até 3 caracteres, ex.: os dias da semana): quadradinhos iguais que enchem a linha.
// Palavras: etiquetas em mono do tamanho do texto.
const medidasDasMarcas = (itens: Etiqueta[], largura: number) => {
  const curtas = itens.every((m) => m.texto.length <= 3);
  if (curtas) {
    const n = itens.length;
    const lado = Math.min(112, (largura - VAO_ETIQUETA * 0 - 12 * (n - 1)) / Math.max(1, n));
    return { curtas, larguras: itens.map(() => lado), tam: 34 };
  }
  // palavras: em mono, 40 px se todas couberem numa fileira (até 34; até 30 se uma for comprida)
  const larg = (t: number) => itens.map((m) => Math.min(largura, m.texto.length * (MONO + 0.02) * t + 40));
  const umaFileira = (t: number) => larg(t).reduce((s, w) => s + w, 0) + VAO_ETIQUETA * (itens.length - 1) <= largura;
  let tam = 40;
  while (tam > 34 && !umaFileira(tam)) tam -= 2;
  while (tam > 30 && larg(tam).some((w) => w >= largura)) tam -= 2;
  return { curtas, larguras: larg(tam), tam };
};

const Etiquetas: React.FC<{ itens: Etiqueta[]; t: number; largura: number; modo: "marca" | "opcao" }> = ({ itens, t, largura, modo }) => {
  if (modo === "marca") {
    const { curtas, larguras, tam } = medidasDasMarcas(itens, largura);
    const vao = curtas ? 12 : VAO_ETIQUETA;
    const linhas = curtas ? [itens.map((_, i) => i)] : fileiras(larguras, largura);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: VAO_ETIQUETA }}>
        {linhas.map((l, li) => (
          <div key={li} style={{ display: "flex", gap: vao }}>
            {l.map((i) => {
              const item = itens[i];
              const p = prog(t, item.em, 0.22);
              return (
                <div
                  key={`${item.texto}-${i}`}
                  style={{
                    width: larguras[i],
                    height: ALTURA_ETIQUETA,
                    borderRadius: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: p > 0.02 ? comAlfa(cor.acento, p) : "transparent",
                    boxShadow: p > 0.98 ? "none" : `inset 0 0 0 2px ${cor.apagado}`,
                    scale: String(0.9 + 0.1 * p),
                  }}
                >
                  <span style={{ ...rotulo, fontSize: tam, color: p > 0.5 ? cor.sobreAcento : cor.apagadoForte, whiteSpace: "nowrap" }}>{item.texto}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
  // opções da pergunta: etiquetas contornadas que acendem (contorno rosa, texto branco) quando são ditas
  const tam = 40;
  const larguras = itens.map((o) => Math.min(largura, medir(o.texto, tam, 700) + 52));
  const linhas = fileiras(larguras, largura);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: VAO_ETIQUETA }}>
      {linhas.map((l, li) => (
        <div key={li} style={{ display: "flex", gap: VAO_ETIQUETA }}>
          {l.map((i) => {
            const o = itens[i];
            const p = prog(t, o.em, 0.25);
            return (
              <div
                key={`${o.texto}-${i}`}
                style={{
                  width: larguras[i],
                  height: ALTURA_ETIQUETA,
                  borderRadius: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `inset 0 0 0 ${p > 0.5 ? 3 : 2}px ${p > 0.5 ? cor.acento : cor.apagado}`,
                  scale: String(0.94 + 0.06 * p),
                  translate: `0 ${(1 - p) * 8}px`,
                }}
              >
                <span style={{ fontFamily: sans, fontWeight: 700, fontSize: tam, color: p > 0.5 ? cor.texto : cor.apagadoForte, whiteSpace: "nowrap" }}>{o.texto}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const alturaDasEtiquetas = (itens: Etiqueta[], largura: number, modo: "marca" | "opcao") => {
  if (!itens.length) return 0;
  if (modo === "marca") {
    const { curtas, larguras } = medidasDasMarcas(itens, largura);
    const n = curtas ? 1 : fileiras(larguras, largura).length;
    return n * ALTURA_ETIQUETA + (n - 1) * VAO_ETIQUETA;
  }
  const larguras = itens.map((o) => Math.min(largura, medir(o.texto, 40, 700) + 52));
  const n = fileiras(larguras, largura).length;
  return n * ALTURA_ETIQUETA + (n - 1) * VAO_ETIQUETA;
};

// as marcas da fileira com o instante de cada uma
const marcasDa = (fileira: { itens: Marca[]; em?: number } | undefined, padrao: number): Etiqueta[] =>
  (fileira?.itens ?? []).map((item, i) =>
    typeof item === "string" ? { texto: item, em: (fileira?.em ?? padrao) + i * 0.1 } : { texto: item.texto, em: item.em },
  );

// a letra grande pendurada, alinhada com a primeira linha do texto
const Letra: React.FC<{ letra: string; tam: number; aceso: number }> = ({ letra, tam, aceso }) => {
  // a marca cabe na margem (uma letra fica do tamanho de sempre; "¼" ou "10" diminuem se precisar)
  const corpo = Math.min(Math.max(tam, 72), (MARGEM_LETRA - 14) / Math.max(0.1, medir(letra, 1, 800)));
  return (
    <div style={{ width: MARGEM_LETRA, flexShrink: 0, height: tam * 1.05, display: "flex", alignItems: "center" }}>
      <span style={{ ...titulo, fontSize: corpo, lineHeight: 1, color: aceso > 0.5 ? cor.acento : cor.apagadoForte }}>{letra}</span>
    </div>
  );
};

const ConteudoPergunta: React.FC<{ m: PerguntaT; palavras: Palavra[]; t: number; primeiro: boolean; fim: number; segue: boolean }> = ({ m, palavras, t, primeiro, fim, segue }) => {
  const a = areaDoCartao();
  const interna = a.h - 2 * PAD_Y;
  const opcoes = m.opcoes ?? [];
  const alturaOpcoes = opcoes.length ? 24 + alturaDasEtiquetas(opcoes, TEXTO, "opcao") : 0;
  const { linhas, tam } = caber(m.texto, {
    largura: TEXTO,
    maximo: 96,
    minimo: 56,
    linhas: 3,
    altura: interna - 62 - alturaOpcoes,
    entrelinha: 1.05,
    piso: 44,
  });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de + 0.05);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const altura = 40 + 22 + linhas.length * tam * 1.05 + alturaOpcoes;
  const entra = primeiro ? 1 : prog(t, m.de + 0.04, 0.35);
  // quando vem uma resposta no mesmo cartão, a pergunta grande sobe e some (a resposta traz o resumo)
  const sai = segue ? saindo(t, fim + 0.06, 0.2) : 0;
  const nome = m.rotulo ?? "Pergunta";
  return (
    <div
      style={{
        position: "absolute",
        left: PAD_X,
        top: PAD_Y + Math.max(0, (interna - altura) / 2),
        width: INTERNA,
        opacity: entra * (1 - sai),
        translate: `0 ${(1 - entra) * 40 - 50 * sai}px`,
      }}
    >
      <Rotulo nome={nome} aceso={1} />
      <div style={{ height: 22 }} />
      <div style={{ display: "flex" }}>
        <Letra letra={m.letra ?? letraDe(nome)} tam={tam} aceso={1} />
        <div>
          <Linhas linhas={linhas} tempos={tempos} t={t} tam={tam} modo="acende" entrelinha={1.05} estilo={{ ...titulo, fontSize: tam }} corDe={(i) => (destaque.has(i) ? cor.acento : undefined)} />
          {opcoes.length ? (
            <div style={{ marginTop: 24 }}>
              <Etiquetas itens={opcoes} t={t} largura={TEXTO} modo="opcao" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const ConteudoResposta: React.FC<{ m: RespostaT; pergunta?: string; palavras: Palavra[]; t: number; primeiro: boolean; fim: number; segue: boolean }> = ({
  m,
  pergunta,
  palavras,
  t,
  primeiro,
  fim,
  segue,
}) => {
  const a = areaDoCartao();
  const interna = a.h - 2 * PAD_Y;
  const texto = m.pergunta ?? pergunta;
  const resumo = texto ? diagramar(texto, { largura: INTERNA - 54, maximo: 40, minimo: 36, linhas: 2, peso: 600, entrelinha: 1.16 }) : null;
  const alturaResumo = resumo ? resumo.linhas.length * resumo.tam * 1.16 + 20 : 0;
  const marcas = marcasDa(m.fileira, m.de + 0.6);
  const alturaFileira = marcas.length ? 22 + alturaDasEtiquetas(marcas, TEXTO, "marca") : 0;
  const livre = interna - alturaResumo - 40 - 20 - alturaFileira;
  const { linhas, tam } = caber(m.texto, { largura: TEXTO, maximo: 100, minimo: 56, linhas: 2, altura: livre, entrelinha: 1.05, piso: 44 });
  const altura = alturaResumo + 40 + 20 + linhas.length * tam * 1.05 + alturaFileira;
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de + 0.1);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const pResumo = primeiro ? 1 : prog(t, m.de, 0.35);
  const pBloco = primeiro ? 1 : prog(t, m.de + 0.02, 0.4);
  const sai = segue ? saindo(t, fim + 0.06, 0.2) : 0;
  const aceso = prog(t, m.rotuloEm ?? m.de, 0.2);
  const nome = m.rotulo ?? "Resposta";
  // a letra do resumo: a da pergunta anterior (P, ou a do rótulo dela)
  const letraResumo = "P";
  return (
    <div style={{ position: "absolute", left: PAD_X, top: PAD_Y + Math.max(0, (interna - altura) / 2), width: INTERNA, opacity: 1 - sai, translate: `0 ${-50 * sai}px` }}>
      {resumo ? (
        <div style={{ display: "flex", gap: 18, opacity: pResumo, translate: `0 ${(1 - pResumo) * 24}px`, marginBottom: 20 }}>
          <span style={{ ...titulo, fontSize: resumo.tam, lineHeight: 1.16, color: cor.acento }}>{letraResumo}</span>
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: resumo.tam, lineHeight: 1.16, color: cor.textoSuave }}>
            {resumo.linhas.map((l) => (
              <div key={l} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div style={{ opacity: pBloco, translate: `0 ${(1 - pBloco) * 60}px` }}>
        <Rotulo nome={nome} aceso={aceso} />
        <div style={{ height: 20 }} />
        <div style={{ display: "flex" }}>
          <Letra letra={m.letra ?? letraDe(nome)} tam={tam} aceso={aceso} />
          <div>
            <Linhas
              linhas={linhas}
              tempos={tempos}
              t={t}
              tam={tam}
              modo="acende"
              entrelinha={1.05}
              estilo={{ ...titulo, fontSize: tam }}
              corDe={(i) => (destaque.has(i) ? cor.acento : undefined)}
            />
            {marcas.length ? (
              <div style={{ marginTop: 22 }}>
                <Etiquetas itens={marcas} t={t} largura={TEXTO} modo="marca" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// Um cartão para uma sequência de perguntas e respostas coladas (`fim` = fim da última)
export const Entrevista: React.FC<{ grupo: Item[]; perguntaAntes?: string; palavras: Palavra[]; t: number; fim: number; antes?: boolean; depois?: boolean }> = ({
  grupo,
  perguntaAntes,
  palavras,
  t,
  fim,
  antes = false,
  depois = false,
}) => {
  const a = areaDoCartao();
  const de = grupo[0].de;
  const { sobe: p, desce: s, texto } = ritmoDoCartao(t, de, fim, antes, depois);
  if (p <= 0 || s >= 1) return null;
  const fora = H - a.y;
  let pergunta = perguntaAntes;
  return (
    <div
      style={{
        position: "absolute",
        left: a.x,
        top: a.y,
        width: a.w,
        height: a.h,
        borderRadius: 28,
        background: cor.painel,
        boxShadow: `inset 0 0 0 1.5px ${cor.borda}`,
        translate: `0 ${(1 - p) * fora + s * fora}px`,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: texto }}>
      {grupo.map((m, i) => {
        const fimM = grupo[i + 1]?.de ?? fim;
        const segue = i < grupo.length - 1;
        const visivel = t >= m.de - 0.3 && t <= fimM + 0.3;
        if (m.tipo === "pergunta") pergunta = m.texto;
        if (!visivel) return null;
        return m.tipo === "pergunta" ? (
          <ConteudoPergunta key={`p-${m.de}`} m={m} palavras={palavras} t={t} primeiro={i === 0} fim={fimM} segue={segue} />
        ) : (
          <ConteudoResposta key={`r-${m.de}`} m={m} pergunta={pergunta} palavras={palavras} t={t} primeiro={i === 0} fim={fimM} segue={segue} />
        );
      })}
      </div>
    </div>
  );
};
