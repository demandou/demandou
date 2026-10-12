// O rosto desenhado: ilustração a traço fino, simétrica, construída como um espelho
// (cada traço da metade esquerda tem o reflexo na direita e os dois se desenham juntos, do centro
// para fora). Sobre ele: linhas de mapeamento facial, áreas que acendem com pontilhado dourado,
// pontos numerados e dois efeitos com significado (músculo que relaxa, volume que volta).
//
// Coordenadas próprias: caixa de 400 × 540, eixo de simetria em x = 200.
import { useMemo } from "react";
import { entra, mistura, prog, Traco } from "../anim";
import type { Area } from "../plano";
import { cor, sans } from "../tema";

export const ROSTO_W = 400;
export const ROSTO_H = 540;
export const ROSTO_OLHOS = 236;
// alturas dos terços do rosto (linha do cabelo, sobrancelhas, base do nariz, queixo)
export const TERCOS = [76, 186, 358, 488];

// ---------- espelhamento dos traços ----------
const espelharX = (x: number) => ROSTO_W - x;
export const espelhar = (d: string) => {
  const partes = d.match(/[MLCQZ]|-?\d+(\.\d+)?/g) ?? [];
  let eixoX = true;
  return partes
    .map((p) => {
      if (/[MLCQZ]/.test(p)) {
        eixoX = true;
        return p;
      }
      const v = Number(p);
      const r = eixoX ? espelharX(v) : v;
      eixoX = !eixoX;
      return String(Number(r.toFixed(2)));
    })
    .join(" ");
};

// ---------- a metade esquerda do rosto ----------
type Parte = { d: string; peso: "contorno" | "detalhe" | "fino"; ordem: number; dur: number; opacidade?: number };
const METADE: Parte[] = [
  // contorno do rosto: têmpora → maçã → mandíbula → queixo
  { d: "M 60 176 C 56 226 58 270 66 306 C 76 358 100 408 136 446 C 160 470 180 484 200 486", peso: "contorno", ordem: 0, dur: 0.75 },
  // linha do cabelo
  { d: "M 200 76 C 150 74 100 92 76 134 C 66 150 61 164 60 176", peso: "contorno", ordem: 0.05, dur: 0.6 },
  // cabelo preso (silhueta de fora) e mechas que saem da risca do meio
  { d: "M 200 16 C 124 16 58 56 44 136 C 38 172 38 204 42 234", peso: "detalhe", ordem: 0.15, dur: 0.7 },
  { d: "M 198 24 C 156 28 104 50 76 100", peso: "fino", ordem: 0.3, dur: 0.55, opacidade: 0.6 },
  { d: "M 196 44 C 160 48 118 64 94 98", peso: "fino", ordem: 0.36, dur: 0.5, opacidade: 0.5 },
  { d: "M 150 22 C 108 34 70 70 54 124", peso: "fino", ordem: 0.42, dur: 0.5, opacidade: 0.45 },
  // orelha
  { d: "M 46 230 C 30 224 24 254 30 280 C 34 298 46 308 62 306", peso: "detalhe", ordem: 0.3, dur: 0.5 },
  { d: "M 44 248 C 38 258 40 272 48 280", peso: "fino", ordem: 0.45, dur: 0.35, opacidade: 0.7 },
  // pescoço
  { d: "M 140 456 C 138 488 136 516 132 540", peso: "detalhe", ordem: 0.35, dur: 0.5 },
  // sobrancelha
  { d: "M 86 194 C 108 178 142 174 172 184", peso: "contorno", ordem: 0.3, dur: 0.45 },
  // olho: pálpebra de cima, de baixo e a dobra
  { d: "M 94 238 C 108 222 148 219 166 234", peso: "detalhe", ordem: 0.38, dur: 0.4 },
  { d: "M 94 238 C 112 251 146 252 166 234", peso: "fino", ordem: 0.45, dur: 0.4 },
  { d: "M 100 226 C 116 212 146 210 162 222", peso: "fino", ordem: 0.5, dur: 0.4, opacidade: 0.55 },
  // cílios no canto de fora
  { d: "M 99 232 L 89 226", peso: "fino", ordem: 0.62, dur: 0.2 },
  { d: "M 105 228 L 97 219", peso: "fino", ordem: 0.64, dur: 0.2 },
  { d: "M 112 225 L 107 215", peso: "fino", ordem: 0.66, dur: 0.2 },
  // nariz: dorso (suave), asa e base
  { d: "M 178 204 C 180 246 178 292 168 326", peso: "fino", ordem: 0.4, dur: 0.45, opacidade: 0.55 },
  { d: "M 168 326 C 156 336 158 352 174 356", peso: "detalhe", ordem: 0.55, dur: 0.35 },
  { d: "M 174 356 C 184 351 192 358 200 358", peso: "detalhe", ordem: 0.62, dur: 0.3 },
  // boca: contorno de cima (arco do cupido), linha da boca e lábio de baixo
  { d: "M 148 412 C 162 405 176 397 189 397 C 195 397 198 400 200 402", peso: "detalhe", ordem: 0.55, dur: 0.4 },
  { d: "M 146 413 C 164 416 184 417 200 417", peso: "detalhe", ordem: 0.6, dur: 0.35 },
  { d: "M 150 415 C 162 430 180 438 200 438", peso: "fino", ordem: 0.66, dur: 0.35 },
  { d: "M 193 370 C 192 380 190 390 189 397", peso: "fino", ordem: 0.7, dur: 0.25, opacidade: 0.5 },
  // sulco do nariz à boca e maçã (bem suaves)
  { d: "M 164 350 C 150 368 144 388 147 406", peso: "fino", ordem: 0.7, dur: 0.35, opacidade: 0.4 },
  { d: "M 80 294 C 94 306 108 312 126 312", peso: "fino", ordem: 0.72, dur: 0.35, opacidade: 0.35 },
];

