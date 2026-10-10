// Os 11 blocos universais na linguagem do painel do Quiz: tudo acontece no painel claro acima da
// cabeça, em cartões brancos com selos cobalto; o que "está certo" acende em verde, como na revelação.
import { Easing, Img, staticFile } from "remotion";
import { entrada, formatar, prog, saindo, salto, soco, suave, temposDoTexto } from "../anim";
import { larguraTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
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
  Quiz as TQuiz,
  Topicos as TTopicos,
} from "../plano";
import { cor, fonte, PAINEL, RAIO, sombra, sombraLeve } from "../tema";
import { caber, Etiqueta, Icone, type NomeIcone, Selo, Texto } from "./Pecas";
import { CartaoOpcao, corpoComum, geometria, Painel } from "./Quiz";

type Comum = { t: number; plano: Plano; fim: number };

const LETRAS = ["A", "B", "C", "D"];
const CENTRO_Y = (PAINEL.y + PAINEL.base) / 2;

// tudo de um bloco some junto no fim dele
const Saida: React.FC<{ t: number; fim: number; children: React.ReactNode }> = ({ t, fim, children }) => {
  const s = saindo(t, fim, 0.2);
  return <div style={{ position: "absolute", inset: 0, opacity: 1 - s, transform: s > 0 ? `scale(${1 - 0.03 * s})` : undefined }}>{children}</div>;
};

// Título no alto do painel (listas, comparação, gráfico): centrado, com o traço cobalto acima.
const alturaTitulo = (texto?: string) => {
  if (!texto) return 0;
  const f = caber(texto, PAINEL.w, 60, 38, 2);
  return f.linhas.length * f.tamanho * 1.14 + 44;
};
const Titulo: React.FC<{ t: number; plano: Plano; texto?: string; em: number; ate: number }> = ({ t, plano, texto, em, ate }) => {
  if (!texto) return null;
  const f = caber(texto, PAINEL.w, 60, 38, 2);
  const p = prog(t, em - 0.05, 0.3);
  return (
    <>
      <div style={{ position: "absolute", left: PAINEL.x + PAINEL.w / 2 - 44 * p, top: PAINEL.y, width: 88 * p, height: 8, borderRadius: 4, background: cor.acento }} />
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: PAINEL.y + 22 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(texto, em, plano.palavras, ate)} />
      </div>
    </>
  );
};

