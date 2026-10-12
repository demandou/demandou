import { Easing } from "remotion";
import { batida, contar, prog, saindo, temposDaLinha, useTempo } from "../anim";
import type { Numero as TNumero, Palavra } from "../plano";
import { caber, caixaAlta, cor, larguraMonoEm, mono, rotulo, sora, TRACKING } from "../tema";
import { alinhar, alturaDe, formatarNumero, montarCartaz } from "../texto";
import { Cartaz } from "./Cartaz";
import { encolherPara, topoNaFaixa } from "./Coluna";
import type { Contexto } from "./contexto";
import { Palavras } from "./Pilha";

// O número do jeito que aparece na tela, a partir dos campos universais ou dos antigos
// (`valor` em texto, `unidade`, `grifoEm`). Número grande demais para ficar gigante na coluna
// (83000) vira "83" + "mil" (o mesmo número, do jeito que se fala).
export const numeroDoPlano = (m: TNumero, palavras: Palavra[], largura = 1048) => {
  const antigo = typeof m.valor === "string";
  let palavra = "";
  let valor: string;
  if (antigo) valor = m.valor as string;
  else {
    const v = m.valor as number;
    const cheio = formatarNumero(v, m.casas ?? 0);
    const tamCheio = largura / Math.max(0.5, larguraMonoEm(cheio) - 0.04 * cheio.length);
    const abs = Math.abs(v);
    const base = abs >= 1e9 ? 1e9 : abs >= 1e6 ? 1e6 : 1e3;
    const r = v / base;
    // só abrevia quando fica exato (83000 → 83 mil; 1500000 → 1,5 mi), nunca arredondando
    const exato = Math.abs(r * 10 - Math.round(r * 10)) < 1e-6;
    // ano (1931, 2007): sem ponto de milhar
    const ano = Number.isInteger(v) && v >= 1000 && v <= 2100 && !m.prefixo && !m.sufixo && !(m.casas ?? 0);
    if (ano) valor = String(v);
    else if (!m.sufixo && abs >= 10000 && tamCheio < 170 && exato) {
      valor = formatarNumero(r, Number.isInteger(r) ? 0 : 1);
      palavra = base === 1e9 ? "bi" : base === 1e6 ? "mi" : "mil";
    } else valor = cheio;
  }
  const em = m.em ?? m.grifoEm ?? m.de + 0.6;
  // sufixo que é palavra ("kg", "anos", "mil") vira uma linha grande embaixo do número
  const sufixo = m.sufixo?.trim() ?? "";
  if (sufixo.length > 2) palavra = sufixo;
  const rotuloTexto = m.rotulo ?? m.unidade ?? "";
  // o rótulo bate na palavra dele (rotuloEm) ou nas palavras ditas logo depois do número
  const rotuloEm = m.rotuloEm ?? em + 0.1;
  const alvo = antigo ? Number((m.valor as string).replace(/\D/g, "")) || 0 : Math.abs(m.valor as number);
  const inteiro = antigo || (Number.isInteger(m.valor) && (m.casas ?? 0) === 0);
  const marcadores = m.marcadores ?? (inteiro && alvo > 0 && alvo <= 30 ? alvo : 24);
  const tempos = rotuloTexto ? alinhar(rotuloTexto, palavras, rotuloEm, m.ate).map((x) => Math.max(x, rotuloEm)) : [];
  const palavraEm = palavra ? Math.max(em + 0.05, alinhar(palavra, palavras, em + 0.05, m.ate)[0]) : em;
  return { valor, em, rotuloTexto, tempos, marcadores, palavra, palavraEm, sufixoCurto: sufixo.length <= 2 ? sufixo : "" };
};

