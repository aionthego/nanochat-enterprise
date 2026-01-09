import os

class Settings:
    def __init__(self):
        self.NANOCHAT_BASE_DIR = os.environ.get("NANOCHAT_BASE_DIR", os.path.expanduser("~/.cache/nanochat"))
        self.WANDB_RUN = os.environ.get("WANDB_RUN", "dummy")
        self.NPROC_PER_NODE = int(os.environ.get("NPROC_PER_NODE", "8"))
        
settings = Settings()
