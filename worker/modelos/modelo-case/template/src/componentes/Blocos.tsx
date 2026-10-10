// Os 11 blocos universais na linguagem do relatório do Case: cada um vira uma página da folha, com a
// etiqueta de seção em mono, tinta escura, filetes finos e o coral só no que importa. A lista e os
// passos reaproveitam a lista que se marca da assinatura; o fechamento é a página PRÓXIMO PASSO.
import { Easing } from "remotion";
import { entrada, formatar, prog, salto, soco, suave, temposDoTexto } from "../anim";
import { larguraTexto } from "../medida";
import type {
  Abertura as TAbertura,
  Comparacao as TComparacao,
  Cta as TCta,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Numero as TNumero,
  Passos as TPassos,
  Pergunta as TPergunta,
  Plano,
  Topicos as TTopicos,
} from "../plano";
import { cor, fonte, mono } from "../tema";
import { alturaTitulo, type Bloco, Checklist, paginaDeLista, posicoesDosBlocos, TituloDePagina, topoDoConjunto } from "./Case";
import { Aviso, CabecaDePagina, caber, Datilo, Icone, type NomeIcone, Rotulo, tamanhoRotulo, Texto } from "./Pecas";
import { type Pagina, PH, PW } from "./Relatorio";

const TOPO = 84;
const CENTRO = (TOPO + PH) / 2;

// ——— abertura: o tema do relatório, grande, com o marca-texto no destaque ———
export const paginaAbertura = (m: TAbertura, plano: Plano): Pagina => {
  const em = m.em ?? m.de;
  const inicio = em <= 0.2 ? Math.max(0, em - 0.16) : em;
  const etiqueta = m.etiqueta ?? "Tema";
  const f = caber(m.texto, PW, 116, 56, 4);
  const altT = f.linhas.length * f.tamanho * 1.12;
  const y0 = CENTRO - (altT + 46) / 2;
  return {
    chegada: em,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const tempos = temposDoTexto(m.texto, inicio, plano.palavras, m.ate).map((x, i) => (i === 0 ? inicio : x));
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={inicio} largura={PW} />
          <div style={{ position: "absolute", left: 0, top: y0, width: 130 * prog(t, inicio, 0.4), height: 12, borderRadius: 3, background: cor.acento }} />
          <div style={{ position: "absolute", left: 0, top: y0 + 46, width: PW }}>
            <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={tempos} destaque={m.destaque} marca />
          </div>
        </>
      );
    },
  };
};

// ——— tópicos e passos: a lista que se marca ———
export const paginaLista = (m: TTopicos | TPassos, plano: Plano): Pagina => {
  const passos = m.tipo === "passos";
  const chegada = m.titulo ? m.de : (m.itens[0]?.em ?? m.de);
  return paginaDeLista({
    m,
    plano,
    etiqueta: m.etiqueta ?? (passos ? "Passo a passo" : "Pontos"),
    chegada,
    titulo: m.titulo,
    tituloEm: m.de,
    itens: m.itens,
    marcador: passos ? "caixa" : "ponto",
    ligados: passos,
    maxTitulo: 76,
  });
};

