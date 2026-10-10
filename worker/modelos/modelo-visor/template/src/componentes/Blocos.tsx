// Os blocos universais (lista, passos, comparação, gráfico, número, destaque, definição, frase,
// pergunta) na linguagem do Visor: tudo é interface de câmera.
//   - Lista, passos, comparação e gráfico ocupam uma TELA DE VIDRO embaixo da pessoa (que vira cartão
//     ou janelinha): linhas de menu com pontos de foco, trilho de pontos de foco, dois quadros, histograma.
//   - Número, destaque, definição, frase e pergunta são rótulos de vidro no peito, com a pessoa em tela
//     cheia: leitura de exposição, aviso de superexposição (zebra), quadrado de foco, seletor de modos.
// O que ainda não foi dito espera "a lápis" (só o contorno, nunca o texto); cada item entra na palavra dele.
import { Easing } from "remotion";
import { Palavras, Rolante, Traco, assenta, limitar, mistura, normalizar, prog, saindo, temposDoTexto } from "../anim";
import { MONO, SANS, SANS_FORTE, TITULO, type Fonte, type Quebra, encaixar, encaixarNaCaixa, larguraTexto } from "../medida";
import type { Comparacao, Definicao, Destaque, Frase, Grafico, Numero, Palavra, Pergunta, Topicos, Passos } from "../plano";
import { comAlfa, cor, mono, sans } from "../tema";
import type { Ret } from "../layout";
import { Icone } from "./Icones";

const vidro: React.CSSProperties = {
  background: cor.vidro,
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  borderRadius: 22,
  border: "1.5px solid rgba(243,244,241,0.14)",
};
// a tela de vidro dos blocos de conteúdo (fica atrás da pessoa, num corpo escuro)
const tela: React.CSSProperties = {
  background: "rgba(20,22,24,0.94)",
  borderRadius: 22,
  border: "1.5px solid rgba(243,244,241,0.16)",
  boxSizing: "border-box",
};

// ---------- números em pt-BR ----------

export const fmtNum = (v: number, casas = 0, agrupar = true) => {
  const [i, d] = Math.abs(v).toFixed(casas).split(".");
  const milhar = agrupar ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : i;
  return (v < 0 ? "−" : "") + milhar + (d ? `,${d}` : "");
};
const casasDe = (v: number) => Math.min(3, (String(v).split(".")[1] ?? "").length);

// ---------- texto encaixado ----------

const estiloPeso = (peso: 500 | 600 | 700): Fonte => (peso === 700 ? TITULO : peso === 600 ? SANS_FORTE : SANS);

const linhasDe = (q: Quebra) => q.linhas.map((l) => l.map((w) => w.w).join(" "));

// Um texto que já foi medido e quebrado: cada linha é uma `Palavras`, com os tempos das palavras dele.
const Texto: React.FC<{
  q: Quebra;
  tempos: number[];
  t: number;
  peso?: 500 | 600 | 700;
  cor?: string;
  corDe?: (i: number) => string | undefined;
  riscoDe?: (i: number) => number | undefined;
  alturaLinha?: number;
  esboco?: boolean;
  alinhar?: "left" | "center";
}> = ({ q, tempos, t, peso = 700, cor: corTexto = cor.branco, corDe, riscoDe, alturaLinha = 1.08, esboco = true, alinhar = "left" }) => {
  let k = 0;
  return (
    <>
      {linhasDe(q).map((linha, li) => {
        const n = linha.split(" ").length;
        const base = k;
        k += n;
        return (
          <Palavras
            key={`${li}-${linha}`}
            texto={linha}
            tempos={tempos.slice(base, base + n)}
            t={t}
            alinhar={alinhar}
            esboco={esboco ? cor.lapis : undefined}
            corDe={corDe ? (j) => corDe(base + j) : undefined}
            riscoDe={riscoDe ? (j) => riscoDe(base + j) : undefined}
            corRisco={cor.alerta}
            style={{
              fontFamily: sans,
              fontWeight: peso,
              fontSize: q.tamanho,
              lineHeight: alturaLinha,
              color: corTexto,
              letterSpacing: peso === 700 ? "-0.01em" : undefined,
            }}
          />
        );
      })}
    </>
  );
};

// índices das palavras de `texto` que casam com `trecho` (palavras seguidas)
const indicesDo = (texto: string, trecho?: string) => {
  const acesas = new Set<number>();
  if (!trecho) return acesas;
  const alvo = trecho.split(/\s+/).filter(Boolean).map(normalizar);
  const ws = texto.split(/\s+/).filter(Boolean).map(normalizar);
  for (let i = 0; alvo.length && i + alvo.length <= ws.length; i++) if (alvo.every((a, k) => ws[i + k] === a)) alvo.forEach((_, k) => acesas.add(i + k));
  return acesas;
};

const Tag: React.FC<{ texto: string; corTag?: string; p?: number; icone?: React.ReactNode; direita?: React.ReactNode }> = ({ texto, corTag = cor.acento, p = 1, icone, direita }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: mono, fontWeight: 600, fontSize: 32, letterSpacing: "0.14em", color: corTag, opacity: p }}>
    {icone ?? <span style={{ width: 12, height: 12, borderRadius: 6, background: corTag, scale: String(0.4 + 0.6 * p) }} />}
    <span>{texto.toUpperCase()}</span>
    {direita ? <span style={{ marginLeft: "auto" }}>{direita}</span> : null}
  </div>
);

// ---------- rótulo de vidro no peito (blocos em tela cheia) ----------

const Cartao: React.FC<{ base: number; entra: number; sai: number; borda?: string; children: React.ReactNode; sobre?: React.ReactNode }> = ({ base, entra, sai, borda, children, sobre }) => (
  <div
    style={{
      position: "absolute",
      left: 64,
      bottom: 1920 - base,
      width: 952,
      boxSizing: "border-box",
      padding: "22px 34px 28px",
      opacity: entra * (1 - sai),
      translate: `0 ${(1 - entra) * 30 - sai * 14}px`,
      overflow: "hidden",
      ...vidro,
      ...(borda ? { border: `2.5px solid ${borda}` } : {}),
    }}
  >
    {children}
    {sobre}
  </div>
);

