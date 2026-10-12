import { olhoDoGemini, type Juiz, type Olho } from "@/lib/media/conferencia-visual";
import { jevLigado, perguntarAoJev, probabilidadeDeSim, type UsoDoJev } from "@/lib/jev/cliente";

/**
 * A REVISÃO DOS QUADROS do editor avançado (o passo 8 das aulas: "olhe os
 * quadros e confira"), com a regra da casa: o Gemini só DESCREVE o que vê em
 * cada quadro (texto cortado, texto no rosto, legenda coberta, 3D quebrado...),
 * e o JEV DECIDE, cena a cena, se o defeito estraga o momento a ponto de valer
 * reescrever aquela cena. Só a cena reprovada volta para o Claude.
 *
 * Defeito do recorte (halo, mão sumindo) é da gravação e do RVM, não do
 * código: é descrito e fica no histórico, mas não reprova a cena.
 */
export const TIPOS_DO_DEFEITO = [
  "texto-cortado",
  "texto-sobreposto",
  "texto-no-rosto",
  "legenda-coberta",
  "ilegivel",
  "3d-quebrado",
  "rotulo-solto",
  "quadro-vazio",
  "recorte-defeituoso",
  "espaco-vazio",
  "texto-escondido",
  "outro",
] as const;
export type TipoDoDefeito = (typeof TIPOS_DO_DEFEITO)[number];

/** Sem o JEV: só o que qualquer pessoa vê reprova. */
const GRAVES = new Set<TipoDoDefeito>(["texto-cortado", "texto-sobreposto", "texto-no-rosto", "legenda-coberta", "3d-quebrado", "quadro-vazio", "espaco-vazio", "texto-escondido"]);
const DA_GRAVACAO = new Set<TipoDoDefeito>(["recorte-defeituoso"]);

export type QuadroParaRevisar = { t: number; base64: string; cenas: string[]; fala: string };
export type CenaDoRoteiroResumida = { arquivo: string; oQue: string; de: number | null; ate: number | null };
export type DefeitoNoQuadro = { t: number; tipo: TipoDoDefeito; descricao: string };
export type CenaReprovada = { arquivo: string; problemas: DefeitoNoQuadro[]; probabilidade: number | null };

const ESQUEMA = {
  type: "OBJECT",
  properties: {
    quadros: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          k: { type: "INTEGER" },
          problemas: { type: "ARRAY", items: { type: "OBJECT", properties: { tipo: { type: "STRING", enum: [...TIPOS_DO_DEFEITO] }, descricao: { type: "STRING" } }, required: ["tipo", "descricao"] } },
        },
        required: ["k", "problemas"],
      },
    },
  },
  required: ["quadros"],
};

const SISTEMA = `Você descreve, de forma objetiva, defeitos VISUAIS em quadros de um vídeo já editado, em pé ou deitado (motion graphics sobre uma pessoa falando). Você NÃO decide nada: só descreve o que vê. Cada quadro vem com um rótulo (k, o instante, as cenas no ar e a fala daquele momento).
Liste para cada quadro só os defeitos que se veem:
- "texto-cortado": palavra ou número saindo da borda do quadro, cortado no meio, ou letra faltando;
- "texto-sobreposto": um texto em cima de outro texto, cartão em cima de cartão escondendo o conteúdo, ou título/letreiro atravessando a moldura da janela da pessoa (parte da letra por trás ou por cima da borda dela);
- "texto-no-rosto": texto, cartão ou objeto cobrindo o rosto ou a boca da pessoa (texto ATRÁS da cabeça, com a cabeça na frente das letras, é proposital e NÃO é defeito);
- "legenda-coberta": a legenda (as duas linhas de baixo) coberta por cartão, título ou objeto;
- "ilegivel": texto pequeno demais, apagado ou sem contraste para ler no celular;
- "3d-quebrado": objeto 3D deformado, atravessado, cortado pela borda do quadro ou sumindo de forma estranha;
- "rotulo-solto": rótulo com linha de chamada apontando para o nada, longe do objeto que nomeia;
- "quadro-vazio": tela sem pessoa e sem conteúdo, ou de uma cor só;
- "recorte-defeituoso": contorno da pessoa recortada com halo claro, borda tremida, cabelo ou mão sumindo;
- "texto-escondido": número, cartão, título ou palavra escondido em parte atrás da pessoa, atrás da cabeça ou atrás da borda da janela dela, ou cortado na borda de cima da janela; SÓ a palavra gigante de fundo (o letreiro atrás da cabeça) é proposital, e só quando a cabeça cobre o PÉ das letras e a palavra se lê inteira; a cabeça cobrindo o meio das letras (a palavra ilegível) é "texto-escondido";
- "espaco-vazio": a pessoa pequena demais ou cortada nos ombros dentro de uma janela pequena no meio da tela, ou uma faixa vazia grande (mais de um quinto da altura, sem pessoa nem conteúdo), por exemplo embaixo da legenda;
- "outro": outro defeito visual óbvio.
Quadro sem defeito não entra na lista. Elemento entrando ou saindo (meio transparente, desfocado de propósito, letras se montando) não é defeito. Descrição curta, em português, sem travessão.`;

