// Os instrumentos do painel de campo (próprios do Campo):
//   cotacao  — o indicador: foto da coisa + cartão com a variação em mono e o mini-gráfico andando
//   medidor  — o reservatório que vai do cheio até a fração dita, com a marca amarela
//   previsao — a faixa do tempo: o que está chegando varre os quadros da direita
// Tudo entra pousando no painel e continua vivo por dentro (foto se aproxima, água ondula, chuva cai).
import { Easing } from "remotion";
import { formatar, pouso, prog, saindo, soco, suave, temposDoTexto } from "../anim";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { Cotacao as TCotacao, Medidor as TMedidor, Plano, Previsao as TPrevisao } from "../plano";
import { cor, mono, PAINEL, RAIO, sombra } from "../tema";
import { caber, caberMono, caberTitulo, Cartao, Etiqueta, FotoCampo, Icone, IconeClima, Mira, type NomeIcone, Texto } from "./Pecas";

type Comum = { t: number; plano: Plano; fim: number };

const Saida: React.FC<{ t: number; fim: number; children: React.ReactNode }> = ({ t, fim, children }) => {
  const s = saindo(t, fim, 0.14);
  return <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>{children}</div>;
};

// A foto do alto do painel (cotação e medidor): cartão de borda creme, a mira trava quando entra.
// Até o cartão do instrumento pousar (`cartaoEm`), a foto ocupa o painel inteiro; quando ele pousa,
// ela recolhe para a faixa de cima (0,4 s). Assim o painel nunca mostra um cartão esperando dado.
const ALT_FOTO = 372;
const CENTRO_PAINEL = (PAINEL.y + PAINEL.base) / 2;
const ALT_CHEIA = PAINEL.base - PAINEL.y;
const alturaDaFoto = (t: number, cartaoEm: number) => ALT_CHEIA + (ALT_FOTO - ALT_CHEIA) * prog(t, cartaoEm - 0.05, 0.4, suave);
const FotoDoAlto: React.FC<{
  t: number;
  plano: Plano;
  m: { imagem?: TCotacao["imagem"]; de: number };
  em: number;
  cartaoEm: number;
  fim: number;
  children?: React.ReactNode;
}> = ({ t, plano, m, em, cartaoEm, fim, children }) => {
  const img = imagemDoPlano(plano, m.imagem);
  if (!temImagem(img)) return null;
  const e = pouso(t, em, { de: 1.05, sobe: 16 });
  if (!e.visivel) return null;
  const alt = alturaDaFoto(t, cartaoEm);
  return (
    <>
      <div style={{ position: "absolute", left: PAINEL.x, top: PAINEL.y, width: PAINEL.w, height: alt, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: -6, borderRadius: RAIO + 6, background: cor.cartao, boxShadow: sombra }} />
        <FotoCampo t={t} img={img} w={PAINEL.w} h={alt} inicio={em} fim={fim} />
        {children}
      </div>
      <Mira t={t} em={em + 0.05} x={PAINEL.x} y={PAINEL.y} w={PAINEL.w} h={alt} braco={44} espessura={7} />
    </>
  );
};

// O rótulo que se monta na fala, em mono, numa etiqueta escura sobre a foto (ou no meio do painel).
const RotuloFalado: React.FC<{ t: number; texto: string; tempos: number[]; tamanho: number; fundo: string; icone?: NomeIcone }> = ({ t, texto, tempos, tamanho, fundo, icone }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: tamanho * 0.4,
      padding: `${tamanho * 0.34}px ${tamanho * 0.7}px`,
      borderRadius: tamanho * 0.3,
      background: fundo,
      color: cor.cartao,
      fontFamily: mono,
      fontWeight: 700,
      fontSize: tamanho,
      letterSpacing: "0.04em",
      lineHeight: 1.05,
      whiteSpace: "nowrap",
    }}
  >
    {icone ? <Icone nome={icone} tamanho={tamanho * 1.15} cor={cor.sinal} traco={2.6} /> : null}
    {texto
      .toLocaleUpperCase("pt-BR")
      .split(" ")
      .map((w, i, arr) =>
        t >= (tempos[i] ?? 0) - 0.02 ? (
          <span key={i} style={{ opacity: prog(t, tempos[i] ?? 0, 0.18) }}>
            {w}
            {i < arr.length - 1 && t >= (tempos[i + 1] ?? 0) - 0.02 ? " " : ""}
          </span>
        ) : null,
      )}
  </div>
);

