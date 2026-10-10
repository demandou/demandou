// Blocos do painel de linho (metade de cima): lista, comparação, gráfico, definição e pergunta.
// Cartões claros com cantos redondos, números em discos verdes, tudo no ritmo da fala.
import { AREA } from "../layout";
import { formatar, prog, rapido, salto, temposDoTexto, usePalavras } from "../anim";
import { encaixar } from "../medida";
import type { Comparacao as TComparacao, Definicao as TDefinicao, Grafico as TGrafico, Passos as TPassos, Pergunta as TPergunta, Plano, Topicos as TTopicos } from "../plano";
import { cor, fonte, sombraCartao, sombraLeve } from "../tema";
import { Disco } from "./Cortina";
import { TextoNaFala } from "./Peito";

export type PropsPainel = { t: number; plano: Plano; t0: number; saiCruzando: boolean; ate: number };

const saida = (t: number, ate: number, cruza: boolean) => (cruza ? prog(t, ate - 0.2, 0.2) : 0);

// título do painel: texto pequeno e firme, com um traço verde antes
const Titulo: React.FC<{ t: number; texto?: string; em: number }> = ({ t, texto, em }) => {
  if (!texto) return null;
  const e = prog(t, em, 0.3, rapido);
  const enc = encaixar(texto, { largura: AREA.w - 70, max: 62, min: 40, linhas: 2, fonte: { peso: 800 } });
  return (
    <div style={{ position: "absolute", left: AREA.x, top: AREA.topo, width: AREA.w, opacity: e, transform: e < 1 ? `translateY(${(1 - e) * 20}px)` : undefined }}>
      <div style={{ position: "absolute", left: 0, top: 6, width: 12, height: enc.linhas.length * enc.tamanho * 1.1, borderRadius: 6, background: cor.depois }} />
      <div style={{ marginLeft: 36 }}>
        {enc.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, lineHeight: 1.1, color: cor.tinta, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
const alturaTitulo = (texto?: string) => (texto ? encaixar(texto, { largura: AREA.w - 70, max: 62, min: 40, linhas: 2, fonte: { peso: 800 } }).linhas.length * 66 + 40 : 0);

const Casca: React.FC<{ t: number; ate: number; cruza: boolean; children: React.ReactNode }> = ({ t, ate, cruza, children }) => (
  <div style={{ position: "absolute", inset: 0, opacity: 1 - saida(t, ate, cruza) }}>{children}</div>
);

// ——— lista (topicos = marcas verdes; passos = discos numerados) ———
export const Lista: React.FC<PropsPainel & { m: TTopicos | TPassos }> = ({ m, t, plano, t0, saiCruzando, ate }) => {
  const palavras = usePalavras();
  const n = m.itens.length;
  const topo = AREA.topo + alturaTitulo(m.titulo);
  const vao = 22;
  const alt = Math.min(210, (AREA.base - topo - vao * (n - 1)) / n);
  const D = Math.min(100, alt * 0.62);
  return (
    <Casca t={t} ate={ate} cruza={saiCruzando}>
      <Titulo t={t} texto={m.titulo} em={t0 + 0.05} />
      {m.itens.map((it, i) => {
        const e = prog(t, it.em - 0.05, 0.3, salto);
        if (t < it.em - 0.05) return null;
        const largT = AREA.w - D - 110;
        const enc = encaixar(it.texto, { largura: largT, max: 58, min: 38, linhas: 2, fonte: { peso: 800 } });
        const det = it.detalhe ? encaixar(it.detalhe, { largura: largT, max: 36, min: 28, linhas: 1, fonte: { peso: 500 } }) : null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: AREA.x,
              top: topo + i * (alt + vao),
              width: AREA.w,
              height: alt,
              borderRadius: 28,
              background: cor.cartao,
              boxShadow: sombraLeve,
              opacity: Math.min(1, e * 2),
              transform: e < 1 ? `translateX(${(1 - e) * -50}px) scale(${0.96 + 0.04 * e})` : undefined,
            }}
          >
            <div style={{ position: "absolute", left: 30, top: (alt - D) / 2 }}>
              {m.tipo === "passos" ? (
                <Disco n={i + 1} d={D} anel={false} />
              ) : (
                <div style={{ width: D, height: D, borderRadius: "50%", background: cor.depoisClaro, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={D * 0.5} height={D * 0.5} viewBox="0 0 24 24">
                    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={cor.depois} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ position: "absolute", left: 30 + D + 30, top: 0, height: alt, width: largT, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <TextoNaFala t={t} texto={it.texto} em={it.em} ate={it.em + 3} tamanho={enc.tamanho} linhas={enc.linhas} alinhar="left" />
              {det ? (
                <div style={{ marginTop: 6, fontFamily: fonte, fontWeight: 500, fontSize: det.tamanho, color: cor.depois, opacity: prog(t, it.em + 0.5, 0.3), whiteSpace: "nowrap" }}>{det.linhas.join(" ")}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Casca>
  );
};

// ——— comparação: dois cartões lado a lado ———
export const Comparacao: React.FC<PropsPainel & { m: TComparacao }> = ({ m, t, t0, saiCruzando, ate }) => {
  const topo = AREA.topo + alturaTitulo(m.titulo);
  const alt = AREA.base - topo - 10;
  const W2 = (AREA.w - 28) / 2;
  const venceu = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, 0.35, salto) : 0;
  const modo = m.modo ?? "contra";
  const cores = modo === "contra" ? [cor.depois, cor.depoisEscuro] : [cor.alerta, cor.depois];
  return (
    <Casca t={t} ate={ate} cruza={saiCruzando}>
      <Titulo t={t} texto={m.titulo} em={t0 + 0.05} />
      {m.lados.map((l, i) => {
        const e = prog(t, l.em - 0.05, 0.35, salto);
        if (t < l.em - 0.05) return null;
        const ganha = m.vencedor === i;
        const apaga = m.vencedor !== undefined && !ganha ? venceu * 0.45 : 0;
        const enc = encaixar(l.texto, { largura: W2 - 70, max: 56, min: 36, linhas: 5, fonte: { peso: 800 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: AREA.x + i * (W2 + 28),
              top: topo,
              width: W2,
              height: alt,
              borderRadius: 32,
              background: cor.cartao,
              boxShadow: ganha && venceu > 0 ? `0 0 0 ${8 * venceu}px ${cor.depois}, ${sombraCartao}` : sombraLeve,
              opacity: Math.min(1, e * 2) * (1 - apaga),
              transform: e < 1 ? `translateY(${(1 - e) * 60}px)` : ganha && venceu > 0 && venceu < 1 ? `scale(${1 + 0.03 * venceu})` : undefined,
            }}
          >
            <div style={{ margin: 28, display: "inline-block", padding: "10px 24px", borderRadius: 18, background: cores[i], color: cor.cartao, fontFamily: fonte, fontWeight: 800, fontSize: 34, letterSpacing: "0.06em" }}>
              {l.rotulo.toLocaleUpperCase("pt-BR")}
            </div>
            <div style={{ padding: "6px 34px" }}>
              <TextoNaFala t={t} texto={l.texto} em={l.em} ate={l.em + 4} tamanho={enc.tamanho} linhas={enc.linhas} alinhar="left" />
            </div>
          </div>
        );
      })}
    </Casca>
  );
};

// ——— gráfico: barras, linha ou pizza ———
export const Grafico: React.FC<PropsPainel & { m: TGrafico }> = ({ m, t, t0, saiCruzando, ate }) => {
  const topo = AREA.topo + alturaTitulo(m.titulo) + 20;
  const base = AREA.base - 70;
  const dados = m.dados ?? [];
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const cx = AREA.x;
  const cw = AREA.w;
  const un = m.unidade ?? "";
  return (
    <Casca t={t} ate={ate} cruza={saiCruzando}>
      <Titulo t={t} texto={m.titulo} em={t0 + 0.05} />
      <div style={{ position: "absolute", left: cx, top: topo - 10, width: cw, height: base - topo + 80, borderRadius: 32, background: cor.cartao, boxShadow: sombraLeve }} />
      {m.forma === "barras" &&
        dados.map((d, i) => {
          const k = dados.length;
          const larg = Math.min(190, (cw - 80) / k - 30);
          const x = cx + 40 + (cw - 80) * ((i + 0.5) / k) - larg / 2;
          const p = prog(t, d.em, 0.7, rapido);
          const h = (base - topo - 90) * (d.valor / max) * p;
          if (t < d.em) return null;
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: x, top: base - h, width: larg, height: h, borderRadius: "18px 18px 0 0", background: i === dados.length - 1 ? cor.depois : cor.antes }} />
              <div style={{ position: "absolute", left: x - 20, width: larg + 40, top: base - h - 56, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: 44, color: cor.tinta, opacity: p }}>
                {formatar(d.valor * p, 0)}
                {un}
              </div>
              <div style={{ position: "absolute", left: x - 20, width: larg + 40, top: base + 14, textAlign: "center", fontFamily: fonte, fontWeight: 700, fontSize: 32, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{d.rotulo}</div>
            </div>
          );
        })}
      {m.forma === "linha" && (() => {
        const pts = dados.length >= 2 ? dados.map((d, i) => ({ x: cx + 70 + ((cw - 140) * i) / (dados.length - 1), y: base - 40 - (base - topo - 140) * (d.valor / max), em: d.em, r: d.rotulo })) : tendenciaPontos(m, cx, cw, topo, base);
        const ult = pts.length ? pts[pts.length - 1].em : t0;
        const ini = pts.length ? pts[0].em : t0;
        const p = prog(t, ini, Math.max(0.8, ult - ini + 0.4), rapido);
        const d = pts.map((q, i) => `${i ? "L" : "M"}${q.x},${q.y}`).join(" ");
        return (
          <svg width={1080} height={1160} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={d} fill="none" stroke={cor.depois} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
            {pts.map((q, i) => (t >= q.em ? <circle key={i} cx={q.x} cy={q.y} r={14} fill={cor.cartao} stroke={cor.depois} strokeWidth={8} /> : null))}
          </svg>
        );
      })()}
      {m.forma === "pizza" && (() => {
        const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
        let a0 = -Math.PI / 2;
        const R = 230;
        const cxp = 540;
        const cyp = (topo + base) / 2 - 10;
        const paleta = [cor.depois, cor.alerta, cor.antes, cor.depoisEscuro, cor.depoisClaro];
        return (
          <svg width={1080} height={1160} style={{ position: "absolute", left: 0, top: 0 }}>
            {dados.map((d, i) => {
              const ang = (d.valor / total) * Math.PI * 2 * prog(t, d.em, 0.6, rapido);
              const x0 = cxp + R * Math.cos(a0);
              const y0 = cyp + R * Math.sin(a0);
              const x1 = cxp + R * Math.cos(a0 + ang);
              const y1 = cyp + R * Math.sin(a0 + ang);
              const path = `M${cxp},${cyp} L${x0},${y0} A${R},${R} 0 ${ang > Math.PI ? 1 : 0} 1 ${x1},${y1} Z`;
              a0 += (d.valor / total) * Math.PI * 2;
              return t >= d.em ? <path key={i} d={path} fill={paleta[i % paleta.length]} stroke={cor.cartao} strokeWidth={6} /> : null;
            })}
          </svg>
        );
      })()}
      {m.ilustrativo ? <div style={{ position: "absolute", left: cx + 30, top: base + 62, fontFamily: fonte, fontWeight: 500, fontSize: 28, color: cor.tintaApagada }}>valores ilustrativos</div> : null}
    </Casca>
  );
};

const tendenciaPontos = (m: TGrafico, cx: number, cw: number, topo: number, base: number) => {
  const alto = topo + 100;
  const baixo = base - 60;
  const forma = m.tendencia ?? "sobe";
  const ys = forma === "sobe" ? [0.9, 0.7, 0.5, 0.15] : forma === "cai" ? [0.15, 0.4, 0.6, 0.9] : [0.5, 0.15, 0.8, 0.3];
  const em = m.tendenciaEm ?? m.de;
  return ys.map((v, i) => ({ x: cx + 70 + ((cw - 140) * i) / 3, y: alto + (baixo - alto) * v, em: em + i * 0.25, r: "" }));
};

// ——— definição: o termo grande e o significado ———
export const Definicao: React.FC<PropsPainel & { m: TDefinicao }> = ({ m, t, saiCruzando, ate }) => {
  const e = prog(t, m.em - 0.05, 0.4, salto);
  const enc = encaixar(m.termo, { largura: 800, max: 120, min: 64, linhas: 2, fonte: { peso: 800 } });
  const sig = encaixar(m.significado, { largura: 820, max: 54, min: 36, linhas: 4, fonte: { peso: 700 } });
  return (
    <Casca t={t} ate={ate} cruza={saiCruzando}>
      <div style={{ position: "absolute", left: AREA.x, top: 230, width: AREA.w, height: 760, borderRadius: 36, background: cor.cartao, boxShadow: sombraCartao, opacity: Math.min(1, e * 2), transform: e < 1 ? `translateY(${(1 - e) * 50}px)` : undefined }}>
        <div style={{ margin: "44px 70px 0", fontFamily: fonte, fontWeight: 700, fontSize: 32, letterSpacing: "0.12em", color: cor.depois }}>O QUE É</div>
        <div style={{ margin: "14px 70px 0" }}>
          <TextoNaFala t={t} texto={m.termo} em={m.em} ate={m.em + 2} tamanho={enc.tamanho} linhas={enc.linhas} alinhar="left" corTexto={cor.tinta} />
        </div>
        <div style={{ margin: "30px 70px 0", height: 6, width: 160 * prog(t, m.em + 0.3, 0.4), borderRadius: 3, background: cor.depois }} />
        {t >= m.significadoEm - 0.05 ? (
          <div style={{ margin: "34px 70px 0", opacity: prog(t, m.significadoEm - 0.05, 0.25) }}>
            <TextoNaFala t={t} texto={m.significado} em={m.significadoEm} ate={m.significadoEm + 5} tamanho={sig.tamanho} linhas={sig.linhas} peso={700} alinhar="left" corTexto={cor.tintaSuave} />
          </div>
        ) : null}
      </div>
    </Casca>
  );
};

// ——— pergunta: o enunciado e as opções ———
export const Pergunta: React.FC<PropsPainel & { m: TPergunta }> = ({ m, t, saiCruzando, ate }) => {
  const palavras = usePalavras();
  void palavras;
  const em = m.em ?? m.de;
  const e = prog(t, em - 0.05, 0.4, salto);
  const enc = encaixar(m.texto, { largura: AREA.w - 100, max: 82, min: 48, linhas: 3, fonte: { peso: 800 } });
  const hq = enc.linhas.length * enc.tamanho * 1.14 + 100;
  const ops = m.opcoes ?? [];
  const topoOps = 190 + hq + 24;
  const altOp = ops.length ? Math.min(150, (AREA.base - topoOps - 18 * (ops.length - 1)) / ops.length) : 0;
  return (
    <Casca t={t} ate={ate} cruza={saiCruzando}>
      <div style={{ position: "absolute", left: AREA.x, top: 190, width: AREA.w, height: hq, borderRadius: 32, background: cor.depoisEscuro, boxShadow: sombraCartao, opacity: Math.min(1, e * 2), transform: e < 1 ? `translateY(${(1 - e) * 40}px)` : undefined }}>
        <div style={{ padding: "50px 50px" }}>
          <TextoNaFala t={t} texto={m.texto} em={em} ate={em + 4} tamanho={enc.tamanho} linhas={enc.linhas} alinhar="left" corTexto={cor.cartao} corDestaque={cor.depoisClaro} />
        </div>
      </div>
      {ops.map((o, i) => {
        if (t < o.em - 0.05) return null;
        const p = prog(t, o.em - 0.05, 0.3, salto);
        const oe = encaixar(o.texto, { largura: AREA.w - 190, max: 50, min: 34, linhas: 2, fonte: { peso: 800 } });
        return (
          <div key={i} style={{ position: "absolute", left: AREA.x, top: topoOps + i * (altOp + 18), width: AREA.w, height: altOp, borderRadius: 26, background: cor.cartao, boxShadow: sombraLeve, opacity: Math.min(1, p * 2), transform: p < 1 ? `translateX(${(1 - p) * 50}px)` : undefined }}>
            <div style={{ position: "absolute", left: 28, top: (altOp - 64) / 2 }}>
              <Disco n={String.fromCharCode(65 + i)} d={64} anel={false} fundo={cor.depoisClaro} tinta={cor.depoisEscuro} />
            </div>
            <div style={{ position: "absolute", left: 124, top: 0, height: altOp, display: "flex", alignItems: "center" }}>
              <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: oe.tamanho, color: cor.tinta, whiteSpace: "nowrap", lineHeight: 1.1 }}>
                {oe.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </Casca>
  );
};

export { temposDoTexto };
