// Blocos de texto da faixa de cima (frase, pergunta, destaque, definição, número): tudo centrado,
// como uma página de revista, com a linha do espelho descendo só o necessário. Cada palavra é
// revelada pelo fio dourado no instante em que é dita; os fios se abrem do centro para fora, como
// num reflexo.
import { capaDe, prog, saindo, temposDoTexto, TextoEmLinhas, Traco } from "../anim";
import { larguraTexto } from "../medida";
import {
  formatarNumero,
  geometriaDaDefinicao,
  geometriaDaFrase,
  geometriaDaPergunta,
  geometriaDoDestaque,
  geometriaDoNumero,
  LARGURA_TEXTO,
  X_TEXTO,
} from "../blocos";
import type { Definicao, Destaque, Frase, Numero, Palavra, Pergunta } from "../plano";
import { cor, FONTE_TITULO, rotulo, sans, serif } from "../tema";

type Props<M> = { m: M; t: number; fim: number; linhaMaxima: number; palavras: Palavra[] };

const titulo: React.CSSProperties = { fontFamily: serif, fontWeight: 500, color: cor.cafe, letterSpacing: "-0.012em" };
const italico: React.CSSProperties = { fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: cor.cafe };

// Fio que se abre do centro para fora (as duas metades juntas), com um losango opcional no meio
export const FioDoCentro: React.FC<{ y: number; largura: number; p: number; cor: string; losango?: number; espessura?: number }> = ({
  y,
  largura,
  p,
  cor: c,
  losango,
  espessura = 2.2,
}) => {
  const meia = (largura / 2) * p;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {p > 0.002 ? <line x1={540 - meia} x2={540 + meia} y1={y} y2={y} stroke={c} strokeWidth={espessura} /> : null}
      {losango !== undefined && losango > 0.01 ? (
        <rect x={540 - 8} y={y - 8} width={16} height={16} fill={c} opacity={losango} transform={`rotate(45 540 ${y}) scale(1)`} />
      ) : null}
    </svg>
  );
};

const ultimoTempo = (tempos: number[]) => (tempos.length ? Math.max(...tempos) : 0);

// ---------------------------------------------------------------- frase
export const BlocoFrase: React.FC<Props<Frase>> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDaFrase(m, linhaMaxima);
  const capa = capaDe(m.de);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(g.texto.linhas.join(" "), palavras, inicio, m.ate, inicio + 0.05).map(capa);
  const sai = saindo(t, fim, 0.3);
  // as aspas são a estrutura da página: entram junto com ela (nunca uma página vazia na troca)
  const pAspas = prog(t, capa(Math.min(inicio - 0.15, m.de + 0.1)), 0.5);
  const yFilete = g.topo + g.alturaAspas + 18 + g.texto.linhas.length * g.texto.tamanho * 1.14 + 26;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <div
        style={{
          position: "absolute",
          left: X_TEXTO,
          width: LARGURA_TEXTO,
          top: g.topo - g.aspas * 0.12,
          height: g.alturaAspas,
          textAlign: "center",
          fontFamily: serif,
          fontWeight: 400,
          fontSize: g.aspas,
          lineHeight: 1,
          color: cor.ouro,
          opacity: pAspas,
          translate: `0 ${(1 - pAspas) * 10}px`,
        }}
      >
        “
      </div>
      <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: g.topo + g.alturaAspas + 18 }}>
        <TextoEmLinhas
          linhas={g.texto.linhas}
          tempos={tempos}
          t={t}
          tamanho={g.texto.tamanho}
          entre={1.14}
          alinhar="center"
          style={italico}
          marcas={[{ trecho: m.destaque, style: { color: cor.ouroTexto, fontWeight: 500 } }]}
          risco={m.risco ? { trecho: m.risco, em: m.riscoEm, cor: cor.alerta } : undefined}
        />
      </div>
      <FioDoCentro y={yFilete} largura={180} p={prog(t, ultimoTempo(tempos) + 0.3, 0.6)} cor={cor.ouro} />
    </div>
  );
};