// ——— abertura: o título do programa, com as quatro letras do painel ———
export const Abertura: React.FC<Comum & { m: TAbertura }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const inicio = em <= 0.2 ? em - 0.16 : em;
  const tempos = temposDoTexto(m.texto, inicio, plano.palavras, m.ate).map((x, i) => (i === 0 ? inicio : x));
  const f = caber(m.texto, PAINEL.w, 108, 56, 3);
  const altT = f.linhas.length * f.tamanho * 1.14;
  const tamSelo = 92;
  const total = tamSelo + 44 + altT;
  const y0 = CENTRO_Y - total / 2;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0, display: "flex", justifyContent: "center", gap: 22 }}>
        {LETRAS.map((l, i) => {
          const e = entrada(t, inicio + i * 0.07, { de: 0.4, dur: 0.36 });
          const boia = Math.sin(t * 3 + i * 1.3) * 6;
          return (
            <div key={l} style={{ opacity: e.opacity, transform: `${e.transform ?? ""} translateY(${boia}px)` }}>
              <Selo texto={l} tamanho={tamSelo} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0 + tamSelo + 44 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={tempos} destaque={m.destaque} />
      </div>
    </Saida>
  );
};

// ——— tópicos e passos: as linhas do painel (como alternativas), cada uma entra na fala ———
export const Lista: React.FC<Comum & { m: TTopicos | TPassos }> = ({ t, plano, m, fim }) => {
  const passos = m.tipo === "passos";
  const altT = alturaTitulo(m.titulo);
  const topo = PAINEL.y + altT + (m.titulo ? 10 : 20);
  const n = m.itens.length;
  const vao = 20;
  const alt = Math.min(150, (PAINEL.base - topo - vao * (n - 1)) / n);
  const y0 = topo + (PAINEL.base - topo - (alt * n + vao * (n - 1))) / 2;
  const entrou = m.itens.filter((it) => t >= it.em).length;
  const tamSelo = Math.min(76, alt - 34);
  const xSelo = 22;
  const larguraTexto0 = PAINEL.w - xSelo - tamSelo - 28 - 30;
  return (
    <Saida t={t} fim={fim}>
      <Titulo t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.itens[0]?.em ?? m.ate} />
      {passos && n > 1 ? (
        // o fio que liga os números: enche até o passo atual
        <div style={{ position: "absolute", left: PAINEL.x + xSelo + tamSelo / 2 - 4, top: y0 + alt / 2, width: 8, height: (n - 1) * (alt + vao), borderRadius: 4, background: cor.linha }}>
          <div style={{ width: 8, borderRadius: 4, background: cor.acento, height: entrou >= 2 ? (entrou - 2 + prog(t, m.itens[entrou - 1].em, 0.35, suave)) * (alt + vao) : 0 }} />
        </div>
      ) : null}
      {m.itens.map((it, i) => {
        if (t < it.em) return null;
        const e = entrada(t, it.em, { de: 0.9, sobe: 26 });
        const atual = i === entrou - 1 ? 1 - prog(t, (m.itens[i + 1]?.em ?? fim) - 0.05, 0.15) : 0;
        const temDet = !!it.detalhe;
        const fit = caber(it.texto, larguraTexto0, temDet ? 46 : 52, 28, temDet ? 1 : 2, 700);
        const fitD = temDet ? caber(it.detalhe as string, larguraTexto0, 32, 22, 1, 600) : null;
        const altTxt = fit.linhas.length * fit.tamanho * 1.14 + (fitD ? fitD.tamanho * 1.2 + 4 : 0);
        return (
          <div key={i} style={{ position: "absolute", left: PAINEL.x, top: y0 + i * (alt + vao), width: PAINEL.w, height: alt, opacity: e.opacity, transform: e.transform }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: alt / 2.6, background: cor.cartao, boxShadow: sombraLeve, border: `5px solid rgba(47,75,255,${atual})` }} />
            <div style={{ position: "absolute", left: xSelo, top: (alt - tamSelo) / 2 }}>
              <Selo texto={passos ? String(i + 1) : ""} tamanho={tamSelo} icone={passos ? undefined : "certo"} />
            </div>
            <div style={{ position: "absolute", left: xSelo + tamSelo + 28, top: (alt - altTxt) / 2, width: larguraTexto0 }}>
              <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} peso={700} alinhar="left" />
              {fitD ? (
                <div style={{ marginTop: 4 }}>
                  <Texto t={t} linhas={fitD.linhas} tamanho={fitD.tamanho} peso={600} cor={cor.tintaSuave} alinhar="left" />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </Saida>
  );
};

// ——— número: o placar ———
export const Numero: React.FC<Comum & { m: TNumero }> = ({ t, m, fim }) => {
  const casas = m.casas ?? 0;
  const texto = (v: number) => `${m.prefixo ?? ""}${formatar(v, casas)}${m.sufixo ?? ""}`;
  const final = texto(m.valor);
  const f = caber(final.replace(/\d/g, "0"), PAINEL.w - 120, 230, 90, 1);
  const pC = prog(t, m.em, 0.9, Easing.out(Easing.cubic));
  const v = m.valor * pC;
  const entra = Math.max(m.de, m.em - 0.2);
  const e = entrada(t, entra, { de: 0.85, sobe: 30 });
  const altCard = f.tamanho * 1.25 + 90;
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;
  const fR = caber(m.rotulo, PAINEL.w - 140, 54, 30, 2, 700);
  const altR = fR.linhas.length * fR.tamanho * 1.14 + 40;
  const total = altCard + 28 + altR;
  const y0 = CENTRO_Y - total / 2;
  const pR = entrada(t, rotuloEm, { de: 0.8, sobe: 20 });
  const golpe = soco(t, m.em + 0.9, 0.3);
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: PAINEL.w, height: altCard, opacity: e.opacity, transform: e.transform, visibility: e.visivel ? "visible" : "hidden" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 30, textAlign: "center", transform: golpe ? `scale(${1 + 0.05 * golpe})` : undefined }}>
          <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: f.tamanho, color: cor.tinta, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em", lineHeight: 1.1, whiteSpace: "nowrap" }}>{texto(v)}</span>
        </div>
        {/* a régua que enche enquanto o número conta */}
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 34, height: 12, borderRadius: 6, background: cor.acentoClaro }}>
          <div style={{ width: `${pC * 100}%`, height: 12, borderRadius: 6, background: cor.acento }} />
        </div>
        {m.ilustrativo ? (
          <div style={{ position: "absolute", right: 22, top: 18 }}>
            <Etiqueta texto="ilustrativo" fundo={cor.acentoClaro} tinta={cor.acentoEscuro} tamanho={20} />
          </div>
        ) : null}
      </div>
      {t >= rotuloEm ? (
        <div style={{ position: "absolute", left: PAINEL.x + 40, width: PAINEL.w - 80, top: y0 + altCard + 28, height: altR, opacity: pR.opacity, transform: pR.transform }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: altR / 2.4, background: cor.acento, boxShadow: "0 10px 24px rgba(47,75,255,0.28)" }} />
          <div style={{ position: "absolute", left: 30, right: 30, top: 20 }}>
            <Texto t={t} linhas={fR.linhas} tamanho={fR.tamanho} peso={700} cor={cor.cartao} />
          </div>
        </div>
      ) : null}
    </Saida>
  );
};

