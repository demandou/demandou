// Blocos de quadro cheio: a pessoa inteira e o texto na altura do peito, em tarjas.
// (Com `imagem`, o número, o destaque e a abertura ficam por cima de uma foto em tela cheia.)
//
// No quadro deitado (16:9) a faixa do peito é baixa e larga: do queixo até a base útil (y 948,
// acima dos controles do player). Por isso o texto vira uma FILEIRA larga (até ~1400 px, menos
// linhas) em vez da pilha alta do vertical; o número e o rótulo ficam lado a lado, e o ícone da
// chamada fica ao lado do texto. Cada bloco mede o texto e encolhe até caber na largura e na
// altura da faixa (corpoQueCabe); o bloco fica centrado no rosto, sem sair das margens.
import { Easing } from "remotion";
import { carimbo, formatar, prog, saindo, salto, temposDoTexto } from "../anim";
import { centroNoPeito, esquerdaCentrada, type Faixa, QUADRO } from "../layout";
import { encaixar, larguraTexto } from "../medida";
import type { Abertura as TAbertura, Cta as TCta, Destaque as TDestaque, Frase as TFrase, Numero as TNumero, Palavra, Plano } from "../plano";
import { cor, fonte, sombraDura } from "../tema";
import { TelaCheia } from "./Assinatura";
import { Icone } from "./Icones";
import { corpoQueCabe, medirTarjado, Tarjado } from "./Tarjado";

type Comum = { t: number; plano: Plano; peito: Faixa; centroX: number; fim: number };

// com `imagem` (foto em tela cheia por trás) o texto fica no meio do quadro e tem mais altura
const COM_IMAGEM = { y: 520, altura: 760 };
// larguras máximas no quadro deitado (entre as margens de 96 px sobram 1728)
const LARGURA = 1400;

// onde fica o bloco: no peito (centrado no rosto) ou, com imagem, no meio do quadro. `largura` e
// `giro` contam a ponta que o bloco inclinado desce
const lugar = (temImagem: boolean, peito: Faixa, centroX: number, altura: number, largura = 0, giro = 0) =>
  temImagem ? { y: COM_IMAGEM.y, cx: QUADRO.w / 2 } : { y: centroNoPeito(peito, altura, largura, giro), cx: centroX };
const alturaLivre = (temImagem: boolean, peito: Faixa) => (temImagem ? COM_IMAGEM.altura : peito.base - peito.topo);

