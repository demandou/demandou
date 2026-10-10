// Catálogo de astros conhecidos, para o plano citar só pelo id ({ "id": "acrux" }).
// ar = ascensão reta em horas; dec = declinação em graus (época J2000, posições aproximadas — servem
// para desenho esquemático, não para apontar telescópio). mag = magnitude aparente.
export type Registro = { ar: number; dec: number; mag?: number; nome: string };

export const CATALOGO: Record<string, Registro> = {
  // Cruzeiro do Sul (as quatro principais + a Intrometida)
  acrux: { ar: 12.4433, dec: -63.099, mag: 0.76, nome: "Acrux" },
  mimosa: { ar: 12.7954, dec: -59.689, mag: 1.25, nome: "Mimosa" },
  gacrux: { ar: 12.5194, dec: -57.113, mag: 1.64, nome: "Gacrux" },
  imai: { ar: 12.2524, dec: -58.749, mag: 2.79, nome: "Imai" },
  ginan: { ar: 12.356, dec: -60.401, mag: 3.59, nome: "Intrometida" },
  // as ponteiras (guardiãs) do Cruzeiro, em Centauro
  "alfa-centauro": { ar: 14.6601, dec: -60.834, mag: -0.27, nome: "Alfa Centauro" },
  "beta-centauro": { ar: 14.0637, dec: -60.373, mag: 0.61, nome: "Beta Centauro" },
  // Falso Cruzeiro
  avior: { ar: 8.3752, dec: -59.51, mag: 1.86, nome: "Avior" },
  aspidiske: { ar: 9.2848, dec: -59.275, mag: 2.21, nome: "Aspidiske" },
  "delta-velorum": { ar: 8.7451, dec: -54.708, mag: 1.96, nome: "Delta Velorum" },
  markeb: { ar: 9.3686, dec: -55.011, mag: 2.47, nome: "Markeb" },
  // Órion e as Três Marias
  betelgeuse: { ar: 5.9195, dec: 7.407, mag: 0.5, nome: "Betelgeuse" },
  rigel: { ar: 5.2423, dec: -8.202, mag: 0.13, nome: "Rigel" },
  bellatrix: { ar: 5.4189, dec: 6.35, mag: 1.64, nome: "Bellatrix" },
  saiph: { ar: 5.7959, dec: -9.67, mag: 2.09, nome: "Saiph" },
  meissa: { ar: 5.5856, dec: 9.934, mag: 3.39, nome: "Meissa" },
  alnitak: { ar: 5.6793, dec: -1.943, mag: 1.77, nome: "Alnitak" },
  alnilam: { ar: 5.6036, dec: -1.202, mag: 1.69, nome: "Alnilam" },
  mintaka: { ar: 5.5334, dec: -0.299, mag: 2.23, nome: "Mintaka" },
  // Escorpião
  antares: { ar: 16.4901, dec: -26.432, mag: 1.06, nome: "Antares" },
  acrab: { ar: 16.0906, dec: -19.806, mag: 2.62, nome: "Acrab" },
  dschubba: { ar: 16.0056, dec: -22.622, mag: 2.29, nome: "Dschubba" },
  "pi-escorpiao": { ar: 15.9809, dec: -26.114, mag: 2.89, nome: "Pi Escorpião" },
  "sigma-escorpiao": { ar: 16.3531, dec: -25.593, mag: 2.89, nome: "Sigma Escorpião" },
  "tau-escorpiao": { ar: 16.5981, dec: -28.216, mag: 2.82, nome: "Tau Escorpião" },
  "epsilon-escorpiao": { ar: 16.8361, dec: -34.293, mag: 2.29, nome: "Épsilon Escorpião" },
  "mu-escorpiao": { ar: 16.8645, dec: -38.048, mag: 3.0, nome: "Mu Escorpião" },
  "zeta-escorpiao": { ar: 16.9097, dec: -42.361, mag: 3.6, nome: "Zeta Escorpião" },
  "eta-escorpiao": { ar: 17.2026, dec: -43.239, mag: 3.33, nome: "Eta Escorpião" },
  sargas: { ar: 17.622, dec: -42.998, mag: 1.86, nome: "Sargas" },
  "iota-escorpiao": { ar: 17.7931, dec: -40.127, mag: 3.0, nome: "Iota Escorpião" },
  girtab: { ar: 17.7081, dec: -39.03, mag: 2.39, nome: "Girtab" },
  shaula: { ar: 17.5601, dec: -37.104, mag: 1.62, nome: "Shaula" },
  lesath: { ar: 17.5127, dec: -37.296, mag: 2.7, nome: "Lesath" },
  // estrelas brilhantes avulsas
  sirius: { ar: 6.7525, dec: -16.716, mag: -1.46, nome: "Sírius" },
  canopus: { ar: 6.3992, dec: -52.696, mag: -0.74, nome: "Canopus" },
  achernar: { ar: 1.6286, dec: -57.237, mag: 0.46, nome: "Achernar" },
  aldebaran: { ar: 4.5987, dec: 16.509, mag: 0.86, nome: "Aldebarã" },
  pleiades: { ar: 3.7914, dec: 24.105, mag: 2.87, nome: "Plêiades" },
  procyon: { ar: 7.655, dec: 5.225, mag: 0.34, nome: "Prócion" },
  vega: { ar: 18.6156, dec: 38.784, mag: 0.03, nome: "Vega" },
  altair: { ar: 19.8464, dec: 8.868, mag: 0.77, nome: "Altair" },
  arcturus: { ar: 14.261, dec: 19.182, mag: -0.05, nome: "Arcturo" },
  spica: { ar: 13.4199, dec: -11.161, mag: 0.97, nome: "Espiga" },
  fomalhaut: { ar: 22.9608, dec: -29.622, mag: 1.16, nome: "Fomalhaut" },
  polaris: { ar: 2.5303, dec: 89.264, mag: 1.98, nome: "Estrela Polar" },
  // pontos (sem estrela)
  "polo-sul": { ar: 0, dec: -90, nome: "Polo Sul Celeste" },
  "polo-norte": { ar: 0, dec: 90, nome: "Polo Norte Celeste" },
};
