import { calculo, prog, Revela, useTempo } from "../anim";
import { PAINEL } from "../layout";
import { encaixar } from "../medida";
import type { CartaoIndicador, Indicadores as TIndicadores, Lado } from "../plano";
import { cor, formatar, mono, sans, PLANO } from "../tema";
import { corDoTom } from "./Listas";
import { Painel } from "./Painel";
import { IndicadorDeProgresso } from "./Tendencia";
import { corpoQueCabe, Valor } from "./Valor";

const SETAS = {
  sobe: "M10,34 L34,10 M18,10 L34,10 L34,26",
  cai: "M10,10 L34,34 M34,18 L34,34 L18,34",
  estavel: "M8,22 L36,22 M26,12 L36,22 L26,32",
};

// Selo pequeno da tendência de um indicador (canto do cartão).
const Seta: React.FC<{ tipo: keyof typeof SETAS; c: string; p: number }> = ({ tipo, c, p }) => (
  <svg width={64} height={64} viewBox="0 0 44 44">
    <rect x={1.5} y={1.5} width={41} height={41} rx={11} fill={c} fillOpacity={0.12 * p} stroke={c} strokeOpacity={0.5 * p} strokeWidth={1.5} />
    <path d={SETAS[tipo]} fill="none" stroke={c} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
  </svg>
);

const corDoCartao = (c: CartaoIndicador) =>
  c.tom ? corDoTom(c.tom) : c.tendencia === "cai" ? cor.negativo : c.tendencia === "sobe" ? cor.positivo : cor.texto;

