# NOT YET RUN. A self-hosted model server for the decision maker.
#
# llama.cpp's server is open source (MIT), speaks the OpenAI-style chat endpoint,
# and checks an API key itself, so no gateway has to be written or bought.
# The model is baked into the image so a cold start does not download it.
FROM ghcr.io/ggml-org/llama.cpp:server

# Phi-3.5 mini Instruct, 4-bit, MIT licence: the smallest model that passed the decision maker's calibration
# (8 of 8; see factory/decision-maker/README.md). Change the model only after re-running calibrate.mjs.
ARG MODEL_URL=https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf
ADD --chmod=444 ${MODEL_URL} /models/model.gguf

ENV LLAMA_ARG_MODEL=/models/model.gguf \
    LLAMA_ARG_ALIAS=decider \
    LLAMA_ARG_HOST=0.0.0.0 \
    LLAMA_ARG_PORT=8080 \
    LLAMA_ARG_CTX_SIZE=4096 \
    LLAMA_ARG_N_PARALLEL=1

# LLAMA_API_KEY is supplied at run time from the cloud's secret store. Never bake it in.
EXPOSE 8080
