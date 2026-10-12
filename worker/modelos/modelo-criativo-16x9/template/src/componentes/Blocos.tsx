// Os 11 blocos universais na linguagem do Criativo, em vidro. No quadro deitado (16:9), o `palco` é o
// quadro da esquerda (a pessoa na moldura da direita) ou, nas placas curtas, a faixa do peito.
// Placas fumê com texto branco (manchete, listas, número, pergunta), cartões claros (comparação,
// gráfico, definição), ✓ e números na cor da marca. Cada item entra na palavra que o nomeia.
import { Easing, interpolate } from "remotion";
import { formatar, prog, salto, soco, temposDoTexto } from "../anim";
import { imagemDoPlano } from "../motor/imagem";
import type { Comparacao as TComparacao, Definicao as TDefinicao, Destaque as TDestaque, Frase as TFrase, Grafico as TGrafico, Numero as TNumero, Passos, Pergunta as TPergunta, Topicos } from "../plano";
import { cor, fonte, vidroEscuro } from "../tema";
import { FotoNoCartao, Placa, type PropsPalco, type Ret } from "./Assinatura";
import { caber, Cartao, estiloFonte, Icone, Marca, Texto } from "./Vidro";

const entrada = (t: number, em: number, imediato: boolean, dur = 0.4) => (imediato ? 1 : prog(t, em, dur, salto));

const Chip: React.FC<{ texto: string; fundo: string; tinta: string; tamanho?: number }> = ({ texto, fundo, tinta, tamanho = 26 }) => (
  <div style={{ display: "inline-block", padding: `${tamanho * 0.34}px ${tamanho * 0.8}px`, borderRadius: tamanho, background: fundo, color: tinta, fontFamily: fonte, fontWeight: 700, fontSize: tamanho, letterSpacing: "0.08em", lineHeight: 1.1, whiteSpace: "nowrap", textTransform: "uppercase" }}>
    {texto}
  </div>
);

// ——— frase (e abertura): a placa da manchete, palavra por palavra ———
export const Frase: React.FC<PropsPalco & { m: TFrase }> = ({ t, plano, m, fim, palco, tons, imediato, max = 84 }) => (
  <Placa t={t} plano={plano} texto={m.texto} em={m.em ?? m.de} ate={fim} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} ret={palco} tons={tons} imediato={imediato} modo="aparece" max={max} />
);

// ——— topicos / passos: lista de vidro com ✓ (ou número ligado por um traço) ———
export const Lista: React.FC<PropsPalco & { m: Topicos | Passos }> = ({ t, plano, m, palco, tons, imediato }) => {
  const n = m.itens.length;
  const titulo = m.titulo ? caber(m.titulo, palco.w - 100, 50, 34, 1, 800) : null;
  const hTitulo = titulo ? titulo.tamanho * 1.25 + 26 : 0;
  const disponivel = palco.h - 2 * 40 - hTitulo;
  const passo = Math.min(150, disponivel / n);
  const S = Math.min(54, passo * 0.42);
  const medidas = m.itens.map((it) => caber(it.texto, palco.w - 100 - 110, S, 30, it.detalhe ? 1 : 2, 800));
  const altura = Math.round(2 * 40 + hTitulo + passo * n);
  const y = palco.y + (palco.h - altura) / 2;
  const p = entrada(t, m.itens[0].em - 0.3, imediato);
  const atual = m.itens.reduce((a, it, i) => (t >= it.em - 0.02 ? i : a), -1);
  const ordem = m.tipo === "passos";
  return (
    <Cartao x={palco.x} y={y} w={palco.w} h={altura} tipo="escuro" giro={[(1 - p) * 12, 0]} escala={0.92 + 0.08 * p} opacidade={Math.min(1, p * 2.5)}>
      {titulo ? (
        <div style={{ position: "absolute", left: 50, top: 36, ...estiloFonte(800, titulo.tamanho, cor.branco) }}>
          {titulo.linhas[0]}
          <div style={{ width: 70, height: 6, borderRadius: 3, background: tons.destaque, marginTop: 10 }} />
        </div>
      ) : null}
      {ordem && atual > 0 ? (
        <div style={{ position: "absolute", left: 50 + 36, top: 40 + hTitulo + passo / 2, width: 6, height: passo * atual, background: tons.destaque, borderRadius: 3 }} />
      ) : null}
      {m.itens.map((it, i) => {
        if (t < it.em - 0.02) return null;
        const pi = prog(t, it.em - 0.02, 0.34, salto);
        const mm = medidas[i];
        const cy = 40 + hTitulo + passo * i + passo / 2;
        return (
          <div key={i} style={{ position: "absolute", left: 50, top: cy - passo / 2, height: passo, right: 50, display: "flex", alignItems: "center", gap: 30, opacity: Math.min(1, pi * 3) * (i < atual ? 0.78 : 1), transform: pi >= 1 ? undefined : `translateX(${(1 - pi) * -40}px)` }}>
            {ordem ? (
              <div style={{ width: 78, height: 78, borderRadius: 39, background: tons.destaque, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: fonte, fontWeight: 800, fontSize: 40, color: tons.sobreDestaque }}>{i + 1}</div>
            ) : (
              <Marca tamanho={78} tons={tons} p={pi} />
            )}
            <div>
              {mm.linhas.map((l, k) => (
                <div key={k} style={estiloFonte(800, mm.tamanho)}>
                  {l}
                </div>
              ))}
              {it.detalhe ? <div style={{ ...estiloFonte(600, Math.max(28, mm.tamanho * 0.6), cor.brancoSuave), marginTop: 4 }}>{it.detalhe}</div> : null}
            </div>
          </div>
        );
      })}
    </Cartao>
  );
};

