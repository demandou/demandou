// O MODO PROFESSOR: a pessoa em quadro cheio e um cartão de papel grande no lado livre, embaixo
// (longe do rosto; cobre o que estiver na mesa ao lado da pessoa). Todos com a mesma largura.
// - `capitulo`: a capa da aula. Abre já completa ("Aula 3", o título grande, o nome do professor);
//   a fala acende o número e cada palavra do título com o marca-texto, e o traço violeta se desenha;
// - `abertura`: o título do gancho palavra por palavra, com o marca-texto no destaque;
// - `destaque`: a virada — a palavra-chave grande, com o marca-texto que passa por trás;
// - `frase`: a citação com as aspas violeta, palavra por palavra (o risco riscado);
// - `cta`: o fechamento, com o ícone e a chamada na fala.
// A troca de modo é seca: o cartão nunca aparece por cima do slide.
import { encaixar, larguraTexto } from "../medida";
import { fimDaTroca, trocaSeca } from "../modo";
import type { Abertura as TAbertura, Capitulo as TCapitulo, Cta as TCta, Destaque as TDestaque, Frase as TFrase, Plano } from "../plano";
import { BASE_CARTAO, COR, FONTE, LIVRE_W, MARGEM_Y, ladoLivre, prog, xLivre } from "../tema";
import { Cartao, Icone, Selo, Sobretitulo } from "./Pecas";
import { TextoFalado, disporTexto } from "./Texto";

