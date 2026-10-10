import { limitar, Traco } from "../anim";
import type { Desenho, Reacao } from "../plano";

// Ícones de interface a traço (viewBox 100×100), um peso só, pontas redondas. Nada de emoji.
const ICONES = {
  voltar: ["M62 18 L30 50 L62 82"],
  video: ["M12 32 Q12 26 18 26 L60 26 Q66 26 66 32 L66 68 Q66 74 60 74 L18 74 Q12 74 12 68 Z", "M66 44 L88 30 L88 70 L66 56"],
  telefone: [
    "M30 14 L42 30 Q44 34 40 38 L34 44 Q42 60 56 66 L62 60 Q66 56 70 58 L86 70 Q88 74 84 78 L76 86 Q70 90 60 86 Q30 72 16 42 Q12 32 16 26 L24 16 Q28 12 30 14 Z",
  ],
  check: ["M22 52 L42 72 L80 30"],
  checks: ["M8 54 L26 72 L60 32", "M44 66 L52 72 L88 32"],
  coracao: ["M50 84 Q14 60 12 36 Q12 18 30 16 Q44 16 50 30 Q56 16 70 16 Q88 18 88 36 Q86 60 50 84 Z"],
  joinha: ["M14 46 L30 46 L30 86 L14 86 Z", "M30 50 L46 18 Q56 16 56 28 L54 42 L80 42 Q90 44 88 54 L82 78 Q80 86 70 86 L30 86"],
  marcador: ["M26 12 L74 12 L74 88 L50 70 L26 88 Z"],
  seguir: ["M40 46 Q54 46 54 30 Q54 14 40 14 Q26 14 26 30 Q26 46 40 46 Z", "M12 86 Q12 60 40 60 Q58 60 64 70", "M78 52 L78 84", "M62 68 L94 68"],
  comentar: ["M14 22 Q14 14 22 14 L78 14 Q86 14 86 22 L86 62 Q86 70 78 70 L40 70 L22 86 L24 70 L22 70 Q14 70 14 62 Z"],
  compartilhar: ["M10 46 L88 12 L64 88 L46 56 Z", "M46 56 L88 12"],
  microfone: ["M38 14 Q38 6 50 6 Q62 6 62 14 L62 48 Q62 60 50 60 Q38 60 38 48 Z", "M24 44 Q24 72 50 72 Q76 72 76 44", "M50 72 L50 92"],
  mais: ["M50 18 L50 82", "M18 50 L82 50"],
  x: ["M24 24 L76 76", "M76 24 L24 76"],
  pessoa: ["M50 50 Q66 50 66 32 Q66 14 50 14 Q34 14 34 32 Q34 50 50 50 Z", "M16 92 Q18 62 50 62 Q82 62 84 92"],
  fixar: ["M38 12 L62 12 L58 40 L72 54 L28 54 L42 40 Z", "M50 54 L50 88"],
  baixo: ["M50 12 L50 84", "M22 58 L50 86 L78 58"],
  responder: ["M40 22 L14 46 L40 70", "M14 46 L62 46 Q86 46 86 70 L86 80"],
  link: [
    "M44 62 L36 70 Q24 82 14 72 Q4 62 16 50 L28 38 Q40 26 50 36",
    "M56 38 L64 30 Q76 18 86 28 Q96 38 84 50 L72 62 Q60 74 50 64",
    "M40 60 L60 40",
  ],
} as const;

export type NomeIcone = keyof typeof ICONES;

export const Icone: React.FC<{
  nome: NomeIcone | Reacao;
  tamanho: number;
  cor: string;
  // espessura em px no tamanho final
  traco?: number;
  // 0→1: o traço se desenha
  p?: number;
  // preenchimento (para coração, marcador cheio…)
  preenchido?: string;
  estilo?: React.CSSProperties;
}> = ({ nome, tamanho, cor, traco = 4, p = 1, preenchido, estilo }) => {
  const caminhos = ICONES[nome as NomeIcone] ?? ICONES.check;
  const largura = (traco * 100) / tamanho;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible", ...estilo }}>
      {preenchido ? <path d={caminhos[0]} fill={preenchido} stroke="none" /> : null}
      {caminhos.map((d, i) => (
        <Traco key={i} d={d} cor={cor} largura={largura} p={limitar(p * caminhos.length - i)} />
      ))}
    </svg>
  );
};

