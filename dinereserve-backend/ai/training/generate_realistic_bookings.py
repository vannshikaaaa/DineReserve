import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
load_dotenv()

MONGO_URL   = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "dinereserve")

STATUSES = ["completed"] * 75 + ["no_show"] * 18 + ["cancelled"] * 12

HOURS = (
    [12, 13, 14] * 10 +   
    [19, 20, 21] * 35 +   
    [18, 22]     *  8 +   
    [15, 16, 17] *  5     
    )
GUEST_SIZES = [2, 2, 2, 4, 4, 4, 4, 6, 6, 8]
NOTES_POOL = [
    "", "", "", "",
    "Window seat please",
    "Birthday celebration",
    "Anniversary dinner",
    "Vegetarian guests",
    "High chair needed",
    "Quiet table preferred",
    "Corporate dinner",
    "Allergic to nuts",
]
async def generate(db, how_many: int = 800):
    print("=" * 55)
    print("  Generating realistic bookings from MongoDB data")
    print("=" * 55)

    restaurants= await db.restaurants.find({}).to_list(length=None)
    tables= await db.tables.find({}).to_list(length=None)
    customers= await db.customers.find({}).to_list(length=None)
    if not restaurants:
        print("\n  ERROR: No restaurants in MongoDB.")
        return
    if not tables:
        print("\n  ERROR: No tables in MongoDB.")
        return
    if not customers:
        print("\n  ERROR: No customers in MongoDB.")
        return

    print(f"\n  Restaurants found : {len(restaurants)}")
    print(f"  Tables found      : {len(tables)}")
    print(f"  Customers found   : {len(customers)}")

    restaurant_ids = [str(r["_id"]) for r in restaurants]
    customer_ids   = [str(c["_id"]) for c in customers]
    tables_by_restaurant = {}
    for t in tables:
        rid = str(t.get("restaurant_id", ""))
        tables_by_restaurant.setdefault(rid, []).append(str(t["_id"]))

    existing = await db.bookings.count_documents({})
    to_insert = max(0, how_many - existing)

    if to_insert == 0:
        print(f"\n  Already have {existing} bookings. Nothing to insert.")
        print(f"  Delete some or increase how_many if you want more.")
        return

    print(f"\n  Existing bookings : {existing}")
    print(f"  Will insert       : {to_insert}")

    bookings = []
    today    = datetime.today()

    for _ in range(to_insert):
        rid = random.choice(restaurant_ids)
        valid_tables = tables_by_restaurant.get(rid, [str(t["_id"]) for t in tables])
        table_id     = random.choice(valid_tables)

        days_ago  = random.randint(1, 548)
        book_date = today - timedelta(days=days_ago)
        weekday   = book_date.weekday()

        hour = random.choice(HOURS)

        guests = random.choice(GUEST_SIZES)
        is_weekend = weekday >= 5
        is_evening = hour >= 18

        if guests >= 6 and is_weekend:
            status = random.choices(
                ["completed", "no_show", "cancelled"],
                weights=[60, 20, 20]
            )[0]
        elif is_evening and is_weekend:
            status = random.choices(
                ["completed", "no_show", "cancelled"],
                weights=[65, 22, 13]
            )[0]
        elif not is_evening:
            status = random.choices(
                ["completed", "no_show", "cancelled"],
                weights=[80, 12, 8]
            )[0]
        else:
            status = random.choices(
                ["completed", "no_show", "cancelled"],
                weights=[70, 18, 12]
            )[0]

        time_str = f"{hour:02d}:00"
        bookings.append({
            "restaurant_id": rid,
            "table_id":      table_id,
            "customer_id":   random.choice(customer_ids),
            "date":          book_date.strftime("%Y-%m-%d"),
            "time":          time_str,
            "guests":        guests,
            "status":        status,
            "notes":         random.choice(NOTES_POOL),
        })

    await db.bookings.insert_many(bookings)

    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    status_counts = {
        doc["_id"]: doc["count"]
        async for doc in db.bookings.aggregate(pipeline)
    }

    print(f"\n  Inserted {to_insert} bookings successfully.")
    print(f"  Status breakdown (all bookings): {status_counts}")
    print("\n" + "=" * 55)
    print("  Done! Now run:")
    print("  python ai/training/dataset_builder.py")
    print("=" * 55)


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DATABASE_NAME]
    try:
        await generate(db, how_many=800)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())