// Os blocos universais na linguagem do Multicâmera: o pacote gráfico de um canal bem editado.
// Tudo no terço de baixo, alinhado à esquerda, em painéis e tarjas grafite com a faixa vermelha,
// entrando por cortina da esquerda. A pessoa continua no quadro (a câmera segue trocando) e nada
// cobre o rosto. O painel cresce para cima a partir da legenda (ou do limite da interface, quando
// ele mostra a própria fala e a legenda some).
import { encaixar, larguraTexto } from "../medida";
import type {
  Abertura as TAbertura,
  Comparacao as TComparacao,
  Cta as TCta,
  Definicao as TDefinicao,
  Destaque as TDestaque,
  Frase as TFrase,
  Grafico as TGrafico,
  Momento,
  Numero as TNumero,
  Passos as TPassos,
  Pergunta as TPergunta,
  Plano,
  Topicos as TTopicos,
} from "../plano";
import { COR, FONTE, LARGURA_UTIL, MARGEM, formatar, medidas, prog, suave } from "../tema";
import { legendaNoMomento } from "./Legenda";
import { Painel, Quadrado, Sobretitulo, Tarja, medirTarja } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

const PE = 44; // margem interna esquerda (depois da faixa vermelha)
const PD = 36; // margem interna direita
const PT = 28; // margem de cima
const PB = 30; // margem de baixo

// onde o painel termina (embaixo) e quanto espaço ele tem para cima
const base = (plano: Plano, m: Momento) => (legendaNoMomento(m) ? medidas(plano).baseComLegenda : medidas(plano).baseSemLegenda);
const espaco = (plano: Plano, m: Momento) => base(plano, m) - medidas(plano).zonaTopo;

// ——— abertura: o título do gancho num painel largo, palavra por palavra ———
export const Abertura: React.FC<{ plano: Plano; m: TAbertura; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const w = LARGURA_UTIL;
  const maxH = espaco(plano, m) - PT - PB;
  let d = disporTexto(m.texto, { largura: w - PE - PD, max: 70, min: 46, linhas: 3, peso: 800, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  if (d.altura > maxH) d = disporTexto(m.texto, { largura: w - PE - PD, max: 46, min: 32, linhas: 5, peso: 800, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const h = Math.round(d.altura + PT + PB + 6);
  // o painel cresce junto com o texto: a altura acompanha as linhas que já começaram a ser ditas
  // e a largura, a palavra mais à direita já dita (o topo fica parado, só a base desce)
  const vis = d.palavras.map((p) => prog(t, p.em - 0.03, 0.22));
  const nLinhas = d.palavras.reduce((a, p) => Math.max(a, p.linha + 1), 0);
  let linhasVisiveis = 0;
  for (let l = 0; l < nLinhas; l++) linhasVisiveis += Math.max(0, ...d.palavras.map((p, i) => (p.linha === l ? vis[i] : 0)));
  const hAgora = Math.round(Math.min(h, PT + PB + 6 + d.lh * linhasVisiveis));
  const larguraTexto = Math.max(0, ...d.palavras.map((p, i) => (p.x + p.largura) * vis[i]));
  const wAgora = Math.round(Math.min(w, Math.max(360, PE + PD + larguraTexto + 24)));
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={wAgora} h={hAgora} t={t} de={m.de} ate={m.ate}>
      <TextoFalado d={d} x={PE} y={PT} t={t} sobre="painel" peso={800} />
    </Painel>
  );
};

// ——— frase: painel com a fala palavra por palavra ———
export const Frase: React.FC<{ plano: Plano; m: TFrase; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const w = LARGURA_UTIL;
  const maxH = espaco(plano, m) - PT - PB;
  const o = { largura: w - PE - PD, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, risco: m.risco };
  let d = disporTexto(m.texto, { ...o, max: 58, min: 38, linhas: 4 });
  if (d.altura > maxH) d = disporTexto(m.texto, { ...o, max: 38, min: 28, linhas: 7 });
  const h = Math.round(d.altura + PT + PB + 6);
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <TextoFalado d={d} x={PE} y={PT} t={t} sobre="painel" riscoEm={m.riscoEm} />
    </Painel>
  );
};

// ——— cta: quadrado vermelho com o ícone + a chamada palavra por palavra ———
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
  const q = 92;
  const d = disporTexto(m.texto, { largura: LARGURA_UTIL - PE - q - 28 - PD, max: 54, min: 36, linhas: 2, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const w = Math.min(LARGURA_UTIL, Math.round(PE + q + 28 + d.largura + PD + 12));
  const h = Math.round(Math.max(q + PT * 1.4, d.altura + PT + PB));
  // o quadrado do ícone "respira" devagar enquanto a chamada está no ar
  const pulso = 1 + 0.035 * Math.sin(Math.max(0, t - m.de) * 4);
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: PE - 14, top: (h - q) / 2, transform: `scale(${pulso})` }}>
        <Quadrado tamanho={q}>
          <Icone nome={m.icone} tamanho={50} />
        </Quadrado>
      </div>
      <TextoFalado d={d} x={PE - 14 + q + 28} y={(h - d.altura) / 2} t={t} sobre="painel" />
    </Painel>
  );
};

