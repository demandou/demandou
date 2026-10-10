// Os blocos universais na linguagem do Yap: tudo na altura do peito, abaixo da legenda, em
// cartões claros de cantos suaves (ou, na abertura, direto sobre o vídeo). A pessoa nunca sai
// do quadro e nada cobre o rosto.
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import { encaixar, larguraTexto } from "../medida";
import type { Abertura as TAbertura, Comparacao as TComparacao, Cta as TCta, Definicao as TDefinicao, Destaque as TDestaque, Frase as TFrase, Grafico as TGrafico, Numero as TNumero, Passos as TPassos, Pergunta as TPergunta, Plano, Topicos as TTopicos } from "../plano";
import { COR, FONTE, MARGEM, RAIO, SOMBRA_CARTAO, UI_BASE, UI_DIREITA, formatar, medidas, prog, suave } from "../tema";
import { Cartao, Etiqueta, Marcador, xNoLado, zona } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

const LARGURA_UTIL = UI_DIREITA - MARGEM; // 896

// ——— abertura: o gancho no lugar da legenda, maior, direto sobre o vídeo ———
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

// ——— frase: cartão claro com a fala palavra por palavra ———
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
      <div style={{ position: "absolute", left: 0, top: 0, width: 10, height: h, background: COR.lima }} />
      <TextoFalado d={d} x={pad} y={pad} t={t} sobre="cartao" riscoEm={m.riscoEm} />
    </Cartao>
  );
};

