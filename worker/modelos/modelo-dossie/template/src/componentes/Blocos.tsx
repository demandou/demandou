// Os 11 blocos universais desenhados como peças do quadro de investigação:
// abertura = pasta que abre com carimbo · topicos = fichas presas em sequência · passos = fichas ligadas
// pelo fio na ordem · numero = etiqueta "PROVA Nº" com o número contando · comparacao = duas fichas de
// suspeito · grafico = gráfico impresso preso com fita · destaque = memorando com o carimbo ·
// definicao = verbete datilografado · frase = recorte de jornal · pergunta = post-it com "?" circulado
// a caneta · cta = a pasta que fecha com o carimbo.
import { acaso, aPartirDe, Datilo, Falado, limitar, prog, temposDoTexto, viaja } from "../anim";
import { encaixar, encaixarBloco, formatarNumero, numeroCurto, trechoNoTexto } from "../medida";
import { imagemDoPlano } from "../motor/imagem";
import type { Peca, Som } from "../mundo";
import type { Abertura, Comparacao, Cta, Definicao, Destaque, Frase, Grafico, Numero, Passos, Pergunta, Plano, Topicos } from "../plano";
import { COR, ELITE, MARCADOR, SORA } from "../tema";
import { Carimbo, Clipe, Fita, Folha, Icone, Pino, Polaroide, Rotulo, alturaPolaroide, medirCarimbo } from "./Pecas";

// ——— peças comuns aos blocos ———

// Rótulo de etiquetadora: fita de tinta com letras de máquina (título curto de lista, comparação…)
const Fitilho: React.FC<{ texto: string; x: number; y: number; t: number; em: number; largura: number }> = ({ texto, x, y, t, em, largura }) => {
  const fit = encaixar(texto.toUpperCase(), { largura: largura - 48, max: 36, min: 24, linhas: 1, fonte: { elite: true, espacamento: 0.1 } });
  const p = prog(t, em, 0.3);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        padding: "12px 24px 10px",
        background: COR.tinta,
        color: COR.papel,
        fontFamily: ELITE,
        fontSize: fit.tamanho,
        letterSpacing: "0.1em",
        whiteSpace: "nowrap",
        rotate: "-1.5deg",
        boxShadow: "0 4px 8px rgba(0,0,0,0.45)",
        opacity: p,
      }}
    >
      <Datilo texto={fit.linhas.join(" ")} em={em} t={t} />
    </div>
  );
};

// Linha de fio dentro de uma peça (passos, comparação): mesma curva e cor do fio do quadro.
const FioLocal: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; p: number; w: number; h: number }> = ({ a, b, p, w, h }) => {
  if (p <= 0) return null;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const c = { x: (a.x + b.x) / 2 + Math.min(60, dist * 0.08), y: (a.y + b.y) / 2 + Math.min(40, dist * 0.05) };
  const c1 = { x: a.x + (c.x - a.x) * p, y: a.y + (c.y - a.y) * p };
  const c2 = { x: c.x + (b.x - c.x) * p, y: c.y + (b.y - c.y) * p };
  const fim = { x: c1.x + (c2.x - c1.x) * p, y: c1.y + (c2.y - c1.y) * p };
  const d = `M ${a.x} ${a.y} Q ${c1.x} ${c1.y} ${fim.x} ${fim.y}`;
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.42)" strokeWidth={13} strokeLinecap="round" transform="translate(6 10)" />
      <path d={d} fill="none" stroke={COR.fio} strokeWidth={9} strokeLinecap="round" />
      <path d={d} fill="none" stroke={COR.fioLuz} strokeWidth={3} strokeLinecap="round" strokeDasharray="11 13" opacity={0.85} />
    </svg>
  );
};

// a peça entra (assenta) no seu instante: cai um pouco de cima e encosta
const entrada = (t: number, em: number) => {
  const p = prog(t, em - 0.08, 0.36);
  return { opacity: limitar((t - em + 0.08) / 0.1), transform: p < 1 ? `translateY(${(1 - p) * -26}px) scale(${1 + 0.06 * (1 - p)})` : undefined };
};

// ——— a pasta (abertura e cta) ———

const PW = 880;
const PH = 800;
const ABA = 56;

const Pasta: React.FC<{ abre: number; rotulo: string; interior: React.ReactNode; capa: React.ReactNode }> = ({ abre, rotulo, interior, capa }) => {
  const angulo = abre * 178;
  return (
    <>
      {/* a aba fica no fundo da pasta */}
      <div style={{ position: "absolute", left: 44, top: 0, width: 300, height: ABA + 20, borderRadius: "16px 16px 0 0", background: COR.manilaEscuro, boxShadow: "0 6px 14px rgba(0,0,0,0.4)" }}>
        <div style={{ position: "absolute", left: 28, top: 18, fontFamily: ELITE, fontSize: 28, letterSpacing: "0.14em", textTransform: "uppercase", color: "#3B2E1E", whiteSpace: "nowrap" }}>{rotulo}</div>
      </div>
      <Folha w={PW} h={PH - ABA} cor={COR.manilaEscuro} style={{ left: 0, top: ABA, borderRadius: 10 }} grao={0.7} />
      {interior}
      {angulo < 90 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: ABA,
            width: PW,
            height: PH - ABA,
            transformOrigin: "50% 0",
            transform: angulo > 0.5 ? `perspective(4200px) rotateX(${angulo}deg)` : undefined,
            backfaceVisibility: "hidden",
          }}
        >
          <Folha w={PW} h={PH - ABA} cor={COR.manila} grao={0.75} style={{ borderRadius: 10 }}>
            {/* vinco da capa */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 26, height: 2, background: "rgba(80,58,30,0.25)" }} />
            {capa}
            {/* sombra que escurece a capa enquanto ela levanta */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: `rgba(30,20,10,${(angulo / 90) * 0.35})` }} />
          </Folha>
        </div>
      ) : null}
    </>
  );
};

