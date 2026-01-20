import os
import pandas as pd
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from implicit.als import AlternatingLeastSquares
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://admin:admin@cluster0.yxdbxbx.mongodb.net/OrderUP')
client = MongoClient(MONGO_URI)
db = client['OrderUP']

def load_data_from_mongodb():
    """Load foods, orders, and users data from MongoDB"""
    
    # Load foods data
    foods_collection = db['foods']
    foods_data = list(foods_collection.find({}, {
        '_id': 1,
        'name': 1,
        'description': 1,
        'category': 1
    }))
    
    if not foods_data:
        print("Warning: No foods found in MongoDB")
        return None, None, None
    
    # Convert MongoDB _id to food_id
    foods_list = []
    for food in foods_data:
        # Keep original ObjectId string to avoid id mismatches with frontend
        food_id = str(food['_id'])
        foods_list.append({
            'food_id': food_id,
            'name': food.get('name', ''),
            'description': food.get('description', ''),
            'category': food.get('category', '')
        })
    
    foods = pd.DataFrame(foods_list)
    
    # Load orders data
    orders_collection = db['orders']
    orders_data = list(orders_collection.find({}, {
        'userId': 1,
        'items': 1,
        'date': 1
    }))
    
    interactions_list = []
    for order in orders_data:
        user_id = str(order.get('userId', ''))
        timestamp = order.get('date', pd.Timestamp.now())
        
        # Each item in the order is an interaction
        for item in order.get('items', []):
            food_id = str(item.get('_id', ''))
            
            interactions_list.append({
                'user_id': user_id,
                'food_id': food_id,
                'interaction': 1,
                'timestamp': timestamp
            })
    
    if not interactions_list:
        print("Warning: No orders found in MongoDB")
        interactions = pd.DataFrame({
            'user_id': [],
            'food_id': [],
            'interaction': [],
            'timestamp': []
        })
    else:
        interactions = pd.DataFrame(interactions_list)
    
    # Load users data (minimal - just for reference)
    users_collection = db['users']
    users_data = list(users_collection.find({}, {
        '_id': 1,
        'name': 1
    }))
    
    users_list = [{'user_id': str(u['_id']), 'name': u.get('name', '')} for u in users_data]
    users = pd.DataFrame(users_list) if users_list else pd.DataFrame({'user_id': [], 'name': []})
    
    return foods, interactions, users


# ---------Global variables for cached data------------

_foods = None
_interactions = None
_users = None
_user_map = None
_food_map = None
_inv_food_map = None
_matrix = None
_model = None
_tfidf_matrix = None
_cosine_sim = None
_data_loaded = False


def initialize_data():
    """Initialize recommendation data on first use"""
    global _foods, _interactions, _users, _data_loaded
    global _user_map, _food_map, _inv_food_map, _matrix, _model
    global _tfidf_matrix, _cosine_sim
    
    if _data_loaded:
        return
    
    print("Initializing recommendation data from MongoDB...")
    _foods, _interactions, _users = load_data_from_mongodb()

    if _foods is not None and _interactions is not None:
        _foods['food_id'] = _foods['food_id'].astype(str)
        _interactions['food_id'] = _interactions['food_id'].astype(str)
        _interactions['user_id'] = _interactions['user_id'].astype(str)
        
        # Initialize content-based filtering
        if not _foods.empty:
            _foods['features'] = (
                _foods['name'].fillna('') + " " +
                _foods['description'].fillna('')
            )
            tfidf = TfidfVectorizer(stop_words="english", max_features=100)
            _tfidf_matrix = tfidf.fit_transform(_foods['features'])
            _cosine_sim = cosine_similarity(_tfidf_matrix)
        
        # Initialize collaborative filtering
        if not _interactions.empty and len(_interactions) > 0:
            _user_map = {u: i for i, u in enumerate(_interactions['user_id'].unique())}
            _food_map = {f: i for i, f in enumerate(_interactions['food_id'].unique())}
            _inv_food_map = {v: k for k, v in _food_map.items()}

            _interactions['u_idx'] = _interactions['user_id'].map(_user_map)
            _interactions['f_idx'] = _interactions['food_id'].map(_food_map)

            _matrix = csr_matrix(
                (_interactions['interaction'],
                 (_interactions['u_idx'], _interactions['f_idx']))
            )

            _model = AlternatingLeastSquares(factors=50, iterations=20, random_state=42)
            _model.fit(_matrix * 10)
            print("Recommendation models trained successfully")
        else:
            _user_map = {}
            _food_map = {}
            _inv_food_map = {}
            _matrix = None
            _model = None
    else:
        print("Error: Could not load data from MongoDB")
        _foods = pd.DataFrame()
        _interactions = pd.DataFrame()
    
    _data_loaded = True


# ------------Content Based Filtering (TF-IDF + Cosine Similarity)------------

def cbf_recommend(food_id, top_n=5):
    """Content-based filtering recommendation"""
    global _foods, _cosine_sim
    
    if _foods is None or _foods.empty or _cosine_sim is None:
        return []
    
    if food_id not in _foods['food_id'].values:
        return []
    
    idx = _foods.index[_foods['food_id'] == food_id][0]
    scores = list(enumerate(_cosine_sim[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    return _foods.iloc[[i[0] for i in scores[1:top_n+1]]]['food_id'].astype(str).tolist()


# ------------Collaborative Filtering (ALS)------------

def cf_recommend(user_id, top_n=5):
    """Collaborative filtering recommendation"""
    global _user_map, _model, _matrix, _inv_food_map
    
    user_id = str(user_id)
    
    if _model is None or user_id not in _user_map:
        return []
    
    u_idx = _user_map[user_id]
    food_ids, _ = _model.recommend(u_idx, _matrix[u_idx])
    return [_inv_food_map[i] for i in food_ids[:top_n]]


# ------------Hybrid Recommendation (CF + CBF)------------

def hybrid_recommend(user_id, top_n=10):
    """Hybrid recommendation combining collaborative and content-based filtering"""
    global _interactions
    
    initialize_data()
    
    user_id = str(user_id)
    
    if _interactions is None or _interactions.empty:
        return []
    
    user_data = _interactions[_interactions['user_id'] == user_id]

    if user_data.empty:
        # If user is new, recommend most popular items
        return (
            _interactions['food_id']
            .value_counts()
            .head(top_n)
            .index
            .tolist()
        )

    cf_items = cf_recommend(user_id, top_n)
    last_food = user_data.sort_values("timestamp").iloc[-1]['food_id']
    cbf_items = cbf_recommend(last_food, top_n)

    combined = cf_items[:top_n//2] + cbf_items
    return list(dict.fromkeys(combined))[:top_n]
