// Peças comuns dos blocos universais, todas na linguagem da prancha: a etiqueta de espécime com
// várias linhas, o medalhão (número romano num círculo de pena), os selos ✗ e ✓, a etiqueta
// "ILUSTRATIVO" e a escrita de um texto que nasce a lápis e ganha tinta na fala.
import { Escrita, limitar, misturarCor, prog, Traco } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Palavra } from "../plano";
import { cor, serif, traco, versalete } from "../tema";
import { romano } from "./Cabecalho";

// ——— etiqueta de espécime de várias linhas (itens de lista, opções, legendas de gráfico) ———

export type MedidaEtiqueta = { tamanho: number; linhas: string[]; detalhe?: { tamanho: number; linhas: string[] }; largura: number; altura: number };

const CIRCULO = 52;
const PAD_X = 20;
const PAD_Y = 14;

// Quanto a etiqueta ocupa para um texto (o texto encolhe de `max` até `min` e quebra em até 2 linhas).
export const medirEtiquetaDeItem = (
  texto: string,
  larguraMax: number,
  { max = 56, min = 42, detalhe, comNumero = true }: { max?: number; min?: number; detalhe?: string; comNumero?: boolean } = {},
): MedidaEtiqueta => {
  const livre = larguraMax - (comNumero ? CIRCULO + 16 : 0) - PAD_X * 2;
  const e = encaixar(texto, { largura: livre, max, min, linhas: 2, fonte: "italico" });
  const d = detalhe ? encaixar(detalhe, { largura: livre, max: 40, min: 34, linhas: 2, fonte: "serif" }) : undefined;
  const larguraTextos = Math.max(
    ...e.linhas.map((l) => larguraTexto(l, e.tamanho, "italico", { espaco: 0.16 })),
    ...(d ? d.linhas.map((l) => larguraTexto(l, d.tamanho, "serif", { espaco: 0.2 })) : [0]),
  );
  const alturaTexto = e.linhas.length * e.tamanho * 1.08 + (d ? 6 + d.linhas.length * d.tamanho * 1.1 : 0);
  const altura = Math.max(comNumero ? CIRCULO + PAD_Y * 2 : 0, alturaTexto + PAD_Y * 2 + 4);
  // folga para a borda (2,5 px de cada lado) e para o itálico que se inclina para fora da última letra
  return { tamanho: e.tamanho, linhas: e.linhas, detalhe: d, largura: Math.ceil(larguraTextos * 1.02 + (comNumero ? CIRCULO + 16 : 0) + PAD_X * 2 + 16), altura };
};

// Uma linha de texto que nasce a lápis e ganha tinta da esquerda para a direita (q de 0 a 1).
// Pronta, vira texto simples (sem a máscara da entrada).
export const LinhaATinta: React.FC<{ texto: string; q: number; corTinta: string; estilo?: React.CSSProperties }> = ({ texto, q, corTinta, estilo }) => (
  <div style={{ position: "relative", whiteSpace: "nowrap", ...estilo }}>
    {q >= 0.999 ? (
      <span style={{ color: corTinta }}>{texto}</span>
    ) : (
      <>
        <span style={{ color: cor.grafite }}>{texto}</span>
        {q > 0.001 ? (
          <span style={{ position: "absolute", left: 0, top: 0, color: corTinta, clipPath: `inset(-0.3em ${(1 - q) * 102}% -0.3em -0.1em)` }}>{texto}</span>
        ) : null}
      </>
    )}
  </div>
);

