import json
import os
import time
from threading import Lock

class ProgressTracker:
    def __init__(self, storage_file="progress.json"):
        self.storage_file = storage_file
        self.lock = Lock()
        self.tasks = {}
        self.load_progress()

    def load_progress(self):
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, 'r', encoding='utf-8') as f:
                    self.tasks = json.load(f)
            except Exception as e:
                print(f"Error loading progress: {e}")
                self.tasks = {}

    def save_progress(self):
        with self.lock:
            try:
                with open(self.storage_file, 'w', encoding='utf-8') as f:
                    json.dump(self.tasks, f, indent=2)
            except Exception as e:
                print(f"Error saving progress: {e}")

    def init_task(self, task_id, total_items):
        with self.lock:
            self.tasks[task_id] = {
                "total_items": total_items,
                "processed_items": 0,
                "status": "running", # running, paused, completed, error
                "start_time": time.time(),
                "last_updated": time.time(),
                "current_index": 0 
            }
        self.save_progress()

    def update_progress(self, task_id, processed_count, current_index=None):
        with self.lock:
            if task_id in self.tasks:
                self.tasks[task_id]["processed_items"] = processed_count
                if current_index is not None:
                    self.tasks[task_id]["current_index"] = current_index
                self.tasks[task_id]["last_updated"] = time.time()
        self.save_progress()

    def update_status(self, task_id, status):
        with self.lock:
            if task_id in self.tasks:
                self.tasks[task_id]["status"] = status
                self.tasks[task_id]["last_updated"] = time.time()
        self.save_progress()

    def get_task(self, task_id):
        return self.tasks.get(task_id)

    def get_status(self, task_id):
        task = self.tasks.get(task_id)
        return task["status"] if task else None

# Global instance
progress_tracker = ProgressTracker()
