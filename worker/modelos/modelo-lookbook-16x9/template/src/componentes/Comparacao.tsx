// Comparação: dois cartões de catálogo lado a lado, cada um com uma amostra de tecido em cima
// (como "couro ou metal" do cartão de produto), o rótulo em caixa alta e o texto; no meio, "×"
// (contra) ou uma seta fina (antes → depois, errado → certo). O lado que vence ganha o índigo de
// jeans, o sublinhado e o pino; o errado é riscado em vinho.
import { prog, saida, Sobe } from "../anim";
import { encaixar, quebrar } from "../medida";
import type { Area } from "../pessoa";
import type { Comparacao } from "../plano";
import { CARTELA, cor, rotulo, serifa, PAGINA } from "../tema";
import { Amostra } from "./Amostra";
import { Pino } from "./Chamada";
import { quando } from "./comum";
import { alturaTitulo, Titulo } from "./Lista";

const PAD = 32;
const VAO = 112;
const H_AMOSTRA = 104;

export const CartoesLadoALado: React.FC<{ m: Comparacao; t: number; fim: number; area: Area; id: string }> = ({ m, t, fim, area, id }) => {
  const fora = saida(t, fim);
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const th = alturaTitulo(m.titulo, area.w);
  const gap = th ? 30 : 0;
  const cw = (area.w - VAO) / 2;
  const tw = cw - PAD * 2;
  const disponivel = area.h - th - gap;
  // corpo único para os dois lados (até 3 linhas cada); a amostra cresce para o cartão ocupar a área
  let s = 72;
  let ls: string[][] = [];
  let rs: { tamanho: number; linhas: string[] }[] = [];
  let texto = 0;
  for (; s >= 40; s -= 2) {
    ls = m.lados.map((l) => quebrar(l.texto, tw, s, { estilo: "serifa" }));
    rs = m.lados.map((l) => encaixar(l.rotulo, { largura: tw, max: 34, min: 30, linhas: 2, estilo: "sans500", espacamento: 0.18, caixaAlta: true }));
    const rh = Math.max(...rs.map((r) => r.linhas.length * r.tamanho * 1.1));
    texto = 22 + rh + 12 + Math.max(...ls.map((l) => l.length)) * s * 1.12 + 10;
    if (ls.every((l) => l.length <= 3) && PAD * 2 + H_AMOSTRA + texto <= disponivel) break;
  }
  const altura = Math.min(disponivel, PAD * 2 + Math.min(360, Math.max(H_AMOSTRA, disponivel * 0.9 - PAD * 2 - texto)) + texto);
  const hAmostra = Math.max(H_AMOSTRA, altura - PAD * 2 - texto);
  const topo = area.y + Math.max(0, (disponivel - altura) / 2);
  const y0 = topo + th + gap;
  const ems = m.lados.map((l) => quando(l.em, m.de));
  const vEm = vencedor !== undefined ? (m.vencedorEm !== undefined ? quando(m.vencedorEm, m.de) : ems[1] + 0.45) : 1e6;
  const pv = prog(t, vEm, 0.45);
  const conector = prog(t, Math.min(ems[1], ems[0] + 0.4) - 0.1, 0.4);
  const cy = y0 + PAD + hAmostra / 2;

  const corDoLado = (i: number) => {
    if (modo === "errado-certo") return i === 0 ? { cor: "#45464A", tecido: "la" as const } : { cor: "#34496F", tecido: "jeans" as const };
    if (vencedor === i) return { cor: "#34496F", tecido: "jeans" as const };
    return CARTELA[i];
  };

  return (
    <>
      {m.titulo ? (
        <div style={{ position: "absolute", left: area.x, top: topo, width: area.w, opacity: 1 - fora }}>
          <Titulo texto={m.titulo} p={prog(t, m.de + 0.3, 0.45)} largura={area.w} />
        </div>
      ) : null}
      {m.lados.map((l, i) => {
        const x = area.x + i * (cw + VAO);
        const entra = prog(t, m.de + 0.1 + i * 0.08, 0.6);
        const p = prog(t, ems[i] - 0.04, 0.45);
        const amostra = corDoLado(i);
        const perde = vencedor !== undefined && vencedor !== i ? pv : 0;
        const ganha = vencedor === i ? pv : 0;
        const riscado = modo === "errado-certo" && i === 0 ? prog(t, Math.max(ems[1], ems[0] + 0.3) + 0.1, 0.45) : 0;
        const r = rs[i];
        const rh = Math.max(...rs.map((q) => q.linhas.length * q.tamanho * 1.1));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y0,
              width: cw,
              height: altura,
              background: cor.folha,
              boxShadow: "0 22px 48px rgba(30,24,16,0.20), 0 2px 6px rgba(30,24,16,0.10)",
              opacity: Math.min(1, entra * 1.6) * (1 - fora),
              translate: `${(i === 0 ? -1 : 1) * ((1 - entra) * 90 + fora * 50)}px 0`,
            }}
          >
            <div style={{ position: "absolute", left: PAD, top: PAD }}>
              <Amostra id={`${id}-lado-${i}`} w={tw} h={hAmostra} base={amostra.cor} tecido={amostra.tecido} p={prog(t, ems[i] - 0.04, 0.55)} />
            </div>
            <div style={{ position: "absolute", left: PAD, top: PAD + hAmostra + 22, width: tw, ...rotulo, fontSize: r.tamanho, lineHeight: 1.1, color: p > 0.5 ? (ganha > 0.5 ? cor.indigo : cor.grafite) : cor.lapis }}>
              {r.linhas.map((ln, k) => (
                <div key={k}>{ln}</div>
              ))}
            </div>
            <div style={{ position: "absolute", left: PAD, top: PAD + hAmostra + 22 + rh + 12, width: tw, fontFamily: serifa, fontSize: s, lineHeight: 1.12, color: perde > 0.5 ? cor.grafite : cor.tinta, opacity: 1 - perde * 0.35, whiteSpace: "nowrap" }}>
              {/* espera a lápis */}
              <div style={{ position: "absolute", left: 0, top: s * 0.7, width: tw * 0.7, borderTop: `3px dashed ${cor.lapis}`, opacity: 1 - prog(p, 0, 0.4) }} />
              {ls[i].map((ln, k) => (
                <div key={k} style={{ position: "relative" }}>
                  <Sobe p={p}>{ln}</Sobe>
                  {riscado > 0 ? (
                    <div style={{ position: "absolute", left: -4, top: "52%", height: Math.max(4, s * 0.07), width: `calc(${riscado * 100}% + 8px)`, maxWidth: tw + 8, background: cor.vinho }} />
                  ) : null}
                </div>
              ))}
              {ganha > 0 ? <div style={{ height: 6, width: `${ganha * Math.min(100, 30 + ls[i][ls[i].length - 1].length * 6)}%`, background: cor.indigo, marginTop: 6 }} /> : null}
            </div>
          </div>
        );
      })}
      {/* o que liga os dois lados */}
      <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: (1 - fora) * Math.min(1, conector * 2) }}>
        {modo === "contra" ? (
          <text x={area.x + cw + VAO / 2} y={cy + 30} textAnchor="middle" fontFamily={serifa} fontStyle="italic" fontSize={96} fill={cor.grafite}>
            ×
          </text>
        ) : (
          <g stroke={cor.tinta} strokeWidth={4} strokeLinecap="round" fill="none">
            <line x1={area.x + cw + 16} x2={area.x + cw + 16 + (VAO - 32) * conector} y1={cy} y2={cy} />
            <path d={`M${area.x + cw + VAO - 34} ${cy - 16} L${area.x + cw + VAO - 16} ${cy} L${area.x + cw + VAO - 34} ${cy + 16}`} opacity={prog(conector, 0.7, 0.3)} />
          </g>
        )}
      </svg>
      {/* o pino do lado que vence, cravado no canto do cartão */}
      {vencedor !== undefined && pv > 0 ? (
        <svg width={PAGINA.w} height={PAGINA.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - fora }}>
          <Pino x={area.x + vencedor * (cw + VAO) + cw - 30} y={y0 + 4} p={pv} />
        </svg>
      ) : null}
    </>
  );
};
