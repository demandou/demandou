// Os blocos universais que ficam na página da pessoa: um cartão na altura do peito, como a capa.
// - numero: o numeral grande em coral (o mesmo gesto do "3" da capa) contando até o valor;
// - destaque: `chave` = cartão creme com sublinhado coral; `alerta` = cartão petróleo com o sinal coral;
// - pergunta: um "?" coral e a pergunta; as opções chegam como as barras de uma enquete do app.
import { Easing, interpolate } from "remotion";
import { marcar, prog, temposDoTexto, TextoFalado, Traco } from "../anim";
import { casasDe, encaixar, larguraLinha, numeroBR } from "../medida";
import type { Destaque as TDestaque, Numero as TNumero, Palavra, Pergunta as TPergunta } from "../plano";
import { cor, fonte, rotulo, W } from "../tema";
import { misturarCor } from "./Desenhos";
import { ALTURA_ARRASTA, Arrasta, Cartao, espacoDoCartao, INTERNA, PAD } from "./Cartoes";

const ESCALAS = [1, 0.92, 0.85, 0.78, 0.72, 0.66];

// etiqueta "ilustrativo" (número ou gráfico que não veio de um número dito)
export const Ilustrativo: React.FC<{ p?: number; fundo?: string; tinta?: string }> = ({ p = 1, fundo, tinta }) => (
  <div
    style={{
      ...rotulo,
      fontSize: 30,
      padding: "10px 18px 9px",
      borderRadius: 99,
      background: fundo ?? cor.areia,
      color: tinta ?? cor.petroleo,
      opacity: p,
      whiteSpace: "nowrap",
    }}
  >
    ilustrativo
  </div>
);

// ---------- numero ----------

const medidasNumero = (m: TNumero, arrasta: boolean, k = 1) => {
  const casas = m.casas ?? casasDe(m.valor);
  const final = numeroBR(m.valor, casas);
  const pre = m.prefixo?.trim() ?? "";
  const suf = m.sufixo?.trim() ?? "";
  // o numeral e o prefixo/sufixo menores (0,42 do numeral) cabem numa linha
  const larguraEm = (n: number) =>
    larguraLinha(final, n, { peso: 800, espacamento: -0.035, vao: 0 }) +
    (pre ? larguraLinha(pre, n * 0.42, { peso: 800 }) + n * 0.1 : 0) +
    (suf ? larguraLinha(suf, n * 0.42, { peso: 800 }) + n * 0.1 : 0);
  let tamanho = Math.round(176 * k);
  while (tamanho > 72 && larguraEm(tamanho) > INTERNA) tamanho -= 4;
  const rot = encaixar(m.rotulo, { largura: INTERNA, max: Math.round(52 * Math.max(k, 0.85)), min: 40, linhas: 2, fonte: { peso: 600 }, preferirMenos: 1 });
  const det = m.detalhe ? encaixar(m.detalhe, { largura: INTERNA, max: Math.round(48 * Math.max(k, 0.9)), min: 40, linhas: 2, fonte: { peso: 500 }, preferirMenos: 1 }) : null;
  const alturaRot = rot.linhas.length * rot.tamanho * 1.1;
  const alturaNum = tamanho * 0.92;
  const alturaDet = det ? det.linhas.length * det.tamanho * 1.14 + 18 : 0;
  const regua = 46;
  const etiqueta = m.ilustrativo ? 0 : 0;
  const altura = Math.round(PAD * 0.9 + alturaRot + 18 + alturaNum + regua + alturaDet + etiqueta + (arrasta ? ALTURA_ARRASTA : PAD * 0.2) + PAD * 0.8);
  return { casas, final, pre, suf, tamanho, rot, det, alturaRot, alturaNum, altura };
};

