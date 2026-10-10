// As artes de quadro cheio e da figurinha especial: etiquetas de papel coladas na altura do peito.
// - Abertura: o título se escreve palavra por palavra; o número vira um selo redondo; o cachorro
//   espia por cima da etiqueta.
// - Numero: o número conta, grande, numa etiqueta; o rótulo se escreve em cima.
// - Destaque: "alerta" = carimbo framboesa batido numa etiqueta; "chave" = figurinha brilhante.
// - Frase: uma frase na etiqueta (com risco à mão, se pedido) e uma figurinha pequena no canto.
// - Pergunta: selo "?" e a pergunta; as opções colam embaixo como figurinhas.
// - Especial: o conselho principal sobre o peito da figurinha especial grande.
// - Cta: figurinhas de chamada (salvar, seguir…) e a assinatura.
// Todo texto é medido (medida.ts) e encolhe até um mínimo legível para caber: nunca vaza.
import { indicesDoTrecho, limitar, mistura, Palavras, prog, temposDoTexto } from "../anim";
import { alturaDe, CORPO, encaixar, formatar, larguraPalavra, ROTULO, TITULO } from "../medida";
import type {
  Abertura as AberturaT,
  Cta as CtaT,
  Destaque as DestaqueT,
  Especial as EspecialT,
  Frase as FraseT,
  IconeDeChamada,
  Numero as NumeroT,
  Palavra,
  Pergunta as PerguntaT,
  Plano,
} from "../plano";
import { cor, corpo, fundos, LIMITE_APP, rotulo, titulo, W } from "../tema";
import { Carimbo, larguraDoCarimbo } from "./Carimbo";
import { Cao, type ReacaoNoTempo } from "./Cao";
import { Desenho, fundoDoDesenho } from "./Desenhos";
import { colando, descolando, Etiqueta, Figurinha, Selo, sombraDePapel } from "./Figurinha";
import { Icone } from "./Icones";

// largura útil do texto numa etiqueta de largura `w` com padding horizontal `px`
const util = (w: number, px: number) => w - 24 - px;

// o cachorro (só cabeça e peito) espiando por cima de uma etiqueta: sobe de trás dela quando aparece
export const CaoEspiando: React.FC<{ t: number; em: number; reacoes: ReacaoNoTempo[]; direita: number; largura?: number; olhar?: number }> = ({
  t,
  em,
  reacoes,
  direita,
  largura = 230,
  olhar = -0.5,
}) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em, 0.45);
  const altura = largura * (330 / 260);
  return (
    <div style={{ position: "absolute", right: direita, top: -altura * 0.66, width: largura, height: altura, overflow: "visible" }}>
      <div style={{ translate: `0 ${mistura(altura * 0.55, 0, p)}px`, opacity: Math.min(1, p * 2) }}>
        <Cao t={t} reacoes={reacoes} largura={largura} busto olhar={olhar} />
      </div>
    </div>
  );
};

const separarNumero = (titulo0: string) => {
  const ws = titulo0.split(/\s+/).filter(Boolean);
  if (ws.length > 2 && /^\d{1,2}$/.test(ws[0])) return { numero: ws[0], resto: ws.slice(1).join(" ") };
  return { numero: null, resto: ws.join(" ") };
};

// quando o texto falado começa (campo `em` dos blocos de texto) e a janela de busca das palavras
const inicioDoTexto = (m: { de: number; em?: number }, entra: number) => Math.max(entra + 0.1, (m.em ?? m.de) - 0.06);

type Comum = { palavras: Palavra[]; t: number; topo: number; fim: number; entra: number; mascote: boolean };

