// O contraste: duas faixas, uma embaixo da outra, lidas como a frase falada —
// "Resposta seca → vácuo" / "Conversa → venda". Cada faixa nasce a lápis (tracejada), acende quando
// o título é dito; a seta se desenha no "vira" e o desfecho chega na palavra.
// Desfecho "ruim": o balão de resposta que nunca chega (tracejado). "bom": o cartão confirmado com ✓.
import { Digitado, limitar, prog, rola, temposDoTexto, Traco } from "../anim";
import type { ContrasteInterno, LadoInterno } from "../blocos";
import { medidas } from "../fio";
import type { Palavra } from "../plano";
import { cor, fonte, larguraTexto, MARGEM, W } from "../tema";
import { Balao } from "./Balao";
import { Icone } from "./Icones";

const LARGURA = W - 2 * MARGEM;
const DESFECHO = { altura: 132, vacuo: 280, venda: 360, selo: 132 };
const TITULO = 74;
const RESULTADO = 86;
const PAD = 30;
const CORPO = 70;
const GAP = 24;

// largura do desfecho de um lado
const larguraDesfecho = (lado: LadoInterno) => {
  const r = lado.resultado;
  if (r.tipo === "ruim") return DESFECHO.vacuo;
  if (!r.valor && !r.rotulo) return DESFECHO.selo;
  const texto = Math.max(larguraTexto(r.rotulo ?? "", 36, 700), larguraTexto(r.valor ?? "", 58, 800));
  return Math.max(DESFECHO.venda, Math.round(20 + 88 + 18 + texto + 22));
};

// O desfecho visual: o balão que nunca chega (ruim) ou o cartão confirmado (bom)
const Desfecho: React.FC<{ lado: LadoInterno; t: number }> = ({ lado, t }) => {
  const r = lado.resultado;
  const p = prog(t, r.em - 0.08, 0.5);
  if (r.tipo === "ruim") {
    return (
      <svg width={DESFECHO.vacuo} height={DESFECHO.altura} viewBox={`0 0 ${DESFECHO.vacuo} ${DESFECHO.altura}`} style={{ overflow: "visible", display: "block" }}>
        <rect
          x={2}
          y={2}
          width={DESFECHO.vacuo - 4}
          height={DESFECHO.altura - 4}
          rx={44}
          fill="none"
          stroke={p > 0 ? "rgba(242,238,231,0.42)" : "rgba(242,238,231,0.14)"}
          strokeWidth={4}
          strokeDasharray="16 13"
          strokeDashoffset={(1 - p) * 80}
        />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={DESFECHO.vacuo / 2 - 40 + i * 40} cy={DESFECHO.altura / 2} r={11} fill="rgba(242,238,231,0.24)" opacity={limitar(p * 2 - i * 0.3)} />
        ))}
      </svg>
    );
  }
  if (!r.valor && !r.rotulo) {
    // sem valor: um selo redondo com ✓ que se desenha
    return (
      <div
        style={{
          width: DESFECHO.selo,
          height: DESFECHO.selo,
          borderRadius: DESFECHO.selo,
          background: p > 0 ? cor.acento : "transparent",
          border: p > 0 ? "4px solid transparent" : "4px dashed rgba(242,238,231,0.16)",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.4 + 0.6 * p,
          scale: String(0.85 + 0.15 * p),
        }}
      >
        <Icone nome="check" tamanho={70} cor={cor.tinta} traco={8} p={limitar((p - 0.2) / 0.6)} />
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        height: DESFECHO.altura,
        width: larguraDesfecho(lado),
        boxSizing: "border-box",
        padding: "0 26px 0 20px",
        borderRadius: 40,
        background: p > 0 ? cor.cartao : "transparent",
        border: p > 0 ? "4px solid transparent" : "4px dashed rgba(242,238,231,0.16)",
        opacity: 0.4 + 0.6 * p,
        translate: `0 ${(1 - p) * 16}px`,
        fontFamily: fonte,
      }}
    >
      <div style={{ width: 88, height: 88, borderRadius: 50, background: p > 0 ? cor.acento : "rgba(242,238,231,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icone nome="check" tamanho={52} cor={cor.tinta} traco={7} p={limitar((p - 0.2) / 0.6)} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", color: cor.tinta, opacity: p }}>
        {r.rotulo ? <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.05, whiteSpace: "nowrap" }}>{r.rotulo}</div> : null}
        {r.valor ? <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{r.valor}</div> : null}
      </div>
    </div>
  );
};

