// O que entra no lado livre sem empurrar a pessoa (a câmera segue na tomada dela) e o B-roll:
// - `abertura`: o título do gancho num painel de vidro, palavra por palavra, com o marcador cobalto;
// - a tarja de nome (`plano.marca`), embaixo no lado livre;
// - `destaque`: a palavra-chave num chip de vidro na altura do rosto, com o traço cobalto;
// - `capitulo`: o cartão de capítulo com a barra de capítulos;
// - `inscricao` (e `cta` com "seguir"): o botão "Inscrever-se" que o cursor clica (sem sino);
// - `cta`: o fechamento num cartão com ícone;
// - `cena`: o B-roll em tela cheia com movimento lento e a etiqueta com as barras de som.
// Tudo ancorado na margem de fora do lado livre (longe da pessoa).
import { Foto, SemImagem, imagemDoPlano, temImagem } from "../motor/imagem";
import { encaixar, larguraTexto } from "../medida";
import type { Abertura as TAbertura, Capitulo as TCapitulo, Cena as TCena, Chamada as TChamada, Cta as TCta, Destaque as TDestaque, Inscricao as TInscricao, Plano } from "../plano";
import { BASE, COR, FONTE, H, LATERAL, MARGEM_X, MARGEM_Y, MONO, VIDRO, W, ladoLivre, prog, rostoNoQuadro, suave, xLateral, type Lado } from "../tema";
import { BarrasDeSom, Icone, Rotulo, Selo, Vidro, entradaPainel } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

// x de uma peça de largura `w` no lado livre, encostada na margem de fora
const xFora = (lado: Lado, w: number) => (lado === "dir" ? W - MARGEM_X - w : MARGEM_X);

