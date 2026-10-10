// A assinatura do Ranking: o placar do N ao 1.
//  - <Placar>  (camada de baixo, atrás da pessoa): título, casas, número que bate, foco de luz do 1º lugar.
//  - <FotosDoRanking> (camada de cima): a foto que toma a tela ~1 s e voa para a casa dela.
// Cada posição passa por: o número bate (em) → a foto ocupa a tela (textoEm) → voa e assenta na casa.
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { prog, rapido, salto } from "../anim";
import { PLACAR } from "../layout";
import { encaixar } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { ItemDoRanking, Plano, Ranking as TRanking } from "../plano";
import { cor, fonte, sombraCartao, sombraDura } from "../tema";
import { saidaDoTopo } from "./Topo";
import { Icone } from "./Icones";

const suave = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ——— tempos ———

export const BATE = 0.5; // o número bate e voa para a aba da casa
export const VOO = 0.35; // a foto voa até a casa

export type TemposItem = { item: ItemDoRanking; em: number; fotoDe: number; voaDe: number; voaAte: number; ultimo: boolean };

// Todos os itens do mesmo placar (momentos `ranking` com o mesmo título), com os tempos já encaixados:
// uma foto nunca começa antes de o número assentar nem invade a seguinte.
export const itensDoPlacar = (plano: Plano, m: TRanking): TemposItem[] => {
  const irmaos = plano.momentos.filter((x): x is TRanking => x.tipo === "ranking" && (x.titulo ?? "") === (m.titulo ?? ""));
  const itens = irmaos.flatMap((x) => x.itens.map((it) => ({ it, tela: x.tela ?? 1 }))).sort((a, b) => a.it.em - b.it.em);
  return itens.map(({ it, tela }, k) => {
    const prox = itens[k + 1];
    const fotoDe = Math.max(it.textoEm ?? it.em + BATE, it.em + BATE);
    const base = clamp(tela, 0.5, 1.5) * (it.posicao === 1 ? 1.3 : 1);
    let dur = base;
    if (prox) dur = Math.min(base, Math.max(0.4, prox.it.em - 0.1 - VOO - fotoDe));
    const voaDe = fotoDe + dur;
    return { item: it, em: it.em, fotoDe, voaDe, voaAte: voaDe + VOO, ultimo: k === itens.length - 1 };
  });
};

// ——— geometria ———

export const geometria = (n: number, comTitulo: boolean) => {
  const y0 = PLACAR.y + (comTitulo ? 84 : 0);
  const gap = 12;
  const rh = Math.max(76, Math.min(140, Math.floor((PLACAR.base - y0 - (n - 1) * gap) / n)));
  const tabW = Math.round(rh * 0.96);
  return { y0, gap, rh, tabW, bodyX: PLACAR.x + tabW + 8, bodyW: PLACAR.w - tabW - 8 };
};
type Geo = ReturnType<typeof geometria>;
const yDaCasa = (g: Geo, posicao: number) => g.y0 + (posicao - 1) * (g.rh + g.gap);

const totalDe = (plano: Plano, m: TRanking) => {
  const irmaos = plano.momentos.filter((x): x is TRanking => x.tipo === "ranking" && (x.titulo ?? "") === (m.titulo ?? ""));
  return Math.max(m.total ?? 0, ...irmaos.flatMap((x) => [x.total ?? 0, ...x.itens.map((i) => i.posicao)]), 2);
};

