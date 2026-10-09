/**
 * O MESMO ELEMENTO NÃO VOLTA EM DUAS PEÇAS DA CAMPANHA (08/10/2026).
 *
 * O caso: as quatro artes geradas da semana do Demandou de 08/10 (a imagem de
 * quinta e as três lâminas do carrossel de sexta) saíram com o MESMO ring
 * light e a mesma câmera no tripé, e o post único da noite, feito com um
 * estilo que o Bruno acabou de criar por voz ("os agentes andando, estilo
 * tecnológico, o computador aberto"), saiu de novo com estúdio, ring light,
 * microfone e câmera. "Uma imagem é legal, mas 7 posts com a mesma arte?
 * Inaceitável, não pode repetir de jeito nenhum."
 *
 * A origem, medida no banco e no código: todo redator de cena (a cena da
 * frase da semana do vídeo, a manchete da esteira, o roteiro do carrossel)
 * recebia a mesma lista FIXA de objetos do setor "marketing" (em
 * lib/media/identidade-visual.ts: "a creator studio with a microphone on a
 * boom arm and a switched-off ring light, a camera on a tripod, ..."), e cada
 * cena era escrita sem saber das outras. A lista saiu dos redatores (o setor
 * entra só pelo nome) e esta guarda impede a repetição que sobrar.
 *
 * O desenho é o da guarda do infográfico (lib/media/infografico-sem-repeticao.ts):
 *   1. quem escreve a cena declara o ELEMENTO CENTRAL e o CENÁRIO dela;
 *   2. antes de pagar a imagem, o JEV compara com os das outras peças da
 *      campanha e das últimas campanhas do projeto e veta o repetido
 *      (lib/squad/coerencia-da-arte.ts, `elementoRepetidoPeloJev`);
 *   3. esta guarda, pura, vale sempre (com o JEV fora inclusive): a mesma
 *      palavra no elemento, no cenário ou na cena é repetição;
 *   4. com veto, o redator reescreve SÓ o elemento vetado, sabendo o que já
 *      foi usado, UMA vez; se ainda repetir, a peça segue (o veto nunca
 *      derruba a peça) e o log diz.
 *
 * As cenas são escritas em paralelo, mas a conferência e o registro passam
 * por uma fila de um só, como a das aberturas (lib/media/aberturas-da-semana.ts):
 * dois dias nunca registram o mesmo elemento ao mesmo tempo.
 */

/** O que o redator declara de uma cena. Em inglês, como a cena. */
export type ElementoDaCena = { elemento: string; cenario: string };

/** Uma cena escrita, com o que ela declara. */
export type CenaComElemento = ElementoDaCena & { cena: string };

/** Um elemento já usado: de qual peça ("quinta, imagem", "sexta, lâmina 2", "campanha anterior"). */
export type ElementoUsado = ElementoDaCena & { peca: string; cena?: string };

/** O que repetiu, e com quem. `campo` diz o que o redator troca. */
export type Repeticao = { campo: "elemento" | "cenario"; usado: ElementoUsado; por: "jev" | "regra" };

