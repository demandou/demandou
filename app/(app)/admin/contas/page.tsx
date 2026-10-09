export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin/guarda";
import { lerCasos, periodoDasContasDaUrl } from "@/lib/admin/contas/leitura";
import { creditosDeUso, nomeDoCaso } from "@/lib/admin/contas/caso-a-caso";
import { reais, numero } from "@/lib/admin/tipos-do-painel";
import { cotacao, dolares } from "@/lib/admin/tipos-do-uso-de-ia";
import { NOME_DO_MOTIVO_FORA } from "@/lib/admin/regra-da-receita";
import { BarrasHorizontais, Cartao, Dobra, Vazio } from "@/components/admin/painel-graficos";
import { ComoCalculamos, MarcaDaContaNaTela, NumeroComConta, SeletorDoPeriodo, custoPorRealNaTela, dataCurta } from "@/components/admin/contas-pecas";

/**
 * CONTRATOS E CONTAS, CASO A CASO (08/10/2026). Pedido do Bruno: "como eu sei
 * que o contrato é do Matheus, ele pagou X, e ele e o time dele usaram Y".
 *
 * Um caso por contrato (a conta titular e o time dela) e por conta com plano
 * sem contrato. Cada linha diz o que foi contratado (projeção), o que foi
 * PAGO de fato (só pagamento confirmado), o custo real de IA do time, a
 * margem e o custo por real recebido; o ranking ordena do melhor para o pior,
 * e o clique abre o caso (/admin/contas/[titularId]), que abre a pessoa, que
 * abre o uso por mês e por tipo de operação. As regras moram em
 * lib/admin/contas/caso-a-caso.ts. Só admin; quem não é recebe 404.
 */
