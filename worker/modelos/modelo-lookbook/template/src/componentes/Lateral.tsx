// Páginas laterais de texto (destaque, frase, pergunta): a foto vai para um lado; na coluna de
// papel do outro lado entra a marca da página (um pino grande com o fio de prumo, as aspas, a
// interrogação) e o cartão de papel avança sobre a foto, abaixo do queixo, com o texto.
// `camada`: "papel" desenha a coluna (embaixo da foto); "sobre", o cartão (por cima da foto).
import { prog, saida, Sobe } from "../anim";
import { encaixar, largura } from "../medida";
import { ladoDaPagina, type LayoutPessoa } from "../pessoa";
import type { Destaque, Frase, Pergunta, Plano } from "../plano";
import { BASE_CARTAO, cor, rotulo, sans, serifa } from "../tema";
import { temposDoTexto, separar } from "../palavras";
import { Apoio, Falado, folha, Glifo, marcarTrecho, quando } from "./comum";

const W = 760;
const PAD = 44;

// cartão assentado na base, sem subir acima do queixo
const posicaoDoCartao = (layout: LayoutPessoa, plano: Plano, altura: number) => {
  const l = ladoDaPagina(layout, plano, W);
  const y = Math.max(l.cartao.y, BASE_CARTAO - altura);
  return { ...l, x: l.cartao.x, y, max: BASE_CARTAO - l.cartao.y };
};

const Cartao: React.FC<{ x: number; y: number; h: number; lado: -1 | 1; entra: number; fora: number; children: React.ReactNode }> = ({ x, y, h, lado, entra, fora, children }) => (
  <div
    style={{
      ...folha,
      left: x,
      top: y,
      width: W,
      height: h,
      padding: PAD,
      opacity: Math.min(1, entra * 1.6) * (1 - fora),
      translate: `${lado * ((1 - entra) * 90 + fora * 60)}px 0`,
    }}
  >
    {children}
  </div>
);

// ——— destaque ———
export const DestaqueNaPagina: React.FC<{ m: Destaque; t: number; plano: Plano; fim: number; layout: LayoutPessoa; camada: "papel" | "sobre" }> = ({ m, t, plano, fim, layout, camada }) => {
  const fora = saida(t, fim);
  const entra = prog(t, m.de + 0.28, 0.6);
  const alerta = m.nivel === "alerta";
  const acento = alerta ? cor.vinho : cor.indigo;
  const tw = W - PAD * 2;
  const zona = ladoDaPagina(layout, plano, W);
  const maxH = BASE_CARTAO - zona.cartao.y;
  let texto = encaixar(m.texto, { largura: tw, max: 104, min: 58, linhas: 3, estilo: "italico", entrelinha: 1.08 });
  let det = m.detalhe ? encaixar(m.detalhe, { largura: tw, max: 44, min: 38, linhas: 2, estilo: "sans400", entrelinha: 1.22 }) : null;
  const alturaDe = () => PAD * 2 + texto.altura + 14 + (det ? 18 + det.altura : 0);
  for (let s = texto.tamanho; alturaDe() > maxH && s > 50; s -= 4) {
    texto = encaixar(m.texto, { largura: tw, max: s, min: Math.min(s, 50), linhas: 4, estilo: "italico", entrelinha: 1.08 });
    if (det) det = encaixar(m.detalhe!, { largura: tw, max: 40, min: 36, linhas: 3, estilo: "sans400", entrelinha: 1.22 });
  }
  const h = alturaDe();
  const c = posicaoDoCartao(layout, plano, h);
  const em = quando(m.em, m.de);
  const p = prog(t, em - 0.04, 0.45);
  const traco = prog(t, em + 0.3, 0.5);
  const ultima = largura(texto.linhas[texto.linhas.length - 1], texto.tamanho, "italico");
  // pino grande na coluna e o fio de prumo até o cartão
  const px = c.lado === -1 ? c.coluna.x + 70 : c.coluna.x + c.coluna.w - 70;
  const py = c.coluna.y + 80;
  const pin = prog(t, m.de + 0.2, 0.6);
  const fio = prog(t, em - 0.1, 0.55);
  const R = 58;
  const volta = 2 * Math.PI * R;
  return (
    <>
      {camada === "papel" ? (
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: 1 - fora }}>
        <line x1={px} x2={px} y1={py + R + 4} y2={py + R + 4 + (c.y - (py + R + 4)) * fio} stroke={cor.tinta} strokeWidth={3} />
        <line x1={px - 12} x2={px + 12} y1={c.y - 2} y2={c.y - 2} stroke={cor.tinta} strokeWidth={3} opacity={prog(fio, 0.85, 0.15)} />
        <circle cx={px} cy={py} r={R} fill={cor.folha} opacity={pin} />
        <circle cx={px} cy={py} r={R} fill="none" stroke={cor.tinta} strokeWidth={5} strokeDasharray={volta} strokeDashoffset={volta * (1 - pin)} transform={`rotate(-90 ${px} ${py})`} />
        <circle cx={px} cy={py} r={36} fill={acento} transform={`translate(${px} ${py}) scale(${prog(pin, 0.35, 0.65)}) translate(${-px} ${-py})`} />
      </svg>
      ) : null}
      {alerta && camada === "papel" ? (
        <div style={{ position: "absolute", left: px - 40, top: py - 32, width: 80, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: 52, lineHeight: "64px", color: cor.folha, opacity: prog(pin, 0.6, 0.4) * (1 - fora) }}>!</div>
      ) : null}
      {camada === "sobre" ? (
      <Cartao x={c.x} y={c.y} h={h} lado={c.lado} entra={entra} fora={fora}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: texto.tamanho * 0.62, width: tw * 0.75, borderTop: `3px dashed ${cor.lapis}`, opacity: 1 - prog(p, 0, 0.4) }} />
          <div style={{ fontFamily: serifa, fontStyle: "italic", fontSize: texto.tamanho, lineHeight: 1.08, color: cor.tinta, whiteSpace: "nowrap" }}>
            {texto.linhas.map((l, i) => (
              <Sobe key={i} p={p}>
                {l}
              </Sobe>
            ))}
          </div>
          <div style={{ height: Math.max(5, texto.tamanho * 0.06), width: ultima * traco, background: acento, marginTop: 8 }} />
          {det ? (
            <div style={{ marginTop: 18 }}>
              <Apoio texto={det.linhas.join(" ")} tamanho={det.tamanho} p={prog(t, m.detalheEm !== undefined ? quando(m.detalheEm, m.de) : em + 0.6, 0.4)} />
            </div>
          ) : null}
        </div>
      </Cartao>
      ) : null}
    </>
  );
};