// Cantos de um quadrado de foco dentro de um retângulo: fecham de fora para dentro e travam no acento
const Travas: React.FC<{ w: number; h: number; folga: number; corTraco: string; espessura?: number; braco?: number }> = ({ w, h, folga, corTraco, espessura = 4.5, braco = 36 }) => {
  const [x0, y0, x1, y1] = [-folga, -folga, w + folga, h + folga];
  const a = braco;
  const d = [
    `M ${x0} ${y0 + a} L ${x0} ${y0} L ${x0 + a} ${y0}`,
    `M ${x1 - a} ${y0} L ${x1} ${y0} L ${x1} ${y0 + a}`,
    `M ${x1} ${y1 - a} L ${x1} ${y1} L ${x1 - a} ${y1}`,
    `M ${x0 + a} ${y1} L ${x0} ${y1} L ${x0} ${y1 - a}`,
  ].join(" ");
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill="none" stroke={corTraco} strokeWidth={espessura} strokeLinecap="square" />
    </svg>
  );
};

export type PropsCheia<M> = { m: M; t: number; fim: number; palavras: Palavra[]; base: number; alturaMax: number; atraso: number };

const LARGURA = 952 - 68;

// ---- número: leitura de exposição que conta, com régua que corre ----
export const BNumero: React.FC<PropsCheia<Numero>> = ({ m, t, fim, palavras, base, atraso }) => {
  const entra = prog(t, Math.min(m.de + atraso, m.em - 0.05), 0.38);
  const sai = saindo(t, fim, 0.3);
  const casas = m.casas ?? casasDe(m.valor);
  const agrupar = !(Number.isInteger(m.valor) && m.valor >= 1900 && m.valor <= 2100 && !m.prefixo && !m.sufixo);
  const conta = prog(t, m.em, 1.15, Easing.out(Easing.cubic));
  const mostra = fmtNum(m.valor * conta, casas, agrupar);
  const final = fmtNum(m.valor, casas, agrupar);
  const sufixoLetras = /[a-zA-Z]/.test(m.sufixo ?? "");
  // corpo do número: o maior em que prefixo + número final + sufixo cabem numa linha
  let tamanho = 150;
  const larguraTotal = (s: number) =>
    (m.prefixo ? larguraTexto(m.prefixo, s * 0.52, MONO) + s * 0.1 : 0) + (larguraTexto(final.replace(/[.,]/g, ""), s, MONO) + [...final].filter((c) => c === "." || c === ",").length * s * 0.3) + (m.sufixo ? larguraTexto(m.sufixo, s * 0.52, MONO) + s * (sufixoLetras ? 0.16 : 0.04) : 0);
  while (tamanho > 60 && larguraTotal(tamanho) > LARGURA) tamanho -= 4;
  const rotuloEm = m.rotuloEm ?? m.em + 0.3;
  const qRotulo = encaixar(m.rotulo, { largura: LARGURA, max: 54, min: 38, linhas: 2, estilo: () => SANS_FORTE });
  const tRotulo = temposDoTexto(m.rotulo, palavras, rotuloEm - 0.2, fim, rotuloEm);
  const acende = prog(t, m.em, 0.3);
  // régua de exposição: corre com a contagem e continua devagar (nada fica parado)
  const desloca = (conta * 260 + t * 26) % 110;
  return (
    <Cartao base={base} entra={entra} sai={sai}>
      <Tag texto="Leitura" p={prog(t, m.de + atraso, 0.3)} direita={m.ilustrativo ? <span style={{ fontSize: 30, border: `2px dashed ${cor.apagado}`, color: cor.apagado, padding: "2px 14px", borderRadius: 20, letterSpacing: "0.1em" }}>ILUSTRATIVO</span> : undefined} />
      <div style={{ display: "flex", alignItems: "baseline", marginTop: 4, whiteSpace: "nowrap", height: tamanho * 1.05, color: cor.branco, fontFamily: mono, fontWeight: 600 }}>
        {m.prefixo ? <span style={{ fontSize: tamanho * 0.52, marginRight: tamanho * 0.1, color: cor.apagado }}>{m.prefixo}</span> : null}
        <span style={{ fontSize: tamanho, lineHeight: 1, letterSpacing: "-0.02em", color: conta >= 1 ? cor.acento : cor.branco, opacity: 0.25 + 0.75 * acende }}>
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
        {m.sufixo ? <span style={{ fontSize: tamanho * 0.52, marginLeft: tamanho * (sufixoLetras ? 0.16 : 0.04), color: cor.apagado }}>{m.sufixo}</span> : null}
      </div>
      <div style={{ marginTop: 6 }}>
        <Texto q={qRotulo} tempos={tRotulo} t={t} peso={600} />
      </div>
      <div style={{ position: "relative", marginTop: 14, height: 40, overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)" }}>
        <svg width={LARGURA} height={40} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 48 }, (_, i) => {
            const x = i * 22 - desloca;
            const grande = (i + Math.round(desloca / 22) * 0) % 5 === 0;
            return <line key={i} x1={x} x2={x} y1={grande ? 6 : 16} y2={34} stroke={cor.branco} strokeWidth={2.5} opacity={grande ? 0.7 : 0.35} />;
          })}
          <path d={`M ${LARGURA / 2 - 12} 0 L ${LARGURA / 2 + 12} 0 L ${LARGURA / 2} 16 Z`} fill={cor.acento} />
        </svg>
      </div>
    </Cartao>
  );
};

