// As artes de quadro cheio e da figurinha especial: etiquetas de papel coladas na altura do peito.
// No quadro deitado (16:9) a pessoa fica em TELA CHEIA e as etiquetas colam no terço de baixo,
// centradas no rosto e ancoradas na base útil (crescem para cima, nunca até o queixo). O que no
// vertical era uma pilha alta vira fileira:
// - Abertura: o selo do número ao lado do título; o cachorro espia por cima da etiqueta, do lado
//   oposto ao rosto.
// - Numero: o número grande de um lado, o rótulo do outro.
// - Destaque: "alerta" = carimbo framboesa com o detalhe ao lado; "chave" = figurinha brilhante.
// - Frase: uma frase na etiqueta (com risco à mão, se pedido) e uma figurinha pequena no canto.
// - Pergunta: selo "?" ao lado da pergunta; as opções colam embaixo, numa fileira de figurinhas.
// - Especial: o conselho principal numa etiqueta no quadro da esquerda, colada na beirada da
//   figurinha especial grande da pessoa.
// - Cta: as figurinhas de chamada lado a lado e a assinatura embaixo.
// Todo texto é medido (medida.ts) e encolhe até um mínimo legível para caber: nunca vaza.
import { indicesDoTrecho, limitar, mistura, Palavras, prog, temposDoTexto } from "../anim";
import { type Faixa, rostoADireita, xCentrado } from "../layout";
import { alturaDe, CORPO, encaixar, encaixarNaAltura, formatar, larguraPalavra, ROTULO, TITULO } from "../medida";
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
import { cor, corpo, ETIQUETA, fundos, H, MARGEM, rotulo, titulo } from "../tema";
import { Carimbo, larguraDoCarimbo } from "./Carimbo";
import { Cao, type ReacaoNoTempo } from "./Cao";
import { Desenho, fundoDoDesenho } from "./Desenhos";
import { colando, descolando, Etiqueta, Figurinha, Selo, sombraDePapel } from "./Figurinha";
import { Icone } from "./Icones";

// largura útil do texto numa etiqueta de largura `w` com padding horizontal `px`
const util = (w: number, px: number) => w - 24 - px;

// o cachorro (só cabeça e peito) espiando por cima de uma etiqueta: sobe de trás dela quando aparece.
// `esquerda` (em vez de `direita`) põe ele na ponta esquerda.
export const CaoEspiando: React.FC<{
  t: number;
  em: number;
  reacoes: ReacaoNoTempo[];
  direita?: number;
  esquerda?: number;
  largura?: number;
  olhar?: number;
}> = ({ t, em, reacoes, direita = 40, esquerda, largura = 230, olhar = -0.5 }) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em, 0.45);
  const altura = largura * (330 / 260);
  const lado = esquerda !== undefined ? { left: esquerda } : { right: direita };
  return (
    <div style={{ position: "absolute", ...lado, top: -altura * 0.66, width: largura, height: altura, overflow: "visible" }}>
      <div style={{ translate: `0 ${mistura(altura * 0.55, 0, p)}px`, opacity: Math.min(1, p * 2) }}>
        <Cao t={t} reacoes={reacoes} largura={largura} busto olhar={olhar} />
      </div>
    </div>
  );
};

// o cachorro espia do lado da etiqueta mais longe do rosto, olhando para o meio
const ladoDoCao = (f: Faixa, x: number, w: number, margem = 40) =>
  rostoADireita(f.cx, x, w) ? { esquerda: margem, olhar: 0.5 } : { direita: margem, olhar: -0.5 };

// altura máxima de uma etiqueta do peito (da base útil até logo abaixo do queixo)
const alturaDaFaixa = (f: Faixa) => f.base - f.topo;

const separarNumero = (titulo0: string) => {
  const ws = titulo0.split(/\s+/).filter(Boolean);
  if (ws.length > 2 && /^\d{1,2}$/.test(ws[0])) return { numero: ws[0], resto: ws.slice(1).join(" ") };
  return { numero: null, resto: ws.join(" ") };
};

// quando o texto falado começa (campo `em` dos blocos de texto) e a janela de busca das palavras
const inicioDoTexto = (m: { de: number; em?: number }, entra: number) => Math.max(entra + 0.1, (m.em ?? m.de) - 0.06);

type Comum = { palavras: Palavra[]; t: number; faixa: Faixa; fim: number; entra: number; mascote: boolean };

// ---------- abertura ----------

const SELO_ABERTURA = 150;

