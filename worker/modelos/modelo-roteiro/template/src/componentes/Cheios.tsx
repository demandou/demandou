// Os papéis de viagem em tela cheia, na altura do peito: etiqueta de bagagem (número), carimbo no papel
// (destaque), placa de rua de azulejo (definição), verso de cartão-postal (frase) e formulário de
// desembarque (pergunta). Cada um entra subindo, ganha tinta palavra por palavra na fala e sai
// descendo, sem nunca cobrir o rosto.
import { indicesDoTrecho, limitar, misturarCor, prog, TextoALapis, temposDoTexto } from "../anim";
import { encaixar, encaixarNaCaixa, numeroBR } from "../medida";
import type { Definicao, Destaque, Frase, Numero, Palavra, Pergunta } from "../plano";
import { cor, display, sans, sombraPapel } from "../tema";
import { Carimbo } from "./Carimbo";
import { Selo } from "./Postal";

export const LARGURA_CHEIO = 960;
export const ALTURA_CHEIO = 470;

// `pronto`: quando o papel pode entrar (depois de um bloco de mapa, espera os cartões de baixo saírem)
type Base = { palavras: Palavra[]; t: number; topo: number; marca: { nome: string; area: string }; saidaFim: number; pronto: number };

// entrada subindo; saída descendo (como um papel guardado no bolso) enquanto a pessoa muda de lugar
const janela = (t: number, de: number, saidaFim: number) => {
  const inicio = de < 0.35 ? de - 0.3 : de;
  const entrada = prog(t, inicio, 0.5);
  const saida = prog(t, saidaFim - 0.42, 0.42, (x) => x * x);
  return { entrada, saida, opacidade: limitar(entrada * 1.6) * (1 - limitar((saida - 0.7) / 0.3)), mover: (1 - entrada) * 70 + saida * 620 };
};

const Moldura: React.FC<{ topo: number; j: ReturnType<typeof janela>; giro?: number; fundo?: boolean; children: React.ReactNode }> = ({ topo, j, giro = -0.5, fundo = true, children }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      top: topo,
      width: LARGURA_CHEIO,
      height: ALTURA_CHEIO,
      opacity: j.opacidade,
      translate: `0 ${j.mover}px`,
      rotate: `${giro}deg`,
      background: fundo ? cor.papel : undefined,
      borderRadius: fundo ? 20 : undefined,
      boxShadow: fundo ? sombraPapel(1) : undefined,
    }}
  >
    {fundo ? <div style={{ position: "absolute", inset: 12, borderRadius: 12, border: `2px solid ${cor.azulejo}`, opacity: 0.22 }} /> : null}
    {children}
  </div>
);

// ---------- número: etiqueta de bagagem com a escala do mapa ----------

const textoDoNumero = (m: Numero, valor: number) => {
  const casas = m.casas ?? 0;
  const n = numeroBR(valor, casas);
  const pre = m.prefixo ? (/[a-zA-Z$]$/.test(m.prefixo) ? `${m.prefixo} ` : m.prefixo) : "";
  const suf = m.sufixo ? (/^[%°]/.test(m.sufixo) ? m.sufixo : ` ${m.sufixo}`) : "";
  return `${pre}${n}${suf}`;
};