export const Abertura: React.FC<{ m: AberturaT } & Comum> = ({ m, palavras, t, topo, fim, entra, mascote }) => {
  const texto = m.texto ?? m.titulo ?? "";
  const inicio = inicioDoTexto(m, entra);
  const tempos = temposDoTexto(texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const { numero, resto } = separarNumero(texto);
  const temposResto = numero ? tempos.slice(1) : tempos;
  const destaque = indicesDoTrecho(resto, m.destaque);
  const caoEm = m.caoEm ?? tempos[tempos.length - 1] ?? m.de + 1;
  const padding = numero ? "64px 36px 40px 40px" : "36px 36px 40px 40px";
  const enc = encaixar(resto, { largura: util(W - 96, 76), max: resto.length > 52 ? 72 : 78, min: 58, linhas: 3, ...TITULO });
  return (
    <Etiqueta
      x={48}
      y={topo + (numero ? 66 : 30)}
      w={W - 96}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={-1.6}
      padding={padding}
      atras={mascote ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "curioso" }]} direita={40} /> : null}
      frente={numero ? <Selo texto={numero} diametro={150} t={t} em={tempos[0] ?? m.de} style={{ left: 14, top: -88 }} /> : null}
    >
      <Palavras
        texto={resto}
        tempos={temposResto}
        t={t}
        quebras={enc.quebras}
        style={{ ...titulo(enc.tamanho) }}
        corDe={(i) => (destaque.has(i) ? cor.carimbo : cor.tinta)}
      />
    </Etiqueta>
  );
};

export const Frase: React.FC<{ m: FraseT } & Comum> = ({ m, palavras, t, topo, fim, entra }) => {
  const inicio = inicioDoTexto(m, entra);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const riscados = indicesDoTrecho(m.texto, m.risco);
  // o risco bate quando a última palavra riscada é dita (ou no `riscoEm`)
  const ultimoRiscado = [...riscados].pop();
  const riscoEm = m.riscoEm ?? (ultimoRiscado !== undefined ? (tempos[ultimoRiscado] ?? m.de) + 0.3 : 0);
  const em = entra + 0.35;
  const enc = encaixar(m.texto, { largura: util(W - 128, m.desenho ? 276 : 92), max: 78, min: 58, linhas: 3, ...TITULO });
  return (
    <Etiqueta
      x={64}
      y={topo + 40}
      w={W - 128}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={1.2}
      padding={m.desenho ? "40px 230px 44px 46px" : "40px 46px 44px"}
      frente={
        m.desenho && t >= em - 0.02 ? (
          <div style={{ position: "absolute", right: 26, top: -44, width: 200, height: 200, rotate: `${6 + colando(t, em).giro}deg`, ...colando(t, em).style }}>
            <Figurinha w={200} h={200} fundo={fundos[fundoDoDesenho[m.desenho]]} raio={22} borda={10} levanta={0.1}>
              <div style={{ position: "absolute", left: 6, top: 6 }}>
                <Desenho nome={m.desenho} tamanho={168} />
              </div>
            </Figurinha>
          </div>
        ) : null
      }
    >
      <Palavras
        texto={m.texto}
        tempos={tempos}
        t={t}
        quebras={enc.quebras}
        style={{ ...titulo(enc.tamanho) }}
        corDe={(i) => (riscados.has(i) ? cor.tintaSuave : destaque.has(i) ? cor.carimbo : cor.tinta)}
        risco={riscados.size ? { indices: riscados, em: riscoEm } : undefined}
      />
    </Etiqueta>
  );
};

// ---------- número ----------

