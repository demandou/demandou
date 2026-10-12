// Frontispício: a folha de papel da abertura e do fechamento. No quadro deitado (16:9) ela é uma coluna da
// esquerda, da altura do quadro, e a pessoa fica em tela cheia ao lado (rosto livre, à direita da folha);
// o título se monta palavra por palavra.
import { impressao, prog, temposDoTexto, TextoFalado } from "../anim";
import { encaixar, type Fonte, larguraTexto } from "../medida";
import type { Abertura as AberturaT, Cta as CtaT, Palavra, Plano } from "../plano";
import { BASE, BASE_COM_LEGENDA, cor, FOLHA, H as ALTURA_QUADRO, LARGURA_FOLHA, MARGEM, rotulo, serif, staticPapel } from "../tema";
import { indicesDoTrecho, LinhasFaladas, palavrasDoTexto } from "./Texto";

const TITULO: Fonte = { familia: "serif", peso: 700 };
const CHAMADA: Fonte = { familia: "serif", peso: 800 };
// as linhas marcadas com " / " cabem na largura? (senão o corpo diminui até caber)
const caberLinhas = (linhas: string[], largura: number, corpo: number, fonte: Fonte, minimo = 40) => {
  let c = corpo;
  while (c > minimo && linhas.some((l) => larguraTexto(l, c, fonte) > largura)) c -= 2;
  return c;
};

// O papel do frontispício: uma coluna da esquerda, da altura do quadro, com a borda da direita sombreando o vídeo.
// O conteúdo começa em `topo` (as coordenadas dos blocos contam a partir dali, como no vertical).
export const FolhaDeBaixo: React.FC<{ topo: number; children: React.ReactNode }> = ({ topo, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: FOLHA.w, height: ALTURA_QUADRO, backgroundColor: cor.papel, boxShadow: "10px 0 34px rgba(20,16,22,0.28)" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: staticPapel(), backgroundSize: "512px 512px" }} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(27,26,31,0.10) 0px, rgba(27,26,31,0) 70px)" }} />
    <div style={{ position: "absolute", left: 0, top: topo, width: FOLHA.w, height: ALTURA_QUADRO - topo }}>{children}</div>
  </div>
);

const Letreiro: React.FC<{ texto: string; t: number; em: number }> = ({ texto, t, em }) => (
  <div style={{ position: "absolute", left: MARGEM, top: 36, width: LARGURA_FOLHA, ...impressao(t, em) }}>
    <div style={{ ...rotulo, color: cor.cinza }}>{texto}</div>
    <div style={{ marginTop: 20, height: 2.5, width: `${prog(t, em, 0.6) * 100}%`, background: cor.tinta, opacity: 0.75 }} />
  </div>
);

