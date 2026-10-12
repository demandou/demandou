// Os blocos universais "de lado" na linguagem do Impacto: a pessoa vai para a moldura da direita e o
// bloco ocupa o quadro de texto à esquerda, com as palavras batendo no tempo da fala. Mesmas peças do
// modelo: o cartaz de palavras enormes, o risco no acento, o selo no acento, os rótulos espaçados e o
// número mono. No quadro deitado o quadro de texto é largo e baixo: a comparação põe os dois lados
// lado a lado e as opções da pergunta vão em duas colunas, em vez de empilhar.
import { batida, prog, useTempo } from "../anim";
import type { Abertura as TAbertura, Comparacao as TComparacao, Cta as TCta, Definicao as TDefinicao, Destaque as TDestaque, Frase as TFrase, Pergunta as TPergunta, Topicos as TTopicos } from "../plano";
import { caixaAlta, cor, larguraEm, mono, QUADRO, rotulo, sora, TRACKING } from "../tema";
import { alinhar, alturaDe, encaixar, montarCartaz, reduzir } from "../texto";
import { Cartaz, prepararCartaz } from "./Cartaz";
import { NaColuna } from "./Coluna";
import type { Contexto } from "./contexto";
import { Traco } from "./Icones";
import { medirPilha, Pilha } from "./Pilha";

const ALTURA_ROTULO = 70;

