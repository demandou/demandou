// Blocos de quadro cheio: a pessoa inteira e o texto na altura do peito, em tarjas.
// (Com `imagem`, o número, o destaque e a abertura ficam por cima de uma foto em tela cheia.)
import { Easing } from "remotion";
import { carimbo, formatar, prog, saindo, salto, temposDoTexto } from "../anim";
import { encaixar, larguraTexto } from "../medida";
import type { Abertura as TAbertura, Cta as TCta, Destaque as TDestaque, Frase as TFrase, Numero as TNumero, Palavra, Plano } from "../plano";
import { cor, fonte, sombraDura } from "../tema";
import { TelaCheia } from "./Assinatura";
import { Icone } from "./Icones";
import { medirTarjado, Tarjado } from "./Tarjado";

type Comum = { t: number; plano: Plano; yPeito: number; fim: number };

// container centrado num ponto, com saída rápida (some encolhendo) quando o momento acaba
const Bloco: React.FC<{ t: number; y: number; altura: number; ate: number; fim: number; giro?: number; children: React.ReactNode; largura?: number }> = ({
  t,
  y,
  altura,
  ate,
  fim,
  giro = 0,
  children,
  largura = 1000,
}) => {
  const s = fim > ate + 0.01 ? 0 : saindo(t, ate, 0.14);
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - largura) / 2,
        top: y - altura / 2,
        width: largura,
        height: altura,
        display: "flex",
        flexDirection: "column",
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

export const Abertura: React.FC<Comum & { m: TAbertura }> = ({ m, t, plano, yPeito, fim }) => {
  const em = m.em ?? m.de;
  const n = m.texto.split(/\s+/).filter(Boolean).length;
  // o gancho é ESCRITO: entra inteiro em menos de 1 s, palavra por palavra
  const passo = Math.min(0.11, 0.85 / Math.max(1, n));
  // começando no primeiro quadro, a primeira palavra já está inteira na tela
  const inicio = em <= 0.2 ? em - 0.16 : em;
  const tempos = Array.from({ length: n }, (_, i) => inicio + i * passo);
  const med = medirTarjado(m.texto, 960, 112, 62, 3);
  const y = m.imagem ? 900 : yPeito;
  return (
    <>
      {m.imagem ? <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} escurecer={0.12} /> : null}
      <Bloco t={t} y={y} altura={med.altura} ate={m.ate} fim={fim} giro={-2}>
        <Tarjado t={t} texto={m.texto} tempos={tempos} largura={960} max={112} min={62} linhas={3} destaque={m.destaque} />
      </Bloco>
    </>
  );
};

export const Destaque: React.FC<Comum & { m: TDestaque }> = ({ m, t, plano, yPeito, fim }) => {
  const alerta = m.nivel === "alerta";
  const med = medirTarjado(m.texto, 940, 128, 64, 2);
  const detalheEm = m.detalheEm ?? m.em + 0.45;
  const pal = (plano.palavras ?? []) as Palavra[];
  const medD = m.detalhe ? medirTarjado(m.detalhe, 860, 48, 32, 2, 800, false) : null;
  const total = med.altura + (medD ? medD.altura + 26 : 0);
  const y = m.imagem ? 900 : yPeito;
  const c = carimbo(t, m.em, 0, 0.2);
  const tempos = m.texto.split(/\s+/).map(() => m.em);
  return (
    <>
      {m.imagem ? <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} escurecer={0.15} /> : null}
      <Bloco t={t} y={y} altura={total} ate={m.ate} fim={fim} giro={-3}>
        <div style={{ opacity: c.opacity, transform: c.transform, visibility: c.visivel ? "visible" : "hidden" }}>
          <Tarjado
            t={t}
            texto={m.texto}
            tempos={tempos}
            largura={940}
            max={128}
            min={64}
            linhas={2}
            placa={alerta ? cor.alerta : cor.tarja}
            corTexto={alerta ? cor.tintaEscura : cor.tinta}
          />
        </div>
        {m.detalhe && medD ? (
          <div style={{ marginTop: 26 }}>
            <Tarjado t={t} texto={m.detalhe} tempos={temposDoTexto(m.detalhe, detalheEm, pal, m.ate)} largura={860} max={48} min={32} linhas={2} peso={800} caixaAlta={false} />
          </div>
        ) : null}
      </Bloco>
    </>
  );
};

