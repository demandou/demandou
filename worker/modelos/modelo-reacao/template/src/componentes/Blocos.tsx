// Os 11 blocos universais do Reação, cada um desenhado como um cartão do feed
// (branco para informar, escuro para bater forte, laranja para chamar). O marca-texto amarelo
// anda na linha que a pessoa está dizendo; tudo o que aparece vem da fala.
import { formatar, prog, desliza, suave, temposDoTexto } from "../anim";
import { porTexto, trechoNoTexto } from "../medida";
import type { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Topicos } from "../plano";
import { cor, fonte } from "../tema";
import { Alerta, Balao, Certo, Link, Salvar, Seguir } from "./Icones";
import { Casca, INTERNA, PAD, W, type Cartao, type Ctx } from "./Cartoes";
import { Texto, type Marca } from "./Texto";

const marcaDe = (texto: string, trecho: string | undefined, tempos: number[]): Marca[] => {
  const r = trechoNoTexto(texto, trecho);
  return r ? [{ a: r[0], b: r[1], tempos: tempos.slice(r[0], r[1] + 1) }] : [];
};

// ——— abertura: o título, palavra por palavra, em cartão escuro ———

export const cartaoAbertura = (m: Abertura, { palavras }: Ctx): Cartao => {
  const tp = porTexto(m.texto, { largura: INTERNA, max: 146, min: 70, linhas: 4, fonte: { peso: 800 } });
  const h = tp.altura + PAD * 2 + 22;
  const tempos = temposDoTexto(m.texto, m.em ?? m.de, palavras, m.ate);
  return {
    h,
    desenhar: (t) => (
      <Casca h={h} fundo={cor.noite}>
        <div style={{ position: "absolute", left: PAD, top: 0, width: 150, height: 14, background: cor.acento, borderRadius: "0 0 8px 8px" }} />
        <Texto tp={tp} t={t} x={PAD} y={PAD + 22} corTexto="#fff" aparece={tempos} marcas={marcaDe(m.texto, m.destaque, tempos)} />
      </Casca>
    ),
  };
};

// ——— listas: o marca-texto desce de item em item, como na leitura ———

const lista = (m: Topicos | Passos, ordem: boolean): Cartao => {
  const largTexto = INTERNA - 96;
  const itens = m.itens.map((it) => {
    const tp = porTexto(it.texto, { largura: largTexto, max: 68, min: 42, linhas: 2, fonte: { peso: 700 } });
    const det = it.detalhe ? porTexto(it.detalhe, { largura: largTexto, max: 32, min: 26, linhas: 2, fonte: { peso: 500 } }) : null;
    const hh = Math.max(84, tp.altura + (det ? det.altura + 6 : 0));
    return { it, tp, det, hh };
  });
  const yTitulo = m.titulo ? 120 : 0;
  const GAP = 30;
  const h = PAD + yTitulo + itens.reduce((s, x) => s + x.hh, 0) + GAP * (itens.length - 1) + PAD;
  return {
    h,
    desenhar: (t) => {
      let y = PAD + yTitulo;
      return (
        <Casca h={h}>
          {m.titulo ? (
            <span style={{ position: "absolute", left: PAD, top: PAD - 4, width: INTERNA, fontFamily: fonte, fontWeight: 800, fontSize: 44, color: cor.acento, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.15 }}>
              {m.titulo}
            </span>
          ) : null}
          {itens.map((x, i) => {
            const y0 = y;
            y += x.hh + GAP;
            const em = x.it.em;
            const p = prog(t, em - 0.1, 0.35, desliza);
            const proximo = m.itens[i + 1]?.em;
            const op = proximo === undefined ? 1 : 1 - prog(t, proximo, 0.35, suave);
            const k = x.tp.palavras.length;
            return (
              <div key={i} style={{ position: "absolute", left: 0, top: y0, width: W, height: x.hh, opacity: p, transform: p < 1 ? `translateY(${(1 - p) * 30}px)` : undefined }}>
                <div style={{ position: "absolute", left: PAD, top: 0, width: 72, height: 72, borderRadius: ordem ? "50%" : 20, background: cor.noite, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ordem ? <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: 40, color: "#fff" }}>{i + 1}</span> : <Certo tamanho={40} cor={cor.marca} traco={3.4} />}
                </div>
                <Texto tp={x.tp} t={t} x={PAD + 96} y={0} marcas={[{ a: 0, b: k - 1, tempos: varrer(em, k), opacidade: op }]} />
                {x.det ? <Texto tp={x.det} t={t} x={PAD + 96} y={x.tp.altura + 6} corTexto={cor.cinza} aparece={null} /> : null}
              </div>
            );
          })}
        </Casca>
      );
    },
  };
};
const varrer = (em: number, n: number, dur = 0.5) => Array.from({ length: n }, (_, k) => em + (dur * k) / n);