export const Abertura: React.FC<{ m: AberturaT; t: number; topo: number; palavras: Palavra[]; marca?: Plano["marca"] }> = ({ m, t, topo, palavras, marca }) => {
  // `texto`/`destaque` são os campos universais; `titulo`/`enfase`, os nomes antigos
  const titulo = (m.texto ?? m.titulo ?? "").trim();
  const destaque = m.destaque ?? m.enfase;
  const inicio = m.em ?? m.de;
  const temposTitulo = temposDoTexto(titulo, palavras, m.de, m.ate, inicio);
  const ultimoTitulo = [...temposTitulo].reverse().find((x) => x !== undefined) ?? m.de;
  const temposSub = m.subtitulo ? temposDoTexto(m.subtitulo, palavras, ultimoTitulo, m.ate, ultimoTitulo) : [];
  // a página é preenchida de cima a baixo: letreiro, número + título, subtítulo
  const H = (m.legenda ? BASE_COM_LEGENDA : BASE) - topo;
  const yBloco = 112;
  const linhasSubMarcadas = m.subtitulo ? m.subtitulo.split(" / ") : [];
  let corpoSub = m.subtitulo ? Math.max(50, Math.min(72, Math.floor(LARGURA_FOLHA / (m.subtitulo.replace(/ \/ /g, " ").length * 0.52)))) : 0;
  // o subtítulo sem marcas de quebra cabe em até duas linhas (medido)
  const encSub = m.subtitulo && linhasSubMarcadas.length === 1 ? encaixar(m.subtitulo, { largura: LARGURA_FOLHA, max: corpoSub, min: 44, linhas: 2, fonte: { familia: "serif", peso: 400 } }) : null;
  if (encSub) corpoSub = encSub.corpo;
  else if (m.subtitulo) corpoSub = caberLinhas(linhasSubMarcadas, LARGURA_FOLHA, corpoSub, { familia: "serif", peso: 400 }, 44);
  const linhasSub = encSub ? encSub.linhas.length : linhasSubMarcadas.length;
  const alturaSub = m.subtitulo ? linhasSub * corpoSub * 1.15 + 34 : 0;
  const alturaBloco = Math.max(200, Math.min(330, H - yBloco - alturaSub - 16));
  const corpoNumero = m.numero ? Math.round(alturaBloco / 0.9) : 0;
  const larguraNumero = m.numero ? m.numero.texto.length * corpoNumero * 0.6 + 36 : 0;
  const larguraTitulo = LARGURA_FOLHA - larguraNumero - (m.numero ? 36 : 0);
  // linhas do título: as marcadas com " / " (tamanho do exemplo aprovado, conferido pela medida)
  // ou, sem marca, o texto encaixado em até três linhas no maior corpo que cabe
  const linhas = titulo.split(" / ");
  const marcado = linhas.length > 1;
  const maiorLinha = Math.max(...linhas.map((l) => l.length), 1);
  const corpoMarcado = caberLinhas(linhas, larguraTitulo, Math.max(64, Math.min(124, Math.floor(larguraTitulo / (maiorLinha * 0.62)), Math.floor(alturaBloco / (Math.max(2, linhas.length) * 1.06)))), TITULO, 48);
  const encTitulo = marcado ? null : encaixar(titulo, { largura: larguraTitulo, max: 124, min: 56, linhas: 3, altura: alturaBloco, entrelinha: 1.04, fonte: TITULO });
  const corpoTitulo = encTitulo ? encTitulo.corpo : corpoMarcado;
  const enfase = { fontStyle: "italic", color: cor.ameixa } as React.CSSProperties;
  const pNumero = m.numero ? prog(t, m.numero.em - 0.02, 0.32) : 0;
  const letreiro = m.rotulo ?? (marca ? [marca.nome, marca.area].filter(Boolean).join(" · ") : "");
  return (
    <>
      {letreiro ? <Letreiro texto={letreiro} t={t} em={m.de + 0.25} /> : null}
      <div style={{ position: "absolute", left: MARGEM, top: yBloco, width: LARGURA_FOLHA, height: alturaBloco, display: "flex", alignItems: "center" }}>
        {m.numero ? (
          <div
            style={{
              width: larguraNumero,
              height: alturaBloco,
              flex: "none",
              display: "flex",
              alignItems: "center",
              fontFamily: serif,
              fontWeight: 800,
              fontSize: corpoNumero,
              lineHeight: 0.9,
              color: cor.ameixa,
              borderRight: `2.5px solid ${cor.fio}`,
              marginRight: 36,
            }}
          >
            {pNumero > 0 ? (
              <span style={{ opacity: pNumero, transform: `translateY(${(1 - pNumero) * 26}px)`, marginTop: -corpoNumero * 0.06 }}>{m.numero.texto}</span>
            ) : (
              // o lugar do número, a lápis, até ele ser dito
              <span style={{ width: larguraNumero - 76, height: corpoNumero * 0.62, borderBottom: `5px dashed ${cor.lapis}` }} />
            )}
          </div>
        ) : null}
        {encTitulo ? (
          <div style={{ flex: 1 }}>
            <LinhasFaladas
              linhas={encTitulo.linhas}
              corpo={corpoTitulo}
              entrelinha={1.04}
              fonte={TITULO}
              tempos={temposTitulo}
              t={t}
              marcadas={indicesDoTrecho(palavrasDoTexto(titulo), destaque)}
              estiloMarcadas={enfase}
              esboco="nada"
            />
          </div>
        ) : (
          <TextoFalado
            texto={titulo}
            tempos={temposTitulo}
            t={t}
            enfase={destaque}
            estiloEnfase={enfase}
            style={{ fontFamily: serif, fontWeight: 700, fontSize: corpoTitulo, lineHeight: 1.04, color: cor.tinta, flex: 1, rowGap: 2 }}
          />
        )}
      </div>
      {m.subtitulo ? (
        <div style={{ position: "absolute", left: MARGEM, top: yBloco + alturaBloco + 30, width: LARGURA_FOLHA }}>
          <TextoFalado
            texto={encSub ? encSub.linhas.join(" / ") : m.subtitulo}
            tempos={encSub ? temposDoTexto(encSub.linhas.join(" / "), palavras, ultimoTitulo, m.ate, ultimoTitulo) : temposSub}
            t={t}
            enfase={destaque}
            estiloEnfase={enfase}
            style={{ fontFamily: serif, fontWeight: 400, fontSize: corpoSub, lineHeight: 1.15, color: cor.tinta }}
          />
        </div>
      ) : null}
    </>
  );
};

