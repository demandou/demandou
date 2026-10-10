// Blocos de quadro cheio na chapa-cartão (filme escuro com borda de luz fria, na altura do peito):
// número (mostrador que se completa e o valor contando), destaque (a tensão que pulsa, ou a régua
// ciano embaixo da palavra-chave), definição (o termo, a cota que o mede e o significado) e
// pergunta (o "?" num anel ciano e as opções como etiquetas de filme).
import { casasDe, formatarNumero, Linhas, prog, temposDoTexto } from "../anim";
import { PontoDeTensao } from "../esqueleto/Cena";
import { diagramar, medir } from "../medidas";
import type { Definicao, Destaque, Numero, Palavra, Pergunta } from "../plano";
import { apoio as estiloApoio, cor, LIMITE_APP, marcacao, sans, titulo as estiloTitulo } from "../tema";
import { Cartao, CARTAO } from "./Cartao";

const P = CARTAO.padding;
// limite do texto dentro do cartão (no quadro: x 900, longe da coluna de botões)
const DIREITA = 900 - CARTAO.x;

// o cartão nunca passa da interface do app: se não couber abaixo do queixo, sobe
export const topoDoCartao = (topo: number, altura: number) => Math.max(200, Math.min(topo, LIMITE_APP - 12 - altura));

const Luz: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={`luz-${id}`} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation={3} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

// ---------- número ----------

export const CartaoNumero: React.FC<{ m: Numero; t: number; topo: number; fim: number }> = ({ m, t, topo, fim }) => {
  const altura = 340;
  const R = 112;
  const cx = P + R + 8;
  const cy = (altura - 2 * CARTAO.borda) / 2;
  const x0 = cx + R + 48;
  const largura = DIREITA - x0;
  const casas = m.casas ?? casasDe(m.valor);
  const conta = prog(t, m.em, 1.1, (x) => 1 - (1 - x) ** 3);
  const valor = formatarNumero(m.valor * conta, casas);
  const final = formatarNumero(m.valor, casas);
  const pre = m.prefixo ?? "";
  const suf = m.sufixo ?? "";
  // o maior corpo em que prefixo + número + sufixo cabem na coluna
  let tam = 156;
  const larguraEm = (k: number) => (pre ? medir(pre, k * 0.46, "sans600") + k * 0.12 : 0) + medir(final, k, "sans700") + (suf ? k * 0.12 + medir(suf, k * 0.46, "sans600") : 0);
  while (tam > 84 && larguraEm(tam) > largura) tam -= 4;
  const rot = diagramar(m.rotulo.toUpperCase(), largura, 36, 32, 2, "sans700");
  const rotEm = m.rotuloEm ?? m.em;
  const aceso = prog(t, rotEm - 0.1, 0.35);
  const ehPorcento = suf.trim().startsWith("%");
  const arco = ehPorcento ? Math.min(1, Math.max(0, m.valor / 100)) * conta : conta;
  const r = R - 6;
  const comp = 2 * Math.PI * r;
  const id = `num-${m.de}`;
  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      <svg width={DIREITA} height={altura} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Luz id={id} />
        <circle cx={cx} cy={cy} r={R} fill="rgba(3,8,13,0.55)" stroke={cor.esbocoTraco} strokeWidth={3} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = ((i * 15 - 90) * Math.PI) / 180;
          const r0 = i % 6 === 0 ? R - 24 : R - 15;
          const passou = conta > 0 && i / 24 <= arco + 0.001;
          return (
            <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * (R - 7)} y2={cy + Math.sin(a) * (R - 7)} stroke={passou ? cor.ciano : cor.osso} strokeOpacity={passou ? 0.95 : 0.3} strokeWidth={i % 6 === 0 ? 3.5 : 2} strokeLinecap="round" />
          );
        })}
        {arco > 0.002 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={cor.ciano} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${(comp * arco).toFixed(1)} ${comp.toFixed(1)}`} transform={`rotate(-90 ${cx} ${cy})`} filter={`url(#luz-${id})`} />
        ) : null}
        <circle cx={cx} cy={cy} r={8} fill={conta > 0 ? cor.ciano : cor.esbocoTraco} />
        {/* o ponteiro acompanha a contagem */}
        <line x1={cx} y1={cy} x2={cx + Math.cos((arco * 360 - 90) * (Math.PI / 180)) * (R - 34)} y2={cy + Math.sin((arco * 360 - 90) * (Math.PI / 180)) * (R - 34)} stroke={conta > 0 ? cor.osso : cor.esbocoTraco} strokeWidth={5} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: x0, top: 0, width: largura, height: altura - 2 * CARTAO.borda, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
        <div style={{ ...marcacao, fontSize: rot.tamanho, color: cor.ciano, opacity: 0.25 + 0.75 * aceso, lineHeight: 1.12 }}>
          {rot.linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: tam * 0.12, opacity: conta > 0 ? 1 : 0.2, whiteSpace: "nowrap" }}>
          {pre ? <span style={{ fontFamily: sans, fontWeight: 600, fontSize: tam * 0.46, color: cor.textoSuave }}>{pre}</span> : null}
          <span style={{ ...estiloTitulo, fontSize: tam, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{conta > 0 ? valor : final}</span>
          {suf ? <span style={{ fontFamily: sans, fontWeight: 600, fontSize: tam * 0.46, color: cor.textoSuave }}>{suf}</span> : null}
        </div>
        {m.ilustrativo ? <div style={{ ...marcacao, fontSize: 30, color: cor.textoSuave }}>Ilustrativo</div> : null}
      </div>
    </Cartao>
  );
};

