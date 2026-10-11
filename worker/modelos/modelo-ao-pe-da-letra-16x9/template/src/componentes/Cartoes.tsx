import { prog, saindo, usePalavras, useRotulos } from "../anim";
import { encaixar, largura as medir } from "../medida";
import { Foto, imagemDoPlano, temImagem } from "../motor/imagem";
import type { Abertura, Cta, Definicao, Destaque, Frase, Numero, Pergunta, Plano } from "../plano";
import { CARTAO, type Lugar } from "../layout";
import { cor, formatar, rotulo, sans } from "../tema";
import { Faixa } from "./Literal";
import { type Alvo, Ponto, TextoFalado, Traco } from "./Ponto";

// Os blocos de quadro cheio: um cartão de tinta na altura do peito, logo abaixo do queixo.
// O texto se monta na fala e o ponto pula de palavra em palavra.
// No quadro deitado (16:9) o cartão é mais largo e mais baixo que no vertical (fileira em vez de
// pilha alta) e fica centrado no rosto. Ele começa logo abaixo do queixo; se o texto não couber
// até o `limite` (a área segura de baixo, ou o topo da legenda), o cartão sobe só o que falta.

export type Zona = { topo: number; altura: number };
const LARG = CARTAO.largura;
const PAD = CARTAO.pad;
const INTERNA = LARG - PAD * 2;
// o mais alto que o cartão pode subir quando não cabe abaixo do queixo
const TETO = 140;

const Cartao: React.FC<{ t: number; de: number; fim: number; lugar: Lugar; children: React.ReactNode; fundo?: string; auto?: boolean }> = ({ t, de, fim, lugar, children, fundo, auto }) => {
  // entra no começo do momento e sai inteiro antes do fim: dois cartões seguidos nunca se sobrepõem
  // no começo do vídeo o cartão já está no primeiro quadro (vira a capa)
  const e = de <= 0.05 ? 1 : prog(t, de, 0.28);
  const s = saindo(t, fim, 0.16);
  const caixa = (
    <div
      style={{
        position: "relative",
        ...(auto ? { minWidth: 300 } : { width: LARG }),
        padding: `${PAD - 8}px ${PAD}px ${PAD}px`,
        boxSizing: "border-box",
        borderRadius: 34,
        background: fundo ?? cor.cartao,
        boxShadow: "0 22px 50px rgba(20,8,30,0.4)",
        overflow: "hidden",
        ...(e >= 1 && s <= 0 ? {} : { opacity: e * (1 - s), translate: `0 ${(1 - e) * 26 + s * 12}px` }),
      }}
    >
      <Faixa style={{ position: "absolute", left: 0, right: 0, top: 0 }} />
      {children}
    </div>
  );
  // uma coluna do TETO até o limite: o espaço de cima (até o queixo) encolhe quando o cartão não
  // cabe embaixo, e o cartão nunca passa do limite
  const espaco = Math.max(0, lugar.queixo + 14 - TETO);
  return (
    <div style={{ position: "absolute", left: lugar.x, width: LARG, top: TETO, height: lugar.limite - TETO, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: "0 1 auto", height: espaco, minHeight: 0 }} />
      <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "center" }}>{caixa}</div>
    </div>
  );
};

type Props<M> = { m: M; t: number; fim: number; lugar: Lugar; plano: Plano };

export const CartaoAbertura: React.FC<Props<Abertura>> = ({ m, t, fim, lugar, plano }) => {
  const R = useRotulos();
  return (
  <Cartao t={t} de={m.de} fim={fim} lugar={lugar} auto>
    <div style={rotulo}>{m.rotulo ?? (plano.marca.area || R.expressoes)}</div>
    <TextoFalado ajustar texto={m.texto} em={m.em ?? m.de} t={t} largura={INTERNA} maximo={72} minimo={48} maxLinhas={3} destaque={m.destaque} limite={m.ate} />
  </Cartao>
  );
};

export const CartaoFrase: React.FC<Props<Frase>> = ({ m, t, fim, lugar }) => (
  <Cartao t={t} de={m.de} fim={fim} lugar={lugar} auto>
    <div style={{ fontFamily: sans, fontWeight: 900, fontSize: 92, lineHeight: 0.6, height: 36, color: cor.coral }}>“</div>
    <TextoFalado
      ajustar
      texto={m.texto}
      em={m.em ?? m.de}
      t={t}
      largura={INTERNA}
      maximo={64}
      minimo={42}
      maxLinhas={3}
      destaque={m.destaque}
      risco={m.risco}
      riscoEm={m.riscoEm}
      limite={m.ate}
    />
  </Cartao>
);