// ——— comparação: duas alternativas lado a lado; a vencedora acende em verde ———
export const Comparacao: React.FC<Comum & { m: TComparacao }> = ({ t, plano, m, fim }) => {
  const titulo = m.titulo ?? "";
  const g = geometria(titulo || " ", 2, false);
  const semTitulo = !titulo;
  const pV = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7, 0.3) : 0;
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const corpo = corpoComum(plano, m.lados, g.casas, true);
  return (
    <Saida t={t} fim={fim}>
      {semTitulo ? null : (
        <>
          <div style={{ position: "absolute", left: PAINEL.x + PAINEL.w / 2 - 44, top: g.pergunta.y - 22, width: 88, height: 8, borderRadius: 4, background: cor.acento, opacity: prog(t, m.de, 0.3) }} />
          <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: g.pergunta.y }}>
            <Texto t={t} linhas={g.pergunta.linhas} tamanho={g.pergunta.tamanho} tempos={temposDoTexto(titulo, m.de, plano.palavras, m.lados[0].em)} />
          </div>
        </>
      )}
      {m.lados.map((l, i) => {
        const casa = semTitulo ? { ...g.casas[i], y: PAINEL.y + 20, h: Math.min(600, PAINEL.base - PAINEL.y - 20) } : g.casas[i];
        const vence = m.vencedor === i;
        const perde = m.vencedor !== undefined && m.vencedor !== i;
        const icone: NomeIcone | undefined = m.modo === "errado-certo" ? (i === 0 ? "errado" : "certo") : undefined;
        const selo = m.modo === "antes-depois" ? String(i + 1) : LETRAS[i];
        return (
          <CartaoOpcao
            key={i}
            t={t}
            plano={plano}
            casa={casa}
            em={l.em}
            textoEm={l.em}
            texto={l.texto}
            selo={selo}
            icone={icone}
            imagem={l.imagem}
            rotuloTopo={l.rotulo}
            estado={{ atual: 0, certo: vence ? pV : 0, apagado: perde ? pV : 0, brilhoEm: vence ? vEm : undefined }}
            grande
            corpoMax={corpo}
          />
        );
      })}
    </Saida>
  );
};

