#!/bin/sh
# Gera os sons do modelo Herbário: tons graves e curtos (seno com envelope e passa-baixa). Rode de dentro de public/sfx.
set -e
ataque() { echo "min(1,($1)/0.012)"; }
nota() { # freq início decaimento
  echo "sin(2*PI*$1*(t-$2))*exp(-$3*(t-$2))*gte(t,$2)*$(ataque "t-$2")"
}
gera() { # nome duração expressão passa-baixa
  ffmpeg -y -loglevel error -f lavfi -i "aevalsrc=exprs='$3':s=48000:d=$2" -af "lowpass=f=$4,afade=t=out:st=$(echo "$2 - 0.08" | bc | sed "s/^\./0./"):d=0.08,volume=0.9" -ac 2 "$1.wav"
}
gera prancha-1 0.7 "0.45*($(nota 196 0 6))+0.4*($(nota 261.63 0.09 6.5))+0.08*($(nota 523.25 0.09 9))" 1800
gera prancha-2 0.7 "0.45*($(nota 220 0 6))+0.4*($(nota 293.66 0.09 6.5))+0.08*($(nota 587.33 0.09 9))" 1800
gera prancha-3 0.7 "0.45*($(nota 174.61 0 6))+0.4*($(nota 233.08 0.09 6.5))+0.08*($(nota 466.16 0.09 9))" 1800
gera mergulho 0.8 "0.6*sin(2*PI*(260*t-70*t*t))*exp(-4*t)*$(ataque t)+0.25*sin(2*PI*(130*t-35*t*t))*exp(-3.5*t)*$(ataque t)" 1200
gera agua 0.45 "0.6*sin(2*PI*(560*t-1900*t*t*gte(0.07,t)-1900*0.0049*gte(t,0.07)-(560-266)*(t-0.07)*gte(t,0.07)))*exp(-11*t)*$(ataque t)" 1400
gera grave 0.9 "0.45*sin(2*PI*(130.81*t-6*t*t))*exp(-3.6*t)*$(ataque t)+0.45*sin(2*PI*(110*t-6*t*t))*exp(-3.6*t)*$(ataque t)" 900
gera desliza 0.6 "0.55*sin(2*PI*(392*t-140*t*t))*exp(-5*t)*$(ataque t)" 1500
gera erro 0.6 "0.5*($(nota 164.81 0 9))+0.5*($(nota 130.81 0.13 6))" 1200
gera toque 0.4 "0.7*($(nota 98 0 13))+0.25*($(nota 196 0 16))" 900
gera dia 0.8 "0.35*($(nota 261.63 0 5.5))+0.35*($(nota 329.63 0.11 5.5))+0.35*($(nota 392 0.22 5))" 2000
gera fecho 1.3 "0.3*($(nota 130.81 0 2.8))+0.3*($(nota 196 0.02 3))+0.25*($(nota 329.63 0.05 3.4))+0.12*($(nota 392 0.08 3.8))" 1700
# nota curta de pena (um item da lista, um passo, uma opção ganha tinta): duas notas leves subindo
gera folha 0.5 "0.42*($(nota 293.66 0 10))+0.3*($(nota 440 0.07 11))" 1500
