// Fechamento: o cartão grande da pessoa com a etiqueta de nome (um nó do mapa) e uma fita de
// marcador pendurada no canto que se enche no "salva"; embaixo, a chamada falada e o calendário de
// pontos com o "hoje" marcado (e os dias de revisão a lápis, à espera).
import { caneta, Escrita, indicesDoTrecho, prog, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Cta as TCta, Palavra } from "../plano";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, sans, serifa, titulo as estiloTitulo } from "../tema";

const C = CARTAO.cta;

// O selo no canto do cartão: a fita de marcador (salvar) ou um disco com o ícone em traço de tinta.
const Icone: React.FC<{ icone: "seguir" | "comentar" | "link"; x: number; y: number; p: number; aparece: number }> = ({ icone, x, y, p, aparece }) => {
  const r = 68;
  const tr = { stroke: cor.tinta, strokeWidth: 7, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g opacity={aparece}>
      <circle cx={x} cy={y} r={r} fill={cor.cartao} stroke={cor.tinta} strokeWidth={6} />
      {p > 0 ? <circle cx={x} cy={y} r={(r - 3) * p} fill={cor.marca} /> : null}
      {icone === "seguir" ? (
        <>
          <path d={`M ${x - 28} ${y} L ${x + 28} ${y}`} {...tr} strokeWidth={9} />
          <path d={`M ${x} ${y - 28} L ${x} ${y + 28}`} {...tr} strokeWidth={9} />
        </>
      ) : icone === "comentar" ? (
        <path transform={`translate(${x} ${y}) scale(1.3) translate(${-x} ${-y})`} d={`M ${x - 26} ${y - 20} Q ${x - 26} ${y - 26} ${x - 20} ${y - 26} L ${x + 20} ${y - 26} Q ${x + 26} ${y - 26} ${x + 26} ${y - 20} L ${x + 26} ${y + 6} Q ${x + 26} ${y + 12} ${x + 20} ${y + 12} L ${x - 4} ${y + 12} L ${x - 16} ${y + 26} L ${x - 14} ${y + 12} L ${x - 20} ${y + 12} Q ${x - 26} ${y + 12} ${x - 26} ${y + 6} Z`} {...tr} strokeWidth={6} />
      ) : (
        <>
          <rect x={x - 39} y={y - 15} width={44} height={30} rx={15} transform={`rotate(-45 ${x} ${y})`} {...tr} strokeWidth={8} />
          <rect x={x - 5} y={y - 15} width={44} height={30} rx={15} transform={`rotate(-45 ${x} ${y})`} {...tr} strokeWidth={8} />
        </>
      )}
    </g>
  );
};

