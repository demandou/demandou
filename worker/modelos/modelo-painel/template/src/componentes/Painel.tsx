import { prog, Revela, saindo, useTempo } from "../anim";
import { PAINEL, xDoCabecalho } from "../layout";
import { encaixar } from "../medida";
import type { Lado } from "../plano";
import { cor, mono, rotulo, sans } from "../tema";
import { corpoQueCabe, type TextoDeValor, Valor } from "./Valor";

// Etiqueta "ilustrativo": aparece no canto do corpo de todo painel sem números ditos.
export const EtiquetaIlustrativo: React.FC<{ p: number; top?: number; esquerda?: boolean }> = ({ p, top = PAINEL.corpo.topo - 4, esquerda }) => (
  <div
    style={{
      position: "absolute",
      ...(esquerda ? { left: PAINEL.corpo.esquerda } : { right: 1080 - PAINEL.corpo.direita }),
      top,
      padding: "6px 16px",
      borderRadius: 10,
      border: `2px solid ${cor.ambar}`,
      fontFamily: mono,
      fontWeight: 500,
      fontSize: 30,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: cor.ambar,
      opacity: p,
      translate: `0 ${(1 - p) * 8}px`,
    }}
  >
    ilustrativo
  </div>
);

type Ficha = { em: number; rotulo: string; valor: string }[];

