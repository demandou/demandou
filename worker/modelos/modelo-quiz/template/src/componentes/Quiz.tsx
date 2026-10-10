// A assinatura do Quiz: o painel de perguntas acima da cabeça.
// - A pergunta grande no alto, montando palavra por palavra na fala.
// - As alternativas numa grade (2×2 com 4; 2×2 com o anel na 4ª casa com 3; lado a lado com 2 ou
//   verdadeiro/falso). Cada cartão entra na LETRA falada, com o selo no canto de fora; o nome e a
//   imagem entram na palavra da alternativa.
// - O anel de contagem no centro da grade, sincronizado com "três… dois… um…".
// - A revelação: a certa acende em verde (selo ✓, um brilho atravessa) e as outras apagam.
// - Com um `fato` logo depois, a certa sobe e vira a faixa da resposta no alto do painel.
import { Img, interpolate, staticFile } from "remotion";
import { entrada, prog, saindo, soco, suave, temposDoTexto } from "../anim";
import { imagemDoPlano, temImagem } from "../motor/imagem";
import type { ImagemNoMomento } from "../motor/imagem";
import type { Fato, Plano, Tique } from "../plano";
import { cor, fonte, PAINEL, RAIO, sombra } from "../tema";
import { Anel, caber, Etiqueta, Icone, type NomeIcone, Selo, Texto } from "./Pecas";

// ——— geometria ———

export type Retangulo = { x: number; y: number; w: number; h: number };
export type Casa = Retangulo & { col: number; lin: number; canto: "tl" | "tr" | "bl" | "br"; livre: [number, number] };
export type Geometria = {
  pergunta: { tamanho: number; linhas: string[]; y: number };
  rotuloY: number;
  casas: Casa[];
  anel: { cx: number; cy: number; d: number };
};

const VAO = 24;
const PAD = 22;
// O voo da resposta (quiz → fato): começa ~0,26 s antes do fato (nunca antes de 0,25 s de revelação)
// e dura VOO; o cartão do fato só aparece depois que a faixa assentou, já no lugar final.
export const VOO = 0.34;
export const inicioDoVoo = (revelaEm: number | undefined, fatoDe: number) => (revelaEm === undefined ? fatoDe : Math.max(revelaEm + 0.25, fatoDe - 0.26));
export const fimDoVoo = (revelaEm: number | undefined, fatoDe: number) => inicioDoVoo(revelaEm, fatoDe) + VOO + 0.02;
export const FAIXA_RESPOSTA: Retangulo = { x: PAINEL.x, y: PAINEL.y + 8, w: PAINEL.w, h: 176 };

export const geometria = (texto: string, n: number, comRotulo: boolean): Geometria => {
  const rotuloY = PAINEL.y;
  const yP = PAINEL.y + (comRotulo ? 62 : 14);
  const { tamanho, linhas } = caber(texto, PAINEL.w, n >= 3 ? 64 : 72, 40, 3);
  const altP = linhas.length * tamanho * 1.14;
  const topo = yP + altP + 30;
  const altGrade = PAINEL.base - topo;
  // a grade fica 12 px para dentro do painel: os selos saem do cartão sem passar da margem de 64 px
  const GX = PAINEL.x + 12;
  const GW = PAINEL.w - 24;
  const w = (GW - VAO) / 2;
  const casas: Casa[] = [];
  let anel = { cx: GX + GW / 2, cy: topo + altGrade / 2, d: 200 };
  if (n <= 2) {
    const h = Math.min(altGrade, 600);
    const y = topo + (altGrade - h) / 2;
    casas.push({ x: GX, y, w, h, col: 0, lin: 0, canto: "tl", livre: [PAD, w - 84] });
    casas.push({ x: GX + w + VAO, y, w, h, col: 1, lin: 0, canto: "tr", livre: [84, w - PAD] });
    anel = { cx: GX + GW / 2, cy: y + h / 2, d: 188 };
  } else {
    const h = (altGrade - VAO) / 2;
    const cantos: Casa["canto"][] = ["tl", "tr", "bl", "br"];
    for (let i = 0; i < Math.min(4, n); i++) {
      const col = i % 2;
      const lin = Math.floor(i / 2);
      // com 4, o anel fica no meio da grade: o conteúdo de cada cartão se afasta do centro
      const livre: [number, number] = n === 4 ? (col === 0 ? [PAD, w - 96] : [96, w - PAD]) : [PAD, w - PAD];
      casas.push({ x: GX + col * (w + VAO), y: topo + lin * (h + VAO), w, h, col, lin, canto: cantos[i], livre });
    }
    if (n === 3) {
      const quarta = { x: GX + w + VAO, y: topo + h + VAO };
      anel = { cx: quarta.x + w / 2, cy: quarta.y + h / 2, d: Math.min(w, h) * 0.8 };
    } else anel = { cx: GX + GW / 2, cy: topo + h + VAO / 2, d: Math.min(212, h * 0.8) };
  }
  return { pergunta: { tamanho, linhas, y: yP }, rotuloY, casas, anel };
};

