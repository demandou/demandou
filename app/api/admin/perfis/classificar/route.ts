export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin/guarda";
import { jevLigado } from "@/lib/jev/cliente";
import { classificarPendentes } from "@/lib/admin/perfis/servidor";

/**
 * CLASSIFICAR OS PERFIS PENDENTES PELO JEV (08/10/2026): o botão da tela
 * /admin/perfis. Classifica os projetos sem classificação ou com o nicho
 * mudado, até 60 por clique. Quem decide a categoria é o JEV (escolha entre
 * opções; US$ 42 por bilhão de tokens de entrada); nenhum modelo de texto
 * entra. Sem a chave do JEV, responde dizendo isso e não chama nada.
 */
export async function POST(req: NextRequest) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!jevLigado()) {
    return NextResponse.json({ error: "O JEV está desligado neste ambiente (sem TYPESAFE_API_KEY ou com JEV_LIGADO=0): nada foi classificado." }, { status: 400 });
  }
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const limite = typeof b.limite === "number" ? b.limite : 60;
  try {
    const r = await classificarPendentes({ limite });
    if (!r.tabelasProntas) {
      return NextResponse.json({ error: "As tabelas dos perfis ainda não existem: elas nascem no próximo deploy de produção." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    console.error("[admin/perfis/classificar]", err);
    return NextResponse.json({ error: "Não consegui classificar agora. O que já estava guardado continua; tente de novo." }, { status: 500 });
  }
}