// container centrado num ponto, com saída rápida (some encolhendo) quando o momento acaba
const Bloco: React.FC<{
  t: number;
  y: number;
  cx: number;
  altura: number;
  ate: number;
  fim: number;
  giro?: number;
  children: React.ReactNode;
  largura: number;
  direcao?: "column" | "row";
}> = ({ t, y, cx, altura, ate, fim, giro = 0, children, largura, direcao = "column" }) => {
  const s = fim > ate + 0.01 ? 0 : saindo(t, ate, 0.14);
  return (
    <div
      style={{
        position: "absolute",
        left: esquerdaCentrada(cx, largura),
        top: y - altura / 2,
        width: largura,
        height: altura,
        display: "flex",
        flexDirection: direcao,
        alignItems: "center",
        justifyContent: "center",
        isolation: "isolate",
        opacity: 1 - s,
        transform: s > 0 ? `rotate(${giro}deg) scale(${1 - 0.12 * s})` : giro ? `rotate(${giro}deg)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const Abertura: React.FC<Comum & { m: TAbertura }> = ({ m, t, plano, peito, centroX, fim }) => {
  const em = m.em ?? m.de;
  const n = m.texto.split(/\s+/).filter(Boolean).length;
  // o gancho é ESCRITO: entra inteiro em menos de 1 s, palavra por palavra
  const passo = Math.min(0.11, 0.85 / Math.max(1, n));
  // começando no primeiro quadro, a primeira palavra já está inteira na tela
  const inicio = em <= 0.2 ? em - 0.16 : em;
  const tempos = Array.from({ length: n }, (_, i) => inicio + i * passo);
  const max = corpoQueCabe(m.texto, LARGURA, 96, 52, 3, alturaLivre(!!m.imagem, peito));
  const med = medirTarjado(m.texto, LARGURA, max, 52, 3);
  const largura = Math.min(LARGURA, med.largura + 40);
  const { y, cx } = lugar(!!m.imagem, peito, centroX, med.altura, largura, 2);
  return (
    <>
      {m.imagem ? <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} escurecer={0.12} /> : null}
      <Bloco t={t} y={y} cx={cx} altura={med.altura} largura={largura} ate={m.ate} fim={fim} giro={-2}>
        <Tarjado t={t} texto={m.texto} tempos={tempos} largura={LARGURA} max={max} min={52} linhas={3} destaque={m.destaque} />
      </Bloco>
    </>
  );
};

export const Destaque: React.FC<Comum & { m: TDestaque }> = ({ m, t, plano, peito, centroX, fim }) => {
  const alerta = m.nivel === "alerta";
  const detalheEm = m.detalheEm ?? m.em + 0.45;
  const pal = (plano.palavras ?? []) as Palavra[];
  const medD = m.detalhe ? medirTarjado(m.detalhe, 1200, 44, 30, 2, 800, false) : null;
  const livre = alturaLivre(!!m.imagem, peito) - (medD ? medD.altura + 22 : 0);
  const max = corpoQueCabe(m.texto, LARGURA, 110, 56, 2, livre);
  const med = medirTarjado(m.texto, LARGURA, max, 56, 2);
  const total = med.altura + (medD ? medD.altura + 22 : 0);
  const largura = Math.min(LARGURA, Math.max(med.largura, medD?.largura ?? 0) + 40);
  const { y, cx } = lugar(!!m.imagem, peito, centroX, total, largura, 3);
  const c = carimbo(t, m.em, 0, 0.2);
  const tempos = m.texto.split(/\s+/).map(() => m.em);
  return (
    <>
      {m.imagem ? <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} escurecer={0.15} /> : null}
      <Bloco t={t} y={y} cx={cx} altura={total} largura={largura} ate={m.ate} fim={fim} giro={-3}>
        <div style={{ opacity: c.opacity, transform: c.transform, visibility: c.visivel ? "visible" : "hidden" }}>
          <Tarjado
            t={t}
            texto={m.texto}
            tempos={tempos}
            largura={LARGURA}
            max={max}
            min={56}
            linhas={2}
            placa={alerta ? cor.alerta : cor.tarja}
            corTexto={alerta ? cor.tintaEscura : cor.tinta}
          />
        </div>
        {m.detalhe && medD ? (
          <div style={{ marginTop: 22 }}>
            <Tarjado t={t} texto={m.detalhe} tempos={temposDoTexto(m.detalhe, detalheEm, pal, m.ate)} largura={1200} max={44} min={30} linhas={2} peso={800} caixaAlta={false} />
          </div>
        ) : null}
      </Bloco>
    </>
  );
};

// O número e o rótulo LADO A LADO (no vertical o rótulo carimbava embaixo): a placa escura com o
// número que conta e, colado nela, o rótulo numa tarja rosa.
export const Numero: React.FC<Comum & { m: TNumero }> = ({ m, t, plano, peito, centroX, fim }) => {
  const casas = m.casas ?? 0;
  const texto = (v: number) => `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const final = texto(m.valor);
  const livre = alturaLivre(!!m.imagem, peito);
  // dígitos medidos pelo mais largo (o contador usa algarismos de largura igual)
  const { tamanho: S } = encaixar(final.replace(/\d/g, "0"), { largura: 720, max: Math.min(190, Math.floor(livre / 1.18)), min: 84, linhas: 1, fonte: { peso: 900 } });
  const larguraNumero = larguraTexto(final.replace(/\d/g, "0"), S, { peso: 900 }) * 1.04;
  const larguraPlaca = larguraNumero + S * 0.44;
  const alturaPlaca = S * 1.18;
  const entra = Math.max(m.de, m.em - 0.25);
  const c = carimbo(t, entra, 0, 0.22);
  const v = m.valor * prog(t, m.em, 0.9, Easing.out(Easing.cubic));
  const rotuloEm = m.rotuloEm ?? m.em + 0.3;
  // o rótulo fica com o que sobra da largura (entre 420 e 760 px) e no máximo a altura da placa
  const COLA = -14;
  const larguraRotulo = Math.max(420, Math.min(760, QUADRO.w - 2 * 96 - larguraPlaca - COLA - 40));
  const maxR = corpoQueCabe(m.rotulo, larguraRotulo, 84, 38, 2, Math.max(alturaPlaca, 120));
  const medR = medirTarjado(m.rotulo, larguraRotulo, maxR, 38, 2);
  const altura = Math.max(alturaPlaca, medR.altura);
  const largura = Math.min(QUADRO.w - 2 * 96, larguraPlaca + COLA + medR.largura + 40);
  const { y, cx } = lugar(!!m.imagem, peito, centroX, altura, largura, 2);
  const pR = prog(t, rotuloEm, 0.22, salto);
  return (
    <>
      {m.imagem ? <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} escurecer={0.18} /> : null}
      <Bloco t={t} y={y} cx={cx} altura={altura} largura={largura} ate={m.ate} fim={fim} giro={-2} direcao="row">
        <div style={{ position: "relative", flexShrink: 0, opacity: c.opacity, transform: c.transform, visibility: c.visivel ? "visible" : "hidden" }}>
          <div
            style={{
              padding: `0 ${S * 0.22}px`,
              height: alturaPlaca,
              minWidth: larguraPlaca,
              boxSizing: "border-box",
              borderRadius: S * 0.16,
              background: cor.placa,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonte,
              fontWeight: 900,
              fontSize: S,
              color: cor.tinta,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {texto(v)}
          </div>
          {m.ilustrativo ? (
            <div
              style={{
                position: "absolute",
                right: 10,
                top: -44,
                padding: "4px 14px",
                borderRadius: 10,
                background: cor.placa,
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: "0.08em",
                color: cor.suave,
              }}
            >
              ILUSTRATIVO
            </div>
          ) : null}
        </div>
        <div
          style={{
            marginLeft: COLA,
            flexShrink: 0,
            opacity: Math.min(1, pR * 3),
            transform: pR >= 1 ? "rotate(2deg)" : `rotate(2deg) scale(${0.6 + 0.4 * pR})`,
            visibility: t >= rotuloEm ? "visible" : "hidden",
          }}
        >
          <Tarjado t={t} texto={m.rotulo} tempos={m.rotulo.split(/\s+/).map(() => rotuloEm)} largura={larguraRotulo} max={maxR} min={38} linhas={2} placa={cor.tarja} />
        </div>
      </Bloco>
    </>
  );
};

export const Frase: React.FC<Comum & { m: TFrase }> = ({ m, t, plano, peito, centroX, fim }) => {
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, em, plano.palavras, m.ate);
  const max = corpoQueCabe(m.texto, LARGURA, 80, 44, 3, alturaLivre(false, peito) - 30);
  const med = medirTarjado(m.texto, LARGURA, max, 44, 3);
  const pA = prog(t, m.de, 0.24, salto);
  // o selo de aspas acompanha o corpo do texto
  const selo = Math.round(Math.max(64, Math.min(96, med.S * 1.15)));
  const largura = Math.min(LARGURA, med.largura + 80);
  const { y, cx } = lugar(false, peito, centroX, med.altura + 30, largura, 1.5);
  return (
    <Bloco t={t} y={y} cx={cx} altura={med.altura + 30} largura={largura} ate={m.ate} fim={fim} giro={-1.5}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: -selo * 0.36,
            top: -selo * 0.73,
            width: selo,
            height: selo,
            borderRadius: selo / 2,
            background: cor.tarja,
            boxShadow: sombraDura(cor.tarjaBorda, 6),
            color: cor.tinta,
            fontFamily: fonte,
            fontWeight: 900,
            fontSize: selo * 1.17,
            lineHeight: `${selo * 1.56}px`,
            textAlign: "center",
            opacity: Math.min(1, pA * 3),
            transform: pA >= 1 ? "rotate(-8deg)" : `rotate(-8deg) scale(${0.5 + 0.5 * pA})`,
            zIndex: 2,
          }}
        >
          “
        </div>
        <Tarjado t={t} texto={m.texto} tempos={tempos} largura={LARGURA} max={max} min={44} linhas={3} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
      </div>
    </Bloco>
  );
};

// A chamada final: o ícone AO LADO da chamada (no vertical ficava em cima) e a etiqueta com o nome
// embaixo, centrada.
export const Cta: React.FC<Comum & { m: TCta }> = ({ m, t, plano, peito, centroX, fim }) => {
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, em, plano.palavras, Math.min(m.ate, plano.duracao));
  const icone = m.icone;
  const ICONE = 120;
  const VAO_ICONE = 30;
  // assinatura: nome (e área) de quem fala, numa etiqueta escura embaixo da chamada
  const assinatura = plano.marca?.nome ? [plano.marca.nome, plano.marca.area].filter(Boolean).join(" · ") : "";
  const tamAssinatura = assinatura ? encaixar(assinatura, { largura: 760, max: 38, min: 28, linhas: 1, fonte: { peso: 800 } }).tamanho : 0;
  const alturaAssinatura = assinatura ? Math.round(tamAssinatura * 1.25 + 20 + 22) : 0;
  const larguraTextoCta = 1300 - (icone ? ICONE + VAO_ICONE : 0);
  const max = corpoQueCabe(m.texto, larguraTextoCta, 86, 48, 2, alturaLivre(false, peito) - alturaAssinatura);
  const med = medirTarjado(m.texto, larguraTextoCta, max, 48, 2);
  const pI = prog(t, em, 0.3, salto);
  const ultima = tempos[tempos.length - 1] ?? em;
  // depois de montado, o bloco "respira" (nunca fica parado)
  const respiro = t > ultima + 0.3 ? 1 + 0.018 * Math.sin((t - ultima) * 5.2) : 1;
  const anel = ((t - em) % 1.1) / 1.1;
  const pA = prog(t, ultima + 0.25, 0.3, salto);
  const alturaFileira = Math.max(icone ? ICONE : 0, med.altura);
  const altura = alturaFileira + alturaAssinatura;
  const largura = Math.min(1728, (icone ? ICONE + VAO_ICONE : 0) + med.largura + 60);
  const { y, cx } = lugar(false, peito, centroX, altura, med.largura, 2);
  return (
    <Bloco t={t} y={y} cx={cx} altura={altura} largura={largura} ate={m.ate} fim={fim}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", height: alturaFileira }}>
        {icone ? (
          <div style={{ position: "relative", width: ICONE, height: ICONE, marginRight: VAO_ICONE, flexShrink: 0, visibility: t >= em ? "visible" : "hidden" }}>
            {t >= em ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: ICONE / 2,
                  border: `6px solid ${cor.tarja}`,
                  opacity: (1 - anel) * 0.8,
                  transform: `scale(${1 + anel * 0.45})`,
                }}
              />
            ) : null}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: ICONE / 2,
                background: cor.tarja,
                boxShadow: sombraDura(cor.tarjaBorda, 7),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: Math.min(1, pI * 3),
                transform: pI >= 1 ? undefined : `scale(${0.4 + 0.6 * pI})`,
              }}
            >
              <Icone nome={icone} tamanho={ICONE * 0.59} cor={cor.tinta} traco={2.8} />
            </div>
          </div>
        ) : null}
        <div style={{ transform: respiro !== 1 ? `rotate(-2deg) scale(${respiro})` : "rotate(-2deg)" }}>
          {/* com ícone, o texto encosta nele (alinhado à esquerda); sem ícone, centrado */}
          <Tarjado t={t} texto={m.texto} tempos={tempos} largura={larguraTextoCta} max={max} min={48} linhas={2} destaque={m.destaque} alinhar={icone ? "esquerda" : "centro"} />
        </div>
      </div>
      {assinatura ? (
        <div
          style={{
            marginTop: 22,
            padding: "10px 24px",
            borderRadius: 14,
            background: cor.placa,
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: tamAssinatura,
            lineHeight: 1.25,
            color: cor.tinta,
            whiteSpace: "nowrap",
            visibility: t >= ultima + 0.25 ? "visible" : "hidden",
            opacity: Math.min(1, pA * 3),
            transform: pA >= 1 ? undefined : `translateY(${(1 - pA) * 20}px)`,
          }}
        >
          {assinatura}
        </div>
      ) : null}
    </Bloco>
  );
};
