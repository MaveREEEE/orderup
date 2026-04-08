from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from recommender import HybridRecommender

app = FastAPI(title="OrderUP Recommender API", version="2.0")

# Global recommender instance
recommender = HybridRecommender()

# Allow CORS for local frontend and Cloudflare Pages
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    "https://localhost",
    "https://localhost:5173",
    "https://orderup-7v2.pages.dev",
    "https://orderup-admin.pages.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "OrderUP Recommender API is running",
        "version": "2.0 Enhanced",
        "data_source": "MongoDB",
        "features": [
            "Collaborative Filtering (ALS)",
            "Content-Based Filtering (TF-IDF)",
            "Hybrid Recommendation",
            "Survey-based recommendations",
            "Price-aware recommendations"
        ]
    }

@app.get("/recommend/{user_id}")
def recommend(user_id: str, top_n: int = 10):
    """Get recommendations for a user based on preferences and allergens"""
    try:
        if not user_id or user_id.strip() == "":
            raise HTTPException(status_code=400, detail="User ID cannot be empty")
        
        # Try to get user preferences from database
        from pymongo import MongoClient
        from bson import ObjectId
        import os
        mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://admin:admin@cluster0.yxdbxbx.mongodb.net/OrderUP")
        client = MongoClient(mongo_uri)
        db = client["OrderUP"]
        
        # Try to find user by ObjectId first, then by string ID
        user = None
        try:
            user = db["users"].find_one({"_id": ObjectId(user_id)})
        except:
            user = db["users"].find_one({"_id": user_id})
        
        preferences = ""
        allergens = []
        
        if user:
            preferences = user.get("foodPreferences", "")
            allergens = user.get("allergens", [])
        
        # Use preference-based hybrid recommendation
        recommendations = recommender.hybrid_recommend_with_preferences(
            user_id=user_id,
            preferences_text=preferences,
            allergens=allergens,
            top_n=top_n
        )
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "count": len(recommendations),
            "used_preferences": bool(preferences or allergens)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/survey")
def recommend_by_survey(survey_text: str, top_n: int = 10):
    """Get recommendations based on user preferences/survey text"""
    try:
        if not survey_text or survey_text.strip() == "":
            raise HTTPException(status_code=400, detail="Survey text cannot be empty")
        
        recommendations = recommender.hybrid_recommend(
            survey_text=survey_text,
            top_n=top_n
        )
        
        return {
            "recommendations": recommendations,
            "count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reload-data")
def reload_data():
    """Reload recommendation data from MongoDB"""
    try:
        global recommender
        recommender = HybridRecommender()
        recommender.initialize()
        
        return {
            "status": "success",
            "message": "Data reloaded successfully",
            "foods_count": len(recommender.foods) if recommender.foods is not None else 0,
            "interactions_count": len(recommender.interactions) if recommender.interactions is not None else 0,
            "users_count": len(recommender.users) if recommender.users is not None else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reloading data: {str(e)}")

@app.get("/evaluate")
def evaluate_model(k: int = 10):
    """Evaluate recommendation model performance"""
    try:
        metrics = recommender.evaluate(k=k)
        
        return {
            "status": "success",
            "k": k,
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating model: {str(e)}")

