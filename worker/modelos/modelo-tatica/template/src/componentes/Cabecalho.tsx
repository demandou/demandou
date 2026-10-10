// Cabeçalho da dica na prancheta: título grande (largo, caixa-alta) e linha de apoio, palavra por
// palavra na fala. A linha falada primeiro fica em cima.
import { Linhas, prog, saindo, temposDoTexto } from "../anim";
import type { Janela } from "../layout";
import type { Palavra } from "../plano";
import { diagramar, quebrarMedindo } from "../medidas";
import { CABECALHO, cor, larga, normal } from "../tema";

export const Cabecalho: React.FC<{ janela: Janela; palavras: Palavra[]; t: number }> = ({ janela, palavras, t }) => {
  const { dica, entra, sai } = janela;
  if (!dica.titulo) return null;
  // nada entra antes de a prancheta aparecer
  const inicio = entra + 0.28;
  const tTitulo = temposDoTexto(dica.titulo, palavras, dica.de, dica.ate, inicio);
  const tApoio = dica.apoio ? temposDoTexto(dica.apoio, palavras, dica.de, dica.ate, inicio) : [];
  const apoioAntes = dica.apoio ? (tApoio[0] ?? 0) < (tTitulo[0] ?? 0) : false;

  const L = CABECALHO.largura;
  const { linhas: tituloLinhas, tam: tamTitulo } = diagramar(dica.titulo.toUpperCase(), { largura: L, maximo: 88, minimo: 50, linhas: 3, linhasMax: 4 });
  const tamApoio = 48;
  const apoioLinhas = dica.apoio ? quebrarMedindo(dica.apoio, tamApoio, L, 3, "normal600") : [];
  // sai por baixo da pessoa que cresce: some só quando a caixa já passou por cima dele
  const op = 1 - saindo(t, sai + 0.42, 0.22);
  const pBarra = prog(t, entra + 0.2, 0.5);

  const titulo = (
    <Linhas
      key="titulo"
      linhas={tituloLinhas}
      tempos={tTitulo}
      t={t}
      fantasma={0.2}
      style={{ ...larga, fontSize: tamTitulo, color: cor.giz, gap: tamTitulo * 0.08 }}
    />
  );
  const apoio = dica.apoio ? (
    <Linhas key="apoio" linhas={apoioLinhas} tempos={tApoio} t={t} style={{ ...normal, fontSize: tamApoio, color: cor.giz, opacity: 0.86 }} />
  ) : null;

  return (
    <div style={{ position: "absolute", left: CABECALHO.x, top: CABECALHO.y, width: L, opacity: op }}>
      {/* régua amarela curta: marca o começo do cabeçalho e cresce quando a prancheta entra */}
      <div style={{ width: 96 * pBarra, height: 8, background: cor.placar, borderRadius: 4, marginBottom: 22 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{apoioAntes ? [apoio, titulo] : [titulo, apoio]}</div>
    </div>
  );
};