export const Cta: React.FC<{ m: TCta; palavras: Palavra[]; t: number; marca: { nome: string; area: string }; dias?: number[]; inicio?: string; frente?: boolean }> = ({
  m,
  palavras,
  t,
  marca,
  dias: diasDoPlano,
  inicio,
  frente,
}) => {
  // sem dias (nem curva no plano), não há calendário: a chamada ganha uma linha a mais
  const calendario = diasDoPlano !== undefined;
  const dias = diasDoPlano ?? [];
  const d = diagramar(m.texto, { largura: DIREITA_BAIXO - MARGEM, maximo: 112, minimo: 72, linhas: calendario ? 2 : 3, altura: calendario ? 250 : 340, equilibrar: !calendario });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const pEtiqueta = prog(t, m.de + 0.3, 0.45);
  const pFita = prog(t, (m.salvaEm ?? tempos[0] ?? m.de) - 0.02, 0.4, caneta);
  const quandoHoje = tempos[tempos.length - 1] ?? m.de + 1;
  const pHoje = prog(t, quandoHoje, 0.3);
  const yTexto = C.y + C.h + 96;
  const yCal = Math.min(1478, yTexto + d.linhas.length * d.tamanho * 1.04 + 70);
  const ultimo = Math.max(7, ...dias);
  const nos = [0, ...dias];
  const uDoDia = (dia: number) => {
    if (dias.length === 0) return dia / ultimo;
    for (let k = 0; k < nos.length - 1; k++) if (dia <= nos[k + 1]) return (k + (dia - nos[k]) / Math.max(1e-6, nos[k + 1] - nos[k])) / (nos.length - 1);
    return 1;
  };
  const x = (u: number) => MARGEM + 30 + u * (DIREITA_BAIXO - MARGEM - 60);
  const fitaX = C.x + C.w - 120;

  if (frente)
    return (
      <>
      {/* o selo no canto do cartão: a fita de marcador (salvar) enche no "salva"; os outros ícones, na primeira palavra */}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", zIndex: 3 }} width={1080} height={1920}>
        {m.icone && m.icone !== "salvar" ? (
          <Icone icone={m.icone} x={C.x + C.w - 86} y={C.y + 40} p={pFita} aparece={prog(t, m.de + 0.2, 0.3)} />
        ) : (
        <path
          d={`M ${fitaX} ${C.y - 14} L ${fitaX + 64} ${C.y - 14} L ${fitaX + 64} ${C.y + 118 + 10 * pFita} L ${fitaX + 32} ${C.y + 92 + 10 * pFita} L ${fitaX} ${C.y + 118 + 10 * pFita} Z`}
          fill={pFita > 0 ? cor.marca : cor.cartao}
          stroke={cor.tinta}
          strokeWidth={6}
          strokeLinejoin="round"
          opacity={prog(t, m.de + 0.2, 0.3)}
        />
        )}
      </svg>
      {marca.nome ? (
        <div
          style={{
            position: "absolute",
            left: C.x + 36,
            top: C.y + C.h - 84,
            zIndex: 3,
            background: cor.cartao,
            borderRadius: 24,
            boxShadow: cor.sombra,
            padding: "22px 34px 24px",
            opacity: pEtiqueta,
            translate: `0 ${((1 - pEtiqueta) * 24).toFixed(1)}px`,
          }}
        >
          <div style={{ fontFamily: serifa, fontWeight: 800, fontSize: 64, color: cor.tinta, lineHeight: 1 }}>{marca.nome}</div>
          {marca.area ? <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 42, color: cor.tintaSuave, marginTop: 12, lineHeight: 1 }}>{marca.area}</div> : null}
        </div>
      ) : null}
      </>
    );

  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: yTexto }}>
        <Escrita linhas={d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={d.tamanho} destaque={destaque} entrelinha={1.04} />
      </div>
      {calendario ? (
      <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <line x1={x(0)} y1={yCal} x2={x(1)} y2={yCal} stroke={cor.lapisClaro} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        {Array.from({ length: ultimo + 1 }, (_, dia) => {
          if (dia === 0 || dias.includes(dia)) return null;
          return <circle key={dia} cx={x(uDoDia(dia))} cy={yCal} r={4} fill={cor.lapisClaro} />;
        })}
        {dias.map((dia) => (
          <circle key={`r-${dia}`} cx={x(uDoDia(dia))} cy={yCal} r={16} fill={cor.cartao} stroke={cor.lapis} strokeWidth={4} strokeDasharray="4 6" />
        ))}
        <circle cx={x(0)} cy={yCal} r={18} fill={cor.cartao} stroke={cor.lapis} strokeWidth={4} strokeDasharray="4 6" />
        <circle cx={x(0)} cy={yCal} r={20 * (0.6 + 0.4 * pHoje)} fill={cor.marca} stroke={cor.tinta} strokeWidth={6} opacity={pHoje} />
      </svg>
      {[0, ...dias].map((dia) => (
        <div
          key={`l-${dia}`}
          style={{
            position: "absolute",
            left: x(uDoDia(dia)),
            top: yCal + 30,
            translate: dia === 0 ? "-26% 0" : "-50% 0",
            fontFamily: sans,
            fontWeight: dia === 0 && pHoje > 0.5 ? 700 : 500,
            fontSize: 34,
            color: dia === 0 && pHoje > 0.5 ? cor.tinta : cor.lapis,
          }}
        >
          {dia === 0 ? (inicio ?? "0") : dia}
        </div>
      ))}
      </>
      ) : null}
    </>
  );
};
