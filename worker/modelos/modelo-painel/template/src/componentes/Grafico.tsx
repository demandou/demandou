import { calculo, prog, Revela, useTempo } from "../anim";
import { PAINEL } from "../layout";
import type { Grafico as TGrafico, Lado } from "../plano";
import { cor, curto, escalaRedonda, formatar, mono, sans } from "../tema";
import { caminho, valorEm, type Ponto } from "./curvas";
import { Divisao } from "./Divisao";
import { GraficoBarras } from "./GraficoBarras";
import { GraficoLinha } from "./GraficoLinha";
import { Painel } from "./Painel";
import { Valor } from "./Valor";

type Props = { m: TGrafico; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number };

// O gráfico do Painel em todas as formas:
// - `series` + `eixo` (simulação calculada): área empilhada que se desenha, com contador e anotações;
// - `forma: "linha"`: área que avança de um número dito ao outro, ou a tendência ilustrativa;
// - `forma: "barras"`: barras que crescem cada uma na sua palavra (ou a tendência em barras);
// - `forma: "pizza"`: no Painel, a proporção é a barra que se divide (a mesma da `divisao`).
export const Grafico: React.FC<Props> = (props) => {
  const { m } = props;
  if ((m.series?.length ?? 0) > 0 && (m.eixo?.length ?? 0) > 1) return <GraficoSimulacao {...props} />;
  const forma = m.forma ?? "linha";
  if (forma === "pizza" && (m.dados?.length ?? 0) >= 2) {
    const dados = (m.dados ?? []).slice(0, 5);
    return (
      <Divisao
        {...props}
        m={{
          tipo: "divisao",
          de: m.de,
          ate: m.ate,
          janela: m.janela,
          rotulo: m.rotulo,
          titulo: m.titulo,
          nota: m.nota,
          prefixo: m.prefixo,
          sufixo: m.sufixo,
          unidade: m.unidade,
          ilustrativo: m.ilustrativo,
          itens: dados.map((d) => ({ em: d.em, texto: d.rotulo, valor: d.valor })),
          destaque: dados.reduce((k, d, i) => (d.valor > dados[k].valor ? i : k), 0),
        }}
      />
    );
  }
  if (forma === "barras") return <GraficoBarras {...props} />;
  return <GraficoLinha {...props} />;
};

