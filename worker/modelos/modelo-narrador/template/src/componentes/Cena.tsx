// A assinatura do Narrador: a imagem em tela cheia que carrega a história enquanto a voz segue.
// - A foto anda devagar o tempo todo (aproxima, corre ou afasta, alternando de uma cena para a
//   outra), sempre ancorada no foco escolhido.
// - Entra por dissolve curto (ou corte seco, ou cortina); duas cenas seguidas se dissolvem uma na
//   outra (a de baixo fica inteira até a de cima cobrir); na volta para a pessoa, a foto se desfaz.
// - Um véu leve só em cima e embaixo da FOTO (nunca sobre a pessoa) dá leitura ao rótulo e à legenda.
// - O rótulo é uma legenda de museu: pequeno, em versalete, no alto.
// - Sem imagem: a cena vira a prancha escura com a palavra em serifa (nunca uma imagem errada).
import { Foto, SemImagem, imagemDoPlano, temImagem, type Direcao, type Efeito } from "../motor/imagem";
import { cobreATela, ePrancha } from "../camera";
import type { Cena as TCena, Momento, Plano } from "../plano";
import { COR, DISSOLVE, FONTE, MARGEM, SERIFA, prog, suave } from "../tema";

const EFEITOS: Efeito[] = ["aproximar", "panoramica", "afastar", "panoramica"];

// o próximo momento que cobre a tela e começa colado no fim deste (para dissolver um no outro)
const proximaCobertura = (plano: Plano, m: Momento) =>
  plano.momentos.find((x) => x !== m && cobreATela(x) && x.de > m.de && Math.abs(x.de - m.ate) <= 0.12 && (x.tipo === "cena" || ("imagem" in x && !!x.imagem)));

// Opacidade (0–1) de algo que cobre a tela de `m.de` a `m.ate`: entra por dissolve e, se o que vem
// depois também cobre a tela, fica inteiro até ele cobrir; senão, se desfaz até `m.ate`.
export const coberturaNoTempo = (plano: Plano, m: Momento, t: number, entrada: "dissolver" | "corte" | "cortina" = "dissolver") => {
  const seguinte = proximaCobertura(plano, m);
  const fim = seguinte ? m.ate + DISSOLVE + 0.04 : m.ate;
  if (t < m.de - 0.5 || t >= fim) return { visivel: false, opacidade: 0, cortina: 1, fim };
  const e = entrada === "dissolver" ? prog(t, m.de, DISSOLVE, suave) : t >= m.de ? 1 : 0;
  const cortina = entrada === "cortina" ? prog(t, m.de, 0.5, suave) : 1;
  const s = seguinte ? 0 : prog(t, m.ate - DISSOLVE, DISSOLVE, suave);
  return { visivel: true, opacidade: Math.min(e, 1 - s), cortina, fim };
};

export const Veu: React.FC<{ alto?: number; baixo?: number }> = ({ alto = 0.42, baixo = 0.58 }) => (
  <>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 560, background: `linear-gradient(to bottom, rgba(14,19,25,${alto}) 0%, rgba(14,19,25,0) 100%)` }} />
    <div style={{ position: "absolute", left: 0, top: 1000, width: 1080, height: 920, background: `linear-gradient(to bottom, rgba(14,19,25,0) 0%, rgba(14,19,25,${baixo}) 55%, rgba(14,19,25,${baixo}) 100%)` }} />
  </>
);

// legenda de museu no alto: quadradinho vermelhão + texto em versalete
export const Rotulo: React.FC<{ texto: string; t: number; em: number; ate: number }> = ({ texto, t, em, ate }) => {
  const e = prog(t, em, 0.45);
  const s = prog(t, ate - 0.25, 0.25, suave);
  if (e <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: MARGEM,
        top: 176,
        maxWidth: 860,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: e * (1 - s),
        transform: e >= 1 ? undefined : `translateX(${(1 - e) * -12}px)`,
      }}
    >
      <div style={{ width: 12, height: 12, background: COR.vermelhao, flexShrink: 0 }} />
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 700,
          fontSize: 27,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: COR.marfim,
          textShadow: "0 1px 8px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

