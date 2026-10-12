// Cartões da tela cheia, na linguagem do app de agenda. No quadro deitado eles ficam numa coluna
// livre ao lado do corpo, na altura do peito (src/agenda.ts, colunaDoPeito), e a largura de cada
// cartão é a da coluna:
// - abertura: o cartão branco do gancho, com o título que se monta na fala e o dia em miniatura;
// - destaque: um bloco que cai no peito (tomate cheio no alerta; branco com grifo tomate na chave);
// - pergunta: um convite de agenda, com os botões de resposta que acendem na fala;
// - número (primeiro momento do vídeo): o widget do cronômetro, com o anel que se enche.
// Todos esperam a lápis antes da palavra e caem decididos, sem quique.
import { assenta, Linhas, mistura, prog, saindo, temposDoTexto, Traco } from "../anim";
import { ANTES, type Agenda, CARTAO, type Coluna, colunaDoPeito, yNoPeito } from "../agenda";
import { encaixar, formatar, medir, trechoNoTexto } from "../medida";
import type { Abertura, Destaque, Numero, Palavra, Pergunta } from "../plano";
import { cor, numeros, sans, sombraCartao } from "../tema";
import { Fileira } from "./Gancho";
import { Icone } from "./Icones";
import { Aro, valorNoTempo } from "./Numero";

const PAD = CARTAO.pad;
// a largura do texto dentro de um cartão da coluna
const larguraDe = (c: Coluna) => c.w - 2 * PAD;

type Props<M> = { m: M; t: number; palavras: Palavra[]; ag: Agenda; fim: number };

// entrada e saída comuns: entra depois que o cartão anterior saiu (ou já está lá no primeiro
// quadro do vídeo); some no começo da troca seguinte (presa ao peito, se a pessoa encolher)
const entradaDoCartao = (m: { de: number }, t: number, fim: number) => {
  const entra = m.de < 0.2 ? 1 : prog(t, m.de + 0.1, 0.4);
  const sai = saindo(t, fim - ANTES + 0.15, 0.2);
  return { entra, sai };
};

const Cartao: React.FC<{ coluna: Coluna; y: number; altura: number; entra: number; sai: number; fundo?: string; queda?: number; children: React.ReactNode }> = ({
  coluna,
  y,
  altura,
  entra,
  sai,
  fundo = "#FFFFFF",
  queda = 1,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: coluna.x,
      top: y + sai * 70 + (1 - entra) * 40 - (1 - queda) * 46,
      width: coluna.w,
      height: altura,
      borderRadius: 36,
      background: fundo,
      boxShadow: sombraCartao,
      opacity: entra * (1 - sai),
      scale: String(1 + (1 - queda) * 0.05),
      overflow: "hidden",
      fontFamily: sans,
    }}
  >
    {children}
  </div>
);

// ——— abertura ———

export const layoutAbertura = (texto: string, largura: number) => encaixar(texto, { largura, max: 96, min: 60, linhas: 3, entrelinha: 1.06 });

export const CartaoAbertura: React.FC<Props<Abertura>> = ({ m, t, palavras, ag, fim }) => {
  const coluna = colunaDoPeito(ag, m.de, fim);
  const e = layoutAbertura(m.texto, larguraDe(coluna));
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio, m.ate, inicio);
  const grifo = trechoNoTexto(m.texto, m.destaque);
  const comFileira = ag.blocos.length > 0;
  const altura = PAD * 2 + e.linhas.length * e.tamanho * 1.06 + (comFileira ? 30 + 46 : 0);
  const { entra, sai } = entradaDoCartao(m, t, fim);
  const ultima = tempos[tempos.length - 1] ?? inicio;
  return (
    <Cartao coluna={coluna} y={yNoPeito(ag, altura, coluna, m.legenda)} altura={altura} entra={entra} sai={sai}>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD - 4 }}>
        <Linhas
          linhas={e.linhas}
          tempos={tempos}
          t={t}
          tamanho={e.tamanho}
          esboco={cor.esboco}
          cor={cor.tinta}
          corDe={(i) => (grifo && i >= grifo[0] && i <= grifo[1] ? cor.foco : undefined)}
        />
        {comFileira ? <Fileira ag={ag} t={t} acende={ultima + 0.15} largura={larguraDe(coluna)} /> : null}
      </div>
    </Cartao>
  );
};

