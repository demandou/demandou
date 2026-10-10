"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Check, ChevronDown, Loader2, Play, Sparkles, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BotaoDescartar } from "@/components/ui/descartar";
import type { GrupoNaGrade, ModeloNaBiblioteca } from "@/lib/media/editor-do-curso/biblioteca";
import type { Recomendacao } from "@/lib/media/editor-do-curso/recomendacao";
import { PecasNoEstiloDoModelo } from "@/components/video/pecas-no-estilo-do-modelo";
import { MaterialDoModelo } from "@/components/video/material-do-modelo";

/**
 * O EDITOR NOVO NA BIBLIOTECA DE ESTILOS (09/10/2026, noite).
 *
 * Pedido do Bruno: "os novos estilos devem estar disponíveis na biblioteca para
 * o usuário escolher". Os modelos do curso viraram o editor dos cortes; aqui o
 * cliente vê a recomendação pelo perfil ("Baseado no seu perfil, recomendo"),
 * mantém ou muda, e escolhe na grade. Escolheu, os cortes verticais saem pelo
 * modelo e a linguagem de baixo (o editor de antes) fica de reserva.
 *
 * Quem pode ser escolhido vem do catálogo (`serve`, que é automático e tem a
 * versão vertical): quando um modelo passa a rodar sozinho, ele sobe para a
 * grade sem mudar nada aqui. Os outros aparecem apagados, com o que falta, como
 * "em breve".
 *
 * A GRADE EM GRUPOS (10/10): "3D e efeitos" primeiro, depois "Em destaque" e
 * depois todos os outros, liberados do mesmo jeito. A ordem e o grupo de cada
 * modelo vêm prontos da biblioteca (`grupo`, ordemDaGrade); aqui só se desenha.
 *
 * A ARTE nunca é quadro do exemplo do curso (são as pessoas do treinamento):
 * é o próprio modelo editando uma pessoa criada por IA (lib/media/editor-do-curso/
 * biblioteca.ts), e a tela diz isso. Sem arte, o cartão fica só com o texto.
 * Prévia em vídeo ainda não há; quando houver (`previa`), ela só carrega ao
 * passar o mouse ou tocar na imagem, uma por vez, cobrindo o quadro do meio.
 */

type Dados = {
  ligado: boolean;
  modelo: string | null;
  recomendacao: Recomendacao | null;
  pendente: boolean;
  modelos: ModeloNaBiblioteca[];
};

/** Quantos cartões do último grupo aparecem antes do "ver todos" (três linhas no celular). */
const VISIVEIS = 6;

/** A ordem dos grupos na grade. Os dois primeiros aparecem inteiros; o último abre no "ver todos". */
const GRUPOS: GrupoNaGrade[] = ["3d-e-efeitos", "destaque", "todos"];

const TITULO_DO_GRUPO: Record<GrupoNaGrade, string> = {
  "3d-e-efeitos": "3D e efeitos",
  destaque: "Em destaque",
  todos: "Mais modelos para os seus cortes",
};

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * O rótulo do editor de antes, logo abaixo desta seção: com um modelo em uso,
 * ele fica de reserva. `oQue` é o que a pessoa vê embaixo (a linguagem do
 * catálogo, ou o comando quando o editor por comando está ligado).
 */
export function RotuloDoEditorDeAntes({ modelo, oQue }: { modelo: { nome: string } | null; oQue: string }) {
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Editor de antes
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {modelo
          ? `Fica de reserva enquanto o modelo ${modelo.nome} estiver em uso: ${oQue} só monta um corte se o modelo não conseguir.`
          : `É ${oQue} que monta os seus cortes enquanto nenhum modelo do editor novo estiver escolhido.`}
      </p>
    </div>
  );
}

