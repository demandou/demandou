// Passagem de `acordes` para `compasso`: quando a linha de compassos vem logo depois da grade de
// acordes, cada diagrama viaja da sua célula para o seu compasso, encolhendo e perdendo os números
// dos dedos. Nada some e reaparece: o mesmo desenho muda de lugar.
import { formaDoAcorde } from "../acordes";
import { mix, prog, troca } from "../anim";
import { cifraDoCompasso, geometriaDoCompasso, lugaresDosAcordes, TAMANHO_CIFRA } from "../geometria";
import { textoDoCompasso } from "../layout";
import type { Acordes, Compasso } from "../plano";
import { cor } from "../tema";
import { CifraNoLugar } from "./Acordes";
import type { Area } from "./Cena";
import { Diagrama } from "./Diagrama";

// primeiro cada diagrama anda de lado (na sua linha da grade), depois sobe ou desce para a faixa:
// coluna por coluna, ninguém cruza com ninguém
export const DURACAO_PASSAGEM = 0.8;

// para cada compasso, o índice do acorde da grade que vira ele (−1 = não vem da grade)
export const origensDosCompassos = (a: Acordes, c: Compasso) => {
  const usados = new Set<number>();
  return c.compassos.slice(0, 4).map((c) => {
    const cifra = textoDoCompasso(c);
    const j = a.acordes.slice(0, 4).findIndex((x, k) => !usados.has(k) && x.cifra.trim() === cifra.trim());
    if (j >= 0) usados.add(j);
    return j;
  });
};

export const fimDaPassagem = (c: Compasso) => c.de + DURACAO_PASSAGEM;

export const Passagem: React.FC<{
  t: number;
  acordes: Acordes;
  compasso: Compasso;
  areaAcordes: Area;
  areaCompasso: Area;
  comLado: boolean;
}> = ({ t, acordes, compasso, areaAcordes, areaCompasso, comLado }) => {
  if (t < compasso.de || t > fimDaPassagem(compasso) + 0.02) return null;
  const de = lugaresDosAcordes(Math.min(4, acordes.acordes.length), areaAcordes);
  const n = Math.min(4, compasso.compassos.length);
  const g = geometriaDoCompasso(n, areaCompasso, comLado);
  const para = g.lugares;
  const origens = origensDosCompassos(acordes, compasso);

  return (
    <>
      {origens.map((j, i) => {
        if (j < 0) return null;
        const acorde = acordes.acordes[j];
        const forma = formaDoAcorde(acorde);
        const p = prog(t, compasso.de, DURACAO_PASSAGEM, troca);
        const px = prog(t, compasso.de + 0.04, DURACAO_PASSAGEM * 0.5, troca);
        const py = prog(t, compasso.de + DURACAO_PASSAGEM * 0.42, DURACAO_PASSAGEM * 0.58, troca);
        const a = de[j];
        const b = para[i];
        return (
          <div key={i}>
            <CifraNoLugar
              cifra={acorde.cifra}
              cx={mix(a.cx, b.cx, px)}
              topo={mix(a.topoCifra, b.topoCifra, py)}
              cor={cor.marfim}
              tamanho={mix(TAMANHO_CIFRA, cifraDoCompasso(g.duasLinhas), p)}
            />
            {forma ? (
              <div style={{ position: "absolute", left: mix(a.dx, b.dx, px), top: mix(a.dy, b.dy, py) }}>
                <Diagrama forma={forma} t={t} em={-10} escala={mix(a.escala, b.escala, p)} ativo={0} opacidadeNumeros={1 - prog(p, 0, 0.4)} />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