// ---- destaque: aviso de superexposição (zebra) ou quadrado de foco travado ----
export const BDestaque: React.FC<PropsCheia<Destaque>> = ({ m, t, fim, palavras, base, alturaMax, atraso }) => {
  const entra = prog(t, Math.min(m.de + atraso, m.em - 0.05), 0.38);
  const sai = saindo(t, fim, 0.3);
  const alerta = m.nivel === "alerta";
  const corTema = alerta ? cor.alerta : cor.acento;
  const q = encaixarNaCaixa(m.texto, { largura: LARGURA, altura: alturaMax - 130 - (m.detalhe ? 120 : 0), max: 100, min: 56, linhas: 3, estilo: () => TITULO, alturaLinha: 1.06 });
  const tTexto = temposDoTexto(m.texto, palavras, m.em - 0.2, fim, m.em);
  const fimTexto = tTexto[tTexto.length - 1] ?? m.em;
  const detEm = m.detalheEm ?? fimTexto + 0.3;
  const qDet = m.detalhe ? encaixar(m.detalhe, { largura: LARGURA, max: 50, min: 36, linhas: 2, estilo: () => SANS }) : null;
  const tDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, detEm - 0.2, fim, detEm) : [];
  const trava = prog(t, m.em, 0.4, assenta);
  const pulso = alerta ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
  return (
    <Cartao
      base={base}
      entra={entra}
      sai={sai}
      borda={comAlfa(corTema, 0.55 + 0.45 * trava)}
      sobre={
        <>
          {alerta ? (
            // faixa de zebra: o aviso de superexposição da câmera, correndo devagar
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 16,
                backgroundImage: `repeating-linear-gradient(135deg, ${cor.alerta} 0 12px, transparent 12px 24px)`,
                backgroundPosition: `${t * 40}px 0`,
                opacity: 0.4 + 0.5 * trava,
              }}
            />
          ) : null}
        </>
      }
    >
      <div style={{ position: "relative", paddingTop: alerta ? 12 : 0 }}>
        {!alerta ? (
          <div style={{ position: "absolute", left: -14, top: -10, right: -14, bottom: -12, pointerEvents: "none" }}>
            <SvgTravas corTraco={cor.acento} p={trava} />
          </div>
        ) : null}
        <Tag
          texto={alerta ? "Alerta" : "Em foco"}
          corTag={corTema}
          p={prog(t, m.de + atraso, 0.3)}
          icone={alerta ? <Icone nome="xis" tamanho={36} cor={cor.alerta} espessura={5} p={prog(t, m.em - 0.1, 0.5)} /> : <Icone nome="alvo" tamanho={36} cor={cor.acento} espessura={4} p={prog(t, m.em - 0.1, 0.5)} />}
        />
        <div style={{ marginTop: 6, opacity: 1, scale: String(1 + 0.012 * pulso), transformOrigin: "left center" }}>
          <Texto q={q} tempos={tTexto} t={t} corDe={() => undefined} />
        </div>
        {qDet ? (
          <div style={{ marginTop: 8 }}>
            <Texto q={qDet} tempos={tDet} t={t} peso={500} cor="rgba(243,244,241,0.9)" alturaLinha={1.18} />
          </div>
        ) : null}
        {alerta ? (
          <svg width={LARGURA} height={8} style={{ display: "block", marginTop: 10 }}>
            <Traco d={`M 4 4 H ${LARGURA - 4}`} p={prog(t, m.em, 0.7)} cor={cor.alerta} largura={5} />
          </svg>
        ) : null}
      </div>
    </Cartao>
  );
};

// cantos que fecham: ocupa o elemento pai (position:absolute com tamanho)
const SvgTravas: React.FC<{ corTraco: string; p: number }> = ({ corTraco, p }) => (
  <div style={{ position: "absolute", inset: 0, opacity: p }}>
    {(["tl", "tr", "br", "bl"] as const).map((c) => {
      const f = (1 - p) * 26;
      const pos: React.CSSProperties = c === "tl" ? { left: -f, top: -f } : c === "tr" ? { right: -f, top: -f } : c === "br" ? { right: -f, bottom: -f } : { left: -f, bottom: -f };
      const borda = `4.5px solid ${corTraco}`;
      return (
        <div
          key={c}
          style={{
            position: "absolute",
            width: 34,
            height: 34,
            ...pos,
            borderTop: c[0] === "t" ? borda : undefined,
            borderBottom: c[0] === "b" ? borda : undefined,
            borderLeft: c[1] === "l" ? borda : undefined,
            borderRight: c[1] === "r" ? borda : undefined,
          }}
        />
      );
    })}
  </div>
);

// ---- definição: o termo trava no quadrado de foco e o significado se escreve embaixo ----
export const BDefinicao: React.FC<PropsCheia<Definicao>> = ({ m, t, fim, palavras, base, alturaMax, atraso }) => {
  const entra = prog(t, Math.min(m.de + atraso, m.em - 0.05), 0.38);
  const sai = saindo(t, fim, 0.3);
  const qTermo = encaixarNaCaixa(m.termo, { largura: LARGURA - 40, altura: Math.min(230, (alturaMax - 190) * 0.5), max: 108, min: 58, linhas: 2, estilo: () => TITULO, alturaLinha: 1.04 });
  const tTermo = temposDoTexto(m.termo, palavras, m.em - 0.2, fim, m.em);
  const fimTermo = tTermo[tTermo.length - 1] ?? m.em;
  const qSig = encaixarNaCaixa(m.significado, { largura: LARGURA, altura: alturaMax - 190 - qTermo.linhas.length * qTermo.tamanho * 1.04, max: 56, min: 38, linhas: 3, estilo: () => SANS_FORTE, alturaLinha: 1.18 });
  const tSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.2, fim, m.significadoEm);
  const trava = prog(t, m.em, 0.45, assenta);
  const linha = prog(t, fimTermo, Math.max(0.3, m.significadoEm - fimTermo), Easing.inOut(Easing.cubic));
  return (
    <Cartao base={base} entra={entra} sai={sai}>
      <Tag texto="Termo" p={prog(t, m.de + atraso, 0.3)} icone={<Icone nome="lupa" tamanho={36} cor={cor.acento} espessura={4} p={prog(t, m.em - 0.1, 0.6)} />} />
      <div style={{ position: "relative", margin: "12px 0 0 20px", paddingBottom: 4 }}>
        <div style={{ position: "absolute", left: -20, top: -6, right: 0, bottom: -4, pointerEvents: "none" }}>
          <SvgTravas corTraco={cor.acento} p={trava} />
        </div>
        <Texto q={qTermo} tempos={tTermo} t={t} corDe={() => cor.acento} />
      </div>
      <svg width={LARGURA} height={22} style={{ display: "block", marginTop: 10 }}>
        <Traco d={`M 2 11 H ${LARGURA - 2}`} p={linha} cor="rgba(243,244,241,0.4)" largura={2.5} />
        <circle cx={2 + (LARGURA - 4) * linha} cy={11} r={6} fill={cor.acento} opacity={linha > 0 && linha < 1 ? 1 : 0} />
      </svg>
      <div style={{ marginTop: 4 }}>
        <Texto q={qSig} tempos={tSig} t={t} peso={600} alturaLinha={1.18} />
      </div>
    </Cartao>
  );
};

