// O PALCO: o terço de cima, sempre ocupado. Cada momento entra por cima do anterior e fica até o
// próximo entrar — nunca há palco vazio nem dois textos transparentes um sobre o outro: o que entra
// é opaco e cobre o que sai (cortina com um fio azul na borda, ou deslize de baixo/da direita com
// o anterior recuando um pouco). Quando a troca termina, o anterior sai de cena.
import { AbsoluteFill } from "remotion";
import type { Entrada, Momento, Plano } from "../plano";
import { COR, FONTE, LARGURA, MARGEM, PALCO_H, prog, suave } from "../tema";
import { Abertura, Capitulo, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Insercao, Numero, Passos, Pergunta, Topicos } from "./Blocos";

export const DUR_TROCA = 0.5;

const Bloco: React.FC<{ plano: Plano; m: Momento; t: number; fim: number }> = ({ plano, m, t, fim }) => {
  switch (m.tipo) {
    case "insercao":
      return <Insercao plano={plano} m={m} t={t} fim={fim} />;
    case "capitulo":
      return <Capitulo plano={plano} m={m} t={t} fim={fim} />;
    case "abertura":
      return <Abertura plano={plano} m={m} t={t} fim={fim} />;
    case "topicos":
      return <Topicos plano={plano} m={m} t={t} fim={fim} />;
    case "passos":
      return <Passos plano={plano} m={m} t={t} fim={fim} />;
    case "numero":
      return <Numero plano={plano} m={m} t={t} fim={fim} />;
    case "comparacao":
      return <Comparacao plano={plano} m={m} t={t} fim={fim} />;
    case "grafico":
      return <Grafico plano={plano} m={m} t={t} fim={fim} />;
    case "destaque":
      return <Destaque plano={plano} m={m} t={t} fim={fim} />;
    case "definicao":
      return <Definicao plano={plano} m={m} t={t} fim={fim} />;
    case "frase":
      return <Frase plano={plano} m={m} t={t} fim={fim} />;
    case "pergunta":
      return <Pergunta plano={plano} m={m} t={t} fim={fim} />;
    case "cta":
      return <Cta plano={plano} m={m} t={t} fim={fim} />;
    default:
      return null;
  }
};

export const entradaDo = (m: Momento): Entrada => m.entrada ?? (m.tipo === "insercao" ? "cortina" : "deslize");

// antes do primeiro momento: o nome de quem fala (ou só o palco com o fio azul)
const Repouso: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => (
  <AbsoluteFill style={{ background: COR.palco }}>
    {plano.marca?.nome ? (
      <div style={{ position: "absolute", left: MARGEM, top: PALCO_H / 2 - 60, fontFamily: FONTE, color: COR.osso }}>
        <div style={{ fontWeight: 800, fontSize: 64 }}>{plano.marca.nome}</div>
        {plano.marca.area ? <div style={{ fontWeight: 600, fontSize: 34, color: COR.apagado, marginTop: 6 }}>{plano.marca.area}</div> : null}
      </div>
    ) : null}
    <div style={{ position: "absolute", left: MARGEM, top: PALCO_H / 2 + 70, width: 140 * prog(t, 0, 0.6), height: 8, borderRadius: 4, background: COR.cobalto }} />
  </AbsoluteFill>
);

export const Palco: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const momentos = [...plano.momentos].sort((a, b) => a.de - b.de);
  // o momento fica no palco até o próximo terminar de entrar
  const fimDe = (i: number) => (momentos[i + 1] ? momentos[i + 1].de + DUR_TROCA : plano.duracao + 1);
  let i = -1;
  momentos.forEach((m, k) => {
    if (t >= m.de) i = k;
  });
  const atual = momentos[i];
  const trocando = i >= 0 && t < atual.de + DUR_TROCA;
  const p = trocando ? prog(t, atual.de, DUR_TROCA, suave) : 1;
  const tipo = atual ? entradaDo(atual) : "deslize";

  // o que estava no palco (ou o repouso, antes do primeiro momento)
  const anterior =
    i <= 0 ? (
      <Repouso plano={plano} t={t} />
    ) : (
      <Bloco plano={plano} m={momentos[i - 1]} t={t} fim={fimDe(i - 1)} />
    );

  let fundo: React.CSSProperties = {};
  let frente: React.CSSProperties = {};
  let fio: React.ReactNode = null;
  if (trocando) {
    if (tipo === "cortina") {
      frente = { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
      fio = <div style={{ position: "absolute", left: p * LARGURA - 3, top: 0, width: 6, height: PALCO_H, background: COR.cobalto, opacity: 1 - prog(t, atual.de + DUR_TROCA * 0.75, DUR_TROCA * 0.25) }} />;
    } else if (tipo === "lateral") {
      frente = { transform: `translateX(${(1 - p) * LARGURA}px)`, boxShadow: "-20px 0 40px rgba(0,0,0,0.35)" };
      fundo = { transform: `translateX(${-p * LARGURA * 0.25}px)` };
    } else {
      frente = { transform: `translateY(${(1 - p) * PALCO_H}px)`, boxShadow: "0 -20px 40px rgba(0,0,0,0.35)" };
      fundo = { transform: `translateY(${-p * PALCO_H * 0.25}px)` };
    }
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: PALCO_H, overflow: "hidden", background: COR.palco }}>
      {i < 0 ? (
        <Repouso plano={plano} t={t} />
      ) : trocando ? (
        <>
          <AbsoluteFill style={fundo}>{anterior}</AbsoluteFill>
          <AbsoluteFill style={frente}>
            <Bloco plano={plano} m={atual} t={t} fim={fimDe(i)} />
          </AbsoluteFill>
          {fio}
        </>
      ) : (
        <AbsoluteFill>
          <Bloco plano={plano} m={atual} t={t} fim={fimDe(i)} />
        </AbsoluteFill>
      )}
    </div>
  );
};