// ——— abertura: o título do gancho ———
export const Abertura: React.FC<{ plano: Plano; m: TAbertura; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const lado = ladoLivre(plano, m.lado);
  const P = 44;
  const d = disporTexto(m.texto, { largura: LATERAL.w - P * 2, max: 92, min: 52, linhas: 4, peso: 800, espacamento: -0.02, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const h = Math.round(d.altura + P * 2 + 6);
  // o painel cresce junto com as linhas ditas (o topo fica parado)
  const vis = d.palavras.map((p) => prog(t, p.em - 0.03, 0.22));
  const nLinhas = d.palavras.reduce((a, p) => Math.max(a, p.linha + 1), 0);
  let linhasVis = 0;
  for (let l = 0; l < nLinhas; l++) linhasVis += Math.max(0, ...d.palavras.map((p, i) => (p.linha === l ? vis[i] : 0)));
  const hAgora = Math.round(Math.min(h, P * 2 + 6 + d.lh * Math.max(1, linhasVis)));
  // com a tarja de nome no mesmo momento, o título sobe para deixar a tarja embaixo (fica assim o
  // momento inteiro: o painel não pula quando a tarja sai)
  const janela = janelaDaMarca(plano);
  const comMarca = !!janela && janela.de < m.ate && janela.ate > m.de;
  const y = comMarca ? Math.max(LATERAL.topo, Math.min(300, BASE - 150 - h - 40)) : Math.round(540 - h / 2);
  return (
    <Vidro x={xLateral(lado)} y={y} w={LATERAL.w} h={hAgora} t={t} de={m.de} ate={m.ate} lado={lado}>
      <TextoFalado d={d} x={P} y={P + 4} t={t} sobre="painel" peso={800} />
    </Vidro>
  );
};

// ——— tarja de nome ———
const janelaDaMarca = (plano: Plano) => {
  const { nome } = plano.marca ?? { nome: "" };
  if (!nome) return null;
  const de = plano.marca.de ?? 0.3;
  const ate = Math.min(plano.marca.ate ?? de + 3.4, plano.duracao);
  return { de, ate };
};
const marcaNoTempo = (plano: Plano, t: number) => {
  const j = janelaDaMarca(plano);
  return j && t >= j.de && t < j.ate ? j : null;
};

export const Marca: React.FC<{ plano: Plano; t: number }> = ({ plano, t }) => {
  const janela = marcaNoTempo(plano, t);
  if (!janela) return null;
  const { nome, area } = plano.marca;
  const lado = ladoLivre(plano);
  const tamN = encaixar(nome, { largura: LATERAL.w - 120, max: 52, min: 32, linhas: 1, fonte: { peso: 800, espacamento: -0.01 } }).tamanho;
  const tamA = area ? encaixar(area, { largura: LATERAL.w - 120, max: 27, min: 18, linhas: 1, fonte: { mono: true, caixaAlta: true, espacamento: 0.06 } }).tamanho : 0;
  const wN = larguraTexto(nome, tamN, { peso: 800 });
  const wA = area ? larguraTexto(area, tamA, { mono: true, caixaAlta: true, espacamento: 0.06 }) : 0;
  const w = Math.round(Math.min(LATERAL.w, Math.max(wN, wA) + 36 + 18 + 44));
  const h = Math.round(area ? 24 + tamN * 1.2 + 10 + tamA * 1.2 + 26 : tamN * 1.2 + 48);
  const x = xFora(lado, w);
  const y = BASE - h;
  const barra = prog(t, janela.de, 0.35);
  return (
    <Vidro x={x} y={y} w={w} h={h} t={t} de={janela.de} ate={janela.ate} lado={lado} tempo={false}>
      <div style={{ position: "absolute", left: 22, top: 22, width: 8, height: (h - 44) * barra, borderRadius: 4, background: COR.cobalto }} />
      <div style={{ position: "absolute", left: 54, top: area ? 24 : (h - tamN * 1.2) / 2, fontFamily: FONTE, fontWeight: 800, fontSize: tamN, lineHeight: 1.2, letterSpacing: "-0.01em", color: COR.giz, whiteSpace: "nowrap" }}>{nome}</div>
      {area ? <Rotulo texto={area} x={54} y={24 + tamN * 1.2 + 10} largura={w - 70} tamanho={tamA} cor={COR.cobaltoClaro} /> : null}
    </Vidro>
  );
};

// ——— destaque: a palavra-chave na altura do rosto ———
export const Destaque: React.FC<{ plano: Plano; m: TDestaque; t: number; zoom: number }> = ({ plano, m, t, zoom }) => {
  if (t < m.de || t >= m.ate) return null;
  const lado = ladoLivre(plano, m.lado);
  const alerta = m.nivel === "alerta";
  const P = 34;
  const fit = encaixar(m.texto, { largura: LATERAL.w - P * 2, max: 88, min: 48, linhas: 2, fonte: { peso: 800, espacamento: -0.02 } });
  const wTexto = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800, espacamento: -0.02 })));
  const det = m.detalhe ? encaixar(m.detalhe, { largura: LATERAL.w - P * 2, max: 42, min: 26, linhas: 1, fonte: { peso: 600 } }) : null;
  const wDet = det ? larguraTexto(m.detalhe ?? "", det.tamanho, { peso: 600 }) : 0;
  const w = Math.round(Math.min(LATERAL.w, Math.max(wTexto, wDet) + P * 2 + 8));
  const lh = Math.round(fit.tamanho * 1.08);
  const hTexto = lh * fit.linhas.length;
  const h = Math.round(P + hTexto + 22 + (det ? det.tamanho * 1.3 + 12 : 0) + P - 6);
  // na altura do rosto (a palavra fica ao lado da cabeça, no lado livre)
  const rosto = rostoNoQuadro(plano, zoom);
  const y = Math.round(Math.max(MARGEM_Y + 60, Math.min(BASE - h - 120, rosto.y - h * 0.42)));
  const x = xFora(lado, w);
  const em = Math.max(m.de, m.em - 0.08);
  const e = prog(t, em, 0.34);
  const traco = prog(t, em + 0.12, 0.45);
  const eDet = m.detalhe ? prog(t, m.detalheEm ?? m.em + 0.5, 0.3) : 0;
  const cor = alerta ? COR.coral : COR.cobalto;
  return (
    <Vidro x={x} y={y} w={w} h={h} t={t} de={em} ate={m.ate} lado={lado} alerta={alerta}>
      <div style={{ position: "absolute", left: P, top: P - 6, clipPath: e >= 1 ? undefined : `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0)` }}>
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: `${lh}px`, letterSpacing: "-0.02em", color: COR.giz, whiteSpace: "nowrap", textTransform: "none" }}>
            {l}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: P, top: P - 6 + hTexto + 8, width: wTexto * traco, height: 7, borderRadius: 4, background: cor }} />
      {det ? (
        <div style={{ position: "absolute", left: P, top: P - 6 + hTexto + 30, fontFamily: FONTE, fontWeight: 600, fontSize: det.tamanho, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap", opacity: eDet, transform: eDet >= 1 ? undefined : `translateY(${(1 - eDet) * 10}px)` }}>
          {m.detalhe}
        </div>
      ) : null}
    </Vidro>
  );
};

