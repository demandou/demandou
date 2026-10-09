"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import toast from "react-hot-toast";

/**
 * O MICROFONE DO CHAT DO CARD (09/10/2026): o chat só aceitava texto. Grava no
 * navegador; ao parar, o áudio vai à rota de transcrição (`url`) e o texto
 * volta para o campo, onde a pessoa ainda edita antes de pedir o ajuste. A
 * mesma gravação da janela de reprovação (components/posts/janela-de-reprovacao.tsx).
 */
export function BotaoDeFala({ url, onTexto, desabilitado, rotulo = "Falar o ajuste" }: { url: string; onTexto: (texto: string) => void; desabilitado?: boolean; rotulo?: string }) {
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

  async function alternar() {
    if (gravando) {
      gravador.current?.stop();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Este navegador não grava áudio. Escreva o ajuste.");
      return;
    }
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
          const r = await fetch(url, { method: "POST", headers: { "Content-Type": audio.type }, body: audio });
          const d = (await r.json().catch(() => ({}))) as { texto?: string; error?: string };
          if (!r.ok || !d.texto) throw new Error(d.error || "Não consegui transcrever.");
          onTexto(d.texto);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Não consegui transcrever.");
        } finally {
          if (!desmontado.current) setTranscrevendo(false);
        }
      };
      gravador.current = rec;
      rec.start();
      setGravando(true);
    } catch {
      toast.error("Não consegui usar o microfone. Escreva o ajuste.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void alternar()}
      disabled={desabilitado || transcrevendo}
      aria-label={gravando ? "Parar e transcrever" : rotulo}
      title={gravando ? "Parar e transcrever" : rotulo}
      data-botao-de-fala
      className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border disabled:opacity-50"
      style={gravando ? { background: "#dc2626", borderColor: "#dc2626", color: "#fff" } : { borderColor: "#f97316", color: "#f97316" }}
    >
      {transcrevendo ? <Loader2 className="h-4 w-4 animate-spin" /> : gravando ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
