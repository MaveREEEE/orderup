# OrderUP Recommender System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORDERUP FRONTEND                             │
│                    (React + Vite + Material UI)                     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Home Page                              │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │           Header / Navigation                          │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │           Explore Menu (Category Filter)              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌─ RECOMMENDATIONS (NEW) ─────────────────────────────────┐ │  │
│  │  │  "Recommended For You"                                 │ │  │
│  │  │  [Food1] [Food2] [Food3] [Food4] [Food5]             │ │  │
│  │  │                                                        │ │  │
│  │  │  ↓                                                     │ │  │
│  │  │  useRecommendations hook calls:                      │ │  │
│  │  │  GET http://127.0.0.1:8000/recommend/{userId}       │ │  │
│  │  │                                                        │ │  │
│  │  │  ↓                                                     │ │  │
│  │  │  Returns: [foodId1, foodId2, foodId3, ...]           │ │  │
│  │  │  Matches with food_list from StoreContext            │ │  │
│  │  │  Displays up to 5 items                              │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │       All Food Items (by Category Filter)             │ │  │
│  │  │  [Food] [Food] [Food] [Food] [Food] ...              │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │              Footer                                    │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Context (StoreContext):                                            │
│  • food_list: Array of all foods                                    │
│  • userId: Current logged-in user ID                               │
│  • token: Authentication token                                      │
│  • cartItems: User's cart                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                         (HTTP GET)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   RECOMMENDER API (Python)                          │
│                    (FastAPI + Uvicorn)                              │
│                http://127.0.0.1:8000                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  GET /recommend/{user_id}?top_n=10                          │  │
│  │                                                              │  │
│  │  ↓                                                           │  │
│  │  hybrid_recommend(user_id)                                 │  │
│  │                                                              │  │
│  │  Checks if data is initialized:                           │  │
│  │  └─ initialize_data() [Lazy Load]                         │  │
│  │     ├─ load_data_from_mongodb()                           │  │
│  │     ├─ Build TF-IDF matrix (Content-Based)                │  │
│  │     └─ Train ALS model (Collaborative)                    │  │
│  │                                                              │  │
│  │  Split recommendations:                                    │  │
│  │  ├─ cf_recommend(user_id) → [50% of results]             │  │
│  │  │  Uses: Collaborative Filtering (ALS)                  │  │
│  │  │  Factors: 50, Iterations: 20                          │  │
│  │  │                                                        │  │
│  │  └─ cbf_recommend(last_food_id) → [50% of results]       │  │
│  │     Uses: TF-IDF + Cosine Similarity                     │  │
│  │     Features: name + description (NO CATEGORY)           │  │
│  │                                                              │  │
│  │  Combine & Deduplicate:                                   │  │
│  │  return list(dict.fromkeys(combined))[:top_n]            │  │
│  │                                                              │  │
│  │  ↓                                                           │  │
│  │  JSON Response:                                            │  │
│  │  {                                                          │  │
│  │    "user_id": "507f1f77bcf86cd799439011",                │  │
│  │    "recommendations": [21989, 45321, 67890],             │  │
│  │    "count": 3                                             │  │
│  │  }                                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
                         (MongoDB)
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       MONGODB DATABASE                              │
│              mongodb+srv://admin:admin@...OrderUP                  │
│                                                                      │
│  Collections:                                                        │
│  ├─ foods                                                            │
│  │  └─ [{_id, name, description, category, price, ...}]           │
│  │                                                                  │
│  ├─ orders                                                           │
│  │  └─ [{userId, items: [{_id, name, ...}], date, ...}]          │
│  │                                                                  │
│  └─ users                                                            │
│     └─ [{_id, name, email, ...}]                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Step 1: User Logs In
```
User → Login Form → Backend Auth
                        ↓
                    localStorage.setItem("userId", userId)
                    localStorage.setItem("token", token)
                        ↓
                    StoreContext updates userId
```

### Step 2: Home Page Renders
```
Home Component mounts
        ↓
const { userId } = useContext(StoreContext)
        ↓
{userId && <Recommendations userId={userId} />}
```

