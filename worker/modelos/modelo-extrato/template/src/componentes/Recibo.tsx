// O cupom de papel térmico: um papel comprido que sai do pé do quadro (ou de trás da moldura da
// pessoa). Cada bloco imprime no seu tempo (o papel sobe a altura da linha e a tinta "revela");
// quando o cupom fica mais alto que o espaço dele, ele rola e o começo sai pelo alto. O carimbo
// bate por cima de tudo. O mesmo componente desenha o rolo e as tiras.
import { useMemo } from "react";
import { entra, numeroBR, prog, reais, troca, Traco } from "../anim";
import type { Dado, Icone as NomeIcone, LinhaGrade } from "../plano";
import { type Bloco, type Conteudo, degrau, INTERNO, PAD_X } from "../recibo";
import { AVANCO, cor, fonteCupom, larguraMono, PAPEL, sans } from "../tema";
import { Icone } from "./Icones";

// medidas fixas do cupom (px, escala 1)
const TAM_RS = 46;
const DEGRAUS = { base: 228, alturaMax: 196 };

// a tinta térmica "revela" em 0,16 s quando a linha passa pela cabeça de impressão
const revela = (t: number, em: number) => prog(t, em - 0.03, 0.16);

// bordas serrilhadas do papel (o corte da guilhotina), em cima e embaixo. `topo` > 0 = o papel
// aparece só daí para baixo (a tira que não pode subir sobre o queixo).
const DENTE = 16;
const serrilha = (altura: number, topo = 0) => {
  const n = Math.ceil(PAPEL / DENTE);
  const cima: string[] = [];
  const pe: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = Math.min(PAPEL, i * DENTE);
    cima.push(`${x}px ${(topo + (i % 2 === 0 ? 0 : 8)).toFixed(1)}px`);
    pe.unshift(`${x}px ${(altura - (i % 2 === 0 ? 0 : 8)).toFixed(1)}px`);
  }
  return `polygon(${[...cima, ...pe].join(", ")})`;
};

// linha tracejada (tinta, cinza ou lápis)
const Tracejado: React.FC<{ y: number; x?: number; largura?: number; cor: string; espessura?: number; traco?: number; vao?: number; p?: number }> = ({
  y,
  x = PAD_X,
  largura = INTERNO,
  cor: c,
  espessura = 3,
  traco = 12,
  vao = 9,
  p = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y - espessura / 2,
      width: largura * p,
      height: espessura,
      backgroundImage: `repeating-linear-gradient(90deg, ${c} 0 ${traco}px, transparent ${traco}px ${traco + vao}px)`,
    }}
  />
);

// pontilhado de cupom (o "......" entre o nome e o valor)
const pontilhado = (c: string): React.CSSProperties => ({
  height: 4,
  backgroundImage: `radial-gradient(circle, ${c} 1.6px, transparent 2px)`,
  backgroundSize: "12px 4px",
});

// etiqueta "ILUSTRATIVO" (o desenho não vem de números ditos)
const Etiqueta: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ position: "absolute", border: `2.5px solid ${cor.cinza}`, borderRadius: 6, padding: "2px 10px 3px", ...fonteCupom(30, 600), color: cor.cinza, letterSpacing: "0.04em", ...style }}>
    ILUSTRATIVO
  </div>
);

// ---------- os blocos ----------

const Cabecalho: React.FC<{ titulo: string; nome: string; area: string }> = ({ titulo, nome, area }) => {
  const tamTitulo = Math.min(52, Math.floor(INTERNO / Math.max(1, titulo.length * (AVANCO + 0.04))));
  const tamLinha = (s: string) => Math.max(30, Math.min(36, Math.floor(INTERNO / Math.max(1, s.length * AVANCO))));
  const centro: React.CSSProperties = { position: "absolute", left: PAD_X, width: INTERNO, textAlign: "center" };
  return (
    <>
      {titulo ? <div style={{ ...centro, top: 30, ...fonteCupom(tamTitulo, 700), letterSpacing: "0.04em" }}>{titulo}</div> : null}
      {nome ? <div style={{ ...centro, top: 104, ...fonteCupom(tamLinha(nome), 600) }}>{nome}</div> : null}
      {area ? <div style={{ ...centro, top: 152, ...fonteCupom(tamLinha(area), 500), color: cor.cinza }}>{area}</div> : null}
      <Tracejado y={224} cor={cor.tinta} />
    </>
  );
};

// a capa da primeira tira: só o título do cupom
const Capa: React.FC<{ titulo: string; tamanho: number }> = ({ titulo, tamanho }) => (
  <>
    <div style={{ position: "absolute", left: PAD_X, width: INTERNO, top: 26, textAlign: "center", ...fonteCupom(tamanho, 700), letterSpacing: "0.04em" }}>{titulo}</div>
    <Tracejado y={96} cor={cor.tinta} />
  </>
);

const Item: React.FC<{ t: number; c: Extract<Conteudo, { k: "item" }> }> = ({ t, c }) => {
  const temIcone = !!c.icone;
  const tam = c.tamanho;
  const pValor = revela(t, c.valorEm);
  const valor =
    c.valorTexto !== undefined ? (
      <div style={{ position: "relative", ...fonteCupom(tam, 600) }}>
        {/* o preço espera a lápis até ser dito */}
        <span style={{ color: cor.lapis, opacity: 1 - pValor }}>{c.espera}</span>
        <span style={{ position: "absolute", right: 0, top: 0, color: c.negativo ? cor.magenta : cor.tinta, opacity: pValor }}>{c.valorTexto}</span>
      </div>
    ) : null;
  const icone = temIcone ? <Icone nome={c.icone as NomeIcone} p={prog(t, c.valorEm - 0.5, 0.5)} tamanho={54} cor={cor.tinta} largura={3.2} style={{ marginRight: 16, flexShrink: 0 }} /> : null;
  const linhaFinal = (texto: string) => (
    <>
      <div style={{ ...fonteCupom(tam, 600) }}>{texto}</div>
      <div style={{ flex: 1, margin: `0 12px`, alignSelf: "center", marginTop: tam * 0.36, opacity: 0.8, ...pontilhado(cor.cinza) }} />
      {valor}
    </>
  );
  if (c.linhas.length === 1) {
    return (
      <div style={{ position: "absolute", left: PAD_X, top: 0, width: INTERNO, height: "100%", display: "flex", alignItems: "center" }}>
        {icone}
        {linhaFinal(c.linhas[0])}
      </div>
    );
  }
  // nome longo: as primeiras linhas soltas, o pontilhado e o valor no fim da última
  const alturaLinha = Math.round(tam * 1.16);
  const recuo = temIcone ? 70 : 0;
  return (
    <div style={{ position: "absolute", left: PAD_X, top: 21, width: INTERNO }}>
      {temIcone ? <div style={{ position: "absolute", left: 0, top: 2 }}>{icone}</div> : null}
      {c.linhas.slice(0, -1).map((l, i) => (
        <div key={i} style={{ marginLeft: recuo, height: alturaLinha, ...fonteCupom(tam, 600) }}>
          {l}
        </div>
      ))}
      <div style={{ marginLeft: recuo, display: "flex", alignItems: "center", height: alturaLinha }}>{linhaFinal(c.linhas[c.linhas.length - 1])}</div>
    </div>
  );
};

