from fastapi import APIRouter, HTTPException, Request, Depends
from bson import ObjectId
from datetime import datetime, timedelta
import uuid
from app.utils.auth import verify_token
from app.database import (
    bookings_collection,
    reviews_collection,
    restaurants_collection,
    tables_collection
)
from ai.prediction.predict import analyze_sentiment

router = APIRouter(prefix="/api")

BOOKING_DURATION = 90

@router.post("/bookings")
async def create_booking(request: Request, user=Depends(verify_token)):
    data = await request.json()

    restaurant_id = data.get("restaurant_id")
    table_id      = data.get("table_id")
    date          = data.get("date")
    time          = data.get("time")
    guests        = data.get("guests")
    notes         = data.get("notes", "")
    customer_id   = user["id"]

    if not restaurant_id or not table_id or not date or not time:
        raise HTTPException(
            status_code=400,
            detail="restaurant_id, table_id, date and time are required"
        )

    new_start = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    new_end   = new_start + timedelta(minutes=BOOKING_DURATION)

    async for booking in bookings_collection.find({"table_id": table_id, "date": date}):
        try:
            existing_start = datetime.strptime(
                f"{booking['date']} {booking['time']}", "%Y-%m-%d %H:%M"
            )
            existing_end = existing_start + timedelta(minutes=BOOKING_DURATION)
            if new_start < existing_end and new_end > existing_start:
                raise HTTPException(
                    status_code=400,
                    detail="This table is already reserved during this time slot"
                )
        except ValueError:
            continue

    booking_id = str(uuid.uuid4())

    await bookings_collection.insert_one({
        "booking_id":    booking_id,
        "restaurant_id": restaurant_id,
        "table_id":      table_id,
        "customer_id":   customer_id,
        "date":          date,
        "time":          time,
        "guests":        guests,
        "notes":         notes,
        "status":        "Pending",
        "created_at":    datetime.utcnow()
    })

    restaurant = await restaurants_collection.find_one({"_id": ObjectId(restaurant_id)})
    table      = await tables_collection.find_one({"_id": ObjectId(table_id)})

    return {
        "booking_id":      booking_id,
        "restaurant_id":   restaurant_id,
        "restaurant_name": restaurant.get("name") if restaurant else "",
        "table_name":      table.get("name") if table else "",
        "date":            date,
        "time":            time,
        "guests":          guests
    }

@router.post("/reviews")
async def add_review(request: Request, user=Depends(verify_token)):
    data = await request.json()

    restaurant_id = data.get("restaurant_id")
    rating        = data.get("rating")
    comment       = data.get("comment", "")
    customer_id   = user["id"]

    if not restaurant_id:
        raise HTTPException(status_code=400, detail="restaurant_id required")

    if not comment:
        raise HTTPException(status_code=400, detail="Review comment cannot be empty")

    booking = await bookings_collection.find_one({
        "customer_id":   customer_id,
        "restaurant_id": restaurant_id,
        "date": {"$lt": datetime.now().strftime("%Y-%m-%d")}
    })
    if not booking:
        raise HTTPException(status_code=400, detail="You can review only after dining")
    sentiment = analyze_sentiment(comment)

    await reviews_collection.insert_one({
        "customer_id":       customer_id,
        "restaurant_id":     restaurant_id,
        "rating":            rating,
        "comment":           comment,
        "sentiment_label":   sentiment["label"],    # Positive / Neutral / Negative
        "sentiment_score":   sentiment["score"],    # -1.0 to +1.0
        "sentiment_emoji":   sentiment["emoji"],    # 😊 / 😐 / 😞
        "created_at":        datetime.utcnow()
    })

    return {
        "message":   "Review submitted successfully",
        "sentiment": sentiment["label"],
        "emoji":     sentiment["emoji"]
    }

@router.get("/reviews/{restaurant_id}/sentiment-summary")
async def get_sentiment_summary(
    restaurant_id: str,
    user=Depends(verify_token)
):
    
    if user.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Unauthorized")

    pipeline = [
        {"$match": {"restaurant_id": restaurant_id}},
        {"$group": {
            "_id":   "$sentiment_label",
            "count": {"$sum": 1}
        }}
    ]

    results = await reviews_collection.aggregate(pipeline).to_list(10)

    counts = {"Positive": 0, "Neutral": 0, "Negative": 0}
    for r in results:
        label = r["_id"]
        if label in counts:
            counts[label] = r["count"]

    total = sum(counts.values())

    if total == 0:
        return {
            "total":            0,
            "positive_count":   0,
            "neutral_count":    0,
            "negative_count":   0,
            "positive_percent": 0,
            "neutral_percent":  0,
            "negative_percent": 0,
            "overall":          "No reviews yet",
            "overall_emoji":    "😐"
        }

    positive = counts["Positive"]
    neutral  = counts["Neutral"]
    negative = counts["Negative"]

    if positive >= neutral and positive >= negative:
        overall       = "Mostly Positive"
        overall_emoji = "😊"
    elif negative >= neutral and negative >= positive:
        overall       = "Mostly Negative"
        overall_emoji = "😞"
    else:
        overall       = "Mixed"
        overall_emoji = "😐"

    return {
        "total":            total,
        "positive_count":   positive,
        "neutral_count":    neutral,
        "negative_count":   negative,
        "positive_percent": round(positive / total * 100, 1),
        "neutral_percent":  round(neutral  / total * 100, 1),
        "negative_percent": round(negative / total * 100, 1),
        "overall":          overall,
        "overall_emoji":    overall_emoji
    }

@router.get("/reviews/{restaurant_id}")
async def get_reviews(restaurant_id: str):
    reviews = []
    async for review in reviews_collection.find(
        {"restaurant_id": restaurant_id}
    ).sort("created_at", -1).limit(50):
        reviews.append({
            "_id":             str(review["_id"]),
            "rating":          review.get("rating", 0),
            "comment":         review.get("comment", ""),
            "sentiment_label": review.get("sentiment_label", "Neutral"),
            "sentiment_score": review.get("sentiment_score", 0.0),
            "sentiment_emoji": review.get("sentiment_emoji", "😐"),
            "created_at":      str(review.get("created_at", ""))
        })
    return reviews

