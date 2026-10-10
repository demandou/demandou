// A assinatura do Case: as páginas ANTES (a ficha com o carimbo e as métricas ditas), O QUE FIZEMOS
// (as mudanças marcadas, cada uma com a mini-ilustração) e DEPOIS (a linha do tempo do prazo e o
// gráfico ANTES × DEPOIS que cai ou sobe na proporção dita).
// Nada de molde: cada peça só aparece quando é dita, já com conteúdo e com movimento. O conjunto
// da página fica centrado e sobe suave quando uma peça nova entra embaixo.
import { entrada, prog, queda, saida, soco, suave, temposDoTexto } from "../anim";
import { larguraTexto, trechoNoTexto } from "../medida";
import type { Case, CaseAntes, CaseMudancas, CasePrazo, CaseResultado, Ficha, Metrica, Mudanca, Plano } from "../plano";
import { cor, fonte, mono } from "../tema";
import { Ilustracao } from "./Ilustracoes";
import { Aviso, CabecaDePagina, caber, Datilo, Icone, larguraRotulo, Rotulo, Texto, tamanhoRotulo } from "./Pecas";
import { type Pagina, PH, PW } from "./Relatorio";

export const TOPO = 84;
const ROTULO = 30;

// ——— o conjunto que cresce centrado ———

export type Bloco = { h: number; em: number };

// Topo do conjunto no instante t: centrado na área livre; quando um bloco novo entra, o conjunto
// sobe suave para abrir espaço (o primeiro bloco conta desde a chegada da página).
export const topoDoConjunto = (t: number, blocos: Bloco[], gap: number, de = TOPO + 8, ate = PH - 8) => {
  let H = 0;
  blocos.forEach((b, i) => {
    const p = i === 0 ? 1 : prog(t, b.em - 0.12, 0.42, suave);
    H += (b.h + (i ? gap : 0)) * p;
  });
  return de + Math.max(0, (ate - de - H) / 2);
};
export const posicoesDosBlocos = (topo: number, blocos: Bloco[], gap: number) => {
  let y = topo;
  return blocos.map((b) => {
    const r = y;
    y += b.h + gap;
    return r;
  });
};

// ——— peças ———

const Sinal: React.FC<{ t: number; em: number; tipo: "plano" | "cai" | "sobe"; w: number; h: number }> = ({ t, em, tipo, w, h }) => {
  if (t < em) return null;
  const n = 24;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const x = i / n;
    const ruido = Math.sin(i * 2.3) * 0.05 + Math.sin(i * 5.1) * 0.03;
    const y = tipo === "plano" ? 0.84 + ruido * 0.6 : tipo === "cai" ? 0.15 + 0.7 * x + ruido : 0.85 - 0.7 * x + ruido;
    return { x: x * (w - 12) + 6, y: Math.max(4, Math.min(h - 4, y * h)) };
  });
  const p = prog(t, em, 0.8, suave);
  const vis = pts.slice(0, Math.max(2, Math.round(n * p) + 1));
  const ponta = vis[vis.length - 1];
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <line x1={0} x2={w * prog(t, em, 0.3)} y1={h - 1} y2={h - 1} stroke={cor.filete} strokeWidth={2} />
      <polyline points={vis.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke={cor.acento} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={ponta.x} cy={ponta.y} r={8} fill={cor.acento} />
    </svg>
  );
};

// Quadrinho da mini-ilustração: aparece na palavra (fundo que acende) e a ilustração se desenha.
// `pronto` = já desenhado desde o quadro 0 (o gancho).
export const Quadrinho: React.FC<{ t: number; x: number; y: number; w: number; h: number; icone?: Mudanca["icone"]; em: number; ativo?: boolean; pronto?: boolean }> = ({
  t,
  x,
  y,
  w,
  h,
  icone,
  em,
  ativo,
  pronto,
}) => {
  const inicio = pronto ? -2 : em;
  if (!icone || t < inicio - 0.02) return null;
  const e = entrada(t, inicio - 0.02, { sobe: 10, de: 0.9, dur: 0.28 });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: e.opacity, transform: e.transform }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: ativo ? cor.acentoFundo : cor.papelSombra }} />
      <div style={{ position: "absolute", left: w * 0.1, top: h * 0.1 }}>
        <Ilustracao nome={icone} t={t} em={inicio} largura={w * 0.8} altura={h * 0.8} />
      </div>
    </div>
  );
};

