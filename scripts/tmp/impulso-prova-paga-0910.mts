/**
 * A PROVA PAGA DO AGENTE DE TRÁFEGO (09/10/2026): UM pedido ao JEV e UMA
 * chamada ao Haiku, sem banco nenhum (nem leitura nem escrita).
 *
 * SÓ RODA COM --pagar, depois do OK do Bruno para o valor (regra de 05/10:
 * gasto de desenvolvimento só com OK antes). Sem --pagar, imprime o tamanho
 * dos pedidos e o custo estimado, e não chama nada.
 *
 * De onde vêm os candidatos:
 *   --analise=arquivo.json  a análise real que a amostra só de leitura gravou
 *                           (scripts/tmp/impulso-amostra-0910.mts --analise=...);
 *   sem o arquivo, ou sem candidato nele, um caso SINTÉTICO (seis carrosséis
 *   comuns e dois acima da média), rotulado assim na saída.
 *
 * O JEV e o Haiku são chamados direto (fetch e SDK), sem lib/jev/cliente.ts e
 * sem lib/claude: esses gravam o uso em ai_usage, e esta prova não escreve no
 * banco. O custo sai da resposta de cada um.
 *
 *   npx tsx scripts/tmp/impulso-prova-paga-0910.mts [--analise=arquivo.json] [--pagar]
 */
