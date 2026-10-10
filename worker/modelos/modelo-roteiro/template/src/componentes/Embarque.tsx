// Abertura: cartão de embarque na altura do peito. O título já está escrito a lápis no primeiro
// quadro (vira a capa do post) e cada palavra ganha tinta quando é dita; o aviãozinho cruza o
// bilhete, do passageiro até o destino no canhoto, enquanto a frase acontece.
import { indicesDoTrecho, limitar, misturarCor, prog, TextoALapis, temposDoTexto } from "../anim";
import type { Embarque as TipoEmbarque, Palavra } from "../plano";
import { encaixar } from "../medida";
import { cor, display, sans } from "../tema";

const Aviao: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={56} height={56} viewBox="-28 -28 56 56" style={{ position: "absolute", left: x - 28, top: y - 28 }}>
    <path
      d="M24 0 C 24 -3, 20 -4, 16 -4 L 6 -4 L -6 -22 L -12 -22 L -4 -4 L -16 -4 L -21 -10 L -25 -10 L -22 0 L -25 10 L -21 10 L -16 4 L -4 4 L -12 22 L -6 22 L 6 4 L 16 4 C 20 4, 24 3, 24 0 Z"
      fill={cor.azulejo}
    />
  </svg>
);

export const ALTURA_EMBARQUE = 470;

