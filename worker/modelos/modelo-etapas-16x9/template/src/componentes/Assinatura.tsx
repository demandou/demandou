// A assinatura do Etapas: o cabeçalho do modo A, a pílula da junção, e as três telas do quadro da
// esquerda (`etapa`, `grade`, `prova`), com a pessoa na moldura da direita (versão deitada, 16:9). Tudo estático ou em corte seco: a única animação é a rolagem lenta
// da página e o cursor, como numa gravação de tela de verdade.
import { Img, staticFile } from "remotion";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import { encaixar, larguraTexto } from "../medida";
import type { Abertura, Etapa, Grade, Plano, Prova, Tela } from "../plano";
import { BASE_CABECALHO, COR, FONTE, PILULA, TELA, PALCO_H, LARGURA, prog } from "../tema";
import { IconeTraco } from "./Icones";

// ——— a pílula (rótulo da etapa) ———

export const Pilula: React.FC<{ texto: string; icone?: string; t: number }> = ({ texto, icone = "robo", t }) => {
  const caixaAlta = texto.toUpperCase();
  const iconeW = 64;
  const util = PILULA.w - 48 - iconeW - 18;
  const fit = encaixar(caixaAlta, { largura: util, max: 46, min: 28, linhas: 1, fonte: { peso: 800, espacamento: 0.04 } });
  const w = Math.min(PILULA.w, larguraTexto(caixaAlta, fit.tamanho, { peso: 800, espacamento: 0.04 }) + iconeW + 18 + 96);
  const largura = Math.max(380, w);
  return (
    <div
      style={{
        position: "absolute",
        left: PILULA.cx - largura / 2,
        top: PILULA.cy - PILULA.h / 2,
        width: largura,
        height: PILULA.h,
        borderRadius: 22,
        background: COR.laranja,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        boxShadow: "0 6px 22px rgba(0,0,0,0.35)",
      }}
    >
      <IconeTraco nome={(icone as never) ?? "robo"} tamanho={iconeW} cor={COR.branco} t={t} em={-9} traco={1.5} />
      <span style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, letterSpacing: "0.04em", color: COR.branco, whiteSpace: "nowrap" }}>{caixaAlta}</span>
    </div>
  );
};

// ——— o cabeçalho do modo A: logo + ícones do processo ligados por setas + pílula de título ———

const Estrela: React.FC<{ tamanho: number }> = ({ tamanho }) => (
  <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
    {Array.from({ length: 8 }).map((_, i) => (
      <line key={i} x1="12" y1="12" x2="12" y2="3.2" stroke={COR.branco} strokeWidth="2.1" strokeLinecap="round" transform={`rotate(${i * 45} 12 12)`} />
    ))}
  </svg>
);

