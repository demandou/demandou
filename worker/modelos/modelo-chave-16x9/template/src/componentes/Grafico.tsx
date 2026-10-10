// Gráfico: o recibo de papel do Chave (serrilha embaixo, faixa verde em cima) com o gráfico desenhado
// a lápis e passado a tinta no ritmo da fala.
// - barras: réguas de madeira que crescem na palavra de cada número; a última dita fica verde;
// - linha: o traço verde anda de um ponto ao outro, cada ponto na palavra dele;
// - pizza: uma rosca que ganha cada fatia na palavra dela, com a legenda ao lado;
// - sem números (tendência): a curva a lápis inteira e a tinta verde correndo por ela, com a seta na
//   ponta e o selo "ilustrativo".
import { useMemo } from "react";
import { contar, Linhas, prog } from "../anim";
import { encaixar, larguraTexto, numeroBR } from "../medida";
import type { Grafico as TipoGrafico, Palavra } from "../plano";
import { cor, grotesca, rotulo as estiloRotulo, titulo as estiloTitulo } from "../tema";
import { useTitulo } from "./Listas";
import { SeloIlustrativo } from "./Pecas";

const serrilha = (w: number, h: number, dente = 22) => {
  let d = `M 0 0 H ${w} V ${h - dente / 2}`;
  const n = Math.max(2, Math.round(w / dente));
  const passo = w / n;
  for (let i = n; i > 0; i--) {
    const x = i * passo;
    d += ` L ${x - passo / 2} ${h} L ${x - passo} ${h - dente / 2}`;
  }
  return `${d} Z`;
};

export const CORES_DO_GRAFICO = [cor.verde, cor.latao, cor.madeiraEscura, cor.texto2, cor.alerta, cor.preto];
const G600 = { nome: "g600" as const };
const G700 = { nome: "g700" as const };

const formatar = (v: number, unidade?: string) => {
  const casas = Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 1 : 0;
  const n = numeroBR(v, casas);
  if (!unidade) return n;
  const u = unidade.trim();
  if (/^(R\$|US\$|€|£|\$)$/.test(u)) return `${u} ${n}`;
  return u === "%" ? `${n}%` : `${n} ${u}`;
};

// pontos de uma curva de tendência (0–1 nos dois eixos; y = 0 é o alto)
const curva = (tendencia: "sobe" | "cai" | "oscila", n = 60) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const x = i / n;
    let y: number;
    if (tendencia === "sobe") y = 0.86 - 0.72 * Math.pow(x, 1.45) + 0.05 * Math.sin(x * 9.5);
    else if (tendencia === "cai") y = 0.14 + 0.72 * Math.pow(x, 1.45) - 0.05 * Math.sin(x * 9.5);
    else y = 0.5 - 0.3 * Math.sin(x * Math.PI * 2.6) * (0.75 + 0.25 * x);
    return { x, y };
  });

export const Recibo: React.FC<{ m: TipoGrafico; palavras: Palavra[]; t: number; w: number; h: number }> = ({ m, palavras, t, w, h }) => {
  const PAD = 44;
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const ilustrativo = !temDados || !!m.ilustrativo;
  const titulo = useTitulo(m.titulo, w - PAD * 2 - (ilustrativo ? 0 : 0), palavras, m.de, dados[0]?.em ?? m.tendenciaEm ?? m.ate, 66, 50);
  const topoGrafico = 34 + (titulo ? titulo.altura + 34 : 30) + (ilustrativo ? 70 : 0);
  const area = { x: PAD, y: topoGrafico, w: w - PAD * 2, h: h - topoGrafico - 140 };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 16px 22px rgba(30,20,10,0.25))" }}>
        <path d={serrilha(w, h)} fill={cor.papel} />
        <rect x={0} y={0} width={w} height={16} fill={cor.verde} />
      </svg>
      {titulo ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, top: 46 }}>
          <Linhas linhas={titulo.linhas} tempos={titulo.tempos} t={t} style={{ ...estiloTitulo, fontSize: titulo.tamanho, color: cor.preto }} />
        </div>
      ) : null}
      {ilustrativo ? (
        <div style={{ position: "absolute", left: PAD, top: 46 + (titulo ? titulo.altura + 24 : 0) }}>
          <SeloIlustrativo opacidade={prog(t, m.de + 0.2, 0.4)} />
        </div>
      ) : null}
      {!temDados ? (
        <Tendencia m={m} t={t} area={area} />
      ) : m.forma === "pizza" ? (
        <Pizza m={m} dados={dados} palavras={palavras} t={t} area={area} />
      ) : m.forma === "linha" ? (
        <Linha m={m} dados={dados} t={t} area={area} />
      ) : (
        <Barras m={m} dados={dados} t={t} area={area} />
      )}
    </div>
  );
};

