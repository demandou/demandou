// Biblioteca de ilustrações das figurinhas: a traço (tinta índigo) com cor chapada.
// Tudo num viewBox de 200×200. Com `lapis`, o mesmo desenho sai só em traço de lápis claro, sem cor:
// é o esboço da casa vazia do álbum, antes de a figurinha ser colada.
import type { Desenho as NomeDesenho } from "../plano";
import { larguraPalavra, TITULO } from "../medida";
import { cor, type Fundo, fundos, titulo } from "../tema";

type Modo = { lapis: boolean };
const TRACO = 2.6;

const Forma: React.FC<{ d: string; f: string; m: Modo; w?: number }> = ({ d, f, m, w = TRACO }) => (
  <path d={d} fill={m.lapis ? "none" : f} stroke={m.lapis ? cor.lapis : cor.tinta} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
);
const Bola: React.FC<{ cx: number; cy: number; r: number; f: string; m: Modo; w?: number }> = ({ cx, cy, r, f, m, w = TRACO }) => (
  <circle cx={cx} cy={cy} r={r} fill={m.lapis ? "none" : f} stroke={m.lapis ? cor.lapis : cor.tinta} strokeWidth={w} />
);
// linha de detalhe (dobra, nervura, gomo): some no esboço quando `soCor`
const Detalhe: React.FC<{ d: string; m: Modo; c?: string; w?: number; soCor?: boolean; o?: number }> = ({ d, m, c = cor.tinta, w = 2, soCor, o = 1 }) =>
  m.lapis && soCor ? null : (
    <path d={d} fill="none" stroke={m.lapis ? cor.lapis : c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={m.lapis ? 1 : o} />
  );
// reflexo (só na versão colorida)
const Reflexo: React.FC<{ d: string; m: Modo; o?: number }> = ({ d, m, o = 0.55 }) => (m.lapis ? null : <path d={d} fill="#FFFFFF" opacity={o} />);

const P = {
  chocolate: "#6B3C2A",
  chocolateClaro: "#86513A",
  embalagem: "#3A3684",
  papelAluminio: "#DCD8E6",
  uva: "#7C4FA2",
  uvaClara: "#9C76C2",
  passa: "#4E2C40",
  folha: "#6EA45A",
  folhaEscura: "#4E8240",
  cabo: "#8A5B3A",
  cebola: "#B04E7C",
  cebolaRisco: "#86335B",
  casca: "#C9A07A",
  alho: "#F6F0E2",
  alhoRisco: "#C7A9C9",
  abacate: "#3F6B3A",
  polpa: "#CFE08E",
  caroco: "#8A5A3A",
  cafe: "#6B3C2A",
  xicara: "#FBF7EF",
  osso: "#F7F0DF",
  tigela: cor.carimbo,
  racao: "#A8673A",
  capsula: cor.carimbo,
  comprimido: "#FBF7EF",
  seringa: "#FBF7EF",
  liquido: "#8FC7E8",
  pata: cor.caramelo,
  coracao: cor.carimbo,
  telefone: "#3A3684",
};

// ---------- desenhos ----------

const Chocolate: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <g transform="rotate(-14 100 100)">
      {/* barra */}
      <Forma d="M58 26 H142 Q150 26 150 34 V168 Q150 176 142 176 H58 Q50 176 50 168 V34 Q50 26 58 26 Z" f={P.chocolate} m={m} />
      {[0, 1].map((c) =>
        [0, 1].map((r) => (
          <g key={`${c}-${r}`}>
            <Forma d={`M${58 + c * 44} ${34 + r * 34} h36 v28 h-36 Z`} f={P.chocolateClaro} m={m} w={2} />
            <Reflexo d={`M${62 + c * 44} ${38 + r * 34} h26 v5 h-26 Z`} m={m} o={0.22} />
          </g>
        )),
      )}
      {/* papel-alumínio rasgado */}
      <Forma d="M46 104 L54 96 L62 104 L70 95 L79 104 L88 96 L97 104 L106 95 L115 104 L124 96 L133 104 L142 95 L154 104 V116 H46 Z" f={P.papelAluminio} m={m} w={2.2} />
      {/* embalagem */}
      <Forma d="M44 112 H156 V172 Q156 182 146 182 H54 Q44 182 44 172 Z" f={P.embalagem} m={m} />
      <Forma d="M66 130 H134 Q142 130 142 138 V150 Q142 158 134 158 H66 Q58 158 58 150 V138 Q58 130 66 130 Z" f={cor.cartela} m={m} w={2.2} />
      <Detalhe d="M74 140 H126 M82 149 H118" m={m} c={P.embalagem} w={3.2} soCor />
      <Reflexo d="M52 120 h6 v52 h-6 Z" m={m} o={0.18} />
    </g>
    {/* pedaço quebrado */}
    <g transform="rotate(18 160 168)">
      <Forma d="M146 156 h28 v24 h-28 Z" f={P.chocolate} m={m} />
      <Forma d="M151 161 h18 v14 h-18 Z" f={P.chocolateClaro} m={m} w={1.8} />
    </g>
  </g>
);

