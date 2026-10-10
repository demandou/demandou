// Fechamento: uma etiqueta de roupa (tag de papel com furo) pendurada na peça por um cordão fino.
// A etiqueta sobe e assenta; o cordão se desenha até o pino; a chamada, o detalhe e a assinatura
// entram cada um na sua palavra.
import { prog, Sobe } from "../anim";
import type { Cta, Plano } from "../plano";
import { encaixar, largura, umaLinha } from "../medida";
import { separar, temposDoTexto } from "../palavras";
import { Falado, marcarTrecho } from "./comum";
import { dentroDaFoto, naTela, resolverPonto, type Foto } from "../pessoa";
import { caber, cor, rotulo, sans, serifa } from "../tema";
import { Pino } from "./Chamada";

const W_PADRAO = 680;

const Icone: React.FC<{ tipo: Cta["icone"]; p: number; tamanho: number }> = ({ tipo = "salvar", p, tamanho }) => {
  const traco = { fill: "none", stroke: cor.tinta, strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const d = 200;
  const desenho = { strokeDasharray: d, strokeDashoffset: d * (1 - prog(p, 0, 0.75)) };
  const cheio = prog(p, 0.65, 0.35);
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ display: "block", overflow: "visible" }}>
      {tipo === "salvar" ? (
        <>
          <path d="M13 6 H35 V42 L24 33 L13 42 Z" fill={cor.indigo} opacity={cheio} />
          <path d="M13 6 H35 V42 L24 33 L13 42 Z" {...traco} {...desenho} />
        </>
      ) : tipo === "seguir" ? (
        <>
          <circle cx={20} cy={16} r={8} {...traco} {...desenho} />
          <path d="M6 40 C6 30 12 26 20 26 C28 26 34 30 34 40" {...traco} {...desenho} />
          <path d="M40 14 V26 M34 20 H46" {...traco} stroke={cor.indigo} opacity={cheio} />
        </>
      ) : tipo === "comentar" ? (
        <>
          <path d="M8 10 H40 V32 H20 L11 40 V32 H8 Z" fill={cor.indigo} opacity={cheio * 0.9} />
          <path d="M8 10 H40 V32 H20 L11 40 V32 H8 Z" {...traco} {...desenho} />
        </>
      ) : (
        <>
          <path d="M20 28 L28 20 M17 22 L12 27 A6 6 0 0 0 21 36 L26 31 M31 26 L36 21 A6 6 0 0 0 27 12 L22 17" {...traco} {...desenho} />
        </>
      )}
    </svg>
  );
};

