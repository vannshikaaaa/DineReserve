import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime
load_dotenv()
MONGO_URL   = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dinereserve")

def get_weekday(date_str: str) -> int:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").weekday()
    except Exception:
        return -1


def get_month(date_str: str) -> int:
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").month
    except Exception:
        return -1

def parse_hour(time_val) -> int:
    try:
        s = str(time_val).strip()
        if ":" in s:
            return int(s.split(":")[0])
        return int(float(s))
    except Exception:
        return 12

async def build_bookings_dataset(db) -> int:
    print("\n[1/2] Building bookings dataset...")
    bookings = await db.bookings.find({}).to_list(length=None)

    if not bookings:
        print("  WARNING: No bookings found.")
        pd.DataFrame().to_csv("ai/datasets/bookings_dataset.csv", index=False)
        return 0

    rows = []
    skipped = 0

    for b in bookings:
        date_str = b.get("date", "")
        day_of_week = get_weekday(date_str)
        month       = get_month(date_str)

        if day_of_week == -1 or month == -1:
            skipped += 1
            continue

        try:
            hour = parse_hour(b.get("time", 12))
        except (ValueError, TypeError):
            hour = 12

        rows.append({
            "restaurant_id": str(b.get("restaurant_id", "")),
            "table_id":      str(b.get("table_id", "")),
            "customer_id":   str(b.get("customer_id", "")),
            "date":          date_str,
            "hour":          hour,
            "day_of_week":   day_of_week,   
            "month":         month,
            "guests":        int(b.get("guests", 2)),
            "status":        b.get("status", "completed"),
            "notes":         b.get("notes", ""),
        })

    df = pd.DataFrame(rows)
    os.makedirs("ai/datasets", exist_ok=True)
    df.to_csv("ai/datasets/bookings_dataset.csv", index=False)

    print(f"  Saved  : ai/datasets/bookings_dataset.csv")
    print(f"  Rows   : {len(df)}  (skipped {skipped} malformed)")
    print(f"  Statuses: {df['status'].value_counts().to_dict()}")
    return len(df)

async def build_dish_dataset(db) -> int:
    print("\n[2/2] Building dish dataset...")

    menu_items, restaurants = await asyncio.gather(
        db.menu_items.find({}).to_list(length=None),
        db.restaurants.find({}).to_list(length=None),
    )

    if not menu_items:
        print("  WARNING: No menu items found.")
        pd.DataFrame().to_csv("ai/datasets/dish_dataset.csv", index=False)
        return 0

    rest_map = {str(r["_id"]): r for r in restaurants}
    rows = []
    for item in menu_items:
        rid  = str(item.get("restaurant_id", ""))
        rest = rest_map.get(rid, {})                  # {} if restaurant not found

        cuisine_list = rest.get("cuisine", [])         # e.g. ["Italian","Chinese"]
        food_pref    = rest.get("food_preference", []) # e.g. ["Veg"] or ["Non-Veg"]

        rows.append({
            "restaurant_id":   rid,
            "dish_name":       item.get("name", "").strip(),
            "description":     item.get("description", "").strip(),
            "cuisine_type":    ", ".join(cuisine_list) if cuisine_list else "Unknown",
            "food_preference": ", ".join(food_pref)    if food_pref    else "Veg",
            "restaurant_type": rest.get("restaurant_type", "Casual"),
            "order_count":     int(item.get("order_count", 10)),
        })

    df = pd.DataFrame(rows)
    before = len(df)
    df = df[df["dish_name"].str.strip().astype(bool)].reset_index(drop=True)
    dropped = before - len(df)
    if dropped:
        print(f"  Dropped {dropped} rows with empty dish names.")

    os.makedirs("ai/datasets", exist_ok=True)
    df.to_csv("ai/datasets/dish_dataset.csv", index=False)

    print(f"  Saved  : ai/datasets/dish_dataset.csv")
    print(f"  Rows   : {len(df)}")
    return len(df)


async def main():
    print("=" * 55)
    print("  DineReserve — Dataset Builder")
    print("=" * 55)
    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DATABASE_NAME]
    try:
        bookings_count = await build_bookings_dataset(db)
        dish_count     = await build_dish_dataset(db)
        print("\n" + "=" * 55)
        print("  DONE")
        print(f"  bookings_dataset.csv : {bookings_count} rows")
        print(f"  dish_dataset.csv     : {dish_count} rows")
        print("=" * 55)
        if bookings_count < 200:
            print("\n  TIP: Run generate_realistic_bookings.py first")
            print("  for better model accuracy.\n")
    finally:
        client.close()
        
if __name__ == "__main__":
    asyncio.run(main())