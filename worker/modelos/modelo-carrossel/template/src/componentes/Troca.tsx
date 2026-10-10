import { Easing } from "remotion";
import { mistura, Palavras, prog, temposDoTexto, TextoFalado, Traco } from "../anim";
import { encaixar, larguraLinha } from "../medida";
import { AVATAR } from "../paginas";
import type { Comparacao, Item, Palavra, Troca as TTroca } from "../plano";
import { BASE_CONTEUDO, BASE_SEM_LEGENDA, cor, fonte, MARGEM, rotulo, W } from "../tema";
import { Desenho, desenhoDe, encaixeDe, misturarCor } from "./Desenhos";

const LARGURA = W - 2 * MARGEM;
const PAD = 42;
// o conteúdo começa logo abaixo do cabeçalho (avatar + nome)
const TOPO_CONTEUDO = AVATAR.y + AVATAR.lado + 44;

// Os dados da página de dois cartões. A `troca` (assinatura) e a `comparacao` (universal) caem aqui.
export type DadosTroca = {
  de: number;
  ate: number;
  legenda?: boolean;
  // título do topo ("Troca 1"; um número no fim sai em coral). null = sem linha de título
  titulo: string | null;
  // rótulos em caixa alta dos dois cartões ("Sai", "Entra")
  rotulos: [string, string];
  sai: Item;
  entra: Item & { extra?: Item };
  // com `riscaEm`, o primeiro é riscado ("sai → entra"); sem, a seta só liga um ao outro ("de → para")
  riscaEm?: number;
  vantagens?: { em: number; texto: string }[];
  // o sinal no vão: seta (padrão) ou × (dois lados que se enfrentam)
  simbolo?: "seta" | "x";
  // quem ganha: selo coral com visto; o outro apaga
  vencedor?: 0 | 1;
  vencedorEm?: number;
};

export const dadosDaTroca = (m: TTroca, numero: number): DadosTroca => ({
  de: m.de,
  ate: m.ate,
  legenda: m.legenda,
  titulo: m.rotulo?.trim() ? m.rotulo.trim() : `Troca ${numero}`,
  rotulos: [m.rotulos?.[0]?.trim() || "Sai", m.rotulos?.[1]?.trim() || "Entra"],
  sai: m.sai,
  entra: m.entra,
  riscaEm: m.riscaEm,
  vantagens: m.vantagens,
});

export const dadosDaComparacao = (m: Comparacao): DadosTroca => {
  const [a, b] = m.lados;
  const modo = m.modo ?? "contra";
  return {
    de: m.de,
    ate: m.ate,
    legenda: m.legenda,
    titulo: m.titulo?.trim() ? m.titulo.trim() : null,
    rotulos: [a.rotulo, b.rotulo],
    sai: { texto: a.texto, em: a.em, desenho: desenhoDe(a) },
    entra: { texto: b.texto, em: b.em, desenho: desenhoDe(b) },
    // errado × certo: o errado é riscado quando o certo começa a ser dito
    riscaEm: modo === "errado-certo" ? b.em - 0.3 : undefined,
    simbolo: modo === "contra" ? "x" : "seta",
    vencedor: m.vencedor,
    vencedorEm: m.vencedor !== undefined ? (m.vencedorEm ?? m.lados[m.vencedor].em + 0.6) : undefined,
  };
};

type Medida = { tamanho: number; linhas: string[] };

