// Os cartões no peito (a pessoa em tela cheia): a caixa de mensagem, a conversa curta, o cartão do
// assistente com um número dentro de uma peça, a peça grande do destaque, a nota fixada e o fechamento.
// Todos usam o mesmo cartão branco, ancorado embaixo, abaixo do queixo (zona do motor). Entre dois
// cartões encostados, o cartão fica e muda de altura: o conteúdo antigo some antes do novo entrar.
import { chega, desliza, mistura, misturaCor, prog, temposDoTexto } from "../anim";
import { CARTAO_PEITO } from "../geometria";
import { alturaTexto, type Encaixe, encaixar, formatarNumero, indicesDoTrecho, larguraLinha, larguraPalavra, larguraTexto } from "../medida";
import type { Abertura, Definicao, Destaque, Frase, Momento, Montagem, Numero, Palavra, Pergunta, Plano } from "../plano";
import { cor, corDaPeca, mono, sans, sombra } from "../tema";
import { TextoFalado } from "../texto";
import { ConteudoCta, FilaDePecas, layoutCta, temposDoCta } from "./Cta";
import { Icone } from "./Icones";
import { FormaDaPeca, fundoDoLetreiro } from "./Peca";
import { AvatarIA } from "./Resposta";

const W = CARTAO_PEITO.w;
const P = 32;
const CW = W - 2 * P;

export type Som = { em: number; arquivo: string; volume: number };
export type Ctx = { plano: Plano; palavras: Palavra[]; montagem?: Montagem; livre: number };
export type LayoutPeito = { h: number; escala: number; sons: Som[]; desenhar: (t: number) => React.ReactNode };

const palavrasDe = (s: string) => s.split(/\s+/).filter(Boolean);
// quando o último caractere de um texto digitado aparece
const fimDigitado = (texto: string, tempos: number[]) => {
  const ws = palavrasDe(texto);
  return ws.length ? (tempos[ws.length - 1] ?? 0) + ws[ws.length - 1].length * 0.03 : 0;
};

// ---------- peças de desenho comuns ----------

const CabecalhoIA: React.FC<{ direita?: React.ReactNode }> = ({ direita }) => (
  <div style={{ position: "absolute", left: P, right: P, top: 24, height: 52, display: "flex", alignItems: "center", gap: 14 }}>
    <AvatarIA tamanho={52} />
    <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 38, color: cor.tinta }}>Assistente</div>
    <div style={{ flex: 1 }} />
    {direita}
  </div>
);

export const Etiqueta: React.FC<{ texto: string; t?: number; em?: number }> = ({ texto, t = 1, em = 0 }) => (
  <div
    style={{
      height: 46,
      padding: "0 14px",
      borderRadius: 12,
      border: `3px dashed ${cor.lapis}`,
      display: "flex",
      alignItems: "center",
      fontFamily: mono,
      fontWeight: 600,
      fontSize: 30,
      letterSpacing: "0.06em",
      color: cor.tintaSuave,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      opacity: prog(t, em, 0.3),
    }}
  >
    {texto}
  </div>
);

// a caixa de mensagem: campo cinza com o botão de enviar redondo, tocado em `enviaEm`
const Campo: React.FC<{ x: number; y: number; w: number; h: number; t: number; enviaEm: number; ativoEm: number; children: React.ReactNode }> = ({
  x,
  y,
  w,
  h,
  t,
  enviaEm,
  ativoEm,
  children,
}) => {
  const ativo = prog(t, ativoEm, 0.2);
  const aceso = ativo;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 34, background: cor.cartaoFundo }}>
      {children}
      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 12,
          width: 72,
          height: 72,
          borderRadius: 36,
          background: misturaCor(cor.lapisClaro, cor.tinta, aceso),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: String(1 - 0.1 * (prog(t, enviaEm - 0.08, 0.08) - prog(t, enviaEm, 0.18))),
        }}
      >
        <Icone
          nome="enviar"
          tamanho={40}
          cor="#fff"
          espessura={4.6}
          estilo={{ translate: `0 ${-8 * (prog(t, enviaEm, 0.12) - prog(t, enviaEm + 0.12, 0.25))}px` }}
        />
      </div>
    </div>
  );
};

