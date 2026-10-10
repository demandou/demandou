import { mix, mixCor, prog, viagem } from "../anim";
import { type CartaoInspetor, type Linha, PG, ROLAGEM_BOTAO, rolagemEm } from "../cena";
import { layoutLimpo } from "../layoutPagina";
import type { Pagina, TipoErro, TipoPasso } from "../plano";
import { ALTURA_VISIVEL, contraste, cor, formatarRazao, INSPETOR, milhar, mono, rotulo, sans } from "../tema";
import { Check } from "./Icones";
import { TITULO, encaixar } from "../medida";

// O inspetor do canvas: a medida de cada erro e de cada conserto (palavras na 1ª tela, rolagem
// até o botão, contraste, peso da imagem, links do menu, pedidos). Um cartão por vez; o que sai
// cruza com o que entra.

const IN = 28;
const LARGURA = INSPETOR.w - 2 * IN;

const ROTULOS: Record<TipoErro, string> = {
  texto: "1ª tela",
  botao: "Rolagem",
  contraste: "Contraste",
  imagem: "Imagem",
  menu: "Menu",
};
const DO_PASSO: Record<TipoPasso, TipoErro> = {
  promessa: "texto",
  botao: "botao",
  contraste: "contraste",
  imagem: "imagem",
  menu: "menu",
};

export const Inspetor: React.FC<{ t: number; linha: Linha; pagina: Required<Pagina>; presenca: number }> = ({ t, linha, pagina, presenca }) => {
  const lista = linha.inspetor;
  let i = -1;
  for (let k = 0; k < lista.length; k++) if (t >= lista[k].t) i = k;
  const entrada = prog(presenca, 0.5, 0.5);

  const cartoes: { c: CartaoInspetor; t0: number; papel: "entra" | "sai" | "esboco" }[] = [];
  if (i < 0 && lista.length) cartoes.push({ c: lista[0].cartao, t0: lista[0].t, papel: "esboco" });
  if (i >= 0) {
    cartoes.push({ c: lista[i].cartao, t0: lista[i].t, papel: "entra" });
    if (i > 0 && t - lista[i].t < 0.38) cartoes.push({ c: lista[i - 1].cartao, t0: lista[i - 1].t, papel: "sai" });
  }

  return (
    <div
      style={{
        position: "absolute",
        left: INSPETOR.x,
        top: INSPETOR.y,
        width: INSPETOR.w,
        height: INSPETOR.h,
        borderRadius: 26,
        background: cor.painel,
        boxShadow: `0 0 0 1.5px ${cor.painelBorda}, 0 24px 50px rgba(0,0,0,0.35)`,
        overflow: "hidden",
        opacity: entrada,
        translate: `${(1 - entrada) * 60}px 0`,
      }}
    >
      {cartoes.map(({ c, t0, papel }) => {
        // troca em carrossel vertical: o cartão que sai sobe, o que entra vem de baixo (sem sobrepor)
        // o primeiro cartão já chega com o painel (não desliza)
        const pIn = papel === "entra" && i > 0 ? prog(t, t0, 0.36, viagem) : 1;
        const pOut = papel === "sai" ? prog(t, lista[i].t, 0.36, viagem) : 0;
        return (
          <div
            key={`${papel}-${t0}`}
            style={{
              position: "absolute",
              inset: 0,
              padding: IN,
              translate: `0 ${(1 - pIn) * INSPETOR.h - pOut * INSPETOR.h}px`,
            }}
          >
            <Cartao c={c} t={t} t0={t0} linha={linha} pagina={pagina} esboco={papel === "esboco"} />
          </div>
        );
      })}
    </div>
  );
};

const Cabeca: React.FC<{ texto: string; ok: boolean; marca: string }> = ({ texto, ok, marca }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40 }}>
    <div style={{ ...rotulo, color: cor.hud }}>{texto}</div>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        background: ok ? marca : cor.vermelho,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: mono,
        fontWeight: 700,
        fontSize: 30,
        color: "#FFFFFF",
        lineHeight: 1,
      }}
    >
      {ok ? <Check tamanho={22} cor={cor.tinta} espessura={4} /> : "!"}
    </div>
  </div>
);

const Numero: React.FC<{ texto: string; cor: string }> = ({ texto, cor: c }) => {
  const tamanho = Math.min(84, Math.floor(LARGURA / (Math.max(3, texto.length) * 0.62)));
  return (
    <div style={{ fontFamily: mono, fontWeight: 700, fontSize: tamanho, lineHeight: "100px", height: 100, color: c, marginTop: 14, whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
      {texto}
    </div>
  );
};

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 36, color: "#C9CBD0", lineHeight: 1.15, height: 44 }}>{children}</div>
);