// ---------------------------------------------------------------- pergunta
const LETRAS = ["A", "B", "C", "D"];
export const BlocoPergunta: React.FC<Props<Pergunta>> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDaPergunta(m, linhaMaxima);
  const capa = capaDe(m.de);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(g.texto.linhas.join(" "), palavras, inicio, m.ate, inicio + 0.05).map(capa);
  const sai = saindo(t, fim, 0.3);
  const pSinal = prog(t, capa(Math.min(inicio - 0.1, m.de + 0.1)), 0.6);
  const topoTexto = g.topo + g.sinal * 0.72 + 14;
  const topoOpcoes = topoTexto + g.texto.linhas.length * g.texto.tamanho * 1.08 + 36;
  const xColuna = 540 - g.larguraColuna / 2;
  // a opção da vez fica inteira; as outras já ditas apagam um pouco
  const ditas = g.opcoes.filter((o) => t >= o.em - 0.05);
  const atual = ditas[ditas.length - 1];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <div
        style={{
          position: "absolute",
          left: X_TEXTO,
          width: LARGURA_TEXTO,
          top: g.topo - g.sinal * 0.2,
          textAlign: "center",
          fontFamily: serif,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: g.sinal,
          lineHeight: 1,
          color: cor.ouro,
          clipPath: `inset(-20% ${(1 - pSinal) * 100}% -20% 0)`,
        }}
      >
        ?
      </div>
      <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: topoTexto }}>
        <TextoEmLinhas linhas={g.texto.linhas} tempos={tempos} t={t} tamanho={g.texto.tamanho} entre={1.08} alinhar="center" style={titulo} />
      </div>
      {g.opcoes.map((o, i) => {
        const y = topoOpcoes + i * (g.alturaOpcao + g.vaoOpcoes);
        const temposOpcao = temposDoTexto(o.texto, palavras, o.em, m.ate, o.em);
        const pEsboco = prog(t, (ultimoTempo(tempos) || inicio) + 0.15 + i * 0.1, 0.4);
        const pDita = prog(t, o.em - 0.05, 0.4);
        const opacidade = !atual || o === atual || t < o.em - 0.05 ? 1 : 0.55;
        return (
          <div key={i} style={{ position: "absolute", left: xColuna, top: y, height: g.alturaOpcao, display: "flex", alignItems: "center", gap: 22, opacity: opacidade }}>
            <svg width={g.circulo} height={g.circulo} style={{ flex: "none", opacity: Math.max(pEsboco, pDita) }}>
              <circle cx={g.circulo / 2} cy={g.circulo / 2} r={g.circulo / 2 - 1.5} fill={pDita > 0 ? cor.ouro : "none"} fillOpacity={pDita} stroke={cor.ouro} strokeWidth={2} />
              <text
                x={g.circulo / 2}
                y={g.circulo / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontFamily: sans, fontWeight: 500, fontSize: 26, fill: pDita > 0.5 ? cor.champanhe : cor.ouroTexto }}
              >
                {LETRAS[i]}
              </text>
            </svg>
            <TextoEmLinhas linhas={[o.texto]} tempos={temposOpcao} t={t} tamanho={g.corpoOpcoes} entre={1.15} style={italico} />
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- destaque
export const BlocoDestaque: React.FC<Props<Destaque>> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDoDestaque(m, linhaMaxima);
  const capa = capaDe(m.de);
  const tempos = temposDoTexto(g.texto.linhas.join(" "), palavras, m.em, m.ate, m.em).map(capa);
  const sai = saindo(t, fim, 0.3);
  const corFio = m.nivel === "alerta" ? cor.alerta : cor.ouro;
  const corTexto = m.nivel === "alerta" ? cor.alerta : m.nivel === "chave" ? cor.ouroTexto : cor.cafe;
  const yTexto = g.topo + 30;
  const yFioBaixo = yTexto + g.texto.linhas.length * g.texto.tamanho * 1.04 + 22;
  const detalheEm = m.detalheEm ?? ultimoTempo(tempos) + 0.4;
  const temposDetalhe = g.detalhe ? temposDoTexto(g.detalhe.linhas.join(" "), palavras, detalheEm, m.ate, detalheEm) : [];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <FioDoCentro y={g.topo + 6} largura={g.larguraFios} p={prog(t, capa(Math.min(m.em - 0.2, m.de + 0.1)), 0.6)} cor={corFio} />
      <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: yTexto }}>
        <TextoEmLinhas
          linhas={g.texto.linhas}
          tempos={tempos}
          t={t}
          tamanho={g.texto.tamanho}
          entre={1.04}
          alinhar="center"
          style={{ ...titulo, color: corTexto, fontStyle: m.nivel === "chave" ? "italic" : "normal", letterSpacing: "-0.015em" }}
          dur={0.5}
        />
      </div>
      <FioDoCentro y={yFioBaixo} largura={g.larguraFios} p={prog(t, capa(Math.min(m.em + 0.05, m.de + 0.2)), 0.7)} cor={corFio} losango={prog(t, capa(m.em + 0.35), 0.4)} />
      {g.detalhe ? (
        <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: yFioBaixo + 34 }}>
          <TextoEmLinhas linhas={g.detalhe.linhas} tempos={temposDetalhe} t={t} tamanho={g.detalhe.tamanho} entre={1.14} alinhar="center" style={italico} />
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- definição
export const BlocoDefinicao: React.FC<Props<Definicao>> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDaDefinicao(m, linhaMaxima);
  const capa = capaDe(m.de);
  const temposTermo = temposDoTexto(g.termo.linhas.join(" "), palavras, m.em, m.ate, m.em).map(capa);
  const temposSig = temposDoTexto(g.significado.linhas.join(" "), palavras, m.significadoEm, m.ate, m.significadoEm);
  const sai = saindo(t, fim, 0.3);
  const pFio = prog(t, m.significadoEm - 0.25, 0.7);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: g.topo }}>
        <TextoEmLinhas linhas={g.termo.linhas} tempos={temposTermo} t={t} tamanho={g.termo.tamanho} entre={1.04} alinhar="center" style={titulo} />
      </div>
      {/* esboço do fio (tracejado claro) até o significado ser dito; então o fio dourado se abre */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <Traco
          d={`M ${540 - g.larguraFio / 2} ${g.yFio} L ${540 + g.larguraFio / 2} ${g.yFio}`}
          p={prog(t, capa(Math.min(m.em + 0.2, m.de + 0.15)), 0.5) * (1 - pFio)}
          cor={cor.cafeLinha}
          largura={2}
          tracejado="6 8"
        />
      </svg>
      <FioDoCentro y={g.yFio} largura={g.larguraFio} p={pFio} cor={cor.ouro} losango={prog(t, m.significadoEm, 0.4)} />
      <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: g.yFio + 9 + 30 }}>
        <TextoEmLinhas linhas={g.significado.linhas} tempos={temposSig} t={t} tamanho={g.significado.tamanho} entre={1.14} alinhar="center" style={italico} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- número
