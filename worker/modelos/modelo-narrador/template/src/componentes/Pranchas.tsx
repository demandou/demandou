// As pranchas do Narrador: os blocos que ocupam a tela inteira, como as placas de um documentário.
// Fundo: a imagem do bloco escurecida e andando devagar, ou a cena que já está na tela sob um véu
// escuro, ou a noite lisa. Por cima, uma coluna alinhada à esquerda: o título pequeno em versalete
// com o traço vermelhão, e o conteúdo em serifa marfim, cada parte entrando quando é dita.
// numero · topicos · passos · comparacao · grafico · definicao
import type React from "react";
import { encaixar, larguraTexto } from "../medida";
import type { Comparacao as TComparacao, Definicao as TDefinicao, Grafico as TGrafico, Item, Momento, Numero as TNumero, Passos as TPassos, Plano, Topicos as TTopicos } from "../plano";
import { COR, FONTE, MARGEM, SERIFA, formatar, prog, suave } from "../tema";
import { coberturaNoTempo, FundoDaPrancha } from "./Cena";

const LARGURA = 1080 - MARGEM * 2;
// faixa vertical útil (abaixo da interface de cima, acima da de baixo)
const TOPO = 330;
const BASE = 1440;

type ComImagem = Momento & { imagem?: { id: string } };

// O quadro comum: fundo + conteúdo. O conteúdo sai antes do fundo (nunca fica texto fantasma).
const Quadro: React.FC<{ plano: Plano; m: ComImagem; t: number; children: React.ReactNode }> = ({ plano, m, t, children }) => {
  const sobreCena = plano.momentos.some((x) => x.tipo === "cena" && x.de <= m.de + 0.05 && x.ate >= m.ate - 0.05);
  const temImagem = !!m.imagem;
  const c = temImagem ? coberturaNoTempo(plano, m, t) : null;
  const fundo = c ? c.opacidade : Math.min(prog(t, m.de, 0.3, suave), 1 - prog(t, m.ate - 0.25, 0.25, suave));
  const fim = c ? c.fim : m.ate;
  if (t < m.de - 0.1 || t >= fim) return null;
  const conteudo = Math.min(prog(t, m.de + 0.05, 0.3, suave), 1 - prog(t, m.ate - 0.32, 0.2, suave));
  return (
    <>
      <FundoDaPrancha plano={plano} m={m} t={t} sobreCena={sobreCena} opacidade={fundo} fim={fim} />
      {conteudo > 0 ? <div style={{ position: "absolute", inset: 0, opacity: conteudo }}>{children}</div> : null}
    </>
  );
};

// título pequeno: traço vermelhão + versalete marfim
const Titulo: React.FC<{ texto?: string; y: number; t: number; em: number }> = ({ texto, y, t, em }) => {
  if (!texto?.trim()) return null;
  const e = prog(t, em, 0.45);
  const fit = encaixar(texto.toUpperCase(), { largura: LARGURA - 70, max: 30, min: 22, linhas: 1, fonte: { peso: 700, espacamento: 0.16 } });
  return (
    <div style={{ position: "absolute", left: MARGEM, top: y, height: 40, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 46 * e, height: 3, background: COR.vermelhao }} />
      <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: fit.tamanho, letterSpacing: "0.16em", textTransform: "uppercase", color: COR.marfim, whiteSpace: "nowrap", opacity: e }}>
        {texto}
      </div>
    </div>
  );
};

const Etiqueta: React.FC<{ texto: string; x: number; y: number; opacidade: number }> = ({ texto, x, y, opacidade }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      padding: "6px 14px",
      border: `1.5px solid ${COR.linha}`,
      borderRadius: 6,
      fontFamily: FONTE,
      fontWeight: 700,
      fontSize: 22,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: COR.apagado,
      opacity: opacidade,
    }}
  >
    ilustrativo
  </div>
);

// palavra/linha que sobe de trás de uma máscara; pronta, vira texto simples
const Linha: React.FC<{ e: number; style: React.CSSProperties; altura: number; children: React.ReactNode }> = ({ e, style, altura, children }) => {
  if (e <= 0) return null;
  const pronta = e >= 1;
  return (
    <div style={{ position: "absolute", ...style, height: altura + 20, overflow: pronta ? "visible" : "hidden" }}>
      <div style={{ transform: pronta ? undefined : `translateY(${(1 - e) * altura}px)`, opacity: pronta ? 1 : 0.4 + 0.6 * e }}>{children}</div>
    </div>
  );
};

