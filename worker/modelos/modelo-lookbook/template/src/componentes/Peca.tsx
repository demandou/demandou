// Página de catálogo (a assinatura do modelo). A foto da pessoa já está no lugar (Edicao.tsx);
// aqui entram, por cima: o numeral e o nome na coluna de papel, o cartão (ficha) que desliza ao
// lado com o que foi dito do item e, quando o item é algo que a pessoa veste, a chamada (pino +
// linha) apontando a peça no corpo, a medida de alfaiate e o recorte de detalhe. Serve para
// qualquer item numerado: uma peça, um motivo, um erro, um produto, um hábito.
import { prog, saida, Sobe } from "../anim";
import type { Peca, Plano } from "../plano";
import { dentroDaFoto, FOTO, ladoDaPagina, naTela, resolverPonto, type Foto, type LayoutPessoa } from "../pessoa";
import { encaixar, largura, quebrar } from "../medida";
import { BASE_CARTAO, caber, cor, corDe, MARGEM, MARGEM_DIREITA, rotulo, serifa } from "../tema";
import { Chamada } from "./Chamada";
import { Detalhe } from "./Detalhe";
import { Amostra } from "./Amostra";
import { alturaDaFicha, Ficha, NOME_TECIDO, temConteudo } from "./Ficha";

const LARGURA_CARTAO = 470;
const LARGURA_NOME = 560;
const PAD_NOME = 40;

// Cartão com o nome do item (para itens sem ficha): o nome em tinta e o complemento em itálico
// grafite, cada um a lápis até ser dito.
const medirCartaoDoNome = (m: Peca) => {
  const tw = LARGURA_NOME - PAD_NOME * 2;
  const nome = encaixar(m.nome, { largura: tw, max: 92, min: 56, linhas: 2, estilo: "serifa", entrelinha: 1.06 });
  const comp = m.complemento ? encaixar(m.complemento, { largura: tw, max: Math.min(80, nome.tamanho), min: 50, linhas: 3, estilo: "italico", entrelinha: 1.08 }) : null;
  return { nome, comp, altura: PAD_NOME * 2 + nome.altura + (comp ? 8 + comp.altura : 0) + 6 };
};
const CartaoDoNome: React.FC<{ m: Peca; t: number; x: number; y: number; w: number; lado: -1 | 1; fora: number; medida: ReturnType<typeof medirCartaoDoNome> }> = ({ m, t, x, y, w, lado, fora, medida }) => {
  const entra = prog(t, m.de + 0.28, 0.6);
  const pn = prog(t, m.nomeEm - 0.04, 0.42);
  const pc = prog(t, (m.complementoEm ?? m.nomeEm + 0.25) - 0.04, 0.42);
  const { nome, comp } = medida;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: medida.altura,
        padding: PAD_NOME,
        boxSizing: "border-box",
        background: cor.folha,
        boxShadow: "0 22px 48px rgba(30,24,16,0.20), 0 2px 6px rgba(30,24,16,0.10)",
        opacity: Math.min(1, entra * 1.6) * (1 - fora),
        translate: `${lado * ((1 - entra) * 90 + fora * 60)}px 0`,
      }}
    >
      <div style={{ position: "relative", fontFamily: serifa, fontSize: nome.tamanho, lineHeight: 1.06, color: cor.tinta, whiteSpace: "nowrap" }}>
        <div style={{ position: "absolute", left: 0, top: nome.tamanho * 0.62, width: (w - PAD_NOME * 2) * 0.6, borderTop: `3px dashed ${cor.lapis}`, opacity: 1 - prog(pn, 0, 0.4) }} />
        {nome.linhas.map((l, i) => (
          <Sobe key={i} p={pn}>
            {l}
          </Sobe>
        ))}
      </div>
      {comp ? (
        <div style={{ position: "relative", marginTop: 8, fontFamily: serifa, fontStyle: "italic", fontSize: comp.tamanho, lineHeight: 1.08, color: cor.grafite, whiteSpace: "nowrap" }}>
          <div style={{ position: "absolute", left: 0, top: comp.tamanho * 0.62, width: (w - PAD_NOME * 2) * 0.5, borderTop: `3px dashed ${cor.lapisClaro}`, opacity: 1 - prog(pc, 0, 0.4) }} />
          {comp.linhas.map((l, i) => (
            <Sobe key={i} p={pc}>
              {l}
            </Sobe>
          ))}
        </div>
      ) : null}
    </div>
  );
};

