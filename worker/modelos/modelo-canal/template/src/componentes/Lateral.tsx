// O REFRAME, a assinatura do Canal, e os blocos de informação que entram nele. A câmera aproxima e
// empurra a pessoa para um lado (camera.ts); na metade livre, um painel de vidro escuro com a
// informação, que entra na fala. Tudo alinhado à esquerda dentro do painel, rótulos em mono,
// texto giz em Inter, um único destaque cobalto.
import { Foto, SemImagem, imagemDoPlano, temImagem } from "../motor/imagem";
import { encaixar } from "../medida";
import type {
  Comparacao as TComparacao,
  Definicao as TDefinicao,
  Frase as TFrase,
  Grafico as TGrafico,
  Numero as TNumero,
  Passos as TPassos,
  Pergunta as TPergunta,
  Plano,
  Reframe as TReframe,
  Topicos as TTopicos,
} from "../plano";
import { COR, FONTE, LATERAL, MONO, formatar, ladoLivre, prog, suave, xLateral, type Lado } from "../tema";
import { Icone, Rotulo, Selo, Vidro } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

const P = 40; // margem interna dos lados
const PT = 38; // margem de cima (abaixo da linha de tempo)
const PB = 38; // margem de baixo
const UTIL = LATERAL.w - P * 2; // 744
const CAB = 46; // altura do cabeçalho (rótulo mono + respiro)

// O painel lateral: centrado na altura da tela, na metade livre.
export const PainelLateral: React.FC<{ plano: Plano; lado?: Lado; h: number; t: number; de: number; ate: number; alerta?: boolean; children?: React.ReactNode }> = ({
  plano,
  lado,
  h,
  t,
  de,
  ate,
  alerta,
  children,
}) => {
  const l = ladoLivre(plano, lado);
  const altura = Math.min(LATERAL.base - LATERAL.topo, Math.round(h));
  const y = Math.round(Math.max(LATERAL.topo, Math.min(LATERAL.base - altura, 540 - altura / 2)));
  return (
    <Vidro x={xLateral(l)} y={y} w={LATERAL.w} h={altura} t={t} de={de} ate={ate} lado={l} alerta={alerta}>
      {children}
    </Vidro>
  );
};

