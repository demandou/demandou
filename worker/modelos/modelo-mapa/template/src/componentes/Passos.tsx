// Passos: um caminho de pontos (o mesmo calendário de pontos da curva) desce pela esquerda; cada passo
// é um disco numerado que se enche de marca-texto na palavra que o nomeia, e a caneta risca o caminho
// do passo anterior até ele. O texto do passo se escreve ao lado; o título, ao lado do cartão.
import { caneta, Escrita, prog, temposDoTexto, Traco } from "../anim";
import { diagramar } from "../medidas";
import type { Palavra, Passos as TPassos } from "../plano";
import { BASE, CARTAO, cor, DIREITA_BAIXO, MARGEM, sans, serifa, titulo as estiloTitulo } from "../tema";

export const ROTA = { x: 112, raio: 40 };
const X_TEXTO = 186;
const TOPO = 772;

export const geometriaDosPassos = (m: TPassos) => {
  const C = CARTAO.passos;
  const larguraCol = C.x - MARGEM - 44;
  const titulo = m.titulo ? diagramar(m.titulo, { equilibrar: true, largura: larguraCol, maximo: 76, minimo: 48, linhas: 4, altura: 470, entrelinha: 1.04 }) : null;
  const largura = DIREITA_BAIXO - X_TEXTO;
  const n = Math.min(5, m.itens.length);
  const medidos = m.itens.slice(0, 5).map((it) => {
    const d = diagramar(it.texto, { equilibrar: true, largura, maximo: n > 4 ? 62 : n > 3 ? 72 : 84, minimo: 44, linhas: 2, entrelinha: 1.04 });
    const dd = it.detalhe ? diagramar(it.detalhe, { equilibrar: true, largura, maximo: 40, minimo: 34, linhas: 2, corte: "texto500", entrelinha: 1.2 }) : null;
    const hTexto = d.linhas.length * d.tamanho * 1.04;
    const h = Math.max(2 * ROTA.raio, hTexto) + (dd ? 8 + dd.linhas.length * dd.tamanho * 1.2 : 0);
    return { ...it, d, dd, hTexto, h };
  });
  const soma = medidos.reduce((s, i) => s + i.h, 0);
  const livre = BASE - 20 - TOPO - soma;
  const vao = Math.max(18, Math.min(130, livre / Math.max(1, n - 1)));
  // o que sobra fica um pouco acima e um pouco abaixo do caminho (o grupo fica no meio da faixa)
  let y = TOPO + Math.max(0, (livre - vao * (n - 1)) * 0.4);
  const itens = medidos.map((i) => {
    // o disco fica na altura do meio da primeira linha do texto
    const cy = y + Math.max(ROTA.raio, i.d.tamanho * 0.56);
    const r = { ...i, y, cy };
    y += i.h + vao;
    return r;
  });
  return { titulo, larguraCol, itens, chegada: { x: ROTA.x, y: itens[0].cy - ROTA.raio - 4 } };
};

export const Passos: React.FC<{ m: TPassos; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDosPassos(m);
  const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];
  return (
    <>
      {g.titulo ? (
        <div style={{ position: "absolute", left: MARGEM, top: 182, width: g.larguraCol }}>
          <Escrita linhas={g.titulo.linhas} tempos={temposTitulo} t={t} estilo={estiloTitulo} tamanho={g.titulo.tamanho} entrelinha={1.04} />
        </div>
      ) : null}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        {g.itens.slice(1).map((it, k) => {
          const de = g.itens[k].cy + ROTA.raio + 8;
          const ate = it.cy - ROTA.raio - 8;
          const n = Math.max(1, Math.floor((ate - de) / 24));
          const p = prog(t, it.em - 0.3, 0.36, caneta);
          return (
            <g key={`c-${k}`}>
              {/* o caminho de pontos, a lápis; a caneta o risca até o passo seguinte */}
              {Array.from({ length: n + 1 }, (_, j) => (
                <circle key={j} cx={ROTA.x} cy={de + ((ate - de) * j) / n} r={4.5} fill={cor.lapis} />
              ))}
              <Traco d={`M ${ROTA.x} ${de} L ${ROTA.x} ${ate}`} p={p} cor={cor.tinta} largura={7} />
            </g>
          );
        })}
        {g.itens.map((it, i) => {
          const p = prog(t, it.em - 0.04, 0.3);
          return (
            <g key={`d-${i}`}>
              <circle cx={ROTA.x} cy={it.cy} r={ROTA.raio} fill={cor.cartao} stroke={cor.lapis} strokeWidth={4} strokeDasharray="4 7" />
              {p > 0 ? <circle cx={ROTA.x} cy={it.cy} r={ROTA.raio * (0.7 + 0.3 * p)} fill={cor.marca} stroke={cor.tinta} strokeWidth={5} opacity={p} /> : null}
            </g>
          );
        })}
      </svg>
      {g.itens.map((it, i) => {
        const feito = t >= it.em - 0.04;
        const tempos = temposDoTexto(it.texto, palavras, m.de, m.ate, it.em);
        const temposDetalhe = it.dd && it.detalhe ? temposDoTexto(it.detalhe, palavras, m.de, m.ate, it.em + 0.2) : [];
        return (
          <div key={`p-${i}`}>
            <div
              style={{
                position: "absolute",
                left: ROTA.x - ROTA.raio,
                top: it.cy - ROTA.raio,
                width: 2 * ROTA.raio,
                height: 2 * ROTA.raio,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: serifa,
                fontWeight: 800,
                fontSize: 44,
                lineHeight: 1,
                color: feito ? cor.tinta : cor.lapis,
              }}
            >
              {i + 1}
            </div>
            <div style={{ position: "absolute", left: X_TEXTO, top: it.cy - it.d.tamanho * 0.56 }}>
              <Escrita linhas={it.d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={it.d.tamanho} entrelinha={1.04} />
              {it.dd ? (
                <div style={{ marginTop: 8 }}>
                  <Escrita linhas={it.dd.linhas} tempos={temposDetalhe} t={t} estilo={{ fontFamily: sans, fontWeight: 500, color: cor.tintaSuave }} tamanho={it.dd.tamanho} entrelinha={1.2} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
};
