// Os blocos universais (motor/BLOCOS.md) na linguagem do Rótulo. Tudo é impresso na mesma ficha de
// papel do peito/pé do rótulo, nasce "a lápis" e ganha tinta na palavra em que é dito. As peças são as
// da assinatura: linhas-guia pontilhadas, losangos, números em círculo vinho, filetes duplos, a régua,
// o medidor, o carimbo e o lacre. Cada componente desenha numa caixa w×h a partir do CABECALHO.
import { firme, indicesDoDestaque, misturaCor, misturaHex, mistura, numeroBR, prog, temposDoTexto, tracado } from "../anim";
import type { Fonte, Medidor } from "../medida";
import type { Comparacao, Definicao, Destaque, Frase, Grafico, Item, MedidorMomento, Numero, Passos, Pergunta, Topicos } from "../plano";
import { caixaAlta, cor, display, LIQUIDOS, numerosAlinhados, texto } from "../tema";
import { encaixar, larguraDaLinha } from "../texto";
import { Mostrador, Taca } from "./Desenhos";
import { CABECALHO, Cabecalho, Linhas, MARGEM, type Props } from "./Fichas";

// a área útil da ficha, abaixo do cabeçalho
const corpo = (h: number) => ({ topo: CABECALHO + 6, base: h - 26 });
const losango = (x: number, y: number, r: number) => `M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z`;
const ALTURA = 1.12;

// Etiqueta "ilustrativo": um selinho em caixa alta, para números e formas que não foram ditos
const Ilustrativo: React.FC<{ x: number; y: number; t: number; em: number; direita?: boolean; w: number }> = ({ x, y, t, em, direita, w }) => {
  const p = prog(t, em, 0.4);
  const c = misturaCor(cor.lapis, cor.tintaSuave, p);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        ...(direita ? { right: w - x } : { left: x }),
        ...caixaAlta(30, 0.16),
        color: c,
        border: `2px solid ${c}`,
        padding: "5px 12px 3px",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      Ilustrativo
    </div>
  );
};

// ---------- listas: tópicos (losangos e linhas-guia) e passos (números ligados por um traço) ----------

type Montada = { linhas: string[]; tam: number; det: { texto: string; tam: number; inline: boolean } | null; alt: number; it: Item; ok: boolean };

const montarColuna = (itens: Item[], larg: number, tam: number, maxLinhas: number, comDetalhe: boolean, medir: Medidor): Montada[] => {
  const f: Fonte = { familia: texto, tamanho: tam };
  return itens.map((it) => {
    const r = encaixar(it.texto, larg, medir, { familia: texto }, tam, tam, maxLinhas);
    let ok = r.linhas.length <= maxLinhas && r.linhas.every((l) => larguraDaLinha(l, medir, f) <= larg);
    let det: Montada["det"] = null;
    let alt = r.linhas.length * tam * ALTURA;
    if (comDetalhe && it.detalhe?.trim()) {
      const td = Math.max(36, Math.round(tam * 0.8));
      const fd: Fonte = { familia: texto, tamanho: td, italico: true };
      const wUlt = larguraDaLinha(r.linhas[r.linhas.length - 1] ?? "", medir, f);
      const wDet = larguraDaLinha(it.detalhe, medir, fd);
      if (wUlt + 90 + wDet <= larg) det = { texto: it.detalhe, tam: td, inline: true };
      else if (wDet <= larg) {
        det = { texto: it.detalhe, tam: td, inline: false };
        alt += td * 1.2;
      } else ok = false;
    }
    return { linhas: r.linhas, tam, det, alt, it, ok };
  });
};

const montarLista = (itens: Item[], larg: number, altura: number, medir: Medidor, recuo: number) => {
  const n = itens.length;
  const tenta = (cols: number, tam: number, comDetalhe: boolean) => {
    const porColuna = Math.ceil(n / cols);
    const largCol = (larg - (cols - 1) * 48) / cols - recuo;
    const gap = Math.round(tam * (n >= 5 ? 0.24 : 0.36));
    const colunas = Array.from({ length: cols }, (_, c) => itens.slice(c * porColuna, (c + 1) * porColuna));
    const montadas = colunas.map((its) => montarColuna(its, largCol, tam, cols === 1 && n >= 4 ? 1 : 2, comDetalhe, medir));
    const alturas = montadas.map((col) => col.reduce((s, r) => s + r.alt, 0) + gap * Math.max(0, col.length - 1));
    const ok = montadas.every((col) => col.every((r) => r.ok)) && Math.max(...alturas) <= altura;
    // sobra altura: os itens se espalham um pouco (até ~0,9 do corpo do texto entre eles)
    const maisAlta = montadas.reduce((k, col, c) => (alturas[c] > alturas[k] ? c : k), 0);
    const itensDaMaisAlta = montadas[maisAlta].length;
    const folga = itensDaMaisAlta > 1 ? Math.min(tam * 0.9, gap + (altura - alturas[maisAlta]) / (itensDaMaisAlta - 1)) : gap;
    const gapFinal = ok ? Math.max(gap, folga) : gap;
    const alturasFinais = montadas.map((col) => col.reduce((s, r) => s + r.alt, 0) + gapFinal * Math.max(0, col.length - 1));
    return { ok, cols, largCol, gap: gapFinal, montadas, alturas: alturasFinais, tam, porColuna };
  };
  for (const comDetalhe of [true, false]) {
    for (let tam = 60; tam >= 44; tam -= 2) {
      const r = tenta(1, tam, comDetalhe);
      if (r.ok) return r;
    }
  }
  for (let tam = 52; tam >= 40; tam -= 2) {
    const r = tenta(2, tam, false);
    if (r.ok) return r;
  }
  return tenta(n >= 4 ? 2 : 1, 40, false);
};

