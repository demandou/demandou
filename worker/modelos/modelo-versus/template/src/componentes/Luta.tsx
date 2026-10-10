// A assinatura do Versus: a luta. Três telas na arena (a metade de cima), sempre com a pessoa embaixo.
//  - VersusTela: as duas imagens se encaram em painéis inclinados, o VS bate no meio.
//  - RodadaTela: o placar no alto, um ícone no meio e uma barra de cada lado que enche com a fala.
//  - VereditoTela: o placar final e os perfis ("pra quem é cada um") indo para o lado que serve a cada um.
import { AbsoluteFill } from "remotion";
import { carimbo, entradaAdesivo, prog, rapido, salto, suave } from "../anim";
import { ARENA, COSTURA } from "../layout";
import { barrasEm, numeroDa, placarEm, quandoVence, rodadaEm, type Duelo } from "../luta";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Lutador, Plano, Rodada, Veredito, Versus } from "../plano";
import { cor, corDoLado, escuroDoLado, fonte, sombraDura } from "../tema";
import { Icone } from "./Icones";
import { caber, estiloFonte, Linhas, Placa } from "./Placa";

const TEXTO_SOBRE = (lado: 0 | 1) => (lado === 0 ? cor.tinta : cor.tintaEscura);

// tremida curta da arena quando algo bate (decai em 0,3 s)
export const tremida = (t: number, em: number, forca = 7) => {
  const d = t - em;
  if (d < 0 || d > 0.32) return { x: 0, y: 0 };
  const k = 1 - d / 0.32;
  return { x: Math.sin(d * 90) * forca * k, y: Math.cos(d * 70) * forca * 0.6 * k };
};

// ——— a imagem (ou o cartão) de um lutador, num painel inclinado ———

const clipA = "polygon(0 0, 100% 0, 86% 100%, 0 100%)";
const clipB = "polygon(14% 0, 100% 0, 100% 100%, 0 100%)";

const Painel: React.FC<{ lado: 0 | 1; l: Lutador; plano: Plano; t: number; w: number; h: number; ate: number }> = ({ lado, l, plano, t, w, h, ate }) => {
  const img = imagemDoPlano(plano, l.imagem);
  const com = temImagem(img);
  const clip = lado === 0 ? clipA : clipB;
  const nome = l.nome;
  // sem imagem: o nome gigante no painel
  const grande = caber(nome, w * 0.74, 150, 56, 3, 900);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* a moldura na cor do canto */}
      <div style={{ position: "absolute", inset: 0, background: corDoLado(lado), clipPath: clip }} />
      <div style={{ position: "absolute", inset: 10, clipPath: clip, overflow: "hidden", background: com ? cor.papel : escuroDoLado(lado) }}>
        {com ? (
          <Foto imagem={img} de={l.em} ate={ate} t={t} largura={w - 20} altura={h - 20} efeito="aproximar" intensidade={0.1} entrada="corte" saida="corte" antes={0.4} />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(${lado === 0 ? 160 : 200}deg, ${corDoLado(lado)}, ${escuroDoLado(lado)})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: lado === 0 ? 0 : w * 0.1,
              paddingRight: lado === 0 ? w * 0.1 : 0,
            }}
          >
            <Linhas linhas={grande.linhas} tamanho={grande.tamanho} peso={900} cor={TEXTO_SOBRE(lado)} />
          </div>
        )}
        {com ? <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h * 0.34, background: "linear-gradient(rgba(0,0,0,0), rgba(10,6,16,0.62))" }} /> : null}
      </div>
    </div>
  );
};