// ——— capítulo: título + barra de capítulos ———
export const Capitulo: React.FC<{ plano: Plano; m: TCapitulo; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const lado = ladoLivre(plano, m.lado);
  const caps = plano.momentos.filter((x): x is TCapitulo => x.tipo === "capitulo").sort((a, b) => a.de - b.de);
  const k = caps.indexOf(m);
  const P = 36;
  const fit = encaixar(m.texto, { largura: LATERAL.w - P * 2, max: 60, min: 36, linhas: 2, fonte: { peso: 800, espacamento: -0.02 } });
  const wT = Math.max(...fit.linhas.map((l) => larguraTexto(l, fit.tamanho, { peso: 800, espacamento: -0.02 })));
  const w = Math.round(Math.min(LATERAL.w, Math.max(460, wT + P * 2 + 10)));
  const lh = Math.round(fit.tamanho * 1.1);
  const h = Math.round(P + 30 + 12 + lh * fit.linhas.length + 26 + 10 + P - 4);
  const x = xFora(lado, w);
  const y = BASE - h;
  const de = m.em ?? m.de;
  const eT = prog(t, de + 0.1, 0.35);
  const rotulo = m.numero !== undefined ? `Capítulo ${m.numero}` : "Capítulo";
  // a barra de capítulos: um trecho por capítulo do plano; o da vez enche durante o momento
  const n = Math.max(1, caps.length);
  const gap = 8;
  const wSeg = (w - P * 2 - (n - 1) * gap) / n;
  const enche = Math.min(1, Math.max(0, (t - de) / Math.max(0.5, m.ate - de)));
  return (
    <Vidro x={x} y={y} w={w} h={h} t={t} de={m.de} ate={m.ate} lado={lado} tempo={false}>
      <Rotulo texto={rotulo} x={P} y={P - 4} largura={w - P * 2} cor={COR.cobaltoClaro} />
      <div style={{ position: "absolute", left: P, top: P + 30 + 8, opacity: eT, transform: eT >= 1 ? undefined : `translateY(${(1 - eT) * 12}px)` }}>
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: `${lh}px`, letterSpacing: "-0.02em", color: COR.giz, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
      {Array.from({ length: n }, (_, i) => {
        const cheio = i < k ? 1 : i === k ? enche : 0;
        return (
          <div key={i} style={{ position: "absolute", left: P + i * (wSeg + gap), top: h - P - 6, width: wSeg, height: 8, borderRadius: 4, background: COR.trilho, overflow: "hidden" }}>
            <div style={{ width: `${(cheio * 100).toFixed(2)}%`, height: 8, background: i === k ? COR.cobalto : COR.apoio }} />
          </div>
        );
      })}
    </Vidro>
  );
};

// ——— chamada: chip discreto que anuncia o que vem (▶ + texto), embaixo no lado livre ———
export const Chamada: React.FC<{ plano: Plano; m: TChamada; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const lado = ladoLivre(plano, m.lado);
  const q = 56;
  const tam = encaixar(m.texto, { largura: LATERAL.w - q - 70, max: 36, min: 24, linhas: 1, fonte: { peso: 700 } }).tamanho;
  const wT = larguraTexto(m.texto, tam, { peso: 700 });
  const h = q + 28;
  const w = Math.round(Math.min(LATERAL.w, 14 + q + 18 + wT + 28));
  const em = Math.max(m.de, m.em - 0.05);
  const eT = prog(t, em + 0.1, 0.3);
  // o selo "respira" devagar enquanto o chip está no ar (é um "vem aí")
  const pulso = 1 + 0.05 * Math.sin(Math.max(0, t - em) * 5);
  return (
    <Vidro x={xFora(lado, w)} y={BASE - h} w={w} h={h} t={t} de={em} ate={m.ate} lado={lado}>
      <div style={{ position: "absolute", left: 14, top: 14, transform: `scale(${pulso})` }}>
        <Selo tamanho={q}>
          <Icone nome="play" tamanho={30} />
        </Selo>
      </div>
      <div style={{ position: "absolute", left: 14 + q + 18, top: 0, height: h, lineHeight: `${h}px`, fontFamily: FONTE, fontWeight: 700, fontSize: tam, color: COR.giz, whiteSpace: "nowrap", opacity: eT, transform: eT >= 1 ? undefined : `translateX(${(1 - eT) * 12}px)` }}>
        {m.texto}
      </div>
    </Vidro>
  );
};