export default async function ContasPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  if (!(await exigirAdmin())) notFound();
  const sp = await searchParams;
  const periodo = periodoDasContasDaUrl(sp.periodo);
  const agora = new Date();
  const { base, resultado } = await lerCasos(periodo, agora);
  const { ranking, usuarios, totais } = resultado;
  const dolar = base.entrada.dolar;
  const contratadoEmAberto = resultado.casos.filter((c) => c.semReceita).reduce((s, c) => s + c.contratadoReais, 0);
  const foraNoPeriodo = base.receita.fora.filter((f) => new Date(f.quando) >= base.entrada.desde);
  const maisUsam = usuarios.slice(0, 5);
  const menosUsam = [...usuarios].reverse().slice(0, 5);

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
              Contratos e contas, caso a caso
            </h1>
          </div>
          <nav aria-label="Telas de gestão" className="flex flex-wrap items-center gap-2">
            {[
              { href: "/admin", nome: "Painel" },
              { href: "/admin/contratos", nome: "Gestor de contratos" },
              { href: "/admin/perfis", nome: "Perfis dos clientes" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--realce-2)]"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
              >
                {l.nome}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <SeletorDoPeriodo atual={periodo} base="/admin/contas" />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Período: {base.rotuloDoPeriodo}. Horário de São Paulo; dólar a R$ {cotacao(dolar)} (fixo do ambiente, DOLAR_PARA_REAL).
          </p>
        </div>
      </header>

      {!base.receita.leuStripe && (
        <p className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: "var(--badge-danger-text)", color: "var(--badge-danger-text)", background: "var(--bg-elevated)" }}>
          Não consegui ler o Stripe: o pago por cartão está desconhecido, e os números abaixo só têm o que entrou por fora com comprovante.
        </p>
      )}
      {!base.vinculosProntos && (
        <p className="rounded-xl border px-4 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
          As contas ligadas a um contrato ainda não existem neste banco (a tabela nasce no próximo deploy de produção). Até lá, o time de cada contrato é só a equipe da conta.
        </p>
      )}

      <section aria-label="Resumo" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <NumeroComConta
          rotulo="Pago de fato"
          valor={reais(totais.receitaReais, 2)}
          nota={`${resultado.casos.filter((c) => !c.semReceita).length} caso(s) com pagamento confirmado`}
          conta="Soma dos pagamentos confirmados no período: cartão pago no Stripe (líquido de devolução) e Pix, boleto ou transferência com comprovante. Conta da equipe fica fora."
        />
        <NumeroComConta
          rotulo="Custo real de IA"
          valor={reais(totais.custoReais, 2)}
          nota={`${dolares(totais.custoUsd)} a R$ ${cotacao(dolar)}`}
          conta="Soma do registro de uso dos fornecedores (ai_usage) nos projetos das contas dos casos, em dólar, convertida pelo dólar do ambiente. Sem infraestrutura nem imposto."
        />
        <NumeroComConta
          rotulo="Margem"
          valor={reais(totais.margemReais, 2)}
          cor={totais.margemReais < 0 ? "var(--badge-danger-text)" : "var(--badge-success-text)"}
          nota={totais.receitaReais > 0 ? `${Math.round((totais.margemReais / totais.receitaReais) * 100)}% do pago` : "sem receita no período"}
          conta="Pago de fato menos custo real de IA, no período."
        />
        <NumeroComConta
          rotulo="Contratado sem pagamento"
          valor={reais(contratadoEmAberto)}
          nota="projeção, não é receita"
          conta="Valor dos contratos (não cancelados) dos casos que não têm pagamento confirmado no período. Contrato enviado, em rascunho ou assinado sem pagamento não é receita."
        />
        <NumeroComConta
          rotulo="Casos"
          valor={String(totais.casos)}
          nota={`${totais.contratos} contrato(s) · ${totais.pessoas} pessoa(s) · ${totais.semReceita} sem receita`}
          conta="Um caso por conta titular de contrato, mais um por conta com plano que não tem contrato nem está no time de outro caso."
        />
      </section>

      <ComoCalculamos>
        <p>
          <strong>Pago de fato</strong> é só pagamento confirmado: cartão pago e concluído no Stripe (líquido de devolução) e Pix, boleto ou transferência registrados no
          gestor COM comprovante. Valor de contrato, valor registrado sem comprovante, mensalidade de tabela e plano liberado não entram. Conta da equipe (admin, marcada
          como da equipe ou e-mail @demandou.com) nunca gera receita.
        </p>
        <p>
          <strong>O time de um contrato</strong> é a conta titular, os membros da equipe dela (acesso de equipe) e as contas próprias que o admin ligou ao contrato na tela
          do caso. Nada é ligado por palpite.
        </p>
        <p>
          <strong>Custo de IA</strong> vem do registro de uso de cada chamada (ai_usage), pelo DONO do projeto, em dólar a R$ {cotacao(dolar)}. O registro não guarda
          quem clicou: o membro que trabalha no projeto do dono aparece com custo zero, e o custo fica no dono.
        </p>
        <p>
          <strong>Créditos</strong> são o extrato pela pessoa que fez (líquido de estorno, sem recarga). Conta de admin debita zero e registra quanto custaria; esse
          número aparece como &quot;simulados&quot; e entra no ranking de uso. <strong>Vídeo</strong> é a gravação enviada (quem enviou) e a duração dela.
          <strong> Posts</strong> são as peças geradas nos projetos da pessoa (e as publicadas). <strong>Último acesso</strong> é a sessão mais recente.
        </p>
        <p>
          <strong>Margem</strong> = pago de fato menos custo de IA. <strong>Custo por real</strong> = custo de IA dividido pelo pago de fato (sem pagamento, &quot;sem
          receita&quot;). O ranking ordena pela margem; empate, pelo menor custo.
        </p>
      </ComoCalculamos>

      <Cartao titulo="Ranking dos contratos e contas" subtitulo={`Do melhor para o pior pela margem do período (${base.rotuloDoPeriodo}). Clique no caso para abrir o time e o uso de cada pessoa.`}>
        {ranking.length === 0 ? (
          <Vazio titulo="Nenhum caso ainda" texto="Um caso nasce com o primeiro contrato, ou com a primeira conta com plano." />
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full min-w-[72rem] text-sm">
              <thead>
                <tr style={{ background: "var(--bg-input)" }}>
                  {["#", "Caso", "Contrato", "Contratado", "Pago de fato", "Custo de IA", "Margem", "Custo por real", "Time", "Créditos", "Vídeo", "Posts", "Último acesso"].map((h) => (
                    <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.map((c, i) => {
                  const posicao = ranking.length > 1 && i === 0 ? "melhor" : ranking.length > 1 && i === ranking.length - 1 ? "pior" : null;
                  return (
                    <tr key={c.titularId} className="border-t align-top" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {i + 1}
                        {posicao && (
                          <span className="block text-[10px] font-semibold" style={{ color: posicao === "melhor" ? "var(--badge-success-text)" : "var(--badge-danger-text)" }}>
                            {posicao}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 min-w-[14rem]">
                        <Link href={`/admin/contas/${c.titularId}?periodo=${periodo}`} className="font-medium hover:underline underline-offset-2" style={{ color: "var(--text-primary)" }}>
                          {nomeDoCaso(c)}
                        </Link>
                        <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                          {c.titular.email}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <MarcaDaContaNaTela marca={c.titular.marca} />
                        </span>
                        {c.motivoSemReceita && (
                          <span className="block text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                            Sem receita: {c.motivoSemReceita}.
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {c.contratoPrincipal ? (
                          <>
                            <span style={{ color: "var(--text-primary)" }}>nº {c.contratoPrincipal.numero}</span> · {c.contratoPrincipal.situacaoNome}
                            <br />
                            {c.plano}
                            {c.contratos.length > 1 ? ` · ${c.contratos.length} contratos` : ""}
                          </>
                        ) : (
                          <>sem contrato · plano {c.plano}</>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }} title="Valor do contrato principal: projeção, não é receita.">
                        {c.contratoPrincipal ? reais(c.contratadoReais) : "sem contrato"}
                      </td>
                      <td
                        className="px-3 py-2 text-xs tabular-nums whitespace-nowrap font-medium"
                        style={{ color: c.receitaReais > 0 ? "var(--badge-success-text)" : "var(--text-muted)" }}
                        title={`No período: ${reais(c.receitaReais, 2)}. Desde sempre: ${reais(c.receitaDesdeSempreReais, 2)}. Registrado no gestor (com e sem comprovante): ${reais(c.registradoReais, 2)}.`}
                      >
                        {reais(c.receitaReais, 2)}
                        <span className="block font-normal" style={{ color: "var(--text-muted)" }}>
                          desde sempre {reais(c.receitaDesdeSempreReais, 2)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-primary)" }} title={`${dolares(c.uso.custoUsd)} em ${numero(c.uso.chamadasDeIa)} chamada(s), a R$ ${cotacao(dolar)}`}>
                        {reais(c.uso.custoReais, 2)}
                      </td>
                      <td
                        className="px-3 py-2 text-xs tabular-nums whitespace-nowrap font-medium"
                        style={{ color: c.margemReais < 0 ? "var(--badge-danger-text)" : "var(--badge-success-text)" }}
                        title="Pago de fato menos custo de IA, no período."
                      >
                        {reais(c.margemReais, 2)}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }} title="Custo de IA dividido pelo pago de fato.">
                        {custoPorRealNaTela(c.custoPorReal)}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {c.pessoas.length} pessoa(s)
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }} title="Debitados (plano e vídeo) e, à parte, os simulados da conta de admin.">
                        {numero(c.uso.creditos)}
                        {c.uso.creditosQueCustariam > 0 && <span className="block">+{numero(c.uso.creditosQueCustariam)} simulados</span>}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {c.uso.gravacoes} gravação(ões)
                        <span className="block">{numero(Math.round(c.uso.minutos))} min</span>
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {c.uso.postsGerados} gerados
                        <span className="block">{c.uso.postsPublicados} publicados</span>
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {dataCurta(c.ultimoAcesso)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Cartao>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Cartao titulo="Custo de IA por caso" subtitulo="Em reais, no período. O número ao lado é o pago de fato do mesmo caso.">
          {ranking.some((c) => c.uso.custoReais > 0) ? (
            <BarrasHorizontais
              cor="var(--painel-2)"
              formatar={(n) => reais(n, 2)}
              linhas={[...ranking]
                .sort((a, b) => b.uso.custoReais - a.uso.custoReais)
                .slice(0, 12)
                .map((c) => ({ nome: nomeDoCaso(c), valor: c.uso.custoReais, nota: `· pago ${reais(c.receitaReais, 2)}` }))}
            />
          ) : (
            <Vazio compacto titulo="Nenhum custo de IA no período" texto="Cada campanha, peça e vídeo gerado nos projetos das contas aparece aqui." />
          )}
        </Cartao>
        <Cartao titulo="Créditos por pessoa" subtitulo="Debitados mais os simulados da conta de admin, no período.">
          {usuarios.some((u) => creditosDeUso(u.uso) > 0) ? (
            <BarrasHorizontais
              linhas={usuarios
                .filter((u) => creditosDeUso(u.uso) > 0)
                .slice(0, 12)
                .map((u) => ({ nome: u.nome ?? u.email, valor: creditosDeUso(u.uso), nota: `· ${u.caso}` }))}
            />
          ) : (
            <Vazio compacto titulo="Nenhum crédito usado no período" texto="O extrato de cada pessoa entra aqui, de quem mais usa para quem menos usa." />
          )}
        </Cartao>
      </div>

      <Cartao titulo="Quem usa mais e quem usa menos" subtitulo="Todas as pessoas dos casos, pelo uso de créditos no período; empate, pelo custo de IA e pelos minutos de vídeo.">
        {usuarios.length === 0 ? (
          <Vazio titulo="Ninguém nos casos ainda" texto="As pessoas aparecem quando existe contrato ou conta com plano." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                { titulo: "Mais usam", lista: maisUsam },
                { titulo: "Menos usam", lista: menosUsam },
              ].map((b) => (
                <div key={b.titulo}>
                  <p className="rotulo mb-1">{b.titulo}</p>
                  <ol className="space-y-1">
                    {b.lista.map((u) => (
                      <li key={`${b.titulo}-${u.pessoaId}`} className="text-xs flex flex-wrap items-baseline gap-x-2" style={{ color: "var(--text-muted)" }}>
                        <Link href={`/admin/contas/${u.titularId}?periodo=${periodo}#pessoa-${u.pessoaId}`} className="font-medium hover:underline underline-offset-2" style={{ color: "var(--text-primary)" }}>
                          {u.nome ?? u.email}
                        </Link>
                        <span>{u.caso}</span>
                        <span className="tabular-nums">
                          {numero(creditosDeUso(u.uso))} créditos · {reais(u.uso.custoReais, 2)} de IA · {numero(Math.round(u.uso.minutos))} min · acesso {dataCurta(u.ultimoAcesso)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full min-w-[56rem] text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-input)" }}>
                    {["Pessoa", "Caso", "Créditos", "Custo de IA", "Vídeo", "Posts", "Último acesso"].map((h) => (
                      <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.pessoaId} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2">
                        <Link href={`/admin/contas/${u.titularId}?periodo=${periodo}#pessoa-${u.pessoaId}`} className="hover:underline underline-offset-2" style={{ color: "var(--text-primary)" }}>
                          {u.nome ?? u.email}
                        </Link>
                        <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                          {u.email}
                        </span>
                        <span className="mt-1 block">
                          <MarcaDaContaNaTela marca={u.marca} />
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {u.caso}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                        {numero(u.uso.creditos)}
                        {u.uso.creditosQueCustariam > 0 && <span className="block" style={{ color: "var(--text-muted)" }}>+{numero(u.uso.creditosQueCustariam)} simulados</span>}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }} title={`${dolares(u.uso.custoUsd)} a R$ ${cotacao(dolar)}`}>
                        {reais(u.uso.custoReais, 2)}
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {u.uso.gravacoes} · {numero(Math.round(u.uso.minutos))} min
                      </td>
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {u.uso.postsGerados} · {u.uso.postsPublicados} publicados
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {dataCurta(u.ultimoAcesso)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Cartao>

      <Dobra id="fora" titulo="Fora da receita, de propósito" resumo={`${foraNoPeriodo.length} lançamento(s) no período · ${reais(foraNoPeriodo.reduce((s, f) => s + f.reais, 0), 2)}`}>
        {foraNoPeriodo.length === 0 ? (
          <Vazio compacto titulo="Nada fora da receita no período" texto="Pagamento de conta da equipe e pagamento por fora sem comprovante aparecem aqui, com o motivo." />
        ) : (
          <ul className="space-y-1">
            {foraNoPeriodo.map((f, i) => (
              <li key={i} className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {dataCurta(f.quando)} · {f.conta} · {reais(f.reais, 2)} · {NOME_DO_MOTIVO_FORA[f.motivo]} ({f.descricao})
              </li>
            ))}
          </ul>
        )}
      </Dobra>
    </div>
  );
}
