"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Check, Eye, Loader2, Mic, Pencil, RefreshCw, Sparkles, Square, Wand2 } from "lucide-react";
import { fichaDaFonte } from "@/lib/media/editor-por-comando/comando";
import {
  EVENTO_DO_ESTILO_CONFIRMADO,
  fichaDaPeca,
  frasesDaCaixa,
  MINIMO_DA_FALA,
  MINIMO_DO_AJUSTE,
  urlDaPreviaNaTela,
  type ConfirmadoDoMeuEstilo,
  type DetalheDoEstiloConfirmado,
  type RodadaDoMeuEstilo,
} from "@/lib/estilo-proprio/tipos";

/**
 * A CAIXA "CRIE O SEU ESTILO" (08/10/2026). Pedido do Bruno, testando como
 * cliente: "tinha que ser uma caixa igual à do ChatGPT: escreva aqui o seu
 * estilo, como você é, numa das primeiras telas. A própria IA gera uma thumb
 * e aquelas peças, o usuário vê se é mais ou menos aquilo; se ele falar que
 * é, isso treina o modelo para editar os vídeos e gerar os posts daquela
 * forma. O usuário nunca vai descrever um prompt perfeito: a IA tem que
 * captar a ideia dele."
 *
 * Mora no TOPO do passo do estilo da jornada (antes da grade de estilos
 * prontos) e em Configurações > Estilo dos posts. Fala só com
 * /api/projects/[id]/meu-estilo (e ./voz para o microfone).
 *
 * O que o cliente vê é o RESUMO em linguagem simples, nunca o comando
 * técnico. As prévias saem sem texto do modelo de imagem; o título de
 * exemplo entra aqui em código, na letra e nas cores da marca (texto em
 * camada, regra de 07/10).
 */

type Rodada = Omit<RodadaDoMeuEstilo, "custoUsd">;
type Estado = { rodadas: Rodada[]; confirmado: ConfirmadoDoMeuEstilo | null; nicho: string | null; cores: { acento: string; escuro: string; claro: string }; comPerfil: boolean; creditosDasPrevias: number; podeConfirmar: boolean };

const CORES_PADRAO = { acento: "#F97316", escuro: "#15171a", claro: "#f2efe8" };

