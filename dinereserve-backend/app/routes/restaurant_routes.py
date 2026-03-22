from fastapi import APIRouter, HTTPException, Query
from app.database import restaurants_collection, tables_collection, bookings_collection
from bson import ObjectId
from datetime import datetime, timedelta
router = APIRouter(prefix="/api")
@router.get("/restaurants")
async def get_restaurants(
    search:           str = Query(None),
    cuisine:          str = Query(None),
    food_preference:  str = Query(None),
    restaurant_type:  str = Query(None),
    budget:           str = Query(None),
    guests:           int = Query(None)
):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if cuisine:
        query["cuisine"] = {"$in": [cuisine]}
    if food_preference:
        query["food_preference"] = {"$regex": food_preference, "$options": "i"}
    if restaurant_type:
        query["restaurant_type"] = restaurant_type
    if budget:
        query["price_range"] = {"$regex": budget, "$options": "i"}
    if guests:
        query["max_capacity"] = {"$gte": guests}
 
    restaurants = []
    async for r in restaurants_collection.find(query):
        restaurants.append({
            "_id":             str(r["_id"]),
            "name":            r.get("name"),
            "image":           r.get("image"),
            "description":     r.get("description"),
            "cuisine":         r.get("cuisine"),
            "food_preference": r.get("food_preference"),
            "restaurant_type": r.get("restaurant_type"),
            "rating":          r.get("rating"),
            "price_range":     r.get("price_range"),
            "max_capacity":    r.get("max_capacity")
        })
    return restaurants
 
 
@router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    try:
        restaurant = await restaurants_collection.find_one({"_id": ObjectId(restaurant_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID")
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return {
        "_id":             str(restaurant["_id"]),
        "name":            restaurant.get("name"),
        "image":           restaurant.get("image"),
        "description":     restaurant.get("description"),
        "cuisine":         restaurant.get("cuisine"),
        "food_preference": restaurant.get("food_preference"),
        "restaurant_type": restaurant.get("restaurant_type"),
        "rating":          restaurant.get("rating"),
        "price_range":     restaurant.get("price_range"),
        "max_capacity":    restaurant.get("max_capacity")
    }
 
 
@router.get("/restaurants/{restaurant_id}/available-tables")
async def available_tables(
    restaurant_id: str,
    date:  str,
    time:  str,
    guests: int = Query(None)
):
    try:
        restaurant = await restaurants_collection.find_one({"_id": ObjectId(restaurant_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID")
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    from datetime import datetime as dt
    try:
        selected_dt = dt.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        if selected_dt < dt.now():
            raise HTTPException(
                status_code=400,
                detail="Cannot book a table for a past date or time"
            )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or time format")
 
    BOOKING_DURATION = 90
    new_start = dt.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    new_end   = new_start + timedelta(minutes=BOOKING_DURATION)
 
    result = []
    async for table in tables_collection.find({"restaurant_id": restaurant_id}):
        conflict = False
        async for booking in bookings_collection.find({
            "table_id": str(table["_id"]),
            "date":     date
        }):
            try:
                existing_start = dt.strptime(
                    f"{booking['date']} {booking['time']}", "%Y-%m-%d %H:%M"
                )
                existing_end = existing_start + timedelta(minutes=BOOKING_DURATION)
                if new_start < existing_end and new_end > existing_start:
                    conflict = True
                    break
            except Exception:
                continue
 
        if conflict:
            continue
 
        seats = int(table.get("seats", 0))
        if guests and seats < guests:
            continue
 
        result.append({
            "_id":       str(table["_id"]),
            "name":      table.get("name"),
            "seats":     seats,
            "fit_score": seats - guests if guests else 0
        })
 
    if guests:
        result.sort(key=lambda x: x["fit_score"])
    for t in result:
        t.pop("fit_score", None)
    return result
