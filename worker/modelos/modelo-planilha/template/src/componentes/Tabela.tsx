// A tabela que se acumula: cabeçalho, uma linha por item (nome, ✓/✗ ou número, detalhe),
// a sub-linha dos exemplos e a linha de total, que soma (ou conta) sozinha.
import { digitado, fimDaDigitacao, formatar, limitar, piscando, prog, temposDoTexto, Traco } from "../anim";
import type { Arrumacao } from "../roteiro";
import type { Linha, Palavra, Plano, Preencher } from "../plano";
import { encaixar, larguraTexto } from "../medida";
import { COL, cor, LARGURA_MONO, mono, rotuloCaixaAlta, sans, TAB } from "../tema";
import { Esboco, TextoFalado } from "./Texto";
import { Icone, type NomeIcone } from "./Icones";

const Cursorzinho: React.FC<{ t: number; altura: number }> = ({ t, altura }) => (
  <div style={{ display: "inline-block", width: 3.5, height: altura, marginLeft: 3, background: cor.acento, opacity: piscando(t), verticalAlign: "middle" }} />
);

// Marca da coluna 2: ✓ framboesa, ✗ grafite ou número
export const Marca: React.FC<{ t: number; em?: number; valor?: "sim" | "nao" | number; tamanho?: number; prefixo?: string; casas?: number }> = ({
  t,
  em,
  valor = "sim",
  tamanho = 64,
  prefixo,
  casas = 0,
}) => {
  const p = em === undefined ? 0 : prog(t, em, 0.35);
  if (typeof valor === "number") {
    if (p <= 0) return <Esboco w={110} />;
    const v = valor * prog(t, em ?? 0, 0.55);
    return (
      <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 46, color: cor.tinta, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {prefixo ? `${prefixo} ` : ""}
        {formatar(v, casas)}
      </div>
    );
  }
  const sim = valor !== "nao";
  return (
    <div style={{ position: "relative", width: tamanho, height: tamanho }}>
      {/* esboço: círculo tracejado */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `3px dashed ${cor.esboco}`, opacity: 1 - p }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: sim ? cor.acento : cor.tinta,
          scale: String(0.6 + 0.4 * p),
          opacity: p,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icone nome={sim ? "check" : "xis"} tamanho={tamanho * 0.78} cor="#FFFFFF" peso={5.2} p={em === undefined ? 0 : prog(t, em + 0.08, 0.3)} />
      </div>
    </div>
  );
};

// Linha dupla de contabilidade: fecha o total
const LinhaDupla: React.FC<{ p: number; w: number }> = ({ p, w }) => (
  <svg width={w} height={14} style={{ position: "absolute", left: 0, bottom: -16, overflow: "visible" }}>
    <Traco d={`M0 2H${w}`} p={p} cor={cor.acento} largura={3.5} />
    <Traco d={`M0 11H${w}`} p={limitar(p * 1.3 - 0.3)} cor={cor.acento} largura={3.5} />
  </svg>
);

