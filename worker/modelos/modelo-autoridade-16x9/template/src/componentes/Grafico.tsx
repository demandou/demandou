import { limitar, prog, saindo, Traco, useTempo } from "../anim";
import { encaixarNaCaixa, larguraTexto, quebrar, SANS, SERIF } from "../medida";
import type { Grafico as TGrafico } from "../plano";
import { casasDe, cor, formatar, minimo, sans, serif } from "../tema";
import { Ajuste, type Folga, Ilustrativo, Letreiro, Papel } from "./Pecas";

// Gráfico do Autoridade: um recorte de jornal. O gráfico é impresso em tinta sobre o papel do
// cartão-documento, com o filete de latão em cima; o dado que importa ganha o latão.
// Linha: o traço avança de ponto em ponto, cada um no seu `em`. Barras: crescem quando são ditas.
// Pizza: o anel se fecha fatia por fatia. Sem números (tendência): a curva se desenha e a etiqueta
// "ilustrativo" fica visível.

const curvaQualitativa = (tipo: "sobe" | "cai" | "oscila", w: number, h: number) => {
  const pts: [number, number][] = [];
  const n = 48;
  for (let k = 0; k <= n; k++) {
    const x = k / n;
    let y: number;
    if (tipo === "oscila") y = 0.5 + 0.32 * Math.sin(x * Math.PI * 3.2) * (0.7 + 0.3 * x);
    else {
      // tendência com respiros (não é uma reta: parece um dado real, mas é ilustrativa)
      const base = 0.12 + 0.76 * (x ** 1.35);
      const ruido = 0.06 * Math.sin(x * 17) * (1 - x * 0.4) + 0.03 * Math.sin(x * 41);
      y = tipo === "sobe" ? base + ruido : 1 - (base + ruido);
    }
    pts.push([x * w, h - limitar(y, 0.04, 0.96) * h]);
  }
  return pts;
};