const serifaLinhas = (texto: string, largura: number, max: number, min: number, linhas = 2, peso: 500 | 600 | 700 = 600) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { serifa: true, peso } });

// ——— numero ———
export const Numero: React.FC<{ plano: Plano; m: TNumero; t: number }> = ({ plano, m, t }) => {
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const final = formatar(m.valor, casas);
  const pre = m.prefixo?.trim() ?? "";
  const suf = m.sufixo?.trim() ?? "";
  // o número grande e, ao lado, prefixo/sufixo menores em itálico
  let S = 300;
  const medir = (s: number) =>
    larguraTexto(final, s, { serifa: true, peso: 700, exato: true }) +
    (pre ? larguraTexto(pre, s * 0.34, { serifa: true, italico: true, exato: true }) + s * 0.08 : 0) +
    (suf ? larguraTexto(suf, s * 0.34, { serifa: true, italico: true, exato: true }) + s * 0.08 : 0);
  while (S > 110 && medir(S) > LARGURA) S -= 6;
  const rotulo = encaixar(m.rotulo, { largura: LARGURA, max: 46, min: 32, linhas: 2, fonte: { peso: 600 } });
  const rlh = Math.round(rotulo.tamanho * 1.25);
  const temTitulo = !!m.titulo?.trim();
  const altura = (temTitulo ? 80 : 0) + S * 1.02 + 40 + rlh * rotulo.linhas.length;
  const y0 = Math.max(TOPO + 60, (TOPO + BASE) / 2 - altura / 2 - 40);
  const yNum = y0 + (temTitulo ? 80 : 0);
  const pc = prog(t, m.em - 0.05, 1.1, suave);
  const atual = m.valor * pc;
  const e = prog(t, m.em - 0.1, 0.35);
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;
  const er = prog(t, rotuloEm, 0.45);
  const yRot = yNum + S * 1.02 + 40;
  return (
    <Quadro plano={plano} m={m} t={t}>
      <Titulo texto={m.titulo} y={y0} t={t} em={m.de + 0.1} />
      {e > 0 ? (
        <div style={{ position: "absolute", left: MARGEM, top: yNum, height: S * 1.02, display: "flex", alignItems: "baseline", gap: S * 0.08, opacity: e, color: COR.marfim, whiteSpace: "nowrap" }}>
          {pre ? <span style={{ fontFamily: SERIFA, fontStyle: "italic", fontWeight: 500, fontSize: S * 0.34 }}>{pre}</span> : null}
          <span style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: S, lineHeight: `${S * 1.02}px`, fontVariantNumeric: "tabular-nums" }}>{formatar(atual, casas)}</span>
          {suf ? <span style={{ fontFamily: SERIFA, fontStyle: "italic", fontWeight: 500, fontSize: S * 0.34, color: COR.vermelhao }}>{suf}</span> : null}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: MARGEM, top: yRot - 20, width: LARGURA * prog(t, rotuloEm - 0.1, 0.7, suave), height: 2, background: COR.linha }} />
      {rotulo.linhas.map((l, i) => (
        <Linha key={i} e={prog(t, rotuloEm + i * 0.1, 0.45)} altura={rlh} style={{ left: MARGEM, top: yRot + i * rlh }}>
          <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: rotulo.tamanho, lineHeight: `${rlh}px`, color: COR.marfim, whiteSpace: "nowrap" }}>{l}</div>
        </Linha>
      ))}
      {m.ilustrativo ? <Etiqueta texto="ilustrativo" x={MARGEM} y={yRot + rlh * rotulo.linhas.length + 24} opacidade={er} /> : null}
    </Quadro>
  );
};

// ——— topicos e passos ———
type Disp = { y: number; linhas: string[]; tam: number; lh: number; detalhe?: string; altura: number };
const disporItens = (itens: Item[], largura: number) => {
  const n = itens.length;
  const max = n <= 2 ? 68 : n === 3 ? 62 : n === 4 ? 54 : 48;
  const tamDet = n <= 3 ? 34 : 30;
  const gap = n <= 3 ? 52 : 40;
  const lista: Disp[] = [];
  let y = 0;
  for (const it of itens) {
    const f = serifaLinhas(it.texto, largura, max, Math.round(max * 0.66), 2);
    const lh = Math.round(f.tamanho * 1.14);
    const altura = lh * f.linhas.length + (it.detalhe?.trim() ? Math.round(tamDet * 1.35) + 6 : 0);
    lista.push({ y, linhas: f.linhas, tam: f.tamanho, lh, detalhe: it.detalhe, altura });
    y += altura + gap;
  }
  return { lista, total: y - gap, tamDet, gap };
};

