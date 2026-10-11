// O PEDIDO DA CENA AO APP, ASSÍNCRONO (11/10/2026). No teste do Bruno (vídeo cmv3tyr0u,
// Maquete 3D) a escrita passou de 13 minutos: a Vercel matou a rota em 800 s e o worker
// ficou com "fetch failed". Agora a rota responde 202 { id } na hora, faz a fase numa
// invocação só dela e o worker consulta { consultar: id } até ficar pronto.
//
// A chamada que acabou só pensando (o modelo gastou o teto sem escrever) volta como
// falha com `pensou`: aqui ela é pedida de novo com esforço baixo, numa invocação nova,
// e o custo da primeira entra na conta da segunda.

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const FASES_QUE_ESCREVEM = new Set(["escrever", "consertar-codigo", "consertar"]);

/** O erro do pedido, com o custo que a chamada perdida já gastou (o teto do corte conta). */
export function falhaDoPedido(mensagem, custoUsd = 0) {
  return Object.assign(new Error(mensagem), { custoUsd: Number(custoUsd) || 0 });
}

/** Vale pedir de novo com esforço baixo? Puro (testado). */
export function deveTentarComMenosEsforco(corpo, fim) {
  return Boolean(fim?.estado === "falhou" && fim.pensou && FASES_QUE_ESCREVEM.has(corpo?.fase) && corpo?.esforco !== "low" && fim.esforco !== "low");
}

/**
 * Lê uma consulta: { pronto, resultado } | { pronto: false } | lança. Puro (testado).
 * "perdido" é a função que morreu no prazo sem gravar o fim.
 */
export function lerConsulta(j) {
  if (j?.estado === "andando") return { pronto: false };
  if (j?.estado === "pronto" && j.resultado) return { pronto: true, resultado: j.resultado, segundos: j.segundos };
  if (j?.estado === "falhou") return { pronto: true, falhou: j };
  if (j?.estado === "perdido") throw falhaDoPedido(`o app perdeu a fase: ${j.erro ?? "sem resultado"}`);
  throw falhaDoPedido(`consulta sem estado conhecido: ${JSON.stringify(j).slice(0, 200)}`);
}

/**
 * Pede uma fase e espera o fim. `enviar(texto)` faz o POST assinado e devolve a Response.
 * Devolve o resultado da fase (com custoUsd) ou lança com custoUsd.
 */
export async function pedirCenaAssincrona(corpo, { enviar, aoLog = () => {}, intervaloMs = 8000, prazoMs = 16 * 60_000, dormir = espera, agora = Date.now } = {}) {
  const t0 = agora();
  // o prazo é de cada pedido (a função do app morre em 800 s; o "perdido" chega antes disto)
  const uma = async (c) => {
    const inicio = agora();
    const r = await enviar(JSON.stringify(c));
    const texto = await r.text().catch(() => "");
    let j = null;
    try {
      j = JSON.parse(texto);
    } catch {
      // corpo que não é JSON
    }
    if (r.status === 200 && j) return { estado: "pronto", resultado: j, segundos: null };
    if (r.status !== 202 || !j?.id) throw falhaDoPedido(`o app não aceitou a fase ${c.fase} (HTTP ${r.status}): ${texto.slice(0, 300)}`, j?.custoUsd);
    const id = j.id;
    for (;;) {
      await dormir(intervaloMs);
      if (agora() - inicio > prazoMs) throw falhaDoPedido(`a fase ${c.fase} passou de ${Math.round(prazoMs / 60_000)} min no app (id ${id})`);
      let consulta;
      try {
        const rc = await enviar(JSON.stringify({ consultar: id }));
        if (!rc.ok) continue; // a consulta é barata: um erro de rede ou 5xx passageiro tenta de novo
        consulta = lerConsulta(await rc.json());
      } catch (e) {
        if (e?.custoUsd !== undefined && /perdeu a fase|estado conhecido/.test(e.message)) throw e;
        continue;
      }
      if (!consulta.pronto) continue;
      if (consulta.falhou) return consulta.falhou;
      return { estado: "pronto", resultado: consulta.resultado, segundos: consulta.segundos };
    }
  };
  let fim = await uma(corpo);
  let custoAntes = 0;
  if (deveTentarComMenosEsforco(corpo, fim)) {
    custoAntes = Number(fim.custoUsd) || 0;
    aoLog(`fase ${corpo.fase}: acabou só pensando em ${fim.segundos ?? "?"} s (US$ ${custoAntes.toFixed(4)}); de novo com esforço baixo`);
    try {
      fim = await uma({ ...corpo, esforco: "low", tetoRestanteUsd: corpo.tetoRestanteUsd != null ? Math.max(0, Number(corpo.tetoRestanteUsd) - custoAntes) : corpo.tetoRestanteUsd });
    } catch (e) {
      // a primeira chamada já foi cobrada: entra no teto mesmo que a segunda se perca
      e.custoUsd = (Number(e.custoUsd) || 0) + custoAntes;
      throw e;
    }
  }
  const total = ((agora() - t0) / 1000).toFixed(1);
  if (fim.estado === "falhou") {
    const custo = custoAntes + (Number(fim.custoUsd) || 0);
    aoLog(`fase ${corpo.fase}: falhou em ${total} s (no app ${fim.segundos ?? "?"} s), US$ ${custo.toFixed(4)}`);
    throw falhaDoPedido(`o app falhou na fase ${corpo.fase}: ${String(fim.erro ?? "").slice(0, 300)}`, custo);
  }
  const resultado = { ...fim.resultado, custoUsd: custoAntes + (Number(fim.resultado.custoUsd) || 0) };
  aoLog(`fase ${corpo.fase}: pronta em ${total} s (no app ${fim.segundos ?? "?"} s), US$ ${resultado.custoUsd.toFixed(4)}`);
  return resultado;
}