// ——— reframe: os cartões que entram na fala ———
export const Reframe: React.FC<{ plano: Plano; m: TReframe; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const n = m.itens.length;
  const imgs = m.itens.map((it) => imagemDoPlano(plano, it.imagem));
  const comFoto = imgs.some((im) => temImagem(im));
  const numerar = m.numerar !== false;
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.03) atual = i;
  });
  const hMain = comFoto ? Math.round((UTIL * 9) / 16) : 300;
  const temDetalhe = m.itens.some((it) => it.detalhe);
  const hTitulo = 76 + (temDetalhe ? 44 : 0);
  const hTrilha = 78;
  const h = PT + CAB + hMain + 26 + hTitulo + 22 + hTrilha + PB;
  const yMain = PT + CAB;
  const yTitulo = yMain + hMain + 26;
  const yTrilha = yTitulo + hTitulo + 22;
  const tamSelo = 60;
  // o nome do item da vez: um corpo só para todos (não muda de tamanho de um para outro)
  const tam = Math.min(...m.itens.map((it) => encaixar(it.texto, { largura: UTIL - (numerar ? tamSelo + 22 : 0), max: 64, min: 36, linhas: 1, fonte: { peso: 800, espacamento: -0.02 } }).tamanho));
  const slot = (UTIL - (n - 1) * 12) / n;
  const tamSlot = Math.min(...m.itens.map((it) => encaixar(it.texto, { largura: slot - 68, max: 30, min: 18, linhas: 1, fonte: { peso: 700 } }).tamanho));
  const cabecalho = atual >= 0 && m.titulo ? m.titulo : "";
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      {cabecalho ? <Rotulo texto={cabecalho} x={P} y={PT - 2} largura={UTIL - 90} tamanho={26} /> : null}
      {atual >= 0 ? <Rotulo texto={`${atual + 1}/${n}`} x={P} y={PT - 2} largura={UTIL} alinhar="dir" cor={COR.cobaltoClaro} tamanho={26} /> : null}
      {/* a área grande: o título antes do primeiro item; depois, a foto (ou o cartão) do item da vez */}
      <div style={{ position: "absolute", left: P, top: yMain, width: UTIL, height: hMain, borderRadius: 16, overflow: "hidden", background: COR.tinta }}>
        {atual < 0 ? <TituloGrande texto={m.titulo ?? ""} t={t} de={m.de} w={UTIL} h={hMain} /> : null}
        {m.itens.map((it, i) => {
          if (i > atual || i < atual - 1) return null;
          const img = imgs[i];
          const entra = prog(t, it.em - 0.03, 0.42);
          // o novo entra do lado livre e cobre o anterior
          const estilo: React.CSSProperties = {
            position: "absolute",
            left: 0,
            top: 0,
            clipPath: i === atual && entra < 1 ? `inset(0 0 0 ${((1 - entra) * 100).toFixed(2)}%)` : undefined,
          };
          if (temImagem(img)) {
            return (
              <Foto
                key={i}
                imagem={img}
                de={it.em - 0.03}
                ate={m.ate}
                t={t}
                largura={UTIL}
                altura={hMain}
                efeito={it.imagem?.efeito ?? "aproximar"}
                intensidade={0.07}
                style={estilo}
              />
            );
          }
          return (
            <div key={i} style={{ ...estilo, width: UTIL, height: hMain, background: COR.tinta }}>
              <SemImagem texto={it.texto} largura={UTIL} altura={hMain} de={it.em - 0.03} ate={m.ate} t={t} fundo={COR.tinta} cor={COR.giz} fonte={FONTE} peso={800} />
            </div>
          );
        })}
      </div>
      {/* o nome do item da vez, com o selo numerado */}
      {atual >= 0
        ? (() => {
            const it = m.itens[atual];
            const e = prog(t, it.em - 0.03, 0.3);
            const pronto = e >= 1;
            return (
              <div key={`n${atual}`} style={{ position: "absolute", left: P, top: yTitulo, width: UTIL, height: hTitulo, opacity: pronto ? 1 : e, transform: pronto ? undefined : `translateY(${(1 - e) * 12}px)` }}>
                <div style={{ display: "flex", alignItems: "center", height: 76 }}>
                  {numerar ? <Selo tamanho={tamSelo}>{atual + 1}</Selo> : null}
                  <div style={{ marginLeft: numerar ? 22 : 0, fontFamily: FONTE, fontWeight: 800, fontSize: tam, letterSpacing: "-0.02em", color: COR.giz, whiteSpace: "nowrap", lineHeight: 1 }}>{it.texto}</div>
                </div>
                {it.detalhe ? (
                  <div style={{ marginTop: 6, marginLeft: numerar ? tamSelo + 22 : 0, fontFamily: FONTE, fontWeight: 500, fontSize: 30, color: COR.apoio, whiteSpace: "nowrap" }}>{it.detalhe}</div>
                ) : null}
              </div>
            );
          })()
        : null}
      {/* a trilha: um lugar por item; os lugares entram em sequência na abertura do painel, o
          próximo a ser dito pulsa de leve e cada um acende quando o item é dito */}
      {m.itens.map((it, i) => {
        const x = P + i * (slot + 12);
        const dito = t >= it.em - 0.03;
        const daVez = i === atual;
        const e = prog(t, it.em - 0.03, 0.3);
        const chega = prog(t, m.de + 0.22 + i * 0.2, 0.32);
        if (chega <= 0) return null;
        const proximo = i === atual + 1 && !dito;
        const brilho = proximo ? 0.35 + 0.3 * (0.5 - 0.5 * Math.cos(Math.max(0, t - m.de) * 5)) : 0;
        const borda = daVez ? COR.cobalto : proximo ? `rgba(61,99,255,${brilho.toFixed(3)})` : COR.trilho;
        return (
          <div key={`s${i}`} style={{ position: "absolute", left: x, top: yTrilha, width: slot, height: hTrilha, borderRadius: 12, background: daVez ? "rgba(61,99,255,0.16)" : "rgba(255,255,255,0.04)", border: `2px solid ${borda}`, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 14px", overflow: "hidden", opacity: chega >= 1 ? 1 : chega, transform: chega >= 1 ? undefined : `translateY(${(1 - chega) * 14}px)` }}>
            <Selo tamanho={40} apagado={!daVez && dito} vazado={!dito}>
              {i + 1}
            </Selo>
            <div style={{ marginLeft: 12, fontFamily: FONTE, fontWeight: 700, fontSize: tamSlot, color: daVez ? COR.giz : COR.apoio, whiteSpace: "nowrap", opacity: dito ? Math.max(0.001, e) : 0 }}>{it.texto}</div>
          </div>
        );
      })}
    </PainelLateral>
  );
};