// O carimbo coral (ANTES, HOJE…): bate grande e assenta, levemente torto.
const Carimbo: React.FC<{ t: number; texto: string; em: number; tamanho?: number }> = ({ t, texto, em, tamanho = 40 }) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em - 0.02, 0.2, saida);
  const golpe = soco(t, em + 0.18, 0.26);
  return (
    <div
      style={{
        display: "inline-block",
        padding: `${tamanho * 0.22}px ${tamanho * 0.55}px`,
        borderRadius: 12,
        border: `5px solid ${cor.acento}`,
        background: "rgba(255,90,54,0.07)",
        fontFamily: mono,
        fontSize: tamanho,
        letterSpacing: "0.14em",
        lineHeight: 1.1,
        color: cor.acento,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        opacity: Math.min(1, p * 1.6),
        transform: `rotate(-7deg) scale(${1.7 - 0.7 * p + 0.05 * golpe})`,
      }}
    >
      {texto}
    </div>
  );
};
const larguraCarimbo = (texto: string, tamanho = 40) => larguraRotulo(texto, tamanho) * 1.05 + tamanho * 1.1 + 10;

// ——— ANTES: a ficha ———

type LinhaMetrica = { x: Metrica; h: number; fV: { tamanho: number; linhas: string[] }; tamD: number; detNaLinha: boolean; ultimaLarg: number };

const medirMetricas = (metricas: Metrica[], larg: number, max: number): LinhaMetrica[] =>
  metricas.map((x) => {
    const fV = caber(x.valor, larg, max, 52, 2, 800);
    const ultimaLarg = larguraTexto(fV.linhas[fV.linhas.length - 1], fV.tamanho, { peso: 800 });
    const tamD = Math.max(32, Math.round(fV.tamanho * 0.42));
    const larguraDet = x.detalhe ? larguraTexto(x.detalhe, tamD, { peso: 700 }) : 0;
    const detNaLinha = !!x.detalhe && ultimaLarg + 22 + larguraDet <= larg;
    const h = ROTULO * 1.3 + 14 + fV.linhas.length * fV.tamanho * 1.12 + (x.detalhe && !detNaLinha ? tamD * 1.25 + 6 : 0) + 10;
    return { x, h, fV, tamD, detNaLinha, ultimaLarg };
  });

