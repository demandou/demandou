import { mixCor, PalavraWire, prog, saindo } from "../anim";
import { quebrar } from "../layoutPagina";
import type { Cta as TCta, Pagina } from "../plano";
import { CARTAO, cor, sans } from "../tema";
import { Check, Comentar, Link, Pino, Salvar, Seguir } from "./Icones";
import { TITULO, encaixar, larguraTexto } from "../medida";

// quando o marcador da ação acende: no plano, ou na primeira palavra (depois que o cartão já entrou)
export const instanteDoIcone = (m: TCta, tempos: number[], entra: number) => m.iconeEm ?? Math.max(tempos[0] ?? m.de + 0.2, entra + 0.3);

const ACOES = {
  salvar: { antes: "Salvar", depois: "Salvo", Icone: Salvar },
  seguir: { antes: "Seguir", depois: "Seguindo", Icone: Seguir },
  comentar: { antes: "Comentar", depois: "Comentado", Icone: Comentar },
  link: { antes: "Abrir link", depois: "Abrindo", Icone: Link },
};

// Fechamento: a pessoa em quadro cheio e um comentário na altura do peito com a chamada falada.
// O marcador da ação (salvar, seguir, comentar) acende quando ela é dita; no fim o comentário
// é marcado como resolvido, na cor da página.
export const Cta: React.FC<{
  t: number;
  m: TCta;
  // quando o cartão começa a entrar e quando sai (Infinity = fica até o fim)
  entra: number;
  fim: number;
  topo: number;
  tempos: number[];
  marca: { nome: string; area: string };
  pagina: Required<Pagina>;
}> = ({ t, m, entra: inicio, fim, topo, tempos, marca, pagina }) => {
  const entra = prog(t, inicio, 0.38);
  const sai = Number.isFinite(fim) ? saindo(t, fim, 0.3) : 0;
  if (entra <= 0 || sai >= 1) return null;
  const acao = ACOES[m.icone ?? "salvar"];
  const iconeEm = instanteDoIcone(m, tempos, inicio);
  const resolvidoEm = m.resolvidoEm ?? tempos[tempos.length - 1] ?? m.ate - 0.6;
  const aceso = prog(t, iconeEm, 0.25);
  const resolvido = prog(t, resolvidoEm, 0.3);

  // o texto cabe sempre: até 3 linhas, reduzido até um mínimo legível (medido com a própria fonte)
  const disponivel = CARTAO.w - 92;
  let tamanho = 62;
  let linhas = quebrar(m.texto, Math.floor(disponivel / (tamanho * 0.56)));
  const cabe = () => linhas.length <= 3 && linhas.every((l) => larguraTexto(l, tamanho, TITULO) <= disponivel);
  while (!cabe() && tamanho > 44) {
    tamanho -= 2;
    linhas = quebrar(m.texto, Math.floor(disponivel / (tamanho * 0.56)));
  }
  if (!cabe()) {
    const q = encaixar(m.texto, { largura: disponivel, max: tamanho, min: 40, linhas: 4, estilo: () => TITULO });
    tamanho = q.tamanho;
    linhas = q.linhas.map((l) => l.map((w) => w.w).join(" "));
  }
  const realce = new Set((m.destaque ?? "").split(/\s+/).filter(Boolean).map((w) => w.toLowerCase().replace(/[.,!?:;]$/, "")));
  let k = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO.x,
        top: topo,
        width: CARTAO.w,
        borderRadius: "12px 34px 34px 34px",
        background: cor.papel,
        boxShadow: "0 26px 60px rgba(10,10,12,0.32)",
        padding: "30px 46px 34px",
        boxSizing: "border-box",
        opacity: entra * (1 - sai),
        translate: `0 ${(1 - entra) * 60 - sai * 30}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Pino tamanho={64} cor={cor.vermelho} letra={(marca.nome || "C").trim().charAt(0).toUpperCase()} corLetra="#FFFFFF" fonte={sans} />
        <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 40, color: cor.tinta, whiteSpace: "nowrap" }}>{marca.nome || "Comentário"}</div>
        {marca.area ? <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 34, color: cor.tintaSuave, whiteSpace: "nowrap" }}>{marca.area}</div> : null}
        <div style={{ marginLeft: "auto", fontFamily: sans, fontWeight: 500, fontSize: 34, color: "#8C9098" }}>agora</div>
      </div>
      <div style={{ marginTop: 22, fontFamily: sans, fontWeight: 700, fontSize: tamanho, lineHeight: `${Math.round(tamanho * 1.1)}px`, color: cor.tinta }}>
        {linhas.map((l, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {l.split(" ").map((w, j) => (
              <PalavraWire key={j} t={t} em={tempos[k++] ?? m.de} texto={w} barra="#DADDE2" cor={realce.has(w.toLowerCase().replace(/[.,!?:;]$/, "")) ? cor.vermelho : undefined} margem={0.24} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26, display: "flex", gap: 18 }}>
        <div
          style={{
            height: 66,
            padding: "0 26px 0 20px",
            borderRadius: 33,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: mixCor("#ECEDEF", cor.vermelho, aceso),
            transform: `scale(${1 + 0.06 * Math.sin(Math.PI * aceso)})`,
          }}
        >
          <acao.Icone tamanho={36} cor={aceso > 0.5 ? "#FFFFFF" : cor.tinta} cheio={aceso} />
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: aceso > 0.5 ? "#FFFFFF" : cor.tinta }}>{aceso > 0.5 ? acao.depois : acao.antes}</div>
        </div>
        <div
          style={{
            height: 66,
            padding: "0 26px 0 20px",
            borderRadius: 33,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: mixCor("#ECEDEF", pagina.cor, resolvido),
            transform: `scale(${1 + 0.06 * Math.sin(Math.PI * resolvido)})`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              border: `3px solid ${cor.tinta}`,
              boxSizing: "border-box",
              background: resolvido > 0.5 ? cor.tinta : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check tamanho={22} cor={pagina.cor} espessura={4} p={resolvido} />
          </div>
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: cor.tinta }}>{resolvido > 0.5 ? "Resolvido" : "Resolver"}</div>
        </div>
      </div>
    </div>
  );
};
