export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin/guarda";
import { decidirReprovacaoPeloAdmin } from "@/lib/credits/reprovacao-servidor";

/**
 * A DECISÃO DO ADMIN NA FILA DE REPROVAÇÕES (08/10/2026): devolver ou manter.
 * Corpo { decisao: "devolver" | "manter", motivo?: string }. Uma vez só por
 * reprovação; a devolução usa o mesmo refId do caminho automático, então
 * nunca sai duas vezes. O cliente recebe a resposta no sino.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { decisao?: unknown; motivo?: unknown };
  if (b.decisao !== "devolver" && b.decisao !== "manter") return NextResponse.json({ error: "Decida: devolver ou manter." }, { status: 400 });
  try {
    const r = await decidirReprovacaoPeloAdmin({ admin, id, decisao: b.decisao, motivo: typeof b.motivo === "string" ? b.motivo : null });
    if (!r.ok) {
      if (r.erro === "ja_decidida") return NextResponse.json({ error: "Esta reprovação já foi decidida." }, { status: 409 });
      return NextResponse.json({ error: r.erro === "peca_sumiu" ? "A peça não existe mais." : "Reprovação não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, estado: r.estado });
  } catch (err) {
    console.error("[admin/reprovacoes/decidir]", err);
    return NextResponse.json({ error: "Não consegui decidir agora. Nada foi devolvido; tente de novo." }, { status: 500 });
  }
}
