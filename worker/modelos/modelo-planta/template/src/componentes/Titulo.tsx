import { mistura, Palavras, preciso, prog, temposDoTexto, Traco } from "../anim";
import { Cota } from "../desenho/Cota";
import { lin } from "../desenho/geometria";
import type { Palavra, Titulo as TTitulo } from "../plano";
import { caber, cor, rotuloMono, sans, traco } from "../tema";
import { Cartao } from "./Cartao";

// Título de abertura montado como o carimbo de uma prancha: rótulo técnico, título que se monta
// palavra por palavra na fala e uma cota que se desenha embaixo (e encolhe ou cresce na palavra certa).
export const Titulo: React.FC<{
  m: TTitulo;
  palavras: Palavra[];
  t: number;
  fim: number;
  area: { x: number; y: number; w: number };
}> = ({ m, palavras, t, fim, area }) => {
  const pad = 44;
  const interna = area.w - 2 * pad;
  const tamanho = Math.min(...m.linhas.map((l) => caber(l, interna, 104)));
  const inicio = Math.max(0, m.de);
  // no início do vídeo o cartão já está aberto no primeiro quadro (a capa do Reels não fica vazia)
  const abre = inicio < 0.3 ? inicio - 0.5 : inicio;
  // as palavras ditas logo no começo do vídeo já estão no primeiro quadro
  const tempos = temposDoTexto(m.linhas.join(" "), palavras, inicio, m.ate, inicio + 0.15).map((x) => (abre < inicio && x < 0.4 ? x - 0.5 : x));
  let cursor = 0;
  const porLinha = m.linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const fatia = tempos.slice(cursor, cursor + n);
    cursor += n;
    return fatia;
  });

  const alturaRotulo = m.rotulo ? 28 + 30 : 0;
  const alturaTexto = m.linhas.length * tamanho * 1.08;
  const alturaCota = m.cota ? 92 : 20;
  const h = pad + alturaRotulo + alturaTexto + alturaCota + pad * 0.6;

  // cota: desenha logo depois da primeira palavra; encolhe/cresce em `cota.em`
  const pCota = prog(t, inicio + 0.35, 0.9, preciso);
  const efeito = m.cota?.em !== undefined ? prog(t, m.cota.em, 0.7, preciso) : 0;
  const recuo = m.cota?.efeito === "encolhe" ? mistura(0, 0.13, efeito) : m.cota?.efeito === "cresce" ? mistura(0.13, 0, efeito) : 0;
  const yCota = pad + alturaRotulo + alturaTexto + 52;
  const x1 = pad + interna * recuo;
  const x2 = pad + interna * (1 - recuo);

  return (
    <Cartao t={t} de={abre} fim={fim} x={area.x} y={area.y} w={area.w} h={h}>
      <div style={{ position: "absolute", left: pad, top: pad, width: interna }}>
        {m.rotulo ? (
          <>
            <div style={{ ...rotuloMono, color: cor.acento, opacity: prog(t, abre + 0.2, 0.4) }}>{m.rotulo}</div>
            <svg width={interna} height={30} style={{ display: "block" }}>
              <Traco d={lin(0, 18, interna, 18)} p={prog(t, abre + 0.25, 0.7, preciso)} cor={cor.grafite} largura={traco.fino} />
            </svg>
          </>
        ) : null}
        {m.linhas.map((l, i) => (
          <Palavras
            key={`${l}-${i}`}
            texto={l}
            tempos={porLinha[i]}
            t={t}
            enfase={m.enfase}
            corEnfase={cor.acento}
            pesoEnfase={600}
            style={{
              fontFamily: sans,
              fontWeight: 300,
              fontSize: tamanho,
              lineHeight: 1.08,
              color: cor.grafite,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          />
        ))}
      </div>
      {m.cota ? (
        <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Cota
            x1={x1}
            y1={yCota}
            x2={x2}
            y2={yCota}
            p={pCota}
            cor={efeito > 0 ? cor.acento : cor.grafite}
            texto={m.cota.texto}
            tamanhoTexto={24}
          />
        </svg>
      ) : null}
    </Cartao>
  );
};