export const EtiquetaFinal: React.FC<{ m: Cta; t: number; plano: Plano; foto: Foto; fim: number }> = ({ m, t, plano, foto }) => {
  // `textoEm` (nome antigo): a chamada sobe inteira; `em`: cada palavra ganha tinta quando é dita
  const legado = m.textoEm !== undefined;
  // chamada longa: a etiqueta alarga um pouco
  const W = m.texto.length > 24 ? 780 : W_PADRAO;
  const textoEm = m.textoEm ?? Math.max(m.em ?? m.de, m.de + 0.1);
  const tw = W - 100 - 84;
  // a chamada: uma linha se couber; senão até 3 linhas
  const umaS = Math.min(caber(m.texto, tw, 88, 0.5, 56), umaLinha(m.texto, tw, 88, 56, { estilo: "serifa" }));
  const texto =
    largura(m.texto, umaS, "serifa") <= tw
      ? { tamanho: umaS, linhas: [m.texto], altura: umaS * 1.08 }
      : encaixar(m.texto, { largura: tw, max: 80, min: 50, linhas: 3, estilo: "serifa", entrelinha: 1.08, juntos: m.destaque });
  const det = m.detalhe ? encaixar(m.detalhe, { largura: W - 100, max: 48, min: 38, linhas: 2, estilo: "sans400", entrelinha: 1.2 }) : null;
  const nome = plano.marca.nome;
  const area = plano.marca.area;
  const comAssinatura = !!(nome || area);
  const H = Math.max(410, 86 + texto.altura + (det ? 12 + det.altura : 0) + (comAssinatura ? 38 + 66 : 0) + 44);
  const detalheEm = m.detalheEm ?? textoEm + 0.5 + (texto.linhas.length - 1) * 0.4;
  const assinaturaEm = m.assinaturaEm ?? detalheEm + 0.5;
  const chega = prog(t, m.de + 0.26, 0.7);

  // a etiqueta fica centralizada, acima da interface do app
  const x = (1080 - W) / 2;
  const y = 1600 - H - 34;
  const furo = { x: x + W / 2, y: y + 42 };
  const rot = -2.2 + (1 - chega) * -6;
  const dy = (1 - chega) * 220;
  // furo depois do giro (em volta do centro da etiqueta)
  const cx = x + W / 2;
  const cy = y + H / 2 + dy;
  const a = (rot * Math.PI) / 180;
  const fx = cx + (furo.x - cx) * Math.cos(a) - (furo.y + dy - cy) * Math.sin(a);
  const fy = cy + (furo.x - cx) * Math.sin(a) + (furo.y + dy - cy) * Math.cos(a);
  // o cordão prende na roupa só se o ponto estiver na foto e acima da etiqueta
  const pino = naTela(resolverPonto(m.ponto, plano, "gola"), foto.caixa, plano, t);
  const comCordao = dentroDaFoto(pino, foto.caixa, 30) && pino.y < y - 60;
  const cordao = prog(t, m.de + 0.45, 0.5);
  const mx = (pino.x + fx) / 2 - 30;
  const my = (pino.y + fy) / 2 + 20;
  const total = Math.hypot(fx - pino.x, fy - pino.y) * 1.08;

  const palavras = separar(texto.linhas.join(" "));
  const tempos = temposDoTexto(palavras, plano, textoEm, m.ate + 0.3);
  const destaque = marcarTrecho(palavras, m.destaque);

  return (
    <>
      {comCordao ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <path
            d={`M${pino.x} ${pino.y} Q${mx} ${my} ${fx} ${fy}`}
            fill="none"
            stroke={cor.tinta}
            strokeWidth={2.5}
            strokeDasharray={total}
            strokeDashoffset={total * (1 - cordao)}
            opacity={chega}
          />
          <Pino x={pino.x} y={pino.y} p={prog(t, m.de + 0.35, 0.6)} />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: W,
          height: H,
          translate: `0 ${dy}px`,
          rotate: `${rot}deg`,
          opacity: Math.min(1, chega * 1.6),
        }}
      >
        {/* papel da etiqueta: cantos de cima chanfrados */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 18px 30px rgba(30,24,16,0.25))" }}>
          <path d={`M44 0 H${W - 44} L${W} 44 V${H} H0 V44 Z`} fill={cor.folha} />
          <path d={`M54 12 H${W - 54} L${W - 12} 54 V${H - 12} H12 V54 Z`} fill="none" stroke="rgba(23,22,20,0.25)" strokeWidth={2} />
          <circle cx={W / 2} cy={42} r={15} fill={cor.papel} stroke={cor.tinta} strokeWidth={3.2} />
        </svg>
        <div style={{ position: "absolute", left: 50, right: 50, top: 86 }}>
          <div style={{ display: "flex", alignItems: texto.linhas.length > 1 ? "flex-start" : "center", gap: 18 }}>
            <div style={{ marginTop: texto.linhas.length > 1 ? Math.max(0, (texto.tamanho * 1.08 - 68) / 2) : 0 }}>
              <Icone tipo={m.icone} p={prog(t, textoEm - 0.05, 0.7)} tamanho={68} />
            </div>
            {legado ? (
              <div style={{ fontFamily: serifa, fontSize: texto.tamanho, lineHeight: 1.08, color: cor.tinta, whiteSpace: "nowrap" }}>
                {texto.linhas.map((l, i) => (
                  <Sobe key={i} p={prog(t, textoEm - 0.04 + i * 0.3, 0.42)}>
                    {l}
                  </Sobe>
                ))}
              </div>
            ) : (
              <Falado linhas={texto.linhas} tempos={tempos} t={t} tamanho={texto.tamanho} entrelinha={1.08} destaque={destaque} />
            )}
          </div>
          {det ? (
            <div style={{ fontFamily: sans, fontWeight: 400, fontSize: det.tamanho, lineHeight: 1.2, color: cor.grafite, marginTop: 12 }}>
              <Sobe p={prog(t, detalheEm - 0.04, 0.42)}>
                {det.linhas.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </Sobe>
            </div>
          ) : null}
          {comAssinatura ? (
            <>
              <div style={{ height: 2, background: "rgba(23,22,20,0.2)", margin: "20px 0 16px", width: `${prog(t, assinaturaEm - 0.1, 0.5) * 100}%` }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, opacity: prog(t, assinaturaEm - 0.05, 0.45) }}>
                {nome ? <div style={{ fontFamily: serifa, fontStyle: "italic", fontSize: 54, color: cor.tinta, whiteSpace: "nowrap" }}>{nome}</div> : null}
                {area ? <div style={{ ...rotulo, fontSize: 34, letterSpacing: "0.12em", color: cor.indigo, whiteSpace: "nowrap" }}>{area}</div> : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};
