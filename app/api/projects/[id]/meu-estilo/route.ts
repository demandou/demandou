export const dynamic = "force-dynamic";
/** O redator escreve o estilo (até ~40 s) e as prévias passam pelo gerador de arte, pelo olho e pelo JEV (até ~3 min). */
export const maxDuration = 300;

import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { soODono } from "@/lib/equipe/permissoes";
import { SaldoInsuficiente } from "@/lib/credits";
import { lerMidia } from "@/lib/media/storage";
import { registrarNota } from "@/lib/cerebro/captura";
import { confirmarRodada, escreverRodada, estadoDoMeuEstilo, gerarPreviasDaRodada } from "@/lib/estilo-proprio/servidor";
import { EVENTO_DO_ESTILO_CONFIRMADO, rodadaParaTela } from "@/lib/estilo-proprio/tipos";

/**
 * O MEU ESTILO (08/10/2026): a caixa "descreva o seu estilo do seu jeito".
 * Ver lib/estilo-proprio/tipos.ts (o caminho inteiro) e servidor.ts (onde o
 * estilo confirmado fica gravado).
 *
 * GET: o histórico das rodadas (sem custo em dólar: o cliente nunca lê dólar
 *   nem fornecedor), o estilo confirmado, o nicho (os exemplos da caixa) e os
 *   créditos de uma rodada de prévias. Com `?previa=<url>`, serve a imagem de
 *   uma prévia guardada no store privado (a pública vai direto).
 * POST { acao }:
 *   "escrever"  { fala, ajuste?, origem? }: o Claude escreve o estilo a partir
 *               da fala (nenhuma prévia, nenhum crédito). `ajuste` continua a
 *               conversa da última rodada;
 *   "previas"   { rodada? }: gera as prévias da rodada (reserva os créditos do
 *               teto, acerta pelo custo real no fim; sem saldo, 402 e nada
 *               gerado);
 *   "confirmar" { rodada? }: "É isso": o estilo vira o estilo do projeto (só
 *               o dono: é o estilo mestre de toda peça).
 * A fala em áudio chega pela rota ./voz, já como texto.
 */

async function projetoDoUsuario(id: string) {
  const { userId } = await auth();
  if (!userId) return { erro: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const project = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!project || !(await podeUsarProjeto(userId, project))) return { erro: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  return { project, userId };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await projetoDoUsuario(id);
  if (r.erro) return r.erro;
  const previa = req.nextUrl.searchParams.get("previa");
  if (previa) {
    // Só as prévias deste projeto (o caminho leva o id), nunca uma URL qualquer.
    if (!previa.includes(`meu-estilo/${id}/`)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const dados = await lerMidia(previa).catch(() => null);
    if (!dados) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return new NextResponse(new Uint8Array(dados), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" } });
  }
  return NextResponse.json({ ...(await estadoDoMeuEstilo(id)), podeConfirmar: r.project.userId === r.userId });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await projetoDoUsuario(id);
  if (r.erro) return r.erro;
  const corpo = (await req.json().catch(() => ({}))) as { acao?: unknown; fala?: unknown; ajuste?: unknown; origem?: unknown; rodada?: unknown };
  const rodada = typeof corpo.rodada === "number" ? corpo.rodada : null;
  try {
    if (corpo.acao === "escrever") {
      const res = await escreverRodada({ projectId: id, fala: String(corpo.fala ?? ""), ajuste: corpo.ajuste === true, origem: corpo.origem === "voz" ? "voz" : "escrito" });
      if (!res.ok) return NextResponse.json({ error: res.erro }, { status: 400 });
      return NextResponse.json({ ok: true, rodada: rodadaParaTela(res.rodada) });
    }
    if (corpo.acao === "previas") {
      const res = await gerarPreviasDaRodada({ projectId: id, userId: r.userId, rodada });
      if (!res.ok) return NextResponse.json({ error: res.erro }, { status: 502 });
      return NextResponse.json({ ok: true, rodada: rodadaParaTela(res.rodada), avisos: res.avisos });
    }
    if (corpo.acao === "confirmar") {
      const recusa = await soODono(r.userId, r.project, "confirmar o estilo do projeto");
      if (recusa) return recusa;
      const res = await confirmarRodada({ projectId: id, userId: r.userId, rodada });
      if (!res.ok) return NextResponse.json({ error: res.erro }, { status: 400 });
      // O SEGUNDO CÉREBRO: a confirmação vira nota lida pelo JEV, depois da resposta.
      after(() => registrarNota(id, `preferencia:${res.preferenciaKey}`));
      return NextResponse.json({ ok: true, confirmado: res.confirmado, evento: EVENTO_DO_ESTILO_CONFIRMADO });
    }
    return NextResponse.json({ error: "Diga o que fazer: escrever, previas ou confirmar." }, { status: 400 });
  } catch (e) {
    if (e instanceof SaldoInsuficiente) return NextResponse.json({ error: e.message, equipe: e.equipe }, { status: 402 });
    console.error("[meu-estilo]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não consegui agora. Tente de novo em instantes." }, { status: 500 });
  }
}
