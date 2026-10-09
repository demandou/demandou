export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/admin/guarda";
import { jevLigado } from "@/lib/jev/cliente";
import { lerBaseDasContas, periodoDasContasDaUrl } from "@/lib/admin/contas/leitura";
import { montarCasos, marcaDaConta, NOME_DA_MARCA, type MarcaDaConta } from "@/lib/admin/contas/caso-a-caso";
import { lerProjetosComTextos, todasAsCategorias } from "@/lib/admin/perfis/servidor";
import { NOME_DA_PESSOA, NOME_DO_NEGOCIO, NOME_DO_TEXTO, OUTROS, type TextosDoPerfil, type TipoDeNegocio, type TipoDePessoa } from "@/lib/admin/perfis/categorias";
import { reais, numero } from "@/lib/admin/tipos-do-painel";
import { cotacao } from "@/lib/admin/tipos-do-uso-de-ia";
import { PLANOS_PUBLICOS } from "@/lib/planos";
import { BarrasHorizontais, Cartao, Dobra, Rosca, Vazio } from "@/components/admin/painel-graficos";
import { ComoCalculamos, SeletorDoPeriodo, dataCurta } from "@/components/admin/contas-pecas";
import { ClassificarPerfis } from "@/components/admin/classificar-perfis";

/**
 * OS PERFIS DOS CLIENTES (08/10/2026). Pedido do Bruno: um gráfico para o
 * admin entender os perfis por nicho e por tipo (advogados, consultores,
 * vendedores, médicos...). A categoria de cada projeto é decidida pelo JEV
 * (lib/admin/perfis), guardada com a data e os textos lidos, e refeita quando
 * o nicho muda. Aqui: a distribuição por categoria, por tipo de negócio e por
 * tipo de marca, com contas, receita paga e uso por categoria, filtro por
 * plano, e "outros" com os textos crus. Só admin.
 */
const CORES = ["var(--painel-1)", "var(--painel-2)", "var(--painel-3)", "var(--painel-4)", "var(--painel-5)", "var(--painel-neutro)"];