export const Numero: React.FC<{ m: TNumero; palavras: Palavra[]; t: number; zonaTopo: number; ate: number; saida: number; primeira: boolean }> = ({
  m,
  palavras,
  t,
  zonaTopo,
  ate,
  saida,
  primeira,
}) => {
  const arrasta = (m.arrasta ?? primeira) && !Number.isFinite(ate) && Number.isFinite(saida);
  const espaco = espacoDoCartao(zonaTopo, m.legenda);
  const k = ESCALAS.find((x) => medidasNumero(m, arrasta, x).altura <= espaco) ?? 0.66;
  const { casas, pre, suf, tamanho, rot, det, alturaRot, alturaNum, altura } = medidasNumero(m, arrasta, k);
  // no começo do vídeo o cartão já está no primeiro quadro (vira a miniatura do post)
  const noInicio = m.de < 0.3;
  const abre = noInicio ? -1 : m.de;
  const inicioRot = m.rotuloEm ?? Math.min(m.de + 0.1, m.em);
  const temposRot = temposDoTexto(m.rotulo, palavras, Math.min(m.de, inicioRot), m.ate, inicioRot).map((x) => (noInicio && x < 0.75 ? x - 1 : x));
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.em, m.ate, m.em + 0.6) : [];
  // o número conta de 0 até o valor a partir de `em`, freando no fim
  const pConta = interpolate(t, [m.em - 0.05, m.em + 0.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const atual = m.valor * pConta;
  const texto = numeroBR(pConta >= 1 ? m.valor : atual, casas);
  // o contador já está no cartão (em zero) e começa a contar na palavra
  const entrada = noInicio ? abre : Math.max(m.de, Math.min(temposRot[0] ?? m.em, m.em) - 0.3);
  const pRegua = prog(t, entrada + 0.2, 0.6);
  const pEtiqueta = prog(t, m.em + 0.9, 0.4);
  const topoNum = PAD * 0.9 + alturaRot + 18;
  const yRegua = topoNum + alturaNum + 14;
  const larguraRegua = INTERNA - (m.ilustrativo ? 230 : 0);
  return (
    <Cartao t={t} de={entrada} ate={ate} altura={altura} zonaTopo={zonaTopo} comLegenda={m.legenda}>
      <div style={{ position: "absolute", left: PAD, top: PAD * 0.9 }}>
        <TextoFalado linhas={rot.linhas} tempos={temposRot} t={t} tamanho={rot.tamanho} peso={600} cor={cor.petroleo} entrelinha={1.1} espacamento="-0.01em" />
      </div>
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: topoNum,
          height: alturaNum,
          display: "flex",
          alignItems: "baseline",
          gap: tamanho * 0.1,
          fontFamily: fonte,
          fontWeight: 800,
          lineHeight: 0.92,
          whiteSpace: "nowrap",
        }}
      >
        {pre ? <span style={{ fontSize: tamanho * 0.42, color: cor.petroleo, letterSpacing: "-0.01em" }}>{pre}</span> : null}
        {/* em espera, o zero fica a lápis (areia); acende em coral quando começa a contar */}
        <span style={{ fontSize: tamanho, color: misturarCor(cor.areiaFunda, cor.coral, prog(t, m.em - 0.12, 0.3)), letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums" }}>
          {texto}
        </span>
        {suf ? <span style={{ fontSize: tamanho * 0.42, color: cor.petroleo, letterSpacing: "-0.01em" }}>{suf}</span> : null}
      </div>
      {/* régua: o trilho areia e o coral que corre junto com a contagem */}
      <div style={{ position: "absolute", left: PAD, top: yRegua, width: larguraRegua * pRegua, height: 12, borderRadius: 6, background: cor.areia }} />
      <div style={{ position: "absolute", left: PAD, top: yRegua, width: larguraRegua * pConta, height: 12, borderRadius: 6, background: cor.coral }} />
      {m.ilustrativo ? (
        <div style={{ position: "absolute", right: PAD, top: yRegua - 22 }}>
          <Ilustrativo p={pEtiqueta} />
        </div>
      ) : null}
      {det ? (
        <div style={{ position: "absolute", left: PAD, top: yRegua + 12 + 30 }}>
          <TextoFalado linhas={det.linhas} tempos={temposDet} t={t} tamanho={det.tamanho} peso={500} cor={cor.petroleoSuave} entrelinha={1.14} espacamento="0em" />
        </div>
      ) : null}
      {arrasta ? <Arrasta t={t} saida={saida} /> : null}
    </Cartao>
  );
};

// ---------- destaque ----------

const medidasDestaque = (m: TDestaque, k = 1) => {
  const alerta = m.nivel === "alerta";
  const sinal = alerta ? Math.round(84 * Math.max(k, 0.8)) : 0;
  const coluna = INTERNA - (alerta ? sinal + 30 : 0);
  const texto = encaixar(m.texto, { largura: coluna, max: Math.round(100 * k), min: Math.round(64 * k), linhas: 3, fonte: { peso: 800, espacamento: -0.03 }, preferirMenos: 0.85 });
  const det = m.detalhe ? encaixar(m.detalhe, { largura: INTERNA, max: Math.round(50 * Math.max(k, 0.88)), min: 40, linhas: 2, fonte: { peso: 500 }, preferirMenos: 1 }) : null;
  const alturaTexto = texto.linhas.length * texto.tamanho * 1.04;
  const alturaDet = det ? det.linhas.length * det.tamanho * 1.14 + 26 : 0;
  // o sublinhado do `chave` fica abaixo da última linha
  const sublinhado = alerta ? 0 : 22;
  const altura = Math.round(PAD + Math.max(alturaTexto, sinal) + sublinhado + alturaDet + PAD);
  return { alerta, sinal, coluna, texto, det, alturaTexto, alturaDet, altura };
};

export const Destaque: React.FC<{ m: TDestaque; palavras: Palavra[]; t: number; zonaTopo: number; ate: number }> = ({ m, palavras, t, zonaTopo, ate }) => {
  const espaco = espacoDoCartao(zonaTopo, m.legenda);
  const k = ESCALAS.find((x) => medidasDestaque(m, x).altura <= espaco) ?? 0.66;
  const { alerta, sinal, texto, det, alturaTexto, alturaDet, altura } = medidasDestaque(m, k);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, m.em), m.ate, m.em);
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.detalheEm ?? m.em, m.ate, m.detalheEm ?? (tempos[tempos.length - 1] ?? m.em) + 0.4) : [];
  const ultimaFim = (tempos[tempos.length - 1] ?? m.em) + 0.3;
  const tinta = alerta ? cor.creme : cor.petroleo;
  const todas = m.texto.split(/\s+/).filter(Boolean);
  // `chave`: a última linha ganha o sublinhado coral quando a frase termina de chegar
  const ultimaLinha = texto.linhas[texto.linhas.length - 1].split(/\s+/).filter(Boolean).length;
  const sublinhadas = alerta ? undefined : new Set(Array.from({ length: ultimaLinha }, (_, i) => todas.length - ultimaLinha + i));
  // o cartão entra logo antes da primeira palavra e cresce linha a linha, depois com o detalhe
  const entrada = Math.max(m.de, (tempos[0] ?? m.em) - 0.3);
  const pSinal = prog(t, entrada + 0.05, 0.4);
  const pTraco = prog(t, entrada + 0.25, 0.5, Easing.inOut(Easing.cubic));
  const alturaLinha = texto.tamanho * 1.04;
  let inicioLinha = 0;
  const textoVivo = texto.linhas.reduce((soma, l, j) => {
    const t0 = tempos[inicioLinha] ?? m.em;
    inicioLinha += l.split(/\s+/).filter(Boolean).length;
    return soma + alturaLinha * (j === 0 ? 1 : prog(t, t0 - 0.15, 0.35));
  }, 0);
  const alturaViva = Math.round(
    PAD + Math.max(textoVivo, sinal) + (alerta ? 0 : 22) + (det ? alturaDet * prog(t, (temposDet[0] ?? m.em) - 0.2, 0.5) : 0) + PAD,
  );
  const yTexto = PAD + Math.max(0, (sinal - alturaLinha) / 2);
  return (
    <Cartao t={t} de={entrada} ate={ate} altura={altura} zonaTopo={zonaTopo} comLegenda={m.legenda} alturaViva={alturaViva} fundo={alerta ? cor.petroleoFundo : undefined}>
      {alerta ? (
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: PAD + Math.max(0, (alturaLinha - sinal) / 2),
            width: sinal,
            height: sinal,
            borderRadius: sinal / 2,
            background: cor.coral,
            scale: String(0.4 + 0.6 * pSinal),
            opacity: Math.min(1, pSinal * 3),
          }}
        >
          <svg width={sinal} height={sinal} viewBox="0 0 84 84">
            <Traco d="M42 20 L42 50" p={pTraco} cor={cor.creme} largura={9} />
            <Traco d="M42 64 L42 65" p={pTraco >= 0.95 ? 1 : 0} cor={cor.creme} largura={10} />
          </svg>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: PAD + (alerta ? sinal + 30 : 0), top: yTexto }}>
        <TextoFalado
          linhas={texto.linhas}
          tempos={tempos}
          t={t}
          tamanho={texto.tamanho}
          peso={800}
          cor={tinta}
          entrelinha={1.04}
          espacamento="-0.03em"
          sublinhado={sublinhadas}
          sublinhadoEm={ultimaFim}
        />
      </div>
      {det ? (
        <div style={{ position: "absolute", left: PAD, top: yTexto + Math.max(alturaTexto, sinal - (yTexto - PAD)) + (alerta ? 0 : 22) + 26 }}>
          <TextoFalado
            linhas={det.linhas}
            tempos={temposDet}
            t={t}
            tamanho={det.tamanho}
            peso={500}
            cor={alerta ? "rgba(244,236,225,0.78)" : cor.petroleoSuave}
            entrelinha={1.14}
            espacamento="0em"
          />
        </div>
      ) : null}
    </Cartao>
  );
};