const Uva: React.FC<{ m: Modo }> = ({ m }) => {
  const bagos: [number, number][] = [
    [66, 66],
    [100, 62],
    [134, 68],
    [82, 95],
    [117, 96],
    [99, 124],
    [64, 120],
  ];
  return (
    <g>
      {/* cabo e folha */}
      <Detalhe d="M100 48 C 100 36, 104 28, 112 20" m={m} c={P.cabo} w={5} />
      <Forma d="M110 34 C 124 18, 150 20, 160 30 C 150 46, 128 50, 110 34 Z" f={P.folha} m={m} />
      <Detalhe d="M114 34 C 128 32, 142 31, 156 30" m={m} c={P.folhaEscura} w={2} soCor />
      {bagos.map(([x, y], i) => (
        <g key={i}>
          <Bola cx={x} cy={y} r={18} f={i % 2 ? P.uva : P.uvaClara} m={m} />
          <Reflexo d={`M${x - 10} ${y - 4} a7 9 0 0 1 8 -9 a4 4 0 0 1 -3 6 a6 6 0 0 0 -3 5 Z`} m={m} o={0.6} />
        </g>
      ))}
      {/* uvas-passas: bolinhas irregulares e enrugadas (nada de "grão de café") */}
      {[
        [150, 146, -10, 1],
        [174, 160, 20, 0.9],
        [146, 172, 40, 0.85],
      ].map(([x, y, a, s], i) => (
        <g key={`p${i}`} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
          <Forma d="M-14 -2 C -16 -11, -6 -15, 1 -13 C 8 -16, 16 -10, 15 -3 C 18 4, 12 13, 3 12 C -4 16, -14 12, -13 5 C -17 2, -16 0, -14 -2 Z" f={P.passa} m={m} w={2.2} />
          <Detalhe d="M-8 -6 C -5 -3, -6 1, -9 4 M0 -8 C 3 -4, 2 2, 4 6 M7 -6 C 9 -3, 10 1, 8 4" m={m} c="#8E6A80" w={1.7} soCor />
        </g>
      ))}
    </g>
  );
};

const CebolaForma: React.FC<{ m: Modo; x: number; y: number; s: number }> = ({ m, x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* raízes */}
    <Detalhe d="M-8 52 L-12 62 M0 54 L0 65 M8 52 L12 62" m={m} c={P.casca} w={2.4} />
    {/* bulbo */}
    <Forma d="M0 -52 C 22 -40, 46 -16, 44 10 C 42 38, 22 54, 0 54 C -22 54, -42 38, -44 10 C -46 -16, -22 -40, 0 -52 Z" f={P.cebola} m={m} />
    <Detalhe d="M0 -46 C -14 -20, -20 20, -8 52 M0 -46 C 14 -20, 20 20, 8 52 M0 -48 C -30 -24, -38 16, -26 46" m={m} c={P.cebolaRisco} w={2.2} soCor />
    {/* talo seco */}
    <Forma d="M-5 -50 L-4 -68 L6 -72 L5 -50 Z" f={P.casca} m={m} w={2.2} />
    <Reflexo d="M-32 -2 C -30 -18, -22 -30, -12 -36 C -20 -22, -24 -10, -26 4 Z" m={m} o={0.35} />
  </g>
);

const AlhoForma: React.FC<{ m: Modo; x: number; y: number; s: number }> = ({ m, x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Detalhe d="M-8 42 L-11 50 M0 43 L0 52 M8 42 L11 50" m={m} c={P.casca} w={2.2} />
    <Forma d="M0 -48 C 8 -34, 38 -24, 38 4 C 38 30, 20 44, 0 44 C -20 44, -38 30, -38 4 C -38 -24, -8 -34, 0 -48 Z" f={P.alho} m={m} />
    <Detalhe d="M0 -36 C -14 -18, -18 14, -10 42 M0 -36 C 14 -18, 18 14, 10 42 M-4 -38 C -26 -22, -32 10, -24 36 M4 -38 C 26 -22, 32 10, 24 36" m={m} c={P.alhoRisco} w={2} soCor />
    <Forma d="M-3 -46 L-2 -60 L3 -60 L3 -46 Z" f={P.alho} m={m} w={2} />
    <Reflexo d="M-26 0 C -25 -12, -18 -22, -10 -26 C -16 -16, -19 -6, -20 4 Z" m={m} o={0.6} />
  </g>
);

const CebolaAlho: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <CebolaForma m={m} x={78} y={100} s={1.02} />
    <AlhoForma m={m} x={136} y={124} s={1} />
  </g>
);

const Abacate: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-12 100 104)">
    <Forma d="M100 24 C 124 24, 136 50, 140 78 C 146 104, 158 120, 156 146 C 154 172, 130 186, 100 186 C 70 186, 46 172, 44 146 C 42 120, 54 104, 60 78 C 64 50, 76 24, 100 24 Z" f={P.abacate} m={m} />
    <Forma d="M100 38 C 118 38, 126 58, 129 82 C 133 106, 144 122, 142 144 C 140 164, 122 174, 100 174 C 78 174, 60 164, 58 144 C 56 122, 67 106, 71 82 C 74 58, 82 38, 100 38 Z" f={P.polpa} m={m} w={2.2} />
    <Bola cx={100} cy={134} r={24} f={P.caroco} m={m} />
    <Reflexo d="M88 126 a10 10 0 0 1 10 -10 a5 5 0 0 1 -4 6 a6 6 0 0 0 -6 4 Z" m={m} o={0.45} />
  </g>
);

