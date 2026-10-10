import { calculo, prog, Revela, useTempo } from "../anim";
import { PAINEL } from "../layout";
import { encaixar } from "../medida";
import type { Divisao as TDivisao, Lado } from "../plano";
import { casasDe, cor, formatar, mono, sans, separarUnidade } from "../tema";
import { Painel } from "./Painel";
import { Valor } from "./Valor";

// tons das partes que não estão em destaque, da primeira para a última
const CINZAS = [cor.neutro, "#7F8F88", "#9DABA4", "#66756E"];

// Leitura do cabeçalho sem números: o nome da parte que acabou de entrar, na cor dela.
const Leitura: React.FC<{ texto: string; cor: string; p: number; largura: number }> = ({ texto, cor: c, p, largura }) => {
  const medida = encaixar(texto, { largura, max: 64, min: 44, linhas: 2, fonte: { peso: 600, espacamento: -0.015 } });
  return (
    <Revela p={p}>
      <div style={{ fontFamily: sans, fontWeight: 600, fontSize: medida.tamanho, lineHeight: 1.06, letterSpacing: "-0.015em", color: c }}>
        {medida.linhas.map((l) => (
          <div key={l} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </Revela>
  );
};

// Um todo que se divide: uma barra só, preenchida parte a parte, com contador e porcentagem.
// Sem números ditos (`ilustrativo` ou partes só com `peso`), a barra mostra só a proporção e os nomes.
export const Divisao: React.FC<{ m: TDivisao; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number }> = ({
  m,
  lado,
  t0,
  fimCabecalho,
  fimCorpo,
}) => {
  const t = useTempo();
  const { esquerda, direita, topo } = PAINEL.corpo;
  const itens = m.itens.slice(0, 5).map((it) => ({ ...it, valor: it.valor ?? it.peso ?? 1 }));
  const ilustrativo = !!m.ilustrativo || m.itens.slice(0, 5).some((it) => it.valor === undefined);
  const unidade = separarUnidade(m.unidade);
  const prefixo = m.prefixo ?? unidade.prefixo;
  const sufixo = m.sufixo ?? unidade.sufixo;
  const casas = casasDe(itens.map((i) => i.valor));
  // partes em porcentagem (somam ~100%): o total não diz nada; o cabeçalho mostra a parte em destaque
  const emPorcentagem = sufixo.trim() === "%";
  const total = itens.reduce((s, i) => s + i.valor, 0) || 1;
  const destaque = Math.min(itens.length - 1, Math.max(0, m.destaque ?? itens.length - 1));
  const largura = direita - esquerda;
  // o bloco (porcentagens + barra + régua + legenda) ocupa o corpo do quadro deitado, que é mais
  // baixo que o do vertical: barra mais baixa e a legenda numa fileira só
  const topoBloco = topo + 30;
  const yBarra = topoBloco + 76;
  const alturaBarra = 150;

  // cada parte cresce no seu `em`, uma depois da outra (nunca antes da barra aparecer)
  const inicios: number[] = [];
  itens.forEach((it, i) => inicios.push(Math.max(it.em, t0 + 0.15, i > 0 ? inicios[i - 1] + 0.45 : -Infinity)));
  const inicio = (i: number) => inicios[i];
  const pParte = (i: number) => prog(t, inicio(i), 0.7, calculo);
  const corDestaque = m.tom === "negativo" ? cor.negativo : m.tom === "neutro" ? cor.ambar : cor.positivo;
  const corParte = (i: number) => {
    if (i === destaque) return corDestaque;
    const fora = i < destaque ? i : i - 1;
    return CINZAS[fora % CINZAS.length];
  };

  let acumulado = 0;
  const partes = itens.map((it, i) => {
    const x = (acumulado / total) * largura;
    acumulado += it.valor;
    return { ...it, x, w: (it.valor / total) * largura, i };
  });

  const totalVisivel = itens.reduce((s, it, i) => s + it.valor * pParte(i), 0);
  const tamanhoValor = itens.length > 3 ? 52 : itens.length > 2 ? 60 : 84;
  // legenda: uma coluna por parte, todas na mesma fileira (o painel deitado é largo)
  const colunas = itens.length;
  const gapLegenda = 36;
  const larguraColuna = (largura - gapLegenda * (colunas - 1)) / colunas;
  const corpoTexto = Math.min(
    ...itens.map((it) =>
      encaixar(it.texto, { largura: larguraColuna, max: ilustrativo ? 50 : 42, min: 34, linhas: 2, fonte: { peso: 500 } }).tamanho,
    ),
  );
  const entrou = itens.map((_, i) => inicio(i)).filter((e) => t >= e).length - 1;

  // "juros sobre juros": no `grifoEm`, a parte em destaque se revela feita de fatias
  // (ex.: os juros de cada ano), cada uma maior que a anterior, da esquerda para a direita
  const fatias = m.fatias ?? [];
  const somaFatias = fatias.reduce((s, v) => s + v, 0);
  const parteDestaque = partes[destaque];
  const bordas: { x: number; w: number; em: number }[] = [];
  if (m.grifoEm !== undefined && somaFatias > 0 && parteDestaque) {
    let soma = 0;
    fatias.forEach((v, k) => {
      bordas.push({
        x: parteDestaque.x + (soma / somaFatias) * parteDestaque.w,
        w: (v / somaFatias) * parteDestaque.w,
        em: (m.grifoEm as number) + (k / fatias.length) * 1.1,
      });
      soma += v;
    });
  }

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
      valor={
        ilustrativo
          ? undefined
          : emPorcentagem
            ? { prefixo, numero: formatar(itens[destaque].valor * pParte(destaque), casas), sufixo }
            : { prefixo, numero: formatar(totalVisivel, casas), sufixo }
      }
      valorFinal={{ prefixo, numero: formatar(emPorcentagem ? itens[destaque].valor : total, casas), sufixo }}
      valorTexto={emPorcentagem ? (m.total ?? itens[destaque].texto) : m.total}
      valorEm={emPorcentagem ? inicio(destaque) : undefined}
      corValor={emPorcentagem ? corDestaque : cor.texto}
      ilustrativo={ilustrativo}
      indicador={
        ilustrativo && entrou >= 0 ? (
          <Leitura
            key={entrou}
            texto={itens[entrou].texto}
            cor={corParte(entrou)}
            p={prog(t, inicio(entrou) + 0.1, 0.45)}
            largura={PAINEL.cabecalho.largura}
          />
        ) : ilustrativo ? (
          <div />
        ) : undefined
      }
    >
      {/* porcentagem de cada parte, sobre ela (com números ditos e quando cabe) */}
      {partes.map((p) =>
        ilustrativo || p.w < 128 ? null : (
        <div
          key={`pct${p.i}`}
          style={{
            position: "absolute",
            left: esquerda + p.x,
            top: topoBloco,
            fontFamily: mono,
            fontWeight: 500,
            fontSize: 58,
            lineHeight: "64px",
            color: corParte(p.i),
            opacity: prog(t, inicio(p.i) + 0.2, 0.35),
          }}
        >
          {Math.round((p.valor / total) * 100 * pParte(p.i))}%
        </div>
        ),
      )}

      {/* a barra */}
      <div
        style={{
          position: "absolute",
          left: esquerda,
          top: yBarra,
          width: largura * prog(t, t0, 0.5),
          height: alturaBarra,
          borderRadius: 20,
          border: `2px solid ${cor.linhaForte}`,
          overflow: "hidden",
        }}
      >
        {partes.map((p) => (
          <div
            key={p.i}
            style={{
              position: "absolute",
              left: p.x,
              top: 0,
              bottom: 0,
              width: Math.max(0, p.w * pParte(p.i) - (p.i < partes.length - 1 ? 5 : 0)),
              background: corParte(p.i),
              opacity: p.i === destaque ? 1 : 0.85,
            }}
          />
        ))}
        {bordas.map((b, k) => {
          const p = prog(t, b.em, 0.35);
          return (
            <div key={`f${k}`}>
              {/* fatias alternam de tom, para ler uma a uma */}
              {k % 2 === 1 ? (
                <div style={{ position: "absolute", left: b.x, top: 0, bottom: 0, width: b.w, background: cor.fundo, opacity: 0.2 * p }} />
              ) : null}
              {/* fatias muito finas se juntam à seguinte (sem risco colado em risco) */}
              {k > 0 && bordas[k - 1].w >= 7 ? (
                <div
                  style={{
                    position: "absolute",
                    left: b.x - 1.5,
                    top: 0,
                    width: 3,
                    height: alturaBarra * p,
                    background: cor.fundo,
                    opacity: 0.6,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* régua de 10 em 10% */}
      {Array.from({ length: 11 }, (_, k) => (
        <div
          key={`r${k}`}
          style={{
            position: "absolute",
            left: esquerda + (k / 10) * largura - (k === 10 ? 2 : 0),
            top: yBarra + alturaBarra + 12,
            width: 2,
            height: k % 5 === 0 ? 22 : 12,
            background: cor.linhaForte,
            opacity: prog(t, t0 + 0.1 + k * 0.03, 0.3),
          }}
        />
      ))}

      {/* legenda: valor e texto de cada parte */}
      <div
        style={{
          position: "absolute",
          left: esquerda,
          top: yBarra + alturaBarra + 52,
          width: largura,
          display: "flex",
          flexWrap: "wrap",
          gap: `${colunas < itens.length ? 28 : 0}px ${gapLegenda}px`,
        }}
      >
        {partes.map((p) => (
          <div key={`leg${p.i}`} style={{ width: larguraColuna }}>
            <Revela p={prog(t, inicio(p.i) + 0.1, 0.5)}>
              <div style={{ height: 6, width: 56, borderRadius: 3, background: corParte(p.i), marginBottom: colunas < itens.length ? 14 : 20 }} />
              {ilustrativo ? null : (
                <Valor
                  v={{ prefixo, numero: formatar(p.valor * pParte(p.i), casas), sufixo }}
                  tamanho={tamanhoValor}
                  cor={p.i === destaque ? corDestaque : cor.texto}
                />
              )}
              <div
                style={{
                  marginTop: ilustrativo ? 0 : 12,
                  fontFamily: sans,
                  fontWeight: ilustrativo ? 600 : 500,
                  fontSize: corpoTexto,
                  lineHeight: 1.15,
                  color: ilustrativo && p.i === destaque ? corDestaque : cor.texto,
                }}
              >
                {encaixar(p.texto, { largura: larguraColuna, max: corpoTexto, min: corpoTexto, linhas: 3, fonte: { peso: 500 } }).linhas.map((l) => (
                  <div key={l} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </Revela>
          </div>
        ))}
      </div>
    </Painel>
  );
};
