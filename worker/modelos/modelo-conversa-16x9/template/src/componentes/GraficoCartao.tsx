// O gráfico "compartilhado" na conversa: um cartão claro (como os avisos do sistema) com o desenho a
// traço em tinta e os dados no acento. Cada dado cresce no seu `em`; sem números ditos, uma curva
// ilustrativa se desenha na fala e um ponto segue andando por ela.
import { Easing } from "remotion";
import { limitar, prog, Traco } from "../anim";
import type { Medida } from "../fio";
import { caminhoSuave, geoGrafico, PAD_GRAFICO, pontosDaTendencia, valorNaTela } from "../grafico";
import type { Grafico } from "../plano";
import { ajustarTexto, cor, fonte } from "../tema";

const tinta = cor.tinta;
const tintaFraca = "rgba(21,17,14,0.16)";
const tintaMedia = "rgba(21,17,14,0.55)";
// tons das fatias da rosca: o acento e tons de tinta (poucas cores)
const FATIAS = [cor.acento, tinta, "#8E939B", cor.acentoClaro, "#4C525C", "#C9C1B4"];

const Etiqueta: React.FC<{ texto: string }> = ({ texto }) => (
  <div
    style={{
      height: 44,
      padding: "0 16px",
      borderRadius: 22,
      border: `3px solid ${tintaMedia}`,
      display: "flex",
      alignItems: "center",
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: tintaMedia,
    }}
  >
    {texto}
  </div>
);

