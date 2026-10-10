import { calculo, prog, Revela, useTempo } from "../anim";
import { PAINEL } from "../layout";
import { encaixar } from "../medida";
import type { Lado, Passos as TPassos, Tom, Topicos as TTopicos } from "../plano";
import { cor, mono, sans, PLANO } from "../tema";
import { Painel } from "./Painel";
import { IndicadorDeProgresso } from "./Tendencia";

type Props<M> = { m: M; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number };

export const corDoTom = (tom?: Tom) => (tom === "negativo" ? cor.negativo : tom === "neutro" ? cor.ambar : cor.positivo);

// Quando cada item entra: na palavra dele, nunca antes do painel abrir, um depois do outro.
const entradas = (ems: number[], t0: number) => {
  const r: number[] = [];
  ems.forEach((e, i) => r.push(Math.max(e, t0 + 0.25, i > 0 ? r[i - 1] + 0.25 : -Infinity)));
  return r;
};

// Anel que se abre e some (dado ao vivo), em volta de um ponto.
const Respira: React.FC<{ x: number; y: number; desde: number; cor: string; r?: number }> = ({ x, y, desde, cor: c, r = 16 }) => {
  const t = useTempo();
  return (
    <>
      {[0, 0.6].map((atraso) => {
        const d = t - desde - atraso;
        const p = d < 0 ? 0 : (d % 1.2) / 1.2;
        return (
          <div
            key={atraso}
            style={{
              position: "absolute",
              left: x - (r + 22 * p),
              top: y - (r + 22 * p),
              width: 2 * (r + 22 * p),
              height: 2 * (r + 22 * p),
              borderRadius: "50%",
              border: `2.5px solid ${c}`,
              opacity: p > 0 ? 0.6 * (1 - p) : 0,
            }}
          />
        );
      })}
    </>
  );
};

