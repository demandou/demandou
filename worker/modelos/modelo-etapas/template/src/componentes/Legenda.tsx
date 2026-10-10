// A legenda do Etapas: minúscula, branca, sem caixa, sem cor de destaque, com sombra suave, 2 a 3
// palavras por vez (uma linha só). Posição: sempre logo abaixo do queixo (nunca cobre a boca), em qualquer modo. Troca seca, sem animação.
import { useCurrentFrame, useVideoConfig } from "remotion";
import { montarFrases, type Frase } from "../motor/frases";
import { encaixar, larguraTexto } from "../medida";
import type { Momento, Plano } from "../plano";
import { COR, FONTE, SOMBRA_TEXTO, legendaTopo, modoEm } from "../tema";
import { multNoTempo } from "../camera";

// No Etapas a legenda fica em todo o vídeo (padrão true); `legenda: false` desliga num momento.
export const legendaNoMomento = (m: Momento) => m.legenda ?? true;

type Pedaco = { de: number; ate: number; texto: string };
const guardadas = new WeakMap<object, Pedaco[]>();

// quebra cada frase do motor em pedaços de até 3 palavras e ~24 letras
const pedacosDo = (plano: Plano): Pedaco[] => {
  const salvo = guardadas.get(plano);
  if (salvo) return salvo;
  const frases: Frase[] = montarFrases({ ...plano, momentos: plano.momentos.map((m) => ({ ...m, legenda: legendaNoMomento(m) })) });
  const saida: Pedaco[] = [];
  for (const f of frases) {
    const ws = f.palavras.flatMap((p) => p.w.split(/\s+/).filter(Boolean).map((w) => ({ em: p.em, ate: p.ate, w: w.replace(/^[“"]+|[”"]+$/g, (q) => q) })));
    let atual: typeof ws = [];
    const fechar = () => {
      if (!atual.length) return;
      saida.push({ de: atual[0].em, ate: atual[atual.length - 1].ate, texto: atual.map((x) => x.w).join(" ").toLowerCase() });
      atual = [];
    };
    ws.forEach((w, i) => {
      const tentativa = [...atual, w].map((x) => x.w).join(" ");
      if (atual.length >= 3 || (atual.length >= 2 && tentativa.length > 24)) fechar();
      atual.push(w);
      const quebra = /[.?!,;:…]$/.test(w.w) && atual.length >= 2;
      if (quebra || i === ws.length - 1) fechar();
    });
  }
  // cada pedaço dura até o próximo começar (sem piscar), no máximo 0,9 s depois da última palavra
  saida.forEach((p, i) => {
    const prox = saida[i + 1];
    p.ate = prox ? Math.min(Math.max(p.ate, prox.de - 0.0001), p.ate + 0.9) : p.ate + 0.2;
    if (prox && p.ate > prox.de) p.ate = prox.de;
  });
  guardadas.set(plano, saida);
  return saida;
};

export const Legenda: React.FC<{ plano: Plano }> = ({ plano }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ped = pedacosDo(plano).find((f) => t >= f.de - 0.02 && t < f.ate);
  if (!ped) return null;
  const modo = modoEm(plano, t);
  const topo = legendaTopo(plano, modo, multNoTempo(plano, t));
  const fit = encaixar(ped.texto, { largura: 880, max: 52, min: 36, linhas: 1, fonte: { peso: 700 } });
  const w = larguraTexto(ped.texto, fit.tamanho, { peso: 700, exato: true });
  return (
    <div style={{ position: "absolute", left: 0, top: topo, width: 1080, height: 70, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: fit.tamanho, color: COR.branco, textShadow: SOMBRA_TEXTO, whiteSpace: "nowrap", width: w + 4, textAlign: "center" }}>{ped.texto}</div>
    </div>
  );
};
