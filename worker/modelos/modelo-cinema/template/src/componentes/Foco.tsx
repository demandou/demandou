import { prog, temposDasPalavras, useTempo, usePalavras } from "../anim";
import { encaixar, indicesDoTrecho, larguraPalavra, type Fonte } from "../medida";
import { cor, serif, sombra } from "../tema";

// Quebra uma sequência de palavras no menor número de linhas que cabe na largura (medida com as
// larguras reais da fonte), com as linhas de tamanho parecido — nunca uma palavra sozinha na
// última linha quando dá para evitar.
export const quebrarEmLinhas = <T extends { w: string }>(palavras: T[], tamanho: number, largura: number, fonte: Fonte = "serif"): T[][] => {
  if (palavras.length <= 1) return [palavras];
  const vao = 0.26 * tamanho;
  const larguras = palavras.map((p) => larguraPalavra(p.w, tamanho, fonte));
  const total = larguras.reduce((a, b) => a + b, 0) + vao * (palavras.length - 1);
  const n = Math.min(palavras.length, Math.max(1, Math.ceil(total / largura)));
  if (n <= 1) return [palavras];
  const linhaDe = (ps: number[]) => ps.reduce((a, i) => a + larguras[i], 0) + vao * Math.max(0, ps.length - 1);
  // todas as divisões possíveis em n linhas (as frases são curtas): fica a de linha mais longa menor
  let melhor: number[][] = [palavras.map((_, i) => i)];
  let pior = Infinity;
  const tentar = (inicio: number, linhas: number[][]) => {
    if (linhas.length === n - 1) {
      const todas = [...linhas, palavras.slice(inicio).map((_, k) => inicio + k)];
      const maior = Math.max(...todas.map(linhaDe));
      // penaliza palavra sozinha numa linha
      const multa = todas.some((l) => l.length === 1) ? largura * 0.12 : 0;
      if (maior + multa < pior) {
        pior = maior + multa;
        melhor = todas;
      }
      return;
    }
    for (let i = inicio + 1; i <= palavras.length - (n - 1 - linhas.length); i++) {
      tentar(i, [...linhas, Array.from({ length: i - inicio }, (_, k) => inicio + k)]);
    }
  };
  tentar(0, []);
  return melhor.map((l) => l.map((i) => palavras[i]));
};

