// Abertura (e o nome antigo, gancho): a pessoa em tela cheia; no peito, um cartão branco com o título,
// que se monta palavra por palavra, e o traçado do pulso correndo embaixo — cada palavra dita é um
// batimento. O trecho `destaque` sai na cor da marca; `alertaEm` faz um batimento vermelho e alto.
import { Linhas, temposDoTexto } from "../anim";
import { ANTES, type Presenca } from "../layout";
import { encaixar, LETREIRO, larguraTexto, trechoNoTexto } from "../medida";
import type { Abertura, Gancho as GanchoT, Palavra } from "../plano";
import { cor, letreiro, mostrador, sombraAlta, ZONAS } from "../tema";
import { Icone } from "./Icones";
import { Pulso } from "./Pulso";

export const CARTAO_PEITO = { x: 120, w: 840, pad: 44 };

export const Gancho: React.FC<{ m: GanchoT | Abertura; t: number; palavras: Palavra[]; fim: number; topo: number; pres: Presenca }> = ({
  m,
  t,
  palavras,
  fim,
  topo,
  pres,
}) => {
  const inicioTexto = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicioTexto), m.ate, inicioTexto + 0.1);
  const largura = CARTAO_PEITO.w - 2 * CARTAO_PEITO.pad;
  const enc = encaixar(m.texto, { largura, max: 92, min: 60, linhas: 3 });
  const alturaLinha = Math.round(enc.tamanho * 1.1);
  const destaque = trechoNoTexto(m.texto, m.destaque);
  const rotulo = m.rotulo?.trim();
  // letreiro comprido encolhe até 28 px para caber numa linha ao lado do coração
  const tamRotulo = rotulo ? Math.max(28, Math.min(32, Math.floor((32 * (largura - 50)) / Math.max(1, larguraTexto(rotulo, 32, LETREIRO))))) : 0;
  const alturaPulso = 150;
  const topoTexto = topo + CARTAO_PEITO.pad + (rotulo ? 36 + 24 : 0);
  const topoPulso = topoTexto + enc.linhas.length * alturaLinha + 16;
  // o cartão não passa do limite de baixo: o pulso encolhe se o texto ocupar mais
  const alturaPulsoFinal = Math.max(90, Math.min(alturaPulso, 1520 - 26 - topoPulso));
  const alturaCartao = topoPulso + alturaPulsoFinal + 26 - topo;
  if (pres.opacidade <= 0.001) return null;

  // o pulso: a caneta corre do começo até a saída; cada palavra é um batimento
  const inicio = Math.max(0, m.de - 0.05);
  const duracao = Math.max(0.5, fim - ANTES - inicio);
  const caneta = Math.min(1, Math.max(0, (t - inicio) / duracao));
  const batidas: { pos: number; alerta?: boolean; em: number }[] = [];
  for (const tw of tempos) {
    if (batidas.length && tw - batidas[batidas.length - 1].em < 0.2) continue;
    batidas.push({ em: tw, pos: Math.min(0.97, (tw + 0.04 - inicio) / duracao) });
  }
  if (m.alertaEm !== undefined && batidas.length) {
    const maisPerto = batidas.reduce((a, b) => (Math.abs(b.em - m.alertaEm!) < Math.abs(a.em - m.alertaEm!) ? b : a), batidas[0]);
    if (Math.abs(maisPerto.em - m.alertaEm) < 0.25) maisPerto.alerta = true;
    else batidas.push({ em: m.alertaEm, pos: Math.min(0.97, (m.alertaEm + 0.04 - inicio) / duracao), alerta: true });
  }
  // o coração do letreiro bate junto
  const ultima = [...batidas].reverse().find((b) => b.em + 0.04 <= t);
  const batida = ultima ? Math.max(0, 1 - (t - ultima.em - 0.04) / 0.22) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: pres.opacidade, translate: `${pres.dx}px ${pres.dy}px` }}>
      <div
        style={{
          position: "absolute",
          left: CARTAO_PEITO.x,
          top: topo,
          width: CARTAO_PEITO.w,
          height: alturaCartao,
          borderRadius: 40,
          background: cor.cartao,
          boxShadow: sombraAlta,
        }}
      />
      {rotulo ? (
        <div style={{ position: "absolute", left: CARTAO_PEITO.x + CARTAO_PEITO.pad, top: topo + CARTAO_PEITO.pad, display: "flex", alignItems: "center", gap: 14 }}>
          <Icone nome="coracaoCheio" tamanho={36} cor={ZONAS[4].cor} style={{ scale: String(1 + 0.18 * batida) }} />
          <span style={{ ...letreiro, fontSize: tamRotulo, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{rotulo}</span>
        </div>
      ) : null}
      <Linhas
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        x={CARTAO_PEITO.x + CARTAO_PEITO.pad}
        y={topoTexto}
        largura={largura}
        alturaLinha={alturaLinha}
        estilo={{ fontFamily: mostrador, fontWeight: 700, fontSize: enc.tamanho, color: cor.tinta, letterSpacing: "-0.01em" }}
        esboco={cor.esboco}
        corDe={(i) => (destaque.has(i) ? ZONAS[1].texto : undefined)}
      />
      <Pulso
        x={CARTAO_PEITO.x + CARTAO_PEITO.pad}
        y={topoPulso}
        largura={largura}
        altura={alturaPulsoFinal}
        caneta={caneta}
        batidas={batidas.filter((b) => b.em <= t + 1)}
      />
    </div>
  );
};

