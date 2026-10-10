import { limitar, prog } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import { cor, corpo, serif, traco, versalete } from "../tema";

// Onde a etiqueta fica: "inicio" = a borda esquerda em x; "fim" = a borda direita em x;
// "centro" = centrada em x (a linha-guia sai de baixo). y é o meio da etiqueta.
export type CaixaDaEtiqueta = { x: number; y: number; alinhar: "inicio" | "fim" | "centro" };

const ALTURA = 72;

// Medida da etiqueta para um texto: cabe numa linha de até `larguraMax` px (46 px, encolhe até 40);
// passou disso, quebra em 2 linhas. Devolve a largura total, a altura e as linhas.
export const medidaDaEtiqueta = (texto: string, larguraMax = 600) => {
  const livre = larguraMax - 104;
  const e = encaixar(texto, { largura: livre, max: corpo.etiqueta, min: 40, linhas: 1, fonte: "italico" });
  const final = e.linhas.length <= 1 ? e : encaixar(texto, { largura: livre, max: corpo.etiqueta, min: 38, linhas: 2, fonte: "italico" });
  const larguraLinhas = Math.max(...final.linhas.map((l) => larguraTexto(l, final.tamanho, "italico", { espaco: 0.16 })), 10);
  const altura = final.linhas.length <= 1 ? ALTURA : Math.round(final.linhas.length * final.tamanho * 1.08 + 26);
  return { largura: Math.ceil(larguraLinhas + 104), altura, tamanho: final.tamanho, linhas: final.linhas };
};

// Etiqueta de espécime: um ponto no desenho, a linha-guia e a etiqueta de papel com o número e o texto.
// O ponto aparece no `em`, a linha corre até a etiqueta, a etiqueta se desdobra e o texto ganha tinta.
export const Etiqueta: React.FC<{
  ponto: { x: number; y: number };
  caixa: CaixaDaEtiqueta;
  numero: number;
  texto: string;
  erro?: boolean;
  em: number;
  t: number;
  saida: number;
  // largura máxima da etiqueta (o texto encolhe ou quebra em 2 linhas para caber)
  larguraMax?: number;
}> = ({ ponto, caixa, numero, texto, erro, em, t, saida, larguraMax }) => {
  const medida = medidaDaEtiqueta(texto, larguraMax);
  const altura = medida.altura;
  const anel = prog(t, em - 0.05, 0.25);
  const fio = prog(t, em + 0.02, 0.3);
  const abre = prog(t, em + 0.22, 0.36);
  const escrita = prog(t, em + 0.32, 0.4);
  if (anel <= 0.001 || saida >= 1) return null;
  const c = erro ? cor.garanca : cor.musgo;
  // onde a linha-guia encosta na etiqueta, e o cotovelo (a linha chega na horizontal, ou na vertical se centrada)
  const encosta =
    caixa.alinhar === "centro" ? { x: caixa.x, y: caixa.y + altura / 2 } : { x: caixa.x, y: caixa.y };
  const cotovelo =
    caixa.alinhar === "centro"
      ? { x: caixa.x, y: caixa.y + altura / 2 + 22 }
      : { x: caixa.x + (caixa.alinhar === "inicio" ? -28 : 28), y: caixa.y };
  const pontos = [ponto, cotovelo, encosta];
  // comprimento total, para desenhar a linha aos poucos
  const trechos = [Math.hypot(cotovelo.x - ponto.x, cotovelo.y - ponto.y), Math.hypot(encosta.x - cotovelo.x, encosta.y - cotovelo.y)];
  const total = trechos[0] + trechos[1] || 1;
  let resta = fio * total;
  const visiveis = [pontos[0]];
  for (let i = 0; i < 2 && resta > 0; i++) {
    const q = Math.min(1, resta / (trechos[i] || 1));
    visiveis.push({ x: pontos[i].x + (pontos[i + 1].x - pontos[i].x) * q, y: pontos[i].y + (pontos[i + 1].y - pontos[i].y) * q });
    resta -= trechos[i];
  }
  const posicao: React.CSSProperties =
    caixa.alinhar === "inicio"
      ? { left: caixa.x, top: caixa.y, translate: "0 -50%" }
      : caixa.alinhar === "fim"
        ? { right: 1080 - caixa.x, top: caixa.y, translate: "0 -50%" }
        : { left: caixa.x, top: caixa.y, translate: "-50% -50%" };
  const recorte =
    caixa.alinhar === "inicio"
      ? `inset(-4px ${(1 - abre) * 100}% -4px -4px)`
      : caixa.alinhar === "fim"
        ? `inset(-4px -4px -4px ${(1 - abre) * 100}%)`
        : `inset(${(1 - abre) * 100}% -4px -4px -4px)`;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - saida, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={ponto.x} cy={ponto.y} r={12 * anel} fill={cor.etiqueta} fillOpacity={0.6} stroke={c} strokeWidth={traco.medio} />
        <circle cx={ponto.x} cy={ponto.y} r={5 * anel} fill={c} />
        {fio > 0.01 ? (
          <polyline
            points={visiveis.map((v) => `${v.x},${v.y}`).join(" ")}
            fill="none"
            stroke={cor.tinta}
            strokeWidth={traco.fino}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
      {abre > 0.01 ? (
        <div
          style={{
            position: "absolute",
            ...posicao,
            height: altura,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexDirection: "row",
            padding: "0 24px 2px 12px",
            background: cor.etiqueta,
            border: `2.5px solid ${cor.tinta}`,
            borderRadius: 6,
            clipPath: recorte,
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              border: `2.5px solid ${c}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: versalete,
              fontWeight: 700,
              fontSize: 32,
              color: c,
              flexShrink: 0,
              lineHeight: 1,
              paddingBottom: 3,
              boxSizing: "border-box",
            }}
          >
            {numero}
          </div>
          <div style={{ position: "relative", fontFamily: serif, fontStyle: "italic", fontWeight: 600, fontSize: medida.tamanho, lineHeight: 1.08 }}>
            {medida.linhas.map((linha, li) => {
              // cada linha ganha tinta na sua vez (a de cima primeiro)
              const q = limitar(escrita * medida.linhas.length - li);
              const c = erro ? cor.garanca : cor.tinta;
              return (
                <div key={li} style={{ position: "relative", whiteSpace: "nowrap" }}>
                  {q >= 0.999 ? (
                    <span style={{ color: c }}>{linha}</span>
                  ) : (
                    <>
                      <span style={{ color: cor.grafite }}>{linha}</span>
                      <span style={{ position: "absolute", left: 0, top: 0, color: c, clipPath: `inset(-0.3em ${(1 - q) * 102}% -0.3em -0.1em)` }}>{linha}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
