import { Easing } from "remotion";
import { prog, temposDoTexto, TextoFalado } from "../anim";
import { encaixar } from "../medida";
import { AVATAR } from "../paginas";
import type { ItemDeLista, Palavra } from "../plano";
import { BASE_CONTEUDO, BASE_SEM_LEGENDA, cor, fonte, MARGEM, rotulo, W } from "../tema";
import { Desenho, desenhoDe, misturarCor } from "./Desenhos";

const LARGURA = W - 2 * MARGEM;
// o conteúdo começa logo abaixo do cabeçalho (avatar + nome)
const TOPO_CONTEUDO = AVATAR.y + AVATAR.lado + 44;

// Os três jeitos de listar no Carrossel:
// - "numeros" (lista): vagas numeradas; o número acende em coral quando o item chega;
// - "pontos" (topicos): sem ordem, um marcador coral redondo em cada vaga;
// - "passos" (passos): os números ficam numa coluna à esquerda, ligados por uma linha que
//   avança de um passo para o outro; os cartões chegam à direita.
export type Marcador = "numeros" | "pontos" | "passos";

export type DadosLista = {
  de: number;
  ate: number;
  legenda?: boolean;
  rotulo?: string;
  titulo?: string;
  itens: ItemDeLista[];
};

// Página de lista: título que se monta na fala e itens que chegam deslizando da direita, cada um no
// seu tempo, para uma vaga que já esperava por ele (nada vazio). O marcador do item da vez fica em
// coral; os anteriores escurecem (o marcador "anda" pela lista).
export const Lista: React.FC<{ m: DadosLista; palavras: Palavra[]; t: number; chegada: number; marcador?: Marcador }> = ({
  m,
  palavras,
  t,
  chegada,
  marcador = "numeros",
}) => {
  const itens = m.itens.slice(0, 5);
  const n = Math.max(itens.length, 1);
  const base = m.legenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA;
  const titulo = m.titulo?.trim()
    ? encaixar(m.titulo, { largura: LARGURA, max: n >= 5 ? 84 : 96, min: 66, linhas: 2, fonte: { peso: 800, espacamento: -0.03 }, preferirMenos: 0.85 })
    : null;
  const tempos = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, (itens[0]?.em ?? m.ate) + 0.2, m.de + 0.1) : [];
  const topoTitulo = TOPO_CONTEUDO;
  const alturaRotulo = m.rotulo ? 58 : 0;
  const alturaTitulo = alturaRotulo + (titulo ? titulo.linhas.length * titulo.tamanho * 1.02 : 0);
  const topoItens = topoTitulo + alturaTitulo + (titulo || m.rotulo ? 56 : 0);
  // os itens ocupam a página até os pontinhos (com poucos itens, as vagas ficam mais altas)
  const alturaItem = Math.min(n <= 3 ? 320 : 290, Math.floor((base - topoItens) / n));
  const vaoItens = n >= 5 ? 18 : 22;
  const alturaCartao = alturaItem - vaoItens;
  const circulo = Math.min(84, alturaCartao - 36);
  const comDesenho = itens.some((i) => desenhoDe(i));
  const tile = comDesenho ? Math.min(n <= 3 ? 190 : 170, alturaCartao - 44) : 0;
  // passos: a coluna dos números fica fora dos cartões
  const recuoCartao = marcador === "passos" ? circulo + 26 : 0;
  const larguraCartao = LARGURA - recuoCartao;
  const inicioTexto = marcador === "passos" ? 40 : 36 + circulo + 36;
  const colunaTexto = larguraCartao - inicioTexto - (comDesenho ? tile + 30 : 0) - 34;
  // o item da vez (o último que já chegou)
  const atual = itens.reduce((a, it, i) => (t >= it.em - 0.12 ? i : a), -1);

  // o texto encolhe até caber na vaga, com o detalhe embaixo
  const corpo = (it: ItemDeLista) => {
    let ultimo = null as null | { txt: ReturnType<typeof encaixar>; det: ReturnType<typeof encaixar> | null; alto: number };
    for (const k of [1, 0.92, 0.84, 0.76, 0.7]) {
      const maximo = n <= 3 ? 66 : n === 4 ? 58 : 50;
      const txt = encaixar(it.texto, { largura: colunaTexto, max: Math.round(maximo * k), min: Math.round(44 * Math.max(k, 0.85)), linhas: 2, fonte: { peso: 600 }, preferirMenos: 0.9 });
      const det = it.detalhe ? encaixar(it.detalhe, { largura: colunaTexto, max: Math.round((n <= 3 ? 44 : 40) * Math.max(k, 0.85)), min: 34, linhas: 1, fonte: { peso: 500 }, preferirMenos: 1 }) : null;
      const alto = txt.linhas.length * txt.tamanho * 1.1 + (det ? det.linhas.length * det.tamanho * 1.15 + 6 : 0);
      ultimo = { txt, det, alto };
      if (alto <= alturaCartao - 24) break;
    }
    return ultimo!;
  };

  return (
    <>
      <div style={{ position: "absolute", left: MARGEM, top: topoTitulo, width: LARGURA }}>
        {m.rotulo ? <div style={{ ...rotulo, color: cor.coral, marginBottom: 24, opacity: prog(t, chegada, 0.4), whiteSpace: "nowrap" }}>{m.rotulo}</div> : null}
        {titulo ? (
          <TextoFalado linhas={titulo.linhas} tempos={tempos} t={t} tamanho={titulo.tamanho} peso={800} cor={cor.petroleo} entrelinha={1.02} espacamento="-0.03em" />
        ) : null}
      </div>

      {/* passos: a linha que liga os números (pontilhada enquanto espera, cheia quando o próximo passo chega) */}
      {marcador === "passos"
        ? itens.slice(1).map((it, i) => {
            const y0 = topoItens + i * alturaItem + alturaCartao / 2 + circulo / 2 + 8;
            const y1 = topoItens + (i + 1) * alturaItem + alturaCartao / 2 - circulo / 2 - 8;
            const pl = prog(t, it.em - 0.35, 0.35, Easing.inOut(Easing.cubic));
            return (
              <svg key={`linha-${i}`} width={12} height={Math.max(1, y1 - y0)} style={{ position: "absolute", left: MARGEM + circulo / 2 - 6, top: y0, overflow: "visible" }}>
                <line x1={6} y1={0} x2={6} y2={y1 - y0} stroke={cor.areiaFunda} strokeWidth={5} strokeLinecap="round" strokeDasharray="1 12" />
                {pl > 0.01 ? <line x1={6} y1={0} x2={6} y2={(y1 - y0) * pl} stroke={cor.petroleo} strokeWidth={6} strokeLinecap="round" /> : null}
              </svg>
            );
          })
        : null}

      {itens.map((it, i) => {
        const y = topoItens + i * alturaItem;
        const p = prog(t, it.em - 0.12, 0.6);
        const pNum = prog(t, it.em - 0.05, 0.35);
        // depois que o próximo chega, o marcador deste escurece
        const passou = i < atual ? prog(t, (itens[i + 1]?.em ?? Infinity) - 0.05, 0.35) : 0;
        const fundoMarca = misturarCor(`rgba(233,104,76,${pNum.toFixed(3)})`, cor.petroleo, passou);
        const { txt, det, alto } = corpo(it);
        const nome = desenhoDe(it);
        return (
          <div key={`${it.texto}-${i}`} style={{ position: "absolute", left: MARGEM, top: y, width: LARGURA, height: alturaCartao }}>
            {/* vaga do item */}
            <div
              style={{
                position: "absolute",
                left: recuoCartao,
                top: 0,
                width: larguraCartao,
                height: alturaCartao,
                borderRadius: 36,
                border: `3px dashed rgba(15,75,90,${0.22 * (1 - p)})`,
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: recuoCartao,
                top: 0,
                width: larguraCartao,
                height: alturaCartao,
                borderRadius: 36,
                background: cor.areia,
                translate: p >= 0.999 ? undefined : `${(1 - p) * (W + 40)}px 0`,
              }}
            >
              <div style={{ position: "absolute", left: inicioTexto, top: (alturaCartao - alto) / 2 }}>
                {txt.linhas.map((l, k) => (
                  <div key={k} style={{ fontFamily: fonte, fontWeight: 600, fontSize: txt.tamanho, lineHeight: 1.1, height: txt.tamanho * 1.1, color: cor.petroleo, whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
                {det
                  ? det.linhas.map((l, k) => (
                      <div
                        key={`d${k}`}
                        style={{ fontFamily: fonte, fontWeight: 500, fontSize: det.tamanho, lineHeight: 1.15, marginTop: k === 0 ? 6 : 0, color: cor.petroleoSuave, whiteSpace: "nowrap" }}
                      >
                        {l}
                      </div>
                    ))
                  : null}
              </div>
              {nome ? (
                <div style={{ position: "absolute", right: 30, top: (alturaCartao - tile) / 2 }}>
                  <Desenho
                    nome={nome}
                    p={prog(t, it.em + 0.1, 0.8, Easing.inOut(Easing.cubic))}
                    tamanho={tile}
                    traco={5}
                    cores={{ linha: cor.petroleo, corpo: cor.creme, acento: cor.coral }}
                    t={t}
                    gas
                  />
                </div>
              ) : null}
            </div>
            {marcador === "pontos" ? (
              // marcador redondo: contorno enquanto espera, coral quando o item é dito
              <div
                style={{
                  position: "absolute",
                  left: 36 + circulo / 2 - 22,
                  top: alturaCartao / 2 - 22,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  boxShadow: `inset 0 0 0 4px rgba(15,75,90,${0.3 * (1 - pNum)})`,
                  background: fundoMarca,
                  scale: String(0.85 + 0.15 * pNum),
                }}
              />
            ) : (
              // número: contorno enquanto espera, coral quando o item é dito
              <div
                style={{
                  position: "absolute",
                  left: marcador === "passos" ? 0 : 36,
                  top: (alturaCartao - circulo) / 2,
                  width: circulo,
                  height: circulo,
                  borderRadius: circulo / 2,
                  boxShadow: `inset 0 0 0 4px rgba(15,75,90,${0.3 * (1 - pNum)})`,
                  background: fundoMarca,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonte,
                  fontWeight: 800,
                  fontSize: Math.round(circulo * 0.52),
                  color: pNum > 0.5 ? cor.creme : "rgba(15,75,90,0.4)",
                }}
              >
                {i + 1}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
