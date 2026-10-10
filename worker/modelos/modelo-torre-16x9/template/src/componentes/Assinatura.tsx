// Camadas 2D por cima do palco 3D, da assinatura: letreiro do empreendimento (vira cabeçalho), selo, a
// coluna da esquerda (andares · tempo até o destino · área), rótulos presos aos pontos 3D (destino, ruas,
// paradas, cômodos — projeção da mesma câmera) e a etiqueta de preço.
import React from "react";
import { clamp01, EASE_IN, EASE_INOUT, EASE_OUT, keys, lerp, numeroBR, prog } from "../anim";
import { DESTINO, projetar, pontoDaRota, RUAS } from "../mundo/geo";
import { DADOS, noMundo, PLAN_Y } from "../mundo/plantaDados";
import type { Preco, Rota } from "../plano";
import { andarEm, andaresEm, type InfoPlanta, type InfoRota, type Roteiro } from "../roteiro";
import { encaixar, larguraTexto } from "../texto";
import { FONTE, K } from "../tema";
import { Icone, Pilula, Rise, rotuloCss, serifNum, SOMBRA } from "./comum";

const COL_X = 64;
const COL_Y = 318;
const COL_W = 540;

/* ---------- emblemas do letreiro ---------- */
const Emblema: React.FC<{ p: number; size: number; tipo: string }> = ({ p, size, tipo }) => {
  const arc = 2 * Math.PI * 30 * 0.5;
  const c = K.ouro;
  const base = <line x1={50 - 48 * p} y1={56} x2={50 + 48 * p} y2={56} stroke={c} strokeWidth={2.2} strokeLinecap="round" />;
  if (tipo === "folha")
    return (
      <svg width={size} height={size * 0.62} viewBox="0 0 100 62" style={{ overflow: "visible" }}>
        {base}
        <path d="M50 52 C 26 44, 28 14, 50 4 C 72 14, 74 44, 50 52 Z" fill="none" stroke={c} strokeWidth={2.4} strokeDasharray={140} strokeDashoffset={140 * (1 - prog(p, 0.25, 0.85))} />
        <line x1={50} y1={52} x2={50} y2={52 - 40 * prog(p, 0.5, 0.95)} stroke={c} strokeWidth={2} />
      </svg>
    );
  if (tipo === "onda")
    return (
      <svg width={size} height={size * 0.62} viewBox="0 0 100 62" style={{ overflow: "visible" }}>
        {base}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M14 ${44 - i * 12} C 26 ${34 - i * 12}, 38 ${34 - i * 12}, 50 ${44 - i * 12} S 74 ${54 - i * 12}, 86 ${44 - i * 12}`} fill="none" stroke={c} strokeWidth={2.4} strokeDasharray={90} strokeDashoffset={90 * (1 - prog(p, 0.25 + i * 0.15, 0.7 + i * 0.12))} />
        ))}
      </svg>
    );
  if (tipo === "estrela")
    return (
      <svg width={size} height={size * 0.62} viewBox="0 0 100 62" style={{ overflow: "visible" }}>
        {base}
        <path d="M50 6 L56 26 L76 28 L60 40 L66 54 L50 46 L34 54 L40 40 L24 28 L44 26 Z" fill="none" stroke={c} strokeWidth={2.2} strokeLinejoin="round" strokeDasharray={220} strokeDashoffset={220 * (1 - prog(p, 0.25, 0.9))} />
      </svg>
    );
  const rays = [-60, -30, 0, 30, 60];
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 100 62" style={{ overflow: "visible" }}>
      {base}
      <path d="M 20 56 A 30 30 0 0 1 80 56" fill="none" stroke={c} strokeWidth={2.6} strokeDasharray={arc} strokeDashoffset={arc * (1 - prog(p, 0.25, 0.85))} />
      {rays.map((a, i) => {
        const q = prog(p, 0.55 + i * 0.07, 0.8 + i * 0.07);
        const r = (a * Math.PI) / 180;
        return q > 0 ? <line key={i} x1={50 + Math.sin(r) * 38} y1={56 - Math.cos(r) * 38} x2={50 + Math.sin(r) * (38 + 12 * q)} y2={56 - Math.cos(r) * (38 + 12 * q)} stroke={c} strokeWidth={2.2} strokeLinecap="round" /> : null;
      })}
    </svg>
  );
};

/* ---------- letreiro do empreendimento: nasce grande por cima, vira cabeçalho no canto ---------- */
export const Cabecalho: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const c = R.cabecalho;
  if (!c || t < c.m.de - 0.1) return null;
  const m = c.m;
  const nome = m.nome ?? "";
  const nomeEm = m.nomeEm ?? m.de + 0.3;
  const catEm = m.categoriaEm ?? nomeEm - 0.4;
  const L = EASE_INOUT(clamp01((t - c.encolhe) / 0.58));
  const pE = prog(t, m.de + 0.02, catEm + 0.55, EASE_INOUT);
  const pR = prog(t, catEm - 0.04, catEm + 0.4);
  // o nome cabe: grande até 952 px; no cabeçalho até 600 px
  const wGrande = larguraTexto(nome, 176, FONTE.serifa, 600);
  const fGrande = Math.min(176, (176 * 952) / Math.max(1, wGrande));
  const wPeq = larguraTexto(nome, 98, FONTE.serifa, 600);
  const fPeq = Math.min(98, (98 * 600) / Math.max(1, wPeq));
  const left = lerp(540, 64, L);
  const ax = lerp(-50, 0, L);
  const eOut = 1 - L;
  const letras = Array.from(nome);
  const emblema = m.emblema ?? "nenhum";
  return (
    <div style={{ position: "absolute", inset: 0, filter: SOMBRA }}>
      {eOut > 0.01 && emblema !== "nenhum" ? (
        <div style={{ position: "absolute", left: 540, top: lerp(118, 60, L), transform: `translateX(-50%) scale(${lerp(1, 0.6, L)})`, opacity: eOut }}>
          <Emblema p={pE} size={150} tipo={emblema} />
        </div>
      ) : null}
      {m.categoria ? (
        <div style={{ position: "absolute", left, top: lerp(222, 128, L), transform: `translateX(${ax}%)` }}>
          <Rise p={pR} dy={30}>
            <div style={{ ...rotuloCss, fontSize: lerp(36, 28, L), letterSpacing: "0.46em", marginRight: "-0.46em" }}>{m.categoria}</div>
          </Rise>
        </div>
      ) : null}
      <div style={{ position: "absolute", left, top: lerp(m.categoria ? 262 : 230, 158, L), transform: `translateX(${ax}%)`, whiteSpace: "nowrap", fontFamily: FONTE.serifa, fontWeight: 600, fontSize: lerp(fGrande, fPeq, L), lineHeight: 1, letterSpacing: "-0.005em", color: K.marfim }}>
        {letras.map((ch, i) => {
          const q = prog(t, nomeEm - 0.1 + i * 0.035, nomeEm + 0.3 + i * 0.035, EASE_OUT);
          if (q >= 1) return <span key={i} style={{ whiteSpace: "pre" }}>{ch}</span>;
          return (
            <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: q, transform: `translateY(${(1 - q) * 0.25}em)`, filter: `blur(${(1 - q) * 10}px)` }}>
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- selo do canto ("imóvel ilustrativo", "lançamento") ---------- */
export const Selo: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const m = R.torre.m;
  if (!m?.selo) return null;
  const de = R.cabecalho ? R.cabecalho.encolhe + 0.48 : m.de;
  const preco = R.precos.find((p) => p.nota && p.em > de);
  const p = prog(t, de, de + 0.5) * (preco ? 1 - prog(t, preco.em, preco.em + 0.3) : 1);
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 64, top: 136, opacity: p, display: "flex", alignItems: "center", gap: 12, fontFamily: FONTE.sans, fontWeight: 600, fontSize: 28, letterSpacing: "0.04em", color: K.marfimSuave }}>
      <div style={{ width: 9, height: 9, borderRadius: 9, background: K.ouro }} />
      {m.selo}
    </div>
  );
};

/** número grande + unidade pequena dourada, cabendo na coluna */
const NumeroGrande: React.FC<{ texto: string; prefixo?: string; sufixo?: string; tam?: number; p: number; pSuf?: number; largura?: number }> = ({ texto, prefixo, sufixo, tam = 230, p, pSuf = 1, largura = COL_W }) => {
  const w = larguraTexto(texto, tam, FONTE.serifa, 600) + (prefixo ? larguraTexto(prefixo, tam * 0.42, FONTE.serifa, 600) + 14 : 0) + (sufixo ? larguraTexto(sufixo, tam * 0.42, FONTE.serifa, 600) + 14 : 0);
  const s = Math.min(tam, (tam * largura) / Math.max(1, w));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
      {prefixo ? (
        <Rise p={p} dy={40} style={{ paddingBottom: s * 0.08 }}>
          <div style={{ ...serifNum, fontSize: s * 0.42, color: K.ouroClaro }}>{prefixo}</div>
        </Rise>
      ) : null}
      <Rise p={p} dy={60}>
        <div style={{ ...serifNum, fontSize: s }}>{texto}</div>
      </Rise>
      {sufixo ? (
        <Rise p={pSuf} style={{ paddingBottom: s * 0.08 }}>
          <div style={{ ...serifNum, fontSize: s * 0.42, color: K.ouroClaro }}>{sufixo}</div>
        </Rise>
      ) : null}
    </div>
  );
};

/* ---------- coluna da torre: 01 → 18 andares · bairro ---------- */
export const ColunaTorre: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const T = R.torre;
  const m = T.m;
  if (!m) return null;
  const tiro = R.tiros.find((x) => x.m === m);
  const fim = tiro ? tiro.ate : m.ate;
  const pin = prog(t, m.em - 0.1, m.em + 0.25);
  const out = prog(t, fim - 0.05, fim + 0.35, EASE_IN);
  if (pin <= 0 || out >= 1) return null;
  const n = Math.max(1, andaresEm(T, t));
  const ult = andarEm(T, T.nf - 1);
  const casas = m.casas ?? 0;
  const v = n >= T.nf ? m.valor : (m.valor * n) / T.nf;
  const inteiro = casas === 0 && Number.isInteger(m.valor);
  const txt = inteiro && m.valor < 100 ? String(Math.round(v)).padStart(2, "0") : numeroBR(n >= T.nf ? m.valor : inteiro ? Math.round(v) : v, casas);
  const done = prog(t, ult + 0.1, ult + 0.6);
  return (
    <div style={{ position: "absolute", left: COL_X, top: COL_Y, opacity: 1 - out, filter: `${SOMBRA} blur(${out * 10}px)`, transform: `translateY(${-out * 30}px)` }}>
      <NumeroGrande texto={txt} prefixo={m.prefixo} sufixo={m.sufixo} p={pin} />
      <div style={{ height: 2, width: 220 * done, background: K.ouro, marginTop: 6, marginBottom: 16 }} />
      <Rise p={prog(t, (m.rotuloEm ?? m.em + 0.3) - 0.06, (m.rotuloEm ?? m.em + 0.3) + 0.3)}>
        <div style={{ ...rotuloCss, fontSize: 32 }}>{m.rotulo}</div>
      </Rise>
      {m.local ? (
        <Rise p={prog(t, (m.localEm ?? ult) - 0.06, (m.localEm ?? ult) + 0.35)} style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: FONTE.sans, fontWeight: 600, fontSize: 36, color: K.marfim, letterSpacing: "0.02em" }}>
            <svg width={26} height={34} viewBox="0 0 26 34">
              <path d="M13 33 C 13 33 2 19.5 2 12.5 A 11 11 0 0 1 24 12.5 C 24 19.5 13 33 13 33 Z" fill={K.ouro} />
              <circle cx={13} cy={12.5} r={4.2} fill={K.navy} />
            </svg>
            {m.local}
          </div>
        </Rise>
      ) : null}
      {m.andarDestaque?.texto ? (
        <Rise p={prog(t, m.andarDestaque.em - 0.06, m.andarDestaque.em + 0.35)} style={{ marginTop: 14 }}>
          <Pilula>
            <span style={{ ...rotuloCss, fontSize: 28, letterSpacing: "0.12em" }}>{m.andarDestaque.texto}</span>
          </Pilula>
        </Rise>
      ) : null}
    </div>
  );
};

/* ---------- coluna do mapa: 4 min · a pé · do metrô  /  lista de paradas ---------- */
const ICONE_MODO: Record<string, string> = { "a pé": "pe", "de carro": "carro", "de bicicleta": "bicicleta", "de ônibus": "onibus" };
const ListaDeParadas: React.FC<{ t: number; r: InfoRota; titulo?: string }> = ({ t, r, titulo }) => {
  const n = r.paradas.length;
  const tam = n >= 5 ? 38 : n === 4 ? 42 : 48;
  let atual = -1;
  r.paradas.forEach((p, i) => {
    if (t >= p.em - 0.1) atual = i;
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: n >= 5 ? 14 : 20, width: COL_W }}>
      {titulo ? (
        <Rise p={prog(t, r.tiro.de - 0.05, r.tiro.de + 0.35)}>
          <div style={{ ...rotuloCss, fontSize: 28, whiteSpace: "normal", lineHeight: 1.35 }}>{titulo}</div>
        </Rise>
      ) : null}
      {r.paradas.map((p, i) => {
        const q = prog(t, p.em - 0.08, p.em + 0.32);
        if (q <= 0) return null;
        const { tamanho, linhas } = encaixar(p.texto, COL_W - 96, tam, 28, 2, FONTE.sans, 700);
        return (
          <Rise key={i} p={q} dy={30}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 18, opacity: i === atual ? 1 : 0.55 }}>
              <div style={{ ...serifNum, fontSize: 64, color: K.ouroClaro, width: 78, lineHeight: 0.9 }}>{String(i + 1).padStart(2, "0")}</div>
              <div style={{ paddingTop: 6 }}>
                {linhas.map((l, k) => (
                  <div key={k} style={{ fontFamily: FONTE.sans, fontWeight: 700, fontSize: tamanho, lineHeight: 1.15, color: K.marfim }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </Rise>
        );
      })}
    </div>
  );
};

export const ColunaRota: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const r = R.rotas.find((x) => t >= x.tiro.de - 0.1 && t < x.tiro.ate + 0.3);
  if (!r) return null;
  const fim = r.tiro.ate;
  const out = prog(t, fim - 0.15, fim + 0.2, EASE_IN);
  if (out >= 1) return null;
  const m = r.m;
  const box = (filho: React.ReactNode) => <div style={{ position: "absolute", left: COL_X, top: COL_Y, opacity: 1 - out, filter: `${SOMBRA} blur(${out * 10}px)` }}>{filho}</div>;
  if (m.tipo === "passos") return box(<ListaDeParadas t={t} r={r} titulo={m.titulo} />);
  const rota = m as Rota;
  // sem tempo: a coluna lista as paradas e o destino, na ordem em que são ditos
  if (!rota.tempo) return box(<ListaDeParadas t={t} r={{ ...r, paradas: [...r.paradas, { u: 1, em: rota.destino.em, texto: rota.destino.texto }] }} titulo={rota.titulo} />);
  const tp = rota.tempo;
  const pin = prog(t, tp.em - 0.1, tp.em + 0.3);
  if (pin <= 0) return null;
  const modoEm = rota.modoEm ?? tp.em + 0.6;
  return box(
    <>
      <NumeroGrande texto={numeroBR(tp.valor, Number.isInteger(tp.valor) ? 0 : 1)} sufixo={tp.unidade ?? "min"} p={pin} pSuf={prog(t, (tp.unidadeEm ?? tp.em + 0.3) - 0.06, (tp.unidadeEm ?? tp.em + 0.3) + 0.3)} />
      <div style={{ height: 2, width: 220 * prog(t, modoEm - 0.1, rota.destino.em + 0.2), background: K.ouro, marginTop: 6, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", width: COL_W }}>
        {rota.modo ? (
          <Rise p={prog(t, modoEm - 0.08, modoEm + 0.3)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Icone nome={ICONE_MODO[rota.modo] ?? "pe"} tam={30} cor={K.ouro} />
              <span style={{ ...rotuloCss, fontSize: 32 }}>{rota.modo}</span>
            </div>
          </Rise>
        ) : null}
        <Rise p={prog(t, rota.destino.em - 0.08, rota.destino.em + 0.3)}>
          <span style={{ ...rotuloCss, fontSize: 32 }}>{rota.destino.texto}</span>
        </Rise>
      </div>
    </>,
  );
};

/* ---------- no mapa: destino (ícone + nome), paradas, nomes de rua ---------- */
export const RotulosDoMapa: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const r = R.rotas.find((x) => t >= x.tiro.de && t < x.tiro.ate + 0.3);
  if (!r) return null;
  const fim = r.tiro.ate;
  const sai = prog(t, fim - 0.05, fim + 0.25, EASE_IN);
  const ruas = r.m.tipo === "rota" ? (r.m.ruas ?? []).slice(0, 2) : [];
  const aRuas = prog(t, r.tiro.de + 0.55, r.tiro.de + 1.05) * (1 - prog(t, fim - 0.15, fim + 0.15));
  const d = r.destino;
  return (
    <>
      {aRuas > 0
        ? ruas.map((nome, i) => {
            const st = RUAS[i];
            const p0 = projetar(R, t, st.a);
            const p1 = projetar(R, t, st.b);
            let ang = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
            if (ang > 90) ang -= 180;
            if (ang < -90) ang += 180;
            return (
              <div key={i} style={{ position: "absolute", left: (p0.x + p1.x) / 2, top: (p0.y + p1.y) / 2, transform: `translate(-50%, -50%) rotate(${ang}deg)`, opacity: aRuas, whiteSpace: "nowrap", fontFamily: FONTE.sans, fontWeight: 600, fontSize: 28, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(236,240,248,0.66)", textShadow: "0 2px 10px rgba(4,8,16,0.9)" }}>
                {nome}
              </div>
            );
          })
        : null}
      {r.paradas.map((p, i) => {
        if (!d && i === r.paradas.length - 1 && r.m.tipo !== "passos") return null;
        const q = prog(t, p.em - 0.1, p.em + 0.3);
        if (q <= 0 || sai >= 1) return null;
        const s = projetar(R, t, pontoDaRota(p.u));
        const passos = r.m.tipo === "passos";
        return (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, transform: `translate(-50%, -100%) translateY(${-16 - (1 - q) * 16}px)`, opacity: q * (1 - sai), filter: SOMBRA }}>
            {passos ? (
              <div style={{ width: 60, height: 60, borderRadius: 60, background: K.vidro, border: `2.5px solid ${K.ouro}`, display: "flex", alignItems: "center", justifyContent: "center", ...serifNum, fontSize: 40, lineHeight: 1 }}>{i + 1}</div>
            ) : (
              <Pilula>
                <span style={{ ...rotuloCss, fontSize: 26, letterSpacing: "0.1em", color: K.marfim }}>{p.texto.length > 24 ? `${p.texto.slice(0, 23)}…` : p.texto}</span>
              </Pilula>
            )}
          </div>
        );
      })}
      {d
        ? (() => {
            const p = prog(t, d.em - 0.12, d.em + 0.32);
            if (p <= 0 || sai >= 1) return null;
            const s = projetar(R, t, [DESTINO[0], 0.25, DESTINO[2]]);
            return (
              <div style={{ position: "absolute", left: s.x, top: s.y, transform: `translate(-50%, -100%) translateY(${-18 - (1 - p) * 20}px)`, opacity: p * (1 - sai), filter: `${SOMBRA} blur(${(1 - p) * 6}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 92, height: 92, borderRadius: 92, background: "rgba(10,17,32,0.92)", border: `3px solid ${K.ouro}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icone nome={d.icone} tam={46} />
                </div>
                <div style={{ ...rotuloCss, fontSize: 30, color: K.marfim, letterSpacing: "0.22em", marginRight: "-0.22em", background: "rgba(10,17,32,0.78)", padding: "6px 14px", borderRadius: 6 }}>{d.rotulo}</div>
              </div>
            );
          })()
        : null}
    </>
  );
};

/* ---------- planta: área (72 m²) + cômodos ---------- */
const ColunaArea: React.FC<{ t: number; P: InfoPlanta; R: Roteiro }> = ({ t, P }) => {
  const m = P.m;
  const pin = prog(t, m.em - 0.06, m.em + 0.32);
  if (t < P.on - 0.8 || pin <= 0) return null;
  const a = m.area;
  const out = P.fimPreco ? prog(t, P.fimPreco - 0.32, P.fimPreco + 0.04, EASE_IN) : prog(t, P.tiro.ate - 0.3, P.tiro.ate + 0.05, EASE_IN);
  const c = prog(t, P.push[0] - 0.1, P.push[0] + 0.35, EASE_IN);
  const c2 = prog(t, P.push[1] - 0.35, P.push[1] + 0.1);
  const un = a?.unidade ?? "m²";
  const unEm = a?.unidadeEm ?? (a ? a.em + 0.5 : 0);
  return (
    <>
      {c < 1 ? (
        <div style={{ position: "absolute", left: COL_X, top: COL_Y, transform: `translateY(${-c * 30}px)`, opacity: 1 - c, filter: `${SOMBRA} blur(${c * 10}px)` }}>
          {a ? (
            <>
              <div style={{ height: 198, display: "flex", alignItems: "flex-end" }}>
                <NumeroGrande
                  texto={(() => {
                    const pn = prog(t, a.em - 0.08, (a.ateEm ?? a.em + 1.1) + 0.05, EASE_INOUT);
                    const v = Math.max(1, Math.round(a.valor * pn));
                    return a.valor < 100 ? String(v).padStart(2, "0") : numeroBR(v);
                  })()}
                  sufixo={un}
                  tam={210}
                  p={prog(t, a.em - 0.08, a.em + 0.3)}
                  pSuf={prog(t, unEm - 0.08, unEm + 0.3)}
                />
              </div>
              <div style={{ height: 2, width: 220 * prog(t, unEm + 0.38, unEm + 0.88), background: K.ouro, marginTop: 6, marginBottom: 16 }} />
            </>
          ) : null}
          {m.rotulo ? (
            <Rise p={pin}>
              <div style={{ ...rotuloCss, fontSize: 32 }}>{m.rotulo}</div>
            </Rise>
          ) : null}
        </div>
      ) : null}
      {a && c2 > 0 ? (
        <div style={{ position: "absolute", right: 64, top: 188, display: "flex", alignItems: "flex-end", gap: 6, opacity: c2 * (1 - out), transform: `translateY(${(1 - c2) * 16}px)`, filter: `${SOMBRA} blur(${(1 - c2) * 6 + out * 8}px)` }}>
          <div style={{ ...serifNum, fontSize: 92 }}>{numeroBR(a.valor)}</div>
          <div style={{ ...serifNum, fontSize: 44, color: K.ouroClaro, paddingBottom: 8 }}>{un}</div>
        </div>
      ) : null}
    </>
  );
};

const Comodos: React.FC<{ t: number; P: InfoPlanta; R: Roteiro }> = ({ t, P, R }) => {
  const d = DADOS[P.m.forma ?? "apartamento"];
  const dim = P.fimPreco ? prog(t, P.fimPreco - 0.32, P.fimPreco + 0.04, EASE_IN) : prog(t, P.tiro.ate - 0.3, P.tiro.ate, EASE_IN);
  return (
    <>
      {P.acesos.map((a, i) => {
        const p = prog(t, a.em - 0.08, a.em + 0.32);
        if (p <= 0) return null;
        const r = d.pecas.find((x) => x.id === a.id);
        if (!r) return null;
        const [x0, z0] = noMundo(d, r.x0, r.z0);
        const [x1, z1] = noMundo(d, r.x1, r.z1);
        // cômodo da frente: a etiqueta fica na beira da planta, a não ser que caia perto da legenda
        const naBeira = projetar(R, t, [(x0 + x1) / 2, PLAN_Y + 0.02, z1 + 0.08]);
        const front = !r.ancora && r.z1 >= d.z1 - 0.01 && r.x0 <= d.x0 + 0.01 && naBeira.y < 840;
        const [ax, az] = r.ancora ? noMundo(d, r.ancora[0], r.ancora[1]) : [(x0 + x1) / 2, (z0 + z1) / 2];
        const s = front ? naBeira : projetar(R, t, [ax, PLAN_Y + 0.25, az]);
        return (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, transform: `translate(-50%, ${front ? -28 : -50}%) translateY(${(1 - p) * 18}px) scale(${0.92 + 0.08 * p})`, opacity: p * (1 - dim), filter: `drop-shadow(0 8px 20px rgba(3,6,14,0.5)) blur(${(1 - p) * 6}px)` }}>
            <Pilula>
              <span style={{ ...rotuloCss, fontSize: 28, letterSpacing: "0.12em" }}>{a.texto}</span>
              {a.m2 ? (
                <span style={{ ...serifNum, fontSize: 46, lineHeight: 1 }}>
                  {numeroBR(a.m2)} <span style={{ color: K.ouroClaro }}>m²</span>
                </span>
              ) : null}
            </Pilula>
          </div>
        );
      })}
    </>
  );
};

export const CamadaPlanta: React.FC<{ t: number; R: Roteiro }> = ({ t, R }) => {
  const P = R.plantas.find((p) => t >= p.tiro.de - 0.8 && t < Math.max(p.tiro.ate, p.fimPreco ? p.fimPreco + 0.4 : 0) + 0.3);
  if (!P) return null;
  return (
    <>
      <ColunaArea t={t} P={P} R={R} />
      <Comodos t={t} P={P} R={R} />
    </>
  );
};

/* ---------- etiqueta de preço dourada ---------- */
const passoDe = (v: number) => (v >= 1000 ? Math.pow(10, Math.floor(Math.log10(v)) - 2) : 1);
export const Etiqueta: React.FC<{ t: number; m: Preco; fim: number }> = ({ t, m, fim }) => {
  const p = prog(t, m.em - 0.04, m.em + 0.7, EASE_OUT);
  if (p <= 0) return null;
  const sai = prog(t, fim - 0.05, fim + 0.3, EASE_IN);
  if (sai >= 1) return null;
  const partes = m.partes?.length ? m.partes : [{ valor: m.valor, em: m.em + 1.1 }];
  const ks: Array<[number, number]> = [[m.em, 0], ...partes.map((x) => [x.em + 0.12, x.valor] as [number, number])];
  const v = keys(t, ks, EASE_INOUT);
  const ultimo = partes[partes.length - 1];
  const casas = m.casas ?? 0;
  const terminou = t >= ultimo.em + 0.12;
  const passo = passoDe(m.valor);
  const mostrado = terminou ? m.valor : casas ? v : Math.round(v / passo) * passo;
  const txt = `${m.prefixo ? `${m.prefixo} ` : ""}${numeroBR(mostrado, casas)}${m.sufixo ? ` ${m.sufixo}` : ""}`;
  const W0 = 860;
  const H0 = 318;
  const tip = 70;
  const area = W0 - tip - 46 - 40;
  const wTxt = larguraTexto(`${m.prefixo ? `${m.prefixo} ` : ""}${numeroBR(m.valor, casas)}${m.sufixo ? ` ${m.sufixo}` : ""}`, 132, FONTE.serifa, 600);
  const fs = Math.min(132, (132 * area) / Math.max(1, wTxt));
  const rot = (1 - p) * -11;
  const clip = `polygon(${tip}px 0, 100% 0, 100% 100%, ${tip}px 100%, 0 50%)`;
  const notaEm = m.notaEm ?? m.em + 0.3;
  return (
    <div style={{ position: "absolute", left: 540 - W0 / 2 + 10, top: 452, width: W0, height: H0, transformOrigin: `${tip * 0.75}px ${H0 / 2}px`, transform: `translateY(${(1 - p) * -90 - sai * 40}px) rotate(${rot}deg)`, opacity: prog(t, m.em - 0.04, m.em + 0.22) * (1 - sai), filter: `drop-shadow(0 22px 40px rgba(0,0,0,0.55))${sai > 0 ? ` blur(${sai * 8}px)` : ""}` }}>
      <svg width={260} height={500} style={{ position: "absolute", left: tip * 0.75 - 250, top: H0 / 2 - 480, overflow: "visible" }}>
        <path d={`M 250 480 C 230 360, 120 250, ${-60} 0`} fill="none" stroke={K.ouro} strokeWidth={2.4} strokeDasharray="600" strokeDashoffset={600 * (1 - p)} />
      </svg>
      <div style={{ position: "absolute", inset: 0, clipPath: clip, background: `linear-gradient(120deg, ${K.ouroFundo}, ${K.ouroClaro} 38%, ${K.ouro} 62%, ${K.ouroFundo})` }} />
      <div style={{ position: "absolute", inset: 3, clipPath: `polygon(${tip - 1}px 0, 100% 0, 100% 100%, ${tip - 1}px 100%, 0 50%)`, background: "linear-gradient(160deg, #111C33, #0A1222 70%)" }} />
      <div style={{ position: "absolute", left: tip * 0.75 - 15, top: H0 / 2 - 15, width: 30, height: 30, borderRadius: 30, background: K.noite, border: `3px solid ${K.ouro}` }} />
      <div style={{ position: "absolute", left: tip + 46, top: 44, right: 40 }}>
        {m.rotulo ? (
          <Rise p={prog(t, (m.rotuloEm ?? m.em) - 0.1, (m.rotuloEm ?? m.em) + 0.3)}>
            <div style={{ ...rotuloCss, fontSize: 32, color: K.ouro }}>{m.rotulo}</div>
          </Rise>
        ) : (
          <div style={{ height: 44 }} />
        )}
        <div style={{ ...serifNum, fontSize: fs, lineHeight: 1.0, marginTop: 10 + (132 - fs) * 0.5, color: K.ouroClaro }}>{txt}</div>
        <div style={{ height: 1.5, background: "rgba(217,190,138,0.45)", marginTop: 18 + (132 - fs) * 0.5, marginBottom: 14, width: 560 * prog(t, ultimo.em, ultimo.em + 0.4) }} />
        {m.nota ? <div style={{ fontFamily: FONTE.sans, fontWeight: 600, fontSize: 28, color: K.marfimSuave, letterSpacing: "0.04em", opacity: prog(t, notaEm, notaEm + 0.5), whiteSpace: "nowrap" }}>{m.nota}</div> : null}
      </div>
    </div>
  );
};

/** escurece o palco atrás da etiqueta de preço */
export const PrecoEscuro: React.FC<{ t: number; m: Preco; fim: number }> = ({ t, m, fim }) => {
  const a = prog(t, m.em - 0.1, m.em + 0.5, EASE_INOUT) * (1 - prog(t, fim - 0.05, fim + 0.3));
  if (a <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 30% at 50% 32%, rgba(6,10,20,0.72), rgba(6,10,20,0.35))", opacity: a }} />;
};
