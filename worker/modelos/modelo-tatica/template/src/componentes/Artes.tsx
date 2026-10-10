// Artes de TV dos blocos universais em quadro cheio, na altura do peito: placar (número), tarja de
// destaque, glossário (definição) e enquete (pergunta). O fundo varre, o texto aparece inteiro,
// cada palavra sobe na fala e a arte inteira desliza para fora no fim.
import { conteudoDaTarja, Linhas, prog, saidaDaTarja, saindo, temposDoTexto, Traco, varredura } from "../anim";
import { diagramar, medir } from "../medidas";
import type { Definicao, Destaque, Numero, Palavra, Pergunta } from "../plano";
import { cor, larga, normal, rotulo } from "../tema";

const L = 960;

type Base = { palavras: Palavra[]; t: number; topo: number; fim: number; altura: number };

// escala que faz uma arte mais alta que a zona caber abaixo do queixo
const escalaPara = (alturaDaArte: number, zona: number) => Math.min(1, zona / alturaDaArte);

const Caixa: React.FC<{ topo: number; altura: number; alturaDaArte: number; s: number; children: React.ReactNode }> = ({ topo, altura, alturaDaArte, s, children }) => (
  <div style={{ position: "absolute", left: 60, top: topo + 14, width: L, height: alturaDaArte, transformOrigin: "50% 0", scale: String(escalaPara(alturaDaArte, altura - 14)), ...saidaDaTarja(s) }}>{children}</div>
);

// ---------- número: o placar ----------

export const textoDoNumero = (m: Numero, valor: number) => {
  const casas = m.casas ?? 0;
  const negativo = valor < 0;
  const [inteiro, fracao] = Math.abs(valor).toFixed(casas).split(".");
  const n = `${negativo ? "−" : ""}${inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fracao ? `,${fracao}` : ""}`;
  const pre = m.prefixo ? (/[a-zA-Z$]$/.test(m.prefixo) ? `${m.prefixo} ` : m.prefixo) : "";
  const suf = m.sufixo ? (/^[%°]/.test(m.sufixo) ? m.sufixo : ` ${m.sufixo}`) : "";
  return `${pre}${n}${suf}`;
};

export const NumeroTv: React.FC<Base & { m: Numero }> = ({ m, palavras, t, topo, fim, altura }) => {
  const pTarja = prog(t, m.de, 0.36);
  const s = saindo(t, fim, 0.28);
  const p = prog(t, m.em - 0.05, 1.2);
  const final = textoDoNumero(m, m.valor);
  const { tam } = diagramar(final.toUpperCase(), { largura: L - 96, maximo: 200, minimo: 84, linhas: 1 });
  const rotuloEm = m.rotuloEm ?? m.de + 0.05;
  const tempos = temposDoTexto(m.rotulo, palavras, m.de, m.ate, rotuloEm);
  const { linhas, tam: tamRot } = diagramar(m.rotulo.toUpperCase(), { largura: L - 96, maximo: 64, minimo: 40, linhas: 2, corte: "rotulo", espacamento: 0.07 });
  const alturaAmarela = tam * 1.12 + 56;
  const alturaEscura = linhas.length * tamRot * 1.15 + 62;
  const alturaDaArte = alturaAmarela + alturaEscura;
  return (
    <Caixa topo={topo} altura={altura} alturaDaArte={alturaDaArte} s={s}>
      <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTarja), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: L, height: alturaAmarela, background: cor.placar, borderRadius: "12px 12px 0 0" }} />
        <div style={{ position: "absolute", left: 0, top: alturaAmarela, width: L, height: alturaEscura, background: cor.tv, borderRadius: "0 0 12px 12px" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, ...conteudoDaTarja(pTarja) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: L, height: alturaAmarela, display: "flex", alignItems: "center", paddingLeft: 48 }}>
          <span style={{ ...larga, fontSize: tam, color: cor.tv, lineHeight: 1, fontVariantNumeric: "tabular-nums lining-nums", whiteSpace: "nowrap" }}>{p >= 1 ? final : textoDoNumero(m, m.valor * p)}</span>
        </div>
        {m.ilustrativo ? (
          <div style={{ position: "absolute", right: 28, top: 22, background: cor.tv, borderRadius: 6, padding: "8px 18px" }}>
            <span style={{ ...rotulo, fontSize: 30, color: cor.placar }}>Ilustrativo</span>
          </div>
        ) : null}
        {/* barra de progresso do placar: enche junto com o número */}
        <div style={{ position: "absolute", left: 48, bottom: alturaEscura + 14, width: L - 96, height: 10, borderRadius: 5, background: "rgba(11,16,22,0.22)" }}>
          <div style={{ width: `${p * 100}%`, height: "100%", borderRadius: 5, background: cor.tv }} />
        </div>
        <div style={{ position: "absolute", left: 0, top: alturaAmarela, width: L, height: alturaEscura, padding: "30px 48px 0 48px" }}>
          <Linhas linhas={linhas} tempos={tempos} t={t} fantasma={0.18} style={{ ...rotulo, letterSpacing: "0.07em", fontSize: tamRot, color: cor.giz, gap: tamRot * 0.1 }} />
        </div>
      </div>
    </Caixa>
  );
};

