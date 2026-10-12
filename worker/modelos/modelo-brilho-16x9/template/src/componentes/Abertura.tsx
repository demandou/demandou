// Abertura: o título se monta palavra por palavra sobre o peito da pessoa, com a palavra-chave
// "passada" numa faixa de cor, e um relógio que fecha a volta quando o tempo é dito.
// No quadro deitado (src/fileira.ts) o título fica na faixa larga logo abaixo do queixo: a primeira
// linha grande e fina, o resto em até duas linhas largas (em vez da pilha alta do vertical).
import { mistura, Palavras, prog, saindo, temposDoTexto, Traco, vaiVem } from "../anim";
import { assentar, LARGURA_PEITO } from "../fileira";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { corpoQueCabe, trechoNoTexto } from "../medida";
import { BASE_TEXTO, cor, deitado, fonte, MARGEM, rotulo, sombraTexto } from "../tema";
import { medir } from "./Texto";

// relógio: raio do anel e a coluna que ele ocupa à direita da faixa
const R = 94;
const COLUNA_RELOGIO = 2 * R + 16 + 40;

// A primeira linha leva as primeiras palavras (até ~12 caracteres), grande e fina (ou a primeira das
// `linhas` do plano); o resto se junta em até 2 linhas largas, medidas com a fonte de verdade.
// `k` encolhe tudo junto quando a faixa é baixa.
const quebrarAbertura = (texto: string, manual: string[] | undefined, largura: number, k: number) => {
  const ws = texto.split(/\s+/).filter(Boolean);
  let n = 1;
  if (manual?.length) n = manual[0].split(/\s+/).filter(Boolean).length;
  else {
    while (n < ws.length && ws.slice(0, n + 1).join(" ").length <= 12) n++;
    // palavra curta sozinha no fim da primeira linha ("O", "de") fica melhor na segunda
    if (n > 1 && ws[n - 1].length <= 2 && ws.length > n) n--;
  }
  const primeira = ws.slice(0, n).join(" ");
  const resto = ws.slice(n).join(" ");
  const tamPrimeira = corpoQueCabe(primeira, largura, Math.round(deitado(150) * k), 64, { peso: 300 });
  if (!resto) return { linhas: [primeira], tamanhos: [tamPrimeira] };
  const med = medir(resto, largura, Math.max(52, Math.round(deitado(98) * k)), 48, 2, 600);
  return { linhas: [primeira, ...med.linhas], tamanhos: [tamPrimeira, ...med.linhas.map(() => med.tamanho)] };
};

const alturaDaAbertura = (tamanhos: number[], temRotulo: boolean) =>
  (temRotulo ? 30 + 18 : 0) + tamanhos.reduce((s, t, i) => s + t * (i === 0 ? 1.02 : 1.12), 0);

export const Abertura: React.FC<{ m: TAbertura; t: number; fim: number; palavras: Palavra[]; topo: number }> = ({ m, t, fim, palavras, topo }) => {
  const inicio = Math.max(0, m.de);
  const fala = Math.max(inicio, m.em ?? inicio);
  // no começo do vídeo o título já aparece no primeiro quadro (a capa não fica vazia)
  const abre = inicio < 0.3 ? inicio - 0.6 : inicio;
  // com relógio, o texto para antes da coluna dele
  const largura = LARGURA_PEITO - (m.tempo ? COLUNA_RELOGIO : 0);
  const texto = m.linhas?.length ? m.linhas.join(" ") : (m.texto ?? "");
  // mede e, se a faixa é baixa para o título, encolhe tudo junto até caber
  const disponivel = BASE_TEXTO - topo;
  let k = 1;
  let q = quebrarAbertura(texto, m.linhas, largura, k);
  while (alturaDaAbertura(q.tamanhos, !!m.rotulo) > disponivel && k > 0.6) {
    k *= 0.93;
    q = quebrarAbertura(texto, m.linhas, largura, k);
  }
  const { linhas, tamanhos } = q;
  const altura = Math.max(alturaDaAbertura(tamanhos, !!m.rotulo), m.tempo ? 2 * R + 16 : 0);
  const tempos = temposDoTexto(texto, palavras, fala, m.ate, fala + 0.1).map((x) => (abre < inicio && x < 0.45 ? x - 0.6 : x));
  const sai = saindo(t, fim, 0.35);
  if (sai >= 1) return null;
  const destaque = m.destaque ?? m.enfase;
  // a faixa vai no trecho exato do destaque (pode atravessar duas linhas)
  const trecho = trechoNoTexto(texto, destaque);
  let cursor = 0;
  const porLinha = linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const fatia = tempos.slice(cursor, cursor + n);
    const marcadas: number[] = [];
    if (trecho) for (let j = 0; j < n; j++) if (cursor + j >= trecho[0] && cursor + j <= trecho[1]) marcadas.push(j);
    cursor += n;
    return { fatia, marcadas };
  });

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
      <div style={{ width: largura }}>
        {m.rotulo ? <div style={{ ...rotulo, color: cor.blush, marginBottom: 18, opacity: prog(t, abre + 0.1, 0.4) }}>{m.rotulo}</div> : null}
        {linhas.map((l, i) => {
          const primeira = i === 0;
          const enf = porLinha[i].marcadas.length > 0;
          return (
            <Palavras
              key={`${l}-${i}`}
              texto={l}
              tempos={porLinha[i].fatia}
              t={t}
              marcadas={enf ? porLinha[i].marcadas : undefined}
              faixa={enf ? { cor: cor.blush, texto: cor.tinta } : undefined}
              style={{
                fontSize: tamanhos[i],
                fontWeight: primeira ? 300 : enf ? 600 : 500,
                lineHeight: primeira ? 1.02 : 1.12,
                letterSpacing: primeira ? "-0.03em" : "-0.01em",
                height: tamanhos[i] * (primeira ? 1.02 : 1.12),
                color: primeira && !enf ? cor.creme : undefined,
              }}
            />
          );
        })}
      </div>
      {m.tempo ? <Relogio tempo={m.tempo} t={t} /> : null}
    </div>
  );
};

// Relógio: o anel fecha a volta e o número conta até o tempo dito
const Relogio: React.FC<{ tempo: NonNullable<TAbertura["tempo"]>; t: number }> = ({ tempo, t }) => {
  const p = prog(t, tempo.em - 0.1, 0.4);
  if (p <= 0) return null;
  const volta = prog(t, tempo.em, 1.0, vaiVem);
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: 2 * R + 16,
        height: 2 * R + 16,
        opacity: p,
        scale: String(mistura(0.85, 1, p)),
      }}
    >
      <svg width={2 * R + 16} height={2 * R + 16} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={R + 8} cy={R + 8} r={R + 4} fill={cor.creme} />
        <circle cx={R + 8} cy={R + 8} r={R - 8} fill="none" stroke={cor.cremeEscuro} strokeWidth={6} />
        <Traco d={`M${R + 8},16 A${R - 8},${R - 8} 0 1 1 ${R + 7.9},16`} p={volta} cor={cor.berry} largura={8} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 600, color: cor.tinta, textShadow: "none" }}>{tempo.valor}</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.14em", color: cor.berry, marginTop: 0, textShadow: "none" }}>{tempo.unidade.toUpperCase()}</div>
      </div>
    </div>
  );
};
