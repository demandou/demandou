// Contador: um mostrador de relógio grande. O anel se desenha quando a estação chega; na palavra, o
// número conta até o valor, o ponteiro varre e o setor percorrido ganha marca-texto (ex.: 5 minutos =
// uma fatia pequena da hora). Ao lado do cartão da pessoa, a frase falada com o trecho em destaque.
import { caneta, Escrita, indicesDoTrecho, prog, temposDoTexto, Traco } from "../anim";
import { diagramar } from "../medidas";
import type { Contador as TContador, Palavra } from "../plano";
import { CARTAO, cor, MARGEM, rotulo, sans, serifa, titulo as estiloTitulo } from "../tema";

export const RELOGIO = { cx: 510, cy: 1130, r: 300 };

const ponto = (ang: number, r: number) => {
  const a = ((ang - 90) * Math.PI) / 180;
  return { x: RELOGIO.cx + r * Math.cos(a), y: RELOGIO.cy + r * Math.sin(a) };
};

export const Contador: React.FC<{ m: TContador; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const largura = CARTAO.contador.x - MARGEM - 44;
  const d = m.texto ? diagramar(m.texto, { largura, maximo: 76, minimo: 56, linhas: 4, altura: 340 }) : null;
  const tempos = m.texto ? temposDoTexto(m.texto, palavras, m.de, m.ate) : [];
  const destaque = m.texto ? indicesDoTrecho(m.texto, m.destaque) : new Set<number>();
  // uma volta do mostrador: 60 (relógio de minutos) para valores pequenos; para valores maiores, o
  // dobro do valor arredondado para cima em múltiplos de 60
  const volta = m.volta ?? (m.valor <= 40 ? 60 : Math.ceil((m.valor * 2) / 60) * 60);
  const pAnel = prog(t, m.de - 0.25, 0.6, caneta);
  const p = prog(t, m.em, 0.8, (s) => 1 - (1 - s) * (1 - s));
  const valor = Math.round(m.valor * p);
  const ang = 360 * Math.min(1, m.valor / volta) * p;
  const { cx, cy, r } = RELOGIO;
  const rFatia = r - 54;
  const fim = ponto(ang, rFatia);
  const fatia = ang > 0.5 ? `M ${cx} ${cy} L ${cx} ${cy - rFatia} A ${rFatia} ${rFatia} 0 ${ang > 180 ? 1 : 0} 1 ${fim.x.toFixed(1)} ${fim.y.toFixed(1)} Z` : "";
  const anel = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
  const ponteiro = ponto(ang, r - 24);
  const baseDoPonteiro = ponto(ang, 168);

  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: 178, width: largura }}>
        {m.rotulo ? <div style={{ ...rotulo, lineHeight: 1.25, marginBottom: 26 }}>{m.rotulo}</div> : null}
        {d ? <Escrita linhas={d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={d.tamanho} destaque={destaque} /> : null}
      </div>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <circle cx={cx} cy={cy} r={r + 26} fill={cor.cartao} opacity={0.9} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="3 12" strokeLinecap="round" />
        {fatia ? <path d={fatia} fill={cor.marca} /> : null}
        <Traco d={anel} p={pAnel} cor={cor.tinta} largura={7} />
        {Array.from({ length: 60 }, (_, i) => {
          const forte = i % 5 === 0;
          const a = ponto(i * 6, r - 12);
          const b = ponto(i * 6, r - (forte ? 44 : 26));
          const pi = prog(t, m.de - 0.2 + i * 0.008, 0.2);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={forte ? cor.tinta : cor.lapis} strokeWidth={forte ? 6 : 3} strokeLinecap="round" opacity={pi} />;
        })}
        <line x1={baseDoPonteiro.x} y1={baseDoPonteiro.y} x2={ponteiro.x} y2={ponteiro.y} stroke={cor.tinta} strokeWidth={9} strokeLinecap="round" opacity={pAnel} />
        <circle cx={cx} cy={cy} r={158} fill={cor.cartao} stroke={cor.lapisClaro} strokeWidth={3} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - 160,
          top: cy - 150,
          width: 320,
          height: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: serifa, fontWeight: 800, fontSize: String(m.valor).length > 2 ? 150 : 220, lineHeight: 0.86, color: p > 0 ? cor.tinta : cor.lapisClaro, fontVariantNumeric: "tabular-nums" }}>{valor}</div>
        {m.unidade ? <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 52, color: cor.tintaSuave, marginTop: 10 }}>{m.unidade}</div> : null}
      </div>
    </>
  );
};
