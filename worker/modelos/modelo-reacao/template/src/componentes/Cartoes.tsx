// A assinatura do Reação e os cartões-base: o comentário que abre o vídeo, o print (post, manchete ou
// print de verdade) com o marca-texto na linha lida e a câmera aproximando o trecho, a foto de apoio
// e o cartão de perfil. Todo cartão tem 960 px de largura e uma altura natural (`h`) medida antes.
import { interpolate } from "remotion";
import { desliza, prog, suave, temposDoTexto } from "../anim";
import { porTexto, trechoNoTexto, type TextoPosto } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Comentario, Foto as FotoM, Grafico, Momento, Palavra, Plano, Print } from "../plano";
import { cor, fonte, RAIO, sombraCartao } from "../tema";
import { Balao, Coracao, Enviar, Pontos, Responder, Silhueta } from "./Icones";
import { caixaDoTrecho, Texto, varrida, type Marca, type Risco } from "./Texto";

export const W = 960;
export const PAD = 48;
export const INTERNA = W - PAD * 2;

export type Cartao = { h: number; desenhar: (t: number) => React.ReactNode };
export type Ctx = { plano: Plano; palavras: Palavra[] };

export const corDoNome = (nome: string) => {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return cor.avatares[h % cor.avatares.length];
};

export const Casca: React.FC<{ h: number; fundo?: string; children?: React.ReactNode; estilo?: React.CSSProperties }> = ({ h, fundo = cor.cartao, children, estilo }) => (
  <div style={{ position: "relative", width: W, height: h, borderRadius: RAIO, background: fundo, boxShadow: sombraCartao, overflow: "hidden", ...estilo }}>{children}</div>
);

export const Avatar: React.FC<{ nome?: string; tamanho: number; x: number; y: number }> = ({ nome, tamanho, x, y }) => {
  const fundo = nome ? corDoNome(nome) : cor.cinzaClaro;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: tamanho, height: tamanho, borderRadius: "50%", background: fundo, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {nome ? (
        <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamanho * 0.5, color: "#fff", lineHeight: 1 }}>{nome.replace(/^@/, "").charAt(0).toLocaleUpperCase("pt-BR")}</span>
      ) : (
        <div style={{ marginTop: tamanho * 0.18 }}>
          <Silhueta tamanho={tamanho * 0.95} cor={cor.cinza} />
        </div>
      )}
    </div>
  );
};

// ——— cartão de perfil (abre o vídeo quando nenhum cartão começa em 0) ———

export const cartaoPerfil = (plano: Plano): Cartao => {
  const nome = plano.marca.nome;
  const area = plano.marca.area;
  const h = area ? 232 : 196;
  return {
    h,
    desenhar: () => (
      <Casca h={h}>
        <Avatar nome={nome} tamanho={120} x={PAD} y={(h - 120) / 2} />
        <div style={{ position: "absolute", left: PAD + 120 + 30, top: 0, height: h, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: 52, color: cor.tinta, lineHeight: 1.1 }}>{nome}</span>
          {area ? <span style={{ fontFamily: fonte, fontWeight: 600, fontSize: 34, color: cor.cinza, lineHeight: 1.15 }}>{area}</span> : null}
        </div>
      </Casca>
    ),
  };
};

// ——— comentário ———

const FAIXA = 84;

export const cartaoComentario = (m: Comentario, { palavras }: Ctx): Cartao => {
  const faixa = m.respondendo === false ? 0 : FAIXA;
  const tp = porTexto(m.texto, { largura: INTERNA, max: 112, min: 54, linhas: 4, fonte: { peso: 700 } });
  const topoCab = faixa + 44;
  const yTexto = topoCab + 112 + 30;
  const h = yTexto + tp.altura + 40 + 90 + 36;
  const n = tp.palavras.length;
  const tempos = temposDoTexto(m.texto, m.em ?? m.de + 0.2, palavras, m.ate);
  const marcas: Marca[] = [{ a: 0, b: n - 1, tempos }];
  return {
    h,
    desenhar: (t) => (
      <Casca h={h}>
        {faixa ? (
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: faixa, background: cor.acento, display: "flex", alignItems: "center", gap: 14, paddingLeft: PAD }}>
            <Responder tamanho={44} cor="#fff" traco={2.8} />
            <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: 40, color: "#fff", letterSpacing: "0.02em", textTransform: "uppercase" }}>Respondendo</span>
          </div>
        ) : null}
        <Avatar nome={m.autor} tamanho={112} x={PAD} y={topoCab} />
        <span style={{ position: "absolute", left: PAD + 112 + 28, top: topoCab, height: 112, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 700, fontSize: 40, color: cor.cinza }}>
          @{m.autor.replace(/^@/, "")}
        </span>
        <div style={{ position: "absolute", right: PAD, top: topoCab, height: 112, display: "flex", alignItems: "center" }}>
          <Pontos tamanho={54} cor={cor.cinza} />
        </div>
        <Texto tp={tp} t={t} x={PAD} y={yTexto} marcas={marcas} />
        <div style={{ position: "absolute", left: PAD, right: PAD, top: h - 128, height: 2, background: cor.linha }} />
        <div style={{ position: "absolute", left: PAD, top: h - 106, display: "flex", gap: 52, alignItems: "center", color: cor.cinza }}>
          <Coracao tamanho={56} />
          <Balao tamanho={56} />
          <Enviar tamanho={56} />
        </div>
      </Casca>
    ),
  };
};

