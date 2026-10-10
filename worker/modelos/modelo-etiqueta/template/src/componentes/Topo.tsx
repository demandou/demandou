// Peças da metade de cima (a pessoa embaixo): título, definição e pergunta.
import { AbsoluteFill } from "remotion";
import { entradaAdesivo, prog, rapido, salto, temposDoTexto } from "../anim";
import { TOPO } from "../layout";
import { encaixar } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Definicao as TDefinicao, Pergunta as TPergunta, Plano } from "../plano";
import { cor, fonte, sombraCartao, sombraDura } from "../tema";
import { medirTarjado, Tarjado } from "./Tarjado";

export type PropsTopo = { t: number; plano: Plano; t0: number; saiCruzando: boolean };

export const saidaDoTopo = (t: number, ate: number, saiCruzando: boolean) => (saiCruzando ? prog(t, ate, 0.16) : 0);

export const TITULO = { largura: 960, max: 78, min: 44, linhas: 2 };
export const alturaDoTitulo = (texto?: string) => (texto ? medirTarjado(texto, TITULO.largura, TITULO.max, TITULO.min, TITULO.linhas).altura + 20 : 0);

// Título da metade de cima: branco, sem placa, entra no ritmo da fala, com um traço de tarja ao lado.
export const Titulo: React.FC<{ t: number; texto: string; em: number; plano: Plano; ate: number; y?: number }> = ({ t, texto, em, plano, ate, y = TOPO.y }) => {
  const tempos = temposDoTexto(texto, em, plano.palavras, ate);
  const p = prog(t, em, 0.3, rapido);
  return (
    <div style={{ position: "absolute", left: TOPO.x - 18, top: y, width: TOPO.w + 36 }}>
      <div style={{ position: "absolute", left: 18, top: -16, width: 90 * p, height: 10, borderRadius: 5, background: cor.tarja }} />
      <Tarjado t={t} texto={texto} tempos={tempos} largura={TITULO.largura} max={TITULO.max} min={TITULO.min} linhas={TITULO.linhas} placa={null} alinhar="esquerda" />
    </div>
  );
};

