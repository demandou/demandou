// O que fica de fora do bloco ("sem celular"): uma etiqueta com ícone que entra na palavra e é
// riscada na palavra seguinte — o traço atravessa ícone e texto, que apagam.
import { prog, Traco } from "../anim";
import { ANTES, type Agenda, DUR_CORTINA, entradaESaida, retNoTempo } from "../agenda";
import type { Blocos } from "../plano";
import { medir } from "../medida";
import { cor, sans } from "../tema";
import { Icone } from "./Icones";

const ALTURA = 92;

export const Sem: React.FC<{ m: Blocos; indice: number; t: number; ag: Agenda; fim: number }> = ({ m, indice, t, ag, fim }) => {
  const s = m.sem;
  if (!s || t < s.em - 0.05) return null;
  const bloco = [...ag.blocos].reverse().find((b) => b.momento === indice);
  if (!bloco) return null;
  const { ret } = retNoTempo(bloco, t, ag);
  const dentro = ret.h + 6 >= 300;
  const tamanho = Math.max(34, Math.min(46, Math.floor((46 * (ret.w - 160)) / Math.max(1, medir(s.texto, 46, { peso: 700 })))));
  const largura = Math.min(ret.w - (dentro ? 60 : 0), 22 + 54 + 14 + medir(s.texto, tamanho, { peso: 700 }) + 30 + 4);
  const x = ret.x + (dentro ? 30 : 0);
  const y = dentro ? ret.y + ret.h - 30 - ALTURA : ret.y + ret.h + 18;
  const entra = prog(t, s.em, 0.35);
  const risca = prog(t, s.riscaEm, 0.38);
  // indo para um bloco universal na folha, a cortina leva a etiqueta junto com a agenda
  const sai = entradaESaida(ag, indice).paraCortina ? prog(t, fim - ANTES + DUR_CORTINA - 0.001, 0.001) : prog(t, fim - 0.25, 0.3);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + (1 - entra) * 22,
        width: largura,
        height: ALTURA,
        borderRadius: 24,
        background: "#FFFFFF",
        boxShadow: dentro ? "0 8px 20px rgba(120,30,10,0.22)" : "0 8px 20px rgba(20,26,40,0.16)",
        opacity: entra * (1 - sai),
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 30px 0 22px",
        fontFamily: sans,
      }}
    >
      <Icone nome={s.icone ?? "celular"} tamanho={54} cor={risca > 0.5 ? cor.tintaFraca : cor.tinta} peso={3.8} />
      <span style={{ fontSize: tamanho, fontWeight: 700, color: risca > 0.5 ? cor.tintaFraca : cor.tinta, whiteSpace: "nowrap" }}>{s.texto}</span>
      <svg width={largura} height={ALTURA} viewBox={`0 0 ${largura} ${ALTURA}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <Traco d={`M 14 ${ALTURA * 0.62} L ${largura - 14} ${ALTURA * 0.38}`} p={risca} cor={cor.focoEscuro} largura={7} />
      </svg>
    </div>
  );
};
