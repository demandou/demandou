import { useMemo } from "react";
import { acaso, Datilo, limitar, preciso, prog, saindo } from "../anim";
import type { Regiao } from "../layout";
import type { Camadas as TCamadas, Material } from "../plano";
import { caber, cor, LARGURA_SANS_CAIXA_ALTA, mono, sans, sombraPapel } from "../tema";

type Peca = { pontos: [number, number][]; cx: number; cy: number; ordem: number; tom: string };

// Grade de peças do material de fora (mosaico de triângulos, pedras irregulares ou tijolos),
// só na parte da amostra que fica "coberta" (à direita da divisa diagonal).
const pecasDe = (material: Material, w: number, h: number): Peca[] => {
  const pecas: Peca[] = [];
  const divisa = (y: number) => w * (0.3 + 0.14 * (y / h));
  if (material === "tijolo" || material === "concreto") {
    const bw = 96;
    const bh = 40;
    for (let r = 0; r * bh < h; r++) {
      for (let c = -1; c * bw < w; c++) {
        const x0 = c * bw + (r % 2 ? bw / 2 : 0);
        const cx = x0 + bw / 2;
        const cy = r * bh + bh / 2;
        if (cx < divisa(cy)) continue;
        pecas.push({
          pontos: [
            [x0, r * bh],
            [x0 + bw, r * bh],
            [x0 + bw, r * bh + bh],
            [x0, r * bh + bh],
          ],
          cx,
          cy,
          ordem: 0,
          tom: "#B9876B",
        });
      }
    }
  } else {
    const lado = material === "pedra" ? 78 : 52;
    const alt = (lado * Math.sqrt(3)) / 2;
    for (let r = 0; r * alt < h; r++) {
      for (let c = -1; c * (lado / 2) < w + lado; c++) {
        const x0 = c * (lado / 2) - (r % 2 ? lado / 2 : 0);
        const y0 = r * alt;
        const paraCima = (c + r) % 2 === 0;
        const pontos: [number, number][] = paraCima
          ? [
              [x0, y0 + alt],
              [x0 + lado / 2, y0],
              [x0 + lado, y0 + alt],
            ]
          : [
              [x0, y0],
              [x0 + lado, y0],
              [x0 + lado / 2, y0 + alt],
            ];
        const cx = x0 + lado / 2;
        const cy = y0 + alt / 2;
        if (cx < divisa(cy) || cx > w + lado / 2) continue;
        const k = pecas.length;
        pecas.push({ pontos, cx, cy, ordem: 0, tom: cor.pedra[Math.floor(acaso(k * 3 + 1) * cor.pedra.length)] });
      }
    }
  }
  // a camada se espalha da direita para a esquerda, com irregularidade de trabalho manual
  const maxX = Math.max(...pecas.map((p) => p.cx), 1);
  pecas.forEach((p, k) => {
    p.ordem = limitar((maxX - p.cx) / maxX / 0.72 + (acaso(k * 7 + 2) - 0.5) * 0.16);
  });
  return pecas;
};

// Hachura da camada de dentro
const Padrao: React.FC<{ id: string; material: Material }> = ({ id, material }) => {
  if (material === "tijolo") {
    return (
      <pattern id={id} width="96" height="40" patternUnits="userSpaceOnUse">
        <rect width="96" height="40" fill="#C49A80" />
        <path d="M0 0 H96 M0 20 H96 M48 0 V20 M0 20 V40 M96 20 V40" stroke={cor.papel} strokeWidth="3" />
      </pattern>
    );
  }
  if (material === "mosaico" || material === "pedra") {
    return (
      <pattern id={id} width="52" height="45" patternUnits="userSpaceOnUse">
        <rect width="52" height="45" fill={cor.pedra[1]} />
        <path d="M0 45 L26 0 L52 45 Z" fill={cor.pedra[0]} stroke={cor.papel} strokeWidth="2.5" />
      </pattern>
    );
  }
  // concreto: cinza com hachura diagonal e agregado
  return (
    <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
      <rect width="44" height="44" fill={cor.concreto} />
      <path d="M-11 11 L11 -11 M0 44 L44 0 M33 55 L55 33" stroke={cor.tinta} strokeOpacity="0.2" strokeWidth="2.5" />
      <circle cx="9" cy="30" r="2.6" fill={cor.tinta} fillOpacity="0.28" />
      <circle cx="31" cy="12" r="1.8" fill={cor.tinta} fillOpacity="0.28" />
      <circle cx="36" cy="36" r="2.2" fill={cor.tinta} fillOpacity="0.2" />
    </pattern>
  );
};

