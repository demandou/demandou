// Número em destaque que conta até o valor dito, com a frase (ou o rótulo) por cima, o prefixo
// ("US$", "R$") antes e a unidade/sufixo ao lado com um ícone a traço. Formato pt-BR (83.000; 1,5).
// Usado no momento "numero" (bloco universal) e dentro do "resultado".
// No quadro deitado (src/fileira.ts) fica na faixa larga abaixo do queixo: as linhas da frase que
// cabem lado a lado viram uma fileira só (a primeira em blush), e o número encolhe junto com o
// prefixo e o sufixo até caber na largura E na altura da faixa.
import { formatar, mistura, Palavras, prog, saindo, temposDoTexto } from "../anim";
import { assentar, LARGURA_PEITO } from "../fileira";
import { larguraLinha } from "../medida";
import type { Icone as TIcone, Palavra } from "../plano";
import { BASE_TEXTO, caber, cor, deitado, fonte, MARGEM, sombraTexto } from "../tema";
import { Ilustrativo } from "./Cartoes";
import { Icone } from "./Icones";

export type NumeroDoBloco = {
  valor: number;
  unidade?: string;
  prefixo?: string;
  casas?: number;
  em: number;
  emFim?: number;
  icone?: TIcone;
  ilustrativo?: boolean;
};

const LARGURA = LARGURA_PEITO;
// tamanhos do vertical no quadro deitado
const PREFIXO = deitado(112);
const NUMERO = deitado(300);
const ICONE = deitado(120);
// espaço entre duas linhas da frase quando elas ficam lado a lado
const VAO_FILEIRA = 0.32;

export const BlocoNumero: React.FC<{
  t: number;
  de: number;
  fim: number;
  palavras: Palavra[];
  texto?: string | string[];
  // de onde procurar as palavras do texto na fala (padrão: `de`)
  textoDe?: number;
  textoAte: number;
  numero?: NumeroDoBloco;
  topo: number;
  // o texto só entra depois que a pessoa volta para a tela cheia (quando vinha de um painel)
  desde?: number;
}> = ({ t, de, fim, palavras, texto, textoDe, textoAte, numero, topo, desde = de }) => {
  const sai = saindo(t, fim, 0.35);
  if (sai >= 1) return null;
  const linhas = texto === undefined ? [] : Array.isArray(texto) ? texto : [texto];
  const inicioTexto = textoDe ?? de;
  // no começo do vídeo o texto já aparece no primeiro quadro (a capa não fica vazia)
  const capa = de < 0.3;
  const tempos = (linhas.length ? temposDoTexto(linhas.join(" "), palavras, inicioTexto, textoAte, inicioTexto + 0.1) : []).map((x) =>
    capa && x < 0.45 ? x - 0.6 : Math.max(x, desde),
  );
  // fileira: as linhas cabem lado a lado na largura num corpo bom? então ficam numa linha só
  const juntas = linhas.join(" ");
  const corpoJuntas = linhas.length > 1 ? caber(juntas, LARGURA - linhas.length * 40, deitado(76)) : 0;
  const fileira = linhas.length > 1 && corpoJuntas >= 52;
  const tamanhoTexto = !linhas.length ? 0 : fileira ? corpoJuntas : Math.min(...linhas.map((l) => caber(l, LARGURA, deitado(76))));
  const alturaTexto = !linhas.length ? 0 : (fileira ? 1 : linhas.length) * tamanhoTexto * 1.15;
  let cursor = 0;
  const n = numero;
  const pN = n ? prog(t, n.em - 0.1, 0.45) : 0;
  const conta = n ? prog(t, n.em, Math.max(0.3, (n.emFim ?? n.em + 0.55) - n.em), (x) => 1 - (1 - x) ** 2) : 0;
  const casas = n ? (n.casas ?? (Number.isInteger(n.valor) ? 0 : 1)) : 0;
  const mostrado = n ? formatar(n.valor * conta, casas) : "";
  // encaixe: prefixo + número + unidade cabem na largura e na altura da faixa (tudo encolhe junto)
  const ilustrativoH = n?.ilustrativo ? 22 + 52 : 0;
  let k = 1;
  if (n) {
    const final = formatar(n.valor, casas);
    const wPre = n.prefixo ? larguraLinha(n.prefixo, PREFIXO, { peso: 600 }) + 26 : 0;
    const wNum = larguraLinha(final, NUMERO, { peso: 400 }) * 1.05;
    const wUni = n.unidade || n.icone ? 26 + Math.max(n.icone ? ICONE : 0, n.unidade ? larguraLinha(n.unidade, PREFIXO, { peso: 600 }) : 0) : 0;
    const altura = BASE_TEXTO - topo - alturaTexto - 6 - ilustrativoH;
    k = Math.max(0.42, Math.min(1, LARGURA / (wPre + wNum + wUni), altura / (NUMERO * 0.84)));
  }
  const alturaTotal = alturaTexto + (n ? 6 + NUMERO * 0.84 * k : 0) + ilustrativoH;

  const linhaDaFrase = (l: string, i: number, extra?: React.CSSProperties) => {
    const nl = l.split(/\s+/).filter(Boolean).length;
    const fatia = tempos.slice(cursor, cursor + nl);
    cursor += nl;
    const destaque = linhas.length > 1 && i === 0;
    return (
      <Palavras
        key={i}
        texto={l}
        tempos={fatia}
        t={t}
        style={{
          fontSize: tamanhoTexto,
          fontWeight: destaque ? 600 : 500,
          color: destaque ? cor.blush : undefined,
          lineHeight: 1.15,
          height: tamanhoTexto * 1.15,
          ...extra,
        }}
      />
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: assentar(topo, alturaTotal),
        width: LARGURA,
        fontFamily: fonte,
        color: cor.creme,
        textShadow: sombraTexto,
        opacity: 1 - sai,
        translate: `0 ${sai * 30}px`,
      }}
    >
      {fileira ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: `${VAO_FILEIRA}em`, fontSize: tamanhoTexto }}>{linhas.map((l, i) => linhaDaFrase(l, i))}</div>
      ) : (
        linhas.map((l, i) => linhaDaFrase(l, i))
      )}
      {n && pN > 0 ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26 * k, marginTop: 6, opacity: pN, translate: `0 ${(1 - pN) * 30}px` }}>
          {n.prefixo ? <div style={{ fontSize: PREFIXO * k, fontWeight: 600, lineHeight: 1, paddingBottom: 30 * k, whiteSpace: "nowrap" }}>{n.prefixo}</div> : null}
          <div style={{ fontSize: NUMERO * k, fontWeight: 400, lineHeight: 0.84, letterSpacing: "-0.05em", color: cor.blush, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {mostrado}
          </div>
          {n.unidade || n.icone ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 * k, paddingBottom: 18 * k }}>
              {n.icone ? (
                <div style={{ filter: "drop-shadow(0 2px 10px rgba(20,10,16,0.5))" }}>
                  <Icone nome={n.icone} p={prog(t, n.em + 0.1, 0.8)} tamanho={ICONE * k} cor={cor.creme} largura={6} preenchido={mistura(0, 0.18, prog(t, n.em + 0.8, 0.5))} />
                </div>
              ) : null}
              {n.unidade ? <div style={{ fontSize: PREFIXO * k, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" }}>{n.unidade}</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {n?.ilustrativo ? <Ilustrativo p={prog(t, n.em + 0.4, 0.4)} claro style={{ display: "inline-block", marginTop: 22, textShadow: "none" }} /> : null}
    </div>
  );
};
