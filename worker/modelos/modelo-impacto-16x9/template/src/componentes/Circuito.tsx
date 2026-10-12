import { Easing } from "remotion";
import { batida, prog, saindo, useTempo } from "../anim";
import type { Circuito as TCircuito, Passos as TPassos } from "../plano";
import { caber, caixaAlta, cor, larguraEm, larguraMonoEm, MARGEM, mono, QUADRO, rotulo, sora, TRACKING } from "../tema";
import { alinhar, encaixar, quebrar } from "../texto";
import type { Contexto } from "./contexto";
import { Check } from "./Icones";
import { Palavras } from "./Pilha";

// Arco de círculo em SVG (graus, 0 = topo, sentido horário).
const arco = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(Math.max(a0 + 0.01, a1));
  const grande = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${grande} 1 ${x1} ${y1}`;
};

// A ficha (circuito ou passos) com os mesmos campos.
type Ficha = {
  de: number;
  ate: number;
  rotulo?: string;
  titulo?: { em: number; texto: string };
  intervalo?: TCircuito["intervalo"];
  itens: { em: number; texto: string; detalhe?: string }[];
  voltas?: TCircuito["voltas"];
  fimEm?: number;
};

export const fichaDe = (m: TCircuito | TPassos): Ficha => {
  if (m.tipo === "passos") {
    return { de: m.de, ate: m.ate, titulo: m.titulo ? { em: m.de + 0.05, texto: m.titulo } : undefined, itens: m.itens.slice(0, 5), fimEm: m.fimEm };
  }
  const titulo = typeof m.titulo === "string" ? { em: m.de + 0.05, texto: m.titulo } : m.titulo;
  return { ...m, titulo, itens: m.itens.slice(0, 5) };
};

// A ficha em tela cheia: título, anel de intervalo que gira (opcional), itens numerados que entram
// quando são falados (o da vez aceso, os que passaram com ✓) e o selo no acento. A pessoa fica numa
// janela no canto. Serve para qualquer lista que se cumpre: rotina, etapas, critérios, checklist.
//
// No quadro deitado (1920×1080) a pilha alta do vertical vira fileiras e colunas:
//   COM ANEL   [ rótulo / título (embaixo, na linha da janela)        | JANELA ]
//              [ anel | legenda do anel + selo | lista numerada                ]
//   SEM ANEL   [ rótulo / título                                       | JANELA ]
//              [ lista numerada (coluna da esquerda) + selo            |        ]
export const Circuito: React.FC<{ m: TCircuito | TPassos; ctx: Contexto }> = ({ m: original, ctx }) => {
  const t = useTempo();
  const m = fichaDe(original);
  const JANELA = ctx.geo.janela;
  // sai com a cortina (ou com a caixa da pessoa crescendo por cima)
  const s = saindo(t, ctx.saida, 0.12);
  const entrada = prog(t, m.de, 0.3);
  const fim = m.fimEm ?? Infinity;
  const acabou = t >= fim;
  // ——— cabeçalho (à esquerda da janela) ———
  const larguraCab = JANELA.x - MARGEM - 48;
  const temAnel = !!m.intervalo;
  const DIREITA = QUADRO.w - MARGEM;
  const titulo = m.titulo ? caixaAlta(m.titulo.texto) : "";
  const numTitulo = titulo.match(/^(\d+)\s+(.+)$/);
  const tamNumTitulo = numTitulo ? 190 : 0;
  const restoTitulo = numTitulo ? numTitulo[2] : titulo;
  const larguraNumTitulo = numTitulo ? larguraMonoEm(numTitulo[1]) * tamNumTitulo * 0.96 + 26 : 0;
  const larguraResto = larguraCab - larguraNumTitulo;
  // título numa linha até 96 px; se ficar menor que 64 px, quebra em até 3 linhas
  const umaLinha = restoTitulo ? caber(restoTitulo, larguraResto, 96) : 0;
  const quebrado =
    restoTitulo && umaLinha < 64 ? encaixar(restoTitulo, { largura: larguraResto, max: 84, min: 52, maxLinhas: 3, peso: 800, espacamento: TRACKING }) : null;
  const tamTitulo = quebrado ? quebrado.tamanho : umaLinha;
  const linhasTitulo = quebrado ? quebrado.linhas : restoTitulo ? [restoTitulo] : [];
  const alturaTitulo = Math.max(tamNumTitulo ? tamNumTitulo * 0.8 : 0, linhasTitulo.length * tamTitulo * 0.92);
  // com anel, o título assenta na linha de baixo da janela (como no vertical); sem anel, ele fica logo
  // abaixo do rótulo e a lista desce pela coluna da esquerda, ao lado da janela
  const topoTitulo = temAnel
    ? JANELA.y + JANELA.h - (quebrado ? alturaTitulo : tamNumTitulo ? tamNumTitulo * 0.8 : tamTitulo)
    : JANELA.y + 8 + (m.rotulo ? 66 : 0);
  // a faixa de baixo da ficha (acima da legenda, quando ela continua)
  const baseFicha = ctx.base;

  // ——— anel (fileira de baixo, à esquerda) ———
  const nomes = m.intervalo?.nomes ?? ["treino", "descanso"];
  const unidadeAnel = m.intervalo?.unidade ?? "s";
  const topoFileira = Math.max(JANELA.y + JANELA.h, topoTitulo + alturaTitulo) + 52;
  const R = Math.round(Math.min(190, Math.max(140, (baseFicha - topoFileira - 34) / 2)));
  const cx = MARGEM + 17 + R;
  const cy = Math.round(topoFileira + (baseFicha - topoFileira) / 2);
  // legenda do anel (os dois tempos) e selo à direita do anel; a lista vem depois deles
  const tamNumAnel = unidadeAnel === "min" ? 72 : 92;
  const xLegenda = cx + R + 70;
  const LARGURA_LEGENDA = 400;
  const tempoDoAnel = (i: number) => `${i === 0 ? (m.intervalo?.trabalho ?? "") : (m.intervalo?.descanso ?? "")}${unidadeAnel}`;
  // o nome de cada tempo encolhe (até 26 px) para a legenda não passar de LARGURA_LEGENDA
  const tamNomeAnel = Math.max(
    26,
    Math.min(
      36,
      ...nomes.map((nome, i) =>
        Math.floor((LARGURA_LEGENDA - larguraMonoEm(tempoDoAnel(i)) * tamNumAnel - 18) / Math.max(0.5, larguraEm(caixaAlta(nome), 700, 0.16))),
      ),
    ),
  );
  const larguraLegenda = temAnel
    ? Math.max(
        ...nomes.map((nome, i) => larguraMonoEm(tempoDoAnel(i)) * tamNumAnel + 18 + larguraEm(caixaAlta(nome), 700, 0.16) * tamNomeAnel),
        m.voltas ? 60 + larguraMonoEm(m.voltas.valor) * 88 + 20 + (m.voltas.texto ? larguraEm(caixaAlta(m.voltas.texto), 700, 0.1) * 40 : 0) : 0,
      )
    : 0;
  const total = temAnel ? m.intervalo!.trabalho + m.intervalo!.descanso : 1;
  const aTrab = temAnel ? (360 * m.intervalo!.trabalho) / total : 0;
  const pTrab = temAnel ? prog(t, m.intervalo!.em, 0.45) : 0;
  const pDesc = temAnel ? prog(t, m.intervalo!.descansoEm ?? m.intervalo!.em + 0.5, 0.3) : 0;
  const pFim = prog(t, fim, 0.35);

  // item ativo e posição do ponteiro: uma volta por item, do momento em que ele é dito até o próximo
  const itens = m.itens;
  let ativo = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.02) ativo = i;
  });
  const fimDoCiclo = (i: number) => itens[i + 1]?.em ?? Math.min(fim, m.ate);
  const volta = ativo >= 0 && !acabou ? prog(t, itens[ativo].em, Math.max(0.4, fimDoCiclo(ativo) - itens[ativo].em), Easing.linear) : 0;
  const angulo = volta * 360;
  const emTrabalho = ativo < 0 ? t < (m.intervalo?.descansoEm ?? Infinity) : angulo < aTrab;
  const restante = temAnel
    ? ativo < 0
      ? emTrabalho
        ? m.intervalo!.trabalho
        : m.intervalo!.descanso
      : emTrabalho
        ? Math.ceil(m.intervalo!.trabalho * (1 - angulo / aTrab))
        : Math.ceil(m.intervalo!.descanso * (1 - (angulo - aTrab) / (360 - aTrab)))
    : 0;

  // ——— lista ———
  // com anel: na fileira de baixo, à direita da legenda do anel. Sem anel: na coluna da esquerda,
  // logo abaixo do cabeçalho (que pode ter quebrado em mais linhas), ao lado da janela.
  const xLista = temAnel ? Math.round(xLegenda + Math.min(LARGURA_LEGENDA + 40, larguraLegenda) + 64) : MARGEM;
  const W = temAnel ? DIREITA - xLista : larguraCab;
  const topoLista = temAnel ? topoFileira : titulo ? topoTitulo + alturaTitulo + 56 : JANELA.y + 8 + (m.rotulo ? 66 : 0);
  // sem anel, o selo fica embaixo da lista: a lista para antes dele
  const alturaLista = baseFicha - topoLista - (!temAnel && m.voltas ? 158 : 0);
  const maxItem = temAnel ? 70 : 88;
  // coluna do número, do texto e do ✓ dependem do corpo
  const larguraTexto = (tam: number) => W - tam * 1.3 - tam - 2 * 34;
  const umaLinhaItens = Math.min(maxItem, ...itens.map((it) => caber(caixaAlta(it.texto), larguraTexto(maxItem), 200)));
  const DET = 38;
  const temDetalhe = itens.some((it) => it.detalhe);
  // item longo: quebra em até 3 linhas com um corpo comum a todos (nunca abaixo de 44 px)
  let tamItem = umaLinhaItens;
  let linhasItens = itens.map((it) => [caixaAlta(it.texto)]);
  if (umaLinhaItens < 56) {
    tamItem = 44;
    for (let tam = maxItem; tam >= 44; tam -= 2) {
      const qs = itens.map((it) => quebrar(caixaAlta(it.texto), larguraTexto(tam), tam, 800, TRACKING));
      const cabe = qs.every((q) => q.length <= 3 && q.every((l) => larguraEm(l, 800, TRACKING) * tam <= larguraTexto(tam)));
      const altura = qs.reduce((soma, q, i) => soma + q.length * tam * 1.04 + 40 + (itens[i].detalhe ? 56 : 0), 0);
      if (cabe && altura <= alturaLista) {
        tamItem = tam;
        linhasItens = qs;
        break;
      }
    }
    if (tamItem === 44) linhasItens = itens.map((it) => quebrar(caixaAlta(it.texto), larguraTexto(44), 44, 800, TRACKING));
  }
  const detalhes = itens.map((it) => (it.detalhe ? encaixar(it.detalhe, { largura: larguraTexto(tamItem), max: DET + 8, min: 40, maxLinhas: 2 }) : null));
  const conteudo = (i: number) => {
    const det = detalhes[i] ? detalhes[i]!.linhas.length * detalhes[i]!.tamanho * 1.15 + 6 : 0;
    return linhasItens[i].length * tamItem * 1.04 + 40 + det;
  };
  const multi = linhasItens.some((l) => l.length > 1) || temDetalhe;
  // linhas da ficha: uma linha só = altura fixa (como no exemplo); com quebra ou detalhe, a ficha
  // se espalha pela altura livre (sem anel), para a tela não ficar com um terço vazio
  const alturaItem = (i: number) =>
    multi
      ? Math.max(conteudo(i), temAnel ? 0 : Math.min(230, alturaLista / Math.max(1, itens.length)))
      : Math.min(temAnel ? 94 : 132, alturaLista / Math.max(1, itens.length));

  // cada palavra do item entra na sua palavra dita (a primeira no `em` do item)
  const temposItens = itens.map((it, i) =>
    alinhar(it.texto, ctx.palavras, it.em, itens[i + 1]?.em ?? m.ate).map((x, k) => (k === 0 ? it.em : Math.max(it.em, x))),
  );
  const selo = m.voltas;
  const pSelo = selo ? prog(t, selo.em, 0.24) : 0;
  const somaItens = itens.reduce((soma, _, i) => soma + alturaItem(i), 0);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: (1 - s) * entrada }}>
      {/* cabeçalho */}
      {m.rotulo ? (
        <div style={{ position: "absolute", left: MARGEM, top: JANELA.y + 8, width: larguraCab, ...rotulo, color: cor.volt, ...batida(t, m.de + 0.05, "baixo") }}>
          {m.rotulo}
        </div>
      ) : null}
      {titulo && m.titulo ? (
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            top: topoTitulo,
            display: "flex",
            alignItems: "flex-end",
            gap: 26,
            whiteSpace: "nowrap",
            ...batida(t, m.titulo.em, "baixo"),
          }}
        >
          {numTitulo ? (
            <div style={{ fontFamily: mono, fontWeight: 800, fontSize: tamNumTitulo, lineHeight: 0.8, color: cor.volt, letterSpacing: "-0.04em" }}>
              {numTitulo[1]}
            </div>
          ) : null}
          <div
            style={{
              fontFamily: sora,
              fontWeight: 800,
              fontSize: tamTitulo,
              lineHeight: quebrado ? 0.92 : 0.9,
              letterSpacing: `${TRACKING}em`,
              color: cor.papel,
              paddingBottom: numTitulo ? 4 : 0,
            }}
          >
            {linhasTitulo.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </div>
      ) : null}

      {/* anel de intervalo */}
      {temAnel ? (
        <>
          <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.trilho} strokeWidth={30} opacity={prog(t, m.intervalo!.em - 0.1, 0.2)} />
            {pTrab > 0 ? (
              <path d={arco(cx, cy, R, 0, aTrab * pTrab)} fill="none" stroke={cor.volt} strokeWidth={30} strokeLinecap="butt" />
            ) : null}
            {pDesc > 0 ? (
              <path
                d={arco(cx, cy, R, aTrab + 3, aTrab + 3 + (360 - aTrab - 6) * pDesc)}
                fill="none"
                stroke={acabou ? cor.volt : cor.papel}
                strokeOpacity={acabou ? pFim : 0.55}
                strokeWidth={30}
              />
            ) : null}
            {/* ponteiro: dá uma volta por item */}
            {ativo >= 0 && !acabou ? (
              <line
                x1={cx + (R - 34) * Math.sin((angulo * Math.PI) / 180)}
                y1={cy - (R - 34) * Math.cos((angulo * Math.PI) / 180)}
                x2={cx + (R + 34) * Math.sin((angulo * Math.PI) / 180)}
                y2={cy - (R + 34) * Math.cos((angulo * Math.PI) / 180)}
                stroke={cor.papel}
                strokeWidth={10}
              />
            ) : null}
          </svg>
          {/* centro: cronômetro ou ✓ no fim */}
          <div
            style={{
              position: "absolute",
              left: cx - R,
              top: cy - R,
              width: 2 * R,
              height: 2 * R,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: pTrab,
            }}
          >
            {acabou ? (
              <Check p={pFim} tamanho={170} cor={cor.volt} espessura={5} />
            ) : (
              <>
                <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 150, lineHeight: 0.9, color: emTrabalho ? cor.papel : cor.apagado, letterSpacing: "-0.04em" }}>
                  {String(restante).padStart(2, "0")}
                </div>
                <div style={{ ...rotulo, fontSize: 36, marginTop: 14, color: emTrabalho ? cor.volt : cor.papel }}>
                  {emTrabalho ? nomes[0] : nomes[1]}
                </div>
              </>
            )}
          </div>
          {/* legenda do anel */}
          <div style={{ position: "absolute", left: xLegenda, top: cy - R + 6, display: "flex", flexDirection: "column", gap: 34 }}>
            {[
              { v: m.intervalo!.trabalho, txt: nomes[0], em: m.intervalo!.em, c: cor.volt },
              { v: m.intervalo!.descanso, txt: nomes[1], em: m.intervalo!.descansoEm ?? m.intervalo!.em + 0.5, c: cor.papel },
            ].map((l, i) => (
              <div key={`${l.txt}-${i}`} style={{ display: "flex", alignItems: "baseline", gap: 18, ...batida(t, l.em, "baixo") }}>
                <div style={{ fontFamily: mono, fontWeight: 800, fontSize: tamNumAnel, lineHeight: 1, color: l.c, letterSpacing: "-0.04em" }}>
                  {l.v}
                  {unidadeAnel}
                </div>
                <div style={{ ...rotulo, fontSize: tamNomeAnel, color: cor.papel, whiteSpace: "nowrap" }}>{l.txt}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* selo de voltas */}
      {selo ? (
        <div
          style={{
            position: "absolute",
            left: temAnel ? xLegenda : MARGEM,
            top: temAnel ? cy + R - 118 : Math.min(topoLista + somaItens + 40, baseFicha - 118),
            height: 118,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "0 30px",
            background: cor.volt,
            color: cor.fundo,
            opacity: pSelo > 0 ? 1 : 0,
            clipPath: `inset(0 ${(1 - pSelo) * 100}% 0 0)`,
          }}
        >
          <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 88, lineHeight: 1, letterSpacing: "-0.04em" }}>{selo.valor}</div>
          {selo.texto ? <div style={{ ...rotulo, fontSize: 40, fontWeight: 700, letterSpacing: "0.1em" }}>{selo.texto}</div> : null}
        </div>
      ) : null}

      {/* itens */}
      <div style={{ position: "absolute", left: xLista, top: topoLista, width: W }}>
        {itens.map((it, i) => {
          const visto = t >= it.em - 0.02;
          const feito = acabou || i < ativo;
          const eAtivo = i === ativo && !acabou;
          // as vagas numeradas aparecem junto com a ficha (o lugar de cada item já marcado), antes dos nomes
          const vaga = prog(t, Math.min(m.titulo?.em ?? m.de, m.de + 0.1) + 0.08 * i, 0.2);
          const det = detalhes[i];
          return (
            <div
              key={`${it.texto}-${i}`}
              style={{
                height: alturaItem(i),
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
                gap: 34,
                borderTop: `2px solid ${cor.trilho}`,
                opacity: vaga,
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: Math.round(tamItem * 0.78),
                  lineHeight: linhasItens[i].length > 1 || det ? 1.3 : undefined,
                  width: tamItem * 1.3,
                  flexShrink: 0,
                  color: eAtivo ? cor.volt : feito ? cor.apagado : visto ? cor.papel : cor.apagado,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: sora,
                    fontWeight: 800,
                    fontSize: tamItem,
                    lineHeight: linhasItens[i].length > 1 || det ? 1.04 : 1,
                    letterSpacing: `${TRACKING}em`,
                    whiteSpace: "nowrap",
                    color: eAtivo ? cor.papel : cor.apagado,
                  }}
                >
                  {linhasItens[i].map((l, k) => {
                    const antes = linhasItens[i].slice(0, k).reduce((n, x) => n + x.split(/\s+/).length, 0);
                    return (
                      <div key={k}>
                        <Palavras t={t} texto={l} tempos={temposItens[i].slice(antes)} reserva={it.em} vem="baixo" />
                      </div>
                    );
                  })}
                </div>
                {det ? (
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: sora,
                      fontWeight: 700,
                      fontSize: det.tamanho,
                      lineHeight: 1.15,
                      color: cor.papel,
                      opacity: eAtivo ? 0.78 : 0.4,
                      ...batida(t, it.em + 0.35, "baixo"),
                    }}
                  >
                    {det.linhas.map((l, k) => (
                      <div key={k}>{l}</div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div style={{ width: tamItem, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                {feito ? <Check p={prog(t, acabou ? fim + 0.05 * i : itens[i + 1]?.em ?? fim, 0.25)} tamanho={tamItem * 0.9} cor={cor.volt} espessura={7} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
