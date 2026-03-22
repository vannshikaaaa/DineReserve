from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.database import restaurants_collection, menu_collection
 
router = APIRouter(prefix="/api")
 
@router.get("/recommendations/{restaurant_id}")
async def get_recommendations(restaurant_id: str):
    try:
        restaurant = await restaurants_collection.find_one(
            {"_id": ObjectId(restaurant_id)}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID")
 
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
 
    recommendations = []
    async for item in menu_collection.find(
        {"restaurant_id": restaurant_id}
    ).limit(5):
        recommendations.append({
            "name":        item.get("name"),
            "description": item.get("description")
        })
    return recommendations
