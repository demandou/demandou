// A abertura: a pessoa em tela cheia e, no peito, uma conversa com um assistente fictício.
// O pedido vago é digitado e enviado; a resposta chega cinza e borrada, palavra por palavra;
// duas etiquetas com palavras da fala marcam o problema, e o balão do pedido perde a cor.
import { chega, Cursor, desliza, mistura, misturaCor, prog } from "../anim";
import { CARTAO_PEITO } from "../geometria";
import type { Vago as TipoVago } from "../plano";
import { cor, sans, sombra } from "../tema";
import { Icone } from "./Icones";
import { AvatarIA } from "./Resposta";

const RESPOSTA_PADRAO = "Claro! Aqui vai uma ideia geral, com opções variadas e equilibradas para o seu dia a dia, sem muitos detalhes.";

const ALTURA = 520;
const ALTURA_INICIAL = 214;

export const temposDoVago = (m: TipoVago) => {
  const envia = m.enviaEm ?? m.de + 0.95;
  const digita = Math.min(envia - 0.2, m.de + 0.15);
  return { envia, digita };
};

const Etiqueta: React.FC<{ texto: string; t: number; em: number; estilo?: React.CSSProperties }> = ({ texto, t, em, estilo }) => {
  const p = prog(t, em - 0.04, 0.3);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        height: 60,
        padding: "0 24px",
        borderRadius: 30,
        background: cor.tinta,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        fontFamily: sans,
        fontWeight: 600,
        fontSize: 38,
        whiteSpace: "nowrap",
        boxShadow: "0 10px 24px rgba(21,23,28,0.22)",
        opacity: p,
        scale: String(0.9 + 0.1 * p),
        translate: `0 ${(1 - p) * 14}px`,
        ...estilo,
      }}
    >
      {texto}
    </div>
  );
};

export const ALTURA_VAGO = ALTURA;
// em gravações muito perto da câmera (pouco lugar abaixo do queixo) o cartão inteiro encolhe
export const escalaDoVago = (livre: number) => Math.max(0.72, Math.min(1, livre / ALTURA));

export const Vago: React.FC<{ m: TipoVago; t: number; fim: number; livre?: number; emendaDepois?: boolean }> = ({ m, t, fim, livre = ALTURA, emendaDepois }) => {
  const { envia, digita } = temposDoVago(m);
  const escala = escalaDoVago(livre);
  // o cartão nasce só com a caixa de texto e cresce quando a conversa começa
  const h = mistura(ALTURA_INICIAL, ALTURA, prog(t, envia - 0.32, 0.5, desliza));
  const y = CARTAO_PEITO.base - h;
  const entra = m.de < 0.05 ? prog(t, 0, 0.3) : prog(t, m.de, 0.4);
  // encostado num cartão seguinte: o cartão fica (o próximo continua dele); só o conteúdo some
  // sem emenda, o cartão desce inteiro para fora (opaco: nada de fantasma por cima do que entra)
  const sai = emendaDepois ? 0 : prog(t, fim, 0.32, (x) => x * x * x);
  const conteudo = emendaDepois ? 1 - prog(t, fim - 0.12, 0.12) : 1;
  if (emendaDepois && t >= fim) return null;

  // a caixa: o pedido digitado letra a letra até o envio
  const letras = Math.max(0, Math.min(m.pedido.length, Math.floor((t - digita) / Math.max(0.02, (envia - 0.12 - digita) / m.pedido.length))));
  const enviado = t >= envia;
  const pBalao = prog(t, envia, 0.38, chega);

  // a resposta genérica: palavras chegando depressa, cinza e borradas
  const resposta = (m.resposta ?? RESPOSTA_PADRAO).split(/\s+/).filter(Boolean);
  const inicioResposta = envia + 0.3;
  const vago = m.rotuloPedido ? prog(t, m.rotuloPedido.em, 0.35) : 0;

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
        opacity: entra,
        translate: `0 ${(1 - entra) * 60 + sai * (1920 - y + 60)}px`,
        overflow: "hidden",
        scale: escala < 1 ? String(escala) : undefined,
        transformOrigin: "50% 100%",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: conteudo }}>
      {/* cabeçalho do assistente */}
      <div style={{ position: "absolute", left: 30, top: 22, display: "flex", alignItems: "center", gap: 16 }}>
        <AvatarIA tamanho={56} />
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 38, color: cor.tinta }}>Assistente</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 98, height: 2, background: cor.linha }} />

      {/* o pedido enviado */}
      {enviado ? (
        <div
          style={{
            position: "absolute",
            right: 30,
            top: mistura(h - 128, h - 400, pBalao),
            maxWidth: 560,
            padding: "14px 30px 16px",
            borderRadius: "32px 32px 10px 32px",
            background: misturaCor(cor.tinta, "#9AA0A9", vago),
            color: "#fff",
            fontFamily: sans,
            fontWeight: 500,
            fontSize: 44,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
            opacity: Math.min(1, pBalao * 5),
            outline: vago > 0 ? `3px dashed rgba(90,96,107,${vago})` : undefined,
            outlineOffset: 6,
          }}
        >
          {m.pedido}
        </div>
      ) : null}

      {/* a resposta genérica, borrada */}
      {t >= inicioResposta - 0.05 ? (
        <div
          style={{
            position: "absolute",
            left: 30,
            top: h - 296,
            width: 640,
            height: 168,
            padding: "14px 26px",
            borderRadius: "10px 32px 32px 32px",
            background: cor.cartaoFundo,
            opacity: prog(t, inicioResposta - 0.05, 0.2),
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 44,
              lineHeight: 1.12,
              color: cor.borrado,
              filter: "blur(7px)",
              height: 140,
              overflow: "hidden",
            }}
          >
            {resposta.map((w, i) => (
              <span key={`${w}-${i}`} style={{ marginRight: "0.27em", opacity: t >= inicioResposta + i * 0.055 ? 1 : 0 }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* a caixa de texto */}
      <div
        style={{
          position: "absolute",
          left: 26,
          right: 26,
          bottom: 22,
          height: 84,
          borderRadius: 42,
          background: cor.cartaoFundo,
          display: "flex",
          alignItems: "center",
          paddingLeft: 30,
        }}
      >
        <div style={{ flex: 1, fontFamily: sans, fontWeight: 500, fontSize: 44, whiteSpace: "nowrap", color: !enviado && letras > 0 ? cor.tinta : cor.lapis }}>
          {!enviado && letras > 0 ? (
            <>
              {m.pedido.slice(0, letras)}
              <Cursor cor={cor.tinta} t={t} piscando={letras >= m.pedido.length} />
            </>
          ) : (
            "Pergunte qualquer coisa"
          )}
        </div>
        <div
          style={{
            width: 64,
            height: 64,
            marginRight: 10,
            borderRadius: 32,
            background: !enviado && letras > 0 ? cor.tinta : cor.lapisClaro,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(1 - 0.1 * (prog(t, envia - 0.08, 0.08) - prog(t, envia, 0.16))),
          }}
        >
          <Icone nome="enviar" tamanho={36} cor="#fff" espessura={4.6} />
        </div>
      </div>

      {/* etiquetas com as palavras da fala */}
      {m.rotuloResposta ? <Etiqueta texto={m.rotuloResposta.texto} t={t} em={m.rotuloResposta.em} estilo={{ right: 34, top: h - 184 }} /> : null}
      {m.rotuloPedido ? <Etiqueta texto={m.rotuloPedido.texto} t={t} em={m.rotuloPedido.em} estilo={{ left: 40, top: h - 390 }} /> : null}
      </div>
    </div>
  );
};
