export const dynamic = "force-dynamic";
export const maxDuration = 800;

import { NextRequest, NextResponse } from "next/server";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { atenderPedidoDaCena, PedidoInvalido, type PedidoDaCena } from "@/lib/media/editor-avancado/atender";

/**
 * O worker pede ao app a parte de IA de um corte no EDITOR AVANÇADO (10/10):
 * a técnica (o JEV), a escrita e os consertos das cenas (o Claude Sonnet 5,
 * com o prefixo em cache das regras das aulas, da API do kit e dos exemplos
 * aprovados) e a revisão dos quadros (o Gemini descreve, o JEV decide). O
 * fluxo, os portões e o render rodam no worker
 * (worker/src/avancado/editar-avancado.mjs). Sem sessão, como todo pedido do
 * worker, e autenticado pela assinatura sobre o corpo inteiro. O uso de IA vai
 * para ai_usage como "editor-avancado-<fase>" (e jev-editor-avancado-*).
 */
export async function POST(req: NextRequest) {
  const corpoCru = await req.text();
  if (!corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let corpo: PedidoDaCena;
  try {
    corpo = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }
  try {
    return NextResponse.json(await atenderPedidoDaCena(corpo));
  } catch (e) {
    if (e instanceof PedidoInvalido) return NextResponse.json({ error: e.message }, { status: 400 });
    const erro = e instanceof Error ? e.message : "falhou";
    console.error(`[editor-avancado] ${corpo.fase ?? "?"} do corte ${corpo.videoJobId ?? "?"}: ${erro}`);
    return NextResponse.json({ error: erro }, { status: 502 });
  }
}