const temposDaPagina = (texto: string, plano: Plano, de: number, ate: number, inicio: number) =>
  aPartirDe(temposDoTexto(texto, plano.palavras, de, ate, inicio), inicio);

// O relatório dentro da pasta (título, carimbo, polaroide). Usado pela abertura e, já pronto, pelo cta.
const Relatorio: React.FC<{ m: Abertura; plano: Plano; t: number }> = ({ m, plano, t }) => {
  const img = m.imagem ? imagemDoPlano(plano, m.imagem) : null;
  const W = 800;
  const fit = encaixarBloco(m.texto, { largura: 712, altura: 300, max: 108, min: 54, maxLinhas: 3, entrelinha: 1.04, fonte: { peso: 800 } });
  const inicio = m.em ?? m.de;
  const tempos = temposDaPagina(m.texto, plano, m.de, m.ate, inicio);
  const enfase = trechoNoTexto(m.texto, m.destaque);
  const carimbo = medirCarimbo(m.carimbo ?? "Confidencial", img ? 400 : 640, 60, 40);
  const carimboEm = m.carimboEm ?? Math.max((m.abreEm ?? m.de + 0.15) + 0.6, inicio - 0.15);
  const imagemEm = m.imagemEm ?? (tempos[tempos.length - 1] ?? inicio) + 0.3;
  const foto = prog(t, imagemEm - 0.06, 0.38);
  return (
    <Folha w={W} h={690} style={{ left: 40, top: ABA + 30, rotate: "-0.6deg" }}>
      <div style={{ position: "absolute", left: 44, top: 40 }}>
        <Rotulo tamanho={28}>Relatório</Rotulo>
      </div>
      <div style={{ position: "absolute", left: 44, right: 44, top: 84, height: 3, background: COR.tinta }} />
      <div style={{ position: "absolute", left: 44, top: 112, width: 712, fontFamily: SORA }}>
        <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={800} entrelinha={1.04} enfase={enfase} />
      </div>
      <div style={{ position: "absolute", left: img ? 36 : 0, right: img ? undefined : 0, top: 470, display: "flex", justifyContent: "center", width: img ? 400 : undefined }}>
        <Carimbo linhas={carimbo.linhas} corpo={carimbo.tamanho} em={carimboEm} t={t} rot={-7} semente={2} />
      </div>
      {img && foto > 0 ? (
        <div style={{ position: "absolute", left: 452, top: 360, rotate: "5deg", opacity: limitar(foto * 3), transform: `scale(${1 + 0.12 * (1 - foto)})` }}>
          <Polaroide w={300} imagem={img} palavra={img.palavra ?? ""} t={t} desde={imagemEm} />
          <Clipe x={150} y={4} rot={4} />
        </div>
      ) : null}
    </Folha>
  );
};