// a mensagem da faixa: o corpo diminui até caber ao lado da seta e do desfecho
const medidaDaMensagem = (lado: LadoInterno) => {
  const msg = lado.mensagens[0];
  if (!msg) return null;
  const larguraVisto = msg.vistoEm !== undefined ? 160 : 0;
  const disponivel = LARGURA - 2 * PAD - larguraDesfecho(lado) - larguraVisto - 24 - 44;
  for (let c = CORPO; c >= 48; c -= 2) {
    const med = medidas(msg, c, Math.max(300, disponivel), true);
    if (med.w <= disponivel + 6 && med.linhas.length <= 1) return med;
  }
  return medidas(msg, 48, Math.max(300, disponivel), true);
};

// título (à esquerda) e desfecho em palavra (à direita) dividem a linha de cima
const corposDoTopo = (lado: LadoInterno) => {
  const util = LARGURA - 2 * PAD - 62 - 30;
  let titulo = TITULO;
  let resultado = RESULTADO;
  while (titulo > 50 && larguraTexto(lado.titulo, titulo, 800) * 1.03 + larguraTexto(lado.resultado.texto, resultado, 800) * 1.03 > util) {
    titulo -= 2;
    resultado = Math.round((titulo / TITULO) * RESULTADO);
  }
  return { titulo, resultado };
};

