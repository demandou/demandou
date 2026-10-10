// Mini-ilustrações do relatório: desenhos em traço de tinta com UMA cor de acento (coral), que se
// desenham na palavra (como caneta no papel). Servem para qualquer assunto: a lista fica em
// references/plano.md (campo `icone` das métricas, mudanças, tópicos e passos).
// Caixa de desenho 160×120; o traço engrossa junto com o tamanho.
import { prog, suave } from "../anim";
import type { NomeIlustracao } from "../plano";
import { cor } from "../tema";

type Traco = { d: string; preencher?: "acento" | "claro" | "branco"; acento?: boolean; largura?: number; pulsa?: boolean };

const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const caixa = (x: number, y: number, w: number, h: number, r = 8) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;

export const ILUSTRACOES: Record<NomeIlustracao, Traco[]> = {
  anuncio: [
    { d: "M36 46 L94 22 L94 98 L36 74 Z", preencher: "claro" },
    { d: "M94 22 Q103 60 94 98" },
    { d: "M36 46 H24 Q17 46 17 53 V67 Q17 74 24 74 H36" },
    { d: "M46 78 L54 104 H67 L60 82" },
    { d: "M110 46 Q118 60 110 74", acento: true, pulsa: true },
    { d: "M123 36 Q137 60 123 84", acento: true, pulsa: true },
    { d: "M136 26 Q156 60 136 94", acento: true, pulsa: true },
  ],
  carrinho: [
    { d: "M42 40 H134 L120 80 H50 Z", preencher: "claro" },
    { d: "M16 24 H32 L48 84 H122" },
    { d: "M42 40 H134 L120 80" },
    { d: circ(58, 100, 8) },
    { d: circ(112, 100, 8) },
  ],
  criativo: [
    { d: caixa(38, 6, 84, 108, 10), preencher: "branco" },
    { d: caixa(48, 18, 64, 50, 4), preencher: "claro" },
    { d: "M73 32 L92 43 L73 54 Z", preencher: "acento", acento: true },
    { d: "M48 82 H104" },
    { d: "M48 96 H86" },
  ],
  pagina: [
    { d: caixa(8, 12, 144, 96, 8), preencher: "branco" },
    { d: "M8 30 H152" },
    { d: `${circ(20, 21, 2.5)} ${circ(29, 21, 2.5)} ${circ(38, 21, 2.5)}` },
    { d: "M22 46 H82" },
    { d: "M22 58 H70" },
    { d: caixa(96, 42, 44, 36, 4), preencher: "claro" },
    { d: caixa(22, 70, 50, 16, 8), preencher: "acento", acento: true },
    { d: "M22 98 H62" },
  ],
  oferta: [
    { d: "M32 32 H98 L134 60 L98 88 H32 Q24 88 24 80 V40 Q24 32 32 32 Z", preencher: "branco" },
    { d: circ(112, 60, 5) },
    { d: "M46 76 L78 44", acento: true },
    { d: circ(50, 48, 6), acento: true },
    { d: circ(74, 72, 6), acento: true },
    { d: "M117 56 Q138 28 152 36" },
  ],
  dinheiro: [
    { d: caixa(18, 28, 124, 64, 8), preencher: "claro" },
    { d: circ(80, 60, 18), preencher: "branco" },
    { d: "M87 52 Q81 46 75 50 Q70 56 80 60 Q90 64 85 70 Q79 75 73 69 M80 43 V77", acento: true },
    { d: "M30 40 H44 M116 80 H130" },
  ],
  grafico: [
    { d: "M18 12 V102 H148" },
    { d: caixa(32, 78, 18, 24, 3) },
    { d: caixa(60, 62, 18, 40, 3) },
    { d: caixa(88, 46, 18, 56, 3) },
    { d: caixa(116, 26, 18, 76, 3), preencher: "acento", acento: true },
    { d: "M36 64 L66 48 L94 32 L124 12 M112 12 H125 V24", acento: true },
  ],
  alvo: [
    { d: circ(68, 62, 42), preencher: "branco" },
    { d: circ(68, 62, 27) },
    { d: circ(68, 62, 12), preencher: "acento", acento: true },
    { d: "M68 62 L134 18 M122 14 L136 16 L134 30", acento: true },
  ],
  funil: [
    { d: "M20 16 H140 L98 62 V100 L62 112 V62 Z", preencher: "claro" },
    { d: "M38 36 H122" },
    { d: `${circ(70, 8, 3)} ${circ(86, 6, 3)}`, acento: true },
  ],
  mensagem: [
    { d: "M28 14 H112 Q120 14 120 22 V62 Q120 70 112 70 H54 L36 86 V70 H28 Q20 70 20 62 V22 Q20 14 28 14 Z", preencher: "branco" },
    { d: `${circ(48, 42, 4)} ${circ(70, 42, 4)} ${circ(92, 42, 4)}`, preencher: "acento", acento: true },
    { d: "M74 82 H132 Q140 82 140 90 V104 Q140 112 132 112 H100 L92 118 V112 H82" },
  ],
  email: [
    { d: caixa(16, 26, 128, 74, 6), preencher: "branco" },
    { d: "M18 30 L80 72 L142 30" },
    { d: circ(140, 26, 11), preencher: "acento", acento: true },
  ],
  video: [
    { d: caixa(14, 14, 132, 82, 8), preencher: "branco" },
    { d: "M68 36 L96 55 L68 74 Z", preencher: "acento", acento: true },
    { d: "M26 108 H134" },
    { d: "M26 108 H74", acento: true },
  ],
  telefone: [
    { d: caixa(48, 6, 64, 108, 10), preencher: "branco" },
    { d: "M72 16 H88" },
    { d: caixa(56, 26, 48, 64, 3), preencher: "claro" },
    { d: "M70 54 L78 62 L92 46", acento: true },
    { d: "M74 102 H86" },
  ],
  calendario: [
    { d: caixa(18, 22, 124, 86, 6), preencher: "branco" },
    { d: "M18 44 H142" },
    { d: "M46 12 V32 M114 12 V32" },
    { d: "M18 66 H142 M18 88 H142 M49 44 V108 M80 44 V108 M111 44 V108" },
    { d: "M86 78 L93 84 L105 70", acento: true },
  ],
  pessoa: [
    { d: circ(80, 38, 20), preencher: "branco" },
    { d: "M40 112 Q42 70 80 68 Q118 70 120 112", preencher: "claro" },
  ],
  equipe: [
    { d: "M20 106 Q22 80 42 78 Q56 79 62 88" },
    { d: "M140 106 Q138 80 118 78 Q104 79 98 88" },
    { d: circ(42, 56, 12) },
    { d: circ(118, 56, 12) },
    { d: "M52 110 Q54 76 80 74 Q106 76 108 110", preencher: "claro" },
    { d: circ(80, 46, 16), preencher: "branco" },
    { d: "M80 26 V18", acento: true },
  ],
  ferramenta: [
    { d: "M92 60 L38 112", largura: 2.2 },
    { d: "M118 26 A26 26 0 1 1 92 16 L90 34 L104 46 L122 42 Z", preencher: "claro" },
    { d: circ(44, 106, 4), acento: true },
  ],
  ideia: [
    { d: "M80 14 A32 32 0 0 1 100 74 V88 H60 V74 A32 32 0 0 1 80 14 Z", preencher: "claro" },
    { d: "M64 98 H96 M69 108 H91" },
    { d: "M28 46 H18 M142 46 H132 M42 16 L35 9 M118 16 L125 9", acento: true, pulsa: true },
  ],
  relogio: [
    { d: circ(80, 60, 44), preencher: "branco" },
    { d: "M80 22 V28 M80 92 V98 M42 60 H48 M112 60 H118" },
    { d: "M80 60 V36", acento: true },
    { d: "M80 60 L100 72", acento: true },
  ],
  documento: [
    { d: "M44 8 H102 L124 30 V112 H44 Z", preencher: "branco" },
    { d: "M102 8 V30 H124" },
    { d: "M56 46 H110 M56 60 H110 M56 74 H92" },
    { d: "M58 92 L65 99 L78 86", acento: true },
  ],
  escudo: [
    { d: "M80 8 L128 24 V58 Q128 92 80 114 Q32 92 32 58 V24 Z", preencher: "claro" },
    { d: "M60 60 L74 74 L102 46", acento: true },
  ],
  coracao: [
    { d: "M80 106 Q30 72 30 44 Q30 20 54 18 Q71 18 80 36 Q89 18 106 18 Q130 20 130 44 Q130 72 80 106 Z", preencher: "claro" },
    { d: "M14 64 H50 L58 50 L68 80 L76 64 H146", acento: true },
  ],
  casa: [
    { d: "M38 50 V108 H122 V50", preencher: "branco" },
    { d: "M22 60 L80 16 L138 60" },
    { d: "M70 108 V80 H90 V108 Z", preencher: "acento", acento: true },
    { d: caixa(98, 64, 14, 14, 2) },
  ],
  moeda: [
    { d: circ(98, 56, 38), preencher: "claro" },
    { d: circ(98, 56, 27) },
    { d: "M105 48 Q99 42 93 46 Q88 52 98 56 Q108 60 103 66 Q97 71 91 65 M98 39 V73", acento: true },
    { d: "M18 100 a22 7 0 1 0 44 0 a22 7 0 1 0 -44 0 M18 100 V88 a22 7 0 1 1 44 0 V100 M18 88 V76 a22 7 0 1 1 44 0 V88" },
  ],
};

