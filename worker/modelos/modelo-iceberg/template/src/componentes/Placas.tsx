// Os 11 blocos universais na linguagem do Iceberg: placas de gelo que flutuam na água (com a espessura do gelo
// embaixo), sobem na entrada e afundam na saída. Texto em tinta escura sobre o gelo; ênfase em coral.
import { useMemo } from "react";
import { formatar, prog, rapido, salto, carimbo, saindo, temposDoTexto, usePalavras } from "../anim";
import { ZONA } from "../camera";
import { encaixar, larguraTexto, trechoNoTexto } from "../medida";
import type { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Topicos } from "../plano";
import { cor, fonte, mono, sombraLaje } from "../tema";
import { Icone } from "./Icones";

type P<M> = { m: M; t: number; fim: number };
const Z = ZONA;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ——— a placa de gelo ———

const Laje: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  em: number;
  fim: number;
  seed?: number;
  borda?: string;
  fundo?: string;
  extra?: { dy?: number; escala?: number; opacidade?: number };
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, w, h, t, em, fim, seed = 0, borda, fundo, extra, children, style }) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em, 0.46, rapido);
  const q = saindo(t, fim, 0.3);
  const sway = Math.sin(t * 1.1 + seed * 1.7) * 0.3;
  const dy = (1 - p) * 150 + q * 110 + Math.sin(t * 1.3 + seed) * 4 + (extra?.dy ?? 0);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 42,
        background: fundo ?? `linear-gradient(180deg, ${cor.gelo}, ${cor.geloLuz})`,
        boxShadow: `0 16px 0 ${cor.geloSombra}, ${sombraLaje}`,
        outline: borda ? `7px solid ${borda}` : undefined,
        opacity: Math.min(1, p * 3) * (1 - q) * (extra?.opacidade ?? 1),
        transform: `translateY(${dy}px) rotate(${sway}deg) scale(${extra?.escala ?? 1})`,
        color: cor.tinta,
        fontFamily: fonte,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// texto que se monta palavra a palavra, no ritmo da fala
