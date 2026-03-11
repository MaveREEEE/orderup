# Signup Preferences & Allergens Integration

## Overview
Added food preferences and allergens collection during signup to provide personalized recommendations for new users.

## Changes Made

### 1. Backend - User Model (`backend/models/userModel.js`)
```javascript
// Added new fields:
foodPreferences: { type: String, default: "" },
allergens: { type: [String], default: [] }
```

### 2. Backend - Registration (`backend/controllers/authController.js`)
- Updated to accept `foodPreferences` and `allergens` in registration payload
- Stores preferences and allergens when creating new user account

### 3. Recommender API (`backend/Recommender/api.py`)
Enhanced `/recommend/{user_id}` endpoint to:
- Query user's stored preferences and allergens from MongoDB
- Build survey text: `"{preferences} no {allergen1} no {allergen2}"`
- Pass survey text to hybrid recommender for new users
- Returns `used_preferences: true/false` in response

### 4. Frontend - Signup Form (`frontend/src/components/LoginPopUp/LoginPopUp.jsx`)
Added new fields in Sign Up form:

**Food Preferences** (Optional):
- Textarea for user to describe their food preferences
- Example: "I like spicy food, Filipino dishes, chicken meals, budget-friendly options under 200 pesos"

**Allergies** (Optional):
- Comma-separated input
- Example: "seafood, peanuts, dairy"
- Automatically converted to array before sending to backend

## How It Works

### New User Flow:
1. **Signup**: User fills out preferences and allergies
2. **Storage**: Data saved to MongoDB user document
3. **First Recommendation**: System uses stored preferences as survey text
4. **Content Matching**: TF-IDF matches preferences against food items:
   - Food names
   - Descriptions
   - Categories
   - Price ranges
   - Allergens (to exclude)
5. **Hybrid Transition**: As user orders, system gradually shifts from content-based to collaborative filtering

### Existing User Flow:
- Preferences stored but not used (already has order history)
- System prioritizes collaborative filtering based on actual orders
- Preferences only used if order history is insufficient

## Example Data Flow

**User Input (Signup)**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "******",
  "foodPreferences": "I love Filipino comfort food especially adobo and sinigang. I prefer affordable meals under 200 pesos.",
  "allergens": ["seafood", "peanuts"]
}
```

**Stored in MongoDB**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "foodPreferences": "I love Filipino comfort food especially adobo and sinigang. I prefer affordable meals under 200 pesos.",
  "allergens": ["seafood", "peanuts"]
}
```

**Survey Text Generated**:
```
"I love Filipino comfort food especially adobo and sinigang. I prefer affordable meals under 200 pesos. no seafood no peanuts"
```

**Recommendations Returned**:
- Chicken Adobo (matches: Filipino, comfort food, affordable)
- Sinigang na Baboy (matches: sinigang, Filipino)
- Pork BBQ (matches: Filipino, cheap)
- Excludes: Fish Fillet, Shrimp Pasta (contains seafood)

## Benefits

1. **Immediate Personalization**: New users get relevant recommendations from first visit
2. **Allergen Safety**: Automatically filters out items with user's allergens
3. **Budget Awareness**: Respects user's price preferences
4. **Smooth Onboarding**: Better first impression with personalized experience
5. **Data Collection**: Builds user preference database for future improvements

## Testing

### Test Signup with Preferences:
```bash
# Using frontend signup form
Food Preferences: "I like spicy chicken and Filipino breakfast meals. Budget under 150 pesos"
Allergies: "seafood, dairy"
```

### Test Recommendations:
```bash
# After signup, get recommendations
GET http://localhost:8000/recommend/{user_id}

# Should return:
{
  "user_id": "507f1f77bcf86cd799439011",
  "recommendations": ["food_id_1", "food_id_2", ...],
  "count": 10,
  "used_preferences": true
}
```

## Future Enhancements

1. **Dietary Restrictions**: Add checkboxes (Vegetarian, Vegan, Halal, etc.)
2. **Cuisine Preferences**: Multi-select for favorite cuisines
3. **Spice Level**: Slider for spice tolerance
4. **Price Range**: Slider for budget range
5. **Preference Updates**: Allow users to update preferences in profile settings
6. **Smart Suggestions**: Auto-suggest preferences based on browsing behavior

## Migration Notes

**Existing Users**: 
- `foodPreferences` and `allergens` will be empty strings/arrays
- System continues to use collaborative filtering based on order history
- No action required for existing users

**Database Migration**: Not required - MongoDB handles new fields automatically with defaults
