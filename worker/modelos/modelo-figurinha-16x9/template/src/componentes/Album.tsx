// A lista como álbum de figurinhas.
// - Herói: a figurinha da vez, grande. Chega numa cartela (o papel de fundo), o canto descola,
//   ela sobe da cartela (que fica com o recorte vazio e sai), assenta na página, o nome e o porquê
//   se escrevem no ritmo da fala e o carimbo bate. Quando o próximo item começa, ela voa para a
//   sua casa na fileira do álbum.
// - Fileira: as casas do álbum, numeradas, com o esboço a lápis do que vai ser colado.
import { indicesDoTrecho, limitar, mistura, Palavras, prog, temposDoTexto, troca } from "../anim";
import { casaDaFileira, type RoteiroDoItem } from "../layout";
import { CORPO, encaixar, TITULO } from "../medida";
import type { Album as AlbumT, Desenho as NomeDesenho, Item, Palavra } from "../plano";
import { cor, corpo, fundos, HEROI, rotulo, titulo } from "../tema";
import { Carimbo, larguraDoCarimbo } from "./Carimbo";
import { Desenho, fundoDoDesenho } from "./Desenhos";
import { Figurinha, sombraDePapel } from "./Figurinha";

const BORDA = 14;
const INCLINACAO_HEROI = [-1.4, 1.2, -0.8, 1.5];
const INCLINACAO_CASA = [-2.6, 1.8, -1.4, 2.4];

// O item em qualquer assunto: nome (ou `texto`), desenho (padrão: o número do item, grande) e o
// símbolo da figurinha de texto.
export const nomeDoItem = (item: Item) => (item.nome || (item.desenho !== "texto" ? item.texto : "") || "").trim();
export const desenhoDoItem = (item: Item): NomeDesenho => item.desenho ?? "texto";
export const simboloDoItem = (item: Item, i: number) =>
  item.simbolo ?? (item.desenho === "texto" && item.texto && item.texto !== item.nome ? item.texto : undefined) ?? String(i + 1);

const FUNDOS_PADRAO = ["rosa", "manteiga", "menta", "ceu", "lavanda"] as const;
const fundoDo = (r: RoteiroDoItem) =>
  fundos[r.item.fundo ?? (r.item.desenho ? fundoDoDesenho[r.item.desenho] : FUNDOS_PADRAO[r.indice % FUNDOS_PADRAO.length])];
const ALTURA_CARIMBO = 185;
// com o desenho menor (nome comprido), o carimbo também é menor
const alturaDoCarimbo = (r: RoteiroDoItem) => (medidasDoHeroi(r.item).desenho < 400 ? 150 : ALTURA_CARIMBO);
// o carimbo fica sobre o desenho, sem invadir a coluna do texto (o padrão do demo continua 440)
const maxCarimbo = (r: RoteiroDoItem) => (r.textoCarimbo ? Math.max(330, medidasDoHeroi(r.item).desenho - 20) : 440);

