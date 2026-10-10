export const dynamic = "force-dynamic";
export const maxDuration = 800;

import { NextRequest, NextResponse } from "next/server";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import {
  escreverPlanoDoModelo,
  numerosSemLastro,
  type EsqueletoDoPlano,
  type ReferenciasDoModelo,
  type RetornoDaConferencia,
} from "@/lib/media/editor-do-curso/escrever-plano";

/**
 * O worker pede o mapa e o plano de um corte num modelo do curso (09/10).
 *
 * O fluxo do curso roda no worker (worker/src/modelo/editar-no-modelo.mjs);
 * só a escrita mora aqui, onde a conta de IA vive. Uma volta por chamada: a
 * conferência do curso roda lá, e a reprovada volta para cá em `anterior`.
 * Sem sessão, como todo pedido do worker, e autenticado pela assinatura sobre
 * o corpo inteiro.
 */
export async function POST(req: NextRequest) {
  const corpoCru = await req.text();
  if (!corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let corpo: {
    modelo?: string;
    referencias?: ReferenciasDoModelo;
    esqueleto?: EsqueletoDoPlano;
    marca?: { nome?: string; area?: string };
    nicho?: string | null;
    anterior?: RetornoDaConferencia | null;
    projectId?: string | null;
  };
  try {
    corpo = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }
  if (!corpo.referencias?.skill || !corpo.esqueleto?.palavras?.length) {
    return NextResponse.json({ error: "Faltam o treinamento do modelo ou a fala" }, { status: 400 });
  }
  let custoUsd = 0;
  try {
    const escrito = await escreverPlanoDoModelo({
      referencias: corpo.referencias,
      esqueleto: corpo.esqueleto,
      marca: { nome: corpo.marca?.nome ?? "", area: corpo.marca?.area ?? "" },
      nicho: corpo.nicho ?? null,
      anterior: corpo.anterior ?? null,
      modelo: process.env.EDITOR_DO_CURSO_IA || undefined,
      usage: { projectId: corpo.projectId ?? null, operation: "editor-do-curso" },
      onCusto: (usd) => {
        custoUsd += usd;
      },
    });
    const semLastro = numerosSemLastro(escrito.plano, corpo.esqueleto.palavras, escrito.plano.correcoes as Record<string, string> | undefined);
    return NextResponse.json({ mapa: escrito.mapa, plano: escrito.plano, custoUsd, numerosSemLastro: semLastro });
  } catch (e) {
    const erro = e instanceof Error ? e.message : "falhou";
    console.error(`[editor-do-curso] plano do ${corpo.modelo ?? "?"}: ${erro}`);
    return NextResponse.json({ error: erro, custoUsd }, { status: 502 });
  }
}
