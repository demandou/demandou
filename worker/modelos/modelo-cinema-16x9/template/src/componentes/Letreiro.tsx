import { saindo, temposDasPalavras, useTempo, usePalavras } from "../anim";
import { divisaoDoQuadro, LARGURA_TEXTO, VAO_DO_QUADRO, type Estado } from "../layout";
import { encaixar } from "../medida";
import type { Letreiro as LetreiroT } from "../plano";
import { cor, serif, sombra } from "../tema";
import { Coluna, Grupo, NoQuadro } from "./Barras";
import { Digitos, ehNumerico, LARGURA_ALGARISMO, RotuloDeCredito } from "./Cartela";
import { DesenhoDaCartela, LARGURA_DO_DESENHO, PROPORCAO_DO_DESENHO } from "./Desenhos";
import { LinhasEmFoco, quebrarEmLinhas, TextoEmFoco } from "./Foco";

const palavrasDe = (s: string) => s.split(/\s+/).filter(Boolean);

// Letreiro sobre a imagem, no quadro deitado (16:9): a pessoa vai para a moldura da direita (em
// close, por padrão), a imagem escurece (no Edicao) e o letreiro ocupa o quadro preto da esquerda:
// desenho e crédito em cima, a hora que rola (e frases) embaixo. A pessoa continua na tela: é o
// jeito de abrir o vídeo com o rosto já no primeiro quadro.
// `estado`: a janela agora (o texto só aparece no preto à esquerda dela, como uma cortina).
export const Letreiro: React.FC<{ m: LetreiroT; primeira: boolean; estado: Estado }> = ({ m, primeira, estado }) => {
  const t = useTempo();
  const palavras = usePalavras();
  // espera a moldura assentar; no letreiro que abre o vídeo, tempos negativos valem (a capa)
  const pronto = primeira ? m.de : m.de + 0.3;
  const piso = primeira ? -3 : pronto;
  const sai = saindo(t, m.ate, 0.4);
  const numerico = ehNumerico(m.titulo);
  const linhas = m.linhas ?? [];
  const d = m.desenho;

  // em cima: desenho + crédito
  const div = divisaoDoQuadro(d ? 330 : m.rotulo ? 60 : 0);
  const larguraDesenho = d ? Math.min(LARGURA_DO_DESENHO[d.tipo] * 0.72, LARGURA_TEXTO, Math.max(0, div.cima - 90) * PROPORCAO_DO_DESENHO[d.tipo]) : 0;

  // embaixo: título + frases (cada frase em até 2 linhas, todas no mesmo corpo)
  const larguraLinha = LARGURA_TEXTO - 20;
  const encaixes = linhas.map((l) => encaixar(palavrasDe(l.texto), { largura: larguraLinha, max: 70, min: 44, linhas: 2 }));
  const tamanhoLinha = Math.min(70, ...encaixes.map((e) => e.tamanho));
  const alturaLinhas = linhas.length
    ? linhas.reduce((s, l) => s + quebrarEmLinhas(palavrasDe(l.texto).map((w) => ({ w })), tamanhoLinha, larguraLinha).length * tamanhoLinha * 1.16, 0) + 20 * linhas.length
    : 0;
  const alturaTitulo = Math.max(0, div.baixo - alturaLinhas);
  const tamanhoTitulo = m.titulo && numerico ? Math.floor(Math.min(210, LARGURA_TEXTO / (m.titulo.length * LARGURA_ALGARISMO), alturaTitulo / 1.14)) : 0;

  const saida: React.CSSProperties = {
    opacity: 1 - sai,
    filter: sai > 0.02 ? `blur(${(sai * 6).toFixed(2)}px)` : undefined,
  };

  return (
    <NoQuadro estado={estado}>
      <Coluna gap={VAO_DO_QUADRO} estilo={saida}>
        {d || m.rotulo ? (
          <Grupo gap={22}>
            {d && larguraDesenho > 120 ? (
              <div style={{ width: larguraDesenho }}>
                <DesenhoDaCartela
                  d={{ ...d, em: primeira ? Math.min(d.em ?? 0, -1.2) : Math.max(piso, d.em ?? pronto) }}
                  t={t}
                  inicio={primeira ? Math.min(d.em ?? 0, -1.2) : Math.max(piso, d.em ?? pronto)}
                  fim={m.ate}
                  hora={numerico ? m.titulo : undefined}
                />
              </div>
            ) : null}
            {m.rotulo ? <RotuloDeCredito texto={m.rotulo} em={primeira ? Math.min(m.rotuloEm ?? 0, -0.6) : Math.max(piso, m.rotuloEm ?? pronto)} largura={LARGURA_TEXTO} /> : null}
          </Grupo>
        ) : null}
        {m.titulo || linhas.length ? (
          <Grupo gap={20}>
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
                  largura={LARGURA_TEXTO}
                  altura={alturaTitulo}
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
                  linhas={quebrarEmLinhas(textos.map((w, k) => ({ w, em: tempos[k] })), tamanhoLinha, larguraLinha)}
                  entrada={Math.max(piso, l.em)}
                  estilo={{ fontFamily: serif, fontWeight: 600, fontSize: tamanhoLinha, lineHeight: 1.16, color: cor.marfim, textShadow: sombra }}
                />
              );
            })}
          </Grupo>
        ) : null}
      </Coluna>
    </NoQuadro>
  );
};
