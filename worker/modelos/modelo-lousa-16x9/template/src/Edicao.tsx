import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from "remotion";
import { useTempo } from "./anim";
import { Apagadores } from "./componentes/Apagador";
import { Guias } from "./componentes/Guias";
import { Janela } from "./componentes/Janela";
import { Legendas } from "./componentes/Legendas";
import { Herdados, ligarHerancas, Lousa } from "./componentes/Lousa";
import { useFontesProntas } from "./giz/medir";
import { estadosDaCaixa, layoutDe, regioesDoLayout, resolverLugares, TROCA } from "./layout";
import { caixaNoTempo, CHEIO_16x9 } from "./motor/caixa";
import { montarFrases } from "./motor/frases";
import { montarPaginas, type Som } from "./paginas";
import type { Plano } from "./plano";
import { cor, H, W } from "./tema";

// Ajuste de segurança antes de desenhar: um momento nunca invade o seguinte, e cada um ganha o
// seu lugar na lousa (no quadro deitado, a pessoa fica sempre na moldura da direita: a janela
// grande ou a retrato, conforme o bloco).
const comCapa = (plano: Plano): Plano => {
  const ordenados = [...plano.momentos].sort((a, b) => a.de - b.de);
  return {
    ...plano,
    momentos: resolverLugares(
      ordenados.map((m, i) => {
        const proximo = ordenados[i + 1];
        return proximo && m.ate > proximo.de ? { ...m, ate: proximo.de } : m;
      }),
    ),
  };
};

export const Edicao: React.FC<{ plano: Plano; guias?: boolean }> = ({ plano: planoOriginal, guias }) => {
  const pronto = useFontesProntas();
  const plano = useMemo(() => comCapa(planoOriginal), [planoOriginal]);
  const t = useTempo();
  const { fps } = useVideoConfig();
  const frases = useMemo(() => montarFrases(plano), [plano]);
  const estados = useMemo(() => estadosDaCaixa(plano), [plano]);
  // as páginas medem o texto da letra manuscrita: só depois que a fonte carregou
  const paginas = useMemo(() => (pronto ? montarPaginas(plano, estados) : []), [plano, pronto, estados]);
  const herancas = useMemo(() => ligarHerancas(paginas), [paginas]);
  const caixa = caixaNoTempo(t, estados, CHEIO_16x9);
  // a moldura de giz da janela é riscada quando a pessoa sai da tela cheia pela primeira vez
  const primeiraJanela = estados.find((e) => (e.caixa.w ?? W) < W - 10);
  const desenhaEm = primeiraJanela ? primeiraJanela.de + TROCA * 0.7 : null;

  // Sons raros e tonais: um tom grave quando o apagador passa, uma nota a cada resultado
  // (subindo a cada passo) e um acorde na resposta final.
  const sons = useMemo(() => {
    const lista: Som[] = [];
    paginas.forEach((pg) => lista.push(...pg.sons));
    const ordenados = lista.sort((a, b) => a.em - b.em);
    const saida: Som[] = [];
    for (const s of ordenados) if (!saida.length || s.em - saida[saida.length - 1].em > 0.4) saida.push(s);
    return saida;
  }, [paginas]);

  const atual = [...plano.momentos].reverse().find((m) => t >= m.de);
  const regioes = atual ? regioesDoLayout(layoutDe(atual), !!atual.legenda) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: cor.lousa }}>
      <Img src={staticFile("lousa/fundo.jpg")} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      {pronto ? <Lousa paginas={paginas} t={t} herancas={herancas} /> : null}
      {/* o apagador passa por baixo da janela da pessoa (nunca cobre o rosto) */}
      {pronto ? <Apagadores paginas={paginas} t={t} /> : null}
      {pronto ? <Herdados paginas={paginas} t={t} herancas={herancas} /> : null}
      <Janela plano={plano} caixa={caixa} t={t} desenhaEm={desenhaEm} />
      <Legendas frases={frases} />
      {guias ? <Guias plano={plano} caixa={caixa} cabecalho={regioes?.cabecalho ?? null} principal={regioes?.principal ?? null} /> : null}
      {plano.sfx === false
        ? null
        : sons.map((s) => (
            <Sequence key={`${s.arquivo}-${s.em}`} from={Math.max(0, Math.round(s.em * fps))} layout="none">
              <Audio src={staticFile(s.arquivo)} volume={s.volume} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};
