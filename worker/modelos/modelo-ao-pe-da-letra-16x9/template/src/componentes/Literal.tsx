import { prog, temposDasPalavras, troca, usePalavras, useRotulos } from "../anim";
import { PAINEL } from "../layout";
import { encaixar, largura as medir } from "../medida";
import { Foto, imagemDoPlano, Recorte, temImagem } from "../motor/imagem";
import type { Lado, Literal as TLiteral, Plano } from "../plano";
import { cor, digitada, sans } from "../tema";
import { TextoFalado, Traco } from "./Ponto";

// A assinatura do Ao Pé da Letra: duas imagens lado a lado, "AO PÉ DA LETRA" (carimbada com NÃO)
// e "O QUE QUER DIZER". A expressão original é digitada no alto, e o humor vem do contraste
// entre as duas imagens. No quadro deitado (16:9) ela ocupa o QUADRO da esquerda (1120 × 808) e a
// pessoa está na moldura da direita, como manda a aula 9 do curso. As fichas ficam mais largas e
// mais baixas que no vertical (a imagem é deitada), com a mesma ordem de dentro: rótulo, imagem,
// texto e detalhe.

// a faixa de correio aéreo (vermelho, creme e azul na diagonal): a borda do estilo
export const Faixa: React.FC<{ style?: React.CSSProperties; altura?: number }> = ({ style, altura = 14 }) => (
  <div
    style={{
      height: altura,
      backgroundImage: `repeating-linear-gradient(135deg, ${cor.carimbo} 0 20px, ${cor.papel} 20px 32px, ${cor.azul} 32px 52px, ${cor.papel} 52px 64px)`,
      ...style,
    }}
  />
);

// medidas das fichas no quadro deitado (px)
const GAP = 36;
const W = (PAINEL.w - GAP) / 2;
const PAD = 22;
const TOPO_CARTOES = 172;
const ALTURA = PAINEL.h - TOPO_CARTOES;
const IMG_H = 304;
const INTERNA = W - PAD * 2;
// o texto da ficha (2 linhas, de 34 a 56 px) e a área reservada para ele
const TEXTO_MAX = 56;
const TEXTO_MIN = 34;
const AREA_TEXTO = 140;
// o adesivo (objeto com fundo transparente) dentro da imagem
const ADESIVO = 260;

const Chip: React.FC<{ texto: string; fundo: string; cortexto: string }> = ({ texto, fundo, cortexto }) => (
  <div
    style={{
      display: "inline-block",
      padding: "10px 20px 12px",
      borderRadius: 14,
      background: fundo,
      color: cortexto,
      fontFamily: sans,
      fontWeight: 800,
      fontSize: 27,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}
  >
    {texto}
  </div>
);

const Imagem: React.FC<{ lado: Lado; plano: Plano; t: number; apagar?: number }> = ({ lado, plano, t, apagar = 0 }) => {
  const img = imagemDoPlano(plano, lado.imagem);
  const filtro = `saturate(${1.04 - 0.55 * apagar}) contrast(1.03) brightness(${1 - 0.06 * apagar})`;
  const caixa: React.CSSProperties = { position: "relative", width: INTERNA, height: IMG_H, borderRadius: 22, overflow: "hidden", background: cor.papel2 };
  if (temImagem(img) && img.transparente) {
    return (
      <div style={{ ...caixa, background: `radial-gradient(circle at 50% 45%, #FFFFFF 0%, ${cor.papel2} 78%)`, filter: filtro }}>
        <Recorte imagem={img} t={t} de={lado.em} largura={ADESIVO} entrada="salto" flutuar style={{ position: "absolute", left: (INTERNA - ADESIVO) / 2, top: (IMG_H - ADESIVO) / 2 + 6 }} />
      </div>
    );
  }
  if (!temImagem(img)) {
    // sem imagem boa: cartão tipográfico com a própria expressão, nunca um buraco
    return (
      <div style={{ ...caixa, display: "flex", alignItems: "center", justifyContent: "center", padding: 30, boxSizing: "border-box", background: cor.azul }}>
        <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 52, lineHeight: 1.1, color: cor.tinta, textAlign: "center" }}>{lado.texto}</div>
      </div>
    );
  }
  return (
    <div style={{ ...caixa, filter: filtro }}>
      <Foto imagem={img} foco={lado.imagem?.foco} t={t} de={lado.em - 0.05} antes={0.4} entrada="revelar" durEntrada={0.35} efeito={lado.imagem?.efeito ?? "aproximar"} intensidade={0.12} largura={INTERNA} altura={IMG_H} />
    </div>
  );
};