// abertura: a pasta já está no quadro no quadro 0; a capa abre e o relatório se escreve na fala
export const pecaAbertura = (m: Abertura, plano: Plano): Peca => {
  const abreEm = m.abreEm ?? m.de + 0.15;
  const fitRotulo = encaixar((m.rotulo ?? "Dossiê").toUpperCase(), { largura: 470, max: 92, min: 48, linhas: 1, fonte: { peso: 800, espacamento: 0.16 } });
  const sons: Som[] = [{ em: abreEm, arquivo: "sfx/pasta.wav", volume: 0.42 }];
  const carimboEm = m.carimboEm ?? Math.max(abreEm + 0.6, (m.em ?? m.de) - 0.15);
  return {
    w: PW,
    h: PH,
    pino: { x: PW / 2, y: ABA + 24 },
    // a pasta abre e fecha o vídeo: enquadrada um pouco mais perto que as provas
    zoom: 1.1,
    ancoras: { esq: { x: 30, y: ABA + 24 }, dir: { x: PW - 30, y: ABA + 24 }, baixo: { x: PW / 2, y: PH - 20 } },
    batidas: [carimboEm],
    sons,
    desenhar: (t) => (
      <Pasta
        abre={viaja(limitar((t - abreEm) / 0.62))}
        rotulo={m.rotulo ?? "Dossiê"}
        interior={<Relatorio m={m} plano={plano} t={t} />}
        capa={
          <>
            <div style={{ position: "absolute", left: 150, top: 150, width: 580, height: 230, background: COR.papel, boxShadow: "0 2px 4px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: fitRotulo.tamanho, letterSpacing: "0.16em", color: COR.tinta, marginRight: "-0.16em" }}>{fitRotulo.linhas[0]}</div>
              <div style={{ width: 420, height: 2, background: COR.tinta, opacity: 0.6 }} />
            </div>
            {/* elástico da pasta */}
            <div style={{ position: "absolute", right: 90, top: -4, width: 16, height: PH - ABA + 8, background: "linear-gradient(90deg, #3B2A1C, #5A4230 50%, #3B2A1C)", boxShadow: "0 2px 4px rgba(0,0,0,0.35)" }} />
          </>
        }
      />
    ),
  };
};

// cta: a câmera volta para a pasta (ou chega numa pasta nova), a capa fecha e o carimbo bate
const CARIMBO_CTA = { salvar: "Salve este caso", seguir: "Siga o caso", comentar: "Comente", link: "Link na bio" } as const;
export const pecaCta = (m: Cta, plano: Plano, abertura?: Abertura): Peca => {
  const em = m.em ?? m.de;
  const img = m.imagem ? imagemDoPlano(plano, m.imagem) : null;
  const icone = m.icone ?? "salvar";
  const larguraTexto = img ? 470 : 760;
  const fit = encaixarBloco(m.texto, { largura: larguraTexto, altura: 300, max: 96, min: 50, maxLinhas: 4, entrelinha: 1.05, fonte: { peso: 800 } });
  const tempos = temposDaPagina(m.texto, plano, m.de - 0.3, m.ate + 1, em + 0.45);
  const enfase = trechoNoTexto(m.texto, m.destaque);
  const carimboEm = m.carimboEm ?? (tempos[tempos.length - 1] ?? em) + 0.35;
  const carimbo = medirCarimbo(m.carimbo ?? CARIMBO_CTA[icone], img ? 420 : 560, 54, 36);
  const imagemEm = m.imagemEm ?? (tempos[tempos.length - 1] ?? em) + 0.2;
  const caso = abertura?.texto;
  const fitCaso = caso ? encaixar(caso, { largura: 640, max: 34, min: 24, linhas: 1, fonte: { peso: 700 } }) : null;
  return {
    w: PW,
    h: PH,
    pino: { x: PW / 2, y: ABA + 24 },
    // a pasta abre e fecha o vídeo: enquadrada um pouco mais perto que as provas
    zoom: 1.1,
    ancoras: { esq: { x: 30, y: ABA + 24 }, dir: { x: PW - 30, y: ABA + 24 }, baixo: { x: PW / 2, y: PH - 20 } },
    batidas: [carimboEm],
    sons: [{ em: carimboEm + 0.45, arquivo: "sfx/fim.wav", volume: 0.36 }],
    desenhar: (t) => {
      const fecha = 1 - viaja(limitar((t - em) / 0.5));
      const foto = prog(t, imagemEm - 0.06, 0.38);
      return (
        <Pasta
          abre={fecha}
          rotulo={abertura?.rotulo ?? "Dossiê"}
          interior={abertura ? <Relatorio m={abertura} plano={plano} t={t + 100} /> : <Folha w={800} h={690} style={{ left: 40, top: ABA + 30, rotate: "-0.6deg" }} />}
          capa={
            <>
              {fitCaso ? (
                <div style={{ position: "absolute", left: 60, top: 66, display: "flex", alignItems: "baseline", gap: 18 }}>
                  <Rotulo tamanho={26} cor="#4A3A26">
                    Caso
                  </Rotulo>
                  <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: fitCaso.tamanho, color: "#3B2E1E", whiteSpace: "nowrap" }}>{fitCaso.linhas[0]}</div>
                </div>
              ) : null}
              <div style={{ position: "absolute", left: 60, top: 150, width: larguraTexto, fontFamily: SORA }}>
                <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={800} entrelinha={1.05} enfase={enfase} />
              </div>
              <div style={{ position: "absolute", left: 40, top: 500, width: img ? 440 : 600, display: "flex", justifyContent: "center" }}>
                <Carimbo linhas={carimbo.linhas} corpo={carimbo.tamanho} em={carimboEm} t={t} rot={-6} semente={5} icone={<Icone nome={icone} tamanho={carimbo.tamanho * 1.3} espessura={2.6} />} />
              </div>
              {img && foto > 0 ? (
                <div style={{ position: "absolute", left: 540, top: 170, rotate: "6deg", opacity: limitar(foto * 3), transform: `scale(${1 + 0.12 * (1 - foto)})` }}>
                  <Polaroide w={290} imagem={img} palavra={img.palavra ?? ""} t={t} desde={imagemEm} />
                  <Clipe x={145} y={4} rot={-6} />
                </div>
              ) : null}
            </>
          }
        />
      );
    },
  };
};

