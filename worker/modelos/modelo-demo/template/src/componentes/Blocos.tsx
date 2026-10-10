// Os blocos da Tela Viva, desenhados para o PALCO (1080×658, que a Tela Viva encolhe para dentro da moldura de 958×584 no topo). Cada bloco ocupa o palco
// inteiro com fundo próprio (grafite, ou a foto) e é coberto pelo próximo: o Palco cuida da troca.
// Regras: texto medido com as larguras reais da Manrope (nunca vaza), cada item entra no seu `em`,
// nada fica parado (o conteúdo aproxima devagar, ícones respiram, números contam).
import { imagemDoPlano, Foto, Recorte, SemImagem, temImagem } from "../motor/imagem";
import { encaixar, larguraTexto, temposDasPalavras } from "../medida";
import type {
  Comparacao as TComparacao,
  Cta as TCta,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Numero as TNumero,
  Pergunta as TPergunta,
  Plano,
  Passos as TPassos,
  Topicos as TTopicos,
} from "../plano";
import { COR, FONTE, LARGURA, MARGEM, PALCO_H, aproximacao, formatar, prog, suave } from "../tema";
import { IconeTraco } from "./Icones";
import { APERTO, TextoFalado, disporTexto } from "./Texto";

export type PropsBloco<M> = { plano: Plano; m: M; t: number; fim: number };

const LARG_UTIL = LARGURA - MARGEM * 2;

// ——— peças comuns ———

const Fundo: React.FC<{ cor?: string; children?: React.ReactNode }> = ({ cor = COR.palco, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: PALCO_H, background: cor, overflow: "hidden" }}>{children}</div>
);

