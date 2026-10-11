# O RENDER 3D NA GPU DO RUNPOD SERVERLESS (11/10/2026): os modelos do curso com
# @remotion/three (Torre, Medida, Órbita, Anatomia) e o editor avançado, que no
# Railway renderizam por CPU com swangle. A mesma versão do Remotion do worker
# (worker/package.json), o Chrome Headless Shell e as bibliotecas de GL que o
# driver da NVIDIA do host completa (NVIDIA_DRIVER_CAPABILITIES=all inclui
# "graphics": o Chrome desenha com ANGLE sobre EGL/Vulkan na GPU).
# Contexto da construção: a pasta worker (ver .github/workflows/imagem-do-render3d.yml).
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg ca-certificates python3 python3-pip \
        libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
        libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 \
        libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
        libegl1 libgles2 libgl1 libvulkan1 \
    && rm -rf /var/lib/apt/lists/*

ENV NVIDIA_DRIVER_CAPABILITIES=all
ENV NVIDIA_VISIBLE_DEVICES=all

RUN pip3 install --no-cache-dir --break-system-packages "runpod>=1.6,<2"

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
RUN npx remotion browser ensure

COPY fontes ./fontes
COPY avancado/render3d/render-3d.mjs /app/render-3d.mjs
COPY avancado/render3d/handler.py /app/handler.py
RUN python3 -m py_compile /app/handler.py && node --check /app/render-3d.mjs

CMD ["python3", "-u", "/app/handler.py"]