const Cafe: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Detalhe d="M82 58 C 74 48, 90 40, 82 28 M104 58 C 96 48, 112 40, 104 28 M126 58 C 118 48, 134 40, 126 28" m={m} c={cor.tintaSuave} w={3} />
    <Forma d="M30 152 C 30 164, 170 164, 170 152 C 170 144, 30 144, 30 152 Z" f={P.xicara} m={m} />
    <Forma d="M152 92 C 176 92, 176 128, 148 128" f="none" m={m} w={7} />
    <Forma d="M48 76 H152 V112 C 152 138, 132 150, 100 150 C 68 150, 48 138, 48 112 Z" f={P.xicara} m={m} />
    <Forma d="M48 76 C 48 68, 152 68, 152 76 C 152 84, 48 84, 48 76 Z" f={P.cafe} m={m} w={2.2} />
    <Reflexo d="M58 92 h8 v30 h-8 Z" m={m} o={0.0} />
    <Detalhe d="M60 98 C 60 120, 70 132, 82 138" m={m} c={cor.lapisClaro} w={4} soCor />
  </g>
);

const Osso: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-28 100 100)">
    <Forma
      d="M52 84 C 40 70, 20 76, 22 92 C 10 96, 10 116, 26 118 C 28 134, 50 132, 54 116 L146 116 C 150 132, 172 134, 174 118 C 190 116, 190 96, 178 92 C 180 76, 160 70, 148 84 Z"
      f={P.osso}
      m={m}
    />
    <Detalhe d="M60 94 H140" m={m} c={cor.lapisClaro} w={4} soCor />
  </g>
);

const Tigela: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    {[
      [70, 92],
      [88, 84],
      [106, 82],
      [124, 86],
      [140, 94],
      [80, 100],
      [98, 96],
      [116, 98],
      [132, 102],
      [62, 104],
    ].map(([x, y], i) => (
      <Bola key={i} cx={x} cy={y} r={9} f={P.racao} m={m} w={2} />
    ))}
    <Forma d="M34 104 H166 L152 152 C 150 160, 144 164, 136 164 H64 C 56 164, 50 160, 48 152 Z" f={P.tigela} m={m} />
    <Forma d="M28 100 H172 Q178 100 178 106 V110 Q178 116 172 116 H28 Q22 116 22 110 V106 Q22 100 28 100 Z" f={P.tigela} m={m} />
    <Forma d="M88 128 C 88 120, 112 120, 112 128 C 112 136, 88 136, 88 128 Z" f={cor.cartela} m={m} w={2} />
    <Reflexo d="M60 122 h6 v30 h-6 Z" m={m} o={0.3} />
  </g>
);

const Remedio: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <g transform="rotate(-35 92 92)">
      <Forma d="M62 70 H92 V114 H62 C 50 114, 40 104, 40 92 C 40 80, 50 70, 62 70 Z" f={P.capsula} m={m} />
      <Forma d="M92 70 H122 C 134 70, 144 80, 144 92 C 144 104, 134 114, 122 114 H92 Z" f={P.comprimido} m={m} />
      <Reflexo d="M54 80 h30 v6 h-30 Z" m={m} o={0.35} />
    </g>
    <Bola cx={142} cy={148} r={26} f={P.comprimido} m={m} />
    <Detalhe d="M124 148 H160" m={m} w={2.4} />
  </g>
);

const Vacina: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-40 100 100)">
    <Forma d="M92 18 H108 V30 H92 Z" f={cor.tintaSuave} m={m} w={2} />
    <Forma d="M98 30 H102 V52 H98 Z" f={cor.tintaSuave} m={m} w={2} />
    <Forma d="M78 50 H122 V58 H78 Z" f={cor.tintaSuave} m={m} w={2} />
    <Forma d="M84 58 H116 V150 Q116 156 110 156 H90 Q84 156 84 150 Z" f={P.seringa} m={m} />
    <Forma d="M86 104 H114 V150 Q114 154 110 154 H90 Q86 154 86 150 Z" f={P.liquido} m={m} w={0.01} />
    <Detalhe d="M84 76 H96 M84 92 H100 M84 108 H96 M84 124 H100 M84 140 H96" m={m} w={2} />
    <Forma d="M95 156 H105 V166 H95 Z" f={cor.tintaSuave} m={m} w={2} />
    <Detalhe d="M100 166 V190" m={m} w={2.6} />
  </g>
);

const Pata: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M100 98 C 128 98, 148 126, 146 146 C 144 164, 126 166, 100 160 C 74 166, 56 164, 54 146 C 52 126, 72 98, 100 98 Z" f={P.pata} m={m} />
    {[
      [56, 86, -20],
      [84, 60, -6],
      [116, 60, 6],
      [144, 86, 20],
    ].map(([x, y, a], i) => (
      <g key={i} transform={`rotate(${a} ${x} ${y})`}>
        <Forma d={`M${x} ${y - 20} C ${x + 14} ${y - 20}, ${x + 16} ${y + 18}, ${x} ${y + 20} C ${x - 16} ${y + 18}, ${x - 14} ${y - 20}, ${x} ${y - 20} Z`} f={P.pata} m={m} />
      </g>
    ))}
    <Reflexo d="M74 120 C 80 110, 92 106, 100 106 C 92 112, 84 118, 80 128 Z" m={m} o={0.35} />
  </g>
);

const Coracao: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M100 168 C 60 140, 26 112, 26 76 C 26 52, 44 36, 66 36 C 82 36, 94 46, 100 58 C 106 46, 118 36, 134 36 C 156 36, 174 52, 174 76 C 174 112, 140 140, 100 168 Z" f={P.coracao} m={m} />
    <Reflexo d="M48 74 C 48 60, 58 52, 70 52 C 62 58, 56 66, 56 78 Z" m={m} o={0.45} />
  </g>
);