const POR_LOTE = 24;

/**
 * O defeito é do roteiro (a faixa da legenda, a janela da pessoa) e não de uma cena? A legenda
 * cortada ou coberta sem um elemento de cena nomeado, e a moldura/janela da pessoa. Puro (testado).
 */
export function ehDefeitoDoRoteiro(d: { tipo: TipoDoDefeito; descricao: string }): boolean {
  const texto = d.descricao.toLowerCase();
  const daLegenda = d.tipo === "legenda-coberta" || /legenda/.test(texto);
  const daJanela = /\b(moldura|janela) (da|do) (pessoa|apresentador)/.test(texto) || d.tipo === "espaco-vazio";
  const elementoDeCena = /\b(painel|card|t[íi]tulo|gr[áa]fico|[íi]cone|r[óo]tulo|maquete|letreiro|palavra)\b/.test(texto);
  return (daLegenda || daJanela) && !elementoDeCena;
}

function rotulo(k: number, q: QuadroParaRevisar, cenas: Map<string, CenaDoRoteiroResumida>): string {
  const no = q.cenas.length ? q.cenas.map((a) => `${a} (${cenas.get(a)?.oQue ?? "?"})`).join("; ") : "nenhuma (só o apresentador e a legenda)";
  return `Quadro k=${k} (${q.t.toFixed(1)} s) | cenas no ar: ${no} | fala: "${q.fala.slice(0, 160)}"`;
}

/**
 * Olha os quadros e devolve as cenas reprovadas (o arquivo e os defeitos
 * vistos nele). Quadro sem cena no ar tem o defeito atribuído ao roteiro.json
 * (enquadramento da pessoa, legenda). Falha do olho em todos os lotes: lança.
 */