// ——— gráfico: num cartão branco; barras cobalto, linha que se desenha ou rosca (o anel do quiz) ———
export const Grafico: React.FC<Comum & { m: TGrafico }> = ({ t, plano, m, fim }) => {
  const altT = alturaTitulo(m.titulo);
  const topo = PAINEL.y + altT + (m.titulo ? 6 : 10);
  const card = { x: PAINEL.x, y: topo, w: PAINEL.w, h: PAINEL.base - topo };
  const e = entrada(t, m.de, { de: 0.92, sobe: 30 });
  const dados = m.dados ?? [];
  const un = m.unidade ?? "";
  const fmt = (v: number) => {
    const casas = Number.isInteger(v) ? 0 : 1;
    return un.trim().startsWith("R$") || un.trim().startsWith("US$") ? `${un.trim()} ${formatar(v, casas)}` : `${formatar(v, casas)}${un}`;
  };
  const W = card.w - 100;
  const H = card.h - 150;
  let conteudo: React.ReactNode = null;
  if (dados.length && m.forma === "pizza") {
    const total = dados.reduce((a, d) => a + d.valor, 0) || 1;
    const R = Math.min(H, W * 0.5) / 2 - 10;
    const traco = R * 0.36;
    const r = R - traco / 2;
    const circ = 2 * Math.PI * r;
    const tons = [cor.acento, cor.tinta, "#7C8CFF", cor.apagado, "#B8C2FF", cor.tintaSuave];
    let acum = 0;
    conteudo = (
      <>
        <svg width={R * 2} height={R * 2} style={{ position: "absolute", left: 50, top: (card.h - R * 2) / 2 + 10 }}>
          <circle cx={R} cy={R} r={r} fill="none" stroke={cor.acentoClaro} strokeWidth={traco} />
          {dados.map((d, i) => {
            const frac = (d.valor / total) * prog(t, d.em, 0.5, suave);
            const el = (
              <circle key={i} cx={R} cy={R} r={r} fill="none" stroke={tons[i % tons.length]} strokeWidth={traco} strokeDasharray={`${circ * frac} ${circ}`} strokeDashoffset={-circ * acum} transform={`rotate(-90 ${R} ${R})`} />
            );
            acum += d.valor / total;
            return el;
          })}
        </svg>
        <div style={{ position: "absolute", left: 50 + R * 2 + 40, right: 40, top: (card.h - dados.length * 66) / 2 + 10 }}>
          {dados.map((d, i) =>
            t >= d.em ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, height: 66, opacity: prog(t, d.em, 0.25) }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: tons[i % tons.length], flexShrink: 0 }} />
                <span style={{ fontFamily: fonte, fontWeight: 700, fontSize: caber(`${d.rotulo} ${fmt(d.valor)}`, W - R * 2 - 90, 40, 24, 1, 700).tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>
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
    const passo = W / n;
    const base = card.h - 90;
    const pontos = dados.map((d, i) => ({ x: 50 + passo * (i + 0.5), y: base - (d.valor / max) * (H - 60), d }));
    const tamR = Math.min(34, ...dados.map((d) => caber(d.rotulo, passo - 16, 34, 20, 1, 700).tamanho));
    conteudo = (
      <>
        <div style={{ position: "absolute", left: 40, right: 40, top: base, height: 4, borderRadius: 2, background: cor.linha }} />
        {m.forma === "linha" ? (
          <svg width={card.w} height={card.h} style={{ position: "absolute", inset: 0 }}>
            {pontos.slice(1).map((p, i) => {
              const a = pontos[i];
              const k = prog(t, p.d.em - 0.1, 0.4, suave);
              return k > 0 ? <line key={i} x1={a.x} y1={a.y} x2={a.x + (p.x - a.x) * k} y2={a.y + (p.y - a.y) * k} stroke={cor.acento} strokeWidth={9} strokeLinecap="round" /> : null;
            })}
            {pontos.map((p, i) => (t >= p.d.em ? <circle key={i} cx={p.x} cy={p.y} r={14 * prog(t, p.d.em, 0.3, salto)} fill={cor.cartao} stroke={cor.acento} strokeWidth={7} /> : null))}
          </svg>
        ) : (
          pontos.map((p, i) => {
            const k = prog(t, p.d.em, 0.5, salto);
            const h = (base - p.y) * k;
            return t >= p.d.em ? (
              <div key={i} style={{ position: "absolute", left: p.x - passo * 0.3, width: passo * 0.6, top: base - h, height: h, borderRadius: "16px 16px 4px 4px", background: i === n - 1 ? cor.acento : "#8D9BFF" }} />
            ) : null;
          })
        )}
        {pontos.map((p, i) =>
          t >= p.d.em ? (
            <div key={i}>
              <div style={{ position: "absolute", left: p.x - passo / 2, width: passo, top: (m.forma === "linha" ? p.y : base - (base - p.y) * prog(t, p.d.em, 0.5, salto)) - 62, textAlign: "center", opacity: prog(t, p.d.em + 0.15, 0.25) }}>
                <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: caber(fmt(p.d.valor), passo - 10, 44, 22, 1).tamanho, color: cor.tinta, whiteSpace: "nowrap" }}>{fmt(p.d.valor)}</span>
              </div>
              <div style={{ position: "absolute", left: p.x - passo / 2, width: passo, top: base + 16, textAlign: "center", fontFamily: fonte, fontWeight: 700, fontSize: tamR, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{p.d.rotulo}</div>
            </div>
          ) : null,
        )}
      </>
    );
  } else {
    // sem números ditos: a forma da tendência, com a etiqueta "ilustrativo"
    const em = m.tendenciaEm ?? m.de + 0.3;
    const k = prog(t, em, 1.2, suave);
    const n = 40;
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const x = i / n;
      const y = m.tendencia === "cai" ? 0.15 + 0.7 * x * x : m.tendencia === "oscila" ? 0.5 + 0.28 * Math.sin(x * Math.PI * 3.2) : 0.85 - 0.7 * x * x;
      return { x: 50 + x * W, y: 40 + y * H };
    });
    const vis = pts.slice(0, Math.max(2, Math.round(n * k) + 1));
    const ponta = vis[vis.length - 1];
    conteudo = (
      <>
        <svg width={card.w} height={card.h} style={{ position: "absolute", inset: 0 }}>
          <polyline points={vis.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={cor.acento} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
          {t >= em ? <circle cx={ponta.x} cy={ponta.y} r={18} fill={cor.cartao} stroke={cor.acento} strokeWidth={8} /> : null}
        </svg>
        <div style={{ position: "absolute", right: 24, top: 20 }}>
          <Etiqueta texto="ilustrativo" fundo={cor.acentoClaro} tinta={cor.acentoEscuro} tamanho={20} />
        </div>
      </>
    );
  }
  return (
    <Saida t={t} fim={fim}>
      <Titulo t={t} plano={plano} texto={m.titulo} em={m.de} ate={dados[0]?.em ?? m.ate} />
      <div style={{ position: "absolute", left: card.x, top: card.y, width: card.w, height: card.h, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra }} />
        {conteudo}
        {m.ilustrativo && dados.length ? (
          <div style={{ position: "absolute", right: 24, top: 20 }}>
            <Etiqueta texto="ilustrativo" fundo={cor.acentoClaro} tinta={cor.acentoEscuro} tamanho={20} />
          </div>
        ) : null}
      </div>
    </Saida>
  );
};

// ——— destaque: a frase que bate, num cartão; "alerta" ganha o selo coral ———
export const Destaque: React.FC<Comum & { m: TDestaque }> = ({ t, plano, m, fim }) => {
  const alerta = m.nivel === "alerta";
  const f = caber(m.texto, PAINEL.w - 110, 120, 56, 3);
  const altT = f.linhas.length * f.tamanho * 1.14;
  const fD = m.detalhe ? caber(m.detalhe, PAINEL.w - 110, 44, 28, 2, 600) : null;
  const altD = fD ? fD.linhas.length * fD.tamanho * 1.14 + 26 : 0;
  const h = altT + altD + 120;
  const y0 = CENTRO_Y - h / 2;
  const e = entrada(t, m.em - 0.03, { de: 0.75, dur: 0.3 });
  const golpe = soco(t, m.em - 0.03, 0.3);
  const detEm = m.detalheEm ?? m.em + 0.5;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: PAINEL.w, height: h, opacity: e.opacity, transform: e.transform ?? (golpe ? `scale(${1 + 0.03 * golpe})` : undefined), visibility: e.visivel ? "visible" : "hidden" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra, border: `6px solid ${alerta ? cor.alerta : cor.acento}` }} />
        <div style={{ position: "absolute", left: 55, right: 55, top: 60 }}>
          <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} cor={alerta ? cor.alerta : cor.tinta} />
        </div>
        {fD && t >= detEm ? (
          <div style={{ position: "absolute", left: 55, right: 55, top: 60 + altT + 26, opacity: prog(t, detEm, 0.3) }}>
            <Texto t={t} linhas={fD.linhas} tamanho={fD.tamanho} peso={600} cor={cor.tintaSuave} tempos={temposDoTexto(m.detalhe as string, detEm, plano.palavras, m.ate)} />
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 24, top: -30 }}>
          {alerta ? (
            <div style={{ width: 74, height: 74, borderRadius: 37, background: cor.alerta, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 46, color: cor.cartao }}>!</div>
          ) : (
            <Selo texto="" tamanho={74} icone="certo" />
          )}
        </div>
      </div>
    </Saida>
  );
};