// ——— número: o indicador do relatório ———
export const paginaNumero = (m: TNumero, plano: Plano): Pagina => {
  const etiqueta = m.etiqueta ?? "Em números";
  const casas = m.casas ?? 0;
  const texto = (v: number) => `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const final = texto(m.valor);
  const f = caber(final.replace(/\d/g, "0"), PW, 230, 90, 1);
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;
  const fR = caber(m.rotulo, PW, 58, 34, 2, 700);
  const altN = f.tamanho * 1.08;
  const altR = fR.linhas.length * fR.tamanho * 1.12;
  const total = altN + 44 + altR;
  const y0 = CENTRO - total / 2;
  const chegada = Math.max(m.de, m.em - 0.2);
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const pC = prog(t, m.em, 0.9, Easing.out(Easing.cubic));
      const golpe = soco(t, m.em + 0.9, 0.3);
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} />
          {m.ilustrativo ? (
            <div style={{ position: "absolute", right: 0, top: TOPO + 6 }}>
              <Aviso texto="ilustrativo" />
            </div>
          ) : null}
          {t >= m.em ? (
            <div style={{ position: "absolute", left: 0, top: y0, transform: golpe ? `scale(${1 + 0.04 * golpe})` : undefined, transformOrigin: "0% 50%" }}>
              <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: f.tamanho, color: cor.tinta, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1.08, whiteSpace: "nowrap" }}>{texto(m.valor * pC)}</span>
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, top: y0 + altN + 12, width: PW, height: 10, borderRadius: 5, background: cor.esqueleto }}>
            <div style={{ width: `${pC * 100}%`, height: 10, borderRadius: 5, background: cor.acento }} />
          </div>
          <div style={{ position: "absolute", left: 0, top: y0 + altN + 44, width: PW }}>
            <Texto t={t} linhas={fR.linhas} tamanho={fR.tamanho} peso={700} cor={cor.tintaSuave} tempos={temposDoTexto(m.rotulo, rotuloEm, plano.palavras, m.ate)} />
          </div>
        </>
      );
    },
  };
};

// ——— comparação: duas colunas do relatório; a vencedora ganha o coral ———
export const paginaComparacao = (m: TComparacao, plano: Plano): Pagina => {
  const etiqueta = m.etiqueta ?? (m.modo === "antes-depois" ? "Antes × depois" : m.modo === "errado-certo" ? "Errado × certo" : "Comparação");
  const altT = alturaTitulo(m.titulo, 72);
  const topo = TOPO + (m.titulo ? altT + 30 : 16);
  const gap = 36;
  const cw = (PW - gap) / 2;
  const ch = PH - topo - 8;
  const chegada = m.titulo ? m.de : m.lados[0].em;
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const pV = m.vencedor !== undefined ? prog(t, vEm, 0.3) : 0;
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} />
          {m.titulo ? <TituloDePagina t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.lados[0].em} max={72} topo={TOPO + 6} /> : null}
          {m.lados.map((l, i) => {
            const e = entrada(t, l.em, { sobe: 24 });
            const vence = m.vencedor === i;
            const perde = m.vencedor !== undefined && !vence;
            const fT = caber(l.texto, cw - 64, 66, 32, 5);
            const tamR = tamanhoRotulo(l.rotulo, cw - 64, 30, 20);
            const icone: NomeIcone | null = m.modo === "errado-certo" ? (i === 0 ? "errado" : "certo") : vence ? "certo" : null;
            const corIcone = m.modo === "errado-certo" && i === 0 ? cor.tintaSuave : cor.acento;
            const pI = m.modo === "errado-certo" ? prog(t, l.em + 0.2, 0.3, salto) : pV;
            return (
              <div key={i} style={{ position: "absolute", left: i * (cw + gap), top: topo, width: cw, height: ch, opacity: t < l.em ? 0 : e.opacity * (1 - 0.5 * (perde ? pV : 0)), transform: e.transform }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 18, background: cor.cartao, border: `${vence ? 2 + 3 * pV : 2}px solid ${vence && pV > 0 ? cor.acento : cor.filete}` }} />
                <div style={{ position: "absolute", left: 32, top: 30 }}>
                  <Rotulo texto={l.rotulo} tamanho={tamR} cor={vence && pV > 0.5 ? cor.acento : cor.tintaSuave} />
                </div>
                <div style={{ position: "absolute", left: 32, top: 30 + tamR * 1.2 + 14, width: cw - 64, height: 2, background: cor.filete }} />
                <div style={{ position: "absolute", left: 32, top: 30 + tamR * 1.2 + 40, width: cw - 64 }}>
                  <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={temposDoTexto(l.texto, l.em, plano.palavras, m.ate)} />
                </div>
                {icone && pI > 0 ? (
                  <div style={{ position: "absolute", right: 22, bottom: 22, width: 84, height: 84, borderRadius: 42, background: corIcone, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pI})` }}>
                    <Icone nome={icone} tamanho={52} cor={cor.papel} traco={3} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </>
      );
    },
  };
};