export const Abertura: React.FC<{ m: AberturaT } & Comum> = ({ m, palavras, t, faixa, fim, entra, mascote }) => {
  const texto = m.texto ?? m.titulo ?? "";
  const inicio = inicioDoTexto(m, entra);
  const tempos = temposDoTexto(texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const { numero, resto } = separarNumero(texto);
  const temposResto = numero ? tempos.slice(1) : tempos;
  const destaque = indicesDoTrecho(resto, m.destaque);
  const caoEm = m.caoEm ?? tempos[tempos.length - 1] ?? m.de + 1;
  const w = ETIQUETA.w;
  const x = xCentrado(faixa.cx, w);
  // o selo do número fica ao lado do título (uma fileira), não em cima dele
  const larguraTexto = util(w, 76) - (numero ? SELO_ABERTURA + 34 : 0);
  const enc = encaixarNaAltura(resto, {
    largura: larguraTexto,
    max: resto.length > 52 ? 72 : 78,
    min: 54,
    linhas: 2,
    altura: alturaDaFaixa(faixa) - 24 - 76,
    entrelinha: 1.02,
    ...TITULO,
  });
  const cao = ladoDoCao(faixa, x, w);
  return (
    <Etiqueta
      x={x}
      base={faixa.base}
      w={w}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={-1.2}
      padding="36px 36px 40px 40px"
      atras={mascote ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "curioso" }]} {...cao} /> : null}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        {numero ? (
          <div style={{ position: "relative", flex: "none", width: SELO_ABERTURA, height: SELO_ABERTURA }}>
            <Selo texto={numero} diametro={SELO_ABERTURA} t={t} em={tempos[0] ?? m.de} style={{ left: 0, top: 0 }} />
          </div>
        ) : null}
        <Palavras
          texto={resto}
          tempos={temposResto}
          t={t}
          quebras={enc.quebras}
          style={{ ...titulo(enc.tamanho) }}
          corDe={(i) => (destaque.has(i) ? cor.carimbo : cor.tinta)}
        />
      </div>
    </Etiqueta>
  );
};

// ---------- frase ----------

