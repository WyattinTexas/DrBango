#!/usr/bin/env python3
"""
Watchroom — Live Spectator View for Corkscrew Agents

Watch the refiner and other agents work in real-time.
Tails log files and shows a live feed of what's happening.

Usage:
  python server.py
  # Open http://localhost:5557
"""

import os
import glob
import json
from datetime import datetime
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder=".", static_url_path="")

LOGS_DIR = os.path.expanduser("~/corkscrew-agents/logs")
REFINER_OUTPUT_PATTERN = "/private/tmp/claude-501/-Users-drbango/*/tasks/*.output"


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/status")
def status():
    """Get current refiner status — latest log entries and activity."""
    result = {
        "active_refiners": [],
        "log_entries": [],
        "last_update": datetime.now().isoformat(),
    }

    # Find all refiner logs, sorted newest first
    log_files = sorted(glob.glob(os.path.join(LOGS_DIR, "refiner-*.log")), reverse=True)

    for log_path in log_files[:3]:  # Last 3 sessions max
        filename = os.path.basename(log_path)
        # Parse target and timestamp from filename: refiner-testroom-20260408-232122.log
        parts = filename.replace("refiner-", "").replace(".log", "").rsplit("-", 2)
        target = parts[0] if parts else "unknown"

        # Check if file was modified recently (active if < 5 min ago)
        mtime = os.path.getmtime(log_path)
        age_secs = (datetime.now().timestamp() - mtime)
        is_active = age_secs < 300  # 5 minutes

        try:
            with open(log_path) as f:
                content = f.read()
        except:
            content = ""

        # Parse entries
        entries = []
        current_entry = None
        for line in content.strip().split("\n"):
            if line.startswith("--- Cycle"):
                if current_entry:
                    entries.append(current_entry)
                # Extract cycle number and time
                cycle_info = line.strip("- []")
                current_entry = {
                    "header": line.strip(),
                    "summary": "",
                    "target": target,
                }
            elif line.startswith("IMPROVED:") and current_entry:
                current_entry["summary"] = line.replace("IMPROVED:", "").strip()

        if current_entry:
            entries.append(current_entry)

        if is_active:
            result["active_refiners"].append({
                "target": target,
                "cycles": len(entries),
                "file": filename,
                "age_secs": int(age_secs),
            })

        for entry in entries:
            result["log_entries"].append(entry)

    # Also try to read the raw refiner output for richer detail
    output_files = sorted(glob.glob(REFINER_OUTPUT_PATTERN), key=os.path.getmtime, reverse=True)
    raw_lines = []
    for ofile in output_files[:1]:
        try:
            with open(ofile) as f:
                # Read last 5000 chars
                f.seek(0, 2)
                size = f.tell()
                f.seek(max(0, size - 5000))
                tail = f.read()
                # Extract readable lines (skip JSON blobs)
                for line in tail.split("\n"):
                    line = line.strip()
                    if line and not line.startswith("{") and not line.startswith("[") and len(line) < 500:
                        raw_lines.append(line)
        except:
            pass

    result["raw_output"] = raw_lines[-30:]  # Last 30 readable lines

    return jsonify(result)


if __name__ == "__main__":
    print("\n  Watchroom — http://localhost:5557\n")
    app.run(host="127.0.0.1", port=5557, debug=False, threaded=True)