// ---------- destaque ----------

export const CartaoDestaque: React.FC<{ m: Destaque; t: number; topo: number; fim: number; palavras: Palavra[] }> = ({ m, t, topo, fim, palavras }) => {
  const alerta = m.nivel === "alerta";
  const marca = alerta ? 96 : 0;
  const largura = DIREITA - P - marca;
  const d = diagramar(m.texto, largura, 104, 68, 3, "sans700");
  const det = m.detalhe ? diagramar(m.detalhe, largura, 48, 44, 2, "sans500") : null;
  const tempos = temposDoTexto(m.texto, palavras, m.em - 0.3, fim, m.em - 0.05);
  const tDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.detalheEm ?? m.em, fim, (m.detalheEm ?? tempos[tempos.length - 1] + 0.2) - 0.05) : [];
  const altTexto = d.linhas.length * d.tamanho * 1.04;
  const cota = alerta ? 0 : 44;
  const altDet = det ? 18 + det.linhas.length * det.tamanho * 1.16 : 0;
  const altura = Math.round(P * 2 + altTexto + cota + altDet + 4);
  const larguraTexto = Math.max(...d.linhas.map((l) => medir(l, d.tamanho, "sans700")));
  const fimFala = tempos[tempos.length - 1] ?? m.em;
  const traco = prog(t, fimFala + 0.05, 0.5);
  const id = `dest-${m.de}`;
  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      {alerta ? (
        <svg width={marca + P} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <Luz id={id} />
          <PontoDeTensao c={{ x: P + 34, y: P + d.tamanho * 0.55 }} t={t} em={m.em} raio={15} id={id} />
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: P + marca, top: P, width: largura }}>
        <Linhas linhas={d.linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: d.tamanho, color: alerta ? cor.tensao : cor.texto }} />
        {!alerta ? (
          // a régua de medida embaixo da palavra-chave: ├────┤
          <svg width={larguraTexto + 20} height={cota} style={{ display: "block", marginTop: 6, overflow: "visible" }}>
            <Luz id={id} />
            <g opacity={traco > 0 ? 1 : 0.4} stroke={traco > 0 ? cor.ciano : cor.esbocoTraco} strokeWidth={4} strokeLinecap="round">
              <line x1={2} y1={10} x2={2} y2={34} />
              <line x1={2} y1={22} x2={2 + larguraTexto * Math.max(traco, 0)} y2={22} filter={traco > 0 ? `url(#luz-${id})` : undefined} />
              {traco >= 1 ? <line x1={larguraTexto + 2} y1={10} x2={larguraTexto + 2} y2={34} /> : null}
            </g>
          </svg>
        ) : null}
        {det ? <Linhas linhas={det.linhas} tempos={tDet} t={t} fantasma={0.14} style={{ ...estiloApoio, fontSize: det.tamanho, marginTop: 18 }} /> : null}
      </div>
    </Cartao>
  );
};

