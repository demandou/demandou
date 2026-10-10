// Os blocos universais que acontecem NA CARTA (a pessoa na ocular): topicos, passos, numero,
// comparacao, grafico, definicao e a assinatura generalizada, constelacao. Tudo na linguagem da
// carta celeste: cada coisa dita é uma estrela que acende e ganha nome; sequências se ligam por
// linhas; o que "leva a algum lugar" ganha a reta vermelha tracejada até uma cruz; o localizador
// vermelho vai sempre ao que está sendo dito. Antes da palavra, tudo já está lá a lápis.
import { gira, limitar, mistura, prog, temposDoTexto } from "../anim";
import { type Areas, cortarTopo, type Ret } from "../layout";
import { type Encaixe, encaixar, encaixarTodos, type Fonte, fimRedondo, formatarNumero, larguraTexto, numeroCurto } from "../medida";
import type { Comparacao, Constelacao, Definicao, Grafico, Numero, Palavra, Passos, Topicos } from "../plano";
import { cor, H, sans, serifa, W } from "../tema";
import { Cruz, Estrela, estiloLetreiro, estiloNome, type Foco, Ilustrativo, Ligacao, LinhasAcesas, Localizador, type P, QuatroPontas, Tracejado } from "./Desenho";
import { Rosa } from "./Rosa";

export type PropsBloco = { areas: Areas; t: number; palavras: Palavra[]; inicio: number; fim: number };

const ITALICO: Fonte = { italico: true, peso: 500 };
const SERIFA: Fonte = { peso: 500 };
const SERIFA_FORTE: Fonte = { peso: 600 };
const FONTE_LETREIRO: Fonte = { familia: "sans", peso: 700, espacamento: 0.16, caixaAlta: true };
const FONTE_DETALHE: Fonte = { familia: "sans", peso: 500 };

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const alturaEnc = (e: Encaixe | null, entrelinha = 1.1) => (e ? e.linhas.length * e.tamanho * entrelinha : 0);

// ---------------------------------------------------------------- cabeçalho (título do bloco)

type Cab = { enc: Encaixe; x: number; y: number; w: number; centro?: boolean } | null;

export const layoutCabecalho = (titulo: string | undefined, areas: Areas): { cab: Cab; corpo: Ret } => {
  if (!titulo?.trim()) return { cab: null, corpo: areas.corpo };
  if (areas.cab) {
    // no quadro deitado o título fica na coluna da ocular (embaixo ou em cima dela), centralizado,
    // em até 2 linhas: a faixa é larga e baixa
    const enc = encaixar(titulo, { largura: areas.cab.w, max: 80, min: 52, linhas: 2, fonte: ITALICO });
    const h = alturaEnc(enc) + 24;
    return { cab: { enc, x: areas.cab.x, y: areas.cab.y + (areas.cab.h - h) / 2, w: areas.cab.w, centro: areas.centrar }, corpo: areas.corpo };
  }
  const enc = encaixar(titulo, { largura: areas.corpo.w, max: 88, min: 60, linhas: 2, fonte: ITALICO });
  const h = alturaEnc(enc) + 24;
  const { resto } = cortarTopo(areas.corpo, h, 44);
  return { cab: { enc, x: areas.corpo.x, y: areas.corpo.y, w: areas.corpo.w }, corpo: resto };
};

const Cabecalho: React.FC<{ cab: Cab; texto: string; t: number; palavras: Palavra[]; inicio: number; fim: number; em?: number }> = ({ cab, texto, t, palavras, inicio, fim, em }) => {
  if (!cab) return null;
  const tempos = temposDoTexto(texto, palavras, (em ?? inicio) - 0.3, fim, (em ?? inicio) + 0.1);
  const ultima = Math.max(...tempos);
  const larg = Math.max(...cab.enc.linhas.map((l) => larguraTexto(l, cab.enc.tamanho, ITALICO)));
  return (
    <div style={{ position: "absolute", left: cab.x, top: cab.y, width: cab.w, display: "flex", flexDirection: "column", alignItems: cab.centro ? "center" : "flex-start" }}>
      <LinhasAcesas enc={cab.enc} tempos={tempos} t={t} estilo={estiloNome(cab.enc.tamanho)} alinhar={cab.centro ? "center" : "flex-start"} />
      <div style={{ marginTop: 10, height: 2.5, width: larg * prog(t, ultima + 0.1, 0.6, gira), background: cor.textoSuave, opacity: 0.75 }} />
    </div>
  );
};

// ---------------------------------------------------------------- topicos e passos

const JITTER = [28, 72, 14, 60, 40];
const RAIOS = [12.5, 10.5, 13, 10, 11.5];

const layoutLista = (m: Topicos | Passos, areas: Areas) => {
  const { cab, corpo } = layoutCabecalho(m.titulo, areas);
  const numerado = m.tipo === "passos";
  const xTexto = corpo.x + (numerado ? 206 : 172);
  const largura = corpo.x + corpo.w - xTexto;
  const n = m.itens.length;
  let max = 92;
  let encs: Encaixe[] = [];
  let dets: (Encaixe | null)[] = [];
  let alturas: number[] = [];
  for (;;) {
    encs = encaixarTodos(
      m.itens.map((i) => i.texto),
      { largura, max, min: Math.min(max, 48), linhas: 2, fonte: SERIFA },
    );
    dets = m.itens.map((i) => (i.detalhe?.trim() ? encaixar(i.detalhe, { largura, max: 42, min: 36, linhas: 2, fonte: FONTE_DETALHE }) : null));
    alturas = encs.map((e, i) => alturaEnc(e, 1.08) + (dets[i] ? 10 + alturaEnc(dets[i], 1.22) : 0));
    if (soma(alturas) + 40 * (n - 1) <= corpo.h * 0.92 || max <= 48) break;
    max -= 4;
  }
  const gap = limitar((corpo.h - soma(alturas)) / (n + 0.6), 40, 170);
  const bloco = soma(alturas) + gap * (n - 1);
  let y = corpo.y + (corpo.h - bloco) / 2;
  const linhas = m.itens.map((it, i) => {
    const topo = y;
    y += alturas[i] + gap;
    const ey = topo + encs[i].tamanho * 0.6;
    const ex = corpo.x + (numerado ? 92 + JITTER[i % 5] * 0.5 : 24 + JITTER[i % 5]);
    return { it, topo, ex, ey, r: RAIOS[i % 5], enc: encs[i], det: dets[i] };
  });
  return { cab, corpo, xTexto, largura, linhas, numerado };
};

