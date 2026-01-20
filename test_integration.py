#!/usr/bin/env python
"""
Test script to verify the recommender works end-to-end with frontend
"""

import os
import sys
import subprocess
import time

script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print("=" * 60)
print("RECOMMENDER SYSTEM - FRONTEND INTEGRATION TEST")
print("=" * 60)

# Test 1: Check recommender API
print("\n[1/3] Testing Recommender API...")
try:
    sys.path.insert(0, "backend/Recommender")
    from recommender import hybrid_recommend, initialize_data
    initialize_data()
    print("✓ Recommender initialized successfully")
    
    # Test with a sample user
    test_recs = hybrid_recommend("test_user_123", top_n=5)
    print(f"✓ Generated sample recommendations: {test_recs}")
except Exception as e:
    print(f"✗ Recommender API error: {e}")
    sys.exit(1)

# Test 2: Check frontend environment
print("\n[2/3] Checking Frontend Setup...")
frontend_env = "frontend/.env.production"
if os.path.exists(frontend_env):
    print(f"✓ Frontend config found: {frontend_env}")
else:
    print("⚠ Frontend .env.production not found (will use defaults)")

recommender_utils = "frontend/src/utils/recommendationUtils.js"
if os.path.exists(recommender_utils):
    print(f"✓ Recommender utilities created: {recommender_utils}")
else:
    print(f"✗ Recommender utilities missing: {recommender_utils}")

recommendations_component = "frontend/src/components/Recommendations/Recommendations.jsx"
if os.path.exists(recommendations_component):
    print(f"✓ Recommendations component created: {recommendations_component}")
else:
    print(f"✗ Recommendations component missing: {recommendations_component}")

# Test 3: Check Home page integration
print("\n[3/3] Checking Home Page Integration...")
home_page = "frontend/src/pages/Home/Home.jsx"
try:
    with open(home_page, 'r') as f:
        content = f.read()
        if "Recommendations" in content:
            print(f"✓ Recommendations integrated into Home page")
        else:
            print(f"✗ Recommendations not found in Home page")
except Exception as e:
    print(f"✗ Error checking Home page: {e}")

print("\n" + "=" * 60)
print("SETUP COMPLETE!")
print("=" * 60)

print("\n📝 Next Steps:")
print("1. Make sure MongoDB is running")
print("2. Start the recommender API:")
print("   cd backend/Recommender")
print("   python run_server.py")
print("3. Start the frontend:")
print("   cd frontend")
print("   npm run dev")
print("4. Visit http://localhost:5173 (or your frontend port)")
print("5. Log in and check the recommendations section")

print("\n🔧 Configuration:")
print("- Frontend recommender URL: http://127.0.0.1:8000")
print("- Update in .env files if running on different host/port")
