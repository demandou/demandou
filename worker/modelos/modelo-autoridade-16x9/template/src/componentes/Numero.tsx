import { apuracao, Bloco, Linha, prog, useTempo } from "../anim";
import { encaixarNaCaixa, larguraTexto, ROTULO, SERIF } from "../medida";
import type { Numero as TNumero, NumeroAntigo, NumeroUniversal } from "../plano";
import { casasDe, cor, formatar, minimo, rotulo, serif, sombra } from "../tema";
import { Ilustrativo } from "./Pecas";

// Marcadores: barrinhas de latão que preenchem uma a uma (contagens pequenas).
const Marcadores: React.FC<{ n: number; t: number; inicio: number }> = ({ n, t, inicio }) => {
  const larguraMarcador = Math.min(92, (760 - (n - 1) * 12) / n);
  return (
    <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: larguraMarcador, height: 8, background: "rgba(242,236,223,0.22)", opacity: prog(t, inicio + 0.3, 0.3) }}>
          <div style={{ width: `${prog(t, inicio + 0.5 + i * 0.13, 0.22) * 100}%`, height: "100%", background: cor.latao }} />
        </div>
      ))}
    </div>
  );
};

// Dado em destaque do exemplo antigo (valor em texto): numeral grande + unidade + marcadores.
// Encolhe junto para caber na largura e na altura da região (no quadro deitado, a faixa do peito é baixa).
const NumeroDoExemplo: React.FC<{ m: NumeroAntigo; largura: number; altura: number }> = ({ m, largura, altura }) => {
  const t = useTempo();
  const n = m.marcadores ?? 0;
  // Largura estimada do conjunto (sem medir o DOM): o bloco inteiro encolhe para caber.
  const larguraDoValor = [...m.valor].reduce((n, c) => n + (c === "%" ? 0.8 : /\d/.test(c) ? 0.5 : 0.56), 0) * 380;
  const larguraDoLado = Math.max(m.unidade.length * 168 * 0.47, (m.complemento?.length ?? 0) * 34 * 0.9);
  const alturaMarcadores = n > 0 ? 48 : 0;
  const escala = Math.min(1, (Math.min(900, largura) - 10) / (larguraDoValor + 34 + larguraDoLado), (altura - 10 - alturaMarcadores) / 304);

  return (
    <Bloco t={t} ate={m.ate}>
      <div style={{ height: 304 * escala, display: "flex", alignItems: "flex-end", justifyContent: "center", width: largura }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 34,
          width: "max-content",
          whiteSpace: "nowrap",
          flexShrink: 0,
          scale: String(escala),
          transformOrigin: "center bottom",
          textShadow: sombra,
        }}
      >
        <Linha p={prog(t, m.de, 0.6)} style={{ fontFamily: serif, fontSize: 380, lineHeight: 0.8, color: cor.lataoClaro }}>
          {m.valor}
        </Linha>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", paddingBottom: 26, flexShrink: 0 }}>
          <Linha p={prog(t, m.de + 0.14, 0.55)} style={{ fontFamily: serif, fontSize: 168, lineHeight: 0.9, color: cor.papel }}>
            {m.unidade}
          </Linha>
          {m.complemento ? (
            <div style={{ ...rotulo, fontSize: 34, color: cor.papel, marginTop: 18, opacity: prog(t, m.de + 0.4, 0.4) }}>{m.complemento}</div>
          ) : null}
        </div>
      </div>
      </div>
      {n > 0 ? <Marcadores n={n} t={t} inicio={m.de} /> : null}
    </Bloco>
  );
};