const Telefone: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Detalhe d="M128 50 C 140 54, 148 62, 152 74 M134 30 C 154 36, 168 50, 174 70" m={m} c={cor.tintaSuave} w={4} />
    <Forma
      d="M56 40 L80 36 L92 68 L74 80 C 82 100, 98 116, 118 126 L130 108 L162 120 L158 144 C 156 154, 146 160, 136 158 C 90 150, 50 110, 42 64 C 40 52, 46 42, 56 40 Z"
      f={P.telefone}
      m={m}
    />
    <Reflexo d="M54 56 C 56 50, 62 46, 70 46 L74 58 C 66 58, 60 62, 58 70 Z" m={m} o={0.3} />
  </g>
);

// ---------- desenhos de qualquer assunto ----------
// Mesmo traço e mesmas cores chapadas: servem de metáfora para finanças, saúde, rotina, carreira…

const Q = {
  ouro: "#F2C14E",
  ouroEscuro: "#D69A2D",
  verde: "#8CC9A0",
  verdeEscuro: "#4E9A6E",
  porco: "#F2A7B5",
  porcoEscuro: "#D9798F",
  vidro: "#CDE6F5",
  azul: "#3A3684",
  cinza: "#C9C4D6",
  creme: "#FBF7EF",
  telhado: "#D2385B",
  parede: "#F6DE9C",
  madeira: "#A8673A",
};

const Moeda: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    {/* moeda de trás, deitada */}
    <Forma d="M40 150 C 40 132, 160 132, 160 150 V164 C 160 182, 40 182, 40 164 Z" f={Q.ouroEscuro} m={m} />
    <Forma d="M40 150 C 40 132, 160 132, 160 150 C 160 168, 40 168, 40 150 Z" f={Q.ouro} m={m} />
    {/* moeda da frente, em pé */}
    <Bola cx={104} cy={86} r={62} f={Q.ouroEscuro} m={m} />
    <Bola cx={100} cy={84} r={62} f={Q.ouro} m={m} />
    <Bola cx={100} cy={84} r={46} f="none" m={m} w={2.2} />
    <Detalhe d="M112 62 C 104 56, 84 58, 86 72 C 88 84, 114 82, 114 96 C 114 110, 92 112, 84 104 M100 50 V118" m={m} w={6} />
    <Reflexo d="M58 70 C 60 50, 76 36, 94 32 C 80 42, 70 54, 66 72 Z" m={m} o={0.5} />
  </g>
);

const Dinheiro: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <g transform="rotate(-10 100 110)">
      <Forma d="M28 70 H172 V150 H28 Z" f={Q.verdeEscuro} m={m} />
    </g>
    <g transform="rotate(6 100 100)">
      <Forma d="M24 56 H176 V140 H24 Z" f={Q.verde} m={m} />
      <Forma d="M38 68 H162 V128 H38 Z" f="none" m={m} w={2} />
      <Bola cx={100} cy={98} r={24} f={Q.creme} m={m} w={2.4} />
      <Detalhe d="M106 86 C 100 82, 92 84, 93 92 C 94 99, 107 98, 107 106 C 107 114, 97 115, 92 110 M100 80 V116" m={m} w={3.4} />
      <Bola cx={56} cy={98} r={7} f={Q.verdeEscuro} m={m} w={2} />
      <Bola cx={144} cy={98} r={7} f={Q.verdeEscuro} m={m} w={2} />
    </g>
  </g>
);

const Cofre: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    {/* moeda caindo na fenda */}
    <g transform="rotate(-8 112 38)">
      <Forma d="M96 22 C 96 14, 128 14, 128 22 V48 C 128 56, 96 56, 96 48 Z" f={Q.ouro} m={m} />
    </g>
    {/* pernas */}
    <Forma d="M56 148 H78 V176 Q78 180 74 180 H60 Q56 180 56 176 Z" f={Q.porcoEscuro} m={m} />
    <Forma d="M124 148 H146 V176 Q146 180 142 180 H128 Q124 180 124 176 Z" f={Q.porcoEscuro} m={m} />
    {/* rabo */}
    <Detalhe d="M30 112 C 16 108, 18 92, 30 96 C 38 100, 30 110, 22 104" m={m} c={cor.tinta} w={3} />
    {/* corpo */}
    <Forma d="M34 112 C 34 76, 64 56, 102 56 C 144 56, 172 80, 172 112 C 172 146, 142 164, 102 164 C 62 164, 34 146, 34 112 Z" f={Q.porco} m={m} />
    {/* orelha */}
    <Forma d="M118 60 L134 34 L146 66 Z" f={Q.porcoEscuro} m={m} />
    {/* focinho */}
    <Forma d="M164 100 C 180 100, 186 108, 186 116 C 186 126, 180 132, 164 132 Z" f={Q.porcoEscuro} m={m} />
    <Bola cx={176} cy={112} r={2.6} f={cor.tinta} m={m} w={1} />
    <Bola cx={176} cy={122} r={2.6} f={cor.tinta} m={m} w={1} />
    <Bola cx={146} cy={94} r={5} f={cor.tinta} m={m} w={1} />
    {/* fenda */}
    <Detalhe d="M92 66 H124" m={m} w={6} />
    <Reflexo d="M48 104 C 50 88, 62 76, 78 70 C 66 82, 58 94, 56 108 Z" m={m} o={0.45} />
  </g>
);

