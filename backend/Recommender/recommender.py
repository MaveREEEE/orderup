# recommender.py - Enhanced Hybrid Recommender System

import os
import numpy as np
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from scipy.sparse import csr_matrix
from implicit.als import AlternatingLeastSquares


class HybridRecommender:

    def __init__(self):
        load_dotenv()
        mongo_uri = os.getenv(
            "MONGO_URI",
            "mongodb+srv://admin:admin@cluster0.yxdbxbx.mongodb.net/OrderUP"
        )
        self.client = MongoClient(mongo_uri)
        self.db = self.client["OrderUP"]

        self.foods = None
        self.interactions = None
        self.users = None

        self.user_map = {}
        self.food_map = {}
        self.inv_food_map = {}

        self.tfidf = None
        self.tfidf_matrix = None
        self.cosine_sim = None

        self.cf_matrix = None
        self.cf_model = None

        self.data_loaded = False

    def load_data(self):
        foods_raw = list(self.db["foods"].find({}, {
            "_id": 1, "name": 1, "description": 1,
            "category": 1, "price": 1, "allergens": 1
        }))

        self.foods = pd.DataFrame([{
            "food_id": str(f["_id"]),
            "name": f.get("name", ""),
            "description": f.get("description", ""),
            "category": f.get("category", ""),
            "price": f.get("price", 0),
            "allergens": f.get("allergens", [])
        } for f in foods_raw])

        orders_raw = list(self.db["orders"].find({}, {
            "userId": 1, "items": 1, "date": 1
        }))

        interactions = []
        for order in orders_raw:
            user_id = str(order.get("userId"))
            for item in order.get("items", []):
                interactions.append({
                    "user_id": user_id,
                    "food_id": str(item.get("_id")),
                    "interaction": 1
                })

        self.interactions = pd.DataFrame(interactions)

        users_raw = list(self.db["users"].find({}, {"_id": 1}))
        self.users = pd.DataFrame([{
            "user_id": str(u["_id"])
        } for u in users_raw])

    def build_content_features(self):
        def safe_str(x):
            if isinstance(x, list):
                return " ".join(map(str, x))
            if pd.isna(x):
                return ""
            return str(x)

        def price_bucket(p):
            try:
                p = float(p)
                if p < 150:
                    return "cheap"
                elif p < 300:
                    return "mid_price"
                return "expensive"
            except:
                return ""

        self.foods["features"] = (
            self.foods["name"].apply(safe_str) + " " +
            self.foods["description"].apply(safe_str) + " " +
            self.foods["category"].apply(safe_str) + " " +
            self.foods["category"].apply(safe_str) + " " +
            self.foods["allergens"].apply(safe_str) + " " +
            self.foods["price"].apply(price_bucket)
        )

        self.tfidf = TfidfVectorizer(
            stop_words="english",
            max_features=1000,
            ngram_range=(1, 2)
        )

        self.tfidf_matrix = self.tfidf.fit_transform(self.foods["features"])
        self.cosine_sim = cosine_similarity(self.tfidf_matrix)

    def build_cf_model(self):
        if self.interactions.empty:
            return

        self.user_map = {
            u: i for i, u in enumerate(self.interactions["user_id"].unique())
        }
        self.food_map = {
            f: i for i, f in enumerate(self.interactions["food_id"].unique())
        }
        self.inv_food_map = {i: f for f, i in self.food_map.items()}

        self.interactions["u_idx"] = self.interactions["user_id"].map(self.user_map)
        self.interactions["f_idx"] = self.interactions["food_id"].map(self.food_map)

        self.cf_matrix = csr_matrix((
            self.interactions["interaction"],
            (self.interactions["u_idx"], self.interactions["f_idx"])
        ))

        self.cf_model = AlternatingLeastSquares(
            factors=64,
            iterations=50,
            regularization=0.05,
            random_state=42
        )

        self.cf_model.fit(self.cf_matrix * 10)

    def initialize(self):
        if self.data_loaded:
            return

        print("Initializing recommendation data from MongoDB...")
        self.load_data()

        if self.foods.empty:
            raise ValueError("No food data available.")

        self.build_content_features()
        self.build_cf_model()

        self.data_loaded = True
        print("Recommendation models trained successfully")

    # ---------------------CONTENT-BASED----------------

    def cbf_from_food(self, food_id, top_n=10):
        if food_id not in self.foods["food_id"].values:
            return []

        idx = self.foods.index[
            self.foods["food_id"] == food_id
        ][0]

        sims = list(enumerate(self.cosine_sim[idx]))
        sims = sorted(sims, key=lambda x: x[1], reverse=True)

        return self.foods.iloc[
            [i for i, _ in sims[1:top_n + 1]]
        ]["food_id"].tolist()

    def cbf_from_preferences(self, preferences_text, allergens=None, top_n=10):
        """Content-based filtering based on user preferences and allergens"""
        if not preferences_text or not self.foods is not None or self.foods.empty:
            return []
        
        allergens = allergens or []
        allergens = [str(a).lower() for a in allergens] if allergens else []
        
        # Filter out foods with allergens
        available_foods = self.foods.copy()
        
        if allergens:
            # Filter foods that contain any allergen
            available_foods = available_foods[~available_foods['allergens'].apply(
                lambda x: any(allergen in str(x).lower() for allergen in allergens)
            )]
        
        if available_foods.empty:
            return []
        
        # Get indices of available foods
        available_indices = available_foods.index.tolist()
        
        # Use TF-IDF to match preferences against available foods
        pref_vec = self.tfidf.transform([preferences_text])
        
        # Calculate similarity only for available foods
        sims = cosine_similarity(pref_vec, self.tfidf_matrix)[0]
        sims_available = [(i, sims[i]) for i in available_indices]
        
        # Sort by similarity
        sims_available = sorted(sims_available, key=lambda x: x[1], reverse=True)
        
        # Return top N food IDs
        return self.foods.iloc[
            [i for i, _ in sims_available[:top_n]]
        ]["food_id"].tolist()

    # ------------ COLLABORATIVE FILTERING--------------

    def cf_recommend(self, user_id, top_n=10):
        if user_id not in self.user_map:
            return []

        u_idx = self.user_map[user_id]
        items, _ = self.cf_model.recommend(
            u_idx,
            self.cf_matrix[u_idx],
            N=top_n
        )

        return [self.inv_food_map[i] for i in items]

    def hybrid_recommend(self, user_id, top_n=10):
        """Hybrid collaborative + content-based recommendation for existing users."""
        self.initialize()

        user_id = str(user_id)
        user_hist = list(
            self.interactions[
                self.interactions["user_id"] == user_id
            ]["food_id"]
        )

        if not user_hist:
            popular = self.interactions["food_id"].value_counts().index.tolist()
            return popular[:top_n]

        cf_items = self.cf_recommend(user_id, top_n * 2)
        cbf_items = []

        for food in user_hist[-3:]:
            cbf_items.extend(self.cbf_from_food(food, top_n=5))

        scaler = MinMaxScaler()

        cf_scores = [1 / (i + 1) for i in range(len(cf_items))]
        cbf_scores = [1 / (i + 1) for i in range(len(cbf_items))]

        if cf_scores:
            cf_scores = scaler.fit_transform(pd.DataFrame(cf_scores))
        if cbf_scores:
            cbf_scores = scaler.fit_transform(pd.DataFrame(cbf_scores))

        weight_cf = 0.8 if len(user_hist) >= 5 else 0.5
        weight_cbf = 1 - weight_cf

        scores = {}
        for i, f in enumerate(cf_items):
            scores[f] = scores.get(f, 0) + weight_cf * cf_scores[i][0]
        for i, f in enumerate(cbf_items):
            scores[f] = scores.get(f, 0) + weight_cbf * cbf_scores[i][0]

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [f for f, _ in ranked[:top_n]]

    def hybrid_recommend_with_preferences(self, user_id, preferences_text=None, allergens=None, top_n=10):
        """Hybrid recommendation using stored preferences/allergens for new users."""
        self.initialize()

        user_id = str(user_id)

        # Check if user has order history
        user_hist = list(
            self.interactions[
                self.interactions["user_id"] == user_id
            ]["food_id"]
        )

        # If user has preferences but no order history, use preference-based recommendations
        if not user_hist and preferences_text:
            return self.cbf_from_preferences(preferences_text, allergens, top_n)

        # If user has order history, use standard hybrid
        if user_hist:
            return self.hybrid_recommend(user_id=user_id, top_n=top_n)

        # No preferences and no history - return popular items
        popular = self.interactions["food_id"].value_counts().index.tolist()
        return popular[:top_n]

    def train_test_split(self, test_ratio=0.2):
        """Split interactions into train and test per user."""
        train_data = []
        test_data = []

        for user_id, group in self.interactions.groupby("user_id"):
            group = group.sample(frac=1, random_state=42)
            split_idx = int(len(group) * (1 - test_ratio))
            train_data.append(group.iloc[:split_idx])
            test_data.append(group.iloc[split_idx:])

        train_df = pd.concat(train_data)
        test_df = pd.concat(test_data)

        return train_df, test_df

    def rebuild_cf_from_train(self, train_df):
        """Build CF model using only training data."""
        self.user_map = {
            u: i for i, u in enumerate(train_df["user_id"].unique())
        }

        self.food_map = {
            f: i for i, f in enumerate(train_df["food_id"].unique())
        }

        self.inv_food_map = {i: f for f, i in self.food_map.items()}

        train_df["u_idx"] = train_df["user_id"].map(self.user_map)
        train_df["f_idx"] = train_df["food_id"].map(self.food_map)

        self.cf_matrix = csr_matrix((
            train_df["interaction"],
            (train_df["u_idx"], train_df["f_idx"])
        ))

        self.cf_model = AlternatingLeastSquares(
            factors=64,
            iterations=50,
            regularization=0.05,
            random_state=42
        )

        self.cf_model.fit(self.cf_matrix * 10)

    def evaluate(self, k=10):
        """Evaluate recommendation quality."""
        self.initialize()

        train_df, test_df = self.train_test_split()
        self.rebuild_cf_from_train(train_df)

        precision_list = []
        recall_list = []
        f1_list = []

        for user_id in test_df["user_id"].unique():
            true_items = set(
                test_df[test_df["user_id"] == user_id]["food_id"]
            )

            if user_id not in self.user_map:
                continue

            recommended = set(
                self.cf_recommend(user_id, top_n=k)
            )

            if not recommended:
                continue

            intersection = recommended & true_items

            precision = len(intersection) / k
            recall = len(intersection) / len(true_items)

            if precision + recall == 0:
                f1 = 0
            else:
                f1 = 2 * (precision * recall) / (precision + recall)

            precision_list.append(precision)
            recall_list.append(recall)
            f1_list.append(f1)

        return {
            "Precision@K": np.mean(precision_list),
            "Recall@K": np.mean(recall_list),
            "F1@K": np.mean(f1_list)
        }


# Global instance for backward compatibility
_recommender_instance = None


def initialize_data():
    """Initialize recommendation data (backward compatibility)"""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = HybridRecommender()
    _recommender_instance.initialize()


def hybrid_recommend(user_id, top_n=10):
    """Hybrid recommendation (backward compatibility)"""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = HybridRecommender()
    return _recommender_instance.hybrid_recommend(user_id=user_id, top_n=top_n)


def load_data_from_mongodb():
    """Load data from MongoDB (backward compatibility)"""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = HybridRecommender()
    _recommender_instance.load_data()
    return _recommender_instance.foods, _recommender_instance.interactions, _recommender_instance.users
