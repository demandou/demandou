// Os blocos universais de TELA CHEIA (a pessoa grande, o texto no peito, sobre o degradê escuro):
// destaque, frase, pergunta e o número no peito. Ficam dentro da íris: quando a ocular fecha, o
// próprio círculo apaga o texto (não há duas páginas de texto ao mesmo tempo).
import { gira, limitar, prog, temposDoTexto } from "../anim";
import { type Encaixe, encaixar, type Fonte, larguraTexto, trechoNoTexto } from "../medida";
import type { Destaque, Frase, Numero, Palavra, Pergunta } from "../plano";
import { cor, sans, serifa } from "../tema";
import { NumeroDesenho } from "./Blocos";
import { QuatroPontas } from "./Desenho";

export type Zona = { esquerda: number; direita: number; topo: number; altura: number };
// até onde o texto de tela cheia pode descer (acima da interface do app)
const LIMITE = 1545;

type Seg = { texto: string; i0: number; enfase: boolean };

// Divide o texto em trechos: antes, o destaque (linha própria, itálico maior) e depois.
export const segmentos = (texto: string, destaque?: string): Seg[] => {
  const ws = texto.split(/\s+/).filter(Boolean);
  const tr = trechoNoTexto(texto, destaque);
  if (!tr) return [{ texto: ws.join(" "), i0: 0, enfase: false }];
  const partes: Seg[] = [];
  if (tr[0] > 0) partes.push({ texto: ws.slice(0, tr[0]).join(" "), i0: 0, enfase: false });
  partes.push({ texto: ws.slice(tr[0], tr[1] + 1).join(" "), i0: tr[0], enfase: true });
  if (tr[1] < ws.length - 1) partes.push({ texto: ws.slice(tr[1] + 1).join(" "), i0: tr[1] + 1, enfase: false });
  return partes;
};

// Encaixa os trechos com o maior corpo em que tudo cabe na largura e na altura disponíveis.
export const encaixarTrechos = (
  segs: Seg[],
  { largura, altura, base, minimo, escalaEnfase = 1.3, fonte, fonteEnfase, linhas = 2 }: { largura: number; altura: number; base: number; minimo: number; escalaEnfase?: number; fonte: Fonte; fonteEnfase: Fonte; linhas?: number },
) => {
  let corpo = base;
  for (;;) {
    const encs = segs.map((s) =>
      encaixar(s.texto, {
        largura,
        max: Math.round(s.enfase ? corpo * escalaEnfase : corpo),
        min: Math.round(s.enfase ? minimo * escalaEnfase * 0.85 : minimo),
        linhas,
        fonte: s.enfase ? fonteEnfase : fonte,
      }),
    );
    const h = encs.reduce((a, e) => a + e.linhas.length * e.tamanho * 1.06, 0);
    if (h <= altura || corpo <= minimo) return { encs, altura: h };
    corpo -= 4;
  }
};

