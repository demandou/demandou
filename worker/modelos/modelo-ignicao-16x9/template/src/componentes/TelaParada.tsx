// Momento "parada" (modo retrovisor da direita): no alto do painel, na faixa da condição, as luzes
// da condição piscam (à esquerda) e a condição se acende (à direita); na tela central, a pista vista
// de cima — o carro anda, encosta no acostamento quando a pessoa diz "encosta" — e os passos, um a
// um, com o visto. (px da camada do painel: o layout.ts desloca tudo para o quadro da esquerda)
import { Acende, prog, saindo, temposDoTexto } from "../anim";
import { diagramar } from "../medidas";
import type { Palavra, Parada } from "../plano";
import { cor, rotulo, texto } from "../tema";
import type { Parte } from "./Painel";
import { Vidro } from "./Painel";

// painel da condição e área da pista/passos (na tela central). No quadro deitado o painel da condição
// é uma faixa larga em cima da tela central, com a largura dela: a fileira de luzes ocupa a ponta
// esquerda (ver "lateral" em layout.ts) e o texto, o resto (TEXTO_DA_CONDICAO, px dentro da faixa)
export const CONDICAO = { x: 60, y: 498, w: 960, h: 250 };
export const TEXTO_DA_CONDICAO = { x: 414, y: 22, w: 518, h: 206 };
const PISTA = { x: 84, y: 816, w: 360, h: 320 };
const PASSOS = { x: 472, y: 822, w: 530 };

// distância percorrida (px de pista) até t, integrando a velocidade
const distancia = (t: number, de: number, vel: (t: number) => number) => {
  let d = 0;
  const passo = 0.04;
  for (let x = de; x < t; x += passo) d += vel(x) * passo;
  return d * 9;
};

export const Carro: React.FC<{ x: number; y: number; giro: number }> = ({ x, y, giro }) => (
  <g transform={`translate(${x} ${y}) rotate(${giro})`}>
    {/* retrovisores */}
    <rect x={-44} y={-26} width={12} height={9} rx={3} fill={cor.marfim} />
    <rect x={32} y={-26} width={12} height={9} rx={3} fill={cor.marfim} />
    <rect x={-35} y={-64} width={70} height={128} rx={20} fill="#1B1E22" stroke={cor.marfim} strokeWidth={4.5} />
    {/* para-brisa e vidro traseiro */}
    <path d="M-25 -30 Q0 -40 25 -30 L21 -10 Q0 -14 -21 -10 Z" fill={cor.marfimFraco} />
    <path d="M-22 36 Q0 41 22 36 L19 50 Q0 54 -19 50 Z" fill={cor.marfimFraco} />
  </g>
);

