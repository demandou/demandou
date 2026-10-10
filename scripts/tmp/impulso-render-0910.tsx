/**
 * A TELA DO AGENTE DE TRÁFEGO RENDERIZADA NO SERVIDOR (09/10/2026), sem banco
 * e sem rede: o bloco da primeira tela e o selo do card, com o caso sintético
 * (decisão fixa, rotulada), em HTML num arquivo. Prova que os componentes
 * montam e mostram fonte, data, motivo, os dois números, a sugestão rotulada
 * e o X. A tela logada de verdade fica para o next dev (ver HANDOFF).
 *
 *   npx tsx scripts/tmp/impulso-render-0910.tsx [saida.html]
 */
import { writeFileSync } from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import { analisarPosts, impulsosNaTela, montarSugestao, postParaImpulso, type LinhaDoPost, type LeituraParaImpulso } from "@/lib/analytics/tipos-do-impulso";

// O tsx compila JSX no modo clássico (React.createElement): o React vai para o
// escopo global antes de carregar os componentes, que não o importam.
(globalThis as unknown as { React: typeof React }).React = React;

async function main() {
const { BlocoDeImpulso, SeloDeImpulso } = await import("@/components/analytics/impulso");
const agora = new Date();
const H = 3600_000;
let n = 0;
const post = (idadeH: number, leituras: Array<{ h: number; curtidas: number; comentarios: number }>) => {
  const id = `sintetico${++n}`;
  const pub = new Date(agora.getTime() - idadeH * H);
  const l: LinhaDoPost = { id, platform: "instagram", mediaType: "carousel", metadata: { formato: "carousel" }, publishedAt: pub, externalUrl: `https://www.instagram.com/p/${id}/`, content: `Três erros que travam o seu atendimento (post ${n})`, socialAccountId: "conta", accountType: "personal", username: "exemplo", displayName: "Exemplo", funil: null };
  const lei: LeituraParaImpulso[] = leituras.map((x) => ({ postId: id, fonte: "api:instagram", status: "ok", lidoEm: new Date(pub.getTime() + x.h * H), curtidas: x.curtidas, comentarios: x.comentarios }));
  return postParaImpulso(l, lei);
};
const comuns = [[9, 1], [10, 2], [7, 1], [10, 1], [7, 2], [9, 1]].map(([c, k], i) => post(240 + i * 72, [{ h: 24.2, curtidas: c, comentarios: k }]));
const a = analisarPosts([...comuns, post(50, [{ h: 24.4, curtidas: 25, comentarios: 6 }])], { "instagram:conta": { valor: 1000, fonte: "apify:instagram", lidoEm: agora.toISOString() } }, agora);
const c = a.candidatos[0];
const s = montarSugestao(c, { postId: c.postId, probabilidade: 0.9, motivo: "conversa", confiancaDoMotivo: 0.8 }, null);
const tela = impulsosNaTela({ versao: 1, calculadoEm: agora.toISOString(), estado: "decidido", marcaDaEntrada: "", candidatos: 1, aprendendo: [], sugestoes: [s], custoUsd: { jev: 0, texto: 0 }, motivo: null, simulado: true }, agora);
const aprendendo = impulsosNaTela({ versao: 1, calculadoEm: agora.toISOString(), estado: "aprendendo", marcaDaEntrada: "", candidatos: 0, aprendendo: [{ conta: "instagram:x", rede: "instagram", rotulo: "@prdonaire", medidos: 3 }], sugestoes: [], custoUsd: { jev: 0, texto: 0 }, motivo: null }, agora);

const html = [
  renderToString(<BlocoDeImpulso projectId="p" impulsos={tela} />),
  renderToString(<SeloDeImpulso s={s} />),
  renderToString(<BlocoDeImpulso projectId="p" impulsos={aprendendo} />),
].join("\n<hr/>\n");
const saida = process.argv[2];
if (saida) writeFileSync(saida, `<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;max-width:900px;margin:24px auto">${html}</body>`);
const texto = html.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, " ");
console.log(texto);
}

void main();