// Número gigante que conta até o valor e trava no instante em que é falado, com marcadores que
// enchem junto (20 minutos = 20 marcadores). A moeda fica pequena em cima; o sufixo curto (%, x) cola
// no número; a palavra do número ("mil", "kg") e o rótulo vêm embaixo, em palavras enormes.
export const Numero: React.FC<{ m: TNumero; ctx: Contexto }> = ({ m, ctx }) => {
  const t = useTempo();
  const { coluna, yc, vemDe, palavras, fim } = ctx;
  const W = coluna.w;
  const { valor, em, rotuloTexto, tempos, marcadores: n, palavra, palavraEm, sufixoCurto } = numeroDoPlano(m, palavras, W);

  // moeda e prefixos ficam numa linha pequena em cima; sufixo curto (%, x) cola no número
  const prefixo = m.prefixo?.trim() ?? "";
  const emDoTexto = larguraMonoEm(valor) - 0.04 * valor.length + (sufixoCurto ? larguraMonoEm(sufixoCurto) - 0.04 * sufixoCurto.length : 0);
  // no quadro deitado (mais baixo) o número gigante tem teto de 300 px
  const tamValor = Math.max(60, Math.min(300, Math.floor(W / Math.max(0.5, emDoTexto))));
  const tamPrefixo = prefixo ? Math.max(48, Math.min(80, Math.round(tamValor * 0.3))) : 0;
  const hPrefixo = prefixo ? tamPrefixo + 10 : 0;
  // a palavra do número ("mil", "kg") em Sora, grande, como a unidade do exemplo
  const tamPalavra = palavra ? caber(caixaAlta(palavra), W, 190) : 0;
  const hPalavra = palavra ? tamPalavra * 0.95 + 14 : 0;

  // o rótulo em cartaz de até 2 linhas
  const linhasRot = rotuloTexto ? montarCartaz(rotuloTexto, W, { maximo: 190, maxLinhas: 2, alturaMax: 330 }).linhas : [];
  const hRot = linhasRot.length ? alturaDe(linhasRot) : 0;

  const compl = m.complemento ? caixaAlta(m.complemento.texto) : "";
  const tamCompl = compl ? caber(compl, W, 96) : 0;
  const tag = m.ilustrativo ? 64 : 0;

  const hValor = tamValor * 0.82;
  const hMarc = n > 0 ? 40 : 0;
  const altura = tag + hPrefixo + hValor + hPalavra + (hRot ? 14 + hRot : 0) + (n > 0 ? 40 + hMarc : 0) + (compl ? 40 + tamCompl : 0);
  // alto demais para a faixa do quadro deitado: o bloco inteiro encolhe junto até caber
  const encolhe = encolherPara(altura, ctx);
  const topo = topoNaFaixa(altura * encolhe, { ...ctx, yc });

  // a contagem começa quando a caixa já abriu o espaço e trava no instante em que o número é falado
  const inicio = m.de + 0.18;
  const p = prog(t, inicio, Math.max(0.3, em - inicio), Easing.out(Easing.quad));
  const travou = t >= em - 0.02;
  const pancada = prog(t, em - 0.02, 0.22);
  const s = saindo(t, ctx.saida, 0.12);
  const tempoCompl = m.complemento ? temposDaLinha(m.complemento.texto, m.complemento.em, palavras, m.ate) : [];
  const empurrao = 1 + 0.03 * prog(t, m.de, Math.max(1, fim - m.de), (x) => x);
  const prep = { linhas: linhasRot, altura: hRot, tempos, destaque: new Set<number>(), risco: new Set<number>() };
  const corValor = travou ? cor.volt : cor.papel;
  return (
    <div
      style={{
        position: "absolute",
        left: coluna.x,
        top: topo,
        width: W,
        opacity: 1 - s,
        scale: String(empurrao * encolhe),
        transformOrigin: encolhe < 1 ? "left top" : vemDe === "direita" ? "left center" : "right center",
      }}
    >
      {m.ilustrativo ? (
        <div style={{ height: tag }}>
          <span
            style={{
              ...rotulo,
              fontSize: 30,
              letterSpacing: "0.14em",
              color: cor.papel,
              opacity: 0.7 * prog(t, m.de + 0.05, 0.2),
              border: `2px solid ${cor.trilho}`,
              padding: "7px 12px 5px",
            }}
          >
            ilustrativo
          </span>
        </div>
      ) : null}
      {prefixo ? (
        <div style={{ height: hPrefixo, fontFamily: mono, fontWeight: 800, fontSize: tamPrefixo, lineHeight: 1, letterSpacing: "-0.02em", color: corValor, opacity: prog(t, m.de, 0.08), whiteSpace: "nowrap" }}>
          {prefixo}
        </div>
      ) : null}
      <div
        style={{
          height: hValor,
          opacity: prog(t, m.de, 0.08),
          scale: String(travou ? 1 + 0.07 * (1 - pancada) : 1),
          transformOrigin: "left bottom",
          fontFamily: mono,
          fontWeight: 800,
          fontSize: tamValor,
          lineHeight: 0.82,
          letterSpacing: "-0.04em",
          color: corValor,
          whiteSpace: "nowrap",
        }}
      >
        {travou ? valor : contar(valor, p)}
        {sufixoCurto}
      </div>
      {palavra ? (
        <div
          style={{
            marginTop: 14,
            height: tamPalavra * 0.95,
            fontFamily: sora,
            fontWeight: 800,
            fontSize: tamPalavra,
            lineHeight: 0.95,
            letterSpacing: `${TRACKING}em`,
            color: cor.papel,
            whiteSpace: "nowrap",
            ...batida(t, palavraEm),
          }}
        >
          {caixaAlta(palavra)}
        </div>
      ) : null}
      {hRot ? (
        <div style={{ marginTop: 14 }}>
          <Cartaz t={t} p={prep} />
        </div>
      ) : null}
      {n > 0 ? (
        <div style={{ display: "flex", gap: n > 20 ? 5 : 7, marginTop: 40, height: hMarc, opacity: prog(t, m.de, 0.1) }}>
          {Array.from({ length: n }).map((_, i) => {
            const cheio = (travou ? 1 : p) * n >= i + 1;
            return <div key={i} style={{ flex: 1, background: cheio ? (travou ? cor.volt : cor.papel) : cor.trilho }} />;
          })}
        </div>
      ) : null}
      {compl ? (
        <div
          style={{
            marginTop: 40,
            fontFamily: sora,
            fontWeight: 800,
            fontSize: tamCompl,
            lineHeight: 1,
            letterSpacing: `${TRACKING}em`,
            color: cor.volt,
            whiteSpace: "nowrap",
          }}
        >
          <Palavras t={t} texto={compl} tempos={tempoCompl} reserva={m.complemento?.em} />
        </div>
      ) : null}
    </div>
  );
};