// ——— destaque ———

export const CartaoDestaque: React.FC<Props<Destaque>> = ({ m, t, palavras, ag, fim }) => {
  const alerta = m.nivel === "alerta";
  const icone = 84;
  const coluna = colunaDoPeito(ag, m.de, fim);
  const largura = larguraDe(coluna) - (alerta ? icone + 28 : 0);
  const e = encaixar(m.texto, { largura, max: 100, min: 60, linhas: 3, entrelinha: 1.04 });
  const det = m.detalhe ? encaixar(m.detalhe, { largura, max: 46, min: 36, linhas: 2, entrelinha: 1.15, fonte: { peso: 600 } }) : null;
  const alturaTexto = e.linhas.length * e.tamanho * 1.04;
  const altura = PAD * 2 + 8 + Math.max(alerta ? icone : 0, alturaTexto + (alerta ? 0 : 26)) + (det ? 22 + det.linhas.length * det.tamanho * 1.15 : 0);
  const { entra, sai } = entradaDoCartao(m, t, fim);
  const tempos = temposDoTexto(m.texto, palavras, m.em, m.ate, m.em);
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.detalheEm ?? m.em, m.ate, m.detalheEm ?? m.em + 0.3) : [];
  // o bloco cai no seu lugar a lápis na palavra
  const queda = prog(t, m.em - 0.08, 0.42, assenta);
  const caiu = t >= m.em - 0.08;
  const y = yNoPeito(ag, altura, coluna, m.legenda);
  const ultima = tempos[tempos.length - 1] ?? m.em;
  const grifo = prog(t, ultima + 0.2, 0.45);
  const larguraTexto = Math.max(...e.linhas.map((l) => medir(l.join(" "), e.tamanho)));
  const tinta = alerta ? "#FFFFFF" : cor.tinta;
  const conteudo = (
    <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD - 2, display: "flex", gap: 28, alignItems: "flex-start" }}>
      {alerta ? (
        <div style={{ width: icone, height: icone, borderRadius: 24, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icone nome="alerta" tamanho={56} cor="#FFFFFF" peso={4.2} p={prog(t, m.em, 0.5)} />
        </div>
      ) : null}
      <div style={{ position: "relative", width: largura, minHeight: alerta ? icone : undefined, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Linhas linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} entrelinha={1.04} cor={tinta} />
        {!alerta ? (
          <div style={{ marginTop: 14, height: 10, width: larguraTexto * grifo, borderRadius: 5, background: cor.foco }} />
        ) : null}
        {det ? (
          <Linhas
            linhas={det.linhas}
            tempos={temposDet}
            t={t}
            tamanho={det.tamanho}
            entrelinha={1.15}
            peso={600}
            espacamento="0em"
            cor={alerta ? "rgba(255,255,255,0.88)" : cor.tintaSuave}
            style={{ marginTop: 22 }}
          />
        ) : null}
      </div>
    </div>
  );
  return (
    <>
      {/* o lugar a lápis, até o bloco cair */}
      {!caiu || queda < 1 ? (
        <div
          style={{
            position: "absolute",
            left: coluna.x,
            top: y + (1 - entra) * 40,
            width: coluna.w,
            height: altura,
            borderRadius: 36,
            border: "4px dashed rgba(255,255,255,0.85)",
            boxSizing: "border-box",
            // o lugar a lápis (só o contorno) aparece pouco antes da palavra: nunca uma caixa vazia parada
            opacity: entra * (1 - sai) * prog(t, m.em - 0.3, 0.12) * (1 - prog(t, m.em + 0.05, 0.2)),
          }}
        />
      ) : null}
      {caiu ? (
        <Cartao coluna={coluna} y={y} altura={altura} entra={Math.min(entra, prog(t, m.em - 0.08, 0.14))} sai={sai} fundo={alerta ? cor.foco : "#FFFFFF"} queda={queda}>
          {conteudo}
        </Cartao>
      ) : null}
    </>
  );
};

// ——— pergunta: o convite com os botões de resposta ———

const PILULA = { altura: 84, fonte: 40, icone: 36, padE: 22, padD: 30, vao: 18 };
const larguraPilula = (texto: string, fonte = PILULA.fonte) => medir(texto, fonte, { peso: 700 }) + PILULA.padE + PILULA.padD + PILULA.icone + 12;

export const layoutPergunta = (m: Pergunta, LARGURA: number) => {
  const icone = 84;
  const largura = LARGURA - icone - 28;
  const e = encaixar(m.texto, { largura, max: 84, min: 54, linhas: 3, entrelinha: 1.05 });
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  // as opções em fileiras (quebram quando não cabem); a fonte desce se uma opção sozinha não couber
  const fonte = Math.max(32, Math.min(PILULA.fonte, ...opcoes.map((o) => Math.floor((PILULA.fonte * (LARGURA - 100)) / Math.max(1, larguraPilula(o.texto) - 100)))));
  const fileiras: number[][] = [];
  let usada = Infinity;
  opcoes.forEach((o, k) => {
    const w = larguraPilula(o.texto, fonte);
    if (usada + PILULA.vao + w > LARGURA) {
      fileiras.push([k]);
      usada = w;
    } else {
      fileiras[fileiras.length - 1].push(k);
      usada += PILULA.vao + w;
    }
  });
  const alturaTexto = Math.max(icone, e.linhas.length * e.tamanho * 1.05);
  const alturaOpcoes = fileiras.length ? 30 + fileiras.length * PILULA.altura + (fileiras.length - 1) * 16 : 0;
  return { e, icone, largura, fonte, fileiras, altura: PAD * 2 + alturaTexto + alturaOpcoes, alturaTexto };
};

export const CartaoPergunta: React.FC<Props<Pergunta>> = ({ m, t, palavras, ag, fim }) => {
  const coluna = colunaDoPeito(ag, m.de, fim);
  const l = layoutPergunta(m, larguraDe(coluna));
  const inicio = m.em ?? m.de;
  const primeiraOpcao = m.opcoes?.[0]?.em ?? m.ate;
  const tempos = temposDoTexto(m.texto, palavras, inicio, Math.max(inicio + 0.5, primeiraOpcao), inicio);
  const { entra, sai } = entradaDoCartao(m, t, fim);
  const y = yNoPeito(ag, l.altura, coluna, m.legenda);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  return (
    <Cartao coluna={coluna} y={y} altura={l.altura} entra={entra} sai={sai}>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD - 2, display: "flex", gap: 28, alignItems: "flex-start" }}>
        <div style={{ width: l.icone, height: l.icone, borderRadius: 24, background: cor.foco, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icone nome="pergunta" tamanho={54} cor="#FFFFFF" peso={4.6} p={prog(t, inicio, 0.5)} />
        </div>
        <div style={{ width: l.largura, minHeight: l.icone, display: "flex", alignItems: "center" }}>
          <Linhas linhas={l.e.linhas} tempos={tempos} t={t} tamanho={l.e.tamanho} entrelinha={1.05} esboco={cor.esboco} cor={cor.tinta} />
        </div>
      </div>
      {l.fileiras.map((fileira, f) => (
        <div key={f} style={{ position: "absolute", left: PAD, top: PAD + l.alturaTexto + 30 + f * (PILULA.altura + 16), display: "flex", gap: PILULA.vao }}>
          {fileira.map((k) => {
            const o = opcoes[k];
            const p = prog(t, o.em - 0.05, 0.32);
            const ws = o.texto.split(/\s+/).filter(Boolean);
            const temposO = temposDoTexto(o.texto, palavras, o.em, opcoes[k + 1]?.em ?? m.ate, o.em);
            return (
              <div
                key={k}
                style={{
                  height: PILULA.altura,
                  width: larguraPilula(o.texto, l.fonte),
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: `0 ${PILULA.padD}px 0 ${PILULA.padE}px`,
                  boxSizing: "border-box",
                  borderRadius: 999,
                  border: `3px ${p > 0.5 ? "solid" : "dashed"} ${p > 0.5 ? cor.outro : cor.esboco}`,
                  background: p > 0.5 ? cor.outroFundo : "#FFFFFF",
                  scale: String(mistura(0.94, 1, p)),
                  whiteSpace: "nowrap",
                }}
              >
                <svg width={PILULA.icone} height={PILULA.icone} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
                  <circle cx={18} cy={18} r={14} fill="none" stroke={p > 0.5 ? cor.outro : cor.esboco} strokeWidth={3.5} />
                  {p > 0.5 ? <circle cx={18} cy={18} r={7} fill={cor.foco} opacity={prog(t, o.em + 0.15, 0.25)} /> : null}
                </svg>
                <Linhas linhas={[ws]} tempos={temposO} t={t} tamanho={l.fonte} peso={700} entrelinha={1.1} espacamento="0em" cor={cor.tinta} />
              </div>
            );
          })}
        </div>
      ))}
    </Cartao>
  );
};

// ——— número no peito: o widget do cronômetro ———

export const CartaoNumero: React.FC<Props<Numero>> = ({ m, t, palavras, ag, fim }) => {
  const d = 264;
  const coluna = colunaDoPeito(ag, m.de, fim);
  const largura = larguraDe(coluna) - d - 40;
  const { texto, fracao } = valorNoTempo(m, t);
  const final = valorNoTempo(m, 1e9).texto;
  const tamanhoNumero = Math.max(64, Math.min(140, Math.floor((140 * (largura - (m.sufixo ? medir(` ${m.sufixo}`, 56) : 0))) / Math.max(1, medir(final, 140, { tabular: true })))));
  const rot = encaixar(m.rotulo, { largura, max: 52, min: 38, linhas: 2, entrelinha: 1.08, fonte: { peso: 700 } });
  const alturaTexto = (m.prefixo ? 48 : 0) + tamanhoNumero * 1.0 + 16 + rot.linhas.length * rot.tamanho * 1.08;
  const altura = PAD * 2 + Math.max(d, alturaTexto);
  const { entra, sai } = entradaDoCartao(m, t, fim);
  const temposR = temposDoTexto(m.rotulo, palavras, m.rotuloEm ?? m.de, m.ate, m.rotuloEm ?? m.de);
  const aceso = t >= m.em - 0.05;
  return (
    <Cartao coluna={coluna} y={yNoPeito(ag, altura, coluna, m.legenda)} altura={altura} entra={entra} sai={sai}>
      <div style={{ position: "absolute", left: PAD, top: (altura - d) / 2 }}>
        <Aro d={d} fracao={fracao} t={t} aceso={aceso} />
      </div>
      <div style={{ position: "absolute", left: PAD + d + 40, top: (altura - alturaTexto) / 2, width: largura }}>
        {m.prefixo ? <div style={{ fontSize: 44, fontWeight: 700, color: aceso ? cor.focoEscuro : cor.esbocoTexto, lineHeight: "48px" }}>{m.prefixo}</div> : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, whiteSpace: "nowrap" }}>
          <div style={{ fontSize: tamanhoNumero, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", color: aceso ? cor.tinta : cor.esbocoTexto, ...numeros }}>{aceso ? texto : final.replace(/\d/g, "0")}</div>
          {m.sufixo ? <div style={{ fontSize: m.sufixo.trim().length <= 2 ? Math.round(tamanhoNumero * 0.6) : 56, fontWeight: 700, color: aceso ? cor.tintaSuave : cor.esbocoTexto }}>{m.sufixo.trim()}</div> : null}
        </div>
        <Linhas linhas={rot.linhas} tempos={temposR} t={t} tamanho={rot.tamanho} entrelinha={1.08} peso={700} espacamento="0em" esboco={cor.esboco} cor={cor.tintaSuave} style={{ marginTop: 16 }} />
      </div>
      {m.ilustrativo ? <Ilustrativo x={coluna.w - PAD - 250} y={PAD - 10} /> : null}
    </Cartao>
  );
};

// etiqueta "ILUSTRATIVO" (números e formas que não vieram da fala)
export const Ilustrativo: React.FC<{ x: number; y: number; p?: number }> = ({ x, y, p = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      height: 48,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 18px 0 14px",
      borderRadius: 14,
      border: `2.5px dashed ${cor.tintaFraca}`,
      color: cor.tintaSuave,
      fontFamily: sans,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      opacity: p,
      background: "#FFFFFF",
    }}
  >
    <div style={{ width: 14, height: 14, borderRadius: 4, background: cor.tintaFraca }} />
    Ilustrativo
  </div>
);

export { formatar, Traco };
