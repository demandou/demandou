// A assinatura do Criativo e os efeitos próprios:
//   GANCHO  a manchete numa placa de vidro fumê (inteira no 1º quadro), com foto opcional
//   HEROI   o produto num cartão de vidro claro com espessura, em perspectiva, aproximando
//   PROVA   o benefício com a prova literal: foto no cartão + faixa ✓ + número que conta
//   SELO    o adesivo redondo de oferta que carimba e gira devagar
import { Easing, Img, interpolate, staticFile } from "remotion";
import { formatar, prog, salto, soco, temposDoTexto } from "../anim";
import { Foto, imagemDoPlano, temImagem, type ImagemNoMomento } from "../motor/imagem";
import type { Etiqueta as TEtiqueta, Gancho as TGancho, Heroi as THeroi, NomeIcone, Plano, Prova as TProva, Selo as TSelo } from "../plano";
import { cor, fonte, PALCO_W, PALCO_X, QUADRO, RAIO, SEGURO, type Tons } from "../tema";
import { BlocoIcone, caber, Cartao, Etiqueta, Icone, Marca, Reflexo, Texto } from "./Vidro";

export type Ret = { x: number; y: number; w: number; h: number };
export type FotoAnterior = { imagem: ImagemNoMomento; de: number; ate: number };
// `peito`: a placa está no peito (pessoa em quadro cheio), não no quadro da esquerda; `max` = o maior
// corpo de letra que coube lá (o layout mede antes).
export type PropsPalco = { t: number; plano: Plano; fim: number; palco: Ret; tons: Tons; imediato: boolean; peito?: boolean; max?: number };

const desce = Easing.bezier(0.65, 0, 0.35, 1);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const BORDA = 14; // a moldura de vidro em volta da foto

// Entrada de cartão: sobe de leve, endireita a perspectiva e assenta (um leve passar do ponto).
// `imediato` = o momento começa no 1º quadro do vídeo: já está montado (nada de tela vazia).
const entrada = (t: number, em: number, imediato: boolean, dur = 0.42) => (imediato ? 1 : prog(t, em, dur, salto));

