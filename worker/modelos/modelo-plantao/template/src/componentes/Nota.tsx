// Nota de dinheiro no painel de baixo (tela dividida): a nota nasce tracejada, chega quando o
// "dinheiro" é dito, ganha o selo de pausa no "parado" e, quando a perda é dita, ENCOLHE — o
// valor impresso continua o mesmo, mas o tamanho (o poder de compra) diminui. O contorno
// tracejado do tamanho original fica no lugar, para mostrar o quanto ela perdeu.
// A nota é fictícia: nada de desenho ou cores de cédula real.
import { limitar, Palavras, prog, temposDoTexto, troca } from "../anim";
import type { Area } from "../layout";
import { caber, medir } from "../medidas";
import type { Nota as N, Palavra } from "../plano";
import { cor, manchete, numeros, rotulo } from "../tema";
import { Pausa, Seta } from "./Icones";

// a nota é desenhada em 700×310 e mostrada 1,16× maior (812×360): ocupa o painel até a frase de baixo
const LARG = 700;
const ALT = 310;
const BASE_MAX = 1.16;

const separar = (valor: string) => {
  const m = valor.match(/^(\D*?)\s*([\d.,]+)\s*(.*)$/);
  return m ? { simbolo: m[1].trim(), numero: m[2], resto: m[3] } : { simbolo: "", numero: valor, resto: "" };
};

const MOEDA = /^(R\$|US\$|€|\$|£)/;

const DesenhoDaNota: React.FC<{ valor: string; simbolo?: string; fantasma?: boolean }> = ({ valor, simbolo: simboloDado, fantasma }) => {
  const partes = separar(valor);
  // com moeda: o símbolo vai no selo e o número fica grande; sem moeda, o valor inteiro vai impresso
  // (e o selo só aparece se o plano der um `simbolo`)
  const moeda = MOEDA.test(valor.trim());
  const simbolo = simboloDado ?? (moeda ? partes.simbolo : "");
  const numero = moeda ? `${partes.numero}${partes.resto ? ` ${partes.resto}` : ""}` : valor.trim();
  const traco = fantasma ? cor.apagadoNoAzul : "rgba(34,81,255,0.35)";
  const larguraNumero = simbolo ? LARG * 0.56 : LARG * 0.84;
  const tamNumero = Math.min(150, larguraNumero / Math.max(0.5, medir(numero, 1, { peso: 900, alta: true, tabular: true })));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={LARG} height={ALT} style={{ position: "absolute", inset: 0 }}>
        <rect x={2} y={2} width={LARG - 4} height={ALT - 4} rx={16} fill={fantasma ? "none" : cor.papel} stroke={fantasma ? cor.celeste : "none"} strokeOpacity={0.6} strokeWidth={4} strokeDasharray={fantasma ? "14 12" : undefined} />
        {fantasma ? null : <rect x={18} y={18} width={LARG - 36} height={ALT - 36} rx={8} fill="none" stroke="rgba(11,29,110,0.28)" strokeWidth={3} />}
        {/* ondas finas de cédula (padrão de segurança estilizado) */}
        {fantasma
          ? null
          : [0, 1, 2, 3, 4, 5].map((k) => {
              const y = 70 + k * 30;
              let d = `M 30 ${y}`;
              for (let x = 30; x <= LARG - 30; x += 20) d += ` L ${x} ${y + Math.sin(x / 34 + k * 0.9) * 9}`;
              return <path key={k} d={d} fill="none" stroke={traco} strokeWidth={2} />;
            })}
        {/* selo redondo com o símbolo */}
        {simbolo ? (
          <>
            <circle cx={140} cy={ALT / 2} r={74} fill={fantasma ? "none" : cor.papel} stroke={fantasma ? cor.apagadoNoAzul : cor.eletrico} strokeWidth={6} />
            <circle cx={140} cy={ALT / 2} r={58} fill="none" stroke={fantasma ? cor.apagadoNoAzul : cor.eletrico} strokeWidth={2.5} strokeDasharray="3 6" />
          </>
        ) : null}
      </svg>
      {simbolo ? (
        <div style={{ position: "absolute", left: 140 - 74, top: ALT / 2 - 74, width: 148, height: 148, display: "flex", alignItems: "center", justifyContent: "center", ...manchete, fontSize: simbolo.length > 2 ? 40 : 52, color: fantasma ? cor.apagadoNoAzul : cor.eletrico, letterSpacing: 0 }}>
          {simbolo}
        </div>
      ) : null}
      <div style={{ position: "absolute", right: simbolo ? 46 : 0, left: simbolo ? undefined : 0, top: 0, height: ALT, display: "flex", alignItems: "center", justifyContent: simbolo ? "flex-end" : "center", ...manchete, ...numeros, fontSize: tamNumero, letterSpacing: "-0.02em", color: fantasma ? cor.apagadoNoAzul : cor.tinta, background: "transparent", whiteSpace: "pre" }}>
        <span style={{ background: fantasma ? "transparent" : cor.papel, padding: "0 10px" }}>{numero}</span>
      </div>
    </div>
  );
};