export const Numero: React.FC<{ m: NumeroT } & Comum> = ({ m, palavras, t, topo, fim, entra, mascote }) => {
  const largura = W - 96;
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const final = formatar(m.valor, casas);
  const pConta = prog(t, m.em, 1.15);
  const agora = formatar(m.valor * pConta, casas);
  // o número grande cabe na largura (prefixo e sufixo menores)
  const larguraDo = (s: number) =>
    larguraPalavra(final, s, TITULO) +
    (m.prefixo ? larguraPalavra(m.prefixo, s * 0.42, TITULO) + s * 0.12 : 0) +
    (m.sufixo ? larguraPalavra(m.sufixo, s * 0.42, TITULO) + s * 0.12 : 0);
  let tamanho = 190;
  while (tamanho > 96 && larguraDo(tamanho) > util(largura, 84)) tamanho -= 4;
  const rotuloEm = m.rotuloEm ?? Math.min(m.em, m.de + 0.2);
  const temposRotulo = temposDoTexto(m.rotulo, palavras, m.de - 0.2, m.ate, Math.max(entra + 0.1, rotuloEm - 0.06));
  const encRotulo = encaixar(m.rotulo, { largura: util(largura, 84) - (m.ilustrativo ? 250 : 0), max: 52, min: 40, linhas: 2, ...CORPO });
  const caoEm = m.em + 0.5;
  return (
    <Etiqueta
      x={48}
      y={topo + 30}
      w={largura}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={-1.4}
      padding="30px 40px 26px 44px"
      atras={mascote ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "querendo" }, { em: caoEm + 1.4, r: "atento" }]} direita={40} /> : null}
      frente={
        m.ilustrativo ? (
          <div style={{ position: "absolute", right: 34, top: 34, ...rotulo(30), color: cor.tintaSuave, border: `3px solid ${cor.lapis}`, borderRadius: 12, padding: "8px 14px 7px" }}>
            ilustrativo
          </div>
        ) : null
      }
    >
      <Palavras
        texto={m.rotulo}
        tempos={temposRotulo}
        t={t}
        quebras={encRotulo.quebras}
        style={{ ...corpo(encRotulo.tamanho, 780) }}
        corDe={() => cor.tintaSuave}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: tamanho * 0.12, marginTop: 4, color: cor.tinta, whiteSpace: "nowrap" }}>
        {m.prefixo ? <span style={{ ...titulo(tamanho * 0.42), color: cor.carimbo }}>{m.prefixo}</span> : null}
        <span style={{ position: "relative", ...titulo(tamanho), lineHeight: 1 }}>
          {/* a largura fica a do número final: nada pula enquanto conta */}
          <span style={{ visibility: "hidden" }}>{final}</span>
          <span style={{ position: "absolute", left: 0, top: 0, color: t < m.em ? cor.lapisClaro : cor.tinta }}>{pConta >= 1 ? final : agora}</span>
        </span>
        {m.sufixo ? <span style={{ ...titulo(tamanho * 0.42), color: cor.carimbo }}>{m.sufixo}</span> : null}
      </div>
    </Etiqueta>
  );
};

// ---------- destaque ----------

