// A resposta: as peças da bancada encolhem e entram na caixa do prompt (ao lado da janelinha da
// pessoa); a caixa é enviada; embaixo, a resposta chega cinza e borrada e entra em foco linha por
// linha até virar uma tabela limpa. A cor de cada peça reaparece no que ela mudou na resposta.
import { desliza, misturaCor, misturaRet, prog, saindo } from "../anim";
import { CAIXA_PROMPT, CARTAO_RESPOSTA, retDaPeca, retNaCaixa } from "../geometria";
import type { Montagem, Palavra, Resposta as TipoResposta } from "../plano";
import { encaixar } from "../medida";
import { cor, corDaPeca, mono, sans, sombra } from "../tema";
import { Icone, iconeDaPeca } from "./Icones";
import { PecaCheia, textoDaPeca } from "./Montagem";
import { FormaDaPeca, Letreiro } from "./Peca";

export const temposDaResposta = (m: TipoResposta) => {
  const envia = m.enviaEm ?? m.de + 0.8;
  const vira = Math.max(envia + 0.2, m.viraEm ?? envia + 0.5);
  const linhas = (m.linhas ?? []).slice(0, 5);
  const titulo = vira;
  const etiquetas = vira + 0.15;
  const cabecalho = vira + 0.28;
  const nota = vira + 0.4;
  const linha = linhas.map((_, k) => vira + (m.nota ? 0.52 : 0.42) + k * 0.12);
  const pronto = (linha[linha.length - 1] ?? nota) + 0.4;
  return { envia, vira, titulo, etiquetas, cabecalho, nota, linha, pronto };
};

// Algo que chega borrado e entra em foco no instante `em`.
export const Foco: React.FC<{ t: number; em: number; children: React.ReactNode; estilo?: React.CSSProperties }> = ({ t, em, children, estilo }) => {
  const q = prog(t, em, 0.42);
  return (
    <div style={{ position: "relative", filter: q < 0.999 ? `blur(${(10 * (1 - q)).toFixed(2)}px) grayscale(${1 - q})` : undefined, opacity: 0.42 + 0.58 * q, ...estilo }}>
      {children}
    </div>
  );
};

// número que conta até o valor quando entra em foco ("620" → 0…620)
const contar = (valor: string, t: number, em: number) => {
  const limpo = valor.replace(/\./g, "").replace(",", ".");
  const alvo = Number(limpo);
  if (!/^\d+([.,]\d+)?$/.test(valor.replace(/\./g, "")) || !Number.isFinite(alvo)) return valor;
  const q = prog(t, em, 0.55);
  const atual = Math.round(alvo * q);
  return atual.toLocaleString("pt-BR");
};

const AvatarIA: React.FC<{ tamanho?: number }> = ({ tamanho = 60 }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      borderRadius: tamanho / 2,
      background: cor.tinta,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: mono,
      fontWeight: 700,
      fontSize: tamanho * 0.5,
      letterSpacing: "0.02em",
      flexShrink: 0,
    }}
  >
    IA
  </div>
);
export { AvatarIA };