export function ModelosDoCurso({
  projectId,
  aoMudar,
  aoNaoGostar,
  reserva = "a linguagem escolhida mais abaixo",
}: {
  projectId: string;
  /** O modelo em uso (ou null), para o resto da tela dizer que a linguagem virou reserva. */
  aoMudar?: (modelo: { id: string; nome: string } | null) => void;
  /** Como a tela chama o editor de antes, que vira a reserva ("a linguagem escolhida mais abaixo", "o comando mais abaixo"). */
  reserva?: string;
  /** "Não gostei" das peças no estilo do modelo (10/10): quem chama abre a caixa de escrever ou narrar o próprio estilo. */
  aoNaoGostar?: () => void;
}) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [modelo, setModelo] = useState<string | null>(null);
  // A ordem da grade fica parada enquanto a pessoa escolhe: o escolhido ao abrir vai para o começo, e só.
  const [modeloAoAbrir, setModeloAoAbrir] = useState<string | null>(null);
  const [recomendacao, setRecomendacao] = useState<Recomendacao | null>(null);
  const [recomendando, setRecomendando] = useState(false);
  const [salvando, setSalvando] = useState<string | "nenhum" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroFechado, setErroFechado] = useState(false);
  const [tocando, setTocando] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const [verEmBreve, setVerEmBreve] = useState(false);
  const ponteiro = useRef<string>("mouse");
  const grade = useRef<HTMLDivElement | null>(null);
  // O modelo escolhido nesta visita: só ele leva o estilo para as peças na hora (ver PecasNoEstiloDoModelo).
  const [escolhidoAgora, setEscolhidoAgora] = useState<string | null>(null);
  const aoMudarRef = useRef(aoMudar);
  useEffect(() => {
    aoMudarRef.current = aoMudar;
  }, [aoMudar]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/modelo-do-curso`);
        if (!r.ok) throw new Error();
        const d = (await r.json()) as Dados;
        if (!vivo) return;
        setDados(d);
        setModelo(d.modelo);
        setModeloAoAbrir(d.modelo);
        setRecomendacao(d.recomendacao);
        if (!d.pendente) return;
        // A recomendação ainda não existe (ou o perfil mudou): o JEV decide agora, com a grade já na tela.
        // Falhou, a grade continua e só a recomendação não aparece (a tela não inventa uma).
        setRecomendando(true);
        const rp = await fetch(`/api/projects/${projectId}/modelo-do-curso`, { method: "POST" })
          .then((p) => (p.ok ? (p.json() as Promise<{ recomendacao: Recomendacao | null }>) : null))
          .catch(() => null);
        if (vivo) setRecomendacao(rp?.recomendacao ?? null);
      } catch {
        if (vivo) setFalhouCarregar(true);
      } finally {
        if (vivo) setRecomendando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [projectId]);

  // O resto da tela sabe qual editor vale.
  useEffect(() => {
    if (!dados) return;
    const m = dados.modelos.find((x) => x.id === modelo);
    aoMudarRef.current?.(m ? { id: m.id, nome: m.nome } : null);
  }, [dados, modelo]);

  async function escolher(id: string | null) {
    setSalvando(id ?? "nenhum");
    try {
      const r = await fetch(`/api/projects/${projectId}/modelo-do-curso`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo: id }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok || !d.ok) throw new Error(d.error);
      setModelo(id);
      setEscolhidoAgora(id);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não consegui guardar o modelo. Tente de novo.");
      setErroFechado(false);
    } finally {
      setSalvando(null);
    }
  }

  if (falhouCarregar) return null;
  if (!dados) {
    return (
      <div className="flex items-center gap-2 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando o editor novo
      </div>
    );
  }

  const porId = new Map(dados.modelos.map((m) => [m.id, m]));
  const emUso = modelo ? porId.get(modelo) ?? null : null;
  const recomendado = recomendacao ? porId.get(recomendacao.modelo) ?? null : null;
  const primeiro = [recomendacao?.modelo, modeloAoAbrir].filter((x): x is string => Boolean(x));
  // A ordem vem da biblioteca; no último grupo, o recomendado e o escolhido ao abrir vão para o começo (ficam à vista antes do "ver todos").
  const prontos = dados.modelos.filter((m) => m.serve);
  const doGrupo = (g: GrupoNaGrade) => {
    const lista = prontos.filter((m) => (m.grupo ?? "todos") === g);
    if (g !== "todos") return lista;
    return lista.sort((a, b) => {
      const ia = primeiro.indexOf(a.id);
      const ib = primeiro.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  };
  const grupos = GRUPOS.map((g) => ({ grupo: g, modelos: doGrupo(g) })).filter((g) => g.modelos.length > 0);
  const ultimo = grupos.at(-1);
  const escondidos = ultimo && ultimo.modelos.length > VISIVEIS ? ultimo.modelos.length - VISIVEIS : 0;
  const emBreve = dados.modelos.filter((m) => !m.serve);
  const temPrevia = dados.modelos.some((m) => m.previa);

  /**
   * A arte do cartão (três quadros do modelo com uma pessoa criada por IA). Sem arte, nada: o cartão
   * fica só com o texto. Com prévia em vídeo, ela toca por cima ao passar o mouse ou tocar.
   */
  const arte = (m: ModeloNaBiblioteca, apagada = false) => {
    if (!m.arte) return null;
    if (!m.previa) {
      return (
        <div className="relative aspect-[27/16] w-full overflow-hidden bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.arte}
            alt={`Exemplo do modelo ${m.nome}`}
            loading="lazy"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            className={cn("h-full w-full object-cover", apagada && "grayscale")}
          />
        </div>
      );
    }
    const previa = m.previa;
    const ativa = tocando === m.id;
    const alternar = () => setTocando((t) => (t === m.id ? null : m.id));
    return (
      <button
        type="button"
        aria-label={ativa ? `Parar a prévia do modelo ${m.nome}` : `Ver o modelo ${m.nome} em movimento`}
        aria-pressed={ativa}
        onPointerDown={(e) => (ponteiro.current = e.pointerType)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setTocando(m.id)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setTocando((t) => (t === m.id ? null : t))}
        // Toque e teclado alternam; o mouse já tocou ao entrar.
        onClick={(e: MouseEvent<HTMLButtonElement>) => (e.detail === 0 || ponteiro.current !== "mouse") && alternar()}
        className="group relative block aspect-[27/16] w-full overflow-hidden bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={m.arte}
          alt=""
          loading="lazy"
          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          className={cn("h-full w-full object-cover", apagada && !ativa && "grayscale")}
        />
        {ativa && (
          <>
            {m.formato === "9:16" && <span className="absolute inset-0 bg-black/50" aria-hidden="true" />}
            <video
              src={previa}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              className={m.formato === "9:16" ? "absolute inset-y-0 left-1/3 h-full w-1/3 object-cover" : "absolute inset-0 h-full w-full object-cover"}
            />
          </>
        )}
        {!ativa && (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <Play className="h-3 w-3" aria-hidden="true" /> prévia
          </span>
        )}
      </button>
    );
  };

  const cartao = (m: ModeloNaBiblioteca) => {
    const ativo = m.id === modelo;
    const ehRecomendado = m.id === recomendacao?.modelo;
    return (
      <div
        key={m.id}
        className={cn("relative flex flex-col overflow-hidden rounded-xl border", ativo && "ring-2 ring-orange-500", !m.serve && "opacity-60")}
        style={{ borderColor: ativo ? "var(--brand)" : "var(--border)", background: "var(--bg-surface)" }}
      >
        {arte(m, !m.serve)}
        {m.arte && ehRecomendado && (
          <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">para você</span>
        )}
        {m.arte && ativo && (
          <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div className="flex flex-1 flex-col p-2.5">
          {!m.arte && ehRecomendado && (
            <span className="mb-1 self-start rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">para você</span>
          )}
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
            {m.nome}
          </p>
          <p className="mt-1 line-clamp-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {m.resumo}
          </p>
          {/* O MATERIAL DO CLIENTE (10/10): o modelo que usa capturas, prints ou fotos diz isso antes da escolha. */}
          {m.serve && m.material && <p className="mt-1 text-[11px] font-medium text-orange-400">Usa material seu: {m.material.oQue}.</p>}
          <div className="mt-auto pt-2">
            {!m.serve ? (
              <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                {m.falta ?? "Em breve."}
              </p>
            ) : ativo ? (
              <span className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-orange-400">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Em uso nos seus cortes
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void escolher(m.id)}
                disabled={salvando !== null}
                className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition hover:border-orange-500 disabled:opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                {salvando === m.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Usar este modelo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section aria-labelledby="editor-novo" className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
      <div className="mb-3">
        <p id="editor-novo" className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Editor novo: modelos completos de edição
          <span className="rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">novo</span>
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Cada modelo é uma edição inteira, com visual próprio do primeiro ao último quadro, feita para os cortes verticais (Reels, TikTok e Shorts). As imagens
          mostram cada modelo com uma pessoa criada por IA; no seu vídeo, quem aparece é você.
          {temPrevia ? " Passe o mouse ou toque na imagem para ver o modelo em movimento." : ""}
        </p>
      </div>

      {/* O QUE VALE AGORA: o modelo em uso, ou o editor de antes. */}
      <div
        role="status"
        className="mb-3 rounded-lg border px-3 py-2.5 text-xs"
        style={{ borderColor: emUso ? "var(--brand)" : "var(--border)", background: "var(--bg-surface)", color: "var(--text-muted)" }}
      >
        {emUso ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 flex-1">
              Seus cortes verticais saem pelo modelo <b style={{ color: "var(--text-primary)" }}>{emUso.nome}</b>. {maiuscula(reserva)} fica de reserva: só entra se
              este modelo não conseguir montar um corte.
            </p>
            <button
              type="button"
              onClick={() => void escolher(null)}
              disabled={salvando !== null}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              {salvando === "nenhum" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />}
              Voltar ao editor de antes
            </button>
          </div>
        ) : (
          <p>Nenhum modelo escolhido: seus cortes seguem {reserva}, como antes.</p>
        )}
        {!dados.ligado && <p className="mt-1.5">O editor novo está sendo ligado. A sua escolha fica guardada e passa a valer assim que ele entrar no ar.</p>}
      </div>
      {/* O MATERIAL QUE O MODELO PEDE (10/10): sem o mínimo, a edição não começa e a caixa diz o que falta. */}
      {emUso?.material && <MaterialDoModelo key={emUso.id} projectId={projectId} modelo={{ id: emUso.id, nome: emUso.nome }} pedido={emUso.material} />}

      {/* AS PEÇAS NO ESTILO DO MODELO (10/10): escolheu o modelo, as artes, os carrosséis e os vídeos curtos seguem; a prévia sai no clique. */}
      {emUso && dados.ligado && (
        <PecasNoEstiloDoModelo
          projectId={projectId}
          modelo={{ id: emUso.id, nome: emUso.nome }}
          acabouDeEscolher={escolhidoAgora === emUso.id}
          aoNaoGostar={aoNaoGostar}
          aoTrocarModelo={() => {
            setVerTodos(true);
            grade.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      )}

      {/* A RECOMENDAÇÃO PELO PERFIL: o JEV decide; sem confiança, não aparece nada. */}
      {recomendando && (
        <p className="mb-3 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lendo o seu perfil para recomendar um modelo
        </p>
      )}
      {recomendacao && recomendado && (
        <div className="mb-4 overflow-hidden rounded-xl border sm:flex" style={{ borderColor: "var(--brand)", background: "var(--bg-surface)" }}>
          {recomendado.arte && <div className="sm:w-64 sm:shrink-0">{arte(recomendado)}</div>}
          <div className="flex-1 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Baseado no seu perfil, recomendo
            </p>
            <p className="mt-0.5 text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {recomendado.nome}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {recomendacao.motivo}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {modelo === recomendado.id ? (
                <span className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-orange-400">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" /> Em uso nos seus cortes
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void escolher(recomendado.id)}
                  disabled={salvando !== null}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-orange-500 px-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {salvando === recomendado.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  Usar este modelo
                </button>
              )}
              {emUso && emUso.id !== recomendado.id && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Hoje você usa o {emUso.nome}: pode manter ou trocar.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OS QUE JÁ SERVEM NOS CORTES, em grupos: 3D e efeitos, em destaque e os outros. */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        Prontos para os seus cortes ({prontos.length})
      </p>
      <div ref={grade} className="scroll-mt-4 space-y-4">
        {grupos.map(({ grupo, modelos }) => {
          const recolhe = grupo === ultimo?.grupo && !verTodos;
          return (
            <div key={grupo} role="group" aria-labelledby={`grupo-${grupo}`}>
              <p id={`grupo-${grupo}`} className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {TITULO_DO_GRUPO[grupo]}
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{(recolhe ? modelos.slice(0, VISIVEIS) : modelos).map((m) => cartao(m))}</div>
            </div>
          );
        })}
      </div>
      {escondidos > 0 && (
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          aria-expanded={verTodos}
          className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold sm:w-auto"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", verTodos && "rotate-180")} aria-hidden="true" />
          {verTodos ? "Mostrar menos" : `Ver todos os ${prontos.length} modelos`}
        </button>
      )}

      {/* OS QUE AINDA NÃO SERVEM: apagados, com o que falta. */}
      {emBreve.length > 0 && (
        <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => setVerEmBreve((v) => !v)}
            aria-expanded={verEmBreve}
            className="flex min-h-9 w-full items-center justify-between gap-2 text-left text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            <span>Em breve: mais {emBreve.length} modelos</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", verEmBreve && "rotate-180")} aria-hidden="true" />
          </button>
          {verEmBreve && (
            <>
              <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Estes ainda pedem um passo que não é automático, e cada cartão diz qual. A escolha abre quando o passo estiver pronto.
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{emBreve.map((m) => cartao(m))}</div>
            </>
          )}
        </div>
      )}

      {erro && !erroFechado && (
        <p role="alert" className="mt-3 flex items-start gap-1 text-xs text-orange-400">
          <span className="min-w-0 flex-1">{erro}</span>
          <BotaoDescartar compacto aoDescartar={() => setErroFechado(true)} />
        </p>
      )}
    </section>
  );
}
