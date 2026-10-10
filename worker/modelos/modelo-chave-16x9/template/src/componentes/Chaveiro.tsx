// O chaveiro: uma fileira de pregos na parede; cada opção é um chaveiro (argola, chave de latão e
// um chaveiro de couro com ícone) que nasce a lápis no prego e, quando é dito, cai no lugar e
// balança. O último dito fica verde; os anteriores ficam pretos.
import { useMemo } from "react";
import { balanco, Linhas, prog, temposDoTexto } from "../anim";
import { encaixar, SERIFA_TITULO } from "../medida";
import type { Item, Palavra, PainelChaveiro } from "../plano";
import { cor, grotesca, rotulo, serifa, titulo as estiloTitulo } from "../tema";
import { Chave } from "./Chave";
import { Icone } from "./Icones";

const PREGO_Y = 96;
// o que vai no couro quando não há ícone: a marca do plano (até 3 caracteres) ou o número do chaveiro
const marcaDe = (c: { marca?: string }, i: number) => (c.marca?.trim() ? c.marca.trim().slice(0, 3) : String(i + 1));
const ARGOLA_R = 26;
// o chaveiro fica um pouco à direita da argola; a chave sai por trás dele, à esquerda
const DESLOCAMENTO = 18;

export const Chaveiro: React.FC<{ m: Item; painel: PainelChaveiro; palavras: Palavra[]; t: number; largura: number; altura: number; numero: number; total: number }> = ({
  m,
  painel,
  palavras,
  t,
  largura,
  altura,
  numero,
  total,
}) => {
  const tempos = useMemo(() => temposDoTexto(m.titulo, palavras, m.de, m.ate, m.de + 0.1), [m.titulo, palavras, m.de, m.ate]);
  const chaves = painel.chaves.slice(0, 4);
  const n = chaves.length;
  const coluna = largura / n;
  // o título do painel e o "Item N de M" dividem a linha de cima: o título encolhe para caber
  const larguraItem = 230;
  const tituloFit = useMemo(() => encaixar(m.titulo, { largura: largura - larguraItem - 20, max: 60, min: 44, linhas: 1, fonte: SERIFA_TITULO }), [m.titulo, largura]);
  // o nome de cada chaveiro cabe na coluna (até 2 linhas, todos no mesmo corpo)
  const nomes = useMemo(() => {
    const base = n >= 4 ? 40 : 48;
    const fits = chaves.map((c) => encaixar(c.texto, { largura: coluna - 16, max: base, min: 30, linhas: 2, fonte: { nome: "g700" } }));
    const tam = Math.min(...fits.map((f) => f.tamanho));
    return chaves.map((c) => encaixar(c.texto, { largura: coluna - 16, max: tam, min: Math.min(30, tam), linhas: 2, fonte: { nome: "g700" } }));
  }, [chaves, coluna, n]);
  const tamTexto = Math.min(...nomes.map((f) => f.tamanho));
  const linhasNome = Math.max(...nomes.map((f) => f.linhas.length));
  const alturaNome = linhasNome > 1 ? linhasNome * tamTexto * 1.1 + 18 : 76;
  // o chaveiro cabe na coluna e na altura do painel (o nome fica embaixo dele)
  const fob = Math.min(256, coluna - 84, altura - PREGO_Y - 56 - alturaNome);
  const topoFob = PREGO_Y + 56;
  const ordem = chaves.map((c) => c.em);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Linhas linhas={tituloFit.linhas.length ? [tituloFit.linhas.join(" ")] : [m.titulo]} tempos={tempos} t={t} style={{ ...estiloTitulo, fontSize: tituloFit.tamanho, color: cor.preto, whiteSpace: "nowrap" }} />
        <div style={{ ...rotulo, fontSize: 32, color: cor.verde }}>
          {total > 1 ? `Item ${numero} de ${total}` : ""}
        </div>
      </div>
      {chaves.map((c, i) => {
        const cx = coluna * (i + 0.5);
        const chega = prog(t, c.em - 0.04, 0.3);
        const ultimoDito = ordem.filter((e) => e <= t + 0.001).length - 1 === i;
        const verde = chega > 0.5 && ultimoDito ? 1 : 0;
        const angulo = balanco(t, c.em + 0.08, 7, 0.7, 0.32);
        const fobX = coluna / 2 - fob / 2 + DESLOCAMENTO;
        return (
          <div key={`${c.texto}-${i}`}>
            {/* prego */}
            <svg width={28} height={28} style={{ position: "absolute", left: cx - 14, top: PREGO_Y - 14, overflow: "visible" }}>
              <circle cx={14} cy={16} r={12} fill="rgba(40,30,20,0.25)" />
              <circle cx={14} cy={14} r={12} fill={cor.preto} />
              <circle cx={10} cy={10} r={3.5} fill="#4A4743" />
            </svg>
            {/* esboço a lápis no prego */}
            {chega < 0.999 ? (
              <div style={{ position: "absolute", left: cx - coluna / 2, top: PREGO_Y, width: coluna, height: altura - PREGO_Y, opacity: 1 - chega }}>
                <svg width={coluna} height={topoFob + fob} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                  <circle cx={coluna / 2} cy={ARGOLA_R + 4} r={ARGOLA_R} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="7 7" />
                  <rect x={fobX} y={56} width={fob} height={fob} rx={40} fill="none" stroke={cor.lapis} strokeWidth={3} strokeDasharray="12 9" />
                </svg>
                <div style={{ position: "absolute", left: fobX, top: 56 + fob * 0.25, width: fob, height: fob * 0.5, display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {c.icone && !c.marca ? (
                    <Icone nome={c.icone} tamanho={fob * 0.5} cor={cor.lapisClaro} />
                  ) : (
                    <div style={{ fontFamily: serifa, fontSize: fob * (marcaDe(c, i).length > 2 ? 0.34 : marcaDe(c, i).length > 1 ? 0.42 : 0.5), lineHeight: 1, color: cor.lapisClaro, fontVariantNumeric: "lining-nums" }}>{marcaDe(c, i)}</div>
                  )}
                </div>
                <div style={{ position: "absolute", left: 0, width: coluna, top: 56 + fob + 14, textAlign: "center", fontFamily: grotesca, fontWeight: 700, fontSize: tamTexto, lineHeight: linhasNome > 1 ? 1.1 : undefined, color: cor.lapisClaro }}>
                  {nomes[i].linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              </div>
            ) : null}
            {chega > 0.001 ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: cx - coluna / 2,
                    top: PREGO_Y,
                    width: coluna,
                    height: 56 + fob + 10,
                    transformOrigin: `${coluna / 2}px 0px`,
                    rotate: `${angulo}deg`,
                    translate: `0 ${(1 - chega) * -50}px`,
                    opacity: Math.min(1, chega * 1.8),
                  }}
                >
                  {/* a chave, pendurada na argola, saindo por trás do chaveiro */}
                  <Chave largura={62} style={{ left: coluna / 2 - 31 - 34, top: 34, rotate: "32deg", transformOrigin: "31px 0px" }} />
                  {/* chaveiro de couro */}
                  <div
                    style={{
                      position: "absolute",
                      left: fobX,
                      top: 56,
                      width: fob,
                      height: fob,
                      borderRadius: 40,
                      background: verde ? cor.verde : cor.preto,
                      boxShadow: "0 14px 22px rgba(30,20,10,0.28), inset 0 0 0 6px rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      rotate: "-4deg",
                    }}
                  >
                    {/* costura */}
                    <div style={{ position: "absolute", inset: 16, borderRadius: 28, border: "3px dashed rgba(246,242,234,0.35)" }} />
                    {c.icone && !c.marca ? (
                      <Icone nome={c.icone} tamanho={fob * 0.5} cor={cor.papel} espessura={5} />
                    ) : (
                      <div style={{ position: "relative", fontFamily: serifa, fontSize: fob * (marcaDe(c, i).length > 2 ? 0.36 : marcaDe(c, i).length > 1 ? 0.44 : 0.52), lineHeight: 1, paddingTop: fob * 0.04, color: cor.papel, fontVariantNumeric: "lining-nums", whiteSpace: "nowrap" }}>
                        {marcaDe(c, i)}
                      </div>
                    )}
                  </div>
                  {/* argola */}
                  <svg width={70} height={70} style={{ position: "absolute", left: coluna / 2 - 35, top: 0, overflow: "visible" }}>
                    <circle cx={35} cy={ARGOLA_R + 4} r={ARGOLA_R} fill="none" stroke={cor.lataoEscuro} strokeWidth={9} />
                    <circle cx={35} cy={ARGOLA_R + 4} r={ARGOLA_R} fill="none" stroke={cor.latao} strokeWidth={5} />
                  </svg>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: cx - coluna / 2,
                    width: coluna,
                    top: PREGO_Y + 56 + fob + 14,
                    textAlign: "center",
                    fontFamily: grotesca,
                    fontWeight: 700,
                    fontSize: tamTexto,
                    lineHeight: linhasNome > 1 ? 1.1 : undefined,
                    color: verde ? cor.verde : cor.preto,
                    opacity: chega,
                    translate: `0 ${(1 - chega) * 12}px`,
                  }}
                >
                  {nomes[i].linhas.map((l, k) => (
                    <div key={k}>{l}</div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