// peça que entra pela esquerda, sobe um pouco e desce encaixando (como na montagem); antes, a vaga a lápis
const PecaQueEncaixa: React.FC<{
  r: { x: number; y: number; w: number; h: number };
  t: number;
  em: number;
  c: ReturnType<typeof corDaPeca>;
  children?: React.ReactNode;
  comDente?: boolean;
}> = ({ r, t, em, c, children, comDente = true }) => {
  const voo = em - 0.12;
  const pv = prog(t, voo, 0.34);
  const assenta = prog(t, voo + 0.3, 0.14);
  const coberta = prog(t, voo + 0.36, 0.08);
  return (
    <>
      {coberta < 1 ? (
        <FormaDaPeca r={r} preenchimento="rgba(242,243,245,0.9)" traco={cor.lapis} tracejado comDente={comDente} opacidade={1 - coberta}>
          <div style={{ position: "absolute", left: 30, top: r.h / 2 - 11, width: (r.w - 60) * 0.5, height: 22, borderRadius: 11, background: cor.lapisClaro }} />
        </FormaDaPeca>
      ) : null}
      {t >= voo ? (
        <FormaDaPeca r={{ ...r, x: r.x - (1 - pv) * (r.x + r.w + 60), y: r.y - 16 * (1 - assenta) }} preenchimento={c.forte} sombra={1 + (1 - assenta)} comDente={comDente}>
          {children}
        </FormaDaPeca>
      ) : null}
    </>
  );
};