// Moldura comum dos momentos de painel: cabeçalho ao lado da janela (rótulo, ficha ou título,
// contador), corpo largo embaixo e a nota de rodapé.
// Saída: o cabeçalho sai logo (a janela vai passar por cima dele quando troca de canto); o corpo
// fica até o corpo do painel seguinte começar a entrar e sai deslizando — a tela nunca esvazia.
export const Painel: React.FC<{
  de: number;
  // quando o corpo começa a entrar (o Edicao calcula: logo, se a tela já era um painel)
  t0: number;
  ate: number;
  // quando o cabeçalho e o corpo terminam de sair (padrão: `ate`)
  fimCabecalho?: number;
  fimCorpo?: number;
  lado: Lado;
  rotulo?: string;
  titulo?: string;
  ficha?: Ficha;
  nota?: string;
  // nota quando o plano não diz nada (ex.: "Simulação ilustrativa" numa conta calculada)
  notaPadrao?: string;
  // painel sem números ditos: etiqueta "ilustrativo" no canto do corpo
  ilustrativo?: boolean;
  etiquetaEsquerda?: boolean;
  // no lugar do contador: outro indicador (seta de tendência, progresso das etapas…)
  indicador?: React.ReactNode;
  // contador grande do cabeçalho, o texto sob ele e o valor final (define o tamanho da fonte)
  valor?: TextoDeValor;
  valorFinal?: TextoDeValor;
  valorTexto?: React.ReactNode;
  corValor?: string;
  // quando o contador aparece
  valorEm?: number;
  children: React.ReactNode;
}> = ({
  de,
  t0: inicioCorpo,
  ate,
  fimCabecalho,
  fimCorpo,
  lado,
  rotulo: rotuloDoPlano,
  titulo: tituloDoPlano,
  ficha,
  nota,
  notaPadrao = "",
  ilustrativo,
  etiquetaEsquerda,
  indicador,
  valor,
  valorFinal,
  valorTexto,
  corValor = cor.positivo,
  valorEm,
  children,
}) => {
  const t = useTempo();
  // o cabeçalho espera a janela chegar ao canto (ou sair do lado dele)
  // vindo da tela cheia, o cabeçalho entra durante a troca (a pessoa encolhe e o revela);
  // vindo de outro painel, espera a janela passar por cima dele até o outro canto
  const t0 = inicioCorpo < de ? inicioCorpo : Math.max(inicioCorpo, de + 0.42);
  const sCabecalho = saindo(t, fimCabecalho ?? ate, 0.26);
  const fimDoCorpo = fimCorpo ?? ate;
  const sCorpo = saindo(t, fimDoCorpo, fimDoCorpo > ate ? 0.4 : 0.28);
  const x = xDoCabecalho(lado);
  const { largura } = PAINEL.cabecalho;
  const notaFinal = nota ?? notaPadrao;
  // sem `rotulo`, o `titulo` vira o rótulo; com os dois, o título é a frase do cabeçalho
  const textoRotulo = rotuloDoPlano ?? tituloDoPlano ?? "";
  const titulo = rotuloDoPlano ? tituloDoPlano : undefined;
  const medidaRotulo = encaixar(textoRotulo, {
    largura: largura - 28,
    max: 32,
    min: 30,
    linhas: 2,
    fonte: { mono: true, caixaAlta: true, espacamento: 0.03 },
  });
  const medidaTitulo = titulo ? encaixar(titulo, { largura, max: 54, min: 44, linhas: 2, fonte: { peso: 600, espacamento: -0.015 } }) : null;
  const linhasFicha = (ficha ?? []).slice(0, 3);
  const temMiolo = linhasFicha.length > 0 || !!titulo;
  const pValor = prog(t, valorEm ?? t0 + 0.2, 0.45);
  const corpoValor = valor ? corpoQueCabe(valorFinal ?? valor, largura, temMiolo ? 116 : 132) : 0;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* cabeçalho */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: PAINEL.cabecalho.topo,
          width: largura,
          height: PAINEL.cabecalho.altura,
          display: "flex",
          flexDirection: "column",
          justifyContent: temMiolo ? "space-between" : "center",
          gap: temMiolo ? 0 : 40,
          opacity: 1 - sCabecalho,
          translate: `0 ${-10 * sCabecalho}px`,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: prog(t, t0, 0.3), minHeight: 38 }}>
            {textoRotulo ? (
              <div style={{ width: 13, height: 13, flexShrink: 0, borderRadius: 2, background: cor.ambar, scale: String(prog(t, t0, 0.35)) }} />
            ) : null}
            <Revela p={prog(t, t0 + 0.05, 0.5)}>
              <div style={{ ...rotulo, fontSize: medidaRotulo.tamanho, lineHeight: 1.2 }}>
                {medidaRotulo.linhas.map((l) => (
                  <div key={l} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            </Revela>
          </div>
          <div style={{ marginTop: 18, height: 2, width: largura * prog(t, t0 + 0.1, 0.7), background: cor.linha }} />
        </div>

        {linhasFicha.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {linhasFicha.map((f, i) => {
              const p = prog(t, Math.max(f.em, t0 + 0.1 + i * 0.08), 0.4);
              return (
                <div
                  key={f.rotulo}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    paddingBottom: 8,
                    borderBottom: `1.5px solid rgba(226,238,231,${0.08 * p})`,
                    opacity: prog(t, t0 + 0.1, 0.3) * (0.3 + 0.7 * p),
                  }}
                >
                  <div style={{ fontFamily: mono, fontSize: 32, letterSpacing: "0.03em", textTransform: "uppercase", color: cor.suave }}>
                    {f.rotulo}
                  </div>
                  <Revela p={p}>
                    <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 44, color: cor.texto, whiteSpace: "nowrap" }}>{f.valor}</div>
                  </Revela>
                </div>
              );
            })}
          </div>
        ) : titulo && medidaTitulo ? (
          <Revela p={prog(t, t0 + 0.15, 0.55)}>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: medidaTitulo.tamanho, lineHeight: 1.08, letterSpacing: "-0.015em", color: cor.texto }}>
              {medidaTitulo.linhas.map((l) => (
                <div key={l} style={{ whiteSpace: "nowrap" }}>
                  {l}
                </div>
              ))}
            </div>
          </Revela>
        ) : null}

        {indicador ? (
          <div style={{ opacity: prog(t, t0 + 0.15, 0.35) }}>{indicador}</div>
        ) : valor ? (
          <div>
            <Revela p={pValor}>
              <Valor v={valor} tamanho={corpoValor} cor={corValor} />
            </Revela>
            {valorTexto ? (
              <div
                style={{
                  marginTop: 10,
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 40,
                  lineHeight: 1.15,
                  color: cor.suave,
                  opacity: prog(t, (valorEm ?? t0 + 0.2) + 0.15, 0.4),
                }}
              >
                {valorTexto}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* corpo e nota */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - sCorpo, translate: `${-70 * sCorpo}px 0` }}>
        {children}
        {ilustrativo ? <EtiquetaIlustrativo p={prog(t, inicioCorpo + 0.5, 0.4)} esquerda={etiquetaEsquerda} /> : null}
        {notaFinal ? (
          <div
            style={{
              position: "absolute",
              left: PAINEL.corpo.esquerda,
              top: PAINEL.nota,
              fontFamily: mono,
              fontSize: 32,
              letterSpacing: "0.02em",
              color: cor.apagado,
              opacity: prog(t, inicioCorpo + 0.6, 0.5),
            }}
          >
            {notaFinal}
          </div>
        ) : null}
      </div>
    </div>
  );
};
