from fastapi import FastAPI
from recommender import hybrid_recommend

app = FastAPI()

@app.get("/recommend/{user_id}")
def recommend(user_id: str):
    return {
        "user_id": user_id,
        "recommendations": hybrid_recommend(user_id)
    }
