// Destaque e pergunta: elementos do sistema no peito da pessoa em tela cheia.
// Destaque = uma notificação: "chave" é clara com o marcador violeta; "alerta" é escura com o
// triângulo. A frase se monta na fala; o detalhe entra menor, na palavra dele.
// Pergunta = uma caixa de diálogo: a pergunta se monta e as opções viram botões, cada um na sua
// palavra; o foco (contorno violeta) passa para o botão que acabou de entrar.
import { limitar, mistura, prog, saindo, temposDoTexto } from "../anim";
import { FUNDO_PEITO, topoDoPeito } from "../geometria";
import { encaixar, type Encaixe } from "../medida";
import type { Destaque, Palavra, Pergunta, Plano } from "../plano";
import { alturaDoTexto, TextoFalado } from "../texto";
import { cor, MARGEM_JANELA, sans, sombraJanela, W } from "../tema";
import { Icone } from "./Icones";

const X = MARGEM_JANELA;
const LARGURA = W - 2 * MARGEM_JANELA;
const PAD = 38;

// entra quando a pessoa já cobre a tela (`entraEm`); sai antes de a pessoa encolher
const entrada = (t: number, entraEm: number, fim: number) => {
  const entra = prog(t, entraEm, 0.4);
  const sai = saindo(t, fim + 0.08, 0.2);
  return { entra, sai, visivel: entra > 0.001 && sai < 0.999 };
};

const Cartao: React.FC<{ y: number; h: number; escuro?: boolean; entra: number; sai: number; children: React.ReactNode }> = ({ y, h, escuro, entra, sai, children }) => (
  <div
    style={{
      position: "absolute",
      left: X,
      top: y,
      width: LARGURA,
      height: h,
      borderRadius: 38,
      background: escuro ? "rgba(23,20,31,0.97)" : "rgba(255,255,255,0.97)",
      boxShadow: sombraJanela,
      outline: `1.5px solid ${escuro ? "rgba(255,255,255,0.08)" : cor.linha}`,
      overflow: "hidden",
      opacity: Math.min(limitar(entra * 2.4), 1 - sai),
      scale: String(mistura(0.95, 1, entra) * mistura(1, 0.96, sai)),
      translate: `0 ${(1 - entra) * -34 + sai * -14}px`,
    }}
  >
    {children}
  </div>
);

export const BlocoDestaque: React.FC<{ m: Destaque; plano: Plano; palavras: Palavra[]; t: number; fim: number; entraEm: number }> = ({ m, plano, palavras, t, fim, entraEm }) => {
  const { entra, sai, visivel } = entrada(t, entraEm, fim);
  if (!visivel) return null;
  const alerta = m.nivel === "alerta";
  const y = topoDoPeito(plano);
  const livre = FUNDO_PEITO - y;
  const largura = LARGURA - 2 * PAD;
  const detalhe = m.detalhe ? encaixar(m.detalhe, { largura, max: 46, min: 36, linhas: 2, fonte: { peso: 700 } }) : null;
  const hDet = detalhe ? alturaDoTexto(detalhe, 1.14) + 16 : 0;
  const fixo = PAD + 60 + 20 + hDet + PAD + 6;
  let texto: Encaixe = encaixar(m.texto, { largura, max: 92, min: 56, linhas: 3 });
  for (let max = 88; alturaDoTexto(texto, 1.06) > livre - fixo && max >= 50; max -= 6) texto = encaixar(m.texto, { largura, max, min: Math.min(56, max), linhas: 3 });
  const h = fixo + alturaDoTexto(texto, 1.06);
  const tempos = temposDoTexto(m.texto, palavras, m.em - 0.3, m.ate, m.em);
  const tDet = m.detalhe ? temposDoTexto(m.detalhe, palavras, (m.detalheEm ?? m.em) - 0.3, m.ate + 0.2, m.detalheEm ?? (tempos[tempos.length - 1] ?? m.em) + 0.3) : [];
  const tinta = alerta ? "#FFFFFF" : cor.tinta;
  const apoio = alerta ? "rgba(255,255,255,0.62)" : cor.tintaSuave;
  const pIcone = prog(t, m.em - 0.1, 0.3);
  return (
    <Cartao y={y} h={h} escuro={alerta} entra={entra} sai={sai}>
      <div style={{ position: "absolute", left: PAD, right: PAD, top: PAD }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, height: 60 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: cor.violeta,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icone nome={alerta ? "aviso" : "marcador"} tamanho={40} cor="#FFFFFF" peso={4} p={pIcone} />
          </div>
          <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 36, color: apoio }}>{alerta ? "Atenção" : "Avisos"}</div>
          <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 34, color: apoio }}>· agora</div>
        </div>
        <div style={{ marginTop: 20 }}>
          <TextoFalado enc={texto} tempos={tempos} t={t} cor={tinta} alturaLinha={1.06} />
        </div>
        {detalhe ? (
          <div style={{ marginTop: 16 }}>
            <TextoFalado enc={detalhe} tempos={tDet} t={t} cor={apoio} fonte={{ peso: 700 }} alturaLinha={1.14} />
          </div>
        ) : null}
      </div>
    </Cartao>
  );
};

