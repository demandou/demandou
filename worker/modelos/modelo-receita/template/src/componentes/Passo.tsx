import { Escrita, indicesDoTrecho, prog, saindo, temposDoTexto, Traco } from "../anim";
import { ALTURA_LINHA_TITULO, ancoraDaAcao, type EstadoDaCozinha, faixaDasAnotacoes, tituloDoPasso } from "../cena";
import type { Rect } from "../layout";
import type { ItemDoPasso, Palavra, Passo } from "../plano";
import { encaixar, larguraLinha } from "../medida";
import { cor, destaque, fonte, rotulo, TAM, texto, X0, X1 } from "../tema";

// ---------- o número do passo: grande, no cabeçalho ao lado da janela; rola quando é dito ----------

export const CabecalhoDoPasso: React.FC<{
  passos: Passo[];
  // quando começa a troca de layout que leva a cada passo
  trocas: Map<Passo, number>;
  ret: Rect;
  t: number;
  entra: number;
  sai: number;
  total: number;
  someNaSaida?: boolean;
}> = ({ passos, trocas, ret, t, entra, sai, total, someNaSaida = true }) => {
  const e = prog(t, entra, 0.4);
  const s = someNaSaida ? saindo(t, sai + 0.22, 0.22) : 0;
  if (e <= 0 || s >= 1) return null;
  // o número rola quando é dito — mas nunca escondido atrás da janela durante a troca de canto
  const quando = (p: Passo) => Math.max(p.numeroEm ?? p.de + 0.1, (trocas.get(p) ?? -10) + 0.5);
  // números na ordem; o atual é o último cujo instante já passou
  const atuais = passos.filter((p) => t >= quando(p) - 0.12);
  const atual = atuais[atuais.length - 1];
  const anterior = atuais[atuais.length - 2];
  const rola = atual ? prog(t, quando(atual) - 0.12, 0.5) : 0;
  const ALTURA = 318;
  const numero = (n: number | null, y: number) => (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, height: ALTURA, display: "flex", justifyContent: "center", alignItems: "center" }}>
      {n === null ? (
        <div style={{ width: 130, height: 220, borderRadius: 26, border: `4px dashed ${cor.lapis}` }} />
      ) : (
        <span style={{ fontFamily: fonte, fontSize: TAM.numeroPasso, lineHeight: 1, translate: "0 0.05em" }}>{n}</span>
      )}
    </div>
  );
  const nAtual = atual ? atual.numero : null;
  const nAntes = anterior ? anterior.numero : null;
  const feitos = atual ? atual.numero : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: ret.x,
        top: ret.y,
        width: ret.w,
        height: ret.h,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: texto,
        color: cor.cacau,
        opacity: Math.min(e, 1 - s),
        translate: `0 ${(1 - e) * 24 - 20 * s}px`,
      }}
    >
      <div style={rotulo}>Passo</div>
      <div style={{ position: "relative", width: "100%", height: ALTURA, overflow: "hidden", marginTop: 2 }}>
        {rola < 1 ? numero(nAntes, -ALTURA * rola) : null}
        {numero(nAtual, ALTURA * (1 - rola))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4 }}>
        <span style={{ fontSize: TAM.deN, fontStyle: "italic", color: cor.cacauSuave, lineHeight: 1 }}>de {total}</span>
        <div style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: total }, (_, i) => {
            const cheio = i < feitos - 1 ? 1 : i === feitos - 1 ? rola : 0;
            return (
              <div
                key={i}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  border: `3.5px solid ${cor.cacau}`,
                  background: cheio > 0.5 ? cor.pistache : "transparent",
                  scale: String(1 + 0.25 * Math.sin(Math.PI * cheio) * (i === feitos - 1 ? 1 : 0)),
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------- o título do passo, escrito no tempo da fala ----------

export const TituloDoPasso: React.FC<{
  m: Passo;
  corpo: Rect;
  t: number;
  palavras: Palavra[];
  entra: number;
  sai: number;
  someNaSaida?: boolean;
}> = ({ m, corpo, t, palavras, entra, sai, someNaSaida = true }) => {
  const e = prog(t, entra + 0.2, 0.3);
  const s = someNaSaida ? saindo(t, sai + 0.2, 0.2) : 0;
  if (e <= 0 || s >= 1) return null;
  // o título medido: linha longa encolhe para caber (até 64 px) ou quebra em duas
  const { linhas, corpo: corpoTitulo } = tituloDoPasso(m, corpo.w);
  const todas = linhas.join(" ").split(/\s+/).filter(Boolean);
  const tempos = temposDoTexto(linhas.join(" "), palavras, m.de, m.ate, (m.numeroEm ?? m.de) + 0.5);
  const grifo = indicesDoTrecho(todas, m.destaque);
  return (
    <div
      style={{
        position: "absolute",
        left: corpo.x,
        top: corpo.y - 4,
        opacity: Math.min(e, 1 - s),
        translate: `0 ${(1 - e) * 16 - 24 * s}px`,
        fontFamily: fonte,
        color: cor.cacau,
      }}
    >
      <Escrita
        linhas={linhas}
        tempos={tempos}
        t={t}
        esboco={cor.lapis}
        style={{ fontSize: corpoTitulo, lineHeight: `${ALTURA_LINHA_TITULO}px` }}
        estiloDe={(i) => (grifo.has(i) ? destaque : undefined)}
      />
    </div>
  );
};

// ---------- anotações: na faixa acima da panela, à esquerda e à direita, com linha até a ação ----------

const LIMITE_ANOTACAO = Math.floor((X1 - X0 - 40) / 2 / (TAM.anotacao * 0.47));

// Quebra em 1 ou 2 linhas equilibradas ("mexendo / sem parar", não "mexendo sem / parar")
export const quebrarAnotacao = (t: string, limite = LIMITE_ANOTACAO): string[] => {
  const ws = t.split(/\s+/).filter(Boolean);
  if (t.length <= limite || ws.length < 2) return [ws.join(" ")];
  let melhor: string[] = [ws.join(" ")];
  let pior = Infinity;
  for (let k = 1; k < ws.length; k++) {
    const a = ws.slice(0, k).join(" ");
    const b = ws.slice(k).join(" ");
    const maior = Math.max(a.length, b.length);
    if (maior < pior) {
      pior = maior;
      melhor = [a, b];
    }
  }
  return melhor;
};

type Lugar = "esq" | "dir" | "meio";

// Escolhe o lado de cada anotação: a que aponta mais para a esquerda fica à esquerda.
// Uma terceira anotação fica numa etiqueta no meio da faixa, abaixo das outras duas.
const lugares = (itens: ItemDoPasso[], cozinha: EstadoDaCozinha): Lugar[] => {
  const xs = itens.map((it) => ancoraDaAcao(it.acao, cozinha)?.x ?? cozinha.geo.panela.cx);
  if (itens.length === 1) return [xs[0] <= cozinha.geo.panela.cx + 40 ? "esq" : "dir"];
  const ordem = xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x || a.i - b.i);
  const saida: Lugar[] = itens.map(() => "meio");
  saida[ordem[0].i] = "esq";
  saida[ordem[ordem.length - 1].i] = "dir";
  return saida;
};

export const Anotacoes: React.FC<{
  m: Passo;
  corpo: Rect;
  t: number;
  palavras: Palavra[];
  cozinha: EstadoDaCozinha;
  entra: number;
  sai: number;
  someNaSaida?: boolean;
}> = ({ m, corpo, t, palavras, cozinha, entra, sai, someNaSaida = true }) => {
  const s = someNaSaida ? saindo(t, sai + 0.2, 0.2) : 0;
  // os marcadores a lápis entram junto com o título (depois de o passo anterior sair)
  const e = prog(t, entra + 0.2, 0.3);
  if (s >= 1 || e <= 0) return null;
  const faixa = faixaDasAnotacoes(m, corpo);
  const comTexto = m.itens.filter((it) => it.texto && it.texto.trim()).slice(0, 3);
  const onde = lugares(comTexto, cozinha);
  const fonteAn = { familia: "texto" as const, italico: true };
  return (
    <div style={{ position: "absolute", inset: 0, opacity: Math.min(e, 1 - s), fontFamily: texto, color: cor.cacau }}>
      {comTexto.map((it, k) => {
        const lugar = onde[k];
        // anotação medida: até 2 linhas na metade da faixa (a do meio pode usar a largura toda)
        const larguraMax = lugar === "meio" ? X1 - X0 - 80 : (X1 - X0 - 40) / 2;
        const fit = encaixar(it.texto as string, { largura: larguraMax, max: TAM.anotacao, min: 48, linhas: 2, fonte: fonteAn });
        const linhas = fit.linhas;
        const corpoA = fit.corpo;
        const alturaLinha = Math.round(corpoA * 1.04);
        const tempos = temposDoTexto(linhas.join(" "), palavras, it.em - 0.2, m.ate, it.em);
        const altura = linhas.length * alturaLinha;
        const larguraTexto = Math.max(...linhas.map((l) => larguraLinha(l, corpoA, fonteAn)));
        // esquerda: alinhada à margem; direita: alinhada à margem direita; meio: etiqueta abaixo da faixa
        const x = lugar === "dir" ? X1 - larguraTexto : lugar === "meio" ? 540 - larguraTexto / 2 : X0;
        const y = lugar === "meio" ? faixa.y + faixa.h + 10 : faixa.y + (faixa.h - altura - 14) / 2;
        const ancora = ancoraDaAcao(it.acao, cozinha);
        const tinta = prog(t, it.em - 0.08, 0.3);
        const pLinha = prog(t, it.em + 0.25, 0.45);
        const ySub = y + altura + 4;
        // a linha sai do sublinhado, do ponto mais perto do alvo (não atravessa o desenho à toa)
        const alvoX = ancora?.x ?? 540;
        const x0 =
          lugar === "dir"
            ? Math.max(x - 6, Math.min(x + larguraTexto - 12, alvoX))
            : Math.min(x + larguraTexto + 6, Math.max(x + 12, alvoX));
        return (
          <div key={`${it.em}-${k}`}>
            {lugar === "meio" ? (
              <div
                style={{
                  position: "absolute",
                  left: x - 22,
                  top: y - 10,
                  width: larguraTexto + 44,
                  height: altura + 28,
                  borderRadius: 24,
                  background: cor.creme,
                  boxShadow: "0 10px 26px rgba(46,30,26,0.18)",
                  opacity: tinta,
                }}
              />
            ) : null}
            {/* marcador a lápis: o lugar da anotação já está lá antes de ela ser dita */}
            <div style={{ position: "absolute", left: x, top: ySub, width: larguraTexto, borderTop: `3px dashed ${cor.lapis}`, opacity: 1 - tinta }} />
            <div
              style={{
                position: "absolute",
                left: x,
                top: ySub - 1,
                width: larguraTexto,
                height: 6,
                borderRadius: 3,
                background: cor.pistache,
                scale: `${tinta} 1`,
                transformOrigin: lugar === "dir" ? "100% 50%" : "0 50%",
              }}
            />
            <div style={{ position: "absolute", left: x, top: y }}>
              <Escrita
                linhas={linhas}
                tempos={tempos}
                t={t}
                alinhar={lugar === "dir" ? "right" : "left"}
                style={{ fontSize: corpoA, fontStyle: "italic", lineHeight: `${alturaLinha}px`, width: larguraTexto }}
              />
            </div>
            {ancora ? (
              <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
                <Traco
                  d={`M${x0} ${ySub + 2} Q${x0 + (lugar === "dir" ? -40 : 40)} ${(ySub + ancora.y) / 2} ${ancora.x} ${ancora.y}`}
                  p={pLinha}
                  cor={cor.cacau}
                  largura={4}
                />
                {pLinha > 0.95 ? <circle cx={ancora.x} cy={ancora.y} r={13} fill={cor.pistache} stroke={cor.cacau} strokeWidth={4} /> : null}
              </svg>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
