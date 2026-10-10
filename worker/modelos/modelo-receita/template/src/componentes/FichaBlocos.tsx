// Blocos da ficha em cima: a ficha de receita ocupa a tela e a pessoa fica na janela de um canto.
// O cabeçalho (ao lado da janela) diz do que se trata; o corpo (abaixo) mostra a informação.
// topicos = linhas da ficha com visto; passos = o modo de preparo numerado; comparacao = dois
// cartões; grafico = potes que enchem, traço a lápis no papel ou uma torta vista de cima.
import { Escrita, misturarCor, prog, saindo, Traco } from "../anim";
import type { Quadro, Rect } from "../layout";
import { encaixar, type Encaixe, larguraLinha, numeroBR, casasDe } from "../medida";
import type { Comparacao, Grafico, Item, Palavra, Passos, Topicos } from "../plano";
import { cor, fonte, rotulo as estiloRotulo, TAM, tintas, texto } from "../tema";
import { Ilustrativo, temposDe } from "./Peito";

type Comum = {
  q: Quadro;
  t: number;
  palavras: Palavra[];
  // quando o cabeçalho e o corpo podem aparecer (o cabeçalho espera a janela passar)
  entraCab: number;
  entraCorpo: number;
  sai: number;
  someNaSaida?: boolean;
};

const visivel = (t: number, entra: number, sai: number, someNaSaida: boolean) => {
  const e = prog(t, entra, 0.3);
  const s = someNaSaida ? saindo(t, sai + 0.22, 0.22) : 0;
  return { op: Math.min(e, 1 - s), dy: (1 - e) * 18 - 22 * s, some: e <= 0 || s >= 1 };
};

const fonteItem = { familia: "texto" as const };
const fonteDetalhe = { familia: "texto" as const, italico: true };

// ================= cabeçalho =================

export type Glifo = "x" | "seta" | "sobe" | "cai" | "oscila" | "barras" | "pizza" | "linha";