// o título grande que ocupa a área antes do primeiro item (com uma grade leve que desliza)
const TituloGrande: React.FC<{ texto: string; t: number; de: number; w: number; h: number }> = ({ texto, t, de, w, h }) => {
  const fit = encaixar(texto || " ", { largura: w - 96, max: 76, min: 40, linhas: 2, fonte: { peso: 800, espacamento: -0.02 } });
  const e = prog(t, de + 0.12, 0.4);
  const desliza = ((t - de) * 18) % 48;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: -48,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.07) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.07) 2px, transparent 2px)",
          backgroundSize: "48px 48px",
          transform: `translate(${desliza}px, ${desliza * 0.5}px)`,
        }}
      />
      <div style={{ position: "absolute", left: 48, top: (h - fit.linhas.length * fit.tamanho * 1.08) / 2, opacity: e, transform: e >= 1 ? undefined : `translateY(${(1 - e) * 14}px)` }}>
        {fit.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: COR.giz, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// ——— topicos e passos: as linhas entram na fala; a da vez em giz, as anteriores em cinza ———
export const Lista: React.FC<{ plano: Plano; m: TTopicos | TPassos; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const numerado = m.tipo === "passos";
  const n = m.itens.length;
  const temDetalhe = m.itens.some((it) => it.detalhe);
  const linha = temDetalhe ? 122 : 96;
  const gap = 14;
  const marca = numerado ? 60 : 20;
  const larg = UTIL - marca - 26;
  const tam = Math.min(...m.itens.map((it) => encaixar(it.texto, { largura: larg, max: 50, min: 28, linhas: 1, fonte: { peso: 700 } }).tamanho));
  const hCab = m.titulo ? CAB : 0;
  const h = PT + hCab + n * linha + (n - 1) * gap + PB;
  let atual = -1;
  m.itens.forEach((it, i) => {
    if (t >= it.em - 0.03) atual = i;
  });
  const yItem = (i: number) => PT + hCab + i * (linha + gap);
  const centro = (i: number) => yItem(i) + (temDetalhe ? 30 : linha / 2);
  // o fio que liga os números desce até o passo da vez
  const fio = numerado && atual > 0 ? centro(atual - 1) + (centro(atual) - centro(atual - 1)) * prog(t, m.itens[atual].em - 0.03, 0.35) : 0;
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Rotulo texto={m.titulo} x={P} y={PT} largura={UTIL} /> : null}
      {numerado && atual > 0 ? <div style={{ position: "absolute", left: P + marca / 2 - 2, top: centro(0), width: 4, height: Math.max(0, fio - centro(0)), background: COR.cobalto }} /> : null}
      {m.itens.map((it, i) => {
        const e = prog(t, it.em - 0.03, 0.32);
        if (e <= 0) return null;
        const daVez = i === atual;
        const pronto = e >= 1;
        const detalhe = it.detalhe ? encaixar(it.detalhe, { largura: larg, max: 30, min: 22, linhas: 1, fonte: { peso: 500 } }) : null;
        return (
          <div key={i} style={{ position: "absolute", left: P, top: yItem(i), width: UTIL, height: linha, opacity: pronto ? 1 : e, transform: pronto ? undefined : `translateX(${(1 - e) * 24}px)` }}>
            <div style={{ position: "absolute", left: 0, top: (temDetalhe ? 30 : linha / 2) - marca / 2 }}>
              {numerado ? (
                <Selo tamanho={marca} apagado={!daVez}>
                  {String(i + 1).padStart(2, "0")}
                </Selo>
              ) : (
                <div style={{ width: marca, height: marca, borderRadius: 5, background: daVez ? COR.cobalto : COR.trilho }} />
              )}
            </div>
            <div style={{ position: "absolute", left: marca + 26, top: (temDetalhe ? 30 : linha / 2) - tam * 0.62, fontFamily: FONTE, fontWeight: 700, fontSize: tam, lineHeight: 1.24, color: daVez ? COR.giz : COR.apoio, whiteSpace: "nowrap" }}>{it.texto}</div>
            {detalhe ? (
              <div style={{ position: "absolute", left: marca + 26, top: 30 + tam * 0.66, fontFamily: FONTE, fontWeight: 500, fontSize: detalhe.tamanho, color: COR.apoio, whiteSpace: "nowrap" }}>{it.detalhe}</div>
            ) : null}
          </div>
        );
      })}
    </PainelLateral>
  );
};