// o conteúdo de texto aproxima devagar (como a foto): o palco nunca fica parado
const Aproxima: React.FC<{ t: number; de: number; origem?: string; children: React.ReactNode }> = ({ t, de, origem = "0% 50%", children }) => (
  <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + (aproximacao(t, de) - 1) * 0.5})`, transformOrigin: origem }}>{children}</div>
);

// chapéu: quadradinho neon + texto pequeno em caixa-alta, no alto à esquerda
export const Chapeu: React.FC<{ texto?: string; t: number; de: number; cor?: string; y?: number }> = ({ texto, t, de, cor = COR.apagado, y = 58 }) => {
  if (!texto) return null;
  const e = prog(t, de + 0.08, 0.4);
  const tam = 24;
  const w = larguraTexto(texto.toUpperCase(), tam, { peso: 700, espacamento: 0.12 }) + 40;
  return (
    <div style={{ position: "absolute", left: MARGEM, top: y, height: 30, width: w * e, overflow: "hidden", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
      <div style={{ width: 12, height: 12, background: COR.neon, marginRight: 16, flexShrink: 0 }} />
      <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: tam, letterSpacing: "0.12em", textTransform: "uppercase", color: cor }}>{texto}</div>
    </div>
  );
};

// etiqueta "ilustrativo" (gráfico/número sem dado dito)
const Ilustrativo: React.FC<{ t: number; de: number; escuro?: boolean }> = ({ t, de, escuro }) => (
  <div
    style={{
      position: "absolute",
      right: MARGEM,
      top: 54,
      opacity: prog(t, de + 0.3, 0.3),
      fontFamily: FONTE,
      fontWeight: 700,
      fontSize: 22,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: escuro ? COR.tinta : COR.apagado,
      border: `2px solid ${escuro ? COR.tinta : COR.fio}`,
      borderRadius: 999,
      padding: "4px 14px",
    }}
  >
    ilustrativo
  </div>
);

// barra neon que cresce (sublinhado, progresso)
const Barra: React.FC<{ x: number; y: number; w: number; p: number; h?: number; cor?: string }> = ({ x, y, w, p, h = 8, cor = COR.neon }) =>
  p <= 0 ? null : <div style={{ position: "absolute", left: x, top: y, width: Math.max(h, w * p), height: h, borderRadius: h / 2, background: cor }} />;

const linhasDe = (texto: string, largura: number, max: number, min: number, linhas: number, peso: 600 | 700 | 800 = 800) =>
  encaixar(texto, { largura, max, min, linhas, fonte: { peso, espacamento: APERTO } });

// ——— lista (topicos) e sequência (passos) ———

const Lista: React.FC<{ plano: Plano; m: TTopicos | TPassos; t: number; numerada: boolean }> = ({ plano, m, t, numerada }) => {
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const topoLista = m.titulo || m.chapeu ? 124 : 84;
  const disponivel = PALCO_H - topoLista - 56;
  const linhaH = Math.min(n <= 2 ? 190 : 150, disponivel / n);
  const comDetalhe = n <= 3;
  // itens com imagem: a miniatura entra no lugar do marcador
  const comImagem = itens.some((it) => it.imagem);
  const th = comImagem ? Math.round(Math.min(linhaH - 22, 118)) : 0;
  const xTexto = MARGEM + (comImagem ? th + 34 : numerada ? 84 : 52);
  const largTexto = LARGURA - MARGEM - xTexto;
  const tamMax = Math.min(64, Math.floor(linhaH * (comDetalhe ? 0.4 : 0.5)));
  // corpo único para todos os itens (o menor que faz cada um caber em 1 linha, ou 2 se houver espaço)
  const linhasPorItem = linhaH >= 150 ? 2 : 1;
  const tam = Math.min(...itens.map((it) => linhasDe(it.texto, largTexto, tamMax, 30, linhasPorItem).tamanho));
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  const alturaTotal = linhaH * n;
  const y0 = topoLista + (disponivel - alturaTotal) / 2;
  return (
    <Fundo>
      <Aproxima t={t} de={m.de}>
        {numerada && !comImagem && n > 1 ? (
          <>
            <div style={{ position: "absolute", left: MARGEM + 23, top: y0 + linhaH / 2, width: 2, height: linhaH * (n - 1), background: COR.fio }} />
            <div
              style={{
                position: "absolute",
                left: MARGEM + 22,
                top: y0 + linhaH / 2,
                width: 4,
                height: linhaH * Math.max(0, atual),
                background: COR.neon,
                borderRadius: 2,
              }}
            />
          </>
        ) : null}
        {itens.map((it, i) => {
          const e = prog(t, it.em - 0.05, 0.4);
          if (e <= 0 && !numerada) return null;
          const cy = y0 + i * linhaH + linhaH / 2;
          const eAtual = i === atual;
          const corTexto = eAtual ? COR.osso : COR.apagado;
          const quebra = linhasDe(it.texto, largTexto, tam, tam, linhasPorItem).linhas;
          const lh = Math.round(tam * 1.12);
          const det = comDetalhe && it.detalhe ? 36 : 0;
          const blocoH = quebra.length * lh + (det ? det + 8 : 0);
          return (
            <div key={i}>
              {comImagem ? (
                e > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: MARGEM,
                      top: cy - th / 2,
                      width: th,
                      height: th,
                      borderRadius: 16,
                      overflow: "hidden",
                      background: COR.palco2,
                      boxSizing: "border-box",
                      outline: eAtual ? `4px solid ${COR.neon}` : undefined,
                      outlineOffset: 4,
                      transform: e >= 1 ? undefined : `scale(${0.85 + 0.15 * e})`,
                      opacity: e * (eAtual ? 1 : 0.7),
                    }}
                  >
                    {it.imagem && temImagem(imagemDoPlano(plano, it.imagem)) ? (
                      <Foto imagem={imagemDoPlano(plano, it.imagem)} de={it.em - 0.1} t={t} largura={th} altura={th} intensidade={0.12} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: th * 0.36, color: COR.neon }}>
                        {numerada ? i + 1 : "•"}
                      </div>
                    )}
                  </div>
                ) : null
              ) : numerada ? (
                <div
                  style={{
                    position: "absolute",
                    left: MARGEM,
                    top: cy - 24,
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    boxSizing: "border-box",
                    border: `2px solid ${e > 0 ? (eAtual ? COR.neon : COR.apagado) : COR.fio}`,
                    background: eAtual ? COR.neon : COR.palco,
                    color: eAtual ? COR.branco : e > 0 ? COR.osso : COR.apagado,
                    fontFamily: FONTE,
                    fontWeight: 800,
                    fontSize: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    left: MARGEM + 4,
                    top: cy - 8,
                    width: 16,
                    height: 16,
                    background: eAtual ? COR.neon : COR.apagado,
                    transform: `scale(${e})`,
                  }}
                />
              )}
              {e > 0 ? (
                <div style={{ position: "absolute", left: xTexto, top: cy - blocoH / 2, width: largTexto, height: blocoH, overflow: e >= 1 ? undefined : "hidden" }}>
                  <div style={{ transform: e >= 1 ? undefined : `translateX(${(1 - e) * -40}px)`, opacity: e }}>
                    {quebra.map((l, k) => (
                      <div
                        key={k}
                        style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, lineHeight: `${lh}px`, letterSpacing: `${APERTO}em`, color: corTexto, whiteSpace: "nowrap" }}
                      >
                        {l}
                      </div>
                    ))}
                    {det ? (
                      <div style={{ marginTop: 8, fontFamily: FONTE, fontWeight: 600, fontSize: 30, lineHeight: "36px", color: COR.apagado, whiteSpace: "nowrap" }}>{it.detalhe}</div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </Aproxima>
      <Chapeu texto={m.titulo ?? m.chapeu} t={t} de={m.de} cor={m.titulo ? COR.osso : COR.apagado} />
    </Fundo>
  );
};

export const Topicos: React.FC<PropsBloco<TTopicos>> = ({ plano, m, t }) => <Lista plano={plano} m={m} t={t} numerada={false} />;
export const Passos: React.FC<PropsBloco<TPassos>> = ({ plano, m, t }) => <Lista plano={plano} m={m} t={t} numerada />;

// ——— número ———

export const Numero: React.FC<PropsBloco<TNumero>> = ({ m, t }) => {
  const casas = m.casas ?? 0;
  const p = prog(t, m.em, 1.0, suave);
  const valor = formatar(m.valor * p, casas);
  const final = formatar(m.valor, casas);
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  // o corpo é medido com o valor final (o número não muda de tamanho enquanto conta)
  const medir = (tam: number) =>
    larguraTexto(final, tam, { peso: 800, espacamento: -0.02 }) + (pre ? larguraTexto(pre, tam * 0.42, { peso: 800 }) + tam * 0.08 : 0) + (suf ? larguraTexto(suf, tam * 0.42, { peso: 800 }) + tam * 0.06 : 0);
  let tam = 200;
  while (tam > 90 && medir(tam) > LARG_UTIL) tam -= 4;
  const rot = linhasDe(m.rotulo, LARG_UTIL, 46, 32, 2, 700);
  const er = prog(t, m.rotuloEm ?? m.em + 0.3, 0.4);
  const alturaGrupo = tam * 0.95 + 36 + rot.linhas.length * rot.tamanho * 1.15;
  const topo = Math.max(108, (PALCO_H - alturaGrupo) / 2 + 20);
  const larguraNum = medir(tam);
  return (
    <Fundo>
      <Aproxima t={t} de={m.de}>
        <div style={{ position: "absolute", left: MARGEM, top: topo, height: tam, display: "flex", alignItems: "baseline", opacity: prog(t, m.em - 0.1, 0.25), whiteSpace: "nowrap" }}>
          {pre ? <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam * 0.42, color: COR.apagado, marginRight: tam * 0.08 }}>{pre}</span> : null}
          <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, lineHeight: `${tam}px`, letterSpacing: "-0.02em", color: COR.osso, fontVariantNumeric: "tabular-nums" }}>{valor}</span>
          {suf ? <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam * 0.42, color: COR.apagado, marginLeft: tam * 0.06 }}>{suf}</span> : null}
        </div>
        <Barra x={MARGEM} y={topo + tam * 0.95 + 4} w={larguraNum} p={p} h={10} />
        {er > 0
          ? rot.linhas.map((l, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: MARGEM,
                  top: topo + tam * 0.95 + 40 + i * rot.tamanho * 1.15,
                  fontFamily: FONTE,
                  fontWeight: 700,
                  fontSize: rot.tamanho,
                  lineHeight: 1.15,
                  color: COR.osso,
                  opacity: er,
                  transform: `translateY(${(1 - er) * 12}px)`,
                  whiteSpace: "nowrap",
                }}
              >
                {l}
              </div>
            ))
          : null}
      </Aproxima>
      <Chapeu texto={m.titulo ?? m.chapeu} t={t} de={m.de} />
      {m.ilustrativo ? <Ilustrativo t={t} de={m.de} /> : null}
    </Fundo>
  );
};

// ——— comparação ———

export const Comparacao: React.FC<PropsBloco<TComparacao>> = ({ m, t }) => {
  const meio = LARGURA / 2;
  const colW = meio - MARGEM - 56;
  const venceEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.6;
  const pv = m.vencedor === undefined ? 0 : prog(t, venceEm, 0.4);
  const topoCol = m.titulo || m.chapeu ? 150 : 120;
  const textos = m.lados.map((l) => linhasDe(l.texto, colW, 68, 40, 3));
  const tam = Math.min(...textos.map((x) => x.tamanho));
  const lh = Math.round(tam * 1.12);
  const simbolo = m.modo === "antes-depois" ? "seta" : m.modo === "errado-certo" ? null : "vs";
  const ec = prog(t, Math.min(m.lados[0].em, m.lados[1].em), 0.4);
  return (
    <Fundo>
      <Aproxima t={t} de={m.de} origem="50% 50%">
        {/* fio vertical do meio */}
        <div style={{ position: "absolute", left: meio - 1, top: topoCol, width: 2, height: (PALCO_H - topoCol - 64) * ec, background: COR.fio }} />
        {m.lados.map((l, i) => {
          const e = prog(t, l.em - 0.05, 0.4);
          if (e <= 0) return null;
          const x = i === 0 ? MARGEM : meio + 56;
          const venceu = m.vencedor === i;
          const perdeu = m.vencedor !== undefined && !venceu;
          const quebra = linhasDe(l.texto, colW, tam, tam, 3).linhas;
          const ic = m.modo === "errado-certo" ? (i === 0 ? "errado" : "certo") : null;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: topoCol, width: colW, opacity: (1 - 0.55 * pv * (perdeu ? 1 : 0)) * e, transform: `translateY(${(1 - e) * 24}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, height: 40 }}>
                {ic ? <IconeTraco nome={ic} tamanho={36} cor={venceu && pv > 0.5 ? COR.neon : COR.apagado} t={t} em={l.em} traco={2} /> : null}
                <div
                  style={{
                    fontFamily: FONTE,
                    fontWeight: 700,
                    fontSize: 24,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: venceu && pv > 0.5 ? COR.neon : COR.apagado,
                    whiteSpace: "nowrap",
                  }}
                >
                  {l.rotulo}
                </div>
              </div>
              <div style={{ marginTop: 22, position: "relative" }}>
                {quebra.map((q, k) => (
                  <div key={k} style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tam, lineHeight: `${lh}px`, letterSpacing: `${APERTO}em`, color: COR.osso, whiteSpace: "nowrap" }}>
                    {q}
                  </div>
                ))}
                {perdeu && m.modo === "errado-certo"
                  ? quebra.map((q, k) => (
                      <div
                        key={`r${k}`}
                        style={{
                          position: "absolute",
                          left: -4,
                          top: k * lh + lh * 0.52,
                          width: (larguraTexto(q, tam, { peso: 800, espacamento: APERTO }) + 8) * pv,
                          height: 5,
                          background: COR.osso,
                          borderRadius: 3,
                        }}
                      />
                    ))
                  : null}
              </div>
              {venceu ? <Barra x={0} y={62 + quebra.length * lh + 18} w={Math.min(colW, 160)} p={pv} h={8} /> : null}
            </div>
          );
        })}
        {simbolo && ec > 0 ? (
          <div
            style={{
              position: "absolute",
              left: meio - 34,
              top: topoCol + (PALCO_H - topoCol - 64) / 2 - 34,
              width: 68,
              height: 68,
              borderRadius: 34,
              background: COR.palco,
              border: `2px solid ${COR.fio}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${ec})`,
            }}
          >
            {simbolo === "vs" ? (
              <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 24, color: COR.osso }}>vs</span>
            ) : (
              <IconeTraco nome="seta" tamanho={34} cor={COR.neon} t={t} em={m.lados[1].em} traco={2.2} />
            )}
          </div>
        ) : null}
      </Aproxima>
      <Chapeu texto={m.titulo ?? m.chapeu} t={t} de={m.de} cor={COR.osso} />
    </Fundo>
  );
};