export default async function PerfisPage({ searchParams }: { searchParams: Promise<{ periodo?: string; plano?: string }> }) {
  if (!(await exigirAdmin())) notFound();
  const sp = await searchParams;
  const periodo = periodoDasContasDaUrl(sp.periodo);
  const planoFiltro = typeof sp.plano === "string" && sp.plano ? sp.plano : null;
  const agora = new Date();
  const [base, perfis] = await Promise.all([lerBaseDasContas(periodo, agora), lerProjetosComTextos()]);
  const resultado = montarCasos(base.entrada);
  const dolar = base.entrada.dolar;

  const contas = new Map(base.entrada.contas.map((c) => [c.id, c]));
  const jaPagou = new Set(base.entrada.pagamentos.map((p) => p.contaId).filter((x): x is string => Boolean(x)));
  const receitaDaConta = new Map<string, number>();
  for (const p of base.entrada.pagamentos) {
    if (!p.contaId) continue;
    const t = new Date(p.quando).getTime();
    if (t >= base.entrada.desde.getTime() && t < base.entrada.ate.getTime()) receitaDaConta.set(p.contaId, (receitaDaConta.get(p.contaId) ?? 0) + p.reais);
  }
  // O caso de cada conta (para o nome do cliente na lista de "outros").
  const casoDaConta = new Map<string, string>();
  for (const c of resultado.casos) for (const p of c.pessoas) casoDaConta.set(p.id, c.empresa ?? c.titular.nome ?? c.titular.email);

  // Um cliente por conta: o projeto de maior uso decide a categoria da conta
  // quando a conta tem mais de um projeto classificado.
  type Linha = { contaId: string; email: string; plano: string; marca: MarcaDaConta; categoria: string; categoriaNome: string; negocio: TipoDeNegocio | null; pessoa: TipoDePessoa | null; projetos: number; creditos: number; custoUsd: number; receita: number; equipe: boolean };
  const porConta = new Map<string, Linha>();
  const projetosClassificados = perfis.projetos.filter((p) => p.guardado);
  const pendentes = perfis.projetos.filter((p) => p.situacao === "sem_classificacao" || p.situacao === "desatualizado");
  const semTexto = perfis.projetos.filter((p) => p.situacao === "sem_texto");
  for (const p of projetosClassificados) {
    const c = contas.get(p.donoId);
    if (!c) continue;
    const g = p.guardado!;
    const creditos = base.creditosPorProjeto.get(p.id) ?? 0;
    const custoUsd = base.custoPorProjeto.get(p.id) ?? 0;
    const marca = marcaDaConta(c, jaPagou, agora);
    const atual = porConta.get(c.id);
    if (!atual) {
      porConta.set(c.id, { contaId: c.id, email: c.email, plano: c.plano, marca, categoria: g.categoria, categoriaNome: g.categoriaNome, negocio: g.negocio, pessoa: g.pessoa, projetos: 1, creditos, custoUsd, receita: receitaDaConta.get(c.id) ?? 0, equipe: marca === "equipe" });
    } else {
      atual.projetos += 1;
      if (creditos > atual.creditos) {
        atual.categoria = g.categoria;
        atual.categoriaNome = g.categoriaNome;
        atual.negocio = g.negocio;
        atual.pessoa = g.pessoa;
      }
      atual.creditos += creditos;
      atual.custoUsd += custoUsd;
    }
  }
  const linhas = [...porConta.values()].filter((l) => !planoFiltro || l.plano === planoFiltro);
  const clientes = linhas.filter((l) => !l.equipe);
  const planosNaBase = [...new Set([...porConta.values()].map((l) => l.plano))].filter((p) => p && p !== "free");
  const nomeDoPlano = (id: string) => PLANOS_PUBLICOS.find((p) => p.id === id)?.nome ?? id;

  type Grupo = { chave: string; nome: string; contas: number; equipe: number; receita: number; creditos: number; custoReais: number; projetos: number };
  const agrupar = (chaveDe: (l: Linha) => string | null, nomeDe: (chave: string) => string) => {
    const m = new Map<string, Grupo>();
    for (const l of linhas) {
      const k = chaveDe(l) ?? "sem_dado";
      const g = m.get(k) ?? { chave: k, nome: k === "sem_dado" ? "Sem dado" : nomeDe(k), contas: 0, equipe: 0, receita: 0, creditos: 0, custoReais: 0, projetos: 0 };
      if (l.equipe) g.equipe += 1;
      else {
        g.contas += 1;
        g.receita += l.receita;
      }
      g.creditos += l.creditos;
      g.custoReais += l.custoUsd * dolar;
      g.projetos += l.projetos;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.contas - a.contas || b.creditos - a.creditos);
  };
  const categorias = todasAsCategorias(perfis.extras);
  const porCategoria = agrupar((l) => l.categoria, (k) => categorias.find((c) => c.id === k)?.nome ?? k);
  const porNegocio = agrupar((l) => l.negocio, (k) => NOME_DO_NEGOCIO[k as TipoDeNegocio] ?? k);
  const porPessoa = agrupar((l) => l.pessoa, (k) => NOME_DA_PESSOA[k as TipoDePessoa] ?? k);
  const emOutros = projetosClassificados.filter((p) => p.guardado!.categoria === OUTROS.id && (!planoFiltro || contas.get(p.donoId)?.plano === planoFiltro));
  const filtroUrl = planoFiltro ? `&plano=${encodeURIComponent(planoFiltro)}` : "";
  const textosCrus = (t: TextosDoPerfil) =>
    (Object.keys(t) as Array<keyof TextosDoPerfil>).map((k) => `${NOME_DO_TEXTO[k]}: ${t[k]}`).join(" · ");

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
              Perfis dos clientes
            </h1>
          </div>
          <nav aria-label="Telas de gestão" className="flex flex-wrap items-center gap-2">
            {[
              { href: "/admin", nome: "Painel" },
              { href: "/admin/contas", nome: "Contratos e contas" },
              { href: "/admin/reprovacoes", nome: "Reprovações e devoluções" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--realce-2)]" style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}>
                {l.nome}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <SeletorDoPeriodo atual={periodo} base="/admin/perfis" extra={filtroUrl} />
          <nav aria-label="Filtro por plano" className="inline-flex flex-wrap rounded-xl border p-1 gap-1" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
            {[{ id: "", nome: "Todos os planos" }, ...planosNaBase.map((p) => ({ id: p, nome: nomeDoPlano(p) }))].map((p) => {
              const ativo = (planoFiltro ?? "") === p.id;
              return (
                <Link key={p.id || "todos"} href={`/admin/perfis?periodo=${periodo}${p.id ? `&plano=${encodeURIComponent(p.id)}` : ""}`} aria-current={ativo ? "true" : undefined} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${ativo ? "bg-[var(--acento-forte)] text-white" : "text-[var(--text-muted)] hover:bg-[var(--realce-2)]"}`}>
                  {p.nome}
                </Link>
              );
            })}
          </nav>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Uso e receita no período: {base.rotuloDoPeriodo}. Dólar a R$ {cotacao(dolar)}.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{projetosClassificados.length}</strong> projeto(s) classificado(s) pelo JEV ·{" "}
          <strong style={{ color: "var(--text-primary)" }}>{pendentes.length}</strong> pendente(s) ({pendentes.filter((p) => p.situacao === "desatualizado").length} com o nicho mudado) ·{" "}
          {semTexto.length} sem texto para classificar
          {perfis.extras.length > 0 ? ` · ${perfis.extras.length} categoria(s) nova(s): ${perfis.extras.map((x) => x.nome).join(", ")}` : ""}
        </div>
        <ClassificarPerfis pendentes={pendentes.length} ligado={jevLigado()} pronta={perfis.tabelasProntas} />
      </section>

      <ComoCalculamos>
        <p>
          <strong>Quem decide a categoria é o JEV</strong>, escolhendo entre as categorias da casa (mais as novas que ele aceitou) a partir dos textos do projeto: nome, nicho,
          público, descrição, o &quot;quem é&quot; da análise das redes do próprio cliente e o formulário da landing. Nenhum modelo de texto e nenhuma lista de palavras decide. Só a
          escolha confiante (50% ou mais) vale; em dúvida, o projeto vai para &quot;outros&quot; com os textos crus aqui embaixo.
        </p>
        <p>
          <strong>Categoria nova</strong>: quando nenhuma serve, o código oferece o nicho do cliente como candidata, e o JEV diz sim ou não (70% ou mais). Aceita, vale
          para os próximos. <strong>Recalculada</strong> quando o nicho, o público, a descrição ou a análise das redes muda (o hash dos textos muda).
        </p>
        <p>
          <strong>Contas</strong>: uma por conta, pela categoria do projeto que mais consumiu. Conta da equipe conta à parte e nunca tem receita. <strong>Receita paga</strong>: só
          pagamento confirmado no período. <strong>Uso</strong>: créditos consumidos (mais os simulados do admin) e custo de IA dos projetos da categoria, no período.
        </p>
      </ComoCalculamos>

      {porConta.size === 0 ? (
        <Vazio titulo="Nenhum perfil classificado ainda" texto={perfis.tabelasProntas ? "Clique em classificar: o JEV lê os textos dos projetos e decide a categoria de cada um." : "A tabela dos perfis nasce no próximo deploy de produção; depois, o botão classifica."} />
      ) : (
        <>
          <Cartao titulo="Clientes por categoria de profissão ou setor" subtitulo="Contas de cliente (fora da equipe) por categoria, com a receita paga e o uso de cada uma no período.">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-2">
                <Rosca
                  centro={String(clientes.length)}
                  rotuloDoCentro="cliente(s)"
                  fatias={porCategoria.filter((g) => g.contas > 0).map((g, i) => ({ nome: g.nome, valor: g.contas, cor: CORES[i % CORES.length] }))}
                  vazio={{ titulo: "Só contas da equipe classificadas", texto: "Os clientes aparecem aqui quando os projetos deles forem classificados." }}
                />
              </div>
              <div className="lg:col-span-3 overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full min-w-[40rem] text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-input)" }}>
                      {["Categoria", "Clientes", "Equipe", "Receita paga", "Créditos", "Custo de IA", "Projetos"].map((h) => (
                        <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {porCategoria.map((g) => (
                      <tr key={g.chave} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--text-primary)" }}>{g.nome}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-primary)" }}>{g.contas}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{g.equipe}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: g.receita > 0 ? "var(--badge-success-text)" : "var(--text-muted)" }}>{reais(g.receita, 2)}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{numero(g.creditos)}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{reais(g.custoReais, 2)}</td>
                        <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{g.projetos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Cartao>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Cartao titulo="Para quem vendem" subtitulo="Empresas (B2B), pessoas (B2C) ou os dois, decidido pelo JEV. Sem dado quando o JEV ficou em dúvida.">
              <BarrasHorizontais linhas={porNegocio.map((g) => ({ nome: g.nome, valor: g.contas + g.equipe, nota: `· ${reais(g.receita, 2)} pagos · ${numero(g.creditos)} créditos` }))} />
            </Cartao>
            <Cartao titulo="Marca pessoal ou de empresa" subtitulo="A pessoa é a marca, ou a marca é a organização.">
              <BarrasHorizontais cor="var(--painel-3)" linhas={porPessoa.map((g) => ({ nome: g.nome, valor: g.contas + g.equipe, nota: `· ${reais(g.receita, 2)} pagos · ${numero(g.creditos)} créditos` }))} />
            </Cartao>
          </div>
        </>
      )}

      <Dobra id="outros" titulo="Outros e pendentes: os textos crus" resumo={`${emOutros.length} em "outros" · ${pendentes.length} pendente(s) · ${semTexto.length} sem texto`}>
        {emOutros.length > 0 && (
          <Cartao titulo='Em "outros"' subtitulo="Nenhuma categoria serviu, e o nicho não virou categoria nova. Os textos que o JEV leu, para o admin decidir se a lista precisa de uma entrada.">
            <ul className="space-y-2">
              {emOutros.map((p) => (
                <li key={p.id} className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{p.nome}</strong> · {casoDaConta.get(p.donoId) ?? contas.get(p.donoId)?.email ?? "sem dono"} · classificado em {dataCurta(p.guardado!.classificadoEm)}
                  <span className="block">{textosCrus(p.guardado!.textos) || "sem texto"}</span>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
        {pendentes.length > 0 && (
          <Cartao titulo="Pendentes" subtitulo="Sem classificação, ou com os textos mudados depois da última. O botão de cima manda para o JEV.">
            <ul className="space-y-2">
              {pendentes.map((p) => (
                <li key={p.id} className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{p.nome}</strong> · {contas.get(p.donoId)?.email ?? "sem dono"} · {p.situacao === "desatualizado" ? `desatualizado (antes: ${p.guardado?.categoriaNome})` : "sem classificação"}
                  <span className="block">{textosCrus(p.textos)}</span>
                </li>
              ))}
            </ul>
          </Cartao>
        )}
        {semTexto.length > 0 && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sem texto para classificar (só o nome): {semTexto.map((p) => `${p.nome} (${contas.get(p.donoId)?.email ?? "sem dono"})`).join("; ")}.
          </p>
        )}
        {emOutros.length === 0 && pendentes.length === 0 && semTexto.length === 0 && <Vazio compacto titulo="Nada pendente" texto="Todo projeto com texto tem categoria, e nenhum caiu em outros." />}
      </Dobra>

      <Dobra id="contas" titulo="As contas, uma a uma, com a categoria" resumo={`${linhas.length} conta(s) classificada(s)${planoFiltro ? ` no plano ${nomeDoPlano(planoFiltro)}` : ""}`}>
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr style={{ background: "var(--bg-input)" }}>
                {["Conta", "Plano", "Categoria", "Vende para", "Marca", "Receita paga", "Créditos", "Custo de IA"].map((h) => (
                  <th key={h} className="text-left font-medium px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.sort((a, b) => b.creditos - a.creditos).map((l) => (
                <tr key={l.contaId} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-primary)" }}>
                    <Link href={`/admin/contas/${l.contaId}?periodo=${periodo}`} className="hover:underline underline-offset-2">{l.email}</Link>
                    <span className="block" style={{ color: "var(--text-muted)" }}>{NOME_DA_MARCA[l.marca]}</span>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{l.plano === "free" ? "sem plano" : nomeDoPlano(l.plano)}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-primary)" }}>{l.categoriaNome}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{l.negocio ? NOME_DO_NEGOCIO[l.negocio] : "sem dado"}</td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>{l.pessoa ? NOME_DA_PESSOA[l.pessoa] : "sem dado"}</td>
                  <td className="px-3 py-2 text-xs tabular-nums" style={{ color: l.equipe ? "var(--text-muted)" : l.receita > 0 ? "var(--badge-success-text)" : "var(--text-muted)" }}>{l.equipe ? "equipe, sem receita" : reais(l.receita, 2)}</td>
                  <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{numero(l.creditos)}</td>
                  <td className="px-3 py-2 text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{reais(l.custoUsd * dolar, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Dobra>
    </div>
  );
}
