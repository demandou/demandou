// O cartão do fato (o porquê da resposta) e a revelação (cartão-mistério que vira na palavra).
import { Img, staticFile } from "remotion";
import { entrada, prog, saindo, salto, soco, suave, temposDoTexto } from "../anim";
import { nucleo } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { ImagemNoMomento } from "../motor/imagem";
import type { Fato as TFato, Plano, Revelacao as TRevelacao } from "../plano";
import { cor, fonte, PAINEL, RAIO, sombra } from "../tema";
import { Anel, caber, Etiqueta, Texto } from "./Pecas";
import { FAIXA_RESPOSTA, type Retangulo } from "./Quiz";

// tira o `destaque` do texto corrido (ele aparece grande, à parte)
const semTrecho = (texto: string, trecho?: string) => {
  if (!trecho) return texto;
  const ws = texto.split(/\s+/).filter(Boolean);
  const as = trecho.split(/\s+/).filter(Boolean).map(nucleo);
  for (let i = 0; i + as.length <= ws.length; i++) {
    if (as.every((a, k) => nucleo(ws[i + k]) === a)) return [...ws.slice(0, i), ...ws.slice(i + as.length)].join(" ");
  }
  return texto;
};

// Moldura de medida: quatro cantos que se abrem do centro até envolver o dado, com marcas de cota.
const Medida: React.FC<{ w: number; h: number; p: number; t: number; tinta: string }> = ({ w, h, p, t, tinta }) => {
  const k = 0.55 + 0.45 * p;
  const respira = p >= 1 ? 1 + 0.012 * Math.sin(t * 3.4) : 1;
  const W = w * k * respira;
  const H = h * k * respira;
  const L = Math.min(54, h * 0.3);
  const s = 7;
  const canto = (sx: number, sy: number) => {
    const x = w / 2 + (sx * W) / 2;
    const y = h / 2 + (sy * H) / 2;
    return <path key={`${sx}${sy}`} d={`M ${x} ${y - sy * L} L ${x} ${y} L ${x - sx * L} ${y}`} fill="none" stroke={tinta} strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />;
  };
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: Math.min(1, p * 2.5) }}>
      {canto(-1, -1)}
      {canto(1, -1)}
      {canto(-1, 1)}
      {canto(1, 1)}
    </svg>
  );
};

// ——— fato ———

