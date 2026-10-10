// O que aparece por cima da pessoa em quadro cheio: a pílula do topo (contato, passo ou assinatura),
// UMA mensagem na altura do peito (com "digitando…") e o fechamento com o botão que é tocado.
// No quadro deitado (16:9) a mensagem fica numa coluna livre ao lado do rosto (src/peito.ts): as
// suas à direita da pessoa, as do outro lado à esquerda, centradas na linha do queixo.
// Os blocos de quadro cheio (abertura, numero, destaque, frase, pergunta) são todos mensagens suas que
// chegam no peito: muda a forma do balão, não o gesto.
import { Digitado, mistura, prog, rola, saindo, temposDoTexto } from "../anim";
import { acaoDoCta, type BalaoInterno, type Msg } from "../blocos";
import { DIGITANDO_PADRAO, medidas, type Medida } from "../fio";
import type { Abertura, Cta, Destaque, Fixada, Frase, Numero, Palavra, Pergunta, Plano } from "../plano";
import { type Lado, ladoDoBalao, topoNoLado } from "../peito";
import { ajustarTexto, cor, fonte, MARGEM, PILULA, quebrarEquilibrado, sombra, T, W } from "../tema";
import { Balao, BalaoDigitando, Reacao } from "./Balao";
import { Icone } from "./Icones";
import { Avatar } from "./TelaApp";

const fundoPilula = "rgba(14,17,22,0.9)";

// os balões do quadro cheio só aparecem com a pessoa (quase) inteira na tela
export const visivelCheia = (abertura: number) => Math.min(1, Math.max(0, (abertura - 0.72) / 0.28));

// ---------- pílula do topo ----------

const PilulaBase: React.FC<{ p: number; children: React.ReactNode; altura?: number }> = ({ p, children, altura = PILULA.altura }) => (
  <div style={{ position: "absolute", left: 0, top: PILULA.topo, width: W, display: "flex", justifyContent: "center", opacity: p, translate: `0 ${(1 - p) * -24}px` }}>
    <div
      style={{
        minHeight: altura,
        maxWidth: W - 2 * MARGEM,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "12px 34px 12px 14px",
        borderRadius: 60,
        background: fundoPilula,
        boxShadow: sombra,
        fontFamily: fonte,
      }}
    >
      {children}
    </div>
  </div>
);

export const PilulaContato: React.FC<{ nome: string; online: boolean; p: number; statusTexto: string }> = ({ nome, online, p, statusTexto }) => (
  <PilulaBase p={p}>
    <Avatar tamanho={80} online={online} />
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: T.pilula, fontWeight: 700, color: cor.porcelana, lineHeight: 1.05 }}>{nome}</div>
      <div style={{ fontSize: T.pilulaApoio, fontWeight: 500, color: online ? cor.acento : cor.porcelanaApagada, lineHeight: 1.05 }}>{statusTexto}</div>
    </div>
  </PilulaBase>
);

export const PilulaPasso: React.FC<{ f: Fixada; p: number; t: number; palavras: Palavra[]; de: number; ate: number }> = ({ f, p, t, palavras, de, ate }) => {
  const errado = f.tom === "errado";
  // no quadro deitado a pílula não passa de ~1500 (uma linha de leitura, centrada no topo)
  const linhas = quebrarEquilibrado(f.texto, Math.min(W - 2 * MARGEM, 1500) - 70 - (f.rotulo ? 170 : 0), T.pilula, 600, 2);
  const tempos = temposDoTexto(f.texto, palavras, de, ate, de + 0.2);
  return (
    <PilulaBase p={p}>
      {f.rotulo ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 74,
            padding: "0 24px",
            borderRadius: 40,
            background: errado ? cor.frio : cor.acento,
            color: errado ? cor.porcelana : cor.tinta,
            fontSize: 40,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {errado ? <Icone nome="x" tamanho={28} cor={cor.porcelana} traco={4.5} /> : null}
          {f.rotulo}
        </div>
      ) : (
        <div style={{ width: 10 }} />
      )}
      <Digitado linhas={linhas} tempos={tempos} t={t} rascunho style={{ fontSize: T.pilula, fontWeight: 600, color: cor.porcelana, lineHeight: 1.14 }} />
    </PilulaBase>
  );
};

// ---------- a mensagem no peito ----------

