// Bloco "pergunta" com opções (modo tela grande): a caixa de diálogo do painel. No alto, o "?" e a
// pergunta acendendo palavra por palavra; embaixo, as opções como botões do menu, apagados até serem
// ditos. Cada opção acende na sua palavra e o cursor (o contorno marfim mais grosso) passa para ela.
import { Acende, mistura, prog, saindo, temposDoTexto, troca } from "../anim";
import { diagramar } from "../medidas";
import type { Palavra, Pergunta } from "../plano";
import { cor, texto } from "../tema";
import { Interrogacao } from "./Mensagens";
import type { Parte } from "./Painel";
import { diagramarLista } from "./TelaLista";

const TELA = { x: 60, y: 792, w: 960, h: 480 };

export const TelaPergunta: React.FC<{ m: Pergunta; palavras: Palavra[]; t: number; inicio: number; fim: number; parte: Parte }> = ({ m, palavras, t, inicio, fim, parte }) => {
  if (parte !== "tela") return null;
  const entrada = prog(t, inicio, 0.12);
  const s = saindo(t, fim, 0.2);
  const opcoes = [...(m.opcoes ?? [])].sort((a, b) => a.em - b.em).slice(0, 4);
  const icone = 88;
  const larguraP = TELA.w - 80 - icone - 28;
  const pergunta = diagramar(m.texto, { largura: larguraP, maximo: 60, minimo: 44, linhas: 2, altura: 130, entrelinha: 1.04, peso: 700 });
  const desde = m.em ?? m.de;
  const tPergunta = temposDoTexto(m.texto, palavras, desde, opcoes[0]?.em ?? m.ate, desde);
  const topoOpcoes = TELA.y + 30 + Math.max(icone, pergunta.tam * 1.04 * pergunta.linhas.length) + 30;
  const area = { x: TELA.x + 40, w: TELA.w - 80, y: topoOpcoes, h: TELA.y + TELA.h - 28 - topoOpcoes };
  const passo = area.h / Math.max(1, opcoes.length);
  const alturaBotao = Math.min(118, passo - 16);
  const corpos = diagramarLista(
    opcoes.map((o) => o.texto),
    area.w - 120,
    alturaBotao + 10,
    52,
    40,
  );
  // o cursor: vai para a última opção dita
  let cursorY = area.y;
  opcoes.forEach((o, i) => {
    cursorY = i === 0 ? area.y : mistura(cursorY, area.y + i * passo, prog(t, o.em - 0.08, 0.3, troca));
  });
  const cursor = opcoes.length ? prog(t, opcoes[0].em - 0.08, 0.2) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: entrada * (1 - s) }}>
      <div style={{ position: "absolute", left: TELA.x + 40, top: TELA.y + 30, width: TELA.w - 80, display: "flex", alignItems: "center", minHeight: icone }}>
        <Interrogacao tam={icone} p={prog(t, (tPergunta[0] ?? m.de) - 0.05, 0.3)} />
        <Acende linhas={pergunta.linhas} tempos={tPergunta} t={t} entrelinha={1.04} style={texto(700, pergunta.tam, { textTransform: "uppercase", marginLeft: 28 })} />
      </div>
      {opcoes.map((o, i) => {
        const y = area.y + i * passo + (passo - alturaBotao) / 2;
        const aceso = prog(t, o.em - 0.05, 0.25);
        const proxima = opcoes[i + 1];
        const tempos = temposDoTexto(o.texto, palavras, o.em - 0.3, proxima ? proxima.em : m.ate, o.em - 0.05);
        const c = corpos[i];
        return (
          <div
            key={`${o.texto}-${i}`}
            style={{
              position: "absolute",
              left: area.x,
              top: y,
              width: area.w,
              height: alturaBotao,
              borderRadius: 20,
              background: "rgba(241,237,228,0.035)",
              boxShadow: `inset 0 0 0 2px ${aceso > 0.02 ? "rgba(241,237,228,0.42)" : cor.apagado}`,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* o marcador da opção (como um botão de rádio do painel) */}
            <svg width={44} height={44} viewBox="0 0 44 44" style={{ marginLeft: 34, flexShrink: 0 }}>
              <circle cx={22} cy={22} r={17} fill="none" stroke={aceso > 0.02 ? cor.marfim : cor.apagado} strokeWidth={4} />
              <circle cx={22} cy={22} r={8 * aceso} fill={cor.marfim} />
            </svg>
            <Acende linhas={c.linhas} tempos={tempos} t={t} entrelinha={1.04} style={texto(700, c.tam, { textTransform: "uppercase", marginLeft: 30 })} />
          </div>
        );
      })}
      {/* o cursor */}
      <div
        style={{
          position: "absolute",
          left: area.x - 6,
          top: cursorY + (passo - alturaBotao) / 2 - 6,
          width: area.w + 12,
          height: alturaBotao + 12,
          borderRadius: 25,
          boxShadow: "inset 0 0 0 4px #F1EDE4",
          opacity: cursor,
        }}
      />
    </div>
  );
};
