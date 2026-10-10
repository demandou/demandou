// Fechamento: página de passaporte na altura do peito. A chamada se monta na fala, o marcador é
// preenchido na palavra da ação, os carimbos das paradas visitadas batem um a um e uma vaga a lápis
// ("próximo roteiro") ganha tinta no fim — o convite para seguir.
import { limitar, misturarCor, prog, temposDoTexto, TextoALapis } from "../anim";
import type { Cta as TipoCta, Palavra } from "../plano";
import { indicesDoTrecho } from "../anim";
import { encaixar } from "../medida";
import { cor, display, sans, sombraPapel } from "../tema";
import { Carimbo } from "./Carimbo";

type Acao = "salvar" | "seguir" | "comentar" | "link";

const Marcador: React.FC<{ p: number; acao: Acao }> = ({ p, acao }) => {
  const preenche = misturarCor(cor.papel, cor.azulejo, p);
  if (acao === "seguir")
    return (
      <svg width={86} height={86} viewBox="0 0 86 86">
        <circle cx={43} cy={43} r={38} fill={preenche} stroke={cor.azulejo} strokeWidth={4} />
        <path d="M43 26 V60 M26 43 H60" stroke={misturarCor(cor.azulejo, cor.papel, p)} strokeWidth={6} strokeLinecap="round" opacity={1 - p} />
        <path d="M28 44 l10 10 l20 -22" fill="none" stroke={cor.papel} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      </svg>
    );
  if (acao === "comentar")
    return (
      <svg width={96} height={86} viewBox="0 0 96 86">
        <path d="M10 10 H86 V62 H44 L24 80 V62 H10 Z" fill={preenche} stroke={cor.azulejo} strokeWidth={5} strokeLinejoin="round" />
        {[30, 48, 66].map((x) => (
          <circle key={x} cx={x} cy={36} r={5.5} fill={misturarCor(cor.azulejo, cor.papel, p)} />
        ))}
      </svg>
    );
  if (acao === "link")
    return (
      <svg width={96} height={86} viewBox="0 0 96 86">
        <g transform="rotate(-35 48 43)" fill="none" strokeWidth={9} strokeLinecap="round">
          <rect x={8} y={28} width={46} height={30} rx={15} stroke={cor.azulejo} />
          <rect x={42} y={28} width={46} height={30} rx={15} stroke={misturarCor(cor.azulejo, cor.sol, p)} />
        </g>
      </svg>
    );
  return (
    <svg width={70} height={92} viewBox="0 0 70 92">
      <path d="M8 8 H62 V84 L35 64 L8 84 Z" fill={preenche} stroke={cor.azulejo} strokeWidth={5} strokeLinejoin="round" />
      <path d="M8 8 H62" stroke={cor.sol} strokeWidth={6} opacity={p} />
    </svg>
  );
};