// ——— definição: o termo grande + o significado num cartão ———
export const Definicao: React.FC<Comum & { m: TDefinicao }> = ({ t, plano, m, fim }) => {
  const fT = caber(m.termo, PAINEL.w, 110, 52, 2);
  const altT = fT.linhas.length * fT.tamanho * 1.14;
  const fS = caber(m.significado, PAINEL.w - 100, 52, 30, 4, 700);
  const altS = fS.linhas.length * fS.tamanho * 1.14 + 80;
  const total = altT + 40 + altS;
  const y0 = CENTRO_Y - total / 2;
  const e = entrada(t, m.em, { de: 0.8 });
  const pL = prog(t, m.em + 0.1, 0.4, suave);
  const pS = entrada(t, m.significadoEm, { de: 0.92, sobe: 30 });
  const largT = Math.max(...fT.linhas.map((l) => larguraTexto(l, fT.tamanho)));
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0, opacity: e.opacity, transform: e.transform, visibility: e.visivel ? "visible" : "hidden" }}>
        <Texto t={t} linhas={fT.linhas} tamanho={fT.tamanho} />
        <div style={{ margin: "10px auto 0", width: Math.min(PAINEL.w, largT) * pL, height: 12, borderRadius: 6, background: cor.acento }} />
      </div>
      {t >= m.significadoEm ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0 + altT + 40, height: altS, opacity: pS.opacity, transform: pS.transform }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra }} />
          <div style={{ position: "absolute", left: 50, right: 50, top: 40 }}>
            <Texto t={t} linhas={fS.linhas} tamanho={fS.tamanho} peso={700} tempos={temposDoTexto(m.significado, m.significadoEm, plano.palavras, m.ate)} />
          </div>
        </div>
      ) : null}
    </Saida>
  );
};