// ——— numero: o número grande contando, a barra cobalto que enche e o rótulo ———
export const Numero: React.FC<{ plano: Plano; m: TNumero; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const casas = m.casas ?? 0;
  const final = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const num = encaixar(final, { largura: UTIL, max: 200, min: 80, linhas: 1, fonte: { peso: 800, espacamento: -0.02 } });
  const rot = encaixar(m.rotulo, { largura: UTIL, max: 46, min: 28, linhas: 2, fonte: { peso: 600 } });
  const hCab = m.titulo ? CAB : 0;
  const hNum = Math.round(num.tamanho * 1.04);
  const hRot = Math.round(rot.linhas.length * rot.tamanho * 1.22);
  const tag = m.ilustrativo ? 40 : 0;
  const h = PT + hCab + hNum + 30 + hRot + tag + PB;
  const p = prog(t, m.em, 0.9);
  const valor = m.valor * p;
  const atual = `${m.prefixo ?? ""}${formatar(casas === 0 ? Math.round(valor) : valor, casas)}${m.sufixo ?? ""}`;
  const er = prog(t, m.rotuloEm ?? m.em + 0.3, 0.35);
  const yNum = PT + hCab;
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Rotulo texto={m.titulo} x={P} y={PT} largura={UTIL} /> : null}
      <div style={{ position: "absolute", left: P, top: yNum, height: hNum, lineHeight: `${hNum}px`, fontFamily: FONTE, fontWeight: 800, fontSize: num.tamanho, letterSpacing: "-0.02em", color: COR.giz, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {atual}
      </div>
      {/* a barra cobalto enche enquanto o número conta */}
      <div style={{ position: "absolute", left: P, top: yNum + hNum + 10, width: UTIL, height: 8, borderRadius: 4, background: COR.trilho }} />
      <div style={{ position: "absolute", left: P, top: yNum + hNum + 10, width: UTIL * p, height: 8, borderRadius: 4, background: COR.cobalto }} />
      <div style={{ position: "absolute", left: P, top: yNum + hNum + 30, clipPath: `inset(0 ${((1 - er) * 100).toFixed(1)}% 0 0)` }}>
        {rot.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: FONTE, fontWeight: 600, fontSize: rot.tamanho, lineHeight: 1.22, color: COR.giz, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
        {m.ilustrativo ? <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 22, letterSpacing: "0.06em", textTransform: "uppercase", color: COR.apoio }}>ilustrativo</div> : null}
      </div>
    </PainelLateral>
  );
};

