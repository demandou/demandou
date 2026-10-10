// Etiqueta (um valor que muda), no formato alto do vídeo de exemplo (`quadro: "lateral"`: o painel
// em pé à esquerda, a pessoa na coluna da direita). O formato padrão, na tela dividida em faixas,
// está em EtiquetaDividida.tsx.
// Em cima, a taxa que conta ("INFLAÇÃO DO ANO 5%"). Embaixo, duas "vagas" de etiqueta ligadas por
// um trilho tracejado com seta: tudo nasce "a lápis". A etiqueta de baixo ganha cor quando o preço
// de antes é dito; no "passou a custar" ela SOBE pelo trilho até a vaga de cima enquanto o preço
// rola até o novo valor. Embaixo fica o contorno do preço antigo e, no trilho, o selo da diferença.
import { limitar, Palavras, prog, temposDoTexto, troca } from "../anim";
import type { Area } from "../layout";
import { caber, diagramar } from "../medidas";
import type { Etiqueta as E, Palavra } from "../plano";
import { cor, manchete, numeros, rotulo } from "../tema";
import { contando } from "../valores";
import { Seta } from "./Icones";
import { Rolante } from "./Rolante";

// etiqueta grande: ocupa a largura da coluna (540 − margens de 35)
const LARG = 470;
const ALT = 366;
const CHANFRO = 78;
const FURO = { x: LARG / 2, y: 50 };
const TOPO_TEXTO = 100;

const forma = `M 0 ${CHANFRO} L ${CHANFRO} 0 L ${LARG - CHANFRO} 0 L ${LARG} ${CHANFRO} L ${LARG} ${ALT - 14} Q ${LARG} ${ALT} ${LARG - 14} ${ALT} L 14 ${ALT} Q 0 ${ALT} 0 ${ALT - 14} Z`;