// No quadro deitado o cabeçalho é uma coluna ao lado do rosto (`coluna`, de tema.colunaDoCabecalho):
// logo, ícones e pílula empilhados e centrados nela, na altura do rosto, acima da legenda. Os ícones
// encolhem juntos se a fileira não couber na coluna.
export const Cabecalho: React.FC<{ m: Abertura; t: number; coluna: { x: number; w: number; cy: number } }> = ({ m, t, coluna }) => {
  const n = Math.min(5, Math.max(2, m.etapas ?? 4));
  const icone = m.icone ?? "robo";
  const linha1 = m.texto.toUpperCase();
  const linha2 = m.sub?.toUpperCase();
  const maior = linha2 && larguraTexto(linha2, 1, { peso: 800 }) > larguraTexto(linha1, 1, { peso: 800 }) ? linha2 : linha1;
  const fit = encaixar(maior, { largura: Math.min(760, coluna.w - 90), max: 56, min: 28, linhas: 1, fonte: { peso: 800, espacamento: 0.03 } });
  // título longo numa coluna estreita: o corpo continua encolhendo até caber (nunca vaza da pílula)
  let tamanho = fit.tamanho;
  while (tamanho > 18 && larguraTexto(maior, tamanho, { peso: 800, espacamento: 0.03 }) > coluna.w - 60) tamanho -= 2;
  const larguraPilula = Math.min(coluna.w, Math.max(Math.min(560, coluna.w), larguraTexto(maior, tamanho, { peso: 800, espacamento: 0.03 }) + 90));
  const k = Math.min(1, coluna.w / (n * 84 + (n - 1) * 46));
  const icoW = Math.round(84 * k);
  const gap = Math.round(46 * k);
  const total = n * icoW + (n - 1) * gap;
  const altPilula = linha2 ? 150 : 100;
  // a pilha: logo (100), 34, ícones, 34, pílula
  const altura = 100 + 34 + icoW + 34 + altPilula;
  const topo = Math.round(Math.min(BASE_CABECALHO - altura, Math.max(100, coluna.cy - altura / 2)));
  const cx = coluna.w / 2;
  return (
    <div style={{ position: "absolute", left: coluna.x, top: topo, width: coluna.w, height: altura }}>
      {/* o logo: quadrado laranja com a estrela */}
      <div style={{ position: "absolute", left: cx - 50, top: 0, width: 100, height: 100, borderRadius: 24, background: COR.laranja, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
        <Estrela tamanho={64} />
      </div>
      {/* os ícones do processo, ligados por setas */}
      <div style={{ position: "absolute", left: cx - total / 2, top: 134, display: "flex", alignItems: "center", gap }}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={{ position: "relative", width: icoW, height: icoW }}>
            <IconeTraco nome={icone as never} tamanho={icoW} cor={COR.branco} t={t} em={-9} traco={1.5} />
            {i < n - 1 ? (
              <svg width={gap} height={26 * k} viewBox="0 0 46 26" style={{ position: "absolute", left: icoW, top: icoW / 2 - 13 * k }}>
                <path d="M7 13h30M29 5l8 8-8 8" fill="none" stroke={COR.branco} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
      {/* a pílula de título, 1 ou 2 linhas */}
      <div
        style={{
          position: "absolute",
          left: cx - larguraPilula / 2,
          top: 134 + icoW + 34,
          width: larguraPilula,
          height: altPilula,
          borderRadius: 22,
          background: COR.laranja,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 22px rgba(0,0,0,0.35)",
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: tamanho,
          letterSpacing: "0.03em",
          lineHeight: 1.12,
          color: COR.branco,
          whiteSpace: "nowrap",
        }}
      >
        <div>{linha1}</div>
        {linha2 ? <div>{linha2}</div> : null}
      </div>
    </div>
  );
};

// ——— a gravação de tela: uma página que rola, com cursor ———

const lerImagem = (plano: Plano, id: string) => {
  const img = imagemDoPlano(plano, { id });
  return temImagem(img) && img.arquivo ? img : null;
};

const NaoAchou: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ position: "absolute", inset: 0, background: COR.palco2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 56, color: COR.osso, padding: 60, textAlign: "center" }}>{texto}</div>
);

// a página dentro de uma janela (w × h): rola de `rolar[0]` a `rolar[1]` ao longo de `p` (0–1)
const Pagina: React.FC<{ plano: Plano; id: string; w: number; h: number; p: number; rolar?: [number, number]; zoom?: number; foco?: { x: number; y: number } }> = ({ plano, id, w, h, p, rolar = [0, 0.14], zoom = 1.12, foco }) => {
  const img = lerImagem(plano, id);
  if (!img) return <NaoAchou texto={id} />;
  const iw = img.largura ?? 1280;
  const ih = img.altura ?? 3000;
  const escala = (w / iw) * zoom;
  const larg = iw * escala;
  const alt = ih * escala;
  const maxY = Math.max(0, alt - h);
  const maxX = Math.max(0, larg - w);
  const fy = rolar[0] + (rolar[1] - rolar[0]) * p;
  const topo = foco ? Math.min(maxY, Math.max(0, foco.y * alt - h / 2)) : fy * maxY;
  const esq = foco ? Math.min(maxX, Math.max(0, foco.x * larg - w / 2)) : maxX * (img.foco?.x ?? 0.5) * 0.9;
  return <Img src={staticFile(img.arquivo!)} style={{ position: "absolute", left: -esq, top: -topo, width: larg, height: alt, maxWidth: "none" }} />;
};

const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={46} height={60} viewBox="0 0 23 30" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.45))" }}>
    <path d="M2 2v22l5.6-5.2 3.7 8.4 4-1.8-3.7-8.2H19z" fill="#FFFFFF" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