const Nota: React.FC<{ texto: string; recuo: number }> = ({ texto, recuo }) => {
  // nota longa: diminui até caber (nunca vaza)
  const tam = Math.max(30, Math.min(40, Math.floor((INTERNO - recuo) / Math.max(1, texto.length * AVANCO))));
  return <div style={{ position: "absolute", left: PAD_X + recuo, top: 8, ...fonteCupom(tam, 500), color: cor.cinza }}>{texto}</div>;
};

const Vezes: React.FC<{ t: number; texto: string; fator: string; sinal: string; fatorEm: number }> = ({ t, texto, fator, sinal, fatorEm }) => {
  const tamFator = Math.min(76, Math.floor((INTERNO * 0.5) / Math.max(1, (fator.length + 1.4) * AVANCO)));
  const tamTexto = Math.max(34, Math.min(52, Math.floor((INTERNO - larguraMono(fator, tamFator) - 90) / Math.max(1, texto.length * AVANCO))));
  // o fator espera a lápis ("__") até ser dito
  const pFator = revela(t, fatorEm);
  return (
    <div style={{ position: "absolute", left: PAD_X, top: 0, width: INTERNO, height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ ...fonteCupom(tamTexto, 600) }}>{texto}</div>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ ...fonteCupom(tamFator * 0.9, 600), color: cor.magenta, marginRight: 10 }}>{sinal}</span>
        <span style={{ position: "relative", ...fonteCupom(tamFator, 700), letterSpacing: "-0.02em" }}>
          <span style={{ color: cor.lapis, opacity: 1 - pFator }}>{fator.replace(/[^\s]/g, "_")}</span>
          <span style={{ position: "absolute", right: 0, top: 0, opacity: pFator }}>{fator}</span>
        </span>
      </div>
    </div>
  );
};

// Linha de corte: tracejado de ponta a ponta, a tesoura corre por ele. Com `riscaEm`, a tesoura para
// no meio e leva o sinal de "não" em magenta.
const Corte: React.FC<{ t: number; em: number; riscaEm?: number }> = ({ t, em, riscaEm }) => {
  const risca = riscaEm !== undefined;
  const pCorre = prog(t, em + 0.05, risca ? 0.55 : 0.8, troca);
  const xFinal = risca ? PAPEL * 0.44 : PAPEL - 76;
  const x = 14 + (xFinal - 14) * pCorre;
  const pRisco = risca ? prog(t, riscaEm, 0.32) : 0;
  return (
    <>
      <Tracejado y={38} x={0} largura={PAPEL} cor={cor.cinza} />
      <div style={{ position: "absolute", left: x - 6, top: 38 - 32, width: 64, height: 64, background: cor.papel, borderRadius: 32 }} />
      <Icone nome="tesoura" tamanho={52} cor={cor.tinta} style={{ position: "absolute", left: x, top: 38 - 26 }} />
      {risca && pRisco > 0 ? (
        <svg width={88} height={88} viewBox="0 0 84 84" style={{ position: "absolute", left: x - 18, top: 38 - 44, overflow: "visible" }}>
          <Traco d="M 42 4 A 38 38 0 1 1 41.99 4" p={pRisco} cor={cor.magenta} largura={6} />
          <Traco d="M 15 15 L 69 69" p={prog(t, riscaEm, 0.2)} cor={cor.magenta} largura={6} />
        </svg>
      ) : null}
    </>
  );
};

const larguraCasa = (colunas: number, vao: number) => (INTERNO - (colunas - 1) * vao) / colunas;

const GradeRotulos: React.FC<{ rotulos: string[]; colunas: number }> = ({ rotulos, colunas }) => {
  const vao = 12;
  const lc = larguraCasa(colunas, vao);
  return (
    <>
      {rotulos.slice(0, colunas).map((r, i) => (
        <div key={i} style={{ position: "absolute", left: PAD_X + i * (lc + vao), width: lc, top: 10, textAlign: "center", ...fonteCupom(34, 600), color: cor.cinza }}>
          {r}
        </div>
      ))}
    </>
  );
};

// quando a casa k ganha tinta
const tempoDaCasa = (l: LinhaGrade, k: number) => l.encheDe + ((l.encheAte - l.encheDe) * k) / Math.max(1, l.quantidade);

const GradeLinha: React.FC<{ t: number; l: LinhaGrade; inicio: number; fim: number; colunas: number }> = ({ t, l, inicio, fim, colunas }) => {
  const vao = 12;
  const lc = larguraCasa(colunas, vao);
  const cheias = degrau(t, l.encheDe, l.encheAte, l.quantidade);
  const casas = [];
  for (let k = inicio; k < fim; k++) {
    const c = k - inicio;
    const p = k < cheias ? prog(t, tempoDaCasa(l, k), 0.12) : 0;
    const icone = l.forma === "xicaras" ? "xicara" : l.forma === "moedas" ? "moeda" : null;
    casas.push(
      <div key={k} style={{ position: "absolute", left: PAD_X + c * (lc + vao), top: 8, width: lc, height: 72 }}>
        {/* a casa a lápis */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, border: `2.5px dashed ${cor.lapis}`, opacity: 1 - p }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, border: `3px solid ${cor.tinta}`, opacity: p, background: l.forma === "casas" ? cor.tinta : undefined }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icone ? (
            <div style={{ position: "relative", width: 54, height: 54 }}>
              <Icone nome={icone} tamanho={54} cor={cor.lapis} largura={3} style={{ position: "absolute", opacity: 1 - p }} />
              <Icone nome={icone} tamanho={54} cor={cor.tinta} largura={3.4} style={{ position: "absolute", opacity: p, scale: String(1.18 - 0.18 * p) }} />
            </div>
          ) : l.forma === "casas" ? null : (
            <div style={{ width: 24, height: 24, borderRadius: 12, background: p > 0 ? cor.tinta : "transparent", border: `2.5px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? cor.tinta : cor.lapis}`, scale: String(0.6 + 0.4 * Math.max(p, 0.999 * (1 - p))) }} />
          )}
        </div>
      </div>,
    );
  }
  return <>{casas}</>;
};