// ——— gráfico: barras de tinta (a última em coral), linha, rosca ou a tendência ilustrativa ———
export const paginaGrafico = (m: TGrafico, plano: Plano): Pagina => {
  const etiqueta = m.etiqueta ?? "Gráfico";
  const dados = (m.dados ?? []).slice(0, 6);
  const titulo = m.titulo;
  const fT = titulo ? caber(titulo, PW - (m.ilustrativo || !dados.length ? 200 : 0), 64, 38, 2) : null;
  const altT = fT ? fT.linhas.length * fT.tamanho * 1.12 : 0;
  const topo = TOPO + (fT ? altT + 34 : 30);
  const base = PH - 56;
  const chegada = titulo ? m.de : (dados[0]?.em ?? m.tendenciaEm ?? m.de);
  const un = (m.unidade ?? "").trim();
  const fmt = (v: number) => {
    const casas = Number.isInteger(v) ? 0 : 1;
    return /^(R\$|US\$|\$|€)$/.test(un) ? `${un} ${formatar(v, casas)}` : un ? `${formatar(v, casas)}${un === "%" ? "%" : ` ${un}`}` : formatar(v, casas);
  };
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      let conteudo: React.ReactNode = null;
      const H = base - topo - 70;
      if (dados.length && m.forma === "pizza") {
        const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
        const R = Math.min(base - topo, 380) / 2;
        const traco = R * 0.38;
        const r = R - traco / 2;
        const circ = 2 * Math.PI * r;
        const tons = [cor.acento, cor.tinta, cor.tintaSuave, cor.tintaFraca, cor.acentoClaro, cor.filete];
        let acum = 0;
        const cy = (topo + base) / 2;
        conteudo = (
          <>
            <svg width={R * 2} height={R * 2} style={{ position: "absolute", left: 0, top: cy - R }}>
              <circle cx={R} cy={R} r={r} fill="none" stroke={cor.esqueleto} strokeWidth={traco} />
              {dados.map((d, i) => {
                const frac = (d.valor / total) * prog(t, d.em, 0.5, suave);
                const el = <circle key={i} cx={R} cy={R} r={r} fill="none" stroke={tons[i % tons.length]} strokeWidth={traco} strokeDasharray={`${circ * frac} ${circ}`} strokeDashoffset={-circ * acum} transform={`rotate(-90 ${R} ${R})`} />;
                acum += d.valor / total;
                return el;
              })}
            </svg>
            <div style={{ position: "absolute", left: R * 2 + 44, right: 0, top: cy - (dados.length * 76) / 2 }}>
              {dados.map((d, i) =>
                t >= d.em ? (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, height: 76, opacity: prog(t, d.em, 0.25) }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: tons[i % tons.length], flexShrink: 0 }} />
                    <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: caber(`${d.rotulo} ${fmt(d.valor)}`, PW - R * 2 - 90, 42, 24, 1).tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>
                      {d.rotulo} <span style={{ color: cor.acento }}>{fmt(d.valor)}</span>
                    </span>
                  </div>
                ) : null,
              )}
            </div>
          </>
        );
      } else if (dados.length) {
        const max = Math.max(...dados.map((d) => d.valor)) || 1;
        const n = dados.length;
        const passo = PW / n;
        const pts = dados.map((d, i) => ({ x: passo * (i + 0.5), y: base - (d.valor / max) * H, d }));
        const tamR = Math.min(30, ...dados.map((d) => tamanhoRotulo(d.rotulo, passo - 12, 30, 18)));
        conteudo = (
          <>
            <div style={{ position: "absolute", left: 0, top: base, width: PW * prog(t, chegada, 0.4), height: 3, background: cor.tinta }} />
            {m.forma === "linha" ? (
              <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                {pts.slice(1).map((p, i) => {
                  const a = pts[i];
                  const k = prog(t, p.d.em - 0.1, 0.4, suave);
                  return k > 0 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (p.x - a.x) * k} y2={a.y + (p.y - a.y) * k} stroke={cor.tinta} strokeWidth={6} strokeLinecap="round" /> : null;
                })}
                {pts.map((p, i) => (t >= p.d.em ? <circle key={i} cx={p.x} cy={p.y} r={(i === n - 1 ? 16 : 11) * prog(t, p.d.em, 0.3, salto)} fill={i === n - 1 ? cor.acento : cor.papel} stroke={i === n - 1 ? cor.acento : cor.tinta} strokeWidth={5} /> : null))}
              </svg>
            ) : (
              pts.map((p, i) => {
                const k = prog(t, p.d.em, 0.5, salto);
                const h = (base - p.y) * k;
                return t >= p.d.em ? <div key={i} style={{ position: "absolute", left: p.x - passo * 0.3, width: passo * 0.6, top: base - h, height: h, borderRadius: "10px 10px 0 0", background: i === n - 1 ? cor.acento : cor.tinta }} /> : null;
              })
            )}
            {pts.map((p, i) =>
              t >= p.d.em ? (
                <div key={i}>
                  <div style={{ position: "absolute", left: p.x - passo / 2, width: passo, top: (m.forma === "linha" ? p.y : base - (base - p.y) * prog(t, p.d.em, 0.5, salto)) - 60, textAlign: "center", opacity: prog(t, p.d.em + 0.15, 0.25) }}>
                    <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: caber(fmt(p.d.valor), passo - 8, 44, 22, 1).tamanho, color: i === n - 1 ? cor.acento : cor.tinta, whiteSpace: "nowrap" }}>{fmt(p.d.valor)}</span>
                  </div>
                  <div style={{ position: "absolute", left: p.x - passo / 2, width: passo, top: base + 16, display: "flex", justifyContent: "center" }}>
                    <Rotulo texto={p.d.rotulo} tamanho={tamR} />
                  </div>
                </div>
              ) : null,
            )}
          </>
        );
      } else {
        // sem números ditos: a forma da tendência, com a etiqueta "ilustrativo"
        const em = m.tendenciaEm ?? chegada + 0.3;
        const k = prog(t, chegada + 0.1, Math.max(0.6, em - chegada + 0.4), suave);
        const n = 40;
        const pts = Array.from({ length: n + 1 }, (_, i) => {
          const x = i / n;
          const y = m.tendencia === "cai" ? 0.12 + 0.76 * x * x : m.tendencia === "oscila" ? 0.5 + 0.3 * Math.sin(x * Math.PI * 3.2) : 0.88 - 0.76 * x * x;
          return { x: 10 + x * (PW - 40), y: topo + 20 + y * (base - topo - 40) };
        });
        const vis = pts.slice(0, Math.max(2, Math.round(n * k) + 1));
        const ponta = vis[vis.length - 1];
        conteudo = (
          <>
            <div style={{ position: "absolute", left: 0, top: base, width: PW, height: 3, background: cor.tinta }} />
            <svg width={PW} height={PH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
              <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={cor.esqueleto} strokeWidth={6} strokeDasharray="10 14" strokeLinecap="round" />
              <polyline points={vis.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={cor.acento} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={ponta.x} cy={ponta.y} r={16} fill={cor.acento} stroke={cor.papel} strokeWidth={5} />
            </svg>
          </>
        );
      }
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} />
          {fT && titulo ? (
            <div style={{ position: "absolute", left: 0, top: TOPO + 6, width: PW }}>
              <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} tempos={temposDoTexto(titulo, m.de, plano.palavras, dados[0]?.em ?? m.ate)} />
            </div>
          ) : null}
          {m.ilustrativo || !dados.length ? (
            <div style={{ position: "absolute", right: 0, top: TOPO + 10 }}>
              <Aviso texto="ilustrativo" />
            </div>
          ) : null}
          {conteudo}
        </>
      );
    },
  };
};

