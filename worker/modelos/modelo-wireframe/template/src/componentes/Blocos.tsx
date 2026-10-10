// Os blocos universais na linguagem do Wireframe: um programa de design.
//   - Lista, passos, comparação e gráfico viram um FRAME no canvas (no lugar do celular), com o painel
//     de camadas ao lado: cada item nasce como barra cinza de wireframe e vira texto na palavra dita,
//     com etiqueta vermelha numerada e contorno tracejado como numa revisão.
//   - Número, destaque, definição e pergunta são camadas de texto selecionadas em quadro cheio (caixa
//     vermelha, alças nos cantos, nome da camada e medida L × A), como a abertura.
// O que ainda não foi dito é só a barra cinza do tamanho da palavra; nunca o texto.
import { Easing } from "remotion";
import { mixCor, PalavraWire, prog, saindo, viagem } from "../anim";
import { MONO_FORTE, SANS, TITULO, type Quebra, encaixar, encaixarNaCaixa, larguraTexto } from "../medida";
import type { Comparacao, Definicao, Destaque, Grafico, Numero, Pagina, Palavra, Passos, Pergunta, Topicos } from "../plano";
import { CARTAO, cor, mono, sans } from "../tema";
import { temposDoTexto } from "../tempos";
import { Check } from "./Icones";

// ---------- números em pt-BR ----------

export const fmtNum = (v: number, casas = 0, agrupar = true) => {
  const [i, d] = Math.abs(v).toFixed(casas).split(".");
  const milhar = agrupar ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : i;
  return (v < 0 ? "−" : "") + milhar + (d ? `,${d}` : "");
};
const casasDe = (v: number) => Math.min(3, (String(v).split(".")[1] ?? "").length);

// ---------- texto encaixado: barra cinza de wireframe que vira palavra ----------

const linhasDe = (q: Quebra) => q.linhas.map((l) => l.map((w) => w.w).join(" "));
const limpa = (w: string) => w.toLowerCase().replace(/[.,!?:;]$/, "");

// índices das palavras de `texto` que casam com `trecho` (palavras seguidas)
const indicesDo = (texto: string, trecho?: string) => {
  const acesas = new Set<number>();
  if (!trecho) return acesas;
  const alvo = trecho.split(/\s+/).filter(Boolean).map(limpa);
  const ws = texto.split(/\s+/).filter(Boolean).map(limpa);
  for (let i = 0; alvo.length && i + alvo.length <= ws.length; i++) if (alvo.every((a, k) => ws[i + k] === a)) alvo.forEach((_, k) => acesas.add(i + k));
  return acesas;
};

const Linhas: React.FC<{
  q: Quebra;
  tempos: number[];
  t: number;
  corTexto?: string;
  corDe?: (i: number) => string | undefined;
  barra?: string;
  peso?: 500 | 700;
  alturaLinha?: number;
  alinhar?: "left" | "center";
}> = ({ q, tempos, t, corTexto = cor.tinta, corDe, barra = "#DADDE2", peso = 700, alturaLinha = 1.08, alinhar = "left" }) => {
  let k = 0;
  return (
    <div style={{ fontFamily: sans, fontWeight: peso, fontSize: q.tamanho, lineHeight: `${Math.round(q.tamanho * alturaLinha)}px`, color: corTexto, textAlign: alinhar }}>
      {linhasDe(q).map((linha, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {linha.split(" ").map((w, j) => {
            const idx = k++;
            return <PalavraWire key={j} t={t} em={tempos[idx] ?? 0} texto={w} barra={barra} cor={corDe?.(idx) ?? corTexto} margem={0.24} />;
          })}
        </div>
      ))}
    </div>
  );
};

const alturaDe = (q: Quebra, alturaLinha = 1.08) => q.linhas.length * Math.round(q.tamanho * alturaLinha);

// ---------- a camada selecionada (quadro cheio) ----------

const PAD_X = 46;
const PAD_Y = 30;
const LARGURA = CARTAO.w - 2 * PAD_X;

const Chrome: React.FC<{
  t: number;
  de: number;
  saiAte: number;
  topo: number;
  nome: string;
  altura: number;
  fundo?: string;
  children: React.ReactNode;
}> = ({ t, de, saiAte, topo, nome, altura, fundo = cor.papel, children }) => {
  const entra = prog(t, de - 0.05, 0.35);
  const sai = saindo(t, saiAte, 0.32);
  if (entra <= 0 || sai >= 1) return null;
  const largura = CARTAO.w;
  const sel = prog(t, de, 0.4);
  const alca = (k: number) => prog(t, de + 0.05 + k * 0.05, 0.22);
  const medida = prog(t, de + 0.25, 0.55);
  return (
    <div style={{ position: "absolute", left: CARTAO.x, top: topo, width: largura, opacity: 1 - sai, translate: `0 ${(1 - entra) * 34 - sai * 30}px`, scale: String(1 - 0.06 * sai) }}>
      <div style={{ position: "absolute", left: -6, top: -52, fontFamily: mono, fontWeight: 700, fontSize: 30, color: "#FFFFFF", background: cor.vermelho, padding: "2px 12px", borderRadius: 6, opacity: sel, whiteSpace: "nowrap" }}>{nome}</div>
      <div style={{ position: "relative", width: largura, height: altura, borderRadius: 14, background: fundo, boxShadow: "0 24px 60px rgba(10,10,12,0.30)", boxSizing: "border-box", opacity: entra, overflow: "hidden" }}>{children}</div>
      <div style={{ position: "absolute", left: -6, top: -6, width: largura + 12, height: altura + 12, border: `3px solid ${cor.vermelho}`, opacity: sel, boxSizing: "border-box" }} />
      {[
        [-6, -6],
        [largura + 6, -6],
        [-6, altura + 6],
        [largura + 6, altura + 6],
      ].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x - 11, top: y - 11, width: 22, height: 22, background: "#FFFFFF", border: `3px solid ${cor.vermelho}`, boxSizing: "border-box", transform: `scale(${alca(i)})` }} />
      ))}
      <div style={{ position: "absolute", left: 0, width: largura, top: altura + 24, display: "flex", justifyContent: "center", opacity: medida }}>
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 30, color: "#FFFFFF", background: cor.vermelho, padding: "3px 14px", borderRadius: 8, whiteSpace: "nowrap" }}>
          {Math.round(largura * medida)} × {Math.round(altura * medida)}
        </div>
      </div>
    </div>
  );
};

