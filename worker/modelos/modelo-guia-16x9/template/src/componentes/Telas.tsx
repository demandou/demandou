// Os 11 blocos universais, na linguagem do Guia: tela branca, tinta preta, pílula preta de rótulo,
// laranja para o item da vez, estrela da marca. Versão deitada: cada tela é desenhada em px LÓGICOS
// (a camada das telas, 1080 de largura, conteúdo entre y 96 e ~930; ver tema.ts), ampliada até o
// quadro da esquerda; a pessoa fica na moldura da direita, fora da tela.
import { TelaPrint } from "./Print";
import type { Print as PrintMomento } from "../plano";
import { Img, staticFile } from "remotion";
import { encaixar, larguraTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Abertura, Cta, Comparacao, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Plano, Topicos } from "../plano";
import { COR, FONTE, FONTE_SCRIPT, MARGEM, formatar, prog, saida } from "../tema";
import { Estrela, IconeEstrela } from "./Estrela";
import { Pilula } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

type P = { plano: Plano; t: number };
const CX = 540;
const entra = (t: number, em: number, dur = 0.28) => prog(t, em - 0.03, dur);
const ate = (itens: { em: number }[], t: number) => itens.reduce((k, it, i) => (t >= it.em - 0.03 ? i : k), -1);

const Titulo: React.FC<{ texto?: string; t: number; de: number }> = ({ texto, t, de }) =>
  texto ? (
    <div style={{ position: "absolute", left: MARGEM, top: 96, opacity: entra(t, de, 0.2) }}>
      <Pilula texto={texto} tamanho={38} />
    </div>
  ) : null;

// ——— abertura ———
export const TelaAbertura: React.FC<P & { m: Abertura }> = ({ plano, m, t }) => {
  const d = disporTexto(m.texto, { largura: 940, max: 112, min: 60, linhas: 4, alinhar: "esq", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: MARGEM, top: 130, opacity: entra(t, m.de, 0.2), transform: `rotate(${(1 - entra(t, m.de, 0.5)) * -40}deg)` }}>
        <Estrela tamanho={120} />
      </div>
      <TextoFalado d={d} x={MARGEM} y={300} t={t} sobre="painel" cor={COR.tinta} />
    </div>
  );
};