export const GraficoCartao: React.FC<{ g: Grafico; med: Medida; t: number; entrada: number }> = ({ g, med, t, entrada }) => {
  const geo = geoGrafico(g, med.w);
  const dados = g.dados ?? [];
  const a = geo.area;
  const maximo = Math.max(...dados.map((d) => d.valor), 0.0001);
  const cresce = (em: number) => prog(t, em - 0.08, 0.7, Easing.bezier(0.2, 0.9, 0.25, 1));

  let desenho: React.ReactNode = null;

  if (geo.forma === "barras") {
    const x0 = geo.colunaRotulo;
    const largura = a.w - x0 - 10;
    desenho = geo.barras.map((b, i) => {
      const d = dados[i];
      const p = cresce(d.em);
      const comprimento = Math.max(14, (d.valor / maximo) * (largura - 150));
      const alturaBarra = Math.min(46, b.h - 26);
      const topoBarra = b.y + (b.h - alturaBarra) / 2;
      return (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: PAD_GRAFICO,
              top: b.y,
              width: x0 - 20,
              height: b.h,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              fontSize: b.corpoRotulo,
              fontWeight: 600,
              lineHeight: 1.15,
              color: p > 0 ? tinta : tintaMedia,
            }}
          >
            {b.rotulo.map((l, k) => (
              <div key={k} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
          {/* trilho a lápis e a barra que cresce na palavra */}
          <div style={{ position: "absolute", left: PAD_GRAFICO + x0, top: topoBarra, width: largura - 150, height: alturaBarra, borderRadius: alturaBarra / 2, border: `3px dashed ${tintaFraca}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: PAD_GRAFICO + x0, top: topoBarra, width: comprimento * p, height: alturaBarra, borderRadius: alturaBarra / 2, background: cor.acento }} />
          <div
            style={{
              position: "absolute",
              left: PAD_GRAFICO + x0 + comprimento * p + 16,
              top: b.y,
              height: b.h,
              display: "flex",
              alignItems: "center",
              fontSize: geo.corpoValor,
              fontWeight: 800,
              color: tinta,
              opacity: limitar(p * 2 - 0.4),
              whiteSpace: "nowrap",
            }}
          >
            {b.valor}
          </div>
        </div>
      );
    });
  } else if (geo.forma === "pizza") {
    const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
    const r = Math.min(a.h, a.w * 0.42) / 2 - 10;
    const cx = PAD_GRAFICO + r + 10;
    const cy = a.y + a.h / 2;
    let acumulado = 0;
    const fatias = dados.map((d, i) => {
      const ini = acumulado / total;
      acumulado += d.valor;
      return { ini, fim: acumulado / total, cor: FATIAS[i % FATIAS.length], p: cresce(d.em) };
    });
    const legendaX = cx + r + 50;
    const linhaH = Math.min(74, a.h / dados.length);
    // o nome de cada fatia diminui (até 2 linhas) para caber ao lado da porcentagem
    const larguraNome = med.w - PAD_GRAFICO - legendaX - 26 - 14 - geo.corpoValor * 2.1 - 14;
    const rotulos = dados.map((d) => ajustarTexto(d.rotulo, larguraNome, geo.corpoValor, 30, 600, linhaH >= 70 ? 2 : 1));
    desenho = (
      <>
        <svg width={med.w} height={med.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={r - 26} fill="none" stroke={tintaFraca} strokeWidth={52} strokeDasharray="10 10" />
          {fatias.map((f, i) => {
            const circ = 2 * Math.PI * (r - 26);
            const tam = (f.fim - f.ini) * circ * f.p;
            return f.p > 0 ? (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r - 26}
                fill="none"
                stroke={f.cor}
                strokeWidth={52}
                strokeDasharray={`${Math.max(0, tam - 3)} ${circ}`}
                strokeDashoffset={-f.ini * circ}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            ) : null;
          })}
        </svg>
        {dados.map((d, i) => {
          const p = fatias[i].p;
          const pct = Math.round((d.valor / total) * 100);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: legendaX,
                top: cy - (dados.length * linhaH) / 2 + i * linhaH,
                height: linhaH,
                right: PAD_GRAFICO,
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: geo.corpoValor,
                fontWeight: 600,
                color: p > 0 ? tinta : tintaMedia,
              }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 8, background: p > 0 ? fatias[i].cor : tintaFraca, flexShrink: 0 }} />
              <div style={{ fontWeight: 800, minWidth: geo.corpoValor * 2.1 }}>{p > 0 ? `${pct}%` : "—"}</div>
              <div style={{ fontSize: rotulos[i].corpo, lineHeight: 1.1 }}>
                {rotulos[i].linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  } else if (geo.forma === "linha") {
    const n = dados.length;
    const fatia = a.w / n;
    const topoValores = 56;
    const pts: [number, number][] = dados.map((d, i) => [a.x + fatia * (i + 0.5), a.y + topoValores + (1 - d.valor / maximo) * (a.h - topoValores - 30)]);
    // o traço chega a cada ponto no `em` do dado
    const ps = dados.map((d) => cresce(d.em));
    const ultimo = ps.reduce((k, p, i) => (p > 0 ? i : k), -1);
    // o último trecho corre do ponto anterior até o novo enquanto o dado cresce
    const visivel: [number, number][] = ultimo < 0 ? [] : pts.slice(0, ultimo + 1).map((p, i) => {
      if (i !== ultimo || i === 0) return p;
      const q = pts[i - 1];
      const k = ps[i];
      return [q[0] + (p[0] - q[0]) * k, q[1] + (p[1] - q[1]) * k];
    });
    desenho = (
      <>
        <svg width={med.w} height={med.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={a.x} x2={a.x + a.w} y1={a.y + a.h} y2={a.y + a.h} stroke={tintaFraca} strokeWidth={4} />
          {pts.map((p, i) => (
            <line key={i} x1={p[0]} x2={p[0]} y1={a.y + topoValores - 10} y2={a.y + a.h} stroke={tintaFraca} strokeWidth={3} strokeDasharray="6 10" />
          ))}
          {visivel.length > 1 ? <Traco d={`M${visivel.map((p) => `${p[0]} ${p[1]}`).join(" L")}`} cor={cor.acento} largura={8} p={1} /> : null}
          {pts.map((p, i) =>
            ps[i] > 0 ? <circle key={i} cx={p[0]} cy={p[1]} r={12 + 4 * ps[i]} fill={cor.acento} stroke={cor.cartao} strokeWidth={5} opacity={ps[i]} /> : null,
          )}
        </svg>
        {pts.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p[0] - fatia / 2,
              width: fatia,
              top: p[1] - geo.corpoValor - 22,
              textAlign: "center",
              fontSize: geo.corpoValor,
              fontWeight: 800,
              color: tinta,
              opacity: ps[i],
              whiteSpace: "nowrap",
            }}
          >
            {valorNaTela(g, dados[i].valor)}
          </div>
        ))}
        {geo.rotulosEixo.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: a.x + fatia * i,
              width: fatia,
              top: a.y + a.h + 10,
              textAlign: "center",
              fontSize: geo.corpoEixo,
              fontWeight: 600,
              lineHeight: 1.15,
              color: ps[i] > 0 ? tinta : tintaMedia,
            }}
          >
            {r.map((l, k) => (
              <div key={k} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
        ))}
      </>
    );
  } else {
    // tendência ilustrativa: a curva se desenha na fala; um ponto anda devagar por ela depois
    const inicio = g.tendenciaEm ?? entrada + 0.2;
    const p = prog(t, inicio - 0.1, 1.6, Easing.bezier(0.45, 0, 0.25, 1));
    const pts = pontosDaTendencia(g.tendencia).map(([x, y]) => [a.x + 20 + x * (a.w - 60), a.y + 20 + (1 - y) * (a.h - 50)] as [number, number]);
    const d = caminhoSuave(pts);
    const fim = pts[pts.length - 1];
    const respira = 0.5 + 0.5 * Math.sin((t - inicio) * Math.PI * 1.3);
    desenho = (
      <svg width={med.w} height={med.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={a.x} x2={a.x + a.w} y1={a.y + a.h - 10} y2={a.y + a.h - 10} stroke={tintaFraca} strokeWidth={4} />
        <line x1={a.x} x2={a.x} y1={a.y} y2={a.y + a.h - 10} stroke={tintaFraca} strokeWidth={4} />
        <path d={d} fill="none" stroke={tintaFraca} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" />
        <Traco d={d} cor={cor.acento} largura={9} p={p} />
        {p >= 1 ? (
          <>
            <circle cx={fim[0]} cy={fim[1]} r={24 + 8 * respira} fill={cor.acento} opacity={0.18} />
            <circle cx={fim[0]} cy={fim[1]} r={15} fill={cor.acento} stroke={cor.cartao} strokeWidth={5} />
          </>
        ) : null}
      </svg>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: med.w,
        height: med.h,
        borderRadius: 40,
        background: cor.cartao,
        color: tinta,
        fontFamily: fonte,
        overflow: "hidden",
      }}
    >
      {geo.temTopo ? (
        <div style={{ position: "absolute", left: PAD_GRAFICO, right: PAD_GRAFICO, top: PAD_GRAFICO - 6, height: 50, display: "flex", alignItems: "center", gap: 16 }}>
          {g.ilustrativo || geo.forma === "tendencia" ? <Etiqueta texto="ilustrativo" /> : null}
          <div style={{ flex: 1 }} />
          {g.unidade ? <div style={{ fontSize: 34, fontWeight: 600, color: tintaMedia, whiteSpace: "nowrap" }}>{g.unidade}</div> : null}
        </div>
      ) : null}
      {desenho}
    </div>
  );
};
