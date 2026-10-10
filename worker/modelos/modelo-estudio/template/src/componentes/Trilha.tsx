// Trilha: a história no tempo. A pessoa fica na coluna da esquerda; à direita, o começo pequeno
// ("DIA 1 · 10:00 minutos por dia") e o ponto grande: um número que conta ("1 ANO · 300 textos") ou,
// sem número dito, um texto que acende ("Ciclo de alta"). Embaixo, a trilha do tempo: barras como a
// onda de um período inteiro, que se preenchem junto com o contador; no fim dela chega o marco
// ("1º cliente"). A forma das barras (`curva`) acompanha a história: assenta, sobe, cai ou oscila.
import { formatarNumero, limitar, Linhas, prog, relogio, saindo, temposDoTexto, Traco } from "../anim";
import { abaixoDoQuadro, ANTES, FIM_DO_RECUO, LUGARES, TROCA } from "../layout";
import { caber, medir } from "../medidas";
import type { Palavra, PontoDaTrilha, Trilha as TrilhaT } from "../plano";
import { comAlfa, cor, MARGEM, mono, rotulo, sans, titulo, W } from "../tema";
import { Ilustrativo } from "./comum";

const BARRAS = 52;
// a trilha termina antes da borda direita (lá ficam os botões do app)
const DIREITA = 960;

const ruido = (i: number) => {
  const x = Math.sin(i * 91.7 + 13.1) * 24634.6345;
  return x - Math.floor(x);
};
// as barras do período: "constante" começa irregular e vai ficando constante (com uma ou outra
// barra fraca); "sobe", "cai" e "oscila" seguem a forma pedida, com a mesma irregularidade leve
export const barrasDaTrilha = (curva: TrilhaT["curva"] = "constante") =>
  Array.from({ length: BARRAS }, (_, i) => {
    const x = i / (BARRAS - 1);
    const fraca = ruido(i + 7) < 0.1 ? 0.45 : 1;
    const variacao = (ruido(i) - 0.5) * 0.36;
    if (curva === "sobe") return limitar(0.16 + 0.8 * Math.pow(x, 1.35) + variacao * 0.5, 0.12, 1);
    if (curva === "cai") return limitar(0.96 - 0.8 * Math.pow(x, 0.8) + variacao * 0.5, 0.12, 1);
    if (curva === "oscila") return limitar(0.55 + 0.32 * Math.sin(x * Math.PI * 4 - 0.6) + variacao * 0.6, 0.12, 1);
    const base = 0.42 + 0.42 * x;
    return limitar((base + variacao) * fraca, 0.14, 1);
  });

export const colunaDaTrilha = () => {
  const c = LUGARES.trilha.caixa;
  const x = c.x + c.w + 36;
  return { x, y: c.y, w: W - MARGEM - x, h: c.h + 16 + LUGARES.trilha.onda };
};

// o número já formatado (pt-BR) e o "esboço" dele (os algarismos a lápis, antes de contar)
const numeroDe = (p: PontoDaTrilha, v: number) => formatarNumero(v, p.casas ?? 0);
const esboco = (texto: string) => texto.replace(/\d/g, "0");