export const NOMES_ILUSTRACOES = Object.keys(ILUSTRACOES) as NomeIlustracao[];

const COR_FUNDO = { acento: cor.acento, claro: cor.acentoClaro, branco: cor.cartao };

// Desenha a ilustração `nome` numa caixa `largura`×`altura`; os traços se desenham a partir de `em`
// (um depois do outro, ~0,7 s no total) e os preenchimentos acendem logo atrás. Depois de pronta,
// as ondas (`pulsa`) continuam pulsando devagar. Antes de `em`, nada.
export const Ilustracao: React.FC<{ nome?: NomeIlustracao; t: number; em: number; largura: number; altura: number }> = ({ nome, t, em, largura, altura }) => {
  const tracos = nome ? ILUSTRACOES[nome] : undefined;
  if (!tracos || t < em) return null;
  const n = tracos.length;
  const passo = Math.min(0.08, 0.36 / Math.max(1, n));
  const pronto = t > em + passo * n + 0.55;
  const escala = Math.min(largura / 160, altura / 120);
  // traço de ~4 px na tela, qualquer que seja o tamanho
  const traco = Math.min(5.5, Math.max(2.4, 4 / Math.max(0.1, escala)));
  return (
    <svg width={largura} height={altura} viewBox="0 0 160 120" preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
      {tracos.map((tr, i) => {
        const ini = em + i * passo;
        const pD = pronto ? 1 : prog(t, ini, 0.42, suave);
        const pF = pronto ? 1 : prog(t, ini + 0.28, 0.25);
        const pulso = tr.pulsa && t > ini + 0.42 ? 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (t - ini - 0.42) * 1.4 - i * 0.9)) : 1;
        const linha = tr.acento ? cor.acento : cor.tinta;
        return (
          <g key={i} opacity={pulso}>
            {tr.preencher ? <path d={tr.d} fill={COR_FUNDO[tr.preencher]} opacity={pF} stroke="none" /> : null}
            <path
              d={tr.d}
              fill="none"
              stroke={linha}
              strokeWidth={traco * (tr.largura ?? 1)}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={pronto ? undefined : 1}
              strokeDasharray={pronto ? undefined : "1 1"}
              strokeDashoffset={pronto ? undefined : 1 - pD}
            />
          </g>
        );
      })}
    </svg>
  );
};