export const Definicao: React.FC<PropsTopo & { m: TDefinicao }> = ({ m, t, plano, t0, saiCruzando }) => {
  const img = imagemDoPlano(plano, m.imagem);
  const comImagem = temImagem(img);
  const larguraTermo = comImagem ? 640 : 960;
  const medT = medirTarjado(m.termo, larguraTermo, 124, 58, 2);
  const emT = Math.max(t0, m.em);
  const emS = Math.max(emT + 0.2, m.significadoEm);
  const tempos = m.termo.split(/\s+/).map((_, i) => emT + i * 0.08);
  const pSub = prog(t, emT + 0.15, 0.4, rapido);
  const medS = medirTarjado(m.significado, 900, 50, 30, 4, 800, false);
  // termo e significado centrados na altura livre da metade de cima
  const total = medT.altura + 46 + medS.altura + 52;
  const yTermo = TOPO.y + Math.max(20, (TOPO.base - TOPO.y - total) / 2);
  const ySig = yTermo + medT.altura + 46;
  const pS = prog(t, emS, 0.3, salto);
  const temposS = temposDoTexto(m.significado, emS, plano.palavras, m.ate);
  return (
    <AbsoluteFill style={{ opacity: 1 - saidaDoTopo(t, m.ate, saiCruzando) }}>
      {comImagem ? (
        <div
          style={{
            position: "absolute",
            right: 70,
            top: TOPO.y + 4,
            width: 250,
            height: 250,
            borderRadius: 125,
            overflow: "hidden",
            border: `10px solid ${cor.papel}`,
            boxShadow: sombraCartao,
            ...entradaAdesivo(t, emT, { giro: 4 }),
          }}
        >
          <Foto imagem={img} de={emT} t={t} largura={230} altura={230} intensidade={0.08} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: TOPO.x - 18, top: yTermo }}>
        <Tarjado t={t} texto={m.termo} tempos={tempos} largura={larguraTermo} max={124} min={58} linhas={2} placa={null} alinhar="esquerda" />
        <div style={{ marginLeft: 18, marginTop: 4, width: Math.min(larguraTermo - 40, 520) * pSub, height: 16, borderRadius: 8, background: cor.tarja, boxShadow: sombraDura(cor.tarjaBorda, 5) }} />
      </div>
      {t >= emS ? (
        <div
          style={{
            position: "absolute",
            left: TOPO.x,
            top: ySig,
            width: TOPO.w,
            padding: "26px 30px",
            borderRadius: 28,
            background: cor.papel,
            boxShadow: sombraCartao,
            opacity: Math.min(1, pS * 3),
            transform: pS >= 1 ? "rotate(-1deg)" : `rotate(-1deg) translateY(${(1 - pS) * 40}px)`,
            boxSizing: "border-box",
            height: medS.altura + 52,
          }}
        >
          <Tarjado t={t} texto={m.significado} tempos={temposS} largura={900} max={50} min={30} linhas={4} peso={800} caixaAlta={false} placa={null} corTexto={cor.tintaEscura} alinhar="esquerda" />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const LETRAS = ["A", "B", "C", "D"];

export const Pergunta: React.FC<PropsTopo & { m: TPergunta }> = ({ m, t, plano, t0, saiCruzando }) => {
  const em = Math.max(t0, m.em ?? m.de);
  const tempos = temposDoTexto(m.texto, em, plano.palavras, m.ate);
  const opcoes = m.opcoes ?? [];
  const larguraQ = opcoes.length ? 960 : 760;
  const medQ = medirTarjado(m.texto, larguraQ, 84, 46, 3);
  const yQ = TOPO.y + 6;
  // opções: do fim do texto até a base
  const yO = yQ + medQ.altura + 34;
  const espaco = TOPO.base - yO;
  const n = opcoes.length;
  const alturaOpcao = n ? Math.min(118, (espaco - (n - 1) * 18) / n) : 0;
  const pQ = prog(t, em, 0.3, salto);
  return (
    <AbsoluteFill style={{ opacity: 1 - saidaDoTopo(t, m.ate, saiCruzando) }}>
      <div style={{ position: "absolute", left: TOPO.x - 18, top: yQ }}>
        <Tarjado t={t} texto={m.texto} tempos={tempos} largura={larguraQ} max={84} min={46} linhas={3} placa={null} alinhar="esquerda" />
      </div>
      {n === 0 && t >= em ? (
        <div
          style={{
            position: "absolute",
            right: 70,
            top: yQ + 10,
            width: 190,
            height: 190,
            borderRadius: 40,
            background: cor.tarja,
            boxShadow: sombraDura(cor.tarjaBorda, 9),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonte,
            fontWeight: 800,
            fontSize: 150,
            color: cor.tinta,
            opacity: Math.min(1, pQ * 3),
            transform: `rotate(${8 + 4 * Math.sin(t * 3)}deg) scale(${pQ >= 1 ? 1 : 0.5 + 0.5 * pQ})`,
          }}
        >
          ?
        </div>
      ) : null}
      {opcoes.map((o, k) => {
        if (t < o.em) return null;
        const S = encaixar(o.texto, { largura: 760, max: Math.min(46, alturaOpcao * 0.42), min: 26, linhas: 2, fonte: { peso: 800 } }).tamanho;
        const e = entradaAdesivo(t, o.em, { giro: k % 2 ? 0.8 : -0.8, de: 0.7 });
        // a opção mais recente fica na tarja
        const atual = opcoes.filter((x) => t >= x.em).length - 1 === k;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: TOPO.x,
              top: yO + k * (alturaOpcao + 18),
              width: TOPO.w,
              height: alturaOpcao,
              borderRadius: alturaOpcao / 2,
              background: atual ? cor.tarja : cor.papel,
              boxShadow: atual ? sombraDura(cor.tarjaBorda, 6) : sombraCartao,
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "0 34px 0 14px",
              boxSizing: "border-box",
              opacity: e.opacity,
              transform: e.transform,
            }}
          >
            <div
              style={{
                width: alturaOpcao - 28,
                height: alturaOpcao - 28,
                borderRadius: (alturaOpcao - 28) / 2,
                background: atual ? cor.papel : cor.tarja,
                color: atual ? cor.tarja : cor.tinta,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonte,
                fontWeight: 800,
                fontSize: (alturaOpcao - 28) * 0.55,
              }}
            >
              {LETRAS[k]}
            </div>
            <div style={{ fontFamily: fonte, fontWeight: 800, fontSize: S, lineHeight: 1.12, color: atual ? cor.tinta : cor.tintaEscura }}>{o.texto}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