// Nome de um item em até 2 linhas (3 se for longo), cada linha montada palavra por palavra na fala.
// Com `risco`, uma barra coral atravessa cada linha, da esquerda para a direita.
const Nome: React.FC<{
  medida: Medida;
  tempos: number[];
  t: number;
  corTexto: string;
  risco?: number;
}> = ({ medida, tempos, t, corTexto, risco = 0 }) => {
  const { linhas, tamanho } = medida;
  let cursor = 0;
  return (
    <div>
      {linhas.map((l, k) => {
        const ws = l.split(/\s+/);
        const fatia = tempos.slice(cursor, cursor + ws.length);
        cursor += ws.length;
        // o risco passa linha por linha
        const pr = Math.min(1, Math.max(0, risco * linhas.length - k));
        const espessura = Math.max(10, tamanho * 0.12);
        return (
          <div key={`${l}-${k}`} style={{ position: "relative", width: "fit-content" }}>
            <Palavras
              palavras={ws}
              tempos={fatia}
              t={t}
              style={{ fontFamily: fonte, fontWeight: 600, fontSize: tamanho, lineHeight: 1.06, letterSpacing: "-0.02em", color: corTexto, flexWrap: "nowrap", whiteSpace: "nowrap" }}
            />
            {pr > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: -6,
                  right: -6,
                  top: "50%",
                  height: espessura,
                  marginTop: -espessura / 2 + tamanho * 0.04,
                  borderRadius: 99,
                  background: cor.coral,
                  transformOrigin: "left center",
                  scale: `${pr} 1`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

// selo coral com visto (quem ganha a comparação)
const Selo: React.FC<{ t: number; em: number }> = ({ t, em }) => {
  const p = prog(t, em - 0.1, 0.4);
  const pv = prog(t, em + 0.05, 0.4, Easing.inOut(Easing.cubic));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 26,
        top: 26,
        width: 76,
        height: 76,
        borderRadius: 38,
        background: cor.coral,
        boxShadow: `0 0 0 8px ${cor.creme}`,
        scale: String(mistura(0.4, 1, p)),
        opacity: Math.min(1, p * 3),
      }}
    >
      <svg width={76} height={76} viewBox="0 0 48 48">
        <Traco d="M14 25 L21 32 L34 17" p={pv} cor={cor.creme} largura={5} />
      </svg>
    </div>
  );
};

// A página "sai → entra": cartão areia com o item que sai (riscado na palavra de ligação),
// seta coral, e o cartão petróleo com o item que entra, que chega deslizando da direita
// para a vaga tracejada que já esperava por ele. Sem risco, é "de → para"; com ×, "isto contra aquilo".
export const Troca: React.FC<{
  m: DadosTroca;
  palavras: Palavra[];
  t: number;
  // quando a página termina de chegar
  chegada: number;
}> = ({ m, palavras, t, chegada }) => {
  // sem legenda na página, o conteúdo desce até logo acima dos pontinhos
  const base = m.legenda ? BASE_CONTEUDO : BASE_SEM_LEGENDA;
  // vantagens: uma fileira de etiquetas; o corpo encolhe para caberem (até 2)
  const vantagens = (m.vantagens ?? []).slice(0, 2);
  const larguraEtiquetas = (corpo: number) => vantagens.reduce((s, v) => s + larguraLinha(v.texto, corpo, { peso: 600 }) + 16 + 56 + 36 + 20, -20);
  let corpoVantagem = 48;
  while (vantagens.length && corpoVantagem > 36 && larguraEtiquetas(corpoVantagem) > LARGURA) corpoVantagem -= 2;
  const duasFileiras = vantagens.length > 1 && larguraEtiquetas(corpoVantagem) > LARGURA;
  const alturaChips = vantagens.length ? 30 + 96 + (duasFileiras ? 96 + 16 : 0) : 0;
  const alturaTitulo = m.titulo ? 74 : 0;
  const vao = 124;
  const livre = base - TOPO_CONTEUDO - alturaTitulo - vao - alturaChips;
  const alturaSai = Math.min(500, Math.round(livre * 0.44));
  const alturaEntra = Math.min(640, livre - alturaSai);
  const total = alturaTitulo + alturaSai + vao + alturaEntra + alturaChips;
  const topo = Math.round(TOPO_CONTEUDO + (base - TOPO_CONTEUDO - total) / 2);
  const ySai = topo + alturaTitulo;
  const yEntra = ySai + alturaSai + vao;
  const desenhoSai = desenhoDe(m.sai);
  const desenhoEntra = desenhoDe(m.entra);
  // sem desenhos, o texto ocupa o cartão inteiro
  const temDesenho = !!(desenhoSai || desenhoEntra);
  const ilustra = temDesenho ? Math.min(380, alturaSai - 50) : 0;
  // cada cartão abre espaço para o desenho dele (o texto ocupa o cartão quando ele não tem desenho)
  const recuoSai = desenhoSai ? ilustra + 40 : 0;
  const recuoEntra = desenhoEntra ? ilustra + 40 : 0;
  const colunaSai = LARGURA - PAD - recuoSai - PAD;
  const coluna = LARGURA - PAD - recuoEntra - PAD;

  // nomes: o maior corpo que cabe em 2 linhas (3 se for longo) e na altura do cartão
  const caberNome = (texto: string, maximo: number, alturaCartao: number, extra: number, largura: number) => {
    let ultimo: Medida = { tamanho: maximo, linhas: [texto] };
    for (const k of [1, 0.9, 0.8, 0.72, 0.64]) {
      ultimo = encaixar(texto, { largura, max: Math.round(maximo * k), min: Math.round(48 * Math.min(1, k + 0.2)), linhas: 2, fonte: { peso: 600, espacamento: -0.02 }, preferirMenos: 1 });
      const alto = 34 + 20 + ultimo.linhas.length * ultimo.tamanho * 1.06 + (extra ? 20 + extra * ultimo.tamanho * 0.72 * 1.05 : 0);
      if (alto <= alturaCartao - 44) break;
    }
    return ultimo;
  };
  const extra = m.entra.extra;
  const medidaSai = caberNome(m.sai.texto, 84, alturaSai, 0, colunaSai);
  // o complemento: 0,72 do nome, em até 2 linhas, nunca abaixo de 44 px
  const linhasExtra = extra ? encaixar(extra.texto, { largura: coluna, max: 66, min: 44, linhas: 2, fonte: { peso: 600 }, preferirMenos: 0.7 }).linhas.length : 0;
  const medidaEntra = caberNome(m.entra.texto, 90, alturaEntra, linhasExtra, coluna);
  const medidaExtra = extra
    ? encaixar(extra.texto, { largura: coluna, max: Math.max(44, Math.round(medidaEntra.tamanho * 0.72)), min: 44, linhas: 2, fonte: { peso: 600 }, preferirMenos: 0.7 })
    : null;

  // tempos
  const temposSai = temposDoTexto(m.sai.texto, palavras, m.sai.em, m.riscaEm ?? m.entra.em, m.sai.em);
  const temposEntra = temposDoTexto(m.entra.texto, palavras, m.entra.em, m.ate, m.entra.em);
  const temposExtra = extra ? temposDoTexto(extra.texto, palavras, extra.em, m.ate, extra.em) : [];
  const temRisco = m.riscaEm !== undefined;
  // o sinal do vão aparece na palavra de ligação (com risco) ou logo antes do segundo item
  const sinalEm = temRisco ? (m.riscaEm as number) : m.entra.em - 0.45;
  const risco = temRisco ? prog(t, (m.riscaEm as number) - 0.04, 0.42, Easing.inOut(Easing.cubic)) : 0;
  // quem perde apaga: o riscado, ou o lado que não venceu
  const pVence = m.vencedor !== undefined && m.vencedorEm !== undefined ? prog(t, m.vencedorEm + 0.1, 0.4) : 0;
  const apaga = temRisco ? prog(t, (m.riscaEm as number) + 0.1, 0.4) : m.vencedor === 1 ? pVence : 0;
  const apagaEntra = m.vencedor === 0 ? pVence : 0;
  const pSeta = prog(t, sinalEm + 0.08, 0.5);
  const pSetaTraco = prog(t, sinalEm + 0.2, 0.45, Easing.inOut(Easing.cubic));
  const entraEm = m.entra.em - 0.16;
  const pEntra = prog(t, entraEm, 0.62);
  const pDesenhoEntra = prog(t, entraEm + 0.2, 0.95, Easing.inOut(Easing.cubic));
  const pExtra = extra ? prog(t, extra.em - 0.05, 0.8, Easing.inOut(Easing.cubic)) : 0;
  const pLinhaTitulo = prog(t, chegada - 0.3, 0.9, Easing.inOut(Easing.cubic));

  const coresEntra = { linha: cor.creme, corpo: "rgba(244,236,225,0.14)", acento: cor.coral };
  const desenhoExtra = desenhoDe(extra);
  const enc = desenhoEntra ? encaixeDe(desenhoEntra) : null;
  const tamExtra = enc ? ilustra * enc.escala : 0;
  // título da página: "Troca 1" (o número em coral) ou o título do plano; encolhe se for longo
  const titulo = m.titulo ?? "";
  const partes = titulo.match(/^(.*?)\s*(\d+)$/);
  const corpoTitulo = Math.max(44, Math.min(62, Math.floor((62 * (LARGURA - 120)) / Math.max(1, larguraLinha(titulo, 62, { peso: 800, espacamento: -0.02 })))));
  // rótulos dos cartões (caixa alta espaçada): encolhem para caber na coluna
  const corpoRotulo = (texto: string) => Math.max(28, Math.min(34, Math.floor((34 * Math.min(coluna, colunaSai)) / Math.max(1, larguraLinha(texto, 34, { peso: 700, espacamento: 0.14, caixaAlta: true })))));

  return (
    <>
      {/* título da página e uma régua que se estende até a margem */}
      {m.titulo ? (
        <div style={{ position: "absolute", left: MARGEM, top: topo, width: LARGURA, height: 60, display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: corpoTitulo, lineHeight: 1, letterSpacing: "-0.02em", color: cor.petroleo, whiteSpace: "nowrap" }}>
            {partes ? (
              <>
                {partes[1]}
                <span style={{ color: cor.coral, marginLeft: "0.26em" }}>{partes[2]}</span>
              </>
            ) : (
              titulo
            )}
          </div>
          <svg height={4} style={{ flex: 1, overflow: "visible" }}>
            <line x1={0} y1={2} x2={`${pLinhaTitulo * 100}%`} y2={2} stroke={cor.petroleo} strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" />
          </svg>
        </div>
      ) : null}

      {/* SAI: o desenho já vem pronto com a página (ela nunca chega vazia); o nome entra na fala */}
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: ySai,
          width: LARGURA,
          height: alturaSai,
          borderRadius: 44,
          background: cor.areia,
          translate: apaga > 0 ? `0 ${-10 * apaga}px` : undefined,
          scale: apaga > 0 ? String(mistura(1, 0.975, apaga)) : undefined,
        }}
      >
        <div style={{ position: "absolute", left: PAD, top: (alturaSai - ilustra) / 2 }}>
          {desenhoSai ? (
            <Desenho
              nome={desenhoSai}
              p={1}
              tamanho={ilustra}
              traco={7.5}
              cores={{ linha: cor.petroleo, corpo: cor.creme, acento: cor.areiaFunda }}
              apagado={apaga}
              corApagada="rgba(15,75,90,0.35)"
            />
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            left: PAD + recuoSai,
            top: 0,
            bottom: 0,
            width: colunaSai,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div style={{ ...rotulo, fontSize: corpoRotulo(m.rotulos[0]), color: cor.petroleoSuave, whiteSpace: "nowrap" }}>{m.rotulos[0]}</div>
          <Nome medida={medidaSai} tempos={temposSai} t={t} corTexto={misturarCor(cor.petroleo, "rgba(15,75,90,0.45)", apaga)} risco={risco} />
        </div>
        {m.vencedor === 0 && m.vencedorEm !== undefined ? <Selo t={t} em={m.vencedorEm} /> : null}
      </div>

      {/* ENTRA: primeiro a vaga tracejada, depois o cartão petróleo que chega deslizando */}
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: yEntra,
          width: LARGURA,
          height: alturaEntra,
          borderRadius: 44,
          border: `4px dashed rgba(15,75,90,${0.42 * (1 - pEntra)})`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          paddingLeft: PAD + recuoEntra,
        }}
      >
        <div style={{ ...rotulo, fontSize: corpoRotulo(m.rotulos[1]), color: cor.petroleoSuave, opacity: 1 - pEntra, whiteSpace: "nowrap" }}>{m.rotulos[1]}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: MARGEM,
          top: yEntra,
          width: LARGURA,
          height: alturaEntra,
          borderRadius: 44,
          background: cor.petroleoFundo,
          translate: pEntra >= 0.999 ? undefined : `${(1 - pEntra) * (W + 40)}px 0`,
          overflow: "hidden",
          opacity: 1 - 0.45 * apagaEntra,
        }}
      >
        <div style={{ position: "absolute", left: PAD, top: (alturaEntra - ilustra) / 2, width: ilustra, height: ilustra }}>
          {desenhoEntra ? <Desenho nome={desenhoEntra} p={pDesenhoEntra} tamanho={ilustra} traco={7.5} cores={coresEntra} t={t} gas /> : null}
          {desenhoExtra && enc ? (
            <div
              style={{
                position: "absolute",
                left: (ilustra * enc.x) / 200 - tamExtra / 2,
                top: (ilustra * enc.y) / 200 - tamExtra / 2,
                rotate: `${enc.giro}deg`,
                translate: `0 ${(1 - prog(t, (extra as Item).em - 0.05, 0.5)) * -40}px`,
                opacity: prog(t, (extra as Item).em - 0.05, 0.3),
              }}
            >
              <Desenho nome={desenhoExtra} p={pExtra} tamanho={tamExtra} traco={6.5} cores={coresEntra} />
            </div>
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            left: PAD + recuoEntra,
            top: 0,
            bottom: 0,
            width: coluna,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div style={{ ...rotulo, fontSize: corpoRotulo(m.rotulos[1]), color: cor.coral, whiteSpace: "nowrap" }}>{m.rotulos[1]}</div>
          <Nome medida={medidaEntra} tempos={temposEntra} t={t} corTexto={cor.creme} />
          {extra && medidaExtra ? (
            <TextoFalado
              linhas={medidaExtra.linhas}
              tempos={temposExtra}
              t={t}
              tamanho={medidaExtra.tamanho}
              peso={600}
              cor={cor.coral}
              entrelinha={1.05}
              espacamento="0em"
              style={{ marginTop: -2 }}
            />
          ) : null}
        </div>
        {m.vencedor === 1 && m.vencedorEm !== undefined ? <Selo t={t} em={m.vencedorEm} /> : null}
      </div>

      {/* sinal: um círculo coral que atravessa o vão entre os dois cartões (seta ou ×) */}
      <div
        style={{
          position: "absolute",
          left: W / 2 - 62,
          top: ySai + alturaSai + vao / 2 - 62,
          width: 124,
          height: 124,
          borderRadius: 62,
          background: cor.coral,
          boxShadow: `0 0 0 12px ${cor.creme}`,
          scale: String(mistura(0.3, 1, pSeta)),
          opacity: Math.min(1, pSeta * 3),
        }}
      >
        <svg width={124} height={124} viewBox="0 0 124 124">
          {m.simbolo === "x" ? (
            <>
              <Traco d="M40 40 L84 84" p={Math.min(1, pSetaTraco * 1.6)} cor={cor.creme} largura={10} />
              <Traco d="M84 40 L40 84" p={Math.max(0, pSetaTraco * 1.6 - 0.6)} cor={cor.creme} largura={10} />
            </>
          ) : (
            <>
              <Traco d="M62 32 L62 92" p={Math.min(1, pSetaTraco * 1.6)} cor={cor.creme} largura={10} />
              <Traco d="M38 70 L62 94 L86 70" p={Math.max(0, pSetaTraco * 1.6 - 0.6)} cor={cor.creme} largura={10} />
            </>
          )}
        </svg>
      </div>

      {/* vantagens: acendem quando são ditas */}
      {vantagens.length ? (
        <div style={{ position: "absolute", left: MARGEM, top: yEntra + alturaEntra + 30, width: LARGURA, display: "flex", gap: 16, columnGap: 20, flexWrap: "wrap" }}>
          {vantagens.map((v, i) => {
            const p = prog(t, v.em - 0.08, 0.45);
            const pCheck = prog(t, v.em + 0.05, 0.35, Easing.inOut(Easing.cubic));
            return (
              <div
                key={`${v.texto}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  height: 96,
                  padding: "0 36px 0 20px",
                  borderRadius: 48,
                  background: cor.areia,
                  opacity: p,
                  translate: `0 ${(1 - p) * 26}px`,
                }}
              >
                <svg width={56} height={56} viewBox="0 0 48 48">
                  <circle cx={24} cy={24} r={24} fill={cor.coral} />
                  <Traco d="M14 25 L21 32 L34 17" p={pCheck} cor={cor.creme} largura={5} />
                </svg>
                <div style={{ fontFamily: fonte, fontWeight: 600, fontSize: corpoVantagem, color: cor.petroleo, whiteSpace: "nowrap" }}>{v.texto}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
};