type PropsCheia<M> = { m: M; t: number; palavras: Palavra[]; entra: number; saiAte: number; topo: number; alturaMax: number; pagina: Required<Pagina>; fim: number };

// marca-texto da cor da página atrás de uma linha de texto (cresce da esquerda)
const Marca: React.FC<{ largura: number; p: number; cor: string; altura: number }> = ({ largura, p, cor: c, altura }) => (
  <div style={{ position: "absolute", left: -8, bottom: altura * 0.12, width: (largura + 16) * p, height: altura * 0.42, background: c, borderRadius: 6, zIndex: 0 }} />
);

// ---- número ----
export const BNumero: React.FC<PropsCheia<Numero>> = ({ m, t, palavras, entra, saiAte, topo, alturaMax, pagina, fim }) => {
  const casas = m.casas ?? casasDe(m.valor);
  const agrupar = !(Number.isInteger(m.valor) && m.valor >= 1900 && m.valor <= 2100 && !m.prefixo && !m.sufixo);
  const conta = prog(t, m.em, 1.15, Easing.out(Easing.cubic));
  const final = fmtNum(m.valor, casas, agrupar);
  const mostra = fmtNum(m.valor * conta, casas, agrupar);
  const sufixoLetras = /[a-zA-Z]/.test(m.sufixo ?? "");
  const sepW = (s: number) => [...final].filter((c) => c === "." || c === ",").length * s * 0.3;
  const larguraTotal = (s: number) =>
    (m.prefixo ? larguraTexto(m.prefixo, s * 0.52, MONO_FORTE) + s * 0.1 : 0) + larguraTexto(final.replace(/[.,]/g, ""), s, MONO_FORTE) + sepW(s) + (m.sufixo ? larguraTexto(m.sufixo, s * 0.52, MONO_FORTE) + s * (sufixoLetras ? 0.16 : 0.04) : 0);
  let tamanho = 140;
  while (tamanho > 60 && larguraTotal(tamanho) > LARGURA) tamanho -= 4;
  const rotuloEm = m.rotuloEm ?? m.em + 0.3;
  let qRotulo = encaixar(m.rotulo, { largura: LARGURA, max: 56, min: 40, linhas: 2, estilo: () => TITULO });
  const tRotulo = temposDoTexto(m.rotulo, palavras, rotuloEm - 0.25, fim);
  let altura = 2 * PAD_Y + tamanho * 1.05 + 10 + alturaDe(qRotulo);
  while (altura > alturaMax && tamanho > 60) {
    tamanho -= 6;
    altura = 2 * PAD_Y + tamanho * 1.05 + 10 + alturaDe(qRotulo);
  }
  if (altura > alturaMax) {
    qRotulo = encaixar(m.rotulo, { largura: LARGURA, max: 40, min: 36, linhas: 2, estilo: () => TITULO });
    altura = 2 * PAD_Y + tamanho * 1.05 + 10 + alturaDe(qRotulo);
  }
  const largNumero = larguraTotal(tamanho);
  const marca = prog(t, m.em + 1.1, 0.5);
  return (
    <Chrome t={t} de={entra} saiAte={saiAte} topo={topo} nome="Número" altura={altura}>
      <div style={{ padding: `${PAD_Y}px ${PAD_X}px`, position: "relative" }}>
        {m.ilustrativo ? (
          <div style={{ position: "absolute", right: 22, top: 18, fontFamily: mono, fontWeight: 700, fontSize: 30, color: "#FFFFFF", background: cor.vermelho, padding: "2px 12px", borderRadius: 6 }}>ILUSTRATIVO</div>
        ) : null}
        <div style={{ position: "relative", display: "inline-flex", alignItems: "baseline", height: tamanho * 1.05, whiteSpace: "nowrap", fontFamily: mono, fontWeight: 700, color: cor.tinta }}>
          <Marca largura={largNumero} p={marca} cor={pagina.cor} altura={tamanho} />
          {m.prefixo ? <span style={{ position: "relative", fontSize: tamanho * 0.52, marginRight: tamanho * 0.1, color: cor.tintaSuave }}>{m.prefixo}</span> : null}
          <span style={{ position: "relative", fontSize: tamanho, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {[...mostra].map((c, i) =>
              c === "." || c === "," ? (
                <span key={i} style={{ display: "inline-block", width: tamanho * 0.3, textAlign: "center" }}>
                  {c}
                </span>
              ) : (
                <span key={i}>{c}</span>
              ),
            )}
          </span>
          {m.sufixo ? <span style={{ position: "relative", fontSize: tamanho * 0.52, marginLeft: tamanho * (sufixoLetras ? 0.16 : 0.04), color: cor.tintaSuave }}>{m.sufixo}</span> : null}
        </div>
        <div style={{ marginTop: 10 }}>
          <Linhas q={qRotulo} tempos={tRotulo} t={t} />
        </div>
      </div>
    </Chrome>
  );
};

// ---- destaque ----
export const BDestaque: React.FC<PropsCheia<Destaque>> = ({ m, t, palavras, entra, saiAte, topo, alturaMax, pagina, fim }) => {
  const alerta = m.nivel === "alerta";
  const q = encaixarNaCaixa(m.texto, { largura: LARGURA, altura: alturaMax - 2 * PAD_Y - (m.detalhe ? 100 : 0), max: 92, min: 52, linhas: 3, estilo: () => TITULO, alturaLinha: 1.06 });
  const tTexto = temposDoTexto(m.texto, palavras, m.em - 0.25, fim);
  const fimTexto = tTexto[tTexto.length - 1] ?? m.em;
  const detEm = m.detalheEm ?? fimTexto + 0.3;
  const qDet = m.detalhe ? encaixar(m.detalhe, { largura: LARGURA, max: 46, min: 34, linhas: 2, estilo: () => SANS }) : null;
  const tDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, detEm - 0.25, fim) : [];
  const altura = 2 * PAD_Y + alturaDe(q, 1.06) + (qDet ? 14 + alturaDe(qDet, 1.16) : 0);
  const linhas = linhasDe(q);
  // `chave`: marca-texto da cor da página sob cada linha, à medida que ela é dita
  let k = 0;
  const marcas = linhas.map((l) => {
    const n = l.split(" ").length;
    const ultimo = tTexto[Math.min(tTexto.length - 1, k + n - 1)] ?? m.em;
    k += n;
    return { w: larguraTexto(l, q.tamanho, TITULO), p: prog(t, ultimo - 0.2, 0.45) };
  });
  const entraAlerta = prog(t, m.em, 0.3);
  return (
    <Chrome t={t} de={entra} saiAte={saiAte} topo={topo} nome={alerta ? "Alerta" : "Destaque"} altura={altura} fundo={alerta ? cor.vermelho : cor.papel}>
      <div style={{ padding: `${PAD_Y}px ${PAD_X}px`, position: "relative" }}>
        {alerta ? (
          <div style={{ position: "absolute", right: 24, top: 22, width: 54, height: 54, borderRadius: 27, background: "#FFFFFF", color: cor.vermelho, fontFamily: mono, fontWeight: 700, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", scale: String(0.7 + 0.3 * entraAlerta), opacity: entraAlerta }}>!</div>
        ) : null}
        <div style={{ position: "relative" }}>
          {!alerta
            ? linhas.map((l, i) => (
                <div key={i} style={{ position: "absolute", left: 0, top: i * Math.round(q.tamanho * 1.06), height: Math.round(q.tamanho * 1.06) }}>
                  <Marca largura={marcas[i].w} p={marcas[i].p} cor={pagina.cor} altura={Math.round(q.tamanho * 1.06)} />
                </div>
              ))
            : null}
          <div style={{ position: "relative" }}>
            <Linhas q={q} tempos={tTexto} t={t} corTexto={alerta ? "#FFFFFF" : cor.tinta} barra={alerta ? "rgba(255,255,255,0.35)" : "#DADDE2"} alturaLinha={1.06} />
          </div>
        </div>
        {qDet ? (
          <div style={{ marginTop: 14 }}>
            <Linhas q={qDet} tempos={tDet} t={t} peso={500} corTexto={alerta ? "#FFFFFF" : cor.tintaSuave} barra={alerta ? "rgba(255,255,255,0.35)" : "#DADDE2"} alturaLinha={1.16} />
          </div>
        ) : null}
      </div>
    </Chrome>
  );
};

// ---- definição ----
export const BDefinicao: React.FC<PropsCheia<Definicao>> = ({ m, t, palavras, entra, saiAte, topo, alturaMax, pagina, fim }) => {
  const disponivel = alturaMax - 2 * PAD_Y - 56;
  const qTermo = encaixarNaCaixa(m.termo, { largura: LARGURA, altura: Math.min(190, disponivel * 0.5), max: 100, min: 56, linhas: 2, estilo: () => TITULO, alturaLinha: 1.04 });
  const qSig = encaixarNaCaixa(m.significado, { largura: LARGURA, altura: disponivel - alturaDe(qTermo, 1.04), max: 52, min: 36, linhas: 3, estilo: () => SANS, alturaLinha: 1.16 });
  const tTermo = temposDoTexto(m.termo, palavras, m.em - 0.25, fim);
  const tSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.25, fim);
  const altura = 2 * PAD_Y + alturaDe(qTermo, 1.04) + 56 + alturaDe(qSig, 1.16);
  const fimTermo = tTermo[tTermo.length - 1] ?? m.em;
  const marca = prog(t, fimTermo - 0.1, 0.45);
  const medida = prog(t, fimTermo + 0.05, Math.max(0.3, m.significadoEm - fimTermo - 0.1), Easing.inOut(Easing.cubic));
  const larg1 = Math.max(...linhasDe(qTermo).map((l) => larguraTexto(l, qTermo.tamanho, TITULO)));
  return (
    <Chrome t={t} de={entra} saiAte={saiAte} topo={topo} nome="Termo" altura={altura}>
      <div style={{ padding: `${PAD_Y}px ${PAD_X}px`, position: "relative" }}>
        <div style={{ position: "relative", width: "fit-content" }}>
          <Marca largura={larg1} p={marca} cor={pagina.cor} altura={Math.round(qTermo.tamanho * 1.04) * qTermo.linhas.length} />
          <div style={{ position: "relative" }}>
            <Linhas q={qTermo} tempos={tTermo} t={t} alturaLinha={1.04} />
          </div>
        </div>
        {/* redline entre as duas camadas: a medida do vão */}
        <div style={{ height: 56, position: "relative" }}>
          <div style={{ position: "absolute", left: 6, top: 6, width: 3, height: 44 * medida, background: cor.vermelho }} />
          <div style={{ position: "absolute", left: -2, top: 6, width: 19, height: 3, background: cor.vermelho, opacity: medida }} />
          <div style={{ position: "absolute", left: -2, top: 6 + 44 * medida, width: 19, height: 3, background: cor.vermelho, opacity: medida }} />
          <div style={{ position: "absolute", left: 28, top: 8, fontFamily: mono, fontWeight: 700, fontSize: 30, color: cor.vermelho, opacity: medida }}>{Math.round(24 * medida)} px</div>
        </div>
        <Linhas q={qSig} tempos={tSig} t={t} peso={500} corTexto={cor.tinta} alturaLinha={1.16} />
      </div>
    </Chrome>
  );
};

// ---- pergunta ----
export const BPergunta: React.FC<PropsCheia<Pergunta>> = ({ m, t, palavras, entra, saiAte, topo, alturaMax, pagina, fim }) => {
  const inicio = m.em ?? m.de;
  const opcoes = m.opcoes ?? [];
  const tOpc = opcoes.length ? Math.min(...opcoes.map((o) => encaixar(o.texto, { largura: LARGURA - 110, max: 42, min: 34, linhas: 1, estilo: () => TITULO }).tamanho)) : 0;
  const larguras = opcoes.map((o) => larguraTexto(o.texto, tOpc, TITULO) + 28 + 28 + 34 + 14);
  let linhasOpc = opcoes.length ? 1 : 0;
  let usado = 0;
  for (const w of larguras) {
    if (usado && usado + w + 14 > LARGURA) {
      linhasOpc++;
      usado = 0;
    }
    usado += w + 14;
  }
  const hPilula = Math.round(tOpc * 1.1) + 32;
  const alturaOpc = linhasOpc ? linhasOpc * hPilula + (linhasOpc - 1) * 14 + 20 : 0;
  const q = encaixarNaCaixa(m.texto, { largura: LARGURA, altura: alturaMax - 2 * PAD_Y - alturaOpc, max: 74, min: 46, linhas: 3, estilo: () => TITULO, alturaLinha: 1.08 });
  const tempos = temposDoTexto(m.texto, palavras, inicio - 0.25, fim);
  const altura = 2 * PAD_Y + alturaDe(q) + alturaOpc;
  return (
    <Chrome t={t} de={entra} saiAte={saiAte} topo={topo} nome="Pergunta" altura={altura}>
      <div style={{ padding: `${PAD_Y}px ${PAD_X}px`, position: "relative" }}>
        <Linhas q={q} tempos={tempos} t={t} />
        {opcoes.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 20 }}>
            {opcoes.map((o, i) => {
              const p = prog(t, o.em - 0.05, 0.3);
              const atual = p > 0.5 && !opcoes.slice(i + 1).some((x) => t >= x.em - 0.05);
              return (
                <div
                  key={`${o.texto}-${i}`}
                  style={{
                    height: hPilula,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "0 28px 0 28px",
                    borderRadius: hPilula / 2,
                    boxSizing: "border-box",
                    border: p > 0.5 ? `3px solid ${atual ? cor.tinta : "#B4B9C1"}` : "3px dashed #B4B9C1",
                    background: p > 0.5 ? (atual ? pagina.cor : "#FFFFFF") : "transparent",
                    scale: String(1 + 0.03 * Math.max(0, 1 - Math.abs(t - o.em - 0.15) / 0.2)),
                  }}
                >
                  <span style={{ width: 34, height: 34, borderRadius: 17, boxSizing: "border-box", border: `3px solid ${p > 0.5 ? cor.tinta : "#B4B9C1"}`, background: p > 0.5 ? (atual ? cor.vermelho : cor.tinta) : "transparent", flexShrink: 0 }} />
                  <span style={{ fontFamily: sans, fontWeight: 700, fontSize: tOpc, color: cor.tinta, position: "relative" }}>
                    <span style={{ opacity: p }}>{o.texto}</span>
                    <span style={{ position: "absolute", left: 0, right: 0, top: "28%", bottom: "22%", borderRadius: 999, background: "#DADDE2", opacity: 1 - p }} />
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </Chrome>
  );
};

// =====================================================================================
// Frames do canvas (lista, passos, comparação, gráfico) e o painel de camadas
// =====================================================================================

// o frame ocupa o lugar do celular, um pouco maior para cobrir os botões laterais do aparelho
export const FRAME = { x: 34, y: 318, w: 568, h: 1210, raio: 40 };
const IN = 36;
const CX = FRAME.x + IN;
const CW = FRAME.w - 2 * IN;
const CY = FRAME.y + IN;
const CH = FRAME.h - 2 * IN;

type FrameProps<M> = { m: M; t: number; palavras: Palavra[]; fim: number; pagina: Required<Pagina> };

const nomeDoFrame = { topicos: "Lista", passos: "Passos", comparacao: "Versus", grafico: "Gráfico" } as const;
export type MomentoFrame = Topicos | Passos | Comparacao | Grafico;
export const nomeDoQuadro = (m: MomentoFrame) => nomeDoFrame[m.tipo];

// título do frame (no alto): palavras faladas
const Cabecalho: React.FC<{ titulo?: string; t: number; de: number; fim: number; palavras: Palavra[] }> = ({ titulo, t, de, fim, palavras }) => {
  if (!titulo) return null;
  const q = encaixar(titulo, { largura: CW, max: 56, min: 38, linhas: 2, estilo: () => TITULO });
  const tempos = temposDoTexto(titulo, palavras, de - 0.1, fim);
  return (
    <div style={{ position: "absolute", left: CX, top: CY, width: CW }}>
      <Linhas q={q} tempos={tempos} t={t} alturaLinha={1.06} />
    </div>
  );
};
const alturaCabecalho = (titulo?: string) => {
  if (!titulo) return 0;
  const q = encaixar(titulo, { largura: CW, max: 56, min: 38, linhas: 2, estilo: () => TITULO });
  return alturaDe(q, 1.06) + 30;
};

// a etiqueta vermelha numerada (a mesma da revisão do celular)
const Tag: React.FC<{ n: number; estado: "espera" | "ativo" | "feito"; p: number; tamanho?: number }> = ({ n, estado, p, tamanho = 60 }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      borderRadius: tamanho / 2,
      boxSizing: "border-box",
      border: estado === "espera" ? `3px dashed ${cor.traco}` : "none",
      background: estado === "ativo" ? cor.vermelho : estado === "feito" ? cor.tinta : "transparent",
      color: estado === "espera" ? cor.traco : "#FFFFFF",
      fontFamily: mono,
      fontWeight: 700,
      fontSize: tamanho * 0.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      scale: String(1 + 0.16 * Math.max(0, 1 - Math.abs(p - 0.3) / 0.3) * (estado === "ativo" ? 1 : 0)),
    }}
  >
    {n}
  </div>
);

export const FrameItens: React.FC<FrameProps<Topicos | Passos>> = ({ m, t, palavras, fim, pagina }) => {
  const passos = m.tipo === "passos";
  const n = m.itens.length;
  const hdr = alturaCabecalho(m.titulo);
  const gap = passos ? 44 : 22;
  const area = CH - hdr;
  const cap = n <= 2 ? 360 : n === 3 ? 310 : n === 4 ? 250 : 205;
  const rh = Math.min(cap, (area - gap * (n - 1)) / n);
  const total = n * rh + (n - 1) * gap;
  const y0 = CY + hdr + (area - total) / 2;
  const larg = CW - 100 - 28;
  const temDet = m.itens.some((i) => i.detalhe);
  const altTexto = rh - 40 - (temDet ? 48 : 0);
  const qs = m.itens.map((it) => encaixarNaCaixa(it.texto, { largura: larg, altura: altTexto, max: 54, min: 36, linhas: 4, estilo: () => TITULO, alturaLinha: 1.08 }));
  const tamanho = Math.min(...qs.map((q) => q.tamanho));
  const qsF = m.itens.map((it) => encaixar(it.texto, { largura: larg, max: tamanho, min: tamanho, linhas: 6, estilo: () => TITULO }));
  const qDets = m.itens.map((it) => (it.detalhe ? encaixar(it.detalhe, { largura: larg, max: 32, min: 30, linhas: 2, estilo: () => SANS }) : null));
  return (
    <>
      <Cabecalho titulo={m.titulo} t={t} de={m.de} fim={fim} palavras={palavras} />
      {m.itens.map((it, i) => {
        const proximo = m.itens[i + 1];
        const p = prog(t, it.em - 0.04, 0.35);
        const feito = proximo ? prog(t, proximo.em - 0.04, 0.3) : 0;
        const estado = p < 0.5 ? "espera" : feito > 0.5 ? "feito" : "ativo";
        const tTexto = temposDoTexto(it.texto, palavras, it.em - 0.25, fim);
        const fimT = tTexto[tTexto.length - 1] ?? it.em;
        const tDet = it.detalhe ? temposDoTexto(it.detalhe, palavras, fimT - 0.05, fim) : [];
        const y = y0 + i * (rh + gap);
        return (
          <div key={`${it.texto}-${i}`}>
            <div style={{ position: "absolute", left: CX, top: y, width: CW, height: rh, borderRadius: 26, boxSizing: "border-box", background: "#FFFFFF", border: `2.5px solid ${p > 0.5 ? "#D5D8DD" : "#E6E8EC"}`, boxShadow: p > 0.5 ? "0 10px 26px rgba(20,22,26,0.08)" : "none" }} />
            {/* contorno tracejado da revisão: abraça o item atual */}
            {p > 0 && feito < 1 ? (
              <div style={{ position: "absolute", left: CX - 8, top: y - 8, width: CW + 16, height: rh + 16, borderRadius: 32, boxSizing: "border-box", border: `3.5px dashed ${cor.vermelho}`, background: cor.vermelhoFundo, opacity: p * (1 - feito), scale: String(1.03 - 0.03 * p) }} />
            ) : null}
            <div style={{ position: "absolute", left: CX + 22, top: y + 22 }}>
              <Tag n={i + 1} estado={estado} p={p} />
            </div>
            <div style={{ position: "absolute", left: CX + 100, top: y, width: larg, height: rh, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Linhas q={qsF[i]} tempos={tTexto} t={t} alturaLinha={1.08} />
              {qDets[i] ? (
                <div style={{ marginTop: 8 }}>
                  <Linhas q={qDets[i]!} tempos={tDet} t={t} peso={500} corTexto={cor.tintaSuave} alturaLinha={1.12} />
                </div>
              ) : null}
            </div>
            {/* passos: o conector até o próximo se completa na palavra dele */}
            {passos && proximo ? (
              <svg width={40} height={gap + 4} style={{ position: "absolute", left: CX + CW / 2 - 20, top: y + rh - 2, overflow: "visible" }}>
                <line x1={20} x2={20} y1={0} y2={gap} stroke={cor.traco} strokeWidth={4} strokeDasharray="5 7" />
                <line x1={20} x2={20} y1={0} y2={gap * prog(t, it.em, Math.max(0.4, proximo.em - it.em - 0.1), viagem)} stroke={cor.vermelho} strokeWidth={5} />
                <path d="M10 -2 L20 10 L30 -2" fill="none" stroke={cor.vermelho} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={prog(t, proximo.em - 0.1, 0.25)} transform={`translate(0 ${gap - 8})`} />
              </svg>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

export const FrameComparacao: React.FC<FrameProps<Comparacao>> = ({ m, t, palavras, fim, pagina }) => {
  const modo = m.modo ?? "contra";
  const hdr = alturaCabecalho(m.titulo);
  const gap = 60;
  const area = CH - hdr;
  const ch = (area - gap) / 2;
  const vEm = m.vencedor !== undefined ? m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.9 : undefined;
  const vence = vEm !== undefined ? prog(t, vEm, 0.4) : 0;
  const larg = CW - 2 * 30;
  const alt = ch - 30 - 44 - 20;
  const qs = m.lados.map((l) => encaixarNaCaixa(l.texto, { largura: larg, altura: alt, max: 72, min: 38, linhas: 5, estilo: () => TITULO, alturaLinha: 1.1 }));
  const tamanho = Math.min(...qs.map((q) => q.tamanho));
  const qsF = m.lados.map((l) => encaixar(l.texto, { largura: larg, max: tamanho, min: tamanho, linhas: 7, estilo: () => TITULO }));
  return (
    <>
      <Cabecalho titulo={m.titulo} t={t} de={m.de} fim={fim} palavras={palavras} />
      {m.lados.map((l, i) => {
        const p = prog(t, l.em - 0.05, 0.35);
        const ganha = m.vencedor === i ? vence : 0;
        const perde = m.vencedor !== undefined && m.vencedor !== i ? vence : 0;
        const y = CY + hdr + i * (ch + gap);
        const tTexto = temposDoTexto(l.texto, palavras, l.em - 0.25, fim);
        // antes-depois: o segundo cartão é a página na cor da marca; errado-certo: vermelho × cor da marca
        const colorido = (modo === "antes-depois" || modo === "errado-certo") && i === 1 ? p : 0;
        const errado = modo === "errado-certo" && i === 0 && p > 0.5;
        const destacado = ganha > 0.5;
        const fundo = mixCor("#FFFFFF", pagina.cor, Math.max(colorido, ganha));
        return (
          <div key={`${l.rotulo}-${i}`}>
            <div
              style={{
                position: "absolute",
                left: CX,
                top: y,
                width: CW,
                height: ch,
                borderRadius: 28,
                boxSizing: "border-box",
                padding: "26px 30px",
                background: p > 0.4 ? fundo : "transparent",
                border: errado ? `3.5px dashed ${cor.vermelho}` : p > 0.4 ? `${destacado ? 4 : 2.5}px solid ${destacado ? cor.tinta : "#D5D8DD"}` : "3px dashed #B4B9C1",
                opacity: 1 - 0.34 * perde,
                scale: String(1 + 0.015 * ganha),
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 44, fontFamily: mono, fontWeight: 700, fontSize: 30, letterSpacing: "0.06em", textTransform: "uppercase", color: errado ? cor.vermelho : cor.tinta }}>
                <span>{l.rotulo}</span>
                {errado ? <span style={{ marginLeft: "auto", fontSize: 40, lineHeight: 1 }}>✕</span> : null}
                {(modo === "errado-certo" && i === 1 && p > 0.5) || ganha > 0.5 ? (
                  <span style={{ marginLeft: "auto" }}>
                    <Check tamanho={38} cor={cor.tinta} espessura={4} p={Math.max(p > 0.5 && modo === "errado-certo" ? 1 : 0, ganha)} />
                  </span>
                ) : null}
              </div>
              <div style={{ height: ch - 52 - 44 - 16 - 26, marginTop: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Linhas q={qsF[i]} tempos={tTexto} t={t} alturaLinha={1.1} />
              </div>
            </div>
          </div>
        );
      })}
      {/* o selo do meio: VS, ou a seta do primeiro para o segundo */}
      <div
        style={{
          position: "absolute",
          left: CX + CW / 2 - 42,
          top: CY + hdr + ch + gap / 2 - 42,
          width: 84,
          height: 84,
          borderRadius: 42,
          background: cor.tinta,
          color: "#FFFFFF",
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: prog(t, Math.min(m.lados[0].em, m.lados[1].em) - 0.1, 0.3),
        }}
      >
        {modo === "contra" ? (
          "VS"
        ) : (
          <svg width={40} height={40} viewBox="0 0 48 48">
            <path d="M24 8 V38" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
            <path d="M12 27 L24 39 L36 27" fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </>
  );
};

const PALETA_PIZZA = (pagina: Required<Pagina>) => [pagina.cor, cor.tinta, cor.vermelho, cor.traco, cor.tintaSuave, "#DCDFE4"];

const curvaDaTendencia = (tipo: "sobe" | "cai" | "oscila", n = 48): number[] =>
  Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const onda = 0.04 * Math.sin(u * 17) + 0.022 * Math.sin(u * 31 + 1);
    const lim = (v: number) => Math.min(0.95, Math.max(0.05, v));
    if (tipo === "sobe") return lim(0.86 - 0.7 * Math.pow(u, 1.25) + onda);
    if (tipo === "cai") return lim(0.16 + 0.7 * Math.pow(u, 1.25) + onda);
    return lim(0.5 - 0.3 * Math.sin(u * Math.PI * 2.4) + onda);
  });

export const FrameGrafico: React.FC<FrameProps<Grafico>> = ({ m, t, palavras, fim, pagina }) => {
  const dados = m.dados ?? [];
  const hdr = alturaCabecalho(m.titulo);
  const area = CH - hdr;
  const y0 = CY + hdr;
  const unidade = m.unidade ?? "";
  const casas = Math.max(0, ...dados.map((d) => casasDe(d.valor)));
  const valorTxt = (v: number) => `${fmtNum(v, casas)}${unidade ? (/[a-zA-Z]/.test(unidade) ? ` ${unidade}` : unidade) : ""}`;
  const max = Math.max(...dados.map((d) => d.valor), 0.0001);
  const ilustrativo = !dados.length || m.ilustrativo;
  let conteudo: React.ReactNode = null;

  if (dados.length && m.forma === "barras") {
    // barras na horizontal: o frame é estreito e os rótulos precisam de largura
    const n = dados.length;
    const rh = Math.min(200, area / n);
    const tamRot = Math.min(...dados.map((d) => encaixar(d.rotulo, { largura: CW, max: 40, min: 30, linhas: 2, estilo: () => TITULO }).tamanho));
    const valW = 170;
    conteudo = dados.map((d, i) => {
      const p = prog(t, d.em - 0.05, 0.8);
      const yy = y0 + (area - n * rh) / 2 + i * rh;
      const q = encaixar(d.rotulo, { largura: CW, max: tamRot, min: Math.min(30, tamRot), linhas: 2, estilo: () => TITULO });
      const tRot = temposDoTexto(d.rotulo, palavras, d.em - 0.3, fim);
      const maior = d.valor === max;
      const alturaRot = alturaDe(q, 1.06);
      const larguraBarra = ((CW - valW) * d.valor) / max;
      return (
        <div key={`${d.rotulo}-${i}`}>
          <div style={{ position: "absolute", left: CX, top: yy, width: CW }}>
            <Linhas q={q} tempos={tRot} t={t} alturaLinha={1.06} />
          </div>
          <div style={{ position: "absolute", left: CX, top: yy + alturaRot + 8, width: CW - valW + 40, height: 52, borderRadius: 12, background: "#E6E8EC", border: p < 0.05 ? `3px dashed ${cor.traco}` : "none", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: CX, top: yy + alturaRot + 8, width: Math.max(6, larguraBarra * p), height: 52, borderRadius: 12, background: maior ? pagina.cor : cor.textoMedio }} />
          <div style={{ position: "absolute", left: CX + CW - valW + 52, top: yy + alturaRot + 6, width: valW - 52, fontFamily: mono, fontWeight: 700, fontSize: 38, color: cor.tinta, opacity: p > 0.1 ? 1 : 0, whiteSpace: "nowrap" }}>{valorTxt(d.valor * p)}</div>
        </div>
      );
    });
  } else if (dados.length && m.forma === "linha") {
    const n = dados.length;
    const lista = 56;
    const alturaGraf = Math.min(520, area - n * lista - 30);
    const min = Math.min(...dados.map((d) => d.valor));
    const mx = Math.max(...dados.map((d) => d.valor));
    const faixa = mx - min || Math.max(Math.abs(mx), 1);
    const lo = min - faixa * 0.3;
    const hi = mx + faixa * 0.18;
    const px = (i: number) => CX + 40 + (i * (CW - 80)) / Math.max(1, n - 1);
    const py = (v: number) => y0 + 30 + (alturaGraf - 60) - ((v - lo) / (hi - lo)) * (alturaGraf - 60);
    conteudo = (
      <>
        <div style={{ position: "absolute", left: CX, top: y0, width: CW, height: alturaGraf, borderRadius: 24, background: "#FFFFFF", border: "2.5px solid #D5D8DD", boxSizing: "border-box" }} />
        <svg width={FRAME.w} height={FRAME.h} style={{ position: "absolute", left: FRAME.x, top: FRAME.y, overflow: "visible" }}>
          <g transform={`translate(${-FRAME.x} ${-FRAME.y})`}>
            {[1, 2, 3].map((k) => (
              <line key={k} x1={CX + 14} x2={CX + CW - 14} y1={y0 + (alturaGraf * k) / 4} y2={y0 + (alturaGraf * k) / 4} stroke="#E6E8EC" strokeWidth={2.5} strokeDasharray="4 8" />
            ))}
            {dados.slice(1).map((d, i) => {
              const a = dados[i];
              const p = prog(t, a.em + 0.05, Math.max(0.35, d.em - a.em - 0.05), viagem);
              const x1 = px(i);
              const y1 = py(a.valor);
              const x2 = px(i + 1);
              const y2 = py(d.valor);
              return <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={cor.tinta} strokeWidth={7} strokeLinecap="round" />;
            })}
          </g>
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.35);
          return (
            <div key={i} style={{ position: "absolute", left: px(i) - 24, top: py(d.valor) - 24, scale: String(p), opacity: p }}>
              <Tag n={i + 1} estado={i === dados.filter((x) => t >= x.em - 0.05).length - 1 ? "ativo" : "feito"} p={p} tamanho={48} />
            </div>
          );
        })}
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.35);
          const larg = CW - 190;
          const q = encaixar(d.rotulo, { largura: larg, max: 36, min: 30, linhas: 1, estilo: () => TITULO });
          const tRot = temposDoTexto(d.rotulo, palavras, d.em - 0.3, fim);
          return (
            <div key={`l-${i}`} style={{ position: "absolute", left: CX, top: y0 + alturaGraf + 24 + i * lista, width: CW, height: lista, display: "flex", alignItems: "center", gap: 16 }}>
              <Tag n={i + 1} estado={p > 0.5 ? "feito" : "espera"} p={p} tamanho={40} />
              <div style={{ flex: 1 }}>
                <Linhas q={q} tempos={tRot} t={t} alturaLinha={1.1} />
              </div>
              <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 34, color: cor.tinta, opacity: p, whiteSpace: "nowrap" }}>{valorTxt(d.valor)}</div>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length && m.forma === "pizza") {
    const soma = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const lista = 58;
    const R = Math.min(190, (area - dados.length * lista - 40) / 2);
    const cx = CX + CW / 2;
    const cy = y0 + R + 10;
    const paleta = PALETA_PIZZA(pagina);
    let acc = 0;
    const fatias = dados.map((d) => {
      const de = acc / soma;
      acc += d.valor;
      return { de, ate: acc / soma };
    });
    const pol = (u: number, r: number) => [cx + r * Math.sin(u * 2 * Math.PI), cy - r * Math.cos(u * 2 * Math.PI)];
    conteudo = (
      <>
        <svg width={FRAME.w} height={FRAME.h} style={{ position: "absolute", left: FRAME.x, top: FRAME.y, overflow: "visible" }}>
          <g transform={`translate(${-FRAME.x} ${-FRAME.y})`}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.traco} strokeWidth={3} strokeDasharray="5 9" />
            {dados.map((d, i) => {
              const p = prog(t, d.em - 0.05, 0.7);
              if (p <= 0.003) return null;
              const u1 = fatias[i].de + (fatias[i].ate - fatias[i].de) * p;
              const [x0, yy0] = pol(fatias[i].de, R);
              const [x1, yy1] = pol(u1, R);
              const grande = (u1 - fatias[i].de) * 2 * Math.PI > Math.PI ? 1 : 0;
              return <path key={i} d={`M ${cx} ${cy} L ${x0} ${yy0} A ${R} ${R} 0 ${grande} 1 ${x1} ${yy1} Z`} fill={paleta[i % paleta.length]} stroke={cor.tela} strokeWidth={4} />;
            })}
          </g>
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.35);
          const q = encaixar(d.rotulo, { largura: CW - 60 - 200, max: 36, min: 30, linhas: 1, estilo: () => TITULO });
          const tRot = temposDoTexto(d.rotulo, palavras, d.em - 0.3, fim);
          const pct = (d.valor / soma) * 100;
          return (
            <div key={`l-${i}`} style={{ position: "absolute", left: CX, top: cy + R + 36 + i * lista, width: CW, height: lista, display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: p > 0.3 ? paleta[i % paleta.length] : "transparent", border: p > 0.3 ? "none" : `3px dashed ${cor.traco}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Linhas q={q} tempos={tRot} t={t} alturaLinha={1.1} />
              </div>
              <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 34, color: cor.tinta, opacity: p, whiteSpace: "nowrap" }}>{unidade === "%" || Math.abs(soma - 100) < 0.5 ? valorTxt(d.valor) : `${fmtNum(pct, 0)}%`}</div>
            </div>
          );
        })}
      </>
    );
  } else {
    const tend = m.tendencia ?? "sobe";
    const pts = curvaDaTendencia(tend);
    const alturaGraf = Math.min(area - 20, 760);
    const gx0 = CX + 30;
    const gx1 = CX + CW - 30;
    const gy0 = y0 + 90;
    const gy1 = y0 + alturaGraf - 40;
    const caminho = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${gx0 + ((gx1 - gx0) * i) / (pts.length - 1)} ${gy0 + (gy1 - gy0) * v}`).join(" ");
    const inicio = m.tendenciaEm ?? m.de + 0.4;
    const p = prog(t, inicio, 1.9, Easing.inOut(Easing.cubic));
    const idx = Math.min(pts.length - 1, Math.round(p * (pts.length - 1)));
    const hx = gx0 + ((gx1 - gx0) * idx) / (pts.length - 1);
    const hy = gy0 + (gy1 - gy0) * pts[idx];
    conteudo = (
      <>
        <div style={{ position: "absolute", left: CX, top: y0, width: CW, height: alturaGraf, borderRadius: 24, background: "#FFFFFF", border: "2.5px solid #D5D8DD", boxSizing: "border-box" }} />
        <svg width={FRAME.w} height={FRAME.h} style={{ position: "absolute", left: FRAME.x, top: FRAME.y, overflow: "visible" }}>
          <g transform={`translate(${-FRAME.x} ${-FRAME.y})`}>
            {[1, 2, 3].map((k) => (
              <line key={k} x1={CX + 14} x2={CX + CW - 14} y1={y0 + (alturaGraf * k) / 4} y2={y0 + (alturaGraf * k) / 4} stroke="#E6E8EC" strokeWidth={2.5} strokeDasharray="4 8" />
            ))}
            <path d={caminho} fill="none" stroke={cor.traco} strokeWidth={4} strokeDasharray="5 10" />
            <path d={caminho} fill="none" stroke={cor.tinta} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} opacity={p > 0.002 ? 1 : 0} />
            {p > 0.01 ? (
              <>
                <circle cx={hx} cy={hy} r={22 + 5 * Math.sin(t * 8)} fill="none" stroke={cor.vermelho} strokeWidth={3.5} opacity={0.8} />
                <circle cx={hx} cy={hy} r={12} fill={pagina.cor} stroke={cor.tinta} strokeWidth={4} />
              </>
            ) : null}
          </g>
        </svg>
      </>
    );
  }

  return (
    <>
      <Cabecalho titulo={m.titulo} t={t} de={m.de} fim={fim} palavras={palavras} />
      {conteudo}
      {ilustrativo ? (
        <div style={{ position: "absolute", left: CX, top: FRAME.y + FRAME.h - IN - 50, fontFamily: mono, fontWeight: 700, fontSize: 30, color: "#FFFFFF", background: cor.vermelho, padding: "4px 14px", borderRadius: 8 }}>ILUSTRATIVO</div>
      ) : null}
    </>
  );
};

// ---------- o frame completo (fundo + conteúdo), com entrada e saída ----------

export const FrameDoCanvas: React.FC<{ m: MomentoFrame; t: number; palavras: Palavra[]; fim: number; pagina: Required<Pagina>; presenca: number; clip: string }> = ({ m, t, palavras, fim, pagina, presenca, clip }) => {
  const entrada = prog(presenca, 0.15, 0.85);
  const props = { t, palavras, fim, pagina };
  return (
    <div
      style={{
        position: "absolute",
        left: FRAME.x,
        top: FRAME.y,
        width: FRAME.w,
        height: FRAME.h,
        opacity: entrada,
        translate: `${(1 - entrada) * -40}px ${(1 - entrada) * 50}px`,
        clipPath: clip,
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: FRAME.raio, background: cor.tela, boxShadow: `0 0 0 2px #D5D8DD, 0 40px 80px rgba(0,0,0,0.45)` }} />
      <div style={{ position: "absolute", left: -FRAME.x, top: -FRAME.y, width: 1080, height: 1920 }}>
        {m.tipo === "topicos" || m.tipo === "passos" ? <FrameItens m={m} {...props} /> : null}
        {m.tipo === "comparacao" ? <FrameComparacao m={m} {...props} /> : null}
        {m.tipo === "grafico" ? <FrameGrafico m={m} {...props} /> : null}
      </div>
    </div>
  );
};

// ---------- painel de camadas (no lugar do inspetor) ----------

export const camadasDoFrame = (m: MomentoFrame): { nome: string; em: number }[] => {
  const cabeca = m.titulo ? [{ nome: m.titulo, em: m.de }] : [];
  if (m.tipo === "topicos" || m.tipo === "passos") return [...cabeca, ...m.itens.map((i) => ({ nome: i.texto, em: i.em }))];
  if (m.tipo === "comparacao") return [...cabeca, ...m.lados.map((l) => ({ nome: `${l.rotulo}: ${l.texto}`, em: l.em }))];
  if (m.dados?.length) return [...cabeca, ...m.dados.map((d) => ({ nome: d.rotulo, em: d.em }))];
  return [...cabeca, { nome: `Tendência (${m.tendencia ?? "sobe"})`, em: m.tendenciaEm ?? m.de + 0.4 }];
};

export const PainelCamadas: React.FC<{ m: MomentoFrame; t: number; presenca: number; clip: string; retangulo: { x: number; y: number; w: number; h: number } }> = ({ m, t, presenca, clip, retangulo }) => {
  const entrada = prog(presenca, 0.5, 0.5);
  const camadas = camadasDoFrame(m);
  const atual = camadas.filter((c) => t >= c.em - 0.04).length - 1;
  const lh = Math.min(62, (retangulo.h - 120) / Math.max(1, camadas.length));
  return (
    <div
      style={{
        position: "absolute",
        left: retangulo.x,
        top: retangulo.y,
        width: retangulo.w,
        height: retangulo.h,
        borderRadius: 26,
        background: cor.painel,
        boxShadow: `0 0 0 1.5px ${cor.painelBorda}, 0 24px 50px rgba(0,0,0,0.35)`,
        overflow: "hidden",
        opacity: entrada,
        translate: `${(1 - entrada) * 60}px 0`,
        clipPath: clip,
        padding: "26px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, letterSpacing: "0.06em", textTransform: "uppercase", color: cor.hud, height: 44, display: "flex", justifyContent: "space-between" }}>
        <span>Camadas</span>
        <span style={{ color: cor.hudForte }}>{Math.max(0, atual + 1)}/{camadas.length}</span>
      </div>
      {camadas.map((c, i) => {
        const p = prog(t, c.em - 0.04, 0.3);
        const ativo = i === atual;
        return (
          <div key={`${c.nome}-${i}`} style={{ position: "relative", height: lh, display: "flex", alignItems: "center", gap: 14, padding: "0 12px", borderRadius: 12, background: ativo ? "rgba(255,71,51,0.16)" : "transparent", marginBottom: 2, opacity: 0.35 + 0.65 * p, translate: `${(1 - p) * 30}px 0` }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: ativo ? cor.vermelho : cor.painelBorda, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 700, fontSize: 18, color: "#FFFFFF" }}>{i + 1}</div>
            <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, color: ativo ? cor.hudForte : cor.hud, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{c.nome}</div>
          </div>
        );
      })}
    </div>
  );
};