// ——— frase ———
export const FraseNaPagina: React.FC<{ m: Frase; t: number; plano: Plano; fim: number; layout: LayoutPessoa; camada: "papel" | "sobre" }> = ({ m, t, plano, fim, layout, camada }) => {
  const fora = saida(t, fim);
  const entra = prog(t, m.de + 0.28, 0.6);
  const tw = W - PAD * 2;
  const zona = ladoDaPagina(layout, plano, W);
  const maxH = BASE_CARTAO - zona.cartao.y;
  const rot = m.rotulo ? 50 : 0;
  let texto = encaixar(m.texto, { largura: tw, max: 84, min: 52, linhas: 5, estilo: "serifa", entrelinha: 1.14 });
  for (let s = texto.tamanho; PAD * 2 + rot + texto.altura > maxH && s > 44; s -= 4)
    texto = encaixar(m.texto, { largura: tw, max: s, min: Math.min(s, 44), linhas: 7, estilo: "serifa", entrelinha: 1.14 });
  const h = PAD * 2 + rot + texto.altura + 6;
  const c = posicaoDoCartao(layout, plano, h);
  const palavras = separar(texto.linhas.join(" "));
  const tempos = temposDoTexto(palavras, plano, m.em ?? m.de, m.ate);
  const destaque = marcarTrecho(palavras, m.destaque ?? m.enfase);
  const risco = marcarTrecho(palavras, m.risco);
  const alinhar = c.lado === -1 ? "left" : "right";
  return (
    <>
      {camada === "papel" ? (
        <div style={{ position: "absolute", left: c.coluna.x, top: Math.max(c.coluna.y - 20, (c.coluna.y + c.y) / 2 - 460 * 0.45), width: c.coluna.w, textAlign: alinhar, opacity: 1 - fora }}>
          <Glifo texto="“" p={prog(t, m.de + 0.2, 0.55)} tamanho={460} />
        </div>
      ) : null}
      {camada === "sobre" ? (
      <Cartao x={c.x} y={c.y} h={h} lado={c.lado} entra={entra} fora={fora}>
        {m.rotulo ? <div style={{ ...rotulo, color: cor.indigo, height: rot }}>{m.rotulo}</div> : null}
        <Falado
          linhas={texto.linhas}
          tempos={tempos}
          t={t}
          tamanho={texto.tamanho}
          entrelinha={1.14}
          destaque={destaque}
          risco={risco}
          riscoEm={m.riscoEm}
        />
      </Cartao>
      ) : null}
    </>
  );
};