// ——— topicos: um quadro de status. Cada linha é um cartão que acende na sua palavra; uma moldura
// de seleção desliza até a linha que está sendo dita. ———
export const Topicos: React.FC<Props<TTopicos>> = ({ m, lado, t0, fimCabecalho, fimCorpo }) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const tempos = entradas(
    itens.map((i) => i.em),
    t0,
  );
  const c = corDoTom(m.tom);
  const largura = direita - esquerda;
  // o corpo do quadro deitado é mais baixo: com 5 linhas, o vão encolhe
  const gap = n >= 5 ? 14 : 20;
  const alturaLinha = Math.min(250, (base - topo - gap * (n - 1)) / n);
  const alturaBloco = alturaLinha * n + gap * (n - 1);
  const topoBloco = topo + (base - topo - alturaBloco) / 2;
  const yLinha = (i: number) => topoBloco + i * (alturaLinha + gap);
  const temDetalhe = itens.some((i) => i.detalhe);
  const larguraTexto = largura - 140 - 100;
  const maxTexto = Math.max(44, Math.min(64, Math.floor(alturaLinha * 0.36)));
  const corpo = Math.min(
    ...itens.map((i) => encaixar(i.texto, { largura: larguraTexto, max: maxTexto, min: 44, linhas: temDetalhe || n > 3 ? 1 : 2, fonte: { peso: 600, espacamento: -0.01 } }).tamanho),
  );
  const atual = tempos.filter((e) => t >= e).length - 1;
  // a moldura de seleção desliza de uma linha para a outra
  const ySelecao = tempos.reduce((y, e, i) => (i === 0 ? yLinha(0) : y + (yLinha(i) - yLinha(i - 1)) * prog(t, e, 0.35, calculo)), yLinha(0));

  return (
    <Painel
      de={m.de}
      t0={t0}
      ate={m.ate}
      fimCabecalho={fimCabecalho}
      fimCorpo={fimCorpo}
      lado={lado}
      rotulo={m.rotulo}
      titulo={m.titulo}
      ficha={m.ficha}
      nota={m.nota}
      indicador={<IndicadorDeProgresso tempos={tempos} largura={PAINEL.cabecalho.largura} cor={c} />}
    >
      {itens.map((item, i) => {
        const p = prog(t, tempos[i], 0.45);
        const aparece = prog(t, t0 + 0.28 + i * 0.06, 0.35);
        const medida = encaixar(item.texto, { largura: larguraTexto, max: corpo, min: corpo, linhas: 3, fonte: { peso: 600, espacamento: -0.01 } });
        const y = yLinha(i);
        return (
          <div key={`${item.texto}-${i}`}>
            <div
              style={{
                position: "absolute",
                left: esquerda,
                top: y,
                width: largura,
                height: alturaLinha,
                borderRadius: 22,
                boxSizing: "border-box",
                border: `2px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? cor.linha : "rgba(226,238,231,0.2)"}`,
                background: `rgba(237,243,239,${0.035 * p})`,
                opacity: aparece,
              }}
            />
            {/* número da linha */}
            <div
              style={{
                position: "absolute",
                left: esquerda + 36,
                top: y + alturaLinha / 2 - 22,
                fontFamily: mono,
                fontWeight: 500,
                fontSize: 36,
                lineHeight: "44px",
                color: i === atual ? c : p > 0 ? cor.suave : cor.apagado,
                opacity: aparece,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            {/* texto: antes de ser dito, um traço "a lápis" no lugar */}
            <div style={{ position: "absolute", left: esquerda + 140, top: y, height: alturaLinha, width: larguraTexto, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {p <= 0 ? (
                <div style={{ height: 16, width: "46%", borderRadius: 8, background: "rgba(226,238,231,0.1)", opacity: aparece }} />
              ) : (
                <Revela p={p}>
                  <div style={{ fontFamily: sans, fontWeight: 600, fontSize: medida.tamanho, lineHeight: 1.08, letterSpacing: "-0.01em", color: cor.texto }}>
                    {medida.linhas.map((l) => (
                      <div key={l} style={{ whiteSpace: "nowrap" }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  {item.detalhe ? (
                    <div style={{ marginTop: 8, fontFamily: mono, fontWeight: 500, fontSize: 34, color: cor.suave, whiteSpace: "nowrap", opacity: prog(t, Math.max(tempos[i] + 0.15, item.detalheEm ?? 0), 0.35) }}>
                      {item.detalhe}
                    </div>
                  ) : null}
                </Revela>
              )}
            </div>
            {/* status: anel vazio enquanto espera; ponto cheio quando é dito */}
            <div
              style={{
                position: "absolute",
                left: direita - 70,
                top: y + alturaLinha / 2 - 17,
                width: 34,
                height: 34,
                borderRadius: "50%",
                boxSizing: "border-box",
                border: `3px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? c : cor.linhaForte}`,
                opacity: aparece,
              }}
            >
              <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: c, scale: String(p) }} />
            </div>
            {i === atual ? <Respira x={direita - 53} y={y + alturaLinha / 2} desde={tempos[i] + 0.3} cor={c} /> : null}
          </div>
        );
      })}
      {/* moldura de seleção */}
      {atual >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: esquerda - 2,
            top: ySelecao - 2,
            width: largura + 4,
            height: alturaLinha + 4,
            borderRadius: 24,
            border: `2.5px solid ${c}`,
            opacity: prog(t, tempos[0], 0.3),
          }}
        >
          <div style={{ position: "absolute", left: 14, top: 18, bottom: 18, width: 7, borderRadius: 4, background: c }} />
        </div>
      ) : null}
    </Painel>
  );
};

// ——— passos: etapas ligadas por uma linha que avança de uma para a outra, na fala ———
export const Passos: React.FC<Props<TPassos>> = ({ m, lado, t0, fimCabecalho, fimCorpo }) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const tempos = entradas(
    itens.map((i) => i.em),
    t0,
  );
  const c = cor.positivo;
  const alturaLinha = Math.min(240, (base - topo) / n);
  const alturaBloco = alturaLinha * n;
  const topoBloco = topo + (base - topo - alturaBloco) / 2;
  const yNo = (i: number) => topoBloco + alturaLinha * (i + 0.5);
  const xNo = esquerda + 46;
  const R = 36;
  // cada etapa é um cartão do "pipeline", à direita do nó; o texto fica dentro dele
  const xCartao = esquerda + 112;
  const xTexto = xCartao + 34;
  const larguraTexto = direita - xTexto - 30;
  // linhas baixas (5 etapas no quadro deitado): o cartão ocupa quase a linha inteira
  const alturaCartao = Math.min(alturaLinha - (alturaLinha < 140 ? 12 : 26), 200);
  const temDetalhe = itens.some((i) => i.detalhe);
  const maxTexto = Math.max(40, Math.min(66, Math.floor(alturaLinha * (temDetalhe ? 0.3 : 0.36))));
  const corpo = Math.min(
    ...itens.map((i) => encaixar(i.texto, { largura: larguraTexto, max: maxTexto, min: 40, linhas: 2, fonte: { peso: 600, espacamento: -0.01 } }).tamanho),
  );
  const atual = tempos.filter((e) => t >= e).length - 1;
  // a linha de progresso: chega a cada etapa quando ela é dita
  const yProgresso = tempos.reduce((y, e, i) => (i === 0 ? yNo(0) : y + (yNo(i) - yNo(i - 1)) * prog(t, e - 0.1, 0.5, calculo)), yNo(0));
  const pTrilho = prog(t, t0 + 0.28, 0.6);

  return (
    <Painel
      de={m.de}
      t0={t0}
      ate={m.ate}
      fimCabecalho={fimCabecalho}
      fimCorpo={fimCorpo}
      lado={lado}
      rotulo={m.rotulo}
      titulo={m.titulo}
      ficha={m.ficha}
      nota={m.nota}
      indicador={<IndicadorDeProgresso tempos={tempos} largura={PAINEL.cabecalho.largura} cor={c} />}
    >
      {/* trilho tracejado (o caminho todo) e a linha cheia (o caminho percorrido) */}
      <svg width={PLANO.w} height={PLANO.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={xNo} x2={xNo} y1={yNo(0)} y2={yNo(0) + (yNo(n - 1) - yNo(0)) * pTrilho} stroke={cor.linhaForte} strokeWidth={3} strokeDasharray="8 10" />
        {atual >= 0 ? <line x1={xNo} x2={xNo} y1={yNo(0)} y2={yProgresso} stroke={c} strokeWidth={7} strokeLinecap="round" /> : null}
      </svg>
      {itens.map((item, i) => {
        const p = prog(t, tempos[i], 0.45);
        const aparece = prog(t, t0 + 0.28 + i * 0.07, 0.35);
        const feito = i < atual;
        const medida = encaixar(item.texto, { largura: larguraTexto, max: corpo, min: corpo, linhas: 3, fonte: { peso: 600, espacamento: -0.01 } });
        const y = yNo(i);
        return (
          <div key={`${item.texto}-${i}`}>
            <div
              style={{
                position: "absolute",
                left: xCartao,
                top: y - alturaCartao / 2,
                width: direita - xCartao,
                height: alturaCartao,
                boxSizing: "border-box",
                borderRadius: 22,
                border: `2px ${p > 0 ? "solid" : "dashed"} ${i === atual && p > 0 ? c : p > 0 ? cor.linha : "rgba(226,238,231,0.2)"}`,
                background: `rgba(237,243,239,${(i === atual ? 0.05 : 0.025) * p})`,
                opacity: aparece,
              }}
            />
            {/* ligação do nó ao cartão */}
            <div style={{ position: "absolute", left: xNo + R, top: y - 1.5, width: xCartao - xNo - R, height: 3, background: p > 0 ? c : cor.linhaForte, opacity: aparece * (p > 0 ? 1 : 0.5) }} />
            {/* nó: tracejado esperando; cheio quando a etapa é dita */}
            <div
              style={{
                position: "absolute",
                left: xNo - R,
                top: y - R,
                width: 2 * R,
                height: 2 * R,
                borderRadius: "50%",
                boxSizing: "border-box",
                border: `3px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? c : cor.linhaForte}`,
                background: p > 0 ? `rgba(95,221,164,${feito ? 1 : 0.16 + 0.84 * prog(t, tempos[i], 0.3)})` : cor.fundo,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: mono,
                fontWeight: 500,
                fontSize: 32,
                color: p > 0 ? cor.fundo : cor.apagado,
                opacity: aparece,
              }}
            >
              {i + 1}
            </div>
            {i === atual ? <Respira x={xNo} y={y} desde={tempos[i] + 0.35} cor={c} r={R} /> : null}
            <div style={{ position: "absolute", left: xTexto, top: y - alturaLinha / 2, height: alturaLinha, width: larguraTexto, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {p <= 0 ? (
                <div style={{ height: 16, width: "42%", borderRadius: 8, background: "rgba(226,238,231,0.1)", opacity: aparece }} />
              ) : (
                <Revela p={p}>
                  <div
                    style={{
                      fontFamily: sans,
                      fontWeight: 600,
                      fontSize: medida.tamanho,
                      lineHeight: 1.08,
                      letterSpacing: "-0.01em",
                      color: i === atual ? cor.texto : cor.suave,
                    }}
                  >
                    {medida.linhas.map((l) => (
                      <div key={l} style={{ whiteSpace: "nowrap" }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  {item.detalhe ? (
                    <div style={{ marginTop: 8, fontFamily: mono, fontWeight: 500, fontSize: 34, color: i === atual ? cor.ambar : cor.apagado, whiteSpace: "nowrap", opacity: prog(t, Math.max(tempos[i] + 0.15, item.detalheEm ?? 0), 0.35) }}>
                      {item.detalhe}
                    </div>
                  ) : null}
                </Revela>
              )}
            </div>
          </div>
        );
      })}
    </Painel>
  );
};
