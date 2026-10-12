import { indicesDoTrecho, Linha, marcaNoGrupo, normalizar, Palavras, prog, saindo, useTempo } from "../anim";
import { encaixar, larguraDe, larguraTexto, quebrar, ROTULO, SERIF } from "../medida";
import type { Citacao as TCitacao } from "../plano";
import { cor, minimo, rotulo, serif } from "../tema";
import { Ajuste, type Folga, Papel } from "./Pecas";

// A assinatura do Autoridade: o cartão-documento. Papel marfim com filete de latão, a fonte em
// letreiro, um título serifado e, embaixo:
//  · um trecho de texto em que o marca-texto de latão passa quando a ideia é dita (`texto` + `grifo`), ou
//  · linhas escritas uma a uma na fala (`itens`), como uma ficha que se preenche; o `grifo` pode
//    marcar uma delas. Com muitas linhas, a ficha rola: a linha nova entra embaixo.
// Serve para qualquer "documento" que sustenta a fala: lei, estudo, regra, receita, contrato, a ficha
// de um produto, o plano de uma aula, a lista de ingredientes, a prescrição.
export const Citacao: React.FC<{ m: TCitacao; largura: number; altura: number; folga?: Folga }> = ({ m, largura, altura: alturaMax, folga }) => {
  const t = useTempo();
  const sai = saindo(t, m.ate);
  const inicio = m.em ?? m.de;
  // o papel entra junto com o título (nunca um cartão em branco esperando)
  const entrada = Math.max(m.de, inicio - 0.2);
  const tituloEm = entrada + 0.05;
  const padX = 46;
  const [padTopo, padBase] = [34, 38];
  const interno = largura - 2 * padX;
  const itens = m.itens && m.itens.length >= 1 ? m.itens.slice(0, 6) : null;
  const tamFonte = 30;
  const linhasFonte = m.fonte ? Math.max(1, Math.ceil(larguraTexto(m.fonte, tamFonte, ROTULO) / interno)) : 0;
  const alturaFonte = m.fonte ? linhasFonte * tamFonte * 1.25 + 10 : 0;
  const grifoEm = m.grifoEm ?? inicio + 1;
  const pGrifo = prog(t, grifoEm, 0.5);
  const fio = 14 + 1 + 16;
  const larguraItem = interno - 50;
  const padItem = 10;

  // escolhe o corpo do título e do conteúdo para o cartão caber na zona
  const medir = (tamTitulo: number, tamCorpo: number) => {
    const qt = encaixar(m.titulo, { largura: interno, max: tamTitulo, min: Math.min(minimo.titulo, tamTitulo), linhas: 2 });
    const cabeca = 6 + padTopo + alturaFonte + qt.linhas.length * qt.tamanho * 1.0 + fio;
    let alturaCorpo = 0;
    if (itens) alturaCorpo = itens.reduce((s, it) => s + quebrar(it.texto, larguraItem, tamCorpo).length * tamCorpo * 1.08 + 2 * padItem, 0);
    else if (m.texto) alturaCorpo = quebrar(m.texto, interno, tamCorpo).length * tamCorpo * 1.22;
    return { titulo: qt, corpo: tamCorpo, cabeca, alturaCorpo, total: cabeca + alturaCorpo + padBase };
  };
  // ficha: título e linhas não encolhem além de 88/50 (a partir daí, a ficha rola)
  const [tituloMax, tituloMin, corpoMax, corpoMin] = itens ? [104, 88, 56, 50] : [124, minimo.titulo, 48, 42];
  const buscar = (limite: number) => {
    for (let tt = tituloMax; tt >= tituloMin; tt -= 8) {
      for (let tc = corpoMax; tc >= corpoMin; tc -= 2) {
        const r = medir(tt, tc);
        if (r.total <= limite) return r;
      }
    }
    return null;
  };
  // primeiro na zona; se não couber, com a folga (até 90 px acima); senão, no menor tamanho
  const naZona = buscar(folga?.zona ?? alturaMax);
  const comFolga = naZona ? null : buscar(alturaMax);
  const altura = naZona ? (folga?.zona ?? alturaMax) : alturaMax;
  const medidas = naZona ?? comFolga ?? medir(tituloMin, corpoMin);
  // Ficha com linhas demais para a zona: a lista de linhas vira uma janela que rola (o texto nunca
  // fica pequeno demais). Texto corrido longo demais: o cartão inteiro encolhe (último recurso).
  const janela = itens ? Math.max(0, altura - medidas.cabeca - padBase) : 0;
  const rola = !!itens && medidas.alturaCorpo > janela + 2;
  const escala = itens ? 1 : Math.min(1, altura / medidas.total);
  const alturaCartao = itens ? (rola ? altura : medidas.total) : medidas.total * escala;

  // marca-texto num item: a linha inteira do item, como uma caneta passando
  const marcaTexto = (p: number): React.CSSProperties => ({
    color: cor.tinta,
    backgroundImage: `linear-gradient(${cor.latao}, ${cor.latao})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0 88%",
    backgroundSize: `${p * 100}% 42%`,
  });
  // marca-texto no trecho do texto corrido: corre palavra a palavra, proporcional à largura
  const grifo = !itens && m.texto ? indicesDoTrecho(m.texto, m.grifo) : new Set<number>();
  const grupo = [...grifo].sort((a, b) => a - b);
  const linhasTexto = !itens && m.texto ? quebrar(m.texto, interno, medidas.corpo) : [];
  const marcaGrifo = m.texto ? marcaNoGrupo(grupo, larguraDe(m.texto, medidas.corpo), pGrifo) : new Map<number, number>();
  const itemGrifado = itens && m.grifo ? itens.findIndex((it) => normalizar(it.texto).includes(normalizar(m.grifo ?? ""))) : -1;

  // ficha: posição de cada linha e o deslocamento quando rola
  const quebrasItens = itens ? itens.map((it) => quebrar(it.texto, larguraItem, medidas.corpo)) : [];
  const alturasItens = quebrasItens.map((q) => q.length * medidas.corpo * 1.08 + 2 * padItem);
  const topos = alturasItens.map((_, k) => alturasItens.slice(0, k).reduce((s, h) => s + h, 0));
  let desloc = 0;
  if (rola && itens) {
    let anterior = 0;
    itens.forEach((it, k) => {
      // o corte cai sempre entre duas linhas da ficha
      const fundo = topos[k] + alturasItens[k];
      const primeiro = topos.findIndex((tp) => fundo - tp <= janela + 0.5);
      const alvo = Math.max(0, topos[Math.max(0, primeiro)]);
      desloc += (alvo - anterior) * prog(t, it.em - 0.12, 0.5);
      anterior = alvo;
    });
  }

  return (
    <Ajuste h={alturaCartao} folga={folga}>
    <div style={{ width: "100%", height: alturaCartao, display: "flex", alignItems: "flex-start" }}>
      <div style={{ width: "100%", scale: String(escala), transformOrigin: "center top" }}>
        <Papel t={t} de={entrada} ate={m.ate} sai={sai} padding={`${padTopo}px ${padX}px ${padBase}px`} style={rola ? { height: altura } : undefined}>
          {m.fonte ? (
            <div style={{ ...rotulo, fontSize: tamFonte, color: "rgba(14,23,38,0.58)", lineHeight: 1.25, marginBottom: 10, opacity: prog(t, entrada + 0.1, 0.4) }}>
              {m.fonte}
            </div>
          ) : null}
          {medidas.titulo.linhas.map((l, j) => (
            <Linha
              key={j}
              p={prog(t, tituloEm + j * 0.08, 0.55)}
              style={{ fontFamily: serif, fontSize: medidas.titulo.tamanho, lineHeight: 1.0, color: cor.tinta, whiteSpace: "nowrap" }}
            >
              {l.map((p) => p.w).join(" ")}
            </Linha>
          ))}
          <div style={{ height: 1, background: cor.fioTinta, margin: "14px 0 16px", width: `${prog(t, tituloEm + 0.2, 0.6) * 100}%` }} />
          {itens ? (
            <div
              style={{
                position: "relative",
                height: rola ? janela : medidas.alturaCorpo,
                overflow: rola ? "hidden" : "visible",
                maskImage: rola && desloc > 1 ? "linear-gradient(to bottom, transparent 0, black 22px, black 100%)" : undefined,
              }}
            >
              {itens.map((it, k) => {
                const entra = prog(t, it.em, 0.5);
                const grifado = k === itemGrifado;
                // antes de ser dita, a linha da ficha já está pautada a lápis (o cartão nunca fica em branco)
                if (t < it.em - 0.05)
                  return (
                    <div
                      key={`${it.texto}-${k}`}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: topos[k] - desloc,
                        height: alturasItens[k],
                        borderBottom: `1.5px dashed rgba(14,23,38,${0.2 * prog(t, entrada + 0.15 + k * 0.06, 0.4)})`,
                      }}
                    >
                      <div style={{ width: 30, height: 3, marginTop: padItem + medidas.corpo * 0.58, background: "rgba(14,23,38,0.16)", opacity: prog(t, entrada + 0.15 + k * 0.06, 0.4) }} />
                    </div>
                  );
                return (
                  <div
                    key={`${it.texto}-${k}`}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: topos[k] - desloc,
                      height: alturasItens[k],
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 20,
                      padding: `${padItem}px 0`,
                      borderBottom: k < itens.length - 1 ? `1px solid rgba(14,23,38,${0.14 * entra})` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 3,
                        marginTop: medidas.corpo * 0.58,
                        background: cor.latao,
                        scale: `${entra} 1`,
                        transformOrigin: "left",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      {quebrasItens[k].map((l, j) => (
                        <Linha
                          key={j}
                          p={prog(t, it.em + 0.06 + j * 0.07, 0.5)}
                          style={{ fontFamily: serif, fontSize: medidas.corpo, lineHeight: 1.08, color: "rgba(14,23,38,0.88)", whiteSpace: "nowrap" }}
                        >
                          <span style={grifado ? marcaTexto(pGrifo) : undefined}>{l.map((p) => p.w).join(" ")}</span>
                        </Linha>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : m.texto ? (
            <Palavras
              linhas={linhasTexto}
              tempos={linhasTexto.flat().map(() => inicio + 0.25)}
              t={t}
              tamanho={medidas.corpo}
              alturaLinha={1.22}
              alinhar="left"
              estilo={() => SERIF}
              cor={(i) => (grifo.has(i) ? cor.tinta : "rgba(14,23,38,0.86)")}
              marca={(i) => (grifo.has(i) ? { tipo: "grifo", cor: cor.latao, p: marcaGrifo.get(i) ?? 0, liga: grifo.has(i + 1) } : null)}
              dur={0.5}
            />
          ) : null}
        </Papel>
      </div>
    </div>
    </Ajuste>
  );
};