// A moldura comum: o balão entra com "digitando…", vira a mensagem e sai antes de a pessoa encolher.
// `lado` é a coluna ao lado do rosto; `topo`, onde o bloco começa nela.
const NoPeito: React.FC<{
  msg: Msg;
  med: Medida;
  dig: Medida;
  t: number;
  plano: Plano;
  lado: Lado;
  topo: number;
  // quando o balão aparece (com os pontinhos) e quando a mensagem fica pronta
  inicio: number;
  prontaEm: number;
  ate: number;
  abertura: number;
  falado?: { de: number; ate: number; inicio?: number; rascunho?: boolean };
  // apaga um pouco no fim (o contato ficou offline)
  some?: number;
  // o que vai embaixo do balão (respostas rápidas)
  embaixo?: React.ReactNode;
  // texto que se escreve na fala: enquanto o balão alarga, o começo do texto fica à vista
  // (o balão cresce para o lado de dentro e o texto vai junto, sem cortar a primeira palavra)
  textoPeloInicio?: boolean;
}> = ({ msg, med, dig, t, plano, lado, topo, inicio, prontaEm, ate, abertura, falado, some = 0, embaixo, textoPeloInicio }) => {
  const eu = msg.de === "eu";
  const aDireita = lado.alinhar === "direita";
  const capa = inicio <= 0.05;
  const entrada = capa ? 1 : prog(t, inicio, 0.38);
  const pronta = prontaEm <= inicio ? 1 : prog(t, prontaEm, 0.32, rola);
  const sai = saindo(t, ate, 0.3);
  const alt = mistura(dig.h, med.h, pronta);
  const larg = mistura(dig.w, med.w, Math.min(1, pronta * (textoPeloInicio ? 2.4 : 1.6)));
  const hora = msg.hora ?? plano.contato?.hora ?? "14:02";
  const ladoDoTexto = textoPeloInicio ? "left" : eu ? "right" : "left";
  // ao encolher, a pessoa passa por trás da faixa do peito: o balão sai antes (sobe e some) para nunca cobrir o rosto
  const opacidade = entrada * (1 - sai) * visivelCheia(abertura) * (1 - 0.45 * some);
  if (opacidade <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: topo,
        left: aDireita ? undefined : lado.x,
        right: aDireita ? W - lado.x - lado.w : undefined,
        width: Math.max(larg, med.w),
        opacity: opacidade,
        translate: `0 ${(1 - entrada) * 40 - some * 18 - (1 - visivelCheia(abertura)) * 30}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: aDireita ? "flex-end" : "flex-start",
      }}
    >
      <div style={{ position: "relative", width: larg, height: alt }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: med.corpo * 0.62, boxShadow: sombra }}>
          {pronta < 1 ? (
            <div style={{ position: "absolute", top: 0, [eu ? "right" : "left"]: 0 }}>
              <BalaoDigitando de={msg.de} med={dig} t={t} opacidade={1 - pronta} />
            </div>
          ) : null}
          {pronta > 0 ? (
            <div style={{ position: "absolute", top: 0, [ladoDoTexto]: 0, opacity: pronta < 1 ? Math.min(1, pronta * 1.5) : undefined }}>
              <Balao m={msg} med={med} t={t} hora={hora} palavras={plano.palavras} falado={falado} />
            </div>
          ) : null}
        </div>
        {msg.reacao ? (
          <div style={{ position: "absolute", bottom: -42, [eu ? "left" : "right"]: -16 }}>
            <Reacao m={msg} t={t} tamanho={100} />
          </div>
        ) : null}
      </div>
      {embaixo}
    </div>
  );
};

// O balão da assinatura (o antigo destaque): UMA mensagem de qualquer lado no peito
export const MensagemNoPeito: React.FC<{
  m: BalaoInterno;
  t: number;
  plano: Plano;
  // 0→1: o quadro cheio está aberto (some antes de a pessoa encolher)
  abertura: number;
}> = ({ m, t, plano, abertura }) => {
  const msg = m.mensagem;
  const lado = ladoDoBalao(plano, msg.de, m.de, m.ate, !!m.legenda);
  // o cartão de produto é alto: um corpo menor; e o corpo diminui até o balão caber na coluna
  const maximo = msg.tipo === "cartao" || msg.tipo === "preco" ? T.cartaoCheio : T.balaoCheio;
  const disponivel = lado.fim - lado.topoMin;
  let corpo: number = maximo;
  let med = medidas(msg, corpo, lado.w);
  while (corpo > 40 && (med.h > disponivel || med.linhas.length > 3)) {
    corpo -= 2;
    med = medidas(msg, corpo, lado.w);
  }
  const dig = medidas({ ...msg, tipo: "digitando" }, corpo);
  const temDigitando = (msg.digitando ?? DIGITANDO_PADRAO) > 0;
  // no primeiro momento do vídeo o balão já está na tela no primeiro quadro (a capa do post)
  const abre = m.de < 0.1;
  const inicio = abre ? 0 : Math.max(m.de + 0.25, temDigitando ? msg.em - (msg.digitando ?? DIGITANDO_PADRAO) : msg.em);
  const some = m.offlineEm !== undefined ? prog(t, m.offlineEm + 0.15, 0.6) : 0;
  return (
    <NoPeito
      msg={msg}
      med={med}
      dig={dig}
      t={t}
      plano={plano}
      lado={lado}
      topo={topoNoLado(lado, med.h)}
      inicio={inicio}
      prontaEm={temDigitando ? msg.em : inicio}
      ate={m.ate}
      abertura={abertura}
      some={some}
    />
  );
};

// ---------- os blocos universais de quadro cheio ----------

type Universal = Abertura | Numero | Destaque | Frase | Pergunta;

// Respostas rápidas (os botões do app embaixo da pergunta), cada uma na sua palavra
const RESPOSTA = { altura: 84, gap: 14 };
const respostasGeo = (opcoes: { texto: string }[], corpo: number, largura: number) => {
  const linhas = opcoes.map((o) => ajustarTexto(o.texto, largura - 2 * 34 - 50, corpo, 38, 600, 1));
  const c = Math.min(...linhas.map((l) => l.corpo));
  return { corpo: c, altura: opcoes.length ? 22 + opcoes.length * RESPOSTA.altura + (opcoes.length - 1) * RESPOSTA.gap : 0 };
};

const Respostas: React.FC<{ opcoes: { texto: string; em: number }[]; corpo: number; t: number }> = ({ opcoes, corpo, t }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: RESPOSTA.gap, marginTop: 22 }}>
    {opcoes.map((o, i) => {
      const p = prog(t, o.em - 0.12, 0.35);
      return (
        <div
          key={i}
          style={{
            height: RESPOSTA.altura,
            boxSizing: "border-box",
            padding: "0 34px 0 22px",
            borderRadius: RESPOSTA.altura,
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: p > 0 ? fundoPilula : "rgba(14,17,22,0.45)",
            border: `3px ${p > 0 ? "solid" : "dashed"} ${p > 0 ? cor.acento : "rgba(242,238,231,0.3)"}`,
            boxShadow: p > 0 ? sombra : undefined,
            fontFamily: fonte,
            fontSize: corpo,
            fontWeight: 600,
            color: cor.porcelana,
            whiteSpace: "nowrap",
            opacity: 0.35 + 0.65 * p,
            translate: p < 1 ? `0 ${(1 - p) * 14}px` : undefined,
          }}
        >
          <Icone nome="responder" tamanho={34} cor={p > 0 ? cor.acento : cor.porcelanaApagada} traco={5} />
          {o.texto}
        </div>
      );
    })}
  </div>
);

// A mensagem de cada bloco: texto, corpo e peso; o corpo diminui até o bloco caber no peito
const mensagemDoBloco = (m: Universal, corpo: number): Msg => {
  switch (m.tipo) {
    case "abertura":
      return { de: "eu", em: m.em ?? m.de, texto: m.texto, trava: m.destaque, corpo, peso: 700, digitando: 0 };
    case "frase":
      return { de: "eu", em: m.em ?? m.de, texto: m.texto, trava: m.destaque, risco: m.risco, riscoEm: m.riscoEm, corpo, digitando: 0 };
    case "pergunta":
      return { de: "eu", em: m.em ?? m.de, texto: m.texto, corpo, peso: 600, digitando: 0 };
    case "destaque":
      return {
        de: "eu",
        em: m.em,
        texto: m.texto,
        corpo,
        peso: 800,
        alerta: m.nivel === "alerta",
        detalhe: m.detalhe,
        detalheEm: m.detalheEm,
      };
    case "numero":
      return { de: "eu", tipo: "numero", em: m.em, numero: m, corpo };
  }
};

const CORPOS: Record<Universal["tipo"], [number, number]> = {
  abertura: [80, 58],
  frase: [74, 54],
  pergunta: [70, 52],
  destaque: [96, 60],
  numero: [72, 56],
};

export const BlocoNoPeito: React.FC<{ m: Universal; t: number; plano: Plano; abertura: number }> = ({ m, t, plano, abertura }) => {
  // os blocos universais são mensagens suas: a coluna à direita da pessoa (ou a mais larga)
  const lado = ladoDoBalao(plano, "eu", m.de, m.ate, !!m.legenda);
  const disponivel = lado.fim - lado.topoMin;
  const larguraMax = lado.w;
  const opcoes = m.tipo === "pergunta" ? (m.opcoes ?? []) : [];
  // o maior corpo em que o balão (e as respostas) cabem no peito, em até 3 linhas
  const [maximo, minimo] = CORPOS[m.tipo];
  let msg = mensagemDoBloco(m, maximo);
  let med = medidas(msg, maximo, larguraMax);
  let resp = respostasGeo(opcoes, 46, larguraMax);
  for (let c = maximo; c >= minimo; c -= 2) {
    msg = mensagemDoBloco(m, c);
    med = medidas(msg, c, larguraMax);
    resp = respostasGeo(opcoes, Math.max(44, Math.round(c * 0.7)), larguraMax);
    if (med.h + resp.altura <= disponivel && med.linhas.length <= 3) break;
  }
  const topo = topoNoLado(lado, med.h + resp.altura);
  const dig = medidas({ de: "eu", em: msg.em, tipo: "digitando" }, Math.min(72, med.corpo));
  // texto falado: o balão aparece com os pontinhos e se escreve na fala; o resto chega pronto no `em`
  const falado = m.tipo === "abertura" || m.tipo === "frase" || m.tipo === "pergunta";
  const em = msg.em;
  const capa = m.de < 0.1;
  const tempos = falado ? temposDoTexto(msg.texto ?? "", plano.palavras, m.de, m.ate, em) : [];
  const primeira = tempos[0] ?? em;
  // o número pode chegar antes, no rótulo dito ("O Bitcoin rompeu…"), com os pontinhos no lugar do valor
  const chegada = m.tipo === "numero" && m.rotuloEm !== undefined ? Math.min(m.rotuloEm, em) : Math.min(primeira, em);
  const inicio = capa ? 0 : Math.max(m.de + 0.2, chegada - 0.45);
  // a abertura já nasce com o título apagado (a capa do post) e acende palavra por palavra
  const rascunho = m.tipo === "abertura";
  // o número já chega com o rótulo e os pontinhos no lugar do valor (que conta quando é dito)
  const prontaEm =
    rascunho || m.tipo === "numero" ? inicio + (capa ? 0 : 0.3) : falado ? Math.max(inicio + 0.2, primeira - 0.12) : Math.max(inicio + 0.25, em - 0.05);
  return (
    <NoPeito
      msg={msg}
      med={med}
      dig={dig}
      t={t}
      plano={plano}
      lado={lado}
      topo={topo}
      inicio={inicio}
      prontaEm={prontaEm}
      ate={m.ate}
      abertura={abertura}
      falado={falado ? { de: m.de, ate: m.ate, inicio: em, rascunho } : undefined}
      embaixo={opcoes.length ? <Respostas opcoes={opcoes} corpo={resp.corpo} t={t} /> : undefined}
      textoPeloInicio={falado}
    />
  );
};

// ---------- fechamento ----------

const ACOES = {
  salvar: { antes: "Salvar", depois: "Salvo", icone: "marcador" },
  seguir: { antes: "Seguir", depois: "Seguindo", icone: "seguir" },
  comentar: { antes: "Comentar", depois: "Comentado", icone: "comentar" },
  compartilhar: { antes: "Enviar", depois: "Enviado", icone: "compartilhar" },
  // o link não "vira" outra palavra: o botão é tocado e fica aceso
  link: { antes: "Saiba mais", depois: "Saiba mais", icone: "link" },
} as const;

export const CtaCheia: React.FC<{ m: Cta; t: number; plano: Plano; abertura: number }> = ({ m, t, plano, abertura }) => {
  // a chamada é sua: a coluna à direita da pessoa (ou a mais larga)
  const lado = ladoDoBalao(plano, "eu", m.de, m.ate, !!m.legenda);
  const larguraMax = lado.w;
  const disponivel = lado.fim - lado.topoMin;
  // o balão + o botão cabem na coluna: o corpo diminui se a chamada for longa
  let corpo: number = T.balaoCheio;
  const base: Msg = { de: "eu", em: (m.em ?? m.de) + 0.35, texto: m.texto, reacao: m.reacao, trava: m.destaque };
  let med = medidas(base, corpo, larguraMax);
  while (corpo > 46 && (med.linhas.length > 3 || med.h + 34 + 112 > disponivel)) {
    corpo -= 2;
    med = medidas(base, corpo, larguraMax);
  }
  const topo = topoNoLado(lado, med.h + 34 + 112);
  const direita = W - lado.x - lado.w;
  const msg = base;
  const dig = medidas({ ...msg, tipo: "digitando" }, corpo);
  const tempos = temposDoTexto(m.texto, plano.palavras, m.de, m.ate, (m.em ?? m.de) + 0.3);
  // o balão aparece "digitando…" e se escreve palavra por palavra na fala
  const entrada = prog(t, m.de + 0.15, 0.36);
  const pronta = prog(t, Math.max(m.de + 0.3, (tempos[0] ?? m.de + 0.4) - 0.12), 0.3, rola);
  const acao = ACOES[acaoDoCta(m)] ?? ACOES.salvar;
  const toque = m.toqueEm ?? tempos[0] ?? m.de + (m.ate - m.de) * 0.4;
  const pBotao = prog(t, m.de + 0.35, 0.4);
  const pToque = prog(t, toque, 0.28);
  const aperto = t >= toque && t < toque + 0.22 ? 0.94 : 1;
  const hora = plano.contato?.hora ?? "14:02";
  const alt = mistura(dig.h, med.h, pronta);
  const larg = mistura(dig.w, med.w, Math.min(1, pronta * 1.6));
  const vis = visivelCheia(abertura);
  return (
    <>
      <div style={{ position: "absolute", top: topo, right: direita, width: larg, height: alt, opacity: entrada * vis, translate: `0 ${(1 - entrada) * 40}px` }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: corpo * 0.62, boxShadow: sombra }}>
          {pronta < 1 ? (
            <div style={{ position: "absolute", top: 0, right: 0 }}>
              <BalaoDigitando de="eu" med={dig} t={t} opacidade={1 - pronta} />
            </div>
          ) : null}
          {pronta > 0 ? (
            <div style={{ position: "absolute", top: 0, right: 0, opacity: Math.min(1, pronta * 1.5) }}>
              <Balao m={msg} med={med} t={t} hora={hora} palavras={plano.palavras} falado={{ de: m.de, ate: m.ate, inicio: (m.em ?? m.de) + 0.35 }} />
            </div>
          ) : null}
        </div>
        {m.reacao ? (
          <div style={{ position: "absolute", bottom: -40, left: -18 }}>
            <Reacao m={msg} t={t} tamanho={100} />
          </div>
        ) : null}
      </div>
      {/* o botão do app, tocado na palavra */}
      <div
        style={{
          position: "absolute",
          top: topo + med.h + 34,
          right: direita,
          display: "flex",
          alignItems: "center",
          gap: 18,
          height: 112,
          padding: "0 40px 0 32px",
          borderRadius: 60,
          background: pToque > 0.5 ? cor.acento : "rgba(14,17,22,0.9)",
          border: `3px solid ${pToque > 0.5 ? cor.acento : "rgba(242,238,231,0.5)"}`,
          boxShadow: sombra,
          fontFamily: fonte,
          fontWeight: 700,
          fontSize: 54,
          color: pToque > 0.5 ? cor.tinta : cor.porcelana,
          opacity: pBotao * vis,
          translate: `0 ${(1 - pBotao) * 30}px`,
          scale: String(aperto),
        }}
      >
        <Icone
          nome={acao.icone}
          tamanho={58}
          cor={pToque > 0.5 ? cor.tinta : cor.porcelana}
          preenchido={pToque > 0.5 && acao.icone === "marcador" ? cor.tinta : undefined}
          traco={4.5}
        />
        <span>{pToque > 0.5 ? acao.depois : acao.antes}</span>
      </div>
    </>
  );
};

export const PilulaAssinatura: React.FC<{ nome: string; area: string; p: number }> = ({ nome, area, p }) => {
  if (!nome) return null;
  return (
    <PilulaBase p={p}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 80,
          background: cor.acento,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 40,
          color: cor.tinta,
          flexShrink: 0,
        }}
      >
        {nome.trim().charAt(0).toUpperCase()}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: T.pilula, fontWeight: 700, color: cor.porcelana, lineHeight: 1.05 }}>{nome}</div>
        {area ? <div style={{ fontSize: T.pilulaApoio, fontWeight: 500, color: cor.porcelanaSuave, lineHeight: 1.05 }}>{area}</div> : null}
      </div>
    </PilulaBase>
  );
};
