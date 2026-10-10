// Os blocos universais que abrem o palco (modo b), desenhados DENTRO do painel (1008×1000):
// lista (topicos), passos, numero, comparacao, grafico e definicao. A janela da pessoa cobre
// só um canto de baixo do painel, por isso o conteúdo fica na área de cima (AREA_H).
import { encaixar, larguraTexto } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Canto, Comparacao as TComparacao, Definicao as TDefinicao, Grafico as TGrafico, MomentoDePalco, Numero as TNumero, Passos as TPassos, Plano, Topicos as TTopicos } from "../plano";
import { COR, FONTE, PAINEL, formatar, prog, suave } from "../tema";

const W = PAINEL.w;
// o que fica livre da janela da pessoa
const AREA_H = 880;
const PAD = 40;

// título pequeno e apagado no alto do bloco, com a barra azul
const Cabecalho: React.FC<{ texto?: string; t: number; em: number }> = ({ texto, t, em }) => {
  if (!texto) return null;
  const e = prog(t, em, 0.35);
  return (
    <div style={{ position: "absolute", left: PAD, top: 34, display: "flex", alignItems: "center", opacity: e, transform: `translateX(${(1 - e) * -12}px)` }}>
      <div style={{ width: 8, height: 40, borderRadius: 4, background: COR.azul, marginRight: 16 }} />
      <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: 36, color: COR.apagado, whiteSpace: "nowrap" }}>{texto}</div>
    </div>
  );
};

const Marcador: React.FC<{ texto: string; tamanho: number; ativo: boolean }> = ({ texto, tamanho, ativo }) => (
  <div
    style={{
      width: tamanho,
      height: tamanho,
      flex: "none",
      borderRadius: tamanho * 0.3,
      background: ativo ? COR.azul : COR.linha,
      color: COR.branco,
      fontFamily: FONTE,
      fontWeight: 800,
      fontSize: Math.round(tamanho * 0.5),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {texto}
  </div>
);

// ——— topicos e passos ———
const Lista: React.FC<{ m: TTopicos | TPassos; t: number }> = ({ m, t }) => {
  const n = m.itens.length;
  const topo = m.titulo ? 110 : 40;
  const gap = 18;
  const linha = Math.min(150, (AREA_H - topo - gap * (n - 1)) / n);
  const mk = Math.round(Math.min(84, linha * 0.6));
  const temDetalhe = linha >= 120 && m.itens.some((i) => i.detalhe);
  const largTexto = W - PAD * 2 - mk - 70;
  const tam = Math.min(...m.itens.map((i) => encaixar(i.texto, { largura: largTexto, max: Math.round(linha * (temDetalhe ? 0.34 : 0.4)), min: 32, linhas: 1, fonte: { peso: 800 } }).tamanho));
  const passos = m.tipo === "passos";
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  return (
    <>
      <Cabecalho texto={m.titulo} t={t} em={m.de} />
      {m.itens.map((it, i) => {
        const e = prog(t, it.em - 0.05, 0.34);
        if (e <= 0) return null;
        const corrente = i === atual;
        const y = topo + i * (linha + gap);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PAD,
              top: y,
              width: W - PAD * 2,
              height: linha,
              borderRadius: 26,
              background: COR.painelClaro,
              display: "flex",
              alignItems: "center",
              paddingLeft: 22,
              boxSizing: "border-box",
              opacity: e,
              transform: `translateY(${(1 - e) * 22}px)`,
              overflow: "hidden",
            }}
          >
            {/* o marca-texto azul da vez: cresce da esquerda quando o item é dito */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (W - PAD * 2) * (corrente ? prog(t, it.em - 0.05, 0.45) : 0), background: COR.grifo }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: corrente ? COR.azul : "transparent" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Marcador texto={passos ? String(i + 1) : "•"} tamanho={mk} ativo={corrente} />
              <div style={{ marginLeft: 26, display: "flex", flexDirection: "column" }}>
                <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, color: corrente ? COR.branco : COR.texto, whiteSpace: "nowrap", lineHeight: 1.15, letterSpacing: "-0.01em" }}>{it.texto}</div>
                {temDetalhe && it.detalhe ? <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: Math.round(tam * 0.62), color: COR.apagado, whiteSpace: "nowrap", lineHeight: 1.2 }}>{it.detalhe}</div> : null}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

// ——— numero ———
const Numero: React.FC<{ m: TNumero; t: number }> = ({ m, t }) => {
  const casas = m.casas ?? 0;
  const final = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const num = encaixar(final, { largura: W - PAD * 2, max: 300, min: 90, linhas: 1, fonte: { peso: 800 } });
  const rot = encaixar(m.rotulo, { largura: W - PAD * 2, max: 58, min: 32, linhas: 2, fonte: { peso: 700 } });
  const larg = larguraTexto(final, num.tamanho, { peso: 800 });
  const p = prog(t, m.em, 1.0);
  const valor = m.valor * p;
  const atual = `${m.prefixo ?? ""}${formatar(casas === 0 ? Math.round(valor) : valor, casas)}${m.sufixo ?? ""}`;
  const r = prog(t, m.rotuloEm ?? m.em + 0.5, 0.35);
  const hNum = num.tamanho * 1.05;
  const bloco = (m.titulo ? 70 : 0) + hNum + 40 + rot.linhas.length * rot.tamanho * 1.25;
  const y0 = Math.max(60, (AREA_H - bloco) / 2);
  return (
    <>
      {m.titulo ? (
        <div style={{ position: "absolute", left: 0, width: W, top: y0, textAlign: "center", fontFamily: FONTE, fontWeight: 700, fontSize: 38, color: COR.apagado, opacity: prog(t, m.de, 0.35) }}>{m.titulo}</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, width: W, top: y0 + (m.titulo ? 70 : 0), height: hNum, lineHeight: `${hNum}px`, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: num.tamanho, color: COR.texto, letterSpacing: "-0.03em" }}>
        {atual}
      </div>
      <div style={{ position: "absolute", left: (W - larg * 0.8) / 2, top: y0 + (m.titulo ? 70 : 0) + hNum + 8, width: larg * 0.8 * p, height: 12, borderRadius: 6, background: COR.azul }} />
      {rot.linhas.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: y0 + (m.titulo ? 70 : 0) + hNum + 44 + i * rot.tamanho * 1.25,
            textAlign: "center",
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: rot.tamanho,
            color: COR.texto,
            opacity: r,
            transform: `translateY(${(1 - r) * 12}px)`,
          }}
        >
          {l}
        </div>
      ))}
      {m.ilustrativo ? <div style={{ position: "absolute", right: 28, top: 28, fontFamily: FONTE, fontWeight: 600, fontSize: 26, color: COR.apagado }}>ilustrativo</div> : null}
    </>
  );
};