const GraficoSeta: React.FC<{ m: Modo; cai?: boolean }> = ({ m, cai }) => {
  const alturas = cai ? [96, 72, 52, 34] : [34, 52, 72, 96];
  return (
    <g>
      <Forma d="M24 30 H176 Q182 30 182 36 V170 Q182 176 176 176 H24 Q18 176 18 170 V36 Q18 30 24 30 Z" f={Q.creme} m={m} />
      <Detalhe d="M34 156 H166" m={m} w={3} />
      {alturas.map((h, i) => (
        <Forma key={i} d={`M${42 + i * 32} ${156 - h} h22 v${h} h-22 Z`} f={[fundos.ceu, fundos.lavanda, fundos.menta, fundos.manteiga][i]} m={m} w={2.2} />
      ))}
      <Detalhe d={cai ? "M40 52 C 80 64, 110 100, 156 128" : "M40 128 C 80 116, 110 80, 156 52"} m={m} c={cai ? cor.carimbo : cor.pode} w={7} />
      <Forma d={cai ? "M138 136 L164 132 L156 108 Z" : "M138 44 L164 48 L156 72 Z"} f={cai ? cor.carimbo : cor.pode} m={m} w={2.4} />
    </g>
  );
};

const Alerta: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M100 24 C 108 24, 112 28, 116 34 L180 150 C 186 162, 180 172, 166 172 H34 C 20 172, 14 162, 20 150 L84 34 C 88 28, 92 24, 100 24 Z" f={Q.ouro} m={m} />
    <Forma d="M92 70 C 92 62, 108 62, 108 70 L104 120 C 104 126, 96 126, 96 120 Z" f={cor.tinta} m={m} w={2} />
    <Bola cx={100} cy={146} r={9} f={cor.tinta} m={m} w={2} />
    <Reflexo d="M78 60 L90 38 C 92 36, 96 36, 94 40 L84 62 Z" m={m} o={0.5} />
  </g>
);

const Lupa: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <g transform="rotate(45 140 140)">
      <Forma d="M128 116 H152 V184 Q152 192 144 192 H136 Q128 192 128 184 Z" f={Q.azul} m={m} />
    </g>
    <Bola cx={86} cy={86} r={58} f={cor.tinta} m={m} />
    <Bola cx={86} cy={86} r={44} f={Q.vidro} m={m} w={2.4} />
    <Reflexo d="M58 80 C 58 64, 70 52, 86 50 C 76 58, 68 68, 66 82 Z" m={m} o={0.8} />
  </g>
);

const Relogio: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M48 50 C 40 34, 60 20, 74 32 Z" f={Q.ouro} m={m} />
    <Forma d="M152 50 C 160 34, 140 20, 126 32 Z" f={Q.ouro} m={m} />
    <Detalhe d="M64 168 L54 184 M136 168 L146 184" m={m} w={6} />
    <Bola cx={100} cy={106} r={70} f={cor.carimbo} m={m} />
    <Bola cx={100} cy={106} r={56} f={Q.creme} m={m} w={2.4} />
    <Detalhe d="M100 58 V66 M100 146 V154 M52 106 H60 M140 106 H148" m={m} w={3} />
    <Detalhe d="M100 106 V74 M100 106 L124 120" m={m} w={6} />
    <Bola cx={100} cy={106} r={5} f={cor.tinta} m={m} w={1} />
  </g>
);

const Calendario: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M34 46 H166 Q174 46 174 54 V168 Q174 176 166 176 H34 Q26 176 26 168 V54 Q26 46 34 46 Z" f={Q.creme} m={m} />
    <Forma d="M34 46 H166 Q174 46 174 54 V84 H26 V54 Q26 46 34 46 Z" f={cor.carimbo} m={m} />
    <Forma d="M58 30 H70 V60 H58 Z M130 30 H142 V60 H130 Z" f={cor.tintaSuave} m={m} w={2} />
    {[0, 1, 2].map((r) =>
      [0, 1, 2, 3].map((c) => (
        <Forma key={`${r}-${c}`} d={`M${44 + c * 30} ${98 + r * 24} h20 v14 h-20 Z`} f={r === 1 && c === 2 ? cor.carimbo : fundos.ceu} m={m} w={1.8} />
      )),
    )}
  </g>
);

const Lampada: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Detalhe d="M100 14 V30 M40 40 L52 52 M160 40 L148 52 M22 96 H38 M162 96 H178" m={m} c={Q.ouroEscuro} w={5} />
    <Forma d="M100 36 C 136 36, 158 62, 158 92 C 158 116, 142 128, 134 142 H66 C 58 128, 42 116, 42 92 C 42 62, 64 36, 100 36 Z" f={Q.ouro} m={m} />
    <Detalhe d="M84 140 V112 C 84 100, 100 100, 100 112 C 100 100, 116 100, 116 112 V140" m={m} c={Q.ouroEscuro} w={3} soCor />
    <Forma d="M66 142 H134 V164 Q134 172 126 172 H74 Q66 172 66 164 Z" f={Q.cinza} m={m} />
    <Detalhe d="M66 152 H134 M66 162 H134" m={m} w={2} />
    <Forma d="M84 172 H116 Q116 186 100 186 Q84 186 84 172 Z" f={cor.tintaSuave} m={m} w={2} />
    <Reflexo d="M60 86 C 60 66, 74 52, 92 48 C 78 58, 70 72, 68 90 Z" m={m} o={0.6} />
  </g>
);

