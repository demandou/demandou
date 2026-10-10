import { mix, mixCor, PalavraWire, prog, viagem } from "../anim";
import { estadoDaPagina, type Linha, PG } from "../cena";
import { layoutLimpo } from "../layoutPagina";
import type { Pagina, TipoErro } from "../plano";
import { ALTURA_VISIVEL, CELULAR, cor, ESCALA, mono, sans, serif, TELA } from "../tema";
import { Check } from "./Icones";
import { Ilustracao, tom } from "./Ilustracoes";

// O celular do canvas: a página fictícia em wireframe cinza, revisada com etiquetas vermelhas,
// que se reconstrói limpa e com a cor da marca. A página é desenhada em unidades de 390 de largura
// (como um celular de verdade) e ampliada; etiquetas, medidas e avisos ficam por cima, em px reais.

const s = ESCALA;
const VIS = ALTURA_VISIVEL;

// larguras das linhas da parede de texto (em fração de 350), com dois parágrafos
const PAREDE = [1, 0.96, 0.99, 0.93, 0.62, 1, 0.95, 0.98, 0.7, 0.97, 0.94, 0.8];
const yParede = (i: number) => PG.parede.y + i * PG.parede.passo + (i >= 5 ? 9 : 0) + (i >= 9 ? 9 : 0);

type Rect = { x: number; y: number; w: number; h: number };