const LetreiroIcone: React.FC<{ icone: "alerta" | "chave" | "balao" | "pergunta"; c: ReturnType<typeof corDaPeca> }> = ({ icone, c }) => (
  <div style={{ width: 64, height: 52, borderRadius: 26, background: fundoDoLetreiro(c), display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Icone nome={icone} tamanho={36} cor={c.texto} espessura={4} />
  </div>
);

const escalaPara = (h: number, livre: number) => Math.max(0.72, Math.min(1, livre / h));

// ---------- abertura: a caixa de mensagem com o texto digitado na fala ----------
const layoutAbertura = (m: Abertura, ctx: Ctx): LayoutPeito => {
  const largTexto = CW - 56 - 88;
  const enc = encaixar(m.texto, { largura: largTexto, max: 70, min: 46, linhas: 3, fonte: { peso: 700 } });
  const altTexto = alturaTexto(enc, 1.08);
  const campoH = Math.max(100, altTexto + 40);
  const h = 26 + 44 + 20 + campoH + 28;
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, ctx.palavras, inicio, m.ate, inicio + 0.1);
  const envia = Math.min(m.ate - 0.1, fimDigitado(m.texto, tempos) + 0.3);
  const dest = indicesDoTrecho(m.texto, m.destaque);
  const { nome, area } = ctx.plano.marca;
  // o nome (e a área, se couber) à direita da fila de peças
  const livreNome = CW - 4 * 56 - 30;
  const comArea = nome && area && larguraTexto(`${nome} · ${area}`, 34, { peso: 600 }) <= livreNome;
  const mostraNome = nome && larguraTexto(nome, 34, { peso: 700 }) <= livreNome;
  return {
    h,
    escala: escalaPara(h, ctx.livre),
    sons: [{ em: envia, arquivo: "sfx/envia.wav", volume: 0.28 }],
    desenhar: (t) => (
      <>
        <div style={{ position: "absolute", left: P, top: 28 }}>
          <FilaDePecas t={t} de={m.de} largura={4 * 56} altura={40} />
        </div>
        {mostraNome ? (
          <div
            style={{
              position: "absolute",
              right: P,
              top: 26,
              height: 44,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: sans,
              fontSize: 34,
              color: cor.tintaSuave,
              whiteSpace: "nowrap",
              opacity: prog(t, m.de + 0.2, 0.3),
            }}
          >
            <span style={{ fontWeight: 700, color: cor.tinta }}>{nome}</span>
            {comArea ? <span style={{ width: 7, height: 7, borderRadius: 4, background: cor.lapis }} /> : null}
            {comArea ? <span style={{ fontWeight: 500 }}>{area}</span> : null}
          </div>
        ) : null}
        <Campo x={P} y={90} w={CW} h={campoH} t={t} enviaEm={envia} ativoEm={tempos[0] ?? inicio}>
          <div style={{ position: "absolute", left: 28, top: 20 + (campoH - 40 - altTexto) / 2, width: largTexto }}>
            <TextoFalado
              linhas={enc.linhas}
              tempos={tempos}
              t={t}
              tamanho={enc.tamanho}
              modo="digita"
              entrelinha={1.08}
              cursor={{ cor: cor.tinta, ate: envia }}
              corDe={(i) => (dest.has(i) ? corDaPeca(0).escura : undefined)}
              estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.01em" }}
            />
          </div>
        </Campo>
      </>
    ),
  };
};

// ---------- pergunta: a pergunta digitada e as sugestões que acendem ----------
type Chip = { texto: string; em: number; w: number; tam: number; x: number; y: number };
const chipsDaPergunta = (m: Pergunta) => {
  const chips: Chip[] = [];
  let x = 0;
  let y = 0;
  for (const o of (m.opcoes ?? []).slice(0, 4)) {
    let tam = 40;
    while (tam > 34 && larguraTexto(o.texto, tam, { peso: 600 }) + 56 > CW) tam -= 2;
    const w = Math.min(CW, larguraTexto(o.texto, tam, { peso: 600 }) + 56);
    if (x > 0 && x + w > CW) {
      x = 0;
      y += 80;
    }
    chips.push({ texto: o.texto, em: o.em, w, tam, x, y });
    x += w + 14;
  }
  return { chips, h: chips.length ? y + 68 : 0 };
};

const layoutPergunta = (m: Pergunta, ctx: Ctx): LayoutPeito => {
  const largTexto = CW - 56 - 88;
  const enc = encaixar(m.texto, { largura: largTexto, max: 62, min: 44, linhas: 3, fonte: { peso: 600 } });
  const altTexto = alturaTexto(enc, 1.1);
  const campoH = Math.max(100, altTexto + 40);
  const { chips, h: chipsH } = chipsDaPergunta(m);
  // pouco lugar abaixo do queixo: o cabeçalho do assistente sai antes de o cartão encolher
  const comCabecalho = 76 + 22 + (chipsH ? chipsH + 22 : 0) + campoH + 28 <= ctx.livre;
  const yChips = comCabecalho ? 76 + 22 : 28;
  const yCampo = yChips + (chipsH ? chipsH + 22 : 0);
  const h = yCampo + campoH + 28;
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, ctx.palavras, inicio, m.ate, inicio + 0.1);
  // com sugestões, a mensagem só é enviada depois da última (a pessoa escolhe antes de enviar)
  const ultimaOpcao = chips.length ? chips[chips.length - 1].em + 0.7 : 0;
  const envia = Math.min(m.ate - 0.1, Math.max(fimDigitado(m.texto, tempos) + 0.3, ultimaOpcao));
  return {
    h,
    escala: escalaPara(h, ctx.livre),
    sons: [{ em: envia, arquivo: "sfx/envia.wav", volume: 0.26 }, ...chips.map((c, i) => ({ em: c.em, arquivo: `sfx/encaixe-${Math.min(i, 3) + 1}.wav`, volume: 0.3 }))],
    desenhar: (t) => {
      const comecou = t >= (tempos[0] ?? inicio) - 0.02;
      return (
        <>
          {comCabecalho ? <CabecalhoIA direita={<Icone nome="pergunta" tamanho={46} cor={corDaPeca(2).escura} espessura={3.8} />} /> : null}
          {chips.map((c, i) => {
            const cc = corDaPeca(i);
            const p = prog(t, c.em - 0.04, 0.3);
            return (
              <div key={`chip-${i}`} style={{ position: "absolute", left: P + c.x, top: yChips + c.y, width: c.w, height: 68 }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 34, border: `3px dashed ${cor.lapis}`, opacity: 1 - p }}>
                  <div style={{ position: "absolute", left: 26, top: 23, width: Math.max(40, (c.w - 52) * 0.6), height: 22, borderRadius: 11, background: cor.lapisClaro }} />
                </div>
                {p > 0 ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 34,
                      background: cc.clara,
                      color: cc.escura,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: sans,
                      fontWeight: 600,
                      fontSize: c.tam,
                      whiteSpace: "nowrap",
                      opacity: p,
                      scale: String(0.94 + 0.06 * p),
                      filter: p < 1 ? `blur(${(6 * (1 - p)).toFixed(2)}px)` : undefined,
                    }}
                  >
                    {c.texto}
                  </div>
                ) : null}
              </div>
            );
          })}
          <Campo x={P} y={yCampo} w={CW} h={campoH} t={t} enviaEm={envia} ativoEm={tempos[0] ?? inicio}>
            {comecou ? (
              <div style={{ position: "absolute", left: 28, top: 20 + (campoH - 40 - altTexto) / 2, width: largTexto }}>
                <TextoFalado
                  linhas={enc.linhas}
                  tempos={tempos}
                  t={t}
                  tamanho={enc.tamanho}
                  modo="digita"
                  entrelinha={1.1}
                  cursor={{ cor: cor.tinta, ate: envia }}
                  estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tinta }}
                />
              </div>
            ) : (
              <div style={{ position: "absolute", left: 28, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: sans, fontWeight: 500, fontSize: 44, color: cor.lapis, whiteSpace: "nowrap" }}>
                Pergunte qualquer coisa
              </div>
            )}
          </Campo>
        </>
      );
    },
  };
};