// ——— comparacao: duas metades, cada uma no seu tempo (com foto quando houver) ———
const Comparacao: React.FC<{ plano: Plano; m: TComparacao; t: number }> = ({ plano, m, t }) => {
  const vao = 20;
  const w = (W - PAD * 2 - vao) / 2;
  const h = AREA_H - 40;
  const venc = m.vencedor;
  const pv = venc === undefined ? 0 : prog(t, m.vencedorEm ?? Math.max(...m.lados.map((l) => l.em)) + 0.4, 0.4);
  const sinal = m.modo === "antes-depois" ? "→" : m.modo === "errado-certo" ? "≠" : "×";
  return (
    <>
      {m.lados.map((l, i) => {
        const e = prog(t, l.em - 0.08, 0.4);
        if (e <= 0) return null;
        const img = l.imagem ? imagemDoPlano(plano, l.imagem) : null;
        const perdedor = venc !== undefined && venc !== i;
        const tx = encaixar(l.texto, { largura: w - 56, max: 80, min: 38, linhas: 3, fonte: { peso: 800 } });
        const rot = encaixar(l.rotulo, { largura: w - 56, max: 36, min: 26, linhas: 1, fonte: { peso: 700 } });
        const hImg = img ? h * 0.52 : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PAD + i * (w + vao),
              top: 20,
              width: w,
              height: h,
              borderRadius: 28,
              background: COR.painelClaro,
              overflow: "hidden",
              opacity: e * (perdedor ? 1 - 0.45 * pv : 1),
              transform: `translateY(${(1 - e) * 26}px)`,
              boxShadow: venc === i && pv > 0 ? `0 0 0 ${Math.round(6 * pv)}px ${COR.azul}` : "none",
            }}
          >
            {img && l.imagem ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: w, height: hImg }}>
                {temImagem(img) ? <Foto imagem={img} foco={l.imagem.foco} de={l.em} t={t} largura={w} altura={hImg} efeito="parado" /> : <Foto imagem={img} de={l.em} t={t} largura={w} altura={hImg} efeito="parado" cartao={{ fundo: COR.painel, cor: COR.texto, fonte: FONTE }} />}
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 28, right: 28, top: hImg + 26, fontFamily: FONTE, fontWeight: 700, fontSize: rot.tamanho, color: COR.apagado }}>{l.rotulo}</div>
            {tx.linhas.map((ln, k) => (
              <div key={k} style={{ position: "absolute", left: 28, right: 28, top: hImg + 26 + rot.tamanho * 1.5 + k * tx.tamanho * 1.12, fontFamily: FONTE, fontWeight: 800, fontSize: tx.tamanho, lineHeight: 1.1, letterSpacing: "-0.02em", color: COR.texto, whiteSpace: "nowrap" }}>
                {ln}
              </div>
            ))}
            {perdedor && m.modo === "errado-certo" ? (
              <div style={{ position: "absolute", left: 24, right: 24, top: hImg + 26 + rot.tamanho * 1.5 + (tx.linhas.length * tx.tamanho * 1.12) / 2, height: 6, borderRadius: 3, background: COR.texto, transform: `scaleX(${pv})`, transformOrigin: "left" }} />
            ) : null}
          </div>
        );
      })}
      {t >= m.lados[1].em - 0.1 ? (
        <div style={{ position: "absolute", left: PAD + w + vao / 2 - 32, top: 20 + h / 2 - 32, width: 64, height: 64, borderRadius: 32, background: COR.azul, color: COR.branco, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 36, transform: `scale(${prog(t, m.lados[1].em - 0.1, 0.3)})` }}>
          {sinal}
        </div>
      ) : null}
      {m.titulo ? <Cabecalho texto={m.titulo} t={t} em={m.de + 0.1} /> : null}
    </>
  );
};