export const Celular: React.FC<{ t: number; linha: Linha; pagina: Required<Pagina>; presenca: number }> = ({ t, linha, pagina, presenca }) => {
  const e = estadoDaPagina(t, linha, pagina);
  const L = layoutLimpo(pagina);
  const rol = e.rolagem;
  const marca = pagina.cor;
  const tinta = pagina.tinta;

  // posição atual de cada bloco (unidades da página)
  const imagemY = mix(PG.imagemAntes.y, L.imagem.y, e.reflow);
  const imagemH = mix(PG.imagemAntes.h, L.imagem.h, e.reflow);
  const botaoY = e.botao <= 0 ? PG.botaoAntes.y : mix(VIS + 8, L.botao.y, e.botao);
  const botaoH = mix(PG.botaoAntes.h, L.botao.h, e.botao);
  const abaixo = mix(0, L.apoio.y + 40 - PG.resto, e.reflow);

  const textoCor = mixCor(cor.textoMedio, tinta, e.cor);
  const icone = mixCor(cor.traco, tinta, e.cor);
  const marcaP = Math.max(e.menu, e.cor);
  const pressao = 1 - 0.045 * Math.sin(Math.PI * Math.min(1, e.toque * 2.2));

  // etiquetas: área de cada tipo de erro (unidades da página)
  const area = (tipo: TipoErro): Rect & { direita?: boolean } => {
    // a etiqueta fica no meio da borda de cima, num respiro acima do conteúdo (não cobre o texto)
    if (tipo === "texto") return { x: 14, y: PG.parede.y - 26, w: 362, h: yParede(PAREDE.length - 1) + 9 + 10 - (PG.parede.y - 26) };
    if (tipo === "contraste") {
      // depois que a promessa entra, o contorno abraça o título novo (que é mais alto)
      const h = mix(PG.tituloAntes.h, L.promessa.h, e.reflow);
      return { x: 14, y: PG.tituloAntes.y - 26, w: 362, h: h + 34 };
    }
    if (tipo === "botao") return { x: 14, y: botaoY - 26, w: 362, h: botaoH + 34 };
    if (tipo === "imagem") return { x: 14, y: imagemY - 26, w: 362, h: imagemH + 34 };
    return { x: 12, y: PG.nav.y, w: 366, h: PG.nav.h, direita: true };
  };
  const naTela = (r: Rect) => ({ left: r.x * s, top: (r.y - rol) * s, width: r.w * s, height: r.h * s });

  const entrada = prog(presenca, 0.15, 0.85);
  const centroBotao = { x: TELA.w / 2, y: (L.botao.y + L.botao.h / 2 - rol) * s };

  return (
    <div
      style={{
        position: "absolute",
        left: CELULAR.x,
        top: CELULAR.y,
        width: CELULAR.w,
        height: CELULAR.h,
        opacity: entrada,
        translate: `${(1 - entrada) * -40}px ${(1 - entrada) * 50}px`,
      }}
    >
      {/* botões laterais do aparelho */}
      <div style={{ position: "absolute", left: -5, top: 236, width: 6, height: 70, borderRadius: 3, background: "#2B2D33" }} />
      <div style={{ position: "absolute", left: -5, top: 326, width: 6, height: 110, borderRadius: 3, background: "#2B2D33" }} />
      <div style={{ position: "absolute", right: -5, top: 300, width: 6, height: 150, borderRadius: 3, background: "#2B2D33" }} />
      {/* corpo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: CELULAR.raio,
          background: cor.moldura,
          boxShadow: `0 0 0 2px ${cor.molduraBorda}, 0 40px 80px rgba(0,0,0,0.45)`,
        }}
      />
      {/* tela */}
      <div
        style={{
          position: "absolute",
          left: CELULAR.borda,
          top: CELULAR.borda,
          width: TELA.w,
          height: TELA.h,
          borderRadius: TELA.raio,
          overflow: "hidden",
          background: cor.tela,
        }}
      >
        {/* a cor da marca se espalha a partir do botão */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: marca,
            clipPath: `circle(${e.cor * 1500}px at ${centroBotao.x}px ${centroBotao.y}px)`,
          }}
        />

        {/* a página (rola) */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 390,
            height: PG.altura,
            transform: `scale(${s}) translateY(${-rol}px)`,
            transformOrigin: "0 0",
          }}
        >
          {/* barra de navegação */}
          <div style={{ position: "absolute", left: 20, top: 62, width: 84, height: 26, borderRadius: 6, background: cor.bloco, opacity: 1 - marcaP }} />
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 56,
              fontFamily: serif,
              fontFeatureSettings: '"lnum" 1',
              fontSize: 25,
              lineHeight: "36px",
              color: textoCor,
              opacity: marcaP,
              whiteSpace: "nowrap",
            }}
          >
            {pagina.marca}
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 136 + i * 38,
                top: 71,
                width: 28,
                height: 8,
                borderRadius: 4,
                background: cor.linha,
                opacity: 1 - e.menu,
                transform: `scaleX(${1 - e.menu})`,
              }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ position: "absolute", left: 342, top: 64 + i * 9, width: 26, height: 3.5, borderRadius: 2, background: icone }} />
          ))}

          {/* título fraco (antes) */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: PG.tituloAntes.y,
              width: 350,
              fontFamily: sans,
              fontWeight: 500,
              fontSize: 25,
              lineHeight: 1.22,
              color: cor.textoFraco,
              opacity: 1 - prog(e.parede, 0, 0.5),
            }}
          >
            {pagina.tituloAntes}
          </div>

          {/* parede de texto */}
          {PAREDE.map((f, i) => {
            const p = Math.min(1, Math.max(0, (e.parede - (PAREDE.length - 1 - i) * 0.03) / 0.65));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 20,
                  top: yParede(i),
                  width: 350 * f,
                  height: 9,
                  borderRadius: 5,
                  background: cor.linha,
                  transform: `scaleX(${1 - p})`,
                  transformOrigin: "left center",
                  opacity: 1 - p,
                }}
              />
            );
          })}

          {/* imagem: esboço com X → ilustração */}
          <div style={{ position: "absolute", left: 20, top: imagemY, width: 350, height: imagemH }}>
            <svg width={350} height={imagemH} style={{ position: "absolute", inset: 0, opacity: 1 - e.imagem }}>
              <rect x={1.5} y={1.5} width={347} height={imagemH - 3} rx={12} fill="#E4E7EB" stroke={cor.traco} strokeWidth={2.5} />
              <line x1={14} y1={14} x2={336} y2={imagemH - 14} stroke={cor.traco} strokeWidth={2.5} />
              <line x1={336} y1={14} x2={14} y2={imagemH - 14} stroke={cor.traco} strokeWidth={2.5} />
            </svg>
            <div style={{ position: "absolute", inset: 0, opacity: e.imagem, transform: `scale(${0.95 + 0.05 * e.imagem})` }}>
              <Ilustracao tipo={pagina.ilustracao} cor={marca} tinta={tinta} w={350} h={imagemH} />
            </div>
            <Carregando t={t} linha={linha} h={imagemH} />
          </div>

          {/* resto da página em wireframe (abaixo da dobra) */}
          <div style={{ position: "absolute", left: 0, top: PG.resto + abaixo, width: 390, opacity: 1 - e.cor }}>
            <RestoDaPagina />
          </div>

          {/* vaga do botão, a lápis, antes de ele chegar */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: L.botao.y,
              width: 350,
              height: L.botao.h,
              borderRadius: L.botao.h / 2,
              border: `2.5px dashed ${cor.traco}`,
              opacity: e.vaga,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: mono,
              fontWeight: 500,
              fontSize: 30 / s,
              color: cor.textoMedio,
            }}
          >
            botão
          </div>

          {/* botão */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: botaoY,
              width: 350,
              height: botaoH,
              borderRadius: botaoH / 2,
              background: mixCor(cor.bloco, tinta, e.cor),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${pressao})`,
            }}
          >
            <div style={{ position: "absolute", width: 110, height: 10, borderRadius: 5, background: cor.traco, opacity: 1 - prog(e.botao, 0, 0.5) }} />
            <div
              style={{
                fontFamily: sans,
                fontWeight: 700,
                fontSize: 24,
                color: mixCor(cor.textoMedio, marca, e.cor),
                opacity: prog(e.botao, 0.4, 0.6),
                whiteSpace: "nowrap",
              }}
            >
              {pagina.botao}
            </div>
          </div>

          {/* a promessa em uma frase */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: L.promessa.y,
              width: 360,
              fontFamily: serif,
              // algarismos alinhados (o 1 da Young Serif em estilo antigo parece um "ı")
              fontVariantNumeric: "lining-nums",
              fontFeatureSettings: '"lnum" 1',
              fontSize: L.promessa.tamanho,
              lineHeight: `${L.promessa.entrelinha}px`,
              color: textoCor,
              opacity: e.esbocoPromessa,
            }}
          >
            {(() => {
              let k = 0;
              return L.promessa.linhas.map((l, i) => (
                <div key={i} style={{ whiteSpace: "nowrap" }}>
                  {l.split(" ").map((w, j) => {
                    const em = e.promessaEm[k++] ?? Infinity;
                    return <PalavraWire key={j} t={t} em={em} texto={w} barra="#D3D7DD" margem={0.24} />;
                  })}
                </div>
              ));
            })()}
          </div>

          {/* linha de apoio (página limpa) */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: L.apoio.y,
              width: 350,
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 24,
              lineHeight: 1.2,
              color: tinta,
              opacity: prog(e.cor, 0.55, 0.45),
            }}
          >
            {pagina.apoio}
          </div>
          {/* três selos (página limpa) */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 20 + i * 122,
                top: L.apoio.y + 44,
                width: 106,
                height: 74,
                borderRadius: 16,
                background: tom(marca, 0.5),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: prog(e.cor, 0.6 + i * 0.1, 0.35),
                translate: `0 ${(1 - prog(e.cor, 0.6 + i * 0.1, 0.35)) * 14}px`,
              }}
            >
              <Selo i={i} tinta={tinta} />
            </div>
          ))}

          {/* medidas de espaçamento */}
          <Medida x={346} y1={L.promessa.y + L.promessa.h} y2={L.botao.y} valor={L.vao1} p={e.medidas} />
          <Medida x={346} y1={L.botao.y + L.botao.h} y2={L.imagem.y} valor={L.vao2} p={prog(e.medidas, 0.25, 0.75)} />
        </div>

        {/* barra de status (fixa) e câmera */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 390, height: 50, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          <div style={{ position: "absolute", left: 30, top: 19, width: 40, height: 12, borderRadius: 6, background: icone }} />
          <div style={{ position: "absolute", left: 138, top: 11, width: 114, height: 33, borderRadius: 17, background: "#0B0B0C" }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ position: "absolute", left: 290 + i * 6, top: 31 - (i + 1) * 3, width: 4, height: (i + 1) * 3, borderRadius: 1, background: icone }} />
          ))}
          <div style={{ position: "absolute", left: 324, top: 19, width: 30, height: 13, borderRadius: 4, border: `2px solid ${icone}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 327, top: 22, width: 19, height: 7, borderRadius: 2, background: icone }} />
        </div>

        {/* barra de rolagem */}
        <div
          style={{
            position: "absolute",
            right: 8,
            top: 70 + (rol / (PG.altura - VIS)) * (TELA.h - 330),
            width: 6,
            height: 150,
            borderRadius: 3,
            background: "rgba(80,86,96,0.55)",
            opacity: Math.min(1, rol / 30) * (1 - e.cor),
          }}
        />

        {/* contornos e etiquetas de erro */}
        {linha.erros.map((erro) => {
          const r = area(erro.tipo);
          const q = naTela(r);
          const pOut = prog(t, erro.resolvidoEm + 0.15, 0.3);
          const pIn = prog(t, erro.em - 0.02, 0.35);
          if (pIn <= 0 || pOut >= 1) return null;
          return (
            <div
              key={`c-${erro.n}`}
              style={{
                position: "absolute",
                ...q,
                borderRadius: 14,
                border: `3.5px dashed ${cor.vermelho}`,
                background: cor.vermelhoFundo,
                opacity: pIn * (1 - pOut),
                transform: `scale(${1.04 - 0.04 * pIn})`,
              }}
            />
          );
        })}
        {linha.erros.map((erro) => {
          const r = area(erro.tipo);
          const q = naTela(r);
          // no botão escondido, a etiqueta aparece quando a rolagem chega nele
          const pIn = prog(t, erro.em + (erro.tipo === "botao" ? 0.72 : 0.04), 0.34);
          const resolvido = prog(t, erro.resolvidoEm, 0.22);
          const pOut = prog(t, erro.resolvidoEm + 0.5, 0.25);
          if (pIn <= 0 || pOut >= 1) return null;
          const topo = q.top - 27;
          return (
            <div
              key={`e-${erro.n}`}
              style={{
                position: "absolute",
                ...(r.direita ? { right: 16, top: q.top + q.height / 2 - 27 } : { left: Math.max(14, q.left + 4), top: topo }),
                height: 54,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 22px 0 6px",
                borderRadius: 27,
                background: mixCor(cor.vermelho, tinta, resolvido),
                boxShadow: "0 8px 20px rgba(20,10,8,0.22)",
                opacity: pIn * (1 - pOut),
                transform: `scale(${0.72 + 0.28 * pIn})`,
                transformOrigin: r.direita ? "right center" : "left center",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  background: mixCor("#FFFFFF", marca, resolvido),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: mono,
                  fontWeight: 700,
                  fontSize: 30,
                  color: cor.vermelho,
                }}
              >
                {resolvido > 0.5 ? <Check tamanho={26} cor={tinta} espessura={4.5} /> : erro.n}
              </div>
              <div style={{ position: "relative", fontFamily: sans, fontWeight: 700, fontSize: 34, color: mixCor("#FFFFFF", marca, resolvido), whiteSpace: "nowrap" }}>
                {erro.rotulo}
                <div style={{ position: "absolute", left: -2, top: "54%", height: 3.5, width: `${resolvido * 104}%`, background: marca, borderRadius: 2 }} />
              </div>
            </div>
          );
        })}

        <ReguaPrimeiraTela t={t} linha={linha} />
        <ContaGotas t={t} linha={linha} rol={rol} />

        {/* toque no botão */}
        {e.toque > 0 && e.toque < 1 ? (
          <div
            style={{
              position: "absolute",
              left: centroBotao.x - (40 + e.toque * 280) / 2,
              top: centroBotao.y - (40 + e.toque * 280) / 2,
              width: 40 + e.toque * 280,
              height: 40 + e.toque * 280,
              borderRadius: "50%",
              border: `4px solid ${tinta}`,
              opacity: 0.55 * (1 - e.toque),
            }}
          />
        ) : null}
        {e.toque > 0 && e.toque < 1 ? (
          <div
            style={{
              position: "absolute",
              left: centroBotao.x + 30,
              top: centroBotao.y - 10,
              width: 54,
              height: 54,
              borderRadius: 27,
              background: "rgba(23,19,14,0.28)",
              border: "3px solid rgba(255,255,255,0.85)",
              opacity: Math.min(1, 4 * (1 - e.toque)) * Math.min(1, e.toque * 8),
              transform: `scale(${1 - 0.15 * Math.sin(Math.PI * Math.min(1, e.toque * 2.2))})`,
            }}
          />
        ) : null}

        <Avisos t={t} linha={linha} marca={marca} tinta={tinta} />
      </div>
    </div>
  );
};