// ——— comparacao: dois cartões empilhados; o vencedor acende em cobalto, o outro apaga ———
export const Comparacao: React.FC<{ plano: Plano; m: TComparacao; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const hCab = m.titulo ? CAB : 0;
  const larg = UTIL - 56;
  const fits = m.lados.map((l) => encaixar(l.texto, { largura: larg, max: 54, min: 30, linhas: 2, fonte: { peso: 800 } }));
  const tam = Math.min(...fits.map((f) => f.tamanho));
  const linhas = m.lados.map((l) => encaixar(l.texto, { largura: larg, max: tam, min: tam, linhas: 3, fonte: { peso: 800 } }).linhas);
  const hCard = (k: number) => Math.round(24 + 34 + 12 + linhas[k].length * tam * 1.12 + 24);
  const meio = 52;
  const h = PT + hCab + hCard(0) + meio + hCard(1) + PB;
  const venceu = m.vencedor !== undefined ? prog(t, m.vencedorEm ?? m.lados[m.vencedor].em + 0.6, 0.35) : 0;
  const simbolo = m.modo === "antes-depois" || m.modo === "errado-certo" ? "↓" : "vs";
  const y0 = PT + hCab;
  const ys = [y0, y0 + hCard(0) + meio];
  const eMeio = prog(t, m.lados[1].em - 0.03, 0.3);
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Rotulo texto={m.titulo} x={P} y={PT} largura={UTIL} /> : null}
      {m.lados.map((l, i) => {
        const e = prog(t, l.em - 0.03, 0.32);
        if (e <= 0) return null;
        const perdeu = m.vencedor !== undefined && m.vencedor !== i;
        const ganhou = m.vencedor === i && venceu > 0.5;
        const riscar = perdeu && m.modo === "errado-certo" ? venceu : 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: P,
              top: ys[i],
              width: UTIL,
              height: hCard(i),
              borderRadius: 16,
              background: ganhou ? "rgba(61,99,255,0.18)" : "rgba(255,255,255,0.05)",
              border: `2px solid ${ganhou ? COR.cobalto : COR.trilho}`,
              boxSizing: "border-box",
              opacity: (e >= 1 ? 1 : e) * (perdeu ? 1 - 0.5 * venceu : 1),
              transform: e >= 1 ? undefined : `translateX(${(1 - e) * 24}px)`,
            }}
          >
            <Rotulo texto={l.rotulo} x={26} y={22} largura={UTIL - 110} cor={ganhou ? COR.cobaltoClaro : COR.apoio} />
            {ganhou ? (
              <div style={{ position: "absolute", right: 22, top: 16 }}>
                <Selo tamanho={44}>
                  <Icone nome="check" tamanho={26} />
                </Selo>
              </div>
            ) : null}
            {linhas[i].map((ln, k) => (
              <div key={k} style={{ position: "absolute", left: 26, top: 24 + 34 + 12 + k * tam * 1.12, fontFamily: FONTE, fontWeight: 800, fontSize: tam, lineHeight: 1.12, color: COR.giz, whiteSpace: "nowrap" }}>
                {ln}
                {riscar > 0 ? <div style={{ position: "absolute", left: -4, top: tam * 0.56, width: `calc(${(riscar * 100).toFixed(1)}% + 8px)`, height: 6, borderRadius: 3, background: COR.coral }} /> : null}
              </div>
            ))}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: P + 26,
          top: ys[0] + hCard(0) + (meio - 36) / 2,
          height: 36,
          padding: "0 14px",
          borderRadius: 18,
          background: COR.trilho,
          color: COR.giz,
          fontFamily: MONO,
          fontSize: 22,
          lineHeight: "36px",
          opacity: eMeio,
        }}
      >
        {simbolo}
      </div>
    </PainelLateral>
  );
};

