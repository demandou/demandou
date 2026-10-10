// Os blocos de fala do Palco, no modo (a) (a pessoa em quadro cheio): abertura, frase, pergunta,
// cta e destaque. Sóbrios: texto direto sobre o vídeo (abertura) ou cartão escuro de cantos suaves
// logo abaixo do queixo, com o azul como único destaque. Nada cobre o rosto.
import { encaixar, larguraTexto } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Abertura as TAbertura, Cta as TCta, Destaque as TDestaque, Frase as TFrase, Pergunta as TPergunta, Plano } from "../plano";
import { COR, FONTE, MARGEM, SOMBRA_PECA, UI_BASE, UI_DIREITA, medidas, prog, suave } from "../tema";
import { TextoFalado, disporTexto } from "./Texto";

const RAIO = 34;

const Cartao: React.FC<{ x: number; y: number; w: number; h: number; t: number; de: number; ate: number; children?: React.ReactNode }> = ({ x, y, w, h, t, de, ate, children }) => {
  if (t < de || t >= ate) return null;
  const e = prog(t, de, 0.42);
  const s = prog(t, ate - 0.2, 0.2, suave);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `translateY(${(1 - e) * 26 + s * 14}px)`, opacity: 1 - s }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, boxShadow: SOMBRA_PECA, opacity: e }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, overflow: "hidden", clipPath: `inset(${((1 - e) * 100).toFixed(2)}% 0 0 0 round ${RAIO}px)`, background: "rgba(19,21,24,0.94)" }}>{children}</div>
    </div>
  );
};

export const Abertura: React.FC<{ plano: Plano; m: TAbertura; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { legTopo } = medidas(plano);
  const d = disporTexto(m.texto, { largura: 940, max: 88, min: 54, linhas: 3, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const s = prog(t, m.ate - 0.18, 0.18, suave);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - s }}>
      <TextoFalado d={d} x={70} y={legTopo} t={t} sobre="video" />
    </div>
  );
};

export const Frase: React.FC<{ plano: Plano; m: TFrase; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { legTopo } = medidas(plano);
  const pad = 44;
  const maxH = UI_BASE - legTopo - pad * 2;
  let d = disporTexto(m.texto, { largura: 940 - pad * 2, max: 70, min: 40, linhas: 4, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, risco: m.risco });
  if (d.altura > maxH) d = disporTexto(m.texto, { largura: 940 - pad * 2, max: 44, min: 32, linhas: 6, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, risco: m.risco });
  const h = d.altura + pad * 2;
  return (
    <Cartao x={70} y={legTopo} w={940} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: h, background: COR.azul }} />
      <TextoFalado d={d} x={pad} y={pad} t={t} sobre="painel" riscoEm={m.riscoEm} />
    </Cartao>
  );
};

const Icone: React.FC<{ nome: TCta["icone"]; tamanho: number }> = ({ nome, tamanho }) => {
  const s = { fill: "none", stroke: COR.branco, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      {nome === "salvar" ? <path d="M6 3h12v18l-6-4.5L6 21z" {...s} /> : null}
      {nome === "comentar" ? <path d="M4 5h16v11H9l-5 4z" {...s} /> : null}
      {nome === "link" ? (
        <>
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" {...s} />
          <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" {...s} />
        </>
      ) : null}
      {nome === "seguir" || !nome ? (
        <>
          <circle cx="10" cy="8" r="4" {...s} />
          <path d="M3 20c1-4 4-6 7-6s6 2 7 6M19 6v6M16 9h6" {...s} />
        </>
      ) : null}
    </svg>
  );
};

