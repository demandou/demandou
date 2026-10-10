// Fig. "ondas": duas (ou três) ondas lado a lado, cada uma com a medida de um comprimento de onda;
// no fim de cada onda, uma partícula espalha muito (onda curta) ou pouco (onda longa).
import { caneta, prog } from "../anim";
import { Cabecalho } from "../componentes/Cabecalho";
import type { Ondas as OndasT } from "../plano";
import { corDe, duracaoEscrita, FraseAMao, PalavraAMao } from "../tinta/Escrita";
import { Cota, Definicoes, Esboco, Molecula, Seta, Traco } from "../tinta/Tinta";
import { cor, H, mono, W } from "../tema";
import { ajustar } from "../medir";
import type { PropsFigura } from "./comum";
import { Espalhar } from "./Particulas";

// Caminho de uma onda (seno) de x0 a x1, com `ciclos` ondas, deslocada de `fase` px
const seno = (x0: number, x1: number, y: number, amp: number, ciclos: number, fase: number) => {
  const lambda = (x1 - x0) / ciclos;
  const pts: string[] = [];
  const passos = Math.max(60, Math.round(ciclos * 28));
  for (let i = 0; i <= passos; i++) {
    const x = x0 + ((x1 - x0) * i) / passos;
    const yy = y - amp * Math.sin(((x - x0 - fase) / lambda) * Math.PI * 2);
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  return pts.join(" ");
};

export const Ondas: React.FC<PropsFigura<OndasT>> = ({ m, t, areas, palavras, chegada, id, opCabecalho }) => {
  const a = areas.corpo;
  const ondas = m.ondas.slice(0, 3);
  const n = ondas.length;
  // cada onda ocupa uma faixa: rótulo, onda, medida
  const faixa = a.h / n;
  const amp = Math.min(64, faixa * 0.17);
  const x0 = a.x + 24;
  const x1 = a.x + 700;
  const xPart = a.x + 812;
  const medirEm = m.medirEm ?? Math.max(...ondas.map((o) => o.em)) + 0.4;
  return (
    <>
      {areas.cabecalho ? (
        <Cabecalho regiao={areas.cabecalho} t={t} de={m.de} ate={m.ate} palavras={palavras} rotulo={m.rotulo} titulo={m.titulo} destaque={m.destaque} corDestaque={m.corDestaque} chegada={chegada} opacidade={opCabecalho} />
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Definicoes id={id} />
        {ondas.map((o, i) => {
          const y = a.y + faixa * i + faixa * 0.36;
          const c = corDe(o.cor);
          const lambda = (x1 - x0) / o.ciclos;
          // a onda anda para a direita, sem parar, depois de desenhada
          const fase = Math.max(0, t - o.em) * 110;
          const pOnda = prog(t, o.em, 0.75, caneta);
          // a medida pega um comprimento inteiro de crista a crista, perto do meio
          const k = Math.max(0, Math.floor((o.ciclos - 1) / 2));
          const crista = x0 + lambda * (k + 0.25);
          const crista2 = crista + lambda;
          const yCota = y + amp + 40;
          const pCota = prog(t, medirEm + i * 0.15, 0.45, caneta);
          const espalhaEm = o.espalhaEm ?? medirEm + 0.6 + i * 0.5;
          return (
            <g key={i}>
              <Esboco d={`M ${x0} ${y} L ${x1} ${y}`} opacidade={1 - pOnda} />
              <path d={`M ${x0} ${y} L ${x1} ${y}`} stroke={cor.tinta} strokeWidth={2} strokeDasharray="4 10" opacity={0.45 * pOnda} />
              <g filter={`url(#${id}-mao)`}>
                <Traco d={seno(x0, x1, y, amp, o.ciclos, fase)} p={pOnda} cor={c} largura={8} />
              </g>
              {/* linhas finas marcando as duas cristas medidas */}
              {pCota > 0 ? (
                <g opacity={pCota}>
                  <path d={`M ${crista} ${y - amp - 6} L ${crista} ${yCota + 8}`} stroke={cor.tinta} strokeWidth={2.5} strokeDasharray="5 6" />
                  <path d={`M ${crista2} ${y - amp - 6} L ${crista2} ${yCota + 8}`} stroke={cor.tinta} strokeWidth={2.5} strokeDasharray="5 6" />
                </g>
              ) : null}
              <Cota de={{ x: crista, y: yCota }} ate={{ x: crista2, y: yCota }} p={pCota} />
              <Molecula x={xPart} y={y} p={1 - pOnda} esboco angulo={30 + i * 50} />
              <Molecula x={xPart} y={y} p={prog(t, o.em + 0.5, 0.3)} angulo={30 + i * 50} r={16} />
              <Espalhar x={xPart} y={y} t={t} em={espalhaEm} n={Math.round((o.espalha ?? 0.5) * 18)} alcance={70 + 60 * (o.espalha ?? 0.5)} cor={c} semente={11 + i} />
            </g>
          );
        })}
        {m.nota ? (
          <Seta
            de={{ x: a.x + 690, y: a.y + 40 }}
            ate={{ x: xPart - 40, y: a.y + faixa * 0.36 - 64 }}
            p={prog(t, m.nota.em + 0.3, 0.35, caneta)}
            curva={-0.3}
            cor={corDe(m.nota.cor)}
          />
        ) : null}
      </svg>
      {ondas.map((o, i) => {
        const y = a.y + faixa * i + faixa * 0.36;
        const c = corDe(o.cor);
        const lambda = (x1 - x0) / o.ciclos;
        const k = Math.max(0, Math.floor((o.ciclos - 1) / 2));
        const meio = x0 + lambda * (k + 0.75);
        const pCota = prog(t, medirEm + i * 0.15, 0.45, caneta);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x0 - 4, top: y - amp - 104 }}>
              <PalavraAMao texto={o.rotulo} corpo={ajustar(o.rotulo, 600, 56, 40, 1).corpo} p={prog(t, o.em, duracaoEscrita(o.rotulo), caneta)} cor={c} />
            </div>
            {o.medida ? (
              <div
                style={{
                  position: "absolute",
                  left: Math.max(a.x, Math.min(a.x + a.w - 640, meio - 320)),
                  top: y + amp + 58,
                  width: 640,
                  whiteSpace: "nowrap",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "baseline",
                  gap: 18,
                }}
              >
                <PalavraAMao texto={o.medida} corpo={ajustar(o.medida, o.valor ? 400 : 620, 48, 36, 1).corpo} p={pCota} />
                {o.valor ? <span style={{ fontFamily: mono, fontWeight: 700, fontSize: 36, color: cor.tintaSuave, opacity: pCota }}>{o.valor}</span> : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {m.nota ? (
        <div style={{ position: "absolute", left: a.x + 380, top: a.y - 14 }}>
          <FraseAMao texto={m.nota.texto} em={m.nota.em} ate={m.ate} palavras={palavras} t={t} corpo={ajustar(m.nota.texto, a.w - 400, 58, 40, 1).corpo} cor={corDe(m.nota.cor)} />
        </div>
      ) : null}
    </>
  );
};