// ——— topicos: pílulas pretas empilhadas ———
export const TelaTopicos: React.FC<P & { m: Topicos }> = ({ m, t }) => {
  const n = m.itens.length;
  const passo = Math.min(190, 640 / n);
  const atual = ate(m.itens, t);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Titulo texto={m.titulo} t={t} de={m.de} />
      {m.itens.map((it, i) => {
        const e = entra(t, it.em);
        if (e <= 0) return null;
        const f = encaixar(it.texto, { largura: 780, max: 56, min: 34, linhas: 1, fonte: { peso: 700 } });
        const y = 230 + i * passo;
        const dd = it.detalhe ? encaixar(it.detalhe, { largura: 900, max: 36, min: 26, linhas: 2, fonte: { peso: 600 } }) : null;
        return (
          <div key={i} style={{ position: "absolute", left: MARGEM, top: y, opacity: e, transform: `translateX(${(1 - e) * -34}px)` }}>
            <Pilula texto={it.texto} tamanho={f.tamanho} cor={i === atual ? COR.laranja : COR.tinta} />
            {dd ? (
              <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: dd.tamanho, lineHeight: 1.2, color: COR.cinza, marginTop: 12, marginLeft: 6, maxWidth: 900 }}>
                {dd.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// ——— passos: a mini estrada vertical ———
export const TelaPassos: React.FC<P & { m: Passos }> = ({ m, t }) => {
  const n = m.itens.length;
  const topo = 250;
  const passo = Math.min(200, 600 / n);
  const atual = ate(m.itens, t);
  const x = 130;
  const cheio = atual < 0 ? 0 : (atual + prog(t, m.itens[atual].em - 0.03, 0.4)) * passo;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Titulo texto={m.titulo} t={t} de={m.de} />
      <div style={{ position: "absolute", left: x - 6, top: topo + 40, width: 12, height: (n - 1) * passo, background: COR.cinzaClaro, borderRadius: 6 }} />
      <div style={{ position: "absolute", left: x - 6, top: topo + 40, width: 12, height: Math.min((n - 1) * passo, cheio), background: COR.estrada, borderRadius: 6 }} />
      {m.itens.map((it, i) => {
        const e = entra(t, it.em);
        const ativo = i === atual;
        const f = encaixar(it.texto, { largura: 760, max: 56, min: 34, linhas: 2, fonte: { peso: 800 } });
        const dd = it.detalhe ? encaixar(it.detalhe, { largura: 760, max: 32, min: 24, linhas: 2, fonte: { peso: 600 } }) : null;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: topo + i * passo, width: 1080, opacity: 0.25 + 0.75 * e }}>
            <div style={{ position: "absolute", left: x - 40, top: 0, width: 80, height: 80, borderRadius: 40, background: ativo ? COR.laranja : e >= 1 ? COR.tinta : COR.cinzaClaro, color: "#fff", fontFamily: FONTE, fontWeight: 800, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.8 + 0.2 * e})` }}>{i + 1}</div>
            <div style={{ position: "absolute", left: 230, top: -4, transform: `translateX(${(1 - e) * 26}px)` }}>
              <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: f.tamanho, lineHeight: 1.1, color: COR.tinta, letterSpacing: "-0.015em" }}>
                {f.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
              {dd ? <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: dd.tamanho, lineHeight: 1.2, color: COR.cinza, marginTop: 6 }}>{dd.linhas.join(" ")}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ——— numero ———
export const TelaNumero: React.FC<P & { m: Numero }> = ({ m, t }) => {
  const e = prog(t, m.em, 1.1, saida);
  const casas = m.casas ?? 0;
  const v = m.valor * e;
  const corpo = formatar(v, casas);
  const cheio = formatar(m.valor, casas);
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  const tam = Math.min(300, Math.floor(900 / Math.max(2.4, (pre + cheio + suf).length * 0.62)));
  return (
    <div style={{ position: "absolute", left: 0, top: 170, width: 1080, textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-flex", alignItems: "baseline", fontFamily: FONTE, fontWeight: 800, color: COR.laranja, letterSpacing: "-0.04em", lineHeight: 1, fontSize: tam, opacity: entra(t, m.em, 0.15) }}>
        {pre ? <span style={{ fontSize: tam * 0.4, marginRight: 8, color: COR.tinta }}>{pre}</span> : null}
        <span>{corpo}</span>
        {suf ? <span style={{ fontSize: tam * 0.4, marginLeft: 10, color: COR.tinta }}>{suf}</span> : null}
      </div>
      <div style={{ margin: "18px auto 0", width: 560 * e, height: 12, borderRadius: 6, background: COR.tinta }} />
      <div style={{ marginTop: 34, fontFamily: FONTE, fontWeight: 800, fontSize: 60, color: COR.tinta, lineHeight: 1.12, padding: "0 90px", opacity: entra(t, m.rotuloEm ?? m.em + 0.2), transform: `translateY(${(1 - entra(t, m.rotuloEm ?? m.em + 0.2)) * 16}px)` }}>
        {encaixar(m.rotulo, { largura: 880, max: 60, min: 38, linhas: 2, fonte: { peso: 800 } }).linhas.map((l, k) => (
          <div key={k}>{l}</div>
        ))}
      </div>
      {m.ilustrativo ? <div style={{ marginTop: 20 }}><Pilula texto="ilustrativo" tamanho={28} cor={COR.cinza} /></div> : null}
    </div>
  );
};

// ——— comparacao ———
export const TelaComparacao: React.FC<P & { m: Comparacao }> = ({ m, t }) => {
  const modo = m.modo ?? "contra";
  const sinal = modo === "contra" ? "×" : modo === "antes-depois" ? "→" : "≠";
  const venc = m.vencedor !== undefined && t >= (m.vencedorEm ?? m.lados[1].em + 0.8) ? m.vencedor : null;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Titulo texto={m.titulo} t={t} de={m.de} />
      {m.lados.map((l, i) => {
        const e = entra(t, l.em);
        const x = i === 0 ? 70 : 1080 - 70 - 430;
        const ganha = venc === i;
        const perde = venc !== null && !ganha;
        const f = encaixar(l.texto, { largura: 360, max: 54, min: 30, linhas: 4, fonte: { peso: 800 } });
        return (
          <div key={i} style={{ position: "absolute", left: x, top: 230, width: 430, height: 520, borderRadius: 28, background: "#fff", boxSizing: "border-box", border: `${ganha ? 8 : 3}px solid ${ganha ? COR.laranja : COR.linha}`, opacity: e * (perde ? 0.45 : 1), transform: `translateY(${(1 - e) * 30}px)`, boxShadow: "0 12px 30px rgba(20,20,20,0.10)" }}>
            <div style={{ position: "absolute", left: 24, top: -24 }}>
              <Pilula texto={l.rotulo} tamanho={32} cor={ganha ? COR.laranja : COR.tinta} />
            </div>
            <div style={{ position: "absolute", left: 35, right: 35, top: 70, bottom: 30, display: "flex", alignItems: "center", fontFamily: FONTE, fontWeight: 800, fontSize: f.tamanho, lineHeight: 1.12, color: COR.tinta, letterSpacing: "-0.015em" }}>
              <div>
                {f.linhas.map((ln, k) => (
                  <div key={k}>{ln}</div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: CX - 40, top: 450, width: 80, height: 80, borderRadius: 40, background: COR.tinta, color: "#fff", fontFamily: FONTE, fontWeight: 800, fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center", opacity: entra(t, m.lados[1].em), zIndex: 2 }}>{sinal}</div>
    </div>
  );
};

// ——— grafico ———
export const TelaGrafico: React.FC<P & { m: Grafico }> = ({ m, t }) => {
  const x0 = 110;
  const x1 = 970;
  const base = 760;
  const alto = 420;
  const dados = m.dados;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Titulo texto={m.titulo} t={t} de={m.de} />
      <svg width={1080} height={900} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {m.forma !== "pizza" ? <line x1={x0 - 20} y1={base} x2={x1 + 20} y2={base} stroke={COR.linha} strokeWidth={5} strokeLinecap="round" /> : null}
        {dados && m.forma === "barras"
          ? (() => {
              const max = Math.max(...dados.map((d) => d.valor), 1);
              const k = dados.length;
              const lar = Math.min(170, ((x1 - x0) / k) * 0.62);
              const at = ate(dados, t);
              return dados.map((d, i) => {
                const e = prog(t, d.em - 0.03, 0.6);
                const cx = x0 + ((x1 - x0) / k) * (i + 0.5);
                const h = (d.valor / max) * alto * e;
                return (
                  <g key={i} opacity={e > 0 ? 1 : 0}>
                    <rect x={cx - lar / 2} y={base - h} width={lar} height={h} rx={14} fill={i === at ? COR.laranja : COR.tinta} />
                    <text x={cx} y={base - h - 16} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={44} fill={COR.tinta}>{formatar(d.valor * e, Number.isInteger(d.valor) ? 0 : 1)}{m.unidade ?? ""}</text>
                    <text x={cx} y={base + 54} textAnchor="middle" fontFamily={FONTE} fontWeight={700} fontSize={34} fill={COR.cinza}>{d.rotulo}</text>
                  </g>
                );
              });
            })()
          : null}
        {dados && m.forma === "linha"
          ? (() => {
              const max = Math.max(...dados.map((d) => d.valor), 1);
              const k = dados.length;
              const pts = dados.map((d, i) => ({ x: x0 + ((x1 - x0) / Math.max(1, k - 1)) * i, y: base - (d.valor / max) * alto, d }));
              return (
                <g>
                  {pts.slice(1).map((p, i) => {
                    const a = pts[i];
                    const e = prog(t, p.d.em - 0.3, 0.5);
                    return <line key={i} x1={a.x} y1={a.y} x2={a.x + (p.x - a.x) * e} y2={a.y + (p.y - a.y) * e} stroke={COR.tinta} strokeWidth={10} strokeLinecap="round" />;
                  })}
                  {pts.map((p, i) => (
                    <g key={i} opacity={prog(t, p.d.em - 0.03, 0.2)}>
                      <circle cx={p.x} cy={p.y} r={20} fill={COR.laranja} />
                      <text x={p.x} y={p.y - 34} textAnchor="middle" fontFamily={FONTE} fontWeight={800} fontSize={42} fill={COR.tinta}>{formatar(p.d.valor, Number.isInteger(p.d.valor) ? 0 : 1)}{m.unidade ?? ""}</text>
                      <text x={p.x} y={base + 54} textAnchor="middle" fontFamily={FONTE} fontWeight={700} fontSize={32} fill={COR.cinza}>{p.d.rotulo}</text>
                    </g>
                  ))}
                </g>
              );
            })()
          : null}
        {dados && m.forma === "pizza"
          ? (() => {
              const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
              const R = 200;
              const C = 2 * Math.PI * R;
              let acc = 0;
              const at = ate(dados, t);
              return (
                <g transform="translate(380 480) rotate(-90)">
                  {dados.map((d, i) => {
                    const frac = d.valor / soma;
                    const e = prog(t, d.em - 0.03, 0.6);
                    const el = (
                      <circle key={i} r={R} fill="none" stroke={i === at ? COR.laranja : i % 2 ? COR.cinza : COR.tinta} strokeWidth={110} strokeDasharray={`${C * frac * e} ${C}`} strokeDashoffset={-C * acc} />
                    );
                    acc += frac;
                    return el;
                  })}
                </g>
              );
            })()
          : null}
        {!dados && m.tendencia
          ? (() => {
              const f = m.tendencia === "sobe" ? [0, 0.18, 0.36, 0.62, 1] : m.tendencia === "cai" ? [1, 0.7, 0.45, 0.22, 0.02] : [0.4, 0.9, 0.2, 0.75, 0.5];
              const pts = f.map((v, i) => ({ x: x0 + ((x1 - x0) / 4) * i, y: base - 40 - v * (alto - 40) }));
              const e = prog(t, m.tendenciaEm ?? m.de, 1.2);
              const d = `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
              return <path d={d} stroke={COR.laranja} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e} />;
            })()
          : null}
      </svg>
      {dados && m.forma === "pizza" ? (
        <div style={{ position: "absolute", left: 650, top: 300 }}>
          {dados.map((d, i) => (
            <div key={i} style={{ marginBottom: 22, opacity: entra(t, d.em), fontFamily: FONTE, fontWeight: 800, fontSize: 44, color: COR.tinta }}>
              {d.rotulo} <span style={{ color: COR.laranja }}>{formatar(d.valor, Number.isInteger(d.valor) ? 0 : 1)}{m.unidade ?? ""}</span>
            </div>
          ))}
        </div>
      ) : null}
      {m.ilustrativo ? <div style={{ position: "absolute", left: MARGEM, top: 810 }}><Pilula texto="ilustrativo" tamanho={28} cor={COR.cinza} /></div> : null}
    </div>
  );
};

// ——— destaque: ícone da estrela + palavra grande ———
export const TelaDestaque: React.FC<P & { m: Destaque }> = ({ m, t }) => {
  const e = entra(t, m.em, 0.22);
  const alerta = m.nivel === "alerta";
  const f = encaixar(m.texto, { largura: 880, max: 130, min: 54, linhas: 2, fonte: { peso: 800 } });
  const dd = m.detalhe ? encaixar(m.detalhe, { largura: 860, max: 42, min: 28, linhas: 2, fonte: { peso: 600 } }) : null;
  const de = entra(t, m.detalheEm ?? m.em + 0.3);
  return (
    <div style={{ position: "absolute", left: 0, top: 150, width: 1080, textAlign: "center" }}>
      <div style={{ display: "inline-block", transform: `scale(${0.85 + 0.15 * e})`, opacity: e }}>
        <IconeEstrela tamanho={250} />
      </div>
      <div style={{ marginTop: 36, opacity: e, transform: `translateY(${(1 - e) * 18}px)` }}>
        {alerta ? (
          <div style={{ display: "inline-block", background: COR.seta, color: "#fff", borderRadius: 30, padding: "14px 40px", fontFamily: FONTE, fontWeight: 800, fontSize: f.tamanho * 0.8, lineHeight: 1.1 }}>{f.linhas.join(" ")}</div>
        ) : (
          <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: f.tamanho, lineHeight: 1.08, color: COR.tinta, letterSpacing: "-0.02em" }}>
            {f.linhas.map((l, k) => (
              <div key={k}>{l}</div>
            ))}
          </div>
        )}
      </div>
      {dd ? <div style={{ marginTop: 22, fontFamily: FONTE, fontWeight: 600, fontSize: dd.tamanho, color: COR.cinza, opacity: de, padding: "0 110px", lineHeight: 1.2 }}>{dd.linhas.join(" ")}</div> : null}
    </div>
  );
};