// ——— definicao: o termo, o fio cobalto e o significado linha a linha ———
export const Definicao: React.FC<{ plano: Plano; m: TDefinicao; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const termo = encaixar(m.termo, { largura: UTIL, max: 76, min: 40, linhas: 1, fonte: { peso: 800, espacamento: -0.02 } });
  const sig = encaixar(m.significado, { largura: UTIL, max: 40, min: 26, linhas: 4, fonte: { peso: 500 } });
  const hTermo = Math.round(termo.tamanho * 1.12);
  const hSig = Math.round(sig.linhas.length * sig.tamanho * 1.32);
  const h = PT + hTermo + 34 + hSig + PB;
  const e1 = prog(t, m.em - 0.03, 0.3);
  const fio = prog(t, m.em + 0.15, 0.5);
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: P, top: PT, height: hTermo, lineHeight: `${hTermo}px`, fontFamily: FONTE, fontWeight: 800, fontSize: termo.tamanho, letterSpacing: "-0.02em", color: COR.giz, whiteSpace: "nowrap", opacity: e1 }}>
        {m.termo}
      </div>
      <div style={{ position: "absolute", left: P, top: PT + hTermo + 12, width: 120 * fio, height: 6, borderRadius: 3, background: COR.cobalto }} />
      {sig.linhas.map((l, i) => {
        const e = prog(t, m.significadoEm - 0.03 + i * 0.25, 0.35);
        return (
          <div key={i} style={{ position: "absolute", left: P, top: PT + hTermo + 34 + i * sig.tamanho * 1.32, fontFamily: FONTE, fontWeight: 500, fontSize: sig.tamanho, lineHeight: 1.32, color: COR.giz, whiteSpace: "nowrap", clipPath: `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0)` }}>
            {l}
          </div>
        );
      })}
    </PainelLateral>
  );
};

// ——— frase: a fala palavra por palavra; `destaque` no marcador cobalto, `risco` riscado ———
export const Frase: React.FC<{ plano: Plano; m: TFrase; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const o = { largura: UTIL, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, risco: m.risco, peso: 800 as const, espacamento: -0.02 };
  let d = disporTexto(m.texto, { ...o, max: 70, min: 42, linhas: 4 });
  if (d.altura > 560) d = disporTexto(m.texto, { ...o, max: 42, min: 30, linhas: 7 });
  const h = PT + 56 + d.altura + PB;
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: P - 4, top: PT - 26, fontFamily: FONTE, fontWeight: 800, fontSize: 110, lineHeight: 1, color: COR.cobalto }}>“</div>
      <TextoFalado d={d} x={P} y={PT + 56} t={t} sobre="painel" peso={800} riscoEm={m.riscoEm} />
    </PainelLateral>
  );
};

