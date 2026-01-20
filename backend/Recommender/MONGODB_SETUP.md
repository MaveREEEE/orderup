# OrderUP Recommender System - MongoDB Edition

## Overview

The recommender system has been updated to pull data directly from MongoDB instead of CSV files. **The core machine learning algorithm remains unchanged** - only the data source has been modified.

## Key Features

### Hybrid Recommendation Engine
Combines two proven recommendation strategies:

1. **Collaborative Filtering (ALS - Alternating Least Squares)**
   - Analyzes user-item interaction patterns from order history
   - Learns latent factors to identify similar user behaviors
   - Recommends items similar users have enjoyed

2. **Content-Based Filtering (TF-IDF + Cosine Similarity)**
   - Analyzes item features (name, description, category)
   - Recommends items similar to what the user previously ordered
   - Works well for new users with limited interaction history

## Data Source Changes

### Before (CSV)
```
datasets/
  ├── foods.csv
  ├── orders.csv
  └── users.csv
```

### Now (MongoDB)
```
OrderUP Database:
  ├── foods collection
  ├── orders collection
  └── users collection
```

## Installation & Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

New dependencies added:
- `pymongo` - MongoDB driver for Python
- `python-dotenv` - Environment variable management

### 2. Configure MongoDB Connection

Create a `.env` file in the Recommender directory:

```env
MONGO_URI=mongodb+srv://admin:admin@cluster0.yxdbxbx.mongodb.net/OrderUP
```

Or use the provided `.env` file template.

### 3. Run the API

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### 1. Health Check
```
GET /
```
Returns status and version information.

**Response:**
```json
{
  "status": "ok",
  "message": "OrderUP Recommender API is running",
  "version": "2.0",
  "data_source": "MongoDB"
}
```

### 2. Get Recommendations
```
GET /recommend/{user_id}?top_n=10
```

**Parameters:**
- `user_id` (required): The user's ID
- `top_n` (optional): Number of recommendations to return (default: 10)

**Response:**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "recommendations": [123, 456, 789],
  "count": 3
}
```

### 3. Reload Data
```
POST /reload-data
```

Reloads recommendation data from MongoDB without restarting the API.

**Response:**
```json
{
  "status": "success",
  "message": "Data reloaded successfully",
  "foods_count": 245,
  "interactions_count": 1523,
  "users_count": 342
}
```

## Data Format Mapping

### Foods Collection
```javascript
{
  _id: ObjectId,
  name: String,           // Used for TF-IDF vectorization
  description: String,    // Used for TF-IDF vectorization
  category: String,       // Used for TF-IDF vectorization
  price: Number,
  image: String,
  // ... other fields
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: String,         // User identifier
  items: [
    {
      _id: String,        // Food ID
      name: String,
      // ... other item fields
    }
  ],
  date: Date,             // Order timestamp
  // ... other fields
}
```

### Users Collection
```javascript
{
  _id: ObjectId,          // User ID
  name: String,
  email: String,
  // ... other fields
}
```

## How It Works

### Data Loading Process

1. **Connect to MongoDB** using MONGO_URI
2. **Fetch Foods Data**: Retrieve all foods with name, description, and category
3. **Fetch Orders Data**: Retrieve all orders with user ID, items, and timestamps
4. **Fetch Users Data**: Retrieve user information
5. **Build Interaction Matrix**: Create user-food interactions from orders
6. **Train Models**:
   - TF-IDF vectorizer for content-based filtering
   - ALS model for collaborative filtering

### Recommendation Process

For each user request:

1. **Check User History**: Look for previous orders
2. **If New User**: Return most popular items
3. **If Existing User**:
   - Get collaborative filtering recommendations (top 50% of results)
   - Get content-based recommendations (top 50% of results)
   - Combine and deduplicate results
   - Return top N recommendations

## Algorithm Details

### Collaborative Filtering
- **Model**: Alternating Least Squares (ALS)
- **Factors**: 50
- **Iterations**: 20
- **Regularization**: Applied via interaction multiplication (×10)

### Content-Based Filtering
- **Vectorization**: TF-IDF
- **Max Features**: 100
- **Stop Words**: English
- **Similarity Metric**: Cosine similarity

## Advantages of MongoDB Integration

✅ **Real-time Data**: Recommendations automatically reflect latest orders and food items
✅ **No Manual Sync**: No need to export/import CSV files
✅ **Scalability**: Handles growing data naturally
✅ **Consistency**: Single source of truth
✅ **Flexibility**: Easy to add/update food items or orders
✅ **Performance**: MongoDB queries are optimized

## Performance Considerations

- **Initial Load**: Data is loaded at startup (first request takes longer)
- **Caching**: Models are cached in memory for quick recommendations
- **Reload Endpoint**: Use `/reload-data` to refresh without restarting

## Error Handling

The system gracefully handles:
- ✓ Missing/empty MongoDB collections
- ✓ Users with no order history
- ✓ New food items not in training data
- ✓ Connection failures
- ✓ Invalid user IDs

## Troubleshooting

### MongoDB Connection Issues
```
Error: Connection refused
Solution: Check MONGO_URI and ensure MongoDB cluster is accessible
```

### Empty Recommendations
```
Cause: No orders in database or user has no order history
Solution: Check that orders collection is populated
```

### Module Import Errors
```
Solution: Run: pip install -r requirements.txt
```

## Future Enhancements

- [ ] Add caching layer (Redis)
- [ ] Implement popularity-based fallback
- [ ] Add user preferences/ratings
- [ ] Support for A/B testing different algorithms
- [ ] Real-time model updates
- [ ] Batch recommendation generation

## Notes

- The core ML algorithms (TF-IDF, ALS, Cosine Similarity) remain unchanged
- Only the data source has switched from CSV to MongoDB
- All recommendation logic is preserved
- The API interface is backward compatible with additional features

---

**Version**: 2.0  
**Data Source**: MongoDB  
**Last Updated**: January 2026