const Lista: React.FC<Props<Topicos | Passos> & { numerada: boolean }> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo, numerada }) => {
  const { topo, base } = corpo(h);
  const itens = m.itens.slice(0, 5);
  const recuo = numerada ? 78 : 52;
  const L = montarLista(itens, w - 2 * MARGEM, base - topo - 8, medir, recuo);
  const y0 = topo + 4 + (base - topo - 8 - Math.max(...L.alturas)) / 2;
  // o item da vez: o último já dito
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.05 ? i : k), -1);
  const pecas: React.ReactNode[] = [];
  const tracos: React.ReactNode[] = [];
  L.montadas.forEach((col, c) => {
    const x0 = MARGEM + c * (L.largCol + recuo + 48);
    let y = y0;
    const centros: { y: number; em: number; raio: number }[] = [];
    col.forEach((r, k) => {
      const i = c * L.porColuna + k;
      const it = r.it;
      const dito = prog(t, it.em - 0.05, 0.3);
      const daVez = i === atual;
      const yMeio = y + r.tam * ALTURA * 0.5;
      centros.push({ y: yMeio, em: it.em, raio: Math.min(28, r.tam * 0.48) });
      const xTexto = x0 + recuo;
      // marcador
      if (numerada) {
        const raio = Math.min(28, r.tam * 0.48) + (daVez ? 3 : 0) * dito;
        pecas.push(
          <svg key={`n${i}`} width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <circle cx={x0 + 30} cy={yMeio} r={raio} fill={dito > 0 ? misturaCor(cor.papel, cor.vinho, dito) : cor.papel} stroke={misturaCor(cor.lapis, cor.vinho, dito)} strokeWidth={3} strokeDasharray={dito > 0 ? undefined : "5 6"} />
            <text x={x0 + 30} y={yMeio + Math.min(28, r.tam * 0.48) * 0.42} textAnchor="middle" fontFamily={display} fontSize={Math.min(28, r.tam * 0.48) * 1.25} fill={dito > 0.5 ? cor.papel : cor.lapis} style={numerosAlinhados}>
              {i + 1}
            </text>
          </svg>,
        );
      } else {
        const raio = (daVez ? 14 : 11) * (0.7 + 0.3 * dito);
        pecas.push(
          <svg key={`l${i}`} width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={losango(x0 + 16, yMeio, 12)} fill="none" stroke={cor.lapis} strokeWidth={2.5} opacity={1 - dito} />
            {dito > 0 ? <path d={losango(x0 + 16, yMeio, raio)} fill={cor.vinho} opacity={dito} /> : null}
          </svg>,
        );
      }
      // o texto do item
      pecas.push(
        <div key={`t${i}`} style={{ position: "absolute", left: xTexto, top: y }}>
          <Linhas linhas={r.linhas} palavras={plano.palavras} de={it.em - 0.05} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: r.tam, color: cor.tinta }} />
        </div>,
      );
      // linha-guia pontilhada até a margem (ou até o detalhe, alinhado à direita)
      const ultima = r.linhas[r.linhas.length - 1] ?? "";
      const yUltima = y + (r.linhas.length - 1) * r.tam * ALTURA;
      const fimTexto = xTexto + larguraDaLinha(ultima, medir, { familia: texto, tamanho: r.tam }) + 18;
      const wDet = r.det ? larguraDaLinha(r.det.texto, medir, { familia: texto, tamanho: r.det.tam, italico: true }) : 0;
      const fimGuia = r.det?.inline ? xTexto + L.largCol - wDet - 18 : xTexto + L.largCol - 4;
      const yGuia = yUltima + r.tam * 0.8;
      if ((!numerada || r.det?.inline) && fimGuia - fimTexto > 50) {
        const pG = prog(t, it.em + 0.1, 0.55);
        const corG = daVez ? cor.vinho : cor.tintaSuave;
        tracos.push(
          <g key={`g${i}`}>
            <line x1={fimTexto} x2={fimGuia} y1={yGuia} y2={yGuia} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" />
            {pG > 0 ? <line x1={fimTexto} x2={mistura(fimTexto, fimGuia, pG)} y1={yGuia} y2={yGuia} stroke={corG} strokeWidth={3.4} strokeDasharray="2 11" strokeLinecap="round" /> : null}
            {!r.det?.inline ? <circle cx={fimGuia + 2} cy={yGuia} r={6} fill={pG >= 1 ? corG : cor.lapis} /> : null}
          </g>,
        );
      }
      if (r.det) {
        const yDet = r.det.inline ? yUltima + (r.tam - r.det.tam) * 0.62 : y + r.linhas.length * r.tam * ALTURA + 2;
        const xDet = r.det.inline ? xTexto + L.largCol - wDet : xTexto;
        pecas.push(
          <div key={`d${i}`} style={{ position: "absolute", left: xDet, top: yDet }}>
            <Linhas linhas={[r.det.texto]} palavras={plano.palavras} de={it.em} ate={(itens[i + 1]?.em ?? m.ate) + 0.2} t={t} alturaDaLinha={1.12} estilo={{ fontFamily: texto, fontSize: r.det.tam, fontStyle: "italic", color: cor.tintaSuave }} />
          </div>,
        );
      }
      y += r.alt + L.gap;
    });
    // passos: o traço que liga um número ao próximo chega quando o próximo é dito
    if (numerada) {
      centros.slice(1).forEach((b, k) => {
        const a = centros[k];
        const p = prog(t, b.em - 0.4, 0.5, firme);
        const y1 = a.y + a.raio + 7;
        const y2 = b.y - b.raio - 7;
        if (y2 - y1 < 6) return;
        tracos.push(
          <g key={`c${c}-${k}`}>
            <line x1={x0 + 30} x2={x0 + 30} y1={y1} y2={y2} stroke={cor.lapis} strokeWidth={3} strokeDasharray="4 7" />
            {p > 0 ? <line x1={x0 + 30} x2={x0 + 30} y1={y1} y2={mistura(y1, y2, p)} stroke={cor.vinho} strokeWidth={4} strokeLinecap="round" /> : null}
          </g>,
        );
      });
    }
  });
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {tracos}
      </svg>
      {pecas}
    </>
  );
};

export const FichaTopicos: React.FC<Props<Topicos>> = (p) => <Lista {...p} numerada={false} />;
export const FichaPassos: React.FC<Props<Passos>> = (p) => <Lista {...p} numerada />;

// ---------- número: conta até o valor; a régua de medida enche junto ----------

