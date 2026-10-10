// Os 11 blocos universais na linguagem da página da Oferta: cartões de papel marfim que caem e
// pousam, tinta verde profunda, preço com o "R$" pequeno e alto, o vermelho só no risco.
// A abertura é a ETIQUETA de produto pendurada por um fio, balançando; tópicos e passos são
// cartões de entrega (a mesma pilha da assinatura, descendo na ordem da fala); o número é o cartão de preço; o `cta` é o botão
// (componentes/Botao.tsx).
import { Easing, Img, staticFile } from "remotion";
import { entrada, formatar, prog, saindo, salto, soco, suave, temposDoTexto } from "../anim";
import { larguraTexto } from "../medida";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type {
  Abertura as TAbertura,
  Comparacao as TComparacao,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Numero as TNumero,
  Oferta as TOferta,
  Passos as TPassos,
  Pergunta as TPergunta,
  Plano,
  Topicos as TTopicos,
} from "../plano";
import { cor, fonte, PAINEL, RAIO, sombra, sombraLeve } from "../tema";
import { Pilha, Valor, larguraValor, tamanhoQueCabe } from "./Oferta";
import { caber, Cartao, Etiqueta, Icone, Selo, Texto } from "./Pecas";

type Comum = { t: number; plano: Plano; fim: number };

const CENTRO_Y = (PAINEL.y + PAINEL.base) / 2;

// tudo de um bloco some junto no fim dele
const Saida: React.FC<{ t: number; fim: number; children: React.ReactNode }> = ({ t, fim, children }) => {
  const s = saindo(t, fim, 0.2);
  return <div style={{ position: "absolute", inset: 0, opacity: 1 - s, transform: s > 0 ? `scale(${1 - 0.03 * s})` : undefined }}>{children}</div>;
};

// Título no alto (comparação, gráfico): centrado, com o traço verde acima.
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

