import { Easing } from "remotion";
import { prog } from "../anim";
import { encaixar, encaixarTodos, formatarNumero, larguraTexto } from "../medida";
import type { Grafico as TGrafico } from "../plano";
import { display, paleta, sans } from "../tema";
import { F_APOIO, F_NUMERO, F_TITULO, Ilustrativo, lapis, respiro, TextoFalado, type PropsBloco } from "./comum";
import { fundoPeca } from "./Grupo";
import { Prato } from "./Prato";

// formas qualitativas (0 a 1), para quando a fala não dá números
const BARRAS = { sobe: [2, 3, 5, 6, 8], cai: [8, 6, 5, 3, 2], oscila: [4, 7, 3, 6, 5] };
const LINHA = { sobe: [0.16, 0.24, 0.3, 0.46, 0.52, 0.7, 0.9], cai: [0.9, 0.78, 0.7, 0.5, 0.42, 0.28, 0.14], oscila: [0.4, 0.68, 0.36, 0.72, 0.44, 0.78, 0.56] };

export const formatarValor = (v: number, unidade?: string) => {
  const n = formatarNumero(v, Number.isInteger(v) ? 0 : 1);
  const u = unidade?.trim();
  if (!u) return n;
  if (["R$", "US$", "€", "$", "£"].includes(u)) return `${u} ${n}`;
  if (u === "%") return `${n}%`;
  return `${n} ${u}`;
};