const Livro: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-6 100 100)">
    <Forma d="M40 40 H150 Q162 40 162 52 V164 H52 Q40 164 40 152 Z" f={Q.creme} m={m} />
    <Forma d="M40 40 H150 Q162 40 162 52 V150 H52 Q40 150 40 138 Z" f={Q.azul} m={m} />
    <Forma d="M40 138 Q40 150 52 150 H162 V164 H52 Q40 164 40 152 Z" f={Q.creme} m={m} w={2.2} />
    <Detalhe d="M56 156 H150" m={m} c={cor.lapis} w={2} soCor />
    <Forma d="M70 62 H138 V96 H70 Z" f={Q.ouro} m={m} w={2.2} />
    <Detalhe d="M80 74 H128 M80 84 H116" m={m} w={3} soCor />
    <Forma d="M120 40 H136 V78 L128 70 L120 78 Z" f={cor.carimbo} m={m} w={2} />
  </g>
);

const Documento: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-4 100 100)">
    <Forma d="M46 22 H128 L158 52 V170 Q158 178 150 178 H46 Q38 178 38 170 V30 Q38 22 46 22 Z" f={Q.creme} m={m} />
    <Forma d="M128 22 V46 Q128 52 134 52 H158 Z" f={Q.cinza} m={m} w={2.2} />
    <Detalhe d="M58 66 H112 M58 88 H138 M58 108 H138 M58 128 H118" m={m} c={cor.tintaSuave} w={5} />
    <Bola cx={128} cy={152} r={18} f={cor.carimbo} m={m} w={2.4} />
    <Detalhe d="M120 152 L126 158 L137 145" m={m} c={Q.creme} w={4} soCor />
  </g>
);

const Calculadora: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-6 100 100)">
    <Forma d="M52 18 H148 Q160 18 160 30 V170 Q160 182 148 182 H52 Q40 182 40 170 V30 Q40 18 52 18 Z" f={Q.azul} m={m} />
    <Forma d="M56 34 H144 V72 H56 Z" f={fundos.menta} m={m} w={2.2} />
    <Detalhe d="M124 46 V60 M110 46 V60" m={m} w={3} soCor />
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <Forma key={`${r}-${c}`} d={`M${58 + c * 30} ${86 + r * 30} h22 v20 h-22 Z`} f={c === 2 && r === 2 ? cor.carimbo : Q.creme} m={m} w={2} />
      )),
    )}
  </g>
);

const Casa: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M46 96 H154 V172 H46 Z" f={Q.parede} m={m} />
    <Forma d="M24 102 L100 32 L176 102 L162 112 L100 56 L38 112 Z" f={Q.telhado} m={m} />
    <Forma d="M128 50 H146 V80 L128 64 Z" f={Q.telhado} m={m} w={2.2} />
    <Forma d="M84 122 H116 V172 H84 Z" f={Q.madeira} m={m} />
    <Bola cx={109} cy={148} r={3} f={cor.tinta} m={m} w={1} />
    <Forma d="M58 114 H76 V134 H58 Z M124 114 H142 V134 H124 Z" f={Q.vidro} m={m} w={2.2} />
    <Detalhe d="M30 172 H170" m={m} w={3} />
  </g>
);

const Alvo: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Bola cx={92} cy={108} r={72} f={cor.carimbo} m={m} />
    <Bola cx={92} cy={108} r={52} f={Q.creme} m={m} />
    <Bola cx={92} cy={108} r={32} f={cor.carimbo} m={m} />
    <Bola cx={92} cy={108} r={13} f={Q.creme} m={m} />
    <Detalhe d="M92 108 L168 32" m={m} c={cor.tinta} w={6} />
    <Forma d="M150 30 L170 18 L176 34 L186 40 L170 50 Z" f={Q.ouro} m={m} w={2.2} />
  </g>
);

const Cadeado: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M62 92 V64 C 62 40, 80 26, 100 26 C 120 26, 138 40, 138 64 V92 H122 V64 C 122 50, 112 42, 100 42 C 88 42, 78 50, 78 64 V92 Z" f={Q.cinza} m={m} />
    <Forma d="M44 92 H156 Q164 92 164 100 V170 Q164 178 156 178 H44 Q36 178 36 170 V100 Q36 92 44 92 Z" f={Q.ouro} m={m} />
    <Bola cx={100} cy={128} r={12} f={cor.tinta} m={m} w={1} />
    <Forma d="M95 132 H105 L108 156 H92 Z" f={cor.tinta} m={m} w={1} />
    <Reflexo d="M48 104 h8 v58 h-8 Z" m={m} o={0.4} />
  </g>
);

const Raio: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M118 16 L44 112 H94 L76 186 L158 82 H106 Z" f={Q.ouro} m={m} w={3} />
    <Reflexo d="M106 36 L62 100 H74 Z" m={m} o={0.5} />
  </g>
);

