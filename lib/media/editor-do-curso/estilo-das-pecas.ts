import estilos from "./estilos.json";
import { MODELOS_DO_CURSO } from "./no-corte";
import { descricaoParaDecidir, semTravessao } from "./biblioteca";

/**
 * AS PEÇAS DA CAMPANHA NO ESTILO DO MODELO DO VÍDEO (10/10/2026). Pedido do
 * Bruno: "os posts que serão gerados vão continuar herdando o estilo
 * escolhido? O usuário vê como vão ficar os posts seguindo o estilo do vídeo
 * (imagens, carrosséis, infográficos e vídeos curtos) e, caso não queira, cai
 * na tela de escrever ou narrar o seu próprio modelo ou escolher algum da
 * biblioteca."
 *
 * Nada de caminho novo: o modelo escolhido vira a FALA do "Meu estilo"
 * (lib/estilo-proprio), o mesmo fluxo de quem descreve o estilo falando ou
 * escrevendo. O redator escreve as artes, o carrossel e o vídeo curto; o
 * confirmar grava o comando, o design mestre e o padrão "mestre" que a esteira
 * inteira já lê; as prévias são as da caixa. A fala é montada aqui em código,
 * só com o que o modelo diz de si (estilos.json, extraído do tema.ts e do
 * estilo.md por worker/modelos/importar.mjs): nada inventado.
 *
 * Módulo puro (o JSON vem no pacote).
 */

export type EstiloDoModelo = {
  cores: Array<{ nome: string; hex: string; papel: string | null }>;
  fontes: string[];
  estilo: string;
};

const ESTILOS = estilos as Record<string, EstiloDoModelo>;

/** Como a fala de um modelo começa: a tela e o servidor reconhecem a rodada que veio dele. */
export const ABERTURA_DA_FALA = "Estilo do modelo";

/**
 * O teto da fala: o mesmo do pedido do "Meu estilo" (TETO.pedido da biblioteca,
 * 1.500), para o corte ser feito aqui, no trecho do estilo.md, e não lá, onde
 * cairia a regra da marca que fecha a fala.
 */
export const TETO_DA_FALA_DO_MODELO = 1500;

export function estiloDoModelo(id: string): EstiloDoModelo | null {
  return ESTILOS[id] ?? null;
}

/**
 * A fala do "Meu estilo" a partir de um modelo do curso: o nome, a descrição
 * oficial, as cores com o papel que o template dá a cada uma, as letras e o
 * trecho do estilo.md sobre ideia, cor, letra e imagem. A cor da marca entra
 * só nos destaques (regra do Bruno e do próprio curso). Null sem o modelo.
 */
export function falaDoModeloParaAsPecas(id: string): string | null {
  const m = MODELOS_DO_CURSO.find((x) => x.id === id);
  const e = ESTILOS[id];
  if (!m || !e) return null;
  const cores = e.cores
    .slice(0, 8)
    .map((c) => `${c.hex} (${c.papel ?? c.nome})`)
    .join("; ");
  const partes = [
    `${ABERTURA_DA_FALA} ${m.nome}, o mesmo do meu vídeo. Quero as artes, os carrosséis, os infográficos e os vídeos curtos da campanha com a cara desse modelo.`,
    descricaoParaDecidir(m),
    cores ? `As cores do modelo: ${cores}.` : "",
    e.fontes.length ? `As letras do modelo: ${e.fontes.join(" e ")}.` : "",
    e.estilo ? `Como o modelo é, nas palavras dele: ${e.estilo}` : "",
    "A cor da minha marca entra só nos destaques e nos detalhes, nunca tingindo a foto.",
  ];
  const fala = semTravessao(partes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim());
  if (fala.length <= TETO_DA_FALA_DO_MODELO) return fala;
  // Corta no trecho do estilo.md, nunca na regra da marca, que fecha a fala.
  const regra = partes[partes.length - 1];
  return `${fala.slice(0, TETO_DA_FALA_DO_MODELO - regra.length - 2).replace(/\s+\S*$/, "")}. ${regra}`;
}

/** Esta fala de rodada veio de um modelo do curso? Devolve o nome dele. Puro. */
export function modeloDaFala(fala: string | null | undefined): string | null {
  const t = String(fala ?? "");
  if (!t.startsWith(`${ABERTURA_DA_FALA} `)) return null;
  const nome = t.slice(ABERTURA_DA_FALA.length + 1).split(",")[0]?.trim();
  return nome || null;
}