// ——— print ———

// instantes-chave da câmera: [instante, escala, centro x, centro y] no cartão
type Quadro = { t: number; s: number; cx: number; cy: number };

// onde a câmera está no instante t: interpola entre os quadros-chave (entre dois, suave)
const cameraNoTempo = (quadros: Quadro[], t: number) => {
  if (!quadros.length || t <= quadros[0].t) return { s: 1, cx: W / 2, cy: 0 };
  let k = 0;
  for (let i = 0; i < quadros.length; i++) if (t >= quadros[i].t) k = i;
  const a = quadros[k];
  const b = quadros[k + 1];
  if (!b) return a;
  const p = suave(Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))));
  return { s: interpolate(p, [0, 1], [a.s, b.s]), cx: interpolate(p, [0, 1], [a.cx, b.cx]), cy: interpolate(p, [0, 1], [a.cy, b.cy]) };
};

const ancora = (c: number, s: number, centroDoQuadro: number, limite: number) => {
  if (s <= 1.0001) return centroDoQuadro;
  return Math.max(0, Math.min(limite, (centroDoQuadro - c * s) / (1 - s)));
};

const CABECALHO = 132;

export const cartaoPrint = (m: Print, { plano, palavras }: Ctx): Cartao => {
  const img = imagemDoPlano(plano, m.imagem);
  const real = !m.texto && !!img;
  const manchete = m.forma === "manchete";
  const grifos = m.grifos ?? [];
  const aproxima = m.zoom !== false;

  // ——— print de verdade (a imagem do usuário) ———
  if (real) {
    const proporcao = temImagem(img) && img.largura && img.altura ? img.altura / img.largura : 0.75;
    const h = Math.round(Math.min(1100, W * proporcao));
    const quadros: Quadro[] = [];
    const areas = grifos.filter((g) => g.area);
    if (aproxima && areas.length) {
      areas.forEach((g) => {
        const a = g.area as { x: number; y: number; w: number; h: number };
        const s = Math.max(1.25, Math.min(1.8, (W - 120) / (a.w * W)));
        quadros.push({ t: g.em - 0.15, s: 1, cx: W / 2, cy: h / 2 });
        quadros.push({ t: g.em + 0.45, s, cx: (a.x + a.w / 2) * W, cy: (a.y + a.h / 2) * h });
      });
      quadros.push({ t: m.ate - 0.7, s: quadros[quadros.length - 1].s, cx: quadros[quadros.length - 1].cx, cy: quadros[quadros.length - 1].cy });
      quadros.push({ t: m.ate - 0.15, s: 1, cx: W / 2, cy: h / 2 });
    }
    quadros.sort((a, b) => a.t - b.t);
    return {
      h,
      desenhar: (t) => {
        const c = cameraNoTempo(quadros, t);
        const ox = ancora(c.cx, c.s, W / 2, W);
        const oy = ancora(c.cy, c.s, h / 2, h);
        return (
          <Casca h={h}>
            <div style={{ position: "absolute", inset: 0, transformOrigin: `${ox}px ${oy}px`, transform: `scale(${c.s})` }}>
              <Foto imagem={img} de={m.de - 0.2} ate={m.ate + 1} efeito="parado" largura={W} altura={h} t={t} />
              {grifos.map((g, i) => {
                if (!g.area) return null;
                const p = prog(t, g.em, 0.4);
                if (p <= 0) return null;
                return (
                  <div key={i} style={{ position: "absolute", left: g.area.x * W - 8, top: g.area.y * h - 5, width: g.area.w * W * p + 16, height: g.area.h * h + 10, background: cor.marca, opacity: 0.55, mixBlendMode: "multiply", borderRadius: 8 }} />
                );
              })}
            </div>
          </Casca>
        );
      },
    };
  }

  // ——— post ou manchete desenhado ———
  const texto = m.texto ?? "";
  const larg = INTERNA - 80;
  const PX = PAD + 16;
  const tp: TextoPosto = porTexto(texto, manchete ? { largura: larg, max: 118, min: 56, linhas: 5, fonte: { peso: 800 } } : { largura: larg, max: 84, min: 46, linhas: 6, fonte: { peso: 600 } });
  const yTexto = (manchete ? 150 : CABECALHO + 20) + 30;
  const temFoto = !!img && !m.texto ? false : !!img;
  const hFoto = temFoto ? 360 : 0;
  const yFoto = yTexto + tp.altura + 28;
  const h = yTexto + tp.altura + 56 + (temFoto ? hFoto + 28 : 0) + 28;
  const marcas: Marca[] = [];
  const ptos: { a: number; b: number; em: number }[] = [];
  grifos.forEach((g) => {
    const r = trechoNoTexto(texto, g.trecho);
    if (!r) return;
    const alvo = g.trecho as string;
    const tempos = temposDoTexto(alvo, g.em, palavras, m.ate);
    marcas.push({ a: r[0], b: r[1], tempos });
    ptos.push({ a: r[0], b: r[1], em: g.em });
  });
  const riscoIdx = m.risco ? trechoNoTexto(texto, m.risco.trecho) : null;
  const risco: Risco | null = m.risco && riscoIdx ? { a: riscoIdx[0], b: riscoIdx[1], em: m.risco.em } : null;

  const quadros: Quadro[] = [];
  if (aproxima && ptos.length) {
    ptos.forEach((g) => {
      const bx = caixaDoTrecho(tp, g.a, g.b);
      if (!bx) return;
      const s = Math.max(1.1, Math.min(1.22, (W - 150) / bx.w));
      quadros.push({ t: g.em - 0.2, s: 1, cx: W / 2, cy: h / 2 });
      quadros.push({ t: g.em + 0.4, s, cx: PX + bx.x + bx.w / 2, cy: yTexto + bx.y + bx.h / 2 });
    });
    // a câmera volta quando o riscado aparece ou perto do fim
    const ult = quadros[quadros.length - 1];
    const volta = risco ? risco.em + 0.15 : m.ate - 0.9;
    quadros.push({ t: Math.max(ult.t + 0.5, volta), s: ult.s, cx: ult.cx, cy: ult.cy });
    quadros.push({ t: Math.max(ult.t + 1.0, volta + 0.6), s: 1, cx: W / 2, cy: h / 2 });
    quadros.sort((a, b) => a.t - b.t);
  }

  return {
    h,
    desenhar: (t) => {
      const c = cameraNoTempo(quadros, t);
      const ox = ancora(c.cx, c.s, W / 2, W);
      const oy = ancora(c.cy, c.s, h / 2, h);
      return (
        <Casca h={h}>
          <div style={{ position: "absolute", inset: 0, transformOrigin: `${ox}px ${oy}px`, transform: c.s === 1 ? undefined : `scale(${c.s})` }}>
            {manchete ? (
              <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 120, background: cor.noite, display: "flex", alignItems: "center", paddingLeft: PAD, gap: 16 }}>
                <div style={{ width: 16, height: 56, background: cor.acento, borderRadius: 4 }} />
                <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: 46, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.fonte ?? m.autor ?? "Manchete"}</span>
              </div>
            ) : (
              <>
                <Avatar tamanho={72} x={PAD} y={30} />
                <span style={{ position: "absolute", left: PAD + 72 + 22, top: 30, height: 72, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 700, fontSize: 38, color: cor.tinta }}>{m.autor ?? "Post"}</span>
                {m.fonte ? (
                  <span style={{ position: "absolute", right: PAD, top: 44, height: 44, padding: "0 20px", borderRadius: 22, background: cor.cinzaClaro, display: "flex", alignItems: "center", fontFamily: fonte, fontWeight: 700, fontSize: 26, color: cor.cinza }}>{m.fonte}</span>
                ) : null}
              </>
            )}
            <Texto tp={tp} t={t} x={PX} y={yTexto} marcas={marcas} risco={risco} />
            {temFoto ? (
              <div style={{ position: "absolute", left: PAD, top: yFoto, width: INTERNA, height: hFoto, borderRadius: 22, overflow: "hidden" }}>
                <Foto imagem={img} de={m.de - 0.2} ate={m.ate + 1} largura={INTERNA} altura={hFoto} t={t} intensidade={0.06} />
              </div>
            ) : null}
          </div>
        </Casca>
      );
    },
  };
};