// ——— o cartão de uma alternativa ———

// o nome dentro do cartão: com imagem, embaixo (700, até 50/60 px, 2 linhas); sem, no meio (800, até 62/78 px, 3 linhas)
export const corpoDoNome = (texto: string, largura: number, comImagem: boolean, grande: boolean, corpoMax = 999) =>
  comImagem
    ? caber(texto, largura, Math.max(28, Math.min(corpoMax, grande ? 60 : 50)), 28, 2, 700)
    : caber(texto, largura, Math.max(30, Math.min(corpoMax, grande ? 78 : 62)), 30, 3, 800);

// o mesmo corpo para todos os nomes de um painel (o menor que cabe em todos)
export const corpoComum = (plano: Plano, itens: { texto: string; imagem?: ImagemNoMomento }[], casas: Casa[], grande: boolean) =>
  Math.min(
    ...itens.slice(0, casas.length).map((o, i) => corpoDoNome(o.texto, casas[i].livre[1] - casas[i].livre[0], temImagem(imagemDoPlano(plano, o.imagem)), grande).tamanho),
  );

export type EstadoCartao = { atual: number; certo: number; apagado: number; brilhoEm?: number };

export const CartaoOpcao: React.FC<{
  t: number;
  plano: Plano;
  casa: Casa;
  em: number;
  textoEm: number;
  texto: string;
  selo: string;
  icone?: NomeIcone;
  imagem?: ImagemNoMomento;
  rotuloTopo?: string;
  estado: EstadoCartao;
  grande?: boolean;
  parado?: boolean;
  // corpo máximo do nome (o painel passa o mesmo para todos os cartões: nomes do mesmo tamanho)
  corpoMax?: number;
}> = ({ t, plano, casa, em, textoEm, texto, selo, icone, imagem, rotuloTopo, estado, grande, parado, corpoMax }) => {
  if (t < em) return null;
  const e = entrada(t, em, { de: 0.82, sobe: 34 });
  const { w, h } = casa;
  const img = imagemDoPlano(plano, imagem);
  const comImagem = temImagem(img);
  const pT = prog(t, textoEm, 0.32);
  const dito = t >= textoEm - 0.02;
  const larguraLivre = casa.livre[1] - casa.livre[0];
  const centroLivre = (casa.livre[0] + casa.livre[1]) / 2;
  const tamSelo = grande ? 78 : 66;
  // texto: embaixo (com imagem) ou no meio (sem imagem)
  const rot = rotuloTopo ? 46 : 0;
  const fit = corpoDoNome(texto, larguraLivre, comImagem, !!grande, corpoMax);
  const altTexto = fit.linhas.length * fit.tamanho * 1.14;
  const yTexto = comImagem ? h - PAD - altTexto - 4 : rot + (h - rot - altTexto) / 2 + 6;
  const caixaImg = comImagem ? { x: casa.livre[0], y: PAD + rot + (casa.lin === 0 || casa.canto === "bl" || casa.canto === "br" ? 0 : 0), w: larguraLivre, h: yTexto - PAD - rot - 12 } : null;
  // estados: atual (borda cobalto), certo (verde), apagado (cinza)
  const fundo = estado.certo > 0 ? interpolate(estado.certo, [0, 1], [0, 1]) : 0;
  const tintaTexto = estado.certo > 0.5 ? cor.cartao : cor.tinta;
  const golpe = estado.certo > 0 && estado.brilhoEm !== undefined ? soco(t, estado.brilhoEm, 0.4) : 0;
  const escala = (1 - 0.04 * estado.apagado) * (1 + 0.05 * golpe);
  const brilho = estado.brilhoEm !== undefined ? prog(t, estado.brilhoEm + 0.08, 0.7, suave) : 0;
  // depois de entrar, o cartão flutua de leve (±3 px), cada um num tempo
  const flutua = parado ? 0 : Math.round(Math.sin((t - em) * 2.2 + casa.col * 1.7 + casa.lin * 0.9) * 3 * prog(t, em + 0.3, 0.8, suave) * 10) / 10;
  const lados = { tl: { left: -12, top: -12 }, tr: { right: -12, top: -12 }, bl: { left: -12, bottom: -12 }, br: { right: -12, bottom: -12 } }[casa.canto];
  return (
    <div
      style={{
        position: "absolute",
        left: casa.x,
        top: casa.y,
        width: w,
        height: h,
        opacity: e.opacity * (1 - 0.62 * estado.apagado),
        transform: [e.transform, flutua ? `translateY(${flutua}px)` : "", escala !== 1 ? `scale(${escala})` : ""].filter(Boolean).join(" ") || undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: RAIO,
          background: cor.cartao,
          boxShadow: sombra,
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: cor.certo, opacity: fundo }} />
        {brilho > 0 && brilho < 1 ? (
          <div
            style={{
              position: "absolute",
              top: -40,
              bottom: -40,
              left: -200 + brilho * (w + 400),
              width: 140,
              transform: "skewX(-18deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))",
            }}
          />
        ) : null}
      </div>
      {/* borda da alternativa que acabou de entrar */}
      <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, border: `5px solid ${cor.acento}`, opacity: estado.atual * (1 - fundo) }} />
      {/* antes do nome: a letra grande e clara no meio do cartão */}
      {!dito || pT < 1 ? (
        <div
          style={{
            position: "absolute",
            left: casa.livre[0],
            width: larguraLivre,
            top: 0,
            height: h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 1 - pT,
          }}
        >
          {icone ? (
            <Icone nome={icone} tamanho={Math.min(h, larguraLivre) * 0.5} cor={cor.acentoClaro} traco={3} />
          ) : (
            <span style={{ fontFamily: fonte, fontWeight: 800, fontSize: Math.min(h * 0.62, 190), color: cor.acentoClaro, lineHeight: 1 }}>{selo}</span>
          )}
        </div>
      ) : null}
      {rotuloTopo && dito ? (
        <div style={{ position: "absolute", left: casa.livre[0], width: larguraLivre, top: PAD + 4, display: "flex", justifyContent: "center", opacity: pT }}>
          <Etiqueta texto={rotuloTopo} tamanho={24} fundo={estado.certo > 0.5 ? cor.cartao : cor.acentoClaro} tinta={estado.certo > 0.5 ? cor.certoEscuro : cor.acentoEscuro} />
        </div>
      ) : null}
      {caixaImg && img?.arquivo && dito ? (
        <div
          style={{
            position: "absolute",
            left: caixaImg.x,
            top: caixaImg.y,
            width: caixaImg.w,
            height: caixaImg.h,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.min(1, pT * 1.6),
            transform: pT >= 1 ? undefined : `scale(${0.72 + 0.28 * pT})`,
          }}
        >
          <Img
            src={staticFile(img.arquivo)}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              filter: estado.apagado > 0 ? `grayscale(${estado.apagado})` : undefined,
              ...(img.transparente === false ? { width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 } : {}),
            }}
          />
        </div>
      ) : null}
      {dito ? (
        <div
          style={{
            position: "absolute",
            left: centroLivre - larguraLivre / 2,
            width: larguraLivre,
            top: yTexto,
            opacity: pT,
            transform: pT >= 1 ? undefined : `translateY(${(1 - pT) * 16}px)`,
          }}
        >
          <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} peso={comImagem ? 700 : 800} cor={tintaTexto} />
        </div>
      ) : null}
      {/* o selo no canto de fora */}
      <div style={{ position: "absolute", ...lados }}>
        <Selo
          texto={selo}
          tamanho={tamSelo}
          icone={estado.certo > 0.5 ? "certo" : icone}
          estado={estado.certo > 0.5 ? "certo" : estado.apagado > 0.5 ? "apagado" : "normal"}
        />
      </div>
    </div>
  );
};