export const Destaque: React.FC<{ m: DestaqueT } & Comum> = ({ m, palavras, t, topo, fim, entra, mascote }) => {
  const alerta = m.nivel === "alerta";
  const largura = W - 96;
  const temDetalhe = !!m.detalhe;
  const detalheEm = m.detalheEm ?? m.em + 0.9;
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, detalheEm - 0.3, m.ate, detalheEm - 0.06) : [];
  const encDetalhe = m.detalhe ? encaixar(m.detalhe, { largura: util(largura, 84), max: 48, min: 40, linhas: 2, ...CORPO }) : null;
  const caoEm = m.em + 0.15;
  if (alerta) {
    // o carimbo bate numa etiqueta: a etiqueta cola na entrada e o carimbo no `em`
    const altura = 200;
    const larguraCarimbo = larguraDoCarimbo(m.texto, altura, util(largura, 84));
    return (
      <Etiqueta
        x={48}
        y={topo + 30}
        w={largura}
        t={t}
        entra={entra}
        sai={fim}
        inclinacao={-1.2}
        padding="34px 42px 34px"
        atras={mascote ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "susto" }]} direita={36} /> : null}
      >
        <div style={{ position: "relative", height: altura + 24 }}>
          {t < m.em - 0.02 ? (
            <Carimbo
              t={t}
              em={m.em}
              lapis
              altura={altura}
              larguraMax={util(largura, 84)}
              tipo="alerta"
              texto={m.texto}
              inclinacao={-4}
              style={{ left: Math.max(0, (util(largura, 84) - larguraCarimbo) / 2), top: 12 }}
            />
          ) : null}
          <Carimbo
            t={t}
            em={m.em}
            altura={altura}
            larguraMax={util(largura, 84)}
            tipo="alerta"
            texto={m.texto}
            inclinacao={-4}
            style={{ left: Math.max(0, (util(largura, 84) - larguraCarimbo) / 2), top: 12 }}
          />
        </div>
        {m.detalhe && encDetalhe ? (
          <Palavras
            texto={m.detalhe}
            tempos={temposDetalhe}
            t={t}
            quebras={encDetalhe.quebras}
            alinhar="center"
            style={{ ...corpo(encDetalhe.tamanho, 780), marginTop: 10 }}
            corDe={() => cor.tinta}
          />
        ) : null}
      </Etiqueta>
    );
  }
  // chave: a figurinha brilhante (índigo, como a moldura especial), colada no `em`
  const enc = encaixar(m.texto, { largura: largura - 140, max: 104, min: 64, linhas: 2, ...TITULO });
  const hTexto = alturaDe(enc, 1.04);
  const em = Math.max(entra, m.em - 0.08);
  if (t < em - 0.02 || t > fim + 0.05) return null;
  const e = colando(t, em, 0.42);
  const d = descolando(t, fim);
  // o brilho atravessa a figurinha quando ela cola e de novo a cada 2,6 s
  const ciclo = ((t - em) % 2.6) / 0.9;
  const brilho = -0.3 + ciclo * 1.6;
  const destaque = temDetalhe;
  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        top: topo + 40,
        width: largura,
        rotate: `${-1.8 + e.giro + d.giro}deg`,
        ...e.style,
        opacity: (e.style.opacity as number) * d.fora,
        translate: `${d.dx}px ${mistura(26, 0, e.p) + d.dy}px`,
      }}
    >
      {mascote ? <CaoEspiando t={t} em={caoEm + 0.25} reacoes={[{ em: caoEm, r: "feliz" }]} direita={44} /> : null}
      <div style={{ position: "relative", filter: sombraDePapel(0.14) }}>
        <div style={{ background: cor.branco, borderRadius: 32, padding: 12 }}>
          <div style={{ position: "relative", overflow: "hidden", background: cor.foil, borderRadius: 24, padding: "36px 46px 40px" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(110deg, transparent ${(brilho - 0.12) * 100}%, rgba(255,255,255,0.28) ${brilho * 100}%, transparent ${(brilho + 0.12) * 100}%)`,
              }}
            />
            <div style={{ position: "relative", height: hTexto }}>
              <Palavras texto={m.texto} tempos={m.texto.split(/\s+/).map(() => em)} t={t} quebras={enc.quebras} esboco={null} style={{ ...titulo(enc.tamanho), lineHeight: 1.04 }} corDe={() => cor.cartela} />
            </div>
            {destaque && encDetalhe ? (
              <Palavras
                texto={m.detalhe ?? ""}
                tempos={temposDetalhe}
                t={t}
                quebras={encDetalhe.quebras}
                esboco="rgba(244,236,221,0.35)"
                style={{ ...corpo(encDetalhe.tamanho, 760), marginTop: 14 }}
                corDe={() => "#F6DE9C"}
              />
            ) : null}
          </div>
        </div>
      </div>
      {/* selo de estrela: figurinha rara */}
      <svg width={92} height={92} viewBox="-46 -46 92 92" style={{ position: "absolute", right: -18, top: -30, overflow: "visible", rotate: "12deg" }}>
        <circle r={42} fill={cor.branco} />
        <circle r={34} fill={cor.carimbo} />
        <polygon
          points={Array.from({ length: 10 }, (_, i) => {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const r = i % 2 === 0 ? 20 : 9;
            return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
          }).join(" ")}
          fill={cor.cartela}
        />
      </svg>
    </div>
  );
};

// ---------- pergunta ----------

// cada texto cabe numa linha de `largura` a pelo menos 44 px?
const encaixeCabe = (textos: string[], largura: number) =>
  textos.every((tx) => {
    const e = encaixar(tx, { largura, max: 56, min: 40, linhas: 2, ...CORPO });
    return e.linhas.length === 1 || e.tamanho >= 44;
  });

const FUNDOS_OPCAO = [fundos.manteiga, fundos.menta, fundos.ceu, fundos.lavanda];

export const Pergunta: React.FC<{ m: PerguntaT } & Comum> = ({ m, palavras, t, topo, fim, entra, mascote }) => {
  const largura = W - 96;
  const inicio = inicioDoTexto(m, entra);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  // a pergunta encolhe um pouco quando há opções, para tudo caber acima da interface do app
  const enc = encaixar(m.texto, { largura: util(largura, 76), max: opcoes.length ? 70 : 78, min: 56, linhas: 3, ...TITULO });
  const yEtiqueta = topo + 66;
  const hEtiqueta = alturaDe(enc, 1.02) + 64 + 40 + 24;
  // opções: duas colunas quando cada uma cabe em meia largura, senão uma por linha; se não couber
  // acima da interface do app, tenta duas colunas com letra menor e, no fim, sobe o bloco um pouco
  const meia = (largura - 24) / 2;
  const montar = (colunas: boolean, max: number) => {
    const encs = opcoes.map((o) => encaixar(o.texto, { largura: (colunas ? meia : largura) - 122, max, min: 40, linhas: 2, ...CORPO }));
    const hOpc = (e: { linhas: unknown[]; tamanho: number }) => alturaDe(e, 1.14) + 40 + 20;
    let y = yEtiqueta + hEtiqueta + 26;
    const caixas = opcoes.map((_, i) => {
      const col = colunas ? i % 2 : 0;
      const linha = colunas ? Math.floor(i / 2) : i;
      const h = colunas ? Math.max(...encs.slice(linha * 2, linha * 2 + 2).map(hOpc)) : hOpc(encs[i]);
      const caixa = { x: 48 + (colunas ? col * (meia + 24) : 0), y, w: colunas ? meia : largura, h };
      if (!colunas || col === 1 || i === opcoes.length - 1) y += h + 16;
      return caixa;
    });
    return { encs, caixas, fim: y - 16, colunas };
  };
  const cabe = (l: { fim: number }) => l.fim <= LIMITE_APP - 10;
  const emColunas = opcoes.length !== 3 && encaixeCabe(opcoes.map((o) => o.texto), meia - 122);
  let layout = montar(emColunas, 56);
  if (!cabe(layout)) layout = montar(true, 48);
  if (!cabe(layout)) layout = montar(true, 42);
  const { encs, caixas } = layout;
  // ainda passou: sobe o bloco inteiro (no máximo 120 px, para não chegar ao queixo)
  const sobe = Math.min(Math.max(0, layout.fim - (LIMITE_APP - 10)), 120);
  const seloEm = tempos[0] ?? m.de;
  const caoEm = (opcoes[opcoes.length - 1]?.em ?? tempos[tempos.length - 1] ?? m.de) + 0.3;
  return (
    <div style={{ position: "absolute", inset: 0, translate: `0 ${-sobe}px` }}>
      <Etiqueta
        x={48}
        y={yEtiqueta}
        w={largura}
        t={t}
        entra={entra}
        sai={fim}
        inclinacao={-1.4}
        padding="64px 36px 40px 40px"
        atras={mascote && !opcoes.length ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "curioso" }]} direita={40} /> : null}
        frente={<Selo texto="?" diametro={130} t={t} em={seloEm} style={{ left: 18, top: -78 }} />}
      >
        <Palavras texto={m.texto} tempos={tempos} t={t} quebras={enc.quebras} style={{ ...titulo(enc.tamanho) }} corDe={() => cor.tinta} />
      </Etiqueta>
      {opcoes.map((o, i) => {
        const c = caixas[i];
        if (t < o.em - 0.08 || t > fim + 0.05) return null;
        const e = colando(t, o.em - 0.06, 0.4);
        const d = descolando(t, fim);
        const temposO = temposDoTexto(o.texto, palavras, o.em - 0.1, opcoes[i + 1]?.em ?? m.ate, o.em - 0.1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.w,
              rotate: `${(i % 2 ? 1.6 : -1.8) + e.giro + d.giro}deg`,
              ...e.style,
              opacity: (e.style.opacity as number) * d.fora,
              translate: `${d.dx}px ${mistura(26, 0, e.p) + d.dy}px`,
            }}
          >
            <div style={{ position: "relative", filter: sombraDePapel(0.12) }}>
              <div style={{ background: cor.branco, borderRadius: 26, padding: 10 }}>
                <div style={{ background: FUNDOS_OPCAO[i % FUNDOS_OPCAO.length], borderRadius: 18, padding: "20px 22px 20px 20px", minHeight: c.h - 20 - 40, display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      flex: "none",
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      border: `4px solid ${cor.tinta}`,
                      background: cor.cartela,
                    }}
                  />
                  <Palavras texto={o.texto} tempos={temposO} t={t} quebras={encs[i].quebras} style={{ ...corpo(encs[i].tamanho, 800) }} corDe={() => cor.tinta} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- especial ----------

export const Especial: React.FC<{ m: EspecialT; palavras: Palavra[]; t: number; y: number; fim: number; mascote: boolean }> = ({
  m,
  palavras,
  t,
  y,
  fim,
  mascote,
}) => {
  const texto = [m.apoio, m.texto].filter(Boolean).join(" ");
  const entra = m.de + 0.22;
  const inicio = Math.max(m.de + 0.05, (m.em ?? m.de) - 0.06);
  const tempos = temposDoTexto(texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const nApoio = m.apoio ? m.apoio.split(/\s+/).filter(Boolean).length : 0;
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const alivio = m.alivioEm ?? tempos[tempos.length - 1] ?? m.de + 1;
  const larguraTexto = util(W - 300, 80);
  const encApoio = m.apoio ? encaixar(m.apoio, { largura: larguraTexto, max: 46, min: 40, linhas: 2, ...CORPO }) : null;
  const enc = encaixar(m.texto, { largura: larguraTexto, max: m.texto.length > 18 ? 74 : 80, min: 58, linhas: 2, ...TITULO });
  // etiqueta mais alta (texto em 3 linhas): sobe para não passar da figurinha
  const extra = Math.max(0, alturaDe(enc, 1.02) + (encApoio ? alturaDe(encApoio, 1.14) + 8 : 0) - 220);
  return (
    <Etiqueta
      x={150}
      y={y - extra}
      w={W - 300}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={1.4}
      padding="30px 40px 36px"
      atras={
        mascote ? (
          <CaoEspiando
            t={t}
            em={entra + 0.15}
            reacoes={[
              { em: entra, r: "preocupado" },
              { em: alivio, r: "feliz" },
            ]}
            direita={-46}
            largura={210}
          />
        ) : null
      }
    >
      {m.apoio && encApoio ? (
        <Palavras
          texto={m.apoio}
          tempos={tempos.slice(0, nApoio)}
          t={t}
          quebras={encApoio.quebras}
          style={{ ...corpo(encApoio.tamanho, 760), marginBottom: 8 }}
          corDe={() => cor.tintaSuave}
        />
      ) : null}
      <Palavras
        texto={m.texto}
        tempos={tempos.slice(nApoio)}
        t={t}
        quebras={enc.quebras}
        style={{ ...titulo(enc.tamanho) }}
        corDe={(i) => (destaque.has(i) ? cor.carimbo : cor.tinta)}
      />
    </Etiqueta>
  );
};

// ---------- fechamento ----------

const FUNDOS_CTA = [fundos.manteiga, fundos.menta];

type Chamada = { texto: string; em: number; icone?: IconeDeChamada; destaque?: string };

export const Cta: React.FC<{ m: CtaT; plano: Plano } & Omit<Comum, "palavras">> = ({ m, plano, t, topo, fim, entra, mascote }) => {
  const sai = descolando(t, fim);
  // formato universal (texto + segunda) ou o antigo (chamadas)
  const chamadas: Chamada[] = m.chamadas?.length
    ? m.chamadas.slice(0, 2)
    : [{ texto: m.texto, em: m.em ?? m.de + 0.05, icone: m.icone ?? "salvar", destaque: m.destaque }, ...(m.segunda ? [m.segunda] : [])];
  const ultima = chamadas[chamadas.length - 1];
  const assinaEm = (ultima?.em ?? m.de) + 0.7;
  let y = topo + 20;
  const pecas = chamadas.map((c, i) => {
    const grande = i === 0;
    const icone = grande ? 108 : 100;
    const max = grande ? 84 : 72;
    // a figurinha cresce com o texto até quase a largura da tela; texto longo quebra em 2 linhas
    const encLivre = encaixar(c.texto, { largura: W - 140 - 24 - 58 - icone - 26, max, min: 56, linhas: 2, ...TITULO });
    const larguraTexto = encLivre.largura;
    const largura = Math.max(grande ? 560 : 820, Math.min(W - 140, 24 + 58 + icone + 26 + larguraTexto + 8));
    const h = Math.max(icone, alturaDe(encLivre, 1.02)) + (grande ? 46 : 50) + 24;
    const peca = { c, i, grande, icone, enc: encLivre, largura, x: grande ? 70 : W - 70 - largura, y, h };
    y += grande ? Math.max(194, h + 12) : h + 20;
    return peca;
  });
  const yAssinatura = Math.max(topo + 470, y + 24);
  return (
    <div style={{ position: "absolute", inset: 0, ...sai.style }}>
      {pecas.map(({ c, i, grande, icone, enc, largura, x, y: yc }) => {
        // a segunda chamada nunca cola junto com a primeira
        const em = Math.max(c.em - 0.06, entra + 0.2 * i);
        if (t < em - 0.02) return null;
        const e = colando(t, em, 0.4);
        const proxima = chamadas[i + 1];
        const tempos = temposDoTexto(c.texto, plano.palavras, c.em - 0.1, proxima ? proxima.em : m.ate, Math.max(c.em - 0.1, entra));
        const destaque = indicesDoTrecho(c.texto, c.destaque);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yc, width: largura, rotate: `${(grande ? -2.6 : 1.8) + e.giro}deg`, ...e.style }}>
            {mascote && i === chamadas.length - 1 ? (
              <div style={{ position: "absolute", inset: 0 }}>
                <CaoEspiando t={t} em={Math.max(c.em, entra) + 0.3} reacoes={[{ em: 0, r: "feliz" }]} direita={30} largura={200} olhar={0} />
              </div>
            ) : null}
            <div style={{ position: "relative", filter: sombraDePapel(0.14) }}>
              <div style={{ background: cor.branco, borderRadius: 32, padding: 12 }}>
                <div style={{ background: FUNDOS_CTA[i % 2], borderRadius: 24, padding: grande ? "22px 34px 24px 24px" : "24px 34px 26px 24px", display: "flex", alignItems: "center", gap: 26 }}>
                  <div
                    style={{
                      flex: "none",
                      width: icone,
                      height: icone,
                      borderRadius: "50%",
                      background: cor.carimbo,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      scale: String(mistura(0.6, 1, prog(t, em + 0.06, 0.35))),
                    }}
                  >
                    <Icone nome={c.icone ?? (i === 0 ? "salvar" : "enviar")} tamanho={grande ? 62 : 56} cor={cor.cartela} />
                  </div>
                  <Palavras
                    texto={c.texto}
                    tempos={tempos}
                    t={t}
                    quebras={enc.quebras}
                    style={{ ...titulo(enc.tamanho), color: cor.tinta }}
                    corDe={(k) => (destaque.has(k) ? cor.carimbo : cor.tinta)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {plano.marca?.nome && t >= assinaEm - 0.02 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: Math.min(yAssinatura, LIMITE_APP - 80), display: "flex", justifyContent: "center", ...colando(t, assinaEm).style }}>
          <div style={{ background: cor.foil, color: cor.cartela, borderRadius: 16, padding: "14px 26px 13px", display: "flex", gap: 18, alignItems: "baseline", rotate: "-1deg" }}>
            <span style={{ ...titulo(40) }}>{plano.marca.nome}</span>
            {plano.marca.area ? <span style={{ ...rotulo(30), color: "#F6DE9C" }}>{plano.marca.area}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export { limitar, ROTULO };