// ——— gráfico ———

export const Grafico: React.FC<PropsBloco<TGrafico>> = ({ m, t }) => {
  const x0 = MARGEM;
  const x1 = LARGURA - MARGEM;
  const base = PALCO_H - 110;
  const topoArea = m.titulo || m.chapeu ? 150 : 110;
  const alturaMax = base - topoArea - 40;
  const dados = (m.dados ?? []).slice(0, 6);
  const un = m.unidade ?? "";
  const fmt = (v: number) => `${formatar(v, Number.isInteger(v) ? 0 : 1)}${un}`;
  let conteudo: React.ReactNode = null;
  if (dados.length >= 2 && m.forma === "barras") {
    const max = Math.max(...dados.map((d) => d.valor), 1e-9);
    const passo = (x1 - x0) / dados.length;
    const bw = Math.min(150, passo * 0.56);
    let atual = -1;
    dados.forEach((d, i) => {
      if (t >= d.em - 0.05) atual = i;
    });
    conteudo = (
      <>
        <div style={{ position: "absolute", left: x0, top: base, width: x1 - x0, height: 2, background: COR.fio }} />
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.6);
          const h = (d.valor / max) * alturaMax * p;
          const cx = x0 + passo * i + passo / 2;
          const cor = i === atual ? COR.neon : "#3A424E";
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: cx - bw / 2, top: base - h, width: bw, height: h, background: cor, borderRadius: "8px 8px 0 0" }} />
              {p > 0 ? (
                <>
                  <div style={{ position: "absolute", left: cx - 120, width: 240, top: base - h - 50, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 36, color: COR.osso, opacity: p }}>
                    {fmt(d.valor)}
                  </div>
                  <div style={{ position: "absolute", left: cx - passo / 2, width: passo, top: base + 14, textAlign: "center", fontFamily: FONTE, fontWeight: 700, fontSize: 26, color: COR.apagado, opacity: p, whiteSpace: "nowrap" }}>
                    {d.rotulo}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </>
    );
  } else if (dados.length >= 2 && m.forma === "pizza") {
    const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const r = 150;
    const cx = x0 + r + 20;
    const cy = topoArea + (base + 60 - topoArea) / 2;
    let acc = 0;
    const cores = [COR.neon, COR.osso, "#5D6672", "#3A424E", "#9AA3AE", "#2A3039"];
    conteudo = (
      <>
        <svg width={LARGURA} height={PALCO_H} style={{ position: "absolute", left: 0, top: 0 }}>
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.6);
            const frac = (d.valor / total) * p;
            const ini = acc;
            acc += d.valor / total;
            const c = 2 * Math.PI * r;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={cores[i % cores.length]}
                strokeWidth={56}
                strokeDasharray={`${c * frac} ${c}`}
                strokeDashoffset={-c * ini}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
        </svg>
        {dados.map((d, i) => {
          const p = prog(t, d.em - 0.05, 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: cx + r + 90, top: cy - (dados.length * 64) / 2 + i * 64, display: "flex", alignItems: "center", gap: 18, opacity: p, whiteSpace: "nowrap" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: cores[i % cores.length] }} />
              <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: 38, color: COR.osso }}>{fmt(d.valor)}</div>
              <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: 30, color: COR.apagado }}>{d.rotulo}</div>
            </div>
          );
        })}
      </>
    );
  } else {
    // linha: com dados (proporcional) ou só a tendência (ilustrativa)
    const pts: { x: number; y: number; em: number; d?: { rotulo: string; valor: number } }[] = [];
    if (dados.length >= 2) {
      const max = Math.max(...dados.map((d) => d.valor));
      const min = Math.min(0, ...dados.map((d) => d.valor));
      dados.forEach((d, i) => {
        pts.push({ x: x0 + 40 + ((x1 - x0 - 80) * i) / (dados.length - 1), y: base - ((d.valor - min) / (max - min || 1)) * alturaMax, em: d.em, d });
      });
    } else {
      const forma = m.tendencia === "cai" ? [0.85, 0.7, 0.74, 0.5, 0.42, 0.18] : m.tendencia === "oscila" ? [0.4, 0.75, 0.3, 0.8, 0.35, 0.65] : [0.15, 0.3, 0.26, 0.55, 0.62, 0.9];
      const em = m.tendenciaEm ?? m.de + 0.2;
      forma.forEach((v, i) => pts.push({ x: x0 + 40 + ((x1 - x0 - 80) * i) / (forma.length - 1), y: base - v * alturaMax, em: em + i * 0.18 }));
    }
    const p = prog(t, pts[0].em - 0.05, Math.max(0.6, pts[pts.length - 1].em - pts[0].em + 0.4), suave);
    const caminho = pts.map((q, i) => `${i ? "L" : "M"}${q.x} ${q.y}`).join(" ");
    conteudo = (
      <>
        <div style={{ position: "absolute", left: x0, top: base, width: x1 - x0, height: 2, background: COR.fio }} />
        <svg width={LARGURA} height={PALCO_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path d={caminho} fill="none" stroke={COR.neon} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
          {pts.map((q, i) => (i / (pts.length - 1) <= p + 0.001 && q.d ? <circle key={i} cx={q.x} cy={q.y} r={11} fill={COR.palco} stroke={COR.neon} strokeWidth={5} /> : null))}
        </svg>
        {pts.map((q, i) =>
          q.d && i / (pts.length - 1) <= p + 0.001 ? (
            <div key={i}>
              <div style={{ position: "absolute", left: q.x - 120, width: 240, top: q.y - 62, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 34, color: COR.osso }}>{fmt(q.d.valor)}</div>
              <div style={{ position: "absolute", left: q.x - 120, width: 240, top: base + 14, textAlign: "center", fontFamily: FONTE, fontWeight: 700, fontSize: 26, color: COR.apagado, whiteSpace: "nowrap" }}>{q.d.rotulo}</div>
            </div>
          ) : null,
        )}
      </>
    );
  }
  return (
    <Fundo>
      <Aproxima t={t} de={m.de} origem="50% 50%">
        {conteudo}
      </Aproxima>
      <Chapeu texto={m.titulo ?? m.chapeu} t={t} de={m.de} cor={COR.osso} />
      {m.ilustrativo || !dados.length ? <Ilustrativo t={t} de={m.de} /> : null}
    </Fundo>
  );
};

