// Blocos universais de texto na linguagem da Órbita: abertura, frase, pergunta, destaque, definição
// e fechamento. Tudo no quadro da explicação (o palco, ao lado da moldura), sobre as estrelas, palavra por palavra na fala; cada um com
// a sua peça de espaço (um sistema em órbita, um Sol que acende, uma cota, um corpo por opção).
import React from "react";
import * as THREE from "three";
import type { BlocoDoEspaco, PropsDoBloco } from "./registro";
import type { Abertura, Cta, Definicao, Destaque, Frase, Pergunta } from "../plano";
import { COR, EASE_OUT, SORA, brilhoNaSuperficie, inOut, prog } from "../tema";
import { encaixar, larguraTexto } from "../medida";
import { deslocamento } from "../espaco/deslocamento";
import { projetar } from "../espaco/camera";
import { CORPOS_PADRAO, Rotulo, TextoNaFala, corpoNaTela, luzDaEsquerda, luzDeCima } from "./pecas";
import { Icone } from "./Virada";

const K0 = 179.15; // px por unidade em z = 0 com a câmera em z = 20
const Estatico: React.FC<{ d: { dx: number; dy: number }; children: React.ReactNode; style?: React.CSSProperties }> = ({ d, children, style }) => (
  <div style={{ position: "absolute", inset: 0, transform: `translate(${d.dx.toFixed(2)}px, ${d.dy.toFixed(2)}px)`, ...style }}>{children}</div>
);
const bump = (t: number, c: number, l: number) => Math.max(0, 1 - Math.abs(t - c) / l);

// um planeta pequeno em órbita em volta de um ponto da tela (passa atrás e na frente)
const emOrbita = (rx: number, ry: number, giro: number, vel = 1.1, fase = 0) => (t: number) => {
  const a = t * vel + fase;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  const c = Math.cos(giro);
  const s = Math.sin(giro);
  return new THREE.Vector3((x * c - y * s) / K0, -(x * s + y * c) / K0, Math.sin(a) * 0.9);
};
const ElipseDaOrbita: React.FC<{ x: number; y: number; rx: number; ry: number; giro: number; a: number }> = ({ x, y, rx, ry, giro, a }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: a }}>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke="rgba(255,240,228,0.32)" strokeWidth={2} transform={`rotate(${(giro * 180) / Math.PI} ${x} ${y})`} />
  </svg>
);
const Corona: React.FC<{ x: number; y: number; r: number; a: number; cor?: "sol" | "alerta" }> = ({ x, y, r, a, cor = "sol" }) => {
  const c = cor === "alerta" ? ["255,106,77", "230,80,60", "200,60,50"] : ["244,160,118", "226,128,90", "217,119,87"];
  return a > 0.01 ? (
    <div style={{ ...brilhoNaSuperficie(x, y, `rgba(${c[0]},0.55) ${r * 0.96}px, rgba(${c[1]},0.22) ${r * 1.2}px, rgba(${c[2]},0.08) ${r * 1.9}px, rgba(${c[2]},0) ${r * 4}px`), opacity: a }} />
  ) : null;
};

