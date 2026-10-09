export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/admin/guarda";
import { lerCasos, periodoDasContasDaUrl } from "@/lib/admin/contas/leitura";
import { creditosDeUso, mesPorExtenso, nomeDoCaso, NOME_DO_PAPEL } from "@/lib/admin/contas/caso-a-caso";
import { reais, numero } from "@/lib/admin/tipos-do-painel";
import { cotacao, dolares } from "@/lib/admin/tipos-do-uso-de-ia";
import { NOME_DO_MOTIVO_FORA } from "@/lib/admin/regra-da-receita";
import { centavosEmReais } from "@/lib/contratos/situacao";
import { BarrasHorizontais, Cartao, Dobra, Vazio } from "@/components/admin/painel-graficos";
import { ComoCalculamos, MarcaDaContaNaTela, NumeroComConta, SeletorDoPeriodo, custoPorRealNaTela, dataCurta } from "@/components/admin/contas-pecas";
import { DesligarConta, LigarConta, type ContaParaLigar } from "@/components/admin/contas-do-contrato";

/**
 * UM CASO, por dentro (08/10/2026): o contrato e a titular, o que foi pago de
 * fato, o time inteiro com o uso de cada pessoa, e o drill down da pessoa
 * para o uso por mês e por tipo de operação. Aqui também o admin LIGA uma
 * conta própria ao contrato (o time da SEED: o Ygor e o Vitor), e desliga.
 * Ligada, a conta passa a usar o saldo do contrato (lib/equipe/conta.ts).
 *
 * Quem abre o id de uma conta que é do time de outro caso cai no caso certo.
 */
