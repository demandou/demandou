// Blocos universais escritos direto sobre o peito da pessoa (quadro cheio, véu escuro embaixo),
// como o título da abertura: Quicksand creme, palavras que sobem no tempo da fala, a faixa de cor
// "passada" por trás do que importa.
//   destaque → a frase curta bate forte e a faixa passa por trás dela inteira (vinho = alerta)
//   frase    → uma pincelada curta de blush abre a frase; `destaque` com faixa, `risco` riscado
// No quadro deitado (src/fileira.ts) o texto fica na faixa larga abaixo do queixo, em linhas largas;
// no destaque o ícone vai ao lado da frase (fileira) em vez de em cima dela.
import { mistura, prog, saindo } from "../anim";
import { assentar, LARGURA_PEITO } from "../fileira";
import type { Destaque, Frase, Palavra } from "../plano";
import { BASE_TEXTO, cor, deitado, fonte, MARGEM, sombraTexto } from "../tema";
import { Passada } from "./Amostra";
import { Icone } from "./Icones";
import { alturaDe, medir, TextoFalado, temposFalados } from "./Texto";

const ICONE = 78;
const VAO_ICONE = 30;

export const PeitoDestaque: React.FC<{ m: Destaque; t: number; fim: number; palavras: Palavra[]; topo: number; desde: number }> = ({
  m,
  t,
  fim,
  palavras,
  topo,
  desde,
}) => {
  const sai = saindo(t, fim, 0.35);
  if (sai >= 1) return null;
  const alerta = m.nivel === "alerta";
  const largura = LARGURA_PEITO - ICONE - VAO_ICONE;
  const disponivel = BASE_TEXTO - topo;
  const hDet = (k: number) => (m.detalhe ? alturaDe(medir(m.detalhe, largura, Math.round(deitado(52) * k), 40, 2, 500), 1.15) + 18 : 0);
  let texto = medir(m.texto, largura, deitado(118), 56, 2);
  let k = 1;
  while (alturaDe(texto, 1.12) + hDet(k) > disponivel && texto.tamanho > 52) {
    k *= 0.92;
    texto = medir(m.texto, largura, Math.round(texto.tamanho * 0.92), 48, 3);
  }
  const detalhe = m.detalhe ? medir(m.detalhe, largura, Math.round(deitado(52) * k), 40, 2, 500) : null;
  const altura = Math.max(ICONE, alturaDe(texto, 1.12) + hDet(k));
  const tempos = temposFalados(m.texto, palavras, m.em, m.detalheEm ?? m.ate + 0.3, desde);
  const ultima = tempos[tempos.length - 1] ?? m.em;
  const temposDet = m.detalhe ? temposFalados(m.detalhe, palavras, m.detalheEm ?? ultima + 0.3, m.ate + 0.3, desde) : [];
  const pI = prog(t, Math.max(desde, m.em - 0.15), 0.45);
  // o ícone fica na altura da primeira linha
  const topoIcone = Math.max(0, (texto.tamanho * 1.12 - ICONE) / 2);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: assentar(topo, altura),
        width: LARGURA_PEITO,
        display: "flex",
        alignItems: "flex-start",
        gap: VAO_ICONE,
        fontFamily: fonte,
        color: cor.creme,
        textShadow: sombraTexto,
        opacity: 1 - sai,
        translate: `0 ${sai * 30}px`,
      }}
    >
      <div
        style={{
          width: ICONE,
          height: ICONE,
          flexShrink: 0,
          marginTop: topoIcone,
          borderRadius: "50%",
          background: alerta ? cor.berry : cor.blush,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(mistura(0.5, 1, pI)),
          opacity: pI,
          boxShadow: "0 6px 20px rgba(20,10,16,0.35)",
        }}
      >
        <Icone nome={alerta ? "alerta" : "brilho"} p={prog(t, Math.max(desde, m.em), 0.6)} tamanho={42} cor={alerta ? cor.creme : cor.tinta} largura={9} />
      </div>
      <div style={{ width: largura }}>
        <TextoFalado
          texto={m.texto}
          medida={texto}
          tempos={tempos}
          t={t}
          entrelinha={1.12}
          destaque={m.texto}
          faixa={alerta ? { cor: cor.berry, texto: cor.creme } : { cor: cor.blush, texto: cor.tinta }}
          style={{ letterSpacing: "-0.01em" }}
        />
        {m.detalhe && detalhe ? <TextoFalado texto={m.detalhe} medida={detalhe} tempos={temposDet} t={t} peso={500} entrelinha={1.15} style={{ marginTop: 18 }} /> : null}
      </div>
    </div>
  );
};

// a pincelada que abre a frase (no lugar das aspas)
const PINCELADA = { w: 210, h: 42, vao: 20 };

export const PeitoFrase: React.FC<{ m: Frase; t: number; fim: number; palavras: Palavra[]; topo: number; desde: number }> = ({ m, t, fim, palavras, topo, desde }) => {
  const sai = saindo(t, fim, 0.35);
  if (sai >= 1) return null;
  const inicio = Math.max(desde, m.em ?? m.de);
  const disponivel = BASE_TEXTO - topo - PINCELADA.h - PINCELADA.vao;
  let texto = medir(m.texto, LARGURA_PEITO, deitado(100), 56, 2, 500);
  while (alturaDe(texto, 1.14) > disponivel && texto.tamanho > 48) texto = medir(m.texto, LARGURA_PEITO, texto.tamanho - 6, 44, 3, 500);
  const altura = PINCELADA.h + PINCELADA.vao + alturaDe(texto, 1.14);
  const tempos = temposFalados(m.texto, palavras, inicio, m.ate + 0.3, desde);
  // o risco passa quando o trecho riscado é dito (ou no `riscoEm`)
  let riscoEm = m.riscoEm;
  if (m.risco && riscoEm === undefined) {
    const ws = m.texto.split(/\s+/).filter(Boolean);
    const primeira = m.risco.split(/\s+/).filter(Boolean)[0]?.toLowerCase();
    const i = ws.findIndex((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === primeira?.replace(/[^\p{L}\p{N}]/gu, ""));
    const fimTrecho = i >= 0 ? (tempos[Math.min(ws.length - 1, i + m.risco.split(/\s+/).length - 1)] ?? inicio) : inicio;
    riscoEm = fimTrecho + 0.35;
  }
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: assentar(topo, altura),
        width: LARGURA_PEITO,
        fontFamily: fonte,
        color: cor.creme,
        textShadow: sombraTexto,
        opacity: 1 - sai,
        translate: `0 ${sai * 30}px`,
      }}
    >
      {/* uma pincelada curta de blush abre a frase (no lugar das aspas): a amostra do estilo */}
      <div style={{ width: PINCELADA.w, height: PINCELADA.h, marginBottom: PINCELADA.vao, filter: "drop-shadow(0 2px 10px rgba(20,10,16,0.35))" }}>
        <Passada cor={cor.blush} t={t} em={inicio - 0.25} largura={PINCELADA.w} altura={PINCELADA.h} id={`frase-${m.de}`} />
      </div>
      <TextoFalado
        texto={m.texto}
        medida={texto}
        tempos={tempos}
        t={t}
        peso={500}
        pesoDestaque={600}
        entrelinha={1.14}
        destaque={m.destaque}
        faixa={{ cor: cor.blush, texto: cor.tinta }}
        risco={m.risco ? { trecho: m.risco, em: riscoEm ?? inicio, cor: cor.blush } : undefined}
      />
    </div>
  );
};
