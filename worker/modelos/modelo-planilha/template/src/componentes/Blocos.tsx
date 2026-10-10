// Blocos de uma célula só: a célula mesclada em cima da pessoa ("grande", linhas 1–3) ou embaixo
// dela ("alto"). Cada bloco é uma operação de planilha: digitar um valor e formatar (número),
// formatação condicional (destaque), texto tachado (frase), nota presa à célula (definição), lista
// suspensa de validação (pergunta), duas linhas com regra condicional (comparação).
// Todo texto é medido (medida.ts) e cabe na célula; tudo espera "a lápis" até a sua palavra.
import { fimDaDigitacao, formatar, limitar, piscando, prog, quandoDito, temposDoTexto, Traco } from "../anim";
import type { Ret } from "../grade";
import { encaixar, larguraTexto, umaLinha } from "../medida";
import type { Comparacao, Definicao, Destaque, Frase, Numero, Palavra, Pergunta } from "../plano";
import { linhasDaComparacao, opacidadeDeSaida, opacidadeDoConteudo, type Saida } from "../roteiro";
import { cor, sans } from "../tema";
import { Icone } from "./Icones";
import { Marca } from "./Tabela";
import { Esboco, Ilustrativo, Rotulo, TextoFalado } from "./Texto";

// ---------- a célula mesclada ----------

// Opaca (limpa o que estava embaixo), entra no `de` e sai pela regra do roteiro (coberta ou apagada).
export const CelulaBloco: React.FC<{ ret: Ret; t: number; de: number; saida?: Saida; children: React.ReactNode; fundo?: string }> = ({
  ret,
  t,
  de,
  saida,
  children,
  fundo = cor.celula,
}) => {
  // a célula limpa o lugar dela de uma vez (como uma célula selecionada): nada do que estava
  // embaixo aparece através dela; só o conteúdo entra suave
  const aparece = t >= de - 0.001 || de <= 0.05 ? 1 : 0;
  const sai = opacidadeDeSaida(t, saida);
  const entra = de <= 0.05 ? 1 : prog(t, de, 0.3);
  if (Math.min(aparece, sai) <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: ret.x,
        top: ret.y,
        width: ret.w,
        height: ret.h,
        background: fundo,
        boxShadow: `inset 0 0 0 1.5px ${cor.grade}`,
        opacity: Math.min(aparece, sai),
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(entra, opacidadeDoConteudo(t, saida)), translate: `0 ${(1 - entra) * 12}px` }}>{children}</div>
    </div>
  );
};

type Props<M> = { m: M; ret: Ret; t: number; palavras: Palavra[]; saida?: Saida };

const PAD = 40;
const tempos = (texto: string, palavras: Palavra[], em: number, ate: number) => temposDoTexto(texto, palavras, em - 0.3, ate, em);
// a célula é alta (embaixo da pessoa "alto", com a gravação comum) ou baixa (linhas 1–3)
const alta = (r: Ret) => r.h >= 420;

// ---------- número: o valor é digitado e a célula formata e conta ----------

