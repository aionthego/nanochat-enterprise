FROM nvidia/cuda:12.4.0-devel-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NANOCHAT_BASE_DIR=/data \
    UV_SYSTEM_PYTHON=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy dependency files first for caching
COPY pyproject.toml uv.lock ./

# Install dependencies
# We use --system to install into the system python environment inside the container
# or we can let uv manage a venv. Since it's a container, system is fine often, 
# but uv recommends venvs. Let's use uv's default behavior which creates a .venv.
# However, we need to make sure the PATH includes it.
RUN uv sync --extra gpu --frozen

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 8000

# Update PATH to include the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Command to run the application
CMD ["uv", "run", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
