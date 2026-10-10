// Pergunta (bloco universal).
// - Sem opções, em quadro cheio: o GC com o "?" na aba azul e a pergunta na tarja branca, palavra
//   por palavra (sem tarja de nome: quem pergunta é o apresentador).
// - Com opções, no painel do estúdio: a enquete do telejornal. A pergunta em caixa-alta branca em
//   cima e as opções em tarjas com a letra (A, B, C, D) num quadrado azul, cada uma no seu `em`.
import { limitar, Linhas, prog, temposDoTexto, varredura } from "../anim";
import type { Area } from "../layout";
import { caber, caberNaAltura } from "../medidas";
import type { Palavra, Pergunta as P } from "../plano";
import { cor, manchete, MARGEM, W } from "../tema";
import { Gc, textoDoGc } from "./Gc";
import { Interrogacao } from "./Icones";
import { Quadrado } from "./Selos";

export const PerguntaGc: React.FC<{ m: P; palavras: Palavra[]; t: number; base: number; fim: number; alturaMax: number }> = ({ m, palavras, t, base, fim, alturaMax }) => {
  const { linhas, tam } = textoDoGc(m.texto, { alturaMax, aba: true, nome: false, maximo: 104, minimo: 58, linhas: 3 });
  const inicio = Math.max(m.de + 0.12, m.em ?? 0);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  // o "?" dá um toque quando a pergunta termina
  const fimDaPergunta = (tempos[tempos.length - 1] ?? inicio) + 0.3;
  const toque = 1 + 0.16 * Math.sin(limitar((t - fimDaPergunta) / 0.32) * Math.PI);
  return (
    <Gc
      t={t}
      de={m.de}
      fim={fim}
      base={base}
      aba={<Interrogacao tamanho={40} cor={cor.branco} style={{ scale: String(toque) }} />}
      linhas={linhas}
      tempos={tempos}
      tam={tam}
    />
  );
};

const LETRAS = ["A", "B", "C", "D"];

export const Enquete: React.FC<{ m: P; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  // as opções ficam com o espaço que a pergunta (no mínimo uma linha) deixa
  const altMax = Math.min(132, Math.max(66, (area.h - 30 - 30 - 84 - 26) / Math.max(1, n) - 14));
  const larguraOpcao = (alt: number) => W - 2 * MARGEM - Math.min(alt, 92) - 14 - 2 * 26;
  const corteOpcao = { peso: 800 as const, alta: true };
  // texto de opção numa linha; se ficar pequeno e houver altura, em duas
  const umaLinha = Math.min(...opcoes.map((o) => caber(o.texto, { largura: larguraOpcao(Math.min(altMax, 92)), maximo: 52, minimo: 30, linhas: 1, corte: corteOpcao }).tam));
  const duasLinhas = umaLinha < 42 && altMax >= 112;
  const altOpcao = duasLinhas ? altMax : Math.min(altMax, 92);
  const tamOpcao = duasLinhas
    ? Math.min(...opcoes.map((o) => caber(o.texto, { largura: larguraOpcao(altOpcao), maximo: Math.min(50, Math.round((altOpcao - 22) / 2.1)), minimo: 30, linhas: 2, corte: corteOpcao }).tam))
    : umaLinha;
  const blocoOpcoes = n * altOpcao + (n - 1) * 14;
  const xTexto = MARGEM + 84 + 22;
  const q = caberNaAltura(m.texto, {
    largura: W - MARGEM - xTexto,
    maximo: 72,
    minimo: 40,
    linhas: 3,
    corte: { peso: 900, alta: true, espacamento: -0.01 },
    alturaMax: area.h - 30 - 30 - blocoOpcoes - 30,
    entrelinha: 1.06,
  });
  const alturaPergunta = q.linhas.length * q.tam * 1.06;
  const inicio = Math.max(m.de + 0.1, m.em ?? 0, entra + 0.1);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  const pMarca = prog(t, inicio - 0.1, 0.34);
  const yPergunta = area.y + 30;
  const espaco = area.y + area.h - 30 - (yPergunta + alturaPergunta) - blocoOpcoes;
  const yOpcoes = yPergunta + alturaPergunta + Math.max(26, espaco / 2);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: MARGEM, top: yPergunta }}>
        <Quadrado p={pMarca} tamanho={84}>
          <Interrogacao tamanho={48} cor={cor.branco} />
        </Quadrado>
      </div>
      <div style={{ position: "absolute", left: xTexto, top: yPergunta + Math.max(0, (84 - q.tam * 1.06) / 2) }}>
        <Linhas linhas={q.linhas} tempos={tempos} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.branco} entrelinha={Math.round(q.tam * 0.06)} style={{ ...manchete, fontSize: q.tam }} />
      </div>
      {opcoes.map((o, i) => {
        const p = prog(t, o.em - 0.1, 0.34);
        const y = yOpcoes + i * (altOpcao + 14);
        const txt = caber(o.texto, { largura: larguraOpcao(altOpcao), maximo: tamOpcao, minimo: Math.min(30, tamOpcao), linhas: duasLinhas ? 2 : 1, corte: corteOpcao });
        const temposOpcao = temposDoTexto(o.texto, palavras, m.de, m.ate, o.em - 0.08);
        return (
          <div key={i} style={{ position: "absolute", left: MARGEM, top: y, width: W - 2 * MARGEM, height: altOpcao, display: "flex", alignItems: "center", gap: 14 }}>
            <Quadrado p={p} tamanho={Math.min(altOpcao, 92)}>
              <div style={{ ...manchete, fontSize: Math.round(Math.min(altOpcao, 92) * 0.5), color: cor.branco, translate: "0 2px" }}>{LETRAS[i]}</div>
            </Quadrado>
            <div style={{ position: "relative", flex: 1, alignSelf: "stretch" }}>
              <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, opacity: 1 - limitar(p * 2) }} />
              <div style={{ position: "absolute", inset: 0, background: cor.papel, clipPath: varredura(p) }} />
              <div style={{ position: "absolute", left: 26, right: 26, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
                <Linhas linhas={txt.linhas} tempos={temposOpcao} t={t} esboco={p < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel} corDe={() => cor.tinta} entrelinha={Math.round(txt.tam * 0.08)} style={{ ...manchete, fontWeight: 800, letterSpacing: 0, fontSize: txt.tam }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