// Etiqueta de papel colada na amostra: título (quando é dito) e nome do material datilografado
const Etiqueta: React.FC<{ t: number; titulo: string; tituloEm: number; nome: string; nomeEm: number; largura: number }> = ({ t, titulo, tituloEm, nome, nomeEm, largura }) => {
  const entra = prog(t, tituloEm - 0.05, 0.35);
  const tit = titulo.toUpperCase();
  const tam = caber(tit, largura - 44, 54, LARGURA_SANS_CAIXA_ALTA, 40);
  return (
    <div
      style={{
        width: largura,
        background: cor.cartao,
        boxShadow: `0 0 0 2.5px ${cor.tinta}, ${sombraPapel}`,
        padding: "16px 22px 18px",
        opacity: entra,
        translate: `0 ${(1 - entra) * -16}px`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tam, lineHeight: 1, color: cor.tinta }}>
        <Datilo texto={tit} em={tituloEm} t={t} semente={51} />
      </div>
      <div style={{ fontFamily: mono, fontWeight: 700, fontSize: caber(nome, largura - 44, 44, 0.64, 40), lineHeight: 1.1, color: cor.vermelho, minHeight: 44, letterSpacing: "0.04em" }}>
        <Datilo texto={nome.toUpperCase()} em={nomeEm} t={t} semente={52} />
      </div>
    </div>
  );
};

