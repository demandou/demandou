// A moldura da planilha: barra de título, ferramentas, barra de fórmula, cabeçalhos de linha e coluna,
// as linhas da grade e as abas embaixo. Fictícia e sem marca: nada de logotipo de programa.
import { fimDaDigitacao, digitado, limitar, mistura, piscando, prog, troca } from "../anim";
import type { Arrumacao, Escrita, EstadoAbas } from "../roteiro";
import type { Ret } from "../grade";
import {
  ABAS,
  STATUS,
  BARRA_TITULO,
  COL,
  COLUNAS_H,
  COLUNAS_Y,
  cor,
  FERRAMENTAS,
  FORMULA,
  GRADE_Y,
  LARGURA_MONO,
  LARGURA_SANS,
  LETRAS,
  LINHA,
  mono,
  NUMEROS_W,
  sans,
  W,
  H,
} from "../tema";
import { larguraTexto } from "../medida";
import { Icone } from "./Icones";

// ---------- barra de título e ferramentas (decoração: ficam embaixo das abas do app) ----------

export const BarraDeTitulo: React.FC<{ arquivo: string; salvoEm?: number; t: number }> = ({ arquivo, salvoEm, t }) => {
  const salvando = salvoEm !== undefined && t >= salvoEm - 0.35 && t < salvoEm;
  const salvo = salvoEm !== undefined && t >= salvoEm;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: BARRA_TITULO.y,
        width: W,
        height: BARRA_TITULO.h,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 34px",
        boxSizing: "border-box",
        fontFamily: sans,
      }}
    >
      {/* ícone do arquivo: uma grade genérica */}
      <div style={{ width: 50, height: 50, borderRadius: 12, background: cor.acento, position: "relative", overflow: "hidden" }}>
        {[1, 2].map((i) => (
          <div key={`h${i}`} style={{ position: "absolute", left: 10, right: 10, top: 10 + i * 10, height: 2.5, background: "rgba(255,255,255,0.9)" }} />
        ))}
        <div style={{ position: "absolute", left: 10, right: 10, top: 10, bottom: 10, border: "2.5px solid rgba(255,255,255,0.9)", borderRadius: 3 }} />
        <div style={{ position: "absolute", top: 10, bottom: 10, left: 22, width: 2.5, background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 34, color: cor.tinta, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{arquivo}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 32, fontWeight: 500, color: salvo ? cor.acento : cor.tintaSuave }}>
        <Icone nome="nuvem" tamanho={40} cor={salvo ? cor.acento : cor.tintaSuave} peso={3.4} />
        {salvando ? "Salvando…" : "Salvo"}
      </div>
    </div>
  );
};

const Separador = () => <div style={{ width: 2, height: 40, background: cor.grade, margin: "0 6px" }} />;
const Glifo: React.FC<{ children: React.ReactNode; estilo?: React.CSSProperties; ativo?: number }> = ({ children, estilo, ativo = 0 }) => (
  <div
    style={{
      minWidth: 52,
      height: 52,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: sans,
      fontSize: 32,
      fontWeight: 600,
      color: ativo > 0.01 ? cor.acento : cor.tintaSuave,
      background: `rgba(${cor.acentoRgb},${0.1 * ativo})`,
      ...estilo,
    }}
  >
    {children}
  </div>
);

export const Ferramentas: React.FC<{ somaAtiva: number; realce?: { moeda?: number; pct?: number; grafico?: number } }> = ({ somaAtiva, realce = {} }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: FERRAMENTAS.y,
      width: W,
      height: FERRAMENTAS.h,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 30px",
      boxSizing: "border-box",
      borderBottom: `1.5px solid ${cor.grade}`,
    }}
  >
    <Icone nome="desfazer" tamanho={40} cor={cor.tintaSuave} peso={3.4} />
    <Icone nome="refazer" tamanho={40} cor={cor.tintaSuave} peso={3.4} />
    <Separador />
    <Glifo estilo={{ fontWeight: 700 }}>B</Glifo>
    <Glifo estilo={{ fontStyle: "italic", fontFamily: "Georgia, serif" }}>I</Glifo>
    <Separador />
    <Glifo ativo={realce.moeda ?? 0}>R$</Glifo>
    <Glifo ativo={realce.pct ?? 0}>%</Glifo>
    <Glifo estilo={{ fontFamily: mono, fontSize: 30 }}>,00</Glifo>
    <Separador />
    <Glifo ativo={somaAtiva}>Σ</Glifo>
    <Icone nome="filtro" tamanho={40} cor={cor.tintaSuave} peso={3.4} />
    <Glifo ativo={realce.grafico ?? 0}>
      <Icone nome="grafico" tamanho={40} cor={(realce.grafico ?? 0) > 0.01 ? cor.acento : cor.tintaSuave} peso={3.4} />
    </Glifo>
  </div>
);