// ---------- pergunta ----------

const medidasPergunta = (m: TPergunta, k = 1) => {
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const sinal = Math.round(76 * Math.max(k, 0.8));
  const coluna = INTERNA - sinal - 26;
  const texto = encaixar(m.texto, {
    largura: coluna,
    max: Math.round((opcoes.length ? 76 : 88) * k),
    min: Math.round(56 * k),
    linhas: opcoes.length ? 2 : 3,
    fonte: { peso: 700, espacamento: -0.02 },
    preferirMenos: 0.88,
  });
  const larguraOpcao = INTERNA - 112;
  const ops = opcoes.map((o) => encaixar(o.texto, { largura: larguraOpcao, max: Math.round(52 * Math.max(k, 0.85)), min: 38, linhas: 2, fonte: { peso: 600 }, preferirMenos: 0.85 }));
  const alturaOp = (e: { tamanho: number; linhas: string[] }) => Math.max(Math.round(100 * Math.max(k, 0.85)), Math.round(e.linhas.length * e.tamanho * 1.12 + 38));
  const alturaTexto = Math.max(texto.linhas.length * texto.tamanho * 1.08, sinal);
  const alturaOps = ops.length ? 30 + ops.reduce((s, e) => s + alturaOp(e) + 16, -16) : 0;
  const altura = Math.round(PAD * 0.9 + alturaTexto + alturaOps + PAD * 0.9);
  return { opcoes, sinal, coluna, texto, ops, alturaOp, alturaTexto, altura };
};

