#!/usr/bin/env python
"""Test the recommender system locally"""

import sys
print("Python path:", sys.path)
print("Current working directory:", __import__('os').getcwd())

# Test imports
try:
    from recommender import hybrid_recommend, initialize_data
    print("✓ Recommender module imported successfully")
except Exception as e:
    print(f"✗ Error importing recommender: {e}")
    sys.exit(1)

# Initialize data
try:
    initialize_data()
    print("✓ Data initialized successfully from MongoDB")
except Exception as e:
    print(f"✗ Error initializing data: {e}")
    sys.exit(1)

# Test recommendation for a sample user
try:
    # Using a test user ID (this will likely return most popular items since it's a new user)
    test_user_id = "test_user_123"
    recommendations = hybrid_recommend(test_user_id, top_n=5)
    print(f"✓ Got recommendations for test user: {recommendations}")
except Exception as e:
    print(f"✗ Error getting recommendations: {e}")
    sys.exit(1)

print("\nAll tests passed! The recommender is working correctly.")
