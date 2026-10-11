export const dynamic = "force-dynamic";
export const maxDuration = 800;

import { after, NextRequest, NextResponse } from "next/server";
import { corpoAssinadoConfere, CABECALHO_ASSINATURA } from "@/lib/media/worker-token";
import { acabouPensando } from "@/lib/media/editor-avancado/escrever-cenas";
import { atenderPedidoDaCena, FalhaComCusto, PedidoInvalido, type PedidoDaCena } from "@/lib/media/editor-avancado/atender";
import { apagarFim, estadoDoTrabalho, gravarFim, inicioDoTrabalho, lerFim, novoIdDeTrabalho } from "@/lib/media/editor-avancado/trabalho";

/**
 * O worker pede ao app a parte de IA de um corte no EDITOR AVANÇADO (10/10):
 * a técnica (o JEV), a escrita e os consertos das cenas (o Claude Sonnet 5,
 * com o prefixo em cache das regras das aulas, da API do kit e dos exemplos
 * aprovados) e a revisão dos quadros (o Gemini descreve, o JEV decide). O
 * fluxo, os portões e o render rodam no worker
 * (worker/src/avancado/editar-avancado.mjs). Sem sessão, como todo pedido do
 * worker, e autenticado pela assinatura sobre o corpo inteiro. O uso de IA vai
 * para ai_usage como "editor-avancado-<fase>" (e jev-editor-avancado-*).
 *
 * ASSÍNCRONA desde 11/10 (lib/media/editor-avancado/trabalho.ts): a escrita da
 * Maquete 3D passou de 800 s e a Vercel matou a rota com o worker esperando.
 *   { fase, ... }       responde 202 { id } na hora; a fase roda depois da
 *                       resposta, numa invocação só dela, e grava o fim no Blob
 *   { consultar: id }   { estado: "andando" | "pronto" | "falhou" | "perdido", ... }
 */
export async function POST(req: NextRequest) {
  const corpoCru = await req.text();
  if (!corpoAssinadoConfere(corpoCru, req.headers.get(CABECALHO_ASSINATURA))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }
  let corpo: PedidoDaCena & { consultar?: unknown };
  try {
    corpo = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Corpo não é JSON" }, { status: 400 });
  }

  if (corpo.consultar !== undefined) {
    const id = String(corpo.consultar);
    if (inicioDoTrabalho(id) === null) return NextResponse.json({ error: "id de trabalho inválido" }, { status: 400 });
    const estado = estadoDoTrabalho(id, await lerFim(id));
    if (estado.estado === "pronto" || estado.estado === "falhou") await apagarFim(id);
    return NextResponse.json(estado);
  }

  const id = novoIdDeTrabalho();
  const rotulo = `[editor-avancado] ${corpo.fase ?? "?"} do corte ${corpo.videoJobId ?? "?"} (${id.slice(14, 22)})`;
  after(async () => {
    const t0 = Date.now();
    const segundos = () => Math.round((Date.now() - t0) / 1000);
    try {
      const resultado = await atenderPedidoDaCena(corpo);
      console.log(`${rotulo}: pronto em ${segundos()} s, US$ ${Number(resultado.custoUsd).toFixed(4)}${corpo.esforco ? `, esforço ${corpo.esforco}` : ""}`);
      await gravarFim(id, { estado: "pronto", resultado, segundos: segundos() });
    } catch (e) {
      const erro = e instanceof Error ? e.message : "falhou";
      // o que a chamada perdida custou vai junto: o teto do corte no worker conta
      const custoUsd = e instanceof FalhaComCusto ? e.custoUsd : 0;
      console.error(`${rotulo}: falhou em ${segundos()} s, US$ ${custoUsd.toFixed(4)}: ${erro}`);
      await gravarFim(id, { estado: "falhou", erro, custoUsd, pensou: acabouPensando(e), invalido: e instanceof PedidoInvalido, segundos: segundos() }).catch((x) =>
        console.error(`${rotulo}: não gravou a falha: ${x instanceof Error ? x.message : x}`)
      );
    }
  });
  return NextResponse.json({ id }, { status: 202 });
}