// ——— foto de apoio ———

export const cartaoFoto = (m: FotoM, { plano }: Ctx): Cartao => {
  const img = imagemDoPlano(plano, m.imagem);
  const h = 700;
  const em = m.rotuloEm ?? m.de + 0.5;
  return {
    h,
    desenhar: (t) => {
      const p = m.rotulo ? prog(t, em, 0.35, desliza) : 0;
      return (
        <Casca h={h}>
          <Foto
            imagem={img}
            de={m.de - 0.2}
            ate={m.ate + 1}
            efeito={m.imagem.efeito}
            largura={W}
            altura={h}
            t={t}
            cartao={{ fundo: cor.fundoClaro, cor: "#fff", fonte }}
          />
          {m.rotulo && p > 0 ? (
            <div
              style={{
                position: "absolute",
                left: 32,
                bottom: 32,
                padding: "10px 28px 12px",
                borderRadius: 18,
                background: cor.marca,
                color: cor.tinta,
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: 66,
                lineHeight: 1.15,
                opacity: p,
                transform: `translateY(${(1 - p) * 26}px) skewX(-4deg)`,
                boxShadow: "0 8px 22px rgba(0,0,0,0.3)",
              }}
            >
              {m.rotulo}
            </div>
          ) : null}
        </Casca>
      );
    },
  };
};

export type { Momento, Grafico };