// ——— definicao ———
export const TelaDefinicao: React.FC<P & { m: Definicao }> = ({ m, t }) => {
  const f = encaixar(m.termo, { largura: 780, max: 96, min: 46, linhas: 1, fonte: { peso: 700 } });
  const s = encaixar(m.significado, { largura: 900, max: 60, min: 36, linhas: 4, fonte: { peso: 700 } });
  const e = entra(t, m.em);
  const es = entra(t, m.significadoEm, 0.4);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: MARGEM, top: 190, opacity: e, transform: `translateX(${(1 - e) * -30}px)` }}>
        <Pilula texto={m.termo} tamanho={f.tamanho} />
      </div>
      <div style={{ position: "absolute", left: MARGEM + 8, top: 190 + f.tamanho * 1.7 + 30, width: 920, fontFamily: FONTE, fontWeight: 700, fontSize: s.tamanho, lineHeight: 1.18, color: COR.tinta, letterSpacing: "-0.01em", opacity: es, transform: `translateY(${(1 - es) * 18}px)` }}>
        {s.linhas.map((l, k) => (
          <div key={k}>{l}</div>
        ))}
      </div>
      <div style={{ position: "absolute", left: MARGEM + 8, top: 168, width: 90 * e, height: 0 }} />
    </div>
  );
};