// ——— pergunta: o "?" vermelho, a pergunta palavra por palavra e as opções com letra ———
export const Pergunta: React.FC<{ plano: Plano; m: TPergunta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const w = LARGURA_UTIL;
  const q = 64;
  const ops = m.opcoes ?? [];
  const d = disporTexto(m.texto, { largura: w - PE - q - 24 - PD, max: 54, min: 34, linhas: 3, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate });
  const topoTexto = Math.max(d.altura, q);
  const sobra = espaco(plano, m) - PT - PB - topoTexto - 22;
  const linha = ops.length ? Math.max(56, Math.min(80, (sobra - (ops.length - 1) * 10) / ops.length)) : 0;
  const tam = ops.length
    ? Math.min(...ops.map((o) => encaixar(o.texto, { largura: w - PE - PD - linha - 20, max: Math.round(linha * 0.5), min: 24, linhas: 1, fonte: { peso: 600 } }).tamanho))
    : 0;
  const h = Math.round(PT + topoTexto + PB + (ops.length ? 22 + ops.length * linha + (ops.length - 1) * 10 : 0));
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: PE - 14, top: PT }}>
        <Quadrado tamanho={q}>?</Quadrado>
      </div>
      <TextoFalado d={d} x={PE - 14 + q + 24} y={PT + (topoTexto - d.altura) / 2} t={t} sobre="painel" />
      {ops.map((o, i) => {
        const e = prog(t, o.em - 0.03, 0.3);
        if (e <= 0) return null;
        const y = PT + topoTexto + 22 + i * (linha + 10);
        return (
          <div key={i} style={{ position: "absolute", left: PE - 14, top: y, height: linha, display: "flex", alignItems: "center", clipPath: `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0)` }}>
            <Quadrado tamanho={linha - 12} apagado>
              {String.fromCharCode(65 + i)}
            </Quadrado>
            <div style={{ marginLeft: 20, fontFamily: FONTE, fontWeight: 600, fontSize: tam, color: COR.branco, whiteSpace: "nowrap" }}>{o.texto}</div>
          </div>
        );
      })}
    </Painel>
  );
};

