/**
 * A AMOSTRA DO AGENTE DE TRÁFEGO SOBRE DADOS REAIS (09/10/2026), SÓ LEITURA.
 *
 * Calcula, com o mesmo código da produção (lib/analytics/tipos-do-impulso.ts),
 * a linha de base de cada conta e os sinais dos posts na idade de impulsionar,
 * e imprime quais seriam os candidatos que iriam ao JEV e com que números.
 * NÃO chama o JEV nem o Haiku (custo zero) e NÃO grava nada: só SELECT.
 *
 * Uso:
 *   npx tsx scripts/tmp/impulso-amostra-0910.mts [projectId ...] [--agora=ISO] [--local=arquivo.json] [--analise=arquivo.json]
 *
 * --analise grava, NUM ARQUIVO LOCAL, a análise dos projetos que têm
 * candidatos, para a prova paga (scripts/tmp/impulso-prova-paga-0910.mts)
 * perguntar ao JEV e ao Haiku sem tocar no banco.
 *
 * --local grava, NUM ARQUIVO LOCAL (nunca no banco), um registro de prova para
 * a tela do `next dev` (variável IMPULSOS_LOCAIS): os candidatos como se o JEV
 * tivesse dito sim, com o primeiro motivo que os números permitem, marcados
 * `simulado: true` (a tela mostra o selo "simulação"). Não é decisão do JEV.
 */
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";
import {
  analisarPosts,
  chaveDaConta,
  estadoDoJev,
  fmt,
  leituraDoPostMetric,
  montarSugestao,
  numerosQueSustentam,
  fraseDoCodigo,
  perguntasDoJev,
  postParaImpulso,
  seguidoresDaConta,
  marcaDaEntrada,
  ROTULO_DO_FORMATO,
  type GuardadoDoImpulso,
  type LeituraParaImpulso,
  type LinhaDoPost,
  type PerfilProprio,
  type SeguidoresDaMeta,
  type Seguidores,
} from "@/lib/analytics/tipos-do-impulso";

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
const agora = new Date(args.find((a) => a.startsWith("--agora="))?.slice(8) ?? Date.now());
const arquivoLocal = args.find((a) => a.startsWith("--local="))?.slice(8);
const arquivoDaAnalise = args.find((a) => a.startsWith("--analise="))?.slice(10);
const analises: Record<string, unknown> = {};
const projetos = args.filter((a) => !a.startsWith("--"));
if (!projetos.length) projetos.push("cmtmym5bo000004l80wwvpdd7", "cmu7hmu0j000004jrh2yc5udb", "cmttyyev3000104la5o2r8hbs");

const c = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const local: Record<string, GuardadoDoImpulso> = {};
const r1 = (x: number | null | undefined) => (typeof x === "number" ? fmt(x, Number.isInteger(x) ? 0 : 2) : "-");