export const Embarque: React.FC<{ m: TipoEmbarque; palavras: Palavra[]; marca: { nome: string; area: string }; t: number; topo: number; saidaFim?: number }> = ({ m, palavras, marca, t, topo, saidaFim }) => {
  const W = 960;
  const H = ALTURA_EMBARQUE;
  const canhoto = 286;
  const corpoW = W - canhoto;
  // sai descendo para fora da tela (como um bilhete guardado no bolso) enquanto a pessoa encolhe
  const fimSaida = saidaFim ?? m.ate + 0.32;
  const saida = prog(t, fimSaida - 0.42, 0.42, (x) => x * x);
  const entrada = prog(t, m.de - 0.3, 0.5);
  const inicioTexto = m.em ?? m.de;
  const tempos = temposDoTexto(m.titulo, palavras, m.de, m.ate, inicioTexto);
  const destaque = indicesDoTrecho(m.titulo, m.destaque);
  const larguraTitulo = corpoW - 90;
  const { tamanho: corpo, linhas } = encaixar(m.titulo, { largura: larguraTitulo, max: 100, min: 56, linhas: 2, fonte: { peso: 600 } });
  const temposSub = m.subtitulo ? temposDoTexto(m.subtitulo, palavras, m.de, m.ate, tempos[tempos.length - 1] ?? m.de) : [];
  const fimFrase = palavras.filter((p) => p.em >= m.de && p.em < m.ate).slice(-1)[0]?.ate ?? m.ate;
  const inicioVoo = (tempos[0] ?? m.de) - 0.1;
  const voo = prog(t, inicioVoo, Math.max(0.6, fimFrase - inicioVoo), (x) => x);
  const codigo = m.codigo ?? "";
  // linha de baixo: passageiro à esquerda, a rota do avião até o canhoto à direita
  const linhaY = H - 48;
  // a rota começa logo depois do nome do passageiro
  const rotaX0 = Math.min(corpoW - 220, Math.max(300, 48 + (marca.nome || "—").length * 46 * 0.56 + 36));
  const rotaX1 = corpoW - 34;
  const destino = voo >= 1 ? 1 : prog(t, tempos[tempos.length - 1] ?? m.de, 0.4);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: topo,
        width: W,
        height: H,
        opacity: limitar(entrada * 1.5) * (1 - limitar((saida - 0.7) / 0.3)),
        translate: `0 ${(1 - entrada) * 60 + saida * 620}px`,
        rotate: "-0.6deg",
      }}
    >
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 14px 22px rgba(60,44,20,0.24))" }}>
        <path
          d={`M22 0 H${corpoW - 22} A22 22 0 0 0 ${corpoW + 22} 0 H${W - 22} Q${W} 0 ${W} 22 V${H - 22} Q${W} ${H} ${W - 22} ${H} H${corpoW + 22} A22 22 0 0 0 ${corpoW - 22} ${H} H22 Q0 ${H} 0 ${H - 22} V22 Q0 0 22 0 Z`}
          fill={cor.papel}
        />
        <line x1={corpoW} y1={34} x2={corpoW} y2={H - 34} stroke={cor.azulejo} strokeOpacity={0.45} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" />
        {/* faixa de azulejos na borda esquerda */}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} transform={`translate(18 ${40 + i * 52})`}>
            <path d="M0 4 l6 6 l-6 6 l-6 -6 Z" fill={cor.azulejo} opacity={0.85} />
            <circle cx={0} cy={10} r={1.8} fill={cor.sol} />
          </g>
        ))}
        {/* rota do avião: do passageiro até o destino */}
        <line x1={rotaX0} y1={linhaY} x2={rotaX1} y2={linhaY} stroke={cor.lapis} strokeWidth={3} strokeDasharray="3 11" strokeLinecap="round" />
        <line x1={rotaX0} y1={linhaY} x2={rotaX0 + (rotaX1 - rotaX0) * voo} y2={linhaY} stroke={cor.azulejo} strokeWidth={6} strokeDasharray="0.1 16" strokeLinecap="round" />
        <circle cx={rotaX0} cy={linhaY} r={7} fill={cor.azulejo} />
        <circle cx={rotaX1} cy={linhaY} r={9} fill={misturarCor(cor.papel, cor.azulejo, destino)} stroke={cor.azulejo} strokeWidth={3} />
      </svg>
      {voo > 0 && voo < 1 ? <Aviao x={rotaX0 + (rotaX1 - rotaX0) * voo} y={linhaY} /> : null}

      {/* corpo do bilhete */}
      <div style={{ position: "absolute", left: 48, top: 24, fontFamily: sans, fontWeight: 600, fontSize: 34, letterSpacing: "0.14em", textTransform: "uppercase", color: cor.azulejo }}>
        {m.rotulo ?? "Cartão de embarque"}
      </div>
      <TextoALapis
        linhas={linhas}
        tempos={tempos}
        t={t}
        tinta={cor.tinta}
        lapis={cor.lapis}
        destaque={destaque}
        corDestaque={cor.azulejo}
        estiloDestaque={{ fontStyle: "italic" }}
        style={{ position: "absolute", left: 46, top: 76, fontFamily: display, fontWeight: 600, fontSize: corpo, lineHeight: 0.98 }}
      />
      {m.subtitulo ? (
        <TextoALapis
          linhas={[m.subtitulo]}
          tempos={temposSub}
          t={t}
          tinta="#4B5160"
          lapis={cor.lapis}
          style={{ position: "absolute", left: 48, top: 78 + linhas.length * corpo * 0.98, fontFamily: display, fontStyle: "italic", fontWeight: 500, fontSize: 50, lineHeight: 1.1 }}
        />
      ) : null}
      {/* passageiro: rótulo em cima, nome embaixo, na mesma linha da rota do avião */}
      <div style={{ position: "absolute", left: 48, top: linhaY - 74, fontFamily: sans, fontWeight: 600, fontSize: 32, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9A8C73", lineHeight: "38px" }}>
        Passageiro
      </div>
      <div style={{ position: "absolute", left: 48, top: linhaY - 30, fontFamily: sans, fontWeight: 600, fontSize: 46, color: cor.tinta, lineHeight: "56px", whiteSpace: "nowrap" }}>
        {marca.nome || "—"}
      </div>

      {/* canhoto: o destino */}
      <div style={{ position: "absolute", left: corpoW, width: canhoto, top: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 32, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9A8C73" }}>Destino</div>
        <div style={{ marginTop: 18, fontFamily: display, fontWeight: 700, fontSize: codigo ? 118 : 64, lineHeight: 1, color: misturarCor(cor.lapis, cor.azulejo, destino) }}>
          {codigo || m.destaque || ""}
        </div>
        {m.duracao ? (
          <div style={{ marginTop: 26, fontFamily: sans, fontWeight: 600, fontSize: 40, color: cor.tinta, padding: "4px 22px", border: `3px solid ${cor.azulejo}`, borderRadius: 30 }}>
            {m.duracao}
          </div>
        ) : null}
        {/* código de barras discreto */}
        <svg width={200} height={70} style={{ marginTop: 34 }}>
          {Array.from({ length: 34 }, (_, i) => {
            const w = [2, 4, 2, 6, 3, 2, 5][i % 7];
            return <rect key={i} x={i * 6} y={0} width={w * 0.8} height={70} fill={cor.tinta} opacity={0.75} />;
          })}
        </svg>
      </div>
    </div>
  );
};
