import joblib
import numpy as np
import pandas as pd
import os
from typing import List, Dict, Any
 
_models: Dict[str, Any] = {}
 
def _load(name: str, path: str):
    if name not in _models:
        if os.path.exists(path):
            _models[name] = joblib.load(path)
            print(f"Loaded model: {name}")
        else:
            print(f"WARNING: Model not found at {path}")
            _models[name] = None
    return _models[name]
 
 
def predict_dishes(
    restaurant_id: str,
    cuisine_filter: List[str] = None,
    food_preference: str = None,
    top_n: int = 5,
) -> List[Dict]:
    data = _load("dish", "ai/models/dish_model.pkl")
    if data is None:
        return [{"error": "Dish model not trained yet"}]
  
    df = data["df"].copy()

    df_rest = df[df["restaurant_id"] == restaurant_id]
    if df_rest.empty:
        df_rest = df
 
    if food_preference:
        df_rest = df_rest[
            df_rest["food_preference"].str.contains(food_preference, case=False, na=False)
        ]
    if cuisine_filter:
        pattern = "|".join(cuisine_filter)
        df_rest = df_rest[
            df_rest["cuisine_type"].str.contains(pattern, case=False, na=False)
        ]
 
    if df_rest.empty:
        return [{"message": "No dishes match the given filters"}]
 
    df_rest = df_rest.sort_values("order_count", ascending=False)
 
    results = []
    for _, row in df_rest.head(top_n).iterrows():
        results.append({
            "dish_name":        row["dish_name"],
            "cuisine_type":     row["cuisine_type"],
            "food_preference":  row["food_preference"],
            "description":      row.get("description", ""),
            "popularity_score": int(row.get("order_count", 0)),
        })
    return results
 
 
def predict_noshow(hour: int, day_of_week: int, month: int, guests: int) -> Dict:
    data = _load("noshow", "ai/models/noshow_model.pkl")
    if data is None:
        return {"error": "No-show model not trained yet"}
 
    model    = data["model"]
    features = data["features"]
 
    X    = pd.DataFrame([[hour, day_of_week, month, guests]], columns=features)
    prob = model.predict_proba(X)[0][1]
 
    if prob < 0.25:
        risk = "Low"
    elif prob < 0.5:
        risk = "Medium"
    else:
        risk = "High"
 
    return {
        "is_noshow":       bool(prob >= 0.5),
        "probability":     round(float(prob), 3),
        "risk_level":      risk,
        "recommendation":  "Consider sending a reminder" if prob > 0.3 else "Booking looks reliable",
    }
 
 
def _hour_label(hour: int) -> str:
    if hour == 0:
        return "12:00 AM"
    elif hour < 12:
        return f"{hour}:00 AM"
    elif hour == 12:
        return "12:00 PM"
    else:
        return f"{hour - 12}:00 PM"
 
 
def predict_peak_hours(day_of_week: int, month: int) -> List[Dict]:
    data = _load("peak", "ai/models/peak_model.pkl")
    if data is None:
        return [{"error": "Peak model not trained yet"}]
 
    model    = data["model"]
    features = data["features"]
 
    results = []
    for hour in range(10, 23):
        X = pd.DataFrame([[hour, day_of_week, month]], columns=features)
        predicted = max(0, float(model.predict(X)[0]))
        results.append({
            "hour":               hour,
            "hour_label":         _hour_label(hour),
            "predicted_bookings": round(predicted, 1),
            "is_peak":            predicted >= 1.1,
        })
    return results
 
 
def predict_table_demand(
    table_category: int,
    day_of_week: int,
    hour: int,
    month: int,
) -> Dict:
    data = _load("demand", "ai/models/demand_model.pkl")
    if data is None:
        return {"error": "Demand model not trained yet"}
 
    model    = data["model"]
    features = data["features"]
 
    X      = pd.DataFrame([[table_category, day_of_week, hour, month]], columns=features)
    demand = max(0, float(model.predict(X)[0]))
 
    if hour in [19, 20, 21]:
        demand += 4
    elif hour in [12, 13, 22]:
        demand += 2

    if day_of_week in [4, 5, 6]:  # Fri, Sat, Sun
        demand += 2

    if demand < 3:
        level  = "Low"
        advice = "Tables easily available — walk-ins welcome"
    elif demand < 6:
        level  = "Medium"
        advice = "Moderate demand — book in advance recommended"
    else:
        level  = "High"
        advice = "Very limited availability — book immediately"
 
    size_map = {0: "Small (1-2 pax)", 1: "Medium (3-4 pax)", 2: "Large (5+ pax)"}
 
    return {
        "table_size":          size_map.get(table_category, "Unknown"),
        "demand_count":        round(demand, 1),
        "demand_level":        level,
        "availability_advice": advice,
    }