// Texto em "foco de lente": a frase entra inteira, desfocada e apagada, e cada palavra ganha
// nitidez no instante em que é falada. É a assinatura do texto narrado no Cinema.
// `capa`: as palavras ainda não ditas já aparecem legíveis (sem desfoque) — usado no primeiro
// quadro do vídeo, que é a capa do Reel.
// Terminada a animação de uma palavra, ela é desenhada como texto simples (sem filtro nem camada extra).
export const LinhasEmFoco: React.FC<{
  linhas: { w: string; em: number }[][];
  entrada: number;
  estilo?: React.CSSProperties;
  estiloPalavra?: (w: string, i: number) => React.CSSProperties | undefined;
  capa?: boolean;
  alinhar?: "center" | "flex-start";
  vao?: number;
  extra?: (i: number) => React.ReactNode;
}> = ({ linhas, entrada, estilo, estiloPalavra, capa, alinhar = "center", vao = 0.26, extra }) => {
  const t = useTempo();
  const entra = capa ? 1 : prog(t, entrada - 0.14, 0.34);
  let indice = 0;
  return (
    // algarismos alinhados (os da Cormorant são "de texto" por padrão: "83" ficaria miúdo)
    <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar, opacity: entra, fontVariantNumeric: "lining-nums", ...estilo }}>
      {linhas.map((ps, li) => (
        <div key={li} style={{ display: "flex", whiteSpace: "nowrap" }}>
          {ps.map((p, k) => {
            const i = indice++;
            const nitida = prog(t, p.em - 0.06, 0.34);
            const base = capa ? 0.5 : 0.34;
            const borrao = capa ? 0 : (1 - nitida) * 4.5;
            return (
              <span
                key={k}
                // margem fixa entre palavras: o espaço dentro de spans animados some em alguns casos
                style={{
                  display: "inline-block",
                  position: "relative",
                  marginRight: k < ps.length - 1 ? `${vao}em` : 0,
                  opacity: nitida >= 0.999 ? undefined : base + (1 - base) * nitida,
                  filter: borrao > 0.01 ? `blur(${borrao.toFixed(2)}px)` : undefined,
                  ...estiloPalavra?.(p.w, i),
                }}
              >
                {p.w}
                {extra?.(i)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Um texto qualquer do plano, medido para caber na caixa (largura × altura, até `linhas` linhas,
// do corpo `max` ao `min`) e montado palavra por palavra no ritmo da fala, a partir de `em`.
// `destaque` = trecho em itálico âmbar; `risco` = trecho riscado (traço âmbar) em `riscoEm`, que
// depois esfria (cinza frio).
export type OpcoesDeTexto = {
  texto: string;
  em: number;
  // até quando procurar as palavras na fala (padrão: sem limite)
  limite?: number;
  largura: number;
  altura?: number;
  max: number;
  min: number;
  linhas?: number;
  entrelinha?: number;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  italico?: boolean;
  cor?: string;
  corDestaque?: string;
  capa?: boolean;
  alinhar?: "center" | "flex-start";
  sombra?: boolean;
  // quando o texto aparece (padrão: `em`) — permite segurar a entrada até as barras assentarem
  entrada?: number;
};

export const medirTexto = (o: Pick<OpcoesDeTexto, "texto" | "largura" | "altura" | "max" | "min" | "linhas" | "entrelinha" | "destaque" | "italico">) => {
  const textos = o.texto.split(/\s+/).filter(Boolean);
  const destacadas = indicesDoTrecho(textos, o.destaque);
  const fonteDe = (i: number): Fonte => (destacadas.has(i) ? "italico500" : o.italico ? "italico" : "serif");
  const enc = encaixar(textos, { largura: o.largura, altura: o.altura, max: o.max, min: o.min, linhas: o.linhas ?? 2, entrelinha: o.entrelinha ?? 1.12, fonteDe });
  return { textos, destacadas, ...enc, alturaFinal: enc.linhas.length * enc.tamanho * (o.entrelinha ?? 1.12) };
};

export const TextoEmFoco: React.FC<OpcoesDeTexto> = (o) => {
  const t = useTempo();
  const palavras = usePalavras();
  const { textos, destacadas, tamanho, linhas } = medirTexto(o);
  const tempos = temposDasPalavras(palavras, o.em, textos, o.limite ?? Infinity).map((x) => Math.max(x, o.entrada ?? -Infinity));
  const riscadas = indicesDoTrecho(textos, o.risco);
  const riscoEm = o.riscoEm ?? (riscadas.size ? tempos[Math.min(...riscadas)] + 0.3 : Infinity);
  const ordemRisco = [...riscadas].sort((a, b) => a - b);
  const montadas = linhas.map((l) => l.map((i) => ({ w: textos[i], em: tempos[i] })));
  return (
    <LinhasEmFoco
      linhas={montadas}
      entrada={o.entrada ?? o.em}
      capa={o.capa}
      alinhar={o.alinhar}
      estilo={{
        fontFamily: serif,
        fontWeight: 600,
        fontStyle: o.italico ? "italic" : undefined,
        fontSize: tamanho,
        lineHeight: o.entrelinha ?? 1.12,
        color: o.cor ?? cor.marfim,
        textShadow: o.sombra ? sombra : undefined,
      }}
      estiloPalavra={(_, i) => {
        const estilo: React.CSSProperties = {};
        if (destacadas.has(i)) Object.assign(estilo, { fontStyle: "italic", fontWeight: 500, color: o.corDestaque ?? cor.ambarClaro });
        if (riscadas.has(i)) {
          // depois de riscado, o trecho esfria (perde o calor do marfim)
          const apaga = prog(t, riscoEm + 0.4, 0.6);
          if (apaga > 0) Object.assign(estilo, { color: cor.frio, opacity: 1 - 0.3 * apaga });
        }
        return estilo;
      }}
      extra={(i) => {
        if (!riscadas.has(i)) return null;
        const k = ordemRisco.indexOf(i);
        const p = prog(t, riscoEm + k * 0.12, 0.45);
        if (p <= 0) return null;
        // o traço passa também pelo vão até a próxima palavra riscada da mesma linha (um risco contínuo)
        const proxima = ordemRisco[k + 1];
        const mesmaLinha = proxima !== undefined && linhas.some((l) => l.includes(i) && l.includes(proxima));
        return (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "56%",
              height: Math.max(4, Math.round(tamanho * 0.06)),
              width: mesmaLinha ? "calc(100% + 0.26em)" : "100%",
              background: cor.ambar,
              transformOrigin: "left center",
              scale: p >= 0.999 ? undefined : `${p.toFixed(3)} 1`,
              borderRadius: 2,
            }}
          />
        );
      }}
    />
  );
};