// ——— pergunta: o "?" cobalto, a pergunta palavra por palavra e as opções com letra ———
export const Pergunta: React.FC<{ plano: Plano; m: TPergunta; t: number }> = ({ plano, m, t }) => {
  if (t < m.de || t >= m.ate) return null;
  const q = 64;
  const ops = m.opcoes ?? [];
  const d = disporTexto(m.texto, { largura: UTIL - q - 24, max: 58, min: 34, linhas: 3, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, peso: 800, espacamento: -0.02 });
  const topo = Math.max(d.altura, q);
  const linha = 76;
  const tamOp = ops.length ? Math.min(...ops.map((o) => encaixar(o.texto, { largura: UTIL - 72, max: 36, min: 24, linhas: 1, fonte: { peso: 600 } }).tamanho)) : 0;
  const h = PT + topo + (ops.length ? 28 + ops.length * linha + (ops.length - 1) * 10 : 0) + PB;
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      <div style={{ position: "absolute", left: P, top: PT }}>
        <Selo tamanho={q} mono={false}>
          ?
        </Selo>
      </div>
      <TextoFalado d={d} x={P + q + 24} y={PT + (topo - d.altura) / 2} t={t} sobre="painel" peso={800} />
      {ops.map((o, i) => {
        const e = prog(t, o.em - 0.03, 0.3);
        if (e <= 0) return null;
        const y = PT + topo + 28 + i * (linha + 10);
        return (
          <div key={i} style={{ position: "absolute", left: P, top: y, width: UTIL, height: linha, borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `2px solid ${COR.trilho}`, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 16px", clipPath: `inset(0 ${((1 - e) * 100).toFixed(1)}% 0 0 round 14px)` }}>
            <Selo tamanho={44} apagado>
              {String.fromCharCode(65 + i)}
            </Selo>
            <div style={{ marginLeft: 18, fontFamily: FONTE, fontWeight: 600, fontSize: tamOp, color: COR.giz, whiteSpace: "nowrap" }}>{o.texto}</div>
          </div>
        );
      })}
    </PainelLateral>
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
  const hCab = m.titulo || m.ilustrativo || !m.dados?.length ? CAB : 0;
  const hArea = 420;
  const h = PT + hCab + hArea + PB;
  const x0 = P;
  const x1 = P + UTIL;
  const y0 = PT + hCab + 50;
  const y1 = PT + hCab + hArea - 50;
  const dados = m.dados ?? [];
  const un = m.unidade ? ` ${m.unidade}` : "";
  const ilustr = m.ilustrativo || !dados.length;
  let conteudo: React.ReactNode = null;
  if (!dados.length) {
    const pts = caminhoDaTendencia(m.tendencia, x1 - x0, y1 - y0 + 40);
    const total = comprimento(pts);
    const p = prog(t, m.tendenciaEm ?? m.de + 0.2, 1.3, suave);
    const d = pts.map((q, i) => `${i ? "L" : "M"}${(x0 + q[0]).toFixed(1)},${(y0 - 20 + q[1]).toFixed(1)}`).join(" ");
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
      <svg width={LATERAL.w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <line x1={x0} x2={x1} y1={y1 + 24} y2={y1 + 24} stroke={COR.trilho} strokeWidth={3} />
        <path d={d} fill="none" stroke={COR.giz} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={total} strokeDashoffset={total * (1 - p)} />
        {p > 0 ? <circle cx={x0 + ponta[0]} cy={y0 - 20 + ponta[1]} r={13} fill={COR.cobalto} /> : null}
      </svg>
    );
  } else if (m.forma === "pizza") {
    const r = Math.min((y1 - y0 + 60) / 2, 150);
    const cx = x0 + r + 6;
    const cy = (y0 + y1) / 2;
    const soma = dados.reduce((a, b) => a + b.valor, 0) || 1;
    const tons = [COR.giz, "#C9CDD3", "#8F959F", "#626872", "#454A53", "#353941"];
    let atual = -1;
    dados.forEach((dd, i) => {
      if (t >= dd.em - 0.03) atual = i;
    });
    let ang = -Math.PI / 2;
    const xL = cx + r + 46;
    const tamL = Math.min(...dados.map((dd) => encaixar(`${dd.rotulo} ${formatar(dd.valor)}${un}`, { largura: x1 - xL - 30, max: 34, min: 20, linhas: 1, fonte: { peso: 600 } }).tamanho));
    conteudo = (
      <>
        <svg width={LATERAL.w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={cx} cy={cy} r={r - 24} fill="none" stroke={COR.trilho} strokeWidth={48} />
          {dados.map((dd, i) => {
            const frac = dd.valor / soma;
            const p = prog(t, dd.em - 0.03, 0.6);
            const a0 = ang;
            ang += frac * Math.PI * 2;
            const circ = 2 * Math.PI * (r - 24);
            return <circle key={i} cx={cx} cy={cy} r={r - 24} fill="none" stroke={i === atual ? COR.cobalto : tons[i % tons.length]} strokeWidth={48} strokeDasharray={`${circ * frac * p} ${circ}`} transform={`rotate(${(a0 * 180) / Math.PI} ${cx} ${cy})`} />;
          })}
        </svg>
        {dados.map((dd, i) => {
          const e = prog(t, dd.em - 0.03, 0.3);
          const yy = cy - (dados.length * 54) / 2 + i * 54;
          return (
            <div key={i} style={{ position: "absolute", left: xL, top: yy, height: 48, display: "flex", alignItems: "center", opacity: e, fontFamily: FONTE, fontWeight: 600, fontSize: tamL, color: COR.giz, whiteSpace: "nowrap" }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, marginRight: 12, background: i === atual ? COR.cobalto : tons[i % tons.length] }} />
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
    const tamR = Math.min(...dados.map((dd) => encaixar(dd.rotulo, { largura: slot - 12, max: 26, min: 17, linhas: 1, fonte: { peso: 600 } }).tamanho));
    const tamV = Math.min(...dados.map((dd) => encaixar(`${formatar(dd.valor)}${un}`, { largura: slot - 8, max: 32, min: 18, linhas: 1, fonte: { peso: 800 } }).tamanho));
    const yDe = (v: number) => y1 - (v / max) * (y1 - y0);
    const pontos = dados.map((dd, i) => [x0 + slot * (i + 0.5), yDe(dd.valor)] as [number, number]);
    conteudo = (
      <>
        <svg width={LATERAL.w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={x0} x2={x1} y1={y1} y2={y1} stroke={COR.trilho} strokeWidth={3} />
          {m.forma === "barras"
            ? dados.map((dd, i) => {
                const p = prog(t, dd.em - 0.03, 0.55);
                const bw = Math.min(120, slot * 0.56);
                const top = y1 - (y1 - yDe(dd.valor)) * p;
                return <rect key={i} x={x0 + slot * (i + 0.5) - bw / 2} y={top} width={bw} height={Math.max(0, y1 - top)} rx={8} fill={i === atual ? COR.cobalto : COR.giz} />;
              })
            : pontos.map((q, i) => {
                if (i === 0) return null;
                const p = prog(t, dados[i].em - 0.03, 0.5);
                const a = pontos[i - 1];
                return <line key={i} x1={a[0]} y1={a[1]} x2={a[0] + (q[0] - a[0]) * p} y2={a[1] + (q[1] - a[1]) * p} stroke={COR.giz} strokeWidth={6} strokeLinecap="round" />;
              })}
          {m.forma === "linha" ? pontos.map((q, i) => (t >= dados[i].em - 0.03 ? <circle key={`c${i}`} cx={q[0]} cy={q[1]} r={12} fill={i === atual ? COR.cobalto : COR.giz} /> : null)) : null}
        </svg>
        {dados.map((dd, i) => {
          const e = prog(t, dd.em + 0.2, 0.3);
          const cx = x0 + slot * (i + 0.5);
          return (
            <div key={i} style={{ opacity: e }}>
              <div style={{ position: "absolute", left: cx - slot / 2, width: slot, top: yDe(dd.valor) - tamV - 14, textAlign: "center", fontFamily: FONTE, fontWeight: 800, fontSize: tamV, color: COR.giz, whiteSpace: "nowrap" }}>{`${formatar(dd.valor)}${un}`}</div>
              <div style={{ position: "absolute", left: cx - slot / 2, width: slot, top: y1 + 12, textAlign: "center", fontFamily: FONTE, fontWeight: 600, fontSize: tamR, color: COR.apoio, whiteSpace: "nowrap" }}>{dd.rotulo}</div>
            </div>
          );
        })}
      </>
    );
  }
  return (
    <PainelLateral plano={plano} lado={m.lado} h={h} t={t} de={m.de} ate={m.ate}>
      {m.titulo ? <Rotulo texto={m.titulo} x={P} y={PT} largura={UTIL - (ilustr ? 190 : 0)} /> : null}
      {ilustr ? <Rotulo texto="ilustrativo" x={P} y={PT} largura={UTIL} alinhar="dir" /> : null}
      {conteudo}
    </PainelLateral>
  );
};
