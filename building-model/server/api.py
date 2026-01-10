import sys
from fastapi import APIRouter, HTTPException
from .manager import job_manager
from .config import settings

router = APIRouter()

@router.post("/jobs/setup")
def setup_job():
    """
    Download the dataset: python -m nanochat.dataset -n 8
    (Note: speedrun.sh does a background download of 240 shards too, we'll keep it simple for now and just do the foreground one or both)
    """
    # Just the foreground one for now to ensure it works
    cmd = [sys.executable, "-m", "nanochat.dataset", "-n", "8"]
    job_id = job_manager.submit_job(cmd, "dataset_setup")
    return {"job_id": job_id, "status": "submitted"}

@router.post("/jobs/tokenizer")
def train_tokenizer():
    """
    Train tokenizer: python -m scripts.tok_train ...
    """
    cmd = [
        sys.executable, "-m", "scripts.tok_train", 
        "--max_chars=2000000000", 
        "--vocab_size=65536"
    ]
    job_id = job_manager.submit_job(cmd, "tokenizer_train")
    return {"job_id": job_id, "status": "submitted"}

@router.post("/jobs/pretrain")
def run_pretrain(wandb_run: str = "dummy"):
    """
    Base model pretraining: torchrun ...
    """
    # Check if torchrun is in path or use [sys.executable, "-m", "torch.distributed.run"] ?
    # speedrun.sh uses `torchrun`. We'll try to find it or standard python -m torch.distributed.launch
    # But let's assume `torchrun` is on path since speedrun.sh assumes it.
    # To be safer we can use sys.executable -m torch.distributed.run
    cmd = [
        "torchrun", 
        "--standalone", 
        f"--nproc_per_node={settings.NPROC_PER_NODE}",
        "-m", "scripts.base_train", 
        "--", 
        "--depth=20", 
        "--target_param_data_ratio=20", 
        f"--run={wandb_run}"
    ]
    job_id = job_manager.submit_job(cmd, "base_train")
    return {"job_id": job_id, "status": "submitted"}

@router.post("/jobs/midtrain")
def run_midtrain(wandb_run: str = "dummy"):
    cmd = [
        "torchrun",
        "--standalone",
        f"--nproc_per_node={settings.NPROC_PER_NODE}",
        "-m", "scripts.mid_train",
        "--",
        f"--run={wandb_run}"
    ]
    job_id = job_manager.submit_job(cmd, "mid_train")
    return {"job_id": job_id, "status": "submitted"}

@router.post("/jobs/sft")
def run_sft(wandb_run: str = "dummy"):
    cmd = [
        "torchrun",
        "--standalone",
        f"--nproc_per_node={settings.NPROC_PER_NODE}",
        "-m", "scripts.chat_sft",
        "--",
        f"--run={wandb_run}"
    ]
    job_id = job_manager.submit_job(cmd, "sft_train")
    return {"job_id": job_id, "status": "submitted"}

@router.get("/jobs/{job_id}")
def get_job_status(job_id: str):
    info = job_manager.get_job(job_id)
    if not info:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Read last few lines of log?
    log_content = ""
    if os.path.exists(info['log_file']):
        try:
            with open(info['log_file'], "r") as f:
                # Read last 1000 chars roughly
                f.seek(0, 2)
                size = f.tell()
                f.seek(max(size - 2000, 0))
                log_content = f.read()
        except:
            log_content = "Could not read log file."
            
    return {**info, "recent_logs": log_content}

@router.get("/jobs")
def list_jobs():
    return job_manager.list_jobs()
