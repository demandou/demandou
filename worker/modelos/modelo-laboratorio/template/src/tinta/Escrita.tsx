// Letra à mão do caderno: cada palavra nasce como esboço a lápis (cinza claro) e é passada a
// tinta da esquerda para a direita no instante em que é dita.
import { caneta, limitar, normalizar, prog, temposDoTexto } from "../anim";
import { cor as paleta, mao } from "../tema";
import type { Cor } from "../plano";

export const corDe = (c?: Cor) => (c === "azul" ? paleta.azul : c === "vermelho" ? paleta.vermelho : paleta.tinta);

// tempo para escrever uma palavra (caneta rápida, mas visível)
export const duracaoEscrita = (texto: string) => Math.min(0.75, Math.max(0.2, texto.length * 0.05));

const FOLGA = { cima: 0.3, baixo: 0.42, lado: 0.14 };

// Uma palavra (ou trecho) à mão. `p` = quanto já foi passado a tinta; `esboco` = opacidade do lápis.
export const PalavraAMao: React.FC<{
  texto: string;
  corpo: number;
  p: number;
  esboco?: number;
  cor?: string;
  peso?: number;
  // risco a vermelhão por cima da palavra (0 → 1), e quanto ele avança além dela (o espaço até a próxima)
  risco?: number;
  riscoAlem?: number;
}> = ({ texto, corpo, p, esboco = 1, cor = paleta.tinta, peso = 700, risco = 0, riscoAlem = 0 }) => {
  const padding = `${FOLGA.cima}em ${FOLGA.lado}em ${FOLGA.baixo}em ${FOLGA.lado}em`;
  const margin = `-${FOLGA.cima}em -${FOLGA.lado}em -${FOLGA.baixo}em -${FOLGA.lado}em`;
  const base: React.CSSProperties = {
    fontFamily: mao,
    fontWeight: peso,
    fontSize: corpo,
    lineHeight: 1.05,
    whiteSpace: "nowrap",
    display: "inline-block",
    padding,
    margin,
  };
  // terminada a escrita, o texto final é desenhado simples (sem a camada de lápis e sem a máscara):
  // nada some num quadro capturado
  const traco =
    risco > 0.001 ? (
      <span
        style={{
          position: "absolute",
          left: -corpo * 0.04,
          top: "54%",
          height: Math.max(5, corpo * 0.075),
          width: `calc(${risco * 100}% + ${risco * (riscoAlem + corpo * 0.08)}px)`,
          background: paleta.vermelho,
          borderRadius: corpo * 0.04,
          transform: "rotate(-2.2deg)",
          transformOrigin: "left center",
          opacity: 0.92,
        }}
      />
    ) : null;
  if (p >= 0.999)
    return (
      <span style={{ position: "relative", display: "inline-block" }}>
        <span style={{ ...base, color: cor }}>{texto}</span>
        {traco}
      </span>
    );
  // o lápis some quando a tinta termina de passar
  const lapis = esboco * (1 - limitar((p - 0.6) / 0.4));
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ ...base, color: paleta.lapis, opacity: lapis * 0.7, visibility: lapis > 0.01 ? "visible" : "hidden" }}>{texto}</span>
      <span
        style={{
          ...base,
          position: "absolute",
          left: 0,
          top: 0,
          color: cor,
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
          visibility: p > 0.001 ? "visible" : "hidden",
        }}
      >
        {texto}
      </span>
      {traco}
    </span>
  );
};

export type PalavraNoTempo = { w: string; em: number; cor?: string; riscoEm?: number };

// Uma linha de palavras, cada uma passada a tinta no seu `em`, com espaço fixo entre elas
export const LinhaAMao: React.FC<{
  palavras: PalavraNoTempo[];
  t: number;
  corpo: number;
  esboco?: number;
  alinhar?: "flex-start" | "center" | "flex-end";
  peso?: number;
}> = ({ palavras, t, corpo, esboco = 1, alinhar = "flex-start", peso = 700 }) => (
  <div style={{ display: "flex", justifyContent: alinhar, alignItems: "baseline", gap: `0 ${0.27 * corpo}px`, whiteSpace: "nowrap" }}>
    {palavras.map((p, i) => (
      <PalavraAMao
        key={`${p.w}-${i}`}
        texto={p.w}
        corpo={corpo}
        p={prog(t, p.em, duracaoEscrita(p.w), caneta)}
        esboco={esboco}
        cor={p.cor}
        peso={peso}
        risco={p.riscoEm === undefined ? 0 : prog(t, p.riscoEm, 0.22, caneta)}
        riscoAlem={palavras[i + 1]?.riscoEm !== undefined ? 0.27 * corpo : 0}
      />
    ))}
  </div>
);

// Divide um texto em palavras com tempo, e pinta o trecho `destaque` com a cor dada
export const comDestaque = (texto: string, tempos: number[], destaque?: string, corDestaque?: string): PalavraNoTempo[] => {
  const palavras = texto.split(/\s+/).filter(Boolean);
  // compara sem acento, caixa nem pontuação ("Saiba Mais" acha "saiba mais.")
  const alvo = (destaque ?? "").split(/\s+/).map(normalizar).filter(Boolean);
  const norm = palavras.map(normalizar);
  const marcadas = new Set<number>();
  if (alvo.length) {
    for (let i = 0; i + alvo.length <= palavras.length; i++) {
      if (alvo.every((a, k) => norm[i + k] === a)) for (let k = 0; k < alvo.length; k++) marcadas.add(i + k);
    }
  }
  return palavras.map((w, i) => ({ w, em: tempos[i] ?? tempos[tempos.length - 1] ?? 0, cor: marcadas.has(i) ? corDestaque : undefined }));
};

// Anotação curta escrita palavra por palavra no ritmo da fala, a partir de `em` (cada palavra é
// procurada nas palavras faladas do momento; a que não for achada vem logo depois da anterior)
export const FraseAMao: React.FC<{
  texto: string;
  em: number;
  ate: number;
  palavras: { em: number; ate: number; w: string }[];
  t: number;
  corpo: number;
  cor?: string;
  alinhar?: "flex-start" | "center" | "flex-end";
}> = ({ texto, em, ate, palavras, t, corpo, cor, alinhar }) => {
  const tempos = temposDoTexto(texto, palavras, em - 0.05, ate, em);
  return <LinhaAMao palavras={comDestaque(texto, tempos).map((p) => ({ ...p, cor }))} t={t} corpo={corpo} alinhar={alinhar} />;
};
