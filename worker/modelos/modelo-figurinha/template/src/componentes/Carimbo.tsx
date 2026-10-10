// Carimbo de borracha: ✗ NÃO PODE (framboesa), ✓ PODE (verde) ou ! (alerta, framboesa). Cai de
// cima, maior, e para seco; a tinta tem falhas finas, como carimbo de verdade. O texto é livre
// ("RISCO", "SEM LIMITE", "TEM GENTE QUE PERDE"): o carimbo alarga e, se precisar, quebra em duas
// linhas, medido com a largura da fonte (nunca vaza).
import { useId } from "react";
import { batida, mistura, prog } from "../anim";
import { larguraLinha, larguraPalavra, type Medida, palavrasDe } from "../medida";
import { cor, rotulo } from "../tema";

const M: Medida = { tracking: 0.04, caixaAlta: true, espaco: 0.3 };
// no viewBox (altura 126): margem esquerda até o texto (círculo do ✗) e margem direita
const ANTES_DO_TEXTO = 100;
const DEPOIS_DO_TEXTO = 24;
const ALTURA_UTIL = 92;

// Encaixa o texto do carimbo: uma linha a 50 (no viewBox), ou menor, ou duas linhas equilibradas.
export const textoDoCarimbo = (palavra: string, larguraMax: number) => {
  const ws = palavrasDe(palavra.toUpperCase());
  const area = larguraMax - ANTES_DO_TEXTO - DEPOIS_DO_TEXTO;
  const uma = larguraLinha(ws, 1, M);
  const t1 = Math.min(50, area / Math.max(uma, 0.5));
  if (t1 >= 32 || ws.length < 2) return { linhas: [ws.join(" ")], tamanho: Math.max(20, t1), largura: Math.max(uma * Math.max(20, t1), Math.min(176, area)) };
  // duas linhas: o corte que deixa a linha mais larga o menor possível
  let melhor = { a: ws.slice(0, 1), b: ws.slice(1), w: Infinity };
  for (let k = 1; k < ws.length; k++) {
    const a = ws.slice(0, k);
    const b = ws.slice(k);
    const w = Math.max(larguraLinha(a, 1, M), larguraLinha(b, 1, M));
    if (w < melhor.w) melhor = { a, b, w };
  }
  const t2 = Math.min(ALTURA_UTIL / 2.15, area / melhor.w);
  if (t2 <= t1) return { linhas: [ws.join(" ")], tamanho: Math.max(20, t1), largura: uma * Math.max(20, t1) };
  return { linhas: [melhor.a.join(" "), melhor.b.join(" ")], tamanho: t2, largura: Math.max(melhor.w * t2, 150) };
};