// ——— abertura: um pequeno sistema (Sol + planeta em órbita) em cima do título ———
const AB = { x: 540, y: 250, r: 44, rx: 132, ry: 36, giro: -0.32 };
const abertura: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Abertura;
    const vis = (t: number) => prog(t, m.de + 0.05, m.de + 0.55);
    return [
      corpoNaTela(e, "ab-sol", "sol", AB.x, AB.y, AB.r, (t) => ({ vis: vis(t), off: 0, flash: 0 })),
      corpoNaTela(e, "ab-pl", "rochoso", AB.x, AB.y, 13, (t) => ({ vis: vis(t), off: 0, flash: 0 }), { cor: "#CFE0FF", mover: emOrbita(AB.rx, AB.ry, AB.giro), luz: daSol(e) }),
    ];
  },
  Fundo: ({ plano, e, t }) => {
    const p = projetar(plano, e.base.clone().add(new THREE.Vector3((AB.x - 540) / K0, (960 - AB.y) / K0, 0)), t);
    const k = p.k / K0;
    const a = prog(t, e.m.de + 0.05, e.m.de + 0.55);
    return (
      <>
        <Corona x={p.x} y={p.y} r={AB.r * k} a={a} />
        <ElipseDaOrbita x={p.x} y={p.y} rx={AB.rx * k} ry={AB.ry * k} giro={AB.giro} a={a} />
      </>
    );
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Abertura;
    const d = deslocamento(plano, e, t);
    const em = m.em ?? m.de;
    const ult = plano.palavras.filter((p) => p.em >= em && p.em < m.ate).slice(-1)[0];
    const traco = prog(t, (ult?.ate ?? em + 1) + 0.05, (ult?.ate ?? em + 1) + 0.6, EASE_OUT);
    return (
      <Estatico d={d}>
        <div style={{ position: "absolute", left: 64, width: 952, top: 560, transform: "translateY(-50%)" }}>
          <TextoNaFala plano={plano} texto={m.texto} em={em} ate={m.ate} t={t} largura={952} max={92} min={54} linhas={3} destaque={m.destaque} />
          <div style={{ margin: "26px auto 0", height: 4, width: `${traco * 46}%`, borderRadius: 2, background: `linear-gradient(90deg, ${COR.sol}00, ${COR.sol} 30%, ${COR.quente} 50%, ${COR.sol} 70%, ${COR.sol}00)`, boxShadow: `0 0 16px ${COR.sol}88` }} />
        </div>
      </Estatico>
    );
  },
  sons: (m) => [{ t: (m as Abertura).em ?? m.de, src: "sfx/tom.wav", vol: 0.16 }],
};
function daSol(e: PropsDoBloco["e"]) {
  return e.base.clone().add(new THREE.Vector3((AB.x - 540) / K0, (960 - AB.y) / K0, 0));
}

// ——— frase: a fala palavra por palavra, o destaque no laranja do Sol, o risco de luz ———
const frase: BlocoDoEspaco = {
  Frente: ({ plano, e, t }) => {
    const m = e.m as Frase;
    const d = deslocamento(plano, e, t);
    const em = m.em ?? m.de;
    const a = prog(t, m.de, m.de + 0.45);
    return (
      <Estatico d={d}>
        <div style={{ position: "absolute", left: 0, width: 1080, top: 176, display: "flex", justifyContent: "center", opacity: a, transform: `rotate(${(t - m.de) * 6}deg)` }}>
          <Icone tipo="orbita" tamanho={70} />
        </div>
        <div style={{ position: "absolute", left: 64, width: 952, top: 500, transform: "translateY(-50%)" }}>
          <TextoNaFala plano={plano} texto={m.texto} em={em} ate={m.ate} t={t} largura={952} max={80} min={50} linhas={4} peso={700} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} altura={1.12} />
        </div>
      </Estatico>
    );
  },
  sons: (m) => ((m as Frase).riscoEm !== undefined ? [{ t: (m as Frase).riscoEm as number, src: "sfx/tom2.wav", vol: 0.16 }] : []),
};

