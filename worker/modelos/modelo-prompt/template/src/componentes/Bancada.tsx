// Os blocos universais da bancada (a pessoa numa janela, o conteúdo no cinza-claro):
// - topicos: a resposta do assistente em lista, cada item entra em foco com uma peça numerada;
// - passos: peças numeradas que encaixam uma na outra (a ordem), cada passo digitado num balão;
// - comparacao: dois cartões que entram em foco; o que perde fica vago, o que ganha ganha cor e visto;
// - grafico: a resposta do assistente com barras em forma de peça, linha que se desenha ou a fila
//   proporcional de peças (pizza); sem números, a forma da tendência com a etiqueta "ilustrativo".
// Tudo espera a lápis (tracejado, barras cinza) e ganha cor e foco quando é dito.
import { chega, desliza, mistura, prog, type Ret, temposDoTexto } from "../anim";
import type { Quadro } from "../geometria";
import { alturaTexto, cabe, type Encaixe, encaixar, formatarNumero, larguraTexto, quebrar } from "../medida";
import type { Comparacao, Grafico, ItemDito, Palavra, Passos, Topicos } from "../plano";
import { cor, corDaPeca, mono, sans, sombra } from "../tema";
import { TextoFalado } from "../texto";
import { Icone } from "./Icones";
import { FormaDaPeca } from "./Peca";
import type { Som } from "./Peito";
import { AvatarIA, Foco } from "./Resposta";

type Props<M> = { m: M; t: number; q: Quadro; palavras: Palavra[] };