export const Resposta: React.FC<{
  m: TipoResposta;
  t: number;
  palavras: Palavra[];
  // a montagem que entrega as peças (encostada antes desta resposta)
  montagem?: Montagem;
  fim: number;
  // depois vem a pessoa em tela cheia: ela cobre a resposta ao crescer, então nada some antes
  cobertaDepois?: boolean;
  // o bloco seguinte da bancada empurra esta página para fora (a troca é feita por fora)
  empurrado?: boolean;
}> = ({ m, t, palavras, montagem, fim, cobertaDepois, empurrado }) => {
  const tp = temposDaResposta(m);
  const itens = montagem?.itens ?? [];
  const n = itens.length;
  const sai = empurrado ? 0 : cobertaDepois ? saindo(t, fim + 0.66, 0.06) : saindo(t, fim + 0.12, 0.25);
  const entraCaixa = prog(t, m.de + 0.25, 0.38);
  const entraCartao = prog(t, m.de + 0.4, 0.5);
  const enviado = prog(t, tp.envia, 0.25);
  const cols = (m.colunas ?? []).slice(0, 3);
  const linhas = cols.length ? (m.linhas ?? []).slice(0, 5) : [];
  const destaque = m.destaqueColuna;
  const cDest = corDaPeca(m.corDestaque ?? 3);
  const numCols = cols.length;

  // a última coluna é "de número" quando todas as células dela são números (kcal, R$, %, horas)
  const numerica = numCols > 1 && linhas.every((l) => /^[\d.,]+\s?(%|h|min|kg|g)?$|^R\$\s?[\d.,]+$/.test((l[numCols - 1] ?? "").trim()));
  // larguras das colunas: a primeira estreita; a de número estreita; a do meio ocupa o resto
  const larguraTabela = CARTAO_RESPOSTA.w - 68;
  const larg =
    numCols === 3
      ? [132, larguraTabela - 132 - 168, 168]
      : numerica
        ? [larguraTabela - 200, 200]
        : [Math.round(larguraTabela * 0.34), Math.round(larguraTabela * 0.66)];
  const alinhar = (k: number): "left" | "right" => (k === numCols - 1 && numerica ? "right" : "left");
  // as linhas ocupam a altura do cartão (mais altas quando são poucas)
  const alturaLinha = Math.min(124, (CARTAO_RESPOSTA.h - 296 - 60 - 34) / Math.max(1, linhas.length + (m.nota ? 1 : 0)));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {/* a caixa do prompt */}
      <div
        style={{
          position: "absolute",
          left: CAIXA_PROMPT.x,
          top: CAIXA_PROMPT.y,
          width: CAIXA_PROMPT.w,
          height: CAIXA_PROMPT.h,
          borderRadius: 32,
          background: cor.cartao,
          boxShadow: sombra(1),
          opacity: entraCaixa,
          scale: String(0.96 + 0.04 * entraCaixa),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: mono,
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: enviado > 0.5 ? cor.tinta : cor.tintaSuave,
          }}
        >
          {enviado > 0.5 ? <Icone nome="check" tamanho={34} cor={corDaPeca(1).escura} espessura={4.5} p={prog(t, tp.envia + 0.1, 0.3)} /> : null}
          {enviado > 0.5 ? "Prompt enviado" : "Seu prompt"}
        </div>
        {/* botão de enviar */}
        <div
          style={{
            position: "absolute",
            right: 22,
            bottom: 22,
            width: 86,
            height: 86,
            borderRadius: 43,
            background: misturaCor(cor.cartaoFundo, cor.tinta, prog(t, tp.envia - 0.25, 0.2)),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(1 - 0.08 * (prog(t, tp.envia - 0.06, 0.06) - prog(t, tp.envia + 0.02, 0.18))),
          }}
        >
          <Icone
            nome="enviar"
            tamanho={46}
            cor={prog(t, tp.envia - 0.25, 0.2) > 0.5 ? "#fff" : cor.lapis}
            espessura={4.6}
            estilo={{ translate: `0 ${-8 * (prog(t, tp.envia, 0.12) - prog(t, tp.envia + 0.12, 0.25))}px` }}
          />
        </div>
      </div>

      {/* o cartão da resposta */}
      <div
        style={{
          position: "absolute",
          left: CARTAO_RESPOSTA.x,
          top: CARTAO_RESPOSTA.y,
          width: CARTAO_RESPOSTA.w,
          height: CARTAO_RESPOSTA.h,
          borderRadius: 36,
          background: cor.cartao,
          boxShadow: sombra(1),
          opacity: entraCartao,
          translate: `0 ${(1 - entraCartao) * 70}px`,
          overflow: "hidden",
        }}
      >
        {/* cabeçalho do assistente: o papel que a IA assumiu, na cor da primeira peça */}
        <div style={{ position: "absolute", left: 34, top: 30, display: "flex", alignItems: "center", gap: 18 }}>
          <AvatarIA />
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, color: cor.tinta }}>Assistente</div>
          {m.papel ? (
            <Foco t={t} em={tp.etiquetas}>
              <div
                style={{
                  height: 54,
                  padding: "0 22px",
                  borderRadius: 27,
                  display: "flex",
                  alignItems: "center",
                  background: corDaPeca(0).forte,
                  color: corDaPeca(0).texto,
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: 34,
                  whiteSpace: "nowrap",
                }}
              >
                como {m.papel}
              </div>
            </Foco>
          ) : null}
        </div>

        {/* título + "exemplo" */}
        <div style={{ position: "absolute", left: 34, right: 34, top: 120, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Foco t={t} em={tp.titulo}>
            <div style={{ position: "relative", fontFamily: sans, fontWeight: 700, fontSize: 60, lineHeight: 1.05, color: cor.tinta, letterSpacing: "-0.015em" }}>
              {m.titulo}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: -10,
                  height: 8,
                  borderRadius: 4,
                  width: "100%",
                  background: corDaPeca(1).forte,
                  scale: `${prog(t, tp.titulo + 0.2, 0.4)} 1`,
                  transformOrigin: "left center",
                }}
              />
            </div>
          </Foco>
          {m.exemplo === false || (m.exemplo === undefined && !linhas.length) ? null : (
            <div
              style={{
                marginTop: 8,
                height: 48,
                padding: "0 16px",
                borderRadius: 12,
                border: `3px dashed ${cor.lapis}`,
                display: "flex",
                alignItems: "center",
                fontFamily: mono,
                fontWeight: 600,
                fontSize: 32,
                letterSpacing: "0.06em",
                color: cor.tintaSuave,
                textTransform: "uppercase",
                opacity: prog(t, tp.titulo, 0.3),
              }}
            >
              exemplo
            </div>
          )}
        </div>

        {/* etiquetas: de qual peça veio cada coisa */}
        <div style={{ position: "absolute", left: 34, top: 212, display: "flex", gap: 14 }}>
          {(m.etiquetas ?? []).slice(0, 3).map((e, k) => {
            const c = corDaPeca(e.peca);
            return (
              <Foco key={e.texto + k} t={t} em={tp.etiquetas + k * 0.08}>
                <div
                  style={{
                    height: 56,
                    padding: "0 22px 0 14px",
                    borderRadius: 28,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: c.clara,
                    color: c.escura,
                    fontFamily: sans,
                    fontWeight: 600,
                    fontSize: 36,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icone nome={iconeDaPeca(itens[e.peca]?.nome ?? "", itens[e.peca]?.icone, e.peca)} tamanho={34} cor={c.escura} espessura={4} />
                  {e.texto}
                </div>
              </Foco>
            );
          })}
        </div>

        {/* a tabela */}
        {cols.length ? (
        <div style={{ position: "absolute", left: 34, top: 296, width: larguraTabela }}>
          {/* faixa da coluna destacada (ex.: calorias, pedidas no Formato) */}
          {destaque !== undefined && destaque < numCols ? (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: larg.slice(0, destaque).reduce((a, b) => a + b, 0),
                width: larg[destaque],
                height: 60 + alturaLinha * (linhas.length + (m.nota ? 1 : 0)) + 6,
                borderRadius: 18,
                background: cDest.clara,
                opacity: prog(t, tp.cabecalho, 0.4),
              }}
            />
          ) : null}
          {/* cabeçalho */}
          <Foco t={t} em={tp.cabecalho}>
            <div style={{ display: "flex", height: 60, alignItems: "center", borderBottom: `3px solid ${cor.linha}` }}>
              {cols.map((c, k) => (
                <div
                  key={c + k}
                  style={{
                    width: larg[k],
                    padding: "0 18px",
                    textAlign: alinhar(k),
                    fontFamily: mono,
                    fontWeight: 600,
                    fontSize: 32,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: k === destaque ? cDest.escura : cor.tintaSuave,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </Foco>
          {/* linha de destaque (nota) */}
          {m.nota ? (
            <Foco t={t} em={tp.nota}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: alturaLinha - 10,
                  margin: "5px 0",
                  borderRadius: 18,
                  background: corDaPeca(m.nota.peca ?? 2).clara,
                  color: corDaPeca(m.nota.peca ?? 2).escura,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, paddingLeft: 18, flex: 1, fontFamily: sans, fontWeight: 600, fontSize: 44, whiteSpace: "nowrap" }}>
                  <Icone nome="sol" tamanho={44} cor={corDaPeca(m.nota.peca ?? 2).escura} espessura={3.8} />
                  {m.nota.texto}
                </div>
                {m.nota.valor ? (
                  <div style={{ width: larg[numCols - 1], padding: "0 18px", textAlign: "right", fontFamily: mono, fontWeight: 600, fontSize: 44 }}>
                    {contar(m.nota.valor, t, tp.nota)}
                  </div>
                ) : null}
              </div>
            </Foco>
          ) : null}
          {/* linhas */}
          {linhas.map((l, j) => (
            <Foco key={`linha-${j}`} t={t} em={tp.linha[j]}>
              <div style={{ display: "flex", height: alturaLinha, alignItems: "center", borderBottom: j < linhas.length - 1 ? `2px solid ${cor.linha}` : "none" }}>
                {cols.map((_, k) => {
                  const valor = l[k] ?? "";
                  const ultimo = k === numCols - 1 && numerica;
                  return (
                    <div
                      key={`c-${j}-${k}`}
                      style={{
                        width: larg[k],
                        padding: "0 18px",
                        textAlign: alinhar(k),
                        fontFamily: ultimo ? mono : sans,
                        fontWeight: k === 0 ? 700 : ultimo ? 600 : 500,
                        fontSize: 44,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: k === destaque ? cDest.escura : cor.tinta,
                      }}
                    >
                      {ultimo ? contar(valor, t, tp.linha[j]) : valor}
                    </div>
                  );
                })}
              </div>
            </Foco>
          ))}
        </div>
        ) : null}
        {/* sem tabela: a resposta mostra o que cada peça trouxe, linha por linha, na cor da peça */}
        {!cols.length && itens.length ? (
          <div style={{ position: "absolute", left: 34, top: 296, width: CARTAO_RESPOSTA.w - 68 }}>
            {itens.slice(0, 5).map((it, k) => {
              const c = corDaPeca(k);
              const alt = Math.min(112, (CARTAO_RESPOSTA.h - 296 - 30) / Math.max(1, Math.min(5, itens.length)));
              const enc = encaixar(it.texto, { largura: CARTAO_RESPOSTA.w - 68 - 130, max: 44, min: 36, linhas: 2, fonte: { peso: 600 } });
              return (
                <Foco key={`linha-${k}`} t={t} em={tp.vira + 0.42 + k * 0.14}>
                  <div style={{ display: "flex", alignItems: "center", gap: 22, height: alt, borderBottom: k < Math.min(5, itens.length) - 1 ? `2px solid ${cor.linha}` : "none" }}>
                    <div style={{ position: "relative", width: 96, height: 60, flexShrink: 0 }}>
                      <FormaDaPeca r={{ x: 0, y: 0, w: 96, h: 60 }} preenchimento={c.forte} lateral raio={16} encaixe={false}>
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icone nome={iconeDaPeca(it.nome ?? "", it.icone, k)} tamanho={34} cor={c.texto} espessura={4} />
                        </div>
                      </FormaDaPeca>
                    </div>
                    <div style={{ fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.1, color: cor.tinta }}>
                      {enc.linhas.map((l, n) => (
                        <div key={n}>{l.join(" ")}</div>
                      ))}
                    </div>
                  </div>
                </Foco>
              );
            })}
          </div>
        ) : null}
      </div>
      {/* as peças: da pilha para a caixa (encolhem; o texto some e fica o letreiro) */}
      {itens.map((it, i) => {
        if (!montagem) return null;
        const q = prog(t, m.de + 0.22 + i * 0.07, 0.6, desliza);
        const r = misturaRet(retDaPeca(i, n), retNaCaixa(i, n), q);
        const c = corDaPeca(i);
        if (q < 0.55) {
          return (
            <PecaCheia
              key={`ida-${i}`}
              m={montagem}
              i={i}
              r={r}
              t={t}
              tempos={textoDaPeca(montagem, i, palavras)}
              cursorAte={0}
              sombra={1 + q}
              texto={1 - prog(t, m.de + 0.22 + i * 0.07, 0.16)}
            />
          );
        }
        return (
          <FormaDaPeca key={`caixa-${i}`} r={r} preenchimento={c.forte} sombra={1} raio={18}>
            <Letreiro
              nome={it.nome ?? ""}
              icone={iconeDaPeca(it.nome ?? "", it.icone, i)}
              corTexto={c.texto}
              fundo="transparent"
              estilo={{ position: "absolute", left: 6, top: Math.max(0, (r.h - 52) / 2) }}
            />
          </FormaDaPeca>
        );
      })}

    </div>
  );
};
