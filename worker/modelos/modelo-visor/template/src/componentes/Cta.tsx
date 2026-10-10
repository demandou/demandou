// Fechamento: cartão de perfil de vidro no peito — a chamada se monta palavra por palavra e o botão
// (a lápis até ser dito) é apertado: "Seguir" vira "Seguindo". O avatar é uma cópia muda do vídeo.
import { Palavras, mistura, normalizar, prog, saindo, temposDoTexto } from "../anim";
import { SANS_FORTE, TITULO, encaixar } from "../medida";
import { VideoNaCaixa } from "../motor/caixa";
import type { Cta as TipoCta, Palavra, Plano } from "../plano";
import { comAlfa, cor, mono, sans } from "../tema";
import { vidro } from "./Etiqueta";
import { Icone } from "./Icones";

export const Cta: React.FC<{ m: TipoCta; t: number; fim: number; plano: Plano; palavras: Palavra[]; base: number }> = ({ m, t, fim, plano, palavras, base }) => {
  // entra quando a pessoa já cobriu quase tudo (a troca para a tela cheia leva 0,45 s)
  const entra = prog(t, m.de + 0.3, 0.38);
  const sai = saindo(t, fim, 0.3);
  // o texto cabe sempre: até 2 linhas, reduzido até um mínimo legível
  const q = encaixar(m.texto, { largura: 952 - 68, max: 76, min: 52, linhas: 2, estilo: () => TITULO });
  const linhasTexto = q.linhas.map((l) => l.map((w) => w.w).join(" "));
  const alvoDestaque = m.destaque ? m.destaque.split(/\s+/).map(normalizar) : [];
  const idxDestaque = new Set<number>();
  if (alvoDestaque.length) {
    const ws = m.texto.split(/\s+/).map(normalizar);
    for (let i = 0; i + alvoDestaque.length <= ws.length; i++) if (alvoDestaque.every((a, k) => ws[i + k] === a)) alvoDestaque.forEach((_, k) => idxDestaque.add(i + k));
  }
  const tTexto = temposDoTexto(m.texto, palavras, m.de, fim, m.em ?? m.de);
  const fimTexto = tTexto[tTexto.length - 1] ?? m.de;
  const tDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, fimTexto, fim, fimTexto + 0.2) : [];
  const botaoEm = m.botaoEm ?? Math.max(m.de + 0.4, m.texto ? fimTexto + 0.2 : 0);
  const aperta = prog(t, botaoEm, 0.3);
  const afunda = t >= botaoEm - 0.06 && t < botaoEm + 0.22 ? 1 - Math.abs(t - botaoEm - 0.08) / 0.14 : 0;
  const pedido = m.icone ?? m.acao ?? "seguir";
  const textoBotao = (
    {
      seguir: ["Seguir", "Seguindo"],
      salvar: ["Salvar", "Salvo"],
      comentar: ["Comentar", "Comentado"],
      link: ["Abrir link", "Abrindo"],
    } as const
  )[pedido][aperta > 0.5 ? 1 : 0];
  const temNome = !!plano.marca.nome;
  const avatar = 112;
  // posição do avatar na tela (o cartão está ancorado embaixo, à esquerda)
  // uma segunda linha de texto empurra a divisória, o perfil e o botão para baixo
  const ex = Math.max(0, linhasTexto.length - 1) * Math.round(q.tamanho * 1.06);
  const alturaCartao = 360 + ex;
  const topoCartao = base - alturaCartao + (1 - entra) * 30;
  const yLinha = topoCartao + 212 + ex;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 64,
          top: topoCartao,
          width: 952,
          height: alturaCartao,
          boxSizing: "border-box",
          padding: "24px 34px",
          opacity: entra * (1 - sai),
          ...vidro,
        }}
      >
        {(() => {
          let k = 0;
          return linhasTexto.map((linha, li) => {
            const n = linha.split(" ").length;
            const base = k;
            k += n;
            return (
              <Palavras
                key={`${linha}-${li}`}
                texto={linha}
                tempos={tTexto.slice(base, base + n)}
                t={t}
                esboco={cor.lapis}
                corDe={(j) => (idxDestaque.has(base + j) ? cor.acento : undefined)}
                style={{ fontFamily: sans, fontWeight: 700, fontSize: q.tamanho, lineHeight: 1.06, color: cor.branco, letterSpacing: "-0.01em" }}
              />
            );
          });
        })()}
        {m.detalhe ? (
          <Palavras
            texto={m.detalhe}
            tempos={tDetalhe}
            t={t}
            esboco={cor.lapis}
            style={{ fontFamily: sans, fontWeight: 500, fontSize: 46, lineHeight: 1.2, color: "rgba(243,244,241,0.88)", marginTop: 4 }}
          />
        ) : null}
        <div style={{ position: "absolute", left: 34, right: 34, top: 186 + ex, height: 1.5, background: "rgba(243,244,241,0.16)" }} />
        {/* nome e área */}
        {temNome ? (
          <div style={{ position: "absolute", left: 34 + avatar + 24, top: 214 + ex }}>
            <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 50, color: cor.branco, lineHeight: 1.1 }}>{plano.marca.nome}</div>
            {plano.marca.area ? (
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 32, letterSpacing: "0.08em", color: cor.apagado, marginTop: 6 }}>
                {plano.marca.area.toUpperCase()}
              </div>
            ) : null}
          </div>
        ) : null}
        {/* botão: a lápis até a palavra; apertado, ganha o acento */}
        <div
          style={{
            position: "absolute",
            right: 34,
            top: 226 + ex,
            height: 92,
            minWidth: 300,
            boxSizing: "border-box",
            padding: "0 30px",
            borderRadius: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 42,
            color: aperta > 0.5 ? cor.acentoTexto : cor.branco,
            background: comAlfa(cor.acento, aperta),
            border: `3px solid ${aperta > 0.5 ? cor.acento : "rgba(243,244,241,0.7)"}`,
            scale: String(1 - 0.06 * Math.max(0, afunda)),
          }}
        >
          <Icone
            nome={aperta > 0.5 ? "check" : pedido}
            tamanho={42}
            cor={aperta > 0.5 ? cor.acentoTexto : cor.branco}
            espessura={4}
          />
          {textoBotao}
        </div>
      </div>
      {/* avatar: segunda cópia da pessoa, muda */}
      {temNome ? (
        <VideoNaCaixa
          src={plano.video}
          mudo
          caixa={{ x: 64 + 34, y: yLinha, w: avatar, h: avatar, raio: avatar / 2, zoom: 2.6, ancoraY: 0.45 }}
          rosto={plano.rosto}
          videoAltura={Math.min(1920, plano.videoAltura ?? 1920)}
          estilo={{ opacity: entra * (1 - sai), outline: `3px solid ${cor.acento}`, outlineOffset: 3, scale: String(mistura(0.9, 1, entra)) }}
        />
      ) : null}
    </>
  );
};