// ---------- destaque: a tarja que bate forte ----------

export const DestaqueTv: React.FC<Base & { m: Destaque }> = ({ m, palavras, t, topo, fim, altura }) => {
  const alerta = m.nivel === "alerta";
  const pTarja = prog(t, m.de, 0.36);
  const s = saindo(t, fim, 0.28);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em);
  const { linhas, tam } = diagramar(m.texto.toUpperCase(), { largura: L - 116, maximo: 104, minimo: 52, linhas: 3, linhasMax: 4, altura: 330, entrelinha: 1.06 });
  const det = m.detalhe ? diagramar(m.detalhe, { largura: L - 116, maximo: 48, minimo: 32, linhas: 2, corte: "normal700" }) : null;
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, m.detalheEm ?? m.em + 0.6) : [];
  const pChip = prog(t, m.em - 0.1, 0.3);
  const alturaChip = 64;
  const alturaTarja = 56 + linhas.length * tam * 1.06 + (det ? 28 + det.linhas.length * det.tam * 1.16 : 0) + 56;
  const alturaDaArte = alturaChip + alturaTarja;
  const fundo = alerta ? cor.placar : cor.tv;
  return (
    <Caixa topo={topo} altura={altura} alturaDaArte={alturaDaArte} s={s}>
      <div style={{ position: "absolute", left: 0, top: 0, display: "inline-flex", padding: "0 26px", height: alturaChip, alignItems: "center", opacity: pChip }}>
        <div style={{ position: "absolute", inset: 0, background: alerta ? cor.tv : cor.placar, borderRadius: "8px 8px 0 0", clipPath: varredura(pChip, 8) }} />
        <span style={{ ...rotulo, fontSize: 34, color: alerta ? cor.placar : cor.tv, position: "relative", ...conteudoDaTarja(pChip) }}>{alerta ? "Atenção" : "Anote"}</span>
      </div>
      <div style={{ position: "absolute", left: 0, top: alturaChip, width: L, height: alturaTarja }}>
        <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTarja), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
          <div style={{ position: "absolute", inset: 0, background: fundo, borderRadius: "0 12px 12px 12px" }} />
          {!alerta ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: cor.placar, borderRadius: "0 0 0 12px" }} /> : null}
        </div>
        <div style={{ position: "absolute", inset: 0, padding: "56px 56px 0 60px", ...conteudoDaTarja(pTarja) }}>
          <Linhas linhas={linhas} tempos={tempos} t={t} fantasma={alerta ? 0.22 : 0.16} style={{ ...larga, fontSize: tam, color: alerta ? cor.tv : cor.giz, gap: tam * 0.06 }} />
          {det ? (
            <div style={{ marginTop: 28 }}>
              <Linhas linhas={det.linhas} tempos={temposDet} t={t} fantasma={0.2} style={{ ...normal, fontWeight: 700, fontSize: det.tam, color: alerta ? cor.tv : cor.tvTexto }} />
            </div>
          ) : null}
        </div>
      </div>
    </Caixa>
  );
};

// ---------- definição: o glossário ----------

export const DefinicaoTv: React.FC<Base & { m: Definicao }> = ({ m, palavras, t, topo, fim, altura }) => {
  const pTermo = prog(t, m.de, 0.36);
  const pSig = prog(t, m.significadoEm - 0.25, 0.4);
  const s = saindo(t, fim, 0.28);
  const tTermo = temposDoTexto(m.termo, palavras, m.de, m.ate, m.em);
  const termo = diagramar(m.termo.toUpperCase(), { largura: L - 120, maximo: 120, minimo: 56, linhas: 2, altura: 250, entrelinha: 1.04 });
  const tSig = temposDoTexto(m.significado, palavras, m.de, m.ate, m.significadoEm);
  const sig = diagramar(m.significado, { largura: L - 116, maximo: 62, minimo: 38, linhas: 2, linhasMax: 4, corte: "normal700", entrelinha: 1.16 });
  const alturaTermo = 52 + termo.linhas.length * termo.tam * 1.04 + 52;
  const alturaSig = 48 + sig.linhas.length * sig.tam * 1.16 + 48;
  const alturaDaArte = alturaTermo + alturaSig + 8;
  return (
    <Caixa topo={topo} altura={altura} alturaDaArte={alturaDaArte} s={s}>
      <div style={{ position: "absolute", left: 0, top: 0, width: L, height: alturaTermo }}>
        <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTermo), filter: "drop-shadow(0 18px 34px rgba(0,0,0,0.32))" }}>
          <div style={{ position: "absolute", inset: 0, background: cor.placar, borderRadius: "12px 12px 0 0" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, padding: "52px 60px 0 60px", ...conteudoDaTarja(pTermo) }}>
          <Linhas linhas={termo.linhas} tempos={tTermo} t={t} fantasma={0.22} style={{ ...larga, fontSize: termo.tam, color: cor.tv, gap: termo.tam * 0.04 }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: alturaTermo + 8, width: L, height: alturaSig, opacity: 0.4 + 0.6 * pSig }}>
        <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: "0 0 12px 12px", filter: "drop-shadow(0 18px 34px rgba(0,0,0,0.3))", clipPath: varredura(Math.max(pSig, 0.12), 12) }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: cor.placar, borderRadius: "0 0 0 12px", opacity: pSig }} />
        <div style={{ position: "absolute", inset: 0, padding: "48px 56px 0 60px" }}>
          <Linhas linhas={sig.linhas} tempos={tSig} t={t} fantasma={0.2} style={{ ...normal, fontWeight: 700, fontSize: sig.tam, color: cor.giz }} />
        </div>
      </div>
      {/* o sinal de "=" entre o termo e o significado */}
      <div style={{ position: "absolute", right: 56, top: alturaTermo - 30, width: 68, height: 68, borderRadius: 34, background: cor.tv, display: "flex", alignItems: "center", justifyContent: "center", opacity: pSig, scale: String(0.7 + 0.3 * pSig) }}>
        <span style={{ ...larga, fontSize: 44, color: cor.placar, lineHeight: 1 }}>=</span>
      </div>
    </Caixa>
  );
};

