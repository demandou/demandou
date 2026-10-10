// A folha de cifra na estante (papel marfim, tinta escura, o azul mais fundo para o que soa agora),
// usada pelos blocos universais de texto:
// - `topicos`: cada item é uma linha da letra, com a bolinha de dedo que cai quando ele é dito e a faixa
//   embaixo que enche como karaokê enquanto ele é falado;
// - `definicao`: o termo vai em cima, como a cifra, e o significado embaixo, como a letra (que enche
//   palavra por palavra).
import { prog, suave, temposDasPalavras } from "../anim";
import { caber, type Encaixe, larguraDaLinha } from "../medida";
import type { Definicao as TDefinicao, Palavra, Topicos as TTopicos } from "../plano";
import { cor, fonte } from "../tema";
import { TextoFalado } from "../texto";
import type { Area } from "./Cena";

const PAD = 52;

export const Papel: React.FC<{ area: Area; children: React.ReactNode }> = ({ area, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: area.w, height: area.h, borderRadius: 30, background: cor.papel, overflow: "hidden" }}>
    {children}
  </div>
);

// título da folha: a lápis, ganha tinta palavra por palavra; o traço embaixo se desenha depois
const TituloDaFolha: React.FC<{ enc: Encaixe; tempos: number[]; t: number; largura: number }> = ({ enc, tempos, t, largura }) => {
  const fim = tempos[tempos.length - 1] ?? 0;
  return (
    <div>
      <TextoFalado enc={enc} tempos={tempos} t={t} cor={cor.tinta} lapis={cor.tintaLapis} peso={800} />
      <div style={{ marginTop: 18, height: 3, width: largura * prog(t, fim, 0.5), background: cor.tinta, opacity: 0.8 }} />
    </div>
  );
};

// faixa da letra que enche (karaokê)
const Faixa: React.FC<{ largura: number; cheio: number; ativa: boolean; altura?: number }> = ({ largura, cheio, ativa, altura = 12 }) => (
  <div style={{ width: largura, height: altura, borderRadius: altura / 2, background: cor.tintaLapis, overflow: "hidden" }}>
    <div style={{ width: `${Math.max(0, Math.min(1, cheio)) * 100}%`, height: "100%", background: ativa ? cor.azulTinta : cor.tinta, opacity: ativa ? 0.9 : 0.75 }} />
  </div>
);

// ———————————————————————————————————————————— tópicos