type Area = { x: number; y: number; w: number; h: number };
type Dado = { rotulo: string; valor: number; em: number };

// rótulos embaixo de cada coluna (medidos para caber na largura da coluna)
const useRotulos = (dados: Dado[], largura: number) =>
  useMemo(() => {
    const fits = dados.map((d) => encaixar(d.rotulo, { largura, max: 40, min: 28, linhas: 2, fonte: G600 }));
    const tamanho = Math.min(...fits.map((f) => f.tamanho));
    return dados.map((d) => encaixar(d.rotulo, { largura, max: tamanho, min: Math.min(28, tamanho), linhas: 2, fonte: G600 }));
  }, [dados, largura]);

const Barras: React.FC<{ m: TipoGrafico; dados: Dado[]; t: number; area: Area }> = ({ m, dados, t, area }) => {
  const n = dados.length;
  const coluna = area.w / n;
  const barra = Math.min(150, coluna * 0.62);
  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1e-9);
  const alturaUtil = area.h - 70;
  const rotulos = useRotulos(dados, coluna - 12);
  const ditos = dados.filter((d) => t >= d.em - 0.04).length;
  const maiorValor = Math.max(...dados.map((d) => larguraTexto(formatar(d.valor, m.unidade), 44, G700)));
  const corpoValor = maiorValor > coluna - 8 ? Math.max(28, Math.floor((44 * (coluna - 8)) / maiorValor)) : 44;
  return (
    <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h + 140 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: area.h, height: 4, background: cor.preto, borderRadius: 2 }} />
      {dados.map((d, i) => {
        const cx = coluna * (i + 0.5);
        const alvo = (Math.abs(d.valor) / max) * alturaUtil;
        const p = prog(t, d.em - 0.04, 0.55);
        const atual = i === ditos - 1;
        const valorAgora = contar(t, d.em, 0.55, 0, d.valor * 100) / 100;
        return (
          <div key={`${d.rotulo}-${i}`}>
            {/* o esboço a lápis da barra */}
            <div style={{ position: "absolute", left: cx - barra / 2, top: area.h - alvo, width: barra, height: alvo, border: `3px dashed ${cor.lapis}`, borderBottom: "none", borderRadius: "8px 8px 0 0", opacity: 1 - p, boxSizing: "border-box" }} />
            <div
              style={{
                position: "absolute",
                left: cx - barra / 2,
                top: area.h - alvo * p,
                width: barra,
                height: alvo * p,
                borderRadius: "8px 8px 0 0",
                background: atual ? cor.verde : `linear-gradient(90deg, ${cor.madeiraEscura}, ${cor.madeira} 40%, ${cor.madeiraClara} 60%, ${cor.madeira})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: cx - coluna / 2,
                width: coluna,
                top: area.h - alvo * p - corpoValor * 1.3,
                textAlign: "center",
                fontFamily: grotesca,
                fontWeight: 700,
                fontSize: corpoValor,
                color: atual ? cor.verde : cor.preto,
                opacity: p,
                whiteSpace: "nowrap",
              }}
            >
              {formatar(p >= 1 ? d.valor : Number.isInteger(d.valor) ? Math.round(valorAgora) : valorAgora, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: cx - coluna / 2 + 6, width: coluna - 12, top: area.h + 16, textAlign: "center", fontFamily: grotesca, fontWeight: 600, fontSize: rotulos[i].tamanho, lineHeight: 1.12, color: p > 0.5 ? cor.preto : cor.lapis }}>
              {rotulos[i].linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Linha: React.FC<{ m: TipoGrafico; dados: Dado[]; t: number; area: Area }> = ({ m, dados, t, area }) => {
  const n = dados.length;
  const coluna = area.w / n;
  const vs = dados.map((d) => d.valor);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const faixa = hi - lo || Math.abs(hi) || 1;
  const base = lo >= 0 && lo / Math.max(hi, 1e-9) < 0.35 ? 0 : lo - faixa * 0.3;
  const topo = hi + faixa * 0.12;
  const alturaUtil = area.h - 60;
  const pts = dados.map((d, i) => ({ x: coluna * (i + 0.5), y: 60 + alturaUtil * (1 - (d.valor - base) / (topo - base)) }));
  const rotulos = useRotulos(dados, coluna - 12);
  const ditos = dados.filter((d) => t >= d.em - 0.04).length;
  // o traço verde: do ponto anterior até o ponto dito, em 0,45 s
  const segmentos = pts.slice(1).map((p, i) => ({ a: pts[i], b: p, p: prog(t, dados[i + 1].em - 0.2, 0.45) }));
  return (
    <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h + 140 }}>
      <svg width={area.w} height={area.h + 4} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <path key={f} d={`M 0 ${60 + alturaUtil * f} H ${area.w}`} stroke={cor.lapisClaro} strokeWidth={2.5} strokeDasharray="10 10" />
        ))}
        <path d={`M 0 ${area.h} H ${area.w}`} stroke={cor.preto} strokeWidth={4} />
        <path d={`M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`} fill="none" stroke={cor.lapis} strokeWidth={3.5} strokeDasharray="9 9" />
        {segmentos.map((s, i) =>
          s.p > 0.001 ? <path key={i} d={`M ${s.a.x} ${s.a.y} L ${s.a.x + (s.b.x - s.a.x) * s.p} ${s.a.y + (s.b.y - s.a.y) * s.p}`} stroke={cor.verde} strokeWidth={8} strokeLinecap="round" fill="none" /> : null,
        )}
        {pts.map((p, i) => {
          const q = prog(t, dados[i].em - 0.04, 0.3);
          return <circle key={i} cx={p.x} cy={p.y} r={8 + 6 * q} fill={i === ditos - 1 ? cor.verde : q > 0.5 ? cor.preto : cor.papel} stroke={q > 0.5 ? cor.papel : cor.lapis} strokeWidth={q > 0.5 ? 4 : 3} strokeDasharray={q > 0.5 ? undefined : "5 4"} />;
        })}
      </svg>
      {pts.map((p, i) => {
        const q = prog(t, dados[i].em - 0.04, 0.3);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: p.x - coluna / 2, width: coluna, top: p.y - 74, textAlign: "center", fontFamily: grotesca, fontWeight: 700, fontSize: 40, color: i === ditos - 1 ? cor.verde : cor.preto, opacity: q, whiteSpace: "nowrap" }}>
              {formatar(dados[i].valor, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: p.x - coluna / 2 + 6, width: coluna - 12, top: area.h + 16, textAlign: "center", fontFamily: grotesca, fontWeight: 600, fontSize: rotulos[i].tamanho, lineHeight: 1.12, color: q > 0.5 ? cor.preto : cor.lapis }}>
              {rotulos[i].linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Pizza: React.FC<{ m: TipoGrafico; dados: Dado[]; palavras: Palavra[]; t: number; area: Area }> = ({ m, dados, t, area }) => {
  const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const R = Math.min(area.h / 2 + 40, area.w * 0.26);
  const cx = R + 10;
  const cy = area.h / 2 + 50;
  const esp = R * 0.36;
  const xLeg = cx + R + 50;
  const larguraLeg = area.w - xLeg;
  const linhaAlt = Math.min(110, (area.h + 100) / dados.length);
  const fits = useMemo(() => dados.map((d) => encaixar(d.rotulo, { largura: larguraLeg - 60, max: 44, min: 30, linhas: 2, fonte: G600 })), [dados, larguraLeg]);
  let acumulado = 0;
  const arcos = dados.map((d, i) => {
    const ini = acumulado / total;
    acumulado += Math.max(0, d.valor);
    return { ini, fim: acumulado / total, p: prog(t, d.em - 0.04, 0.5), cor: CORES_DO_GRAFICO[i % CORES_DO_GRAFICO.length] };
  });
  const arco = (a: number, b: number) => {
    const r = R - esp / 2;
    const p0 = { x: cx + r * Math.sin(a * 2 * Math.PI), y: cy - r * Math.cos(a * 2 * Math.PI) };
    const p1 = { x: cx + r * Math.sin(b * 2 * Math.PI), y: cy - r * Math.cos(b * 2 * Math.PI) };
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${b - a > 0.5 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
  };
  const yLeg0 = cy - (linhaAlt * dados.length) / 2;
  return (
    <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h + 140 }}>
      <svg width={area.w} height={area.h + 140} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={R - esp / 2} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="10 9" />
        {arcos.map((a, i) =>
          a.p > 0.001 ? <path key={i} d={arco(a.ini, a.ini + (a.fim - a.ini) * a.p - 0.0001)} fill="none" stroke={a.cor} strokeWidth={esp} /> : null,
        )}
      </svg>
      {dados.map((d, i) => {
        const p = arcos[i].p;
        const pct = (Math.max(0, d.valor) / total) * 100;
        return (
          <div key={i} style={{ position: "absolute", left: xLeg, top: yLeg0 + i * linhaAlt, width: larguraLeg, height: linhaAlt, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: 6, flexShrink: 0, background: p > 0.5 ? arcos[i].cor : "transparent", border: p > 0.5 ? "none" : `2.5px dashed ${cor.lapis}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: grotesca, fontWeight: 600, fontSize: fits[i].tamanho, lineHeight: 1.1, color: p > 0.5 ? cor.preto : cor.lapis }}>
                {fits[i].linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
              <div style={{ ...estiloRotulo, fontSize: 32, color: cor.texto2, marginTop: 6, opacity: p }}>{m.unidade && m.unidade !== "%" ? formatar(d.valor, m.unidade) : `${numeroBR(pct, pct < 10 && !Number.isInteger(pct) ? 1 : 0)}%`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Tendencia: React.FC<{ m: TipoGrafico; t: number; area: Area }> = ({ m, t, area }) => {
  const tend = m.tendencia ?? "sobe";
  const inicio = m.tendenciaEm ?? m.de + 0.3;
  const dur = Math.max(1.2, Math.min(2.4, (m.ate - inicio) * 0.6));
  const p = prog(t, inicio, dur, (x) => x * (2 - x));
  const pts = useMemo(() => curva(tend), [tend]);
  const H = area.h;
  const W = area.w;
  const xy = pts.map((q) => ({ x: 20 + q.x * (W - 70), y: 30 + q.y * (H - 60) }));
  const k = Math.max(1, Math.round(p * (xy.length - 1)));
  const feitos = xy.slice(0, k + 1);
  const ponta = feitos[feitos.length - 1];
  const antes = feitos[Math.max(0, feitos.length - 3)];
  const ang = Math.atan2(ponta.y - antes.y, ponta.x - antes.x);
  if (m.forma === "barras") {
    const n = 5;
    const col = W / n;
    const alturas = Array.from({ length: n }, (_, i) => {
      const f = (i + 1) / n;
      if (tend === "sobe") return 0.22 + 0.7 * f;
      if (tend === "cai") return 0.92 - 0.7 * (f - 1 / n);
      return 0.5 + (i % 2 ? -0.22 : 0.18);
    });
    return (
      <div style={{ position: "absolute", left: area.x, top: area.y, width: W, height: H + 20 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: H, height: 4, background: cor.preto, borderRadius: 2 }} />
        {alturas.map((a, i) => {
          const q = prog(t, inicio + (i * dur) / n, 0.45);
          const alt = a * (H - 30);
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: col * (i + 0.5) - col * 0.3, width: col * 0.6, top: H - alt, height: alt, border: `3px dashed ${cor.lapis}`, borderBottom: "none", borderRadius: "8px 8px 0 0", opacity: 1 - q, boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: col * (i + 0.5) - col * 0.3, width: col * 0.6, top: H - alt * q, height: alt * q, borderRadius: "8px 8px 0 0", background: i === n - 1 ? cor.verde : `linear-gradient(90deg, ${cor.madeiraEscura}, ${cor.madeira} 40%, ${cor.madeiraClara} 60%, ${cor.madeira})` }} />
            </div>
          );
        })}
      </div>
    );
  }
  // a tinta é sempre o verde do modelo (o que está acontecendo agora): cair pode ser bom ou ruim
  const corTinta = cor.verde;
  return (
    <div style={{ position: "absolute", left: area.x, top: area.y, width: W, height: H + 20 }}>
      <svg width={W} height={H + 10} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <path key={f} d={`M 0 ${H * f} H ${W}`} stroke={cor.lapisClaro} strokeWidth={2.5} strokeDasharray="10 10" />
        ))}
        <path d={`M 4 0 V ${H} H ${W}`} stroke={cor.preto} strokeWidth={4} fill="none" />
        <path d={`M ${xy.map((q) => `${q.x} ${q.y}`).join(" L ")}`} fill="none" stroke={cor.lapis} strokeWidth={4} strokeDasharray="10 10" />
        {p > 0.001 ? (
          <>
            <path d={`M ${feitos.map((q) => `${q.x} ${q.y}`).join(" L ")}`} fill="none" stroke={corTinta} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M -20 -15 L 4 0 L -20 15"
              transform={`translate(${ponta.x} ${ponta.y}) rotate(${(ang * 180) / Math.PI})`}
              fill="none"
              stroke={corTinta}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </svg>
    </div>
  );
};
