// Pergunta para quem assiste: chega como uma mensagem no relógio. Embaixo dele, o balão espera
// "digitando" e a pergunta se monta na fala; as opções viram botões de resposta rápida que esperam
// como esqueleto e acendem quando ditas (o anel acende uma parte por opção — ver relogio.ts).
import { Linhas, prog, temposDoTexto } from "../anim";
import { encaixar, larguraTexto, MOSTRADOR, SANS } from "../medida";
import type { Palavra, Pergunta as PerguntaT } from "../plano";
import { cor, mostrador, sans, sombraCartao, ZONAS } from "../tema";
import { Digitando, topoDaZona } from "./Zona";

export const Pergunta: React.FC<{ m: PerguntaT; t: number; palavras: Palavra[] }> = ({ m, t, palavras }) => {
  const topo = topoDaZona() + 6;
  const em = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const z = ZONAS[1];
  // opções: uma embaixo da outra (4 opções: duas colunas); o maior corpo em que tudo cabe
  const colunas = opcoes.length === 4 ? 2 : 1;
  const largOpcao = colunas === 2 ? 410 : 840;
  const lhDe = (tam: number) => Math.round(tam * 1.16);
  const medir = (tamPergunta: number, tamOpcaoMax: number) => {
    const enc = encaixar(m.texto, { largura: 840 - 96, max: tamPergunta, min: Math.min(46, tamPergunta), linhas: 3 });
    const encOpcoes = opcoes.map((o) => encaixar(o.texto, { largura: largOpcao - 64, max: tamOpcaoMax, min: Math.min(34, tamOpcaoMax), linhas: 2, fonte: SANS }));
    const tamOpcao = Math.min(tamOpcaoMax, ...encOpcoes.map((e) => e.tamanho));
    const lhOpcao = Math.round(tamOpcao * 1.18);
    const linhasOp = opcoes.map((o) => encaixar(o.texto, { largura: largOpcao - 64, max: tamOpcao, min: tamOpcao, linhas: 2, fonte: SANS }).linhas);
    const alturas: number[] = [];
    for (let i = 0; i < opcoes.length; i += colunas) alturas.push(Math.max(...linhasOp.slice(i, i + colunas).map((l) => l.length * lhOpcao + 40)));
    const altBalao = Math.max(136, enc.linhas.length * lhDe(enc.tamanho) + 64);
    const altOpcoes = alturas.reduce((x, y) => x + y + 18, 0);
    return { enc, tamOpcao, lhOpcao, linhasOp, alturas, altBalao, total: altBalao + (opcoes.length ? 30 + altOpcoes : 0) };
  };
  let md = medir(80, 54);
  for (const [tp, to] of [[72, 50], [66, 46], [60, 42], [54, 38], [48, 34]]) {
    if (topo + md.total <= 1520) break;
    md = medir(tp, to);
  }
  const { enc, tamOpcao, lhOpcao, linhasOp, alturas: linhasDeOpcoes, altBalao } = md;
  const lh = lhDe(enc.tamanho);
  const sobra = Math.max(0, 1520 - topo - md.total);
  const vao = 30 + Math.min(40, sobra * 0.3);
  const vaoOpcoes = 18 + (opcoes.length > 1 ? Math.min(16, (sobra * 0.2) / (opcoes.length - 1)) : 0);
  const largBalao = Math.min(840, Math.max(480, Math.round(enc.largura + 96)));
  const xBalao = 540 - largBalao / 2;
  const enche = prog(t, em - 0.08, 0.3);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, em), m.ate, em);
  const topoOpcoes = topo + altBalao + vao;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* rabicho apontando para o relógio */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path
          d={`M${xBalao + largBalao * 0.3} ${topo + 2} L${xBalao + largBalao * 0.3 + 18} ${topo - 30} L${xBalao + largBalao * 0.3 + 54} ${topo + 2} Z`}
          fill={enche > 0.01 ? cor.cartao : "none"}
          stroke={enche > 0.01 ? "none" : cor.esboco}
          strokeWidth={4}
          strokeDasharray="10 10"
        />
      </svg>
      <div style={{ position: "absolute", left: xBalao, top: topo, width: largBalao, height: altBalao, borderRadius: 48, border: `4px dashed ${cor.esboco}`, opacity: 1 - enche }} />
      <div
        style={{
          position: "absolute",
          left: xBalao,
          top: topo,
          width: largBalao,
          height: altBalao,
          borderRadius: 48,
          background: cor.cartao,
          boxShadow: sombraCartao,
          opacity: enche,
        }}
      />
      {enche < 0.99 ? <Digitando x={540} y={topo + altBalao / 2} t={t} opacidade={1 - enche} /> : null}
      {enche > 0.2 ? (
        <Linhas
          linhas={enc.linhas}
          tempos={tempos}
          t={t}
          x={xBalao}
          y={topo + (altBalao - enc.linhas.length * lh) / 2}
          largura={largBalao}
          alturaLinha={lh}
          alinhar="center"
          estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: cor.tinta, letterSpacing: "-0.01em" }}
          esboco={cor.esboco}
        />
      ) : null}
      {/* respostas rápidas */}
      {opcoes.map((o, i) => {
        const linha = Math.floor(i / colunas);
        const col = i % colunas;
        const y = topoOpcoes + linhasDeOpcoes.slice(0, linha).reduce((a, b) => a + b + vaoOpcoes, 0);
        const h = linhasDeOpcoes[linha];
        const x = 120 + col * (largOpcao + 20);
        const p = prog(t, o.em - 0.05, 0.3);
        const e = { linhas: linhasOp[i] };
        const temposO = temposDoTexto(o.texto, palavras, o.em - 0.3, (opcoes[i + 1]?.em ?? m.ate) + 0.2, o.em);
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: y, width: largOpcao, height: h, borderRadius: 999, border: `4px dashed ${cor.esboco}`, opacity: 1 - p }} />
            {e.linhas.map((l, k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: x + 32,
                  top: y + (h - e.linhas.length * lhOpcao) / 2 + k * lhOpcao + lhOpcao * 0.3,
                  width: Math.min(largOpcao - 64, larguraTexto(l, tamOpcao, MOSTRADOR) * 0.9),
                  height: lhOpcao * 0.4,
                  borderRadius: 99,
                  background: "#DCE0DA",
                  opacity: 1 - p,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: largOpcao,
                height: h,
                borderRadius: h / 2 > 60 ? 40 : 999,
                background: cor.cartao,
                border: `4px solid ${z.cor}`,
                opacity: p,
                scale: String(0.95 + 0.05 * p),
              }}
            />
            {t >= o.em - 0.06 ? (
              <Linhas
                linhas={e.linhas}
                tempos={temposO}
                t={t}
                x={x + 32}
                y={y + (h - e.linhas.length * lhOpcao) / 2}
                largura={largOpcao - 64}
                alturaLinha={lhOpcao}
                alinhar="center"
                estilo={{ fontFamily: sans, fontWeight: 700, fontSize: tamOpcao, color: z.texto }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