// ——— fichas presas em sequência (topicos) e ligadas pelo fio (passos) ———
export const pecaLista = (m: Topicos | Passos, plano: Plano): Peca => {
  const W = 860;
  const itens = m.itens.slice(0, 5);
  const n = itens.length;
  const hTitulo = m.titulo ? 96 : 0;
  const GAP = 24;
  const hCard = Math.round(limitar((800 - hTitulo - (n - 1) * GAP) / n, 118, 212));
  const larguraCard = 780;
  const numerado = m.tipo === "passos";
  const larguraTexto = larguraCard - (numerado ? 190 : 140);
  const fits = itens.map((it) =>
    encaixar(it.texto, { largura: larguraTexto, max: Math.min(58, Math.round(hCard * (it.detalhe ? 0.3 : 0.38))), min: 32, linhas: 2, fonte: { peso: 700 } }),
  );
  const h = hTitulo + n * hCard + (n - 1) * GAP + 20;
  const cards = itens.map((it, i) => {
    const x = 40 + (i % 2 === 0 ? -16 : 22);
    const y = hTitulo + i * (hCard + GAP);
    return { x, y, rot: (acaso(i * 7 + 3) - 0.5) * 2.4, pino: { x: x + 46, y: y + hCard / 2 } };
  });
  return {
    w: W,
    h,
    pino: m.titulo ? { x: 60, y: 40 } : cards[0].pino,
    focos: itens.map((it, i) => ({ em: it.em, x: W / 2, y: cards[i].y + hCard / 2 })),
    desenhar: (t) => (
      <>
        {m.titulo ? <Fitilho texto={m.titulo} x={20} y={10} t={t} em={m.de} largura={W - 40} /> : null}
        {itens.map((it, i) => {
          if (t < it.em - 0.1) return null;
          const c = cards[i];
          const fit = fits[i];
          return (
            <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: larguraCard, height: hCard, rotate: `${c.rot}deg`, ...entrada(t, it.em) }}>
              <Folha w={larguraCard} h={hCard} cor={COR.ficha} grao={0.55}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 18, height: 2, background: "rgba(28,25,21,0.12)" }} />
                {numerado ? (
                  <div style={{ position: "absolute", left: 92, top: 0, bottom: 0, display: "flex", alignItems: "center", fontFamily: ELITE, fontSize: 42, color: COR.grafite }}>{String(i + 1).padStart(2, "0")}</div>
                ) : null}
                <div style={{ position: "absolute", left: numerado ? 170 : 96, right: 30, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: SORA }}>
                  <div style={{ fontWeight: 700, fontSize: fit.tamanho, lineHeight: 1.08, color: COR.tinta }}>
                    {fit.linhas.map((l, k) => (
                      <div key={k}>{l}</div>
                    ))}
                  </div>
                  {it.detalhe ? (
                    <div style={{ marginTop: 8, fontWeight: 500, fontSize: 30, color: COR.grafite, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.detalhe}</div>
                  ) : null}
                </div>
              </Folha>
            </div>
          );
        })}
        {numerado
          ? itens.map((it, i) => (i === 0 ? null : <FioLocal key={`f${i}`} a={cards[i - 1].pino} b={cards[i].pino} p={viaja(limitar((t - it.em + 0.3) / 0.38))} w={W} h={h} />))
          : null}
        {itens.map((it, i) => (
          <Pino key={`p${i}`} x={cards[i].pino.x} y={cards[i].pino.y} p={prog(t, it.em, 0.2)} tamanho={30} />
        ))}
      </>
    ),
  };
};

// ——— etiqueta de prova com o número contando ———
export const pecaNumero = (m: Numero, plano: Plano): Peca => {
  const W = 760;
  const H = 700;
  const casas = m.casas ?? 0;
  const texto = (v: number) => `${m.prefixo ?? ""}${formatarNumero(v, casas)}${m.sufixo ?? ""}`;
  const fit = encaixar(texto(m.valor), { largura: 640, max: 210, min: 80, linhas: 1, fonte: { peso: 800 } });
  const rotuloEm = m.rotuloEm ?? m.em + 0.3;
  const fitRotulo = encaixarBloco(m.rotulo, { largura: 620, altura: 150, max: 50, min: 30, maxLinhas: 3, entrelinha: 1.12, fonte: { peso: 600 } });
  const tempos = temposDaPagina(m.rotulo, plano, m.de, m.ate, rotuloEm);
  return {
    w: W,
    h: H,
    pino: { x: W / 2, y: 70 },
    desenhar: (t) => {
      const conta = viaja(limitar((t - m.em) / 1.0));
      const v = m.valor * conta;
      return (
        <>
          <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.45)) drop-shadow(0 18px 26px rgba(0,0,0,0.45))" }}>
            <Folha w={W} h={H} cor={COR.manilaClaro} sombra="none" recorte="polygon(16% 0, 84% 0, 100% 11%, 100% 100%, 0 100%, 0 11%)" />
          </div>
          <div style={{ position: "absolute", left: W / 2 - 30, top: 40, width: 60, height: 60, borderRadius: 30, background: COR.manilaEscuro }} />
          <div style={{ position: "absolute", left: W / 2 - 16, top: 54, width: 32, height: 32, borderRadius: 16, background: "#2B2119" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 140, display: "flex", justifyContent: "center" }}>
            <Rotulo tamanho={36} cor={COR.tinta}>
              Prova Nº
            </Rotulo>
          </div>
          <div style={{ position: "absolute", left: 60, right: 60, top: 196, height: 3, background: COR.tinta }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 220, height: fit.tamanho * 1.15, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: SORA, fontWeight: 800, fontSize: fit.tamanho, color: COR.tinta, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", opacity: prog(t, m.em - 0.05, 0.15) }}>
            {texto(conta >= 1 ? m.valor : casas ? v : Math.round(v))}
          </div>
          <div style={{ position: "absolute", left: 70, top: 240 + fit.tamanho * 1.15, width: 620, fontFamily: SORA, textAlign: "center" }}>
            <Falado linhas={fitRotulo.linhas} tempos={tempos} t={t} tamanho={fitRotulo.tamanho} peso={600} entrelinha={1.12} alinhar="center" />
          </div>
          {m.ilustrativo ? (
            <div style={{ position: "absolute", right: 50, bottom: 40, padding: "8px 14px", border: `2px solid ${COR.tinta}`, opacity: prog(t, m.em + 0.5, 0.3) }}>
              <Rotulo tamanho={24} cor={COR.tinta}>
                Ilustrativo
              </Rotulo>
            </div>
          ) : null}
        </>
      );
    },
  };
};

