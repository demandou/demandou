// Frase de efeito: a pessoa na moldura maior, à direita; no alto do quadro à esquerda, a agenda
// inteira encolhe numa linha do dia (como a barra de um player) e a marcação "agora" percorre a
// linha, concluindo bloco por bloco; embaixo dela, a frase se monta palavra por palavra (a primeira
// frase maior). O `destaque` fica tomate
// e o `risco` é riscado em tomate quando é dito. No fim, a marcação vira tomate com ✓.
import { escreverHora, Linhas, mistura, misturaCor, prog, saindo, temposDoTexto } from "../anim";
import { ANTES, type Agenda, DUR_CORTINA, entradaESaida, LINHA_FRASE, TOPO_DA_FRASE } from "../agenda";
import { encaixar, medir, trechoNoTexto } from "../medida";
import type { Frase as TFrase, Palavra } from "../plano";
import { CONTEUDO, cor, numeros, sans } from "../tema";
import { Icone } from "./Icones";

// divide a frase na primeira pontuação forte: a primeira parte sai maior
const partes = (texto: string) => {
  const m = texto.match(/^(.+?[.!?…])\s+(.+)$/);
  return m ? [m[1], m[2]] : [texto, ""];
};

const inicioDa = (m: TFrase) => m.em ?? m.de;

export const tempoDaMarca = (m: TFrase, palavras: Palavra[]) => {
  const tempos = temposDoTexto(m.texto, palavras, inicioDa(m), m.ate, inicioDa(m));
  const [a] = partes(m.texto);
  const n = a.split(/\s+/).filter(Boolean).length;
  const de = m.marcaDe ?? tempos[Math.min(n, tempos.length - 1)] ?? m.de + 0.8;
  const ate = m.concluiEm ?? Math.max(de + 0.8, tempos[tempos.length - 1] ?? m.ate - 0.3);
  return { de, ate };
};

// posição x da marcação na linha do dia em `t`
export const marcaNoTempo = (m: TFrase, palavras: Palavra[], t: number) => {
  const { de, ate } = tempoDaMarca(m, palavras);
  const p = prog(t, de, ate - de, (x) => x);
  return mistura(LINHA_FRASE.x - 6, LINHA_FRASE.x + LINHA_FRASE.w + 6, p);
};

// a frase ocupa a largura do quadro à esquerda da moldura (a mesma da linha do dia)
const LARGURA = LINHA_FRASE.w;
const ESPACO = 0.24;

// tamanhos e linhas das duas partes, do maior que cabe na altura disponível
export const layoutFrase = (texto: string, temBlocos: boolean) => {
  const [a, b] = partes(texto);
  const topo = temBlocos ? TOPO_DA_FRASE : LINHA_FRASE.y + 20;
  const disponivel = CONTEUDO.base - 10 - topo;
  for (let escala = 1; escala >= 0.6; escala -= 0.05) {
    // o quadro à esquerda é largo e alto no 16:9: a frase pode ir um pouco maior que no vertical
    const A = encaixar(a, { largura: LARGURA, max: Math.round((temBlocos ? 100 : 116) * escala), min: 56, linhas: 3, entrelinha: 1.02, fonte: { espacamento: -0.025 }, menos: false });
    const B = b ? encaixar(b, { largura: LARGURA, max: Math.round((temBlocos ? 66 : 78) * escala), min: 40, linhas: 3, entrelinha: 1.1, fonte: { peso: 700, espacamento: -0.015 }, menos: false }) : null;
    const altura = A.linhas.length * A.tamanho * 1.02 + (B ? 18 + B.linhas.length * B.tamanho * 1.1 : 0);
    // o que sobra de altura fica dividido: a frase acima do meio do espaço dela (perto da linha do dia)
    if (altura <= disponivel || escala <= 0.61) return { a, b, A, B, topo: topo + Math.max(0, (disponivel - altura) * (temBlocos ? 0.3 : 0.4)) };
  }
  throw new Error("inalcançável");
};

// x e largura de cada palavra numa linha (as palavras são separadas por margem fixa)
const posicoes = (linha: string[], tamanho: number, peso: 700 | 800, espacamento: number) => {
  let x = 0;
  return linha.map((w) => {
    const largura = medir(w, tamanho, { peso, espacamento });
    const r = { x, w: largura };
    x += largura + ESPACO * tamanho;
    return r;
  });
};

// traços do risco por cima das palavras `trecho` (índices na frase inteira)
const Riscos: React.FC<{ linhas: string[][]; base: number; tamanho: number; entrelinha: number; peso: 700 | 800; espacamento: number; trecho: [number, number]; p: number }> = ({
  linhas,
  base,
  tamanho,
  entrelinha,
  peso,
  espacamento,
  trecho,
  p,
}) => {
  if (p <= 0) return null;
  let k = base;
  const tracos: { x: number; y: number; w: number }[] = [];
  linhas.forEach((l, j) => {
    const pos = posicoes(l, tamanho, peso, espacamento);
    const dentro = l.map((_, n) => k + n).filter((i) => i >= trecho[0] && i <= trecho[1]);
    if (dentro.length) {
      const a = pos[dentro[0] - k];
      const b = pos[dentro[dentro.length - 1] - k];
      tracos.push({ x: a.x - 6, y: j * tamanho * entrelinha + tamanho * 0.56, w: b.x + b.w - a.x + 12 });
    }
    k += l.length;
  });
  const total = tracos.reduce((s, r) => s + r.w, 0);
  let feito = 0;
  return (
    <>
      {tracos.map((r, i) => {
        const de = feito / total;
        feito += r.w;
        const q = Math.min(1, Math.max(0, (p - de) / (r.w / total)));
        return <div key={i} style={{ position: "absolute", left: r.x, top: r.y, width: r.w * q, height: Math.max(7, tamanho * 0.09), borderRadius: 6, background: cor.focoEscuro }} />;
      })}
    </>
  );
};

