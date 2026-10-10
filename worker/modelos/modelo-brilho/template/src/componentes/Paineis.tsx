// Blocos universais no painel creme (layout "lado"): a pessoa desliza para um lado e a página de
// revista de beleza abre do outro. Mesma folha do truque: costura do lado da pessoa, texto encostado
// nela, amostras "passadas" no papel, círculos vinho, linhas-guia vinho.
//   topicos  → cada item é uma amostra passada com o nome embaixo (uma paleta de ideias)
//   passos   → número grande que vira a cada passo + a lista numerada em círculos + progresso
//   definicao→ o termo, a amostra, uma linha-guia que desce até o significado
import { mistura, prog, saindo, Traco, vaiVem } from "../anim";
import type { Regiao } from "../layout";
import type { Definicao, Lado, Palavra, Passos, Topicos } from "../plano";
import { cor, corDoProduto, fonte, tom } from "../tema";
import { Passada } from "./Amostra";
import { Icone } from "./Icones";
import { alturaDe, type Medida, medir, TextoFalado, temposFalados } from "./Texto";

export const PAINEL_TOPO = 96;
export const PAINEL_BASE = 1486;
const PAD = 40;
const COSTURA = 40;

export const geometriaDoPainel = (regiaoFinal: Regiao, lado: Lado) => {
  // lado = onde está a PESSOA; o conteúdo encosta na costura (do lado da pessoa)
  const direito = lado === "esquerda";
  const interna = regiaoFinal.w - PAD - COSTURA;
  const x0 = direito ? regiaoFinal.x + COSTURA : regiaoFinal.x + PAD;
  const alinhar = direito ? ("flex-start" as const) : ("flex-end" as const);
  return { direito, interna, x0, alinhar, textAlign: direito ? ("left" as const) : ("right" as const) };
};

// o conteúdo acompanha a borda da pessoa enquanto ela desliza
export const deslocDoPainel = (regiao: Regiao, regiaoFinal: Regiao, direito: boolean) =>
  direito ? regiao.x - regiaoFinal.x : regiao.x + regiao.w - (regiaoFinal.x + regiaoFinal.w);

type Props<M> = { m: M; t: number; fim: number; palavras: Palavra[]; regiao: Regiao; regiaoFinal: Regiao; lado: Lado };

// A folha: acompanha a borda da pessoa; na troca, a pessoa volta e cobre o painel (o que sai cruza com o que entra)
const Folha: React.FC<{ desloc: number; t: number; fim: number; children: React.ReactNode }> = ({ desloc, t, fim, children }) => {
  const some = saindo(t, fim + 0.75, 0.15);
  if (some >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, translate: `${desloc}px 0`, opacity: 1 - some, fontFamily: fonte, color: cor.tinta }}>
      {children}
    </div>
  );
};