// ---------- número: o cartão do assistente com o número dentro de uma peça ----------
const textoDoNumero = (m: Numero, valor: number) => formatarNumero(valor, m.casas ?? 0);
const sufixoJunto = (s?: string) => !!s && /^[%°ºª]/.test(s);

const layoutNumero = (m: Numero, ctx: Ctx): LayoutPeito => {
  const encRot = encaixar(m.rotulo, { largura: CW, max: 46, min: 38, linhas: 2, fonte: { peso: 600 } });
  const altRot = alturaTexto(encRot, 1.12);
  const pecaH = 176;
  const comCabecalho = 76 + 18 + altRot + 18 + pecaH + 22 + 26 <= ctx.livre;
  const yRot = comCabecalho ? 76 + 18 : 28;
  const yPeca = yRot + altRot + 18;
  const h = yPeca + pecaH + 22 + 26;
  const c = corDaPeca(1);
  // o maior corpo em que o número final (com prefixo e sufixo) cabe na peça
  const final = textoDoNumero(m, m.valor);
  const unidades = (n: number) =>
    larguraPalavra(final, n, { mono: true }) +
    (m.prefixo ? larguraPalavra(m.prefixo, n * 0.5, { mono: true }) + n * 0.16 : 0) +
    (m.sufixo ? larguraPalavra(m.sufixo, n * 0.5, { mono: true }) + (sufixoJunto(m.sufixo) ? n * 0.04 : n * 0.16) : 0);
  let tam = 150;
  while (tam > 60 && unidades(tam) > CW - 72) tam -= 4;
  const temposRot = temposDoTexto(m.rotulo, ctx.palavras, m.rotuloEm ?? m.de, m.ate, m.rotuloEm ?? m.de + 0.15);
  const encaixe = m.em - 0.12 + 0.44;
  return {
    h,
    escala: escalaPara(h, ctx.livre),
    sons: [{ em: encaixe - 0.02, arquivo: "sfx/encaixe-2.wav", volume: 0.42 }],
    desenhar: (t) => {
      const q = prog(t, m.em, 0.9, chega);
      const atual = textoDoNumero(m, Math.round(m.valor * q * 10 ** (m.casas ?? 0)) / 10 ** (m.casas ?? 0));
      return (
        <>
          {comCabecalho ? <CabecalhoIA direita={m.ilustrativo ? <Etiqueta texto="ilustrativo" t={t} em={m.de + 0.2} /> : null} /> : null}
          {!comCabecalho && m.ilustrativo ? (
            <div style={{ position: "absolute", right: P + 24, top: yPeca + 20, zIndex: 2 }}>
              <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: 14 }}>
                <Etiqueta texto="ilustrativo" t={t} em={m.em + 0.3} />
              </div>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: P, top: yRot, width: CW }}>
            <TextoFalado
              linhas={encRot.linhas}
              tempos={temposRot}
              t={t}
              tamanho={encRot.tamanho}
              modo="foco"
              entrelinha={1.12}
              estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tintaSuave }}
            />
          </div>
          <PecaQueEncaixa r={{ x: P, y: yPeca, w: CW, h: pecaH }} t={t} em={m.em} c={c}>
            <div
              style={{
                position: "absolute",
                left: 36,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                gap: tam * 0.16,
                color: c.texto,
                fontFamily: mono,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {m.prefixo ? <span style={{ fontSize: tam * 0.5, fontWeight: 600, opacity: 0.85 }}>{m.prefixo}</span> : null}
              <span style={{ fontSize: tam, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                {atual}
                {m.sufixo && sufixoJunto(m.sufixo) ? <span style={{ fontSize: tam * 0.5, fontWeight: 600, marginLeft: tam * 0.04 }}>{m.sufixo}</span> : null}
              </span>
              {m.sufixo && !sufixoJunto(m.sufixo) ? <span style={{ fontSize: tam * 0.5, fontWeight: 600, opacity: 0.85 }}>{m.sufixo}</span> : null}
            </div>
          </PecaQueEncaixa>
        </>
      );
    },
  };
};