// "Texto demais na primeira tela": régua vermelha ao longo da tela visível, com a altura da 1ª tela
const ReguaPrimeiraTela: React.FC<{ t: number; linha: Linha }> = ({ t, linha }) => {
  const erro = linha.erros.find((e) => e.tipo === "texto");
  if (!erro) return null;
  const em = erro.medeEm ?? erro.em + 0.6;
  const p = prog(t, em, 0.5);
  // sai quando o próximo erro entra (ou quando o erro é resolvido)
  const proximo = linha.erros.find((e) => e.em > erro.em + 0.05);
  const fora = prog(t, Math.min(erro.resolvidoEm - 0.1, proximo ? proximo.em - 0.3 : Infinity), 0.3);
  if (p <= 0 || fora >= 1) return null;
  const topo = 64;
  const base = TELA.h - 30;
  const x = TELA.w - 26;
  const h = (base - topo) * p;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fora }}>
      <div style={{ position: "absolute", left: x - 10, top: topo - 1.5, width: 20, height: 3, background: cor.vermelho }} />
      <div style={{ position: "absolute", left: x - 1.5, top: topo, width: 3, height: h, background: cor.vermelho }} />
      <div style={{ position: "absolute", left: x - 10, top: topo + h - 1.5, width: 20, height: 3, background: cor.vermelho, opacity: p > 0.97 ? 1 : 0 }} />
      <div
        style={{
          position: "absolute",
          right: TELA.w - x + 14,
          top: (topo + base) / 2 - 22,
          height: 44,
          padding: "0 12px",
          borderRadius: 8,
          background: cor.vermelho,
          color: "#FFFFFF",
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: "44px",
          whiteSpace: "nowrap",
          opacity: prog(p, 0.5, 0.5),
        }}
      >
        1ª tela · 844
      </div>
    </div>
  );
};

