import { interpolateColors } from "remotion";
import { gesto, LinhasAMao, PalavraAMao, prog, saindo, temposDesde, Traco } from "../anim";
import { encaixar, encaixarNaAltura, ESPACO_PALAVRA, larguraLinha } from "../medida";
import type { Destaque as TipoDestaque, Palavra } from "../plano";
import { cor, mao, serifa, sombraCartao } from "../tema";
import { type Area, topoDoCartao } from "./Abertura";

// Destaque: a pessoa em tela cheia e um cartão de papel no peito.
// alerta: a caneta escreve a frase em vermelho, com um "!" circulado ao lado e dois traços embaixo;
// chave: a frase chega em tinta, palavra por palavra, e a caneta sublinha.
// O `detalhe` entra embaixo, menor, a lápis que ganha tinta quando é dito.
// No quadro deitado a frase vira uma fileira larga na faixa do peito, medida para caber na altura.
export const Destaque: React.FC<{ m: TipoDestaque; t: number; fim: number; area: Area; palavras: Palavra[] }> = ({ m, t, fim, area, palavras }) => {
  // entra quando a pessoa já está quase em tela cheia (nada de cartão sobre a folha que sai)
  const entra = prog(t, m.de + 0.42, 0.32);
  const sai = saindo(t, fim - 0.3, 0.2);
  if (sai >= 1 || entra <= 0) return null;
  const alerta = (m.nivel ?? "alerta") === "alerta";
  const icone = alerta ? 96 : 0;
  const largura = area.w - 20 - 88 - icone;
  const fonte = alerta ? ("mao" as const) : ("serifa" as const);
  const det = m.detalhe ? encaixar(m.detalhe, { largura: largura, max: 42, min: 34, linhas: 2, fonte: "serifa", peso: 500 }) : null;
  const alturaDet = det ? 8 + det.linhas.length * det.tamanho * 1.2 : 0;
  // o cartão: 72 de margem, 34 dos traços de caneta, o detalhe e a frase
  const enc = encaixarNaAltura(m.texto, { largura, max: 84, min: 46, altura: area.h - 72 - 34 - alturaDet, alturaLinha: 1.16, linhas: 3, fonte, peso: 700 });
  const alturaCartao = 72 + 34 + alturaDet + enc.linhas.length * enc.tamanho * 1.16;
  const topo = topoDoCartao(area, alturaCartao);
  const tempos = temposDesde(m.texto, palavras, m.em, m.detalheEm ?? fim, 0.16).map((x, i) => Math.max(x, m.de + 0.3 + i * 0.1));
  const fimTexto = (tempos[tempos.length - 1] ?? m.em) + 0.3;
  const larguraTexto = Math.max(...enc.linhas.map((l) => larguraLinha(l, enc.tamanho, { fonte, peso: 700 })));
  const detEm = m.detalheEm ?? fimTexto + 0.2;
  const detTempos = m.detalhe ? temposDesde(m.detalhe, palavras, detEm, fim, 0.12) : [];
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
        translate: `0 ${(1 - entra) * 40 + sai * 110}px`,
      }}
    >
      <div style={{ position: "relative", background: cor.papel, boxShadow: sombraCartao, padding: "32px 44px 40px", rotate: "0.8deg", maxWidth: area.w - 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: alerta ? 26 : 0 }}>
          {alerta ? (
            <svg width={70} height={70} viewBox="0 0 70 70" style={{ flexShrink: 0, marginTop: Math.max(0, enc.tamanho * 0.6 - 35), overflow: "visible" }}>
              <Traco d="M 35 4 C 54 4 66 18 66 35 C 66 54 52 66 35 66 C 16 66 4 52 4 35 C 4 17 17 4 37 5" p={prog(t, m.em - 0.1, 0.4, gesto)} largura={6} />
              <text x={35} y={50} textAnchor="middle" fontFamily={mao} fontWeight={700} fontSize={46} fill={cor.vermelho} opacity={prog(t, m.em + 0.15, 0.15)}>
                !
              </text>
            </svg>
          ) : null}
          <div style={{ position: "relative" }}>
            {alerta ? (
              <LinhasAMao linhas={enc.linhas} tempos={tempos} t={t} tamanho={enc.tamanho} peso={700} alturaLinha={1.16} />
            ) : (
              enc.linhas.map((linha, li) => (
                <div key={li} style={{ display: "flex", fontFamily: serifa, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.16, color: cor.tinta, whiteSpace: "nowrap" }}>
                  {linha.map((w, wi) => {
                    const i = k++;
                    const p = prog(t, tempos[i] ?? m.em, 0.24);
                    return (
                      <span
                        key={`${w}-${wi}`}
                        style={{
                          display: "inline-block",
                          marginRight: wi === linha.length - 1 ? 0 : `${ESPACO_PALAVRA}em`,
                          ...(p >= 1 ? {} : { opacity: p, translate: `0 ${(1 - p) * 0.22}em` }),
                        }}
                      >
                        {w}
                      </span>
                    );
                  })}
                </div>
              ))
            )}
            {/* traços de caneta embaixo da frase: dois no alerta, um na chave */}
            <svg width={larguraTexto} height={30} style={{ display: "block", marginTop: 4, overflow: "visible" }}>
              <Traco d={`M -4 8 Q ${larguraTexto * 0.5} 15 ${larguraTexto + 6} 4`} p={prog(t, fimTexto, 0.32, gesto)} largura={6} />
              {alerta ? <Traco d={`M 10 22 Q ${larguraTexto * 0.45} 28 ${larguraTexto - 20} 19`} p={prog(t, fimTexto + 0.22, 0.28, gesto)} largura={5} /> : null}
            </svg>
            {det ? (
              <div style={{ marginTop: 8, fontFamily: serifa, fontWeight: 500, fontSize: det.tamanho, lineHeight: 1.2 }}>
                {(() => {
                  let j = 0;
                  return det.linhas.map((linha, li) => (
                    <div key={li} style={{ display: "flex", whiteSpace: "nowrap" }}>
                      {linha.map((w, wi) => {
                        const tinta = prog(t, detTempos[j++] ?? detEm, 0.2);
                        return (
                          <span
                            key={`${w}-${wi}`}
                            style={{
                              display: "inline-block",
                              marginRight: wi === linha.length - 1 ? 0 : `${ESPACO_PALAVRA}em`,
                              color: tinta >= 1 ? cor.cinza : interpolateColors(tinta, [0, 1], [cor.lapis, cor.cinza]),
                            }}
                          >
                            {w}
                          </span>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

// Pergunta (lugar "topo"): um bilhete adesivo entra ao lado da folha e a caneta escreve um "?" grande.
// No quadro deitado ele cola na margem direita da folha, entre ela e o bilhete grande da pessoa.
export const NotaPergunta: React.FC<{ de: number; em: number; fim: number; t: number }> = ({ de, em, fim, t }) => {
  const entrada = de + 0.42;
  const entra = prog(t, entrada, 0.45);
  const sai = saindo(t, fim - 0.25, 0.25);
  if (sai >= 1 || entra <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 830,
        top: 560,
        width: 240,
        height: 240,
        rotate: "3deg",
        opacity: entra * (1 - sai),
        translate: `${(1 - entra) * 80}px 0`,
        background: `linear-gradient(180deg, ${cor.nota} 0%, ${cor.nota} 70%, #F6F2E7 100%)`,
        boxShadow: "0 1px 2px rgba(28,33,41,0.14), 0 18px 26px -12px rgba(28,33,41,0.34)",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 10, background: cor.vermelho }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mao,
          fontWeight: 700,
          fontSize: 184,
          lineHeight: 1,
          color: cor.vermelho,
          paddingTop: 14,
        }}
      >
        <PalavraAMao w="?" em={Math.max(entrada + 0.2, em)} t={t} dur={0.4} />
      </div>
    </div>
  );
};
