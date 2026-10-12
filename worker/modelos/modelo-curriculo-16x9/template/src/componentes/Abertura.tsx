import { CirculoSobre, gesto, normalizar, prog, saindo, SublinhadoPalavra, SublinhadoSob, temposDesde, temposDoTexto } from "../anim";
import { encaixarNaAltura, ESPACO_PALAVRA, larguraTexto, trechoNoTexto } from "../medida";
import type { Abertura as TipoAbertura, Palavra } from "../plano";
import { cor, sans, serifa, sombraCartao, TOPO_APP } from "../tema";

export type Area = { x: number; y: number; w: number; h: number };

// No quadro deitado (16:9) a `area` é a faixa do peito: baixa e larga, centrada no rosto (src/Edicao.tsx).
// O cartão fica logo abaixo do queixo (40% da sobra em cima) e nunca passa da base; um cartão mais
// alto que a faixa sobe (nunca sai do quadro).
export const topoDoCartao = (area: Area, altura: number) =>
  Math.max(TOPO_APP, Math.min(area.y + Math.max(0, area.h - altura) * 0.4, area.y + area.h - altura));

// Abertura: um recorte de papel no peito; o título chega palavra por palavra, no ritmo da fala.
// A caneta circula (uma palavra) ou sublinha (um trecho) o destaque no instante em que é dito.
// No quadro deitado o título vira uma fileira larga (de preferência 2 linhas) que cabe na faixa.
export const Abertura: React.FC<{ m: TipoAbertura; t: number; fim: number; area: Area; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  const entra = prog(t, m.de - 0.05, 0.35);
  // sai decidida antes da troca de lugar (nada de título fantasma sobre a janela que encolhe)
  const sai = saindo(t, fim - 0.3, 0.2);
  if (sai >= 1) return null;
  const texto = m.linhas?.length ? m.linhas.join(" ") : m.texto;
  const tempos = m.em !== undefined ? temposDesde(texto, palavras, m.em, fim, 0.16) : temposDoTexto(texto, palavras, m.de, fim);
  // linhas: a quebra manual do plano ou a medida (até 3 linhas, 96 → 48 px), sempre dentro da
  // largura e da altura da faixa do peito
  const larguraUtil = area.w - 104;
  // o rótulo (30 px, linha normal) mais o vão até o título
  const rotuloAlt = m.rotulo ? 56 : 0;
  const livre = area.h - 78 - rotuloAlt;
  let linhas: string[][];
  let tamanho: number;
  if (m.linhas?.length) {
    linhas = m.linhas.map((l) => l.split(/\s+/).filter(Boolean));
    const maior = Math.max(...linhas.map((l) => larguraTexto(l.join(" "), 100, "serifa", 700)));
    const pelaAltura = Math.floor(livre / (linhas.length * 1.16));
    tamanho = Math.max(48, Math.min(96, pelaAltura, Math.floor((larguraUtil * 100) / (maior * 1.04))));
  } else {
    const enc = encaixarNaAltura(texto, { largura: larguraUtil, max: 96, min: 48, altura: livre, alturaLinha: 1.16, linhas: 3, fonte: "serifa", peso: 700 });
    linhas = enc.linhas;
    tamanho = enc.tamanho;
  }
  const alturaCartao = 78 + rotuloAlt + linhas.length * tamanho * 1.16;
  const topo = topoDoCartao(area, alturaCartao);
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
        top: topo,
        height: alturaCartao,
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