### Step 3: Recommendations Component
```
Recommendations.jsx mounts
        ↓
useRecommendations hook
        ↓
if (userId) → fetch /recommend/{userId}?top_n=10
        ↓
Got recommendations: [21989, 45321, 67890]
        ↓
Match with food_list from context
        ↓
Display 5 items
```

### Step 4: Backend Processing
```
GET /recommend/507f1f77bcf86cd799439011
        ↓
hybrid_recommend(userId)
        ↓
User in interactions? YES
        ↓
├─ CF: Get users with similar order history
│  └─ Return top 5 similar foods
│
└─ CBF: Get foods similar to last ordered
   └─ Return top 5 similar foods
        ↓
Combine & deduplicate
        ↓
Return [foodId1, foodId2, ...]
```

## Machine Learning Algorithm

### Collaborative Filtering (50% of Results)
```
User-Item Interaction Matrix:
┌───┬────┬────┬────┐
│ U │F1  │F2  │F3  │
├───┼────┼────┼────┤
│U1 │ 1  │ 0  │ 1  │
│U2 │ 1  │ 1  │ 0  │
│U3 │ 0  │ 1  │ 1  │
└───┴────┴────┴────┘

ALS Algorithm (50 factors, 20 iterations):
Learns latent factors → Identifies similar users
If User A likes Food X and User B is similar to A,
recommend Food X to User B
```

### Content-Based Filtering (50% of Results)
```
Food Features (TF-IDF):
"Chicken Tikka Masala" → [tokens] → [TF-IDF vector]
"Butter Chicken"       → [tokens] → [TF-IDF vector]

Cosine Similarity:
sim(Tikka, Butter) = 0.85
            ↓
Recommend Butter Chicken if user liked Tikka

Features Used:
✓ name + description
✗ category (REMOVED)
```

### Hybrid Approach
```
Top 10 from CF:     [F1, F2, F3, F4, F5]
Top 10 from CBF:    [F6, F7, F8, F9, F10]

Combined:           [F1, F2, F3, F6, F7, F8, F9, F4, F5, F10]
Deduplicated:       [F1, F2, F3, F6, F7, F8, F9, F4, F5, F10]
Top 10:             [F1, F2, F3, F6, F7, F8, F9, F4, F5, F10]
```

## Component Hierarchy

```
App
├── StoreContextProvider (Provides: food_list, userId, cartItems, url, ...)
│
├── NavBar
├── Router
│   └── Home
│       ├── Header
│       ├── ExploreMenu
│       ├── Recommendations (NEW)
│       │   └── FoodItem × 5
│       │
│       └── FoodDisplay
│           └── FoodItem × N
│
└── Footer
```

## API Endpoints

```
GET /
├─ Status: Health check
├─ Response: { status, message, version, data_source }
└─ Used by: Frontend (optional)

GET /recommend/{user_id}?top_n=10
├─ Status: Get recommendations
├─ Params: user_id (required), top_n (optional, default 10)
├─ Response: { user_id, recommendations, count }
└─ Used by: Recommendations component

POST /reload-data
├─ Status: Reload MongoDB data without restart
├─ Response: { status, message, foods_count, interactions_count, users_count }
└─ Used by: Admin panel (future)
```

## Error Handling

```
┌─ API Unreachable
│  └─ Silently hide recommendations section
│
├─ No Data in MongoDB
│  └─ Return empty recommendations
│
├─ User Has No History
│  └─ Return most popular items
│
├─ Invalid Food ID
│  └─ Skip in frontend display
│
└─ Network Timeout (5 sec)
   └─ Don't break UI, show nothing
```

## Performance Considerations

```
First Request:
  ├─ Initialize data from MongoDB (1-3 sec)
  ├─ Train TF-IDF vectorizer
  ├─ Train ALS model
  └─ Cache in memory

Subsequent Requests:
  ├─ Reuse cached models (< 100 ms)
  └─ Quick lookups
```

---

**Architecture Diagram Created**: January 20, 2026  
**System Status**: ✅ Fully Integrated  
**ML Algorithm**: Hybrid (Collaborative + Content-Based)  
**Data Source**: MongoDB (Live)
