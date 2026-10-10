// O anel do cronômetro. Conta os minutos do bloco (acelerado) e esvazia; dentro de um bloco cheio
// ele é branco, na raia da pessoa ganha a cor da categoria. Nos ciclos vira um contador de N
// arcos que acendem um a um. Ele passa de um lugar para o outro com a pessoa.
import { limitar, mistura, prog } from "../anim";
import { type Agenda, type BlocoNaAgenda, type Cena, retNoTempo, trechoNoTempo } from "../agenda";
import type { Ciclos } from "../plano";
import { medir } from "../medida";
import { CATEGORIAS, cor, numeros, sans } from "../tema";
import { anelNoBloco } from "./Blocos";

type Estado = {
  cx: number;
  cy: number;
  d: number;
  noBloco: boolean;
  aparece: number;
  desenho: (d: number) => React.ReactNode;
};

const mmss = (s: number) => {
  const total = Math.max(0, Math.ceil(s - 0.001));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export const Anel: React.FC<{ t: number; ag: Agenda }> = ({ t, ag }) => {
  const { atual, anterior, p, k } = trechoNoTempo(t, ag.trechos);
  const agora = estadoDaCena(atual.cena, atual.momento, t, ag);
  const antes = k > 0 ? estadoDaCena(anterior.cena, anterior.momento, t, ag) : null;
  if (!agora && !antes) return null;

  if (agora && antes) {
    const cx = mistura(antes.cx, agora.cx, p);
    const cy = mistura(antes.cy, agora.cy, p);
    const d = mistura(antes.d, agora.d, p);
    return (
      <>
        <Camada cx={cx} cy={cy} d={d} opacidade={Math.max(0, 1 - 2 * p) * antes.aparece}>
          {antes.desenho(d)}
        </Camada>
        <Camada cx={cx} cy={cy} d={d} opacidade={Math.max(0, 2 * p - 1) * agora.aparece}>
          {agora.desenho(d)}
        </Camada>
      </>
    );
  }
  const so = (agora ?? antes) as Estado;
  const presenca = agora ? (k > 0 ? p : 1) : 1 - p;
  return (
    <Camada cx={so.cx} cy={so.cy} d={so.d * (0.86 + 0.14 * presenca)} opacidade={presenca * so.aparece}>
      {so.desenho(so.d * (0.86 + 0.14 * presenca))}
    </Camada>
  );
};

const Camada: React.FC<{ cx: number; cy: number; d: number; opacidade: number; children: React.ReactNode }> = ({ cx, cy, d, opacidade, children }) => {
  if (opacidade < 0.01) return null;
  return <div style={{ position: "absolute", left: cx - d / 2, top: cy - d / 2, width: d, height: d, opacity: opacidade }}>{children}</div>;
};

const estadoDaCena = (cena: Cena, momento: number | null, t: number, ag: Agenda): Estado | null => {
  const a = cena.anel;
  if (!a || momento === null) return null;
  const m = ag.ordem[momento];
  if (a.modo === "ciclos" && m.tipo === "ciclos") {
    // depois da contagem, o anel passa a contar o bloco final (a pausa longa), acelerado
    const final = ag.blocos.find((x) => x.momento === momento && x.final && x.cronometro);
    const vira = final?.cronometro ? prog(t, final.cronometro.em - 0.1, 0.3) : 0;
    return {
      cx: a.cx,
      cy: a.cy,
      d: a.d,
      noBloco: false,
      aparece: 1,
      desenho: (d) => (
        <>
          {vira < 0.5 ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - 2 * vira }}>
              <Contador m={m} t={t} d={d} />
            </div>
          ) : null}
          {final && vira > 0.5 ? (
            <div style={{ position: "absolute", inset: 0, opacity: 2 * vira - 1 }}>
              <RelogioDoBloco b={final} t={t} d={d} branco={false} legenda />
            </div>
          ) : null}
        </>
      ),
    };
  }
  const b = ag.blocos.find((x) => x.momento === momento && x.cronometro);
  if (!b || !b.cronometro) return null;
  const pos = a.noBloco ? anelNoBloco(retNoTempo(b, t, ag).ret) : { cx: a.cx, cy: a.cy, d: a.d };
  if (pos.d <= 0) return null;
  // na raia, antes do bloco novo cair, o anel mostra o cronômetro anterior zerado
  const anteriorB = a.noBloco ? undefined : [...ag.blocos].reverse().find((x) => x.cronometro && x.momento < momento && x.em < b.em);
  const troca = anteriorB ? prog(t, b.em + 0.12, 0.3) : 1;
  return {
    ...pos,
    noBloco: !!a.noBloco,
    aparece: anteriorB ? 1 : prog(t, b.em + 0.18, 0.35),
    desenho: (d) => (
      <>
        {anteriorB && troca < 0.5 ? (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - 2 * troca }}>
            <RelogioDoBloco b={anteriorB} t={t} d={d} branco={false} legenda />
          </div>
        ) : null}
        <div style={{ position: "absolute", inset: 0, opacity: anteriorB ? Math.max(0, 2 * troca - 1) : 1 }}>
          <RelogioDoBloco b={b} t={t} d={d} branco={!!a.noBloco && CATEGORIAS[b.categoria].solido} legenda={!a.noBloco} />
        </div>
      </>
    ),
  };
};

