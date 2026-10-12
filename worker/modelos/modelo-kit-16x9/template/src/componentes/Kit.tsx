// A assinatura: o kit. Uma mesa vista de cima com um lugar marcado para cada coisa. Em cada `em` a
// câmera chega no lugar, o objeto cai no cartão com sombra, uma linha pontilhada leva até a etiqueta
// (nome e para que serve) e o contador anda. No fim a câmera se afasta e mostra o kit completo.
import { Img, staticFile } from "remotion";
import { prog, queda, rapido, desliza } from "../anim";
import { encaixar } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import { CELULA_W, CONTADOR, geometria, type Camera } from "../layout";
import type { ItemDoKit, Kit as KitMomento, Plano } from "../plano";
import { cor, fonte, sombraNoAr } from "../tema";
import { Papel, aparece } from "./Mesa";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const GAP = 26;

// ——— o cartão do objeto ———

const CartaoDoObjeto: React.FC<{ plano: Plano; item: ItemDoKit; carta: number; t: number; x: number; y: number; giro: number }> = ({ plano, item, carta, t, x, y, giro }) => {
  const img = imagemDoPlano(plano, item.imagem);
  const tem = temImagem(img);
  const a = tem && img.largura && img.altura ? clamp(img.largura / img.altura, 0.42, 1.4) : 1;
  const lado = carta - 22;
  // imagem alta (controle, régua): o cartão fica mais alto em vez de cortar o objeto
  const iw = a >= 1 ? lado : a < 0.8 ? lado * 1.3 * a : lado * a;
  const ih = a >= 1 ? lado / a : a < 0.8 ? lado * 1.3 : lado;
  const w = iw + 22;
  const h = ih + 22;
  const foco = item.imagem?.foco ?? img?.foco ?? { x: 0.5, y: 0.5 };
  const nome = encaixar(item.nome, { largura: w - 28, max: 40, min: 24, linhas: 3, fonte: { peso: 800 } });
  return (
    <Papel t={t} em={item.em} x={x} y={y} w={w} h={h} giro={giro} raio={12}>
      <div style={{ position: "absolute", left: 11, top: 11, width: iw, height: ih, borderRadius: 6, overflow: "hidden", background: tem ? cor.papel : cor.kraft }}>
        {tem ? (
          <Img
            src={staticFile(img.arquivo)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: `${foco.x * 100}% ${foco.y * 100}%`,
              mixBlendMode: img.transparente ? undefined : "multiply",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: fonte, fontWeight: 800, fontSize: nome.tamanho, lineHeight: 1.1, color: cor.tinta, padding: 12 }}>
            <div>
              {nome.linhas.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Papel>
  );
};

// ——— a etiqueta (nome, para que serve, preço) ———

const Etiqueta: React.FC<{ item: ItemDoKit; n: number; t: number; x: number; yTopo: number; w: number; giro: number; emEtiqueta: number; detalhe: number; pequeno: boolean }> = ({ item, n, t, x, yTopo, w, giro, emEtiqueta, detalhe, pequeno }) => {
  const nome = encaixar(item.nome, { largura: w - 30, max: pequeno ? 44 : 52, min: pequeno ? 34 : 44, linhas: 2, fonte: { peso: 800 } });
  const det = item.detalhe ? encaixar(item.detalhe, { largura: w - 30, max: 32, min: 28, linhas: 2, fonte: { peso: 500 } }) : null;
  const hNome = nome.linhas.length * nome.tamanho * 1.08;
  const hDetCheio = det ? 10 + det.linhas.length * det.tamanho * 1.18 : 0;
  const hPreco = item.preco ? 52 : 0;
  // no resumo final o detalhe some (a etiqueta fica só com o nome); em foco ele ocupa o seu espaço
  const h = 18 + hNome + hDetCheio * detalhe + hPreco + 18;
  const emDet = item.detalheEm ?? emEtiqueta + 0.3;
  return (
    <Papel t={t} em={emEtiqueta} x={x} y={yTopo + h / 2} w={w} h={h} giro={giro} raio={8} style={{ borderLeft: `8px solid ${cor.cobalto}` }}>
      <div style={{ position: "absolute", left: 14, top: 18, width: w - 26 }}>
        <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: nome.tamanho, lineHeight: 1.08, color: cor.tinta }}>
          {nome.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        {det && detalhe > 0 ? (
          <div style={{ marginTop: 10, fontFamily: fonte, fontWeight: 500, fontSize: det.tamanho, lineHeight: 1.18, color: cor.tintaSuave, opacity: detalhe, ...aparece(t, emDet) }}>
            {det.linhas.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        ) : null}
        {item.preco ? (
          <div style={{ marginTop: 10, display: "inline-block", background: cor.cobalto, color: "#fff", fontFamily: fonte, fontWeight: 800, fontSize: 28, padding: "3px 14px", borderRadius: 6 }}>{item.preco}</div>
        ) : null}
      </div>
      <div style={{ position: "absolute", right: 10, top: 6, fontFamily: fonte, fontWeight: 800, fontSize: 22, color: cor.tintaApagada }}>{n}</div>
    </Papel>
  );
};

// ——— a linha pontilhada que liga o objeto à etiqueta ———

const Linha: React.FC<{ t: number; ini: number; x1: number; y1: number; x2: number; y2: number }> = ({ t, ini, x1, y1, x2, y2 }) => {
  const p = prog(t, ini, 0.36, desliza);
  if (t < ini) return null;
  const minX = Math.min(x1, x2) - 20;
  const w = Math.abs(x2 - x1) + 40;
  const minY = Math.min(y1, y2) - 30;
  const h = Math.abs(y2 - y1) + 110;
  const sx = x1 - minX;
  const sy = y1 - minY;
  const ex = x2 - minX;
  const ey = y2 - minY;
  const dir = x2 > x1 ? 1 : -1;
  const d = `M ${sx} ${sy} C ${sx + dir * 14} ${sy + 62}, ${ex - dir * 14} ${ey + 62}, ${ex} ${ey}`;
  const ate = dir > 0 ? sx + p * (ex - sx) : sx - p * (sx - ex);
  const clipX = dir > 0 ? 0 : ate;
  const clipW = dir > 0 ? ate : w - ate;
  return (
    <svg style={{ position: "absolute", left: minX, top: minY, overflow: "visible" }} width={w} height={h}>
      <defs>
        <clipPath id={`c-${Math.round(x1)}-${Math.round(y1)}`}>
          <rect x={dir > 0 ? -30 : clipX} y={-40} width={dir > 0 ? clipW + 30 : clipW + 30} height={h + 80} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c-${Math.round(x1)}-${Math.round(y1)})`}>
        <path d={d} fill="none" stroke={cor.cobalto} strokeWidth={5} strokeLinecap="round" strokeDasharray="1 11" />
      </g>
      <circle cx={sx} cy={sy} r={10} fill={cor.cobalto} stroke="#fff" strokeWidth={3.5} />
      {p > 0.98 ? <circle cx={ex} cy={ey} r={10} fill="#fff" stroke={cor.cobalto} strokeWidth={5} /> : null}
    </svg>
  );
};

// ——— os lugares vazios ———

const LugarVazio: React.FC<{ t: number; x: number; y: number; lado: number; n: number; surge: number; some: number }> = ({ t, x, y, lado, n, surge, some }) => {
  const p = prog(t, surge, 0.4, rapido);
  const sai = prog(t, some - 0.04, 0.12);
  if (t < surge || sai >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - lado / 2,
        top: y - lado / 2,
        width: lado,
        height: lado,
        border: `4px dashed ${cor.vazio}`,
        borderRadius: 16,
        boxSizing: "border-box",
        opacity: p * (1 - sai),
        transform: `scale(${0.88 + 0.12 * p})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonte,
        fontWeight: 800,
        fontSize: lado * 0.38,
        color: cor.vazio,
      }}
    >
      {n}
    </div>
  );
};