// ---------- áreas ----------
// forma (rosto inteiro), ponto de ancoragem no rosto e onde fica o número (fora do rosto)
type DefArea = { forma: string; ponto: [number, number]; marca: [number, number]; faixa?: boolean };
const elipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 0.552} ${cx - rx * 0.552} ${cy - ry} ${cx} ${cy - ry} C ${cx + rx * 0.552} ${cy - ry} ${cx + rx} ${cy - ry * 0.552} ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * 0.552} ${cx + rx * 0.552} ${cy + ry} ${cx} ${cy + ry} C ${cx - rx * 0.552} ${cy + ry} ${cx - rx} ${cy + ry * 0.552} ${cx - rx} ${cy} Z`;
const par = (metade: string) => `${metade} ${espelhar(metade)}`;

const OLHEIRA = "M 96 247 C 112 262 148 263 166 244 C 162 264 150 278 128 280 C 110 278 100 266 96 247 Z";
const CONTORNO = "M 66 306 C 76 358 100 408 136 446 C 160 470 180 484 200 486";

export const AREAS: Record<Area, DefArea> = {
  testa: {
    forma: "M 90 174 C 84 138 112 96 200 90 C 288 96 316 138 310 174 C 272 166 228 168 200 172 C 172 168 128 166 90 174 Z",
    ponto: [150, 128],
    marca: [36, 62],
  },
  glabela: { forma: elipse(200, 200, 15, 24), ponto: [200, 204], marca: [362, 96] },
  pesDeGalinha: { forma: par(elipse(76, 240, 15, 26)), ponto: [78, 244], marca: [10, 190] },
  olheiras: { forma: par(OLHEIRA), ponto: [118, 268], marca: [18, 338] },
  macas: { forma: par(elipse(106, 300, 38, 24)), ponto: [296, 304], marca: [384, 332] },
  nariz: { forma: "M 186 210 C 190 260 188 310 176 336 C 184 356 216 356 224 336 C 212 310 210 260 214 210 Z", ponto: [214, 318], marca: [306, 270] },
  bigodeChines: { forma: par("M 160 346 C 146 366 140 390 144 410 L 154 410 C 152 392 156 370 168 352 Z"), ponto: [250, 384], marca: [372, 404] },
  labios: {
    forma: "M 146 413 C 160 404 176 396 190 396 C 195 396 198 400 200 402 C 202 400 205 396 210 396 C 224 396 240 404 254 413 C 240 430 220 440 200 440 C 180 440 160 430 146 413 Z",
    ponto: [236, 424],
    marca: [340, 482],
  },
  queixo: { forma: elipse(200, 468, 44, 22), ponto: [200, 474], marca: [300, 530] },
  contorno: { forma: `${CONTORNO} ${espelhar(CONTORNO)}`, ponto: [90, 400], marca: [30, 446], faixa: true },
};

// pontos de mapeamento (metade esquerda + centro) e as ligações tracejadas entre eles
const PONTOS: Record<string, [number, number]> = {
  testa: [200, 112],
  sobr: [118, 181],
  olhoFora: [94, 238],
  olhoDentro: [166, 234],
  maca: [72, 300],
  asa: [164, 342],
  nariz: [200, 358],
  boca: [146, 413],
  mand: [100, 424],
  queixo: [200, 488],
};
const LIGACOES: [string, string][] = [
  ["testa", "sobr"],
  ["sobr", "olhoFora"],
  ["olhoFora", "maca"],
  ["maca", "mand"],
  ["mand", "queixo"],
  ["maca", "boca"],
  ["boca", "queixo"],
  ["olhoDentro", "nariz"],
  ["asa", "boca"],
  ["sobr", "olhoDentro"],
];

// rugas da testa (onda que alisa) e fibras do músculo frontal (que se esticam)
const ruga = (y: number, x0: number, x1: number, amp: number) => {
  const n = 6;
  const passo = (x1 - x0) / n;
  let d = `M ${x0} ${y}`;
  for (let i = 0; i < n; i++) {
    const xa = x0 + passo * (i + 0.5);
    const xb = x0 + passo * (i + 1);
    d += ` Q ${xa.toFixed(1)} ${(y + (i % 2 === 0 ? -amp : amp)).toFixed(1)} ${xb.toFixed(1)} ${y}`;
  }
  return d;
};
const fibra = (i: number, amp: number) => {
  const xTopo = 104 + i * 12;
  const xBase = 118 + i * 8.6;
  const topo = 104 + Math.max(0, 176 - xTopo) * 0.34;
  const base = 174;
  const meio = (topo + base) / 2;
  const xm = (xTopo + xBase) / 2;
  return `M ${xTopo} ${topo} Q ${xTopo + amp} ${(topo + meio) / 2} ${xm} ${meio} Q ${xBase - amp} ${(meio + base) / 2} ${xBase} ${base}`;
};

// curvas de nível do volume: anéis concêntricos que crescem
const CENTROS_VOLUME: { c: [number, number]; r: [number, number] }[] = [
  { c: [106, 302], r: [42, 27] },
  { c: [294, 302], r: [42, 27] },
  { c: [200, 420], r: [62, 28] },
];

export type EstadoArea = { area: Area; em: number; numero?: number };

export const Rosto: React.FC<{
  t: number;
  // quando o desenho começa (traços do centro para fora)
  desenhoEm: number;
  // áreas acesas, cada uma no seu tempo (a mais recente fica em foco)
  areas?: EstadoArea[];
  efeito?: { tipo: "relaxar" | "volume"; em: number; inicioEm?: number };
  // pontos e ligações do mapeamento
  mapeamentoEm?: number;
  // desenho estático, sem entrada (rostinho da comparação)
  pronto?: boolean;
  // espessura dos traços multiplicada (o rostinho pequeno precisa de traços mais grossos)
  peso?: number;
  // números nas marcas (o rostinho não tem)
  numeros?: boolean;
  escala: number;
  // fade geral (saída)
  opacidade?: number;
}> = ({ t, desenhoEm, areas = [], efeito, mapeamentoEm, pronto, peso = 1, numeros = true, escala, opacidade = 1 }) => {
  const larguras = { contorno: 3.4 * peso, detalhe: 2.6 * peso, fino: 2 * peso };
  const id = useMemo(() => `r${Math.round(desenhoEm * 1000)}-${Math.round(escala * 100)}`, [desenhoEm, escala]);

  // ---- efeito "relaxar": amplitude das rugas e das fibras
  const relaxa = efeito?.tipo === "relaxar" ? prog(t, efeito.em, 1.0) : 0;
  const fibrasEm = efeito?.tipo === "relaxar" ? (efeito.inicioEm ?? efeito.em - 1.1) : 0;
  const pFibras = efeito?.tipo === "relaxar" ? prog(t, fibrasEm, 0.7) : 0;
  const ampRuga = mistura(4.2, 0, relaxa);
  const ampFibra = mistura(5, 0, relaxa);

  // ---- efeito "volume": anéis
  const volume = efeito?.tipo === "volume" ? efeito.em : null;

  // área em foco = a última que acendeu
  const acesas = areas.filter((a) => t >= a.em - 0.02).sort((a, b) => a.em - b.em);
  const foco = acesas[acesas.length - 1];

  const mapa = mapeamentoEm !== undefined ? prog(t, mapeamentoEm, 0.8) : 0;
  const mapaApaga = acesas.length ? mistura(1, 0.6, prog(t, acesas[0].em, 0.5)) : 1;

  return (
    <svg
      width={ROSTO_W * escala}
      height={ROSTO_H * escala}
      viewBox={`0 0 ${ROSTO_W} ${ROSTO_H}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: opacidade }}
    >
      <defs>
        <pattern id={`${id}-pont`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r={1.25 * Math.min(1.6, peso)} fill={cor.ouro} />
        </pattern>
      </defs>

      {/* áreas que acendem: véu dourado + pontilhado, revelados em círculo a partir do ponto */}
      {acesas.map((a) => {
        const def = AREAS[a.area];
        const p = pronto ? 1 : prog(t, a.em, 0.7);
        const emFoco = pronto || a === foco;
        const raio = mistura(4, 190, p);
        const clip = `${id}-c-${a.area}`;
        return (
          <g key={a.area} opacity={emFoco ? 1 : 0.62}>
            <clipPath id={clip}>
              <circle cx={def.ponto[0]} cy={def.ponto[1]} r={raio} />
              {/* o reflexo da área (lado direito) acende junto */}
              <circle cx={espelharX(def.ponto[0])} cy={def.ponto[1]} r={raio} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>
              {def.faixa ? (
                <>
                  <path d={def.forma} fill="none" stroke={cor.ouroVeu} strokeWidth={26} strokeLinecap="round" />
                  <path d={def.forma} fill="none" stroke={`url(#${id}-pont)`} strokeWidth={22} strokeLinecap="round" />
                  <path d={def.forma} fill="none" stroke={cor.ouro} strokeWidth={larguras.detalhe} strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d={def.forma} fill={cor.ouroVeu} />
                  <path d={def.forma} fill={`url(#${id}-pont)`} />
                  <path d={def.forma} fill="none" stroke={cor.ouro} strokeWidth={larguras.fino} strokeDasharray="5 5" />
                </>
              )}
            </g>
          </g>
        );
      })}

      {/* efeito volume: curvas de nível que crescem */}
      {volume !== null
        ? CENTROS_VOLUME.flatMap((v, i) =>
            [1, 0.7, 0.42].map((f, k) => {
              const p = prog(t, volume + i * 0.1 + k * 0.14, 0.9);
              if (p <= 0) return null;
              const s = mistura(0.25, 1, p) * f;
              return (
                <path
                  key={`v${i}-${k}`}
                  d={elipse(v.c[0], v.c[1], v.r[0] * s, v.r[1] * s)}
                  fill="none"
                  stroke={cor.ouro}
                  strokeWidth={larguras.fino}
                  opacity={mistura(0, 0.95, p) * (k === 0 ? 1 : 0.8)}
                />
              );
            }),
          )
        : null}

      {/* os traços do rosto, metade e reflexo juntos */}
      {METADE.map((parte, i) => {
        const p = pronto ? 1 : prog(t, desenhoEm + parte.ordem * 0.9, parte.dur, entra);
        const larg = larguras[parte.peso];
        return (
          <g key={i} opacity={parte.opacidade ?? 1}>
            <Traco d={parte.d} p={p} cor={cor.cafe} largura={larg} />
            <Traco d={espelhar(parte.d)} p={p} cor={cor.cafe} largura={larg} />
          </g>
        );
      })}
      {/* íris */}
      {[130, espelharX(130)].map((x) => {
        const p = pronto ? 1 : prog(t, desenhoEm + 0.55, 0.4);
        return (
          <g key={x} opacity={p}>
            <circle cx={x} cy={235} r={11.5} fill="none" stroke={cor.cafe} strokeWidth={larguras.fino} />
            <circle cx={x} cy={235} r={4.2} fill={cor.cafe} />
          </g>
        );
      })}

      {/* rugas da testa (existem desde o começo; alisam no efeito "relaxar") */}
      {efeito?.tipo === "relaxar"
        ? [128, 146, 163].map((y, i) => {
            const p = pronto ? 1 : prog(t, desenhoEm + 0.5 + i * 0.08, 0.5);
            const x0 = 124 - i * 6;
            return (
              <Traco
                key={`ruga${i}`}
                d={ruga(y, x0, ROSTO_W - x0, ampRuga)}
                p={p}
                cor={cor.cafe}
                largura={larguras.detalhe}
                opacity={mistura(0.85, 0.12, relaxa)}
              />
            );
          })
        : null}
      {/* fibras do músculo da testa, em ouro (contraídas → esticadas) */}
      {efeito?.tipo === "relaxar" && pFibras > 0
        ? Array.from({ length: 7 }, (_, i) => i).flatMap((i) =>
            [false, true].map((refletida) => {
              const d = fibra(i, ampFibra);
              return (
                <Traco
                  key={`f${i}${refletida}`}
                  d={refletida ? espelhar(d) : d}
                  p={pFibras}
                  cor={cor.ouro}
                  largura={larguras.detalhe}
                  opacity={mistura(1, 0.6, prog(t, efeito.em + 1.1, 0.6))}
                />
              );
            }),
          )
        : null}

      {/* mapeamento: ligações tracejadas e pontos */}
      {mapa > 0 ? (
        <g opacity={mapa * mapaApaga}>
          {LIGACOES.flatMap(([a, b], i) => {
            const [x1, y1] = PONTOS[a];
            const [x2, y2] = PONTOS[b];
            const d = `M ${x1} ${y1} L ${x2} ${y2}`;
            const pl = prog(t, (mapeamentoEm ?? 0) + i * 0.04, 0.5);
            return [
              <Traco key={`l${i}`} d={d} p={pl} cor={cor.ouro} largura={2.1 * peso} tracejado="4 7" />,
              <Traco key={`le${i}`} d={espelhar(d)} p={pl} cor={cor.ouro} largura={2.1 * peso} tracejado="4 7" />,
            ];
          })}
          {Object.entries(PONTOS).flatMap(([k, [x, y]]) =>
            (x === 200 ? [x] : [x, espelharX(x)]).map((xx) => <circle key={`${k}${xx}`} cx={xx} cy={y} r={4.4 * Math.min(peso, 1.6)} fill={cor.ouro} />),
          )}
        </g>
      ) : null}

      {/* número de cada área: linha curta do ponto até a marca, círculo dourado com o número */}
      {numeros
        ? acesas.map((a, i) => {
            const def = AREAS[a.area];
            const p = prog(t, a.em, 0.45);
            const pm = prog(t, a.em + 0.2, 0.35);
            const [px, py] = def.ponto;
            const [mx, my] = def.marca;
            const ang = Math.atan2(my - py, mx - px);
            const fimX = mx - Math.cos(ang) * 27;
            const fimY = my - Math.sin(ang) * 27;
            return (
              <g key={`m${a.area}`} opacity={a === foco ? 1 : 0.7}>
                <circle cx={px} cy={py} r={5} fill={cor.cafe} opacity={p} />
                <Traco d={`M ${px} ${py} L ${fimX} ${fimY}`} p={p} cor={cor.cafe} largura={1.8} />
                <g opacity={pm} transform={`translate(${mx} ${my}) scale(${mistura(0.7, 1, pm)})`}>
                  <circle r={27} fill={cor.ouro} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    y={1}
                    style={{ fontFamily: sans, fontWeight: 500, fontSize: 31, fill: cor.champanhe }}
                  >
                    {a.numero ?? i + 1}
                  </text>
                </g>
              </g>
            );
          })
        : null}
    </svg>
  );
};