// ---------- barra de fórmula ----------

// Partes de uma fórmula: nomes (intervalos nomeados) em framboesa, como a cor de referência.
const pedacosDaFormula = (texto: string) =>
  texto.split(/(\s+)/).map((p, i) => ({ p, ref: /[A-Za-zÀ-ú_]{3,}/.test(p) && !/^=?[A-Z]+\.?[A-Z]*\(/.test(p), i }));

// Quantas linhas um texto ocupa numa largura (quebra por palavra), com `fator` de largura por caractere.
const linhasDoTexto = (texto: string, largura: number, tamanho: number, fator: number) => {
  let n = 1;
  let x = 0;
  const mono = fator === LARGURA_MONO;
  for (const w of texto.split(/\s+/).filter(Boolean)) {
    const lw = mono ? w.length * tamanho * fator : larguraTexto(w, tamanho, { peso: 500 });
    const espaco = tamanho * (mono ? fator : 0.3);
    if (x > 0 && x + espaco + lw > largura) {
      n++;
      x = lw;
    } else x += (x > 0 ? espaco : 0) + lw;
  }
  return n;
};

// Texto longo não rola: o corpo é escolhido pelo texto COMPLETO (uma linha de 46 px, ou duas de 40 px,
// ou de 38 px) e as palavras quebram para a segunda linha enquanto são digitadas. O começo fica sempre visível.
export const BarraDeFormula: React.FC<{ t: number; nome: string; escrita: Escrita | null }> = ({ t, nome, escrita }) => {
  const formula = !!escrita?.formula;
  const completo = escrita?.texto ?? "";
  const visivel = escrita ? digitado(escrita.texto, escrita.tempos, t) : "";
  const fim = escrita ? fimDaDigitacao(escrita.texto, escrita.tempos) : 0;
  const editando = !!escrita && t < fim + 0.5;
  const fator = formula ? LARGURA_MONO : LARGURA_SANS + 0.03;
  const disponivel = W - FORMULA.textoX - 30;
  const tamanho = linhasDoTexto(completo, disponivel, 46, fator) <= 1 ? 46 : linhasDoTexto(completo, disponivel, 40, fator) <= 2 ? 40 : 38;
  const alturaLinha = Math.round(tamanho * 1.14);
  // passou de duas linhas mesmo a 38 px: mostra as duas últimas
  const sobe = Math.max(0, linhasDoTexto(visivel, disponivel, tamanho, fator) - 2) * alturaLinha;
  return (
    <div style={{ position: "absolute", left: 0, top: FORMULA.y, width: W, height: FORMULA.h, background: cor.celula, borderBottom: `1.5px solid ${cor.gradeForte}` }}>
      {/* caixa de nome: o endereço da célula ativa */}
      <div
        style={{
          position: "absolute",
          left: FORMULA.nomeX,
          top: 22,
          width: FORMULA.nomeW,
          height: FORMULA.h - 44,
          borderRadius: 12,
          border: `2px solid ${cor.grade}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontWeight: 600,
          fontSize: nome.length > 6 ? 30 : 38,
          color: cor.tinta,
          whiteSpace: "nowrap",
        }}
      >
        {nome}
      </div>
      <div style={{ position: "absolute", left: FORMULA.nomeX + FORMULA.nomeW + 16, top: 32, width: 2, height: FORMULA.h - 64, background: cor.grade }} />
      <div
        style={{
          position: "absolute",
          left: FORMULA.nomeX + FORMULA.nomeW + 28,
          top: 0,
          height: FORMULA.h,
          display: "flex",
          alignItems: "center",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: 40,
          color: editando ? cor.acento : cor.tintaSuave,
        }}
      >
        fx
      </div>
      <div style={{ position: "absolute", left: FORMULA.textoX, top: 6, width: disponivel, height: FORMULA.h - 12, overflow: "hidden", display: "flex", alignItems: sobe > 0 ? "flex-end" : "center" }}>
        <div
          style={{
            width: disponivel,
            whiteSpace: "pre-wrap",
            wordBreak: "normal",
            fontFamily: formula ? mono : sans,
            fontWeight: formula ? 600 : 500,
            fontSize: tamanho,
            lineHeight: `${alturaLinha}px`,
            color: cor.tinta,
          }}
        >
          {formula
            ? pedacosDaFormula(visivel).map(({ p, ref, i }) => (
                <span key={i} style={{ color: ref ? cor.acento : cor.tinta }}>
                  {p}
                </span>
              ))
            : visivel}
          {editando ? <span style={{ display: "inline-block", width: 3.5, height: tamanho * 1.1, marginLeft: 3, background: cor.acento, opacity: piscando(t), verticalAlign: "middle" }} /> : null}
        </div>
      </div>
    </div>
  );
};

// ---------- cabeçalhos de linha e coluna ----------

export type LinhaNumerada = { y: number; h: number; numero: number };

export const Cabecalhos: React.FC<{ linhas: LinhaNumerada[]; ativo: Ret | null; forca: number }> = ({ linhas, ativo, forca }) => {
  const colAtiva = (c: number) => (ativo ? limitar((Math.min(ativo.x + ativo.w, COL[c + 1]) - Math.max(ativo.x, COL[c])) / 40) : 0) * forca;
  const linhaAtiva = (y: number, h: number) => (ativo ? limitar((Math.min(ativo.y + ativo.h, y + h) - Math.max(ativo.y, y)) / 30) : 0) * forca;
  const larguras = [...COL, W];
  return (
    <>
      {/* colunas */}
      <div style={{ position: "absolute", left: 0, top: COLUNAS_Y, width: W, height: COLUNAS_H, background: cor.cabecalho, borderBottom: `1.5px solid ${cor.gradeForte}`, overflow: "hidden" }}>
        {/* canto: selecionar tudo */}
        <div style={{ position: "absolute", left: 0, top: 0, width: NUMEROS_W, height: COLUNAS_H, borderRight: `1.5px solid ${cor.gradeForte}` }}>
          <div style={{ position: "absolute", right: 8, bottom: 8, width: 0, height: 0, borderLeft: "18px solid transparent", borderBottom: `18px solid ${cor.esboco}` }} />
        </div>
        {LETRAS.slice(0, 4).map((l, c) => {
          const a = colAtiva(c);
          return (
            <div
              key={l}
              style={{
                position: "absolute",
                left: larguras[c],
                top: 0,
                width: larguras[c + 1] - larguras[c],
                height: COLUNAS_H,
                borderRight: `1.5px solid ${cor.grade}`,
                background: `rgba(${cor.acentoRgb},${0.12 * a})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 32,
                color: a > 0.5 ? cor.acento : cor.cabecalhoTexto,
              }}
            >
              {l}
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: cor.acento, opacity: a }} />
            </div>
          );
        })}
      </div>
      {/* linhas */}
      <div style={{ position: "absolute", left: 0, top: GRADE_Y, width: NUMEROS_W, height: H - GRADE_Y, background: cor.cabecalho, borderRight: `1.5px solid ${cor.gradeForte}`, overflow: "hidden" }}>
        {linhas.map((l) => {
          const a = linhaAtiva(l.y, l.h);
          return (
            <div
              key={`${l.numero}-${l.y.toFixed(0)}`}
              style={{
                position: "absolute",
                left: 0,
                top: l.y - GRADE_Y,
                width: NUMEROS_W,
                height: l.h,
                borderBottom: `1.5px solid ${cor.grade}`,
                background: `rgba(${cor.acentoRgb},${0.12 * a})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 30,
                color: a > 0.5 ? cor.acento : cor.cabecalhoTexto,
                fontVariantNumeric: "tabular-nums",
                overflow: "hidden",
              }}
            >
              {l.h > 26 ? l.numero : null}
              <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 4, background: cor.acento, opacity: a }} />
            </div>
          );
        })}
      </div>
    </>
  );
};

// Linhas numeradas da planilha neste instante: faixa de cima (1–5), a tabela e as de baixo.
export const linhasNumeradas = (arr: Arrumacao): LinhaNumerada[] => {
  const lista: LinhaNumerada[] = [];
  for (let i = 0; i < 5; i++) lista.push({ y: GRADE_Y + i * LINHA, h: LINHA, numero: i + 1 });
  lista.push({ y: arr.cabecalho.y, h: arr.cabecalho.h, numero: 6 });
  let n = 7;
  for (const l of arr.linhas) {
    lista.push({ y: l.ret.y, h: l.ret.h, numero: n++ });
    if (l.sub.h > 0.5) {
      lista.push({ y: l.sub.y, h: l.sub.h, numero: n });
      if (l.sub.h > 48) n++;
    }
  }
  let y = arr.fundo;
  if (arr.total) lista.push({ y: arr.total.y, h: arr.total.h, numero: n++ });
  while (y < H) {
    lista.push({ y, h: LINHA, numero: n++ });
    y += LINHA;
  }
  return lista;
};

// ---------- as linhas da grade ----------

export const LinhasDaGrade: React.FC<{ linhas: LinhaNumerada[]; subs: Ret[] }> = ({ linhas, subs }) => (
  <div style={{ position: "absolute", left: NUMEROS_W, top: GRADE_Y, width: W - NUMEROS_W, height: H - GRADE_Y, background: cor.celula, overflow: "hidden" }}>
    {linhas.map((l) => (
      <div key={`h-${l.numero}-${l.y.toFixed(0)}`} style={{ position: "absolute", left: 0, right: 0, top: l.y + l.h - GRADE_Y - 0.75, height: 1.5, background: cor.grade }} />
    ))}
    {COL.slice(1).map((x) => (
      <div key={`v-${x}`} style={{ position: "absolute", top: 0, bottom: 0, left: x - NUMEROS_W - 0.75, width: 1.5, background: cor.grade }} />
    ))}
    {/* sub-linhas mescladas (A–C): sem divisões verticais dentro */}
    {subs.map((s, i) =>
      s.h > 1 ? <div key={`s-${i}`} style={{ position: "absolute", left: s.x - NUMEROS_W + 1, top: s.y - GRADE_Y + 0.75, width: s.w - 2, height: Math.max(0, s.h - 1.5), background: "#FAFBFC" }} /> : null,
    )}
  </div>
);

// ---------- barra de status (embaixo das abas; fica atrás da interface do app) ----------

export const BarraDeStatus: React.FC<{ texto: string; ativo: number }> = ({ texto, ativo }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: STATUS.y,
      width: W,
      height: H - STATUS.y,
      background: cor.app,
      borderTop: `1.5px solid ${cor.grade}`,
      fontFamily: sans,
      fontSize: 30,
      fontWeight: 500,
      color: cor.tintaSuave,
    }}
  >
    <div style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: 6, background: cor.acento }} />
        Pronto
      </div>
      <div style={{ fontVariantNumeric: "tabular-nums", color: ativo > 0.05 ? cor.acento : cor.tintaSuave }}>{texto}</div>
    </div>
  </div>
);

// ---------- abas da planilha ----------

const larguraDaAba = (nome: string) => Math.round(larguraTexto(nome, 34, { peso: 600 }) + 60);

export const Abas: React.FC<{ t: number; estado: EstadoAbas }> = ({ t, estado }) => {
  const { nomes, ativa, anterior, trocouEm, novaEm } = estado;
  const cresce = prog(t, novaEm, 0.4, troca);
  const xs: number[] = [];
  let x = 112;
  nomes.forEach((n, i) => {
    xs.push(x);
    const nova = i === nomes.length - 1 && novaEm > -5;
    x += (larguraDaAba(n) + 10) * (nova ? cresce : 1);
  });
  const p = prog(t, trocouEm, 0.35, troca);
  const ia = xs[anterior] ?? xs[ativa];
  const indX = mistura(ia, xs[ativa], p);
  const indW = mistura(larguraDaAba(nomes[anterior] ?? nomes[ativa]), larguraDaAba(nomes[ativa]), p);
  const aperta = novaEm > -5 && t >= novaEm - 0.25 && t < novaEm + 0.1 ? 0.88 : 1;
  return (
    <div style={{ position: "absolute", left: 0, top: ABAS.y, width: W, height: ABAS.h, background: cor.app, borderTop: `1.5px solid ${cor.gradeForte}`, boxShadow: "0 -8px 22px rgba(21,24,29,0.06)", fontFamily: sans }}>
      {/* botão + */}
      <div
        style={{
          position: "absolute",
          left: 28,
          top: (ABAS.h - 56) / 2,
          width: 56,
          height: 56,
          borderRadius: 14,
          border: `2px solid ${cor.grade}`,
          background: cor.celula,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(aperta),
        }}
      >
        <Icone nome="mais" tamanho={34} cor={novaEm > -5 && t >= novaEm - 0.3 && t < novaEm + 0.4 ? cor.acento : cor.tintaSuave} peso={4} />
      </div>
      {/* fundo branco da aba ativa (desliza de uma aba para outra) */}
      <div
        style={{
          position: "absolute",
          left: indX,
          top: 0,
          width: indW,
          height: ABAS.h - 12,
          background: cor.celula,
          borderLeft: `1.5px solid ${cor.grade}`,
          borderRight: `1.5px solid ${cor.grade}`,
          borderBottom: `1.5px solid ${cor.grade}`,
          borderRadius: "0 0 14px 14px",
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 6, background: cor.acento }} />
      </div>
      {nomes.map((n, i) => {
        const nova = i === nomes.length - 1 && novaEm > -5;
        const w = larguraDaAba(n) * (nova ? cresce : 1);
        const ativaAgora = i === ativa && p > 0.5;
        const eraAtiva = i === anterior && p <= 0.5;
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: xs[i],
              top: 0,
              width: w,
              height: ABAS.h - 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              whiteSpace: "nowrap",
              fontSize: 34,
              fontWeight: ativaAgora || eraAtiva ? 600 : 500,
              color: ativaAgora || eraAtiva ? cor.tinta : cor.tintaSuave,
              opacity: nova ? limitar(cresce * 1.4 - 0.2) : 1,
            }}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
};
