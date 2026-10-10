// Peças comuns das folhas dos blocos universais: a linha impressa com régua no alto da área (quando
// a foto está no "topo" e não há cabeçalho ao lado dela) e o título do bloco nesse caso.
import { prog } from "../anim";
import { Cabecalho, Impresso } from "../componentes/Cabecalho";
import type { Areas, Regiao } from "../layout";
import type { Palavra } from "../plano";
import { cor } from "../tema";

// A linha impressa do caderno no alto de uma área, com a régua embaixo; ocupa 66 px
export const LinhaImpressa: React.FC<{ a: Regiao; t: number; revela: number; esquerda?: string; direita?: string; centro?: boolean }> = ({ a, t, revela, esquerda, direita, centro }) => {
  const papel = prog(t, revela - 0.25, 0.3);
  return (
    <>
      <div style={{ position: "absolute", left: a.x, top: a.y, width: a.w, display: "flex", justifyContent: centro ? "center" : "space-between", opacity: papel }}>
        <Impresso texto={esquerda ?? ""} larguraMax={centro ? a.w : a.w * 0.62} />
        {centro ? null : <Impresso texto={direita ?? ""} larguraMax={a.w * 0.36} />}
      </div>
      <div style={{ position: "absolute", left: a.x, top: a.y + 52, width: a.w, height: 3, background: cor.tinta, opacity: 0.55 * papel }} />
    </>
  );
};

// O cabeçalho de um bloco: ao lado da foto (direita/esquerda) ou, com a foto no topo, no alto da
// área do desenho. Devolve a área que sobra para o corpo do bloco.
export const cabecalhoDoBloco = (o: {
  areas: Areas;
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  chegada: number;
  revela: number;
  rotulo?: string;
  titulo?: string | string[];
  em?: number;
  opacidade?: number;
  // altura que o bloco quer deixar livre no cabeçalho, embaixo do título (desenho do bloco)
  reservaAbaixo?: number;
}): { elemento: React.ReactNode; corpo: Regiao } => {
  const { areas } = o;
  if (areas.cabecalho) {
    return {
      elemento: (
        <Cabecalho
          regiao={areas.cabecalho}
          t={o.t}
          de={o.de}
          ate={o.ate}
          palavras={o.palavras}
          rotulo={o.rotulo}
          titulo={o.titulo}
          chegada={o.chegada}
          opacidade={o.opacidade}
          em={o.em}
          reservaAbaixo={o.reservaAbaixo}
        />
      ),
      corpo: areas.corpo,
    };
  }
  // foto no topo: linha impressa + título numa faixa no alto da área
  const a = areas.corpo;
  const temTitulo = (Array.isArray(o.titulo) ? o.titulo.join(" ") : (o.titulo ?? "")).trim().length > 0;
  const faixa = temTitulo ? 66 + 110 : 66 + 20;
  const regiaoTitulo: Regiao = { x: a.x, y: a.y + 66, w: a.w, h: 104 };
  return {
    elemento: (
      <>
        <LinhaImpressa a={a} t={o.t} revela={o.revela} esquerda={o.rotulo} />
        {temTitulo ? (
          <Cabecalho regiao={regiaoTitulo} t={o.t} de={o.de} ate={o.ate} palavras={o.palavras} titulo={o.titulo} chegada={o.chegada} em={o.em} max={88} min={64} />
        ) : null}
      </>
    ),
    corpo: { x: a.x, y: a.y + faixa, w: a.w, h: a.h - faixa },
  };
};
