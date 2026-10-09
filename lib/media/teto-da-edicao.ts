import { DOLAR_POR_CREDITO, DOLAR_POR_IMAGEM, DOLAR_POR_RECORTE, DOLAR_POR_SEGUNDO_DE_VIDEO } from "@/lib/credits/higgsfield-tabela";

/**
 * O TETO DE CUSTO DA EDIÇÃO (08/10/2026, decisão do Bruno): "qualquer vídeo
 * custa no máximo US$ 1 por minuto".
 *
 * Até aqui o teto valia só para as MÍDIAS geradas (imagens e B-roll), e em
 * dois números diferentes: US$ 1,70 por minuto na jornada
 * (lib/media/jornada/decisoes.ts) e US$ 1,20 no editor por comando
 * (lib/media/editor-por-comando/plano-pelo-jev.ts). O diretor (as chamadas
 * ao Claude que escrevem ideias, prompts, textos e direção) e o JEV não
 * tinham teto nenhum, e medido em ai_usage eles eram 42% do custo do minuto
 * (US$ 1,34 por minuto nas gravações com completo editado, antes da jornada).
 *
 * Agora o teto é UM e vale para a edição inteira de um vídeo: plano, prompts,
 * textos, direção, geração e montagem. O custo real é somado numa CAIXA
 * (`CaixaDaEdicao`) enquanto a montagem anda; o que não cabe não é gerado,
 * e a montagem entrega o que já tem pago. Nunca falha por teto, nunca joga
 * fora mídia já paga, e as cenas de cinema (B-roll, as mais caras) são as
 * primeiras a ficar de fora.
 *
 * Módulo puro: a tela de envio, a conta dos planos e os testes importam
 * daqui sem banco.
 */

/** US$ por minuto de vídeo, para a edição inteira. */
export const TETO_USD_POR_MINUTO_DE_EDICAO = 1;

/**
 * O piso por vídeo: um vídeo de 20 s tem a mesma abertura, a mesma direção
 * e o mesmo plano de um de 2 min; abaixo de US$ 1 não há edição com elemento.
 * O preço em créditos cobre o piso porque a duração cobrada é arredondada
 * para cima ao minuto inteiro (lib/media/limits.ts).
 */
export const PISO_USD_DA_EDICAO = 1;

/**
 * A RESERVA DO DIRETOR dentro do teto: a parte que o plano deixa para as
 * chamadas de texto (ideias, prompts, textos em camada, direção) e o JEV. O
 * plano por elemento só pode orçar mídias até o teto menos esta reserva.
 * Medido na jornada de 07/10 e 08/10: ideias US$ 0,022, prompts 0,028,
 * textos e direção ~0,03 por minuto, JEV centavos; 0,10 por minuto cobre com
 * folga, e nunca menos de 0,10 por vídeo.
 */
export const RESERVA_DO_DIRETOR_USD_POR_MINUTO = 0.1;

/**
 * O TETO DO CORTE: o corte usa as mídias já geradas para o completo (não paga
 * de novo); o que ele gera sozinho (quando o completo ainda não gerou, ou
 * falhou) cabe em US$ 1 por corte, o mesmo teto de um minuto, que é o
 * tamanho típico do corte (medido: 57 s). Por isso o preço do corte em
 * créditos é um número só (CREDITOS_POR_CORTE_APROVADO), e não por minuto.
 */
export const TETO_USD_DO_CORTE = 1;

/**
 * O CUSTO FORA DA EDIÇÃO, por minuto de vídeo: transcrição (Deepgram),
 * leitura do vídeo (Gemini), seleção, radar e limpeza (Claude), capas e
 * enquadramento. Medido na jornada de 07/10 e 08/10 em US$ 0,10 a 0,13 por
 * minuto; 0,15 é o número conservador que entra no preço do minuto.
 */
export const CUSTO_FORA_DA_EDICAO_USD_POR_MINUTO = 0.15;

/** O custo máximo de um minuto de vídeo editado, em dólar: o teto da edição mais o que roda fora dela. */
export const CUSTO_MAXIMO_USD_POR_MINUTO_DE_VIDEO = TETO_USD_POR_MINUTO_DE_EDICAO + CUSTO_FORA_DA_EDICAO_USD_POR_MINUTO;

/**
 * Os créditos que o minuto de vídeo PRECISA cobrar para ficar na régua da
 * casa (R$ 0,027 de IA por crédito): US$ 1,15 / US$ 0,005037 = 228,3. O
 * preço cobrado (CREDITOS_POR_MINUTO_DE_VIDEO em lib/media/limits.ts) é
 * este número arredondado para cima, para a régua valer com folga.
 */