export const Frase: React.FC<{ m: FraseT } & Comum> = ({ m, palavras, t, faixa, fim, entra }) => {
  const inicio = inicioDoTexto(m, entra);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const riscados = indicesDoTrecho(m.texto, m.risco);
  // o risco bate quando a última palavra riscada é dita (ou no `riscoEm`)
  const ultimoRiscado = [...riscados].pop();
  const riscoEm = m.riscoEm ?? (ultimoRiscado !== undefined ? (tempos[ultimoRiscado] ?? m.de) + 0.3 : 0);
  const em = entra + 0.35;
  const w = ETIQUETA.w;
  const x = xCentrado(faixa.cx, w);
  const enc = encaixarNaAltura(m.texto, {
    largura: util(w, m.desenho ? 276 : 92),
    max: 78,
    min: 56,
    linhas: 2,
    altura: alturaDaFaixa(faixa) - 24 - 84,
    entrelinha: 1.02,
    ...TITULO,
  });
  // a figurinha pequena cola no canto mais longe do rosto
  const desenhoNaEsquerda = rostoADireita(faixa.cx, x, w);
  return (
    <Etiqueta
      x={x}
      base={faixa.base}
      w={w}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={1.2}
      padding={m.desenho ? (desenhoNaEsquerda ? "40px 46px 44px 230px" : "40px 230px 44px 46px") : "40px 46px 44px"}
      frente={
        m.desenho && t >= em - 0.02 ? (
          <div
            style={{
              position: "absolute",
              ...(desenhoNaEsquerda ? { left: 26 } : { right: 26 }),
              top: -44,
              width: 200,
              height: 200,
              rotate: `${(desenhoNaEsquerda ? -6 : 6) + colando(t, em).giro}deg`,
              ...colando(t, em).style,
            }}
          >
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

export const Numero: React.FC<{ m: NumeroT } & Comum> = ({ m, palavras, t, faixa, fim, entra, mascote }) => {
  const largura = ETIQUETA.w;
  const x = xCentrado(faixa.cx, largura);
  const casas = m.casas ?? (Number.isInteger(m.valor) ? 0 : 1);
  const final = formatar(m.valor, casas);
  const pConta = prog(t, m.em, 1.15);
  const agora = formatar(m.valor * pConta, casas);
  const util0 = util(largura, 84);
  // o número de um lado e o rótulo do outro (uma fileira): o número cabe em ~55% da etiqueta e na
  // altura da faixa (prefixo e sufixo menores)
  const larguraDo = (s: number) =>
    larguraPalavra(final, s, TITULO) +
    (m.prefixo ? larguraPalavra(m.prefixo, s * 0.42, TITULO) + s * 0.12 : 0) +
    (m.sufixo ? larguraPalavra(m.sufixo, s * 0.42, TITULO) + s * 0.12 : 0);
  const alturaUtil = alturaDaFaixa(faixa) - 24 - 56;
  const alturaNumero = alturaUtil - (m.ilustrativo ? 58 : 0);
  let tamanho = Math.min(180, alturaNumero);
  while (tamanho > 96 && larguraDo(tamanho) > util0 * 0.55) tamanho -= 4;
  const larguraRotulo = util0 - larguraDo(tamanho) - 48;
  const rotuloEm = m.rotuloEm ?? Math.min(m.em, m.de + 0.2);
  const temposRotulo = temposDoTexto(m.rotulo, palavras, m.de - 0.2, m.ate, Math.max(entra + 0.1, rotuloEm - 0.06));
  const encRotulo = encaixarNaAltura(m.rotulo, { largura: larguraRotulo, max: 52, min: 38, linhas: 3, altura: alturaUtil, entrelinha: 1.14, ...CORPO });
  const caoEm = m.em + 0.5;
  const cao = ladoDoCao(faixa, x, largura);
  return (
    <Etiqueta
      x={x}
      base={faixa.base}
      w={largura}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={-1.2}
      padding="30px 40px 26px 44px"
      atras={mascote ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "querendo" }, { em: caoEm + 1.4, r: "atento" }]} {...cao} /> : null}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: tamanho * 0.12, color: cor.tinta, whiteSpace: "nowrap" }}>
            {m.prefixo ? <span style={{ ...titulo(tamanho * 0.42), color: cor.carimbo }}>{m.prefixo}</span> : null}
            <span style={{ position: "relative", ...titulo(tamanho), lineHeight: 1 }}>
              {/* a largura fica a do número final: nada pula enquanto conta */}
              <span style={{ visibility: "hidden" }}>{final}</span>
              <span style={{ position: "absolute", left: 0, top: 0, color: t < m.em ? cor.lapisClaro : cor.tinta }}>{pConta >= 1 ? final : agora}</span>
            </span>
            {m.sufixo ? <span style={{ ...titulo(tamanho * 0.42), color: cor.carimbo }}>{m.sufixo}</span> : null}
          </div>
          {m.ilustrativo ? (
            <div style={{ ...rotulo(30), color: cor.tintaSuave, border: `3px solid ${cor.lapis}`, borderRadius: 12, padding: "8px 14px 7px" }}>ilustrativo</div>
          ) : null}
        </div>
        <Palavras
          texto={m.rotulo}
          tempos={temposRotulo}
          t={t}
          quebras={encRotulo.quebras}
          style={{ ...corpo(encRotulo.tamanho, 780), minWidth: 0 }}
          corDe={() => cor.tintaSuave}
        />
      </div>
    </Etiqueta>
  );
};

// ---------- destaque ----------