// ——— frase: a citação num cartão, palavra por palavra ———
export const Frase: React.FC<Comum & { m: TFrase }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const f = caber(m.texto, PAINEL.w - 110, 84, 44, 4);
  const altT = f.linhas.length * f.tamanho * 1.14;
  const h = altT + 130;
  const y0 = CENTRO_Y - h / 2;
  const e = entrada(t, m.de, { de: 0.9, sobe: 30 });
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: PAINEL.w, height: h, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.cartao, boxShadow: sombra }} />
        <div style={{ position: "absolute", left: 55, right: 55, top: 70 }}>
          <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, m.ate)} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
        </div>
        <div style={{ position: "absolute", left: 24, top: -36 }}>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(47,75,255,0.28)" }}>
            <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: 92, color: cor.cartao, lineHeight: 1, marginTop: 34 }}>“</span>
          </div>
        </div>
      </div>
    </Saida>
  );
};

// ——— pergunta sem resposta certa: o painel do quiz sem anel; sem opções, a pergunta e o "?" ———
export const Pergunta: React.FC<Comum & { m: TPergunta }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  if (m.opcoes?.length) {
    return <Painel t={t} plano={plano} d={{ texto: m.texto, em, opcoes: m.opcoes }} de={m.de} ate={fim} />;
  }
  const f = caber(m.texto, PAINEL.w, 96, 50, 3);
  const altT = f.linhas.length * f.tamanho * 1.14;
  const d = 210;
  const total = d + 44 + altT;
  const y0 = CENTRO_Y - total / 2;
  const e = entrada(t, em, { de: 0.5 });
  const giro = (t - em) * 40;
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: 540 - d / 2, top: y0, width: d, height: d, opacity: e.opacity, transform: e.transform }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: d / 2, background: cor.cartao, boxShadow: sombraLeve }} />
        <svg width={d} height={d} style={{ position: "absolute", inset: 0, transform: `rotate(${giro}deg)` }}>
          <circle cx={d / 2} cy={d / 2} r={d / 2 - 16} fill="none" stroke={cor.acento} strokeWidth={12} strokeDasharray="34 22" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="interrogacao" tamanho={d * 0.5} cor={cor.acento} traco={2.6} />
        </div>
      </div>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0 + d + 44 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, m.ate)} />
      </div>
    </Saida>
  );
};

