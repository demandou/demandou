import { caminhoVisto, gesto, limitar, prog, Traco } from "../anim";
import { ALTURA_RESOLVIDO, ancoraNoTempo, caixaDoVideo, type Cena, faixasDaMargem, janelaNoTempo, lugarDoMomento, MARGEM_W, MARGEM_X } from "../cena";
import { VideoNaCaixa } from "../motor/caixa";
import type { Momento, Plano } from "../plano";
import { cor, mao, sans, TOPO_APP } from "../tema";

type ComErro = Momento & { erro?: number; resumo?: string };

const erroDe = (m: Momento) => (m as ComErro).erro;

// papel do bilhete: um tom mais quente que a folha, com a base levemente mais escura (o papel enverga)
const papelDoBilhete = `linear-gradient(180deg, ${cor.nota} 0%, ${cor.nota} 70%, #F6F2E7 100%)`;
const sombraBilhete = "0 1px 2px rgba(28,33,41,0.14), 0 18px 26px -12px rgba(28,33,41,0.34)";

// A pessoa: em tela cheia é o vídeo puro; fora dela vira um bilhete adesivo de papel, com a aba
// vermelha da caneta (o nome) e a contagem escrita à mão. Na margem, uma seta de caneta liga o
// bilhete ao trecho da folha de que ele fala.
export const Comentario: React.FC<{ plano: Plano; cena: Cena; momentos: Momento[]; t: number; zoomExtra?: number }> = ({
  plano,
  cena,
  momentos,
  t,
  zoomExtra = 1,
}) => {
  const j = janelaNoTempo(t, cena);
  const v = caixaDoVideo(j);
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const nome = plano.marca.nome || "Comentário";
  const total = Math.max(0, ...momentos.map((m) => erroDe(m) ?? 0));

  // erro do momento em vigor (só na margem)
  const atual = [...momentos].reverse().find((m) => m.de <= t + 0.01);
  const indiceAtual = atual ? momentos.indexOf(atual) : -1;
  const erro = atual && lugarDoMomento(atual) === "margem" ? erroDe(atual) : undefined;
  const anterior = indiceAtual > 0 ? erroDe(momentos[indiceAtual - 1]) : undefined;
  const troca = atual ? prog(t, atual.de + 0.3, 0.4) : 1;
  const rola = !!anterior && anterior !== erro;

  const ancora = ancoraNoTempo(t, cena);
  const linhaOp = ancora ? j.cromo : 0;
  const larga = j.w > 560;

  return (
    <>
      {/* seta de caneta do bilhete até o trecho da folha */}
      {ancora && linhaOp > 0.01 ? <Seta de={{ x: j.x - 4, y: j.y + j.pad + j.cab / 2 }} para={ancora} t={t} desde={ancora.desde} op={linhaOp} /> : null}

      <div
        style={{
          position: "absolute",
          left: j.x,
          top: j.y,
          width: j.w,
          height: j.h,
          rotate: `${j.rot}deg`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* o papel do bilhete */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: j.raio,
            background: papelDoBilhete,
            boxShadow: sombraBilhete,
            opacity: j.cromo,
          }}
        />
        {/* a aba vermelha com o nome, presa atrás do bilhete e saindo por cima */}
        <div
          style={{
            position: "absolute",
            left: j.pad + 4,
            top: -14,
            height: j.cab + 6,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 18px 0 16px",
            background: cor.vermelho,
            color: cor.claro,
            fontFamily: sans,
            whiteSpace: "nowrap",
            opacity: j.cromo,
            boxShadow: "0 2px 4px rgba(28,33,41,0.18)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 36 }}>{nome}</div>
          {larga && plano.marca.area ? <div style={{ fontWeight: 500, fontSize: 32, opacity: 0.9 }}>· {plano.marca.area}</div> : null}
        </div>
        {/* contagem escrita à mão */}
        {erro && total > 1 ? (
          <div
            style={{
              position: "absolute",
              right: j.pad + 6,
              top: j.pad - 2,
              height: j.cab - 4,
              width: 150,
              overflow: "hidden",
              fontFamily: mao,
              fontWeight: 700,
              fontSize: 40,
              color: cor.vermelho,
              opacity: j.cromo,
              whiteSpace: "nowrap",
            }}
          >
            {rola ? (
              <div style={{ position: "absolute", right: 0, top: 2, translate: `0 ${-56 * troca}px` }}>
                {anterior} de {total}
              </div>
            ) : null}
            <div style={{ position: "absolute", right: 0, top: 2, translate: `0 ${rola ? 56 * (1 - troca) : 0}px` }}>
              {erro} de {total}
            </div>
          </div>
        ) : null}

        {/* a pessoa (o único vídeo com som) */}
        <VideoNaCaixa
          src={plano.video}
          caixa={{ ...v, x: v.x - j.x, y: v.y - j.y, zoom: v.zoom * zoomExtra }}
          rosto={plano.rosto}
          videoAltura={videoAltura}
          filtro="contrast(1.03) saturate(1.02)"
        />
      </div>

      <Resolvidos plano={plano} cena={cena} momentos={momentos} t={t} />
    </>
  );
};

// Seta feita à caneta: sai do bilhete, curva e aponta para o trecho da folha.
const Seta: React.FC<{ de: { x: number; y: number }; para: { x: number; y: number }; t: number; desde: number; op: number }> = ({ de, para, t, desde, op }) => {
  const ponta = { x: para.x + 10, y: para.y };
  const dx = Math.max(60, (de.x - ponta.x) * 0.45);
  const d = `M ${de.x} ${de.y} C ${de.x - dx} ${de.y} ${ponta.x + dx} ${ponta.y} ${ponta.x} ${ponta.y}`;
  const p = prog(t, desde, 0.38, gesto);
  const pp = prog(t, desde + 0.34, 0.14, gesto);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: op }}>
      <Traco d={d} p={p} largura={5} />
      <Traco d={`M ${ponta.x + 20} ${ponta.y - 13} L ${ponta.x} ${ponta.y} L ${ponta.x + 20} ${ponta.y + 13}`} p={pp} largura={5} />
    </svg>
  );
};

