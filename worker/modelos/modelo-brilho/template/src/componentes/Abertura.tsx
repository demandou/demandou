// Abertura: o título se monta palavra por palavra sobre o peito da pessoa, com a palavra-chave
// "passada" numa faixa de cor, e um relógio que fecha a volta quando o tempo é dito.
import { mistura, Palavras, prog, saindo, temposDoTexto, Traco, vaiVem } from "../anim";
import type { Abertura as TAbertura, Palavra } from "../plano";
import { corpoQueCabe, trechoNoTexto } from "../medida";
import { caber, cor, fonte, rotulo, sombraTexto } from "../tema";
import { medir } from "./Texto";

// Sem `linhas`: a primeira linha leva as primeiras palavras (até ~12 caracteres), grande e fina;
// o resto quebra sozinho em até 3 linhas que cabem na largura (medidas com a fonte de verdade).
const quebrarAbertura = (texto: string, largura: number): { linhas: string[]; tamanhos: number[] } => {
  const ws = texto.split(/\s+/).filter(Boolean);
  let k = 1;
  while (k < ws.length && ws.slice(0, k + 1).join(" ").length <= 12) k++;
  // palavra curta sozinha no fim da primeira linha ("O", "de") fica melhor na segunda
  if (k > 1 && ws[k - 1].length <= 2 && ws.length > k) k--;
  const primeira = ws.slice(0, k).join(" ");
  const resto = ws.slice(k).join(" ");
  const tamPrimeira = corpoQueCabe(primeira, largura, 150, 84, { peso: 300 });
  if (!resto) return { linhas: [primeira], tamanhos: [tamPrimeira] };
  const med = medir(resto, largura, 98, 60, 3, 600);
  return { linhas: [primeira, ...med.linhas], tamanhos: [tamPrimeira, ...med.linhas.map(() => med.tamanho)] };
};

export const Abertura: React.FC<{ m: TAbertura; t: number; fim: number; palavras: Palavra[]; topo: number }> = ({ m, t, fim, palavras, topo }) => {
  const inicio = Math.max(0, m.de);
  const fala = Math.max(inicio, m.em ?? inicio);
  // no começo do vídeo o título já aparece no primeiro quadro (a capa do Reels não fica vazia)
  const abre = inicio < 0.3 ? inicio - 0.6 : inicio;
  const largura = 1080 - 2 * 64;
  const texto = m.linhas?.length ? m.linhas.join(" ") : (m.texto ?? "");
  const auto = m.linhas?.length ? null : quebrarAbertura(texto, largura);
  const linhas = auto ? auto.linhas : (m.linhas as string[]);
  const tempos = temposDoTexto(texto, palavras, fala, m.ate, fala + 0.1).map((x) => (abre < inicio && x < 0.45 ? x - 0.6 : x));
  const sai = saindo(t, fim, 0.35);
  if (sai >= 1) return null;
  const tamanhos = auto ? auto.tamanhos : linhas.map((l, i) => (i === 0 ? caber(l, largura, 150, undefined, 300) : caber(l, largura, 98)));
  const destaque = m.destaque ?? m.enfase;
  // a faixa vai no trecho exato do destaque (pode atravessar duas linhas)
  const trecho = trechoNoTexto(texto, destaque);
  let cursor = 0;
  const porLinha = linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const fatia = tempos.slice(cursor, cursor + n);
    const marcadas: number[] = [];
    if (trecho) for (let k = 0; k < n; k++) if (cursor + k >= trecho[0] && cursor + k <= trecho[1]) marcadas.push(k);
    cursor += n;
    return { fatia, marcadas };
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: topo,
        width: largura,
        fontFamily: fonte,
        color: cor.creme,
        textShadow: sombraTexto,
        opacity: 1 - sai,
        translate: `0 ${sai * 30}px`,
      }}
    >
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
      {m.tempo ? <Relogio tempo={m.tempo} t={t} /> : null}
    </div>
  );
};

// Relógio: o anel fecha a volta e o número conta até o tempo dito
const Relogio: React.FC<{ tempo: NonNullable<TAbertura["tempo"]>; t: number }> = ({ tempo, t }) => {
  const p = prog(t, tempo.em - 0.1, 0.4);
  if (p <= 0) return null;
  const volta = prog(t, tempo.em, 1.0, vaiVem);
  const R = 94;
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