export const FichaNumero: React.FC<Props<Numero>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const final = numeroBR(m.valor, casas);
  const pConta = prog(t, m.em, 1.1, (x) => 1 - (1 - x) * (1 - x) * (1 - x));
  const mostrado = pConta > 0 && pConta < 1 ? numeroBR(m.valor * pConta, casas) : final;
  const tinta = prog(t, m.em, 0.25);
  const pre = m.prefixo?.trim();
  const suf = m.sufixo?.trim();
  const larguraDe = (tam: number) =>
    medir(final, { familia: display, tamanho: tam }) * 1.04 +
    (pre ? medir(pre, { familia: display, tamanho: tam * 0.56 }) + 14 : 0) +
    (suf ? medir(suf, { familia: display, tamanho: tam * 0.56 }) + 14 : 0);
  let tam = 156;
  while (tam > 96 && larguraDe(tam) > w - 2 * MARGEM) tam -= 4;
  // o rótulo ao lado do número, se couber grande; senão, embaixo (e o número um pouco menor)
  const livre = w - 2 * MARGEM - larguraDe(tam) - 44;
  const aoLadoR = livre >= 300 ? encaixar(m.rotulo, livre, medir, { familia: texto, italico: true }, 54, 40, 3) : null;
  const aoLado = !!aoLadoR && aoLadoR.tamanho >= 46;
  if (!aoLado) tam = Math.min(tam, 128);
  const wNum = larguraDe(tam);
  const rot = aoLado && aoLadoR ? aoLadoR : encaixar(m.rotulo, w - 2 * MARGEM, medir, { familia: texto, italico: true }, 54, 40, 2);
  const alturaRot = rot.linhas.length * rot.tamanho * ALTURA;
  const yNum = topo + 2;
  const yRot = aoLado ? yNum + tam * 0.55 - alturaRot / 2 : yNum + tam * 1.0 + 4;
  const rotEm = m.rotuloEm ?? m.de;
  const reguaY = base - 30;
  const temRegua = (aoLado ? yNum + tam : yRot + alturaRot) < reguaY - 40;
  const x0 = MARGEM + 10;
  const x1 = w - MARGEM - 10;
  const pRegua = prog(t, m.de + 0.2, 0.6);
  const xMarca = mistura(x0, x1, pConta);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: yNum, fontFamily: display, fontSize: tam, lineHeight: 1, display: "flex", alignItems: "baseline", whiteSpace: "nowrap", ...numerosAlinhados }}>
        {pre ? <span style={{ fontSize: tam * 0.56, marginRight: 14, color: misturaCor(cor.lapis, cor.vinho, tinta) }}>{pre}</span> : null}
        <span style={{ color: misturaCor(cor.lapis, cor.tinta, tinta) }}>{mostrado}</span>
        {suf ? <span style={{ fontSize: tam * 0.56, marginLeft: 14, color: misturaCor(cor.lapis, cor.vinho, tinta) }}>{suf}</span> : null}
      </div>
      <div style={{ position: "absolute", left: aoLado ? MARGEM + wNum + 44 : MARGEM, top: yRot }}>
        <Linhas linhas={rot.linhas} palavras={plano.palavras} de={rotEm - 0.05} ate={m.ate} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: rot.tamanho, fontStyle: "italic", color: cor.tinta }} />
      </div>
      {temRegua ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <line x1={x0} x2={x1} y1={reguaY} y2={reguaY} stroke={misturaCor(cor.lapis, cor.tinta, pRegua)} strokeWidth={3.5} />
          {Array.from({ length: 21 }, (_, i) => {
            const x = mistura(x0, x1, i / 20);
            const alto = i % 5 === 0 ? 16 : 9;
            return <line key={i} x1={x} x2={x} y1={reguaY - alto} y2={reguaY + alto} stroke={misturaCor(cor.lapis, cor.tinta, pRegua)} strokeWidth={i % 5 === 0 ? 3 : 2} />;
          })}
          {pConta > 0 ? (
            <g>
              <line x1={x0} x2={xMarca} y1={reguaY} y2={reguaY} stroke={cor.vinho} strokeWidth={7} strokeLinecap="round" />
              <path d={losango(xMarca, reguaY, 13)} fill={cor.vinho} />
            </g>
          ) : null}
        </svg>
      ) : null}
      {m.ilustrativo ? (
        // a etiqueta vai no canto livre: ao lado do número (rótulo embaixo) ou acima da régua (rótulo ao lado)
        <Ilustrativo x={w - MARGEM} y={!aoLado && MARGEM + wNum + 240 < w - MARGEM ? yNum + 8 : temRegua ? reguaY - 76 : base - 44} t={t} em={m.em} direita w={w} />
      ) : null}
    </>
  );
};

// ---------- comparação: duas colunas separadas por filete duplo; o vencedor ganha o grifo ----------

export const FichaComparacao: React.FC<Props<Comparacao>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const meio = w / 2;
  const colW = (w - 2 * MARGEM - 96) / 2;
  const xs = [MARGEM, meio + 48];
  const modo = m.modo ?? "contra";
  const venc = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vEm = m.vencedorEm ?? (venc !== undefined && modo === "errado-certo" ? m.lados[1].em + 0.7 : undefined);
  const pV = venc !== undefined && vEm !== undefined ? prog(t, vEm, 0.5) : 0;
  // os dois lados no mesmo tamanho
  let tam = 72;
  const quebra = (s: string, tm: number) => encaixar(s, colW, medir, { familia: texto }, tm, tm, 4);
  const fRotulo = (tm: number): Fonte => ({ familia: texto, tamanho: tm, caixaAlta: true, espaco: 0.14 });
  const rotulos = m.lados.map((l) => encaixar(l.rotulo, colW, medir, fRotulo(34), 34, 30, 2));
  const altRotulo = Math.max(...rotulos.map((r) => r.linhas.length)) * 38 + 14;
  const cabe = (tm: number) =>
    m.lados.every((l) => {
      const q = quebra(l.texto, tm);
      return q.linhas.length <= 4 && q.linhas.every((x) => larguraDaLinha(x, medir, { familia: texto, tamanho: tm }) <= colW);
    }) && Math.max(...m.lados.map((l) => quebra(l.texto, tm).linhas.length)) * tm * ALTURA + altRotulo <= base - topo - 8;
  while (tam > 40 && !cabe(tam)) tam -= 2;
  const lados = m.lados.map((l) => ({ l, linhas: quebra(l.texto, tam).linhas }));
  const maxLinhas = Math.max(...lados.map((x) => x.linhas.length));
  const alturaBloco = altRotulo + maxLinhas * tam * ALTURA;
  const yR = topo + Math.max(6, (base - topo - alturaBloco) / 2);
  const yT = yR + altRotulo;
  const pDiv = prog(t, m.de + 0.15, 0.6, firme);
  const yMeio = (topo + base) / 2;
  const pSeta = prog(t, m.lados[1].em - 0.2, 0.45);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* filete duplo vertical com o losango no meio */}
        <line x1={meio - 4} x2={meio - 4} y1={yMeio - (yMeio - topo - 8) * pDiv} y2={yMeio + (base - yMeio - 8) * pDiv} stroke={cor.tinta} strokeWidth={2.5} />
        <line x1={meio + 4} x2={meio + 4} y1={yMeio - (yMeio - topo - 8) * pDiv} y2={yMeio + (base - yMeio - 8) * pDiv} stroke={cor.vinho} strokeWidth={2} />
        <path d={losango(meio, yMeio, 26)} fill={cor.papel} stroke={cor.tinta} strokeWidth={3} />
        {modo === "antes-depois" ? (
          <path d={`M ${meio - 12} ${yMeio} L ${meio + 12} ${yMeio} M ${meio + 3} ${yMeio - 9} L ${meio + 12} ${yMeio} L ${meio + 3} ${yMeio + 9}`} fill="none" stroke={misturaCor(cor.lapis, cor.vinho, pSeta)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        ) : modo === "contra" ? (
          <path d={`M ${meio - 8} ${yMeio - 8} L ${meio + 8} ${yMeio + 8} M ${meio + 8} ${yMeio - 8} L ${meio - 8} ${yMeio + 8}`} stroke={misturaCor(cor.lapis, cor.vinho, pSeta)} strokeWidth={4} strokeLinecap="round" />
        ) : (
          <path d={losango(meio, yMeio, 10)} fill={misturaCor(cor.lapis, cor.vinho, pSeta)} />
        )}
      </svg>
      {lados.map(({ l, linhas }, i) => {
        const ganha = venc === i;
        const perde = venc !== undefined && venc !== i;
        const corTexto = ganha ? misturaCor(cor.tinta, cor.vinho, pV) : cor.tinta;
        const pRot = prog(t, l.em - 0.2, 0.35);
        const rot = rotulos[i];
        const largUlt = larguraDaLinha(linhas[linhas.length - 1] ?? "", medir, { familia: texto, tamanho: tam });
        return (
          <div key={i} style={{ position: "absolute", left: xs[i], top: 0, width: colW, height: h, opacity: perde ? 1 - 0.42 * pV : 1 }}>
            <div style={{ position: "absolute", left: 0, top: yR, ...caixaAlta(rot.tamanho, 0.14), color: misturaCor(cor.lapis, ganha ? misturaHex(cor.tintaSuave, cor.vinho, pV) : cor.tintaSuave, pRot), lineHeight: "38px" }}>
              {rot.linhas.map((x, k) => (
                <div key={k} style={{ whiteSpace: "nowrap" }}>
                  {x}
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, top: yT }}>
              <Linhas linhas={linhas} palavras={plano.palavras} de={l.em - 0.05} ate={m.ate} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: tam, color: corTexto }} />
            </div>
            <svg width={colW} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              {ganha && pV > 0 ? (
                <path
                  d={`M 2 ${yT + linhas.length * tam * ALTURA + 2} C ${largUlt * 0.4} ${yT + linhas.length * tam * ALTURA - 4} ${largUlt * 0.7} ${yT + linhas.length * tam * ALTURA + 8} ${largUlt + 8} ${yT + linhas.length * tam * ALTURA}`}
                  fill="none"
                  stroke={cor.vinho}
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={1}
                  {...tracado(pV)}
                />
              ) : null}
              {perde && modo === "errado-certo" && pV > 0
                ? linhas.map((ln, k) => {
                    const lw = larguraDaLinha(ln, medir, { familia: texto, tamanho: tam });
                    const yy = yT + k * tam * ALTURA + tam * ALTURA * 0.55;
                    return <line key={k} x1={-4} x2={-4 + (lw + 8) * pV} y1={yy} y2={yy} stroke={cor.vinho} strokeWidth={5} strokeLinecap="round" />;
                  })
                : null}
            </svg>
          </div>
        );
      })}
    </>
  );
};