// ——— pergunta: o "?" em órbita, a pergunta e um corpo para cada opção ———
const POS_OPCAO = (n: number, i: number) => ({ x: 64 + ((i + 0.5) * 952) / n, y: 610 });
const pergunta: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Pergunta;
    const ops = m.opcoes ?? [];
    return ops.map((o, i) => {
      const P = POS_OPCAO(ops.length, i);
      const b = CORPOS_PADRAO[i % CORPOS_PADRAO.length];
      return corpoNaTela(e, `pg${i}`, b.corpo, P.x, P.y, 34, (t) => ({ vis: prog(t, o.em - 0.1, o.em + 0.4), off: 0, flash: 0 }), { cor: b.cor, anel: b.anel, luz: luzDeCima(e) });
    });
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Pergunta;
    const d = deslocamento(plano, e, t);
    const em = m.em ?? m.de;
    const ops = m.opcoes ?? [];
    const a = prog(t, m.de, m.de + 0.45);
    const yTexto = ops.length ? 400 : 470;
    return (
      <Estatico d={d}>
        <div style={{ position: "absolute", left: 0, width: 1080, top: 160, display: "flex", justifyContent: "center", opacity: a, transform: `scale(${0.8 + 0.2 * a})` }}>
          <svg width={110} height={110} viewBox="-55 -55 110 110">
            <ellipse rx={50} ry={17} fill="none" stroke={COR.sol} strokeWidth={4} transform={`rotate(${-20 + (t - m.de) * 8})`} />
            <text y={18} textAnchor="middle" fontFamily={SORA} fontWeight={800} fontSize={54} fill={COR.branco}>
              ?
            </text>
          </svg>
        </div>
        <div style={{ position: "absolute", left: 64, width: 952, top: yTexto, transform: "translateY(-50%)" }}>
          <TextoNaFala plano={plano} texto={m.texto} em={em} ate={m.ate} t={t} largura={952} max={78} min={48} linhas={3} />
        </div>
        {ops.map((o, i) => {
          const P = POS_OPCAO(ops.length, i);
          const q = prog(t, o.em - 0.05, o.em + 0.35);
          const w = 952 / ops.length - 24;
          const { tamanho, linhas } = encaixar(o.texto, w, 36, 26, 2, 700);
          return (
            <div key={i} style={{ position: "absolute", left: P.x - w / 2, width: w, top: P.y + 48, textAlign: "center", opacity: q, transform: `translateY(${(1 - q) * 14}px)`, fontFamily: SORA, fontWeight: 700, fontSize: tamanho, lineHeight: 1.1, color: COR.branco }}>
              {linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          );
        })}
      </Estatico>
    );
  },
  sons: (m) => ((m as Pergunta).opcoes ?? []).map((o, i) => ({ t: o.em, src: i % 2 ? "sfx/tom2.wav" : "sfx/tom.wav", vol: 0.15 })),
};

// ——— destaque: um Sol acende (ou uma estrela vermelha pulsa, no alerta) e a palavra bate ———
const DS = { x: 540, y: 262, r: 64 };
const destaque: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Destaque;
    const alerta = m.nivel === "alerta";
    return [
      corpoNaTela(e, "ds", alerta ? "estrela" : "sol", DS.x, DS.y, DS.r, (t) => ({
        vis: prog(t, m.de, m.de + 0.4),
        off: alerta ? 0 : 1 - prog(t, m.em - 0.06, m.em + 0.5, EASE_OUT),
        flash: 0.3 * bump(t, m.em + 0.1, 0.3),
        inchar: alerta ? 1 + 0.06 * Math.sin((t - m.em) * 7) * prog(t, m.em, m.em + 0.3) : 1,
      }), alerta ? { cor: COR.alerta } : {}),
    ];
  },
  Fundo: ({ plano, e, t }) => {
    const m = e.m as Destaque;
    const p = projetar(plano, e.base.clone().add(new THREE.Vector3((DS.x - 540) / K0, (960 - DS.y) / K0, 0)), t);
    return <Corona x={p.x} y={p.y} r={DS.r * (p.k / K0)} a={prog(t, m.em - 0.05, m.em + 0.5)} cor={m.nivel === "alerta" ? "alerta" : "sol"} />;
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Destaque;
    const d = deslocamento(plano, e, t);
    const alerta = m.nivel === "alerta";
    const cor = alerta ? COR.alerta : COR.branco;
    const { tamanho, linhas } = encaixar(m.texto, 952, 124, 64, 2, 800);
    const q = prog(t, m.em - 0.08, m.em + 0.35, EASE_OUT);
    const traco = prog(t, m.em + 0.15, m.em + 0.7, EASE_OUT);
    const det = m.detalhe ? prog(t, (m.detalheEm ?? m.em + 0.6) - 0.05, (m.detalheEm ?? m.em + 0.6) + 0.35) : 0;
    const larg = Math.max(...linhas.map((l) => larguraTexto(l, tamanho, 800)));
    return (
      <Estatico d={d}>
        <div style={{ position: "absolute", left: 64, width: 952, top: 520, transform: `translateY(-50%) scale(${1 + (1 - q) * 0.06})`, textAlign: "center", opacity: q, filter: q < 1 ? `blur(${(1 - q) * 10}px)` : undefined }}>
          <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: tamanho, lineHeight: 1.04, letterSpacing: "-0.025em", color: cor, textShadow: "0 6px 30px rgba(0,0,0,0.55)" }}>
            {linhas.map((l, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
          <div style={{ margin: "18px auto 0", height: 5, width: Math.min(952, larg) * traco, borderRadius: 3, background: alerta ? COR.alerta : COR.sol, boxShadow: `0 0 18px ${alerta ? COR.alerta : COR.sol}` }} />
          {m.detalhe ? (
            <div style={{ marginTop: 22, opacity: det, transform: `translateY(${(1 - det) * 14}px)`, fontFamily: SORA, fontWeight: 500, fontSize: encaixar(m.detalhe, 952, 38, 28, 2, 500).tamanho, color: COR.mudo }}>{m.detalhe}</div>
          ) : null}
        </div>
      </Estatico>
    );
  },
  sons: (m) => [{ t: (m as Destaque).em - 0.05, src: (m as Destaque).nivel === "alerta" ? "sfx/tom2.wav" : "sfx/numero.wav", vol: 0.18 }],
};