// Círculo vinho do painel (número ou ícone): contorno "a lápis" antes, vinho cheio quando é a vez,
// só contorno vinho depois
export const Circulo: React.FC<{
  t: number;
  rascunho: number;
  em: number;
  antigo: boolean;
  tamanho?: number;
  numero?: number;
  icone?: React.ComponentProps<typeof Icone>["nome"];
  style?: React.CSSProperties;
}> = ({ t, rascunho, em, antigo, tamanho = 60, numero, icone, style }) => {
  const r = prog(t, rascunho, 0.4);
  const p = prog(t, em - 0.1, 0.45);
  if (r <= 0 && p <= 0) return null;
  const aceso = p > 0;
  const fundo = aceso && !antigo ? cor.berry : "transparent";
  const traco = aceso ? cor.berry : cor.lapis;
  const tinta = aceso ? (antigo ? cor.berry : cor.creme) : cor.lapis;
  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: "50%",
        background: fundo,
        border: `3.5px ${aceso ? "solid" : "dashed"} ${traco}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        scale: String(aceso ? mistura(0.6, 1, p) : 1),
        opacity: aceso ? 1 : r,
        flexShrink: 0,
        ...style,
      }}
    >
      {icone ? (
        <Icone nome={icone} p={aceso ? prog(t, em + 0.05, 0.5) : 1} tamanho={tamanho * 0.54} cor={tinta} largura={10} />
      ) : numero !== undefined ? (
        <div style={{ fontWeight: 700, fontSize: tamanho * 0.5, lineHeight: 1, color: tinta }}>{numero}</div>
      ) : null}
    </div>
  );
};

// Distribui blocos de alturas `h` entre `topo` e `base`: espaço igual entre eles, o último encostando
// na base (o painel fica cheio até embaixo), sem passar de `maxIntervalo`
const espalhar = (h: number[], topo: number, base: number, minIntervalo: number, maxIntervalo: number) => {
  const soma = h.reduce((s, x) => s + x, 0);
  const n = h.length;
  const intervalo = n <= 1 ? 0 : Math.max(minIntervalo, Math.min(maxIntervalo, (base - topo - soma) / (n - 1)));
  let y = topo;
  return h.map((x) => {
    const yi = y;
    y += x + intervalo;
    return yi;
  });
};

// ---------- topicos: paleta de ideias ----------

const geometriaTopicos = (m: Topicos, interna: number, temTitulo: boolean, medTitulo: Medida | null) => {
  const n = m.itens.length;
  const topoItens = PAINEL_TOPO + (temTitulo && medTitulo ? alturaDe(medTitulo, 1.1) + 56 : 10);
  // do maior corpo para o menor, até tudo caber
  // do maior corpo para o menor, até tudo caber (com pouco texto, as amostras e o texto crescem e o
  // painel fica cheio até embaixo)
  const escada = [
    [64, 104],
    [60, 92],
    [56, 80],
    [52, 68],
    [48, 58],
    [44, 50],
    [40, 44],
  ] as const;
  for (const [fonteItem, passada] of escada) {
    const textos = m.itens.map((it) => medir(it.texto, interna, fonteItem, Math.max(40, fonteItem - 10), 3));
    const detalhes = m.itens.map((it) => (it.detalhe ? medir(it.detalhe, interna, Math.min(46, fonteItem - 8), 38, 3, 500) : null));
    const alturas = m.itens.map((_, i) => passada + 16 + alturaDe(textos[i], 1.12) + (detalhes[i] ? 8 + alturaDe(detalhes[i] as Medida, 1.15) : 0));
    const soma = alturas.reduce((s, x) => s + x, 0) + (n - 1) * 60;
    if (soma <= PAINEL_BASE - topoItens || fonteItem === 40) {
      const ys = espalhar(alturas, topoItens, PAINEL_BASE, 30, 220);
      return { textos, detalhes, alturas, ys, passada };
    }
  }
  throw new Error("inalcançável");
};

export const PainelTopicos: React.FC<Props<Topicos>> = ({ m, t, fim, palavras, regiao, regiaoFinal, lado }) => {
  const g = geometriaDoPainel(regiaoFinal, lado);
  const desloc = deslocDoPainel(regiao, regiaoFinal, g.direito);
  const inicio = Math.max(0, m.de);
  const medTitulo = m.titulo ? medir(m.titulo, g.interna, 66, 46, 3) : null;
  const geo = geometriaTopicos(m, g.interna, !!m.titulo, medTitulo);
  const atual = m.itens.reduce((k, it, i) => (t >= it.em - 0.1 ? i : k), -1);
  const temposTitulo = m.titulo ? temposFalados(m.titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.25) : [];
  return (
    <Folha desloc={desloc} t={t} fim={fim}>
      {m.titulo && medTitulo ? (
        <>
          <TextoFalado
            texto={m.titulo}
            medida={medTitulo}
            tempos={temposTitulo}
            t={t}
            entrelinha={1.1}
            alinhar={g.alinhar}
            style={{ position: "absolute", left: g.x0, top: PAINEL_TOPO, width: g.interna }}
          />
          <svg width={g.interna} height={4} style={{ position: "absolute", left: g.x0, top: PAINEL_TOPO + alturaDe(medTitulo, 1.1) + 24 }}>
            <Traco d={g.direito ? `M2,2 L${g.interna - 2},2` : `M${g.interna - 2},2 L2,2`} p={prog(t, inicio + 0.3, 0.7, vaiVem)} cor={cor.cremeEscuro} largura={3} />
          </svg>
        </>
      ) : null}
      {m.itens.map((it, i) => {
        const y = geo.ys[i];
        const proximo = m.itens[i + 1]?.em ?? m.ate;
        const tempos = temposFalados(it.texto, palavras, it.em, proximo);
        const antigo = i < atual;
        const det = geo.detalhes[i];
        const temposDet = it.detalhe ? temposFalados(it.detalhe, palavras, (tempos[tempos.length - 1] ?? it.em) + 0.15, proximo) : [];
        return (
          <div key={i} style={{ position: "absolute", left: g.x0, top: y, width: g.interna }}>
            <Passada
              cor={corDoProduto(it.cor, tom(i))}
              t={t}
              em={it.em}
              largura={g.interna}
              altura={geo.passada}
              id={`top-${m.de}-${i}`}
              espelhar={!g.direito}
              rascunho={inicio + 0.08 + i * 0.1}
            />
            <div style={{ marginTop: 16, opacity: antigo ? 0.55 : 1 }}>
              <TextoFalado texto={it.texto} medida={geo.textos[i]} tempos={tempos} t={t} entrelinha={1.12} alinhar={g.alinhar} />
              {it.detalhe && det ? (
                <TextoFalado
                  texto={it.detalhe}
                  medida={det}
                  tempos={temposDet}
                  t={t}
                  peso={500}
                  entrelinha={1.15}
                  alinhar={g.alinhar}
                  cor={cor.tintaSuave}
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </Folha>
  );
};

// ---------- passos: o número grande vira a cada passo ----------

const dois = (n: number) => String(n).padStart(2, "0");

export const PainelPassos: React.FC<Props<Passos>> = ({ m, t, fim, palavras, regiao, regiaoFinal, lado }) => {
  const g = geometriaDoPainel(regiaoFinal, lado);
  const desloc = deslocDoPainel(regiao, regiaoFinal, g.direito);
  const inicio = Math.max(0, m.de);
  const n = m.itens.length;
  const medTitulo = m.titulo ? medir(m.titulo, g.interna, 60, 44, 2) : null;
  const hTitulo = medTitulo ? alturaDe(medTitulo, 1.1) + 28 : 0;
  // do maior para o menor até caber: número grande, círculos e texto
  let escolha: { numero: number; fonteItem: number; circulo: number; textos: Medida[]; alturas: number[]; ys: number[] } | null = null;
  for (const [numero, fonteItem, circulo] of [
    [250, 54, 60],
    [220, 50, 56],
    [190, 46, 52],
    [160, 42, 48],
    [140, 40, 44],
  ] as const) {
    const textos = m.itens.map((it) => medir(it.texto, g.interna, fonteItem, fonteItem - 8, 3));
    const alturas = textos.map((tx) => circulo + 12 + alturaDe(tx, 1.12));
    const topoLista = PAINEL_TOPO + hTitulo + numero * 0.92 + 48;
    const soma = alturas.reduce((s, x) => s + x, 0) + (n - 1) * 28;
    if (soma <= PAINEL_BASE - 60 - topoLista || numero === 140) {
      escolha = { numero, fonteItem, circulo, textos, alturas, ys: espalhar(alturas, topoLista, PAINEL_BASE - 60, 28, 120) };
      break;
    }
  }
  const e = escolha!;
  const atual = m.itens.reduce((k, it, i) => (t >= it.em - 0.1 ? i : k), -1);
  const temposTitulo = m.titulo ? temposFalados(m.titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.25) : [];
  const topoNumero = PAINEL_TOPO + hTitulo;
  // o número: "01" a lápis até o primeiro passo ser dito; depois rola para o passo atual
  const mostrados = m.itens.map((it, i) => ({ n: i + 1, em: it.em }));
  const total = `/${dois(n)}`;
  return (
    <Folha desloc={desloc} t={t} fim={fim}>
      {m.titulo && medTitulo ? (
        <TextoFalado
          texto={m.titulo}
          medida={medTitulo}
          tempos={temposTitulo}
          t={t}
          entrelinha={1.1}
          alinhar={g.alinhar}
          style={{ position: "absolute", left: g.x0, top: PAINEL_TOPO, width: g.interna }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: g.x0,
          top: topoNumero,
          width: g.interna,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: g.alinhar,
          gap: 14,
          opacity: prog(t, inicio + 0.05, 0.4),
        }}
      >
        <div style={{ position: "relative", height: e.numero * 0.9, overflow: "hidden", minWidth: e.numero * 1.05, marginLeft: g.direito ? -e.numero * 0.05 : 0 }}>
          {/* rascunho: o primeiro número a lápis, antes de ser dito */}
          <div
            style={{
              position: "absolute",
              right: g.direito ? undefined : 0,
              fontWeight: 300,
              fontSize: e.numero,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: cor.lapis,
              translate: `0 ${-prog(t, mostrados[0].em - 0.1, 0.45) * 100}%`,
            }}
          >
            {dois(1)}
          </div>
          {mostrados.map((x, i) => {
            const entra = prog(t, x.em - 0.1, 0.45);
            const sai = i + 1 < mostrados.length ? prog(t, mostrados[i + 1].em - 0.1, 0.45) : 0;
            if (entra <= 0 || sai >= 1) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  right: g.direito ? undefined : 0,
                  fontWeight: 300,
                  fontSize: e.numero,
                  lineHeight: 0.9,
                  letterSpacing: "-0.05em",
                  color: cor.berry,
                  translate: `0 ${(1 - entra) * 100 - sai * 100}%`,
                }}
              >
                {dois(x.n)}
              </div>
            );
          })}
        </div>
        <div style={{ fontWeight: 500, fontSize: Math.round(e.numero * 0.24), color: cor.tintaSuave, paddingBottom: e.numero * 0.1, letterSpacing: "0.02em" }}>{total}</div>
      </div>
      {m.itens.map((it, i) => {
        const y = e.ys[i];
        const tempos = temposFalados(it.texto, palavras, it.em, m.itens[i + 1]?.em ?? m.ate);
        const antigo = i < atual;
        return (
          <div key={i} style={{ position: "absolute", left: g.x0, top: y, width: g.interna, display: "flex", flexDirection: "column", alignItems: g.alinhar }}>
            <Circulo t={t} rascunho={inicio + 0.08 + i * 0.1} em={it.em} antigo={antigo} tamanho={e.circulo} numero={i + 1} icone={it.icone} />
            <div style={{ marginTop: 12, width: "100%", opacity: antigo ? 0.55 : 1 }}>
              <TextoFalado texto={it.texto} medida={e.textos[i]} tempos={tempos} t={t} entrelinha={1.12} alinhar={g.alinhar} />
            </div>
          </div>
        );
      })}
      {!m.legenda ? (
        <div
          style={{
            position: "absolute",
            left: g.x0,
            top: PAINEL_BASE + 8,
            width: g.interna,
            display: "flex",
            gap: 16,
            justifyContent: g.alinhar,
            opacity: prog(t, inicio + 0.3, 0.5),
          }}
        >
          {m.itens.map((it, i) => {
            const ativo = i === atual;
            const w = ativo ? mistura(28, 92, prog(t, it.em - 0.1, 0.6, vaiVem)) : 28;
            return (
              <div
                key={i}
                style={{
                  height: 28,
                  width: w,
                  borderRadius: 14,
                  background: i <= atual ? cor.berry : "transparent",
                  border: `3.5px solid ${cor.berry}`,
                  boxSizing: "border-box",
                  opacity: ativo ? 1 : 0.5,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </Folha>
  );
};

// ---------- definicao: termo → amostra → linha-guia → significado ----------

export const PainelDefinicao: React.FC<Props<Definicao>> = ({ m, t, fim, palavras, regiao, regiaoFinal, lado }) => {
  const g = geometriaDoPainel(regiaoFinal, lado);
  const desloc = deslocDoPainel(regiao, regiaoFinal, g.direito);
  const inicio = Math.max(0, m.de);
  const medTermo = medir(m.termo, g.interna, 112, 64, 2);
  const medSig = medir(m.significado, g.interna, 72, 46, 4);
  const temposTermo = temposFalados(m.termo, palavras, m.em, m.significadoEm);
  const temposSig = temposFalados(m.significado, palavras, m.significadoEm, m.ate + 0.3);
  const hTermo = alturaDe(medTermo, 1.04);
  const topoTermo = PAINEL_TOPO + 64;
  const topoAmostra = topoTermo + hTermo + 26;
  const alturaAmostra = 130;
  const hSig = alturaDe(medSig, 1.12);
  // a linha-guia desce da amostra até o ponto do significado; o significado fica mais perto da base
  const y1 = topoAmostra + alturaAmostra + 30;
  const linha = Math.max(140, Math.min(440, PAINEL_BASE - 90 - hSig - (y1 + 52)));
  const y2 = y1 + linha;
  const topoSig = y2 + 40;
  const xLinha = g.direito ? g.x0 + 9 : g.x0 + g.interna - 9;
  const pLinha = prog(t, m.significadoEm - 0.35, Math.min(0.8, Math.max(0.4, m.significadoEm - m.em - 0.4)), vaiVem);
  const pPonto = prog(t, m.significadoEm - 0.05, 0.4);
  // antes do termo ser dito: só o rascunho (amostra tracejada e um traço a lápis no lugar do termo)
  const rascunho = prog(t, inicio + 0.05, 0.4) * (1 - prog(t, (temposTermo[temposTermo.length - 1] ?? m.em) + 0.3, 0.3));
  return (
    <Folha desloc={desloc} t={t} fim={fim}>
      {/* antes de ser dito, o termo já está na página "a lápis"; a tinta sobe por cima, palavra por palavra */}
      {rascunho > 0 ? (
        <TextoFalado
          texto={m.termo}
          medida={medTermo}
          tempos={medTermo.linhas.flatMap((l) => l.split(/\s+/)).map(() => inicio - 1)}
          t={t}
          entrelinha={1.04}
          alinhar={g.alinhar}
          cor={cor.lapis}
          style={{ position: "absolute", left: g.x0, top: topoTermo, width: g.interna, letterSpacing: "-0.01em", opacity: rascunho }}
        />
      ) : null}
      <TextoFalado
        texto={m.termo}
        medida={medTermo}
        tempos={temposTermo}
        t={t}
        entrelinha={1.04}
        alinhar={g.alinhar}
        style={{ position: "absolute", left: g.x0, top: topoTermo, width: g.interna, letterSpacing: "-0.01em" }}
      />
      <div style={{ position: "absolute", left: g.x0, top: topoAmostra, width: g.interna, height: alturaAmostra }}>
        <Passada
          cor={corDoProduto(undefined, tom(0))}
          t={t}
          em={(temposTermo[temposTermo.length - 1] ?? m.em) + 0.15}
          largura={g.interna}
          altura={alturaAmostra}
          id={`def-${m.de}`}
          espelhar={!g.direito}
          rascunho={inicio + 0.1}
        />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Traco d={`M${xLinha},${y1} L${xLinha},${y2}`} p={pLinha} cor={cor.berry} largura={3.5} />
        <circle cx={xLinha} cy={y2 + 2} r={9 * pPonto} fill={cor.berry} />
      </svg>
      <TextoFalado
        texto={m.significado}
        medida={medSig}
        tempos={temposSig}
        t={t}
        entrelinha={1.12}
        alinhar={g.alinhar}
        style={{ position: "absolute", left: g.x0, top: topoSig, width: g.interna }}
      />
    </Folha>
  );
};
