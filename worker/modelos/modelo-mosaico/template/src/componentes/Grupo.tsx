import { limitar, mistura, prog } from "../anim";
import { encaixar, encaixarTodos } from "../medida";
import type { Grupo as TGrupo } from "../plano";
import { display, sans } from "../tema";
import { ehClaro, F_APOIO, F_ITEM, F_TITULO, lapis, respiro, TextoFalado, type Paleta, type PropsBloco } from "./comum";
import { Fracao } from "./Fracao";
import { Icone } from "./Icones";

// Fundo das peças pequenas dentro do bloco (mosaico dentro do mosaico)
export const fundoPeca = (pal: Paleta, ativo: number) =>
  !ehClaro(pal) ? `rgba(255,250,240,${mistura(0.1, 0.2, ativo)})` : `rgba(38,40,33,${mistura(0.07, 0.13, ativo)})`;

// Grupo: fração (ou número curto) grande + nome do grupo em cima; embaixo, uma casa para cada item. As casas
// nascem com o bloco, "a lápis" (o ícone tracejado e apagado, ou só o contorno da casa), e cada uma se
// completa quando o item é dito: o fundo acende, o traço cheio passa por cima do esboço e o nome entra.
// Sem ícone, a casa vira uma peça de texto: o nome do item, grande, no meio da casa.
export const Grupo: React.FC<PropsBloco<TGrupo>> = ({ b, t, w, h, util, pal, palavras, janela }) => {
  const pad = respiro(w, h);
  const interna = w - 2 * pad;
  const alto = Math.min(h, util);
  const itens = b.itens.slice(0, 6);
  const n = Math.max(itens.length, 1);
  const alturaCab = limitar(alto * (alto < 700 ? 0.24 : 0.28), 110, 280);
  const fracao = b.fracao?.trim();
  const largFracao = fracao ? (fracao.includes("/") ? alturaCab * 0.98 : Math.min(interna * 0.45, alturaCab * 0.62 * fracao.length)) : 0;
  const largTitulo = interna - (fracao ? largFracao + 40 : 0);
  const tit = encaixar(b.titulo, { largura: largTitulo, altura: alturaCab * 0.95, max: 100, min: 40, linhas: 2, fonte: F_TITULO, entrelinha: 1.04 });

  // casas dos itens
  const topoItens = pad + alturaCab + 30;
  const altItens = alto - pad - topoItens;
  const gap = 18;
  const comIcone = itens.some((i) => i.icone);
  const temTexto = itens.some((i) => i.texto);
  const tamTextoBase = Math.round(limitar(interna * 0.055, 46, 52));
  const medir = (colunas: number) => {
    const filas = Math.ceil(n / colunas);
    const larguraPeca = (interna - (colunas - 1) * gap) / colunas;
    const alturaPeca = Math.min((altItens - (filas - 1) * gap) / filas, larguraPeca * (comIcone ? 1.15 : 0.8));
    // o nome embaixo do ícone: até 2 linhas, de 34 a 52 px; o ícone fica com o resto da casa
    const nomes0 = comIcone && temTexto ? encaixarTodos(itens.map((i) => i.texto ?? ""), { largura: larguraPeca - 28, max: tamTextoBase, min: 34, linhas: 2, fonte: F_APOIO, entrelinha: 1.05 }) : [];
    // casa pequena demais para o nome legível (ladrilho companheiro): só o ícone
    const cabeNome = nomes0.length > 0 && nomes0.every((x) => x.tamanho >= 34);
    const altNome = cabeNome ? Math.max(...nomes0.map((x) => x.altura)) + tamTextoBase * 0.5 : 0;
    const tamIcone = comIcone ? Math.min(larguraPeca * 0.62, (alturaPeca - altNome) * 0.78) : 0;
    // sem ícone: o tamanho do texto que cabe na casa é o que decide
    const nota = comIcone ? tamIcone : encaixarTodos(itens.map((i) => i.texto ?? ""), { largura: larguraPeca - 36, altura: alturaPeca - 30, max: 76, min: 34, linhas: 2, fonte: F_ITEM }).reduce((a, e) => Math.min(a, e.tamanho), 999);
    return { colunas, filas, larguraPeca, alturaPeca, tamIcone, nota, cabeNome };
  };
  // uma fila só; 2 × 2 com quatro itens; 3 + 2 ou 3 + 3 com cinco ou seis (nunca uma casa sozinha na última
  // fila). As casas mais quadradas ganham quando o ícone (ou o texto) fica quase do mesmo tamanho.
  const opcoes = [medir(n), ...(n === 4 ? [medir(2)] : []), ...(n >= 5 ? [medir(3)] : []), ...(!comIcone && n <= 3 && n > 1 ? [medir(1)] : [])];
  const { colunas, larguraPeca, alturaPeca, tamIcone, cabeNome } = opcoes.reduce((a, o) => (o.nota > a.nota * 0.92 ? o : a));
  // bloco baixo demais para ícone em cima do nome: as casas viram fichas deitadas (ícone ao lado do nome)
  const deitado = comIcone && temTexto && cabeNome && tamIcone < 96;
  const colD = n <= 2 ? n : 2;
  const filasD = Math.ceil(n / colD);
  const larguraD = (interna - (colD - 1) * gap) / colD;
  const alturaD = Math.min((altItens - (filasD - 1) * gap) / filasD, 150);
  const lp = deitado ? larguraD : larguraPeca;
  const ap = deitado ? alturaD : alturaPeca;
  const cols = deitado ? colD : colunas;
  const filas = Math.ceil(n / cols);
  const altura = filas * (ap + gap) - gap;
  // casas centradas na vertical dentro da área dos itens
  const topo = topoItens + Math.max(0, (altItens - altura) / 2);
  const iconeDe = deitado ? ap * 0.62 : tamIcone;
  // textos das casas, medidos: embaixo do ícone (uma linha), ao lado (deitado) ou sozinhos (casa de texto)
  const largNome = deitado ? lp - 52 - iconeDe - 22 : lp - 28;
  const nomes = comIcone
    ? encaixarTodos(itens.map((i) => i.texto ?? ""), { largura: largNome, max: tamTextoBase, min: 34, linhas: 2, fonte: F_APOIO, entrelinha: 1.05 })
    : encaixarTodos(itens.map((i) => i.texto ?? ""), { largura: lp - 36, altura: ap - 30, max: 76, min: 34, linhas: 2, fonte: F_ITEM, entrelinha: 1.04 });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: pad, top: pad, width: interna, height: alturaCab, display: "flex", alignItems: "center", gap: 40 }}>
        {fracao ? (
          <div style={{ flexShrink: 0 }}>
            <Fracao texto={fracao} altura={alturaCab} cor={pal.acento} t={t} de={janela.de + 0.05} largura={largFracao} />
          </div>
        ) : null}
        <div style={{ width: largTitulo }}>
          <TextoFalado
            linhas={tit.linhas}
            t={t}
            palavras={palavras}
            janela={janela}
            tamanho={tit.tamanho}
            cor={pal.texto}
            estilo={{ fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" }}
          />
        </div>
      </div>
      {itens.map((item, i) => {
        const pCasa = prog(t, janela.de + 0.3 + i * 0.07, 0.45);
        if (pCasa <= 0.001) return null;
        const p = prog(t, item.em - 0.08, 0.5);
        const proximo = itens[i + 1];
        const ativo = p <= 0 ? 0 : !proximo || t < proximo.em - 0.08 ? prog(t, item.em - 0.08, 0.3) : 1 - prog(t, proximo.em - 0.08, 0.3);
        const col = i % cols;
        const fila = Math.floor(i / cols);
        // última fila incompleta fica centrada
        const naFila = fila === filas - 1 ? n - fila * cols : cols;
        const sobra = (cols - naFila) * (lp + gap);
        const x = pad + sobra / 2 + col * (lp + gap);
        const y = topo + fila * (ap + gap);
        const pTexto = prog(t, item.em + (item.icone ? 0.12 : 0), 0.45);
        const tracejado = lapis(pal);
        const nome = nomes[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: lp,
              height: ap,
              borderRadius: 22,
              background: p > 0 ? fundoPeca(pal, ativo) : "transparent",
              opacity: pCasa * (p > 0 ? 1 : 0.9),
              outline: p < 0.999 ? `2.5px dashed ${lapis(pal, p)}` : undefined,
              outlineOffset: -2,
              scale: String(p > 0 ? mistura(0.9, 1, p) : mistura(0.95, 1, pCasa)),
              display: "flex",
              flexDirection: deitado ? "row" : "column",
              alignItems: "center",
              justifyContent: deitado ? "flex-start" : "center",
              padding: deitado ? "0 26px" : 0,
              gap: deitado ? 22 : tamTextoBase * 0.3,
            }}
          >
            {item.icone ? (
              <Icone nome={item.icone} tamanho={iconeDe} cor={pal.traco} p={prog(t, item.em, 0.75)} esboco={1 - prog(t, item.em + 0.2, 0.5)} peso={5} corClara={pal.fundo === "#F8F3E9" ? "#FFFFFF" : "#F8F3E9"} />
            ) : comIcone ? (
              <div style={{ width: iconeDe, height: iconeDe, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: iconeDe * 0.42, height: iconeDe * 0.42, borderRadius: iconeDe * 0.1, background: p > 0 ? pal.acento : "transparent", outline: p < 0.999 ? `2.5px dashed ${tracejado}` : undefined, scale: String(mistura(0.6, 1, p)) }} />
              </div>
            ) : null}
            {item.texto && (!comIcone || cabeNome) && nome.tamanho >= 30 ? (
              <div
                style={{
                  fontFamily: comIcone ? sans : display,
                  fontWeight: comIcone ? 600 : 700,
                  fontSize: nome.tamanho,
                  lineHeight: comIcone ? 1.05 : 1.04,
                  letterSpacing: comIcone ? undefined : "-0.015em",
                  textAlign: deitado ? "left" : "center",
                  color: pal.texto,
                  opacity: pTexto,
                  translate: pTexto < 0.999 ? `0 ${(1 - pTexto) * 12}px` : undefined,
                }}
              >
                {nome.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap", textAlign: deitado ? "left" : "center" }}>
                    {l}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
