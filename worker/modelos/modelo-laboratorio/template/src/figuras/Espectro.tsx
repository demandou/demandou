// Fig. "espectro": o Sol (a fonte) solta um feixe de luz branca que entra num prisma e se abre
// em sete cores, de cima (vermelho) para baixo (violeta). Tudo chega esboçado a lápis e é
// passado a tinta (ou pintado) no instante em que é dito.
import { caneta, limitar, prog } from "../anim";
import { Cabecalho } from "../componentes/Cabecalho";
import type { Espectro as EspectroT } from "../plano";
import { corDe, duracaoEscrita, FraseAMao, PalavraAMao } from "../tinta/Escrita";
import { circulo, Definicoes, Esboco, Seta, Traco } from "../tinta/Tinta";
import { cor, corDasPartes, ESPECTRO, H, W } from "../tema";
import { ajustar, largura } from "../medir";
import type { PropsFigura } from "./comum";

export const Espectro: React.FC<PropsFigura<EspectroT>> = ({ m, t, areas, palavras, chegada, id, opCabecalho }) => {
  const a = areas.corpo;
  const L = (x: number, y: number) => ({ x: a.x + x, y: a.y + y });
  // escala vertical: o desenho foi pensado para uma área de ~760 px de altura
  const sy = Math.min(1.12, a.h / 760);
  const P = (x: number, y: number) => L(x, y * sy);
  // modo de qualquer assunto: o feixe se abre em 2 a 5 partes com nome (desenho mais compacto à
  // esquerda, os nomes à direita, cada parte no seu `em`)
  const partes = (m.partes ?? []).slice(0, 5);
  const comPartes = partes.length >= 2;
  const k = comPartes ? 0.74 : 1;
  // com partes, o Sol e o prisma ficam no meio da altura, na frente do leque
  const centroY = a.y + 50 + (a.h - 150) / 2;
  const Q = (x: number, y: number) => (comPartes ? { x: a.x + 20 + x * k, y: centroY + (y - 262) * k } : P(x, y));
  const sol = Q(118, 250);
  const rSol = 70 * k;
  const A = Q(500, 112);
  const B = Q(342, 404);
  const C = Q(658, 404);
  const p1 = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 + 4 };
  const p2 = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 + 4 };
  const pontaX = comPartes ? a.x + 610 : a.x + 900;
  const nP = partes.length;
  const coresPartes = corDasPartes(nP).map((c, i) => (partes[i]?.cor ? corDe(partes[i].cor) : c));
  const yPartes = (i: number) => a.y + 50 + ((a.h - 150) * (i + 0.5)) / Math.max(1, nP);
  const fins = comPartes ? partes.map((_, i) => ({ x: pontaX, y: yPartes(i) })) : ESPECTRO.map((_, i) => ({ x: pontaX, y: a.y + (300 + i * 46) * sy }));
  const larguraNome = a.x + a.w - pontaX - 24;
  const corpoNome = comPartes ? Math.min(...partes.map((pt) => ajustar(pt.texto, larguraNome, 60, 40, 2).corpo)) : 46;
  const emParte = (i: number) => Math.max(partes[i].em, chegada + 0.4);

  const feixeEm = m.feixeEm ?? m.fonteEm + 0.25;
  const pSol = prog(t, m.fonteEm, 0.5, caneta);
  const pFeixe = prog(t, feixeEm, 0.45, caneta);
  const pPrisma = prog(t, feixeEm + 0.1, 0.5, caneta);
  const pDentro = prog(t, feixeEm + 0.42, 0.25, caneta);
  const pLeque = comPartes ? partes.map((_, i) => prog(t, emParte(i) - 0.15, 0.5, caneta)) : ESPECTRO.map((_, i) => prog(t, m.abreEm + i * 0.06, 0.5, caneta));
  const pPontas = prog(t, m.abreEm + 0.5, 0.4, caneta);
  const esboco = 1 - limitar(prog(t, (comPartes ? emParte(nP - 1) : m.abreEm) + 0.6, 0.4));

  const dFeixe = `M ${sol.x + rSol + 10} ${sol.y + 2} L ${p1.x} ${p1.y}`;
  const dDentro = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  const dPrisma = `M ${A.x} ${A.y} L ${C.x} ${C.y} L ${B.x} ${B.y} Z`;
  // a luz andando no feixe (tracinhos claros que correm), depois que ele foi desenhado
  const fluxo = -((t * 160) % 60);

  const raios = Array.from({ length: 10 }, (_, i) => {
    const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r0 = rSol + 14;
    const r1 = rSol + 38;
    return `M ${sol.x + r0 * Math.cos(ang)} ${sol.y + r0 * Math.sin(ang)} L ${sol.x + r1 * Math.cos(ang)} ${sol.y + r1 * Math.sin(ang)}`;
  });

  const nota = m.nota;
  const notaPos = comPartes ? { x: a.x + 10, y: Math.min(a.y + a.h - 80, B.y + 170) } : P(150, 650);
  const corpoNota = comPartes && nota ? ajustar(nota.texto, B.x - a.x + 60, 58, 40, 1).corpo : 58;
  return (
    <>
      {areas.cabecalho ? (
        <Cabecalho regiao={areas.cabecalho} t={t} de={m.de} ate={m.ate} palavras={palavras} rotulo={m.rotulo} titulo={m.titulo} destaque={m.destaque} corDestaque={m.corDestaque} chegada={chegada} opacidade={opCabecalho} />
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        {/* esboço a lápis do que vai ser desenhado */}
        <g opacity={esboco}>
          <Esboco d={circulo(sol.x, sol.y, rSol)} />
          <Esboco d={dPrisma} />
          <Esboco d={`${dFeixe} L ${p2.x} ${p2.y}`} />
          {comPartes ? (
            fins.map((f, i) => <Esboco key={i} d={`M ${p2.x} ${p2.y} L ${f.x} ${f.y}`} />)
          ) : (
            <Esboco d={`M ${p2.x} ${p2.y} L ${fins[0].x} ${fins[0].y} M ${p2.x} ${p2.y} L ${fins[6].x} ${fins[6].y}`} />
          )}
        </g>
        <g filter={`url(#${id}-mao)`}>
          {/* Sol: lápis âmbar por dentro, contorno e raios a tinta */}
          <circle cx={sol.x} cy={sol.y} r={rSol} fill={cor.ambar} opacity={0.9 * prog(t, m.fonteEm + 0.25, 0.4)} />
          <circle cx={sol.x} cy={sol.y} r={rSol} fill={`url(#${id}-lapis)`} opacity={prog(t, m.fonteEm + 0.25, 0.4)} />
          <Traco d={circulo(sol.x, sol.y, rSol)} p={pSol} largura={5} />
          {raios.map((d, i) => (
            <Traco key={i} d={d} p={prog(t, m.fonteEm + 0.2 + i * 0.03, 0.15)} largura={5} />
          ))}
          {/* prisma de vidro */}
          <path d={dPrisma} fill={cor.azulClaro} opacity={0.28 * pPrisma} />
          <path d={dPrisma} fill={`url(#${id}-hachura)`} opacity={0.35 * pPrisma} />
          <Traco d={dPrisma} p={pPrisma} largura={5} />
          {/* o leque de cores (lápis de cor) */}
          {fins.map((f, i) => (
            <Traco key={i} d={`M ${p2.x} ${p2.y} L ${f.x} ${f.y}`} p={pLeque[i]} cor={comPartes ? coresPartes[i] : ESPECTRO[i]} largura={comPartes ? 12 : 10} />
          ))}
          {/* feixe de luz branca: borda a tinta, miolo branco */}
          <Traco d={dFeixe} p={pFeixe} largura={24} />
          <Traco d={dFeixe} p={pFeixe} cor="#FFFFFF" largura={13} />
          <Traco d={dDentro} p={pDentro} largura={20} opacidade={0.85} />
          <Traco d={dDentro} p={pDentro} cor="#FFFFFF" largura={11} />
          {pDentro > 0.99 ? (
            <path d={`${dFeixe} L ${p2.x} ${p2.y}`} fill="none" stroke={cor.ambar} strokeWidth={5} strokeDasharray="10 50" strokeDashoffset={fluxo} strokeLinecap="round" opacity={0.85} />
          ) : null}
        </g>
        {/* a ponta de cada parte: uma bolinha na cor dela */}
        {comPartes
          ? fins.map((f, i) => (pLeque[i] > 0.97 ? <circle key={`b${i}`} cx={f.x} cy={f.y} r={11} fill={coresPartes[i]} stroke={cor.tinta} strokeWidth={3.5} /> : null))
          : null}
        {nota && !comPartes ? (
          <Seta
            de={{ x: notaPos.x + Math.max(360, largura(nota.texto, corpoNota) + 18), y: notaPos.y + 10 }}
            ate={{ x: a.x + 760, y: a.y + 420 * sy }}
            p={prog(t, nota.em + 0.45, 0.4, caneta)}
            curva={0.25}
            cor={corDe(nota.cor)}
          />
        ) : null}
      </svg>
      {/* rótulos à mão */}
      {m.fonte ? (
        <div style={{ position: "absolute", left: Math.max(a.x - 40, sol.x - 130), top: sol.y + rSol + 38, width: 260, textAlign: "center" }}>
          <PalavraAMao texto={m.fonte} corpo={ajustar(m.fonte, 250, 56, 36, 1).corpo} p={prog(t, m.fonteEm, duracaoEscrita(m.fonte), caneta)} />
        </div>
      ) : null}
      {m.feixe ? (
        <div style={{ position: "absolute", left: sol.x + rSol + 16, top: sol.y - 100 }}>
          <PalavraAMao texto={m.feixe} corpo={ajustar(m.feixe, A.x - (sol.x + rSol + 16) + 40, 46, 34, 1).corpo} p={prog(t, feixeEm, duracaoEscrita(m.feixe), caneta)} />
        </div>
      ) : null}
      {comPartes
        ? partes.map((pt, i) => {
            const q = ajustar(pt.texto, larguraNome, corpoNome, Math.min(corpoNome, 40), 2);
            const alturaNome = q.linhas.length * q.corpo * 1.08;
            return (
              <div key={i} style={{ position: "absolute", left: pontaX + 26, top: fins[i].y - alturaNome / 2 - 4, width: larguraNome, display: "flex", flexDirection: "column" }}>
                {q.linhas.map((l, j) => (
                  <div key={j} style={{ height: q.corpo * 1.08 }}>
                    <FraseAMao texto={l} em={emParte(i) + j * 0.25} ate={partes[i + 1]?.em ?? m.ate} palavras={palavras} t={t} corpo={q.corpo} cor={coresPartes[i]} />
                  </div>
                ))}
              </div>
            );
          })
        : null}
      {m.pontas && !comPartes ? (
        <>
          <div style={{ position: "absolute", left: pontaX - 300, top: fins[0].y - 84, width: 300, textAlign: "right" }}>
            <PalavraAMao texto={m.pontas[0]} corpo={46} p={pPontas} cor={ESPECTRO[0]} />
          </div>
          <div style={{ position: "absolute", left: pontaX - 300, top: fins[6].y + 16, width: 300, textAlign: "right" }}>
            <PalavraAMao texto={m.pontas[1]} corpo={46} p={pPontas} cor={ESPECTRO[6]} />
          </div>
        </>
      ) : null}
      {nota ? (
        <div style={{ position: "absolute", left: notaPos.x, top: notaPos.y - 40 }}>
          <FraseAMao texto={nota.texto} em={nota.em} ate={m.ate} palavras={palavras} t={t} corpo={corpoNota} cor={corDe(nota.cor)} />
        </div>
      ) : null}
    </>
  );
};
