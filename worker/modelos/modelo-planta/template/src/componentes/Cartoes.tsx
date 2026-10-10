// Os blocos universais que vivem num cartão de papel na altura do peito (pessoa em tela cheia):
// abertura, frase, pergunta, destaque e número. Todos seguem o carimbo da prancha: o cartão desenrola
// de cima para baixo, a borda se desenha, marcas de corte nos cantos; texto em Sora, rótulos em mono.
import { limitar, Palavras, preciso, prog, temposDoTexto, Traco } from "../anim";
import { Cota } from "../desenho/Cota";
import { lin, misturarCor } from "../desenho/geometria";
import type { AberturaBloco, DestaqueBloco, FraseBloco, NumeroBloco, Palavra, Pergunta } from "../plano";
import { cor, mono, ROTULO, rotuloMono, sans, traco } from "../tema";
import { encaixar, juntarTrecho, larguraTexto, numeroBR } from "../texto";
import { Cartao } from "./Cartao";
import { NumeroCirculo } from "./Prancha";

// Onde o cartão pode ficar: começa em `y` (abaixo do queixo); se for alto, sobe até `topoMin`;
// a base nunca passa de BASE_CARTAO (acima da legenda e da interface do app).
export type AreaCartao = { x: number; y: number; w: number; topoMin: number; base?: number };
export const BASE_CARTAO = 1400;
export const baseDe = (area: AreaCartao) => area.base ?? BASE_CARTAO;
export const colocar = (area: AreaCartao, h: number) => Math.max(area.topoMin, Math.min(area.y, baseDe(area) - h));
export const alturaMax = (area: AreaCartao) => baseDe(area) - area.topoMin;

// No começo do vídeo o cartão já está aberto no primeiro quadro (a capa do Reels não fica vazia)
// e as palavras ditas logo no começo já aparecem.
const capa = (de: number) => (de < 0.3 ? de - 0.5 : de);
const temposCapa = (tempos: number[], de: number) => (de < 0.3 ? tempos.map((x) => (x < 0.4 ? x - 0.5 : x)) : tempos);

// ---------- abertura ----------
export const CartaoAbertura: React.FC<{ m: AberturaBloco; palavras: Palavra[]; t: number; fim: number; area: AreaCartao }> = ({ m, palavras, t, fim, area }) => {
  const pad = 44;
  const interna = area.w - 2 * pad;
  const inicio = Math.max(0, m.de);
  const abre = capa(inicio);
  const emTexto = m.em ?? inicio;
  const alturaRotulo = m.rotulo ? 58 : 0;
  const alturaCota = m.cota?.texto ? 92 : 70;
  let max = 104;
  let tx = encaixar(juntarTrecho(m.texto, m.destaque), { largura: interna * (m.destaque ? 0.96 : 1), max, min: 60, linhas: 3, fonte: { peso: 300, espacamento: -0.02 } });
  const altura = () => pad + alturaRotulo + tx.linhas.length * tx.tamanho * 1.08 + alturaCota + pad * 0.6;
  while (altura() > alturaMax(area) && max > 60) {
    max -= 4;
    tx = encaixar(juntarTrecho(m.texto, m.destaque), { largura: interna * (m.destaque ? 0.96 : 1), max, min: 60, linhas: 3, fonte: { peso: 300, espacamento: -0.02 } });
  }
  const h = altura();
  const y = colocar(area, h);
  const tempos = temposCapa(temposDoTexto(m.texto, palavras, emTexto, m.ate, emTexto + 0.1), inicio);
  const pCota = prog(t, emTexto + 0.35, 0.9, preciso);
  const efeito = m.cota?.em !== undefined ? prog(t, m.cota.em, 0.7, preciso) : 0;
  const recuo = m.cota?.efeito === "encolhe" ? 0.13 * efeito : m.cota?.efeito === "cresce" ? 0.13 * (1 - efeito) : 0;
  const yCota = pad + alturaRotulo + tx.linhas.length * tx.tamanho * 1.08 + (m.cota?.texto ? 52 : 36);
  return (
    <Cartao t={t} de={abre} fim={fim} x={area.x} y={y} w={area.w} h={h}>
      <div style={{ position: "absolute", left: pad, top: pad, width: interna }}>
        {m.rotulo ? (
          <>
            <div style={{ ...rotuloMono, color: cor.acento, opacity: prog(t, abre + 0.2, 0.4), whiteSpace: "nowrap", overflow: "hidden" }}>{m.rotulo}</div>
            <svg width={interna} height={30} style={{ display: "block" }}>
              <Traco d={lin(0, 18, interna, 18)} p={prog(t, abre + 0.25, 0.7, preciso)} cor={cor.grafite} largura={traco.fino} />
            </svg>
          </>
        ) : null}
        <Palavras
          texto={m.texto}
          tempos={tempos}
          t={t}
          enfase={m.destaque}
          corEnfase={cor.acento}
          pesoEnfase={600}
          style={{ width: interna, fontFamily: sans, fontWeight: 300, fontSize: tx.tamanho, lineHeight: 1.08, color: cor.grafite, letterSpacing: "-0.02em" }}
        />
      </div>
      <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Cota x1={pad + interna * recuo} y1={yCota} x2={pad + interna * (1 - recuo)} y2={yCota} p={pCota} cor={efeito > 0 ? cor.acento : cor.grafite} texto={m.cota?.texto} tamanhoTexto={28} />
      </svg>
    </Cartao>
  );
};