// ---- frase: citação com aspas grandes; o trecho `risco` é riscado quando é dito ----
export const BFrase: React.FC<PropsCheia<Frase>> = ({ m, t, fim, palavras, base, alturaMax, atraso }) => {
  const inicio = m.em ?? m.de;
  const entra = prog(t, Math.min(m.de + atraso, inicio - 0.05), 0.38);
  const sai = saindo(t, fim, 0.3);
  const largTexto = LARGURA - 84;
  const q = encaixarNaCaixa(m.texto, { largura: largTexto, altura: alturaMax - 80, max: 88, min: 48, linhas: 4, estilo: () => TITULO, alturaLinha: 1.08 });
  const tempos = temposDoTexto(m.texto, palavras, inicio - 0.1, fim, inicio);
  const acesas = indicesDo(m.texto, m.destaque);
  const riscadas = [...indicesDo(m.texto, m.risco)].sort((a, b) => a - b);
  const riscoEm = m.riscoEm ?? (riscadas.length ? tempos[riscadas[0]] : undefined);
  const riscoDe = (i: number) => {
    const k = riscadas.indexOf(i);
    return k < 0 || riscoEm === undefined ? undefined : riscoEm + k * 0.12;
  };
  const aspas = prog(t, m.de + atraso, 0.4, assenta);
  return (
    <Cartao base={base} entra={entra} sai={sai}>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        <div style={{ width: 66, flexShrink: 0, fontFamily: sans, fontWeight: 700, fontSize: 190, lineHeight: 0.82, color: cor.acento, scale: String(0.7 + 0.3 * aspas), opacity: aspas, transformOrigin: "left top", height: 90 }}>“</div>
        <div style={{ flex: 1, paddingTop: 6 }}>
          <Texto
            q={q}
            tempos={tempos}
            t={t}
            corDe={(i) => (riscoEm !== undefined && riscadas.includes(i) && t >= riscoEm ? cor.apagado : acesas.has(i) ? cor.acento : undefined)}
            riscoDe={riscadas.length ? riscoDe : undefined}
          />
        </div>
      </div>
    </Cartao>
  );
};