// ---------- definição ----------

export const CartaoDefinicao: React.FC<{ m: Definicao; t: number; topo: number; fim: number; palavras: Palavra[] }> = ({ m, t, topo, fim, palavras }) => {
  const largura = DIREITA - P;
  const termo = diagramar(m.termo, largura, 100, 66, 2, "sans700");
  const igual = 58;
  const sig = diagramar(m.significado, largura - igual, 66, 46, 3, "sans600");
  const tTermo = temposDoTexto(m.termo, palavras, m.em - 0.3, m.significadoEm, m.em - 0.05);
  const tSig = temposDoTexto(m.significado, palavras, m.significadoEm - 0.3, fim, m.significadoEm - 0.05);
  const altTermo = termo.linhas.length * termo.tamanho * 1.04;
  const altSig = sig.linhas.length * sig.tamanho * 1.1;
  const altura = Math.round(P * 2 + altTermo + 50 + altSig + 6);
  const larguraTermo = Math.max(...termo.linhas.map((l) => medir(l, termo.tamanho, "sans700")));
  const cota = prog(t, (tTermo[tTermo.length - 1] ?? m.em) + 0.1, 0.55);
  const igualAceso = prog(t, m.significadoEm - 0.1, 0.3);
  const id = `def-${m.de}`;
  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      <div style={{ position: "absolute", left: P, top: P, width: largura }}>
        <Linhas linhas={termo.linhas} tempos={tTermo} t={t} style={{ ...estiloTitulo, fontSize: termo.tamanho }} />
        {/* a cota: mede o termo de ponta a ponta */}
        <svg width={larguraTermo + 10} height={40} style={{ display: "block", marginTop: 4, overflow: "visible" }}>
          <Luz id={id} />
          <g stroke={cota > 0 ? cor.ciano : cor.esbocoTraco} strokeWidth={3.5} strokeLinecap="round" fill="none">
            <line x1={2} y1={8} x2={2} y2={32} />
            <line x1={larguraTermo + 2} y1={8} x2={larguraTermo + 2} y2={32} opacity={cota >= 1 ? 1 : 0.5} />
            <line x1={2 + (larguraTermo / 2) * (1 - cota)} y1={20} x2={2 + larguraTermo / 2 + (larguraTermo / 2) * cota} y2={20} filter={cota > 0 ? `url(#luz-${id})` : undefined} />
          </g>
        </svg>
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 8 }}>
          <div style={{ ...marcacao, width: igual, fontSize: sig.tamanho, lineHeight: 1.1, color: igualAceso > 0 ? cor.ciano : cor.esboco, letterSpacing: 0 }}>=</div>
          <Linhas linhas={sig.linhas} tempos={tSig} t={t} style={{ ...estiloTitulo, fontWeight: 600, fontSize: sig.tamanho, lineHeight: 1.1, color: cor.texto }} />
        </div>
      </div>
    </Cartao>
  );
};

// ---------- pergunta ----------

const TAM_OPCAO = 44;