// ——— cotação ———
export const Cotacao: React.FC<Comum & { m: TCotacao }> = ({ t, plano, m, fim }) => {
  const temFoto = temImagem(imagemDoPlano(plano, m.imagem));
  const y = temFoto ? PAINEL.y + ALT_FOTO + 28 : PAINEL.y + 60;
  const h = temFoto ? PAINEL.base - y : Math.min(560, PAINEL.base - y - 60);
  const W = PAINEL.w;
  const sobe = m.direcao !== "cai";
  const corV = sobe ? cor.verde : cor.terra;
  // o cartão do indicador pousa no movimento ("subiu"), já com o gráfico andando; até lá a foto
  // (ou o rótulo grande, sem foto) ocupa o painel
  const cartaoEm = Math.max(m.em, m.sobeEm ?? m.valorEm ?? m.em);
  const e = pouso(t, cartaoEm, { de: 1.04, sobe: 20 });
  const tempos = temposDoTexto(m.rotulo, m.em, plano.palavras, m.sobeEm ?? m.valorEm ?? fim);
  const fRotFoto = caberMono(m.rotulo.toLocaleUpperCase("pt-BR"), W - 140, 40, 24, 1);
  const fRotGrande = caber(m.rotulo, W, 104, 56, 2);
  const pSaiRotulo = prog(t, cartaoEm - 0.05, 0.25);
  const fRot = caberMono(m.rotulo.toLocaleUpperCase("pt-BR"), W - 150, 34, 24, 1);
  const altCab = 82;
  // a variação
  const casas = m.casas ?? 0;
  const valorEm = m.valorEm ?? m.em + 0.6;
  const pC = m.valor !== undefined ? prog(t, valorEm, 0.6, Easing.out(Easing.cubic)) : 0;
  const prefixo = m.prefixo ?? (sobe ? "+" : "−");
  const texto = (v: number) => `${prefixo}${formatar(v, casas)}${m.sufixo ?? "%"}`;
  const colEsq = 480;
  const fV = m.valor !== undefined ? caberMono(texto(m.valor), colEsq - 100, 170, 70, 1) : null;
  const golpe = soco(t, valorEm + 0.6, 0.3);
  // o mini-gráfico
  const gx = colEsq + 10;
  const gw = W - gx - 40;
  const gy = altCab + 40;
  const gh = h - altCab - 80;
  const sobeEm = m.sobeEm ?? valorEm;
  // o gráfico já pousa andando: começa rápido e assenta quando o número bate
  const pG = prog(t, sobeEm, Math.max(0.5, valorEm + 0.5 - sobeEm), Easing.out(Easing.cubic));
  const y0 = sobe ? 0.78 : 0.2;
  const y1 = sobe ? 0.16 : 0.82;
  const ponto = (u: number) => {
    const v = y0 + (y1 - y0) * Easing.inOut(Easing.cubic)(u);
    return { x: gx + u * gw, y: gy + v * gh };
  };
  const n = 48;
  const pts = Array.from({ length: Math.max(2, Math.round(n * pG) + 1) }, (_, i) => ponto(Math.min(pG, i / n)));
  const linha = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
  const fimP = pts[pts.length - 1];
  const area = `${linha}L${fimP.x},${gy + gh}L${gx},${gy + gh}Z`;
  const pPer = m.periodo && m.periodoEm !== undefined ? pouso(t, m.periodoEm, { de: 1.1, sobe: 10 }) : null;
  return (
    <Saida t={t} fim={fim}>
      <FotoDoAlto t={t} plano={plano} m={m} em={m.em} cartaoEm={cartaoEm} fim={fim}>
        {pSaiRotulo < 1 ? (
          <div style={{ position: "absolute", left: 30, bottom: 30, opacity: 1 - pSaiRotulo }}>
            <RotuloFalado t={t} texto={m.rotulo} tempos={tempos} tamanho={fRotFoto.tamanho} fundo={cor.verdeEscuro} icone={sobe ? "sobe" : "cai"} />
          </div>
        ) : null}
      </FotoDoAlto>
      {!temFoto && pSaiRotulo < 1 && t >= m.em - 0.02 ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: W, top: CENTRO_PAINEL - (fRotGrande.linhas.length * fRotGrande.tamanho * 1.16) / 2, opacity: 1 - pSaiRotulo }}>
          <Texto t={t} linhas={fRotGrande.linhas} tamanho={fRotGrande.tamanho} tempos={tempos} />
        </div>
      ) : null}
      {e.visivel ? (
        <Cartao x={PAINEL.x} y={y} w={W} h={h} style={{ opacity: e.opacity, transform: e.transform }}>
          {/* cabeçalho verde com o rótulo (mono) */}
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: altCab, borderRadius: `${RAIO}px ${RAIO}px 0 0`, background: cor.verdeEscuro }} />
          <div style={{ position: "absolute", left: 34, top: (altCab - fRot.tamanho * 1.2) / 2, fontFamily: mono, fontWeight: 700, fontSize: fRot.tamanho, lineHeight: 1.2, color: cor.cartao, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            {m.rotulo
              .toLocaleUpperCase("pt-BR")
              .split(" ")
              .map((w, i, arr) => (
                <span key={i} style={{ opacity: prog(t, tempos[i] ?? m.em, 0.18) }}>
                  {w}
                  {i < arr.length - 1 ? " " : ""}
                </span>
              ))}
          </div>
          <div style={{ position: "absolute", right: 30, top: (altCab - 44) / 2 }}>
            <Icone nome={sobe ? "sobe" : "cai"} tamanho={44} cor={cor.sinal} traco={2.8} />
          </div>
          {/* a variação */}
          {fV ? (
            <div style={{ position: "absolute", left: 40, top: altCab + 40, width: colEsq - 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, transform: golpe ? `scale(${1 + 0.05 * golpe})` : undefined, transformOrigin: "left center" }}>
                <svg width={46} height={46} viewBox="0 0 24 24" style={{ transform: `translateY(${(sobe ? -1 : 1) * Math.abs(Math.sin(t * 4)) * 4}px)` }}>
                  <path d={sobe ? "M12 4l9 14H3z" : "M12 20L3 6h18z"} fill={corV} />
                </svg>
                {t >= valorEm - 0.02 ? (
                  <span style={{ fontFamily: mono, fontWeight: 700, fontSize: fV.tamanho, color: corV, lineHeight: 1, letterSpacing: "-0.03em", whiteSpace: "nowrap", opacity: prog(t, valorEm, 0.12) }}>{texto((m.valor as number) * pC)}</span>
                ) : (
                  <span style={{ display: "inline-block", height: fV.tamanho }} />
                )}
              </div>
            </div>
          ) : null}
          {!fV ? (
            <div style={{ position: "absolute", left: 40, top: altCab + 50 }}>
              <svg width={150} height={150} viewBox="0 0 24 24" style={{ opacity: prog(t, sobeEm, 0.3) }}>
                <path d={sobe ? "M12 4l9 14H3z" : "M12 20L3 6h18z"} fill={corV} />
              </svg>
            </div>
          ) : null}
          {/* o período ("no mês") */}
          {pPer && pPer.visivel ? (
            <div style={{ position: "absolute", left: 40, bottom: 40, opacity: pPer.opacity, transform: pPer.transform }}>
              <Etiqueta texto={m.periodo as string} tamanho={40} fundo={cor.sinal} tinta={cor.tinta} />
            </div>
          ) : null}
          {/* o mini-gráfico: o nível de antes tracejado e a linha que anda até o de agora */}
          <svg width={W} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="cot-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={corV} stopOpacity="0.28" />
                <stop offset="1" stopColor={corV} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((k) => (
              <line key={k} x1={gx} x2={gx + gw} y1={gy + k * gh} y2={gy + k * gh} stroke={cor.linha} strokeWidth={2} />
            ))}
            <line x1={gx} x2={gx + gw} y1={gy + y0 * gh} y2={gy + y0 * gh} stroke={cor.tintaSuave} strokeWidth={3} strokeDasharray="10 10" opacity={prog(t, m.em + 0.2, 0.3)} />
            {pG > 0 ? (
              <>
                <path d={area} fill="url(#cot-area)" />
                <path d={linha} fill="none" stroke={corV} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={fimP.x} cy={fimP.y} r={13 + 3 * Math.sin(t * 6)} fill={cor.cartao} stroke={corV} strokeWidth={6} />
              </>
            ) : null}
          </svg>
          {m.valor === undefined ? (
            <div style={{ position: "absolute", right: 34, bottom: 26 }}>
              <Etiqueta texto="ilustrativo" tamanho={20} fundo={cor.palha} tinta={cor.tintaSuave} />
            </div>
          ) : null}
        </Cartao>
      ) : null}
    </Saida>
  );
};