export const Pergunta: React.FC<{ m: TPergunta; palavras: Palavra[]; t: number; zonaTopo: number; ate: number }> = ({ m, palavras, t, zonaTopo, ate }) => {
  const espaco = espacoDoCartao(zonaTopo, m.legenda);
  const k = ESCALAS.find((x) => medidasPergunta(m, x).altura <= espaco) ?? 0.66;
  const { opcoes, sinal, texto, ops, alturaOp, alturaTexto, altura } = medidasPergunta(m, k);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), opcoes[0]?.em ?? m.ate, inicio + 0.05);
  const entrada = Math.max(m.de, (tempos[0] ?? inicio) - 0.3);
  const pSinal = prog(t, entrada + 0.05, 0.45);
  const pTraco = prog(t, entrada + 0.2, 0.6, Easing.inOut(Easing.cubic));
  let y = PAD * 0.9 + alturaTexto + 30;
  return (
    <Cartao t={t} de={entrada} ate={ate} altura={altura} zonaTopo={zonaTopo} comLegenda={m.legenda}>
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: PAD * 0.9 + Math.max(0, (Math.min(alturaTexto, texto.tamanho * 1.08) - sinal) / 2),
          width: sinal,
          height: sinal,
          borderRadius: sinal / 2,
          background: cor.coral,
          scale: String(0.4 + 0.6 * pSinal),
          opacity: Math.min(1, pSinal * 3),
        }}
      >
        <svg width={sinal} height={sinal} viewBox="0 0 76 76">
          <Traco d="M27 29 Q27 17 38 17 Q50 17 50 28 Q50 36 41 40 Q38 42 38 47" p={pTraco} cor={cor.creme} largura={7.5} />
          <Traco d="M38 58 L38 59" p={pTraco >= 0.95 ? 1 : 0} cor={cor.creme} largura={8.5} />
        </svg>
      </div>
      <div style={{ position: "absolute", left: PAD + sinal + 26, top: PAD * 0.9 }}>
        <TextoFalado linhas={texto.linhas} tempos={tempos} t={t} tamanho={texto.tamanho} peso={700} cor={cor.petroleo} entrelinha={1.08} espacamento="-0.02em" />
      </div>
      {opcoes.map((o, i) => {
        const e = ops[i];
        const h = alturaOp(e);
        const topo = y;
        y += h + 16;
        // a vaga tracejada espera; a barra chega deslizando da direita na palavra dela
        const p = prog(t, o.em - 0.15, 0.55);
        const temposOp = temposDoTexto(o.texto, palavras, o.em, (opcoes[i + 1]?.em ?? m.ate) + 0.2, o.em);
        const pRadio = prog(t, o.em + 0.1, 0.3);
        return (
          <div key={`${o.texto}-${i}`} style={{ position: "absolute", left: PAD, top: topo, width: INTERNA, height: h }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: h / 2, border: `3px dashed rgba(15,75,90,${0.3 * (1 - p)})`, boxSizing: "border-box" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: h / 2,
                background: cor.areia,
                translate: p >= 0.999 ? undefined : `${(1 - p) * (W + 40)}px 0`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 30,
                  top: h / 2 - 23,
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  boxShadow: `inset 0 0 0 4px ${cor.petroleo}`,
                  opacity: 0.35 + 0.65 * pRadio,
                }}
              />
              <div style={{ position: "absolute", left: 96, top: h / 2 - (e.linhas.length * e.tamanho * 1.12) / 2 }}>
                <TextoFalado linhas={e.linhas} tempos={temposOp} t={t} tamanho={e.tamanho} peso={600} cor={cor.petroleo} entrelinha={1.12} espacamento="-0.01em" />
              </div>
            </div>
          </div>
        );
      })}
    </Cartao>
  );
};