export const CartaoDestaque: React.FC<Props<Destaque>> = ({ m, t, fim, lugar, plano }) => {
  const R = useRotulos();
  const img = imagemDoPlano(plano, m.imagem);
  const foto = temImagem(img);
  const larg = foto ? INTERNA - 214 : INTERNA;
  const alerta = m.nivel === "alerta";
  const { tamanho, linhas } = encaixar(m.texto, larg, 84, 50, 2, { peso: 800 });
  const pT = prog(t, m.em + 0.3, 0.4);
  const pD = prog(t, m.detalheEm ?? m.em + 0.6, 0.3);
  const lMax = Math.max(...linhas.map((l) => medir(l.join(" "), tamanho, { peso: 800 })));
  return (
    <Cartao t={t} de={m.de} fim={fim} lugar={lugar}>
      <div style={{ position: "relative", minHeight: foto ? 194 : undefined }}>
        <div style={{ ...rotulo, color: alerta ? cor.coral : cor.lilas }}>{alerta ? R.atencao : R.guarde}</div>
        <div style={{ position: "relative", width: larg }}>
          <TextoFalado texto={m.texto} em={m.em} t={t} largura={larg} maximo={84} minimo={50} maxLinhas={2} corTexto={alerta ? cor.coral : cor.tinta} />
          {!alerta && pT > 0 ? <Traco largura={Math.min(larg, lMax)} p={pT} style={{ left: 0, bottom: -22 }} /> : null}
        </div>
        {m.detalhe ? (
          <div style={{ marginTop: 28, fontFamily: sans, fontWeight: 600, fontSize: 34, color: cor.lilas, width: larg, opacity: pD }}>{m.detalhe}</div>
        ) : null}
        {foto ? (
          <Foto
            imagem={img}
            foco={m.imagem?.foco}
            de={m.em}
            t={t}
            entrada="escala"
            largura={184}
            altura={184}
            efeito={m.imagem?.efeito ?? "aproximar"}
            style={{ position: "absolute", right: 0, top: 6, borderRadius: 24, border: `5px solid ${cor.tinta}`, rotate: "3deg" }}
          />
        ) : null}
      </div>
    </Cartao>
  );
};

export const CartaoNumero: React.FC<Props<Numero>> = ({ m, t, fim, lugar }) => {
  const R = useRotulos();
  const casas = m.casas ?? (m.valor % 1 !== 0 ? 1 : 0);
  const v = m.valor * prog(t, m.em, 1.0);
  const textoFinal = `${m.prefixo ?? ""}${formatar(m.valor, casas)}${m.sufixo ?? ""}`;
  const { tamanho } = encaixar(textoFinal, INTERNA, 136, 70, 1, { peso: 800 });
  const lFinal = medir(textoFinal, tamanho, { peso: 800 });
  const pRot = prog(t, m.rotuloEm ?? m.em + 0.4, 0.3);
  const alvos: Alvo[] = [{ t: m.em + 1.0, x: lFinal / 2, y: 6 }];
  return (
    <Cartao t={t} de={m.de} fim={fim} lugar={lugar}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={rotulo}>{R.numero}</div>
        {m.ilustrativo ? <div style={{ ...rotulo, color: cor.coral }}>{R.ilustrativo}</div> : null}
      </div>
      <div style={{ position: "relative", marginTop: 18 }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamanho, lineHeight: 1.05, color: cor.tinta, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {m.prefixo ?? ""}
          {formatar(v, casas)}
          {m.sufixo ?? ""}
        </div>
        <Ponto alvos={alvos} t={t} raio={14} />
      </div>
      <div style={{ marginTop: 6, fontFamily: sans, fontWeight: 700, fontSize: 40, color: cor.lilas, opacity: pRot }}>{m.rotulo}</div>
    </Cartao>
  );
};

export const CartaoDefinicao: React.FC<Props<Definicao>> = ({ m, t, fim, lugar, plano }) => {
  const R = useRotulos();
  const img = imagemDoPlano(plano, m.imagem);
  const foto = temImagem(img);
  const larg = foto ? INTERNA - 214 : INTERNA;
  const { tamanho } = encaixar(m.termo, larg, 80, 46, 1, { peso: 800 });
    const lTermo = medir(m.termo, tamanho, { peso: 800 });
  return (
    <Cartao t={t} de={m.de} fim={fim} lugar={lugar}>
      <div style={{ position: "relative", minHeight: foto ? 200 : undefined }}>
        <div style={rotulo}>{R.quer}</div>
        <div style={{ position: "relative", marginTop: 10, opacity: prog(t, m.em - 0.05, 0.25) }}>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamanho, lineHeight: 1.1, color: cor.tinta, whiteSpace: "nowrap" }}>{m.termo}</div>
          <Ponto alvos={[{ t: m.em + 0.05, x: lTermo / 2, y: 2 }]} t={t} raio={12} />
        </div>
        <div style={{ marginTop: 12, width: larg }}>
          <TextoFalado texto={m.significado} em={m.significadoEm} t={t} largura={larg} maximo={46} minimo={34} maxLinhas={2} peso={700} semPonto limite={m.ate} />
        </div>
        {foto ? (
          <Foto
            imagem={img}
            foco={m.imagem?.foco}
            de={m.em}
            t={t}
            entrada="escala"
            largura={184}
            altura={184}
            efeito={m.imagem?.efeito ?? "aproximar"}
            style={{ position: "absolute", right: 0, top: 4, borderRadius: 24, border: `5px solid ${cor.tinta}`, rotate: "3deg" }}
          />
        ) : null}
      </div>
    </Cartao>
  );
};