// ——— duas fichas de suspeito lado a lado ———
export const pecaComparacao = (m: Comparacao): Peca => {
  const W = 880;
  const hTitulo = m.titulo ? 96 : 0;
  const FW = 404;
  const FH = Math.min(660, 800 - hTitulo);
  const H = hTitulo + FH + 30;
  const pos = [
    { x: 16, y: hTitulo + 14, rot: -1.6 },
    { x: 460, y: hTitulo + 26, rot: 1.3 },
  ];
  const fits = m.lados.map((l) => encaixarBloco(l.texto, { largura: FW - 64, altura: FH - 190, max: 58, min: 32, maxLinhas: 7, entrelinha: 1.1, fonte: { peso: 700 } }));
  const rotulos = m.lados.map((l) => encaixar(l.rotulo.toUpperCase(), { largura: FW - 60, max: 38, min: 24, linhas: 1, fonte: { elite: true, espacamento: 0.1 } }));
  const decisivo = m.vencedor !== undefined || m.modo === "errado-certo";
  const vencedor = m.vencedor ?? 1;
  const vencedorEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.8;
  const pinos = pos.map((p) => ({ x: p.x + FW / 2, y: p.y + 30 }));
  return {
    w: W,
    h: H,
    pino: pinos[0],
    focos: m.lados.map((l, i) => ({ em: l.em, x: pos[i].x + FW / 2, y: H / 2 })),
    batidas: decisivo ? [vencedorEm] : [],
    desenhar: (t) => (
      <>
        {m.titulo ? <Fitilho texto={m.titulo} x={20} y={6} t={t} em={m.de} largura={W - 40} /> : null}
        {m.lados.map((l, i) => {
          if (t < l.em - 0.1) return null;
          const perdeu = decisivo && i !== vencedor && t >= vencedorEm;
          const carimbo = m.modo === "errado-certo" ? (i === 0 ? "Falso" : null) : i === vencedor ? "Confirmado" : null;
          const alvoCarimbo = m.modo === "errado-certo" ? 0 : vencedor;
          return (
            <div key={i} style={{ position: "absolute", left: pos[i].x, top: pos[i].y, width: FW, height: FH, rotate: `${pos[i].rot}deg`, ...entrada(t, l.em) }}>
              <Folha w={FW} h={FH} cor={COR.ficha}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 100, background: COR.tinta, display: "flex", alignItems: "flex-end", padding: "0 30px 18px" }}>
                  <span style={{ fontFamily: ELITE, fontSize: rotulos[i].tamanho, letterSpacing: "0.1em", color: COR.papel, whiteSpace: "nowrap" }}>{rotulos[i].linhas[0]}</span>
                </div>
                <div style={{ position: "absolute", left: 32, right: 32, top: 136, fontFamily: SORA, fontWeight: 700, fontSize: fits[i].tamanho, lineHeight: 1.1, color: COR.tinta }}>
                  {fits[i].linhas.map((x, k) => (
                    <div key={k}>{x}</div>
                  ))}
                </div>
                {perdeu ? <div style={{ position: "absolute", inset: 0, background: "rgba(40,30,20,0.16)" }} /> : null}
                {decisivo && carimbo && i === alvoCarimbo ? (
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, display: "flex", justifyContent: "center" }}>
                    <Carimbo linhas={[carimbo]} corpo={encaixar(carimbo.toUpperCase(), { largura: FW - 120, max: 50, min: 30, linhas: 1, fonte: { peso: 800, espacamento: 0.05 } }).tamanho} em={vencedorEm} t={t} rot={-8} semente={i + 7} />
                  </div>
                ) : null}
              </Folha>
            </div>
          );
        })}
        <FioLocal a={pinos[0]} b={pinos[1]} p={viaja(limitar((t - m.lados[1].em + 0.25) / 0.35))} w={W} h={H} />
        {m.lados.map((l, i) => (
          <Pino key={i} x={pinos[i].x} y={pinos[i].y} p={prog(t, l.em, 0.2)} tamanho={32} />
        ))}
      </>
    ),
  };
};