// ——— numero: o número grande contando, um fio vermelho e o rótulo ao lado ———
export const Numero: React.FC<{ plano: Plano; m: TNumero; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const casas = m.casas ?? 0;
  const final = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const alturaUtil = espaco(plano, m) - PT - PB - (m.titulo ? 42 : 0);
  const num = encaixar(final, { largura: 520, max: Math.min(124, alturaUtil * 0.95), min: 56, linhas: 1, fonte: { peso: 800 } });
  const numW = Math.ceil(larguraTexto(final, num.tamanho, { peso: 800 }));
  const livre = LARGURA_UTIL - PE - numW - 60 - PD;
  const rot = encaixar(m.rotulo, { largura: Math.max(220, livre), max: 40, min: 26, linhas: 2, fonte: { peso: 600 } });
  const rotW = Math.ceil(Math.max(...rot.linhas.map((l) => larguraTexto(l, rot.tamanho, { peso: 600 }))));
  const tagH = m.ilustrativo ? 34 : 0;
  const hNum = Math.round(num.tamanho * 1.05);
  const hRot = Math.round(rot.linhas.length * rot.tamanho * 1.22 + tagH);
  const corpo = Math.max(hNum, hRot);
  const w = Math.min(LARGURA_UTIL, PE + numW + 60 + rotW + PD);
  const h = Math.round(PT + (m.titulo ? 42 : 0) + corpo + PB);
  const yCorpo = PT + (m.titulo ? 42 : 0);
  const p = prog(t, m.em, 0.9);
  const valor = m.valor * p;
  const atual = `${m.prefixo ?? ""}${formatar(casas === 0 ? Math.round(valor) : valor, casas)}${m.sufixo ?? ""}`;
  const er = prog(t, m.rotuloEm ?? m.em + 0.35, 0.35);
  const xRot = PE + numW + 60;
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Sobretitulo texto={m.titulo} x={PE} y={PT - 2} largura={w - PE - PD} /> : null}
      <div style={{ position: "absolute", left: PE, top: yCorpo + (corpo - hNum) / 2, height: hNum, lineHeight: `${hNum}px`, fontFamily: FONTE, fontWeight: 800, fontSize: num.tamanho, color: COR.branco, letterSpacing: "-0.02em", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {atual}
      </div>
      {/* o fio vermelho entre o número e o rótulo cresce enquanto o número conta */}
      <div style={{ position: "absolute", left: PE + numW + 28, top: yCorpo + corpo / 2 - (corpo * 0.8 * p) / 2, width: 5, height: corpo * 0.8 * p, borderRadius: 3, background: COR.tally }} />
      <div style={{ position: "absolute", left: xRot, top: yCorpo + (corpo - hRot) / 2, clipPath: `inset(0 ${((1 - er) * 100).toFixed(1)}% 0 0)` }}>
        {rot.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: FONTE, fontWeight: 600, fontSize: rot.tamanho, lineHeight: 1.22, color: COR.branco, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
        {m.ilustrativo ? <div style={{ marginTop: 6, fontFamily: FONTE, fontWeight: 700, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: COR.apoio }}>ilustrativo</div> : null}
      </div>
    </Painel>
  );
};

// ——— destaque: a palavra-chave numa tarja (vermelha no alerta), o detalhe numa tarja menor ———
export const Destaque: React.FC<{ plano: Plano; m: TDestaque; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const alerta = m.nivel === "alerta";
  let tam = 48;
  while (tam > 30 && medirTarja(m.texto, tam, true).total > LARGURA_UTIL) tam -= 2;
  const { h } = medirTarja(m.texto, tam, true);
  let tamD = 30;
  while (m.detalhe && tamD > 22 && medirTarja(m.detalhe, tamD, false).total > LARGURA_UTIL - h - 6) tamD -= 2;
  const hD = m.detalhe ? medirTarja(m.detalhe, tamD, false).h + 8 : 0;
  const y = base(plano, m) - h - hD;
  return (
    <>
      <Tarja x={MARGEM} y={y} t={t} de={Math.max(m.de, m.em - 0.1)} ate={m.ate} texto={m.texto} tamanho={tam} quadrado={alerta ? "!" : ""} alerta={alerta} tempo />
      {m.detalhe ? <Tarja x={MARGEM + h + 6} y={y + h + 8} t={t} de={m.detalheEm ?? m.em + 0.5} ate={m.ate - 0.04} texto={m.detalhe} tamanho={tamD} quadrado={false} /> : null}
    </>
  );
};

// ——— definicao: o termo, um fio vermelho e o significado linha a linha ———
export const Definicao: React.FC<{ plano: Plano; m: TDefinicao; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const larg = LARGURA_UTIL - PE - PD;
  const termo = encaixar(m.termo, { largura: larg, max: 56, min: 34, linhas: 1, fonte: { peso: 800 } });
  const sig = encaixar(m.significado, { largura: larg, max: 38, min: 26, linhas: 3, fonte: { peso: 500 } });
  const hTermo = Math.round(termo.tamanho * 1.15);
  const hSig = Math.round(sig.linhas.length * sig.tamanho * 1.3);
  const h = Math.round(PT + hTermo + 26 + hSig + PB);
  const e1 = prog(t, m.em - 0.03, 0.3);
  const fio = prog(t, m.em + 0.15, 0.5);
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={LARGURA_UTIL} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: PE, top: PT, height: hTermo, lineHeight: `${hTermo}px`, fontFamily: FONTE, fontWeight: 800, fontSize: termo.tamanho, color: COR.branco, whiteSpace: "nowrap", opacity: e1 }}>
        {m.termo}
      </div>
      <div style={{ position: "absolute", left: PE, top: PT + hTermo + 10, width: 90 * fio, height: 5, borderRadius: 3, background: COR.tally }} />
      {sig.linhas.map((l, i) => {
        const e = prog(t, m.significadoEm - 0.03 + i * 0.25, 0.35);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PE,
              top: PT + hTermo + 26 + i * sig.tamanho * 1.3,
              fontFamily: FONTE,
              fontWeight: 500,
              fontSize: sig.tamanho,
              lineHeight: 1.3,
              color: COR.branco,
              whiteSpace: "nowrap",
              clipPath: `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0)`,
            }}
          >
            {l}
          </div>
        );
      })}
    </Painel>
  );
};

