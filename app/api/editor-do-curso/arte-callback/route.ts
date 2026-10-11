export const dynamic = "force-dynamic";
// A reserva (o caminho de hoje para o que faltou) roda depois da resposta e leva minutos por grupo.
export const maxDuration = 800;

import { after, NextRequest, NextResponse } from "next/server";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { lerCallbackDaArte } from "@/lib/media/editor-do-curso/arte-pelo-modelo";
import { concluirArteNoModelo, desenharPeloCaminhoDeHoje } from "@/lib/media/editor-do-curso/arte-pelo-modelo-servidor";
import { lerRetornoDaCapa } from "@/lib/media/capa-pelo-modelo";
import { concluirCapaNoModelo, reservaDasCapas } from "@/lib/media/capa-pelo-modelo-servidor";

/**
 * O worker avisa que terminou (ou não) um lote de peças da campanha no modelo
 * do curso (10/10, worker/src/modelo/arte-no-modelo.mjs, POST /arte-no-modelo).
 *
 * Sem sessão, como todo callback de fora, e autenticado pela assinatura sobre o
 * corpo inteiro, como o montar-callback: o corpo traz as URLs das imagens que
 * vão para os posts do cliente. O lote volta no próprio corpo (`retorno`), e só
 * os posts que ainda esperam aquele lote recebem a arte.
 *
 * O que faltou (peça que não saiu, lote que falhou, worker que reiniciou) vai
 * para o caminho de hoje DEPOIS da resposta: nenhum post fica sem arte.
 */
export async function POST(req: NextRequest) {
  const corpoCru = await req.text();
  if (!corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }
  const cb = lerCallbackDaArte(bruto);
  if (!cb) return NextResponse.json({ error: "Sem o lote de retorno" }, { status: 400 });
  if (!cb.ok) console.error(`[arte-callback] lote ${cb.lote}: ${cb.erro}`);
  if (cb.avisos.length) console.warn(`[arte-callback] lote ${cb.lote}: ${cb.avisos.join(" | ").slice(0, 600)}`);
  // AS CAPAS (11/10, lib/media/capa-pelo-modelo.ts): o lote "capa-..." vai para
  // a capa do completo ou dos cortes, e o que faltou, para o caminho de hoje.
  const daCapa = lerRetornoDaCapa(bruto);
  if (daCapa) {
    const r = await concluirCapaNoModelo(cb, daCapa);
    if (r.reserva.completo || r.reserva.cortes.length) {
      after(() => reservaDasCapas(daCapa.videoJobId, r.reserva).catch((e) => console.error(`[arte-callback] reserva das capas do lote ${cb.lote} falhou:`, e)));
    }
    return NextResponse.json({ ok: true, capa: daCapa.alvo, reserva: r.reserva });
  }
  const r = await concluirArteNoModelo(cb);
  if (r.projectId && r.reserva.length) {
    const projectId = r.projectId;
    after(async () => {
      for (const g of r.reserva) {
        await desenharPeloCaminhoDeHoje(projectId, g.postIds, g.motivo).catch((e) => console.error(`[arte-callback] reserva do lote ${cb.lote} falhou:`, e));
      }
    });
  }
  // 200 também quando nada mudou: repetir o aviso não mexe em post que já saiu da espera.
  return NextResponse.json({ ok: true, preenchidos: r.preenchidos, reserva: r.reserva.length, ignorados: r.ignorados });
}
