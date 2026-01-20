#!/usr/bin/env python
"""Run the recommender API server"""

import os
import sys

# Change to the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
sys.path.insert(0, script_dir)

print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path[:3]}")

import uvicorn

if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=False)