const Degraus: React.FC<{ t: number; l: LinhaGrade }> = ({ t, l }) => {
  const q = Math.max(1, l.quantidade);
  const vao = q > 8 ? 8 : 14;
  const lb = (INTERNO - (q - 1) * vao) / q;
  const base = DEGRAUS.base;
  const alturaMax = DEGRAUS.alturaMax;
  const cheias = degrau(t, l.encheDe, l.encheAte, q);
  const tamRotulo = Math.max(30, Math.min(36, Math.floor((lb + vao) / AVANCO / 1.05)));
  return (
    <>
      {Array.from({ length: q }, (_, k) => {
        const h = Math.max(14, (alturaMax * (k + 1)) / q);
        const p = k < cheias ? prog(t, tempoDaCasa(l, k), 0.16) : 0;
        const x = PAD_X + k * (lb + vao);
        return (
          <div key={k}>
            <div style={{ position: "absolute", left: x, top: base - h, width: lb, height: h, border: `2.5px dashed ${cor.lapis}`, borderBottom: "none", borderRadius: "5px 5px 0 0", opacity: 1 - p }} />
            <div style={{ position: "absolute", left: x, top: base - h * p, width: lb, height: h * p, background: cor.tinta, borderRadius: "5px 5px 0 0" }} />
            {l.rotulos?.[k] ? (
              <div style={{ position: "absolute", left: x - vao / 2, width: lb + vao, top: base + 10, textAlign: "center", ...fonteCupom(tamRotulo, 600), color: p > 0.5 ? cor.tinta : cor.cinza }}>
                {l.rotulos[k]}
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: PAD_X, top: base, width: INTERNO, height: 3, background: cor.tinta }} />
    </>
  );
};

// o número do total formatado (pt-BR)
const formatar = (valor: number, casas: number) => (casas === 2 && valor >= 0 ? reais(valor) : numeroBR(valor, casas));
const suave = (x: number) => 1 - (1 - x) ** 3;

const Total: React.FC<{ t: number; b: Extract<Conteudo, { k: "total" }>; tamanho: number }> = ({ t, b, tamanho }) => {
  const { passos, contaDe, contaAte } = b;
  const contando = t >= contaDe;
  const assentou = prog(t, contaAte, 0.25);
  const topoNumero = 84 + (b.rotulo.length - 1) * 46;
  let texto: string;
  let corpo = tamanho;
  if (b.valor !== undefined) {
    const valor =
      passos > 0 ? (b.valor * Math.max(1, degrau(t, contaDe, contaAte, passos))) / passos : b.valor * suave(prog(t, contaDe, contaAte - contaDe, (x) => x));
    // antes de ser dito, o número espera a lápis em branco ("_.___,__"), no tamanho do valor final
    texto = contando ? formatar(valor, b.casas) : formatar(b.valor, b.casas).replace(/\d/g, "_");
  } else {
    // resultado em palavras: imprime letra a letra entre contaDe e contaAte
    const r = b.resultado ?? "";
    corpo = Math.max(48, Math.min(tamanho, Math.floor((INTERNO - 8) / Math.max(1, r.length * (AVANCO - 0.02)))));
    const n = Math.round(r.length * prog(t, contaDe, Math.max(0.2, contaAte - contaDe), (x) => x));
    texto = contando ? r.slice(0, n) + "_".repeat(r.length - n).replace(/_/g, " ") : r.replace(/[^\s]/g, "_");
  }
  return (
    <>
      <div style={{ position: "absolute", left: PAD_X, top: 8, width: INTERNO, height: 3.5, background: cor.tinta }} />
      <div style={{ position: "absolute", left: PAD_X, top: 16, width: INTERNO, height: 1.5, background: cor.tinta }} />
      {b.rotulo.map((l, i) => {
        const comIgual = i === 0 && l.startsWith("= ");
        return (
          <div key={i} style={{ position: "absolute", left: PAD_X + (i > 0 ? 42 * AVANCO + 16 : 0), top: 34 + i * 46, display: "flex", alignItems: "baseline" }}>
            {comIgual ? <span style={{ ...fonteCupom(42, 700), color: cor.magenta, marginRight: 16 }}>=</span> : null}
            <span style={{ ...fonteCupom(b.tamRotulo, 600), letterSpacing: "0.05em" }}>{comIgual ? l.slice(2) : l}</span>
          </div>
        );
      })}
      <div style={{ position: "absolute", right: PAD_X, top: topoNumero, display: "flex", alignItems: "baseline", color: contando ? cor.tinta : cor.lapis }}>
        {b.prefixo && b.valor !== undefined ? <span style={{ ...fonteCupom(TAM_RS, 600), color: "inherit", marginRight: 12 }}>{b.prefixo}</span> : null}
        <span style={{ ...fonteCupom(corpo, 700), color: "inherit", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", opacity: 0.88 + 0.12 * assentou }}>{texto}</span>
        {b.sufixo && b.valor !== undefined ? <span style={{ ...fonteCupom(TAM_RS, 600), color: "inherit", marginLeft: b.sufixo.length <= 1 ? 2 : 12 }}>{b.sufixo}</span> : null}
      </div>
      {b.ilustrativo ? <Etiqueta style={{ left: PAD_X, top: topoNumero + tamanho * 1.05 + 4 }} /> : null}
    </>
  );
};

// Texto grande: cada palavra revela no instante em que é dita; o grifo varre da esquerda para a
// direita; o risco corta o trecho em magenta. Terminada a revelação, a palavra é texto simples.
const Texto: React.FC<{ t: number; b: Extract<Conteudo, { k: "texto" }> }> = ({ t, b }) => {
  const espaco = b.tamanho * AVANCO;
  const pGrifo = prog(t, b.grifoEm, 0.34);
  const pRisco = prog(t, b.riscoEm, 0.3);
  return (
    <div style={{ position: "absolute", left: PAD_X, top: b.primeira ? 14 : 0, width: INTERNO, display: "flex", alignItems: "center" }}>
      {b.palavras.map((w, i) => {
        const grifado = b.grifo[i];
        const continua = grifado && b.grifo[i + 1];
        const riscado = b.risco[i];
        const riscoContinua = riscado && b.risco[i + 1];
        return (
          <span key={`${w}-${i}`} style={{ position: "relative", display: "inline-block", marginRight: i < b.palavras.length - 1 ? espaco : 0 }}>
            {grifado && pGrifo > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: -6,
                  top: "12%",
                  height: "82%",
                  width: `calc((100% + ${continua ? espaco : 0}px + 12px) * ${pGrifo})`,
                  background: cor.magentaVeu,
                  borderRadius: 4,
                }}
              />
            ) : null}
            <span style={{ position: "relative", ...fonteCupom(b.tamanho, 700), opacity: revela(t, b.tempos[i]) }}>{w}</span>
            {riscado && pRisco > 0 ? (
              <span
                style={{
                  position: "absolute",
                  left: -4,
                  top: "50%",
                  height: Math.max(5, b.tamanho * 0.1),
                  width: `calc((100% + ${riscoContinua ? espaco : 0}px + 8px) * ${pRisco})`,
                  background: cor.magenta,
                  borderRadius: 3,
                }}
              />
            ) : null}
          </span>
        );
      })}
      {b.icone ? <Icone nome={b.icone} p={prog(t, b.iconeEm, 0.5)} tamanho={b.tamanho * 1.25} cor={cor.magenta} largura={3.6} style={{ marginLeft: espaco * 0.6, marginTop: -b.tamanho * 0.12, flexShrink: 0 }} /> : null}
    </div>
  );
};

const CamposTitulo: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ position: "absolute", left: PAD_X, top: 12, display: "flex", alignItems: "center" }}>
    <Icone nome="lapis" p={1} tamanho={48} cor={cor.tinta} style={{ marginRight: 16 }} />
    <span style={{ ...fonteCupom(Math.max(34, Math.min(46, Math.floor((INTERNO - 64) / Math.max(1, texto.length * (AVANCO + 0.03))))), 700), letterSpacing: "0.03em" }}>{texto}</span>
  </div>
);

const Campo: React.FC<{ texto: string; moeda: string }> = ({ texto, moeda }) => {
  const tam = Math.max(34, Math.min(46, Math.floor((INTERNO * 0.45) / Math.max(1, texto.length * AVANCO))));
  return (
    <div style={{ position: "absolute", left: PAD_X, top: 0, width: INTERNO, height: "100%", display: "flex", alignItems: "center" }}>
      <span style={{ ...fonteCupom(tam, 600), minWidth: 4 * 46 * AVANCO }}>{texto}</span>
      <div style={{ flex: 1, marginTop: 16, ...pontilhado(cor.lapis) }} />
      {moeda ? <span style={{ ...fonteCupom(46, 600), color: cor.lapis, margin: "0 10px" }}>{moeda}</span> : <span style={{ width: 10 }} />}
      <div style={{ width: 150, height: 3, marginTop: 34, backgroundImage: `repeating-linear-gradient(90deg, ${cor.lapis} 0 10px, transparent 10px 17px)` }} />
    </div>
  );
};

