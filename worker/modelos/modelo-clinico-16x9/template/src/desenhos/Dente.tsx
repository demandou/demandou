// Dente em corte (molar): esmalte, dentina, polpa, raízes, gengiva e osso — traço de atlas.
// Coordenadas em unidades do desenho (caixa 640 × 760); o componente Anatomia escala para a tela.
import { limitar, misturarCor, prog, Traco } from "../anim";
import type { Acao } from "../plano";
import { cor } from "../tema";

export const CONTORNO =
  "M 220 340 C 202 290 188 225 198 175 C 206 138 225 112 252 110 C 278 108 292 140 320 150 " +
  "C 348 140 362 108 388 110 C 415 112 434 138 442 175 C 452 225 438 290 420 340 " +
  "C 425 420 420 520 400 620 C 392 655 372 660 365 625 C 358 560 350 470 320 440 " +
  "C 290 470 282 560 275 625 C 268 660 248 655 240 620 C 220 520 215 420 220 340 Z";

const ESMALTE =
  "M 220 340 C 202 290 188 225 198 175 C 206 138 225 112 252 110 C 278 108 292 140 320 150 " +
  "C 348 140 362 108 388 110 C 415 112 434 138 442 175 C 452 225 438 290 420 340 " +
  "L 416 322 C 424 270 426 222 420 188 C 412 156 392 138 370 142 C 350 146 336 164 320 172 " +
  "C 304 164 290 146 270 142 C 248 138 228 156 220 188 C 214 222 216 270 224 322 Z";

const JUNCAO =
  "M 224 322 C 216 270 214 222 220 188 C 228 156 248 138 270 142 C 290 146 304 164 320 172 " +
  "C 336 164 350 146 370 142 C 392 138 412 156 420 188 C 426 222 424 270 416 322";

const POLPA =
  "M 282 300 C 278 262 284 232 298 228 C 308 226 312 240 320 242 C 328 240 332 226 342 228 " +
  "C 356 232 362 262 358 300 C 356 330 348 352 340 372 C 352 450 366 550 376 632 L 368 634 " +
  "C 356 552 340 470 320 426 C 300 470 284 552 272 634 L 264 632 C 274 550 288 450 300 372 " +
  "C 292 352 284 330 282 300 Z";

// gengiva atrás do dente; `r` = recuo da margem do lado da escova (direita)
const gengiva = (r: number) =>
  `M 0 352 C 90 338 160 318 206 312 L 434 ${312 + r} C 482 ${318 + r * 0.7} 552 338 640 352 L 640 476 L 0 476 Z`;
const margemEsq = "M 0 352 C 90 338 160 318 206 312";
const margemDir = (r: number) => `M 434 ${312 + r} C 482 ${318 + r * 0.7} 552 338 640 352`;

const OSSO = "M 0 470 C 100 462 170 444 216 436 L 424 436 C 470 444 540 462 640 470 L 640 760 L 0 760 Z";
const CRISTA = "M 0 470 C 100 462 170 444 216 436 M 424 436 C 470 444 540 462 640 470";

// pontos que os rótulos podem apontar, com a direção padrão da linha-guia (px da tela)
export const ALVOS_DENTE: Record<string, { x: number; y: number; dx: number; dy: number }> = {
  gengiva: { x: 578, y: 366, dx: 40, dy: 130 },
  esmalte: { x: 440, y: 190, dx: 120, dy: -40 },
  coroa: { x: 440, y: 190, dx: 120, dy: -40 },
  polpa: { x: 330, y: 270, dx: 170, dy: -60 },
  raiz: { x: 404, y: 560, dx: 110, dy: 30 },
  osso: { x: 520, y: 620, dx: 70, dy: 40 },
};

export const CAIXA_DENTE = { x: 90, y: 92, w: 520, h: 640 };

const ultimo = (acoes: { em: number; acao: Acao }[], nome: Acao) => acoes.filter((a) => a.acao === nome).map((a) => a.em)[0];

