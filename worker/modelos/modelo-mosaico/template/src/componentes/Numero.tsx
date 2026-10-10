import { assenta, prog } from "../anim";
import { encaixar, formatarNumero, larguraTexto } from "../medida";
import type { Numero as TNumero } from "../plano";
import { display } from "../tema";
import { F_NUMERO, F_TITULO, Ilustrativo, respiro, type PropsBloco } from "./comum";

// largura de um número com algarismos de largura igual (o mais largo vale para todos)
const larguraDoNumero = (texto: string, tamanho: number) => larguraTexto(texto.replace(/\d/g, "0"), tamanho, F_NUMERO);

// Número em destaque que conta até o valor (do `em` até ~1,2 s depois, ou até `emFim`), com o prefixo
// ("US$", "R$") e o sufixo ("mil", "%", "kg") menores ao lado — ou em cima e embaixo, se não couberem — e o
// rótulo que diz o que ele é. O número é o herói: ocupa a largura do bloco.
export const Numero: React.FC<PropsBloco<TNumero>> = ({ b, t, w, h, util, pal, janela }) => {
  const pad = respiro(w, h);
  const alto = Math.min(h, util);
  const interna = w - 2 * pad;
  const em = b.em ?? janela.de + 0.2;
  const fim = b.emFim ?? em + 1.2;
  const p = prog(t, em, Math.max(0.3, fim - em), assenta);
  const casas = b.casas ?? (Number.isInteger(b.valor) ? 0 : 1);
  const final = formatarNumero(b.valor, casas);
  const texto = formatarNumero(b.valor * p, casas);
  const prefixo = b.prefixo?.trim() ?? "";
  const sufixo = (b.sufixo ?? b.unidade ?? "").trim();
  const rotulo = (b.rotulo ?? b.texto ?? "").trim();
  const rotuloEm = b.rotuloEm ?? Math.max(em, fim - 0.35);
  const chip = b.ilustrativo ? 60 : 0;

  // rótulo medido (até 2 linhas) embaixo do número
  const rot = rotulo ? encaixar(rotulo, { largura: interna, max: 64, min: 40, linhas: 2, fonte: F_TITULO, entrelinha: 1.08 }) : null;
  const altRotulo = rot ? rot.altura + 18 : 0;
  const altNumero = alto - 2 * pad - altRotulo - chip;

  // prefixo e sufixo ao lado (0,42 do corpo) se couber; senão, empilhados
  const fator = 0.42;
  const largAfixos = (tam: number) =>
    (prefixo ? larguraTexto(prefixo, Math.max(40, tam * fator), F_TITULO) + tam * 0.08 : 0) + (sufixo ? larguraTexto(sufixo, Math.max(40, tam * fator), F_TITULO) + tam * 0.08 : 0);
  const porLargura = (lado: boolean) => {
    let tam = 340;
    while (tam > 60 && larguraDoNumero(final, tam) + (lado ? largAfixos(tam) : 0) > interna) tam -= 4;
    return tam;
  };
  const tamLado = Math.min(porLargura(true), altNumero / 0.9);
  const afixoEmpilhado = (tam: number) => (prefixo ? Math.max(40, tam * fator) * 1.1 : 0) + (sufixo ? Math.max(40, tam * fator) * 1.1 : 0);
  let tamSozinho = porLargura(false);
  while (tamSozinho > 60 && tamSozinho * 0.9 + afixoEmpilhado(tamSozinho) > altNumero) tamSozinho -= 4;
  const aoLado = (!prefixo && !sufixo) || tamLado >= tamSozinho * 0.8;
  const tam = Math.max(60, aoLado ? tamLado : tamSozinho);
  const tamAfixo = Math.max(40, Math.round(tam * fator));

  const pNum = prog(t, em - 0.1, 0.3);
  const pAfixo = prog(t, em + 0.15, 0.4);
  const pRotulo = prog(t, rotuloEm, 0.5);
  // o rótulo dito antes do número fica em cima dele (como um chapéu); dito depois, embaixo
  const antes = rotuloEm < em;
  const rotuloEl = rot ? (
    <div style={{ [antes ? "marginBottom" : "marginTop"]: 14, fontFamily: display, fontWeight: 700, fontSize: rot.tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: pal.suave, opacity: pRotulo, translate: pRotulo < 0.999 ? `0 ${(1 - pRotulo) * 14}px` : undefined }}>
      {rot.linhas.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
    </div>
  ) : null;
  const afixo = (s: string) => (
    <div style={{ fontFamily: display, fontWeight: 700, fontSize: tamAfixo, lineHeight: 1, color: pal.acento, letterSpacing: "-0.02em", opacity: pAfixo, whiteSpace: "nowrap" }}>{s}</div>
  );
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {b.ilustrativo ? <Ilustrativo pal={pal} p={prog(t, janela.de + 0.2, 0.4)} style={{ left: pad, top: pad }} /> : null}
      <div style={{ position: "absolute", left: pad, top: pad + chip, width: interna, height: alto - 2 * pad - chip, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 }}>
        {rot && antes ? rotuloEl : null}
        {!aoLado && prefixo ? afixo(prefixo) : null}
        <div style={{ display: "flex", alignItems: "baseline", gap: tam * 0.08, opacity: pNum }}>
          {aoLado && prefixo ? afixo(prefixo) : null}
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: tam, lineHeight: 0.86, letterSpacing: "-0.04em", color: pal.texto, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{texto}</div>
          {aoLado && sufixo ? afixo(sufixo) : null}
        </div>
        {!aoLado && sufixo ? afixo(sufixo) : null}
        {rot && !antes ? rotuloEl : null}
      </div>
    </div>
  );
};
