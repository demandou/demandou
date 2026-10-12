// Abertura: a pessoa em tela cheia. No cartão ao lado do peito (a coluna livre do quadro deitado), a
// pergunta se monta palavra por palavra enquanto avisos de distração se amontoam tortos embaixo
// dela. Na resposta, os avisos são varridos para fora (para longe da pessoa), o cartão cresce e a
// resposta entra com uma fileira de blocos arrumados: o caos vira agenda.
import { Easing } from "remotion";
import { assenta, Palavras, prog, saindo, temposDoTexto } from "../anim";
import { ANTES, type Agenda, CARTAO, colunaDoPeito, yNoPeito } from "../agenda";
import { encaixar, medir } from "../medida";
import type { Gancho as TGancho, Palavra } from "../plano";
import { CATEGORIAS, cor, LARGURA, rotuloCaixaAlta, sans, sombraCartao } from "../tema";
import { Icone } from "./Icones";

const PAD = CARTAO.pad;
// posição e giro de cada aviso na pilha (em relação ao canto da pilha); numa coluna estreita os
// avisos se aproximam na horizontal e se afastam na vertical, para a pilha caber nela sem um aviso
// esconder o texto do outro
const PILHA = [
  { x: 0, y: 0, giro: -3 },
  { x: 360, y: 40, giro: 2.5 },
  { x: 70, y: 124, giro: 1.6 },
  { x: 400, y: 166, giro: -2.2 },
];

export const tamanhoDaPergunta = (texto: string, largura: number) => {
  const umaLinha = Math.min(92, Math.floor(largura / (texto.length * LARGURA)));
  if (umaLinha >= 76 && medir(texto, umaLinha) <= largura) return { tamanho: umaLinha, linhas: 1 };
  const e = encaixar(texto, { largura, max: 80, min: 56, linhas: 3, entrelinha: 1.06 });
  return { tamanho: e.tamanho, linhas: e.linhas.length };
};

