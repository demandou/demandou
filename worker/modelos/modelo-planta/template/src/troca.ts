// As trocas entre os momentos, sem quadro vazio e sem duas folhas uma sobre a outra.
//
// - Tela cheia → prancha: o cartão termina de sair logo depois do começo da prancha; a folha nova já
//   está lá por baixo da pessoa, que encolhe e a revela (na dividida, a folha sobe junto com a borda
//   de baixo do vídeo). O conteúdo entra junto com a pessoa mudando de tamanho.
// - Prancha → tela cheia: a pessoa cresce por cima da folha (que fica até ser coberta); o cartão
//   seguinte só desenrola depois que ela voltou para a tela cheia.
// - Prancha → prancha: a régua paralela da prancheta desce pela tela (0,5 s): acima dela já é a folha
//   nova, abaixo ainda é a velha. Nunca as duas no mesmo lugar, nunca papel vazio.
// - Cartão → cartão: o primeiro termina de apagar no começo do segundo, que desenrola de cima.
import { Easing, interpolate } from "remotion";
import { layoutDe } from "./layout";
import type { Layout, Momento, Plano } from "./plano";

export type Janela = {
  m: Momento;
  layout: Layout;
  prancha: boolean;
  // intervalo em que o momento está desenhado
  entra: number;
  sai: number;
  entrada: "caixa" | "regua";
  saida: "caixa" | "regua" | "fim";
  // início da régua que tira esta folha (troca prancha → prancha)
  saiRegua?: number;
  // cartão logo depois de uma prancha: espera a pessoa voltar para a tela cheia
  atraso?: number;
};

export const REGUA = 0.5;
// a régua começa este tempo antes da troca
export const REGUA_ANTES = 0.05;
const COLADO = 0.35;

// O último momento fica até o fim do vídeo quando é um fechamento ou quando termina colado no fim.
export const fimDoMomento = (m: Momento, plano: Plano) => {
  const temProximo = plano.momentos.some((o) => o.de > m.de);
  if (!temProximo && (m.tipo === "cta" || m.ate >= plano.duracao - 0.3)) return plano.duracao + 1;
  return m.ate;
};

// altura da régua (px) no instante t, para uma régua que começa em `inicio`
export const posicaoDaRegua = (t: number, inicio: number) =>
  interpolate(t, [inicio, inicio + REGUA], [-30, 1950], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.35, 1) });

export const janelasDosMomentos = (plano: Plano): Janela[] => {
  const ordem = [...plano.momentos].sort((a, b) => a.de - b.de);
  return ordem.map((m, i) => {
    const layout = layoutDe(m);
    const prancha = layout !== "cheio";
    const antes = ordem[i - 1];
    const depois = ordem[i + 1];
    const coladoAntes = !!antes && m.de - antes.ate < COLADO;
    const coladoDepois = !!depois && depois.de - m.ate < COLADO;
    const pranchaAntes = coladoAntes && layoutDe(antes) !== "cheio";
    const pranchaDepois = coladoDepois && layoutDe(depois) !== "cheio";
    const fim = fimDoMomento(m, plano);
    if (prancha) {
      const entrada: Janela["entrada"] = pranchaAntes ? "regua" : "caixa";
      const saida: Janela["saida"] = fim > plano.duracao ? "fim" : pranchaDepois ? "regua" : "caixa";
      const saiRegua = saida === "regua" ? depois.de - REGUA_ANTES : undefined;
      return {
        m,
        layout,
        prancha,
        entrada,
        saida,
        saiRegua,
        entra: entrada === "regua" ? m.de - REGUA_ANTES : m.de - 0.02,
        sai: saida === "regua" ? (saiRegua as number) + REGUA : saida === "caixa" ? fim + 0.72 : fim,
      };
    }
    // cartão no peito: `sai` é o fim do apagar
    const sai = pranchaDepois ? depois.de + 0.05 : coladoDepois ? depois.de : fim + 0.15;
    return { m, layout, prancha, entrada: "caixa", saida: "caixa", entra: m.de - 0.6, sai, atraso: pranchaAntes ? 0.45 : 0 };
  });
};
