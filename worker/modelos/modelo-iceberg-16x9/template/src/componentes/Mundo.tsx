// O mundo do Iceberg: céu, linha d'água, o iceberg com N níveis, a água que escurece, os cartões de cada nível
// e o medidor de profundidade. Tudo desenhado em coordenadas de mundo e movido pela câmera.
// No quadro deitado (16:9) o mundo ocupa a tela inteira, atrás da janela da pessoa: a coluna do iceberg
// (x 0 a 1080 do mundo) fica centrada no QUADRO da esquerda, e o céu, a água, as bolhas e os raios de
// luz se estendem pela largura toda.
import { useMemo } from "react";
import { prog, rapido, salto, formatar } from "../anim";
import { centro, descida, escalaGeral, fundo, G, icebergs, numNiveis, profundidade, saidaDoNivel, type Cam } from "../camera";
import { CX, MEDIDOR, QUADRO, ZONA } from "../layout";
import { encaixar, larguraTexto, type Fonte } from "../medida";
import { Foto, imagemDoPlano } from "../motor/imagem";
import type { Iceberg, Nivel, Plano } from "../plano";
import { cor, fonte, mono, sombraLaje } from "../tema";

const pseudo = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 * k + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ——— o iceberg ———

const US = [0, 0.12, 0.3, 0.5, 0.68, 0.84, 0.94, 1];
const HWS = [540, 760, 860, 800, 640, 430, 210, 30];
const meiaLargura = (u: number) => {
  for (let i = 0; i < US.length - 1; i++) {
    if (u <= US[i + 1]) return HWS[i] + (HWS[i + 1] - HWS[i]) * ((u - US[i]) / (US[i + 1] - US[i]));
  }
  return HWS[HWS.length - 1];
};

const PICO: [number, number][] = [
  [0, 0], [130, -150], [250, -135], [350, -300], [440, -262], [530, -440], [610, -330], [700, -362], [800, -205], [900, -215], [1080, 0],
];

const Iceberg: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const N = numNiveis(plano);
  const prof = N * G.L;
  const { Yw } = G;
  const forma = useMemo(() => {
    const passos = 44;
    const lado = (sinal: number, semente: number) =>
      Array.from({ length: passos + 1 }, (_, i) => {
        const u = i / passos;
        const j = (pseudo(i, semente) - 0.5) * 70 * (1 - u * 0.6) + Math.sin(i * 0.9 + semente) * 22;
        return [540 + sinal * Math.max(8, meiaLargura(u) + (i === 0 ? 0 : j)), Yw + u * prof] as [number, number];
      });
    const e = lado(-1, 1);
    const d = lado(1, 2);
    return [...e, ...[...d].reverse()].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }, [Yw, prof]);
  const facetas = useMemo(
    () =>
      Array.from({ length: 22 }, (_, j) => {
        const cx = 540 + (pseudo(j, 3) - 0.5) * 1500;
        const cy = Yw + pseudo(j, 4) * prof;
        const r = 130 + pseudo(j, 5) * 260;
        const pts = [0, 1, 2].map((k) => {
          const a = pseudo(j * 3 + k, 6) * Math.PI * 2;
          return `${(cx + Math.cos(a) * r * (0.6 + pseudo(j + k, 7) * 0.6)).toFixed(0)},${(cy + Math.sin(a) * r * 0.9).toFixed(0)}`;
        });
        return { pts: pts.join(" "), claro: j % 3 !== 0, o: 0.07 + pseudo(j, 8) * 0.1 };
      }),
    [Yw, prof],
  );
  const pico = PICO.map(([x, y]) => `${x},${Yw + y}`).join(" ");
  const sombraPico = `530,${Yw - 440} 610,${Yw - 330} 700,${Yw - 362} 800,${Yw - 205} 900,${Yw - 215} 1080,${Yw} 600,${Yw}`;
  const onda = Array.from({ length: 60 }, (_, i) => `${i === 0 ? "M" : "L"}${-500 + i * 36},${Yw + Math.sin(i * 0.8 + t * 1.6) * 5}`).join(" ");
  return (
    <>
      <defs>
        <linearGradient id="ice-gelo" gradientUnits="userSpaceOnUse" x1="0" y1={Yw} x2="0" y2={Yw + prof}>
          <stop offset="0" stopColor={cor.geloLuz} />
          <stop offset="0.22" stopColor="#BDE4F4" />
          <stop offset="0.5" stopColor={cor.geloFundo} />
          <stop offset="0.82" stopColor="#2A6595" />
          <stop offset="1" stopColor={cor.geloAbismo} />
        </linearGradient>
        <clipPath id="ice-corpo">
          <polygon points={forma} />
        </clipPath>
      </defs>
      <polygon points={forma} fill="url(#ice-gelo)" />
      <g clipPath="url(#ice-corpo)">
        {facetas.map((f, i) => (
          <polygon key={i} points={f.pts} fill={f.claro ? "#FFFFFF" : "#031428"} opacity={f.o} />
        ))}
      </g>
      {/* a ponta acima da água */}
      <polygon points={pico} fill={cor.gelo} />
      <polygon points={sombraPico} fill={cor.geloSombra} opacity={0.75} />
      {/* a água por cima da base da ponta */}
      <rect x={-2000} y={Yw} width={5000} height={46} fill={cor.agua0} opacity={0.42} />
      <path d={onda} stroke="#FFFFFF" strokeWidth={6} fill="none" opacity={0.85} strokeLinecap="round" />
      {/* divisões dos níveis */}
      <g clipPath="url(#ice-corpo)">
        {Array.from({ length: N - 1 }, (_, k) => {
          const y = Yw + (k + 1) * G.L;
          return (
            <g key={k}>
              <line x1={-600} x2={1700} y1={y} y2={y} stroke="#03142A" strokeOpacity={0.3} strokeWidth={9} />
              <line x1={-600} x2={1700} y1={y} y2={y} stroke={cor.sonar} strokeWidth={4} strokeDasharray="16 12" />
            </g>
          );
        })}
      </g>
    </>
  );
};