export const Bagagem: React.FC<Base & { m: Numero }> = ({ m, t, topo, saidaFim, pronto }) => {
  const j = janela(t, pronto, saidaFim);
  const p = prog(t, m.em - 0.05, 1.2);
  const pop = 1 + 0.05 * Math.sin(Math.PI * limitar((p - 0.85) / 0.15));
  const final = textoDoNumero(m, m.valor);
  const xNum = 170;
  const largNum = LARGURA_CHEIO - xNum - 50;
  const enc = encaixar(final, { largura: largNum, max: 200, min: 90, linhas: 1, fonte: { peso: 700 } });
  const rotEm = m.rotuloEm ?? m.em + 0.45;
  const rot = encaixar(m.rotulo, { largura: largNum, max: 60, min: 34, linhas: 2, fonte: { italico: true, peso: 500 } });
  const a = prog(t, rotEm - 0.08, 0.4);
  const corNumero = misturarCor(cor.lapis, cor.azulejo, limitar(p * 4));
  const yEscala = ALTURA_CHEIO - 62;
  const x0 = xNum;
  const x1 = LARGURA_CHEIO - 56;
  const seg = 10;
  const quando = textoDoNumero(m, m.valor * p);
  return (
    <Moldura topo={topo} j={j} giro={-0.7} fundo={false}>
      <svg width={LARGURA_CHEIO} height={ALTURA_CHEIO} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 14px 22px rgba(60,44,20,0.24))" }}>
        {/* etiqueta de bagagem: ponta chanfrada com o furo e o cordão */}
        <path d={`M120 0 H${LARGURA_CHEIO - 24} Q${LARGURA_CHEIO} 0 ${LARGURA_CHEIO} 24 V${ALTURA_CHEIO - 24} Q${LARGURA_CHEIO} ${ALTURA_CHEIO} ${LARGURA_CHEIO - 24} ${ALTURA_CHEIO} H120 L0 ${ALTURA_CHEIO / 2 + 64} V${ALTURA_CHEIO / 2 - 64} Z`} fill={cor.papel} />
        <path d={`M120 14 H${LARGURA_CHEIO - 24} Q${LARGURA_CHEIO - 14} 14 ${LARGURA_CHEIO - 14} 24 V${ALTURA_CHEIO - 24} Q${LARGURA_CHEIO - 14} ${ALTURA_CHEIO - 14} ${LARGURA_CHEIO - 24} ${ALTURA_CHEIO - 14} H120 L18 ${ALTURA_CHEIO / 2 + 60} V${ALTURA_CHEIO / 2 - 60} Z`} fill="none" stroke={cor.azulejo} strokeOpacity={0.24} strokeWidth={2} />
        <circle cx={78} cy={ALTURA_CHEIO / 2} r={26} fill={cor.areia} stroke={cor.azulejo} strokeWidth={4} />
        <path d={`M78 ${ALTURA_CHEIO / 2 - 26} C 60 ${ALTURA_CHEIO / 2 - 110}, -30 ${ALTURA_CHEIO / 2 - 120}, -26 ${ALTURA_CHEIO / 2 - 40}`} fill="none" stroke={cor.azulejo} strokeWidth={6} strokeLinecap="round" />
        {/* a escala do mapa: o marcador anda enquanto o número conta */}
        {Array.from({ length: seg }, (_, i) => {
          const w = (x1 - x0) / seg;
          return <rect key={i} x={x0 + i * w} y={yEscala - 7} width={w} height={14} fill={i % 2 ? cor.papel : cor.azulejo} stroke={cor.azulejo} strokeWidth={3} />;
        })}
        {[0, 5, 10].map((k) => (
          <line key={k} x1={x0 + ((x1 - x0) * k) / 10} y1={yEscala - 20} x2={x0 + ((x1 - x0) * k) / 10} y2={yEscala + 20} stroke={cor.azulejo} strokeWidth={3} />
        ))}
        <g transform={`translate(${x0 + (x1 - x0) * p} ${yEscala - 6})`}>
          <path d="M0 0 C -5 -14, -22 -22, -22 -42 A 22 22 0 1 1 22 -42 C 22 -22, 5 -14, 0 0 Z" fill={cor.azulejo} stroke={cor.papel} strokeWidth={4} />
          <circle cx={0} cy={-42} r={7} fill={cor.papel} />
        </g>
      </svg>
      {m.ilustrativo ? (
        <div style={{ position: "absolute", right: 40, top: 30, padding: "2px 18px", borderRadius: 24, border: `3px dashed ${cor.lapis}`, fontFamily: sans, fontWeight: 600, fontSize: 28, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7C6F58" }}>ilustrativo</div>
      ) : null}
      <div style={{ position: "absolute", left: xNum, top: 28, width: largNum, height: enc.tamanho * 1.1, display: "flex", alignItems: "center", fontFamily: display, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.1, color: corNumero, fontVariantNumeric: "tabular-nums lining-nums", whiteSpace: "nowrap", scale: String(pop), transformOrigin: "left center" }}>
        {p >= 1 ? final : quando}
      </div>
      <div style={{ position: "absolute", left: xNum + 4, top: 28 + enc.tamanho * 1.1 + 6, width: largNum, fontFamily: display, fontStyle: "italic", fontWeight: 500, fontSize: rot.tamanho, lineHeight: 1.08, color: misturarCor(cor.lapis, cor.tinta, a), opacity: 0.45 + 0.55 * a, translate: `0 ${(1 - a) * 12}px` }}>
        {rot.linhas.map((l, k) => (
          <div key={k} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </Moldura>
  );
};

// ---------- destaque: o texto no papel e o carimbo que bate ----------

export const CartaoDestaque: React.FC<Base & { m: Destaque }> = ({ m, palavras, t, topo, saidaFim, pronto }) => {
  const j = janela(t, pronto, saidaFim);
  const alerta = m.nivel === "alerta";
  const tom = alerta ? cor.telha : cor.azulejo;
  const pad = 44;
  const topoTexto = 126;
  const alturaDetalhe = m.detalhe ? 78 : 0;
  const enc = encaixarNaCaixa(m.texto, { largura: LARGURA_CHEIO - 2 * pad, altura: ALTURA_CHEIO - topoTexto - 38 - alturaDetalhe, max: 124, min: 56, linhas: 3, fonte: { peso: 700 }, entrelinha: 1.02 });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, m.em);
  const det = m.detalhe ? encaixar(m.detalhe, { largura: LARGURA_CHEIO - 2 * pad, max: 46, min: 28, linhas: 1, fonte: { familia: "sans", peso: 600 } }) : null;
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, m.detalheEm ?? m.em + 0.8) : [];
  const batida = prog(t, m.em - 0.06, 0.2);
  return (
    <Moldura topo={topo} j={j} giro={0.4}>
      <div style={{ position: "absolute", left: pad, top: 34, fontFamily: sans, fontWeight: 600, fontSize: 34, letterSpacing: "0.16em", textTransform: "uppercase", color: misturarCor(cor.lapis, tom, batida) }}>{alerta ? "Atenção" : "Anote"}</div>
      <div style={{ position: "absolute", left: pad, top: 78, width: 150, height: 6, borderRadius: 3, background: misturarCor(cor.lapis, tom, batida), transformOrigin: "left", scale: `${0.3 + 0.7 * batida} 1` }} />
      <TextoALapis
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        tinta={alerta ? cor.telha : cor.tinta}
        lapis={cor.lapis}
        style={{ position: "absolute", left: pad, top: topoTexto, fontFamily: display, fontWeight: 700, fontSize: enc.tamanho, lineHeight: 1.02 }}
      />
      {det ? (
        <TextoALapis
          linhas={det.linhas}
          tempos={temposDet}
          t={t}
          tinta={cor.azulejo}
          lapis={cor.lapis}
          style={{ position: "absolute", left: pad, bottom: 28, fontFamily: sans, fontWeight: 600, fontSize: det.tamanho }}
        />
      ) : null}
      <Carimbo x={LARGURA_CHEIO - 112} y={50} r={100} em={m.em} t={t} topo={alerta ? "Atenção" : "Anote"} giro={-13} ondas={false} alerta={alerta} />
    </Moldura>
  );
};

// ---------- definição: placa de rua de azulejo + rota até o significado ----------

export const PlacaDefinicao: React.FC<Base & { m: Definicao }> = ({ m, palavras, t, topo, saidaFim, pronto }) => {
  const j = janela(t, pronto, saidaFim);
  const placa = { w: 820, h: 168 };
  const xPlaca = (LARGURA_CHEIO - placa.w) / 2;
  const e = encaixar(m.termo, { largura: placa.w - 120, max: 104, min: 46, linhas: 1, fonte: { peso: 700 } });
  const a = prog(t, m.em - 0.1, 0.4);
  const entradaPlaca = prog(t, Math.min(pronto, m.em - 0.2), 0.5);
  const yCartao = 262;
  const hCartao = ALTURA_CHEIO - yCartao - 6;
  const sig = encaixarNaCaixa(m.significado, { largura: LARGURA_CHEIO - 2 * 44 - 8, altura: hCartao - 44, max: 70, min: 38, linhas: 3, fonte: { peso: 500 }, entrelinha: 1.08 });
  const tempos = temposDoTexto(m.significado, palavras, m.de, m.ate, m.significadoEm);
  const rota = prog(t, m.significadoEm - 0.6, 0.55);
  const cartao = prog(t, m.significadoEm - 0.25, 0.45);
  const xRota = LARGURA_CHEIO / 2;
  const y0 = placa.h + 24;
  const y1 = yCartao - 6;
  return (
    <Moldura topo={topo} j={j} giro={0} fundo={false}>
      <svg width={LARGURA_CHEIO} height={ALTURA_CHEIO} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g style={{ filter: "drop-shadow(0 12px 18px rgba(60,44,20,0.26))" }} transform={`translate(0 ${(1 - entradaPlaca) * -40})`} opacity={limitar(entradaPlaca * 1.8)}>
          <rect x={xPlaca} y={0} width={placa.w} height={placa.h} rx={20} fill={cor.papel} />
          <rect x={xPlaca + 10} y={10} width={placa.w - 20} height={placa.h - 20} rx={13} fill="none" stroke={cor.azulejo} strokeWidth={9} />
          <rect x={xPlaca + 28} y={28} width={placa.w - 56} height={placa.h - 56} rx={6} fill="none" stroke={cor.azulejo} strokeWidth={2.5} strokeOpacity={0.5} />
          {[[xPlaca + 24, 22], [xPlaca + placa.w - 24, 22], [xPlaca + 24, placa.h - 22], [xPlaca + placa.w - 24, placa.h - 22]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={6} fill={cor.areiaTraco} />
              <path d={`M${cx - 3} ${cy - 3} L${cx + 3} ${cy + 3}`} stroke={cor.areia} strokeWidth={1.6} />
            </g>
          ))}
        </g>
        {/* a rota desce da placa até o significado */}
        <line x1={xRota} y1={y0} x2={xRota} y2={y1} stroke={cor.lapis} strokeWidth={4} strokeDasharray="1 11" strokeLinecap="round" opacity={0.85} />
        {rota > 0 ? <line x1={xRota} y1={y0} x2={xRota} y2={y0 + (y1 - y0) * rota} stroke={cor.azulejo} strokeWidth={8} strokeDasharray="0.1 16" strokeLinecap="round" /> : null}
        <circle cx={xRota} cy={y0} r={7} fill={cor.azulejo} opacity={a} />
      </svg>
      <div style={{ position: "absolute", left: xPlaca, top: 0, width: placa.w, height: placa.h, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontWeight: 700, fontSize: e.tamanho, color: misturarCor(cor.lapis, cor.azulejo, a), whiteSpace: "nowrap", opacity: limitar(entradaPlaca * 1.8), translate: `0 ${(1 - entradaPlaca) * -40 + (1 - a) * 8}px` }}>
        {e.linhas.join(" ")}
      </div>
      <div style={{ position: "absolute", left: 0, top: yCartao, width: LARGURA_CHEIO, height: hCartao, background: cor.papel, borderRadius: 20, boxShadow: sombraPapel(0.45 + 0.55 * cartao), outline: cartao < 0.98 ? `3px dashed rgba(178,163,137,${1 - cartao})` : undefined, outlineOffset: -3, translate: `0 ${-6 * Math.sin(Math.PI * cartao)}px` }}>
        <div style={{ position: "absolute", inset: 10, borderRadius: 12, border: `2px solid ${cor.azulejo}`, opacity: 0.22 * cartao }} />
        <TextoALapis
          linhas={sig.linhas}
          tempos={tempos}
          t={t}
          tinta={cor.tinta}
          lapis={cor.lapis}
          style={{ position: "absolute", left: 44, top: (hCartao - sig.linhas.length * sig.tamanho * 1.08) / 2, fontFamily: display, fontWeight: 500, fontSize: sig.tamanho, lineHeight: 1.08 }}
        />
      </div>
    </Moldura>
  );
};

// ---------- frase: verso de cartão-postal ----------

export const VersoPostal: React.FC<Base & { m: Frase }> = ({ m, palavras, t, topo, marca, saidaFim, pronto }) => {
  const j = janela(t, pronto, saidaFim);
  const pad = 46;
  const topoTexto = 132;
  const enc = encaixarNaCaixa(m.texto, { largura: LARGURA_CHEIO - 2 * pad - 4, altura: ALTURA_CHEIO - topoTexto - 44, max: 100, min: 44, linhas: 4, fonte: { italico: true, peso: 600 }, entrelinha: 1.06 });
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const risco = indicesDoTrecho(m.texto, m.risco);
  const riscoP = m.riscoEm !== undefined ? prog(t, m.riscoEm - 0.05, 0.4) : 0;
  const entrada = prog(t, inicio - 0.3, 0.5);
  return (
    <Moldura topo={topo} j={j} giro={0.6}>
      {/* linhas do endereço (a lápis), o selo e o carimbo do correio */}
      <svg width={LARGURA_CHEIO} height={ALTURA_CHEIO} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={pad} y1={104} x2={LARGURA_CHEIO - 270} y2={104} stroke={cor.areiaTraco} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
        {[0, 1].map((k) => (
          <line key={k} x1={pad} y1={ALTURA_CHEIO - 40 - k * 0} x2={LARGURA_CHEIO - pad} y2={ALTURA_CHEIO - 40} stroke="none" />
        ))}
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${LARGURA_CHEIO - 262 + k * 0} ${46 + k * 0} q 14 -10 28 0 t 28 0 t 28 0 t 28 0 t 28 0`} fill="none" stroke={cor.azulejo} strokeWidth={3.4} opacity={0.34} transform={`translate(0 ${k * 16 + 4})`} strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ position: "absolute", left: pad, top: 40, fontFamily: sans, fontWeight: 600, fontSize: 32, letterSpacing: "0.16em", textTransform: "uppercase", color: cor.azulejo, opacity: 0.5 + 0.5 * entrada }}>
        {[marca.nome, marca.area].filter(Boolean).join(" · ") || "Roteiro"}
      </div>
      <div style={{ position: "absolute", right: pad - 6, top: 26, rotate: "4deg", opacity: entrada }}>
        <Selo largura={78} />
      </div>
      <TextoALapis
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        tinta={cor.tinta}
        lapis={cor.lapis}
        destaque={destaque}
        corDestaque={cor.azulejo}
        estiloDestaque={{ fontWeight: 700 }}
        risco={risco}
        riscoP={riscoP}
        corRisco={cor.telha}
        style={{ position: "absolute", left: pad, top: topoTexto, fontFamily: display, fontStyle: "italic", fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.06 }}
      />
    </Moldura>
  );
};

// ---------- pergunta: formulário de desembarque ----------

const Caixinha: React.FC<{ a: number; tamanho: number }> = ({ a, tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" style={{ flex: "none" }}>
    <rect x={4} y={4} width={40} height={40} rx={9} fill={misturarCor(cor.papel, cor.azulejoVeu, a)} stroke={misturarCor(cor.lapis, cor.azulejo, a)} strokeWidth={4} strokeDasharray={a > 0.5 ? undefined : "7 6"} />
    <path d="M12 25 l9 9 l17 -20" fill="none" stroke={cor.azulejo} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - limitar((a - 0.4) / 0.6)} />
  </svg>
);

export const Formulario: React.FC<Base & { m: Pergunta }> = ({ m, palavras, t, topo, saidaFim, pronto }) => {
  const j = janela(t, pronto, saidaFim);
  const pad = 44;
  const opcoes = m.opcoes ?? [];
  const faixa = 56;
  const inicio = m.em ?? m.de;
  const linhaH = opcoes.length ? Math.min(70, 270 / opcoes.length) : 0;
  const alturaPergunta = ALTURA_CHEIO - faixa - 34 - (opcoes.length ? opcoes.length * linhaH + 22 : 8);
  const enc = encaixarNaCaixa(m.texto, { largura: LARGURA_CHEIO - 2 * pad - 4, altura: alturaPergunta, max: opcoes.length ? 72 : 108, min: opcoes.length ? 38 : 52, linhas: opcoes.length ? 2 : 4, fonte: { peso: 600 }, entrelinha: 1.05 });
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  const entrada = prog(t, inicio - 0.3, 0.5);
  return (
    <Moldura topo={topo} j={j} giro={-0.4}>
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_CHEIO, height: faixa, borderRadius: "20px 20px 0 0", background: cor.azulejo, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${pad}px` }}>
        <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 30, letterSpacing: "0.18em", textTransform: "uppercase", color: cor.papel }}>Desembarque</span>
        <svg width={150} height={30} viewBox="0 0 150 30">
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={i * 7} y={0} width={[2, 4, 2, 5, 3, 2, 4][i % 7]} height={30} fill={cor.papel} opacity={0.8} />
          ))}
        </svg>
      </div>
      <TextoALapis
        linhas={enc.linhas}
        tempos={tempos}
        t={t}
        tinta={cor.tinta}
        lapis={cor.lapis}
        rascunho={0.5 + 0.5 * entrada}
        style={{ position: "absolute", left: pad, top: faixa + 26, fontFamily: display, fontWeight: 600, fontSize: enc.tamanho, lineHeight: 1.05 }}
      />
      {opcoes.map((o, i) => {
        const a = prog(t, o.em - 0.08, 0.4);
        const e = encaixar(o.texto, { largura: LARGURA_CHEIO - 2 * pad - 96, max: 46, min: 26, linhas: 1, fonte: { familia: "sans", peso: 600 } });
        return (
          <div key={i} style={{ position: "absolute", left: pad, top: ALTURA_CHEIO - 20 - (opcoes.length - i) * linhaH, height: linhaH, display: "flex", alignItems: "center", gap: 22, opacity: 0.5 + 0.5 * a, translate: `${(1 - a) * -14}px 0` }}>
            <Caixinha a={a} tamanho={Math.min(52, linhaH - 14)} />
            <span style={{ fontFamily: sans, fontWeight: 600, fontSize: e.tamanho, color: misturarCor(cor.lapis, cor.tinta, a), whiteSpace: "nowrap" }}>{e.linhas.join(" ")}</span>
          </div>
        );
      })}
    </Moldura>
  );
};
