#!/usr/bin/env python
"""Simple test server for the recommender API"""

import os
import sys

# Setup paths
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
sys.path.insert(0, script_dir)

from api import app
import uvicorn

if __name__ == "__main__":
    print(f"Starting API server on http://127.0.0.1:8000")
    print(f"Working directory: {os.getcwd()}")
    print("\nTest endpoints:")
    print("  Health: GET http://127.0.0.1:8000/")
    print("  Recommend: GET http://127.0.0.1:8000/recommend/test_user_id")
    print("  Reload: POST http://127.0.0.1:8000/reload-data")
    print("\nPress Ctrl+C to stop the server")
    
    # Run the server
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
