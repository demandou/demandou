import { Datilo, prog, saindo } from "../anim";
import type { Regiao } from "../layout";
import type { Ficha as TFicha } from "../plano";
import { encaixar, encaixarBloco, larguraTexto } from "../medida";
import { caber, cor, LARGURA_SANS_CAIXA_ALTA, mono, rotulo, sans, sombraPapel } from "../tema";
import { Deslizar } from "./Papel";
import { CartaoCoordenadas } from "./CartaoCoordenadas";
import { Carimbo } from "./Carimbo";

// Ficha de registro: formulário pré-impresso que desliza sobre a mesa; cada campo é datilografado
// quando é dito, o carimbo bate e o cartão de coordenadas entra por cima, cruzando a foto.
export const Ficha: React.FC<{ m: TFicha; t: number; fim: number; regiao: Regiao; lado: "direita" | "esquerda" }> = ({ m, t, fim, regiao, lado }) => {
  const entra = prog(t, m.de, 0.6);
  const sai = saindo(t, fim, 0.3);
  const direcao = lado === "direita" ? 1 : -1;
  // a folha avança um pouco sobre a borda da foto (colagem de documentos)
  const coluna = regiao.w < 600;
  const x = coluna && lado === "direita" ? regiao.x - 34 : regiao.x;
  const largura = coluna ? regiao.w + 34 - 16 : regiao.w;
  const y = regiao.y + 20;
  const interno = largura - 68;
  const titulo = m.titulo.texto.toUpperCase();
  const maiorPalavra = titulo.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), "");
  const tamTitulo = caber(maiorPalavra, interno, 84, LARGURA_SANS_CAIXA_ALTA, 48);
  const campos = (m.campos ?? []).slice(0, 3);
  // a folha desce até a base da região; o cartão de coordenadas encosta na base e cobre o pé da folha
  const alturaCartao = 300;
  const topoCartao = regiao.y + regiao.h - alturaCartao;
  const alturaFolha = regiao.h - 20;
  const coordEntra = m.coordenadas ? prog(t, m.coordenadas.em - 0.05, 0.5) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, translate: `${direcao * (1 - entra + sai) * 680}px 0`, opacity: 1 - sai * 0.4 }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: largura,
          height: alturaFolha,
          background: cor.cartao,
          boxShadow: sombraPapel,
          rotate: `${direcao * 0.9}deg`,
          padding: "0 34px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: 10, margin: "0 -34px", background: cor.vermelho }} />
        <div style={{ ...rotulo, color: cor.tinta, marginTop: 26, display: "flex", justifyContent: "space-between" }}>
          <span>{m.cabecalho ?? "Ficha de registro"}</span>
          <span style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: 12, height: 12, border: `2px solid ${cor.tinta}`, background: k === 0 ? cor.tinta : "transparent" }} />
            ))}
          </span>
        </div>
        <div style={{ height: 2, background: cor.tinta, marginTop: 18 }} />
        <div style={{ ...rotulo, color: cor.grafite, marginTop: 26 }}>{m.titulo.rotulo ?? "Objeto"}</div>
        <div
          style={{
            marginTop: 14,
            fontFamily: sans,
            fontWeight: 800,
            fontSize: tamTitulo,
            lineHeight: 1.04,
            letterSpacing: "0.01em",
            color: cor.tinta,
            minHeight: tamTitulo * 2.08,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${tamTitulo * 1.04 - 2}px, ${cor.linha} ${tamTitulo * 1.04 - 2}px, ${cor.linha} ${tamTitulo * 1.04}px)`,
          }}
        >
          <Datilo texto={titulo} em={m.titulo.em} t={t} semente={4} />
        </div>
        {campos.map((c, i) => (
          <div key={i} style={{ marginTop: 30 }}>
            <div style={{ ...rotulo, color: cor.grafite }}>{c.rotulo}</div>
            <div
              style={{
                marginTop: 12,
                fontFamily: mono,
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1.2,
                color: cor.tinta,
                borderBottom: `2px solid ${cor.linha}`,
                paddingBottom: 6,
                minHeight: 48,
              }}
            >
              <Datilo texto={c.valor} em={c.em} t={t} semente={7 + i} />
            </div>
          </div>
        ))}
        {/* observações: linhas pré-impressas no pé da folha (o carimbo e o cartão caem por cima) */}
        <div style={{ marginTop: "auto", marginBottom: 40 }}>
          <div style={{ ...rotulo, color: cor.grafite }}>Observações</div>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ height: 2, background: cor.linha, marginTop: 44 }} />
          ))}
        </div>
        {m.carimbo ? (
          <div style={{ position: "absolute", left: 0, right: 0, top: m.coordenadas ? topoCartao - y - 170 : alturaFolha - 290, display: "flex", justifyContent: "center" }}>
            <Carimbo texto={m.carimbo.texto} detalhe={m.carimbo.detalhe} em={m.carimbo.em} t={t} rot={-8} semente={3} tamanho={Math.min(1, interno / 440)} />
          </div>
        ) : null}
      </div>
      {m.coordenadas && t >= m.coordenadas.em - 0.06 ? (
        <div
          style={{
            position: "absolute",
            left: lado === "direita" ? 1080 - 56 - 800 : 56,
            top: topoCartao,
            rotate: `${-direcao * 1.2}deg`,
            boxShadow: sombraPapel,
            translate: `0 ${(1 - coordEntra) * 520}px`,
          }}
        >
          <CartaoCoordenadas c={m.coordenadas} t={t} largura={800} />
        </div>
      ) : null}
    </div>
  );
};

// A mesma ficha em folha larga (layouts "base" e "topo": a foto fica embaixo ou em cima, nunca numa
// coluna ao lado). O título e o carimbo dividem o alto da ficha; os campos vêm embaixo, em duas
// colunas; o cartão de coordenadas, se houver, cobre o canto de baixo à direita.
export const FichaLarga: React.FC<{ m: TFicha; t: number; fim: number; regiao: Regiao }> = ({ m, t, fim, regiao }) => {
  const PAD = 34;
  const interno = regiao.w - 2 * PAD;
  const campos = (m.campos ?? []).slice(0, 3);
  const temLado = !!m.carimbo;
  const larguraTitulo = temLado ? interno * 0.58 : interno;
  const titulo = m.titulo.texto.toUpperCase();
  // sem campos o título é o documento: pode crescer até 3 linhas grandes
  const fitTitulo = encaixarBloco(titulo, { largura: larguraTitulo, altura: campos.length ? 190 : 340, max: campos.length ? 84 : 96, min: 50, maxLinhas: campos.length ? 3 : 4, entrelinha: 1.04, fonte: { peso: 800, espacamento: 0.01 } });
  const coord = m.coordenadas;
  const LARGURA_COORD = 560;
  const larguraCampos = coord ? interno - LARGURA_COORD - 10 : interno;
  const colunas = campos.length >= 2 && larguraCampos > 700 ? 2 : 1;
  const larguraCampo = (larguraCampos - (colunas - 1) * 40) / colunas;
  // o carimbo cabe na coluna ao lado do título: até 2 linhas, no maior corpo que couber
  const larguraCarimbo = interno - larguraTitulo - 30 - 90;
  const fitCarimbo = m.carimbo ? encaixar(m.carimbo.texto.toUpperCase(), { largura: larguraCarimbo, max: 60, min: 36, linhas: 2, fonte: { peso: 800, espacamento: 0.06 } }) : null;
  const tamCarimbo = m.carimbo?.detalhe ? Math.min(1, larguraCarimbo / (m.carimbo.detalhe.length * 34 * 0.76)) : 1;
  const coordEntra = coord ? prog(t, coord.em - 0.05, 0.5) : 0;
  const alturaTitulo = fitTitulo.linhas.length * fitTitulo.tamanho * 1.04;
  // altura do conteúdo: tarja + cabeçalho + título (ou carimbo) + campos + 3 linhas de observações
  const linhasCampos = colunas === 2 ? Math.ceil(campos.length / 2) : campos.length;
  const alturaCampos = campos.length ? 26 + linhasCampos * (30 + 10 + 2 * 50 * 1.18 + 8) + (linhasCampos - 1) * 22 : 0;
  const alturaConteudo = 10 + 24 + 30 + 16 + 22 + Math.max(42 + alturaTitulo, m.carimbo ? alturaTitulo + 40 : 0) + alturaCampos + 3 * 42 + 34;
  const altura = Math.min(regiao.h - 16, Math.max(380, alturaConteudo));
  const cartao = { x: regiao.x, y: regiao.y + 6 + (regiao.h - 16 - altura) / 2, w: regiao.w, h: altura };
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      <div
        style={{
          position: "absolute",
          left: cartao.x,
          top: cartao.y,
          width: cartao.w,
          height: cartao.h,
          background: cor.cartao,
          boxShadow: sombraPapel,
          rotate: "-0.5deg",
          padding: `0 ${PAD}px`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 10, margin: `0 -${PAD}px`, background: cor.vermelho }} />
        <div style={{ ...rotulo, fontSize: 30, color: cor.tinta, marginTop: 24, display: "flex", justifyContent: "space-between" }}>
          <span>{m.cabecalho ?? "Ficha de registro"}</span>
          <span style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map((k) => (
              <span key={k} style={{ width: 12, height: 12, border: `2px solid ${cor.tinta}`, background: k === 0 ? cor.tinta : "transparent" }} />
            ))}
          </span>
        </div>
        <div style={{ height: 2, background: cor.tinta, marginTop: 16, flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", marginTop: 22, gap: 30 }}>
          <div style={{ width: larguraTitulo }}>
            <div style={{ ...rotulo, fontSize: 30, color: cor.grafite }}>{m.titulo.rotulo ?? "Registro"}</div>
            <div
              style={{
                marginTop: 12,
                fontFamily: sans,
                fontWeight: 800,
                fontSize: fitTitulo.tamanho,
                lineHeight: 1.04,
                letterSpacing: "0.01em",
                color: cor.tinta,
                minHeight: alturaTitulo,
              }}
            >
              {fitTitulo.linhas.map((l, i) => (
                <div key={i} style={{ whiteSpace: "nowrap", borderBottom: `2px solid ${cor.linha}` }}>
                  <Datilo texto={l} em={m.titulo.em + i * 0.3} t={t} semente={4 + i} />
                </div>
              ))}
            </div>
          </div>
          {m.carimbo ? (
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: alturaTitulo + 40 }}>
              <Carimbo texto={m.carimbo.texto} linhas={fitCarimbo?.linhas} corpo={fitCarimbo?.tamanho} detalhe={m.carimbo.detalhe} em={m.carimbo.em} t={t} rot={-7} semente={3} tamanho={tamCarimbo} />
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", columnGap: 40, rowGap: 22, marginTop: 26, width: larguraCampos }}>
          {campos.map((c, i) => {
            const fit = encaixar(c.valor, { largura: larguraCampo, max: 50, min: 36, linhas: 2, fonte: { mono: true } });
            return (
              <div key={i} style={{ width: larguraCampo }}>
                <div style={{ ...rotulo, fontSize: 30, color: cor.grafite, whiteSpace: "nowrap", overflow: "hidden" }}>{c.rotulo}</div>
                <div style={{ marginTop: 10, fontFamily: mono, fontWeight: 700, fontSize: fit.tamanho, lineHeight: 1.18, color: cor.tinta, borderBottom: `2px solid ${cor.linha}`, paddingBottom: 6, minHeight: fit.tamanho * 1.18 }}>
                  {fit.linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      <Datilo texto={l} em={c.em + k * 0.3} t={t} semente={7 + i * 3 + k} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* observações: linhas pré-impressas no espaço que sobra */}
        <div style={{ marginTop: "auto", marginBottom: 34, width: larguraCampos, overflow: "hidden", flexShrink: 1, minHeight: 0 }}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ height: 2, background: cor.linha, marginTop: 40 }} />
          ))}
        </div>
      </div>
      {coord && t >= coord.em - 0.06 ? (
        <div
          style={{
            position: "absolute",
            left: cartao.x + cartao.w - LARGURA_COORD - 10,
            top: cartao.y + cartao.h - 270,
            rotate: "1.2deg",
            boxShadow: sombraPapel,
            translate: `0 ${(1 - coordEntra) * 420}px`,
            opacity: Math.min(1, coordEntra * 3),
          }}
        >
          <CartaoCoordenadas c={coord} t={t} largura={LARGURA_COORD} />
        </div>
      ) : null}
    </Deslizar>
  );
};