// ——— gráfico impresso preso com fita ———
const TONS = [COR.tinta, "#7A7062", COR.manilaEscuro, "#A9A091", "#4A4238", "#C9BFA9"];
export const pecaGrafico = (m: Grafico, plano: Plano): Peca => {
  const W = 880;
  const H = 780;
  const fitTitulo = m.titulo ? encaixar(m.titulo, { largura: 760, max: 48, min: 30, linhas: 2, fonte: { peso: 700 } }) : null;
  const topo = fitTitulo ? 70 + fitTitulo.linhas.length * fitTitulo.tamanho * 1.1 + 30 : 90;
  const area = { x: 70, y: topo + 40, w: 740, h: H - topo - 40 - 120 };
  const dados = (m.dados ?? []).slice(0, 6);
  const maximo = Math.max(1, ...dados.map((d) => d.valor));
  const fmt = (v: number) => `${numeroCurto(v)}${m.unidade ?? ""}`;
  return {
    w: W,
    h: H,
    pino: { x: W / 2, y: 30 },
    desenhar: (t) => {
      let grafico: React.ReactNode = null;
      if (dados.length && m.forma === "barras") {
        const slot = area.w / dados.length;
        const bw = Math.min(150, slot * 0.58);
        const fitRot = dados.map((d) => encaixar(d.rotulo, { largura: slot - 12, max: 30, min: 20, linhas: 2, fonte: { elite: true } }));
        grafico = (
          <svg width={area.w} height={area.h + 110} style={{ position: "absolute", left: area.x, top: area.y, overflow: "visible" }}>
            <defs>
              <pattern id="hachura" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="14" height="14" fill="#EDE7DA" />
                <line x1="0" y1="0" x2="0" y2="14" stroke={COR.tinta} strokeWidth="6" />
              </pattern>
            </defs>
            <line x1={0} y1={area.h} x2={area.w} y2={area.h} stroke={COR.tinta} strokeWidth={4} />
            {dados.map((d, i) => {
              const p = viaja(limitar((t - d.em) / 0.55));
              const bh = (d.valor / maximo) * (area.h - 90) * p;
              const x = i * slot + (slot - bw) / 2;
              return (
                <g key={i} opacity={t >= d.em - 0.05 ? 1 : 0}>
                  <rect x={x} y={area.h - bh} width={bw} height={bh} fill={i === dados.length - 1 ? COR.tinta : "url(#hachura)"} stroke={COR.tinta} strokeWidth={3} />
                  <text x={x + bw / 2} y={area.h - bh - 18} textAnchor="middle" fontFamily={SORA} fontWeight={800} fontSize={Math.min(52, slot * 0.3)} fill={COR.tinta} opacity={p}>
                    {fmt(d.valor * p)}
                  </text>
                  {fitRot[i].linhas.map((l, k) => (
                    <text key={k} x={i * slot + slot / 2} y={area.h + 44 + k * fitRot[i].tamanho * 1.1} textAnchor="middle" fontFamily={ELITE} fontSize={fitRot[i].tamanho} fill={COR.grafite}>
                      {l}
                    </text>
                  ))}
                </g>
              );
            })}
          </svg>
        );
      } else if (dados.length && m.forma === "pizza") {
        const r = Math.min(area.h, 420) / 2;
        const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
        let acumulado = 0;
        grafico = (
          <>
            <svg width={2 * r + 20} height={2 * r + 20} style={{ position: "absolute", left: area.x, top: area.y + (area.h - 2 * r) / 2 }}>
              {dados.map((d, i) => {
                const fr = d.valor / total;
                const p = viaja(limitar((t - d.em) / 0.5));
                const circ = Math.PI * r;
                const el = (
                  <circle key={i} cx={r + 10} cy={r + 10} r={r / 2} fill="none" stroke={TONS[i % TONS.length]} strokeWidth={r} strokeDasharray={`${fr * p * circ} ${circ}`} strokeDashoffset={-acumulado * circ} transform={`rotate(-90 ${r + 10} ${r + 10})`} />
                );
                acumulado += fr;
                return el;
              })}
              <circle cx={r + 10} cy={r + 10} r={r} fill="none" stroke={COR.tinta} strokeWidth={3} />
            </svg>
            <div style={{ position: "absolute", left: area.x + 2 * r + 60, top: area.y + 20, width: area.w - 2 * r - 60, display: "flex", flexDirection: "column", gap: 22 }}>
              {dados.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, opacity: prog(t, d.em, 0.25) }}>
                  <div style={{ width: 30, height: 30, background: TONS[i % TONS.length], border: `2px solid ${COR.tinta}`, flex: "none" }} />
                  <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 36, color: COR.tinta, lineHeight: 1.1 }}>
                    {fmt(d.valor)} <span style={{ fontWeight: 500, color: COR.grafite }}>{d.rotulo}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      } else {
        // linha com dados, ou a tendência ilustrativa (sem números)
        const pts = dados.length
          ? dados.map((d, i) => ({ x: (i / Math.max(1, dados.length - 1)) * (area.w - 80) + 40, y: area.h - 40 - (d.valor / maximo) * (area.h - 120), em: d.em, d }))
          : (m.tendencia === "cai" ? [0.15, 0.3, 0.42, 0.66, 0.85] : m.tendencia === "oscila" ? [0.5, 0.25, 0.62, 0.3, 0.55] : [0.85, 0.7, 0.55, 0.36, 0.14]).map((f, i) => ({
              x: (i / 4) * (area.w - 80) + 40,
              y: 40 + f * (area.h - 100),
              em: (m.tendenciaEm ?? m.de + 0.3) + i * 0.22,
              d: null,
            }));
        const inicio = pts[0].em;
        const fimLinha = pts[pts.length - 1].em + 0.3;
        const p = limitar((t - inicio) / Math.max(0.3, fimLinha - inicio));
        const d = pts.map((q, i) => `${i ? "L" : "M"} ${q.x} ${q.y}`).join(" ");
        grafico = (
          <svg width={area.w} height={area.h + 60} style={{ position: "absolute", left: area.x, top: area.y, overflow: "visible" }}>
            <line x1={0} y1={area.h} x2={area.w} y2={area.h} stroke={COR.tinta} strokeWidth={4} />
            <line x1={0} y1={0} x2={0} y2={area.h} stroke={COR.tinta} strokeWidth={4} />
            <path d={d} fill="none" stroke={COR.tinta} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} />
            {pts.map((q, i) =>
              t >= q.em ? (
                <g key={i}>
                  <circle cx={q.x} cy={q.y} r={13} fill={COR.papel} stroke={COR.tinta} strokeWidth={6} />
                  {q.d ? (
                    <>
                      <text x={q.x} y={q.y - 30} textAnchor="middle" fontFamily={SORA} fontWeight={800} fontSize={42} fill={COR.tinta}>
                        {fmt(q.d.valor)}
                      </text>
                      <text x={q.x} y={area.h + 46} textAnchor="middle" fontFamily={ELITE} fontSize={28} fill={COR.grafite}>
                        {q.d.rotulo}
                      </text>
                    </>
                  ) : null}
                </g>
              ) : null,
            )}
          </svg>
        );
      }
      const ilustrativo = m.ilustrativo || !dados.length;
      return (
        <>
          <Folha w={W} h={H} cor="#F4F1EA">
            {fitTitulo ? (
              <div style={{ position: "absolute", left: 60, top: 70, width: 760, fontFamily: SORA, fontWeight: 700, fontSize: fitTitulo.tamanho, lineHeight: 1.1, color: COR.tinta }}>
                {fitTitulo.linhas.map((l, k) => (
                  <div key={k}>{l}</div>
                ))}
              </div>
            ) : null}
            {grafico}
            {ilustrativo ? (
              <div style={{ position: "absolute", right: 50, bottom: 36, padding: "8px 14px", border: `2px solid ${COR.tinta}` }}>
                <Rotulo tamanho={24} cor={COR.tinta}>
                  Ilustrativo
                </Rotulo>
              </div>
            ) : null}
          </Folha>
          <Fita x={120} y={10} rot={-12} />
          <Fita x={W - 120} y={10} rot={10} />
        </>
      );
    },
  };
};