// ——— numero: o número enorme conta numa placa fumê; o rótulo assenta embaixo ———
// A placa tem 400 px de altura (300 com foto); no peito do quadro deitado, a altura da faixa, e o
// número encolhe para caber. `maxN` = o maior corpo que o número pode ter ali (o layout só deixa no
// peito se ele continuar enorme; senão o número vai para o quadro, onde chega a 210 px).
export const medirNumero = (m: TNumero, palco: Ret, comFoto = !!m.imagem) => {
  const casas = m.casas ?? 0;
  const final = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const hP = comFoto ? 300 : Math.min(400, palco.h);
  const placa: Ret = comFoto ? { x: palco.x + 28, y: palco.y + palco.h - 330, w: palco.w - 56, h: 300 } : { x: palco.x, y: palco.y + (palco.h - hP) / 2, w: palco.w, h: hP };
  const rot = caber(m.rotulo, placa.w - 80, 52, 32, 2, 700);
  const hRot = rot.linhas.length * rot.tamanho * 1.12;
  const hChip = m.ilustrativo ? 49 : 0;
  const livre = Math.floor(placa.h - 2 * 28 - 10 - hRot - hChip);
  const maxN = Math.min(comFoto ? 150 : 210, livre);
  const N = caber(final, placa.w - 80, Math.max(70, maxN), 70, 1, 800);
  return { placa, N, rot, final, maxN };
};