// "Letra clara em fundo claro": o conta-gotas pega a cor da letra e depois a do fundo
const ContaGotas: React.FC<{ t: number; linha: Linha; rol: number }> = ({ t, linha, rol }) => {
  const erro = linha.erros.find((e) => e.tipo === "contraste");
  if (!erro) return null;
  const medeEm = erro.medeEm ?? erro.em + 0.6;
  const p = prog(t, erro.em + 0.1, 0.35);
  const fora = prog(t, Math.min(erro.resolvidoEm - 0.2, medeEm + 1.3), 0.3);
  if (p <= 0 || fora >= 1) return null;
  const vai = prog(t, medeEm - 0.1, 0.45, viagem);
  // da letra (meio da 1ª linha do título fraco) para o fundo (respiro à direita, abaixo do título)
  const a = { x: 150 * s, y: (PG.tituloAntes.y + 16 - rol) * s };
  const b = { x: 330 * s, y: (PG.tituloAntes.y + 52 - rol) * s };
  const x = mix(a.x, b.x, vai);
  const y = mix(a.y, b.y, vai) - Math.sin(Math.PI * vai) * 30;
  const amostra = mixCor(cor.textoFraco, cor.tela, prog(vai, 0.5, 0.5));
  const d = 76;
  return (
    <div style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, opacity: p * (1 - fora), transform: `scale(${0.7 + 0.3 * p})` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: amostra,
          boxShadow: `0 0 0 6px #FFFFFF, 0 0 0 8.5px ${cor.tinta}, 0 10px 24px rgba(0,0,0,0.3)`,
        }}
      />
      <div style={{ position: "absolute", left: d / 2 - 2, top: d / 2 - 2, width: 4, height: 4, borderRadius: 2, background: cor.tinta }} />
    </div>
  );
};