// ---- pergunta: a pergunta se monta; as opções são modos de um seletor que acendem uma a uma ----
export const BPergunta: React.FC<PropsCheia<Pergunta>> = ({ m, t, fim, palavras, base, alturaMax, atraso }) => {
  const inicio = m.em ?? m.de;
  const entra = prog(t, Math.min(m.de + atraso, inicio - 0.05), 0.38);
  const sai = saindo(t, fim, 0.3);
  const opcoes = m.opcoes ?? [];
  // corpo comum das opções: a maior opção cabe numa linha
  const tOpc = opcoes.length ? Math.min(...opcoes.map((o) => encaixar(o.texto, { largura: LARGURA - 130, max: 46, min: 34, linhas: 1, estilo: () => SANS_FORTE }).tamanho)) : 0;
  const larguras = opcoes.map((o) => larguraTexto(o.texto, tOpc, SANS_FORTE) + 52 + 60);
  // quantas linhas de pílulas (empacotamento simples)
  let linhasOpc = opcoes.length ? 1 : 0;
  let usado = 0;
  for (const w of larguras) {
    if (usado && usado + w + 14 > LARGURA) {
      linhasOpc++;
      usado = 0;
    }
    usado += w + 14;
  }
  const alturaOpc = linhasOpc ? linhasOpc * (tOpc * 1.1 + 34) + (linhasOpc - 1) * 14 + 20 : 0;
  const q = encaixarNaCaixa(m.texto, { largura: LARGURA, altura: alturaMax - 100 - alturaOpc, max: 82, min: 48, linhas: 3, estilo: () => TITULO, alturaLinha: 1.08 });
  const tempos = temposDoTexto(m.texto, palavras, inicio - 0.1, fim, inicio);
  return (
    <Cartao base={base} entra={entra} sai={sai}>
      <Tag texto="Pergunta" p={prog(t, m.de + atraso, 0.3)} icone={<span style={{ fontFamily: mono, fontSize: 40, lineHeight: 1, color: cor.acento }}>?</span>} />
      <div style={{ marginTop: 6 }}>
        <Texto q={q} tempos={tempos} t={t} />
      </div>
      {opcoes.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 18 }}>
          {opcoes.map((o, i) => {
            const p = prog(t, o.em - 0.05, 0.3);
            const atual = p > 0.5 && !opcoes.slice(i + 1).some((x) => t >= x.em - 0.05);
            return (
              <div
                key={`${o.texto}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 26px 10px 14px",
                  borderRadius: 50,
                  boxSizing: "border-box",
                  border: p > 0.5 ? `3px solid ${atual ? cor.acento : "rgba(243,244,241,0.6)"}` : `3px dashed ${cor.lapis}`,
                  background: p > 0.5 ? comAlfa(cor.acento, atual ? 0.16 : 0.05) : "transparent",
                  scale: String(1 + 0.03 * Math.max(0, 1 - Math.abs(t - o.em - 0.15) / 0.2)),
                }}
              >
                <span style={{ width: tOpc * 1.1, height: tOpc * 1.1, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 600, fontSize: tOpc * 0.7, background: p > 0.5 ? (atual ? cor.acento : "rgba(243,244,241,0.85)") : "transparent", color: p > 0.5 ? cor.acentoTexto : cor.lapis, border: p > 0.5 ? "none" : `2.5px solid ${cor.lapis}` }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ fontFamily: sans, fontWeight: 600, fontSize: tOpc, color: cor.branco, opacity: p, translate: `0 ${(1 - p) * 10}px` }}>{o.texto}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </Cartao>
  );
};

// =====================================================================================
// Blocos de tela de vidro: o painel do título (ao lado da pessoa) e o corpo (embaixo)
// =====================================================================================

type PropsPainel = { t: number; fim: number; palavras: Palavra[]; titulo: Ret; corpo: Ret };

const nomeDoBloco = { topicos: "Lista", passos: "Passos", comparacao: "Versus", grafico: "Gráfico" } as const;

const PainelTitulo: React.FC<{
  r: Ret;
  t: number;
  de: number;
  fim: number;
  palavras: Palavra[];
  tag: string;
  titulo?: string;
  // contador de itens: instantes em que cada item chega
  chegadas: number[];
  rotuloVazio: string;
  ilustrativo?: boolean;
}> = ({ r, t, de, fim, palavras, tag, titulo, chegadas, rotuloVazio, ilustrativo }) => {
  const entra = prog(t, de, 0.25);
  const feitos = chegadas.filter((c) => t >= c - 0.02).length;
  const ult = chegadas.filter((c) => t >= c - 0.02).pop() ?? de;
  const fmt2 = (n: number) => String(n).padStart(2, "0");
  const total = chegadas.length;
  const contador = (
    <Rolante de={fmt2(Math.max(0, feitos - 1))} para={fmt2(feitos)} p={prog(t, ult, 0.28)} style={{ fontFamily: mono, fontWeight: 600 }} />
  );
  const larg = r.w - 60;
  const q = titulo ? encaixarNaCaixa(titulo, { largura: larg, altura: r.h - 52 - 84 - (ilustrativo ? 56 : 0), max: 68, min: 40, linhas: 5, estilo: () => TITULO, alturaLinha: 1.08 }) : null;
  const tTitulo = titulo ? temposDoTexto(titulo, palavras, de - 0.1, fim, de + 0.15) : [];
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, boxSizing: "border-box", padding: "26px 30px", opacity: entra, overflow: "hidden", ...vidro, background: "rgba(13,15,16,0.88)" }}>
      <Tag texto={tag} p={entra} direita={<span style={{ color: cor.branco }}>{contador}<span style={{ color: cor.apagado }}>/{fmt2(total)}</span></span>} />
      {q ? (
        <div style={{ marginTop: 14 }}>
          <Texto q={q} tempos={tTitulo} t={t} />
        </div>
      ) : (
        <div style={{ marginTop: 18, fontFamily: mono, fontWeight: 600, fontSize: 168, lineHeight: 1, color: feitos ? cor.acento : cor.lapis, letterSpacing: "-0.04em" }}>
          <Rolante de={fmt2(Math.max(0, feitos - 1))} para={fmt2(feitos)} p={prog(t, ult, 0.28)} />
        </div>
      )}
      {!q ? <div style={{ position: "absolute", left: 30, bottom: 28, fontFamily: mono, fontWeight: 600, fontSize: 32, letterSpacing: "0.14em", color: cor.apagado }}>{rotuloVazio.toUpperCase()}</div> : null}
      {ilustrativo ? (
        <div style={{ position: "absolute", left: 30, bottom: 26, fontFamily: mono, fontWeight: 600, fontSize: 30, letterSpacing: "0.1em", color: cor.apagado, border: `2px dashed ${cor.apagado}`, padding: "2px 14px", borderRadius: 20 }}>ILUSTRATIVO</div>
      ) : null}
    </div>
  );
};

// ---- lista e passos ----
const alturaDaLinha = (n: number, h: number) => Math.min(n <= 2 ? 210 : n === 3 ? 176 : 144, (h - 14 * (n - 1)) / n);

export const BItens: React.FC<{ m: Topicos | Passos } & PropsPainel> = ({ m, t, fim, palavras, titulo, corpo }) => {
  const passos = m.tipo === "passos";
  const n = m.itens.length;
  const inner: Ret = { x: corpo.x + 28, y: corpo.y + 28, w: corpo.w - 56, h: corpo.h - 56 };
  const rh = alturaDaLinha(n, inner.h);
  const pilha = n * rh + (n - 1) * 14;
  const y0 = inner.y + (inner.h - pilha) / 2;
  const topo = (i: number) => y0 + i * (rh + 14);
  const entra = prog(t, m.de - 0.05, 0.25);
  const colEsq = passos ? 104 : 96;
  const larg = inner.w - colEsq - 24;
  // corpo único para todos os itens (hierarquia estável)
  const alturaTexto = rh - 26;
  const qs = m.itens.map((it) => encaixarNaCaixa(it.texto, { largura: larg, altura: it.detalhe ? alturaTexto * 0.62 : alturaTexto, max: 62, min: 36, linhas: 2, estilo: () => TITULO, alturaLinha: 1.06 }));
  const tamanho = Math.min(...qs.map((q) => q.tamanho));
  const qDets = m.itens.map((it) => (it.detalhe ? encaixar(it.detalhe, { largura: larg, max: 38, min: 30, linhas: 1, estilo: () => SANS }) : null));
  // posição do quadrado de foco que anda de item em item
  let foco = topo(0);
  let visivel = 0;
  m.itens.forEach((it, i) => {
    const p = prog(t, it.em - 0.04, 0.34, Easing.out(Easing.cubic));
    if (i === 0) {
      foco = topo(0);
      visivel = p;
    } else foco = mistura(foco, topo(i), p);
  });
  const ativo = m.itens.filter((it) => t >= it.em - 0.04).length - 1;
  const ritmo = 0.5 + 0.5 * Math.sin(t * 5);
  return (
    <>
      <PainelTitulo
        r={titulo}
        t={t}
        de={m.de}
        fim={fim}
        palavras={palavras}
        tag={nomeDoBloco[m.tipo]}
        titulo={m.titulo}
        chegadas={m.itens.map((i) => i.em)}
        rotuloVazio={passo(passos)}
      />
      <div style={{ position: "absolute", left: corpo.x, top: corpo.y, width: corpo.w, height: corpo.h, opacity: entra, ...tela }} />
      {m.itens.map((it, i) => {
        const em = it.em;
        const p = prog(t, em - 0.04, 0.3);
        const tTexto = temposDoTexto(it.texto, palavras, em - 0.2, fim, em);
        const fimT = tTexto[tTexto.length - 1] ?? em;
        const tDet = it.detalhe ? temposDoTexto(it.detalhe, palavras, fimT - 0.05, fim, fimT + 0.15) : [];
        const proximo = m.itens[i + 1];
        const x = inner.x;
        const y = topo(i);
        const passoCor = p > 0.5 ? cor.acento : cor.lapis;
        // a lista inteira se acomoda quando o seguinte chega (o anterior apaga um pouco, nunca some)
        const recuo = proximo ? prog(t, proximo.em, 0.4) : 0;
        return (
          <div key={`${it.texto}-${i}`} style={{ position: "absolute", left: x, top: y, width: inner.w, height: rh, opacity: entra }}>
            {/* vaga a lápis: só o contorno, o texto espera ser dito */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, border: p > 0.5 ? "1.5px solid rgba(243,244,241,0.14)" : `2.5px dashed ${cor.lapis}`, background: comAlfa("#F3F4F1", 0.045 * p), boxSizing: "border-box" }} />
            {passos ? (
              <>
                <div style={{ position: "absolute", left: 20, top: rh / 2 - 34, width: 68, height: 68, borderRadius: "50%", boxSizing: "border-box", border: p > 0.5 ? "none" : `3px dashed ${cor.lapis}`, background: p > 0.5 ? cor.acento : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 600, fontSize: 38, color: p > 0.5 ? cor.acentoTexto : cor.lapis, scale: String(1 + 0.12 * Math.max(0, 1 - Math.abs(t - em - 0.1) / 0.2)) }}>
                  {i + 1}
                </div>
                {proximo ? (
                  // trilho até o próximo passo: a lápis, e se completa no acento até a palavra do próximo
                  <svg width={8} height={14 + rh} style={{ position: "absolute", left: 20 + 34 - 4, top: rh / 2 + 34, overflow: "visible" }}>
                    <path d={`M 4 2 V ${rh - 68 + 14 + 66}`} stroke={cor.lapis} strokeWidth={3} strokeDasharray="4 7" fill="none" />
                    <Traco d={`M 4 2 V ${rh - 68 + 14 + 66}`} p={prog(t, em, Math.max(0.4, proximo.em - em - 0.1), Easing.inOut(Easing.cubic))} cor={cor.acento} largura={5} />
                  </svg>
                ) : null}
              </>
            ) : (
              <div style={{ position: "absolute", left: 22, top: 0, height: rh, width: colEsq - 30, display: "flex", alignItems: "center", fontFamily: mono, fontWeight: 600, fontSize: 46, color: passoCor }}>{String(i + 1).padStart(2, "0")}</div>
            )}
            <div style={{ position: "absolute", left: colEsq, top: 0, width: larg, height: rh, display: "flex", flexDirection: "column", justifyContent: "center", opacity: 1 - 0.22 * recuo }}>
              <Texto q={{ ...qs[i], tamanho }} tempos={tTexto} t={t} />
              {qDets[i] ? (
                <div style={{ marginTop: 4 }}>
                  <Texto q={qDets[i]!} tempos={tDet} t={t} peso={500} cor="rgba(243,244,241,0.85)" alturaLinha={1.15} />
                </div>
              ) : null}
            </div>
            {/* luz que varre o item atual: a lista nunca fica parada */}
            {i === ativo ? (
              <div style={{ position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden", pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: 0, bottom: 0, width: 120, left: `${((t * 0.55) % 1.6) * 100 - 20}%`, background: "linear-gradient(90deg, transparent, rgba(62,224,207,0.10), transparent)" }} />
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o quadrado de foco que anda até o item atual (só na lista; nos passos, o trilho faz isso) */}
      {!passos && visivel > 0 ? (
        <div style={{ position: "absolute", left: inner.x, top: foco, width: inner.w, height: rh, opacity: visivel }}>
          <Travas w={inner.w} h={rh} folga={-2 + ritmo * 3} corTraco={cor.acento} espessura={4.5} braco={34} />
        </div>
      ) : null}
    </>
  );
};

const passo = (passos: boolean) => (passos ? "passo" : "item");

// ---- comparação: dois quadros de vidro lado a lado ----
export const BComparacao: React.FC<{ m: Comparacao } & PropsPainel> = ({ m, t, fim, palavras, titulo, corpo }) => {
  const modo = m.modo ?? "contra";
  const entra = prog(t, m.de - 0.05, 0.25);
  const inner: Ret = { x: corpo.x + 28, y: corpo.y + 28, w: corpo.w - 56, h: corpo.h - 56 };
  const gap = 48;
  const cw = (inner.w - gap) / 2;
  const vEm = m.vencedor !== undefined ? m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.9 : undefined;
  const vence = vEm !== undefined ? prog(t, vEm, 0.4, assenta) : 0;
  const textos = m.lados.map((l) => l.texto);
  const alturaTexto = inner.h - 24 - 62 - 30;
  const qs = textos.map((tx) => encaixarNaCaixa(tx, { largura: cw - 78, altura: alturaTexto, max: 84, min: 36, linhas: 6, estilo: () => SANS_FORTE, alturaLinha: 1.12 }));
  const tamanho = Math.min(...qs.map((q) => q.tamanho));
  const qsF = textos.map((tx) => encaixar(tx, { largura: cw - 78, max: tamanho, min: tamanho, linhas: 8, estilo: () => SANS_FORTE }));
  const cores = (i: number) => {
    if (modo === "errado-certo") return i === 0 ? cor.alerta : cor.acento;
    return cor.acento;
  };
  const iconeDe = (i: number) => (modo === "errado-certo" ? (i === 0 ? "xis" : "check") : null);
  return (
    <>
      <PainelTitulo r={titulo} t={t} de={m.de} fim={fim} palavras={palavras} tag={nomeDoBloco.comparacao} titulo={m.titulo} chegadas={m.lados.map((l) => l.em)} rotuloVazio="lados" />
      <div style={{ position: "absolute", left: corpo.x, top: corpo.y, width: corpo.w, height: corpo.h, opacity: entra, ...tela }} />
      {m.lados.map((l, i) => {
        const p = prog(t, l.em - 0.05, 0.35);
        const ganha = m.vencedor === i ? vence : 0;
        const perde = m.vencedor !== undefined && m.vencedor !== i ? vence : 0;
        const tTexto = temposDoTexto(l.texto, palavras, l.em - 0.2, fim, l.em);
        const x = inner.x + i * (cw + gap);
        const corLado = cores(i);
        const ic = iconeDe(i);
        const destacado = modo === "errado-certo" ? p > 0.5 : ganha > 0.5;
        const apagado = modo === "antes-depois" && i === 0 ? 0.88 : 1;
        return (
          <div
            key={`${l.rotulo}-${i}`}
            style={{
              position: "absolute",
              left: x,
              top: inner.y,
              width: cw,
              height: inner.h,
              boxSizing: "border-box",
              padding: "24px 28px",
              borderRadius: 20,
              border: p > 0.5 ? `${destacado ? 4 : 2}px solid ${destacado ? corLado : "rgba(243,244,241,0.38)"}` : `3px dashed ${cor.lapis}`,
              background: p > 0.5 ? comAlfa(destacado ? corLado : "#F3F4F1", destacado ? 0.08 : 0.04) : "transparent",
              opacity: (1 - 0.32 * perde) * apagado,
              scale: String(1 + 0.018 * ganha),
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: mono, fontWeight: 600, letterSpacing: "0.14em", fontSize: 32, color: p > 0.5 ? (modo === "errado-certo" || ganha > 0.5 ? corLado : cor.branco) : cor.lapis, height: 40 }}>
              {ic ? <Icone nome={ic} tamanho={36} cor={corLado} espessura={5} p={p} /> : null}
              <span>{l.rotulo.toUpperCase()}</span>
              {ganha > 0.5 ? <Icone nome="check" tamanho={36} cor={cor.acento} espessura={5} p={ganha} style={{ marginLeft: "auto" }} /> : null}
            </div>
            <div style={{ position: "absolute", left: i === 1 ? 50 : 28, right: i === 0 ? 50 : 28, top: 86, bottom: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Texto q={qsF[i]} tempos={tTexto} t={t} peso={600} alturaLinha={1.12} />
            </div>
            {p > 0.5 ? (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: 90, top: `${((t * 0.6 + i * 0.4) % 1.5) * 100 - 20}%`, background: `linear-gradient(180deg, transparent, ${comAlfa(corLado, 0.1)}, transparent)` }} />
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o selo do meio: VS, ou a seta do antes para o depois */}
      <div
        style={{
          position: "absolute",
          left: inner.x + cw + gap / 2 - 44,
          top: inner.y + inner.h / 2 - 44,
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: cor.corpo,
          border: `3px solid ${cor.branco}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontWeight: 600,
          fontSize: 38,
          color: cor.branco,
          opacity: prog(t, Math.min(m.lados[0].em, m.lados[1].em) - 0.1, 0.3),
        }}
      >
        {modo === "contra" ? (
          "VS"
        ) : (
          <svg width={46} height={46} viewBox="0 0 48 48">
            <Traco d="M8 24 H38" cor={cor.branco} largura={4.5} p={prog(t, m.lados[0].em, 0.5)} />
            <Traco d="M28 14 L38 24 L28 34" cor={cor.branco} largura={4.5} p={prog(t, m.lados[0].em + 0.25, 0.4)} />
          </svg>
        )}
      </div>
    </>
  );
};

// ---- gráfico: histograma da câmera (barras), linha de exposição, pizza, ou só a tendência ----
const PALETA_PIZZA = ["#3EE0CF", "#F3F4F1", "#FF6B57", "#8E9A97", "#6FB7B0", "#D9D5CC"];

const curvaDaTendencia = (tipo: "sobe" | "cai" | "oscila", n = 48): number[] =>
  Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const onda = 0.045 * Math.sin(u * 17) + 0.025 * Math.sin(u * 31 + 1);
    if (tipo === "sobe") return limitar(0.86 - 0.7 * Math.pow(u, 1.25) + onda, 0.05, 0.95);
    if (tipo === "cai") return limitar(0.16 + 0.7 * Math.pow(u, 1.25) + onda, 0.05, 0.95);
    return limitar(0.5 - 0.3 * Math.sin(u * Math.PI * 2.4) + onda, 0.05, 0.95);
  });

