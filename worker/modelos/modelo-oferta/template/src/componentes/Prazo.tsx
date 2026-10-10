// A contagem do prazo: um cartão de papel com a frase do prazo ("só até domingo") montando na fala
// e, embaixo, a RÉGUA DA SEMANA: o tempo corre (um preenchimento verde-sálvia anda de dia em dia,
// com um "tique" em cada um) até o dia dito, que acende em verde profundo com um anel pulsando.
// Sem dia dito ("só hoje", "últimas vagas"), uma barra de tempo esvazia com um relógio girando.
import { Easing } from "remotion";
import { entrada, prog, saindo, temposDoTexto } from "../anim";
import { nucleo } from "../medida";
import type { Dia, Plano, Prazo as TPrazo } from "../plano";
import { cor, fonte, PAINEL } from "../tema";
import { AREA_DOCA, type Doca } from "./Oferta";
import { caber, Cartao, Icone, Texto } from "./Pecas";

export const DIAS: { id: Dia; curto: string }[] = [
  { id: "segunda", curto: "SEG" },
  { id: "terca", curto: "TER" },
  { id: "quarta", curto: "QUA" },
  { id: "quinta", curto: "QUI" },
  { id: "sexta", curto: "SEX" },
  { id: "sabado", curto: "SÁB" },
  { id: "domingo", curto: "DOM" },
];

export const ALTURA_PRAZO = 236;

// onde o cartão fica: na doca (em cima, se um botão vem depois; senão no meio da área) ou no meio da página
export const lugarDoPrazo = (doca: Doca | null, comBotao: boolean) => {
  if (!doca) return { y: (PAINEL.y + PAINEL.base) / 2 - ALTURA_PRAZO / 2 };
  if (comBotao) return { y: AREA_DOCA.y };
  return { y: (AREA_DOCA.y + AREA_DOCA.base) / 2 - ALTURA_PRAZO / 2 };
};

export const Prazo: React.FC<{ t: number; plano: Plano; m: TPrazo; fim: number; doca: Doca | null; comBotao: boolean }> = ({ t, plano, m, fim, doca, comBotao }) => {
  const fimTotal = doca ? doca.fim : fim;
  const em = m.em ?? m.de;
  if (t < em - 0.12 || t > fimTotal + 0.3) return null;
  const sai = saindo(t, fimTotal, 0.22);
  const e = entrada(t, em - 0.08, { de: 0.9, sobe: 36 });
  const { y } = lugarDoPrazo(doca, comBotao);
  const W = PAINEL.w;
  const X0 = 40;
  // a frase do prazo, com o dia em verde
  const fit = caber(m.texto, W - X0 * 2 - 84, 58, 34, 1, 800);
  const destaque = m.dia ? m.texto.split(/\s+/).find((w) => nucleo(w).startsWith(nucleo(m.dia as string).slice(0, 4))) : undefined;
  const tempos = temposDoTexto(m.texto, em, plano.palavras, fimTotal);
  // a régua da semana
  const alvo = m.dia ? DIAS.findIndex((d) => d.id === m.dia) : -1;
  const diaEm = m.diaEm ?? em + 0.5;
  const corre = alvo >= 0 ? prog(t, em, Math.max(0.3, diaEm - em), Easing.inOut(Easing.quad)) : 0;
  const posicao = corre * alvo; // 0 → alvo (índice contínuo)
  const acendeu = alvo >= 0 && t >= diaEm - 0.02;
  const pAcende = alvo >= 0 ? prog(t, diaEm - 0.02, 0.3) : 0;
  const onda = acendeu ? ((t - diaEm) % 1.1) / 1.1 : 0;
  const yRegua = 128;
  const vao = 12;
  const wDia = (W - X0 * 2 - vao * 6) / 7;
  const hDia = 82;
  // sem dia: a barra que esvazia
  const fimBarra = m.fimEm ?? fimTotal;
  const resta = 1 - prog(t, em, Math.max(0.5, fimBarra - em), (x) => x);
  const giro = (t - em) * 220;
  return (
    <div style={{ position: "absolute", left: PAINEL.x, top: y, width: W, height: ALTURA_PRAZO, opacity: e.opacity * (1 - sai), transform: e.transform }}>
      <Cartao raio={26} />
      <div style={{ position: "absolute", left: X0, top: 30, width: 62, height: 62, borderRadius: 31, background: cor.acentoClaro, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {alvo >= 0 ? (
          <Icone nome="calendario" tamanho={40} cor={cor.acento} traco={2} />
        ) : (
          <div style={{ transform: `rotate(${giro}deg)` }}>
            <Icone nome="relogio" tamanho={40} cor={cor.acento} traco={2} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: X0 + 84, top: 30 + (62 - fit.tamanho * 1.14) / 2, width: W - X0 * 2 - 84 }}>
        <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} alinhar="left" tempos={tempos} destaque={destaque} />
      </div>
      {alvo >= 0 ? (
        DIAS.map((d, i) => {
          const passou = Math.max(0, Math.min(1, posicao - i + 1));
          const ehAlvo = i === alvo;
          const depois = i > alvo;
          const fundo = ehAlvo && acendeu ? cor.acento : cor.acentoClaro;
          const pEnt = prog(t, em + i * 0.03, 0.3);
          return (
            <div key={d.id} style={{ position: "absolute", left: X0 + i * (wDia + vao), top: yRegua, width: wDia, height: hDia, opacity: pEnt * (depois ? 0.4 : 1), transform: pEnt < 1 ? `translateY(${(1 - pEnt) * 14}px)` : undefined }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 18, border: `2px solid ${cor.cartaoBorda}`, background: cor.cartao }} />
              {/* o preenchimento que corre de dia em dia */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(ehAlvo ? (acendeu ? 1 : passou) : passou) * 100}%`, borderRadius: 18, background: fundo, opacity: ehAlvo && acendeu ? 1 : 0.95 }} />
              {ehAlvo && acendeu ? (
                <div style={{ position: "absolute", inset: -6, borderRadius: 24, border: `4px solid ${cor.acento}`, opacity: (1 - onda) * 0.55, transform: `scale(${1 + onda * 0.18})` }} />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonte,
                  fontWeight: 800,
                  fontSize: 30,
                  letterSpacing: "0.06em",
                  color: ehAlvo && acendeu ? cor.cartao : passou > 0.5 ? cor.acento : cor.tintaSuave,
                  transform: ehAlvo && pAcende < 1 && acendeu ? `scale(${1 + 0.15 * Math.sin(Math.PI * pAcende)})` : undefined,
                }}
              >
                {d.curto}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ position: "absolute", left: X0, top: yRegua + 18, width: W - X0 * 2, height: 46, borderRadius: 23, background: cor.acentoClaro, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${resta * 100}%`, borderRadius: 23, background: cor.acento }} />
        </div>
      )}
      {/* um ponteiro que corre sobre a régua até o dia */}
      {alvo >= 0 && !acendeu ? (
        <div style={{ position: "absolute", left: X0 + posicao * (wDia + vao) + wDia / 2 - 9, top: yRegua - 24, width: 18, height: 18, borderRadius: 9, background: cor.acento, opacity: prog(t, em, 0.2) }} />
      ) : null}
    </div>
  );
};