const Cartao: React.FC<{ c: CartaoInspetor; t: number; t0: number; linha: Linha; pagina: Required<Pagina>; esboco: boolean }> = ({
  c,
  t,
  t0,
  linha,
  pagina,
  esboco,
}) => {
  const marca = pagina.cor;
  const erro: TipoErro = c.tipo === "erro" ? c.erro : c.tipo === "ok" ? DO_PASSO[c.passo] : "texto";
  const ok = c.tipo !== "erro";
  const corNumero = ok ? marca : cor.vermelho;
  const conta = prog(t, t0, 0.9);

  if (c.tipo === "resultado") {
    const chegaram = c.itens.reduce((n, em) => n + prog(t, em, 0.3), 0);
    const k = Math.round(chegaram);
    return (
      <>
        <Cabeca texto={c.rotulo} ok marca={marca} />
        <Numero texto={`+${k}`} cor={marca} />
        <Sub>novos agora</Sub>
        <Barras antes={0.28} depois={0.28 + 0.72 * (chegaram / Math.max(1, c.total))} marca={marca} />
      </>
    );
  }

  if (c.tipo === "livre") {
    // qualquer assunto: o nome do problema (ou do conserto), com valor e texto só se vieram da fala
    const q = encaixar(c.rotulo, { largura: LARGURA, max: 56, min: 38, linhas: 3, estilo: () => TITULO });
    const cabeca = c.ok ? "Resolvido" : "Problema";
    if (esboco) {
      return (
        <>
          <Cabeca texto={cabeca} ok={false} marca={marca} />
          <div style={{ marginTop: 14, height: 100, display: "flex", alignItems: "center" }}>
            <div style={{ width: 200, height: 64, borderRadius: 12, border: `3px dashed ${cor.painelBorda}` }} />
          </div>
        </>
      );
    }
    return (
      <>
        <Cabeca texto={cabeca} ok={c.ok} marca={marca} />
        {c.valor ? (
          <>
            <Numero texto={c.valor} cor={corNumero} />
            {c.texto ? <Sub>{c.texto}</Sub> : null}
          </>
        ) : null}
        <div style={{ marginTop: c.valor ? 18 : 26, fontFamily: sans, fontWeight: 700, fontSize: q.tamanho, lineHeight: 1.1, color: c.ok ? marca : "#E9EAEC", opacity: prog(t, t0, 0.3), whiteSpace: "pre-line" }}>{q.linhas.map((l) => l.map((w) => w.w).join(" ")).join("\n")}</div>
        {!c.valor && c.texto ? <div style={{ marginTop: 14, fontFamily: sans, fontWeight: 500, fontSize: 36, color: "#C9CBD0" }}>{c.texto}</div> : null}
      </>
    );
  }

  if (esboco) {
    return (
      <>
        <Cabeca texto={ROTULOS[erro]} ok={false} marca={marca} />
        <div style={{ marginTop: 14, height: 100, display: "flex", alignItems: "center" }}>
          <div style={{ width: 200, height: 64, borderRadius: 12, border: `3px dashed ${cor.painelBorda}` }} />
        </div>
      </>
    );
  }

  if (erro === "texto") {
    const n = ok ? Math.round(mix(pagina.palavras, pagina.promessa.split(/\s+/).filter(Boolean).length, conta)) : Math.round(pagina.palavras * conta);
    return (
      <>
        <Cabeca texto={ROTULOS.texto} ok={ok} marca={marca} />
        <Numero texto={String(n)} cor={corNumero} />
        <Sub>palavras na tela</Sub>
        <MiniTela t={t} t0={t0} ok={ok} marca={marca} />
      </>
    );
  }

  if (erro === "botao") {
    const rol = rolagemEm(t, linha);
    const L = layoutLimpo(pagina);
    // no erro, o número acompanha a rolagem da página; no conserto, desce até zero
    const v = ok ? pagina.rolagem * (1 - conta) : pagina.rolagem * Math.min(1, rol / ROLAGEM_BOTAO);
    const yBotao = ok ? mix(PG.botaoAntes.y, L.botao.y, conta) : PG.botaoAntes.y;
    return (
      <>
        <Cabeca texto={ROTULOS.botao} ok={ok} marca={marca} />
        <Numero texto={milhar(v)} cor={corNumero} />
        <Sub>px até o botão</Sub>
        <Minimapa rolagem={ok ? 0 : rol} yBotao={yBotao} marca={marca} ok={ok} />
      </>
    );
  }

  if (erro === "contraste") {
    const antes = contraste(cor.textoFraco, cor.tela);
    const depois = contraste(pagina.tinta, pagina.cor);
    // no erro, o contraste só é calculado quando o conta-gotas pega a cor do fundo
    const erroC = linha.erros.find((e) => e.tipo === "contraste");
    const medeEm = erroC?.medeEm ?? (erroC ? erroC.em + 0.6 : t0);
    const calcula = prog(t, medeEm + 0.25, 0.5);
    const r = ok ? mix(antes, depois, conta) : mix(1, antes, calcula);
    if (!ok && calcula <= 0) {
      return (
        <>
          <Cabeca texto={ROTULOS.contraste} ok={false} marca={marca} />
          <Numero texto="–,–:1" cor="#5C6069" />
          <Sub>medindo…</Sub>
          <Medidor r={1} ok={false} conta={0} pagina={pagina} letra={prog(t, (erroC?.em ?? t0) + 0.1, 0.3)} fundo={0} />
        </>
      );
    }
    const nivel = depois >= 7 ? "AAA" : depois >= 4.5 ? "AA" : "abaixo";
    return (
      <>
        <Cabeca texto={ROTULOS.contraste} ok={ok} marca={marca} />
        <Numero texto={formatarRazao(r)} cor={corNumero} />
        <Sub>{ok ? `passou · ${nivel}` : "mínimo 4,5:1"}</Sub>
        <Medidor r={r} ok={ok} conta={conta} pagina={pagina} letra={1} fundo={ok ? 1 : prog(t, medeEm, 0.3)} />
      </>
    );
  }

  if (erro === "imagem") {
    return (
      <>
        <Cabeca texto={ROTULOS.imagem} ok={ok} marca={marca} />
        <Numero texto={ok ? pagina.pesoDepois : pagina.pesoAntes} cor={corNumero} />
        <Sub>{ok ? "carrega na hora" : "para carregar"}</Sub>
        <div style={{ marginTop: 40, height: 16, borderRadius: 8, background: "#3A3D44", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${ok ? 100 * conta : 8 + 18 * prog(t, t0, 2.5)}%`, background: corNumero, borderRadius: 8 }} />
        </div>
      </>
    );
  }

  // menu
  const links = ok ? Math.round(mix(pagina.links, 1, conta)) : Math.round(pagina.links * conta);
  return (
    <>
      <Cabeca texto={ROTULOS.menu} ok={ok} marca={marca} />
      <Numero texto={String(links)} cor={corNumero} />
      <Sub>{links === 1 ? "link no topo" : "links no topo"}</Sub>
      <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 10, width: LARGURA }}>
        {Array.from({ length: pagina.links }, (_, k) => (
          <div key={k} style={{ width: 80, height: 26, borderRadius: 13, background: k < links ? corNumero : "#3A3D44", opacity: k < links ? 0.9 : 0.5 }} />
        ))}
      </div>
    </>
  );
};

// Miniatura da primeira tela: a parede de linhas (erro) ou uma frase e um botão (conserto)
const MiniTela: React.FC<{ t: number; t0: number; ok: boolean; marca: string }> = ({ t, t0, ok, marca }) => {
  const linhas = [0.95, 0.85, 0.92, 0.7, 0.9, 0.88, 0.6];
  return (
    <div style={{ marginTop: 26, display: "flex", gap: 22, alignItems: "flex-start" }}>
      <div style={{ position: "relative", width: 96, height: 150, borderRadius: 16, border: "3px solid #4A4E56", flexShrink: 0 }}>
        {linhas.map((w, k) => {
          const p = ok ? 1 - prog(t, t0 + k * 0.03, 0.3) : prog(t, t0 + k * 0.07, 0.25);
          return <div key={k} style={{ position: "absolute", left: 12, top: 16 + k * 17, width: 66 * w * p, height: 7, borderRadius: 4, background: "#6A6E77" }} />;
        })}
        {ok ? (
          <>
            <div style={{ position: "absolute", left: 12, top: 20, width: 66 * prog(t, t0 + 0.2, 0.3), height: 14, borderRadius: 7, background: marca }} />
            <div style={{ position: "absolute", left: 12, top: 44, width: 46 * prog(t, t0 + 0.35, 0.3), height: 14, borderRadius: 7, background: marca }} />
            <div style={{ position: "absolute", left: 12, top: 72, width: 66 * prog(t, t0 + 0.5, 0.3), height: 18, borderRadius: 9, background: "#E9EAEC" }} />
          </>
        ) : null}
      </div>
      <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 32, lineHeight: 1.2, color: cor.hud, paddingTop: 6 }}>
        ideal:
        <br />
        <span style={{ fontWeight: 700, color: ok ? marca : "#E9EAEC" }}>1 frase</span>
      </div>
    </div>
  );
};

// Minimapa da página: a janela da primeira tela e onde o botão está
const Minimapa: React.FC<{ rolagem: number; yBotao: number; marca: string; ok: boolean }> = ({ rolagem, yBotao, marca, ok }) => {
  const altura = 150;
  const k = altura / PG.altura;
  const janela = ALTURA_VISIVEL * k;
  const yb = yBotao * k;
  return (
    <div style={{ marginTop: 26, display: "flex", gap: 22, alignItems: "flex-start" }}>
      <div style={{ position: "relative", width: 64, height: altura, borderRadius: 10, background: "#33363C", flexShrink: 0 }}>
        <div
          style={{
            position: "absolute",
            left: -4,
            right: -4,
            top: rolagem * k,
            height: janela,
            borderRadius: 8,
            border: `3px solid ${ok ? marca : "#E9EAEC"}`,
          }}
        />
        <div style={{ position: "absolute", left: 14, top: yb - 5, width: 36, height: 12, borderRadius: 6, background: ok ? marca : cor.vermelho }} />
      </div>
      <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 32, lineHeight: 1.2, color: cor.hud, paddingTop: 2 }}>
        <span style={{ color: "#E9EAEC", fontWeight: 700 }}>1ª tela</span>
        <br />
        {ok ? "com o botão" : "e o botão"}
        <br />
        {ok ? "dentro" : "lá embaixo"}
      </div>
    </div>
  );
};

// Medidor de contraste: as duas cores que o conta-gotas pegou (letra e fundo), a amostra "Aa"
// e a régua (escala log de 1 a 21) com o mínimo 4,5
const Medidor: React.FC<{ r: number; ok: boolean; conta: number; pagina: Required<Pagina>; letra: number; fundo: number }> = ({
  r,
  ok,
  conta,
  pagina,
  letra,
  fundo,
}) => {
  const pos = (v: number) => Math.log(v) / Math.log(21);
  const corFundo = ok ? mixCor(cor.tela, pagina.cor, conta) : cor.tela;
  const corLetra = ok ? mixCor(cor.textoFraco, pagina.tinta, conta) : cor.textoFraco;
  const amostra = (c: string, p: number, rot: string) => (
    <div style={{ width: 98, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
      <div style={{ position: "relative", width: 62, height: 62 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, border: `3px dashed ${cor.painelBorda}`, opacity: 1 - p }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: c, transform: `scale(${0.6 + 0.4 * p})`, opacity: p, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)" }} />
      </div>
      <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, color: cor.hud, lineHeight: 1 }}>{rot}</div>
    </div>
  );
  const largura = LARGURA;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {amostra(corLetra, letra, "letra")}
        {amostra(corFundo, fundo, "fundo")}
        <div
          style={{
            width: 76,
            height: 62,
            borderRadius: 14,
            flexShrink: 0,
            background: corFundo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: sans,
            fontWeight: 700,
            fontSize: 38,
            color: corLetra,
            opacity: Math.min(letra, fundo),
          }}
        >
          Aa
        </div>
      </div>
      <div style={{ position: "relative", width: largura, height: 66, marginTop: 14 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 8, height: 12, borderRadius: 6, background: "#3A3D44" }} />
        <div style={{ position: "absolute", left: 0, top: 8, height: 12, width: largura * pos(4.5), borderRadius: 6, background: "rgba(255,71,51,0.35)" }} />
        <div style={{ position: "absolute", left: largura * pos(4.5) - 1.5, top: 0, width: 3, height: 28, background: "#E9EAEC" }} />
        <div style={{ position: "absolute", left: largura * pos(4.5) - 30, top: 32, fontFamily: mono, fontWeight: 700, fontSize: 30, color: "#E9EAEC" }}>4,5</div>
        <div
          style={{
            position: "absolute",
            left: largura * pos(Math.max(1, r)) - 11,
            top: 3,
            width: 22,
            height: 22,
            borderRadius: 11,
            background: ok ? pagina.cor : cor.vermelho,
            boxShadow: "0 0 0 4px #26282C",
            opacity: Math.min(letra, fundo),
          }}
        />
      </div>
    </div>
  );
};

const Barras: React.FC<{ antes: number; depois: number; marca: string }> = ({ antes, depois, marca }) => {
  const alto = 120;
  return (
    <div style={{ marginTop: 18, display: "flex", gap: 26, alignItems: "flex-end", height: alto + 40 }}>
      {[
        { v: antes, rot: "antes", c: "#4A4E56" },
        { v: depois, rot: "depois", c: marca },
      ].map((b) => (
        <div key={b.rot} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: 92, height: alto * b.v, borderRadius: 10, background: b.c }} />
          <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 30, color: cor.hud }}>{b.rot}</div>
        </div>
      ))}
    </div>
  );
};