export const Cta: React.FC<{
  m: TipoCta;
  palavras: Palavra[];
  marca: { nome: string; area: string };
  // os carimbos das paradas: rótulo de baixo de cada um (o período ou o nome)
  carimbos: string[];
  t: number;
  topo: number;
  // quando a pessoa já voltou para a tela cheia (o cartão espera por isso)
  pronto: number;
}> = ({ m, palavras, marca, carimbos, t, topo, pronto }) => {
  const W = 960;
  const H = 478;
  const pad = 40;
  const entrada = prog(t, pronto, 0.55);
  const titulo = m.texto ?? m.titulo ?? "";
  const larguraTitulo = W - 2 * pad - 110;
  const { tamanho: corpo, linhas } = encaixar(titulo, { largura: larguraTitulo, max: 80, min: 44, linhas: 1, fonte: { peso: 600 } });
  const destaque = indicesDoTrecho(titulo, m.destaque);
  const tempos = temposDoTexto(titulo, palavras, m.de, m.ate, Math.max(m.em ?? m.de, pronto)).map((x) => Math.max(x, pronto + 0.1));
  const acaoEm = Math.max(m.acaoEm ?? tempos[0] ?? m.de, pronto + 0.15);
  const marcador = prog(t, acaoEm, 0.4);
  const detalheEm = m.detalheEm ?? m.de + (m.ate - m.de) * 0.45;
  const temposDetalhe = m.detalhe ? temposDoTexto(m.detalhe, palavras, m.de, m.ate, detalheEm) : [];
  const detalhe = m.detalhe ? encaixar(m.detalhe, { largura: W - 2 * pad, max: 52, min: 30, linhas: 1, fonte: { familia: "sans", peso: 600 } }) : null;
  const proximoEm = m.proximoEm ?? m.ate - 0.6;
  const lista = carimbos.slice(0, 4);
  const r = 94;
  const passo = 212;
  const inicioCarimbos = Math.max(acaoEm + 0.15, pronto + 0.3);
  const xCarimbo = (i: number) => pad + r + 6 + i * passo;
  const yCarimbos = 190 + r;
  const proximo = prog(t, proximoEm - 0.08, 0.3);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        top: topo,
        width: W,
        height: H,
        opacity: limitar(entrada * 1.6),
        translate: `0 ${(1 - entrada) * 150}px`,
        rotate: "0.5deg",
        background: cor.papel,
        borderRadius: 20,
        boxShadow: sombraPapel(1),
        overflow: "hidden",
      }}
    >
      {/* fundo de passaporte: linhas onduladas finas */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-20 ${70 + i * 46} ${Array.from({ length: 14 }, (_, k) => `q 40 ${k % 2 ? 14 : -14} 80 0`).join(" ")}`}
            fill="none"
            stroke={cor.ceu}
            strokeWidth={2}
            opacity={0.7}
          />
        ))}
        <rect x={12} y={12} width={W - 24} height={H - 24} rx={12} fill="none" stroke={cor.azulejo} strokeOpacity={0.22} strokeWidth={2} />
      </svg>
      <div style={{ position: "absolute", left: pad, top: 30, fontFamily: sans, fontWeight: 600, fontSize: 34, letterSpacing: "0.16em", textTransform: "uppercase", color: cor.azulejo }}>
        {[marca.nome, marca.area].filter(Boolean).join(" · ") || "Roteiro"}
      </div>
      <TextoALapis
        linhas={linhas}
        tempos={tempos}
        t={t}
        tinta={cor.tinta}
        lapis={cor.lapis}
        destaque={destaque}
        corDestaque={cor.azulejo}
        estiloDestaque={{ fontStyle: "italic", textDecoration: "underline", textDecorationThickness: "0.06em", textUnderlineOffset: "0.12em" }}
        style={{ position: "absolute", left: pad - 2, top: 80, fontFamily: display, fontWeight: 600, fontSize: corpo, lineHeight: 1.04 }}
      />
      <div style={{ position: "absolute", right: pad + 4, top: 30, scale: String(1 + 0.08 * Math.sin(Math.PI * marcador)) }}>
        <Marcador p={marcador} acao={m.icone ?? m.acao ?? "salvar"} />
      </div>
      {lista.map((rotulo, i) => (
        <Carimbo key={i} x={xCarimbo(i)} y={yCarimbos} r={r} em={inicioCarimbos + i * 0.2} t={t} base={rotulo} giro={[-10, 7, -5, 9][i % 4]} ondas={false} />
      ))}
      {/* vaga do próximo roteiro */}
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <Carimbo
          x={xCarimbo(lista.length)}
          y={yCarimbos}
          r={r}
          em={0}
          pronto
          t={t}
          topo="Próximo"
          base="roteiro"
          giro={4}
          ondas={false}
          lapis={proximo < 0.5}
          centro={
            <path d="M0 -20 V20 M-20 0 H20" stroke={proximo < 0.5 ? cor.lapis : cor.azulejo} strokeWidth={7} strokeLinecap="round" />
          }
        />
      </div>
      {detalhe ? (
        <TextoALapis
          linhas={detalhe.linhas}
          tempos={temposDetalhe}
          t={t}
          tinta={cor.azulejo}
          lapis={cor.lapis}
          style={{ position: "absolute", left: pad, bottom: 24, fontFamily: sans, fontWeight: 600, fontSize: detalhe.tamanho }}
        />
      ) : null}
    </div>
  );
};
