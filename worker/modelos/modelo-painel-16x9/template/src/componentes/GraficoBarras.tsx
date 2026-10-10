import { calculo, prog, useTempo } from "../anim";
import { PAINEL } from "../layout";
import { encaixar } from "../medida";
import type { Grafico as TGrafico, Lado } from "../plano";
import { casasDe, cor, formatar, sans, separarUnidade } from "../tema";
import { chegadas } from "./GraficoLinha";
import { corDoTom } from "./Listas";
import { Painel } from "./Painel";
import { corDaTendencia, formaDaTendencia, IndicadorDeTendencia } from "./Tendencia";
import { corpoQueCabe, Valor } from "./Valor";

// Barras do Painel. Com `dados`: cada barra cresce quando o número dela é dito, com o valor em
// cima e o rótulo embaixo; a barra mais recente fica na cor de destaque e o contador do cabeçalho
// mostra o número dela. Com `tendencia`: barras ilustrativas que sobem/caem uma a uma, sem números.
export const GraficoBarras: React.FC<{ m: TGrafico; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number }> = ({
  m,
  lado,
  t0,
  fimCabecalho,
  fimCorpo,
}) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const dados = (m.dados ?? []).slice(0, 6);
  const qualitativo = dados.length < 2;
  const tipo = m.tendencia ?? "sobe";
  const unidade = separarUnidade(m.unidade);
  const prefixo = m.prefixo ?? unidade.prefixo;
  const sufixo = m.sufixo ?? unidade.sufixo;

  const rotulos = qualitativo ? (m.eixo ?? []).slice(0, 8) : dados.map((d) => d.rotulo);
  const n = qualitativo ? (rotulos.length >= 2 ? rotulos.length : 6) : dados.length;
  const valores = qualitativo ? formaDaTendencia(tipo, n) : dados.map((d) => d.valor);
  const casas = qualitativo ? 0 : casasDe(valores);
  const corDaQualitativa = m.tom ? corDoTom(m.tom) : corDaTendencia(tipo);
  const corDestaque = qualitativo ? corDaQualitativa : cor.positivo;
  const maximo = Math.max(...valores, 1e-9);

  // quando cada barra cresce
  const fimQualitativo = Math.max(t0 + 1.2, Math.min(m.tendenciaEm ?? t0 + 2.6, m.ate - 0.3));
  const inicios = qualitativo
    ? valores.map((_, i) => t0 + 0.3 + (i / Math.max(1, n - 1)) * (fimQualitativo - t0 - 0.6))
    : chegadas(
        dados.map((d) => d.em),
        t0,
      );
  const atual = inicios.filter((e) => t >= e).length - 1;

  // rótulos embaixo: até 2 linhas no corpo que cabe na largura da coluna
  const passo = (direita - esquerda) / n;
  const largura = Math.min(170, passo * 0.64);
  const medidas = rotulos.map((r) => encaixar(r, { largura: passo - 14, max: 36, min: 28, linhas: 2, fonte: { peso: 500 } }));
  const corpoRotulo = Math.min(...(medidas.length ? medidas.map((x) => x.tamanho) : [36]));
  const linhasRotulo = Math.max(1, ...medidas.map((x) => x.linhas.length));
  const alturaRotulos = rotulos.length ? linhasRotulo * corpoRotulo * 1.15 + 22 : 0;
  const yBase = base - Math.max(30, alturaRotulos);
  const alturaMax = yBase - (topo + (qualitativo ? 120 : 110));
  const X = (i: number) => esquerda + passo * i + (passo - largura) / 2;
  const H = (v: number) => (v / maximo) * alturaMax;

  // valor sobre a barra: o mesmo corpo em todas, o maior que cabe na coluna
  const textos = valores.map((v) => ({ prefixo: prefixo.trim() ? prefixo : undefined, numero: formatar(v, casas), sufixo: sufixo.trim() ? sufixo : undefined }));
  const corpoValor = Math.min(56, ...textos.map((v) => corpoQueCabe(v, passo - 10, 56)));
  const valorAtual = atual >= 0 ? valores[atual] * prog(t, inicios[atual], 0.6, calculo) : 0;

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
      ilustrativo={qualitativo || m.ilustrativo}
      valor={qualitativo ? undefined : { prefixo, numero: formatar(valorAtual, casas), sufixo }}
      valorFinal={{ prefixo, numero: formatar(maximo, casas), sufixo }}
      valorTexto={qualitativo || atual < 0 ? undefined : rotulos[atual]}
      valorEm={inicios[0]}
      indicador={qualitativo ? <IndicadorDeTendencia tipo={tipo} em={t0 + 0.3} leitura={m.leitura} leituraEm={m.tendenciaEm} largura={PAINEL.cabecalho.largura} cor={qualitativo ? corDaQualitativa : undefined} /> : undefined}
    >
      {/* linha de base */}
      <div style={{ position: "absolute", left: esquerda, top: yBase, width: (direita - esquerda) * prog(t, t0, 0.5), height: 2, background: cor.linhaForte }} />
      {valores.map((v, i) => {
        const p = prog(t, inicios[i], 0.6, calculo);
        const h = H(v) * p;
        const ultima = i === atual;
        const corBarra = ultima ? corDestaque : cor.neutro;
        return (
          <div key={i}>
            {/* trilho: o espaço da barra aparece antes dela crescer */}
            <div
              style={{
                position: "absolute",
                left: X(i),
                top: yBase - alturaMax - 2,
                width: largura,
                height: alturaMax,
                borderRadius: "10px 10px 0 0",
                background: "rgba(226,238,231,0.05)",
                opacity: prog(t, t0 + i * 0.04, 0.4),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: X(i),
                top: yBase - h - 2,
                width: largura,
                height: h,
                borderRadius: "10px 10px 0 0",
                background: corBarra,
                opacity: ultima ? 1 : 0.62,
              }}
            />
            {!qualitativo && p > 0 ? (
              <div style={{ position: "absolute", left: esquerda + passo * i, width: passo, top: yBase - h - corpoValor - 22, display: "flex", justifyContent: "center", opacity: prog(t, inicios[i] + 0.1, 0.3) }}>
                <Valor v={{ ...textos[i], numero: formatar(v * p, casas) }} tamanho={corpoValor} cor={ultima ? corDestaque : cor.texto} />
              </div>
            ) : null}
            {rotulos[i] ? (
              <div
                style={{
                  position: "absolute",
                  left: esquerda + passo * i,
                  width: passo,
                  top: yBase + 16,
                  textAlign: "center",
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: corpoRotulo,
                  lineHeight: 1.15,
                  color: ultima ? corDestaque : t >= inicios[i] ? cor.texto : cor.apagado,
                  opacity: prog(t, t0 + i * 0.04, 0.4),
                }}
              >
                {encaixar(rotulos[i], { largura: passo - 14, max: corpoRotulo, min: corpoRotulo, linhas: 2, fonte: { peso: 500 } }).linhas.map((l) => (
                  <div key={l} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </Painel>
  );
};