// A etiqueta de espécime de um item: a lápis desde o começo (borda e texto cinza), ganha tinta no `em`.
// `atual` = o item da vez (o número fica cheio de verde-musgo). Posição: canto esquerdo em x, meio em y.
export const EtiquetaDeItem: React.FC<{
  x: number;
  y: number;
  medida: MedidaEtiqueta;
  numero?: string | number;
  em: number;
  detalheEm?: number;
  t: number;
  atual?: boolean;
  erro?: boolean;
  // largura fixa (alinha uma coluna de etiquetas); padrão: a do texto
  largura?: number;
}> = ({ x, y, medida, numero, em, detalheEm, t, atual, erro, largura }) => {
  const tinta = prog(t, em - 0.05, 0.4);
  const escrita = prog(t, em + 0.05, 0.45, (v) => v);
  const escritaDetalhe = medida.detalhe ? prog(t, (detalheEm ?? em + 0.5) + 0.05, 0.45, (v) => v) : 0;
  const c = erro ? cor.garanca : cor.musgo;
  const corTexto = erro ? cor.garanca : cor.tinta;
  const cheio = atual ? prog(t, em + 0.1, 0.3) : 0;
  const w = largura ?? medida.largura;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - medida.altura / 2,
        width: w,
        height: medida.altura,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: `${PAD_Y}px ${PAD_X}px`,
        background: misturarCor("#EEF0E7", cor.etiqueta, tinta),
        border: `2.5px solid ${misturarCor(cor.grafiteClaro, cor.tinta, tinta)}`,
        borderRadius: 6,
      }}
    >
      {numero !== undefined ? (
        <div
          style={{
            width: CIRCULO,
            height: CIRCULO,
            borderRadius: CIRCULO / 2,
            border: `2.5px solid ${misturarCor(cor.grafite, c, tinta)}`,
            background: cheio > 0 ? `rgba(47,91,69,${0.92 * cheio})` : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: versalete,
            fontWeight: 700,
            fontSize: 34,
            color: cheio > 0.5 ? cor.etiqueta : misturarCor(cor.grafite, c, tinta),
            flexShrink: 0,
            lineHeight: 1,
            paddingBottom: 3,
            boxSizing: "border-box",
          }}
        >
          {numero}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: medida.tamanho, lineHeight: 1.08 }}>
          {medida.linhas.map((l, i) => (
            <LinhaATinta key={i} texto={l} q={limitar(escrita * medida.linhas.length - i)} corTinta={corTexto} />
          ))}
        </div>
        {medida.detalhe ? (
          <div style={{ fontFamily: serif, fontWeight: 500, fontSize: medida.detalhe.tamanho, lineHeight: 1.1, marginTop: 6 }}>
            {medida.detalhe.linhas.map((l, i) => (
              <LinhaATinta key={i} texto={l} q={limitar(escritaDetalhe * medida.detalhe!.linhas.length - i)} corTinta={cor.musgo} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ——— medalhão: número romano (ou um sinal) num círculo de pena ———

export const Medalhao: React.FC<{ x: number; y: number; r?: number; texto: string; p: number; cheio?: number; corTraco?: string; tamanho?: number }> = ({
  x,
  y,
  r = 36,
  texto,
  p,
  cheio = 0,
  corTraco = cor.musgo,
  tamanho = 34,
}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="none" stroke={cor.grafite} strokeWidth={2} opacity={1 - p} />
    {cheio > 0 ? <circle cx={x} cy={y} r={r} fill={corTraco} opacity={0.92 * cheio} /> : null}
    <Traco d={`M ${x} ${y - r} A ${r} ${r} 0 1 1 ${x - 0.1} ${y - r}`} p={p} cor={corTraco} largura={traco.medio} />
    <text
      x={x}
      y={y + tamanho * 0.36}
      textAnchor="middle"
      fontFamily={versalete}
      fontWeight={700}
      fontSize={tamanho}
      style={{ fontFeatureSettings: '"lnum" 1' }}
      fill={cheio > 0.5 ? cor.etiqueta : p > 0.4 ? corTraco : cor.grafite}
    >
      {texto}
    </text>
  </g>
);

export { romano };

// ——— selos ✗ (garança) e ✓ (verde-musgo), desenhados a pena ———

export const Selo: React.FC<{ x: number; y: number; r?: number; tipo: "x" | "v"; p: number }> = ({ x, y, r = 30, tipo, p }) => {
  const c = tipo === "x" ? cor.garanca : cor.musgo;
  const k = r * 0.42;
  return (
    <g opacity={limitar(p * 3)}>
      <circle cx={x} cy={y} r={r} fill={cor.etiqueta} fillOpacity={0.7 * p} />
      <Traco d={`M ${x} ${y - r} A ${r} ${r} 0 1 1 ${x - 0.1} ${y - r}`} p={limitar(p * 1.6)} cor={c} largura={traco.medio} />
      {tipo === "x" ? (
        <>
          <Traco d={`M ${x - k} ${y - k} L ${x + k} ${y + k}`} p={limitar(p * 2.2 - 0.9)} cor={c} largura={5} />
          <Traco d={`M ${x + k} ${y - k} L ${x - k} ${y + k}`} p={limitar(p * 2.2 - 1.2)} cor={c} largura={5} />
        </>
      ) : (
        <Traco d={`M ${x - k * 1.05} ${y + k * 0.05} L ${x - k * 0.25} ${y + k * 0.8} L ${x + k * 1.1} ${y - k * 0.75}`} p={limitar(p * 2 - 0.8)} cor={c} largura={5} />
      )}
    </g>
  );
};

// ——— etiqueta "ILUSTRATIVO" (quando o desenho não vem de números ditos) ———

export const Ilustrativo: React.FC<{ x: number; y: number; p: number; alinhar?: "inicio" | "fim" }> = ({ x, y, p, alinhar = "inicio" }) => {
  if (p <= 0.01) return null;
  const texto = "ILUSTRATIVO";
  const w = larguraTexto(texto, 30, "versalete", { espacamento: 0.12 }) + 34;
  return (
    <div
      style={{
        position: "absolute",
        left: alinhar === "inicio" ? x : x - w,
        top: y,
        height: 50,
        width: w,
        boxSizing: "border-box",
        border: `2px solid ${cor.musgo}`,
        borderRadius: 25,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: versalete,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: "0.12em",
        color: cor.musgo,
        opacity: p,
        background: "rgba(244,244,236,0.7)",
      }}
    >
      {texto}
    </div>
  );
};

// ——— texto que se escreve na fala (uma frase quebrada em linhas, palavra por palavra) ———

export const TextoNaFala: React.FC<{
  linhas: string[];
  tempos: number[];
  t: number;
  tamanho: number;
  italico?: boolean;
  peso?: number;
  corTinta?: string;
  destaque?: string;
  lapis?: number;
  alinhar?: "left" | "center";
  entrelinha?: number;
  estilo?: React.CSSProperties;
  risco?: string;
  riscoEm?: number;
}> = ({ linhas, tempos, t, tamanho, italico, peso, corTinta, destaque, lapis = 1, alinhar, entrelinha = 1.02, estilo, risco, riscoEm }) => (
  <Escrita
    linhas={linhas}
    tempos={tempos}
    t={t}
    tamanho={tamanho}
    familia={serif}
    peso={peso ?? (italico ? 600 : 700)}
    italico={italico}
    corTinta={corTinta}
    destaque={destaque}
    lapis={lapis}
    alinhar={alinhar}
    entrelinha={entrelinha}
    estilo={estilo}
    risco={risco}
    riscoEm={riscoEm}
  />
);

export type { Palavra };