// ——— destaque (palavra-chave) ———

export const Destaque: React.FC<PropsBloco<TDestaque>> = ({ plano, m, t }) => {
  const alerta = m.nivel === "alerta";
  const icone = m.icone ?? (alerta ? "alerta" : undefined);
  const larg = icone ? LARG_UTIL - 200 : LARG_UTIL;
  const fit = linhasDe(m.texto, larg, 150, 64, 2);
  const lh = Math.round(fit.tamanho * 1.06);
  const det = m.detalhe ? linhasDe(m.detalhe, larg, 40, 30, 2, 600) : null;
  const detH = det ? 26 + det.linhas.length * det.tamanho * 1.2 : 0;
  const altura = fit.linhas.length * lh + 30 + detH;
  const topo = Math.max(104, (PALCO_H - altura) / 2 + 16);
  const e = prog(t, m.em - 0.05, 0.4);
  // cada linha entra quando a primeira palavra dela é dita (se o texto for a fala; senão, em cascata)
  const tempos = temposDasPalavras(fit.linhas.join(" "), plano.palavras, m.em, m.ate);
  let k = 0;
  const inicioLinha = fit.linhas.map((l, i) => {
    const t0 = Math.max(m.em + i * 0.08, tempos[k] ?? m.em);
    k += l.split(" ").length;
    return t0;
  });
  const fimTexto = inicioLinha[inicioLinha.length - 1];
  const ed = det ? prog(t, m.detalheEm ?? fimTexto + 0.6, 0.4) : 0;
  const tinta = alerta ? COR.tinta : COR.osso;
  const larguraTxt = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800, espacamento: APERTO })));
  return (
    <Fundo cor={alerta ? COR.claro : COR.palco}>
      <Aproxima t={t} de={m.de}>
        {fit.linhas.map((l, i) => {
          const ei = prog(t, inicioLinha[i] - 0.05, 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: MARGEM, top: topo + i * lh, height: lh, width: larg + 20, overflow: ei >= 1 ? undefined : "hidden" }}>
              <div
                style={{
                  fontFamily: FONTE,
                  fontWeight: 800,
                  fontSize: fit.tamanho,
                  lineHeight: `${lh}px`,
                  letterSpacing: `${APERTO}em`,
                  color: tinta,
                  whiteSpace: "nowrap",
                  transform: ei >= 1 ? undefined : `translateY(${(1 - ei) * lh * 0.8}px)`,
                }}
              >
                {l}
              </div>
            </div>
          );
        })}
        <Barra x={MARGEM} y={topo + fit.linhas.length * lh + 8} w={Math.min(larguraTxt, 260)} p={prog(t, fimTexto + 0.25, 0.5)} h={10} />
        {det && ed > 0
          ? det.linhas.map((l, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: MARGEM,
                  top: topo + fit.linhas.length * lh + 44 + i * det.tamanho * 1.2,
                  fontFamily: FONTE,
                  fontWeight: 600,
                  fontSize: det.tamanho,
                  lineHeight: 1.2,
                  color: alerta ? "#4A515B" : COR.apagado,
                  opacity: ed,
                  whiteSpace: "nowrap",
                }}
              >
                {l}
              </div>
            ))
          : null}
        {icone ? (
          <div style={{ position: "absolute", left: LARGURA - MARGEM - 170, top: PALCO_H / 2 - 85 + 10, opacity: e }}>
            <IconeTraco nome={icone} tamanho={170} cor={COR.neon} t={t} em={m.em} traco={1.6} />
          </div>
        ) : null}
      </Aproxima>
      <Chapeu texto={m.chapeu} t={t} de={m.de} cor={alerta ? "#4A515B" : COR.apagado} />
    </Fundo>
  );
};

