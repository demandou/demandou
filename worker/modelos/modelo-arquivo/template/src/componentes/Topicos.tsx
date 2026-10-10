import { Datilo, preciso, prog } from "../anim";
import { partesDaRegiao, type Regiao } from "../layout";
import { encaixar } from "../medida";
import type { Layout, Topicos as TTopicos } from "../plano";
import { cor, mono, sans } from "../tema";
import { Cabeca, medirCabeca } from "./Cabeca";
import { Cartao, Deslizar, NumeroDoItem } from "./Papel";

// Lista (motivos, erros, dicas, sinais): um relatório pré-impresso com linhas numeradas.
// Cada item é datilografado na sua linha quando é dito; antes disso a linha espera a lápis
// (número cinza, traço tracejado). Uma tarja vermelha na margem anda até o item da vez.
export const Topicos: React.FC<{ m: TTopicos; t: number; fim: number; regiao: Regiao; layout: Layout }> = ({ m, t, fim, regiao, layout }) => {
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const larguraTitulo = layout === "canto" ? partesDaRegiao(layout, regiao, 0).cabeca.w : regiao.w;
  // no canto, o título enche o pedaço ao lado da foto
  const cab = layout === "canto" ? medirCabeca(m.titulo, larguraTitulo - 8, 96, 3) : medirCabeca(m.titulo, larguraTitulo - 8);
  const { cabeca, corpo } = partesDaRegiao(layout, regiao, cab.altura);
  const TOPO = 26;
  const espaco = corpo.h - (layout === "canto" ? 10 : 16);
  // linhas de até 200 px: o relatório tem o tamanho da lista e fica no meio do espaço
  const linha = Math.min(200, (espaco - 10 - TOPO - 20) / Math.max(1, n));
  const alturaCartao = 10 + TOPO + 20 + linha * n;
  const cartao = { x: corpo.x, y: corpo.y + (layout === "canto" ? 0 : 6) + Math.max(0, (espaco - alturaCartao) / 2), w: corpo.w, h: alturaCartao };
  const MARGEM_NUM = 104;
  const larguraTexto = cartao.w - MARGEM_NUM - 44;
  // um corpo só para todos os itens (o maior que cabe em todos), para a lista ficar alinhada
  const maxCorpo = Math.max(44, Math.min(84, Math.floor(linha * 0.42)));
  const comDetalhe = itens.some((i) => i.detalhe);
  const linhasMax = linha > maxCorpo * 2.4 + (comDetalhe ? 46 : 0) ? 2 : 1;
  const corpoItem = Math.min(...itens.map((i) => encaixar(i.texto, { largura: larguraTexto, max: maxCorpo, min: 40, linhas: linhasMax, fonte: { peso: 700 } }).tamanho));
  // item da vez: o último já dito
  let atual = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  const anterior = atual > 0 ? atual - 1 : 0;
  const anda = atual >= 0 ? prog(t, itens[atual].em - 0.05, 0.3, preciso) : 0;
  const yMarcador = (anterior + (atual - anterior) * anda) * linha;
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      <Cabeca fit={cab.fit} x={cabeca.x} y={cabeca.y + (layout === "canto" ? 30 : 4)} em={m.de + 0.2} t={t} semente={200} />
      <Cartao x={cartao.x} y={cartao.y} w={cartao.w} h={cartao.h} rot={-0.5}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 10 + TOPO }}>
          {atual >= 0 ? (
            <div style={{ position: "absolute", left: 0, top: yMarcador + 10, width: 9, height: linha - 20, background: cor.vermelho }} />
          ) : null}
          {itens.map((it, i) => {
            const dito = t >= it.em - 0.05 ? 1 : 0;
            const fit = encaixar(it.texto, { largura: larguraTexto, max: corpoItem, min: corpoItem, linhas: linhasMax, fonte: { peso: 700 } });
            const det = it.detalhe ? encaixar(it.detalhe, { largura: larguraTexto, max: 36, min: 30, linhas: 1, fonte: { mono: true } }) : null;
            const alturaTexto = fit.linhas.length * fit.tamanho * 1.08 + (det ? det.tamanho * 1.2 + 6 : 0);
            return (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * linha, height: linha }}>
                <div style={{ position: "absolute", left: 36, top: linha / 2 - 17 }}>
                  <NumeroDoItem n={i + 1} aceso={dito} />
                </div>
                {dito ? (
                  <div style={{ position: "absolute", left: MARGEM_NUM, top: linha / 2 - alturaTexto / 2, width: larguraTexto }}>
                    <div style={{ fontFamily: sans, fontWeight: 700, fontSize: fit.tamanho, lineHeight: 1.08, color: cor.tinta }}>
                      {fit.linhas.map((l, k) => (
                        <div key={k} style={{ whiteSpace: "nowrap" }}>
                          <Datilo texto={l} em={it.em + k * 0.22} t={t} semente={210 + i * 5 + k} />
                        </div>
                      ))}
                    </div>
                    {det ? (
                      <div style={{ marginTop: 6, fontFamily: mono, fontWeight: 700, fontSize: det.tamanho, lineHeight: 1.2, color: cor.grafite, whiteSpace: "nowrap" }}>
                        <Datilo texto={det.linhas[0]} em={it.em + 0.45} t={t} semente={230 + i} />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  // a lápis: o traço tracejado onde o item vai ser escrito
                  <div style={{ position: "absolute", left: MARGEM_NUM, top: linha / 2 + 4, width: larguraTexto * 0.62, borderTop: `3px dashed ${cor.grafite}`, opacity: 0.32 }} />
                )}
                {i < n - 1 ? <div style={{ position: "absolute", left: 30, right: 30, bottom: 0, height: 2, background: cor.linha }} /> : null}
              </div>
            );
          })}
        </div>
      </Cartao>
    </Deslizar>
  );
};
