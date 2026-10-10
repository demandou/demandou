import { Audio, Video } from "@remotion/media";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { prog, troca, useRotulos } from "../anim";
import type { Janela } from "../layout";
import { largura as medir } from "../medida";
import { type Caixa, enquadrar, type Rosto, rostoNaTela } from "../motor/caixa";
import type { Plano, Pronuncia } from "../plano";
import { cor, formatar, rotulo, sans } from "../tema";
import { partesDaLeitura, silabasDe, temposDasSilabas } from "./Ficha";
import { type Alvo, Ponto } from "./Ponto";

// O momento-assinatura: a palavra repetida em câmera lenta com a voz da própria pessoa.
// - o vídeo da pessoa anda na mesma velocidade lenta do áudio (a boca bate com o som);
// - uma lupa redonda fica na boca e segue o rosto pelo rastreio (rostoNaTela);
// - a onda da voz daquela palavra corre embaixo, com as sílabas;
// - em cima, a palavra escrita com o ponto pulando sílaba por sílaba.
// Vai dentro de uma <Sequence> que começa em `janela.em`: o vídeo lento começa ali.

// a boca fica ~0,35 da largura do rosto abaixo do centro do rosto
const BOCA = 0.35;
const AUMENTO = 2.1;

export const CameraLenta: React.FC<{ m: Pronuncia; j: Janela; plano: Plano; caixa: Caixa }> = ({ m, j, plano, caixa }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Rt = useRotulos();
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const rosto = plano.rosto as Rosto;
  const tl = frame / fps;
  const t = j.em + tl;
  // o trecho repetido começa num quadro inteiro do vídeo; vt = o instante do vídeo na tela agora
  const corte = Math.round(j.a * fps);
  const vt = corte / fps + tl * j.ritmo;
  const dur = j.fim - j.em;
  const e = enquadrar(caixa, rosto, videoAltura, vt);
  const r = rostoNaTela(caixa, rosto, videoAltura, vt);
  const boca = { x: r.x, y: r.y + BOCA * r.largura };
  const R = Math.min(250, Math.max(150, r.largura * 0.6));

  // a lupa abre logo depois do corte e fecha antes da volta
  const abre = prog(tl, 0.04, 0.24, troca);
  const fecha = prog(tl, dur - 0.16, 0.14);
  const lupa = abre * (1 - fecha);
  // o véu, a palavra e a onda só entram quando a pessoa já cobriu a tela (sem dupla exposição
  // com a ficha que fica embaixo) e saem antes da volta
  const cobre = prog(tl, 0.12, 0.12) * (1 - prog(tl, dur - 0.12, 0.12));

  // a palavra escrita, compacta, com o ponto nas sílabas faladas
  const sil = silabasDe(m);
  const tamanho = 86;
  const lSep = 0.46 * tamanho;
  const ls = sil.map((s) => medir(s.texto, tamanho, { peso: 800 }));
  const totalL = ls.reduce((a, b) => a + b, 0) + lSep * (sil.length - 1);
  const escalaTopo = Math.min(1, 900 / totalL);
  let x0 = (1080 - totalL * escalaTopo) / 2;
  const xs = ls.map((l) => {
    const atual = x0;
    x0 += (l + lSep) * escalaTopo;
    return atual;
  });
  const tempos = temposDasSilabas(m, j);
  const faladas = sil.map((s, i) => ({ s, i })).filter((o) => !o.s.muda);
  const yTopo = 168;
  const alvos: Alvo[] = faladas.map((o, k) => ({ t: tempos[k], x: xs[o.i] + (ls[o.i] * escalaTopo) / 2, y: tamanho * escalaTopo * 0.05 }));
  let atual = -1;
  tempos.forEach((tt, k) => {
    if (t >= tt - 0.02) atual = k;
  });

  // a onda: barras espelhadas; o que já tocou fica coral
  const W = 880;
  const N = 60;
  const onda = j.onda?.length ? j.onda : null;
  const barras = Array.from({ length: N }, (_, i) => {
    if (!onda) {
      // sem a medida da ferramenta: um contorno por sílaba
      const pos = i / (N - 1);
      return 0.25 + 0.6 * Math.abs(Math.sin(pos * Math.PI * Math.max(1, faladas.length)));
    }
    const a = Math.floor((i / N) * onda.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / N) * onda.length));
    return Math.max(...onda.slice(a, b));
  });
  const progresso = Math.min(1, Math.max(0, (vt - j.a) / (j.b - j.a)));
  const partes = partesDaLeitura(m.leitura);
  const rotulosOnda = partes.length === faladas.length ? partes : faladas.map((o) => o.s.texto);
  // limites das sílabas na onda (frações de [a, b])
  const limites = [0, ...tempos.slice(1).map((tt) => ((tt - j.em) * j.ritmo) / (j.b - j.a)), 1];
  const yOnda = 1388;

  return (
    <>
      {/* a pessoa em câmera lenta (muda: a voz lenta vem do áudio recortado) */}
      <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, overflow: "hidden", borderRadius: caixa.raio ?? 0 }}>
        <Video
          src={staticFile(plano.video)}
          muted
          trimBefore={corte}
          playbackRate={j.ritmo}
          objectFit="fill"
          style={{ position: "absolute", left: e.esquerda, top: e.topo, width: e.lv, height: e.av, filter: "contrast(1.04) saturate(0.9)" }}
        />
      </div>
      {/* véu violeta em cima e embaixo, para a palavra e a onda lerem sobre o vídeo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: cobre,
          background: `linear-gradient(to bottom, rgba(29,21,80,0.86) 0px, rgba(29,21,80,0) 330px, rgba(29,21,80,0) 1180px, rgba(29,21,80,0.9) 1560px, rgba(29,21,80,0.96) 1920px)`,
        }}
      />

      {/* a lupa na boca, seguindo o rosto */}
      {lupa > 0.01 ? (
        <div style={{ position: "absolute", left: boca.x - R, top: boca.y - R, width: R * 2, height: R * 2, opacity: Math.min(1, lupa * 1.6), scale: `${0.55 + 0.45 * lupa}` }}>
          <svg width={R * 2} height={R * 2} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <line
              x1={R + R * 0.74}
              y1={R + R * 0.74}
              x2={R + (R + 120) * 0.74}
              y2={R + (R + 120) * 0.74}
              stroke={cor.tinta}
              strokeWidth={30}
              strokeLinecap="round"
            />
            <line
              x1={R + (R + 40) * 0.74}
              y1={R + (R + 40) * 0.74}
              x2={R + (R + 110) * 0.74}
              y2={R + (R + 110) * 0.74}
              stroke={cor.coral}
              strokeWidth={10}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", background: cor.fundo }}>
            <Video
              src={staticFile(plano.video)}
              muted
              trimBefore={corte}
              playbackRate={j.ritmo}
              objectFit="fill"
              style={{
                position: "absolute",
                left: (caixa.x + e.esquerda - boca.x) * AUMENTO + R,
                top: (caixa.y + e.topo - boca.y) * AUMENTO + R,
                width: e.lv * AUMENTO,
                height: e.av * AUMENTO,
                filter: "contrast(1.06) saturate(0.95)",
              }}
            />
          </div>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `10px solid ${cor.tinta}`, boxShadow: `inset 0 0 0 4px ${cor.coral}, 0 16px 40px rgba(10,6,40,0.45)` }} />
        </div>
      ) : null}

      {/* em cima: câmera lenta + a palavra com o ponto nas sílabas */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, opacity: cobre, display: "flex", justifyContent: "center", gap: 18 }}>
        <div style={{ ...rotulo, color: cor.tinta }}>{Rt.lenta}</div>
        <div style={{ ...rotulo, color: cor.coral }}>{formatar(j.ritmo, 1)}×</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: yTopo, width: 1080, height: tamanho * 1.2, opacity: cobre }}>
        {sil.map((s, i) => {
          const k = faladas.findIndex((o) => o.i === i);
          const aceso = k >= 0 && k === atual;
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: xs[i],
                  top: 0,
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: tamanho * escalaTopo,
                  lineHeight: 1.12,
                  letterSpacing: "-0.02em",
                  whiteSpace: "nowrap",
                  color: s.muda ? cor.apagado : aceso ? cor.tinta : "rgba(251,246,238,0.55)",
                  textDecoration: s.muda ? `line-through ${cor.coral} 5px` : undefined,
                }}
              >
                {s.texto}
              </div>
              {i < sil.length - 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: xs[i] + ls[i] * escalaTopo,
                    width: lSep * escalaTopo,
                    textAlign: "center",
                    fontFamily: sans,
                    fontWeight: 800,
                    fontSize: tamanho * escalaTopo,
                    lineHeight: 1.12,
                    color: cor.lilas,
                    opacity: 0.5,
                  }}
                >
                  ·
                </div>
              ) : null}
            </div>
          );
        })}
        <Ponto alvos={alvos} t={t} raio={11} />
      </div>

      {/* embaixo: a onda da voz, com as sílabas */}
      <div style={{ position: "absolute", left: (1080 - W) / 2, top: yOnda, width: W, height: 300, opacity: cobre }}>
        {barras.map((v, i) => {
          const h = 10 + v * 150;
          const tocou = i / N <= progresso;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (i * W) / N + 2,
                width: W / N - 6,
                top: 85 - h / 2,
                height: h,
                borderRadius: 6,
                background: tocou ? cor.coral : "rgba(251,246,238,0.42)",
              }}
            />
          );
        })}
        {/* cabeça de leitura */}
        <div style={{ position: "absolute", left: progresso * W - 2, top: -6, width: 4, height: 182, borderRadius: 2, background: cor.tinta }} />
        {/* limites e nomes das sílabas */}
        {rotulosOnda.map((parte, k) => {
          const a = limites[k] ?? 0;
          const b = limites[k + 1] ?? 1;
          const aceso = k === atual;
          return (
            <div key={k}>
              {k > 0 ? <div style={{ position: "absolute", left: a * W - 1, top: 176, width: 2, height: 30, background: cor.linha }} /> : null}
              <div
                style={{
                  position: "absolute",
                  left: a * W,
                  width: (b - a) * W,
                  top: 196,
                  textAlign: "center",
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: 46,
                  whiteSpace: "nowrap",
                  color: aceso ? cor.coral : "rgba(251,246,238,0.6)",
                }}
              >
                {parte}
              </div>
            </div>
          );
        })}
      </div>

      {/* a voz lenta: o trecho recortado pela ferramenta (ou, sem ele, o próprio vídeo mais devagar) */}
      {j.arquivo ? (
        <Audio src={staticFile(j.arquivo)} />
      ) : (
        <Audio src={staticFile(plano.video)} trimBefore={corte} playbackRate={j.ritmo} />
      )}
    </>
  );
};