// ——— o kit inteiro (mundo) ———

export const posicoesDoKit = (m: KitMomento) => {
  const g = geometria(m.itens.length);
  const cellW = g.cols === 1 ? 860 : CELULA_W;
  const labelW = Math.min(g.cols === 1 ? 440 : 400, cellW - 24 - g.carta - GAP);
  return { g, cellW, labelW };
};

export const KitMundo: React.FC<{ m: KitMomento; plano: Plano; t: number; fimTotal: number; cam: Camera }> = ({ m, plano, t, fimTotal, cam }) => {
  const { g, cellW, labelW } = posicoesDoKit(m);
  const lugaresEm = m.lugaresEm ?? m.de + 0.2;
  const ordem = [...m.itens].sort((a, b) => a.em - b.em);
  return (
    <>
      {m.itens.map((it, i) => {
        const c = g.centros[i];
        const espelha = g.cols === 2 && i % 2 === 1 && !(m.itens.length % 2 === 1 && i === m.itens.length - 1);
        const dir = espelha ? -1 : 1;
        const totalW = g.carta + GAP + labelW;
        const cardX = c.x - dir * (totalW / 2 - g.carta / 2);
        const labelX = c.x + dir * (totalW / 2 - labelW / 2);
        const cardY = c.y - g.celH * 0.13;
        const labelTop = c.y - g.celH * 0.1;
        const giro = [-3.2, 2.6, -1.8, 3.4, -2.4, 1.8][i % 6];
        const giroEt = [1.6, -1.4, 1.2, -1.8, 1.0, -1.2][i % 6];
        const numero = ordem.indexOf(it) + 1;
        const emEt = it.em + 0.42;
        const x1 = cardX + dir * (g.carta / 2 - 4);
        const x2 = labelX - dir * (labelW / 2 + 2);
        const detalhe = clamp((cam.z - 1.25) / 0.35, 0, 1);
        return (
          <div key={i}>
            <LugarVazio t={t} x={cardX} y={cardY} lado={g.carta + 6} n={i + 1} surge={lugaresEm + i * 0.16} some={it.em} />
            <Linha t={t} ini={it.em + 0.1} x1={x1} y1={cardY + g.carta * 0.18} x2={x2} y2={labelTop + 34} />
            <Etiqueta item={it} n={numero} t={t} x={labelX} yTopo={labelTop} w={labelW} giro={giroEt} emEtiqueta={emEt} detalhe={detalhe} pequeno={g.rows >= 3} />
            <CartaoDoObjeto plano={plano} item={it} carta={g.carta} t={t} x={cardX} y={cardY} giro={giro} />
          </div>
        );
      })}
      {m.total ? <TotalDoKit total={m.total} t={t} y={g.yTotal} em={m.totalEm ?? (m.afastarEm ?? 0) + 0.5} fim={fimTotal} /> : null}
    </>
  );
};

