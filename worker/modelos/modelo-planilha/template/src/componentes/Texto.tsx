// Texto falado e esboço "a lápis": usados por todas as células.
import { digitado, encadear, fimDaDigitacao, limitar, piscando, prog } from "../anim";
import { cor, sans } from "../tema";

// barra cinza "a lápis": o lugar de um texto que ainda vai ser digitado
export const Esboco: React.FC<{ w: number; h?: number; style?: React.CSSProperties }> = ({ w, h = 18, style }) => (
  <div style={{ width: Math.max(0, w), height: h, borderRadius: h / 2, background: cor.esbocoClaro, ...style }} />
);

const limpa = (w: string) => w.toLowerCase().replace(/[.,;:!?…"“”]+$/g, "").replace(/^["“”]+/, "");

// índice da primeira palavra de `alvo` dentro de `palavras` (ou -1)
const acharTrecho = (palavras: string[], trecho?: string) => {
  const alvo = trecho ? trecho.split(/\s+/).filter(Boolean) : [];
  if (!alvo.length) return { inicio: -1, n: 0 };
  for (let i = 0; i + alvo.length <= palavras.length; i++) {
    if (alvo.every((w, k) => limpa(palavras[i + k]) === limpa(w))) return { inicio: i, n: alvo.length };
  }
  return { inicio: -1, n: 0 };
};

const Cursorzinho: React.FC<{ t: number }> = ({ t }) => (
  <span style={{ position: "absolute", right: -8, top: "8%", width: 4, height: "84%", background: cor.acento, opacity: piscando(t) }} />
);

// Uma palavra digitada: enquanto as letras entram, a palavra inteira (invisível) guarda o lugar e as
// letras já digitadas ficam por cima; quando termina, a palavra é desenhada simples, sem camada extra.
const Palavra: React.FC<{
  w: string;
  inicio: number;
  t: number;
  margem: boolean;
  corTexto?: string;
  cursor: boolean;
  risco?: number;
  espessuraRisco?: number;
}> = ({ w, inicio, t, margem, corTexto, cursor, risco = 0, espessuraRisco = 5 }) => {
  const visivel = digitado(w, [inicio], t);
  const completa = visivel.length >= w.length;
  return (
    <span style={{ position: "relative", display: "inline-block", marginRight: margem ? "0.26em" : 0, color: corTexto, whiteSpace: "nowrap" }}>
      {completa ? (
        w
      ) : (
        <>
          <span style={{ visibility: "hidden" }}>{w}</span>
          <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" }}>
            {visivel}
            {cursor ? <span style={{ display: "inline-block", width: 4, height: "0.92em", marginLeft: 3, verticalAlign: "-0.1em", background: cor.acento, opacity: piscando(t) }} /> : null}
          </span>
        </>
      )}
      {cursor && completa ? <Cursorzinho t={t} /> : null}
      {risco > 0 ? (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "54%",
            height: espessuraRisco,
            marginTop: -espessuraRisco / 2,
            width: `calc(${(risco * 100).toFixed(2)}% + ${margem ? (risco * 0.26).toFixed(3) : 0}em)`,
            background: cor.acento,
            borderRadius: espessuraRisco / 2,
          }}
        />
      ) : null}
    </span>
  );
};

// Texto que se monta palavra por palavra (sem pular de linha: as palavras ainda não ditas já ocupam o
// lugar). `cursor`: o cursor de texto pisca logo depois da palavra que está sendo digitada.
// Com `linhas` (de medida.ts → encaixar), as quebras são exatamente as medidas.
export const TextoFalado: React.FC<{
  texto: string;
  tempos: number[];
  t: number;
  style?: React.CSSProperties;
  destaque?: string;
  corDestaque?: string;
  alinhar?: "left" | "center";
  cursor?: boolean;
  linhas?: string[];
  risco?: string;
  riscoEm?: number;
}> = ({ texto, tempos: temposFalados, t, style, destaque, corDestaque = cor.acento, alinhar = "left", cursor, linhas, risco, riscoEm }) => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const tempos = encadear(texto, temposFalados);
  const d = acharTrecho(palavras, destaque);
  const r = acharTrecho(palavras, risco);
  let atual = -1;
  palavras.forEach((_, i) => {
    if (t >= (tempos[i] ?? 0)) atual = i;
  });
  const fim = fimDaDigitacao(texto, tempos);
  const pRisco = r.inicio >= 0 && riscoEm !== undefined ? prog(t, riscoEm, 0.45) : 0;
  const tamanho = typeof style?.fontSize === "number" ? style.fontSize : 48;
  const palavra = (i: number, margem: boolean) => {
    const emDestaque = d.inicio >= 0 && i >= d.inicio && i < d.inicio + d.n;
    const k = i - r.inicio;
    const riscoAqui = r.inicio >= 0 && k >= 0 && k < r.n ? limitar(pRisco * r.n - k) : 0;
    return (
      <Palavra
        key={i}
        w={palavras[i]}
        inicio={tempos[i] ?? 0}
        t={t}
        margem={margem}
        corTexto={emDestaque ? corDestaque : undefined}
        cursor={!!cursor && i === atual && t < fim + 0.45}
        risco={riscoAqui}
        espessuraRisco={Math.max(4, Math.round(tamanho * 0.075))}
      />
    );
  };
  if (linhas?.length) {
    let i = 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: alinhar === "center" ? "center" : "flex-start", ...style }}>
        {linhas.map((l, k) => {
          const n = l.split(/\s+/).filter(Boolean).length;
          const ids = Array.from({ length: n }, (_, j) => i + j);
          i += n;
          return (
            <div key={k} style={{ display: "flex", whiteSpace: "nowrap" }}>
              {ids.filter((j) => j < palavras.length).map((j, q) => palavra(j, q < n - 1))}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: alinhar === "center" ? "center" : "flex-start", ...style }}>
      {palavras.map((_, i) => palavra(i, i < palavras.length - 1))}
    </div>
  );
};

// Rótulo em caixa alta (framboesa), digitado na fala
export const Rotulo: React.FC<{ texto: string; tempos: number[]; t: number; tamanho?: number; corTexto?: string; style?: React.CSSProperties; linhas?: string[] }> = ({
  texto,
  tempos,
  t,
  tamanho = 32,
  corTexto = cor.acento,
  style,
  linhas,
}) => (
  <TextoFalado
    texto={texto}
    tempos={tempos}
    t={t}
    linhas={linhas}
    style={{ fontFamily: sans, fontWeight: 700, fontSize: tamanho, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.05, color: corTexto, flexWrap: "nowrap", ...style }}
  />
);

// Etiqueta "ilustrativo": a forma mostra a ideia, sem números
export const Ilustrativo: React.FC<{ p?: number; style?: React.CSSProperties }> = ({ p = 1, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      height: 44,
      padding: "0 16px",
      borderRadius: 10,
      border: `2.5px dashed ${cor.acento}`,
      color: cor.acentoEscuro,
      background: cor.celula,
      fontFamily: sans,
      fontWeight: 700,
      fontSize: 30,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      opacity: p,
      whiteSpace: "nowrap",
      boxSizing: "border-box",
      ...style,
    }}
  >
    Ilustrativo
  </div>
);
