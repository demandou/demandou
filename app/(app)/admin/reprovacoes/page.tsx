export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin/guarda";
import { jevLigado } from "@/lib/jev/cliente";
import { lerAgregadoDeReprovacoes, lerFilaDeReprovacoes } from "@/lib/credits/reprovacao-servidor";
import { NOME_DA_CATEGORIA, classeDaCategoria } from "@/lib/credits/reprovacao";
import type { DadosNoTempo } from "@/lib/admin/tipos-do-painel";
import { NOMES_DAS_REDES } from "@/lib/posts/estado";
import { BarrasHorizontais, Cartao, Dobra, Vazio } from "@/components/admin/painel-graficos";
import { GraficoNoTempo } from "@/components/admin/grafico-no-tempo";
import { ComoCalculamos, dataCurta } from "@/components/admin/contas-pecas";
import { DecidirReprovacao } from "@/components/admin/decidir-reprovacao";

/**
 * AS REPROVAÇÕES COM MOTIVO (decisão do Bruno em 08/10/2026). Duas partes:
 * a FILA (as reprovações que as provas automáticas não confirmaram, com o
 * motivo, a peça, as provas e os dois botões: devolver ou manter) e o
 * AGREGADO (por categoria e por semana), para corrigir o produto. O padrão é
 * o de /admin/perfis. Só admin.
 */
const SEMANAS = 8;
const NOME_DA_SITUACAO = { em_analise: "em análise", devolvido: "devolvido", mantido: "mantido" } as const;