// código de barras decorativo, sempre igual para o mesmo nome
const barras = (semente: string) => {
  let h = 2166136261;
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const saida: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 400) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const w = 3 + ((h >>> 3) % 3) * 2.5;
    const vao = 3 + ((h >>> 7) % 3) * 2.5;
    if (x + w > 400) break;
    saida.push({ x, w });
    x += w + vao;
  }
  return saida;
};

const Rodape: React.FC<{ nome: string; area: string; compacto?: boolean }> = ({ nome, area, compacto }) => {
  const lista = useMemo(() => barras(`${nome}${area}`), [nome, area]);
  const centro: React.CSSProperties = { position: "absolute", left: PAD_X, width: INTERNO, textAlign: "center" };
  if (compacto) {
    const linha = [nome, area].filter(Boolean).join(" · ").toUpperCase();
    return (
      <>
        <Tracejado y={18} cor={cor.tinta} />
        {linha ? <div style={{ ...centro, top: 36, ...fonteCupom(Math.max(30, Math.min(38, Math.floor(INTERNO / Math.max(1, linha.length * AVANCO)))), 600) }}>{linha}</div> : null}
        <div style={{ position: "absolute", left: (PAPEL - 400) / 2, top: linha ? 94 : 44, width: 400, height: 58 }}>
          {lista.map((b, i) => (
            <div key={i} style={{ position: "absolute", left: b.x, top: 0, width: b.w, height: 58, background: cor.tinta }} />
          ))}
        </div>
      </>
    );
  }
  return (
    <>
      <Tracejado y={18} cor={cor.tinta} />
      {nome ? <div style={{ ...centro, top: 40, ...fonteCupom(Math.min(46, Math.floor(INTERNO / (nome.length * AVANCO))), 700), letterSpacing: "0.04em" }}>{nome.toUpperCase()}</div> : null}
      {area ? <div style={{ ...centro, top: 98, ...fonteCupom(Math.max(30, Math.min(36, Math.floor(INTERNO / (area.length * AVANCO)))), 500), color: cor.cinza }}>{area.toUpperCase()}</div> : null}
      <div style={{ position: "absolute", left: (PAPEL - 400) / 2, top: 160, width: 400, height: 78 }}>
        {lista.map((b, i) => (
          <div key={i} style={{ position: "absolute", left: b.x, top: 0, width: b.w, height: 78, background: cor.tinta }} />
        ))}
      </div>
    </>
  );
};

// ---------- os blocos universais, em linhas de cupom ----------

// título de seção: centrado, caixa-alta espaçada, com o fio tracejado embaixo
const Titulo: React.FC<{ linhas: string[]; tamanho: number; altura: number }> = ({ linhas, tamanho, altura }) => (
  <>
    {linhas.map((l, i) => (
      <div key={i} style={{ position: "absolute", left: PAD_X, width: INTERNO, top: 16 + i * tamanho * 1.18, textAlign: "center", ...fonteCupom(tamanho, 700), letterSpacing: "0.04em" }}>
        {l}
      </div>
    ))}
    <Tracejado y={altura - 18} cor={cor.cinza} />
  </>
);

// item de lista: marcador + texto + pontilhado que corre até a borda; nos passos, a caixa do número
// fica cheia enquanto o passo é o da vez e os passos são ligados por um tracejado
const Lista: React.FC<{ t: number; em: number; c: Extract<Conteudo, { k: "lista" }>; altura: number }> = ({ t, em, c, altura }) => {
  const alturaLinha = Math.round(c.tamanho * 1.16);
  const topoTexto = 20;
  const meioPrimeira = topoTexto + alturaLinha / 2;
  const pCorre = prog(t, em + 0.08, 0.42, entra);
  const daVez = t >= em - 0.02 && t < c.ativoAte - 0.02;
  const bate = prog(t, em - 0.02, 0.16, (x) => x * x);
  const ultimaLinha = c.linhas[c.linhas.length - 1];
  let marcador: React.ReactNode = null;
  if (c.marcador === "ponto") {
    marcador = <div style={{ position: "absolute", left: PAD_X + 10, top: meioPrimeira - 11, width: 22, height: 22, background: cor.tinta, borderRadius: 3, scale: String(1.6 - 0.6 * bate) }} />;
  } else if (c.marcador === "numero") {
    marcador = (
      <>
        {!c.primeiro ? <div style={{ position: "absolute", left: PAD_X + 26, top: 0, width: 3, height: meioPrimeira - 28, backgroundImage: `repeating-linear-gradient(180deg, ${cor.cinza} 0 8px, transparent 8px 14px)` }} /> : null}
        {!c.ultimo ? <div style={{ position: "absolute", left: PAD_X + 26, top: meioPrimeira + 28, width: 3, height: altura - meioPrimeira - 28, backgroundImage: `repeating-linear-gradient(180deg, ${cor.cinza} 0 8px, transparent 8px 14px)` }} /> : null}
        <div
          style={{
            position: "absolute",
            left: PAD_X + 2,
            top: meioPrimeira - 26,
            width: 52,
            height: 52,
            borderRadius: 9,
            border: `3.5px solid ${cor.tinta}`,
            background: daVez ? cor.tinta : cor.papel,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(1.25 - 0.25 * bate),
          }}
        >
          <span style={{ ...fonteCupom(32, 700), color: daVez ? cor.papel : cor.tinta, lineHeight: 1 }}>{c.n}</span>
        </div>
      </>
    );
  } else {
    marcador = <div style={{ position: "absolute", left: PAD_X + 4, top: meioPrimeira - 22, width: 44, height: 44, borderRadius: 7, border: `3.5px solid ${cor.tinta}`, scale: String(1.25 - 0.25 * bate) }} />;
  }
  return (
    <>
      {marcador}
      <div style={{ position: "absolute", left: PAD_X + 64, top: topoTexto, width: INTERNO - 64 }}>
        {c.linhas.slice(0, -1).map((l, i) => (
          <div key={i} style={{ height: alturaLinha, ...fonteCupom(c.tamanho, 600) }}>
            {l}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", height: alturaLinha }}>
          <div style={{ ...fonteCupom(c.tamanho, 600) }}>{ultimaLinha}</div>
          <div style={{ flex: 1, marginLeft: 14, marginTop: c.tamanho * 0.36, opacity: 0.8 }}>
            <div style={{ width: `${pCorre * 100}%`, ...pontilhado(cor.cinza) }} />
          </div>
        </div>
        {c.detalhe.map((l, i) => (
          <div key={`d${i}`} style={{ ...fonteCupom(36, 500), color: cor.cinza, marginTop: i === 0 ? 6 : 0, lineHeight: 1.2 }}>
            {l}
          </div>
        ))}
      </div>
    </>
  );
};

// definição: o "=" magenta e o significado embaixo do termo
const Significado: React.FC<{ c: Extract<Conteudo, { k: "significado" }> }> = ({ c }) => (
  <>
    <div style={{ position: "absolute", left: PAD_X, top: 12, ...fonteCupom(c.tamanho + 4, 700), color: cor.magenta }}>=</div>
    {c.linhas.map((l, i) => (
      <div key={i} style={{ position: "absolute", left: PAD_X + 52, top: 12 + i * c.tamanho * 1.2, ...fonteCupom(c.tamanho, 600) }}>
        {l}
      </div>
    ))}
  </>
);

// carimbo redondo de "certo" (✓) que bate ao lado do lado vencedor
const SeloCerto: React.FC<{ t: number; em: number; tamanho?: number; style?: React.CSSProperties }> = ({ t, em, tamanho = 76, style }) => {
  if (t < em) return null;
  const p = prog(t, em, 0.13, (x) => x * x);
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 76 76" style={{ position: "absolute", overflow: "visible", scale: String(1.5 - 0.5 * p), opacity: Math.min(1, p * 1.4) * 0.95, rotate: "-8deg", filter: "url(#tinta-de-carimbo)", ...style }}>
      <circle cx={38} cy={38} r={33} fill="none" stroke={cor.magenta} strokeWidth={6} />
      <path d="M 22 39 L 33 50 L 54 27" fill="none" stroke={cor.magenta} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// um lado da comparação: o rótulo pequeno e o texto grande; o errado leva risco, o vencedor o selo
const LadoComparacao: React.FC<{ t: number; c: Extract<Conteudo, { k: "lado" }> }> = ({ t, c }) => {
  const alturaLinha = Math.round(c.tamanho * 1.14);
  const pMarca = c.marca ? prog(t, c.marcaEm, 0.3) : 0;
  const perde = c.marca === "perde" || c.marca === "errado";
  const corTexto = perde && pMarca > 0 ? cor.cinza : cor.tinta;
  return (
    <>
      <div style={{ position: "absolute", left: PAD_X, top: 14, display: "flex", alignItems: "center" }}>
        <div style={{ width: 14, height: 14, background: cor.cinza, marginRight: 12 }} />
        <span style={{ ...fonteCupom(34, 600), color: cor.cinza, letterSpacing: "0.06em" }}>{c.rotulo}</span>
      </div>
      {c.linhas.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: PAD_X, top: 60 + i * alturaLinha, height: alturaLinha }}>
          <span style={{ position: "relative", ...fonteCupom(c.tamanho, 700), color: corTexto }}>
            {l}
            {c.marca === "errado" && pMarca > 0 ? (
              <span style={{ position: "absolute", left: -4, top: "52%", height: Math.max(5, c.tamanho * 0.1), width: `calc((100% + 8px) * ${pMarca})`, background: cor.magenta, borderRadius: 3 }} />
            ) : null}
          </span>
        </div>
      ))}
      {c.marca === "certo" || c.marca === "vence" ? <SeloCerto t={t} em={c.marcaEm} style={{ left: PAD_X + INTERNO - 78, top: 52 }} /> : null}
      {c.marca === "errado" && pMarca > 0 ? (
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: "absolute", left: PAD_X + INTERNO - 66, top: 58, overflow: "visible" }}>
          <Traco d="M 32 4 A 28 28 0 1 1 31.99 4" p={pMarca} cor={cor.magenta} largura={5} />
          <Traco d="M 20 20 L 44 44" p={prog(t, c.marcaEm + 0.15, 0.15)} cor={cor.magenta} largura={5} />
          <Traco d="M 44 20 L 20 44" p={prog(t, c.marcaEm + 0.25, 0.15)} cor={cor.magenta} largura={5} />
        </svg>
      ) : null}
    </>
  );
};

