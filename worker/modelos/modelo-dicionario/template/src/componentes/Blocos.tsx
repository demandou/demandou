// Os blocos universais desenhados como um dicionário: acepções numeradas, remissões encadeadas,
// o número como palavra-título, cartões de nota lado a lado, o carimbo, o verbete simples,
// a epígrafe e a pergunta. Cada um desenha dentro de uma região (a área de conteúdo da página
// ou da folha do frontispício) e se monta no ritmo da fala.
import { bate, impressao, limitar, prog, quebrarPalavra, silabasDe, temposDoTexto } from "../anim";
import type { Regiao } from "../layout";
import { encaixar, type Fonte, formatarNumero, larguraTexto, porExtenso } from "../medida";
import type { Comparacao, Definicao, Destaque, Frase, Numero, Palavra, Passos, Pergunta, Topicos } from "../plano";
import { cor, sans, serif, sombraPapel } from "../tema";
import { familiaCss, Ilustrativo, indicesDoTrecho, Letreiro, LinhasFaladas, palavrasDoTexto } from "./Texto";
import { Lacunas } from "./Remissao";
import { alturaDaPronuncia, PalavraTituloAnimada, Pronuncia } from "./Verbete";

// tempos das palavras de um texto na fala (palavra não achada entra logo depois da anterior)
export const temposDe = (texto: string, palavras: Palavra[], de: number, ate: number, inicio = de) =>
  temposDoTexto(palavrasDoTexto(texto).join(" "), palavras, de, ate, inicio);

// título de bloco: segue a fala, mas fica inteiro no primeiro segundo (é a cabeça do verbete)
export const temposDeTitulo = (texto: string, palavras: Palavra[], de: number, ate: number) =>
  temposDe(texto, palavras, de, ate, de).map((x, i) => Math.min(x, de + 0.5 + i * 0.06));

// todas as palavras no mesmo instante, com um passo mínimo (o texto "se imprime" da esquerda para a direita)
const temposJuntos = (texto: string, em: number, passo = 0.05) => palavrasDoTexto(texto).map((_, i) => em + i * passo);

const NEGRITO: Fonte = { familia: "serif", peso: 700 };
const DETALHE: Fonte = { familia: "italico", peso: 400 };

// ---------- título de bloco dentro da região (quando não há coluna ao lado, ex.: no frontispício) ----------

export const medirTitulo = (titulo: string, largura: number) => {
  const e = encaixar(titulo, { largura, max: 76, min: 50, linhas: 2, fonte: NEGRITO });
  return { e, altura: e.linhas.length * e.corpo * 1.06 + 34 };
};

export const TituloDoBloco: React.FC<{ titulo: string; R: Regiao; t: number; palavras: Palavra[]; de: number; ate: number }> = ({
  titulo,
  R,
  t,
  palavras,
  de,
  ate,
}) => {
  const { e } = medirTitulo(titulo, R.w);
  const tempos = temposDeTitulo(titulo, palavras, de, ate);
  return (
    <div style={{ position: "absolute", left: R.x, top: R.y, width: R.w }}>
      <LinhasFaladas linhas={e.linhas} corpo={e.corpo} entrelinha={1.06} fonte={NEGRITO} tempos={tempos} t={t} cor={cor.ameixa} esboco="nada" />
      <div style={{ marginTop: 12, height: 2.5, width: `${prog(t, de, 0.5) * 120}px`, background: cor.ameixa }} />
    </div>
  );
};

const semTitulo = (R: Regiao, titulo: string | undefined, comTitulo: boolean): Regiao => {
  if (!comTitulo || !titulo) return R;
  const { altura } = medirTitulo(titulo, R.w);
  return { ...R, y: R.y + altura, h: R.h - altura };
};

// ---------- topicos (acepções) e passos (remissões encadeadas) ----------

