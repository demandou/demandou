// Bloco universal `numero`: o número conta até o valor (pt-BR) enquanto uma bolinha de dedo sobe o braço
// do violão, da pestana até a 12ª casa; quando ele chega, as cordas soam e o número fica azul.
// O rótulo (o que o número mede) nasce a lápis e ganha tinta palavra por palavra.
import { prog, suave, temposDasPalavras } from "../anim";
import { DURACAO_CONTA } from "../layout";
import { caber, largura, numeroPtBr } from "../medida";
import type { Numero as TNumero, Palavra } from "../plano";
import { cor, fonte, rotulo, titulo } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";

// O braço do violão visto de frente, deitado: 6 cordas, a pestana à esquerda, 12 casas que encurtam como
// num violão de verdade, as marcações nas casas 3, 5, 7, 9 e 12. `p` = quanto a bolinha já subiu (0–1).
export const Braco: React.FC<{ t: number; w: number; h: number; p: number; desenhoEm: number; soaEm: number }> = ({ t, w, h, p, desenhoEm, soaEm }) => {
  const nut = 26;
  const escala = (w - nut - 24) / 0.5;
  const xCasa = (f: number) => nut + escala * (1 - 2 ** (-f / 12));
  const topo = 14;
  const passo = (h - 2 * topo) / 5;
  const yCorda = (k: number) => topo + k * passo;
  const tinta = prog(t, desenhoEm, 0.5);
  // a bolinha desliza pelo meio das casas: da 1ª (p = 0) até a 12ª (p = 1)
  const f = 0.5 + Math.max(0, Math.min(1, p)) * 11.5;
  const xBola = (xCasa(f - 0.5) + xCasa(f + 0.5)) / 2;
  const xTrilha = p <= 0 ? nut : xBola;
  const d = t - soaEm;
  const vibra = (k: number, x: number) =>
    d > 0 && d < 1.4 ? 5.5 * Math.exp(-d / 0.38) * Math.sin(2 * Math.PI * 8 * d + k) * Math.sin((Math.PI * x) / w) : 0;
  const yMeio = (yCorda(2) + yCorda(3)) / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", display: "block" }}>
      {/* esboço a lápis */}
      <g opacity={1 - tinta} stroke={cor.lapisForte} strokeWidth={3} strokeDasharray="8 9" fill="none">
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <line key={k} x1={nut} y1={yCorda(k)} x2={w} y2={yCorda(k)} />
        ))}
        {Array.from({ length: 13 }, (_, n) => (
          <line key={`f${n}`} x1={xCasa(n)} y1={yCorda(0)} x2={xCasa(n)} y2={yCorda(5)} />
        ))}
      </g>
      <g opacity={tinta}>
        {/* marcações */}
        {[3, 5, 7, 9].map((n) => (
          <circle key={n} cx={(xCasa(n - 1) + xCasa(n)) / 2} cy={yMeio} r={9} fill={cor.marfim} opacity={0.22} />
        ))}
        <circle cx={(xCasa(11) + xCasa(12)) / 2} cy={(yCorda(1) + yCorda(2)) / 2} r={9} fill={cor.marfim} opacity={0.22} />
        <circle cx={(xCasa(11) + xCasa(12)) / 2} cy={(yCorda(3) + yCorda(4)) / 2} r={9} fill={cor.marfim} opacity={0.22} />
        {/* trastes */}
        {Array.from({ length: 12 }, (_, n) => (
          <line key={`t${n}`} x1={xCasa(n + 1)} y1={yCorda(0) - 4} x2={xCasa(n + 1)} y2={yCorda(5) + 4} stroke={cor.niquel} strokeWidth={4} />
        ))}
        {/* pestana */}
        <rect x={nut - 13} y={yCorda(0) - 8} width={13} height={yCorda(5) - yCorda(0) + 16} rx={3} fill={cor.marfim} />
        {/* cordas (as graves mais grossas), que vibram quando o número chega */}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const pts = Array.from({ length: 41 }, (_, j) => {
            const x = nut + ((w - nut) * j) / 40;
            return `${x.toFixed(1)} ${(yCorda(k) + vibra(k, x - nut)).toFixed(1)}`;
          });
          return <path key={`c${k}`} d={`M ${pts.join(" L ")}`} fill="none" stroke={cor.niquel} strokeWidth={2.2 + k * 0.5} />;
        })}
        {/* o caminho que a bolinha já subiu */}
        <line x1={nut} y1={yMeio} x2={xTrilha} y2={yMeio} stroke={cor.azul} strokeWidth={8} strokeLinecap="round" opacity={p > 0 ? 0.55 : 0} />
      </g>
      {/* a bolinha de dedo */}
      <circle cx={xBola} cy={yMeio} r={27} fill={p > 0 ? cor.azul : "none"} stroke={p > 0 ? "none" : cor.lapisForte} strokeWidth={3} strokeDasharray="6 6" />
    </svg>
  );
};

