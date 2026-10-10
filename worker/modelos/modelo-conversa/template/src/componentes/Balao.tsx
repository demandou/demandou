import { Easing } from "remotion";
import { Digitado, indicesDoTrecho, limitar, mistura, misturaCor, prog, TextoVivo, temposDoTexto } from "../anim";
import type { Msg } from "../blocos";
import { crescimentoDoPreco, geoCartao, geoPreco, geoTexto, type Medida, META, textoDoNumero } from "../fio";
import type { Palavra } from "../plano";
import { cor, fonte, sombraLeve } from "../tema";
import { GraficoCartao } from "./GraficoCartao";
import { DesenhoTraco, Icone } from "./Icones";

// Os três pontinhos do "digitando…": uma onda de opacidade (sem pulo)
export const Pontinhos: React.FC<{ t: number; corPonto: string; tamanho: number }> = ({ t, corPonto, tamanho }) => (
  <div style={{ display: "flex", gap: tamanho * 0.7, alignItems: "center" }}>
    {[0, 1, 2].map((i) => {
      const onda = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4 - i * 0.95);
      return <div key={i} style={{ width: tamanho, height: tamanho, borderRadius: tamanho, background: corPonto, opacity: 0.3 + 0.7 * onda }} />;
    })}
  </div>
);

const raios = (de: "cliente" | "eu", r: number) =>
  de === "eu" ? `${r}px ${r}px ${r * 0.22}px ${r}px` : `${r}px ${r}px ${r}px ${r * 0.22}px`;

// Cores de um balão no instante t (o balão enviado esfria para cinza quando é ignorado)
export const coresDoBalao = (m: Msg, t: number) => {
  // o alerta já nasce frio (a cor do que dá errado), com o texto claro para bater forte
  if (m.alerta) return { fundo: cor.frio, texto: cor.porcelana, meta: cor.frioTexto, apoio: cor.porcelanaSuave, frio: 1 };
  if (m.de === "cliente") return { fundo: cor.recebido, texto: cor.porcelana, meta: cor.porcelanaSuave, apoio: cor.porcelanaSuave, frio: 0 };
  const frio = m.esfriaEm !== undefined ? prog(t, m.esfriaEm, 0.35) : 0;
  return {
    fundo: misturaCor(cor.acento, cor.frio, frio),
    texto: misturaCor(cor.tinta, "#A7ACB4", frio),
    meta: frio > 0.5 ? cor.frioTexto : cor.tintaSuave,
    apoio: frio > 0.5 ? cor.frioTexto : cor.tintaSuave,
    frio,
  };
};

// Hora e vistos no canto do balão
const Meta: React.FC<{ m: Msg; t: number; hora: string; corMeta: string }> = ({ m, t, hora, corMeta }) => {
  const visto = m.vistoEm !== undefined && t >= m.vistoEm - 0.05;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: fonte, fontWeight: 500, fontSize: META, lineHeight: 1, color: corMeta }}>
      <span>{hora}</span>
      {m.de === "eu" ? <Icone nome={visto ? "checks" : "check"} tamanho={38} cor={corMeta} traco={3.6} /> : null}
    </div>
  );
};

// O balão "digitando…"
export const BalaoDigitando: React.FC<{ de: "cliente" | "eu"; med: Medida; t: number; opacidade?: number; sombra?: boolean }> = ({
  de,
  med,
  t,
  opacidade = 1,
  sombra,
}) => (
  <div
    style={{
      width: med.w,
      height: med.h,
      borderRadius: raios(de, med.corpo * 0.62),
      background: de === "eu" ? cor.acento : cor.recebido,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: opacidade,
      boxShadow: sombra ? sombraLeve : undefined,
    }}
  >
    <Pontinhos t={t} corPonto={de === "eu" ? cor.tinta : cor.porcelana} tamanho={Math.round(med.corpo * 0.3)} />
  </div>
);