// o retângulo da foto na casa dela: miniatura quadrada à direita (foto) ou o corpo todo (cartão)
const retanguloDaCasa = (g: Geo, posicao: number, comFoto: boolean) => {
  const y = yDaCasa(g, posicao);
  if (comFoto) {
    const s = g.rh - 16;
    return { x: PLACAR.x + PLACAR.w - s - 8, y: y + 8, w: s, h: s, raio: 16 };
  }
  return { x: g.bodyX, y, w: g.bodyW, h: g.rh, raio: 24 };
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const misturar = (a: string, b: string, p: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const q = clamp(p, 0, 1);
  return `rgb(${Math.round(r1 + (r2 - r1) * q)},${Math.round(g1 + (g2 - g1) * q)},${Math.round(b1 + (b2 - b1) * q)})`;
};

const semFoto = (plano: Plano, it: ItemDoRanking) => !temImagem(imagemDoPlano(plano, it.imagem));

const F9 = { peso: 900 as const, caixaAlta: true };

// ——— a camada de baixo: o placar ———

export const Placar: React.FC<{ m: TRanking; t: number; plano: Plano; t0: number; saiCruzando: boolean }> = ({ m, t, plano, t0, saiCruzando }) => {
  const n = totalDe(plano, m);
  const g = geometria(n, !!m.titulo);
  const tempos = itensDoPlacar(plano, m);
  const segredo = m.segredo !== false;
  const primeiro = plano.momentos.filter((x): x is TRanking => x.tipo === "ranking" && (x.titulo ?? "") === (m.titulo ?? "")).sort((a, b) => a.de - b.de)[0] === m;
  const tNum = Math.max(t0, m.de);
  const doPosto = (p: number) => tempos.find((x) => x.item.posicao === p);
  const reveal = tempos.find((x) => x.item.posicao === 1);
  const luz = reveal ? clamp(Math.min(prog(t, reveal.em, 0.25), 1 - prog(t, reveal.em + 1.2, 0.5)), 0, 1) : 0;

  const casa = (p: number) => {
    const info = doPosto(p);
    const y = yDaCasa(g, p);
    const idx = p - 1;
    const entra = primeiro ? prog(t, tNum + 0.04 * idx, 0.34, rapido) : 1;
    const secreta = segredo && p === 1 && !!reveal && t < reveal.em;
    const bateu = info ? t >= info.em : false;
    const pousou = info ? t >= info.voaAte : false;
    const vez = bateu && !pousou;
    // aba: vazia → limão (a vez) → azul (assentada); o 1º lugar fica limão
    const chegada = info ? prog(t, info.em + BATE - 0.1, 0.18, salto) : 0;
    const assenta = info ? prog(t, info.voaAte + 0.3, 0.4) : 0;
    const vencedor = p === 1 && !!info;
    const tabBg = secreta ? cor.placaSolida : !bateu ? cor.vazio : vencedor ? cor.alerta : misturar(cor.alerta, cor.tarja, assenta);
    const tabTxt = secreta ? cor.alerta : !bateu ? cor.apagado : vencedor || assenta < 0.5 ? cor.tintaEscura : cor.tinta;
    const tabEscala = info && bateu && t < info.em + BATE + 0.3 ? 1 + 0.22 * (1 - prog(t, info.em + BATE - 0.1, 0.3, rapido)) : 1;
    const pulsoBobo = secreta ? Math.sin(t * 5 + p) * 3 : 0;
    const fotoRet = info ? retanguloDaCasa(g, p, !semFoto(plano, info.item)) : null;
    const comFoto = !!info && !semFoto(plano, info.item);
    const img = info ? imagemDoPlano(plano, info.item.imagem) : null;
    const textoLinhas = info
      ? encaixar(info.item.texto, {
          largura: (comFoto ? g.bodyW - (g.rh - 16) - 60 : g.bodyW - 60),
          max: info.item.detalhe ? g.rh * 0.36 : g.rh * 0.44,
          min: 26,
          linhas: 2,
          fonte: { peso: 900, caixaAlta: true },
        })
      : null;
    const tTexto = info ? info.voaDe + 0.18 : 0;
    const pTexto = info ? prog(t, tTexto, 0.3, rapido) : 0;
    const pDetalhe = info?.item.detalhe ? prog(t, info.item.detalheEm ?? info.voaAte + 0.1, 0.3, rapido) : 0;
    const borda = vencedor && pousou ? `6px solid ${cor.alerta}` : vez && !secreta ? `4px solid ${cor.alerta}` : "none";
    return (
      <div
        key={p}
        style={{
          position: "absolute",
          left: PLACAR.x,
          top: y,
          width: PLACAR.w,
          height: g.rh,
          opacity: entra,
          transform: entra >= 1 ? undefined : `translateY(${(1 - entra) * 46}px) scale(${0.96 + 0.04 * entra})`,
        }}
      >
        {/* aba do número */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: g.tabW,
            height: g.rh,
            borderRadius: 24,
            background: tabBg,
            boxShadow: bateu || secreta ? sombraDura("rgba(4,8,60,0.5)", 7) : undefined,
            border: !bateu && !secreta ? `3px dashed ${cor.vazioTraco}` : secreta ? `4px dashed ${cor.alerta}` : "none",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonte,
            fontWeight: 900,
            fontSize: g.rh * 0.66,
            lineHeight: 1,
            color: tabTxt,
            transform: `translateY(${pulsoBobo}px) scale(${tabEscala * (0.4 + 0.6 * (bateu ? Math.max(chegada, 0.0001) : 1))})`,
          }}
        >
          {secreta ? "?" : p}
        </div>
        {/* corpo da casa */}
        <div
          style={{
            position: "absolute",
            left: g.tabW + 8,
            top: 0,
            width: g.bodyW,
            height: g.rh,
            borderRadius: 24,
            boxSizing: "border-box",
            background: secreta
              ? cor.placaSolida
              : !info || !bateu
                ? cor.vazio
                : comFoto
                  ? cor.papel
                  : misturar(cor.alerta, cor.tarja, prog(t, info.voaAte - 0.05, 0.25)),
            border: secreta ? `4px dashed ${cor.alerta}` : !bateu ? `3px dashed ${cor.vazioTraco}` : borda,
            boxShadow: bateu && !secreta && pousou ? sombraDura("rgba(4,8,60,0.5)", 7) : undefined,
            overflow: "hidden",
          }}
        >
          {secreta ? (
            <>
              <div style={{ position: "absolute", left: 34, top: g.rh * 0.3, width: g.bodyW * 0.52, height: g.rh * 0.16, borderRadius: g.rh, background: "rgba(210,244,60,0.22)" }} />
              <div style={{ position: "absolute", left: 34, top: g.rh * 0.56, width: g.bodyW * 0.3, height: g.rh * 0.12, borderRadius: g.rh, background: "rgba(210,244,60,0.14)" }} />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  height: g.rh,
                  width: 160,
                  left: ((t * 520) % (g.bodyW + 320)) - 160,
                  background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))",
                  transform: "skewX(-18deg)",
                }}
              />
            </>
          ) : null}
          {info && bateu && !pousou && !secreta ? (
            <div style={{ position: "absolute", left: 40, top: 0, height: g.rh, display: "flex", alignItems: "center", gap: 12, opacity: 0.55 + 0.45 * Math.sin(t * 14) ** 2 }}>
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ width: 14, height: 14, borderRadius: 7, background: cor.tintaEscura, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(t * 9 - k * 1.1)) }} />
              ))}
            </div>
          ) : null}
          {info && textoLinhas && t >= tTexto ? (
            <div
              style={{
                position: "absolute",
                left: comFoto ? 30 : 0,
                top: 0,
                width: comFoto ? g.bodyW - (g.rh - 16) - 40 : g.bodyW,
                height: g.rh,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: comFoto ? "flex-start" : "center",
                fontFamily: fonte,
                opacity: Math.min(1, pTexto * 2.4),
                transform: `translateX(${(1 - pTexto) * -50}px)`,
              }}
            >
              {comFoto ? (
                <>
                  {textoLinhas.linhas.map((l, i) => (
                    <div key={i} style={{ fontWeight: 900, fontSize: textoLinhas.tamanho, lineHeight: 1.04, color: cor.tintaEscura, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {l}
                    </div>
                  ))}
                  {info.item.detalhe ? (
                    <div style={{ marginTop: 4, fontWeight: 700, fontSize: Math.max(26, g.rh * 0.22), color: cor.tintaSuave, whiteSpace: "nowrap", opacity: pDetalhe, transform: `translateY(${(1 - pDetalhe) * 10}px)` }}>
                      {info.item.detalhe}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {textoLinhas.linhas.map((l, i) => (
                    <div key={i} style={{ fontWeight: 900, fontSize: textoLinhas.tamanho, lineHeight: 1.04, color: cor.tinta, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {l}
                    </div>
                  ))}
                  {info.item.detalhe ? (
                    <div style={{ marginTop: 4, fontWeight: 700, fontSize: Math.max(26, g.rh * 0.22), color: cor.suave, whiteSpace: "nowrap", opacity: pDetalhe }}>{info.item.detalhe}</div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </div>
        {/* miniatura assentada (a foto que voou) */}
        {info && comFoto && pousou && fotoRet ? (
          <div
            style={{
              position: "absolute",
              left: fotoRet.x - PLACAR.x,
              top: fotoRet.y - y,
              width: fotoRet.w,
              height: fotoRet.h,
              borderRadius: fotoRet.raio,
              overflow: "hidden",
              boxShadow: "0 5px 0 rgba(4,8,60,0.28)",
            }}
          >
            <Foto imagem={img} de={info.fotoDe} ate={info.voaAte + 30} t={t} largura={fotoRet.w} altura={fotoRet.h} efeito={info.item.imagem?.efeito ?? "aproximar"} intensidade={0.12} entrada="corte" saida="corte" />
          </div>
        ) : null}
      </div>
    );
  };

  // título do placar
  const tituloEm = Math.max(tNum, m.tituloEm ?? m.de);
  const pT = prog(t, tituloEm, 0.34, rapido);
  const tituloTxt = m.titulo ? encaixar(m.titulo, { largura: 640, max: 52, min: 30, linhas: 1, fonte: F9 }) : null;

  const posicoes = Array.from({ length: n }, (_, i) => i + 1);
  const yReveal = yDaCasa(g, 1);
  return (
    <AbsoluteFill style={{ opacity: 1 - saidaDoTopo(t, m.ate, saiCruzando) }}>
      {m.titulo && tituloTxt ? (
        <div style={{ position: "absolute", left: PLACAR.x, top: PLACAR.y, width: PLACAR.w, height: 64, opacity: pT, transform: `translateY(${(1 - pT) * -24}px)` }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 64,
              padding: "0 28px",
              borderRadius: 20,
              background: cor.tarja,
              boxShadow: sombraDura(cor.tarjaBorda, 6),
              display: "flex",
              alignItems: "center",
              fontFamily: fonte,
              fontWeight: 900,
              fontSize: tituloTxt.tamanho,
              color: cor.tinta,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {m.titulo}
          </div>
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: 64,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontFamily: fonte,
              fontWeight: 900,
              fontSize: 40,
              color: cor.alerta,
            }}
          >
            <span>TOP {n}</span>
          </div>
        </div>
      ) : null}

      {posicoes.filter((p) => !(p === 1 && luz > 0)).map(casa)}

      {/* foco de luz do 1º lugar: o placar escurece, a casa fica acesa e um feixe cai sobre ela */}
      {luz > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 900, background: `rgba(5,9,70,${0.62 * luz})` }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 1080,
              height: yReveal + g.rh * 0.5,
              opacity: luz,
              background: "linear-gradient(rgba(210,244,60,0.0), rgba(210,244,60,0.30))",
              clipPath: `polygon(${540 - 150}px 0, ${540 + 150}px 0, ${PLACAR.x + PLACAR.w}px 100%, ${PLACAR.x}px 100%)`,
            }}
          />
          {casa(1)}
        </>
      ) : null}

      {/* o número que bate: um selo limão salta no meio do placar e voa para a aba da casa */}
      {tempos.map((x) => {
        const p = x.item.posicao;
        const fim = x.em + BATE;
        if (t < x.em || t >= fim) return null;
        const yAba = yDaCasa(g, p) + g.rh / 2;
        const xAba = PLACAR.x + g.tabW / 2;
        const cx = 540;
        const cy = (g.y0 + PLACAR.base) / 2;
        const voa = prog(t, x.em + 0.28, 0.22, suave);
        const entrada = prog(t, x.em, 0.16, rapido);
        const tam = interpolate(voa, [0, 1], [330, g.tabW]);
        const e = 2.2 - 1.2 * entrada;
        const sacode = t < x.em + 0.28 ? Math.sin((t - x.em) * 70) * 8 * (1 - entrada) : 0;
        return (
          <div
            key={`b${p}`}
            style={{
              position: "absolute",
              left: interpolate(voa, [0, 1], [cx, xAba]) - tam / 2 + sacode,
              top: interpolate(voa, [0, 1], [cy, yAba]) - tam / 2,
              width: tam,
              height: tam,
              borderRadius: tam * 0.24,
              background: cor.alerta,
              boxShadow: sombraDura(cor.alertaBorda, 10),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonte,
              fontWeight: 900,
              fontSize: tam * 0.72,
              lineHeight: 1,
              color: cor.tintaEscura,
              opacity: Math.min(1, entrada * 4) * (1 - 0.0 * voa),
              transform: `scale(${voa > 0 ? 1 : e}) rotate(${(1 - entrada) * -10}deg)`,
            }}
          >
            {p}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ——— a camada de cima: a foto em tela cheia e o voo ———

export const FotosDoRanking: React.FC<{ m: TRanking; t: number; plano: Plano }> = ({ m, t, plano }) => {
  const n = totalDe(plano, m);
  const g = geometria(n, !!m.titulo);
  const meus = new Set(m.itens);
  const tempos = itensDoPlacar(plano, m).filter((x) => meus.has(x.item));
  return (
    <>
      <Fecho m={m} t={t} />
      {tempos.map((x) => {
        const it = x.item;
        if (t < x.fotoDe - 0.6 || t >= x.voaAte) return null;
        const p = it.posicao;
        const img = imagemDoPlano(plano, it.imagem);
        const comFoto = temImagem(img);
        const alvo = retanguloDaCasa(g, p, comFoto);
        const voo = prog(t, x.voaDe, VOO, suave);
        const entrada = prog(t, x.fotoDe, 0.2, rapido);
        const r = {
          x: interpolate(voo, [0, 1], [0, alvo.x]),
          y: interpolate(voo, [0, 1], [0, alvo.y]),
          w: interpolate(voo, [0, 1], [1080, alvo.w]),
          h: interpolate(voo, [0, 1], [1920, alvo.h]),
          raio: interpolate(voo, [0, 1], [0, alvo.raio]),
        };
        const inclina = Math.sin(voo * Math.PI) * -5;
        const primeiro = p === 1;
        const visivel = t >= x.fotoDe;
        const plaquinha = prog(t, x.fotoDe + 0.08, 0.3, salto);
        const sombraSai = 1 - prog(t, x.voaDe, 0.18);
        const tamNome = encaixar(it.texto, { largura: 880, max: primeiro ? 150 : 128, min: 56, linhas: 2, fonte: F9 });
        const fullNome = encaixar(it.texto, { largura: 860, max: 200, min: 80, linhas: 3, fonte: F9 });
        const rowNome = encaixar(it.texto, { largura: g.bodyW - 60, max: g.rh * 0.44, min: 26, linhas: 2, fonte: F9 });
        const usaFull = voo < 0.5;
        const nomeCartao = usaFull ? fullNome : rowNome;
        return (
          <div
            key={`f${p}`}
            style={{
              position: "absolute",
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              borderRadius: r.raio,
              overflow: "hidden",
              opacity: visivel ? 1 : 0,
              transform: `rotate(${inclina}deg) scale(${voo > 0 ? 1 : 1.07 - 0.07 * entrada})`,
              boxShadow: voo > 0 ? sombraCartao : undefined,
            }}
          >
            {comFoto ? (
              <Foto imagem={img} de={x.fotoDe} ate={x.voaAte + 30} t={t} largura={r.w} altura={r.h} efeito={it.imagem?.efeito ?? "aproximar"} intensidade={0.12} entrada="corte" saida="corte" antes={0.6} />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: misturar(cor.tarja, cor.tarja, 0),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: 760 * (1 - voo),
                  boxSizing: "border-box",
                  fontFamily: fonte,
                  fontWeight: 900,
                  color: cor.tinta,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                {nomeCartao.linhas.map((l, i) => (
                  <div key={i} style={{ fontSize: nomeCartao.tamanho, lineHeight: 1.04, whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            )}
            {/* sombra no alto: a barra de progresso e a aba respiram sobre qualquer foto */}
            {voo < 1 ? <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 300, background: "linear-gradient(rgba(5,9,70,0.5), rgba(5,9,70,0))", opacity: 1 - voo }} /> : null}
            {primeiro && voo < 1 ? <div style={{ position: "absolute", inset: 0, border: `${22 * (1 - voo)}px solid ${cor.alerta}`, boxSizing: "border-box" }} /> : null}
            {/* aba do número e plaquinha com o nome, só na tela cheia */}
            {voo < 0.6 ? (
              <div style={{ position: "absolute", inset: 0, opacity: sombraSai }}>
                <div
                  style={{
                    position: "absolute",
                    left: 56,
                    top: 138,
                    width: 190,
                    height: 190,
                    borderRadius: 44,
                    background: cor.alerta,
                    boxShadow: sombraDura(cor.alertaBorda, 10),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonte,
                    fontWeight: 900,
                    fontSize: 150,
                    lineHeight: 1,
                    color: cor.tintaEscura,
                    transform: `rotate(-4deg) scale(${0.5 + 0.5 * plaquinha})`,
                  }}
                >
                  {p}
                </div>
                {comFoto ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 54,
                      top: 1046,
                      maxWidth: 972,
                      padding: `${tamNome.tamanho * 0.14}px ${tamNome.tamanho * 0.34}px`,
                      borderRadius: tamNome.tamanho * 0.24,
                      background: primeiro ? cor.alerta : cor.papel,
                      boxShadow: sombraDura(primeiro ? cor.alertaBorda : "rgba(4,8,60,0.45)", 10),
                      fontFamily: fonte,
                      fontWeight: 900,
                      fontSize: tamNome.tamanho,
                      lineHeight: 1.06,
                      color: cor.tintaEscura,
                      textTransform: "uppercase",
                      opacity: Math.min(1, plaquinha * 3),
                      transform: `rotate(-2deg) translateX(${(1 - plaquinha) * -160}px)`,
                    }}
                  >
                    {tamNome.linhas.map((l, i) => (
                      <div key={i} style={{ whiteSpace: "nowrap" }}>
                        {l}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};

// instantes em que a foto (ou o cartão) ocupa a tela: a legenda some, o nome grande já fala por ela
export const fotoNaTela = (plano: Plano, t: number) =>
  plano.momentos.some((m) => m.tipo === "ranking" && itensDoPlacar(plano, m).some((x) => t >= x.fotoDe - 0.02 && t < x.voaDe + 0.12));

// fechamento na área da pessoa: a chamada fica embaixo do placar completo
export const Fecho: React.FC<{ m: TRanking; t: number }> = ({ m, t }) => {
  if (!m.fecho) return null;
  const f = m.fecho;
  if (t < f.em) return null;
  const p = prog(t, f.em, 0.3, salto);
  const e = encaixar(f.texto, { largura: 700, max: 58, min: 34, linhas: 1, fonte: F9 });
  return (
    <div style={{ position: "absolute", left: 0, width: 1080, top: 1400, display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, opacity: Math.min(1, p * 3), transform: `scale(${0.7 + 0.3 * Math.min(1, p)})` }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, background: cor.alerta, boxShadow: sombraDura(cor.alertaBorda, 6), display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * Math.sin(t * 6)})` }}>
        <Icone nome="comentar" tamanho={52} cor={cor.tintaEscura} traco={2.4} />
      </div>
      <div style={{ padding: `${e.tamanho * 0.16}px ${e.tamanho * 0.5}px`, borderRadius: e.tamanho * 0.3, background: cor.tarja, boxShadow: sombraDura(cor.tarjaBorda, 8), fontFamily: fonte, fontWeight: 900, fontSize: e.tamanho, lineHeight: 1.08, color: cor.tinta, textTransform: "uppercase", textAlign: "center" }}>
        {e.linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>{l}</div>
        ))}
      </div>
    </div>
  );
};