// O conteúdo da figurinha grande: o desenho fica do lado da pessoa e o texto (número, nome e
// porquê) do lado do cachorro; a cada item os lados trocam junto com a pessoa.
// `some` (0–1): o texto some no começo do voo para o álbum (lá só vai o desenho).
const ConteudoHeroi: React.FC<{
  r: RoteiroDoItem;
  palavras: Palavra[];
  t: number;
  fimDaFala: number;
  recusa: boolean;
  desenhoADireita: boolean;
  some: number;
}> = ({ r, palavras, t, fimDaFala, recusa, desenhoADireita, some }) => {
  const { item } = r;
  const nome = nomeDoItem(item);
  const wi = HEROI.w - 2 * BORDA;
  const hi = HEROI.h - 2 * BORDA;
  const temposNome = temposDoTexto(nome, palavras, item.em - 0.1, fimDaFala, r.chega + 0.15);
  const inicioMotivo = (temposNome[temposNome.length - 1] ?? item.em) + 0.1;
  const temposMotivo = item.motivo ? temposDoTexto(item.motivo, palavras, inicioMotivo - 0.2, fimDaFala, inicioMotivo) : [];
  const destaque = indicesDoTrecho(item.motivo ?? "", item.destaque);
  const { desenho, larguraTexto, encNome, encMotivo } = medidasDoHeroi(item);
  // carimbo: o desenho desbota (no "não pode", cinza e claro; no "pode", só mais claro) para o
  // carimbo ler por cima
  const desbota = r.carimbo !== null ? prog(t, r.carimbo, 0.3) : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: desenhoADireita ? wi - desenho - 14 : 14,
          top: (hi - desenho) / 2,
          width: desenho,
          height: desenho,
          filter: desbota > 0 ? `grayscale(${(recusa ? 0.8 : 0.35) * desbota}) opacity(${1 - (recusa ? 0.55 : 0.45) * desbota})` : undefined,
        }}
      >
        <Desenho nome={desenhoDoItem(item)} tamanho={desenho} texto={simboloDoItem(item, r.indice)} />
      </div>
      <div
        style={{
          position: "absolute",
          left: desenhoADireita ? 40 : desenho + 34,
          width: larguraTexto,
          top: 24,
          bottom: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: cor.tinta,
          opacity: 1 - some,
        }}
      >
        <div style={{ alignSelf: "flex-start", background: cor.tinta, color: cor.cartela, borderRadius: 12, padding: "8px 16px 7px", ...rotulo(36) }}>
          Nº {String(r.indice + 1).padStart(2, "0")}
        </div>
        <Palavras
          texto={nome}
          tempos={temposNome}
          t={t}
          quebras={encNome.quebras}
          style={{ ...titulo(encNome.tamanho), marginTop: 18 }}
          corDe={() => cor.tinta}
          esboco={cor.lapis}
        />
        {item.motivo && encMotivo ? (
          <Palavras
            texto={item.motivo}
            tempos={temposMotivo}
            t={t}
            quebras={encMotivo.quebras}
            style={{ ...corpo(encMotivo.tamanho, 760), marginTop: 16, width: larguraTexto }}
            corDe={(i) => (destaque.has(i) ? cor.carimbo : cor.tinta)}
            esboco={cor.lapis}
          />
        ) : null}
      </div>
    </div>
  );
};

const desenhoDoHeroi = () => Math.min(HEROI.h - 2 * BORDA - 30, 470);

// Medidas da figurinha grande: o nome cabe em até duas linhas (três, sem porquê) e o porquê em até
// três, medidos com a largura da fonte; nome comprido ganha espaço: o desenho encolhe um pouco.
export const medidasDoHeroi = (item: Item) => {
  const nome = nomeDoItem(item);
  const wi = HEROI.w - 2 * BORDA;
  const medirCom = (desenho: number) => {
    const larguraTexto = wi - desenho - 34 - 34;
    const encNome = item.motivo
      ? encaixar(nome, { largura: larguraTexto, max: 84, min: 56, linhas: 2, ...TITULO })
      : encaixar(nome, { largura: larguraTexto, max: 92, min: 60, linhas: 3, ...TITULO });
    return { desenho, larguraTexto, encNome };
  };
  const cheio = medirCom(desenhoDoHeroi());
  // o desenho grande só fica se o nome couber em até duas linhas, grande
  const escolha = cheio.encNome.tamanho >= 74 && cheio.encNome.linhas.length <= 2 ? cheio : medirCom(360);
  const encMotivo = item.motivo ? encaixar(item.motivo, { largura: escolha.larguraTexto, max: 48, min: 40, linhas: 3, ...CORPO }) : null;
  return { ...escolha, encMotivo };
};

const Cartela: React.FC<{ w: number; h: number; vazia: number }> = ({ w, h, vazia }) => (
  // o papel de fundo da figurinha: creme, com o recorte (linha fina) onde ela estava
  <div style={{ position: "absolute", left: -22, top: -22, width: w + 44, height: h + 44, filter: sombraDePapel(0.1) }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 30,
        background: "#EFE6D6",
        backgroundImage: "repeating-linear-gradient(135deg, rgba(181,168,147,0.16) 0 2px, transparent 2px 14px)",
      }}
    />
    <div style={{ position: "absolute", left: 22, top: 22, width: w, height: h, borderRadius: 24, border: `2.5px solid ${cor.lapis}`, opacity: 0.4 + 0.6 * vazia }} />
  </div>
);

