// Blocos da faixa: a pessoa sobe para a faixa de cima, a célula ao lado dela mostra o item da vez
// (ou o progresso, ou os dados) e a área de baixo vira tabela ou gráfico, preenchidos no ritmo da fala.
// Mesmas peças da assinatura: cabeçalho em caixa alta com fio grafite, ✓/✗ em círculo, total com
// traço duplo, esboço "a lápis" até a palavra, alça de preencher na série 1, 2, 3.
import { fimDaDigitacao, formatar, limitar, mistura, prog, temposDoTexto, Traco } from "../anim";
import { type BlocoDeTabela, formatoDoGrafico, type GeoTabela, geoDados, type LinhaNorm } from "../blocos";
import type { Ret } from "../grade";
import { encaixar, larguraTexto, umaLinha } from "../medida";
import type { Grafico, Palavra, Plano } from "../plano";
import { comFormato, opacidadeDeSaida, opacidadeDoConteudo, type Saida, totalDaTabela } from "../roteiro";
import { COL, cor, mono, rotuloCaixaAlta, sans } from "../tema";
import { CelulaBloco } from "./Blocos";
import { Icone } from "./Icones";
import { Marca } from "./Tabela";
import { Esboco, Ilustrativo, Rotulo, TextoFalado } from "./Texto";

const tempos = (texto: string, palavras: Palavra[], em: number, ate: number) => temposDoTexto(texto, palavras, em - 0.3, ate, em);

// ---------- a tabela de baixo (topicos, passos, tabela) ----------