const Faixa: React.FC<{ lado: LadoInterno; em: number; t: number; altura: number; palavras: Palavra[]; hora: string }> = ({ lado, em, t, altura, palavras, hora }) => {
  const p = prog(t, em - 0.15, 0.4);
  const r = lado.resultado;
  const ruim = r.tipo === "ruim";
  const temposTitulo = temposDoTexto(lado.titulo, palavras, em, r.em, em);
  const temposResultado = temposDoTexto(r.texto, palavras, r.em - 0.3, r.em + 1, r.em);
  // a seta se desenha no "vira" (ou um pouco antes do desfecho)
  const viraEm = lado.viraEm ?? r.em - 0.35;
  const pSeta = prog(t, viraEm - 0.05, 0.4);
  const pRes = prog(t, r.em - 0.08, 0.45);
  const corRes = ruim ? "rgba(242,238,231,0.5)" : cor.acento;
  const msg = lado.mensagens[0];
  const med = medidaDaMensagem(lado);
  const pm = prog(t, em + 0.1, 0.35, rola);
  const { titulo: corpoTitulo, resultado: corpoResultado } = corposDoTopo(lado);
  const yLinha = PAD + Math.max(100, Math.round(corpoTitulo * 1.1) + 18);
  const larguraVisto = msg?.vistoEm !== undefined ? 160 : 0;
  const desfechoW = larguraDesfecho(lado);
  return (
    <div
      style={{
        position: "relative",
        width: LARGURA,
        height: altura,
        borderRadius: 42,
        background: p > 0 ? cor.barra : "transparent",
        border: `3px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? cor.linha : "rgba(242,238,231,0.16)"}`,
        fontFamily: fonte,
      }}
    >
      {/* título à esquerda, desfecho à direita: a frase falada */}
      <Digitado
        linhas={[lado.titulo]}
        tempos={temposTitulo}
        t={t}
        rascunho
        style={{ position: "absolute", left: PAD, top: PAD - 8, fontSize: corpoTitulo, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.015em", color: cor.porcelana }}
      />
      <div style={{ position: "absolute", right: PAD, top: PAD - 10, display: "flex", alignItems: "center", gap: 12 }}>
        <Icone nome={ruim ? "x" : "check"} tamanho={50} cor={pRes > 0 ? corRes : "rgba(242,238,231,0.16)"} traco={7} p={pRes > 0 ? pRes : 1} />
        <Digitado
          linhas={[r.texto]}
          tempos={temposResultado}
          t={t}
          rascunho
          style={{ fontSize: corpoResultado, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.02em", color: pRes > 0 ? corRes : "rgba(242,238,231,0.3)" }}
        />
      </div>
      {/* a mensagem que vai… */}
      {msg && med ? (
        <div style={{ position: "absolute", left: PAD - 6, top: yLinha, display: "flex", alignItems: "center", gap: 20, opacity: pm * (p > 0 ? 1 : 0.3), translate: `0 ${(1 - pm) * 20}px` }}>
          <Balao m={msg} med={med} t={t} hora={msg.hora ?? hora} palavras={palavras} semMeta />
          {msg.vistoEm !== undefined && t >= msg.vistoEm ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 38, fontWeight: 600, color: cor.porcelanaSuave }}>
              <Icone nome="checks" tamanho={44} cor={cor.porcelanaSuave} traco={4} />
              Visto
            </div>
          ) : null}
        </div>
      ) : null}
      {/* …vira… */}
      {med ? (
        <svg width={LARGURA} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          {(() => {
            const x0 = PAD - 6 + med.w + larguraVisto + 28;
            const x1 = LARGURA - PAD - desfechoW - 24;
            const y = yLinha + med.h / 2;
            return (
              <>
                <Traco d={`M${x0} ${y} L${x1} ${y}`} cor={ruim ? "rgba(242,238,231,0.45)" : cor.acento} largura={5} p={pSeta} strokeDasharray={ruim ? "2 14" : undefined} />
                <Traco d={`M${x1 - 18} ${y - 16} L${x1} ${y} L${x1 - 18} ${y + 16}`} cor={ruim ? "rgba(242,238,231,0.45)" : cor.acento} largura={5} p={limitar((pSeta - 0.8) / 0.2)} />
              </>
            );
          })()}
        </svg>
      ) : null}
      {/* …e o desfecho */}
      <div style={{ position: "absolute", right: PAD, top: yLinha + (med ? med.h / 2 : DESFECHO.altura / 2) - DESFECHO.altura / 2 }}>
        <Desfecho lado={lado} t={t} />
      </div>
    </div>
  );
};

export const ContrasteTela: React.FC<{ m: ContrasteInterno; t: number; altura: number; palavras: Palavra[]; hora: string; topo?: number }> = ({
  m,
  t,
  altura,
  palavras,
  hora,
  topo = 16,
}) => {
  const emEsq = m.esquerdaEm ?? m.de + 0.1;
  const emDir = m.direitaEm ?? m.esquerda.resultado.em + 0.6;
  // cada faixa tem a altura do que leva (título + mensagem + "Visto"), sem passar da metade da área
  const alturaDe = (lado: LadoInterno) => {
    const med = medidaDaMensagem(lado);
    const { titulo } = corposDoTopo(lado);
    const conteudo = PAD + Math.max(100, Math.round(titulo * 1.1) + 18) + Math.max(med?.h ?? 0, DESFECHO.altura) + PAD;
    return Math.min(conteudo, (altura - GAP - 30) / 2);
  };
  return (
    <div style={{ position: "absolute", left: MARGEM, top: topo, display: "flex", flexDirection: "column", gap: GAP }}>
      <Faixa lado={m.esquerda} em={emEsq} t={t} altura={alturaDe(m.esquerda)} palavras={palavras} hora={hora} />
      <Faixa lado={m.direita} em={emDir} t={t} altura={alturaDe(m.direita)} palavras={palavras} hora={hora} />
    </div>
  );
};
