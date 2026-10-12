// Paleta de amostras: 2 a 4 cores com nome, cada uma "passada" quando é dita.
// No layout "lado" ocupa o painel; em tela cheia vira um cartão com godês lado a lado.
// No quadro deitado (src/fileira.ts) a paleta do painel vira uma fileira de colunas (uma por cor,
// como uma cartela), e o cartão fica largo e baixo, com o título à esquerda e os godês à direita.
import { Palavras, prog, saindo, temposDoTexto } from "../anim";
import { CARTAO_LARGO, INTERNA_PAINEL, PAINEL } from "../fileira";
import type { Lado, Palavra, Amostras as TAmostras } from "../plano";
import type { Regiao } from "../layout";
import { baseDoCartao, caber, cor, corDoProduto, deitado, fonte, rotulo, tom } from "../tema";
import { Gode, Passada } from "./Amostra";
import { Folha, deslocDoPainel } from "./Paineis";
import { alturaDe, medir } from "./Texto";

const VAO_COLUNAS = 44;

export const PainelAmostras: React.FC<{
  m: TAmostras;
  t: number;
  fim: number;
  palavras: Palavra[];
  regiao: Regiao;
  regiaoFinal: Regiao;
  lado: Lado;
  colado?: boolean;
}> = ({ m, t, fim, palavras, regiao, regiaoFinal, colado }) => {
  const desloc = deslocDoPainel(regiao, regiaoFinal);
  const x0 = PAINEL.margem;
  const interna = INTERNA_PAINEL;
  const inicio = Math.max(0, m.de);
  const titulo = m.titulo ?? "";
  const tempos = temposDoTexto(titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.1);
  const medTitulo = titulo ? medir(titulo, interna, deitado(72), 44, 2) : null;
  const topoTitulo = PAINEL.topo + (m.rotulo ? 30 + 18 : 0);
  const fimCabecalho = medTitulo ? topoTitulo + alturaDe(medTitulo, 1.1) : topoTitulo;
  // as cores lado a lado, cada uma numa coluna, centradas na altura que sobra
  const n = Math.max(1, m.itens.length);
  const larguraItem = (interna - (n - 1) * VAO_COLUNAS) / n;
  const fonteNome = Math.min(...m.itens.map((it) => caber(it.nome, larguraItem, 56)));
  const livre = PAINEL.base - (fimCabecalho + 60);
  const altura = Math.max(90, Math.min(240, larguraItem * 0.62, livre - fonteNome * 1.2 - 18));
  const bloco = altura + 18 + fonteNome * 1.2;
  const topoItens = fimCabecalho + 60 + Math.max(0, (livre - bloco) / 2);
  return (
    <Folha desloc={desloc} t={t} fim={fim} colado={colado}>
      <div style={{ position: "absolute", left: x0, top: PAINEL.topo, width: interna }}>
        {m.rotulo ? <div style={{ ...rotulo, color: cor.berry, opacity: prog(t, inicio + 0.05, 0.4), marginBottom: 18 }}>{m.rotulo}</div> : null}
        {titulo && medTitulo
          ? medTitulo.linhas.map((l, i) => {
              const antes = medTitulo.linhas.slice(0, i).join(" ").split(/\s+/).filter(Boolean).length;
              const n2 = l.split(/\s+/).filter(Boolean).length;
              return (
                <Palavras
                  key={i}
                  texto={l}
                  tempos={tempos.slice(antes, antes + n2)}
                  t={t}
                  style={{ fontSize: medTitulo.tamanho, fontWeight: 600, lineHeight: 1.1, height: medTitulo.tamanho * 1.1 }}
                />
              );
            })
          : null}
      </div>
      {m.itens.map((it, i) => {
        if (t < inicio + 0.3) return null;
        return (
          <div key={i} style={{ position: "absolute", left: x0 + i * (larguraItem + VAO_COLUNAS), top: topoItens, width: larguraItem }}>
            <Passada
              cor={corDoProduto(it.cor, tom(i))}
              t={t}
              em={it.em}
              largura={larguraItem}
              altura={altura}
              id={`amostra-${m.de}-${i}`}
              rascunho={inicio + 0.35 + i * 0.12}
            />
            <div style={{ marginTop: 18, fontSize: fonteNome, lineHeight: 1.2, fontWeight: 600, whiteSpace: "nowrap", opacity: prog(t, it.em + 0.2, 0.4) }}>{it.nome}</div>
          </div>
        );
      })}
    </Folha>
  );
};

// o cartão largo: título (quando há) numa coluna à esquerda, os godês em fileira à direita
const COLUNA_TITULO = 520;

export const CartaoAmostras: React.FC<{ m: TAmostras; t: number; fim: number; palavras: Palavra[] }> = ({ m, t, fim, palavras }) => {
  const inicio = Math.max(0, m.de);
  const entra = prog(t, inicio + 0.05, 0.6);
  const sai = saindo(t, fim, 0.35);
  if (entra <= 0 || sai >= 1) return null;
  const { x, w, pad } = CARTAO_LARGO;
  const titulo = m.titulo ?? "";
  const tempos = temposDoTexto(titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.1);
  const medTitulo = titulo ? medir(titulo, COLUNA_TITULO, deitado(64), 44, 3) : null;
  const xItens = pad + (titulo ? COLUNA_TITULO + 48 : 0);
  const larguraItens = w - xItens - pad;
  const n = Math.max(1, m.itens.length);
  const larguraItem = larguraItens / n;
  const god = Math.min(170, larguraItem - 40);
  const fonteNome = Math.min(...m.itens.map((it) => caber(it.nome, larguraItem - 16, 44)));
  const h = pad + Math.max(god + 16 + fonteNome * 1.2, medTitulo ? alturaDe(medTitulo, 1.1) : 0) + pad * 0.8;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: baseDoCartao(m) - h + (1 - entra + sai) * (h + 120),
        width: w,
        height: h,
        borderRadius: 44,
        background: cor.creme,
        boxShadow: "0 18px 50px rgba(30,14,22,0.28)",
        fontFamily: fonte,
        color: cor.tinta,
        overflow: "hidden",
      }}
    >
      {titulo && medTitulo ? (
        <div style={{ position: "absolute", left: pad, top: (h - alturaDe(medTitulo, 1.1)) / 2, width: COLUNA_TITULO }}>
          {medTitulo.linhas.map((l, i) => {
            const antes = medTitulo.linhas.slice(0, i).join(" ").split(/\s+/).filter(Boolean).length;
            const n2 = l.split(/\s+/).filter(Boolean).length;
            return (
              <Palavras
                key={i}
                texto={l}
                tempos={tempos.slice(antes, antes + n2)}
                t={t}
                style={{ fontSize: medTitulo.tamanho, fontWeight: 600, lineHeight: 1.1, height: medTitulo.tamanho * 1.1 }}
              />
            );
          })}
        </div>
      ) : null}
      {m.itens.map((it, i) => (
        <div key={i} style={{ position: "absolute", left: xItens + i * larguraItem, top: pad, width: larguraItem, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Gode cor={corDoProduto(it.cor, tom(i))} t={t} em={it.em} tamanho={god} id={`gode-a-${m.de}-${i}`} />
          <div style={{ marginTop: 16, fontSize: fonteNome, lineHeight: 1.2, fontWeight: 600, whiteSpace: "nowrap", opacity: prog(t, it.em + 0.2, 0.4) }}>{it.nome}</div>
        </div>
      ))}
    </div>
  );
};
