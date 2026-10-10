// Cérebro visto de lado (frente para a esquerda), traço de atlas: lobos frontal, parietal, occipital e
// temporal, cerebelo, tronco e a amígdala por dentro. Serve de metáfora para qualquer assunto que passa
// pela cabeça: decisão e critério (frontal), emoção e impulso (amígdala), memória (temporal), visão
// (occipital), coordenação e treino (cerebelo).
// "destaca" (com alvo) = a região acende em vermelho e pulsa (o problema); "alivia" = a mesma região fica azul
// e para de pulsar; "acende" = a região ganha azul (ativa, o certo).
// Coordenadas em unidades do desenho (caixa 640 × 520).
import { misturarCor, prog, Traco } from "../anim";
import type { Acao } from "../plano";
import { cor } from "../tema";

export const CAIXA_CEREBRO = { x: -30, y: -40, w: 700, h: 580 };

const CONTORNO =
  "M 120 318 C 82 286 70 214 104 160 C 140 100 214 62 300 56 C 392 50 478 74 536 128 " +
  "C 584 172 604 238 590 290 C 580 328 552 346 520 350 C 488 354 466 346 446 352 " +
  "C 410 380 350 400 290 396 C 230 392 186 368 170 340 C 158 328 140 330 120 318 Z";

const CEREBELO = "M 446 360 C 452 334 520 328 560 342 C 596 356 594 402 560 420 C 520 440 456 432 440 406 C 432 392 436 374 446 360 Z";
const FOLHAS = ["M 456 372 C 490 360 540 360 578 372", "M 452 390 C 490 380 545 382 584 392", "M 458 408 C 494 402 540 404 574 410"];
const TRONCO = "M 392 376 C 398 412 404 446 410 488 L 448 488 C 448 446 452 412 462 380";
const CENTRAL = "M 334 56 C 320 120 330 190 300 284";
const LATERAL = "M 160 316 C 230 296 300 284 384 262";
const PARIETO = "M 500 96 C 486 150 490 200 470 240";
// dobras (giros), traço fino e claro
const GIROS = [
  "M 112 210 C 140 192 166 222 198 202",
  "M 140 142 C 166 126 190 152 220 132",
  "M 124 262 C 158 244 186 272 222 252",
  "M 214 92 C 232 118 258 100 276 126",
  "M 200 160 C 226 146 246 172 272 156",
  "M 228 222 C 252 204 274 230 296 210",
  "M 178 300 C 200 282 224 296 246 284",
  "M 352 86 C 372 110 400 92 420 116",
  "M 350 150 C 376 132 398 160 426 142",
  "M 344 214 C 368 196 392 222 418 204",
  "M 440 92 C 456 112 474 104 486 122",
  "M 430 176 C 448 196 466 186 478 206",
  "M 516 150 C 536 172 552 162 568 186",
  "M 506 214 C 528 200 548 222 572 210",
  "M 500 280 C 520 262 544 284 566 268",
  "M 204 344 C 236 330 266 350 300 334",
  "M 316 370 C 346 354 376 370 404 354",
  "M 250 372 C 280 362 300 380 330 372",
  "M 404 300 C 420 288 436 300 450 292",
];

// regiões (passam do contorno; o recorte pelo contorno dá a forma do lobo)
const REGIOES: Record<string, string> = {
  frontal: "M -50 -50 L 334 -50 L 334 56 C 320 120 330 190 300 284 C 260 290 210 300 160 316 L -50 420 Z",
  parietal: "M 334 -50 L 334 56 C 320 120 330 190 300 284 C 330 278 360 270 384 262 L 474 268 L 470 240 C 490 200 486 150 500 96 L 520 -50 Z",
  occipital: "M 520 -50 L 500 96 C 486 150 490 200 470 240 L 474 268 L 448 356 L 720 420 L 720 -50 Z",
  temporal: "M 160 316 C 230 296 300 284 384 262 L 474 268 L 448 356 L 300 440 L 60 420 Z",
};
// limite (fino) entre o temporal e o occipital
const PREOCCIPITAL = "M 474 268 C 466 300 456 330 448 354";

// pontos que os rótulos podem apontar (unidades do desenho) e a direção padrão da linha-guia (px da tela)
export const ALVOS_CEREBRO: Record<string, { x: number; y: number; dx: number; dy: number }> = {
  frontal: { x: 180, y: 170, dx: 30, dy: -175 },
  parietal: { x: 410, y: 140, dx: 40, dy: -165 },
  occipital: { x: 546, y: 230, dx: 40, dy: -200 },
  temporal: { x: 318, y: 336, dx: 60, dy: 210 },
  amigdala: { x: 262, y: 322, dx: -40, dy: 240 },
  cerebelo: { x: 524, y: 394, dx: 30, dy: 150 },
  tronco: { x: 428, y: 452, dx: -30, dy: 110 },
};
// nomes do dia a dia para os mesmos lugares
const SINONIMOS: Record<string, string> = {
  decisao: "frontal",
  razao: "frontal",
  testa: "frontal",
  emocao: "amigdala",
  impulso: "amigdala",
  medo: "amigdala",
  memoria: "temporal",
  visao: "occipital",
  movimento: "cerebelo",
  equilibrio: "cerebelo",
  sentidos: "parietal",
};
export const alvoDoCerebro = (nome: string) => ALVOS_CEREBRO[SINONIMOS[nome] ?? nome];
for (const [apelido, real] of Object.entries(SINONIMOS)) ALVOS_CEREBRO[apelido] = ALVOS_CEREBRO[real];

const AMIGDALA = "M 236 322 C 240 308 270 306 284 316 C 294 326 284 338 266 338 C 248 338 234 334 236 322 Z";