// ——— destaque: a frase-chave com o filete coral (alerta: tudo em coral) ———
export const paginaDestaque = (m: TDestaque, plano: Plano): Pagina => {
  const alerta = m.nivel === "alerta";
  const etiqueta = m.etiqueta ?? (alerta ? "Atenção" : "Ponto-chave");
  const f = caber(m.texto, PW - 48, 112, 52, 4);
  const altT = f.linhas.length * f.tamanho * 1.12;
  const fD = m.detalhe ? caber(m.detalhe, PW - 48, 44, 28, 2, 500) : null;
  const altD = fD ? fD.linhas.length * fD.tamanho * 1.12 + 30 : 0;
  const total = altT + altD;
  const y0 = CENTRO - total / 2;
  const chegada = Math.max(m.de, m.em - 0.1);
  const detEm = m.detalheEm ?? m.em + 0.6;
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const e = entrada(t, m.em - 0.03, { sobe: 22 });
      const pL = prog(t, m.em - 0.03, 0.4, suave);
      const golpe = soco(t, m.em, 0.3);
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} acento={alerta} />
          <div style={{ position: "absolute", left: 0, top: y0 - 6, width: 12, height: (total + 12) * pL, borderRadius: 3, background: cor.acento }} />
          {t >= m.em - 0.03 ? (
            <div style={{ position: "absolute", left: 48, top: y0, width: PW - 48, opacity: e.opacity, transform: e.transform ?? (golpe ? `scale(${1 + 0.02 * golpe})` : undefined), transformOrigin: "0% 50%" }}>
              <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} cor={alerta ? cor.acento : cor.tinta} />
            </div>
          ) : null}
          {fD && m.detalhe && t >= detEm ? (
            <div style={{ position: "absolute", left: 48, top: y0 + altT + 30, width: PW - 48 }}>
              <Texto t={t} linhas={fD.linhas} tamanho={fD.tamanho} peso={500} cor={cor.tintaSuave} tempos={temposDoTexto(m.detalhe, detEm, plano.palavras, m.ate)} />
            </div>
          ) : null}
        </>
      );
    },
  };
};