// ——— fechamento: o selo do ícone, a chamada e, depois de um quiz, a fileira das letras ———
export const Cta: React.FC<Comum & { m: TCta; quiz?: TQuiz | null }> = ({ t, plano, m, fim, quiz }) => {
  const em = m.em ?? m.de;
  const icone = m.icone ?? "comentar";
  const f = caber(m.texto, PAINEL.w, 96, 52, 3);
  const altT = f.linhas.length * f.tamanho * 1.14;
  const d = 150;
  const comLetras = !!quiz && quiz.opcoes.length >= 2;
  const altL = comLetras ? 120 : 0;
  const total = d + 40 + altT + (comLetras ? 44 + altL : 0);
  const y0 = CENTRO_Y - total / 2;
  const tempos = temposDoTexto(m.texto, em, plano.palavras, Math.min(m.ate, plano.duracao));
  const ultima = tempos[tempos.length - 1] ?? em;
  const e = entrada(t, m.de, { de: 0.5 });
  const onda = ((t - em) % 1.2) / 1.2;
  const img = (i: number) => imagemDoPlano(plano, quiz?.opcoes[i]?.imagem);
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: 540 - d / 2, top: y0, width: d, height: d, opacity: e.opacity, transform: e.transform }}>
        {t >= em ? <div style={{ position: "absolute", inset: 0, borderRadius: d / 2, border: `6px solid ${cor.acento}`, opacity: (1 - onda) * 0.6, transform: `scale(${1 + onda * 0.5})` }} /> : null}
        <div style={{ position: "absolute", inset: 0, borderRadius: d / 2, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 26px rgba(47,75,255,0.3)" }}>
          <Icone nome={icone} tamanho={d * 0.55} cor={cor.cartao} traco={2.4} />
        </div>
      </div>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0 + d + 40 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={tempos} destaque={m.destaque} />
      </div>
      {comLetras && quiz ? (
        <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: y0 + d + 40 + altT + 44, height: altL, display: "flex", justifyContent: "center", gap: 26 }}>
          {quiz.opcoes.slice(0, 4).map((o, i) => {
            const ent = entrada(t, Math.min(ultima, em + 0.3) + 0.1 + i * 0.08, { de: 0.6 });
            const certa = i === quiz.certa;
            const im = img(i);
            const vf = quiz.modo === "vf";
            return (
              <div key={i} style={{ position: "relative", width: altL, height: altL, opacity: ent.opacity * (certa ? 1 : 0.55), transform: ent.transform }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 30, background: certa ? cor.certo : cor.cartao, boxShadow: sombraLeve }} />
                {temImagem(im) && im?.arquivo ? (
                  <Img src={staticFile(im.arquivo)} style={{ position: "absolute", left: 14, top: 14, width: altL - 28, height: altL - 28, objectFit: "contain", filter: certa ? undefined : "grayscale(1)" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonte, fontWeight: 800, fontSize: 56, color: certa ? cor.cartao : cor.apagado }}>
                    {vf ? (i === 0 ? "V" : "F") : LETRAS[i]}
                  </div>
                )}
                <div style={{ position: "absolute", right: -10, top: -10 }}>
                  <Selo texto={vf ? "" : (o.letra ?? LETRAS[i])} icone={certa ? "certo" : vf ? (i === 0 ? "certo" : "errado") : undefined} tamanho={44} estado={certa ? "certo" : "apagado"} />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </Saida>
  );
};