// O valor de um ponto da coluna: número (com prefixo e sufixo menores) ou, sem número, o texto
export const Valor: React.FC<{
  ponto: PontoDaTrilha;
  progresso: number;
  aceso: boolean;
  largura: number;
  maximo: number;
  fonte: "mono" | "sans";
  palavras: Palavra[];
  t: number;
  de: number;
  ate: number;
  // altura disponível (o texto diminui para caber)
  altura?: number;
}> = ({ ponto, progresso, aceso, largura, maximo, fonte, palavras, t, de, ate, altura }) => {
  if (ponto.valor === undefined || !Number.isFinite(ponto.valor)) {
    // sem número: o texto (de 1 a 3 linhas) acende palavra por palavra quando é dito
    const texto = ponto.texto ?? "";
    if (!texto) return null;
    const { linhas, tam } = caber(texto, { largura, maximo, minimo: Math.min(maximo, 56), linhas: 3, entrelinha: 1.02, altura, piso: 40 });
    const tempos = temposDoTexto(texto, palavras, de, ate, ponto.em);
    return <Linhas linhas={linhas} tempos={tempos} t={t} tam={tam} modo="acende" entrelinha={1.02} estilo={{ ...titulo, fontSize: tam }} />;
  }
  const final = ponto.relogio ? relogio(ponto.valor * 60) : numeroDe(ponto, ponto.valor);
  const texto = progresso > 0 ? (ponto.relogio ? relogio(ponto.valor * 60 * progresso) : numeroDe(ponto, ponto.valor * progresso)) : esboco(final);
  const pre = ponto.relogio ? "" : (ponto.prefixo ?? "");
  const suf = ponto.relogio ? "" : (ponto.sufixo ?? "");
  const escalaPre = 0.42;
  const escalaSuf = 0.5;
  const larguraEm1 = (s: string, escala: number, mono = false) => (mono ? s.length * 0.72 * escala : medir(s, escala, 800));
  const total =
    larguraEm1(final, 1, fonte === "mono") + (pre ? larguraEm1(pre, escalaPre) + 0.08 : 0) + (suf ? larguraEm1(suf, escalaSuf) + 0.08 : 0);
  const tam = Math.min(maximo, (largura - 6) / Math.max(0.1, total), altura !== undefined ? altura / (fonte === "mono" ? 1.1 : 0.98) : Infinity);
  const estilo: React.CSSProperties =
    fonte === "mono"
      ? { fontFamily: mono, fontWeight: 500, fontSize: tam, lineHeight: 1.1 }
      : { ...titulo, fontSize: tam, lineHeight: 0.98, fontVariantNumeric: "tabular-nums" };
  const corNum = aceso ? cor.texto : cor.apagado;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", whiteSpace: "nowrap" }}>
      {pre ? (
        <span style={{ ...titulo, fontSize: tam * escalaPre, lineHeight: 1, marginTop: tam * 0.1, marginRight: tam * 0.08, color: aceso ? cor.textoSuave : cor.apagado }}>{pre}</span>
      ) : null}
      <span style={{ ...estilo, color: corNum }}>{texto}</span>
      {suf ? (
        <span style={{ ...titulo, fontSize: tam * escalaSuf, lineHeight: 1, alignSelf: "flex-end", marginBottom: tam * 0.12, marginLeft: tam * 0.08, color: corNum }}>{suf}</span>
      ) : null}
    </div>
  );
};