const Versus: React.FC<{ texto: string }> = ({ texto }) => (
  <>
    <Tracejado y={39} cor={cor.cinza} />
    <div style={{ position: "absolute", left: PAPEL / 2 - 52, top: 39 - 30, width: 104, height: 60, background: cor.papel, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {texto === "VS" ? (
        <span style={{ ...fonteCupom(40, 700), color: cor.magenta, letterSpacing: "0.04em" }}>VS</span>
      ) : (
        <svg width={44} height={52} viewBox="0 0 44 52">
          <path d="M 22 4 V 44 M 8 31 L 22 46 L 36 31" fill="none" stroke={cor.magenta} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  </>
);

// ---------- o gráfico impresso ----------

const TENDENCIAS: Record<"sobe" | "cai" | "oscila", number[]> = {
  sobe: [0.12, 0.24, 0.18, 0.36, 0.31, 0.52, 0.46, 0.68, 0.62, 0.9],
  cai: [0.9, 0.78, 0.83, 0.62, 0.68, 0.46, 0.51, 0.3, 0.35, 0.1],
  oscila: [0.45, 0.72, 0.36, 0.66, 0.28, 0.7, 0.4, 0.62, 0.34, 0.55],
};

// as casas decimais que o número dito tem (16,5 sai 16,5; nunca arredonda o que foi dito)
const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Number.isInteger(Math.round(v * 1000) / 100) ? 1 : 2);
const rotuloDado = (d: Dado, unidade?: string) => {
  const u = (unidade ?? "").toUpperCase();
  return `${numeroBR(d.valor, casasDe(d.valor))}${u ? (u.length <= 2 ? u : ` ${u}`) : ""}`;
};

// rótulo que cabe numa largura (até 2 linhas, de 34 a 30 px; corta com "." no fim se não couber)
const encaixarRotulo = (texto: string, largura: number) => {
  const t = texto.toUpperCase();
  for (let tam = 34; tam >= 30; tam -= 2) {
    const max = Math.max(1, Math.floor(largura / (tam * AVANCO)));
    const palavras = t.split(/\s+/);
    const linhas: string[] = [];
    let atual = "";
    for (const p of palavras) {
      const tentativa = atual ? `${atual} ${p}` : p;
      if (tentativa.length <= max) atual = tentativa;
      else {
        if (atual) linhas.push(atual);
        atual = p;
      }
    }
    if (atual) linhas.push(atual);
    if (linhas.length <= 2 && linhas.every((l) => l.length <= max)) return { linhas, tamanho: tam };
  }
  const max = Math.max(2, Math.floor(largura / (30 * AVANCO)));
  return { linhas: [t.length > max ? `${t.slice(0, max - 1)}.` : t], tamanho: 30 };
};

const Grafico: React.FC<{ t: number; em: number; c: Extract<Conteudo, { k: "grafico" }>; altura: number }> = ({ t, em, c, altura }) => {
  const x0 = PAD_X + 6;
  const x1 = PAD_X + INTERNO - 6;
  const yT = 96;
  const yB = 360;
  const largura = x1 - x0;
  const util = yB - yT - 56;
  const elementos: React.ReactNode[] = [];
  const pBase = prog(t, em, 0.35, entra);

  // o alto do bloco: a unidade à esquerda e a etiqueta ILUSTRATIVO à direita
  const topo = (
    <>
      {c.unidade && c.dados ? <div style={{ position: "absolute", left: PAD_X, top: 18, ...fonteCupom(30, 600), color: cor.cinza, letterSpacing: "0.04em" }}>{c.unidade.toUpperCase()}</div> : null}
      {c.ilustrativo ? <Etiqueta style={{ right: PAD_X, top: 14 }} /> : null}
    </>
  );

  if (c.forma === "pizza") {
    const cx = PAD_X + 150;
    const cy = 236;
    const r = 136;
    const dados = c.dados ?? [
      { rotulo: "", valor: 72, em: c.tendenciaEm },
      { rotulo: "", valor: 28, em: c.tendenciaEm + 0.5 },
    ];
    const soma = Math.max(1e-6, dados.reduce((s, d) => s + Math.max(0, d.valor), 0));
    const cores = [cor.tinta, cor.magenta, cor.cinza, cor.lapis, cor.tinta, cor.magenta];
    let inicio = -90;
    const fatias = dados.map((d, i) => {
      const angulo = (Math.max(0, d.valor) / soma) * 360;
      const p = prog(t, d.em - 0.02, 0.5, entra);
      const a0 = inicio;
      const a1 = inicio + angulo * p;
      inicio += angulo;
      if (p <= 0.001) return null;
      const rad = (a: number) => (a * Math.PI) / 180;
      const grande = a1 - a0 > 180 ? 1 : 0;
      const d0 = `M ${cx} ${cy} L ${cx + r * Math.cos(rad(a0))} ${cy + r * Math.sin(rad(a0))} A ${r} ${r} 0 ${grande} 1 ${cx + r * Math.cos(rad(a1))} ${cy + r * Math.sin(rad(a1))} Z`;
      const tracejada = i >= 4;
      return <path key={i} d={d0} fill={tracejada ? "url(#hachura)" : cores[i % cores.length]} stroke={cor.papel} strokeWidth={4} strokeLinejoin="round" />;
    });
    elementos.push(
      <svg key="pizza" width={PAPEL} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <pattern id="hachura" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill={cor.papel} />
            <rect width="4" height="10" fill={cor.tinta} />
          </pattern>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="10 8" opacity={pBase} />
        {fatias}
      </svg>,
    );
    // a legenda à direita: um quadrado da cor, o rótulo e o valor
    if (c.dados) {
      const xl = PAD_X + 316;
      const ll = PAD_X + INTERNO - xl;
      const passo = Math.min(84, 300 / Math.max(1, dados.length));
      dados.forEach((d, i) => {
        const p = revela(t, d.em);
        const r0 = encaixarRotulo(d.rotulo, ll - 40);
        elementos.push(
          <div key={`l${i}`} style={{ position: "absolute", left: xl, top: yT + i * passo, width: ll, opacity: p }}>
            <div style={{ position: "absolute", left: 0, top: 6, width: 26, height: 26, background: i >= 4 ? cor.tinta : cores[i % cores.length], border: `2px solid ${cor.tinta}` }} />
            <div style={{ marginLeft: 38, ...fonteCupom(r0.tamanho, 600), whiteSpace: "normal" }}>{r0.linhas[0]}</div>
            <div style={{ marginLeft: 38, ...fonteCupom(34, 700), color: i === 1 ? cor.magenta : cor.tinta }}>{rotuloDado(d, c.unidade)}</div>
          </div>,
        );
      });
    }
    return (
      <>
        {topo}
        {elementos}
      </>
    );
  }

  // barras e linha: base e grade a lápis
  elementos.push(
    <div key="base" style={{ position: "absolute", left: x0, top: yB, width: largura * pBase, height: 3.5, background: cor.tinta }} />,
    ...[0.33, 0.66, 1].map((f) => <Tracejado key={`g${f}`} y={yB - util * f} x={x0} largura={largura} cor={cor.lapis} espessura={2} traco={4} vao={10} p={pBase} />),
  );

  if (c.dados) {
    const dados = c.dados;
    const n = dados.length;
    const fatia = largura / n;
    const max = Math.max(...dados.map((d) => d.valor), 1e-6);
    const min = Math.min(...dados.map((d) => d.valor));
    const tamValor = Math.max(30, Math.min(40, Math.floor((fatia - 6) / Math.max(1, Math.max(...dados.map((d) => rotuloDado(d, c.unidade).length)) * AVANCO))));
    // o dado da vez fica em magenta até o próximo ser dito
    const daVez = dados.reduce((k, d, i) => (t >= d.em - 0.02 ? i : k), -1);
    if (c.forma === "barras") {
      const lb = Math.min(96, fatia * 0.62);
      dados.forEach((d, i) => {
        const cx = x0 + fatia * (i + 0.5);
        const h = Math.max(8, (Math.max(0, d.valor) / max) * util);
        const p = prog(t, d.em - 0.02, 0.45, entra);
        const r0 = encaixarRotulo(d.rotulo, fatia - 6);
        elementos.push(
          <div key={`b${i}`}>
            {/* a coluna espera a lápis, numa altura neutra */}
            <div style={{ position: "absolute", left: cx - lb / 2, top: yB - util * 0.4, width: lb, height: util * 0.4, border: `2.5px dashed ${cor.lapis}`, borderBottom: "none", borderRadius: "5px 5px 0 0", opacity: (1 - p) * pBase }} />
            <div style={{ position: "absolute", left: cx - lb / 2, top: yB - h * p, width: lb, height: h * p, background: i === daVez ? cor.magenta : cor.tinta, borderRadius: "5px 5px 0 0" }} />
            <div style={{ position: "absolute", left: cx - fatia / 2, width: fatia, top: yB - h * p - tamValor * 1.25, textAlign: "center", ...fonteCupom(tamValor, 700), opacity: revela(t, d.em + 0.15) }}>
              {rotuloDado(d, c.unidade)}
            </div>
            <div style={{ position: "absolute", left: cx - fatia / 2, width: fatia, top: yB + 12, textAlign: "center", opacity: revela(t, d.em) }}>
              {r0.linhas.map((l, k) => (
                <div key={k} style={{ ...fonteCupom(r0.tamanho, 600), lineHeight: 1.12 }}>
                  {l}
                </div>
              ))}
            </div>
          </div>,
        );
      });
    } else {
      const span = max - min;
      const lo = min >= 0 && span > 0.5 * max ? 0 : min - span * 0.35;
      const hi = max + (max - lo) * 0.05;
      const ponto = (i: number) => ({ x: x0 + fatia * (i + 0.5), y: yB - 18 - ((dados[i].valor - lo) / Math.max(1e-6, hi - lo)) * (util - 10) });
      const segmentos: React.ReactNode[] = [];
      dados.forEach((d, i) => {
        const a = ponto(Math.max(0, i - 1));
        const b = ponto(i);
        if (i > 0) segmentos.push(<Traco key={`s${i}`} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} p={prog(t, d.em - 0.02, 0.35, entra)} cor={cor.tinta} largura={6} />);
      });
      elementos.push(
        <svg key="linha" width={PAPEL} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {dados.map((_, i) => {
            const b = ponto(i);
            return <line key={`t${i}`} x1={b.x} x2={b.x} y1={yB} y2={yT} stroke={cor.lapis} strokeWidth={2} strokeDasharray="4 8" opacity={pBase} />;
          })}
          {segmentos}
          {dados.map((d, i) => {
            const b = ponto(i);
            const p = prog(t, d.em + (i > 0 ? 0.25 : 0), 0.14);
            return p > 0 ? <circle key={`p${i}`} cx={b.x} cy={b.y} r={i === daVez ? 13 : 10} fill={i === daVez ? cor.magenta : cor.tinta} stroke={cor.papel} strokeWidth={3} /> : null;
          })}
        </svg>,
      );
      dados.forEach((d, i) => {
        const b = ponto(i);
        const r0 = encaixarRotulo(d.rotulo, fatia - 6);
        elementos.push(
          <div key={`v${i}`} style={{ position: "absolute", left: b.x - fatia / 2, width: fatia, top: b.y - tamValor * 1.4, textAlign: "center", ...fonteCupom(tamValor, 700), opacity: revela(t, d.em + 0.2) }}>
            {rotuloDado(d, c.unidade)}
          </div>,
          <div key={`r${i}`} style={{ position: "absolute", left: b.x - fatia / 2, width: fatia, top: yB + 12, textAlign: "center", opacity: revela(t, d.em) }}>
            {r0.linhas.map((l, k) => (
              <div key={k} style={{ ...fonteCupom(r0.tamanho, 600), lineHeight: 1.12 }}>
                {l}
              </div>
            ))}
          </div>,
        );
      });
    }
  } else {
    // sem números ditos: a forma da tendência, desenhada como a impressora traça (ilustrativo)
    const forma = TENDENCIAS[c.tendencia ?? "sobe"];
    const n = forma.length;
    const pTraco = prog(t, c.tendenciaEm, 1.5, (x) => x);
    if (c.forma === "barras") {
      const fatia = largura / n;
      const lb = fatia * 0.6;
      forma.forEach((v, i) => {
        const p = prog(t, c.tendenciaEm + (i * 1.3) / n, 0.3, entra);
        const h = v * util;
        const x = x0 + fatia * (i + 0.5) - lb / 2;
        elementos.push(
          <div key={`b${i}`}>
            <div style={{ position: "absolute", left: x, top: yB - util * 0.4, width: lb, height: util * 0.4, border: `2.5px dashed ${cor.lapis}`, borderBottom: "none", borderRadius: "4px 4px 0 0", opacity: (1 - p) * pBase }} />
            <div style={{ position: "absolute", left: x, top: yB - h * p, width: lb, height: h * p, background: i === n - 1 ? cor.magenta : cor.tinta, borderRadius: "4px 4px 0 0" }} />
          </div>,
        );
      });
    } else {
      const pts = forma.map((v, i) => ({ x: x0 + 20 + ((largura - 60) * i) / (n - 1), y: yB - 14 - v * util }));
      const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
      const ultimo = pts[n - 1];
      const penultimo = pts[n - 2];
      const ang = Math.atan2(ultimo.y - penultimo.y, ultimo.x - penultimo.x);
      const seta = (a: number) => `${ultimo.x - 26 * Math.cos(ang + a)} ${ultimo.y - 26 * Math.sin(ang + a)}`;
      const pFim = prog(t, c.tendenciaEm + 1.45, 0.2);
      elementos.push(
        <svg key="tendencia" width={PAPEL} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Traco d={d} p={pTraco} cor={cor.tinta} largura={7} />
          {pFim > 0 ? <path d={`M ${seta(0.5)} L ${ultimo.x} ${ultimo.y} L ${seta(-0.5)}`} fill="none" stroke={cor.magenta} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={pFim} /> : null}
        </svg>,
      );
    }
  }
  return (
    <>
      {topo}
      {elementos}
    </>
  );
};

const Resposta: React.FC<{ t: number; em: number }> = ({ t, em }) => (
  <div style={{ position: "absolute", left: PAD_X, top: 14, width: INTERNO, height: 60, display: "flex", alignItems: "center" }}>
    <Icone nome="lapis" p={prog(t, em, 0.4)} tamanho={50} cor={cor.tinta} style={{ marginRight: 14, flexShrink: 0 }} />
    <div style={{ flex: 1, marginTop: 30 }}>
      <div style={{ width: `${prog(t, em + 0.1, 0.5, entra) * 100}%`, height: 3, backgroundImage: `repeating-linear-gradient(90deg, ${cor.lapis} 0 10px, transparent 10px 17px)` }} />
    </div>
  </div>
);

// ---------- o carimbo ----------

const Carimbo: React.FC<{ t: number; em: number; linhas: string[]; tamanho: number; giro?: number }> = ({ t, em, linhas, tamanho, giro = -9 }) => {
  // bate decidido (cresce de 1,5 para 1 em 0,13 s, sem quicar) e a tinta assenta
  const p = prog(t, em, 0.13, (x) => x * x);
  if (t < em) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        translate: "-50% -50%",
        rotate: `${giro}deg`,
        scale: String(1.5 - 0.5 * p),
        opacity: Math.min(1, p * 1.4) * 0.95,
        mixBlendMode: "multiply",
        border: `6px solid ${cor.magenta}`,
        borderRadius: 14,
        padding: 5,
        filter: "url(#tinta-de-carimbo)",
      }}
    >
      <div style={{ border: `2.5px solid ${cor.magenta}`, borderRadius: 9, padding: "8px 22px 10px" }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanho, lineHeight: 1.04, letterSpacing: "0.05em", color: cor.magenta, textAlign: "center", whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// as linhas do carimbo de um total (até 2, equilibradas)
const linhasDoCarimboDoTotal = (texto: string, umaLinha: boolean) => {
  const palavras = texto.toUpperCase().split(/\s+/).filter(Boolean);
  let linhas = [palavras.join(" ")];
  if (palavras.length > 1 && !umaLinha) {
    let melhor = Infinity;
    for (let i = 1; i < palavras.length; i++) {
      const a = palavras.slice(0, i).join(" ");
      const b = palavras.slice(i).join(" ");
      const pior = Math.max(a.length, b.length);
      if (pior < melhor) {
        melhor = pior;
        linhas = [a, b];
      }
    }
  }
  return linhas;
};

// o carimbo do alerta: o lugar dele espera a lápis (tracejado) e ele bate quando a frase é dita
const CarimboBloco: React.FC<{ t: number; c: Extract<Conteudo, { k: "carimbo" }>; altura: number }> = ({ t, c, altura }) => {
  const pEsboco = 1 - prog(t, c.em, 0.12);
  return (
    <>
      <div style={{ position: "absolute", left: PAD_X + 20, top: 22, width: INTERNO - 40, height: altura - 44, border: `3px dashed ${cor.lapis}`, borderRadius: 14, opacity: pEsboco }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: PAPEL, height: altura }}>
        <Carimbo t={t} em={c.em} linhas={c.linhas} tamanho={c.tamanho} giro={-5} />
      </div>
    </>
  );
};

// ---------- o papel ----------

export const Recibo: React.FC<{
  t: number;
  blocos: Bloco[];
  avancoAgora: number;
  x: number;
  linha: number;
  escala: number;
  rabo: number;
  cruzando: number;
  tamanhoTotal: number;
  // deslocamento vertical (px na tela): a tira subindo ou caindo
  deslocY?: number;
  // acima disto (px na tela) o papel não aparece, com a borda serrilhada (a tira sob o queixo)
  limite?: number;
}> = ({ t, blocos, avancoAgora, x, linha, escala, rabo, cruzando, tamanhoTotal, deslocY = 0, limite }) => {
  // o carimbo dá um tranco de 6 px no papel
  const trancos = blocos.flatMap((b) => (b.c.k === "total" && b.c.carimbo ? [b.c.carimbo.em] : b.c.k === "carimbo" ? [b.c.em] : []));
  const tranco = trancos.reduce((s, em) => s + (t >= em ? 6 * (1 - prog(t, em, 0.22)) : 0), 0);
  // o papel é desenhado em escala 1 e reduzido em volta da linha de impressão: a última linha
  // impressa (fim do avanço) fica sempre na altura `linha` da tela
  const topo = linha - avancoAgora + tranco + deslocY;
  // abaixo da última linha, `rabo` px de papel em branco (curto na abertura; até o pé do quadro no resto)
  const alturaPapel = avancoAgora + Math.max(0, rabo);
  // passando por trás do cartão na troca de lado: o papel recua e escurece um pouco
  const recuo = 1 - 0.05 * cruzando;
  const escalaTotal = escala * recuo;
  // na tela, o bloco em y fica em linha + (y − avanço) × escala; os que já saíram pelo alto não são desenhados
  const visiveis = blocos.filter((b) => t >= b.em - 0.05 && linha + deslocY + (b.y + b.altura - avancoAgora) * escalaTotal > Math.max(-160, (limite ?? -160) - 40));
  const recuoIcone = 70;
  // a borda de cima do papel na tela; abaixo do `limite`, o papel começa no próprio limite
  const topoNaTela = linha + deslocY + tranco - avancoAgora * escalaTotal;
  const corteNoTopo = limite !== undefined && topoNaTela < limite ? (limite - topoNaTela) / escalaTotal : 0;

  return (
    <div
      style={{
        position: "absolute",
        // `x` é a borda esquerda do papel já reduzido
        left: x - (PAPEL / 2) * (1 - escala),
        top: topo,
        width: PAPEL,
        height: alturaPapel,
        transformOrigin: `${PAPEL / 2}px ${avancoAgora}px`,
        scale: String(escalaTotal),
        filter: `drop-shadow(0 26px 40px rgba(0,0,0,0.42)) drop-shadow(0 3px 6px rgba(0,0,0,0.28)) brightness(${1 - 0.08 * cruzando})`,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="tinta-de-carimbo">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} result="ruido" />
          <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.9 1.95" result="mascara" />
          <feComposite in="SourceGraphic" in2="mascara" operator="in" />
        </filter>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: serrilha(alturaPapel, corteNoTopo),
          background: `linear-gradient(90deg, ${cor.papelBorda}, transparent 7%, transparent 93%, ${cor.papelBorda}), ${cor.papel}`,
        }}
      >
        {visiveis.map((b) => {
          const pRevela = revela(t, b.em);
          const c = b.c;
          // cabeçalho e textos têm a própria revelação (o texto, palavra por palavra)
          const opacidade = c.k === "texto" || c.k === "cabecalho" || c.k === "corte" || c.k === "carimbo" ? 1 : pRevela;
          return (
            <div key={b.chave} style={{ position: "absolute", left: 0, top: b.y, width: PAPEL, height: b.altura, opacity: c.k === "cabecalho" ? pRevela : opacidade }}>
              {c.k === "cabecalho" ? <Cabecalho titulo={c.titulo} nome={c.nome} area={c.area} /> : null}
              {c.k === "capa" ? <Capa titulo={c.titulo} tamanho={c.tamanho} /> : null}
              {c.k === "item" ? <Item t={t} c={c} /> : null}
              {c.k === "nota" ? <Nota texto={c.texto} recuo={recuoIcone} /> : null}
              {c.k === "vezes" ? <Vezes t={t} texto={c.texto} fator={c.fator} sinal={c.sinal} fatorEm={c.fatorEm} /> : null}
              {c.k === "corte" ? <div style={{ opacity: pRevela }}><Corte t={t} em={b.em} riscaEm={c.riscaEm} /></div> : null}
              {c.k === "gradeRotulos" ? <GradeRotulos rotulos={c.rotulos} colunas={c.colunas} /> : null}
              {c.k === "gradeLinha" ? <GradeLinha t={t} l={c.linha} inicio={c.inicio} fim={c.fim} colunas={c.colunas} /> : null}
              {c.k === "degraus" ? <Degraus t={t} l={c.linha} /> : null}
              {c.k === "ilustrativo" ? <Etiqueta style={{ right: PAD_X, top: 8 }} /> : null}
              {c.k === "total" ? <Total t={t} b={c} tamanho={tamanhoTotal} /> : null}
              {c.k === "texto" ? <Texto t={t} b={c} /> : null}
              {c.k === "camposTitulo" ? <CamposTitulo texto={c.texto} /> : null}
              {c.k === "campo" ? <Campo texto={c.texto} moeda={c.moeda} /> : null}
              {c.k === "rodape" ? <Rodape nome={c.nome} area={c.area} compacto={c.compacto} /> : null}
              {c.k === "titulo" ? <Titulo linhas={c.linhas} tamanho={c.tamanho} altura={b.altura} /> : null}
              {c.k === "lista" ? <Lista t={t} em={b.em} c={c} altura={b.altura} /> : null}
              {c.k === "significado" ? <Significado c={c} /> : null}
              {c.k === "lado" ? <LadoComparacao t={t} c={c} /> : null}
              {c.k === "versus" ? <Versus texto={c.texto} /> : null}
              {c.k === "grafico" ? <Grafico t={t} em={b.em} c={c} altura={b.altura} /> : null}
              {c.k === "carimbo" ? <CarimboBloco t={t} c={c} altura={b.altura} /> : null}
              {c.k === "resposta" ? <Resposta t={t} em={b.em} /> : null}
            </div>
          );
        })}
        {/* carimbos dos totais por cima de tudo, em papel livre perto do total que fecham (nunca sobre texto) */}
        {visiveis.map((b) => {
          if (b.c.k !== "total" || !b.c.carimbo) return null;
          const lugar = lugarDoCarimbo(b, blocos);
          return (
            <div key={`carimbo-${b.chave}`} style={{ position: "absolute", left: lugar.x - 200, width: 400, top: lugar.y - 100, height: 200 }}>
              <Carimbo t={t} em={b.c.carimbo.em} linhas={linhasDoCarimboDoTotal(b.c.carimbo.texto, lugar.umaLinha)} tamanho={lugar.tamanho} giro={lugar.giro} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// corpo dos números dos totais: o mesmo em todo o papel, o maior em que o maior total cabe
export const tamanhoDosTotais = (blocos: Bloco[]) => {
  let tamanho = 104;
  for (const b of blocos) {
    if (b.c.k !== "total" || b.c.valor === undefined) continue;
    const n = formatar(b.c.valor, b.c.casas).length;
    const fixos = (b.c.prefixo ? (b.c.prefixo.length + 1) * TAM_RS * AVANCO : 0) + (b.c.sufixo ? (b.c.sufixo.length + 1) * TAM_RS * AVANCO : 0);
    tamanho = Math.min(tamanho, Math.floor((INTERNO - fixos - 12) / (n * (AVANCO - 0.03))));
  }
  return Math.max(72, Math.min(104, tamanho));
};

// Onde o carimbo bate, sempre em papel livre: no canto vazio do gráfico de degraus que vem logo antes
// do total (as barras sobem para a direita, então o alto da esquerda fica livre), em duas linhas;
// sem degraus, numa linha só, à direita do rótulo do total (entre o fio duplo e os algarismos).
const lugarDoCarimbo = (total: Bloco, blocos: Bloco[]) => {
  const i = blocos.indexOf(total);
  const antes = blocos[i - 1];
  if (antes && antes.c.k === "degraus" && antes.momento === total.momento) {
    return { x: PAD_X + INTERNO * 0.25, y: antes.y + 64, tamanho: 40, umaLinha: false, giro: -9 };
  }
  const texto = total.c.k === "total" ? (total.c.carimbo?.texto ?? "") : "";
  const tamanho = 30;
  // largura aproximada do carimbo de uma linha (caixa-alta da Plex Sans 700 + bordas e respiros)
  const largura = texto.length * 0.73 * tamanho + 71;
  return { x: PAD_X + INTERNO - largura / 2 - 2, y: total.y + 56, tamanho, umaLinha: true, giro: -4 };
};
