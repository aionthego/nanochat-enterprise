import subprocess
import uuid
import time
import os
import signal
from typing import Dict, Optional, List
from .config import settings

class Job:
    def __init__(self, command: List[str], name: str):
        self.id = str(uuid.uuid4())
        self.name = name
        self.command = command
        self.start_time = time.time()
        self.status = "running"
        self.process: Optional[subprocess.Popen] = None
        self.return_code: Optional[int] = None
        self.log_file = os.path.join(settings.NANOCHAT_BASE_DIR, f"{self.name}_{self.id}.log")

class JobManager:
    def __init__(self):
        self.jobs: Dict[str, Job] = {}

    def submit_job(self, command: List[str], name: str) -> str:
        # Ensure base directory exists
        os.makedirs(settings.NANOCHAT_BASE_DIR, exist_ok=True)
        
        job = Job(command, name)
        
        with open(job.log_file, "w") as f:
            # We start the process detached/independent so it survives if the server restarts? 
            # Ideally for this simple version we keep it as a child. 
            # But subprocess.Popen is fine.
            job.process = subprocess.Popen(
                command,
                stdout=f,
                stderr=subprocess.STDOUT,
                cwd=os.getcwd(), # Run in project root
                # Actually speedrun.sh runs python -m scripts... from the repo root.
                # So CWD should be the repo root.
                # But NANOCHAT_BASE_DIR is where logs go.
            )
        
        self.jobs[job.id] = job
        return job.id

    def get_job(self, job_id: str) -> Optional[dict]:
        job = self.jobs.get(job_id)
        if not job:
            return None
            
        # Update status if process finished
        if job.status == "running" and job.process:
            ret = job.process.poll()
            if ret is not None:
                job.return_code = ret
                job.status = "completed" if ret == 0 else "failed"
        
        return {
            "id": job.id,
            "name": job.name,
            "status": job.status,
            "start_time": job.start_time,
            "return_code": job.return_code,
            "command": " ".join(job.command),
            "log_file": job.log_file
        }

    def list_jobs(self):
        return [self.get_job(jid) for jid in self.jobs]

# Singleton
job_manager = JobManager()