// ---------- frase ----------
export const CartaoFrase: React.FC<{ m: FraseBloco; palavras: Palavra[]; t: number; fim: number; area: AreaCartao }> = ({ m, palavras, t, fim, area }) => {
  const pad = 44;
  const interna = area.w - 2 * pad;
  const inicio = Math.max(0, m.de);
  const abre = capa(inicio);
  const emTexto = m.em ?? inicio;
  let max = 88;
  const medir = () => encaixar(juntarTrecho(m.texto, m.destaque), { largura: interna * 0.96, max, min: 52, linhas: 4, fonte: { peso: 400, espacamento: -0.015 } });
  let tx = medir();
  const altura = () => pad + tx.linhas.length * tx.tamanho * 1.12 + 46 + pad * 0.7;
  while (altura() > alturaMax(area) && max > 52) {
    max -= 4;
    tx = medir();
  }
  const h = altura();
  const y = colocar(area, h);
  const tempos = temposCapa(temposDoTexto(m.texto, palavras, emTexto, m.ate, emTexto + 0.1), inicio);
  const yRegua = pad + tx.linhas.length * tx.tamanho * 1.12 + 26;
  const ultimo = tempos[tempos.length - 1] ?? inicio;
  return (
    <Cartao t={t} de={abre} fim={fim} x={area.x} y={y} w={area.w} h={h}>
      <div style={{ position: "absolute", left: pad, top: pad, width: interna }}>
        <Palavras
          texto={m.texto}
          tempos={tempos}
          t={t}
          enfase={m.destaque}
          corEnfase={cor.acento}
          pesoEnfase={600}
          risco={m.risco ? { trecho: m.risco, em: m.riscoEm ?? ultimo + 0.3, cor: cor.acento, corDepois: cor.cinza } : undefined}
          style={{ width: interna, fontFamily: sans, fontWeight: 400, fontSize: tx.tamanho, lineHeight: 1.12, color: cor.grafite, letterSpacing: "-0.015em" }}
        />
      </div>
      <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <Traco d={lin(pad, yRegua, pad + interna * 0.4, yRegua)} p={prog(t, emTexto + 0.3, 0.8, preciso)} cor={cor.grafite} largura={traco.fino} />
        <Traco d={lin(pad + interna * 0.4 + 14, yRegua, pad + interna * 0.4 + 46, yRegua)} p={prog(t, emTexto + 0.9, 0.3)} cor={cor.acento} largura={traco.medio} />
      </svg>
    </Cartao>
  );
};

