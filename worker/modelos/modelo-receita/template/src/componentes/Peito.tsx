// Blocos da ficha no peito: a pessoa em quadro cheio e a ficha de receita na altura do peito.
// destaque, frase, pergunta, definicao e numero. Todos seguem o mesmo jeito da ficha:
// o texto nasce "a lápis" e ganha tinta quando é dito; o grifo e o visto são pistache; a chama
// (caramelo) é o único sinal de alerta. Tudo é medido para caber entre o topo da ficha e a
// interface do app; o corpo diminui até um mínimo legível.
import { Escrita, indicesDoTrecho, misturarCor, prog, saindo, temposDoTexto, Traco } from "../anim";
import { casasDe, encaixar, type Encaixe, larguraLinha, numeroBR } from "../medida";
import type { Definicao, Destaque, Frase, Numero, Palavra, Pergunta } from "../plano";
import { cor, destaque as estiloDestaque, fonte, LARGURA_UTIL, rotulo as estiloRotulo, tintas, texto, X0, X1 } from "../tema";

// a área útil da ficha no peito: do topo da ficha até um pouco acima da interface do app
export const FUNDO_PEITO = 1540;
export const alturaUtil = (fichaY: number) => FUNDO_PEITO - fichaY - 44;
// o bloco fica um pouco acima do meio da área (o olho cai primeiro no topo da ficha)
export const topoDoBloco = (fichaY: number, altura: number) => fichaY + Math.max(40, (FUNDO_PEITO - fichaY - altura) * 0.42);

// tempos de cada palavra de um texto, a partir de quando ele começa a ser dito
export const temposDe = (txt: string, palavras: Palavra[], inicio: number, ate: number) =>
  temposDoTexto(txt, palavras, inicio - 0.3, ate, inicio);

// rótulo em caixa alta com um corpo que acompanha o espaço disponível
const Rotulo: React.FC<{ txt: string; corpo: number; op?: number; icone?: React.ReactNode; corTexto?: string }> = ({
  txt,
  corpo,
  op = 1,
  icone,
  corTexto,
}) => (
  <div style={{ ...estiloRotulo, fontSize: corpo, opacity: op, display: "flex", alignItems: "center", gap: Math.round(corpo * 0.36), color: corTexto ?? cor.cacauSuave }}>
    {icone}
    <span style={{ translate: "0 0.06em" }}>{txt}</span>
  </div>
);

// a chama do alerta: duas línguas caramelo que tremem de leve
const Chama: React.FC<{ t: number; tamanho: number; p: number }> = ({ t, tamanho, p }) => {
  const tremor = 1 + 0.06 * Math.sin(t * 13) * Math.sin(t * 7.1);
  return (
    <svg viewBox="0 0 60 60" width={tamanho} height={tamanho} style={{ overflow: "visible", opacity: p, scale: String(0.6 + 0.4 * p) }}>
      <g transform={`translate(30 56) scale(${tremor.toFixed(3)} ${(1 / tremor).toFixed(3)}) translate(-30 -56)`}>
        <path d="M30 4 C40 18 50 26 50 38 C50 50 41 57 30 57 C19 57 10 50 10 38 C10 28 18 22 22 12 C25 20 27 24 30 26 C31 18 30 10 30 4 Z" fill={cor.caramelo} />
        <path d="M30 30 C36 37 41 41 41 47 C41 53 36 57 30 57 C24 57 19 53 19 47 C19 42 24 39 26 34 C28 38 29 39 30 40 Z" fill={cor.carameloClaro} />
      </g>
    </svg>
  );
};

// a "entrada" e a "saída" de um bloco do peito
const visibilidade = (t: number, entra: number, sai: number, someNaSaida: boolean) => {
  const e = prog(t, entra + 0.08, 0.32);
  const s = someNaSaida ? saindo(t, sai + 0.25, 0.25) : 0;
  return { op: Math.min(e, 1 - s), some: e <= 0 || s >= 1 };
};

type Comum = { fichaY: number; t: number; palavras: Palavra[]; entra: number; sai: number; someNaSaida?: boolean };

// ---------- destaque: uma palavra ou frase curta que bate forte ----------