// ——— definicao ———
const Definicao: React.FC<{ m: TDefinicao; t: number }> = ({ m, t }) => {
  const termo = encaixar(m.termo, { largura: W - PAD * 2 - 20, max: 120, min: 56, linhas: 2, fonte: { peso: 800 } });
  const sig = encaixar(m.significado, { largura: W - PAD * 2 - 20, max: 54, min: 34, linhas: 4, fonte: { peso: 700 } });
  const pt = prog(t, m.em - 0.03, 0.35);
  const ps = prog(t, m.significadoEm - 0.03, 0.4);
  const hT = termo.linhas.length * termo.tamanho * 1.12;
  const hS = sig.linhas.length * sig.tamanho * 1.3;
  const y0 = Math.max(60, (AREA_H - (hT + 56 + hS)) / 2);
  return (
    <>
      {termo.linhas.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: PAD + 10, top: y0 + i * termo.tamanho * 1.12, fontFamily: FONTE, fontWeight: 800, fontSize: termo.tamanho, lineHeight: 1.12, color: COR.texto, letterSpacing: "-0.02em", whiteSpace: "nowrap", opacity: pt, transform: `translateY(${(1 - pt) * 14}px)` }}>
          {l}
        </div>
      ))}
      <div style={{ position: "absolute", left: PAD + 10, top: y0 + hT + 14, width: (180 + 120 * ps) * pt, height: 12, borderRadius: 6, background: COR.azul }} />
      {sig.linhas.map((l, i) => {
        const e = prog(t, m.significadoEm - 0.03 + i * 0.12, 0.34);
        return (
          <div key={i} style={{ position: "absolute", left: PAD + 10, top: y0 + hT + 56 + i * sig.tamanho * 1.3, fontFamily: FONTE, fontWeight: 700, fontSize: sig.tamanho, color: COR.texto, whiteSpace: "nowrap", opacity: e * ps, transform: `translateY(${(1 - e) * 10}px)` }}>
            {l}
          </div>
        );
      })}
    </>
  );
};

