import { batida, prog, saindo, temposDaLinha, useTempo } from "../anim";
import type { Virada as TVirada } from "../plano";
import { caber, caixaAlta, cor, larguraEm, rotulo, sora, TRACKING } from "../tema";
import { encaixar, quebrar } from "../texto";
import type { Contexto } from "./contexto";
import { medirPilha, Palavras, Pilha } from "./Pilha";

// depois da virada, o bloco "não é" encolhe para esta escala e sobe
const ESCALA_X = 0.62;
const ALTURA_ROTULO = 72;

// "Não é X — é Y": X aparece, é riscado no instante da virada, encolhe para cima
// e Y entra no lugar, palavra por palavra.
export const Virada: React.FC<{ m: TVirada; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const { coluna, yc, palavras, fim } = ctx;
  const W = coluna.w;
  const s = saindo(t, ctx.saida, 0.12);

  // ——— X: o que não é ———
  const prefixo = m.nao.prefixo ? caixaAlta(m.nao.prefixo) : "";
  // o prefixo cabe numa linha de 64 px; se for longo, quebra em até 2 linhas (de 64 a 40 px)
  const encPrefixo = prefixo ? encaixar(prefixo, { largura: W, max: 64, min: 40, maxLinhas: 2, peso: 700 }) : null;
  const tamPrefixo = encPrefixo?.tamanho ?? 64;
  const linhasPrefixo = encPrefixo?.linhas ?? [];
  // as linhas de X com um corpo só (o risco atravessa todas igual); linha longa demais: requebra
  let linhasX = m.nao.linhas.map((l) => caixaAlta(l));
  let tamX = Math.min(...linhasX.map((l) => caber(l, W, 170)));
  if (tamX < 64) {
    const enc = encaixar(linhasX.join(" "), { largura: W, max: 170, min: 56, maxLinhas: 4, peso: 800, espacamento: TRACKING });
    linhasX = quebrar(linhasX.join(" "), W, enc.tamanho, 800, TRACKING);
    tamX = enc.tamanho;
  }
  // o prefixo ("não é o") e as linhas são uma frase só: cada palavra bate quando é falada
  const nPrefixo = m.nao.prefixo ? m.nao.prefixo.trim().split(/\s+/).length : 0;
  const todosX = temposDaLinha([m.nao.prefixo ?? "", ...m.nao.linhas].join(" "), m.nao.em, palavras, m.grifoEm);
  const temposPrefixo = todosX.slice(0, nPrefixo);
  const temposX = todosX.slice(nPrefixo);
  const alturaX = (prefixo ? tamPrefixo * 1.3 * linhasPrefixo.length : 0) + linhasX.length * tamX * 1.02;
  // onde começa, em temposX, cada linha de X
  const inicioLinha = linhasX.map((_, i) => linhasX.slice(0, i).reduce((n, l) => n + l.split(/\s+/).length, 0));

  // ——— Y: o que é (entra depois que X saiu do caminho) ———
  const liberado = m.grifoEm + 0.3;
  const medidaY = medirPilha(m.sim, W, 200, palavras, m.ate);
  const linhasY = medidaY.linhas.map((l) => ({ ...l, tempos: l.tempos.map((x) => Math.max(x, liberado)) }));
  const selo = m.selo ? caixaAlta(m.selo.texto) : "";
  const tamSelo = selo ? Math.min(62, caber(selo, W - 60, 62)) : 0;
  const alturaSelo = selo ? tamSelo * 1.5 + 36 : 0;
  const encRotulo = m.rotulo ? encaixar(caixaAlta(m.rotulo), { largura: W, max: 40, min: 30, maxLinhas: 2, peso: 700, espacamento: 0.16 }) : null;
  const alturaRotulo = encRotulo ? Math.max(ALTURA_ROTULO, encRotulo.linhas.length * encRotulo.tamanho * 1.2 + 24) : 0;

  const pRisco = prog(t, m.grifoEm - 0.04, 0.18);
  const pSobe = prog(t, m.grifoEm + 0.08, 0.26);
  const alturaFinal = alturaRotulo + alturaX * ESCALA_X + 48 + medidaY.altura + alturaSelo;
  const topoFinal = Math.max(ctx.topo, Math.min(yc - alturaFinal / 2, ctx.base - alturaFinal));
  const topoInicial = Math.max(ctx.topo, Math.min(yc - (alturaRotulo + alturaX) / 2, ctx.base - alturaRotulo - alturaX));
  const topo = topoInicial + (topoFinal - topoInicial) * pSobe;
  const escalaX = 1 - (1 - ESCALA_X) * pSobe;
  const topoY = topoFinal + alturaRotulo + alturaX * ESCALA_X + 48;
  const tSelo = m.selo ? Math.max(liberado, temposDaLinha(m.selo.texto, m.selo.em, palavras, m.ate)[0]) : 0;
  const pSelo = m.selo ? prog(t, tSelo - 0.02, 0.2) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      {m.rotulo ? (
        <div style={{ position: "absolute", left: coluna.x, top: topo, width: W, ...rotulo, fontSize: encRotulo?.tamanho ?? 40, lineHeight: 1.2, color: cor.volt, ...batida(t, m.de + 0.05) }}>
          {encRotulo?.linhas.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: coluna.x,
          top: topo + alturaRotulo,
          width: W,
          scale: String(escalaX),
          transformOrigin: "left top",
        }}
      >
        {prefixo
          ? linhasPrefixo.map((lp, k) => {
              const antes = linhasPrefixo.slice(0, k).reduce((n, l) => n + l.split(/\s+/).length, 0);
              return (
                <div key={k} style={{ fontFamily: sora, fontWeight: 700, fontSize: tamPrefixo, lineHeight: 1.3, color: cor.papel, opacity: 0.62, whiteSpace: "nowrap" }}>
                  <Palavras t={t} texto={lp} tempos={temposPrefixo.slice(antes)} reserva={m.nao.em} />
                </div>
              );
            })
          : null}
        {(() => {
          return linhasX.map((l, i) => {
            const ws = l.split(/\s+/);
            const larguraLinha = Math.min(W, tamX * larguraEm(l, 800, TRACKING));
            const espessura = Math.max(10, tamX * 0.09);
            return (
              <div
                key={`${l}-${i}`}
                style={{
                  position: "relative",
                  fontFamily: sora,
                  fontWeight: 800,
                  fontSize: tamX,
                  lineHeight: 1.02,
                  letterSpacing: `${TRACKING}em`,
                  whiteSpace: "nowrap",
                  color: cor.papel,
                }}
              >
                <span style={{ opacity: 1 - 0.6 * pRisco }}>
                  <Palavras t={t} texto={l} tempos={temposX.slice(inicioLinha[i])} reserva={m.nao.em} />
                </span>
                {/* o risco: uma barra no acento que corre da esquerda para a direita */}
                <div
                  style={{
                    position: "absolute",
                    left: -8,
                    top: "50%",
                    height: espessura,
                    marginTop: -espessura / 2 - tamX * 0.04,
                    width: (larguraLinha + 16) * prog(t, m.grifoEm - 0.04 + i * 0.05, 0.16),
                    background: cor.volt,
                  }}
                />
              </div>
            );
          });
        })()}
      </div>

      <div style={{ position: "absolute", left: coluna.x, top: topoY, width: W }}>
        <Pilha t={t} linhas={linhasY} />
        {selo ? (
          <div
            style={{
              marginTop: 36,
              display: "inline-flex",
              alignItems: "center",
              height: tamSelo * 1.5,
              padding: "0 28px",
              background: cor.volt,
              color: cor.fundo,
              fontFamily: sora,
              fontWeight: 800,
              fontSize: tamSelo,
              letterSpacing: `${TRACKING}em`,
              whiteSpace: "nowrap",
              opacity: pSelo > 0 ? 1 : 0,
              clipPath: `inset(0 ${(1 - pSelo) * 100}% 0 0)`,
            }}
          >
            {selo}
          </div>
        ) : null}
      </div>
    </div>
  );
};
