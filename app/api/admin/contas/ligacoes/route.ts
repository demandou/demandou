export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin/guarda";
import { RecusaDoAdmin } from "@/lib/admin/acoes";
import { desligarConta, ligarConta } from "@/lib/admin/contas/vinculos";

/**
 * LIGAR E DESLIGAR UMA CONTA DO CONTRATO DE OUTRA (08/10/2026), na tela
 * /admin/contas/[titularId]. As travas moram em lib/admin/contas/vinculos.ts;
 * aqui só o papel de admin e a tradução da recusa. A ligação é análise: não
 * muda plano, saldo, projeto nem cobrança de ninguém.
 */
export async function POST(req: NextRequest) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = typeof b.userId === "string" ? b.userId : "";
  const titularId = typeof b.titularId === "string" ? b.titularId : "";
  const observacao = typeof b.observacao === "string" ? b.observacao : null;
  if (!userId || !titularId) return NextResponse.json({ error: "Escolha a conta e a titular." }, { status: 400 });
  try {
    await ligarConta(admin, userId, titularId, observacao);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RecusaDoAdmin) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[admin/contas/ligacoes] ligar", err);
    return NextResponse.json({ error: "Não consegui ligar agora. Nada mudou; tente de novo." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = typeof b.userId === "string" ? b.userId : "";
  if (!userId) return NextResponse.json({ error: "Escolha a conta." }, { status: 400 });
  try {
    await desligarConta(admin, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RecusaDoAdmin) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[admin/contas/ligacoes] desligar", err);
    return NextResponse.json({ error: "Não consegui desligar agora. Nada mudou; tente de novo." }, { status: 500 });
  }
}