const paginaAntes = (m: Case | Ficha, a: CaseAntes, plano: Plano): Pagina => {
  const metricas = a.metricas.slice(0, 3);
  const etiqueta = a.etiqueta ?? (m.tipo === "ficha" ? "Ficha" : "Antes");
  const temIcone = metricas.some((x) => x.icone);
  const tile = { w: 150, h: 128 };
  const xTexto = temIcone ? tile.w + 30 : 0;
  const larg = PW - xTexto;
  // cabeça da ficha: quadrinho + título + carimbo
  const tituloEm = a.tituloEm ?? a.em;
  const gancho = tituloEm <= 0.05;
  const carimboEm = a.carimboEm ?? a.em;
  const tamC = 40;
  const largC = larguraCarimbo(etiqueta, tamC);
  const tileT = { w: 184, h: 176 };
  const fT = a.titulo ? caber(a.titulo, PW - tileT.w - 34 - largC - 24, 124, 56, 1) : null;
  const hCabeca = a.titulo ? 186 : 86;
  // as linhas: o valor reduz até caber na altura que sobra
  let max = 112;
  let linhas = medirMetricas(metricas, larg, max);
  const area = PH - 16 - 8;
  const total = () => hCabeca + linhas.reduce((s, l) => s + l.h + 28, 0);
  while (total() > area && max > 60) {
    max -= 6;
    linhas = medirMetricas(metricas, larg, max);
  }
  const blocos: Bloco[] = [{ h: hCabeca, em: Math.min(tituloEm, carimboEm) }, ...linhas.map((l) => ({ h: l.h, em: l.x.em }))];
  return {
    chegada: a.em,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const topo = topoDoConjunto(t, blocos, 28, 16, PH - 8);
      const ys = posicoesDosBlocos(topo, blocos, 28);
      const yC = ys[0];
      const pT = gancho ? 1 : prog(t, tituloEm, 0.3);
      return (
        <>
          {/* cabeça: quem é + o carimbo */}
          {a.titulo && fT ? (
            <>
              <Quadrinho t={t} x={0} y={yC + (hCabeca - tileT.h) / 2} w={tileT.w} h={tileT.h} icone={a.icone ?? "pessoa"} em={tituloEm} pronto={gancho} />
              {t >= tituloEm - 0.02 || gancho ? (
                <div style={{ position: "absolute", left: tileT.w + 34, top: yC + (hCabeca - fT.tamanho * 1.12) / 2, opacity: pT, transform: pT < 1 ? `translateY(${(1 - pT) * 16}px)` : undefined }}>
                  <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} />
                </div>
              ) : null}
              <div style={{ position: "absolute", right: 10, top: yC + hCabeca / 2 - tamC * 0.85 }}>
                <Carimbo t={t} texto={etiqueta} em={carimboEm} tamanho={tamC} />
              </div>
            </>
          ) : (
            <div style={{ position: "absolute", left: 8, top: yC + 10 }}>
              <Carimbo t={t} texto={etiqueta} em={carimboEm} tamanho={tamC} />
            </div>
          )}
          {linhas.map((l, i) => {
            const { x, fV, tamD, detNaLinha, ultimaLarg } = l;
            const y0 = ys[i + 1];
            const valorEm = x.valorEm ?? x.em + 0.3;
            const detalheEm = x.detalheEm ?? valorEm + 0.5;
            const tamR = tamanhoRotulo(x.rotulo, larg - (x.sinal ? 260 : 0), ROTULO, 22);
            const yValor = y0 + ROTULO * 1.3 + 14;
            const eR = entrada(t, x.em, { sobe: 12 });
            if (t < x.em - 0.02) return null;
            return (
              <div key={i}>
                {/* filete que separa da peça de cima */}
                <div style={{ position: "absolute", left: 0, top: y0 - 15, width: PW * prog(t, x.em - 0.05, 0.45, suave), height: 2, background: cor.filete }} />
                {x.icone ? <Quadrinho t={t} x={0} y={y0 + (l.h - tile.h) / 2} w={tile.w} h={tile.h} icone={x.icone} em={x.iconeEm ?? x.em} /> : null}
                <div style={{ position: "absolute", left: xTexto, top: y0, opacity: eR.opacity, transform: eR.transform }}>
                  <Rotulo texto={x.rotulo} tamanho={tamR} />
                </div>
                {x.sinal ? (
                  <div style={{ position: "absolute", left: PW - 240, top: y0 - 12, width: 240, height: 52 }}>
                    <Sinal t={t} em={valorEm + 0.15} tipo={x.sinal} w={240} h={52} />
                  </div>
                ) : null}
                <div style={{ position: "absolute", left: xTexto, top: yValor, width: larg }}>
                  <Datilo t={t} linhas={fV.linhas} tamanho={fV.tamanho} em={valorEm} palavras={plano.palavras} ate={m.ate} />
                </div>
                {x.detalhe && t >= detalheEm ? (
                  <div
                    style={{
                      position: "absolute",
                      left: xTexto + (detNaLinha ? ultimaLarg + 22 : 0),
                      top: yValor + (detNaLinha ? fV.linhas.length * fV.tamanho * 1.12 - tamD * 1.3 : fV.linhas.length * fV.tamanho * 1.12 + 6),
                    }}
                  >
                    <Datilo t={t} linhas={[x.detalhe]} tamanho={tamD} peso={700} cor={cor.tintaSuave} em={detalheEm} palavras={plano.palavras} ate={m.ate} cursor={false} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      );
    },
  };
};

// ——— O QUE FIZEMOS / passos / tópicos: a lista que se marca ———

// Linhas da lista: cada uma só aparece na palavra dela (caixa que enche de coral com o ✓, ou
// marcador quadrado; mini-ilustração opcional; texto palavra por palavra). A faixa coral clara anda
// até o item da vez. `ligados` = um traço vertical liga as caixas (ordem). `ys` = topo de cada linha.
export const Checklist: React.FC<{
  t: number;
  plano: Plano;
  itens: { texto: string; em: number; detalhe?: string; icone?: Mudanca["icone"] }[];
  ys: number[];
  rowH: number;
  ate: number;
  marcador?: "caixa" | "ponto";
  ligados?: boolean;
}> = ({ t, plano, itens, ys, rowH, ate, marcador = "caixa", ligados }) => {
  const temIcone = itens.some((it) => it.icone);
  const caixa = Math.min(60, rowH * 0.4);
  const tile = { h: Math.min(130, rowH - 16), w: Math.min(156, (rowH - 16) * 1.2) };
  const xTile = caixa + 26;
  const xTexto = xTile + (temIcone ? tile.w + 28 : 0);
  const larg = PW - xTexto;
  const feitos = itens.filter((it) => t >= it.em).length;
  const k = Math.max(0, feitos - 1);
  const pF = feitos >= 1 ? prog(t, itens[k].em - 0.06, 0.32, suave) : 0;
  const yFaixa = feitos >= 2 ? ys[k - 1] + (ys[k] - ys[k - 1]) * pF : ys[k];
  const aFaixa = feitos >= 1 ? (feitos === 1 ? pF : 1) * (Number.isFinite(ate) ? 1 - prog(t, ate - 0.25, 0.25) : 1) : 0;
  return (
    <>
      {aFaixa > 0 ? <div style={{ position: "absolute", left: -18, top: yFaixa - 6, width: PW + 36, height: rowH + 12, borderRadius: 16, background: cor.acentoFundo, opacity: aFaixa }} /> : null}
      {ligados && feitos >= 2 ? (
        <div
          style={{
            position: "absolute",
            left: caixa / 2 - 2,
            top: ys[0] + rowH / 2,
            width: 4,
            height: Math.max(0, ys[feitos - 2] - ys[0] + (ys[feitos - 1] - ys[feitos - 2]) * prog(t, itens[feitos - 1].em, 0.35, suave)),
            background: cor.acento,
            borderRadius: 2,
          }}
        />
      ) : null}
      {itens.map((it, i) => {
        if (t < it.em - 0.02) return null;
        const y = ys[i];
        const e = entrada(t, it.em - 0.02, { sobe: 20 });
        const pM = prog(t, it.em - 0.02, 0.22);
        const pV = prog(t, it.em + 0.08, 0.3, suave);
        const temDet = !!it.detalhe;
        const fT = caber(it.texto, larg, Math.min(72, rowH * 0.46), 34, temDet ? 1 : 2, 800);
        const fD = temDet ? caber(it.detalhe as string, larg, 32, 24, 1, 500) : null;
        const altT = fT.linhas.length * fT.tamanho * 1.12 + (fD ? fD.tamanho * 1.25 + 4 : 0);
        const golpe = soco(t, it.em + 0.1, 0.3);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: 0, top: y + (rowH - caixa) / 2, width: caixa, height: caixa, opacity: e.opacity, transform: golpe ? `scale(${1 + 0.12 * golpe})` : e.transform }}>
              {marcador === "caixa" ? (
                <>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: cor.acento, opacity: 0.25 + 0.75 * pM }} />
                  <svg width={caixa} height={caixa} viewBox="0 0 24 24" style={{ position: "absolute", inset: 0 }}>
                    <path
                      d="M6 12.5l4 4L18.5 8"
                      fill="none"
                      stroke={cor.papel}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      pathLength={pV < 1 ? 1 : undefined}
                      strokeDasharray={pV < 1 ? "1 1" : undefined}
                      strokeDashoffset={pV < 1 ? 1 - pV : undefined}
                    />
                  </svg>
                </>
              ) : (
                <div style={{ position: "absolute", left: caixa * 0.26, top: caixa * 0.26, width: caixa * 0.48, height: caixa * 0.48, borderRadius: 4, background: cor.acento, transform: `scale(${0.4 + 0.6 * pM})` }} />
              )}
            </div>
            {temIcone ? <Quadrinho t={t} x={xTile} y={y + (rowH - tile.h) / 2} w={tile.w} h={tile.h} icone={it.icone} em={it.em} ativo={i === feitos - 1} /> : null}
            <div style={{ position: "absolute", left: xTexto, top: y + (rowH - altT) / 2, width: larg }}>
              <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={temposDoTexto(it.texto, it.em, plano.palavras, ate)} />
              {fD && t >= it.em ? (
                <div style={{ marginTop: 4, opacity: prog(t, it.em + 0.2, 0.3) }}>
                  <Texto t={t} linhas={fD.linhas} tamanho={fD.tamanho} peso={500} cor={cor.tintaSuave} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// Título que monta palavra por palavra (com destaque coral), na posição `topo`.
export const TituloDePagina: React.FC<{ t: number; plano: Plano; texto: string; em: number; ate: number; destaque?: string; topo: number; max?: number }> = ({
  t,
  plano,
  texto,
  em,
  ate,
  destaque,
  topo,
  max = 84,
}) => {
  const f = caber(texto, PW, max, 44, 2);
  return (
    <div style={{ position: "absolute", left: 0, top: topo, width: PW }}>
      <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(texto, em, plano.palavras, ate)} destaque={destaque} />
    </div>
  );
};
export const alturaTitulo = (texto: string | undefined, max = 84) => {
  if (!texto) return 0;
  const f = caber(texto, PW, max, 44, 2);
  return f.linhas.length * f.tamanho * 1.12;
};

// Página de lista (mudanças, passos, tópicos): etiqueta fixa; título + linhas centrados, crescendo.
export const paginaDeLista = (opcoes: {
  m: Pagina["momento"];
  plano: Plano;
  etiqueta: string;
  chegada: number;
  titulo?: string;
  tituloEm: number;
  destaque?: string;
  itens: { texto: string; em: number; detalhe?: string; icone?: Mudanca["icone"] }[];
  marcador?: "caixa" | "ponto";
  ligados?: boolean;
  maxTitulo?: number;
}): Pagina => {
  const { m, plano, etiqueta, chegada, titulo, tituloEm, destaque, marcador, ligados, maxTitulo = 84 } = opcoes;
  const itens = opcoes.itens.slice(0, 5);
  const altT = alturaTitulo(titulo, maxTitulo);
  const gap = 18;
  const area = PH - 8 - (TOPO + 8);
  const rowH = Math.min(150, (area - (titulo ? altT + 30 : 0) - gap * (itens.length - 1)) / Math.max(1, itens.length));
  const blocos: Bloco[] = [...(titulo ? [{ h: altT + 12, em: tituloEm }] : []), ...itens.map((it) => ({ h: rowH, em: it.em }))];
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const topo = topoDoConjunto(t, blocos, gap);
      const ys = posicoesDosBlocos(topo, blocos, gap);
      const ysItens = titulo ? ys.slice(1) : ys;
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} />
          {titulo ? <TituloDePagina t={t} plano={plano} texto={titulo} em={tituloEm} ate={itens[0]?.em ?? Infinity} destaque={destaque} topo={ys[0]} max={maxTitulo} /> : null}
          <Checklist t={t} plano={plano} itens={itens} ys={ysItens} rowH={rowH} ate={Infinity} marcador={marcador} ligados={ligados} />
        </>
      );
    },
  };
};

const paginaMudancas = (m: Case, mu: CaseMudancas, plano: Plano): Pagina =>
  paginaDeLista({ m, plano, etiqueta: mu.etiqueta ?? "O que fizemos", chegada: mu.em, titulo: mu.titulo, tituloEm: mu.em, destaque: mu.destaque, itens: mu.itens });

// ——— DEPOIS: prazo + resultado ———

const alturaPrazo = (p: CasePrazo) => caber(p.texto, PW, 96, 52, 1).tamanho * 1.12 + 30 + 72;

const Prazo: React.FC<{ t: number; plano: Plano; p: CasePrazo; topo: number; ate: number }> = ({ t, plano, p, topo, ate }) => {
  if (t < p.em - 0.02) return null;
  const destaque = p.destaque ?? p.texto.split(/\s+/).find((w) => /\d/.test(w));
  const f = caber(p.texto, PW, 96, 52, 1);
  const fimEm = p.fimEm ?? p.em + 1.2;
  const pB = prog(t, p.em + 0.05, Math.max(0.4, fimEm - p.em - 0.05), suave);
  const pTrilho = prog(t, p.em, 0.35, saida);
  const yBarra = topo + f.tamanho * 1.12 + 30;
  const largBarra = PW - 70;
  const chegou = prog(t, fimEm, 0.3);
  const ticks = 8;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: topo, width: PW }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(p.texto, p.em, plano.palavras, ate)} destaque={destaque} />
      </div>
      {/* trilho (se estende), marcas, enchimento e a ponta */}
      <div style={{ position: "absolute", left: 0, top: yBarra, width: largBarra * pTrilho, height: 12, borderRadius: 6, background: cor.filete }} />
      {Array.from({ length: ticks - 1 }, (_, i) =>
        (i + 1) / ticks <= pTrilho ? <div key={i} style={{ position: "absolute", left: ((i + 1) / ticks) * largBarra - 1, top: yBarra + 18, width: 2, height: 12, background: cor.tintaFraca }} /> : null,
      )}
      <div style={{ position: "absolute", left: 0, top: yBarra, width: largBarra * pB, height: 12, borderRadius: 6, background: cor.acento }} />
      <div style={{ position: "absolute", left: largBarra * pB - 15, top: yBarra - 9, width: 30, height: 30, borderRadius: 15, background: cor.acento, border: `5px solid ${cor.papel}`, boxSizing: "border-box", boxShadow: "0 3px 8px rgba(18,23,34,0.2)" }} />
      <div style={{ position: "absolute", left: 0, top: yBarra + 38, opacity: pTrilho }}>
        <Rotulo texto={p.inicio ?? "início"} tamanho={ROTULO} />
      </div>
      {chegou > 0 ? (
        <div style={{ position: "absolute", left: largBarra + 12, top: yBarra - 44, opacity: chegou, transform: `scale(${0.6 + 0.4 * chegou})`, transformOrigin: "10% 100%" }}>
          <Icone nome="bandeira" tamanho={56} cor={cor.acento} traco={2.4} preencher={cor.acentoClaro} />
        </div>
      ) : null}
    </>
  );
};