// ——— memorando com o carimbo ———
// Grande de propósito: no centro do quadro, ele precisa ser lido com a câmera mostrando o quadro inteiro.
export const pecaDestaque = (m: Destaque, plano: Plano): Peca => {
  const W = 1120;
  const carimbo = medirCarimbo(m.texto, 1010, 164, 64);
  const hCarimbo = carimbo.linhas.length * carimbo.tamanho * 1.02 + carimbo.tamanho * 0.9;
  const curto = m.detalhe && m.detalhe.length <= 24;
  const fitDetalhe = m.detalhe
    ? curto
      ? encaixar(m.detalhe.toUpperCase(), { largura: 960, max: 104, min: 48, linhas: 1, fonte: { elite: true, espacamento: 0.1 } })
      : encaixarBloco(m.detalhe, { largura: 960, altura: 220, max: 64, min: 36, maxLinhas: 3, fonte: { peso: 600 } })
    : null;
  const hDetalhe = fitDetalhe ? fitDetalhe.linhas.length * fitDetalhe.tamanho * 1.15 + 30 : 0;
  const H = Math.round(Math.max(640, 150 + hCarimbo + 50 + hDetalhe + 60));
  const detalheEm = m.detalheEm ?? m.em + 0.9;
  const tempos = m.detalhe && !curto ? temposDaPagina(m.detalhe, plano, m.de, m.ate, detalheEm) : [];
  return {
    w: W,
    h: H,
    pino: { x: W / 2, y: 34 },
    batidas: [m.em],
    desenhar: (t) => (
      <Folha w={W} h={H} cor={COR.papel}>
        <div style={{ position: "absolute", left: 60, top: 58 }}>
          <Rotulo tamanho={36}>{(m.nivel ?? "alerta") === "alerta" ? "Alerta" : "Conclusão"}</Rotulo>
        </div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 108, height: 4, background: COR.tinta }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 150, height: hCarimbo + 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Carimbo linhas={carimbo.linhas} corpo={carimbo.tamanho} em={m.em} t={t} rot={-5} semente={11} />
        </div>
        {fitDetalhe ? (
          <div style={{ position: "absolute", left: 80, right: 80, top: 150 + hCarimbo + 50, textAlign: "center" }}>
            {curto ? (
              <Datilo texto={fitDetalhe.linhas[0]} em={detalheEm} t={t} style={{ fontFamily: ELITE, fontSize: fitDetalhe.tamanho, letterSpacing: "0.1em", color: COR.tinta }} />
            ) : (
              <div style={{ fontFamily: SORA }}>
                <Falado linhas={fitDetalhe.linhas} tempos={tempos} t={t} tamanho={fitDetalhe.tamanho} peso={600} entrelinha={1.15} alinhar="center" />
              </div>
            )}
          </div>
        ) : null}
      </Folha>
    ),
  };
};

// ——— verbete datilografado ———
export const pecaDefinicao = (m: Definicao, plano: Plano): Peca => {
  const W = 860;
  const fitTermo = encaixar(m.termo, { largura: 760, max: 110, min: 54, linhas: 2, fonte: { peso: 800 } });
  const hTermo = fitTermo.linhas.length * fitTermo.tamanho * 1.04;
  const fitSig = encaixarBloco(m.significado, { largura: 760, altura: 300, max: 48, min: 30, maxLinhas: 6, entrelinha: 1.18, fonte: { peso: 600 } });
  const hSig = fitSig.linhas.length * fitSig.tamanho * 1.18;
  const H = Math.round(150 + hTermo + 50 + hSig + 70);
  const temposTermo = temposDaPagina(m.termo, plano, m.de, m.ate, m.em);
  const temposSig = temposDaPagina(m.significado, plano, m.de, m.ate, m.significadoEm);
  return {
    w: W,
    h: H,
    pino: { x: W / 2, y: 32 },
    desenhar: (t) => (
      <Folha w={W} h={H} cor={COR.ficha}>
        <div style={{ position: "absolute", left: 50, top: 60 }}>
          <Rotulo tamanho={28}>Verbete</Rotulo>
        </div>
        <div style={{ position: "absolute", left: 50, right: 50, top: 102, height: 3, background: COR.tinta }} />
        <div style={{ position: "absolute", left: 50, top: 140, width: 760, fontFamily: SORA }}>
          <Falado linhas={fitTermo.linhas} tempos={temposTermo} t={t} tamanho={fitTermo.tamanho} peso={800} entrelinha={1.04} />
        </div>
        <div style={{ position: "absolute", left: 50, top: 140 + hTermo + 26, width: 120, height: 6, background: COR.tinta, opacity: prog(t, m.significadoEm - 0.1, 0.3) }} />
        <div style={{ position: "absolute", left: 50, top: 140 + hTermo + 56, width: 760, fontFamily: SORA }}>
          <Falado linhas={fitSig.linhas} tempos={temposSig} t={t} tamanho={fitSig.tamanho} peso={600} entrelinha={1.18} cor="#2E2A24" />
        </div>
      </Folha>
    ),
  };
};