// ——— foto num cartão de vidro (e o encolher da tela cheia para o cartão) ———
export const FotoNoCartao: React.FC<{
  t: number;
  plano: Plano;
  imagem: ImagemNoMomento;
  ret: Ret;
  de: number;
  ate: number;
  telaCheia?: number;
  imediato?: boolean;
  revelar?: number; // instante em que a foto passa por cima da anterior (cortina da direita)
  // a foto que já estava no cartão (prova seguida): fica embaixo até a nova passar por cima
  // (de/ate = os mesmos do cartão anterior, para a aproximação lenta continuar sem salto)
  anterior?: FotoAnterior;
  giro?: [number, number];
  escala?: number;
  children?: React.ReactNode;
}> = ({ t, plano, imagem, ret, de, ate, telaCheia, imediato, revelar, anterior, giro = [0, 0], escala = 1, children }) => {
  const img = imagemDoPlano(plano, imagem);
  // 1 = já no cartão; 0 = cobrindo a tela inteira (o quadro deitado, 1920×1080)
  const pC = telaCheia === undefined ? 1 : prog(t, telaCheia, 0.55, desce);
  const r = {
    x: mix(0, ret.x, pC),
    y: mix(0, ret.y, pC),
    w: mix(QUADRO.w, ret.w, pC),
    h: mix(QUADRO.h, ret.h, pC),
  };
  const raio = mix(0, RAIO, pC);
  const borda = BORDA * pC;
  const w = r.w - 2 * borda;
  const h = r.h - 2 * borda;
  const pE = telaCheia !== undefined || imediato ? 1 : entrada(t, de, false);
  const corte = revelar !== undefined ? 1 - prog(t, revelar, 0.42, desce) : 0;
  const foto = (
    <Foto
      imagem={img}
      de={de - 1}
      ate={ate + 1}
      t={t}
      largura={Math.round(w)}
      altura={Math.round(h)}
      efeito={imagem.efeito ?? "aproximar"}
      intensidade={0.07}
      antes={0}
      style={{ borderRadius: Math.max(0, raio - borda) }}
      cartao={{ fundo: "#1b2236", cor: cor.branco, fonte }}
    />
  );
  if (pC < 1) {
    // ainda grande: sem vidro em volta (a foto é a tela), a moldura aparece ao pousar
    return (
      <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: raio, overflow: "hidden", boxShadow: pC > 0 ? `0 30px 70px rgba(0,0,0,${0.35 * pC})` : undefined }}>
        <div style={{ position: "absolute", left: borda, top: borda }}>{foto}</div>
        {children}
      </div>
    );
  }
  return (
    <Cartao
      x={r.x}
      y={r.y}
      w={r.w}
      h={r.h}
      tipo="claro"
      giro={[giro[0] + (1 - pE) * 10, giro[1]]}
      escala={escala * (0.9 + 0.1 * pE)}
      opacidade={Math.min(1, pE * 2.5)}
    >
      {anterior && corte > 0 ? (
        <div style={{ position: "absolute", left: borda, top: borda, width: w, height: h, borderRadius: RAIO - borda, overflow: "hidden" }}>
          <Foto imagem={imagemDoPlano(plano, anterior.imagem)} de={anterior.de - 1} ate={anterior.ate + 1} t={Math.min(t, anterior.ate + 0.99)} largura={Math.round(w)} altura={Math.round(h)} efeito={anterior.imagem.efeito ?? "aproximar"} intensidade={0.07} antes={0} />
        </div>
      ) : null}
      {corte < 1 ? (
        <div style={{ position: "absolute", left: borda, top: borda, width: w, height: h, borderRadius: RAIO - borda, overflow: "hidden", clipPath: corte > 0 ? `inset(0 0 0 ${corte * 100}%)` : undefined }}>
          {foto}
        </div>
      ) : null}
      {corte > 0 && corte < 1 ? (
        // a borda da cortina: um fio de luz
        <div style={{ position: "absolute", left: borda + corte * w - 3, top: borda, width: 6, height: h, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 18px rgba(255,255,255,0.8)" }} />
      ) : null}
      {children}
      <Reflexo t={t} em={de} w={r.w} h={r.h} forca={0.35} />
    </Cartao>
  );
};

// ——— a placa da manchete (gancho, abertura, frase) ———
export const medirPlaca = (texto: string, largura: number, max = 84) => {
  const { tamanho, linhas } = caber(texto, largura - 2 * 52, max, 50, 3);
  const altura = Math.round(linhas.length * tamanho * 1.12 + 2 * 44);
  return { tamanho, linhas, altura };
};

export const Placa: React.FC<{
  t: number;
  plano: Plano;
  texto: string;
  em: number;
  ate: number;
  destaque?: string;
  risco?: string;
  riscoEm?: number;
  ret: Ret;
  tons: Tons;
  imediato: boolean;
  modo?: "aparece" | "acende";
  max?: number;
  // quando a placa entra (padrão: logo antes da 1ª palavra)
  entra?: number;
}> = ({ t, plano, texto, em, ate, destaque, risco, riscoEm, ret, tons, imediato, modo = "acende", max, entra }) => {
  const m = medirPlaca(texto, ret.w, max);
  const tempos = temposDoTexto(m.linhas.join(" "), em, plano.palavras, ate);
  const p = entrada(t, entra ?? em - 0.12, imediato, 0.36);
  const y = ret.y + (ret.h - m.altura) / 2;
  return (
    <Cartao x={ret.x} y={y} w={ret.w} h={m.altura} tipo="escuro" giro={[(1 - p) * 12, 0]} escala={0.92 + 0.08 * p} opacidade={Math.min(1, p * 2.5)}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 52px" }}>
        <Texto t={t} linhas={m.linhas} tamanho={m.tamanho} tempos={tempos} modo={modo} destaque={destaque} corDestaque={tons.destaque} risco={risco} riscoEm={riscoEm} />
      </div>
    </Cartao>
  );
};

// Adesivo de ícone (gelo, sol…) que salta na palavra e balança devagar.
const Adesivo: React.FC<{ t: number; em: number; icone: NomeIcone; x: number; y: number; d: number; tons: Tons }> = ({ t, em, icone, x, y, d, tons }) => {
  if (t < em - 0.02) return null;
  const p = prog(t, em - 0.02, 0.36, salto);
  const giro = -8 + Math.sin((t - em) * 2.2) * 4;
  return (
    <div
      style={{
        position: "absolute",
        left: x - d / 2,
        top: y - d / 2,
        width: d,
        height: d,
        borderRadius: d / 2,
        background: tons.destaque,
        border: "5px solid rgba(255,255,255,0.95)",
        boxShadow: "0 16px 34px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `rotate(${giro}deg) scale(${0.5 + 0.5 * p})`,
        opacity: Math.min(1, p * 3),
      }}
    >
      <Icone nome={icone} tamanho={d * 0.56} cor={tons.sobreDestaque} traco={2.3} desenho={Math.min(1, prog(t, em + 0.05, 0.5))} />
    </div>
  );
};

// As etiquetas empilham a partir de um canto: `direita` (alinhadas à direita) ou `esquerda`;
// `base` = empilham de baixo para cima a partir dessa altura (em vez de `topo`).
const Etiquetas: React.FC<{ lista?: TEtiqueta[]; t: number; tons: Tons; direita?: number; esquerda?: number; topo?: number; base?: number; imediato?: boolean; de: number }> = ({
  lista,
  t,
  tons,
  direita,
  esquerda,
  topo,
  base,
  imediato,
  de,
}) => (
  <div
    style={{
      position: "absolute",
      ...(esquerda !== undefined ? { left: esquerda } : { right: QUADRO.w - (direita ?? PALCO_X + PALCO_W) }),
      ...(base !== undefined ? { bottom: QUADRO.h - base } : { top: topo ?? 0 }),
      display: "flex",
      flexDirection: "column",
      alignItems: esquerda !== undefined ? "flex-start" : "flex-end",
      gap: 14,
    }}
  >
    {(lista ?? []).map((e, i) => (
      <Etiqueta key={i} e={e} t={t} tons={tons} imediata={imediato && e.em <= de + 0.05} />
    ))}
  </div>
);

// ——— GANCHO ———
export const Gancho: React.FC<PropsPalco & { m: TGancho }> = ({ t, plano, m, fim, palco, tons, imediato, peito, max = 88 }) => {
  const em = m.em ?? m.de;
  const img = m.imagem;
  if (!img) {
    const placa = medirPlaca(m.texto, palco.w, max);
    // no quadro, a placa sobe um pouco (as etiquetas ficam embaixo); no peito, fica no meio da faixa
    const topoPlaca = palco.y + (palco.h - placa.altura) / 2 - (peito ? 0 : 40);
    return (
      <>
        <Placa t={t} plano={plano} texto={m.texto} em={em} ate={fim} destaque={m.destaque} ret={{ ...palco, y: topoPlaca, h: placa.altura }} tons={tons} imediato={imediato} entra={m.de} max={max} />
        {m.icone && m.iconeEm !== undefined ? <Adesivo t={t} em={m.iconeEm} icone={m.icone} x={palco.x + palco.w - 88} y={topoPlaca - 10} d={150} tons={tons} /> : null}
        <Etiquetas lista={m.etiquetas} t={t} tons={tons} direita={palco.x + palco.w - 24} topo={topoPlaca + placa.altura + 28} imediato={imediato} de={m.de} />
      </>
    );
  }
  // com foto: o cartão da foto em cima, a placa da manchete por cima da base dele
  const placa = medirPlaca(m.texto, palco.w - 56, 70);
  const foto: Ret = { x: palco.x, y: palco.y, w: palco.w, h: palco.h - placa.altura + 70 };
  const ePlaca: Ret = { x: palco.x + 28, y: palco.y + palco.h - placa.altura, w: palco.w - 56, h: placa.altura };
  return (
    <>
      <FotoNoCartao t={t} plano={plano} imagem={img} ret={foto} de={m.de} ate={fim} telaCheia={m.telaCheia} imediato={imediato} />
      <Placa t={t} plano={plano} texto={m.texto} em={em} ate={fim} destaque={m.destaque} ret={ePlaca} tons={tons} imediato={imediato} max={70} entra={m.de} />
      {m.icone && m.iconeEm !== undefined ? <Adesivo t={t} em={m.iconeEm} icone={m.icone} x={palco.x + palco.w - 86} y={palco.y + 86} d={140} tons={tons} /> : null}
      <Etiquetas lista={m.etiquetas} t={t} tons={tons} esquerda={palco.x + 36} topo={palco.y + 36} imediato={imediato} de={m.de} />
    </>
  );
};

// ——— HERÓI (assinatura) ———
// O cartão fica embaixo, com folga em cima para o produto passar da borda (profundidade).
// a maior aproximação lenta do cartão e a do produto (o produto vem mais rápido: parece estar na frente)
const Z_CARTAO = 1.045;
const Z_PRODUTO = 1.1;
export const CartaoHeroi: React.FC<{
  t: number;
  plano: Plano;
  imagem?: ImagemNoMomento;
  icone?: NomeIcone;
  em: number;
  fim: number;
  ret: Ret;
  tons: Tons;
  imediato: boolean;
  titulo?: string;
  tituloEm?: number;
  destaque?: string;
  etiquetas?: TEtiqueta[];
  de: number;
}> = ({ t, plano, imagem, icone, em, fim, ret, tons, imediato, titulo, tituloEm, destaque, etiquetas, de }) => {
  const img = imagem ? imagemDoPlano(plano, imagem) : null;
  const transparente = !!img?.transparente && temImagem(img);
  const foto = !transparente && temImagem(img);
  // sem imagem nenhuma: modo ilustrativo (o ícone num bloco de vidro 3D)
  const ilustrativo = !transparente && !foto;
  const folga = transparente ? Math.min(130, ret.h * 0.2) : ilustrativo ? Math.min(70, ret.h * 0.1) : 0;
  const card: Ret = { x: ret.x, y: ret.y + folga, w: ret.w, h: ret.h - folga - 6 };
  const p = entrada(t, em, imediato, 0.5);
  const vida = Math.max(0, t - em);
  // aproximação lenta (o produto vem mais rápido que o cartão: parece estar na frente)
  const zCard = 1 + Math.min(Z_CARTAO - 1, vida * 0.012);
  const zProd = 1 + Math.min(Z_PRODUTO - 1, vida * 0.026);
  const giro: [number, number] = [3 + (1 - p) * 12, -7 + Math.sin(vida * 0.9) * 2.5 + (1 - p) * 10];
  // produto à esquerda (com título) ou no meio (sem título)
  const temTitulo = !!titulo;
  const base = card.y + card.h - 34;
  // No quadro deitado o quadro da esquerda começa no topo seguro (y 72): o produto que salta do
  // cartão, já com as duas aproximações no máximo (ancoradas embaixo), para no topo seguro em vez
  // de sair do quadro. Fica um pouco menor; o salto para fora do cartão continua.
  const fundoDoCartao = card.y + card.h;
  const prodMax = ((fundoDoCartao - SEGURO.topo) / Z_CARTAO - (fundoDoCartao - base)) / Z_PRODUTO;
  const prodH = Math.max(80, Math.min(card.h + folga - 34, prodMax));
  const bloco = Math.min(card.h * 0.74, 330);
  const prodW = ilustrativo ? bloco : foto ? card.w * 0.46 - 36 : img?.largura && img?.altura ? (prodH * img.largura) / img.altura : prodH * 0.4;
  const cx = foto ? card.x + 18 + prodW / 2 : temTitulo ? card.x + Math.max(prodW / 2 + 60, card.w * 0.25) : card.x + card.w / 2;
  const pP = imediato ? 1 : prog(t, em + 0.08, 0.5, salto);
  const tx = temTitulo ? cx + prodW / 2 + 40 : 0;
  const larguraTitulo = card.x + card.w - 44 - tx;
  const mTitulo = temTitulo ? caber(titulo as string, larguraTitulo, 70, 40, 3) : null;
  const temposTitulo = mTitulo ? temposDoTexto(mTitulo.linhas.join(" "), tituloEm ?? em, plano.palavras, fim) : undefined;
  return (
    <div style={{ position: "absolute", inset: 0, transform: `scale(${zCard})`, transformOrigin: `${card.x + card.w / 2}px ${card.y + card.h}px` }}>
      <Cartao x={card.x} y={card.y} w={card.w} h={card.h} tipo="claro" giro={giro} escala={0.9 + 0.1 * p} opacidade={Math.min(1, p * 2.5)} origem="50% 100%">
        {/* chão do vidro: um degradê suave na cor da marca atrás do produto */}
        <div style={{ position: "absolute", left: cx - card.x - card.h * 0.55, top: card.h * 0.12, width: card.h * 1.1, height: card.h * 1.1, borderRadius: "50%", background: `radial-gradient(circle, ${tons.destaque}26 0%, transparent 62%)` }} />
        {foto ? (
          <div style={{ position: "absolute", left: 18, top: 18, width: temTitulo ? prodW : card.w - 36, height: card.h - 36, borderRadius: RAIO - 14, overflow: "hidden" }}>
            <Foto imagem={img} de={em - 1} ate={fim + 1} t={t} largura={Math.round(temTitulo ? prodW : card.w - 36)} altura={Math.round(card.h - 36)} intensidade={0.08} antes={0} />
          </div>
        ) : null}
        {mTitulo ? (
          // com etiquetas (que ficam embaixo à direita), o título sobe para a parte livre do cartão
          <div style={{ position: "absolute", left: tx - card.x, top: 0, width: larguraTitulo, height: card.h - (etiquetas?.length ? etiquetas.length * 76 + 20 : 0), display: "flex", alignItems: "center" }}>
            <Texto t={t} linhas={mTitulo.linhas} tamanho={mTitulo.tamanho} cor={cor.tinta} corDestaque={tons.destaque} alinhar="left" tempos={temposTitulo} modo="acende" destaque={destaque} />
          </div>
        ) : null}
        <Reflexo t={t} em={em} w={card.w} h={card.h} />
      </Cartao>
      {transparente && temImagem(img) ? (
        <>
          {/* sombra de contato no vidro */}
          <div style={{ position: "absolute", left: cx - prodW * 0.55, top: base - 18, width: prodW * 1.1, height: 36, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(11,16,32,0.38), transparent 70%)", opacity: pP }} />
          <Img
            src={staticFile(img.arquivo)}
            style={{
              position: "absolute",
              left: cx - prodW / 2,
              top: base - prodH,
              width: prodW,
              height: prodH,
              transformOrigin: "50% 100%",
              transform: `translateY(${(1 - pP) * 70}px) scale(${zProd * (0.86 + 0.14 * pP)}) rotate(${Math.sin(vida * 0.9) * 1.2}deg)`,
              opacity: Math.min(1, pP * 2.5),
              filter: "drop-shadow(0 22px 26px rgba(11,16,32,0.28))",
            }}
          />
        </>
      ) : null}
      {ilustrativo ? (
        <div style={{ position: "absolute", left: cx - bloco / 2, top: card.y + (card.h - bloco) / 2 - folga * 0.6, transform: `translateY(${Math.sin(vida * 1.6) * 6}px) scale(${zProd})` }}>
          <BlocoIcone icone={icone ?? "estrela"} tamanho={bloco} tons={tons} p={pP} giro={[8, temTitulo ? 16 : -12]} />
        </div>
      ) : null}
      <Etiquetas lista={etiquetas} t={t} tons={tons} direita={card.x + card.w - 30} base={card.y + card.h - 30} imediato={imediato} de={de} />
    </div>
  );
};

export const Heroi: React.FC<PropsPalco & { m: THeroi }> = ({ t, plano, m, fim, palco, tons, imediato }) => (
  <CartaoHeroi
    t={t}
    plano={plano}
    imagem={m.imagem}
    icone={m.icone}
    em={imediato ? m.de : m.em}
    fim={fim}
    ret={palco}
    tons={tons}
    imediato={imediato}
    titulo={m.titulo}
    tituloEm={m.tituloEm}
    destaque={m.destaque}
    etiquetas={m.etiquetas}
    de={m.de}
  />
);

// ——— PROVA (assinatura) ———
// O instante em que a foto de uma prova entra no cartão (o Edicao usa para emendar provas seguidas).
export const inicioDaFoto = (m: TProva, continua: boolean) => (continua ? m.em : Math.min(m.em, m.de + 0.02));
const entradaDoCartao = (t: number, em: number, imediato: boolean) => (imediato ? 1 : prog(t, em, 0.42, salto));

export const Prova: React.FC<PropsPalco & { m: TProva; anterior?: FotoAnterior | null }> = ({ t, plano, m, fim, palco, tons, imediato, anterior }) => {
  const ret: Ret = { x: palco.x, y: palco.y + 6, w: palco.w, h: palco.h - 6 };
  const continua = !!anterior;
  const textoEm = m.textoEm ?? m.em;
  const faixa = caber(m.texto, ret.w - 56 - 2 * 34 - 84, 60, 40, 2);
  const hFaixa = Math.round(faixa.linhas.length * faixa.tamanho * 1.12 + 2 * 30);
  // numa prova seguida, a faixa nova espera a anterior sumir (nada de texto sobre texto)
  const entraFaixa = continua ? Math.max(textoEm - 0.03, m.de + 0.12) : textoEm - 0.03;
  const pF = prog(t, entraFaixa, 0.34, salto);
  const tempos = temposDoTexto(faixa.linhas.join(" "), textoEm, plano.palavras, fim);
  const n = m.numero;
  // modo ilustrativo (sem foto): o ícone num bloco de vidro 3D, num cartão fumê
  const pE = entradaDoCartao(t, Math.min(m.em, m.de + 0.02), imediato);
  const pI = imediato ? 1 : prog(t, m.em, 0.5, salto);
  const hIcone = ret.h - hFaixa - 30;
  return (
    <>
      {m.imagem ? (
        // numa prova seguida, a foto anterior continua no mesmo cartão até a nova passar por cima
        <FotoNoCartao
          t={t}
          plano={plano}
          imagem={m.imagem}
          ret={ret}
          de={inicioDaFoto(m, continua)}
          ate={fim}
          telaCheia={m.telaCheia}
          imediato={imediato || continua}
          revelar={continua ? m.em - 0.02 : undefined}
          anterior={anterior ?? undefined}
        />
      ) : (
        <Cartao x={ret.x} y={ret.y} w={ret.w} h={ret.h} tipo="escuro" giro={[(1 - pE) * 10, 0]} escala={0.9 + 0.1 * pE} opacidade={Math.min(1, pE * 2.5)}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: hIcone, display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${Math.sin(Math.max(0, t - m.em) * 1.6) * 6}px)` }}>
            <BlocoIcone icone={m.icone ?? (m.nivel === "contra" ? "alerta" : "certo")} tamanho={Math.max(120, Math.min(300, hIcone - 90))} tons={tons} p={pI} />
          </div>
        </Cartao>
      )}
      {/* a faixa do benefício */}
      {t >= entraFaixa ? (
        <Cartao
          x={ret.x + 28}
          y={ret.y + ret.h - hFaixa - 30}
          w={ret.w - 56}
          h={hFaixa}
          tipo="escuro"
          raio={28}
          escala={0.9 + 0.1 * pF}
          opacidade={Math.min(1, pF * 3)}
          giro={[(1 - pF) * 14, 0]}
        >
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 26, padding: "0 34px" }}>
            <Marca tamanho={84} tons={tons} tipo={m.nivel === "contra" ? "errado" : "certo"} p={prog(t, textoEm, 0.32)} />
            <Texto t={t} linhas={faixa.linhas} tamanho={faixa.tamanho} tempos={tempos} alinhar="left" />
          </div>
        </Cartao>
      ) : null}
      {n && t >= n.em - 0.02 ? <SeloNumero t={t} n={n} x={ret.x + ret.w - 150} y={ret.y + 150} tons={tons} /> : null}
      <Etiquetas lista={m.etiquetas} t={t} tons={tons} esquerda={ret.x + 36} topo={ret.y + 36} de={m.de} />
    </>
  );
};

// O número da prova: um disco na cor da marca com o anel que enche enquanto o número conta.
const SeloNumero: React.FC<{ t: number; n: NonNullable<TProva["numero"]>; x: number; y: number; tons: Tons }> = ({ t, n, x, y, tons }) => {
  const d = 236;
  const p = prog(t, n.em - 0.02, 0.36, salto);
  // o número BATE já no valor dito, na palavra (nunca um número intermediário na tela);
  // o movimento fica no anel, que enche em 0,6 s, e no soco quando ele fecha
  const conta = interpolate(t, [n.em, n.em + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const texto = `${n.prefixo ?? ""}${formatar(n.valor, n.casas ?? 0)}`;
  const r = d / 2 - 14;
  const circ = 2 * Math.PI * r;
  const golpe = soco(t, n.em + 0.6, 0.3);
  const S = Math.min(96, (d * 0.62) / Math.max(1, texto.length * 0.62));
  return (
    <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, transform: `scale(${(0.5 + 0.5 * p) * (1 + 0.06 * golpe)}) rotate(${(1 - p) * -12}deg)`, opacity: Math.min(1, p * 3) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: d / 2, background: tons.destaque, border: "6px solid rgba(255,255,255,0.95)", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }} />
      <svg width={d} height={d} style={{ position: "absolute", inset: 0 }}>
        <circle cx={d / 2} cy={d / 2} r={r - 10} fill="none" stroke={tons.sobreDestaque} strokeOpacity={0.18} strokeWidth={8} />
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r - 10}
          fill="none"
          stroke={tons.sobreDestaque}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(circ - 20 * Math.PI) * conta} ${circ}`}
          transform={`rotate(-90 ${d / 2} ${d / 2})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: fonte, color: tons.sobreDestaque, lineHeight: 1 }}>
        <span style={{ fontWeight: 800, fontSize: S, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{texto}</span>
        {n.sufixo ? <span style={{ fontWeight: 800, fontSize: 40, marginTop: 4, letterSpacing: "-0.01em" }}>{n.sufixo.trim()}</span> : null}
      </div>
    </div>
  );
};

// ——— SELO ———
export const Selo: React.FC<{ t: number; m: TSelo; x: number; y: number; tons: Tons }> = ({ t, m, x, y, tons }) => {
  if (t < m.em - 0.02) return null;
  const d = 276;
  const p = prog(t, m.em - 0.02, 0.34, salto);
  const vida = t - m.em;
  const { tamanho, linhas } = caber(m.texto.toLocaleUpperCase("pt-BR"), d * 0.68, 50, 26, 2);
  return (
    <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, transform: `rotate(${-9 + (1 - p) * -25}deg) scale(${1.5 - 0.5 * p})`, opacity: Math.min(1, p * 2.5) }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: d / 2, background: tons.destaque, border: "6px solid rgba(255,255,255,0.96)", boxShadow: "0 18px 40px rgba(0,0,0,0.35)" }} />
      {/* o anel tracejado gira devagar: o selo nunca fica parado */}
      <svg width={d} height={d} style={{ position: "absolute", inset: 0, transform: `rotate(${vida * 22}deg)` }}>
        <circle cx={d / 2} cy={d / 2} r={d / 2 - 22} fill="none" stroke={tons.sobreDestaque} strokeOpacity={0.45} strokeWidth={3} strokeDasharray="2 11" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {m.icone ? <Icone nome={m.icone} tamanho={66} cor={tons.sobreDestaque} traco={2.3} desenho={prog(t, m.em + 0.1, 0.5)} /> : null}
        {linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1.02, color: tons.sobreDestaque, letterSpacing: "-0.01em" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
