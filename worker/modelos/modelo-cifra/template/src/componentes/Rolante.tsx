// O texto que rola embaixo do metrônomo (o andamento, ou o passo da vez) e o rótulo pequeno em cima dele.
import { prog } from "../anim";
import { caber } from "../medida";
import { cor, rotulo, titulo } from "../tema";

// O texto que rola no lugar do andamento: cada um vale a partir do seu `em` (antes do primeiro, a lápis)
export const Rolante: React.FC<{ lista: { em: number; texto: string }[]; t: number; tamanho: number }> = ({ lista, t, tamanho }) => {
  const ordenada = [...lista].filter((a) => a.texto).sort((a, b) => a.em - b.em);
  const k = ordenada.reduce((n, a, i) => (t >= a.em - 0.02 ? i : n), -1);
  return (
    <div style={{ position: "relative", height: tamanho * 1.15, overflow: "hidden", width: "100%" }}>
      {ordenada.map((a, i) => {
        const entra = prog(t, a.em - 0.04, 0.32);
        const sai = i < ordenada.length - 1 ? prog(t, ordenada[i + 1].em - 0.04, 0.32) : 0;
        const lapis = i === 0 && k < 0;
        if (!lapis && (entra <= 0 || sai >= 1)) return null;
        return (
          <div
            key={a.texto + i}
            style={{
              ...titulo,
              position: "absolute",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: tamanho,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              color: lapis ? cor.lapisForte : i === 0 ? cor.marfim : cor.azul,
              translate: lapis ? "0 0" : `0 ${(1 - entra) * 60 - sai * 70}%`,
              opacity: lapis ? 1 : 1 - sai,
            }}
          >
            {a.texto}
          </div>
        );
      })}
    </div>
  );
};

// O tamanho do texto que rola: o maior que cabe na largura (de 70 até 44 px)
export const tamanhoDoRolante = (textos: string[], largura: number) =>
  Math.min(...textos.filter(Boolean).map((x) => caber(x, { largura, max: 70, min: 44, linhas: 1 }).tamanho), 70);

// Rótulo pequeno em caixa-alta em cima do texto que rola ("andamento", ou o título do momento)
export const RotuloDoRolante: React.FC<{ texto: string; largura: number; centro?: boolean }> = ({ texto, largura, centro = true }) => {
  const enc = caber(texto, { largura, max: 32, min: 30, linhas: 2, estilo: { peso: 700, espacamento: 0.14, caixaAlta: true } });
  return (
    <div style={{ ...rotulo, fontSize: enc.tamanho, color: cor.marfimSuave, textAlign: centro ? "center" : "left", lineHeight: 1.2 }}>
      {enc.linhas.map((l, i) => (
        <div key={i}>{l.map((k) => enc.palavras[k]).join(" ")}</div>
      ))}
    </div>
  );
};

