// Blocos universais no painel creme (layout "lado"): a pessoa vai para a moldura da direita e a
// página de revista de beleza abre à esquerda. Mesma folha do truque: amostras "passadas" no papel,
// círculos vinho, linhas-guia vinho. No quadro deitado (src/fileira.ts) a página é larga e baixa,
// então a pilha do vertical vira colunas e fileiras:
//   topicos  → uma fileira por item: a amostra passada e, ao lado, o texto e o detalhe
//   passos   → coluna de fora: o número grande que vira a cada passo e o progresso; coluna da
//              costura: a lista com os círculos numerados, do lado da pessoa
//   definicao→ o termo, a amostra, uma linha-guia que desce até o significado
import { mistura, prog, saindo, Traco, vaiVem } from "../anim";
import { colunasDoPainel, INTERNA_PAINEL, PAINEL } from "../fileira";
import type { Regiao } from "../layout";
import type { Definicao, Lado, Palavra, Passos, Topicos } from "../plano";
import { cor, corDoProduto, deitado, fonte, QUADRO, tom } from "../tema";
import { Passada } from "./Amostra";
import { Icone } from "./Icones";
import { alturaDe, type Medida, medir, TextoFalado, temposFalados } from "./Texto";

export const PAINEL_TOPO = PAINEL.topo;
export const PAINEL_BASE = PAINEL.base;

// o conteúdo acompanha a borda da pessoa enquanto ela vai para a moldura (e volta)
export const deslocDoPainel = (regiao: Regiao, regiaoFinal: Regiao) => regiao.x + regiao.w - (regiaoFinal.x + regiaoFinal.w);

type Props<M> = { m: M; t: number; fim: number; palavras: Palavra[]; regiao: Regiao; regiaoFinal: Regiao; lado: Lado; colado?: boolean };

// A folha: acompanha a borda da pessoa; na troca, a pessoa volta e cobre o painel. Com outro painel
// colado (a pessoa fica na moldura), a página se apaga no fim, antes de a próxima se montar.
export const Folha: React.FC<{ desloc: number; t: number; fim: number; colado?: boolean; children: React.ReactNode }> = ({ desloc, t, fim, colado, children }) => {
  const some = colado ? saindo(t, fim + 0.1, 0.3) : saindo(t, fim + 0.75, 0.15);
  if (some >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: QUADRO.w, height: QUADRO.h, translate: `${desloc}px 0`, opacity: 1 - some, fontFamily: fonte, color: cor.tinta }}>
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

// ---------- topicos: paleta de ideias, uma fileira por item ----------

// largura da amostra de cada fileira e o vão até o texto
const AMOSTRA_TOPICO = 300;
const VAO_TOPICO = 40;

const geometriaTopicos = (m: Topicos, medTitulo: Medida | null) => {
  const n = m.itens.length;
  const topoItens = PAINEL_TOPO + (medTitulo ? alturaDe(medTitulo, 1.1) + 52 : 10);
  const larguraTexto = INTERNA_PAINEL - AMOSTRA_TOPICO - VAO_TOPICO;
  // do maior corpo para o menor, até tudo caber (com pouco texto, as amostras e o texto crescem e o
  // painel fica cheio até embaixo)
  const escada = [
    [60, 96],
    [56, 86],
    [52, 76],
    [48, 66],
    [44, 58],
    [40, 50],
  ] as const;
  for (const [fonteItem, passada] of escada) {
    const textos = m.itens.map((it) => medir(it.texto, larguraTexto, fonteItem, Math.max(40, fonteItem - 10), 2));
    const detalhes = m.itens.map((it) => (it.detalhe ? medir(it.detalhe, larguraTexto, Math.min(44, fonteItem - 8), 38, 2, 500) : null));
    const blocos = m.itens.map((_, i) => alturaDe(textos[i], 1.12) + (detalhes[i] ? 6 + alturaDe(detalhes[i] as Medida, 1.15) : 0));
    const alturas = blocos.map((b) => Math.max(passada, b));
    const soma = alturas.reduce((s, x) => s + x, 0) + (n - 1) * 32;
    if (soma <= PAINEL_BASE - topoItens || fonteItem === 40) {
      const ys = espalhar(alturas, topoItens, PAINEL_BASE, 28, 140);
      return { textos, detalhes, alturas, blocos, ys, passada, larguraTexto };
    }
  }
  throw new Error("inalcançável");
};