// ——— recorte de jornal ———
const bordaRasgada = (semente: number) => {
  const pts: string[] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${acaso(semente + i) * 2.2}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - acaso(semente + 40 + i) * 1.6}% ${(i / n) * 100}%`);
  for (let i = n; i >= 0; i--) pts.push(`${(i / n) * 100}% ${100 - acaso(semente + 80 + i) * 2.2}%`);
  for (let i = n; i >= 0; i--) pts.push(`${acaso(semente + 120 + i) * 1.6}% ${(i / n) * 100}%`);
  return `polygon(${pts.join(",")})`;
};
export const pecaFrase = (m: Frase, plano: Plano): Peca => {
  const W = 860;
  const fit = encaixarBloco(m.texto, { largura: 720, altura: 440, max: 80, min: 40, maxLinhas: 6, entrelinha: 1.1, fonte: { peso: 700 } });
  const hTexto = fit.linhas.length * fit.tamanho * 1.1;
  const H = Math.round(190 + hTexto + 70);
  const inicio = m.em ?? m.de;
  const tempos = temposDaPagina(m.texto, plano, m.de, m.ate, inicio);
  const enfase = trechoNoTexto(m.texto, m.destaque);
  const risco = trechoNoTexto(m.texto, m.risco);
  return {
    w: W,
    h: H,
    pino: { x: W / 2, y: 36 },
    desenhar: (t) => (
      <Folha w={W} h={H} cor={COR.jornal} recorte={bordaRasgada(Math.round(m.de * 10))} grao={0.8}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 70, height: 3, background: COR.tinta }} />
        <div style={{ position: "absolute", left: 60, right: 60, top: 78, height: 1.5, background: COR.tinta }} />
        <div style={{ position: "absolute", left: 52, top: 70, fontFamily: SORA, fontWeight: 800, fontSize: 190, lineHeight: 1, color: COR.tinta, opacity: 0.9 }}>“</div>
        <div style={{ position: "absolute", left: 70, top: 190, width: 720, fontFamily: SORA }}>
          <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={700} entrelinha={1.1} enfase={enfase} risco={risco} riscoEm={m.riscoEm} />
        </div>
      </Folha>
    ),
  };
};

// ——— post-it com "?" circulado a caneta vermelha ———
export const pecaPergunta = (m: Pergunta, plano: Plano): Peca => {
  const W = 780;
  const H = 780;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const altTexto = opcoes.length ? 230 : 400;
  const fit = encaixarBloco(m.texto, { largura: 680, altura: altTexto, max: 72, min: 36, maxLinhas: 5, entrelinha: 1.08, fonte: { peso: 700 } });
  const hTexto = fit.linhas.length * fit.tamanho * 1.08;
  const inicio = m.em ?? m.de;
  const tempos = temposDaPagina(m.texto, plano, m.de, m.ate, inicio);
  const fitOp = opcoes.map((o) => encaixar(o.texto, { largura: 560, max: 40, min: 26, linhas: 1, fonte: { peso: 600 } }));
  return {
    w: W,
    h: H,
    pino: { x: W / 2, y: 34 },
    focos: opcoes.map((o, i) => ({ em: o.em, x: W / 2, y: 290 + hTexto + i * 70 })),
    desenhar: (t) => {
      const circulo = prog(t, inicio + 0.25, 0.5);
      return (
        <Folha w={W} h={H} cor={COR.postit} grao={0.45}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(120,90,0,0.10) 100%)" }} />
          <div style={{ position: "absolute", left: 70, top: 40, width: 170, height: 210, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MARCADOR, fontSize: 190, color: COR.tinta, lineHeight: 1 }}>?</div>
          <svg width={260} height={260} style={{ position: "absolute", left: 26, top: 16, overflow: "visible" }}>
            <path d="M 210 64 C 180 10, 60 6, 34 80 C 10 150, 60 236, 140 238 C 220 240, 252 160, 226 92 C 216 66, 196 48, 168 40" fill="none" stroke={COR.sangue} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={`${circulo} 1`} opacity={0.92} />
          </svg>
          <div style={{ position: "absolute", left: 50, top: 280, width: 680, fontFamily: SORA }}>
            <Falado linhas={fit.linhas} tempos={tempos} t={t} tamanho={fit.tamanho} peso={700} entrelinha={1.08} />
          </div>
          {opcoes.map((o, i) => (
            <div key={i} style={{ position: "absolute", left: 50, top: 300 + hTexto + i * 70, display: "flex", alignItems: "center", gap: 20, opacity: prog(t, o.em, 0.25) }}>
              <div style={{ width: 46, height: 46, border: `3px solid ${COR.tinta}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ELITE, fontSize: 30, color: COR.tinta }}>{"ABCD"[i]}</div>
              <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: fitOp[i].tamanho, color: COR.tinta, whiteSpace: "nowrap" }}>{o.texto}</div>
            </div>
          ))}
        </Folha>
      );
    },
  };
};

