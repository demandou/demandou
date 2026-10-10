// Pergunta: à direita do cartão da pessoa, a caneta circula um "?" grande (o ramo dela chega no
// círculo); embaixo, a pergunta se escreve palavra por palavra. As opções são caixinhas de caderno:
// cada uma ganha tinta na sua palavra, e a caixinha da opção da vez fica com marca-texto.
import { caneta, Escrita, prog, temposDoTexto, Traco } from "../anim";
import { diagramar } from "../medidas";
import type { Palavra, Pergunta as TPergunta } from "../plano";
import { BASE, CARTAO, cor, DIREITA_BAIXO, MARGEM, sans, serifa, titulo as estiloTitulo } from "../tema";

export const CIRCULO = { cx: 776, cy: 400, r: 190 };
const CAIXA = 66;

export const geometriaDaPergunta = (m: TPergunta) => {
  const C = CARTAO.pergunta;
  const topo = C.y + C.h + 56;
  const largura = DIREITA_BAIXO - MARGEM;
  const opcoes = (m.opcoes ?? []).slice(0, 4).map((o) => {
    const d = diagramar(o.texto, { equilibrar: true, largura: largura - CAIXA - 34, maximo: 60, minimo: 44, linhas: 2, corte: "texto600", entrelinha: 1.16 });
    return { ...o, d, altura: Math.max(CAIXA, d.linhas.length * d.tamanho * 1.16) + 40 };
  });
  const altOpcoes = opcoes.reduce((s, o) => s + o.altura, 0);
  const espaco = BASE - 12 - topo - (opcoes.length ? altOpcoes + 50 : 0);
  const d = diagramar(m.texto, { equilibrar: true, largura, maximo: 120, minimo: 60, linhas: opcoes.length ? 3 : 4, altura: espaco, entrelinha: 1.04 });
  // sem opções, a pergunta desce um pouco para o meio da faixa
  const sobra = opcoes.length ? 0 : Math.max(0, espaco - d.linhas.length * d.tamanho * 1.04);
  const topoTexto = topo + sobra * 0.3;
  let y = topoTexto + d.linhas.length * d.tamanho * 1.04 + 56;
  const posicionadas = opcoes.map((o) => {
    const r = { ...o, y };
    y += o.altura;
    return r;
  });
  return { topo: topoTexto, d, opcoes: posicionadas, chegada: { x: CIRCULO.cx - CIRCULO.r, y: CIRCULO.cy } };
};

export const Pergunta: React.FC<{ m: TPergunta; palavras: Palavra[]; t: number }> = ({ m, palavras, t }) => {
  const g = geometriaDaPergunta(m);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de);
  const inicio = tempos[0] ?? m.em ?? m.de;
  const pCirculo = prog(t, inicio - 0.15, 0.6, caneta);
  const pInterrogacao = prog(t, inicio + 0.2, 0.35);
  const { cx, cy, r } = CIRCULO;
  const anel = `M ${cx - r * 0.2} ${cy - r * 0.98} A ${r} ${r} 0 1 1 ${cx - r * 0.24} ${cy - r * 0.97}`;
  // a opção da vez: a última que já foi dita
  const atual = g.opcoes.reduce((k, o, i) => (t >= o.em ? i : k), -1);
  const interrogacao: React.CSSProperties = {
    position: "absolute",
    left: cx - 150,
    top: cy - 170,
    width: 300,
    textAlign: "center",
    fontFamily: serifa,
    fontWeight: 800,
    fontSize: 300,
    lineHeight: 1.1,
  };
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1080} height={1920}>
        <circle cx={cx} cy={cy} r={r} fill={cor.cartao} opacity={0.85} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.lapisClaro} strokeWidth={5} strokeDasharray="3 12" strokeLinecap="round" />
        <Traco d={anel} p={pCirculo} cor={cor.tinta} largura={8} />
      </svg>
      <div style={{ ...interrogacao, color: cor.esboco, opacity: 1 - pInterrogacao }}>?</div>
      {pInterrogacao > 0 ? (
        <div style={{ ...interrogacao, color: cor.tinta, clipPath: pInterrogacao < 0.999 ? `inset(${((1 - pInterrogacao) * 100).toFixed(2)}% 0 0 0)` : undefined }}>?</div>
      ) : null}
      <div style={{ position: "absolute", left: MARGEM, top: g.topo }}>
        <Escrita linhas={g.d.linhas} tempos={tempos} t={t} estilo={estiloTitulo} tamanho={g.d.tamanho} entrelinha={1.04} />
      </div>
      {g.opcoes.map((o, i) => {
        const p = prog(t, o.em - 0.05, 0.3);
        const marca = i === atual ? prog(t, o.em + 0.1, 0.3, caneta) : 0;
        const temposOpcao = temposDoTexto(o.texto, palavras, m.de, m.ate, o.em);
        const yCaixa = o.y + (Math.min(o.altura - 30, Math.max(CAIXA, o.d.tamanho * 1.16)) - CAIXA) / 2;
        return (
          <div key={`o-${i}`}>
            <div
              style={{
                position: "absolute",
                left: MARGEM,
                top: yCaixa,
                width: CAIXA,
                height: CAIXA,
                borderRadius: 14,
                background: cor.cartao,
                border: `${p > 0.5 ? 6 : 4}px ${p > 0.5 ? "solid" : "dashed"} ${p > 0.5 ? cor.tinta : cor.lapis}`,
                overflow: "hidden",
              }}
            >
              {marca > 0 ? <div style={{ position: "absolute", inset: 0, background: cor.marca, transformOrigin: "left center", transform: `scaleX(${marca.toFixed(4)})` }} /> : null}
            </div>
            <div style={{ position: "absolute", left: MARGEM + CAIXA + 34, top: o.y + (o.d.linhas.length === 1 ? (CAIXA - o.d.tamanho * 1.16) / 2 : 0) }}>
              <Escrita linhas={o.d.linhas} tempos={temposOpcao} t={t} estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tinta }} tamanho={o.d.tamanho} entrelinha={1.16} />
            </div>
          </div>
        );
      })}
    </>
  );
};