// ——— pergunta ———
const TAG_PAD = 74;
const Tag: React.FC<{ linhas: string[]; tamanho: number; w: number; p: number }> = ({ linhas, tamanho, w, p }) => {
  const h = 34 + linhas.length * tamanho * 1.18;
  const c = 22;
  return (
    <div style={{ position: "relative", width: w, height: h, opacity: Math.min(1, p * 1.8), translate: `0 ${(1 - p) * -26}px`, rotate: `${-1.2 - (1 - p) * 5}deg` }}>
      <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: "drop-shadow(0 8px 14px rgba(30,24,16,0.16))" }}>
        <path d={`M${c} 0 H${w} V${h} H${c} L0 ${h - c} V${c} Z`} fill={cor.papel} stroke="rgba(23,22,20,0.45)" strokeWidth={2.5} />
        <circle cx={30} cy={h / 2} r={10} fill={cor.folha} stroke={cor.tinta} strokeWidth={3} />
      </svg>
      <div style={{ position: "absolute", left: TAG_PAD - 14, top: 17, right: 18, fontFamily: sans, fontWeight: 500, fontSize: tamanho, lineHeight: 1.18, color: cor.tinta }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PerguntaNaPagina: React.FC<{ m: Pergunta; t: number; plano: Plano; fim: number; layout: LayoutPessoa; camada: "papel" | "sobre" }> = ({ m, t, plano, fim, layout, camada }) => {
  const fora = saida(t, fim);
  const entra = prog(t, m.de + 0.28, 0.6);
  const tw = W - PAD * 2;
  const zona = ladoDaPagina(layout, plano, W);
  const maxH = BASE_CARTAO - zona.cartao.y;
  const opcoes = m.opcoes ?? [];
  // opções: lado a lado se couberem em 2 linhas cada; senão, uma embaixo da outra
  const meia = (tw - 22) / 2;
  const medir = (w: number, max: number) => opcoes.map((o) => encaixar(o.texto, { largura: w - TAG_PAD - 18, max, min: 34, linhas: 2, estilo: "sans500", entrelinha: 1.18 }));
  let lado = opcoes.length === 2 && medir(meia, 40).every((e) => e.linhas.length <= 2 && e.tamanho >= 36);
  let tags = lado ? medir(meia, 40) : medir(tw, 42);
  const alturaTags = () =>
    opcoes.length === 0 ? 0 : lado ? 34 + Math.max(...tags.map((e) => e.linhas.length * e.tamanho * 1.18)) : tags.reduce((a, e) => a + 34 + e.linhas.length * e.tamanho * 1.18 + 16, -16);
  let texto = encaixar(m.texto, { largura: tw, max: 80, min: 50, linhas: 4, estilo: "serifa", entrelinha: 1.12 });
  const alturaDe = () => PAD * 2 + texto.altura + (opcoes.length ? 30 + alturaTags() : 0);
  for (let s = texto.tamanho; alturaDe() > maxH && s > 44; s -= 4) {
    texto = encaixar(m.texto, { largura: tw, max: s, min: Math.min(s, 44), linhas: 5, estilo: "serifa", entrelinha: 1.12 });
    if (!lado) tags = medir(tw, 36);
  }
  if (alturaDe() > maxH && opcoes.length === 2 && !lado) {
    lado = true;
    tags = medir(meia, 36);
  }
  const h = alturaDe();
  const c = posicaoDoCartao(layout, plano, h);
  const palavras = separar(texto.linhas.join(" "));
  const tempos = temposDoTexto(palavras, plano, m.em ?? m.de, m.ate);
  const alinhar = c.lado === -1 ? "left" : "right";
  return (
    <>
      {camada === "papel" ? (
        <div style={{ position: "absolute", left: c.coluna.x, top: Math.max(c.coluna.y - 20, (c.coluna.y + c.y) / 2 - 420 * 0.45), width: c.coluna.w, textAlign: alinhar, opacity: 1 - fora }}>
          <Glifo texto="?" p={prog(t, m.de + 0.2, 0.55)} tamanho={420} />
        </div>
      ) : null}
      {camada === "sobre" ? (
      <Cartao x={c.x} y={c.y} h={h} lado={c.lado} entra={entra} fora={fora}>
        <Falado linhas={texto.linhas} tempos={tempos} t={t} tamanho={texto.tamanho} entrelinha={1.12} />
        {opcoes.length ? (
          <div style={{ display: "flex", flexDirection: lado ? "row" : "column", gap: lado ? 22 : 16, marginTop: 30 }}>
            {opcoes.map((o, i) => (
              <Tag key={i} linhas={tags[i].linhas} tamanho={tags[i].tamanho} w={lado ? meia : tw} p={prog(t, quando(o.em, m.de) - 0.06, 0.5)} />
            ))}
          </div>
        ) : null}
      </Cartao>
      ) : null}
    </>
  );
};
