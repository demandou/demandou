import { Linha, prog, saindo, useTempo } from "../anim";
import type { Lista as TLista } from "../plano";
import { cor, rotulo, serif, sombra } from "../tema";
import { IconeTraco } from "./Icones";

// Lista numerada: cada item entra quando é falado; os anteriores recuam.
export const Lista: React.FC<{ m: TLista }> = ({ m }) => {
  const t = useTempo();
  const sai = saindo(t, m.ate);

  return (
    <div style={{ width: "100%", opacity: 1 - sai, translate: `0 ${-14 * sai}px`, textShadow: sombra }}>
      {m.rotulo ? (
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14, opacity: prog(t, m.de, 0.4) }}>
          <div style={{ ...rotulo, color: cor.lataoClaro }}>{m.rotulo}</div>
          <div style={{ flex: 1, height: 1, background: "rgba(242,236,223,0.35)", scale: `${prog(t, m.de, 0.7)} 1`, transformOrigin: "left" }} />
        </div>
      ) : null}
      {m.itens.map((item, i) => {
        const proximo = m.itens[i + 1];
        const entra = prog(t, item.em, 0.5);
        // recua quando o item seguinte começa
        const recuo = proximo ? prog(t, proximo.em, 0.4) : 0;
        if (t < item.em - 0.05) {
          return <div key={item.texto} style={{ height: 142 }} />;
        }
        return (
          <div
            key={item.texto}
            style={{
              height: 142,
              display: "flex",
              alignItems: "center",
              gap: 26,
              borderBottom: i < m.itens.length - 1 ? "1px solid rgba(242,236,223,0.18)" : "none",
              opacity: 1 - 0.42 * recuo,
            }}
          >
            <Linha
              p={entra}
              style={{ fontFamily: serif, fontSize: 104, lineHeight: 1.0, color: cor.lataoClaro, width: 70, textAlign: "center" }}
            >
              {i + 1}
            </Linha>
            <div style={{ flex: 1 }}>
              <Linha
                p={prog(t, item.em + 0.08, 0.55)}
                style={{ fontFamily: serif, fontSize: 60, lineHeight: 1.06, color: cor.papel, textWrap: "balance" }}
              >
                {item.texto}
              </Linha>
            </div>
            {item.icone ? (
              <div style={{ opacity: entra }}>
                <IconeTraco nome={item.icone} p={prog(t, item.em + 0.25, 1.1)} tamanho={80} cor={cor.lataoClaro} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