const Fundo: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const { Yw } = G;
  const fim = fundo(plano);
  const bolhas = useMemo(
    () =>
      // no 16:9 as bolhas cobrem a largura toda da tela (x -60 a 1880 do mundo, com a câmera em s = 1)
      Array.from({ length: 110 }, (_, i) => ({
        x: -60 + pseudo(i, 9) * 1940,
        y: Yw + 80 + pseudo(i, 10) * (fim - Yw + 600),
        r: 2 + pseudo(i, 11) * 5,
        v: 8 + pseudo(i, 12) * 22,
        o: 0.18 + pseudo(i, 13) * 0.3,
      })),
    [Yw, fim],
  );
  return (
    <>
      <defs>
        <linearGradient id="ice-ceu" gradientUnits="userSpaceOnUse" x1="0" y1={Yw - 900} x2="0" y2={Yw}>
          <stop offset="0" stopColor={cor.ceuAlto} />
          <stop offset="1" stopColor={cor.ceuBaixo} />
        </linearGradient>
        <linearGradient id="ice-agua" gradientUnits="userSpaceOnUse" x1="0" y1={Yw} x2="0" y2={fim + 200}>
          <stop offset="0" stopColor={cor.agua0} />
          <stop offset="0.22" stopColor={cor.agua1} />
          <stop offset="0.52" stopColor={cor.agua2} />
          <stop offset="0.8" stopColor={cor.agua3} />
          <stop offset="1" stopColor={cor.abismo} />
        </linearGradient>
      </defs>
      {/* largo o bastante para cobrir a tela deitada inteira até na visão geral (escala 0,15) */}
      <rect x={-6000} y={Yw - 4000} width={18000} height={4000} fill="url(#ice-ceu)" />
      <rect x={-6000} y={Yw} width={18000} height={fim - Yw + 200} fill="url(#ice-agua)" />
      <rect x={-6000} y={fim + 200} width={18000} height={4000} fill={cor.abismo} />
      {/* nuvens */}
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={(160 + i * 560 + t * (6 + i * 3)) % 2600 - 400} cy={Yw - 560 - (i % 3) * 90} rx={170 + (i % 3) * 30} ry={34} fill="#FFFFFF" opacity={0.7} />
      ))}
      {/* raios de luz que descem da superfície */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x0 = -40 + i * 280 + Math.sin(t * 0.4 + i * 1.7) * 40;
        return <polygon key={i} points={`${x0},${Yw} ${x0 + 90},${Yw} ${x0 + 360},${Yw + 1500} ${x0 + 120},${Yw + 1500}`} fill="#FFFFFF" opacity={0.07} />;
      })}
      {bolhas.map((b, i) => (
        <circle key={i} cx={b.x + Math.sin(t * 0.6 + i) * 10} cy={b.y - ((t * b.v) % 160)} r={b.r} fill="#FFFFFF" opacity={b.o} />
      ))}
    </>
  );
};

