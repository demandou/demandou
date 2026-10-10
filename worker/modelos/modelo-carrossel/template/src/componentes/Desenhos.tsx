import { mistura, prog, Traco } from "../anim";

// Biblioteca de desenhos a traço (viewBox 200×200). Cada desenho tem:
// - `forma`: áreas de cor chapada (o corpo e o detalhe de acento), que acendem depois do traço;
// - `tracos`: as linhas, que se desenham uma depois da outra.
// Tudo com a mesma espessura e cantos redondos: parece de um mesmo ilustrador em todas as páginas.
type Parte = { d: string; cor: "corpo" | "acento" };
// `encaixe`: onde um complemento ("e limão", "com banana") pousa neste desenho, em unidades do viewBox
type Encaixe = { x: number; y: number; escala: number; giro: number };
type Def = { forma: Parte[]; tracos: string[]; encaixe?: Encaixe };

const circulo = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

const DESENHOS = {
  // comida e bebida
  "suco-caixinha": {
    forma: [
      { d: "M56 66 L144 66 L144 176 Q144 184 136 184 L64 184 Q56 184 56 176 Z", cor: "corpo" },
      { d: circulo(100, 128, 24), cor: "acento" },
    ],
    tracos: [
      "M56 66 L144 66 L144 176 Q144 184 136 184 L64 184 Q56 184 56 176 Z",
      "M56 66 L70 44 L130 44 L144 66",
      "M116 44 L116 24 L138 12",
      circulo(100, 128, 24),
      "M100 104 Q104 94 116 92",
    ],
  },
  fruta: {
    forma: [
      { d: circulo(100, 116, 62), cor: "acento" },
      { d: "M102 50 C110 30 136 26 150 34 C140 50 118 56 102 50 Z", cor: "corpo" },
    ],
    tracos: [
      circulo(100, 116, 62),
      "M100 54 L98 40",
      "M102 50 C110 30 136 26 150 34 C140 50 118 56 102 50 Z",
      "M64 104 A40 40 0 0 1 82 78",
      "M120 142 l1 1",
      "M134 124 l1 1",
      "M110 158 l1 1",
    ],
  },
  biscoito: {
    forma: [
      { d: "M38 66 Q38 54 50 54 L150 54 Q162 54 162 66 L162 80 Q162 90 152 90 L48 90 Q38 90 38 80 Z", cor: "corpo" },
      { d: "M44 90 L156 90 L156 112 L44 112 Z", cor: "acento" },
      { d: "M38 122 Q38 112 48 112 L152 112 Q162 112 162 122 L162 136 Q162 148 150 148 L50 148 Q38 148 38 136 Z", cor: "corpo" },
    ],
    tracos: [
      "M38 66 Q38 54 50 54 L150 54 Q162 54 162 66 L162 80 Q162 90 152 90 L48 90 Q38 90 38 80 Z",
      "M44 90 Q52 100 60 90 Q68 100 76 90 Q84 100 92 90 Q100 100 108 90 Q116 100 124 90 Q132 100 140 90 Q148 100 156 90",
      "M38 122 Q38 112 48 112 L152 112 Q162 112 162 122 L162 136 Q162 148 150 148 L50 148 Q38 148 38 136 Z",
      "M70 72 l1 0",
      "M100 72 l1 0",
      "M130 72 l1 0",
    ],
  },
  iogurte: {
    forma: [
      { d: "M52 84 L148 84 L136 172 Q134 182 124 182 L76 182 Q66 182 64 172 Z", cor: "corpo" },
      { d: "M56 110 L144 110 L140 142 L60 142 Z", cor: "acento" },
    ],
    tracos: [
      "M52 84 L148 84 L136 172 Q134 182 124 182 L76 182 Q66 182 64 172 Z",
      "M46 84 L154 84",
      "M58 84 Q62 60 86 62 Q92 46 110 50 Q128 48 132 64 Q146 66 142 84",
      "M56 110 L144 110",
      "M60 142 L140 142",
    ],
  },
  banana: {
    forma: [{ d: "M50 150 C94 166 146 134 156 76 C158 64 172 64 170 80 C166 142 106 186 46 162 C36 158 40 146 50 150 Z", cor: "acento" }],
    tracos: [
      "M50 150 C94 166 146 134 156 76 C158 64 172 64 170 80 C166 142 106 186 46 162 C36 158 40 146 50 150 Z",
      "M158 70 L162 54",
      "M62 160 C108 166 150 132 162 88",
    ],
  },
  refrigerante: {
    forma: [
      { d: "M62 50 L138 50 L138 170 Q138 182 126 182 L74 182 Q62 182 62 170 Z", cor: "corpo" },
      { d: "M62 98 Q82 86 100 98 Q118 110 138 98 L138 130 Q118 142 100 130 Q82 118 62 130 Z", cor: "acento" },
    ],
    tracos: [
      "M62 50 L138 50 L138 170 Q138 182 126 182 L74 182 Q62 182 62 170 Z",
      "M68 36 L132 36 L138 50 M62 50 L68 36",
      "M90 30 Q100 22 110 30",
      "M62 98 Q82 86 100 98 Q118 110 138 98",
      "M62 130 Q82 118 100 130 Q118 142 138 130",
    ],
  },
  agua: {
    encaixe: { x: 142, y: 44, escala: 0.5, giro: -28 },
    forma: [{ d: "M61 86 L139 86 L132 176 Q131 184 124 184 L76 184 Q69 184 68 176 Z", cor: "corpo" }],
    tracos: ["M54 44 L68 176 Q69 184 76 184 L124 184 Q131 184 132 176 L146 44", "M61 86 Q80 80 100 86 Q120 92 139 86"],
  },
  // meia-lua de limão (fica bem na borda de um copo)
  limao: {
    forma: [{ d: "M36 92 A64 64 0 0 0 164 92 Z", cor: "acento" }],
    tracos: ["M36 92 L164 92 A64 64 0 0 1 36 92 Z", "M50 92 A50 50 0 0 0 150 92", "M100 92 L100 142", "M100 92 L135 127", "M100 92 L65 127"],
  },
  cafe: {
    forma: [{ d: "M48 88 L140 88 L132 158 Q130 170 118 170 L70 170 Q58 170 56 158 Z", cor: "corpo" }],
    tracos: [
      "M48 88 L140 88 L132 158 Q130 170 118 170 L70 170 Q58 170 56 158 Z",
      "M138 104 Q166 102 164 124 Q162 146 134 144",
      "M34 182 L156 182",
      "M78 70 Q70 58 78 46 Q86 34 78 22",
      "M106 70 Q98 58 106 46 Q114 34 106 22",
    ],
  },
  doce: {
    forma: [
      { d: "M56 108 L144 108 L132 176 Q130 182 124 182 L76 182 Q70 182 68 176 Z", cor: "corpo" },
      { d: "M48 108 Q40 80 70 78 Q72 54 100 56 Q128 54 130 78 Q160 80 152 108 Z", cor: "acento" },
    ],
    tracos: [
      "M56 108 L144 108 L132 176 Q130 182 124 182 L76 182 Q70 182 68 176 Z",
      "M48 108 Q40 80 70 78 Q72 54 100 56 Q128 54 130 78 Q160 80 152 108 Z",
      "M84 108 L88 182 M116 108 L112 182",
      circulo(100, 42, 10),
    ],
  },
  pao: {
    forma: [{ d: "M36 126 Q36 70 100 70 Q164 70 164 126 L164 162 Q164 174 152 174 L48 174 Q36 174 36 162 Z", cor: "corpo" }],
    tracos: [
      "M36 126 Q36 70 100 70 Q164 70 164 126 L164 162 Q164 174 152 174 L48 174 Q36 174 36 162 Z",
      "M66 104 L82 88",
      "M92 104 L108 88",
      "M118 104 L134 88",
    ],
  },
  salada: {
    forma: [
      { d: "M30 104 L170 104 Q166 170 100 172 Q34 170 30 104 Z", cor: "corpo" },
      { d: circulo(130, 86, 16), cor: "acento" },
    ],
    tracos: [
      "M30 104 L170 104 Q166 170 100 172 Q34 170 30 104 Z",
      "M56 104 Q48 70 80 60 Q90 86 72 104",
      "M86 104 Q88 64 116 52 Q120 84 100 104",
      circulo(130, 86, 16),
      "M70 180 L130 180",
    ],
  },
  // dinheiro
  cartao: {
    forma: [
      { d: "M30 58 Q30 46 42 46 L158 46 Q170 46 170 58 L170 142 Q170 154 158 154 L42 154 Q30 154 30 142 Z", cor: "corpo" },
      { d: "M48 86 L80 86 L80 110 L48 110 Z", cor: "acento" },
    ],
    tracos: [
      "M30 58 Q30 46 42 46 L158 46 Q170 46 170 58 L170 142 Q170 154 158 154 L42 154 Q30 154 30 142 Z",
      "M48 86 L80 86 L80 110 L48 110 Z",
      "M48 132 L100 132",
      "M114 132 L150 132",
    ],
  },
  cofrinho: {
    forma: [
      { d: "M44 112 Q44 68 100 68 Q150 68 158 104 L172 104 L172 128 L156 132 Q150 152 132 160 L132 176 L114 176 L112 164 L86 164 L84 176 L66 176 L66 160 Q44 146 44 112 Z", cor: "corpo" },
      { d: circulo(100, 44, 16), cor: "acento" },
    ],
    tracos: [
      "M44 112 Q44 68 100 68 Q150 68 158 104 L172 104 L172 128 L156 132 Q150 152 132 160 L132 176 L114 176 L112 164 L86 164 L84 176 L66 176 L66 160 Q44 146 44 112 Z",
      "M84 80 L116 80",
      "M128 100 l1 0",
      circulo(100, 44, 16),
      "M44 108 Q30 110 32 96",
    ],
  },
  carrinho: {
    forma: [{ d: "M58 58 L170 58 L156 116 L70 116 Z", cor: "acento" }],
    tracos: ["M24 38 L48 38 L72 136 L154 136", "M58 58 L170 58 L156 116 L70 116", circulo(80, 164, 14), circulo(144, 164, 14)],
  },
  // rotina e produtividade
  celular: {
    forma: [
      { d: "M62 28 Q62 16 74 16 L126 16 Q138 16 138 28 L138 172 Q138 184 126 184 L74 184 Q62 184 62 172 Z", cor: "corpo" },
      { d: "M74 44 L126 44 L126 150 L74 150 Z", cor: "acento" },
    ],
    tracos: [
      "M62 28 Q62 16 74 16 L126 16 Q138 16 138 28 L138 172 Q138 184 126 184 L74 184 Q62 184 62 172 Z",
      "M90 30 L110 30",
      "M90 168 L110 168",
    ],
  },
  livro: {
    forma: [
      { d: "M100 58 Q70 42 28 48 L28 158 Q70 152 100 168 Z", cor: "corpo" },
      { d: "M100 58 Q130 42 172 48 L172 158 Q130 152 100 168 Z", cor: "acento" },
    ],
    tracos: ["M100 58 Q70 42 28 48 L28 158 Q70 152 100 168 Z", "M100 58 Q130 42 172 48 L172 158 Q130 152 100 168", "M46 76 Q66 72 84 80", "M46 100 Q66 96 84 104"],
  },
  despertador: {
    forma: [{ d: circulo(100, 112, 60), cor: "corpo" }],
    tracos: [circulo(100, 112, 60), "M100 112 L100 80", "M100 112 L124 124", "M44 62 Q46 38 70 36", "M156 62 Q154 38 130 36", "M64 172 L54 186", "M136 172 L146 186"],
  },
  lista: {
    forma: [{ d: "M46 36 Q46 26 56 26 L144 26 Q154 26 154 36 L154 176 Q154 186 144 186 L56 186 Q46 186 46 176 Z", cor: "corpo" }],
    tracos: [
      "M46 36 Q46 26 56 26 L144 26 Q154 26 154 36 L154 176 Q154 186 144 186 L56 186 Q46 186 46 176 Z",
      "M66 70 L76 80 L92 60",
      "M104 72 L136 72",
      "M66 112 L76 122 L92 102",
      "M104 114 L136 114",
      "M66 154 L92 154",
      "M104 156 L136 156",
    ],
  },
  // gerais (qualquer assunto): dinheiro e mercado, sinais, ideias, pessoas, céu e direção
  "grafico-sobe": {
    forma: [{ d: "M48 142 L82 110 L112 124 L156 70 L156 166 L48 166 Z", cor: "corpo" }],
    tracos: ["M36 34 L36 166 L172 166", "M48 142 L82 110 L112 124 L156 70", "M134 66 L158 66 L158 90"],
  },
  "grafico-cai": {
    forma: [{ d: "M48 70 L82 102 L112 90 L156 142 L156 166 L48 166 Z", cor: "corpo" }],
    tracos: ["M36 34 L36 166 L172 166", "M48 70 L82 102 L112 90 L156 142", "M158 120 L158 144 L134 144"],
  },
  moeda: {
    forma: [{ d: circulo(100, 104, 66), cor: "acento" }],
    tracos: [
      circulo(100, 104, 66),
      circulo(100, 104, 48),
      "M118 84 Q112 74 100 74 Q82 74 82 89 Q82 101 100 104 Q118 107 118 119 Q118 134 100 134 Q86 134 80 124",
      "M100 62 L100 74 M100 134 L100 146",
    ],
  },
  alerta: {
    forma: [{ d: "M100 34 L174 162 L26 162 Z", cor: "acento" }],
    tracos: ["M100 34 L174 162 L26 162 Z", "M100 82 L100 120", "M100 140 L100 141"],
  },
  lupa: {
    forma: [{ d: circulo(86, 86, 48), cor: "corpo" }],
    tracos: [circulo(86, 86, 48), "M121 121 L166 166", "M62 78 A26 26 0 0 1 80 60"],
  },
  alvo: {
    forma: [{ d: circulo(96, 108, 22), cor: "acento" }],
    tracos: [circulo(96, 108, 66), circulo(96, 108, 44), circulo(96, 108, 22), "M96 108 L160 44", "M142 40 L162 42 L160 62"],
  },
  lampada: {
    forma: [{ d: "M100 28 C66 28 46 54 50 84 C54 108 74 116 78 136 L122 136 C126 116 146 108 150 84 C154 54 134 28 100 28 Z", cor: "acento" }],
    tracos: [
      "M100 28 C66 28 46 54 50 84 C54 108 74 116 78 136 L122 136 C126 116 146 108 150 84 C154 54 134 28 100 28 Z",
      "M82 154 L118 154",
      "M88 172 L112 172",
      "M100 136 L100 104 L88 92 M100 104 L112 92",
    ],
  },
  escudo: {
    forma: [{ d: "M100 28 L160 50 L156 112 Q150 152 100 176 Q50 152 44 112 L40 50 Z", cor: "corpo" }],
    tracos: ["M100 28 L160 50 L156 112 Q150 152 100 176 Q50 152 44 112 L40 50 Z", "M72 104 L92 124 L130 84"],
  },
  coracao: {
    forma: [{ d: "M100 168 C52 134 30 106 34 78 C38 50 72 40 100 70 C128 40 162 50 166 78 C170 106 148 134 100 168 Z", cor: "acento" }],
    tracos: ["M100 168 C52 134 30 106 34 78 C38 50 72 40 100 70 C128 40 162 50 166 78 C170 106 148 134 100 168 Z", "M58 86 Q60 68 76 64"],
  },
  casa: {
    forma: [
      { d: "M54 90 L100 50 L146 90 L146 170 L54 170 Z", cor: "corpo" },
      { d: "M86 170 L86 128 L114 128 L114 170 Z", cor: "acento" },
    ],
    tracos: ["M34 100 L100 42 L166 100", "M54 86 L54 170 L146 170 L146 86", "M86 170 L86 128 L114 128 L114 170"],
  },
  pessoa: {
    forma: [
      { d: circulo(100, 66, 30), cor: "corpo" },
      { d: "M44 174 Q44 112 100 112 Q156 112 156 174 Z", cor: "acento" },
    ],
    tracos: [circulo(100, 66, 30), "M44 174 Q44 112 100 112 Q156 112 156 174"],
  },
  balao: {
    forma: [{ d: "M36 58 Q36 40 54 40 L146 40 Q164 40 164 58 L164 118 Q164 136 146 136 L88 136 L56 166 L62 136 L54 136 Q36 136 36 118 Z", cor: "corpo" }],
    tracos: [
      "M36 58 Q36 40 54 40 L146 40 Q164 40 164 58 L164 118 Q164 136 146 136 L88 136 L56 166 L62 136 L54 136 Q36 136 36 118 Z",
      "M74 88 L75 88",
      "M100 88 L101 88",
      "M126 88 L127 88",
    ],
  },
  dado: {
    forma: [
      { d: "M42 58 Q42 42 58 42 L142 42 Q158 42 158 58 L158 142 Q158 158 142 158 L58 158 Q42 158 42 142 Z", cor: "corpo" },
      { d: `${circulo(72, 72, 10)} ${circulo(100, 100, 10)} ${circulo(128, 128, 10)}`, cor: "acento" },
    ],
    tracos: ["M42 58 Q42 42 58 42 L142 42 Q158 42 158 58 L158 142 Q158 158 142 158 L58 158 Q42 158 42 142 Z", circulo(72, 72, 10), circulo(100, 100, 10), circulo(128, 128, 10)],
  },
  calendario: {
    forma: [{ d: "M38 58 Q38 46 50 46 L150 46 Q162 46 162 58 L162 84 L38 84 Z", cor: "acento" }],
    tracos: [
      "M38 58 Q38 46 50 46 L150 46 Q162 46 162 58 L162 160 Q162 172 150 172 L50 172 Q38 172 38 160 Z",
      "M38 84 L162 84",
      "M72 32 L72 58 M128 32 L128 58",
      "M66 112 L67 112 M100 112 L101 112 M134 112 L135 112 M66 142 L67 142 M100 142 L101 142",
    ],
  },
  estrela: {
    forma: [{ d: "M100 32 L117.6 79.7 L168.5 81.8 L128.5 113.3 L142.3 162.2 L100 134 L57.7 162.2 L71.5 113.3 L31.5 81.8 L82.4 79.7 Z", cor: "acento" }],
    tracos: ["M100 32 L117.6 79.7 L168.5 81.8 L128.5 113.3 L142.3 162.2 L100 134 L57.7 162.2 L71.5 113.3 L31.5 81.8 L82.4 79.7 Z", "M160 24 L160 44 M150 34 L170 34"],
  },
  lua: {
    forma: [{ d: "M126.5 41.4 A68 68 0 1 0 163.9 127.3 A54 54 0 0 1 126.5 41.4 Z", cor: "acento" }],
    tracos: ["M126.5 41.4 A68 68 0 1 0 163.9 127.3 A54 54 0 0 1 126.5 41.4 Z", "M150 50 L150 64 M143 57 L157 57"],
  },
  // quatro estrelas ligadas (constelação, rede, conexão)
  constelacao: {
    forma: [{ d: `${circulo(100, 34, 11)} ${circulo(96, 166, 13)} ${circulo(44, 98, 10)} ${circulo(152, 90, 11)}`, cor: "acento" }],
    tracos: ["M100 45 L96 153", "M54 97 L141 91", circulo(100, 34, 11), circulo(96, 166, 13), circulo(44, 98, 10), circulo(152, 90, 11), "M132 128 L133 128"],
  },
  bussola: {
    forma: [
      { d: circulo(100, 100, 70), cor: "corpo" },
      { d: "M100 48 L116 100 L84 100 Z", cor: "acento" },
    ],
    tracos: [circulo(100, 100, 70), "M100 48 L116 100 L100 152 L84 100 Z", "M84 100 L116 100", "M100 22 L100 32 M178 100 L168 100 M100 178 L100 168 M22 100 L32 100"],
  },
  // marcações
  mais: {
    forma: [],
    tracos: ["M100 62 L100 138", "M62 100 L138 100"],
  },
} satisfies Record<string, Def>;