export const Numero: React.FC<{ m: TNumero; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const casas = m.casas ?? 0;
  const final = numeroPtBr(m.valor, casas);
  const prefixo = m.prefixo?.trim() ?? "";
  const sufixo = m.sufixo?.trim() ?? "";
  // espaço vertical: rótulo + número + braço (+ etiqueta), centrados na área
  const encRotulo = caber(m.rotulo, { largura: area.w, max: 72, min: 44, linhas: 2, estilo: { peso: 700, espacamento: 0 } });
  const alturaRotulo = encRotulo.linhas.length * encRotulo.tamanho * 1.08;
  const alturaBraco = area.h >= 600 ? 210 : 120;
  const etiqueta = m.ilustrativo ? 54 : 0;
  const livreNumero = area.h - alturaRotulo - alturaBraco - etiqueta - 36 - 56 - 20;
  // o maior corpo em que prefixo + número + sufixo cabem numa linha (algarismos de largura igual)
  const larguraNumero = (s: number) => {
    const digitos = [...final].filter((c) => /\d/.test(c)).length;
    const outros = final.replace(/\d/g, "");
    const pequeno = 0.42 * s;
    return (
      digitos * 0.6 * s +
      largura(outros, s, { peso: 900 }) +
      (prefixo ? largura(prefixo, pequeno, { peso: 800 }) + 0.12 * s : 0) +
      (sufixo ? largura(sufixo, pequeno, { peso: 800 }) + 0.12 * s : 0)
    );
  };
  let s = Math.min(250, Math.max(96, livreNumero));
  while (s > 96 && larguraNumero(s) > area.w - 10) s -= 4;
  const bloco = alturaRotulo + 36 + s + 56 + alturaBraco + etiqueta;
  const topo = Math.max(0, (area.h - bloco) / 2);

  const pConta = prog(t, m.em, DURACAO_CONTA, suave);
  const chegou = t >= m.em + DURACAO_CONTA;
  const agora = numeroPtBr(m.valor * pConta, casas);
  const antes = t < m.em - 0.02;
  // antes de ser dito: o número a lápis, zerado, no tamanho final
  const mostrado = antes ? final.replace(/\d/g, "0") : agora;
  const corNumero = antes ? cor.lapisForte : chegou ? cor.azul : cor.marfim;
  const tRotulo = temposDasPalavras(m.rotulo, palavras, (m.rotuloEm ?? m.de) - 0.15, fim, m.rotuloEm ?? m.de).tempos;
  const pequeno = 0.42 * s;
  const pBorda = prog(t, m.em - 0.04, 0.3);

  return (
    <div style={{ position: "absolute", left: 0, top: topo, width: area.w, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <TextoFalado enc={encRotulo} tempos={tRotulo} t={t} cor={cor.marfim} peso={700} espacamento={0} alinhamento="center" />
      <div style={{ height: 36 }} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", height: s, gap: 0.12 * s }}>
        {prefixo ? (
          <div style={{ ...titulo, fontSize: pequeno, color: pBorda > 0 ? cor.marfimSuave : cor.lapisForte }}>{prefixo}</div>
        ) : null}
        <div style={{ ...titulo, fontWeight: 900, fontSize: s, lineHeight: 1, color: corNumero, whiteSpace: "nowrap", display: "flex" }}>
          {/* cada algarismo numa caixa de largura fixa (o número não dança enquanto conta); ponto e vírgula justos */}
          {[...mostrado].map((c, i) =>
            /\d/.test(c) ? (
              <span key={i} style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>
                {c}
              </span>
            ) : (
              <span key={i}>{c}</span>
            ),
          )}
        </div>
        {sufixo ? <div style={{ ...titulo, fontSize: pequeno, color: pBorda > 0 ? cor.marfimSuave : cor.lapisForte }}>{sufixo}</div> : null}
      </div>
      <div style={{ height: 56 }} />
      <Braco t={t} w={Math.min(900, area.w - 40)} h={alturaBraco} p={antes ? 0 : pConta} desenhoEm={m.de} soaEm={m.em + DURACAO_CONTA} />
      {m.ilustrativo ? (
        <div
          style={{
            ...rotulo,
            fontSize: 30,
            marginTop: 24,
            padding: "8px 18px",
            borderRadius: 14,
            border: `3px dashed ${cor.lapisForte}`,
            color: cor.marfimSuave,
            fontFamily: fonte,
          }}
        >
          ilustrativo
        </div>
      ) : null}
    </div>
  );
};