const Dado: React.FC<{ m: Modo }> = ({ m }) => {
  const pontos = (pts: [number, number][]) => pts.map(([x, y], i) => <Bola key={i} cx={x} cy={y} r={8} f={cor.tinta} m={m} w={1} />);
  return (
    <g>
      <g transform="rotate(14 136 136)">
        <Forma d="M102 102 H170 Q178 102 178 110 V170 Q178 178 170 178 H102 Q94 178 94 170 V110 Q94 102 102 102 Z" f={Q.creme} m={m} />
        {pontos([
          [116, 124],
          [156, 156],
        ])}
      </g>
      <g transform="rotate(-12 80 80)">
        <Forma d="M34 32 H124 Q134 32 134 42 V120 Q134 130 124 130 H34 Q24 130 24 120 V42 Q24 32 34 32 Z" f={cor.carimbo} m={m} />
        {[
          [50, 56],
          [108, 56],
          [79, 81],
          [50, 106],
          [108, 106],
        ].map(([x, y], i) => (
          <Bola key={i} cx={x} cy={y} r={9} f={Q.creme} m={m} w={1.6} />
        ))}
      </g>
    </g>
  );
};

const Celular: React.FC<{ m: Modo }> = ({ m }) => (
  <g transform="rotate(-8 100 100)">
    <Forma d="M66 14 H134 Q150 14 150 30 V170 Q150 186 134 186 H66 Q50 186 50 170 V30 Q50 14 66 14 Z" f={Q.azul} m={m} />
    <Forma d="M60 34 H140 V164 H60 Z" f={fundos.menta} m={m} w={2.2} />
    <Detalhe d="M88 24 H112" m={m} c={Q.creme} w={4} soCor />
    <Forma d="M72 50 H128 V82 H72 Z" f={Q.creme} m={m} w={2} />
    <Forma d="M72 94 H128 V126 H72 Z" f={cor.carimbo} m={m} w={2} />
    <Detalhe d="M72 142 H116" m={m} c={cor.tintaSuave} w={5} soCor />
  </g>
);

const Balao: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M44 36 H156 Q180 36 180 60 V116 Q180 140 156 140 H86 L52 172 L58 140 H44 Q20 140 20 116 V60 Q20 36 44 36 Z" f={Q.creme} m={m} />
    <Bola cx={66} cy={88} r={11} f={cor.carimbo} m={m} w={2} />
    <Bola cx={100} cy={88} r={11} f={cor.carimbo} m={m} w={2} />
    <Bola cx={134} cy={88} r={11} f={cor.carimbo} m={m} w={2} />
  </g>
);

const Estrela: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M100 20 L122 72 L178 76 L136 112 L150 168 L100 138 L50 168 L64 112 L22 76 L78 72 Z" f={Q.ouro} m={m} w={3} />
    <Reflexo d="M100 40 L114 74 L102 76 Z" m={m} o={0.55} />
  </g>
);

const Trofeu: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Detalhe d="M58 52 C 24 52, 26 100, 66 104 M142 52 C 176 52, 174 100, 134 104" m={m} c={Q.ouroEscuro} w={8} />
    <Forma d="M54 30 H146 V70 C 146 104, 124 120, 100 120 C 76 120, 54 104, 54 70 Z" f={Q.ouro} m={m} />
    <Forma d="M90 118 H110 V146 H90 Z" f={Q.ouroEscuro} m={m} />
    <Forma d="M62 146 H138 Q144 146 144 152 V176 H56 V152 Q56 146 62 146 Z" f={Q.azul} m={m} />
    <Bola cx={100} cy={70} r={15} f={Q.creme} m={m} w={2} />
    <Reflexo d="M66 40 h8 v34 c 0 8, 2 14, 6 20 c -10 -4, -14 -12, -14 -22 Z" m={m} o={0.45} />
  </g>
);

const Pessoa: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M30 182 C 30 136, 60 112, 100 112 C 140 112, 170 136, 170 182 Z" f={fundos.ceu} m={m} />
    <Forma d="M100 112 L86 140 L100 150 L114 140 Z" f={cor.carimbo} m={m} w={2.2} />
    <Bola cx={100} cy={70} r={42} f={cor.carameloClaro} m={m} />
    <Forma d="M58 66 C 56 38, 76 24, 100 24 C 126 24, 146 40, 142 68 C 132 52, 116 46, 100 48 C 82 50, 66 54, 58 66 Z" f={cor.tintaSuave} m={m} />
    <Bola cx={86} cy={76} r={4} f={cor.tinta} m={m} w={1} />
    <Bola cx={114} cy={76} r={4} f={cor.tinta} m={m} w={1} />
    <Detalhe d="M88 92 C 94 98, 106 98, 112 92" m={m} w={3} />
  </g>
);

const Maleta: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Forma d="M76 60 V44 Q76 34 86 34 H114 Q124 34 124 44 V60 H112 V48 H88 V60 Z" f={Q.madeira} m={m} />
    <Forma d="M36 60 H164 Q174 60 174 70 V164 Q174 174 164 174 H36 Q26 174 26 164 V70 Q26 60 36 60 Z" f={Q.madeira} m={m} />
    <Detalhe d="M26 104 H174" m={m} w={3} />
    <Forma d="M88 96 H112 V116 H88 Z" f={Q.ouro} m={m} w={2.2} />
    <Reflexo d="M36 70 h8 v90 h-8 Z" m={m} o={0.25} />
  </g>
);

const Carrinho: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Detalhe d="M18 40 H44 L66 136 H160" m={m} w={7} />
    <Forma d="M50 60 H176 L160 118 H62 Z" f={fundos.ceu} m={m} />
    <Forma d="M72 40 H104 V62 H72 Z" f={Q.ouro} m={m} w={2.2} />
    <Forma d="M110 30 H146 V62 H110 Z" f={cor.carimbo} m={m} w={2.2} />
    <Detalhe d="M82 60 L90 118 M118 60 L114 118 M150 60 L140 118" m={m} w={2.4} soCor />
    <Bola cx={80} cy={160} r={14} f={cor.tinta} m={m} />
    <Bola cx={146} cy={160} r={14} f={cor.tinta} m={m} />
  </g>
);