for (const projectId of projetos) {
  const nome = (await c.query(`select name from projects where id = $1`, [projectId])).rows[0]?.name ?? "?";
  const desde = new Date(agora.getTime() - 90 * 86400_000);
  const linhas = (
    await c.query(
      `select p.id, p.platform, p."mediaType", p.metadata, p."publishedAt", p."externalUrl", p.content, p."socialAccountId",
              sa."accountType", sa.username, sa."displayName", sa."platformUserId", r.config->>'funnelStage' as funil,
              m.likes, m.comments, m.shares, m.impressions, m."videoViews", m.clicks, m."syncedAt"
         from posts p
         left join social_accounts sa on sa.id = p."socialAccountId"
         left join pipeline_runs r on r.id = p."runId"
         left join post_metrics m on m."postId" = p.id
        where p."projectId" = $1 and p."publishedAt" >= $2 and p."publishedAt" <= $3`,
      [projectId, desde, agora]
    )
  ).rows;
  const leituras: LeituraParaImpulso[] = (
    await c.query(
      `select "postId", fonte, status, "lidoEm", impressoes, alcance, visualizacoes, curtidas, comentarios, compartilhamentos, salvamentos, cliques
         from leituras_de_metrica where "projectId" = $1 and status = 'ok' and "lidoEm" <= $2`,
      [projectId, agora]
    )
  ).rows;
  const comHistorico = new Set((await c.query(`select distinct "postId" from leituras_de_metrica where "projectId" = $1`, [projectId])).rows.map((x) => x.postId));
  for (const l of linhas) if (!comHistorico.has(l.id) && l.syncedAt) leituras.push(leituraDoPostMetric(l.id, l));

  const proprios: PerfilProprio[] = (
    await c.query(`select rede, perfil, seguidores, coalesce("ultimaColeta", "updatedAt") as em from referencias_perfis where "projectId" = $1 and status = 'proprio'`, [projectId])
  ).rows;
  const meta: SeguidoresDaMeta[] = (
    await c.query(
      `select key as chave, (value->'ultima'->'seguidores'->>'valor')::int as valor, value->'ultima'->>'lidoEm' as "lidoEm", value->>'rede' as rede
         from project_memories where "projectId" = $1 and type = 'estatisticas_da_conta' and value->'ultima'->'seguidores' is not null`,
      [projectId]
    )
  ).rows;

  const posts = linhas.map((l) => postParaImpulso(l as LinhaDoPost, leituras));
  const seguidores: Record<string, Seguidores | null> = {};
  for (const l of linhas) {
    const k = chaveDaConta(l.platform, l.socialAccountId);
    if (!(k in seguidores)) seguidores[k] = seguidoresDaConta({ platform: l.platform, platformUserId: l.platformUserId, username: l.username, displayName: l.displayName }, meta, proprios);
  }
  const a = analisarPosts(posts, seguidores, agora);

  console.log(`\n================ ${nome} (${projectId}) em ${agora.toISOString()}`);
  console.log(`posts nos 90 dias: ${posts.length}; leituras ok: ${leituras.length}`);
  for (const b of a.bases) {
    const g24 = b.geral["24"];
    const formatos = Object.entries(b.porFormato)
      .map(([f, m]) => `${f}: ${m!["24"].posts}`)
      .join(", ");
    console.log(
      `  conta ${b.conta} ${b.rotulo ?? ""}: ${b.postsMedidos} posts com 24 h (${formatos}); mediana 24 h interações ${r1(g24.interacoes?.mediana)}, comentários ${r1(g24.comentarios?.mediana)}, visualizações ${r1(g24.visualizacoes?.mediana)}, salv+comp ${r1(g24.salvComp?.mediana)}; 72 h: ${b.geral["72"].posts} posts; seguidores ${b.seguidores ? `${b.seguidores.valor} (${b.seguidores.fonte}, ${b.seguidores.lidoEm.slice(0, 10)})` : "não sabemos"}`
    );
  }
  if (a.aprendendo.length) console.log(`  aprendendo a média: ${a.aprendendo.map((x) => `${x.conta} ${x.rotulo ?? ""} (${x.medidos} de 5)`).join("; ")}`);
  console.log(`  posts na idade de impulsionar com sinais medidos: ${a.medidos.length}; candidatos ao JEV: ${a.candidatos.length}`);
  for (const s of a.medidos) {
    const cand = a.candidatos.includes(s);
    const sin = (n: string, r: { valor: number; mediana: number; razao: number | null } | null) => (r ? `${n} ${r.valor}/${r.mediana}=${r.razao ?? "med0"}` : null);
    console.log(
      `   ${cand ? "[CANDIDATO]" : "[fora]     "} ${s.rede} ${ROTULO_DO_FORMATO[s.formato]} ${Math.round(s.idadeH)} h, leitura ${s.foto.marco} h (${s.foto.fonte} ${s.foto.lidoEm.slice(0, 16)}), base ${s.escopo}: ` +
        [
          sin("interações", s.engajamento),
          sin("comentários", s.comentarios),
          sin("visualizações", s.visualizacoes),
          sin("salv+comp", s.salvComp),
          sin("1º dia", s.velocidade),
          s.crescimento ? `subida ${Math.round(s.crescimento.valor * 100)}% (mediana ${s.crescimento.mediana === null ? "-" : Math.round(s.crescimento.mediana * 100) + "%"})` : null,
          s.taxa ? `taxa ${fmt(s.taxa.valor * 100, 2)}% de ${s.taxa.seguidores.valor}` : null,
        ]
          .filter(Boolean)
          .join("; ") +
        ` | destaques: ${s.destaques.join(",") || "nenhum"} | motivos: ${s.motivos.join(",") || "nenhum"} | pontuação ${s.pontuacao}`
    );
    console.log(`      "${s.titulo.slice(0, 90)}"`);
    if (cand) for (const m of s.motivos) console.log(`      se o JEV escolher "${m}": ${fraseDoCodigo(m, numerosQueSustentam(s, m))}`);
  }
  if (a.candidatos.length) {
    const estado = JSON.stringify(estadoDoJev(a));
    const perguntas = JSON.stringify(perguntasDoJev(a.candidatos));
    // Aproximação de tokens: 4 caracteres por token (o JEV cobra só a entrada).
    const tokens = Math.round((estado.length + perguntas.length) / 4);
    console.log(`  pedido ao JEV: ~${tokens} tokens de entrada (estado ${estado.length} + perguntas ${perguntas.length} caracteres) = US$ ${(tokens * 42e-9).toFixed(6)}`);
  }
  if (arquivoDaAnalise && a.candidatos.length) analises[projectId] = a;
  if (arquivoLocal) {
    local[projectId] = {
      versao: 1,
      calculadoEm: agora.toISOString(),
      estado: a.candidatos.length ? "decidido" : a.aprendendo.length && !a.medidos.length ? "aprendendo" : "sem_candidato",
      marcaDaEntrada: marcaDaEntrada(a.candidatos),
      candidatos: a.candidatos.length,
      aprendendo: a.aprendendo,
      sugestoes: a.candidatos.map((s) => montarSugestao(s, { postId: s.postId, probabilidade: 0, motivo: s.motivos[0], confiancaDoMotivo: 0 }, null)),
      custoUsd: { jev: 0, texto: 0 },
      motivo: "simulação local: sem JEV e sem Haiku",
      simulado: true,
    };
  }
}
if (arquivoLocal) {
  writeFileSync(arquivoLocal, JSON.stringify(local, null, 2));
  console.log(`\nregistro de prova local gravado em ${arquivoLocal} (arquivo, não banco)`);
}
if (arquivoDaAnalise) {
  writeFileSync(arquivoDaAnalise, JSON.stringify(analises, null, 2));
  console.log(`\nanálise de ${Object.keys(analises).length} projeto(s) com candidatos gravada em ${arquivoDaAnalise} (arquivo, não banco)`);
}
await c.end();