export const Numero: React.FC<PropsPalco & { m: TNumero }> = ({ t, plano, m, fim, palco, tons, imediato }) => {
  const img = m.imagem ? imagemDoPlano(plano, m.imagem) : null;
  const conta = interpolate(t, [m.em, m.em + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const casas = m.casas ?? 0;
  const v = conta >= 1 ? m.valor : Math.floor(m.valor * conta * 10 ** casas) / 10 ** casas;
  const texto = `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const { placa, N, rot } = medirNumero(m, palco, !!img);
  const p = entrada(t, m.em - 0.12, imediato);
  const pR = prog(t, (m.rotuloEm ?? m.em + 0.3) - 0.05, 0.3);
  const golpe = soco(t, m.em + 0.45, 0.3);
  return (
    <>
      {img ? <FotoNoCartao t={t} plano={plano} imagem={m.imagem!} ret={{ x: palco.x, y: palco.y, w: palco.w, h: palco.h - 140 }} de={m.de} ate={fim} imediato={imediato} /> : null}
      <Cartao x={placa.x} y={placa.y} w={placa.w} h={placa.h} tipo="escuro" giro={[(1 - p) * 12, 0]} escala={(0.9 + 0.1 * p) * (1 + 0.03 * golpe)} opacidade={Math.min(1, p * 2.5)}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ ...estiloFonte(800, N.tamanho, tons.destaque), lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.035em" }}>{texto}</div>
          <div style={{ opacity: pR, transform: pR >= 1 ? undefined : `translateY(${(1 - pR) * 16}px)`, textAlign: "center" }}>
            {rot.linhas.map((l, i) => (
              <div key={i} style={estiloFonte(700, rot.tamanho)}>
                {l}
              </div>
            ))}
          </div>
          {m.ilustrativo ? <Chip texto="ilustrativo" fundo="rgba(255,255,255,0.16)" tinta={cor.branco} tamanho={22} /> : null}
        </div>
      </Cartao>
    </>
  );
};

// ——— comparacao: dois cartões claros lado a lado; o vencedor ganha a borda da marca e o ✓ ———
export const Comparacao: React.FC<PropsPalco & { m: TComparacao }> = ({ t, plano, m, fim, palco, tons, imediato }) => {
  const gap = 34;
  const w = (palco.w - gap) / 2;
  const temTitulo = !!m.titulo;
  const yC = palco.y + (temTitulo ? 96 : 20);
  const h = palco.h - (temTitulo ? 96 : 20) - 10;
  const venc = m.vencedor;
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const pV = venc !== undefined ? prog(t, vEm, 0.35) : 0;
  const modo = m.modo ?? "contra";
  return (
    <>
      {temTitulo ? (
        <div style={{ position: "absolute", left: palco.x, width: palco.w, top: palco.y + 8, textAlign: "center", ...estiloFonte(800, caber(m.titulo as string, palco.w, 56, 34, 1).tamanho), textShadow: "0 3px 16px rgba(0,0,0,0.5)" }}>
          {m.titulo}
        </div>
      ) : null}
      {m.lados.map((l, i) => {
        const pi = entrada(t, l.em - 0.08, imediato && l.em <= m.de + 0.05);
        if (pi <= 0) {
          return <div key={i} style={{ position: "absolute", left: palco.x + i * (w + gap), top: yC, width: w, height: h, borderRadius: 34, border: "3px dashed rgba(255,255,255,0.55)" }} />;
        }
        const img = l.imagem ? imagemDoPlano(plano, l.imagem) : null;
        const ganhou = venc === i;
        const perdeu = venc !== undefined && venc !== i;
        const txt = caber(l.texto, w - 60, 56, 30, img ? 2 : 4, 800);
        const marca = modo === "errado-certo" ? (i === 0 ? "errado" : "certo") : ganhou && pV > 0 ? "certo" : null;
        return (
          <div key={i} style={{ opacity: perdeu ? 1 - 0.4 * pV : 1, filter: perdeu && pV > 0 ? `grayscale(${pV})` : undefined }}>
            <Cartao
              x={palco.x + i * (w + gap)}
              y={yC}
              w={w}
              h={h}
              tipo="claro"
              giro={[(1 - pi) * 12, (i === 0 ? 5 : -5) * (1 - pi)]}
              escala={(0.9 + 0.1 * pi) * (ganhou ? 1 + 0.03 * pV : 1)}
              opacidade={Math.min(1, pi * 2.5)}
              dentro={ganhou ? { boxShadow: `inset 0 0 0 ${5 * pV}px ${tons.destaque}, 0 30px 70px rgba(0,0,0,0.34)` } : undefined}
            >
              {img && l.imagem ? (
                <FotoNoCartao t={t} plano={plano} imagem={l.imagem} ret={{ x: 0, y: 0, w, h: h * 0.52 }} de={l.em} ate={fim} imediato />
              ) : null}
              <div style={{ position: "absolute", left: 30, right: 30, top: img ? h * 0.56 : 40, bottom: 30, display: "flex", flexDirection: "column", gap: 18, justifyContent: img ? "flex-start" : "center" }}>
                <Chip texto={l.rotulo} fundo={ganhou ? tons.destaque : "rgba(11,16,32,0.08)"} tinta={ganhou ? tons.sobreDestaque : cor.tintaSuave} tamanho={24} />
                <div>
                  {txt.linhas.map((x, k) => (
                    <div key={k} style={estiloFonte(800, txt.tamanho, cor.tinta)}>
                      {x}
                    </div>
                  ))}
                </div>
              </div>
              {marca ? (
                <div style={{ position: "absolute", right: 22, top: img ? h * 0.52 - 44 : 22 }}>
                  <Marca tamanho={80} tons={tons} tipo={marca} p={modo === "errado-certo" ? pi : pV} />
                </div>
              ) : null}
            </Cartao>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: palco.x + palco.w / 2 - 46, top: yC + h / 2 - 46, width: 92, height: 92, borderRadius: 46, background: cor.tinta, border: "4px solid rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", opacity: prog(t, m.lados[1].em - 0.05, 0.2), fontFamily: fonte, fontWeight: 800, fontSize: 32, color: cor.branco }}>
        {modo === "contra" ? "VS" : null}
        {modo !== "contra" ? (
          <svg width={46} height={46} viewBox="0 0 24 24" style={{ position: "absolute" }}>
            <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke={cor.branco} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
    </>
  );
};

// ——— grafico: cartão claro com barras, linha ou rosca na cor da marca ———
export const Grafico: React.FC<PropsPalco & { m: TGrafico }> = ({ t, m, palco, tons, imediato }) => {
  const ret = { x: palco.x, y: palco.y + 10, w: palco.w, h: palco.h - 20 };
  const p = entrada(t, (m.dados?.[0]?.em ?? m.tendenciaEm ?? m.de) - 0.3, imediato);
  const W = ret.w - 100;
  const H = ret.h - (m.titulo ? 200 : 140);
  const top = m.titulo ? 120 : 60;
  const dados = m.dados ?? [];
  const max = Math.max(1, ...dados.map((d) => d.valor));
  const fmt = (v: number) => `${formatar(v, Number.isInteger(v) ? 0 : 1)}${m.unidade ?? ""}`;
  let corpo: React.ReactNode = null;
  if (dados.length && m.forma === "barras") {
    const bw = Math.min(150, (W - (dados.length - 1) * 30) / dados.length);
    const totalW = dados.length * bw + (dados.length - 1) * 30;
    corpo = dados.map((d, i) => {
      const pi = prog(t, d.em - 0.02, 0.5);
      const bh = (d.valor / max) * (H - 110) * pi;
      const x = 50 + (W - totalW) / 2 + i * (bw + 30);
      const maior = d.valor === max;
      return (
        <div key={i}>
          <div style={{ position: "absolute", left: x, top: top + H - 60 - bh, width: bw, height: bh, borderRadius: 16, background: maior ? tons.destaque : "rgba(11,16,32,0.18)" }} />
          {pi > 0.3 ? <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: top + H - 60 - bh - 56, textAlign: "center", ...estiloFonte(800, 40, cor.tinta) }}>{fmt(d.valor)}</div> : null}
          <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: top + H - 46, textAlign: "center", ...estiloFonte(700, 28, cor.tintaSuave), whiteSpace: "normal" }}>{d.rotulo}</div>
        </div>
      );
    });
  } else if (dados.length && m.forma === "pizza") {
    const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const R = Math.min(W, H) / 2 - 40;
    let acc = 0;
    const circ = 2 * Math.PI * R;
    corpo = (
      <svg width={ret.w} height={ret.h} style={{ position: "absolute", left: 0, top: 0 }}>
        {dados.map((d, i) => {
          const frac = d.valor / total;
          const pi = prog(t, d.em - 0.02, 0.5);
          const el = (
            <circle key={i} cx={ret.w / 2} cy={top + H / 2} r={R} fill="none" stroke={i === 0 ? tons.destaque : `rgba(11,16,32,${0.12 + 0.1 * i})`} strokeWidth={70} strokeDasharray={`${circ * frac * pi} ${circ}`} strokeDashoffset={-circ * acc} transform={`rotate(-90 ${ret.w / 2} ${top + H / 2})`} />
          );
          acc += frac;
          return el;
        })}
      </svg>
    );
  } else {
    // linha (com dados) ou tendência ilustrativa
    const pts = dados.length
      ? dados.map((d, i) => ({ x: 50 + (i / Math.max(1, dados.length - 1)) * W, y: top + H - 60 - (d.valor / max) * (H - 120), em: d.em }))
      : Array.from({ length: 7 }, (_, i) => {
          const f = i / 6;
          const v = m.tendencia === "cai" ? 0.85 - f * 0.65 + Math.sin(i * 1.7) * 0.05 : m.tendencia === "oscila" ? 0.5 + Math.sin(i * 1.4) * 0.25 : 0.2 + f * 0.65 + Math.sin(i * 1.7) * 0.05;
          return { x: 50 + f * W, y: top + H - 60 - v * (H - 120), em: (m.tendenciaEm ?? m.de) + f * 0.9 };
        });
    const fim = dados.length ? dados[dados.length - 1].em + 0.4 : (m.tendenciaEm ?? m.de) + 1.1;
    const ini = dados.length ? dados[0].em : m.tendenciaEm ?? m.de;
    const pl = prog(t, ini, Math.max(0.4, fim - ini));
    const d = pts.map((q, i) => `${i ? "L" : "M"}${q.x},${q.y}`).join(" ");
    corpo = (
      <>
        <svg width={ret.w} height={ret.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={d} fill="none" stroke={tons.destaque} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - pl)} />
          {pts.map((q, i) => (t >= q.em ? <circle key={i} cx={q.x} cy={q.y} r={13} fill={cor.branco} stroke={tons.destaque} strokeWidth={6} /> : null))}
        </svg>
        {dados.map((dd, i) => (t >= dd.em ? <div key={i} style={{ position: "absolute", left: pts[i].x - 90, width: 180, top: pts[i].y - 66, textAlign: "center", ...estiloFonte(800, 36, cor.tinta) }}>{fmt(dd.valor)}</div> : null))}
      </>
    );
  }
  return (
    <Cartao x={ret.x} y={ret.y} w={ret.w} h={ret.h} tipo="claro" giro={[(1 - p) * 12, 0]} escala={0.92 + 0.08 * p} opacidade={Math.min(1, p * 2.5)}>
      {m.titulo ? <div style={{ position: "absolute", left: 50, top: 40, ...estiloFonte(800, caber(m.titulo, ret.w - 100, 50, 32, 1).tamanho, cor.tinta) }}>{m.titulo}</div> : null}
      {corpo}
      {m.ilustrativo || !dados.length ? (
        <div style={{ position: "absolute", right: 30, top: 34 }}>
          <Chip texto="ilustrativo" fundo="rgba(11,16,32,0.08)" tinta={cor.tintaSuave} tamanho={22} />
        </div>
      ) : null}
    </Cartao>
  );
};

// ——— destaque: um adesivo grande na cor da marca (chave) ou fumê com ⚠ (alerta) ———
// `total`: o adesivo e, com `detalhe`, a pílula embaixo dele (o layout mede se cabe no peito).
export const medirDestaque = (m: TDestaque, largura: number, max = 120) => {
  const tx = caber(m.texto, largura - 120, max, 54, 2, 800);
  const h = Math.round(tx.linhas.length * tx.tamanho * 1.1 + 100);
  return { tx, h, total: h + (m.detalhe ? 116 : 0) };
};

export const Destaque: React.FC<PropsPalco & { m: TDestaque }> = ({ t, m, palco, tons, imediato, max = 120 }) => {
  const alerta = m.nivel === "alerta";
  const { tx, h, total } = medirDestaque(m, palco.w, max);
  const y = palco.y + (palco.h - total) / 2;
  const p = imediato ? 1 : prog(t, m.em - 0.06, 0.3, salto);
  const pD = m.detalhe ? prog(t, (m.detalheEm ?? m.em + 0.5) - 0.05, 0.3, salto) : 0;
  const fundo = alerta ? undefined : tons.destaque;
  return (
    <>
      <div style={{ position: "absolute", left: palco.x, top: y, width: palco.w, height: h, transform: `rotate(-2deg) scale(${1.25 - 0.25 * p})`, opacity: Math.min(1, p * 3) }}>
        {alerta ? (
          <Cartao x={0} y={0} w={palco.w} h={h} tipo="escuro">
            <div style={{ position: "absolute", left: 36, top: h / 2 - 44 }}>
              <Icone nome="alerta" tamanho={88} cor={cor.alerta} traco={2.4} />
            </div>
          </Cartao>
        ) : (
          <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: fundo, boxShadow: "0 26px 60px rgba(0,0,0,0.36), inset 0 2px 0 rgba(255,255,255,0.35)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingLeft: alerta ? 110 : 0 }}>
          {tx.linhas.map((l, i) => (
            <div key={i} style={{ ...estiloFonte(800, tx.tamanho, alerta ? cor.branco : tons.sobreDestaque), lineHeight: 1.06, textTransform: "uppercase" }}>
              {l}
            </div>
          ))}
        </div>
      </div>
      {m.detalhe && pD > 0 ? (
        <div style={{ position: "absolute", left: palco.x, width: palco.w, top: y + h + 34, display: "flex", justifyContent: "center", opacity: Math.min(1, pD * 3) }}>
          <div style={{ ...vidroEscuro, borderRadius: 28, padding: "18px 34px", ...estiloFonte(700, caber(m.detalhe, palco.w - 80, 40, 28, 1, 700).tamanho) }}>{m.detalhe}</div>
        </div>
      ) : null}
    </>
  );
};

// ——— definicao: cartão claro, o termo grande com o traço da marca, o significado sobe na fala ———
export const Definicao: React.FC<PropsPalco & { m: TDefinicao }> = ({ t, plano, m, fim, palco, tons, imediato }) => {
  const termo = caber(m.termo, palco.w - 120, 96, 48, 1, 800);
  const sig = caber(m.significado, palco.w - 120, 50, 32, 4, 700);
  const h = Math.round(80 + termo.tamanho * 1.2 + 40 + sig.linhas.length * sig.tamanho * 1.15 + 60);
  const y = palco.y + (palco.h - h) / 2;
  const p = entrada(t, m.em - 0.1, imediato);
  const pT = prog(t, m.em + 0.15, 0.4);
  const tempos = temposDoTexto(sig.linhas.join(" "), m.significadoEm, plano.palavras, fim);
  return (
    <Cartao x={palco.x} y={y} w={palco.w} h={h} tipo="claro" giro={[(1 - p) * 12, 0]} escala={0.92 + 0.08 * p} opacidade={Math.min(1, p * 2.5)}>
      <div style={{ position: "absolute", left: 60, top: 64 }}>
        <div style={estiloFonte(800, termo.tamanho, cor.tinta)}>{termo.linhas[0]}</div>
        <div style={{ height: 10, width: `${pT * 100}%`, background: tons.destaque, borderRadius: 5, marginTop: 8 }} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 64 + termo.tamanho * 1.2 + 48 }}>
        <Texto t={t} linhas={sig.linhas} tamanho={sig.tamanho} peso={700} cor={cor.tintaSuave} alinhar="left" tempos={tempos} />
      </div>
    </Cartao>
  );
};

// ——— pergunta: placa fumê com a pergunta; as opções entram como pílulas claras ———
export const Pergunta: React.FC<PropsPalco & { m: TPergunta }> = ({ t, plano, m, fim, palco, tons, imediato }) => {
  const q = caber(m.texto, palco.w - 120, 70, 40, 3, 800);
  const ops = m.opcoes ?? [];
  const hQ = Math.round(q.linhas.length * q.tamanho * 1.12 + 90);
  const hOps = ops.length ? ops.length * 104 + 20 : 0;
  const y = palco.y + (palco.h - hQ - hOps) / 2;
  const em = m.em ?? m.de;
  const p = entrada(t, em - 0.12, imediato);
  const tempos = temposDoTexto(q.linhas.join(" "), em, plano.palavras, fim);
  const atual = ops.reduce((a, o, i) => (t >= o.em - 0.02 ? i : a), -1);
  return (
    <>
      <Cartao x={palco.x} y={y} w={palco.w} h={hQ} tipo="escuro" giro={[(1 - p) * 12, 0]} escala={0.92 + 0.08 * p} opacidade={Math.min(1, p * 2.5)}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 60px" }}>
          <Texto t={t} linhas={q.linhas} tamanho={q.tamanho} tempos={tempos} />
        </div>
        {!ops.length ? (
          <div style={{ position: "absolute", right: 26, top: 22, transform: `rotate(${Math.sin((t - em) * 3) * 10}deg)`, fontFamily: fonte, fontWeight: 800, fontSize: 64, color: tons.destaque, lineHeight: 1 }}>?</div>
        ) : null}
      </Cartao>
      {ops.map((o, i) => {
        if (t < o.em - 0.02) return null;
        const pi = prog(t, o.em - 0.02, 0.3, salto);
        const tx = caber(o.texto, palco.w - 200, 44, 28, 1, 700);
        return (
          <div key={i} style={{ position: "absolute", left: palco.x + 40, width: palco.w - 80, top: y + hQ + 30 + i * 104, height: 84, borderRadius: 42, background: i === atual ? tons.destaque : "rgba(255,255,255,0.92)", boxShadow: "0 12px 28px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 22, padding: "0 30px", opacity: Math.min(1, pi * 3), transform: pi >= 1 ? undefined : `scale(${0.8 + 0.2 * pi})` }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: i === atual ? tons.sobreDestaque : cor.tinta, color: i === atual ? tons.destaque : cor.branco, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 26 }}>{String.fromCharCode(65 + i)}</div>
            <span style={estiloFonte(700, tx.tamanho, i === atual ? tons.sobreDestaque : cor.tinta)}>{tx.linhas[0]}</span>
          </div>
        );
      })}
    </>
  );
};
