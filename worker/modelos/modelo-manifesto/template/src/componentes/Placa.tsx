import { firme, prog, temposPorConteudo, troca } from "../anim";
import type { Destaque, Numero, Palavra } from "../plano";
import { APERTO, CAMPOS, caixaAlta, display, encaixar, larguraEm, letreiro, numeroBR, QUADRO, quebrarMono } from "../tema";

// A placa: um pequeno pôster na altura do peito, por cima do quadro cheio (a pessoa continua
// inteira). É o lugar do número e do destaque. Entra varrendo da esquerda com tudo "a lápis";
// a tinta corre na fala; o texto grande é vazado (o vídeo aparece dentro das letras) quando é
// grande o bastante para ler assim; no campo preto, é tinta clara. Sai varrendo para a direita
// (ou some no corte do próximo pôster).
export const PLACA_LARGURA = 920;
const PAD = 36;
const MONO = 32;
const INTERNO = PLACA_LARGURA - 2 * PAD;
const MARCA = 12;
// o texto grande é vazado só quando é grande de verdade (uma palavra, um número); frase mais longa
// sai em tinta clara, que lê melhor no celular
const VAZADO_MIN = 118;

// "%" encosta no número; "mil", "ao ano" ficam com um respiro
const vaoSufixo = (suf: string) => (/^%/.test(suf) ? 0.05 : 0.16);
const casasDe = (v: number) => Math.min(2, (String(v).split(".")[1] ?? "").length);

type Linha = { texto: string; y: number; tamanho: number; peso: 700 | 900; tempos: number[] };

const medirNumero = (m: Numero) => {
  const casas = m.casas ?? casasDe(m.valor);
  const final = numeroBR(m.valor, casas);
  const pre = m.prefixo?.trim() ?? "";
  const suf = m.sufixo?.trim() ?? "";
  const em = larguraEm(final, 900, APERTO) + (pre ? 0.42 * larguraEm(pre, 700) + 0.16 : 0) + (suf ? 0.42 * larguraEm(suf, 700) + vaoSufixo(suf) : 0);
  const tam = Math.max(72, Math.min(176, Math.floor(INTERNO / em)));
  return { casas, final, pre, suf, tam };
};

export const alturaDaPlaca = (m: Numero | Destaque) => {
  if (m.tipo === "numero") {
    const { tam } = medirNumero(m);
    const rot = quebrarMono(m.rotulo, INTERNO - (m.ilustrativo ? 320 : 0), MONO).length;
    return PAD + rot * (MONO + 10) + 14 + tam * 0.78 + 30 + MARCA + PAD;
  }
  const e = encaixar(m.texto.split(/\s+/), INTERNO, 150, 64, 2, 900);
  const det = m.detalhe ? encaixar(m.detalhe.split(/\s+/), INTERNO, 44, 40, 2, 700) : null;
  return PAD + e.linhas.length * e.tamanho + (e.linhas.length - 1) * 16 + (m.nivel === "alerta" ? 34 : 0) + (det ? 22 + det.linhas.length * 52 : 0) + PAD;
};