// Camadas: uma amostra do material. Primeiro aparece o de dentro (hachura, armação);
// depois o de fora se espalha por cima, peça por peça, e a última peça é colocada "à mão".
export const Camadas: React.FC<{ m: TCamadas; t: number; fim: number; regiao: Regiao }> = ({ m, t, fim, regiao }) => {
  const entra = prog(t, m.de, 0.55);
  const sai = saindo(t, fim, 0.28);
  const painel = { x: regiao.x, y: regiao.y + 18, w: regiao.w, h: Math.min(regiao.h - 30, 720) };
  const pecas = useMemo(() => pecasDe(m.fora.material, painel.w, painel.h), [m.fora.material, painel.w, painel.h]);
  const inicio = m.fora.em + 0.3;
  const fimCobre = Math.max(inicio + 0.8, m.fora.cobreAte ?? m.fora.nomeEm + 0.5);
  // a peça do destaque: a mais próxima da divisa, no meio da altura (fica vazia até ser colocada)
  const alvo = m.destaque
    ? pecas.reduce((melhor, p, k) => {
        const nota = Math.abs(p.cy - painel.h * 0.62) * 0.8 + p.cx;
        return nota < melhor.nota ? { k, nota } : melhor;
      }, { k: -1, nota: Infinity }).k
    : -1;
  const revelaDentro = prog(t, m.dentro.em, 0.7, preciso);
  const armacao = prog(t, m.dentro.nomeEm, 0.9, preciso);
  const idPadrao = `padrao-dentro-${Math.round(m.de * 100)}`;
  const armaduraX = [0.06, 0.16, 0.26, 0.36].map((f) => f * painel.w);
  const armaduraY = [0.22, 0.5, 0.78].map((f) => f * painel.h);
  const pecaAlvo = alvo >= 0 ? pecas[alvo] : null;
  const destaqueP = m.destaque ? prog(t, m.destaque.em, 0.5) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entra * (1 - sai), translate: `0 ${(1 - entra) * 60 + sai * 80}px` }}>
      <div style={{ position: "absolute", left: painel.x, top: painel.y, width: painel.w, height: painel.h, boxShadow: sombraPapel }}>
        <svg width={painel.w} height={painel.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <Padrao id={idPadrao} material={m.dentro.material} />
            <clipPath id={`${idPadrao}-clip`}>
              <rect x={0} y={0} width={painel.w * revelaDentro} height={painel.h} />
            </clipPath>
          </defs>
          <rect width={painel.w} height={painel.h} fill={cor.cartao} />
          <g clipPath={`url(#${idPadrao}-clip)`}>
            <rect width={painel.w} height={painel.h} fill={`url(#${idPadrao})`} />
          </g>
          {/* armação (ferros) desenhada quando o material de dentro é dito */}
          {m.dentro.material === "concreto"
            ? [...armaduraX.map((x) => ({ x1: x, y1: 0, x2: x, y2: painel.h })), ...armaduraY.map((y) => ({ x1: 0, y1: y, x2: painel.w, y2: y }))].map((l, k) => {
                const comp = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
                const p = limitar(armacao * 1.4 - k * 0.06);
                return (
                  <line key={k} {...l} stroke={cor.tinta} strokeWidth={7} strokeOpacity={0.78} strokeDasharray={`${comp * p} ${comp}`} />
                );
              })
            : null}
          {/* camada de fora, peça por peça */}
          {pecas.map((p, k) => {
            if (k === alvo) return null;
            const em = inicio + p.ordem * (fimCobre - inicio);
            const q = prog(t, em, 0.18);
            if (q <= 0) return null;
            const s = 0.55 + 0.45 * q;
            return (
              <polygon
                key={k}
                points={p.pontos.map(([x, y]) => `${p.cx + (x - p.cx) * s},${p.cy + (y - p.cy) * s}`).join(" ")}
                fill={p.tom}
                stroke={cor.cartao}
                strokeWidth={2.5}
                opacity={q}
              />
            );
          })}
          {pecaAlvo && m.destaque && destaqueP > 0 ? (
            <polygon
              points={pecaAlvo.pontos.map(([x, y]) => `${x},${y - (1 - destaqueP) * 90}`).join(" ")}
              fill={pecaAlvo.tom}
              stroke={cor.vermelho}
              strokeWidth={4.5}
            />
          ) : null}
          <rect width={painel.w} height={painel.h} fill="none" stroke={cor.tinta} strokeWidth={3} />
        </svg>

        <div style={{ position: "absolute", left: 24, top: 24 }}>
          <Etiqueta t={t} titulo={m.dentro.titulo} tituloEm={m.dentro.em} nome={m.dentro.nome} nomeEm={m.dentro.nomeEm} largura={Math.min(460, painel.w * 0.47)} />
        </div>
        <div style={{ position: "absolute", right: 24, top: 24 }}>
          <Etiqueta t={t} titulo={m.fora.titulo} tituloEm={m.fora.em} nome={m.fora.nome} nomeEm={m.fora.nomeEm} largura={Math.min(460, painel.w * 0.47)} />
        </div>

        {pecaAlvo && m.destaque ? (
          <div
            style={{
              position: "absolute",
              left: Math.max(24, pecaAlvo.cx - 520),
              top: Math.min(painel.h - 90, pecaAlvo.cy + 44),
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: prog(t, m.destaque.em + 0.1, 0.25),
            }}
          >
            <div
              style={{
                background: cor.vermelho,
                color: cor.cartao,
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 42,
                letterSpacing: "0.04em",
                padding: "10px 18px 8px",
                whiteSpace: "nowrap",
              }}
            >
              <Datilo texto={m.destaque.texto.toUpperCase()} em={m.destaque.em + 0.1} t={t} corCursor={cor.cartao} semente={61} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
