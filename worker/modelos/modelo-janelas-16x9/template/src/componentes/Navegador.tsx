// Navegador genérico (sem marca) com abas. O mouse fecha a aba ativa sem querer; no atalho ela
// volta deslizando, a página recarrega e um aviso do sistema diz o que aconteceu, palavra por palavra.
import { janelaAberta, limitar, mistura, Palavras, prog, temposDoTexto } from "../anim";
import { abasGeom, navegadorGeom, posDock } from "../geometria";
import { corpoQueCabe, encaixar } from "../medida";
import { TextoFalado } from "../texto";
import type { Aba, Navegador as TipoNavegador, Palavra } from "../plano";
import { cor, mono, sans, sombraLeve } from "../tema";
import { Icone, type NomeIcone } from "./Icones";
import { Janela } from "./Janela";

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const Barra: React.FC<{ w: number; h?: number; c?: string }> = ({ w, h = 22, c = cor.esbocoClaro }) => (
  <div style={{ width: w, height: h, borderRadius: h / 2, background: c }} />
);

// Conteúdo de exemplo de cada página (genérico: o título da aba e blocos de texto/forma)
const Pagina: React.FC<{ aba: Aba; carregado: number; largura: number; palavras: Palavra[]; t: number; ate: number }> = ({ aba, carregado, largura, palavras, t, ate }) => {
  const icone: NomeIcone = aba.icone ?? "globo";
  if (aba.texto) {
    // página com a frase dita: o título da aba grande e a frase que se monta na fala
    const titulo = corpoQueCabe(aba.titulo, largura - 80, 56, 40);
    const enc = encaixar(aba.texto, { largura: largura - 80, max: 52, min: 38, linhas: 3, fonte: { peso: 700 } });
    const inicio = (aba.em ?? 0) + 0.25;
    const tempos = temposDoTexto(aba.texto, palavras, (aba.em ?? 0) - 0.3, ate, inicio);
    return (
      <div style={{ position: "absolute", inset: 0, padding: "22px 40px", opacity: mistura(0.35, 1, carregado) }}>
        <div style={{ fontFamily: sans, fontWeight: 800, fontSize: titulo, color: cor.tinta, lineHeight: 1.1, whiteSpace: "nowrap" }}>{aba.titulo}</div>
        <div style={{ marginTop: 18 }}>
          <TextoFalado enc={enc} tempos={tempos} t={t} cor={cor.tintaSuave} esboco={cor.esbocoClaro} fonte={{ peso: 700 }} alturaLinha={1.14} />
        </div>
      </div>
    );
  }
  const corpo = (() => {
    if (icone === "planilha")
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 22 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ height: 44, borderRadius: 10, background: i % 4 === 0 ? cor.violetaFundo : cor.painel, outline: `1.5px solid ${cor.linha}` }} />
          ))}
        </div>
      );
    if (icone === "email")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {[440, 360].map((w, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: cor.esbocoClaro }} />
              <Barra w={w} />
            </div>
          ))}
        </div>
      );
    return (
      <div style={{ display: "flex", gap: 22, marginTop: 24 }}>
        <div style={{ width: 230, height: 110, borderRadius: 18, background: cor.violetaFundo, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icone nome={icone} tamanho={58} cor={cor.violeta} peso={3.4} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
          <Barra w={460} />
          <Barra w={380} />
          <Barra w={300} />
        </div>
      </div>
    );
  })();
  return (
    <div style={{ position: "absolute", inset: 0, padding: "22px 40px", opacity: mistura(0.35, 1, carregado) }}>
      <div style={{ fontFamily: sans, fontWeight: 800, fontSize: 56, color: cor.tinta, lineHeight: 1.1 }}>{aba.titulo}</div>
      {corpo}
    </div>
  );
};