// ——— cartão de um nível ———

const FOTO = { w: 700, h: 400 };
// a etiqueta do nível fica nesta faixa em cima da foto
const ROTULO_H = 78;
// a caixa (px de mundo) onde o cartão é desenhado, centrada no nível
const CAIXA_H = 1300;

// O maior corpo (até `max`) em que o texto cabe numa linha só de `largura` (nunca abaixo de 20 px).
const umaLinha = (texto: string, max: number, largura: number, fonteDoTexto: Fonte) =>
  Math.max(20, Math.min(max, Math.floor(largura / Math.max(0.01, larguraTexto(texto, 1, fonteDoTexto)))));

const Placa: React.FC<{ texto: string; tamanho: number; peso?: 500 | 700 | 800; fundo?: string; cor?: string; style?: React.CSSProperties }> = ({
  texto,
  tamanho,
  peso = 800,
  fundo: bg = cor.placa,
  cor: c = cor.clara,
  style,
}) => (
  <div
    style={{
      display: "inline-block",
      padding: `${tamanho * 0.2}px ${tamanho * 0.5}px`,
      borderRadius: tamanho * 0.5,
      background: bg,
      color: c,
      fontFamily: fonte,
      fontWeight: peso,
      fontSize: tamanho,
      lineHeight: 1.15,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {texto}
  </div>
);

// O cartão do nível: etiqueta, foto, nome e detalhes, numa pilha centrada no nível. No quadro deitado
// a pilha inteira cabe no QUADRO da esquerda: se o nome em 2 linhas e 3 detalhes passarem da altura
// dele, o cartão todo encolhe junto (nada vaza para baixo nem para a janela da pessoa).
const Cartao: React.FC<{ plano: Plano; m: Iceberg; k: number; n: Nivel; t: number }> = ({ plano, m, k, n, t }) => {
  const zc = centro(k);
  const p = prog(t, n.em, 0.34, salto);
  if (t < n.em - 0.02) return null;
  const saida = saidaDoNivel(m, k);
  const c = prog(t, saida, 0.55, rapido);
  const sc = (0.55 + 0.45 * p) * (1 - 0.42 * c);
  const img = imagemDoPlano(plano, n.imagem);
  const nome = encaixar(n.nome, { largura: 700, max: 66, min: 38, linhas: 2, fonte: { peso: 800 } });
  const larguraNome = Math.max(...nome.linhas.map((l) => larguraTexto(l, nome.tamanho, { peso: 800 }))) + nome.tamanho;
  const hNome = nome.linhas.length * nome.tamanho * 1.15 + nome.tamanho * 0.4;
  const rotulo = n.rotulo?.toLocaleUpperCase("pt-BR");
  const tamRotulo = rotulo ? umaLinha(rotulo, 34, 760, { peso: 700, espacamento: 0.04 }) : 0;
  const detalhes = (n.detalhes ?? []).map((d) => {
    const medido = encaixar(d.texto, { largura: 820, max: 44, min: 34, linhas: 1, fonte: { peso: 700 } }).tamanho;
    return { ...d, tam: umaLinha(d.texto, medido, 820, { peso: 700 }) };
  });
  const hDetalhes = detalhes.length ? 18 + detalhes.reduce((soma, d) => soma + d.tam * 1.55 + 12, 0) : 0;
  const alto = ROTULO_H + FOTO.h + 26 + hNome + hDetalhes;
  const ajuste = Math.min(1, (ZONA.h - 16) / alto);
  // posições dentro da caixa do cartão (o topo da caixa fica em zc - CAIXA_H / 2 no mundo)
  const topoCaixa = zc - CAIXA_H / 2;
  const topo = CAIXA_H / 2 - alto / 2;
  const py = topo + ROTULO_H + FOTO.h / 2;
  const topoNome = py + FOTO.h / 2 + 26;
  const ping = prog(t, n.em, 0.9, rapido);
  // o centro da foto no mundo, já com o ajuste (o anel do sonar abre dele)
  const pyMundo = zc + (topoCaixa + py - zc) * ajuste;
  return (
    <>
      {ping < 1 ? (
        <circle cx={540} cy={pyMundo} r={80 + 520 * ping} fill="none" stroke={cor.sonar} strokeWidth={Math.max(1, 9 * (1 - ping))} opacity={1 - ping} />
      ) : null}
      <foreignObject x={0} y={topoCaixa} width={1080} height={CAIXA_H} style={{ overflow: "visible" }}>
        <div style={{ position: "relative", width: 1080, height: CAIXA_H, transformOrigin: `540px ${CAIXA_H / 2}px`, transform: ajuste < 1 ? `scale(${ajuste})` : undefined }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1080,
              height: CAIXA_H,
              transformOrigin: `540px ${py}px`,
              transform: `scale(${sc})`,
              opacity: Math.min(1, p * 4),
            }}
          >
            {/* etiqueta do nível */}
            {rotulo ? (
              <div style={{ position: "absolute", left: 0, width: 1080, top: topo, textAlign: "center", opacity: 1 - c }}>
                <Placa texto={rotulo} tamanho={tamRotulo} peso={700} fundo={cor.enfase} cor={cor.tinta} style={{ letterSpacing: "0.04em" }} />
              </div>
            ) : null}
            {/* a foto */}
            <div
              style={{
                position: "absolute",
                left: 540 - FOTO.w / 2,
                top: py - FOTO.h / 2,
                width: FOTO.w,
                height: FOTO.h,
                borderRadius: 34,
                border: `10px solid ${cor.clara}`,
                boxSizing: "border-box",
                overflow: "hidden",
                boxShadow: `0 14px 0 ${cor.geloSombra}, ${sombraLaje}`,
                background: cor.agua2,
              }}
            >
              <Foto
                imagem={img}
                foco={n.imagem?.foco}
                t={t}
                de={n.em}
                efeito={n.imagem?.efeito ?? "aproximar"}
                intensidade={0.08}
                entrada="fade"
                durEntrada={0.22}
                largura={FOTO.w - 20}
                altura={FOTO.h - 20}
                cartao={{ fundo: cor.agua2, cor: cor.clara, fonte, peso: 800 }}
              />
            </div>
            {/* foto pequena e redonda no canto */}
            {n.inset && t >= n.inset.em ? <Inset plano={plano} inset={n.inset} t={t} y={py - FOTO.h / 2 + 20} c={c} /> : null}
            {/* nome */}
            <div style={{ position: "absolute", left: 0, width: 1080, top: topoNome, textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  width: larguraNome,
                  padding: `${nome.tamanho * 0.2}px 0`,
                  borderRadius: nome.tamanho * 0.5,
                  background: cor.placa,
                  color: cor.clara,
                  fontFamily: fonte,
                  fontWeight: 800,
                  fontSize: nome.tamanho,
                  lineHeight: 1.15,
                  height: hNome,
                  boxSizing: "border-box",
                  borderBottom: `6px solid ${cor.enfase}`,
                }}
              >
                {nome.linhas.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
            {/* detalhes, um a um */}
            <div style={{ position: "absolute", left: 0, width: 1080, top: topoNome + hNome + 18, textAlign: "center", opacity: 1 - c }}>
              {detalhes.map((d, i) => {
                if (t < d.em) return null;
                const q = prog(t, d.em, 0.3, rapido);
                return (
                  <div key={i} style={{ marginBottom: 12, opacity: q, transform: q >= 1 ? undefined : `translateY(${(1 - q) * 24}px)` }}>
                    <Placa texto={d.texto} tamanho={d.tam} peso={700} fundo={d.destaque ? cor.enfase : cor.placa} cor={d.destaque ? cor.tinta : cor.clara} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </foreignObject>
    </>
  );
};

const Inset: React.FC<{ plano: Plano; inset: NonNullable<Nivel["inset"]>; t: number; y: number; c: number }> = ({ plano, inset, t, y, c }) => {
  const p = prog(t, inset.em, 0.32, salto);
  const D = 190;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 + FOTO.w / 2 - D * 0.62,
        top: y - D * 0.15,
        width: D,
        height: D,
        borderRadius: D,
        border: `8px solid ${cor.clara}`,
        boxSizing: "border-box",
        overflow: "hidden",
        background: cor.agua2,
        boxShadow: `0 8px 0 ${cor.geloSombra}, ${sombraLaje}`,
        transform: `scale(${0.3 + 0.7 * p})`,
        opacity: Math.min(1, p * 3) * (1 - c * 0.0),
      }}
    >
      <Foto imagem={imagemDoPlano(plano, inset.imagem)} foco={inset.imagem.foco} t={t} de={inset.em} efeito="aproximar" intensidade={0.06} entrada="fade" durEntrada={0.15} largura={D - 16} altura={D - 16} cartao={{ fundo: cor.agua2, cor: cor.clara, fonte, peso: 800 }} />
    </div>
  );
};

// ponto de interrogação nos níveis que ainda não foram revelados
// No quadro deitado, o "?" de um nível que ainda está abaixo do quadro (o próximo, com a câmera num
// nível) some suave antes da borda de baixo: no vertical ele ficava atrás da janela da pessoa.
const LIMITE_DO_MISTERIO = ZONA.y + ZONA.h;
const Misterios: React.FC<{ plano: Plano; t: number; cam: Cam }> = ({ plano, t, cam }) => {
  const N = numNiveis(plano);
  const revelado = new Map<number, number>();
  for (const m of icebergs(plano)) m.niveis.forEach((n, k) => revelado.set(k, Math.min(revelado.get(k) ?? 1e9, n.em)));
  const temIceberg = icebergs(plano).length > 0;
  if (!temIceberg) return null;
  return (
    <>
      {Array.from({ length: N }, (_, k) => {
        const em = revelado.get(k);
        const some = em === undefined ? 0 : prog(t, em - 0.1, 0.25);
        if (some >= 1) return null;
        // o centro do "?" na tela: abaixo do quadro, ele não aparece (cortado pela borda)
        const naTela = G.FY + (centro(k) - 17 - cam.z) * cam.s;
        const abaixo = Math.max(0, Math.min(1, (LIMITE_DO_MISTERIO + 64 - naTela) / 64));
        if (abaixo <= 0) return null;
        const prof = (k + 0.5) / N;
        const claro = prof > 0.45;
        return (
          <text
            key={k}
            x={540}
            y={centro(k) + 130 + Math.sin(t * 2 + k) * 8}
            textAnchor="middle"
            fontFamily={fonte}
            fontWeight={800}
            fontSize={420}
            fill={claro ? "#FFFFFF" : cor.tinta}
            opacity={(claro ? 0.5 : 0.42) * (1 - some) * abaixo}
          >
            ?
          </text>
        );
      })}
      {Array.from({ length: N }, (_, k) => (
        <g key={k}>
          <circle cx={170} cy={centro(k) - G.L / 2 + 52} r={30} fill={cor.placa} stroke={cor.sonar} strokeWidth={3} />
          <text x={170} y={centro(k) - G.L / 2 + 52 + 11} textAnchor="middle" fontFamily={mono} fontWeight={700} fontSize={32} fill={cor.clara}>
            {k + 1}
          </text>
        </g>
      ))}
    </>
  );
};

// ——— o mundo inteiro, com a câmera ———

export const Mundo: React.FC<{ plano: Plano; t: number; cam: Cam }> = ({ plano, t, cam }) => {
  const niveis = useMemo(() => icebergs(plano).flatMap((m) => m.niveis.map((n, k) => ({ m, n, k }))), [plano]);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: QUADRO.h, overflow: "hidden" }}>
      {/* o centro da coluna do iceberg (x 540 do mundo) cai no centro do quadro da esquerda */}
      <svg
        width={QUADRO.w}
        height={QUADRO.h}
        viewBox={`0 0 ${QUADRO.w} ${QUADRO.h}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", transformOrigin: "0 0", transform: `translate(${CX - 540 * cam.s}px, ${G.FY - cam.z * cam.s}px) scale(${cam.s})` }}
      >
        <Fundo plano={plano} t={t} />
        <Iceberg plano={plano} t={t} />
        <Misterios plano={plano} t={t} cam={cam} />
        {niveis.map(({ m, n, k }) => (
          <Cartao key={`${m.de}-${k}`} plano={plano} m={m} k={k} n={n} t={t} />
        ))}
      </svg>
    </div>
  );
};

// ——— o medidor de profundidade (fixo na tela, à esquerda) ———

export const Medidor: React.FC<{ plano: Plano; t: number; cam: Cam }> = ({ plano, t, cam }) => {
  const ab = plano.momentos.find((m) => m.tipo === "abertura" && t >= m.de - 0.1 && t < m.ate + 0.25);
  if (ab) return null;
  const unidade = icebergs(plano).find((m) => m.unidade)?.unidade ?? "m";
  const valor = Math.round(profundidade(plano, cam));
  const { leitura, regua } = MEDIDOR;
  const topo = regua.topo;
  const alto = regua.alto;
  const passo = 40;
  const ini = G.Yw;
  const ticks: { y: number; longo: boolean }[] = [];
  const a = cam.z - (G.FY - topo) / cam.s;
  const b = cam.z + (topo + alto - G.FY) / cam.s;
  for (let wy = Math.max(ini, Math.floor(a / passo) * passo); wy <= b; wy += passo) {
    ticks.push({ y: (wy - cam.z) * cam.s + G.FY - topo, longo: Math.round((wy - ini) / passo) % 5 === 0 });
  }
  void t;
  return (
    <>
      {/* leitura */}
      <div
        style={{
          position: "absolute",
          left: leitura.x,
          top: leitura.y,
          width: leitura.w,
          height: leitura.h,
          borderRadius: 26,
          background: cor.placa,
          borderLeft: `10px solid ${cor.enfase}`,
          boxSizing: "border-box",
          padding: "12px 18px 0 22px",
        }}
      >
        <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 22, color: cor.sonar, letterSpacing: "0.08em" }}>PROFUNDIDADE</div>
        <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 56, color: cor.clara, lineHeight: 1.1 }}>
          {formatar(valor)}
          <span style={{ fontSize: 30, color: cor.claraSuave, marginLeft: 8 }}>{unidade}</span>
        </div>
      </div>
      {/* régua */}
      <svg width={120} height={alto} style={{ position: "absolute", left: 0, top: topo, overflow: "hidden" }}>
        <line x1={92} x2={92} y1={0} y2={alto} stroke={cor.claraSuave} strokeWidth={3} />
        {ticks.map((tk, i) => (
          <line key={i} x1={tk.longo ? 56 : 74} x2={92} y1={tk.y} y2={tk.y} stroke={cor.clara} strokeWidth={tk.longo ? 4 : 2.5} opacity={0.85} />
        ))}
        <polygon points={`108,${G.FY - topo - 16} 108,${G.FY - topo + 16} 74,${G.FY - topo}`} fill={cor.enfase} />
      </svg>
    </>
  );
};