// ---------- destaque: a peça grande com o texto digitado ----------
const layoutDestaque = (m: Destaque, ctx: Ctx): LayoutPeito => {
  const enc = encaixar(m.texto, { largura: CW - 64, max: 70, min: 46, linhas: 3, fonte: { peso: 700 } });
  const altTexto = alturaTexto(enc, 1.06);
  const pecaH = 22 + 52 + 12 + altTexto + 30;
  const encDet = m.detalhe ? encaixar(m.detalhe, { largura: CW, max: 42, min: 36, linhas: 2, fonte: { peso: 500 } }) : null;
  const altDet = encDet ? alturaTexto(encDet, 1.15) : 0;
  const yPeca = 28;
  const yDet = yPeca + pecaH + 22 + 16;
  const h = encDet ? yDet + altDet + 28 : yPeca + pecaH + 22 + 26;
  const c = m.nivel === "alerta" ? corDaPeca(3) : corDaPeca(0);
  const tempos = temposDoTexto(m.texto, ctx.palavras, m.em, m.ate, m.em).map((x) => Math.max(x, m.em + 0.3));
  const fim = fimDigitado(m.texto, tempos);
  const temposDet = encDet ? temposDoTexto(m.detalhe!, ctx.palavras, m.detalheEm ?? fim, m.ate, m.detalheEm ?? fim + 0.2) : [];
  return {
    h,
    escala: escalaPara(h, ctx.livre),
    sons: [{ em: m.em - 0.12 + 0.42, arquivo: m.nivel === "alerta" ? "sfx/vago.wav" : "sfx/encaixe-3.wav", volume: 0.42 }],
    desenhar: (t) => (
      <>
        <PecaQueEncaixa r={{ x: P, y: yPeca, w: CW, h: pecaH }} t={t} em={m.em} c={c}>
          <div style={{ position: "absolute", left: 22, top: 22 }}>
            <LetreiroIcone icone={m.nivel === "alerta" ? "alerta" : "chave"} c={c} />
          </div>
          <div style={{ position: "absolute", left: 32, top: 22 + 52 + 12, width: CW - 64 }}>
            <TextoFalado
              linhas={enc.linhas}
              tempos={tempos}
              t={t}
              tamanho={enc.tamanho}
              modo="digita"
              entrelinha={1.06}
              cursor={{ cor: c.texto, ate: fim + 0.6 }}
              estilo={{ fontFamily: sans, fontWeight: 700, color: c.texto, letterSpacing: "-0.01em" }}
            />
          </div>
        </PecaQueEncaixa>
        {encDet ? (
          <div style={{ position: "absolute", left: P, top: yDet, width: CW }}>
            <TextoFalado
              linhas={encDet.linhas}
              tempos={temposDet}
              t={t}
              tamanho={encDet.tamanho}
              modo="foco"
              entrelinha={1.15}
              estilo={{ fontFamily: sans, fontWeight: 500, color: cor.tintaSuave }}
            />
          </div>
        ) : null}
      </>
    ),
  };
};

