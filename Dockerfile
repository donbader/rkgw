FROM rust:1.93-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config gcc libc6-dev make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependencies by building them first
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && \
    mkdir -p src/bin && echo 'fn main() {}' > src/bin/probe_limits.rs && \
    cargo build --release --bin kiro-gateway && \
    rm -rf src

# Build the actual binary
COPY src/ src/
RUN touch src/main.rs && cargo build --release --bin kiro-gateway

# --- Runtime ---
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl unzip \
    && ARCH=$(dpkg --print-architecture) \
    && if [ "$ARCH" = "amd64" ]; then \
         KIRO_URL="https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-x86_64-linux.zip"; \
       elif [ "$ARCH" = "arm64" ]; then \
         KIRO_URL="https://desktop-release.q.us-east-1.amazonaws.com/latest/kirocli-aarch64-linux.zip"; \
       else \
         echo "Unsupported architecture: $ARCH" && exit 1; \
       fi \
    && curl -fsSL "$KIRO_URL" -o /tmp/kirocli.zip \
    && unzip -q /tmp/kirocli.zip -d /tmp/kirocli \
    && cp /tmp/kirocli/kirocli/bin/kiro-cli /usr/local/bin/kiro-cli \
    && chmod +x /usr/local/bin/kiro-cli \
    && rm -rf /tmp/kirocli.zip /tmp/kirocli \
    && apt-get purge -y unzip && apt-get autoremove -y \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/kiro-gateway /usr/local/bin/kiro-gateway
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN useradd --create-home --shell /bin/bash kiro
USER kiro
WORKDIR /home/kiro

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