// Gráfico de pastilhas: a grade do mosaico em miniatura.
// - barras: cada barra é uma coluna de pastilhas que se assentam de baixo para cima na palavra do dado; as
//   casas vazias ficam a lápis, então a grade inteira aparece desde o começo;
// - linha: a linha corre por cima de uma grade de pastilhas claras e as pastilhas embaixo dela se acendem
//   enquanto ela passa;
// - pizza: o disco das partes (a assinatura), com a fração de cada dado.
// Sem números ditos, a forma da `tendencia` (sobe, cai, oscila) com a etiqueta "ilustrativo".
export const Grafico: React.FC<PropsBloco<TGrafico>> = (props) => {
  const { b, t, w, h, util, pal, palavras, janela } = props;
  const dados = (b.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const ilustrativo = b.ilustrativo || !temDados;
  const tendencia = b.tendencia ?? (temDados ? (dados[dados.length - 1].valor >= dados[0].valor ? "sobe" : "cai") : "sobe");
  if (b.forma === "pizza" && temDados) {
    const soma = dados.reduce((a, d) => a + Math.max(0, d.valor), 0) || 1;
    return (
      <Prato
        {...props}
        b={{ tipo: "partes", titulo: b.titulo, ilustrativo: b.ilustrativo ?? false, partes: dados.map((d) => ({ fracao: Math.max(0, d.valor) / soma, em: d.em, rotulo: d.rotulo })) }}
        extras={dados.map((d) => formatarValor(d.valor, b.unidade))}
      />
    );
  }
  const forma = b.forma === "pizza" ? "linha" : b.forma;
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const interna = w - 2 * pad;
  const corForma = paleta[tendencia === "cai" ? "tomate" : tendencia === "oscila" ? "gema" : "folha"].fundo;

  const tit = b.titulo ? encaixar(b.titulo, { largura: interna - (ilustrativo ? 260 : 0), max: 76, min: 44, linhas: 2, fonte: F_TITULO, entrelinha: 1.04 }) : null;
  const topoGraf = pad + (tit ? tit.altura + 30 : ilustrativo ? 74 : 0);
  const n = temDados ? dados.length : forma === "barras" ? 5 : 7;
  const gapCol = interna * (forma === "barras" ? 0.045 : 0.02);
  const colW = (interna - (n - 1) * gapCol) / n;
  const valores = temDados ? dados.map((d) => formatarValor(d.valor, b.unidade)) : [];
  const tamValor = temDados ? Math.max(30, Math.min(60, ...valores.map((v) => (colW * 0.98) / Math.max(larguraTexto(v, 1, F_NUMERO), 0.01)))) : 0;
  const rotulos = temDados ? encaixarTodos(dados.map((d) => d.rotulo), { largura: colW + gapCol * 0.6, max: 40, min: 30, linhas: 2, fonte: F_APOIO, entrelinha: 1.08 }) : [];
  const altRot = temDados ? Math.max(...rotulos.map((r) => r.altura)) + 18 : 0;
  const altVal = temDados ? tamValor * 1.05 + 14 : 0;
  const baseGraf = alto - pad - altRot;
  const altGraf = baseGraf - topoGraf - altVal;
  const max = temDados ? Math.max(...dados.map((d) => d.valor), 0.0001) : 8;
  const inicioForma = b.tendenciaEm ?? janela.de + 0.35;

  // ---- barras de pastilhas
  const desenharBarras = () => {
    const R = 8;
    const s = Math.min(colW * 0.8, altGraf / (R + (R - 1) * 0.22));
    const gp = s * 0.22;
    const sub = Math.max(1, Math.min(3, Math.floor((colW * 0.86 + gp) / (s + gp))));
    const largBarra = sub * s + (sub - 1) * gp;
    const nums = temDados ? dados.map((d) => d.valor) : BARRAS[tendencia];
    const ems = temDados ? dados.map((d) => d.em) : nums.map((_, i) => inicioForma + i * 0.32);
    return nums.map((v, i) => {
      const cheias = v > 0 ? Math.max(1, Math.round((v / max) * R)) : 0;
      const x0 = pad + i * (colW + gapCol) + (colW - largBarra) / 2;
      const em = ems[i];
      const topoBarra = baseGraf - cheias * (s + gp) + gp;
      const pValor = prog(t, em + cheias * 0.045 + 0.05, 0.4);
      return (
        <div key={i}>
          {Array.from({ length: R }).map((_, r) =>
            Array.from({ length: sub }).map((__, c) => {
              const x = x0 + c * (s + gp);
              const y = baseGraf - (r + 1) * (s + gp) + gp;
              const cheia = r < cheias;
              const p = cheia ? prog(t, em + r * 0.045, 0.35) : 0;
              return (
                <div key={`${r}-${c}`} style={{ position: "absolute", left: x, top: y, width: s, height: s }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: s * 0.24, outline: `2px dashed ${lapis(pal)}`, outlineOffset: -2, opacity: 1 - p }} />
                  {p > 0.001 ? <div style={{ position: "absolute", inset: 0, borderRadius: s * 0.24, background: corForma, scale: String(0.5 + 0.5 * p), opacity: p }} /> : null}
                </div>
              );
            }),
          )}
          {temDados ? (
            <div style={{ position: "absolute", left: pad + i * (colW + gapCol) - 20, width: colW + 40, top: topoBarra - tamValor * 1.05 - 10, textAlign: "center", fontFamily: display, fontWeight: 800, fontSize: tamValor, lineHeight: 1.05, letterSpacing: "-0.03em", color: pal.texto, opacity: pValor, whiteSpace: "nowrap" }}>
              {valores[i]}
            </div>
          ) : null}
        </div>
      );
    });
  };

  // ---- linha sobre a grade de pastilhas
  const desenharLinha = () => {
    const R = 6;
    const s = Math.min(colW * 0.86, altGraf / (R + (R - 1) * 0.16));
    const gp = Math.min(s * 0.16, 14);
    const largCel = (interna - (n - 1) * gapCol) / n;
    const forma01 = temDados ? dados.map((d) => 0.08 + (0.84 * Math.max(0, d.valor)) / max) : LINHA[tendencia];
    const altGrade = R * s + (R - 1) * gp;
    const topoGrade = baseGraf - altGrade;
    const xs = forma01.map((_, i) => pad + i * (largCel + gapCol) + largCel / 2);
    const ys = forma01.map((v) => baseGraf - v * altGrade);
    // quanto da linha já correu (0 a n-1)
    let u = 0;
    if (temDados) {
      for (let i = 1; i < n; i++) if (t >= dados[i].em - 0.05) u = i - 1 + prog(t, dados[i].em - 0.05, 0.5);
    } else u = (n - 1) * prog(t, inicioForma, 1.9, Easing.inOut(Easing.cubic));
    const visivel = temDados ? t >= dados[0].em - 0.05 : t >= inicioForma;
    const k = Math.floor(u);
    const f = u - k;
    const pts = xs.slice(0, k + 1).map((x, i) => [x, ys[i]]);
    if (k < n - 1 && f > 0) pts.push([xs[k] + (xs[k + 1] - xs[k]) * f, ys[k] + (ys[k + 1] - ys[k]) * f]);
    const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const larguraCel = Math.min(largCel, s * 1.25);
    return (
      <>
        {xs.map((x, i) =>
          Array.from({ length: R }).map((_, r) => {
            const y = baseGraf - (r + 1) * (s + gp) + gp;
            // a pastilha acende quando a linha já passou por esta coluna e ela está embaixo da linha
            const passou = Math.max(0, Math.min(1, (u - i + 0.5) * 2)) * (visivel ? 1 : 0);
            const embaixo = y + s / 2 > ys[i];
            return (
              <div
                key={`${i}-${r}`}
                style={{ position: "absolute", left: x - larguraCel / 2, top: y, width: larguraCel, height: s, borderRadius: Math.min(s, larguraCel) * 0.22, background: embaixo && passou > 0 ? corForma : fundoPeca(pal, 0), opacity: embaixo && passou > 0 ? 0.28 + 0.1 * passou : 1 }}
              />
            );
          }),
        )}
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {visivel && pts.length > 1 ? <path d={d} fill="none" stroke={corForma} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {visivel
            ? xs.map((x, i) => {
                if (temDados ? t < dados[i].em - 0.05 : u < i - 0.01) return null;
                const lado = i === (temDados ? n - 1 : Math.min(k, n - 1)) ? 30 : 22;
                return <rect key={i} x={x - lado / 2} y={ys[i] - lado / 2} width={lado} height={lado} rx={lado * 0.24} fill={corForma} stroke={pal.fundo} strokeWidth={4} />;
              })
            : null}
          {visivel && !temDados && pts.length ? (
            <rect x={pts[pts.length - 1][0] - 15} y={pts[pts.length - 1][1] - 15} width={30} height={30} rx={7} fill={corForma} stroke={pal.fundo} strokeWidth={4} />
          ) : null}
        </svg>
        {temDados
          ? dados.map((dd, i) => {
              const pv = prog(t, dd.em + 0.1, 0.4);
              return (
                <div key={i} style={{ position: "absolute", left: xs[i] - colW / 2 - 20, width: colW + 40, top: Math.max(topoGrade - tamValor * 1.1, ys[i] - tamValor * 1.05 - 26), textAlign: "center", fontFamily: display, fontWeight: 800, fontSize: tamValor, lineHeight: 1.05, letterSpacing: "-0.03em", color: pal.texto, opacity: pv, whiteSpace: "nowrap" }}>
                  {valores[i]}
                </div>
              );
            })
          : null}
      </>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {tit ? (
        <div style={{ position: "absolute", left: pad, top: pad, width: interna - (ilustrativo ? 260 : 0) }}>
          <TextoFalado
            linhas={tit.linhas}
            t={t}
            palavras={palavras}
            janela={janela}
            tamanho={tit.tamanho}
            cor={pal.texto}
            estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.025em" }}
          />
        </div>
      ) : null}
      {ilustrativo ? <Ilustrativo pal={pal} p={prog(t, janela.de + 0.3, 0.4)} style={{ right: pad, top: pad }} /> : null}
      {forma === "barras" ? desenharBarras() : desenharLinha()}
      {temDados
        ? dados.map((d, i) => {
            const pr = prog(t, d.em, 0.4);
            return (
              <div key={`r${i}`} style={{ position: "absolute", left: pad + i * (colW + gapCol) - gapCol * 0.3, width: colW + gapCol * 0.6, top: baseGraf + 16, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: rotulos[i].tamanho, lineHeight: 1.08, color: pal.texto, opacity: pr }}>
                {rotulos[i].linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            );
          })
        : null}
    </div>
  );
};