export const TelaParada: React.FC<{
  m: Parada;
  palavras: Palavra[];
  t: number;
  inicio: number;
  fim: number;
  vel: (t: number) => number;
  parte: Parte;
}> = ({ m, palavras, t, inicio, fim, vel, parte }) => {
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const passos = [...m.passos].sort((a, b) => a.em - b.em);

  // condição
  const cond = diagramar(m.condicao, { largura: TEXTO_DA_CONDICAO.w, maximo: 64, minimo: 44, linhas: 4, altura: TEXTO_DA_CONDICAO.h, entrelinha: 1.06, peso: 700 });
  const tCond = temposDoTexto(m.condicao, palavras, m.de, passos[0]?.em ?? m.ate);

  // pista: o carro na faixa da direita; encostar o leva ao acostamento
  const encostar = passos.find((p) => p.acao === "encostar");
  const pEncosta = encostar ? prog(t, encostar.em + 0.05, 1.4) : 0;
  const faixa = 171;
  const acostamento = 282;
  const carroX = faixa + (acostamento - faixa) * pEncosta;
  const giroCarro = 14 * Math.sin(Math.PI * pEncosta);
  const andou = distancia(t, m.de - 0.2, vel);
  const tracejado = 46;
  const vao = 34;
  const deslocamento = andou % (tracejado + vao);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      {parte === "fora" ? (
        <>
      {/* painel da condição (a faixa em cima da tela; as luzes piscam na ponta esquerda dela) */}
      <Vidro r={CONDICAO} raio={26} opacidade={1}>
        <div style={{ position: "absolute", left: TEXTO_DA_CONDICAO.x - 26, top: 30, width: 2, height: CONDICAO.h - 60, background: cor.linha }} />
        <div
          style={{
            position: "absolute",
            left: TEXTO_DA_CONDICAO.x,
            top: TEXTO_DA_CONDICAO.y,
            width: TEXTO_DA_CONDICAO.w,
            height: TEXTO_DA_CONDICAO.h,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Acende linhas={cond.linhas} tempos={tCond} t={t} entrelinha={1.06} style={texto(700, cond.tam, { textTransform: "uppercase" })} />
        </div>
      </Vidro>

        </>
      ) : null}
      {parte === "tela" ? (
        <>
      {/* a pista vista de cima */}
      <div style={{ position: "absolute", left: PISTA.x, top: PISTA.y, width: PISTA.w, height: PISTA.h, borderRadius: 18, overflow: "hidden", background: "#0F1114" }}>
        <svg width={PISTA.w} height={PISTA.h} style={{ position: "absolute", inset: 0 }}>
          {/* acostamento com hachura discreta */}
          <defs>
            <pattern id="hachura" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${andou % 22}) rotate(35)`}>
              <line x1="0" y1="0" x2="0" y2="22" stroke="rgba(241,237,228,0.07)" strokeWidth="6" />
            </pattern>
          </defs>
          <rect x={36} y={0} width={180} height={PISTA.h} fill="#16181C" />
          <rect x={216} y={0} width={144} height={PISTA.h} fill="url(#hachura)" />
          {/* bordas da pista */}
          <line x1={36} y1={0} x2={36} y2={PISTA.h} stroke={cor.marfimSuave} strokeWidth={5} />
          <line x1={216} y1={0} x2={216} y2={PISTA.h} stroke={cor.marfimSuave} strokeWidth={5} />
          {/* faixa central tracejada, correndo com a velocidade */}
          {Array.from({ length: 8 }, (_, i) => {
            const y = -tracejado + i * (tracejado + vao) + deslocamento;
            return <rect key={i} x={123} y={y} width={6} height={tracejado} rx={2} fill={cor.marfimFraco} />;
          })}
          <Carro x={carroX} y={192} giro={giroCarro} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 338,
            top: PISTA.h / 2,
            translate: "-50% -50%",
            rotate: "-90deg",
            whiteSpace: "nowrap",
            ...rotulo(34, { color: pEncosta > 0.6 ? cor.marfimSuave : cor.marfimFraco }),
          }}
        >
          Acostamento
        </div>
      </div>

      {/* passos */}
      <div style={{ position: "absolute", left: PASSOS.x, top: PASSOS.y, width: PASSOS.w }}>
        <div style={rotulo(32)}>O que fazer</div>
        {passos.map((p, i) => {
          const proximo = passos[i + 1];
          const tx = diagramar(p.texto, { largura: PASSOS.w - 96, maximo: passos.length >= 3 ? 46 : 56, minimo: 44, linhas: 2, peso: 700 });
          const tempos = temposDoTexto(p.texto, palavras, p.em - 0.3, proximo ? proximo.em : m.ate + 0.3, p.em);
          const aceso = prog(t, p.em - 0.05, 0.3);
          // o visto: quando o passo seguinte começa, ou quando a ação termina
          const feito = prog(t, proximo ? proximo.em - 0.1 : p.em + (p.acao === "desligar" ? 0.9 : 1.6), 0.35);
          return (
            <div key={`${p.texto}-${i}`} style={{ display: "flex", alignItems: "flex-start", marginTop: i === 0 ? 18 : 24 }}>
              <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0, marginTop: Math.max(0, (tx.tam - 64) / 2) }}>
                <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: "absolute", inset: 0 }}>
                  <circle cx={32} cy={32} r={28} fill={aceso > 0.5 ? cor.marfim : "none"} fillOpacity={aceso} stroke={aceso > 0.02 ? cor.marfim : cor.apagado} strokeWidth={4} />
                  {feito > 0.02 ? (
                    <path d="M19 33 L28 42 L46 23" fill="none" stroke={cor.carcaca} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${feito} 1`} />
                  ) : (
                    <text x={32} y={33} textAnchor="middle" dominantBaseline="central" fontFamily="inherit" style={texto(700, 34, { fill: aceso > 0.5 ? cor.carcaca : cor.apagado })}>
                      {i + 1}
                    </text>
                  )}
                </svg>
              </div>
              <Acende linhas={tx.linhas} tempos={tempos} t={t} entrelinha={1.04} style={texto(700, tx.tam, { textTransform: "uppercase", marginLeft: 28 })} />
            </div>
          );
        })}
      </div>
        </>
      ) : null}
    </div>
  );
};