export default async function ReprovacoesPage() {
  if (!(await exigirAdmin())) notFound();
  const [fila, agregado] = await Promise.all([lerFilaDeReprovacoes(), lerAgregadoDeReprovacoes(SEMANAS)]);
  const porSemana: DadosNoTempo = {
    baldes: agregado.agregado.porSemana.map((s) => ({ rotulo: s.rotulo, dica: s.dica })),
    series: [
      { chave: "erro", nome: "Erro apontado", cor: "var(--painel-1)", valores: agregado.agregado.porSemana.map((s) => s.erro) },
      { chave: "gosto", nome: "Gosto ou pedido diferente", cor: "var(--painel-neutro)", valores: agregado.agregado.porSemana.map((s) => s.gosto) },
      { chave: "devolvidos", nome: "Com devolução", cor: "var(--painel-3)", valores: agregado.agregado.porSemana.map((s) => s.devolvidos) },
    ],
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="rotulo mb-1">
              <Link href="/admin" className="hover:underline underline-offset-2">
                Gestão da plataforma
              </Link>
            </p>
            <h1 className="text-[1.75rem] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Reprovações e devoluções
            </h1>
          </div>
          <nav aria-label="Telas de gestão" className="flex flex-wrap items-center gap-2">
            {[
              { href: "/admin", nome: "Painel" },
              { href: "/admin/contas", nome: "Contratos e contas" },
              { href: "/admin/perfis", nome: "Perfis dos clientes" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--realce-2)]" style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}>
                {l.nome}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <ComoCalculamos>
        <p>
          <strong>Toda peça gerada é cobrada.</strong> Ao reprovar, o cliente escolhe o motivo. <strong>Gosto</strong> e <strong>pedi diferente</strong> mantêm o crédito e refazer cobra. Os outros
          são erro da plataforma: o código mede o que é medida (formato, margem, lastro de número e fonte, conteúdo próprio, identidade) e o <strong>JEV decide</strong> o que é leitura, contra as
          provas. Erro confirmado devolve os créditos da peça na hora (uma vez só, nunca mais do que a campanha cobrou) e refazer é grátis.
        </p>
        <p>
          O que as provas não confirmam cai <strong>nesta fila</strong>: o admin olha o motivo, a peça e as provas, e decide devolver ou manter. O cliente recebe a resposta no sino nos dois casos.
          Cada motivo vira registro por projeto (motivos_de_reprovacao) e entra na memória do cliente.
          {!jevLigado() ? " O JEV está desligado neste ambiente: toda reprovação por erro sem medida cai aqui." : ""}
        </p>
      </ComoCalculamos>

      {!fila.pronta ? (
        <Vazio titulo="A tabela dos motivos ainda não existe" texto="Ela nasce no próximo deploy de produção (migração 20261009000000). Até lá a reprovação funciona e a situação fica no card; a fila e o agregado aparecem depois." />
      ) : (
        <>
          <Cartao titulo={`Fila: ${fila.fila.length} para decidir`} subtitulo="As provas automáticas não confirmaram o erro. Devolver manda os créditos da peça de volta e libera um refazer grátis; manter responde ao cliente que o crédito fica.">
            {fila.fila.length === 0 ? (
              <Vazio compacto titulo="Nada para decidir" texto="Toda reprovação por erro foi confirmada ou negada pelas provas." />
            ) : (
              <ul className="space-y-4">
                {fila.fila.map((m) => {
                  const provas = (m.provas ?? null) as Record<string, unknown> | null;
                  return (
                    <li key={m.id} className="rounded-xl border p-4 grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ borderColor: "var(--border)" }}>
                      <div className="lg:col-span-2 space-y-2 min-w-0">
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {dataCurta(m.reprovadaEm)} · {m.peca?.projetoNome ?? m.projectId} · {m.peca?.donoEmail ?? m.userId} · {m.peca ? NOMES_DAS_REDES[m.peca.platform] ?? m.peca.platform : "peça apagada"}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {NOME_DA_CATEGORIA[m.categoria]}
                          {/* O pedido de ajuste do chat (09/10): já foi refeito e cobrado; devolver inclui o ajuste. */}
                          {provas?.origem === "ajuste" && (
                            <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>
                              pedido de ajuste pelo chat, já refeito e cobrado: devolver inclui o que o ajuste cobrou
                            </span>
                          )}
                        </p>
                        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                          {m.texto ? `"${m.texto}"` : "Sem texto do cliente."}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Conferência: {typeof provas?.conferencia === "string" ? provas.conferencia : "sem detalhe"} · custo da peça {m.custoDaPeca} créditos
                        </p>
                        <DecidirReprovacao id={m.id} creditos={m.custoDaPeca} />
                      </div>
                      <div className="lg:col-span-2 min-w-0">
                        <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                          A peça
                        </p>
                        {m.peca?.imageUrl && m.peca.imageUrl.length > 10 && m.peca.mediaType === "video" ? (
                          // O corte e o completo (10/10): o vídeo que está no ar, para o admin conferir o erro apontado.
                          <video src={m.peca.imageUrl} controls preload="metadata" playsInline className="w-full max-h-72 rounded-lg border mb-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }} />
                        ) : m.peca?.imageUrl && m.peca.imageUrl.length > 10 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.peca.imageUrl.split("|")[0]} alt="" className="w-full max-h-56 object-contain rounded-lg border mb-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }} />
                        ) : null}
                        <p className="text-xs whitespace-pre-wrap max-h-56 overflow-y-auto" style={{ color: "var(--text-primary)" }}>
                          {m.peca?.content ?? "(a peça não existe mais)"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                          As provas
                        </p>
                        <pre className="text-[10px] whitespace-pre-wrap break-words max-h-72 overflow-y-auto rounded-lg border p-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)", color: "var(--text-muted)" }}>
                          {provas ? JSON.stringify({ ...provas, texto: undefined }, null, 1) : "sem provas"}
                        </pre>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Cartao>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Cartao titulo={`Por categoria, ${SEMANAS} semanas`} subtitulo={`${agregado.total} reprovação(ões). O que mais se repete é o que corrigir no produto.`}>
              {agregado.agregado.porCategoria.length === 0 ? (
                <Vazio compacto titulo="Nenhuma reprovação ainda" texto="Quando um cliente reprovar com motivo, a contagem aparece aqui." />
              ) : (
                <BarrasHorizontais
                  linhas={agregado.agregado.porCategoria.map((c) => ({
                    nome: c.nome,
                    valor: c.total,
                    cor: classeDaCategoria(c.categoria) === "gosto" ? "var(--painel-neutro)" : "var(--painel-1)",
                    nota: `· ${c.devolvidos} devolvida(s), ${c.mantidos} mantida(s), ${c.emAnalise} em análise · ${c.creditos} créditos devolvidos`,
                  }))}
                />
              )}
            </Cartao>
            <Cartao titulo="Por semana" subtitulo="Reprovações por erro apontado e por gosto, e quantas tiveram devolução.">
              <GraficoNoTempo dados={porSemana} modo="barras" rotulo="Reprovações por semana" altura={200} />
            </Cartao>
          </div>

          <Dobra id="recentes" titulo="As últimas decididas" resumo={`${agregado.recentes.length} nas últimas ${SEMANAS} semanas`}>
            {agregado.recentes.length === 0 ? (
              <Vazio compacto titulo="Nada decidido ainda" texto="As reprovações decididas pelas provas ou pelo admin aparecem aqui." />
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full min-w-[48rem] text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-input)" }}>
                      {["Quando", "Motivo", "Texto", "Situação", "Decidido por", "Créditos"].map((h) => (
                        <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agregado.recentes.map((m) => (
                      <tr key={m.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{dataCurta(m.reprovadaEm)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--text-primary)" }}>{NOME_DA_CATEGORIA[m.categoria]}</td>
                        <td className="px-3 py-2 text-xs max-w-[20rem] truncate" style={{ color: "var(--text-muted)" }}>{m.texto || "sem texto"}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: m.situacao === "devolvido" ? "var(--badge-success-text)" : "var(--text-primary)" }}>{NOME_DA_SITUACAO[m.situacao]}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{m.decididoPor ?? "código"}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{m.creditosDevolvidos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Dobra>
        </>
      )}
    </div>
  );
}