const Lista: React.FC<{ plano: Plano; m: TTopicos | TPassos; t: number; numerada: boolean }> = ({ plano, m, t, numerada }) => {
  const recuo = numerada ? 96 : 64;
  const { lista, total, tamDet, gap } = disporItens(m.itens, LARGURA - recuo);
  const temTitulo = !!m.titulo?.trim();
  const altura = total + (temTitulo ? 90 : 0);
  const y0 = Math.max(TOPO + 40, (TOPO + BASE) / 2 - altura / 2 - 30);
  const yItens = y0 + (temTitulo ? 90 : 0);
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  // o fio dos passos desce até o item atual
  const fioAte = (() => {
    if (atual < 0) return 0;
    const alvo = lista[atual];
    const anterior = atual > 0 ? lista[atual - 1] : null;
    const p = prog(t, m.itens[atual].em - 0.05, 0.5, suave);
    const de = anterior ? anterior.y + anterior.lh / 2 : 0;
    return de + (alvo.y + alvo.lh / 2 - de) * p;
  })();
  return (
    <Quadro plano={plano} m={m} t={t}>
      <Titulo texto={m.titulo} y={y0} t={t} em={m.de + 0.1} />
      {numerada && atual >= 0 ? (
        <div style={{ position: "absolute", left: MARGEM + 22, top: yItens + lista[0].lh / 2, width: 2, height: fioAte - lista[0].lh / 2 + 1, background: COR.vermelhao, opacity: 0.85 }} />
      ) : null}
      {m.itens.map((it, i) => {
        const d = lista[i];
        const e = prog(t, it.em - 0.05, 0.5);
        if (e <= 0) return null;
        const ativo = i === atual;
        const opac = ativo ? 1 : 0.58;
        const y = yItens + d.y;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: e >= 1 ? opac : e * opac + (1 - e) * 0 }}>
            {i > 0 ? (
              <div style={{ position: "absolute", left: MARGEM + recuo, top: y - gap / 2, width: (LARGURA - recuo) * prog(t, it.em - 0.1, 0.6, suave), height: 1.5, background: COR.linha }} />
            ) : null}
            {numerada ? (
              <div
                style={{
                  position: "absolute",
                  left: MARGEM,
                  top: y + d.lh / 2 - 30,
                  width: 46,
                  height: 60,
                  lineHeight: "60px",
                  textAlign: "center",
                  background: COR.noite,
                  fontFamily: SERIFA,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 52,
                  color: ativo ? COR.vermelhao : COR.marfim,
                }}
              >
                {i + 1}
              </div>
            ) : (
              <div style={{ position: "absolute", left: MARGEM + 6, top: y + d.lh / 2 - 8, width: 16, height: 16, transform: "rotate(45deg)", background: ativo ? COR.vermelhao : COR.marfim }} />
            )}
            {d.linhas.map((l, k) => (
              <Linha key={k} e={prog(t, it.em - 0.05 + k * 0.08, 0.5)} altura={d.lh} style={{ left: MARGEM + recuo, top: y + k * d.lh }}>
                <div style={{ fontFamily: SERIFA, fontWeight: 600, fontSize: d.tam, lineHeight: `${d.lh}px`, color: COR.marfim, whiteSpace: "nowrap" }}>{l}</div>
              </Linha>
            ))}
            {d.detalhe?.trim() ? (
              <div
                style={{
                  position: "absolute",
                  left: MARGEM + recuo,
                  top: y + d.lh * d.linhas.length + 6,
                  width: LARGURA - recuo,
                  fontFamily: FONTE,
                  fontWeight: 500,
                  fontSize: tamDet,
                  lineHeight: `${Math.round(tamDet * 1.35)}px`,
                  color: COR.apagado,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "clip",
                  opacity: prog(t, it.em + 0.25, 0.4),
                }}
              >
                {d.detalhe}
              </div>
            ) : null}
          </div>
        );
      })}
    </Quadro>
  );
};

export const Topicos: React.FC<{ plano: Plano; m: TTopicos; t: number }> = ({ plano, m, t }) => <Lista plano={plano} m={m} t={t} numerada={false} />;
export const Passos: React.FC<{ plano: Plano; m: TPassos; t: number }> = ({ plano, m, t }) => <Lista plano={plano} m={m} t={t} numerada />;

