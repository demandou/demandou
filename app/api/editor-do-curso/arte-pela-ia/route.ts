export const dynamic = "force-dynamic";
// As artes de uma semana pela IA de imagem rodam depois da resposta: de 1 a 3 minutos por dia, três dias por vez.
export const maxDuration = 800;

import { after, NextRequest, NextResponse } from "next/server";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { desenharLotePelaIa } from "@/lib/media/editor-do-curso/arte-pelo-modelo-servidor";

/**
 * AS ARTES DO PROJETO COM MODELO DO CURSO PELA IA DE IMAGEM (11/10/2026,
 * lib/media/editor-do-curso/arte-pela-ia.ts). A semana do vídeo cria os posts
 * "o squad está fazendo" com o lote e pede aqui o desenho: a resposta sai na
 * hora (202) e as artes são feitas numa função própria, com o prazo dela, sem
 * segurar a esteira. Assinado pelo próprio app (o mesmo segredo do worker).
 * O que não sair pela IA vai ao caminho de hoje; a função que morrer no meio
 * deixa os posts pendentes para o vigia da fila.
 */
export async function POST(req: NextRequest) {
  const cru = await req.text();
  if (!corpoAssinadoConfere(cru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let corpo: { projectId?: unknown; lote?: unknown };
  try {
    corpo = JSON.parse(cru);
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }
  const projectId = typeof corpo.projectId === "string" ? corpo.projectId : null;
  const lote = typeof corpo.lote === "string" ? corpo.lote : null;
  if (!projectId || !lote) return NextResponse.json({ error: "Faltam o projeto e o lote" }, { status: 400 });
  after(() =>
    desenharLotePelaIa(projectId, lote)
      .then((r) => console.log(`[arte-pela-ia] lote ${lote}: ${r.feitos} dia(s) desenhado(s), ${r.falhas} falha(s)`))
      .catch((e) => console.error(`[arte-pela-ia] lote ${lote} falhou:`, e))
  );
  return NextResponse.json({ ok: true, lote }, { status: 202 });
}