export const Topicos: React.FC<{ m: TTopicos; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const itens = [...m.itens].sort((a, b) => a.em - b.em).slice(0, 5);
  const n = itens.length;
  const largura = area.w - 2 * PAD;
  const primeiro = itens[0]?.em ?? m.de;
  const encTitulo = m.titulo ? caber(m.titulo, { largura, max: 68, min: 46, linhas: 2 }) : null;
  const tTitulo = m.titulo ? temposDasPalavras(m.titulo, palavras, m.de, primeiro + 0.2, m.de).tempos : [];
  const alturaTitulo = encTitulo ? encTitulo.linhas.length * encTitulo.tamanho * 1.08 + 21 + 34 : 0;
  const topoItens = PAD + alturaTitulo;
  const regiao = area.h - PAD - topoItens;
  const BOLA = 70;
  const larguraTexto = largura - BOLA;
  // um corpo só para todos os itens: o maior em que a lista inteira cabe na folha (cada item em até
  // 2 linhas, com a faixa e o detalhe); cada linha da lista tem a altura do seu conteúdo
  const FAIXA = 14 + 12;
  const FOLGA = n >= 5 ? 18 : 26;
  const medirItens = (tam: number) => {
    const encs = itens.map((i) => caber(i.texto, { largura: larguraTexto, max: tam, min: tam, linhas: 2 }));
    const dets = itens.map((i) =>
      i.detalhe ? caber(i.detalhe, { largura: larguraTexto, max: Math.max(32, Math.round(tam * 0.62)), min: 30, linhas: 1, estilo: { peso: 600 } }) : null,
    );
    const alturas = encs.map((e, k) => e.linhas.length * e.tamanho * 1.08 + FAIXA + (dets[k] ? 12 + (dets[k] as Encaixe).tamanho * 1.1 : 0) + FOLGA);
    return { encs, dets, alturas, total: alturas.reduce((s, h) => s + h, 0) };
  };
  const cabe = (x: ReturnType<typeof medirItens>, tam: number) => x.total <= regiao && x.encs.every((e) => e.tamanho === tam && e.linhas.length <= 2);
  let tamanho = 66;
  let medida = medirItens(tamanho);
  while (tamanho > 32 && !cabe(medida, tamanho)) {
    tamanho -= 2;
    medida = medirItens(tamanho);
  }
  const { encs, alturas } = medida;
  const detalhes = medida.dets;
  // sobra de altura vira respiro entre os itens (até 50 px cada)
  const respiro = Math.max(0, Math.min(50, (regiao - medida.total) / n));
  const linhaY = alturas.map((_, k) => alturas.slice(0, k).reduce((s, h) => s + h + respiro, 0));
  const emCurso = itens.reduce((k, it, i) => (t >= it.em - 0.02 ? i : k), -1);
  // a folha tem a altura do conteúdo e fica no meio do palco (nada de papel vazio)
  const alturaPapel = Math.min(area.h, topoItens + medida.total + respiro * n + PAD - 16);
  const topoPapel = (area.h - alturaPapel) / 2;
  const topo = topoItens;

  return (
    <div style={{ position: "absolute", left: 0, top: topoPapel, width: area.w, height: alturaPapel }}>
    <Papel area={{ ...area, h: alturaPapel }}>
      {encTitulo ? (
        <div style={{ position: "absolute", left: PAD, top: PAD - 6, width: largura }}>
          <TituloDaFolha enc={encTitulo} tempos={tTitulo} t={t} largura={largura} />
        </div>
      ) : null}
      {itens.map((it, i) => {
        const enc = encs[i];
        const y = topo + linhaY[i];
        const linhaH = alturas[i] + respiro;
        const proximo = itens[i + 1]?.em ?? Math.max(it.em + 1.2, Math.min(fim, it.em + 2.2));
        const { tempos } = temposDasPalavras(it.texto, palavras, it.em - 0.15, proximo + 0.2, it.em);
        const dito = prog(t, it.em - 0.04, 0.25);
        const ativo = i === emCurso;
        const alturaTexto = enc.linhas.length * enc.tamanho * 1.08;
        const larguraFaixa = Math.max(180, Math.min(larguraTexto, Math.max(...enc.linhas.map((l) => larguraDaLinha(enc.palavras, l, enc.tamanho)))));
        const cheio = (t - it.em) / Math.max(0.4, proximo - it.em);
        const det = detalhes[i];
        const yTexto = y + FOLGA / 2 + respiro / 2;
        const queda = 26 * (1 - suave(prog(t, it.em - 0.02, 0.24)));
        return (
          <div key={`${it.texto}-${i}`}>
            {/* a linha da vez */}
            <div
              style={{
                position: "absolute",
                left: PAD - 22,
                top: y + 4,
                width: largura + 44,
                height: linhaH - 8,
                borderRadius: 22,
                background: "rgba(44,106,156,0.11)",
                opacity: ativo ? dito : 0,
              }}
            />
            {/* a bolinha de dedo: tracejada a lápis, cai e se enche quando o item é dito */}
            <svg width={60} height={60} style={{ position: "absolute", left: PAD - 4, top: yTexto + enc.tamanho * 0.54 - 30, overflow: "visible" }}>
              <circle cx={30} cy={30} r={22} fill="none" stroke={cor.tintaLapis} strokeWidth={3} strokeDasharray="6 6" opacity={1 - dito} />
              <circle cx={30} cy={30 - queda} r={22 * (0.7 + 0.3 * dito)} fill={ativo ? cor.azulTinta : cor.tinta} opacity={dito} />
            </svg>
            <div style={{ position: "absolute", left: PAD + BOLA, top: yTexto, width: larguraTexto }}>
              <TextoFalado enc={enc} tempos={tempos} t={t} cor={ativo ? cor.azulTinta : cor.tinta} lapis={cor.tintaLapis} peso={800} />
              <div style={{ marginTop: 14 }}>
                <Faixa largura={larguraFaixa} cheio={cheio} ativa={ativo} />
              </div>
              {det ? (
                <div style={{ marginTop: 12 }}>
                  <TextoFalado
                    enc={det}
                    tempos={temposDasPalavras(it.detalhe ?? "", palavras, it.em, proximo + 0.3, it.em + 0.3).tempos}
                    t={t}
                    cor={cor.tintaSuave}
                    lapis={cor.tintaLapis}
                    peso={600}
                    espacamento={0}
                    alturaLinha={1.1}
                  />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Papel>
    </div>
  );
};

// ———————————————————————————————————————————— definição

export const Definicao: React.FC<{ m: TDefinicao; t: number; area: Area; palavras: Palavra[]; fim: number }> = ({ m, t, area, palavras, fim }) => {
  const largura = area.w - 2 * PAD;
  const encTermo = caber(m.termo, { largura, max: 140, min: 64, linhas: 2, estilo: { peso: 900, espacamento: -0.02 } });
  const tTermo = temposDasPalavras(m.termo, palavras, m.em - 0.15, m.significadoEm + 0.1, m.em).tempos;
  const encSig = caber(m.significado, { largura, max: 84, min: 44, linhas: 3, estilo: { peso: 700 } });
  const tSig = temposDasPalavras(m.significado, palavras, m.significadoEm - 0.15, fim + 0.1, m.significadoEm).tempos;
  const alturaTermo = encTermo.linhas.length * encTermo.tamanho * 1.08;
  const LINHA_SIG = encSig.tamanho * 1.08 + 34;
  const alturaSig = encSig.linhas.length * LINHA_SIG;
  const VAO = 44;
  const bloco = alturaTermo + VAO + alturaSig;
  // a folha tem a altura do conteúdo (com folga) e fica no meio do palco: nada de papel vazio
  const alturaPapel = Math.min(area.h, bloco + 2 * PAD + 40);
  const topoPapel = (area.h - alturaPapel) / 2;
  const topo = (alturaPapel - bloco) / 2;

  return (
    <div style={{ position: "absolute", left: 0, top: topoPapel, width: area.w, height: alturaPapel }}>
      <Papel area={{ ...area, h: alturaPapel }}>
        <div style={{ position: "absolute", left: PAD, top: topo, width: largura }}>
          <TextoFalado enc={encTermo} tempos={tTermo} t={t} cor={cor.azulTinta} lapis={cor.tintaLapis} peso={900} />
        </div>
        <div style={{ position: "absolute", left: PAD, top: topo + alturaTermo + VAO, width: largura }}>
          {encSig.linhas.map((linha, li) => {
            const sub: Encaixe = { tamanho: encSig.tamanho, palavras: encSig.palavras, linhas: [linha] };
            const inicio = tSig[linha[0]] ?? m.significadoEm;
            const ultimo = tSig[linha[linha.length - 1]] ?? inicio;
            const proxima = encSig.linhas[li + 1] ? (tSig[encSig.linhas[li + 1][0]] ?? ultimo + 0.4) : Math.min(fim, ultimo + 0.6);
            const cheio = (t - inicio) / Math.max(0.3, proxima - inicio);
            const larg = larguraDaLinha(encSig.palavras, linha, encSig.tamanho, { peso: 700 });
            return (
              <div key={li} style={{ height: LINHA_SIG }}>
                <TextoFalado enc={sub} tempos={tSig} t={t} cor={cor.tinta} lapis={cor.tintaLapis} peso={700} espacamento={0} />
                <div style={{ marginTop: 8 }}>
                  <Faixa largura={Math.max(160, larg)} cheio={cheio} ativa={t < proxima + 0.1 && t >= inicio} altura={12} />
                </div>
              </div>
            );
          })}
        </div>
      </Papel>
    </div>
  );
};