export const Carimbo: React.FC<{
  t: number;
  em: number;
  // altura do carimbo em px (a largura sai do texto, até `larguraMax`)
  altura?: number;
  // compatibilidade: largura de referência (altura = 0,42 × largura) e limite padrão de largura
  largura?: number;
  larguraMax?: number;
  tipo?: "nao" | "pode" | "alerta";
  texto?: string;
  inclinacao?: number;
  // só o círculo com ✗/✓ (para as figurinhas pequenas da fileira)
  mini?: boolean;
  // já carimbado (sem animação)
  pronto?: boolean;
  // onde o carimbo se apoia: "esquerda" (padrão) ou "direita" (cresce para a esquerda)
  ancora?: "esquerda" | "direita";
  // esboço a lápis do carimbo (antes de ele bater): traço claro, sem tinta
  lapis?: boolean;
  style?: React.CSSProperties;
}> = ({ t, em, altura: alturaPx, largura = 440, larguraMax, tipo = "nao", texto, inclinacao = -11, mini = false, pronto = false, ancora = "esquerda", lapis = false, style }) => {
  const id = useId().replace(/:/g, "");
  if (!pronto && !lapis && t < em - 0.12) return null;
  // a mão desce (0,12 s) e o carimbo para seco no `em`
  const p = pronto || lapis ? 1 : prog(t, em - 0.12, 0.12, batida);
  const tinta = lapis ? cor.lapisClaro : tipo === "pode" ? cor.pode : cor.carimbo;
  const palavra = texto ?? (tipo === "pode" ? "PODE" : tipo === "alerta" ? "ATENÇÃO" : "NÃO PODE");
  const escala = mistura(1.55, 1, p);
  const opacidade = p < 1 ? mistura(0, 0.75, p) : 1;
  const marca =
    tipo === "pode" ? (
      <path d="M-15 1 L-4 12 L17 -12" fill="none" stroke={tinta} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    ) : tipo === "alerta" ? (
      <g>
        <path d="M0 -15 V4" fill="none" stroke={tinta} strokeWidth={8} strokeLinecap="round" />
        <circle cx={0} cy={15} r={4.6} fill={tinta} />
      </g>
    ) : (
      <path d="M-12 -12 L12 12 M12 -12 L-12 12" fill="none" stroke={tinta} strokeWidth={8} strokeLinecap="round" />
    );
  const textura = (
    <defs>
      <filter id={`grao-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed={7} result="ruido" />
        <feColorMatrix in="ruido" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -12 8.6" result="falhas" />
        <feComposite in="SourceGraphic" in2="falhas" operator="in" />
      </filter>
    </defs>
  );
  if (mini) {
    return (
      <svg
        viewBox="-50 -50 100 100"
        width={largura}
        height={largura}
        style={{ position: "absolute", rotate: `${inclinacao}deg`, scale: String(escala), opacity: opacidade, overflow: "visible", ...style }}
      >
        {textura}
        <g filter={`url(#grao-${id})`}>
          <circle r={42} fill="none" stroke={tinta} strokeWidth={6} />
          <circle r={33} fill="none" stroke={tinta} strokeWidth={2.5} />
          <g transform="scale(1.35)">{marca}</g>
        </g>
      </svg>
    );
  }
  const altura = alturaPx ?? largura * 0.42;
  // largura máxima no viewBox (altura 126)
  const maxVB = ((larguraMax ?? largura) / altura) * 126;
  const encaixe = textoDoCarimbo(palavra, maxVB);
  const W = Math.max(Math.min(300, maxVB) * (encaixe.linhas.length > 1 ? 0.9 : 1), ANTES_DO_TEXTO + encaixe.largura + DEPOIS_DO_TEXTO);
  const larguraPx = (W / 126) * altura;
  const centroTexto = ANTES_DO_TEXTO + (W - ANTES_DO_TEXTO - DEPOIS_DO_TEXTO) / 2;
  const dy = encaixe.tamanho * 1.06;
  return (
    <div
      style={{
        position: "absolute",
        width: larguraPx,
        height: altura,
        rotate: `${inclinacao}deg`,
        scale: String(escala),
        opacity: opacidade,
        ...(ancora === "direita" ? { transformOrigin: "100% 50%" } : {}),
        ...style,
      }}
    >
      <svg viewBox={`0 0 ${W} 126`} width={larguraPx} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {textura}
        <g filter={lapis ? undefined : `url(#grao-${id})`}>
          <rect x={4} y={4} width={W - 8} height={118} rx={22} fill="rgba(255,255,255,0.0)" stroke={tinta} strokeWidth={lapis ? 4 : 7} strokeDasharray={lapis ? "10 10" : undefined} />
          <rect x={14} y={14} width={W - 28} height={98} rx={14} fill="none" stroke={tinta} strokeWidth={2.5} />
          <circle cx={62} cy={63} r={30} fill="none" stroke={tinta} strokeWidth={5} />
          <g transform="translate(62 63)">{marca}</g>
          {encaixe.linhas.map((l, i) => (
            <text
              key={i}
              x={centroTexto}
              y={64 + (i - (encaixe.linhas.length - 1) / 2) * dy}
              textAnchor="middle"
              dominantBaseline="central"
              fill={tinta}
              style={{ ...rotulo(encaixe.tamanho), letterSpacing: "0.04em" }}
            >
              {l}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
};

// largura em px que um carimbo vai ocupar (para posicionar antes de desenhar)
export const larguraDoCarimbo = (texto: string, altura: number, larguraMax: number) => {
  const maxVB = (larguraMax / altura) * 126;
  const e = textoDoCarimbo(texto, maxVB);
  const W = Math.max(Math.min(300, maxVB) * (e.linhas.length > 1 ? 0.9 : 1), ANTES_DO_TEXTO + e.largura + DEPOIS_DO_TEXTO);
  return (W / 126) * altura;
};

export { larguraPalavra };
