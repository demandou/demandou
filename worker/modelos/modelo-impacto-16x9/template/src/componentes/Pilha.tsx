import { batida, temposDaLinha } from "../anim";
import type { LinhaDeImpacto, Palavra } from "../plano";
import { caber, caixaAlta, cor, sora, TRACKING } from "../tema";

export type LinhaMedida = { texto: string; tamanho: number; tempos: number[]; destaque?: boolean };

const ALTURA_LINHA = 1.0;
const VAO = 0.06;

// Mede a pilha: cada linha ocupa a largura toda da coluna (as curtas ficam enormes, as longas menores),
// até `maximo` px. Devolve as linhas e a altura total.
export const medirPilha = (
  itens: LinhaDeImpacto[],
  largura: number,
  maximo: number,
  palavras: Palavra[],
  limite = Infinity,
  alturaMaxima = 820,
) => {
  const medir = (fator: number) => {
    const linhas: LinhaMedida[] = itens.map((l, i) => {
      const texto = caixaAlta(l.texto);
      const proxima = itens[i + 1]?.em ?? limite;
      return {
        texto,
        tamanho: Math.floor(caber(texto, largura, maximo) * fator),
        tempos: temposDaLinha(l.texto, l.em, palavras, proxima),
        destaque: l.destaque,
      };
    });
    const altura = linhas.reduce((s, l, i) => s + l.tamanho * ALTURA_LINHA + (i > 0 ? l.tamanho * VAO : 0), 0);
    return { linhas, altura };
  };
  // pilha alta demais (muitas linhas): tudo encolhe junto, na mesma proporção
  const inteira = medir(1);
  return inteira.altura > alturaMaxima ? medir(alturaMaxima / inteira.altura) : inteira;
};

// Espaço entre as palavras de uma linha: margem fixa (não depende do caractere de espaço),
// igual ao que `larguraEm` conta para um espaço na Sora pesada.
export const ESPACO = "0.19em";

// Uma sequência de palavras que batem uma a uma, cada uma no seu tempo, com o espaço sempre certo
// entre elas (mesmo quando têm cores ou estilos diferentes).
export const Palavras: React.FC<{ t: number; texto: string; tempos: number[]; reserva?: number; vem?: "lado" | "baixo" }> = ({ t, texto, tempos, reserva, vem = "lado" }) => {
  const ws = texto.trim().split(/\s+/);
  return (
    <>
      {ws.map((w, k) => (
        <span
          key={`${w}-${k}`}
          style={{ display: "inline-block", marginRight: k < ws.length - 1 ? ESPACO : 0, ...batida(t, tempos[k] ?? tempos[0] ?? reserva ?? 0, vem) }}
        >
          {w}
        </span>
      ))}
    </>
  );
};

// Palavras grandes empilhadas; cada palavra bate na tela no instante em que é falada.
export const Pilha: React.FC<{
  t: number;
  linhas: LinhaMedida[];
  corTexto?: string;
}> = ({ t, linhas, corTexto = cor.papel }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    {linhas.map((l, i) => (
      <div
        key={`${l.texto}-${i}`}
        style={{
          fontFamily: sora,
          fontWeight: 800,
          fontSize: l.tamanho,
          lineHeight: ALTURA_LINHA,
          height: l.tamanho * ALTURA_LINHA,
          marginTop: i > 0 ? l.tamanho * VAO : 0,
          letterSpacing: `${TRACKING}em`,
          whiteSpace: "nowrap",
          color: l.destaque ? cor.volt : corTexto,
        }}
      >
        <Palavras t={t} texto={l.texto} tempos={l.tempos} />
      </div>
    ))}
  </div>
);