const CelulaItem: React.FC<{ m: Linha; t: number; palavras: Palavra[]; clipe?: { em: number; nome?: NomeIcone } }> = ({ m, t, palavras, clipe }) => {
  const largura = COL[1] - COL[0] - 28;
  const tempos = temposDoTexto(m.item.texto, palavras, m.item.em - 0.3, m.ate, m.item.em);
  const visivel = digitado(m.item.texto, tempos, t);
  const editando = t >= m.item.em && t < fimDaDigitacao(m.item.texto, tempos) + 0.35;
  const etiqueta = m.item.etiqueta;
  // o nome do item cabe numa linha (até 38 px) ou quebra em duas quando não há etiqueta
  const enc = encaixar(m.item.texto, { largura, max: 50, min: 38, linhas: etiqueta ? 1 : 2, fonte: { peso: 600 } });
  const tamanho = enc.tamanho;
  const temposEtiqueta = etiqueta ? temposDoTexto(etiqueta, palavras, m.item.em, m.ate, m.item.etiquetaEm ?? m.item.em + 0.5) : [];
  const inicioEtiqueta = m.item.etiquetaEm ?? temposEtiqueta[0] ?? m.item.em + 0.5;
  const pe = etiqueta ? prog(t, Math.min(inicioEtiqueta, temposEtiqueta[0] ?? inicioEtiqueta), 0.3) : 0;
  return (
    <div style={{ position: "absolute", left: 14, right: 14, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
      {t < m.item.em ? (
        <Esboco w={largura * 0.62} />
      ) : enc.linhas.length > 1 ? (
        <TextoFalado texto={m.item.texto} tempos={tempos} t={t} linhas={enc.linhas} cursor style={{ fontFamily: sans, fontWeight: 600, fontSize: tamanho, color: cor.tinta, lineHeight: 1.05 }} />
      ) : (
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: tamanho, color: cor.tinta, whiteSpace: "nowrap", lineHeight: 1.1 }}>
          {visivel}
          {editando ? <Cursorzinho t={t} altura={tamanho * 1.05} /> : null}
        </div>
      )}
      {etiqueta ? (
        <div style={{ height: pe > 0 ? 44 : 0, overflow: "visible" }}>
          {pe > 0 ? (
            <div
              style={{
                display: "inline-block",
                padding: "3px 14px 4px",
                borderRadius: 10,
                background: cor.acentoFundo,
                color: cor.acentoEscuro,
                fontFamily: sans,
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1.1,
                opacity: pe,
                translate: `0 ${(1 - pe) * 10}px`,
              }}
            >
              <TextoFalado texto={etiqueta} tempos={temposEtiqueta} t={t} style={{ flexWrap: "nowrap" }} />
            </div>
          ) : null}
        </div>
      ) : null}
      {clipe ? (
        <div style={{ position: "absolute", right: -14, top: "50%", marginTop: -20 }}>
          <Icone nome={clipe.nome ?? "clipe"} tamanho={40} cor={cor.acento} peso={3.8} p={prog(t, clipe.em, 0.3)} />
        </div>
      ) : null}
    </div>
  );
};

