// Número em destaque que conta até o valor dito, com a frase (ou o rótulo) por cima, o prefixo
// ("US$", "R$") antes e a unidade/sufixo ao lado com um ícone a traço. Formato pt-BR (83.000; 1,5).
// Usado no momento "numero" (bloco universal) e dentro do "resultado".
import { formatar, mistura, Palavras, prog, saindo, temposDoTexto } from "../anim";
import { larguraLinha } from "../medida";
import type { Icone as TIcone, Palavra } from "../plano";
import { caber, cor, fonte, sombraTexto } from "../tema";
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

const LARGURA = 1080 - 2 * 64;

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
  // no começo do vídeo o texto já aparece no primeiro quadro (a capa do Reels não fica vazia)
  const capa = de < 0.3;
  const tempos = (linhas.length ? temposDoTexto(linhas.join(" "), palavras, inicioTexto, textoAte, inicioTexto + 0.1) : []).map((x) =>
    capa && x < 0.45 ? x - 0.6 : Math.max(x, desde),
  );
  const tamanhoTexto = linhas.length ? Math.min(...linhas.map((l) => caber(l, LARGURA, 76))) : 0;
  let cursor = 0;
  const n = numero;
  const pN = n ? prog(t, n.em - 0.1, 0.45) : 0;
  const conta = n ? prog(t, n.em, Math.max(0.3, (n.emFim ?? n.em + 0.55) - n.em), (x) => 1 - (1 - x) ** 2) : 0;
  const casas = n ? (n.casas ?? (Number.isInteger(n.valor) ? 0 : 1)) : 0;
  const mostrado = n ? formatar(n.valor * conta, casas) : "";
  // encaixe: prefixo + número + unidade cabem na largura (tudo encolhe junto)
  let k = 1;
  if (n) {
    const final = formatar(n.valor, casas);
    const wPre = n.prefixo ? larguraLinha(n.prefixo, 112, { peso: 600 }) + 26 : 0;
    const wNum = larguraLinha(final, 300, { peso: 400 }) * 1.05;
    const wUni = n.unidade || n.icone ? 26 + Math.max(n.icone ? 120 : 0, n.unidade ? larguraLinha(n.unidade, 112, { peso: 600 }) : 0) : 0;
    k = Math.max(0.42, Math.min(1, LARGURA / (wPre + wNum + wUni)));
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: topo,
        width: LARGURA,
        fontFamily: fonte,
        color: cor.creme,
        textShadow: sombraTexto,
        opacity: 1 - sai,
        translate: `0 ${sai * 30}px`,
      }}
    >
      {linhas.map((l, i) => {
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
            }}
          />
        );
      })}
      {n && pN > 0 ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26 * k, marginTop: 6, opacity: pN, translate: `0 ${(1 - pN) * 30}px` }}>
          {n.prefixo ? <div style={{ fontSize: 112 * k, fontWeight: 600, lineHeight: 1, paddingBottom: 30 * k, whiteSpace: "nowrap" }}>{n.prefixo}</div> : null}
          <div style={{ fontSize: 300 * k, fontWeight: 400, lineHeight: 0.84, letterSpacing: "-0.05em", color: cor.blush, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {mostrado}
          </div>
          {n.unidade || n.icone ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 * k, paddingBottom: 18 * k }}>
              {n.icone ? (
                <div style={{ filter: "drop-shadow(0 2px 10px rgba(20,10,16,0.5))" }}>
                  <Icone nome={n.icone} p={prog(t, n.em + 0.1, 0.8)} tamanho={120 * k} cor={cor.creme} largura={6} preenchido={mistura(0, 0.18, prog(t, n.em + 0.8, 0.5))} />
                </div>
              ) : null}
              {n.unidade ? <div style={{ fontSize: 112 * k, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap" }}>{n.unidade}</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {n?.ilustrativo ? <Ilustrativo p={prog(t, n.em + 0.4, 0.4)} claro style={{ display: "inline-block", marginTop: 22, textShadow: "none" }} /> : null}
    </div>
  );
};