// ——— comparacao: duas colunas no mesmo painel; o vencedor fica aceso, o outro apaga ———
export const Comparacao: React.FC<{ plano: Plano; m: TComparacao; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const w = LARGURA_UTIL;
  const meio = 64;
  const col = (w - PE - PD - meio) / 2;
  const fit = m.lados.map((l) => encaixar(l.texto, { largura: col, max: 80, min: 38, linhas: 2, fonte: { peso: 700 } }));
  const tam = Math.min(...fit.map((f) => f.tamanho));
  const linhas = m.lados.map((l) => encaixar(l.texto, { largura: col, max: tam, min: tam, linhas: 3, fonte: { peso: 700 } }).linhas);
  const nLinhas = Math.max(...linhas.map((l) => l.length));
  const hTit = m.titulo ? 42 : 0;
  const hTexto = Math.round(nLinhas * tam * 1.2);
  const h = Math.round(PT + hTit + 60 + hTexto + PB);
  const venceu = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? m.lados[m.vencedor].em + 0.6, 0.35) : 0;
  const simbolo = m.modo === "contra" || !m.modo ? "×" : "→";
  const yCol = PT + hTit;
  const em = prog(t, m.lados[1].em - 0.03, 0.3);
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Sobretitulo texto={m.titulo} x={PE} y={PT - 2} largura={w - PE - PD} /> : null}
      {m.lados.map((l, i) => {
        const e = prog(t, l.em - 0.03, 0.32);
        if (e <= 0) return null;
        const perdeu = m.vencedor !== undefined && m.vencedor !== i;
        const ganhou = m.vencedor === i;
        const x = PE + i * (col + meio);
        const riscar = perdeu && m.modo === "errado-certo" ? venceu : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: yCol, width: col, height: 60 + hTexto, clipPath: `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0)`, opacity: perdeu ? 1 - 0.55 * venceu : 1 }}>
            <div style={{ display: "flex", alignItems: "center", height: 46 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: ganhou && venceu > 0.5 ? COR.tally : COR.apoio, marginRight: 12, flex: "none" }} />
              <Sobretitulo texto={l.rotulo} x={24} y={0} largura={col - 30} tamanho={36} cor={ganhou && venceu > 0.5 ? COR.branco : COR.apoio} />
            </div>
            {linhas[i].map((ln, k) => (
              <div key={k} style={{ position: "absolute", left: 0, top: 60 + k * tam * 1.2, fontFamily: FONTE, fontWeight: 700, fontSize: tam, lineHeight: 1.2, color: COR.branco, whiteSpace: "nowrap" }}>
                {ln}
                {riscar > 0 ? (
                  <div style={{ position: "absolute", left: -4, top: tam * 0.62, width: `calc(${(riscar * 100).toFixed(1)}% + 8px)`, height: 5, borderRadius: 3, background: COR.tally }} />
                ) : null}
              </div>
            ))}
          </div>
        );
      })}
      {/* o símbolo entre as colunas entra com o segundo lado */}
      <div
        style={{
          position: "absolute",
          left: PE + col + (meio - 40) / 2,
          top: yCol + 60 + hTexto / 2 - 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          background: COR.trilho,
          color: COR.branco,
          fontFamily: FONTE,
          fontWeight: 800,
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: em,
          transform: `scale(${0.7 + 0.3 * em})`,
        }}
      >
        {simbolo}
      </div>
    </Painel>
  );
};

