// O negatoscópio: aro de metal, painel de luz fria e a chapa presa pelas presilhas. Acende com duas
// pequenas oscilações quando a sequência de ajustes começa; cada ajuste traz a sua chapa, que
// desliza da direita sobre a anterior (a de baixo só sai quando a nova já cobriu o painel).
import { acender, Linhas, prog, temposDoTexto, troca } from "../anim";
import { CenaAjuste } from "../esqueleto/Cena";
import { CenaColuna } from "../esqueleto/Frente";
import { CenaPausa } from "../esqueleto/CenaPausa";
import { DESLIZA, type Filme, type GrupoDoRaioX } from "../layout";
import { diagramar } from "../medidas";
import { type Ajuste, ehPostura, type MomentoDeChapa, type Palavra, type Parte, type Vista } from "../plano";
import { CHAPA_INSET, cor, NEGATOSCOPIO, PAINEL_INSET, titulo as estiloTitulo } from "../tema";
import { Chapa, FAIXA, Presilha } from "./Chapa";
import { FilmeComparacao, FilmeGrafico, FilmeTopicos } from "./Filmes";

export const IDENTIFICACAO: Record<Vista | "pausa", string> = {
  tela: "Perfil · cervical",
  pernas: "Perfil · membros inferiores",
  bracos: "Perfil · membros superiores",
  coluna: "Perfil · coluna",
  inteiro: "Perfil · corpo inteiro",
  pausa: "Perfil · marcha",
};

// a faixa de identificação de cada filme (marcação de chapa, nada do assunto do demo)
export const identificacaoDe = (m: MomentoDeChapa) => {
  if (m.tipo === "ajuste") return ehPostura(m) ? IDENTIFICACAO[m.vista] : "AP · coluna";
  if (m.tipo === "topicos") return "Achados";
  if (m.tipo === "passos") return "Sequência";
  if (m.tipo === "grafico") return m.ilustrativo || !m.dados?.length ? "Ilustrativo" : "Medida";
  return "Comparativo";
};

// o conteúdo de um filme, no instante t (também usado nas miniaturas do fechamento)
export const ConteudoDoFilme: React.FC<{
  m: MomentoDeChapa;
  t: number;
  largura: number;
  altura: number;
  id: string;
  palavras: Palavra[];
  erradas?: Parte[];
  antebracoSegue?: boolean;
  grupo?: GrupoDoRaioX;
}> = ({ m, t, largura, altura, id, palavras, erradas = [], antebracoSegue = true, grupo }) => {
  if (m.tipo === "ajuste") {
    if (ehPostura(m)) return <CenaAjuste vista={m.vista} passos={m.passos} erradas={erradas} antebracoSegue={antebracoSegue} t={t} largura={largura} altura={altura} id={id} />;
    return <CenaColuna itens={grupo?.itens ?? m.itens ?? []} alinha={grupo ? grupo.alinha : m.alinha} t={t} largura={largura} altura={altura} id={id} />;
  }
  if (m.tipo === "topicos" || m.tipo === "passos") return <FilmeTopicos m={m} t={t} largura={largura} altura={altura} id={id} palavras={palavras} ordem={m.tipo === "passos"} />;
  if (m.tipo === "grafico") return <FilmeGrafico m={m} t={t} largura={largura} altura={altura} id={id} />;
  return null;
};

export type InfoDosAjustes = {
  // partes ainda erradas na chapa de cada ajuste (pelo índice do filme)
  erradas: (indice: number) => Parte[];
  antebracoSegue: boolean;
  // ajustes de itens encostados: a coluna e os itens do grupo inteiro
  grupos: Map<Ajuste, GrupoDoRaioX>;
};