export const cartaoTopicos = (m: Topicos, _c: Ctx) => lista(m, false);
export const cartaoPassos = (m: Passos, _c: Ctx) => lista(m, true);

// ——— número ———

export const cartaoNumero = (m: Numero, { palavras }: Ctx): Cartao => {
  const rot = porTexto(m.rotulo, { largura: INTERNA, max: 88, min: 48, linhas: 2, fonte: { peso: 700 } });
  const h = 72 + 340 + 22 + rot.altura + (m.ilustrativo ? 70 : 0) + 72;
  const emR = m.rotuloEm ?? m.em + 0.4;
  const tempos = temposDoTexto(m.rotulo, emR, palavras, m.ate);
  const casas = m.casas ?? 0;
  return {
    h,
    desenhar: (t) => {
      const p = prog(t, m.em, 0.95, suave);
      const v = m.valor * p;
      const tam = 84; // corpo dos pedaços pequenos (prefixo/sufixo)
      const entra = prog(t, m.em - 0.05, 0.25, desliza);
      return (
        <Casca h={h}>
          <div style={{ position: "absolute", left: 0, top: 72, width: W, height: 340, display: "flex", justifyContent: "center", alignItems: "baseline", fontFamily: fonte, fontWeight: 800, color: cor.tinta, lineHeight: "340px", opacity: Math.max(0, entra), transform: `scale(${0.92 + 0.08 * entra})` }}>
            {m.prefixo ? <span style={{ fontSize: tam, color: cor.acento, marginRight: 14 }}>{m.prefixo}</span> : null}
            <span style={{ fontSize: 320, letterSpacing: "-0.02em" }}>{formatar(v, casas)}</span>
            {m.sufixo ? <span style={{ fontSize: m.sufixo.length > 2 ? tam : 190, color: cor.acento, marginLeft: 12 }}>{m.sufixo}</span> : null}
          </div>
          <Texto tp={rot} t={t} x={PAD} y={72 + 340 + 22} caixa={INTERNA} centro marcas={[{ a: 0, b: rot.palavras.length - 1, tempos }]} aparece={null} />
          {m.ilustrativo ? (
            <span style={{ position: "absolute", left: W / 2 - 110, top: h - 100, width: 220, height: 44, borderRadius: 22, background: cor.cinzaClaro, color: cor.cinza, fontFamily: fonte, fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
              número ilustrativo
            </span>
          ) : null}
        </Casca>
      );
    },
  };
};

// ——— comparação ———

export const cartaoComparacao = (m: Comparacao, { palavras }: Ctx): Cartao => {
  const modo = m.modo ?? "contra";
  const cores: [string, string] = modo === "antes-depois" ? [cor.cinza, cor.acento] : modo === "errado-certo" ? [cor.alerta, cor.certo] : ["#3E6FD8", cor.acento];
  const COL = (INTERNA - 28) / 2;
  const cols = m.lados.map((l) => porTexto(l.texto, { largura: COL - 56, max: 68, min: 40, linhas: 4, fonte: { peso: 700 } }));
  const altCol = 96 + Math.max(...cols.map((c) => c.altura)) + 44;
  const yTit = m.titulo ? 104 : 0;
  const h = PAD + yTit + altCol + PAD;
  return {
    h,
    desenhar: (t) => (
      <Casca h={h}>
        {m.titulo ? (
          <span style={{ position: "absolute", left: PAD, top: PAD - 4, width: INTERNA, fontFamily: fonte, fontWeight: 800, fontSize: 42, color: cor.noite, lineHeight: 1.15 }}>{m.titulo}</span>
        ) : null}
        {m.lados.map((l, i) => {
          const p = prog(t, l.em - 0.1, 0.4, desliza);
          const venc = m.vencedor !== undefined && t >= (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7);
          const ganhou = venc && m.vencedor === i;
          const perdeu = venc && m.vencedor !== i;
          const tempos = temposDoTexto(l.texto, l.em, palavras, m.ate);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: PAD + i * (COL + 28),
                top: PAD + yTit,
                width: COL,
                height: altCol,
                borderRadius: 26,
                background: "#F4F6F9",
                border: `${ganhou ? 6 : 3}px solid ${ganhou ? cor.certo : cor.linha}`,
                boxSizing: "border-box",
                opacity: p * (perdeu ? 0.5 : 1),
                transform: `translateX(${(1 - p) * (i ? 60 : -60)}px)`,
              }}
            >
              <div style={{ position: "absolute", left: 28, top: 26, height: 52, padding: "0 22px", borderRadius: 26, background: cores[i], color: "#fff", fontFamily: fonte, fontWeight: 800, fontSize: 30, display: "flex", alignItems: "center", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                {l.rotulo}
              </div>
              {ganhou ? (
                <div style={{ position: "absolute", right: 22, top: 22, width: 60, height: 60, borderRadius: "50%", background: cor.certo, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Certo tamanho={38} cor="#fff" traco={3.4} />
                </div>
              ) : null}
              <Texto tp={cols[i]} t={t} x={28} y={96} marcas={[{ a: 0, b: cols[i].palavras.length - 1, tempos, opacidade: perdeu ? 0 : 1 }]} />
            </div>
          );
        })}
      </Casca>
    ),
  };
};

// ——— gráfico ———

const CURVAS = { sobe: [0.88, 0.8, 0.62, 0.5, 0.3, 0.12], cai: [0.12, 0.25, 0.4, 0.58, 0.78, 0.9], oscila: [0.5, 0.2, 0.7, 0.3, 0.75, 0.4] };

export const cartaoGrafico = (m: Grafico, _c: Ctx): Cartao => {
  const dados = m.dados ?? [];
  const yTit = m.titulo ? 104 : 0;
  const extra = m.ilustrativo ? 64 : 0;
  const alturaGraf = m.forma === "barras" ? Math.max(1, dados.length) * 96 + 10 : 360;
  const h = PAD + yTit + alturaGraf + extra + PAD;
  const un = m.unidade ?? "";
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const CORES = [cor.acento, "#3E6FD8", cor.certo, "#9B6BDF", cor.marca];
  return {
    h,
    desenhar: (t) => {
      const y0 = PAD + yTit;
      let miolo: React.ReactNode = null;
      if (m.forma === "barras") {
        miolo = dados.map((d, i) => {
          const p = prog(t, d.em, 0.6, desliza);
          const larg = 520;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: i * 96, width: INTERNA, height: 80, opacity: Math.min(1, p * 3) }}>
              <span style={{ position: "absolute", left: 0, top: 0, width: 220, height: 80, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 700, fontSize: 36, color: cor.tinta, lineHeight: 1.05 }}>{d.rotulo}</span>
              <div style={{ position: "absolute", left: 240, top: 12, width: larg, height: 56, borderRadius: 14, background: cor.cinzaClaro }} />
              <div style={{ position: "absolute", left: 240, top: 12, width: Math.max(8, (larg * d.valor * p) / max), height: 56, borderRadius: 14, background: CORES[i % CORES.length] }} />
              <span style={{ position: "absolute", left: 240 + larg + 14, top: 0, height: 80, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 800, fontSize: 38, color: cor.tinta, opacity: p }}>
                {formatar(d.valor * p, d.valor % 1 ? 1 : 0)}
                {un}
              </span>
            </div>
          );
        });
      } else if (m.forma === "linha") {
        const pontos = dados.length ? dados.map((d) => d.valor / max) : CURVAS[m.tendencia ?? "sobe"].map((v) => 1 - v);
        const inicio = dados.length ? dados[0].em : (m.tendenciaEm ?? m.de + 0.3);
        const fim = dados.length ? dados[dados.length - 1].em + 0.5 : inicio + 1.4;
        const GW = INTERNA - 20;
        const GH = 300;
        const xs = pontos.map((_, i) => 10 + (GW * i) / Math.max(1, pontos.length - 1));
        const ys = pontos.map((v) => 10 + GH * (dados.length ? 1 - v : v));
        const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
        const p = prog(t, inicio, fim - inicio, suave);
        miolo = (
          <svg width={INTERNA} height={340} style={{ position: "absolute", left: 0, top: 10 }}>
            {[0, 1, 2, 3].map((k) => (
              <line key={k} x1={0} x2={INTERNA} y1={10 + (GH * k) / 3} y2={10 + (GH * k) / 3} stroke={cor.linha} strokeWidth={2} />
            ))}
            <path d={d} pathLength={1} fill="none" stroke={cor.acento} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />
            {dados.map((dd, i) =>
              t >= dd.em ? (
                <g key={i}>
                  <circle cx={xs[i]} cy={ys[i]} r={13} fill={cor.noite} />
                  <text x={xs[i]} y={ys[i] - 26} textAnchor="middle" fontFamily={fonte} fontWeight={800} fontSize={32} fill={cor.tinta}>
                    {formatar(dd.valor, dd.valor % 1 ? 1 : 0)}
                    {un}
                  </text>
                </g>
              ) : null,
            )}
          </svg>
        );
      } else {
        const lista = dados.length ? dados : [{ rotulo: "", valor: 70, em: m.tendenciaEm ?? m.de + 0.3 }, { rotulo: "", valor: 30, em: (m.tendenciaEm ?? m.de + 0.3) + 0.5 }];
        const total = lista.reduce((s, d) => s + d.valor, 0);
        let acum = 0;
        const R = 130;
        const C = 2 * Math.PI * R;
        miolo = (
          <>
            <svg width={340} height={340} style={{ position: "absolute", left: 20, top: 10, transform: "rotate(-90deg)" }}>
              <circle cx={170} cy={170} r={R} fill="none" stroke={cor.cinzaClaro} strokeWidth={70} />
              {lista.map((d, i) => {
                const frac = d.valor / total;
                const p = prog(t, d.em, 0.6, suave);
                const seg = (
                  <circle key={i} cx={170} cy={170} r={R} fill="none" stroke={CORES[i % CORES.length]} strokeWidth={70} strokeDasharray={`${C * frac * p} ${C}`} strokeDashoffset={-C * acum} />
                );
                acum += frac;
                return seg;
              })}
            </svg>
            {dados.map((d, i) => {
              const p = prog(t, d.em, 0.4, desliza);
              return (
                <div key={i} style={{ position: "absolute", left: 420, top: 30 + i * 70, height: 56, display: "flex", alignItems: "center", gap: 18, opacity: p }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: CORES[i % CORES.length] }} />
                  <span style={{ fontFamily: fonte, fontWeight: 700, fontSize: 36, color: cor.tinta }}>
                    {d.rotulo} · {formatar(d.valor, d.valor % 1 ? 1 : 0)}
                    {un}
                  </span>
                </div>
              );
            })}
          </>
        );
      }
      return (
        <Casca h={h}>
          {m.titulo ? (
            <span style={{ position: "absolute", left: PAD, top: PAD - 4, width: INTERNA, fontFamily: fonte, fontWeight: 800, fontSize: 42, color: cor.noite, lineHeight: 1.15 }}>{m.titulo}</span>
          ) : null}
          <div style={{ position: "absolute", left: PAD, top: y0, width: INTERNA, height: alturaGraf }}>{miolo}</div>
          {m.ilustrativo ? (
            <span style={{ position: "absolute", left: PAD, top: h - PAD - 44, height: 44, padding: "0 22px", borderRadius: 22, background: cor.cinzaClaro, color: cor.cinza, fontFamily: fonte, fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center" }}>
              ilustrativo
            </span>
          ) : null}
        </Casca>
      );
    },
  };
};

// ——— destaque ———

export const cartaoDestaque = (m: Destaque, { palavras }: Ctx): Cartao => {
  const alerta = m.nivel === "alerta";
  const esq = alerta ? 130 : 0;
  const tp = porTexto(m.texto, { largura: INTERNA - esq, max: 170, min: 80, linhas: 3, fonte: { peso: 800 } });
  const det = m.detalhe ? porTexto(m.detalhe, { largura: INTERNA, max: 72, min: 44, linhas: 3, fonte: { peso: 700 } }) : null;
  const h = 72 + tp.altura + (det ? 34 + det.altura : 0) + 72;
  const fundo = alerta ? cor.marcaAlerta : cor.noite;
  const tinta = alerta ? cor.tinta : "#fff";
  const temposT = temposDoTexto(m.texto, m.em, palavras, m.ate);
  const emD = m.detalheEm ?? m.em + 0.8;
  const temposD = det ? temposDoTexto(m.detalhe as string, emD, palavras, m.ate) : [];
  return {
    h,
    desenhar: (t) => {
      const q = prog(t, m.em - 0.05, 0.3, desliza);
      return (
        <Casca h={h} fundo={fundo}>
          {alerta ? (
            <div style={{ position: "absolute", left: PAD, top: PAD + 8, opacity: q }}>
              <Alerta tamanho={92} cor={cor.tinta} traco={2.4} />
            </div>
          ) : null}
          <Texto tp={tp} t={t} x={PAD + esq} y={72} corTexto={tinta} aparece={temposT} marcas={alerta ? [] : [{ a: 0, b: tp.palavras.length - 1, tempos: temposT.map((x) => x + 0.05) }]} />
          {det ? <Texto tp={det} t={t} x={PAD} y={72 + tp.altura + 34} corTexto={alerta ? cor.tinta : "rgba(255,255,255,0.78)"} aparece={temposD} /> : null}
        </Casca>
      );
    },
  };
};

// ——— definição ———

export const cartaoDefinicao = (m: Definicao, { palavras }: Ctx): Cartao => {
  const termo = porTexto(m.termo, { largura: INTERNA - 80, max: 116, min: 60, linhas: 2, fonte: { peso: 800 } });
  const sig = porTexto(m.significado, { largura: INTERNA, max: 70, min: 42, linhas: 4, fonte: { peso: 600 } });
  const hTermo = termo.altura + 44;
  const h = PAD + hTermo + 40 + sig.altura + PAD;
  const tempos = temposDoTexto(m.significado, m.significadoEm, palavras, m.ate);
  return {
    h,
    desenhar: (t) => {
      const p = prog(t, m.em - 0.05, 0.35, desliza);
      return (
        <Casca h={h}>
          <div style={{ position: "absolute", left: PAD, top: PAD, height: hTermo, width: termo.largura + 80, borderRadius: 24, background: cor.acento, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
            <Texto tp={termo} t={t} x={40} y={22} corTexto="#fff" aparece={null} />
          </div>
          <Texto tp={sig} t={t} x={PAD} y={PAD + hTermo + 40} aparece={tempos} marcas={[{ a: 0, b: sig.palavras.length - 1, tempos, opacidade: 0 }]} />
        </Casca>
      );
    },
  };
};

// ——— frase ———

export const cartaoFrase = (m: Frase, { palavras }: Ctx): Cartao => {
  const tp = porTexto(m.texto, { largura: INTERNA, max: 108, min: 58, linhas: 4, fonte: { peso: 800 } });
  const h = PAD + 96 + tp.altura + PAD;
  const tempos = temposDoTexto(m.texto, m.em ?? m.de, palavras, m.ate);
  const r = m.risco ? trechoNoTexto(m.texto, m.risco) : null;
  return {
    h,
    desenhar: (t) => (
      <Casca h={h}>
        <span style={{ position: "absolute", left: PAD - 4, top: PAD - 36, fontFamily: fonte, fontWeight: 800, fontSize: 220, lineHeight: 1, color: cor.acento }}>“</span>
        <Texto
          tp={tp}
          t={t}
          x={PAD}
          y={PAD + 96}
          aparece={tempos}
          marcas={marcaDe(m.texto, m.destaque, tempos)}
          risco={r ? { a: r[0], b: r[1], em: m.riscoEm ?? tempos[r[0]] ?? m.de } : null}
        />
      </Casca>
    ),
  };
};

// ——— pergunta ———

export const cartaoPergunta = (m: Pergunta, { palavras }: Ctx): Cartao => {
  const opcoes = m.opcoes ?? [];
  const tp = porTexto(m.texto, { largura: INTERNA - 120, max: 96, min: 54, linhas: 3, fonte: { peso: 800 } });
  const hOps = opcoes.length ? 28 + opcoes.length * 100 : 0;
  const h = PAD + Math.max(100, tp.altura) + hOps + PAD;
  const tempos = temposDoTexto(m.texto, m.em ?? m.de, palavras, m.ate);
  return {
    h,
    desenhar: (t) => (
      <Casca h={h}>
        <div style={{ position: "absolute", left: PAD, top: PAD, width: 92, height: 92, borderRadius: "50%", background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Balao tamanho={50} cor="#fff" traco={2.6} />
        </div>
        <Texto tp={tp} t={t} x={PAD + 120} y={PAD} aparece={tempos} />
        {opcoes.map((o, i) => {
          const p = prog(t, o.em - 0.1, 0.35, desliza);
          const tpo = porTexto(o.texto, { largura: INTERNA - 120, max: 46, min: 32, linhas: 1, fonte: { peso: 700 } });
          return (
            <div key={i} style={{ position: "absolute", left: PAD, top: PAD + Math.max(100, tp.altura) + 28 + i * 100, width: INTERNA, height: 84, borderRadius: 42, background: "#F4F6F9", border: `3px solid ${cor.linha}`, boxSizing: "border-box", opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
              <div style={{ position: "absolute", left: 12, top: 9, width: 54, height: 54, borderRadius: "50%", background: cor.noite, color: "#fff", fontFamily: fonte, fontWeight: 800, fontSize: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {String.fromCharCode(65 + i)}
              </div>
              <Texto tp={tpo} t={t} x={92} y={(84 - 6 - tpo.lh) / 2} aparece={null} />
            </div>
          );
        })}
      </Casca>
    ),
  };
};

// ——— fechamento ———

export const cartaoCta = (m: Cta, { palavras }: Ctx): Cartao => {
  const Icone = m.icone === "salvar" ? Salvar : m.icone === "seguir" ? Seguir : m.icone === "link" ? Link : Balao;
  const tp = porTexto(m.texto, { largura: INTERNA - 150, max: 120, min: 62, linhas: 3, fonte: { peso: 800 } });
  const h = 76 + Math.max(132, tp.altura) + 76;
  const tempos = temposDoTexto(m.texto, m.em ?? m.de, palavras, m.ate);
  return {
    h,
    desenhar: (t) => {
      const p = prog(t, (m.em ?? m.de) - 0.05, 0.4, desliza);
      return (
        <Casca h={h} fundo={cor.acento}>
          <div style={{ position: "absolute", left: PAD, top: (h - 132) / 2, width: 132, height: 132, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.7 + 0.3 * p})`, opacity: p }}>
            <Icone tamanho={74} cor={cor.acento} traco={2.6} cheio={m.icone === "salvar"} />
          </div>
          <Texto tp={tp} t={t} x={PAD + 176} y={(h - tp.altura) / 2} corTexto="#fff" aparece={tempos} marcas={marcaDe(m.texto, m.destaque, tempos)} />
        </Casca>
      );
    },
  };
};
