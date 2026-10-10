// Peças comuns dos blocos de barra: o recorte pela barra (o texto mora na barra e é revelado por
// ela, como uma cortina, enquanto as barras se mexem), a régua âmbar que se desenha do centro,
// o crédito em caixa alta que cabe sempre e a etiqueta "ilustrativo".
import { prog, travelling, useTempo } from "../anim";
import type { Estado } from "../layout";
import { corpoDoCredito } from "../medida";
import { cor, sans } from "../tema";
import { RotuloDeCredito } from "./Cartela";
import { TextoEmFoco } from "./Foco";

// Mostra os filhos (posicionados em px da tela) só dentro da barra de cima ou de baixo, do jeito
// que ela está agora: a janela da imagem nunca cobre o texto, e o texto aparece e some com a barra.
export const NaBarra: React.FC<{ lado: "cima" | "baixo"; estado: Estado; children: React.ReactNode }> = ({ lado, estado, children }) => {
  const topo = lado === "cima" ? 0 : Math.max(0, estado.base);
  const altura = lado === "cima" ? Math.max(0, estado.topo) : Math.max(0, 1920 - estado.base);
  if (altura < 1) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: topo, width: 1080, height: altura, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: -topo, width: 1080, height: 1920 }}>{children}</div>
    </div>
  );
};

// Régua âmbar fina que se desenha do centro para os lados.
export const Regua: React.FC<{ em: number; largura?: number; opacidade?: number; corDaLinha?: string }> = ({ em, largura = 220, opacidade = 0.7, corDaLinha = cor.ambar }) => {
  const t = useTempo();
  const p = prog(t, em, 0.9, travelling);
  return <div style={{ height: 2, width: largura * p, background: corDaLinha, opacity: opacidade * Math.min(1, p * 3) }} />;
};

// Crédito de filme (Jost em caixa alta espaçada, âmbar) que cabe sempre: diminui até 30 px; se
// mesmo assim não cabe numa linha, vira uma linha em itálico (Cormorant) de até duas linhas.
export const Credito: React.FC<{ texto: string; em: number; largura?: number; tamanho?: number; corDoTexto?: string; limite?: number }> = ({
  texto,
  em,
  largura = 940,
  tamanho = 36,
  corDoTexto,
  limite,
}) => {
  // a largura do crédito conta o espaçamento das letras ainda abertas (as letras se aproximam)
  const corpo = corpoDoCredito(texto, largura / 1.12, tamanho, 30);
  if (corpo !== null) return <RotuloDeCredito texto={texto} em={em} tamanho={corpo} style={corDoTexto ? { color: corDoTexto } : undefined} />;
  return (
    <TextoEmFoco
      texto={texto}
      em={em}
      limite={limite}
      largura={largura}
      max={52}
      min={40}
      linhas={2}
      italico
      cor={corDoTexto ?? cor.ambarClaro}
    />
  );
};

// Etiqueta "ilustrativo": crédito pequeno em cinza frio, com um fio de cada lado.
export const Ilustrativo: React.FC<{ em: number }> = ({ em }) => {
  const t = useTempo();
  const p = prog(t, em, 0.8);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: p }}>
      <div style={{ height: 2, width: 36, background: cor.frio, opacity: 0.8 }} />
      <div
        style={{
          fontFamily: sans,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: "0.3em",
          marginRight: "-0.3em",
          textTransform: "uppercase",
          color: cor.frio,
          whiteSpace: "nowrap",
        }}
      >
        Ilustrativo
      </div>
      <div style={{ height: 2, width: 36, background: cor.frio, opacity: 0.8 }} />
    </div>
  );
};
