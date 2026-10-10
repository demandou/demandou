"use client";

import { ExternalLink, FlaskConical, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotaoDescartar, Descartavel } from "@/components/ui/descartar";
import { chaveDaDica } from "@/lib/avisos/chaves";
import {
  MAXIMO_NA_PRIMEIRA_TELA,
  MINIMO_DE_POSTS,
  NOME_DA_REDE_NO_IMPULSO,
  ROTULO_DO_FORMATO,
  ROTULO_DO_MOTIVO,
  fmt,
  fonteEData,
  type ImpulsosNaTela,
  type SugestaoDeImpulso,
} from "@/lib/analytics/tipos-do-impulso";

/**
 * O AGENTE DE TRÁFEGO NA TELA (09/10/2026, fase 1, só sugestão).
 *
 *   - SeloDeImpulso, no card do post em Resultados: "vale impulsionar", o
 *     motivo que o JEV escolheu e os dois números que sustentam, com a fonte e
 *     a data da leitura;
 *   - BlocoDeImpulso, na primeira tela (aba Criar): "Para impulsionar esta
 *     semana", até 3 posts, cada um com o X (chave impulsionar:<post>:<marco>,
 *     a mesma do selo: descartar num lugar tira do outro).
 *
 * O botão abre o post na própria rede, onde o cliente impulsiona (a Demandou
 * não impulsiona por API nesta fase). Orçamento e público são SUGESTÃO da
 * Demandou e a tela diz isso; os números do post são medidos, com a fonte.
 */

const nomeDaRede = (r: string) => NOME_DA_REDE_NO_IMPULSO[r] ?? r;
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
const quandoLeu = (marco: number) => (marco === 24 ? "24 h" : marco === 72 ? "3 dias" : "7 dias");

function SeloSimulacao() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: "rgba(245,158,11,.5)", color: "#d97706", background: "rgba(245,158,11,.08)" }}>
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      simulação local: sem decisão do JEV
    </span>
  );
}

/** A linha da fonte: de onde veio o número, quando foi lido, contra qual base. */
function LinhaDaFonte({ s }: { s: SugestaoDeImpulso }) {
  return (
    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
      {fonteEData(s.fonte, s.lidoEm)}, leitura de {quandoLeu(s.marco)} depois de publicar; comparado com a mediana dos últimos 90 dias {s.escopo === "formato" ? `dos posts de ${ROTULO_DO_FORMATO[s.formato]} da conta` : "da conta inteira"}.
      {s.semPrimeiroComentario ? " O primeiro comentário, da própria conta, não conta como comentário." : ""}
      {s.taxa
        ? ` ${fmt(s.taxa.valor * 100, 1)}% de interações por seguidor (${fmt(s.taxa.seguidores.valor)} seguidores, ${s.taxa.seguidores.fonte.startsWith("api:") ? "pela API da rede" : "do perfil público"} em ${dia(s.taxa.seguidores.lidoEm)}).`
        : ""}
    </p>
  );
}

/** A sugestão de orçamento e público, rotulada como sugestão. */
function Sugestao({ s }: { s: SugestaoDeImpulso }) {
  return (
    <div className="rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
      <p>
        <strong style={{ color: "var(--text-primary)" }}>Sugestão da Demandou (não é medida):</strong> {s.orcamento}
      </p>
      <p className="mt-1">
        <strong style={{ color: "var(--text-primary)" }}>Público:</strong> {s.publico}.
      </p>
      <p className="mt-1">{s.comoFazer}</p>
    </div>
  );
}

function BotaoDaRede({ s, tamanho = "sm" }: { s: SugestaoDeImpulso; tamanho?: "sm" | "default" }) {
  const verbo = s.rede === "instagram" || s.rede === "facebook" ? "Turbinar" : "Impulsionar";
  return (
    <Button size={tamanho} asChild>
      <a href={s.link} target="_blank" rel="noreferrer">
        <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
        {verbo} no {nomeDaRede(s.rede)}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </Button>
  );
}

/* ── O selo no card do post (Resultados) ──────────────────────────────── */