export type NomeDesenho = keyof typeof DESENHOS;

const ENCAIXE_PADRAO: Encaixe = { x: 172, y: 162, escala: 0.56, giro: 0 };
export const encaixeDe = (nome: NomeDesenho): Encaixe => (DESENHOS[nome] as Def).encaixe ?? ENCAIXE_PADRAO;
export const NOMES_DESENHOS = Object.keys(DESENHOS) as NomeDesenho[];

// O plano vem de um JSON escrito à mão: nome de desenho que não existe fica sem desenho (nunca quebra).
export const desenhoValido = (nome?: string | null): NomeDesenho | undefined =>
  nome && Object.prototype.hasOwnProperty.call(DESENHOS, nome) ? (nome as NomeDesenho) : undefined;
// `desenho` ou o sinônimo `icone`
export const desenhoDe = (item?: { desenho?: string; icone?: string } | null) => desenhoValido(item?.desenho ?? item?.icone);

// Bolhas de gás subindo dentro do copo (só no desenho "agua", quando `gas` está ligado)
const BOLHAS = [
  { x: 82, r: 4.5, fase: 0 },
  { x: 104, r: 3.5, fase: 0.37 },
  { x: 118, r: 5, fase: 0.68 },
  { x: 92, r: 3, fase: 0.52 },
  { x: 112, r: 3.5, fase: 0.14 },
];