// Fita marcadora do livro (o "salvar"): cai da borda da página e assenta, com a ponta em V
// (no quadro deitado a folha começa no topo do quadro: `acima` é a distância da borda dela até o conteúdo)
const Fita: React.FC<{ t: number; em: number; x: number; comprimento: number; acima?: number }> = ({ t, em, x, comprimento, acima = 0 }) => {
  const p = prog(t, em - 0.05, 0.55);
  const balanço = Math.sin(Math.max(0, t - em - 0.5) * 1.6) * 0.6 * prog(t, em + 0.4, 0.6);
  const L = comprimento * p;
  const largura = 76;
  return (
    <div style={{ position: "absolute", left: x, top: -26 - acima, width: largura, height: L + 40, transformOrigin: "50% 0%", transform: `rotate(${balanço}deg)` }}>
      <svg width={largura} height={L + 40} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="cetim" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#4A1E40" />
            <stop offset="0.45" stopColor={cor.ameixa} />
            <stop offset="0.7" stopColor="#6C3460" />
            <stop offset="1" stopColor="#4A1E40" />
          </linearGradient>
        </defs>
        {L > 30 ? (
          <path d={`M 0 0 L ${largura} 0 L ${largura} ${L} L ${largura / 2} ${L - 30} L 0 ${L} Z`} fill="url(#cetim)" />
        ) : null}
        {/* a dobra por cima da borda da página */}
        <rect x={0} y={0} width={largura} height={30} fill="#3E1836" opacity={p > 0 ? 1 : 0} />
      </svg>
    </div>
  );
};