// ---------- gráfico: barras, linha ou pizza com os números ditos; sem números, a tendência ----------

const formatar = (v: number, unidade?: string) => {
  const casas = Number.isInteger(v) ? 0 : Math.abs(v) < 10 ? 1 : 0;
  const n = numeroBR(v, casas);
  if (!unidade) return n;
  return /^[%º°]/.test(unidade) ? `${n}${unidade}` : `${n} ${unidade}`;
};

const TONS = [cor.vinho, cor.tinta, cor.tintaSuave, "#A9606B", "#9C8F84", "#C9A9A6"];

// caminho suave por pontos (Catmull-Rom)
const curva = (ps: { x: number; y: number }[]) =>
  ps
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const p0 = ps[i - 2] ?? ps[i - 1];
      const p1 = ps[i - 1];
      const p3 = ps[i + 1] ?? p;
      const c1 = { x: p1.x + (p.x - p0.x) / 6, y: p1.y + (p.y - p0.y) / 6 };
      const c2 = { x: p.x - (p3.x - p1.x) / 6, y: p.y - (p3.y - p1.y) / 6 };
      return `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p.x} ${p.y}`;
    })
    .join(" ");

const FORMAS: Record<"sobe" | "cai" | "oscila", [number, number][]> = {
  sobe: [[0, 0.1], [0.14, 0.2], [0.27, 0.15], [0.42, 0.4], [0.55, 0.33], [0.71, 0.6], [0.84, 0.55], [1, 0.88]],
  cai: [[0, 0.88], [0.14, 0.78], [0.27, 0.83], [0.42, 0.58], [0.55, 0.65], [0.71, 0.38], [0.84, 0.43], [1, 0.1]],
  oscila: [[0, 0.5], [0.12, 0.78], [0.25, 0.3], [0.38, 0.72], [0.5, 0.32], [0.63, 0.74], [0.76, 0.28], [0.88, 0.66], [1, 0.46]],
};

