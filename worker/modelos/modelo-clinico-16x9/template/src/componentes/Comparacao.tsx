import { limitar, misturarCor, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Areas } from "../layout";
import { encaixarTitulo } from "../medida";
import type { Comparacao as ComparacaoT, Palavra } from "../plano";
import { caber, cor, QUADRO, sans } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { pSelo, Selo } from "./Selo";
import { TextoFalado } from "./Texto";

// Comparação como um exame lado a lado: duas colunas embaixo da lupa grande, cada uma com seu selo.
// Cada lado entra na palavra dele (selo vazado, rótulo e texto); no veredito, quem ganha leva ✓ azul
// e o outro ✗ vermelho. "errado-certo" sem vencedor: o primeiro já entra com ✗ e o segundo com ✓.
// "antes-depois": uma seta liga os dois lados.
export const Comparacao: React.FC<{ m: ComparacaoT; t: number; fim: number; areas: Areas; palavras: Palavra[] }> = ({
  m,
  t,
  fim,
  areas,
  palavras,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const temTitulo = !!m.titulo;
  // sem título, as duas colunas ocupam o quadro inteiro da explicação (também o lugar do cabeçalho)
  const corpo = temTitulo ? areas.corpo : areas.quadro;
  const meio = 64;
  const colW = (corpo.w - meio) / 2;
  const selo = 42;
  const larguraTexto = colW - 8;
  // um corpo só para os dois lados: o maior em que os dois cabem (até 4 linhas) na altura do corpo
  const alturaUtil = corpo.h - selo * 2 - 26 - 30;
  const encaixes = m.lados.map((l) =>
    encaixarTitulo(l.texto, { largura: larguraTexto, max: temTitulo ? 68 : 76, min: 44, linhas: 4, peso: 700, espacamento: -0.01, altura: alturaUtil, entrelinha: 1.08 }),
  );
  const tamanho = Math.min(...encaixes.map((e) => e.tamanho));
  const textos = m.lados.map((l) =>
    encaixarTitulo(l.texto, { largura: larguraTexto, max: tamanho, min: Math.min(40, tamanho), linhas: 4, peso: 700, espacamento: -0.01, altura: alturaUtil, entrelinha: 1.08 }),
  );
  const rotuloTam = Math.min(...m.lados.map((l) => caber(l.rotulo.toUpperCase(), colW - selo * 2 - 24, 36, 30, 700)));
  const alturaTexto = Math.max(...textos.map((e) => e.linhas.length)) * tamanho * 1.08;
  const alturaBloco = selo * 2 + 26 + alturaTexto;
  const yTopo = corpo.y + Math.max(0, (corpo.h - alturaBloco) / 2);

  const vencedorEm = m.vencedor !== undefined ? (m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.4) : undefined;
  const veredito = vencedorEm !== undefined ? prog(t, vencedorEm, 0.5) : 0;
  const errCerto = m.modo === "errado-certo" && m.vencedor === undefined;

  // o traço do meio desce com o primeiro lado; a seta (antes → depois) ou o "×" acende com o segundo
  const tracoMeio = prog(t, m.lados[0].em, 0.6);
  const xMeio = corpo.x + colW + meio / 2;
  const sinal = prog(t, m.lados[1].em - 0.1, 0.4);

  return (
    <>
      {temTitulo ? (
        <Cabecalho area={areas.cabecalho} titulo={m.titulo as string} palavras={palavras} de={m.de} ate={m.ate} t={t} fim={fim} alinhar="centro" maxLinhas={2} maximo={80} />
      ) : null}
      <svg width={QUADRO.w} height={QUADRO.h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        <Traco d={`M ${xMeio} ${yTopo} L ${xMeio} ${yTopo + alturaBloco}`} p={tracoMeio} cor={cor.cinzaClaro} largura={3} />
        {m.modo === "antes-depois" ? (
          <g opacity={sinal}>
            <circle cx={xMeio} cy={yTopo + selo} r={30} fill={cor.fundo} />
            <Traco d={`M ${xMeio - 16} ${yTopo + selo} L ${xMeio + 16} ${yTopo + selo} M ${xMeio + 4} ${yTopo + selo - 13} L ${xMeio + 17} ${yTopo + selo} L ${xMeio + 4} ${yTopo + selo + 13}`} p={sinal} cor={cor.azul} largura={5} />
          </g>
        ) : (
          <g opacity={sinal}>
            <circle cx={xMeio} cy={yTopo + selo} r={26} fill={cor.fundo} />
            <Traco d={`M ${xMeio - 10} ${yTopo + selo - 10} L ${xMeio + 10} ${yTopo + selo + 10} M ${xMeio + 10} ${yTopo + selo - 10} L ${xMeio - 10} ${yTopo + selo + 10}`} p={sinal} cor={cor.cinza} largura={4} />
          </g>
        )}
        {m.lados.map((l, i) => {
          const x = corpo.x + i * (colW + meio);
          const anel = pSelo(t, l.em);
          // o selo de cada lado: vazado neutro até o veredito; no veredito, ✓ (ganhou) ou ✗ (perdeu)
          const ganhou = m.vencedor === i;
          const tipo: "certo" | "errado" = errCerto ? (i === 0 ? "errado" : "certo") : ganhou ? "certo" : "errado";
          const marca = errCerto ? pSelo(t, l.em + 0.3) : veredito > 0 ? pSelo(t, vencedorEm as number) : 0;
          return (
            <g key={i}>
              {marca <= 0 ? (
                <g opacity={anel}>
                  <circle cx={x + selo} cy={yTopo + selo} r={selo - 3} fill={cor.branco} stroke={cor.azul} strokeWidth={4} />
                  <circle cx={x + selo} cy={yTopo + selo} r={9} fill={cor.azul} />
                </g>
              ) : (
                <Selo cx={x + selo} cy={yTopo + selo} r={selo} tipo={tipo} p={marca} />
              )}
              {/* sublinhado do lado que ganhou */}
              {ganhou ? (
                <Traco
                  d={`M ${x} ${yTopo + selo * 2 + 26 + alturaTexto + 14} L ${x + colW} ${yTopo + selo * 2 + 26 + alturaTexto + 14}`}
                  p={prog(t, (vencedorEm as number) + 0.2, 0.5)}
                  cor={cor.azul}
                  largura={5}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      {m.lados.map((l, i) => {
        const x = corpo.x + i * (colW + meio);
        const e = textos[i];
        const ganhou = m.vencedor === i;
        const perdeu = m.vencedor !== undefined && !ganhou;
        const tipoErro = errCerto ? i === 0 : perdeu;
        const corRotulo = tipoErro && (errCerto ? prog(t, l.em + 0.3, 0.3) : veredito) > 0 ? cor.vermelho : cor.azul;
        const tempos = temposDoTexto(l.texto, palavras, l.em, m.ate, Math.max(m.de + 0.1, l.em), l.em - 0.3);
        const escreve = limitar(prog(t, l.em, 0.45));
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yTopo, width: colW, opacity: 1 - sai }}>
            <div
              style={{
                position: "absolute",
                left: selo * 2 + 16,
                top: 0,
                height: selo * 2,
                display: "flex",
                alignItems: "center",
                fontFamily: sans,
                fontWeight: 700,
                fontSize: rotuloTam,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                color: corRotulo,
                clipPath: `inset(-20% ${(1 - escreve) * 100}% -20% 0)`,
              }}
            >
              {l.rotulo}
            </div>
            <div style={{ position: "absolute", left: 0, top: selo * 2 + 26, color: misturarCor(cor.tinta, cor.cinza, perdeu ? veredito * 0.5 : 0) }}>
              <TextoFalado linhas={e.linhas} tamanho={e.tamanho} peso={700} tempos={tempos} t={t} cor={misturarCor(cor.tinta, cor.cinza, perdeu ? veredito * 0.55 : 0)} entrelinha={1.08} espacamento={-0.01} lapis />
            </div>
          </div>
        );
      })}
    </>
  );
};