// Comentários resolvidos: cada erro já revisado vira um bilhete pequeno no alto da margem,
// com o avatar da pessoa, o resumo e um visto de caneta.
const Resolvidos: React.FC<{ plano: Plano; cena: Cena; momentos: Momento[]; t: number }> = ({ plano, cena, momentos, t }) => {
  const faixas = faixasDaMargem(cena, plano.duracao);
  const faixa = faixas.find((f) => t >= f.de && t < f.ate + 0.4);
  if (!faixa) return null;
  const videoAltura = Math.min(1920, plano.videoAltura ?? 1920);
  const comErro = momentos.filter((m) => erroDe(m) && lugarDoMomento(m) === "margem");
  return (
    <>
      {comErro.map((m, k) => {
        const aparece = Math.max(faixa.de + 0.35, m.ate + 0.15);
        const op = prog(t, aparece, 0.4) * (1 - prog(t, faixa.ate - 0.05, 0.25));
        if (op <= 0.01) return null;
        const x = MARGEM_X + 30 * (1 - op);
        const y = TOPO_APP + 24 + k * ALTURA_RESOLVIDO;
        const resumo = (m as ComErro).resumo ?? `Erro ${erroDe(m)}`;
        return (
          <div
            key={`${m.tipo}-${m.de}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: MARGEM_W,
              height: ALTURA_RESOLVIDO - 12,
              rotate: `${k % 2 ? 0.9 : -0.7}deg`,
              opacity: limitar(op),
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: 2, background: papelDoBilhete, boxShadow: "0 1px 2px rgba(28,33,41,0.14), 0 10px 16px -8px rgba(28,33,41,0.3)" }} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: cor.vermelho }} />
            <VideoNaCaixa src={plano.video} caixa={{ x: 20, y: 10, w: 54, h: 54, raio: 27, zoom: 2.4, ancoraY: 0.46 }} rosto={plano.rosto} videoAltura={videoAltura} mudo />
            <div
              style={{
                position: "absolute",
                left: 90,
                top: 14,
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 36,
                lineHeight: 1.1,
                color: cor.tinta,
                whiteSpace: "nowrap",
              }}
            >
              {resumo}
            </div>
            <svg width={40} height={32} style={{ position: "absolute", right: 20, top: 20, overflow: "visible" }}>
              <Traco d={caminhoVisto(36, 28)} p={prog(t, aparece + 0.2, 0.25, gesto)} largura={6} />
            </svg>
          </div>
        );
      })}
    </>
  );
};
