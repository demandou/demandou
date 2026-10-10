import { calculo, contar, prog, Revela, useTempo } from "../anim";
import { PAINEL } from "../layout";
import { encaixar } from "../medida";
import type { Destaque as TDestaque, Lado } from "../plano";
import { casasDe, cor, formatar, mono, sans } from "../tema";
import { Painel } from "./Painel";
import { formaDaTendencia, IndicadorDeTendencia } from "./Tendencia";
import { Valor } from "./Valor";

// Barras que crescem uma a uma; no `em` (ou `grifoEm`) uma faixa delas acende e ganha uma chave
// com a soma e o `texto`. Sem números ditos (`ilustrativo`), as alturas são só a forma e a chave
// leva apenas o texto.
export const DestaqueEmBarras: React.FC<{ m: TDestaque; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number }> = ({
  m,
  lado,
  t0,
  fimCabecalho,
  fimCorpo,
}) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const eixo = m.eixo ?? [];
  const ilustrativo = !!m.ilustrativo || !(m.valores?.length);
  const valores = m.valores?.length ? m.valores : formaDaTendencia("sobe", Math.max(2, eixo.length));
  const n = valores.length;
  const prefixo = m.prefixo ?? "";
  const sufixo = m.sufixo ?? "";
  const casas = casasDe(valores);
  const maximo = Math.max(...valores, 1e-9);
  const faixa = m.faixa ?? { de: n - 1, ate: n - 1 };
  const tendenciaDasBarras = valores[n - 1] > valores[0] * 1.15 ? "sobe" : valores[n - 1] < valores[0] * 0.85 ? "cai" : "oscila";
  const grifoEm = m.grifoEm ?? m.em;
  const textoFaixa = m.faixa?.texto ?? m.texto;
  // rótulos embaixo das barras: o corpo que cabe na coluna (até 2 linhas)
  const colunaRotulo = (direita - esquerda) / n;
  const medidasEixo = eixo.map((r) => encaixar(r, { largura: colunaRotulo + 20, max: 32, min: 28, linhas: 2, fonte: { mono: true } }));
  const corpoEixo = Math.min(32, ...medidasEixo.map((x) => x.tamanho));
  const duasLinhas = medidasEixo.some((x) => x.linhas.length > 1);
  const yBase = base - (duasLinhas ? 96 : 60);
  // as barras ocupam quase todo o corpo; sobra em cima só o espaço da soma da faixa
  const alturaMax = yBase - (topo + 172);
  const passo = (direita - esquerda) / n;
  const largura = passo * 0.72;
  const X = (i: number) => esquerda + passo * i + (passo - largura) / 2;
  const H = (v: number) => (v / maximo) * alturaMax;
  const [fa, fb] = [Math.max(0, faixa.de), Math.min(n - 1, faixa.ate)];
  const naFaixa = (i: number) => i >= fa && i <= fb;
  const pGrifo = prog(t, grifoEm, 0.5);
  const soma = valores.slice(fa, fb + 1).reduce((s, v) => s + v, 0);

  // chave sobre a faixa
  const xa = X(fa) - 8;
  const xb = X(fb) + largura + 8;
  const yChave = yBase - H(Math.max(...valores.slice(fa, fb + 1))) - 34;
  const pChave = prog(t, grifoEm + 0.1, 0.6);
  const meio = (xa + xb) / 2;

  const numero = ilustrativo ? undefined : m.numero;
  const valorTopo = numero
    ? { prefixo: numero.prefixo, numero: formatar(contar(t, numero, 1.0), numero.casas ?? 0), sufixo: numero.sufixo }
    : undefined;
  const valorFinal = numero ? { prefixo: numero.prefixo, numero: formatar(numero.para, numero.casas ?? 0), sufixo: numero.sufixo } : undefined;
  // sem números: só o texto sobre a faixa, no corpo que cabe
  const medidaFaixa = ilustrativo && textoFaixa ? encaixar(textoFaixa, { largura: 620, max: 52, min: 36, linhas: 2, fonte: { peso: 600 } }) : null;
  const alturaTopo = medidaFaixa ? medidaFaixa.linhas.length * medidaFaixa.tamanho * 1.1 + 22 : 132;
  // a soma fica sobre a faixa, alinhada ao lado de fora dela
  const faixaADireita = (xa + xb) / 2 > (esquerda + direita) / 2;

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
      ilustrativo={ilustrativo}
      etiquetaEsquerda={faixaADireita}
      indicador={ilustrativo ? <IndicadorDeTendencia tipo={tendenciaDasBarras} em={t0 + 0.3} largura={PAINEL.cabecalho.largura} /> : undefined}
      valor={valorTopo}
      valorTexto={numero?.texto}
      valorEm={numero?.em}
      valorFinal={valorFinal}
    >
      {/* linha de base */}
      <div
        style={{
          position: "absolute",
          left: esquerda,
          top: yBase,
          width: (direita - esquerda) * prog(t, t0, 0.5),
          height: 2,
          background: cor.linhaForte,
        }}
      />
      {/* trilhos: o espaço de cada barra aparece antes dela crescer */}
      {valores.map((_, i) => (
        <div
          key={`trilho${i}`}
          style={{
            position: "absolute",
            left: X(i),
            top: yBase - alturaMax - 2,
            width: largura,
            height: alturaMax,
            borderRadius: "8px 8px 0 0",
            background: "rgba(226,238,231,0.05)",
            opacity: prog(t, t0 + i * 0.04, 0.4),
          }}
        />
      ))}
      {valores.map((v, i) => {
        const p = prog(t, t0 + 0.15 + i * 0.075, 0.5);
        const h = H(v) * p;
        const acesa = naFaixa(i) ? pGrifo : 0;
        const apagada = naFaixa(i) ? 0 : pGrifo;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: X(i),
                top: yBase - h - 2,
                width: largura,
                height: h,
                borderRadius: "8px 8px 0 0",
                background: acesa > 0 ? cor.positivo : cor.neutro,
                opacity: acesa > 0 ? 0.55 + 0.45 * acesa : 0.7 - 0.4 * apagada,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: X(i) - 20,
                width: largura + 40,
                top: yBase + 14,
                textAlign: "center",
                fontFamily: mono,
                fontSize: corpoEixo,
                lineHeight: duasLinhas ? 1.15 : undefined,
                fontWeight: acesa > 0.5 ? 500 : 400,
                color: acesa > 0.5 ? cor.positivo : cor.apagado,
                opacity: prog(t, t0 + i * 0.04, 0.4),
              }}
            >
              {medidasEixo[i]
                ? encaixar(eixo[i], { largura: colunaRotulo + 20, max: corpoEixo, min: corpoEixo, linhas: 2, fonte: { mono: true } }).linhas.map((l) => (
                    <div key={l} style={{ whiteSpace: "nowrap" }}>
                      {l}
                    </div>
                  ))
                : null}
            </div>
          </div>
        );
      })}
      {/* chave e soma da faixa */}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M${meio - (meio - xa) * pChave},${yChave + 16} L${meio - (meio - xa) * pChave},${yChave} L${meio + (xb - meio) * pChave},${yChave} L${meio + (xb - meio) * pChave},${yChave + 16}`}
          fill="none"
          stroke={cor.positivo}
          strokeWidth={3}
          opacity={pChave > 0 ? 1 : 0}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          ...(faixaADireita ? { right: 1080 - xb } : { left: xa }),
          top: yChave - alturaTopo,
          textAlign: faixaADireita ? "right" : "left",
        }}
      >
        <Revela p={prog(t, grifoEm + 0.25, 0.5)}>
          {ilustrativo ? null : (
            <div style={{ display: "flex", justifyContent: faixaADireita ? "flex-end" : "flex-start" }}>
              <Valor v={{ prefixo, numero: formatar(soma * prog(t, grifoEm + 0.25, 0.9, calculo), casas), sufixo }} tamanho={66} cor={cor.positivo} />
            </div>
          )}
          {textoFaixa && ilustrativo && medidaFaixa ? (
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: medidaFaixa.tamanho, lineHeight: 1.1, color: cor.positivo }}>
              {medidaFaixa.linhas.map((l) => (
                <div key={l} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
          ) : textoFaixa ? (
            <div style={{ marginTop: 10, fontFamily: sans, fontWeight: 500, fontSize: 40, color: cor.texto, whiteSpace: "nowrap" }}>{textoFaixa}</div>
          ) : null}
        </Revela>
      </div>
    </Painel>
  );
};
