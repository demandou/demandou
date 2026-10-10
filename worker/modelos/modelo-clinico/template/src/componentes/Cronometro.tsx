import { limitar, misturarCor, prog, saindo } from "../anim";
import type { Areas } from "../layout";
import type { Caixa } from "../motor/caixa";
import type { Cronometro as CronometroT, Palavra } from "../plano";
import { caber, cor, sans } from "../tema";
import { arco, Graduacao, Ilustrativo } from "./Dial";
import { Cabecalho } from "./Cabecalho";
import { pSelo, Selo } from "./Selo";
import { Veredito } from "./Veredito";

// Mostrador (assinatura): o anel em volta da lupa vira um instrumento. O ponteiro corre; para antes da meta
// (vermelho) ou completa a volta (azul). O que faltou aparece tracejado quando a meta é dita. A meta pode
// ser um tempo ("2:00"), um nível ("100%") ou um objetivo em palavras ("No bolso"), com a etiqueta "ilustrativo".
export const Cronometro: React.FC<{ m: CronometroT; t: number; fim: number; areas: Areas; palavras: Palavra[]; caixa: Caixa }> = ({
  m,
  t,
  fim,
  areas,
  palavras,
  caixa,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  // o mostrador fica preso ao lugar da lupa deste momento (quando a lupa vai embora, ele fica e apaga)
  const cx = caixa.x + caixa.w / 2;
  const cy = caixa.y + caixa.h / 2;
  const R = caixa.w / 2 + 62;
  const monta = prog(t, m.de, 0.6);

  // quanto da volta o ponteiro já andou
  const ate = m.para ? m.para.fracao : 1;
  const dur = m.para ? Math.max(0.3, m.para.em - m.inicio) : (m.volta ?? 1.4);
  // parando cedo: desacelera até travar; volta completa: acelera e assenta
  const anda = prog(t, m.inicio, dur, (x) => (m.para ? 1 - Math.pow(1 - x, 2.2) : x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2));
  const f = ate * limitar(anda);
  const parou = m.para ? prog(t, m.para.em, 0.35) : 0;
  const corArco = misturarCor(cor.azul, cor.vermelho, parou);
  const meta = m.metaEm !== undefined ? prog(t, m.metaEm, 0.4) : m.para ? 0 : prog(t, m.inicio + dur, 0.4);
  const falta = m.para ? prog(t, Math.max(m.para.em + 0.3, m.metaEm ?? 0), 0.7) : 0;

  const aPonta = f * Math.PI * 2 - Math.PI / 2;
  const ponta = { x: cx + Math.cos(aPonta) * R, y: cy + Math.sin(aPonta) * R };
  const fora = { x: cx + Math.cos(aPonta) * (R + 92), y: cy + Math.sin(aPonta) * (R + 92) };
  const alturaVeredito = m.veredito ? 110 : 0;
  // a meta é qualquer medida ou objetivo ("2:00", "100%", "No bolso"): cabe numa linha acima do mostrador
  const tamMeta = caber(m.meta, 860, 64, 40, 800);

  return (
    <>
      <Cabecalho
        area={areas.cabecalho}
        numero={m.numero}
        titulo={m.titulo}
        enfase={m.enfase}
        palavras={palavras}
        de={m.de}
        ate={m.ate}
        t={t}
        fim={fim}
        alinhar="centro"
        maxLinhas={2}
        maximo={88}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        {/* trilho e graduação (60 marcas, uma a cada "segundo" da volta) */}
        <Graduacao cx={cx} cy={cy} R={R} monta={monta} />

        {/* o que faltou até a meta */}
        {falta > 0 ? (
          <path
            d={arco(cx, cy, R, ate, ate + (1 - ate) * falta)}
            fill="none"
            stroke={cor.azul}
            strokeWidth={6}
            strokeDasharray="4 16"
            strokeLinecap="round"
          />
        ) : null}

        {/* ponteiro */}
        {f > 0.002 ? (
          <>
            <path d={arco(cx, cy, R, 0, f)} fill="none" stroke={corArco} strokeWidth={18} strokeLinecap="round" />
            <circle cx={ponta.x} cy={ponta.y} r={17} fill={cor.branco} stroke={corArco} strokeWidth={6} />
          </>
        ) : null}

        {/* meta no topo do mostrador */}
        <line x1={cx} y1={cy - R - 22} x2={cx} y2={cy - R + 22} stroke={misturarCor(cor.cinzaLinha, cor.azul, meta)} strokeWidth={6} strokeLinecap="round" opacity={monta} />
        <text
          x={cx}
          y={cy - R - 84}
          textAnchor="middle"
          dominantBaseline="central"
          opacity={limitar(monta * 1.5)}
          style={{ fontFamily: sans, fontWeight: 800, fontSize: tamMeta, letterSpacing: "-0.01em", fill: misturarCor(cor.cinzaLinha, cor.azul, meta), fontVariantNumeric: "tabular-nums" }}
        >
          {m.meta}
        </text>

        {/* ✗ na ponta que parou cedo / ✓ quando completa */}
        {/* com veredito embaixo, o ✗ fica só no veredito (o da ponta cairia em cima dele) */}
        {m.para && !m.veredito ? <Selo cx={fora.x} cy={fora.y} r={36} tipo="errado" p={pSelo(t, m.para.em + 0.15)} /> : null}
        {!m.para ? <Selo cx={cx + R * 0.72 + 30} cy={cy - R * 0.72 - 30} r={36} tipo="certo" p={pSelo(t, m.inicio + dur + 0.05)} /> : null}
      </svg>
      {m.ilustrativo ? <Ilustrativo x={cx} y={m.veredito ? cy - R - 166 : cy + R + 64} p={limitar(monta * 1.5) * (1 - sai)} alinhar="centro" /> : null}
      {m.veredito ? (
        <Veredito v={m.veredito} t={t} saida={sai} x={areas.corpo.x} y={areas.corpo.y + areas.corpo.h - alturaVeredito + 20} w={areas.corpo.w} />
      ) : null}
    </>
  );
};