export const Gancho: React.FC<{ m: TGancho; t: number; palavras: Palavra[]; ag: Agenda; fim: number }> = ({ m, t, palavras, ag, fim }) => {
  const resposta = m.resposta ?? "";
  const temposR = resposta ? temposDoTexto(resposta, palavras, m.de, m.ate) : [];
  const varre = m.varreEm ?? (resposta ? Math.max(m.de + 0.6, temposR[0] - 0.25) : 1e9);
  const temposP = temposDoTexto(m.pergunta, palavras, m.de, varre);
  const coluna = colunaDoPeito(ag, m.de, fim);
  const larguraInterna = coluna.w - 2 * PAD;
  const { tamanho, linhas } = tamanhoDaPergunta(m.pergunta, larguraInterna);
  // a pilha cabe na coluna; os avisos são varridos para o lado de fora (longe do rosto)
  const apertoX = Math.max(0.3, Math.min(1, (coluna.w - 540) / 400));
  const abreY = Math.min(2, 1 / apertoX);
  const nAvisos = Math.min(PILHA.length, (m.distracoes ?? []).length);
  const alturaDaPilha = nAvisos ? PILHA[nAvisos - 1].y * abreY + 104 : 0;
  const sentido = coluna.lado === "direita" ? 1 : -1;
  const altura1 = PAD * 2 + tamanho * 1.08 * linhas;
  const altura2 = PAD * 2 + 34 + 16 + 88 + (ag.blocos.length ? 30 + 46 : 0);
  const cresce = prog(t, varre + 0.05, 0.45);
  const altura = altura1 + (altura2 - altura1) * cresce;
  // some logo no começo da troca (encolhe junto com a pessoa, presa ao peito)
  const sai = saindo(t, fim - ANTES + 0.15, 0.2);
  const entra = prog(t, m.de - 0.2, 0.4);
  // o cartão começa abaixo do queixo; com a pilha de avisos, ela também tem que caber acima do app
  const topo = yNoPeito(ag, Math.max(altura2, altura1 + (alturaDaPilha ? 30 + alturaDaPilha : 0)), coluna, m.legenda);
  const pilhaTopo = topo + altura1 + 30;
  const ultimaPalavra = temposR[temposR.length - 1] ?? varre;

  return (
    <>
      {/* avisos de distração: entram tortos, se amontoam e são varridos para a direita */}
      {(m.distracoes ?? []).slice(0, 4).map((d, i) => {
        const pos = PILHA[i];
        const e = prog(t, d.em, 0.36, assenta);
        const v = prog(t, varre + i * 0.04, 0.4, Easing.in(Easing.quad));
        if (t < d.em || v >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: coluna.x + 10 + pos.x * apertoX + sentido * v * 1100,
              top: pilhaTopo + pos.y * abreY - (1 - e) * 46,
              minWidth: 420,
              height: 104,
              borderRadius: 26,
              background: "#FFFFFF",
              boxShadow: sombraCartao,
              rotate: `${pos.giro + sentido * v * 8}deg`,
              opacity: e * (1 - v * 0.6),
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 26px 0 18px",
              fontFamily: sans,
            }}
          >
            <div style={{ width: 68, height: 68, borderRadius: 18, background: cor.outroFundo, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icone nome={d.icone ?? "mensagem"} tamanho={44} cor={cor.outro} peso={3.6} />
            </div>
            <div style={{ flex: 1, fontSize: 44, fontWeight: 700, color: cor.tinta, whiteSpace: "nowrap" }}>{d.texto}</div>
            <div style={{ marginLeft: 10, fontSize: 34, fontWeight: 600, color: cor.tintaFraca }}>agora</div>
          </div>
        );
      })}

      {/* o cartão da pergunta → resposta */}
      <div
        style={{
          position: "absolute",
          left: coluna.x,
          top: topo + sai * 70 + (1 - entra) * 40,
          width: coluna.w,
          height: altura,
          borderRadius: 36,
          background: "#FFFFFF",
          boxShadow: sombraCartao,
          opacity: entra * (1 - sai),
          overflow: "hidden",
          fontFamily: sans,
        }}
      >
        <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD - 6 }}>
          <Palavras
            texto={m.pergunta}
            tempos={temposP}
            t={t}
            esboco={cor.esboco}
            saiEm={resposta ? varre : undefined}
            style={{ fontSize: tamanho, fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em", color: cor.tinta }}
          />
        </div>
        {resposta ? (
          // a resposta só aparece depois que a pergunta saiu (nunca dois textos um sobre o outro)
          <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD - 4, opacity: prog(t, varre + 0.26, 0.24) }}>
            {m.respostaRotulo ? (
              <div style={{ ...rotuloCaixaAlta, fontSize: 34, color: cor.focoEscuro, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: cor.foco }} />
                {m.respostaRotulo}
              </div>
            ) : null}
            <Palavras
              texto={resposta}
              tempos={temposR}
              t={t}
              esboco={cor.esboco}
              style={{ marginTop: 16, fontSize: tamanhoDaResposta(resposta, larguraInterna), fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em", color: cor.tinta, flexWrap: "nowrap" }}
            />
            <Fileira ag={ag} t={t} acende={ultimaPalavra + 0.1} largura={larguraInterna} />
          </div>
        ) : null}
      </div>
    </>
  );
};

// a resposta numa linha só: 88, ou menos se a coluna for estreita (nunca vaza do cartão)
const tamanhoDaResposta = (texto: string, largura: number) => Math.max(48, Math.min(88, Math.floor((88 * largura) / Math.max(1, medir(texto, 88)))));

// A fileira de blocos arrumados (o dia inteiro em miniatura), a lápis até a resposta ser dita
export const Fileira: React.FC<{ ag: Agenda; t: number; acende: number; largura: number }> = ({ ag, t, acende, largura }) => {
  if (!ag.blocos.length) return null;
  return (
    <div style={{ position: "relative", marginTop: 30, height: 46, width: largura }}>
      {ag.blocos.map((b, i) => {
        const x = (b.inicio / ag.total) * largura;
        const w = Math.max(6, ((b.maxMinutos ?? b.minutos) / ag.total) * largura - 6);
        const p = prog(t, acende + i * 0.05, 0.3);
        const cat = CATEGORIAS[b.categoria];
        return (
          <div key={b.id} style={{ position: "absolute", left: x, top: 0, width: w, height: 46 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 12, border: `3px dashed ${cor.esboco}`, opacity: 1 - p }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: cat.solido ? cat.forte : cat.forte, opacity: p, translate: `0 ${(1 - p) * -14}px` }} />
          </div>
        );
      })}
    </div>
  );
};