// ——— grafico ———
const Grafico: React.FC<{ m: TGrafico; t: number }> = ({ m, t }) => {
  const pad = PAD;
  const hTit = m.titulo ? 90 : 20;
  const dados = m.dados ?? [];
  const area = { x: pad, y: pad + hTit, w: W - pad * 2, h: AREA_H - pad * 2 - hTit - 40 };
  const fmt = (v: number) => `${formatar(v, Number.isInteger(v) ? 0 : 1)}${m.unidade ? ` ${m.unidade}` : ""}`;
  const maxV = Math.max(1, ...dados.map((d) => d.valor));
  let corpo: React.ReactNode = null;
  if (dados.length && m.forma === "barras") {
    const bw = Math.min(190, (area.w - (dados.length - 1) * 30) / dados.length);
    const total = dados.length * bw + (dados.length - 1) * 30;
    corpo = dados.map((d, i) => {
      const p = prog(t, d.em - 0.05, 0.55);
      const bh = (area.h - 80) * (d.valor / maxV) * p;
      const x = area.x + (area.w - total) / 2 + i * (bw + 30);
      const corrente = i === dados.filter((x2) => t >= x2.em - 0.05).length - 1;
      return (
        <div key={i}>
          <div style={{ position: "absolute", left: x, top: area.y + area.h - bh, width: bw, height: bh, borderRadius: 14, background: corrente ? COR.azul : COR.linha }} />
          <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: area.y + area.h - bh - 54, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 40, color: COR.texto, opacity: p }}>{fmt(d.valor)}</div>
          <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: area.y + area.h + 12, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: 30, color: COR.apagado, opacity: p, whiteSpace: "nowrap" }}>{d.rotulo}</div>
        </div>
      );
    });
  } else if (dados.length && m.forma === "pizza") {
    const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const r = Math.min(area.h, 400) / 2;
    const cx = area.x + r + 10;
    const cy = area.y + area.h / 2;
    let acum = 0;
    const circ = 2 * Math.PI * (r - 34);
    const cores = [COR.azul, COR.apagado, COR.linha, COR.painelClaro];
    corpo = (
      <>
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={AREA_H}>
          <circle cx={cx} cy={cy} r={r - 34} fill="none" stroke={COR.painelClaro} strokeWidth={60} />
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.55);
            const parte = (d.valor / soma) * circ * p;
            const el = <circle key={i} cx={cx} cy={cy} r={r - 34} fill="none" stroke={cores[i % cores.length]} strokeWidth={60} strokeDasharray={`${parte} ${circ}`} strokeDashoffset={-acum} transform={`rotate(-90 ${cx} ${cy})`} />;
            acum += (d.valor / soma) * circ;
            return el;
          })}
        </svg>
        {dados.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: cx + r + 40, top: cy - (dados.length * 66) / 2 + i * 66, display: "flex", alignItems: "center", opacity: prog(t, d.em - 0.05, 0.3), fontFamily: FONTE, fontWeight: 700, fontSize: 36, color: COR.texto, whiteSpace: "nowrap" }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: cores[i % cores.length], marginRight: 16 }} />
            {d.rotulo} · {fmt(d.valor)}
          </div>
        ))}
      </>
    );
  } else {
    const pts =
      dados.length >= 2
        ? dados.map((d, i) => ({ x: area.x + (area.w * i) / (dados.length - 1), y: area.y + 30 + (area.h - 100) * (1 - d.valor / maxV), em: d.em }))
        : (m.tendencia === "cai" ? [0.15, 0.3, 0.38, 0.6, 0.85] : m.tendencia === "oscila" ? [0.6, 0.3, 0.65, 0.35, 0.5] : [0.85, 0.7, 0.62, 0.4, 0.15]).map((v, i, l) => ({
            x: area.x + (area.w * i) / (l.length - 1),
            y: area.y + 30 + (area.h - 100) * v,
            em: (m.tendenciaEm ?? m.de + 0.3) + i * 0.22,
          }));
    const comp = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
    const ini = pts[0].em;
    const fim = pts[pts.length - 1].em + 0.3;
    const p = prog(t, ini - 0.05, Math.max(0.4, fim - ini), suave);
    corpo = (
      <>
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={AREA_H}>
          <line x1={area.x} x2={area.x + area.w} y1={area.y + area.h} y2={area.y + area.h} stroke={COR.linha} strokeWidth={4} />
          <polyline points={pts.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke={COR.azul} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={comp} strokeDashoffset={comp * (1 - p)} />
          {pts.map((q, i) => (t >= q.em - 0.05 ? <circle key={i} cx={q.x} cy={q.y} r={15} fill={COR.texto} stroke={COR.azul} strokeWidth={6} /> : null))}
        </svg>
        {dados.length >= 2
          ? dados.map((d, i) => (
              <div key={i} style={{ position: "absolute", left: pts[i].x - 90, width: 180, top: area.y + area.h + 12, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: 28, color: COR.apagado, opacity: prog(t, d.em - 0.05, 0.3), whiteSpace: "nowrap" }}>
                {d.rotulo} · {fmt(d.valor)}
              </div>
            ))
          : null}
      </>
    );
  }
  return (
    <>
      <Cabecalho texto={m.titulo} t={t} em={m.de} />
      {corpo}
      {m.ilustrativo || !dados.length ? <div style={{ position: "absolute", right: 28, top: 36, fontFamily: FONTE, fontWeight: 600, fontSize: 26, color: COR.apagado }}>ilustrativo</div> : null}
    </>
  );
};

export const ConteudoDoBloco: React.FC<{ plano: Plano; m: Exclude<MomentoDePalco, { tipo: "palco" }>; canto: Canto; t: number }> = ({ plano, m, t }) => {
  switch (m.tipo) {
    case "topicos":
    case "passos":
      return <Lista m={m} t={t} />;
    case "numero":
      return <Numero m={m} t={t} />;
    case "comparacao":
      return <Comparacao plano={plano} m={m} t={t} />;
    case "grafico":
      return <Grafico m={m} t={t} />;
    case "definicao":
      return <Definicao m={m} t={t} />;
    default:
      return null;
  }
};