// ---------- pergunta ----------
export const CartaoPergunta: React.FC<{ m: Pergunta; palavras: Palavra[]; t: number; fim: number; area: AreaCartao }> = ({ m, palavras, t, fim, area }) => {
  const pad = 40;
  const interna = area.w - 2 * pad;
  const circulo = 88;
  const larguraTexto0 = interna - circulo - 30;
  const inicio = Math.max(0, m.de);
  const abre = capa(inicio);
  const emTexto = m.em ?? inicio;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  // etiquetas das opções: o mesmo corpo para todas, empacotadas em fileiras
  const empacotar = (tam: number) => {
    const fileiras: { texto: string; w: number; i: number }[][] = [[]];
    let usado = 0;
    opcoes.forEach((o, i) => {
      const w = Math.min(interna, larguraTexto(o.texto, tam, { peso: 400 }) + 52 + 6);
      if (usado > 0 && usado + 18 + w > interna) {
        fileiras.push([]);
        usado = 0;
      }
      fileiras[fileiras.length - 1].push({ texto: o.texto, w, i });
      usado += (usado > 0 ? 18 : 0) + w;
    });
    return fileiras.filter((f) => f.length);
  };
  let max = 72;
  let tamOp = 44;
  let tx = encaixar(m.texto, { largura: larguraTexto0, max, min: 48, linhas: 3, fonte: { peso: 400 } });
  let fileiras = empacotar(tamOp);
  const alturaEtiqueta = () => tamOp * 1.15 + 26;
  const altura = () => pad + Math.max(circulo, tx.linhas.length * tx.tamanho * 1.1) + (opcoes.length ? 30 + fileiras.length * (alturaEtiqueta() + 16) - 16 : 0) + pad;
  while (altura() > alturaMax(area) && (max > 48 || tamOp > 36)) {
    max = Math.max(48, max - 4);
    tamOp = Math.max(36, tamOp - 2);
    tx = encaixar(m.texto, { largura: larguraTexto0, max, min: 48, linhas: 3, fonte: { peso: 400 } });
    fileiras = empacotar(tamOp);
  }
  const h = altura();
  const y = colocar(area, h);
  const tempos = temposCapa(temposDoTexto(m.texto, palavras, emTexto, m.ate, emTexto + 0.1), inicio);
  const yOpcoes = pad + Math.max(circulo, tx.linhas.length * tx.tamanho * 1.1) + 30;
  const ativa = opcoes.reduce((a, o, i) => (t >= o.em - 0.05 ? i : a), -1);
  return (
    <Cartao t={t} de={abre} fim={fim} x={area.x} y={y} w={area.w} h={h}>
      <div style={{ position: "absolute", left: pad, top: pad }}>
        <NumeroCirculo n="?" p={prog(t, abre + 0.15, 0.6, preciso)} tamanho={circulo} />
      </div>
      <div style={{ position: "absolute", left: pad + circulo + 30, top: pad + Math.max(0, (circulo - tx.linhas.length * tx.tamanho * 1.1) / 2), width: larguraTexto0 }}>
        <Palavras texto={m.texto} tempos={tempos} t={t} style={{ width: larguraTexto0, fontFamily: sans, fontWeight: 400, fontSize: tx.tamanho, lineHeight: 1.1, color: cor.grafite }} />
      </div>
      {fileiras.map((f, r) => {
        let x = pad;
        return f.map((o) => {
          const p = prog(t, opcoes[o.i].em - 0.05, 0.45);
          const el = (
            <div
              key={o.i}
              style={{
                position: "absolute",
                left: x,
                top: yOpcoes + r * (alturaEtiqueta() + 16),
                width: o.w,
                height: alturaEtiqueta(),
                boxSizing: "border-box",
                border: `3px solid ${o.i === ativa ? cor.acento : cor.grafite}`,
                background: cor.papel,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: sans,
                fontWeight: 400,
                fontSize: tamOp,
                color: o.i === ativa ? cor.acento : cor.grafite,
                opacity: limitar(p * 1.6),
                translate: `0 ${(1 - p) * 22}px`,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {o.texto}
            </div>
          );
          x += o.w + 18;
          return el;
        });
      })}
    </Cartao>
  );
};

// ---------- destaque ----------
export const CartaoDestaque: React.FC<{ m: DestaqueBloco; palavras: Palavra[]; t: number; fim: number; area: AreaCartao }> = ({ m, palavras, t, fim, area }) => {
  const pad = 44;
  const interna = area.w - 2 * pad;
  const alerta = m.nivel === "alerta";
  const reservaX = alerta ? 96 : 0;
  const inicio = Math.max(0, m.de);
  const abre = capa(inicio);
  let max = 120;
  const medir = () => encaixar(m.texto, { largura: interna - reservaX, max, min: 64, linhas: 2, fonte: { peso: 400, espacamento: -0.02 } });
  let tx = medir();
  let dt = m.detalhe ? encaixar(m.detalhe, { largura: interna, max: 46, min: 36, linhas: 2, fonte: { peso: 300 } }) : null;
  const altura = () => pad + tx.linhas.length * tx.tamanho * 1.06 + (alerta ? 24 : 62) + (dt ? 6 + dt.linhas.length * dt.tamanho * 1.2 : 0) + pad * 0.7;
  while (altura() > alturaMax(area) && max > 64) {
    max -= 6;
    tx = medir();
    dt = m.detalhe ? encaixar(m.detalhe, { largura: interna, max: 40, min: 34, linhas: 2, fonte: { peso: 300 } }) : null;
  }
  const h = altura();
  const y = colocar(area, h);
  const tempos = temposCapa(temposDoTexto(m.texto, palavras, m.em, m.ate, m.em), inicio);
  const larguraTx = Math.min(interna - reservaX, Math.max(...tx.linhas.map((l) => larguraTexto(l, tx.tamanho, { peso: 400, espacamento: -0.02 }))));
  const alturaTx = tx.linhas.length * tx.tamanho * 1.06;
  const pArea = prog(t, m.em + 0.05, 0.6, preciso);
  const pX = prog(t, m.em + 0.35, 0.45, preciso);
  const pCota = prog(t, m.em + 0.25, 0.8, preciso);
  const emDetalhe = m.detalheEm ?? (tempos[tempos.length - 1] ?? m.em) + 0.5;
  const pd = prog(t, emDetalhe, 0.45);
  const yDetalhe = pad + alturaTx + (alerta ? 24 : 62) + 6;
  // área hachurada atrás do texto (alerta)
  const ax = pad - 16;
  const ay = pad - 10;
  const aw = larguraTx + 32;
  const ah = alturaTx + 20;
  const hach: string[] = [];
  if (alerta) {
    for (let k = -ah; k < aw; k += 24) {
      const xa = Math.max(0, k);
      const xb = Math.min(aw, k + ah);
      if (xb > xa) hach.push(lin(ax + xa, ay + ah - (xa - k), ax + xb, ay + ah - (xb - k)));
    }
  }
  const cxX = pad + larguraTx + 30 + 30;
  const cyX = pad + Math.min(alturaTx, tx.tamanho * 1.06) / 2;
  return (
    <Cartao t={t} de={abre} fim={fim} x={area.x} y={y} w={area.w} h={h}>
      {alerta ? (
        <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g transform={`translate(${ax + aw / 2} ${ay + ah / 2}) scale(${pArea}) translate(${-(ax + aw / 2)} ${-(ay + ah / 2)})`} opacity={limitar(pArea * 2)}>
            <rect x={ax} y={ay} width={aw} height={ah} fill={cor.acentoVeu} stroke={cor.acento} strokeWidth={traco.fino} strokeDasharray="12 9" />
            <path d={hach.join("")} stroke={cor.acento} strokeWidth={traco.fino} opacity={0.25} />
          </g>
          <Traco d={lin(cxX - 22, cyX - 22, cxX + 22, cyX + 22)} p={pX} cor={cor.acento} largura={7} />
          <Traco d={lin(cxX + 22, cyX - 22, cxX - 22, cyX + 22)} p={limitar(pX * 1.4 - 0.4)} cor={cor.acento} largura={7} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: pad, top: pad, width: interna - reservaX }}>
        <Palavras
          texto={m.texto}
          tempos={tempos}
          t={t}
          style={{ width: interna - reservaX, fontFamily: sans, fontWeight: 400, fontSize: tx.tamanho, lineHeight: 1.06, letterSpacing: "-0.02em", color: alerta ? cor.acento : cor.grafite }}
        />
      </div>
      {!alerta ? (
        <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Cota x1={pad} y1={pad + alturaTx + 30} x2={pad + larguraTx} y2={pad + alturaTx + 30} p={pCota} cor={cor.acento} />
        </svg>
      ) : null}
      {dt ? (
        <div
          style={{
            position: "absolute",
            left: pad,
            top: yDetalhe,
            width: interna,
            opacity: pd,
            translate: `${(1 - pd) * -20}px 0`,
            fontFamily: sans,
            fontWeight: 300,
            fontSize: dt.tamanho,
            lineHeight: 1.2,
            color: cor.cinza,
          }}
        >
          {dt.linhas.map((l, k) => (
            <div key={k}>{l}</div>
          ))}
        </div>
      ) : null}
    </Cartao>
  );
};

// ---------- número ----------
export const CartaoNumero: React.FC<{ m: NumeroBloco; t: number; fim: number; area: AreaCartao }> = ({ m, t, fim, area }) => {
  const pad = 40;
  const interna = area.w - 2 * pad;
  const inicio = Math.max(0, m.de);
  const abre = capa(inicio);
  const casas = m.casas ?? (Math.abs(m.valor - Math.round(m.valor)) > 1e-9 ? 1 : 0);
  const final = numeroBR(m.valor, casas);
  const c = prog(t, m.em, 1.2, preciso);
  const atual = numeroBR(m.valor * c, casas);
  // o número ocupa a largura: prefixo e sufixo menores, em terracota
  const fator = 0.42;
  const largura = (tam: number) =>
    larguraTexto(final, tam, { peso: 300, espacamento: -0.03 }) * 1.04 +
    (m.prefixo ? larguraTexto(m.prefixo, tam * fator, { peso: 400 }) + 16 : 0) +
    (m.sufixo ? larguraTexto(m.sufixo, tam * fator, { peso: 400 }) + 16 : 0);
  let tam = 210;
  while (tam > 72 && largura(tam) > interna) tam -= 4;
  const rotulo = m.rotulo.toUpperCase();
  let tamRot = 30;
  while (tamRot > 28 && larguraTexto(rotulo, tamRot, { mono: true, espacamento: 0.12 }) > interna - (m.ilustrativo ? 230 : 0)) tamRot -= 1;
  const linhasRot = larguraTexto(rotulo, tamRot, { mono: true, espacamento: 0.12 }) > interna - (m.ilustrativo ? 230 : 0) ? 2 : 1;
  const alturaRot = linhasRot * tamRot * 1.2 + 30;
  let h = pad + alturaRot + tam * 0.92 + 30 + 40 + pad * 0.8;
  while (h > alturaMax(area) && tam > 72) {
    tam -= 8;
    h = pad + alturaRot + tam * 0.92 + 30 + 40 + pad * 0.8;
  }
  const y = colocar(area, h);
  const emRotulo = m.rotuloEm ?? inicio + 0.15;
  const pRot = prog(t, emRotulo, 0.4);
  // antes de ser dito, o contador já está lá, a lápis, em zero; passa a nanquim quando o número é dito
  const pNum = prog(t, abre + 0.2, 0.35);
  const tinta = prog(t, m.em - 0.1, 0.25);
  const yCota = pad + alturaRot + tam * 0.92 + 40;
  return (
    <Cartao t={t} de={abre} fim={fim} x={area.x} y={y} w={area.w} h={h}>
      <div style={{ position: "absolute", left: pad, top: pad, width: interna }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div style={{ ...rotuloMono, fontSize: tamRot, lineHeight: 1.2, color: cor.grafite, opacity: pRot, translate: `${(1 - pRot) * -16}px 0` }}>{rotulo}</div>
          {m.ilustrativo ? (
            <div style={{ ...rotuloMono, fontSize: ROTULO, color: cor.cinza, border: `2px solid ${cor.cinza}`, padding: "8px 12px", opacity: prog(t, abre + 0.4, 0.4), flexShrink: 0 }}>
              ILUSTRATIVO
            </div>
          ) : null}
        </div>
        <svg width={interna} height={18} style={{ display: "block", marginTop: 8 }}>
          <Traco d={lin(0, 8, interna, 8)} p={prog(t, abre + 0.25, 0.7, preciso)} cor={cor.grafite} largura={traco.fino} />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad + alturaRot,
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          whiteSpace: "nowrap",
          opacity: pNum,
        }}
      >
        {m.prefixo ? <span style={{ fontFamily: sans, fontWeight: 400, fontSize: tam * fator, color: misturarCor(cor.rascunho, cor.acento, tinta), lineHeight: 1 }}>{m.prefixo}</span> : null}
        <span style={{ fontFamily: sans, fontWeight: 300, fontSize: tam, lineHeight: 0.92, color: misturarCor(cor.rascunho, cor.grafite, tinta), letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{atual}</span>
        {m.sufixo ? <span style={{ fontFamily: sans, fontWeight: 400, fontSize: tam * fator, color: misturarCor(cor.rascunho, cor.acento, tinta), lineHeight: 1 }}>{m.sufixo}</span> : null}
      </div>
      <svg width={area.w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Cota x1={pad} y1={yCota} x2={pad + interna} y2={yCota} p={c} cor={cor.acento} />
      </svg>
    </Cartao>
  );
};