// Medida de espaçamento (redline): linha vertical com pontas e o valor em px
const Medida: React.FC<{ x: number; y1: number; y2: number; valor: number; p: number }> = ({ x, y1, y2, valor, p }) => {
  if (p <= 0) return null;
  const h = (y2 - y1) * p;
  const fio = 2.4 / s;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 390, height: 10, opacity: Math.min(1, p * 1.5) }}>
      <div style={{ position: "absolute", left: x - 7, top: y1 - fio / 2, width: 14, height: fio, background: cor.vermelho }} />
      <div style={{ position: "absolute", left: x - fio / 2, top: y1, width: fio, height: h, background: cor.vermelho }} />
      <div style={{ position: "absolute", left: x - 7, top: y1 + h - fio / 2, width: 14, height: fio, background: cor.vermelho, opacity: p >= 0.98 ? 1 : 0 }} />
      <div
        style={{
          position: "absolute",
          right: 390 - x + 8,
          top: (y1 + y2) / 2 - 15,
          height: 30,
          padding: `0 ${8 / s}px`,
          borderRadius: 6,
          background: cor.vermelho,
          color: "#FFFFFF",
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 30 / s,
          lineHeight: "30px",
          opacity: prog(p, 0.4, 0.6),
        }}
      >
        {valor}
      </div>
    </div>
  );
};