/** Palavras que não identificam objeto nem lugar (artigos, cor, luz, tamanho, enquadramento). */
const VAZIAS = new Set([
  // inglês
  "the", "and", "with", "for", "from", "into", "onto", "over", "under", "near", "next", "beside", "behind", "front", "its", "his", "her", "their",
  "one", "two", "three", "single", "small", "large", "big", "tiny", "huge", "old", "new", "empty", "open", "closed", "half", "full", "lone",
  "close", "view", "shot", "macro", "wide", "angle", "low", "high", "top", "side", "corner", "detail", "scene", "frame", "background", "foreground",
  "modern", "bright", "dark", "soft", "warm", "cold", "cool", "dim", "lit", "light-filled", "glowing", "black", "white", "grey", "gray", "orange",
  "minimal", "clean", "simple", "vintage", "sleek", "quiet", "calm", "subtle", "dramatic", "moody", "natural", "real", "stylized",
  "switched", "off", "turned", "standing", "resting", "sitting", "lying", "placed", "leaning", "propped", "set", "against", "across", "inside", "outside",
  "some", "few", "several", "many", "each", "other", "another", "same", "very",
  // português (a cena pode vir em português quando o redator escorrega)
  "com", "para", "por", "uma", "uns", "umas", "dos", "das", "nos", "nas", "sobre", "entre", "perto", "frente", "fundo", "vazio", "vazia", "aberto", "aberta",
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Singular simples: "lights" vira "light", "boxes" vira "box"; "glass" e "grass" ficam. */
function singular(p: string): string {
  if (p.length > 4 && p.endsWith("ies")) return `${p.slice(0, -3)}y`;
  if (p.length > 4 && /(ches|shes|xes|sses)$/.test(p)) return p.slice(0, -2);
  if (p.length > 3 && p.endsWith("s") && !p.endsWith("ss") && !p.endsWith("us")) return p.slice(0, -1);
  return p;
}

/** As palavras que identificam o objeto ou o lugar, normalizadas. Pura. */
export function palavrasDoElemento(texto: string | null | undefined): string[] {
  const vistas = new Set<string>();
  for (const bruta of normalizar(texto ?? "").split(" ")) {
    if (bruta.length < 3 || VAZIAS.has(bruta) || /^\d+$/.test(bruta)) continue;
    vistas.add(singular(bruta));
  }
  return [...vistas];
}

/**
 * Dois elementos são o mesmo quando o menor está quase todo dentro do maior:
 * "ring light" e "a switched-off ring light on a tripod" são o mesmo;
 * "paper plane" e "paper boat" não. A medida é sobre o MENOR conjunto, como a
 * das aberturas, porque um redator escreve curto e o outro escreve longo.
 */
export function mesmoElemento(a: string | null | undefined, b: string | null | undefined): boolean {
  const pa = palavrasDoElemento(a);
  const pb = new Set(palavrasDoElemento(b));
  const menor = Math.min(pa.length, pb.size);
  if (menor === 0) return false;
  let comuns = 0;
  for (const p of pa) if (pb.has(p)) comuns++;
  return comuns / menor >= 0.6;
}

/**
 * O elemento usado aparece na cena nova, mesmo como detalhe? Só para elemento
 * de duas palavras ou mais ("ring light", "paper plane"): palavra solta como
 * "desk" ou "light" aparece em qualquer cena e vetaria tudo.
 */
export function cenaMostraElemento(cena: string | null | undefined, elementoUsado: string | null | undefined): boolean {
  const usadas = palavrasDoElemento(elementoUsado);
  if (usadas.length < 2) return false;
  const daCena = new Set(palavrasDoElemento(cena));
  return usadas.every((p) => daCena.has(p));
}

/**
 * A GUARDA PURA: a cena nova repete o elemento central ou o cenário de alguma
 * peça já usada? Cruza os dois campos (o elemento de uma peça virar o cenário
 * da outra também é repetir: o ring light no centro de uma e "um estúdio com
 * ring light" na outra) e procura o elemento usado dentro da cena inteira.
 * Devolve a primeira repetição, ou null.
 */
export function repeticaoPelaRegra(nova: CenaComElemento | ElementoDaCena, usados: ElementoUsado[]): Repeticao | null {
  const cena = "cena" in nova ? nova.cena : "";
  for (const u of usados) {
    if (mesmoElemento(nova.elemento, u.elemento) || mesmoElemento(nova.elemento, u.cenario)) return { campo: "elemento", usado: u, por: "regra" };
    if (mesmoElemento(nova.cenario, u.cenario) || mesmoElemento(nova.cenario, u.elemento)) return { campo: "cenario", usado: u, por: "regra" };
    if (cena && cenaMostraElemento(cena, u.elemento)) return { campo: "elemento", usado: u, por: "regra" };
  }
  return null;
}

/**
 * O ESTILO VAI AO REDATOR DA CENA COMO LINGUAGEM, NUNCA COMO OBJETO (08/10).
 *
 * O estilo diz como a imagem parece (cor, luz, técnica, tratamento, clima);
 * o objeto central e o lugar saem do conteúdo de cada peça. Sem isso a mesma
 * frase de estilo virava o mesmo objeto em toda peça da semana. O estilo
 * ESCOLHIDO para o post (o design que o cliente criou ou escolheu) manda mais:
 * o que ele pede de motivo (figuras, um aparelho) entra como tratamento em
 * volta do elemento central, que continua vindo do conteúdo. A marca do mundo
 * do cliente ("CLIENT'S WORLD: ...") sai daqui: o ramo vai numa linha própria. Pura.
 */
export function estiloComoLinguagem(estilo: string | null | undefined, opcoes: { escolhidoParaOPost?: boolean } = {}): string {
  const t = (estilo ?? "").replace(/CLIENT'S WORLD:[^.]*\./g, " ").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (opcoes.escolhidoParaOPost) {
    return `THE STYLE THE CLIENT CHOSE FOR THIS POST (it commands how the image looks: follow its medium, technique, light, colour and mood literally; a motif it asks for, such as figures or a device, appears as the treatment around the central element; the central element and the setting still come from the content): ${t.slice(0, 900)}`;
  }
  return `VISUAL LANGUAGE (only how the image looks: colour, light, medium, technique, treatment and mood; never take the central element or the setting from it, they come from the content): ${t.slice(0, 900)}`;
}

/** A lista do que já foi usado, para o pedido ao redator (em inglês, como a cena). */
export function usadosEmTexto(usados: ElementoUsado[]): string {
  if (!usados.length) return "";
  const linhas = usados.slice(-24).map((u) => `- ${u.elemento || "(no central element declared)"}${u.cenario ? `, in ${u.cenario}` : ""} (${u.peca})`);
  return `ALREADY USED IN THIS CAMPAIGN AND IN THE LATEST ONES (never use any of these again as the central element, as the setting or as a visible prop):\n${linhas.join("\n")}`;
}

/** O pedido de reescrita de UM campo vetado. O resto da cena fica. */
export function pedidoDeReescrita(atual: CenaComElemento, veto: Repeticao, usados: ElementoUsado[]): string {
  const oQue = veto.campo === "elemento" ? `the central element ("${atual.elemento}")` : `the setting ("${atual.cenario}")`;
  return [
    `This scene was vetoed because ${oQue} repeats what "${veto.usado.peca}" already used (${veto.usado.elemento}${veto.usado.cenario ? `, in ${veto.usado.cenario}` : ""}).`,
    `Rewrite ONLY ${veto.campo === "elemento" ? "the central element" : "the setting"}: keep the idea, the light, the lens and the mood; take the new ${veto.campo === "elemento" ? "element" : "setting"} from what the sentence itself talks about.`,
    usadosEmTexto(usados),
    `Current scene: ${atual.cena}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Lê a resposta do redator: JSON com cena, elemento e cenário; texto solto vira só a cena. Pura. */
export function lerCenaComElemento(bruto: string): CenaComElemento | null {
  const limpo = (bruto ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const i = limpo.indexOf("{");
  const f = limpo.lastIndexOf("}");
  if (i >= 0 && f > i) {
    try {
      const j = JSON.parse(limpo.slice(i, f + 1)) as Record<string, unknown>;
      const cena = String(j.cena ?? j.scene ?? j.visual ?? "").replace(/\s+/g, " ").trim();
      if (cena) {
        return {
          cena: cena.slice(0, 600),
          elemento: String(j.elemento ?? j.element ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
          cenario: String(j.cenario ?? j.setting ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
        };
      }
    } catch {
      // cai no texto solto
    }
  }
  const texto = limpo.replace(/\s+/g, " ").trim();
  return texto ? { cena: texto.slice(0, 600), elemento: "", cenario: "" } : null;
}

/** O que a peça grava no metadata do post (a próxima campanha lê daqui). */
export type ElementoGravado = { elemento: string; cenario: string };

export function elementoParaGravar(c: ElementoDaCena): ElementoGravado | null {
  const elemento = c.elemento.trim();
  const cenario = c.cenario.trim();
  return elemento || cenario ? { elemento, cenario } : null;
}

/** Os elementos gravados no metadata de um post (peça única ou lâminas). Pura. */
export function elementosDoMetadata(metadata: unknown, peca: string): ElementoUsado[] {
  const m = (metadata ?? {}) as { elementoDaArte?: unknown; elementosDasLaminas?: unknown };
  const um = (v: unknown, rotulo: string): ElementoUsado | null => {
    const e = v as Partial<ElementoGravado> | null | undefined;
    const elemento = typeof e?.elemento === "string" ? e.elemento : "";
    const cenario = typeof e?.cenario === "string" ? e.cenario : "";
    return elemento || cenario ? { elemento, cenario, peca: rotulo } : null;
  };
  const out: ElementoUsado[] = [];
  const unico = um(m.elementoDaArte, peca);
  if (unico) out.push(unico);
  if (Array.isArray(m.elementosDasLaminas)) {
    m.elementosDasLaminas.forEach((e, i) => {
      const l = um(e, `${peca}, lâmina ${i + 1}`);
      if (l) out.push(l);
    });
  }
  return out;
}

/** Sem repetir a mesma peça (o mesmo elemento gravado em feed, story e reel do mesmo dia conta uma vez). */
export function semDuplicados(usados: ElementoUsado[]): ElementoUsado[] {
  const vistos = new Set<string>();
  return usados.filter((u) => {
    const k = `${normalizar(u.elemento)}|${normalizar(u.cenario)}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export type DecisorDeRepeticao = (nova: CenaComElemento, usados: ElementoUsado[]) => Promise<{ campo: "elemento" | "cenario"; usado?: ElementoUsado } | null | undefined>;

export type ResultadoDaGuarda = {
  cena: CenaComElemento;
  /** O veto da primeira escrita, quando houve. */
  veto: Repeticao | null;
  reescrita: boolean;
  /** A reescrita ainda repetia (ou falhou): a peça seguiu assim mesmo. */
  seguiuRepetida: boolean;
};

/**
 * A CAMPANHA INTEIRA PASSA POR AQUI: os elementos das peças já decididas e a
 * fila de um só. Uma instância por execução (lib/media/elementos-da-campanha.ts
 * guarda a de cada run e a semeia com o banco).
 */
export class ElementosDaCampanha {
  private registradas: ElementoUsado[];
  private fila: Promise<unknown> = Promise.resolve();
  private porPeca = new Map<string, Promise<ResultadoDaGuarda>>();

  /**
   * `iniciais`: o que já foi usado antes (as últimas campanhas do projeto e as
   * peças desta já gravadas). `decidir`: o JEV; sem ele (ou sem resposta), vale
   * só a guarda pura.
   */
  constructor(iniciais: ElementoUsado[] = [], private readonly decidir?: DecisorDeRepeticao) {
    this.registradas = semDuplicados(iniciais.filter((u) => u.elemento.trim() || u.cenario.trim()));
  }

  usados(excluirPeca?: string): ElementoUsado[] {
    return excluirPeca ? this.registradas.filter((u) => u.peca !== excluirPeca) : [...this.registradas];
  }

  /** Repete? O JEV primeiro; a guarda pura vale sempre, porque palavra igual é repetição de fato. */
  async repeticao(nova: CenaComElemento, usados: ElementoUsado[]): Promise<Repeticao | null> {
    if (!usados.length) return null;
    const pelaRegra = repeticaoPelaRegra(nova, usados);
    if (this.decidir) {
      const r = await this.decidir(nova, usados).catch(() => undefined);
      if (r) return { campo: r.campo, usado: r.usado ?? pelaRegra?.usado ?? usados[usados.length - 1], por: "jev" };
    }
    return pelaRegra;
  }

  /**
   * A cena de uma peça, garantida inédita. `peca` é a chave da peça (a mesma
   * peça pedida duas vezes, uma por proporção, recebe a MESMA cena e paga uma
   * escrita só). `escrever` recebe o que já foi usado; `reescrever`, a cena
   * atual, o veto e o que já foi usado. A primeira escrita corre em paralelo
   * com as outras peças; a conferência, a reescrita e o registro correm na
   * fila. Erro de `escrever` sobe (é o mesmo erro de antes da guarda); erro
   * de `reescrever` não: a peça segue com a primeira cena.
   */
  garantir(
    peca: string,
    escrever: (usados: ElementoUsado[]) => Promise<CenaComElemento>,
    reescrever: (atual: CenaComElemento, veto: Repeticao, usados: ElementoUsado[]) => Promise<CenaComElemento>,
    aoDecidir?: (r: ResultadoDaGuarda) => void
  ): Promise<ResultadoDaGuarda> {
    const ja = this.porPeca.get(peca);
    if (ja) return ja;
    const feito = (async () => {
      let cena = await escrever(this.usados(peca));
      let resultado: ResultadoDaGuarda | null = null;
      const vez = this.fila.then(async () => {
        const usados = this.usados(peca);
        const veto = await this.repeticao(cena, usados);
        let reescrita = false;
        let seguiuRepetida = false;
        if (veto) {
          try {
            cena = await reescrever(cena, veto, usados);
            reescrita = true;
            seguiuRepetida = Boolean(await this.repeticao(cena, usados));
          } catch (e) {
            console.warn(`[elementos] a reescrita de "${peca}" falhou; a peça segue com a primeira cena:`, e instanceof Error ? e.message : e);
            seguiuRepetida = true;
          }
        }
        this.registradas.push({ peca, elemento: cena.elemento, cenario: cena.cenario, cena: cena.cena });
        resultado = { cena, veto, reescrita, seguiuRepetida };
        aoDecidir?.(resultado);
      });
      this.fila = vez.catch(() => {});
      await vez;
      return resultado!;
    })();
    this.porPeca.set(peca, feito);
    feito.catch(() => this.porPeca.delete(peca));
    return feito;
  }
}

// ── O registro por frase, para quem grava o post (como lib/media/foto-da-peca.ts) ──

const ELEMENTOS = new Map<string, ElementoGravado>();

/** A composição não tem o post à mão: registra pela frase, e quem grava o post pergunta. Memória do processo. */
export function registrarElementoDaPeca(frase: string, e: ElementoDaCena): void {
  const chave = frase.trim();
  const g = elementoParaGravar(e);
  if (!chave || !g) return;
  ELEMENTOS.delete(chave);
  ELEMENTOS.set(chave, g);
  if (ELEMENTOS.size > 300) ELEMENTOS.delete(ELEMENTOS.keys().next().value as string);
}

export function elementoDaPeca(frase: string | null | undefined): ElementoGravado | null {
  return frase ? (ELEMENTOS.get(frase.trim()) ?? null) : null;
}

/** O que vai no metadata do post: `elementoDaArte` (uma frase) ou `elementosDasLaminas` (carrossel). Vazio sem registro. */
export function metadataDoElemento(frases: string[]): { elementoDaArte?: ElementoGravado; elementosDasLaminas?: ElementoGravado[] } {
  const lista = frases.map((f) => elementoDaPeca(f));
  if (!lista.some(Boolean)) return {};
  if (frases.length === 1) return { elementoDaArte: lista[0]! };
  return { elementosDasLaminas: lista.map((e) => e ?? { elemento: "", cenario: "" }) };
}
