// Página de definição, no gesto do carrossel: o termo grande se monta na fala (com um esboço
// "a lápis" esperando por ele) e ganha o sublinhado coral; um "=" coral atravessa o vão e o
// significado chega deslizando da direita num cartão petróleo, para a vaga tracejada que já esperava.
import { Easing } from "remotion";
import { mistura, prog, temposDoTexto, TextoFalado, Traco } from "../anim";
import { encaixar, larguraLinha } from "../medida";
import { AVATAR } from "../paginas";
import type { Definicao as TDefinicao, Palavra } from "../plano";
import { BASE_CONTEUDO, BASE_SEM_LEGENDA, cor, MARGEM, W } from "../tema";

const LARGURA = W - 2 * MARGEM;
const PAD = 48;
const TOPO_CONTEUDO = AVATAR.y + AVATAR.lado + 44;

export const Definicao: React.FC<{ m: TDefinicao; palavras: Palavra[]; t: number; chegada: number }> = ({ m, palavras, t, chegada }) => {
  const base = m.legenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA;
  // o título da página: o do plano (montado na fala) ou um rótulo fixo "O que é"
  const tituloFalado = !!m.titulo?.trim();
  const tituloTexto = tituloFalado ? (m.titulo as string).trim() : "O que é";
  const titulo = encaixar(tituloTexto, { largura: LARGURA - 120, max: 62, min: 46, linhas: 2, fonte: { peso: 800, espacamento: -0.02 }, preferirMenos: 0.9 });
  const alturaTitulo = titulo.linhas.length * titulo.tamanho * 1.05 + 50;
  // o termo: o maior possível em até 2 linhas; o significado: até 3 linhas no cartão
  const termo = encaixar(m.termo, { largura: LARGURA, max: 150, min: 76, linhas: 2, fonte: { peso: 800, espacamento: -0.035 }, preferirMenos: 0.85 });
  const significado = encaixar(m.significado, { largura: LARGURA - 2 * PAD, max: 88, min: 54, linhas: 3, fonte: { peso: 600, espacamento: -0.02 }, preferirMenos: 0.88 });
  const alturaTermo = termo.linhas.length * termo.tamanho * 1.0 + 34;
  const vao = 176;
  // a página fica cheia: o cartão do significado cresce com a sobra (até 600 px) e o conjunto centraliza
  const natural = Math.max(320, Math.round(significado.linhas.length * significado.tamanho * 1.12 + 2 * PAD + 20));
  const sobra0 = base - TOPO_CONTEUDO - (alturaTitulo + alturaTermo + vao + natural);
  const alturaCartao = Math.round(natural + Math.max(0, Math.min(sobra0 * 0.5, 600 - natural)));
  const total = alturaTitulo + alturaTermo + vao + alturaCartao;
  const topo = Math.round(TOPO_CONTEUDO + Math.max(0, (base - TOPO_CONTEUDO - total) / 2));
  const yTermo = topo + alturaTitulo;
  const yCartao = yTermo + alturaTermo + vao;

  const temposTitulo = tituloFalado ? temposDoTexto(tituloTexto, palavras, m.de, m.em, m.de + 0.1) : tituloTexto.split(/\s+/).map(() => chegada - 0.5);
  const temposTermo = temposDoTexto(m.termo, palavras, Math.min(m.em, m.de), m.significadoEm, m.em);
  const temposSig = temposDoTexto(m.significado, palavras, m.significadoEm, m.ate, m.significadoEm);
  const fimTermo = (temposTermo[temposTermo.length - 1] ?? m.em) + 0.35;
  const todas = m.termo.split(/\s+/).filter(Boolean);
  const ultimaLinha = termo.linhas[termo.linhas.length - 1].split(/\s+/).filter(Boolean).length;
  const sublinhadas = new Set(Array.from({ length: ultimaLinha }, (_, i) => todas.length - ultimaLinha + i));
  const pLinhaTitulo = prog(t, chegada - 0.3, 0.9, Easing.inOut(Easing.cubic));
  const sinalEm = m.significadoEm - 0.3;
  const pSinal = prog(t, sinalEm, 0.5);
  const pSinalTraco = prog(t, sinalEm + 0.12, 0.45, Easing.inOut(Easing.cubic));
  const pCartao = prog(t, m.significadoEm - 0.16, 0.62);
  // esboço do termo: barras areia com a largura de cada linha, que somem quando o termo chega
  const pTermo = prog(t, (temposTermo[0] ?? m.em) - 0.05, 0.3);
  let cursor = 0;

  return (
    <>
      {/* título e régua */}
      <div style={{ position: "absolute", left: MARGEM, top: topo, width: LARGURA, display: "flex", alignItems: "flex-end", gap: 28 }}>
        <TextoFalado linhas={titulo.linhas} tempos={temposTitulo} t={t} tamanho={titulo.tamanho} peso={800} cor={cor.petroleo} entrelinha={1.05} espacamento="-0.02em" />
        <svg height={4} style={{ flex: 1, overflow: "visible", marginBottom: titulo.tamanho * 0.4 }}>
          <line x1={0} y1={2} x2={`${pLinhaTitulo * 100}%`} y2={2} stroke={cor.petroleo} strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" />
        </svg>
      </div>

      {/* esboço a lápis do termo */}
      {termo.linhas.map((l, k) => {
        const n = l.split(/\s+/).length;
        const larg = larguraLinha(l, termo.tamanho, { peso: 800, espacamento: -0.035 });
        const inicioLinha = temposTermo[cursor] ?? m.em;
        cursor += n;
        const pl = prog(t, inicioLinha - 0.05, 0.3);
        return (
          <div
            key={`esboco-${k}`}
            style={{
              position: "absolute",
              left: MARGEM,
              top: yTermo + k * termo.tamanho + termo.tamanho * 0.22,
              width: larg,
              height: termo.tamanho * 0.62,
              borderRadius: 18,
              background: cor.areia,
              opacity: (1 - pl) * Math.min(1, prog(t, chegada - 0.2, 0.4) + 0.4) * (pTermo < 1 || pl < 1 ? 1 : 0),
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: MARGEM, top: yTermo }}>
        <TextoFalado
          linhas={termo.linhas}
          tempos={temposTermo}
          t={t}
          tamanho={termo.tamanho}
          peso={800}
          cor={cor.petroleo}
          entrelinha={1.0}
          espacamento="-0.035em"
          sublinhado={sublinhadas}
          sublinhadoEm={fimTermo}
        />
      </div>

      {/* a vaga do significado e o cartão que chega deslizando */}
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: yCartao,
          width: LARGURA,
          height: alturaCartao,
          borderRadius: 44,
          border: `4px dashed rgba(15,75,90,${0.42 * (1 - pCartao)})`,
          boxSizing: "border-box",
        }}
      >
        {/* esboço a lápis das linhas do significado, enquanto ele não chega */}
        {significado.linhas.map((l, k) => (
          <div
            key={`esboco-sig-${k}`}
            style={{
              position: "absolute",
              left: PAD - 4,
              top: (alturaCartao - significado.linhas.length * significado.tamanho * 1.12) / 2 + k * significado.tamanho * 1.12 + significado.tamanho * 0.28 - 4,
              width: larguraLinha(l, significado.tamanho, { peso: 600, espacamento: -0.02 }),
              height: significado.tamanho * 0.56,
              borderRadius: 14,
              background: cor.areia,
              opacity: 0.85 * (1 - pCartao),
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: yCartao,
          width: LARGURA,
          height: alturaCartao,
          borderRadius: 44,
          background: cor.petroleoFundo,
          translate: pCartao >= 0.999 ? undefined : `${(1 - pCartao) * (W + 40)}px 0`,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: PAD, top: (alturaCartao - significado.linhas.length * significado.tamanho * 1.12) / 2 }}>
          <TextoFalado linhas={significado.linhas} tempos={temposSig} t={t} tamanho={significado.tamanho} peso={600} cor={cor.creme} entrelinha={1.12} espacamento="-0.02em" />
        </div>
      </div>

      {/* "=": um círculo coral no vão */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 62,
          top: yTermo + alturaTermo + vao / 2 - 62,
          width: 124,
          height: 124,
          borderRadius: 62,
          background: cor.coral,
          boxShadow: `0 0 0 12px ${cor.creme}`,
          scale: String(mistura(0.3, 1, pSinal)),
          opacity: Math.min(1, pSinal * 3),
        }}
      >
        <svg width={124} height={124} viewBox="0 0 124 124">
          <Traco d="M38 50 L86 50" p={Math.min(1, pSinalTraco * 1.6)} cor={cor.creme} largura={10} />
          <Traco d="M38 76 L86 76" p={Math.max(0, pSinalTraco * 1.6 - 0.6)} cor={cor.creme} largura={10} />
        </svg>
      </div>
    </>
  );
};