# ─── 5. Sentiment Analysis on Reviews ────────────────────────
# Algorithm: VADER (Valence Aware Dictionary and sEntiment Reasoner)
# No training needed — pre-built sentiment lexicon
# pip install vaderSentiment

def analyze_sentiment(review_text: str) -> Dict:
   
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
    except ImportError:
        return {
            "label": "Neutral",
            "score": 0.0,
            "emoji": "😐",
            "detail": "Install vaderSentiment: pip install vaderSentiment"
        }

    scores = analyzer.polarity_scores(review_text)
    compound = scores["compound"]  

    if compound >= 0.3:
        label = "Positive"
        emoji = "😊"
    elif compound <= -0.1:
        label = "Negative"
        emoji = "😞"
    else:
        label = "Neutral"
        emoji = "😐"

    return {
        "label":    label,
        "score":    round(compound, 3),
        "emoji":    emoji,
        "positive": round(scores["pos"] * 100, 1),
        "neutral":  round(scores["neu"] * 100, 1),
        "negative": round(scores["neg"] * 100, 1),
    }


def analyze_reviews_bulk(reviews: List[str]) -> Dict:
    """
    Analyzes a list of review texts and returns summary stats.
    Used by Admin Reports page to show sentiment pie chart.
    Returns: counts and percentages for Positive/Neutral/Negative
    """
    if not reviews:
        return {
            "total":            0,
            "positive_count":   0,
            "neutral_count":    0,
            "negative_count":   0,
            "positive_percent": 0,
            "neutral_percent":  0,
            "negative_percent": 0,
            "overall":          "No reviews yet",
            "overall_emoji":    "😐",
        }

    results   = [analyze_sentiment(r) for r in reviews]
    total     = len(results)
    positive  = sum(1 for r in results if r["label"] == "Positive")
    neutral   = sum(1 for r in results if r["label"] == "Neutral")
    negative  = sum(1 for r in results if r["label"] == "Negative")

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
        "overall_emoji":    overall_emoji,
    }


# ─── 6. Cancellation Risk Prediction ─────────────────────────
# Algorithm: Random Forest Classifier
# Same as no-show model but trained on cancelled status
# Training script: ai/training/train_cancel_model.py

def predict_cancellation(hour: int, day_of_week: int, month: int, guests: int) -> Dict:

    data = _load("cancel", "ai/models/cancel_model.pkl")

    if data is None:
        risk_score = 0
        if day_of_week in [5, 6]:   # weekend
            risk_score += 1
        if guests >= 6:              # large groups cancel more
            risk_score += 1
        if month in [12, 1, 2]:     # holiday months
            risk_score += 1

        if risk_score == 0:
            risk  = "Low"
            prob  = 0.12
        elif risk_score == 1:
            risk  = "Medium"
            prob  = 0.35
        else:
            risk  = "High"
            prob  = 0.58

        return {
            "risk_level":     risk,
            "probability":    prob,
            "recommendation": "Monitor this booking" if risk != "Low" else "Booking looks stable",
            "model_used":     "rule_based_fallback",
        }

    model    = data["model"]
    features = data["features"]

    X    = pd.DataFrame([[hour, day_of_week, month, guests]], columns=features)
    prob = model.predict_proba(X)[0][1]

    if prob < 0.25:
        risk = "Low"
    elif prob < 0.5:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "risk_level":     risk,
        "probability":    round(float(prob), 3),
        "recommendation": "Monitor this booking" if prob > 0.3 else "Booking looks stable",
        "model_used":     "random_forest",
    }
