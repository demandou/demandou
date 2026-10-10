// Blocos universais escritos direto sobre o peito da pessoa (quadro cheio, véu escuro embaixo),
// como o título da abertura: Quicksand creme, palavras que sobem no tempo da fala, a faixa de cor
// "passada" por trás do que importa.
//   destaque → a frase curta bate forte e a faixa passa por trás dela inteira (vinho = alerta)
//   frase    → aspas finas em blush, a frase palavra por palavra, `destaque` com faixa, `risco` riscado
import { mistura, prog, saindo } from "../anim";
import type { Destaque, Frase, Palavra } from "../plano";
import { cor, fonte, sombraTexto } from "../tema";
import { Passada } from "./Amostra";
import { Icone } from "./Icones";
import { alturaDe, medir, TextoFalado, temposFalados } from "./Texto";

const LARGURA = 1080 - 2 * 64;
// o texto sobre o peito vai até aqui (acima da interface do app)
const BASE = 1530;

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
  const disponivel = BASE - topo - 96;
  const hDet = (k: number) => (m.detalhe ? alturaDe(medir(m.detalhe, LARGURA, Math.round(52 * k), 40, 2, 500), 1.15) + 22 : 0);
  let texto = medir(m.texto, LARGURA, 118, 64, 3);
  let k = 1;
  while (alturaDe(texto, 1.12) + hDet(k) > disponivel && texto.tamanho > 60) {
    k *= 0.92;
    texto = medir(m.texto, LARGURA, Math.round(texto.tamanho * 0.92), 56, 3);
  }
  const detalhe = m.detalhe ? medir(m.detalhe, LARGURA, Math.round(52 * k), 40, 2, 500) : null;
  const tempos = temposFalados(m.texto, palavras, m.em, m.detalheEm ?? m.ate + 0.3, desde);
  const ultima = tempos[tempos.length - 1] ?? m.em;
  const temposDet = m.detalhe ? temposFalados(m.detalhe, palavras, m.detalheEm ?? ultima + 0.3, m.ate + 0.3, desde) : [];
  const pI = prog(t, Math.max(desde, m.em - 0.15), 0.45);
  return (
    <div style={{ position: "absolute", left: 64, top: topo, width: LARGURA, fontFamily: fonte, color: cor.creme, textShadow: sombraTexto, opacity: 1 - sai, translate: `0 ${sai * 30}px` }}>
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: "50%",
          background: alerta ? cor.berry : cor.blush,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          scale: String(mistura(0.5, 1, pI)),
          opacity: pI,
          boxShadow: "0 6px 20px rgba(20,10,16,0.35)",
        }}
      >
        <Icone nome={alerta ? "alerta" : "brilho"} p={prog(t, Math.max(desde, m.em), 0.6)} tamanho={42} cor={alerta ? cor.creme : cor.tinta} largura={9} />
      </div>
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
      {m.detalhe && detalhe ? <TextoFalado texto={m.detalhe} medida={detalhe} tempos={temposDet} t={t} peso={500} entrelinha={1.15} style={{ marginTop: 22 }} /> : null}
    </div>
  );
};

export const PeitoFrase: React.FC<{ m: Frase; t: number; fim: number; palavras: Palavra[]; topo: number; desde: number }> = ({ m, t, fim, palavras, topo, desde }) => {
  const sai = saindo(t, fim, 0.35);
  if (sai >= 1) return null;
  const inicio = Math.max(desde, m.em ?? m.de);
  const disponivel = BASE - topo - 70;
  let texto = medir(m.texto, LARGURA, 100, 60, 3, 500);
  while (alturaDe(texto, 1.14) > disponivel && texto.tamanho > 56) texto = medir(m.texto, LARGURA, texto.tamanho - 6, 52, 4, 500);
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
    <div style={{ position: "absolute", left: 64, top: topo - 20, width: LARGURA, fontFamily: fonte, color: cor.creme, textShadow: sombraTexto, opacity: 1 - sai, translate: `0 ${sai * 30}px` }}>
      {/* uma pincelada curta de blush abre a frase (no lugar das aspas): a amostra do estilo */}
      <div style={{ width: 230, height: 46, marginBottom: 26, filter: "drop-shadow(0 2px 10px rgba(20,10,16,0.35))" }}>
        <Passada cor={cor.blush} t={t} em={inicio - 0.25} largura={230} altura={46} id={`frase-${m.de}`} />
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
