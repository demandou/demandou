// A assinatura da Oferta: a pilha de valor e o preço.
// - A pilha: cada entrega CAI na palavra dela como um cartão de papel (objeto à esquerda, nome à
//   direita) e encaixa EMBAIXO da anterior: a lista desce na ordem da fala, com o rótulo
//   ("VOCÊ LEVA") no alto. Os cartões pousam tortos, como papel de verdade, os de cima assentam com
//   o impacto, e todos se alinham quando o valor é dito.
// - O preço: o cartão do valor sobe embaixo da pilha; a âncora BATE inteira na palavra do número;
//   no risco, a linha vermelha atravessa a âncora grande, que encolhe para o lado do rótulo do
//   preço (pequena, riscada); o preço real CAI e BATE grande em verde, de uma vez (sem números
//   intermediários). A pilha pula com o impacto.
// - Com garantia/prazo/botão logo depois, o preço sobe para o alto da página (a "doca") e eles se
//   montam embaixo dele.
import { Easing, Img, interpolate, staticFile } from "remotion";
import { entrada, formatar, pousoDe, prog, queda, saindo, salto, soco, suave, temposDoTexto } from "../anim";
import { larguraTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Entrega, Oferta as TOferta, Plano, ValorDaOferta } from "../plano";
import { cor, fonte, PAINEL } from "../tema";
import { caber, Cartao, Etiqueta, Icone, Selo, Texto } from "./Pecas";

export const PRECO_H = 300;
export const DOCA_Y = PAINEL.y + 14;
export const PRECO_Y = PAINEL.base - PRECO_H;
// a área livre embaixo da doca (onde selo, prazo e botão se montam)
export const AREA_DOCA = { y: DOCA_Y + PRECO_H + 26, base: PAINEL.base };

export type Doca = { de: number; fim: number };

const GIROS = [-1.3, 1.1, -0.7, 1.4, -1];
const DESVIOS = [0, -12, 14, -8, 10];
const ENCOLHE = [0, 34, 16, 44, 8];

// ——— valores ———

const numero = (v: ValorDaOferta) => typeof v.valor === "number" && Number.isFinite(v.valor);
const textoDoValor = (v: ValorDaOferta, x?: number) =>
  numero(v) ? formatar(x ?? (v.valor as number), v.casas ?? 0) : (v.texto ?? "");