// ——— definição: o termo grande, a cota de medida embaixo dele e o significado linha a linha ———
const definicao: BlocoDoEspaco = {
  Frente: ({ plano, e, t }) => {
    const m = e.m as Definicao;
    const d = deslocamento(plano, e, t);
    const { tamanho, linhas } = encaixar(m.termo, 952, 104, 56, 2, 800);
    const q = prog(t, m.em - 0.08, m.em + 0.35, EASE_OUT);
    const larg = Math.min(952, Math.max(...linhas.map((l) => larguraTexto(l, tamanho, 800))));
    const cota = prog(t, m.em + 0.15, m.em + 0.75, EASE_OUT);
    const r = prog(t, m.de, m.de + 0.4);
    const hTermo = linhas.length * tamanho * 1.04;
    const yTermo = 250;
    const yCota = yTermo + hTermo + 26;
    return (
      <Estatico d={d}>
        <Rotulo texto="definição" style={{ position: "absolute", left: 0, width: 1080, top: 176, textAlign: "center", opacity: r }} />
        <div style={{ position: "absolute", left: 64, width: 952, top: yTermo, textAlign: "center", opacity: q, transform: q < 1 ? `translateY(${(1 - q) * 20}px)` : undefined, filter: q < 1 ? `blur(${(1 - q) * 8}px)` : undefined, fontFamily: SORA, fontWeight: 800, fontSize: tamanho, lineHeight: 1.04, letterSpacing: "-0.025em", color: COR.branco, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>
          {linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {cota > 0 ? (
            <>
              <line x1={540 - (larg / 2) * cota} y1={yCota} x2={540 + (larg / 2) * cota} y2={yCota} stroke={COR.linha} strokeWidth={2.5} />
              {cota > 0.98 ? (
                <>
                  <line x1={540 - larg / 2} y1={yCota - 14} x2={540 - larg / 2} y2={yCota + 14} stroke={COR.linha} strokeWidth={2.5} />
                  <line x1={540 + larg / 2} y1={yCota - 14} x2={540 + larg / 2} y2={yCota + 14} stroke={COR.linha} strokeWidth={2.5} />
                </>
              ) : null}
              <circle cx={540 - larg / 2 + larg * ((t * 0.35) % 1)} cy={yCota} r={4} fill={COR.quente} opacity={cota} />
            </>
          ) : null}
        </svg>
        <div style={{ position: "absolute", left: 64, width: 952, top: yCota + 40 }}>
          <TextoNaFala plano={plano} texto={m.significado} em={m.significadoEm} ate={m.ate} t={t} largura={952} max={46} min={32} linhas={4} peso={600} cor="rgba(255,248,242,0.92)" altura={1.22} />
        </div>
      </Estatico>
    );
  },
  sons: (m) => [{ t: (m as Definicao).em, src: "sfx/tom.wav", vol: 0.15 }],
};

// ——— fechamento: o ícone da ação no centro de uma órbita, com um planeta girando em volta ———
const CT = { x: 540, y: 300, r: 62, rx: 170, ry: 48, giro: -0.2 };
const IconeDaAcao: React.FC<{ icone?: Cta["icone"] }> = ({ icone = "salvar" }) => {
  const s = { fill: "none", stroke: COR.branco, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (icone === "seguir")
    return (
      <g {...s}>
        <circle cx={-6} cy={-12} r={13} />
        <path d="M -28 24 C -26 8 14 8 16 24" />
        <path d="M 26 -8 V 12 M 16 2 H 36" />
      </g>
    );
  if (icone === "comentar")
    return (
      <g {...s}>
        <path d="M -26 -20 H 26 A 8 8 0 0 1 34 -12 V 10 A 8 8 0 0 1 26 18 H -2 L -16 30 V 18 H -26 A 8 8 0 0 1 -34 10 V -12 A 8 8 0 0 1 -26 -20 Z" />
      </g>
    );
  if (icone === "link")
    return (
      <g {...s}>
        <path d="M -4 8 L 8 -4" />
        <path d="M -10 -2 L -18 6 A 10 10 0 0 0 -4 20 L 4 12" />
        <path d="M 10 2 L 18 -6 A 10 10 0 0 0 4 -20 L -4 -12" />
      </g>
    );
  return (
    <g {...s}>
      <path d="M -16 -26 H 16 V 28 L 0 16 L -16 28 Z" />
    </g>
  );
};
const cta: BlocoDoEspaco = {
  corpos: (_p, e) => {
    const m = e.m as Cta;
    return [
      corpoNaTela(e, "ct-pl", "planeta", CT.x, CT.y, 18, (t) => ({ vis: prog(t, m.de + 0.1, m.de + 0.6), off: 0, flash: 0 }), { cor: COR.solClaro, mover: emOrbita(CT.rx, CT.ry, CT.giro, 1.4, 1.2), luz: luzDaEsquerda(e) }),
    ];
  },
  Fundo: ({ plano, e, t }) => {
    const p = projetar(plano, e.base.clone().add(new THREE.Vector3((CT.x - 540) / K0, (960 - CT.y) / K0, 0)), t);
    const k = p.k / K0;
    return <ElipseDaOrbita x={p.x} y={p.y} rx={CT.rx * k} ry={CT.ry * k} giro={CT.giro} a={prog(t, e.m.de + 0.1, e.m.de + 0.6)} />;
  },
  Frente: ({ plano, e, t }) => {
    const m = e.m as Cta;
    const d = deslocamento(plano, e, t);
    const em = m.em ?? m.de;
    const a = prog(t, m.de + 0.05, m.de + 0.5, EASE_OUT);
    const pulso = 1 + 0.06 * inOut(t, em + 0.6, em + 0.9, 0.2, 0.3);
    return (
      <Estatico d={d}>
        <div style={{ position: "absolute", left: CT.x - CT.r, top: CT.y - CT.r, width: CT.r * 2, height: CT.r * 2, borderRadius: "50%", background: `radial-gradient(circle at 38% 34%, ${COR.solClaro}, ${COR.sol} 62%, #B85E42)`, boxShadow: `0 0 40px ${COR.sol}88`, transform: `scale(${(0.6 + 0.4 * a) * pulso})`, opacity: a, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={92} height={92} viewBox="-46 -46 92 92">
            <IconeDaAcao icone={m.icone} />
          </svg>
        </div>
        <div style={{ position: "absolute", left: 64, width: 952, top: 560, transform: "translateY(-50%)" }}>
          <TextoNaFala plano={plano} texto={m.texto} em={em} ate={m.ate} t={t} largura={952} max={72} min={46} linhas={3} destaque={m.destaque} />
        </div>
      </Estatico>
    );
  },
  sons: (m) => [{ t: (m as Cta).em ?? m.de, src: "sfx/tom.wav", vol: 0.16 }],
};

export const BLOCOS_DE_TEXTO: Record<string, BlocoDoEspaco> = { abertura, frase, pergunta, destaque, definicao, cta };