const RelogioDoBloco: React.FC<{ b: BlocoNaAgenda; t: number; d: number; branco: boolean; legenda: boolean }> = ({ b, t, d, branco, legenda }) => {
  const crono = b.cronometro ?? { em: b.em, ate: b.em + 1 };
  const cat = CATEGORIAS[b.categoria];
  const restante = 1 - limitar((t - crono.em) / Math.max(0.3, crono.ate - crono.em));
  return (
    <Relogio
      d={d}
      fracao={restante}
      texto={mmss((b.maxMinutos ?? b.minutos) * 60 * restante)}
      legenda={legenda ? b.titulo : undefined}
      trilho={branco ? "rgba(255,255,255,0.28)" : cat.solido ? cor.focoFundo : cat.fundo}
      arco={branco ? "#FFFFFF" : cat.forte}
      tinta={branco ? "#FFFFFF" : cor.tinta}
      legendaCor={cat.solido ? cor.focoEscuro : cat.texto}
    />
  );
};

const Relogio: React.FC<{ d: number; fracao: number; texto: string; legenda?: string; trilho: string; arco: string; tinta: string; legendaCor: string }> = ({
  d,
  fracao,
  texto,
  legenda,
  trilho,
  arco,
  tinta,
  legendaCor,
}) => {
  const sw = Math.max(14, d * 0.075);
  const r = (d - sw) / 2;
  return (
    <div style={{ position: "relative", width: d, height: d }}>
      <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={trilho} strokeWidth={sw} />
        {fracao > 0.002 ? (
          <circle
            cx={d / 2}
            cy={d / 2}
            r={r}
            fill="none"
            stroke={arco}
            strokeWidth={sw}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${fracao} 1`}
            transform={`rotate(-90 ${d / 2} ${d / 2})`}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: sans,
          color: tinta,
        }}
      >
        <div style={{ fontSize: Math.max(36, Math.round(d * 0.22)), fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1, ...numeros }}>{texto}</div>
        {legenda ? <div style={{ marginTop: 10, fontSize: 36, fontWeight: 700, color: legendaCor }}>{legenda}</div> : null}
      </div>
    </div>
  );
};

const Contador: React.FC<{ m: Ciclos; t: number; d: number }> = ({ m, t, d }) => {
  const n = Math.max(1, m.itens.length);
  const sw = Math.max(16, d * 0.085);
  const r = (d - sw) / 2;
  const vao = 0.035;
  const acesos = m.itens.filter((i) => t >= i.em).length;
  const rotulo = m.rotulo ?? "ciclos";
  // o rótulo ("ciclos") acende quando a contagem fecha; antes, "de 4"
  const pRotulo = prog(t, Math.max(m.rotuloEm ?? 0, m.itens[n - 1]?.em ?? m.de), 0.3);
  return (
    <div style={{ position: "relative", width: d, height: d }}>
      <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: n }, (_, i) => {
          const seg = 1 / n - vao;
          const enche = prog(t, m.itens[i]?.em ?? 1e9, 0.38);
          const giro = -90 + (i / n + vao / 2) * 360;
          return (
            <g key={i} transform={`rotate(${giro} ${d / 2} ${d / 2})`}>
              <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={cor.focoFundo} strokeWidth={sw} pathLength={1} strokeDasharray={`${seg} 1`} />
              {enche > 0.002 ? (
                <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={cor.foco} strokeWidth={sw} pathLength={1} strokeDasharray={`${seg * enche} 1`} />
              ) : null}
            </g>
          );
        })}
      </svg>
      {m.contagem === false ? (
        // sem quantidade dita: o rótulo no centro ("anos", "todo dia"), a lápis até ser dito
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, padding: sw + 18 }}>
          <div
            style={{
              fontSize: Math.max(34, Math.min(Math.round(d * 0.2), Math.floor(((d - 2 * sw - 40) * Math.round(d * 0.2)) / Math.max(1, medir(rotulo, Math.round(d * 0.2)))))),
              fontWeight: 800,
              lineHeight: 1,
              textAlign: "center",
              color: pRotulo > 0.5 ? cor.focoEscuro : cor.esbocoTexto,
            }}
          >
            {rotulo}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: sans }}>
          <div style={{ fontSize: Math.round(d * 0.36), fontWeight: 800, lineHeight: 0.95, color: acesos ? cor.tinta : cor.esbocoTexto, ...numeros }}>{Math.max(1, acesos)}</div>
          <div style={{ marginTop: 6, fontSize: 36, fontWeight: 700, color: pRotulo > 0.5 ? cor.focoEscuro : cor.tintaFraca, ...numeros }}>{pRotulo > 0.5 ? rotulo : `de ${n}`}</div>
        </div>
      )}
    </div>
  );
};