// Painel de indicadores (dashboard): 2 a 4 cartões. Cada cartão nasce "a lápis" (contorno tracejado,
// o nome apagado) e acende na palavra dele: um número que conta ou um estado em palavras, com a cor
// do tom e a seta da tendência. O último que entrou "respira" (dado ao vivo).
export const Indicadores: React.FC<{ m: TIndicadores; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number }> = ({
  m,
  lado,
  t0,
  fimCabecalho,
  fimCorpo,
}) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const cartoes = m.cartoes.slice(0, 4);
  const n = cartoes.length;
  const tempos: number[] = [];
  cartoes.forEach((c, i) => tempos.push(Math.max(c.em, t0 + 0.25, i > 0 ? tempos[i - 1] + 0.25 : -Infinity)));
  const atual = tempos.filter((e) => t >= e).length - 1;

  // grade no quadro deitado: 2 ou 3 cartões lado a lado (colunas); 4 em grade 2×2
  const linhasLargas = false as boolean;
  const colunas = n <= 3 ? Math.max(1, n) : 2;
  const filas = Math.ceil(n / colunas);
  const gap = 22;
  const topoGrade = topo + (m.ilustrativo ? 56 : 0);
  const W = (direita - esquerda - gap * (colunas - 1)) / colunas;
  const H = Math.min(linhasLargas ? 220 : 340, (base - topoGrade - gap * (filas - 1)) / filas);
  const alturaGrade = H * filas + gap * (filas - 1);
  const y0 = topoGrade + (base - topoGrade - alturaGrade) / 2;
  const pos = (i: number) => ({ x: esquerda + (i % colunas) * (W + gap), y: y0 + Math.floor(i / colunas) * (H + gap) });

  // todos os números no mesmo corpo; todos os estados em palavras no mesmo corpo
  const larguraValor = linhasLargas ? W * 0.52 : W - 72;
  const textosValor = cartoes.filter((c) => c.valor !== undefined).map((c) => ({ prefixo: c.prefixo, numero: formatar(c.valor as number, c.casas ?? 0), sufixo: c.sufixo }));
  const corpoNumero = Math.min(linhasLargas ? 104 : 120, ...textosValor.map((v) => corpoQueCabe(v, larguraValor, 120)));
  const corpoEstado = Math.min(
    linhasLargas ? 64 : 70,
    ...cartoes
      .filter((c) => c.valor === undefined && c.texto)
      .map((c) => encaixar(c.texto as string, { largura: larguraValor, max: linhasLargas ? 64 : 70, min: 40, linhas: 2, fonte: { peso: 600, espacamento: -0.015 } }).tamanho),
  );
  const larguraRotulo = linhasLargas ? W * 0.42 : W - 72 - (cartoes.some((c) => c.tendencia) ? 70 : 0);

  return (
    <Painel
      de={m.de}
      t0={t0}
      ate={m.ate}
      fimCabecalho={fimCabecalho}
      fimCorpo={fimCorpo}
      lado={lado}
      rotulo={m.rotulo}
      titulo={m.titulo}
      ficha={m.ficha}
      nota={m.nota}
      ilustrativo={m.ilustrativo}
      indicador={<IndicadorDeProgresso tempos={tempos} largura={PAINEL.cabecalho.largura} />}
    >
      {cartoes.map((c, i) => {
        const { x, y } = pos(i);
        const p = prog(t, tempos[i], 0.45);
        const aparece = prog(t, t0 + 0.28 + i * 0.07, 0.35);
        const corC = corDoCartao(c);
        const rotuloMedido = encaixar(c.rotulo, { largura: larguraRotulo, max: 32, min: 30, linhas: 2, fonte: { mono: true, caixaAlta: true, espacamento: 0.03 } });
        // números pequenos e inteiros (1 lata, 3 colheres) não contam: "0 lata" não existe
        const conta = c.valor !== undefined && !(Number.isInteger(c.valor) && Math.abs(c.valor) < 10);
        const contagem = c.valor === undefined ? 0 : conta ? c.valor * prog(t, tempos[i], 1.0, calculo) : c.valor;
        const estado = c.valor === undefined && c.texto ? encaixar(c.texto, { largura: larguraValor, max: corpoEstado, min: corpoEstado, linhas: 3, fonte: { peso: 600, espacamento: -0.015 } }) : null;
        const conteudo =
          c.valor !== undefined ? (
            <Valor v={{ prefixo: c.prefixo, numero: formatar(contagem, c.casas ?? 0), sufixo: c.sufixo }} tamanho={corpoNumero} cor={corC} />
          ) : estado ? (
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: estado.tamanho, lineHeight: 1.06, letterSpacing: "-0.015em", color: corC }}>
              {estado.linhas.map((l) => (
                <div key={l} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
          ) : null;
        return (
          <div key={`${c.rotulo}-${i}`}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: W,
                height: H,
                boxSizing: "border-box",
                borderRadius: 24,
                border: `2px ${p > 0 ? "solid" : "dashed"} ${i === atual && p > 0 ? (corC === cor.texto ? cor.positivo : corC) : p > 0 ? cor.linha : "rgba(226,238,231,0.2)"}`,
                background: `rgba(237,243,239,${0.035 * p})`,
                opacity: aparece,
              }}
            />
            {/* nome do indicador: apagado enquanto espera, aceso quando é dito */}
            <div
              style={{
                position: "absolute",
                left: x + 34,
                top: linhasLargas ? y + H / 2 - (rotuloMedido.linhas.length * rotuloMedido.tamanho * 1.2) / 2 : y + 30,
                fontFamily: mono,
                fontWeight: 500,
                fontSize: rotuloMedido.tamanho,
                lineHeight: 1.2,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                color: p > 0 ? cor.ambar : cor.apagado,
                opacity: aparece,
              }}
            >
              {rotuloMedido.linhas.map((l) => (
                <div key={l} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
            {c.tendencia ? (
              <div style={{ position: "absolute", left: x + W - 64 - 26, top: linhasLargas ? y + 22 : y + 24, opacity: aparece }}>
                <Seta tipo={c.tendencia} c={c.tendencia === "cai" ? cor.negativo : c.tendencia === "sobe" ? cor.positivo : cor.neutro} p={prog(t, tempos[i] + 0.2, 0.5)} />
              </div>
            ) : null}
            {/* o valor ou o estado */}
            <div
              style={{
                position: "absolute",
                ...(linhasLargas
                  ? { right: PLANO.w - (x + W) + (c.tendencia ? 110 : 34), top: y, height: H, display: "flex", alignItems: "center" }
                  : { left: x + 34, bottom: PLANO.h - (y + H) + 30 }),
              }}
            >
              {p <= 0 ? (
                <div style={{ height: 16, width: 150, borderRadius: 8, background: "rgba(226,238,231,0.1)", opacity: aparece }} />
              ) : (
                <Revela p={p}>{conteudo}</Revela>
              )}
            </div>
            {/* o último que entrou respira */}
            {i === atual ? <Pulso x={x + W - 34} y={linhasLargas ? y + H - 30 : y + H - 34} desde={tempos[i] + 0.4} c={corC === cor.texto ? cor.positivo : corC} /> : null}
          </div>
        );
      })}
    </Painel>
  );
};

const Pulso: React.FC<{ x: number; y: number; desde: number; c: string }> = ({ x, y, desde, c }) => {
  const t = useTempo();
  const d = t - desde;
  const p = d < 0 ? 0 : (d % 1.2) / 1.2;
  return (
    <>
      <div style={{ position: "absolute", left: x - 7, top: y - 7, width: 14, height: 14, borderRadius: "50%", background: c, opacity: prog(t, desde - 0.3, 0.3) }} />
      <div
        style={{
          position: "absolute",
          left: x - 7 - 16 * p,
          top: y - 7 - 16 * p,
          width: 14 + 32 * p,
          height: 14 + 32 * p,
          borderRadius: "50%",
          border: `2px solid ${c}`,
          opacity: p > 0 ? 0.7 * (1 - p) : 0,
        }}
      />
    </>
  );
};