export const Lista: React.FC<{ m: Topicos | Passos; t: number; R: Regiao; palavras: Palavra[]; comTitulo: boolean }> = ({
  m,
  t,
  R,
  palavras,
  comTitulo,
}) => {
  const ordenada = m.tipo === "passos";
  const area = semTitulo(R, m.titulo, comTitulo);
  const itens = m.itens;
  const n = itens.length;

  const medir = (c: number, maxLinhas: number) => {
    const cn = Math.round(c * 0.66);
    const chip = Math.round(c * 0.92);
    const gutter = ordenada ? chip + 28 : Math.ceil(larguraTexto(`${n}.`, cn, { familia: "sans", peso: 700 })) + 24;
    const larg = area.w - gutter;
    const cd = Math.max(40, Math.round(c * 0.56));
    const gap = Math.round(c * 0.42);
    let altura = gap * (n - 1);
    const blocos = itens.map((it) => {
      const e = encaixar(it.texto, { largura: larg, max: c, min: c, linhas: maxLinhas, fonte: NEGRITO });
      const d = it.detalhe ? encaixar(it.detalhe, { largura: larg, max: cd, min: 34, linhas: 2, fonte: DETALHE }) : null;
      const h = e.linhas.length * c * 1.08 + (d ? d.linhas.length * d.corpo * 1.18 + 6 : 0);
      altura += h;
      return { e, d, h, ok: e.linhas.length <= maxLinhas && e.corpo === c };
    });
    return { c, cn, chip, gutter, blocos, gap, altura, ok: blocos.every((b) => b.ok) && altura <= area.h };
  };
  let escolha = null as ReturnType<typeof medir> | null;
  for (let c = 88; c >= 44 && !escolha; c -= 2) {
    const r = medir(c, 2);
    if (r.ok) escolha = r;
  }
  if (!escolha) {
    for (let c = 56; c >= 40 && !escolha; c -= 2) {
      const r = medir(c, 3);
      if (r.ok) escolha = r;
    }
  }
  if (!escolha) escolha = medir(40, 4);
  const { c, cn, chip, gutter, blocos, gap, altura } = escolha;
  const y0 = area.y + Math.max(0, (area.h - altura) / 2);
  const tops: number[] = [];
  let y = y0;
  blocos.forEach((b) => {
    tops.push(y);
    y += b.h + gap;
  });
  const margemChip = (c * 1.08 - chip) / 2;

  return (
    <>
      {comTitulo && m.titulo ? <TituloDoBloco titulo={m.titulo} R={R} t={t} palavras={palavras} de={m.de} ate={m.ate} /> : null}
      {/* o fio que liga os passos (desenha até o passo da vez) */}
      {ordenada
        ? itens.slice(1).map((it, k) => {
            const i = k + 1;
            const de = tops[i - 1] + margemChip + chip + 8;
            const ate = tops[i] + margemChip - 8;
            const p = prog(t, it.em - 0.25, 0.35);
            return p > 0 ? (
              <div key={`f${i}`} style={{ position: "absolute", left: area.x + chip / 2 - 1.75, top: de, width: 3.5, height: Math.max(0, ate - de) * p, background: cor.ameixa }} />
            ) : (
              <div key={`f${i}`} style={{ position: "absolute", left: area.x + chip / 2 - 1.5, top: de, width: 0, height: Math.max(0, ate - de), borderLeft: `3px dashed ${cor.lapis}` }} />
            );
          })
        : null}
      {itens.map((it, i) => {
        const b = blocos[i];
        const p = prog(t, it.em - 0.02, 0.25);
        const prox = itens[i + 1]?.em;
        const atual = t >= it.em - 0.02 && (prox === undefined || t < prox - 0.02);
        const dito = p > 0;
        const corTexto = ordenada && dito && !atual ? cor.cinza : cor.tinta;
        return (
          <div key={i} style={{ position: "absolute", left: area.x, top: tops[i], width: area.w, display: "flex", alignItems: "flex-start" }}>
            {ordenada ? (
              <div style={{ width: gutter, flex: "none", paddingTop: margemChip }}>
                <div
                  style={{
                    width: chip,
                    height: chip,
                    borderRadius: 12,
                    boxSizing: "border-box",
                    border: dito ? `3px solid ${cor.ameixa}` : `3px dashed ${cor.lapis}`,
                    background: dito ? (atual ? cor.ameixa : "transparent") : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: sans,
                    fontWeight: 700,
                    fontSize: Math.round(chip * 0.56),
                    color: dito ? (atual ? cor.claro : cor.ameixa) : cor.lapis,
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: gutter,
                  flex: "none",
                  height: c * 1.08,
                  display: "flex",
                  alignItems: "center",
                  fontFamily: sans,
                  fontWeight: 700,
                  fontSize: cn,
                  lineHeight: 1,
                  color: dito ? cor.ameixa : cor.lapis,
                }}
              >
                {i + 1}.
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <LinhasFaladas
                linhas={b.e.linhas}
                corpo={c}
                entrelinha={1.08}
                fonte={NEGRITO}
                tempos={temposJuntos(it.texto, it.em)}
                t={t}
                cor={corTexto}
                grifo={ordenada ? undefined : { em: it.em + 0.15, ate: prox !== undefined ? prox - 0.05 : undefined }}
              />
              {b.d && it.detalhe ? (
                <div style={{ marginTop: 6 }}>
                  <LinhasFaladas
                    linhas={b.d.linhas}
                    corpo={b.d.corpo}
                    entrelinha={1.18}
                    fonte={DETALHE}
                    tempos={temposJuntos(it.detalhe, it.em + 0.35, 0.04)}
                    t={t}
                    cor={cor.cinza}
                    esboco="nada"
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------- numero: o número como palavra-título ----------

const MOEDAS: [RegExp, string, string][] = [
  [/^R\$$/i, "real", "reais"],
  [/^(US\$|U\$|\$)$/i, "dólar", "dólares"],
  [/^€$/, "euro", "euros"],
  [/^£$/, "libra", "libras"],
];

// "oitenta e três mil dólares", "um milhão de reais", "trinta por cento" (null quando não dá)
export const numeroPorExtenso = (m: Numero) => {
  const suf = (m.sufixo ?? "").trim();
  const pre = (m.prefixo ?? "").trim();
  let mult = 1;
  let resto = suf;
  const escala = suf.match(/^(mil|mi|milhão|milhões|milhoes|bi|bilhão|bilhões|bilhoes)\b\.?\s*(.*)$/i);
  if (escala) {
    const e = escala[1].toLowerCase();
    mult = e === "mil" ? 1e3 : e.startsWith("mi") ? 1e6 : 1e9;
    resto = escala[2] ?? "";
  }
  const total = Math.round(m.valor * mult * 1e6) / 1e6;
  // por extenso só ajuda em número grande (83.000 → "oitenta e três mil"); "3 meses" já se lê
  if (total < 1000) return null;
  const palavras = porExtenso(total);
  if (!palavras) return null;
  const partes = [palavras];
  const de = /(milhão|milhões|bilhão|bilhões)$/.test(palavras) ? "de " : "";
  const moeda = MOEDAS.find(([r]) => r.test(pre));
  if (moeda) partes.push(`${de}${total === 1 ? moeda[1] : moeda[2]}`);
  if (resto === "%") partes.push("por cento");
  else if (resto && /^[\p{L} ]+$/u.test(resto)) partes.push(resto);
  return partes.join(" ");
};

export const NumeroBloco: React.FC<{ m: Numero; t: number; R: Regiao }> = ({ m, t, R }) => {
  const casas = m.casas ?? 0;
  const final = formatarNumero(m.valor, casas);
  const pre = m.prefixo?.trim();
  const suf = m.sufixo?.trim();
  const fN: Fonte = { familia: "serif", peso: 700 };
  const fA: Fonte = { familia: "italico", peso: 400 };
  const extenso = m.extenso === false ? null : numeroPorExtenso(m);
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;
  const apertado = R.h < 460;
  // a acepção (o rótulo) e o "por extenso"
  const eRotulo = encaixar(m.rotulo, { largura: R.w - 70, max: apertado ? 62 : 72, min: 44, linhas: 2, fonte: NEGRITO });
  const fExt: Fonte = { familia: "serif", peso: 400 };
  const textoExt = extenso ? `[${extenso}]` : "";
  const larguraEtiqueta = 250 + (m.ilustrativo ? 230 : 0);
  // "por extenso" (e "ilustrativo") ao lado do texto quando cabe numa linha só; senão, embaixo
  const eExtLinha = extenso ? encaixar(textoExt, { largura: R.w - larguraEtiqueta, max: 44, min: 36, linhas: 1, fonte: fExt }) : null;
  const extNaLinha = !!eExtLinha && eExtLinha.linhas.length === 1 && eExtLinha.corpo >= 36;
  const eExt = extenso ? (extNaLinha ? eExtLinha : encaixar(textoExt, { largura: R.w, max: 44, min: 34, linhas: 2, fonte: fExt })) : null;
  const alturaExt = eExt ? eExt.linhas.length * eExt.corpo * 1.18 + (extNaLinha ? 6 : 46) : m.ilustrativo ? 56 : 0;
  const alturaRotulo = eRotulo.linhas.length * eRotulo.corpo * 1.1;
  const disponivel = R.h - alturaExt - alturaRotulo - 46;
  const larguraTotal = (c: number) =>
    larguraTexto(final, c, fN) + (pre ? larguraTexto(pre, c * 0.36, fA) + c * 0.1 : 0) + (suf ? larguraTexto(suf, c * 0.36, fA) + c * 0.1 : 0);
  let c = Math.min(240, Math.max(90, Math.floor(disponivel / 1.02)));
  while (c > 80 && larguraTotal(c) > R.w) c -= 4;
  const total = c * 1.02 + alturaExt + 46 + alturaRotulo;
  const y0 = R.y + Math.max(0, (R.h - total) / 2);

  const pConta = prog(t, m.em - 0.02, 1.1);
  const valor = m.valor * pConta;
  const mostrado = formatarNumero(pConta >= 1 ? m.valor : casas ? valor : Math.round(valor), casas);
  const antes = t < m.em - 0.02;
  const yExt = y0 + c * 1.02 + 6;
  const yRotulo = yExt + alturaExt + 24;
  const pFio = prog(t, rotuloEm - 0.2, 0.4);
  return (
    <>
      <div style={{ position: "absolute", left: R.x, top: y0, width: R.w, height: c * 1.02, display: "flex", alignItems: "baseline", whiteSpace: "nowrap" }}>
        {antes ? (
          <div style={{ width: Math.min(R.w, larguraTotal(c)) * 0.8, height: c * 0.8, borderBottom: `5px dashed ${cor.lapis}` }} />
        ) : (
          <>
            {pre ? (
              <span style={{ ...familiaCss(fA), fontSize: c * 0.36, color: cor.cinza, marginRight: c * 0.1, ...impressao(t, m.em) }}>{pre}</span>
            ) : null}
            <span style={{ fontFamily: serif, fontWeight: 700, fontSize: c, lineHeight: 1, color: cor.ameixa, fontVariantNumeric: "tabular-nums lining-nums" }}>{mostrado}</span>
            {suf ? (
              <span style={{ ...familiaCss(fA), fontSize: c * 0.36, color: cor.cinza, marginLeft: c * 0.1, ...impressao(t, m.em + 0.1) }}>{suf}</span>
            ) : null}
          </>
        )}
      </div>
      {eExt || m.ilustrativo ? (
        <div style={{ position: "absolute", left: R.x, top: yExt, width: R.w, display: "flex", flexDirection: extNaLinha ? "row" : "column", alignItems: extNaLinha ? "center" : "flex-start", gap: extNaLinha ? 22 : 6, ...impressao(t, m.em + 1.0) }}>
          {eExt ? (
            <div style={{ flex: "none" }}>
              <LinhasFaladas linhas={eExt.linhas} corpo={eExt.corpo} entrelinha={1.18} fonte={fExt} t={t} cor={cor.cinza} esboco="nada" />
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {eExt ? <Letreiro texto="por extenso" corpo={30} style={{ opacity: 0.85 }} /> : null}
            {m.ilustrativo ? <Ilustrativo /> : null}
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: R.x, top: yRotulo - 16, width: R.w * pFio, height: 2.5, background: cor.fio }} />
      <div style={{ position: "absolute", left: R.x, top: yRotulo, width: R.w, display: "flex", alignItems: "flex-start" }}>
        <div style={{ width: 70, flex: "none", height: eRotulo.corpo * 1.1, display: "flex", alignItems: "center", fontFamily: sans, fontWeight: 700, fontSize: Math.round(eRotulo.corpo * 0.66), color: t >= rotuloEm - 0.02 ? cor.ameixa : cor.lapis }}>
          1.
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <LinhasFaladas
            linhas={eRotulo.linhas}
            corpo={eRotulo.corpo}
            entrelinha={1.1}
            fonte={NEGRITO}
            tempos={temposJuntos(m.rotulo, rotuloEm)}
            t={t}
            grifo={{ em: rotuloEm + 0.2 }}
          />
        </div>
      </div>
    </>
  );
};

// ---------- comparacao: dois cartões de nota lado a lado ----------

export const ComparacaoBloco: React.FC<{ m: Comparacao; t: number; R: Regiao; palavras: Palavra[]; comTitulo: boolean }> = ({
  m,
  t,
  R,
  palavras,
  comTitulo,
}) => {
  const area = semTitulo(R, m.titulo, comTitulo);
  const modo = m.modo ?? "contra";
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const ultimoEm = Math.max(m.lados[0].em, m.lados[1].em);
  const vencedorEm = m.vencedorEm ?? ultimoEm + 0.6;
  const VAO = 76;
  const PAD = 32;
  const w = (area.w - VAO) / 2;
  const fRotulo: Fonte = { familia: "sans", peso: 700, caixaAlta: true, espacamento: 0.12 };
  const medidas = m.lados.map((l) => {
    const r = encaixar(l.rotulo, { largura: w - 2 * PAD, max: 32, min: 28, linhas: 2, fonte: fRotulo });
    return { r, alturaR: r.linhas.length * r.corpo * 1.15 + 20 };
  });
  const alturaR = Math.max(...medidas.map((x) => x.alturaR));
  const maxTexto = Math.min(area.h, 470) - 2 * PAD - alturaR;
  const textos = m.lados.map((l) => encaixar(l.texto, { largura: w - 2 * PAD, max: 76, min: 44, linhas: 4, altura: maxTexto, entrelinha: 1.1, fonte: NEGRITO }));
  // os dois lados no mesmo corpo (o menor), para ficarem do mesmo peso
  const corpo = Math.min(...textos.map((x) => x.corpo));
  const linhas = m.lados.map((l) => encaixar(l.texto, { largura: w - 2 * PAD, max: corpo, min: corpo, linhas: 6, fonte: NEGRITO }).linhas);
  const alturaTexto = Math.max(...linhas.map((l) => l.length)) * corpo * 1.1;
  const h = Math.min(area.h, alturaR + alturaTexto + 2 * PAD + 8);
  const y = area.y + Math.max(0, (area.h - h) / 2);
  const glifo = modo === "contra" ? "×" : "→";
  const pGlifo = prog(t, m.lados[1].em - 0.15, 0.3);
  return (
    <>
      {comTitulo && m.titulo ? <TituloDoBloco titulo={m.titulo} R={R} t={t} palavras={palavras} de={m.de} ate={m.ate} /> : null}
      {m.lados.map((l, i) => {
        const x = area.x + i * (w + VAO);
        const pTinta = prog(t, l.em - 0.12, 0.3);
        const venceu = vencedor === i ? prog(t, vencedorEm, 0.3) : 0;
        const perdeu = vencedor !== undefined && vencedor !== i ? prog(t, vencedorEm, 0.3) : 0;
        const riscadas = modo === "errado-certo" && vencedor !== undefined && vencedor !== i ? new Set(palavrasDoTexto(l.texto).map((_, k) => k)) : undefined;
        const fim = i === 0 ? m.lados[1].em : m.ate;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 18, border: `3px dashed ${cor.lapis}`, opacity: 1 - pTinta }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 18,
                background: `rgba(250,248,242,${pTinta})`,
                boxShadow: pTinta > 0.5 ? sombraPapel : "none",
                outline: venceu > 0 ? `${4 * venceu}px solid ${cor.ameixa}` : undefined,
                outlineOffset: -2,
                transform: `translateY(${-6 * venceu}px)`,
              }}
            />
            <div style={{ position: "absolute", left: PAD, top: PAD, width: w - 2 * PAD, transform: `translateY(${-6 * venceu}px)` }}>
              <div style={{ height: alturaR }}>
                <LinhasFaladas
                  linhas={medidas[i].r.linhas}
                  corpo={medidas[i].r.corpo}
                  entrelinha={1.15}
                  fonte={fRotulo}
                  tempos={temposJuntos(l.rotulo, l.em - 0.12, 0.03)}
                  t={t}
                  cor={venceu > 0.5 ? cor.ameixa : cor.cinza}
                  esboco="nada"
                />
              </div>
              <LinhasFaladas
                linhas={linhas[i]}
                corpo={corpo}
                entrelinha={1.1}
                fonte={NEGRITO}
                tempos={temposDe(l.texto, palavras, l.em - 0.2, fim, l.em)}
                t={t}
                cor={perdeu > 0.5 ? cor.cinza : cor.tinta}
                riscadas={riscadas}
                riscoEm={riscadas ? vencedorEm : undefined}
                grifo={venceu > 0 ? { em: vencedorEm + 0.1 } : undefined}
              />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: area.x + w,
          top: y + h / 2 - 50,
          width: VAO,
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: serif,
          fontWeight: 700,
          fontSize: 76,
          lineHeight: 1,
          color: cor.ameixa,
          opacity: pGlifo,
          transform: `scale(${0.8 + 0.2 * pGlifo})`,
        }}
      >
        {glifo}
      </div>
    </>
  );
};

// ---------- destaque: o carimbo (alerta) ou o grifo (chave) ----------

export const DestaqueBloco: React.FC<{ m: Destaque; t: number; R: Regiao; palavras: Palavra[]; aoBater?: (p: number) => void }> = ({ m, t, R, palavras }) => {
  const alerta = m.nivel === "alerta";
  const detalheEm = m.detalheEm ?? m.em + 0.6;
  const eDet = m.detalhe ? encaixar(m.detalhe, { largura: R.w - 40, max: 56, min: 42, linhas: 2, fonte: DETALHE }) : null;
  const alturaDet = eDet ? eDet.linhas.length * eDet.corpo * 1.2 + 34 : 0;
  if (alerta) {
    const fonte: Fonte = { familia: "sans", peso: 800, caixaAlta: true, espacamento: 0.08 };
    const e = encaixar(m.texto, { largura: R.w - 150, max: 116, min: 56, linhas: 2, altura: R.h - alturaDet - 120, entrelinha: 1.05, fonte });
    const larguraCarimbo = Math.max(...e.linhas.map((l) => larguraTexto(l, e.corpo, fonte))) + e.corpo * 0.84 + 34;
    const alturaCarimbo = e.linhas.length * e.corpo * 1.05 + e.corpo * 0.42 + 34;
    const total = alturaCarimbo + alturaDet;
    const y = R.y + Math.max(10, (R.h - total) / 2);
    const p = prog(t, m.em - 0.02, 0.14, bate);
    const batido = t >= m.em - 0.02;
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: R.x + (R.w - larguraCarimbo) / 2,
            top: y,
            width: larguraCarimbo,
            height: alturaCarimbo,
            transform: `rotate(-4deg) scale(${batido ? 1.45 - 0.45 * p : 1})`,
          }}
        >
          {batido ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: `6px solid ${cor.ameixa}`,
                borderRadius: 20,
                padding: 7,
                opacity: limitar(p * 1.6) * 0.95,
                mixBlendMode: "multiply",
                background: "rgba(250,248,242,0.5)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  boxSizing: "border-box",
                  border: `2.5px solid ${cor.ameixa}`,
                  borderRadius: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LinhasFaladas linhas={e.linhas} corpo={e.corpo} entrelinha={1.05} fonte={fonte} t={t} cor={cor.ameixa} alinhar="center" esboco="nada" />
              </div>
            </div>
          ) : (
            // o lugar do carimbo, a lápis, até a palavra ser dita
            <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.lapis}`, borderRadius: 20 }} />
          )}
        </div>
        {eDet && m.detalhe ? (
          <div style={{ position: "absolute", left: R.x + 20, top: y + alturaCarimbo + 34, width: R.w - 40 }}>
            <LinhasFaladas
              linhas={eDet.linhas}
              corpo={eDet.corpo}
              entrelinha={1.2}
              fonte={DETALHE}
              tempos={temposDe(m.detalhe, palavras, detalheEm - 0.2, m.ate, detalheEm)}
              t={t}
              cor={cor.cinza}
              alinhar="center"
            />
          </div>
        ) : null}
      </>
    );
  }
  // chave: a frase grande, palavra por palavra, e o grifo ameixa passando por baixo
  const fonte: Fonte = { familia: "serif", peso: 800 };
  const e = encaixar(m.texto, { largura: R.w - 20, max: 140, min: 60, linhas: 3, altura: R.h - alturaDet - 20, entrelinha: 1.06, fonte });
  const tempos = temposDe(m.texto, palavras, m.de, m.ate, m.em);
  const fimTexto = Math.max(...tempos);
  const alturaTexto = e.linhas.length * e.corpo * 1.06;
  const y = R.y + Math.max(0, (R.h - alturaTexto - alturaDet) / 2);
  return (
    <>
      <div style={{ position: "absolute", left: R.x, top: y, width: R.w }}>
        <LinhasFaladas linhas={e.linhas} corpo={e.corpo} entrelinha={1.06} fonte={fonte} tempos={tempos} t={t} alinhar="center" grifo={{ em: fimTexto + 0.15 }} />
      </div>
      {eDet && m.detalhe ? (
        <div style={{ position: "absolute", left: R.x + 20, top: y + alturaTexto + 34, width: R.w - 40 }}>
          <LinhasFaladas
            linhas={eDet.linhas}
            corpo={eDet.corpo}
            entrelinha={1.2}
            fonte={DETALHE}
            tempos={temposDe(m.detalhe, palavras, detalheEm - 0.2, m.ate, detalheEm)}
            t={t}
            cor={cor.cinza}
            alinhar="center"
          />
        </div>
      ) : null}
    </>
  );
};

// ---------- definicao: o verbete simples ----------

export const DefinicaoBloco: React.FC<{ m: Definicao; t: number; R: Regiao; palavras: Palavra[] }> = ({ m, t, R: area, palavras }) => {
  let R = area;
  const silabas = silabasDe(m.termo, m.silabas);
  // uma linha grande quando cabe; senão até duas
  const umaLinha = quebrarPalavra(silabas, R.w - (m.classe ? (m.classe.length + 1) * 27 : 0), 132, 1, 60);
  const cabeUma = umaLinha.corpo >= 92;
  const titulo = cabeUma ? umaLinha : quebrarPalavra(silabas, R.w, 120, 2, 60);
  const alturaTitulo = titulo.linhas.length * titulo.corpo * 1.04;
  const pron = m.pronuncia;
  const alturaPron = pron || (!cabeUma && m.classe) ? alturaDaPronuncia(cabeUma ? undefined : m.classe, pron, R.w, 44) + 10 : 0;
  const eSent0 = encaixar(m.significado, { largura: R.w - 70, max: 80, min: 44, linhas: 3, altura: R.h - alturaTitulo - alturaPron - 44, entrelinha: 1.1, fonte: NEGRITO });
  // o verbete inteiro no meio da área (sem sobra vazia embaixo)
  const alturaTotal = alturaTitulo + alturaPron + 44 + eSent0.linhas.length * eSent0.corpo * 1.1;
  const y0 = R.y + Math.max(0, (R.h - alturaTotal) / 2.4);
  R = { ...R, y: y0 };
  const ySentido = R.y + alturaTitulo + alturaPron + 44;
  const eSent = eSent0;
  const tempos = temposDe(m.significado, palavras, m.significadoEm - 0.2, m.ate, m.significadoEm);
  const fim = Math.max(...tempos);
  return (
    <>
      <div style={{ position: "absolute", left: R.x, top: R.y, width: R.w }}>
        {/* o lugar da palavra-título, a lápis (uma lacuna por sílaba), até ela ser dita */}
        {t < m.em - 0.02
          ? titulo.linhas.map((idx, li) => (
              <div key={li} style={{ position: "relative", height: titulo.corpo * 1.04 }}>
                <Lacunas silabas={idx.map((i) => silabas[i])} corpo={titulo.corpo} />
              </div>
            ))
          : null}
        <PalavraTituloAnimada p={{ texto: m.termo, em: m.em, silabas: m.silabas }} t={t} largura={R.w} maximo={cabeUma ? 132 : 120} maxLinhas={cabeUma ? 1 : 2} classe={cabeUma ? m.classe : undefined} />
      </div>
      {pron || (!cabeUma && m.classe) ? (
        <div style={{ position: "absolute", left: R.x, top: R.y + alturaTitulo + 6, width: R.w }}>
          <Pronuncia texto={pron ?? ""} t={t} em={m.em + 0.36} corpo={44} classe={cabeUma ? undefined : m.classe} largura={R.w} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: R.x, top: ySentido - 22, width: R.w * prog(t, m.em + 0.3, 0.5), height: 2.5, background: cor.fio }} />
      <div style={{ position: "absolute", left: R.x, top: ySentido, width: R.w, display: "flex", alignItems: "flex-start" }}>
        <div
          style={{
            width: 70,
            flex: "none",
            height: eSent.corpo * 1.1,
            display: "flex",
            alignItems: "center",
            fontFamily: sans,
            fontWeight: 700,
            fontSize: Math.round(eSent.corpo * 0.66),
            color: t >= m.significadoEm - 0.02 ? cor.ameixa : cor.lapis,
          }}
        >
          1.
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <LinhasFaladas linhas={eSent.linhas} corpo={eSent.corpo} entrelinha={1.1} fonte={NEGRITO} tempos={tempos} t={t} grifo={{ em: fim + 0.2 }} />
        </div>
      </div>
    </>
  );
};

// ---------- frase: a epígrafe ----------

export const Epigrafe: React.FC<{ m: Frase; t: number; R: Regiao; palavras: Palavra[]; assinatura?: string }> = ({ m, t, R, palavras, assinatura }) => {
  const em = m.em ?? m.de;
  const fonte: Fonte = { familia: "italico", peso: 600 };
  const aspasCorpo = 150;
  const recuo = Math.round(larguraTexto("“", aspasCorpo, { familia: "serif", peso: 800 })) + 18;
  const alturaAssinatura = assinatura ? 64 : 0;
  const e = encaixar(m.texto, { largura: R.w - recuo, max: 92, min: 50, linhas: 4, altura: R.h - alturaAssinatura - 10, entrelinha: 1.14, fonte });
  const ws = palavrasDoTexto(m.texto);
  const tempos = temposDe(m.texto, palavras, m.de, m.ate, em);
  const marcadas = indicesDoTrecho(ws, m.destaque);
  const riscadas = indicesDoTrecho(ws, m.risco);
  const riscoEm = m.riscoEm ?? (riscadas.size ? Math.max(...[...riscadas].map((i) => tempos[i])) + 0.25 : undefined);
  const alturaTexto = e.linhas.length * e.corpo * 1.14;
  const y = R.y + Math.max(0, (R.h - alturaTexto - alturaAssinatura) / 2);
  const fim = Math.max(...tempos);
  const aspas = aspasCorpo;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: R.x - 4,
          top: y - aspas * 0.1,
          fontFamily: serif,
          fontWeight: 800,
          fontSize: aspas,
          lineHeight: 1,
          color: cor.ameixa,
          ...impressao(t, em - 0.1, 0.3),
        }}
      >
        “
      </div>
      <div style={{ position: "absolute", left: R.x + recuo, top: y, width: R.w - recuo }}>
        <LinhasFaladas
          linhas={e.linhas}
          corpo={e.corpo}
          entrelinha={1.14}
          fonte={fonte}
          tempos={tempos}
          t={t}
          marcadas={marcadas}
          estiloMarcadas={{ color: cor.ameixa, fontWeight: 700 }}
          riscadas={riscadas.size ? riscadas : undefined}
          riscoEm={riscoEm}
        />
        {assinatura ? (
          <div style={{ marginTop: 26, ...impressao(t, fim + 0.3) }}>
            <Letreiro texto={`— ${assinatura}`} corpo={30} />
          </div>
        ) : null}
      </div>
    </>
  );
};

// ---------- pergunta ----------

export const PerguntaBloco: React.FC<{ m: Pergunta; t: number; R: Regiao; palavras: Palavra[] }> = ({ m, t, R, palavras }) => {
  const em = m.em ?? m.de;
  const opcoes = m.opcoes ?? [];
  const fOpcao: Fonte = { familia: "serif", peso: 600 };
  const LETRA = 66;
  // a pergunta fica grande; as opções diminuem primeiro (e só quebram em duas linhas se precisar)
  const medir = (maxQ: number, maxO: number, linhasO: number) => {
    const largQ = R.w - 150;
    const q = encaixar(m.texto, { largura: largQ, max: maxQ, min: 48, linhas: 3, entrelinha: 1.06, fonte: NEGRITO });
    const alturaQ = q.linhas.length * q.corpo * 1.06;
    const ops = opcoes.map((o) => encaixar(o.texto, { largura: R.w - LETRA, max: maxO, min: 40, linhas: linhasO, entrelinha: 1.12, fonte: fOpcao }));
    const alturaOps = ops.reduce((s, o) => s + o.linhas.length * o.corpo * 1.12 + 18, 0);
    return { q, alturaQ, ops, alturaOps, total: alturaQ + (ops.length ? 40 + alturaOps : 0) };
  };
  let r = medir(96, 60, 1);
  for (let c = 60; r.total > R.h && c >= 44; c -= 2) r = medir(96, c, 1);
  if (r.total > R.h) r = medir(96, 52, 2);
  for (let c = 94; r.total > R.h && c >= 48; c -= 2) r = medir(c, 48, 2);
  const { q, alturaQ, ops, alturaOps } = r;
  const y = R.y + Math.max(0, (R.h - r.total) / 2);
  const tempos = temposDe(m.texto, palavras, m.de, m.ate, em);
  const corpoInterrogacao = Math.min(260, Math.max(140, alturaQ * 1.1));
  const largInterrogacao = larguraTexto("?", corpoInterrogacao, { familia: "serif", peso: 800 }) + 30;
  let yo = y + alturaQ + 40;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: R.x,
          top: y + alturaQ / 2 - corpoInterrogacao * 0.52,
          width: largInterrogacao,
          fontFamily: serif,
          fontWeight: 800,
          fontSize: corpoInterrogacao,
          lineHeight: 1,
          color: cor.ameixa,
          ...impressao(t, em - 0.1, 0.32),
        }}
      >
        ?
      </div>
      <div style={{ position: "absolute", left: R.x + largInterrogacao, top: y - 4, width: 2.5, height: alturaQ + 8, background: cor.fio }} />
      <div style={{ position: "absolute", left: R.x + largInterrogacao + 34, top: y, width: R.w - largInterrogacao - 34 }}>
        <LinhasFaladas linhas={q.linhas} corpo={q.corpo} entrelinha={1.06} fonte={NEGRITO} tempos={tempos} t={t} />
      </div>
      {opcoes.map((o, i) => {
        const e = ops[i];
        const top = yo;
        yo += e.linhas.length * e.corpo * 1.12 + 18;
        const dita = t >= o.em - 0.02;
        return (
          <div key={i} style={{ position: "absolute", left: R.x, top, width: R.w, display: "flex", alignItems: "flex-start" }}>
            <div
              style={{
                width: LETRA,
                flex: "none",
                height: e.corpo * 1.12,
                display: "flex",
                alignItems: "center",
                fontFamily: sans,
                fontWeight: 700,
                fontSize: Math.round(e.corpo * 0.74),
                color: dita ? cor.ameixa : cor.lapis,
              }}
            >
              {String.fromCharCode(97 + i)})
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <LinhasFaladas
                linhas={e.linhas}
                corpo={e.corpo}
                entrelinha={1.12}
                fonte={fOpcao}
                tempos={temposDe(o.texto, palavras, o.em - 0.2, opcoes[i + 1]?.em ?? m.ate, o.em)}
                t={t}
              />
            </div>
          </div>
        );
      })}
      {alturaOps ? null : null}
    </>
  );
};