// ——— o painel ———

export type DadosDoPainel = {
  texto: string;
  em: number;
  rotulo?: string;
  modo?: "letras" | "vf";
  opcoes: { texto: string; em: number; textoEm?: number; imagem?: ImagemNoMomento; letra?: string }[];
  contagem?: Tique[];
  relogioEm?: number;
  certa?: number;
  revelaEm?: number;
};

const LETRAS = ["A", "B", "C", "D"];

export const Painel: React.FC<{ t: number; plano: Plano; d: DadosDoPainel; de: number; ate: number; fato?: Fato | null }> = ({ t, plano, d, de, ate, fato }) => {
  const n = Math.max(1, Math.min(4, d.opcoes.length));
  const g = geometria(d.texto, n, !!d.rotulo);
  const fim = fato ? fato.ate : ate;
  if (t < de - 0.05 || t > fim + 0.25) return null;
  const sai = saindo(t, fim, 0.22);
  const tempos = temposDoTexto(d.texto, d.em, plano.palavras, d.opcoes[0]?.em ?? ate);
  const revela = d.revelaEm !== undefined && d.certa !== undefined ? d.revelaEm : undefined;
  const pR = revela !== undefined ? prog(t, revela, 0.3) : 0;
  const inicioAnel = d.contagem?.length ? d.contagem[0].em : d.relogioEm;
  // o cartão "atual" é o último que entrou, até o anel começar
  const entraram = d.opcoes.filter((o) => t >= o.em).length;
  const fimDoAtual = inicioAnel ?? revela ?? ate;
  // com um fato logo depois: as erradas saem, a pergunta some e a certa sobe para a faixa da resposta
  const voo = fato ? inicioDoVoo(revela, fato.de) : 0;
  const pF = fato ? prog(t, voo, VOO, suave) : 0;
  const saiPergunta = fato ? prog(t, voo, 0.2) : 0;
  const pTopo = prog(t, d.em - 0.05, 0.3);
  const corpo = corpoComum(plano, d.opcoes, g.casas, n <= 2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, transform: sai > 0 ? `scale(${1 - 0.03 * sai})` : undefined }}>
      {saiPergunta < 1 ? (
        <div style={{ position: "absolute", left: PAINEL.x, top: 0, width: PAINEL.w, height: 1, opacity: 1 - saiPergunta }}>
          {d.rotulo ? (
            <div style={{ position: "absolute", left: 0, width: PAINEL.w, top: g.rotuloY, display: "flex", justifyContent: "center", opacity: pTopo }}>
              <Etiqueta texto={d.rotulo} />
            </div>
          ) : (
            <div style={{ position: "absolute", left: PAINEL.w / 2 - 44 * pTopo, top: g.pergunta.y - 22, width: 88 * pTopo, height: 8, borderRadius: 4, background: cor.acento }} />
          )}
          <div style={{ position: "absolute", left: 0, width: PAINEL.w, top: g.pergunta.y }}>
            <Texto t={t} linhas={g.pergunta.linhas} tamanho={g.pergunta.tamanho} tempos={tempos} />
          </div>
        </div>
      ) : null}
      {d.opcoes.slice(0, 4).map((o, i) => {
        const casa = g.casas[i];
        if (!casa) return null;
        const certa = revela !== undefined && i === d.certa;
        const errada = revela !== undefined && i !== d.certa;
        const atual = i === entraram - 1 && t < fimDoAtual ? 1 - prog(t, (d.opcoes[i + 1]?.em ?? fimDoAtual) - 0.05, 0.15) : 0;
        const estado: EstadoCartao = { atual, certo: certa ? pR : 0, apagado: errada ? pR : 0, brilhoEm: certa ? revela : undefined };
        const vf = d.modo === "vf";
        const selo = o.letra ?? (vf ? "" : LETRAS[i]);
        const icone: NomeIcone | undefined = vf ? (i === 0 ? "certo" : "errado") : undefined;
        // com fato: as erradas somem e a certa voa até a faixa da resposta
        if (fato && errada) {
          const s = prog(t, voo, 0.2);
          if (s >= 1) return null;
          return (
            <div key={i} style={{ opacity: 1 - s }}>
              <CartaoOpcao t={t} plano={plano} casa={casa} em={o.em} textoEm={o.textoEm ?? o.em} texto={o.texto} selo={selo} icone={icone} imagem={o.imagem} estado={estado} grande={n <= 2} corpoMax={corpo} />
            </div>
          );
        }
        if (fato && certa && pF > 0) {
          return <FaixaDaResposta key={i} t={t} plano={plano} casa={casa} p={pF} texto={o.texto} selo={selo} imagem={o.imagem} grande={n <= 2} corpoMax={corpo} />;
        }
        return (
          <CartaoOpcao key={i} t={t} plano={plano} casa={casa} em={o.em} textoEm={o.textoEm ?? o.em} texto={o.texto} selo={selo} icone={icone} imagem={o.imagem} estado={estado} grande={n <= 2} corpoMax={corpo} />
        );
      })}
      {revela !== undefined ? <Anel t={t} cx={g.anel.cx} cy={g.anel.cy} d={g.anel.d} contagem={d.contagem} relogioEm={d.relogioEm} revelaEm={revela} /> : null}
    </div>
  );
};

