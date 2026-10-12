// Os blocos de tempo. Cada um espera "a lápis" (contorno tracejado com a duração) no horário em que
// vai cair; na palavra, cai decidido, assenta e acende. O conteúdo se adapta ao tamanho do bloco:
// grande (horário, título enorme, espaço para o anel), médio (título + duração), pequeno (uma linha)
// e fino (só a cor). Na linha do dia, os blocos viram segmentos de uma barra.
// A queda é "na folha": o bloco vem de um pouco acima e maior, com sombra alta, e assenta no
// tamanho certo com sombra baixa — nunca atravessa o bloco de cima.
import { assenta, escreverHora, limitar, Linhas, prog, temposDoTexto } from "../anim";
import { encaixar, medir } from "../medida";
import { type Agenda, type BlocoNaAgenda, minutosAgora, retNoTempo, trechoNoTempo } from "../agenda";
import type { Palavra } from "../plano";
import { CABECALHO, CATEGORIAS, cor, FOLHA, H, numeros, RAIO_BLOCO, sans, W } from "../tema";
import { Icone } from "./Icones";

export const QUEDA = 0.42;

// o anel do cronômetro dentro do bloco (pessoa em cima): à direita, centrado na altura.
// Bloco baixo demais (anel < 160 px) fica sem anel.
export const anelNoBloco = (r: { x: number; y: number; w: number; h: number }) => {
  const d = Math.min(r.h - (r.h >= 340 ? 96 : 36), 300, r.w * 0.38);
  return { cx: r.x + r.w - 36 - d / 2, cy: r.y + r.h / 2, d: d >= 160 ? d : 0 };
};

const duracao = (b: BlocoNaAgenda, t: number) => {
  if (b.qualitativo) return "";
  if (b.maxMinutos && b.maxEm !== undefined && t >= b.maxEm - 0.05) return `${b.minutos}–${b.maxMinutos} min`;
  return `${b.minutos} min`;
};