const caminho = (pts: [number, number][]) => pts.map(([x, y], k) => `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

// rótulo pequeno dentro do gráfico: cabe na largura em até 2 linhas, nunca abaixo de 28 px
const RotuloDoEixo: React.FC<{ texto: string; largura: number; p: number; alinhar?: "center" | "left" }> = ({ texto, largura, p, alinhar = "center" }) => {
  let tamanho = minimo.grafico + 2;
  let linhas = quebrar(texto, largura, tamanho, () => SANS);
  while ((linhas.length > 2 || linhas.some((l) => larguraTexto(l.map((x) => x.w).join(" "), tamanho, SANS) > largura)) && tamanho > 28) {
    tamanho -= 1;
    linhas = quebrar(texto, largura, tamanho, () => SANS);
  }
  return (
    <div style={{ opacity: p, textAlign: alinhar, fontFamily: sans, fontWeight: 500, fontSize: tamanho, lineHeight: 1.12, color: cor.tintaSuave }}>
      {linhas.map((l, j) => (
        <div key={j} style={{ whiteSpace: "nowrap" }}>
          {l.map((x) => x.w).join(" ")}
        </div>
      ))}
    </div>
  );
};

export const Grafico: React.FC<{ m: TGrafico; largura: number; altura: number; folga?: Folga }> = ({ m, largura, altura, folga }) => {
  const t = useTempo();
  const sai = saindo(t, m.ate);
  const dados = m.dados && m.dados.length >= 2 ? m.dados.slice(0, 6) : null;
  const ilustrativo = m.ilustrativo || !dados;
  const casas = dados ? Math.max(...dados.map((d) => casasDe(d.valor))) : 0;
  const unidadeCurta = m.unidade && m.unidade.trim().length <= 3 ? m.unidade.trim() : "";
  const valorTexto = (v: number) => {
    const n = formatar(v, casas);
    return unidadeCurta === "%" ? `${n}%` : unidadeCurta ? `${n} ${unidadeCurta}` : n;
  };

  const padX = 40;
  const interno = largura - 2 * padX;
  // o gráfico usa a folga inteira: quanto mais alto, mais legível
  const alturaCartao = Math.min(altura, 560);
  const reservaEtiqueta = ilustrativo ? larguraTexto("ilustrativo", 30, { familia: "sans", peso: 600, espacamento: 0.16, caixaAlta: true }) + 50 : 0;
  const qTitulo = m.titulo
    ? encaixarNaCaixa(m.titulo, { largura: interno - reservaEtiqueta, altura: 130, max: 64, min: 48, linhas: 2, alturaLinha: 1.02, estilo: () => SERIF })
    : null;
  const unidadeLonga = m.unidade && !unidadeCurta ? m.unidade : "";
  const alturaCabeca = Math.max(qTitulo ? qTitulo.linhas.length * qTitulo.tamanho * 1.02 : 0, ilustrativo ? 44 : 0) + (unidadeLonga ? 46 : 0) + 18;
  const pad = 30 + 34;
  const alturaPlot = alturaCartao - 6 - pad - alturaCabeca;

  const inicio = m.tendenciaEm ?? (dados ? dados[0].em : m.de + 0.3);

  let corpo: React.ReactNode = null;

  if (!dados) {
    // ——— tendência qualitativa ———
    const W = interno;
    const H = alturaPlot - 10;
    const pts = curvaQualitativa(m.tendencia ?? "sobe", W - 30, H - 16).map(([x, y]) => [x + 6, y + 8] as [number, number]);
    const p = prog(t, inicio, 1.7, (x) => x);
    const ponta = Math.min(pts.length - 1, Math.floor(p * (pts.length - 1)));
    const frac = p * (pts.length - 1) - ponta;
    const [x0, y0] = pts[ponta];
    const [x1, y1] = pts[Math.min(pts.length - 1, ponta + 1)];
    const tip: [number, number] = [x0 + (x1 - x0) * frac, y0 + (y1 - y0) * frac];
    const desenhados = [...pts.slice(0, ponta + 1), tip];
    const area = `${caminho(desenhados)} L${tip[0].toFixed(1)} ${H} L${pts[0][0]} ${H} Z`;
    // depois de desenhada, a ponta segue respirando devagar pela curva (nada parado)
    const fim = pts[pts.length - 1];
    const antes = pts[pts.length - 4];
    const dir = m.tendencia === "oscila" ? 0 : 1;
    // ponta de seta no fim da curva, na direção do último trecho
    const ang = Math.atan2(fim[1] - antes[1], fim[0] - antes[0]);
    const asa = (d: number) => [fim[0] - 28 * Math.cos(ang + d), fim[1] - 28 * Math.sin(ang + d)];
    const [a1, a2] = [asa(0.5), asa(-0.5)];
    const ponta1 = `M${a1[0].toFixed(1)} ${a1[1].toFixed(1)} L${fim[0].toFixed(1)} ${fim[1].toFixed(1)} L${a2[0].toFixed(1)} ${a2[1].toFixed(1)}`;
    corpo = (
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {[0.33, 0.66].map((f) => (
          <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke={cor.fioTinta} strokeWidth={1.5} strokeDasharray="4 8" opacity={prog(t, m.de + 0.3, 0.5)} />
        ))}
        <line x1={0} x2={W} y1={H} y2={H} stroke={cor.tintaSuave} strokeWidth={2.5} opacity={prog(t, m.de + 0.2, 0.5)} />
        {p > 0.01 ? <path d={area} fill={cor.latao} opacity={0.2} /> : null}
        <Traco d={caminho(desenhados)} p={1} cor={cor.tinta} largura={5} />
        {p > 0.01 ? <circle cx={tip[0]} cy={tip[1]} r={11} fill={cor.latao} stroke={cor.tinta} strokeWidth={3} /> : null}
        {p >= 1 && dir !== 0 ? <Traco d={ponta1} p={prog(t, inicio + 1.7, 0.35)} cor={cor.tinta} largura={5} /> : null}
      </svg>
    );
  } else if (m.forma === "barras") {
    const n = dados.length;
    const W = interno;
    const slot = W / n;
    const larguraBarra = Math.min(120, slot * 0.56);
    const maior = Math.max(...dados.map((d) => d.valor), 0);
    const menor = Math.min(...dados.map((d) => d.valor), 0);
    const alturaRotulo = 74;
    const alturaValor = 54;
    const H = alturaPlot - alturaRotulo - alturaValor;
    const escalaY = (v: number) => (H * (v - menor)) / Math.max(1e-9, maior - menor);
    const indiceMaior = dados.findIndex((d) => d.valor === maior);
    const tamValor = Math.min(52, ...dados.map((d) => (slot - 8) / Math.max(1, larguraTexto(valorTexto(d.valor), 1, SERIF))));
    corpo = (
      <div style={{ position: "relative", width: W, height: alturaPlot }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: alturaValor + H, height: 2.5, background: cor.tintaSuave, opacity: prog(t, m.de + 0.2, 0.4) }} />
        {dados.map((d, k) => {
          const p = prog(t, d.em, 0.65);
          const h = Math.max(4, escalaY(d.valor)) * p;
          return (
            <div key={k} style={{ position: "absolute", left: k * slot, width: slot, top: 0, height: alturaPlot }}>
              <div
                style={{
                  position: "absolute",
                  left: (slot - larguraBarra) / 2,
                  width: larguraBarra,
                  top: alturaValor + H - h,
                  height: h,
                  background: k === indiceMaior ? cor.latao : cor.tinta,
                  opacity: t >= d.em - 0.05 ? 1 : 0,
                }}
              />
              {/* esboço a lápis da barra que ainda vai ser dita */}
              {t < d.em ? (
                <div
                  style={{
                    position: "absolute",
                    left: (slot - larguraBarra) / 2,
                    width: larguraBarra,
                    top: alturaValor + H - Math.max(4, escalaY(d.valor)) * 0.35,
                    height: Math.max(4, escalaY(d.valor)) * 0.35,
                    border: `2px dashed ${cor.fioTinta}`,
                    opacity: prog(t, m.de + 0.3, 0.4),
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: alturaValor + H - h - tamValor * 1.15,
                  textAlign: "center",
                  fontFamily: serif,
                  fontSize: tamValor,
                  lineHeight: 1,
                  color: cor.tinta,
                  opacity: prog(t, d.em + 0.3, 0.3),
                  whiteSpace: "nowrap",
                }}
              >
                {valorTexto(d.valor)}
              </div>
              <div style={{ position: "absolute", left: 4, right: 4, top: alturaValor + H + 12 }}>
                <RotuloDoEixo texto={d.rotulo} largura={slot - 8} p={prog(t, d.em, 0.4)} />
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (m.forma === "pizza") {
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    const D = Math.min(alturaPlot - 6, 300);
    const r = D / 2 - 22;
    const cores = [cor.tinta, cor.latao, "rgba(14,23,38,0.45)", "rgba(185,151,91,0.55)", "rgba(14,23,38,0.22)", "rgba(185,151,91,0.3)"];
    let acumulado = 0;
    const legendaW = interno - D - 40;
    const linhaLegenda = Math.min(78, alturaPlot / dados.length);
    corpo = (
      <div style={{ display: "flex", alignItems: "center", gap: 40, height: alturaPlot }}>
        <svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={{ flexShrink: 0, rotate: "-90deg" }}>
          <circle cx={D / 2} cy={D / 2} r={r} fill="none" stroke={cor.fioTinta} strokeWidth={40} strokeDasharray="6 10" opacity={prog(t, m.de + 0.2, 0.4)} />
          {dados.map((d, k) => {
            const fr = Math.max(0, d.valor) / total;
            const ini = acumulado;
            acumulado += fr;
            const p = prog(t, d.em, 0.7);
            return p > 0.001 ? (
              <circle
                key={k}
                cx={D / 2}
                cy={D / 2}
                r={r}
                fill="none"
                stroke={cores[k % cores.length]}
                strokeWidth={44}
                pathLength={1}
                strokeDasharray={`${Math.max(0, fr * p - 0.004)} 1`}
                strokeDashoffset={-ini}
              />
            ) : null;
          })}
        </svg>
        <div style={{ width: legendaW, display: "flex", flexDirection: "column" }}>
          {dados.map((d, k) => {
            const tam = Math.min(50, linhaLegenda * 0.66);
            const larguraValor = larguraTexto(valorTexto(d.valor), tam, SERIF) + 16;
            return (
              <div key={k} style={{ height: linhaLegenda, display: "flex", alignItems: "center", gap: 14, opacity: prog(t, d.em, 0.4) }}>
                <div style={{ width: 22, height: 22, background: cores[k % cores.length], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <RotuloDoEixo texto={d.rotulo} largura={legendaW - 36 - larguraValor} p={1} alinhar="left" />
                </div>
                <div style={{ fontFamily: serif, fontSize: tam, color: cor.tinta, whiteSpace: "nowrap" }}>{valorTexto(d.valor)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    // ——— linha com dados ———
    const n = dados.length;
    const W = interno;
    const alturaRotulo = 74;
    const topoValor = 56;
    const H = alturaPlot - alturaRotulo - topoValor;
    const vals = dados.map((d) => d.valor);
    const maior = Math.max(...vals);
    const menor = Math.min(...vals);
    const lo = maior > 0 && (maior - menor) / maior > 0.5 ? Math.min(0, menor) : menor - (maior - menor || maior || 1) * 0.35;
    const hi = maior;
    const slot = W / n;
    const xs = dados.map((_, k) => slot * (k + 0.5));
    const ys = dados.map((d) => topoValor + H - ((d.valor - lo) / Math.max(1e-9, hi - lo)) * H);
    const tamValor = Math.min(50, ...dados.map((d) => (slot - 6) / Math.max(1, larguraTexto(valorTexto(d.valor), 1, SERIF))));
    // a ponta do traço: avança do ponto k-1 ao ponto k quando k é dito
    let tip: [number, number] = [xs[0], ys[0]];
    const desenhados: [number, number][] = [];
    dados.forEach((d, k) => {
      if (k === 0) {
        if (t >= d.em - 0.05) desenhados.push([xs[0], ys[0]]);
        return;
      }
      const p = prog(t, d.em - 0.15, 0.55);
      if (p <= 0) return;
      const ponto: [number, number] = [xs[k - 1] + (xs[k] - xs[k - 1]) * p, ys[k - 1] + (ys[k] - ys[k - 1]) * p];
      desenhados.push(ponto);
      tip = ponto;
    });
    const area = desenhados.length > 1 ? `${caminho(desenhados)} L${tip[0]} ${topoValor + H} L${xs[0]} ${topoValor + H} Z` : "";
    corpo = (
      <div style={{ position: "relative", width: W, height: alturaPlot }}>
        <svg width={W} height={alturaPlot} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <line x1={0} x2={W} y1={topoValor + H} y2={topoValor + H} stroke={cor.tintaSuave} strokeWidth={2.5} opacity={prog(t, m.de + 0.2, 0.4)} />
          {xs.map((x, k) => (
            <line key={k} x1={x} x2={x} y1={topoValor} y2={topoValor + H} stroke={cor.fioTinta} strokeWidth={1.5} strokeDasharray="4 8" opacity={prog(t, m.de + 0.3, 0.4)} />
          ))}
          {area ? <path d={area} fill={cor.latao} opacity={0.2} /> : null}
          {desenhados.length > 1 ? <Traco d={caminho(desenhados)} cor={cor.tinta} largura={5} /> : null}
          {dados.map((d, k) =>
            t >= d.em - 0.05 ? (
              <circle key={k} cx={xs[k]} cy={ys[k]} r={k === n - 1 ? 12 : 9} fill={k === n - 1 ? cor.latao : cor.papel} stroke={cor.tinta} strokeWidth={3.5} />
            ) : null,
          )}
        </svg>
        {dados.map((d, k) => (
          <div key={k}>
            <div
              style={{
                position: "absolute",
                left: xs[k] - slot / 2,
                width: slot,
                top: ys[k] - tamValor * 1.3,
                textAlign: "center",
                fontFamily: serif,
                fontSize: tamValor,
                lineHeight: 1,
                color: cor.tinta,
                opacity: prog(t, d.em + 0.25, 0.3),
                whiteSpace: "nowrap",
              }}
            >
              {valorTexto(d.valor)}
            </div>
            <div style={{ position: "absolute", left: xs[k] - slot / 2 + 3, width: slot - 6, top: topoValor + H + 12 }}>
              <RotuloDoEixo texto={d.rotulo} largura={slot - 6} p={prog(t, d.em, 0.4)} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Ajuste h={alturaCartao} folga={folga}>
    <div style={{ width: "100%", height: alturaCartao, display: "flex" }}>
      <Papel t={t} de={m.de} ate={m.ate} sai={sai} padding={`30px ${padX}px 34px`} style={{ display: "flex", flexDirection: "column", height: alturaCartao }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            {qTitulo
              ? qTitulo.linhas.map((l, j) => (
                  <div
                    key={j}
                    style={{
                      fontFamily: serif,
                      fontSize: qTitulo.tamanho,
                      lineHeight: 1.02,
                      color: cor.tinta,
                      whiteSpace: "nowrap",
                      opacity: prog(t, m.de + 0.2 + j * 0.08, 0.4),
                    }}
                  >
                    {l.map((p) => p.w).join(" ")}
                  </div>
                ))
              : null}
            {unidadeLonga ? (
              <div style={{ marginTop: 10 }}>
                <Letreiro texto={unidadeLonga} t={t} inicio={m.de + 0.3} largura={interno - reservaEtiqueta} fios="nenhum" alinhar="left" corTexto={cor.tintaSuave} />
              </div>
            ) : null}
          </div>
          {ilustrativo ? <Ilustrativo p={prog(t, m.de + 0.3, 0.4)} sobrePapel /> : null}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>{corpo}</div>
      </Papel>
    </div>
    </Ajuste>
  );
};
