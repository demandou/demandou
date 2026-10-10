export const dynamic = "force-dynamic";
export const maxDuration = 800;

import { NextRequest, NextResponse } from "next/server";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import {
  escreverPlanoDoModelo,
  numerosSemLastro,
  type BlocoDoPlano,
  type EsqueletoDoPlano,
  type PecasParadas,
  type ReferenciasDoModelo,
  type RetornoDaConferencia,
} from "@/lib/media/editor-do-curso/escrever-plano";
import { escolherImagensDoModelo, pedirImagensDoModelo } from "@/lib/media/editor-do-curso/imagens";
import type { MaterialParaORedator } from "@/lib/media/editor-do-curso/material-do-modelo";
import { revisarQuadrosDoModelo } from "@/lib/media/editor-do-curso/revisao";

/**
 * O worker pede ao app a parte ESCRITA de um corte num modelo do curso (09/10).
 *
 * O fluxo do curso roda no worker (worker/src/modelo/editar-no-modelo.mjs);
 * só o que é escrita ou escolha da IA mora aqui, onde a conta de IA vive. Uma
 * chamada por passo, pela `fase`:
 *   - "imagens":  o mapa (passo 6) e a lista de imagens (passo 6b), nos modelos com imagem;
 *   - "escolher": a escolha das candidatas olhando as folhas numeradas (passo 6b);
 *   - "revisar":  o passo 8, olhar os quadros de cada momento e apontar defeito;
 *   - "plano" (padrão): o plano (passo 7); a conferência do curso roda no worker,
 *     e a reprovada volta para cá em `anterior`.
 * Com `pecasParadas` (10/10, worker/src/modelo/arte-no-modelo.mjs), a mesma
 * escrita serve aos posts da campanha no estilo do modelo: o mapa e o plano
 * ganham o bloco de instrução das peças paradas; sem ele, nada muda no vídeo.
 * Com `bloco` (10/10, o completo no modelo, worker/src/modelo/blocos-do-plano.mjs),
 * o plano é de um TRECHO do vídeo longo (a fala e os tempos dele, o lugar no
 * vídeo e o fim do trecho anterior); a guarda de número olha a fala do trecho.
 * Nos modelos com imagem, o completo faz o passo 6b por trecho: a fase
 * "imagens" com `bloco` é o mapa e os pedidos do trecho, e a fase "escolher"
 * leva só as folhas dele (`rotulos` diz qual folha é cada uma).
 * Sem sessão, como todo pedido do worker, e autenticado pela assinatura sobre
 * o corpo inteiro.
 */
export async function POST(req: NextRequest) {
  const corpoCru = await req.text();
  if (!corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let corpo: {
    fase?: "imagens" | "escolher" | "revisar" | "plano";
    modelo?: string;
    referencias?: ReferenciasDoModelo;
    esqueleto?: EsqueletoDoPlano;
    marca?: { nome?: string; area?: string };
    nicho?: string | null;
    anterior?: RetornoDaConferencia | null;
    mapa?: string | null;
    pedidos?: unknown[];
    folhas?: string[];
    /** O nome de cada folha na escolha (10/10, o completo: um trecho olha só as folhas dele). */
    rotulos?: string[];
    legendas?: string[];
    plano?: Record<string, unknown> | null;
    projectId?: string | null;
    pecasParadas?: PecasParadas | null;
    /** A campanha das peças paradas (10/10): o custo entra no uso de IA dela. */
    runId?: string | null;
    /** "arte-no-modelo" (10/10): o lote de peças da campanha; sem ele, o corte de sempre. */
    operacao?: string | null;
    bloco?: BlocoDoPlano | null;
    /** O material do cliente no projeto do trabalho (10/10, material-do-modelo.ts): o mapa e o plano usam só ele. */
    material?: MaterialParaORedator | null;
  };
  try {
    corpo = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }
  if (!corpo.referencias?.skill) {
    return NextResponse.json({ error: "Falta o treinamento do modelo" }, { status: 400 });
  }
  let custoUsd = 0;
  const comum = {
    modelo: process.env.EDITOR_DO_CURSO_IA || undefined,
    // O lote de peças da campanha (10/10) grava o custo como "arte-no-modelo", na campanha; o corte segue "editor-do-curso".
    usage: corpo.operacao === "arte-no-modelo" ? { projectId: corpo.projectId ?? null, runId: corpo.runId ?? null, operation: "arte-no-modelo" } : { projectId: corpo.projectId ?? null, operation: "editor-do-curso" },
    onCusto: (usd: number) => {
      custoUsd += usd;
    },
  };
  try {
    if (corpo.fase === "revisar") {
      const problemas = await revisarQuadrosDoModelo({ referencias: corpo.referencias, plano: corpo.plano ?? null, folhas: corpo.folhas ?? [], legendas: corpo.legendas, bloco: corpo.bloco ?? null, ...comum });
      return NextResponse.json({ problemas, custoUsd });
    }
    if (corpo.fase === "escolher") {
      const escolhas = await escolherImagensDoModelo({ referencias: corpo.referencias, pedidos: corpo.pedidos ?? [], folhas: corpo.folhas ?? [], rotulos: corpo.rotulos ?? null, ...comum });
      return NextResponse.json({ escolhas, custoUsd });
    }
    if (!corpo.esqueleto?.palavras?.length) {
      return NextResponse.json({ error: "Falta a fala do corte" }, { status: 400 });
    }
    if (corpo.fase === "imagens") {
      const r = await pedirImagensDoModelo({
        referencias: corpo.referencias,
        esqueleto: corpo.esqueleto,
        nicho: corpo.nicho ?? null,
        pecasParadas: corpo.pecasParadas ?? null,
        material: corpo.material ?? null,
        bloco: corpo.bloco ?? null,
        ...comum,
      });
      return NextResponse.json({ ...r, custoUsd });
    }
    const escrito = await escreverPlanoDoModelo({
      referencias: corpo.referencias,
      esqueleto: corpo.esqueleto,
      marca: { nome: corpo.marca?.nome ?? "", area: corpo.marca?.area ?? "" },
      nicho: corpo.nicho ?? null,
      anterior: corpo.anterior ?? null,
      mapa: corpo.mapa ?? null,
      pecasParadas: corpo.pecasParadas ?? null,
      bloco: corpo.bloco ?? null,
      material: corpo.material ?? null,
      ...comum,
    });
    const semLastro = numerosSemLastro(escrito.plano, corpo.esqueleto.palavras, escrito.plano.correcoes as Record<string, string> | undefined);
    return NextResponse.json({ mapa: escrito.mapa, plano: escrito.plano, custoUsd, numerosSemLastro: semLastro });
  } catch (e) {
    const erro = e instanceof Error ? e.message : "falhou";
    console.error(`[editor-do-curso] ${corpo.fase ?? "plano"} do ${corpo.modelo ?? "?"}: ${erro}`);
    return NextResponse.json({ error: erro, custoUsd }, { status: 502 });
  }
}