// A bolinha antes do texto: o número do passo (vira ✓ quando o próximo passo é dito) ou o ✕ do alerta
const Bolinha: React.FC<{ m: Msg; t: number; d: number; eu: boolean }> = ({ m, t, d, eu }) => {
  if (m.alerta) {
    return (
      <div style={{ width: d, height: d, borderRadius: d, background: eu ? "#59606C" : cor.frio, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icone nome="x" tamanho={d * 0.5} cor={cor.porcelana} traco={Math.max(4, d * 0.075)} />
      </div>
    );
  }
  const feito = m.feitoEm !== undefined ? prog(t, m.feitoEm, 0.35) : 0;
  return (
    <div style={{ position: "relative", width: d, height: d, borderRadius: d, background: eu ? cor.tinta : cor.porcelana, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span
        style={{
          fontFamily: fonte,
          fontWeight: 800,
          fontSize: Math.round(d * 0.56),
          lineHeight: 1,
          color: eu ? cor.acento : cor.tinta,
          opacity: feito > 0 ? 1 - feito : undefined,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {m.passo}
      </span>
      {feito > 0 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="check" tamanho={d * 0.6} cor={eu ? cor.acento : cor.tinta} traco={Math.max(4, d * 0.08)} p={feito} />
        </div>
      ) : null}
    </div>
  );
};

// O balão de uma mensagem pronta (texto, preço, cartão, confirmação, número ou gráfico)
export const Balao: React.FC<{
  m: Msg;
  med: Medida;
  t: number;
  hora: string;
  palavras: Palavra[];
  // o texto se escreve palavra por palavra na fala (quadro cheio)
  falado?: { de: number; ate: number; inicio?: number; rascunho?: boolean };
  sombra?: boolean;
  // sem hora nem vistos (as mini-mensagens das faixas)
  semMeta?: boolean;
}> = ({ m, med, t, hora, palavras, falado, sombra, semMeta }) => {
  const c = med.corpo;
  const { padH, padTopo, padBase, linhaH } = geoTexto(c);
  const cores = coresDoBalao(m, t);
  const tipo = m.tipo ?? "texto";
  const eu = m.de === "eu";
  const caixa: React.CSSProperties = {
    position: "relative",
    width: med.w,
    height: med.h,
    borderRadius: raios(m.de, c * 0.62),
    background: cores.fundo,
    color: cores.texto,
    fontFamily: fonte,
    boxShadow: sombra ? sombraLeve : undefined,
    overflow: "hidden",
  };
  const meta = semMeta ? null : (
    <div style={{ position: "absolute", right: padH - 6, bottom: padBase - 2 }}>
      <Meta m={m} t={t} hora={hora} corMeta={cores.meta} />
    </div>
  );

  if (tipo === "confirmacao") {
    // aviso do sistema, compacto e centralizado: o ✓ se desenha, o valor chega
    const p = prog(t, m.em, 0.6);
    const icone = Math.round(c * 1.7);
    return (
      <div
        style={{
          ...caixa,
          borderRadius: c * 0.6,
          background: cor.cartao,
          color: cor.tinta,
          display: "flex",
          alignItems: "center",
          gap: Math.round(c * 0.4),
          padding: `0 ${Math.round(c * 0.5)}px`,
        }}
      >
        <div style={{ width: icone, height: icone, borderRadius: icone, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icone nome="check" tamanho={icone * 0.6} cor={cor.tinta} traco={c * 0.12} p={limitar((p - 0.15) / 0.6)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {m.texto ? <div style={{ fontSize: Math.round(c * 0.62), fontWeight: 700, lineHeight: 1.1, color: cor.tintaSuave }}>{m.texto}</div> : null}
          {m.valor ? <div style={{ fontSize: Math.round(c * 1.05), fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.01em" }}>{m.valor}</div> : null}
        </div>
      </div>
    );
  }

  if (tipo === "grafico" && m.grafico) {
    return <GraficoCartao g={m.grafico} med={med} t={t} entrada={m.em} />;
  }

  if (tipo === "numero" && m.numero) {
    const n = m.numero;
    const p = prog(t, n.em, 1.1, Easing.out(Easing.cubic));
    const casas = n.casas ?? 0;
    const fator = 10 ** casas;
    const valor = Math.round(n.valor * p * fator) / fator;
    const pRotulo = n.rotuloEm !== undefined ? prog(t, n.rotuloEm - 0.05, 0.3) : 1;
    const rotuloH = Math.round(med.rotuloCorpo * 1.2);
    return (
      <div style={caixa}>
        <div style={{ position: "absolute", left: padH, top: padTopo, fontSize: med.rotuloCorpo, fontWeight: 600, lineHeight: `${rotuloH}px`, color: cores.apoio, opacity: pRotulo < 1 ? 0.35 + 0.65 * pRotulo : undefined }}>
          {med.linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: padH,
            top: padTopo + med.linhas.length * rotuloH,
            fontSize: med.valorCorpo,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {t < n.em - 0.04 ? (
            // antes de o número ser dito: os pontinhos no lugar dele (a mensagem está sendo digitada)
            <div style={{ height: Math.round(med.valorCorpo * 1.1), display: "flex", alignItems: "center" }}>
              <Pontinhos t={t} corPonto={cores.texto} tamanho={Math.round(med.valorCorpo * 0.22)} />
            </div>
          ) : (
            textoDoNumero(n, valor)
          )}
        </div>
        {n.ilustrativo ? (
          <div
            style={{
              position: "absolute",
              left: padH,
              bottom: padBase - 4,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: cores.apoio,
            }}
          >
            ilustrativo
          </div>
        ) : null}
        {meta}
      </div>
    );
  }

  if (tipo === "preco") {
    const geo = geoPreco(c);
    const cValor = geo.valor;
    const cond = m.condicao;
    const condCorpo = geo.cond;
    const icone = geo.icone;
    // a condição chega presa ao preço: o balão cresce para baixo e ela entra; as palavras acendem na fala
    // e, na última palavra, a condição "trava" (fundo escuro, texto no acento)
    const g = crescimentoDoPreco(m, t);
    const tempos = cond ? temposDoTexto(cond.texto, palavras, cond.em, cond.em + 4, cond.em) : [];
    const pFinal = cond ? prog(t, (tempos[tempos.length - 1] ?? cond.em) + 0.05, 0.3) : 0;
    return (
      <div style={{ ...caixa, height: med.h - med.extra * (1 - g) }}>
        <div style={{ position: "absolute", left: padH, top: padTopo, fontSize: cValor, fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.015em" }}>
          {m.valor ?? m.texto}
        </div>
        {cond && g > 0 ? (
          <div
            style={{
              position: "absolute",
              left: padH - 10,
              right: padH - 10,
              top: padTopo + Math.round(cValor * 1.08) + 8,
              height: med.extra - 18,
              borderRadius: c * 0.5,
              background: misturaCor("#E2692B", cor.tinta, pFinal),
              color: misturaCor(cor.tinta, cor.acento, pFinal),
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 18px",
              opacity: g,
              translate: `0 ${(1 - g) * -24}px`,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <DesenhoTraco nome={cond.desenho ?? "relogio"} tamanho={icone} cor={misturaCor(cor.tinta, cor.acento, pFinal)} p={prog(t, cond.em, 1.2)} traco={4.5} />
            </div>
            <Digitado linhas={med.condLinhas} tempos={tempos} t={t} rascunho style={{ fontSize: condCorpo, fontWeight: 700, lineHeight: 1.2 }} />
          </div>
        ) : null}
        {meta}
      </div>
    );
  }

  if (tipo === "cartao") {
    const pDesenho = prog(t, m.em - 0.1, 1.3);
    const fim = (m.linhaEm ?? m.em) + 3;
    const temposTitulo = m.titulo ? temposDoTexto(m.titulo, palavras, m.em, fim, m.em + 0.3) : [];
    const pLinha = m.linha ? prog(t, (m.linhaEm ?? m.em + 0.8) - 0.05, 0.4) : 0;
    const img = med.extra;
    const geo = geoCartao(c, med.w);
    const tituloCorpo = geo.titulo;
    const linhaCorpo = geo.linha;
    return (
      <div style={caixa}>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 16,
            height: img,
            borderRadius: c * 0.44,
            background: "rgba(21,17,14,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DesenhoTraco
            nome={m.desenho ?? "caixa"}
            tamanho={img * 0.82}
            cor={cor.tinta}
            corForma={cor.porcelana}
            corAcento={cor.acentoClaro}
            p={pDesenho}
            traco={6}
          />
        </div>
        {m.titulo ? (
          <Digitado
            linhas={[m.titulo]}
            tempos={temposTitulo}
            t={t}
            rascunho
            style={{ position: "absolute", left: padH, top: 16 + img + 18, fontSize: tituloCorpo, fontWeight: 700, lineHeight: 1.2 }}
          />
        ) : null}
        {m.linha ? (
          <div
            style={{
              position: "absolute",
              left: padH,
              top: 16 + img + 18 + (m.titulo ? Math.round(tituloCorpo * 1.2) : 0) + 4,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: linhaCorpo,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            <div style={{ width: linhaCorpo * 0.95, height: linhaCorpo * 0.95, borderRadius: linhaCorpo, background: `rgba(21,17,14,${0.12 + 0.88 * pLinha})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icone nome="check" tamanho={linhaCorpo * 0.66} cor={cor.acento} traco={5} p={pLinha} />
            </div>
            <span style={{ opacity: 0.25 + 0.75 * pLinha }}>{m.linha}</span>
          </div>
        ) : null}
        {meta}
      </div>
    );
  }

  // texto — com as variações dos blocos (citação, bolinha, negrito, detalhe, trecho que trava, risco)
  const simples = !m.cita && !med.chip && !m.detalhe && !m.trava && !m.risco && med.peso === 500;
  const tempos = falado ? temposDoTexto(m.texto ?? "", palavras, falado.de, falado.ate, falado.inicio ?? m.em) : null;
  if (simples) {
    return (
      <div style={caixa}>
        {tempos ? (
          <Digitado
            linhas={med.linhas}
            tempos={tempos}
            t={t}
            rascunho={falado?.rascunho}
            style={{ position: "absolute", left: padH, top: padTopo, fontSize: c, fontWeight: 500, lineHeight: `${linhaH}px` }}
          />
        ) : (
          <div style={{ position: "absolute", left: padH, top: padTopo, fontSize: c, fontWeight: 500, lineHeight: `${linhaH}px` }}>
            {med.linhas.map((l, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
        )}
        {meta}
      </div>
    );
  }
  const recuo = med.chip ? med.chip + Math.round(c * 0.3) : 0;
  const citaCorpo = Math.max(36, Math.round(c * 0.6));
  const pDetalhe = m.detalheEm !== undefined ? prog(t, m.detalheEm - 0.05, 0.35) : 1;
  const texto = m.texto ?? "";
  return (
    <div style={caixa}>
      {m.cita ? (
        <div
          style={{
            position: "absolute",
            left: padH - 14,
            right: padH - 14,
            top: padTopo - 6,
            height: med.citaH - 14,
            borderRadius: c * 0.3,
            background: eu ? "rgba(21,17,14,0.14)" : "rgba(242,238,231,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 18px 0 0",
            overflow: "hidden",
          }}
        >
          <div style={{ width: 7, alignSelf: "stretch", background: eu ? cor.tinta : cor.acento, flexShrink: 0 }} />
          <div style={{ fontSize: citaCorpo, fontWeight: 700, color: cores.apoio, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.cita}</div>
        </div>
      ) : null}
      {med.chip ? (
        <div style={{ position: "absolute", left: padH - 4, top: padTopo + med.citaH + (linhaH - med.chip) / 2 }}>
          <Bolinha m={m} t={t} d={med.chip} eu={eu} />
        </div>
      ) : null}
      <TextoVivo
        linhas={med.linhas}
        tempos={tempos}
        t={t}
        linhaH={linhaH}
        rascunho={falado?.rascunho}
        trava={m.trava ? { indices: indicesDoTrecho(texto, m.trava), fundo: eu ? cor.tinta : cor.acento, cor: eu ? cor.acento : cor.tinta } : undefined}
        risco={m.risco ? { indices: indicesDoTrecho(texto, m.risco), em: m.riscoEm ?? m.em + 0.6, cor: eu ? cor.tinta : cor.porcelana } : undefined}
        style={{ position: "absolute", left: padH + recuo, top: padTopo + med.citaH, fontSize: c, fontWeight: med.peso, letterSpacing: med.peso > 500 ? "-0.01em" : undefined }}
      />
      {med.detalheLinhas.length ? (
        <div
          style={{
            position: "absolute",
            left: padH + recuo,
            top: padTopo + med.citaH + med.linhas.length * linhaH + 4,
            fontSize: med.detalheCorpo,
            fontWeight: 500,
            lineHeight: `${Math.round(med.detalheCorpo * 1.22)}px`,
            color: cores.apoio,
            opacity: pDetalhe < 1 ? 0.25 + 0.75 * pDetalhe : undefined,
          }}
        >
          {med.detalheLinhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
      {meta}
    </div>
  );
};

// A reação que pousa no canto do balão
export const Reacao: React.FC<{ m: Msg; t: number; tamanho: number }> = ({ m, t, tamanho }) => {
  if (!m.reacao) return null;
  const p = prog(t, m.reacao.em, 0.42);
  if (p <= 0) return null;
  const icone = m.reacao.icone ?? "coracao";
  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho,
        background: cor.barra,
        border: `4px solid ${cor.noite}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: p,
        scale: String(mistura(0.6, 1, p)),
      }}
    >
      <Icone nome={icone} tamanho={tamanho * 0.52} cor={cor.acento} preenchido={icone === "coracao" ? cor.acento : undefined} traco={6} p={limitar(p * 1.4)} />
    </div>
  );
};

// "Visto" embaixo de uma mensagem enviada
export const Visto: React.FC<{ m: Msg; t: number; corpo: number }> = ({ m, t, corpo }) => {
  if (m.vistoEm === undefined) return null;
  const p = prog(t, m.vistoEm, 0.35);
  if (p <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: fonte,
        fontWeight: 600,
        fontSize: Math.max(34, Math.round(corpo * 0.58)),
        color: cor.porcelanaSuave,
        opacity: p,
        translate: `0 ${(1 - p) * 10}px`,
      }}
    >
      <span>Visto</span>
    </div>
  );
};