export const Trilha: React.FC<{ m: TrilhaT; palavras: Palavra[]; t: number; fim: number }> = ({ m, palavras, t, fim }) => {
  const col = colunaDaTrilha();
  const topo = abaixoDoQuadro("trilha");
  // a coluna da direita só entra quando o quadro já liberou o lado direito (desliza de lá); no fim
  // ela some inteira enquanto o quadro seguinte cresce por cima (nada fica aparecendo pela metade)
  const entraColuna = prog(t, Math.max(m.de - ANTES + TROCA * 0.8, FIM_DO_RECUO), 0.4) * (1 - saindo(t, fim + 0.02, 0.2));
  // a trilha de baixo entra por trás do cartão que desce e sai rápido (a próxima arte usa a faixa)
  const entra = prog(t, m.de + 0.02, 0.45);
  const s = prog(t, fim - 0.2, 0.24);
  const vis = entra * (1 - s);

  // bloco do começo
  const ini = m.inicio;
  const pIni = ini ? prog(t, ini.em - 0.05, 0.8, (x) => x) : 0;
  const tamUnidadeIni = ini?.unidade ? Math.max(34, Math.min(42, (col.w - 4) / Math.max(0.1, medir(ini.unidade, 1, 600)))) : 42;

  // contagem: a trilha se preenche de `em` até um pouco depois de `ate`
  const cont = m.contagem;
  const ateCont = cont.ate ?? cont.em + 1.4;
  const ps = barrasDaTrilha(m.curva);
  const total = ps.reduce((a, b) => a + b, 0);
  const pVarre = prog(t, cont.em, Math.max(0.6, ateCont - cont.em + 0.25), (x) => x);
  const frente = pVarre * BARRAS;
  let acumulado = 0;
  ps.forEach((v, i) => {
    acumulado += v * limitar(frente - i);
  });
  const acesoCont = prog(t, cont.em - 0.05, 0.25);
  // as unidades ficam numa linha só na coluna: o corpo diminui se forem compridas (até 34 px)
  const tamUnidade = cont.unidade ? Math.max(34, Math.min(58, (col.w - 4) / Math.max(0.1, medir(cont.unidade, 1, 700)))) : 58;

  // trilha
  const largura = DIREITA - MARGEM;
  const passo = largura / BARRAS;
  const barra = Math.min(11, passo * 0.6);
  const centro = topo + 140;
  const meia = 122;
  const pontas = m.pontas ?? [ini?.rotulo ?? "", cont.rotulo ?? ""];

  // marco
  const marco = m.marco;
  const pMarco = marco ? prog(t, marco.em - 0.04, 0.3) : 0;
  const tamMarco = marco ? Math.max(32, Math.min(42, (largura - 300) / Math.max(0.1, medir(marco.texto, 1, 700)))) : 42;
  const larguraMarco = marco ? medir(marco.texto, tamMarco, 700) + 54 : 0;
  const xMarco = DIREITA - passo / 2;
  const yMarco = topo - 76;

  // a coluna tem altura certa (até o marco): os valores dividem o que sobra depois dos rótulos
  const semValor = (p?: PontoDaTrilha) => !!p && (p.valor === undefined || !Number.isFinite(p.valor)) && !p.relogio;
  const orcamento = yMarco - 20 - (col.y + (ini ? 4 : 160));
  const fixos =
    (ini ? (ini.rotulo ? 48 : 0) + (ini.unidade ? tamUnidadeIni * 1.15 + 6 : 0) + 94 : 0) + (cont.rotulo ? 42 : 0) + (cont.unidade ? tamUnidade * 1.1 : 0);
  const sobra = Math.max(160, orcamento - fixos);
  // o começo é pequeno: texto até 72 px, número/relógio até 112 px (no máximo ~38% do que sobra)
  const maxIni = ini ? (semValor(ini) ? 72 : 112) : 0;
  const alturaIni = ini ? Math.min(sobra * 0.38, semValor(ini) ? 2 * maxIni * 1.02 : maxIni * 1.1) : 0;
  const alturaCont = sobra - alturaIni;

  return (
    <>
      {/* coluna da direita: o começo e o ponto grande (sem o começo, o ponto grande desce para o meio) */}
      <div style={{ position: "absolute", left: col.x, top: col.y + (ini ? 4 : 160), width: col.w, opacity: entraColuna, translate: `${(1 - entraColuna) * 90}px 0` }}>
        {ini ? (
          <div>
            {ini.rotulo ? <div style={{ ...rotulo, fontSize: 34, color: cor.acento }}>{ini.rotulo}</div> : null}
            <div style={{ marginTop: ini.rotulo ? 14 : 0 }}>
              <Valor
                ponto={ini}
                progresso={pIni}
                aceso={pIni > 0}
                largura={col.w - 4}
                maximo={maxIni}
                altura={alturaIni}
                fonte={ini.relogio || ini.valor !== undefined ? "mono" : "sans"}
                palavras={palavras}
                t={t}
                de={m.de}
                ate={m.ate}
              />
            </div>
            {ini.unidade ? (
              <div style={{ fontFamily: sans, fontWeight: 600, fontSize: tamUnidadeIni, lineHeight: 1.15, marginTop: 6, whiteSpace: "nowrap", color: pIni > 0 ? cor.textoSuave : cor.apagado }}>
                {ini.unidade}
              </div>
            ) : null}
          </div>
        ) : null}
        {ini ? (
          <svg width={40} height={66} style={{ display: "block", margin: "18px 0 10px 4px" }}>
            <line x1={14} y1={4} x2={14} y2={60} stroke={cor.apagado} strokeWidth={4} strokeDasharray="6 9" strokeLinecap="round" />
            <Traco d="M14 4 L14 60" p={acesoCont} cor={cor.acento} largura={4} />
          </svg>
        ) : null}
        {cont.rotulo ? <div style={{ ...rotulo, fontSize: 34, color: acesoCont > 0.5 ? cor.acento : cor.apagadoForte }}>{cont.rotulo}</div> : null}
        <div style={{ marginTop: cont.rotulo ? 8 : 0 }}>
          <Valor
            ponto={cont}
            progresso={pVarre > 0 ? acumulado / total : 0}
            aceso={pVarre > 0}
            largura={col.w}
            maximo={semValor(cont) ? 104 : 220}
            altura={alturaCont}
            fonte="sans"
            palavras={palavras}
            t={t}
            de={m.de}
            ate={m.ate}
          />
        </div>
        {cont.unidade ? (
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: tamUnidade, lineHeight: 1.1, whiteSpace: "nowrap", color: acesoCont > 0.5 ? cor.texto : cor.apagado }}>{cont.unidade}</div>
        ) : null}
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: vis, translate: `0 ${70 * s}px` }}>
        {/* a trilha do período, a lápis até a varredura passar */}
        <svg width={W} height={meia * 2 + 140} style={{ position: "absolute", left: 0, top: centro - meia - 70, overflow: "visible" }}>
          {ps.map((v, i) => {
            const x = MARGEM + passo * (i + 0.5);
            const h = Math.max(10, v * meia * 2);
            const cheio = limitar(frente - i);
            return (
              <g key={i}>
                <rect x={x - barra / 2} y={meia + 70 - h / 2} width={barra} height={h} rx={barra / 2} fill={cor.apagado} />
                {cheio > 0 ? <rect x={x - barra / 2} y={meia + 70 - h / 2} width={barra} height={h} rx={barra / 2} fill={comAlfa(cor.acento, cheio)} /> : null}
              </g>
            );
          })}
          {/* a agulha que corre com a contagem */}
          {pVarre > 0 && pVarre < 1 ? (
            <line x1={MARGEM + frente * passo} x2={MARGEM + frente * passo} y1={70 - 10} y2={meia * 2 + 70 + 10} stroke={cor.texto} strokeWidth={3} strokeLinecap="round" />
          ) : null}
        </svg>
        <div style={{ position: "absolute", left: MARGEM, top: centro + meia + 22, width: largura, display: "flex", justifyContent: "space-between" }}>
          <span style={{ ...rotulo, fontSize: 34, color: cor.textoSuave }}>{pontas[0]}</span>
          <span style={{ ...rotulo, fontSize: 34, color: pVarre >= 1 ? cor.texto : cor.textoSuave }}>{pontas[1]}</span>
        </div>
        {m.ilustrativo ? (
          <div style={{ position: "absolute", left: MARGEM, top: centro + meia + 16, width: largura, display: "flex", justifyContent: "center" }}>
            <Ilustrativo />
          </div>
        ) : null}

        {/* o marco no fim da trilha: esboço tracejado até ser dito */}
        {marco ? (
          <>
            <svg width={W} height={200} style={{ position: "absolute", left: 0, top: yMarco + 30, overflow: "visible" }}>
              <line x1={xMarco} y1={34} x2={xMarco} y2={centro - (yMarco + 30)} stroke={cor.apagado} strokeWidth={3} strokeDasharray="5 8" />
              <Traco d={`M${xMarco} 34 L${xMarco} ${centro - (yMarco + 30)}`} p={prog(t, marco.em + 0.1, 0.35)} cor={cor.acento} largura={4} />
            </svg>
            <div
              style={{
                position: "absolute",
                left: DIREITA - larguraMarco,
                top: yMarco,
                width: larguraMarco,
                height: 66,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: pMarco > 0.02 ? comAlfa(cor.acento, pMarco) : "transparent",
                boxShadow: pMarco > 0.98 ? "none" : `inset 0 0 0 2.5px ${cor.apagado}`,
                scale: String(0.92 + 0.08 * pMarco),
                transformOrigin: "right center",
              }}
            >
              <span style={{ fontFamily: sans, fontWeight: 700, fontSize: tamMarco, whiteSpace: "nowrap", color: pMarco > 0.5 ? cor.sobreAcento : cor.apagadoForte }}>{marco.texto}</span>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};