export default async function CasoPage({ params, searchParams }: { params: Promise<{ titularId: string }>; searchParams: Promise<{ periodo?: string }> }) {
  if (!(await exigirAdmin())) notFound();
  const { titularId } = await params;
  const sp = await searchParams;
  const periodo = periodoDasContasDaUrl(sp.periodo);
  const { base, resultado } = await lerCasos(periodo, new Date());
  const dolar = base.entrada.dolar;

  const caso = resultado.casos.find((c) => c.titularId === titularId);
  if (!caso) {
    const dono = resultado.casos.find((c) => c.pessoas.some((p) => p.id === titularId));
    if (dono) redirect(`/admin/contas/${dono.titularId}?periodo=${periodo}#pessoa-${titularId}`);
    const existe = base.entrada.contas.find((c) => c.id === titularId);
    if (!existe) notFound();
  }

  // As contas que podem entrar no time deste contrato: fora de qualquer caso
  // com contrato, sem time próprio e sem estar no time de outro caso.
  const emAlgumTime = new Set(resultado.casos.flatMap((c) => c.pessoas.filter((p) => p.papel !== "titular").map((p) => p.id)));
  const titularesComTime = new Set(resultado.casos.filter((c) => c.tipo === "contrato" || c.pessoas.length > 1).map((c) => c.titularId));
  const elegiveis: ContaParaLigar[] = base.entrada.contas
    .filter((c) => c.id !== titularId && !emAlgumTime.has(c.id) && !titularesComTime.has(c.id))
    .sort((a, b) => a.email.localeCompare(b.email))
    .map((c) => ({ id: c.id, email: c.email, nome: c.nome, plano: c.plano }));

  if (!caso) {
    const conta = base.entrada.contas.find((c) => c.id === titularId)!;
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6">
        <p className="rotulo">
          <Link href={`/admin/contas?periodo=${periodo}`} className="hover:underline underline-offset-2">
            Contratos e contas
          </Link>
        </p>
        <Vazio titulo={`${conta.nome ?? conta.email} não é um caso`} texto="Esta conta não tem contrato, plano nem contas ligadas a ela. Ela aparece aqui quando tiver um dos três." />
      </div>
    );
  }

  const principal = caso.contratoPrincipal;
  const ligadas = caso.pessoas.filter((p) => p.papel === "ligada");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1300px] mx-auto space-y-6">
      <header className="space-y-3">
        <p className="rotulo">
          <Link href={`/admin/contas?periodo=${periodo}`} className="hover:underline underline-offset-2">
            Contratos e contas
          </Link>
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.6rem] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {nomeDoCaso(caso)}
            </h1>
            <p className="text-sm mt-1 flex flex-wrap items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span>
                Titular: {caso.titular.nome ? `${caso.titular.nome} · ` : ""}
                {caso.titular.email}
              </span>
              <MarcaDaContaNaTela marca={caso.titular.marca} />
              {caso.signatario && (
                <span>
                  · assina {caso.signatario.nome ?? ""} {caso.signatario.email ? `(${caso.signatario.email})` : ""}
                </span>
              )}
            </p>
          </div>
          {caso.contratos.length > 0 && (
            <Link
              href={`/admin/contratos/${caso.titularId}`}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--realce-2)]"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
            >
              Ficha no gestor de contratos
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <SeletorDoPeriodo atual={periodo} base={`/admin/contas/${caso.titularId}`} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Período: {base.rotuloDoPeriodo}. Dólar a R$ {cotacao(dolar)}.
          </p>
        </div>
      </header>

      {caso.alertas.length > 0 && (
        <ul className="rounded-xl border px-4 py-2 space-y-1" style={{ borderColor: "var(--badge-warning-text)", background: "var(--bg-elevated)" }}>
          {caso.alertas.map((a) => (
            <li key={a} className="text-xs font-medium" style={{ color: "var(--badge-warning-text)" }}>
              {a}
            </li>
          ))}
        </ul>
      )}

      <section aria-label="Resumo do caso" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <NumeroComConta
          rotulo="Pago de fato"
          valor={reais(caso.receitaReais, 2)}
          cor={caso.receitaReais > 0 ? "var(--badge-success-text)" : undefined}
          nota={caso.motivoSemReceita ? `sem receita: ${caso.motivoSemReceita}` : `desde sempre ${reais(caso.receitaDesdeSempreReais, 2)}`}
          conta="Pagamentos confirmados das contas do caso no período: cartão pago no Stripe e Pix, boleto ou transferência com comprovante."
        />
        <NumeroComConta
          rotulo="Contratado"
          valor={principal ? reais(caso.contratadoReais) : "sem contrato"}
          nota={principal ? `nº ${principal.numero} · ${principal.situacaoNome} · projeção, não é receita` : `plano ${caso.plano}`}
          conta="Valor do contrato principal (o mais recente não cancelado). Só vira receita quando o pagamento é confirmado."
        />
        <NumeroComConta
          rotulo="Custo real de IA do time"
          valor={reais(caso.uso.custoReais, 2)}
          nota={`${dolares(caso.uso.custoUsd)} em ${numero(caso.uso.chamadasDeIa)} chamada(s)`}
          conta="Registro de uso dos fornecedores nos projetos das pessoas do caso, em dólar, convertido pelo dólar do ambiente."
        />
        <NumeroComConta
          rotulo="Margem"
          valor={reais(caso.margemReais, 2)}
          cor={caso.margemReais < 0 ? "var(--badge-danger-text)" : "var(--badge-success-text)"}
          nota={custoPorRealNaTela(caso.custoPorReal)}
          conta="Pago de fato menos custo de IA, no período. O custo por real é o custo dividido pelo pago."
        />
        <NumeroComConta
          rotulo="Créditos do time"
          valor={numero(caso.uso.creditos)}
          nota={caso.uso.creditosQueCustariam > 0 ? `+${numero(caso.uso.creditosQueCustariam)} simulados (admin)` : "debitados, líquidos de estorno"}
          conta="Extrato pela pessoa que fez, sem recarga. Conta de admin debita zero e registra quanto custaria."
        />
        <NumeroComConta
          rotulo="Vídeo"
          valor={`${numero(Math.round(caso.uso.minutos))} min`}
          nota={`${caso.uso.gravacoes} gravação(ões) enviada(s)`}
          conta="Gravações enviadas pelas pessoas do caso no período e a duração somada."
        />
        <NumeroComConta
          rotulo="Posts e peças"
          valor={numero(caso.uso.postsGerados)}
          nota={`${caso.uso.postsPublicados} publicado(s)`}
          conta="Peças geradas nos projetos das pessoas do caso, e as que foram ao ar."
        />
        <NumeroComConta rotulo="Último acesso do time" valor={dataCurta(caso.ultimoAcesso)} conta="A sessão mais recente de qualquer pessoa do caso." />
      </section>

      <Cartao titulo="Contratos desta titular" subtitulo="Do mais novo ao mais antigo. O registrado no gestor inclui pagamento sem comprovante, que não é receita.">
        {caso.contratos.length === 0 ? (
          <Vazio compacto titulo="Sem contrato" texto="Esta conta é um caso porque tem plano ou contas ligadas. O contrato aparece aqui quando for criado no gestor." />
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr style={{ background: "var(--bg-input)" }}>
                  {["Nº", "Situação", "Plano", "Valor", "Registrado no gestor", "Assinado", "Pago", "Vigência", "Empresa"].map((h) => (
                    <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caso.contratos.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {c.numero}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.situacaoNome}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.planoNome}
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                      {centavosEmReais(c.valorCentavos)}
                      {c.descontoPercentual > 0 ? ` (${Math.round(c.descontoPercentual)}% de desconto)` : ""}
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {centavosEmReais(c.registradoCentavos)}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {c.assinadoEm ? dataCurta(c.assinadoEm) : "não"}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {c.pagoEm ? dataCurta(c.pagoEm) : "não"}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {c.inicio && c.fim ? `${dataCurta(c.inicio)} a ${dataCurta(c.fim)}` : "sem vigência"}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.empresa ?? "sem dado"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      <Cartao titulo="O que foi pago" subtitulo="Só pagamento confirmado entra. O que foi pago ou registrado e ficou fora aparece embaixo, com o motivo.">
        {caso.pagamentos.length === 0 ? (
          <Vazio compacto titulo="Nenhum pagamento confirmado no período" texto={caso.motivoSemReceita ? `Sem receita: ${caso.motivoSemReceita}.` : "O pagamento aparece aqui quando o cartão for cobrado ou o comprovante for aceito."} />
        ) : (
          <ul className="space-y-1">
            {caso.pagamentos.map((p) => (
              <li key={p.id} className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {dataCurta(p.quando)} · <strong style={{ color: "var(--badge-success-text)" }}>{reais(p.reais, 2)}</strong> · {p.forma} · {p.descricao}
              </li>
            ))}
          </ul>
        )}
        {caso.fora.length > 0 && (
          <div className="mt-3">
            <p className="rotulo mb-1">Fora da receita, de propósito</p>
            <ul className="space-y-0.5">
              {caso.fora.map((f, i) => (
                <li key={i} className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {dataCurta(f.quando)} · {f.conta} · {reais(f.reais, 2)} · {NOME_DO_MOTIVO_FORA[f.motivo]} ({f.descricao})
                </li>
              ))}
            </ul>
          </div>
        )}
      </Cartao>

      <Cartao
        titulo="O time e o uso de cada pessoa"
        subtitulo="Titular, membros da equipe da conta e contas próprias ligadas ao contrato. Clique numa pessoa (abaixo) para ver o uso por mês e por tipo de operação."
      >
        {caso.pessoas.some((p) => creditosDeUso(p.uso) > 0) && (
          <div className="mb-4">
            <BarrasHorizontais
              linhas={caso.pessoas.map((p) => ({ nome: p.nome ?? p.email, valor: creditosDeUso(p.uso), nota: `créditos · ${reais(p.uso.custoReais, 2)} de IA` }))}
            />
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full min-w-[60rem] text-sm">
            <thead>
              <tr style={{ background: "var(--bg-input)" }}>
                {["Pessoa", "Papel", "Créditos", "Custo de IA", "Vídeo", "Posts", "Projetos", "Último acesso"].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caso.pessoas.map((p) => (
                <tr key={p.id} className="border-t align-top" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">
                    <a href={`#pessoa-${p.id}`} className="hover:underline underline-offset-2" style={{ color: "var(--text-primary)" }}>
                      {p.nome ?? p.email}
                    </a>
                    <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                      {p.email}
                    </span>
                    <span className="mt-1 block">
                      <MarcaDaContaNaTela marca={p.marca} />
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {NOME_DO_PAPEL[p.papel]}
                    {p.statusNaEquipe === "removido" ? " (removido)" : ""}
                    {p.ligacao && (
                      <span className="block text-[11px]">
                        ligada por {p.ligacao.definidoPor ?? "sem registro"} em {dataCurta(p.ligacao.criadoEm)}
                        {p.ligacao.observacao ? ` · ${p.ligacao.observacao}` : ""}
                      </span>
                    )}
                    {p.papel === "ligada" && (
                      <span className="mt-1 block">
                        <DesligarConta userId={p.id} email={p.email} />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                    {numero(p.uso.creditos)}
                    {p.uso.creditosQueCustariam > 0 && <span className="block" style={{ color: "var(--text-muted)" }}>+{numero(p.uso.creditosQueCustariam)} simulados</span>}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }} title={`${dolares(p.uso.custoUsd)} a R$ ${cotacao(dolar)}`}>
                    {p.projetos.length === 0 && p.uso.custoReais === 0 ? "no projeto do dono" : reais(p.uso.custoReais, 2)}
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {p.uso.gravacoes} · {numero(Math.round(p.uso.minutos))} min
                  </td>
                  <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {p.uso.postsGerados} · {p.uso.postsPublicados} publicados
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {p.projetos.length ? p.projetos.map((x) => x.nome).join(", ") : "nenhum próprio"}
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {dataCurta(p.ultimoAcesso)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
          O custo de IA é registrado por projeto e cai no dono do projeto: o membro da equipe que trabalha no projeto do dono aparece com &quot;no projeto do dono&quot;, sem rateio.
        </p>
      </Cartao>

      {caso.pessoas.map((p) => (
        <Dobra
          key={p.id}
          id={`pessoa-${p.id}`}
          titulo={`${p.nome ?? p.email}: uso por mês e por tipo de operação`}
          resumo={`${numero(creditosDeUso(p.uso))} créditos · ${reais(p.uso.custoReais, 2)} de IA · ${p.uso.gravacoes} gravação(ões), ${numero(Math.round(p.uso.minutos))} min · ${p.uso.postsGerados} posts`}
        >
          <Cartao titulo="Por mês" subtitulo="Mês de São Paulo. Só os meses com algum uso no período.">
            {p.porMes.length === 0 ? (
              <Vazio compacto titulo="Sem uso no período" texto="Nenhum crédito, custo de IA, gravação ou post desta pessoa no período escolhido." />
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-input)" }}>
                      {["Mês", "Créditos", "Custo de IA", "Gravações", "Minutos", "Posts gerados", "Publicados"].map((h) => (
                        <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.porMes.map((m) => (
                      <tr key={m.mes} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--text-primary)" }}>
                          {mesPorExtenso(m.mes)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {numero(m.creditos)}
                          {m.creditosQueCustariam > 0 ? ` (+${numero(m.creditosQueCustariam)} simulados)` : ""}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }} title={dolares(m.custoUsd)}>
                          {reais(m.custoReais, 2)}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {m.gravacoes}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {numero(Math.round(m.minutos))}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {m.postsGerados}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {m.postsPublicados}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Cartao>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Cartao titulo="Créditos por operação" subtitulo="O nome da operação como o extrato grava, líquido de estorno.">
              {p.creditosPorOperacao.length === 0 ? (
                <Vazio compacto titulo="Sem crédito no período" texto="Cada campanha, refação e etapa de vídeo cobrada aparece aqui." />
              ) : (
                <BarrasHorizontais
                  linhas={p.creditosPorOperacao.map((o) => ({
                    nome: o.operacao,
                    valor: o.creditos + o.custariam,
                    nota: `${o.custariam > 0 ? `(${numero(o.custariam)} simulados) ` : ""}· ${o.lancamentos} lançamento(s)`,
                  }))}
                />
              )}
            </Cartao>
            <Cartao titulo="Custo de IA por tipo" subtitulo={`Pelos projetos de que a pessoa é dona, em reais a R$ ${cotacao(dolar)}.`}>
              {p.custoPorFamilia.length === 0 ? (
                <Vazio compacto titulo="Sem custo de IA no período" texto={p.projetos.length ? "Nenhuma chamada de IA nos projetos desta pessoa no período." : "Esta pessoa não é dona de projeto: o custo do que ela faz fica no projeto do dono."} />
              ) : (
                <BarrasHorizontais
                  cor="var(--painel-2)"
                  formatar={(n) => reais(n, 2)}
                  linhas={p.custoPorFamilia.map((f) => ({ nome: f.nome, valor: f.reais, nota: `· ${dolares(f.usd)} · ${numero(f.chamadas)} chamada(s)` }))}
                />
              )}
            </Cartao>
          </div>
        </Dobra>
      ))}

      <Cartao
        titulo="Ligar uma conta a este contrato"
        subtitulo="Para o time que usa com conta própria (não por convite de equipe). Ligada, a conta passa a gastar o saldo deste contrato, com um projeto por pessoa; o saldo próprio dela fica parado enquanto estiver ligada."
      >
        <LigarConta titularId={caso.titularId} contas={elegiveis} pronta={base.vinculosProntos} />
        {ligadas.length > 0 && (
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Ligadas agora: {ligadas.map((l) => l.email).join(", ")}.
          </p>
        )}
      </Cartao>

      <ComoCalculamos>
        <p>
          <strong>Pago de fato</strong>: cartão pago e concluído no Stripe (líquido de devolução) e Pix, boleto ou transferência com comprovante, das contas deste caso. Conta
          da equipe nunca gera receita. Valor de contrato e registro sem comprovante não entram.
        </p>
        <p>
          <strong>Créditos</strong>: o extrato pela pessoa que fez (quando a conta ligada ou o membro gasta, o débito sai do saldo da titular com o nome dela). A conta de
          admin debita zero e registra quanto custaria, que aparece como simulado.
        </p>
        <p>
          <strong>Custo de IA</strong>: ai_usage pelos projetos de que a pessoa é dona, em dólar a R$ {cotacao(dolar)}. <strong>Vídeo</strong>: gravações que a pessoa
          enviou. <strong>Posts</strong>: peças geradas nos projetos dela. <strong>Período</strong>: {base.rotuloDoPeriodo}.
        </p>
        <p>
          Sem dado, a tela mostra &quot;sem dado&quot;: nenhum número aqui é estimado ou rateado. Valor contratado: {principal ? centavosEmReais(principal.valorCentavos) : "sem contrato"}{" "}
          (projeção).
        </p>
      </ComoCalculamos>
    </div>
  );
}
