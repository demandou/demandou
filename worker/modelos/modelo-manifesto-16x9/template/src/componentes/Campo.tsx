import { APERTO, display, QUADRO } from "../tema";

// O campo de cor do pôster, vazado nas letras da palavra-janela: o vídeo da pessoa (que fica por
// baixo de tudo) aparece em cor dentro das letras. Fora delas o campo é sólido; só em volta do rosto
// uma `luz` suave (quando as letras já abriram) deixa o rosto aparecer pelos vãos das letras.
// Antes de abrir, a palavra já está no campo "a lápis" (o esboço apagado, no lugar dela).
export type Vazado = {
  linhas: { texto: string; base: number }[];
  tamanho: number;
  // centro horizontal das letras (no quadro deitado a janela fica de um lado)
  cx: number;
  // 0 = letras fechadas (só o esboço), 1 = letras abertas
  abertura: number;
  // escala das letras em volta de `origem` (chegada e batidas)
  escala: number;
  origem: { x: number; y: number };
  // sem palavra: a pessoa aparece num círculo de borda seca (o mesmo do mergulho de saída)
  circulo?: { cx: number; cy: number; r: number };
};

export type Luz = { x: number; y: number; rx: number; ry: number; forca: number };

const Letras: React.FC<{ v: Vazado; cor: string; opacidade: number; escala?: number; contorno?: boolean }> = ({ v, cor, opacidade, escala = v.escala, contorno }) => (
  <g transform={`translate(${v.origem.x} ${v.origem.y}) scale(${escala}) translate(${-v.origem.x} ${-v.origem.y})`}>
    {v.circulo ? (
      contorno ? (
        // o esboço do círculo: um traço a lápis no lugar onde ele vai abrir
        <circle cx={v.circulo.cx} cy={v.circulo.cy} r={v.circulo.r} fill="none" stroke={cor} strokeOpacity={opacidade} strokeWidth={6} />
      ) : (
        <circle cx={v.circulo.cx} cy={v.circulo.cy} r={v.circulo.r} fill={cor} fillOpacity={opacidade} />
      )
    ) : null}
    {v.linhas.map((l) => (
      <text
        key={`${l.texto}-${l.base}`}
        // o espaçamento negativo entra também depois da última letra: compensa no centro
        x={v.cx - (APERTO * v.tamanho) / 2}
        y={l.base}
        textAnchor="middle"
        fontFamily={display}
        fontWeight={900}
        fontSize={v.tamanho}
        letterSpacing={APERTO * v.tamanho}
        fill={cor}
        fillOpacity={opacidade}
      >
        {l.texto}
      </text>
    ))}
  </g>
);

export const Campo: React.FC<{
  id: string;
  cor: string;
  // cor do esboço da palavra antes de abrir
  lapis: string;
  // quanto da pessoa aparece atrás do campo inteiro (padrão 0 = sólido; no máximo 0,08)
  fantasma?: number;
  luz?: Luz;
  vazados: Vazado[];
  // pôster dividido (comparação): abaixo de `y`, o campo tem a outra cor
  divisao?: { y: number; cor: string };
}> = ({ id, cor, lapis, fantasma = 0, luz, vazados, divisao }) => {
  const limpo = id.replace(/[^a-zA-Z0-9]/g, "");
  const mascara = `mascara-${limpo}`;
  const gradiente = `luz-${limpo}`;
  // na máscara, branco = campo inteiro; cinza = campo ralo (o rosto aparece); preto = vazado
  const forca = luz ? Math.max(0, Math.min(1, luz.forca)) : 0;
  const cinza = Math.round(255 * (1 - forca));
  return (
    <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        {luz && forca > 0 ? (
          <radialGradient
            id={gradiente}
            gradientUnits="userSpaceOnUse"
            cx={luz.x}
            cy={luz.y}
            r={luz.rx}
            gradientTransform={`translate(${luz.x} ${luz.y}) scale(1 ${luz.ry / luz.rx}) translate(${-luz.x} ${-luz.y})`}
          >
            <stop offset="0" stopColor={`rgb(${cinza},${cinza},${cinza})`} />
            <stop offset="0.5" stopColor={`rgb(${cinza},${cinza},${cinza})`} />
            <stop offset="1" stopColor="white" />
          </radialGradient>
        ) : null}
        <mask id={mascara} maskUnits="userSpaceOnUse" x={0} y={0} width={QUADRO.w} height={QUADRO.h}>
          <rect x={0} y={0} width={QUADRO.w} height={QUADRO.h} fill={luz && forca > 0 ? `url(#${gradiente})` : "white"} />
          {vazados.map((v, i) => (v.abertura > 0 ? <Letras key={i} v={v} cor="black" opacidade={Math.min(1, v.abertura)} /> : null))}
        </mask>
      </defs>
      <rect x={0} y={0} width={QUADRO.w} height={divisao ? divisao.y : QUADRO.h} fill={cor} opacity={1 - Math.min(0.08, fantasma)} mask={`url(#${mascara})`} />
      {divisao ? (
        <rect x={0} y={divisao.y} width={QUADRO.w} height={QUADRO.h - divisao.y} fill={divisao.cor} opacity={1 - Math.min(0.08, fantasma)} mask={`url(#${mascara})`} />
      ) : null}
      {/* o esboço da palavra, parado no lugar onde ela vai abrir */}
      {/* (a palavra-janela é enorme: o esboço dela fica mais leve que o das linhas) */}
      {vazados.map((v, i) =>
        v.abertura < 1 ? <Letras key={`l${i}`} v={v} escala={1} cor={lapis} opacidade={0.75 * (1 - Math.min(1, v.abertura))} contorno={!!v.circulo} /> : null,
      )}
    </svg>
  );
};