type Pt = { x: number; y: number };

// Linha de medida de alfaiate: cresce de um ponto ao outro, com tracinhos nas pontas
const LinhaDeMedida: React.FC<{ a: Pt; b: Pt; p: number; fora: number }> = ({ a, b, p, fora }) => {
  if (p <= 0) return null;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const nx = -Math.sin(ang) * 18;
  const ny = Math.cos(ang) * 18;
  const fim = { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
  const ponta = prog(p, 0.8, 0.2);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - fora }}>
      {/* traço claro por baixo: a linha continua visível sobre roupa escura */}
      <g stroke={cor.folha} strokeWidth={7} strokeLinecap="round" opacity={0.75}>
        <line x1={a.x} y1={a.y} x2={fim.x} y2={fim.y} />
      </g>
      <g stroke={cor.tinta} strokeWidth={3} strokeLinecap="round">
        <line x1={a.x} y1={a.y} x2={fim.x} y2={fim.y} />
        <line x1={a.x - nx} y1={a.y - ny} x2={a.x + nx} y2={a.y + ny} />
        <line x1={b.x - nx} y1={b.y - ny} x2={b.x + nx} y2={b.y + ny} opacity={ponta} />
      </g>
    </svg>
  );
};

export const PaginaDaPeca: React.FC<{
  m: Peca;
  t: number;
  plano: Plano;
  foto: Foto;
  layout: LayoutPessoa;
  // quando o momento começa a sair (o próximo já está entrando)
  fim: number;
  total: number;
  id: string;
  // "papel": o que fica no papel (embaixo da foto: ela cobre como cortina nas trocas);
  // "sobre": o que avança sobre a foto (cartão, pino, linhas)
  camada: "papel" | "sobre";
}> = ({ m, t, plano, foto, layout, fim, total, id, camada }) => {
  const fora = saida(t, fim);
  const caixa = foto.caixa;
  const lateral = layout === "direita" || layout === "esquerda";
  // lado do papel onde ficam numeral, nome e cartão (-1 = esquerda da tela, 1 = direita)
  const lado: -1 | 1 = layout === "esquerda" ? 1 : -1;
  const numero = m.numero ? String(m.numero).padStart(2, "0") : "";

  // coluna de papel ao lado da foto (nas páginas laterais)
  const colX = lado === -1 ? MARGEM : 1080 - MARGEM;
  const colLargura = 280;
  const alinha = lado === -1 ? "left" : "right";

  // pontos na tela
  const pino = naTela(resolverPonto(m.ponto, plano), caixa, plano, t);
  // sem `ponto`, sem pino (o item não é algo que a pessoa veste)
  const pinoVisivel = m.ponto !== undefined && dentroDaFoto(pino, caixa, 30);

  // cartão
  const comDetalheAoLado = layout === "topo" && !!m.detalhe;
  const comNomeNoCartao = !lateral;
  const comAmostraNoCartao = !(layout === "topo" && !m.detalhe);
  const cartaoW = layout === "topo" ? 408 : LARGURA_CARTAO;
  // do lado direito, o cartão fica a 120 px da borda (botões do aplicativo)
  const cartaoX = layout === "topo" ? 1080 - MARGEM_DIREITA - cartaoW : lado === -1 ? MARGEM : 1080 - MARGEM_DIREITA - cartaoW;
  const cartaoH = alturaDaFicha(m, comAmostraNoCartao, comNomeNoCartao, cartaoW);
  const temFicha = temConteudo(m) || comNomeNoCartao;
  // páginas laterais: o cartão assenta na base (1572 px), sem subir acima dos ombros nem do queixo
  const topoMinimo = lateral ? ladoDaPagina(layout, plano).cartao.y : 1000;
  const cartaoY = layout === "topo" ? FOTO.topo(plano).caixa.y + FOTO.topo(plano).caixa.h + 40 : Math.max(topoMinimo, BASE_CARTAO - cartaoH);
  // página "topo": detalhe (ou amostra grande) à esquerda do cartão, até a base
  const blocoW = cartaoX - 32 - MARGEM;
  const blocoH = Math.min(620, BASE_CARTAO - 30 - cartaoY);

  // a linha da chamada termina na borda do cartão, na altura do pino (dentro do cartão)
  // (pino acima do cartão: a linha segue na horizontal e desce reta até a borda de cima — "L")
  const bordaX = lado === -1 ? cartaoX + cartaoW : cartaoX;
  const acimaDoCartao = layout !== "topo" && pino.y < cartaoY + 40;
  const descidaX = lado === -1
    ? Math.max(cartaoX + 60, Math.min(pino.x - 120, cartaoX + cartaoW - 120))
    : Math.min(cartaoX + cartaoW - 60, Math.max(pino.x + 120, cartaoX + 120));
  const alvo: Pt =
    layout === "topo"
      ? { x: cartaoX + 40, y: cartaoY - 6 }
      : acimaDoCartao
        ? { x: descidaX, y: cartaoY - 4 }
        : { x: bordaX, y: Math.max(cartaoY + 50, Math.min(cartaoY + cartaoH - 50, pino.y)) };
  const rota = acimaDoCartao ? "L" : "cotovelo";

  // medida
  const medida = m.medida
    ? { a: naTela(resolverPonto(m.medida.de, plano), caixa, plano, t), b: naTela(resolverPonto(m.medida.ate, plano), caixa, plano, t) }
    : null;
  const pMedida = m.medida ? prog(t, m.medida.em - 0.04, 0.6) : 0;

  const entraCol = prog(t, m.de + 0.22, 0.55);
  // item sem nada para a ficha (qualquer assunto): o nome e o complemento vão grandes no cartão
  const nomeNoCartao = lateral && !temConteudo(m);
  const nomeCartao = medirCartaoDoNome(m);
  const cartaoNomeX = lado === -1 ? MARGEM : 1080 - MARGEM_DIREITA - LARGURA_NOME;
  const cartaoNomeY = Math.max(lateral ? ladoDaPagina(layout, plano).cartao.y : 1000, BASE_CARTAO - nomeCartao.altura);
  // nome e complemento no mesmo corpo; quando não cabem numa linha da coluna, quebram em duas
  let tamNome = Math.min(
    caber(m.nome, colLargura, 86, 0.58, 50),
    m.complemento ? caber(m.complemento, colLargura, 86, 0.5, 50) : 86,
  );
  const cabeEmUma = (s: number) => largura(m.nome, s, "serifa") <= colLargura && (!m.complemento || largura(m.complemento, s, "italico") <= colLargura);
  let linhasNome = [m.nome];
  let linhasComp = m.complemento ? [m.complemento] : [];
  // Quando não cabem bem numa linha (corpo abaixo de 54 px ou vazando), procura o maior corpo
  // (86 → 46) em que o nome cabe em até 2 linhas e o complemento em até 3, na largura da coluna.
  if (!cabeEmUma(tamNome) || tamNome < 54) {
    const palavraMaior = (txt: string, s: number, it: boolean) => Math.max(...txt.split(/\s+/).map((w) => largura(w, s, it ? "italico" : "serifa")));
    // linha com uma palavrinha sozinha ("a", "de") não vale
    const solta = (ls: string[]) => ls.length > 1 && ls.some((l) => !l.includes(" ") && l.length <= 2);
    const tentar = (maxComp: number, minS: number) => {
      for (let s = 86; s >= minS; s -= 2) {
        if (palavraMaior(m.nome, s, false) > colLargura || (m.complemento && palavraMaior(m.complemento, s, true) > colLargura)) continue;
        const a = quebrar(m.nome, colLargura, s, { estilo: "serifa" });
        const b = m.complemento ? quebrar(m.complemento, colLargura, s, { estilo: "italico" }) : [];
        if (a.length <= 2 && b.length <= maxComp && !solta(a) && !solta(b)) {
          tamNome = s;
          linhasNome = a;
          linhasComp = b;
          return true;
        }
      }
      return false;
    };
    // primeiro, até 2 linhas para cada um; se não der, o complemento pode ter 3
    if (!tentar(2, 56)) tentar(3, 44);
  }

  return (
    <>
      {/* coluna: numeral grande, "de 03", nome da peça (sem ficha, o nome vai para o cartão) */}
      {lateral && camada === "papel" ? (
        <div
          style={{
            position: "absolute",
            left: lado === -1 ? colX : colX - colLargura,
            top: 168,
            width: colLargura,
            textAlign: alinha,
            opacity: 1 - fora,
            translate: `${lado * fora * 40}px 0`,
          }}
        >
          {numero ? (
            <>
              {m.rotulo ? <div style={{ ...rotulo, color: cor.grafite, marginBottom: 6, opacity: prog(t, m.de + 0.3, 0.4) }}>{m.rotulo}</div> : null}
              <div style={{ fontFamily: serifa, fontSize: 196, lineHeight: 0.92, color: cor.indigo, letterSpacing: "-0.02em" }}>
                <Sobe p={entraCol}>{numero}</Sobe>
              </div>
              <div style={{ ...rotulo, color: cor.grafite, marginTop: 16, opacity: prog(t, m.de + 0.4, 0.4) }}>
                de {String(total).padStart(2, "0")}
              </div>
            </>
          ) : null}
          <div
            style={{
              width: prog(t, m.de + 0.35, 0.5) * 90,
              height: 3,
              background: cor.tinta,
              margin: lado === -1 ? "34px 0 30px" : "34px 0 30px auto",
            }}
          />
          {nomeNoCartao ? null : (
          <>
          <div style={{ fontFamily: serifa, fontSize: tamNome, lineHeight: 1.08, color: cor.tinta, whiteSpace: "nowrap" }}>
            {linhasNome.map((l, i) => (
              <Sobe key={i} p={prog(t, m.nomeEm - 0.04, 0.42)}>
                {l}
              </Sobe>
            ))}
          </div>
          {m.complemento ? (
            <div style={{ fontFamily: serifa, fontStyle: "italic", fontSize: tamNome, lineHeight: 1.08, color: cor.grafite, whiteSpace: "nowrap" }}>
              {linhasComp.map((l, i) => (
                <Sobe key={i} p={prog(t, (m.complementoEm ?? m.nomeEm + 0.25) - 0.04, 0.42)}>
                  {l}
                </Sobe>
              ))}
            </div>
          ) : null}
          </>
          )}
        </div>
      ) : null}

      {nomeNoCartao && camada === "sobre" ? (
        <CartaoDoNome m={m} t={t} x={cartaoNomeX} y={cartaoNomeY} w={LARGURA_NOME} lado={lado} fora={fora} medida={nomeCartao} />
      ) : null}

      {/* medida de alfaiate + etiqueta na coluna */}
      {medida && m.medida && camada === "sobre" ? (
        <>
          <LinhaDeMedida a={medida.a} b={medida.b} p={pMedida} fora={fora} />
          {(() => {
            // a etiqueta fica do lado da coluna, na altura da medida, presa à ponta mais próxima
            const ponta = lado === -1 ? (medida.a.x < medida.b.x ? medida.a : medida.b) : medida.a.x > medida.b.x ? medida.a : medida.b;
            const pTexto = prog(t, m.medida.em + 0.25, 0.45);
            const tam = 50;
            const larguraEtiqueta = lateral ? colLargura : 300;
            const ex = lateral ? (lado === -1 ? colX : colX - colLargura) : ponta.x - larguraEtiqueta / 2;
            const ey = lateral ? ponta.y - tam * 1.15 : ponta.y + 40;
            const ligaDe = lateral ? (lado === -1 ? colX + colLargura + 8 : colX - colLargura - 8) : ponta.x;
            return (
              <>
                {lateral ? (
                  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: (1 - fora) * prog(t, m.medida.em + 0.2, 0.3) }}>
                    <line x1={ligaDe} x2={ponta.x + lado * 22} y1={ponta.y} y2={ponta.y} stroke={cor.tinta} strokeWidth={2} strokeDasharray="6 6" />
                  </svg>
                ) : null}
                <div
                  style={{
                    position: "absolute",
                    left: ex,
                    top: ey,
                    width: larguraEtiqueta,
                    textAlign: lateral ? alinha : "center",
                    fontFamily: serifa,
                    fontStyle: "italic",
                    fontSize: tam,
                    lineHeight: 1.1,
                    color: cor.tinta,
                    opacity: 1 - fora,
                  }}
                >
                  <Sobe p={pTexto}>{m.medida.texto}</Sobe>
                </div>
              </>
            );
          })()}
        </>
      ) : null}

      {/* detalhe (recorte do vídeo) ao lado do cartão, na página de baixo */}
      {comDetalheAoLado && m.detalhe && camada === "papel" ? (
        <>
          <Detalhe
            plano={plano}
            ponto={resolverPonto(m.detalhe.ponto, plano, "pulsoDir")}
            em={m.detalhe.em}
            t={t}
            x={MARGEM}
            y={cartaoY}
            w={blocoW}
            h={blocoH}
            zoom={m.detalhe.zoom}
            rotulo={m.detalhe.rotulo}
            fora={fora}
            de={m.de}
          />
          <div
            style={{
              position: "absolute",
              left: MARGEM,
              top: cartaoY + blocoH + 18,
              ...rotulo,
              color: cor.grafite,
              opacity: prog(t, m.detalhe.em + 0.3, 0.4) * (1 - fora),
            }}
          >
            {m.detalhe.rotulo ?? "detalhe"}
          </div>
        </>
      ) : null}

      {layout === "topo" && !m.detalhe && m.amostra && camada === "papel" ? (
        <div
          style={{
            position: "absolute",
            left: MARGEM,
            top: cartaoY,
            opacity: prog(t, m.de + 0.22, 0.5) * (1 - fora),
            translate: `0 ${(1 - prog(t, m.de + 0.22, 0.55)) * 50 + fora * 30}px`,
          }}
        >
          <Amostra
            id={`${id}-amostra-grande`}
            w={blocoW}
            h={blocoH}
            base={corDe(m.amostra.cor)}
            tecido={m.amostra.tecido}
            p={prog(t, m.amostra.em - 0.04, 0.6)}
          />
          <div style={{ ...rotulo, color: cor.grafite, marginTop: 22, opacity: prog(t, m.amostra.em + 0.3, 0.4) }}>
            {NOME_TECIDO[m.amostra.tecido ?? "liso"] || "amostra"}
          </div>
        </div>
      ) : null}

      {temFicha && !nomeNoCartao && camada === "sobre" ? (
        <Ficha
          m={m}
          t={t}
          x={cartaoX}
          y={cartaoY}
          w={cartaoW}
          lado={layout === "topo" ? 0 : lado}
          fora={fora}
          id={`${id}-ficha`}
          comAmostra={comAmostraNoCartao}
          comNome={comNomeNoCartao}
        />
      ) : null}

      {pinoVisivel && camada === "sobre" ? <Chamada id={`${id}-chamada`} de={pino} ate={alvo} t={t} em={m.pontoEm ?? m.nomeEm} fora={fora} rota={rota} /> : null}
    </>
  );
};