// ——— topicos e passos: as linhas entram na fala; a da vez em branco, as anteriores em cinza ———
export const Lista: React.FC<{ plano: Plano; m: TTopicos | TPassos; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const numerado = m.tipo === "passos";
  const w = LARGURA_UTIL;
  const n = m.itens.length;
  const hTit = m.titulo ? 44 : 0;
  const util = espaco(plano, m) - PT - PB - hTit;
  const linha = Math.max(52, Math.min(84, (util - (n - 1) * 10) / n));
  const marca = numerado ? Math.round(linha * 0.7) : 16;
  const larg = w - PE - PD - marca - 22;
  const tam = Math.min(...m.itens.map((it) => encaixar(it.texto, { largura: larg, max: Math.round(Math.min(44, linha * 0.56)), min: 24, linhas: 1, fonte: { peso: 700 } }).tamanho));
  const h = Math.round(PT + hTit + n * linha + (n - 1) * 10 + PB);
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.03) atual = i;
  });
  const yItem = (i: number) => PT + hTit + i * (linha + 10);
  // fio que liga os números e desce até o passo da vez
  const fio = numerado && atual > 0 ? yItem(atual - 1) + linha / 2 + (linha + 10) * prog(t, m.itens[atual].em - 0.03, 0.35) : 0;
  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Sobretitulo texto={m.titulo} x={PE} y={PT - 2} largura={w - PE - PD} /> : null}
      {numerado && atual > 0 ? (
        <div style={{ position: "absolute", left: PE + marca / 2 - 2, top: yItem(0) + linha / 2, width: 4, height: Math.max(0, fio - (yItem(0) + linha / 2)), background: COR.trilho }} />
      ) : null}
      {m.itens.map((it, i) => {
        const e = prog(t, it.em - 0.03, 0.3);
        if (e <= 0) return null;
        const daVez = i === atual;
        const detalhe = it.detalhe && larguraTexto(`${it.texto}  ${it.detalhe}`, tam, { peso: 700 }) <= larg ? it.detalhe : null;
        return (
          <div key={i} style={{ position: "absolute", left: PE, top: yItem(i), height: linha, display: "flex", alignItems: "center", clipPath: `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0)` }}>
            {numerado ? (
              <Quadrado tamanho={marca} apagado={!daVez}>
                {i + 1}
              </Quadrado>
            ) : (
              <div style={{ width: marca, height: marca, borderRadius: 3, flex: "none", background: daVez ? COR.tally : COR.trilho }} />
            )}
            <div style={{ marginLeft: 22, fontFamily: FONTE, fontWeight: 700, fontSize: tam, color: daVez ? COR.branco : COR.apoio, whiteSpace: "nowrap" }}>
              {it.texto}
              {detalhe ? <span style={{ fontWeight: 500, color: COR.apoio }}>{`  ${detalhe}`}</span> : null}
            </div>
          </div>
        );
      })}
    </Painel>
  );
};