export const BlocoDestaque: React.FC<Comum & { m: Destaque }> = ({ m, fichaY, t, palavras, entra, sai, someNaSaida = true }) => {
  const v = visibilidade(t, entra, sai, someNaSaida);
  if (v.some) return null;
  const alerta = m.nivel === "alerta";
  const H = alturaUtil(fichaY);
  // o maior corpo em que tudo cabe na altura
  let corpoRot = 52;
  let fit: Encaixe = encaixar(m.texto, { largura: LARGURA_UTIL, max: 136, min: 76, linhas: 3 });
  let det: Encaixe | null = m.detalhe ? encaixar(m.detalhe, { largura: LARGURA_UTIL, max: 62, min: 44, linhas: 2, fonte: { familia: "texto", italico: true } }) : null;
  const altura = () => corpoRot * 1.1 + 22 + fit.linhas.length * fit.corpo * 1.04 + 26 + (det ? 18 + det.linhas.length * det.corpo * 1.1 : 0);
  for (let max = 136; altura() > H && max > 72; max -= 6) {
    fit = encaixar(m.texto, { largura: LARGURA_UTIL, max, min: Math.min(76, max), linhas: 3 });
    if (det) det = encaixar(m.detalhe as string, { largura: LARGURA_UTIL, max: Math.max(44, Math.min(62, max * 0.5)), min: 44, linhas: 2, fonte: { familia: "texto", italico: true } });
    corpoRot = Math.max(40, Math.min(52, Math.round(max * 0.4)));
  }
  const tempos = temposDe(fit.linhas.join(" "), palavras, m.em, m.ate);
  const fimTexto = (tempos[tempos.length - 1] ?? m.em) + 0.3;
  const detEm = m.detalheEm ?? fimTexto + 0.1;
  const temposDet = det ? temposDe(det.linhas.join(" "), palavras, detEm, m.ate) : [];
  const topo = topoDoBloco(fichaY, altura());
  const pChama = prog(t, m.em - 0.1, 0.35);
  const corTraco = alerta ? cor.caramelo : cor.pistache;
  const alturaLinha = fit.corpo * 1.04;
  return (
    <div style={{ position: "absolute", left: X0, top: topo, width: LARGURA_UTIL, opacity: v.op, fontFamily: texto, color: cor.cacau }}>
      <Rotulo
        txt={m.rotulo ?? (alerta ? "Atenção" : "Anote")}
        corpo={corpoRot}
        icone={alerta ? <Chama t={t} tamanho={corpoRot * 1.15} p={pChama} /> : <div style={{ width: corpoRot * 0.42, height: corpoRot * 0.42, borderRadius: corpoRot, background: cor.pistache, border: `3px solid ${cor.cacau}` }} />}
      />
      <div style={{ position: "relative", marginTop: 22 }}>
        <Escrita linhas={fit.linhas} tempos={tempos} t={t} esboco={cor.lapis} style={{ fontFamily: fonte, fontSize: fit.corpo, lineHeight: `${alturaLinha}px` }} />
        {/* o traço por baixo de cada linha: caramelo ondulado no alerta, pistache reto na chave */}
        <svg width={LARGURA_UTIL} height={fit.linhas.length * alturaLinha + 30} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {fit.linhas.map((l, i) => {
            const w = larguraLinha(l, fit.corpo);
            const y = (i + 1) * alturaLinha + 6;
            const p = prog(t, fimTexto + i * 0.14, 0.4);
            const d = alerta
              ? Array.from({ length: 13 }, (_, k) => `${k ? "L" : "M"}${((w * k) / 12).toFixed(1)} ${(y + (k % 2 ? -5 : 5)).toFixed(1)}`).join(" ")
              : `M0 ${y} L${w} ${y}`;
            return <Traco key={i} d={d} p={p} cor={corTraco} largura={alerta ? 7 : 10} />;
          })}
        </svg>
      </div>
      {det ? (
        <div style={{ marginTop: 32 }}>
          <Escrita linhas={det.linhas} tempos={temposDet} t={t} esboco={cor.lapis} style={{ fontSize: det.corpo, fontStyle: "italic", lineHeight: 1.1, color: cor.cacauSuave }} />
        </div>
      ) : null}
    </div>
  );
};

// ---------- frase: citação de efeito, com grifo e risco ----------