// o texto digitado, letra por letra, com o cursor piscando
const Digitada: React.FC<{ texto: string; em: number; t: number; largura: number }> = ({ texto, em, t, largura }) => {
  const { tamanho } = encaixar(`“${texto}”`, largura - 30, 80, 46, 1, { peso: 700, familia: digitada });
  const letras = [...texto];
  const dur = Math.max(0.5, Math.min(1.3, letras.length / 16));
  const n = Math.round(letras.length * prog(t, em, dur, (x) => x));
  const acabou = n >= letras.length;
  const cursor = Math.floor(t * 2.4) % 2 === 0 || !acabou;
  const entra = prog(t, em - 0.1, 0.2);
  return (
    <div style={{ fontFamily: digitada, fontWeight: 700, fontSize: tamanho, lineHeight: 1.1, color: cor.tinta, whiteSpace: "pre", opacity: entra, minHeight: tamanho * 1.1 }}>
      <span style={{ color: cor.lilas }}>“</span>
      {letras.slice(0, n).join("")}
      <span style={{ color: cor.lilas, opacity: acabou ? 1 : 0 }}>”</span>
      <span style={{ display: "inline-block", width: tamanho * 0.1, height: tamanho * 0.9, marginLeft: 6, verticalAlign: "-0.1em", background: cor.coral, opacity: cursor ? 1 : 0 }} />
    </div>
  );
};

type CartaoProps = {
  lado: Lado;
  rotulo: string;
  ao?: boolean;
  plano: Plano;
  t: number;
  limite: number;
  gira: number;
  entra: number;
  // 0 = limpo, 1 = apagado (depois do carimbo)
  apagar?: number;
  children?: React.ReactNode;
};

const Cartao: React.FC<CartaoProps> = ({ lado, rotulo, ao, plano, t, limite, gira, entra, apagar = 0, children }) => {
  const cheio = entra > 0;
  const certo = !!lado.certo && prog(t, lado.em + 0.9, 0.4) > 0;
  const largCaption = INTERNA;
  const cT = ao ? cor.azul : cor.tintaPapel;
  // o traço do certo vai logo embaixo da última linha do texto
  const ajuste = encaixar(lado.texto, largCaption, TEXTO_MAX, TEXTO_MIN, 2, { peso: 800 });
  const yTraco = ajuste.linhas.length * ajuste.tamanho * 1.14 + ajuste.tamanho * 0.18 - 2;
  const lTraco = Math.max(...ajuste.linhas.map((l) => medir(l.join(" "), ajuste.tamanho, { peso: 800 })));
  // o detalhe fica numa linha só, no rodapé da ficha: encolhe (de 32 a 24 px) para caber
  const tamDetalhe = lado.detalhe ? encaixar(lado.detalhe, INTERNA, 32, 24, 1, { peso: 700 }).tamanho : 32;
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: ALTURA,
        boxSizing: "border-box",
        borderRadius: 34,
        padding: PAD,
        background: cor.papel,
        boxShadow: `0 24px 44px rgba(60,10,6,0.35)${certo ? `, 0 0 0 9px ${cor.azul}` : ""}`,
        overflow: "hidden",
        rotate: `${gira}deg`,
      }}
    >
      <Faixa altura={12} style={{ position: "absolute", left: 0, right: 0, top: 0 }} />
      <div style={{ marginTop: 14 }}>
        <Chip texto={rotulo} fundo={ao ? cor.tintaPapel : cor.azul} cortexto={cor.papel} />
      </div>
      <div style={{ marginTop: 18, position: "relative", height: IMG_H }}>
        {cheio ? <Imagem lado={lado} plano={plano} t={t} apagar={apagar} /> : <div style={{ width: INTERNA, height: IMG_H, borderRadius: 22, border: `4px dashed ${cor.apoioPapel}66`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 900, fontSize: 170, color: `${cor.apoioPapel}55` }}>?</div>}
      </div>
      <div style={{ marginTop: 20, position: "relative", height: AREA_TEXTO }}>
        {cheio ? (
          <TextoFalado texto={lado.texto} em={lado.em} t={t} largura={largCaption} maximo={TEXTO_MAX} minimo={TEXTO_MIN} maxLinhas={2} peso={800} semPonto limite={limite} corTexto={cT} />
        ) : null}
        {certo ? <Traco largura={Math.min(largCaption, lTraco)} p={prog(t, lado.em + 0.9, 0.45)} cor={cor.azul} style={{ left: 0, top: yTraco - 6 }} /> : null}
      </div>
      {lado.detalhe ? (
        <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 12, fontFamily: sans, fontWeight: 700, fontSize: tamDetalhe, lineHeight: 1.1, color: cor.apoioPapel, whiteSpace: "nowrap", opacity: prog(t, lado.detalheEm ?? lado.em + 0.8, 0.3) }}>
          {lado.detalhe}
        </div>
      ) : null}
      {children}
    </div>
  );
};