// ---------- o cabeçalho ao lado da janela ----------
// rótulo em mono (progresso "2 de 3", "ilustrativo"…), o título grande montado na fala (ou o nome do
// item atual, que troca subindo) e, embaixo, a fila de peças pequenas que se pintam.
const Cabecalho: React.FC<{
  r: Ret;
  t: number;
  de: number;
  rotulos?: { texto: string; em: number }[];
  titulo?: { enc: Encaixe; tempos: number[] };
  nomes?: { enc: Encaixe; em: number }[];
  fila?: { n: number; em: number[] };
  extra?: React.ReactNode;
}> = ({ r, t, de, rotulos, titulo, nomes, fila, extra }) => {
  const entra = prog(t, de + 0.05, 0.35);
  const filaH = fila ? 78 : 0;
  const yTexto = rotulos?.length ? 64 : 4;
  const altTexto = r.h - yTexto - (fila ? filaH + 26 : 0);
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, opacity: entra, translate: `0 ${(1 - entra) * 30}px` }}>
      {rotulos?.length ? (
        <div style={{ position: "relative", height: 56, overflow: "hidden", display: "flex", alignItems: "center", gap: 14 }}>
          {rotulos.map((ro, i) => {
            const e = i === 0 ? 1 : prog(t, ro.em - 0.05, 0.35);
            const v = i < rotulos.length - 1 ? prog(t, rotulos[i + 1].em - 0.05, 0.35) : 0;
            if (e <= 0 || v >= 1) return null;
            return (
              <div
                key={`r-${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 8,
                  fontFamily: mono,
                  fontWeight: 600,
                  fontSize: 34,
                  letterSpacing: "0.07em",
                  color: cor.tintaSuave,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  opacity: e * (1 - v),
                  translate: `0 ${(1 - e) * 30 - v * 30}px`,
                }}
              >
                {ro.texto}
              </div>
            );
          })}
          <div style={{ position: "absolute", right: 0, top: 0 }}>{extra}</div>
        </div>
      ) : extra ? (
        <div style={{ position: "absolute", right: 0, top: 0 }}>{extra}</div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: yTexto, width: r.w, height: altTexto, overflow: "hidden" }}>
        {/* antes da primeira palavra: barras a lápis no lugar do título */}
        {(() => {
          const primeiro = titulo ? (titulo.tempos[0] ?? de) : nomes?.length ? nomes[0].em : null;
          if (primeiro === null || primeiro <= de + 0.5) return null;
          const p = prog(t, primeiro - 0.1, 0.2);
          return p < 1 ? (
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", opacity: 1 - p }}>
              <Barras largura={r.w} linhas={2} altura={30} />
            </div>
          ) : null;
        })()}
        {titulo ? (
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
            <TextoFalado
              linhas={titulo.enc.linhas}
              tempos={titulo.tempos}
              t={t}
              tamanho={titulo.enc.tamanho}
              modo="sobe"
              entrelinha={1.04}
              estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.015em" }}
            />
          </div>
        ) : null}
        {nomes?.map((no, i) => {
          const e = prog(t, no.em - 0.05, 0.4);
          const v = i < nomes.length - 1 ? prog(t, nomes[i + 1].em - 0.05, 0.4) : 0;
          if (e <= 0 || v >= 1) return null;
          return (
            <div
              key={`n-${i}`}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: sans,
                fontWeight: 700,
                fontSize: no.enc.tamanho,
                lineHeight: 1.04,
                letterSpacing: "-0.015em",
                color: corDaPeca(i).escura,
                whiteSpace: "nowrap",
                opacity: e * (1 - v),
                translate: `0 ${(1 - e) * 90 - v * 90}px`,
              }}
            >
              {no.enc.linhas.map((l, k) => (
                <div key={k}>{l.join(" ")}</div>
              ))}
            </div>
          );
        })}
      </div>
      {fila ? (
        <div style={{ position: "absolute", left: 0, bottom: 0, width: r.w, height: filaH }}>
          <FilaProgresso n={fila.n} em={fila.em} t={t} largura={r.w} />
        </div>
      ) : null}
    </div>
  );
};

// a fila de peças pequenas: a lápis até o item ser dito, depois na cor dele
const FilaProgresso: React.FC<{ n: number; em: number[]; t: number; largura: number }> = ({ n, em, t, largura }) => {
  const d = 12;
  const w = Math.min(124, (largura - d) / n);
  const h = 78;
  return (
    <div style={{ position: "relative", height: h }}>
      {Array.from({ length: n }).map((_, i) => {
        const c = corDaPeca(i);
        const p = prog(t, em[i] + 0.15, 0.25);
        const r = { x: i * w, y: 0, w: w + 0.5, h };
        return (
          <div key={`f-${i}`}>
            <FormaDaPeca r={r} preenchimento="rgba(255,255,255,0.45)" traco={cor.lapis} tracejado lateral raio={16} encaixe={i > 0} comDente={i < n - 1} opacidade={1 - p} />
            <FormaDaPeca r={r} preenchimento={c.forte} lateral raio={16} encaixe={i > 0} comDente={i < n - 1} opacidade={p}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 700, fontSize: 34, color: c.texto }}>
                {i + 1}
              </div>
            </FormaDaPeca>
            <div
              style={{
                position: "absolute",
                left: r.x,
                width: r.w,
                top: 0,
                height: h,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: mono,
                fontWeight: 600,
                fontSize: 34,
                color: cor.lapis,
                opacity: 1 - p,
              }}
            >
              {i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// barras cinza no lugar do texto que ainda não foi dito
const Barras: React.FC<{ largura: number; linhas?: number; altura?: number }> = ({ largura, linhas = 2, altura = 22 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: altura * 0.8 }}>
    {Array.from({ length: linhas }).map((_, k) => (
      <div key={k} style={{ width: largura * (k === 0 ? 0.72 : 0.44), height: altura, borderRadius: altura / 2, background: cor.lapisClaro }} />
    ))}
  </div>
);

const fimDoItem = (itens: ItemDito[], i: number, ate: number) => itens[i + 1]?.em ?? ate;
const itensValidos = (itens: ItemDito[]) => itens.slice(0, 5);

// título do cabeçalho ou, sem título, os textos dos itens trocando
const textoDoCabecalho = (titulo: string | undefined, itens: ItemDito[], r: Ret, palavras: Palavra[], de: number, ate: number, alturaLivre: number) => {
  if (titulo?.trim()) {
    let max = 76;
    let enc = encaixar(titulo, { largura: r.w, max, min: 46, linhas: 3, fonte: { peso: 700 } });
    while (alturaTexto(enc, 1.04) > alturaLivre && max > 46) {
      max -= 4;
      enc = encaixar(titulo, { largura: r.w, max, min: 40, linhas: 3, fonte: { peso: 700 } });
    }
    return { titulo: { enc, tempos: temposDoTexto(titulo, palavras, de, itens[0]?.em ?? ate, de + 0.15) } };
  }
  return {
    nomes: itens.map((it) => ({ enc: encaixar(it.texto, { largura: r.w, max: 68, min: 40, linhas: 3, fonte: { peso: 700 } }), em: it.em })),
  };
};

// ---------- topicos ----------
export const sonsTopicos = (m: Topicos): Som[] => itensValidos(m.itens).map((it, i) => ({ em: it.em + 0.18, arquivo: `sfx/encaixe-${Math.min(i, 3) + 1}.wav`, volume: 0.34 }));

export const BlocoTopicos: React.FC<Props<Topicos>> = ({ m, t, q, palavras }) => {
  const itens = itensValidos(m.itens);
  const n = itens.length;
  const cab = q.cabecalho;
  const corpo = q.corpo;
  const head = textoDoCabecalho(m.titulo, itens, cab, palavras, m.de, m.ate, cab.h - 64 - 104);
  // o cartão da resposta
  const topoLinhas = 100;
  // poucos itens: linhas mais altas e letra maior; o cartão tem a altura do conteúdo
  const altLinha = Math.min(n <= 2 ? 330 : n === 3 ? 240 : 196, (corpo.h - topoLinhas - 24) / Math.max(1, n));
  const altCartao = Math.min(corpo.h, topoLinhas + n * altLinha + 24);
  const xTexto = 26 + 96 + 26;
  const largTexto = corpo.w - xTexto - 34;
  const comDetalhe = itens.some((it) => it.detalhe);
  const altDet = comDetalhe ? 46 : 0;
  // o mesmo corpo para todos os itens: o maior em que todos cabem na altura da linha
  let tam = n <= 2 ? 66 : n === 3 ? 58 : 54;
  for (; tam > 40; tam -= 2) {
    const max = Math.max(1, Math.floor((altLinha - 28 - altDet) / (tam * 1.1)));
    if (itens.every((it) => cabe(it.texto, largTexto, tam, Math.min(2, max), { peso: 600 }))) break;
  }
  const encs = itens.map((it) => ({ tamanho: tam, linhas: quebrar(it.texto, largTexto, tam, { peso: 600 }) }));
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.05 ? i : k), -1);
  const faixaY = (i: number) => topoLinhas + i * altLinha;
  // a faixa da linha atual desliza de um item para o outro
  let yFaixa = faixaY(Math.max(0, atual));
  if (atual > 0) yFaixa = mistura(faixaY(atual - 1), faixaY(atual), prog(t, itens[atual].em - 0.05, 0.3, desliza));
  const pFaixa = atual >= 0 ? prog(t, itens[0].em - 0.05, 0.3) : 0;
  const cFaixa = corDaPeca(Math.max(0, atual));
  return (
    <>
      <Cabecalho
        r={cab}
        t={t}
        de={m.de}
        rotulos={itens.map((it, i) => ({ texto: `${i + 1} de ${n}`, em: i === 0 ? m.de : it.em }))}
        titulo={head.titulo}
        nomes={head.nomes}
        fila={{ n, em: itens.map((it) => it.em) }}
      />
      <div style={{ position: "absolute", left: corpo.x, top: corpo.y, width: corpo.w, height: altCartao, borderRadius: 36, background: cor.cartao, boxShadow: sombra(1), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 30, top: 26, display: "flex", alignItems: "center", gap: 14 }}>
          <AvatarIA tamanho={52} />
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 38, color: cor.tinta }}>Assistente</div>
        </div>
        {/* a faixa da linha atual */}
        <div style={{ position: "absolute", left: 14, right: 14, top: yFaixa + 6, height: altLinha - 12, borderRadius: 24, background: cFaixa.clara, opacity: pFaixa }} />
        {itens.map((it, i) => {
          const y = faixaY(i);
          const c = corDaPeca(i);
          const p = prog(t, it.em - 0.05, 0.3);
          const assenta = prog(t, it.em + 0.12, 0.14);
          const enc = encs[i];
          const altT = enc.linhas.length * tam * 1.1 + (it.detalhe ? altDet : 0);
          const tempos = temposDoTexto(it.texto, palavras, it.em, fimDoItem(itens, i, m.ate), it.em);
          const temposDet = it.detalhe ? temposDoTexto(it.detalhe, palavras, it.em, fimDoItem(itens, i, m.ate), (tempos[tempos.length - 1] ?? it.em) + 0.25) : [];
          const encDet = it.detalhe ? encaixar(it.detalhe, { largura: largTexto, max: 38, min: 32, linhas: 1, fonte: { peso: 500 } }) : null;
          const rPeca = { x: 26, y: y + (altLinha - 64) / 2, w: 96, h: 64 };
          return (
            <div key={`it-${i}`}>
              {i > 0 ? <div style={{ position: "absolute", left: 30, right: 30, top: y, height: 2, background: cor.linha }} /> : null}
              <FormaDaPeca r={rPeca} preenchimento="rgba(242,243,245,0.8)" traco={cor.lapis} tracejado lateral raio={16} encaixe={false} opacidade={1 - p} />
              {p > 0 ? (
                <FormaDaPeca r={{ ...rPeca, x: rPeca.x - (1 - p) * 60, y: rPeca.y - 10 * (1 - assenta) }} preenchimento={c.forte} lateral raio={16} encaixe={false} opacidade={Math.min(1, p * 3)} sombra={1}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 700, fontSize: 36, color: c.texto }}>
                    {i + 1}
                  </div>
                </FormaDaPeca>
              ) : null}
              <div style={{ position: "absolute", left: xTexto, top: y + (altLinha - altT) / 2, width: largTexto }}>
                {t < it.em - 0.05 ? (
                  <div style={{ paddingTop: (altT - 22 * 2.8) / 2 }}>
                    <Barras largura={largTexto} linhas={2} />
                  </div>
                ) : (
                  <>
                    <TextoFalado
                      linhas={enc.linhas}
                      tempos={tempos}
                      t={t}
                      tamanho={tam}
                      modo="foco"
                      entrelinha={1.1}
                      estilo={{ fontFamily: sans, fontWeight: 600, color: i === atual ? c.escura : cor.tinta }}
                    />
                    {encDet ? (
                      <div style={{ marginTop: 6 }}>
                        <TextoFalado
                          linhas={encDet.linhas}
                          tempos={temposDet}
                          t={t}
                          tamanho={encDet.tamanho}
                          modo="foco"
                          estilo={{ fontFamily: sans, fontWeight: 500, color: cor.tintaSuave }}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ---------- passos ----------
export const sonsPassos = (m: Passos): Som[] => itensValidos(m.itens).map((it, i) => ({ em: it.em + 0.2, arquivo: `sfx/encaixe-${Math.min(i, 3) + 1}.wav`, volume: 0.4 }));

export const BlocoPassos: React.FC<Props<Passos>> = ({ m, t, q, palavras }) => {
  const itens = itensValidos(m.itens);
  const n = itens.length;
  const cab = q.cabecalho;
  const corpo = q.corpo;
  const head = textoDoCabecalho(m.titulo, itens, cab, palavras, m.de, m.ate, cab.h - 64 - 104);
  const altLinha = Math.min(250, corpo.h / Math.max(1, n));
  const topo = corpo.y + (corpo.h - altLinha * n) / 2;
  const wPeca = 120;
  const xBalao = corpo.x + wPeca + 26;
  const wBalao = corpo.x + corpo.w - xBalao;
  const largTexto = wBalao - 64;
  const comDetalhe = itens.some((it) => it.detalhe);
  const altDet = comDetalhe ? 46 : 0;
  const altBalao = altLinha - 22;
  let tam = 58;
  for (; tam > 40; tam -= 2) {
    const max = Math.max(1, Math.floor((altBalao - 36 - altDet) / (tam * 1.1)));
    if (itens.every((it) => cabe(it.texto, largTexto, tam, Math.min(3, max), { peso: 600 }))) break;
  }
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.05 ? i : k), -1);
  return (
    <>
      <Cabecalho
        r={cab}
        t={t}
        de={m.de}
        rotulos={itens.map((it, i) => ({ texto: `passo ${i + 1} de ${n}`, em: i === 0 ? m.de : it.em }))}
        titulo={head.titulo}
        nomes={head.nomes}
      />
      {itens.map((it, i) => {
        const y = topo + i * altLinha;
        const c = corDaPeca(i);
        const p = prog(t, it.em - 0.06, 0.3);
        const assenta = prog(t, it.em + 0.16, 0.14);
        const rPeca = { x: corpo.x, y, w: wPeca, h: altLinha };
        const linhas = quebrar(it.texto, largTexto, tam, { peso: 600 });
        const altT = linhas.length * tam * 1.1 + (it.detalhe ? altDet : 0);
        const tempos = temposDoTexto(it.texto, palavras, it.em, fimDoItem(itens, i, m.ate), it.em).map((x) => Math.max(x, it.em + 0.1));
        const fimTexto = (tempos[tempos.length - 1] ?? it.em) + 0.3;
        const encDet = it.detalhe ? encaixar(it.detalhe, { largura: largTexto, max: 38, min: 32, linhas: 1, fonte: { peso: 500 } }) : null;
        const temposDet = it.detalhe ? temposDoTexto(it.detalhe, palavras, it.em, fimDoItem(itens, i, m.ate), fimTexto) : [];
        const rBalao = { x: xBalao, y: y + 8, w: wBalao, h: altBalao };
        return (
          <div key={`p-${i}`}>
            {/* a peça numerada: a lápis, depois desce e encaixa na de cima */}
            <FormaDaPeca r={rPeca} preenchimento="rgba(255,255,255,0.42)" traco={cor.lapis} tracejado encaixe={i > 0} comDente={i < n - 1} raio={22} opacidade={1 - p}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 600, fontSize: 44, color: cor.lapis }}>
                {i + 1}
              </div>
            </FormaDaPeca>
            {p > 0 ? (
              <FormaDaPeca r={{ ...rPeca, y: y - 40 * (1 - p) - 14 * (1 - assenta) }} preenchimento={c.forte} encaixe={i > 0} comDente={i < n - 1} raio={22} opacidade={Math.min(1, p * 3)} sombra={1 + (1 - assenta)}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 700, fontSize: 56, color: c.texto }}>
                  {i + 1}
                </div>
              </FormaDaPeca>
            ) : null}
            {/* o balão do passo */}
            <div
              style={{
                position: "absolute",
                left: rBalao.x,
                top: rBalao.y,
                width: rBalao.w,
                height: rBalao.h,
                borderRadius: 30,
                border: `3px dashed ${cor.lapis}`,
                background: "rgba(255,255,255,0.42)",
                opacity: 1 - p,
              }}
            >
              <div style={{ position: "absolute", left: 30, top: (rBalao.h - 22 * 2.8) / 2 }}>
                <Barras largura={largTexto} linhas={2} />
              </div>
            </div>
            {p > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: rBalao.x,
                  top: rBalao.y,
                  width: rBalao.w,
                  height: rBalao.h,
                  borderRadius: 30,
                  background: cor.cartao,
                  boxShadow: sombra(i === atual ? 1 : 0.6),
                  opacity: Math.min(1, p * 2),
                  scale: String(0.97 + 0.03 * p),
                }}
              >
                <div style={{ position: "absolute", left: 0, top: 22, bottom: 22, width: 6, borderRadius: 3, background: c.forte, opacity: i === atual ? 1 : 0.35 }} />
                <div style={{ position: "absolute", left: 32, top: (rBalao.h - altT) / 2, width: largTexto }}>
                  <TextoFalado
                    linhas={linhas}
                    tempos={tempos}
                    t={t}
                    tamanho={tam}
                    modo="digita"
                    entrelinha={1.1}
                    cursor={{ cor: c.escura, ate: Math.min(fimDoItem(itens, i, m.ate), fimTexto + 0.5) }}
                    estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tinta }}
                  />
                  {encDet ? (
                    <div style={{ marginTop: 6 }}>
                      <TextoFalado linhas={encDet.linhas} tempos={temposDet} t={t} tamanho={encDet.tamanho} modo="foco" estilo={{ fontFamily: sans, fontWeight: 500, color: cor.tintaSuave }} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// ---------- comparacao ----------
const CORES_DOS_LADOS: Record<string, [number, number]> = {
  contra: [0, 2],
  "antes-depois": [2, 1],
  "errado-certo": [3, 1],
};
const vencedorDe = (m: Comparacao) => {
  if (m.vencedor !== undefined) return { lado: m.vencedor, em: m.vencedorEm ?? m.lados[m.vencedor].em + 0.6 };
  if (m.modo === "errado-certo") return { lado: 1 as const, em: m.vencedorEm ?? m.lados[1].em + 0.6 };
  return null;
};
export const sonsComparacao = (m: Comparacao): Som[] => {
  const v = vencedorDe(m);
  return [
    { em: m.lados[0].em + 0.15, arquivo: "sfx/encaixe-1.wav", volume: 0.34 },
    { em: m.lados[1].em + 0.15, arquivo: "sfx/encaixe-2.wav", volume: 0.34 },
    ...(v ? [{ em: v.em, arquivo: "sfx/pronto.wav", volume: 0.26 }] : []),
  ];
};

export const BlocoComparacao: React.FC<Props<Comparacao>> = ({ m, t, q, palavras }) => {
  const alto = q.lugar === "alto";
  // com a pessoa na janela larga do alto: cartões lado a lado; ao lado de uma janela de canto: um em cima do outro
  const empilhado = !alto;
  const cab = q.cabecalho;
  const corpo = q.corpo;
  const gap = 70;
  const wCartao = empilhado ? corpo.w : (corpo.w - gap) / 2;
  const largTexto = wCartao - 60;
  // título: embaixo da janela larga (alto) ou no cabeçalho ao lado da janela (canto)
  const encTitulo = m.titulo ? encaixar(m.titulo, { largura: cab.w, max: alto ? 68 : 72, min: 46, linhas: alto ? 2 : 3, fonte: { peso: 700 } }) : null;
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.lados[0].em, m.de + 0.15) : [];
  const altTitulo = encTitulo && alto ? alturaTexto(encTitulo, 1.04) + 28 : 0;
  const topoCartoes = corpo.y + altTitulo;
  const livre = corpo.y + corpo.h - topoCartoes;
  // os dois textos no mesmo corpo
  let tam = 72;
  for (; tam > 40; tam -= 2) {
    if (m.lados.every((l) => cabe(l.texto, largTexto, tam, empilhado ? 3 : 4, { peso: 700 }))) break;
  }
  const linhasDe = (l: (typeof m.lados)[number]) => quebrar(l.texto, largTexto, tam, { peso: 700 });
  const altConteudo = Math.max(...m.lados.map((l) => linhasDe(l).length)) * tam * 1.06;
  const altRotulos = Math.max(
    ...m.lados.map((l) =>
      larguraTexto(l.rotulo, 30, { mono: true, caixaAlta: true, espacamento: 0.06 }) + 56 <= wCartao - 60
        ? 56
        : Math.max(56, alturaTexto(encaixar(l.rotulo, { largura: wCartao - 60 - 50, max: 36, min: 30, linhas: 2, fonte: { peso: 600 } }), 1.08) + 18),
    ),
  );
  const conteudo = 34 + altRotulos + 30 + altConteudo + 44;
  const hCartao = empilhado ? Math.min((livre - gap) / 2, Math.max(330, conteudo)) : Math.min(livre, Math.max(380, conteudo));
  const yCartao = empilhado ? topoCartoes + (livre - (2 * hCartao + gap)) / 2 : topoCartoes + (livre - hCartao) / 2;
  const posicao = (k: number) => (empilhado ? { x: corpo.x, y: yCartao + k * (hCartao + gap) } : { x: corpo.x + k * (wCartao + gap), y: yCartao });
  const cores = CORES_DOS_LADOS[m.modo ?? "contra"] ?? [0, 2];
  const v = vencedorDe(m);
  const pV = v ? prog(t, v.em, 0.4) : 0;
  const pMeio = prog(t, m.de + 0.2, 0.3);
  return (
    <>
      {encTitulo ? (
        <div style={{ position: "absolute", left: cab.x, top: cab.y, width: cab.w, height: alto ? altTitulo : cab.h, display: "flex", alignItems: alto ? "flex-start" : "center" }}>
          <TextoFalado
            linhas={encTitulo.linhas}
            tempos={temposTitulo}
            t={t}
            tamanho={encTitulo.tamanho}
            modo="sobe"
            entrelinha={1.04}
            estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.015em" }}
          />
        </div>
      ) : null}
      {m.lados.map((l, k) => {
        const c = corDaPeca(cores[k]);
        const { x, y: yK } = posicao(k);
        const p = prog(t, l.em - 0.06, 0.3);
        const perde = v && v.lado !== k ? pV : 0;
        const ganha = v && v.lado === k ? pV : 0;
        const tempos = temposDoTexto(l.texto, palavras, l.em, k === 0 ? m.lados[1].em : m.ate, l.em + 0.05);
        const caixaAlta = larguraTexto(l.rotulo, 30, { mono: true, caixaAlta: true, espacamento: 0.06 }) + 56 <= wCartao - 60;
        const encRot = caixaAlta ? null : encaixar(l.rotulo, { largura: wCartao - 60 - 50, max: 36, min: 30, linhas: 2, fonte: { peso: 600 } });
        const rotuloLarg = caixaAlta
          ? larguraTexto(l.rotulo, 30, { mono: true, caixaAlta: true, espacamento: 0.06 }) + 56
          : Math.min(wCartao - 60, Math.max(...encRot!.linhas.map((li) => larguraTexto(li.join(" "), encRot!.tamanho, { peso: 600 }))) + 50);
        const rotuloAlt = caixaAlta ? 56 : Math.max(56, encRot!.linhas.length * encRot!.tamanho * 1.08 + 18);
        return (
          <div key={`lado-${k}`}>
            {/* a lápis */}
            <div style={{ position: "absolute", left: x, top: yK, width: wCartao, height: hCartao, borderRadius: 34, border: `3px dashed ${cor.lapis}`, background: "rgba(255,255,255,0.42)", opacity: 1 - p }}>
              <div style={{ position: "absolute", left: 30, top: 34, width: rotuloLarg, height: rotuloAlt, borderRadius: 18, background: cor.lapisClaro, opacity: 0.6 }} />
              <div style={{ position: "absolute", left: 30, top: 34 + rotuloAlt + 34 }}>
                <Barras largura={largTexto} linhas={3} altura={26} />
              </div>
            </div>
            {p > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: yK,
                  width: wCartao,
                  height: hCartao,
                  borderRadius: 34,
                  background: perde > 0.5 ? cor.cartaoFundo : cor.cartao,
                  boxShadow: sombra(1 - 0.7 * perde),
                  outline: ganha > 0 ? `${(5 * ganha).toFixed(1)}px solid ${c.forte}` : perde > 0 ? `3px dashed rgba(156,163,173,${perde})` : undefined,
                  outlineOffset: ganha > 0 ? 0 : -3,
                  opacity: Math.min(1, p * 2),
                  translate: `0 ${(1 - p) * 26}px`,
                }}
              >
                <FormaDaPeca
                  r={{ x: 30, y: 34, w: rotuloLarg, h: rotuloAlt }}
                  preenchimento={perde > 0.5 ? cor.lapisClaro : c.forte}
                  lateral
                  raio={16}
                  encaixe={false}
                  comDente={k === 0}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      paddingLeft: 22,
                      fontFamily: caixaAlta ? mono : sans,
                      fontWeight: 600,
                      fontSize: caixaAlta ? 30 : encRot!.tamanho,
                      lineHeight: 1.08,
                      letterSpacing: caixaAlta ? "0.06em" : undefined,
                      textTransform: caixaAlta ? "uppercase" : undefined,
                      color: perde > 0.5 ? cor.tintaSuave : c.texto,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {caixaAlta ? l.rotulo : encRot!.linhas.map((li, n) => <div key={n}>{li.join(" ")}</div>)}
                  </div>
                </FormaDaPeca>
                <div style={{ position: "absolute", left: 30, top: 34 + rotuloAlt + 30, width: largTexto, filter: perde > 0 ? `blur(${(1.6 * perde).toFixed(2)}px)` : undefined }}>
                  <TextoFalado
                    linhas={linhasDe(l)}
                    tempos={tempos}
                    t={t}
                    tamanho={tam}
                    modo="foco"
                    entrelinha={1.06}
                    estilo={{ fontFamily: sans, fontWeight: 700, color: perde > 0.5 ? cor.borrado : cor.tinta, letterSpacing: "-0.012em" }}
                  />
                </div>
                {ganha > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      right: -20,
                      top: -20,
                      width: 76,
                      height: 76,
                      borderRadius: 38,
                      background: c.forte,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      scale: String(0.7 + 0.3 * ganha),
                      opacity: ganha,
                      boxShadow: sombra(0.6),
                    }}
                  >
                    <Icone nome="check" tamanho={46} cor={c.texto} espessura={5} p={prog(t, v!.em + 0.1, 0.35)} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {/* o sinal entre os cartões */}
      <div
        style={{
          position: "absolute",
          left: empilhado ? corpo.x + corpo.w / 2 - 32 : corpo.x + wCartao + gap / 2 - 32,
          top: empilhado ? yCartao + hCartao + gap / 2 - 32 : yCartao + hCartao / 2 - 32,
          rotate: empilhado ? "90deg" : undefined,
          width: 64,
          height: 64,
          borderRadius: 32,
          background: cor.tinta,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: pMeio,
          scale: String(0.8 + 0.2 * pMeio),
        }}
      >
        <Icone nome={m.modo === "antes-depois" || m.modo === "errado-certo" ? "seta" : "x"} tamanho={36} cor="#FFFFFF" espessura={4.6} />
      </div>
    </>
  );
};

// ---------- grafico ----------
const casasDe = (v: number) => (Number.isInteger(v) ? 0 : Math.min(2, `${v}`.split(".")[1]?.length ?? 1));
const comUnidade = (v: string, u?: string) => (!u ? v : /^[%°]/.test(u) ? `${v}${u}` : /^(R\$|US\$|€|\$)/.test(u) ? `${u} ${v}` : `${v} ${u}`);
const PERFIL: Record<string, number[]> = {
  sobe: [0.22, 0.3, 0.42, 0.5, 0.68, 0.88],
  cai: [0.9, 0.74, 0.62, 0.46, 0.36, 0.22],
  oscila: [0.42, 0.74, 0.38, 0.82, 0.5, 0.7],
};
const temposDosPassos = (de: number, ate: number, n: number) => Array.from({ length: n }, (_, i) => de + 0.35 + (i * Math.max(0.3, ate - de - 1.1)) / Math.max(1, n - 1));

export const sonsGrafico = (m: Grafico): Som[] => {
  if (m.dados?.length) return m.dados.slice(0, 6).map((d, i) => ({ em: d.em + 0.12, arquivo: `sfx/encaixe-${Math.min(i, 3) + 1}.wav`, volume: 0.32 }));
  return [{ em: m.tendenciaEm ?? m.de + 0.4, arquivo: "sfx/pronto.wav", volume: 0.24 }];
};

export const BlocoGrafico: React.FC<Props<Grafico>> = ({ m, t, q, palavras }) => {
  const cab = q.cabecalho;
  const corpo = q.corpo;
  const dados = (m.dados ?? []).slice(0, 6);
  const temDados = dados.length >= 2;
  const ilustrativo = m.ilustrativo || !temDados;
  const tendencia = m.tendencia ?? "sobe";
  const corTend = tendencia === "cai" ? corDaPeca(3) : tendencia === "sobe" ? corDaPeca(1) : corDaPeca(2);
  const tendEm = m.tendenciaEm ?? m.de + 0.4;
  // cabeçalho: título (ou o último número dito, ou a seta da tendência)
  const encTitulo = m.titulo ? encaixar(m.titulo, { largura: cab.w, max: 72, min: 44, linhas: 3, fonte: { peso: 700 } }) : null;
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, temDados ? dados[0].em : m.ate, m.de + 0.15) : [];
  // a área do gráfico dentro do cartão
  const cW = corpo.w;
  const cH = corpo.h;
  const area = { x: 44, y: 120, w: cW - 88, h: cH - 120 - 34 };
  const pCartao = prog(t, m.de + 0.25, 0.42);
  const seta = tendencia === "cai" ? "cai" : "sobe";

  const desenho = (() => {
    if (temDados && m.forma === "linha") {
      const valores = dados.map((d) => d.valor);
      const min = Math.min(...valores);
      const max = Math.max(...valores);
      const yDe = (v: number) => (max === min ? area.h * 0.45 : 90 + (1 - (v - min) / (max - min)) * (area.h - 90 - 130));
      const xDe = (i: number) => (area.w * (i + 0.5)) / dados.length;
      const pts = dados.map((d, i) => ({ x: xDe(i), y: yDe(d.valor) }));
      let caminho = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const p = prog(t, dados[i].em - 0.1, 0.45, chega);
        if (p <= 0) break;
        const x = mistura(pts[i - 1].x, pts[i].x, p);
        const y = mistura(pts[i - 1].y, pts[i].y, p);
        caminho += ` L ${x} ${y}`;
      }
      const largRot = area.w / dados.length - 12;
      return (
        <svg width={area.w} height={area.h} style={{ position: "absolute", left: area.x, top: area.y, overflow: "visible" }}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={area.w} y1={90 + f * (area.h - 220)} y2={90 + f * (area.h - 220)} stroke={cor.linha} strokeWidth={2} strokeDasharray="10 10" />
          ))}
          <line x1={0} x2={area.w} y1={area.h - 120} y2={area.h - 120} stroke={cor.lapisClaro} strokeWidth={4} />
          <path d={caminho} fill="none" stroke={cor.tinta} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((pt, i) => {
            const p = prog(t, dados[i].em - 0.05, 0.3);
            const c = corDaPeca(i);
            const enc = encaixar(dados[i].rotulo, { largura: largRot, max: 36, min: 28, linhas: 2, fonte: { peso: 600 } });
            const valor = comUnidade(formatarNumero(dados[i].valor * prog(t, dados[i].em, 0.6, chega), casasDe(dados[i].valor)), m.unidade);
            return (
              <g key={`pt-${i}`} opacity={p}>
                <circle cx={pt.x} cy={pt.y} r={17} fill={c.forte} stroke="#FFFFFF" strokeWidth={6} />
                <foreignObject x={pt.x - 150} y={pt.y - 78} width={300} height={60}>
                  <div style={{ textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 38, color: c.escura, whiteSpace: "nowrap" }}>{valor}</div>
                </foreignObject>
                <foreignObject x={pt.x - largRot / 2} y={area.h - 104} width={largRot} height={100}>
                  <div style={{ textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.08, color: cor.tinta }}>
                    {enc.linhas.map((l, k) => (
                      <div key={k}>{l.join(" ")}</div>
                    ))}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      );
    }
    if (temDados && m.forma === "pizza") {
      // o todo como uma fila de peças proporcional, com a legenda embaixo
      const soma = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
      const hFila = 130;
      let x = 0;
      const segs = dados.map((d) => {
        const w = (Math.max(0, d.valor) / soma) * area.w;
        const s = { x, w };
        x += w;
        return s;
      });
      const yLeg = hFila + 50;
      const altLeg = Math.min(70, (area.h - yLeg) / dados.length);
      return (
        <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h }}>
          <FormaDaPeca r={{ x: 0, y: 0, w: area.w, h: hFila }} preenchimento="rgba(242,243,245,0.9)" traco={cor.lapis} tracejado lateral raio={20} encaixe={false} comDente={false} />
          {dados.map((d, i) => {
            const c = corDaPeca(i);
            const p = prog(t, d.em - 0.08, 0.34);
            const s = segs[i];
            const valor = comUnidade(formatarNumero(d.valor, casasDe(d.valor)), m.unidade);
            const cabe = larguraTexto(valor, 40, { mono: true }) + 40 < s.w;
            return (
              <div key={`seg-${i}`}>
                {p > 0 ? (
                  <FormaDaPeca r={{ x: s.x - (1 - p) * 50, y: 0, w: s.w + 0.5, h: hFila }} preenchimento={c.forte} lateral raio={20} encaixe={i > 0} comDente={i < dados.length - 1} opacidade={Math.min(1, p * 3)}>
                    {cabe ? (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontWeight: 700, fontSize: 40, color: c.texto }}>{valor}</div>
                    ) : null}
                  </FormaDaPeca>
                ) : null}
                <div style={{ position: "absolute", left: 0, top: yLeg + i * altLeg, width: area.w, height: altLeg, display: "flex", alignItems: "center", gap: 18, opacity: prog(t, d.em - 0.05, 0.3) }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: c.forte, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontFamily: sans, fontWeight: 600, fontSize: 40, color: cor.tinta, whiteSpace: "nowrap", overflow: "hidden" }}>{d.rotulo}</div>
                  <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 40, color: c.escura }}>{valor}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    // barras: com números ditos (proporcionais) ou, sem números, a forma da tendência
    const barras = temDados
      ? dados.map((d, i) => ({ rotulo: d.rotulo, valor: d.valor, em: d.em, c: corDaPeca(i) }))
      : PERFIL[tendencia].map((v, i, arr) => ({ rotulo: "", valor: v, em: temposDosPassos(m.de, m.ate, arr.length)[i], c: i === arr.length - 1 ? corTend : corDaPeca(0) }));
    if (!temDados && m.forma === "linha") {
      // a linha da tendência se desenha durante o momento inteiro; um ponto anda na ponta
      const perfil = PERFIL[tendencia];
      const pts = perfil.map((v, i) => ({ x: (area.w * i) / (perfil.length - 1), y: 40 + (1 - v) * (area.h - 80) }));
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const mx = (a.x + b.x) / 2;
        d += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
      }
      const p = prog(t, m.de + 0.35, Math.max(0.8, m.ate - m.de - 0.8), (x) => x);
      const k = p * (pts.length - 1);
      const i0 = Math.min(pts.length - 2, Math.floor(k));
      const f = k - i0;
      // ponto na ponta (aproximado pela curva entre os dois pontos)
      const a = pts[i0];
      const b = pts[i0 + 1];
      const ease = f * f * (3 - 2 * f);
      const ponta = { x: mistura(a.x, b.x, f), y: mistura(a.y, b.y, ease) };
      return (
        <svg width={area.w} height={area.h} style={{ position: "absolute", left: area.x, top: area.y, overflow: "visible" }}>
          {[0.2, 0.45, 0.7, 0.95].map((g) => (
            <line key={g} x1={0} x2={area.w} y1={g * area.h} y2={g * area.h} stroke={cor.linha} strokeWidth={2} strokeDasharray="10 10" />
          ))}
          {/* a curva inteira a lápis, esperando ser desenhada */}
          <path d={d} fill="none" stroke={cor.lapisClaro} strokeWidth={6} strokeLinecap="round" strokeDasharray="14 14" />
          <path d={`${d} L ${area.w} ${area.h} L 0 ${area.h} Z`} fill={corTend.clara} opacity={0.7} style={{ clipPath: `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)` }} />
          <path d={d} fill="none" stroke={cor.tinta} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${Math.max(0.001, p)} 1`} />
          <circle cx={ponta.x} cy={ponta.y} r={18} fill={corTend.forte} stroke="#FFFFFF" strokeWidth={6} />
        </svg>
      );
    }
    const n = barras.length;
    const max = Math.max(...barras.map((b) => b.valor), 0.0001);
    const slot = area.w / n;
    const wBarra = Math.min(150, slot * 0.64);
    const baseY = area.h - (temDados ? 110 : 24);
    const altMax = baseY - (temDados ? 70 : 20);
    return (
      <div style={{ position: "absolute", left: area.x, top: area.y, width: area.w, height: area.h }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: baseY, height: 4, borderRadius: 2, background: cor.lapisClaro }} />
        {barras.map((b, i) => {
          const p = prog(t, b.em - 0.05, 0.5, chega);
          const hFinal = Math.max(24, (b.valor / max) * altMax);
          const h = hFinal * p;
          const x = slot * i + (slot - wBarra) / 2;
          const enc = temDados ? encaixar(b.rotulo, { largura: slot - 12, max: 36, min: 28, linhas: 2, fonte: { peso: 600 } }) : null;
          const valor = temDados ? comUnidade(formatarNumero(b.valor * prog(t, b.em, 0.6, chega), casasDe(b.valor)), m.unidade) : "";
          return (
            <div key={`b-${i}`}>
              {/* a vaga a lápis da barra */}
              <div style={{ position: "absolute", left: x, top: baseY - hFinal, width: wBarra, height: hFinal, borderRadius: 18, border: `3px dashed ${cor.lapisClaro}`, opacity: 1 - prog(t, b.em - 0.05, 0.2) }} />
              {h > 1 ? (
                <FormaDaPeca r={{ x, y: baseY - h, w: wBarra, h }} preenchimento={b.c.forte} raio={16} comDente={false} encaixe={h > 40} sombra={0.6} />
              ) : null}
              {temDados ? (
                <div style={{ position: "absolute", left: slot * i, width: slot, top: baseY - h - 58, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 38, color: b.c.escura, opacity: p, whiteSpace: "nowrap" }}>{valor}</div>
              ) : null}
              {enc ? (
                <div style={{ position: "absolute", left: slot * i + 6, width: slot - 12, top: baseY + 16, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.08, color: cor.tinta, opacity: prog(t, b.em - 0.05, 0.3) }}>
                  {enc.linhas.map((l, k) => (
                    <div key={k}>{l.join(" ")}</div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  })();

  const pSeta = prog(t, tendEm, 0.35);
  // sem título: o último número dito (barras, linha) ou a maior parte (pizza)
  const ultimo = !temDados ? null : m.forma === "pizza" ? dados.reduce((a, b) => (b.valor > a.valor ? b : a)) : dados[dados.length - 1];
  const kUltimo = ultimo ? dados.indexOf(ultimo) : 0;
  const grande = !m.titulo && ultimo ? comUnidade(formatarNumero(ultimo.valor * prog(t, ultimo.em, 0.6, chega), casasDe(ultimo.valor)), m.unidade) : null;
  return (
    <>
      <Cabecalho
        r={cab}
        t={t}
        de={m.de}
        rotulos={m.unidade && m.unidade.length >= 3 ? [{ texto: m.unidade, em: m.de }] : undefined}
        titulo={encTitulo ? { enc: encTitulo, tempos: temposTitulo } : undefined}
        extra={
          !temDados && m.titulo ? (
            <div style={{ width: 64, height: 56, borderRadius: 18, background: corTend.forte, display: "flex", alignItems: "center", justifyContent: "center", opacity: pSeta, scale: String(0.8 + 0.2 * pSeta) }}>
              <Icone nome={seta} tamanho={40} cor={corTend.texto} espessura={4.6} p={prog(t, tendEm + 0.05, 0.4)} />
            </div>
          ) : null
        }
      />
      {/* sem título e sem números: a seta da tendência, grande, no cabeçalho */}
      {!temDados && !m.titulo ? (
        <div style={{ position: "absolute", left: cab.x, top: cab.y, width: cab.w, height: cab.h, display: "flex", alignItems: "center" }}>
          <div style={{ position: "relative", width: 168, height: 144 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: `4px dashed ${cor.lapis}`, opacity: 1 - pSeta }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: corTend.forte, display: "flex", alignItems: "center", justifyContent: "center", opacity: pSeta, scale: String(0.85 + 0.15 * pSeta), boxShadow: sombra(0.6) }}>
              <Icone nome={seta} tamanho={104} cor={corTend.texto} espessura={4.4} p={prog(t, tendEm + 0.05, 0.45)} />
            </div>
          </div>
        </div>
      ) : null}
      {grande ? (
        <div style={{ position: "absolute", left: cab.x, top: cab.y + 64, width: cab.w, height: cab.h - 64, display: "flex", alignItems: "center", fontFamily: mono, fontWeight: 700, fontSize: Math.min(96, (cab.w / Math.max(4, grande.length)) * 1.6), color: corDaPeca(kUltimo).escura, whiteSpace: "nowrap", opacity: prog(t, ultimo!.em - 0.05, 0.3) }}>
          {grande}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: corpo.x, top: corpo.y, width: cW, height: cH, borderRadius: 36, background: cor.cartao, boxShadow: sombra(1), overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 30, right: 30, top: 26, display: "flex", alignItems: "center", gap: 14 }}>
          <AvatarIA tamanho={52} />
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 38, color: cor.tinta }}>Assistente</div>
          <div style={{ flex: 1 }} />
          {ilustrativo ? (
            <div
              style={{
                height: 46,
                padding: "0 14px",
                borderRadius: 12,
                border: `3px dashed ${cor.lapis}`,
                display: "flex",
                alignItems: "center",
                fontFamily: mono,
                fontWeight: 600,
                fontSize: 30,
                letterSpacing: "0.06em",
                color: cor.tintaSuave,
                textTransform: "uppercase",
              }}
            >
              ilustrativo
            </div>
          ) : null}
        </div>
        <Foco t={t} em={m.de + 0.25}>
          <div style={{ position: "absolute", left: 0, top: 0, width: cW, height: cH, opacity: 0.5 + 0.5 * pCartao }}>{desenho}</div>
        </Foco>
      </div>
    </>
  );
};
