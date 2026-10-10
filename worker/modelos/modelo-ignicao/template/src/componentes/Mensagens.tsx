// A barra de mensagens do painel (entre a tela da pessoa e os mostradores, no modo clássico):
// o título da ignição, a chamada do fechamento e, fora dos momentos, a legenda.
import { Acende, marcasDe, palavrasDoTrecho, pisca, prog, quandoDiz, saindo, temposDoTexto } from "../anim";
import type { Frase as FraseDaLegenda } from "../motor/frases";
import { diagramar, medir } from "../medidas";
import type { Abertura, Cta, Frase, Ignicao, Palavra, Pergunta } from "../plano";
import { cor, texto } from "../tema";
import { IconeAcao, Seta } from "./Icones";

// palavras que pedem a seta de direção no fechamento (a ação)
const ACOES = ["manda", "envia", "compartilha", "marca", "toca", "toque", "clica", "clique", "segue", "siga", "comenta", "comente", "acessa", "acesse", "assiste", "chama", "salva"];

// a barra: 960×166 a partir de (60, 966)
export const BARRA = { x: 60, y: 966, w: 960, h: 166 };

export const TituloIgnicao: React.FC<{ m: Ignicao; palavras: Palavra[]; t: number; fim: number; inicio: number }> = ({ m, palavras, t, fim, inicio }) => {
  const largura = BARRA.w - 80;
  // uma linha só (a barra é baixa): até ~18 caracteres ficam com 72 px ou mais
  const titulo = diagramar(m.titulo, { largura, maximo: 96, minimo: 60, linhas: 1, peso: 700 });
  const apoio = m.apoio ? diagramar(m.apoio, { largura, maximo: 44, minimo: 36, linhas: 1, peso: 600, espacamento: 0.06 }) : null;
  const tTitulo = temposDoTexto(m.titulo, palavras, m.de, m.ate);
  const tApoio = m.apoio ? temposDoTexto(m.apoio, palavras, m.de, m.ate) : [];
  const entrada = prog(t, inicio, 0.4);
  const s = saindo(t, fim, 0.2);
  const alturaTotal = titulo.tam * titulo.linhas.length + (apoio ? 14 + apoio.tam : 0);
  return (
    <div
      style={{
        position: "absolute",
        left: BARRA.x,
        top: BARRA.y + (BARRA.h - alturaTotal) / 2 - 4,
        width: BARRA.w,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: entrada * (1 - s),
        translate: `0 ${-12 * s}px`,
      }}
    >
      <Acende linhas={titulo.linhas} tempos={tTitulo} t={t} alinhar="center" style={texto(700, titulo.tam, { textTransform: "uppercase", lineHeight: 1 })} />
      {apoio ? (
        <Acende
          linhas={apoio.linhas}
          tempos={tApoio}
          t={t}
          alinhar="center"
          style={texto(600, apoio.tam, { textTransform: "uppercase", letterSpacing: "0.06em", color: cor.marfimSuave, marginTop: 14, lineHeight: 1 })}
        />
      ) : null}
    </div>
  );
};

export const ChamadaFinal: React.FC<{ m: Cta; palavras: Palavra[]; t: number; fim: number; inicio: number }> = ({ m, palavras, t, fim, inicio }) => {
  const icone = 74;
  const seta = 92;
  const largura = BARRA.w - 60 - icone - seta - 64;
  const corpo = diagramar(m.texto, { largura, maximo: 64, minimo: 44, linhas: 2, altura: BARRA.h - 26, entrelinha: 1.05, peso: 700 });
  const desde = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, desde, m.ate, desde);
  const salvaEm = tempos[0] ?? m.de;
  // a seta pisca na palavra da ação (a primeira depois da primeira palavra, se a chamada começa com "salva")
  const acao = quandoDiz(palavras, ACOES.filter((a) => a !== "salva"), m.de, m.ate) ?? quandoDiz(palavras, ACOES, m.de, m.ate);
  const setaEm = m.setaEm ?? acao ?? tempos[Math.min(2, tempos.length - 1)] ?? m.de + 0.5;
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const larguraTexto = Math.max(...corpo.linhas.map((l) => medir(l, corpo.tam, 700)));
  const total = icone + 28 + larguraTexto + 32 + seta;
  return (
    <div
      style={{
        position: "absolute",
        left: BARRA.x + (BARRA.w - total) / 2,
        top: BARRA.y,
        height: BARRA.h,
        display: "flex",
        alignItems: "center",
        gap: 0,
        opacity: entrada * (1 - s),
      }}
    >
      <div style={{ width: icone, display: "flex", justifyContent: "center" }}>
        <IconeAcao icone={m.icone ?? "salvar"} tamanho={icone} p={prog(t, salvaEm - 0.05, 0.45)} />
      </div>
      <Acende
        linhas={corpo.linhas}
        tempos={tempos}
        t={t}
        alinhar="left"
        entrelinha={1.05}
        marcas={m.destaque ? marcasDe(m.texto, tempos, m.destaque) : undefined}
        style={texto(700, corpo.tam, { textTransform: "uppercase", marginLeft: 28, marginRight: 32 })}
      />
      <Seta tamanho={seta} acesa={pisca(t, setaEm - 0.05, 0.72)} />
    </div>
  );
};