export const TabelaBloco: React.FC<{ plano: Plano; m: BlocoDeTabela; geo: GeoTabela; t: number; palavras: Palavra[]; saida?: Saida }> = ({ plano, m, geo, t, palavras, saida }) => {
  const aparece = t >= m.de - 0.001 ? 1 : 0;
  const sai = opacidadeDeSaida(t, saida);
  const o = Math.min(aparece, sai);
  if (o <= 0.001) return null;
  const x0 = COL[0];
  const y0 = geo.cabecalho?.ret.y ?? geo.linhas[0]?.ret.y ?? 0;
  const local = (r: Ret): React.CSSProperties => ({ position: "absolute", left: r.x - x0, top: r.y - y0, width: r.w, height: r.h });
  const rowH = geo.linhas[0]?.ret.h ?? 120;
  const itemMax = rowH >= 140 ? 56 : rowH >= 110 ? 50 : 46;
  const numerica = m.tipo === "tabela" && geo.linhas.some((l) => typeof l.dados.marca === "number");
  const tot = totalDaTabela(plano, m);
  const altura = geo.fundo - y0;
  return (
    <div style={{ position: "absolute", left: x0, top: y0, width: COL[3] - x0, height: altura, background: cor.celula, opacity: o, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: opacidadeDoConteudo(t, saida) }}>
      {/* cabeçalho */}
      {geo.cabecalho ? (
        <div style={{ ...local(geo.cabecalho.ret), background: "#F6F7F9", borderBottom: `2.5px solid ${cor.tinta}`, boxSizing: "border-box" }}>
          {geo.cabecalho.colunas.map((c, i) => {
            const falado = m.tipo !== "tabela" && i === geo.cabecalho!.colunas.length - 1;
            const tt = falado ? temposDoTexto(c.texto, palavras, m.de - 0.3, m.ate, m.de + 0.1) : [];
            return (
              <div key={i} style={{ position: "absolute", left: c.ret.x - x0 + 18, top: 0, height: geo.cabecalho!.ret.h, display: "flex", alignItems: "center", opacity: falado ? 1 : prog(t, m.de + i * 0.08, 0.3) }}>
                {falado ? (
                  t < (tt[0] ?? m.de) ? (
                    <Esboco w={200} h={16} />
                  ) : (
                    <TextoFalado texto={c.texto} tempos={tt} t={t} style={{ ...rotuloCaixaAlta, fontSize: umaLinha(c.texto, c.ret.w - 36, 32, 26, { peso: 600, caixaAlta: true, espacamento: 0.04 }), color: cor.tinta, flexWrap: "nowrap" }} />
                  )
                ) : (
                  <div style={{ ...rotuloCaixaAlta, fontSize: umaLinha(c.texto, c.ret.w - 36, 32, 24, { peso: 600, caixaAlta: true, espacamento: 0.04 }), color: cor.tintaSuave, whiteSpace: "nowrap" }}>{c.texto}</div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
      {/* linhas */}
      {geo.linhas.map((l, i) => {
        const d = l.dados;
        const ti = tempos(d.texto, palavras, d.em, m.ate);
        const largItem = l.item.w - (m.tipo === "passos" ? 40 : 36) - (l.marca && m.tipo === "topicos" ? l.marca.w : 0);
        const linhasItem = m.tipo === "passos" && d.detalhe ? 1 : rowH >= 120 ? 2 : 1;
        const enc = encaixar(d.texto, { largura: largItem, max: itemMax, min: 38, linhas: linhasItem, fonte: { peso: 600 } });
        const td = d.detalhe && d.detalheEm !== undefined ? tempos(d.detalhe, palavras, d.detalheEm, m.ate) : [];
        const largDetalhe = m.tipo === "passos" ? largItem : (l.detalhe?.w ?? 0) - 36 - (l.marca && m.tipo === "topicos" ? l.marca.w : 0);
        const encD = d.detalhe ? encaixar(d.detalhe, { largura: largDetalhe, max: m.tipo === "passos" ? 40 : 46, min: 34, linhas: m.tipo === "passos" ? 1 : rowH >= 120 ? 2 : 1, fonte: { peso: 500 } }) : null;
        const dito = t >= (ti[0] ?? d.em);
        return (
          <div key={i}>
            {/* fios da grade desta linha */}
            <div style={{ ...local(l.ret), borderBottom: `1.5px solid ${cor.grade}`, boxSizing: "border-box" }} />
            {m.tipo === "tabela" || (m.tipo === "topicos" && l.detalhe) ? (
              <>
                <div style={{ position: "absolute", left: COL[m.tipo === "tabela" ? 1 : 2] - x0 - 0.75, top: l.ret.y - y0, width: 1.5, height: l.ret.h, background: cor.grade }} />
                {m.tipo === "tabela" ? <div style={{ position: "absolute", left: COL[2] - x0 - 0.75, top: l.ret.y - y0, width: 1.5, height: l.ret.h, background: cor.grade }} /> : null}
              </>
            ) : null}
            {m.tipo === "passos" ? <div style={{ position: "absolute", left: COL[1] - x0 - 0.75, top: l.ret.y - y0, width: 1.5, height: l.ret.h, background: cor.grade }} /> : null}
            {/* número do passo (a série que a alça de preencher arrasta) */}
            {l.passo ? (
              <div style={{ ...local(l.passo), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: sans, fontWeight: 700, fontSize: Math.min(72, rowH * 0.5), color: dito ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", scale: String(0.85 + 0.15 * prog(t, d.em, 0.25)) }}>{i + 1}</div>
              </div>
            ) : null}
            {/* o item (e o detalhe embaixo dele, nos passos) */}
            <div style={{ ...local(l.item), display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, paddingLeft: m.tipo === "passos" ? 24 : 20, boxSizing: "border-box" }}>
              {!dito ? (
                <Esboco w={largItem * (0.45 + 0.15 * (i % 2))} h={20} />
              ) : (
                <TextoFalado texto={d.texto} tempos={ti} t={t} linhas={enc.linhas} cursor style={{ fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.08, color: cor.tinta }} />
              )}
              {m.tipo === "passos" && d.detalhe && encD && t >= (td[0] ?? 1e9) ? (
                <TextoFalado texto={d.detalhe} tempos={td} t={t} linhas={encD.linhas} style={{ fontFamily: sans, fontWeight: 500, fontSize: encD.tamanho, color: cor.tintaSuave }} />
              ) : null}
            </div>
            {/* a marca */}
            {l.marca && (m.tipo === "tabela" || d.marca !== undefined) ? (
              <div style={{ ...local(l.marca), display: "flex", alignItems: "center", justifyContent: numerica ? "flex-end" : "center", paddingRight: numerica ? 18 : 0, boxSizing: "border-box" }}>
                {d.marca !== undefined ? <Marca t={t} em={d.marcaEm} valor={d.marca} tamanho={Math.min(64, rowH * 0.56)} prefixo={m.tipo === "tabela" ? m.prefixo : undefined} casas={m.tipo === "tabela" ? m.casas : undefined} /> : null}
              </div>
            ) : null}
            {/* o detalhe na coluna C */}
            {l.detalhe && m.tipo !== "passos" ? (
              <div style={{ ...local(l.detalhe), display: "flex", alignItems: "center", paddingLeft: 18, boxSizing: "border-box" }}>
                {d.detalhe && encD && t >= (td[0] ?? 1e9) ? (
                  <TextoFalado texto={d.detalhe} tempos={td} t={t} linhas={encD.linhas} cursor style={{ fontFamily: sans, fontWeight: 500, fontSize: encD.tamanho, lineHeight: 1.1, color: cor.tinta }} />
                ) : d.detalhe ? (
                  <Esboco w={largDetalhe * 0.6} h={18} />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {/* passos: o traço que liga um número ao seguinte, na palavra do seguinte */}
      {m.tipo === "passos" && geo.linhas.length > 1 ? (
        <svg width={COL[1] - COL[0]} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {geo.linhas.slice(1).map((l, i) => {
            const a = geo.linhas[i];
            const cx = (COL[1] - COL[0]) / 2;
            const tamNum = Math.min(72, rowH * 0.5);
            const y1 = a.ret.y - y0 + a.ret.h / 2 + tamNum * 0.55;
            const y2 = l.ret.y - y0 + l.ret.h / 2 - tamNum * 0.55;
            return (
              <g key={i}>
                <path d={`M${cx} ${y1}V${y2}`} stroke={cor.esbocoClaro} strokeWidth={5} strokeLinecap="round" />
                <Traco d={`M${cx} ${y1}V${y2}`} p={prog(t, l.dados.em - 0.25, 0.3)} cor={cor.acento} largura={5} />
              </g>
            );
          })}
        </svg>
      ) : null}
      {/* total */}
      {geo.total && tot ? <TotalDoBloco geo={geo} t={t} m={m} x0={x0} y0={y0} em={tot.em} /> : null}
      </div>
    </div>
  );
};

const TotalDoBloco: React.FC<{ geo: GeoTabela; t: number; m: BlocoDeTabela; x0: number; y0: number; em: number }> = ({ geo, t, m, x0, y0, em }) => {
  const total = geo.total!;
  const ls = geo.linhas.map((l) => l.dados).filter((d): d is LinhaNorm & { marcaEm: number } => d.marca !== undefined && d.marcaEm !== undefined);
  const numerica = ls.some((d) => typeof d.marca === "number");
  const conta = m.tipo === "tabela" ? (m.conta ?? "sim") : "sim";
  const valor = ls.reduce((s, d) => {
    if (numerica) return s + (typeof d.marca === "number" ? d.marca : 0) * prog(t, d.marcaEm, 0.6);
    return s + (t >= d.marcaEm + 0.3 && d.marca === conta ? 1 : 0);
  }, 0);
  const final = numerica ? ls.reduce((s, d) => s + (typeof d.marca === "number" ? d.marca : 0), 0) : ls.filter((d) => d.marca === conta).length;
  const prefixo = m.tipo === "tabela" ? m.prefixo : undefined;
  const casas = m.tipo === "tabela" ? (m.casas ?? 0) : 0;
  const texto = `${prefixo ? `${prefixo} ` : ""}${formatar(valor, numerica ? casas : 0)}`;
  const textoFinal = `${prefixo ? `${prefixo} ` : ""}${formatar(final, numerica ? casas : 0)}`;
  const tamanho = umaLinha(textoFinal, total.valor.w - 36, 58, 36, { peso: 700 });
  const recalculo = ls.reduce((a, d) => Math.max(a, t >= d.marcaEm ? 1 - prog(t, d.marcaEm, 0.8) : 0), 0);
  const fecha = prog(t, em + 0.5, 0.45);
  const largura = larguraTexto(textoFinal, tamanho, { peso: 700 });
  return (
    <div style={{ position: "absolute", left: 0, top: total.ret.y - y0, width: total.ret.w, height: total.ret.h, background: "#F6F7F9", borderTop: `2.5px solid ${cor.tinta}`, boxSizing: "border-box" }}>
      <div style={{ ...rotuloCaixaAlta, fontWeight: 700, fontSize: umaLinha(total.rotulo, total.valor.x - x0 - 30, 40, 30, { peso: 700, caixaAlta: true, espacamento: 0.04 }), color: cor.tinta, position: "absolute", left: 18, top: 0, height: total.ret.h, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
        {total.rotulo}
      </div>
      <div style={{ position: "absolute", left: total.valor.x - x0, top: 0, width: total.valor.w, height: total.ret.h, background: `rgba(${cor.acentoRgb},${0.16 * recalculo})` }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: numerica ? "flex-end" : "center", paddingRight: numerica ? 18 : 0 }}>
          <div style={{ position: "relative", fontFamily: sans, fontWeight: 700, fontSize: tamanho, color: valor > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", lineHeight: 1, whiteSpace: "nowrap" }}>
            {texto}
            <svg width={largura} height={14} style={{ position: "absolute", left: numerica ? undefined : 0, right: numerica ? 0 : undefined, bottom: -16, overflow: "visible" }}>
              <Traco d={`M0 2H${largura}`} p={fecha} cor={cor.acento} largura={3.5} />
              <Traco d={`M0 11H${largura}`} p={limitar(fecha * 1.3 - 0.3)} cor={cor.acento} largura={3.5} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- a célula ao lado da pessoa: o item da vez ou o progresso ----------

export const LadoDaVez: React.FC<{
  ret: Ret;
  t: number;
  de: number;
  ate: number;
  palavras: Palavra[];
  rotulo?: string;
  rotuloEm?: number;
  itens: LinhaNorm[];
  // índice do primeiro item na tabela (linhas soltas mostram "2/3" na tabela inteira)
  base?: number;
  total?: number;
  modo: "lista" | "passos";
  saida?: Saida;
  prefixo?: string;
  casas?: number;
}> = ({ ret, t, de, ate, palavras, rotulo, rotuloEm, itens, base = 0, total, modo, saida, prefixo, casas }) => {
  const pad = ret.w >= 400 ? 30 : 24;
  const largura = ret.w - 2 * pad;
  const n = total ?? itens.length;
  let k = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.02) k = i;
  });
  const atual = k >= 0 ? itens[k] : null;
  const tr = rotulo ? temposDoTexto(rotulo, palavras, (rotuloEm ?? de) - 0.3, ate, rotuloEm ?? de + 0.1) : [];
  const encRotulo = rotulo ? encaixar(rotulo, { largura, max: 34, min: 28, linhas: 2, fonte: { peso: 700, caixaAlta: true, espacamento: 0.04 } }) : null;
  const tamRotulo = encRotulo?.tamanho ?? 0;
  const linhasRotulo = encRotulo?.linhas.length ?? 0;
  const ti = atual ? tempos(atual.texto, palavras, atual.em, ate) : [];
  const td = atual?.detalhe && atual.detalheEm !== undefined ? tempos(atual.detalhe, palavras, atual.detalheEm, ate) : [];
  const indice = base + k + 1;
  const comMarca = !!atual && atual.marca !== undefined && atual.marcaEm !== undefined;
  // a altura que sobra para o item depende do que vai em volta dele
  const altoRotulo = rotulo ? linhasRotulo * tamRotulo * 1.08 + 18 : 0;
  const altoNumero = modo === "passos" ? Math.min(150, ret.h * 0.3) : 52;
  const altoBarra = 44;
  const altoDetalhe = atual?.detalhe ? 2 * 44 * 1.12 + 12 : 0;
  const disponivel = ret.h - 2 * pad - altoRotulo - altoNumero - altoBarra - altoDetalhe - 24;
  const maxItem = modo === "passos" ? 56 : ret.w >= 400 ? 64 : 52;
  const enc = atual
    ? encaixar(atual.texto, { largura: largura - (comMarca ? 84 : 0), max: Math.max(40, Math.min(maxItem, disponivel / (modo === "passos" ? 2.2 : 3.3))), min: 38, linhas: 3, fonte: { peso: 700 } })
    : null;
  const encD = atual?.detalhe ? encaixar(atual.detalhe, { largura, max: 44, min: 34, linhas: 2, fonte: { peso: 500 } }) : null;
  return (
    <CelulaBloco ret={ret} t={t} de={de} saida={saida}>
      <div style={{ position: "absolute", inset: 0, padding: pad, display: "flex", flexDirection: "column", gap: 14 }}>
        {rotulo ? (
          <div style={{ minHeight: tamRotulo * 1.08, display: "flex", alignItems: "center" }}>
            {t < (tr[0] ?? de) ? <Esboco w={largura * 0.5} h={18} /> : <Rotulo texto={rotulo} tempos={tr} t={t} tamanho={tamRotulo} linhas={encRotulo?.linhas} />}
          </div>
        ) : null}
        {/* o índice: "2/4" (lista) ou o número grande do passo */}
        {modo === "passos" ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, height: altoNumero, fontFamily: sans, fontVariantNumeric: "tabular-nums" }}>
            <div style={{ fontWeight: 700, fontSize: altoNumero * 0.95, lineHeight: 1, color: k >= 0 ? cor.acento : cor.esboco, scale: String(0.9 + 0.1 * prog(t, atual?.em ?? 0, 0.25)), transformOrigin: "0 100%" }}>{Math.max(1, indice)}</div>
            <div style={{ fontWeight: 600, fontSize: Math.max(40, altoNumero * 0.36), color: cor.tintaSuave }}>/{n}</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", height: altoNumero }}>
            <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 34, color: k >= 0 ? cor.acentoEscuro : cor.esboco, background: k >= 0 ? cor.acentoFundo : cor.esbocoClaro, padding: "4px 14px", borderRadius: 10 }}>
              {Math.max(0, indice)}/{n}
            </div>
          </div>
        )}
        {/* o item da vez, grande; troca na palavra do seguinte (o anterior é apagado antes) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12, minHeight: 0 }}>
          {atual && enc ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <TextoFalado key={k} texto={atual.texto} tempos={ti} t={t} linhas={enc.linhas} cursor style={{ fontFamily: sans, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.06, color: cor.tinta }} />
              {comMarca ? (
                <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                  <Marca t={t} em={atual.marcaEm} valor={atual.marca} tamanho={68} prefixo={prefixo} casas={casas} />
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Esboco w={largura * 0.8} h={26} />
              <Esboco w={largura * 0.55} h={26} />
            </>
          )}
          {atual?.detalhe && encD && t >= (td[0] ?? 1e9) ? (
            <TextoFalado texto={atual.detalhe} tempos={td} t={t} linhas={encD.linhas} style={{ fontFamily: sans, fontWeight: 500, fontSize: encD.tamanho, lineHeight: 1.12, color: cor.tintaSuave }} />
          ) : null}
        </div>
        {/* a barra: uma célula por item, que se pinta quando o item entra */}
        <div style={{ display: "flex", gap: 8, height: modo === "passos" ? 16 : 26 }}>
          {Array.from({ length: n }, (_, i) => {
            const it = i - base >= 0 && i - base < itens.length ? itens[i - base] : null;
            const feito = i < base || (it ? prog(t, it.em, 0.3) : 0);
            const vez = i === base + k;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 5,
                  background: feito ? (vez ? cor.acento : cor.acentoFundo2) : cor.esbocoClaro,
                  opacity: feito ? 0.35 + 0.65 * Number(feito) : 1,
                  boxShadow: vez ? `0 0 0 2px ${cor.acento}` : "none",
                }}
              />
            );
          })}
        </div>
      </div>
    </CelulaBloco>
  );
};

// ---------- gráfico: os dados ao lado da pessoa e o gráfico embaixo ----------

export const LadoDados: React.FC<{ m: Grafico; ret: Ret; t: number; palavras: Palavra[]; saida?: Saida }> = ({ m, ret, t, palavras, saida }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const f = formatoDoGrafico(m);
  const g = geoDados(ret, dados.length);
  const pad = 28;
  const tendenciaEm = m.tendenciaEm ?? m.de + 0.3;
  const unidade = [f.prefixo, f.sufixo.trim()].filter(Boolean).join(" ");
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      <div style={{ position: "absolute", left: pad, top: 0, height: g.cabecalho.h, right: pad, display: "flex", alignItems: "center", gap: 14 }}>
        <Icone nome="grafico" tamanho={40} cor={cor.acento} peso={3.6} p={prog(t, m.de, 0.5)} />
        {dados.length && unidade ? <div style={{ ...rotuloCaixaAlta, color: cor.tintaSuave }}>{unidade}</div> : null}
      </div>
      {dados.length ? (
        dados.map((d, i) => {
          const r = g.linhas[i];
          const y = r.y - ret.y;
          const tr = tempos(d.rotulo, palavras, d.em, m.ate);
          const p = prog(t, d.em, 0.6);
          const final = comFormato(d.valor, f);
          const tamValor = umaLinha(final, (ret.w - 2 * pad) * 0.48, 46, 32, { peso: 700 });
          const tamRot = umaLinha(d.rotulo, (ret.w - 2 * pad) * 0.5, 44, 30, { peso: 600 });
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: y, width: ret.w, height: r.h, borderTop: `1.5px solid ${cor.grade}`, boxSizing: "border-box" }}>
              <div style={{ position: "absolute", left: pad, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                {t < (tr[0] ?? d.em) ? <Esboco w={120} h={18} /> : <TextoFalado texto={d.rotulo} tempos={tr} t={t} style={{ fontFamily: sans, fontWeight: 600, fontSize: tamRot, color: cor.tinta, flexWrap: "nowrap" }} />}
              </div>
              <div style={{ position: "absolute", right: pad, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: sans, fontWeight: 700, fontSize: tamValor, color: p > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {p > 0 ? comFormato(d.valor * p, f) : final.replace(/\d/g, "0")}
              </div>
            </div>
          );
        })
      ) : (
        // sem números: a seta da tendência que se desenha e a etiqueta "ilustrativo"
        <div style={{ position: "absolute", left: pad, right: pad, top: g.cabecalho.h, bottom: pad, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 26 }}>
          <div style={{ width: 150, height: 150, borderRadius: 30, background: cor.acentoFundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icone nome={m.tendencia === "cai" ? "cai" : m.tendencia === "oscila" ? "oscila" : "sobe"} tamanho={112} cor={cor.acento} peso={3.8} p={prog(t, tendenciaEm, 0.8)} />
          </div>
          <Ilustrativo p={prog(t, tendenciaEm, 0.3)} />
        </div>
      )}
    </CelulaBloco>
  );
};

// o caminho de uma tendência sem números, desenhado na área do gráfico (0–1 em x e y, y para baixo)
const curvaDaTendencia = (tendencia: "sobe" | "cai" | "oscila") => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    let y: number;
    if (tendencia === "sobe") y = 0.86 - 0.7 * Math.pow(x, 1.6) - 0.06 * Math.sin(x * 9.5);
    else if (tendencia === "cai") y = 0.16 + 0.7 * Math.pow(x, 1.4) + 0.06 * Math.sin(x * 9.5);
    else y = 0.5 + 0.28 * Math.sin(x * Math.PI * 3.2) * (0.7 + 0.3 * x);
    pts.push([x, Math.min(0.95, Math.max(0.05, y))]);
  }
  return pts;
};

export const GraficoBloco: React.FC<{ m: Grafico; ret: Ret; t: number; palavras: Palavra[]; saida?: Saida }> = ({ m, ret, t, palavras, saida }) => {
  const dados = (m.dados ?? []).slice(0, 6);
  const f = formatoDoGrafico(m);
  const pad = 36;
  const topoPlot = 110;
  const baseX = 96;
  const plot = { x: pad + 20, y: topoPlot, w: ret.w - 2 * pad - 20, h: ret.h - topoPlot - baseX };
  const forma = m.forma ?? "barras";
  const ilustrativo = !dados.length || m.ilustrativo;
  const tendencia = m.tendencia ?? "sobe";
  const tendenciaEm = m.tendenciaEm ?? m.de + 0.3;
  const tt = m.titulo ? temposDoTexto(m.titulo, palavras, m.de - 0.3, m.ate, m.de + 0.1) : [];
  const tamTitulo = m.titulo ? umaLinha(m.titulo, ret.w - 2 * pad - (ilustrativo ? 230 : 0), 40, 32, { peso: 600 }) : 0;
  const max = Math.max(1e-9, ...dados.map((d) => Math.abs(d.valor)));
  const slot = plot.w / Math.max(1, dados.length);
  const desenho = prog(t, tendenciaEm, Math.max(1.2, m.ate - tendenciaEm - 0.4), (x) => x);
  const cores = [cor.acento, cor.tinta, cor.acentoFundo2, cor.tintaSuave, cor.acentoEscuro, cor.esboco];
  return (
    <CelulaBloco ret={ret} t={t} de={m.de} saida={saida}>
      {/* cabeçalho do gráfico */}
      <div style={{ position: "absolute", left: pad, right: pad, top: 0, height: 92, display: "flex", alignItems: "center", gap: 16, borderBottom: `1.5px solid ${cor.grade}` }}>
        <Icone nome="grafico" tamanho={44} cor={cor.acento} peso={3.6} p={prog(t, m.de, 0.5)} />
        {m.titulo ? (
          t < (tt[0] ?? m.de) ? (
            <Esboco w={260} h={20} />
          ) : (
            <TextoFalado texto={m.titulo} tempos={tt} t={t} style={{ fontFamily: sans, fontWeight: 600, fontSize: tamTitulo, color: cor.tinta, flexWrap: "nowrap" }} />
          )
        ) : null}
        {ilustrativo ? <Ilustrativo p={prog(t, dados.length ? m.de : tendenciaEm, 0.3)} style={{ marginLeft: "auto" }} /> : null}
      </div>
      <svg width={ret.w} height={ret.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* linhas de grade do gráfico e eixo */}
        {forma !== "pizza" || !dados.length
          ? [0.25, 0.5, 0.75].map((k) => <path key={k} d={`M${plot.x} ${plot.y + plot.h * (1 - k)}H${plot.x + plot.w}`} stroke={cor.grade} strokeWidth={2} strokeDasharray="6 8" />)
          : null}
        {forma !== "pizza" || !dados.length ? <path d={`M${plot.x} ${plot.y + plot.h}H${plot.x + plot.w}`} stroke={cor.tinta} strokeWidth={3.5} /> : null}
      </svg>
      {dados.length && forma === "barras" ? (
        dados.map((d, i) => {
          const p = prog(t, d.em, 0.55);
          const hBar = (plot.h - 60) * (Math.abs(d.valor) / max) * p;
          const w = slot * 0.56;
          const x = plot.x + slot * i + (slot - w) / 2;
          const vez = dados.findIndex((o) => t < o.em) === -1 ? i === dados.length - 1 : dados.findIndex((o) => t < o.em) - 1 === i;
          const final = comFormato(d.valor, f);
          const tamV = umaLinha(final, slot - 8, 42, 28, { peso: 700 });
          const encR = encaixar(d.rotulo, { largura: slot - 12, max: 36, min: 28, linhas: 2, fonte: { peso: 500 } });
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: x, top: plot.y + plot.h - hBar, width: w, height: hBar, background: vez ? cor.acento : cor.acentoFundo2, borderRadius: "8px 8px 0 0" }} />
              {p <= 0 ? <div style={{ position: "absolute", left: x, top: plot.y + plot.h - 40, width: w, height: 40, border: `2.5px dashed ${cor.esboco}`, borderBottom: "none", boxSizing: "border-box", borderRadius: "8px 8px 0 0" }} /> : null}
              {p > 0 ? (
                <div style={{ position: "absolute", left: plot.x + slot * i, width: slot, top: plot.y + plot.h - hBar - tamV * 1.3, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: tamV, color: vez ? cor.acento : cor.tinta, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {comFormato(d.valor * p, f)}
                </div>
              ) : null}
              <div style={{ position: "absolute", left: plot.x + slot * i + 6, width: slot - 12, top: plot.y + plot.h + 12, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: sans, fontWeight: 500, fontSize: encR.tamanho, color: p > 0 ? cor.tinta : cor.esboco, lineHeight: 1.05 }}>
                {encR.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>{l}</div>
                ))}
              </div>
            </div>
          );
        })
      ) : dados.length && forma === "linha" ? (
        <GraficoLinha dados={dados} plot={plot} slot={slot} max={max} t={t} f={f} />
      ) : dados.length && forma === "pizza" ? (
        <GraficoPizza dados={dados} ret={ret} t={t} f={f} cores={cores} />
      ) : (
        // sem números: a forma da tendência se desenha ao longo do momento
        <TendenciaDesenhada forma={forma} tendencia={tendencia} plot={plot} p={desenho} t={t} inicio={tendenciaEm} />
      )}
    </CelulaBloco>
  );
};

const GraficoLinha: React.FC<{
  dados: { rotulo: string; valor: number; em: number }[];
  plot: Ret;
  slot: number;
  max: number;
  t: number;
  f: { prefixo?: string; sufixo?: string; casas?: number };
}> = ({ dados, plot, slot, max, t, f }) => {
  const min = Math.min(0, ...dados.map((d) => d.valor));
  const yDe = (v: number) => plot.y + plot.h - 30 - ((v - min) / Math.max(1e-9, max - min)) * (plot.h - 90);
  const pts = dados.map((d, i) => ({ x: plot.x + slot * i + slot / 2, y: yDe(d.valor), d }));
  return (
    <>
      <svg width={plot.x + plot.w + 40} height={plot.y + plot.h + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {pts.slice(1).map((p, i) => {
          const a = pts[i];
          const pr = prog(t, p.d.em - 0.15, 0.5);
          return pr > 0 ? <path key={i} d={`M${a.x} ${a.y}L${mistura(a.x, p.x, pr)} ${mistura(a.y, p.y, pr)}`} stroke={cor.acento} strokeWidth={7} strokeLinecap="round" fill="none" /> : null;
        })}
        {pts.map((p, i) => {
          const pr = prog(t, p.d.em, 0.3);
          return pr > 0 ? <circle key={i} cx={p.x} cy={p.y} r={11 * pr} fill={cor.celula} stroke={cor.acento} strokeWidth={6} /> : <circle key={i} cx={p.x} cy={p.y} r={9} fill="none" stroke={cor.esboco} strokeWidth={3} strokeDasharray="4 5" />;
        })}
      </svg>
      {pts.map((p, i) => {
        const pr = prog(t, p.d.em, 0.5);
        const final = comFormato(p.d.valor, f);
        const tamV = umaLinha(final, slot - 8, 42, 28, { peso: 700 });
        const encR = encaixar(p.d.rotulo, { largura: slot - 12, max: 36, min: 28, linhas: 2, fonte: { peso: 500 } });
        return (
          <div key={i}>
            {pr > 0 ? (
              <div style={{ position: "absolute", left: p.x - slot / 2, width: slot, top: p.y - tamV * 1.5 - 14, textAlign: "center", fontFamily: sans, fontWeight: 700, fontSize: tamV, color: cor.tinta, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                {comFormato(p.d.valor * pr, f)}
              </div>
            ) : null}
            <div style={{ position: "absolute", left: p.x - slot / 2 + 6, width: slot - 12, top: plot.y + plot.h + 12, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: sans, fontWeight: 500, fontSize: encR.tamanho, color: pr > 0 ? cor.tinta : cor.esboco, lineHeight: 1.05 }}>
              {encR.linhas.map((l, k) => (
                <div key={k} style={{ whiteSpace: "nowrap" }}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};

const GraficoPizza: React.FC<{
  dados: { rotulo: string; valor: number; em: number }[];
  ret: Ret;
  t: number;
  f: { prefixo?: string; sufixo?: string; casas?: number };
  cores: string[];
}> = ({ dados, ret, t, f, cores }) => {
  const soma = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
  const r = Math.min(190, (ret.h - 140) / 2);
  const cx = 60 + r;
  const cy = 110 + (ret.h - 110) / 2;
  let inicio = 0;
  const fatias = dados.map((d, i) => {
    const frac = Math.max(0, d.valor) / soma;
    const p = prog(t, d.em, 0.6);
    const a0 = inicio * Math.PI * 2;
    const a1 = (inicio + frac * p) * Math.PI * 2;
    inicio += frac;
    const rr = r - 34;
    const ponto = (a: number) => `${(cx + rr * Math.sin(a)).toFixed(2)} ${(cy - rr * Math.cos(a)).toFixed(2)}`;
    const d1 = p > 0.001 ? `M${ponto(a0)}A${rr} ${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${ponto(a1)}` : "";
    return { d: d1, cor: cores[i % cores.length], p };
  });
  const xLegenda = cx + r + 50;
  const larguraLegenda = ret.w - xLegenda - 36;
  const h = Math.min(86, (ret.h - 140) / dados.length);
  return (
    <>
      <svg width={ret.w} height={ret.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={cx} cy={cy} r={r - 34} fill="none" stroke={cor.esbocoClaro} strokeWidth={68} />
        {fatias.map((s, i) => (s.d ? <path key={i} d={s.d} fill="none" stroke={s.cor} strokeWidth={68} /> : null))}
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em, 0.4);
        const final = comFormato(d.valor, f);
        const tamV = umaLinha(final, larguraLegenda * 0.4, 42, 28, { peso: 700 });
        const tamR = umaLinha(d.rotulo, larguraLegenda * 0.55, 40, 28, { peso: 600 });
        return (
          <div key={i} style={{ position: "absolute", left: xLegenda, top: cy - (dados.length * h) / 2 + i * h, width: larguraLegenda, height: h, display: "flex", alignItems: "center", gap: 14, opacity: 0.35 + 0.65 * p }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: p > 0 ? fatias[i].cor : "transparent", border: p > 0 ? "none" : `2.5px dashed ${cor.esboco}`, flexShrink: 0 }} />
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: tamR, color: p > 0 ? cor.tinta : cor.esboco, whiteSpace: "nowrap" }}>{p > 0 ? d.rotulo : ""}</div>
            <div style={{ marginLeft: "auto", fontFamily: sans, fontWeight: 700, fontSize: tamV, color: p > 0 ? cor.acento : cor.esboco, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{p > 0 ? comFormato(d.valor * p, f) : ""}</div>
          </div>
        );
      })}
    </>
  );
};

const TendenciaDesenhada: React.FC<{ forma: Grafico["forma"]; tendencia: "sobe" | "cai" | "oscila"; plot: Ret; p: number; t: number; inicio: number }> = ({ forma, tendencia, plot, p, t, inicio }) => {
  const pts = curvaDaTendencia(tendencia);
  if (forma === "barras" || forma === "pizza") {
    // barras sem números: cinco barras crescem uma depois da outra, na forma da tendência
    const n = 5;
    const slot = plot.w / n;
    return (
      <>
        {Array.from({ length: n }, (_, i) => {
          const y = pts[Math.round((i / (n - 1)) * 40)][1];
          const alvo = (1 - y) * (plot.h - 30);
          const pr = prog(t, inicio + i * 0.3, 0.45);
          return (
            <div
              key={i}
              style={{ position: "absolute", left: plot.x + slot * i + slot * 0.2, width: slot * 0.6, top: plot.y + plot.h - alvo * pr, height: alvo * pr, background: i === n - 1 ? cor.acento : cor.acentoFundo2, borderRadius: "8px 8px 0 0" }}
            />
          );
        })}
      </>
    );
  }
  const k = Math.max(1, Math.round(p * 40));
  const vis = pts.slice(0, k + 1);
  const xy = (q: [number, number]) => `${(plot.x + q[0] * plot.w).toFixed(1)} ${(plot.y + q[1] * plot.h).toFixed(1)}`;
  const linha = vis.map((q, i) => `${i ? "L" : "M"}${xy(q)}`).join("");
  const area = `${linha}L${(plot.x + vis[vis.length - 1][0] * plot.w).toFixed(1)} ${plot.y + plot.h}L${plot.x} ${plot.y + plot.h}Z`;
  const ponta = vis[vis.length - 1];
  return (
    <svg width={plot.x + plot.w + 40} height={plot.y + plot.h + 40} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {p > 0 ? (
        <>
          <path d={area} fill={cor.acentoFundo} />
          <path d={linha} fill="none" stroke={cor.acento} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={plot.x + ponta[0] * plot.w} cy={plot.y + ponta[1] * plot.h} r={13} fill={cor.celula} stroke={cor.acento} strokeWidth={7} />
        </>
      ) : (
        <path d={pts.map((q, i) => `${i ? "L" : "M"}${xy(q)}`).join("")} fill="none" stroke={cor.esboco} strokeWidth={4} strokeDasharray="6 9" />
      )}
    </svg>
  );
};