export const FichaGrafico: React.FC<Props<Grafico>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const dados = (m.dados ?? []).slice(0, 6);
  const x0 = MARGEM + 10;
  const x1 = w - MARGEM - 10;
  const cab = <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />;
  const pEixo = prog(t, m.de + 0.15, 0.5);
  const tracoEixo = misturaCor(cor.lapis, cor.tinta, pEixo);

  // --- sem números ditos: a forma da tendência, ilustrativa ---
  if (dados.length < 2) {
    const forma = FORMAS[m.tendencia ?? "sobe"];
    const yTop = topo + 54;
    const yBase = base - 18;
    const ps = forma.map(([u, v]) => ({ x: mistura(x0 + 24, x1 - 30, u), y: mistura(yBase - 8, yTop + 8, v) }));
    const fimEm = (m.tendenciaEm ?? m.de + 1.4) + 0.5;
    const pLinha = prog(t, m.de + 0.35, Math.max(0.8, fimEm - (m.de + 0.35)), (x) => x);
    const pSeta = prog(t, m.tendenciaEm ?? fimEm - 0.2, 0.35);
    const ult = ps[ps.length - 1];
    const pen = ps[ps.length - 2];
    const ang = Math.atan2(ult.y - pen.y, ult.x - pen.x);
    const seta = (d: number) => `M ${ult.x + Math.cos(ang + Math.PI - 0.5) * d} ${ult.y + Math.sin(ang + Math.PI - 0.5) * d} L ${ult.x} ${ult.y} L ${ult.x + Math.cos(ang + Math.PI + 0.5) * d} ${ult.y + Math.sin(ang + Math.PI + 0.5) * d}`;
    const xCorte = mistura(ps[0].x, ult.x, pLinha);
    return (
      <>
        {cab}
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            <clipPath id={`area-${m.de}`}>
              <rect x={0} y={0} width={xCorte} height={h} />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={x0} x2={x1} y1={mistura(yBase, yTop, f)} y2={mistura(yBase, yTop, f)} stroke={cor.lapis} strokeWidth={2} strokeDasharray="3 9" />
          ))}
          <line x1={x0} x2={x0} y1={yTop - 10} y2={yBase} stroke={tracoEixo} strokeWidth={3.5} />
          <line x1={x0} x2={x1} y1={yBase} y2={yBase} stroke={tracoEixo} strokeWidth={3.5} />
          <path d={`${curva(ps)} L ${ult.x} ${yBase} L ${ps[0].x} ${yBase} Z`} fill={cor.vinhoClaro} opacity={0.7} clipPath={`url(#area-${m.de})`} />
          <path d={curva(ps)} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="4 9" />
          {pLinha > 0 ? <path d={curva(ps)} fill="none" stroke={cor.vinho} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} {...tracado(pLinha)} /> : null}
          {pSeta > 0 ? <path d={seta(26)} fill="none" stroke={cor.vinho} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={pSeta} /> : null}
        </svg>
        {m.unidade ? <div style={{ position: "absolute", left: x0 + 18, top: yTop - 46, ...caixaAlta(30, 0.14), color: misturaCor(cor.lapis, cor.tintaSuave, pEixo) }}>{m.unidade}</div> : null}
        <Ilustrativo x={x1} y={topo + 2} t={t} em={m.de + 0.3} direita w={w} />
      </>
    );
  }

  // --- pizza ---
  if (m.forma === "pizza") {
    const R = Math.min(150, (base - topo) / 2 - 6);
    const cx = x0 + R + 6;
    const cy = (topo + base) / 2 + 4;
    const total = dados.reduce((s, d) => s + Math.max(0, d.valor), 0) || 1;
    let acum = 0;
    const fatias = dados.map((d, i) => {
      const a0 = (acum / total) * Math.PI * 2 - Math.PI / 2;
      acum += Math.max(0, d.valor);
      const a1 = (acum / total) * Math.PI * 2 - Math.PI / 2;
      const p = prog(t, d.em, 0.6);
      const af = mistura(a0, a1, p);
      const grande = af - a0 > Math.PI ? 1 : 0;
      const caminho = p > 0.001 ? `M ${cx} ${cy} L ${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R} A ${R} ${R} 0 ${grande} 1 ${cx + Math.cos(af) * R} ${cy + Math.sin(af) * R} Z` : "";
      return { d, i, caminho, p, pct: Math.round((Math.max(0, d.valor) / total) * 100) };
    });
    const xL = cx + R + 56;
    const largL = x1 - xL;
    const passo = Math.min(76, (base - topo - 10) / dados.length);
    const tamL = Math.max(34, Math.min(46, passo * 0.6));
    return (
      <>
        {cab}
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="5 8" />
          {fatias.map((f) => (f.caminho ? <path key={f.i} d={f.caminho} fill={TONS[f.i % TONS.length]} stroke={cor.papel} strokeWidth={3} /> : null))}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={tracoEixo} strokeWidth={3} />
          {fatias.map((f, i) => {
            const y = topo + 10 + (base - topo - 10 - passo * dados.length) / 2 + passo * i + passo / 2;
            return <path key={i} d={losango(xL - 26, y, 12)} fill={f.p > 0 ? TONS[i % TONS.length] : "none"} stroke={f.p > 0 ? "none" : cor.lapis} strokeWidth={2.5} />;
          })}
        </svg>
        {fatias.map((f, i) => {
          const y = topo + 10 + (base - topo - 10 - passo * dados.length) / 2 + passo * i + passo / 2;
          const valor = m.unidade ? formatar(f.d.valor, m.unidade) : `${f.pct}%`;
          const wV = medir(valor, { familia: display, tamanho: tamL }) + 10;
          const r = encaixar(f.d.rotulo, largL - wV - 24, medir, { familia: texto }, tamL, 32, 1);
          const c = misturaCor(cor.lapis, cor.tinta, prog(t, f.d.em, 0.3));
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: xL, top: y - r.tamanho * 0.6, fontFamily: texto, fontSize: r.tamanho, color: c, whiteSpace: "nowrap", lineHeight: 1.2 }}>{r.linhas[0]}</div>
              <div style={{ position: "absolute", right: w - x1, top: y - tamL * 0.6, fontFamily: display, fontSize: tamL, color: misturaCor(cor.lapis, i === 0 ? cor.vinho : cor.tinta, prog(t, f.d.em, 0.3)), lineHeight: 1.2, ...numerosAlinhados }}>
                {valor}
              </div>
            </div>
          );
        })}
        {m.ilustrativo ? <Ilustrativo x={x0} y={base - 40} t={t} em={m.de + 0.3} w={w} /> : null}
      </>
    );
  }

  // --- barras e linha ---
  const n = dados.length;
  const vaga = (x1 - x0) / n;
  const yTop = topo + 58;
  // o espaço dos rótulos embaixo do eixo depende de quantas linhas eles pedem
  const linhasRotulo = Math.max(1, ...dados.map((d) => encaixar(d.rotulo, vaga - 12, medir, { familia: texto }, 34, 30, 2).linhas.length));
  const yBase = base - 14 - linhasRotulo * 34;
  const maximo = Math.max(...dados.map((d) => d.valor), 0.0001);
  const altura = (v: number) => (Math.max(0, v) / maximo) * (yBase - yTop);
  const iMax = dados.findIndex((d) => d.valor === maximo);
  const barW = Math.min(120, vaga * 0.56);
  const tamV = Math.max(32, Math.min(44, Math.floor(vaga / 4.2)));
  const ps = dados.map((d, i) => ({ x: x0 + vaga * (i + 0.5), y: yBase - altura(d.valor) }));
  return (
    <>
      {cab}
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={x0} x2={x1} y1={yBase} y2={yBase} stroke={tracoEixo} strokeWidth={3.5} />
        {m.forma === "linha"
          ? ps.slice(1).map((b, k) => {
              const a = ps[k];
              const p = prog(t, dados[k + 1].em - 0.35, 0.45, firme);
              return (
                <g key={k}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={cor.lapis} strokeWidth={3} strokeDasharray="4 9" />
                  {p > 0 ? <line x1={a.x} y1={a.y} x2={mistura(a.x, b.x, p)} y2={mistura(a.y, b.y, p)} stroke={cor.vinho} strokeWidth={6} strokeLinecap="round" /> : null}
                </g>
              );
            })
          : null}
        {dados.map((d, i) => {
          const p = prog(t, d.em, 0.6);
          const hb = altura(d.valor);
          const x = x0 + vaga * (i + 0.5);
          const destaque = i === iMax;
          if (m.forma === "linha") {
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yBase} y2={yBase + 10} stroke={tracoEixo} strokeWidth={3} />
                <circle cx={x} cy={ps[i].y} r={p > 0 ? 9 + 4 * p : 8} fill={p > 0 ? (destaque ? cor.vinho : cor.tinta) : cor.papel} stroke={p > 0 ? "none" : cor.lapis} strokeWidth={2.5} />
              </g>
            );
          }
          return (
            <g key={i}>
              <rect x={x - barW / 2} y={yBase - hb} width={barW} height={hb} fill="none" stroke={cor.lapis} strokeWidth={2.5} strokeDasharray="5 7" />
              {p > 0 ? <rect x={x - barW / 2} y={yBase - hb * p} width={barW} height={hb * p} fill={destaque ? cor.vinho : cor.tinta} /> : null}
            </g>
          );
        })}
      </svg>
      {dados.map((d, i) => {
        const p = prog(t, d.em, 0.6);
        const x = x0 + vaga * (i + 0.5);
        const yV = m.forma === "linha" ? ps[i].y - tamV - 18 : yBase - altura(d.valor) * Math.max(0.0001, p) - tamV - 12;
        const rot = encaixar(d.rotulo, vaga - 12, medir, { familia: texto }, 34, 30, 2);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x - vaga / 2, width: vaga, top: yV, textAlign: "center", fontFamily: display, fontSize: tamV, lineHeight: 1.1, color: misturaCor(cor.lapis, i === iMax ? cor.vinho : cor.tinta, prog(t, d.em, 0.3)), ...numerosAlinhados }}>
              {formatar(d.valor, m.unidade)}
            </div>
            <div style={{ position: "absolute", left: x - vaga / 2, width: vaga, top: yBase + 10, textAlign: "center", fontFamily: texto, fontSize: rot.tamanho, lineHeight: 1.05, color: misturaCor(cor.lapis, cor.tintaSuave, prog(t, d.em - 0.1, 0.3)) }}>
              {rot.linhas.map((l, k) => (
                <div key={k}>{l}</div>
              ))}
            </div>
          </div>
        );
      })}
      {m.ilustrativo ? <Ilustrativo x={x1} y={topo + 2} t={t} em={m.de + 0.3} direita w={w} /> : null}
    </>
  );
};

