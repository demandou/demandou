import { prog, troca } from "../anim";
import type { DesenhoB, LinhaB, Seta } from "../blocos";
import type { Campo as CampoT, Plano } from "../plano";
import { CAMPOS, LUZ, letreiro, mono, QUADRO } from "../tema";
import { Assinatura, Letreiros, vazadoDaJanela } from "./Cartaz";
import { Campo } from "./Campo";
import { GraficoManifesto } from "./GraficoManifesto";
import { IconeChamada } from "./Icones";
import { LinhaDeTexto } from "./Texto";

type Cores = (typeof CAMPOS)[CampoT];

// O outro campo do par (comparação: o lado de baixo usa a outra cor)
export const outroCampo = (c: CampoT): CampoT => (c === "cobalto" ? "papel" : "cobalto");

// Letreiro pequeno (DM Mono, caixa-alta espaçada): já está no lugar "a lápis" e ganha tinta da
// esquerda para a direita quando é dito.
const Letreiro: React.FC<{ l: LinhaB; t: number; cor: string; lapis: string }> = ({ l, t, cor, lapis }) => {
  const em = l.tempos[0] ?? 0;
  const p = prog(t, em - 0.04, 0.26);
  const c = l.caixa;
  const base: React.CSSProperties = {
    ...letreiro,
    fontFamily: mono,
    position: "absolute",
    left: c.x,
    width: c.largura,
    top: l.y,
    textAlign: c.alinhar === "esquerda" ? "left" : c.alinhar === "direita" ? "right" : "center",
    whiteSpace: "nowrap",
  };
  return (
    <>
      {p < 1 ? <div style={{ ...base, color: lapis }}>{l.palavras.join(" ")}</div> : null}
      <div style={{ ...base, color: cor, clipPath: p < 1 ? `inset(-0.3em ${(1 - p) * 100}% -0.3em 0)` : undefined }}>{l.palavras.join(" ")}</div>
    </>
  );
};

// Seta dos passos: um traço grosso de acento que desce de um passo ao outro quando o próximo é dito.
const SetaDoPasso: React.FC<{ s: Seta; t: number; cor: string; lapis: string }> = ({ s, t, cor, lapis }) => {
  const p = prog(t, s.em - 0.12, 0.3, troca);
  const x = s.x;
  const h = s.y2 - s.y1;
  const ponta = 22;
  return (
    <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0 }}>
      <path d={`M${x} ${s.y1} V${s.y2 - 4} M${x - ponta} ${s.y2 - ponta} L${x} ${s.y2} L${x + ponta} ${s.y2 - ponta}`} stroke={lapis} strokeWidth={9} fill="none" />
      {p > 0 ? (
        <g style={{ clipPath: `inset(0 0 ${(1 - p) * 100}% 0)` }}>
          <path
            d={`M${x} ${s.y1} V${s.y1 + h - 4} M${x - ponta} ${s.y2 - ponta} L${x} ${s.y2} L${x + ponta} ${s.y2 - ponta}`}
            stroke={cor}
            strokeWidth={9}
            fill="none"
            strokeLinecap="square"
          />
        </g>
      ) : null}
    </svg>
  );
};

// Um pôster de bloco universal: o campo (inteiro, ou dividido na comparação), a janela vazada
// com a pessoa dentro, as linhas que ganham tinta palavra por palavra, os letreiros e o desenho.
export const Bloco: React.FC<{
  d: DesenhoB;
  campo: CampoT;
  t: number;
  fim: number;
  numero: number;
  marca: Plano["marca"];
  fantasma?: number;
  textos?: number;
  de: number;
}> = ({ d, campo, t, fim, numero, marca, fantasma, textos = 1, de }) => {
  const c = CAMPOS[campo];
  const c2 = CAMPOS[outroCampo(campo)];
  // comparação: o lado 2 fica no campo de baixo, na outra cor
  const cores = (lado?: 0 | 1): Cores => (d.divisao !== undefined && lado === 1 ? c2 : c);
  const vazados = d.janela ? [vazadoDaJanela(t, d.janela, d.alvo)] : [];
  const luzForca = c.luz * (vazados[0]?.abertura ?? 0);
  void fim;
  return (
    <>
      <Campo
        id={`b${de}`}
        cor={c.fundo}
        lapis={c.lapis}
        fantasma={fantasma}
        luz={{ x: d.alvo.x, y: d.alvo.y, rx: LUZ.rx * d.escala, ry: LUZ.ry * d.escala, forca: luzForca }}
        vazados={vazados}
        divisao={d.divisao !== undefined ? { y: d.divisao, cor: c2.fundo } : undefined}
      />
      <div style={{ position: "absolute", inset: 0, opacity: textos }}>
        <Letreiros numero={numero} area={d.assinatura ? "" : marca.area} cor={c.letreiro} />
        {d.linhasB.map((l, i) => {
          const k = cores(l.lado);
          const cor = l.tinta === "acento" ? k.acento : l.tinta === "letreiro" ? k.letreiro : k.texto;
          if (l.mono) return <Letreiro key={i} l={l} t={t} cor={cor} lapis={k.lapis} />;
          const passou = l.apagaEm !== undefined && t >= l.apagaEm - 0.02;
          return (
            <LinhaDeTexto
              key={i}
              t={t}
              texto={l.palavras.join(" ")}
              tempos={l.tempos}
              y={l.y}
              tamanho={l.tamanho}
              peso={l.peso}
              cor={passou ? k.letreiro : cor}
              lapis={k.lapis}
              risco={l.risco !== undefined ? prog(t, l.risco, 0.28, troca) : 0}
              corRisco={l.tinta === "acento" ? k.texto : k.acento}
              corRiscada={k.riscada}
              antes={l.icone ? <IconeChamada icone={l.icone} cor={cor} /> : undefined}
              caixa={l.caixa}
            />
          );
        })}
        {d.setas.map((s, i) => (
          <SetaDoPasso key={i} s={s} t={t} cor={c.acento} lapis={c.lapis} />
        ))}
        {d.grafico ? <GraficoManifesto g={d.grafico} t={t} c={c} /> : null}
        {d.assinatura ? <Assinatura marca={marca} c={c} p={prog(t, de + 0.25, 0.4)} /> : null}
      </div>
    </>
  );
};