// A resposta certa vira a faixa verde do alto do painel (de cartão da grade → faixa larga).
const FaixaDaResposta: React.FC<{ t: number; plano: Plano; casa: Casa; p: number; texto: string; selo: string; imagem?: ImagemNoMomento; grande?: boolean; corpoMax?: number }> = ({
  t,
  plano,
  casa,
  p,
  texto,
  selo,
  imagem,
  grande,
  corpoMax,
}) => {
  const f = FAIXA_RESPOSTA;
  const r = { x: interpolate(p, [0, 1], [casa.x, f.x]), y: interpolate(p, [0, 1], [casa.y, f.y]), w: interpolate(p, [0, 1], [casa.w, f.w]), h: interpolate(p, [0, 1], [casa.h, f.h]) };
  const img = imagemDoPlano(plano, imagem);
  const comImagem = temImagem(img);
  const vVertical = 1 - prog(p, 0, 0.4, (x) => x);
  const vHorizontal = prog(p, 0.45, 0.55, (x) => x);
  const xTexto = comImagem ? 300 : 140;
  const fit = caber(texto, f.w - xTexto - 40, 76, 40, 2, 800);
  const altT = fit.linhas.length * fit.tamanho * 1.14;
  // a faixa respira devagar enquanto o fato é contado
  const respira = p >= 1 ? 1 + 0.008 * Math.sin(t * 3.2) : 1;
  return (
    <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, transform: respira !== 1 ? `scale(${respira})` : undefined }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: RAIO, background: cor.certo, boxShadow: sombra }} />
      {vVertical > 0 ? (
        <div style={{ position: "absolute", left: -r.x, top: -r.y, width: 1080, height: 1, opacity: vVertical }}>
          <CartaoOpcao
            t={t}
            plano={plano}
            casa={{ ...casa, x: r.x, y: r.y, w: r.w, h: r.h, livre: [PAD, r.w - PAD] }}
            em={-10}
            textoEm={-10}
            texto={texto}
            selo={selo}
            imagem={imagem}
            estado={{ atual: 0, certo: 1, apagado: 0 }}
            grande={grande}
            parado
            corpoMax={corpoMax}
          />
        </div>
      ) : null}
      {vHorizontal > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: f.w, height: f.h, opacity: vHorizontal }}>
          <div style={{ position: "absolute", left: 30, top: (f.h - 88) / 2 }}>
            <Selo texto={selo} tamanho={88} icone="certo" estado="certo" />
          </div>
          {comImagem && img?.arquivo ? (
            <div style={{ position: "absolute", left: 136, top: 12, width: 150, height: f.h - 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Img src={staticFile(img.arquivo)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ) : null}
          <div style={{ position: "absolute", left: xTexto, top: (f.h - altT) / 2, width: f.w - xTexto - 40 }}>
            <Texto t={t} linhas={fit.linhas} tamanho={fit.tamanho} cor={cor.cartao} alinhar="left" />
          </div>
        </div>
      ) : null}
    </div>
  );
};