export const VersusTela: React.FC<{ m: Versus; t: number; plano: Plano; fim: number }> = ({ m, t, plano, fim }) => {
  const W = 510;
  const H = 590;
  const yPainel = ARENA.y + 112;
  const [a, b] = m.lados;
  const vsEm = Math.max(a.em, b.em) + 0.12;
  const sacode = tremida(t, vsEm, 9);
  const sai = fim > m.ate + 0.01 ? 0 : prog(t, m.ate - 0.12, 0.12);
  const pa = prog(t, a.em, 0.38, rapido);
  const pb = prog(t, b.em, 0.38, rapido);
  const vs = carimbo(t, vsEm, -6, 0.24);
  // depois do VS os dois respiram (um empurra o outro de leve)
  const empurra = t > vsEm ? 8 * Math.sin(Math.min(1, (t - vsEm) / 0.5) * Math.PI) * (1 - prog(t, vsEm + 0.6, 0.4)) : 0;
  const tituloEm = m.tituloEm ?? m.de;
  const tit = m.titulo ? caber(m.titulo, 920, 62, 38, 2, 900) : null;
  const nomeA = caber(a.nome, 440, 66, 34, 1, 900);
  const nomeB = caber(b.nome, 440, 66, 34, 1, 900);
  const pT = prog(t, tituloEm, 0.3, rapido);
  const nomes = [
    { l: a, lado: 0 as const, x: ARENA.x + 20, p: pa, n: nomeA },
    { l: b, lado: 1 as const, x: ARENA.x + ARENA.w - W - 20, p: pb, n: nomeB },
  ];
  return (
    <AbsoluteFill style={{ opacity: 1 - sai, transform: `translate(${sacode.x}px, ${sacode.y}px)` }}>
      {m.titulo && tit && t >= tituloEm ? (
        <div style={{ position: "absolute", left: 0, top: ARENA.y - 2, width: 1080, display: "flex", justifyContent: "center", opacity: pT, transform: `translateY(${(1 - pT) * -24}px)` }}>
          <Placa fundo={cor.placa} padX={30} padY={8}>
            <Linhas linhas={tit.linhas} tamanho={tit.tamanho} peso={900} cor={cor.tinta} />
          </Placa>
        </div>
      ) : null}
      {nomes.map(({ l, lado, x, p, n }) => {
        if (t < l.em - 0.05) return null;
        const desloca = (1 - p) * (lado === 0 ? -640 : 640) + (lado === 0 ? -1 : 1) * -empurra * 0.0;
        const xx = x + (lado === 0 ? 1 : -1) * empurra;
        return (
          <div key={lado}>
            <div style={{ position: "absolute", left: xx, top: yPainel, width: W, height: H, transform: `translateX(${desloca}px)`, filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.5))" }}>
              <Painel lado={lado} l={l} plano={plano} t={t} w={W} h={H} ate={m.ate} />
            </div>
            {/* o nome, numa placa na cor do canto, por cima da base do painel */}
            {temImagem(imagemDoPlano(plano, l.imagem)) ? (
              <div
                style={{
                  position: "absolute",
                  left: xx + (lado === 0 ? 10 : W - 10 - 440 - 56),
                  top: yPainel + H - 50,
                  width: 500,
                  display: "flex",
                  justifyContent: lado === 0 ? "flex-start" : "flex-end",
                  transform: `translateX(${desloca * 1.25}px)`,
                }}
              >
                <Placa fundo={corDoLado(lado)} padX={26} padY={8} sombra={sombraDura(escuroDoLado(lado), 7)}>
                  <Linhas linhas={n.linhas} tamanho={n.tamanho} peso={900} cor={TEXTO_SOBRE(lado)} />
                </Placa>
              </div>
            ) : null}
          </div>
        );
      })}
      {t >= vsEm ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 105,
            top: yPainel + H / 2 - 105,
            width: 210,
            height: 210,
            borderRadius: 105,
            background: cor.alerta,
            boxShadow: `${sombraDura(cor.alertaBorda, 10)}, 0 0 0 10px ${cor.fundo}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: vs.opacity,
            transform: vs.transform,
          }}
        >
          <span style={{ ...estiloFonte(900, 112), color: cor.tintaEscura, letterSpacing: "-0.02em", marginLeft: -8 }}>VS</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ——— o placar do alto: miniaturas, nomes e pontos ———

const Miniatura: React.FC<{ lado: 0 | 1; l: Lutador; plano: Plano; t: number; tam: number }> = ({ lado, l, plano, t, tam }) => {
  const img = imagemDoPlano(plano, l.imagem);
  const com = temImagem(img);
  return (
    <div style={{ width: tam, height: tam, borderRadius: tam / 2, border: `6px solid ${corDoLado(lado)}`, overflow: "hidden", background: escuroDoLado(lado), position: "relative", boxSizing: "border-box" }}>
      {com ? (
        <Foto imagem={img} de={0} t={t} largura={tam - 12} altura={tam - 12} efeito="parado" entrada="corte" antes={1} />
      ) : (
        <div style={{ ...estiloFonte(900, tam * 0.5), color: TEXTO_SOBRE(lado), width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{l.nome.trim()[0]?.toLocaleUpperCase("pt-BR")}</div>
      )}
    </div>
  );
};

export const PlacarDaLuta: React.FC<{ d: Duelo; t: number; plano: Plano; entra: number }> = ({ d, t, plano, entra }) => {
  const [a, b] = d.versus.lados;
  const [pa, pb] = placarEm(d, t);
  const p = prog(t, entra, 0.3, rapido);
  const pontoA = d.rodadas.filter((r) => r.vencedor === 0).map(quandoVence);
  const pontoB = d.rodadas.filter((r) => r.vencedor === 1).map(quandoVence);
  const batida = (lista: number[]) => {
    const e = [...lista].reverse().find((x) => t >= x);
    return e === undefined ? { transform: undefined as string | undefined } : { transform: `scale(${1 + 0.35 * (1 - prog(t, e, 0.4, rapido))})` };
  };
  const ta = caber(a.nome, 280, 44, 24, 1, 900);
  const tb = caber(b.nome, 280, 44, 24, 1, 900);
  const tam = Math.min(ta.tamanho, tb.tamanho);
  const nA = { ...ta, tamanho: tam };
  const nB = { ...tb, tamanho: tam };
  const casa = (n: number, lado: 0 | 1, sty: { transform: string | undefined }) => (
    <div
      style={{
        width: 84,
        height: 84,
        borderRadius: 14,
        background: corDoLado(lado),
        boxShadow: sombraDura(escuroDoLado(lado), 6),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...estiloFonte(900, 64),
        color: TEXTO_SOBRE(lado),
        transform: sty.transform,
      }}
    >
      {n}
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: ARENA.y - 8, width: 1080, height: 100, opacity: p, transform: `translateY(${(1 - p) * -60}px)` }}>
      <div style={{ position: "absolute", left: 40, top: 0, display: "flex", alignItems: "center", gap: 14 }}>
        <Miniatura lado={0} l={a} plano={plano} t={t} tam={88} />
        <Linhas linhas={nA.linhas} tamanho={nA.tamanho} peso={900} cor={cor.tinta} alinhar="left" />
      </div>
      <div style={{ position: "absolute", left: 540 - 135, top: 6, width: 270, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        {casa(pa, 0, batida(pontoA))}
        <span style={{ ...estiloFonte(900, 54), color: cor.alerta }}>×</span>
        {casa(pb, 1, batida(pontoB))}
      </div>
      <div style={{ position: "absolute", right: 40, top: 0, display: "flex", alignItems: "center", gap: 14, flexDirection: "row-reverse" }}>
        <Miniatura lado={1} l={b} plano={plano} t={t} tam={88} />
        <Linhas linhas={nB.linhas} tamanho={nB.tamanho} peso={900} cor={cor.tinta} alinhar="right" />
      </div>
    </div>
  );
};

// ——— uma rodada: ícone no meio, barra de cada lado ———

const COL = { w: 306, y: 300, h: 470 };
const xCol = (lado: 0 | 1) => (lado === 0 ? 52 : 1080 - 52 - COL.w);

const ImagemDaRodada: React.FC<{ img: NonNullable<ReturnType<typeof imagemDoPlano>>; lado?: 0 | 1; t: number; em: number }> = ({ img, lado, t, em }) => {
  const pImg = prog(t, em, 0.3, salto);
  const encolhe = lado === undefined ? 0 : prog(t, em + 1.0, 0.4, suave);
  const tam = 300 - 170 * encolhe;
  const cx = lado === undefined ? 540 : xCol(lado) + COL.w / 2;
  const cy = lado === undefined ? 430 : COL.y + 200 - (200 - 84) * encolhe;
  const giro = lado === 1 ? 4 : -4;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - tam / 2,
        top: cy - tam / 2,
        width: tam,
        height: tam,
        borderRadius: tam * 0.1 + (tam < 200 ? tam * 0.4 : 0),
        overflow: "hidden",
        border: `${tam < 200 ? 7 : 10}px solid ${cor.papel}`,
        boxSizing: "border-box",
        boxShadow: "0 22px 44px rgba(0,0,0,0.5)",
        opacity: Math.min(1, pImg * 3),
        transform: pImg >= 1 ? `rotate(${giro * (1 - encolhe)}deg)` : `rotate(${giro}deg) scale(${0.5 + 0.5 * pImg})`,
      }}
    >
      <Foto imagem={img} de={em} t={t} largura={tam - 20} altura={tam - 20} efeito="aproximar" intensidade={0.1} entrada="corte" antes={0.4} />
    </div>
  );
};

export const RodadaTela: React.FC<{ r: Rodada; d: Duelo; t: number; plano: Plano; fim: number }> = ({ r, d, t, plano, fim }) => {
  const [a, b] = d.versus.lados;
  const [ba, bb] = barrasEm(d, t);
  const barras = [ba, bb];
  const sai = fim > r.ate + 0.01 ? 0 : prog(t, r.ate - 0.1, 0.1);
  const n = numeroDa(d, r);
  const vence = quandoVence(r);
  const decidida = r.vencedor !== undefined && t >= vence;
  const tit = caber(r.titulo, 330, 62, 34, 2, 900);
  const pI = prog(t, r.em, 0.32, salto);
  const img = imagemDoPlano(plano, r.imagem);
  const emImg = r.imagemEm ?? r.em + 0.5;
  const pImg = prog(t, emImg, 0.3, salto);
  const sacode = tremida(t, vence, 6);
  const lados = [r.a, r.b];
  const nomes = [a.nome, b.nome];
  return (
    <AbsoluteFill style={{ opacity: 1 - sai, transform: `translate(${sacode.x}px, ${sacode.y}px)` }}>
      {/* o meio: número da rodada, ícone grande e o critério */}
      <div style={{ position: "absolute", left: 540 - 165, top: 252, width: 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ opacity: Math.min(1, pI * 3), transform: pI >= 1 ? "rotate(-4deg)" : `rotate(-4deg) scale(${0.6 + 0.4 * pI})`, marginBottom: 20 }}>
          <Placa fundo={cor.alerta} padX={22} padY={4} sombra={sombraDura(cor.alertaBorda, 6)}>
            <span style={{ ...estiloFonte(900, 40), color: cor.tintaEscura }}>RODADA {n}</span>
          </Placa>
        </div>
        <div
          style={{
            width: 214,
            height: 214,
            borderRadius: 107,
            background: cor.papel,
            boxShadow: `${sombraDura("#B5AC9A", 10)}, 0 0 0 8px ${cor.fundo}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: Math.min(1, pI * 3) * (temImagem(img) && !r.imagemLado && t >= emImg ? 0 : 1),
            transform: pI >= 1 ? undefined : `scale(${0.4 + 0.6 * pI})`,
          }}
        >
          {r.icone ? <Icone nome={r.icone} tamanho={128} cor={cor.tintaEscura} traco={8} /> : <span style={{ ...estiloFonte(900, 140), color: cor.tintaEscura }}>{n}</span>}
        </div>
        <div style={{ marginTop: 26, opacity: Math.min(1, pI * 3), transform: pI >= 1 ? "rotate(2deg)" : `rotate(2deg) scale(${0.6 + 0.4 * pI})` }}>
          <Placa fundo={cor.placa} padX={26} padY={8} borda={`3px solid ${cor.linha}`}>
            <Linhas linhas={tit.linhas} tamanho={tit.tamanho} peso={900} cor={cor.tinta} />
          </Placa>
        </div>
      </div>

      {[0, 1].map((k) => {
        const lado = k as 0 | 1;
        const l = lados[k];
        const x = xCol(lado);
        const venceu = decidida && r.vencedor === lado;
        const perdeu = decidida && r.vencedor !== undefined && r.vencedor !== "empate" && r.vencedor !== lado;
        const cheio = barras[k];
        const corBarra = perdeu ? cor.perde : corDoLado(lado);
        const escuro = perdeu ? "#3E3A48" : escuroDoLado(lado);
        const alturaFill = Math.max(0, COL.h * cheio);
        const lbl = l?.texto ? caber(l.texto, COL.w - 40, 46, 28, 2, 800, false) : null;
        const pL = l ? prog(t, l.em, 0.28, salto) : 0;
        const pV = prog(t, vence, 0.26, salto);
        return (
          <div key={k}>
            {/* nome do lado, no alto da barra */}
            <div style={{ position: "absolute", left: x, top: COL.y - 36, width: COL.w, textAlign: "center", ...estiloFonte(900, 30), color: cor.suave, letterSpacing: "0.04em" }}>{nomes[k]}</div>
            {/* a barra: trilho, preenchimento que sobe */}
            <div style={{ position: "absolute", left: x, top: COL.y, width: COL.w, height: COL.h, borderRadius: 26, background: cor.vazio, border: `4px solid ${venceu ? cor.alerta : cor.linha}`, boxSizing: "border-box", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: alturaFill, background: `linear-gradient(0deg, ${escuro}, ${corBarra})`, borderTop: alturaFill > 4 ? `8px solid ${perdeu ? "#7C778A" : cor.papel}` : undefined }} />
              {/* marcas de régua (a barra parece instrumento de medida) */}
              {[0.25, 0.5, 0.75].map((f) => (
                <div key={f} style={{ position: "absolute", left: 0, bottom: COL.h * f, width: 30, height: 4, background: "rgba(255,247,236,0.35)" }} />
              ))}
            </div>
            {/* o ponto: carimbo em cima da barra de quem venceu */}
            {venceu ? (
              <div style={{ position: "absolute", left: x, top: COL.y + COL.h * 0.52, width: COL.w, display: "flex", justifyContent: "center", opacity: Math.min(1, pV * 3), transform: pV >= 1 ? "rotate(-7deg)" : `rotate(-7deg) scale(${1.5 - 0.5 * pV})` }}>
                <Placa fundo={cor.alerta} padX={28} padY={6} sombra={sombraDura(cor.alertaBorda, 8)}>
                  <span style={{ ...estiloFonte(900, 78), color: cor.tintaEscura }}>+1</span>
                </Placa>
              </div>
            ) : null}
            {/* o que ele faz nesta rodada */}
            {l?.texto && lbl && t >= l.em ? (
              <div style={{ position: "absolute", left: x, top: COL.y + COL.h + 28, width: COL.w, display: "flex", justifyContent: "center", opacity: Math.min(1, pL * 3), transform: pL >= 1 ? undefined : `scale(${0.7 + 0.3 * pL})` }}>
                <Placa fundo={perdeu ? "#4A4656" : corDoLado(lado)} padX={20} padY={8} sombra={sombraDura(escuro, 7)}>
                  <Linhas linhas={lbl.linhas} tamanho={lbl.tamanho} peso={800} cor={perdeu ? cor.tinta : TEXTO_SOBRE(lado)} caixaAlta={false} />
                </Placa>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* empate */}
      {decidida && r.vencedor === "empate" ? (
        <div style={{ position: "absolute", left: 0, top: COL.y + 150, width: 1080, display: "flex", justifyContent: "center", ...entradaAdesivo(t, vence, { giro: -5, de: 1.4 }) }}>
          <Placa fundo={cor.papel} padX={30} padY={6} sombra={sombraDura("#B5AC9A", 8)}>
            <span style={{ ...estiloFonte(900, 64), color: cor.tintaEscura }}>EMPATE</span>
          </Placa>
        </div>
      ) : null}

      {/* a imagem da rodada bate grande e depois encolhe para uma medalha no alto da barra do lado dela */}
      {temImagem(img) && t >= emImg ? (
        <ImagemDaRodada img={img} lado={r.imagemLado} t={t} em={emImg} />
      ) : null}
    </AbsoluteFill>
  );
};

// ——— o veredito: placar final e perfis ———

const CARTAO = { w: 468, h: 300 };
const yLinha = (i: number, total: number) => (total <= 2 ? 540 : i === 0 ? 500 : 500 + 206);

export const VereditoTela: React.FC<{ m: Veredito; d: Duelo; t: number; plano: Plano; fim: number }> = ({ m, d, t, plano, fim }) => {
  const [a, b] = d.versus.lados;
  const total: [number, number] = [0, 0];
  for (const r of d.rodadas) if (r.vencedor === 0 || r.vencedor === 1) total[r.vencedor]++;
  const placarT = m.placarEm ?? m.de;
  const pP = carimbo(t, placarT, 0, 0.24);
  // o placar pulsa o tempo todo e dá um tranco extra a cada perfil que chega ao lado
  const chegadas = m.perfis.map((p) => p.ladoEm ?? p.em + 0.55);
  const ultimaChegada = [...chegadas].reverse().find((x) => t >= x);
  const tranco = ultimaChegada === undefined ? 0 : 0.1 * (1 - prog(t, ultimaChegada, 0.35, rapido));
  const pulso = t > placarT + 0.3 ? 1 + 0.025 * Math.sin((t - placarT) * 6.5) + tranco : 1;
  const sacode = tremida(t, placarT, 8);
  const sai = fim > m.ate + 0.01 ? 0 : prog(t, m.ate - 0.1, 0.1);
  const empate = total[0] === total[1];
  const vencedor: 0 | 1 | null = empate ? null : total[0] > total[1] ? 0 : 1;
  const nA = caber(a.nome, 300, 44, 26, 1, 900);
  const nB = caber(b.nome, 300, 44, 26, 1, 900);
  const primeiroPerfil = m.perfis.length ? Math.min(...m.perfis.map((p) => p.em)) : placarT + 1;
  const titulo = m.titulo ?? "Pra quem é cada um?";
  const pT = prog(t, Math.min(primeiroPerfil - 0.3, placarT + 0.9), 0.3, rapido);
  const contagem = [0, 0];
  const linhaDe = m.perfis.map((p) => contagem[p.lado]++);
  const maxLinhas = Math.max(contagem[0], contagem[1], 1);
  const placaDoLado = (lado: 0 | 1, n: ReturnType<typeof caber>, x: number) => (
    <div style={{ position: "absolute", left: x, top: ARENA.y + 200, width: 280, display: "flex", justifyContent: "center" }}>
      <Placa fundo={corDoLado(lado)} padX={20} padY={5} sombra={sombraDura(escuroDoLado(lado), 6)}>
        <Linhas linhas={n.linhas} tamanho={n.tamanho} peso={900} cor={TEXTO_SOBRE(lado)} />
      </Placa>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: 1 - sai, transform: `translate(${sacode.x}px, ${sacode.y}px)` }}>
      {t >= placarT ? (
        <div style={{ position: "absolute", left: 0, top: ARENA.y + 4, width: 1080, opacity: pP.opacity, transform: pP.transform, transformOrigin: "50% 40%" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 26, transform: `scale(${pulso})` }}>
            {[0, 1].map((k) => {
              const lado = k as 0 | 1;
              const ganha = vencedor === lado;
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 26, flexDirection: k === 0 ? "row" : "row-reverse" }}>
                  <div
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: 26,
                      background: corDoLado(lado),
                      boxShadow: `${sombraDura(escuroDoLado(lado), 10)}${ganha ? `, 0 0 0 10px ${cor.alerta}` : ""}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...estiloFonte(900, 140),
                      color: TEXTO_SOBRE(lado),
                    }}
                  >
                    {total[k]}
                  </div>
                  {k === 0 ? <span style={{ ...estiloFonte(900, 90), color: cor.alerta }}>×</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {t >= placarT + 0.1 ? (
        <>
          {placaDoLado(0, nA, 540 - 26 - 170 - 140 + 0 - 0)}
          {placaDoLado(1, nB, 540 + 26 + 170 - 140 + 0)}
        </>
      ) : null}
      {/* "pra quem é cada um?" */}
      {t >= placarT + 0.5 ? (
        <div style={{ position: "absolute", left: 0, top: ARENA.y + 282, width: 1080, display: "flex", justifyContent: "center", opacity: pT, transform: `translateY(${(1 - pT) * 20}px)` }}>
          <span style={{ ...estiloFonte(900, 46), color: cor.alerta, letterSpacing: "0.02em" }}>{titulo}</span>
        </div>
      ) : null}
      {m.perfis.map((p, k) => {
        if (t < p.em) return null;
        const lado = p.lado;
        const linha = linhaDe[k];
        const ladoEm = p.ladoEm ?? p.em + 0.55;
        const xAlvo = lado === 0 ? 52 : 1080 - 52 - CARTAO.w;
        const xCentro = (1080 - CARTAO.w) / 2;
        const mv = prog(t, ladoEm, 0.4, suave);
        const entrada = entradaAdesivo(t, p.em, { de: 0.7, dur: 0.26 });
        const y = yLinha(linha, maxLinhas > 1 ? 3 : 2);
        const texto = caber(p.texto, CARTAO.w - 70, maxLinhas === 1 ? 74 : 50, 30, 3, 800, false);
        const corFaixa = mv > 0.5 ? corDoLado(lado) : cor.alerta;
        const altura = maxLinhas === 1 ? CARTAO.h : 196;
        const bob = Math.sin((t - ladoEm) * 8) * 7;
        const dir = lado === 0 ? -1 : 1;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: xCentro + (xAlvo - xCentro) * mv,
              top: y,
              width: CARTAO.w,
              height: altura,
              opacity: entrada.opacity,
              transform: `${entrada.transform ?? ""} rotate(${dir * 2 * mv}deg)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 26,
                background: cor.papel,
                boxShadow: "0 18px 36px rgba(0,0,0,0.45)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                padding: "0 24px 0 44px",
                boxSizing: "border-box",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, width: 22, height: "100%", background: corFaixa }} />
              <Linhas linhas={texto.linhas} tamanho={texto.tamanho} peso={800} cor={cor.tintaEscura} alinhar="left" caixaAlta={false} />
            </div>
            {/* o aparelho (ou o nome) que serve a esse perfil, preso ao canto do cartão */}
            <div style={{ position: "absolute", top: -52, [lado === 0 ? "left" : "right"]: -22, transform: `scale(${0.8 + 0.2 * prog(t, p.em, 0.3, salto)})` }}>
              <Miniatura lado={lado} l={d.versus.lados[lado]} plano={plano} t={t} tam={116} />
            </div>
            {/* a seta que aponta para o lado dele, balançando */}
            {mv > 0.6 ? (
              <svg width={54} height={70} viewBox="0 0 54 70" style={{ position: "absolute", top: altura / 2 - 35, [lado === 0 ? "left" : "right"]: -48 + dir * bob * 0.5 * (lado === 0 ? 1 : -1) * -1, opacity: prog(t, ladoEm + 0.25, 0.2) }}>
                <path d={lado === 0 ? "M44 8 L12 35 L44 62" : "M10 8 L42 35 L10 62"} fill="none" stroke={corDoLado(lado)} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const alturaDaArena = COSTURA;
export { fonte };