type Acoes = { em: number; acao: Acao; alvo?: string }[];

export const Cerebro: React.FC<{ t: number; de: number; acoes: Acoes; id: string }> = ({ t, de, acoes, id }) => {
  const traco = prog(t, de, 1.1);
  const preenche = prog(t, de + 0.4, 0.7);
  const detalhes = prog(t, de + 0.6, 0.8);
  // região → quando acendeu (vermelho), aliviou (azul) ou ativou (azul claro)
  const nomeReal = (a?: string) => (a ? (SINONIMOS[a] ?? a) : undefined);
  const regioes = [...new Set(acoes.filter((a) => a.alvo && ["destaca", "alivia", "acende"].includes(a.acao)).map((a) => nomeReal(a.alvo) as string))];
  return (
    <g>
      <defs>
        <clipPath id={`${id}-cer`}>
          <path d={CONTORNO} />
        </clipPath>
      </defs>
      {/* preenchimento claro e dobras */}
      <path d={CONTORNO} fill={cor.branco} opacity={preenche} />
      <path d={CEREBELO} fill={cor.azulClaro} opacity={preenche * 0.7} />
      <g clipPath={`url(#${id}-cer)`}>
        {regioes.map((r) => {
          const forma = REGIOES[r];
          const destaca = acoes.find((a) => nomeReal(a.alvo) === r && a.acao === "destaca")?.em;
          const alivia = acoes.find((a) => nomeReal(a.alvo) === r && a.acao === "alivia")?.em;
          const acende = acoes.find((a) => nomeReal(a.alvo) === r && a.acao === "acende")?.em;
          const liga = prog(t, Math.min(destaca ?? 99, acende ?? 99, alivia ?? 99), 0.5);
          const calma = alivia !== undefined ? prog(t, alivia, 0.6) : acende !== undefined && destaca === undefined ? 1 : 0;
          const fundo = misturarCor(cor.vermelhoVeu, cor.azulClaro, calma);
          if (!forma) return null;
          return <path key={r} d={forma} fill={fundo} opacity={liga * 0.95} />;
        })}
      </g>
      {/* regiões que não são lobos: cerebelo e amígdala acendem na própria forma */}
      {regioes
        .filter((r) => r === "cerebelo" || r === "amigdala")
        .map((r) => {
          const destaca = acoes.find((a) => nomeReal(a.alvo) === r && a.acao === "destaca")?.em;
          const alivia = acoes.find((a) => nomeReal(a.alvo) === r && a.acao === "alivia")?.em;
          const acende = acoes.find((a) => nomeReal(a.alvo) === r && a.acao === "acende")?.em;
          const liga = prog(t, Math.min(destaca ?? 99, acende ?? 99, alivia ?? 99), 0.5);
          const calma = alivia !== undefined ? prog(t, alivia, 0.6) : acende !== undefined && destaca === undefined ? 1 : 0;
          return (
            <path
              key={r}
              d={r === "cerebelo" ? CEREBELO : AMIGDALA}
              fill={misturarCor(cor.vermelhoVeu, cor.azulClaro, calma)}
              stroke={misturarCor(cor.vermelho, cor.azul, calma)}
              strokeWidth={4.5}
              opacity={liga}
            />
          );
        })}
      <g opacity={detalhes}>
        {GIROS.map((d, i) => (
          <Traco key={i} d={d} p={prog(t, de + 0.6 + i * 0.04, 0.5)} cor={cor.azul} largura={3} opacity={0.5} />
        ))}
        {FOLHAS.map((d, i) => (
          <Traco key={`f${i}`} d={d} p={prog(t, de + 0.7 + i * 0.05, 0.5)} cor={cor.azul} largura={2.5} opacity={0.55} />
        ))}
        <path d={AMIGDALA} fill="none" stroke={cor.azul} strokeWidth={2.5} strokeDasharray="5 6" opacity={0.6} />
      </g>
      {/* sulcos principais e contornos */}
      <Traco d={CENTRAL} p={prog(t, de + 0.45, 0.6)} cor={cor.azul} largura={3.5} />
      <Traco d={LATERAL} p={prog(t, de + 0.5, 0.6)} cor={cor.azul} largura={3.5} />
      <Traco d={PARIETO} p={prog(t, de + 0.55, 0.6)} cor={cor.azul} largura={3} opacity={0.7} />
      <Traco d={PREOCCIPITAL} p={prog(t, de + 0.6, 0.5)} cor={cor.azul} largura={2.5} opacity={0.5} />
      <Traco d={TRONCO} p={prog(t, de + 0.3, 0.7)} cor={cor.azul} largura={5} />
      <Traco d={CEREBELO} p={prog(t, de + 0.25, 0.8)} cor={cor.azul} largura={5} />
      <Traco d={CONTORNO} p={traco} cor={cor.azul} largura={5.5} />
      {/* pulso nas regiões em alerta */}
      {regioes.map((r) => {
        const a = ALVOS_CEREBRO[r];
        const destaca = acoes.find((x) => nomeReal(x.alvo) === r && x.acao === "destaca")?.em;
        const alivia = acoes.find((x) => nomeReal(x.alvo) === r && x.acao === "alivia")?.em;
        if (!a || destaca === undefined) return null;
        const liga = prog(t, destaca, 0.4);
        const calma = alivia !== undefined ? prog(t, alivia, 0.6) : 0;
        const fase = ((t - destaca) * 1.1) % 1;
        if (liga <= 0 || calma >= 1) return null;
        return (
          <circle key={`p${r}`} cx={a.x} cy={a.y} r={30 + 46 * fase} fill="none" stroke={cor.vermelho} strokeWidth={3} opacity={(1 - fase) * liga * (1 - calma)} />
        );
      })}
    </g>
  );
};
