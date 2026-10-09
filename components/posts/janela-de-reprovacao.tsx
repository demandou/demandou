"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, Square, ThumbsDown, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NOMES_DAS_REDES } from "@/lib/posts/estado";
import { CATEGORIAS_DE_REPROVACAO, validarMotivo, type CategoriaDeReprovacao, type EstadoDaReprovacao } from "@/lib/credits/reprovacao";

/**
 * A JANELA DO MOTIVO DA REPROVAÇÃO (decisão do Bruno em 08/10/2026).
 *
 * Reprovar passa a exigir motivo: a lista curta (gosto, pedi diferente, e os
 * erros da plataforma), o campo livre e o microfone (a mesma transcrição do
 * comando falado do vídeo, pela rota ./reprovar/voz). A janela diz, antes do
 * clique, o que cada caminho faz com o crédito: gosto mantém e refazer cobra;
 * erro é conferido e, confirmado, devolve.
 *
 * Uma janela para uma ou várias peças (o dia inteiro do quadro): o mesmo
 * motivo vale para todas, e cada uma recebe a própria conferência.
 */

export type AlvoDaReprovacao = { id: string; platform: string };

export type ResultadoNaTela = { id: string; estado: EstadoDaReprovacao; frase: string };

export function JanelaDeReprovacao({
  aberta,
  alvos,
  onFechar,
  onReprovado,
  verbo = "Reprovar",
}: {
  aberta: boolean;
  alvos: AlvoDaReprovacao[];
  onFechar: () => void;
  /** Chamado com o que deu certo (pode ser parcial); a janela já mostrou o erro do resto. */
  onReprovado: (resultados: ResultadoNaTela[]) => void | Promise<void>;
  /** "Rejeitar" no card (09/10): o post morre. A regra e a rota são as mesmas da reprovação. */
  verbo?: "Reprovar" | "Rejeitar";
}) {
  const [categoria, setCategoria] = useState<CategoriaDeReprovacao | null>(null);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const desmontado = useRef(false);

  useEffect(() => {
    desmontado.current = false;
    return () => {
      desmontado.current = true;
      gravador.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!aberta) {
      setCategoria(null);
      setTexto("");
      setOcupado(false);
    }
  }, [aberta]);

  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !ocupado) onFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberta, ocupado, onFechar]);

  /** Grava no navegador; ao parar, a fala vira texto no campo (a pessoa ainda edita). */
  async function alternarGravacao() {
    if (gravando) {
      gravador.current?.stop();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador não grava áudio. Escreva o motivo.");
      return;
    }
    const alvo = alvos[0];
    if (!alvo) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      pedacos.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) pedacos.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (desmontado.current) return;
        setGravando(false);
        const audio = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
        setTranscrevendo(true);
        try {
          const r = await fetch(`/api/posts/${alvo.id}/reprovar/voz`, { method: "POST", headers: { "Content-Type": audio.type }, body: audio });
          const d = (await r.json().catch(() => ({}))) as { texto?: string; error?: string };
          if (!r.ok || !d.texto) throw new Error(d.error || "Não consegui transcrever.");
          setTexto((t) => (t.trim() ? `${t.trim()} ${d.texto}` : d.texto!));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Não consegui transcrever.");
        } finally {
          setTranscrevendo(false);
        }
      };
      gravador.current = rec;
      rec.start();
      setGravando(true);
    } catch {
      toast.error("Não consegui usar o microfone. Escreva o motivo.");
    }
  }

  async function reprovar() {
    const v = validarMotivo({ categoria, texto });
    if (!v.ok) {
      toast.error(v.erro);
      return;
    }
    setOcupado(true);
    const resultados: ResultadoNaTela[] = [];
    const erros: string[] = [];
    // Uma por vez: cada reprovação roda as provas da peça (arte, lastro,
    // guarda), e quatro de uma vez multiplicariam o pico no gerador.
    for (const a of alvos) {
      try {
        const r = await fetch(`/api/posts/${a.id}/reprovar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoria: v.categoria, texto: v.texto }),
        });
        const d = (await r.json().catch(() => ({}))) as { estado?: EstadoDaReprovacao; frase?: string; error?: string };
        if (!r.ok || !d.estado) throw new Error(d.error || "Não consegui reprovar.");
        resultados.push({ id: a.id, estado: d.estado, frase: d.frase ?? "" });
      } catch (e) {
        erros.push(`${NOMES_DAS_REDES[a.platform] ?? a.platform}: ${e instanceof Error ? e.message : "não consegui reprovar"}`);
      }
    }
    if (erros.length) toast.error(erros.join(" · "));
    try {
      await onReprovado(resultados);
    } finally {
      if (!desmontado.current) setOcupado(false);
    }
  }

  const redes = alvos.map((a) => NOMES_DAS_REDES[a.platform] ?? a.platform);
  const classe = categoria ? CATEGORIAS_DE_REPROVACAO.find((c) => c.id === categoria)?.classe : null;

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => {
            if (!ocupado) onFechar();
          }}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-da-reprovacao"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border p-5 space-y-4"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", boxShadow: "var(--shadow)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="titulo-da-reprovacao" className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {alvos.length === 1 ? `${verbo} a peça de ${redes[0]}` : `${verbo} ${alvos.length} peças (${redes.join(", ")})`}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {verbo === "Rejeitar" ? "A peça rejeitada não sai mais. " : ""}Toda peça gerada é cobrada. Diga o motivo: erro da plataforma é conferido e, confirmado, devolve os créditos. Gosto mantém o crédito.
                  {verbo === "Rejeitar" ? " Para mudar a peça em vez de matar, use Pedir ajuste." : ""}
                </p>
              </div>
              <button type="button" onClick={onFechar} disabled={ocupado} aria-label="Fechar" className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--realce-2)]" style={{ color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <fieldset className="space-y-1.5">
              <legend className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Motivo
              </legend>
              {CATEGORIAS_DE_REPROVACAO.map((c) => {
                const ativo = categoria === c.id;
                return (
                  <label
                    key={c.id}
                    className={cn("flex items-start gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors", ativo ? "border-orange-500/60 bg-orange-500/5" : "hover:bg-[var(--realce-1)]")}
                    style={{ borderColor: ativo ? undefined : "var(--border)" }}
                  >
                    <input type="radio" name="motivo-da-reprovacao" value={c.id} checked={ativo} onChange={() => setCategoria(c.id)} className="mt-1 accent-orange-500" />
                    <span className="min-w-0">
                      <span className="block text-sm" style={{ color: "var(--text-primary)" }}>
                        {c.nome}
                      </span>
                      <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {c.dica}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="texto-da-reprovacao" className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                O que saiu errado{categoria === "outro" ? "" : " (opcional)"}
              </label>
              <div className="flex gap-2 items-start">
                <textarea
                  id="texto-da-reprovacao"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={gravando ? "Gravando: fale o que saiu errado e toque em Parar" : "Ex.: o número 61% não está na pesquisa; a frase da arte saiu cortada em cima"}
                  className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none resize-none"
                  style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <button
                  type="button"
                  onClick={() => void alternarGravacao()}
                  disabled={ocupado || transcrevendo}
                  aria-label={gravando ? "Parar e transcrever" : "Falar o motivo"}
                  title={gravando ? "Parar e transcrever" : "Falar o motivo"}
                  className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border disabled:opacity-50"
                  style={gravando ? { background: "#dc2626", borderColor: "#dc2626", color: "#fff" } : { borderColor: "#f97316", color: "#f97316" }}
                >
                  {transcrevendo ? <Loader2 className="h-4 w-4 animate-spin" /> : gravando ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              {classe && (
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {classe === "gosto" ? "O crédito desta peça fica, e refazer cobra como uma peça nova." : "Vamos conferir contra as provas automáticas. Erro confirmado devolve os créditos na hora; se não confirmar, um admin decide e você recebe a resposta."}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1" onClick={() => void reprovar()} loading={ocupado} disabled={!categoria || gravando || transcrevendo}>
                <ThumbsDown className="w-3.5 h-3.5 mr-1" />
                {alvos.length === 1 ? verbo : `${verbo} ${alvos.length} peças`}
              </Button>
              <Button variant="outline" onClick={onFechar} disabled={ocupado}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
