// Paleta de amostras: 2 a 4 cores com nome, cada uma "passada" quando é dita.
// No layout "lado" ocupa o painel; em tela cheia vira um cartão com godês lado a lado.
import { Palavras, prog, saindo, temposDoTexto } from "../anim";
import type { Lado, Palavra, Amostras as TAmostras } from "../plano";
import type { Regiao } from "../layout";
import { baseDoCartao, caber, cor, corDoProduto, fonte, rotulo, tom } from "../tema";
import { Gode, Passada } from "./Amostra";

export const PainelAmostras: React.FC<{ m: TAmostras; t: number; fim: number; palavras: Palavra[]; regiao: Regiao; regiaoFinal: Regiao; lado: Lado }> = ({
  m,
  t,
  fim,
  palavras,
  regiao,
  regiaoFinal,
  lado,
}) => {
  const direito = lado === "esquerda";
  const desloc = direito ? regiao.x - regiaoFinal.x : regiao.x + regiao.w - (regiaoFinal.x + regiaoFinal.w);
  const some = saindo(t, fim + 0.75, 0.15);
  if (some >= 1) return null;
  const pad = 50;
  const costura = 46;
  const interna = regiaoFinal.w - pad - costura;
  const x0 = direito ? regiaoFinal.x + costura : regiaoFinal.x + pad;
  const inicio = Math.max(0, m.de);
  const titulo = m.titulo ?? "";
  const tempos = temposDoTexto(titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.1);
  const n = Math.max(1, m.itens.length);
  const passo = Math.min(300, (1440 - 380) / n);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, translate: `${desloc}px 0`, opacity: 1 - some, fontFamily: fonte, color: cor.tinta }}>
      <div style={{ position: "absolute", left: x0, top: 110, width: interna, textAlign: direito ? "left" : "right" }}>
        {m.rotulo ? <div style={{ ...rotulo, color: cor.berry, opacity: prog(t, inicio + 0.05, 0.4) }}>{m.rotulo}</div> : null}
        {titulo ? (
          <Palavras
            texto={titulo}
            tempos={tempos}
            t={t}
            style={{
              marginTop: 18,
              justifyContent: direito ? "flex-start" : "flex-end",
              flexWrap: "wrap",
              fontSize: caber(titulo, interna * 1.6, 72),
              fontWeight: 600,
              lineHeight: 1.1,
            }}
          />
        ) : null}
      </div>
      {m.itens.map((it, i) => {
        const y = 380 + i * passo;
        if (t < inicio + 0.3) return null;
        return (
          <div key={i} style={{ position: "absolute", left: x0, top: y, width: interna }}>
            <Passada cor={corDoProduto(it.cor, tom(i))} t={t} em={it.em} largura={interna} altura={Math.min(120, passo * 0.45)} id={`amostra-${m.de}-${i}`} espelhar={!direito} rascunho={inicio + 0.35 + i * 0.12} />
            <div
              style={{
                marginTop: 14,
                fontSize: caber(it.nome, interna, 52),
                fontWeight: 600,
                textAlign: direito ? "left" : "right",
                opacity: prog(t, it.em + 0.2, 0.4),
              }}
            >
              {it.nome}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const CartaoAmostras: React.FC<{ m: TAmostras; t: number; fim: number; palavras: Palavra[] }> = ({ m, t, fim, palavras }) => {
  const inicio = Math.max(0, m.de);
  const entra = prog(t, inicio + 0.05, 0.6);
  const sai = saindo(t, fim, 0.35);
  if (entra <= 0 || sai >= 1) return null;
  const h = 420;
  const titulo = m.titulo ?? "";
  const tempos = temposDoTexto(titulo, palavras, inicio, m.itens[0]?.em ?? m.ate, inicio + 0.1);
  const n = Math.max(1, m.itens.length);
  const larguraItem = (992 - 80) / n;
  const god = Math.min(170, larguraItem - 30);
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: baseDoCartao(m) - h + (1 - entra + sai) * (h + 120),
        width: 992,
        height: h,
        borderRadius: 44,
        background: cor.creme,
        boxShadow: "0 18px 50px rgba(30,14,22,0.28)",
        fontFamily: fonte,
        color: cor.tinta,
      }}
    >
      {titulo ? (
        <Palavras texto={titulo} tempos={tempos} t={t} style={{ position: "absolute", left: 40, top: 30, fontSize: caber(titulo, 900, 56), fontWeight: 600, lineHeight: 1.1 }} />
      ) : null}
      {m.itens.map((it, i) => (
        <div key={i} style={{ position: "absolute", left: 40 + i * larguraItem, top: 120, width: larguraItem, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Gode cor={corDoProduto(it.cor, tom(i))} t={t} em={it.em} tamanho={god} id={`gode-a-${m.de}-${i}`} />
          <div style={{ marginTop: 16, fontSize: caber(it.nome, larguraItem - 10, 44), fontWeight: 600, opacity: prog(t, it.em + 0.2, 0.4) }}>{it.nome}</div>
        </div>
      ))}
    </div>
  );
};