export const Desenho: React.FC<{
  nome: NomeDesenho;
  // progresso do desenho: 0 = nada, 1 = completo (traços um após o outro, cores no fim)
  p: number;
  tamanho: number;
  // espessura do traço em px de tela
  traco?: number;
  cores: { linha: string; corpo: string; acento: string };
  // 0..1: apaga o desenho (o item que sai)
  apagado?: number;
  corApagada?: string;
  t?: number;
  // desenho "agua": bolhas subindo
  gas?: boolean;
  estilo?: React.CSSProperties;
}> = ({ nome, p, tamanho, traco = 6, cores, apagado = 0, corApagada, t = 0, gas, estilo }) => {
  const def: Def = DESENHOS[nome];
  const largura = (traco * 200) / tamanho;
  const n = def.tracos.length;
  // cada traço ocupa uma fatia do progresso, com sobreposição (parece uma mão só)
  const pTraco = (i: number) => {
    const ini = (i / n) * 0.72;
    return Math.min(1, Math.max(0, (p - ini) / 0.38));
  };
  const pCor = Math.min(1, Math.max(0, (p - 0.55) / 0.45));
  const linha = corApagada ? misturarCor(cores.linha, corApagada, apagado) : cores.linha;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 200 200" style={{ display: "block", overflow: "visible", ...estilo }}>
      {def.forma.map((f, i) => (
        <path key={`f${i}`} d={f.d} fill={f.cor === "acento" ? cores.acento : cores.corpo} opacity={pCor * (1 - 0.75 * apagado)} />
      ))}
      {nome === "agua" && gas && p > 0.5
        ? BOLHAS.map((b, i) => {
            // cada bolha sobe do fundo até a superfície em ~1,6 s e recomeça
            const ciclo = ((t * 0.62 + b.fase) % 1 + 1) % 1;
            const y = mistura(174, 94, ciclo);
            const x = b.x + Math.sin((t + b.fase * 7) * 5) * 2.5;
            return (
              <circle
                key={`b${i}`}
                cx={x}
                cy={y}
                r={b.r}
                fill="none"
                stroke={linha}
                strokeWidth={largura * 0.55}
                opacity={Math.min(1, ciclo * 6, (1 - ciclo) * 5) * prog(p, 0.5, 0.5)}
              />
            );
          })
        : null}
      {def.tracos.map((d, i) => (
        <Traco key={`t${i}`} d={d} p={pTraco(i)} cor={linha} largura={largura} />
      ))}
    </svg>
  );
};

// Mistura duas cores hex (#RRGGBB) ou rgba(...). Usado para apagar o que sai.
export const misturarCor = (a: string, b: string, p: number) => {
  const ler = (c: string): [number, number, number, number] => {
    if (c.startsWith("#")) {
      const v = c.slice(1);
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 1];
    }
    const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
    return [m[0], m[1], m[2], m[3] ?? 1];
  };
  const [x, y] = [ler(a), ler(b)];
  const k = Math.min(1, Math.max(0, p));
  const c = x.map((v, i) => v + (y[i] - v) * k);
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;
};