// ——— definição: o verbete do glossário do relatório ———
export const paginaDefinicao = (m: TDefinicao, plano: Plano): Pagina => {
  const etiqueta = m.etiqueta ?? "Definição";
  const fT = caber(m.termo, PW, 128, 56, 2);
  const altT = fT.linhas.length * fT.tamanho * 1.08;
  const fS = caber(m.significado, PW, 56, 32, 4, 700);
  const altS = fS.linhas.length * fS.tamanho * 1.12;
  const total = altT + 40 + altS;
  const y0 = CENTRO - total / 2;
  const chegada = Math.max(m.de, m.em - 0.1);
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const e = entrada(t, m.em, { sobe: 20 });
      const largT = Math.max(...fT.linhas.map((l) => larguraTexto(l, fT.tamanho)));
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} />
          {t >= m.em ? (
            <div style={{ position: "absolute", left: 0, top: y0, width: PW, opacity: e.opacity, transform: e.transform }}>
              <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} altura={1.08} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: 0, top: y0 + altT + 8, width: Math.min(PW, largT) * prog(t, m.em + 0.1, 0.45, suave), height: 10, borderRadius: 3, background: cor.acento }} />
          <div style={{ position: "absolute", left: 0, top: y0 + altT + 40, width: PW }}>
            <Datilo t={t} linhas={fS.linhas} tamanho={fS.tamanho} peso={700} cor={cor.tintaSuave} em={m.significadoEm} palavras={plano.palavras} ate={m.ate} />
          </div>
        </>
      );
    },
  };
};

// ——— frase: a citação com as aspas coral ———
export const paginaFrase = (m: TFrase, plano: Plano): Pagina => {
  const em = m.em ?? m.de;
  const etiqueta = m.etiqueta ?? "Frase";
  const f = caber(m.texto, PW, 92, 46, 5);
  const altT = f.linhas.length * f.tamanho * 1.12;
  const y0 = CENTRO - (altT + 110) / 2 + 110;
  return {
    chegada: m.de,
    etiqueta,
    altura: PH,
    momento: m,
    desenhar: (t) => {
      const pA = prog(t, m.de, 0.35, salto);
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={m.de} largura={PW} />
          <div style={{ position: "absolute", left: -6, top: y0 - 150, fontFamily: fonte, fontWeight: 800, fontSize: 220, lineHeight: 1, color: cor.acento, opacity: pA, transform: `scale(${0.7 + 0.3 * pA})`, transformOrigin: "0% 100%" }}>“</div>
          <div style={{ position: "absolute", left: 0, top: y0, width: PW }}>
            <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, m.ate)} destaque={m.destaque} marca risco={m.risco} riscoEm={m.riscoEm} />
          </div>
        </>
      );
    },
  };
};