export const Dente: React.FC<{
  t: number;
  de: number;
  acoes: { em: number; acao: Acao; alvo?: string }[];
  id: string;
}> = ({ t, de, acoes, id }) => {
  const traco = prog(t, de, 1.0);
  const preenche = prog(t, de + 0.35, 0.7);
  const tecido = prog(t, de + 0.15, 0.8);

  const emEscova = ultimo(acoes, "escova");
  const emPressao = ultimo(acoes, "pressao");
  const emLeve = ultimo(acoes, "leve");
  const emInflama = ultimo(acoes, "inflama");

  // escova: chega, aperta (empurra e esfrega forte) ou desliza leve
  const chegaPedido = emEscova ?? (emPressao !== undefined ? emPressao - 0.55 : emLeve !== undefined ? emLeve - 0.55 : undefined);
  // a escova só chega depois que o dente começou a aparecer
  const chegaEm = chegaPedido !== undefined ? Math.max(chegaPedido, de + 0.45) : undefined;
  const chegada = chegaEm !== undefined ? prog(t, chegaEm, 0.6) : 0;
  const aperto = emPressao !== undefined ? prog(t, emPressao, 0.3) : 0;
  const leve = emLeve !== undefined ? prog(t, emLeve, 0.4) : 0;
  const desde = emPressao ?? emLeve ?? 0;
  const esfrega =
    aperto * 13 * Math.sin((t - desde) * Math.PI * 2 * 2.4) + leve * (1 - aperto) * 6 * Math.sin((t - desde) * Math.PI * 2 * 1.3);
  const inflama = emInflama !== undefined ? prog(t, emInflama, 0.7) : 0;
  const recuo = 16 * inflama;

  const corGengiva = misturarCor(cor.tecido, cor.vermelhoVeu, inflama);
  const linhaGengiva = misturarCor(cor.cinzaLinha, cor.vermelho, inflama);

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-h`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.1" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.24" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-v`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0.8" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.95" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-mh`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="760">
          <rect x="0" y="0" width="640" height="760" fill={`url(#${id}-h)`} />
        </mask>
        <mask id={`${id}-mv`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="760">
          <rect x="0" y="0" width="640" height="760" fill={`url(#${id}-v)`} />
        </mask>
        <pattern id={`${id}-osso`} width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="7" r="2.6" fill={cor.cinzaLinha} opacity="0.55" />
          <circle cx="19" cy="18" r="3.4" fill="none" stroke={cor.cinzaLinha} strokeWidth="1.6" opacity="0.5" />
        </pattern>
      </defs>

      {/* tecidos em volta: gengiva e osso, que somem nas bordas (é um corte) */}
      <g mask={`url(#${id}-mv)`}>
        <g mask={`url(#${id}-mh)`} opacity={tecido}>
          <path d={gengiva(recuo)} fill={corGengiva} />
          <path d={OSSO} fill="#E9EDF3" />
          <path d={OSSO} fill={`url(#${id}-osso)`} />
          <Traco d={CRISTA} p={traco} cor={cor.cinzaLinha} largura={3} />
          <Traco d={margemEsq} p={traco} cor={cor.cinzaLinha} largura={3.5} />
          <Traco d={margemDir(recuo)} p={traco} cor={linhaGengiva} largura={3.5 + inflama} />
        </g>

        {/* o dente: dentina (azul claro), esmalte (branco), polpa, contorno */}
        <path d={CONTORNO} fill={cor.azulClaro} opacity={preenche} />
        <path d={ESMALTE} fill={cor.branco} opacity={preenche} />
        <path d={POLPA} fill="#B9CCE8" opacity={preenche} />
        <Traco d={JUNCAO} p={limitar((traco - 0.3) / 0.7)} cor={cor.azul} largura={2.2} strokeOpacity={0.55} />
        <Traco d={POLPA} p={limitar((traco - 0.4) / 0.6)} cor={cor.azul} largura={2.2} strokeOpacity={0.6} />
        <Traco d={CONTORNO} p={traco} cor={cor.azul} largura={4.5} />
      </g>

      {/* irritação na gengiva: traços curtos que se desenham */}
      {inflama > 0
        ? [
            [468, 328, 474, 312],
            [492, 334, 502, 320],
            [516, 340, 530, 330],
          ].map(([x1, y1, x2, y2], i) => (
            <Traco
              key={i}
              d={`M ${x1} ${y1 + recuo * 0.6} L ${x2} ${y2 + recuo * 0.6}`}
              p={limitar(inflama * 1.6 - i * 0.2)}
              cor={cor.vermelho}
              largura={3.5}
            />
          ))
        : null}

      {chegada > 0 ? <EscovaLado chegada={chegada} aperto={aperto} esfrega={esfrega} t={t} desde={desde} /> : null}
    </g>
  );
};

// Escova vista de lado, inclinada para a linha da gengiva (do lado direito do dente)
const EscovaLado: React.FC<{ chegada: number; aperto: number; esfrega: number; t: number; desde: number }> = ({
  chegada,
  aperto,
  esfrega,
  t,
  desde,
}) => {
  const ang = -16;
  const rad = (ang * Math.PI) / 180;
  // entra de fora, na direção do cabo; ao apertar, avança mais 22 unidades
  const avanco = (1 - chegada) * 320 - aperto * 22;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);
  const px = 448 + dirX * avanco - Math.sin(rad) * esfrega;
  const py = 306 + dirY * avanco + Math.cos(rad) * esfrega;
  const cerdas = Array.from({ length: 9 }, (_, i) => -72 + i * 18);
  return (
    <g transform={`translate(${px} ${py}) rotate(${ang})`} opacity={limitar(chegada * 2)}>
      {/* cerdas: com força, entortam e abrem */}
      {cerdas.map((y, i) => {
        const abre = aperto * 13 * (y / 72);
        const dobra = aperto * 14;
        return (
          <path
            key={i}
            d={`M 58 ${y} Q ${26} ${y + abre * 0.3} ${dobra} ${y + abre}`}
            fill="none"
            stroke={cor.cinza}
            strokeWidth={4.2}
            strokeLinecap="round"
          />
        );
      })}
      {/* cabeça e cabo */}
      <rect x={56} y={-92} width={44} height={184} rx={20} fill={cor.branco} stroke={cor.azul} strokeWidth={4.5} />
      <path d="M 100 -16 L 300 -22 Q 316 -22 316 -8 L 316 8 Q 316 22 300 22 L 100 16 Z" fill={cor.branco} stroke={cor.azul} strokeWidth={4.5} strokeLinejoin="round" />
      {/* força: três setas que acendem em sequência atrás da cabeça */}
      {aperto > 0
        ? [0, 1, 2].map((k) => {
            const onda = 0.35 + 0.65 * Math.max(0, Math.sin((t - desde) * Math.PI * 2 * 1.6 - k * 0.9));
            return (
              <path
                key={k}
                d={`M ${150 + k * 40} -40 L ${128 + k * 40} 0 L ${150 + k * 40} 40`}
                transform="translate(0 -62)"
                fill="none"
                stroke={cor.vermelho}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={aperto * onda}
              />
            );
          })
        : null}
    </g>
  );
};
