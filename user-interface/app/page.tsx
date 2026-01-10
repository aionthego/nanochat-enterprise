"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Job = {
  id: string;
  name: string;
  status: string;
  start_time: number;
  return_code: number | null;
  command: string;
  log_file: string;
  recent_logs?: string;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    }
  };

  const fetchJobStatus = async (jobId: string) => {
    try {
      const res = await fetch(`${API_URL}/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        // Update job in list or select it
        setSelectedJob(data);
      }
    } catch (error) {
      console.error("Failed to fetch job status", error);
    }
  };

  const triggerJob = async (endpoint: string, name: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: "POST" });
      if (res.ok) {
        await fetchJobs();
      } else {
        alert("Failed to start job");
      }
    } catch (error) {
      console.error("Failed to trigger job", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Nanochat Enterprise
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Actions Panel */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Actions</h2>
            <div className="space-y-3">
              <ActionButton
                label="Setup Dataset"
                onClick={() => triggerJob("/jobs/setup", "Setup")}
                loading={loading}
              />
              <ActionButton
                label="Train Tokenizer"
                onClick={() => triggerJob("/jobs/tokenizer", "Tokenizer")}
                loading={loading}
              />
              <ActionButton
                label="Pretrain Base Model"
                onClick={() => triggerJob("/jobs/pretrain", "Pretrain")}
                loading={loading}
              />
              <ActionButton
                label="Mid-Training"
                onClick={() => triggerJob("/jobs/midtrain", "Midtrain")}
                loading={loading}
              />
              <ActionButton
                label="Supervised Fine-Tuning"
                onClick={() => triggerJob("/jobs/sft", "SFT")}
                loading={loading}
              />
            </div>
          </div>

          {/* Jobs List */}
          <div className="md:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-300">Recent Jobs</h2>
              <button
                onClick={fetchJobs}
                className="text-sm text-gray-400 hover:text-white"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-500">
                        No jobs found.
                      </td>
                    </tr>
                  ) : (
                    jobs.slice().reverse().map((job) => (
                      <tr key={job.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="py-3 font-medium text-blue-300">{job.name}</td>
                        <td className="py-3">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="py-3 text-xs text-gray-500 font-mono">
                          {job.id.substring(0, 8)}...
                        </td>
                        <td className="py-3 text-sm text-gray-400">
                          {new Date(job.start_time * 1000).toLocaleTimeString()}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => fetchJobStatus(job.id)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            View Logs
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Job Detail / Logs Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-lg">
                  Job: {selectedJob.name} <span className="text-gray-500 text-sm">({selectedJob.id})</span>
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1 bg-black font-mono text-xs text-green-400 whitespace-pre-wrap">
                {selectedJob.recent_logs || "No logs available."}
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => fetchJobStatus(selectedJob.id)}
                  className="mr-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                >
                  Refresh Logs
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ActionButton({ label, onClick, loading }: { label: string, onClick: () => void, loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full text-left px-4 py-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600 hover:border-blue-500 flex justify-between items-center group"
    >
      <span className="font-medium group-hover:text-blue-300 transition-colors">{label}</span>
      {loading ? (
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
      ) : (
        <span className="text-gray-500 group-hover:text-white">→</span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: "bg-yellow-900/50 text-yellow-200 border-yellow-700",
    completed: "bg-green-900/50 text-green-200 border-green-700",
    failed: "bg-red-900/50 text-red-200 border-red-700",
  };

  const className = colors[status] || "bg-gray-800 text-gray-400 border-gray-600";

  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${className} capitalize`}>
      {status}
    </span>
  );
}