export const Frase: React.FC<{ m: TFrase; t: number; palavras: Palavra[]; ag: Agenda; fim: number }> = ({ m, t, palavras, ag, fim }) => {
  const temBlocos = ag.blocos.length > 0;
  const { a, b, A, B, topo } = layoutFrase(m.texto, temBlocos);
  const tempos = temposDoTexto(m.texto, palavras, inicioDa(m), m.ate, inicioDa(m));
  const nA = a.split(/\s+/).filter(Boolean).length;
  const grifo = trechoNoTexto(m.texto, m.destaque ?? m.enfase);
  const risco = trechoNoTexto(m.texto, m.risco);
  const corDe = (i: number) => (grifo && i >= grifo[0] && i <= grifo[1] ? cor.foco : undefined);
  const riscoEm = risco ? (m.riscoEm ?? (tempos[risco[1]] ?? m.ate - 0.6) + 0.25) : 0;
  const pRisco = risco ? prog(t, riscoEm, 0.45) : 0;
  // vindo de outro momento na folha, a cortina revela a frase (ela já está lá); vindo da agenda, ela
  // entra depois que os blocos viraram a linha do dia
  const i = ag.ordem.indexOf(m);
  const es = i >= 0 ? entradaESaida(ag, i) : null;
  const entra = es?.deCortina ? prog(t, m.de - ANTES, 0.001) : prog(t, m.de + (temBlocos ? 0.42 : 0), 0.35);
  // sai antes do cartão seguinte entrar (nunca dois textos um sobre o outro); indo para outro
  // momento na folha, a cortina a leva
  const sai = es?.paraCortina ? prog(t, fim - ANTES + DUR_CORTINA - 0.001, 0.001) : saindo(t, fim - ANTES + 0.12, 0.25);
  const { de, ate } = tempoDaMarca(m, palavras);
  const x = marcaNoTempo(m, palavras, t);
  const pMarca = prog(t, Math.min(de - 0.2, m.de + 0.5), 0.3);
  const concluido = prog(t, ate, 0.35);
  const L = LINHA_FRASE;
  const minuto = Math.max(0, Math.min(ag.total, ((x - L.x) / L.w) * ag.total));
  // agenda sem horários ditos: a marcação não mostra hora (só o ✓ no fim)
  const hora = ag.qualitativa ? "" : escreverHora(ag.inicio + minuto);

  return (
    <div style={{ opacity: 1 - sai }}>
      <div style={{ position: "absolute", left: LINHA_FRASE.x, width: LARGURA, top: topo, fontFamily: sans, color: cor.tinta, opacity: entra }}>
        <div style={{ position: "relative" }}>
          <Linhas linhas={A.linhas} tempos={tempos} t={t} tamanho={A.tamanho} entrelinha={1.02} esboco={cor.esboco} corDe={corDe} espacamento="-0.025em" />
          {risco ? <Riscos linhas={A.linhas} base={0} tamanho={A.tamanho} entrelinha={1.02} peso={800} espacamento={-0.025} trecho={risco} p={pRisco} /> : null}
        </div>
        {B && b ? (
          <div style={{ position: "relative", marginTop: 18 }}>
            <Linhas
              linhas={B.linhas}
              tempos={tempos.slice(nA)}
              t={t}
              tamanho={B.tamanho}
              entrelinha={1.1}
              peso={700}
              esboco={cor.esboco}
              corDe={(i) => corDe(i + nA)}
              espacamento="-0.015em"
            />
            {risco ? <Riscos linhas={B.linhas} base={nA} tamanho={B.tamanho} entrelinha={1.1} peso={700} espacamento={-0.015} trecho={risco} p={pRisco} /> : null}
          </div>
        ) : null}
      </div>

      {/* a marcação "agora" que percorre o dia; no fim ela confirma o dia (✓) */}
      {temBlocos && pMarca > 0.01 ? (
        <>
          <div style={{ position: "absolute", left: x - 2, top: L.y - 12, width: 5, height: L.h + 26, borderRadius: 3, background: cor.tinta, opacity: pMarca }} />
          {hora || concluido > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: Math.min(L.x + L.w - 90, Math.max(L.x + 80, x)),
                top: L.y + L.h + 14,
                translate: "-50% 0",
                height: 58,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 18px",
                borderRadius: 999,
                background: misturaCor(cor.tinta, cor.foco, concluido),
                color: "#FFFFFF",
                fontFamily: sans,
                fontSize: 34,
                fontWeight: 700,
                whiteSpace: "nowrap",
                opacity: hora ? pMarca : concluido,
                ...numeros,
              }}
            >
              {concluido > 0.01 ? <Icone nome="check" tamanho={34} cor="#FFFFFF" peso={6} p={concluido} /> : null}
              {hora}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
