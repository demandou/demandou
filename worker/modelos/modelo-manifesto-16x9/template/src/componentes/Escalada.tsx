import { mix, prog, temposDaLinha, troca } from "../anim";
import type { Desenho } from "../layout";
import type { Campo as CampoT, Degrau as DegrauT, Escalada as EscaladaT, Palavra, Plano } from "../plano";
import { APERTO, BASE_UTIL, CAMPOS, caber, MARGEM, QUADRO, TOPO_UTIL } from "../tema";
import { CampoDoPoster, Letreiros, vazadoDaJanela } from "./Cartaz";
import { LinhaDeTexto } from "./Texto";

// A escalada: a mesma palavra entra duas ou três vezes, cada vez maior.
// O degrau da vez fica no meio; quando o próximo chega, ele encolhe subindo e vira uma linha
// pequena no topo (o rastro). No fim, tudo sai para cima e a última vez vira a janela gigante,
// com a pessoa dentro das letras.
// No quadro deitado os degraus crescem no MEIO do quadro, na largura útil inteira. Até 10/10 eles
// ficavam à esquerda (1000 px) para deixar o lado direito livre para a moldura que abre no fim, e a
// revisão do Bruno apontou o terço da direita vazio durante os degraus: os degraus saem para cima
// antes de a janela abrir, então não há o que guardar do lado direito.
const CENTRO = (TOPO_UTIL + BASE_UTIL) / 2;
const ESQUERDA = MARGEM;
const LARGURA_ESCALADA = QUADRO.w - 2 * MARGEM;
const DEGRAU_MAX = 240;
const RASTRO = 46;
const VAO_RASTRO = 18;
const INCLINACAO = -7;

export const tamanhosDosDegraus = (m: EscaladaT) =>
  m.degraus.map((d, k) => {
    const maximo = caber(d.texto, LARGURA_ESCALADA, DEGRAU_MAX, 900, APERTO);
    const n = m.degraus.length;
    const fracao = n === 1 ? 0.8 : 0.55 + (0.45 * k) / (n - 1);
    return Math.round(maximo * fracao);
  });

const Degrau: React.FC<{
  dg: DegrauT;
  k: number;
  tam: number;
  // 0 = no meio (grande); 1 = no rastro (pequeno, no topo)
  sobe: number;
  cores: (typeof CAMPOS)[CampoT];
  t: number;
  palavras: Palavra[];
  fim: number;
}> = ({ dg, k, tam, sobe, cores, t, palavras, fim }) => {
  const notaTam = Math.max(44, Math.round(tam * 0.46));
  const temposTexto = temposDaLinha(dg.texto, dg.em, palavras, fim);
  const temposNota = dg.nota ? temposDaLinha(dg.nota, dg.notaEm ?? temposTexto[temposTexto.length - 1] + 0.3, palavras, fim) : [];
  const altura = tam + (dg.nota ? 18 + notaTam : 0);
  const yRastro = TOPO_UTIL + k * (RASTRO + VAO_RASTRO);
  const rastro = `${dg.texto} ${dg.nota ?? ""}`.trim();
  // o primeiro degrau já está no meio "a lápis" quando o pôster entra
  const lapis = k === 0 ? cores.lapis : undefined;
  // o degrau grande encolhe subindo e some; logo depois a linha do rastro aparece no lugar
  // (uma depois da outra, para nunca ficar texto dobrado)
  const sai = Math.min(1, sobe / 0.6);
  const chega = Math.min(1, Math.max(0, (sobe - 0.6) / 0.4));
  return (
    <>
      {sai < 1 ? (
        <div
          style={{
            position: "absolute",
            left: ESQUERDA,
            width: LARGURA_ESCALADA,
            top: mix(CENTRO - altura / 2, yRastro, sobe),
            height: altura,
            scale: String(mix(1, RASTRO / tam, sobe)),
            transformOrigin: "50% 0",
            rotate: `${dg.torto ? INCLINACAO * (1 - sobe) : 0}deg`,
            opacity: 1 - sai,
          }}
        >
          <LinhaDeTexto t={t} texto={dg.texto} tempos={temposTexto} y={0} tamanho={tam} cor={cores.texto} lapis={lapis} />
          {dg.nota ? (
            <LinhaDeTexto t={t} texto={dg.nota} tempos={temposNota} y={tam + 18} tamanho={notaTam} cor={cores.acento} peso={700} lapis={lapis} />
          ) : null}
        </div>
      ) : null}
      {chega > 0 ? (
        <LinhaDeTexto
          t={t}
          texto={rastro}
          tempos={[...temposTexto, ...temposNota]}
          y={yRastro}
          tamanho={caber(rastro, LARGURA_ESCALADA, RASTRO, 900, APERTO)}
          cor={cores.texto}
          estilo={{ opacity: 0.78 * chega }}
          caixa={{ x: ESQUERDA, largura: LARGURA_ESCALADA, alinhar: "centro" }}
        />
      ) : null}
    </>
  );
};

export const Escalada: React.FC<{
  m: EscaladaT;
  d: Desenho;
  campo: CampoT;
  t: number;
  palavras: Palavra[];
  fim: number;
  numero: number;
  marca: Plano["marca"];
  fantasma?: number;
  // opacidade das letras pequenas (some antes do campo no mergulho de saída)
  textos?: number;
}> = ({ m, d, campo, t, palavras, fim, numero, marca, fantasma, textos = 1 }) => {
  const c = CAMPOS[campo];
  const tamanhos = tamanhosDosDegraus(m);
  // os degraus saem (para cima) um instante antes da palavra curta do final
  const saidaEm = Math.min(m.final.antesEm ?? m.final.em, m.final.em) - 0.2;
  const saida = prog(t, saidaEm, 0.2, troca);
  // o esboço da janela gigante aparece quando os degraus saem; as letras abrem no `em`
  const vazados = d.janela && t >= saidaEm + 0.1 ? [vazadoDaJanela(t, d.janela, d.alvo)] : [];

  return (
    <>
      <CampoDoPoster id={`e${m.de}`} c={c} d={d} fantasma={fantasma} vazados={vazados} />
      <div style={{ position: "absolute", inset: 0, opacity: textos }}>
        <Letreiros numero={numero} area={marca.area} cor={c.letreiro} />
        {saida < 1 ? (
          <div style={{ position: "absolute", inset: 0, opacity: 1 - saida, translate: `0 ${-60 * saida}px` }}>
            {m.degraus.map((dg, k) => {
              const prox = m.degraus[k + 1];
              const sobe = prox ? prog(t, prox.em - 0.14, 0.32, troca) : 0;
              return <Degrau key={k} dg={dg} k={k} tam={tamanhos[k]} sobe={sobe} cores={c} t={t} palavras={palavras} fim={fim} />;
            })}
          </div>
        ) : null}
        {/* o final: a palavra curta ("MAS") em cima da janela gigante */}
        {d.topo.map((l, i) => (
          <LinhaDeTexto
            key={`f${i}`}
            t={t}
            texto={l.texto}
            tempos={temposDaLinha(l.texto, l.em, palavras, fim)}
            y={l.y}
            tamanho={l.tamanho}
            cor={c.texto}
            peso={700}
            caixa={l.caixa}
          />
        ))}
      </div>
    </>
  );
};