// Rótulo espaçado (o assunto, em cima), quebrando em até 2 linhas na largura da coluna.
const Rotulo: React.FC<{ t: number; texto: string; em: number; largura: number; cor?: string }> = ({ t, texto, em, largura, cor: c = cor.volt }) => {
  const { tamanho, linhas } = encaixar(caixaAlta(texto), { largura, max: 40, min: 30, maxLinhas: 2, peso: 700, espacamento: 0.16 });
  return (
    <div style={{ ...rotulo, fontSize: tamanho, lineHeight: 1.2, color: c, ...batida(t, em) }}>
      {linhas.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};
const alturaRotulo = (texto: string | undefined, largura: number) => {
  if (!texto) return 0;
  const { tamanho, linhas } = encaixar(caixaAlta(texto), { largura, max: 40, min: 30, maxLinhas: 2, peso: 700, espacamento: 0.16 });
  return linhas.length * tamanho * 1.2 + 30;
};

// Texto corrido (detalhe, opção): Sora Bold, de 56 a 44 px, até 3 linhas.
const Corrido: React.FC<{ texto: string; largura: number; max?: number; min?: number; maxLinhas?: number; cor?: string; style?: React.CSSProperties }> = ({
  texto,
  largura,
  max = 56,
  min = 44,
  maxLinhas = 3,
  cor: c = cor.papel,
  style,
}) => {
  const { tamanho, linhas } = encaixar(texto, { largura, max, min, maxLinhas });
  return (
    <div style={{ fontFamily: sora, fontWeight: 700, fontSize: tamanho, lineHeight: 1.18, color: c, ...style }}>
      {linhas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
    </div>
  );
};
const alturaCorrido = (texto: string, largura: number, max = 56, min = 44, maxLinhas = 3) => {
  const { tamanho, linhas } = encaixar(texto, { largura, max, min, maxLinhas });
  return linhas.length * tamanho * 1.18;
};

const espaco = (ctx: Contexto, extra = 0) => ctx.base - ctx.topo - extra;

// ——— abertura e frase: o cartaz ———

export const Abertura: React.FC<{ m: TAbertura; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const rot = alturaRotulo(m.rotulo, ctx.coluna.w);
  const p = prepararCartaz(m.texto, ctx.coluna.w, ctx.palavras, m.em ?? m.de, m.ate, {
    maximo: 230,
    alturaMax: Math.min(820, espaco(ctx, rot)),
    destaque: m.destaque,
  });
  return (
    <NaColuna ctx={ctx} de={m.de} altura={p.altura + rot}>
      {m.rotulo ? (
        <div style={{ marginBottom: 30 }}>
          <Rotulo t={t} texto={m.rotulo} em={m.de + 0.05} largura={ctx.coluna.w} />
        </div>
      ) : null}
      <Cartaz t={t} p={p} />
    </NaColuna>
  );
};

// instante do risco: o pedido no plano ou logo depois da última palavra riscada
export const instanteDoRisco = (m: TFrase, tempos: number[], risco: Set<number>) =>
  m.riscoEm ?? (risco.size ? (tempos[Math.max(...risco)] ?? m.de) + 0.25 : undefined);

export const Frase: React.FC<{ m: TFrase; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const p = prepararCartaz(m.texto, ctx.coluna.w, ctx.palavras, m.em ?? m.de, m.ate, {
    maximo: 230,
    alturaMax: Math.min(860, espaco(ctx)),
    destaque: m.destaque,
    risco: m.risco,
  });
  return (
    <NaColuna ctx={ctx} de={m.de} altura={p.altura}>
      <Cartaz t={t} p={p} riscoEm={instanteDoRisco(m, p.tempos, p.risco)} />
    </NaColuna>
  );
};

// ——— destaque: a palavra que bate (chave: no acento; alerta: em tarjas no acento) ———

export const Destaque: React.FC<{ m: TDestaque; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const W = ctx.coluna.w;
  const alerta = m.nivel === "alerta";
  const det = m.detalhe ? alturaCorrido(m.detalhe, W) + 44 : 0;
  const filete = alerta ? 0 : 50;
  const p = prepararCartaz(m.texto, alerta ? W - 46 : W, ctx.palavras, m.em, m.ate, {
    maximo: alerta ? 190 : 230,
    alturaMax: Math.min(800, espaco(ctx, det + filete)),
  });
  const ultima = Math.max(...p.tempos);
  const tDetalhe = m.detalheEm ?? (m.detalhe ? alinhar(m.detalhe, ctx.palavras, ultima + 0.05, m.ate)[0] : 0);
  const pFilete = prog(t, m.em - 0.05, 0.24);
  // na tarja, cada linha cresce até o fim da última palavra já dita (marca-texto no ritmo da fala)
  const larguraDita = (i: number) => {
    const l = p.linhas[i];
    let x = 0;
    let ate = 0;
    l.palavras.forEach((w, k) => {
      const lw = larguraEm(w, 800, TRACKING);
      const dita = prog(t, p.tempos[l.indices[k]] - 0.03, 0.12);
      if (dita > 0) ate = x + lw * dita + (k < l.palavras.length - 1 ? 0.19 * dita : 0);
      x += lw + 0.19;
    });
    return ate;
  };
  const alturaTarjas = p.linhas.reduce((soma, l) => soma + l.tamanho * 1.24, 0);
  const alturaTotal = (alerta ? alturaTarjas : p.altura) + det + filete;
  return (
    <NaColuna ctx={ctx} de={m.de} altura={alturaTotal}>
      {alerta ? (
        <div>
          {p.linhas.map((l, i) => {
            const pad = l.tamanho * 0.12;
            const cheia = larguraEm(l.palavras.join(" "), 800, TRACKING) * l.tamanho + 2 * pad;
            const dita = larguraDita(i);
            const visivel = dita > 0 ? Math.min(cheia, dita * l.tamanho + 2 * pad) : 0;
            return (
              <div key={i} style={{ position: "relative", height: l.tamanho * 1.24 }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: l.tamanho * 1.16, width: visivel, background: cor.volt }} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    padding: `${l.tamanho * 0.08}px ${pad}px 0`,
                    fontFamily: sora,
                    fontWeight: 800,
                    fontSize: l.tamanho,
                    lineHeight: 1,
                    letterSpacing: `${TRACKING}em`,
                    whiteSpace: "nowrap",
                    color: cor.fundo,
                    clipPath: `inset(0 ${Math.max(0, cheia - visivel)}px 0 0)`,
                  }}
                >
                  {l.palavras.join(" ")}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div style={{ width: 120 * pFilete, height: 14, background: cor.volt, marginBottom: 36 }} />
          <Cartaz t={t} p={p} corTexto={cor.volt} />
        </>
      )}
      {m.detalhe ? (
        <div style={{ marginTop: 44, ...batida(t, tDetalhe, "baixo") }}>
          <Corrido texto={m.detalhe} largura={W} />
        </div>
      ) : null}
    </NaColuna>
  );
};

// ——— pergunta: o "?" no acento, a pergunta em cartaz e as opções numa ficha curta ———

export const Pergunta: React.FC<{ m: TPergunta; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const W = ctx.coluna.w;
  const inicio = m.em ?? m.de;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const LETRA = 64;
  // mais de duas opções: duas colunas (A B / C D), para a ficha não ficar alta demais
  const colunas = opcoes.length > 2 ? 2 : 1;
  const VAO_OPCOES = 40;
  const larguraOpcao = (W - (colunas - 1) * VAO_OPCOES) / colunas - LETRA - 24;
  // as opções ficam menores que a pergunta (hierarquia): 52 a 44 px, até 2 linhas
  const maxOpcao = opcoes.length > 2 ? 48 : 52;
  const alturaOpcoes = Array.from({ length: Math.ceil(opcoes.length / colunas) }, (_, r) =>
    Math.max(...opcoes.slice(r * colunas, r * colunas + colunas).map((o) => alturaCorrido(o.texto, larguraOpcao, maxOpcao, 44, 2))),
  ).reduce((s, h) => s + 26 + h + 18, 0);
  const SINAL = opcoes.length ? 150 : 200;
  const p = prepararCartaz(m.texto, W, ctx.palavras, inicio, opcoes[0]?.em ?? m.ate, {
    maximo: opcoes.length ? 150 : 200,
    alturaMax: Math.max(240, Math.min(760, espaco(ctx, SINAL * 0.8 + (opcoes.length ? alturaOpcoes + 40 : 0)))),
  });
  return (
    <NaColuna ctx={ctx} de={m.de} altura={SINAL * 0.8 + p.altura + (opcoes.length ? alturaOpcoes + 40 : 0)}>
      <div
        style={{
          fontFamily: sora,
          fontWeight: 800,
          fontSize: SINAL,
          lineHeight: 0.8,
          height: SINAL * 0.8,
          color: cor.volt,
          ...batida(t, m.de + 0.04),
        }}
      >
        ?
      </div>
      <Cartaz t={t} p={p} />
      {opcoes.length ? (
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: `repeat(${colunas}, 1fr)`, columnGap: VAO_OPCOES }}>
          {opcoes.map((o, i) => {
            const dita = t >= o.em - 0.03;
            return (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start", borderTop: `2px solid ${cor.trilho}`, paddingTop: 26, paddingBottom: 18 }}>
                <div style={{ fontFamily: mono, fontWeight: 800, fontSize: 52, lineHeight: 1, width: LETRA, color: dita ? cor.volt : cor.apagado }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <div style={{ flex: 1, ...batida(t, o.em, "baixo") }}>
                  <Corrido texto={o.texto} largura={larguraOpcao} max={maxOpcao} min={44} maxLinhas={2} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </NaColuna>
  );
};

// ——— cta: o ícone se desenha no acento e a chamada bate palavra por palavra ———

export const Cta: React.FC<{ m: TCta; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const W = ctx.coluna.w;
  const ICONE = 132;
  const pIcone = prog(t, m.de + 0.02, 0.5);
  const icone = m.icone ?? "enviar";
  // depois de desenhado, o avião "parte": sobe em diagonal devagar
  const parte = icone === "enviar" ? prog(t, m.de + 0.5, Math.max(1, ctx.fim - m.de - 0.5), (x) => x) : 0;
  const manual = m.itens?.length ? medirPilha(m.itens, W, 210, ctx.palavras, m.ate, Math.max(120, espaco(ctx, ICONE + 44))) : null;
  const p = manual
    ? null
    : prepararCartaz(m.texto, W, ctx.palavras, m.em ?? m.de, m.ate, {
        maximo: 210,
        alturaMax: Math.min(760, espaco(ctx, ICONE + 44)),
        destaque: m.destaque,
      });
  const altura = ICONE + 44 + (manual ? manual.altura : (p?.altura ?? 0));
  return (
    <NaColuna ctx={ctx} de={m.de} altura={altura}>
      <div style={{ height: ICONE, marginBottom: 44, translate: `${parte * 26}px ${-parte * 26}px` }}>
        <Traco nome={icone} p={pIcone} tamanho={ICONE} cor={cor.volt} espessura={3.4} />
      </div>
      {manual ? <Pilha t={t} linhas={manual.linhas} /> : p ? <Cartaz t={t} p={p} /> : null}
    </NaColuna>
  );
};

// ——— definição: o termo bate, encolhe para cima no acento, e o significado entra depois do "=" ———

const ESCALA_TERMO = 0.6;

export const Definicao: React.FC<{ m: TDefinicao; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const W = ctx.coluna.w;
  const SINAL = 110;
  const termo = prepararCartaz(m.termo, W, ctx.palavras, m.em, m.significadoEm, { maximo: 200, alturaMax: Math.min(420, espaco(ctx) * 0.6) });
  const sig = prepararCartaz(m.significado, W, ctx.palavras, m.significadoEm, m.ate, {
    maximo: 170,
    alturaMax: Math.min(640, espaco(ctx, termo.altura * ESCALA_TERMO + SINAL + 60)),
  });
  const pSobe = prog(t, m.significadoEm - 0.1, 0.28);
  const alturaFinal = termo.altura * ESCALA_TERMO + 30 + SINAL + 30 + sig.altura;
  const topoFinal = Math.max(ctx.topo, Math.min(ctx.yc - alturaFinal / 2, ctx.base - alturaFinal));
  const topoInicial = Math.max(ctx.topo, Math.min(ctx.yc - termo.altura / 2, ctx.base - termo.altura));
  const topo = topoInicial + (topoFinal - topoInicial) * pSobe;
  const escala = 1 - (1 - ESCALA_TERMO) * pSobe;
  const yIgual = topoFinal + termo.altura * ESCALA_TERMO + 30;
  // NaColuna só para a saída e o empurrão; as posições aqui são absolutas dentro dela
  return (
    <NaColuna ctx={{ ...ctx, yc: ctx.topo, topo: 0, base: QUADRO.h }} de={m.de} altura={0}>
      <div style={{ position: "absolute", left: 0, top: topo - ctx.topo, width: W, scale: String(escala), transformOrigin: "left top" }}>
        <Cartaz t={t} p={termo} corTexto={pSobe > 0.5 ? cor.volt : cor.papel} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: yIgual - ctx.topo,
          fontFamily: mono,
          fontWeight: 800,
          fontSize: SINAL,
          lineHeight: 1,
          height: SINAL,
          color: cor.volt,
          ...batida(t, m.significadoEm),
        }}
      >
        =
      </div>
      <div style={{ position: "absolute", left: 0, top: yIgual + SINAL + 30 - ctx.topo, width: W }}>
        <Cartaz t={t} p={sig} depoisDe={m.significadoEm + 0.08} />
      </div>
    </NaColuna>
  );
};

// ——— comparação: dois lados lado a lado no quadro de texto; quem perde é riscado no acento ———
// (no vertical os lados vêm empilhados; no quadro deitado, largo e baixo, ficam em duas colunas com o
// símbolo no meio e o fio que liga os dois)

const SIMBOLO: Record<string, string> = { contra: "VS", "antes-depois": "→", "errado-certo": "×" };

export const Comparacao: React.FC<{ m: TComparacao; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const W = ctx.coluna.w;
  const modo = m.modo ?? "contra";
  const [a, b] = m.lados;
  const vencedor = m.vencedor ?? (modo === "errado-certo" ? 1 : undefined);
  const vEm = vencedor !== undefined ? (m.vencedorEm ?? Math.max(a.em, b.em) + 0.45) : Infinity;
  const pV = prog(t, vEm - 0.04, 0.2);
  // a coluna do meio (símbolo e fio) e a largura de cada lado
  const MEIO = 132;
  const colW = Math.floor((W - MEIO) / 2);
  const tit = alturaRotulo(m.titulo, W);
  // os dois rótulos com a mesma altura: os textos começam na mesma linha
  const rot = Math.max(alturaRotulo(a.rotulo, colW), alturaRotulo(b.rotulo, colW));
  const livre = espaco(ctx, tit + rot);
  // os dois lados com o mesmo teto de corpo, para nenhum parecer mais importante antes da hora
  let maximo = 170;
  let pa = montarCartaz(a.texto, colW, { maximo, maxLinhas: 3, compacto: true });
  let pb = montarCartaz(b.texto, colW, { maximo, maxLinhas: 3, compacto: true });
  while (Math.max(pa.altura, pb.altura) > livre && maximo > 56) {
    maximo -= 8;
    pa = montarCartaz(a.texto, colW, { maximo, maxLinhas: 3, compacto: true });
    pb = montarCartaz(b.texto, colW, { maximo, maxLinhas: 3, compacto: true });
  }
  const linhasA = reduzir(pa.linhas, livre);
  const linhasB = reduzir(pb.linhas, livre);
  const prepA = { linhas: linhasA, altura: alturaDe(linhasA), tempos: alinhar(a.texto, ctx.palavras, a.em, b.em), destaque: new Set<number>(), risco: new Set(linhasA.flatMap((l) => l.indices)) };
  const prepB = { linhas: linhasB, altura: alturaDe(linhasB), tempos: alinhar(b.texto, ctx.palavras, b.em, m.ate), destaque: new Set<number>(), risco: new Set(linhasB.flatMap((l) => l.indices)) };
  const corpo = Math.max(prepA.altura, prepB.altura);
  const lado = (i: 0 | 1) => {
    const l = m.lados[i];
    const prep = i === 0 ? prepA : prepB;
    const ganha = vencedor === i;
    const perde = vencedor !== undefined && vencedor !== i;
    return (
      <div style={{ width: colW }}>
        <div style={{ height: rot }}>
          <Rotulo t={t} texto={l.rotulo} em={m.de + 0.05 + i * 0.06} largura={colW} cor={t >= l.em - 0.03 ? cor.volt : cor.apagado} />
        </div>
        <Cartaz t={t} p={prep} corTexto={ganha && pV > 0 ? cor.volt : cor.papel} riscoEm={perde ? vEm : undefined} />
      </div>
    );
  };
  // o fio do meio se desenha de cima para baixo quando o segundo lado começa
  const pMeio = prog(t, b.em - 0.15, 0.25);
  return (
    <NaColuna ctx={ctx} de={m.de} altura={tit + rot + corpo}>
      {m.titulo ? (
        <div style={{ marginBottom: 30 }}>
          <Rotulo t={t} texto={m.titulo} em={m.de + 0.02} largura={W} cor={cor.papel} />
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {lado(0)}
        <div style={{ width: MEIO, height: rot + corpo, position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", left: MEIO / 2 - 1.5, top: rot, width: 3, height: corpo, background: cor.trilho }}>
            <div style={{ width: 3, height: `${pMeio * 100}%`, background: cor.papel }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: MEIO,
              top: rot + corpo / 2 - 44,
              height: 88,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: cor.fundo,
              fontFamily: mono,
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1,
              color: cor.volt,
              opacity: prog(t, m.de + 0.1, 0.2),
            }}
          >
            {SIMBOLO[modo]}
          </div>
        </div>
        {lado(1)}
      </div>
    </NaColuna>
  );
};

// ——— tópicos: os itens empilhados; o da vez aceso, com o marcador no acento ao lado ———

const RECUO = 38;
export const Topicos: React.FC<{ m: TTopicos; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const W = ctx.coluna.w;
  const itens = m.itens.slice(0, 5);
  const tit = alturaRotulo(m.titulo, W);
  const PAD = 22;
  const GAP = 18;
  const fixo = tit + itens.length * (PAD + GAP);
  const detalhes = itens.map((it) => (it.detalhe ? alturaCorrido(it.detalhe, W - RECUO, 48, 44, 2) + 12 : 0));
  const livre = espaco(ctx, fixo + detalhes.reduce((a, b) => a + b, 0));
  let maximo = 150;
  let cartazes = itens.map((it) => montarCartaz(it.texto, W - RECUO, { maximo, maxLinhas: 3, compacto: true }));
  while (cartazes.reduce((s, c) => s + c.altura, 0) > livre && maximo > 52) {
    maximo -= 6;
    cartazes = itens.map((it) => montarCartaz(it.texto, W - RECUO, { maximo, maxLinhas: 3, compacto: true }));
  }
  const soma = cartazes.reduce((s, c) => s + c.altura, 0);
  if (soma > livre) cartazes = cartazes.map((c) => ({ linhas: reduzir(c.linhas, (c.altura * livre) / soma), altura: (c.altura * livre) / soma }));
  const preps = cartazes.map((c, i) => ({
    linhas: c.linhas,
    altura: alturaDe(c.linhas),
    tempos: alinhar(itens[i].texto, ctx.palavras, itens[i].em, itens[i + 1]?.em ?? m.ate),
    destaque: new Set<number>(),
    risco: new Set<number>(),
  }));
  let ativo = -1;
  itens.forEach((it, i) => {
    if (t >= it.em - 0.03) ativo = i;
  });
  // posições de cada item (para o marcador deslizar até o item da vez)
  const tops: number[] = [];
  let y = tit;
  preps.forEach((p, i) => {
    tops.push(y);
    y += PAD + p.altura + detalhes[i] + GAP;
  });
  const altura = y;
  // o marcador anda do item anterior para o novo em 0,22 s
  const yMarc = (() => {
    if (ativo < 0) return { y: tops[0] + PAD, h: preps[0]?.altura ?? 0, o: 0 };
    const p = prog(t, itens[ativo].em - 0.03, 0.22);
    const de = ativo > 0 ? ativo - 1 : 0;
    const y0 = tops[de] + PAD;
    const y1 = tops[ativo] + PAD;
    const h0 = preps[de].altura + detalhes[de];
    const h1 = preps[ativo].altura + detalhes[ativo];
    return { y: y0 + (y1 - y0) * p, h: h0 + (h1 - h0) * p, o: ativo === 0 ? p : 1 };
  })();
  return (
    <NaColuna ctx={ctx} de={m.de} altura={altura}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Rotulo t={t} texto={m.titulo} em={m.de + 0.04} largura={W} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: yMarc.y, width: 12, height: yMarc.h, background: cor.volt, opacity: yMarc.o }} />
      {preps.map((p, i) => {
        const dito = t >= itens[i].em - 0.03;
        const passado = i < ativo;
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: tops[i], width: W }}>
            {/* a linha da vaga aparece antes do item: o lugar já está marcado */}
            <div style={{ height: 2, background: cor.trilho, marginBottom: PAD - 2, width: `${prog(t, m.de + 0.06 * i, 0.25) * 100}%` }} />
            <div style={{ marginLeft: RECUO, opacity: dito ? (passado ? 0.42 : 1) : 1 }}>
              <Cartaz t={t} p={p} />
              {itens[i].detalhe ? (
                <div style={{ marginTop: 12, ...batida(t, itens[i].em + 0.35, "baixo") }}>
                  <Corrido texto={itens[i].detalhe as string} largura={W - RECUO} max={48} min={44} maxLinhas={2} cor={cor.papel} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </NaColuna>
  );
};