// Linhas de palavras que acendem na fala, com trechos em itálico e trecho riscado.
const Palavras: React.FC<{
  enc: Encaixe;
  i0: number;
  tempos: number[];
  t: number;
  estilo: React.CSSProperties;
  cor: string;
  risco?: [number, number] | null;
  riscoEm?: number;
  riscoDur?: number;
  rascunho?: number;
}> = ({ enc, i0, tempos, t, estilo, cor: c, risco, riscoEm = 0, riscoDur = 0.4, rascunho = 0 }) => {
  let k = i0;
  return (
    <>
      {enc.linhas.map((linha, li) => {
        const ws = linha.split(/\s+/).filter(Boolean);
        const linhaI0 = k;
        k += ws.length;
        return (
          <div key={li} style={{ display: "flex", justifyContent: "center", whiteSpace: "nowrap", ...estilo, fontSize: enc.tamanho, lineHeight: 1.06 }}>
            {ws.map((w, j) => {
              const idx = linhaI0 + j;
              const p = prog(t, (tempos[idx] ?? 0) - 0.02, 0.32);
              const pronta = p >= 1;
              const riscada = risco && idx >= risco[0] && idx <= risco[1];
              // o risco corre palavra a palavra, da primeira à última do trecho
              const nR = risco ? risco[1] - risco[0] + 1 : 1;
              const uR = riscada ? limitar(prog(t, riscoEm, riscoDur, gira) * nR - (idx - risco![0])) : 0;
              const ultimaDoTrecho = riscada && (idx === risco![1] || j === ws.length - 1);
              return (
                <span
                  key={j}
                  style={{
                    display: "inline-block",
                    position: "relative",
                    marginRight: j < ws.length - 1 ? "0.25em" : 0,
                    color: c,
                    opacity: pronta ? undefined : rascunho + (1 - rascunho) * p,
                    translate: pronta ? undefined : `0 ${(1 - p) * 0.12}em`,
                  }}
                >
                  {w}
                  {uR > 0 ? (
                    <span
                      style={{
                        position: "absolute",
                        left: "-0.04em",
                        top: "54%",
                        height: Math.max(5, enc.tamanho * 0.07),
                        borderRadius: 4,
                        background: cor.lanterna,
                        width: `calc((100% + ${ultimaDoTrecho ? "0.08em" : "0.29em"}) * ${uR})`,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

const entradaSaida = (t: number, de: number, ate: number) => prog(t, de - 0.02, 0.18) * (1 - prog(t, ate - 0.2, 0.2));

// ---------------------------------------------------------------- destaque

export const DestaqueCheio: React.FC<{ m: Destaque; palavras: Palavra[]; t: number; zona: Zona; fim: number }> = ({ m, palavras, t, zona, fim }) => {
  const alerta = m.nivel === "alerta";
  const largura = 1080 - zona.esquerda - zona.direita - 20;
  const disponivel = LIMITE - zona.topo - 90 - (m.detalhe ? 70 : 0);
  const { encs } = encaixarTrechos([{ texto: m.texto, i0: 0, enfase: false }], { largura, altura: disponivel, base: 116, minimo: 66, fonte: { peso: 600 }, fonteEnfase: { peso: 600 }, linhas: 3 });
  const enc = encs[0];
  const tempos = temposDoTexto(m.texto, palavras, m.em - 0.3, fim, m.em);
  const ultima = Math.max(...tempos);
  const det = m.detalhe ? encaixar(m.detalhe, { largura, max: 54, min: 44, linhas: 2, fonte: { italico: true, peso: 500 } }) : null;
  const tDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, (m.detalheEm ?? ultima) - 0.3, fim + 0.5, m.detalheEm ?? ultima + 0.2) : [];
  const larguraUltima = larguraTexto(enc.linhas[enc.linhas.length - 1] ?? "", enc.tamanho, { peso: 600 });
  const icone = prog(t, m.em - 0.1, 0.5, gira);
  return (
    <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, display: "flex", flexDirection: "column", alignItems: "center", opacity: entradaSaida(t, m.de, fim) }}>
      <div style={{ height: 76, marginBottom: 12 }}>
        {alerta ? (
          <svg width={76} height={76} viewBox="-38 -38 76 76" style={{ overflow: "visible" }}>
            <circle r={24} fill="none" stroke={cor.lanterna} strokeWidth={3.5} strokeDasharray={`${2 * Math.PI * 24 * icone} 999`} transform="rotate(-90)" />
            {[0, 90, 180, 270].map((g) => {
              const a = (g * Math.PI) / 180;
              return <line key={g} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 30 + Math.cos(a) * 14 * icone} y2={Math.sin(a) * 30 + Math.sin(a) * 14 * icone} stroke={cor.lanterna} strokeWidth={3.5} strokeLinecap="round" />;
            })}
            <circle r={6} fill={cor.lanterna} opacity={prog(t, m.em + 0.2, 0.3)} />
          </svg>
        ) : (
          <div style={{ paddingTop: 8 }}>
            <QuatroPontas tamanho={60} cheia={prog(t, m.em - 0.03, 0.35)} />
          </div>
        )}
      </div>
      <Palavras enc={enc} i0={0} tempos={tempos} t={t} cor={alerta ? cor.lanterna : cor.texto} estilo={{ fontFamily: serifa, fontWeight: 600 }} />
      {!alerta ? <div style={{ marginTop: 14, height: 3, width: larguraUltima * prog(t, ultima + 0.15, 0.6, gira), background: cor.texto, opacity: 0.8 }} /> : null}
      {det ? (
        <div style={{ marginTop: 18 }}>
          <Palavras enc={det} i0={0} tempos={tDet} t={t} cor={cor.texto} estilo={{ fontFamily: serifa, fontStyle: "italic", fontWeight: 500 }} />
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- frase

export const FraseCheia: React.FC<{ m: Frase; palavras: Palavra[]; t: number; zona: Zona; fim: number }> = ({ m, palavras, t, zona, fim }) => {
  const largura = 1080 - zona.esquerda - zona.direita - 20;
  const segs = segmentos(m.texto, m.destaque);
  const { encs } = encaixarTrechos(segs, {
    largura,
    altura: LIMITE - zona.topo - 30,
    base: 92,
    minimo: 60,
    escalaEnfase: 1.25,
    fonte: { peso: 500 },
    fonteEnfase: { italico: true, peso: 500 },
  });
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, em - 0.3, fim, em);
  const risco = trechoNoTexto(m.texto, m.risco);
  // o risco corre enquanto o trecho é dito: começa logo depois da primeira palavra e termina logo
  // depois da última (ou no `riscoEm` dado)
  const riscoEm = m.riscoEm ?? (risco ? (tempos[risco[0]] ?? em) + 0.2 : 0);
  const riscoDur = risco ? limitar((tempos[risco[1]] ?? riscoEm) + 0.3 - riscoEm, 0.35, 1.2) : 0.4;
  return (
    <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo + 10, display: "flex", flexDirection: "column", alignItems: "center", opacity: entradaSaida(t, m.de, fim) }}>
      {segs.map((s, i) => (
        <Palavras
          key={i}
          enc={encs[i]}
          i0={s.i0}
          tempos={tempos}
          t={t}
          cor={cor.texto}
          risco={risco}
          riscoEm={riscoEm}
          riscoDur={riscoDur}
          estilo={{ fontFamily: serifa, fontWeight: 500, fontStyle: s.enfase ? "italic" : "normal" }}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- pergunta

export const PerguntaCheia: React.FC<{ m: Pergunta; palavras: Palavra[]; t: number; zona: Zona; fim: number }> = ({ m, palavras, t, zona, fim }) => {
  const largura = 1080 - zona.esquerda - zona.direita - 20;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  // os selos: corpo que cabe (o maior selo na largura toda)
  let corpoSelo = 44;
  while (corpoSelo > 34 && Math.max(0, ...opcoes.map((o) => larguraTexto(o.texto, corpoSelo, { familia: "sans", peso: 600 }) + 100)) > largura) corpoSelo -= 2;
  // quantas fileiras de selos (aproximado, para a altura)
  let fileiras = opcoes.length ? 1 : 0;
  let acc = 0;
  for (const o of opcoes) {
    const w = larguraTexto(o.texto, corpoSelo, { familia: "sans", peso: 600 }) + 100 + 18;
    if (acc + w > largura && acc > 0) {
      fileiras++;
      acc = w;
    } else acc += w;
  }
  const hSelos = fileiras ? fileiras * (corpoSelo + 34) + (fileiras - 1) * 16 + 28 : 0;
  const { encs } = encaixarTrechos([{ texto: m.texto, i0: 0, enfase: false }], {
    largura,
    altura: LIMITE - zona.topo - 106 - hSelos,
    base: 88,
    minimo: 58,
    fonte: { peso: 500 },
    fonteEnfase: { peso: 500 },
    linhas: 3,
  });
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, em - 0.3, opcoes[0]?.em ?? fim, em);
  const icone = prog(t, em - 0.1, 0.5, gira);
  return (
    <div style={{ position: "absolute", left: zona.esquerda, right: zona.direita, top: zona.topo, display: "flex", flexDirection: "column", alignItems: "center", opacity: entradaSaida(t, m.de, fim) }}>
      <svg width={92} height={92} viewBox="-46 -46 92 92" style={{ overflow: "visible", marginBottom: 14 }}>
        <circle r={38} fill="rgba(10,11,31,0.6)" stroke={cor.linha} strokeWidth={3} strokeDasharray={`${2 * Math.PI * 38 * icone} 999`} transform="rotate(-90)" />
        <text y={2} textAnchor="middle" dominantBaseline="central" fontFamily={serifa} fontWeight={600} fontSize={56} fill={cor.texto} opacity={prog(t, em, 0.3)}>
          ?
        </text>
      </svg>
      <Palavras enc={encs[0]} i0={0} tempos={tempos} t={t} cor={cor.texto} estilo={{ fontFamily: serifa, fontWeight: 500 }} />
      {opcoes.length ? (
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, rowGap: 16, maxWidth: largura }}>
          {opcoes.map((o, i) => {
            const u = prog(t, o.em - 0.05, 0.35);
            const tO = temposDoTexto(o.texto, palavras, o.em - 0.2, (opcoes[i + 1]?.em ?? fim) + 0.2, o.em);
            const enc: Encaixe = { tamanho: corpoSelo, linhas: [o.texto], largura: 0 };
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 26px 12px 18px",
                  borderRadius: 999,
                  background: `rgba(10,11,31,${0.5 + 0.36 * u})`,
                  border: `2.5px ${u > 0.5 ? "solid" : "dashed"} ${u > 0.5 ? cor.linha : cor.lapis}`,
                  scale: String(0.94 + 0.06 * u),
                }}
              >
                <QuatroPontas tamanho={38} cheia={u} />
                <Palavras enc={enc} i0={0} tempos={tO} t={t} cor={cor.texto} rascunho={0.3} estilo={{ fontFamily: sans, fontWeight: 600 }} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- número no peito

export const NumeroCheio: React.FC<{ m: Numero; palavras: Palavra[]; t: number; zona: Zona; fim: number }> = ({ m, palavras, t, zona, fim }) => {
  const r = { x: zona.esquerda, y: zona.topo, w: 1080 - zona.esquerda - zona.direita, h: Math.min(zona.altura, LIMITE - zona.topo) };
  return (
    <div style={{ position: "absolute", inset: 0, opacity: entradaSaida(t, m.de, fim) }}>
      <NumeroDesenho m={m} r={r} centro t={t} palavras={palavras} inicio={m.de} fim={fim} />
    </div>
  );
};