export const Lista: React.FC<PropsBloco & { m: Topicos | Passos }> = ({ m, areas, t, palavras, inicio, fim }) => {
  const L = layoutLista(m, areas);
  const focos: Foco[] = L.linhas.map((l) => ({ em: l.it.em, x: l.ex, y: l.ey, r: 44 }));
  const ultimo = L.linhas[L.linhas.length - 1];
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {L.numerado
          ? L.linhas.slice(1).map((l, i) => {
              const a = L.linhas[i];
              return <Ligacao key={`lg-${i}`} a={{ x: a.ex, y: a.ey }} b={{ x: l.ex, y: l.ey }} ra={a.r} rb={l.r} t={t} em={l.it.em} />;
            })
          : null}
        {L.linhas.map((l, i) => (
          <Estrela key={`e-${i}`} x={l.ex} y={l.ey} r={l.r} t={t} em={l.it.em} brilhoEm={L.numerado && l === ultimo ? l.it.em + 0.35 : undefined} />
        ))}
        <Localizador focos={focos} t={t} vida={1} inicio={inicio} />
      </svg>
      <Cabecalho cab={L.cab} texto={m.titulo ?? ""} t={t} palavras={palavras} inicio={inicio} fim={L.linhas[0]?.it.em ?? fim} />
      {L.linhas.map((l, i) => {
        const prox = L.linhas[i + 1]?.it.em ?? fim;
        const tempos = temposDoTexto(l.it.texto, palavras, l.it.em - 0.2, prox, l.it.em);
        const temposDet = l.it.detalhe ? temposDoTexto(l.it.detalhe, palavras, l.it.em, prox + 0.5, l.it.em + 0.3) : [];
        return (
          <div key={`t-${i}`} style={{ position: "absolute", left: L.xTexto, top: l.topo, width: L.largura }}>
            <LinhasAcesas enc={l.enc} tempos={tempos} t={t} estilo={{ fontFamily: serifa, fontWeight: 500 }} entrelinha={1.08} />
            {l.det ? (
              <div style={{ marginTop: 10 }}>
                <LinhasAcesas enc={l.det} tempos={temposDet} t={t} cor={cor.textoSuave} estilo={{ fontFamily: sans, fontWeight: 500 }} entrelinha={1.22} />
              </div>
            ) : null}
            {L.numerado ? (
              <div
                style={{
                  position: "absolute",
                  left: L.corpo.x - L.xTexto,
                  top: l.ey - l.topo,
                  transform: "translateY(-50%)",
                  ...estiloLetreiro(36),
                  letterSpacing: 0,
                  color: prog(t, l.it.em - 0.05, 0.3) > 0.5 ? cor.texto : cor.textoSuave,
                }}
              >
                {i + 1}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- numero

const prefixoDe = (m: Numero) => (m.prefixo?.trim() ? m.prefixo.trim() : "");
const sufixoDe = (m: Numero) => (m.sufixo?.trim() ? m.sufixo.trim() : "");

const medirNumero = (m: Numero, largura: number, maximo: number) => {
  const final = formatarNumero(m.valor, m.casas ?? 0);
  const pre = prefixoDe(m);
  const suf = sufixoDe(m);
  for (let S = maximo; S >= 96; S -= 4) {
    const w = larguraTexto(final, S, SERIFA) + (pre ? larguraTexto(pre, S * 0.4, SERIFA) + S * 0.14 : 0) + (suf ? larguraTexto(suf, suf === "%" ? S * 0.6 : S * 0.4, SERIFA) + S * 0.08 : 0);
    if (w <= largura) return S;
  }
  return 96;
};

export const tipoDoNumero = (m: Numero) => {
  const suf = sufixoDe(m);
  if (suf === "%") return "porcento" as const;
  if (Number.isInteger(m.valor) && m.valor >= 1 && m.valor <= 12 && !prefixoDe(m) && !(m.casas ?? 0)) return "contagem" as const;
  return "regua" as const;
};
export const duracaoDoNumero = (m: Numero) => (tipoDoNumero(m) === "contagem" ? Math.min(0.35, 1.8 / m.valor) * m.valor : 1.3);

// O número que conta, com o desenho embaixo: estrelas que enchem (até 12), um anel graduado (%) ou
// uma régua com a reta vermelha correndo até a cruz (qualquer outro número).
export const NumeroDesenho: React.FC<{ m: Numero; r: Ret; centro: boolean; t: number; palavras: Palavra[]; inicio: number; fim: number; rotuloFora?: Ret | null }> = ({
  m,
  r,
  centro,
  t,
  palavras,
  inicio,
  fim,
  rotuloFora,
}) => {
  const tipo = tipoDoNumero(m);
  const pre = prefixoDe(m);
  const suf = sufixoDe(m);
  const rotEnc = encaixar(m.rotulo, { largura: (rotuloFora ? rotuloFora.w : centro ? r.w - 140 : r.w) * 0.95, max: 44, min: 32, linhas: rotuloFora ? 3 : 2, fonte: FONTE_LETREIRO });
  const S0 = medirNumero(m, r.w, centro ? 220 : 270);
  const dur = duracaoDoNumero(m);
  const u = prog(t, m.em, dur, (x) => 1 - Math.pow(1 - x, 3));
  const n = tipo === "contagem" ? m.valor : 0;
  const ritmo = n ? Math.min(0.35, 1.8 / n) : 0;
  const cheios = n ? Math.max(0, Math.min(n, Math.floor((t - m.em) / ritmo + 1))) : 0;
  const valorAgora = tipo === "contagem" ? (t >= m.em ? cheios : 0) : m.valor * u;
  const texto = formatarNumero(tipo === "contagem" ? valorAgora : valorAgora, m.casas ?? 0);
  const comecou = t >= m.em - 0.05;
  // alturas
  const hRot = rotuloFora ? 0 : alturaEnc(rotEnc, 1.2) + 18;
  // o número diminui se o bloco todo não couber na altura (gravação de perto deixa pouco peito)
  const hVisPrevia = tipo === "contagem" ? (m.valor > 6 ? 156 : 70) : tipo === "porcento" ? 2 * (centro && !rotuloFora && r.h < 500 ? 104 : 150) + 90 : 110;
  const S = Math.max(96, Math.min(S0, (r.h - hRot - 26 - hVisPrevia) / 1.02));
  const hNum = S * 1.02;
  const RW = Math.min(r.w, centro ? 820 : r.w);
  const R_ANEL = centro && !rotuloFora && r.h < 500 ? 104 : 150;
  const hVis = tipo === "contagem" ? (n > 6 ? 2 * 70 + 16 : 70) : tipo === "porcento" ? 2 * R_ANEL + 90 : 110;
  const total = hRot + hNum + 26 + hVis;
  const y0 = r.y + Math.max(0, (r.h - total) / 2);
  const xEsq = centro ? r.x + (r.w - RW) / 2 : r.x;
  const tRot = temposDoTexto(m.rotulo, palavras, (m.rotuloEm ?? inicio) - 0.3, fim, (m.rotuloEm ?? inicio) + 0.05);
  const yVis = y0 + hRot + hNum + 26;
  // régua
  const fimR = fimRedondo(m.valor);
  const xv = xEsq + 10 + (RW - 20) * limitar((tipo === "regua" ? valorAgora : 0) / fimR, 0, 1);
  const yR = yVis + 26;
  const chegou = m.em + dur;
  const rotulo = (
    <div style={{ display: "flex", alignItems: "center", gap: 18, justifyContent: centro ? "center" : "flex-start" }}>
      {centro ? <div style={{ width: 44, height: 2.5, background: cor.textoSuave, flex: "none" }} /> : null}
      <LinhasAcesas enc={rotEnc} tempos={tRot} t={t} rascunho={0.25} alinhar={centro ? "center" : "flex-start"} estilo={estiloLetreiro(rotEnc.tamanho)} entrelinha={1.2} />
      {centro ? <div style={{ width: 44, height: 2.5, background: cor.textoSuave, flex: "none" }} /> : null}
    </div>
  );
  return (
    <>
      {rotuloFora ? (
        <div style={{ position: "absolute", left: rotuloFora.x, top: rotuloFora.y + (rotuloFora.h - alturaEnc(rotEnc, 1.2)) / 2, width: rotuloFora.w }}>{rotulo}</div>
      ) : (
        <div style={{ position: "absolute", left: r.x, top: y0, width: r.w }}>{rotulo}</div>
      )}
      <div
        style={{
          position: "absolute",
          left: r.x,
          top: y0 + hRot,
          width: r.w,
          height: hNum,
          display: "flex",
          alignItems: "baseline",
          justifyContent: centro ? "center" : "flex-start",
          gap: S * 0.1,
          fontFamily: serifa,
          fontWeight: 500,
          color: cor.texto,
          lineHeight: 1,
          fontVariantNumeric: "lining-nums tabular-nums",
          opacity: comecou ? 1 : 0.22,
        }}
      >
        {pre ? <span style={{ fontSize: S * 0.4 }}>{pre}</span> : null}
        <span style={{ fontSize: S }}>{texto}</span>
        {suf ? <span style={{ fontSize: suf === "%" ? S * 0.6 : S * 0.4 }}>{suf}</span> : null}
      </div>
      {m.ilustrativo ? <Ilustrativo x={r.x + r.w} y={r.y - 8} t={t} em={inicio + 0.3} /> : null}
      {tipo === "contagem" ? (
        <div style={{ position: "absolute", left: xEsq, top: yVis, width: RW, display: "flex", flexWrap: "wrap", gap: 18, justifyContent: centro ? "center" : "flex-start", rowGap: 16 }}>
          {Array.from({ length: n }).map((_, j) => (
            <QuatroPontas key={j} tamanho={60} cheia={prog(t, m.em + j * ritmo - 0.04, 0.3)} />
          ))}
        </div>
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {tipo === "regua" ? (
          <g>
            <line x1={xEsq + 10} y1={yR} x2={xEsq + RW - 10} y2={yR} stroke={cor.linha} strokeWidth={3} opacity={0.55} />
            {[0, 1, 2, 3, 4].map((k) => {
              const x = xEsq + 10 + ((RW - 20) * k) / 4;
              return <line key={k} x1={x} y1={yR - (k % 2 ? 10 : 16)} x2={x} y2={yR + (k % 2 ? 10 : 16)} stroke={cor.linha} strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
            })}
            {u > 0 ? <line x1={xEsq + 10} y1={yR} x2={xv} y2={yR} stroke={cor.lanterna} strokeWidth={5} strokeDasharray="18 12" strokeLinecap="round" /> : null}
            {u > 0 && u < 1 ? <circle cx={xv} cy={yR} r={7.5} fill={cor.lanterna} /> : null}
            <Cruz x={xv} y={yR} t={t} em={chegou} />
            <Localizador focos={[{ em: chegou, x: xv, y: yR, r: 48 }]} t={t} vida={1} />
          </g>
        ) : null}
        {tipo === "porcento"
          ? (() => {
              const R = R_ANEL;
              const cx = centro ? r.x + r.w / 2 : r.x + R + 30;
              const cy = yVis + R + 45;
              const frac = limitar(valorAgora / 100, 0, 1);
              const C = 2 * Math.PI * R;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={14} strokeDasharray="3 9" />
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lanterna} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform={`rotate(-90 ${cx} ${cy})`} opacity={u > 0 ? 1 : 0} />
                  {Array.from({ length: 20 }).map((_, k) => {
                    const a = (k / 20) * 2 * Math.PI - Math.PI / 2;
                    const longa = k % 5 === 0;
                    return (
                      <line key={k} x1={cx + Math.cos(a) * (R + 16)} y1={cy + Math.sin(a) * (R + 16)} x2={cx + Math.cos(a) * (R + (longa ? 34 : 26))} y2={cy + Math.sin(a) * (R + (longa ? 34 : 26))} stroke={cor.textoSuave} strokeWidth={longa ? 3 : 2} strokeLinecap="round" opacity={0.8} />
                    );
                  })}
                  <Estrela x={cx} y={cy} r={11} t={t} em={chegou} brilhoEm={chegou + 0.1} lapis={0.6} />
                </g>
              );
            })()
          : null}
      </svg>
      {tipo === "regua"
        ? [0, 1, 2, 3, 4].map((k) => (
            <div
              key={`rl-${k}`}
              style={{
                position: "absolute",
                left: xEsq + 10 + ((RW - 20) * k) / 4,
                top: yR + 26,
                transform: `translateX(${k === 0 ? "0" : k === 4 ? "-100%" : "-50%"})`,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 30,
                color: cor.textoSuave,
                whiteSpace: "nowrap",
              }}
            >
              {numeroCurto((fimR * k) / 4)}
            </div>
          ))
        : null}
    </>
  );
};

// No quadro deitado, o número no peito (tela cheia) vira uma FILEIRA em vez da pilha alta do
// vertical: o rótulo e o número à esquerda, o desenho (estrelas, anel ou régua) à direita, os dois
// centralizados na faixa do peito. O desenho e o movimento são os mesmos do NumeroDesenho.
export const NumeroFileira: React.FC<{ m: Numero; r: Ret; t: number; palavras: Palavra[]; inicio: number; fim: number }> = ({ m, r, t, palavras, inicio, fim }) => {
  const tipo = tipoDoNumero(m);
  const pre = prefixoDe(m);
  const suf = sufixoDe(m);
  const n = tipo === "contagem" ? m.valor : 0;
  const VAO = 64;
  // o desenho: estrelas em até duas fileiras, o anel na altura da faixa, a régua de 600 a 720 px
  // (as marcas "75 mil" e "100 mil" precisam de ~170 px entre elas)
  const porFileira = n > 6 ? Math.ceil(n / 2) : n;
  const R_ANEL = limitar((r.h - 76) / 2, 64, 130);
  const wVis = tipo === "porcento" ? 2 * R_ANEL + 72 : tipo === "contagem" ? porFileira * 78 - 18 : limitar(r.w * 0.46, 600, 720);
  const hVis = tipo === "porcento" ? 2 * R_ANEL + 72 : tipo === "contagem" ? (n > 6 ? 2 * 60 + 16 : 60) : 96;
  const wTxtMax = r.w - wVis - VAO;
  const rotEnc = encaixar(m.rotulo, { largura: wTxtMax, max: 44, min: 32, linhas: 2, fonte: FONTE_LETREIRO });
  const hRot = alturaEnc(rotEnc, 1.2) + 14;
  const S = Math.max(72, Math.min(medirNumero(m, wTxtMax, 220), (r.h - hRot) / 1.02));
  const final = formatarNumero(m.valor, m.casas ?? 0);
  const larguraNum =
    larguraTexto(final, S, SERIFA) + (pre ? larguraTexto(pre, S * 0.4, SERIFA) + S * 0.14 : 0) + (suf ? larguraTexto(suf, suf === "%" ? S * 0.6 : S * 0.4, SERIFA) + S * 0.08 : 0);
  const wTxt = Math.min(wTxtMax, Math.max(larguraNum, rotEnc.largura));
  const total = wTxt + VAO + wVis;
  const x0 = r.x + (r.w - total) / 2;
  const xV = x0 + wTxt + VAO;
  const hTxt = hRot + S * 1.02;
  const yT = r.y + (r.h - hTxt) / 2;
  const yV = r.y + (r.h - hVis) / 2;
  const dur = duracaoDoNumero(m);
  const u = prog(t, m.em, dur, (x) => 1 - Math.pow(1 - x, 3));
  const ritmo = n ? Math.min(0.35, 1.8 / n) : 0;
  const cheios = n ? Math.max(0, Math.min(n, Math.floor((t - m.em) / ritmo + 1))) : 0;
  const valorAgora = tipo === "contagem" ? (t >= m.em ? cheios : 0) : m.valor * u;
  const texto = formatarNumero(valorAgora, m.casas ?? 0);
  const comecou = t >= m.em - 0.05;
  const tRot = temposDoTexto(m.rotulo, palavras, (m.rotuloEm ?? inicio) - 0.3, fim, (m.rotuloEm ?? inicio) + 0.05);
  const fimR = fimRedondo(m.valor);
  const RW = wVis;
  const xv = xV + 10 + (RW - 20) * limitar((tipo === "regua" ? valorAgora : 0) / fimR, 0, 1);
  const yR = yV + 22;
  const chegou = m.em + dur;
  return (
    <>
      <div style={{ position: "absolute", left: x0, top: yT, width: wTxt }}>
        <LinhasAcesas enc={rotEnc} tempos={tRot} t={t} rascunho={0.25} alinhar="flex-start" estilo={estiloLetreiro(rotEnc.tamanho)} entrelinha={1.2} />
      </div>
      <div
        style={{
          position: "absolute",
          left: x0,
          top: yT + hRot,
          width: wTxt,
          height: S * 1.02,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "flex-start",
          gap: S * 0.1,
          fontFamily: serifa,
          fontWeight: 500,
          color: cor.texto,
          lineHeight: 1,
          fontVariantNumeric: "lining-nums tabular-nums",
          opacity: comecou ? 1 : 0.22,
          whiteSpace: "nowrap",
        }}
      >
        {pre ? <span style={{ fontSize: S * 0.4 }}>{pre}</span> : null}
        <span style={{ fontSize: S }}>{texto}</span>
        {suf ? <span style={{ fontSize: suf === "%" ? S * 0.6 : S * 0.4 }}>{suf}</span> : null}
      </div>
      {m.ilustrativo ? <Ilustrativo x={x0 + total} y={r.y - 8} t={t} em={inicio + 0.3} /> : null}
      {tipo === "contagem" ? (
        <div style={{ position: "absolute", left: xV, top: yV, width: wVis, display: "flex", flexWrap: "wrap", gap: 18, rowGap: 16 }}>
          {Array.from({ length: n }).map((_, j) => (
            <QuatroPontas key={j} tamanho={60} cheia={prog(t, m.em + j * ritmo - 0.04, 0.3)} />
          ))}
        </div>
      ) : null}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {tipo === "regua" ? (
          <g>
            <line x1={xV + 10} y1={yR} x2={xV + RW - 10} y2={yR} stroke={cor.linha} strokeWidth={3} opacity={0.55} />
            {[0, 1, 2, 3, 4].map((k) => {
              const x = xV + 10 + ((RW - 20) * k) / 4;
              return <line key={k} x1={x} y1={yR - (k % 2 ? 10 : 16)} x2={x} y2={yR + (k % 2 ? 10 : 16)} stroke={cor.linha} strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
            })}
            {u > 0 ? <line x1={xV + 10} y1={yR} x2={xv} y2={yR} stroke={cor.lanterna} strokeWidth={5} strokeDasharray="18 12" strokeLinecap="round" /> : null}
            {u > 0 && u < 1 ? <circle cx={xv} cy={yR} r={7.5} fill={cor.lanterna} /> : null}
            <Cruz x={xv} y={yR} t={t} em={chegou} />
            <Localizador focos={[{ em: chegou, x: xv, y: yR, r: 48 }]} t={t} vida={1} />
          </g>
        ) : null}
        {tipo === "porcento"
          ? (() => {
              const R = R_ANEL;
              const cx = xV + wVis / 2;
              const cy = r.y + r.h / 2;
              const frac = limitar(valorAgora / 100, 0, 1);
              const C = 2 * Math.PI * R;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={14} strokeDasharray="3 9" />
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke={cor.lanterna} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${C * frac} ${C}`} transform={`rotate(-90 ${cx} ${cy})`} opacity={u > 0 ? 1 : 0} />
                  {Array.from({ length: 20 }).map((_, k) => {
                    const a = (k / 20) * 2 * Math.PI - Math.PI / 2;
                    const longa = k % 5 === 0;
                    return (
                      <line key={k} x1={cx + Math.cos(a) * (R + 16)} y1={cy + Math.sin(a) * (R + 16)} x2={cx + Math.cos(a) * (R + (longa ? 34 : 26))} y2={cy + Math.sin(a) * (R + (longa ? 34 : 26))} stroke={cor.textoSuave} strokeWidth={longa ? 3 : 2} strokeLinecap="round" opacity={0.8} />
                    );
                  })}
                  <Estrela x={cx} y={cy} r={11} t={t} em={chegou} brilhoEm={chegou + 0.1} lapis={0.6} />
                </g>
              );
            })()
          : null}
      </svg>
      {tipo === "regua"
        ? [0, 1, 2, 3, 4].map((k) => (
            <div
              key={`rl-${k}`}
              style={{
                position: "absolute",
                left: xV + 10 + ((RW - 20) * k) / 4,
                top: yR + 26,
                transform: `translateX(${k === 0 ? "0" : k === 4 ? "-100%" : "-50%"})`,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 30,
                color: cor.textoSuave,
                whiteSpace: "nowrap",
              }}
            >
              {numeroCurto((fimR * k) / 4)}
            </div>
          ))
        : null}
    </>
  );
};

export const NumeroNaCarta: React.FC<PropsBloco & { m: Numero }> = ({ m, areas, t, palavras, inicio, fim }) => (
  <NumeroDesenho m={m} r={areas.corpo} centro t={t} palavras={palavras} inicio={inicio} fim={fim} rotuloFora={areas.cab} />
);

// ---------------------------------------------------------------- comparacao

export const ComparacaoNaCarta: React.FC<PropsBloco & { m: Comparacao }> = ({ m, areas, t, palavras, inicio, fim }) => {
  const { cab, corpo } = layoutCabecalho(m.titulo, areas);
  const modo = m.modo ?? "contra";
  const xs = corpo.x + 46;
  const xt = corpo.x + 128;
  const w = corpo.x + corpo.w - xt;
  let max = 112;
  let rots: Encaixe[] = [];
  let txts: Encaixe[] = [];
  let hs: number[] = [];
  const MEIO = 150;
  for (;;) {
    rots = m.lados.map((l) => encaixar(l.rotulo, { largura: w * 0.95, max: 40, min: 32, linhas: 2, fonte: FONTE_LETREIRO }));
    txts = encaixarTodos(
      m.lados.map((l) => l.texto),
      { largura: w, max, min: Math.min(max, 54), linhas: 2, fonte: SERIFA_FORTE },
    );
    hs = [0, 1].map((i) => alturaEnc(rots[i], 1.2) + 12 + alturaEnc(txts[i], 1.06));
    if (soma(hs) + MEIO <= corpo.h * 0.9 || max <= 54) break;
    max -= 4;
  }
  const meio = limitar((corpo.h - soma(hs)) * 0.55, MEIO, 300);
  const total = soma(hs) + meio;
  const y0 = corpo.y + (corpo.h - total) / 2;
  const topos = [y0, y0 + hs[0] + meio];
  // a estrela fica na altura da primeira linha do texto de cada lado
  const ys = [0, 1].map((i) => topos[i] + alturaEnc(rots[i], 1.2) + 12 + txts[i].tamanho * 0.56);
  const [A, B] = m.lados;
  const vencedorEm = m.vencedor !== undefined ? (m.vencedorEm ?? B.em + 0.5) : undefined;
  const certoErrado = modo === "errado-certo";
  const perdedor = m.vencedor !== undefined ? 1 - m.vencedor : certoErrado ? 0 : modo === "antes-depois" ? 0 : -1;
  const apagaEm = m.vencedor !== undefined ? vencedorEm! : B.em + 0.35;
  const apagar = (i: number) => (i === perdedor ? prog(t, apagaEm, 0.5) : 0);
  const brilhoEm = (i: number) => (m.vencedor === i ? vencedorEm : certoErrado && i === 1 ? B.em + 0.3 : undefined);
  const meioY = (ys[0] + ys[1]) / 2;
  const focos: Foco[] = [
    { em: A.em, x: xs, y: ys[0], r: 48 },
    { em: B.em, x: xs, y: ys[1], r: 48 },
  ];
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {modo === "antes-depois" ? (
          <Tracejado a={{ x: xs, y: ys[0] }} b={{ x: xs, y: ys[1] }} t={t} de={B.em - 0.35} ate={B.em + 0.35} folgaA={34} folgaB={36} seta marcas={4} />
        ) : (
          <g>
            <line x1={xs} y1={ys[0] + 34} x2={xs} y2={ys[1] - 34} stroke={prog(t, B.em, 0.4) > 0.5 ? cor.linha : cor.lapis} strokeWidth={prog(t, B.em, 0.4) > 0.5 ? 2.5 : 2.5} strokeDasharray="2 10" strokeLinecap="round" />
            <g opacity={prog(t, B.em - 0.05, 0.35)} transform={`translate(${xs} ${meioY}) scale(${0.8 + 0.2 * prog(t, B.em - 0.05, 0.35)})`}>
              <circle r={38} fill={cor.ceu} stroke={cor.linha} strokeWidth={3} />
              <path d="M -13 -13 L 13 13 M 13 -13 L -13 13" stroke={cor.texto} strokeWidth={4.5} strokeLinecap="round" />
            </g>
          </g>
        )}
        {[0, 1].map((i) => (
          <Estrela key={i} x={xs} y={ys[i]} r={13} t={t} em={m.lados[i].em} brilhoEm={brilhoEm(i)} apagar={apagar(i)} />
        ))}
        <Localizador focos={focos} t={t} vida={1} inicio={inicio} />
      </svg>
      <Cabecalho cab={cab} texto={m.titulo ?? ""} t={t} palavras={palavras} inicio={inicio} fim={A.em} />
      {[0, 1].map((i) => {
        const lado = m.lados[i];
        const prox = i === 0 ? B.em : fim;
        const tRot = temposDoTexto(lado.rotulo, palavras, lado.em - 0.3, prox, lado.em - 0.05);
        const tTxt = temposDoTexto(lado.texto, palavras, lado.em - 0.2, prox + 0.3, lado.em);
        const errado = certoErrado && i === 0;
        const risco = errado ? prog(t, B.em, 0.5, gira) : 0;
        const op = 1 - 0.55 * apagar(i);
        return (
          <div key={i} style={{ position: "absolute", left: xt, top: topos[i], width: w, opacity: op }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <LinhasAcesas enc={rots[i]} tempos={tRot} t={t} rascunho={0.25} cor={errado ? cor.lanternaClara : cor.textoSuave} estilo={estiloLetreiro(rots[i].tamanho)} entrelinha={1.2} />
              {certoErrado && i === 1 ? (
                <svg width={40} height={40} viewBox="0 0 38 38" style={{ flex: "none", opacity: prog(t, B.em + 0.2, 0.3) }}>
                  <circle cx={19} cy={19} r={16} fill="none" stroke={cor.estrela} strokeWidth={3} />
                  <path d="M 11 19.5 L 17 25 L 27.5 13" fill="none" stroke={cor.estrela} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - prog(t, B.em + 0.3, 0.4))} />
                </svg>
              ) : null}
            </div>
            <div style={{ marginTop: 12, position: "relative" }}>
              <LinhasAcesas enc={txts[i]} tempos={tTxt} t={t} estilo={{ fontFamily: serifa, fontWeight: 600 }} entrelinha={1.06} />
              {risco > 0
                ? txts[i].linhas.map((l, k) => (
                    <div
                      key={k}
                      style={{
                        position: "absolute",
                        left: -6,
                        top: (k + 0.55) * txts[i].tamanho * 1.06,
                        height: 6,
                        borderRadius: 3,
                        background: cor.lanterna,
                        width: (larguraTexto(l, txts[i].tamanho, SERIFA_FORTE) + 12) * limitar(risco * txts[i].linhas.length - k),
                      }}
                    />
                  ))
                : null}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- grafico

const CORES_PIZZA = [cor.lanterna, cor.estrela, cor.linha, cor.lanternaClara, cor.textoSuave, "#6E76A8"];

const formatarDado = (v: number, unidade?: string) => {
  const u = unidade?.trim() ?? "";
  const casas = Number.isInteger(v) ? 0 : 1;
  const n = Math.abs(v) >= 10000 ? numeroCurto(v) : formatarNumero(v, casas);
  if (u === "%") return `${n}%`;
  if (/^(R\$|US\$|€|£)$/.test(u)) return `${u} ${n}`;
  return n;
};

const PERFIS: Record<"sobe" | "cai" | "oscila", number[]> = {
  sobe: [0.88, 0.72, 0.76, 0.5, 0.42, 0.1],
  cai: [0.1, 0.3, 0.26, 0.55, 0.62, 0.9],
  oscila: [0.55, 0.22, 0.66, 0.3, 0.72, 0.4],
};

export const GraficoNaCarta: React.FC<PropsBloco & { m: Grafico }> = ({ m, areas, t, palavras, inicio, fim }) => {
  const { cab, corpo } = layoutCabecalho(m.titulo, areas);
  const dados = m.dados?.length ? m.dados : null;
  const unidade = m.unidade?.trim();
  const unidadePalavra = unidade && !/^(%|R\$|US\$|€|£)$/.test(unidade) ? unidade : null;
  const ilustrativo = !dados || m.ilustrativo;
  const topoExtra = unidadePalavra || ilustrativo ? 64 : 0;
  const area: Ret = { x: corpo.x, y: corpo.y + topoExtra, w: corpo.w, h: corpo.h - topoExtra };
  const svg: React.ReactNode[] = [];
  const html: React.ReactNode[] = [];
  const focos: Foco[] = [];
  const forma = !dados && m.forma === "pizza" ? "linha" : m.forma;

  if (unidadePalavra) {
    html.push(
      <div key="un" style={{ position: "absolute", left: corpo.x, top: corpo.y, ...estiloLetreiro(32), color: cor.textoSuave, opacity: prog(t, inicio + 0.2, 0.4) }}>
        {unidadePalavra}
      </div>,
    );
  }
  if (ilustrativo) html.push(<Ilustrativo key="il" x={corpo.x + corpo.w} y={corpo.y - 6} t={t} em={inicio + 0.25} />);

  if (forma === "pizza" && dados) {
    const total = soma(dados.map((d) => Math.max(0, d.valor))) || 1;
    const R = Math.min(230, area.h * 0.34, area.w * 0.27);
    const cx = area.x + R + 40;
    const cy = area.y + area.h / 2;
    const C = 2 * Math.PI * R;
    svg.push(<circle key="trilha" cx={cx} cy={cy} r={R} fill="none" stroke={cor.lapis} strokeWidth={34} strokeDasharray="2 10" />);
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * 2 * Math.PI - Math.PI / 2;
      const longa = k % 5 === 0;
      svg.push(
        <line key={`tk-${k}`} x1={cx + Math.cos(a) * (R + 26)} y1={cy + Math.sin(a) * (R + 26)} x2={cx + Math.cos(a) * (R + (longa ? 44 : 34))} y2={cy + Math.sin(a) * (R + (longa ? 44 : 34))} stroke={cor.textoSuave} strokeWidth={longa ? 2.6 : 1.6} opacity={0.75} strokeLinecap="round" />,
      );
    }
    let acc = 0;
    const xl = cx + R + 90;
    const wl = area.x + area.w - xl;
    const rots = encaixarTodos(
      dados.map((d) => d.rotulo),
      { largura: wl - 60, max: 40, min: 32, linhas: 2, fonte: { familia: "sans", peso: 600 } },
    );
    const alturaLinha = (i: number) => alturaEnc(rots[i], 1.15) + 60;
    const totalLeg = soma(dados.map((_, i) => alturaLinha(i))) + 26 * (dados.length - 1);
    let yl = cy - totalLeg / 2;
    dados.forEach((d, i) => {
      const frac = Math.max(0, d.valor) / total;
      const u = prog(t, d.em, 0.7, gira);
      const ini = acc;
      acc += frac;
      svg.push(
        <circle
          key={`arco-${i}`}
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={CORES_PIZZA[i % CORES_PIZZA.length]}
          strokeWidth={34}
          strokeDasharray={`${Math.max(0, C * frac * u - 4)} ${C}`}
          transform={`rotate(${-90 + ini * 360 + 0.6} ${cx} ${cy})`}
          opacity={u > 0 ? 1 : 0}
        />,
      );
      const meioA = (ini + frac / 2) * 2 * Math.PI - Math.PI / 2;
      focos.push({ em: d.em, x: cx + Math.cos(meioA) * R, y: cy + Math.sin(meioA) * R, r: 50 });
      const tR = temposDoTexto(d.rotulo, palavras, d.em - 0.3, (dados[i + 1]?.em ?? fim) + 0.2, d.em);
      const topo = yl;
      yl += alturaLinha(i) + 26;
      html.push(
        <div key={`leg-${i}`} style={{ position: "absolute", left: xl, top: topo, width: wl, display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ marginTop: 6 }}>
            <QuatroPontas tamanho={40} cheia={prog(t, d.em - 0.04, 0.3)} cor={CORES_PIZZA[i % CORES_PIZZA.length]} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: serifa, fontWeight: 600, fontSize: 54, lineHeight: 1.05, color: cor.texto, opacity: 0.22 + 0.78 * prog(t, d.em - 0.04, 0.3) }}>{formatarDado(d.valor, unidade)}</div>
            <LinhasAcesas enc={rots[i]} tempos={tR} t={t} cor={cor.textoSuave} rascunho={0.3} estilo={{ fontFamily: sans, fontWeight: 600 }} entrelinha={1.15} />
          </div>
        </div>,
      );
    });
  } else {
    // eixos de carta: linha de base e guias pontilhadas
    const n = dados ? dados.length : 6;
    const slot = area.w / n;
    const rotEncs = dados
      ? encaixarTodos(
          dados.map((d) => d.rotulo),
          { largura: slot - 16, max: 36, min: 30, linhas: 2, fonte: { familia: "sans", peso: 600 } },
        )
      : [];
    const hRot = dados ? Math.max(...rotEncs.map((e) => alturaEnc(e, 1.15))) + 24 : 20;
    const valEncs = dados ? dados.map((d) => encaixar(formatarDado(d.valor, unidade), { largura: slot - 10, max: 54, min: 34, linhas: 1, fonte: SERIFA_FORTE })) : [];
    const hVal = dados ? Math.max(...valEncs.map((e) => e.tamanho)) + 30 : 30;
    const base = area.y + area.h - hRot;
    const topo = area.y + hVal;
    const altura = base - topo;
    svg.push(<line key="base" x1={area.x} y1={base} x2={area.x + area.w} y2={base} stroke={cor.linha} strokeWidth={3} opacity={0.55} />);
    [1 / 3, 2 / 3, 1].forEach((f, k) => svg.push(<line key={`guia-${k}`} x1={area.x} y1={base - altura * f} x2={area.x + area.w} y2={base - altura * f} stroke={cor.grade} strokeWidth={2} strokeDasharray="3 9" />));
    const vmax = dados ? Math.max(...dados.map((d) => d.valor), 0) || 1 : 1;
    const vmin = dados ? Math.min(0, ...dados.map((d) => d.valor)) : 0;
    const perfil = PERFIS[m.tendencia ?? "sobe"];
    const emT = m.tendenciaEm ?? inicio + 0.6;
    const pontos = Array.from({ length: n }).map((_, i) => {
      const x = area.x + slot * (i + 0.5);
      const f = dados ? (dados[i].valor - vmin) / (vmax - vmin || 1) : 1 - perfil[i];
      const y = base - Math.max(dados ? 0.04 : 0.08, f) * altura;
      const em = dados ? dados[i].em : emT + (forma === "barras" ? 0.24 : 0.3) * i;
      return { x, y, em };
    });
    const ultimoEm = pontos[pontos.length - 1].em;
    if (forma === "barras") {
      pontos.forEach((p, i) => {
        const u = prog(t, p.em - 0.05, 0.55, gira);
        svg.push(<line key={`haste-lapis-${i}`} x1={p.x} y1={base} x2={p.x} y2={p.y} stroke={cor.lapis} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" opacity={1 - u} />);
        if (u > 0) svg.push(<line key={`haste-${i}`} x1={p.x} y1={base} x2={p.x} y2={mistura(base, p.y + 18, u)} stroke={cor.linha} strokeWidth={6} strokeLinecap="round" />);
        svg.push(<Estrela key={`be-${i}`} x={p.x} y={p.y} r={11} t={t} em={p.em + 0.4} brilhoEm={!dados && i === n - 1 ? p.em + 0.6 : undefined} />);
        focos.push({ em: p.em + 0.3, x: p.x, y: p.y, r: 50 });
      });
    } else {
      pontos.forEach((p, i) => {
        if (i > 0) svg.push(<Ligacao key={`lg-${i}`} a={pontos[i - 1]} b={p} ra={10} rb={10} t={t} em={p.em - 0.15} />);
        svg.push(<Estrela key={`le-${i}`} x={p.x} y={p.y} r={10} t={t} em={p.em} brilhoEm={!dados && i === n - 1 ? p.em + 0.3 : undefined} />);
        focos.push({ em: p.em, x: p.x, y: p.y, r: 50 });
      });
    }
    if (dados) {
      dados.forEach((d, i) => {
        const p = pontos[i];
        const tR = temposDoTexto(d.rotulo, palavras, d.em - 0.4, (dados[i + 1]?.em ?? fim) + 0.2, d.em - 0.1);
        const aceso = prog(t, p.em + (forma === "barras" ? 0.35 : 0) - 0.04, 0.3);
        html.push(
          <div
            key={`val-${i}`}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y - 26,
              transform: "translate(-50%, -100%)",
              fontFamily: serifa,
              fontWeight: 600,
              fontSize: valEncs[i].tamanho,
              lineHeight: 1,
              color: cor.texto,
              whiteSpace: "nowrap",
              opacity: aceso > 0 ? aceso : 0.2,
            }}
          >
            {formatarDado(d.valor, unidade)}
          </div>,
          <div key={`rot-${i}`} style={{ position: "absolute", left: p.x - (slot - 16) / 2, top: base + 18, width: slot - 16 }}>
            <LinhasAcesas enc={rotEncs[i]} tempos={tR} t={t} cor={cor.textoSuave} rascunho={0.35} alinhar="center" estilo={{ fontFamily: sans, fontWeight: 600 }} entrelinha={1.15} />
          </div>,
        );
      });
    }
    void ultimoEm;
  }
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {svg}
        <Localizador focos={focos} t={t} vida={1} inicio={inicio} />
      </svg>
      <Cabecalho cab={cab} texto={m.titulo ?? ""} t={t} palavras={palavras} inicio={inicio} fim={(dados?.[0]?.em ?? m.tendenciaEm ?? fim) + 0.2} />
      {html}
    </>
  );
};

// ---------------------------------------------------------------- definicao

export const DefinicaoNaCarta: React.FC<PropsBloco & { m: Definicao }> = ({ m, areas, t, palavras, inicio, fim }) => {
  const c = areas.corpo;
  const xs = c.x + 52;
  const xt = c.x + 136;
  const w = c.x + c.w - xt;
  const termo = encaixar(m.termo, { largura: w, max: 136, min: 70, linhas: 2, fonte: ITALICO });
  const sig = encaixar(m.significado, { largura: w, max: 84, min: 50, linhas: 3, fonte: SERIFA });
  const hT = alturaEnc(termo, 1.04) + 22;
  const hS = alturaEnc(sig, 1.1);
  const vao = limitar((c.h - hT - hS) * 0.6, 150, 340);
  const total = hT + vao + hS;
  const y0 = c.y + (c.h - total) / 2;
  const yEstrela = y0 + termo.tamanho * 0.55;
  const ySig = y0 + hT + vao;
  const yCruz = ySig + sig.tamanho * 0.58;
  const tT = temposDoTexto(m.termo, palavras, m.em - 0.3, m.significadoEm, m.em);
  const tS = temposDoTexto(m.significado, palavras, m.significadoEm - 0.2, fim, m.significadoEm);
  const ultimaT = Math.max(...tT);
  const larg = Math.max(...termo.linhas.map((l) => larguraTexto(l, termo.tamanho, ITALICO)));
  const chega = m.significadoEm + 0.55;
  const focos: Foco[] = [
    { em: m.em, x: xs, y: yEstrela, r: 52 },
    { em: chega, x: xs, y: yCruz, r: 46 },
  ];
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Tracejado a={{ x: xs, y: yEstrela }} b={{ x: xs, y: yCruz }} t={t} de={m.significadoEm - 0.15} ate={chega} folgaA={34} folgaB={26} marcas={3} />
        <Estrela x={xs} y={yEstrela} r={13} t={t} em={m.em} brilhoEm={m.em + 0.25} />
        <Cruz x={xs} y={yCruz} t={t} em={chega - 0.05} />
        <Localizador focos={focos} t={t} vida={1} inicio={inicio} />
      </svg>
      <div style={{ position: "absolute", left: xt, top: y0, width: w }}>
        <LinhasAcesas enc={termo} tempos={tT} t={t} estilo={estiloNome(termo.tamanho)} entrelinha={1.04} />
        <div style={{ marginTop: 12, height: 3, width: larg * prog(t, ultimaT + 0.1, 0.6, gira), background: cor.textoSuave, opacity: 0.75 }} />
      </div>
      <div style={{ position: "absolute", left: xt, top: ySig, width: w }}>
        <LinhasAcesas enc={sig} tempos={tS} t={t} estilo={{ fontFamily: serifa, fontWeight: 500 }} entrelinha={1.1} />
      </div>
    </>
  );
};

// ---------------------------------------------------------------- constelacao (a assinatura)

// Figuras por número de estrelas: posições na faixa do meio (x de 0,33 a 0,67 da largura), o lado do
// nome de cada estrela (fora da faixa, então nome nunca cruza linha) e as linhas da figura.
type Figura = { pts: [number, number][]; lados: ("e" | "d")[]; linhas: [number, number][] };
export const FIGURAS: Record<number, Figura> = {
  2: { pts: [[0.4, 0.16], [0.62, 0.84]], lados: ["e", "d"], linhas: [[0, 1]] },
  3: { pts: [[0.37, 0.08], [0.66, 0.45], [0.41, 0.92]], lados: ["e", "d", "e"], linhas: [[0, 1], [1, 2], [2, 0]] },
  // a cruz (como o Cruzeiro): topo, braço esquerdo, braço direito, pé
  4: { pts: [[0.51, 0.03], [0.34, 0.42], [0.68, 0.36], [0.53, 0.97]], lados: ["d", "e", "d", "e"], linhas: [[0, 3], [1, 2]] },
  // o W de Cassiopeia, de pé
  5: { pts: [[0.36, 0.03], [0.64, 0.27], [0.4, 0.5], [0.66, 0.73], [0.38, 0.97]], lados: ["e", "d", "e", "d", "e"], linhas: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  // a concha (como a Ursa Maior): quatro no corpo, duas no cabo
  6: { pts: [[0.35, 0.03], [0.65, 0.08], [0.68, 0.37], [0.36, 0.32], [0.42, 0.65], [0.6, 0.97]], lados: ["e", "d", "d", "e", "e", "d"], linhas: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5]] },
};

const FOLGA_NOME = 44;

export const layoutConstelacao = (m: Constelacao, areas: Areas) => {
  const { cab, corpo } = layoutCabecalho(m.titulo, areas);
  const n = Math.max(2, Math.min(6, m.estrelas.length));
  const fig = FIGURAS[n];
  const hAlvo = m.alvo ? 250 : 0;
  const F: Ret = { x: corpo.x, y: corpo.y + 34, w: corpo.w, h: corpo.h - hAlvo - 70 };
  const raios = [13.5, 11, 12.5, 10.5, 12, 10.5];
  const estrelas = m.estrelas.slice(0, 6).map((e, i) => {
    const [fx, fy] = fig.pts[i];
    return { e, x: F.x + fx * F.w, y: F.y + fy * F.h, r: raios[i], lado: fig.lados[i] };
  });
  // nomes: todos com o mesmo corpo, na largura que sobra do lado de cada estrela
  const larguras = estrelas.map((s) => (s.lado === "e" ? s.x - s.r - FOLGA_NOME - corpo.x : corpo.x + corpo.w - (s.x + s.r + FOLGA_NOME)));
  const nomes = encaixarTodos(
    estrelas.map((s) => s.e.texto),
    { largura: Math.min(...larguras), larguras, max: 62, min: 44, linhas: 3, fonte: ITALICO },
  );
  // o alvo fica embaixo da estrela mais baixa, deslocado para o lado contrário ao nome dela
  const alvo = m.alvo
    ? (() => {
        const baixo = estrelas.reduce((a, b) => (b.y > a.y ? b : a), estrelas[0]);
        const x = limitar(baixo.x + (baixo.lado === "e" ? 1 : -1) * 120, corpo.x + 230, corpo.x + corpo.w - 230);
        const y = corpo.y + corpo.h - 118;
        const ladoNome: "e" | "d" = baixo.lado === "e" ? "d" : "e";
        const larg = ladoNome === "d" ? corpo.x + corpo.w - (x + 136) : x - 136 - corpo.x;
        const nome = encaixar(m.alvo!.texto, { largura: larg, max: 66, min: 44, linhas: 2, fonte: SERIFA_FORTE });
        return { x, y, de: baixo, ladoNome, larg, nome };
      })()
    : null;
  // os nomes de um mesmo lado nunca se encostam: descem em ordem e, se passarem do fim da figura,
  // sobem juntos (uma linha-guia fina liga a estrela ao nome que saiu da altura dela)
  const limiteBaixo = alvo ? alvo.y - 104 : corpo.y + corpo.h;
  const posNome = estrelas.map((s, i) => ({ i, h: alturaEnc(nomes[i], 1.08), y: s.y }));
  for (const lado of ["e", "d"] as const) {
    const grupo = posNome.filter((p) => estrelas[p.i].lado === lado).sort((a, b) => a.y - b.y);
    let fundo = -Infinity;
    for (const p of grupo) {
      const topo = Math.max(p.y - p.h / 2, fundo + 14);
      p.y = topo + p.h / 2;
      fundo = topo + p.h;
    }
    const excesso = fundo - limiteBaixo;
    if (excesso > 0) {
      let teto = Infinity;
      for (const p of [...grupo].reverse()) {
        const base = Math.min(p.y + p.h / 2 - excesso, teto - 14);
        p.y = base - p.h / 2;
        teto = base - p.h;
      }
    }
  }
  const yNomes = posNome.map((p) => p.y);
  return { cab, corpo, estrelas, nomes, larguras, fig, alvo, yNomes };
};

export const linhasDaConstelacao = (m: Constelacao): [number, number][] => {
  const n = Math.max(2, Math.min(6, m.estrelas.length));
  return m.ligar === "caminho" ? Array.from({ length: n - 1 }, (_, i) => [i, i + 1] as [number, number]) : FIGURAS[n].linhas;
};

export const quandoChega = (m: Constelacao) => {
  if (!m.alvo) return null;
  const ultima = Math.max(...m.estrelas.map((e) => e.em));
  const chega = m.alvo.chegaEm ?? (m.alvo.em > ultima + 0.4 ? m.alvo.em : ultima + 1.1);
  return { sai: Math.max(ultima + 0.25, chega - 1.0), chega };
};

export const ConstelacaoNaCarta: React.FC<PropsBloco & { m: Constelacao }> = ({ m, areas, t, palavras, inicio, fim }) => {
  const L = layoutConstelacao(m, areas);
  const acende = L.estrelas.map((s) => s.e.em);
  const focos: Foco[] = L.estrelas.map((s) => ({ em: s.e.em, x: s.x, y: s.y, r: 36 }));
  const viagem = quandoChega(m);
  const pontoAlvo: P | null = L.alvo ? { x: L.alvo.x, y: L.alvo.y } : null;
  if (L.alvo && viagem) {
    focos.push({ em: viagem.chega, x: L.alvo.x, y: L.alvo.y, r: 60 });
  }
  // a figura inteira acende mais forte quando a reta chega ao alvo
  const pulso = viagem ? prog(t, viagem.chega, 0.25) * (1 - prog(t, viagem.chega + 0.35, 0.8)) : 0;
  const tempoNome = m.tituloEm ?? inicio;
  const marcaEm = L.alvo ? Math.min(m.alvo!.em, viagem!.chega) : 0;
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {linhasDaConstelacao(m).map(([a, b], k) => {
          const A = L.estrelas[a];
          const B = L.estrelas[b];
          if (!A || !B) return null;
          return <Ligacao key={`lg-${k}`} a={A} b={B} ra={A.r} rb={B.r} t={t} em={Math.max(acende[a], acende[b]) + 0.08} largura={4.5 + 2 * pulso} />;
        })}
        {L.estrelas.map((s, i) => {
          const dy = L.yNomes[i] - s.y;
          if (Math.abs(dy) < 18) return null;
          // linha-guia até o nome que precisou sair da altura da estrela
          const lado = s.lado === "e" ? -1 : 1;
          return (
            <line
              key={`guia-${i}`}
              x1={s.x + lado * (s.r + 8)}
              y1={s.y + Math.sign(dy) * 4}
              x2={s.x + lado * (s.r + FOLGA_NOME - 10)}
              y2={L.yNomes[i]}
              stroke={cor.textoSuave}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.3 + 0.5 * prog(t, s.e.em, 0.4)}
            />
          );
        })}
        {L.estrelas.map((s, i) => (
          <Estrela key={`e-${i}`} x={s.x} y={s.y} r={s.r} t={t} em={s.e.em} />
        ))}
        {L.alvo && viagem && pontoAlvo ? (
          <g>
            <Tracejado a={L.alvo.de} b={pontoAlvo} t={t} de={viagem.sai} ate={viagem.chega} folgaA={L.alvo.de.r + 14} folgaB={24} marcas={4} />
            <Cruz x={L.alvo.x} y={L.alvo.y} t={t} em={marcaEm} />
            {(() => {
              const vida = prog(t, viagem.chega - 0.3, 0.6);
              if (vida <= 0) return null;
              const direcao = Math.abs(pontoAlvo.y - L.alvo.de.y) >= Math.abs(pontoAlvo.x - L.alvo.de.x) ? (pontoAlvo.y > L.alvo.de.y ? "S" : "N") : pontoAlvo.x > L.alvo.de.x ? "O" : "L";
              return <Rosa x={L.alvo.x} y={L.alvo.y} raio={76} desenho={prog(t, viagem.chega - 0.3, 0.8, gira)} giro={-30 * (1 - vida)} destaque={direcao} opacidade={vida} miolo={0} />;
            })()}
          </g>
        ) : null}
        <Localizador focos={focos} t={t} vida={1} inicio={inicio} />
      </svg>
      <Cabecalho cab={L.cab} texto={m.titulo ?? ""} t={t} palavras={palavras} inicio={inicio} fim={L.estrelas[0]?.e.em ?? fim} em={tempoNome} />
      {L.estrelas.map((s, i) => {
        const enc = L.nomes[i];
        const prox = L.estrelas[i + 1]?.e.em ?? fim;
        const tempos = temposDoTexto(s.e.texto, palavras, s.e.em - 0.2, prox, s.e.em);
        const h = alturaEnc(enc, 1.08);
        const esquerda = s.lado === "e";
        return (
          <div
            key={`n-${i}`}
            style={{
              position: "absolute",
              left: esquerda ? undefined : s.x + s.r + FOLGA_NOME,
              right: esquerda ? W - (s.x - s.r - FOLGA_NOME) : undefined,
              top: L.yNomes[i] - h / 2,
              width: L.larguras[i],
              display: "flex",
              justifyContent: esquerda ? "flex-end" : "flex-start",
            }}
          >
            <LinhasAcesas enc={enc} tempos={tempos} t={t} alinhar={esquerda ? "flex-end" : "flex-start"} estilo={estiloNome(enc.tamanho)} entrelinha={1.08} />
          </div>
        );
      })}
      {L.alvo
        ? (() => {
            const a = L.alvo;
            const tempos = temposDoTexto(m.alvo!.texto, palavras, m.alvo!.em - 0.3, Math.max(fim, m.alvo!.em + 2), m.alvo!.em);
            const h = alturaEnc(a.nome, 1.06);
            const d = a.ladoNome === "d";
            return (
              <div
                style={{
                  position: "absolute",
                  left: d ? a.x + 136 : undefined,
                  right: d ? undefined : W - (a.x - 136),
                  top: a.y - h / 2,
                  width: a.larg,
                  display: "flex",
                  justifyContent: d ? "flex-start" : "flex-end",
                }}
              >
                <LinhasAcesas enc={a.nome} tempos={tempos.map((x) => Math.max(x, marcaEm - 0.05))} t={t} alinhar={d ? "flex-start" : "flex-end"} estilo={{ fontFamily: serifa, fontWeight: 600 }} entrelinha={1.06} />
              </div>
            );
          })()
        : null}
    </>
  );
};