// ——— frase ———
export const TelaFrase: React.FC<P & { m: Frase }> = ({ plano, m, t }) => {
  const d = disporTexto(m.texto, { largura: 920, max: 104, min: 54, linhas: 5, alinhar: "esq", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, risco: m.risco });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: MARGEM + 4, top: 120, fontFamily: FONTE_SCRIPT, fontSize: 200, lineHeight: 1, color: COR.laranja, opacity: entra(t, m.de, 0.2) }}>“</div>
      <TextoFalado d={d} x={MARGEM + 8} y={290} t={t} sobre="painel" cor={COR.tinta} riscoEm={m.riscoEm} />
    </div>
  );
};

// ——— pergunta ———
export const TelaPergunta: React.FC<P & { m: Pergunta }> = ({ plano, m, t }) => {
  const ops = m.opcoes ?? [];
  const d = disporTexto(m.texto, { largura: 900, max: ops.length > 2 ? 88 : 100, min: 52, linhas: 3, alinhar: "centro", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: CX - 80, top: 110, opacity: entra(t, m.de, 0.2) }}>
        <IconeEstrela tamanho={160} />
      </div>
      <TextoFalado d={d} x={90} y={300} t={t} sobre="painel" cor={COR.tinta} />
      {ops.map((o, i) => {
        // no quadro deitado as opções vão em fileiras de duas (não numa pilha alta): cabem até 4
        // embaixo de uma pergunta de 3 linhas sem passar da base útil
        const e = entra(t, o.em);
        const duas = ops.length > 1;
        const coluna = duas ? 470 : 900;
        const f = encaixar(o.texto, { largura: coluna - 84, max: 46, min: 28, linhas: 1, fonte: { peso: 700 } });
        const linha = duas ? Math.floor(i / 2) : i;
        const sozinha = duas && i === ops.length - 1 && ops.length % 2 === 1;
        const x = !duas || sozinha ? (1080 - coluna) / 2 : i % 2 === 0 ? 540 - coluna - 10 : 550;
        return (
          <div key={i} style={{ position: "absolute", left: x, width: coluna, textAlign: "center", top: 300 + d.altura + 40 + linha * (f.tamanho + 64), opacity: e, transform: `translateY(${(1 - e) * 20}px)` }}>
            <div style={{ display: "inline-block", border: `4px solid ${COR.tinta}`, borderRadius: 60, padding: "12px 34px", fontFamily: FONTE, fontWeight: 700, fontSize: f.tamanho, color: COR.tinta, background: "#fff", whiteSpace: "nowrap" }}>{o.texto}</div>
          </div>
        );
      })}
    </div>
  );
};