// ——— medidor ———
const CORES_MEDIDOR = {
  agua: { cheio: cor.ceu, escuro: cor.ceuEscuro, claro: cor.ceuClaro, icone: "gota" as const },
  terra: { cheio: cor.terra, escuro: cor.terraEscura, claro: cor.terraClara, icone: "broto" as const },
  verde: { cheio: cor.verde, escuro: cor.verdeEscuro, claro: cor.verdeClaro, icone: "broto" as const },
};

export const Medidor: React.FC<Comum & { m: TMedidor }> = ({ t, plano, m, fim }) => {
  const paleta = CORES_MEDIDOR[m.cor ?? "agua"];
  const temFoto = temImagem(imagemDoPlano(plano, m.imagem));
  const y = temFoto ? PAINEL.y + ALT_FOTO + 28 : PAINEL.y + 40;
  const h = temFoto ? PAINEL.base - y : PAINEL.base - y - 40;
  const W = PAINEL.w;
  const entra = temFoto ? Math.max(m.de, (m.mudaEm ?? m.fracaoEm) - 0.3) : m.em;
  const cartaoEm = Math.min(entra, m.em + 0.5);
  const e = pouso(t, cartaoEm, { de: 1.04, sobe: 20 });
  // a escala: até 1 (ou até a fração, se ela passa de 1: "o dobro")
  const escala = Math.max(1, m.fracao);
  const ini = 1 / escala;
  const finalN = m.fracao / escala;
  const mudaEm = m.mudaEm ?? m.fracaoEm - 0.5;
  const pN = prog(t, mudaEm, Math.max(0.3, m.fracaoEm - mudaEm + 0.15), suave);
  const nivel = ini + (finalN - ini) * pN;
  // o tanque
  const tx = 44;
  const tw = 290;
  const ty = 84;
  const th = h - ty - 34;
  const agua = th * nivel;
  const onda = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const xx = (i / 24) * tw;
      pts.push(`${xx.toFixed(1)},${(Math.sin(i / 24 * Math.PI * 3 + t * 4 + k) * (6 - 3 * pN * (1 - pN))).toFixed(1)}`);
    }
    return `M0,40L${pts.join("L")}L${tw},40Z`;
  };
  const pMarca = prog(t, m.fracaoEm, 0.35);
  const textoEm = m.textoEm ?? m.fracaoEm;
  const larg = W - tx - tw - 80;
  const fT = caber(m.texto, larg, 86, 46, 3);
  const tempos = temposDoTexto(m.texto, textoEm, plano.palavras, fim);
  const altT = fT.linhas.length * fT.tamanho * 1.16;
  const fTit = !temFoto && m.titulo ? caberMono(m.titulo.toLocaleUpperCase("pt-BR"), larg, 30, 22, 1) : null;
  // a gota que cai no tanque (vivo por dentro)
  const fase = ((t * 0.9) % 1 + 1) % 1;
  return (
    <Saida t={t} fim={fim}>
      <FotoDoAlto t={t} plano={plano} m={m} em={m.em} cartaoEm={cartaoEm} fim={fim}>
        {m.titulo ? (
          <div style={{ position: "absolute", left: 26, bottom: 26, opacity: prog(t, m.em + 0.1, 0.25) }}>
            <Etiqueta texto={m.titulo} tamanho={32} fundo={paleta.escuro} tinta={cor.cartao} icone={paleta.icone} />
          </div>
        ) : null}
      </FotoDoAlto>
      {e.visivel ? (
        <Cartao x={PAINEL.x} y={y} w={W} h={h} style={{ opacity: e.opacity, transform: e.transform }}>
          {/* o tanque de vidro */}
          <div style={{ position: "absolute", left: tx, top: ty, width: tw, height: th, borderRadius: 30, background: paleta.claro, border: `5px solid ${paleta.escuro}`, overflow: "hidden", boxSizing: "border-box" }}>
            <div style={{ position: "absolute", left: 0, bottom: 0, width: tw, height: agua, background: `linear-gradient(180deg, ${paleta.cheio} 0%, ${paleta.escuro} 100%)` }}>
              <svg width={tw} height={40} style={{ position: "absolute", left: -5, top: -20 }}>
                <path d={onda(0)} fill={paleta.cheio} />
              </svg>
            </div>
            {/* marcas da escala (sem números) */}
            {[0.25, 0.5, 0.75].map((k) => (
              <div key={k} style={{ position: "absolute", left: 0, top: (th - 10) * (1 - k), width: k === 0.5 ? 54 : 34, height: 4, background: paleta.escuro, opacity: 0.55 }} />
            ))}
            {/* reflexo do vidro */}
            <div style={{ position: "absolute", left: 22, top: 18, width: 22, height: th - 50, borderRadius: 11, background: "rgba(255,255,255,0.32)" }} />
            {/* a gota que cai do gotejador */}
            <svg width={30} height={40} style={{ position: "absolute", left: tw / 2 - 15, top: -40 + fase * (th - agua + 30), opacity: 1 - fase * 0.4 }}>
              <path d="M15 4c6 8 10 14 10 19a10 10 0 0 1-20 0c0-5 4-11 10-19z" fill={paleta.cheio} />
            </svg>
          </div>
          {/* a mangueira com o gotejador, acima do tanque */}
          <div style={{ position: "absolute", left: 24, top: 30, width: tw + 60, height: 22, borderRadius: 11, background: "#23282A" }} />
          <div style={{ position: "absolute", left: tx + tw / 2 - 20, top: 24, width: 40, height: 46, borderRadius: 10, background: "#3A4144" }} />
          {/* a marca amarela no nível dito */}
          {pMarca > 0 ? (
            <div style={{ position: "absolute", left: tx - 18, top: ty + th - th * finalN - 5, width: (tw + 36) * pMarca, height: 10, borderRadius: 5, background: cor.sinal, boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
              <svg width={34} height={34} viewBox="0 0 24 24" style={{ position: "absolute", right: -30, top: -12, opacity: pMarca }}>
                <path d="M20 12L6 4v16z" fill={cor.sinal} stroke={cor.sinalEscuro} strokeWidth={1.5} />
              </svg>
            </div>
          ) : null}
          {/* o texto que se monta na fala */}
          <div style={{ position: "absolute", left: tx + tw + 50, width: larg, top: (h - altT - (fTit ? 54 : 0)) / 2 }}>
            {fTit ? (
              <div style={{ marginBottom: 18, opacity: prog(t, m.em, 0.25) }}>
                <Etiqueta texto={m.titulo as string} tamanho={fTit.tamanho} fundo={paleta.escuro} tinta={cor.cartao} icone={paleta.icone} />
              </div>
            ) : null}
            <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={tempos} alinhar="left" destaque={m.destaque} />
          </div>
        </Cartao>
      ) : null}
    </Saida>
  );
};

// ——— previsão ———
export const Previsao: React.FC<Comum & { m: TPrevisao }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const fT = m.texto ? caberTitulo(m.texto, m.destaque, PAINEL.w, 76, 46) : null;
  const altT = fT ? fT.linhas.length * fT.tamanho * 1.16 : 0;
  const tempos = m.texto ? temposDoTexto(m.texto, em, plano.palavras, fim) : [];
  const y = PAINEL.y + (fT ? altT + 30 : 30);
  const h = PAINEL.base - y;
  const W = PAINEL.w;
  const e = pouso(t, m.de, { de: 1.04, sobe: 16 });
  const agora = m.agora ?? "sol";
  // os quadros: 7, sem rótulo de dia; os da direita viram o que chega
  const nQ = 7;
  const chegam = 3;
  const margem = 28;
  const vao = 12;
  const qw = (W - 2 * margem - vao * (nQ - 1)) / nQ;
  const qh = Math.min(150, qw * 1.2);
  const altChave = m.quando ? 74 : 0;
  const qy = h - margem - altChave - qh;
  // a frente que chega (o ícone grande entra da direita)
  const pC = prog(t, m.chegaEm - 0.05, 0.7);
  const heroH = qy - 36;
  const heroD = Math.min(330, heroH - 10);
  const pQ = m.quando && m.quandoEm !== undefined ? prog(t, m.quandoEm, 0.4) : 0;
  const fQ = m.quando ? caberMono(m.quando.toLocaleUpperCase("pt-BR"), chegam * qw + (chegam - 1) * vao - 50, 30, 18, 1) : null;
  return (
    <Saida t={t} fim={fim}>
      {fT ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: PAINEL.y }}>
          <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={tempos} destaque={m.destaque} corGrifo={cor.sinal} />
        </div>
      ) : null}
      {e.visivel ? (
        <div style={{ position: "absolute", left: PAINEL.x, top: y, width: W, height: h, opacity: e.opacity, transform: e.transform }}>
          <div style={{ position: "absolute", inset: -6, borderRadius: RAIO + 6, background: cor.cartao, boxShadow: sombra }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, overflow: "hidden", background: `linear-gradient(180deg, ${pC > 0.5 ? "#B9D7EE" : cor.ceuClaro} 0%, #F4F7F2 78%, ${cor.cartao} 100%)` }}>
            {/* o horizonte: a lavoura em perspectiva, sob o céu (os quadros ficam em cima dela) */}
            {(() => {
              const yH = 30 + heroH * 0.66;
              const hh = h - yH;
              return (
                <svg width={W} height={hh} style={{ position: "absolute", left: 0, top: yH }}>
                  <rect x={0} y={0} width={W} height={hh} fill="#CFE3BE" />
                  {Array.from({ length: 15 }).map((_, k) => (
                    <line key={k} x1={W / 2 + (k - 7) * 22} y1={0} x2={W / 2 + (k - 7) * 190} y2={hh} stroke={cor.verde} strokeWidth={6} opacity={0.28} />
                  ))}
                  <rect x={0} y={0} width={W} height={5} fill={cor.verde} opacity={0.45} />
                </svg>
              );
            })()}
            {/* o tempo de agora, à esquerda, e a frente que chega por cima dele */}
            <div style={{ position: "absolute", left: W * 0.22 - heroD * 0.4, top: 30 + (heroH - heroD * 0.8) / 2, opacity: 1 - 0.35 * pC }}>
              <IconeClima clima={agora} tamanho={heroD * 0.8} t={t} />
            </div>
            {pC > 0 ? (
              <div style={{ position: "absolute", left: W * 0.6 - heroD / 2 + (1 - pC) * 420, top: 22 + (heroH - heroD) / 2, opacity: Math.min(1, pC * 1.6) }}>
                <IconeClima clima={m.chegada} tamanho={heroD} t={t} />
              </div>
            ) : null}
            {/* a faixa de quadros */}
            {Array.from({ length: nQ }).map((_, i) => {
              const daChegada = i >= nQ - chegam;
              const vira = daChegada ? prog(t, m.chegaEm + 0.1 + (nQ - 1 - i) * 0.09, 0.3) : 0;
              const x = margem + i * (qw + vao);
              return (
                <div key={i} style={{ position: "absolute", left: x, top: qy, width: qw, height: qh }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: vira > 0.5 ? cor.ceuClaro : cor.cartao, border: `3px solid ${vira > 0.5 ? cor.ceu : cor.cartaoBorda}` }} />
                  <div style={{ position: "absolute", left: (qw - qw * 0.72) / 2, top: (qh - qw * 0.72) / 2, transform: `scaleX(${Math.abs(1 - 2 * vira) || 0.02})` }}>
                    <IconeClima clima={vira > 0.5 ? m.chegada : agora} tamanho={qw * 0.72} t={t + i * 0.2} ativo={!daChegada || vira > 0.5 || i < nQ - chegam} />
                  </div>
                </div>
              );
            })}
            {/* a chave com o "quando" (só palavras ditas) */}
            {fQ && pQ > 0 ? (
              <>
                <svg width={W} height={altChave} style={{ position: "absolute", left: 0, top: qy + qh + 8 }}>
                  {(() => {
                    const x0 = margem + (nQ - chegam) * (qw + vao);
                    const x1 = margem + nQ * (qw + vao) - vao;
                    const meio = (x0 + x1) / 2;
                    const metade = ((x1 - x0) / 2) * pQ;
                    return <path d={`M${meio - metade},4 v12 h${metade * 2} v-12`} fill="none" stroke={cor.ceuEscuro} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
                  })()}
                </svg>
                <div
                  style={{
                    position: "absolute",
                    left: margem + (nQ - chegam) * (qw + vao) + (chegam * (qw + vao) - vao) / 2,
                    top: qy + qh + 28,
                    transform: `translateX(-50%) translateY(${(1 - pQ) * 10}px)`,
                    opacity: pQ,
                  }}
                >
                  <Etiqueta texto={m.quando as string} tamanho={fQ.tamanho} fundo={cor.ceuEscuro} tinta={cor.cartao} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </Saida>
  );
};

