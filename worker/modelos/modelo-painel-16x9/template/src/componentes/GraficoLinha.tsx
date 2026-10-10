import { calculo, prog, Revela, useTempo } from "../anim";
import { PAINEL } from "../layout";
import { encaixar } from "../medida";
import type { Grafico as TGrafico, Lado } from "../plano";
import { casasDe, cor, curto, escalaRedonda, formatar, mono, sans, separarUnidade, PLANO } from "../tema";
import { caminho, type Ponto, valorEm } from "./curvas";
import { corDoTom } from "./Listas";
import { Painel } from "./Painel";
import { corDaTendencia, formaDaTendencia, IndicadorDeTendencia } from "./Tendencia";

// Quando cada ponto dito chega: depois da palavra, um de cada vez, nunca antes do painel abrir.
export const chegadas = (ems: number[], t0: number) => {
  const k: number[] = [];
  ems.forEach((e, i) => k.push(Math.max(e, t0 + 0.3, i > 0 ? k[i - 1] + 0.3 : -Infinity)));
  return k;
};

// Linha (área) do Painel com dados ditos ou com a tendência ilustrativa.
// Com `dados`: a ponta da linha anda de um número ao outro quando cada um é dito, e o contador do
// cabeçalho acompanha a ponta. Com `tendencia`: a forma se desenha até o `tendenciaEm`, sem números,
// com a etiqueta "ilustrativo".
export const GraficoLinha: React.FC<{ m: TGrafico; lado: Lado; t0: number; fimCabecalho: number; fimCorpo: number }> = ({
  m,
  lado,
  t0,
  fimCabecalho,
  fimCorpo,
}) => {
  const t = useTempo();
  const { esquerda, direita, topo, base } = PAINEL.corpo;
  const dados = (m.dados ?? []).slice(0, 8);
  const qualitativo = dados.length < 2;
  const tipo = m.tendencia ?? "sobe";
  const unidade = separarUnidade(m.unidade);
  const prefixo = m.prefixo ?? unidade.prefixo;
  const sufixo = m.sufixo ?? unidade.sufixo;

  const rotulos = qualitativo ? (m.eixo ?? []).slice(0, 8) : dados.map((d) => d.rotulo);
  const n = qualitativo ? (rotulos.length >= 2 ? rotulos.length : 9) : dados.length;
  const valores = qualitativo ? formaDaTendencia(tipo, n) : dados.map((d) => d.valor);
  const casas = qualitativo ? 0 : casasDe(valores);
  const corDaQualitativa = m.tom ? corDoTom(m.tom) : corDaTendencia(tipo);
  const corLinha = qualitativo ? corDaQualitativa : cor.positivo;

  // área do gráfico
  const comEixoY = !qualitativo;
  const comEixoX = rotulos.length >= 2;
  const x0 = esquerda + (comEixoY ? 134 : 24);
  const x1 = direita - 30;
  const yTopo = topo + (qualitativo ? 120 : 110);
  const yBase = base - (comEixoX ? 70 : 30);
  const escala = qualitativo ? { max: 1, passo: 0.25 } : escalaRedonda(Math.max(...valores, 1e-9));
  const X = (i: number) => x0 + (i / Math.max(1, n - 1)) * (x1 - x0);
  const Y = (v: number) => yBase - (Math.max(0, v) / escala.max) * (yBase - yTopo);
  const pontos: Ponto[] = valores.map((v, i) => ({ x: X(i), y: Y(v) }));

  // quanto da linha já foi desenhado (em "pontos": 0 = só o primeiro, n-1 = todos)
  const ems = dados.map((d) => d.em);
  const k = chegadas(ems, t0);
  const fimQualitativo = Math.max(t0 + 1.4, Math.min(m.tendenciaEm ?? t0 + 2.8, m.ate - 0.3));
  const avanco = qualitativo
    ? (n - 1) * prog(t, t0 + 0.45, fimQualitativo - (t0 + 0.45), calculo)
    : k.slice(1).reduce((s, ki) => s + prog(t, ki, 0.55, calculo), 0);
  const pPrimeiro = qualitativo ? prog(t, t0 + 0.35, 0.3) : prog(t, k[0] ?? t0, 0.3);
  const xCabeca = X(avanco);
  const fimDoDesenho = qualitativo ? fimQualitativo : (k[k.length - 1] ?? t0) + 0.55;
  const atual = Math.min(n - 1, Math.floor(avanco + 1e-6));
  const valorNaCabeca = valorEm(
    valores.map((v, i) => ({ x: i, y: v })),
    avanco,
  );

  const ticksY = Array.from({ length: Math.round(escala.max / escala.passo) + 1 }, (_, i) => i * escala.passo);
  const pGrade = prog(t, t0 + 0.1, 0.6);
  const idClip = `linha-${Math.round(m.de * 100)}`;
  const valorFinalTexto = { prefixo, numero: formatar(Math.max(...valores), casas), sufixo };

  // rótulos do eixo: o corpo que cabe na distância entre dois pontos
  const espaco = (x1 - x0) / Math.max(1, n - 1);
  const maiorRotulo = rotulos.reduce((a, b) => (b.length > a.length ? b : a), "");
  const corpoEixo = comEixoX ? encaixar(maiorRotulo, { largura: Math.min(espaco * 1.6, 260) - 8, max: 32, min: 28, linhas: 1, fonte: { mono: true } }).tamanho : 30;
  const larguraRotulo = (r: string) => r.length * corpoEixo * 0.62;
  const cabeEixo = rotulos.every((r, i) => i === 0 || (larguraRotulo(r) + larguraRotulo(rotulos[i - 1])) / 2 + 14 <= espaco);
  const passoEixo = cabeEixo ? 1 : 2;

  const itens = m.itens ?? [];

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
      valor={qualitativo ? undefined : { prefixo, numero: formatar(valorNaCabeca, casas), sufixo }}
      valorFinal={valorFinalTexto}
      valorTexto={qualitativo ? undefined : rotulos[atual]}
      valorEm={k[0]}
      indicador={qualitativo ? <IndicadorDeTendencia tipo={tipo} em={t0 + 0.3} leitura={m.leitura} leituraEm={m.tendenciaEm} largura={PAINEL.cabecalho.largura} cor={qualitativo ? corDaQualitativa : undefined} /> : undefined}
    >
      <svg width={PLANO.w} height={PLANO.h} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id={idClip}>
            <rect x={x0 - 6} y={yTopo - 80} width={Math.max(0, xCabeca - x0 + 6)} height={yBase - yTopo + 84} />
          </clipPath>
          <linearGradient id={`${idClip}-g`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={corLinha} stopOpacity={0.3} />
            <stop offset="1" stopColor={corLinha} stopOpacity={0.03} />
          </linearGradient>
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
        {/* sem números: a forma inteira já espera "a lápis" (tracejado cinza) e a linha colorida a percorre */}
        {qualitativo ? (
          <path
            d={caminho(pontos)}
            fill="none"
            stroke="rgba(226,238,231,0.22)"
            strokeWidth={3}
            strokeDasharray="7 11"
            strokeLinecap="round"
            opacity={prog(t, t0, 0.4)}
          />
        ) : null}
        {/* área e linha, até a ponta */}
        <g clipPath={`url(#${idClip})`} opacity={pPrimeiro}>
          <path d={`${caminho(pontos)} L${X(n - 1)},${yBase} L${X(0)},${yBase} Z`} fill={`url(#${idClip}-g)`} />
          <path d={caminho(pontos)} fill="none" stroke={corLinha} strokeWidth={5} strokeLinecap="round" />
        </g>
        {/* pontos ditos */}
        {!qualitativo
          ? pontos.map((p, i) =>
              avanco >= i - 0.02 ? <circle key={`pt${i}`} cx={p.x} cy={p.y} r={8} fill={cor.fundo} stroke={corLinha} strokeWidth={4} opacity={i === 0 ? pPrimeiro : 1} /> : null,
            )
          : null}
        {/* cursor do desenho */}
        {avanco > 0 && t < fimDoDesenho + 0.5 ? (
          <line
            x1={xCabeca}
            x2={xCabeca}
            y1={yTopo - 20}
            y2={yBase}
            stroke={cor.linhaForte}
            strokeWidth={1.5}
            strokeDasharray="4 6"
            opacity={1 - prog(t, fimDoDesenho, 0.5)}
          />
        ) : null}
        {/* a ponta "respira" enquanto o painel está na tela: dado ao vivo */}
        {pPrimeiro > 0
          ? [0, 0.6].map((atraso) => {
              const ciclo = (((t - (k[0] ?? t0) - atraso) % 1.2) + 1.2) % 1.2;
              const p = t - (k[0] ?? t0) - atraso < 0 ? 0 : ciclo / 1.2;
              return (
                <circle
                  key={atraso}
                  cx={xCabeca}
                  cy={valorEm(pontos, xCabeca)}
                  r={10 + 26 * p}
                  fill="none"
                  stroke={corLinha}
                  strokeWidth={2.5}
                  opacity={p > 0 ? 0.6 * (1 - p) : 0}
                />
              );
            })
          : null}
        {pPrimeiro > 0 ? <circle cx={xCabeca} cy={valorEm(pontos, xCabeca)} r={10} fill={cor.fundo} stroke={corLinha} strokeWidth={4.5} /> : null}
        {/* marcações de ponto (anotações com `ponto`) */}
        {itens
          .filter((i) => i.ponto !== undefined)
          .map((i) => {
            const p = prog(t, i.em, 0.5);
            const x = X(Math.min(n - 1, Math.max(0, i.ponto as number)));
            const yCurva = valorEm(pontos, x);
            return (
              <line key={`m${i.em}`} x1={x} x2={x} y1={yBase} y2={yBase - (yBase - yCurva) * p} stroke={cor.ambar} strokeWidth={2.5} strokeDasharray="6 7" />
            );
          })}
      </svg>

      {/* valor de cada ponto dito, sobre ele */}
      {!qualitativo
        ? pontos.map((p, i) => {
            const pv = prog(t, (k[i] ?? t0) + 0.25, 0.35);
            if (pv <= 0) return null;
            const ultimoDito = i === atual;
            const texto = `${prefixo.trim() ? `${prefixo.trim()} ` : ""}${curto(valores[i])}${sufixo.trim() && sufixo.trim().length <= 3 ? sufixo.trim() : ""}`;
            const noFim = i === n - 1;
            const noInicio = i === 0;
            return (
              <div
                key={`v${i}`}
                style={{
                  position: "absolute",
                  top: p.y - 62,
                  ...(noFim ? { right: PLANO.w - p.x - 10 } : noInicio ? { left: p.x - 10 } : { left: p.x - 150, width: 300, textAlign: "center" }),
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: ultimoDito ? 38 : 32,
                  color: ultimoDito ? corLinha : cor.suave,
                  opacity: pv,
                  whiteSpace: "nowrap",
                }}
              >
                {texto}
              </div>
            );
          })
        : null}

      {/* eixo vertical (só com números ditos) */}
      {comEixoY
        ? ticksY.map((v, i) => (
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
          ))
        : null}

      {/* eixo horizontal */}
      {comEixoX
        ? rotulos.map((rot, i) => {
            if (i % passoEixo !== 0 && i !== n - 1) return null;
            const primeiro = i === 0;
            const ultimo = i === n - 1;
            const aceso = !qualitativo && i === atual && avanco >= i - 0.02;
            return (
              <div
                key={`tx${i}`}
                style={{
                  position: "absolute",
                  top: yBase + 16,
                  ...(ultimo ? { right: PLANO.w - X(i) - 20, textAlign: "right" } : primeiro ? { left: X(i) - 20 } : { left: X(i) - 150, width: 300, textAlign: "center" }),
                  fontFamily: mono,
                  fontSize: corpoEixo,
                  fontWeight: aceso ? 500 : 400,
                  color: aceso ? corLinha : cor.apagado,
                  opacity: qualitativo ? prog(t, t0 + 0.2 + i * 0.05, 0.4) : prog(t, (k[i] ?? t0) - 0.1, 0.3) * 0.6 + 0.4 * prog(t, t0 + 0.2, 0.4),
                  whiteSpace: "nowrap",
                }}
              >
                {rot}
              </div>
            );
          })
        : null}

      {/* anotações */}
      {itens.map((item, j) => {
        const p = prog(t, item.em, 0.5);
        if (item.ponto !== undefined) {
          const x = X(Math.min(n - 1, Math.max(0, item.ponto)));
          const yCurva = valorEm(pontos, x);
          const aDireita = x > (x0 + x1) / 2;
          return (
            <div
              key={`i${j}`}
              style={{
                position: "absolute",
                top: Math.max(topo + 56, yCurva - 70),
                ...(aDireita ? { right: PLANO.w - x + 22 } : { left: x + 22 }),
                opacity: p,
                translate: `0 ${(1 - p) * 10}px`,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 40,
                color: cor.ambar,
                whiteSpace: "nowrap",
              }}
            >
              {item.texto}
            </div>
          );
        }
        const ordem = itens.filter((i) => i.ponto === undefined).indexOf(item);
        return (
          <div key={`i${j}`} style={{ position: "absolute", left: x0 + 18, top: topo + 8 + ordem * 72 }}>
            <Revela p={p}>
              <div
                style={{
                  padding: "8px 18px",
                  border: `2px solid ${cor.ambar}`,
                  borderRadius: 10,
                  fontFamily: mono,
                  fontWeight: 500,
                  fontSize: 34,
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