// ——— definição ———

export const Definicao: React.FC<PropsBloco<TDefinicao>> = ({ plano, m, t }) => {
  const termo = linhasDe(m.termo, LARG_UTIL, 120, 60, 2);
  const lhT = Math.round(termo.tamanho * 1.06);
  const sig = disporTexto(m.significado, { largura: LARG_UTIL, max: 50, min: 34, linhas: 3, peso: 600, fala: plano.palavras, de: m.significadoEm, ate: m.ate, entrelinha: 1.22 });
  const altura = termo.linhas.length * lhT + 44 + sig.altura;
  const topo = Math.max(104, (PALCO_H - altura) / 2 + 16);
  const e = prog(t, m.em - 0.05, 0.4);
  return (
    <Fundo>
      <Aproxima t={t} de={m.de}>
        {termo.linhas.map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: MARGEM,
              top: topo + i * lhT,
              fontFamily: FONTE,
              fontWeight: 800,
              fontSize: termo.tamanho,
              lineHeight: `${lhT}px`,
              letterSpacing: `${APERTO}em`,
              color: COR.osso,
              whiteSpace: "nowrap",
              opacity: e,
              transform: e >= 1 ? undefined : `translateY(${(1 - e) * 16}px)`,
            }}
          >
            {l}
          </div>
        ))}
        <Barra x={MARGEM} y={topo + termo.linhas.length * lhT + 14} w={120} p={prog(t, m.significadoEm - 0.2, 0.4)} h={8} />
        <TextoFalado d={sig} x={MARGEM} y={topo + termo.linhas.length * lhT + 44} t={t} cor={COR.osso} />
      </Aproxima>
      <Chapeu texto={m.chapeu ?? "definição"} t={t} de={m.de} />
    </Fundo>
  );
};