export const Herois: React.FC<{
  m: AlbumT;
  roteiro: RoteiroDoItem[];
  palavras: Palavra[];
  t: number;
  // lado da pessoa em cada item: o desenho fica do lado dela
  lados: ("esquerda" | "direita")[];
}> = ({ m, roteiro, palavras, t, lados }) => (
  <>
    {roteiro.map((r, i) => {
      if (t < r.chega - 0.02 || t > r.guarda + 0.62) return null;
      const casa = casaDaFileira(i, roteiro.length);
      const inclinacao = INCLINACAO_HEROI[i % INCLINACAO_HEROI.length];
      const proxima = roteiro[i + 1];
      const fimDaFala = proxima ? proxima.item.em : m.ate;
      // chegada (cartela + figurinha deslizando da direita)
      const pChega = prog(t, r.chega, 0.46);
      const dx = (1 - pChega) * 860;
      const giroCartela = mistura(8, 1.6, pChega);
      // o canto descola, a figurinha sobe e depois assenta
      const canto = prog(t, r.descola, 0.3) * (1 - prog(t, r.sobe + 0.05, 0.25));
      const sobe = prog(t, r.sobe, 0.3);
      const assenta = prog(t, r.cola, 0.24);
      const levanta = sobe * (1 - assenta) + 0.06 * assenta;
      // a cartela vai embora por baixo
      const pCartela = prog(t, r.sobe + 0.08, 0.46);
      // batida do carimbo: a figurinha afunda um nada
      const bate = r.carimbo !== null ? prog(t, r.carimbo - 0.02, 0.05) * (1 - prog(t, r.carimbo + 0.05, 0.2)) : 0;
      // vai para a casa da fileira
      const pGuarda = prog(t, r.guarda, 0.52, troca);
      const escalaCasa = casa.w / HEROI.w;
      const cxH = HEROI.x + HEROI.w / 2;
      const cyH = HEROI.y + HEROI.h / 2;
      const cxC = casa.x + casa.w / 2;
      const cyC = casa.y + casa.h / 2;
      const giro = mistura(mistura(giroCartela, inclinacao, sobe), INCLINACAO_CASA[i % INCLINACAO_CASA.length], pGuarda);
      const escala = mistura(1, escalaCasa, pGuarda) * (1 - 0.02 * bate);
      const voo = Math.sin(pGuarda * Math.PI) * 0.6;
      const opacidade = 1 - limitar((pGuarda - 0.62) / 0.3);
      // no começo do voo o texto e o carimbo grande somem: para o álbum vai só o desenho
      const some = prog(t, r.guarda - 0.04, 0.16);
      const desenhoADireita = lados[i] === "direita";
      return (
        <div key={`heroi-${i}`}>
          {pCartela < 1 ? (
            <div
              style={{
                position: "absolute",
                left: HEROI.x + dx - 40 * pCartela,
                top: HEROI.y + 110 * pCartela,
                width: HEROI.w,
                height: HEROI.h,
                rotate: `${giroCartela + 3 * pCartela}deg`,
                opacity: 1 - pCartela,
              }}
            >
              <Cartela w={HEROI.w} h={HEROI.h} vazia={sobe} />
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: mistura(cxH, cxC, pGuarda) - HEROI.w / 2 + dx,
              top: mistura(cyH, cyC, pGuarda) - HEROI.h / 2 - 24 * sobe * (1 - assenta) - 30 * voo,
              width: HEROI.w,
              height: HEROI.h,
              rotate: `${giro}deg`,
              scale: String(escala),
              opacity: opacidade,
            }}
          >
            {/* o canto descola do lado do desenho, nunca por cima do texto */}
            <Figurinha w={HEROI.w} h={HEROI.h} fundo={fundoDo(r)} raio={30} borda={BORDA} levanta={Math.max(levanta, voo)} canto={canto} cantoEsquerdo={!desenhoADireita}>
              <ConteudoHeroi r={r} palavras={palavras} t={t} fimDaFala={fimDaFala} recusa={r.tipoCarimbo !== "pode"} desenhoADireita={desenhoADireita} some={some} />
            </Figurinha>
            {r.carimbo !== null ? (
              <div style={{ position: "absolute", inset: 0, opacity: 1 - some }}>
                <Carimbo
                  t={t}
                  em={r.carimbo}
                  altura={alturaDoCarimbo(r)}
                  largura={440}
                  larguraMax={maxCarimbo(r)}
                  tipo={r.tipoCarimbo}
                  texto={r.textoCarimbo}
                  inclinacao={desenhoADireita ? 10 : -12}
                  style={{
                    left: desenhoADireita
                      ? HEROI.w - 22 - larguraDoCarimbo(r.textoCarimbo ?? (r.tipoCarimbo === "pode" ? "PODE" : "NÃO PODE"), alturaDoCarimbo(r), maxCarimbo(r))
                      : 22,
                    top: HEROI.h / 2 - 76,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      );
    })}
  </>
);

// A fileira do álbum: casas numeradas com esboço a lápis; a figurinha guardada aparece no lugar.
export const Fileira: React.FC<{ m: AlbumT; roteiro: RoteiroDoItem[]; t: number }> = ({ m, roteiro, t }) => (
  <>
    {roteiro.map((r, i) => {
      const casa = casaDaFileira(i, roteiro.length);
      const giro = INCLINACAO_CASA[i % INCLINACAO_CASA.length];
      const pGuarda = prog(t, r.guarda, 0.52, troca);
      const cheia = limitar((pGuarda - 0.6) / 0.3);
      // a casa da vez fica marcada (traço mais forte) enquanto o item é falado
      const daVez = t >= r.chega && t < r.guarda + 0.3 ? prog(t, r.chega, 0.3) * (1 - prog(t, r.guarda, 0.3)) : 0;
      const desenho = Math.min(casa.h - 30, casa.w - 96);
      return (
        <div key={`casa-${i}`} style={{ position: "absolute", left: casa.x, top: casa.y, width: casa.w, height: casa.h, rotate: `${giro * 0.35}deg` }}>
          {cheia < 1 ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - cheia }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 22,
                  border: `${mistura(3, 4.5, daVez)}px dashed ${daVez > 0.5 ? cor.tintaSuave : cor.lapis}`,
                  background: `rgba(231,218,196,${mistura(0.55, 0.75, daVez)})`,
                }}
              />
              <div style={{ position: "absolute", left: 18, top: 12, ...rotulo(40), color: daVez > 0.5 ? cor.tintaSuave : cor.lapis }}>{i + 1}</div>
              <div style={{ position: "absolute", left: (casa.w - desenho) / 2 + 14, top: (casa.h - desenho) / 2 + 6 }}>
                <Desenho nome={desenhoDoItem(r.item)} tamanho={desenho} texto={simboloDoItem(r.item, i)} lapis />
              </div>
            </div>
          ) : null}
          {cheia > 0 ? (
            <div style={{ position: "absolute", inset: 0, opacity: cheia, rotate: `${giro * 0.65}deg` }}>
              <Figurinha w={casa.w} h={casa.h} fundo={fundoDo(r)} raio={22} borda={10} levanta={0.05}>
                <div
                  style={{
                    position: "absolute",
                    left: (casa.w - 20 - desenho) / 2 + 10,
                    top: (casa.h - 20 - desenho) / 2 + 4,
                    filter: r.carimbo !== null && r.tipoCarimbo !== "pode" ? "grayscale(0.55) opacity(0.7)" : undefined,
                  }}
                >
                  <Desenho nome={desenhoDoItem(r.item)} tamanho={desenho} texto={simboloDoItem(r.item, i)} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 10,
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    background: cor.tinta,
                    color: cor.cartela,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    ...rotulo(34),
                    letterSpacing: 0,
                  }}
                >
                  {i + 1}
                </div>
              </Figurinha>
              {r.carimbo !== null ? (
                <Carimbo t={t} em={0} largura={Math.min(108, casa.w * 0.42)} mini pronto tipo={r.tipoCarimbo} inclinacao={-10} style={{ right: 2, bottom: 0 }} />
              ) : null}
            </div>
          ) : null}
        </div>
      );
    })}
  </>
);
