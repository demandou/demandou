/**
 * O KIT DO EDITOR AVANÇADO (as aulas 7, 8.1 e 8.2 do curso, feitas pela
 * plataforma em cada corte). A cena escrita pela IA importa SÓ daqui, do
 * react, do remotion, do @remotion/three, do three e do @react-three/fiber
 * (o portão do worker confere). A referência de cada peça está em
 * worker/avancado/kit-api.md, que vai inteira para quem escreve a cena.
 */
export { DADOS, FPS, LARGURA, ALTURA, DURACAO } from "./dados";
export type { Palavra, PontoDoRosto, Tecnica, DadosDoCorte } from "./dados";
export { useTempo, k, mix, janela, suavizar, dito, ditoAte, falaEntre, normalizar, SAIDA, ENTRADA, MEIO, MOLA } from "./tempo";
export { MARCA, misturar, comAlfa } from "./marca";
export { LETRA, comoTitulo } from "./letra";
export { useApresentador } from "./apresentador";
export type { Apresentador } from "./apresentador";
export { caminhoDaMoldura, cantosDaForma, recuarMoldura, cruzam } from "./moldura";
export type { Caixa, Forma, Cantos } from "./moldura";
export { Letreiro, TituloQueCabe, useTamanhoQueCabe, medirTexto } from "./texto";
export { Icone, ICONES } from "./Icone";
export type { NomeDoIcone } from "./Icone";
export { Cartao, Traco, LinhaEntre } from "./Cartao";
export { Cena3D, LuzesDaMarca, ChaoDaMarca, COR_3D, cameraEm, projetar, useDescartar } from "./tres";
export type { ChaveDeCamera, Rotulo3D, Vetor } from "./tres";
export { GraficoDeLinha, GraficoDeBarras, Contador, Etiqueta, PainelDeDado, formatarNumero } from "./grafico";
export type { CenaProps } from "./Palco";
