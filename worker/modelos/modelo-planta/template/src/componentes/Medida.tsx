import { formatar, limitar, preciso, prog, Traco } from "../anim";
import { desenharElevacao, desenharPlanta, TAMANHO_ELEVACAO, TAMANHO_PLANTA } from "../desenho/biblioteca";
import { Cota } from "../desenho/Cota";
import { lin } from "../desenho/geometria";
import type { Medida as TMedida } from "../plano";
import { cor, mono, ROTULO, rotuloMono, sans, traco } from "../tema";
import { Cartao } from "./Cartao";
import { NumeroCirculo } from "./Prancha";

const PESO = { forte: traco.forte, medio: traco.medio, fino: traco.fino };

// Uma medida em destaque: o número conta de 0 até o valor enquanto a cota cresce no detalhe ao lado
// (parede → objeto visto de cima; chão/teto → objeto visto de frente). Com `mover`, o objeto se afasta
// junto com a contagem — a cota mede de verdade o que está acontecendo.
export const Medida: React.FC<{ m: TMedida; t: number; fim: number; area: { x: number; y: number; w: number; h: number } }> = ({ m, t, fim, area }) => {
  const pad = 40;
  const interna = area.w - 2 * pad;
  const em = m.em ?? m.de + 0.45;
  const emFim = m.emFim ?? em + 1.3;
  const c = prog(t, em, Math.max(0.3, emFim - em), preciso);
  const numero = formatar(m.valor * c, m.casas ?? 0);
  const final = formatar(m.valor, m.casas ?? 0);
  const temCabecalho = !!(m.rotulo || m.numero);
  const alturaCab = temCabecalho ? 104 : 0;
  const alturaConteudo = area.h - alturaCab - 2 * pad;
  const temDetalhe = !!(m.desde || m.objeto);
  const larguraNumero = temDetalhe ? interna * 0.46 : interna;
  const tamNumero = Math.min(200, Math.floor(larguraNumero / ((final.length + m.unidade.length * 0.45 + 0.6) * 0.6)));
  const tamUnidade = Math.round(tamNumero * 0.4);
  const contando = c > 0 && c < 1;
  const pEntra = prog(t, m.de + 0.15, 0.6, preciso);

  const Numero = (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap", opacity: limitar(prog(t, m.de + 0.2, 0.4)) }}>
      <span
        style={{
          fontFamily: sans,
          fontWeight: 300,
          fontSize: tamNumero,
          lineHeight: 0.9,
          color: cor.grafite,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {numero}
      </span>
      <span style={{ fontFamily: sans, fontWeight: 400, fontSize: tamUnidade, lineHeight: 1, color: cor.acento }}>{m.unidade}</span>
    </div>
  );

  // ---- detalhe desenhado ao lado do número ----
  const dw = interna - larguraNumero - 24;
  const dh = alturaConteudo;
  const detalhe = (() => {
    if (!temDetalhe) return null;
    const corObj = contando ? cor.acento : cor.grafite;
    if (!m.desde || m.desde === "parede") {
      // parede em cima (poché), objeto visto de cima logo abaixo, de costas para ela
      const faixa = m.desde ? 44 : 0;
      const vaoFinal = Math.min(130, dh * 0.36);
      const [ow, oh] = m.objeto ? TAMANHO_PLANTA[m.objeto] : [0, 0];
      const s = m.objeto ? Math.min((dw * 0.84) / ow, (dh - faixa - vaoFinal - 8) / oh) : 0;
      const w = ow * s;
      const h = oh * s;
      const vao = m.mover === false ? vaoFinal : vaoFinal * c;
      const x0 = (dw - w) / 2;
      const y0 = faixa + vao;
      const d = m.objeto ? desenharPlanta(m.objeto, w, h) : null;
      const xCota = x0 + Math.min(w * 0.18, 40);
      return (
        <svg width={dw} height={dh} style={{ display: "block", overflow: "visible" }}>
          {m.desde ? (
            <g>
              <rect x={0} y={0} width={dw * pEntra} height={faixa} fill={cor.grafite} />
              <text x={dw - 14} y={faixa / 2 + 2} textAnchor="end" dominantBaseline="middle" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.12em" fill={cor.papel} opacity={pEntra}>
                PAREDE
              </text>
            </g>
          ) : null}
          {d ? (
            <g transform={`translate(${x0} ${y0})`}>
              {d.fundo ? <path d={d.fundo} fill={cor.papel} opacity={limitar(pEntra * 2)} /> : null}
              {d.linhas.map((l, i) => (
                <Traco key={i} d={l.d} p={pEntra} cor={l.peso === "fino" ? cor.cinza : corObj} largura={PESO[l.peso]} />
              ))}
            </g>
          ) : null}
          {vao > 3 ? <Cota x1={xCota} y1={faixa} x2={xCota} y2={faixa + vao} cor={cor.acento} chamada={false} /> : null}
        </svg>
      );
    }
    // chão (embaixo) ou teto (em cima), objeto visto de frente a uma distância que cresce
    const desdeTeto = m.desde === "teto";
    const [ew, eh] = m.objeto ? TAMANHO_ELEVACAO[m.objeto] : [0, 0];
    const vaoFinal = dh * 0.46;
    const s = m.objeto ? Math.min((dw * 0.6) / ew, (dh - vaoFinal - 30) / eh) : 0;
    const w = ew * s;
    const h = eh * s;
    const vao = m.mover === false ? vaoFinal : vaoFinal * c;
    const yRef = desdeTeto ? 12 : dh - 12;
    const yTopo = desdeTeto ? yRef + vao : yRef - vao - h;
    const x0 = (dw - w) / 2 + 20;
    const d = m.objeto ? desenharElevacao(m.objeto, w, h) : null;
    const hachura: string[] = [];
    for (let x = 4; x < dw; x += 14) hachura.push(desdeTeto ? lin(x, yRef - 12, x + 12, yRef) : lin(x, yRef, x + 12, yRef + 12));
    return (
      <svg width={dw} height={dh} style={{ display: "block", overflow: "visible" }}>
        <Traco d={lin(0, yRef, dw, yRef)} p={pEntra} cor={cor.grafite} largura={traco.forte + 1} />
        <path d={hachura.join("")} stroke={cor.cinza} strokeWidth={traco.fino} opacity={pEntra} />
        <text x={dw} y={desdeTeto ? yRef + 38 : yRef - 16} textAnchor="end" fontFamily={mono} fontWeight={500} fontSize={ROTULO} letterSpacing="0.1em" fill={cor.cinza} opacity={pEntra}>
          {desdeTeto ? "TETO" : "CHÃO"}
        </text>
        {d ? (
          <g transform={`translate(${x0} ${yTopo})`}>
            {m.objeto === "pendente" && desdeTeto ? <Traco d={lin(w / 2, yRef - yTopo, w / 2, 0)} p={pEntra} cor={cor.grafite} largura={traco.fino} /> : null}
            {d.fundo ? <path d={d.fundo} fill={cor.papel} opacity={limitar(pEntra * 2)} /> : null}
            {d.linhas.map((l, i) => (
              <Traco key={i} d={l.d} p={pEntra} cor={l.peso === "fino" ? cor.cinza : contando ? cor.acento : cor.grafite} largura={PESO[l.peso]} />
            ))}
          </g>
        ) : null}
        {vao > 3 ? (
          <Cota x1={x0 - 30} y1={yRef} x2={x0 - 30} y2={desdeTeto ? yRef + vao : yRef - vao} cor={cor.acento} chamada={false} />
        ) : null}
      </svg>
    );
  })();

  return (
    <Cartao t={t} de={m.de} fim={fim} x={area.x} y={area.y} w={area.w} h={area.h}>
      <div style={{ position: "absolute", left: pad, top: pad, width: interna, height: area.h - 2 * pad }}>
        {temCabecalho ? (
          <div style={{ height: alturaCab }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {m.numero ? <NumeroCirculo n={m.numero} p={prog(t, m.de + 0.1, 0.5, preciso)} tamanho={64} /> : null}
              {m.rotulo ? <div style={{ ...rotuloMono, color: cor.grafite, opacity: prog(t, m.de + 0.2, 0.4) }}>{m.rotulo}</div> : null}
            </div>
            <svg width={interna} height={20} style={{ display: "block", marginTop: 12 }}>
              <Traco d={lin(0, 8, interna, 8)} p={prog(t, m.de + 0.25, 0.7, preciso)} cor={cor.grafite} largura={traco.fino} />
            </svg>
          </div>
        ) : null}
        {temDetalhe ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: alturaConteudo }}>
            <div style={{ width: larguraNumero }}>{Numero}</div>
            {detalhe}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 30, height: alturaConteudo }}>
            {Numero}
            <svg width={interna} height={40} style={{ display: "block", overflow: "visible" }}>
              <Cota x1={0} y1={26} x2={interna} y2={26} p={c} cor={cor.acento} />
            </svg>
          </div>
        )}
      </div>
    </Cartao>
  );
};
