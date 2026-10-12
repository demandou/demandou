import { Datilo, DatiloFalado, limitar, mistura, preciso, prog, saindo, temposDoTexto } from "../anim";
import { encaixar, encaixarBloco } from "../medida";
import type { Linha as TLinha, Palavra } from "../plano";
import { cor, LIMITE_APP, MARGEM, mono, QUADRO, rotulo, sans, sombraTexto } from "../tema";
import { Carimbo } from "./Carimbo";

const PX_ANO = 18;

// Duração da corrida entre dois marcos: mais anos, um pouco mais longa
const corrida = (de: number, ate: number) => Math.min(1.5, Math.max(0.8, Math.abs(ate - de) * 0.017));

// Sem anos ditos, os marcos ficam a 12 "anos" um do outro: a régua anda por igual entre eles.
type Marco = { em: number; ano: number; texto?: string };
const comAnos = (marcos: TLinha["marcos"]): { marcos: Marco[]; qualitativo: boolean } => {
  const qualitativo = marcos.some((mc) => typeof mc.ano !== "number");
  return { marcos: marcos.map((mc, i) => ({ ...mc, ano: qualitativo ? i * 12 : (mc.ano as number) })), qualitativo };
};

export const anoNoTempo = (t: number, marcos: Marco[]) => {
  let ano = marcos[0]?.ano ?? 2000;
  for (let i = 1; i < marcos.length; i++) {
    const a = marcos[i - 1].ano;
    const b = marcos[i].ano;
    const p = prog(t, marcos[i].em, corrida(a, b), preciso);
    if (p <= 0) break;
    ano = mistura(a, b, p);
  }
  return ano;
};