// o efeito da cena: o pedido no plano, ou alternando entre as cenas; panorâmica corre no sentido
// em que a foto tem folga (deitada: para os lados; em pé: para cima)
const movimento = (plano: Plano, m: TCena, aspecto: number): { efeito: Efeito; direcao: Direcao; intensidade: number } => {
  const cenas = plano.momentos.filter((x) => x.tipo === "cena").sort((a, b) => a.de - b.de);
  const i = Math.max(0, cenas.indexOf(m));
  const efeito = m.imagem.efeito ?? EFEITOS[i % EFEITOS.length];
  const direcao: Direcao = m.direcao ?? (aspecto > 0.75 ? (i % 4 === 1 ? "direita" : "esquerda") : "cima");
  const dur = m.ate - m.de;
  // documentário: devagar. ~3% por segundo no zoom, mais curso na panorâmica
  const intensidade = efeito === "panoramica" ? Math.min(0.16, 0.05 + dur * 0.025) : Math.min(0.14, 0.04 + dur * 0.025);
  return { efeito, direcao, intensidade };
};

export const Cena: React.FC<{ plano: Plano; m: TCena; t: number }> = ({ plano, m, t }) => {
  const v = coberturaNoTempo(plano, m, t, m.transicao ?? "dissolver");
  if (!v.visivel) return null;
  const img = imagemDoPlano(plano, m.imagem);
  const tem = temImagem(img);
  const aspecto = tem && img.largura && img.altura ? img.largura / img.altura : 1;
  const mov = movimento(plano, m, aspecto);
  // a cortina varre da esquerda com a borda macia
  const borda = v.cortina * 130 - 15;
  const mascara =
    v.cortina < 1 ? `linear-gradient(to right, #000 0%, #000 ${Math.max(0, borda - 15)}%, transparent ${Math.max(0, borda)}%)` : undefined;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v.opacidade, WebkitMaskImage: mascara, maskImage: mascara }}>
      {tem ? (
        <>
          <Foto
            imagem={img}
            de={m.de}
            ate={v.fim}
            t={t}
            largura={1080}
            altura={1920}
            efeito={mov.efeito}
            direcao={mov.direcao}
            intensidade={mov.intensidade}
            foco={m.imagem.foco}
            style={{ position: "absolute", left: 0, top: 0, backgroundColor: COR.noite }}
          />
          <Veu />
        </>
      ) : (
        <SemImagem
          texto={img?.palavra ?? m.imagem.id}
          largura={1080}
          altura={1920}
          de={m.de}
          ate={v.fim}
          t={t}
          fundo={COR.noite}
          cor={COR.marfim}
          fonte={SERIFA}
          peso={600}
          style={{ position: "absolute", left: 0, top: 0 }}
        />
      )}
      {m.rotulo ? <Rotulo texto={m.rotulo} t={t} em={Math.max(m.de + 0.15, m.rotuloEm ?? m.em ?? m.de)} ate={m.ate} /> : null}
    </div>
  );
};

// Fundo das pranchas: a imagem do bloco (escurecida e andando), ou o véu sobre a cena que estiver
// por baixo, ou a noite lisa. Devolve null quando não há o que desenhar.
export const FundoDaPrancha: React.FC<{ plano: Plano; m: Momento & { imagem?: TCena["imagem"] }; t: number; sobreCena: boolean; opacidade: number; fim: number }> = ({
  plano,
  m,
  t,
  sobreCena,
  opacidade,
  fim,
}) => {
  const img = m.imagem ? imagemDoPlano(plano, m.imagem) : null;
  if (img && temImagem(img)) {
    return (
      <div style={{ position: "absolute", inset: 0, opacity: opacidade }}>
        <Foto
          imagem={img}
          de={m.de}
          ate={fim}
          t={t}
          largura={1080}
          altura={1920}
          efeito={m.imagem?.efeito ?? "aproximar"}
          intensidade={0.06}
          foco={m.imagem?.foco}
          style={{ position: "absolute", left: 0, top: 0, backgroundColor: COR.noite }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(14,19,25,0.72)" }} />
      </div>
    );
  }
  if (sobreCena) return <div style={{ position: "absolute", inset: 0, opacity: opacidade, background: "rgba(14,19,25,0.74)" }} />;
  return <div style={{ position: "absolute", inset: 0, opacity: opacidade, background: COR.noite }} />;
};

export { ePrancha };
