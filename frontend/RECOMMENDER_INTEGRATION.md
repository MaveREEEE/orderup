# Frontend Integration Guide - Recommender API

## Setup

### 1. Environment Variables
Add to your `.env` file:
```env
VITE_RECOMMENDER_URL=http://127.0.0.1:8000
```

For production:
```env
VITE_RECOMMENDER_URL=https://your-recommender-domain.com
```

### 2. Files Created

#### Components:
- **`Recommendations.jsx`** - Displays recommended foods
- **`Recommendations.css`** - Styling for recommendations section

#### Utilities:
- **`recommendationUtils.js`** - Hook and utility functions for API calls

### 3. Integration

The recommender is automatically integrated into the Home page:
- Recommendations appear between the menu explorer and food display
- Only shows for logged-in users
- Displays up to 5 recommended items
- Automatically fetches recommendations based on user ID and order history

### 4. Usage Examples

#### In a React Component with Hook:
```jsx
import { useRecommendations } from '../../utils/recommendationUtils';

function MyComponent() {
  const { recommendations, loading, error } = useRecommendations(userId, 10);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {recommendations.map(foodId => (
        <div key={foodId}>{foodId}</div>
      ))}
    </div>
  );
}
```

#### Without Hook (One-time call):
```jsx
import { getRecommendations } from '../../utils/recommendationUtils';

const recommendations = await getRecommendations(userId, 5);
```

### 5. How It Works

1. **User Logs In** → `userId` is stored in context
2. **Home Page Loads** → Checks if user is logged in
3. **Fetch Recommendations** → Calls `/recommend/{userId}?top_n=10` endpoint
4. **Display Results** → Shows matching foods from the database
5. **Automatic Refresh** → Re-fetches when `userId` changes

### 6. Error Handling

- If recommender API is unavailable, recommendations silently don't show
- If user has no history, shows most popular items
- New users see most-ordered foods
- Works even if some food IDs are not in the database

### 7. Customization

To change recommendations count or location, edit `Home.jsx`:
```jsx
<Recommendations userId={userId} /> // Default: 5 items, 10 fetched
```

Or modify `Recommendations.jsx`:
```jsx
{recommendedFoods.slice(0, 5).map(...)} // Change 5 to desired number
useRecommendations(userId, 10)          // Change 10 to desired fetch count
```

### 8. API Response Format

```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "recommendations": [123, 456, 789],
  "count": 3
}
```

---

**Version**: 1.0
**Last Updated**: January 20, 2026
