from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from implicit.als import AlternatingLeastSquares


# ---------Load data------------

data_dir = Path(__file__).parent / "datasets"

foods = pd.read_csv(data_dir / "foods.csv")
interactions = pd.read_csv(data_dir / "orders.csv")
users = pd.read_csv(data_dir / "users.csv")

foods['food_id'] = foods['food_id'].astype(int)
interactions['food_id'] = interactions['food_id'].astype(int)
interactions['user_id'] = interactions['user_id'].astype(str)


# ------------Content Based------------

foods['features'] = (
    foods['name'] + " " +
    foods['description'] + " " +
    foods['category']
)

tfidf = TfidfVectorizer(stop_words="english")
tfidf_matrix = tfidf.fit_transform(foods['features'])
cosine_sim = cosine_similarity(tfidf_matrix)

def cbf_recommend(food_id, top_n=5):
    if food_id not in foods['food_id'].values:
        return []
    idx = foods.index[foods['food_id'] == food_id][0]
    scores = list(enumerate(cosine_sim[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    return foods.iloc[[i[0] for i in scores[1:top_n+1]]]['food_id'].astype(int).tolist()

# ------------Collaborative------------

user_map = {u:i for i,u in enumerate(interactions['user_id'].unique())}
food_map = {f:i for i,f in enumerate(interactions['food_id'].unique())}
inv_food_map = {v:k for k,v in food_map.items()}

interactions['u_idx'] = interactions['user_id'].map(user_map)
interactions['f_idx'] = interactions['food_id'].map(food_map)

matrix = csr_matrix(
    (interactions['interaction'],
     (interactions['u_idx'], interactions['f_idx']))
)

model = AlternatingLeastSquares(factors=50, iterations=20)
model.fit(matrix * 10)

def cf_recommend(user_id, top_n=5):
    user_id = str(user_id)
    if user_id not in user_map:
        return []
    u_idx = user_map[user_id]
    food_ids, _ = model.recommend(u_idx, matrix[u_idx])
    return [int(inv_food_map[i]) for i in food_ids[:top_n]]


# ------------Hybrid------------

def hybrid_recommend(user_id, top_n=10):
    user_id = str(user_id)
    user_data = interactions[interactions['user_id'] == user_id]

    if user_data.empty:
        return (
            interactions['food_id']
            .value_counts()
            .head(top_n)
            .index
            .astype(int)
            .tolist()
        )

    cf_items = cf_recommend(user_id, top_n)
    last_food = user_data.sort_values("timestamp").iloc[-1]['food_id']
    cbf_items = cbf_recommend(last_food, top_n)

    combined = cf_items[:top_n//2] + cbf_items
    return list(dict.fromkeys(combined))[:top_n]
