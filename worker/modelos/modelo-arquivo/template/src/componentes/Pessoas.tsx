import { Datilo, DatiloFalado, preciso, prog, saindo, temposDoTexto } from "../anim";
import { encaixar } from "../medida";
import { medirCabeca } from "./Cabeca";
import { Deslizar } from "./Papel";
import type { Regiao } from "../layout";
import type { Palavra, Pessoas as TPessoas } from "../plano";
import { caber, cor, mono, rotulo, sans, sombraPapel } from "../tema";

const Tacha: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <div
    style={{
      position: "absolute",
      left: x - 12,
      top: y - 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      background: cor.vermelho,
      boxShadow: "0 3px 5px rgba(21,21,21,0.3)",
      scale: String(0.4 + 0.6 * p),
      opacity: p,
    }}
  />
);

// Fichas de pessoas (quem fez o quê): cada ficha entra quando a pessoa é citada, o nome e os dados
// são datilografados quando ditos, e um fio vermelho liga uma ficha à outra.
export const Pessoas: React.FC<{ m: TPessoas; t: number; fim: number; regiao: Regiao; palavras: Palavra[] }> = ({ m, t, fim, regiao, palavras }) => {
  const sai = saindo(t, fim, 0.3);
  const pessoas = m.pessoas.slice(0, 3);
  const n = pessoas.length;
  const largura0 = regiao.w - 30;
  const tamTitulo = m.titulo ? caber(m.titulo, largura0 * 1.8, 72, 0.62, 48) : 0;
  const linhasTitulo = m.titulo ? Math.max(1, Math.ceil((m.titulo.length * 0.66 * tamTitulo) / largura0)) : 0;
  const topoCartoes = regiao.y + (m.titulo ? 24 + 42 + linhasTitulo * tamTitulo * 1.04 + 34 : 20);
  const espaco = regiao.y + regiao.h - topoCartoes;
  const vao = n > 1 ? 110 : 0;
  const alturaCartao = Math.min(470, (espaco - vao * (n - 1)) / n);
  const largura = largura0;
  const tempos = m.titulo ? temposDoTexto(m.titulo, palavras, m.de, m.ate) : [];

  const posicao = (i: number) => ({
    x: regiao.x + (i % 2 === 0 ? 0 : 30),
    y: topoCartoes + i * (alturaCartao + vao),
    rot: i % 2 === 0 ? -0.8 : 0.7,
  });
  // tachas: embaixo do primeiro cartão e em cima do segundo; o fio desce pelo vão
  const tachaA = { x: posicao(0).x + 64, y: posicao(0).y + alturaCartao - 18 };
  const tachaB = { x: posicao(1).x + largura * 0.56, y: posicao(1).y + 16 };
  const fio = m.ligacao && n > 1 ? prog(t, m.ligacao.em, 0.85, preciso) : 0;
  const caminho = `M ${tachaA.x} ${tachaA.y} Q ${(tachaA.x + tachaB.x) / 2 - 60} ${(tachaA.y + tachaB.y) / 2 + 30} ${tachaB.x} ${tachaB.y}`;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - sai, translate: `${-sai * 120}px 0` }}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: regiao.x + 4, top: regiao.y + 24, width: largura }}>
          <div style={{ ...rotulo, color: cor.vermelho, marginBottom: 14, opacity: prog(t, m.de, 0.3) }}>{m.rotulo ?? "Dossiê"}</div>
          <DatiloFalado
            texto={m.titulo.toUpperCase()}
            tempos={tempos}
            t={t}
            style={{ fontFamily: sans, fontWeight: 800, fontSize: tamTitulo, lineHeight: 1.02, color: cor.tinta }}
          />
        </div>
      ) : null}

      {pessoas.map((p, i) => {
        const pos = posicao(i);
        const entra = prog(t, p.em, 0.55);
        if (t < p.em - 0.05) return null;
        const nomeEm = p.nomeEm ?? p.em + 0.3;
        const detalheEm = p.detalheEm ?? nomeEm + 0.6;
        const tamNome = caber(p.nome.split(" ").reduce((a, b) => (b.length > a.length ? b : a), ""), largura - 56, 66, 0.62, 44);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: largura,
              height: alturaCartao,
              background: cor.cartao,
              boxShadow: sombraPapel,
              rotate: `${pos.rot}deg`,
              translate: `${(1 - entra) * -620}px 0`,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ ...rotulo, fontSize: 30, color: cor.vermelho, border: `3px solid ${cor.vermelho}`, padding: "9px 14px 7px", whiteSpace: "nowrap" }}>{p.papel}</div>
              <div style={{ ...rotulo, color: cor.grafite, whiteSpace: "nowrap" }}>Nº {String(i + 1).padStart(2, "0")}</div>
            </div>
            <div style={{ ...rotulo, color: cor.grafite, marginTop: 6 }}>{m.rotuloNome ?? "Nome"}</div>
            <div style={{ fontFamily: sans, fontWeight: 800, fontSize: tamNome, lineHeight: 1.02, color: cor.tinta, minHeight: tamNome * 2.04 }}>
              <Datilo texto={p.nome} em={nomeEm} t={t} semente={70 + i} />
            </div>
            {p.detalhe ? (
              // os dados vêm em linhas (ofício / origem), cada uma datilografada em seguida
              <div style={{ display: "flex", flexDirection: "column", gap: 4, borderBottom: `2px solid ${cor.linha}`, paddingBottom: 8 }}>
                {p.detalhe.split(/\s+·\s+/).map((linha, k) => (
                  <div key={k} style={{ fontFamily: mono, fontWeight: 700, fontSize: caber(linha, largura - 56, 46, 0.66, 44), lineHeight: 1.1, color: cor.tinta, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    <Datilo texto={linha} em={detalheEm + k * 0.35} t={t} semente={80 + i * 5 + k} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* fio vermelho entre as fichas (por cima delas) */}
      {m.ligacao && n > 1 ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={caminho} fill="none" stroke={cor.vermelho} strokeWidth={4} pathLength={1} strokeDasharray={`${fio} 1`} opacity={fio > 0.002 ? 1 : 0} />
          </svg>
          <Tacha x={tachaA.x} y={tachaA.y} p={prog(t, m.ligacao.em - 0.15, 0.2)} />
          <Tacha x={tachaB.x} y={tachaB.y} p={prog(t, Math.max(m.ligacao.em + 0.7, pessoas[1].em + 0.35), 0.2)} />
        </>
      ) : null}
    </div>
  );
};

// As mesmas fichas em folha larga (layouts "base" e "topo"): lado a lado, presas pelo alto com
// tachinhas, e o fio vermelho em arco por cima delas, de uma à outra, quando a ligação é dita.
export const PessoasLarga: React.FC<{ m: TPessoas; t: number; fim: number; regiao: Regiao; palavras: Palavra[] }> = ({ m, t, fim, regiao, palavras }) => {
  const pessoas = m.pessoas.slice(0, 3);
  const n = Math.max(1, pessoas.length);
  const cab = medirCabeca(m.titulo, regiao.w - 8, 84);
  const rotuloTopo = m.titulo ? 44 : 0;
  const topoCartoes = regiao.y + rotuloTopo + cab.altura + 50;
  const VAO = 56;
  // uma ficha só não ocupa a folha toda: fica com cara de ficha (~3/4 da largura)
  const largura = n === 1 ? regiao.w * 0.74 : (regiao.w - VAO * (n - 1)) / n;
  // a ficha tem a altura do que vai nela (papel, rótulo, nome, dados), até o espaço que sobra
  const conteudo = Math.max(
    ...pessoas.map((p) => {
      const nome = encaixar(p.nome, { largura: (n === 1 ? regiao.w * 0.74 : (regiao.w - 56 * (n - 1)) / n) - 52, max: n === 1 ? 92 : 62, min: 40, linhas: 3, fonte: { peso: 800 } });
      return 30 + 52 + 12 + 38 + 12 + nome.linhas.length * nome.tamanho * 1.04 + (p.detalhe ? 16 + p.detalhe.split(/\s+·\s+/).length * 46 : 0) + 40;
    }),
  );
  const espacoCartoes = regiao.y + regiao.h - topoCartoes - 10;
  const altura = Math.min(conteudo, espacoCartoes);
  // as fichas ficam no meio do espaço entre o título e o pé da região
  const topo = topoCartoes + Math.max(0, (espacoCartoes - altura) * 0.45);
  const tempos = m.titulo ? temposDoTexto(m.titulo.toUpperCase(), palavras, m.de, m.ate) : [];
  const xDe = (i: number) => regiao.x + i * (largura + VAO);
  const PAD = 26;
  const interno = largura - 2 * PAD;
  const fio = m.ligacao && n > 1 ? prog(t, m.ligacao.em, 0.85, preciso) : 0;
  const tacha = (i: number) => ({ x: xDe(i) + largura / 2, y: topo + 4 });
  const arco = n > 1 ? `M ${tacha(0).x} ${tacha(0).y} Q ${(tacha(0).x + tacha(1).x) / 2} ${tacha(0).y - 70} ${tacha(1).x} ${tacha(1).y}` : "";
  return (
    <Deslizar t={t} de={m.de} fim={fim}>
      {m.titulo ? (
        <div style={{ position: "absolute", left: regiao.x + 4, top: regiao.y + 4, width: regiao.w }}>
          <div style={{ ...rotulo, fontSize: 30, color: cor.vermelho, marginBottom: 14, opacity: prog(t, m.de, 0.3) }}>{m.rotulo ?? "Dossiê"}</div>
          <DatiloFalado
            texto={m.titulo.toUpperCase()}
            linhas={cab.fit?.linhas}
            tempos={tempos}
            t={t}
            style={{ fontFamily: sans, fontWeight: 800, fontSize: cab.fit?.tamanho ?? 64, lineHeight: 1.04, color: cor.tinta }}
          />
        </div>
      ) : null}
      {pessoas.map((p, i) => {
        const entra = prog(t, p.em, 0.55);
        const x = xDe(i);
        const nomeEm = p.nomeEm ?? p.em + 0.3;
        const detalheEm = p.detalheEm ?? nomeEm + 0.6;
        const fitNome = encaixar(p.nome, { largura: interno, max: n === 1 ? 92 : 62, min: 40, linhas: 3, fonte: { peso: 800 } });
        // ficha estreita (3 lado a lado): sem o "Nº", o papel usa a largura toda
        const estreita = interno < 330;
        const papel = encaixar(p.papel.toUpperCase(), { largura: (estreita ? interno : interno - 120) - 30, max: 30, min: 26, linhas: 1, fonte: { mono: true, espacamento: 0.14 } });
        return (
          <div key={i}>
            {entra < 1 ? (
              <div style={{ position: "absolute", left: x, top: topo, width: largura, height: altura, boxSizing: "border-box", border: `3px dashed ${cor.grafite}`, opacity: 0.3 * (1 - entra) }} />
            ) : null}
            {t >= p.em - 0.05 ? (
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: topo,
                  width: largura,
                  height: altura,
                  background: cor.cartao,
                  boxShadow: sombraPapel,
                  rotate: `${i % 2 === 0 ? -0.8 : 0.7}deg`,
                  translate: `0 ${(1 - entra) * 80}px`,
                  padding: `30px ${PAD}px 24px`,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ ...rotulo, fontSize: papel.tamanho, color: cor.vermelho, border: `3px solid ${cor.vermelho}`, padding: "9px 12px 7px", whiteSpace: "nowrap", overflow: "hidden" }}>{papel.linhas[0]}</div>
                  {estreita ? null : <div style={{ ...rotulo, fontSize: 30, color: cor.grafite, whiteSpace: "nowrap" }}>Nº {String(i + 1).padStart(2, "0")}</div>}
                </div>
                <div style={{ ...rotulo, fontSize: 30, color: cor.grafite, marginTop: 8 }}>{m.rotuloNome ?? "Nome"}</div>
                <div style={{ fontFamily: sans, fontWeight: 800, fontSize: fitNome.tamanho, lineHeight: 1.04, color: cor.tinta }}>
                  {fitNome.linhas.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      <Datilo texto={l} em={nomeEm + k * 0.25} t={t} semente={70 + i * 4 + k} />
                    </div>
                  ))}
                </div>
                {p.detalhe ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, borderTop: `2px solid ${cor.linha}`, paddingTop: 10, marginTop: 4 }}>
                    {p.detalhe.split(/\s+·\s+/).map((linha, k) => {
                      const fit = encaixar(linha.toUpperCase(), { largura: interno, max: 40, min: 30, linhas: 2, fonte: { mono: true, espacamento: 0.03 } });
                      return (
                        <div key={k} style={{ fontFamily: mono, fontWeight: 700, fontSize: fit.tamanho, lineHeight: 1.12, color: cor.tinta, letterSpacing: "0.03em" }}>
                          {fit.linhas.map((l, j) => (
                            <div key={j} style={{ whiteSpace: "nowrap" }}>
                              <Datilo texto={l} em={detalheEm + k * 0.35 + j * 0.2} t={t} semente={80 + i * 5 + k * 2 + j} />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
      {m.ligacao && n > 1 ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d={arco} fill="none" stroke={cor.vermelho} strokeWidth={4.5} pathLength={1} strokeDasharray={`${fio} 1`} opacity={fio > 0.002 ? 1 : 0} />
          </svg>
          <Tacha x={tacha(0).x} y={tacha(0).y} p={prog(t, m.ligacao.em - 0.15, 0.2)} />
          <Tacha x={tacha(1).x} y={tacha(1).y} p={prog(t, Math.max(m.ligacao.em + 0.7, pessoas[1].em + 0.35), 0.2)} />
        </>
      ) : null}
    </Deslizar>
  );
};
