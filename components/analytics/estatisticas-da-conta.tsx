"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, FlaskConical, RefreshCw, Eye, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotaoDescartar, Descartavel } from "@/components/ui/descartar";
import { FotoDaConta } from "@/components/social/selo-da-conta";
import { Variacao } from "@/components/painel/graficos";
import { chaveDaDica } from "@/lib/avisos/chaves";
import { NOMES_DAS_REDES } from "@/lib/posts/estado";
import { rotuloDaFonte } from "@/lib/analytics/fontes-da-leitura";
import {
  ROTULO_DO_TIPO,
  comparacaoComAntesValida,
  fraseDoEstado,
  janelasDaLeitura,
  parte,
  type ContaNaTela,
  type EstatisticasDoProjeto,
  type GuardadoDaConta,
  type LeituraDaConta,
} from "@/lib/analytics/tipos-da-conta";

/**
 * AS ESTATÍSTICAS DA CONTA NA TELA (09/10/2026).
 *
 * O pedido do Bruno, com o print do Painel Profissional do Instagram: "pra quem
 * não tinha nada... isso tem que estar na primeira tela da Demandou". Dois
 * lugares, o mesmo dado (lib/analytics/estatisticas-da-conta.ts):
 *
 *   - CardDasVisualizacoes, no topo da aba Criar (a primeira tela do projeto):
 *     as visualizações de 30 dias de cada conta, a variação contra os 30 dias
 *     anteriores e contra antes da Demandou, com a data da leitura;
 *   - PainelDasContas, no topo de Resultados: o painel no espírito do print
 *     (total, seguidores e não seguidores, por formato, principais conteúdos)
 *     e uma linha por rede conectada.
 *
 * "Se não sabe, não fala": sem leitura, o card diz POR QUÊ e não mostra
 * número. O convite para reconectar é a única porta da ação, então o X dele
 * RECOLHE (fica uma linha com o botão), não some. Número de exemplo só existe
 * na prova local, com o selo "simulação" em cada conta.
 */