// cursor padrão: um caminho curto e determinístico a partir do instante de entrada
const cursorPadrao = (em: number): [number, number, number, number] => {
  const a = (Math.sin(em * 12.9898) * 43758.5453) % 1;
  const u = Math.abs(a);
  return [0.25 + u * 0.4, 0.3 + ((u * 7) % 1) * 0.35, 0.45 + ((u * 3) % 1) * 0.3, 0.45 + ((u * 5) % 1) * 0.3];
};

const TelaUm: React.FC<{ plano: Plano; tela: Tela; t: number; fim: number; opacidade?: number }> = ({ plano, tela, t, fim, opacidade = 1 }) => {
  const dur = Math.max(0.3, fim - tela.em);
  const p = Math.min(1, Math.max(0, (t - tela.em) / dur));
  const c = tela.cursor ?? cursorPadrao(tela.em);
  const e = p * p * (3 - 2 * p);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: opacidade, overflow: "hidden", background: "#FFFFFF" }}>
      <Pagina plano={plano} id={tela.imagem.id} w={TELA.w} h={TELA.h} p={p} rolar={tela.rolar} zoom={tela.zoom} />
      <Cursor x={(c[0] + (c[2] - c[0]) * e) * TELA.w} y={(c[1] + (c[3] - c[1]) * e) * TELA.h} />
    </div>
  );
};

const DISSOLVE = 0.9;

export const TelaEtapa: React.FC<{ plano: Plano; m: Etapa; t: number }> = ({ plano, m, t }) => {
  const telas = [...m.telas].sort((a, b) => a.em - b.em);
  let i = 0;
  telas.forEach((x, k) => {
    if (t >= x.em - 0.001) i = k;
  });
  const atual = telas[i];
  const fimDe = (k: number) => telas[k + 1]?.em ?? m.ate;
  const dissolvendo = i > 0 && atual.dissolve && t < atual.em + DISSOLVE;
  const q = dissolvendo ? (t - atual.em) / DISSOLVE : 1;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {dissolvendo ? <TelaUm plano={plano} tela={telas[i - 1]} t={t} fim={fimDe(i - 1) + DISSOLVE} /> : null}
      <TelaUm plano={plano} tela={atual} t={t} fim={fimDe(i)} opacidade={q} />
    </div>
  );
};

// ——— a grade 2x2 numerada ———

export const TelaGrade: React.FC<{ plano: Plano; m: Grade; t: number }> = ({ plano, m, t }) => {
  const itens = m.telas.slice(0, 5);
  const n = itens.length;
  const cols = n <= 4 ? 2 : 3;
  const linhas = Math.ceil(n / cols);
  const gap = 8;
  const hh = (TELA.h - gap * (linhas - 1)) / linhas;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0C0A09" }}>
      {itens.map((it, i) => {
        const r = Math.floor(i / cols);
        const naLinha = r === linhas - 1 ? n - r * cols : cols;
        const c = i - r * cols;
        const ww = (TELA.w - gap * (naLinha - 1)) / naLinha;
        const em = it.em ?? m.de;
        if (t < em) return null;
        return (
          <div key={i} style={{ position: "absolute", left: c * (ww + gap), top: r * (hh + gap), width: ww, height: hh, overflow: "hidden", background: "#FFFFFF" }}>
            <Pagina plano={plano} id={it.imagem.id} w={ww} h={hh} p={0} rolar={it.rolar ?? [0, 0]} zoom={1.05} />
            <div style={{ position: "absolute", left: 14, top: 14, width: 66, height: 66, borderRadius: 33, background: COR.laranja, color: COR.branco, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 38, boxShadow: "0 3px 10px rgba(0,0,0,0.4)" }}>{i + 1}</div>
          </div>
        );
      })}
    </div>
  );
};

// ——— a prova: um print real, parado ———

export const TelaProva: React.FC<{ plano: Plano; m: Prova; t: number }> = ({ plano, m }) => (
  <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", overflow: "hidden" }}>
    <Pagina plano={plano} id={m.imagem.id} w={TELA.w} h={TELA.h} p={0} rolar={m.rolar ?? [0, 0]} zoom={m.zoom ?? 1.0} foco={m.foco} />
  </div>
);

export { prog, PALCO_H, LARGURA };