// Ícones dos selos: relógio, coração, entrega (genéricos, servem para qualquer página)
const Selo: React.FC<{ i: number; tinta: string }> = ({ i, tinta }) => (
  <svg width={40} height={40} viewBox="0 0 24 24">
    {i === 0 ? (
      <>
        <circle cx={12} cy={12} r={9} stroke={tinta} strokeWidth={2.2} fill="none" />
        <path d="M12 7 V12 L15.5 14" stroke={tinta} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      </>
    ) : i === 1 ? (
      <path d="M12 20 C 4 14, 3 9, 6 6.5 C 8.5 4.5, 11 5.5, 12 7.5 C 13 5.5, 15.5 4.5, 18 6.5 C 21 9, 20 14, 12 20 Z" stroke={tinta} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
    ) : (
      <>
        <path d="M2.5 7 H14 V16 H2.5 Z M14 10 H18 L21.5 13 V16 H14" stroke={tinta} strokeWidth={2.2} fill="none" strokeLinejoin="round" />
        <circle cx={7} cy={17.5} r={2} fill={tinta} />
        <circle cx={17} cy={17.5} r={2} fill={tinta} />
      </>
    )}
  </svg>
);

// O resto da página, abaixo da dobra (só wireframe)
const RestoDaPagina: React.FC = () => {
  const barra = (top: number, w: number, k: number | string) => (
    <div key={k} style={{ position: "absolute", left: 20, top, width: 350 * w, height: 9, borderRadius: 5, background: cor.linha }} />
  );
  return (
    <div style={{ position: "relative", width: 390, height: 1300 }}>
      {[0.98, 0.93, 0.97, 0.6].map((w, i) => barra(i * 21, w, `a${i}`))}
      {[0, 1, 2].map((i) => (
        <div key={i}>
          <div style={{ position: "absolute", left: 20, top: 120 + i * 62, width: 36, height: 36, borderRadius: 18, background: cor.bloco }} />
          <div style={{ position: "absolute", left: 70, top: 124 + i * 62, width: 180, height: 10, borderRadius: 5, background: cor.traco }} />
          <div style={{ position: "absolute", left: 70, top: 142 + i * 62, width: 260, height: 8, borderRadius: 4, background: cor.linha }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 20, top: 330, width: 350, height: 170, borderRadius: 14, background: "#E7EAEE" }} />
      {[0.8, 0.86, 0.5].map((w, i) => (
        <div key={i} style={{ position: "absolute", left: 40, top: 360 + i * 22, width: 310 * w, height: 9, borderRadius: 5, background: cor.linha }} />
      ))}
      {[0.97, 0.92, 0.99, 0.95, 0.7].map((w, i) => barra(540 + i * 21, w, `b${i}`))}
      <div style={{ position: "absolute", left: 20, top: 680, width: 350, height: 230, borderRadius: 14, border: `2.5px solid ${cor.bloco}` }} />
      {[0.5, 0.8, 0.7, 0.75].map((w, i) => (
        <div key={i} style={{ position: "absolute", left: 40, top: 712 + i * 40, width: 300 * w, height: 10, borderRadius: 5, background: i === 0 ? cor.traco : cor.linha }} />
      ))}
      {[0.96, 0.9, 0.98, 0.94, 0.88, 0.6].map((w, i) => barra(940 + i * 21, w, `c${i}`))}
      {[0.4, 0.55].map((w, i) => barra(1200 + i * 22, w, `d${i}`))}
    </div>
  );
};

// Imagem pesada: um indicador de carregamento que gira e uma barra que não anda
const Carregando: React.FC<{ t: number; linha: Linha; h: number }> = ({ t, linha, h }) => {
  const erro = linha.erros.find((e) => e.tipo === "imagem");
  if (!erro) return null;
  const p = Math.min(prog(t, erro.em, 0.3), 1 - prog(t, erro.resolvidoEm, 0.25));
  if (p <= 0) return null;
  const giro = (t * 300) % 360;
  const avance = 0.12 + 0.18 * prog(t, erro.em, 2.5);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: p }}>
      <svg width={70} height={70} viewBox="0 0 70 70" style={{ position: "absolute", left: 140, top: h / 2 - 35, rotate: `${giro}deg` }}>
        <circle cx={35} cy={35} r={26} stroke={cor.traco} strokeWidth={7} fill="none" />
        <path d="M35 9 A 26 26 0 0 1 61 35" stroke={cor.vermelho} strokeWidth={7} strokeLinecap="round" fill="none" />
      </svg>
      <div style={{ position: "absolute", left: 20, right: 20, bottom: 18, height: 8, borderRadius: 4, background: cor.bloco }}>
        <div style={{ width: `${avance * 100}%`, height: "100%", borderRadius: 4, background: cor.vermelho }} />
      </div>
    </div>
  );
};

// Avisos que chegam (resultado): empilham de baixo para cima
const Avisos: React.FC<{ t: number; linha: Linha; marca: string; tinta: string }> = ({ t, linha, marca, tinta }) => {
  const lista = linha.avisos;
  return (
    <>
      {lista.map((a, i) => {
        const p = prog(t, a.em, 0.4);
        if (p <= 0) return null;
        const acima = lista.slice(i + 1).reduce((soma, b) => soma + prog(t, b.em, 0.4), 0);
        const base = TELA.h - 132;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 16,
              width: TELA.w - 32,
              top: base - acima * 116 + (1 - p) * 60,
              height: 104,
              borderRadius: 26,
              background: "#FFFFFF",
              boxShadow: "0 12px 30px rgba(20,16,10,0.22)",
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "0 22px",
              opacity: p,
            }}
          >
            <div style={{ width: 58, height: 58, borderRadius: 29, background: marca, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check tamanho={30} cor={tinta} espessura={5} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 34, color: tinta, whiteSpace: "nowrap", lineHeight: 1.1 }}>{a.texto}</div>
              {a.detalhe ? (
                <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 30, color: cor.tintaSuave, whiteSpace: "nowrap", lineHeight: 1.1 }}>{a.detalhe}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
};