// ---------- definição: o termo num balão escuro, o significado entra em foco no balão do assistente ----------
const PontosDigitando: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", height: 52 }}>
    {[0, 1, 2].map((i) => {
      const fase = (t * 2.4 - i * 0.22) % 1;
      const a = 0.35 + 0.65 * Math.max(0, Math.sin(Math.max(0, fase) * Math.PI));
      return <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: cor.tintaSuave, opacity: a }} />;
    })}
  </div>
);

const larguraEncaixe = (e: Encaixe, fonte: { peso?: 500 | 600 | 700 }) => Math.max(0, ...e.linhas.map((l) => larguraLinha(l, e.tamanho, fonte)));

const layoutDefinicao = (m: Definicao, ctx: Ctx): LayoutPeito => {
  const enc1 = encaixar(m.termo, { largura: 560, max: 50, min: 40, linhas: 2, fonte: { peso: 600 } });
  const b1W = Math.min(CW - 60, larguraEncaixe(enc1, { peso: 600 }) + 64);
  const b1H = alturaTexto(enc1, 1.12) + 32;
  const larg2 = CW - 66 - 56;
  const enc2 = encaixar(m.significado, { largura: larg2, max: 50, min: 40, linhas: 3, fonte: { peso: 600 } });
  const b2W = Math.max(220, Math.min(CW - 66, larguraEncaixe(enc2, { peso: 600 }) + 56));
  const b2H = Math.max(84, alturaTexto(enc2, 1.12) + 32);
  const y1 = 26;
  const y2 = y1 + b1H + 20;
  const h = y2 + b2H + 28;
  const t1 = temposDoTexto(m.termo, ctx.palavras, m.em, m.significadoEm, m.em);
  const t2 = temposDoTexto(m.significado, ctx.palavras, m.significadoEm, m.ate, m.significadoEm);
  const fim1 = fimDigitado(m.termo, t1);
  const pontosDe = Math.min(m.significadoEm - 0.25, fim1 + 0.25);
  return {
    h,
    escala: escalaPara(h, ctx.livre),
    sons: [
      { em: fim1 + 0.15, arquivo: "sfx/envia.wav", volume: 0.24 },
      { em: m.significadoEm + 0.3, arquivo: "sfx/pronto.wav", volume: 0.24 },
    ],
    desenhar: (t) => {
      const p1 = prog(t, m.em - 0.05, 0.3);
      const p2 = prog(t, pontosDe, 0.3);
      return (
        <>
          <div
            style={{
              position: "absolute",
              right: P,
              top: y1,
              width: b1W,
              height: b1H,
              borderRadius: "32px 32px 10px 32px",
              background: cor.tinta,
              opacity: p1,
              translate: `0 ${(1 - p1) * 16}px`,
            }}
          >
            <div style={{ position: "absolute", left: 32, top: 16 }}>
              <TextoFalado
                linhas={enc1.linhas}
                tempos={t1}
                t={t}
                tamanho={enc1.tamanho}
                modo="digita"
                entrelinha={1.12}
                estilo={{ fontFamily: sans, fontWeight: 600, color: "#FFFFFF" }}
              />
            </div>
          </div>
          <div style={{ position: "absolute", left: P, top: y2, display: "flex", gap: 14, opacity: p2, translate: `0 ${(1 - p2) * 16}px` }}>
            <AvatarIA tamanho={52} />
            <div style={{ width: b2W, height: b2H, borderRadius: "10px 32px 32px 32px", background: cor.cartaoFundo, position: "relative" }}>
              {t < m.significadoEm - 0.02 ? (
                <div style={{ position: "absolute", left: 28, top: (b2H - 52) / 2 }}>
                  <PontosDigitando t={t} />
                </div>
              ) : (
                <div style={{ position: "absolute", left: 28, top: 16 }}>
                  <TextoFalado
                    linhas={enc2.linhas}
                    tempos={t2}
                    t={t}
                    tamanho={enc2.tamanho}
                    modo="foco"
                    entrelinha={1.12}
                    estilo={{ fontFamily: sans, fontWeight: 600, color: cor.tinta }}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      );
    },
  };
};

// ---------- frase: a nota fixada, palavras entrando em foco; o risco corta na fala ----------
const layoutFrase = (m: Frase, ctx: Ctx): LayoutPeito => {
  const enc = encaixar(m.texto, { largura: CW, max: 70, min: 46, linhas: 3, fonte: { peso: 700 } });
  const altTexto = alturaTexto(enc, 1.08);
  const yTexto = 26 + 52 + 18;
  const h = yTexto + altTexto + 30;
  const inicio = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, ctx.palavras, inicio, m.ate, inicio + 0.05);
  const dest = indicesDoTrecho(m.texto, m.destaque);
  const riscadas = indicesDoTrecho(m.texto, m.risco);
  const riscoEm = m.riscoEm ?? (riscadas.size ? tempos[Math.max(...riscadas)] + 0.2 : undefined);
  const c = corDaPeca(2);
  return {
    h,
    escala: escalaPara(h, ctx.livre),
    sons: riscoEm !== undefined && riscadas.size ? [{ em: riscoEm, arquivo: "sfx/vago.wav", volume: 0.36 }] : [{ em: inicio + 0.12, arquivo: "sfx/encaixe-1.wav", volume: 0.3 }],
    desenhar: (t) => {
      const p = prog(t, m.de + 0.05, 0.3);
      return (
        <>
          <FormaDaPeca r={{ x: P - (1 - p) * 40, y: 26, w: 104, h: 52 }} preenchimento={c.forte} lateral raio={16} encaixe={false} opacidade={p}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icone nome="balao" tamanho={36} cor={c.texto} espessura={4} />
            </div>
          </FormaDaPeca>
          <div style={{ position: "absolute", left: P + 132, top: 26, height: 52, right: P, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ height: 3, flex: 1, borderRadius: 2, background: cor.linha, scale: `${prog(t, m.de + 0.15, 0.5)} 1`, transformOrigin: "left center" }} />
          </div>
          <div style={{ position: "absolute", left: P, top: yTexto, width: CW }}>
            <TextoFalado
              linhas={enc.linhas}
              tempos={tempos}
              t={t}
              tamanho={enc.tamanho}
              modo="foco"
              entrelinha={1.08}
              corDe={(i) => (dest.has(i) ? corDaPeca(0).escura : undefined)}
              riscadas={riscadas}
              riscoEm={riscoEm}
              corRisco={corDaPeca(3).forte}
              estilo={{ fontFamily: sans, fontWeight: 700, color: cor.tinta, letterSpacing: "-0.012em" }}
            />
          </div>
        </>
      );
    },
  };
};

// ---------- cta ----------
const layoutDoCta = (m: Extract<Momento, { tipo: "cta" }>, ctx: Ctx): LayoutPeito => {
  const L = layoutCta(m, ctx.plano, ctx.montagem, ctx.livre);
  const tc = temposDoCta(m, ctx.palavras);
  const antigo = !m.icone && (m.titulo !== undefined || m.salvarEm !== undefined || m.testarEm !== undefined || m.acao !== undefined);
  return {
    h: L.h,
    escala: escalaPara(L.h, ctx.livre),
    sons: antigo
      ? [
          { em: tc.salvar, arquivo: "sfx/salva.wav", volume: 0.32 },
          { em: tc.testar, arquivo: "sfx/testa.wav", volume: 0.3 },
        ]
      : [{ em: tc.toque, arquivo: "sfx/salva.wav", volume: 0.32 }],
    desenhar: (t) => <ConteudoCta m={m} t={t} plano={ctx.plano} palavras={ctx.palavras} montagem={ctx.montagem} livre={ctx.livre} />,
  };
};

export const layoutDoPeito = (m: Momento, ctx: Ctx): LayoutPeito | null => {
  switch (m.tipo) {
    case "abertura":
      return layoutAbertura(m, ctx);
    case "pergunta":
      return layoutPergunta(m, ctx);
    case "numero":
      return layoutNumero(m, ctx);
    case "destaque":
      return layoutDestaque(m, ctx);
    case "definicao":
      return layoutDefinicao(m, ctx);
    case "frase":
      return layoutFrase(m, ctx);
    case "cta":
      return layoutDoCta(m, ctx);
    default:
      return null;
  }
};

// ---------- o cartão ----------
// `alturaAntes`: altura do cartão encostado antes (o cartão fica e muda de altura);
// `emendaDepois`: o próximo cartão é encostado (este some de uma vez no fim, sem descer).
export const CartaoPeito: React.FC<{
  m: Momento;
  L: LayoutPeito;
  t: number;
  fim: number;
  alturaAntes: number | null;
  emendaDepois: boolean;
  // a pessoa está voltando de uma janela: o cartão espera ela cobrir a bancada antes de subir
  depoisDaBancada?: boolean;
}> = ({ m, L, t, fim, alturaAntes, emendaDepois, depoisDaBancada }) => {
  const hFinal = L.h * L.escala;
  const morph = alturaAntes !== null ? prog(t, m.de, 0.3, desliza) : 1;
  const h = alturaAntes !== null ? mistura(alturaAntes, hFinal, morph) : hFinal;
  const entra = alturaAntes !== null ? 1 : prog(t, m.de + (depoisDaBancada ? 0.3 : 0.1), 0.36);
  const sai = emendaDepois ? 0 : prog(t, fim, 0.3, (x) => x * x * x);
  const conteudo = (alturaAntes !== null ? prog(t, m.de + 0.04, 0.18) : 1) * (emendaDepois ? 1 - prog(t, fim - 0.1, 0.1) : 1);
  const y = CARTAO_PEITO.base - h;
  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO_PEITO.x,
        top: y,
        width: CARTAO_PEITO.w,
        height: h,
        borderRadius: 38,
        background: cor.cartao,
        boxShadow: sombra(1.1),
        overflow: "hidden",
        opacity: Math.min(1, entra * 5),
        translate: `0 ${(1 - entra) * (h + 82) + sai * (1920 - y + 60)}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (CARTAO_PEITO.w - CARTAO_PEITO.w * L.escala) / 2,
          top: h - hFinal,
          width: CARTAO_PEITO.w,
          height: L.h,
          scale: String(L.escala),
          transformOrigin: "0 0",
          opacity: conteudo,
        }}
      >
        {L.desenhar(t)}
      </div>
    </div>
  );
};