export const Negatoscopio: React.FC<{
  t: number;
  filmes: Filme[];
  acesas: { de: number; ate: number }[];
  info: InfoDosAjustes;
  palavras: Palavra[];
}> = ({ t, filmes, acesas, info, palavras }) => {
  const acesa = acesas.find((a) => t >= a.de - 0.02 && t <= a.ate);
  if (!acesa) return null;
  const luz = acender(t, acesa.de);
  const n = NEGATOSCOPIO;
  const pw = n.w - 2 * PAINEL_INSET;
  const ph = n.h - 2 * PAINEL_INSET;
  const fw = pw - 2 * CHAPA_INSET;
  const fh = ph - 2 * CHAPA_INSET;
  const visiveis = filmes.filter((f) => t >= f.entra - 0.02 && t <= f.sai && f.entra >= acesa.de - 0.2 && f.entra <= acesa.ate);
  return (
    <div
      style={{
        position: "absolute",
        left: n.x,
        top: n.y,
        width: n.w,
        height: n.h,
        borderRadius: 18,
        // contexto de empilhamento próprio: as chapas nunca passam por cima da pessoa
        isolation: "isolate",
        background: `linear-gradient(160deg, ${cor.aroClaro} 0%, ${cor.aro} 38%, #0C141C 100%)`,
        boxShadow: `0 18px 50px rgba(0,0,0,0.6), 0 0 ${Math.round(70 * luz)}px rgba(150,205,230,${(0.1 * luz).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,0.12)`,
      }}
    >
      {/* o painel: apagado embaixo, aceso por cima com a intensidade da lâmpada */}
      <div style={{ position: "absolute", left: PAINEL_INSET, top: PAINEL_INSET, width: pw, height: ph, borderRadius: 8, overflow: "hidden", background: "#16212B" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: luz,
            background: `radial-gradient(ellipse 80% 75% at 50% 45%, #F2F9FC 0%, ${cor.luz} 55%, #A9C3CF 100%)`,
          }}
        />
        {visiveis.map((f) => {
          // a primeira chapa da sequência já está no painel e se revela enquanto a luz acende;
          // as seguintes deslizam da direita por cima da anterior
          const primeira = Math.abs(f.entra - acesa.de) < 0.2;
          const entra = primeira ? 1 : prog(t, f.entra, DESLIZA, troca);
          const revela = primeira ? prog(t, acesa.de, 0.5) : 1;
          const x = CHAPA_INSET + (1 - entra) * (pw + 40);
          const tr = f.trecho;
          const id = `f${f.indice}`;
          const area = fh - FAIXA;
          const numero = String(f.indice + 1).padStart(2, "0");
          const estilo: React.CSSProperties = { position: "absolute", left: x, top: CHAPA_INSET, width: fw, height: fh, zIndex: f.indice + 1, boxShadow: "-14px 0 30px rgba(0,0,0,0.45)", filter: revela < 1 ? `brightness(${(0.35 + 0.65 * revela).toFixed(3)})` : undefined };
          // comparação: duas chapas lado a lado, sobre o painel aceso (cobre a chapa de baixo)
          if (tr.tipo === "chapa" && tr.momento.tipo === "comparacao") {
            return (
              <div key={id} style={{ ...estilo, borderRadius: 6, background: `radial-gradient(ellipse 80% 75% at 50% 45%, #F2F9FC 0%, ${cor.luz} 55%, #A9C3CF 100%)` }}>
                <FilmeComparacao m={tr.momento} t={t} largura={fw} altura={fh} id={id} palavras={palavras} numero={numero} />
              </div>
            );
          }
          return (
            <div key={id} style={estilo}>
              <Chapa largura={fw} altura={fh} id={id} identificacao={tr.tipo === "pausa" ? IDENTIFICACAO.pausa : identificacaoDe(tr.momento)} numero={numero}>
                {tr.tipo === "chapa" ? (
                  <ConteudoDoFilme
                    m={tr.momento}
                    t={t}
                    largura={fw}
                    altura={area}
                    id={id}
                    palavras={palavras}
                    erradas={info.erradas(f.indice)}
                    antebracoSegue={info.antebracoSegue}
                    grupo={tr.momento.tipo === "ajuste" ? info.grupos.get(tr.momento) : undefined}
                  />
                ) : (
                  <ChapaDaPausa t={t} trecho={tr} largura={fw} altura={area} id={id} palavras={palavras} inicio={f.entra} />
                )}
              </Chapa>
            </div>
          );
        })}
        {/* presilhas fixas no painel */}
        <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
          <Presilha x={pw * 0.27} y={CHAPA_INSET + 2} />
          <Presilha x={pw * 0.73} y={CHAPA_INSET + 2} />
        </div>
      </div>
    </div>
  );
};

// Chapa da pausa: o título escrito no alto da chapa (palavra por palavra) e o esqueleto que se
// levanta e caminha embaixo
const ChapaDaPausa: React.FC<{
  t: number;
  trecho: Extract<Filme["trecho"], { tipo: "pausa" }>;
  largura: number;
  altura: number;
  id: string;
  palavras: Palavra[];
  inicio: number;
}> = ({ t, trecho, largura, altura, id, palavras, inicio }) => {
  const m = trecho.momento;
  const larguraTexto = largura - 2 * 40 - 50;
  const { tamanho, linhas } = diagramar(m.titulo, larguraTexto, 72, 58, 2, "sans700");
  const tempos = temposDoTexto(m.titulo, palavras, m.de, m.ate, inicio + 0.25);
  const alturaTitulo = Math.round(linhas.length * tamanho * 1.06 + 56);
  return (
    <>
      <Linhas
        linhas={linhas}
        tempos={tempos}
        t={t}
        style={{ ...estiloTitulo, fontSize: tamanho, position: "absolute", left: 40, top: 30, width: larguraTexto }}
      />
      <div style={{ position: "absolute", left: 0, top: alturaTitulo, width: largura, height: altura - alturaTitulo }}>
        <CenaPausa t={t} levantaEm={m.levantaEm} caminhaEm={m.caminhaEm} largura={largura} altura={altura - alturaTitulo} id={id} />
      </div>
    </>
  );
};