// ——— lembrete de inscrição: o cursor clica no botão (sem sino) ———
export const cliqueDa = (m: TInscricao | TCta) => ("cliqueEm" in m && m.cliqueEm !== undefined ? m.cliqueEm : (m.em ?? m.de) + 0.45);

export const Inscricao: React.FC<{ plano: Plano; m: TInscricao | TCta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const lado = ladoLivre(plano, m.lado);
  const canal = ("canal" in m && m.canal) || plano.marca?.nome || "";
  const linha2 = m.texto ?? "";
  const clique = cliqueDa(m);
  const P = 28;
  const av = 96;
  const tamC = canal ? encaixar(canal, { largura: 320, max: 40, min: 24, linhas: 1, fonte: { peso: 800 } }).tamanho : 0;
  const tam2 = linha2 ? encaixar(linha2, { largura: 320, max: 28, min: 18, linhas: 1, fonte: { peso: 500 } }).tamanho : 0;
  const wTexto = Math.max(canal ? larguraTexto(canal, tamC, { peso: 800 }) : 0, linha2 ? larguraTexto(linha2, tam2, { peso: 500 }) : 0);
  const rotBotao = t >= clique + 0.08 ? "Inscrito" : "Inscrever-se";
  const tamB = 34;
  const wBotao = Math.round(larguraTexto("Inscrever-se", tamB, { peso: 700 }) + 64 + 8);
  const w = Math.round(P + av + 22 + wTexto + 34 + wBotao + P);
  const h = av + P * 2;
  const x = xFora(lado, Math.min(LATERAL.w, w));
  const y = BASE - h;
  // o cursor entra do canto de fora, para no botão, aperta e sai
  const xB = w - P - wBotao;
  const yB = (h - 72) / 2;
  const chega = prog(t, (m.em ?? m.de) + 0.05, Math.max(0.2, clique - (m.em ?? m.de) - 0.1), suave);
  const aperta = t >= clique && t < clique + 0.14 ? 0.93 : 1;
  const some = prog(t, clique + 0.55, 0.3);
  const cx = x + xB + wBotao * 0.62 + (1 - chega) * 220 * (lado === "dir" ? 1 : -1);
  const cy = y + yB + 40 + (1 - chega) * 150;
  const inscrito = t >= clique + 0.08;
  const eB = prog(t, clique + 0.06, 0.25);
  return (
    <>
      <Vidro x={x} y={y} w={Math.min(LATERAL.w, w)} h={h} t={t} de={m.de} ate={m.ate} lado={lado} tempo={false}>
        <div style={{ position: "absolute", left: P, top: P, width: av, height: av, borderRadius: av / 2, background: COR.cobalto, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="play" tamanho={40} />
        </div>
        {canal ? <div style={{ position: "absolute", left: P + av + 22, top: linha2 ? P + 6 : (h - tamC * 1.2) / 2, fontFamily: FONTE, fontWeight: 800, fontSize: tamC, lineHeight: 1.2, color: COR.giz, whiteSpace: "nowrap" }}>{canal}</div> : null}
        {linha2 ? <div style={{ position: "absolute", left: P + av + 22, top: canal ? P + 10 + tamC * 1.2 : (h - tam2 * 1.3) / 2, fontFamily: FONTE, fontWeight: 500, fontSize: tam2, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap" }}>{linha2}</div> : null}
        <div
          style={{
            position: "absolute",
            left: xB,
            top: yB,
            width: wBotao,
            height: 72,
            borderRadius: 36,
            background: inscrito ? COR.trilho : COR.cobalto,
            transform: `scale(${aperta})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: tamB,
            color: COR.giz,
            whiteSpace: "nowrap",
          }}
        >
          {inscrito ? (
            <div style={{ opacity: eB, display: "flex", alignItems: "center", gap: 10 }}>
              <Icone nome="check" tamanho={30} />
              {rotBotao}
            </div>
          ) : (
            rotBotao
          )}
        </div>
      </Vidro>
      {/* o cursor (seta genérica) */}
      {t >= (m.em ?? m.de) && some < 1 ? (
        <svg width={46} height={56} viewBox="0 0 23 28" style={{ position: "absolute", left: cx, top: cy, opacity: 1 - some, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}>
          <path d="M2 2 L2 22 L7.5 17 L11 25.5 L14.5 24 L11 15.8 L18.5 15.8 Z" fill={COR.giz} stroke={COR.tinta} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
      ) : null}
    </>
  );
};

// ——— cta (salvar, comentar, link): cartão no lado livre, com o ícone e a chamada na fala ———
export const Cta: React.FC<{ plano: Plano; m: TCta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  if (m.icone === "seguir") return <Inscricao plano={plano} m={m} t={t} />;
  const lado = ladoLivre(plano, m.lado);
  const P = 36;
  const q = 92;
  const d = disporTexto(m.texto, { largura: LATERAL.w - P * 2 - q - 28, max: 60, min: 36, linhas: 3, peso: 800, espacamento: -0.02, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const w = Math.round(Math.min(LATERAL.w, P * 2 + q + 28 + d.largura + 10));
  const h = Math.round(Math.max(q, d.altura) + P * 2);
  const pulso = 1 + 0.035 * Math.sin(Math.max(0, t - m.de) * 4);
  return (
    <Vidro x={xFora(lado, w)} y={BASE - h} w={w} h={h} t={t} de={m.de} ate={m.ate} lado={lado}>
      <div style={{ position: "absolute", left: P, top: (h - q) / 2, transform: `scale(${pulso})` }}>
        <Selo tamanho={q}>
          <Icone nome={m.icone ?? "salvar"} tamanho={50} />
        </Selo>
      </div>
      <TextoFalado d={d} x={P + q + 28} y={(h - d.altura) / 2} t={t} sobre="painel" peso={800} />
    </Vidro>
  );
};

// ——— cena: o B-roll em tela cheia ———
export const Cena: React.FC<{ plano: Plano; m: TCena; t: number }> = ({ plano, m, t }) => {
  if (t < m.de - 0.5 || t >= m.ate) return null;
  const img = imagemDoPlano(plano, m.imagem);
  const palavra = m.rotulo ?? img?.palavra ?? m.imagem.id;
  if (!temImagem(img)) {
    if (t < m.de) return null;
    return <SemImagem texto={palavra} largura={W} altura={H} de={m.de} ate={m.ate} t={t} fundo={COR.tinta} cor={COR.giz} fonte={FONTE} peso={800} style={{ position: "absolute", left: 0, top: 0 }} />;
  }
  const rotuloEm = Math.max(m.de + 0.12, m.rotuloEm ?? m.em ?? m.de);
  const fit = m.rotulo ? encaixar(m.rotulo, { largura: 900, max: 28, min: 20, linhas: 1, fonte: { mono: true, caixaAlta: true, espacamento: 0.06 } }) : null;
  const wR = fit ? Math.round(larguraTexto(m.rotulo ?? "", fit.tamanho, { mono: true, caixaAlta: true, espacamento: 0.06 }) + 24 + 46 + 18 + 26) : 0;
  const c = entradaPainel(t, rotuloEm, m.ate);
  return (
    <>
      <Foto imagem={img} de={m.de} ate={m.ate} t={t} largura={W} altura={H} efeito={m.imagem.efeito ?? "aproximar"} intensidade={0.07} style={{ position: "absolute", left: 0, top: 0 }} />
      {m.rotulo && fit ? (
        <div style={{ position: "absolute", left: MARGEM_X, top: MARGEM_Y, width: wR, height: 64, borderRadius: 32, ...VIDRO, display: t >= rotuloEm ? "flex" : "none", alignItems: "center", padding: "0 26px 0 24px", boxSizing: "border-box", opacity: Math.min(1, c.aberto * 1.6), clipPath: c.e >= 1 && c.s <= 0 ? undefined : `inset(0 ${((1 - Math.min(1, c.e * 1.1)) * 100).toFixed(1)}% 0 0 round 32px)` }}>
          <BarrasDeSom t={t} altura={30} />
          <div style={{ marginLeft: 18, fontFamily: MONO, fontWeight: 500, fontSize: fit.tamanho, letterSpacing: "0.06em", textTransform: "uppercase", color: COR.giz, whiteSpace: "nowrap" }}>{m.rotulo}</div>
        </div>
      ) : null}
    </>
  );
};