const Check: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Bola cx={100} cy={100} r={74} f={cor.pode} m={m} />
    <Detalhe d="M62 102 L90 130 L142 74" m={m} c={Q.creme} w={18} />
    {m.lapis ? <Detalhe d="M62 102 L90 130 L142 74" m={m} w={3} /> : null}
  </g>
);

const Xis: React.FC<{ m: Modo }> = ({ m }) => (
  <g>
    <Bola cx={100} cy={100} r={74} f={cor.carimbo} m={m} />
    <Detalhe d="M68 68 L132 132 M132 68 L68 132" m={m} c={Q.creme} w={18} />
    {m.lapis ? <Detalhe d="M68 68 L132 132 M132 68 L68 132" m={m} w={3} /> : null}
  </g>
);

export const fundoDoDesenho: Record<NomeDesenho, Fundo> = {
  chocolate: "rosa",
  uva: "manteiga",
  "cebola-alho": "menta",
  cebola: "menta",
  alho: "lavanda",
  abacate: "pessego",
  cafe: "ceu",
  osso: "ceu",
  tigela: "manteiga",
  remedio: "ceu",
  vacina: "lavanda",
  pata: "pessego",
  coracao: "rosa",
  telefone: "menta",
  moeda: "ceu",
  dinheiro: "manteiga",
  cofre: "menta",
  "grafico-sobe": "lavanda",
  "grafico-cai": "rosa",
  alerta: "lavanda",
  lupa: "manteiga",
  relogio: "ceu",
  calendario: "menta",
  lampada: "lavanda",
  livro: "pessego",
  documento: "ceu",
  calculadora: "manteiga",
  casa: "ceu",
  alvo: "manteiga",
  cadeado: "lavanda",
  raio: "rosa",
  dado: "ceu",
  celular: "pessego",
  balao: "lavanda",
  estrela: "rosa",
  trofeu: "lavanda",
  pessoa: "manteiga",
  maleta: "menta",
  carrinho: "pessego",
  check: "menta",
  xis: "rosa",
  texto: "manteiga",
};

export const Desenho: React.FC<{
  nome: NomeDesenho;
  tamanho: number;
  lapis?: boolean;
  // desenho "texto": a palavra ou número grande
  texto?: string;
  style?: React.CSSProperties;
}> = ({ nome, tamanho, lapis = false, texto, style }) => {
  const m: Modo = { lapis };
  if (nome === "texto") {
    const t = (texto ?? "?").trim().slice(0, 7);
    // o maior corpo em que a palavra cabe em ~86% da figurinha (medido com a largura da fonte)
    const corpoTexto = Math.round(Math.min(tamanho * 0.62, (tamanho * 0.86) / Math.max(0.3, larguraPalavra(t, 1, TITULO))));
    return (
      <div
        style={{
          width: tamanho,
          height: tamanho,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...titulo(corpoTexto),
          whiteSpace: "nowrap",
          color: lapis ? cor.lapisClaro : cor.tinta,
          ...style,
        }}
      >
        {t}
      </div>
    );
  }
  const corpo = {
    chocolate: <Chocolate m={m} />,
    uva: <Uva m={m} />,
    "cebola-alho": <CebolaAlho m={m} />,
    cebola: <CebolaForma m={m} x={100} y={104} s={1.35} />,
    alho: <AlhoForma m={m} x={100} y={106} s={1.5} />,
    abacate: <Abacate m={m} />,
    cafe: <Cafe m={m} />,
    osso: <Osso m={m} />,
    tigela: <Tigela m={m} />,
    remedio: <Remedio m={m} />,
    vacina: <Vacina m={m} />,
    pata: <Pata m={m} />,
    coracao: <Coracao m={m} />,
    telefone: <Telefone m={m} />,
    moeda: <Moeda m={m} />,
    dinheiro: <Dinheiro m={m} />,
    cofre: <Cofre m={m} />,
    "grafico-sobe": <GraficoSeta m={m} />,
    "grafico-cai": <GraficoSeta m={m} cai />,
    alerta: <Alerta m={m} />,
    lupa: <Lupa m={m} />,
    relogio: <Relogio m={m} />,
    calendario: <Calendario m={m} />,
    lampada: <Lampada m={m} />,
    livro: <Livro m={m} />,
    documento: <Documento m={m} />,
    calculadora: <Calculadora m={m} />,
    casa: <Casa m={m} />,
    alvo: <Alvo m={m} />,
    cadeado: <Cadeado m={m} />,
    raio: <Raio m={m} />,
    dado: <Dado m={m} />,
    celular: <Celular m={m} />,
    balao: <Balao m={m} />,
    estrela: <Estrela m={m} />,
    trofeu: <Trofeu m={m} />,
    pessoa: <Pessoa m={m} />,
    maleta: <Maleta m={m} />,
    carrinho: <Carrinho m={m} />,
    check: <Check m={m} />,
    xis: <Xis m={m} />,
  }[nome];
  return (
    <svg viewBox="0 0 200 200" width={tamanho} height={tamanho} style={{ overflow: "visible", ...style }}>
      {corpo}
    </svg>
  );
};
