/**
 * TIRA AS FRASES FALSAS DOS RASCUNHOS (08/10/2026), depois do "vídeo que não
 * existe": os posts da campanha de teste do Bruno citam o vídeo "Seu gêmeo IA
 * trabalha 24 horas sem férias" no canal do YouTube (não existe), "o carrossel
 * que postei ontem" e "a peça de sexta" sem garantia de que foram ao ar.
 *
 * Passa cada post EM RASCUNHO do projeto pela mesma regra da publicação:
 *   1. a guarda do conteúdo próprio (lib/squad/guarda-do-conteudo-proprio.ts),
 *      SÓ POR CÓDIGO, sem JEV (nenhuma chamada paga): toda frase que cita
 *      conteúdo do cliente que não está no inventário sai;
 *   2. as chamadas de elo montadas em código (o convite antigo "Assista
 *      inteiro no meu canal do YouTube") saem, e entram de novo só se a peça
 *      citada estiver publicada (lib/media/elo-na-publicacao.ts).
 * O card que mostra o mesmo texto acompanha. Publicado, agendado e arquivado
 * não são tocados.
 *
 * SIMULAÇÃO POR PADRÃO: mostra o antes e o depois e não grava nada.
 *   npx tsx --env-file=.env.local scripts/tmp/tirar-frases-falsas-0810.mts
 *   npx tsx --env-file=.env.local scripts/tmp/tirar-frases-falsas-0810.mts --aplicar
 *   npx tsx --env-file=.env.local scripts/tmp/tirar-frases-falsas-0810.mts --projeto <id> [--run <id>]
 */
import { prisma } from "../../lib/db/prisma.js";
import { guardarConteudoProprio } from "../../lib/squad/guarda-do-conteudo-proprio.js";
import { lerInventario } from "../../lib/analytics/inventario-das-redes.js";
import { textoComEloDoPost } from "../../lib/media/elo-na-publicacao.js";
import { nomeDoCanal, perfisDoCliente } from "../../lib/media/elo-da-campanha.js";
import { lerLinks } from "../../lib/projeto/links-do-cliente.js";

const args = process.argv.slice(2);
const valor = (nome: string) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};
const APLICAR = args.includes("--aplicar");
const PROJETO = valor("--projeto") ?? "cmu7hmu0j000004jrh2yc5udb";
const RUN = valor("--run");

const projeto = await prisma.project.findUnique({
  where: { id: PROJETO },
  select: { name: true, config: true, socialAccounts: { where: { isActive: true }, select: { platform: true, username: true, displayName: true } } },
});
if (!projeto) {
  console.error(`Projeto ${PROJETO} não encontrado.`);
  process.exit(1);
}
const inventario = await lerInventario(PROJETO);
const canal = nomeDoCanal(projeto.socialAccounts, projeto.config);
const permitidos = [
  ...lerLinks(projeto.config).map((l) => l.url),
  ...perfisDoCliente(projeto.socialAccounts, projeto.config).map((p) => p.url).filter((u): u is string => Boolean(u)),
];
console.log(`Projeto: ${projeto.name} (${PROJETO})${RUN ? `, run ${RUN}` : ""}`);
console.log(`Inventário (o que está comprovado no ar): ${inventario.length} item(ns)`);
for (const i of inventario.slice(0, 10)) console.log(`   . ${i.rede} ${i.publicadoEm?.slice(0, 10) ?? "?"} ${(i.titulo ?? "").slice(0, 80)}`);
console.log(APLICAR ? "\nMODO: APLICAR (grava no banco)\n" : "\nMODO: SIMULAÇÃO (nada é gravado; rode com --aplicar para gravar)\n");

const posts = await prisma.post.findMany({
  where: { projectId: PROJETO, status: "draft", ...(RUN ? { runId: RUN } : {}) },
  orderBy: [{ runId: "asc" }, { dayOfWeek: "asc" }, { platform: "asc" }],
  select: { id: true, projectId: true, platform: true, content: true, metadata: true, mediaType: true, dayOfWeek: true, runId: true },
});

let mudariam = 0;
let gravados = 0;
for (const p of posts) {
  const meta = (p.metadata as Record<string, unknown> | null) ?? {};
  const frasesDoCliente = Array.isArray(meta.frasesDoCliente) ? (meta.frasesDoCliente as unknown[]).filter((x): x is string => typeof x === "string") : [];
  const guarda = (texto: string) =>
    guardarConteudoProprio({ projectId: PROJETO, texto, rede: p.platform, pecaEhVideo: p.mediaType === "video", inventario, permitidos, usarJev: false, frasesDoCliente });

  const g = await guarda(p.content);
  const novo = await textoComEloDoPost({ ...p, content: g.texto }, { canal });
  let novaIntro: string | null = null;
  if (p.mediaType === "poll" && typeof meta.intro === "string") {
    const gi = await guarda(meta.intro);
    if (gi.texto !== meta.intro) novaIntro = gi.texto;
  }
  if (novo === p.content && novaIntro === null) continue;
  if (!novo.trim()) {
    console.log(`\n!! ${p.id} (${p.platform}, dia ${p.dayOfWeek}): a limpeza esvaziaria o post; NÃO mexo. Revise à mão.`);
    continue;
  }
  mudariam++;
  console.log(`\n=== ${p.id} ${p.platform} dia ${p.dayOfWeek} ${p.mediaType} run ${p.runId}`);
  for (const c of g.cortadas) console.log(`   - SAI: "${c.frase.slice(0, 200)}" (${c.motivo})`);
  if (novo !== p.content && !g.cortadas.length) console.log("   - a chamada de elo antiga sai (a peça citada não está no ar) ou é trocada pela conferida");
  if (novaIntro !== null) console.log("   - a introdução da enquete também muda");
  if (APLICAR) {
    await prisma.post.update({
      where: { id: p.id },
      data: { content: novo, ...(novaIntro !== null ? { metadata: { ...meta, intro: novaIntro } as never } : {}) },
    });
    // Só o card que mostrava ESTE texto (o do redator ou o do Vitor); o da Diana descreve a arte.
    await prisma.campaignCard.updateMany({ where: { postId: p.id, content: p.content }, data: { content: novo } });
    gravados++;
  }
}

console.log(`\n${posts.length} rascunho(s) lidos; ${mudariam} mudariam.${APLICAR ? ` ${gravados} gravado(s).` : " Nada foi gravado (simulação)."}`);
await prisma.$disconnect();
