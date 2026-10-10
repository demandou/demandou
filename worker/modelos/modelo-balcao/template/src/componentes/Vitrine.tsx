// A assinatura do Balcão: a VITRINE e o COMBO.
//  - cada produto é posto na prateleira na palavra que o nomeia (desce e assenta, com sombra);
//  - a etiqueta do nome sobe na beira da prateleira; o adesivo de preço é colado com uma batida;
//  - com um combo logo depois, os produtos se juntam, a fita kraft os amarra, a etiqueta do combo
//    mostra a condição ("Leva 3") e o carimbo bate o valor ("paga 30").
// Sem foto, o produto vira uma ilustração (vetor) ou um cartão com o nome grande (modo ilustrativo).
import { Easing, Img, staticFile } from "remotion";
import { prog, saida, saindo, salto, temposDoTexto } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Combo as TCombo, Plano, Produto, Vitrine as TVitrine } from "../plano";
import { AREA, cor, fonte, VIDRO } from "../tema";
import { Ilustracao } from "./Ilustracoes";
import { Adesivo, caber, Carimbo, EtiquetaPrateleira, estiloFonte, medirCarimbo, Texto } from "./Pecas";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ——— geometria da prateleira ———
export const PRAT_Y = 776; // o tampo da prateleira (os produtos ficam em pé aqui)
const ALT_ETIQ = 100;

export const colunasDaVitrine = (n: number) => {
  const k = clamp(n, 1, 4);
  const w = AREA.w / k;
  const alt = k === 1 ? 370 : k === 2 ? 360 : k === 3 ? 350 : 280;
  return Array.from({ length: k }, (_, i) => ({ cx: AREA.x + w * (i + 0.5), w, alt }));
};

// Título pintado no vidro (no alto da vitrine): centrado, com o traço tomate.
export const alturaLetreiro = (texto?: string) => {
  if (!texto) return 0;
  const f = caber(texto, AREA.w, 60, 36, 2);
  return f.linhas.length * f.tamanho * 1.12 + 30;
};
export const LetreiroDoVidro: React.FC<{ t: number; plano: Plano; texto?: string; em: number; ate: number; y?: number }> = ({ t, plano, texto, em, ate, y = AREA.y }) => {
  if (!texto) return null;
  const f = caber(texto, AREA.w, 60, 36, 2);
  const p = prog(t, em - 0.05, 0.3);
  return (
    <>
      <div style={{ position: "absolute", left: AREA.x, width: AREA.w, top: y }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(texto, em, plano.palavras, ate)} />
      </div>
      <div style={{ position: "absolute", left: AREA.x + AREA.w / 2 - 50 * p, top: y + f.linhas.length * f.tamanho * 1.14 + 6, width: 100 * p, height: 7, borderRadius: 4, background: cor.acento }} />
    </>
  );
};