// ——— frase ———

export const Frase: React.FC<PropsBloco<TFrase>> = ({ plano, m, t }) => {
  const em = m.em ?? m.de;
  const d = disporTexto(m.texto, { largura: LARG_UTIL, max: 84, min: 50, linhas: 3, fala: plano.palavras, de: em, ate: m.ate, destaque: m.destaque, risco: m.risco });
  const topo = Math.max(150, (PALCO_H - d.altura) / 2 + 40);
  return (
    <Fundo>
      <Aproxima t={t} de={m.de}>
        <div style={{ position: "absolute", left: MARGEM - 6, top: topo - 138, fontFamily: FONTE, fontWeight: 800, fontSize: 190, lineHeight: 1, color: COR.neon, opacity: prog(t, m.de, 0.4) }}>“</div>
        <TextoFalado d={d} x={MARGEM} y={topo} t={t} riscoEm={m.riscoEm} />
      </Aproxima>
      <Chapeu texto={m.chapeu} t={t} de={m.de} />
    </Fundo>
  );
};

// ——— pergunta ———

export const Pergunta: React.FC<PropsBloco<TPergunta>> = ({ plano, m, t }) => {
  const em = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  const d = disporTexto(m.texto, { largura: LARG_UTIL, max: n ? 66 : 88, min: 46, linhas: n ? 2 : 3, fala: plano.palavras, de: em, ate: m.ate });
  const linhaH = n > 3 ? 70 : 84;
  const altura = d.altura + (n ? 34 + n * linhaH : 0);
  const topo = Math.max(100, (PALCO_H - altura) / 2 + 10);
  const tamOp = Math.min(...opcoes.map((o) => linhasDe(o.texto, LARG_UTIL - 100, 40, 28, 1, 700).tamanho), 40);
  return (
    <Fundo>
      <Aproxima t={t} de={m.de}>
        <TextoFalado d={d} x={MARGEM} y={topo} t={t} />
        {opcoes.map((o, i) => {
          const e = prog(t, o.em - 0.05, 0.4);
          if (e <= 0) return null;
          const img = o.imagem ? imagemDoPlano(plano, o.imagem) : null;
          const y = topo + d.altura + 34 + i * linhaH;
          return (
            <div key={i} style={{ position: "absolute", left: MARGEM, top: y, height: linhaH - 14, display: "flex", alignItems: "center", gap: 22, opacity: e, transform: `translateX(${(1 - e) * -30}px)`, whiteSpace: "nowrap" }}>
              {temImagem(img) ? (
                <div style={{ width: 58, height: 58, borderRadius: 29, overflow: "hidden", border: `2px solid ${COR.neon}`, position: "relative" }}>
                  <Foto imagem={img} de={0} t={t} largura={58} altura={58} efeito="parado" />
                </div>
              ) : (
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    border: `2px solid ${COR.neon}`,
                    color: COR.neon,
                    fontFamily: FONTE,
                    fontWeight: 800,
                    fontSize: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              )}
              <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: tamOp, color: COR.osso }}>{o.texto}</div>
            </div>
          );
        })}
      </Aproxima>
      <Chapeu texto={m.chapeu} t={t} de={m.de} />
    </Fundo>
  );
};

// ——— fechamento ———

export const Cta: React.FC<PropsBloco<TCta>> = ({ plano, m, t }) => {
  const em = m.em ?? m.de;
  const icone = m.icone ?? "salvar";
  const xTexto = MARGEM + 210;
  const d = disporTexto(m.texto, { largura: LARGURA - MARGEM - xTexto, max: 84, min: 48, linhas: 3, fala: plano.palavras, de: em, ate: m.ate, destaque: m.destaque });
  const cy = PALCO_H / 2 + 20;
  const ec = prog(t, m.de, 0.45);
  return (
    <Fundo>
      <Aproxima t={t} de={m.de}>
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            top: cy - 80,
            width: 160,
            height: 160,
            borderRadius: 80,
            background: COR.neon,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${ec})`,
          }}
        >
          <IconeTraco nome={icone} tamanho={84} cor={COR.branco} t={t} em={m.de + 0.15} traco={2} />
        </div>
        <TextoFalado d={d} x={xTexto} y={cy - d.altura / 2} t={t} />
      </Aproxima>
      <Chapeu texto={m.chapeu} t={t} de={m.de} />
    </Fundo>
  );
};
