import { saindo, temposDasPalavras, useTempo, usePalavras } from "../anim";
import { LIMITE_APP, TOPO_DO_APP, type Estado } from "../layout";
import { encaixar } from "../medida";
import type { Letreiro as LetreiroT } from "../plano";
import { cor, serif, sombra } from "../tema";
import { NaBarra } from "./Barras";
import { Digitos, ehNumerico, LARGURA_ALGARISMO, RotuloDeCredito } from "./Cartela";
import { DesenhoDaCartela, LARGURA_DO_DESENHO, PROPORCAO_DO_DESENHO } from "./Desenhos";
import { LinhasEmFoco, quebrarEmLinhas, TextoEmFoco } from "./Foco";

const palavrasDe = (s: string) => s.split(/\s+/).filter(Boolean);

// Letreiro sobre a imagem: as barras apertam (nível 3 por padrão), a imagem escurece (no Edicao) e
// o letreiro ocupa as barras — desenho e crédito na de cima, a hora que rola (e frases) na de baixo.
// A pessoa continua na tela: é o jeito de abrir o vídeo com o rosto já no primeiro quadro.
// `topo`/`base`: a janela já assentada no nível do letreiro (o conteúdo não acompanha as barras);
// `estado`: as barras agora (o texto só aparece dentro delas, como uma cortina).
export const Letreiro: React.FC<{ m: LetreiroT; primeira: boolean; topo: number; base: number; estado: Estado }> = ({ m, primeira, topo, base, estado }) => {
  const t = useTempo();
  const palavras = usePalavras();
  // espera as barras apertarem; no letreiro que abre o vídeo, tempos negativos valem (a capa)
  const pronto = primeira ? m.de : m.de + 0.3;
  const piso = primeira ? -3 : pronto;
  const sai = saindo(t, m.ate, 0.4);
  const numerico = ehNumerico(m.titulo);
  const linhas = m.linhas ?? [];

  // barra de cima: desenho + crédito
  const alturaCima = Math.max(0, topo - TOPO_DO_APP - 24);
  const d = m.desenho;
  const larguraDesenho = d ? Math.min(LARGURA_DO_DESENHO[d.tipo] * 0.72, Math.max(0, alturaCima - 90) * PROPORCAO_DO_DESENHO[d.tipo]) : 0;

  // barra de baixo: título + frases
  const alturaBaixo = Math.max(0, LIMITE_APP - base - 24);
  const tamanhoLinha = Math.min(70, ...linhas.map((l) => encaixar(palavrasDe(l.texto), { largura: 920, max: 70, min: 44, linhas: 2 }).tamanho));
  const alturaLinhas = linhas.length ? linhas.length * tamanhoLinha * 1.16 + 24 : 0;
  const tamanhoTitulo = m.titulo && numerico ? Math.floor(Math.min(210, 940 / (m.titulo.length * LARGURA_ALGARISMO), (alturaBaixo - alturaLinhas) / 1.14)) : 0;

  const bloco: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: 1 - sai,
    filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined,
  };

  return (
    <>
      <NaBarra lado="cima" estado={estado}>
        <div style={{ ...bloco, top: TOPO_DO_APP, height: alturaCima, gap: 22 }}>
          {d && larguraDesenho > 120 ? (
            <div style={{ width: larguraDesenho }}>
              <DesenhoDaCartela d={{ ...d, em: primeira ? Math.min(d.em ?? 0, -1.2) : Math.max(piso, d.em ?? pronto) }} t={t} inicio={primeira ? Math.min(d.em ?? 0, -1.2) : Math.max(piso, d.em ?? pronto)} fim={m.ate} hora={numerico ? m.titulo : undefined} />
            </div>
          ) : null}
          {m.rotulo ? <RotuloDeCredito texto={m.rotulo} em={primeira ? Math.min(m.rotuloEm ?? 0, -0.6) : Math.max(piso, m.rotuloEm ?? pronto)} /> : null}
        </div>
      </NaBarra>
      <NaBarra lado="baixo" estado={estado}>
        <div style={{ ...bloco, top: base + 24, height: alturaBaixo, gap: 20 }}>
          {m.titulo ? (
            numerico ? (
              <div style={{ textShadow: sombra }}>
                <Digitos
                  texto={m.titulo}
                  de={m.contarDe}
                  em={Math.max(piso, m.tituloEm ?? pronto + 0.2)}
                  pousaEm={m.pousaEm}
                  apareceEm={primeira ? -1 : undefined}
                  tamanho={tamanhoTitulo}
                />
              </div>
            ) : (
              // título de texto: entra inteiro desfocado ("a lápis") e cada palavra ganha foco quando é dita
              <TextoEmFoco
                texto={m.titulo}
                em={Math.max(piso, m.tituloEm ?? pronto + 0.2)}
                entrada={pronto}
                limite={m.ate + 0.3}
                largura={940}
                altura={alturaBaixo - alturaLinhas}
                max={150}
                min={56}
                linhas={2}
                entrelinha={1.08}
                capa={primeira}
                sombra
              />
            )
          ) : null}
          {linhas.map((l, i) => {
            const textos = palavrasDe(l.texto);
            const tempos = temposDasPalavras(palavras, Math.max(piso, l.em), textos, linhas[i + 1]?.em ?? Infinity);
            return (
              <LinhasEmFoco
                key={i}
                linhas={quebrarEmLinhas(textos.map((w, k) => ({ w, em: tempos[k] })), tamanhoLinha, 920)}
                entrada={Math.max(piso, l.em)}
                estilo={{ fontFamily: serif, fontWeight: 600, fontSize: tamanhoLinha, lineHeight: 1.16, color: cor.marfim, textShadow: sombra }}
              />
            );
          })}
        </div>
      </NaBarra>
    </>
  );
};