const ALTURA_RESULTADO = 420;

const Resultado: React.FC<{ t: number; plano: Plano; r: CaseResultado; topo: number; altura: number; ate: number }> = ({ t, plano, r, topo, altura, ate }) => {
  if (t < r.em - 0.02) return null;
  const fT = caber(r.rotulo, PW - (r.ilustrativo ? 220 : 0), 60, 38, 1);
  const altT = fT.tamanho * 1.12;
  const base = topo + altura - 50;
  const yTopo = topo + altT + 34 + (r.valorAntes || r.valorDepois ? 50 : 0);
  const fator = r.fator ?? (r.direcao === "cai" ? 0.55 : 1.8);
  const maxH = base - yTopo;
  const hAntes = fator > 1 ? maxH / fator : maxH;
  const hAlvo = hAntes * fator;
  const depoisEm = r.depoisEm ?? r.em + 0.5;
  const movEm = r.movimentoEm ?? depoisEm + 0.3;
  const relEm = r.relacaoEm ?? movEm + 0.6;
  const pA = prog(t, r.em + 0.05, 0.45, saida);
  const pD = prog(t, depoisEm, 0.3, saida);
  const pM = prog(t, movEm, Math.max(0.45, Math.min(0.75, relEm - movEm)), queda);
  const hDepois = (hAntes + (hAlvo - hAntes) * pM) * pD;
  const bw = 210;
  const xA = 30;
  const xD = 296;
  const xRel = xD + bw + 56;
  const yRef = base - hAntes;
  const yAlvo = base - hAlvo;
  const pRel = prog(t, relEm - 0.02, 0.3);
  const golpe = soco(t, relEm, 0.34);
  const fR = r.relacao ? caber(r.relacao, PW - xRel, 74, 36, 2) : null;
  return (
    <>
      <div style={{ position: "absolute", left: 0, top: topo, width: PW }}>
        <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={temposDoTexto(r.rotulo, r.em, plano.palavras, ate)} />
      </div>
      {r.ilustrativo ? (
        <div style={{ position: "absolute", right: 0, top: topo + 8 }}>
          <Aviso texto="ilustrativo" />
        </div>
      ) : null}
      {/* linha de base, que se desenha */}
      <div style={{ position: "absolute", left: 0, top: base, width: PW * prog(t, r.em, 0.4, suave), height: 3, background: cor.tinta }} />
      {/* referência: a altura de ANTES, atravessando */}
      {t >= depoisEm ? (
        <div style={{ position: "absolute", left: xA, top: yRef - 1, width: (xD + bw + 24 - xA) * prog(t, depoisEm, 0.35), height: 0, borderTop: `3px dashed ${cor.tintaFraca}` }} />
      ) : null}
      {/* barra ANTES */}
      <div style={{ position: "absolute", left: xA, top: base - hAntes * pA, width: bw, height: hAntes * pA, borderRadius: "10px 10px 0 0", background: cor.tinta }} />
      {/* barra DEPOIS */}
      {t >= depoisEm ? <div style={{ position: "absolute", left: xD, top: base - hDepois, width: bw, height: hDepois, borderRadius: "10px 10px 0 0", background: cor.acento }} /> : null}
      {/* seta do movimento */}
      {t >= movEm && t < relEm + 0.6 ? (
        <div style={{ position: "absolute", left: xD + bw / 2 - 30, top: r.direcao === "cai" ? yRef + 14 : base - hDepois - 74, opacity: Math.min(prog(t, movEm, 0.15), 1 - prog(t, relEm + 0.3, 0.3)) }}>
          <Icone nome={r.direcao === "cai" ? "seta-baixo" : "seta-cima"} tamanho={60} cor={r.direcao === "cai" ? cor.papel : cor.acento} traco={3} />
        </div>
      ) : null}
      {/* valores ditos */}
      {r.valorAntes && pA > 0.6 ? (
        <div style={{ position: "absolute", left: xA - 20, width: bw + 40, top: base - hAntes - 58, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: caber(r.valorAntes, bw + 40, 44, 26, 1).tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>{r.valorAntes}</div>
      ) : null}
      {r.valorDepois && t >= relEm ? (
        <div style={{ position: "absolute", left: xD - 20, width: bw + 40, top: base - hDepois - 58, textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: caber(r.valorDepois, bw + 40, 44, 26, 1).tamanho, color: cor.acento, whiteSpace: "nowrap", opacity: pRel }}>{r.valorDepois}</div>
      ) : null}
      {/* colchete da proporção + a relação dita */}
      {r.relacao && t >= relEm - 0.02 ? (
        <>
          <svg width={40} height={Math.abs(yRef - yAlvo) + 8} style={{ position: "absolute", left: xD + bw + 10, top: Math.min(yRef, yAlvo) - 4, opacity: pRel }}>
            <path d={`M6 4 H22 V${Math.abs(yRef - yAlvo) + 4} H6`} fill="none" stroke={cor.acento} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {fR ? (
            <div
              style={{
                position: "absolute",
                left: xRel,
                top: (yRef + yAlvo) / 2 - (fR.linhas.length * fR.tamanho * 1.12) / 2,
                width: PW - xRel,
                opacity: pRel,
                transform: `translateX(${(1 - pRel) * -16}px) scale(${1 + 0.06 * golpe})`,
                transformOrigin: "0% 50%",
              }}
            >
              <Texto t={t} linhas={fR.linhas} tamanho={fR.tamanho} cor={cor.acento} />
            </div>
          ) : null}
        </>
      ) : null}
      {/* rótulos das barras */}
      <div style={{ position: "absolute", left: xA - 20, width: bw + 40, top: base + 12, display: "flex", justifyContent: "center", opacity: pA }}>
        <Rotulo texto={r.antes ?? "antes"} tamanho={tamanhoRotulo(r.antes ?? "antes", bw + 40, ROTULO, 20)} />
      </div>
      {t >= depoisEm ? (
        <div style={{ position: "absolute", left: xD - 20, width: bw + 40, top: base + 12, display: "flex", justifyContent: "center", opacity: pD }}>
          <Rotulo texto={r.depois ?? "depois"} tamanho={tamanhoRotulo(r.depois ?? "depois", bw + 40, ROTULO, 20)} cor={cor.acento} />
        </div>
      ) : null}
    </>
  );
};

const paginaDepois = (m: Case, plano: Plano): Pagina | null => {
  const p = m.prazo;
  const r = m.resultado;
  if (!p && !r) return null;
  const etiqueta = m.etiqueta && !m.antes && !m.mudancas ? m.etiqueta : "Depois";
  const chegada = Math.min(p?.em ?? Infinity, r?.em ?? Infinity);
  const blocos: Bloco[] = [...(p ? [{ h: alturaPrazo(p), em: p.em }] : []), ...(r ? [{ h: ALTURA_RESULTADO, em: r.em }] : [])];
  const gap = 24;
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const topo = topoDoConjunto(t, blocos, gap);
      const ys = posicoesDosBlocos(topo, blocos, gap);
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} acento />
          {p ? <Prazo t={t} plano={plano} p={p} topo={ys[0]} ate={r?.em ?? m.ate} /> : null}
          {r ? <Resultado t={t} plano={plano} r={r} topo={ys[p ? 1 : 0]} altura={ALTURA_RESULTADO} ate={m.ate} /> : null}
        </>
      );
    },
  };
};

// A ficha sozinha: a mesma página do ANTES, com a etiqueta do plano no carimbo.
export const paginaFicha = (m: Ficha, plano: Plano): Pagina =>
  paginaAntes(
    m,
    { etiqueta: m.etiqueta ?? "Ficha", em: m.em ?? m.metricas[0]?.em ?? m.de, titulo: m.titulo, icone: m.icone, tituloEm: m.tituloEm, carimboEm: m.carimboEm, metricas: m.metricas },
    plano,
  );

export const paginasDoCase = (m: Case, plano: Plano): Pagina[] => {
  const lista: Pagina[] = [];
  if (m.antes?.metricas?.length) lista.push(paginaAntes(m, m.antes, plano));
  if (m.mudancas?.itens?.length) lista.push(paginaMudancas(m, m.mudancas, plano));
  const d = paginaDepois(m, plano);
  if (d) lista.push(d);
  return lista;
};

// o trecho do destaque existe no título?
export const destaqueValido = (texto: string, destaque?: string) => !destaque || !!trechoNoTexto(texto, destaque);
