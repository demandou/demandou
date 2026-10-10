// Fechamento em quadro cheio: o GC com a chamada falada (cada palavra acende quando é dita), a
// tarja de nome embaixo e, na aba azul, o botão da chamada — "+ SEGUIR" vira "✓ SEGUINDO" quando a
// frase termina; "SALVAR" vira "SALVO"; no link, a seta anda.
import { indicesDoDestaque, limitar, prog, temposDoTexto } from "../anim";
import type { Cta as C, Palavra, Plano } from "../plano";
import { cor, rotulo } from "../tema";
import { Gc, textoDoGc } from "./Gc";
import { Balao, Elo, Enviar, Marcador, Mais, Visto } from "./Icones";

const TEXTOS = {
  seguir: ["Seguir", "Seguindo"],
  salvar: ["Salvar", "Salvo"],
  comentar: ["Comente", "Comente"],
  link: ["Acesse", "Acesse"],
  compartilhar: ["Compartilhe", "Compartilhe"],
} as const;

export const Cta: React.FC<{ m: C; plano: Plano; palavras: Palavra[]; t: number; base: number; fim: number; alturaMax: number }> = ({
  m,
  plano,
  palavras,
  t,
  base,
  fim,
  alturaMax,
}) => {
  const comNome = !!plano.marca?.nome;
  const { linhas, tam } = textoDoGc(m.texto, { alturaMax, aba: true, nome: comNome, maximo: 92, minimo: 56, linhas: 3 });
  const inicio = Math.max(m.de + 0.14, m.em ?? 0);
  const tempos = temposDoTexto(m.texto, palavras, m.de, m.ate, inicio);
  const faladas = palavras.filter((p) => p.em >= m.de - 0.1 && p.em < Math.min(fim, plano.duracao));
  const fimDaFala = faladas.length ? faladas[faladas.length - 1].ate : (tempos[tempos.length - 1] ?? m.de) + 0.4;
  const icone = m.icone && TEXTOS[m.icone] ? m.icone : "seguir";
  const pFeito = prog(t, fimDaFala + 0.1, 0.32);
  const [antes, depoisPadrao] = TEXTOS[icone];
  const rotuloAntes = m.botao ?? antes;
  const rotuloDepois = m.botao ? m.botao : depoisPadrao;
  const tamIcone = 34;
  const simbolo =
    icone === "seguir" ? (
      <span style={{ position: "relative", width: tamIcone, height: tamIcone, display: "inline-block" }}>
        <Mais tamanho={tamIcone} cor={cor.branco} style={{ position: "absolute", inset: 0, opacity: 1 - pFeito, rotate: `${pFeito * 90}deg` }} />
        <Visto tamanho={tamIcone} cor={cor.branco} p={pFeito} style={{ position: "absolute", inset: 0 }} />
      </span>
    ) : icone === "salvar" ? (
      <Marcador tamanho={tamIcone} cor={cor.branco} cheio={pFeito > 0.5} />
    ) : icone === "comentar" ? (
      <Balao tamanho={tamIcone} cor={cor.branco} />
    ) : icone === "link" ? (
      <Elo tamanho={tamIcone} cor={cor.branco} style={{ translate: `${Math.sin(limitar(pFeito) * Math.PI) * 6}px 0` }} />
    ) : (
      <Enviar tamanho={tamIcone} cor={cor.branco} />
    );
  return (
    <Gc
      t={t}
      de={m.de}
      fim={fim}
      base={base}
      abaEm={m.de + 0.1}
      aba={
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {simbolo}
          {/* as duas palavras empilhadas na mesma célula: a aba já nasce com a largura da maior */}
          <span style={{ display: "inline-grid", ...rotulo, fontSize: 36, color: cor.branco, translate: "0 1px" }}>
            <span style={{ gridArea: "1 / 1", opacity: rotuloAntes === rotuloDepois ? 1 : 1 - limitar(pFeito * 2) }}>{rotuloAntes}</span>
            {rotuloAntes === rotuloDepois ? null : <span style={{ gridArea: "1 / 1", opacity: limitar(pFeito * 2 - 0.6) }}>{rotuloDepois}</span>}
          </span>
        </div>
      }
      linhas={linhas}
      tempos={tempos}
      tam={tam}
      destaque={indicesDoDestaque(m.texto, m.destaque)}
      marca={comNome ? plano.marca : null}
    />
  );
};