// ---------- desenhos maiores (cartão de produto, condição) — viewBox 200×200 ----------
// `tracos` se desenham em ordem; `forma` é a área chapada que acende por baixo.
type Def = { tracos: string[]; forma?: string; acento?: string };

export const DESENHOS: Record<Desenho, Def> = {
  presente: {
    forma: "M36 86 L164 86 L164 176 L36 176 Z",
    acento: "M88 60 L112 60 L112 176 L88 176 Z",
    tracos: [
      "M36 86 L164 86 L164 176 L36 176 Z",
      "M28 62 L172 62 L172 86 L28 86 Z",
      "M100 62 L100 176",
      "M100 62 Q70 22 56 40 Q48 56 100 62",
      "M100 62 Q130 22 144 40 Q152 56 100 62",
    ],
  },
  caixa: {
    forma: "M30 70 L100 40 L170 70 L170 150 L100 180 L30 150 Z",
    tracos: ["M30 70 L100 40 L170 70 L100 100 Z", "M30 70 L30 150 L100 180 L170 150 L170 70", "M100 100 L100 180", "M65 55 L135 85 L135 112"],
  },
  sacola: {
    forma: "M40 72 L160 72 L170 176 L30 176 Z",
    tracos: ["M40 72 L160 72 L170 176 L30 176 Z", "M72 92 L72 60 Q72 28 100 28 Q128 28 128 60 L128 92"],
  },
  agenda: {
    forma: "M32 48 L168 48 L168 172 L32 172 Z",
    tracos: ["M32 48 L168 48 L168 172 L32 172 Z", "M32 84 L168 84", "M66 30 L66 62", "M134 30 L134 62", "M60 116 L78 116", "M92 116 L110 116", "M124 116 L142 116", "M60 146 L78 146", "M92 146 L110 146"],
  },
  curso: {
    forma: "M24 44 L176 44 L176 144 L24 144 Z",
    tracos: ["M24 44 L176 44 L176 144 L24 144 Z", "M84 72 L124 94 L84 116 Z", "M70 176 L130 176", "M100 144 L100 176"],
  },
  frete: {
    forma: "M18 60 L118 60 L118 146 L18 146 Z",
    tracos: [
      "M18 60 L118 60 L118 146 L18 146 Z",
      "M118 86 L156 86 L182 114 L182 146 L118 146",
      "M62 160 Q62 140 46 140 Q30 140 30 156 Q30 172 46 172 Q62 172 62 160 Z",
      "M166 160 Q166 140 150 140 Q134 140 134 156 Q134 172 150 172 Q166 172 166 160 Z",
    ],
  },
  relogio: {
    forma: "M100 24 Q176 24 176 100 Q176 176 100 176 Q24 176 24 100 Q24 24 100 24 Z",
    tracos: ["M100 24 Q176 24 176 100 Q176 176 100 176 Q24 176 24 100 Q24 24 100 24 Z", "M100 56 L100 100 L134 120"],
  },
  desconto: {
    forma: "M28 100 L96 28 L172 28 L172 104 L100 176 Z",
    tracos: ["M28 100 L96 28 L172 28 L172 104 L100 176 Z", "M140 60 Q150 60 150 70 Q150 80 140 80 Q130 80 130 70 Q130 60 140 60 Z", "M74 122 L116 80"],
  },
  documento: {
    forma: "M52 22 L124 22 L156 54 L156 178 L52 178 Z",
    tracos: ["M52 22 L124 22 L156 54 L156 178 L52 178 Z", "M124 22 L124 54 L156 54", "M76 92 L132 92", "M76 120 L132 120", "M76 148 L112 148"],
  },
  grafico: {
    forma: "M52 140 L92 104 L120 122 L164 64 L164 172 L52 172 Z",
    tracos: ["M34 26 L34 172 L176 172", "M52 140 L92 104 L120 122 L164 64", "M138 64 L164 64 L164 90"],
  },
  moeda: {
    forma: "M100 24 A76 76 0 1 1 99.9 24 Z",
    tracos: [
      "M100 24 A76 76 0 1 1 99.9 24 Z",
      "M100 50 L100 150",
      "M124 76 Q124 62 100 62 Q76 62 76 82 Q76 98 100 100 Q124 102 124 120 Q124 138 100 138 Q76 138 76 124",
    ],
  },
  lampada: {
    forma: "M100 24 Q150 24 150 76 Q150 106 124 126 L124 144 L76 144 L76 126 Q50 106 50 76 Q50 24 100 24 Z",
    tracos: ["M100 24 Q150 24 150 76 Q150 106 124 126 L124 144 L76 144 L76 126 Q50 106 50 76 Q50 24 100 24 Z", "M80 162 L120 162", "M88 180 L112 180"],
  },
  alvo: {
    forma: "M100 80 A20 20 0 1 1 99.9 80 Z",
    tracos: ["M100 24 A76 76 0 1 1 99.9 24 Z", "M100 52 A48 48 0 1 1 99.9 52 Z", "M100 80 A20 20 0 1 1 99.9 80 Z"],
  },
  folha: {
    forma: "M36 164 Q36 44 168 32 Q160 164 36 164 Z",
    tracos: ["M36 164 Q36 44 168 32 Q160 164 36 164 Z", "M36 164 Q92 108 136 66", "M24 178 L48 152"],
  },
  coracao: {
    forma: "M100 172 Q30 124 26 76 Q24 36 62 32 Q88 30 100 58 Q112 30 138 32 Q176 36 174 76 Q170 124 100 172 Z",
    tracos: ["M100 172 Q30 124 26 76 Q24 36 62 32 Q88 30 100 58 Q112 30 138 32 Q176 36 174 76 Q170 124 100 172 Z"],
  },
  casa: {
    forma: "M44 90 L100 42 L156 90 L156 172 L44 172 Z",
    acento: "M84 172 L84 124 L116 124 L116 172 Z",
    tracos: ["M24 104 L100 38 L176 104", "M44 88 L44 172 L156 172 L156 88", "M84 172 L84 124 L116 124 L116 172"],
  },
  garantia: {
    forma: "M100 20 L168 46 L168 100 Q168 156 100 182 Q32 156 32 100 L32 46 Z",
    tracos: ["M100 20 L168 46 L168 100 Q168 156 100 182 Q32 156 32 100 L32 46 Z", "M68 102 L92 126 L136 80"],
  },
};

export const DesenhoTraco: React.FC<{
  nome: Desenho;
  tamanho: number;
  cor: string;
  // cor chapada por baixo (aparece depois do traço)
  corForma?: string;
  corAcento?: string;
  p: number;
  traco?: number;
}> = ({ nome, tamanho, cor, corForma, corAcento, p, traco = 6 }) => {
  const def = DESENHOS[nome] ?? DESENHOS.caixa;
  const n = def.tracos.length;
  const largura = (traco * 200) / tamanho;
  const pForma = limitar((p - 0.55) / 0.45);
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200" style={{ display: "block", overflow: "visible" }}>
      {def.forma && corForma ? <path d={def.forma} fill={corForma} opacity={pForma} /> : null}
      {def.acento && corAcento ? <path d={def.acento} fill={corAcento} opacity={pForma} /> : null}
      {def.tracos.map((d, i) => (
        <Traco key={i} d={d} cor={cor} largura={largura} p={limitar(p * 1.25 * n - i)} />
      ))}
    </svg>
  );
};