// Ícone da chamada (seguir, comentar, link), em traço ameixa no canto da folha
const Icone: React.FC<{ tipo: "seguir" | "comentar" | "link"; t: number; em: number }> = ({ tipo, t, em }) => (
  <div style={{ position: "absolute", right: 70, top: 120, ...impressao(t, em) }}>
    <svg width={150} height={150} viewBox="0 0 100 100">
      {tipo === "seguir" ? (
        <>
          <circle cx={50} cy={50} r={44} fill="none" stroke={cor.ameixa} strokeWidth={6} />
          <path d="M 50 30 L 50 70 M 30 50 L 70 50" stroke={cor.ameixa} strokeWidth={7} strokeLinecap="round" />
        </>
      ) : tipo === "comentar" ? (
        <path d="M 14 22 H 86 V 66 H 46 L 28 82 V 66 H 14 Z" fill="none" stroke={cor.ameixa} strokeWidth={6} strokeLinejoin="round" />
      ) : (
        // link: a folha com a seta de remissão saindo dela ("ver")
        <>
          <path d="M 44 18 H 18 V 82 H 82 V 56" fill="none" stroke={cor.ameixa} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
          <path d="M 46 54 L 84 16 M 58 16 H 84 V 42" fill="none" stroke={cor.ameixa} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
    </svg>
  </div>
);

export const Cta: React.FC<{ m: CtaT; t: number; topo: number; palavras: Palavra[]; marca: Plano["marca"] }> = ({ m, t, topo, palavras, marca }) => {
  const inicio = m.em ?? m.de;
  const destaque = m.destaque ?? m.enfase;
  const icone = m.icone ?? "salvar";
  // a chamada para antes da fita (ou do ícone) na borda direita da folha
  const xFita = FOLHA.w - 200;
  const larguraTexto = icone === "salvar" ? xFita - MARGEM - 30 : FOLHA.w - 70 - 150 - MARGEM - 20;
  const assinatura = [marca.nome, marca.area].filter(Boolean).join(" · ");
  const base = (m.legenda ? BASE_COM_LEGENDA : BASE) - topo;
  const marcaIcone = (em: number) =>
    icone === "salvar" ? <Fita t={t} em={em} x={xFita} comprimento={topo + Math.min(470, base - 30)} acima={topo} /> : <Icone tipo={icone} t={t} em={em} />;

  // sem palavra de ordem: a chamada inteira vira o título da folha, medida para caber
  if (!m.chamada) {
    const e = encaixar(m.texto, { largura: larguraTexto, max: 124, min: 56, linhas: 3, altura: base - 106 - 24, entrelinha: 1.06, fonte: CHAMADA });
    const tempos = temposDoTexto(palavrasDoTexto(m.texto).join(" "), palavras, m.de, m.ate, inicio);
    return (
      <>
        {assinatura ? <Letreiro texto={assinatura} t={t} em={m.de + 0.15} /> : null}
        {marcaIcone(tempos[0] ?? inicio)}
        <div style={{ position: "absolute", left: MARGEM, top: 36 + 70, width: larguraTexto }}>
          <LinhasFaladas
            linhas={e.linhas}
            corpo={e.corpo}
            entrelinha={1.06}
            fonte={CHAMADA}
            tempos={tempos}
            t={t}
            marcadas={indicesDoTrecho(palavrasDoTexto(m.texto), destaque)}
            estiloMarcadas={{ fontStyle: "italic", color: cor.ameixa }}
            esboco="nada"
          />
        </div>
      </>
    );
  }

  const temposChamada = temposDoTexto(m.chamada, palavras, m.de, m.ate, inicio);
  const temposTexto = m.texto ? temposDoTexto(m.texto, palavras, m.de, m.ate, temposChamada[temposChamada.length - 1] ?? m.de) : [];
  const corpoChamada = caberLinhas([m.chamada], larguraTexto, Math.min(160, Math.floor(larguraTexto / (m.chamada.length * 0.58))), CHAMADA, 60);
  // o resto da chamada em duas linhas
  const linhasTexto = (m.texto ?? "").split(" / ");
  const maiorTexto = Math.max(...linhasTexto.map((l) => l.length), linhasTexto.length === 1 ? (m.texto?.length ?? 1) / 2 : 1);
  const corpoTexto = Math.max(50, Math.min(66, Math.floor(larguraTexto / (maiorTexto * 0.52))));
  return (
    <>
      {assinatura ? <Letreiro texto={assinatura} t={t} em={m.de + 0.15} /> : null}
      {marcaIcone(temposChamada[0] ?? m.de)}
      <div style={{ position: "absolute", left: MARGEM, top: 36 + 70, width: larguraTexto }}>
        <TextoFalado
          texto={m.chamada}
          tempos={temposChamada}
          t={t}
          style={{ fontFamily: serif, fontWeight: 800, fontSize: corpoChamada, lineHeight: 1, color: cor.tinta }}
        />
        {m.texto ? (
          <TextoFalado
            texto={m.texto}
            tempos={temposTexto}
            t={t}
            enfase={destaque}
            estiloEnfase={{ fontStyle: "italic", color: cor.ameixa }}
            style={{ fontFamily: serif, fontWeight: 400, fontSize: corpoTexto, lineHeight: 1.16, color: cor.tinta, marginTop: 26 }}
          />
        ) : null}
      </div>
    </>
  );
};