// O produto: foto recortada em pé, foto comum num quadrinho, ilustração ou cartão com o nome.
const Peca: React.FC<{ plano: Plano; p: Produto; w: number; alt: number }> = ({ plano, p, w, alt }) => {
  const img = imagemDoPlano(plano, p.imagem);
  if (temImagem(img)) {
    const prop = img.largura && img.altura ? img.largura / img.altura : 0.8;
    if (img.transparente) {
      const h = Math.min(alt, (w - 16) / prop);
      return <Img src={staticFile(img.arquivo)} style={{ height: h, width: h * prop, display: "block", filter: "drop-shadow(0 10px 10px rgba(59,36,22,0.18))" }} />;
    }
    const lado = Math.min(w - 30, alt);
    return (
      <div style={{ width: lado, height: lado, borderRadius: 22, overflow: "hidden", border: `8px solid ${cor.papel}`, boxSizing: "border-box", boxShadow: "0 12px 24px rgba(59,36,22,0.2)" }}>
        <Img src={staticFile(img.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(img.foco?.x ?? 0.5) * 100}% ${(img.foco?.y ?? 0.5) * 100}%` }} />
      </div>
    );
  }
  if (p.ilustracao) {
    const lado = Math.min(w - 40, alt * 0.82);
    return (
      <div style={{ width: lado, height: lado, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <Ilustracao nome={p.ilustracao} tamanho={lado} />
      </div>
    );
  }
  // cartão de pé com o nome grande (o serviço sem imagem)
  const lado = Math.min(w - 36, alt * 0.9);
  const f = caber(p.texto, lado - 40, 64, 28, 3);
  return (
    <div
      style={{
        width: lado,
        height: lado * 0.86,
        borderRadius: 26,
        background: cor.papel,
        border: `4px solid ${cor.papelBorda}`,
        boxSizing: "border-box",
        boxShadow: "0 12px 20px rgba(59,36,22,0.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Texto t={99} linhas={f.linhas} tamanho={f.tamanho} />
    </div>
  );
};

// conteúdo do adesivo de preço: preço grande e o detalhe ("cada") embaixo
const ConteudoPreco: React.FC<{ t: number; texto: string; d: number; detalhe?: string; detalheEm?: number }> = ({ t, texto, d, detalhe, detalheEm }) => {
  const f = encaixar(texto, { largura: d * 0.7, max: Math.round(d * 0.3), min: 22, linhas: 2, fonte: { peso: 800 } });
  const pD = detalhe ? prog(t, detalheEm ?? 0, 0.2, salto) : 0;
  return (
    <>
      {f.linhas.map((l, i) => (
        <div key={i} style={{ ...estiloFonte(800, f.tamanho), lineHeight: 1.02 }}>
          {l}
        </div>
      ))}
      {detalhe && pD > 0 ? (
        <div style={{ ...estiloFonte(700, Math.round(d * 0.16)), lineHeight: 1.1, opacity: Math.min(1, pD * 2), transform: pD >= 1 ? undefined : `scale(${0.6 + 0.4 * pD})` }}>{detalhe}</div>
      ) : null}
    </>
  );
};

type Comum = { t: number; plano: Plano; fim: number };

// ——— a vitrine (e o combo amarrado a ela) ———
export const Vitrine: React.FC<
  Comum & {
    m: TVitrine;
    combo?: TCombo | null;
    // true = o título vem da abertura (que encolheu e virou o letreiro): a vitrine não desenha o seu
    semTitulo?: boolean;
    // onde começa a área dos produtos (abaixo do letreiro)
  }
> = ({ t, plano, m, fim, combo, semTitulo }) => {
  const s = saindo(t, fim, 0.16);
  const cols = colunasDaVitrine(m.itens.length);
  const itens = m.itens.slice(0, 4);
  // o combo junta os produtos no meio
  const junta = combo ? prog(t, combo.em, 0.42, saida) : 0;
  const titulo = semTitulo ? undefined : m.titulo;
  const dAdesivo = cols.length >= 4 ? 128 : cols.length === 3 ? 158 : 168;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s, transform: s > 0 ? `translateY(${-30 * s}px)` : undefined }}>
      <LetreiroDoVidro t={t} plano={plano} texto={titulo} em={m.de} ate={itens[0]?.em ?? m.ate} />
      {/* a prateleira de madeira (entra com a vitrine) */}
      <Prateleira t={t} de={m.de} />
      {itens.map((p, i) => {
        if (t < p.em - 0.02) return null;
        const c = cols[i];
        const cx = c.cx + (540 - c.cx) * 0.16 * junta;
        const e = prog(t, p.em, 0.42, salto);
        const dy = (1 - e) * -90;
        const op = Math.min(1, (t - p.em + 0.02) / 0.1);
        const recente = i === itens.filter((x) => t >= x.em).length - 1 && !combo ? 1 - prog(t, (itens[i + 1]?.em ?? fim) - 0.05, 0.2) : 0;
        // o adesivo de preço deste item
        const preco = p.preco ?? m.preco?.texto;
        const colado = p.preco ? (p.precoEm ?? p.em + 0.4) : m.preco ? m.preco.em + i * 0.06 : null;
        const giro = [-11, -6, -9, -5][i % 4];
        return (
          <div key={i}>
            {/* sombra no tampo */}
            <div
              style={{
                position: "absolute",
                left: cx - c.w * 0.32,
                top: PRAT_Y - 12,
                width: c.w * 0.64,
                height: 22,
                borderRadius: "50%",
                background: "rgba(59,36,22,0.22)",
                opacity: op * e,
                transform: `scaleX(${0.6 + 0.4 * e})`,
              }}
            />
            <div style={{ position: "absolute", left: cx - c.w / 2, top: PRAT_Y - c.alt - 4, width: c.w, height: c.alt + 4, display: "flex", alignItems: "flex-end", justifyContent: "center", opacity: op, transform: `translateY(${dy}px)` }}>
              <Peca plano={plano} p={p} w={c.w} alt={c.alt} />
            </div>
            {/* a etiqueta do nome na beira da prateleira */}
            <div style={{ opacity: combo ? 1 - prog(t, combo.em, 0.25) : 1 }}>
              <EtiquetaNaBeira t={t} em={p.em + 0.08} cx={cx} w={Math.min(c.w - 18, 300)} texto={p.texto} ativo={recente} />
            </div>
            {preco && colado !== null ? (
              <div style={{ position: "absolute", left: cx + c.w * 0.18 - dAdesivo / 2, top: PRAT_Y - c.alt - 4 + dAdesivo * 0.05 }}>
                <Adesivo t={t} colado={colado} d={dAdesivo} giro={giro}>
                  <ConteudoPreco t={t} texto={preco} d={dAdesivo} detalhe={p.preco ? undefined : m.preco?.detalhe} detalheEm={m.preco?.detalheEm} />
                </Adesivo>
              </div>
            ) : null}
          </div>
        );
      })}
      {combo ? <AmarradoDoCombo t={t} plano={plano} m={combo} n={itens.length} junta={junta} fim={fim} /> : null}
    </div>
  );
};

const Prateleira: React.FC<{ t: number; de: number }> = ({ t, de }) => {
  const p = prog(t, de - 0.1, 0.35, saida);
  const w = (VIDRO.w - 20) * p;
  return (
    <div style={{ position: "absolute", left: 540 - w / 2, top: PRAT_Y - 2, width: w, height: 30 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 14, borderRadius: 4, background: cor.madeiraClara }} />
      <div style={{ position: "absolute", left: 0, top: 14, width: "100%", height: 16, borderRadius: "0 0 5px 5px", background: cor.madeira, boxShadow: "0 8px 12px rgba(59,36,22,0.18)" }} />
    </div>
  );
};

const EtiquetaNaBeira: React.FC<{ t: number; em: number; cx: number; w: number; texto: string; ativo: number }> = ({ t, em, cx, w, texto, ativo }) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em, 0.3, salto);
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: PRAT_Y + 32, width: w, opacity: Math.min(1, p * 2), transform: p >= 1 ? undefined : `translateY(${(1 - p) * -24}px)` }}>
      <EtiquetaPrateleira texto={texto} largura={w} max={34} ativo={ativo} />
    </div>
  );
};

// ——— o combo ———
// A etiqueta kraft do combo (com o texto que se monta na fala) e, embaixo, o carimbo do valor.
const medidasDoCombo = (m: TCombo) => {
  const w = 540;
  const fT = encaixar(m.texto, { largura: w - 70, max: 72, min: 36, linhas: 2, fonte: { peso: 800 } });
  const altT = fT.linhas.length * fT.tamanho * 1.1;
  let carimbo: { linhas: string[]; tamanhos: number[]; w: number; h: number } | null = null;
  if (m.valor) {
    let s = 92;
    const linhas = [m.valor];
    let med = medirCarimbo(linhas, [s]);
    while (s > 40 && med.w > w - 40) {
      s -= 4;
      med = medirCarimbo(linhas, [s]);
    }
    carimbo = { linhas, tamanhos: [s], ...med };
  }
  const h = 40 + altT + (carimbo ? carimbo.h + 18 : 30);
  return { w, h, fT, altT, carimbo };
};

const EtiquetaDoCombo: React.FC<{ t: number; plano: Plano; m: TCombo; cx: number; cy: number; fim: number }> = ({ t, plano, m, cx, cy, fim }) => {
  if (t < m.em - 0.02) return null;
  const { w, h, fT, altT, carimbo } = medidasDoCombo(m);
  const p = prog(t, m.em, 0.4, salto);
  const balanco = t >= m.em + 0.4 ? Math.sin((t - m.em) * 2.2) * 1.2 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        transformOrigin: "50% -30px",
        transform: p >= 1 ? `rotate(${balanco - 2}deg)` : `translateY(${(1 - p) * -60}px) rotate(${-2 - 10 * (1 - p)}deg)`,
        opacity: Math.min(1, p * 3),
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 22, background: cor.papel, border: `4px solid ${cor.kraftEscuro}`, boxShadow: "0 14px 28px rgba(59,36,22,0.28)" }} />
      <div style={{ position: "absolute", inset: 10, borderRadius: 14, border: `2px dashed ${cor.kraft}` }} />
      {/* o furo do barbante */}
      <div style={{ position: "absolute", left: w / 2 - 12, top: 12, width: 24, height: 24, borderRadius: 12, background: cor.kraft, boxShadow: `inset 0 3px 0 ${cor.kraftEscuro}` }} />
      <div style={{ position: "absolute", left: 0, width: w, top: 44 }}>
        <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={temposDoTexto(m.texto, m.em, plano.palavras, m.valorEm ?? fim)} />
      </div>
      {carimbo && m.valorEm !== undefined ? (
        <div style={{ position: "absolute", left: (w - carimbo.w) / 2, top: 44 + altT + 10 }}>
          <Carimbo t={t} bate={m.valorEm} linhas={carimbo.linhas} tamanhos={carimbo.tamanhos} giro={-6} />
        </div>
      ) : null}
    </div>
  );
};

// A etiqueta DEITADA do combo amarrado à vitrine: fica na frente da prateleira, abaixo dos produtos
// (nunca por cima deles), levemente inclinada: a condição à esquerda e o carimbo à direita.
const medidasDeitada = (m: TCombo) => {
  let s = 60;
  let carimbo: { linhas: string[]; tamanhos: number[]; w: number; h: number } | null = null;
  if (m.valor) {
    let med = medirCarimbo([m.valor], [s]);
    while (s > 36 && med.w > 440) {
      s -= 4;
      med = medirCarimbo([m.valor], [s]);
    }
    carimbo = { linhas: [m.valor], tamanhos: [s], ...med };
  }
  const largTexto = 760 - (carimbo ? carimbo.w + 40 : 0) - 60;
  const fT = encaixar(m.texto, { largura: largTexto, max: 62, min: 32, linhas: 2, fonte: { peso: 800 } });
  const lT = Math.max(...fT.linhas.map((l) => larguraTexto(l, fT.tamanho, { peso: 800 })));
  const altT = fT.linhas.length * fT.tamanho * 1.1;
  const h = Math.max(altT + 40, (carimbo?.h ?? 0) + 18);
  const w = Math.min(820, 60 + lT + (carimbo ? 40 + carimbo.w : 0) + 30);
  return { w, h, fT, lT, altT, carimbo };
};

const EtiquetaDeitada: React.FC<{ t: number; plano: Plano; m: TCombo; cx: number; top: number; fim: number }> = ({ t, plano, m, cx, top, fim }) => {
  if (t < m.em - 0.02) return null;
  const { w, h, fT, altT, carimbo } = medidasDeitada(m);
  const p = prog(t, m.em, 0.4, salto);
  const balanco = t >= m.em + 0.4 ? Math.sin((t - m.em) * 2.2) * 0.8 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top,
        width: w,
        height: h,
        transformOrigin: "50% 0%",
        transform: p >= 1 ? `rotate(${balanco - 3}deg)` : `translateY(${(1 - p) * -40}px) rotate(${-3 - 8 * (1 - p)}deg)`,
        opacity: Math.min(1, p * 3),
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: cor.papel, border: `4px solid ${cor.kraftEscuro}`, boxShadow: "0 14px 26px rgba(59,36,22,0.3)" }} />
      <div style={{ position: "absolute", inset: 9, borderRadius: 13, border: `2px dashed ${cor.kraft}` }} />
      {/* o furo do barbante, no meio da borda de cima */}
      <div style={{ position: "absolute", left: w / 2 - 11, top: 8, width: 22, height: 22, borderRadius: 11, background: cor.kraft, boxShadow: `inset 0 3px 0 ${cor.kraftEscuro}` }} />
      <div style={{ position: "absolute", left: 30, top: (h - altT) / 2 + 4 }}>
        <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} alinhar="left" tempos={temposDoTexto(m.texto, m.em, plano.palavras, m.valorEm ?? fim)} />
      </div>
      {carimbo && m.valorEm !== undefined ? (
        <div style={{ position: "absolute", right: 22, top: (h - carimbo.h) / 2 }}>
          <Carimbo t={t} bate={m.valorEm} linhas={carimbo.linhas} tamanhos={carimbo.tamanhos} giro={-5} />
        </div>
      ) : null}
    </div>
  );
};

// A fita kraft que amarra os produtos; um barbante desce do laço até a etiqueta do combo, que fica
// deitada na frente da prateleira (os produtos continuam inteiros à vista).
const AmarradoDoCombo: React.FC<{ t: number; plano: Plano; m: TCombo; n: number; junta: number; fim: number }> = ({ t, plano, m, n, junta, fim }) => {
  if (t < m.em - 0.02) return null;
  const cols = colunasDaVitrine(n);
  const alt = cols[0].alt;
  const xs = cols.map((c) => c.cx + (540 - c.cx) * 0.16 * junta);
  const meia = n === 1 ? 160 : (xs[xs.length - 1] - xs[0]) / 2 + cols[0].w * 0.42;
  const yFita = PRAT_Y - alt * 0.36;
  const pF = prog(t, m.em, 0.35, saida);
  const { h } = medidasDeitada(m);
  const topo = Math.min(PRAT_Y - 12, AREA.base + 6 - h);
  const pB = prog(t, m.em + 0.1, 0.3, saida);
  return (
    <>
      <div style={{ position: "absolute", left: 540 - meia * pF, top: yFita - 18, width: 2 * meia * pF, height: 36, background: cor.kraft, borderTop: `3px solid ${cor.kraftEscuro}`, borderBottom: `3px solid ${cor.kraftEscuro}`, boxShadow: "0 4px 8px rgba(59,36,22,0.2)" }} />
      {/* o laço no meio da fita e o barbante até a etiqueta */}
      <div style={{ position: "absolute", left: 540 - 3, top: yFita, width: 6, height: (topo + 20 - yFita) * pB, borderRadius: 3, background: cor.kraftEscuro }} />
      <div style={{ position: "absolute", left: 540 - 26, top: yFita - 22, width: 52, height: 44, borderRadius: 14, background: cor.kraft, border: `3px solid ${cor.kraftEscuro}`, opacity: pF, transform: `scale(${pF})` }} />
      <EtiquetaDeitada t={t} plano={plano} m={m} cx={540} top={topo} fim={fim} />
    </>
  );
};

// O combo sozinho (sem vitrine antes): a fita atravessa o vidro e a etiqueta fica no meio.
export const ComboSozinho: React.FC<Comum & { m: TCombo }> = ({ t, plano, m, fim }) => {
  const s = saindo(t, fim, 0.16);
  const pF = prog(t, m.de, 0.35, saida);
  const cy = (AREA.y + AREA.base) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      <div style={{ position: "absolute", left: VIDRO.x, top: cy - 120, width: VIDRO.w * pF, height: 36, background: cor.kraft, borderTop: `3px solid ${cor.kraftEscuro}`, borderBottom: `3px solid ${cor.kraftEscuro}` }} />
      <EtiquetaDoCombo t={t} plano={plano} m={{ ...m, em: Math.max(m.de, m.em) }} cx={540} cy={cy} fim={fim} />
    </div>
  );
};

void Easing;
void fonte;