import { readFileSync, existsSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import {
  ROTULO_DO_FORMATO,
  SISTEMA_DA_FRASE,
  analisarPosts,
  estadoDoJev,
  lerDecisao,
  lerFrases,
  montarSugestao,
  numerosQueSustentam,
  pedidoDaFrase,
  perguntasDoJev,
  postParaImpulso,
  type AnaliseDoProjeto,
  type LeituraParaImpulso,
  type LinhaDoPost,
  type PedidoDeFrase,
} from "@/lib/analytics/tipos-do-impulso";
import type { RespostaDoJev } from "@/lib/jev/cliente";

const env = Object.fromEntries(
  readFileSync("C:/Users/devan/opensquad-app/.env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);
const args = process.argv.slice(2);
const pagar = args.includes("--pagar");
const arquivo = args.find((a) => a.startsWith("--analise="))?.slice(10);

/** O caso sintético: seis carrosséis comuns e dois acima da média, um deles com conversa. */
function sintetico(): AnaliseDoProjeto {
  const agora = new Date();
  const H = 3600_000;
  let n = 0;
  const post = (idadeH: number, leituras: Array<{ h: number; curtidas: number; comentarios: number }>) => {
    const id = `sintetico${++n}`;
    const pub = new Date(agora.getTime() - idadeH * H);
    const l: LinhaDoPost = { id, platform: "instagram", mediaType: "carousel", metadata: { formato: "carousel" }, publishedAt: pub, externalUrl: `https://www.instagram.com/p/${id}/`, content: `Post sintético ${n}: três erros que travam o seu atendimento`, socialAccountId: "conta", accountType: "personal", username: "exemplo", displayName: "Exemplo", funil: "tofu" };
    const lei: LeituraParaImpulso[] = leituras.map((x) => ({ postId: id, fonte: "api:instagram", status: "ok", lidoEm: new Date(pub.getTime() + x.h * H), curtidas: x.curtidas, comentarios: x.comentarios }));
    return postParaImpulso(l, lei);
  };
  const comuns = [[9, 1], [10, 2], [7, 1], [10, 1], [7, 2], [9, 1]].map(([c, k], i) => post(240 + i * 72, [{ h: 24.2, curtidas: c, comentarios: k }, { h: 72.1, curtidas: c + 1, comentarios: k }]));
  const conversa = post(50, [{ h: 24.4, curtidas: 25, comentarios: 6 }]);
  const curtido = post(40, [{ h: 24.4, curtidas: 20, comentarios: 1 }]);
  return analisarPosts([...comuns, conversa, curtido], { "instagram:conta": { valor: 1000, fonte: "apify:instagram", lidoEm: new Date().toISOString() } }, agora);
}

let analise: AnaliseDoProjeto | null = null;
let origem = "sintético";
if (arquivo && existsSync(arquivo)) {
  const dados = JSON.parse(readFileSync(arquivo, "utf8")) as Record<string, AnaliseDoProjeto>;
  const primeiro = Object.entries(dados).find(([, a]) => a.candidatos?.length);
  if (primeiro) {
    analise = primeiro[1];
    origem = `real, projeto ${primeiro[0]}`;
  }
}
analise ??= sintetico();

const state = estadoDoJev(analise);
const questions = perguntasDoJev(analise.candidatos);
const tokensDoJev = Math.round((JSON.stringify(state).length + JSON.stringify(questions).length) / 4);
const pedidosEstimados: PedidoDeFrase[] = analise.candidatos.map((c) => ({ id: c.postId, rede: c.rede, formato: ROTULO_DO_FORMATO[c.formato], motivo: c.motivos[0], numeros: numerosQueSustentam(c, c.motivos[0]) }));
const entradaDoHaiku = Math.round((SISTEMA_DA_FRASE.length + pedidoDaFrase(pedidosEstimados).length) / 3.5);
console.log(`candidatos (${origem}): ${analise.candidatos.length}`);
console.log(`estimativa: JEV ~${tokensDoJev} tokens de entrada (US$ ${(tokensDoJev * 42e-9).toFixed(6)}); Haiku ~${entradaDoHaiku} de entrada e até ~${80 * pedidosEstimados.length} de saída (US$ ${((entradaDoHaiku + 400 * pedidosEstimados.length) / 1e6).toFixed(5)} no teto)`);
if (!pagar) {
  console.log("sem --pagar: nenhuma chamada feita.");
  process.exit(0);
}

const r = await fetch("https://api.typesafe.ai/v1/systemone", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.TYPESAFE_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "jev-latest", state, questions }),
  signal: AbortSignal.timeout(30_000),
});
if (!r.ok) {
  console.error(`JEV respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  process.exit(1);
}
const jev = (await r.json()) as { answers: Record<string, RespostaDoJev>; usage: { input_tokens: number } };
const custoJev = (jev.usage?.input_tokens ?? 0) * 42e-9;
console.log(`\nJEV: ${jev.usage?.input_tokens} tokens de entrada, US$ ${custoJev.toFixed(6)}`);
for (const [k, v] of Object.entries(jev.answers)) console.log(`  ${k}: ${JSON.stringify(v)}`);
const decisoes = lerDecisao(jev.answers, analise.candidatos);
console.log(`decisão (sim de 0,65 e motivo de 0,5 para cima): ${decisoes.length ? decisoes.map((d) => `${d.postId} (${d.motivo})`).join(", ") : "nenhuma sugestão"}`);
if (!decisoes.length) process.exit(0);

const porId = new Map(analise.candidatos.map((c) => [c.postId, c]));
const pedidos: PedidoDeFrase[] = decisoes.map((d) => {
  const c = porId.get(d.postId)!;
  return { id: c.postId, rede: c.rede, formato: ROTULO_DO_FORMATO[c.formato], motivo: d.motivo, numeros: numerosQueSustentam(c, d.motivo) };
});
const cliente = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const msg = await cliente.messages.create({ model: "claude-haiku-4-5", max_tokens: 4000, system: SISTEMA_DA_FRASE, messages: [{ role: "user", content: pedidoDaFrase(pedidos) }] });
const bruto = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
const custoHaiku = (msg.usage.input_tokens * 1 + msg.usage.output_tokens * 5) / 1e6;
console.log(`\nHaiku: ${msg.usage.input_tokens} de entrada e ${msg.usage.output_tokens} de saída, US$ ${custoHaiku.toFixed(5)}`);
console.log(bruto);
const { frases, recusadas } = lerFrases(bruto, pedidos);
for (const d of decisoes) {
  const s = montarSugestao(porId.get(d.postId)!, d, frases[d.postId] ? { texto: frases[d.postId], de: "haiku" } : null);
  console.log(`\n${s.postId}: [${s.fraseDe}] ${s.frase}${recusadas[d.postId] ? ` (frase do Haiku recusada: ${recusadas[d.postId]})` : ""}`);
  console.log(`  ${s.numeros.map((x) => x.detalhe).join(" | ")}`);
}
console.log(`\ncusto total da prova: US$ ${(custoJev + custoHaiku).toFixed(5)}`);