export const Placa: React.FC<{ m: Numero | Destaque; t: number; topo: number; fim: number; saiSeco: boolean; palavras: Palavra[] }> = ({
  m,
  t,
  topo,
  fim,
  saiSeco,
  palavras,
}) => {
  const entra = prog(t, m.de, 0.22, troca);
  const sai = saiSeco ? 0 : prog(t, fim - 0.2, 0.2, troca);
  // saindo seca (um pôster entra por cima), fica por baixo até o pôster cobrir e some
  if (entra <= 0 || sai >= 1 || (saiSeco && t >= fim + 0.25)) return null;
  const campo = m.campo ?? (m.tipo === "destaque" && m.nivel === "alerta" ? "preto" : "cobalto");
  const c = CAMPOS[campo];
  const altura = alturaDaPlaca(m);
  const x = (QUADRO.w - PLACA_LARGURA) / 2;
  const id = `placa${String(m.de).replace(/[^0-9]/g, "")}`;

  // ——— o conteúdo: linhas grandes (vazadas ou tinta) e as pequenas ———
  const grandes: Linha[] = [];
  let pequenas: React.ReactNode = null;
  let extra: React.ReactNode = null;
  let vazado = campo !== "preto";

  if (m.tipo === "numero") {
    const { casas, final, pre, suf, tam } = medirNumero(m);
    const rotLinhas = quebrarMono(m.rotulo, INTERNO - (m.ilustrativo ? 320 : 0), MONO);
    const rotEm = m.rotuloEm ?? Math.min(m.em, m.de + 0.1);
    const pRot = prog(t, rotEm - 0.04, 0.26);
    const yNum = PAD + rotLinhas.length * (MONO + 10) + 14;
    const conta = prog(t, m.em - 0.03, 1.1, firme);
    const agora = t < m.em - 0.03 ? final : numeroBR(m.valor * conta, casas);
    vazado = vazado && tam >= 96;
    const wNum = larguraEm(final, 900, APERTO) * tam;
    const wPre = pre ? 0.42 * larguraEm(pre, 700) * tam + 0.16 * tam : 0;
    const wSuf = suf ? 0.42 * larguraEm(suf, 700) * tam + vaoSufixo(suf) * tam : 0;
    const x0 = (PLACA_LARGURA - (wNum + wPre + wSuf)) / 2;
    grandes.push({ texto: agora, y: yNum, tamanho: tam, peso: 900, tempos: [m.em] });
    const baseNum = yNum + tam * 0.768;
    // o número "a lápis" antes de contar, e a tinta que conta a partir de `em`
    pequenas = (
      <>
        {pRot < 1
          ? rotLinhas.map((l, j) => (
              <div key={`l${j}`} style={{ ...letreiro, position: "absolute", left: PAD, top: PAD + j * (MONO + 10), color: c.lapis }}>
                {l}
              </div>
            ))
          : null}
        {pRot > 0
          ? rotLinhas.map((l, j) => (
              <div key={j} style={{ ...letreiro, position: "absolute", left: PAD, top: PAD + j * (MONO + 10), color: c.letreiro, clipPath: pRot < 1 ? `inset(-0.3em ${(1 - pRot) * 100}% -0.3em 0)` : undefined }}>
                {l}
              </div>
            ))
          : null}
        {m.ilustrativo ? (
          <div style={{ ...letreiro, position: "absolute", right: PAD, top: PAD - 6, color: c.letreiro, border: `3px solid ${c.letreiro}`, padding: "6px 12px 4px" }}>ilustrativo</div>
        ) : null}
        <svg width={PLACA_LARGURA} height={altura} style={{ position: "absolute", inset: 0 }}>
          {pre ? (
            <text x={x0} y={baseNum} fontFamily={display} fontWeight={700} fontSize={0.42 * tam} fill={t >= m.em - 0.03 ? c.texto : c.lapis}>
              {caixaAlta(pre)}
            </text>
          ) : null}
          {suf ? (
            <text x={x0 + wPre + wNum + vaoSufixo(suf) * tam} y={baseNum} fontFamily={display} fontWeight={700} fontSize={0.42 * tam} fill={t >= m.em - 0.03 ? c.texto : c.lapis}>
              {caixaAlta(suf)}
            </text>
          ) : null}
        </svg>
      </>
    );
    // marcas que acendem enquanto o número conta
    extra = (
      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD, height: MARCA, display: "flex", gap: 10 }}>
        {Array.from({ length: 12 }, (_, i) => {
          const acesa = conta * 12 > i + 0.5;
          return <div key={i} style={{ flex: 1, background: acesa ? c.texto : c.lapis, opacity: acesa ? 1 : 1 }} />;
        })}
      </div>
    );
    // posição horizontal do número: o texto é centrado no espaço dele
    grandes[0] = { ...grandes[0] };
    (grandes[0] as Linha & { cx?: number }).cx = x0 + wPre + wNum / 2;
  } else {
    const e = encaixar(m.texto.split(/\s+/), INTERNO, 150, 64, 2, 900);
    vazado = vazado && e.tamanho >= VAZADO_MIN && e.linhas.length === 1;
    const tempos = temposPorConteudo(m.texto, m.em, palavras, fim);
    let k = 0;
    e.linhas.forEach((l, j) => {
      grandes.push({ texto: l.join(" "), y: PAD + j * (e.tamanho + 16), tamanho: e.tamanho, peso: e.peso === 700 ? 700 : 900, tempos: tempos.slice(k, k + l.length) });
      k += l.length;
    });
    const fimTexto = PAD + e.linhas.length * e.tamanho + (e.linhas.length - 1) * 16;
    let y = fimTexto;
    if (m.nivel === "alerta") {
      const p = prog(t, m.em + 0.1, 0.4, troca);
      const w = Math.max(...e.linhas.map((l) => larguraEm(l.join(" "), e.peso, APERTO))) * e.tamanho;
      extra = <div style={{ position: "absolute", left: (PLACA_LARGURA - w) / 2, top: y + 16, width: w * p, height: 12, background: c.acento }} />;
      y += 34;
    }
    if (m.detalhe) {
      const d = encaixar(m.detalhe.split(/\s+/), INTERNO, 44, 40, 2, 700);
      const em = m.detalheEm ?? (tempos[tempos.length - 1] ?? m.em) + 0.3;
      const p = prog(t, em - 0.04, 0.3);
      pequenas = d.linhas.map((l, j) => (
        <div key={j} style={{ position: "absolute", left: 0, right: 0, top: y + 22 + j * 52, textAlign: "center", fontFamily: display, fontWeight: 700, fontSize: d.tamanho, lineHeight: 1, letterSpacing: `${APERTO}em`, color: p > 0 ? c.texto : c.lapis, clipPath: p > 0 && p < 1 ? `inset(-0.3em ${(1 - p) * 100}% -0.3em 0)` : undefined }}>
          {caixaAlta(l.join(" "))}
        </div>
      ));
    }
  }

  // tinta de cada linha grande: corre da esquerda para a direita, da primeira à última palavra dita
  const tintaDe = (l: Linha) => {
    const a = l.tempos[0] ?? m.de;
    const b = (l.tempos[l.tempos.length - 1] ?? a) + 0.28;
    return m.tipo === "numero" ? (t >= a - 0.03 ? 1 : 0) : prog(t, a - 0.04, Math.max(0.2, b - a), (x) => x);
  };
  const cxDe = (l: Linha) => (l as Linha & { cx?: number }).cx ?? PLACA_LARGURA / 2;
  const textoSvg = (l: Linha, cor: string, extraProps: Record<string, string> = {}) => (
    <text
      x={cxDe(l) - (APERTO * l.tamanho) / 2}
      y={l.y + l.tamanho * 0.768}
      textAnchor="middle"
      fontFamily={display}
      fontWeight={l.peso}
      fontSize={l.tamanho}
      letterSpacing={APERTO * l.tamanho}
      wordSpacing={0.16 * l.tamanho}
      fill={cor}
      {...extraProps}
    >
      {caixaAlta(l.texto)}
    </text>
  );

  return (
    <div style={{ position: "absolute", left: x, top: topo, width: PLACA_LARGURA, height: altura, clipPath: `inset(0 ${(1 - entra) * 100}% 0 ${sai * 100}%)` }}>
      <svg width={PLACA_LARGURA} height={altura} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {grandes.map((l, i) => {
            const p = tintaDe(l);
            return (
              <g key={i}>
                <clipPath id={`${id}-t${i}`}>
                  <rect x={0} y={0} width={PLACA_LARGURA * p} height={altura} />
                </clipPath>
                <clipPath id={`${id}-l${i}`}>
                  <rect x={PLACA_LARGURA * p} y={0} width={PLACA_LARGURA * (1 - p)} height={altura} />
                </clipPath>
              </g>
            );
          })}
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={PLACA_LARGURA} height={altura}>
            <rect width={PLACA_LARGURA} height={altura} fill="white" />
            {vazado ? grandes.map((l, i) => <g key={i}>{textoSvg(l, "black", { clipPath: `url(#${id}-t${i})` })}</g>) : null}
          </mask>
        </defs>
        <rect width={PLACA_LARGURA} height={altura} fill={c.fundo} mask={`url(#${id}-m)`} />
        {grandes.map((l, i) => {
          const p = tintaDe(l);
          return (
            <g key={i}>
              {p < 1 ? textoSvg(l, c.lapis, { clipPath: `url(#${id}-l${i})` }) : null}
              {!vazado && p > 0 ? textoSvg(l, c.texto, p < 1 ? { clipPath: `url(#${id}-t${i})` } : {}) : null}
            </g>
          );
        })}
      </svg>
      {pequenas}
      {extra}
    </div>
  );
};