// Linha do tempo de documentário: a régua corre na base, os anos passam sob o ponteiro vermelho,
// o contador acompanha; em cima, a manchete bate palavra por palavra e o carimbo fecha o marco.
// No quadro deitado a faixa abaixo do queixo é baixa, então tudo fica numa FILEIRA sobre a régua:
// a manchete à esquerda, o contador no meio (sobre o ponteiro) e o carimbo à direita.
export const Linha: React.FC<{
  m: TLinha;
  t: number;
  fim: number;
  area: { x: number; y: number; w: number; h: number };
  palavras: Palavra[];
}> = ({ m, t, fim, area, palavras }) => {
  const sai = saindo(t, fim - 0.05, 0.22);
  const entra = prog(t, m.de, 0.5);
  const { marcos, qualitativo } = comAnos(m.marcos.slice(0, 4));
  const ano = anoNoTempo(t, marcos);
  const anoInteiro = Math.round(ano);
  const centro = QUADRO.w / 2;
  // a régua fica logo abaixo da área dos supers, com os anos dela acima dos controles do player; com
  // legenda, ela sobe para dentro da faixa e os anos ficam acima da tarja da legenda
  const baseY = m.legenda ? area.y + area.h - 34 : Math.min(area.y + area.h + 18, LIMITE_APP - 52);
  // meia largura do contador (o ano, ou o nome do marco sem anos), centrado sobre o ponteiro
  const meioContador = qualitativo ? 300 : 190;
  // a manchete ocupa a esquerda até perto do contador, da faixa dos supers até acima das marcas
  const larguraManchete = centro - meioContador - 40 - area.x;
  const alturaManchete = Math.max(120, baseY - 112 - area.y);
  const fitManchete = m.manchete
    ? encaixarBloco(m.manchete, { largura: larguraManchete - (m.enfase ? 36 : 0), altura: alturaManchete, max: 68, min: 44, maxLinhas: 3, entrelinha: 1.04, fonte: { peso: 800 } })
    : null;
  const tempos = m.manchete ? temposDoTexto(m.manchete, palavras, m.de, m.ate) : [];
  // marco atual: o último alcançado
  let atual = 0;
  marcos.forEach((mc, i) => {
    if (i === 0 || t >= mc.em + corrida(marcos[i - 1].ano, mc.ano) * 0.7) atual = i;
  });
  const trocaMarco = prog(t, atual === 0 ? m.de : marcos[atual].em + corrida(marcos[atual - 1].ano, marcos[atual].ano) * 0.7, 0.3);
  // enquanto o contador corre para o próximo marco, o rótulo do marco anterior sai (senão "1961 · INAUGURAÇÃO")
  const proximo = marcos[atual + 1];
  const correndo = proximo ? prog(t, proximo.em, 0.2) : 0;
  const anos: number[] = [];
  const alcance = Math.ceil(centro / PX_ANO) + 2;
  for (let a = Math.floor(ano) - alcance; a <= Math.ceil(ano) + alcance; a++) anos.push(a);
  const anosDosMarcos = new Set(marcos.map((mc) => mc.ano));
  const papel = m.carimbo ? prog(t, m.carimbo.em - 0.4, 0.35) : 0;
  // o maior corpo em que todos os nomes de marco cabem numa linha (modo sem anos)
  const tamMarco = qualitativo
    ? Math.min(...marcos.map((mc) => encaixar((mc.texto ?? "").toUpperCase() || "—", { largura: 2 * meioContador, max: 88, min: 48, linhas: 1, fonte: { peso: 800, espacamento: 0.01 } }).tamanho))
    : 104;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai }}>
      {/* a base escurece para a régua e a manchete lerem bem */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: Math.max(area.y - 100, baseY - 420),
          bottom: 0,
          background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,0.55) 35%, rgba(10,10,10,0.78) 100%)",
          opacity: entra,
        }}
      />

      {m.manchete ? (
        <div style={{ position: "absolute", left: area.x, bottom: QUADRO.h - (baseY - 112), width: larguraManchete, textShadow: sombraTexto }}>
          <DatiloFalado
            texto={m.manchete}
            linhas={fitManchete?.linhas}
            tempos={tempos}
            t={t}
            enfase={m.enfase}
            tarja
            style={{ fontFamily: sans, fontWeight: 800, fontSize: fitManchete?.tamanho ?? 60, lineHeight: 1.04, color: cor.claro }}
          />
        </div>
      ) : null}

      {m.carimbo ? (
        <div
          style={{
            position: "absolute",
            right: MARGEM,
            top: Math.max(area.y - 30, baseY - 340),
            // etiqueta de papel onde o carimbo bate (vermelho sobre o vídeo escuro não se lê)
            background: cor.cartao,
            padding: "26px 28px",
            rotate: "3deg",
            boxShadow: "0 16px 36px rgba(0,0,0,0.4)",
            opacity: papel,
            translate: `${(1 - papel) * 90}px 0`,
          }}
        >
          <Carimbo texto={m.carimbo.texto} detalhe={m.carimbo.detalhe} em={m.carimbo.em} t={t} rot={-8} semente={5} tamanho={0.95} />
        </div>
      ) : null}

      {/* contador de anos e marco atual, acima do ponteiro */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: baseY - 248,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: entra,
          translate: `0 ${(1 - entra) * 30}px`,
          textShadow: sombraTexto,
        }}
      >
        {qualitativo ? (
          // sem anos: o nome do marco atual, grande, no lugar do ano (troca enquanto a régua corre)
          <div style={{ height: 104, display: "flex", alignItems: "flex-end", opacity: 1 - correndo * 0.85, maxWidth: 2 * meioContador }}>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamMarco, lineHeight: 1, color: cor.claro, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
              <Datilo texto={(marcos[atual]?.texto ?? "").toUpperCase()} em={atual === 0 ? marcos[0].em : marcos[atual].em + corrida(marcos[atual - 1].ano, marcos[atual].ano) * 0.7} t={t} semente={700 + atual} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 104, lineHeight: 1, color: cor.claro, fontVariantNumeric: "tabular-nums", letterSpacing: "0.01em" }}>
              {anoInteiro}
            </div>
            <div style={{ ...rotulo, fontSize: 30, color: cor.claro, opacity: 0.9 * trocaMarco * (1 - correndo), marginTop: 10, height: 30 }}>
              {marcos[atual]?.texto ?? ""}
            </div>
          </>
        )}
      </div>

      {/* régua */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: QUADRO.h, opacity: entra, translate: `0 ${(1 - entra) * 40}px` }}>
        <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={0} x2={QUADRO.w} y1={baseY} y2={baseY} stroke={cor.claro} strokeOpacity={0.85} strokeWidth={3} />
          {anos.map((a) => {
            const x = centro + (a - ano) * PX_ANO;
            if (x < -20 || x > QUADRO.w + 20) return null;
            const marco = anosDosMarcos.has(a);
            const h = marco ? 60 : qualitativo ? (a % 3 === 0 ? 24 : 13) : a % 10 === 0 ? 38 : a % 5 === 0 ? 24 : 13;
            // perto das bordas a régua some
            const borda = limitar(Math.min(x, QUADRO.w - x) / 160);
            return (
              <line
                key={a}
                x1={x}
                x2={x}
                y1={baseY}
                y2={baseY - h}
                stroke={marco ? cor.vermelho : cor.claro}
                strokeWidth={marco ? 5 : a % 10 === 0 ? 3.5 : 2.5}
                opacity={(marco ? 1 : 0.8) * borda}
              />
            );
          })}
          {/* ponteiro fixo no centro */}
          <path d={`M ${centro - 14} ${baseY - 96} L ${centro + 14} ${baseY - 96} L ${centro} ${baseY - 74} Z`} fill={cor.vermelho} />
          <line x1={centro} x2={centro} y1={baseY - 76} y2={baseY + 6} stroke={cor.vermelho} strokeWidth={4} />
        </svg>
        {anos
          .filter((a) => !qualitativo && a % 10 === 0)
          .map((a) => {
            const x = centro + (a - ano) * PX_ANO;
            if (x < 40 || x > QUADRO.w - 40) return null;
            const borda = limitar(Math.min(x, QUADRO.w - x) / 160);
            return (
              <div
                key={`d-${a}`}
                style={{
                  position: "absolute",
                  left: x - 50,
                  width: 100,
                  top: baseY + 12,
                  textAlign: "center",
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 28,
                  color: cor.claro,
                  opacity: 0.85 * borda,
                }}
              >
                {a}
              </div>
            );
          })}
      </div>
    </div>
  );
};