const CelulaDetalhe: React.FC<{ m: Linha; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const largura = COL[3] - COL[2] - 28;
  const f = m.formula;
  const enter = f ? (f.enterEm ?? fimDaDigitacao(f.texto, [f.em]) + 0.3) : 0;
  if (f && t >= f.em && t < enter) {
    // editando a fórmula: a célula mostra a fórmula (cortada), como numa planilha
    const tempos = temposDoTexto(f.texto, palavras, f.em - 0.3, m.ate, f.em);
    const visivel = digitado(f.texto, tempos, t);
    const tamanho = 40;
    const cabe = Math.floor(largura / (tamanho * LARGURA_MONO));
    return (
      <div style={{ position: "absolute", left: 14, right: 14, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: mono, fontWeight: 600, fontSize: tamanho, color: cor.acentoEscuro, whiteSpace: "pre", overflow: "hidden" }}>
        {visivel.length > cabe ? `…${visivel.slice(visivel.length - cabe + 1)}` : visivel}
        <Cursorzinho t={t} altura={44} />
      </div>
    );
  }
  const d = m.detalhe;
  if (!d) return null;
  const inicio = f ? enter : d.em;
  if (t < inicio) return <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, display: "flex", alignItems: "center" }}><Esboco w={largura * 0.66} /></div>;
  const tempos = f ? d.texto.split(/\s+/).map(() => enter) : temposDoTexto(d.texto, palavras, d.em - 0.3, m.ate, d.em);
  const visivel = f ? d.texto : digitado(d.texto, tempos, t);
  const editando = !f && t < fimDaDigitacao(d.texto, tempos) + 0.35;
  const enc = encaixar(d.texto, { largura, max: 48, min: 36, linhas: 2, fonte: { peso: 500 } });
  const tamanho = enc.tamanho;
  // resultado da fórmula: a célula pisca de leve no acento
  const flash = f ? 1 - prog(t, enter, 0.9) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(${cor.acentoRgb},${0.14 * flash})` }}>
      {enc.linhas.length > 1 ? (
        <div style={{ position: "absolute", left: 14, right: 14, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
          <TextoFalado texto={d.texto} tempos={tempos} t={t} linhas={enc.linhas} cursor={!f} style={{ fontFamily: sans, fontWeight: 500, fontSize: tamanho, color: cor.tinta, lineHeight: 1.06 }} />
        </div>
      ) : (
        <div style={{ position: "absolute", left: 14, right: 14, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: sans, fontWeight: 500, fontSize: tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>
          {visivel}
          {editando ? <Cursorzinho t={t} altura={tamanho * 1.05} /> : null}
        </div>
      )}
    </div>
  );
};

const SubLinha: React.FC<{ m: Linha; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const exemplos = (m.exemplos ?? []).slice(0, 3);
  // as etiquetas dos exemplos cabem numa fileira: o corpo desce de 40 até 32 se precisar
  const disponivel = COL[3] - COL[0] - 66 - 20 - 16 * Math.max(0, exemplos.length - 1);
  const corpo = (() => {
    for (let s = 40; s >= 32; s -= 2) if (exemplos.reduce((a, ex) => a + larguraTexto(ex.texto, s, { peso: 500 }) + 48, 0) <= disponivel) return s;
    return 32;
  })();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: TAB.sub, display: "flex", alignItems: "center", gap: 16, paddingLeft: 66, boxSizing: "border-box" }}>
      {/* conector de grupo, como linhas agrupadas */}
      <svg width={40} height={TAB.sub} style={{ position: "absolute", left: 20, top: 0 }}>
        <path d="M8 0V48a6 6 0 0 0 6 6h22" fill="none" stroke={cor.gradeForte} strokeWidth={3} strokeLinecap="round" />
      </svg>
      {exemplos.map((ex, i) => {
        const tempos = temposDoTexto(ex.texto, palavras, ex.em - 0.3, m.ate, ex.em);
        const visivel = digitado(ex.texto, tempos, t);
        const p = prog(t, ex.em, 0.25);
        const largura = Math.round(larguraTexto(ex.texto, corpo, { peso: 500 }) + 48);
        const editando = t >= ex.em && t < fimDaDigitacao(ex.texto, tempos) + 0.3;
        return (
          <div
            key={i}
            style={{
              position: "relative",
              height: 66,
              minWidth: largura,
              borderRadius: 33,
              boxSizing: "border-box",
              border: p > 0 ? `2.5px solid ${editando ? cor.acento : cor.gradeForte}` : `2.5px dashed ${cor.esboco}`,
              background: p > 0 ? cor.celula : "transparent",
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              fontFamily: sans,
              fontWeight: 500,
              fontSize: corpo,
              color: cor.tinta,
              whiteSpace: "nowrap",
            }}
          >
            {visivel}
            {editando ? <Cursorzinho t={t} altura={corpo + 2} /> : null}
          </div>
        );
      })}
    </div>
  );
};

export const Tabela: React.FC<{ plano: Plano; arr: Arrumacao; t: number; palavras: Palavra[]; visivel: number; preencher: Preencher[] }> = ({
  plano,
  arr,
  t,
  palavras,
  visivel,
  preencher,
}) => {
  if (visivel <= 0.001) return null;
  const colunas = plano.tabela?.colunas ?? ["Item", "Vale?", "Detalhe"];
  const numerica = plano.tabela?.tipo === "numero";
  // cada linha ganha a marca do preencher (ex.: clipe) quando o arrasto passa por ela
  const clipeDa = (i: number) => {
    const p = preencher.find((m) => t >= m.em + i * 0.2);
    return p ? { em: p.em + i * 0.2 + 0.05, nome: p.marca } : undefined;
  };
  // total: conta os ✓ (ou soma os números) que já entraram
  const marcas = arr.linhas.map((l) => l.m.marca).filter((x): x is NonNullable<Linha["marca"]> => !!x);
  const valorTotal = marcas.reduce((s, mk) => {
    const p = prog(t, mk.em, numerica ? 0.6 : 0.01);
    if (numerica) return s + (typeof mk.valor === "number" ? mk.valor : 0) * p;
    return s + (mk.valor === "nao" ? 0 : p >= 1 ? 1 : 0);
  }, 0);
  const ultimaMarca = Math.max(-10, ...marcas.map((mk) => mk.em));
  const recalculo = marcas.reduce((a, mk) => Math.max(a, 1 - prog(t, mk.em, 0.8)), 0) * (t >= Math.min(...marcas.map((mk) => mk.em), 1e9) ? 1 : 0);
  const fechado = prog(t, ultimaMarca + 0.6, 0.45);
  const primeiraEntrada = Math.min(...arr.linhas.map((l) => l.m.de));
  const textoTotal = numerica ? `${plano.tabela?.prefixo ? `${plano.tabela.prefixo} ` : ""}${formatar(valorTotal, plano.tabela?.casas ?? 0)}` : formatar(valorTotal);
  // o total cabe na coluna 2 numa linha só
  const totalFinal = numerica
    ? `${plano.tabela?.prefixo ? `${plano.tabela.prefixo} ` : ""}${formatar(marcas.reduce((s2, mk) => s2 + (typeof mk.valor === "number" ? mk.valor : 0), 0), plano.tabela?.casas ?? 0)}`
    : String(marcas.length);
  const tamanhoTotal = Math.min(58, Math.floor((COL[2] - COL[1] - 30) / (totalFinal.length * 0.58)));
  const larguraTotal = Math.round(textoTotal.length * tamanhoTotal * 0.56);
  const passos = arr.linhas.map((_, i) => prog(t, primeiraEntrada - 0.35 + i * 0.07, 0.4));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: visivel }}>
      {/* cabeçalho da tabela */}
      <div style={{ position: "absolute", left: arr.cabecalho.x, top: arr.cabecalho.y, width: arr.cabecalho.w, height: arr.cabecalho.h, background: "#F6F7F9", borderBottom: `2.5px solid ${cor.tinta}` }}>
        {colunas.map((c, i) => (
          <div
            key={i}
            style={{
              ...rotuloCaixaAlta,
              position: "absolute",
              left: COL[i] - COL[0] + 14,
              top: 0,
              height: arr.cabecalho.h,
              display: "flex",
              alignItems: "center",
              color: cor.tintaSuave,
              opacity: prog(t, primeiraEntrada - 0.4 + i * 0.08, 0.3),
            }}
          >
            {c}
          </div>
        ))}
      </div>
      {arr.linhas.map((l, i) => {
        const clipe = clipeDa(i);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: l.ret.x, top: l.ret.y, width: l.ret.w, height: l.ret.h, opacity: passos[i] }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: COL[1] - COL[0], height: l.ret.h }}>
                <CelulaItem m={l.m} t={t} palavras={palavras} clipe={clipe} />
              </div>
              <div style={{ position: "absolute", left: COL[1] - COL[0], top: 0, width: COL[2] - COL[1], height: l.ret.h, display: "flex", alignItems: "center", justifyContent: numerica ? "flex-end" : "center", paddingRight: numerica ? 18 : 0, boxSizing: "border-box" }}>
                {l.m.marca || !numerica ? <Marca t={t} em={l.m.marca?.em} valor={l.m.marca?.valor} prefixo={plano.tabela?.prefixo} casas={plano.tabela?.casas} /> : null}
              </div>
              <div style={{ position: "absolute", left: COL[2] - COL[0], top: 0, width: COL[3] - COL[2], height: l.ret.h, overflow: "hidden" }}>
                <CelulaDetalhe m={l.m} t={t} palavras={palavras} />
              </div>
            </div>
            {l.sub.h > 0.5 ? (
              <div style={{ position: "absolute", left: l.sub.x, top: l.sub.y, width: l.sub.w, height: l.sub.h, overflow: "hidden" }}>
                <SubLinha m={l.m} t={t} palavras={palavras} />
              </div>
            ) : null}
          </div>
        );
      })}
      {arr.total ? (
        <div style={{ position: "absolute", left: arr.total.x, top: arr.total.y, width: arr.total.w, height: arr.total.h, background: "#F6F7F9", borderTop: `2.5px solid ${cor.tinta}` }}>
          <div style={{ ...rotuloCaixaAlta, fontWeight: 700, fontSize: 40, color: cor.tinta, position: "absolute", left: 14, top: 0, height: arr.total.h, display: "flex", alignItems: "center" }}>
            {plano.tabela?.total || "Total"}
          </div>
          <div style={{ position: "absolute", left: COL[1] - COL[0], top: 0, width: COL[2] - COL[1], height: arr.total.h, background: `rgba(${cor.acentoRgb},${0.16 * recalculo})` }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: numerica ? "flex-end" : "center", paddingRight: numerica ? 18 : 0 }}>
              <div style={{ position: "relative", fontFamily: sans, fontWeight: 700, fontSize: tamanhoTotal, color: valorTotal > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", lineHeight: 1, whiteSpace: "nowrap" }}>
                {textoTotal}
                <LinhaDupla p={fechado} w={larguraTotal} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