// ——— comparacao ———
export const Comparacao: React.FC<{ plano: Plano; m: TComparacao; t: number }> = ({ plano, m, t }) => {
  const modo = m.modo ?? "contra";
  const lados = m.lados.map((l) => {
    const f = serifaLinhas(l.texto, LARGURA, 72, 44, 3);
    return { ...l, f, lh: Math.round(f.tamanho * 1.14) };
  });
  const rotTam = 28;
  const blocoA = rotTam * 1.4 + 14 + lados[0].lh * lados[0].f.linhas.length;
  const blocoB = rotTam * 1.4 + 14 + lados[1].lh * lados[1].f.linhas.length;
  const meio = 140;
  const temTitulo = !!m.titulo?.trim();
  const altura = (temTitulo ? 90 : 0) + blocoA + meio + blocoB;
  const y0 = Math.max(TOPO + 30, (TOPO + BASE) / 2 - altura / 2 - 30);
  const yA = y0 + (temTitulo ? 90 : 0);
  const yB = yA + blocoA + meio;
  const yMeio = yA + blocoA + meio / 2;
  const venceu = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? Math.max(...m.lados.map((l) => l.em)) + 0.6, 0.45, suave) : 0;
  const sinal = modo === "antes-depois" ? "→" : modo === "contra" ? "×" : "";
  const segundo = prog(t, m.lados[1].em - 0.1, 0.5, suave);
  const lado = (i: 0 | 1, y: number) => {
    const l = lados[i];
    const e = prog(t, l.em - 0.05, 0.5);
    const vencedor = m.vencedor === i;
    const perdedor = m.vencedor !== undefined && !vencedor;
    const opac = perdedor ? 1 - 0.45 * venceu : 1;
    const riscar = perdedor && modo === "errado-certo" ? venceu : 0;
    return (
      <div key={i} style={{ position: "absolute", inset: 0, opacity: opac }}>
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            top: y,
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: rotTam,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: vencedor && venceu > 0.5 ? COR.vermelhao : COR.apagado,
            opacity: e,
            whiteSpace: "nowrap",
          }}
        >
          {l.rotulo}
        </div>
        {l.f.linhas.map((txt, k) => {
          const yl = y + rotTam * 1.4 + 14 + k * l.lh;
          const w = larguraTexto(txt, l.f.tamanho, { serifa: true, peso: 600, exato: true });
          return (
            <div key={k}>
              <Linha e={prog(t, l.em - 0.05 + k * 0.08, 0.5)} altura={l.lh} style={{ left: MARGEM, top: yl }}>
                <div style={{ fontFamily: SERIFA, fontWeight: 600, fontSize: l.f.tamanho, lineHeight: `${l.lh}px`, color: COR.marfim, whiteSpace: "nowrap" }}>{txt}</div>
              </Linha>
              {vencedor ? <div style={{ position: "absolute", left: MARGEM, top: yl + l.lh - 6, width: w * venceu, height: 4, background: COR.vermelhao }} /> : null}
              {riscar > 0 ? <div style={{ position: "absolute", left: MARGEM - 4, top: yl + l.lh * 0.55, width: (w + 8) * riscar, height: 4, background: COR.vermelhao }} /> : null}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <Quadro plano={plano} m={m} t={t}>
      <Titulo texto={m.titulo} y={y0} t={t} em={m.de + 0.1} />
      {lado(0, yA)}
      <div style={{ position: "absolute", left: MARGEM, top: yMeio, width: LARGURA * segundo, height: 1.5, background: COR.linha }} />
      {sinal ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 34,
            top: yMeio - 34,
            width: 68,
            height: 68,
            borderRadius: 34,
            background: COR.noite,
            border: `1.5px solid ${COR.linha}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIFA,
            fontSize: 40,
            color: COR.vermelhao,
            opacity: segundo,
          }}
        >
          {sinal}
        </div>
      ) : null}
      {lado(1, yB)}
    </Quadro>
  );
};

// ——— grafico ———
export const Grafico: React.FC<{ plano: Plano; m: TGrafico; t: number }> = ({ plano, m, t }) => {
  const temTitulo = !!m.titulo?.trim();
  const y0 = 420;
  const yG = y0 + (temTitulo ? 100 : 0);
  const dados = m.dados ?? [];
  const unidade = m.unidade?.trim() ? ` ${m.unidade.trim()}` : "";
  const maior = Math.max(1, ...dados.map((d) => Math.abs(d.valor)));
  const casas = dados.some((d) => !Number.isInteger(d.valor)) ? 1 : 0;
  let corpo: React.ReactNode = null;

  if (dados.length && m.forma === "barras") {
    const passo = Math.min(150, 860 / dados.length);
    corpo = dados.map((d, i) => {
      const e = prog(t, d.em - 0.05, 0.4);
      const p = prog(t, d.em - 0.05, 0.9, suave);
      const y = yG + i * passo;
      const destaque = Math.abs(d.valor) === maior;
      const rot = encaixar(d.rotulo, { largura: LARGURA - 260, max: 36, min: 24, linhas: 1, fonte: { peso: 600 } });
      return (
        <div key={i} style={{ position: "absolute", inset: 0, opacity: e }}>
          <div style={{ position: "absolute", left: MARGEM, top: y, fontFamily: FONTE, fontWeight: 600, fontSize: rot.tamanho, color: COR.marfim, whiteSpace: "nowrap" }}>{d.rotulo}</div>
          <div style={{ position: "absolute", right: MARGEM, top: y - 10, fontFamily: SERIFA, fontWeight: 700, fontSize: 50, color: destaque ? COR.vermelhao : COR.marfim, whiteSpace: "nowrap" }}>
            {formatar(d.valor * p, casas)}
            {unidade}
          </div>
          <div style={{ position: "absolute", left: MARGEM, top: y + 58, width: LARGURA, height: 14, background: "rgba(242,236,225,0.12)" }} />
          <div style={{ position: "absolute", left: MARGEM, top: y + 58, width: (LARGURA * Math.abs(d.valor) * p) / maior, height: 14, background: destaque ? COR.vermelhao : COR.marfim }} />
        </div>
      );
    });
  } else if (dados.length && m.forma === "pizza") {
    const soma = dados.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
    const R = 230;
    const cx = 540;
    const cy = yG + R + 10;
    const circ = 2 * Math.PI * R;
    let acumulado = 0;
    const tons = [COR.vermelhao, COR.marfim, "rgba(242,236,225,0.6)", "rgba(242,236,225,0.38)", "rgba(242,236,225,0.22)", "rgba(242,236,225,0.12)"];
    const fatias = dados.map((d, i) => {
      const fr = Math.max(0, d.valor) / soma;
      const p = prog(t, d.em - 0.05, 0.8, suave);
      const el = (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={tons[i % tons.length]}
          strokeWidth={70}
          strokeDasharray={`${circ * fr * p} ${circ}`}
          strokeDashoffset={-circ * acumulado}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      );
      acumulado += fr;
      return el;
    });
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {fatias}
        </svg>
        {dados.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: MARGEM + 40, top: cy + R + 90 + i * 62, display: "flex", alignItems: "center", gap: 18, opacity: prog(t, d.em, 0.4) }}>
            <div style={{ width: 22, height: 22, background: tons[i % tons.length] }} />
            <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 36, color: COR.marfim, whiteSpace: "nowrap" }}>
              {d.rotulo} · {formatar(d.valor, casas)}
              {unidade}
            </div>
          </div>
        ))}
      </>
    );
  } else {
    // linha com números ditos, ou tendência ilustrativa (sem números)
    const W = LARGURA;
    const H = 520;
    const x0 = MARGEM;
    const pts: { x: number; y: number; em: number }[] = dados.length
      ? dados.map((d, i) => ({ x: x0 + (W * i) / Math.max(1, dados.length - 1), y: yG + H - (H * 0.85 * d.valor) / maior, em: d.em }))
      : (() => {
          const em = m.tendenciaEm ?? m.de + 0.3;
          const forma = m.tendencia ?? "sobe";
          const ys = forma === "sobe" ? [0.85, 0.7, 0.74, 0.5, 0.36, 0.12] : forma === "cai" ? [0.12, 0.3, 0.26, 0.5, 0.66, 0.88] : [0.5, 0.25, 0.62, 0.3, 0.7, 0.42];
          return ys.map((v, i) => ({ x: x0 + (W * i) / (ys.length - 1), y: yG + H * v, em: em + i * 0.18 }));
        })();
    const inicio = pts[0].em - 0.05;
    const fimDesenho = pts[pts.length - 1].em + 0.4;
    const p = prog(t, inicio, Math.max(0.6, fimDesenho - inicio), suave);
    const caminho = pts.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
    const comprimento = pts.reduce((a, q, i) => (i ? a + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) : 0), 0);
    corpo = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={x0} x2={x0 + W} y1={yG + H} y2={yG + H} stroke={COR.linha} strokeWidth={1.5} />
          <path d={caminho} fill="none" stroke={COR.marfim} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={comprimento} strokeDashoffset={comprimento * (1 - p)} />
          {dados.length
            ? pts.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={11 * prog(t, q.em, 0.3)} fill={i === pts.length - 1 ? COR.vermelhao : COR.marfim} />)
            : <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={13 * prog(t, fimDesenho - 0.2, 0.3)} fill={COR.vermelhao} />}
        </svg>
        {dados.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: Math.min(1080 - MARGEM - 200, Math.max(MARGEM, pts[i].x - 100)),
              width: 200,
              top: yG + H + 22,
              textAlign: i === 0 ? "left" : i === dados.length - 1 ? "right" : "center",
              fontFamily: FONTE,
              fontWeight: 600,
              fontSize: 28,
              color: COR.apagado,
              opacity: prog(t, d.em, 0.4),
              whiteSpace: "nowrap",
            }}
          >
            {d.rotulo}
          </div>
        ))}
        {dados.map((d, i) => (
          <div
            key={`v${i}`}
            style={{
              position: "absolute",
              left: Math.min(1080 - MARGEM - 240, Math.max(MARGEM, pts[i].x - 120)),
              width: 240,
              top: pts[i].y - 78,
              textAlign: "center",
              fontFamily: SERIFA,
              fontWeight: 700,
              fontSize: 44,
              color: i === dados.length - 1 ? COR.vermelhao : COR.marfim,
              opacity: prog(t, d.em, 0.4),
              whiteSpace: "nowrap",
            }}
          >
            {formatar(d.valor, casas)}
            {unidade}
          </div>
        ))}
        {!dados.length ? <Etiqueta texto="ilustrativo" x={MARGEM} y={yG + H + 30} opacidade={prog(t, inicio + 0.3, 0.4)} /> : null}
        {!dados.length && unidade ? (
          <div style={{ position: "absolute", right: MARGEM, top: yG + H + 34, fontFamily: FONTE, fontWeight: 600, fontSize: 28, color: COR.apagado }}>{unidade.trim()}</div>
        ) : null}
      </>
    );
  }
  return (
    <Quadro plano={plano} m={m} t={t}>
      <Titulo texto={m.titulo} y={y0} t={t} em={m.de + 0.1} />
      {corpo}
      {dados.length && m.ilustrativo ? <Etiqueta texto="ilustrativo" x={MARGEM} y={BASE - 60} opacidade={prog(t, m.de + 0.4, 0.4)} /> : null}
    </Quadro>
  );
};

// ——— definicao ———
export const Definicao: React.FC<{ plano: Plano; m: TDefinicao; t: number }> = ({ plano, m, t }) => {
  const termo = serifaLinhas(m.termo, LARGURA, 124, 60, 2);
  const tlh = Math.round(termo.tamanho * 1.1);
  const sig = encaixar(m.significado, { largura: LARGURA, max: 48, min: 32, linhas: 4, fonte: { peso: 600 } });
  const slh = Math.round(sig.tamanho * 1.32);
  const altura = tlh * termo.linhas.length + 60 + slh * sig.linhas.length;
  const y0 = Math.max(TOPO + 60, (TOPO + BASE) / 2 - altura / 2 - 40);
  const ySig = y0 + tlh * termo.linhas.length + 60;
  return (
    <Quadro plano={plano} m={m} t={t}>
      {termo.linhas.map((l, i) => (
        <Linha key={i} e={prog(t, m.em - 0.05 + i * 0.1, 0.55)} altura={tlh} style={{ left: MARGEM, top: y0 + i * tlh }}>
          <div style={{ fontFamily: SERIFA, fontWeight: 600, fontSize: termo.tamanho, lineHeight: `${tlh}px`, color: COR.marfim, whiteSpace: "nowrap" }}>{l}</div>
        </Linha>
      ))}
      <div style={{ position: "absolute", left: MARGEM, top: ySig - 30, width: 90 * prog(t, m.em + 0.2, 0.5), height: 4, background: COR.vermelhao }} />
      {sig.linhas.map((l, i) => (
        <Linha key={i} e={prog(t, m.significadoEm + i * 0.12, 0.5)} altura={slh} style={{ left: MARGEM, top: ySig + i * slh }}>
          <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: sig.tamanho, lineHeight: `${slh}px`, color: COR.marfim, whiteSpace: "nowrap" }}>{l}</div>
        </Linha>
      ))}
    </Quadro>
  );
};
