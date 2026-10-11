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
        libegl1 libgles2 libgl1 libvulkan1 libglvnd0 \
        libgtk-3-0 libxshmfence1 libxss1 libx11-xcb1 \
    && rm -rf /var/lib/apt/lists/*

ENV NVIDIA_DRIVER_CAPABILITIES=all
ENV NVIDIA_VISIBLE_DEVICES=all

# O libglvnd e o carregador da Vulkan só acham o driver da NVIDIA (que o host monta
# com a capacidade "graphics") por estes dois arquivos; a imagem base não os traz.
RUN mkdir -p /usr/share/glvnd/egl_vendor.d /usr/share/vulkan/icd.d \
    && printf '{"file_format_version":"1.0.0","ICD":{"library_path":"libEGL_nvidia.so.0"}}\n' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json \
    && printf '{"file_format_version":"1.0.0","ICD":{"library_path":"libGLX_nvidia.so.0","api_version":"1.3"}}\n' > /usr/share/vulkan/icd.d/nvidia_icd.json

RUN pip3 install --no-cache-dir --break-system-packages "runpod>=1.6,<2"

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
RUN npx remotion browser ensure
# No Linux o headless shell não desenha na GPU: o Chrome for Testing sim (gl "angle-egl+cft").
RUN npx remotion browser ensure --chrome-mode=chrome-for-testing
# Invólucros que desligam a decodificação de vídeo por hardware (o <Video> do @remotion/media
# travou extraindo quadros com a GPU à vista): o mesmo navegador, mais uma opção no fim.
RUN set -e; \
    cft=$(find /app/node_modules/.remotion -type f -name chrome -perm -u+x | head -1); \
    hs=$(find /app/node_modules/.remotion -type f -name chrome-headless-shell -perm -u+x | head -1); \
    test -n "$cft" && test -n "$hs"; \
    printf '#!/bin/sh\nexec "%s" "$@" --disable-accelerated-video-decode\n' "$cft" > /app/chrome-cft-sem-hw; \
    printf '#!/bin/sh\nexec "%s" "$@" --disable-accelerated-video-decode\n' "$hs" > /app/chrome-hs-sem-hw; \
    chmod +x /app/chrome-cft-sem-hw /app/chrome-hs-sem-hw; cat /app/chrome-cft-sem-hw

COPY fontes ./fontes
COPY avancado/render3d/render-3d.mjs /app/render-3d.mjs
COPY avancado/render3d/handler.py /app/handler.py
RUN python3 -m py_compile /app/handler.py && node --check /app/render-3d.mjs

CMD ["python3", "-u", "/app/handler.py"]
