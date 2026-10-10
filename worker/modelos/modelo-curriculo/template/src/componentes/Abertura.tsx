import { CirculoSobre, gesto, normalizar, prog, saindo, SublinhadoPalavra, SublinhadoSob, temposDesde, temposDoTexto } from "../anim";
import { encaixar, ESPACO_PALAVRA, larguraTexto, trechoNoTexto } from "../medida";
import type { Abertura as TipoAbertura, Palavra } from "../plano";
import { cor, sans, serifa, sombraCartao } from "../tema";

export type Area = { x: number; y: number; w: number; h: number };

// Abertura: um recorte de papel no peito; o título chega palavra por palavra, no ritmo da fala.
// A caneta circula (uma palavra) ou sublinha (um trecho) o destaque no instante em que é dito.
export const Abertura: React.FC<{ m: TipoAbertura; t: number; fim: number; area: Area; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const entra = prog(t, m.de - 0.05, 0.35);
  // sai decidida antes da troca de lugar (nada de título fantasma sobre a janela que encolhe)
  const sai = saindo(t, fim - 0.3, 0.2);
  if (sai >= 1) return null;
  const texto = m.linhas?.length ? m.linhas.join(" ") : m.texto;
  const tempos = m.em !== undefined ? temposDesde(texto, palavras, m.em, fim, 0.16) : temposDoTexto(texto, palavras, m.de, fim);
  // linhas: a quebra manual do plano ou a medida (até 3 linhas, 96 → 56 px)
  const larguraUtil = area.w - 104;
  const rotuloAlt = m.rotulo ? 48 : 0;
  let linhas: string[][];
  let tamanho: number;
  if (m.linhas?.length) {
    linhas = m.linhas.map((l) => l.split(/\s+/).filter(Boolean));
    const maior = Math.max(...linhas.map((l) => larguraTexto(l.join(" "), 100, "serifa", 700)));
    tamanho = Math.max(56, Math.min(96, Math.floor((larguraUtil * 100) / (maior * 1.04))));
  } else {
    const max = Math.floor((area.h - 78 - rotuloAlt) / (3 * 1.16));
    const enc = encaixar(texto, { largura: larguraUtil, max: Math.max(72, Math.min(96, max)), min: 56, linhas: 3, fonte: "serifa", peso: 700 });
    linhas = enc.linhas;
    tamanho = enc.tamanho;
  }
  // destaque: o trecho exato; formato antigo: `circulo` e `sublinhado` (uma palavra cada)
  const trecho = trechoNoTexto(texto, m.destaque);
  const umaPalavra = !!trecho && trecho[0] === trecho[1];
  const alvoCirculo = m.circulo ? normalizar(m.circulo) : null;
  const alvoSub = m.sublinhado ? normalizar(m.sublinhado) : null;
  const gap = ESPACO_PALAVRA * tamanho;
  let k = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        width: area.w,
        top: area.y,
        height: area.h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: entra * (1 - sai),
        translate: `0 ${(1 - entra) * 36 + sai * 110}px`,
      }}
    >
      <div
        style={{
          background: cor.papel,
          boxShadow: sombraCartao,
          padding: "34px 52px 44px",
          rotate: "-1deg",
          maxWidth: area.w,
        }}
      >
        {m.rotulo ? (
          <div
            style={{
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: cor.cinza,
              marginBottom: 18,
              whiteSpace: "nowrap",
            }}
          >
            {m.rotulo}
          </div>
        ) : null}
        {linhas.map((linha, li) => (
          <div key={li} style={{ display: "flex", fontFamily: serifa, fontWeight: 700, fontSize: tamanho, lineHeight: 1.16, color: cor.tinta, whiteSpace: "nowrap" }}>
            {linha.map((w, wi) => {
              const i = k++;
              const quando = tempos[i] ?? m.de;
              const p = prog(t, quando, 0.24);
              const n = normalizar(w);
              const ultima = wi === linha.length - 1;
              const noTrecho = !!trecho && i >= trecho[0] && i <= trecho[1];
              return (
                <span
                  key={`${w}-${wi}`}
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginRight: ultima ? 0 : `${ESPACO_PALAVRA}em`,
                    // terminada a entrada, a palavra fica simples (sem opacidade nem deslocamento)
                    ...(p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 0.22}em` }),
                  }}
                >
                  {w}
                  {(noTrecho && umaPalavra) || (!trecho && alvoCirculo === n) ? (
                    <CirculoSobre em={quando + 0.06} t={t} w={larguraTexto(w, tamanho, "serifa", 700)} h={tamanho * 0.86} largura={6} semente={3} />
                  ) : null}
                  {noTrecho && !umaPalavra && trecho ? (
                    <SublinhadoPalavra
                      p={prog(t, (tempos[trecho[1]] ?? quando) + 0.12 + (i - trecho[0]) * 0.07, 0.22, gesto)}
                      estender={!ultima && i < trecho[1] ? gap : 0}
                      largura={6}
                      semente={i + 2}
                    />
                  ) : null}
                  {!trecho && alvoSub === n ? <SublinhadoSob p={prog(t, quando + 0.12, 0.36)} largura={6} /> : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