export const PainelTopicos: React.FC<Props<Topicos>> = ({ m, t, fim, palavras, regiao, regiaoFinal, colado }) => {
  const desloc = deslocDoPainel(regiao, regiaoFinal);
  const x0 = PAINEL.margem;
  const inicio = Math.max(0, m.de);
  const medTitulo = m.titulo ? medir(m.titulo, INTERNA_PAINEL, deitado(66), 44, 2) : null;
  const geo = geometriaTopicos(m, medTitulo);
  const atual = m.itens.reduce((k, it, i) => (t >= it.em - 0.1 ? i : k), -1);
  const temposTitulo = m.titulo ? temposFalados(m.titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.25) : [];
  return (
    <Folha desloc={desloc} t={t} fim={fim} colado={colado}>
      {m.titulo && medTitulo ? (
        <>
          <TextoFalado
            texto={m.titulo}
            medida={medTitulo}
            tempos={temposTitulo}
            t={t}
            entrelinha={1.1}
            style={{ position: "absolute", left: x0, top: PAINEL_TOPO, width: INTERNA_PAINEL }}
          />
          <svg width={INTERNA_PAINEL} height={4} style={{ position: "absolute", left: x0, top: PAINEL_TOPO + alturaDe(medTitulo, 1.1) + 22 }}>
            <Traco d={`M2,2 L${INTERNA_PAINEL - 2},2`} p={prog(t, inicio + 0.3, 0.7, vaiVem)} cor={cor.cremeEscuro} largura={3} />
          </svg>
        </>
      ) : null}
      {m.itens.map((it, i) => {
        const y = geo.ys[i];
        const h = geo.alturas[i];
        const proximo = m.itens[i + 1]?.em ?? m.ate;
        const tempos = temposFalados(it.texto, palavras, it.em, proximo);
        const antigo = i < atual;
        const det = geo.detalhes[i];
        const temposDet = it.detalhe ? temposFalados(it.detalhe, palavras, (tempos[tempos.length - 1] ?? it.em) + 0.15, proximo) : [];
        return (
          <div key={i} style={{ position: "absolute", left: x0, top: y, width: INTERNA_PAINEL, height: h }}>
            <div style={{ position: "absolute", left: 0, top: (h - geo.passada) / 2, width: AMOSTRA_TOPICO, height: geo.passada }}>
              <Passada
                cor={corDoProduto(it.cor, tom(i))}
                t={t}
                em={it.em}
                largura={AMOSTRA_TOPICO}
                altura={geo.passada}
                id={`top-${m.de}-${i}`}
                rascunho={inicio + 0.08 + i * 0.1}
              />
            </div>
            <div style={{ position: "absolute", left: AMOSTRA_TOPICO + VAO_TOPICO, top: (h - geo.blocos[i]) / 2, width: geo.larguraTexto, opacity: antigo ? 0.55 : 1 }}>
              <TextoFalado texto={it.texto} medida={geo.textos[i]} tempos={tempos} t={t} entrelinha={1.12} />
              {it.detalhe && det ? (
                <TextoFalado texto={it.detalhe} medida={det} tempos={temposDet} t={t} peso={500} entrelinha={1.15} cor={cor.tintaSuave} style={{ marginTop: 6 }} />
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

export const PainelPassos: React.FC<Props<Passos>> = ({ m, t, fim, palavras, regiao, regiaoFinal, colado }) => {
  const desloc = deslocDoPainel(regiao, regiaoFinal);
  const { fora, costura } = colunasDoPainel(0.44);
  const inicio = Math.max(0, m.de);
  const n = m.itens.length;
  // coluna de fora: título, o número grande e o progresso
  const medTitulo = m.titulo ? medir(m.titulo, fora.w, deitado(60), 40, 3) : null;
  const hTitulo = medTitulo ? alturaDe(medTitulo, 1.1) + 28 : 0;
  const numero = Math.min(deitado(280), Math.floor(fora.w / 1.7));
  // coluna da costura: a lista, do maior para o menor até caber
  let escolha: { fonteItem: number; circulo: number; textos: Medida[]; alturas: number[]; ys: number[] } | null = null;
  for (const [fonteItem, circulo] of [
    [52, 60],
    [48, 56],
    [46, 52],
    [44, 48],
    [42, 46],
    [40, 44],
  ] as const) {
    const textos = m.itens.map((it) => medir(it.texto, costura.w, fonteItem, Math.max(40, fonteItem - 8), 3));
    const alturas = textos.map((tx) => circulo + 12 + alturaDe(tx, 1.12));
    const soma = alturas.reduce((s, x) => s + x, 0) + (n - 1) * 24;
    if (soma <= PAINEL_BASE - PAINEL_TOPO || fonteItem === 40) {
      escolha = { fonteItem, circulo, textos, alturas, ys: espalhar(alturas, PAINEL_TOPO, PAINEL_BASE, 24, 120) };
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
    <Folha desloc={desloc} t={t} fim={fim} colado={colado}>
      {m.titulo && medTitulo ? (
        <TextoFalado
          texto={m.titulo}
          medida={medTitulo}
          tempos={temposTitulo}
          t={t}
          entrelinha={1.1}
          style={{ position: "absolute", left: fora.x, top: PAINEL_TOPO, width: fora.w }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: fora.x,
          top: topoNumero,
          width: fora.w,
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
          opacity: prog(t, inicio + 0.05, 0.4),
        }}
      >
        <div style={{ position: "relative", height: numero * 0.9, overflow: "hidden", minWidth: numero * 1.05, marginLeft: -numero * 0.05 }}>
          {/* rascunho: o primeiro número a lápis, antes de ser dito */}
          <div
            style={{
              position: "absolute",
              fontWeight: 300,
              fontSize: numero,
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
                  fontWeight: 300,
                  fontSize: numero,
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
        <div style={{ fontWeight: 500, fontSize: Math.round(numero * 0.24), color: cor.tintaSuave, paddingBottom: numero * 0.1, letterSpacing: "0.02em" }}>{total}</div>
      </div>
      {/* a lista, na coluna da costura: círculo e texto encostados do lado da pessoa */}
      {m.itens.map((it, i) => {
        const y = e.ys[i];
        const tempos = temposFalados(it.texto, palavras, it.em, m.itens[i + 1]?.em ?? m.ate);
        const antigo = i < atual;
        return (
          <div key={i} style={{ position: "absolute", left: costura.x, top: y, width: costura.w, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Circulo t={t} rascunho={inicio + 0.08 + i * 0.1} em={it.em} antigo={antigo} tamanho={e.circulo} numero={i + 1} icone={it.icone} />
            <div style={{ marginTop: 12, width: "100%", opacity: antigo ? 0.55 : 1 }}>
              <TextoFalado texto={it.texto} medida={e.textos[i]} tempos={tempos} t={t} entrelinha={1.12} alinhar="flex-end" />
            </div>
          </div>
        );
      })}
      {/* o progresso ● ● ○, embaixo da coluna de fora */}
      <div
        style={{
          position: "absolute",
          left: fora.x,
          top: PAINEL_BASE - 28,
          width: fora.w,
          display: "flex",
          gap: 16,
          justifyContent: "flex-start",
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
    </Folha>
  );
};

// ---------- definicao: termo → amostra → linha-guia → significado ----------

export const PainelDefinicao: React.FC<Props<Definicao>> = ({ m, t, fim, palavras, regiao, regiaoFinal, colado }) => {
  const desloc = deslocDoPainel(regiao, regiaoFinal);
  const x0 = PAINEL.margem;
  const largura = INTERNA_PAINEL;
  const inicio = Math.max(0, m.de);
  const alturaAmostra = 110;
  const larguraAmostra = Math.min(largura, 640);
  // mede termo e significado e encolhe os dois até a linha-guia ter o comprimento mínimo
  let k = 1;
  let medTermo = medir(m.termo, largura, deitado(112), 56, 2);
  let medSig = medir(m.significado, largura, deitado(72), 42, 3);
  const topoTermo = PAINEL_TOPO + 40;
  const geometria = () => {
    const hTermo = alturaDe(medTermo, 1.04);
    const topoAmostra = topoTermo + hTermo + 24;
    const hSig = alturaDe(medSig, 1.12);
    const y1 = topoAmostra + alturaAmostra + 28;
    const livre = PAINEL_BASE - hSig - 36 - y1;
    return { hTermo, topoAmostra, hSig, y1, livre };
  };
  let geo = geometria();
  while (geo.livre < 90 && k > 0.6) {
    k *= 0.9;
    medTermo = medir(m.termo, largura, Math.round(deitado(112) * k), 48, 2);
    medSig = medir(m.significado, largura, Math.round(deitado(72) * k), 40, 3);
    geo = geometria();
  }
  // a linha-guia desce da amostra até o ponto do significado (o significado fica mais perto da base)
  const linha = Math.max(70, Math.min(320, geo.livre - 30));
  const y2 = geo.y1 + linha;
  const topoSig = y2 + 36;
  const temposTermo = temposFalados(m.termo, palavras, m.em, m.significadoEm);
  const temposSig = temposFalados(m.significado, palavras, m.significadoEm, m.ate + 0.3);
  const xLinha = x0 + 9;
  const pLinha = prog(t, m.significadoEm - 0.35, Math.min(0.8, Math.max(0.4, m.significadoEm - m.em - 0.4)), vaiVem);
  const pPonto = prog(t, m.significadoEm - 0.05, 0.4);
  // antes do termo ser dito: só o rascunho (amostra tracejada e um traço a lápis no lugar do termo)
  const rascunho = prog(t, inicio + 0.05, 0.4) * (1 - prog(t, (temposTermo[temposTermo.length - 1] ?? m.em) + 0.3, 0.3));
  return (
    <Folha desloc={desloc} t={t} fim={fim} colado={colado}>
      {/* antes de ser dito, o termo já está na página "a lápis"; a tinta sobe por cima, palavra por palavra */}
      {rascunho > 0 ? (
        <TextoFalado
          texto={m.termo}
          medida={medTermo}
          tempos={medTermo.linhas.flatMap((l) => l.split(/\s+/)).map(() => inicio - 1)}
          t={t}
          entrelinha={1.04}
          cor={cor.lapis}
          style={{ position: "absolute", left: x0, top: topoTermo, width: largura, letterSpacing: "-0.01em", opacity: rascunho }}
        />
      ) : null}
      <TextoFalado
        texto={m.termo}
        medida={medTermo}
        tempos={temposTermo}
        t={t}
        entrelinha={1.04}
        style={{ position: "absolute", left: x0, top: topoTermo, width: largura, letterSpacing: "-0.01em" }}
      />
      <div style={{ position: "absolute", left: x0, top: geo.topoAmostra, width: larguraAmostra, height: alturaAmostra }}>
        <Passada
          cor={corDoProduto(undefined, tom(0))}
          t={t}
          em={(temposTermo[temposTermo.length - 1] ?? m.em) + 0.15}
          largura={larguraAmostra}
          altura={alturaAmostra}
          id={`def-${m.de}`}
          rascunho={inicio + 0.1}
        />
      </div>
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Traco d={`M${xLinha},${geo.y1} L${xLinha},${y2}`} p={pLinha} cor={cor.berry} largura={3.5} />
        <circle cx={xLinha} cy={y2 + 2} r={9 * pPonto} fill={cor.berry} />
      </svg>
      <TextoFalado
        texto={m.significado}
        medida={medSig}
        tempos={temposSig}
        t={t}
        entrelinha={1.12}
        style={{ position: "absolute", left: x0, top: topoSig, width: largura }}
      />
    </Folha>
  );
};
