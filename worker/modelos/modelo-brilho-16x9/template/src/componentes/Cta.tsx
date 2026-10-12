// Fechamento: cartão que sobe de baixo com o ícone da ação (salvar, seguir…), a frase dita
// palavra por palavra e a assinatura.
import { limitar, mistura, Palavras, prog, saindo, temposDoTexto, Traco, vaiVem } from "../anim";
import type { Cta as TCta, Palavra, Plano } from "../plano";
import { larguraLinha, larguraTexto as medirLargura, trechoNoTexto } from "../medida";
import { baseDoCartao, cor, fonte, quebrar, rotulo } from "../tema";
import { Icone } from "./Icones";

export const Cta: React.FC<{ m: TCta; t: number; fim: number; palavras: Palavra[]; marca: Plano["marca"]; limiteTopo?: number }> = ({
  m,
  t,
  fim,
  palavras,
  marca,
  limiteTopo = 0,
}) => {
  const inicio = Math.max(0, m.de);
  const entra = prog(t, inicio + 0.05, 0.6);
  const sai = saindo(t, fim, 0.35);
  if (entra <= 0 || sai >= 1) return null;
  const pad = 44;
  const w = 992;
  const larguraTexto = w - 2 * pad - 150;
  const temMarca = !!marca?.nome;
  // texto longo ou pouco espaço abaixo do queixo: o corpo desce de 82 até 56, em até 3 linhas
  const maximo = baseDoCartao(m) - limiteTopo;
  let tamanho = 82;
  let linhas = quebrar(m.texto, larguraTexto, tamanho);
  const alturaCom = (l: string[], tam: number) => pad + Math.max(130, l.length * tam * 1.12 + (m.detalhe ? 58 : 0)) + (temMarca ? 118 : 0) + pad * 0.7;
  while ((linhas.length > 3 || alturaCom(linhas, tamanho) > maximo) && tamanho > 56) {
    tamanho -= 4;
    linhas = quebrar(m.texto, larguraTexto, tamanho);
  }
  const fala = Math.max(inicio, m.em ?? inicio);
  const tempos = temposDoTexto(m.texto, palavras, fala, m.ate + 0.3, fala + 0.2);
  const hTexto = linhas.length * tamanho * 1.12 + (m.detalhe ? 58 : 0);
  const h = pad + Math.max(130, hTexto) + (temMarca ? 118 : 0) + pad * 0.7;
  const trecho = trechoNoTexto(m.texto, m.destaque);
  // a assinatura cabe numa linha: aperta o espaçamento da área e, se precisar, diminui o nome
  const assinatura = (() => {
    const livre = w - 2 * pad - 22;
    const area = (esp: number) => (marca?.area ? medirLargura(marca.area, 30, { peso: 700, caixaAlta: true, espacamento: esp }) : 0);
    let espaco = 0.2;
    let nome = 50;
    const nomeW = (n: number) => larguraLinha(marca?.nome ?? "", n, { peso: 700 });
    while (nomeW(nome) + area(espaco) > livre && espaco > 0.06) espaco -= 0.02;
    while (nomeW(nome) + area(espaco) > livre && nome > 34) nome -= 2;
    return { nome, espaco };
  })();
  const icone = m.icone ?? "salvar";
  const pIcone = prog(t, inicio + 0.08, 0.8, vaiVem);
  const cheio = prog(t, inicio + 0.85, 0.4);
  let k = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: baseDoCartao(m) - h + (1 - entra + sai) * (h + 120),
        width: w,
        height: h,
        borderRadius: 44,
        background: cor.creme,
        boxShadow: "0 18px 50px rgba(30,14,22,0.28)",
        fontFamily: fonte,
        color: cor.tinta,
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: pad, top: pad + 4, width: 116, height: 116, scale: String(mistura(0.9, 1, pIcone)) }}>
        <Icone nome={icone} p={pIcone} tamanho={116} cor={cor.berry} largura={6.5} preenchido={cheio} />
      </div>
      <div style={{ position: "absolute", left: pad + 150, top: pad, width: larguraTexto }}>
        {linhas.map((l, i) => {
          const n = l.split(/\s+/).length;
          const fatia = tempos.slice(k, k + n);
          const marcadas: number[] = [];
          if (trecho) for (let j = 0; j < n; j++) if (k + j >= trecho[0] && k + j <= trecho[1]) marcadas.push(j);
          k += n;
          return (
            <Palavras
              key={i}
              texto={l}
              tempos={fatia}
              t={t}
              marcadas={marcadas.length ? marcadas : undefined}
              faixa={marcadas.length ? { cor: cor.blush, texto: cor.tinta } : undefined}
              style={{ fontSize: tamanho, fontWeight: i === 0 ? 700 : 500, lineHeight: 1.12, height: tamanho * 1.12 }}
            />
          );
        })}
        {m.detalhe ? (
          <div style={{ fontSize: 44, fontWeight: 600, color: cor.tintaSuave, marginTop: 10, opacity: prog(t, inicio + 0.9, 0.5) }}>{m.detalhe}</div>
        ) : null}
      </div>
      {temMarca ? (
        <>
          <svg width={w - 2 * pad} height={4} style={{ position: "absolute", left: pad, top: h - pad * 0.7 - 104 }}>
            <Traco d={`M2,2 L${w - 2 * pad - 2},2`} p={prog(t, inicio + 0.5, 0.7, vaiVem)} cor={cor.cremeEscuro} largura={2.5} />
          </svg>
          <div
            style={{
              position: "absolute",
              left: pad,
              right: pad,
              top: h - pad * 0.7 - 76,
              display: "flex",
              alignItems: "baseline",
              gap: 22,
              opacity: limitar(prog(t, inicio + 0.7, 0.5)),
            }}
          >
            <div style={{ fontSize: assinatura.nome, fontWeight: 700, whiteSpace: "nowrap" }}>{marca.nome}</div>
            {marca.area ? <div style={{ ...rotulo, fontSize: 30, letterSpacing: `${assinatura.espaco}em`, color: cor.berry, whiteSpace: "nowrap" }}>{marca.area}</div> : null}
          </div>
        </>
      ) : null}
    </div>
  );
};
