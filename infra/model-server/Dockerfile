# NOT YET RUN. A self-hosted model server for the decision maker.
#
# llama.cpp's server is open source (MIT), speaks the OpenAI-style chat endpoint,
# and checks an API key itself, so no gateway has to be written or bought.
# The model is baked into the image so a cold start does not download it.
FROM ghcr.io/ggml-org/llama.cpp:server

# An open-weight model under the Apache-2.0 licence. Change both lines together.
ARG MODEL_URL=https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf
ADD --chmod=444 ${MODEL_URL} /models/model.gguf

ENV LLAMA_ARG_MODEL=/models/model.gguf \
    LLAMA_ARG_ALIAS=decider \
    LLAMA_ARG_HOST=0.0.0.0 \
    LLAMA_ARG_PORT=8080 \
    LLAMA_ARG_CTX_SIZE=4096 \
    LLAMA_ARG_N_PARALLEL=1

# LLAMA_API_KEY is supplied at run time from the cloud's secret store. Never bake it in.
EXPOSE 8080