// ——— cta: a pílula grande por cima da tela que está rolando ———
export const TelaCta: React.FC<P & { m: Cta }> = ({ plano, m, t }) => {
  const e = entra(t, m.em ?? m.de, 0.3);
  const d = disporTexto(m.texto, { largura: 800, max: 124, min: 60, linhas: 3, alinhar: "centro", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate });
  const alt = d.altura + 130;
  const lar = 940;
  // o fundo: a última tela de print continua parada atrás da pílula (o CTA entra "por cima da
  // tela"), dentro das margens; com `fundo`, essa imagem num cartão igual ao do print.
  const prints = plano.momentos.filter((x) => x.tipo === "print" && x.de < m.de) as PrintMomento[];
  const ultimo = prints.sort((p, q) => p.de - q.de)[prints.length - 1];
  const base: PrintMomento | null = m.fundo ? { tipo: "print", de: m.de, ate: m.ate, imagem: m.fundo } : ultimo ?? null;
  const fundo = base ? <TelaPrint plano={plano} m={{ ...base, setas: [] }} t={m.fundo ? m.de : base.ate - 0.001} /> : null;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {fundo}
      <div style={{ position: "absolute", left: (1080 - lar) / 2, top: 560 - alt / 2, width: lar, height: alt, borderRadius: 72, background: COR.cta, boxShadow: "0 24px 56px rgba(240,64,90,0.35)", opacity: e, transform: `scale(${0.94 + 0.06 * e})` }}>
        <TextoFalado d={d} x={(lar - d.largura) / 2} y={65} t={t} sobre="painel" cor="#FFFFFF" />
      </div>
    </div>
  );
};

export { larguraTexto };
