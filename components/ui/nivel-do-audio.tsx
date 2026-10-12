"use client";

import { useEffect, useRef } from "react";

/**
 * AS BARRAS DO MICROFONE (12/10/2026, pedido do Bruno): "precisa colocar um
 * efeito (linhas de faixa de som) para o usuário saber que está funcionando
 * enquanto ele está gravando". Lê o volume do próprio stream da gravação
 * (AnalyserNode) e mexe a altura de cada barra direto no estilo, sem um
 * render por quadro. Sem stream ou sem Web Audio, as barras ficam paradas.
 */
export function NivelDoAudio({ stream, barras = 5, cor = "#fff", altura = 16 }: { stream: MediaStream | null; barras?: number; cor?: string; altura?: number }) {
  const refs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (!stream) return;
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return;
    const ctx = new Contexto();
    const analisador = ctx.createAnalyser();
    analisador.fftSize = 64;
    const fonte = ctx.createMediaStreamSource(stream);
    fonte.connect(analisador);
    const dados = new Uint8Array(analisador.frequencyBinCount);
    let quadro = 0;
    const desenhar = () => {
      analisador.getByteFrequencyData(dados);
      // Cada barra lê uma faixa de frequência da voz (as baixas e médias).
      const faixa = Math.max(1, Math.floor((dados.length * 0.6) / barras));
      for (let i = 0; i < barras; i++) {
        let soma = 0;
        for (let k = 0; k < faixa; k++) soma += dados[i * faixa + k] ?? 0;
        const nivel = Math.min(1, soma / faixa / 180);
        const el = refs.current[i];
        if (el) el.style.height = `${Math.max(15, Math.round(nivel * 100))}%`;
      }
      quadro = requestAnimationFrame(desenhar);
    };
    desenhar();
    return () => {
      cancelAnimationFrame(quadro);
      fonte.disconnect();
      void ctx.close().catch(() => undefined);
    };
  }, [stream, barras]);

  return (
    <span className="inline-flex items-end gap-[2px]" style={{ height: altura }} aria-hidden data-nivel-do-audio>
      {Array.from({ length: barras }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="w-[3px] rounded-full transition-[height] duration-75"
          style={{ height: "15%", background: cor }}
        />
      ))}
    </span>
  );
}
