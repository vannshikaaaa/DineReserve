from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import httpx
import os
from app.database import restaurants_collection, menu_collection
import traceback
router = APIRouter(prefix="/api/chat", tags=["Chatbot"])
BASE_SYSTEM_PROMPT = """You are DineBot, a friendly and knowledgeable restaurant assistant for DineReserve — a restaurant reservation platform.
You help customers with:
- Finding the right restaurant based on cuisine, budget, group size, or mood
- Explaining how to book a table on DineReserve
- Answering questions about peak hours and best times to visit
- Suggesting dishes based on preferences (Veg / Non-Veg, cuisine type)
- Explaining cancellation and no-show policies
- General dining etiquette and tips

{restaurant_info}

How to book a table on DineReserve:
- Register or login at the app
- Browse restaurants on the Home page
- Click View Details on any restaurant
- Select date, time and number of guests
- Choose an available table
- Confirm your booking

Peak hours are generally 7PM to 9PM on weekdays and all evening on weekends.
Morning slots (10AM to 1PM) are usually very available with low demand.
Evening slots (7PM to 10PM) on weekends have high demand — book in advance.

Keep responses concise, warm and helpful. Use emojis occasionally to be friendly.
Never make up information. If unsure, suggest the customer browse the DineReserve app.
Do not discuss topics unrelated to dining, restaurants or food.
Keep all responses under 120 words — short and to the point."""


async def build_system_prompt() -> str:
    """Fetch all restaurants and their menus from DB dynamically."""
    try:
        restaurants = await restaurants_collection.find({}).to_list(length=None)

        if not restaurants:
            return BASE_SYSTEM_PROMPT.format(
                restaurant_info="No restaurants currently available on DineReserve."
            )

        lines = ["Restaurants currently available on DineReserve:"]

        for i, r in enumerate(restaurants, 1):
            name        = r.get("name", "Unknown")
            cuisine     = ", ".join(r.get("cuisine", [])) if r.get("cuisine") else "Various"
            r_type      = r.get("restaurant_type", "Casual Dining")
            rating      = r.get("rating", "N/A")
            price_range = r.get("price_range", "")
            food_pref   = ", ".join(r.get("food_preference", [])) if r.get("food_preference") else ""
            capacity    = r.get("max_capacity", "")
            description = r.get("description", "")

            info = f"{i}. {name} — {cuisine}, {r_type}"
            if price_range:
                info += f", {price_range}"
            if rating:
                info += f", rating {rating}"
            if capacity:
                info += f", max {capacity} guests"
            if food_pref:
                info += f"\n   Food preference: {food_pref}"
            if description:
                # Only first 80 characters of description
                short_desc = description[:80].strip()
                info += f"\n   About: {short_desc}..."

            # Fetch menu items for this restaurant
            menu_items = await menu_collection.find(
                {"restaurant_id": str(r["_id"])}
            ).to_list(length=None)

            if menu_items:
                names = [m.get("name", "") for m in menu_items if m.get("name")]
                if names:
                    info += f"\n   Menu highlights: {', '.join(names[:5])}"

            lines.append(info)

        restaurant_info = "\n".join(lines)
        return BASE_SYSTEM_PROMPT.format(restaurant_info=restaurant_info)

    except Exception as e:
        print(f"Error building system prompt: {traceback.format_exc()}")
        return BASE_SYSTEM_PROMPT.format(
            restaurant_info="Visit DineReserve to see all available restaurants."
        )
    

class Message(BaseModel):
    role:    str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


@router.post("/message")
async def chat(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY not set in environment variables"
        )

    # Build dynamic system prompt with live data
    system_prompt = await build_system_prompt()

    messages_payload = [{"role": "system", "content": system_prompt}]
    for m in req.messages:
        messages_payload.append({
            "role":    m.role,
            "content": m.content
        })

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages":    messages_payload,
                    "max_tokens":  200,
                    "temperature": 0.7,
                }
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Groq API error: {response.text}"
                )

            data  = response.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Request timed out. Please try again."
        )
    except Exception as e:
        print(f"CHAT ERROR: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))