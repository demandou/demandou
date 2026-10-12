// Bloco "passos" (modo tela grande): a estrada vista de cima, como a pista da parada. À esquerda, a
// estrada desce pela tela com uma parada numerada para cada etapa; o carro anda até a parada da etapa
// dita e a rota fica acesa atrás dele. À direita de cada parada, o texto da etapa acende palavra por
// palavra; a etapa feita ganha o visto e baixa um pouco a luz. Embaixo, o contador "2 / 3".
import { Acende, mistura, prog, saindo, temposDoTexto, troca } from "../anim";
import { diagramar } from "../medidas";
import type { Palavra, Passos } from "../plano";
import { cor, rotulo, texto } from "../tema";
import { Contador } from "./Contador";
import type { Parte } from "./Painel";
import { Carro } from "./TelaParada";
import { diagramarLista } from "./TelaLista";

const AREA = { x: 84, y: 812, w: 912, h: 440 };
// a estrada (faixa de asfalto) e a coluna das paradas
const ESTRADA = { x: 104, w: 132 };
const PARADA_X = 296;

export const TelaPassos: React.FC<{ m: Passos; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const itens = [...m.itens].sort((a, b) => a.em - b.em);
  const n = Math.max(1, itens.length);
  if (parte === "fora") {
    return (
      <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
        <Contador rotulo={m.titulo ?? "Etapas"} tempos={itens.map((x) => x.em)} t={t} topo={1322} tamanho={62} />
      </div>
    );
  }
  const alturaLinha = AREA.h / n;
  const yDe = (i: number) => AREA.y + (i + 0.5) * alturaLinha;
  const temDetalhe = itens.some((x) => x.detalhe) && alturaLinha >= 44 + 42 + 22;
  const textoX = PARADA_X + 62;
  const largura = AREA.x + AREA.w - 20 - textoX;
  const corpos = diagramarLista(
    itens.map((x) => x.texto),
    largura,
    alturaLinha - (temDetalhe ? 42 : 0),
    60,
  );
  // o carro: começa acima da primeira parada e desce até a parada de cada etapa, quando ela é dita
  let carroY = AREA.y - 40;
  itens.forEach((x, i) => {
    carroY = mistura(carroY, yDe(i), prog(t, x.em - 0.1, 0.7, troca));
  });
  const estradaX = ESTRADA.x + ESTRADA.w / 2;
  const topoEstrada = AREA.y - 30;
  const fimEstrada = AREA.y + AREA.h + 30;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* a estrada vista de cima: asfalto, bordas e a faixa do meio apagada */}
        <rect x={ESTRADA.x} y={topoEstrada} width={ESTRADA.w} height={fimEstrada - topoEstrada} fill="#16181C" />
        <line x1={ESTRADA.x} y1={topoEstrada} x2={ESTRADA.x} y2={fimEstrada} stroke={cor.marfimSuave} strokeWidth={5} />
        <line x1={ESTRADA.x + ESTRADA.w} y1={topoEstrada} x2={ESTRADA.x + ESTRADA.w} y2={fimEstrada} stroke={cor.marfimSuave} strokeWidth={5} />
        <line x1={estradaX} y1={topoEstrada} x2={estradaX} y2={fimEstrada} stroke={cor.marfimFraco} strokeWidth={6} strokeDasharray="30 26" />
        {/* a rota acesa: do alto até o carro */}
        <line x1={estradaX} y1={topoEstrada} x2={estradaX} y2={Math.max(topoEstrada, carroY)} stroke={cor.marfim} strokeWidth={10} strokeLinecap="round" opacity={prog(t, (itens[0]?.em ?? 0) - 0.1, 0.3)} />
        {/* o ramal de cada parada: liga a estrada ao número */}
        {itens.map((x, i) => (
          <line
            key={`r${i}`}
            x1={ESTRADA.x + ESTRADA.w + 2}
            y1={yDe(i)}
            x2={PARADA_X - 30}
            y2={yDe(i)}
            stroke={t >= x.em - 0.05 ? cor.marfim : cor.apagado}
            strokeWidth={4}
          />
        ))}
        <Carro x={estradaX} y={carroY} giro={180} />
      </svg>

      {itens.map((item, i) => {
        const y = yDe(i);
        const proximo = itens[i + 1];
        const aceso = prog(t, item.em - 0.05, 0.3);
        // a etapa está feita quando a seguinte começa
        const feito = proximo ? prog(t, proximo.em - 0.1, 0.35) : 0;
        const tempos = temposDoTexto(item.texto, palavras, item.em - 0.3, proximo ? proximo.em : m.ate, item.em - 0.05);
        const corpo = corpos[i];
        const det = item.detalhe && temDetalhe ? diagramar(item.detalhe, { largura, maximo: 36, minimo: 30, linhas: 1, peso: 600, espacamento: 0.04 }) : null;
        const tDet = det && item.detalhe ? temposDoTexto(item.detalhe, palavras, item.em, proximo ? proximo.em : m.ate, item.em + 0.2) : [];
        const alturaBloco = corpo.tam * corpo.linhas.length * 1.04 + (det ? 10 + det.tam : 0);
        return (
          <div key={`${item.texto}-${i}`} style={{ position: "absolute", inset: 0, opacity: 1 - 0.36 * feito }}>
            {/* a parada: círculo numerado que acende e ganha o visto quando a etapa termina */}
            <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: "absolute", left: PARADA_X - 32, top: y - 32 }}>
              <circle cx={32} cy={32} r={28} fill={aceso > 0.5 ? cor.marfim : cor.vidro} fillOpacity={aceso > 0.5 ? aceso : 1} stroke={aceso > 0.02 ? cor.marfim : cor.apagado} strokeWidth={4} />
              {feito > 0.02 ? (
                <path d="M19 33 L28 42 L46 23" fill="none" stroke={cor.carcaca} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={feito < 0.999 ? `${feito} 1` : undefined} />
              ) : (
                <text x={32} y={33} textAnchor="middle" dominantBaseline="central" style={texto(700, 34, { fill: aceso > 0.5 ? cor.carcaca : cor.apagado })}>
                  {i + 1}
                </text>
              )}
            </svg>
            <div style={{ position: "absolute", left: textoX, top: y - alturaBloco / 2, width: largura }}>
              <Acende linhas={corpo.linhas} tempos={tempos} t={t} entrelinha={1.04} style={texto(700, corpo.tam, { textTransform: "uppercase" })} />
              {det ? <Acende linhas={det.linhas} tempos={tDet} t={t} style={rotulo(det.tam, { color: cor.marfimSuave, letterSpacing: "0.04em", marginTop: 10 })} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