// `entraEm` (com quiz antes): quando a faixa da resposta termina de assentar; o cartão aparece ali,
// já no lugar final (sem subir), e nunca embaixo da faixa em movimento.
export const Fato: React.FC<{ t: number; plano: Plano; m: TFato; fim: number; ligado: boolean; entraEm?: number }> = ({ t, plano, m, fim, ligado, entraEm }) => {
  if (t < m.de - 0.05 || t > fim + 0.25) return null;
  const em = m.em ?? m.de;
  const entra = ligado ? (entraEm ?? m.de + 0.4) : m.de;
  const sai = saindo(t, fim, 0.22);
  const titulo = !ligado && m.titulo ? m.titulo : undefined;
  const area: Retangulo = ligado
    ? { x: PAINEL.x, y: FAIXA_RESPOSTA.y + FAIXA_RESPOSTA.h + 28, w: PAINEL.w, h: PAINEL.base - (FAIXA_RESPOSTA.y + FAIXA_RESPOSTA.h + 28) }
    : { x: PAINEL.x, y: PAINEL.y + (titulo ? 66 : 8), w: PAINEL.w, h: PAINEL.base - PAINEL.y - (titulo ? 66 : 8) };
  const img = imagemDoPlano(plano, m.imagem);
  const comImagem = temImagem(img);
  const corpo = semTrecho(m.texto, m.destaque);
  const larg = area.w - 96;
  const fitT = caber(corpo, larg, 64, 36, 3, 700);
  const altT = corpo ? fitT.linhas.length * fitT.tamanho * 1.14 : 0;
  const altImg = comImagem ? Math.min(220, area.h * 0.34) : 0;
  const fitD = m.destaque ? caber(m.destaque, larg - 120, 200, 72, 1, 800) : null;
  const altD = fitD ? fitD.tamanho * 1.3 : 0;
  const fitDet = m.detalhe ? caber(m.detalhe, larg, 38, 26, 2, 600) : null;
  const altDet = fitDet ? fitDet.linhas.length * fitDet.tamanho * 1.14 : 0;
  const vaos = [altImg, altT, altD, altDet].filter((x) => x > 0).length - 1;
  const total = altImg + altT + altD + altDet + Math.max(0, vaos) * 30;
  let y = Math.max(28, (area.h - total) / 2);
  const yImg = y;
  if (altImg) y += altImg + 30;
  const yT = y;
  if (altT) y += altT + 30;
  const yD = y;
  if (altD) y += altD + 30;
  const yDet = y;
  const e = ligado ? { opacity: prog(t, entra, 0.16), transform: undefined as string | undefined, visivel: t >= entra } : entrada(t, entra, { de: 0.9, sobe: 50 });
  const tempos = temposDoTexto(corpo, em, plano.palavras, m.destaqueEm ?? fim);
  const dEm = m.destaqueEm ?? em + 0.5;
  const pD = prog(t, dEm - 0.04, 0.42, salto);
  const golpe = soco(t, dEm - 0.04, 0.34);
  const detEm = m.detalheEm ?? dEm + 0.5;
  const yT0 = Math.max(28, (area.h - altT) / 2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {titulo ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: PAINEL.y, display: "flex", justifyContent: "center", opacity: prog(t, m.de, 0.3) }}>
          <Etiqueta texto={titulo} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h, opacity: e.opacity, transform: e.transform, visibility: e.visivel ? "visible" : "hidden" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: area.w, height: 10, borderRadius: `${RAIO}px ${RAIO}px 0 0`, background: ligado ? cor.certo : cor.acento, opacity: 0.9 }} />
        {comImagem && img?.arquivo ? (
          <div style={{ position: "absolute", left: 48, width: larg, top: yImg, height: altImg, display: "flex", justifyContent: "center", alignItems: "center", ...imgEntrada(t, entra + 0.1) }}>
            <Img src={staticFile(img.arquivo)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        ) : null}
        {altT ? (
          // sem imagem, a frase começa no meio do cartão e sobe para o lugar dela quando o dado bate
          <div style={{ position: "absolute", left: 48, width: larg, top: !comImagem && fitD ? yT0 + (yT - yT0) * prog(t, dEm - 0.04, 0.4, suave) : yT }}>
            <Texto t={t} linhas={fitT.linhas} tamanho={fitT.tamanho} peso={700} tempos={tempos} />
          </div>
        ) : null}
        {fitD && t >= dEm - 0.04 ? (
          <div style={{ position: "absolute", left: 48, width: larg, top: yD, height: altD }}>
            <Medida w={larg} h={altD} p={pD} t={t} tinta={cor.acento} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: Math.min(1, pD * 2),
                transform: pD >= 1 && golpe === 0 ? undefined : `scale(${(0.7 + 0.3 * pD) * (1 + 0.06 * golpe)})`,
              }}
            >
              <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: fitD.tamanho, color: cor.acento, letterSpacing: "-0.03em", lineHeight: 1, whiteSpace: "nowrap" }}>{fitD.linhas.join(" ")}</span>
            </div>
          </div>
        ) : null}
        {fitDet && t >= detEm ? (
          <div style={{ position: "absolute", left: 48, width: larg, top: yDet, opacity: prog(t, detEm, 0.3) }}>
            <Texto t={t} linhas={fitDet.linhas} tamanho={fitDet.tamanho} peso={600} cor={cor.tintaSuave} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const imgEntrada = (t: number, em: number) => {
  const p = prog(t, em, 0.4, salto);
  return { opacity: Math.min(1, p * 2), transform: p >= 1 ? undefined : `scale(${0.7 + 0.3 * p})` };
};

// ——— revelação: o cartão-mistério ———

export const Revelacao: React.FC<{ t: number; plano: Plano; m: TRevelacao; fim: number }> = ({ t, plano, m, fim }) => {
  if (t < m.de - 0.05 || t > fim + 0.25) return null;
  const sai = saindo(t, fim, 0.22);
  const em = m.em ?? m.de;
  const temTexto = !!m.texto?.trim();
  const fitQ = temTexto ? caber(m.texto as string, PAINEL.w, 66, 40, 2, 800) : null;
  const altQ = fitQ ? fitQ.linhas.length * fitQ.tamanho * 1.14 : 0;
  const yQ = PAINEL.y + 14;
  const topo = fitQ ? yQ + altQ + 36 : PAINEL.y + 20;
  const card: Retangulo = { x: PAINEL.x + 40, y: topo, w: PAINEL.w - 80, h: PAINEL.base - topo };
  const tempos = fitQ ? temposDoTexto(m.texto as string, em, plano.palavras, m.revelaEm) : [];
  const e = entrada(t, m.de, { de: 0.88, sobe: 40 });
  // a virada: o verso encolhe na horizontal, a frente abre
  const meio = m.revelaEm + 0.16;
  const fechando = t >= m.revelaEm && t < meio ? prog(t, m.revelaEm, 0.16, suave) : t >= meio ? 1 : 0;
  const abrindo = prog(t, meio, 0.26, salto);
  const frente = t >= meio;
  const escalaX = frente ? Math.max(0.02, abrindo) : 1 - fechando * 0.98;
  const img = imagemDoPlano(plano, m.imagem as ImagemNoMomento | undefined);
  const comImagem = temImagem(img);
  const fitR = caber(m.resposta, card.w - 90, 150, 56, 2, 800);
  const altR = fitR.linhas.length * fitR.tamanho * 1.1;
  const altImg = comImagem ? Math.min(240, card.h * 0.42) : 0;
  const fitDet = m.detalhe ? caber(m.detalhe, card.w - 90, 40, 26, 2, 600) : null;
  const altDet = fitDet ? fitDet.linhas.length * fitDet.tamanho * 1.14 + 24 : 0;
  const totalF = altImg + (altImg ? 26 : 0) + altR + altDet;
  const yF = (card.h - totalF) / 2;
  const deriva = (t * 30) % 60;
  const detEm = m.detalheEm ?? meio + 0.6;
  const dAnel = Math.min(180, card.h * 0.4);
  const pulsa = !frente ? 1 + 0.012 * Math.sin(t * 4) : 1;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {fitQ ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: yQ }}>
          <Texto t={t} linhas={fitQ.linhas} tamanho={fitQ.tamanho} tempos={tempos} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: card.x, top: card.y, width: card.w, height: card.h, opacity: e.opacity, transform: e.transform, visibility: e.visivel ? "visible" : "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scaleX(${escalaX}) scale(${pulsa})` }}>
          {!frente ? (
            <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.acento, boxShadow: sombra, overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  inset: -60,
                  backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 14px, transparent 14px, transparent 30px)",
                  backgroundPosition: `${deriva}px 0px`,
                }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: Math.min(card.h * 0.6, 300), color: cor.cartao, lineHeight: 1 }}>?</span>
              </div>
            </div>
          ) : (
            <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 10, background: cor.acento }} />
              {comImagem && img?.arquivo ? (
                <div style={{ position: "absolute", left: 45, width: card.w - 90, top: yF, height: altImg, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Img src={staticFile(img.arquivo)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 45, width: card.w - 90, top: yF + altImg + (altImg ? 26 : 0) }}>
                <Texto t={t} linhas={fitR.linhas} tamanho={fitR.tamanho} cor={cor.tinta} />
              </div>
              {fitDet && t >= detEm ? (
                <div style={{ position: "absolute", left: 45, width: card.w - 90, top: yF + altImg + (altImg ? 26 : 0) + altR + 24, opacity: prog(t, detEm, 0.3) }}>
                  <Texto t={t} linhas={fitDet.linhas} tamanho={fitDet.tamanho} peso={600} cor={cor.tintaSuave} />
                </div>
              ) : null}
            </div>
          )}
        </div>
        <Anel t={t} cx={card.w - dAnel / 2 - 22} cy={dAnel / 2 + 22} d={dAnel} contagem={m.contagem} relogioEm={m.relogioEm} revelaEm={m.revelaEm} />
      </div>
    </div>
  );
};

