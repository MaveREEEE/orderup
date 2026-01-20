from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from recommender import hybrid_recommend, load_data_from_mongodb, initialize_data

app = FastAPI(title="OrderUP Recommender API", version="2.0")

# Allow CORS for local frontend, Netlify, and Cloudflare Pages
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
        "version": "2.0",
        "data_source": "MongoDB"
    }

@app.get("/recommend/{user_id}")
def recommend(user_id: str, top_n: int = 10):
    """Get recommendations for a user"""
    try:
        if not user_id or user_id.strip() == "":
            raise HTTPException(status_code=400, detail="User ID cannot be empty")
        
        recommendations = hybrid_recommend(user_id, top_n=top_n)
        
        return {
            "user_id": user_id,
            "recommendations": recommendations,
            "count": len(recommendations)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reload-data")
def reload_data():
    """Reload recommendation data from MongoDB"""
    try:
        import recommender
        recommender._data_loaded = False
        initialize_data()
        
        foods = recommender._foods
        interactions = recommender._interactions
        users = recommender._users
        
        if foods is None or interactions is None:
            raise HTTPException(status_code=500, detail="Failed to load data from MongoDB")
        
        return {
            "status": "success",
            "message": "Data reloaded successfully",
            "foods_count": len(foods),
            "interactions_count": len(interactions),
            "users_count": len(users) if users is not None else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reloading data: {str(e)}")