export const Cta: React.FC<{ plano: Plano; m: TCta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { legTopo } = medidas(plano);
  const circ = 96;
  const pad = 30;
  const d = disporTexto(m.texto, { largura: 940 - circ - pad * 3, max: 58, min: 38, linhas: 2, alinhar: "esq", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const w = Math.min(940, d.largura + circ + pad * 3 + 10);
  const h = Math.max(circ + pad * 1.4, d.altura + pad * 1.4);
  const x = (1080 - w) / 2;
  const pulso = 1 + 0.04 * Math.sin(Math.max(0, t - m.de) * 4);
  return (
    <Cartao x={x} y={legTopo + 10} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: pad * 0.7, top: (h - circ) / 2, width: circ, height: circ, borderRadius: circ / 2, background: COR.azul, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulso})` }}>
        <Icone nome={m.icone} tamanho={52} />
      </div>
      <TextoFalado d={d} x={pad * 0.7 + circ + pad} y={(h - d.altura) / 2} t={t} sobre="painel" />
    </Cartao>
  );
};

export const Pergunta: React.FC<{ plano: Plano; m: TPergunta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { legTopo } = medidas(plano);
  const pad = 40;
  const w = 940;
  const ops = m.opcoes ?? [];
  const d = disporTexto(m.texto, { largura: w - pad * 2, max: 62, min: 40, linhas: 3, alinhar: "esq", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate });
  const espaco = UI_BASE - legTopo - pad * 2 - d.altura - 24;
  const linha = ops.length ? Math.max(64, Math.min(96, (espaco - (ops.length - 1) * 14) / ops.length)) : 0;
  const tam = ops.length ? Math.min(...ops.map((o) => encaixar(o.texto, { largura: w - pad * 2 - linha - 40, max: Math.round(linha * 0.44), min: 26, linhas: 1, fonte: { peso: 700 } }).tamanho)) : 0;
  const h = pad * 2 + d.altura + (ops.length ? 24 + ops.length * linha + (ops.length - 1) * 14 : 0);
  return (
    <Cartao x={70} y={legTopo} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <TextoFalado d={d} x={pad} y={pad} t={t} sobre="painel" />
      {ops.map((o, i) => {
        const e = prog(t, o.em - 0.03, 0.3);
        if (e <= 0) return null;
        const img = o.imagem ? imagemDoPlano(plano, o.imagem) : null;
        const y = pad + d.altura + 24 + i * (linha + 14);
        return (
          <div key={i} style={{ position: "absolute", left: pad, top: y, width: w - pad * 2, height: linha, borderRadius: linha / 2, border: `3px solid ${COR.linha}`, boxSizing: "border-box", display: "flex", alignItems: "center", opacity: e, transform: `translateX(${(1 - e) * 18}px)` }}>
            <div style={{ width: linha - 14, height: linha - 14, marginLeft: 4, borderRadius: "50%", overflow: "hidden", position: "relative", flex: "none", background: COR.azul }}>
              {temImagem(img) ? (
                <Foto imagem={img} de={m.de} t={t} largura={linha - 14} altura={linha - 14} efeito="parado" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: (linha - 14) * 0.45, color: COR.branco }}>{String.fromCharCode(65 + i)}</div>
              )}
            </div>
            <div style={{ marginLeft: 20, fontFamily: FONTE, fontWeight: 700, fontSize: tam, color: COR.texto, whiteSpace: "nowrap" }}>{o.texto}</div>
          </div>
        );
      })}
    </Cartao>
  );
};

// destaque: o chip de palavra-chave na altura do peito
export const Destaque: React.FC<{ plano: Plano; m: TDestaque; t: number }> = ({ plano, m, t }) => {
  const entra = Math.max(m.de, m.em - 0.04);
  if (t < entra || t >= m.ate) return null;
  const { zonaTopo } = medidas(plano);
  const alerta = m.nivel === "alerta";
  const util = UI_DIREITA - MARGEM;
  const fit = encaixar(m.texto, { largura: util - 150, max: 62, min: 36, linhas: 2, fonte: { peso: 800 } });
  const lh = fit.tamanho * 1.2;
  const larg = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800 })));
  const ponto = Math.round(fit.tamanho * 0.42);
  const padX = 40;
  const w = Math.round(larg + padX * 2 + ponto + 22);
  const h = Math.round(lh * fit.linhas.length + 44);
  const x = Math.round((1080 - w) / 2);
  const y = zonaTopo + 10;
  const e = prog(t, entra, 0.3);
  const s = prog(t, m.ate - 0.2, 0.2, suave);
  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: Math.min(h / 2, 46), background: alerta ? COR.texto : "rgba(19,21,24,0.94)", boxShadow: SOMBRA_PECA, opacity: e * (1 - s), transform: `translateY(${(1 - e) * 16 + s * 10}px) scale(${0.94 + 0.06 * e})` }}>
        <div style={{ position: "absolute", left: padX, top: (h - ponto) / 2, width: ponto, height: ponto, borderRadius: ponto * 0.3, background: COR.azul }} />
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ position: "absolute", left: padX + ponto + 22, top: 22 + i * lh, height: lh, lineHeight: `${lh}px`, fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, color: alerta ? COR.palco : COR.texto, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
      {m.detalhe ? (
        <div style={{ position: "absolute", left: x + 24, top: y + h + 16, fontFamily: FONTE, fontWeight: 700, fontSize: 36, color: COR.branco, textShadow: "0 2px 14px rgba(0,0,0,0.55)", opacity: prog(t, m.detalheEm ?? m.em + 0.5, 0.3) * (1 - s) }}>
          {m.detalhe}
        </div>
      ) : null}
    </>
  );
};