// ——— abertura: a etiqueta de produto pendurada por um fio, balançando ———
// Cai do alto presa no fio, balança (amortecido) em volta do furo e fica oscilando de leve.
// Dentro: a imagem do produto (opcional, entra em `imagemEm`) e o título que se monta na fala.
export const Abertura: React.FC<Comum & { m: TAbertura }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const inicio = em <= 0.2 ? Math.max(0, em - 0.16) : em;
  const tempos = temposDoTexto(m.texto, inicio, plano.palavras, m.ate).map((x, i) => (i === 0 ? inicio : x));
  const img = imagemDoPlano(plano, m.imagem);
  const comImg = temImagem(img);
  const W = 860;
  const fit = caber(m.texto, W - 110, comImg ? 76 : 96, 46, 3);
  const altT = fit.linhas.length * fit.tamanho * 1.14;
  const LADO = 270;
  const H = 96 + (comImg ? LADO + 34 : 0) + altT + 70;
  const y0 = Math.max(PAINEL.y + 70, CENTRO_Y - H / 2 + 30);
  const furo = { x: 540, y: y0 + 48 };
  // queda presa no fio + balanço amortecido em volta do furo
  const d = t - (inicio - 0.05);
  const desce = prog(t, inicio - 0.05, 0.42, salto);
  const giro = d < 0 ? 0 : 7 * Math.exp(-2.6 * d) * Math.cos(5.2 * d) + 0.7 * Math.sin(t * 1.3);
  const pImg = comImg ? prog(t, m.imagemEm ?? em, 0.4, salto) : 0;
  const foco = m.imagem?.foco ?? img?.foco ?? { x: 0.5, y: 0.5 };
  const yDesce = (1 - desce) * -380;
  return (
    <Saida t={t} fim={fim}>
      {/* o fio, do alto da página até o furo */}
      <svg width={1080} height={furo.y + 10} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={540} y1={0} x2={furo.x} y2={furo.y + yDesce} stroke={cor.tintaSuave} strokeWidth={3} opacity={0.7} />
      </svg>
      <div style={{ position: "absolute", left: 540 - W / 2, top: y0 + yDesce, width: W, height: H, transform: `rotate(${giro}deg)`, transformOrigin: `${W / 2}px 48px` }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible", filter: "drop-shadow(0 18px 30px rgba(15,51,40,0.16))" }}>
          <path d={`M 120 0 L ${W - 120} 0 L ${W} 100 L ${W} ${H - 26} Q ${W} ${H} ${W - 26} ${H} L 26 ${H} Q 0 ${H} 0 ${H - 26} L 0 100 Z`} fill={cor.cartao} stroke={cor.cartaoBorda} strokeWidth={2} />
          <circle cx={W / 2} cy={48} r={20} fill={cor.pagina} stroke={cor.acento} strokeWidth={6} />
          <path d={`M 140 14 L ${W - 140} 14 L ${W - 14} 104 L ${W - 14} ${H - 30} Q ${W - 14} ${H - 14} ${W - 30} ${H - 14} L 30 ${H - 14} Q 14 ${H - 14} 14 ${H - 30} L 14 104 Z`} fill="none" stroke={cor.acentoClaro} strokeWidth={3} />
        </svg>
        {comImg && pImg > 0 ? (
          <div style={{ position: "absolute", left: (W - LADO) / 2, top: 96, width: LADO, height: LADO, borderRadius: 26, overflow: "hidden", opacity: Math.min(1, pImg * 1.6), transform: pImg < 1 ? `scale(${0.7 + 0.3 * pImg})` : undefined }}>
            <Img src={staticFile(img.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${foco.x * 100}% ${foco.y * 100}%` }} />
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 55, width: W - 110, top: 96 + (comImg ? LADO + 34 : 10) }}>
          <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} tempos={tempos} destaque={m.destaque} />
        </div>
      </div>
    </Saida>
  );
};

// ——— tópicos e passos: cartões de entrega que caem e descem em ordem (passos com o número; tópicos com ✓ quando não têm imagem nem ícone) ———
export const Lista: React.FC<Comum & { m: TTopicos | TPassos }> = ({ t, plano, m, fim }) => {
  const como: TOferta = { tipo: "oferta", de: m.de, ate: m.ate, titulo: m.titulo, em: m.de, itens: m.itens };
  return (
    <Saida t={t} fim={fim}>
      <Pilha t={t} plano={plano} m={como} saida={0} golpe={0} numerado={m.tipo === "passos"} />
    </Saida>
  );
};

// ——— número: o cartão de preço, com o número que conta e o rótulo embaixo ———
export const Numero: React.FC<Comum & { m: TNumero }> = ({ t, plano, m, fim }) => {
  const v = { valor: m.valor, em: m.em, prefixo: m.prefixo, sufixo: m.sufixo, casas: m.casas };
  const LARG = PAINEL.w - 120;
  const tam = tamanhoQueCabe(v, LARG, 190, 80);
  const pC = prog(t, m.em, 0.9, Easing.out(Easing.cubic));
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;
  const fR = caber(m.rotulo, LARG, 52, 30, 2, 700);
  const altR = fR.linhas.length * fR.tamanho * 1.14;
  const H = 70 + tam * 1.05 + 30 + altR + 60;
  const y0 = CENTRO_Y - H / 2;
  const e = entrada(t, Math.max(m.de, m.em - 0.2), { de: 0.9, sobe: 36 });
  const golpe = soco(t, m.em + 0.9, 0.3);
  const w = larguraValor(v, tam);
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, top: y0, width: PAINEL.w, height: H, opacity: e.opacity, transform: e.transform, visibility: e.visivel ? "visible" : "hidden" }}>
        <Cartao raio={28} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 60, display: "flex", justifyContent: "center", transform: golpe ? `scale(${1 + 0.05 * golpe})` : undefined }}>
          <Valor v={v} x={m.valor * pC} tamanho={tam} c={cor.acento} />
        </div>
        <div style={{ position: "absolute", left: (PAINEL.w - w) / 2, top: 60 + tam * 1.02, height: 8, width: w * prog(t, m.em + 0.6, 0.4, suave), borderRadius: 4, background: cor.salvia }} />
        {t >= rotuloEm ? (
          <div style={{ position: "absolute", left: 60, right: 60, top: 70 + tam * 1.05 + 30 }}>
            <Texto t={t} linhas={fR.linhas} tamanho={fR.tamanho} peso={700} cor={cor.tintaSuave} tempos={temposDoTexto(m.rotulo, rotuloEm, plano.palavras, m.ate)} />
          </div>
        ) : null}
        {m.ilustrativo ? (
          <div style={{ position: "absolute", right: 22, top: 18 }}>
            <Etiqueta texto="ilustrativo" fundo={cor.acentoClaro} tinta={cor.acentoEscuro} tamanho={20} />
          </div>
        ) : null}
      </div>
    </Saida>
  );
};

// ——— comparação: duas etiquetas lado a lado; a que perde é riscada em vermelho ———
export const Comparacao: React.FC<Comum & { m: TComparacao }> = ({ t, plano, m, fim }) => {
  const altT = alturaTitulo(m.titulo);
  const topo = PAINEL.y + altT + (m.titulo ? 14 : 20);
  const vao = 24;
  const w = (PAINEL.w - vao) / 2;
  const h = Math.min(620, PAINEL.base - topo - 10);
  const y = topo + (PAINEL.base - topo - h) / 2;
  const vEm = m.vencedorEm ?? Math.max(m.lados[0].em, m.lados[1].em) + 0.7;
  const pV = m.vencedor !== undefined ? prog(t, vEm, 0.3) : 0;
  return (
    <Saida t={t} fim={fim}>
      <Titulo t={t} plano={plano} texto={m.titulo} em={m.de} ate={m.lados[0].em} />
      {m.lados.map((l, i) => {
        if (t < l.em - 0.05) return null;
        const e = entrada(t, l.em - 0.05, { de: 0.86, sobe: 40 });
        const vence = m.vencedor === i;
        const perde = m.vencedor !== undefined && m.vencedor !== i;
        const img = imagemDoPlano(plano, l.imagem);
        const comImg = temImagem(img);
        const LADO = Math.min(w - 60, h * 0.42);
        const fit = caber(l.texto, w - 60, comImg ? 52 : 66, 30, comImg ? 2 : 4, 800);
        const altTxt = fit.linhas.length * fit.tamanho * 1.14;
        const yTxt = comImg ? 96 + LADO + 26 : 96 + (h - 96 - altTxt) / 2 - 20;
        const icone = m.modo === "errado-certo" ? (i === 0 ? "errado" : "certo") : vence && pV > 0.5 ? "certo" : undefined;
        return (
          <div key={i} style={{ position: "absolute", left: PAINEL.x + i * (w + vao), top: y, width: w, height: h, opacity: e.opacity * (1 - 0.35 * (perde ? pV : 0)), transform: [e.transform, vence ? `scale(${1 + 0.03 * soco(t, vEm, 0.35)})` : ""].filter(Boolean).join(" ") || undefined }}>
            <Cartao raio={RAIO} style={{ border: `${vence ? 2 + 5 * pV : 2}px solid ${vence ? cor.acento : cor.cartaoBorda}` }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 30, display: "flex", justifyContent: "center" }}>
              <Etiqueta texto={l.rotulo} tamanho={24} fundo={vence && pV > 0.5 ? cor.acento : cor.acentoClaro} tinta={vence && pV > 0.5 ? cor.cartao : cor.acentoEscuro} />
            </div>
            {comImg ? (
              <div style={{ position: "absolute", left: (w - LADO) / 2, top: 96, width: LADO, height: LADO, borderRadius: 20, overflow: "hidden", filter: perde ? `grayscale(${pV})` : undefined }}>
                <Img src={staticFile(img.arquivo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : null}
            <div style={{ position: "absolute", left: 30, width: w - 60, top: yTxt }}>
              <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} peso={800} cor={perde && pV > 0.5 ? cor.tintaSuave : cor.tinta} risco={perde ? l.texto : undefined} riscoEm={perde ? vEm : undefined} />
            </div>
            {icone ? (
              <div style={{ position: "absolute", right: -12, top: -12 }}>
                <Selo texto="" tamanho={70} icone={icone} estado={icone === "errado" ? "apagado" : "normal"} />
              </div>
            ) : null}
          </div>
        );
      })}
    </Saida>
  );
};

// pergunta com opções: a pergunta no alto e as opções caindo como cartões, com a letra num selo
const PerguntaComOpcoes: React.FC<Comum & { m: TPergunta }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  const f = caber(m.texto, PAINEL.w, 72, 40, 3);
  const altP = f.linhas.length * f.tamanho * 1.14;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const topo = PAINEL.y + altP + 40;
  const vao = 16;
  const h = Math.min(150, (PAINEL.base - topo - vao * (opcoes.length - 1)) / opcoes.length);
  const LETRAS = ["A", "B", "C", "D"];
  return (
    <Saida t={t} fim={fim}>
      <div style={{ position: "absolute", left: PAINEL.x, width: PAINEL.w, top: PAINEL.y + 10 }}>
        <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, opcoes[0]?.em ?? m.ate)} />
      </div>
      {opcoes.map((o, i) => {
        if (t < o.em - 0.05) return null;
        const e = entrada(t, o.em - 0.05, { de: 0.9, sobe: 30 });
        const fit = caber(o.texto, PAINEL.w - 160, 54, 30, 2, 800);
        return (
          <div key={i} style={{ position: "absolute", left: PAINEL.x, top: topo + i * (h + vao), width: PAINEL.w, height: h, opacity: e.opacity, transform: e.transform }}>
            <Cartao raio={22} />
            <div style={{ position: "absolute", left: 22, top: (h - 76) / 2 }}>
              <Selo texto={LETRAS[i]} tamanho={76} />
            </div>
            <div style={{ position: "absolute", left: 124, width: PAINEL.w - 160, top: (h - fit.linhas.length * fit.tamanho * 1.14) / 2 }}>
              <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} alinhar="left" />
            </div>
          </div>
        );
      })}
    </Saida>
  );
};

// ——— gráfico: num cartão de papel; barras verde profundo, linha que se desenha ou rosca ———
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
    const tons = [cor.acento, cor.salvia, cor.tinta, cor.apagado, cor.acentoClaro, cor.tintaSuave];
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
              <div key={i} style={{ position: "absolute", left: p.x - passo * 0.3, width: passo * 0.6, top: base - h, height: h, borderRadius: "16px 16px 4px 4px", background: i === n - 1 ? cor.acento : cor.salvia }} />
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
        <Cartao raio={RAIO} />
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

// ——— destaque: a frase que bate, num cartão com a borda verde (alerta: vermelha) e o selo no canto ———
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
            <Selo texto="" tamanho={74} icone="estrela" />
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
          <Cartao raio={RAIO} />
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
        <Cartao raio={RAIO} />
        <div style={{ position: "absolute", left: 55, right: 55, top: 70 }}>
          <Texto t={t} linhas={f.linhas} tamanho={f.tamanho} tempos={temposDoTexto(m.texto, em, plano.palavras, m.ate)} destaque={m.destaque} risco={m.risco} riscoEm={m.riscoEm} />
        </div>
        <div style={{ position: "absolute", left: 24, top: -36 }}>
          <div style={{ width: 84, height: 84, borderRadius: 42, background: cor.acento, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(19,87,63,0.26)" }}>
            <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: 92, color: cor.cartao, lineHeight: 1, marginTop: 34 }}>“</span>
          </div>
        </div>
      </div>
    </Saida>
  );
};

// ——— pergunta: com opções, as opções caem como cartões; sem opções, o "?" girando ———
export const Pergunta: React.FC<Comum & { m: TPergunta }> = ({ t, plano, m, fim }) => {
  const em = m.em ?? m.de;
  if (m.opcoes?.length) return <PerguntaComOpcoes t={t} plano={plano} m={m} fim={fim} />;
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