// ---------- blocos universais na barra de mensagens ----------

const fatia = (texto: string, de: number, ate: number) => texto.split(/\s+/).filter(Boolean).slice(de, ate).join(" ");

// Abertura: o `destaque` vira a linha grande (como o título da ignição) e o resto da frase, as linhas
// menores em cima e/ou embaixo dele, na ordem em que são ditas. Sem destaque: a frase em até 2 linhas.
export const AberturaNaBarra: React.FC<{ m: Abertura; palavras: Palavra[]; t: number; fim: number; inicio: number }> = ({ m, palavras, t, fim, inicio }) => {
  const largura = BARRA.w - 80;
  const desde = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, desde, m.ate, desde);
  const entrada = prog(t, inicio, 0.4);
  const s = saindo(t, fim, 0.2);
  const n = m.texto.split(/\s+/).filter(Boolean).length;
  const d = palavrasDoTrecho(m.texto, m.destaque);
  type Linha = { linhas: string[]; tam: number; de: number; grande: boolean };
  let blocos: Linha[] = [];
  if (d.length) {
    const partes = [
      { de: 0, ate: d[0], grande: false },
      { de: d[0], ate: d[d.length - 1] + 1, grande: true },
      { de: d[d.length - 1] + 1, ate: n, grande: false },
    ].filter((p) => p.ate > p.de);
    // o maior título que deixa tudo caber na barra (até 152 px de altura); as linhas menores ficam em
    // uma linha cada e só quebram em duas se não couberem
    const montar = (maximo: number, linhasMenores: number) =>
      partes.map((p) => {
        const txt = fatia(m.texto, p.de, p.ate);
        const r = p.grande
          ? diagramar(txt, { largura, maximo, minimo: 52, linhas: 1, peso: 700 })
          : diagramar(txt, { largura, maximo: 44, minimo: 30, linhas: linhasMenores, peso: 600, espacamento: 0.06 });
        return { ...r, de: p.de, grande: p.grande };
      });
    const alturaDe = (bs: Linha[]) => bs.reduce((a, b) => a + b.tam * b.linhas.length, 0) + 12 * (bs.length - 1);
    const cabe = (bs: Linha[]) =>
      bs.every((b) => b.linhas.every((l) => medir(l, b.tam, b.grande ? 700 : 600, true, b.grande ? 0 : 0.06) <= largura + 1));
    for (const linhasMenores of [1, 2]) {
      for (let maximo = 96; maximo >= 52; maximo -= 4) {
        blocos = montar(maximo, linhasMenores);
        if (alturaDe(blocos) <= 152) break;
      }
      if (cabe(blocos)) break;
    }
  } else {
    const r = diagramar(m.texto, { largura, maximo: 84, minimo: 48, linhas: 2, altura: 150, entrelinha: 1.04, peso: 700 });
    blocos = [{ ...r, de: 0, grande: true }];
  }
  const altura = blocos.reduce((a, b) => a + b.tam * b.linhas.length * (b.linhas.length > 1 ? 1.04 : 1), 0) + 12 * (blocos.length - 1);
  return (
    <div
      style={{
        position: "absolute",
        left: BARRA.x,
        top: BARRA.y + (BARRA.h - altura) / 2 - 2,
        width: BARRA.w,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity: entrada * (1 - s),
        translate: `0 ${-12 * s}px`,
      }}
    >
      {blocos.map((b) => (
        <Acende
          key={`${b.de}-${b.grande}`}
          linhas={b.linhas}
          tempos={tempos.slice(b.de)}
          t={t}
          alinhar="center"
          entrelinha={b.linhas.length > 1 ? 1.04 : 1}
          style={
            b.grande
              ? texto(700, b.tam, { textTransform: "uppercase", lineHeight: 1 })
              : texto(600, b.tam, { textTransform: "uppercase", letterSpacing: "0.06em", color: cor.marfimSuave, lineHeight: 1 })
          }
        />
      ))}
    </div>
  );
};