export const BlocoNumero: React.FC<Props<Numero>> = ({ m, ret, t, palavras, saida }) => {
  const rotuloEm = m.rotuloEm ?? m.de;
  const tr = tempos(m.rotulo, palavras, rotuloEm, m.ate);
  const formato = (v: number) => `${m.prefixo ? `${m.prefixo} ` : ""}${formatar(v, m.casas ?? 0)}${m.sufixo ?? ""}`;
  const final = formato(m.valor);
  const p = prog(t, m.em, 0.9);
  const largura = ret.w - 2 * PAD;
  const tamRotulo = umaLinha(m.rotulo, largura - (m.ilustrativo ? 260 : 0), 36, 30, { peso: 700, caixaAlta: true, espacamento: 0.04 });
  const tamNumero = umaLinha(final, largura, alta(ret) ? 200 : Math.min(170, ret.h - 2 * 30 - tamRotulo - 24), 72, { peso: 700 });
  // a régua de formato: um traço que se desenha sob o número quando a contagem termina
  const regua = prog(t, m.em + 0.85, 0.5);
  const larguraNumero = larguraTexto(final, tamNumero, { peso: 700 });
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      <div style={{ position: "absolute", inset: 0, padding: `0 ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, minHeight: tamRotulo * 1.1 }}>
          {t < (tr[0] ?? rotuloEm) ? <Esboco w={largura * 0.3} h={20} /> : <Rotulo texto={m.rotulo} tempos={tr} t={t} tamanho={tamRotulo} />}
          {m.ilustrativo ? <Ilustrativo p={prog(t, m.em, 0.3)} /> : null}
        </div>
        <div style={{ position: "relative", fontFamily: sans, fontWeight: 700, fontSize: tamNumero, lineHeight: 1, color: p > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {p > 0 ? formato(m.valor * p) : final.replace(/\d/g, "0")}
          <svg width={larguraNumero} height={14} style={{ position: "absolute", left: 0, bottom: -18, overflow: "visible" }}>
            <Traco d={`M0 4H${larguraNumero.toFixed(0)}`} p={regua} cor={cor.acento} largura={4} />
          </svg>
        </div>
      </div>
    </CelulaBloco>
  );
};

// ---------- destaque: formatação condicional ----------

export const BlocoDestaque: React.FC<Props<Destaque>> = ({ m, ret, t, palavras, saida }) => {
  const alerta = m.nivel === "alerta";
  const tt = tempos(m.texto, palavras, m.em, m.ate);
  const fimTexto = fimDaDigitacao(m.texto, tt);
  const pinta = prog(t, Math.min(fimTexto + 0.1, m.ate - 0.45), 0.35);
  const tile = alta(ret) ? 112 : 84;
  const largura = ret.w - 2 * PAD - tile - 30;
  const temDetalhe = !!m.detalhe;
  const enc = encaixar(m.texto, { largura, max: alta(ret) ? 96 : temDetalhe ? 74 : 84, min: 48, linhas: 2, fonte: { peso: 700 } });
  const detalheEm = m.detalheEm ?? fimTexto + 0.3;
  const td = m.detalhe ? tempos(m.detalhe, palavras, detalheEm, m.ate) : [];
  const encD = m.detalhe ? encaixar(m.detalhe, { largura, max: 46, min: 36, linhas: 2, fonte: { peso: 500 } }) : null;
  const fundo = alerta ? cor.acento : cor.acentoFundo;
  const camada = (final: boolean) => {
    const corTexto = final ? (alerta ? "#FFFFFF" : cor.acentoEscuro) : cor.tinta;
    const corApoio = final ? (alerta ? "rgba(255,255,255,0.86)" : cor.acentoEscuro) : cor.tintaSuave;
    return (
      <div style={{ position: "absolute", inset: 0, padding: `0 ${PAD}px`, display: "flex", alignItems: "center", gap: 30 }}>
        <div
          style={{
            width: tile,
            height: tile,
            borderRadius: 22,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: final ? (alerta ? "rgba(255,255,255,0.16)" : "#FFFFFF") : cor.acentoFundo,
          }}
        >
          <Icone nome={alerta ? "alerta" : "chave"} tamanho={tile * 0.62} cor={final ? (alerta ? "#FFFFFF" : cor.acento) : cor.acento} peso={3.6} p={prog(t, m.em, 0.6)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {t < (tt[0] ?? m.em) ? (
            <>
              <Esboco w={largura * 0.7} h={26} />
              <Esboco w={largura * 0.45} h={26} />
            </>
          ) : (
            <TextoFalado texto={m.texto} tempos={tt} t={t} linhas={enc.linhas} cursor={!final} style={{ fontFamily: sans, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.06, color: corTexto }} />
          )}
          {m.detalhe && encD && t >= (td[0] ?? detalheEm) ? (
            <TextoFalado texto={m.detalhe} tempos={td} t={t} linhas={encD.linhas} style={{ fontFamily: sans, fontWeight: 500, fontSize: encD.tamanho, lineHeight: 1.12, color: corApoio }} />
          ) : null}
        </div>
      </div>
    );
  };
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      {pinta < 1 ? camada(false) : null}
      {pinta > 0 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: pinta < 1 ? `inset(0 ${((1 - pinta) * 100).toFixed(2)}% 0 0)` : undefined, background: fundo }}>{camada(true)}</div>
      ) : null}
    </CelulaBloco>
  );
};

// ---------- frase: digitada, com destaque e tachado ----------

export const BlocoFrase: React.FC<Props<Frase>> = ({ m, ret, t, palavras, saida }) => {
  const em = m.em ?? m.de;
  const tt = temposDoTexto(m.texto, palavras, m.em !== undefined ? em - 0.3 : m.de, m.ate, em);
  const largura = ret.w - 2 * PAD - 36;
  const enc = encaixar(m.texto, { largura, max: alta(ret) ? 88 : 72, min: 48, linhas: 3, fonte: { peso: 700 } });
  const altura = enc.linhas.length * enc.tamanho * 1.08;
  const barra = prog(t, tt[0] ?? em, 0.5);
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      <div style={{ position: "absolute", inset: 0, padding: `0 ${PAD}px`, display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ width: 8, height: altura, borderRadius: 4, background: cor.esbocoClaro, position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 8, height: altura * barra, borderRadius: 4, background: cor.acento }} />
        </div>
        {t < (tt[0] ?? em) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {enc.linhas.map((l, i) => (
              <Esboco key={i} w={Math.min(largura, larguraTexto(l, enc.tamanho, { peso: 700 }))} h={24} />
            ))}
          </div>
        ) : (
          <TextoFalado
            texto={m.texto}
            tempos={tt}
            t={t}
            linhas={enc.linhas}
            destaque={m.destaque}
            risco={m.risco}
            riscoEm={m.riscoEm}
            cursor
            style={{ fontFamily: sans, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.08, color: cor.tinta }}
          />
        )}
      </div>
    </CelulaBloco>
  );
};

// ---------- definição: o termo na célula e o significado numa nota presa a ela ----------

export const BlocoDefinicao: React.FC<Props<Definicao>> = ({ m, ret, t, palavras, saida }) => {
  const tt = tempos(m.termo, palavras, m.em, m.ate);
  const ts = tempos(m.significado, palavras, m.significadoEm, m.ate);
  const grande = alta(ret);
  const larguraTermo = ret.w - 2 * PAD - 70;
  const encT = encaixar(m.termo, { largura: larguraTermo, max: grande ? 104 : 76, min: 52, linhas: 1, fonte: { peso: 700 } });
  const alturaTermo = encT.linhas.length * encT.tamanho * 1.05;
  const topoTermo = grande ? 44 : 26;
  // a nota: embaixo do termo, recuada, presa por um conector de grupo
  const recuo = 64;
  const nota = { x: PAD + recuo, y: topoTermo + alturaTermo + (grande ? 40 : 18), w: ret.w - 2 * PAD - recuo };
  const notaH = ret.h - nota.y - (grande ? 40 : 20);
  // o significado cabe na nota: até 3 linhas, com o corpo limitado pela altura dela
  const cabeNaAltura = (n: number) => Math.floor((notaH - 28) / (n * 1.1));
  const encS = (() => {
    for (const n of [1, 2, 3]) {
      const e = encaixar(m.significado, { largura: nota.w - 52, max: Math.min(grande ? 62 : 50, cabeNaAltura(n)), min: 34, linhas: n, fonte: { peso: 600 } });
      if (e.linhas.length <= n && e.tamanho >= Math.min(40, cabeNaAltura(n))) return e;
    }
    return encaixar(m.significado, { largura: nota.w - 52, max: Math.max(30, cabeNaAltura(3)), min: 30, linhas: 3, fonte: { peso: 600 } });
  })();
  const abre = prog(t, m.significadoEm - 0.05, 0.3);
  const triangulo = prog(t, fimDaDigitacao(m.termo, tt), 0.25);
  const conector = prog(t, m.significadoEm - 0.15, 0.3);
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      {/* o triângulo de "célula com nota", no canto da célula */}
      <svg width={34} height={34} style={{ position: "absolute", right: 0, top: 0 }}>
        <path d="M0 0H34V34Z" fill={cor.acento} opacity={triangulo} />
      </svg>
      <div style={{ position: "absolute", left: PAD, top: topoTermo, height: alturaTermo, display: "flex", alignItems: "center" }}>
        {t < (tt[0] ?? m.em) ? (
          <Esboco w={larguraTermo * 0.45} h={30} />
        ) : (
          <TextoFalado texto={m.termo} tempos={tt} t={t} linhas={encT.linhas} cursor style={{ fontFamily: sans, fontWeight: 700, fontSize: encT.tamanho, lineHeight: 1.05, color: cor.tinta }} />
        )}
      </div>
      {/* conector de grupo: do termo até a nota */}
      <svg width={recuo + 10} height={nota.y - topoTermo - alturaTermo + 60} style={{ position: "absolute", left: PAD + 14, top: topoTermo + alturaTermo + 4, overflow: "visible" }}>
        <Traco d={`M4 0V${nota.y - topoTermo - alturaTermo + 22}a10 10 0 0 0 10 10H${recuo - 14}`} p={conector} cor={cor.acento} largura={4} />
      </svg>
      {/* a nota (espera a lápis) */}
      <div
        style={{
          position: "absolute",
          left: nota.x,
          top: nota.y,
          width: nota.w,
          height: notaH,
          borderRadius: 18,
          boxSizing: "border-box",
          border: abre > 0 ? `3px solid ${cor.acento}` : `2.5px dashed ${cor.esboco}`,
          background: abre > 0 ? cor.celula : "transparent",
          boxShadow: abre > 0 ? `0 14px 30px rgba(21,24,29,${0.12 * abre})` : "none",
          scale: String(0.94 + 0.06 * abre),
          transformOrigin: "0 0",
          display: "flex",
          alignItems: "center",
          padding: "0 26px",
        }}
      >
        {t < (ts[0] ?? m.significadoEm) ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Esboco w={(nota.w - 52) * 0.75} h={22} />
            <Esboco w={(nota.w - 52) * 0.5} h={22} />
          </div>
        ) : (
          <TextoFalado texto={m.significado} tempos={ts} t={t} linhas={encS.linhas} cursor style={{ fontFamily: sans, fontWeight: 600, fontSize: encS.tamanho, lineHeight: 1.1, color: cor.tinta }} />
        )}
      </div>
    </CelulaBloco>
  );
};

// ---------- pergunta: digitada, com as opções numa lista suspensa ----------

export const BlocoPergunta: React.FC<Props<Pergunta>> = ({ m, ret, t, palavras, saida }) => {
  const em = m.em ?? m.de;
  const tt = temposDoTexto(m.texto, palavras, m.em !== undefined ? em - 0.3 : m.de, m.ate, em);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  // lista suspensa aberta (célula alta, se as opções couberem em fileiras de 68 px) ou etiquetas
  const LINHA_LISTA = 68;
  const sobraPergunta = ret.h - 2 * 34 - 26 - opcoes.length * LINHA_LISTA - 8;
  const grande = alta(ret) && (!opcoes.length || sobraPergunta >= 2 * 50 * 1.06);
  const selo = grande ? 92 : 76;
  const largura = ret.w - 2 * PAD - selo - 26;
  const maxPergunta = grande ? (opcoes.length ? Math.min(76, Math.floor(sobraPergunta / (3 * 1.06))) : 76) : opcoes.length ? 62 : 68;
  const enc = encaixar(m.texto, {
    largura,
    max: Math.max(44, maxPergunta),
    min: 44,
    linhas: grande ? (opcoes.length ? Math.max(1, Math.min(3, Math.floor(sobraPergunta / (44 * 1.06)))) : 3) : !opcoes.length ? 3 : opcoes.length > 2 ? 1 : 2,
    fonte: { peso: 700 },
  });
  const alturaTexto = enc.linhas.length * enc.tamanho * 1.06;
  const fim = fimDaDigitacao(m.texto, tt);
  let atual = -1;
  opcoes.forEach((o, i) => {
    if (t >= o.em) atual = i;
  });
  // opções em etiquetas (célula baixa): o maior corpo em que elas cabem em até 2 fileiras
  const larguraChip = (texto: string, tam: number) => larguraTexto(texto, tam, { peso: 600 }) + 2 * 24 + 40;
  const larguraFileira = ret.w - 2 * PAD;
  const fileiras = (tam: number) => {
    let n = 1;
    let x = 0;
    for (const o of opcoes) {
      const w = Math.min(larguraFileira, larguraChip(o.texto, tam));
      if (x > 0 && x + 14 + w > larguraFileira) {
        n++;
        x = w;
      } else x += (x > 0 ? 14 : 0) + w;
    }
    return n;
  };
  const sobra = ret.h - 2 * 24 - Math.max(selo, alturaTexto) - 16;
  const tamChip = (() => {
    for (let s = 42; s >= 34; s -= 2) {
      const n = fileiras(s);
      if (n * (s + 30) + (n - 1) * 12 <= sobra) return s;
    }
    return 34;
  })();
  const linhaLista = grande ? Math.max(LINHA_LISTA, Math.min(84, (ret.h - Math.max(selo, alturaTexto) - 2 * 34 - 26 - 8) / Math.max(1, opcoes.length))) : 0;
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      <div style={{ position: "absolute", inset: 0, padding: `${grande ? 34 : 24}px ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: opcoes.length ? "flex-start" : "center", gap: grande ? 26 : 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: selo, height: selo, borderRadius: 20, background: prog(t, em, 0.3) > 0 ? cor.acento : cor.acentoFundo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icone nome="pergunta" tamanho={selo * 0.7} cor={prog(t, em, 0.3) > 0 ? "#FFFFFF" : cor.acento} peso={4.4} p={prog(t, em, 0.5)} />
          </div>
          {t < (tt[0] ?? em) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Esboco w={largura * 0.8} h={24} />
              <Esboco w={largura * 0.5} h={24} />
            </div>
          ) : (
            <TextoFalado texto={m.texto} tempos={tt} t={t} linhas={enc.linhas} cursor={!opcoes.length || t < (opcoes[0]?.em ?? 0)} style={{ fontFamily: sans, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.06, color: cor.tinta }} />
          )}
        </div>
        {opcoes.length && grande ? (
          // lista suspensa aberta, presa à célula
          <div style={{ marginLeft: selo + 26, borderRadius: 16, border: `2px solid ${cor.gradeForte}`, background: cor.celula, boxShadow: "0 14px 30px rgba(21,24,29,0.10)", overflow: "hidden" }}>
            {opcoes.map((o, i) => {
              const to = tempos(o.texto, palavras, o.em, m.ate);
              const ativa = i === atual;
              const encO = encaixar(o.texto, { largura: ret.w - 2 * PAD - selo - 26 - 120, max: 44, min: 34, linhas: 1, fonte: { peso: 600 } });
              return (
                <div key={i} style={{ height: linhaLista, display: "flex", alignItems: "center", gap: 20, padding: "0 24px", background: ativa ? cor.acentoFundo : "transparent", borderTop: i ? `1.5px solid ${cor.grade}` : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 17, boxSizing: "border-box", border: `3px ${t >= o.em ? "solid" : "dashed"} ${t >= o.em ? cor.acento : cor.esboco}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {ativa ? <div style={{ width: 16, height: 16, borderRadius: 8, background: cor.acento }} /> : null}
                  </div>
                  {t < o.em ? (
                    <Esboco w={180 + 60 * (i % 2)} h={20} />
                  ) : (
                    <TextoFalado texto={o.texto} tempos={to} t={t} linhas={encO.linhas} style={{ fontFamily: sans, fontWeight: 600, fontSize: encO.tamanho, color: ativa ? cor.acentoEscuro : cor.tinta }} />
                  )}
                </div>
              );
            })}
          </div>
        ) : opcoes.length ? (
          // célula baixa: as opções viram etiquetas de lista suspensa, uma ao lado da outra
          <div style={{ display: "flex", columnGap: 14, rowGap: 12, flexWrap: "wrap", width: larguraFileira }}>
            {opcoes.map((o, i) => {
              const to = tempos(o.texto, palavras, o.em, m.ate);
              const ativa = i === atual;
              const visivel = t >= o.em;
              return (
                <div
                  key={i}
                  style={{
                    height: tamChip + 30,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 18px 0 24px",
                    borderRadius: (tamChip + 30) / 2,
                    boxSizing: "border-box",
                    border: visivel ? `2.5px solid ${ativa ? cor.acento : cor.gradeForte}` : `2.5px dashed ${cor.esboco}`,
                    background: ativa ? cor.acentoFundo : cor.celula,
                    fontFamily: sans,
                    fontWeight: 600,
                    fontSize: tamChip,
                    color: ativa ? cor.acentoEscuro : cor.tinta,
                    minWidth: visivel ? undefined : Math.min(larguraFileira, larguraTexto(o.texto, tamChip, { peso: 600 }) + 74),
                    maxWidth: larguraFileira,
                    whiteSpace: "nowrap",
                  }}
                >
                  {visivel ? <TextoFalado texto={o.texto} tempos={to} t={t} style={{ flexWrap: "nowrap" }} /> : null}
                  <svg width={22} height={14} viewBox="0 0 22 14" style={{ flexShrink: 0, marginLeft: "auto" }}>
                    <path d="M3 3l8 8 8-8" fill="none" stroke={visivel ? (ativa ? cor.acento : cor.tintaSuave) : cor.esboco} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              );
            })}
          </div>
        ) : grande ? (
          // sem opções: o campo de resposta espera, com o cursor piscando
          <div style={{ marginLeft: selo + 26, height: 92, borderRadius: 16, border: `2.5px dashed ${cor.gradeForte}`, display: "flex", alignItems: "center", padding: "0 26px", opacity: prog(t, fim + 0.1, 0.3) }}>
            <div style={{ width: 4, height: 50, background: cor.acento, opacity: piscando(t) }} />
          </div>
        ) : null}
      </div>
    </CelulaBloco>
  );
};

// ---------- comparação: duas linhas, a regra condicional marca o vencedor ----------

export const BlocoComparacao: React.FC<Props<Comparacao>> = ({ m, ret, t, palavras, saida }) => {
  const comTitulo = !!m.titulo && alta(ret);
  const linhas = linhasDaComparacao(ret, comTitulo);
  const modo = m.modo ?? "contra";
  // marcas: com vencedor, ✓ e ✗ no vencedorEm; errado-certo sem vencedor: ✗ no primeiro e ✓ no segundo
  const marcas: ({ valor: "sim" | "nao"; em: number } | null)[] = [null, null];
  if (m.vencedor !== undefined) {
    const em = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
    marcas[m.vencedor] = { valor: "sim", em };
    marcas[1 - m.vencedor] = { valor: "nao", em: em + 0.15 };
  } else if (modo === "errado-certo") {
    m.lados.forEach((l, i) => {
      marcas[i] = { valor: i === 0 ? "nao" : "sim", em: fimDaDigitacao(l.texto, tempos(l.texto, palavras, l.em, m.ate)) + 0.15 };
    });
  }
  const vencedorEm = m.vencedor !== undefined ? (marcas[m.vencedor]?.em ?? 1e9) : 1e9;
  const rowH = linhas[0].h;
  const tamRotulo = rowH >= 200 ? 34 : 30;
  const larguraTexto0 = ret.w - 2 * PAD - 120;
  const tt = comTitulo && m.titulo ? tempos(m.titulo, palavras, m.de, m.ate) : [];
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      {comTitulo && m.titulo ? (
        <div style={{ position: "absolute", left: PAD, top: 0, height: 84, display: "flex", alignItems: "center" }}>
          <Rotulo texto={m.titulo} tempos={tt} t={t} tamanho={32} corTexto={cor.tintaSuave} />
        </div>
      ) : null}
      {m.lados.map((l, i) => {
        const r = linhas[i];
        const y = r.y - ret.y;
        // o rótulo entra quando é dito (antes ou depois do texto); não dito, junto com o texto
        const ditoEm = quandoDito(l.rotulo, palavras, Math.max(m.de, l.em - 1.5), m.ate) ?? l.em;
        const tr = temposDoTexto(l.rotulo, palavras, ditoEm - 0.05, m.ate, ditoEm);
        const inicioRotulo = tr[0] ?? ditoEm;
        const tx = tempos(l.texto, palavras, l.em, m.ate);
        const enc = encaixar(l.texto, { largura: larguraTexto0, max: rowH >= 200 ? 76 : 58, min: 40, linhas: 2, fonte: { peso: 700 } });
        const venceu = m.vencedor === i;
        const perdeu = m.vencedor !== undefined && m.vencedor !== i;
        const pv = prog(t, vencedorEm, 0.35);
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: y, width: ret.w, height: r.h, borderTop: i === 1 ? `1.5px solid ${cor.grade}` : "none", boxSizing: "border-box" }}>
            {venceu && pv > 0 ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pv * 100}%`, background: cor.acentoFundo }} /> : null}
            <div style={{ position: "absolute", left: PAD, top: 0, bottom: 0, width: larguraTexto0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
              {t < inicioRotulo ? (
                <Esboco w={160} h={18} />
              ) : (
                <Rotulo texto={l.rotulo} tempos={tr} t={t} tamanho={tamRotulo} corTexto={venceu && pv > 0.5 ? cor.acento : cor.tintaSuave} />
              )}
              {t < (tx[0] ?? l.em) ? (
                <Esboco w={larguraTexto0 * 0.55} h={26} style={{ marginTop: 8 }} />
              ) : (
                <TextoFalado
                  texto={l.texto}
                  tempos={tx}
                  t={t}
                  linhas={enc.linhas}
                  cursor
                  style={{ fontFamily: sans, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.05, color: perdeu && pv > 0.5 ? cor.tintaSuave : venceu && pv > 0.5 ? cor.acentoEscuro : cor.tinta }}
                />
              )}
            </div>
            <div style={{ position: "absolute", right: PAD, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
              <Marca t={t} em={marcas[i]?.em} valor={marcas[i]?.valor ?? "sim"} tamanho={rowH >= 200 ? 76 : 62} />
            </div>
          </div>
        );
      })}
      {/* entre as duas linhas: × (contra) ou ↓ (antes e depois) */}
      {modo !== "errado-certo" ? (
        <div
          style={{
            position: "absolute",
            right: PAD + 6,
            top: linhas[1].y - ret.y - 26,
            width: 52,
            height: 52,
            borderRadius: 26,
            background: cor.celula,
            border: `2.5px solid ${cor.gradeForte}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: limitar(prog(t, m.lados[1].em - 0.2, 0.3)),
            boxSizing: "border-box",
          }}
        >
          <Icone nome={modo === "antes-depois" ? "baixo" : "xis"} tamanho={modo === "antes-depois" ? 30 : 26} cor={cor.tintaSuave} peso={4} />
        </div>
      ) : null}
    </CelulaBloco>
  );
};
