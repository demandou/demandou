import { Easing } from "remotion";
import { marcar, Palavras, prog, saindo, temposDoTexto, TextoFalado, Traco } from "../anim";
import { encaixar, larguraLinha } from "../medida";
import type { Capa as TCapa, Cta as TCta, Frase as TFrase, Palavra, Plano } from "../plano";
import { BASE_CONTEUDO, BASE_SEM_LEGENDA, cor, fonte, MARGEM, rotulo, sombraCartao, W } from "../tema";
import { misturarCor } from "./Desenhos";

export const LARGURA = W - 2 * MARGEM;
export const PAD = 48;
export const INTERNA = LARGURA - 2 * PAD;
// altura reservada no cartão para o "arrasta →"
export const ALTURA_ARRASTA = 74;

// ---------- onde o cartão fica ----------

// O topo mais alto que um cartão pode ter. A zona começa ~170 px abaixo do queixo; quando o
// queixo está baixo (pessoa perto da câmera), a zona fica presa em 1100 px e o queixo pode estar a
// só ~40 px dela: aí o cartão não sobe acima da zona.
const topoMinimo = (zonaTopo: number) => (zonaTopo >= 1100 ? zonaTopo - 40 : zonaTopo - 80);
// a maior altura de cartão que cabe entre o queixo e a base (os componentes encolhem para caber)
export const espacoDoCartao = (zonaTopo: number, comLegenda?: boolean) =>
  (comLegenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA - 6) - topoMinimo(zonaTopo);

const yDoCartao = (altura: number, zonaTopo: number, comLegenda?: boolean) => {
  // centrado entre o queixo e a base útil; se não couber, encosta na base. Sem legenda, ele pode
  // descer até logo acima dos pontinhos para não subir no queixo.
  const livre = BASE_CONTEUDO - zonaTopo;
  if (altura <= livre) return zonaTopo + (livre - altura) / 2;
  const minimo = topoMinimo(zonaTopo);
  const fundo = comLegenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA - 30;
  const y = Math.min(Math.max(BASE_CONTEUDO - altura, minimo), fundo - altura);
  if (y >= minimo || comLegenda) return y;
  return Math.min(minimo, BASE_SEM_LEGENDA - 6 - altura);
};

