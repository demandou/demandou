// O GC de telejornal (gerador de caracteres), na altura do peito, ancorado embaixo:
//   [aba azul elétrico: chapéu ou botão]
//   [tarja branca: o texto, palavra por palavra]
//   [tarja de nome: NOME · FUNÇÃO — ou outra tarja escura, como o significado da definição]
// Entra varrendo da esquerda (só o fundo é recortado; o texto aparece inteiro quando o fundo já
// abriu) e sai deslizando para a esquerda, cruzando com o que entra.
import { limitar, Linhas, prog, saindo, varredura } from "../anim";
import { caberNaAltura } from "../medidas";
import { cor, MARGEM, manchete, rotulo, W } from "../tema";

export const ALTURA_ABA = 62;
export const ALTURA_NOME = 64;
// largura útil do texto na tarja branca (margens de 60 + respiro interno de 32 de cada lado)
export const LARGURA_GC = W - 2 * MARGEM - 64;

// O corpo e as linhas do texto da tarja branca, cabendo na largura e na altura que sobra entre o
// queixo e o letreiro (com a aba e a tarja de baixo, quando existem).
export const textoDoGc = (
  texto: string,
  { alturaMax, aba, nome, maximo, minimo, linhas, rodape = 0 }: { alturaMax: number; aba: boolean; nome: boolean; maximo: number; minimo: number; linhas: number; rodape?: number },
) =>
  caberNaAltura(texto, {
    largura: LARGURA_GC,
    maximo,
    minimo,
    linhas,
    corte: { peso: 900, alta: true, espacamento: -0.01 },
    alturaMax,
    entrelinha: 1.06,
    extraPorTam: 0.42,
    extra: (aba ? ALTURA_ABA : 0) + (nome ? ALTURA_NOME : 0) + rodape,
  });

export const TarjaDeNome: React.FC<{ nome: string; area: string; p: number }> = ({ nome, area, p }) => (
  <div style={{ display: "flex", alignSelf: "flex-start", clipPath: varredura(p), background: cor.noite, height: ALTURA_NOME, alignItems: "center", gap: 18, padding: "0 26px" }}>
    <div style={{ ...rotulo, fontSize: 34, color: cor.branco, opacity: limitar((p - 0.5) / 0.4), translate: "0 1px" }}>{nome}</div>
    {area ? (
      <>
        <div style={{ width: 4, height: 30, background: cor.eletrico, opacity: limitar((p - 0.5) / 0.4) }} />
        <div style={{ ...rotulo, fontSize: 32, color: cor.celeste, opacity: limitar((p - 0.5) / 0.4), translate: "0 1px" }}>{area}</div>
      </>
    ) : null}
  </div>
);

export const Gc: React.FC<{
  t: number;
  de: number;
  fim: number;
  // base (px) da pilha: a tarja de baixo (ou a tarja branca) termina aqui
  base: number;
  aba?: React.ReactNode;
  abaEm?: number;
  // cor da aba (padrão: azul elétrico)
  abaCor?: string;
  linhas: string[];
  tempos: number[];
  tam: number;
  destaque?: Set<number>;
  marca?: { nome: string; area: string } | null;
  // outra tarja escura no lugar da tarja de nome
  rodape?: React.ReactNode;
}> = ({ t, de, fim, base, aba, abaEm, abaCor = cor.eletrico, linhas, tempos, tam, destaque, marca, rodape }) => {
  if (t < de - 0.02 || t > fim + 0.02) return null;
  const pCaixa = prog(t, de, 0.36);
  const pAba = prog(t, abaEm ?? de + 0.08, 0.32);
  const pNome = prog(t, de + 0.2, 0.34);
  const s = saindo(t, fim, 0.26);
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        bottom: 1920 - base,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        opacity: 1 - s,
        translate: `${-60 * s}px 0`,
      }}
    >
      {aba ? (
        <div style={{ clipPath: varredura(pAba), background: abaCor, height: ALTURA_ABA, display: "flex", alignItems: "center", padding: "0 24px" }}>
          <div style={{ opacity: limitar((pAba - 0.45) / 0.4), display: "flex", alignItems: "center" }}>{aba}</div>
        </div>
      ) : null}
      <div style={{ clipPath: varredura(pCaixa), background: cor.papel, padding: `${Math.round(tam * 0.2)}px 32px ${Math.round(tam * 0.22)}px` }}>
        <Linhas
          linhas={linhas}
          tempos={tempos}
          t={t}
          esboco={cor.apagadoNoPapel}
          corDe={(i) => (destaque?.has(i) ? cor.eletrico : cor.tinta)}
          entrelinha={Math.round(tam * 0.06)}
          style={{ ...manchete, fontSize: tam, opacity: limitar((pCaixa - 0.45) / 0.4) }}
        />
      </div>
      {rodape ?? (marca?.nome ? <TarjaDeNome nome={marca.nome} area={marca.area} p={pNome} /> : null)}
    </div>
  );
};