export const Numero: React.FC<Comum & { m: TNumero }> = ({ m, t, plano, yPeito, fim }) => {
  const casas = m.casas ?? 0;
  const texto = (v: number) => `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const final = texto(m.valor);
  // dígitos medidos pelo mais largo (o contador usa algarismos de largura igual)
  const { tamanho: S } = encaixar(final.replace(/\d/g, "0"), { largura: 800, max: 230, min: 96, linhas: 1, fonte: { peso: 900 } });
  const larguraNumero = larguraTexto(final.replace(/\d/g, "0"), S, { peso: 900 }) * 1.04;
  const entra = Math.max(m.de, m.em - 0.25);
  const c = carimbo(t, entra, 0, 0.22);
  const v = m.valor * prog(t, m.em, 0.9, Easing.out(Easing.cubic));
  const rotuloEm = m.rotuloEm ?? m.em + 0.3;
  const medR = medirTarjado(m.rotulo, 820, 100, 40, 2);
  const alturaPlaca = S * 1.18;
  const total = alturaPlaca + medR.altura - 14;
  const y = m.imagem ? 900 : yPeito;
  const pR = prog(t, rotuloEm, 0.22, salto);
  return (
    <>
      {m.imagem ? <TelaCheia plano={plano} ref_={m.imagem} de={m.de} ate={m.ate} t={t} escurecer={0.18} /> : null}
      <Bloco t={t} y={y} altura={total} ate={m.ate} fim={fim} giro={-2}>
        <div style={{ position: "relative", opacity: c.opacity, transform: c.transform, visibility: c.visivel ? "visible" : "hidden" }}>
          <div
            style={{
              padding: `0 ${S * 0.22}px`,
              height: alturaPlaca,
              minWidth: larguraNumero + S * 0.44,
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
            marginTop: -14,
            opacity: Math.min(1, pR * 3),
            transform: pR >= 1 ? "rotate(2deg)" : `rotate(2deg) scale(${0.6 + 0.4 * pR})`,
            visibility: t >= rotuloEm ? "visible" : "hidden",
          }}
        >
          <Tarjado t={t} texto={m.rotulo} tempos={m.rotulo.split(/\s+/).map(() => rotuloEm)} largura={820} max={100} min={40} linhas={2} placa={cor.tarja} />
        </div>
      </Bloco>
    </>
  );
};

export const Frase: React.FC<Comum & { m: TFrase }> = ({ m, t, plano, yPeito, fim }) => {
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, em, plano.palavras, m.ate);
  const med = medirTarjado(m.texto, 940, 88, 50, 4);
  const pA = prog(t, m.de, 0.24, salto);
  return (
    <Bloco t={t} y={yPeito} altura={med.altura + 40} ate={m.ate} fim={fim} giro={-1.5}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: -34,
            top: -70,
            width: 96,
            height: 96,
            borderRadius: 48,
            background: cor.tarja,
            boxShadow: sombraDura(cor.tarjaBorda, 6),
            color: cor.tinta,
            fontFamily: fonte,
            fontWeight: 900,
            fontSize: 112,
            lineHeight: "150px",
            textAlign: "center",
            opacity: Math.min(1, pA * 3),
            transform: pA >= 1 ? "rotate(-8deg)" : `rotate(-8deg) scale(${0.5 + 0.5 * pA})`,
            zIndex: 2,
          }}
        >
          “
        </div>
        <Tarjado t={t} texto={m.texto} tempos={tempos} largura={940} max={88} min={50} linhas={4} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
      </div>
    </Bloco>
  );
};

export const Cta: React.FC<Comum & { m: TCta }> = ({ m, t, plano, yPeito, fim }) => {
  const em = m.em ?? m.de;
  const tempos = temposDoTexto(m.texto, em, plano.palavras, Math.min(m.ate, plano.duracao));
  const med = medirTarjado(m.texto, 940, 96, 56, 3);
  const icone = m.icone;
  const pI = prog(t, em, 0.3, salto);
  const ultima = tempos[tempos.length - 1] ?? em;
  // depois de montado, o bloco "respira" (nunca fica parado)
  const respiro = t > ultima + 0.3 ? 1 + 0.018 * Math.sin((t - ultima) * 5.2) : 1;
  const anel = ((t - em) % 1.1) / 1.1;
  const alturaIcone = icone ? 150 : 0;
  // assinatura: nome (e área) de quem fala, numa etiqueta escura embaixo da chamada
  const assinatura = plano.marca?.nome ? [plano.marca.nome, plano.marca.area].filter(Boolean).join(" · ") : "";
  const pA = prog(t, ultima + 0.25, 0.3, salto);
  const alturaAssinatura = assinatura ? 84 : 0;
  return (
    <Bloco t={t} y={yPeito + (alturaIcone + alturaAssinatura) / 2 - 20} altura={med.altura + alturaIcone + alturaAssinatura} ate={m.ate} fim={fim}>
      {icone ? (
        <div style={{ position: "relative", width: 132, height: 132, marginBottom: 18, visibility: t >= em ? "visible" : "hidden" }}>
          {t >= em ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 66,
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
              borderRadius: 66,
              background: cor.tarja,
              boxShadow: sombraDura(cor.tarjaBorda, 7),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: Math.min(1, pI * 3),
              transform: pI >= 1 ? undefined : `scale(${0.4 + 0.6 * pI})`,
            }}
          >
            <Icone nome={icone} tamanho={78} cor={cor.tinta} traco={2.8} />
          </div>
        </div>
      ) : null}
      <div style={{ transform: respiro !== 1 ? `rotate(-2deg) scale(${respiro})` : "rotate(-2deg)" }}>
        <Tarjado t={t} texto={m.texto} tempos={tempos} largura={940} max={96} min={56} linhas={3} destaque={m.destaque} />
      </div>
      {assinatura && t >= ultima + 0.25 ? (
        <div
          style={{
            marginTop: 24,
            padding: "10px 24px",
            borderRadius: 14,
            background: cor.placa,
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: encaixar(assinatura, { largura: 760, max: 40, min: 30, linhas: 1, fonte: { peso: 800 } }).tamanho,
            color: cor.tinta,
            whiteSpace: "nowrap",
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
