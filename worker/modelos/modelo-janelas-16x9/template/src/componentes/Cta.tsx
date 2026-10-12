// Fechamento: cartão de compartilhar. No quadro deitado fica no quadro do bloco, ao lado da pessoa
// na moldura (ou na coluna ao lado do rosto, com a pessoa em tela cheia). O mouse clica
// "Salvar" (vira "Salvo"), depois "Enviar"; o destinatário é digitado na fala e o envio confirma.
import { mistura, Palavras, prog, saindo, temposDoTexto } from "../anim";
import { ctaAntigo, geoCtaUniversal, temposDoCta } from "../blocos";
import { alturaDoCartaoCta, botoesCta, cartaoCta } from "../geometria";
import { corpoQueCabe } from "../medida";
import type { Cta as TipoCta, Palavra, Plano } from "../plano";
import { TextoFalado } from "../texto";
import { cor, sans, sombraJanela } from "../tema";
import { Icone } from "./Icones";

const Botao: React.FC<{
  topo: number;
  // a borda esquerda do cartão (o botão é desenhado dentro dele)
  origemX: number;
  x: number;
  y: number;
  w: number;
  h: number;
  icone: "marcador" | "enviar" | "seguir" | "check";
  texto: string;
  ligado: number;
  cheio?: boolean;
}> = ({ topo, origemX, x, y, w, h, icone, texto, ligado, cheio }) => {
  const forte = cheio && ligado > 0.5;
  return (
    <div
      style={{
        position: "absolute",
        left: x - origemX,
        top: y - topo,
        width: w,
        height: h,
        borderRadius: 28,
        background: forte ? cor.violeta : ligado > 0.5 ? cor.violetaFundo : cor.janela,
        outline: `${ligado > 0.5 ? 3 : 2}px solid ${ligado > 0.5 ? cor.violeta : cor.linhaForte}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        scale: String(1 - 0.04 * Math.sin(Math.PI * Math.min(1, ligado * 1.2))),
      }}
    >
      {icone === "marcador" ? (
        <svg width={56} height={56} viewBox="0 0 48 48" style={{ overflow: "visible" }}>
          <path
            d="M13 7h22a2 2 0 0 1 2 2v32l-13-9-13 9V9a2 2 0 0 1 2-2Z"
            fill={ligado > 0.5 ? cor.violeta : "none"}
            stroke={ligado > 0.5 ? cor.violeta : cor.tinta}
            strokeWidth={3.6}
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Icone nome={icone} tamanho={56} cor={forte ? "#FFFFFF" : cor.tinta} peso={3.8} />
      )}
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 50, color: forte ? "#FFFFFF" : ligado > 0.5 ? cor.violeta : cor.tinta }}>{texto}</div>
    </div>
  );
};

// Fechamento universal: o texto da chamada e UM botão (link, seguir, salvar ou comentar) que o
// mouse clica na palavra do `destaque`.
const CtaUniversal: React.FC<{ m: TipoCta; plano: Plano; palavras: Palavra[]; t: number; fim: number; entraEm: number }> = ({ m, plano, palavras, t, fim, entraEm }) => {
  const g = geoCtaUniversal(plano, m);
  const { tempos, clique, destaque } = temposDoCta(m, palavras);
  const texto = m.texto ?? m.titulo ?? "";
  const icone = m.icone ?? (m.destaque ? "link" : "salvar");
  const entra = prog(t, entraEm, 0.36);
  const sai = saindo(t, fim, 0.3);
  const pClique = prog(t, clique + 0.02, 0.16);
  const abrindo = icone === "link" ? prog(t, clique + 0.1, 0.9) : 0;
  const trecho = destaque ? texto.split(/\s+/).filter(Boolean).slice(destaque[0], destaque[1] + 1).join(" ") : "";
  const rotulos: Record<string, [string, string]> = {
    link: [trecho || "Abrir link", trecho || "Abrir link"],
    seguir: ["Seguir", "Seguindo"],
    salvar: ["Salvar", "Salvo"],
    comentar: ["Comentar", "Comentado"],
  };
  const [antes, depois] = rotulos[icone];
  const tamBotao = corpoQueCabe(pClique > 0.5 ? depois : antes, g.botao.w - 180, 54, 36);
  // o texto do botão (o trecho em destaque) espera a lápis até ser dito
  const ditoBotao = destaque && icone === "link" ? prog(t, tempos[destaque[0]] - 0.05, 0.25) : 1;
  const nomeIcone = icone === "link" ? (pClique > 0.5 ? "avancar" : "link") : icone === "seguir" ? (pClique > 0.5 ? "check" : "seguir") : icone === "comentar" ? (pClique > 0.5 ? "check" : "enviar") : "marcador";
  const tCampo = m.destaque && g.campo ? temposDoTexto(m.destaque, palavras, m.de, m.ate, m.de + 0.4) : [];
  if (entra <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: g.x,
        top: g.topo,
        width: g.w,
        height: g.altura,
        borderRadius: 38,
        background: "rgba(255,255,255,0.97)",
        boxShadow: sombraJanela,
        outline: `1.5px solid ${cor.linha}`,
        opacity: Math.min(Math.min(1, entra * 2.4), 1 - sai),
        scale: String(mistura(0.94, 1, entra)),
        translate: `0 ${(1 - entra) * 90}px`,
      }}
    >
      <div style={{ position: "absolute", left: 44, right: 44, top: 34 }}>
        <TextoFalado
          enc={g.texto}
          tempos={tempos}
          t={t}
          cor={cor.tinta}
          corDe={(i) => (destaque && i >= destaque[0] && i <= destaque[1] ? cor.violeta : undefined)}
          alturaLinha={1.06}
        />
      </div>
      {g.campo ? (
        <div
          style={{
            position: "absolute",
            left: g.campo.x - g.x,
            top: g.campo.y - g.topo,
            width: g.campo.w,
            height: g.campo.h,
            borderRadius: 26,
            background: cor.painel,
            outline: `2px solid ${cor.linha}`,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "0 26px",
          }}
        >
          <Icone nome="comentar" tamanho={50} cor={cor.violeta} peso={3.8} />
          {m.destaque ? (
            <Palavras texto={m.destaque} tempos={tCampo} t={t} esboco={cor.esboco} style={{ fontFamily: sans, fontWeight: 800, fontSize: corpoQueCabe(m.destaque, g.campo.w - 120, 48, 34), color: cor.tinta, flexWrap: "nowrap", whiteSpace: "nowrap" }} />
          ) : null}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: g.botao.x - g.x,
          top: g.botao.y - g.topo,
          width: g.botao.w,
          height: g.botao.h,
          borderRadius: 30,
          overflow: "hidden",
          background: pClique > 0.5 ? cor.violeta : cor.janela,
          outline: `${pClique > 0.5 ? 0 : 3}px solid ${cor.violeta}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          scale: String(1 - 0.04 * Math.sin(Math.PI * Math.min(1, pClique * 1.2))),
        }}
      >
        {icone === "salvar" ? (
          <svg width={58} height={58} viewBox="0 0 48 48" style={{ overflow: "visible" }}>
            <path d="M13 7h22a2 2 0 0 1 2 2v32l-13-9-13 9V9a2 2 0 0 1 2-2Z" fill={pClique > 0.5 ? "#FFFFFF" : "none"} stroke={pClique > 0.5 ? "#FFFFFF" : cor.violeta} strokeWidth={3.8} strokeLinejoin="round" />
          </svg>
        ) : (
          <Icone nome={nomeIcone} tamanho={58} cor={pClique > 0.5 ? "#FFFFFF" : cor.violeta} peso={4} />
        )}
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamBotao, color: pClique > 0.5 ? "#FFFFFF" : ditoBotao > 0.5 ? cor.violeta : cor.esboco, whiteSpace: "nowrap" }}>{pClique > 0.5 ? depois : antes}</div>
        {/* abrindo o link: um fio claro corre embaixo do botão */}
        {abrindo > 0 && abrindo < 1 ? <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${abrindo * 100}%`, background: "rgba(255,255,255,0.7)" }} /> : null}
      </div>
    </div>
  );
};

export const Cta: React.FC<{ m: TipoCta; plano: Plano; palavras: Palavra[]; t: number; fim: number; topo: number; entraEm: number }> = (props) =>
  ctaAntigo(props.m) ? <CtaAntigo {...props} /> : <CtaUniversal {...props} />;

const CtaAntigo: React.FC<{ m: TipoCta; plano: Plano; palavras: Palavra[]; t: number; fim: number; topo: number; entraEm: number }> = ({ m, plano, palavras, t, fim, topo, entraEm }) => {
  const CARTAO_CTA = cartaoCta(plano, m);
  const b = botoesCta(topo, CARTAO_CTA);
  const salvar = m.salvarEm ?? m.de + 0.4;
  const enviar = m.enviarEm ?? salvar + 0.5;
  const enviado = m.enviadoEm ?? m.ate - 0.4;
  const titulo = m.titulo ?? m.texto ?? "";
  const tTitulo = temposDoTexto(titulo, palavras, m.de, m.ate, m.de + 0.15);
  const tPara = temposDoTexto(m.para ?? "", palavras, enviar, m.ate, enviar + 0.2);
  // sobe depois que o que estava embaixo saiu (sem cruzar dois cartões no mesmo lugar)
  const entra = prog(t, entraEm, 0.36);
  const sai = saindo(t, fim, 0.3);
  const pSalvar = prog(t, salvar + 0.02, 0.16);
  const pEnviar = prog(t, enviar + 0.02, 0.16);
  const pPara = prog(t, enviar + 0.08, 0.3);
  const pEnviado = prog(t, enviado + 0.02, 0.25);
  const seguir = m.acao === "seguir";
  if (entra <= 0.001) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: CARTAO_CTA.x,
        top: topo,
        width: CARTAO_CTA.w,
        height: alturaDoCartaoCta(m),
        borderRadius: 38,
        background: "rgba(255,255,255,0.97)",
        boxShadow: sombraJanela,
        outline: `1.5px solid ${cor.linha}`,
        opacity: Math.min(Math.min(1, entra * 2.4), 1 - sai),
        scale: String(mistura(0.94, 1, entra)),
        translate: `0 ${(1 - entra) * 90}px`,
      }}
    >
      <div style={{ position: "absolute", left: 44, right: 44, top: 32 }}>
        <Palavras texto={titulo} tempos={tTitulo} t={t} style={{ fontFamily: sans, fontWeight: 800, fontSize: 80, color: cor.tinta, lineHeight: 1.05, letterSpacing: "-0.01em" }} />
      </div>

      <Botao topo={topo} origemX={CARTAO_CTA.x} {...b.salvar} icone="marcador" texto={pSalvar > 0.5 ? "Salvo" : "Salvar"} ligado={pSalvar} />
      <Botao
        topo={topo}
        origemX={CARTAO_CTA.x}
        {...b.enviar}
        icone={seguir ? (pEnviar > 0.5 ? "check" : "seguir") : m.para && pEnviado > 0.5 ? "check" : "enviar"}
        texto={seguir ? (pEnviar > 0.5 ? "Seguindo" : "Seguir") : m.para && pEnviado > 0.5 ? "Enviado" : "Enviar"}
        ligado={pEnviar}
        cheio
      />

      {/* destinatário: esboço até o "Enviar", depois a linha digitada na fala */}
      {m.para ? (
        <div style={{ position: "absolute", left: b.para.x - CARTAO_CTA.x, top: b.para.y - topo, width: b.para.w, height: b.para.h }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 26,
              border: `3px dashed ${cor.esboco}`,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 22px",
              opacity: 1 - pPara,
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: 35, background: cor.esbocoClaro }} />
            <div style={{ width: 420, height: 28, borderRadius: 14, background: cor.esbocoClaro }} />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 26,
              background: pEnviado > 0.5 ? cor.violetaFundo : cor.painel,
              outline: `2px solid ${pEnviado > 0.5 ? cor.violeta : cor.linha}`,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 22px",
              opacity: pPara,
              translate: `0 ${(1 - pPara) * 18}px`,
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                flexShrink: 0,
                borderRadius: 35,
                background: cor.violeta,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icone nome={m.avatar ?? "contato"} tamanho={44} cor="#FFFFFF" peso={3.8} />
            </div>
            <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 42, color: cor.tintaSuave }}>Para</div>
            <Palavras texto={m.para} tempos={tPara} t={t} esboco={cor.esboco} style={{ fontFamily: sans, fontWeight: 800, fontSize: 48, color: cor.tinta, flex: 1, flexWrap: "nowrap", whiteSpace: "nowrap" }} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
