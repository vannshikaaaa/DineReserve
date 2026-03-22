from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ai.prediction.predict import (
    predict_dishes,
    predict_noshow,
    predict_cancellation,
    predict_peak_hours,
    predict_table_demand,
    analyze_sentiment,
    analyze_reviews_bulk,
)

router = APIRouter(prefix="/api/ai", tags=["AI / ML"])

class DishRecommendRequest(BaseModel):
    restaurant_id:   str
    cuisine_filter:  Optional[List[str]] = None
    food_preference: Optional[str] = None
    top_n:           Optional[int] = 5

@router.post("/recommend-dish")
async def recommend_dishes(req: DishRecommendRequest):
    try:
        results = predict_dishes(
            restaurant_id=req.restaurant_id,
            cuisine_filter=req.cuisine_filter,
            food_preference=req.food_preference,
            top_n=req.top_n,
        )
        return {"status": "success", "recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class NoShowRequest(BaseModel):
    hour:        int
    day_of_week: int
    month:       int
    guests:      int

@router.post("/predict-noshow")
async def predict_noshow_api(req: NoShowRequest):
    try:
        result = predict_noshow(
            hour=req.hour,
            day_of_week=req.day_of_week,
            month=req.month,
            guests=req.guests,
        )
        return {"status": "success", "prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PeakHourRequest(BaseModel):
    day_of_week: int
    month:       int

@router.post("/predict-peak-hour")
async def predict_peak_hour_api(req: PeakHourRequest):
    try:
        results = predict_peak_hours(
            day_of_week=req.day_of_week,
            month=req.month,
        )
        return {"status": "success", "hourly_forecast": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DemandRequest(BaseModel):
    table_category: int
    day_of_week:    int
    hour:           int
    month:          int

@router.post("/predict-demand")
async def predict_demand_api(req: DemandRequest):
    try:
        result = predict_table_demand(
            table_category=req.table_category,
            day_of_week=req.day_of_week,
            hour=req.hour,
            month=req.month,
        )
        return {"status": "success", "demand": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SentimentRequest(BaseModel):
    text: str

@router.post("/analyze-sentiment")
async def analyze_sentiment_api(req: SentimentRequest):

    try:
        result = analyze_sentiment(req.text)
        return {"status": "success", "sentiment": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BulkSentimentRequest(BaseModel):
    reviews: List[str]

@router.post("/analyze-sentiment-bulk")
async def analyze_sentiment_bulk_api(req: BulkSentimentRequest):

    try:
        result = analyze_reviews_bulk(req.reviews)
        return {"status": "success", "summary": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CancelRequest(BaseModel):
    hour:        int
    day_of_week: int
    month:       int
    guests:      int

@router.post("/predict-cancellation")
async def predict_cancellation_api(req: CancelRequest):

    try:
        result = predict_cancellation(
            hour=req.hour,
            day_of_week=req.day_of_week,
            month=req.month,
            guests=req.guests,
        )
        return {"status": "success", "prediction": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))