// Frase de efeito: até 3 linhas na barra; o `destaque` ganha um sublinhado que se desenha quando é dito
// e o `risco` apaga e é riscado (o letreiro "desliga" aquele trecho).
export const FraseNaBarra: React.FC<{ m: Frase; palavras: Palavra[]; t: number; fim: number; inicio: number }> = ({ m, palavras, t, fim, inicio }) => {
  const largura = BARRA.w - 80;
  const corpo = diagramar(m.texto, { largura, maximo: 68, minimo: 44, linhas: 3, altura: 150, entrelinha: 1.04, peso: 700 });
  const desde = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, desde, m.ate, desde);
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  return (
    <div style={{ position: "absolute", left: BARRA.x, top: BARRA.y, width: BARRA.w, height: BARRA.h, display: "flex", alignItems: "center", justifyContent: "center", opacity: entrada * (1 - s) }}>
      <Acende
        linhas={corpo.linhas}
        tempos={tempos}
        t={t}
        alinhar="center"
        entrelinha={1.04}
        marcas={marcasDe(m.texto, tempos, m.destaque, m.risco, m.riscoEm)}
        style={texto(700, corpo.tam, { textTransform: "uppercase" })}
      />
    </div>
  );
};

// O "?" do painel: um quadrado marfim (como a seta do navegador) que acende na primeira palavra
export const Interrogacao: React.FC<{ tam: number; p: number }> = ({ tam, p }) => (
  <div
    style={{
      width: tam,
      height: tam,
      flexShrink: 0,
      borderRadius: tam * 0.24,
      background: cor.marfim,
      opacity: 0.22 + 0.78 * p,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...texto(700, tam * 0.66, { color: cor.carcaca, lineHeight: 1 }),
    }}
  >
    ?
  </div>
);

// Pergunta sem opções: o "?" à esquerda e a pergunta acendendo palavra por palavra
export const PerguntaNaBarra: React.FC<{ m: Pergunta; palavras: Palavra[]; t: number; fim: number; inicio: number }> = ({ m, palavras, t, fim, inicio }) => {
  const icone = 84;
  const largura = BARRA.w - 80 - icone - 28;
  const corpo = diagramar(m.texto, { largura, maximo: 64, minimo: 44, linhas: 3, altura: 150, entrelinha: 1.04, peso: 700 });
  const desde = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, desde, m.ate, desde);
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const larguraTexto = Math.max(...corpo.linhas.map((l) => medir(l, corpo.tam, 700)));
  const total = icone + 28 + larguraTexto;
  return (
    <div
      style={{
        position: "absolute",
        left: BARRA.x + (BARRA.w - total) / 2,
        top: BARRA.y,
        height: BARRA.h,
        display: "flex",
        alignItems: "center",
        opacity: entrada * (1 - s),
      }}
    >
      <Interrogacao tam={icone} p={prog(t, (tempos[0] ?? m.de) - 0.05, 0.3)} />
      <Acende linhas={corpo.linhas} tempos={tempos} t={t} entrelinha={1.04} style={texto(700, corpo.tam, { textTransform: "uppercase", marginLeft: 28 })} />
    </div>
  );
};

// Legenda (só fora dos momentos): uma linha por vez na barra de mensagens, palavra por palavra
export const Legendas: React.FC<{ frases: FraseDaLegenda[]; t: number; presenca: number }> = ({ frases, t, presenca }) => {
  const atual = frases.find((f) => t >= f.de - 0.05 && t < f.ate);
  if (!atual || presenca < 0.01) return null;
  const linha = atual.palavras.map((p) => p.w).join(" ");
  const { linhas, tam } = diagramar(linha, { largura: BARRA.w - 80, maximo: 54, minimo: 44, linhas: 2, peso: 600, caixaAlta: false });
  const tempos = atual.palavras.map((p) => p.em - 0.04);
  return (
    <div
      style={{
        position: "absolute",
        left: BARRA.x,
        top: BARRA.y,
        width: BARRA.w,
        height: BARRA.h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: presenca * prog(t, atual.de - 0.08, 0.15),
      }}
    >
      <Acende linhas={linhas} tempos={tempos} t={t} alinhar="center" fantasma={0.28} style={texto(600, tam, { lineHeight: 1.12 })} />
    </div>
  );
};