export const CartaoPergunta: React.FC<{ m: Pergunta; t: number; topo: number; fim: number; palavras: Palavra[] }> = ({ m, t, topo, fim, palavras }) => {
  const anel = 84;
  const largura = DIREITA - P - anel - 26;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const primeiraOpcao = opcoes[0]?.em ?? fim;
  const d = diagramar(m.texto, largura, 84, 60, 3, "sans700");
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, inicio - 0.3, primeiraOpcao, inicio - 0.05);
  const altTexto = d.linhas.length * d.tamanho * 1.04;
  // as opções em linhas que cabem na largura do cartão
  const larguraUtil = DIREITA - P;
  const chips = opcoes.map((o) => {
    const linhas = diagramar(o.texto, larguraUtil - 90, TAM_OPCAO, 40, 2, "sans600");
    return { ...o, linhas, w: Math.max(...linhas.linhas.map((l) => medir(l, linhas.tamanho, "sans600"))) + 86, h: linhas.linhas.length * linhas.tamanho * 1.12 + 28 };
  });
  const fileiras: (typeof chips)[] = [];
  for (const c of chips) {
    const f = fileiras[fileiras.length - 1];
    if (f && f.reduce((a, x) => a + x.w + 16, 0) + c.w <= larguraUtil) f.push(c);
    else fileiras.push([c]);
  }
  const altChips = fileiras.reduce((a, f) => a + Math.max(...f.map((c) => c.h)) + 14, 0);
  const altura = Math.round(P * 2 + Math.max(anel, altTexto) + (chips.length ? 26 + altChips - 14 : 0));
  const anelP = prog(t, inicio, 0.5);
  let y = P + Math.max(anel, altTexto) + 26;
  return (
    <Cartao t={t} de={m.de} fim={fim} topo={topoDoCartao(topo, altura)} altura={altura}>
      <svg width={anel + 10} height={anel + 10} style={{ position: "absolute", left: P - 4, top: P - 4 + Math.max(0, (Math.min(altTexto, d.tamanho * 1.04) - anel) / 2), overflow: "visible" }}>
        <circle cx={anel / 2 + 5} cy={anel / 2 + 5} r={anel / 2 - 2} fill="rgba(3,8,13,0.5)" stroke={cor.esbocoTraco} strokeWidth={3} />
        <circle cx={anel / 2 + 5} cy={anel / 2 + 5} r={anel / 2 - 2} fill="none" stroke={cor.ciano} strokeWidth={4} pathLength={1} strokeDasharray={`${anelP} 1`} transform={`rotate(-90 ${anel / 2 + 5} ${anel / 2 + 5})`} />
        <text x={anel / 2 + 5} y={anel / 2 + 5 + 19} textAnchor="middle" fill={anelP > 0 ? cor.ciano : cor.esboco} style={{ ...marcacao, fontSize: 54, fontWeight: 700, letterSpacing: 0 }}>
          ?
        </text>
      </svg>
      <div style={{ position: "absolute", left: P + anel + 26, top: P, width: largura }}>
        <Linhas linhas={d.linhas} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: d.tamanho }} />
      </div>
      {fileiras.map((f, k) => {
        const h = Math.max(...f.map((c) => c.h));
        const topoFileira = y;
        y += h + 14;
        let x = P;
        return f.map((c, j) => {
          const aceso = prog(t, c.em - 0.05, 0.35);
          const left = x;
          x += c.w + 16;
          return (
            <div
              key={`${k}-${j}`}
              style={{
                position: "absolute",
                left,
                top: topoFileira,
                width: c.w,
                height: h,
                borderRadius: 8,
                background: "rgba(3,8,13,0.7)",
                border: `2px ${aceso > 0 ? "solid" : "dashed"} ${aceso > 0 ? cor.ciano : cor.esbocoTraco}`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 20px",
                boxSizing: "border-box",
                translate: `0 ${((1 - aceso) * 10).toFixed(1)}px`,
              }}
            >
              <div style={{ width: 26, height: 26, flex: "none", borderRadius: 4, border: `2.5px solid ${aceso > 0 ? cor.ciano : cor.esbocoTraco}`, background: aceso > 0.5 ? cor.ciano : "transparent" }} />
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: c.linhas.tamanho, lineHeight: 1.12, color: cor.texto, opacity: 0.25 + 0.75 * aceso }}>
                {c.linhas.linhas.map((l, i) => (
                  <div key={i} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          );
        });
      })}
    </Cartao>
  );
};