export const BGrafico: React.FC<{ m: Grafico } & PropsPainel> = ({ m, t, fim, palavras, titulo, corpo }) => {
  const entra = prog(t, m.de - 0.05, 0.25);
  const dados = m.dados ?? [];
  const inner: Ret = { x: corpo.x + 36, y: corpo.y + 36, w: corpo.w - 72, h: corpo.h - 72 };
  const unidade = m.unidade ?? "";
  const ilustrativo = !dados.length || m.ilustrativo;
  const chegadas = dados.length ? dados.map((d) => d.em) : [m.tendenciaEm ?? m.de + 0.4];
  const valorTxt = (v: number) => `${fmtNum(v, Math.max(...dados.map((d) => casasDe(d.valor))))}${unidade ? (/[a-zA-Z]/.test(unidade) ? ` ${unidade}` : unidade) : ""}`;
  const max = Math.max(...dados.map((d) => d.valor), 0.0001);
  // grade dos terços ao fundo: a lente do Visor medindo o gráfico
  const grade = (
    <svg width={corpo.w} height={corpo.h} style={{ position: "absolute", left: corpo.x, top: corpo.y, opacity: entra * 0.5 }}>
      {[1, 2].map((k) => (
        <g key={k}>
          <line x1={(corpo.w * k) / 3} x2={(corpo.w * k) / 3} y1={0} y2={corpo.h} stroke="rgba(243,244,241,0.12)" strokeWidth={2} />
          <line x1={0} x2={corpo.w} y1={(corpo.h * k) / 3} y2={(corpo.h * k) / 3} stroke="rgba(243,244,241,0.12)" strokeWidth={2} />
        </g>
      ))}
    </svg>
  );

  let conteudo: React.ReactNode = null;
  if (dados.length && m.forma === "barras") {
    const n = dados.length;
    const gapB = n > 4 ? 14 : 28;
    const slot = (inner.w - gapB * (n - 1)) / n;
    const larguraBarra = Math.min(170, slot * 0.78);
    const rotuloH = 74;
    const topoBarras = inner.y + 54;
    const baseY = inner.y + inner.h - rotuloH;
    const altura = baseY - topoBarras;
    const tamanhoRotulo = Math.min(...dados.map((d) => encaixar(d.rotulo, { largura: slot, max: 34, min: 26, linhas: 2, estilo: () => SANS_FORTE }).tamanho));
    conteudo = (
      <>
        <svg width={inner.w} height={4} style={{ position: "absolute", left: inner.x, top: baseY }}>
          <line x1={0} x2={inner.w} y1={2} y2={2} stroke="rgba(243,244,241,0.5)" strokeWidth={3} />
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.85, assenta);
          const x = inner.x + i * (slot + gapB) + (slot - larguraBarra) / 2;
          const h = Math.max(6, (d.valor / max) * altura) * p;
          const tRot = temposDoTexto(d.rotulo, palavras, d.em - 0.3, fim, d.em);
          const q = encaixar(d.rotulo, { largura: slot, max: tamanhoRotulo, min: Math.min(26, tamanhoRotulo), linhas: 2, estilo: () => SANS_FORTE });
          const maior = d.valor === max;
          return (
            <div key={`${d.rotulo}-${i}`}>
              {p < 0.05 ? <div style={{ position: "absolute", left: x, top: baseY - 12, width: larguraBarra, height: 12, border: `2.5px dashed ${cor.lapis}`, boxSizing: "border-box" }} /> : null}
              <div style={{ position: "absolute", left: x, top: baseY - h, width: larguraBarra, height: h, borderRadius: "10px 10px 0 0", background: maior ? cor.acento : "rgba(243,244,241,0.88)" }} />
              <div style={{ position: "absolute", left: x - 30, width: larguraBarra + 60, top: baseY - h - 50, textAlign: "center", fontFamily: mono, fontWeight: 600, fontSize: 38, color: maior ? cor.acento : cor.branco, opacity: p > 0.1 ? 1 : 0, whiteSpace: "nowrap" }}>
                {valorTxt(d.valor * p)}
              </div>
              <div style={{ position: "absolute", left: inner.x + i * (slot + gapB), width: slot, top: baseY + 10 }}>
                <Texto q={q} tempos={tRot} t={t} peso={600} alinhar="center" alturaLinha={1.05} />
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length && m.forma === "linha") {
    const n = dados.length;
    const min = Math.min(...dados.map((d) => d.valor));
    const mx = Math.max(...dados.map((d) => d.valor));
    const faixa = mx - min || Math.max(Math.abs(mx), 1);
    const lo = min - faixa * 0.3;
    const hi = mx + faixa * 0.18;
    const px = (i: number) => inner.x + 60 + (i * (inner.w - 120)) / Math.max(1, n - 1);
    const topoL = inner.y + 60;
    const baseL = inner.y + inner.h - 70;
    const py = (v: number) => baseL - ((v - lo) / (hi - lo)) * (baseL - topoL);
    conteudo = (
      <>
        <svg width={corpo.w} height={corpo.h} style={{ position: "absolute", left: corpo.x, top: corpo.y, overflow: "visible" }}>
          <g transform={`translate(${-corpo.x} ${-corpo.y})`}>
            {dados.slice(1).map((d, i) => {
              const a = dados[i];
              const p = prog(t, a.em + 0.05, Math.max(0.35, d.em - a.em - 0.05), Easing.inOut(Easing.cubic));
              return <Traco key={i} d={`M ${px(i)} ${py(a.valor)} L ${px(i + 1)} ${py(d.valor)}`} p={p} cor={cor.acento} largura={7} />;
            })}
            {dados.map((d, i) => {
              const p = prog(t, d.em - 0.05, 0.35, assenta);
              return <circle key={i} cx={px(i)} cy={py(d.valor)} r={6 + 8 * p} fill={p > 0.2 ? cor.acento : "none"} stroke={cor.lapis} strokeWidth={2} opacity={0.4 + 0.6 * p} />;
            })}
          </g>
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.35, assenta);
          const tRot = temposDoTexto(d.rotulo, palavras, d.em - 0.3, fim, d.em);
          const slot = (inner.w - 120) / Math.max(1, n - 1);
          const larg = Math.min(220, Math.max(120, slot));
          const q = encaixar(d.rotulo, { largura: larg, max: 32, min: 26, linhas: 2, estilo: () => SANS_FORTE });
          return (
            <div key={`${d.rotulo}-${i}`}>
              <div style={{ position: "absolute", left: px(i) - 110, width: 220, top: py(d.valor) - 62, textAlign: "center", fontFamily: mono, fontWeight: 600, fontSize: 36, color: cor.branco, opacity: p, whiteSpace: "nowrap" }}>{valorTxt(d.valor)}</div>
              <div style={{ position: "absolute", left: px(i) - larg / 2, width: larg, top: baseL + 20 }}>
                <Texto q={q} tempos={tRot} t={t} peso={600} alinhar="center" alturaLinha={1.05} />
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (dados.length && m.forma === "pizza") {
    const soma = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const R = Math.min(inner.h / 2 - 10, 230);
    const cx = inner.x + R + 10;
    const cy = inner.y + inner.h / 2;
    let acc = 0;
    const fatias = dados.map((d) => {
      const de = acc / soma;
      acc += d.valor;
      return { de, ate: acc / soma };
    });
    const pol = (u: number, r: number) => [cx + r * Math.sin(u * 2 * Math.PI), cy - r * Math.cos(u * 2 * Math.PI)];
    const xLeg = cx + R + 50;
    const largLeg = inner.x + inner.w - xLeg;
    const lh = Math.min(96, inner.h / dados.length);
    conteudo = (
      <>
        <svg width={corpo.w} height={corpo.h} style={{ position: "absolute", left: corpo.x, top: corpo.y, overflow: "visible" }}>
          <g transform={`translate(${-corpo.x} ${-corpo.y})`}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="5 9" />
            {dados.map((d, i) => {
              const p = prog(t, d.em - 0.05, 0.7, assenta);
              if (p <= 0.003) return null;
              const u1 = fatias[i].de + (fatias[i].ate - fatias[i].de) * p;
              const [x0, y0] = pol(fatias[i].de, R);
              const [x1, y1] = pol(u1, R);
              const grande = (u1 - fatias[i].de) * 2 * Math.PI > Math.PI ? 1 : 0;
              return <path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 ${grande} 1 ${x1} ${y1} Z`} fill={PALETA_PIZZA[i % PALETA_PIZZA.length]} stroke={cor.corpo} strokeWidth={4} />;
            })}
          </g>
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.35, assenta);
          const tRot = temposDoTexto(d.rotulo, palavras, d.em - 0.3, fim, d.em);
          const q = encaixar(d.rotulo, { largura: largLeg - 190, max: 40, min: 28, linhas: 2, estilo: () => SANS_FORTE });
          const pct = (d.valor / soma) * 100;
          return (
            <div key={`${d.rotulo}-${i}`} style={{ position: "absolute", left: xLeg, top: inner.y + (inner.h - lh * dados.length) / 2 + i * lh, width: largLeg, height: lh, display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: p > 0.3 ? PALETA_PIZZA[i % PALETA_PIZZA.length] : "transparent", border: p > 0.3 ? "none" : `2.5px dashed ${cor.lapis}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Texto q={q} tempos={tRot} t={t} peso={600} alturaLinha={1.05} />
              </div>
              <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 38, color: cor.branco, opacity: p, whiteSpace: "nowrap" }}>{m.unidade === "%" || Math.abs(soma - 100) < 0.5 ? valorTxt(d.valor) : `${fmtNum(pct, 0)}%`}</span>
            </div>
          );
        })}
      </>
    );
  } else {
    // sem números ditos: só a forma da tendência, com a etiqueta "ilustrativo"
    const tend = m.tendencia ?? "sobe";
    const pts = curvaDaTendencia(tend);
    const x0 = inner.x + 30;
    const x1 = inner.x + inner.w - 30;
    const y0 = inner.y + 70;
    const y1 = inner.y + inner.h - 40;
    const caminho = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${x0 + ((x1 - x0) * i) / (pts.length - 1)} ${y0 + (y1 - y0) * v}`).join(" ");
    const inicio = m.tendenciaEm ?? m.de + 0.4;
    const p = prog(t, inicio, 1.9, Easing.inOut(Easing.cubic));
    const idx = Math.min(pts.length - 1, Math.round(p * (pts.length - 1)));
    const hx = x0 + ((x1 - x0) * idx) / (pts.length - 1);
    const hy = y0 + (y1 - y0) * pts[idx];
    const cabeca = tend === "cai" ? cor.alerta : cor.acento;
    conteudo = (
      <>
        <svg width={corpo.w} height={corpo.h} style={{ position: "absolute", left: corpo.x, top: corpo.y, overflow: "visible" }}>
          <g transform={`translate(${-corpo.x} ${-corpo.y})`}>
            <path d={caminho} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="5 10" />
            <Traco d={caminho} p={p} cor={cabeca} largura={9} />
            {p > 0.01 ? (
              <>
                <circle cx={hx} cy={hy} r={20 + 6 * Math.sin(t * 8)} fill="none" stroke={cabeca} strokeWidth={3} opacity={0.6} />
                <circle cx={hx} cy={hy} r={11} fill={cabeca} />
              </>
            ) : null}
          </g>
        </svg>
      </>
    );
  }

  return (
    <>
      <PainelTitulo r={titulo} t={t} de={m.de} fim={fim} palavras={palavras} tag={nomeDoBloco.grafico} titulo={m.titulo} chegadas={chegadas} rotuloVazio="dados" ilustrativo={ilustrativo} />
      <div style={{ position: "absolute", left: corpo.x, top: corpo.y, width: corpo.w, height: corpo.h, opacity: entra, ...tela }} />
      {grade}
      <div style={{ opacity: entra }}>{conteudo}</div>
    </>
  );
};