// Cartão creme das páginas da pessoa: fica na altura do peito (abaixo do queixo) e nunca desce
// para a faixa da legenda. Entra subindo e assenta; sai descendo (quando a página continua).
// O próximo cartão só entra quando este já saiu (nunca dois cartões sobrepostos).
export const Cartao: React.FC<{
  t: number;
  de: number;
  // quando o cartão sai (Infinity = sai junto com a página)
  ate: number;
  altura: number;
  zonaTopo: number;
  // o cartão pode nascer menor e crescer quando o resto do texto chega (nunca fica meio vazio):
  // `cresce` = de uma altura inicial até a final num instante; `alturaViva` = altura já calculada
  cresce?: { de: number; em: number };
  alturaViva?: number;
  // true quando a legenda aparece junto (momento com `legenda: true`): o cartão não desce para a faixa dela
  comLegenda?: boolean;
  // fundo do cartão (padrão: creme)
  fundo?: string;
  children: React.ReactNode;
}> = ({ t, de, ate, altura, zonaTopo, cresce, alturaViva, comLegenda, fundo, children }) => {
  const p = prog(t, de, 0.55);
  const s = Number.isFinite(ate) ? saindo(t, ate, 0.3) : 0;
  const y = yDoCartao(altura, zonaTopo, comLegenda);
  const h = alturaViva ?? (cresce ? cresce.de + (altura - cresce.de) * prog(t, cresce.em, 0.5) : altura);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: y,
        width: LARGURA,
        height: h,
        borderRadius: 44,
        background: fundo ?? cor.creme,
        boxShadow: sombraCartao,
        opacity: Math.min(p * 1.6, 1 - s),
        translate: `0 ${(1 - p) * 70 + s * 40}px`,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

// "arrasta →" no pé do cartão, meio segundo antes da página deslizar; a seta puxa para a direita
export const Arrasta: React.FC<{ t: number; saida: number }> = ({ t, saida }) => {
  const pArrasta = prog(t, saida - 0.75, 0.4);
  const puxa = prog(t, saida - 0.2, 0.35, Easing.inOut(Easing.cubic));
  return (
    <div
      style={{
        position: "absolute",
        right: PAD,
        bottom: PAD * 0.8,
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: pArrasta,
        translate: `${(1 - pArrasta) * -16 + puxa * 18}px 0`,
      }}
    >
      <div style={{ ...rotulo, fontSize: 34, color: cor.coral }}>arrasta</div>
      <svg width={72} height={34} viewBox="0 0 64 30">
        <Traco d="M4 15 L58 15" p={prog(t, saida - 0.65, 0.4)} cor={cor.coral} largura={5} />
        <Traco d="M46 4 L58 15 L46 26" p={prog(t, saida - 0.4, 0.25)} cor={cor.coral} largura={5} />
      </svg>
    </div>
  );
};

// divide os tempos (um por palavra do texto) pelas linhas
export const fatiar = (linhas: string[], tempos: number[]) => {
  let cursor = 0;
  return linhas.map((l) => {
    const n = l.split(/\s+/).filter(Boolean).length;
    const fatia = tempos.slice(cursor, cursor + n);
    cursor += n;
    return fatia;
  });
};

// ---------- capa (e abertura) ----------

// Os dados de uma capa: o tipo próprio `capa` e o universal `abertura` caem aqui.
export type DadosCapa = {
  de: number;
  ate: number;
  titulo: string;
  subtitulo?: string;
  destaque?: string;
  em?: number;
  arrasta?: boolean;
  legenda?: boolean;
};

// corpo do subtítulo da capa
const SUB_CAPA = 54;

const medidasCapa = (m: DadosCapa, k = 1) => {
  const ws = m.titulo.split(/\s+/).filter(Boolean);
  const numeral = /^\d{1,2}$/.test(ws[0] ?? "") && ws.length > 1 ? ws[0] : null;
  const resto = numeral ? ws.slice(1).join(" ") : ws.join(" ");
  const largNumeral = numeral ? numeral.length * 170 + 30 : 0;
  const colunaTitulo = INTERNA - largNumeral;
  // até 2 linhas (3 só em título longo sem numeral): com mais, o cartão subiria no queixo
  const titulo = encaixar(resto, {
    largura: colunaTitulo,
    max: Math.round(120 * k),
    min: Math.round(72 * k),
    linhas: numeral ? 2 : 3,
    fonte: { peso: 700, espacamento: -0.025 },
    preferirMenos: 0.85,
  });
  const sub = m.subtitulo
    ? encaixar(m.subtitulo, { largura: INTERNA, max: Math.round(SUB_CAPA * Math.max(k, 0.85)), min: 44, linhas: 2, fonte: { peso: 500 }, preferirMenos: 1 })
    : null;
  const alturaTitulo = Math.max(numeral ? titulo.tamanho * 1.9 : 0, titulo.linhas.length * titulo.tamanho);
  return { numeral, linhas: titulo.linhas, tamanho: titulo.tamanho, largNumeral, sub, alturaTitulo };
};

const alturaCapaCom = (m: DadosCapa, arrasta: boolean, k = 1) => {
  const { sub, alturaTitulo } = medidasCapa(m, k);
  const alturaSub = sub ? sub.linhas.length * sub.tamanho * 1.14 + 22 : 0;
  return Math.round(PAD * 0.9 + alturaTitulo + alturaSub + (arrasta ? ALTURA_ARRASTA : 0) + PAD * 0.8);
};

// o maior tamanho em que a capa cabe no espaço do cartão
const escalaCapa = (m: DadosCapa, arrasta: boolean, espaco: number) => {
  for (const k of [1, 0.92, 0.85, 0.78, 0.72, 0.66]) if (alturaCapaCom(m, arrasta, k) <= espaco) return k;
  return 0.66;
};

// `ate`: quando o cartão sai (Infinity = sai junto com a página); `saida`: quando a página desliza
// (o "arrasta →" só aparece quando a capa é o último cartão de uma página que desliza)
export const Capa: React.FC<{ m: DadosCapa; palavras: Palavra[]; t: number; zonaTopo: number; saida: number; ate?: number }> = ({
  m,
  palavras,
  t,
  zonaTopo,
  saida,
  ate = Infinity,
}) => {
  const arrasta = m.arrasta !== false && Number.isFinite(saida) && !Number.isFinite(ate);
  const k = escalaCapa(m, arrasta, espacoDoCartao(zonaTopo, m.legenda));
  const { numeral, linhas, tamanho, sub, alturaTitulo } = medidasCapa(m, k);
  const inicio = Math.max(0, m.em ?? m.de);
  // no começo do vídeo o cartão já está montado no primeiro quadro (a capa do post não fica vazia):
  // palavras ditas no primeiro meio segundo já aparecem prontas
  const noInicio = m.de < 0.3;
  const abre = noInicio ? -1 : m.de;
  const ajustar = (x: number) => (noInicio && x < 0.75 ? x - 1 : x);
  const temposTitulo = temposDoTexto(m.titulo, palavras, inicio, m.ate, inicio + 0.1).map(ajustar);
  const temposSub = m.subtitulo ? temposDoTexto(m.subtitulo, palavras, inicio, m.ate + 0.2, inicio + 0.6) : [];
  const altura = alturaCapaCom(m, arrasta, k);
  // nasce só com o título e cresce quando o subtítulo começa a ser dito
  const alturaSoTitulo = Math.round(PAD * 0.9 + alturaTitulo + PAD * 0.9);
  const cresce = sub ? { de: alturaSoTitulo, em: (temposSub[0] ?? inicio) - 0.2 } : undefined;
  const pNumeral = prog(t, temposTitulo[0] ?? abre, 0.5);
  const todas = m.titulo.split(/\s+/).filter(Boolean);
  const destacadas = marcar(todas, m.destaque);
  const desloc = numeral ? 1 : 0;
  const temposLinhas = temposTitulo.slice(desloc);

  return (
    <Cartao t={t} de={abre} ate={ate} altura={altura} zonaTopo={zonaTopo} cresce={cresce} comLegenda={m.legenda}>
      <div style={{ position: "absolute", left: PAD, top: PAD * 0.9, width: INTERNA, display: "flex", alignItems: "flex-start", gap: 30 }}>
        {numeral ? (
          <div
            style={{
              fontFamily: fonte,
              fontWeight: 800,
              fontSize: tamanho * 2.2,
              lineHeight: 0.8,
              letterSpacing: "-0.04em",
              color: cor.coral,
              translate: pNumeral >= 0.999 ? undefined : `0 ${(1 - pNumeral) * 40}px`,
              opacity: pNumeral,
              paddingTop: tamanho * 0.08,
            }}
          >
            {numeral}
          </div>
        ) : null}
        <TextoFalado
          linhas={linhas}
          tempos={temposLinhas}
          t={t}
          tamanho={tamanho}
          peso={700}
          cor={cor.petroleo}
          entrelinha={1.0}
          espacamento="-0.025em"
          corDe={(i) => (destacadas.has(i + desloc) ? cor.coral : undefined)}
        />
      </div>
      {sub ? (
        <div style={{ position: "absolute", left: PAD, top: PAD * 0.9 + alturaTitulo + 22 }}>
          <TextoFalado linhas={sub.linhas} tempos={temposSub} t={t} tamanho={sub.tamanho} peso={500} cor={cor.petroleoSuave} entrelinha={1.14} espacamento="0em" />
        </div>
      ) : null}
      {arrasta ? <Arrasta t={t} saida={saida} /> : null}
    </Cartao>
  );
};

// ---------- frase ----------

const medidasFrase = (m: TFrase, k = 1) =>
  encaixar(m.texto, { largura: INTERNA, max: Math.round(80 * k), min: Math.round(60 * k), linhas: 3, fonte: { peso: 700, espacamento: -0.02 }, preferirMenos: 0.9 });

const alturaFraseCom = (m: TFrase, k = 1) => {
  const { linhas, tamanho } = medidasFrase(m, k);
  return Math.round(2 * PAD + linhas.length * tamanho * 1.18);
};

export const Frase: React.FC<{ m: TFrase; palavras: Palavra[]; t: number; zonaTopo: number; ate: number }> = ({ m, palavras, t, zonaTopo, ate }) => {
  const espaco = espacoDoCartao(zonaTopo, m.legenda);
  const k = [1, 0.9, 0.8, 0.72].find((x) => alturaFraseCom(m, x) <= espaco) ?? 0.72;
  const { linhas, tamanho } = medidasFrase(m, k);
  const todas = m.texto.split(/\s+/).filter(Boolean);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), m.ate, inicio + 0.1);
  // nomes universais (`risco`, `destaque`) e os antigos (`risca`, `enfase`)
  const riscadas = marcar(todas, m.risco ?? m.risca);
  const enfase = marcar(todas, m.destaque ?? m.enfase);
  // o risco acompanha a fala: cada palavra riscada é atravessada logo depois de assentar (a primeira
  // não antes de `riscoEm`), nunca antes de aparecer
  const idx = [...riscadas].sort((a, b) => a - b);
  const inicioRisco = new Map<number, number>();
  idx.forEach((i, ordem) => {
    const anterior = ordem ? (inicioRisco.get(idx[ordem - 1]) as number) + 0.12 : (m.riscoEm ?? 0);
    inicioRisco.set(i, Math.max((tempos[i] ?? m.de) + 0.24, anterior));
  });
  const entrada = Math.max(m.de, (tempos[0] ?? m.de) - 0.3);
  const altura = alturaFraseCom(m, k);
  // o cartão cresce linha a linha, quando cada linha começa a ser dita
  const alturaLinha = tamanho * 1.18;
  let inicioLinha = 0;
  const alturaViva =
    2 * PAD +
    linhas.reduce((soma, l, j) => {
      const t0 = tempos[inicioLinha] ?? m.de;
      inicioLinha += l.split(/\s+/).length;
      return soma + alturaLinha * (j === 0 ? 1 : prog(t, t0 - 0.15, 0.35));
    }, 0);
  let cursor = 0;
  return (
    <Cartao t={t} de={entrada} ate={ate} altura={altura} zonaTopo={zonaTopo} alturaViva={alturaViva} comLegenda={m.legenda}>
      <div style={{ position: "absolute", left: PAD, top: PAD, width: INTERNA }}>
        {linhas.map((l, j) => {
          const ws = l.split(/\s+/);
          const base = cursor;
          cursor += ws.length;
          return (
            <div
              key={`${l}-${j}`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "flex-start",
                fontFamily: fonte,
                fontWeight: 700,
                fontSize: tamanho,
                lineHeight: 1.18,
                height: tamanho * 1.18,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {ws.map((w, q) => {
                const i = base + q;
                const p = prog(t, tempos[i] ?? 0, 0.42);
                const pronta = p >= 0.999;
                const riscada = riscadas.has(i);
                // fração do risco que já passou por esta palavra
                const pr = riscada ? prog(t, inicioRisco.get(i) as number, 0.26, Easing.inOut(Easing.quad)) : 0;
                return (
                  <span
                    key={`${w}-${q}`}
                    style={{
                      position: "relative",
                      display: "inline-block",
                      overflow: "visible",
                      marginRight: q < ws.length - 1 ? "0.24em" : 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        overflow: pronta ? "visible" : "hidden",
                        paddingBottom: "0.12em",
                        marginBottom: "-0.12em",
                        verticalAlign: "top",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          translate: pronta ? undefined : `0 ${(1 - p) * 108}%`,
                          color: enfase.has(i) ? cor.coral : misturarCor(cor.petroleo, cor.apagado, pr),
                        }}
                      >
                        {w}
                      </span>
                    </span>
                    {pr > 0 ? (
                      <span
                        style={{
                          position: "absolute",
                          // o risco cobre também o espaço até a próxima palavra riscada
                          left: -4,
                          right: q < ws.length - 1 && riscadas.has(i + 1) ? "-0.3em" : -4,
                          top: tamanho * 0.6,
                          height: 10,
                          borderRadius: 99,
                          background: cor.coral,
                          transformOrigin: "left center",
                          scale: `${pr} 1`,
                        }}
                      />
                    ) : null}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </Cartao>
  );
};

// ---------- fechamento ----------

// o botão do app: o que ele diz antes e depois do toque
const BOTAO = {
  seguir: { antes: "Seguir", depois: "Seguindo" },
  salvar: { antes: "Salvar", depois: "Salvo" },
  compartilhar: { antes: "Enviar", depois: "Enviado" },
  comentar: { antes: "Comentar", depois: "Enviado" },
  link: { antes: "Saiba mais", depois: "Abrindo" },
};

const medidasCta = (m: TCta, marca: Plano["marca"], k = 1) => {
  const texto = encaixar(m.texto, { largura: INTERNA, max: Math.round(100 * k), min: Math.round(68 * k), linhas: 2, fonte: { peso: 800, espacamento: -0.03 }, preferirMenos: 0.8 });
  const detalhe = m.detalhe ? encaixar(m.detalhe, { largura: INTERNA, max: Math.round(54 * Math.max(k, 0.85)), min: 44, linhas: 2, fonte: { peso: 500 }, preferirMenos: 1 }) : null;
  const alturaTexto = texto.linhas.length * texto.tamanho;
  const alturaDet = detalhe ? detalhe.linhas.length * detalhe.tamanho * 1.12 + 10 : 0;
  const rodape = marca.nome ? 36 + 2 + 34 + 100 : 110;
  const altura = Math.round(PAD * 0.9 + alturaTexto + alturaDet + rodape + PAD * 0.7);
  return { texto, detalhe, alturaDet, altura };
};

export const alturaCta = (m: TCta, marca: Plano["marca"]) => medidasCta(m, marca).altura;

export const Cta: React.FC<{ m: TCta; marca: Plano["marca"]; palavras: Palavra[]; t: number; zonaTopo: number; ate: number }> = ({
  m,
  marca,
  palavras,
  t,
  zonaTopo,
  ate,
}) => {
  const espaco = espacoDoCartao(zonaTopo, m.legenda);
  const k = [1, 0.9, 0.8, 0.72].find((x) => medidasCta(m, marca, x).altura <= espaco) ?? 0.72;
  const { texto, detalhe, alturaDet, altura } = medidasCta(m, marca, k);
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), m.ate, inicio + 0.1);
  const temposDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, inicio + 0.4) : [];
  const toque = m.toqueEm ?? m.de + (m.ate - m.de) * 0.6;
  const entrada = Math.max(m.de, (tempos[0] ?? inicio) - 0.3);
  const acao = BOTAO[m.icone ?? m.acao ?? "seguir"] ?? BOTAO.seguir;
  const ehLink = (m.icone ?? m.acao) === "link";
  const pBotao = prog(t, entrada + 0.2, 0.5);
  // toque: o botão afunda de leve e vira o estado "feito"
  const aperta = prog(t, toque - 0.06, 0.1) * (1 - prog(t, toque + 0.06, 0.2));
  const feito = prog(t, toque + 0.02, 0.3);
  const pCheck = prog(t, toque + 0.1, 0.35, Easing.inOut(Easing.cubic));
  const pLinha = prog(t, entrada + 0.3, 0.7, Easing.inOut(Easing.cubic));
  const todas = m.texto.split(/\s+/).filter(Boolean);
  const destacadas = marcar(todas, m.destaque);
  const ultimaDestacada = [...destacadas].sort((a, b) => b - a)[0];
  // nasce com a chamada e a assinatura; cresce quando o complemento começa a ser dito
  const cresce = detalhe ? { de: altura - alturaDet, em: (temposDet[0] ?? m.de) - 0.2 } : undefined;
  // o botão tem a largura do maior dos dois rótulos
  const larguraBotao = Math.max(330, Math.ceil(Math.max(larguraLinha(acao.antes, 42, { peso: 700 }), larguraLinha(acao.depois, 42, { peso: 700 }) + 46) + 90));
  const botao = (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        width: larguraBotao,
        height: 100,
        borderRadius: 50,
        background: cor.coral,
        boxShadow: `inset 0 0 0 4px ${cor.petroleo}`,
        overflow: "hidden",
        scale: String(1 - 0.05 * aperta),
        opacity: pBotao,
        translate: `0 ${(1 - pBotao) * 20}px`,
      }}
    >
      {/* estado "feito": fundo creme com contorno petróleo */}
      <div style={{ position: "absolute", inset: 0, background: cor.creme, borderRadius: 50, boxShadow: `inset 0 0 0 4px ${cor.petroleo}`, opacity: feito }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: 42,
          color: cor.creme,
          opacity: 1 - feito,
          translate: `0 ${-feito * 30}px`,
          whiteSpace: "nowrap",
        }}
      >
        {acao.antes}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: 42,
          color: cor.petroleo,
          opacity: feito,
          translate: `0 ${(1 - feito) * 30}px`,
          whiteSpace: "nowrap",
        }}
      >
        <svg width={34} height={34} viewBox="0 0 34 34">
          {ehLink ? (
            <>
              <Traco d="M10 24 L25 9" p={pCheck} cor={cor.coral} largura={5} />
              <Traco d="M13 9 L25 9 L25 21" p={Math.max(0, pCheck * 1.4 - 0.4)} cor={cor.coral} largura={5} />
            </>
          ) : (
            <Traco d="M6 18 L14 26 L28 9" p={pCheck} cor={cor.coral} largura={5.5} />
          )}
        </svg>
        {acao.depois}
      </div>
    </div>
  );
  const larguraNome = INTERNA - larguraBotao - 30;
  const corpoNome = Math.max(34, Math.min(44, Math.floor((44 * larguraNome) / Math.max(1, larguraLinha(marca.nome, 44, { peso: 700 })))));
  const corpoArea = Math.max(30, Math.min(36, Math.floor((36 * larguraNome) / Math.max(1, larguraLinha(marca.area ?? "", 36, { peso: 500 })))));
  return (
    <Cartao t={t} de={entrada} ate={ate} altura={altura} zonaTopo={zonaTopo} cresce={cresce} comLegenda={m.legenda}>
      <div style={{ position: "absolute", left: PAD, top: PAD * 0.9, width: INTERNA }}>
        <TextoFalado
          linhas={texto.linhas}
          tempos={tempos}
          t={t}
          tamanho={texto.tamanho}
          peso={800}
          cor={cor.petroleo}
          entrelinha={1.0}
          espacamento="-0.03em"
          corDe={(i) => (destacadas.has(i) ? cor.coral : undefined)}
          sublinhado={destacadas.size ? destacadas : undefined}
          sublinhadoEm={ultimaDestacada !== undefined ? (tempos[ultimaDestacada] ?? inicio) + 0.3 : undefined}
        />
        {detalhe ? (
          <TextoFalado
            linhas={detalhe.linhas}
            tempos={temposDet}
            t={t}
            tamanho={detalhe.tamanho}
            peso={500}
            cor={cor.petroleoSuave}
            entrelinha={1.12}
            espacamento="0em"
            style={{ marginTop: 10 }}
          />
        ) : null}
      </div>
      {marca.nome ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: PAD * 0.7 }}>
          <svg width={INTERNA} height={2} style={{ display: "block", marginBottom: 34 }}>
            <line x1={0} y1={1} x2={INTERNA * pLinha} y2={1} stroke={cor.petroleo} strokeOpacity={0.2} strokeWidth={2} />
          </svg>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ opacity: prog(t, entrada + 0.1, 0.45), whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: fonte, fontWeight: 700, fontSize: corpoNome, lineHeight: 1.1, color: cor.petroleo }}>{marca.nome}</div>
              {marca.area ? <div style={{ fontFamily: fonte, fontWeight: 500, fontSize: corpoArea, lineHeight: 1.15, color: cor.petroleoSuave }}>{marca.area}</div> : null}
            </div>
            {botao}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", right: PAD, bottom: PAD * 0.7 }}>{botao}</div>
      )}
    </Cartao>
  );
};

// Palavras é reexportado para os componentes que montam texto sem medida própria
export { Palavras };
