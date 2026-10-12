import { Linha, marcaNoGrupo, Palavras, prog, saindo, temposDoTexto, useTempo } from "../anim";
import { encaixarNaCaixa, larguraTexto, SERIF } from "../medida";
import type { Definicao as TDefinicao, Palavra } from "../plano";
import { cor, minimo, serif } from "../tema";
import { Ajuste, type Folga, Papel } from "./Pecas";

// Definição: um verbete no papel do cartão-documento. O termo em serifada grande; quando o
// significado é dito, um fio de latão se desenha e o significado se escreve palavra por palavra;
// no fim, o marca-texto de latão passa por baixo dele.
export const Definicao: React.FC<{ m: TDefinicao; palavras: Palavra[]; largura: number; altura: number; folga?: Folga }> = ({
  m,
  palavras,
  largura,
  altura,
  folga,
}) => {
  const t = useTempo();
  const sai = saindo(t, m.ate);
  const padX = 44;
  const interno = largura - 2 * padX;
  const medir = (limite: number) => {
    const disponivel = limite - 6 - 34 - 40;
    const qTermo = encaixarNaCaixa(m.termo, { largura: interno, altura: disponivel * 0.48, max: 124, min: minimo.titulo, linhas: 2, alturaLinha: 1.0 });
    const alturaTermo = qTermo.linhas.length * qTermo.tamanho * 1.0;
    const qSig = encaixarNaCaixa(m.significado, {
      largura: interno,
      altura: disponivel - alturaTermo - 44,
      max: 60,
      min: minimo.corpo,
      linhas: 3,
      alturaLinha: 1.16,
    });
    return { qTermo, qSig, total: 6 + 34 + alturaTermo + 42 + qSig.linhas.length * qSig.tamanho * 1.16 + 40 };
  };
  // na zona, se o significado ficar legível; senão, com a folga
  let med = medir(folga?.zona ?? altura);
  if (folga && (med.qSig.tamanho < 50 || med.qTermo.tamanho < 96)) med = medir(Math.min(altura, 560));
  const { qTermo, qSig } = med;
  // o papel entra junto com o termo (nunca um cartão em branco esperando)
  const entrada = Math.max(m.de, m.em - 0.2);
  const tempos = temposDoTexto(m.significado, palavras, m.significadoEm, m.ate);
  const ws = m.significado.split(/\s+/).filter(Boolean);
  const larguras = ws.map((w) => larguraTexto(w, qSig.tamanho, SERIF));
  const fim = tempos[tempos.length - 1] ?? m.significadoEm;
  const grifo = marcaNoGrupo(
    ws.map((_, i) => i),
    larguras,
    prog(t, fim + 0.3, 0.9),
  );

  return (
    <Ajuste h={med.total} folga={folga}>
    <Papel t={t} de={entrada} ate={m.ate} sai={sai}>
      <div>
        {qTermo.linhas.map((l, j) => (
          <Linha key={j} p={prog(t, entrada + 0.05 + j * 0.08, 0.55)} style={{ fontFamily: serif, fontSize: qTermo.tamanho, lineHeight: 1.0, color: cor.tinta, whiteSpace: "nowrap" }}>
            {l.map((p) => p.w).join(" ")}
          </Linha>
        ))}
      </div>
      <div style={{ height: 2, background: cor.latao, margin: "18px 0 22px", width: `${prog(t, m.significadoEm - 0.2, 0.6) * 100}%` }} />
      <Palavras
        linhas={qSig.linhas}
        tempos={tempos}
        t={t}
        tamanho={qSig.tamanho}
        alturaLinha={1.16}
        alinhar="left"
        estilo={() => SERIF}
        cor={() => "rgba(14,23,38,0.88)"}
        marca={(i) => ({ tipo: "grifo", cor: "rgba(185,151,91,0.55)", p: grifo.get(i) ?? 0, liga: true })}
      />
    </Papel>
    </Ajuste>
  );
};
