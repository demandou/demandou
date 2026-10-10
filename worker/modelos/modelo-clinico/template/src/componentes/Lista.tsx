import { limitar, prog, saindo, temposDoTexto, Traco } from "../anim";
import type { Areas, Regiao } from "../layout";
import { encaixar, larguraTexto } from "../medida";
import type { Item, Layout, Palavra, Passos, Topicos } from "../plano";
import { cor, sans } from "../tema";
import { Cabecalho } from "./Cabecalho";
import { pSelo, Selo } from "./Selo";
import { TextoFalado } from "./Texto";

// Listas do Clínico, embaixo do cabeçalho da lupa:
// - `topicos` (sem ordem): linhas de atlas. Uma haste azul desce pela margem; cada item ganha um ponto
//   na haste e uma linha-guia com cotovelo até o nome, quando é dito (como os rótulos dos desenhos);
// - `passos` (em ordem): a conduta. Anéis numerados ligados por um traço que avança de passo em passo;
//   o passo atual fica cheio de azul.
// Antes de cada item ser dito, o lugar dele já aparece "a lápis" (traço cinza), para o corpo nunca ficar vazio.
export const Lista: React.FC<{ m: Topicos | Passos; t: number; fim: number; areas: Areas; layout: Layout; palavras: Palavra[] }> = ({
  m,
  t,
  fim,
  areas,
  layout,
  palavras,
}) => {
  const sai = saindo(t, fim, 0.3);
  if (sai >= 1) return null;
  const passos = m.tipo === "passos";
  const itens = m.itens.slice(0, 5);
  const n = Math.max(1, itens.length);
  const corpo = areas.corpo;
  const temDetalhe = itens.some((i) => i.detalhe);

  // geometria das linhas: ocupam o corpo, centralizadas
  const linhaH = Math.min(temDetalhe ? 236 : 214, corpo.h / n);
  const blocoH = linhaH * n;
  const y0 = corpo.y + (corpo.h - blocoH) / 2;
  const xMarca = corpo.x + (passos ? 58 : 34);
  const xTexto = corpo.x + (passos ? 138 : 120);
  const temSelo = itens.some((i) => i.marca);
  const larguraTxt = corpo.x + corpo.w - xTexto - (temSelo ? 96 : 10);
  // um corpo de letra só para a lista inteira: o maior em que todos cabem em até 2 linhas na altura da linha
  const folgaDetalhe = temDetalhe ? 62 : 0;
  const cabeNaLinha = (texto: string, tam: number) => {
    const e = encaixar(texto, { largura: larguraTxt, max: tam, min: tam, linhas: 2, peso: 700 });
    return e.linhas.length <= 2 && e.linhas.length * tam * 1.06 + folgaDetalhe <= linhaH - 14;
  };
  let tamanho = 76;
  while (tamanho > 44 && !itens.every((i) => cabeNaLinha(i.texto, tamanho))) tamanho -= 2;
  const linhas = itens.map((i) => encaixar(i.texto, { largura: larguraTxt, max: tamanho, min: Math.min(36, tamanho), linhas: 2, peso: 700 }));
  const detalheTam = 42;

  // o item atual (o último dito)
  const atual = itens.reduce((a, it, k) => (t >= it.em - 0.05 ? k : a), -1);

  return (
    <>
      {m.titulo ? (
        <Cabecalho
          area={areas.cabecalho}
          numero={m.numero}
          titulo={m.titulo}
          palavras={palavras}
          de={m.de}
          ate={m.ate}
          t={t}
          fim={fim}
          alinhar={layout === "topo" ? "centro" : "esquerda"}
          maxLinhas={layout === "topo" ? 2 : 3}
        />
      ) : (
        <Contador area={areas.cabecalho} n={n} atual={atual} itens={itens} t={t} de={m.de} sai={sai} alinhar={layout === "topo" ? "centro" : "esquerda"} />
      )}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - sai }}>
        {passos ? (
          <TrilhoDosPassos itens={itens} t={t} de={m.de} x={xMarca} y0={y0} linhaH={linhaH} atual={atual} />
        ) : (
          <HasteDeAtlas itens={itens} t={t} de={m.de} x={xMarca} xTexto={xTexto} y0={y0} linhaH={linhaH} />
        )}
        {itens.map((it, i) =>
          it.marca ? (
            <Selo key={i} cx={corpo.x + corpo.w - 42} cy={y0 + linhaH * (i + 0.5)} r={34} tipo={it.marca} p={pSelo(t, it.em + 0.3)} />
          ) : null,
        )}
      </svg>
      {itens.map((it, i) => {
        const e = linhas[i];
        const entra = prog(t, it.em - 0.05, 0.4);
        const lugar = prog(t, m.de + i * 0.07, 0.35);
        const tempos = temposDoTexto(it.texto, palavras, it.em, it.em + 2.5, it.em, it.em - 0.2);
        const hTexto = e.linhas.length * e.tamanho * 1.06 + (it.detalhe ? detalheTam * 1.3 + 6 : 0);
        const yc = y0 + linhaH * (i + 0.5);
        return (
          <div
            key={i}
            style={{ position: "absolute", left: xTexto, top: yc - hTexto / 2, width: larguraTxt, opacity: (1 - sai) * Math.max(lugar * 0.999, 0) }}
          >
            {entra <= 0 ? (
              // a lápis: o lugar do item, antes de ele ser dito
              <div style={{ display: "flex", flexDirection: "column", gap: e.tamanho * 0.32, paddingTop: e.tamanho * 0.3 }}>
                {e.linhas.map((l, k) => (
                  <div
                    key={k}
                    style={{
                      width: Math.min(larguraTxt, larguraTexto(l, e.tamanho, 700) * (k === 0 ? 0.62 : 0.4)),
                      height: Math.max(8, e.tamanho * 0.16),
                      borderRadius: 999,
                      background: cor.lapis,
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                <TextoFalado
                  linhas={e.linhas}
                  tamanho={e.tamanho}
                  peso={700}
                  tempos={tempos}
                  t={t}
                  cor={cor.tinta}
                  entrelinha={1.06}
                  espacamento={-0.01}
                />
                {it.detalhe ? (
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: sans,
                      fontWeight: 500,
                      fontSize: detalheTam,
                      lineHeight: 1.3,
                      color: cor.cinza,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "clip",
                      clipPath: `inset(-10% ${(1 - limitar(prog(t, it.em + 0.35, 0.45))) * 100}% -10% 0)`,
                    }}
                  >
                    {it.detalhe}
                  </div>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </>
  );
};

// Haste de atlas: a linha da margem desce até o item atual; cada item ganha ponto e linha-guia com cotovelo
const HasteDeAtlas: React.FC<{ itens: Item[]; t: number; de: number; x: number; xTexto: number; y0: number; linhaH: number }> = ({
  itens,
  t,
  de,
  x,
  xTexto,
  y0,
  linhaH,
}) => {
  const n = itens.length;
  const topo = y0 + linhaH * 0.5 - 40;
  const base = y0 + linhaH * (n - 0.5) + 40;
  // o trilho cinza aparece com o bloco; o azul desce até o item dito
  const trilho = prog(t, de, 0.5);
  const atingido = Math.max(0, ...itens.map((it, i) => prog(t, it.em - 0.15, 0.4) * (y0 + linhaH * (i + 0.5) - topo)));
  return (
    <g>
      <Traco d={`M ${x} ${topo} L ${x} ${base}`} p={trilho} cor={cor.cinzaClaro} largura={4} />
      {atingido > 0 ? <Traco d={`M ${x} ${topo} L ${x} ${topo + atingido}`} p={1} cor={cor.azul} largura={4.5} /> : null}
      {itens.map((it, i) => {
        const yc = y0 + linhaH * (i + 0.5);
        const erro = it.marca === "errado";
        const c = erro ? cor.vermelho : cor.azul;
        const ponto = prog(t, it.em - 0.05, 0.25);
        const guia = prog(t, it.em, 0.3);
        const espera = prog(t, de + i * 0.07, 0.35);
        return (
          <g key={i}>
            {/* a lápis: o ponto vazio na haste */}
            <circle cx={x} cy={yc} r={11} fill={cor.fundo} stroke={cor.cinzaLinha} strokeWidth={3} opacity={espera * (1 - ponto)} />
            <Traco d={`M ${x} ${yc} L ${x + 30} ${yc - 18} L ${xTexto - 18} ${yc - 18}`} p={guia} cor={c} largura={3.5} />
            <circle cx={x} cy={yc} r={15 * ponto} fill={cor.branco} />
            <circle cx={x} cy={yc} r={10 * ponto} fill={c} />
          </g>
        );
      })}
    </g>
  );
};

// Trilho da conduta: anéis numerados ligados; o traço azul avança até o passo dito e o atual fica cheio
const TrilhoDosPassos: React.FC<{ itens: Item[]; t: number; de: number; x: number; y0: number; linhaH: number; atual: number }> = ({
  itens,
  t,
  de,
  x,
  y0,
  linhaH,
  atual,
}) => {
  const r = Math.min(46, linhaH * 0.3);
  return (
    <g>
      {itens.map((it, i) => {
        if (i === 0) return null;
        const ya = y0 + linhaH * (i - 0.5) + r;
        const yb = y0 + linhaH * (i + 0.5) - r;
        const avanca = prog(t, it.em - 0.35, 0.4);
        return (
          <g key={`l${i}`}>
            <Traco d={`M ${x} ${ya + 6} L ${x} ${yb - 6}`} p={prog(t, de + i * 0.07, 0.35)} cor={cor.cinzaClaro} largura={4} tracejado="2 12" />
            <Traco d={`M ${x} ${ya + 6} L ${x} ${yb - 6}`} p={avanca} cor={cor.azul} largura={5} />
          </g>
        );
      })}
      {itens.map((it, i) => {
        const yc = y0 + linhaH * (i + 0.5);
        const anel = prog(t, it.em - 0.05, 0.5);
        const num = prog(t, it.em + 0.08, 0.35);
        const lugar = prog(t, de + i * 0.07, 0.35);
        const cheio = i === atual ? prog(t, it.em + 0.1, 0.3) : i < atual ? 1 - prog(t, itens[atual].em + 0.1, 0.3) : 0;
        const erro = it.marca === "errado";
        const c = erro ? cor.vermelho : cor.azul;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={yc}
              r={r}
              fill="none"
              stroke={cor.cinzaLinha}
              strokeWidth={3}
              strokeDasharray="2 12"
              strokeLinecap="round"
              opacity={lugar * (1 - anel)}
              transform={`rotate(${t * 12} ${x} ${yc})`}
            />
            <circle cx={x} cy={yc} r={r} fill={cor.branco} opacity={anel} />
            <circle cx={x} cy={yc} r={r} fill={c} opacity={anel * cheio} />
            <Traco d={`M ${x} ${yc - r} A ${r} ${r} 0 1 1 ${x - 0.01} ${yc - r}`} p={anel} cor={c} largura={4.5} />
            <text
              x={x}
              y={yc + (1 - num) * 16}
              textAnchor="middle"
              dominantBaseline="central"
              opacity={Math.max(num, lugar * 0.35 * (1 - anel))}
              style={{
                fontFamily: sans,
                fontWeight: 800,
                fontSize: r * 1.05,
                fill: num > 0 ? (cheio > 0.5 ? cor.branco : c) : cor.cinzaLinha,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// Sem título: o cabeçalho vira um contador de exame (o item atual / o total), com o anel enchendo
const Contador: React.FC<{
  area: Regiao;
  n: number;
  atual: number;
  itens: Item[];
  t: number;
  de: number;
  sai: number;
  alinhar: "esquerda" | "centro";
}> = ({ area, n, atual, itens, t, de, sai, alinhar }) => {
  const d = Math.min(area.h - 20, 230);
  const r = d / 2 - 8;
  const monta = prog(t, de + 0.05, 0.5);
  const fracao = itens.reduce((s, it) => s + prog(t, it.em - 0.05, 0.45), 0) / n;
  const numero = Math.max(0, atual + 1);
  const cx = alinhar === "centro" ? area.x + area.w / 2 : area.x + d / 2;
  const cy = area.y + area.h / 2;
  const arco = (f: number) => {
    const a = f * Math.PI * 2 - Math.PI / 2;
    return `M ${cx} ${cy - r} A ${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
  };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: (1 - sai) * monta }}>
      <circle cx={cx} cy={cy} r={r} fill={cor.branco} stroke={cor.cinzaClaro} strokeWidth={12} />
      {fracao > 0.001 ? <path d={arco(Math.min(0.9999, fracao))} fill="none" stroke={cor.azul} strokeWidth={12} strokeLinecap="round" /> : null}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: sans, fontWeight: 800, fontSize: d * 0.4, fill: numero ? cor.tinta : cor.cinzaLinha, fontVariantNumeric: "tabular-nums" }}>
        {numero}
        <tspan style={{ fontSize: d * 0.2, fill: cor.cinza, fontWeight: 700 }}>{`/${n}`}</tspan>
      </text>
    </svg>
  );
};