const REGUA = 600;
export const BlocoNumero: React.FC<Props<Numero>> = ({ m, t, fim, linhaMaxima, palavras }) => {
  const g = geometriaDoNumero(m, linhaMaxima);
  const sai = saindo(t, fim, 0.3);
  const pConta = prog(t, m.em, 1.3);
  const casas = m.casas ?? 0;
  const atual = formatarNumero(m.valor * pConta, casas);
  const pNumero = prog(t, m.em - 0.08, 0.35);
  const capa = capaDe(m.de);
  const rotuloEm = m.rotuloEm ?? m.de;
  const temposRotulo = temposDoTexto(g.rotulo.linhas.join(" "), palavras, rotuloEm, m.ate, rotuloEm).map(capa);
  const pRegua = prog(t, capa(m.de + 0.1), 0.6);
  const x0 = 540 - REGUA / 2;
  const xLosango = x0 + REGUA * pConta;
  const corpoMenor = g.corpo * 0.42;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {m.ilustrativo ? (
        <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: g.topo, display: "flex", justifyContent: "center", opacity: prog(t, m.de + 0.2, 0.4) }}>
          <span style={{ ...rotulo, fontSize: 30 }}>ilustrativo</span>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 1080,
          top: g.topoNumero,
          height: g.corpo * 0.86,
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          opacity: pNumero,
          translate: `0 ${(1 - pNumero) * 14}px`,
        }}
      >
        {m.prefixo ? (
          <span style={{ fontFamily: serif, fontWeight: 400, fontSize: corpoMenor, color: cor.ouroTexto, marginRight: g.corpo * 0.12, lineHeight: 1 }}>{m.prefixo}</span>
        ) : null}
        <span
          style={{
            ...titulo,
            fontSize: g.corpo,
            lineHeight: 0.86,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums lining-nums",
            minWidth: larguraTexto(g.final, g.corpo, FONTE_TITULO),
            textAlign: "right",
          }}
        >
          {atual}
        </span>
        {m.sufixo ? (
          <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, fontSize: corpoMenor, color: cor.ouroTexto, marginLeft: g.corpo * 0.12, lineHeight: 1 }}>
            {m.sufixo}
          </span>
        ) : null}
      </div>
      {/* a régua: o losango corre enquanto o número conta e o trecho percorrido fica dourado */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: pRegua }}>
        <line x1={x0} x2={x0 + REGUA * pRegua} y1={g.yRegua} y2={g.yRegua} stroke={cor.cafeLinha} strokeWidth={2} />
        {Array.from({ length: 11 }, (_, i) => {
          const x = x0 + (REGUA * i) / 10;
          const longo = i === 0 || i === 5 || i === 10;
          return <line key={i} x1={x} x2={x} y1={g.yRegua} y2={g.yRegua - (longo ? 18 : 10)} stroke={pConta * REGUA >= x - x0 - 0.5 && pConta > 0 ? cor.ouro : cor.cafeLinha} strokeWidth={2.2} />;
        })}
        {pConta > 0 ? <line x1={x0} x2={xLosango} y1={g.yRegua} y2={g.yRegua} stroke={cor.ouro} strokeWidth={3} /> : null}
        {pConta > 0 ? <rect x={xLosango - 9} y={g.yRegua - 9} width={18} height={18} fill={cor.ouro} transform={`rotate(45 ${xLosango} ${g.yRegua})`} /> : null}
      </svg>
      <div style={{ position: "absolute", left: X_TEXTO, width: LARGURA_TEXTO, top: g.topoRotulo }}>
        <TextoEmLinhas linhas={g.rotulo.linhas} tempos={temposRotulo} t={t} tamanho={g.rotulo.tamanho} entre={1.14} alinhar="center" style={italico} />
      </div>
    </div>
  );
};