export const Blocos: React.FC<{
  t: number;
  ag: Agenda;
  palavras: Palavra[];
  // posição x da marcação que percorre a linha do dia (blocos à esquerda dela ganham ✓)
  marcaX: number | null;
}> = ({ t, ag, palavras, marcaX }) => {
  const { atual } = trechoNoTempo(t, ag.trechos);
  // duas camadas: primeiro todos os lugares a lápis, depois os blocos (um lápis nunca fica por cima de um bloco)
  const camada = (esbocos: boolean) =>
      ag.blocos.map((b) => {
        if (t < b.esbocoDe - 0.05) return null;
        const { ret, naAgenda, visivel, texto } = retNoTempo(b, t, ag);
        if (visivel < 0.01) return null;
        const queda = prog(t, b.em, QUEDA, assenta);
        const entrou = prog(t, b.em, 0.16);
        const cat = CATEGORIAS[b.categoria];
        const solido = cat.solido;
        const comTexto = texto > 0.01;
        const esboco = (1 - prog(t, b.em + 0.22, 0.25)) * prog(t, b.esbocoDe, 0.35);
        const dy = -(1 - queda) * 46;
        const escala = 1 + (1 - queda) * 0.07;
        const raio = Math.min(naAgenda > 0.5 ? RAIO_BLOCO : 14, ret.h / 2);
        // o pedaço da faixa ainda não confirmado (pausa longa "15 a 30") espera a lápis embaixo
        const agora = minutosAgora(b, t);
        const faixa =
          b.maxMinutos && naAgenda > 0.5 && t >= (b.minutosEm ?? b.em) - 0.05 ? ((b.maxMinutos - agora) * (ret.h + 6)) / agora : 0;
        // ✓ quando a marcação da linha do dia passa do meio do bloco
        const feito = marcaX === null ? 0 : limitar((marcaX - (ret.x + ret.w * 0.5)) / 50);

        if (esbocos)
          return esboco > 0.01 ? (
          <div key={b.id} style={{ opacity: visivel }}>
            {/* lugar a lápis */}
            {esboco > 0.01 ? (
              <div
                style={{
                  position: "absolute",
                  left: ret.x,
                  top: ret.y,
                  width: ret.w,
                  height: ret.h,
                  borderRadius: raio,
                  border: `3px dashed ${cor.esboco}`,
                  background: "rgba(188,195,207,0.10)",
                  opacity: esboco,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: ret.h >= 80 ? 44 : 36,
                  color: cor.esbocoTexto,
                  ...numeros,
                }}
              >
                {ret.h >= 52 && ret.w >= 150 && comTexto && !b.qualitativo ? duracao(b, t) : null}
              </div>
            ) : null}
          </div>
          ) : null;
        return (
          <div key={b.id} style={{ opacity: visivel }}>
            {faixa > 2 ? (
              <div
                style={{
                  position: "absolute",
                  left: ret.x,
                  top: ret.y + ret.h - 6,
                  width: ret.w,
                  height: faixa,
                  borderRadius: `0 0 ${RAIO_BLOCO}px ${RAIO_BLOCO}px`,
                  border: `3px dashed ${cat.forte}`,
                  borderTop: "none",
                  opacity: 0.55 * prog(t, b.minutosEm ?? b.em, 0.3),
                }}
              />
            ) : null}
            {/* o bloco */}
            {t >= b.em ? (
              <div
                style={{
                  position: "absolute",
                  left: ret.x,
                  top: ret.y + dy,
                  width: ret.w,
                  height: ret.h,
                  borderRadius: raio,
                  background: cat.fundo,
                  overflow: "hidden",
                  opacity: entrou,
                  scale: String(escala),
                  boxShadow: `0 ${4 + (1 - queda) * 26}px ${10 + (1 - queda) * 40}px rgba(20,26,40,${0.1 + (1 - queda) * 0.16})`,
                }}
              >
                {!solido && ret.w > 30 ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: Math.min(12, ret.w * 0.12), background: cat.forte }} /> : null}
                {comTexto ? (
                  <Conteudo
                    b={b}
                    t={t}
                    w={ret.w}
                    h={ret.h}
                    palavras={palavras}
                    inicioAgenda={ag.inicio}
                    opacidade={texto}
                    // o anel do cronômetro ocupa a direita do bloco: o texto não passa por baixo dele
                    reserva={atual.cena.anel?.noBloco === b.id && anelNoBloco(ret).d > 0 ? anelNoBloco(ret).d + 40 : 0}
                  />
                ) : null}
                {feito > 0 && ret.w >= 34 && ret.h >= 30 ? (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icone nome="check" tamanho={Math.min(ret.h * 0.62, 58)} cor={solido ? "#FFFFFF" : cat.texto} peso={5.5} p={feito} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      });
  return (
    // nada sai da folha (nem durante a mudança de escala); a agenda que rola para cima some embaixo do
    // cabeçalho
    <div style={{ position: "absolute", inset: 0, clipPath: `inset(${FOLHA.y + CABECALHO + 2}px ${W - FOLHA.x - FOLHA.w}px ${H - FOLHA.y - FOLHA.h}px ${FOLHA.x}px round 0 0 ${FOLHA.raio}px ${FOLHA.raio}px)` }}>
      {camada(true)}
      {camada(false)}
    </div>
  );
};

const Conteudo: React.FC<{
  b: BlocoNaAgenda;
  t: number;
  w: number;
  h: number;
  palavras: Palavra[];
  inicioAgenda: number;
  opacidade: number;
  reserva: number;
}> = ({ b, t, w, h, palavras, inicioAgenda, opacidade, reserva }) => {
  if (opacidade < 0.01 || h < 30) return null;
  const cat = CATEGORIAS[b.categoria];
  const texto = cat.texto;
  const apagado = cat.solido ? "rgba(255,255,255,0.42)" : "rgba(20,22,28,0.28)";
  // palavra dita antes de o bloco cair (ou num ciclo copiado) já vem pronta; as ditas depois entram na fala
  const tempos = temposDoTexto(b.titulo, palavras, b.falaDe, b.falaAte, b.em).map((x) => (x < b.em + 0.1 ? b.em - 0.5 : x));
  const faixaPronta = b.minutosEm === undefined || t >= b.minutosEm - 0.05;
  const pad = cat.solido ? 30 : 34;
  // número do ciclo: só em bloco com altura para ele (bolinha de 60 px ou mais)
  const d = Math.min(h - 20, 76);
  const badge = b.ciclo && d >= 60 && t >= b.ciclo.em - 0.05 ? b.ciclo : null;
  const pBadge = badge ? prog(t, badge.em, 0.3) : 0;
  const espacoBadge = b.ciclo && d >= 60 ? d + 24 : 0;
  const hora = escreverHora(inicioAgenda + b.inicio);

  // linha de cima do bloco grande: o horário, ou o "quando" escrito no plano
  const temHora = !b.qualitativo || (b.quando && !/^\d+$/.test(b.quando));
  // grande: horário, título enorme (até 3 linhas) e o lado direito livre para o anel
  if (h >= 340 && w >= 620) {
    const larguraTexto = w - reserva - 2 * pad - 20;
    const alturaTexto = h - 2 * pad - (temHora ? 58 : 0);
    const e = encaixar(b.titulo, { largura: larguraTexto, max: 100, min: 56, linhas: 3, altura: alturaTexto, entrelinha: 1.02 });
    return (
      <div style={{ position: "absolute", left: pad, top: pad - 4, width: larguraTexto, fontFamily: sans, color: texto, opacity: opacidade }}>
        {temHora ? <HoraDoBloco b={b} t={t} inicioAgenda={inicioAgenda} cor={cat.solido ? "rgba(255,255,255,0.86)" : cor.tintaSuave} /> : null}
        <Linhas linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} entrelinha={1.02} esboco={apagado} style={{ marginTop: temHora ? 18 : 0 }} />
      </div>
    );
  }

  const Badge = badge ? (
    <div
      style={{
        position: "absolute",
        right: 18,
        top: (h - d) / 2,
        width: d,
        height: d,
        borderRadius: 999,
        background: cat.solido ? "#FFFFFF" : cat.forte,
        color: cat.solido ? cat.forte : "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: sans,
        fontWeight: 800,
        fontSize: Math.max(34, Math.round(d * 0.56)),
        opacity: pBadge,
        scale: String(0.7 + 0.3 * pBadge),
        ...numeros,
      }}
    >
      {badge.n}
    </div>
  ) : null;

  // médio: título + duração e horário (sem duração: o título maior, até 2 linhas)
  if (h >= 136) {
    const largura = w - 2 * pad - Math.max(espacoBadge, reserva);
    if (b.qualitativo) {
      const e = encaixar(b.titulo, { largura, max: 64, min: 40, linhas: 2, altura: h - 2 * 22, entrelinha: 1.04 });
      const alto = e.linhas.length * e.tamanho * 1.04;
      return (
        <>
          <div style={{ position: "absolute", left: pad, top: (h - alto) / 2 - 2, width: largura, fontFamily: sans, color: texto, opacity: opacidade }}>
            <Linhas linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} entrelinha={1.04} esboco={apagado} espacamento="-0.01em" />
          </div>
          {Badge}
        </>
      );
    }
    const antigo = Math.max(44, Math.min(58, Math.floor(largura / (Math.max(b.titulo.length, 4) * 0.62))));
    const e = encaixar(b.titulo, { largura, max: antigo, min: 38, linhas: 2, entrelinha: 1.05 });
    return (
      <>
        <div style={{ position: "absolute", left: pad, top: Math.min(pad, (h - 120) / 2), width: largura, fontFamily: sans, color: texto, opacity: opacidade }}>
          <Linhas linhas={e.linhas} tempos={tempos} t={t} tamanho={e.tamanho} entrelinha={1.05} esboco={apagado} espacamento="-0.01em" />
          <div style={{ marginTop: 8, fontSize: 38, fontWeight: 600, opacity: faixaPronta ? 0.85 : 0.35, whiteSpace: "nowrap", ...numeros }}>
            {duracao(b, t)}
            {w - reserva >= 520 ? <span style={{ opacity: 0.7 }}>{`  ·  ${hora}`}</span> : null}
          </div>
        </div>
        {Badge}
      </>
    );
  }

  // pequeno: uma linha (o título diminui até caber; a duração some se faltar lugar)
  if (h >= 64) {
    const durTexto = duracao(b, t);
    const larguraDur = durTexto && w >= 300 ? medir(durTexto, 36, { peso: 600, tabular: true }) + 16 : 0;
    const largura = w - 2 * pad - espacoBadge - larguraDur;
    const tamanho = Math.max(32, Math.min(44, Math.min(h - 18, Math.floor(44 * (largura / Math.max(1, medir(b.titulo, 44)))))));
    return (
      <>
        <div
          style={{
            position: "absolute",
            left: pad,
            right: pad + espacoBadge,
            top: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            fontFamily: sans,
            color: texto,
            opacity: opacidade,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <Linhas linhas={[b.titulo.split(/\s+/).filter(Boolean)]} tempos={tempos} t={t} tamanho={tamanho} entrelinha={1.1} esboco={apagado} espacamento="0em" />
          {larguraDur ? <span style={{ fontSize: 36, fontWeight: 600, opacity: 0.85, ...numeros }}>{durTexto}</span> : null}
        </div>
        {Badge}
      </>
    );
  }
  return Badge;
};

// horário do bloco ("09:00 – 09:25"), que acompanha a faixa quando ela estica
const HoraDoBloco: React.FC<{ b: BlocoNaAgenda; t: number; inicioAgenda: number; cor: string }> = ({ b, t, inicioAgenda, cor: c }) => {
  if (b.qualitativo) return <div style={{ fontSize: 40, fontWeight: 600, color: c, whiteSpace: "nowrap", ...numeros }}>{b.quando}</div>;
  const de = inicioAgenda + b.inicio;
  const ate = de + minutosAgora(b, t);
  return <div style={{ fontSize: 40, fontWeight: 600, color: c, whiteSpace: "nowrap", ...numeros }}>{`${escreverHora(de)} – ${escreverHora(ate)}`}</div>;
};
