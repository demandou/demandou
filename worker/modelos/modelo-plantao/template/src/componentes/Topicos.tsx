// Tópicos (lista sem ordem) no painel do estúdio: tarjas brancas empilhadas, como os itens de uma
// reportagem na tela. Cada item nasce "a lápis" (contorno tracejado e texto apagado) e, quando é
// dito, o marcador azul elétrico e a tarja branca varrem da esquerda e o texto acende palavra por
// palavra. O item que está sendo dito ganha a seta ao lado; o detalhe entra no tempo dele.
import { limitar, Linhas, Palavras, prog, temposDoTexto, varredura } from "../anim";
import type { Area } from "../layout";
import { caber, caberNaAltura } from "../medidas";
import type { Item, Palavra, Topicos as T } from "../plano";
import { cor, manchete, MARGEM, texto as estiloTexto, W } from "../tema";
import { Cabecalho, medirCabecalho } from "./Cabecalho";

type Props = { m: T; palavras: Palavra[]; t: number; area: Area; entra: number };

// Uma linha da lista: o marcador (quadrado) e a tarja branca com o texto e o detalhe.
export const TarjaDoItem: React.FC<{
  it: Item;
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  palavras: Palavra[];
  de: number;
  ate: number;
  marcador: React.ReactNode;
  // o detalhe numa segunda linha dentro da tarja (quando a tarja é alta) ou ao lado do texto
  detalheEmBaixo: boolean;
}> = ({ it, x, y, w, h, t, palavras, de, ate, marcador, detalheEmBaixo }) => {
  const p = prog(t, it.em - 0.1, 0.34);
  const larguraTexto = w - h - 14 - 2 * 26;
  const temDetalhe = !!it.detalhe?.trim();
  // texto e detalhe na mesma linha: medem juntos
  const corteItem = { peso: 800 as const, alta: true, espacamento: 0 };
  const alturaTexto = detalheEmBaixo && temDetalhe ? h * 0.5 : h - 22;
  const maxTam = Math.min(60, Math.round(alturaTexto / 1.04));
  const larguraItem = detalheEmBaixo || !temDetalhe ? larguraTexto : larguraTexto * 0.62;
  const umaLinha = caber(it.texto, { largura: larguraItem, maximo: maxTam, minimo: 30, linhas: 1, corte: corteItem });
  // item longo numa tarja alta: duas linhas maiores em vez de uma linha miúda
  const linhaTexto =
    umaLinha.tam < 40 && !detalheEmBaixo && h >= 100
      ? caberNaAltura(it.texto, { largura: larguraItem, maximo: maxTam, minimo: 30, linhas: 2, corte: corteItem, alturaMax: h - 18, entrelinha: 1.04 })
      : umaLinha;
  const tamDetalhe = Math.max(30, Math.min(40, Math.round(linhaTexto.tam * 0.74)));
  const detalhe = temDetalhe
    ? caber(it.detalhe ?? "", { largura: detalheEmBaixo ? larguraTexto : larguraTexto * 0.36, maximo: tamDetalhe, minimo: 30, linhas: 1, corte: { peso: 700 } })
    : null;
  const tempos = temposDoTexto(it.texto, palavras, de, ate, it.em - 0.08);
  const detalheEm = it.detalheEm ?? (tempos[tempos.length - 1] ?? it.em) + 0.35;
  const temposDetalhe = it.detalhe ? temposDoTexto(it.detalhe, palavras, de, ate, detalheEm - 0.08) : [];
  const pDetalhe = prog(t, detalheEm - 0.08, 0.3);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, display: "flex", gap: 14 }}>
      {marcador}
      <div style={{ position: "relative", flex: 1, height: h }}>
        <div style={{ position: "absolute", inset: 0, border: `4px dashed ${cor.apagadoNoAzul}`, opacity: 1 - limitar(p * 2) }} />
        <div style={{ position: "absolute", inset: 0, background: cor.papel, clipPath: varredura(p) }} />
        <div
          style={{
            position: "absolute",
            left: 26,
            right: 26,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: detalheEmBaixo ? "column" : "row",
            justifyContent: detalheEmBaixo ? "center" : "flex-start",
            alignItems: detalheEmBaixo ? "flex-start" : "center",
            gap: detalheEmBaixo ? 4 : 18,
          }}
        >
          <Linhas
            linhas={linhaTexto.linhas}
            tempos={tempos}
            t={t}
            esboco={p < 0.5 ? cor.apagadoNoAzul : cor.apagadoNoPapel}
            corDe={() => cor.tinta}
            style={{ ...manchete, fontWeight: 800, letterSpacing: 0, fontSize: linhaTexto.tam }}
          />
          {detalhe ? (
            <Palavras
              palavras={(it.detalhe ?? "").split(/\s+/).filter(Boolean)}
              tempos={temposDetalhe}
              t={t}
              esboco={pDetalhe > 0 || p > 0.5 ? cor.apagadoNoPapel : cor.apagadoNoAzul}
              corDe={() => "rgba(11,29,110,0.66)"}
              style={{ ...estiloTexto, fontWeight: 700, fontSize: detalhe.tam }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

// Distribui n linhas no espaço do painel abaixo do cabeçalho
export const linhasDoPainel = (area: Area, titulo: string | undefined, n: number, alturaMax = 112) => {
  const cab = medirCabecalho(titulo);
  const y0 = area.y + (cab ? 30 + cab.altura + 26 : 36);
  const disponivel = area.y + area.h - 30 - y0;
  const passo = disponivel / Math.max(1, n);
  const h = Math.max(54, Math.min(alturaMax, Math.round(passo - 14)));
  // sobrando espaço, a lista fica centrada na vertical
  // o espaço entre as linhas fica entre 14 e 26 px; o que sobra centra a lista na vertical
  const vao = Math.min(26, Math.max(14, passo - h));
  const usado = n * h + (n - 1) * vao;
  const folga = Math.max(0, (disponivel - usado) / 2);
  return { cab, y0: y0 + folga, passo: h + vao, h };
};

export const Topicos: React.FC<Props> = ({ m, palavras, t, area, entra }) => {
  if (t < entra) return null;
  const itens = m.itens.slice(0, 5);
  const temDetalhe = itens.some((i) => i.detalhe?.trim());
  const { cab, y0, passo, h } = linhasDoPainel(area, m.titulo, itens.length, temDetalhe ? 136 : 112);
  const detalheEmBaixo = temDetalhe && h >= 108;
  // o item que está sendo dito agora (a seta fica ao lado dele)
  const atual = itens.reduce((k, it, i) => (t >= it.em - 0.1 ? i : k), -1);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cab && m.titulo ? <Cabecalho titulo={m.titulo} medida={cab} palavras={palavras} t={t} de={m.de} ate={m.ate} inicio={Math.max(entra + 0.15, m.de)} y={area.y + 30} /> : null}
      {itens.map((it, i) => {
        const p = prog(t, it.em - 0.1, 0.3);
        const lado = h;
        return (
          <TarjaDoItem
            key={i}
            it={it}
            x={MARGEM}
            y={Math.round(y0 + i * passo)}
            w={W - 2 * MARGEM}
            h={h}
            t={t}
            palavras={palavras}
            de={m.de}
            ate={m.ate}
            detalheEmBaixo={detalheEmBaixo}
            marcador={
              <div style={{ position: "relative", width: lado, height: lado, flexShrink: 0, border: `4px dashed ${cor.apagadoNoAzul}` }}>
                <div style={{ position: "absolute", inset: -4, background: cor.eletrico, clipPath: varredura(p), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    style={{
                      width: Math.round(lado * 0.24),
                      height: Math.round(lado * 0.24),
                      background: cor.branco,
                      opacity: limitar((p - 0.4) / 0.4),
                      // o marcador do item atual vira uma seta (o "agora" da lista)
                      clipPath: i === atual ? "polygon(0 0, 100% 50%, 0 100%)" : "none",
                      scale: i === atual ? "1.5" : "1",
                    }}
                  />
                </div>
              </div>
            }
          />
        );
      })}
    </div>
  );
};