export const Navegador: React.FC<{ m: TipoNavegador; palavras: Palavra[]; t: number; fim: number }> = ({ m, palavras, t, fim }) => {
  const N = navegadorGeom(m);
  const n = Math.min(4, m.abas.length);
  const ativa = Math.min(m.ativa ?? n - 1, n - 1);
  const vizinha = ativa > 0 ? ativa - 1 : Math.min(n - 1, ativa + 1);
  const geo = abasGeom(n, N);
  // abas que abrem na fala (`em`): crescem a partir do "+" e viram a aba da vez
  // (a primeira já está aberta quando o navegador abre)
  const surge = m.abas.slice(0, n).map((a, i) => (a.em === undefined || i === 0 ? 1 : prog(t, a.em - 0.12, 0.3)));
  const comEm = m.abas.some((a) => a.em !== undefined);
  const pFecha = m.fechaEm !== undefined ? prog(t, m.fechaEm + 0.02, 0.26) : 0;
  const pVolta = m.reabreEm !== undefined ? prog(t, m.reabreEm - 0.04, 0.34) : 0;
  // 1 = a aba ativa está lá; 0 = fechada
  const presente = limitar(1 - pFecha + pVolta);
  const voltou = pVolta > 0.01;

  // abre depois que a janela da pessoa saiu do caminho; fecha antes da próxima janela abrir
  const aberta = janelaAberta(t, m.de, fim);
  const origem = posDock(0);
  const carregando = m.reabreEm !== undefined ? prog(t, m.reabreEm, 0.55) : 1;

  // abas: a ativa encolhe ao fechar e cresce ao voltar; as outras se ajustam
  let cursorX = geo[0].x;
  const abas = m.abas.slice(0, n).map((aba, i) => {
    const fator = (i === ativa ? presente : 1) * surge[i];
    const w = geo[i].w * fator;
    const x = cursorX;
    cursorX += w;
    return { aba, i, x, w, fator };
  });
  const daVez = comEm ? m.abas.slice(0, n).reduce((k, a, i) => (surge[i] > 0.5 && (a.em ?? -1) >= (m.abas[k]?.em ?? -1) ? i : k), 0) : -1;
  const mostrando = comEm && m.fechaEm === undefined ? daVez : presente > 0.5 ? ativa : vizinha;

  const inicioAviso = m.aviso?.em ?? m.reabreEm ?? m.de + 0.6;
  const tAviso = temposDoTexto(m.aviso?.texto ?? "", palavras, m.aviso?.em !== undefined ? m.aviso.em - 0.3 : m.de, m.ate + 0.3, inicioAviso);
  const pAviso = m.aviso ? prog(t, inicioAviso + (m.aviso.em !== undefined ? -0.1 : 0.12), 0.34) : 0;
  const destaque = new Set((m.aviso?.destaque ?? "").toLowerCase().split(/\s+/).filter(Boolean));

  const barraAbas = (
    <div style={{ position: "absolute", left: 0, top: 0, width: N.w, height: N.abasAltura }}>
      {abas.map(({ aba, i, x, w, fator }) => {
        if (w < 2) return null;
        const ehAtiva = i === mostrando;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - N.x,
              top: 12,
              width: w,
              height: N.abasAltura - 12,
              borderRadius: "18px 18px 0 0",
              background: ehAtiva ? cor.janela : "transparent",
              overflow: "hidden",
              opacity: i === ativa ? limitar(fator * 1.5) : 1,
            }}
          >
            <div style={{ position: "absolute", left: 16, top: 0, height: N.abasAltura - 12, display: "flex", alignItems: "center", gap: 10, width: geo[i].w - 62 }}>
              <Icone nome={i === ativa && voltou && pVolta < 1.5 ? "reabrir" : (aba.icone ?? "globo")} tamanho={32} cor={ehAtiva ? cor.violeta : cor.tintaSuave} peso={4} />
              <div
                style={{
                  fontFamily: sans,
                  fontWeight: ehAtiva ? 800 : 700,
                  fontSize: 36,
                  color: ehAtiva ? cor.tinta : cor.tintaSuave,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                {aba.titulo}
              </div>
            </div>
            <div style={{ position: "absolute", left: geo[i].w - 53, top: (N.abasAltura - 12) / 2 - 19 }}>
              <Icone nome="fechar" tamanho={38} cor={cor.tintaSuave} peso={4} />
            </div>
            {/* fio violeta: a aba que voltou */}
            {i === ativa && voltou ? (
              <div style={{ position: "absolute", left: 14, right: 14, top: 0, height: 5, borderRadius: 3, background: cor.violeta, opacity: pVolta }} />
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: cursorX - N.x + 14, top: 12 + (N.abasAltura - 12) / 2 - 19 }}>
        <Icone nome="mais" tamanho={38} cor={cor.tintaSuave} peso={4} />
      </div>
    </div>
  );

  const abaVisivel = m.abas[mostrando];

  return (
    <Janela x={N.x} y={N.y} w={N.w} h={N.h} aberta={aberta} origem={origem} barra={barraAbas} alturaBarra={N.abasAltura}>
      {/* endereço */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: N.enderecoAltura,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 26px",
          borderBottom: `1.5px solid ${cor.linha}`,
        }}
      >
        <Icone nome="voltar" tamanho={38} cor={cor.tintaSuave} peso={4} />
        <Icone nome="avancar" tamanho={38} cor={cor.esboco} peso={4} />
        <Icone nome="recarregar" tamanho={38} cor={cor.tintaSuave} peso={3.8} />
        <div
          style={{
            flex: 1,
            height: 58,
            borderRadius: 29,
            background: cor.painel,
            outline: `1.5px solid ${cor.linha}`,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            fontFamily: mono,
            fontWeight: 600,
            fontSize: 34,
            color: cor.tintaSuave,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {slug(abaVisivel.titulo)}.exemplo
        </div>
        {/* carregando: fio violeta embaixo da barra de endereço */}
        {carregando > 0 && carregando < 1 ? (
          <div style={{ position: "absolute", left: 0, bottom: -3, height: 5, width: `${carregando * 100}%`, background: cor.violeta, borderRadius: 3 }} />
        ) : null}
      </div>

      {/* página */}
      <div style={{ position: "absolute", left: 0, right: 0, top: N.enderecoAltura, bottom: 0, overflow: "hidden" }}>
        <Pagina
          key={mostrando}
          aba={abaVisivel}
          carregado={mostrando === ativa && voltou ? carregando : comEm && abaVisivel.em !== undefined ? prog(t, abaVisivel.em, 0.45) : 1}
          largura={N.w}
          palavras={palavras}
          t={t}
          ate={m.ate}
        />

        {m.aviso ? (
          <div
            style={{
              position: "absolute",
              left: 22,
              right: 22,
              bottom: 18,
              borderRadius: 26,
              background: cor.janela,
              boxShadow: sombraLeve,
              outline: `2.5px solid ${cor.violeta}`,
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "18px 24px",
              opacity: pAviso,
              translate: `0 ${(1 - pAviso) * 40}px`,
            }}
          >
            <div style={{ width: 80, height: 80, flexShrink: 0, borderRadius: 22, background: cor.violeta, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icone nome="reabrir" tamanho={50} cor="#FFFFFF" peso={4.2} />
            </div>
            <Palavras
              texto={m.aviso.texto}
              tempos={tAviso}
              t={t}
              corDe={(i) => (destaque.has((m.aviso?.texto.split(/\s+/)[i] ?? "").toLowerCase()) ? cor.violeta : undefined)}
              style={{ fontFamily: sans, fontWeight: 800, fontSize: 48, lineHeight: 1.12, color: cor.tinta, flex: 1 }}
            />
          </div>
        ) : null}
      </div>
    </Janela>
  );
};