// Número universal: o numeral de latão conta até o valor quando é dito (pt-BR); prefixo (US$, R$)
// e sufixo (%, mil, dias) em serifada marfim; o rótulo em letreiro ao lado, ou em serifada embaixo
// quando é longo. Tudo encolhe junto para caber na largura e na altura.
const NumeroQueConta: React.FC<{ m: NumeroUniversal; largura: number; altura: number }> = ({ m, largura, altura }) => {
  const t = useTempo();
  const casas = m.casas ?? casasDe(m.valor);
  const final = formatar(m.valor, casas);
  // conta quando vale a pena (números grandes ou com vírgula); um "7" só sobe
  const conta = Math.abs(m.valor) >= 10 || casas > 0;
  const digitos = Math.floor(Math.abs(m.valor)).toString().length;
  const partida = conta ? (digitos >= 3 ? Math.sign(m.valor) * 10 ** (digitos - 1) : 0) : m.valor;
  const pConta = prog(t, m.em, 1.3, apuracao);
  const atual = conta ? partida + (m.valor - partida) * pConta : m.valor;
  const texto = pConta >= 1 ? final : formatar(atual, casas);

  const n = m.marcadores && m.marcadores >= 2 && m.marcadores <= 12 ? m.marcadores : 0;
  const N = 380;
  const larguraValor = Math.max(larguraTexto(final, N), larguraTexto(formatar(partida, casas), N));
  const P = 150;
  const larguraPrefixo = m.prefixo ? larguraTexto(m.prefixo, P) + 20 : 0;
  const S = 168;
  const larguraSufixo = m.sufixo ? larguraTexto(m.sufixo, S) : 0;
  // o rótulo vai ao lado (em letreiro, debaixo do sufixo) quando é curto; senão, embaixo, em serifada
  const larguraRotulo = larguraTexto(m.rotulo, 34, ROTULO);
  const rotuloAoLado = !!m.sufixo && larguraRotulo <= Math.max(larguraSufixo, 380);
  const larguraLado = m.sufixo ? Math.max(larguraSufixo, rotuloAoLado ? larguraRotulo : 0) + 34 : 0;
  const qRotulo = rotuloAoLado
    ? null
    : encaixarNaCaixa(m.rotulo, { largura, altura: 124, max: 60, min: minimo.corpo, linhas: 2, alturaLinha: 1.04, estilo: () => SERIF });
  const alturaEmbaixo = qRotulo ? qRotulo.linhas.length * qRotulo.tamanho * 1.04 + 22 : 0;
  const alturaMarcadores = n ? 48 : 0;
  const alturaEtiqueta = m.ilustrativo ? 60 : 0;
  const escala = Math.min(
    1,
    (largura - 10) / (larguraPrefixo + larguraValor + larguraLado),
    (altura - 10 - alturaEmbaixo - alturaMarcadores - alturaEtiqueta) / (N * 0.84),
  );
  const rotuloEm = m.rotuloEm ?? m.em + 0.35;

  return (
    <Bloco t={t} ate={m.ate} style={{ width: "100%", textShadow: sombra }}>
      {m.ilustrativo ? (
        <div style={{ marginBottom: 20 }}>
          <Ilustrativo p={prog(t, m.em, 0.4)} />
        </div>
      ) : null}
      <div style={{ height: N * 0.84 * escala, display: "flex", alignItems: "flex-end", justifyContent: "center", width: "100%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            width: "max-content",
            whiteSpace: "nowrap",
            flexShrink: 0,
            scale: String(escala),
            transformOrigin: "center bottom",
          }}
        >
          {m.prefixo ? (
            <div style={{ marginRight: 20, paddingBottom: 30 }}>
              <Linha p={prog(t, m.em - 0.05, 0.5)} style={{ fontFamily: serif, fontSize: P, lineHeight: 0.8, color: cor.papel }}>
                {m.prefixo}
              </Linha>
            </div>
          ) : null}
          <div style={{ width: larguraValor, display: "flex", justifyContent: "center" }}>
            <Linha p={prog(t, m.em, 0.6)} style={{ fontFamily: serif, fontSize: N, lineHeight: 0.8, color: cor.lataoClaro }}>
              {texto}
            </Linha>
          </div>
          {m.sufixo ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", paddingBottom: 26, marginLeft: 34, flexShrink: 0 }}>
              <Linha p={prog(t, m.em + 0.14, 0.55)} style={{ fontFamily: serif, fontSize: S, lineHeight: 0.9, color: cor.papel }}>
                {m.sufixo}
              </Linha>
              {rotuloAoLado ? (
                <div style={{ ...rotulo, fontSize: 34, color: cor.papel, marginTop: 18, opacity: prog(t, rotuloEm, 0.4) }}>{m.rotulo}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {qRotulo ? (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {qRotulo.linhas.map((l, j) => (
            <Linha
              key={j}
              p={prog(t, rotuloEm + j * 0.08, 0.5)}
              style={{ fontFamily: serif, fontSize: qRotulo.tamanho, lineHeight: 1.04, color: cor.papel, whiteSpace: "nowrap" }}
            >
              {l.map((p) => p.w).join(" ")}
            </Linha>
          ))}
        </div>
      ) : null}
      {n > 0 ? <Marcadores n={n} t={t} inicio={m.em} /> : null}
    </Bloco>
  );
};

export const Numero: React.FC<{ m: TNumero; largura: number; altura: number }> = ({ m, largura, altura }) =>
  typeof m.valor === "number" ? (
    <NumeroQueConta m={m as NumeroUniversal} largura={largura} altura={altura} />
  ) : (
    <NumeroDoExemplo m={m as NumeroAntigo} largura={largura} altura={altura} />
  );