export const BlocoFrase: React.FC<Comum & { m: Frase }> = ({ m, fichaY, t, palavras, entra, sai, someNaSaida = true }) => {
  const v = visibilidade(t, entra, sai, someNaSaida);
  if (v.some) return null;
  const H = alturaUtil(fichaY);
  const aspas = 150;
  let fit = encaixar(m.texto, { largura: LARGURA_UTIL, max: 116, min: 72, linhas: 3 });
  const comRotulo = !!m.rotulo;
  const cabeca = comRotulo ? 52 * 1.1 + 20 : aspas * 0.42;
  for (let max = 116; cabeca + fit.linhas.length * fit.corpo * 1.06 > H && max > 72; max -= 6) {
    fit = encaixar(m.texto, { largura: LARGURA_UTIL, max, min: Math.min(72, max), linhas: 3 });
  }
  const altura = cabeca + fit.linhas.length * fit.corpo * 1.06;
  const inicio = m.em ?? m.de + 0.1;
  const tempos = temposDe(fit.linhas.join(" "), palavras, inicio, m.ate);
  const todas = fit.linhas.join(" ").split(/\s+/).filter(Boolean);
  const grifo = indicesDoTrecho(todas, m.destaque);
  const riscadas = [...indicesDoTrecho(todas, m.risco)].sort((a, b) => a - b);
  const riscoEm = m.riscoEm ?? (riscadas.length ? tempos[riscadas[0]] + 0.15 : 0);
  const topo = topoDoBloco(fichaY, altura);
  return (
    <div style={{ position: "absolute", left: X0, top: topo, width: LARGURA_UTIL, opacity: v.op, fontFamily: texto, color: cor.cacau }}>
      {comRotulo ? (
        <div style={{ marginBottom: 20 }}>
          <Rotulo txt={m.rotulo as string} corpo={52} />
        </div>
      ) : (
        // as aspas pistache abrem a frase (um enfeite da ficha, desenhado antes da primeira palavra)
        <div style={{ height: aspas * 0.42, position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: -6,
              top: -aspas * 0.2,
              fontFamily: fonte,
              fontSize: aspas,
              lineHeight: 1,
              color: cor.pistacheFundo,
              opacity: prog(t, inicio - 0.25, 0.3),
            }}
          >
            “
          </span>
        </div>
      )}
      <Escrita
        linhas={fit.linhas}
        tempos={tempos}
        t={t}
        esboco={cor.lapis}
        style={{ fontFamily: fonte, fontSize: fit.corpo, lineHeight: 1.06 }}
        estiloDe={(i) => {
          const k = riscadas.indexOf(i);
          if (k >= 0) {
            const p = prog(t, riscoEm + k * 0.12, 0.28);
            return {
              color: misturarCor(cor.cacau, "#9C8C80", p),
              backgroundImage: `linear-gradient(${cor.cacau}, ${cor.cacau})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "0 56%",
              backgroundSize: `${(p * 100).toFixed(1)}% 0.075em`,
            };
          }
          return grifo.has(i) ? estiloDestaque : undefined;
        }}
      />
    </div>
  );
};

// ---------- pergunta: um "?" num círculo, a pergunta e as opções em etiquetas ----------

export const BlocoPergunta: React.FC<Comum & { m: Pergunta }> = ({ m, fichaY, t, palavras, entra, sai, someNaSaida = true }) => {
  const v = visibilidade(t, entra, sai, someNaSaida);
  if (v.some) return null;
  const H = alturaUtil(fichaY);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const inicio = m.em ?? m.de + 0.1;
  const fonteOp = { familia: "texto" as const, italico: true };
  const PAD = 30;
  // etiquetas das opções: corpo único, quebradas em fileiras (cada etiqueta cabe na largura)
  const montarOpcoes = (corpo: number) => {
    const fits = opcoes.map((o) => encaixar(o.texto, { largura: LARGURA_UTIL - PAD * 2 - corpo, max: corpo, min: Math.min(corpo, 40), linhas: 2, fonte: fonteOp }));
    const c = Math.min(corpo, ...fits.map((f) => f.corpo));
    const larguras = fits.map((f) => Math.max(...f.linhas.map((l) => larguraLinha(l, c, fonteOp))) + PAD * 2 + c * 0.9);
    const fileiras: number[][] = [];
    let soma = Infinity;
    larguras.forEach((w, i) => {
      if (soma + 18 + w > LARGURA_UTIL) {
        fileiras.push([i]);
        soma = w;
      } else {
        fileiras[fileiras.length - 1].push(i);
        soma += 18 + w;
      }
    });
    const alturas = fileiras.map((f) => Math.max(...f.map((i) => fits[i].linhas.length)) * c * 1.12 + 30);
    return { fits, c, fileiras, altura: alturas.reduce((s, a) => s + a, 0) + 16 * Math.max(0, fileiras.length - 1) };
  };
  let corpoQ = 104;
  let fit = encaixar(m.texto, { largura: LARGURA_UTIL, max: corpoQ, min: 68, linhas: 3 });
  let ops = montarOpcoes(52);
  const cabeca = 84 + 22;
  const altura = () => cabeca + fit.linhas.length * fit.corpo * 1.04 + (opcoes.length ? 30 + ops.altura : 0);
  for (; altura() > H && corpoQ > 68; corpoQ -= 6) {
    fit = encaixar(m.texto, { largura: LARGURA_UTIL, max: corpoQ, min: Math.min(68, corpoQ), linhas: 3 });
    ops = montarOpcoes(Math.max(40, Math.min(52, Math.round(corpoQ * 0.52))));
  }
  const tempos = temposDe(fit.linhas.join(" "), palavras, inicio, m.ate);
  const topo = topoDoBloco(fichaY, altura());
  const pCirculo = prog(t, inicio - 0.1, 0.35);
  return (
    <div style={{ position: "absolute", left: X0, top: topo, width: LARGURA_UTIL, opacity: v.op, fontFamily: texto, color: cor.cacau }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, height: 84 }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 42,
            boxSizing: "border-box",
            border: `4px ${pCirculo > 0.02 ? "solid" : "dashed"} ${pCirculo > 0.02 ? cor.cacau : cor.lapis}`,
            background: pCirculo > 0.02 ? cor.pistacheClaro : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonte,
            fontSize: 60,
            lineHeight: 1,
            color: pCirculo > 0.02 ? cor.cacau : cor.lapis,
            scale: String(0.8 + 0.2 * pCirculo),
          }}
        >
          <span style={{ translate: "0 0.05em" }}>?</span>
        </div>
        <Rotulo txt={m.rotulo ?? "Pergunta"} corpo={48} />
      </div>
      <div style={{ marginTop: 22 }}>
        <Escrita linhas={fit.linhas} tempos={tempos} t={t} esboco={cor.lapis} style={{ fontFamily: fonte, fontSize: fit.corpo, lineHeight: 1.04 }} />
      </div>
      {opcoes.length ? (
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 16 }}>
          {ops.fileiras.map((fileira, fi) => (
            <div key={fi} style={{ display: "flex", gap: 18 }}>
              {fileira.map((i) => {
                const o = opcoes[i];
                const p = prog(t, o.em - 0.08, 0.3);
                const tOp = temposDe(ops.fits[i].linhas.join(" "), palavras, o.em, m.ate);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ops.c * 0.4,
                      padding: `14px ${PAD}px 16px ${PAD * 0.8}px`,
                      borderRadius: 999,
                      boxSizing: "border-box",
                      border: `3px ${p > 0.02 ? "solid" : "dashed"} ${p > 0.02 ? cor.cacau : cor.lapis}`,
                      background: p > 0.02 ? `rgba(221,230,190,${(0.4 + 0.6 * p).toFixed(3)})` : "transparent",
                    }}
                  >
                    {/* a caixinha da opção: ganha o visto quando a opção é dita */}
                    <svg viewBox="0 0 40 40" width={ops.c * 0.62} height={ops.c * 0.62} style={{ flexShrink: 0 }}>
                      <rect x={4} y={4} width={32} height={32} rx={8} fill={p > 0.02 ? cor.creme : "none"} stroke={p > 0.02 ? cor.cacau : cor.lapis} strokeWidth={3.5} strokeDasharray={p > 0.02 ? undefined : "5 5"} />
                      <Traco d="M11 21 L18 28 L30 13" p={prog(t, o.em + 0.15, 0.3)} cor={cor.cacau} largura={4.5} />
                    </svg>
                    <Escrita linhas={ops.fits[i].linhas} tempos={tOp} t={t} esboco={cor.lapis} style={{ fontSize: ops.c, fontStyle: "italic", lineHeight: 1.12 }} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// ---------- definição: o termo grande e uma seta a lápis até o significado ----------

export const BlocoDefinicao: React.FC<Comum & { m: Definicao }> = ({ m, fichaY, t, palavras, entra, sai, someNaSaida = true }) => {
  const v = visibilidade(t, entra, sai, someNaSaida);
  if (v.some) return null;
  const H = alturaUtil(fichaY);
  const RECUO = 96;
  const fonteSig = { familia: "texto" as const, italico: true };
  let maxT = 124;
  let termo = encaixar(m.termo, { largura: LARGURA_UTIL, max: maxT, min: 76, linhas: 2 });
  let sig = encaixar(m.significado, { largura: LARGURA_UTIL - RECUO, max: 78, min: 46, linhas: 3, fonte: fonteSig });
  const rot = 52 * 1.1 + 20;
  const altura = () => rot + termo.linhas.length * termo.corpo * 1.04 + 34 + sig.linhas.length * sig.corpo * 1.1;
  for (; altura() > H && maxT > 72; maxT -= 6) {
    termo = encaixar(m.termo, { largura: LARGURA_UTIL, max: maxT, min: Math.min(72, maxT), linhas: 2 });
    sig = encaixar(m.significado, { largura: LARGURA_UTIL - RECUO, max: Math.max(46, Math.round(maxT * 0.6)), min: 46, linhas: 3, fonte: fonteSig });
  }
  const tTermo = temposDe(termo.linhas.join(" "), palavras, m.em, m.ate);
  const tSig = temposDe(sig.linhas.join(" "), palavras, m.significadoEm, m.ate);
  const topo = topoDoBloco(fichaY, altura());
  const yTermoFim = rot + termo.linhas.length * termo.corpo * 1.04;
  const ySig = yTermoFim + 34;
  // a seta a lápis sai de baixo do termo e aponta para o significado
  const pSeta = prog(t, m.significadoEm - 0.3, 0.4);
  const x0 = 26;
  const y0 = yTermoFim + 6;
  const x1 = RECUO - 22;
  const y1 = ySig + sig.corpo * 0.6;
  return (
    <div style={{ position: "absolute", left: X0, top: topo, width: LARGURA_UTIL, opacity: v.op, fontFamily: texto, color: cor.cacau }}>
      <Rotulo txt={m.rotulo ?? "O que é"} corpo={52} />
      <div style={{ marginTop: 20 }}>
        <Escrita linhas={termo.linhas} tempos={tTermo} t={t} esboco={cor.lapis} style={{ fontFamily: fonte, fontSize: termo.corpo, lineHeight: 1.04 }} />
      </div>
      <svg width={LARGURA_UTIL} height={altura() + 20} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path d={`M${x0} ${y0} Q${x0} ${y1} ${x1} ${y1}`} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="7 8" strokeLinecap="round" opacity={1 - pSeta} />
        <Traco d={`M${x0} ${y0} Q${x0} ${y1} ${x1} ${y1}`} p={pSeta} cor={cor.cacau} largura={4.5} />
        <Traco d={`M${x1 - 16} ${y1 - 13} L${x1} ${y1} L${x1 - 16} ${y1 + 13}`} p={prog(t, m.significadoEm + 0.05, 0.2)} cor={cor.cacau} largura={4.5} />
      </svg>
      <div style={{ position: "absolute", left: RECUO, top: ySig }}>
        <Escrita linhas={sig.linhas} tempos={tSig} t={t} esboco={cor.lapis} style={{ fontSize: sig.corpo, fontStyle: "italic", lineHeight: 1.1 }} />
        {/* o grifo pistache sublinha o significado inteiro depois de dito */}
        <svg width={LARGURA_UTIL} height={sig.linhas.length * sig.corpo * 1.1 + 20} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {sig.linhas.map((l, i) => {
            const w = larguraLinha(l, sig.corpo, fonteSig);
            const y = (i + 1) * sig.corpo * 1.1 - sig.corpo * 0.08;
            return <Traco key={i} d={`M0 ${y} L${w} ${y}`} p={prog(t, (tSig[tSig.length - 1] ?? m.significadoEm) + 0.3 + i * 0.12, 0.35)} cor={cor.pistache} largura={8} />;
          })}
        </svg>
      </div>
    </div>
  );
};

// ---------- número: conta até o valor, com o copo medidor enchendo até a marca ----------

const COPO = { w: 200, h: 300 };

const CopoMedidor: React.FC<{ x: number; y: number; nivel: number; t: number; em: number; marca: number }> = ({ x, y, nivel, t, em, marca }) => {
  const { w, h } = COPO;
  const pTraco = prog(t, em - 0.4, 0.4);
  const corpo = `M${x + 10} ${y + 30} L${x + w - 40} ${y + 30} L${x + w - 48} ${y + h - 16} Q${x + w - 50} ${y + h} ${x + w - 66} ${y + h} L${x + 26} ${y + h} Q${x + 10} ${y + h} ${x + 8} ${y + h - 16} Z`;
  const fundo = y + h - 6;
  const topoLiquido = mistura(fundo, y + 44, nivel);
  const marcas = [0.25, 0.5, 0.75, 1].map((k) => mistura(fundo, y + 44, k));
  const id = `copo-${Math.round(x)}-${Math.round(y)}`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id={id}>
          <path d={corpo} />
        </clipPath>
      </defs>
      <ellipse cx={x + w / 2 - 14} cy={y + h + 6} rx={w * 0.46} ry={11} fill="rgba(46,30,26,0.14)" opacity={pTraco} />
      <path d={corpo} fill="#FBF7EE" opacity={pTraco} />
      <g clipPath={`url(#${id})`}>
        {nivel > 0.002 ? (
          <>
            <rect x={x} y={topoLiquido} width={w} height={fundo - topoLiquido + 20} fill={tintas.massa} />
            <ellipse cx={x + w / 2 - 14} cy={topoLiquido} rx={w * 0.45} ry={8} fill={misturarCor(tintas.massa, "#C9A48C", 0.35)} />
          </>
        ) : null}
      </g>
      {/* graduação */}
      {marcas.map((my, i) => (
        <path key={i} d={`M${x + 22} ${my} L${x + (i % 2 ? 52 : 70)} ${my}`} stroke={cor.cacau} strokeWidth={3.5} strokeLinecap="round" opacity={pTraco * 0.8} />
      ))}
      {/* esboço a lápis antes do traço */}
      <path d={corpo} fill="none" stroke={cor.lapis} strokeWidth={3.2} strokeDasharray="7 8" opacity={1 - pTraco} />
      <Traco d={corpo} p={pTraco} cor={cor.cacau} largura={5} />
      {/* alça e bico */}
      <Traco d={`M${x + w - 42} ${y + 70} Q${x + w + 14} ${y + 74} ${x + w + 4} ${y + 150} Q${x + w - 6} ${y + 196} ${x + w - 47} ${y + 196}`} p={pTraco} cor={cor.cacau} largura={5} />
      <Traco d={`M${x + 10} ${y + 30} L${x - 6} ${y + 14}`} p={pTraco} cor={cor.cacau} largura={5} />
      {/* a marca pistache no nível final */}
      <g opacity={marca}>
        <path d={`M${x - 14} ${topoLiquido} L${x + w - 28} ${topoLiquido}`} stroke={cor.pistache} strokeWidth={7} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const mistura = (a: number, b: number, p: number) => a + (b - a) * p;

export const BlocoNumero: React.FC<Comum & { m: Numero }> = ({ m, fichaY, t, palavras, entra, sai, someNaSaida = true }) => {
  const v = visibilidade(t, entra, sai, someNaSaida);
  if (v.some) return null;
  const H = alturaUtil(fichaY);
  const casas = m.casas ?? casasDe(m.valor);
  const final = numeroBR(m.valor, casas);
  const larguraNumero = LARGURA_UTIL - COPO.w - 50;
  const pre = m.prefixo?.trim();
  const suf = m.sufixo?.trim();
  // corpo do número: o maior que cabe (com prefixo e sufixo a 42% do corpo) na largura e na altura
  const larguraTotal = (c: number) =>
    larguraLinha(final, c) + (pre ? larguraLinha(pre, c * 0.42) + c * 0.1 : 0) + (suf ? larguraLinha(suf, c * 0.42) + c * 0.1 : 0);
  const fonteRot = { familia: "texto" as const, italico: true };
  let corpo = 200;
  while (corpo > 96 && larguraTotal(corpo) > larguraNumero) corpo -= 4;
  let rot = encaixar(m.rotulo, { largura: larguraNumero, max: 66, min: 44, linhas: 2, fonte: fonteRot });
  const altura = () => corpo * 0.86 + 24 + rot.linhas.length * rot.corpo * 1.1 + (m.ilustrativo ? 60 : 0);
  while (altura() > H && corpo > 96) {
    corpo -= 6;
    rot = encaixar(m.rotulo, { largura: larguraNumero, max: Math.max(44, Math.min(66, Math.round(corpo * 0.36))), min: 44, linhas: 2, fonte: fonteRot });
  }
  const alturaFinal = Math.max(altura(), COPO.h + 20);
  const topo = topoDoBloco(fichaY, Math.min(alturaFinal, H));
  // a contagem: começa na palavra do número e termina em até 1,4 s
  const dur = Math.max(0.5, Math.min(1.4, m.ate - m.em - 0.4));
  const pc = prog(t, m.em, dur);
  const atual = numeroBR(m.valor * pc, casas);
  const ativo = t >= m.em - 0.05;
  const rotEm = m.rotuloEm ?? m.em + 0.2;
  const tRot = temposDe(rot.linhas.join(" "), palavras, rotEm, m.ate);
  const marca = prog(t, m.em + dur, 0.3);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v.op, fontFamily: texto, color: cor.cacau }}>
      <div style={{ position: "absolute", left: X0, top: topo, width: larguraNumero }}>
        <div style={{ display: "flex", alignItems: "flex-start", height: corpo * 0.86, lineHeight: 1 }}>
          {pre ? <span style={{ fontFamily: fonte, fontSize: corpo * 0.42, marginRight: corpo * 0.1, marginTop: corpo * 0.08, color: ativo ? cor.cacau : cor.lapis }}>{pre}</span> : null}
          {ativo ? (
            <span style={{ fontFamily: fonte, fontSize: corpo, lineHeight: 0.86, fontVariantNumeric: "tabular-nums" }}>{atual}</span>
          ) : (
            // espera a lápis: o lugar do número já está marcado antes de ele ser dito
            <div style={{ width: larguraLinha(final, corpo), height: corpo * 0.74, marginTop: corpo * 0.04, borderRadius: 26, border: `4px dashed ${cor.lapis}`, boxSizing: "border-box" }} />
          )}
          {suf ? <span style={{ fontFamily: fonte, fontSize: corpo * 0.42, marginLeft: corpo * 0.1, alignSelf: "flex-end", marginBottom: corpo * 0.04, color: ativo ? cor.cacau : cor.lapis }}>{suf}</span> : null}
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 4, background: cor.pistache, marginTop: rot.corpo * 0.6, flexShrink: 0, scale: `${prog(t, rotEm - 0.1, 0.3)} 1`, transformOrigin: "0 50%" }} />
          <Escrita linhas={rot.linhas} tempos={tRot} t={t} esboco={cor.lapis} style={{ fontSize: rot.corpo, fontStyle: "italic", lineHeight: 1.1 }} />
        </div>
        {m.ilustrativo ? <Ilustrativo y={0} estatico /> : null}
      </div>
      <CopoMedidor x={X1 - COPO.w + 10} y={topo + Math.max(0, (Math.min(alturaFinal, H) - COPO.h) / 2) - 10} nivel={0.86 * pc} t={t} em={m.em} marca={marca} />
    </div>
  );
};

// etiqueta "ilustrativo" (o desenho não vem de números ditos)
export const Ilustrativo: React.FC<{ y: number; x?: number; estatico?: boolean; op?: number }> = ({ y, x, estatico, op = 1 }) => (
  <div
    style={{
      ...(estatico ? { marginTop: 22, display: "inline-flex" } : { position: "absolute", left: x, top: y, display: "flex" }),
      alignItems: "center",
      padding: "6px 18px 8px",
      borderRadius: 999,
      border: `3px solid ${cor.cacauApagado}`,
      fontFamily: texto,
      fontSize: 34,
      fontStyle: "italic",
      lineHeight: 1,
      color: cor.cacauSuave,
      opacity: op,
      background: cor.creme,
    }}
  >
    ilustrativo
  </div>
);

// a largura útil para quem precisar (Fechamento usa a mesma conta de altura)
export const LARGURA_PEITO = X1 - X0;
