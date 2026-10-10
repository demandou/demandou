// Título: a ideia-chave vira um nó grande do mapa. Em cima, à esquerda do cartão da pessoa, o nó de
// origem (com o letreiro); dele desce um ramo grosso até o título, que se escreve palavra por palavra,
// com o marca-texto no trecho em destaque. Embaixo, pontos com espaço crescente (os intervalos).
import { caneta, Escrita, indicesDoTrecho, prog, ramo, temposDoTexto, Traco } from "../anim";
import { diagramar } from "../medidas";
import type { Palavra, Titulo as TTitulo } from "../plano";
import { CARTAO, cor, DIREITA_BAIXO, MARGEM, rotulo, sans, titulo as estiloTitulo } from "../tema";
import { No } from "./No";

const TOPO_TITULO = 930;

export const Titulo: React.FC<{ m: TTitulo; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const larguraEsq = CARTAO.titulo.x - MARGEM - 40;
  const d = diagramar(m.texto, { largura: DIREITA_BAIXO - MARGEM, maximo: 156, minimo: 84, linhas: 3, altura: 430 });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate);
  const apoioTempos = m.apoio ? temposDoTexto(m.apoio, palavras, m.de, m.ate) : [];
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const pOrigem = prog(t, m.de - 0.3, 0.4);
  const xOrigem = MARGEM + 10;
  const yOrigem = 470;
  // o ramo grosso desce do nó de origem até o começo do título
  const pRamo = prog(t, (apoioTempos[0] ?? tempos[0]) - 0.15, 0.5, caneta);
  const yTitulo = TOPO_TITULO + (m.apoio ? 84 : 0);
  const fimTitulo = yTitulo + d.linhas.length * d.tamanho * 1.04;
  const intervalos = m.intervalos ?? [];
  const maxDia = Math.max(1, ...intervalos);
  const xDe = (dia: number) => MARGEM + 20 + Math.sqrt(dia / maxDia) * (DIREITA_BAIXO - MARGEM - 60);
  const yPontos = Math.min(1420, fimTitulo + 100);

  return (
    <>
      {m.rotulo ? <div style={{ ...rotulo, position: "absolute", left: MARGEM, top: 250, width: larguraEsq }}>{m.rotulo}</div> : null}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {m.origem ? (
          <>
            <path d={ramo(xOrigem + 120, yOrigem + 40, MARGEM + 30, TOPO_TITULO - 18, true)} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="2 14" strokeLinecap="round" />
            <Traco d={ramo(xOrigem + 120, yOrigem + 40, MARGEM + 30, TOPO_TITULO - 18, true)} p={pRamo} cor={cor.tinta} largura={9} />
          </>
        ) : null}
        {intervalos.map((dia, i) => {
          // os pontos acompanham o título: um a cada ~0,2 s desde a primeira palavra
          const p = prog(t, (tempos[0] ?? m.de) + 0.1 + i * 0.22, 0.3);
          const anterior = intervalos[i - 1];
          return (
            <g key={`i-${dia}`}>
              {anterior !== undefined ? (
                <Traco d={`M ${xDe(anterior) + 22} ${yPontos} L ${xDe(dia) - 22} ${yPontos}`} p={p} cor={cor.tinta} largura={5} strokeDasharray="1 14" />
              ) : null}
              <circle cx={xDe(dia)} cy={yPontos} r={16} fill={cor.cartao} stroke={cor.lapisClaro} strokeWidth={4} strokeDasharray="4 6" />
              <circle cx={xDe(dia)} cy={yPontos} r={16 * p} fill={cor.marca} stroke={cor.tinta} strokeWidth={5 * p} />
              <text x={xDe(dia)} y={yPontos + 62} textAnchor={i === 0 ? "start" : "middle"} dx={i === 0 ? -18 : 0} fontFamily={sans} fontWeight={p > 0.5 ? 700 : 500} fontSize={34} fill={p > 0.5 ? cor.tinta : cor.lapis}>
                {dia === 0 ? (m.zero ?? 0) : dia}
              </text>
            </g>
          );
        })}
      </svg>
      {m.origem ? <No x={xOrigem} y={yOrigem} ancora="esquerda" texto={m.origem} tamanho={44} peso={700} aparece={pOrigem} estado={{ tinta: 1, cheio: 1 }} /> : null}
      {m.apoio ? (
        <div style={{ position: "absolute", left: MARGEM + 70, top: TOPO_TITULO }}>
          <Escrita linhas={[m.apoio]} tempos={apoioTempos} t={t} estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tintaSuave }} tamanho={56} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: MARGEM, top: yTitulo }}>
        <Escrita linhas={d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={d.tamanho} destaque={destaque} entrelinha={1.04} />
      </div>
    </>
  );
};