export const CREDITOS_MINIMOS_POR_MINUTO_DE_VIDEO = CUSTO_MAXIMO_USD_POR_MINUTO_DE_VIDEO / DOLAR_POR_CREDITO;

/** O teto da edição inteira de um vídeo de `duracaoSeg` segundos, em US$. */
export function tetoDaEdicaoUsd(duracaoSeg: number): number {
  const minutos = Math.max(0, Number(duracaoSeg) || 0) / 60;
  return +Math.max(PISO_USD_DA_EDICAO, minutos * TETO_USD_POR_MINUTO_DE_EDICAO).toFixed(2);
}

/** O que o plano pode orçar em MÍDIAS (imagens, recortes, B-roll): o teto menos a reserva do diretor. */
export function tetoDasMidiasUsd(duracaoSeg: number): number {
  const minutos = Math.max(0, Number(duracaoSeg) || 0) / 60;
  const reserva = Math.max(0.1, minutos * RESERVA_DO_DIRETOR_USD_POR_MINUTO);
  return +Math.max(0.5, tetoDaEdicaoUsd(duracaoSeg) - reserva).toFixed(2);
}

export type MidiaParaEstimar = "imagem" | "recorte" | "video" | "grafico";

/** A estimativa de UMA mídia antes de gerar, pela tabela de preços (a mesma do plano). */
export function estimativaDaMidiaUsd(midia: MidiaParaEstimar, segundosDeVideo = 3): number {
  if (midia === "grafico") return 0;
  if (midia === "video") return +(segundosDeVideo * DOLAR_POR_SEGUNDO_DE_VIDEO["kling-pro"]).toFixed(4);
  const imagem = DOLAR_POR_IMAGEM["higgsfield-gpt-image-2.5-high"];
  return +(midia === "recorte" ? imagem + DOLAR_POR_RECORTE : imagem).toFixed(4);
}

export type GastoDaCaixa = { onde: string; usd: number };

/**
 * A CAIXA DA EDIÇÃO: o teto e o que já foi gasto, somado em tempo real por
 * quem paga (redator, JEV, geração). `cabe` responde antes de gerar;
 * `gastar` registra depois. O que foi recusado fica anotado, para o aviso do
 * admin dizer o que ficou de fora e por quê.
 */
export class CaixaDaEdicao {
  readonly tetoUsd: number;
  private gastoUsd = 0;
  readonly gastos: GastoDaCaixa[] = [];
  readonly recusados: GastoDaCaixa[] = [];

  constructor(tetoUsd: number, jaGastoUsd = 0) {
    this.tetoUsd = +Math.max(0, tetoUsd).toFixed(4);
    if (jaGastoUsd > 0) this.gastar(jaGastoUsd, "antes da montagem");
  }

  get gasto(): number {
    return +this.gastoUsd.toFixed(4);
  }

  get sobra(): number {
    return +Math.max(0, this.tetoUsd - this.gastoUsd).toFixed(4);
  }

  get estourou(): boolean {
    return this.gastoUsd > this.tetoUsd + 1e-9;
  }

  /** Cabe mais `usd` sem passar do teto? */
  cabe(usd: number): boolean {
    return this.gastoUsd + Math.max(0, usd) <= this.tetoUsd + 1e-9;
  }

  /** Registra um gasto já feito (o real, nunca a estimativa). */
  gastar(usd: number, onde: string): void {
    const v = Math.max(0, Number(usd) || 0);
    if (!v) return;
    this.gastoUsd += v;
    this.gastos.push({ onde, usd: +v.toFixed(4) });
  }

  /** Devolve uma reserva feita a maior (a geração custou menos que a estimativa). */
  devolver(usd: number, onde: string): void {
    const v = Math.max(0, Number(usd) || 0);
    if (!v) return;
    this.gastoUsd = Math.max(0, this.gastoUsd - v);
    this.gastos.push({ onde: `${onde} (devolvido)`, usd: -+v.toFixed(4) });
  }

  /** Anota o que ficou de fora por não caber. */
  recusar(usd: number, onde: string): void {
    this.recusados.push({ onde, usd: +Math.max(0, usd).toFixed(4) });
  }

  /** Uma linha para o admin: "teto US$ 2,00, gasto US$ 1,87, 2 de fora (B-roll el4, imagem el9)". */
  resumo(): string {
    const fora = this.recusados.length ? `, ${this.recusados.length} de fora (${this.recusados.map((r) => r.onde).slice(0, 6).join(", ")})` : "";
    return `teto da edição US$ ${this.tetoUsd.toFixed(2)}, gasto US$ ${this.gasto.toFixed(2)}${fora}`;
  }
}
