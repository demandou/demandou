import { Datilo, preciso, prog, saindo } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import type { Local as TLocal } from "../plano";
import { caber, cor, LARGURA_SANS_CAIXA_ALTA, mono, rotulo, sans, sombraPapel } from "../tema";

// Local: o nome do lugar em destaque e uma carta quadriculada onde duas linhas vermelhas
// (latitude e longitude) se cruzam no ponto; as coordenadas são datilografadas junto das linhas.
// No quadro deitado (layout canto) o nome fica ao lado da foto, a carta ocupa a faixa de baixo, larga,
// e o detalhe datilografado fica à direita da carta (colunas, não uma pilha alta).
export const Local: React.FC<{ m: TLocal; t: number; fim: number; regiao: Regiao }> = ({ m, t, fim, regiao }) => {
  const sai = saindo(t, fim, 0.28);
  const entra = prog(t, m.de, 0.5);
  const c = m.coordenadas;
  const nome = c.local.toUpperCase();
  const maior = nome.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), "");
  const { cabeca, corpo } = partesDaRegiao("canto", regiao, 0);
  const tamNome = caber(maior, cabeca.w - 40, 96, LARGURA_SANS_CAIXA_ALTA, 56);
  const carta = { x: corpo.x, y: corpo.y, w: m.detalhe ? Math.round(corpo.w * 0.6) : corpo.w, h: Math.max(240, corpo.h - 10) };
  const detalhe = { x: carta.x + carta.w + 44, w: corpo.w - carta.w - 44 };
  const alvo = { x: carta.w * 0.58, y: carta.h * 0.5 };
  const grade = prog(t, m.de + 0.1, 0.8, preciso);
  const horizontal = prog(t, c.em, 0.55, preciso);
  const vertical = prog(t, c.em + 0.25, 0.55, preciso);
  const trava = prog(t, c.em + 0.75, 0.35);
  const passo = 108;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entra * (1 - sai), translate: `${-sai * 60}px ${(1 - entra) * 30}px` }}>
      <div style={{ position: "absolute", left: cabeca.x + 16, top: cabeca.y + 34, width: cabeca.w - 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ ...rotulo, fontSize: 30, color: cor.vermelho }}>{m.rotulo ?? "Local"}</div>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamNome, lineHeight: 1.02, color: cor.tinta }}>
          <Datilo texto={nome} em={m.de + 0.15} t={t} semente={101} />
        </div>
      </div>

      <div style={{ position: "absolute", left: carta.x, top: carta.y, width: carta.w, height: carta.h, background: cor.cartao, boxShadow: sombraPapel, overflow: "hidden" }}>
        <svg width={carta.w} height={carta.h} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: Math.ceil(carta.w / passo) }, (_, k) => (
            <line key={`v${k}`} x1={(k + 0.5) * passo} x2={(k + 0.5) * passo} y1={0} y2={carta.h * grade} stroke={cor.tinta} strokeOpacity={0.14} strokeWidth={2} />
          ))}
          {Array.from({ length: Math.ceil(carta.h / passo) }, (_, k) => (
            <line key={`h${k}`} y1={(k + 0.5) * passo} y2={(k + 0.5) * passo} x1={0} x2={carta.w * grade} stroke={cor.tinta} strokeOpacity={0.14} strokeWidth={2} />
          ))}
          <line x1={0} x2={carta.w * horizontal} y1={alvo.y} y2={alvo.y} stroke={cor.vermelho} strokeWidth={4} />
          <line x1={alvo.x} x2={alvo.x} y1={0} y2={carta.h * vertical} stroke={cor.vermelho} strokeWidth={4} />
          <circle cx={alvo.x} cy={alvo.y} r={60 - 38 * trava} fill="none" stroke={cor.vermelho} strokeWidth={4} opacity={trava > 0 ? 1 : 0} />
          <circle cx={alvo.x} cy={alvo.y} r={9} fill={cor.vermelho} opacity={trava} />
          <rect width={carta.w} height={carta.h} fill="none" stroke={cor.tinta} strokeWidth={3} />
        </svg>
        <div style={{ position: "absolute", left: 24, top: alvo.y - 64, fontFamily: mono, fontWeight: 700, fontSize: 46, color: cor.tinta, background: cor.cartao, padding: "0 8px" }}>
          <Datilo texto={c.lat} em={c.em + 0.1} t={t} semente={102} />
        </div>
        <div style={{ position: "absolute", left: alvo.x + 20, top: carta.h - 76, fontFamily: mono, fontWeight: 700, fontSize: 46, color: cor.tinta, background: cor.cartao, padding: "0 8px" }}>
          <Datilo texto={c.lon} em={c.em + 0.4} t={t} semente={103} />
        </div>
      </div>

      {m.detalhe ? (
        <div style={{ position: "absolute", left: detalhe.x, top: carta.y, height: carta.h, width: detalhe.w, display: "flex", alignItems: "center", fontFamily: mono, fontWeight: 700, fontSize: 44, lineHeight: 1.15, color: cor.tinta }}>
          <Datilo texto={m.detalhe.texto} em={m.detalhe.em} t={t} semente={104} />
        </div>
      ) : null}
    </div>
  );
};