// ---------- pergunta: a enquete ----------

const LETRAS = ["A", "B", "C", "D"];

export const PerguntaTv: React.FC<Base & { m: Pergunta }> = ({ m, palavras, t, topo, fim, altura }) => {
  const opcoes = m.opcoes ?? [];
  const pTarja = prog(t, m.de, 0.36);
  const s = saindo(t, fim, 0.28);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em ?? m.de + 0.05);
  const temOpcoes = opcoes.length > 0;
  const quad = temOpcoes ? 130 : 190;
  const q = diagramar(m.texto.toUpperCase(), { largura: L - quad - 104, maximo: temOpcoes ? 56 : 80, minimo: temOpcoes ? 40 : 46, linhas: temOpcoes ? 3 : 4, linhasMax: 5, entrelinha: 1.06 });
  const alturaPergunta = Math.max(quad, 56 + q.linhas.length * q.tam * 1.06 + 56);
  const linhaH = 84;
  const alturaDaArte = alturaPergunta + (temOpcoes ? 12 + opcoes.length * (linhaH + 10) : 0);
  const tamOpcao = Math.max(34, Math.min(50, ...opcoes.map((o) => Math.floor(((L - 190) / Math.max(1, medir(o.texto, 100, "normal700"))) * 100))));
  return (
    <Caixa topo={topo} altura={altura} alturaDaArte={alturaDaArte} s={s}>
      <div style={{ position: "absolute", left: 0, top: 0, width: L, height: alturaPergunta }}>
        <div style={{ position: "absolute", inset: 0, clipPath: varredura(pTarja), filter: "drop-shadow(0 22px 40px rgba(0,0,0,0.34))" }}>
          <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: temOpcoes ? "12px 12px 0 0" : 12 }} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: quad, background: cor.placar, borderRadius: temOpcoes ? "12px 0 0 0" : "12px 0 0 12px" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", ...conteudoDaTarja(pTarja) }}>
          <div style={{ width: quad, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ ...larga, fontSize: quad * 0.78, color: cor.tv, lineHeight: 1 }}>?</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 40px 0 44px" }}>
            <Linhas linhas={q.linhas} tempos={tempos} t={t} fantasma={0.16} style={{ ...larga, fontSize: q.tam, color: cor.giz, gap: q.tam * 0.06 }} />
          </div>
        </div>
      </div>
      {opcoes.map((o, i) => {
        const p = prog(t, o.em - 0.1, 0.4);
        const pVisto = prog(t, o.em + 0.1, 0.35);
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: alturaPergunta + 12 + i * (linhaH + 10), width: L, height: linhaH }}>
            <div style={{ position: "absolute", inset: 0, background: cor.tv, borderRadius: 8, opacity: 0.35 + 0.65 * p, outline: p < 0.1 ? `3px dashed ${cor.gizApagado}` : undefined, outlineOffset: -3 }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: linhaH, height: linhaH, borderRadius: "8px 0 0 8px", background: p > 0.05 ? cor.placar : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ ...larga, fontSize: 46, color: p > 0.05 ? cor.tv : cor.gizApagado }}>{LETRAS[i]}</span>
            </div>
            <div style={{ position: "absolute", left: linhaH + 28, right: 90, top: 0, bottom: 0, display: "flex", alignItems: "center", translate: `${(1 - p) * -20}px 0`, opacity: 0.4 + 0.6 * p }}>
              <span style={{ ...normal, fontWeight: 700, fontSize: tamOpcao, color: cor.giz, whiteSpace: "nowrap" }}>{o.texto}</span>
            </div>
            <svg width={64} height={64} viewBox="0 0 64 64" style={{ position: "absolute", right: 20, top: (linhaH - 64) / 2 }}>
              <Traco d="M 12 34 L 26 48 L 54 16" p={pVisto} cor={cor.placar} largura={9} />
            </svg>
          </div>
        );
      })}
    </Caixa>
  );
};