const P = 52;
// o cartão encosta na base do lado livre e cresce para cima
const yBaixo = (h: number) => Math.round(Math.max(MARGEM_Y + 90, BASE_CARTAO - h));
const iniciais = (nome: string) =>
  nome
    .replace(/^(prof\.?|profa\.?|dr\.?|dra\.?)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// ——— capítulo: a capa da aula ———
export const Capitulo: React.FC<{ plano: Plano; m: TCapitulo; t: number }> = ({ plano, m, t }) => {
  const de = Math.max(m.de, fimDaTroca(plano, m.de));
  if (t < de || t >= m.ate) return null;
  const lado = ladoLivre(plano);
  const w = LIVRE_W;
  const util = w - P * 2;
  const numero = m.numero ?? plano.aula?.numero ?? "";
  const yNum = P + 4;
  const cham = m.chamada ? encaixar(m.chamada, { largura: util, max: 38, min: 30, linhas: 1, fonte: { peso: 600 } }) : null;
  const yCham = yNum + (numero ? 56 : 0);
  const yTit = yCham + (cham ? Math.round(cham.tamanho * 1.3) + 8 : 0);
  const emTit = m.em ?? m.de;
  // o título já está na capa; cada palavra acende com o marca-texto quando é dita
  const falado = disporTexto(m.texto, { largura: util, max: 112, min: 64, linhas: 2, peso: 800, espacamento: -0.025, fala: plano.palavras, de: emTit, ate: m.ate, entrelinha: 1.04 });
  const d = { ...falado, palavras: falado.palavras.map((p) => ({ ...p, em: de - 1 })) };
  const acender = falado.palavras.map((p) => ({ texto: p.w, em: p.em }));
  const yTraco = yTit + d.altura + 12;
  const ultima = falado.palavras[falado.palavras.length - 1]?.em ?? emTit;
  const traco = prog(t, ultima + 0.12, 0.5);
  // o nome do professor: só se a capa fica tempo bastante para ler
  const marca = plano.marca ?? { nome: "", area: "" };
  const nome = m.ate - de >= 1.5 ? marca.nome : "";
  const tamN = nome ? encaixar(nome, { largura: util - 100, max: 38, min: 34, linhas: 1, fonte: { peso: 800 } }).tamanho : 0;
  const tamA = nome && marca.area ? encaixar(marca.area, { largura: util - 100, max: 28, min: 24, linhas: 1, fonte: { peso: 600 } }).tamanho : 0;
  const yPe = yTraco + 8 + 40;
  const hPe = nome ? Math.round(tamN * 1.25 + (tamA ? tamA * 1.3 + 4 : 0)) : 0;
  const h = Math.round(nome ? yPe + Math.max(76, hPe) + P - 6 : yTraco + 8 + P);
  // o número da aula acende quando é dito ("nesta aula")
  const wNum = numero ? larguraTexto(numero, 28, { peso: 800, caixaAlta: true, espacamento: 0.1 }) + 28 * 1.2 : 0;
  const acendeNum = numero && m.numeroEm !== undefined ? prog(t, m.numeroEm - 0.03, 0.35) : 0;
  return (
    <Cartao x={xLivre(plano, w)} y={yBaixo(h)} w={w} h={h} t={t} de={de} ate={m.ate} entraSeco={trocaSeca(plano, de)} saiSeco={trocaSeca(plano, m.ate)} lado={lado}>
      {numero ? (
        <>
          <div style={{ position: "absolute", left: P - 10, top: yNum + 14, width: (wNum + 20) * acendeNum, height: 22, borderRadius: 6, background: COR.marcaTexto }} />
          <Sobretitulo texto={numero} x={P} y={yNum} largura={util} tamanho={28} />
        </>
      ) : null}
      {cham ? <div style={{ position: "absolute", left: P, top: yCham, fontFamily: FONTE, fontWeight: 600, fontSize: cham.tamanho, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap" }}>{m.chamada}</div> : null}
      <TextoFalado d={d} x={P} y={yTit} t={t} peso={800} acender={acender} />
      <div style={{ position: "absolute", left: P, top: yTraco, width: Math.max(80, d.largura * 0.42) * traco, height: 8, borderRadius: 4, background: COR.violeta }} />
      {nome ? (
        <div style={{ position: "absolute", left: P, top: yPe, width: util, height: Math.max(76, hPe) }}>
          <div style={{ position: "absolute", left: 0, top: -22, width: util, height: 2, background: COR.trilho }} />
          <div style={{ position: "absolute", left: 0, top: Math.max(0, (Math.max(76, hPe) - 76) / 2), width: 76, height: 76, borderRadius: 38, background: COR.marcaTexto, color: COR.violetaEscuro, fontFamily: FONTE, fontWeight: 800, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {iniciais(nome)}
          </div>
          <div style={{ position: "absolute", left: 100, top: Math.max(0, (Math.max(76, hPe) - hPe) / 2) }}>
            <div style={{ fontFamily: FONTE, fontWeight: 800, fontSize: tamN, lineHeight: 1.25, color: COR.tinta, whiteSpace: "nowrap" }}>{nome}</div>
            {tamA ? <div style={{ marginTop: 4, fontFamily: FONTE, fontWeight: 600, fontSize: tamA, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap" }}>{marca.area}</div> : null}
          </div>
        </div>
      ) : null}
    </Cartao>
  );
};

// ——— abertura ———
export const Abertura: React.FC<{ plano: Plano; m: TAbertura; t: number }> = ({ plano, m, t }) => {
  const de = Math.max(m.de, fimDaTroca(plano, m.de));
  if (t < de || t >= m.ate) return null;
  const w = LIVRE_W;
  const d = disporTexto(m.texto, { largura: w - P * 2, max: 100, min: 56, linhas: 4, peso: 800, espacamento: -0.025, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, entrelinha: 1.08 });
  const h = Math.round(d.altura + P * 2 + 8);
  return (
    <Cartao x={xLivre(plano, w)} y={yBaixo(h)} w={w} h={h} t={t} de={de} ate={m.ate} entraSeco={trocaSeca(plano, de)} saiSeco={trocaSeca(plano, m.ate)} lado={ladoLivre(plano)}>
      <TextoFalado d={d} x={P} y={P + 6} t={t} peso={800} />
    </Cartao>
  );
};

// ——— destaque: a virada ———
export const Destaque: React.FC<{ plano: Plano; m: TDestaque; t: number; zoom?: number }> = ({ plano, m, t }) => {
  const de = Math.max(m.de, fimDaTroca(plano, m.de));
  if (t < de || t >= m.ate) return null;
  const alerta = m.nivel === "alerta";
  const w = LIVRE_W;
  const util = w - P * 2;
  const fonte = { peso: 800 as const, espacamento: -0.025 };
  const fit = encaixar(m.texto, { largura: util, max: 124, min: 56, linhas: 2, fonte });
  const det = m.detalhe ? encaixar(m.detalhe, { largura: util, max: 40, min: 30, linhas: 2, fonte: { peso: 600 } }) : null;
  const lh = Math.round(fit.tamanho * 1.08);
  const hTexto = lh * fit.linhas.length;
  const hDet = det ? Math.round(det.linhas.length * det.tamanho * 1.3) + 18 : 0;
  const h = Math.round(P + hTexto + hDet + P - 4);
  const em = Math.max(de, m.em - 0.08);
  const e = prog(t, em, 0.3);
  const marca = prog(t, m.em + 0.05, 0.5);
  const eDet = m.detalhe ? prog(t, m.detalheEm ?? m.em + 0.5, 0.3) : 0;
  return (
    <Cartao x={xLivre(plano, w)} y={yBaixo(h)} w={w} h={h} t={t} de={de} ate={m.ate} entraSeco={trocaSeca(plano, de)} saiSeco={trocaSeca(plano, m.ate)} lado={ladoLivre(plano)}>
      {fit.linhas.map((l, i) => {
        const wl = larguraTexto(l, fit.tamanho, fonte);
        return (
          <div key={i} style={{ position: "absolute", left: P, top: P - 8 + i * lh, width: wl + 16, height: lh }}>
            <div style={{ position: "absolute", left: -8, top: lh * 0.52, width: (wl + 16) * marca, height: lh * 0.38, borderRadius: 10, background: alerta ? "#FBD9DA" : COR.marcaTexto }} />
            <div style={{ position: "absolute", left: 0, top: 0, fontFamily: FONTE, fontWeight: 800, fontSize: fit.tamanho, lineHeight: `${lh}px`, letterSpacing: "-0.025em", color: alerta ? COR.alerta : COR.tinta, whiteSpace: "nowrap", opacity: e, transform: e >= 1 ? undefined : `translateY(${(1 - e) * 12}px)` }}>
              {l}
            </div>
          </div>
        );
      })}
      {det ? (
        <div style={{ position: "absolute", left: P, top: P - 8 + hTexto + 16, opacity: eDet, transform: eDet >= 1 ? undefined : `translateY(${(1 - eDet) * 10}px)` }}>
          {det.linhas.map((l, i) => (
            <div key={i} style={{ fontFamily: FONTE, fontWeight: 600, fontSize: det.tamanho, lineHeight: 1.3, color: COR.apoio, whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </Cartao>
  );
};

// ——— frase: a citação ———
export const Frase: React.FC<{ plano: Plano; m: TFrase; t: number }> = ({ plano, m, t }) => {
  const de = Math.max(m.de, fimDaTroca(plano, m.de));
  if (t < de || t >= m.ate) return null;
  const w = LIVRE_W;
  const d = disporTexto(m.texto, { largura: w - P * 2, max: 76, min: 42, linhas: 4, peso: 700, espacamento: -0.015, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque, risco: m.risco, entrelinha: 1.18 });
  const h = Math.round(d.altura + P * 2 + 70);
  const e = prog(t, de + 0.1, 0.35);
  return (
    <Cartao x={xLivre(plano, w)} y={yBaixo(h)} w={w} h={h} t={t} de={de} ate={m.ate} entraSeco={trocaSeca(plano, de)} saiSeco={trocaSeca(plano, m.ate)} lado={ladoLivre(plano)}>
      <div style={{ position: "absolute", left: P - 4, top: P - 30, fontFamily: FONTE, fontWeight: 800, fontSize: 120, lineHeight: 1, color: COR.violeta, opacity: e }}>“</div>
      <TextoFalado d={d} x={P} y={P + 62} t={t} peso={700} riscoEm={m.riscoEm} />
    </Cartao>
  );
};

// ——— cta: o fechamento ———
export const Cta: React.FC<{ plano: Plano; m: TCta; t: number }> = ({ plano, m, t }) => {
  const de = Math.max(m.de, fimDaTroca(plano, m.de));
  if (t < de || t >= m.ate) return null;
  const q = 104;
  const w = LIVRE_W;
  const d = disporTexto(m.texto, { largura: w - P * 2 - q - 28, max: 64, min: 36, linhas: 3, peso: 800, espacamento: -0.02, fala: plano.palavras, de: m.em ?? m.de, ate: m.ate, destaque: m.destaque });
  const h = Math.round(Math.max(q, d.altura) + P * 2);
  const pulso = 1 + 0.035 * Math.sin(Math.max(0, t - m.de) * 4);
  return (
    <Cartao x={xLivre(plano, w)} y={yBaixo(h)} w={w} h={h} t={t} de={de} ate={m.ate} entraSeco={trocaSeca(plano, de)} saiSeco={trocaSeca(plano, m.ate)} lado={ladoLivre(plano)}>
      <div style={{ position: "absolute", left: P, top: (h - q) / 2, transform: `scale(${pulso})` }}>
        <Selo tamanho={q}>
          <Icone nome={m.icone ?? "salvar"} tamanho={54} />
        </Selo>
      </div>
      <TextoFalado d={d} x={P + q + 28} y={(h - d.altura) / 2} t={t} peso={800} />
    </Cartao>
  );
};