// ---------- destaque: o carimbo que bate na ficha ----------

export const FichaDestaque: React.FC<Props<Destaque>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const alerta = (m.nivel ?? "alerta") === "alerta";
  const tinta = alerta ? cor.vinho : cor.tinta;
  const fonte = { familia: texto, caixaAlta: true, espaco: 0.08 };
  // carimbo e detalhe dividem o corpo: os dois encolhem juntos até caber
  let tamC = 78;
  let tamD = 50;
  const montar = () => {
    const d = m.detalhe ? encaixar(m.detalhe, w - 2 * MARGEM, medir, { familia: texto, italico: true }, tamD, Math.min(tamD, 38), 2) : null;
    let c = encaixar(m.texto, w - 2 * MARGEM - 150, medir, fonte, tamC, Math.min(tamC, 44), 2);
    if (c.linhas.length > 2) c = encaixar(m.texto, w - 2 * MARGEM - 150, medir, fonte, Math.min(tamC, 60), 36, 3);
    const alt = c.linhas.length * c.tamanho * 1.08 + 56 + (d ? d.linhas.length * d.tamanho * ALTURA + 22 : 0);
    return { d, c, alt };
  };
  let montado = montar();
  while (montado.alt > base - topo - 8 && (tamC > 36 || tamD > 38)) {
    tamC = Math.max(36, tamC - 4);
    tamD = Math.max(38, tamD - 2);
    montado = montar();
  }
  const det = montado.d;
  const altDet = det ? det.linhas.length * det.tamanho * ALTURA + 22 : 0;
  const r = montado.c;
  const larguras = r.linhas.map((l) => larguraDaLinha(l, medir, { ...fonte, tamanho: r.tamanho }));
  const boxW = Math.max(...larguras) + 88;
  const boxH = r.linhas.length * r.tamanho * 1.08 + 56;
  const cx = w / 2;
  const cy = topo + (base - topo - altDet) / 2 + 2;
  const p = prog(t, m.em - 0.04, 0.2, firme);
  const escala = 1 + 0.16 * (1 - p);
  const detEm = m.detalheEm ?? m.em + 0.5;
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} corTitulo={alerta ? cor.vinho : cor.tinta} />
      {/* o lugar do carimbo, a lápis */}
      <div style={{ position: "absolute", left: cx - boxW / 2, top: cy - boxH / 2, width: boxW, height: boxH, rotate: "-3deg", border: `3px dashed ${cor.lapis}`, opacity: 1 - p, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {r.linhas.map((l, i) => (
          <div key={i} style={{ ...caixaAlta(r.tamanho, 0.08), color: cor.lapis, lineHeight: 1.08, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
      {p > 0 ? (
        <div style={{ position: "absolute", left: cx - boxW / 2, top: cy - boxH / 2, width: boxW, height: boxH, rotate: "-3deg", scale: String(escala), opacity: Math.min(1, p * 1.5) }}>
          <div style={{ position: "absolute", inset: 0, border: `6px solid ${tinta}` }} />
          <div style={{ position: "absolute", inset: 12, border: `2px solid ${tinta}` }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {r.linhas.map((l, i) => (
              <div key={i} style={{ ...caixaAlta(r.tamanho, 0.08), color: tinta, lineHeight: 1.08, whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {det && m.detalhe ? (
        <div style={{ position: "absolute", left: 0, width: w, top: base - altDet + 18, display: "flex", justifyContent: "center" }}>
          <Linhas linhas={det.linhas} palavras={plano.palavras} de={detEm - 0.05} ate={m.ate} t={t} alturaDaLinha={ALTURA} alinhar="center" estilo={{ fontFamily: texto, fontSize: det.tamanho, fontStyle: "italic", color: cor.tinta }} />
        </div>
      ) : null}
    </>
  );
};

// ---------- definição: o verbete; a linha-guia leva do termo ao significado ----------

export const FichaDefinicao: React.FC<Props<Definicao>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const larg = w - 2 * MARGEM;
  let tamT = 84;
  let tamS = 56;
  let termo = encaixar(m.termo, larg, medir, { familia: texto }, tamT, Math.min(tamT, 52), 2);
  let sig = encaixar(m.significado, larg - 48, medir, { familia: texto, italico: true }, tamS, Math.min(tamS, 40), 2);
  const altura = () => termo.linhas.length * termo.tamanho * ALTURA + 40 + sig.linhas.length * sig.tamanho * ALTURA;
  while (altura() > base - topo - 6 && (tamT > 52 || tamS > 40)) {
    tamT = Math.max(52, tamT - 4);
    tamS = Math.max(40, tamS - 2);
    termo = encaixar(m.termo, larg, medir, { familia: texto }, tamT, Math.min(tamT, 52), 2);
    sig = encaixar(m.significado, larg - 48, medir, { familia: texto, italico: true }, tamS, Math.min(tamS, 40), 2);
  }
  const altT = termo.linhas.length * termo.tamanho * ALTURA;
  const altS = sig.linhas.length * sig.tamanho * ALTURA;
  const vao = 40;
  const total = altT + vao + altS;
  const yT = topo + Math.max(4, (base - topo - total) / 2);
  const yG = yT + altT + vao / 2;
  const yS = yT + altT + vao;
  const pG = prog(t, m.significadoEm - 0.4, 0.5, firme);
  const pL = prog(t, m.significadoEm - 0.1, 0.3);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: yT }}>
        <Linhas linhas={termo.linhas} palavras={plano.palavras} de={m.em - 0.05} ate={m.significadoEm} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: termo.tamanho, color: cor.tinta }} />
      </div>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <line x1={MARGEM} x2={w - MARGEM} y1={yG} y2={yG} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" />
        {pG > 0 ? <line x1={MARGEM} x2={mistura(MARGEM, w - MARGEM, pG)} y1={yG} y2={yG} stroke={cor.vinho} strokeWidth={3.4} strokeDasharray="2 11" strokeLinecap="round" /> : null}
        <path d={losango(MARGEM + 14, yS + sig.tamanho * ALTURA * 0.5, 11)} fill={pL > 0 ? cor.vinho : "none"} stroke={pL > 0 ? "none" : cor.lapis} strokeWidth={2.5} />
      </svg>
      <div style={{ position: "absolute", left: MARGEM + 48, top: yS }}>
        <Linhas linhas={sig.linhas} palavras={plano.palavras} de={m.significadoEm - 0.05} ate={m.ate} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: sig.tamanho, fontStyle: "italic", color: cor.tinta }} />
      </div>
    </>
  );
};

// ---------- frase: a citação entre aspas; o trecho do `risco` é riscado quando é dito ----------

export const FichaFrase: React.FC<Props<Frase>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const recuo = 70;
  const larg = w - 2 * MARGEM - recuo;
  const alturaMax = base - topo - 8;
  let r = encaixar(m.texto, larg, medir, { familia: texto }, 92, 48, 4);
  while (r.tamanho > 44 && r.linhas.length * r.tamanho * ALTURA > alturaMax) r = encaixar(m.texto, larg, medir, { familia: texto }, r.tamanho - 2, 44, 4);
  const tam = r.tamanho;
  const altura = r.linhas.length * tam * ALTURA;
  const y0 = topo + Math.max(2, (alturaMax - altura) / 2);
  const todas = r.linhas.join(" ").split(/\s+/).filter(Boolean);
  const grifo = indicesDoDestaque(todas, m.destaque);
  const riscadas = indicesDoDestaque(todas, m.risco);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(todas.join(" "), plano.palavras, inicio, m.ate);
  const primeiraRiscada = [...riscadas][0];
  const riscoEm = m.riscoEm ?? (primeiraRiscada !== undefined ? (tempos[Math.max(...riscadas)] ?? m.de) + 0.25 : m.de);
  const pRisco = prog(t, riscoEm, 0.45, firme);
  const pAspas = prog(t, inicio - 0.1, 0.4);
  // onde fica cada palavra riscada (para o traço)
  const riscos: { x1: number; x2: number; y: number }[] = [];
  let k = 0;
  r.linhas.forEach((linha, li) => {
    const ws = linha.split(/\s+/).filter(Boolean);
    let x = MARGEM + recuo;
    let ini: number | null = null;
    let fim = 0;
    ws.forEach((wd, wi) => {
      const ital = grifo.has(k);
      const lw = medir(wd, { familia: texto, tamanho: tam, italico: ital });
      if (riscadas.has(k)) {
        if (ini === null) ini = x;
        fim = x + lw;
      }
      x += lw + tam * 0.26;
      k++;
      if (wi === ws.length - 1 && ini !== null) riscos.push({ x1: ini - 6, x2: fim + 6, y: y0 + li * tam * ALTURA + tam * ALTURA * 0.56 });
    });
  });
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM - 6, top: y0 - 30, fontFamily: display, fontSize: 150, lineHeight: 1, color: misturaCor(cor.lapis, cor.vinho, pAspas) }}>“</div>
      <div style={{ position: "absolute", left: MARGEM + recuo, top: y0 }}>
        <Linhas linhas={r.linhas} palavras={plano.palavras} de={inicio} ate={m.ate} t={t} alturaDaLinha={ALTURA} destaque={m.destaque} estilo={{ fontFamily: texto, fontSize: tam, color: cor.tinta }} />
      </div>
      {pRisco > 0 ? (
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {riscos.map((s, i) => {
            const pi = Math.max(0, Math.min(1, pRisco * riscos.length - i));
            return pi > 0 ? <line key={i} x1={s.x1} x2={mistura(s.x1, s.x2, pi)} y1={s.y} y2={s.y - 2} stroke={cor.vinho} strokeWidth={6} strokeLinecap="round" /> : null;
          })}
        </svg>
      ) : null}
    </>
  );
};

// ---------- pergunta: a pergunta se escreve; o selo do "?" se acende palavra a palavra ----------

export const FichaPergunta: React.FC<Props<Pergunta>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo, base } = corpo(h);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const raio = 62;
  const larg = w - 2 * MARGEM - raio * 2 - 60;
  const tamOp = opcoes.length ? Math.max(38, Math.min(48, Math.floor((base - topo) / (opcoes.length + 2.4) / 1.3))) : 0;
  const altOp = opcoes.length * tamOp * 1.42;
  let q = encaixar(m.texto, larg, medir, { familia: texto }, opcoes.length ? 64 : 76, 46, 3);
  while (q.tamanho > 44 && q.linhas.length * q.tamanho * ALTURA + altOp > base - topo - 10) q = encaixar(m.texto, larg, medir, { familia: texto }, q.tamanho - 2, 44, 3);
  if (q.linhas.length > 3 || q.linhas.length * q.tamanho * ALTURA + altOp > base - topo - 10) q = encaixar(m.texto, larg, medir, { familia: texto }, 46, 38, 4);
  const altQ = q.linhas.length * q.tamanho * ALTURA;
  const y0 = topo + Math.max(2, (base - topo - altQ - altOp - (opcoes.length ? 14 : 0)) / 2);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(q.linhas.join(" "), plano.palavras, inicio, m.ate);
  const ditas = tempos.filter((x) => x <= t).length / Math.max(1, tempos.length);
  const cx = w - MARGEM - raio - 8;
  const cy = opcoes.length ? y0 + Math.min(altQ, raio * 2) / 2 + 6 : (topo + base) / 2;
  const pSelo = prog(t, (tempos[0] ?? m.de) - 0.05, 0.3);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de - 0.3} largura={largTitulo} medir={medir} corTitulo={cor.vinho} />
      <div style={{ position: "absolute", left: MARGEM, top: y0 }}>
        <Linhas linhas={q.linhas} palavras={plano.palavras} de={inicio} ate={m.ate} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: q.tamanho, color: cor.tinta }} />
      </div>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={raio} fill={cor.papel} stroke={misturaCor(cor.lapis, cor.vinho, pSelo)} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={raio - 9} fill="none" stroke={misturaCor(cor.lapis, cor.tinta, pSelo)} strokeWidth={1.5} />
        {Array.from({ length: 12 }, (_, k) => {
          const a = -Math.PI / 2 + (k / 12) * Math.PI * 2;
          const acesa = ditas >= (k + 1) / 12 ? 1 : 0;
          return (
            <line key={k} x1={cx + Math.cos(a) * (raio + 8)} y1={cy + Math.sin(a) * (raio + 8)} x2={cx + Math.cos(a) * (raio + 22)} y2={cy + Math.sin(a) * (raio + 22)} stroke={misturaCor(cor.lapis, cor.vinho, acesa)} strokeWidth={6} strokeLinecap="round" />
          );
        })}
        <text x={cx} y={cy + raio * 0.36} textAnchor="middle" fontFamily={display} fontSize={raio * 1.15} fill={misturaCor(cor.lapis, cor.vinho, pSelo)}>
          ?
        </text>
        {opcoes.map((o, i) => {
          const y = y0 + altQ + 14 + i * tamOp * 1.42 + tamOp * 0.7;
          const p = prog(t, o.em - 0.05, 0.3);
          return <rect key={i} x={MARGEM + 4} y={y - tamOp * 0.36} width={tamOp * 0.72} height={tamOp * 0.72} fill="none" stroke={misturaCor(cor.lapis, cor.tinta, p)} strokeWidth={3} strokeDasharray={p > 0.5 ? undefined : "5 6"} />;
        })}
      </svg>
      {opcoes.map((o, i) => {
        const y = y0 + altQ + 14 + i * tamOp * 1.42;
        const r = encaixar(o.texto, larg - tamOp * 1.3, medir, { familia: texto }, tamOp, 34, 1);
        return (
          <div key={i} style={{ position: "absolute", left: MARGEM + tamOp * 1.25, top: y }}>
            <Linhas linhas={r.linhas.slice(0, 1)} palavras={plano.palavras} de={o.em - 0.05} t={t} alturaDaLinha={1.4} estilo={{ fontFamily: texto, fontSize: r.tamanho, color: cor.tinta }} />
          </div>
        );
      })}
    </>
  );
};