export const BlocoPergunta: React.FC<{ m: Pergunta; plano: Plano; palavras: Palavra[]; t: number; fim: number; entraEm: number }> = ({ m, plano, palavras, t, fim, entraEm }) => {
  const { entra, sai, visivel } = entrada(t, entraEm, fim);
  if (!visivel) return null;
  const y = topoDoPeito(plano);
  const livre = FUNDO_PEITO - y;
  const icone = 72;
  const larguraTexto = LARGURA - 2 * PAD - icone - 26;
  const opcoes = (m.opcoes ?? []).slice(0, 4);
  const n = opcoes.length;
  // botões: em duas colunas se couber, senão um embaixo do outro
  const vao = 20;
  const duas = n === 2 || n === 4;
  const larguraBotao = duas ? (LARGURA - 2 * PAD - vao) / 2 : LARGURA - 2 * PAD;
  const encOpcoes = opcoes.map((o) => encaixar(o.texto, { largura: larguraBotao - 56, max: 44, min: 34, linhas: 2, fonte: { peso: 800 } }));
  const tamOpcao = Math.min(...encOpcoes.map((e) => e.tamanho), 44);
  const encOp = opcoes.map((o) => encaixar(o.texto, { largura: larguraBotao - 56, max: tamOpcao, min: Math.min(34, tamOpcao), linhas: 2, fonte: { peso: 800 } }));
  const linhasBotao = Math.max(1, ...encOp.map((e) => e.linhas.length));
  const hBotao = linhasBotao * tamOpcao * 1.1 + 40;
  const filas = n === 0 ? 0 : duas ? Math.ceil(n / 2) : n;
  const hOpcoes = filas ? filas * hBotao + (filas - 1) * vao + 30 : 0;
  let texto = encaixar(m.texto, { largura: larguraTexto, max: 74, min: 48, linhas: 3 });
  for (let max = 68; alturaDoTexto(texto, 1.08) + hOpcoes + 2 * PAD > livre && max >= 44; max -= 6)
    texto = encaixar(m.texto, { largura: larguraTexto, max, min: Math.min(48, max), linhas: 3 });
  const hTexto = Math.max(icone, alturaDoTexto(texto, 1.08));
  const h = 2 * PAD + hTexto + hOpcoes;
  const inicio = m.em ?? m.de + 0.15;
  const tempos = temposDoTexto(m.texto, palavras, inicio - 0.3, m.ate, inicio);
  const foco = opcoes.reduce((k, o, i) => (t >= o.em - 0.05 ? i : k), -1);
  return (
    <Cartao y={y} h={h} entra={entra} sai={sai}>
      <div style={{ position: "absolute", left: PAD, top: PAD, display: "flex", gap: 26, alignItems: "flex-start" }}>
        <div style={{ width: icone, height: icone, flexShrink: 0, borderRadius: 20, background: cor.violeta, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome="pergunta" tamanho={50} cor="#FFFFFF" peso={4} />
        </div>
        <TextoFalado enc={texto} tempos={tempos} t={t} cor={cor.tinta} esboco={cor.esbocoClaro} alturaLinha={1.08} />
      </div>
      {opcoes.map((o, i) => {
        const col = duas ? i % 2 : 0;
        const fila = duas ? Math.floor(i / 2) : i;
        const p = prog(t, o.em - 0.06, 0.3);
        const focado = i === foco ? prog(t, o.em, 0.2) : 0;
        const tOp = temposDoTexto(o.texto, palavras, o.em - 0.3, m.ate, o.em);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: PAD + col * (larguraBotao + vao),
              top: PAD + hTexto + 30 + fila * (hBotao + vao),
              width: larguraBotao,
              height: hBotao,
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: 26, border: `3px dashed ${cor.esboco}`, opacity: (1 - p) * prog(t, m.de + 0.45, 0.3) }} />
            {p > 0.001 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 26,
                  background: focado > 0.5 ? cor.violetaFundo : cor.janela,
                  outline: `${mistura(2, 4, focado)}px solid ${focado > 0.5 ? cor.violeta : cor.linhaForte}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 28px",
                  opacity: p,
                  scale: String(mistura(0.94, 1, p)),
                }}
              >
                <TextoFalado enc={encOp[i]} tempos={tOp} t={t} cor={focado > 0.5 ? cor.violeta : cor.tinta} alinhar="center" alturaLinha={1.1} />
              </div>
            ) : null}
          </div>
        );
      })}
    </Cartao>
  );
};