const TextoPalavras: React.FC<{
  texto: string;
  t: number;
  em: number;
  ate?: number;
  largura: number;
  max: number;
  min: number;
  linhas?: number;
  cor?: string;
  align?: "center" | "left";
  destaque?: string;
  risco?: string;
  riscoEm?: number;
}> = ({ texto, t, em, ate, largura, max, min, linhas = 3, cor: c = cor.tinta, align = "center", destaque, risco, riscoEm }) => {
  const fala = usePalavras();
  const { tamanho, linhas: ls } = useMemo(() => encaixar(texto, { largura, max, min, linhas, fonte: { peso: 800 } }), [texto, largura, max, min, linhas]);
  const tempos = useMemo(() => temposDoTexto(texto, em, fala, ate), [texto, em, fala, ate]);
  const dest = trechoNoTexto(texto, destaque);
  const ris = trechoNoTexto(texto, risco);
  let idx = 0;
  return (
    <div style={{ textAlign: align, fontFamily: fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1.12, color: c }}>
      {ls.map((l, i) => (
        <div key={i}>
          {l.split(" ").map((w, k, arr) => {
            const n = idx++;
            const tp = tempos[n] ?? em;
            const e = prog(t, tp, 0.22, salto);
            const feito = t >= tp + 0.25;
            const ehDest = dest && n >= dest[0] && n <= dest[1];
            const ehRisco = ris && n >= ris[0] && n <= ris[1];
            const rp = ehRisco ? prog(t, riscoEm ?? tp + 0.4, 0.25, rapido) : 0;
            return (
              <span
                key={k}
                style={{
                  display: "inline-block",
                  position: "relative",
                  marginRight: k < arr.length - 1 ? tamanho * 0.26 : 0,
                  color: ehDest ? cor.enfaseEscura : c,
                  opacity: feito ? 1 : t >= tp ? e : 0,
                  transform: feito ? undefined : `translateY(${(1 - e) * 16}px) scale(${0.88 + 0.12 * e})`,
                }}
              >
                {w}
                {ehRisco && rp > 0 ? <span style={{ position: "absolute", left: 0, top: "52%", height: tamanho * 0.09, width: `${rp * 100}%`, background: cor.alerta, borderRadius: 4 }} /> : null}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ——— abertura ———
export const AberturaBloco: React.FC<P<Abertura>> = ({ m, t, fim }) => {
  const em = m.em ?? m.de;
  const e = encaixar(m.texto, { largura: 660, max: 112, min: 56, linhas: 2, fonte: { peso: 800 } });
  const h = e.linhas.length * e.tamanho * 1.12 + 70;
  return (
    <Laje x={Z.x} y={120} w={Z.w} h={h} t={t} em={m.de} fim={fim} seed={1} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px" }}>
      <TextoPalavras texto={m.texto} t={t} em={em} ate={m.ate} largura={660} max={112} min={56} linhas={2} destaque={m.destaque} />
    </Laje>
  );
};

// ——— topicos e passos ———
export const ListaBloco: React.FC<P<Topicos | Passos>> = ({ m, t, fim }) => {
  const n = m.itens.length;
  const passos = m.tipo === "passos";
  const titulo = m.titulo;
  const hTitulo = titulo ? 120 : 0;
  const gap = 30;
  const disp = Z.h - hTitulo - (titulo ? 30 : 0) - 24;
  const h = clamp((disp - gap * (n - 1)) / n, 120, 190);
  const total = h * n + gap * (n - 1) + hTitulo + (titulo ? 30 : 0);
  const y0 = Z.y + (Z.h - total) / 2 - 10;
  const d = Math.min(h * 0.6, 100);
  const tTitulo = m.de;
  return (
    <>
      {titulo ? (
        <Laje x={Z.x} y={y0} w={Z.w} h={hTitulo} t={t} em={tTitulo} fim={fim} seed={9} fundo={cor.placa} style={{ color: cor.clara, display: "flex", alignItems: "center", padding: "0 44px", boxShadow: sombraLaje }}>
          {(() => {
            const e = encaixar(titulo, { largura: Z.w - 90, max: 58, min: 36, linhas: 1, fonte: { peso: 800 } });
            return <span style={{ fontWeight: 800, fontSize: e.tamanho, color: cor.clara }}>{e.linhas.join(" ")}</span>;
          })()}
        </Laje>
      ) : null}
      {/* a sonda que liga os passos */}
      {passos
        ? m.itens.slice(1).map((it, i) => {
            const yA = y0 + hTitulo + (titulo ? 30 : 0) + i * (h + gap) + h / 2;
            const grow = prog(t, it.em - 0.1, 0.32, rapido);
            return <div key={i} style={{ position: "absolute", left: Z.x + 44 + d / 2 - 4, top: yA, width: 8, height: (h + gap) * grow, background: cor.sonar, opacity: (1 - saindo(t, fim, 0.3)) * 0.9, borderRadius: 4 }} />;
          })
        : null}
      {m.itens.map((it, i) => {
        const y = y0 + hTitulo + (titulo ? 30 : 0) + i * (h + gap);
        const ultimo = m.itens.filter((x) => x.em <= t).length - 1 === i;
        const larg = Z.w - 44 - d - 70;
        const texto = encaixar(it.texto, { largura: larg, max: 62, min: 36, linhas: it.detalhe ? 1 : 2, fonte: { peso: 800 } });
        const det = it.detalhe ? encaixar(it.detalhe, { largura: larg, max: 38, min: 28, linhas: 2, fonte: { peso: 500 } }) : null;
        return (
          <Laje
            key={i}
            x={Z.x + (i % 2 ? 22 : 0)}
            y={y}
            w={Z.w - 22}
            h={h}
            t={t}
            em={it.em}
            fim={fim}
            seed={i + 2}
            borda={ultimo ? cor.enfase : undefined}
            extra={{ escala: ultimo ? 1.015 : 1 }}
            style={{ display: "flex", alignItems: "center", paddingLeft: 40, gap: 34 }}
          >
            <div style={{ width: d, height: d, flex: "none", borderRadius: d, background: passos ? cor.enfase : cor.agua1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {passos ? (
                <span style={{ fontFamily: mono, fontWeight: 700, fontSize: d * 0.5, color: cor.tinta }}>{i + 1}</span>
              ) : (
                <svg width={d * 0.5} height={d * 0.5} viewBox="0 0 24 24">
                  <path d="M12 2l8 10-8 10-8-10z" fill={cor.clara} />
                </svg>
              )}
            </div>
            <div style={{ flex: 1, paddingRight: 30 }}>
              <div style={{ fontWeight: 800, fontSize: texto.tamanho, lineHeight: 1.08 }}>
                {texto.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
              {det ? (
                <div style={{ fontWeight: 500, fontSize: det.tamanho, lineHeight: 1.12, color: cor.tintaSuave, marginTop: 6, opacity: prog(t, it.em + 0.25, 0.3) }}>
                  {det.linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </Laje>
        );
      })}
    </>
  );
};
export const TopicosBloco = ListaBloco;
export const PassosBloco = ListaBloco;

// ——— numero ———
export const NumeroBloco: React.FC<P<Numero>> = ({ m, t, fim }) => {
  const casas = m.casas ?? 0;
  const c = prog(t, m.em, 1.1, rapido);
  const valor = m.valor * c;
  const txt = `${m.prefixo ?? ""}${formatar(valor, casas)}${m.sufixo ?? ""}`;
  const cheio = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const e = encaixar(cheio, { largura: Z.w - 100, max: 260, min: 120, linhas: 1, fonte: { peso: 800 } });
  const rot = encaixar(m.rotulo, { largura: Z.w - 120, max: 62, min: 38, linhas: 3, fonte: { peso: 700 } });
  const alto = e.tamanho * 1.1 + rot.linhas.length * rot.tamanho * 1.15 + 130;
  const y = Z.y + (Z.h - alto) / 2;
  const rp = prog(t, m.rotuloEm ?? m.em + 0.5, 0.3, rapido);
  const ping = prog(t, m.em + 1.1, 0.8, rapido);
  return (
    <>
      <Laje x={Z.x} y={y} w={Z.w} h={alto} t={t} em={m.de} fim={fim} seed={3} style={{ padding: "34px 50px", textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: e.tamanho, lineHeight: 1.05, color: cor.tinta, fontVariantNumeric: "tabular-nums", transform: t < m.em ? "scale(0.9)" : undefined, opacity: t >= m.em ? 1 : 0 }}>{txt}</div>
        <div style={{ height: 12, width: `${c * 70}%`, margin: "10px auto 18px", background: cor.enfase, borderRadius: 8 }} />
        <div style={{ fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.12, color: cor.tintaSuave, opacity: rp }}>
          {rot.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        {m.ilustrativo ? <div style={{ position: "absolute", right: 34, top: 22, fontFamily: mono, fontWeight: 700, fontSize: 28, color: cor.enfaseEscura }}>ILUSTRATIVO</div> : null}
      </Laje>
      {ping < 1 ? <div style={{ position: "absolute", left: 540 - 60 - 500 * ping, top: y + alto / 2 - 60 - 500 * ping, width: 120 + 1000 * ping, height: 120 + 1000 * ping, borderRadius: "50%", border: `${Math.max(1, 8 * (1 - ping))}px solid ${cor.sonar}`, opacity: 1 - ping }} /> : null}
    </>
  );
};

// ——— comparacao ———
export const ComparacaoBloco: React.FC<P<Comparacao>> = ({ m, t, fim }) => {
  const modo = m.modo ?? "contra";
  const w = 456;
  const h = 640;
  const y = Z.y + 60;
  const ve = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.8;
  const decidiu = m.vencedor !== undefined && t >= ve;
  const wp = prog(t, ve, 0.4, salto);
  return (
    <>
      {m.titulo ? (
        <Laje x={Z.x} y={Z.y - 10} w={Z.w} h={96} t={t} em={m.de} fim={fim} seed={20} fundo={cor.placa} style={{ color: cor.clara, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: sombraLaje }}>
          {(() => {
            const e = encaixar(m.titulo, { largura: Z.w - 90, max: 52, min: 34, linhas: 1, fonte: { peso: 800 } });
            return <span style={{ fontWeight: 800, fontSize: e.tamanho }}>{e.linhas.join(" ")}</span>;
          })()}
        </Laje>
      ) : null}
      {m.lados.map((l, i) => {
        const ganhou = decidiu && m.vencedor === i;
        const perdeu = decidiu && m.vencedor !== undefined && m.vencedor !== i;
        const e = encaixar(l.texto, { largura: w - 70, max: 56, min: 34, linhas: 5, fonte: { peso: 800 } });
        const r = encaixar(l.rotulo, { largura: w - 90, max: 38, min: 28, linhas: 1, fonte: { peso: 700, caixaAlta: true } });
        const certo = modo === "errado-certo" ? (i === 1 ? cor.certo : cor.alerta) : i === 0 ? cor.agua1 : cor.enfase;
        return (
          <Laje
            key={i}
            x={Z.x + i * (w + 48)}
            y={y + (m.titulo ? 56 : 0)}
            w={w}
            h={h}
            t={t}
            em={l.em - 0.1}
            fim={fim}
            seed={i + 4}
            borda={ganhou ? cor.enfase : undefined}
            extra={{ dy: ganhou ? -18 * wp : perdeu ? 34 * wp : 0, escala: ganhou ? 1 + 0.04 * wp : 1, opacidade: perdeu ? 1 - 0.4 * wp : 1 }}
            style={{ padding: "34px 34px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 26px", borderRadius: 40, background: certo, color: modo === "errado-certo" ? cor.tinta : i === 0 ? cor.clara : cor.tinta, fontWeight: 700, fontSize: r.tamanho, letterSpacing: "0.05em" }}>
              {modo === "errado-certo" ? <Icone nome={i === 1 ? "certo" : "errado"} tamanho={r.tamanho + 4} cor={cor.tinta} traco={3.2} /> : null}
              {r.linhas.join(" ")}
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", fontWeight: 800, fontSize: e.tamanho, lineHeight: 1.1 }}>
              <div>
                {e.linhas.map((ln, k) => (
                  <div key={k}>{ln}</div>
                ))}
              </div>
            </div>
          </Laje>
        );
      })}
      {modo === "contra" && !decidiu ? (
        <div style={{ position: "absolute", left: 540 - 56, top: y + (m.titulo ? 56 : 0) + h / 2 - 56, width: 112, height: 112, borderRadius: 56, background: cor.placa, color: cor.clara, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 44, opacity: prog(t, Math.max(m.lados[0].em, m.lados[1].em), 0.25) * (1 - saindo(t, fim, 0.3)) }}>
          VS
        </div>
      ) : null}
    </>
  );
};

// ——— grafico ———
const ESCALA = [cor.agua1, cor.sonar, cor.geloFundo, cor.agua2, "#7FC8E8", "#2F8FB8"];
export const GraficoBloco: React.FC<P<Grafico>> = ({ m, t, fim }) => {
  const dados = m.dados ?? [];
  const h = 760;
  const y = Z.y + 20;
  const innerX = Z.x + 60;
  const innerW = Z.w - 120;
  const baseY = y + h - 150;
  const altoMax = 440;
  const titulo = m.titulo ? encaixar(m.titulo, { largura: Z.w - 100, max: 52, min: 34, linhas: 2, fonte: { peso: 800 } }) : null;
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
  const maiorIdx = dados.reduce((a, d, i) => (d.valor > dados[a].valor ? i : a), 0);
  const fmt = (v: number) => `${formatar(v, Number.isInteger(v) ? 0 : 1)}${m.unidade ? (m.unidade.length <= 2 ? "" : " ") + m.unidade : ""}`;
  return (
    <Laje x={Z.x} y={y} w={Z.w} h={h} t={t} em={m.de} fim={fim} seed={6}>
      {titulo ? (
        <div style={{ position: "absolute", left: 50, right: 50, top: 30, fontWeight: 800, fontSize: titulo.tamanho, lineHeight: 1.1, textAlign: "center" }}>
          {titulo.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : null}
      {dados.length > 0 && m.forma === "barras"
        ? (() => {
            const gap = 26;
            const bw = (innerW - gap * (dados.length - 1)) / dados.length;
            return dados.map((d, i) => {
              const p = prog(t, d.em, 0.7, rapido);
              const bh = (d.valor / max) * altoMax * p;
              const r = encaixar(d.rotulo, { largura: bw + 10, max: 34, min: 24, linhas: 2, fonte: { peso: 700 } });
              return (
                <div key={i}>
                  <div style={{ position: "absolute", left: innerX - Z.x + i * (bw + gap), top: baseY - y - bh, width: bw, height: bh, borderRadius: "18px 18px 6px 6px", background: i === maiorIdx ? `linear-gradient(180deg, ${cor.enfase}, ${cor.enfaseEscura})` : `linear-gradient(180deg, ${cor.sonar}, ${cor.agua1})` }} />
                  {p > 0.05 ? <div style={{ position: "absolute", left: innerX - Z.x + i * (bw + gap) - 20, width: bw + 40, textAlign: "center", top: baseY - y - bh - 50, fontWeight: 800, fontSize: 40, fontFamily: mono, opacity: Math.min(1, p * 2) }}>{fmt(d.valor * p)}</div> : null}
                  <div style={{ position: "absolute", left: innerX - Z.x + i * (bw + gap) - 5, width: bw + 10, textAlign: "center", top: baseY - y + 18, fontWeight: 700, fontSize: r.tamanho, lineHeight: 1.08, color: cor.tintaSuave, opacity: prog(t, d.em, 0.3) }}>
                    {r.linhas.map((l, k) => (
                      <div key={k}>{l}</div>
                    ))}
                  </div>
                </div>
              );
            });
          })()
        : null}
      {dados.length > 0 && m.forma === "linha"
        ? (() => {
            const passoX = dados.length > 1 ? innerW / (dados.length - 1) : 0;
            const pts = dados.map((d, i) => ({ x: 60 + i * passoX, y: baseY - y - (d.valor / max) * altoMax, d }));
            const visiveis = pts.filter((p) => t >= p.d.em);
            const ultimo = visiveis.length - 1;
            const trecho = ultimo >= 0 && ultimo < pts.length - 1 ? prog(t, pts[ultimo].d.em, 0.5, rapido) : 0;
            const caminho = visiveis.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
            const prox = ultimo >= 0 && pts[ultimo + 1] ? { x: pts[ultimo].x + (pts[ultimo + 1].x - pts[ultimo].x) * trecho, y: pts[ultimo].y + (pts[ultimo + 1].y - pts[ultimo].y) * trecho } : null;
            return (
              <>
                <svg width={Z.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <line x1={40} x2={Z.w - 40} y1={baseY - y} y2={baseY - y} stroke={cor.geloFundo} strokeWidth={4} />
                  {visiveis.length ? <path d={caminho + (prox ? ` L${prox.x},${prox.y}` : "")} fill="none" stroke={cor.agua1} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /> : null}
                  {visiveis.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={i === maiorIdx && p.d === dados[maiorIdx] ? 20 : 15} fill={p.d === dados[maiorIdx] ? cor.enfase : cor.clara} stroke={cor.agua1} strokeWidth={6} />
                  ))}
                </svg>
                {visiveis.map((p, i) => (
                  <div key={i}>
                    <div style={{ position: "absolute", left: p.x - 100, width: 200, textAlign: "center", top: p.y - 64, fontWeight: 800, fontSize: 38, fontFamily: mono }}>{fmt(p.d.valor)}</div>
                    <div style={{ position: "absolute", left: p.x - 100, width: 200, textAlign: "center", top: baseY - y + 18, fontWeight: 700, fontSize: 30, color: cor.tintaSuave }}>{p.d.rotulo}</div>
                  </div>
                ))}
              </>
            );
          })()
        : null}
      {dados.length > 0 && m.forma === "pizza"
        ? (() => {
            const R = 210;
            const cx = 300;
            const cy = (titulo ? 90 : 40) + (h - 60 - (titulo ? 90 : 40)) / 2;
            let acc = 0;
            return (
              <>
                <svg width={Z.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  {dados.map((d, i) => {
                    const a0 = (acc / soma) * Math.PI * 2 - Math.PI / 2;
                    const p = prog(t, d.em, 0.6, rapido);
                    acc += d.valor;
                    const a1 = a0 + (d.valor / soma) * Math.PI * 2 * p;
                    if (p <= 0.001) return null;
                    const grande = a1 - a0 > Math.PI ? 1 : 0;
                    const pt = (a: number) => `${cx + Math.cos(a) * R},${cy + Math.sin(a) * R}`;
                    return <path key={i} d={`M${cx},${cy} L${pt(a0)} A${R},${R} 0 ${grande} 1 ${pt(a1)} Z`} fill={i === maiorIdx ? cor.enfase : ESCALA[i % ESCALA.length]} stroke={cor.gelo} strokeWidth={6} />;
                  })}
                </svg>
                {dados.map((d, i) => (
                  <div key={i} style={{ position: "absolute", left: 560, top: cy - (dados.length * 78) / 2 + i * 78, width: 380, display: "flex", alignItems: "center", gap: 16, opacity: prog(t, d.em, 0.3), fontWeight: 700, fontSize: 34 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flex: "none", background: i === maiorIdx ? cor.enfase : ESCALA[i % ESCALA.length] }} />
                    <span>{d.rotulo}</span>
                    <span style={{ marginLeft: "auto", fontFamily: mono, fontWeight: 700 }}>{fmt(d.valor)}</span>
                  </div>
                ))}
              </>
            );
          })()
        : null}
      {dados.length === 0 ? <Tendencia m={m} t={t} w={Z.w} h={h} baseY={baseY - y} /> : null}
    </Laje>
  );
};

const Tendencia: React.FC<{ m: Grafico; t: number; w: number; h: number; baseY: number }> = ({ m, t, w, h, baseY }) => {
  const forma = m.tendencia ?? "sobe";
  const em = m.tendenciaEm ?? m.de + 0.4;
  const p = prog(t, em, 1.3, rapido);
  const x0 = 80;
  const x1 = w - 80;
  const top = 200;
  const ptsDe = (f: number) => {
    const u = f;
    const x = x0 + (x1 - x0) * u;
    const alto = baseY - top;
    const v = forma === "sobe" ? u * u * 0.4 + u * 0.6 : forma === "cai" ? 1 - (u * u * 0.4 + u * 0.6) : 0.5 + Math.sin(u * Math.PI * 3.2) * 0.3 * (1 - u * 0.2) + u * 0.1;
    return [x, baseY - 40 - v * (alto - 40)] as const;
  };
  const n = Math.max(2, Math.round(60 * p));
  const caminho = Array.from({ length: n }, (_, i) => ptsDe(i / 59)).map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const [fx, fy] = ptsDe((n - 1) / 59);
  const cor_ = forma === "cai" ? cor.alerta : forma === "sobe" ? cor.certo : cor.enfase;
  return (
    <>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={x0 - 20} x2={x1 + 20} y1={baseY} y2={baseY} stroke={cor.geloFundo} strokeWidth={4} />
        <line x1={x0 - 20} x2={x0 - 20} y1={top - 30} y2={baseY} stroke={cor.geloFundo} strokeWidth={4} />
        <path d={caminho} fill="none" stroke={cor_} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={fx} cy={fy} r={20} fill={cor.clara} stroke={cor_} strokeWidth={8} />
      </svg>
      <div style={{ position: "absolute", right: 40, bottom: 30, fontFamily: mono, fontWeight: 700, fontSize: 30, color: cor.enfaseEscura, opacity: prog(t, em, 0.3) }}>ILUSTRATIVO</div>
    </>
  );
};

// ——— destaque ———
export const DestaqueBloco: React.FC<P<Destaque>> = ({ m, t, fim }) => {
  const alerta = m.nivel === "alerta";
  const e = encaixar(m.texto, { largura: Z.w - 110, max: 130, min: 60, linhas: 3, fonte: { peso: 800 } });
  const alto = e.linhas.length * e.tamanho * 1.1 + 190;
  const y = Z.y + 90;
  const c = carimbo(t, m.em, alerta ? -2 : 0, 0.22);
  const det = m.detalhe ? encaixar(m.detalhe, { largura: Z.w - 120, max: 46, min: 32, linhas: 2, fonte: { peso: 700 } }) : null;
  const dp = prog(t, m.detalheEm ?? m.em + 0.7, 0.3, rapido);
  return (
    <>
      <Laje x={Z.x} y={y} w={Z.w} h={alto} t={t} em={m.de} fim={fim} seed={5} borda={alerta ? cor.alerta : undefined} style={{ textAlign: "center", padding: "30px 50px", overflow: "visible" }}>
        <div style={{ width: 92, height: 92, borderRadius: 46, background: alerta ? cor.alerta : cor.enfase, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {alerta ? <span style={{ fontWeight: 800, fontSize: 64, color: cor.clara, lineHeight: 1 }}>!</span> : (
            <svg width={48} height={48} viewBox="0 0 24 24"><path d="M12 2l8 10-8 10-8-10z" fill={cor.tinta} /></svg>
          )}
        </div>
        <div style={{ fontWeight: 800, fontSize: e.tamanho, lineHeight: 1.1, opacity: c.visivel ? c.opacity : 0, transform: c.transform, color: alerta ? "#B3243D" : cor.tinta }}>
          {e.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </Laje>
      {det ? (
        <div style={{ position: "absolute", left: Z.x + 60, width: Z.w - 120, top: y + alto + 50, padding: "18px 34px", borderRadius: 34, background: cor.placa, color: cor.clara, fontWeight: 700, fontSize: det.tamanho, lineHeight: 1.12, textAlign: "center", fontFamily: fonte, opacity: dp * (1 - saindo(t, fim, 0.3)), transform: `translateY(${(1 - dp) * 30}px)` }}>
          {det.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      ) : null}
    </>
  );
};

// ——— definicao ———
export const DefinicaoBloco: React.FC<P<Definicao>> = ({ m, t, fim }) => {
  const e = encaixar(m.termo, { largura: Z.w - 120, max: 130, min: 64, linhas: 2, fonte: { peso: 800 } });
  const hT = e.linhas.length * e.tamanho * 1.08 + 90;
  const yT = Z.y + 30;
  const sig = encaixar(m.significado, { largura: Z.w - 120, max: 58, min: 36, linhas: 5, fonte: { peso: 700 } });
  const hS = sig.linhas.length * sig.tamanho * 1.15 + 80;
  const ySig = yT + hT + 56;
  const ping = prog(t, m.em, 0.8, rapido);
  const grow = prog(t, m.significadoEm - 0.15, 0.3, rapido);
  return (
    <>
      <div style={{ position: "absolute", left: 536 - 0, top: yT + hT - 10, width: 8, height: 66 * grow, background: cor.sonar, borderRadius: 4, opacity: 1 - saindo(t, fim, 0.3) }} />
      <Laje x={Z.x} y={yT} w={Z.w} h={hT} t={t} em={m.de} fim={fim} seed={7} fundo={cor.placa} style={{ color: cor.clara, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 40px", boxShadow: sombraLaje }}>
        <div style={{ fontWeight: 800, fontSize: e.tamanho, lineHeight: 1.08, textAlign: "center", color: cor.clara, opacity: t >= m.em ? 1 : 0 }}>
          {e.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </Laje>
      {ping < 1 ? <div style={{ position: "absolute", left: 540 - 400 * ping, top: yT + hT / 2 - 100 * ping * 2, width: 800 * ping, height: 200 * ping, borderRadius: 100, border: `${Math.max(1, 7 * (1 - ping))}px solid ${cor.sonar}`, opacity: 1 - ping }} /> : null}
      <Laje x={Z.x} y={ySig} w={Z.w} h={hS} t={t} em={m.significadoEm - 0.15} fim={fim} seed={8} style={{ padding: "40px 60px", textAlign: "center" }}>
        <TextoPalavras texto={m.significado} t={t} em={m.significadoEm} ate={m.ate} largura={Z.w - 120} max={58} min={36} linhas={5} cor={cor.tinta} />
      </Laje>
    </>
  );
};

// ——— frase ———
export const FraseBloco: React.FC<P<Frase>> = ({ m, t, fim }) => {
  const em = m.em ?? m.de;
  const e = encaixar(m.texto, { largura: Z.w - 130, max: 100, min: 52, linhas: 5, fonte: { peso: 800 } });
  const alto = e.linhas.length * e.tamanho * 1.12 + 230;
  const y = Z.y + (Z.h - alto) / 2 - 20;
  return (
    <Laje x={Z.x} y={y} w={Z.w} h={alto} t={t} em={m.de} fim={fim} seed={11} style={{ padding: "150px 60px 50px", textAlign: "center" }}>
      <svg width={120} height={96} viewBox="0 0 48 38" style={{ position: "absolute", left: 50, top: 28 }}>
        <path d="M0 38V22C0 10 6 2 18 0l2 6C14 8 11 12 11 17h8v21zm26 0V22C26 10 32 2 44 0l2 6c-6 2-9 6-9 11h8v21z" fill={cor.enfase} />
      </svg>
      <TextoPalavras texto={m.texto} t={t} em={em} ate={m.ate} largura={Z.w - 130} max={100} min={52} linhas={5} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
    </Laje>
  );
};

// ——— pergunta ———
export const PerguntaBloco: React.FC<P<Pergunta>> = ({ m, t, fim }) => {
  const em = m.em ?? m.de;
  const ops = m.opcoes ?? [];
  const e = encaixar(m.texto, { largura: Z.w - 110, max: 92, min: 50, linhas: 3, fonte: { peso: 800 } });
  const hQ = e.linhas.length * e.tamanho * 1.12 + 90;
  const hO = ops.length ? clamp((Z.h - hQ - 60 - (ops.length - 1) * 24 - 60) / ops.length, 110, 150) : 0;
  const total = hQ + (ops.length ? 50 + ops.length * hO + (ops.length - 1) * 24 : 0);
  const y0 = Z.y + (Z.h - total) / 2 - 10;
  return (
    <>
      <Laje x={Z.x} y={y0} w={Z.w} h={hQ} t={t} em={m.de} fim={fim} seed={12} style={{ padding: "40px 50px", textAlign: "center" }}>
        <TextoPalavras texto={m.texto} t={t} em={em} ate={m.ate} largura={Z.w - 110} max={92} min={50} linhas={3} />
      </Laje>
      {ops.map((o, i) => {
        const eo = encaixar(o.texto, { largura: Z.w - 260, max: 56, min: 34, linhas: 2, fonte: { peso: 800 } });
        return (
          <Laje key={i} x={Z.x + 40} y={y0 + hQ + 50 + i * (hO + 24)} w={Z.w - 80} h={hO} t={t} em={o.em} fim={fim} seed={i + 13} style={{ display: "flex", alignItems: "center", gap: 30, paddingLeft: 36 }}>
            <div style={{ width: hO * 0.62, height: hO * 0.62, flex: "none", borderRadius: hO, background: cor.agua1, color: cor.clara, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 700, fontSize: hO * 0.34 }}>{String.fromCharCode(65 + i)}</div>
            <div style={{ fontWeight: 800, fontSize: eo.tamanho, lineHeight: 1.1 }}>
              {eo.linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          </Laje>
        );
      })}
    </>
  );
};

// ——— cta ———
export const CtaBloco: React.FC<P<Cta>> = ({ m, t, fim }) => {
  const em = m.em ?? m.de;
  const e = encaixar(m.texto, { largura: Z.w - 330, max: 82, min: 46, linhas: 3, fonte: { peso: 800 } });
  const alto = Math.max(300, e.linhas.length * e.tamanho * 1.12 + 120);
  const y = Z.y + (Z.h - alto) / 2 - 30;
  const ciclo = (t * 0.9) % 1;
  const D = 150;
  return (
    <Laje x={Z.x} y={y} w={Z.w} h={alto} t={t} em={m.de} fim={fim} seed={14} style={{ display: "flex", alignItems: "center", paddingLeft: 56, gap: 44 }}>
      <div style={{ position: "relative", width: D, height: D, flex: "none" }}>
        <div style={{ position: "absolute", inset: -ciclo * 50, borderRadius: "50%", border: `${5 * (1 - ciclo)}px solid ${cor.enfase}`, opacity: 1 - ciclo }} />
        <div style={{ width: D, height: D, borderRadius: D, background: cor.enfase, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome={m.icone ?? "comentar"} tamanho={D * 0.55} cor={cor.tinta} traco={2.4} />
        </div>
      </div>
      <div style={{ flex: 1, paddingRight: 40 }}>
        <TextoPalavras texto={m.texto} t={t} em={em} ate={m.ate} largura={Z.w - 330} max={82} min={46} linhas={3} align="left" destaque={m.destaque} />
      </div>
    </Laje>
  );
};
void larguraTexto;