// ---------- medidor: qualquer escala; a barra enche e o ponteiro do mostrador gira junto ----------

export const FichaMedidor: React.FC<Props<MedidorMomento>> = ({ m, plano, t, w, h, medir, numero, titulo, largTitulo }) => {
  const { topo } = corpo(h);
  const comTaca = !!m.taca;
  const larguraDesenho = comTaca ? 214 : 236;
  const xDes = w - MARGEM - larguraDesenho;
  const medidorY = h - 64;
  const larguraMedidor = comTaca ? xDes - MARGEM - 60 : w - 2 * MARGEM;
  const largTexto = xDes - MARGEM - 36;
  // valor e nota dividem a altura acima das pontas do medidor
  const alturaLivre = medidorY - 70 - (topo + 2);
  let tamV = 84;
  let tamN = 50;
  const montar = () => {
    const v = m.valor ? encaixar(m.valor.texto, largTexto, medir, { familia: texto }, tamV, Math.min(tamV, 48), 2) : null;
    const n = m.nota ? encaixar(m.nota.texto, largTexto, medir, { familia: texto, italico: true }, tamN, Math.min(tamN, 38), 2) : null;
    const alt = (v ? v.linhas.length * v.tamanho * ALTURA : 0) + (n ? n.linhas.length * n.tamanho * ALTURA + 10 : 0);
    return { v, n, alt };
  };
  let montado = montar();
  while (montado.alt > alturaLivre && (tamV > 48 || tamN > 38)) {
    tamV = Math.max(48, tamV - 4);
    tamN = Math.max(38, tamN - 2);
    montado = montar();
  }
  const valor = montado.v;
  const altV = valor ? valor.linhas.length * valor.tamanho * ALTURA : 0;
  const nota = montado.alt > alturaLivre && valor ? null : montado.n;
  const pMedidor = prog(t, m.em, 0.35);
  const pCheio = prog(t, m.cheioEm, 0.9);
  const nivel = Math.max(0, Math.min(1, m.nivel));
  const nivelAgora = nivel * pCheio + 0.18 * prog(t, m.em + 0.1, 0.5) * (1 - pCheio);
  const liquido = LIQUIDOS[m.taca?.liquido ?? "tinto"];
  const pEnche = m.taca ? prog(t, m.taca.em, 1.2) : 0;
  const onda = 1 - prog(t, (m.taca?.em ?? 0) + 0.6, 1.2);
  return (
    <>
      <Cabecalho numero={numero} titulo={titulo} t={t} de={m.de} largura={largTitulo} medir={medir} />
      <div style={{ position: "absolute", left: MARGEM, top: topo + 2, display: "flex", flexDirection: "column", gap: 10 }}>
        {m.valor && valor ? <Linhas linhas={valor.linhas} palavras={plano.palavras} de={m.valor.em - 0.05} t={t} alturaDaLinha={ALTURA} estilo={{ fontFamily: texto, fontSize: valor.tamanho, color: cor.tinta }} /> : null}
        {m.nota && nota ? (
          <div style={{ marginTop: altV ? 0 : 8 }}>
            <Linhas linhas={nota.linhas} palavras={plano.palavras} de={m.nota.em - 0.05} ate={m.ate} t={t} alturaDaLinha={ALTURA} destaque={m.nota.destaque} estilo={{ fontFamily: texto, fontSize: nota.tamanho, fontStyle: "italic", color: cor.tinta }} />
          </div>
        ) : null}
      </div>
      {/* a barra do medidor, com as pontas da escala */}
      <div style={{ position: "absolute", left: MARGEM, top: medidorY - 58, width: larguraMedidor, display: "flex", justifyContent: "space-between" }}>
        <span style={{ ...caixaAlta(32, 0.12), color: misturaCor(cor.lapis, cor.tintaSuave, pMedidor) }}>{m.pontas[0]}</span>
        <span style={{ ...caixaAlta(32, 0.12), color: misturaCor(cor.lapis, misturaHex(cor.tinta, cor.vinho, pCheio), pMedidor) }}>{m.pontas[1]}</span>
      </div>
      <svg width={larguraMedidor} height={40} style={{ position: "absolute", left: MARGEM, top: medidorY - 6, overflow: "visible" }}>
        <rect x={0} y={4} width={larguraMedidor} height={24} rx={12} fill={cor.papelEscuro} stroke={misturaCor(cor.lapis, cor.tinta, pMedidor)} strokeWidth={3} strokeDasharray={pMedidor > 0.5 ? undefined : "6 8"} />
        {nivelAgora > 0.001 ? <rect x={3} y={7} width={Math.max(18, (larguraMedidor - 6) * nivelAgora)} height={18} rx={9} fill={cor.vinho} /> : null}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={larguraMedidor * f} x2={larguraMedidor * f} y1={-6} y2={2} stroke={misturaCor(cor.lapis, cor.tinta, pMedidor)} strokeWidth={2.5} />
        ))}
      </svg>
      {comTaca ? (
        <div style={{ position: "absolute", left: xDes + 6, top: CABECALHO + 2 }}>
          <Taca p={prog(t, m.de + 0.2, 1.0)} tinta={prog(t, m.de + 0.2, 0.6)} nivel={0.58 * pEnche} liquido={misturaCor(liquido.claro, liquido.escuro, Math.max(0.15, pCheio))} largura={larguraDesenho} onda={onda * pEnche} />
        </div>
      ) : (
        <div style={{ position: "absolute", left: xDes, top: topo + 8 }}>
          <Mostrador largura={larguraDesenho} tinta={pMedidor} nivel={nivelAgora} />
        </div>
      )}
      {m.ilustrativo ? <Ilustrativo x={w - MARGEM} y={medidorY - 112} t={t} em={m.em} direita w={w} /> : null}
    </>
  );
};