// Área que se desenha no tempo (1 ou 2 séries empilhadas), com anotações que entram na fala.
const GraficoSimulacao: React.FC<Props> = ({ m, lado, t0, fimCabecalho, fimCorpo }) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const eixo = m.eixo ?? [];
  const n = eixo.length;
  const series = (m.series ?? []).slice(0, 2);
  const prefixo = m.prefixo ?? "";
  const sufixo = m.sufixo ?? "";

  // área do gráfico
  const x0 = esquerda + 134;
  const x1 = direita - 26;
  const yTopo = topo + 86;
  const yBase = base - 64;

  // empilhamento: a série 2 fica em cima da 1
  const acumulado = series.map((_, k) =>
    Array.from({ length: n }, (_, i) => series.slice(0, k + 1).reduce((s, se) => s + (se.valores[i] ?? 0), 0)),
  );
  const totais = acumulado[acumulado.length - 1];
  const escala = escalaRedonda(Math.max(...totais));
  const X = (i: number) => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
  const Y = (v: number) => yBase - (v / escala.max) * (yBase - yTopo);
  const linhas: Ponto[][] = acumulado.map((vs) => vs.map((v, i) => ({ x: X(i), y: Y(v) })));

  // desenho da esquerda para a direita
  const desenho = m.desenho ?? { de: t0 + 0.45, ate: m.tendenciaEm ?? Math.min(m.ate - 1.4, t0 + 3) };
  const pDesenho = prog(t, desenho.de, desenho.ate - desenho.de, calculo);
  const xCabeca = x0 + pDesenho * (x1 - x0);
  const totaisPts: Ponto[] = totais.map((v, i) => ({ x: X(i), y: v }));
  const totalNaCabeca = valorEm(totaisPts, xCabeca);
  // números pequenos (taxas, porcentagens) ganham uma casa decimal
  const casas = Math.max(...totais) < 100 ? 1 : 0;
  const indiceNaCabeca = Math.ceil(pDesenho * (n - 1) - 1e-6);

  const itens = m.itens ?? [];
  const acesa = (k: number) => {
    const item = itens.find((i) => i.serie === k);
    return item ? prog(t, item.em, 0.5) : 0;
  };
  const corDaSerie = (k: number) => (series.length === 1 || k === 1 ? cor.positivo : cor.neutro);

  // eixo horizontal: no máximo ~7 rótulos
  const passoX = n > 8 ? Math.ceil((n - 1) / 6) : 1;
  const ticksY = Array.from({ length: Math.round(escala.max / escala.passo) + 1 }, (_, i) => i * escala.passo);
  const pGrade = prog(t, t0 + 0.1, 0.6);
  const idClip = `desenho-${Math.round(m.de * 100)}`;

  const valorTopo = { prefixo, numero: formatar(totalNaCabeca, casas), sufixo };
  const valorFinal = { prefixo, numero: formatar(totais[n - 1] ?? 0, casas), sufixo };
  const textoTopo = m.total ? m.total.replace("{x}", eixo[indiceNaCabeca] ?? "") : undefined;

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
      notaPadrao="Simulação ilustrativa"
      valor={valorTopo}
      valorFinal={valorFinal}
      valorTexto={textoTopo}
    >
      {/* legenda das séries */}
      <div style={{ position: "absolute", left: esquerda, top: topo, display: "flex", gap: 40 }}>
        {series.map((s, k) => (
          <div
            key={s.nome}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: prog(t, t0 + 0.2 + k * 0.12, 0.4),
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 36,
              color: cor.texto,
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 4, background: corDaSerie(k) }} />
            {s.nome}
          </div>
        ))}
      </div>

      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id={idClip}>
            <rect x={x0 - 4} y={yTopo - 60} width={Math.max(0, xCabeca - x0 + 4)} height={yBase - yTopo + 64} />
          </clipPath>
        </defs>
        {/* grade */}
        {ticksY.map((v) => (
          <line
            key={v}
            x1={x0}
            x2={x0 + (x1 - x0) * pGrade}
            y1={Y(v)}
            y2={Y(v)}
            stroke={v === 0 ? cor.linhaForte : "rgba(226,238,231,0.08)"}
            strokeWidth={v === 0 ? 2 : 1.5}
          />
        ))}
        {/* áreas e linhas */}
        <g clipPath={`url(#${idClip})`}>
          {linhas.map((l, k) => {
            const baixo = k === 0 ? `L${X(n - 1)},${yBase} L${X(0)},${yBase} Z` : `${caminho([...linhas[k - 1]].reverse(), true)} Z`;
            const alfa = (k === 1 || series.length === 1 ? 0.16 : 0.09) + 0.16 * acesa(k);
            return <path key={`a${k}`} d={`${caminho(l)} ${baixo}`} fill={corDaSerie(k)} fillOpacity={alfa} />;
          })}
          {linhas.map((l, k) => (
            <path
              key={`l${k}`}
              d={caminho(l)}
              fill="none"
              stroke={corDaSerie(k)}
              strokeOpacity={k === linhas.length - 1 ? 1 : 0.75}
              strokeWidth={k === linhas.length - 1 ? 5 : 3.5}
              strokeLinecap="round"
            />
          ))}
        </g>
        {/* cursor do desenho */}
        {pDesenho > 0 ? (
          <g opacity={1 - prog(t, desenho.ate, 0.5)}>
            <line x1={xCabeca} x2={xCabeca} y1={yTopo - 10} y2={yBase} stroke={cor.linhaForte} strokeWidth={1.5} strokeDasharray="4 6" />
          </g>
        ) : null}
        {/* depois de desenhado, o ponto final "respira": um anel que se abre e some, como dado ao vivo */}
        {pDesenho >= 1
          ? [0, 0.6].map((atraso) => {
              const ciclo = ((t - desenho.ate - atraso) % 1.2 + 1.2) % 1.2;
              const p = t - desenho.ate - atraso < 0 ? 0 : ciclo / 1.2;
              return (
                <circle
                  key={atraso}
                  cx={x1}
                  cy={linhas[linhas.length - 1][n - 1].y}
                  r={10 + 26 * p}
                  fill="none"
                  stroke={corDaSerie(linhas.length - 1)}
                  strokeWidth={2.5}
                  opacity={p > 0 ? 0.6 * (1 - p) : 0}
                />
              );
            })
          : null}
        {pDesenho > 0 ? (
          <circle
            cx={xCabeca}
            cy={valorEm(linhas[linhas.length - 1], xCabeca)}
            r={9}
            fill={cor.fundo}
            stroke={corDaSerie(linhas.length - 1)}
            strokeWidth={4}
          />
        ) : null}
        {/* marcações de ponto */}
        {itens
          .filter((i) => i.ponto !== undefined && i.serie === undefined)
          .map((i) => {
            const p = prog(t, i.em, 0.5);
            const x = X(Math.min(n - 1, Math.max(0, i.ponto as number)));
            const yCurva = valorEm(linhas[linhas.length - 1], x);
            return (
              <line
                key={`p${i.em}`}
                x1={x}
                x2={x}
                y1={yBase}
                y2={yBase - (yBase - yCurva) * p}
                stroke={cor.ambar}
                strokeWidth={2.5}
                strokeDasharray="6 7"
              />
            );
          })}
      </svg>

      {/* eixo vertical */}
      {ticksY.map((v, i) => (
        <div
          key={`ty${v}`}
          style={{
            position: "absolute",
            left: esquerda,
            width: x0 - esquerda - 18,
            top: Y(v) - 17,
            textAlign: "right",
            fontFamily: mono,
            fontSize: 28,
            lineHeight: "34px",
            whiteSpace: "nowrap",
            color: cor.apagado,
            opacity: prog(t, t0 + 0.15 + i * 0.05, 0.4),
          }}
        >
          {curto(v)}
          {sufixo.trim().length <= 2 ? sufixo.trim() : ""}
        </div>
      ))}

      {/* eixo horizontal */}
      {eixo.map((rot, i) => {
        // mostra um rótulo a cada `passoX`, e sempre o último (sem encostar no penúltimo)
        if (i !== n - 1 && (i % passoX !== 0 || n - 1 - i < passoX * 0.75)) return null;
        const marcado = itens.some((it) => it.ponto === i && it.serie === undefined && t >= it.em);
        const ultimo = i === n - 1;
        const texto = ultimo && m.eixoNome ? `${rot} ${m.eixoNome}` : rot;
        return (
          <div
            key={`tx${i}`}
            style={{
              position: "absolute",
              top: yBase + 14,
              left: ultimo ? undefined : X(i) - 60,
              right: ultimo ? 1080 - X(i) - 20 : undefined,
              width: ultimo ? undefined : 120,
              textAlign: ultimo ? "right" : "center",
              fontFamily: mono,
              fontSize: 30,
              fontWeight: marcado ? 500 : 400,
              color: marcado ? cor.ambar : cor.apagado,
              opacity: prog(t, t0 + 0.2 + i * 0.03, 0.4),
              whiteSpace: "nowrap",
            }}
          >
            {texto}
          </div>
        );
      })}

      {/* anotações */}
      {itens.map((item, k) => {
        const p = prog(t, item.em, 0.5);
        if (item.serie !== undefined) {
          // valor final da faixa, escrito dentro dela, perto do fim
          const s = Math.min(series.length - 1, Math.max(0, item.serie));
          const xRef = X(n - 1);
          const yCima = linhas[s][n - 1].y;
          const yBaixo = s === 0 ? yBase : linhas[s - 1][n - 1].y;
          const valor = series[s].valores[n - 1] ?? 0;
          return (
            <div
              key={`i${k}`}
              style={{
                position: "absolute",
                right: 1080 - xRef + 26,
                top: (yCima + yBaixo) / 2 - 56,
                textAlign: "right",
              }}
            >
              <Revela p={p}>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Valor
                    v={{ prefixo, numero: formatar(valor * prog(t, item.em, 0.9, calculo), casas), sufixo }}
                    tamanho={60}
                    cor={s === 1 || series.length === 1 ? cor.positivo : cor.texto}
                  />
                </div>
                <div style={{ marginTop: 8, fontFamily: sans, fontWeight: 500, fontSize: 40, color: cor.texto }}>{item.texto}</div>
              </Revela>
            </div>
          );
        }
        if (item.ponto !== undefined) {
          const x = X(Math.min(n - 1, Math.max(0, item.ponto)));
          const yCurva = valorEm(linhas[linhas.length - 1], x);
          const aDireita = x > (x0 + x1) / 2;
          return (
            <div
              key={`i${k}`}
              style={{
                position: "absolute",
                top: Math.max(topo + 56, yCurva - 64),
                ...(aDireita ? { right: 1080 - x + 22 } : { left: x + 22 }),
                opacity: p,
                translate: `0 ${(1 - p) * 10}px`,
                fontFamily: mono,
                fontWeight: 500,
                fontSize: 36,
                color: cor.ambar,
                whiteSpace: "nowrap",
              }}
            >
              {item.texto}
            </div>
          );
        }
        // etiqueta no alto do gráfico
        const ordem = itens.filter((i) => i.serie === undefined && i.ponto === undefined).indexOf(item);
        return (
          <div key={`i${k}`} style={{ position: "absolute", left: x0 + 18, top: yTopo + 8 + ordem * 72 }}>
            <Revela p={p}>
              <div
                style={{
                  padding: "8px 18px",
                  border: `2px solid ${cor.ambar}`,
                  borderRadius: 10,
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: 36,
                  color: cor.ambar,
                  whiteSpace: "nowrap",
                }}
              >
                {item.texto}
              </div>
            </Revela>
          </div>
        );
      })}
    </Painel>
  );
};
