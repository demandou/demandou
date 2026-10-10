import { limitar, prog, saindo } from "../anim";
import { DESENHOS } from "../desenhos/biblioteca";
import type { Areas } from "../layout";
import type { Anatomia as AnatomiaT, Palavra } from "../plano";
import { cor } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { Rotulo } from "./Rotulo";
import { Veredito } from "./Veredito";

// Desenho médico a traço em volta da lupa: se desenha na fala, age (escova, fio, gengiva que inflama),
// recebe rótulos com linha-guia e, se pedido, uma lupa de detalhe que aumenta um ponto.
export const Anatomia: React.FC<{ m: AnatomiaT; t: number; fim: number; areas: Areas; palavras: Palavra[] }> = ({
  m,
  t,
  fim,
  areas,
  palavras,
}) => {
  const def = DESENHOS[m.desenho];
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const corpo = areas.corpo;
  const alturaVeredito = m.veredito ? 110 : 0;
  const reserva = def.reservaVeredito === false ? 0 : alturaVeredito;
  const area = { x: corpo.x, y: corpo.y, w: corpo.w - def.reservaDireita, h: corpo.h - reserva };
  const s = Math.min(area.w / def.caixa.w, area.h / def.caixa.h);
  const x0 = area.x + (area.w - def.caixa.w * s) / 2;
  const y0 = area.y + (area.h - def.caixa.h * s) / 2;
  const naTela = (x: number, y: number) => ({ x: x0 + (x - def.caixa.x) * s, y: y0 + (y - def.caixa.y) * s });
  const base = `translate(${x0 - def.caixa.x * s} ${y0 - def.caixa.y * s}) scale(${s})`;
  // o desenho começa a se traçar assim que a pessoa começa a ir para a lupa (entra junto com ela)
  const de = m.desenhoEm ?? m.de;
  const acoes = m.acoes ?? [];
  const id = `an${Math.round(m.de * 100)}`;
  const Comp = def.Componente;

  // lupa de detalhe
  const zoomAlvo = m.aproximar ? def.alvos[m.aproximar.alvo] : undefined;
  const lupa = m.aproximar && zoomAlvo ? prog(t, m.aproximar.em, 0.55) : 0;
  const R = 176;
  const centroLupa = zoomAlvo ? naTela(zoomAlvo.x, zoomAlvo.y) : { x: 0, y: 0 };
  const z = m.aproximar?.zoom ?? 2.2;

  return (
    <>
      <Cabecalho
        area={areas.cabecalho}
        numero={m.numero}
        titulo={m.titulo}
        enfase={m.enfase}
        palavras={palavras}
        de={m.de}
        ate={m.ate}
        t={t}
        fim={fim}
        maxLinhas={3}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        <g transform={base}>
          <Comp t={t} de={de} acoes={acoes} id={id} />
        </g>

        {lupa > 0 ? (
          <g>
            <clipPath id={`${id}-clip`}>
              <circle cx={centroLupa.x} cy={centroLupa.y} r={R * lupa} />
            </clipPath>
            <g clipPath={`url(#${id}-clip)`}>
              <rect x={centroLupa.x - R} y={centroLupa.y - R} width={2 * R} height={2 * R} fill={cor.branco} />
              <g transform={`translate(${centroLupa.x} ${centroLupa.y}) scale(${1 + (z - 1) * lupa}) translate(${-centroLupa.x} ${-centroLupa.y})`}>
                <g transform={base}>
                  <Comp t={t} de={de} acoes={acoes} id={`${id}l`} />
                </g>
              </g>
            </g>
            <circle cx={centroLupa.x} cy={centroLupa.y} r={R * lupa + 2} fill="none" stroke={cor.azul} strokeWidth={4.5} />
            <circle cx={centroLupa.x} cy={centroLupa.y} r={R * lupa + 14} fill="none" stroke={cor.azul} strokeOpacity={0.25} strokeWidth={2} />
          </g>
        ) : null}

        {(m.rotulos ?? []).map((r, i) => {
          const a = def.moverAlvo?.(r.alvo, t, acoes) ?? def.alvos[r.alvo];
          if (!a) return null;
          let p = naTela(a.x, a.y);
          // rótulo do ponto aumentado: sai da borda da lupa de detalhe
          if (lupa > 0 && m.aproximar?.alvo === r.alvo) {
            const n = Math.hypot(a.dx, a.dy) || 1;
            p = { x: p.x + (a.dx / n) * (R + 14) * lupa, y: p.y + (a.dy / n) * (R + 14) * lupa };
          }
          return (
            <Rotulo
              key={i}
              x={p.x}
              y={p.y}
              dx={a.dx * limitar(0.55 + 0.45 * (1 - lupa))}
              dy={a.dy * limitar(0.55 + 0.45 * (1 - lupa))}
              texto={r.texto}
              em={r.em}
              t={t}
              erro={r.erro}
            />
          );
        })}
      </svg>
      {m.veredito ? (
        <Veredito v={m.veredito} t={t} saida={sai} x={corpo.x} y={corpo.y + corpo.h - alturaVeredito + 20} w={corpo.w} />
      ) : null}
    </>
  );
};