export async function revisarQuadros(p: {
  quadros: QuadroParaRevisar[];
  cenas: CenaDoRoteiroResumida[];
  tecnica?: string;
  projectId?: string | null;
  olho?: Olho;
  juiz?: Juiz;
  onCusto?: (usd: number) => void;
  uso?: UsoDoJev;
}): Promise<{ reprovadas: CenaReprovada[]; descritos: DefeitoNoQuadro[]; daGravacao: DefeitoNoQuadro[] }> {
  const olho = p.olho ?? olhoDoGemini;
  const juiz = p.juiz ?? perguntarAoJev;
  const porArquivo = new Map(p.cenas.map((c) => [c.arquivo, c]));
  const lotes: QuadroParaRevisar[][] = [];
  for (let i = 0; i < p.quadros.length; i += POR_LOTE) lotes.push(p.quadros.slice(i, i + POR_LOTE));
  const vistos: Array<DefeitoNoQuadro & { cenas: string[] }> = [];
  let falhas = 0;
  await Promise.all(
    lotes.map(async (lote) => {
      try {
        const r = await olho({
          sistema: SISTEMA,
          tarefa: `Técnica da edição: ${p.tecnica ?? "?"}. Descreva os defeitos dos ${lote.length} quadros acima (k de 0 a ${lote.length - 1}). Lista vazia se nenhum tiver defeito.`,
          imagens: lote.map((q, k) => ({ base64: q.base64, mimeType: "image/jpeg", rotulo: rotulo(k, q, porArquivo) })),
          esquema: ESQUEMA,
          resolucao: "media",
          projectId: p.projectId,
          operation: "editor-avancado-revisao",
        });
        p.onCusto?.(r.custoUsd);
        for (const q of (r.json as { quadros?: Array<{ k?: number; problemas?: Array<{ tipo?: string; descricao?: string }> }> }).quadros ?? []) {
          const quadro = typeof q.k === "number" ? lote[q.k] : undefined;
          if (!quadro) continue;
          for (const d of q.problemas ?? []) {
            const tipo = TIPOS_DO_DEFEITO.find((x) => x === d.tipo);
            if (tipo) vistos.push({ t: quadro.t, tipo, descricao: String(d.descricao ?? "").replace(/[—–]/g, ",").slice(0, 220), cenas: quadro.cenas });
          }
        }
      } catch {
        falhas++;
      }
    })
  );
  if (lotes.length && falhas === lotes.length) throw new Error("a visão falhou em todos os lotes da revisão");
  const daGravacao = vistos.filter((v) => DA_GRAVACAO.has(v.tipo)).map(({ t, tipo, descricao }) => ({ t, tipo, descricao }));
  // cada defeito vai para a cena mais recente no ar (a que entrou por último), ou para o roteiro
  const porCena = new Map<string, DefeitoNoQuadro[]>();
  for (const v of vistos.filter((x) => !DA_GRAVACAO.has(x.tipo))) {
    const candidatas = v.cenas.map((a) => porArquivo.get(a)).filter((c): c is CenaDoRoteiroResumida => Boolean(c));
    // A LEGENDA E A JANELA DA PESSOA moram no roteiro.json: na prova da aula 6 (10/10), "legenda
    // cortada na borda" caiu em todas as cenas no ar e o conserto reescreveu as cinco (US$ 0,67).
    const doRoteiro = ehDefeitoDoRoteiro(v);
    const dona = doRoteiro ? "roteiro.json" : (candidatas.sort((a, b) => (b.de ?? 0) - (a.de ?? 0))[0]?.arquivo ?? "roteiro.json");
    porCena.set(dona, [...(porCena.get(dona) ?? []), { t: v.t, tipo: v.tipo, descricao: v.descricao }]);
  }
  const lista = [...porCena.entries()];
  const probs: Record<string, number | null> = {};
  if (lista.length && (jevLigado() || juiz !== perguntarAoJev)) {
    try {
      const r = await juiz(
        { projectId: p.projectId ?? null, etapa: "editor-avancado-revisao", uso: p.uso, state: { tecnica: p.tecnica ?? null, regra: "Defeito que qualquer espectador vê no celular e que estraga a leitura ou cobre a pessoa reprova; detalhe pequeno e efeito proposital (palavra atrás da cabeça, elemento entrando) não reprovam." } },
        Object.fromEntries(
          lista.map(([arquivo, problemas], i) => [
            `c${i}`,
            {
              type: "noul" as const,
              instructions: {
                pergunta: "No vídeo pronto, esta cena tem defeito visual que estraga o momento, a ponto de valer reescrever só esta cena?",
                cena: arquivo === "roteiro.json" ? "o enquadramento da pessoa e a legenda" : `${arquivo}: ${porArquivo.get(arquivo)?.oQue ?? ""}`,
                defeitosVistos: problemas.slice(0, 8).map((x) => `${x.t.toFixed(1)} s, ${x.tipo}: ${x.descricao}`),
              },
            },
          ])
        )
      );
      lista.forEach(([arquivo], i) => (probs[arquivo] = probabilidadeDeSim(r[`c${i}`])));
    } catch {
      // sem o JEV, vale o padrão pelos tipos graves
    }
  }
  const reprovadas = lista
    .map(([arquivo, problemas]) => {
      const pr = probs[arquivo] ?? null;
      const reprova = pr === null ? problemas.some((x) => GRAVES.has(x.tipo)) : pr >= 0.5;
      return reprova ? { arquivo, problemas, probabilidade: pr } : null;
    })
    .filter((x): x is CenaReprovada => Boolean(x));
  return { reprovadas, descritos: vistos.map(({ t, tipo, descricao }) => ({ t, tipo, descricao })), daGravacao };
}