export const Literal: React.FC<{ m: TLiteral; plano: Plano; t: number }> = ({ m, plano, t }) => {
  const R = useRotulos();
  usePalavras();
  const passos = m.quer;
  // o passo em cena e o giro do cartão ao trocar
  let k = 0;
  passos.forEach((p, i) => {
    if (t >= p.em - 0.05) k = i;
  });
  const atual = passos[k];
  const fimDoPasso = passos[k + 1]?.em ?? m.ate;
  const troco = k > 0 ? prog(t, atual.em - 0.12, 0.4, troca) : 0;
  const giroX = k > 0 && troco < 1 ? Math.abs(1 - 2 * troco) : 1;
  // durante a troca, mostra o conteúdo do passo anterior até a metade
  const mostra = k > 0 && troco < 0.5 ? passos[k - 1] : atual;
  const entraQuer = prog(t, passos[0].em - 0.15, 0.4);
  const entraAo = prog(t, m.ao.em - 0.15, 0.4);
  const tCarimbo = m.carimboEm ?? m.ao.em + 0.95;
  const pC = prog(t, tCarimbo, 0.2, (x) => 1 - Math.pow(1 - x, 4));
  const pTremor = t > tCarimbo + 0.14 && t < tCarimbo + 0.5 ? Math.sin((t - tCarimbo) * 90) * 5 * (1 - (t - tCarimbo - 0.14) / 0.36) : 0;
  const apagar = prog(t, tCarimbo + 0.1, 0.4);
  const rotQuer = mostra.rotulo ?? R.querDizer;
  const yCartao = (e: number) => (1 - e) * 60;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PAINEL.w, height: PAINEL.h }}>
      <div style={{ position: "absolute", left: 0, top: 8, width: PAINEL.w }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 26, letterSpacing: "0.12em", textTransform: "uppercase", color: cor.lilas, marginBottom: 10, opacity: prog(t, m.de, 0.3) }}>{R.expressoes}</div>
        <Digitada texto={m.expressao} em={m.expressaoEm ?? m.de + 0.1} t={t} largura={PAINEL.w} />
      </div>

      <div style={{ position: "absolute", left: 0, top: TOPO_CARTOES, display: "flex", gap: GAP, opacity: prog(t, m.de + 0.12, 0.3) }}>
        <div style={{ translate: `${pTremor}px ${yCartao(entraAo) * 0}px`, opacity: 0.55 + 0.45 * entraAo }}>
          <Cartao lado={m.ao} rotulo={R.ao} ao plano={plano} t={t} limite={passos[0].em} gira={-1.4} entra={entraAo} apagar={apagar * (pC > 0 ? 1 : 0)}>
            {pC > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: 104,
                  top: 196,
                  padding: "0 22px 6px",
                  borderRadius: 16,
                  border: `11px solid ${cor.carimbo}`,
                  background: "rgba(255,245,230,0.9)",
                  color: cor.carimbo,
                  fontFamily: sans,
                  fontWeight: 900,
                  fontSize: 104,
                  lineHeight: 1.05,
                  letterSpacing: "-0.01em",
                  rotate: "-13deg",
                  scale: `${2.3 - 1.3 * pC}`,
                  opacity: Math.min(1, pC * 3),
                  whiteSpace: "nowrap",
                }}
              >
                {R.nao}
              </div>
            ) : null}
          </Cartao>
        </div>
        <div style={{ scale: `${giroX} 1`, opacity: 0.55 + 0.45 * entraQuer, translate: `0 ${yCartao(entraQuer) * 0}px` }}>
          <Cartao lado={mostra} rotulo={rotQuer} plano={plano} t={t} limite={fimDoPasso} gira={1.2} entra={entraQuer} />
        </div>
      </div>
    </div>
  );
};