// O cabeçalho de um bloco da ficha: o título escrito na fala, um contador que rola (como o número
// do passo) ou um sinal desenhado grande (×, seta, tendência).
export const Cabecalho: React.FC<{
  ret: Rect;
  t: number;
  palavras: Palavra[];
  entra: number;
  sai: number;
  someNaSaida: boolean;
  rotulo: string;
  ate: number;
  titulo?: { texto: string; em: number };
  contador?: { quandos: number[] };
  glifo?: { forma: Glifo; em: number };
}> = ({ ret, t, palavras, entra, sai, someNaSaida, rotulo, ate, titulo, contador, glifo }) => {
  const v = visivel(t, entra, sai, someNaSaida);
  if (v.some) return null;
  const caixa: React.CSSProperties = {
    position: "absolute",
    left: ret.x,
    top: ret.y,
    width: ret.w,
    height: ret.h,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    fontFamily: texto,
    color: cor.cacau,
    opacity: v.op,
    translate: `0 ${v.dy}px`,
  };
  if (titulo) {
    const fit = encaixar(titulo.texto, { largura: ret.w, max: TAM.tituloCabecalho, min: 56, linhas: 4 });
    const tempos = temposDe(fit.linhas.join(" "), palavras, titulo.em, ate);
    return (
      <div style={caixa}>
        <div style={{ ...estiloRotulo, fontSize: 48, marginBottom: 18 }}>{rotulo}</div>
        <Escrita linhas={fit.linhas} tempos={tempos} t={t} esboco={cor.lapis} style={{ fontFamily: fonte, fontSize: fit.corpo, lineHeight: 1.02 }} />
      </div>
    );
  }
  if (contador) {
    // o mesmo desenho do número do passo: rola para cima a cada item dito
    const total = contador.quandos.length;
    const ditos = contador.quandos.filter((q) => t >= q - 0.12).length;
    const rola = ditos ? prog(t, contador.quandos[ditos - 1] - 0.12, 0.5) : 0;
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
    return (
      <div style={{ ...caixa, alignItems: "center" }}>
        <div style={estiloRotulo}>{rotulo}</div>
        <div style={{ position: "relative", width: "100%", height: ALTURA, overflow: "hidden", marginTop: 2 }}>
          {rola < 1 ? numero(ditos > 1 ? ditos - 1 : null, -ALTURA * rola) : null}
          {numero(ditos ? ditos : null, ALTURA * (1 - rola))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4 }}>
          <span style={{ fontSize: TAM.deN, fontStyle: "italic", color: cor.cacauSuave, lineHeight: 1 }}>de {total}</span>
          <div style={{ display: "flex", gap: 10 }}>
            {contador.quandos.map((_, i) => {
              const cheio = i < ditos - 1 ? 1 : i === ditos - 1 ? rola : 0;
              return (
                <div
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    border: `3.5px solid ${cor.cacau}`,
                    background: cheio > 0.5 ? cor.pistache : "transparent",
                    scale: String(1 + 0.25 * Math.sin(Math.PI * cheio) * (i === ditos - 1 ? 1 : 0)),
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  if (glifo) {
    const D = Math.min(300, ret.w - 60, ret.h - 120);
    const p = prog(t, glifo.em - 0.15, 0.55);
    const c = D / 2;
    const r = D * 0.24;
    const caminhos: Record<Glifo, string[]> = {
      x: [`M${c - r} ${c - r} L${c + r} ${c + r}`, `M${c + r} ${c - r} L${c - r} ${c + r}`],
      seta: [`M${c} ${c - r * 1.3} L${c} ${c + r * 1.2}`, `M${c - r * 0.8} ${c + r * 0.4} L${c} ${c + r * 1.25} L${c + r * 0.8} ${c + r * 0.4}`],
      sobe: [`M${c - r * 1.3} ${c + r} L${c - r * 0.3} ${c} L${c + r * 0.2} ${c + r * 0.4} L${c + r * 1.25} ${c - r * 1.05}`, `M${c + r * 0.45} ${c - r * 1.1} L${c + r * 1.3} ${c - r * 1.1} L${c + r * 1.3} ${c - r * 0.25}`],
      cai: [`M${c - r * 1.3} ${c - r} L${c - r * 0.3} ${c} L${c + r * 0.2} ${c - r * 0.4} L${c + r * 1.25} ${c + r * 1.05}`, `M${c + r * 0.45} ${c + r * 1.1} L${c + r * 1.3} ${c + r * 1.1} L${c + r * 1.3} ${c + r * 0.25}`],
      oscila: [`M${c - r * 1.4} ${c} C${c - r} ${c - r * 1.4} ${c - r * 0.4} ${c - r * 1.4} ${c} ${c} C${c + r * 0.4} ${c + r * 1.4} ${c + r} ${c + r * 1.4} ${c + r * 1.4} ${c}`],
      barras: [`M${c - r} ${c + r * 1.2} L${c - r} ${c + r * 0.3}`, `M${c} ${c + r * 1.2} L${c} ${c - r * 0.4}`, `M${c + r} ${c + r * 1.2} L${c + r} ${c - r * 1.2}`],
      pizza: [`M${c} ${c} L${c} ${c - r * 1.3}`, `M${c} ${c} L${c + r * 1.15} ${c + r * 0.6}`],
      linha: [`M${c - r * 1.3} ${c + r * 0.8} L${c - r * 0.4} ${c - r * 0.2} L${c + r * 0.3} ${c + r * 0.3} L${c + r * 1.3} ${c - r * 0.9}`],
    };
    return (
      <div style={{ ...caixa, alignItems: "center" }}>
        <div style={estiloRotulo}>{rotulo}</div>
        <svg width={D} height={D} style={{ marginTop: 22, overflow: "visible" }}>
          <circle cx={c} cy={c} r={c - 6} fill={p > 0.02 ? cor.pistacheClaro : "none"} opacity={p > 0.02 ? 0.55 + 0.45 * p : 1} />
          <circle cx={c} cy={c} r={c - 6} fill="none" stroke={p > 0.02 ? cor.cacau : cor.lapis} strokeWidth={p > 0.02 ? 5 : 4} strokeDasharray={p > 0.02 ? undefined : "10 10"} />
          {glifo.forma === "pizza" ? <circle cx={c} cy={c} r={r * 1.3} fill="none" stroke={cor.cacau} strokeWidth={9} opacity={p} /> : null}
          {caminhos[glifo.forma].map((d, i) => (
            <g key={i}>
              <path d={d} fill="none" stroke={cor.lapis} strokeWidth={6} strokeDasharray="10 12" strokeLinecap="round" opacity={1 - p} />
              <Traco d={d} p={prog(t, glifo.em - 0.1 + i * 0.18, 0.4)} cor={cor.cacau} largura={14} />
            </g>
          ))}
        </svg>
      </div>
    );
  }
  return null;
};

// ================= linhas da ficha (topicos) =================

// Um item numa linha da ficha: nasce a lápis (tracejado), ganha tinta e fundo quando é dito.
const CartaoDaLinha: React.FC<{ ret: Rect; tinta: number; children: React.ReactNode }> = ({ ret, tinta, children }) => (
  <div
    style={{
      position: "absolute",
      left: ret.x,
      top: ret.y,
      width: ret.w,
      height: ret.h,
      borderRadius: 32,
      background: tinta > 0.01 ? `rgba(237,227,211,${(0.35 + 0.65 * tinta).toFixed(3)})` : "transparent",
      border: `3px dashed rgba(201,185,166,${(1 - tinta).toFixed(3)})`,
      boxSizing: "border-box",
    }}
  >
    {children}
  </div>
);

type Linha = { ret: Rect; txt: Encaixe; det: Encaixe | null };

// geometria das linhas: altura que preenche o corpo (2 itens = linhas altas, 5 = baixas)
const montarLinhas = (itens: Item[], corpo: Rect, x0: number, larguraTexto: (h: number) => number, maxCorpo: number) => {
  const n = itens.length;
  const gap = n >= 5 ? 16 : 22;
  const maxH = n <= 2 ? 270 : n === 3 ? 236 : n === 4 ? 196 : 158;
  const h = Math.max(130, Math.min(maxH, (corpo.h - gap * (n - 1)) / n));
  const total = n * h + gap * (n - 1);
  const y0 = corpo.y + Math.max(0, (corpo.h - total) * 0.32);
  return itens.map((it, i): Linha => {
    const w = larguraTexto(h);
    const espaco = h - 40;
    let max = maxCorpo;
    let txt = encaixar(it.texto, { largura: w, max, min: 44, linhas: it.detalhe ? 1 : 2, fonte: fonteItem });
    let det = it.detalhe ? encaixar(it.detalhe, { largura: w, max: 48, min: 36, linhas: 1, fonte: fonteDetalhe }) : null;
    const alt = () => txt.linhas.length * txt.corpo * 1.06 + (det ? 6 + det.corpo * 1.1 : 0);
    while (alt() > espaco && max > 44) {
      max -= 4;
      txt = encaixar(it.texto, { largura: w, max, min: Math.min(44, max), linhas: it.detalhe ? 1 : 2, fonte: fonteItem });
      if (det && max < 56) det = encaixar(it.detalhe as string, { largura: w, max: 40, min: 34, linhas: 1, fonte: fonteDetalhe });
    }
    return { ret: { x: x0, y: y0 + i * (h + gap), w: corpo.w - (x0 - corpo.x), h }, txt, det };
  });
};

// o texto de uma linha (item + detalhe), centrado na altura dela
const TextoDaLinha: React.FC<{ l: Linha; x: number; it: Item; t: number; palavras: Palavra[]; ate: number; tinta: number }> = ({ l, x, it, t, palavras, ate }) => {
  const tTxt = temposDe(l.txt.linhas.join(" "), palavras, it.em, ate);
  const fimTxt = (tTxt[tTxt.length - 1] ?? it.em) + 0.2;
  const tDet = l.det ? temposDe(l.det.linhas.join(" "), palavras, fimTxt, ate) : [];
  return (
    <div style={{ position: "absolute", left: x, top: 0, height: l.ret.h, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Escrita linhas={l.txt.linhas} tempos={tTxt} t={t} esboco={cor.lapis} style={{ fontFamily: texto, fontSize: l.txt.corpo, lineHeight: 1.06 }} />
      {l.det ? (
        <div style={{ marginTop: 6 }}>
          <Escrita linhas={l.det.linhas} tempos={tDet} t={t} esboco={cor.lapis} style={{ fontSize: l.det.corpo, fontStyle: "italic", lineHeight: 1.1, color: cor.cacauSuave }} />
        </div>
      ) : null}
    </div>
  );
};

// o marcador pistache que anda até o item da vez (posição contínua entre as linhas)
const posicaoAtual = (t: number, ems: number[]) => ems.reduce((s, em) => s + prog(t, em - 0.1, 0.35), -1);

export const BlocoTopicos: React.FC<Comum & { m: Topicos }> = ({ m, q, t, palavras, entraCab, entraCorpo, sai, someNaSaida = true }) => {
  const itens = m.itens.slice(0, 5);
  const vc = visivel(t, entraCorpo, sai, someNaSaida);
  const D = 80;
  const linhas = montarLinhas(itens, q.corpo, q.corpo.x, () => q.corpo.w - (30 + D + 28) - 30, itens.length <= 3 ? 76 : 64);
  const pos = posicaoAtual(t, itens.map((i) => i.em));
  const passo = linhas.length > 1 ? linhas[1].ret.y - linhas[0].ret.y : 0;
  return (
    <>
      <Cabecalho
        ret={q.cabecalho}
        t={t}
        palavras={palavras}
        entra={entraCab}
        sai={sai}
        someNaSaida={someNaSaida}
        ate={m.ate}
        rotulo={m.rotulo ?? (m.titulo ? "Anote" : "Item")}
        titulo={m.titulo ? { texto: m.titulo, em: m.de + 0.05 } : undefined}
        contador={m.titulo ? undefined : { quandos: itens.map((i) => i.em) }}
      />
      {vc.some ? null : (
        <div style={{ position: "absolute", inset: 0, opacity: vc.op, translate: `0 ${vc.dy}px`, color: cor.cacau }}>
          {linhas.map((l, i) => {
            const it = itens[i];
            const tinta = prog(t, it.em - 0.05, 0.3);
            const visto = prog(t, it.em + 0.2, 0.3);
            const cy = l.ret.h / 2;
            return (
              <CartaoDaLinha key={i} ret={l.ret} tinta={tinta}>
                <svg width={D + 10} height={D + 10} style={{ position: "absolute", left: 28, top: cy - D / 2 - 5, overflow: "visible" }}>
                  <circle cx={D / 2 + 5} cy={D / 2 + 5} r={D / 2} fill={tinta > 0.02 ? misturarCor(cor.creme, cor.pistache, visto) : "none"} stroke={tinta > 0.02 ? cor.cacau : cor.lapis} strokeWidth={tinta > 0.02 ? 4 : 3.2} strokeDasharray={tinta > 0.02 ? undefined : "7 8"} />
                  <Traco d={`M${D * 0.3 + 5} ${D * 0.52 + 5} L${D * 0.45 + 5} ${D * 0.67 + 5} L${D * 0.72 + 5} ${D * 0.36 + 5}`} p={visto} cor={cor.cacau} largura={6} />
                </svg>
                <TextoDaLinha l={l} x={30 + D + 28} it={it} t={t} palavras={palavras} ate={m.ate} tinta={tinta} />
              </CartaoDaLinha>
            );
          })}
          {/* o marcador do item da vez, na margem esquerda da ficha */}
          {pos >= 0 && linhas.length ? (
            <div
              style={{
                position: "absolute",
                left: q.corpo.x - 30,
                top: linhas[0].ret.y + pos * passo + 22,
                width: 10,
                height: linhas[0].ret.h - 44,
                borderRadius: 5,
                background: cor.pistache,
                opacity: prog(t, itens[0].em - 0.1, 0.3),
              }}
            />
          ) : null}
        </div>
      )}
    </>
  );
};

// ================= modo de preparo (passos) =================

export const BlocoPassos: React.FC<Comum & { m: Passos }> = ({ m, q, t, palavras, entraCab, entraCorpo, sai, someNaSaida = true }) => {
  const itens = m.itens.slice(0, 5);
  const vc = visivel(t, entraCorpo, sai, someNaSaida);
  const corpo = q.corpo;
  // título opcional no topo do corpo
  const tit = m.titulo ? encaixar(m.titulo, { largura: corpo.w, max: 84, min: 60, linhas: 2 }) : null;
  const altTitulo = tit ? tit.linhas.length * tit.corpo * 1.04 + 30 : 0;
  const area: Rect = { x: corpo.x, y: corpo.y + altTitulo, w: corpo.w, h: corpo.h - altTitulo };
  const D = itens.length >= 5 ? 84 : 96;
  const linhas = montarLinhas(itens, area, corpo.x, () => corpo.w - (16 + D + 30) - 24, itens.length <= 3 ? 76 : 64);
  const pos = posicaoAtual(t, itens.map((i) => i.em));
  const passo = linhas.length > 1 ? linhas[1].ret.y - linhas[0].ret.y : 0;
  const cx = corpo.x + 16 + D / 2;
  const cy = (i: number) => linhas[i].ret.y + linhas[i].ret.h / 2;
  const tTit = tit ? temposDe(tit.linhas.join(" "), palavras, m.de + 0.05, m.ate) : [];
  return (
    <>
      <Cabecalho
        ret={q.cabecalho}
        t={t}
        palavras={palavras}
        entra={entraCab}
        sai={sai}
        someNaSaida={someNaSaida}
        ate={m.ate}
        rotulo={m.rotulo ?? "Passo"}
        contador={{ quandos: itens.map((i) => i.em) }}
      />
      {vc.some ? null : (
        <div style={{ position: "absolute", inset: 0, opacity: vc.op, translate: `0 ${vc.dy}px`, color: cor.cacau }}>
          {tit ? (
            <div style={{ position: "absolute", left: corpo.x, top: corpo.y - 4 }}>
              <Escrita linhas={tit.linhas} tempos={tTit} t={t} esboco={cor.lapis} style={{ fontFamily: fonte, fontSize: tit.corpo, lineHeight: 1.04 }} />
            </div>
          ) : null}
          {/* a faixa do passo da vez desliza de um para o outro */}
          {pos >= 0 && linhas.length ? (
            <div
              style={{
                position: "absolute",
                left: corpo.x,
                top: linhas[0].ret.y + pos * passo,
                width: corpo.w,
                height: linhas[0].ret.h,
                borderRadius: 34,
                background: cor.cremeFundo,
                opacity: prog(t, itens[0].em - 0.1, 0.3),
              }}
            />
          ) : null}
          {/* o fio que liga os números: a lápis, e pistache até o passo da vez */}
          {linhas.length > 1 ? (
            <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <path d={`M${cx} ${cy(0)} L${cx} ${cy(linhas.length - 1)}`} stroke={cor.lapis} strokeWidth={4} strokeDasharray="8 10" />
              {pos > 0 ? <path d={`M${cx} ${cy(0)} L${cx} ${cy(0) + Math.min(pos, linhas.length - 1) * passo}`} stroke={cor.pistacheFundo} strokeWidth={9} strokeLinecap="round" /> : null}
            </svg>
          ) : null}
          {linhas.map((l, i) => {
            const it = itens[i];
            const tinta = prog(t, it.em - 0.05, 0.3);
            const atual = pos >= i - 0.5 && pos < i + 0.5;
            const feito = pos >= i - 0.02;
            return (
              <div key={i} style={{ position: "absolute", left: l.ret.x, top: l.ret.y, width: l.ret.w, height: l.ret.h }}>
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    top: l.ret.h / 2 - D / 2,
                    width: D,
                    height: D,
                    borderRadius: D / 2,
                    boxSizing: "border-box",
                    border: `${tinta > 0.02 ? 4 : 3.2}px ${tinta > 0.02 ? "solid" : "dashed"} ${tinta > 0.02 ? cor.cacau : cor.lapis}`,
                    background: feito ? (atual ? cor.pistache : cor.pistacheClaro) : cor.creme,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonte,
                    fontSize: D * 0.56,
                    lineHeight: 1,
                    color: tinta > 0.02 ? cor.cacau : cor.lapis,
                    scale: String(1 + 0.12 * Math.sin(Math.PI * prog(t, it.em - 0.05, 0.4))),
                  }}
                >
                  <span style={{ translate: "0 0.05em" }}>{i + 1}</span>
                </div>
                <TextoDaLinha l={l} x={16 + D + 30} it={it} t={t} palavras={palavras} ate={m.ate} tinta={tinta} />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

// ================= comparação: dois cartões =================

export const BlocoComparacao: React.FC<Comum & { m: Comparacao }> = ({ m, q, t, palavras, entraCab, entraCorpo, sai, someNaSaida = true }) => {
  const vc = visivel(t, entraCorpo, sai, someNaSaida);
  const corpo = q.corpo;
  const modo = m.modo ?? "contra";
  const Dc = 108;
  const gapV = 26;
  const cardH = Math.min(330, (corpo.h - Dc - gapV * 2) / 2);
  const bloco = cardH * 2 + Dc + gapV * 2;
  const y0 = corpo.y + Math.max(0, (corpo.h - bloco) * 0.3);
  const PAD = 38;
  const larguraTexto = corpo.w - PAD * 2 - 70;
  const vencedor: 0 | 1 | null = m.vencedor ?? (modo === "errado-certo" ? 1 : null);
  const vEm = m.vencedorEm ?? (vencedor !== null ? m.lados[1].em + 0.6 : 0);
  const pV = vencedor !== null ? prog(t, vEm, 0.4) : 0;
  const pConector = prog(t, Math.min(m.lados[1].em - 0.35, m.lados[0].em + 0.8), 0.4);
  const glifoCab: Glifo = modo === "contra" ? "x" : "seta";
  return (
    <>
      <Cabecalho
        ret={q.cabecalho}
        t={t}
        palavras={palavras}
        entra={entraCab}
        sai={sai}
        someNaSaida={someNaSaida}
        ate={m.ate}
        rotulo={m.rotulo ?? (modo === "antes-depois" ? "Antes e depois" : modo === "errado-certo" ? "Troque" : "Compare")}
        titulo={m.titulo ? { texto: m.titulo, em: m.de + 0.05 } : undefined}
        glifo={m.titulo ? undefined : { forma: glifoCab, em: m.lados[0].em }}
      />
      {vc.some ? null : (
        <div style={{ position: "absolute", inset: 0, opacity: vc.op, translate: `0 ${vc.dy}px`, color: cor.cacau, fontFamily: texto }}>
          {m.lados.map((lado, i) => {
            const y = i === 0 ? y0 : y0 + cardH + gapV * 2 + Dc;
            const tinta = prog(t, lado.em - 0.05, 0.3);
            const espaco = cardH - PAD * 2 - 44 - 12;
            let max = 96;
            let fit = encaixar(lado.texto, { largura: larguraTexto, max, min: 56, linhas: 2 });
            while (fit.linhas.length * fit.corpo * 1.04 > espaco && max > 48) {
              max -= 4;
              fit = encaixar(lado.texto, { largura: larguraTexto, max, min: Math.min(56, max), linhas: 2 });
            }
            const tRot = temposDe(lado.rotulo, palavras, lado.em, m.ate);
            const tTxt = temposDe(fit.linhas.join(" "), palavras, lado.em + 0.1, m.ate);
            const ganhou = vencedor === i;
            const perdeu = vencedor !== null && vencedor !== i;
            const riscar = perdeu && modo === "errado-certo";
            const borda = ganhou ? misturarCor(cor.cacau, cor.pistacheFundo, pV) : cor.cacau;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: corpo.x,
                  top: y,
                  width: corpo.w,
                  height: cardH,
                  borderRadius: 36,
                  boxSizing: "border-box",
                  background: tinta > 0.01 ? `rgba(237,227,211,${(0.35 + 0.65 * tinta).toFixed(3)})` : "transparent",
                  border: tinta > 0.02 ? `${ganhou ? 3 + 4 * pV : 3}px solid ${borda}` : `3px dashed ${cor.lapis}`,
                  padding: `${PAD - 6}px ${PAD}px`,
                }}
              >
                <Escrita linhas={[lado.rotulo]} tempos={tRot} t={t} esboco={cor.lapis} style={{ ...estiloRotulo, fontSize: 40, color: undefined }} />
                <div style={{ marginTop: 12, position: "relative", opacity: perdeu ? 1 - 0.45 * pV : 1 }}>
                  <Escrita linhas={fit.linhas} tempos={tTxt} t={t} esboco={cor.lapis} style={{ fontFamily: fonte, fontSize: fit.corpo, lineHeight: 1.04 }} />
                  {riscar ? (
                    <svg width={larguraTexto} height={fit.linhas.length * fit.corpo * 1.04} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                      {fit.linhas.map((l, k) => {
                        const y1 = (k + 0.56) * fit.corpo * 1.04;
                        return <Traco key={k} d={`M-6 ${y1} L${larguraLinha(l, fit.corpo) + 6} ${y1 - 4}`} p={prog(t, vEm + k * 0.12, 0.3)} cor={cor.cacau} largura={7} />;
                      })}
                    </svg>
                  ) : null}
                </div>
                {ganhou ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 26,
                      top: 26,
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      boxSizing: "border-box",
                      border: `3px solid ${cor.cacau}`,
                      background: cor.pistache,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pV,
                      scale: String(0.6 + 0.4 * pV),
                    }}
                  >
                    <svg viewBox="0 0 40 40" width={44} height={44}>
                      <path d="M10 21 L17 28 L30 13" fill="none" stroke={cor.cacau} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : null}
              </div>
            );
          })}
          {/* o elo entre os dois cartões: × (contra) ou uma seta (antes-depois, errado-certo) */}
          <svg width={Dc} height={Dc} style={{ position: "absolute", left: corpo.x + corpo.w / 2 - Dc / 2, top: y0 + cardH + gapV, overflow: "visible" }}>
            <circle cx={Dc / 2} cy={Dc / 2} r={Dc / 2 - 4} fill={pConector > 0.02 ? cor.creme : "none"} stroke={pConector > 0.02 ? cor.cacau : cor.lapis} strokeWidth={4} strokeDasharray={pConector > 0.02 ? undefined : "8 8"} />
            {modo === "contra" ? (
              <>
                <Traco d={`M${Dc * 0.34} ${Dc * 0.34} L${Dc * 0.66} ${Dc * 0.66}`} p={pConector} cor={cor.cacau} largura={8} />
                <Traco d={`M${Dc * 0.66} ${Dc * 0.34} L${Dc * 0.34} ${Dc * 0.66}`} p={prog(t, Math.min(m.lados[1].em - 0.35, m.lados[0].em + 0.8) + 0.15, 0.35)} cor={cor.cacau} largura={8} />
              </>
            ) : (
              <Traco d={`M${Dc / 2} ${Dc * 0.24} L${Dc / 2} ${Dc * 0.74} M${Dc * 0.33} ${Dc * 0.58} L${Dc / 2} ${Dc * 0.75} L${Dc * 0.67} ${Dc * 0.58}`} p={pConector} cor={cor.cacau} largura={8} />
            )}
          </svg>
        </div>
      )}
    </>
  );
};

// ================= gráfico =================

const CORES_FATIA = [tintas.massa, tintas.pistache, tintas.caramelo, tintas.framboesa, tintas.manteiga, tintas.cacau];

const valorComUnidade = (v: number, casas: number, unidade?: string) => {
  const u = unidade?.trim();
  if (!u) return numeroBR(v, casas);
  return u === "%" ? `${numeroBR(v, casas)}%` : /^(R\$|US\$|\$|€|£)$/.test(u) ? `${u} ${numeroBR(v, casas)}` : `${numeroBR(v, casas)} ${u}`;
};

// um pote de vidro (o mesmo do modelo) que enche até `nivel` (0–1)
const PoteGrafico: React.FC<{ cx: number; base: number; w: number; h: number; nivel: number; traco: number; id: string; tinta?: string }> = ({ cx, base, w, h, nivel, traco, id, tinta }) => {
  const pl = cx - w / 2;
  const corpoTopo = base - h * 0.88;
  const boca = base - h;
  const r = Math.min(26, w * 0.2);
  const corpoPote = `M${pl} ${corpoTopo + 16} Q${pl} ${corpoTopo} ${pl + 16} ${corpoTopo} L${pl + w - 16} ${corpoTopo} Q${pl + w} ${corpoTopo} ${pl + w} ${corpoTopo + 16} L${pl + w} ${base - r} Q${pl + w} ${base} ${pl + w - r} ${base} L${pl + r} ${base} Q${pl} ${base} ${pl} ${base - r} Z`;
  const altura = base - corpoTopo - 10;
  const topo = base - 4 - nivel * altura;
  const massa = tinta ?? tintas.massa;
  return (
    <g>
      <ellipse cx={cx + 5} cy={base + 4} rx={w * 0.56} ry={10} fill="rgba(46,30,26,0.12)" opacity={traco} />
      <path d={corpoPote} fill="#FBF7EE" opacity={0.4 + 0.6 * traco} />
      <defs>
        <clipPath id={id}>
          <path d={corpoPote} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {nivel > 0.003 ? (
          <>
            <rect x={pl} y={topo} width={w} height={base - topo + 4} fill={massa} />
            <ellipse cx={cx} cy={topo} rx={w * 0.5} ry={8} fill={misturarCor(massa.startsWith("#") ? massa : tintas.massa, "#E8D5C4", 0.3)} />
          </>
        ) : null}
      </g>
      <path d={corpoPote} fill="none" stroke={cor.lapis} strokeWidth={3.2} strokeDasharray="7 8" opacity={1 - traco} />
      <path d={corpoPote} fill="none" stroke={cor.cacau} strokeWidth={5} strokeLinejoin="round" opacity={traco} />
      <rect x={cx - w * 0.4} y={boca} width={w * 0.8} height={corpoTopo - boca + 4} rx={7} fill="#FBF7EE" stroke={traco > 0.02 ? cor.cacau : cor.lapis} strokeWidth={traco > 0.02 ? 5 : 3.2} strokeDasharray={traco > 0.02 ? undefined : "7 8"} />
      <path d={`M${pl + 14} ${corpoTopo + 26} L${pl + 14} ${corpoTopo + Math.min(120, altura * 0.4)}`} stroke="rgba(255,255,255,0.85)" strokeWidth={5} strokeLinecap="round" opacity={traco} />
    </g>
  );
};

export const BlocoGrafico: React.FC<Comum & { m: Grafico }> = ({ m, q, t, palavras, entraCab, entraCorpo, sai, someNaSaida = true }) => {
  const vc = visivel(t, entraCorpo, sai, someNaSaida);
  const corpo = q.corpo;
  const dados = (m.dados ?? []).slice(0, 6);
  const comDados = dados.length >= 2;
  const tendencia = m.tendencia ?? "sobe";
  const tEm = m.tendenciaEm ?? m.de + 0.4;
  const ilustrativo = !comDados || m.ilustrativo;
  const glifo: Glifo = comDados ? (m.forma === "pizza" ? "pizza" : m.forma === "linha" ? "linha" : "barras") : tendencia;
  const casas = Math.max(0, ...dados.map((d) => casasDe(d.valor)));
  // reserva no topo do corpo para a etiqueta "ilustrativo"
  const topoUtil = corpo.y + (ilustrativo ? 70 : 10);
  const area: Rect = { x: corpo.x, y: topoUtil, w: corpo.w, h: corpo.y + corpo.h - topoUtil };
  const fonteRot = { familia: "texto" as const, italico: true };

  let desenho: React.ReactNode = null;
  if (m.forma === "barras") {
    // potes que enchem: com dados, a altura é proporcional; sem dados, a tendência em 5 potes
    const niveis = comDados
      ? (() => {
          const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
          return dados.map((d) => Math.max(0.04, (Math.abs(d.valor) / max) * 0.9));
        })()
      : tendencia === "sobe"
        ? [0.18, 0.32, 0.48, 0.66, 0.88]
        : tendencia === "cai"
          ? [0.88, 0.66, 0.48, 0.32, 0.18]
          : [0.3, 0.7, 0.4, 0.82, 0.5];
    const ems = comDados ? dados.map((d) => d.em) : niveis.map((_, i) => tEm + i * 0.28);
    const n = niveis.length;
    const col = area.w / n;
    const w = Math.min(190, col * 0.7);
    const rotulos = comDados ? dados.map((d) => encaixar(d.rotulo, { largura: col - 14, max: 46, min: 34, linhas: 2, fonte: fonteRot })) : [];
    const corpoRot = rotulos.length ? Math.min(...rotulos.map((r) => r.corpo)) : 0;
    const linhasRot = rotulos.length ? Math.max(...rotulos.map((r) => r.linhas.length)) : 0;
    const altRot = comDados ? linhasRot * corpoRot * 1.1 + 20 : 0;
    const altValor = comDados ? 82 : 0;
    const base = area.y + area.h - altRot - 10;
    const h = Math.min(560, base - area.y - altValor);
    desenho = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* a prateleira */}
          <path d={`M${area.x - 10} ${base + 6} L${area.x + area.w + 10} ${base + 6}`} stroke={cor.cacau} strokeWidth={5} strokeLinecap="round" />
          {niveis.map((nv, i) => {
            const em = ems[i];
            const traco = prog(t, em - 0.2, 0.3);
            const enche = prog(t, em, 0.7);
            return <PoteGrafico key={i} id={`pg-${i}-${Math.round(corpo.y)}`} cx={area.x + col * (i + 0.5)} base={base} w={w} h={h} nivel={nv * enche} traco={traco} />;
          })}
        </svg>
        {comDados
          ? dados.map((d, i) => {
              const enche = prog(t, d.em, 0.7);
              const nv = niveis[i] * enche;
              const corpoTopo = base - h * 0.88;
              const yNivel = base - 4 - nv * (base - corpoTopo - 10);
              const valor = valorComUnidade(d.valor * enche, casas, m.unidade);
              const larguraV = larguraLinha(valorComUnidade(d.valor, casas, m.unidade), 1);
              const corpoV = Math.max(34, Math.min(64, (col - 8) / Math.max(larguraV, 0.1)));
              const tRot = temposDe(rotulos[i].linhas.join(" "), palavras, d.em, m.ate);
              return (
                <div key={i}>
                  {/* o valor conta e fica logo acima do pote (sobe com o nível) */}
                  <div
                    style={{
                      position: "absolute",
                      left: area.x + col * i,
                      width: col,
                      top: Math.min(base - h - corpoV * 1.1, yNivel - corpoV * 1.2) - 6,
                      textAlign: "center",
                      fontFamily: fonte,
                      fontSize: corpoV,
                      lineHeight: 1,
                      color: cor.cacau,
                      opacity: prog(t, d.em - 0.05, 0.25),
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {valor}
                  </div>
                  <div style={{ position: "absolute", left: area.x + col * i, width: col, top: base + 22, display: "flex", justifyContent: "center" }}>
                    <Escrita linhas={rotulos[i].linhas} tempos={tRot} t={t} esboco={cor.lapis} alinhar="center" style={{ fontFamily: texto, fontSize: corpoRot, fontStyle: "italic", lineHeight: 1.1 }} />
                  </div>
                </div>
              );
            })
          : null}
      </>
    );
  } else if (m.forma === "linha") {
    // traço a lápis no papel pautado: com dados, ponto a ponto; sem dados, a curva da tendência
    const x0 = area.x + 40;
    const x1 = area.x + area.w - 30;
    const rotulos = comDados ? dados.map((d) => encaixar(d.rotulo, { largura: Math.max(120, (x1 - x0) / dados.length + 30), max: 44, min: 34, linhas: 2, fonte: fonteRot })) : [];
    const altRot = comDados ? Math.max(...rotulos.map((r) => r.linhas.length * r.corpo * 1.1)) + 24 : 0;
    const yBase = area.y + area.h - altRot - 14;
    const yTopo = area.y + 90;
    let pontos: { x: number; y: number; em: number }[];
    if (comDados) {
      const vs = dados.map((d) => d.valor);
      const max = Math.max(...vs);
      const min = Math.min(0, ...vs);
      pontos = dados.map((d, i) => ({
        x: dados.length === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (dados.length - 1),
        y: yBase - ((d.valor - min) / Math.max(1e-9, max - min)) * (yBase - yTopo) * 0.92,
        em: d.em,
      }));
    } else {
      const forma = tendencia === "sobe" ? [0.1, 0.28, 0.22, 0.48, 0.42, 0.7, 0.92] : tendencia === "cai" ? [0.92, 0.7, 0.76, 0.5, 0.56, 0.3, 0.1] : [0.4, 0.75, 0.3, 0.8, 0.35, 0.7, 0.45];
      pontos = forma.map((f, i) => ({ x: x0 + ((x1 - x0) * i) / (forma.length - 1), y: yBase - f * (yBase - yTopo), em: tEm + i * 0.22 }));
    }
    const caminho = (ate: number) => {
      // até o ponto `ate` (contínuo): segmentos completos + o parcial
      let d = `M${pontos[0].x} ${pontos[0].y}`;
      const k = Math.floor(ate);
      for (let i = 1; i <= Math.min(k, pontos.length - 1); i++) d += ` L${pontos[i].x} ${pontos[i].y}`;
      if (k + 1 < pontos.length && ate > k) {
        const a = pontos[k];
        const b = pontos[k + 1];
        const f = ate - k;
        d += ` L${a.x + (b.x - a.x) * f} ${a.y + (b.y - a.y) * f}`;
      }
      return d;
    };
    const avanco = pontos.reduce((s, p, i) => (i === 0 ? s : s + prog(t, comDados ? p.em - 0.35 : p.em - 0.22, comDados ? 0.45 : 0.22)), 0);
    const ponta = (() => {
      const k = Math.min(pontos.length - 1, Math.floor(avanco));
      const f = avanco - k;
      const a = pontos[k];
      const b = pontos[Math.min(pontos.length - 1, k + 1)];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    })();
    const comecou = t >= pontos[0].em - (comDados ? 0.1 : 0.3);
    desenho = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* eixos a traço */}
          <path d={`M${x0 - 30} ${yTopo - 30} L${x0 - 30} ${yBase + 6} L${x1 + 20} ${yBase + 6}`} fill="none" stroke={cor.cacau} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          {/* o caminho inteiro a lápis (espera) e a tinta por cima até onde já foi dito */}
          <path d={caminho(pontos.length - 1)} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="9 10" strokeLinecap="round" />
          {comecou ? <path d={caminho(avanco)} fill="none" stroke={cor.cacau} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {comDados
            ? pontos.map((p, i) => {
                const pp = prog(t, p.em - 0.05, 0.3);
                return <circle key={i} cx={p.x} cy={p.y} r={14 + 4 * Math.sin(Math.PI * pp)} fill={pp > 0.02 ? cor.pistache : cor.creme} stroke={pp > 0.02 ? cor.cacau : cor.lapis} strokeWidth={4.5} />;
              })
            : null}
          {/* a ponta: o lápis que desenha */}
          {comecou ? <circle cx={ponta.x} cy={ponta.y} r={16} fill={cor.pistache} stroke={cor.cacau} strokeWidth={4.5} /> : null}
          {!comDados && avanco >= pontos.length - 1.05 ? (
            (() => {
              const a = pontos[pontos.length - 2];
              const b = pontos[pontos.length - 1];
              const ang = Math.atan2(b.y - a.y, b.x - a.x);
              const L = 40;
              const p1 = { x: b.x - L * Math.cos(ang - 0.5), y: b.y - L * Math.sin(ang - 0.5) };
              const p2 = { x: b.x - L * Math.cos(ang + 0.5), y: b.y - L * Math.sin(ang + 0.5) };
              return <Traco d={`M${p1.x} ${p1.y} L${b.x} ${b.y} L${p2.x} ${p2.y}`} p={prog(t, pontos[pontos.length - 1].em, 0.25)} cor={cor.cacau} largura={9} />;
            })()
          ) : null}
        </svg>
        {comDados
          ? dados.map((d, i) => {
              const p = pontos[i];
              const pp = prog(t, d.em - 0.05, 0.3);
              const valor = valorComUnidade(d.valor * prog(t, d.em, 0.6), casas, m.unidade);
              const tRot = temposDe(rotulos[i].linhas.join(" "), palavras, d.em, m.ate);
              const largura = Math.max(200, (x1 - x0) / Math.max(1, dados.length - 1));
              return (
                <div key={i}>
                  <div style={{ position: "absolute", left: p.x - largura / 2, width: largura, top: p.y - 92, textAlign: "center", fontFamily: fonte, fontSize: 58, lineHeight: 1, color: cor.cacau, opacity: pp, fontVariantNumeric: "tabular-nums" }}>
                    {valor}
                  </div>
                  <div style={{ position: "absolute", left: p.x - largura / 2, width: largura, top: yBase + 26, display: "flex", justifyContent: "center" }}>
                    <Escrita linhas={rotulos[i].linhas} tempos={tRot} t={t} esboco={cor.lapis} alinhar="center" style={{ fontFamily: texto, fontSize: rotulos[i].corpo, fontStyle: "italic", lineHeight: 1.1 }} />
                  </div>
                </div>
              );
            })
          : m.unidade
            ? (
                <div style={{ position: "absolute", left: x0 - 10, top: yTopo - 70, fontFamily: texto, fontSize: 40, fontStyle: "italic", color: cor.cacauSuave }}>{m.unidade}</div>
              )
            : null}
      </>
    );
  } else {
    // pizza: uma torta vista de cima; cada fatia ganha recheio quando é dita
    const fatias = comDados ? dados.map((d) => Math.max(0, d.valor)) : tendencia === "cai" ? [70, 30] : [30, 70];
    const soma = fatias.reduce((s, v) => s + v, 0) || 1;
    const legenda = comDados ? dados.map((d) => encaixar(`${d.rotulo} · ${valorComUnidade(d.valor, casas, m.unidade ?? (Math.abs(soma - 100) < 0.5 ? "%" : undefined))}`, { largura: dados.length > 3 ? area.w / 2 - 70 : area.w - 70, max: 50, min: 34, linhas: 2, fonte: fonteRot })) : [];
    const colunas = legenda.length > 3 ? 2 : 1;
    const linhasLeg = Math.ceil(legenda.length / colunas);
    const corpoLeg = legenda.length ? Math.min(...legenda.map((l) => l.corpo)) : 0;
    const altLeg = legenda.length ? linhasLeg * (Math.max(...legenda.map((l) => l.linhas.length)) * corpoLeg * 1.1 + 18) : 0;
    const R = Math.min(300, (area.h - altLeg - 50) / 2, area.w / 2 - 40);
    const cx = area.x + area.w / 2;
    const cy = area.y + R + 10;
    const ems = comDados ? dados.map((d) => d.em) : [tEm, tEm + 0.5];
    let acum = -Math.PI / 2;
    const arcos = fatias.map((v, i) => {
      const a0 = acum;
      // sem dados, a fatia da tendência cresce (sobe) ou encolhe (cai) com o tempo
      const frac = comDados ? v / soma : i === 0 ? (tendencia === "cai" ? 0.7 - 0.45 * prog(t, tEm + 0.4, 1.2) : 0.25 + 0.45 * prog(t, tEm + 0.4, 1.2)) : 0;
      const a1 = a0 + frac * Math.PI * 2;
      acum = a1;
      return { a0, a1 };
    });
    if (!comDados) arcos[1] = { a0: arcos[0].a1, a1: -Math.PI / 2 + Math.PI * 2 };
    const fatia = (a0: number, a1: number, r: number) => {
      const grande = a1 - a0 > Math.PI ? 1 : 0;
      return `M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A${r} ${r} 0 ${grande} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} Z`;
    };
    desenho = (
      <>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx + 8} cy={cy + 14} r={R + 4} fill="rgba(46,30,26,0.14)" />
          {/* a massa da torta (borda) e o fundo */}
          <circle cx={cx} cy={cy} r={R} fill={tintas.manteiga} stroke={cor.cacau} strokeWidth={5} />
          <circle cx={cx} cy={cy} r={R * 0.86} fill={cor.cremeFundo} stroke="rgba(58,38,33,0.35)" strokeWidth={2.5} />
          {arcos.map(({ a0, a1 }, i) => {
            const p = prog(t, ems[i] - 0.05, 0.5);
            if (p <= 0.001 || a1 - a0 < 0.001) {
              // a lápis: o contorno da fatia que ainda vai ser dita
              return a1 - a0 > 0.001 ? <path key={i} d={fatia(a0, a1, R * 0.86)} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="7 8" /> : null;
            }
            const am = a0 + (a1 - a0) * p;
            const corFatia = comDados ? CORES_FATIA[i % CORES_FATIA.length] : i === 0 ? tintas.massa : tintas.pistache;
            return <path key={i} d={fatia(a0, Math.max(a0 + 0.001, am), R * 0.86)} fill={corFatia} stroke={cor.cacau} strokeWidth={4} strokeLinejoin="round" />;
          })}
          {/* os cortes da faca */}
          {arcos.map(({ a0 }, i) => (prog(t, ems[i] - 0.05, 0.3) > 0.01 ? <path key={`c${i}`} d={`M${cx} ${cy} L${cx + Math.cos(a0) * R * 0.98} ${cy + Math.sin(a0) * R * 0.98}`} stroke={cor.cacau} strokeWidth={5} strokeLinecap="round" /> : null))}
        </svg>
        {legenda.length ? (
          <div style={{ position: "absolute", left: area.x, top: cy + R + 40, width: area.w, display: "grid", gridTemplateColumns: `repeat(${colunas}, 1fr)`, rowGap: 18, columnGap: 30 }}>
            {legenda.map((l, i) => {
              const tL = temposDe(l.linhas.join(" "), palavras, dados[i].em, m.ate);
              const p = prog(t, dados[i].em - 0.05, 0.3);
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, marginTop: corpoLeg * 0.18, background: p > 0.02 ? CORES_FATIA[i % CORES_FATIA.length] : "transparent", border: `3.5px ${p > 0.02 ? "solid" : "dashed"} ${p > 0.02 ? cor.cacau : cor.lapis}`, boxSizing: "border-box" }} />
                  <Escrita linhas={l.linhas} tempos={tL} t={t} esboco={cor.lapis} style={{ fontFamily: texto, fontSize: corpoLeg, fontStyle: "italic", lineHeight: 1.1 }} />
                </div>
              );
            })}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Cabecalho
        ret={q.cabecalho}
        t={t}
        palavras={palavras}
        entra={entraCab}
        sai={sai}
        someNaSaida={someNaSaida}
        ate={m.ate}
        rotulo={m.rotulo ?? (comDados ? "Em números" : "Tendência")}
        titulo={m.titulo ? { texto: m.titulo, em: m.de + 0.05 } : undefined}
        glifo={m.titulo ? undefined : { forma: glifo, em: comDados ? dados[0].em : tEm }}
      />
      {vc.some ? null : (
        <div style={{ position: "absolute", inset: 0, opacity: vc.op, translate: `0 ${vc.dy}px` }}>
          {ilustrativo ? <Ilustrativo x={corpo.x} y={corpo.y} /> : null}
          {desenho}
        </div>
      )}
    </>
  );
};
