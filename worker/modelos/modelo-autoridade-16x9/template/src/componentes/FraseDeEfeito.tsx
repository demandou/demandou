import { Bloco, indicesDoTrecho, marcaNoGrupo, Palavras, prog, temposDoTexto, useTempo } from "../anim";
import { encaixarNaCaixa, ITALICO, larguraDe, SERIF } from "../medida";
import type { FraseDeEfeito as TFrase, Palavra } from "../plano";
import { cor, minimo, sombra } from "../tema";
import { Letreiro } from "./Pecas";

// A frase que merece ficar na memória, entre aspas de latão, como uma citação de revista.
// Monta-se palavra por palavra na fala. O destaque fica em itálico latão; o trecho em `risco`
// é riscado em lacre quando é dito (e apaga um pouco), como a caneta do revisor.
// No quadro deitado, a faixa do peito é larga e baixa: as aspas ficam AO LADO da frase, na altura
// da primeira linha (uma fileira), não em cima dela.
export const FraseDeEfeito: React.FC<{ m: TFrase; palavras: Palavra[]; largura: number; altura: number }> = ({
  m,
  palavras,
  largura,
  altura,
}) => {
  const t = useTempo();
  const inicio = Math.max(0, m.em ?? m.de);
  const destaque = indicesDoTrecho(m.texto, m.destaque ?? m.enfase);
  const risco = indicesDoTrecho(m.texto, m.risco);
  const estilo = (i: number) => (destaque.has(i) ? ITALICO : SERIF);
  const alturaRotulo = m.rotulo ? 58 : 0;
  const fileira = largura > 2.4 * altura;
  const alturaAspas = fileira ? 0 : 76;
  const larguraAspas = fileira ? 92 + 30 : 0;
  const q = encaixarNaCaixa(m.texto, {
    largura: largura - larguraAspas,
    altura: altura - alturaRotulo - alturaAspas,
    max: 88,
    min: minimo.corpo + 12,
    linhas: 3,
    alturaLinha: 1.06,
    estilo,
  });
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate);
  const larguras = larguraDe(m.texto, q.tamanho, estilo);
  const grupoRisco = [...risco].sort((a, b) => a - b);
  const riscoEm = m.riscoEm ?? (grupoRisco.length ? tempos[grupoRisco[grupoRisco.length - 1]] + 0.25 : 0);
  const pRisco = prog(t, riscoEm, 0.5);
  const traco = marcaNoGrupo(grupoRisco, larguras, pRisco);

  return (
    <Bloco t={t} ate={m.ate} style={{ width: "100%", textShadow: sombra }}>
      {m.rotulo ? (
        <div style={{ marginBottom: 22 }}>
          <Letreiro texto={m.rotulo} t={t} inicio={m.de} largura={largura} fios="nenhum" corTexto={cor.lataoClaro} />
        </div>
      ) : null}
      {/* aspas desenhadas (a caixa do glifo da fonte é imprevisível) */}
      <div style={{ display: "flex", flexDirection: fileira ? "row" : "column", alignItems: fileira ? "flex-start" : "center", gap: fileira ? 30 : 0 }}>
      <svg
        width={92}
        height={58}
        viewBox="0 0 92 58"
        style={{
          marginBottom: fileira ? 0 : 18,
          marginTop: fileira ? q.tamanho * 0.12 : 0,
          flexShrink: 0,
          opacity: prog(t, inicio, 0.35),
          translate: `0 ${(1 - prog(t, inicio, 0.5)) * 16}px`,
        }}
      >
        {[0, 48].map((x) => (
          <g key={x} transform={`translate(${x} 0)`} fill={cor.lataoClaro}>
            <circle cx={22} cy={40} r={14} />
            <path d="M9 40C7 22 14 9 31 2l3 6C22 14 18 23 20 34Z" />
          </g>
        ))}
      </svg>
      <Palavras
        linhas={q.linhas}
        tempos={tempos}
        t={t}
        tamanho={q.tamanho}
        alturaLinha={1.06}
        alinhar={fileira ? "left" : "center"}
        estilo={estilo}
        cor={(i) => (destaque.has(i) ? cor.lataoClaro : cor.papel)}
        opacidade={(i) => (risco.has(i) ? 1 - 0.4 * pRisco : 1)}
        marca={(i) => (risco.has(i) ? { tipo: "risco", cor: cor.lacre, p: traco.get(i) ?? 0, liga: risco.has(i + 1) } : null)}
      />
      </div>
    </Bloco>
  );
};