// contorno tracejado de uma etiqueta ("a lápis")
const Contorno: React.FC<{ opacidade?: number }> = ({ opacidade = 0.6 }) => (
  <svg width={LARG} height={ALT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <path d={forma} fill="none" stroke={cor.celeste} strokeOpacity={opacidade} strokeWidth={4} strokeDasharray="14 12" />
    <circle cx={FURO.x} cy={FURO.y} r={15} fill="none" stroke={cor.celeste} strokeOpacity={opacidade} strokeWidth={4} />
  </svg>
);

// Formato alto (`quadro: "lateral"`, o do vídeo de exemplo): painel em pé à esquerda.
export const EtiquetaLateral: React.FC<{ m: E; palavras: Palavra[]; t: number; area: Area; entra: number }> = ({ m, palavras, t, area, entra }) => {
  // a entrada e a saída são da troca de quadro: aqui o painel só desenha
  if (t < entra) return null;
  const pBaixo = 1;
  const x0 = 35;
  const largura = area.w - 2 * x0;
  const cx = area.x + area.w / 2;

  // taxa
  const taxa = m.taxa;
  const temposTaxa = taxa ? temposDoTexto(taxa.rotulo, palavras, m.de, m.ate, entra + 0.15) : [];
  const pConta = taxa ? prog(t, taxa.em - 0.04, 0.6) : 0;
  const tamTaxa = taxa ? diagramar(taxa.valor, { largura, maximo: 150, minimo: 90, linhas: 1, corte: { peso: 900, alta: true, tabular: true } }).tam : 0;
  const pLinha = taxa ? prog(t, taxa.em, 0.6) : 0;

  // as duas vagas e o trilho
  const desce = m.sentido === "desce";
  const yCima = area.y + 268;
  const yBaixo = yCima + ALT + 150;
  const yA = desce ? yCima : yBaixo;
  const yB = desce ? yBaixo : yCima;
  const xEt = cx - LARG / 2;
  const trilho = { de: yCima + ALT + 16, ate: yBaixo - 16 };
  const ySelo = (trilho.de + trilho.ate) / 2;

  // o rótulo de antes é dito pouco antes do valor de antes ("custava R$ 100")
  const temposAntes = temposDoTexto(m.antes.rotulo, palavras, m.de, m.ate, Math.max(entra + 0.3, m.antes.em - 1.2));
  const sobeEm = m.sobeEm ?? temposDoTexto(m.depois.rotulo, palavras, m.de, m.ate, m.antes.em + 0.05)[0];
  const temposDepois = temposDoTexto(m.depois.rotulo, palavras, m.de, m.ate, sobeEm - 0.05);
  // a etiqueta ganha cor quando o rótulo de antes começa a ser dito; o preço acende no valor
  const pCor = prog(t, Math.min(temposAntes[0] ?? m.antes.em, m.antes.em) - 0.08, 0.35);
  const pPreco = prog(t, m.antes.em - 0.04, 0.35);
  const pSobe = prog(t, sobeEm, Math.max(0.5, m.depois.em + 0.25 - sobeEm), troca);
  const pRola = prog(t, m.depois.em - 0.04, 0.5, troca);
  const pTrocaRotulo = prog(t, sobeEm - 0.08, 0.3);
  const pSelo = prog(t, m.depois.em + 0.3, 0.34);
  const yEtiqueta = yA + (yB - yA) * pSobe;

  const corteValor = { peso: 900 as const, alta: true, tabular: true };
  const tamValor = Math.min(
    caber(m.antes.valor, { largura: LARG - 56, maximo: 128, minimo: 60, linhas: 1, corte: corteValor }).tam,
    caber(m.depois.valor, { largura: LARG - 56, maximo: 128, minimo: 60, linhas: 1, corte: corteValor }).tam,
  );
  const tamRotulo = (txt: string) => caber(txt, { largura: LARG - 48, maximo: 40, minimo: 30, linhas: 1, corte: { peso: 800, alta: true, espacamento: 0.06 } }).tam;
  const valorEstilo: React.CSSProperties = { ...manchete, ...numeros, fontSize: tamValor, letterSpacing: 0 };

  // conteúdo "a lápis" de uma vaga
  const Esboco: React.FC<{ rotuloTxt: string; valor: string }> = ({ rotuloTxt, valor }) => (
    <div style={{ position: "absolute", left: 0, top: TOPO_TEXTO, width: LARG, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ ...rotulo, fontSize: tamRotulo(rotuloTxt), color: cor.apagadoNoAzul }}>{rotuloTxt}</div>
      <div style={{ ...valorEstilo, color: cor.apagadoNoAzul }}>{valor}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {taxa ? (
        <div style={{ position: "absolute", left: x0, top: area.y + 18, width: largura, display: "flex", flexDirection: "column", gap: 8 }}>
          <Palavras palavras={taxa.rotulo.split(/\s+/)} tempos={temposTaxa} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.celeste} style={{ ...rotulo, fontSize: 40, flexWrap: "wrap", rowGap: 8 }} />
          <div style={{ position: "relative", ...manchete, ...numeros, fontSize: tamTaxa, letterSpacing: 0, lineHeight: 1.02 }}>
            <span style={{ color: cor.apagadoNoAzul, opacity: 1 - limitar(pConta * 4) }}>{taxa.valor}</span>
            <span style={{ position: "absolute", left: 0, top: 0, color: cor.branco, opacity: limitar(pConta * 4) }}>{contando(taxa.valor, pConta)}</span>
          </div>
          <div style={{ position: "relative", height: 5, width: largura, marginTop: 6 }}>
            <div style={{ position: "absolute", inset: 0, background: cor.apagadoNoAzul }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: largura * pLinha, background: cor.eletrico }} />
          </div>
        </div>
      ) : null}

      <div style={{ position: "absolute", inset: 0, opacity: pBaixo }}>
        {/* o trilho: tracejado "a lápis", acende em azul elétrico conforme a etiqueta anda */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={cx} x2={cx} y1={trilho.de + 20} y2={trilho.ate} stroke={cor.apagadoNoAzul} strokeWidth={5} strokeDasharray="10 12" />
          <line
            x1={cx}
            x2={cx}
            y1={desce ? trilho.de + 20 : trilho.ate}
            y2={desce ? trilho.de + 20 + (trilho.ate - trilho.de - 20) * pSobe : trilho.ate - (trilho.ate - trilho.de - 20) * pSobe}
            stroke={cor.eletrico}
            strokeWidth={6}
          />
        </svg>
        <Seta
          sentido={desce ? "desce" : "sobe"}
          tamanho={36}
          cor={pSobe > 0.95 ? cor.eletrico : cor.apagadoNoAzul}
          style={{ position: "absolute", left: cx - 18, top: desce ? trilho.ate - 20 : trilho.de - 4 }}
        />

        {/* a vaga de destino ("a lápis"), que some quando a etiqueta chega */}
        <div style={{ position: "absolute", left: xEt, top: yB, width: LARG, height: ALT, opacity: 1 - limitar(pSobe * 1.4) }}>
          <Contorno />
          <Esboco rotuloTxt={m.depois.rotulo} valor={m.depois.valor} />
        </div>
        {/* o contorno do preço antigo, que fica onde a etiqueta estava */}
        <div style={{ position: "absolute", left: xEt, top: yA, width: LARG, height: ALT, opacity: limitar(pSobe * 1.6) }}>
          <Contorno />
          <Esboco rotuloTxt={m.antes.rotulo} valor={m.antes.valor} />
        </div>

        {/* o selo da diferença, no meio do trilho */}
        {m.diferenca ? (
          <div style={{ position: "absolute", left: cx, top: ySelo, translate: "-50% -50%", height: 80, display: "flex" }}>
            <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, background: cor.estudio, opacity: 1 - pSelo }} />
            <div style={{ position: "absolute", inset: 0, background: cor.eletrico, opacity: pSelo }} />
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "0 24px", scale: String(0.94 + 0.06 * pSelo) }}>
              <Seta sentido={desce ? "desce" : "sobe"} tamanho={38} cor={pSelo > 0.5 ? cor.branco : cor.apagadoNoAzul} />
              <div style={{ ...manchete, ...numeros, fontSize: 54, color: pSelo > 0.5 ? cor.branco : cor.apagadoNoAzul, letterSpacing: 0, translate: "0 2px" }}>{m.diferenca}</div>
            </div>
          </div>
        ) : null}

        {/* a etiqueta */}
        <div style={{ position: "absolute", left: xEt, top: yEtiqueta, width: LARG, height: ALT }}>
          {pCor < 1 ? <Contorno opacidade={0.6 * (1 - pCor)} /> : null}
          <svg width={LARG} height={ALT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <path d={forma} fill={cor.papel} fillOpacity={pCor} />
            <circle cx={FURO.x} cy={FURO.y} r={16} fill={cor.estudio} opacity={pCor} />
          </svg>
          {/* rótulo de antes e o de depois, cruzando */}
          <div style={{ position: "absolute", left: 0, top: TOPO_TEXTO, width: LARG, display: "flex", justifyContent: "center", opacity: 1 - pTrocaRotulo }}>
            <Palavras
              palavras={m.antes.rotulo.split(/\s+/)}
              tempos={temposAntes}
              t={t}
              esboco={pCor < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel}
              corDe={() => "rgba(11,29,110,0.62)"}
              alinhar="center"
              style={{ ...rotulo, fontSize: tamRotulo(m.antes.rotulo) }}
            />
          </div>
          <div style={{ position: "absolute", left: 0, top: TOPO_TEXTO, width: LARG, display: "flex", justifyContent: "center", opacity: pTrocaRotulo }}>
            <Palavras palavras={m.depois.rotulo.split(/\s+/)} tempos={temposDepois} t={t} esboco={cor.apagadoNoPapel} corDe={() => cor.eletrico} alinhar="center" style={{ ...rotulo, fontSize: tamRotulo(m.depois.rotulo) }} />
          </div>
          {/* o preço: "a lápis" até ser dito, depois rola para o novo valor */}
          <div style={{ position: "absolute", left: 0, top: TOPO_TEXTO + tamRotulo(m.antes.rotulo) + 18, width: LARG, display: "flex", justifyContent: "center" }}>
            <span style={{ position: "relative", display: "inline-block", ...valorEstilo }}>
              <span style={{ color: pCor < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel, opacity: 1 - pPreco }}>{m.antes.valor}</span>
              <span style={{ position: "absolute", left: 0, top: 0, color: cor.tinta, opacity: pPreco, translate: `0 ${(1 - pPreco) * 24}px` }}>
                <Rolante de={m.antes.valor} para={m.depois.valor} p={pRola} />
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