export const Nota: React.FC<{ m: N; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  // a entrada e a saída são da troca de quadro; o painel já nasce com o contorno da nota desenhado
  if (t < entra) return null;

  const corteRotulo = { peso: 900 as const, alta: true, espacamento: -0.01 };
  const rot = caber(m.rotulo, { largura: 960, maximo: 54, minimo: 36, linhas: 1, corte: corteRotulo });
  const temposRotulo = temposDoTexto(m.rotulo, palavras, m.de, m.ate, entra + 0.2);
  const perda = caber(m.perda.texto, { largura: 960 - 60, maximo: 54, minimo: 36, linhas: 1, corte: corteRotulo });
  const temposPerda = temposDoTexto(m.perda.texto, palavras, m.de, m.ate, m.perda.em - 0.06);

  const pNota = prog(t, m.notaEm - 0.06, 0.45);
  const pPausa = m.paradoEm !== undefined ? prog(t, m.paradoEm - 0.04, 0.3) : 0;
  const escala = Math.min(0.92, Math.max(0.5, m.escala ?? 0.72));
  const pEncolhe = prog(t, m.perda.em - 0.02, Math.max(0.9, m.ate - 0.35 - m.perda.em), troca);
  const k = 1 - (1 - escala) * pEncolhe;

  // a frase de cima no topo do painel, a de baixo logo acima do letreiro e a nota no meio
  const yRotulo = area.y + 26;
  const yPerda = area.y + area.h - 30 - perda.tam;
  const cy = (yRotulo + rot.tam + yPerda) / 2;
  const xNota = 540 - LARG / 2;
  const yNota = cy - ALT / 2;
  // a nota ocupa o meio do painel: em painel mais baixo (gravação perto da câmera), ela diminui
  const BASE = Math.min(BASE_MAX, (yPerda - (yRotulo + rot.tam) - 28) / ALT);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 60, top: yRotulo, width: 960 }}>
        <Palavras palavras={m.rotulo.split(/\s+/)} tempos={temposRotulo} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.branco} style={{ ...manchete, fontSize: rot.tam }} />
      </div>

      <div style={{ position: "absolute", inset: 0 }}>
        {/* a nota "a lápis", antes de chegar */}
        <div style={{ position: "absolute", left: xNota, top: yNota, width: LARG, height: ALT, opacity: 1 - pNota, scale: String(BASE) }}>
          <DesenhoDaNota valor={m.valor} simbolo={m.simbolo} fantasma />
        </div>
        {/* o tamanho original, só o contorno tracejado, depois que ela encolhe */}
        <svg width={LARG} height={ALT} style={{ position: "absolute", left: xNota, top: yNota, opacity: limitar(pEncolhe * 2), scale: String(BASE) }}>
          <rect x={2} y={2} width={LARG - 4} height={ALT - 4} rx={16} fill="none" stroke={cor.celeste} strokeOpacity={0.7} strokeWidth={4} strokeDasharray="14 12" />
        </svg>
        {/* a nota */}
        <div
          style={{
            position: "absolute",
            left: xNota,
            top: yNota,
            width: LARG,
            height: ALT,
            opacity: pNota,
            translate: `${(1 - pNota) * -140}px 0`,
            scale: String(BASE * k),
          }}
        >
          <DesenhoDaNota valor={m.valor} simbolo={m.simbolo} />
          {m.paradoEm !== undefined ? (
            <div
              style={{
                position: "absolute",
                right: -26,
                top: -26,
                width: 76,
                height: 76,
                borderRadius: 38,
                background: cor.noite,
                border: `5px solid ${cor.papel}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: pPausa,
                scale: String((0.85 + 0.15 * pPausa) / k),
              }}
            >
              <Pausa tamanho={40} cor={cor.branco} />
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ position: "absolute", left: 60, top: yPerda, width: 960, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        <Seta sentido="desce" tamanho={44} cor={cor.celeste} style={{ opacity: 0.25 + 0.75 * prog(t, m.perda.em, 0.3) }} />
        <Palavras palavras={m.perda.texto.split(/\s+/)} tempos={temposPerda} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.celeste} style={{ ...manchete, fontSize: perda.tam }} />
      </div>
    </div>
  );
};