// ——— grafico: barras que crescem, linha que se desenha ou rosca; sem números, a tendência ———
const caminhoDaTendencia = (tipo: TGrafico["tendencia"], w: number, h: number) => {
  const n = 40;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    let y: number;
    if (tipo === "sobe") y = 0.85 - 0.7 * Math.pow(x, 1.6) + 0.05 * Math.sin(x * 14);
    else if (tipo === "cai") y = 0.15 + 0.7 * Math.pow(x, 1.4) + 0.05 * Math.sin(x * 13);
    else y = 0.5 + 0.3 * Math.sin(x * Math.PI * 3.2) * (0.6 + 0.4 * x);
    pts.push([x * w, Math.min(0.95, Math.max(0.05, y)) * h]);
  }
  return pts;
};

const comprimento = (pts: [number, number][]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

export const Grafico: React.FC<{ plano: Plano; m: TGrafico; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const w = LARGURA_UTIL;
  const h = Math.round(Math.min(400, espaco(plano, m)));
  const hTit = m.titulo ? 44 : 0;
  const x0 = PE;
  const x1 = w - PD;
  const y0 = PT + hTit + 44;
  const y1 = h - PB - 40;
  const dados = m.dados ?? [];
  const un = m.unidade ? ` ${m.unidade}` : "";
  const ilustr = m.ilustrativo || !dados.length;

  let conteudo: React.ReactNode = null;
  if (!dados.length) {
    const pts = caminhoDaTendencia(m.tendencia, x1 - x0, y1 - y0 + 30);
    const total = comprimento(pts);
    const p = prog(t, m.tendenciaEm ?? m.de + 0.2, 1.3, suave);
    const d = pts.map((q, i) => `${i ? "L" : "M"}${(x0 + q[0]).toFixed(1)},${(y0 - 20 + q[1]).toFixed(1)}`).join(" ");
    // ponta que anda na curva
    let resto = total * p;
    let ponta = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (resto <= seg) {
        const f = seg ? resto / seg : 0;
        ponta = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f];
        break;
      }
      resto -= seg;
      ponta = pts[i];
    }
    conteudo = (
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={x0} x2={x1} y1={y1 + 18} y2={y1 + 18} stroke={COR.trilho} strokeWidth={3} />
        <path d={d} fill="none" stroke={COR.branco} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={total} strokeDashoffset={total * (1 - p)} />
        {p > 0 ? <circle cx={x0 + ponta[0]} cy={y0 - 20 + ponta[1]} r={11} fill={COR.tally} /> : null}
      </svg>
    );
  } else if (m.forma === "pizza") {
    const r = Math.min((y1 - y0 + 40) / 2, 130);
    const cx = x0 + r + 10;
    const cy = (y0 + y1) / 2 + 10;
    const soma = dados.reduce((a, b) => a + b.valor, 0) || 1;
    const tons = [COR.branco, "#C9CDD3", "#8F959F", "#626872", "#454A53", "#353941"];
    let atual = -1;
    dados.forEach((dd, i) => {
      if (t >= dd.em - 0.03) atual = i;
    });
    let ang = -Math.PI / 2;
    const tamL = Math.min(...dados.map((dd) => encaixar(`${dd.rotulo} ${formatar(dd.valor)}${un}`, { largura: x1 - (cx + r + 50) - 30, max: 34, min: 20, linhas: 1, fonte: { peso: 600 } }).tamanho));
    conteudo = (
      <>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={r - 22} fill="none" stroke={COR.trilho} strokeWidth={44} />
          {dados.map((dd, i) => {
            const frac = dd.valor / soma;
            const p = prog(t, dd.em - 0.03, 0.6);
            const a0 = ang;
            ang += frac * Math.PI * 2;
            const circ = 2 * Math.PI * (r - 22);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r - 22}
                fill="none"
                stroke={i === atual ? COR.tally : tons[i % tons.length]}
                strokeWidth={44}
                strokeDasharray={`${circ * frac * p} ${circ}`}
                transform={`rotate(${(a0 * 180) / Math.PI} ${cx} ${cy})`}
              />
            );
          })}
        </svg>
        {dados.map((dd, i) => {
          const e = prog(t, dd.em - 0.03, 0.3);
          const yy = y0 - 20 + i * ((y1 - y0 + 40) / dados.length);
          return (
            <div key={i} style={{ position: "absolute", left: cx + r + 50, top: yy, display: "flex", alignItems: "center", opacity: e, fontFamily: FONTE, fontWeight: 600, fontSize: tamL, color: COR.branco, whiteSpace: "nowrap" }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, marginRight: 12, background: i === atual ? COR.tally : tons[i % tons.length] }} />
              {dd.rotulo}
              <span style={{ marginLeft: 12, fontWeight: 800 }}>{`${formatar(dd.valor)}${un}`}</span>
            </div>
          );
        })}
      </>
    );
  } else {
    const max = Math.max(...dados.map((dd) => dd.valor), 1);
    const n = dados.length;
    const slot = (x1 - x0) / n;
    let atual = -1;
    dados.forEach((dd, i) => {
      if (t >= dd.em - 0.03) atual = i;
    });
    const tamR = Math.min(...dados.map((dd) => encaixar(dd.rotulo, { largura: slot - 12, max: 26, min: 18, linhas: 1, fonte: { peso: 600 } }).tamanho));
    const yDe = (v: number) => y1 - (v / max) * (y1 - y0);
    const pontos = dados.map((dd, i) => [x0 + slot * (i + 0.5), yDe(dd.valor)] as [number, number]);
    conteudo = (
      <>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={COR.trilho} strokeWidth={3} />
          {m.forma === "barras"
            ? dados.map((dd, i) => {
                const p = prog(t, dd.em - 0.03, 0.55);
                const bw = Math.min(110, slot * 0.56);
                const top = y1 - (y1 - yDe(dd.valor)) * p;
                return <rect key={i} x={x0 + slot * (i + 0.5) - bw / 2} y={top} width={bw} height={Math.max(0, y1 - top)} rx={6} fill={i === atual ? COR.tally : COR.branco} />;
              })
            : pontos.map((q, i) => {
                if (i === 0) return null;
                const p = prog(t, dados[i].em - 0.03, 0.5);
                const a = pontos[i - 1];
                return <line key={i} x1={a[0]} y1={a[1]} x2={a[0] + (q[0] - a[0]) * p} y2={a[1] + (q[1] - a[1]) * p} stroke={COR.branco} strokeWidth={6} strokeLinecap="round" />;
              })}
          {m.forma === "linha"
            ? pontos.map((q, i) => (t >= dados[i].em - 0.03 ? <circle key={`c${i}`} cx={q[0]} cy={q[1]} r={11} fill={i === atual ? COR.tally : COR.branco} /> : null))
            : null}
        </svg>
        {dados.map((dd, i) => {
          const e = prog(t, dd.em + 0.2, 0.3);
          const cx = x0 + slot * (i + 0.5);
          const topo = yDe(dd.valor);
          return (
            <div key={i} style={{ opacity: e }}>
              <div style={{ position: "absolute", left: cx - slot / 2, width: slot, top: topo - 46, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: 30, color: COR.branco }}>{`${formatar(dd.valor)}${un}`}</div>
              <div style={{ position: "absolute", left: cx - slot / 2, width: slot, top: y1 + 10, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: tamR, color: COR.apoio, whiteSpace: "nowrap" }}>{dd.rotulo}</div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <Painel x={MARGEM} y={base(plano, m) - h} w={w} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Sobretitulo texto={m.titulo} x={PE} y={PT - 2} largura={w - PE - PD - (ilustr ? 170 : 0)} /> : null}
      {ilustr ? <Sobretitulo texto="ilustrativo" x={w - PD - 150} y={PT} largura={150} tamanho={22} /> : null}
      {conteudo}
    </Painel>
  );
};
