// Cabeçalho dos painéis do estúdio: um quadradinho azul elétrico e o título em caixa-alta branca,
// palavra por palavra na fala (apagado "a lápis" até ser dito). Devolve a altura que ocupa.
import { Linhas, prog, temposDoTexto } from "../anim";
import { caber } from "../medidas";
import type { Palavra } from "../plano";
import { cor, manchete, MARGEM, W } from "../tema";

export const medirCabecalho = (titulo: string | undefined) => {
  if (!titulo?.trim()) return null;
  const d = caber(titulo, { largura: W - 2 * MARGEM - 40, maximo: 52, minimo: 38, linhas: 2, corte: { peso: 900, alta: true, espacamento: -0.01 } });
  return { ...d, altura: Math.round(d.linhas.length * d.tam * 1.06) };
};

export const Cabecalho: React.FC<{
  titulo: string;
  medida: { linhas: string[]; tam: number; altura: number };
  palavras: Palavra[];
  t: number;
  de: number;
  ate: number;
  inicio: number;
  y: number;
}> = ({ titulo, medida, palavras, t, de, ate, inicio, y }) => {
  const tempos = temposDoTexto(titulo, palavras, de, ate, inicio);
  const pMarca = prog(t, inicio - 0.1, 0.3);
  return (
    <div style={{ position: "absolute", left: MARGEM, top: y, display: "flex", gap: 22, alignItems: "flex-start" }}>
      <div style={{ width: 18, height: Math.round(medida.tam * 0.72), marginTop: Math.round(medida.tam * 0.12), background: cor.eletrico, scale: `1 ${0.2 + 0.8 * pMarca}`, transformOrigin: "50% 100%" }} />
      <Linhas linhas={medida.linhas} tempos={tempos} t={t} esboco={cor.apagadoNoAzul} corDe={() => cor.branco} entrelinha={Math.round(medida.tam * 0.06)} style={{ ...manchete, fontSize: medida.tam }} />
    </div>
  );
};