export const Destaque: React.FC<{ m: DestaqueT } & Comum> = ({ m, palavras, t, faixa, fim, entra, mascote }) => {
  const alerta = m.nivel === "alerta";
  const largura = ETIQUETA.w;
  const x = xCentrado(faixa.cx, largura);
  const temDetalhe = !!m.detalhe;
  const detalheEm = m.detalheEm ?? m.em + 0.9;
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, detalheEm - 0.3, m.ate, detalheEm - 0.06) : [];
  const caoEm = m.em + 0.15;
  const cao = ladoDoCao(faixa, x, largura, 36);
  if (alerta) {
    // o carimbo bate numa etiqueta: a etiqueta cola na entrada e o carimbo no `em`. Com detalhe, o
    // carimbo fica de um lado e o detalhe do outro (uma fileira).
    const altura = 180;
    const util0 = util(largura, 84);
    const larguraCarimbo = larguraDoCarimbo(m.texto, altura, temDetalhe ? util0 * 0.52 : util0);
    const larguraDetalhe = util0 - larguraCarimbo - 44;
    const encDetalhe = m.detalhe
      ? encaixarNaAltura(m.detalhe, { largura: larguraDetalhe, max: 50, min: 38, linhas: 3, altura: alturaDaFaixa(faixa) - 24 - 68, entrelinha: 1.14, ...CORPO })
      : null;
    const carimbos = (
      <div style={{ position: "relative", flex: "none", width: temDetalhe ? larguraCarimbo : util0, height: altura + 24 }}>
        {t < m.em - 0.02 ? (
          <Carimbo
            t={t}
            em={m.em}
            lapis
            altura={altura}
            larguraMax={temDetalhe ? util0 * 0.52 : util0}
            tipo="alerta"
            texto={m.texto}
            inclinacao={-4}
            style={{ left: temDetalhe ? 0 : Math.max(0, (util0 - larguraCarimbo) / 2), top: 12 }}
          />
        ) : null}
        <Carimbo
          t={t}
          em={m.em}
          altura={altura}
          larguraMax={temDetalhe ? util0 * 0.52 : util0}
          tipo="alerta"
          texto={m.texto}
          inclinacao={-4}
          style={{ left: temDetalhe ? 0 : Math.max(0, (util0 - larguraCarimbo) / 2), top: 12 }}
        />
      </div>
    );
    return (
      <Etiqueta
        x={x}
        base={faixa.base}
        w={largura}
        t={t}
        entra={entra}
        sai={fim}
        inclinacao={-1.2}
        padding="34px 42px 34px"
        atras={mascote ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "susto" }]} {...cao} /> : null}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          {carimbos}
          {m.detalhe && encDetalhe ? (
            <Palavras
              texto={m.detalhe}
              tempos={temposDetalhe}
              t={t}
              quebras={encDetalhe.quebras}
              style={{ ...corpo(encDetalhe.tamanho, 780), minWidth: 0 }}
              corDe={() => cor.tinta}
            />
          ) : null}
        </div>
      </Etiqueta>
    );
  }
  // chave: a figurinha brilhante (índigo, como a moldura especial), colada no `em`
  const encDetalhe = m.detalhe ? encaixar(m.detalhe, { largura: largura - 140, max: 48, min: 38, linhas: 2, ...CORPO }) : null;
  const hDetalhe = encDetalhe ? alturaDe(encDetalhe, 1.14) + 14 : 0;
  const enc = encaixarNaAltura(m.texto, {
    largura: largura - 140,
    max: 104,
    min: 60,
    linhas: 2,
    altura: alturaDaFaixa(faixa) - 24 - 76 - hDetalhe,
    entrelinha: 1.04,
    ...TITULO,
  });
  const hTexto = alturaDe(enc, 1.04);
  const em = Math.max(entra, m.em - 0.08);
  if (t < em - 0.02 || t > fim + 0.05) return null;
  const e = colando(t, em, 0.42);
  const d = descolando(t, fim);
  // o brilho atravessa a figurinha quando ela cola e de novo a cada 2,6 s
  const ciclo = ((t - em) % 2.6) / 0.9;
  const brilho = -0.3 + ciclo * 1.6;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        bottom: H - faixa.base,
        width: largura,
        rotate: `${-1.6 + e.giro + d.giro}deg`,
        ...e.style,
        opacity: (e.style.opacity as number) * d.fora,
        translate: `${d.dx}px ${mistura(26, 0, e.p) + d.dy}px`,
      }}
    >
      {mascote ? <CaoEspiando t={t} em={caoEm + 0.25} reacoes={[{ em: caoEm, r: "feliz" }]} {...ladoDoCao(faixa, x, largura, 44)} /> : null}
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
            {temDetalhe && encDetalhe ? (
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

const FUNDOS_OPCAO = [fundos.manteiga, fundos.menta, fundos.ceu, fundos.lavanda];

export const Pergunta: React.FC<{ m: PerguntaT } & Comum> = ({ m, palavras, t, faixa, fim, entra, mascote }) => {
  const inicio = inicioDoTexto(m, entra);
  const tempos = temposDoTexto(m.texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  // sem opções: a etiqueta comum, centrada no rosto; com opções, a etiqueta larga (de margem a
  // margem) e as opções numa fileira embaixo dela
  const largura = n ? ETIQUETA.larga : ETIQUETA.w;
  const x = n ? MARGEM : xCentrado(faixa.cx, largura);
  const GAP = 24;
  const wOpcao = n ? (largura - GAP * (n - 1)) / n : 0;
  const hOpc = (e: { linhas: unknown[]; tamanho: number }) => alturaDe(e, 1.14) + 40 + 20;
  // tenta tamanhos do maior para o menor até a pergunta e as opções caberem na faixa do peito
  const montar = (q: number, o: number, selo: number) => {
    const enc = encaixar(m.texto, { largura: util(largura, 76) - selo - 30, max: q, min: Math.min(q, 50), linhas: 2, ...TITULO });
    const encs = opcoes.map((op) => encaixar(op.texto, { largura: wOpcao - 122, max: o, min: Math.min(o, 38), linhas: 2, ...CORPO }));
    const hFileira = n ? Math.max(...encs.map(hOpc)) : 0;
    const hEtiqueta = Math.max(selo, alturaDe(enc, 1.02)) + 76 + 24;
    return { enc, encs, hFileira, hEtiqueta, selo, total: hEtiqueta + (n ? 16 + hFileira : 0) };
  };
  const cabe = (l: { total: number }) => l.total <= alturaDaFaixa(faixa) + 30;
  const tentativas: [number, number, number][] = n
    ? [
        [66, 50, 112],
        [58, 44, 104],
        [52, 40, 96],
      ]
    : [
        [78, 0, 130],
        [66, 0, 120],
        [56, 0, 110],
      ];
  let l = montar(...tentativas[0]);
  for (const k of tentativas.slice(1)) if (!cabe(l)) l = montar(...k);
  const { enc, encs, hFileira, selo } = l;
  const topoFileira = faixa.base - hFileira;
  const baseEtiqueta = n ? topoFileira - 16 : faixa.base;
  const seloEm = tempos[0] ?? m.de;
  const caoEm = (opcoes[n - 1]?.em ?? tempos[tempos.length - 1] ?? m.de) + 0.3;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Etiqueta
        x={x}
        base={baseEtiqueta}
        w={largura}
        t={t}
        entra={entra}
        sai={fim}
        inclinacao={n ? -0.8 : -1.2}
        padding="36px 36px 40px 40px"
        atras={mascote && !n ? <CaoEspiando t={t} em={caoEm} reacoes={[{ em: caoEm, r: "curioso" }]} {...ladoDoCao(faixa, x, largura)} /> : null}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ position: "relative", flex: "none", width: selo, height: selo }}>
            <Selo texto="?" diametro={selo} t={t} em={seloEm} style={{ left: 0, top: 0 }} />
          </div>
          <Palavras texto={m.texto} tempos={tempos} t={t} quebras={enc.quebras} style={{ ...titulo(enc.tamanho) }} corDe={() => cor.tinta} />
        </div>
      </Etiqueta>
      {opcoes.map((o, i) => {
        if (t < o.em - 0.08 || t > fim + 0.05) return null;
        const e = colando(t, o.em - 0.06, 0.4);
        const d = descolando(t, fim);
        const temposO = temposDoTexto(o.texto, palavras, o.em - 0.1, opcoes[i + 1]?.em ?? m.ate, o.em - 0.1);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + i * (wOpcao + GAP),
              top: topoFileira,
              width: wOpcao,
              rotate: `${(i % 2 ? 1.4 : -1.6) + e.giro + d.giro}deg`,
              ...e.style,
              opacity: (e.style.opacity as number) * d.fora,
              translate: `${d.dx}px ${mistura(26, 0, e.p) + d.dy}px`,
            }}
          >
            <div style={{ position: "relative", filter: sombraDePapel(0.12) }}>
              <div style={{ background: cor.branco, borderRadius: 26, padding: 10 }}>
                <div
                  style={{
                    background: FUNDOS_OPCAO[i % FUNDOS_OPCAO.length],
                    borderRadius: 18,
                    padding: "20px 22px 20px 20px",
                    minHeight: hFileira - 20 - 40,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
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

// A etiqueta do conselho no quadro da esquerda: `area` = borda esquerda, largura (até um pouco por
// cima da beirada da figurinha especial da pessoa) e o centro vertical.
export const Especial: React.FC<{
  m: EspecialT;
  palavras: Palavra[];
  t: number;
  area: { x: number; w: number; cy: number };
  fim: number;
  mascote: boolean;
}> = ({ m, palavras, t, area, fim, mascote }) => {
  const texto = [m.apoio, m.texto].filter(Boolean).join(" ");
  const entra = m.de + 0.22;
  const inicio = Math.max(m.de + 0.05, (m.em ?? m.de) - 0.06);
  const tempos = temposDoTexto(texto, palavras, Math.min(m.de, inicio), m.ate, inicio);
  const nApoio = m.apoio ? m.apoio.split(/\s+/).filter(Boolean).length : 0;
  const destaque = indicesDoTrecho(m.texto, m.destaque);
  const alivio = m.alivioEm ?? tempos[tempos.length - 1] ?? m.de + 1;
  const larguraTexto = util(area.w, 80);
  const encApoio = m.apoio ? encaixar(m.apoio, { largura: larguraTexto, max: 50, min: 40, linhas: 2, ...CORPO }) : null;
  const enc = encaixar(m.texto, { largura: larguraTexto, max: m.texto.length > 24 ? 84 : 92, min: 58, linhas: 3, ...TITULO });
  const altura = 24 + 66 + (encApoio ? alturaDe(encApoio, 1.14) + 8 : 0) + alturaDe(enc, 1.02);
  return (
    <Etiqueta
      x={area.x}
      y={area.cy - altura / 2}
      w={area.w}
      t={t}
      entra={entra}
      sai={fim}
      inclinacao={1.2}
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
            esquerda={36}
            olhar={0.5}
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

export const Cta: React.FC<{ m: CtaT; plano: Plano } & Omit<Comum, "palavras">> = ({ m, plano, t, faixa, fim, entra, mascote }) => {
  const sai = descolando(t, fim);
  // formato universal (texto + segunda) ou o antigo (chamadas)
  const chamadas: Chamada[] = m.chamadas?.length
    ? m.chamadas.slice(0, 2)
    : [{ texto: m.texto, em: m.em ?? m.de + 0.05, icone: m.icone ?? "salvar", destaque: m.destaque }, ...(m.segunda ? [m.segunda] : [])];
  const ultima = chamadas[chamadas.length - 1];
  const assinaEm = (ultima?.em ?? m.de) + 0.7;
  // as chamadas lado a lado (uma fileira); com uma só, a largura da etiqueta comum
  const GAP = 34;
  const larguraMax = chamadas.length > 1 ? (ETIQUETA.larga - GAP) / 2 : ETIQUETA.w;
  const pecas0 = chamadas.map((c, i) => {
    const grande = i === 0;
    const icone = grande ? 108 : 96;
    const max = grande ? 84 : 72;
    // a figurinha cresce com o texto até a largura da sua metade; texto longo quebra em 2 linhas
    const enc = encaixar(c.texto, { largura: larguraMax - 24 - 58 - icone - 26 - 8, max, min: 52, linhas: 2, ...TITULO });
    const largura = Math.max(grande ? 520 : 0, Math.min(larguraMax, 24 + 58 + icone + 26 + enc.largura + 8));
    const h = Math.max(icone, alturaDe(enc, 1.02)) + (grande ? 46 : 50) + 24;
    return { c, i, grande, icone, enc, largura, h };
  });
  const total = pecas0.reduce((a, p) => a + p.largura, 0) + GAP * (pecas0.length - 1);
  const hFileira = Math.max(...pecas0.map((p) => p.h));
  const temAssinatura = !!plano.marca?.nome;
  const yAssinatura = faixa.base - 66;
  const topoFileira = (temAssinatura ? yAssinatura - 22 : faixa.base) - hFileira;
  const x0 = xCentrado(faixa.cx, total);
  let xc = x0;
  const pecas = pecas0.map((p) => {
    const peca = { ...p, x: xc, y: topoFileira + (hFileira - p.h) / 2 };
    xc += p.largura + GAP;
    return peca;
  });
  // o cachorro espia na ponta da fileira mais longe do rosto
  const caoNaPrimeira = faixa.cx > x0 + total / 2;
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
        const comCao = mascote && (caoNaPrimeira ? i === 0 : i === chamadas.length - 1);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yc, width: largura, rotate: `${(grande ? -2.2 : 1.6) + e.giro}deg`, ...e.style }}>
            {comCao ? (
              <div style={{ position: "absolute", inset: 0 }}>
                <CaoEspiando
                  t={t}
                  em={Math.max(c.em, entra) + 0.3}
                  reacoes={[{ em: 0, r: "feliz" }]}
                  {...(caoNaPrimeira ? { esquerda: 30 } : { direita: 30 })}
                  largura={200}
                  olhar={0}
                />
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
      {temAssinatura && t >= assinaEm - 0.02 ? (
        <div style={{ position: "absolute", left: x0, width: total, top: yAssinatura, display: "flex", justifyContent: "center", ...colando(t, assinaEm).style }}>
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