export function SeloDeImpulso({ s }: { s: SugestaoDeImpulso }) {
  return (
    <Descartavel chave={s.chave}>
      <div className="mt-2 rounded-lg border p-2.5" style={{ borderColor: "rgba(249,115,22,.4)", background: "rgba(249,115,22,.06)" }}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: "#f97316" }}>
                <Rocket className="h-3 w-3" aria-hidden="true" />
                vale impulsionar
              </span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{ROTULO_DO_MOTIVO[s.motivo]}:</span>
              <span style={{ color: "var(--text-primary)" }}>{s.numeros.map((n) => n.curto).join("; ")}</span>
            </p>
            <LinhaDaFonte s={s} />
            <details className="text-xs">
              <summary className="cursor-pointer select-none font-semibold" style={{ color: "var(--text-primary)" }}>Como impulsionar</summary>
              <div className="mt-2 space-y-2">
                <Sugestao s={s} />
                <BotaoDaRede s={s} />
              </div>
            </details>
          </div>
          <BotaoDescartar compacto className="-my-0.5 -mr-1" rotulo="Descartar a sugestão de impulso" />
        </div>
      </div>
    </Descartavel>
  );
}

/* ── O bloco da primeira tela ─────────────────────────────────────────── */

function CartaoDaSugestao({ s }: { s: SugestaoDeImpulso }) {
  return (
    <Descartavel chave={s.chave}>
      <li className="flex items-start gap-2 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-primary)" }}>{nomeDaRede(s.rede)}</strong>
            {s.contaRotulo ? ` · ${s.contaRotulo}` : ""} · {ROTULO_DO_FORMATO[s.formato]} de {dia(s.publicadoEm)}
          </p>
          <p className="line-clamp-2 text-sm" style={{ color: "var(--text-primary)" }}>{s.titulo || "(sem texto)"}</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.frase}</p>
          <ul className="space-y-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {s.numeros.map((n) => (
              <li key={n.sinal}>
                <strong style={{ color: "var(--text-primary)" }}>{n.curto}</strong> ({n.detalhe})
              </li>
            ))}
          </ul>
          <LinhaDaFonte s={s} />
          <Sugestao s={s} />
          <BotaoDaRede s={s} />
        </div>
        <BotaoDescartar compacto className="-my-0.5 -mr-1" rotulo="Descartar a sugestão de impulso" />
      </li>
    </Descartavel>
  );
}

export function BlocoDeImpulso({ projectId, impulsos }: { projectId: string; impulsos: ImpulsosNaTela }) {
  const sugestoes = impulsos.sugestoes.slice(0, MAXIMO_NA_PRIMEIRA_TELA);
  const aprendendo = impulsos.aprendendo;
  if (!sugestoes.length && !aprendendo.length) return null;
  return (
    <section aria-labelledby="titulo-impulso" className="w-full rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--bg-elevated)" }}>
          <Rocket className="h-5 w-5 text-orange-400" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 id="titulo-impulso" className="font-semibold" style={{ color: "var(--text-primary)" }}>Para impulsionar esta semana</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Posts que estão acima da sua própria média. A Demandou mede, decide e explica; quem impulsiona é você, no app da rede.
          </p>
        </div>
      </div>
      {impulsos.simulado && (
        <div className="mt-3">
          <SeloSimulacao />
        </div>
      )}
      {sugestoes.length > 0 && (
        <ul className="mt-4 space-y-3" data-lista-de-avisos>
          {sugestoes.map((s) => (
            <CartaoDaSugestao key={s.postId} s={s} />
          ))}
        </ul>
      )}
      {!sugestoes.length && aprendendo.length > 0 && (
        // Estado, não aviso: passa sozinho quando a conta tiver 5 posts medidos. O X é da dica (some de vez).
        <Descartavel chave={chaveDaDica("impulso-aprendendo", projectId)}>
          <div className="mt-4 flex items-start gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
            <p className="min-w-0 flex-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Ainda aprendendo a sua média:{" "}
              {aprendendo.map((a) => `${a.rotulo ?? nomeDaRede(a.rede)} no ${nomeDaRede(a.rede)} tem ${a.medidos} de ${MINIMO_DE_POSTS} posts medidos`).join("; ")}. As sugestões de impulso começam quando a conta tiver {MINIMO_DE_POSTS} posts medidos em 24 h.
            </p>
            <BotaoDescartar compacto className="-my-0.5 -mr-1" />
          </div>
        </Descartavel>
      )}
    </section>
  );
}
