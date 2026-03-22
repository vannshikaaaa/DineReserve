from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.database import bookings_collection, restaurants_collection
from app.utils.auth import verify_token
router = APIRouter(prefix="/api/admin", tags=["Admin Reports"])
@router.get("/analytics")
async def get_analytics(user=Depends(verify_token)):
    if "restaurant_id" not in user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    restaurant_id = user["restaurant_id"]
    try:
        bookings_per_day = await bookings_collection.aggregate([
            {"$match":  {"restaurant_id": restaurant_id}},
            {"$group":  {"_id": "$date", "count": {"$sum": 1}}},
            {"$sort":   {"_id": 1}}
        ]).to_list(100)
 
        peak_hours = await bookings_collection.aggregate([
            {"$match":  {"restaurant_id": restaurant_id}},
            {"$group":  {"_id": "$time", "count": {"$sum": 1}}},
            {"$sort":   {"count": -1}}
        ]).to_list(10)
 
        restaurant = await restaurants_collection.find_one({
            "_id": ObjectId(restaurant_id)
        })
 
        cuisine_stats = {}
        if restaurant and "cuisine" in restaurant:
            for c in restaurant["cuisine"]:
                cuisine_stats[c] = cuisine_stats.get(c, 0) + 1
 
        return {
            "bookings_per_day": {
                "labels": [b["_id"]   for b in bookings_per_day],
                "bookings":   [b["count"] for b in bookings_per_day]
            },
            "peak_hours": {
                "labels": [p["_id"]   for p in peak_hours],
                "data":   [p["count"] for p in peak_hours]
            },
            "popular_cuisines": cuisine_stats
        }
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
