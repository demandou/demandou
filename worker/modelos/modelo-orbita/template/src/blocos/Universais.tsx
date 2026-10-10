// Os 11 blocos universais (motor/BLOCOS.md) desenhados na linguagem da Órbita.
import type { BlocoDoEspaco } from "./registro";
import { BLOCOS_DE_TEXTO } from "./textos";
import { BLOCOS_DE_LISTA } from "./listas";
import { BLOCOS_DE_DADOS } from "./dados";

export const UNIVERSAIS: Record<string, BlocoDoEspaco> = { ...BLOCOS_DE_TEXTO, ...BLOCOS_DE_LISTA, ...BLOCOS_DE_DADOS };
