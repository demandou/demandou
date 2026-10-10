import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/server";
import { podeUsarProjeto } from "@/lib/equipe/conta";
import { prisma } from "@/lib/db/prisma";
import { editorDoCursoLigado, escolhaDoEditorDoProjeto, escolherModeloDoCurso, modeloPodeSerEscolhido } from "@/lib/media/editor-do-curso/no-corte";
import { DETALHE_DO_SOB_MEDIDA, editorAvancadoLigado, ehSobMedida, OPCOES_SOB_MEDIDA } from "@/lib/media/editor-avancado/no-corte";
import { modelosDaBiblioteca } from "@/lib/media/editor-do-curso/biblioteca";
import { modeloEscolhidoDoProjeto, situacaoDoMaterialNoProjeto } from "@/lib/media/editor-do-curso/material-do-modelo-servidor";
import { pedeMaterial } from "@/lib/media/editor-do-curso/material-do-modelo";
import { recomendarModelo, situacaoDaRecomendacao } from "@/lib/media/editor-do-curso/recomendacao";
import { levarModeloParaAsPecas, pecasDoModeloJaFeitas } from "@/lib/media/editor-do-curso/pecas-no-modelo";
import { registrarNota } from "@/lib/cerebro/captura";

/**
 * OS MODELOS DO CURSO NA BIBLIOTECA DE ESTILOS (09/10/2026, noite).
 *
 * GET devolve o modelo escolhido no projeto, a recomendação pelo perfil que
 * ainda vale (ou null) e os cartões dos 79 modelos, os que servem no corte e
 * os que chegam em breve. Não faz chamada paga: `pendente` diz que falta
 * calcular a recomendação (sem guardada, ou o perfil mudou).
 *
 * POST calcula a recomendação quando ela está pendente (o JEV decide, o Haiku
 * escreve o motivo) e devolve a guardada nos outros casos. A tela chama logo
 * depois do GET, para a grade aparecer sem esperar.
 *
 * PUT { modelo: string | null } grava a escolha (null volta ao editor de
 * antes; "sob-medida-3d", "sob-medida-recorte" e "sob-medida-graficos" são as
 * edições sob medida do editor avançado, só com EDITOR_AVANCADO=1). 400 quando o modelo ainda não serve no corte.
 *
 * O MODELO QUE PEDE MATERIAL (10/10, material-do-modelo.ts): pode ser
 * escolhido sem o material; `modelo` é o escolhido, e `material` diz se o
 * material dele basta e o que falta (a edição só começa com ele).
 */
export const dynamic = "force-dynamic";
// O redator do estilo das peças e o confirmar (biblioteca de design) levam até ~1 min cada.
export const maxDuration = 300;

async function podeUsar(id: string): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const p = await prisma.project.findUnique({ where: { id }, select: { id: true, userId: true } });
  // Dono ou membro da equipe com o projeto liberado (01/10).
  return podeUsarProjeto(userId, p);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [modeloDoCurso, escolha, s] = await Promise.all([modeloEscolhidoDoProjeto(id), escolhaDoEditorDoProjeto(id), situacaoDaRecomendacao(id)]);
  // A EDIÇÃO SOB MEDIDA (10/10): as três aulas do curso como opções no topo da biblioteca,
  // só com EDITOR_AVANCADO=1. Escolhida, ela é o modelo em uso; o modelo do curso de antes
  // fica de reserva (e segue nas peças).
  const avancado = editorAvancadoLigado();
  const sobMedida = avancado && ehSobMedida(escolha.escolhido);
  return NextResponse.json({
    ligado: editorDoCursoLigado(),
    modelo: sobMedida ? escolha.escolhido : modeloDoCurso,
    reserva: sobMedida ? modeloDoCurso : null,
    sobMedida: avancado ? { opcoes: OPCOES_SOB_MEDIDA, detalhe: DETALHE_DO_SOB_MEDIDA } : null,
    material: modeloDoCurso && pedeMaterial(modeloDoCurso) ? await situacaoDoMaterialNoProjeto(id, modeloDoCurso).catch(() => null) : null,
    recomendacao: s.recomendacao,
    pendente: s.pendente,
    modelos: modelosDaBiblioteca(),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const corpo = (await req.json().catch(() => null)) as { acao?: unknown } | null;
  if (corpo?.acao === "pecas" || corpo?.acao === "pecas-feitas") return pecas(id, corpo.acao === "pecas");
  try {
    const r = await recomendarModelo(id);
    return NextResponse.json({ recomendacao: r.recomendacao, pendente: false });
  } catch (e) {
    console.error(`[modelo-do-curso][recomendar] ${id}: ${e instanceof Error ? e.message : e}`);
    // Sem recomendação, a tela segue com a lista inteira; nada é inventado.
    return NextResponse.json({ recomendacao: null, pendente: false });
  }
}

/**
 * AS PEÇAS NO ESTILO DO MODELO (10/10): `acao: "pecas"` leva o modelo em uso
 * para as artes, os carrosséis e os vídeos curtos (escreve a rodada do "Meu
 * estilo" e, para o dono, confirma); `acao: "pecas-feitas"` só devolve a que
 * já existe, sem IA. Ver lib/media/editor-do-curso/pecas-no-modelo.ts.
 */
async function pecas(id: string, levar: boolean) {
  // O estilo das peças segue o modelo escolhido, mesmo o que ainda espera o material do cliente.
  const modelo = await modeloEscolhidoDoProjeto(id);
  if (!modelo) return NextResponse.json({ pecas: null });
  const { userId } = await auth();
  const p = await prisma.project.findUnique({ where: { id }, select: { userId: true } });
  if (!levar) return NextResponse.json({ pecas: await pecasDoModeloJaFeitas(id, modelo), podeConfirmar: p?.userId === userId });
  try {
    const r = await levarModeloParaAsPecas({ projectId: id, userId: userId!, modelo, podeConfirmar: p?.userId === userId });
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: 400 });
    // O SEGUNDO CÉREBRO: a confirmação vira nota lida pelo JEV, depois da resposta (como no "Meu estilo").
    const chave = r.pecas.preferenciaKey;
    if (chave) after(() => registrarNota(id, `preferencia:${chave}`));
    return NextResponse.json({ pecas: { ...r.pecas, preferenciaKey: undefined }, podeConfirmar: p?.userId === userId });
  } catch (e) {
    console.error(`[modelo-do-curso][pecas] ${id}: ${e instanceof Error ? e.message : e}`);
    return NextResponse.json({ error: "Não consegui levar o estilo do modelo para as peças agora. Tente de novo em instantes." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await podeUsar(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const corpo = (await req.json().catch(() => null)) as { modelo?: unknown } | null;
  if (!corpo || !("modelo" in corpo) || (corpo.modelo !== null && typeof corpo.modelo !== "string")) {
    return NextResponse.json({ error: "Diga qual modelo usar, ou null para voltar ao editor de antes." }, { status: 400 });
  }
  const modelo = corpo.modelo as string | null;
  const sobMedida = ehSobMedida(modelo) && editorAvancadoLigado();
  if (modelo !== null && !sobMedida && !modeloPodeSerEscolhido(modelo)) {
    return NextResponse.json({ error: "Este modelo ainda não pode ser usado nos cortes." }, { status: 400 });
  }
  await escolherModeloDoCurso(id, modelo);
  const material = modelo && !sobMedida && pedeMaterial(modelo) ? await situacaoDoMaterialNoProjeto(id, modelo).catch(() => null) : null;
  return NextResponse.json({ ok: true, modelo, material });
}
