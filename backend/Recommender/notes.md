
## Setting it up and Running it
pip install -r requirements.txt
uvicorn api:app --reload

## API
GET /recommend/{user_id}

Returns:
{
  "user_id": "string",
  "recommendations": [food_id, ...]
}