// Valor com o prefixo pequeno e alto ("R$") e o sufixo pequeno ("/mês").
export const Valor: React.FC<{ v: ValorDaOferta; x?: number; tamanho: number; c: string }> = ({ v, x, tamanho, c }) => (
  <span style={{ fontFamily: fonte, fontWeight: 800, color: c, whiteSpace: "nowrap", lineHeight: 1, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums" }}>
    {v.prefixo && numero(v) ? (
      <span style={{ fontSize: tamanho * 0.4, verticalAlign: "top", position: "relative", top: tamanho * 0.1, marginRight: tamanho * 0.08, letterSpacing: "0em" }}>{v.prefixo}</span>
    ) : null}
    <span style={{ fontSize: tamanho }}>{textoDoValor(v, x)}</span>
    {v.sufixo && numero(v) ? <span style={{ fontSize: tamanho * 0.36, marginLeft: tamanho * 0.06, letterSpacing: "0em" }}>{v.sufixo}</span> : null}
  </span>
);

// largura de um valor desenhado (para caber e para riscar)
export const larguraValor = (v: ValorDaOferta, tamanho: number) => {
  const corpo = larguraTexto(textoDoValor(v).replace(/\d/g, "0"), tamanho, { peso: 800, espacamento: -0.035 });
  const pre = v.prefixo && numero(v) ? larguraTexto(v.prefixo, tamanho * 0.4, { peso: 800 }) + tamanho * 0.08 : 0;
  const suf = v.sufixo && numero(v) ? larguraTexto(v.sufixo, tamanho * 0.36, { peso: 800 }) + tamanho * 0.06 : 0;
  return corpo + pre + suf;
};

export const tamanhoQueCabe = (v: ValorDaOferta, largura: number, max: number, min: number) => {
  let s = max;
  while (s > min && larguraValor(v, s) > largura) s -= 4;
  return s;
};

// ——— instantes da oferta ———

export const tempos = (m: TOferta) => {
  const a = m.ancora;
  const p = m.preco;
  const valorEm = Math.min(a ? (a.rotuloEm ?? a.em) : Infinity, p ? (p.rotuloEm ?? p.em) : Infinity);
  const riscoEm = a && p ? (p.riscoEm ?? p.rotuloEm ?? p.em - 0.5) : undefined;
  // a âncora riscada encolhe para o lado do rótulo logo depois do risco (e antes do preço bater)
  const encolheEm = riscoEm !== undefined && p ? Math.min(riscoEm + 0.4, p.em - 0.5) : undefined;
  return { valorEm: Number.isFinite(valorEm) ? valorEm : undefined, riscoEm, encolheEm, precoEm: p?.em };
};

// ——— a pilha ———

// A pilha desce do alto da página (cartões de até 224 px) até o valor ser dito; aí ela se compacta
// (os cartões encolhem para cima) e o cartão do preço sobe embaixo dela.
const geometria = (m: TOferta, t: number) => {
  const comPreco = !!(m.ancora || m.preco);
  const { valorEm } = tempos(m);
  const pC = comPreco && valorEm !== undefined ? prog(t, valorEm - 0.25, 0.5, suave) : 0;
  const topo = PAINEL.y + (m.titulo ? 74 : 10);
  const n = Math.max(1, m.itens.length);
  const vao = 14;
  const baseLivre = PAINEL.base - 10;
  const baseComPreco = PRECO_Y - 30;
  const hLivre = Math.min(224, (baseLivre - topo - vao * (n - 1)) / n);
  const hComPreco = Math.min(178, (baseComPreco - topo - vao * (n - 1)) / n);
  return { h: hLivre + (hComPreco - hLivre) * pC, vao, n, topo };
};

const CartaoEntrega: React.FC<{ t: number; plano: Plano; it: Entrega; i: number; x: number; y: number; w: number; h: number; giro: number; extra: string }> = ({
  t,
  plano,
  it,
  i,
  x,
  y,
  w,
  h,
  giro,
  extra,
}) => {
  const q = queda(t, it.em, giro);
  if (!q.visivel) return null;
  const img = imagemDoPlano(plano, it.imagem);
  const comImg = temImagem(img);
  const lado = h - 24;
  const xTexto = 12 + lado + 30;
  const fPreco = it.preco ? caber(it.preco, 220, 34, 24, 1, 800) : null;
  const wPreco = fPreco ? larguraTexto(it.preco as string, fPreco.tamanho, { peso: 800 }) + 44 : 0;
  const largura = w - xTexto - 30 - (wPreco ? wPreco + 18 : 0);
  const temDet = !!it.detalhe;
  const fit = caber(it.texto, largura, temDet ? 52 : h > 180 ? 60 : 54, 28, temDet ? 1 : 2, 800);
  const fD = temDet ? caber(it.detalhe as string, largura, 30, 22, 1, 600) : null;
  const altT = fit.linhas.length * fit.tamanho * 1.14 + (fD ? fD.tamanho * 1.25 + 6 : 0);
  const foco = it.imagem?.foco ?? img?.foco ?? { x: 0.5, y: 0.5 };
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: q.opacity, transform: [q.transform, extra].filter(Boolean).join(" ") || undefined }}>
      <Cartao raio={22} style={{ boxShadow: `0 ${10 + 26 * q.p}px ${24 + 30 * q.p}px rgba(15,51,40,${0.16 - 0.06 * q.p}), 0 2px 5px rgba(15,51,40,0.08)` }} />
      <div style={{ position: "absolute", left: 12, top: 12, width: lado, height: lado, borderRadius: 16, overflow: "hidden", background: cor.acentoClaro }}>
        {comImg ? (
          <Img src={staticFile(img.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${foco.x * 100}% ${foco.y * 100}%` }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {it.icone ? <Icone nome={it.icone} tamanho={lado * 0.56} cor={cor.acento} traco={1.8} /> : <Selo texto={String(i + 1)} tamanho={lado * 0.58} />}
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: xTexto, top: (h - altT) / 2, width: largura }}>
        <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} alinhar="left" />
        {fD ? (
          <div style={{ marginTop: 6 }}>
            <Texto t={t} linhas={fD.linhas} tamanho={fD.tamanho} peso={600} cor={cor.tintaSuave} alinhar="left" />
          </div>
        ) : null}
      </div>
      {fPreco ? (
        <div style={{ position: "absolute", right: 26, top: (h - fPreco.tamanho * 1.6) / 2 }}>
          <div style={{ padding: `${fPreco.tamanho * 0.3}px 22px`, borderRadius: 40, background: cor.acentoClaro, fontFamily: fonte, fontWeight: 800, fontSize: fPreco.tamanho, color: cor.acento, whiteSpace: "nowrap", lineHeight: 1 }}>{it.preco}</div>
        </div>
      ) : null}
    </div>
  );
};

export const Pilha: React.FC<{ t: number; plano: Plano; m: TOferta; saida: number; golpe: number; numerado?: boolean }> = ({ t, plano, m, saida, golpe, numerado = true }) => {
  const g = geometria(m, t);
  const { valorEm } = tempos(m);
  const alinha = valorEm !== undefined ? prog(t, valorEm, 0.45, suave) : 0;
  // quando um cartão pousa embaixo, os de cima assentam 4 px (a pilha "senta")
  const impactos = m.itens.map((it) => queda(t, it.em).impacto);
  const pT = m.titulo ? entrada(t, m.em ?? m.de, { de: 0.8, sobe: 16 }) : null;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {m.itens.map((it, i) => {
        const w = PAINEL.w - ENCOLHE[i % 5] * (1 - alinha);
        const x = PAINEL.x + (PAINEL.w - w) / 2 + DESVIOS[i % 5] * (1 - alinha);
        const y = g.topo + i * (g.h + g.vao);
        const assenta = impactos.reduce((s2, imp, k) => (k > i ? s2 + imp * 4 : s2), 0);
        const sai = prog(saida, i * 0.08, 0.6, (x2) => x2);
        const extra = [
          assenta ? `translateY(${assenta}px)` : "",
          golpe ? `translateY(${-golpe * 7}px)` : "",
          sai > 0 ? `translateY(${-sai * 50}px) scale(${1 - 0.05 * sai})` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div key={i} style={{ opacity: 1 - sai }}>
            <CartaoEntrega t={t} plano={plano} it={numerado || it.icone || it.imagem ? it : { ...it, icone: "check" }} i={i} x={x} y={y} w={w} h={g.h} giro={GIROS[i % 5] * (1 - alinha)} extra={extra} />
          </div>
        );
      })}
      {pT && m.titulo && t >= (m.em ?? m.de) ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: g.topo - 66, display: "flex", justifyContent: "center", opacity: pT.opacity * (1 - saida), transform: pT.transform }}>
          <Etiqueta texto={m.titulo} tamanho={30} />
        </div>
      ) : null}
    </div>
  );
};

// ——— o preço ———

export const CartaoPreco: React.FC<{ t: number; plano: Plano; m: TOferta; y: number; golpe: number }> = ({ t, plano, m, y, golpe }) => {
  const a = m.ancora;
  const p = m.preco;
  const { valorEm, riscoEm, encolheEm } = tempos(m);
  if (valorEm === undefined || t < valorEm - 0.06) return null;
  const e = entrada(t, valorEm - 0.06, { de: 0.94, sobe: 40, dur: 0.4 });
  const X0 = 46;
  const LARG = PAINEL.w - X0 * 2;
  const yRot = 30;
  const tamRot = 44;
  const yNum = 92;
  // rótulos: o da âncora até o rótulo do preço começar; depois o do preço
  const trocaEm = p ? (p.rotuloEm ?? riscoEm ?? p.em) : Infinity;
  const rotA = a?.rotulo && t < trocaEm + 0.15 ? a.rotulo : null;
  const rotP = p?.rotulo && t >= trocaEm - 0.02 ? p.rotulo : null;
  const fRotA = rotA ? caber(rotA, LARG, tamRot, 30, 1, 700) : null;
  const fRotP = p?.rotulo ? caber(p.rotulo, LARG * 0.62, tamRot, 30, 1, 700) : null;
  const saiRotA = prog(t, trocaEm, 0.15);
  const tamA = a ? tamanhoQueCabe(a, LARG, 140, 70) : 0;
  const tamP = p ? tamanhoQueCabe(p, LARG, 160, 70) : 0;
  // a âncora: bate inteira na palavra do número
  const aVisivel = !!a && t >= a.em - 0.04;
  const eA = a ? entrada(t, a.em - 0.04, { de: 0.7, dur: 0.3 }) : null;
  const bateA = a ? soco(t, a.em + 0.26, 0.3) : 0;
  const pRisco = riscoEm !== undefined ? prog(t, riscoEm, 0.3, suave) : 0;
  // depois do risco, a âncora riscada encolhe para o lado do rótulo do preço
  const pEncolhe = encolheEm !== undefined ? prog(t, encolheEm, 0.45, suave) : 0;
  const tamCopia = 56;
  const xCopia = X0 + (fRotP ? larguraTexto(p?.rotulo as string, fRotP.tamanho, { peso: 700 }) + 30 : 0);
  const yCopia = yRot + (tamRot - tamCopia) / 2 - 4;
  const tamAgora = interpolate(pEncolhe, [0, 1], [tamA, tamCopia]);
  // o preço: cai de uma vez e bate grande (sem números intermediários)
  const pCai = p ? prog(t, p.em - 0.1, 0.18, Easing.in(Easing.quad)) : 0;
  const pousou = !!p && t >= p.em + 0.08;
  const bate = p ? soco(t, p.em + 0.08, 0.36) : 0;
  const respira = pousou && p ? 1 + 0.008 * Math.sin((t - p.em) * 3) : 1;
  return (
    <div style={{ position: "absolute", left: PAINEL.x, top: y, width: PAINEL.w, height: PRECO_H, opacity: e.opacity, transform: [e.transform, golpe ? `translateY(${golpe * 6}px)` : ""].filter(Boolean).join(" ") || undefined }}>
      <Cartao raio={28} />
      {/* picote de recibo no alto do cartão */}
      <svg width={PAINEL.w} height={14} style={{ position: "absolute", left: 0, top: -7 }}>
        {Array.from({ length: Math.floor((PAINEL.w - 60) / 26) }, (_, i) => (
          <circle key={i} cx={42 + i * 26} cy={7} r={5} fill={cor.pagina} />
        ))}
      </svg>
      {fRotA && rotA && a ? (
        <div style={{ position: "absolute", left: X0, top: yRot, opacity: 1 - saiRotA }}>
          <Texto t={t} linhas={fRotA.linhas} tamanho={fRotA.tamanho} peso={700} cor={cor.tintaSuave} alinhar="left" tempos={temposDoTexto(rotA, a.rotuloEm ?? a.em, plano.palavras, a.em)} />
        </div>
      ) : null}
      {fRotP && rotP && p ? (
        <div style={{ position: "absolute", left: X0, top: yRot }}>
          <Texto t={t} linhas={fRotP.linhas} tamanho={fRotP.tamanho} peso={700} cor={cor.tintaSuave} alinhar="left" tempos={temposDoTexto(rotP, p.rotuloEm ?? trocaEm, plano.palavras, p.em)} />
        </div>
      ) : null}
      {/* a âncora: grande na palavra; riscada no "hoje"; depois pequena ao lado do rótulo do preço */}
      {a && aVisivel && eA ? (
        <div
          style={{
            position: "absolute",
            left: interpolate(pEncolhe, [0, 1], [X0, xCopia]),
            top: interpolate(pEncolhe, [0, 1], [yNum, yCopia]),
            opacity: eA.opacity,
            transform: [eA.transform, bateA ? `scale(${1 + 0.08 * bateA})` : ""].filter(Boolean).join(" ") || undefined,
            transformOrigin: "left center",
          }}
        >
          <div style={{ position: "relative", display: "inline-block" }}>
            <span style={{ opacity: 1 - 0.4 * pRisco }}>
              <Valor v={a} tamanho={tamAgora} c={pEncolhe > 0.5 ? cor.tintaSuave : cor.tinta} />
            </span>
            {pRisco > 0 ? (
              <div style={{ position: "absolute", left: -8, top: tamAgora * 0.5, width: (larguraValor(a, tamAgora) + 16) * pRisco, height: Math.max(6, tamAgora * 0.065), borderRadius: 4, background: cor.risco, transform: "rotate(-4deg)", transformOrigin: "left center" }} />
            ) : null}
          </div>
        </div>
      ) : null}
      {/* o preço real */}
      {p && pCai > 0 ? (
        <div style={{ position: "absolute", left: X0, top: yNum - (1 - pCai) * 70, opacity: Math.min(1, pCai * 2.5), transform: `scale(${(pousou ? 1 + 0.12 * bate : 1.06) * respira})`, transformOrigin: "left center" }}>
          <Valor v={p} tamanho={tamP} c={cor.acento} />
          {/* o traço sálvia que sublinha o preço quando ele bate */}
          <div style={{ height: 8, marginTop: 6, width: Math.min(LARG, larguraValor(p, tamP)) * prog(t, p.em + 0.12, 0.35, suave), borderRadius: 4, background: cor.salvia }} />
        </div>
      ) : null}
      {m.ilustrativo ? (
        <div style={{ position: "absolute", right: 26, top: 24 }}>
          <Etiqueta texto="ilustrativo" fundo={cor.acentoClaro} tinta={cor.acentoEscuro} tamanho={20} />
        </div>
      ) : null}
    </div>
  );
};

// ——— a oferta inteira ———

export const Oferta: React.FC<{ t: number; plano: Plano; m: TOferta; fim: number; doca: Doca | null }> = ({ t, plano, m, fim, doca }) => {
  const fimTotal = doca ? doca.fim : fim;
  if (t < m.de - 0.1 || t > fimTotal + 0.3) return null;
  const sai = saindo(t, fimTotal, 0.22);
  const { precoEm } = tempos(m);
  const golpe = precoEm !== undefined ? soco(t, precoEm + 0.08, 0.34) : 0;
  // na doca: a pilha sai para cima e o preço sobe para o alto da página
  const pDoca = doca ? prog(t, doca.de, 0.5, suave) : 0;
  const saidaPilha = doca ? prog(t, doca.de - 0.02, 0.4, (x) => x) : 0;
  const temPreco = !!(m.ancora || m.preco);
  const y = interpolate(pDoca, [0, 1], [PRECO_Y, DOCA_Y]);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, transform: sai > 0 ? `scale(${1 - 0.03 * sai})` : undefined }}>
      {saidaPilha < 1 ? <Pilha t={t} plano={plano} m={m} saida={saidaPilha} golpe={golpe} /> : null}
      {temPreco ? <CartaoPreco t={t} plano={plano} m={m} y={y} golpe={golpe} /> : null}
    </div>
  );
};

// onde fica o selo quando ele vira um carimbo pequeno no cartão do preço (doca)
export const SELO_NA_DOCA = { cx: PAINEL.x + PAINEL.w - 140, cy: DOCA_Y + PRECO_H / 2 + 2, d: 236 };
