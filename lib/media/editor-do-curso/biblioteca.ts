import { MODELOS_DO_CURSO, modeloServeNoCorte, type ModeloDoCurso } from "./no-corte";
import artesProntas from "./artes.json";

/**
 * OS MODELOS DO CURSO NA BIBLIOTECA DE ESTILOS (09/10/2026, noite).
 *
 * Pedido do Bruno: "os novos estilos devem estar disponíveis na biblioteca para
 * o usuário escolher". Aqui fica a parte sem banco: o cartão de cada modelo
 * (nome, resumo curto tirado da descrição oficial da skill, arte e prévia em
 * public/estilos/curso), se ele já serve no corte, e o que falta para os que
 * ainda não servem, dito como "em breve".
 *
 * Nada de molde por nicho: o resumo e a descrição para decidir saem do texto
 * da própria skill, e quem recomenda um modelo para o cliente é o JEV, pelo
 * perfil (recomendacao.ts).
 *
 * A ARTE DO CARTÃO (decisão do Bruno, 09/10): nunca quadro do vídeo de exemplo
 * do curso (são as pessoas do treinamento). Cada modelo tem uma pessoa
 * inventada, gerada pelo Nano Banana Pro, posta num vídeo parado e editada
 * pelo próprio template do modelo com o plano do exemplo; três quadros da
 * assinatura lado a lado viram public/estilos/curso/<id>.webp. `artes.json`
 * lista os modelos com arte pronta; sem arte, o cartão mostra só o texto.
 * Prévia em vídeo ainda não há (`previa` null).
 */

export type ModeloNaBiblioteca = {
  id: string;
  nome: string;
  /** Uma ou duas frases tiradas da descrição oficial, para o cartão. */
  resumo: string;
  formato: "9:16" | "16:9";
  /** Já pode ser escolhido para os cortes (automático e vertical). */
  serve: boolean;
  /** Para os que não servem: o que falta, em uma frase curta ("Em breve: ..."). */
  falta: string | null;
  /** A arte do cartão (pessoa inventada no modelo), ou null quando ainda não há. */
  arte: string | null;
  /** A prévia curta em vídeo, ou null (ainda não há nenhuma). */
  previa: string | null;
};

/** Nenhum texto da tela leva travessão (regra do Bruno). */
export function semTravessao(t: string): string {
  return t.replace(/\s*[—–]\s*/g, ", ").replace(/,\s*,/g, ",");
}

const TETO_DO_RESUMO = 170;

/**
 * O resumo do cartão: a descrição sem o começo fixo ("Edita qualquer vídeo...
 * no estilo X"), sem os parênteses, até o fim da primeira frase; frase longa
 * é cortada na palavra, com reticências.
 */
export function resumoDoModelo(m: Pick<ModeloDoCurso, "descricao" | "nome">): string {
  let d = semTravessao(m.descricao.replace(/\s+/g, " ").trim());
  const marca = d.search(/no estilo /i);
  if (marca >= 0) {
    d = d.slice(marca + "no estilo ".length);
    // O nome do estilo termina no primeiro ":" ou "," (o nome pode ter hífen ou espaço: "Raio-X", "Ao Pé da Letra").
    const corte = d.search(/[:,]/);
    if (corte >= 0 && corte <= 40) d = d.slice(corte + 1);
  }
  // Os parênteses saem (são listas de exemplo), de dentro para fora.
  for (let i = 0; i < 4 && /\([^()]*\)/.test(d); i++) d = d.replace(/\s*\([^()]*\)/g, "");
  d = d.replace(/\s+([,.;:])/g, "$1").replace(/^[\s,:;.]+/, "").trim();
  const fim = d.search(/[.;](\s|$)/);
  let frase = fim >= 0 ? d.slice(0, fim) : d;
  if (frase.length > TETO_DO_RESUMO) {
    const corte = frase.lastIndexOf(" ", TETO_DO_RESUMO);
    frase = `${frase.slice(0, corte > 60 ? corte : TETO_DO_RESUMO).replace(/[\s,;:]+$/, "")}…`;
  } else {
    frase = `${frase.replace(/[\s,;:]+$/, "")}.`;
  }
  // A primeira letra em maiúscula, mesmo depois de uma aspa ("tudo o que você precisa").
  return frase.replace(/\p{L}/u, (l) => l.toUpperCase());
}

/**
 * A descrição que o JEV lê para decidir: a oficial, sem o "Use sempre que o
 * usuário pedir..." (instrução para quem roda a skill) e sem o "Entrega um MP4".
 */
export function descricaoParaDecidir(m: Pick<ModeloDoCurso, "descricao">): string {
  let d = m.descricao.replace(/\s+/g, " ").trim();
  const uso = d.search(/\s*\bUse (sempre|quando|este|esta|para|em)\b/);
  if (uso > 0) d = d.slice(0, uso);
  d = d.replace(/\s*Entrega um MP4[^.]*\.?/g, "");
  // O começo é igual em todos ("Edita qualquer vídeo... no estilo"): só gasta leitura.
  d = d.replace(/^Edita qualquer vídeo de uma pessoa falando para a câmera no estilo\s+/i, "Estilo ");
  return semTravessao(d).trim();
}

/** O que cada passo de fora quer dizer para o cliente. */
const O_QUE_FALTA: Record<string, string> = {
  imagens: "imagens do assunto",
  "capturas de tela": "capturas de tela",
  "3d": "cenas em 3D",
  "recorte da pessoa": "recorte da pessoa sem fundo",
  "gravação de tela": "gravação de tela",
  "fotos de antes e depois": "fotos de antes e depois",
};

function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** Para o modelo que ainda não serve no corte: o que falta, em uma frase. Null quando já serve. */
export function faltaDoModelo(m: ModeloDoCurso): string | null {
  if (modeloServeNoCorte(m.id)) return null;
  const itens = [...new Set(m.pede.map((p) => O_QUE_FALTA[p] ?? p))];
  if (itens.length) return `Em breve: precisa de ${juntar(itens)}.`;
  if (m.formato === "16:9") return "Em breve: é para vídeo deitado (16:9), e os cortes são verticais.";
  return "Em breve.";
}

const COM_ARTE = new Set<string>(artesProntas as string[]);

export function arteDoModelo(id: string): string | null {
  return COM_ARTE.has(id) ? `/estilos/curso/${id}.webp` : null;
}

/** Os 79 cartões, na ordem do catálogo. */
export function modelosDaBiblioteca(): ModeloNaBiblioteca[] {
  return MODELOS_DO_CURSO.map((m) => ({
    id: m.id,
    nome: m.nome,
    resumo: resumoDoModelo(m),
    formato: m.formato,
    serve: Boolean(modeloServeNoCorte(m.id)),
    falta: faltaDoModelo(m),
    arte: arteDoModelo(m.id),
    // Sem prévia em vídeo por enquanto (09/10): o cartão mostra só a arte.
    previa: null,
  }));
}

/** Os que podem ser escolhidos hoje (são as opções da recomendação). */
export function modelosQueServem(): ModeloDoCurso[] {
  return MODELOS_DO_CURSO.filter((m) => modeloServeNoCorte(m.id));
}