const TotalDoKit: React.FC<{ total: string; t: number; y: number; em: number; fim: number }> = ({ total, t, y, em, fim }) => {
  const enc = encaixar(total, { largura: 900, max: 46, min: 30, linhas: 1, fonte: { peso: 800 } });
  const sai = prog(t, fim, 0.22);
  if (sai >= 1) return null;
  return (
    <Papel t={t} em={em} x={0} y={y} w={1000} h={86} giro={-0.8} fundo={cor.kraft} raio={8} varrida={sai}>
      <div style={{ position: "absolute", left: 22, top: 35, width: 16, height: 16, borderRadius: 8, background: cor.mesa, boxShadow: "inset 0 2px 3px rgba(60,38,16,0.45)" }} />
      <div style={{ position: "absolute", left: 56, right: 24, top: 0, height: 86, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 800, fontSize: enc.tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>{enc.linhas.join(" ")}</div>
    </Papel>
  );
};

// --- o contador "1 de 4" no pé da mesa (tela), acima dos controles do player ---

export const KitContador: React.FC<{ m: KitMomento; t: number; fim: number }> = ({ m, t, fim }) => {
  const lugaresEm = m.lugaresEm ?? m.de + 0.2;
  const ordem = [...m.itens].sort((a, b) => a.em - b.em);
  const feitos = ordem.filter((it) => t >= it.em - 0.02).length;
  const afasta = m.afastarEm ?? ordem[ordem.length - 1].em + 1.4;
  const completo = t >= afasta + 0.2;
  const entra = prog(t, lugaresEm + 0.1, 0.3, rapido);
  const sai = prog(t, fim, 0.22);
  if (t < lugaresEm || sai >= 1) return null;
  const ultimoEm = feitos ? ordem[feitos - 1].em : -9;
  const pulso = 1 + 0.16 * Math.max(0, 1 - (t - ultimoEm) / 0.25) * (feitos ? 1 : 0);
  const n = m.itens.length;
  return (
    <div
      style={{
        position: "absolute",
        left: CONTADOR.x,
        top: CONTADOR.y,
        height: CONTADOR.h,
        padding: "0 26px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: completo ? cor.cobalto : cor.papel,
        color: completo ? "#fff" : cor.tinta,
        fontFamily: fonte,
        fontWeight: 800,
        fontSize: 38,
        borderRadius: 14,
        boxShadow: sombraNoAr(0.1),
        opacity: entra * (1 - sai),
        transform: `translateY(${(1 - entra) * -30}px)`,
      }}
    >
      <span style={{ display: "inline-block", transform: `scale(${pulso})`, color: completo ? "#fff" : cor.cobalto, fontSize: 46 }}>{feitos}</span>
      <span style={{ fontWeight: 700, fontSize: 32 }}>de {n}</span>
      {completo ? (
        <svg width={30} height={30} viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
          <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
};

export { queda };
