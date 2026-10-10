import { limitar, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Regiao } from "../layout";
import { encaixarTitulo, larguraTexto } from "../medida";
import type { Destaque as DestaqueT, Palavra } from "../plano";
import { cor, sans } from "../tema";
import { pSelo, Selo } from "./Selo";
import { TextoFalado } from "./Texto";

// Destaque em tela cheia, na névoa: o selo do exame entra primeiro (✗ vermelho no alerta, anel azul na
// palavra-chave), a frase sobe palavra por palavra ao lado dele e um traço sublinha o que bate forte.
// O detalhe entra menor, em cinza, na palavra dele. No quadro deitado, tudo fica no meio da faixa de
// névoa da base do quadro (larga e baixa), com o selo à esquerda do texto, como no vertical.
export const Destaque: React.FC<{ m: DestaqueT; t: number; fim: number; area: Regiao; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim, 0.28);
  if (sai >= 1) return null;
  const alerta = m.nivel === "alerta";
  const c = alerta ? cor.vermelho : cor.azul;
  const selo = 58;
  const xTexto = selo * 2 + 30;
  const largura = area.w - xTexto;
  const disponivel = area.h;
  const detalheTam = 48;
  const alturaDetalhe = m.detalhe ? detalheTam * 1.25 + 30 : 0;
  const e = encaixarTitulo(m.texto, { largura, max: 116, min: 56, linhas: 3, peso: 800, espacamento: -0.02, altura: disponivel - alturaDetalhe - 20, entrelinha: 1.04 });
  const alturaTexto = e.linhas.length * e.tamanho * 1.04;
  const alturaBloco = alturaTexto + alturaDetalhe + 20;
  const tempos = temposDoTexto(m.texto, palavras, m.em, m.ate, Math.max(m.de + 0.05, m.em), m.em - 0.25);
  const ultima = e.linhas[e.linhas.length - 1] ?? "";
  const larguraUltima = Math.min(largura, larguraTexto(ultima, e.tamanho, 800, -0.02));
  const fimTexto = tempos[tempos.length - 1] ?? m.em;
  const sublinha = prog(t, fimTexto + 0.25, 0.45);
  const detalheEm = m.detalheEm ?? fimTexto + 0.4;
  const revela = limitar(prog(t, detalheEm, 0.5));

  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y + Math.max(0, (area.h - alturaBloco) / 2),
        width: area.w,
        height: alturaBloco,
        opacity: 1 - sai,
        translate: `0 ${14 * sai}px`,
      }}
    >
      <svg width={selo * 2 + 8} height={selo * 2 + 8} style={{ position: "absolute", left: 0, top: Math.max(0, e.tamanho * 0.52 - selo), overflow: "visible" }}>
        {alerta ? (
          <Selo cx={selo + 4} cy={selo + 4} r={selo} tipo="errado" p={pSelo(t, m.em - 0.1)} />
        ) : (
          <g opacity={prog(t, m.em - 0.1, 0.3)}>
            <Traco d={`M ${selo + 4} 8 A ${selo - 4} ${selo - 4} 0 1 1 ${selo + 3.99} 8`} p={prog(t, m.em - 0.1, 0.55)} cor={c} largura={7} />
            <circle cx={selo + 4} cy={selo + 4} r={18 * prog(t, m.em + 0.2, 0.3)} fill={c} />
          </g>
        )}
      </svg>
      <div style={{ position: "absolute", left: xTexto, top: 0, width: largura }}>
        <TextoFalado linhas={e.linhas} tamanho={e.tamanho} peso={800} tempos={tempos} t={t} entrelinha={1.04} espacamento={-0.02} />
      </div>
      <svg width={area.w} height={20} style={{ position: "absolute", left: xTexto, top: alturaTexto + 4, overflow: "visible" }}>
        <Traco d={`M 2 6 L ${larguraUltima} 6`} p={sublinha} cor={c} largura={7} />
      </svg>
      {m.detalhe ? (
        <div
          style={{
            position: "absolute",
            left: xTexto,
            top: alturaTexto + 34,
            width: largura,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: detalheTam,
            lineHeight: 1.25,
            color: cor.cinza,
            clipPath: `inset(-10% ${(1 - revela) * 100}% -10% 0)`,
          }}
        >
          {m.detalhe}
        </div>
      ) : null}
    </div>
  );
};