const FUSO = "America/Sao_Paulo";
const num = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number) => `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: FUSO });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: FUSO });
const nomeDaRede = (r: string) => NOMES_DAS_REDES[r] ?? r;

function urlDeReconectar(rede: string, projectId: string, voltarPara: string) {
  return `/api/social/${rede}/connect?projectId=${encodeURIComponent(projectId)}&returnTo=${encodeURIComponent(voltarPara)}`;
}

/** O selo da prova local. Nunca aparece em produção (o arquivo local não existe lá). */
function SeloSimulacao({ curto = false }: { curto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: "rgba(245,158,11,.5)", color: "#d97706", background: "rgba(245,158,11,.08)" }}>
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {curto ? "simulação" : "Simulação local: números de exemplo, não lidos da API"}
    </span>
  );
}

/** O estado em poucas palavras (a linha recolhida e a linha por rede). */
function resumoDoEstado(conta: ContaNaTela, estado: ContaNaTela["estado"]): string {
  if (estado === "reconectar") return conta.causa === "conexao" ? "a conexão caiu, reconecte" : "falta permissão para ler";
  if (estado === "aguardando_meta") return "aguardando a Meta liberar a leitura";
  if (estado === "erro") return "a última leitura falhou";
  if (estado === "numeros") return "sem visualizações nesta leitura";
  return "primeira leitura em alguns minutos";
}

/** O botão de reconectar, ou a frase para quem não pode (membro da equipe). */
function Reconectar({ conta, projectId, voltarPara, souDono, tamanho = "sm" }: { conta: ContaNaTela; projectId: string; voltarPara: string; souDono: boolean; tamanho?: "sm" | "default" }) {
  if (!souDono) return <span className="text-xs" style={{ color: "var(--text-muted)" }}>Só o dono do projeto pode reconectar a conta.</span>;
  return (
    <Button size={tamanho} variant="outline" asChild>
      <a href={urlDeReconectar(conta.rede, projectId, voltarPara)}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Reconectar o {nomeDaRede(conta.rede)}
      </a>
    </Button>
  );
}

/**
 * O AVISO DE UMA CONTA SEM NÚMERO (ou com a leitura de hoje recusada): a frase
 * do motivo, o botão quando a ação é do cliente, e o X que recolhe.
 */
function AvisoDaConta({ conta, estado, projectId, voltarPara, souDono }: { conta: ContaNaTela; estado: Exclude<ContaNaTela["estado"], "numeros">; projectId: string; voltarPara: string; souDono: boolean }) {
  const frase = fraseDoEstado({ ...conta, estado });
  const temAcao = estado === "reconectar";
  const compacto = (
    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
      <span>
        Estatísticas de {conta.perfil ?? nomeDaRede(conta.rede)}: {resumoDoEstado(conta, estado)}.
      </span>
      {temAcao && <Reconectar conta={conta} projectId={projectId} voltarPara={voltarPara} souDono={souDono} />}
    </div>
  );
  // Aguardando a primeira leitura não é aviso: é estado, e passa sozinho.
  if (estado === "aguardando_leitura") {
    return (
      <p className="flex items-start gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {frase}
      </p>
    );
  }
  return (
    <Descartavel chave={conta.chaveDoAviso} modo="recolher" compacto={compacto}>
      <div className="flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: estado === "erro" ? "rgba(248,113,113,.35)" : "var(--border)", background: "var(--bg-elevated)" }}>
        <div className="min-w-0 flex-1">
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>{frase}</p>
          {estado === "reconectar" && conta.causa !== "conexao" && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Ao reconectar, a Meta pergunta se a Demandou pode ler as estatísticas da conta (visualizações, alcance, seguidores). Nada é publicado por causa disso.
            </p>
          )}
          {temAcao && (
            <div className="mt-2">
              <Reconectar conta={conta} projectId={projectId} voltarPara={voltarPara} souDono={souDono} />
            </div>
          )}
        </div>
        <BotaoDescartar compacto className="-my-0.5 -mr-1" rotulo="Recolher o aviso" />
      </div>
    </Descartavel>
  );
}

/** Quando a comparação com antes da Demandou fica completa (a janela atual inteira depois da conexão). */
function comparacaoCompletaEm(g: GuardadoDaConta): string {
  return janelasDaLeitura(new Date(g.ultima?.lidoEm ?? g.conectadaEm), new Date(g.conectadaEm), g.rede).comparacaoCompletaEm;
}

/** A linha "contra antes da Demandou", com o que der para dizer. */
function ContraAntes({ g }: { g: GuardadoDaConta }) {
  const l = g.ultima!;
  const atual = l.atual.visualizacoes?.valor;
  if (comparacaoComAntesValida(g) && typeof atual === "number" && typeof g.antes?.visualizacoes?.valor === "number") {
    return <Variacao atual={atual} anterior={g.antes.visualizacoes.valor} rotulo={`vs. antes da Demandou (${num(g.antes.visualizacoes.valor)} de ${dia(g.antes.janela.desde)} a ${dia(g.antes.janela.ate)})`} />;
  }
  if (g.antes?.visualizacoes) {
    return (
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Antes da Demandou: {num(g.antes.visualizacoes.valor)} visualizações ({dia(g.antes.janela.desde)} a {dia(g.antes.janela.ate)}). A comparação completa sai em {dia(comparacaoCompletaEm(g))}, com 30 dias conectada.
      </span>
    );
  }
  return g.antesMotivo ? <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Antes da Demandou: {g.antesMotivo}</span> : null;
}

/* ── O card da primeira tela ──────────────────────────────────────────── */

function BlocoDaConta({ conta, projectId, souDono }: { conta: ContaNaTela; projectId: string; souDono: boolean }) {
  const voltarPara = `/projects/${projectId}/criar`;
  const g = conta.guardado;
  const cabecalho = (
    <div className="flex min-w-0 items-center gap-2">
      <FotoDaConta conta={{ platform: conta.rede, displayName: conta.perfil, accountType: conta.accountType, avatarUrl: conta.avatarUrl }} tamanho={28} />
      <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{conta.perfil ?? nomeDaRede(conta.rede)}</span>
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{nomeDaRede(conta.rede)}</span>
      {g?.simulado && <SeloSimulacao curto />}
    </div>
  );
  if (conta.estado !== "numeros" || !g?.ultima) {
    return (
      <div className="space-y-2">
        {cabecalho}
        <AvisoDaConta conta={conta} estado={conta.estado === "numeros" ? "erro" : conta.estado} projectId={projectId} voltarPara={voltarPara} souDono={souDono} />
      </div>
    );
  }
  const l = g.ultima;
  const v = l.atual.visualizacoes?.valor;
  const ant = l.anterior?.visualizacoes?.valor;
  return (
    <div className="space-y-1.5">
      {cabecalho}
      {typeof v === "number" ? (
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{num(v)}</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>visualizações</span>
        </p>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>A Meta respondeu sem visualizações para estes 30 dias.</p>
      )}
      <div className="flex flex-col gap-0.5">
        {typeof v === "number" && typeof ant === "number" && <Variacao atual={v} anterior={ant} />}
        <ContraAntes g={g} />
      </div>
      {(l.atual.alcance || l.porSeguimento) && (
        <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          {l.atual.alcance && <><strong style={{ color: "var(--text-primary)" }}>{num(l.atual.alcance.valor)}</strong> contas alcançadas</>}
          {l.atual.alcance && l.porSeguimento && " · "}
          {l.porSeguimento && <>{pct(parte(l.porSeguimento.naoSeguidores, l.porSeguimento.seguidores + l.porSeguimento.naoSeguidores + l.porSeguimento.desconhecido))} de não seguidores</>}
        </p>
      )}
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {g.simulado ? "exemplo da prova local" : `${rotuloDaFonte(`api:${conta.rede}`)}, lido em ${quando(l.lidoEm)}`}
      </p>
      {conta.problema && <AvisoDaConta conta={conta} estado={conta.problema} projectId={projectId} voltarPara={voltarPara} souDono={souDono} />}
    </div>
  );
}

export function CardDasVisualizacoes({ projectId, estatisticas, souDono }: { projectId: string; estatisticas: EstatisticasDoProjeto; souDono: boolean }) {
  const contas = [...estatisticas.contas].sort((a, b) => Number(b.estado === "numeros") - Number(a.estado === "numeros"));
  return (
    <section aria-labelledby="titulo-estatisticas-da-conta" className="w-full rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--bg-elevated)" }}>
            <Eye className="h-5 w-5 text-orange-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="titulo-estatisticas-da-conta" className="font-semibold" style={{ color: "var(--text-primary)" }}>Quem viu o seu conteúdo nos últimos 30 dias</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>A conta inteira, não só os posts da Demandou. Número lido da própria rede, com a data da leitura.</p>
          </div>
        </div>
        {contas.some((c) => c.estado === "numeros") && (
          <Link href={`/projects/${projectId}/analytics#estatisticas-da-conta`} className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 underline-offset-2 hover:underline">
            Ver o painel completo <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {estatisticas.simulacao && (
        <div className="mt-3">
          <SeloSimulacao />
        </div>
      )}
      {contas.length === 0 ? (
        <Descartavel chave={chaveDaDica("estatisticas-sem-conta", projectId)}>
          <div className="mt-4 flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
            <p className="min-w-0 flex-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Conecte o Instagram ou a página do Facebook em{" "}
              <Link href={`/projects/${projectId}/settings`} className="font-semibold underline-offset-2 hover:underline" style={{ color: "var(--text-primary)" }}>
                Configurações
              </Link>{" "}
              para ver aqui quantas pessoas viram o seu conteúdo.
            </p>
            <BotaoDescartar compacto className="-my-0.5 -mr-1" />
          </div>
        </Descartavel>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {contas.map((c) => (
            <BlocoDaConta key={c.contaId} conta={c} projectId={projectId} souDono={souDono} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── O painel de Resultados ───────────────────────────────────────────── */

function Tile({ rotulo, valor, nota, title }: { rotulo: string; valor: string; nota?: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }} title={title}>
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{rotulo}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{valor}</p>
      {nota && <div className="mt-0.5">{nota}</div>}
    </div>
  );
}

/** Seguidores e não seguidores, numa barra só (como o círculo do print, em linha). */
function BarraDeSeguimento({ l }: { l: LeituraDaConta }) {
  const s = l.porSeguimento!;
  const total = s.seguidores + s.naoSeguidores + s.desconhecido;
  const partes = [
    { rotulo: "Seguidores", valor: s.seguidores, cor: "var(--grafico-1)" },
    { rotulo: "Não seguidores", valor: s.naoSeguidores, cor: "var(--grafico-2)" },
    ...(s.desconhecido ? [{ rotulo: "Não identificado", valor: s.desconhecido, cor: "var(--grafico-6)" }] : []),
  ];
  return (
    <div title={s.fonte}>
      <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-input)" }} role="img" aria-label={partes.map((p) => `${p.rotulo}: ${pct(parte(p.valor, total))}`).join(", ")}>
        {partes.filter((p) => p.valor > 0).map((p) => (
          <div key={p.rotulo} style={{ width: `${(p.valor / Math.max(1, total)) * 100}%`, background: p.cor }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {partes.map((p) => (
          <span key={p.rotulo} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.cor }} />
            {p.rotulo} <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>{pct(parte(p.valor, total))}</strong>
            <span className="tabular-nums">({num(p.valor)})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Por formato: Reels, Stories e Publicações (e anúncios e outros quando houver). */
function BarrasPorFormato({ l }: { l: LeituraDaConta }) {
  const t = l.porTipo!;
  const linhas = [
    { rotulo: "Reels", valor: t.reels },
    { rotulo: "Stories", valor: t.stories },
    { rotulo: "Publicações", valor: t.publicacoes },
    ...(t.anuncios ? [{ rotulo: "Anúncios", valor: t.anuncios }] : []),
    ...(t.outros ? [{ rotulo: "Outros", valor: t.outros }] : []),
  ];
  const total = linhas.reduce((s, x) => s + x.valor, 0);
  return (
    <div className="space-y-2.5" title={t.fonte}>
      {linhas.map((x) => (
        <div key={x.rotulo}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{x.rotulo}</span>
            <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{pct(parte(x.valor, total))}</strong> · {num(x.valor)}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--bg-input)" }}>
            <div className="h-full rounded-full" style={{ width: `${(x.valor / Math.max(1, total)) * 100}%`, background: "linear-gradient(90deg, color-mix(in srgb, var(--grafico-2) 55%, transparent), var(--grafico-2))" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PrincipaisConteudos({ l, rede }: { l: LeituraDaConta; rede: string }) {
  return (
    <ol className="space-y-2">
      {l.principais.map((c, i) => (
        <li key={c.id} className="flex items-center gap-3" title={c.fonte}>
          <span className="w-4 shrink-0 text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
          {c.miniatura ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.miniatura} alt="" width={44} height={56} className="h-14 w-11 shrink-0 rounded-md object-cover" referrerPolicy="no-referrer" loading="lazy" />
          ) : (
            <span className="h-14 w-11 shrink-0 rounded-md" style={{ background: "var(--bg-input)" }} />
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm" style={{ color: "var(--text-primary)" }}>{c.legenda || "(sem legenda)"}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {ROTULO_DO_TIPO[c.tipo] ?? c.tipo}
              {c.publicadoEm ? ` · ${dia(c.publicadoEm)}` : ""}
              {c.link && (
                <>
                  {" · "}
                  <a href={c.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline">
                    ver no {nomeDaRede(rede)} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </>
              )}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{num(c.visualizacoes ?? 0)}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>visualizações</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Cada número e a chamada de onde veio. */
function FontesDosNumeros({ l, g }: { l: LeituraDaConta; g: GuardadoDaConta }) {
  const linhas: Array<[string, string | undefined]> = [
    ["Visualizações e alcance", l.atual.visualizacoes?.fonte ?? l.atual.alcance?.fonte],
    ["30 dias anteriores", l.anterior?.visualizacoes?.fonte],
    ["Antes da Demandou", g.antes?.visualizacoes?.fonte],
    ["Seguidores e não seguidores", l.porSeguimento?.fonte],
    ["Por formato", l.porTipo?.fonte],
    ["Seguidores ganhos", l.seguidoresGanhos?.fonte],
    ["Total de seguidores", l.seguidores?.fonte],
  ];
  return (
    <details className="text-[11px]" style={{ color: "var(--text-muted)" }}>
      <summary className="cursor-pointer select-none font-semibold" style={{ color: "var(--text-primary)" }}>De onde veio cada número</summary>
      <ul className="mt-2 space-y-1 break-all">
        {linhas.filter(([, f]) => f).map(([r, f]) => (
          <li key={r}><strong>{r}:</strong> {f}</li>
        ))}
        {l.principais.length > 0 && <li><strong>Principais conteúdos:</strong> insights de cada publicação (metric=views,reach), visualizações desde a publicação.</li>}
      </ul>
    </details>
  );
}

function DetalheDaConta({ conta, projectId, souDono }: { conta: ContaNaTela; projectId: string; souDono: boolean }) {
  const g = conta.guardado!;
  const l = g.ultima!;
  const v = l.atual.visualizacoes?.valor;
  const ant = l.anterior?.visualizacoes?.valor;
  const alc = l.atual.alcance?.valor;
  const alcAnt = l.anterior?.alcance?.valor;
  const ganhos = l.seguidoresGanhos;
  return (
    <div className="rounded-2xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FotoDaConta conta={{ platform: conta.rede, displayName: conta.perfil, accountType: conta.accountType, avatarUrl: conta.avatarUrl }} tamanho={32} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{conta.perfil ?? nomeDaRede(conta.rede)}</h3>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          {nomeDaRede(conta.rede)} · {dia(l.atual.janela.desde)} a {dia(l.atual.janela.ate)} · {g.simulado ? "exemplo da prova local" : `${rotuloDaFonte(`api:${conta.rede}`)}, lido em ${quando(l.lidoEm)}`}
        </span>
        {g.simulado && <SeloSimulacao curto />}
      </div>

      {conta.problema && (
        <div className="mb-3">
          <AvisoDaConta conta={conta} estado={conta.problema} projectId={projectId} voltarPara={`/projects/${projectId}/analytics`} souDono={souDono} />
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile rotulo="Visualizações" valor={typeof v === "number" ? num(v) : "não veio"} title={l.atual.visualizacoes?.fonte} nota={typeof v === "number" && typeof ant === "number" ? <Variacao atual={v} anterior={ant} /> : undefined} />
        {typeof alc === "number" && <Tile rotulo="Contas alcançadas" valor={num(alc)} title={l.atual.alcance?.fonte} nota={typeof alcAnt === "number" ? <Variacao atual={alc} anterior={alcAnt} /> : undefined} />}
        {ganhos && (
          <Tile
            rotulo="Seguidores ganhos"
            valor={`${ganhos.seguiram - ganhos.deixaram >= 0 ? "+" : ""}${num(ganhos.seguiram - ganhos.deixaram)}`}
            title={ganhos.fonte}
            nota={<span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{num(ganhos.seguiram)} seguiram, {num(ganhos.deixaram)} deixaram{l.seguidores ? `; ${num(l.seguidores.valor)} no total` : ""}</span>}
          />
        )}
        {!ganhos && l.seguidores && <Tile rotulo="Seguidores" valor={num(l.seguidores.valor)} title={l.seguidores.fonte} nota={<span className="text-[11px]" style={{ color: "var(--text-muted)" }}>no dia da leitura</span>} />}
        {l.contasComInteracao && <Tile rotulo="Contas com interação" valor={num(l.contasComInteracao.valor)} title={l.contasComInteracao.fonte} nota={l.interacoes ? <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{num(l.interacoes.valor)} interações</span> : undefined} />}
      </div>

      <div className="mb-4">
        <ContraAntes g={g} />
      </div>

      {(l.porSeguimento || l.porTipo) && (
        <div className="mb-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {l.porSeguimento && (
            <div>
              <h4 className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Visualizações de seguidores e não seguidores</h4>
              <BarraDeSeguimento l={l} />
            </div>
          )}
          {l.porTipo && (
            <div>
              <h4 className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Por tipo de conteúdo</h4>
              <BarrasPorFormato l={l} />
            </div>
          )}
        </div>
      )}

      {l.principais.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Principais conteúdos por visualização</h4>
          <p className="mb-2 text-[11px]" style={{ color: "var(--text-muted)" }}>Publicados nestes 30 dias, pelas visualizações desde a publicação. Stories não entram: a Meta só os mostra por 24 horas.</p>
          <PrincipaisConteudos l={l} rede={conta.rede} />
        </div>
      )}

      {l.faltas.length > 0 && (
        <ul className="mb-3 list-disc space-y-0.5 pl-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {l.faltas.map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}

      <FontesDosNumeros l={l} g={g} />
    </div>
  );
}

/** Uma linha por rede conectada, com o número ou o motivo. */
function LinhaDaRede({ conta }: { conta: ContaNaTela }) {
  const l = conta.guardado?.ultima;
  const v = l?.atual.visualizacoes?.valor;
  const ant = l?.anterior?.visualizacoes?.valor;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <FotoDaConta conta={{ platform: conta.rede, displayName: conta.perfil, accountType: conta.accountType, avatarUrl: conta.avatarUrl }} tamanho={24} />
      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{nomeDaRede(conta.rede)}</span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{conta.perfil}</span>
      {conta.guardado?.simulado && <SeloSimulacao curto />}
      <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
        {conta.estado === "numeros" && typeof v === "number" ? (
          <>
            <span className="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{num(v)}</strong> visualizações
            </span>
            {typeof ant === "number" && <Variacao atual={v} anterior={ant} />}
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{conta.guardado?.simulado ? "exemplo" : `lido em ${quando(l!.lidoEm)}`}</span>
          </>
        ) : (
          // O botão mora no aviso logo abaixo (com o X que recolhe); aqui, só o estado.
          <span className={`text-xs ${conta.estado === "reconectar" || conta.estado === "erro" ? "text-red-400" : ""}`} style={conta.estado === "reconectar" || conta.estado === "erro" ? undefined : { color: "var(--text-muted)" }}>
            {resumoDoEstado(conta, conta.estado)}
          </span>
        )}
      </span>
    </div>
  );
}

export function PainelDasContas({ projectId, estatisticas, souDono }: { projectId: string; estatisticas: EstatisticasDoProjeto; souDono: boolean }) {
  const comNumero = estatisticas.contas.filter((c) => c.estado === "numeros" && c.guardado?.ultima);
  const semNumero = estatisticas.contas.filter((c) => !(c.estado === "numeros" && c.guardado?.ultima));
  const voltarPara = `/projects/${projectId}/analytics`;
  return (
    <section id="estatisticas-da-conta" className="mb-6 scroll-mt-28" aria-labelledby="titulo-painel-das-contas">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="titulo-painel-das-contas" className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Estatísticas das contas, últimos 30 dias</h2>
        {estatisticas.simulacao && <SeloSimulacao />}
      </div>
      <p className="mb-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
        A conta inteira (não só os posts da Demandou), lida da API de cada rede uma vez por dia. Sem leitura, não mostramos número.
      </p>

      <div className="mb-4 rounded-2xl border px-4 py-1" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        {estatisticas.contas.length === 0 && estatisticas.outrasRedes.length === 0 && (
          <p className="py-3 text-xs" style={{ color: "var(--text-muted)" }}>
            Nenhuma rede conectada. Conecte em{" "}
            <Link href={`/projects/${projectId}/settings`} className="font-semibold underline-offset-2 hover:underline" style={{ color: "var(--text-primary)" }}>Configurações</Link>.
          </p>
        )}
        {estatisticas.contas.map((c) => (
          <LinhaDaRede key={c.contaId} conta={c} />
        ))}
        {estatisticas.outrasRedes.map((o) => (
          <div key={o.rede} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
            <FotoDaConta conta={{ platform: o.rede, displayName: o.perfil, accountType: "personal", avatarUrl: o.avatarUrl }} tamanho={24} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{nomeDaRede(o.rede)}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{o.contas > 1 ? `${o.contas} contas` : o.perfil}</span>
            <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>A Demandou ainda não lê as estatísticas da conta aqui; os números dos posts estão em Post a post.</span>
          </div>
        ))}
      </div>

      {semNumero.some((c) => c.estado !== "aguardando_leitura") && (
        <div className="mb-4 space-y-2" data-lista-de-avisos>
          {semNumero
            .filter((c) => c.estado !== "aguardando_leitura" && c.estado !== "numeros")
            .map((c) => (
              <AvisoDaConta key={c.contaId} conta={c} estado={c.estado as Exclude<ContaNaTela["estado"], "numeros">} projectId={projectId} voltarPara={voltarPara} souDono={souDono} />
            ))}
        </div>
      )}

      <div className="space-y-4">
        {comNumero.map((c) => (
          <DetalheDaConta key={c.contaId} conta={c} projectId={projectId} souDono={souDono} />
        ))}
      </div>
    </section>
  );
}
