import { limitar, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Regiao } from "../layout";
import { encaixar, encaixarTitulo } from "../medida";
import type { Palavra, Pergunta as PerguntaT } from "../plano";
import { cor, sans } from "../tema";
import { TextoFalado } from "./Texto";

// Pergunta como uma ficha de consulta, na névoa: um anel azul com "?" se traça, a pergunta sobe palavra
// por palavra e as opções são linhas da ficha, cada uma com o círculo de marcar que ganha o traço azul
// quando é dita. Sem opções, o anel do "?" gira devagar (a pergunta fica no ar).
// No quadro deitado a névoa é uma faixa larga e baixa na base do quadro: a pergunta fica numa coluna
// à esquerda e as linhas da ficha numa coluna à direita (colunas, não uma pilha alta).
export const Pergunta: React.FC<{ m: PerguntaT; t: number; fim: number; area: Regiao; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim, 0.28);
  if (sai >= 1) return null;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const anel = 52;
  const xTexto = anel * 2 + 28;
  const r = 24;
  const VAO = 64;
  // a coluna da pergunta e a coluna das opções
  const larguraPergunta = opcoes.length ? Math.round(area.w * 0.5) : area.w;
  const largura = larguraPergunta - xTexto;
  const xOpcoes = larguraPergunta + VAO;
  const larguraOpcoes = area.w - xOpcoes;
  // opções: uma por linha da ficha; a letra é a maior em que todas cabem (até 2 linhas) na altura da linha
  const hFila = opcoes.length ? Math.min(110, area.h / opcoes.length) : 0;
  const wOpcao = larguraOpcoes - (r * 2 + 30);
  let tamOpcao = 58;
  const cabeOpcao = (tam: number) =>
    opcoes.every((o) => {
      const e = encaixar(o.texto, { largura: wOpcao, max: tam, min: tam, linhas: 2, peso: 700 });
      return e.linhas.length * tam * 1.1 <= hFila - 16;
    });
  while (tamOpcao > 36 && !cabeOpcao(tamOpcao)) tamOpcao -= 2;
  const linhasOpcoes = opcoes.map((o) => encaixar(o.texto, { largura: wOpcao, max: tamOpcao, min: Math.min(34, tamOpcao), linhas: 2, peso: 700 }));
  const alturaOpcoes = opcoes.length * hFila;

  const e = encaixarTitulo(m.texto, { largura, max: 104, min: 52, linhas: 4, peso: 800, espacamento: -0.02, altura: area.h, entrelinha: 1.04 });
  const alturaTexto = e.linhas.length * e.tamanho * 1.04;
  const yPergunta = Math.max(0, (area.h - alturaTexto) / 2);
  const yOpcoes = Math.max(0, (area.h - alturaOpcoes) / 2);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, Math.max(m.de + 0.05, inicio), inicio - 0.15);
  const pAnel = prog(t, Math.max(m.de, inicio) - 0.05, 0.6);
  const giro = opcoes.length ? 0 : t * 10;

  return (
    <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h, opacity: 1 - sai, translate: `0 ${14 * sai}px` }}>
      <svg
        width={anel * 2 + 8}
        height={anel * 2 + 8}
        style={{ position: "absolute", left: 0, top: yPergunta + Math.max(0, e.tamanho * 0.52 - anel), overflow: "visible" }}
      >
        <circle cx={anel + 4} cy={anel + 4} r={anel} fill={cor.branco} opacity={pAnel} />
        <g transform={`rotate(${giro} ${anel + 4} ${anel + 4})`}>
          <Traco d={`M ${anel + 4} 4 A ${anel} ${anel} 0 1 1 ${anel + 3.99} 4`} p={pAnel} cor={cor.azul} largura={6} />
        </g>
        <text
          x={anel + 4}
          y={anel + 6}
          textAnchor="middle"
          dominantBaseline="central"
          opacity={prog(t, Math.max(m.de, inicio) + 0.15, 0.3)}
          style={{ fontFamily: sans, fontWeight: 800, fontSize: anel * 1.15, fill: cor.azul }}
        >
          ?
        </text>
      </svg>
      <div style={{ position: "absolute", left: xTexto, top: yPergunta, width: largura }}>
        <TextoFalado linhas={e.linhas} tamanho={e.tamanho} peso={800} tempos={tempos} t={t} entrelinha={1.04} espacamento={-0.02} />
      </div>
      {opcoes.map((o, i) => {
        const p = prog(t, o.em - 0.05, 0.4);
        const lugar = prog(t, Math.max(m.de, inicio) + 0.3 + i * 0.1, 0.4);
        const y = yOpcoes + i * hFila;
        const enc = linhasOpcoes[i];
        const temposOp = temposDoTexto(o.texto, palavras, o.em, m.ate, o.em, o.em - 0.2);
        return (
          <div
            key={i}
            style={{ position: "absolute", left: xOpcoes, top: y, width: larguraOpcoes, height: hFila, borderTop: `2.5px solid ${cor.cinzaClaro}`, opacity: limitar(lugar * 1.5) }}
          >
            <svg width={r * 2 + 8} height={r * 2 + 8} style={{ position: "absolute", left: 2, top: hFila / 2 - r - 4, overflow: "visible" }}>
              <circle cx={r + 4} cy={r + 4} r={r} fill="none" stroke={cor.cinzaLinha} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" opacity={1 - p} />
              <Traco d={`M ${r + 4} 4 A ${r} ${r} 0 1 1 ${r + 3.99} 4`} p={p} cor={cor.azul} largura={5} />
              <circle cx={r + 4} cy={r + 4} r={9 * prog(t, o.em + 0.25, 0.25)} fill={cor.azul} />
            </svg>
            <div style={{ position: "absolute", left: r * 2 + 30, top: (hFila - enc.linhas.length * enc.tamanho * 1.1) / 2 }}>
              <TextoFalado linhas={enc.linhas} tamanho={enc.tamanho} peso={700} tempos={temposOp} t={t} lapis entrelinha={1.1} espacamento={-0.01} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