export const CartaoPergunta: React.FC<Props<Pergunta>> = ({ m, t, fim, lugar }) => {
  const R = useRotulos();
  const opcoes = m.opcoes ?? [];
  // as opções: pílulas que entram quando ditas; o ponto pula para cada uma. No quadro deitado elas
  // preferem uma fileira só (duas, se não couberem)
  const juntas = opcoes.map((o) => o.texto).join("      ");
  const umaFileira = encaixar(juntas, INTERNA, 44, 32, 1, { peso: 800 });
  const tam = umaFileira.linhas.length <= 1 ? umaFileira.tamanho : encaixar(juntas, INTERNA * 1.8, 44, 32, 2, { peso: 800 }).tamanho;
  let x = 0;
  let y = 0;
  const pilulas = opcoes.map((o) => {
    const w = medir(o.texto, tam, { peso: 800 }) + 56;
    if (x > 0 && x + w > INTERNA) {
      x = 0;
      y += tam + 40;
    }
    const pos = { ...o, x, y, w };
    x += w + 18;
    return pos;
  });
  const alvos: Alvo[] = pilulas.map((p) => ({ t: p.em, x: p.x + p.w / 2, y: p.y - 4 }));
  return (
    <Cartao t={t} de={m.de} fim={fim} lugar={lugar}>
      <div style={rotulo}>{R.voce}</div>
      <TextoFalado texto={m.texto} em={m.em ?? m.de} t={t} largura={INTERNA} maximo={60} minimo={40} maxLinhas={2} limite={opcoes[0]?.em ?? m.ate} semPonto={opcoes.length > 0} />
      {opcoes.length ? (
        <div style={{ position: "relative", marginTop: 28, height: y + tam + 30 }}>
          {pilulas.map((p, i) => {
            const e = prog(t, p.em - 0.05, 0.25);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  width: p.w,
                  padding: "10px 0 12px",
                  textAlign: "center",
                  borderRadius: 40,
                  background: cor.fundo2,
                  border: `3px solid ${cor.linha}`,
                  fontFamily: sans,
                  fontWeight: 800,
                  fontSize: tam,
                  color: cor.tinta,
                  whiteSpace: "nowrap",
                  ...(e >= 1 ? {} : { opacity: e, translate: `0 ${(1 - e) * 12}px` }),
                }}
              >
                {p.texto}
              </div>
            );
          })}
          <Ponto alvos={alvos} t={t} raio={11} />
        </div>
      ) : null}
    </Cartao>
  );
};

const Icone: React.FC<{ tipo: Cta["icone"]; p: number }> = ({ tipo, p }) => {
  const traco = { fill: "none", stroke: cor.tinta, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p };
  return (
    <svg width={104} height={104} viewBox="0 0 96 96">
      <circle cx={48} cy={48} r={46} fill={cor.fundo2} stroke={cor.coral} strokeWidth={3} />
      {tipo === "seguir" ? (
        <>
          <circle cx={42} cy={36} r={13} {...traco} />
          <path d="M18 72 C 20 56, 64 56, 66 72" {...traco} />
          <path d="M72 30 L72 50 M62 40 L82 40" {...traco} stroke={cor.coral} />
        </>
      ) : tipo === "comentar" ? (
        <path d="M22 26 H74 V60 H44 L30 72 V60 H22 Z" {...traco} />
      ) : tipo === "link" ? (
        <>
          <path d="M42 54 L54 42" {...traco} stroke={cor.coral} />
          <path d="M38 46 L30 54 A10 10 0 0 0 44 68 L52 60" {...traco} />
          <path d="M58 50 L66 42 A10 10 0 0 0 52 28 L44 36" {...traco} />
        </>
      ) : (
        <path d="M32 22 H64 V76 L48 64 L32 76 Z" {...traco} />
      )}
    </svg>
  );
};

export const CartaoCta: React.FC<Props<Cta>> = ({ m, t, fim, lugar, plano }) => {
  const pI = prog(t, m.de + 0.1, 0.6);
  return (
    <Cartao t={t} de={m.de} fim={fim} lugar={lugar}>
      <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
        <Icone tipo={m.icone ?? "salvar"} p={pI} />
        <div style={{ flex: 1 }}>
          <TextoFalado texto={m.texto} em={m.em ?? m.de} t={t} largura={INTERNA - 132} maximo={72} minimo={44} maxLinhas={2} destaque={m.destaque} />
          {plano.marca.nome ? (
            <div style={{ ...rotulo, marginTop: 18, opacity: prog(t, m.de + 0.6, 0.3) }}>
              {plano.marca.nome}
              {plano.marca.area ? <span style={{ color: cor.coral }}> · {plano.marca.area}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    </Cartao>
  );
};