export function CaixaDoMeuEstilo({ projectId, aoConfirmar, compacta = false }: { projectId: string; aoConfirmar?: (c: ConfirmadoDoMeuEstilo) => void; compacta?: boolean }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [texto, setTexto] = useState("");
  const [frase, setFrase] = useState(0);
  const [escrevendo, setEscrevendo] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [ajustando, setAjustando] = useState(false);
  const [aberta, setAberta] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const caixa = useRef<HTMLTextAreaElement>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}/meu-estilo`, { cache: "no-store" });
      const d = (await r.json().catch(() => ({}))) as Estado & { error?: string };
      if (!r.ok) throw new Error(d.error || "Não consegui ler o seu estilo.");
      setEstado({ ...d, cores: d.cores ?? CORES_PADRAO });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui ler o seu estilo.", { id: "meu-estilo" });
    }
  }, [projectId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // O placeholder rotativo: o convite e os exemplos do nicho, um a cada 4 s, só com a caixa vazia.
  const frases = frasesDaCaixa(estado?.nicho);
  useEffect(() => {
    if (texto) return;
    const t = setInterval(() => setFrase((f) => (f + 1) % frases.length), 4000);
    return () => clearInterval(t);
  }, [texto, frases.length]);

  const rodada = estado?.rodadas[estado.rodadas.length - 1] ?? null;
  const confirmado = estado?.confirmado ?? null;
  const estaConfirmada = Boolean(rodada && confirmado && confirmado.rodada === rodada.n);
  const ocupado = escrevendo || gerando || confirmando || transcrevendo;
  const minimo = ajustando ? MINIMO_DO_AJUSTE : MINIMO_DA_FALA;

  async function escrever(fala: string, origem: "escrito" | "voz") {
    const limpa = fala.replace(/\s+/g, " ").trim();
    if (limpa.length < minimo) {
      toast.error(ajustando ? "Diga o que quer mudar, nem que seja uma palavra." : "Conte com pelo menos uma frase: quem você é e como quer as suas peças.", { id: "meu-estilo" });
      return;
    }
    setEscrevendo(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/meu-estilo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "escrever", fala: limpa, ajuste: ajustando, origem }) });
      const d = (await r.json().catch(() => ({}))) as { rodada?: Rodada; error?: string };
      if (!r.ok || !d.rodada) throw new Error(d.error || "Não consegui escrever o seu estilo.");
      setEstado((e) => (e ? { ...e, rodadas: [...e.rodadas, d.rodada!] } : e));
      setTexto("");
      setAjustando(false);
      setAberta(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui escrever o seu estilo.", { id: "meu-estilo" });
    } finally {
      setEscrevendo(false);
    }
  }

  async function verComoFica() {
    if (!rodada) return;
    setGerando(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/meu-estilo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "previas", rodada: rodada.n }) });
      const d = (await r.json().catch(() => ({}))) as { rodada?: Rodada; avisos?: string[]; error?: string };
      if (!r.ok || !d.rodada) throw new Error(d.error || "Não consegui gerar as prévias.");
      const pronta = d.rodada;
      setEstado((e) => (e ? { ...e, rodadas: e.rodadas.map((x) => (x.n === pronta.n ? pronta : x)) } : e));
      if (!pronta.previas?.length) toast.error("As prévias saíram fora do estilo e foram descartadas. Ajuste a descrição e tente de novo.", { id: "meu-estilo", duration: 7000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui gerar as prévias.", { id: "meu-estilo", duration: 7000 });
    } finally {
      setGerando(false);
    }
  }

  async function confirmar() {
    if (!rodada) return;
    setConfirmando(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/meu-estilo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "confirmar", rodada: rodada.n }) });
      const d = (await r.json().catch(() => ({}))) as { confirmado?: ConfirmadoDoMeuEstilo; error?: string };
      if (!r.ok || !d.confirmado) throw new Error(d.error || "Não consegui confirmar o seu estilo.");
      setEstado((e) => (e ? { ...e, confirmado: d.confirmado! } : e));
      setAberta(false);
      toast.success("É o seu estilo. A edição do vídeo, as artes, o carrossel e o vídeo por IA saem nele.", { id: "meu-estilo", duration: 7000 });
      aoConfirmar?.(d.confirmado);
      // O comando do vídeo e o estilo dos posts na mesma tela releem o que ficou gravado.
      window.dispatchEvent(new CustomEvent<DetalheDoEstiloConfirmado>(EVENTO_DO_ESTILO_CONFIRMADO, { detail: { projectId } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui confirmar o seu estilo.", { id: "meu-estilo" });
    } finally {
      setConfirmando(false);
    }
  }

  async function alternarGravacao() {
    if (gravando) {
      gravador.current?.stop();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador não grava áudio. Escreva o seu estilo.", { id: "meu-estilo" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      pedacos.current = [];
      rec.ondataavailable = (e) => e.data.size && pedacos.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setGravando(false);
        const audio = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
        setTranscrevendo(true);
        try {
          const r = await fetch(`/api/projects/${projectId}/meu-estilo/voz`, { method: "POST", headers: { "Content-Type": audio.type }, body: audio });
          const d = (await r.json().catch(() => ({}))) as { texto?: string; error?: string };
          if (!r.ok || !d.texto) throw new Error(d.error || "Não consegui transcrever.");
          setTranscrevendo(false);
          const junto = texto.trim() ? `${texto.trim()} ${d.texto}` : d.texto;
          setTexto(junto);
          await escrever(junto, "voz");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Não consegui transcrever.", { id: "meu-estilo" });
        } finally {
          setTranscrevendo(false);
        }
      };
      gravador.current = rec;
      rec.start();
      setGravando(true);
    } catch {
      toast.error("Não consegui abrir o microfone. Confira a permissão do navegador, ou escreva.", { id: "meu-estilo" });
    }
  }

  const cores = estado?.cores ?? CORES_PADRAO;
  const letra = rodada ? fichaDaFonte(rodada.fonte) : fichaDaFonte("geist");
  // A caixa aparece sem estilo escrito, ao ajustar, e na volta à tela com uma rodada sem prévias e sem confirmar (dá para começar de novo).
  const mostrarCaixa = !rodada || ajustando || (!aberta && !estaConfirmada && !rodada.previas);
  const mostrarRodada = rodada && (aberta || !estaConfirmada) && !ajustando;

  return (
    <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "#f97316", background: "var(--bg-surface)" }} aria-labelledby={`meu-estilo-${projectId}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 id={`meu-estilo-${projectId}`} className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            <Wand2 className="h-4 w-4 text-orange-500" /> Crie o seu estilo
            {estaConfirmada && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#16a34a" }}>
                É o seu estilo
              </span>
            )}
          </h3>
          {!compacta && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Fale ou escreva do seu jeito, sem prompt: a IA entende a ideia, escreve o estilo completo e mostra como a thumb, o post, o vídeo vertical e o carrossel ficam. Você confirma, e tudo passa a sair assim.
            </p>
          )}
        </div>
        {estaConfirmada && !aberta && (
          <button type="button" onClick={() => setAberta(true)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <Pencil className="h-3.5 w-3.5" /> Ver ou mudar
          </button>
        )}
      </div>

      {estaConfirmada && !aberta && confirmado && (
        <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>
          {confirmado.resumo}
        </p>
      )}

      {mostrarCaixa && (
        <div className="space-y-2">
          {ajustando && (
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              O que você quer mudar? ("mais luz", "sem estúdio", "menos texto na tela")
            </p>
          )}
          <div className="relative">
            <textarea
              ref={caixa}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !ocupado && !gravando) {
                  e.preventDefault();
                  void escrever(texto, "escrito");
                }
              }}
              rows={compacta ? 3 : 4}
              maxLength={1500}
              disabled={ocupado}
              placeholder={gravando ? "Gravando: fale como você é e como quer as suas peças, e toque no quadrado para parar" : ajustando ? "Ex.: mais luz, nada de estúdio, azul mais claro" : frases[frase % frases.length]}
              aria-label="Descreva o seu estilo do seu jeito"
              className="w-full resize-y rounded-xl border px-4 py-3 pr-14 text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60"
              style={{ borderColor: "var(--border)", background: "var(--bg-input)", color: "var(--text-primary)" }}
            />
            <button
              type="button"
              onClick={() => void alternarGravacao()}
              disabled={escrevendo || transcrevendo}
              aria-label={gravando ? "Parar e mandar o que eu falei" : "Falar o meu estilo"}
              title={gravando ? "Parar e mandar" : "Falar o meu estilo"}
              className="absolute right-3 top-3 rounded-full p-2.5 disabled:opacity-50"
              style={{ background: gravando ? "#dc2626" : "var(--bg-surface)", color: gravando ? "#fff" : "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              {transcrevendo ? <Loader2 className="h-4 w-4 animate-spin" /> : gravando ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {escrevendo ? "Escrevendo o seu estilo (leva uns segundos)" : transcrevendo ? "Ouvindo o que você falou" : estado?.comPerfil ? "Uso também a leitura do seu perfil nas redes." : "Quanto mais você contar (ambiente, luz, cores, o que não pode faltar), melhor sai."}
            </p>
            <div className="flex items-center gap-2">
              {ajustando && (
                <button type="button" onClick={() => setAjustando(false)} disabled={ocupado} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  Cancelar
                </button>
              )}
              <button type="button" onClick={() => void escrever(texto, "escrito")} disabled={ocupado || gravando || texto.trim().length < minimo} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {escrevendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {ajustando ? "Refazer com isso" : "Criar o meu estilo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarRodada && rodada && (
        <div className="space-y-3 rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
          <div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {rodada.estilo.resumo}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {rodada.estilo.pontos.map((p) => (
                <li key={p} className="rounded-full border px-2.5 py-1 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                  {p}
                </li>
              ))}
              {rodada.estilo.evitar.map((p) => (
                <li key={`nao-${p}`} className="rounded-full border px-2.5 py-1 text-[11px] line-through" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {p}
                </li>
              ))}
            </ul>
            {rodada.escritoPor === "reserva" && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                Esta é uma versão simples, escrita sem a IA de texto agora. Dá para ver como fica e ajustar mesmo assim.
              </p>
            )}
          </div>

          {rodada.previas && rodada.previas.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {rodada.previas.map((p) => {
                const f = fichaDaPeca(p.peca);
                return (
                  <figure key={p.peca} className="min-w-0">
                    <div className="relative overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)", aspectRatio: `${f.largura} / ${f.altura}`, background: "var(--bg-input)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlDaPreviaNaTela(projectId, p.url)} alt={f.rotulo} className="absolute inset-0 h-full w-full object-cover" />
                      {f.comTitulo && (
                        <div className="absolute inset-x-0 bottom-0 p-2" style={{ background: `linear-gradient(transparent, ${cores.escuro}cc)` }}>
                          <span className="block text-[11px] font-bold leading-tight sm:text-xs" style={{ fontFamily: letra.amostraCss, fontWeight: letra.amostraPeso, textTransform: letra.caixaAlta ? "uppercase" : "none", color: cores.claro }}>
                            {rodada.estilo.titulo}
                            <span className="ml-1 inline-block h-1.5 w-6 rounded-sm align-middle" style={{ background: cores.acento }} />
                          </span>
                        </div>
                      )}
                    </div>
                    <figcaption className="mt-1 truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {f.rotulo}
                      {p.conferida ? "" : " (sem conferir)"}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
          {rodada.previas && rodada.previasTiradas && rodada.previasTiradas.length > 0 && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {rodada.previasTiradas.map((p) => fichaDaPeca(p).rotulo).join(", ")}: a prévia saiu fora do estilo e foi descartada.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!rodada.previas && (
              <button type="button" onClick={() => void verComoFica()} disabled={ocupado} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50" style={{ borderColor: "#f97316", color: "#f97316" }}>
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} {gerando ? "Gerando as prévias (até uns minutos)" : `Ver como fica (até ${estado?.creditosDasPrevias ?? 80} créditos)`}
              </button>
            )}
            {estado?.podeConfirmar ? (
              <button type="button" onClick={() => void confirmar()} disabled={ocupado || estaConfirmada} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {confirmando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {estaConfirmada ? "É o seu estilo" : "É isso"}
              </button>
            ) : (
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Só o dono da conta confirma o estilo do projeto.
              </span>
            )}
            <button type="button" onClick={() => setAjustando(true)} disabled={ocupado} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
              <RefreshCw className="h-4 w-4" /> Ajustar
            </button>
            {estaConfirmada && (
              <button type="button" onClick={() => setAberta(false)} className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                Fechar
              </button>
            )}
          </div>
          {!rodada.previas && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              As prévias são geradas pelo melhor modelo de imagem e conferidas antes de aparecer; o que não for usado volta para o seu saldo. Dá para confirmar sem ver.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