// ——— a ação do fechamento: caixa de comentário, ou botão (salvar, seguir, link) ———
const Acao: React.FC<{ t: number; m: TCta; y: number; altura: number }> = ({ t, m, y, altura }) => {
  const em = m.em ?? m.de;
  const icone = m.icone ?? "comentar";
  const palavra = (m.destaque ?? "").trim();
  const quando = m.destaqueEm ?? em + 0.5;
  const e = entrada(t, em, { sobe: 26 });
  if (icone === "comentar") {
    const letras = [...palavra];
    const n = t < quando ? 0 : Math.min(letras.length, Math.floor((t - quando) / 0.07) + 1);
    const fimEscrita = quando + letras.length * 0.07;
    const toque = fimEscrita + 0.18;
    const pT = soco(t, toque, 0.3);
    const onda = t >= toque ? prog(t, toque, 0.6) : 0;
    const tamP = Math.min(66, altura * 0.5);
    return (
      <div style={{ position: "absolute", left: 0, top: y, width: PW, height: altura, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: altura / 2, background: cor.cartao, border: `3px solid ${cor.tinta}`, boxShadow: "0 10px 24px rgba(18,23,34,0.1)" }} />
        <div style={{ position: "absolute", left: 18, top: (altura - 84) / 2, width: 84, height: 84, borderRadius: 42, background: cor.acentoClaro, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="comentar" tamanho={48} cor={cor.acento} traco={2.4} />
        </div>
        <div style={{ position: "absolute", left: 128, top: 0, height: altura, display: "flex", alignItems: "center" }}>
          {n === 0 ? (
            <span style={{ fontFamily: mono, fontSize: 26, color: cor.tintaFraca, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>escreva um comentário</span>
          ) : (
            <span style={{ position: "relative", fontFamily: fonte, fontWeight: 800, fontSize: tamP, color: cor.tinta, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
              {letras.slice(0, n).join("")}
              {t < toque + 0.4 && (n < letras.length || Math.floor(t * 3.4) % 2 === 0) ? (
                <span style={{ display: "inline-block", width: 6, height: tamP * 0.9, marginLeft: 6, background: cor.acento, verticalAlign: "-0.08em" }} />
              ) : null}
            </span>
          )}
        </div>
        <div style={{ position: "absolute", right: 16, top: (altura - 92) / 2, width: 92, height: 92 }}>
          {onda > 0 && onda < 1 ? <div style={{ position: "absolute", inset: 0, borderRadius: 46, border: `5px solid ${cor.acento}`, opacity: 1 - onda, transform: `scale(${1 + 0.6 * onda})` }} /> : null}
          <div style={{ position: "absolute", inset: 0, borderRadius: 46, background: n >= letras.length && letras.length ? cor.acento : cor.tintaFraca, display: "flex", alignItems: "center", justifyContent: "center", transform: pT ? `scale(${1 - 0.12 * pT})` : undefined }}>
            <Icone nome="enviar" tamanho={46} cor={cor.papel} traco={2.4} />
          </div>
        </div>
      </div>
    );
  }
  // botão: salvar, seguir ou link
  const rotulo = palavra || (icone === "salvar" ? "Salvar" : icone === "seguir" ? "Seguir" : "Link na bio");
  const pT = prog(t, quando, 0.25);
  const golpe = soco(t, quando, 0.3);
  const fR = caber(rotulo, PW - 300, 60, 34, 1);
  const largB = Math.min(PW, larguraTexto(rotulo, fR.tamanho) + 220);
  return (
    <div style={{ position: "absolute", left: (PW - largB) / 2, top: y, width: largB, height: altura, opacity: e.opacity, transform: e.transform ?? (golpe ? `scale(${1 - 0.06 * golpe})` : undefined) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: altura / 2, background: pT > 0 ? cor.acento : cor.cartao, border: `3px solid ${pT > 0 ? cor.acento : cor.tinta}` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
        <Icone nome={icone} tamanho={54} cor={pT > 0 ? cor.papel : cor.tinta} traco={2.4} preencher={icone === "salvar" && pT > 0 ? cor.papel : undefined} />
        <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: fR.tamanho, color: pT > 0 ? cor.papel : cor.tinta, whiteSpace: "nowrap" }}>{rotulo}</span>
      </div>
    </div>
  );
};

// ——— PRÓXIMO PASSO: a pergunta (opcional) + a chamada + a ação ———
// Nada espera em branco: a pergunta chega no meio da página; quando a chamada é dita, ela sobe e
// a chamada e a caixa de comentário entram embaixo, já com conteúdo.
export const paginaFechamento = (plano: Plano, cta: TCta | null, pergunta: TPergunta | null): Pagina => {
  const etiqueta = cta?.etiqueta ?? pergunta?.etiqueta ?? (cta ? "Próximo passo" : "Pergunta");
  const ctaEm = cta ? (cta.em ?? cta.de) : Infinity;
  const pEm = pergunta ? (pergunta.em ?? pergunta.de) : Infinity;
  const area = PH - 8 - (TOPO + 8);
  const altAcao = 124;
  const opcoes = pergunta && !cta ? (pergunta.opcoes ?? []).slice(0, 4) : [];
  let fP = pergunta ? caber(pergunta.texto, PW, 96, 48, 3) : null;
  const fC = cta ? caber(cta.texto, PW, 108, 52, 2) : null;
  const altC = fC ? fC.linhas.length * fC.tamanho * 1.12 + 40 + altAcao : 0;
  let altP = fP ? fP.linhas.length * fP.tamanho * 1.12 : 0;
  const gap = 52;
  if (fP && pergunta && altP + (cta ? gap : 0) + altC > area) {
    fP = caber(pergunta.texto, PW, Math.max(48, Math.floor((area - altC - gap) / 3 / 1.12)), 40, 3);
    altP = fP.linhas.length * fP.tamanho * 1.12;
  }
  const rowH = opcoes.length ? Math.min(130, (area - altP - 30 - 16 * (opcoes.length - 1)) / opcoes.length) : 0;
  const blocos: Bloco[] = [
    ...(pergunta ? [{ h: altP, em: pEm }] : []),
    ...(cta ? [{ h: altC, em: ctaEm }] : []),
    ...opcoes.map((o) => ({ h: rowH, em: o.em })),
  ];
  const chegada = Math.min(pEm, ctaEm);
  const fimP = pergunta ? Math.min(pergunta.ate, ctaEm) : Infinity;
  return {
    chegada,
    etiqueta,
    altura: PH,
    momento: (cta ?? pergunta) as TCta,
    desenhar: (t) => {
      const g = opcoes.length ? 16 : gap;
      const topo = topoDoConjunto(t, blocos, g);
      const ys = posicoesDosBlocos(topo, blocos, g);
      const yP = ys[0];
      const yC = pergunta ? ys[1] : ys[0];
      const yAcao = fC ? yC + fC.linhas.length * fC.tamanho * 1.12 + 40 : 0;
      return (
        <>
          <CabecaDePagina t={t} texto={etiqueta} em={chegada} largura={PW} acento={!!cta} />
          {pergunta && fP ? (
            <div style={{ position: "absolute", left: 0, top: yP, width: PW }}>
              <Texto t={t} linhas={fP.linhas} tamanho={fP.tamanho} tempos={temposDoTexto(pergunta.texto, pEm, plano.palavras, fimP)} destaque={pergunta.destaque} marca />
            </div>
          ) : null}
          {opcoes.length ? <Checklist t={t} plano={plano} itens={opcoes} ys={ys.slice(1)} rowH={rowH} ate={Infinity} marcador="ponto" /> : null}
          {cta && fC && t >= ctaEm - 0.02 ? (
            <>
              <div style={{ position: "absolute", left: 0, top: yC, width: PW }}>
                <Texto t={t} linhas={fC.linhas} tamanho={fC.tamanho} tempos={temposDoTexto(cta.texto, ctaEm, plano.palavras, Math.min(cta.ate, plano.duracao))} destaque={cta.destaque} />
              </div>
              <Acao t={t} m={cta} y={yAcao} altura={altAcao} />
            </>
          ) : null}
        </>
      );
    },
  };
};