// ——— cta: pílula clara com o ícone num círculo lima ———
const Icone: React.FC<{ nome: TCta["icone"]; tamanho: number }> = ({ nome, tamanho }) => {
  const s = { fill: "none", stroke: COR.tinta, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
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
      <div
        style={{
          position: "absolute",
          left: pad * 0.7,
          top: (h - circ) / 2,
          width: circ,
          height: circ,
          borderRadius: circ / 2,
          background: COR.lima,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${pulso})`,
        }}
      >
        <Icone nome={m.icone} tamanho={52} />
      </div>
      <TextoFalado d={d} x={pad * 0.7 + circ + pad} y={(h - d.altura) / 2} t={t} sobre="cartao" />
    </Cartao>
  );
};

// ——— pergunta: cartão com a pergunta e as opções (com miniatura quando há imagem) ———
export const Pergunta: React.FC<{ plano: Plano; m: TPergunta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const { legTopo } = medidas(plano);
  const pad = 40;
  const w = 940;
  const ops = m.opcoes ?? [];
  const d = disporTexto(m.texto, { largura: w - pad * 2, max: 62, min: 40, linhas: 3, alinhar: "esq", fala: plano.palavras, de: m.em ?? m.de, ate: m.ate });
  const espaco = UI_BASE - legTopo - pad * 2 - d.altura - 24;
  const linha = ops.length ? Math.max(64, Math.min(96, (espaco - (ops.length - 1) * 14) / ops.length)) : 0;
  const tam = ops.length
    ? Math.min(...ops.map((o) => encaixar(o.texto, { largura: w - pad * 2 - linha - 40, max: Math.round(linha * 0.44), min: 26, linhas: 1, fonte: { peso: 700 } }).tamanho))
    : 0;
  const h = pad * 2 + d.altura + (ops.length ? 24 + ops.length * linha + (ops.length - 1) * 14 : 0);
  return (
    <Cartao x={70} y={legTopo} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <TextoFalado d={d} x={pad} y={pad} t={t} sobre="cartao" />
      {ops.map((o, i) => {
        const e = prog(t, o.em - 0.03, 0.3);
        if (e <= 0) return null;
        const img = o.imagem ? imagemDoPlano(plano, o.imagem) : null;
        const y = pad + d.altura + 24 + i * (linha + 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pad,
              top: y,
              width: w - pad * 2,
              height: linha,
              borderRadius: linha / 2,
              border: `3px solid ${COR.linha}`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              opacity: e,
              transform: `translateX(${(1 - e) * 18}px)`,
            }}
          >
            <div style={{ width: linha - 14, height: linha - 14, marginLeft: 4, borderRadius: "50%", overflow: "hidden", position: "relative", flex: "none", background: COR.lima }}>
              {temImagem(img) ? (
                <Foto imagem={img} de={m.de} t={t} largura={linha - 14} altura={linha - 14} efeito="parado" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTE, fontWeight: 800, fontSize: (linha - 14) * 0.45, color: COR.tinta }}>
                  {String.fromCharCode(65 + i)}
                </div>
              )}
            </div>
            <div style={{ marginLeft: 20, fontFamily: FONTE, fontWeight: 700, fontSize: tam, color: COR.tinta, whiteSpace: "nowrap" }}>{o.texto}</div>
          </div>
        );
      })}
    </Cartao>
  );
};

// ——— numero: cartão com o número que conta e o rótulo ———
export const Numero: React.FC<{ plano: Plano; m: TNumero; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const z = zona(plano);
  const casas = m.casas ?? 0;
  const final = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const pad = 40;
  const numFit = encaixar(final, { largura: 760, max: Math.min(150, z.altura * 0.42), min: 64, linhas: 1, fonte: { peso: 800 } });
  const rotFit = encaixar(m.rotulo, { largura: 760, max: 42, min: 28, linhas: 1, fonte: { peso: 700 } });
  const titFit = m.titulo ? encaixar(m.titulo, { largura: 760, max: 32, min: 24, linhas: 1, fonte: { peso: 600 } }) : null;
  const larg = Math.max(larguraTexto(final, numFit.tamanho, { peso: 800 }), larguraTexto(m.rotulo, rotFit.tamanho, { peso: 700 }), titFit ? larguraTexto(m.titulo ?? "", titFit.tamanho, { peso: 600 }) : 0);
  const w = Math.round(Math.min(LARGURA_UTIL, Math.max(380, larg + pad * 2)));
  const hTit = titFit ? titFit.tamanho * 1.5 : 0;
  const hNum = numFit.tamanho * 1.08;
  const h = Math.round(pad + hTit + hNum + 18 + rotFit.tamanho * 1.4 + pad * 0.8);
  const x = xNoLado(m.lado ?? "centro", w);
  const p = prog(t, m.em, 1.0);
  const valor = m.valor * p;
  const atual = `${m.prefixo ?? ""}${formatar(casas === 0 ? Math.round(valor) : valor, casas)}${m.sufixo ?? ""}`;
  const rot = prog(t, m.rotuloEm ?? m.em + 0.5, 0.3);
  return (
    <Cartao x={x} y={z.topo + 4} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {titFit ? (
        <div style={{ position: "absolute", left: 0, width: w, top: pad * 0.8, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: titFit.tamanho, color: COR.apagado }}>
          {m.titulo}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, width: w, top: pad * 0.6 + hTit, height: hNum, lineHeight: `${hNum}px`, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: numFit.tamanho, color: COR.tinta, letterSpacing: "-0.02em" }}>
        {atual}
      </div>
      {/* traço lima que se completa enquanto o número conta */}
      <div style={{ position: "absolute", left: (w - larg * 0.7) / 2, top: pad * 0.6 + hTit + hNum + 4, width: larg * 0.7 * p, height: 10, borderRadius: 5, background: COR.lima }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: w,
          top: pad * 0.6 + hTit + hNum + 26,
          textAlign: "center",
          fontFamily: FONTE,
          fontWeight: 700,
          fontSize: rotFit.tamanho,
          color: COR.tinta,
          opacity: rot,
          transform: `translateY(${(1 - rot) * 10}px)`,
        }}
      >
        {m.rotulo}
      </div>
      {m.ilustrativo ? (
        <div style={{ position: "absolute", right: 18, bottom: 12, fontFamily: FONTE, fontWeight: 600, fontSize: 22, color: COR.apagado }}>ilustrativo</div>
      ) : null}
    </Cartao>
  );
};

// ——— destaque: o chip de palavra-chave ———
export const Destaque: React.FC<{ plano: Plano; m: TDestaque; t: number }> = ({ plano, m, t }) => {
  const entra = Math.max(m.de, m.em - 0.04);
  if (t < entra || t >= m.ate) return null;
  const z = zona(plano);
  const alerta = m.nivel === "alerta";
  const fit = encaixar(m.texto, { largura: LARGURA_UTIL - 150, max: 62, min: 36, linhas: 2, fonte: { peso: 800 } });
  const lh = fit.tamanho * 1.2;
  const larg = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800 })));
  const ponto = Math.round(fit.tamanho * 0.42);
  const padX = 40;
  const w = Math.round(larg + padX * 2 + ponto + 22);
  const h = Math.round(lh * fit.linhas.length + 44);
  const x = xNoLado(m.lado ?? "centro", w);
  const y = z.topo + 10;
  const e = prog(t, entra, 0.3);
  const s = prog(t, m.ate - 0.2, 0.2, suave);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: Math.min(h / 2, 46),
          background: alerta ? COR.tinta : COR.papel,
          boxShadow: SOMBRA_CARTAO,
          opacity: e * (1 - s),
          transform: `translateY(${(1 - e) * 16 + s * 10}px) scale(${0.94 + 0.06 * e})`,
        }}
      >
        <div style={{ position: "absolute", left: padX, top: (h - ponto) / 2, width: ponto, height: ponto, borderRadius: ponto * 0.3, background: COR.lima }} />
        {fit.linhas.map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: padX + ponto + 22,
              top: 22 + i * lh,
              height: lh,
              lineHeight: `${lh}px`,
              fontFamily: FONTE,
              fontWeight: 800,
              fontSize: fit.tamanho,
              color: alerta ? COR.branco : COR.tinta,
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </div>
        ))}
      </div>
      {m.detalhe ? (
        <Etiqueta texto={m.detalhe} x={x + 24} y={y + h + 16} t={t} em={m.detalheEm ?? m.em + 0.5} ate={m.ate} tamanho={36} direitaMax={UI_DIREITA} />
      ) : null}
    </>
  );
};

// ——— definicao: termo + traço lima + significado ———
export const Definicao: React.FC<{ plano: Plano; m: TDefinicao; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const z = zona(plano);
  const pad = 40;
  const w = LARGURA_UTIL;
  const termo = encaixar(m.termo, { largura: w - pad * 2, max: 64, min: 40, linhas: 1, fonte: { peso: 800 } });
  const sig = encaixar(m.significado, { largura: w - pad * 2, max: 38, min: 26, linhas: 3, fonte: { peso: 600 } });
  const h = Math.min(z.altura - 8, Math.round(pad + termo.tamanho * 1.2 + 28 + sig.linhas.length * sig.tamanho * 1.3 + pad));
  const x = xNoLado(m.lado ?? "centro", w);
  const pt = prog(t, m.em - 0.03, 0.3);
  const ps = prog(t, m.significadoEm - 0.03, 0.35);
  return (
    <Cartao x={x} y={z.topo + 4} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: pad, top: pad - 6, fontFamily: FONTE, fontWeight: 800, fontSize: termo.tamanho, color: COR.tinta, opacity: pt, whiteSpace: "nowrap" }}>{m.termo}</div>
      <div style={{ position: "absolute", left: pad, top: pad + termo.tamanho * 1.2 + 4, width: 120 * ps + 40 * pt, height: 8, borderRadius: 4, background: COR.lima }} />
      {sig.linhas.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: pad,
            top: pad + termo.tamanho * 1.2 + 28 + i * sig.tamanho * 1.3,
            fontFamily: FONTE,
            fontWeight: 600,
            fontSize: sig.tamanho,
            color: COR.tinta,
            whiteSpace: "nowrap",
            opacity: prog(t, m.significadoEm - 0.03 + i * 0.12, 0.3),
            transform: `translateY(${(1 - prog(t, m.significadoEm - 0.03 + i * 0.12, 0.3)) * 8}px)`,
          }}
        >
          {l}
        </div>
      ))}
    </Cartao>
  );
};

// ——— comparacao: dois cartões lado a lado, cada um no seu tempo ———
export const Comparacao: React.FC<{ plano: Plano; m: TComparacao; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const z = zona(plano);
  const vao = 28;
  const w = Math.floor((LARGURA_UTIL - vao) / 2);
  const h = Math.round(Math.min(z.altura - 40, 290));
  const y = z.topo + 4;
  const venc = m.vencedor;
  const pv = venc === undefined ? 0 : prog(t, m.vencedorEm ?? Math.max(...m.lados.map((l) => l.em)) + 0.4, 0.35);
  const sinal = m.modo === "antes-depois" ? "→" : m.modo === "errado-certo" ? "≠" : "×";
  const lados = m.lados.map((l, i) => {
    const rot = encaixar(l.rotulo, { largura: w - 60, max: 34, min: 24, linhas: 1, fonte: { peso: 700 } });
    const tx = encaixar(l.texto, { largura: w - 60, max: Math.min(124, (h - 90) * 0.62), min: 36, linhas: 2, fonte: { peso: 800 } });
    const x = MARGEM + i * (w + vao);
    const perdedor = venc !== undefined && venc !== i;
    const lhTx = tx.tamanho * 1.08;
    const blocoH = rot.tamanho * 1.5 + tx.linhas.length * lhTx;
    const y0 = (h - blocoH) / 2;
    return (
      <Cartao key={i} x={x} y={y} w={w} h={h} t={t} de={Math.max(m.de, l.em - 0.08)} ate={m.ate}>
        <div style={{ position: "absolute", inset: 0, opacity: perdedor ? 1 - 0.45 * pv : 1, textAlign: "center" }}>
          <div style={{ position: "absolute", left: 0, width: w, top: y0, fontFamily: FONTE, fontWeight: 700, fontSize: rot.tamanho, color: COR.apagado }}>{l.rotulo}</div>
          {tx.linhas.map((ln, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 0,
                width: w,
                top: y0 + rot.tamanho * 1.5 + k * lhTx,
                height: lhTx,
                lineHeight: `${lhTx}px`,
                fontFamily: FONTE,
                fontWeight: 800,
                fontSize: tx.tamanho,
                letterSpacing: "-0.02em",
                color: COR.tinta,
                whiteSpace: "nowrap",
              }}
            >
              {ln}
            </div>
          ))}
          {perdedor && m.modo === "errado-certo" ? (
            <div style={{ position: "absolute", left: 30, right: 30, top: y0 + rot.tamanho * 1.5 + (tx.linhas.length * lhTx) / 2, height: 6, borderRadius: 3, background: COR.tinta, transform: `scaleX(${pv})`, transformOrigin: "left" }} />
          ) : null}
        </div>
        {venc === i ? <div style={{ position: "absolute", left: 0, top: 0, height: 12, width: w * pv, background: COR.lima }} /> : null}
      </Cartao>
    );
  });
  const ps = prog(t, m.lados[1].em - 0.1, 0.3);
  return (
    <>
      {lados}
      {t >= m.lados[1].em - 0.1 ? (
        <div
          style={{
            position: "absolute",
            left: MARGEM + w + vao / 2 - 30,
            top: y + h / 2 - 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            background: COR.lima,
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 34,
            color: COR.tinta,
            transform: `scale(${ps})`,
            opacity: 1 - prog(t, m.ate - 0.2, 0.2, suave),
          }}
        >
          {sinal}
        </div>
      ) : null}
      {m.titulo ? <Etiqueta texto={m.titulo} x={MARGEM + 20} y={y + h - 26} t={t} em={m.de + 0.1} ate={m.ate} tamanho={30} direitaMax={UI_DIREITA} /> : null}
    </>
  );
};

// ——— topicos e passos: lista no cartão claro; cada linha acende na fala ———
export const Lista: React.FC<{ plano: Plano; m: TTopicos | TPassos; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const z = zona(plano);
  const pad = 34;
  const n = m.itens.length;
  const hTit = m.titulo ? 50 : 0;
  const h = Math.round(z.altura - 8);
  const linha = Math.min(96, (h - pad * 2 - hTit) / n);
  const mk = Math.round(Math.min(56, linha * 0.66));
  const temDetalhe = linha >= 84 && m.itens.some((i) => i.detalhe);
  const w = LARGURA_UTIL;
  const tamTexto = Math.min(...m.itens.map((i) => encaixar(i.texto, { largura: w - pad * 2 - mk - 22, max: Math.round(linha * (temDetalhe ? 0.4 : 0.48)), min: 26, linhas: 1, fonte: { peso: 700 } }).tamanho));
  const passos = m.tipo === "passos";
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.05) atual = i;
  });
  const x = xNoLado(m.lado ?? "centro", w);
  const y0 = pad + hTit;
  return (
    <Cartao x={x} y={z.topo + 4} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <div style={{ position: "absolute", left: pad, top: pad - 4, fontFamily: FONTE, fontWeight: 600, fontSize: 30, color: COR.apagado, whiteSpace: "nowrap" }}>{m.titulo}</div> : null}
      {passos && atual > 0 ? (
        <div
          style={{
            position: "absolute",
            left: pad + mk / 2 - 2,
            top: y0 + linha / 2,
            width: 4,
            height: (atual - 1 + prog(t, m.itens[atual].em - 0.05, 0.3)) * linha,
            background: COR.tinta,
            opacity: 0.25,
          }}
        />
      ) : null}
      {m.itens.map((it, i) => {
        const e = prog(t, it.em - 0.05, 0.3);
        if (e <= 0) return null;
        const corrente = i === atual;
        return (
          <div key={i} style={{ position: "absolute", left: pad, top: y0 + i * linha, height: linha, width: w - pad * 2, display: "flex", alignItems: "center", opacity: e, transform: `translateX(${(1 - e) * 16}px)` }}>
            {passos ? (
              <Marcador texto={String(i + 1)} tamanho={mk} apagado={!corrente} />
            ) : (
              <div style={{ width: mk, display: "flex", justifyContent: "center", flex: "none" }}>
                <div style={{ width: mk * 0.36, height: mk * 0.36, borderRadius: mk * 0.12, background: corrente ? COR.lima : COR.linha, boxShadow: corrente ? `0 0 0 3px ${COR.tinta}22` : "none" }} />
              </div>
            )}
            <div style={{ marginLeft: 22, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: FONTE, fontWeight: 700, fontSize: tamTexto, color: COR.tinta, whiteSpace: "nowrap", lineHeight: 1.15 }}>{it.texto}</div>
              {temDetalhe && it.detalhe ? (
                <div style={{ fontFamily: FONTE, fontWeight: 600, fontSize: Math.round(tamTexto * 0.62), color: COR.apagado, whiteSpace: "nowrap", lineHeight: 1.2 }}>{it.detalhe}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Cartao>
  );
};

// ——— grafico: barras, linha ou rosca, desenhados na fala ———
export const Grafico: React.FC<{ plano: Plano; m: TGrafico; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const z = zona(plano);
  const w = LARGURA_UTIL;
  const h = Math.round(z.altura - 8);
  const pad = 34;
  const hTit = m.titulo ? 48 : 0;
  const dados = m.dados ?? [];
  const area = { x: pad, y: pad + hTit, w: w - pad * 2, h: h - pad * 2 - hTit - 40 };
  const fmt = (v: number) => `${formatar(v, Number.isInteger(v) ? 0 : 1)}${m.unidade ? ` ${m.unidade}` : ""}`;
  const maxV = Math.max(1, ...dados.map((d) => d.valor));
  let corpo: React.ReactNode = null;

  if (dados.length && m.forma === "barras") {
    const bw = Math.min(140, (area.w - (dados.length - 1) * 24) / dados.length);
    const total = dados.length * bw + (dados.length - 1) * 24;
    corpo = dados.map((d, i) => {
      const p = prog(t, d.em - 0.05, 0.5);
      const bh = (area.h - 44) * (d.valor / maxV) * p;
      const x = area.x + (area.w - total) / 2 + i * (bw + 24);
      const corrente = i === dados.filter((x2) => t >= x2.em - 0.05).length - 1;
      return (
        <div key={i}>
          <div style={{ position: "absolute", left: x, top: area.y + area.h - bh, width: bw, height: bh, borderRadius: 10, background: corrente ? COR.lima : COR.tinta }} />
          <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: area.y + area.h - bh - 42, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 30, color: COR.tinta, opacity: p }}>{fmt(d.valor)}</div>
          <div style={{ position: "absolute", left: x - 30, width: bw + 60, top: area.y + area.h + 8, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: 24, color: COR.apagado, opacity: p, whiteSpace: "nowrap" }}>{d.rotulo}</div>
        </div>
      );
    });
  } else if (dados.length && m.forma === "pizza") {
    const soma = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const r = Math.min(area.h, 300) / 2;
    const cx = area.x + r + 10;
    const cy = area.y + area.h / 2 + 10;
    let acum = 0;
    const circ = 2 * Math.PI * (r - 26);
    corpo = (
      <>
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={w} height={h}>
          <circle cx={cx} cy={cy} r={r - 26} fill="none" stroke={COR.linha} strokeWidth={44} />
          {dados.map((d, i) => {
            const p = prog(t, d.em - 0.05, 0.5);
            const parte = (d.valor / soma) * circ * p;
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r - 26} fill="none" stroke={i % 2 === 0 ? COR.tinta : COR.lima} strokeWidth={44} strokeDasharray={`${parte} ${circ}`} strokeDashoffset={-acum} transform={`rotate(-90 ${cx} ${cy})`} />
            );
            acum += (d.valor / soma) * circ;
            return el;
          })}
        </svg>
        {dados.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: cx + r + 40, top: area.y + 10 + i * 52, display: "flex", alignItems: "center", opacity: prog(t, d.em - 0.05, 0.3), fontFamily: FONTE, fontWeight: 700, fontSize: 30, color: COR.tinta, whiteSpace: "nowrap" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: i % 2 === 0 ? COR.tinta : COR.lima, marginRight: 14, border: `2px solid ${COR.tinta}` }} />
            {d.rotulo} · {fmt(d.valor)}
          </div>
        ))}
      </>
    );
  } else {
    // linha com dados, ou tendência sem números (ilustrativa)
    const pts =
      dados.length >= 2
        ? dados.map((d, i) => ({ x: area.x + (area.w * i) / (dados.length - 1), y: area.y + 20 + (area.h - 60) * (1 - d.valor / maxV), em: d.em }))
        : (m.tendencia === "cai" ? [0.15, 0.3, 0.38, 0.6, 0.85] : m.tendencia === "oscila" ? [0.6, 0.3, 0.65, 0.35, 0.5] : [0.85, 0.7, 0.62, 0.4, 0.15]).map((v, i, l) => ({
            x: area.x + (area.w * i) / (l.length - 1),
            y: area.y + 20 + (area.h - 60) * v,
            em: (m.tendenciaEm ?? m.de + 0.3) + i * 0.22,
          }));
    const comp = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
    const ini = pts[0].em;
    const fim = pts[pts.length - 1].em + 0.3;
    const p = prog(t, ini - 0.05, Math.max(0.4, fim - ini), suave);
    corpo = (
      <>
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={w} height={h}>
          <line x1={area.x} x2={area.x + area.w} y1={area.y + area.h} y2={area.y + area.h} stroke={COR.linha} strokeWidth={3} />
          <polyline points={pts.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke={COR.tinta} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={comp} strokeDashoffset={comp * (1 - p)} />
          {pts.map((q, i) => (t >= q.em - 0.05 ? <circle key={i} cx={q.x} cy={q.y} r={11} fill={COR.lima} stroke={COR.tinta} strokeWidth={4} /> : null))}
        </svg>
        {dados.length >= 2
          ? dados.map((d, i) => (
              <div key={i} style={{ position: "absolute", left: pts[i].x - 80, width: 160, top: area.y + area.h + 8, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: 24, color: COR.apagado, opacity: prog(t, d.em - 0.05, 0.3), whiteSpace: "nowrap" }}>
                {d.rotulo} · {fmt(d.valor)}
              </div>
            ))
          : null}
      </>
    );
  }
  return (
    <Cartao x={xNoLado(m.lado ?? "centro", w)} y={z.topo + 4} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <div style={{ position: "absolute", left: pad, top: pad - 6, fontFamily: FONTE, fontWeight: 700, fontSize: 32, color: COR.tinta, whiteSpace: "nowrap" }}>{m.titulo}</div> : null}
      {corpo}
      {m.ilustrativo || !dados.length ? (
        <div style={{ position: "absolute", right: 22, bottom: 14, fontFamily: FONTE, fontWeight: 600, fontSize: 22, color: COR.apagado }}>ilustrativo</div>
      ) : null}
    </Cartao>
  );
};

// a sombra e o raio exportados para quem desenhar cartões próprios
export const ESTILO_CARTAO = { borderRadius: RAIO, boxShadow: SOMBRA_CARTAO };
